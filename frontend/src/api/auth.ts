import axios from "axios";
import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/types/api";

export interface SignupRequest {
  profileImageUrl: string;
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
  accessToken?: string;
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

export async function signup(data: SignupRequest) {
  const response = await apiClient.post<ApiResponse<SignupResponse>>("/api/auth/signup", data);
  return response.data.data;
}

export async function getPresignedUrl(userId: number, fileExtension: string) {
  const response = await apiClient.post<ApiResponse<{ presignedUrl: string; imageUrl: string }>>(
    "/api/tickets/image-url",
    { fileExtension },
    { params: { userId } }
  );
  return response.data.data;
}

export async function uploadImageToS3(presignedUrl: string, file: File) {
  // 기본 axios 객체를 사용하여 S3에 직접 업로드 (CORS 및 불필요한 헤더 방지)
  await axios.put(presignedUrl, file, {
    headers: {
      "Content-Type": file.type,
    },
  });
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
