# 외부 서비스 가이드

회원 인증, 객체 스토리지, 데이터 수집, 품질 도구 등 프로젝트에서 사용하는 외부 서비스를 정리합니다.

---

## 소셜 로그인(OAuth)

| 제공자 | 용도 | 준비할 것(예시) | 프로젝트에서의 설정 키 |
|--------|------|-----------------|-------------------------|
| Kakao | 로그인·회원 식별 | 앱 REST API 키, Redirect URI 등록 | 백엔드: `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET`, `KAKAO_REDIRECT_URI` / 프론트: `NEXT_PUBLIC_KAKAO_CLIENT_ID` |
| Google | 로그인 | OAuth 클라이언트 ID·시크릿, 승인된 리다이렉트 URI | 백엔드: `GOOGLE_*` / 프론트: `NEXT_PUBLIC_GOOGLE_CLIENT_ID` |
| Naver | 로그인 | 애플리케이션 등록, Client ID·Secret, Callback URL | 백엔드: `NAVER_*` / 프론트: `NEXT_PUBLIC_NAVER_CLIENT_ID` |

---

## AWS S3(프로필·티켓 이미지)

백엔드에서 **Presigned URL** 발급·객체 삭제 등에 AWS SDK를 사용합니다. 

| 항목 | 용도·설명 | 프로젝트에서의 설정 키 / 위치 |
|------|-----------|------------------------------|
| 액세스 키 ID | S3 API 호출용 자격 증명(공개 가능한 ID) | 환경 변수 **`AWS_ACCESS_KEY`** → `application.yml` `cloud.aws.credentials.access-key` |
| 시크릿 액세스 키 | 위 키와 쌍인 비밀 값 | 환경 변수 **`AWS_SECRET_KEY`** → `cloud.aws.credentials.secret-key` |
| 버킷 이름 | 프로필·티켓 이미지 등 저장 대상 버킷 | 환경 변수 **`S3_BUCKET_NAME`** → `cloud.aws.s3.bucket` |
| 리전 | 서울 리전 고정 | **`ap-northeast-2`** (`application.yml`의 `cloud.aws.region.static`, 별도 env 키 없음) |

---

## Google Tag Manager(선택)

| 항목 | 내용 |
|------|------|
| 용도 | 웹 분석·태그 관리(선택) |
| 설정 | `NEXT_PUBLIC_GTM_ID` |

---

## Mattermost(알림)

| 항목 | 용도·설명 | 프로젝트에서의 설정 키 / 위치 |
|------|-----------|------------------------------|
| 인커밍 웹훅 URL | 백엔드 전역 예외 시 채널로 메시지 전송 | 환경 변수 **`MATTERMOST_WEBHOOK_URL`** → `application.yml`의 `notification.mattermost.webhook-url` |
| 알림 on/off | 웹훅 전송 여부 | `notification.mattermost.enabled` (`application.yml`, 기본 `true`). URL이 비어 있으면 코드에서 전송을 건너뜀 |

Jenkins 파이프라인 성공/실패 알림은 **Mattermost 플러그인**(`mattermostSend`) 설정이며, 위 환경 변수와는 별개입니다.

---

## 데이터 수집·배치 스크립트(`data/`)

앱 서버와 별도로 실행되는 Python 스크립트에서 다음 외부 API·DB 환경 변수를 사용합니다.

| 서비스 | 용도 | 대표 환경 변수 |
|--------|------|----------------|
| 알라딘 오픈 API | 도서 메타 등 | `ALADIN_API_KEY` |
| TMDB | 영화·TV 드라마 메타 | `TMDB_API_KEY` |
| 영화진흥위원회(KOFIC) | 박스오피스 등 | `KOFIC_API_KEY` |

### tmdb 수집 데이터

