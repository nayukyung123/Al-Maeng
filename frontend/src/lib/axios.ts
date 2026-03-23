import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from "axios";
import useAuthStore from "@/store/useAuthStore";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 요청 인터셉터: 로컬 스토리지의 accessToken을 Authorization 헤더에 자동으로 주입
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Next.js SSR 환경(서버 사이드)에서는 localStorage 접근 불가 → 클라이언트에서만 실행
    if (typeof window !== "undefined") {
      const accessToken = localStorage.getItem("accessToken");
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// 응답 인터셉터: 공통 에러 처리 (필요에 따라 확장)
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // 만약 401 에러이고, 처음 재요청하는 것이며, API가 reissue나 login이 아닐 경우
    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      originalRequest?.url !== "/api/auth/reissue" &&
      !originalRequest?.url?.includes("/api/auth/login")
    ) {
      if (originalRequest) originalRequest._retry = true;

      if (typeof window !== "undefined") {
        try {
          const refreshToken = localStorage.getItem("refreshToken");
          if (!refreshToken) throw new Error("No refresh token");

          // ✅ 핵심 수정: auth.ts를 import하지 않고, 순수 axios로 직접 요청 (순환 참조 방지)
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL || ""}/api/auth/reissue`,
            { refreshToken }
          );
          
          const tokens = response.data.data;
          
          // 새 토큰 저장
          useAuthStore.getState().setAccessToken(tokens.accessToken);
          localStorage.setItem("accessToken", tokens.accessToken);
          localStorage.setItem("refreshToken", tokens.refreshToken);

          // 실패했던 기존 요청의 인증 헤더 교체 후 재요청
          if (originalRequest) {
            originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
            return apiClient(originalRequest);
          }
        } catch (refreshError) {
          // 토큰 갱신 실패 시 강제 로그아웃
          useAuthStore.getState().logout();
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          alert("세션이 만료되었습니다. 다시 로그인해주세요.");
          window.location.href = "/login";
          return Promise.reject(refreshError);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
