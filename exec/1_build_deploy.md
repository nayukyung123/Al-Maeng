# 클론·빌드·배포 가이드

GitLab에서 소스를 클론한 뒤 로컬 또는 Docker Compose(프로덕션) 기준으로 빌드·배포하는 절차를 정리합니다.

---

## 사전 준비(Pre-requisites)

### 공통

- **Git**
- **Docker Desktop**(또는 Docker Engine) + **Docker Compose v2** — 프로덕션 배포 및 로컬 DB/Redis 컨테이너에 필요

### 로컬에서 백엔드만 실행할 때

- **JDK 17** — `backend/build.gradle`의 Java toolchain과 일치
- **Gradle** — 저장소에 포함된 Wrapper 사용 권장(`backend/gradlew`)

### 로컬에서 프론트만 실행할 때

- **Node.js 20.x**(LTS 권장) — `frontend/Dockerfile`의 빌드 이미지와 맞춤
- **npm** — `frontend/package.json` 기준

### 데이터베이스

- 본 프로젝트는 **PostgreSQL 16 + pgvector**를 사용합니다. 로컬에서 DB를 직접 띄울 때는 `pgvector`가 포함된 이미지 또는 확장 설치가 가능한 인스턴스를 사용하세요.

---

## 저장소 클론

```bash
git clone <GitLab_저장소_URL>
cd <프로젝트_디렉터리>
```

---

## 환경 변수(.env)

### Docker Compose에서 쓰는 키

`docker-compose.local.yml`, `docker-compose.prod.yml`이 참조하는 이름입니다.

| 환경 변수 | 설명 |
|-----------|------|
| `DB_USERNAME` | PostgreSQL 사용자명 |
| `DB_PASSWORD` | PostgreSQL 비밀번호 |
| `DB_NAME` | 데이터베이스 이름 |
| `DB_PORT` | 로컬 Compose: 호스트 ↔ DB 컨테이너 매핑 포트(기본 예: `5433`) |
| `REDIS_PORT` | 로컬 Compose: 호스트 ↔ Redis 포트 |

### Spring Boot(백엔드)에서 쓰는 키

`backend/src/main/resources/application.yml`의 `${…}`와 대응합니다. 로컬 `bootRun`이나 프로덕션 컨테이너 모두 동일한 이름으로 주입할 수 있습니다.

| 환경 변수 | 설명 |
|-----------|------|
| `SPRING_REDIS_HOST` | Redis 호스트(로컬 기본 `localhost`, prod Compose에서는 `redis` 등) |
| `REDIS_PORT` | Redis 포트(기본 `6379`) |
| `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET`, `KAKAO_REDIRECT_URI` | 카카오 OAuth |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` | 구글 OAuth |
| `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`, `NAVER_REDIRECT_URI` | 네이버 OAuth |
| `JWT_SECRET` | JWT 서명 |
| `MATTERMOST_WEBHOOK_URL` | Mattermost 인커밍 웹훅 URL(에러 알림). 비우면 알림 전송 안 함 |
| `AWS_ACCESS_KEY`, `AWS_SECRET_KEY`, `S3_BUCKET_NAME` | S3(SDK·Presigned URL) |

> DB URL·계정: 로컬은 `application.yml`의 `DB_PORT`/`DB_NAME`/`DB_USERNAME`과 위 `DB_PASSWORD` 조합. prod Compose는 `SPRING_DATASOURCE_*`, `SPRING_FLYWAY_*` 등을 추가로 넘깁니다(`docker-compose.prod.yml` 참고).

### 프로덕션 프론트 이미지 빌드(`NEXT_PUBLIC_*`)

`docker-compose.prod.yml`의 `build.args`로 빌드 시 주입됩니다.

| 환경 변수 | 설명 |
|-----------|------|
| `NEXT_PUBLIC_API_URL` | 브라우저에 노출되는 API 베이스 URL(프로덕션에서는 보통 `/api` 등) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | 구글 로그인(클라이언트) |
| `NEXT_PUBLIC_KAKAO_CLIENT_ID` | 카카오 SDK |
| `NEXT_PUBLIC_NAVER_CLIENT_ID` | 네이버 로그인 |
| `NEXT_PUBLIC_GTM_ID` | Google Tag Manager(선택) |

프론트 컨테이너 **런타임**에는 Compose에서 `NEXT_PUBLIC_API_URL=/api`, `INTERNAL_API_URL=http://backend:8080` 등을 별도로 설정합니다.

