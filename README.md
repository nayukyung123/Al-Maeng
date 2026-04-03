# AL-MAENG (알맹)

> 영화·드라마로 찾는 나만의 책 — 콘텐츠 기반 도서 추천 서비스

영화나 드라마를 고르듯 책을 고를 수 있도록, 영상 콘텐츠의 분위기·장르·키워드를 분석해 딱 맞는 도서를 추천합니다.  
완독한 책을 '티켓'으로 기록하고, 나만의 취향 리포트를 통해 독서 여정을 돌아볼 수 있습니다.

![Java](https://img.shields.io/badge/Java-17-orange) ![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.11-6DB33F) ![JPA](https://img.shields.io/badge/JPA-Hibernate-59666C) ![JWT](https://img.shields.io/badge/Auth-JWT-blue) ![Next.js](https://img.shields.io/badge/Next.js-16.1.6-000000) ![React](https://img.shields.io/badge/React-19-61DAFB) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6) ![Tailwind](https://img.shields.io/badge/TailwindCSS-4-06b6d4) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+pgvector-336791) ![Redis](https://img.shields.io/badge/Redis-alpine-DC382D) ![Docker](https://img.shields.io/badge/Docker-Compose-2496ED) ![Jenkins](https://img.shields.io/badge/CI%2FCD-Jenkins-D24939)

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| 콘텐츠 기반 도서 추천 | 영화·드라마를 선택하면 pgvector 유사도 검색으로 어울리는 책 추천 |
| 취향 큐레이션 | 회원가입 시 선호 장르 태깅 → 홈 맞춤 추천 리스트 실시간 제공 |
| 도서 랭킹 | 완독순 / 찜한순 / 조회순 실시간 랭킹 보드 |
| 완독 & 리뷰 | 완독 도서 등록, 리뷰 작성·수정·삭제(스포일러 가리기 지원) |
| 독서 티켓 | 완독 기록을 카드 형태의 커스텀 티켓으로 발급·저장·이미지 다운로드 |
| 취향 리포트 | 원형·레이더 차트로 장르 취향 시각화 |
| 찜 목록 | 관심 도서 저장 및 외부 구매처(알라딘) 연결 |
| 소셜 로그인 | Google / Kakao / Naver OAuth 지원 |

---

## 기술 스택

### Backend
- Java 17, Spring Boot 3.5.11
- Spring Security + JWT
- Spring Data JPA + Flyway
- PostgreSQL 16 + **pgvector** (벡터 유사도 검색)
- Redis (캐시)
- AWS S3 (이미지 저장)

### Frontend
- Next.js 16.1.6 (App Router), React 19
- TypeScript, Tailwind CSS v4, shadcn/ui
- Zustand (상태 관리), TanStack Query, Recharts
- Framer Motion

### Infra
- Docker / Docker Compose
- Nginx (리버스 프록시, HTTPS)
- Jenkins (CI/CD)
- SonarQube (정적 분석)

---

## 아키텍처
브라우저
```
└─ Nginx (80/443)
├─ /api → Spring Boot :8080
└─ / → Next.js :3000

Spring Boot ─── PostgreSQL 16 + pgvector
└── Redis
└── AWS S3
```


---

## 시작하기

### 사전 요구사항
```
| 항목 | 버전 |
|------|------|
| Docker Engine + Compose v2 | 최신 |
| JDK | 17 |
| Node.js | 20.x |
```
### 1. 저장소 클론

```
git clone <저장소_URL>
cd <프로젝트_디렉터리>
```


2. 환경 변수 설정
루트에 .env 파일을 생성하고 아래 값을 채웁니다.

```
# DB
DB_USERNAME=
DB_PASSWORD=
DB_NAME=

# OAuth
KAKAO_CLIENT_ID=
KAKAO_CLIENT_SECRET=
KAKAO_REDIRECT_URI=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
NAVER_REDIRECT_URI=

# JWT
JWT_SECRET=

# AWS S3
AWS_ACCESS_KEY=
AWS_SECRET_KEY=
S3_BUCKET_NAME=

# Frontend (빌드 타임 주입)
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
NEXT_PUBLIC_KAKAO_CLIENT_ID=
NEXT_PUBLIC_NAVER_CLIENT_ID=
```
전체 환경 변수 목록 및 설명은 exec/1_build_deploy.md, 
외부 서비스 설정은 exec/2_external_services.md 참고

3. 로컬 개발 실행
DB·Redis만 Docker로 기동:
```
docker compose -f docker-compose.local.yml up -d
```

백엔드:
```
cd backend
./gradlew bootRun
```
프론트엔드:
```
cd frontend
npm ci
npm run dev
```
브라우저에서 http://localhost:3000 접속

4. 프로덕션 배포
```
docker compose -f docker-compose.prod.yml up -d --build
```
Jenkins 자동 배포 파이프라인은 Jenkinsfile 참고

프로젝트 구조

```
├── backend/         # Spring Boot 애플리케이션
├── frontend/        # Next.js 애플리케이션
├── infra/
│   ├── nginx/       # Nginx 설정
│   ├── jenkins/     # Jenkins Docker 설정
│   └── sonarqube/   # SonarQube 설정
├── data/
│   ├── collectors/  # 알라딘·TMDB·KOFIC 데이터 수집 스크립트
│   └── processors/  # 데이터 가공 스크립트
├── exec/            # 빌드·배포·시연 가이드 문서
├── docker-compose.local.yml
└── docker-compose.prod.yml
```

포트 안내
```
서비스	호스트 포트	비고
Nginx	80 / 443	HTTP / HTTPS
PostgreSQL	5432	프로덕션
Backend	-	Nginx 경유 (/api)
Frontend	-	Nginx 경유 (/)
```
