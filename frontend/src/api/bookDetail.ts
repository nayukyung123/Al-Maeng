import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/types/api";
import type {
  BookDetail,
  RecommendedBook,
  Review,
  CreateReviewBody,
  UpdateReviewBody,
} from "@/types/book";

// ────────────────────────────────────────────────────────────
// 🟡 Mock API — 도서 상세 정보 GET /api/books/{slug}
//    백엔드 미구현 상태. Promise.resolve()로 더미 데이터 반환.
//    백엔드 완성 시 아래 주석 처리된 실제 Axios 코드로 교체하면 됨.
// ────────────────────────────────────────────────────────────
export async function fetchBookDetail(slug: string): Promise<BookDetail> {
  // --- 실제 API 연동 시 교체 ---
  // const res = await apiClient.get<ApiResponse<BookDetail>>(`/api/books/${slug}`);
  // return res.data.data;

  return Promise.resolve({
    id: 1,
    slug,
    title: "참을 수 없는 존재의 가벼움",
    author: "밀란 쿤데라",
    genre: "NOVEL",
    description:
      "우리가 선택한 삶의 무게는 과연 얼마나 될까? 니체의 영원회귀 사상을 바탕으로 네 남녀의 얽히고설킨 사랑과 삶을 통해 존재의 가벼움과 무거움을 탐구하는 현대 문학의 고전.",
    averageRating: 4.8,
    reviewCount: 1204,
    purchaseUrl: "https://www.aladin.co.kr",
    seed: slug,
  });
}

// ────────────────────────────────────────────────────────────
// 🟡 Mock API — 유사 도서 추천 GET /api/books/{slug}/recommendations
//    백엔드 미구현 상태. Promise.resolve()로 더미 데이터 반환.
// ────────────────────────────────────────────────────────────
export async function fetchRecommendations(
  slug: string
): Promise<RecommendedBook[]> {
  // --- 실제 API 연동 시 교체 ---
  // const res = await apiClient.get<ApiResponse<RecommendedBook[]>>(
  //   `/api/books/${slug}/recommendations`
  // );
  // return res.data.data;

  return Promise.resolve([
    {
      id: 1,
      slug: "inconvenient-convenience-store",
      title: "불편한 편의점",
      author: "김호연",
      seed: `rec-${slug}-1`,
    },
    {
      id: 2,
      slug: "dollargut-dream-department",
      title: "달러구트 꿈 백화점",
      author: "이미예",
      seed: `rec-${slug}-2`,
    },
    {
      id: 3,
      slug: "greenhouse-at-the-end-of-earth",
      title: "지구 끝의 온실",
      author: "김초엽",
      seed: `rec-${slug}-3`,
    },
    {
      id: 4,
      slug: "speed-of-light",
      title: "우리가 빛의 속도로 갈 수 없다면",
      author: "김초엽",
      seed: `rec-${slug}-4`,
    },
    {
      id: 5,
      slug: "bright-night",
      title: "밝은 밤",
      author: "최은영",
      seed: `rec-${slug}-5`,
    },
    {
      id: 6,
      slug: "hyunam-dong-bookshop",
      title: "어서 오세요, 휴남동 서점입니다",
      author: "황보름",
      seed: `rec-${slug}-6`,
    },
  ]);
}

// ────────────────────────────────────────────────────────────
// 🟢 완료된 API — 리뷰 목록 조회 GET /api/books/{slug}/reviews
// ────────────────────────────────────────────────────────────
export async function fetchReviews(slug: string): Promise<Review[]> {
  const res = await apiClient.get<ApiResponse<{ content: Review[] }>>(
    `/api/books/${slug}/reviews`
  );
  return res.data.data.content || [];
}

// ────────────────────────────────────────────────────────────
// 🟢 완료된 API — 리뷰 작성 POST /api/books/{slug}/reviews
//    Body: { content, rating, isSpoiler }
// ────────────────────────────────────────────────────────────
export async function createReview(
  slug: string,
  body: CreateReviewBody
): Promise<Review> {
  const res = await apiClient.post<ApiResponse<Review>>(
    `/api/books/${slug}/reviews`,
    body
  );
  return res.data.data;
}

// ────────────────────────────────────────────────────────────
// 🟢 완료된 API — 리뷰 수정 PATCH /api/reviews/{reviewId}
//    Body: { content, rating, isSpoiler }
// ────────────────────────────────────────────────────────────
export async function updateReview(
  reviewId: string,
  body: UpdateReviewBody
): Promise<Review> {
  const res = await apiClient.patch<ApiResponse<Review>>(
    `/api/reviews/${reviewId}`,
    body
  );
  return res.data.data;
}

// ────────────────────────────────────────────────────────────
// 🟢 완료된 API — 리뷰 삭제 DELETE /api/reviews/{reviewId}
// ────────────────────────────────────────────────────────────
export async function deleteReview(reviewId: string): Promise<void> {
  await apiClient.delete(`/api/reviews/${reviewId}`);
}