### 로컬 프론트 개발

`frontend/.env.local` 등에 `NEXT_PUBLIC_API_URL` 등을 두면 됩니다.

### 데이터 스크립트(`data/`, 선택)

스크립트마다 다를 수 있음 — 예: `DB_HOST`, `DB_USER`, `ALADIN_API_KEY`, `TMDB_API_KEY`, `KOFIC_API_KEY` 등.

---

## Jenkins 배포(`Jenkinsfile`)

| 항목 | 내용 |
|------|------|
| Compose 파일 | `COMPOSE_FILE` = `docker-compose.prod.yml` |
| Credential | **`almaeng-env`**: 백엔드·DB 등용 env 파일 → 루트 `.env`로 복사 |
| Credential | **`frontend-env`**: 프론트용 env 내용 → 기존 `.env`에 append |
| 절차 | 루트 `.env` 생성 후 `frontend/.env`로 복사 → `docker compose -f docker-compose.prod.yml up -d --wait --build` → 이후 `docker image prune -f` |
| 알림 | 성공/실패 시 Mattermost 플러그인(`mattermostSend`) |

젠킨스 서버를 Docker로 띄우는 예시는 `infra/jenkins/docker-compose.yml`을 참고합니다(포트 `9090:8080`, 호스트 도커 소켓 마운트 등).

---

## Docker 요약

| 파일 | 역할 |
|------|------|
| `docker-compose.local.yml` | 로컬용 **db**, **redis**만 기동. `.env`의 `DB_*`, `REDIS_PORT` 사용 |
| `docker-compose.prod.yml` | **db**, **redis**, **backend**, **frontend**, **nginx**. 백엔드는 루트 `.env`를 `env_file`로 로드하고, DB/Flyway/Redis/타임존 등을 `environment`로 덮어씀. 프론트는 빌드 args + 런타임 env |
| `backend/Dockerfile` | 멀티스테이지: Gradle 빌드 → JRE 17로 JAR 실행 |
| `frontend/Dockerfile` | Node 20 빌드 → Next standalone `node server.js` |
| `infra/nginx/Dockerfile` | Nginx Alpine + `default.conf` |

---

## 기술 스택·버전 요약

| 구분 | 제품·설정 |
|------|-----------|
| JVM | Java **17** (Docker: Eclipse Temurin 17 JDK/JRE) |
| 백엔드 | Spring Boot **3.5.11**, 내장 **Tomcat**(기본 포트 **8080**) |
| 빌드 | Gradle **8.14.4** (`backend/gradle/wrapper`) |
| DB | **`pgvector/pgvector:pg16`** 이미지 — PostgreSQL 16 + pgvector |
| 캐시 | Redis (`redis:alpine`) |
| 프론트 | Node **20**, Next.js **16.1.6**, React **19.2.3** |
| 리버스 프록시 | Nginx Alpine (`infra/nginx/`) |
| 스키마 마이그레이션 | Flyway — `backend/src/main/resources/db/migration/` |
| IDE | **IntelliJ IDEA 2023.3** |

---

## 호스트 ↔ 컨테이너 포트 매핑

### 프로덕션 (`docker-compose.prod.yml`)

| 용도 | 호스트 포트 | 컨테이너 서비스 | 컨테이너 포트 | 비고 |
|------|-------------|-----------------|---------------|------|
| HTTP | 80 | nginx | 80 | Let’s Encrypt HTTP-01 인증 경로 포함 |
| HTTPS | 443 | nginx | 443 | 인증서는 호스트 볼륨 마운트 |
| PostgreSQL | 5432 | db | 5432 | 운영 정책에 따라 외부 노출 여부 조정 |
| 백엔드 API | *(직접 노출 없음)* | backend | 8080 | Nginx `location /api` → 백엔드 |
| 프론트(Next) | *(직접 노출 없음)* | frontend | 3000 | Nginx `/` → 프론트 |
| Redis | *(직접 노출 없음)* | redis | 6379 | 백엔드만 접속 |

### 로컬 개발용 Compose (`docker-compose.local.yml`)

DB·Redis만 기동할 때 호스트 포트는 `.env`의 `DB_PORT`, `REDIS_PORT`로 지정합니다.

