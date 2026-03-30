# DB 덤프 파일 가이드

PostgreSQL **pgvector** 환경에서 생성·복원하는 **AL-MAENG**용 DB 덤프 안내입니다.

---

## 1. 덤프 파일 정보

| 항목 | 내용 |
|------|------|
| **파일명** | **`almaeng_backup_20260329.sql`** |
| **위치** | [`exec/db_dump/almaeng_backup_20260329.sql`](./db_dump/almaeng_backup_20260329.sql) |
| **형식** | `pg_dump` **평문 SQL** (`-F p`) |
| **덤프 생성 환경** | DB 서버 **PostgreSQL 16.13**, `pg_dump` **16.13** (덤프 헤더 기준) |
| **대략 용량** | 약 **11 MB** |
| **포함 확장** | **`vector`** (pgvector), **`pg_trgm`** — 복원 대상 DB에도 동일 확장 설치 가능해야 함 |
| **객체 소유자** | 덤프 내 `OWNER TO` 등이 **`almaeng`** 사용자 기준으로 기록되어 있음 |
| **특이사항** | 덤프 상단에 PostgreSQL 16의 **`\restrict …`** 지시가 포함될 수 있습니다. **클라이언트 `psql`도 16.x 대**를 사용하는 것을 권장합니다. |

> 일반 PostgreSQL만으로는 부족합니다. **`vector` 확장**이 없는 이미지/인스턴스에는 복원이 실패할 수 있습니다. Docker는 `pgvector/pgvector:pg16` 이미지를 사용하세요.

---

## 2. 주요 포함 데이터 (테이블 요약)

본 덤프는 **스키마(CREATE TABLE·함수·확장 등) + 데이터(COPY/INSERT)** 를 포함하는 전체 백업 형태입니다.

대표 테이블:

### 도서·콘텐츠 메타데이터

- `books`, `contents`, `tags`, `contents_genres`, `genres`, `book_genres`, `book_similarity` 등

### 추천·랭킹

- `tag_book_recommendations`, `ranking`, `user_recommendation_pool`, `top_contents` 등

### 사용자·활동·티켓

- `users`, `social_accounts`, `users_genres`, `tiers`, `reviews`, `user_completed_books`, `user_wishlist`, `tickets`, `user_events`, `search_log`, `click_log`, `user_taste_report_genres` 등

---

## 3. 복원 방법 (Restoration Guide)

### 사전 조건

- PostgreSQL **16 + pgvector**(및 필요 시 **pg_trgm**) 환경  
- 덤프 파일: **`exec/db_dump/almaeng_backup_20260329.sql`**  
- DB 사용자·DB 이름: 프로젝트 `.env`의 `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`과 맞출 것  
- 덤프 소유자가 `almaeng`이면, 복원 시 **`-U almaeng`** 이거나, 슈퍼유저로 복원 후 권한을 맞춤

---

### A. Docker로 DB 컨테이너를 쓰는 경우 (권장: 호스트에서 한 번에 복원)

로컬 Compose 기준 컨테이너 이름: **`almaeng-postgres-local`** ([`docker-compose.local.yml`](../docker-compose.local.yml)).

```bash
# 프로젝트 루트에서 (.env의 DB_USERNAME, DB_NAME에 맞게 조정)
docker exec -i almaeng-postgres-local psql -U almaeng -d almaeng < exec/db_dump/almaeng_backup_20260329.sql
```

비밀번호 입력이 필요하면:

```bash
export PGPASSWORD='[DB_PASSWORD]'
docker exec -i almaeng-postgres-local psql -U almaeng -d almaeng < exec/db_dump/almaeng_backup_20260329.sql
```

프로덕션 컨테이너명이 다르면 예: `almaeng-postgres-prod` 로 변경합니다.

---

### B. 컨테이너 안에서 파일로 복원

```bash
docker cp exec/db_dump/almaeng_backup_20260329.sql almaeng-postgres-local:/tmp/almaeng_backup.sql
docker exec -it almaeng-postgres-local psql -U almaeng -d almaeng -f /tmp/almaeng_backup.sql
```

---

### C. Docker 없이 호스트 `psql`

```bash
psql -U [사용자명] -d [데이터베이스명] -h localhost -p [포트] < exec/db_dump/almaeng_backup_20260329.sql
```

로컬 Compose 포트는 `.env`의 `DB_PORT`(예: 5433)에 맞춥니다.

---

### 복원 후 확인 (선택)

```bash
docker exec -it almaeng-postgres-local psql -U almaeng -d almaeng -c "SELECT extname FROM pg_extension WHERE extname IN ('vector', 'pg_trgm');"
docker exec -it almaeng-postgres-local psql -U almaeng -d almaeng -c "SELECT COUNT(*) FROM books;"
```

---

## 비밀·경로 참고

| 경로 | 설명 |
|------|------|
| `exec/db_dump/almaeng_backup_20260329.sql` | 본 문서 기준 최신 덤프 |
| `docker-compose.local.yml` / `docker-compose.prod.yml` | DB 컨테이너·계정 연결 |
| `backend/src/main/resources/db/migration/` | 앱이 기대하는 스키마 버전(Flyway) |
