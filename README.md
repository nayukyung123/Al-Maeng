# 🍎 AL-MAENG (알맹이)

> **영상 콘텐츠를 매개로 한 맞춤형 도서 추천 및 완독 관리 서비스**

영화·드라마 등 익숙한 영상 콘텐츠를 입구로 삼아 독서 진입 장벽을 낮추고,<br>
'텍스트 힙(Text Hip)' 문화를 지향하는 사용자들에게 데이터 기반의 도서 추천과 완독 경험을 제공합니다.

![Java](https://img.shields.io/badge/Java-17-orange) ![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.11-6DB33F) ![JPA](https://img.shields.io/badge/JPA-Hibernate-59666C) ![JWT](https://img.shields.io/badge/Auth-JWT-blue) ![Next.js](https://img.shields.io/badge/Next.js-16.1.6-000000) ![React](https://img.shields.io/badge/React-19-61DAFB) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6) ![Tailwind](https://img.shields.io/badge/TailwindCSS-4-06b6d4) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+pgvector-336791) ![Redis](https://img.shields.io/badge/Redis-alpine-DC382D) ![Docker](https://img.shields.io/badge/Docker-Compose-2496ED) ![Jenkins](https://img.shields.io/badge/CI%2FCD-Jenkins-D24939)

---

## 📸 서비스 화면

| 홈 배너 | 영상 기반 추천 결과 |
|:---:|:---:|
| ![홈 배너](exec/images/04-1_banner.png) | ![추천 결과](exec/images/04-2_result.png) |

| 도서 추천 | 랭킹 보드 |
|:---:|:---:|
| ![도서 추천](exec/images/05_recommendation.png) | ![랭킹 보드](exec/images/06_ranking.png) |

| 티켓 갤러리 | 취향 리포트 |
|:---:|:---:|
| ![티켓 갤러리](exec/images/19_user_gallery.png) | ![취향 리포트](exec/images/23_user_reports.png) |


---

## 📌 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [주요 기능](#2-주요-기능-mvp-기준)
3. [기술 스택](#3-기술-스택-tech-stack)
4. [시스템 아키텍처 및 ERD](#4-시스템-아키텍처-및-erd)
5. [기술적 고려사항](#5-기술적-고려사항-technical-challenges)
6. [활용 데이터](#6-활용-데이터-data-assets)
7. [Quick Start (로컬 실행)](#7-quick-start-로컬-실행)
8. [팀 구성 및 역할](#8-팀-구성-및-역할)

---

## 1. 프로젝트 개요

- **목표**: 영화·드라마 등 익숙한 영상 콘텐츠를 입구로 삼아 독서 진입 장벽을 낮추고, '텍스트 힙(Text Hip)' 문화를 지향하는 사용자들에게 데이터 기반의 도서 추천과 완독 경험을 제공합니다.
- **핵심 가치**:
  - 🎬 취향 기반의 도서 큐레이션 (영상 → 도서)
  - 🎫 시각화된 완독 인증 (커스텀 티켓 / 바인더)
  - 📊 데이터 중심의 취향 리포트 (레이더 차트 / 통계)

---

## 2. 주요 기능 (MVP 기준)

### 🔍 추천 시스템

- **콘텐츠 기반 도서 추천**: OpenAI 및 Hugging Face(Qwen3-Embedding)를 활용하여 영상 콘텐츠와 도서 간의 연관성(태그, 장르, 서사)을 분석하고 유사도 기반 추천을 제공합니다.
- **개인화 큐레이션**: 회원가입 시 선택한 취향 데이터 및 서비스 이용 로그를 바탕으로 '오늘의 추천' 리스트를 생성합니다.
- **통합 검색**: 도서·콘텐츠 통합 검색 및 실시간 인기 검색어 랭킹 제공.

### 📚 도서 관리

- **찜 목록**: 관심 도서를 저장하고 알라딘 외부 구매처와 연결.
- **완독 기록**: 완독한 도서를 서재에 쌓고 리뷰(스포일러 블라인드 지원) 작성.

### 🎫 티켓 바인더

- **커스텀 티켓 생성**: 완독한 도서를 디지털 티켓 형태로 생성—폰트, 방향(세로/가로), 날짜 등 개인화 편집 지원.
- **이미지 다운로드**: 생성된 티켓을 이미지로 저장.
- **바인더 갤러리**: 티켓을 갤러리/바인더 뷰로 장르별 분류 관리.

### 👤 마이페이지

- **취향 리포트**: 독서 이력을 분석한 선호 장르·독서 패턴 레이더 차트 및 영수증 형태 시각화.
- **티어 시스템**: 완독 권수에 따른 사용자 등급(티어) 부여.
- **소셜 로그인**: 카카오 · 구글 · 네이버 OAuth 지원.

---

## 3. 기술 스택 (Tech Stack)

### Frontend

| 항목 | 내용 |
|------|------|
| Framework | Next.js 16.1.6 (SSR/SSG) |
| UI Library | React 19.2.3 |
| 상태 관리 | Zustand 5 |
| 데이터 패칭 | TanStack React Query v5 |
| 애니메이션 | Framer Motion 12 |
| HTTP 클라이언트 | Axios |
| UI 컴포넌트 | shadcn/ui, Radix UI, Recharts |
| 스타일링 | Tailwind CSS v4 |

### Backend

| 항목 | 내용 |
|------|------|
| Framework | Spring Boot 3.5.11 |
| Language | Java 17 |
| 빌드 도구 | Gradle 8.14.4 |
| 인증 | Spring Security + JWT + OAuth2 (카카오/구글/네이버) |
| 스키마 관리 | Flyway |
| 캐시 | Redis (redis:alpine) |

### Database

| 항목 | 내용 |
|------|------|
| RDBMS | PostgreSQL 16 (`pgvector/pgvector:pg16`) |
| Vector 확장 | pgvector (임베딩 벡터 저장 및 유사도 검색) |

### AI / Data

| 항목 | 내용 |
|------|------|
| 임베딩 모델 | Qwen3-Embedding (Hugging Face, 로컬 GPU 가공) |
| LLM | GPT-4o-mini (OpenAI) — 큐레이션 텍스트 생성 |
| 데이터 수집 | Python 배치 스크립트 (알라딘, TMDB, KOFIC API + 크롤링) |

### Infra / DevOps

| 항목 | 내용 |
|------|------|
| 클라우드 | AWS EC2 |
| 스토리지 | AWS S3 (Presigned URL, 티켓·프로필 이미지) |
| 컨테이너 | Docker + Docker Compose |
| 리버스 프록시 | Nginx (Alpine) + Let's Encrypt SSL |
| CI/CD | Jenkins (`Jenkinsfile`) + GitLab |
| 코드 품질 | SonarQube (Gradle Sonar 플러그인) |
| 개발 알림 | Mattermost 인커밍 웹훅 |

---

## 4. 시스템 아키텍처

![System Architecture](exec/images/SystemArchitecture.png)


---

## 5. 기술적 고려사항 (Technical Challenges)

### 1) 데이터 파이프라인 및 적재 최적화 (Data Engineering)

대규모 도서/콘텐츠 데이터(약 11만 권) 적재 시 발생하는 인프라 병목을 해결했습니다.

- **Deadlock 해결**: SSH 터널링을 통한 원격 DB 직접 적재 시 네트워크 지연으로 인한 트랜잭션 경합 발생 → **EC2 내 로컬 실행 및 TSV Bulk Import 방식**으로 전환하여 안정성 확보.
- **임베딩 가공 효율화**: GPU가 없는 EC2의 한계를 극복하기 위해 **[EC2 데이터 추출 → 로컬 GPU 가공(Qwen 모델) → TSV 압축 전송 → PostgreSQL COPY]** 프로세스를 구축하여 연산 속도 최적화.
- **병렬 처리 성능 개선**: 도서 유사도 연산 시 단일 프로세스 대비 **16개 워커 병렬 처리**를 적용하여 처리 속도 **약 4.6배 단축** (77.6ms/권 → 16.5ms/권).

---

### 2) LLM 기반 3층위 큐레이션 (Prompt Engineering)

단순 요약이 아닌 유저의 감성을 자극하는 비평적 텍스트를 생성하기 위해 GPT-4o-mini 프롬프트를 고도화했습니다.

- **3-Tier Insight**: 시공간적 배경(미학), 인간의 실존(철학), 정서적 잔상(여운)의 3가지 관점으로 분리된 통찰 문장 생성.
- **Constraint Control**: 도서 테마로서의 정보 밀도를 높이기 위해 문구별 **글자 수 제한(25~35자) 및 명사형 종결 어미**를 강제하는 프롬프트 반복 개선 (v1 → v3).

---

### 3) 정교한 개인화 추천 알고리즘 (Recommendation Engine)

사용자의 의도와 시간의 흐름을 반영한 자체 스코어링 시스템을 설계했습니다.

유저의 활동 로그 수($N$)에 따라 추천 배합 비율을 자동 조정하여 **Cold Start** 문제를 해결합니다.

| 단계 | 조건 | 선호 장르 | 행동 기반 | 랜덤 |
|------|------|-----------|-----------|------|
| **Cold** (초기) | 로그 없음 | 50% | - | 50% |
| **Warm** (과도기) | 로그 소량 | 50% | 20% | 30% |
| **Active** (안정) | 로그 충분 | 30% | 70% (개인화 임베딩 $\hat{U}$ 적용) | - |

---

## 6. 활용 데이터 (Data Assets)

| **구분** | **소스** | **데이터 규모** | **주요 피처(Feature)** |
|---|---|---|---|
| **도서 (Books)** | 알라딘/교보 API 및 크롤링 | 약 110,000건 | 제목, 저자, 줄거리, ISBN, 카테고리, 임베딩 벡터 |
| **영상 (Contents)** | TMDB API (Movie/TV) | 약 73,348건 | 제목, 장르, 줄거리, 키워드, 개봉일, 인기도 |
| **사용자 로그** | 서비스 내 자체 수집 | 실시간 누적 | 유입 경로(Source), 행동 유형(Action), 시간(Timestamp) |

- **데이터 총계**: TMDB(영상) + 알라딘/교보(도서) = **총 18만 건+**
- **데이터 정제 규칙**: 한국어 필터링, 지능형 Upsert, 저품질 데이터 제거 프로세스

---

## 7. Quick Start (로컬 실행)

> 상세 가이드는 [`exec/1_build_deploy.md`](exec/1_build_deploy.md)를 참고하세요.

### 사전 준비

- Git
- Docker Desktop + Docker Compose v2
- JDK 17 (백엔드 직접 실행 시)
- Node.js 20.x (프론트 직접 실행 시)

### 1단계 — 저장소 클론

```bash
git clone <GitLab_저장소_URL>
cd <프로젝트_디렉터리>
```

### 2단계 — 환경 변수 설정

루트의 `.env` 파일에 아래 키를 설정합니다.

```env
# DB
DB_USERNAME=...
DB_PASSWORD=...
DB_NAME=...
DB_PORT=5433

# Redis
REDIS_PORT=6379

# OAuth
KAKAO_CLIENT_ID=...
GOOGLE_CLIENT_ID=...
NAVER_CLIENT_ID=...

# JWT
JWT_SECRET=...

# AWS S3
AWS_ACCESS_KEY=...
AWS_SECRET_KEY=...
S3_BUCKET_NAME=...
```

### 3단계 — DB / Redis 컨테이너 기동

```bash
docker compose -f docker-compose.local.yml up -d
```

### 4단계 — 백엔드 실행

```bash
cd backend
./gradlew bootRun
```

### 5단계 — 프론트 실행

```bash
cd frontend
npm ci
npm run dev
```

> 프론트 환경 변수는 `frontend/.env.local`에 `NEXT_PUBLIC_API_URL` 등을 설정하세요.

### 프로덕션 배포 (Docker Compose 전체)

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

---

## 8. 팀 구성 및 역할

| 역할 | 인원 | 담당 영역 |
|------|:----:|-----------|
| **AI / Data** | 3명 | 데이터 수집·크롤링, AI 모델링(Embedding/Tagging), 추천 알고리즘 설계 |
| **BE / FE / Infra** | 3명 | 인프라 구축(AWS/Docker/Jenkins), API 설계·구현, 프론트엔드 UI/UX 개발 |

---

## 📎 관련 문서

| 문서 | 링크 |
|------|------|
| 빌드·배포 가이드 | [exec/1_build_deploy.md](exec/1_build_deploy.md) |
| 외부 서비스 가이드 | [exec/2_external_services.md](exec/2_external_services.md) |
| DB 덤프 가이드 | [exec/3_db_dump.md](exec/3_db_dump.md) |
| 시연 시나리오 | [exec/4_presentation_scenario.md](exec/4_presentation_scenario.md) |