| 변수명 (DB Column) | TMDB 원본 필드 | 설명 및 데이터 값 (Value) | 비고 |
| --- | --- | --- | --- |
| **tmdb_id** | `id` | TMDB 서비스 내의 고유 식별 번호 (BIGINT) | 고유 키 |
| **type** | `media_type` | 콘텐츠 매체 유형 (`movie` 또는 `tv`) | 필수 구분 |
| **title** | `title` / `name` | 영상 콘텐츠 제목 | 검색 기준 |
| **description** | `overview` | 영상 콘텐츠 줄거리 (TEXT) | 유사도 비교 대상 |
| **poster_url** | `poster_path` | 세로형 포스터 이미지 URL | w500 규격 |
| **banner_poster_url** | `backdrop_path` | 가로형 배너 포스터 이미지 URL | 배너용 이미지 |
| **release_date** | `release_date` / `first_air_date` | 개봉일 또는 첫 방영 시작 연도 (DATE) | YYYY-MM-DD |
| **vote_count** | `vote_count` | TMDB 사용자들의 누적 투표 수 (BIGINT) | 인기도 지표 |
| **genres** | `genres` | 영상 콘텐츠 장르 정보 (JSONB) | 리스트 형태 |
| **keywords** | `keywords` | 콘텐츠 관련 키워드 정보 (JSONB) | 태그 생성 참고 |

### 알라딘 수집 데이터

| 변수명 (DB Column) | 알라딘 원본 필드 | 설명 및 데이터 값 (Value) | 비고 |
| --- | --- | --- | --- |
| itemId | `/shop/wbrowse.aspx?CID={cid}` | CID(장르 번호) 별 도서 목록에서 알라딘의 자체 도서 번호(itemId) | 크롤링하여 도서 번호 추출 후, 해당 번호를 알라딘 API Key 파라미터에 넣어 상세 정보 조회 |
| title | `title` | 도서 제목 (문자열) | 그대로 사용 |
| author | `author` | 저자명 (문자열) | 여러 명일 경우 문자열로 제공 |
| description | `fullDescription` | 도서 상세 설명 (HTML 포함 텍스트) → HTML 제거 및 정제 후 저장 | API 요청 시 `ItemLookUp` + `fulldescription` 옵션 필요 |
| page_count | `subInfo.itemPage` | 총 페이지 수 (정수) | 일부 도서는 null 가능 |
| isbn | `isbn13` | ISBN-13 (고유 식별자) | UNIQUE key로 사용 |
| published_date | `pubDate` | 출판일 (YYYY-MM-DD 형식 문자열) |  |
| cover_image_url | `cover` | 표지 이미지 URL → `coversum` → `cover500` 변환 | 해상도 개선 |
| slug | 직접 생성 | URL 식별자 (`title + isbn` 기반, 특수문자 제거 후 생성) | UNIQUE |
| genre_name | `categoryName` | 카테고리 문자열 (예: `국내도서>소설/시/희곡>한국소설`) → 파싱하여 parent/child 추출 | 계층 구조 가공 필요 |

### KOFIC(영화진흥위원회) 수집 데이터

| 변수명 (DB Column) | 수집 원본 출처 | 설명 및 데이터 값 (Value) | 비고 |
| --- | --- | --- | --- |
| **content_id** | `contents.id` | `contents` 테이블의 고유 ID (BIGINT) | Foreign Key |
| **rank** | `results[]` index | 콘텐츠의 현재 인기 순위 (INT) | 1~3위 등 |
| **type** | `media_type` | 콘텐츠 매체 유형 (`movie` 또는 `tv`) | 구분값 |
| **updated_at** | `System Time` | 데이터가 마지막으로 갱신된 일시 (TIMESTAMP) | 자동 기록 |

---

## SonarQube(정적 분석)

| 항목 | 내용 |
|------|------|
| 용도 | 백엔드 코드 품질·보안 분석(Gradle Sonar 플러그인) |
| 설정 예 | `backend/build.gradle`의 `sonar.projectKey` 등 |
| 서버 | `infra/sonarqube/docker-compose.yml` |


