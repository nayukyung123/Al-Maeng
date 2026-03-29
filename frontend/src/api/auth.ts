import apiClient from "@/lib/axios";
import { guessImageContentTypeFromFile, putPresignedObject } from "@/lib/s3PresignedPut";
import type { ApiResponse } from "@/types/api";

export interface SignupRequest {
  /** 프로필 사진을 올린 경우에만 전달 */
  profileImageUrl?: string;
  nickname: string;
  birthYear: number;
  gender: "MALE" | "FEMALE";
  genreIds: number[];
}

export interface LoginRequest {
  accessToken: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  isRegistered: boolean;
}

export interface SignupResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
  user?: {
    id: number;
    email: string;
    nickname: string;
    profileImageUrl?: string;
  };
}

export interface NicknameCheckResponse {
  isAvailable: boolean;
}

export interface ReissueRequest {
  refreshToken: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

export async function loginWithProvider(provider: string, accessToken: string) {
  const response = await apiClient.post<ApiResponse<LoginResponse>>(
    `/api/auth/login/${provider}`,
    { accessToken }
  );
  return response.data.data;
}

export async function signup(data: SignupRequest, token?: string) {
  const response = await apiClient.post<ApiResponse<SignupResponse>>("/api/auth/signup", data, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return response.data.data;
}

export async function getPresignedUrl(userId: number, fileExtension: string, token?: string) {
  const response = await apiClient.post<
    ApiResponse<{ presignedUrl: string; imageUrl: string; contentType?: string }>
  >("/api/tickets/image-url", { fileExtension }, { 
    params: { userId },
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  return response.data.data;
}

export async function uploadImageToS3(
  presignedUrl: string,
  file: File,
  contentType: string | undefined
) {
  const ct = contentType?.trim() || guessImageContentTypeFromFile(file);
  await putPresignedObject(presignedUrl, file, ct);
}

export async function checkNickname(nickname: string) {
  const response = await apiClient.get<ApiResponse<NicknameCheckResponse>>("/api/auth/check-nickname", {
    params: { nickname }
  });
  return response.data.data;
}

export async function reissue(refreshToken: string) {
  const response = await apiClient.post<ApiResponse<TokenResponse>>("/api/auth/reissue", { refreshToken });
  return response.data.data;
}

export async function logout() {
  const response = await apiClient.post<ApiResponse<void>>("/api/auth/logout");
  return response.data;
}

export interface GenreResponse {
  id: number;
  genreName: string;
  parentId: number | null;
}

export async function fetchGenres() {
  const response = await apiClient.get<ApiResponse<GenreResponse[]>>("/api/genres");
  return response.data.data;
}
