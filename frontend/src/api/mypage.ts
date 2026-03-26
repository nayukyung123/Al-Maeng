import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/types/api";
import type { Gender } from "@/types/mypage";

export interface UserProfileResponse {
  nickname: string;
  profileImageUrl: string | null;
  birthYear: number | null;
  gender: Gender;
  tasteData: number[];
  completedCount: number;
  tier: {
    id: number | null;
    tierName: string | null;
    minExp: number;
    nextMinExp: number | null;
    exp: number;
  };
}

export interface UserProfileUpdateRequest {
  nickname: string;
  profileImageUrl: string;
  birthYear: number;
  gender: Gender;
  tasteData: number[];
}

export interface TasteReportGenreStat {
  genreId: number;
  genreName: string;
  count: number;
  percentage: number;
}

export interface TasteReportResponse {
  topLevelGenres: TasteReportGenreStat[];
  subGenres: TasteReportGenreStat[];
}

export async function fetchMyProfile(): Promise<UserProfileResponse> {
  const response = await apiClient.get<ApiResponse<UserProfileResponse>>("/api/users/me");
  return response.data.data;
}

export async function fetchMyTasteReport(): Promise<TasteReportResponse> {
  const response = await apiClient.get<ApiResponse<TasteReportResponse>>(
    "/api/users/me/taste-report"
  );
  return response.data.data;
}

export async function updateMyProfile(
  body: UserProfileUpdateRequest
): Promise<void> {
  await apiClient.patch<ApiResponse<void>>("/api/users/me", body);
}

export async function deleteMyAccount(): Promise<void> {
  await apiClient.delete<ApiResponse<void>>("/api/users/me");
}

