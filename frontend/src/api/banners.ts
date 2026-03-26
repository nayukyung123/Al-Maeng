import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/types/api";

export interface BannerResponse {
  contentId: number;
  title: string;
  bannerPosterUrl: string;
  rank: number;
  type: string;
}

/**
 * 백엔드 GET /api/banners API에서 동적으로 상단 배너 목록을 불러옵니다.
 */
export async function fetchBanners(): Promise<BannerResponse[]> {
  const response = await apiClient.get<ApiResponse<BannerResponse[]>>("/api/banners");
  return response.data.data;
}