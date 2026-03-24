import json
import re

# -----------------------------
# 슬러그 생성 함수
# -----------------------------
def create_slug(title, isbn):
    if not title:
        return None
    
    # 특수 문자 제거
    slug_text = re.sub(r"[^0-9a-zA-Z가-힣\s]", "", title)

    # 띄어쓰기는 '-'으로 대체
    slug_text = re.sub(r"\s+", "-", slug_text.strip())

    # VARCHAR(255): isbn 글자수 고려해 230자까지만 슬라이싱
    slug_text = slug_text[:230]

    # '제목-isbn' 슬러그 반환
    return f"{slug_text}-{isbn}"


# -----------------------------
# description 전처리 함수
# -----------------------------
def clean_description(text):
    # 입력값이 None이거나 빈 문자열이면 None 반환
    if not text:
        return None

    # <br>, <br/>, <br /> 태그를 줄바꿈(\n)으로 변환 (대소문자 무시)
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.IGNORECASE)

    # 모든 HTML 태그 제거 (<...> 형태)
    text = re.sub(r"<.*?>", "", text)

    # HTML 공백 엔티티(&nbsp;)를 일반 공백으로 변환
    text = text.replace("&nbsp;", " ")

    # 여러 개의 공백(스페이스, 탭, 줄바꿈 등)을 하나의 공백으로 압축
    text = re.sub(r"\s+", " ", text)

    # 문자열 양쪽 공백 제거 후 반환
    return text.strip()


# -----------------------------
# json 파싱 함수
# -----------------------------
def safe_json_loads(text):
    try:
        # 일반적인 JSON 파싱 시도
        # strict=False → 제어 문자 등 일부 비표준 JSON도 허용
        return json.loads(text, strict=False)

    except json.JSONDecodeError:
        # JSON 파싱 실패 시, 문제를 일으킬 수 있는 제어 문자 제거
        # \x00 ~ \x1f 중에서 허용되지 않는 문자들 제거
        cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", text)

        # 정제된 문자열로 다시 JSON 파싱 시도
        return json.loads(cleaned, strict=False)
