/** 도서 (검색 결과 / 랭킹) — BookResponse DTO */
export interface Book {
  id: number;
  slug: string;
  title: string;
  author: string;
  /** 백엔드 BookResponse.coverImageUrl */
  coverImageUrl?: string;
  /** picsum 플레이스홀더용 시드 (coverImageUrl 없을 때 사용) */
  seed?: string;
}

/**
 * 자동완성 응답 — BookSuggestionResponse DTO
 * id 대신 bookId 필드를 사용함
 */
export interface BookSuggestion {
  bookId: number;
  title: string;
  author: string;
}

/** 큐레이션 섹션 안의 개별 도서 카드 */
export interface CurationBook {
  title: string;
  copy: string;
  seed: string;
  /**
   * 도서 상세 페이지 라우팅용 slug (또는 id 문자열).
   * 백엔드 연동 시 BookResponse의 id나 slug로 교체.
   * Mock 데이터에서는 seed 값을 그대로 활용.
   */
  slug: string;
}

/** 히어로 슬라이더 / 컨텐츠 큐레이션 배너 */
export interface Banner {
  id: number;
  movie: string;
  movieSeed: string;
  /** dangerouslySetInnerHTML 용 HTML 문자열 */
  quote: string;
  books: CurationBook[];
}

/**
 * GET /api/recommendations/today 응답 DTO
 */
export interface TodayCurationResponse {
  /** 추천 도서 5권 목록 */
  books: Book[];
  /** 현재 새로고침 횟수 (API 호출마다 백엔드에서 증가) */
  refreshCount: number;
  /** true이면 맞춤 추천 데이터가 없어 인기 도서로 대체된 상태 */
  isFallback: boolean;
  /** 팝업 노출 여부 (10의 배수 회차마다 true) */
  showPopup: boolean;
  /** 팝업에 표시할 다이내믹 메시지 */
  popupMessage: string | null;
}

/**
 * 실시간 검색어 랭킹
 * 백엔드 GET /api/keywords/rankings 응답: List<String>
 * → 프론트에서 string[] 로 직접 사용
 */
