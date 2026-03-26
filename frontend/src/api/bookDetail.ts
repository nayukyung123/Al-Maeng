import apiClient from "@/lib/axios";
import type { ApiResponse, SliceResponse } from "@/types/api";
import type { BookDetail, RecommendedBook, Review, CreateReviewBody, UpdateReviewBody } from "@/types/book";

/**
 * 도서 상세 정보를 서버에서 가져옵니다.
 */
export async function fetchBookDetail(slug: string): Promise<BookDetail> {
  const response = await apiClient.get<ApiResponse<BookDetail>>(`/api/books/${slug}`);
  return response.data.data;
}

/**
 * 연관 도서 추천 목록을 가져옵니다.
 */
export async function fetchRecommendations(slug: string): Promise<RecommendedBook[]> {
  const response = await apiClient.get<ApiResponse<RecommendedBook[]>>(`/api/books/${slug}/recommendations`);
  return response.data.data;
}

/**
 * 도서 리뷰 목록을 가져옵니다.
 */
export async function fetchReviews(slug: string): Promise<Review[]> {
  const response = await apiClient.get<ApiResponse<SliceResponse<Review>>>(
    `/api/books/${slug}/reviews`
  );
  // Slice 객체의 content 배열만 반환하여 기존 UI와 호환 유지
  return response.data.data.content ?? [];
}

/**
 * 리뷰를 작성합니다.
 */
export async function createReview(slug: string, body: CreateReviewBody): Promise<void> {
  await apiClient.post(`/api/books/${slug}/reviews`, body);
}

/**
 * 리뷰를 수정합니다.
 */
export async function updateReview(slug: string, reviewId: number, body: UpdateReviewBody): Promise<void> {
  // 백엔드 ReviewController: @PatchMapping("/api/reviews/{reviewId}")
  await apiClient.patch(`/api/reviews/${reviewId}`, body);
}

/**
 * 리뷰를 삭제합니다.
 */
export async function deleteReview(slug: string, reviewId: number): Promise<void> {
  // 백엔드 ReviewController: @DeleteMapping("/api/reviews/{reviewId}")
  await apiClient.delete(`/api/reviews/${reviewId}`);
}
