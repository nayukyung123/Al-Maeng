/** 도서 상세 정보 — BookDetailResponse DTO */
export interface BookDetail {
  id: number;
  slug: string;
  title: string;
  author: string;
  genre: string;
  description: string;
  coverImageUrl?: string;
  /** picsum 플레이스홀더용 시드 (coverImageUrl 없을 때 사용) */
  seed?: string;
  averageRating: number;
  reviewCount: number;
  purchaseUrl?: string;
}

/** 유사 도서 추천 — RecommendedBookResponse DTO */
export interface RecommendedBook {
  id: number;
  slug: string;
  title: string;
  author: string;
  coverImageUrl?: string;
  seed?: string;
}

/** 리뷰 — ReviewResponse DTO */
export interface Review {
  id: number;       // 백엔드 Long → JSON number
  userId: number;   // 백엔드 Long → JSON number
  nickname: string;
  tierName?: string;
  profileImageUrl?: string;
  rating: number;
  content: string;
  spoiler: boolean; // 백엔드 필드명 spoiler (isSpoiler 아님)
  createdAt: string;
}

/** 리뷰 작성 요청 바디 */
export interface CreateReviewBody {
  content: string;
  rating: number;
  spoiler: boolean; // 백엔드 ReviewCreateRequest DTO 필드명과 일치
}

/** 리뷰 수정 요청 바디 */
export interface UpdateReviewBody {
  content: string;
  rating: number;
  spoiler: boolean; // 백엔드 ReviewUpdateRequest DTO 필드명과 일치
}
