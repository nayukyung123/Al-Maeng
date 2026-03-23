import torch
import torch.nn.functional as F
from transformers import AutoTokenizer, AutoModel

# 콘텐츠 임베딩을 위한 로컬 모델 설정
MODEL_NAME = "Qwen/Qwen3-Embedding-0.6B"
TARGET_DIM = 1024
MAX_LENGTH = 800

# 모델 로딩
print("로컬 임베딩 모델 로딩 중...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModel.from_pretrained(
    MODEL_NAME,
    torch_dtype=torch.float16
).to("cuda")
model.eval()
print("모델 로딩 완료")

def last_token_pool(last_hidden_states: torch.Tensor, attention_mask: torch.Tensor) -> torch.Tensor:
    """
    Qwen 모델 전용: 마지막 유효 토큰의 hidden state를 문장 대표 벡터로 사용
    """
    if attention_mask[:, -1].sum().item() == attention_mask.shape[0]:
        return last_hidden_states[:, -1]

    sequence_lengths = attention_mask.sum(dim=1) - 1
    batch_size = last_hidden_states.shape[0]

    return last_hidden_states[torch.arange(batch_size, device=last_hidden_states.device), sequence_lengths]

def format_tag_text(tag_name):
    """
    태그 텍스트의 공백을 정리하고 포맷팅
    """
    return (tag_name or "").strip()

def get_embeddings(texts):
    """
    텍스트 리스트를 한 번에 임베딩하여 벡터 리스트를 반환
    """
    if not texts:
        return []

    formatted_texts = [format_tag_text(t) for t in texts]

    tokenized = tokenizer(
        formatted_texts,
        padding=True,
        truncation=True,
        max_length=MAX_LENGTH,
        return_tensors="pt",
    ).to("cuda")

    with torch.inference_mode():
        outputs = model(**tokenized)
        embeddings = last_token_pool(outputs.last_hidden_state, tokenized["attention_mask"])
        
        # 코사인 유사도 연산을 위한 L2 정규화
        embeddings = F.normalize(embeddings, p=2, dim=1)
        
        # 시스템 통합을 위해 1024차원으로 절단
        embeddings = embeddings[:, :TARGET_DIM]

    return embeddings.detach().cpu().tolist()