"use client";

import { useEffect, useState } from "react";
import SignupFlow from "@/components/auth/SignupFlow";
import { useRouter } from "next/navigation";
import { GoogleOAuthProvider } from "@react-oauth/google";

export default function LoginPage() {
  const router = useRouter();
  const [clientId, setClientId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const envClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    // 환경 변수 방어 로직: null, undefined, 빈 문자열("", "undefined") 모두 체킹
    if (envClientId && envClientId !== "" && envClientId !== "undefined") {
      setClientId(envClientId);
    }
  }, []);

  const handleComplete = (data: any) => {
    console.log("Signup completed with data:", data);
  };

  // 클라이언트 마운트가 덜 되었거나 유효한 clientId 값이 없을 때는 렌더링을 차단하고 로딩 표시
  if (!isMounted || !clientId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#0033FF] border-t-transparent rounded-full animate-spin"></div>
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
