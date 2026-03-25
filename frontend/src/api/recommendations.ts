import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/types/api";
import type { ContentRecommendationItem, TodayCurationResponse } from "@/types/home";

/**
 * GET /api/recommendations/contents
 * 인기 콘텐츠(영화·TV) 기반 도서 추천 목록 조회 — 인증 불필요
 */
export async function fetchContentRecommendations(): Promise<ContentRecommendationItem[]> {
  const res = await apiClient.get<ApiResponse<ContentRecommendationItem[]>>(
    "/api/recommendations/contents"
  );
  return res.data.data ?? [];
}

/**
 * GET /api/recommendations/today
 * 인증 필요 — axios interceptor가 Bearer 토큰을 자동 주입
 * 호출할 때마다 백엔드에서 refreshCount를 증가시켜 응답
 */
export async function fetchTodayRecommendations(): Promise<TodayCurationResponse> {
  const res = await apiClient.get<ApiResponse<TodayCurationResponse>>(
    "/api/recommendations/today"
  );
  return res.data.data;
}
