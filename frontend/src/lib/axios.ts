import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 요청 인터셉터: 로컬 스토리지의 accessToken을 Authorization 헤더에 자동으로 주입
apiClient.interceptors.request.use(
  (config) => {
    // Next.js SSR 환경(서버 사이드)에서는 localStorage 접근 불가 → 클라이언트에서만 실행
    if (typeof window !== "undefined") {
      const accessToken = localStorage.getItem("accessToken");
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터: 공통 에러 처리 (필요에 따라 확장)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 토큰 만료 등 인증 실패 시 처리 (예: 로그아웃, 토큰 갱신 등)
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
