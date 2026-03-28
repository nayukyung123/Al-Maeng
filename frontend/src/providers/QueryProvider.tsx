"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { registerQueryClient } from "@/lib/reactQueryClientHolder";

/**
 * React 19 + Next.js 16 호환 QueryClientProvider
 *
 * - "use client" 선언으로 클라이언트 컴포넌트로 지정
 * - QueryClient를 컴포넌트 내 useState로 생성하여
 *   서버 사이드 렌더링 시 인스턴스가 공유되지 않도록 격리
 */
export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 윈도우 포커스 시 자동 리패치 비활성화 (필요 시 true로 변경)
            refetchOnWindowFocus: false,
            // 요청 실패 시 재시도 횟수
            retry: 1,
            // 캐시 유지 시간: 5분
            staleTime: 5 * 60 * 1000,
          },
        },
      })
  );

  useEffect(() => {
    registerQueryClient(queryClient);
    return () => registerQueryClient(null);
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
