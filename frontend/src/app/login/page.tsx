"use client";

import SignupFlow from "@/components/auth/SignupFlow";
import { useRouter } from "next/navigation";
import { GoogleOAuthProvider } from "@react-oauth/google";

export default function LoginPage() {
  const router = useRouter();
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleComplete = (data: any) => {
    // Signup completed
  };

  if (!clientId || clientId === 'undefined') {
    return null;
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
