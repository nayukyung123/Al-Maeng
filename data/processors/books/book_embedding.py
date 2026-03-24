import json
import os
import time

import psycopg2
import torch
import torch.nn.functional as F
from dotenv import load_dotenv
from psycopg2.extras import execute_batch
from tqdm import tqdm
from transformers import AutoTokenizer, AutoModel

# -----------------------------
# 모델 로딩 설정
# -----------------------------
# Hugging Face에서 사용할 임베딩 모델 이름
MODEL_NAME = "Qwen/Qwen3-Embedding-0.6B"
# GPU에서 한 번에 처리할 텍스트 개수
BATCH_SIZE = 32

print("Loading model...")

# 문자열을 모델 입력 토큰으로 변환하는 토크나이저
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

# 실제 임베딩을 계산하는 모델
# float16으로 메모리 사용량을 줄이고, CUDA로 옮겨 GPU 추론을 사용한다.
model = AutoModel.from_pretrained(
    MODEL_NAME,
    torch_dtype=torch.float16
).to("cuda")

# 학습이 아니라 추론만 수행하므로 eval 모드로 전환
model.eval()

print("Model loaded")

# -----------------------------
# DB / 임베딩 생성 설정
# -----------------------------
# pgvector 컬럼에 저장할 최종 벡터 차원
TARGET_DIM = 1024
# DB에서 아직 처리되지 않은 책을 한 번에 가져오는 개수
DB_FETCH_SIZE = 200
# 입력 텍스트가 너무 길어지지 않도록 자를 최대 토큰 길이
MAX_LENGTH = 800

# .env 파일에 저장된 DB 환경 변수를 현재 프로세스에 로드
load_dotenv()


def get_db_connection():
    # 환경 변수에 정의된 PostgreSQL 접속 정보로 연결을 만든다.
    return psycopg2.connect(
        host=os.environ.get("DB_HOST"),
        dbname=os.environ.get("DB_NAME"),
        user=os.environ.get("DB_USER"),
        password=os.environ.get("DB_PASSWORD"),
        port=os.environ.get("DB_PORT"),
    )


def last_token_pool(last_hidden_states: torch.Tensor, attention_mask: torch.Tensor) -> torch.Tensor:
    # Qwen 계열 임베딩 모델은 마지막 "유효 토큰"의 hidden state를
    # 문장 전체를 대표하는 벡터로 사용하는 방식이 잘 맞는다.
    #
    # 모든 문장의 마지막 위치가 유효 토큰(= attention mask가 1)이라면
    # 단순히 마지막 토큰을 바로 꺼내면 된다.
    if attention_mask[:, -1].sum().item() == attention_mask.shape[0]:
        return last_hidden_states[:, -1]

    # 문장 길이가 서로 다르면 attention mask 합계를 이용해
    # 각 문장의 실제 마지막 토큰 위치를 계산한다.
    sequence_lengths = attention_mask.sum(dim=1) - 1
    batch_size = last_hidden_states.shape[0]

    # 각 샘플별 "마지막 유효 토큰"의 hidden state만 골라 반환
    return last_hidden_states[torch.arange(batch_size, device=last_hidden_states.device), sequence_lengths]


def format_book_text(title, description):
    # None 값이 들어와도 안전하게 문자열로 처리하고 공백을 정리한다.
    title = (title or "").strip()
    description = (description or "").strip()

    # 제목과 설명을 고정 형식으로 합쳐 모델에 전달한다.
    # 필드 이름을 포함해 주면 모델이 텍스트 구조를 더 잘 해석할 수 있다.
    return f"title: {title}\ndescription: {description}"


def vector_to_pgvector(vector):
    # pgvector는 '[0.1,0.2,...]' 형태의 문자열을 vector 타입으로 캐스팅할 수 있으므로
    # Python 리스트를 DB 저장용 문자열 포맷으로 변환한다.
    return "[" + ",".join(f"{float(value):.8f}" for value in vector) + "]"


def fetch_target_rows(cur, limit):
    # 아직 임베딩이 없는 책만 ID 순으로 limit 개수만큼 가져온다.
    # ORDER BY id를 두어 재실행 시에도 처리 순서가 일관되게 유지된다.
    cur.execute(
        """
        SELECT id, title, description
        FROM books
        WHERE embedding_vector IS NULL
        ORDER BY id
        LIMIT %s
        """,
        (limit,),
    )
    return cur.fetchall()


def count_remaining_rows(cur):
    # 전체 남은 작업량을 확인할 때 사용하는 카운트 쿼리
    cur.execute(
        """
        SELECT COUNT(*)
        FROM books
        WHERE embedding_vector IS NULL
        """
    )
    return cur.fetchone()[0]


