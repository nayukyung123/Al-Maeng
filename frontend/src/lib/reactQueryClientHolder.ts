import type { QueryClient } from "@tanstack/react-query";

let client: QueryClient | null = null;

export function registerQueryClient(c: QueryClient | null) {
  client = c;
}

/** 로그아웃·세션 만료 시 전역 캐시 초기화 (useAuthStore 등 비-React 코드에서 호출) */
export function clearReactQueryCache() {
  client?.clear();
}