| 용도 | 호스트 포트 | 컨테이너 | 컨테이너 포트 |
|------|-------------|----------|----------------|
| PostgreSQL | `${DB_PORT}` | db | 5432 |
| Redis | `${REDIS_PORT}` | redis | 6379 |

---

## 로컬 빌드·실행 요약

### DB·Redis만 Docker로

프로젝트 루트에서:

```bash
docker compose -f docker-compose.local.yml up -d
```

이후 `backend/src/main/resources/application.yml`의 기본값(예: DB 포트 `5433`)과 `.env`의 `DB_PORT`를 일치시킵니다.

### 백엔드

```bash
cd backend
./gradlew bootRun
# 또는
./gradlew build -x test && java -jar build/libs/*-SNAPSHOT.jar
```

### 프론트

```bash
cd frontend
npm ci
npm run dev
```

로컬에서 API URL 등은 `frontend/.env` 또는 `.env.local`의 `NEXT_PUBLIC_API_URL` 등으로 설정합니다.

---

## 프로덕션 배포(Docker Compose)

프로젝트 루트에서 루트 `.env`를 준비한 뒤:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Jenkins 사용 시 절차는 위 **Jenkins 배포** 절을 참고합니다.

---

## SSL 인증서(Let’s Encrypt + Certbot)

Nginx 설정(`infra/nginx/default.conf`)은 호스트의 인증서 경로(`/etc/letsencrypt`, `/var/www/certbot`)를 마운트하는 전제입니다. **도메인**은 실제 서비스 도메인으로 바꿉니다.

웹루트 방식 예시(호스트에 certbot이 설치된 경우):

```bash
sudo certbot certonly --webroot -w /var/www/certbot -d your.domain.example --email your-email@example.com --agree-tos --no-eff-email
```

---

## 배포 시 특이사항

1. **pgvector**  
   - DB 이미지는 **`pgvector/pgvector:pg16`**입니다. 일반 PostgreSQL만으로는 Flyway 마이그레이션 중 `CREATE EXTENSION vector` 및 `vector` 컬럼 타입이 실패할 수 있습니다.  
   - 초기 기동 시 **Flyway가 첫 마이그레이션에서 `CREATE EXTENSION IF NOT EXISTS vector`**를 실행합니다(`backend/src/main/resources/db/migration/V1__init_schema.sql` 등). 빈 DB에 대해 마이그레이션이 끝까지 적용되는지 확인하세요.

2. **기동 순서**  
   - 프로덕션 Compose에서 백엔드는 DB 헬스체크 이후, 프론트는 백엔드 헬스 이후 기동되도록 정의되어 있습니다.

3. **프론트 빌드 타임 변수**  
   - `NEXT_PUBLIC_*` 값은 이미지 **빌드 시** 주입됩니다(`docker-compose.prod.yml`의 `build.args`). 값을 바꾼 뒤에는 프론트 이미지를 다시 빌드해야 합니다.

---

## 비밀·프로퍼티가 정의되는 주요 파일 목록

| 경로 | 설명 |
|------|------|
| `backend/src/main/resources/application.yml` | DB, Redis, OAuth, JWT, S3, 알림 등 애플리케이션 기본 설정 |
| `backend/src/main/resources/db/migration/` | 스키마·pgvector 확장·인덱스 등 |
| `docker-compose.prod.yml`, `docker-compose.local.yml` | 컨테이너 환경 변수·포트·연결 URL |
| 루트 `.env` | 실제 비밀 값(gitignore). 필요한 키는 본 문서 **환경 변수** 절 참고 |
| `Jenkinsfile` | 배포 시 합쳐지는 env 파일(Credential) |
| `backend/src/test/resources/application.yml` | 테스트 전용 더미 설정 |
| `frontend/next.config.ts` | 외부 이미지 호스트 허용(S3 등) |
| `data/collectors/`, `data/processors/` | 일부 스크립트가 루트 또는 `data/.env`에서 DB·API 키 로드 |

---

## 참고

- 백엔드 Docker 빌드: `backend/Dockerfile`
- 프론트 Docker 빌드: `frontend/Dockerfile`(Next standalone)
- Gradle 테스트에서 Testcontainers 사용 시: 호스트의 `DOCKER_HOST`, `TESTCONTAINERS_HOST_OVERRIDE` 등이 필요할 수 있음(`backend/build.gradle` 참고)
