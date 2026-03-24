import os
from dotenv import load_dotenv

load_dotenv()

# -----------------------------
# API 키 호출
# -----------------------------
API_KEY = os.environ.get("ALADIN_API_KEY")
if not API_KEY:
    raise RuntimeError("ALADIN_API_KEY environment variable not set")


# -----------------------------
# 크롤링 우회
# -----------------------------
HEADERS = {
    "User-Agent": "Mozilla/5.0",
}

# -----------------------------
# 수집할 장르 정의
# -----------------------------
GENRES = {
    "경제경영": 170,
    "과학": 987,
    "사회과학": 798,
    "소설/시/희곡": 1,
    "에세이": 55889,
    "여행": 1196,
    "역사": 74,
    "예술/대중문화": 517,
    "인문학": 656,
    "자기계발": 336
}

# -----------------------------
# 멀티 프로세싱: API 동시 요청 횟수 제한
# -----------------------------
MAX_CONCURRENT_API = 5