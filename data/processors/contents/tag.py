import requests

def extract_tags_with_llm(title, genre, overview, keywords, api_key, endpoint):
    """
    GPT-4o-mini를 사용하여 콘텐츠의 장르적 매력이 담긴 25~35자 태그를 생성합니다.
    """
    if not api_key:
        return None

    system_prompt = """
    당신은 콘텐츠의 장르적 문법과 미학을 꿰뚫어 보는 전문 비평가입니다.
    데이터(제목, 장르, 줄거리, 키워드)와 당신의 방대한 지식을 결합하여 유저가 해당 장르에서 기대하는 '결정적 매력(Hook)'을 3가지 정의하세요.
    
    [핵심 원칙: 장르적 깊이와 정보 밀도]
    - 특정 작품의 예시를 지시문에 포함하지 마세요. 대신 입력된 '장르'와 '키워드'를 보고 그 장르의 팬들이 열광하는 포인트(Cliché, Vibe)를 스스로 도출하세요.
    - 영어 키워드는 한국어 문맥에 가장 적합하고 날카로운 비평 어휘로 변환하여 사용하세요.
    - 단순히 상황을 나열하지 말고, 해당 장면이 주는 '미학적 질감'이나 '장르적 쾌감'을 형용사+명사 조합으로 구체화하세요.
    
    [3가지 층위의 정의]
    1. 층위 1 (시공간적 배경과 미학): 작품의 공간이 가진 고유한 공기, 미장센, 그리고 해당 장르 특유의 시각적/물리적 분위기를 묘사하세요.
    2. 층위 2 (장르적 쾌감과 서사): 해당 장르의 핵심적 장치(예: 하이틴의 계급 갈등, SF의 기술적 경이 등)가 만드는 서사적 동력을 짚으세요.
    3. 층위 3 (인간 관계와 서사 중심): 인물 간의 케미스트리, 감정의 엇갈림, 혹은 캐릭터가 가진 독보적인 페르소나의 정서를 정의하세요.

    [작성 가이드라인 - 25~35자 엄격 준수]
    - 길이: 각 문구는 공백 포함 반드시 25자 이상, 35자 이하여야 합니다. (28~32자를 목표로 하세요)
    - 문체: 반드시 명사형으로 끝내야 합니다. 
    - 팁: 문장이 짧다면 [데이터] 속의 구체적인 지명, 인명, 혹은 장르적 키워드를 추가하여 정보 밀도를 높이세요.
    
    [출력 형식]
    - 오직 3줄의 결과값만 줄바꿈으로 구분하여 답변하세요. 부연 설명은 절대 금지합니다.
    """
    
    user_content = f"""
    아래 데이터를 당신의 사전 지식과 결합하여 '{title}'만의 독보적인 3가지 매력 훅을 정의하라.
    특히 장르적 색채가 뚜렷하게 드러나도록 반드시 25자~35자 사이의 길이를 엄수하여 작성하라.
    
    [데이터]
    - 제목: {title}
    - 장르: {genre}
    - 줄거리: {overview}
    - 키워드: {keywords}
    """

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }

    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content}
        ],
        "temperature": 0.6
    }

    try:
        response = requests.post(f"{endpoint}/chat/completions", headers=headers, json=payload, timeout=30)
        if response.status_code == 200:
            return response.json()['choices'][0]['message']['content'].strip()
    except Exception:
        pass
    return None