import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/types/api";
import type { BookDetail, RecommendedBook, Review, CreateReviewBody, UpdateReviewBody } from "@/types/book";

/**
 * 도서 상세 정보를 서버에서 가져옵니다.
 * 백엔드 GET /api/books/{slug}
 *
 * @param slug 도서의 고유 슬러그 (예: 1984-book)
 * @returns BookDetail 도서 상세 정보 객체
 */
export async function fetchBookDetail(slug: string): Promise<BookDetail> {
  const response = await apiClient.get<ApiResponse<BookDetail>>(`/api/books/${slug}`);
  return response.data.data;
}

/**
 * 인자로 넘긴 도서와 연관성이 높은 추천 도서 목록을 가져옵니다.
 * 백엔드 GET /api/books/{slug}/recommendations
 *
 * @param slug 추천의 기준이 되는 도서 슬러그
 * @returns RecommendedBook[] 추천 도서 배열
 */
export async function fetchRecommendations(slug: string): Promise<RecommendedBook[]> {
  const response = await apiClient.get<ApiResponse<RecommendedBook[]>>(`/api/books/${slug}/recommendations`);
  return response.data.data;
}

/**
 * 도서 리뷰 목록을 가져옵니다.
 */
export async function fetchReviews(slug: string): Promise<Review[]> {
  const response = await apiClient.get<ApiResponse<Review[]>>(`/api/books/${slug}/reviews`);
  return response.data.data;
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
  await apiClient.put(`/api/books/${slug}/reviews/${reviewId}`, body);
}

/**
 * 리뷰를 삭제합니다.
 */
export async function deleteReview(slug: string, reviewId: number): Promise<void> {
  await apiClient.delete(`/api/books/${slug}/reviews/${reviewId}`);
}
