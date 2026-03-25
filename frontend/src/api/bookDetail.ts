import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/types/api";
import type { BookDetail, RecommendedBook } from "@/types/book";

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