def encode_batch(texts):
    # 여러 텍스트를 한 번에 토큰화한다.
    # padding=True: 배치 내 길이를 맞춤
    # truncation=True: MAX_LENGTH를 넘는 입력은 잘라냄
    tokenized = tokenizer(
        texts,
        padding=True,
        truncation=True,
        max_length=MAX_LENGTH,
        return_tensors="pt",
    )

    # attention_mask의 합은 각 샘플이 실제로 사용한 토큰 수와 같다.
    token_lengths = tokenized["attention_mask"].sum(dim=1).tolist()

    # 모델이 GPU에 있으므로 입력 텐서도 같은 장치로 이동
    tokenized = {key: value.to("cuda") for key, value in tokenized.items()}

    # 추론만 수행하므로 gradient를 비활성화해 메모리와 계산량을 줄인다.
    with torch.inference_mode():
        outputs = model(**tokenized)

        # 마지막 hidden state에서 문장 대표 벡터를 추출
        embeddings = last_token_pool(outputs.last_hidden_state, tokenized["attention_mask"])

        # 벡터 길이를 1로 맞춰 코사인 유사도 기반 비교에 유리하게 만든다.
        embeddings = F.normalize(embeddings, p=2, dim=1)

    # DB 스키마에 맞게 필요한 차원만 사용
    embeddings = embeddings[:, :TARGET_DIM]

    # psycopg2에 전달하기 쉬운 Python 리스트 형태와
    # 배치 길이 통계를 함께 반환한다.
    return embeddings.detach().cpu().tolist(), token_lengths


def main():
    print("Connecting DB...")
    conn = get_db_connection()

    # 배치 처리 후 직접 commit 하기 위해 autocommit 비활성화
    conn.autocommit = False

    # 전체 처리 건수를 누적해서 진행 상황 로그에 사용
    total_processed = 0

    try:
        with conn.cursor() as cur:
            # 시작 시점에 임베딩이 비어 있는 책이 몇 권 남았는지 확인
            initial_remaining = count_remaining_rows(cur)
            print(f"Books remaining before start: {initial_remaining}")

            while True:
                chunk_started_at = time.perf_counter()

                # 아직 처리되지 않은 책을 chunk 단위로 가져온다.
                rows = fetch_target_rows(cur, DB_FETCH_SIZE)
                if not rows:
                    break

                # 현재 chunk를 BATCH_SIZE 기준으로 몇 번에 나눠 처리할지 계산
                batch_count = (len(rows) + BATCH_SIZE - 1) // BATCH_SIZE
                remaining_before_chunk = count_remaining_rows(cur)
                print(
                    f"\nFetched {len(rows)} books from DB "
                    f"(remaining before this chunk: {remaining_before_chunk})"
                )

                for batch_index, offset in enumerate(
                    # tqdm으로 현재 chunk 안에서의 진행률 표시
                    tqdm(range(0, len(rows), BATCH_SIZE), desc="Embedding batches"),
                    start=1,
                ):
                    batch_rows = rows[offset:offset + BATCH_SIZE]

                    # DB에서 가져온 title/description을 모델 입력 문자열로 변환
                    texts = [
                        format_book_text(title, description)
                        for _, title, description in batch_rows
                    ]

                    # 배치 단위로 임베딩 생성
                    encode_started_at = time.perf_counter()
                    embeddings, token_lengths = encode_batch(texts)
                    encode_elapsed = time.perf_counter() - encode_started_at

                    # DB 컬럼 차원과 다르면 즉시 실패시켜 잘못된 저장을 방지
                    if len(embeddings[0]) != TARGET_DIM:
                        raise ValueError(
                            f"Expected {TARGET_DIM}-dim embeddings, got {len(embeddings[0])}"
                        )

                    # 각 책 ID에 대해 pgvector 문자열과 함께 UPDATE용 데이터 준비
                    updates = [
                        (vector_to_pgvector(embedding), book_id)
                        for (book_id, _, _), embedding in zip(batch_rows, embeddings)
                    ]

                    # 여러 UPDATE를 묶어서 실행해 DB round trip을 줄인다.
                    db_write_started_at = time.perf_counter()
                    execute_batch(
                        cur,
                        """
                        UPDATE books
                        SET embedding_vector = %s::vector
                        WHERE id = %s
                        """,
                        updates,
                        page_size=BATCH_SIZE,
                    )
                    db_write_elapsed = time.perf_counter() - db_write_started_at

                    # 한 배치가 끝날 때마다 commit 해서 작업 단위를 명확히 끊는다.
                    commit_started_at = time.perf_counter()
                    conn.commit()
                    commit_elapsed = time.perf_counter() - commit_started_at
                    total_processed += len(batch_rows)
                    remaining_after_batch = max(initial_remaining - total_processed, 0)

                    # tqdm.write를 쓰면 진행 바를 깨뜨리지 않고 로그를 출력할 수 있다.
                    tqdm.write(
                        f"Processed batch {batch_index}/{batch_count} | "
                        f"batch size: {len(batch_rows)} | "
                        f"tokens(min/avg/max): "
                        f"{min(token_lengths)}/{sum(token_lengths) / len(token_lengths):.1f}/{max(token_lengths)} | "
                        f"encode: {encode_elapsed:.2f}s | "
                        f"db write: {db_write_elapsed:.2f}s | "
                        f"commit: {commit_elapsed:.2f}s | "
                        f"total processed: {total_processed} | "
                        f"estimated remaining: {remaining_after_batch}"
                    )

                chunk_elapsed = time.perf_counter() - chunk_started_at
                print(f"Chunk finished in {chunk_elapsed:.2f}s")

        print(f"Done. Processed {total_processed} books")
    finally:
        # 예외 발생 여부와 무관하게 연결은 반드시 닫는다.
        conn.close()
        print("DB connection closed")


if __name__ == "__main__":
    # 이 파일을 직접 실행한 경우에만 메인 로직 시작
    main()