"use client";

import SignupFlow from "@/components/auth/SignupFlow";
import { useRouter } from "next/navigation";
import { GoogleOAuthProvider } from "@react-oauth/google";

export default function LoginPage() {
  const router = useRouter();
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // 디버깅용: 브라우저 콘솔에 무조건 출력해보기
  console.log("👉 현재 주입된 Google Client ID:", clientId);

  const handleComplete = (data: any) => {
    console.log("Signup completed with data:", data);
  };

  // 방어 로직 수정: 무한 로딩 대신, 로그인 버튼 위치에만 에러 메시지 표시
  if (!clientId || clientId === 'undefined') {
    return (
      <div style={{ color: 'red', padding: '10px' }}>
        [디버그] 구글 클라이언트 ID가 없습니다! 젠킨스 환경변수를 확인하세요.
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <div className="min-h-screen bg-gray-50">
        <SignupFlow 
          onComplete={handleComplete}
          onClose={() => router.push("/")}
        />
      </div>
    </GoogleOAuthProvider>
  );
}
