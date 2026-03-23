"use client";

import React, { useState, useRef } from "react";
import Script from "next/script";
import { useGoogleLogin } from "@react-oauth/google";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, Check, Camera, User, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { signup, getPresignedUrl, uploadImageToS3, loginWithProvider, LoginResponse } from "@/api/auth";
import useAuthStore from "@/store/useAuthStore";
import { useRouter } from "next/navigation";

interface SignupFlowProps {
  onComplete?: (data: any) => void;
  onClose?: () => void;
}

const NOVEL_SUB_GENRES = [
  "스릴러",
  "SF",
  "로맨스",
  "다큐",
  "공포",
  "액션",
  "코미디",
  "판타지",
];
const BOOK_GENRES = [
  "문학(소설)",
  "에세이",
  "자기계발",
  "인문학",
  "경제경영",
  "과학",
  "예술",
  "만화",
];

// TODO: 추후 /api/genres API 호출로 대체
const TEMP_GENRE_MAP: Record<string, number> = {
  "문학(소설)": 1,
  "에세이": 2,
  "자기계발": 3,
  "인문학": 4,
  "경제경영": 5,
  "과학": 6,
  "예술": 7,
  "만화": 8,
  "스릴러": 11,
  "SF": 12,
  "로맨스": 13,
  "다큐": 14,
  "공포": 15,
  "액션": 16,
  "코미디": 17,
  "판타지": 18,
};

export default function SignupFlow({ onClose, onComplete }: SignupFlowProps) {
  const router = useRouter();
  const { user, login } = useAuthStore();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    nickname: "",
    birthYear: "",
    gender: "", // "남성" | "여성"
    profileImagePreview: null as string | null,
    profileImageFile: null as File | null,
    selectedBookGenres: [] as string[],
  });

  const authMutation = useMutation({
    mutationFn: async () => {
      // 1. 프로필 이미지 설정 (더미 또는 S3 업로드)
      let finalImageUrl = "https://example.com/dummy.jpg";

      if (formData.profileImageFile && user?.id) {
        // 백엔드 API 호출로 presignedUrl 받아오기
        const ext = formData.profileImageFile.name.split('.').pop() || "jpeg";
        const uploadInfo = await getPresignedUrl(user.id, `.${ext}`);
        
        if (uploadInfo && uploadInfo.presignedUrl) {
          await uploadImageToS3(uploadInfo.presignedUrl, formData.profileImageFile);
          finalImageUrl = uploadInfo.imageUrl;
        }
      }

      // 2. SignupRequest 매핑
      const genreIds = formData.selectedBookGenres
        .map((g) => TEMP_GENRE_MAP[g])
        .filter((id) => id !== undefined);

      const requestData = {
        profileImageUrl: finalImageUrl,
        nickname: formData.nickname,
        birthYear: parseInt(formData.birthYear, 10),
        gender: formData.gender === "남성" ? "MALE" : "FEMALE" as "MALE" | "FEMALE",
        genreIds: genreIds.length > 0 ? genreIds : [1], // 최소 1개 필수
      };

      // 3. 회원가입 API 호출 
      // 현재 apiClient 인터셉터에 의해 localStorage의 임시 토큰이 Authorization으로 함께 넘어갑니다.
      const res = await signup(requestData);
      return res;
    },
    onSuccess: (res) => {
      // 진짜 토큰 저장 
      // FIXME: 현재 SignupResponse 에 message만 정의되어 있습니다. 
      // 만약 백엔드에서 갱신된 토큰을 줄 경우 아래처럼 처리, 주지 않을 경우 기존 토큰 유지
      const newToken = (res as any)?.accessToken;
      if (newToken) {
         // Zustand (및 localStorage) 업데이트
         login(user || { id: 0, email: "", nickname: formData.nickname }, newToken);
      }
      
      if (onComplete) {
        onComplete(formData);
      }
      // 모달 또는 페이지에서 성공 처리 후 홈으로 이동 등
      router.push("/");
    },
    onError: (err) => {
      console.error("Signup Failed:", err);
      // 에러 메시지 렌더링 로직 필요
    }
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          profileImagePreview: reader.result as string,
          profileImageFile: file,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSocialLoginSuccess = (data: LoginResponse) => {
    if (data.isRegistered) {
      // 기존 회원
      login(user || { id: 0, email: "", nickname: "" }, data.accessToken);
      router.push("/");
    } else {
      // 신규 회원
      localStorage.setItem("accessToken", data.accessToken);
      setStep(2);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await loginWithProvider("google", tokenResponse.access_token);
        handleSocialLoginSuccess(res);
      } catch (err) {
        console.error("Google login failed", err);
      }
    },
  });

  const kakaoLogin = () => {
    const Kakao = (window as any).Kakao;
    if (Kakao && Kakao.isInitialized()) {
      Kakao.Auth.login({
        success: async (authObj: any) => {
          try {
            const res = await loginWithProvider("kakao", authObj.access_token);
            handleSocialLoginSuccess(res);
          } catch (err) {
            console.error("Kakao login API failed", err);
          }
        },
        fail: (err: any) => console.error("Kakao Auth login failed", err),
      });
    } else {
      console.error("Kakao SDK not loaded or initialized");
    }
  };

  const naverLogin = () => {
    const btn = document.getElementById("naverIdLogin")?.firstChild as HTMLElement;
    if (btn) btn.click();
    else console.error("Naver login button not initialized");
  };

  React.useEffect(() => {
    // Naver callback (redirect) handling
    const hash = window.location.hash;
    if (hash.includes("access_token")) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get("access_token");
      if (token) {
        window.history.replaceState(null, "", window.location.pathname);
        loginWithProvider("naver", token)
          .then((res) => handleSocialLoginSuccess(res))
          .catch((err) => console.error("Naver callback failed", err));
      }
    }
  }, []);

  const toggleGenre = (genre: string) => {
    setFormData((prev) => {
      const current = prev.selectedBookGenres;
      if (current.includes(genre)) {
        return { ...prev, selectedBookGenres: current.filter((g) => g !== genre) };
      } else {
        return { ...prev, selectedBookGenres: [...current, genre] };
      }
    });
  };

  const isNovelSelected = formData.selectedBookGenres.includes("문학(소설)");
  const isSubGenreMissing =
    isNovelSelected &&
    !NOVEL_SUB_GENRES.some((genre) => formData.selectedBookGenres.includes(genre));

  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center px-6">
      <Script 
        src="https://t1.kakaocdn.net/kakao_js_sdk/1.43.1/kakao.min.js" 
        strategy="lazyOnload" 
        onLoad={() => {
          const Kakao = (window as any).Kakao;
          if (Kakao && !Kakao.isInitialized()) {
            Kakao.init(process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID || "TODO_KAKAO_KEY");
          }
        }} 
      />
      <Script 
        src="https://static.nid.naver.com/js/naveridlogin_js_sdk_2.0.2.js" 
        strategy="lazyOnload" 
        onLoad={() => {
          const naver = (window as any).naver;
          if (naver && !(window as any).naverLoginInstance) {
            (window as any).naverLoginInstance = new naver.LoginWithNaverId({
              clientId: process.env.NEXT_PUBLIC_NAVER_CLIENT_ID || "TODO_NAVER_KEY",
              callbackUrl: window.location.origin + "/login",
              isPopup: false,
              loginButton: { color: "green", type: 3, height: 60 }
            });
            (window as any).naverLoginInstance.init();
          }
        }} 
      />
      <div id="naverIdLogin" style={{ display: "none" }}></div>

      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X size={24} />
        </button>
      )}
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <h2 className="text-3xl font-black mb-2 tracking-tighter italic uppercase">
                Al-Maeng
              </h2>
              <p className="text-gray-500 mb-12 font-medium">
                당신만의 텍스트 세계를 시작하세요
              </p>

              <div className="flex flex-col gap-4">
                <button
                  onClick={() => googleLogin()}
                  className="w-full h-14 bg-white border border-gray-200 rounded-xl flex items-center justify-center gap-3 font-bold hover:bg-gray-50 transition-colors"
                >
                  <img
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    alt="Google"
                    className="w-5 h-5"
                  />
                  구글로 시작하기
                </button>
                <button
                  onClick={() => kakaoLogin()}
                  className="w-full h-14 bg-[#FEE500] rounded-xl flex items-center justify-center gap-3 font-bold hover:opacity-90 transition-opacity"
                >
                  <span className="w-5 h-5 bg-black rounded-full flex items-center justify-center text-[10px] text-[#FEE500]">
                    K
                  </span>
                  카카오로 시작하기
                </button>
                <button
                  onClick={() => naverLogin()}
                  className="w-full h-14 bg-[#03C75A] text-white rounded-xl flex items-center justify-center gap-3 font-bold hover:opacity-90 transition-opacity"
                >
                  <span className="w-5 h-5 bg-white text-[#03C75A] rounded-sm flex items-center justify-center text-[12px] font-black">
                    N
                  </span>
                  네이버로 시작하기
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full"
            >
              <h2 className="text-2xl font-bold mb-8">기본 정보를 입력해주세요</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Nickname
                  </label>
                  <input
                    type="text"
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    placeholder="사용하실 닉네임을 입력하세요"
                    className="w-full border-b-2 border-black py-3 text-lg focus:outline-none focus:border-[#0033FF] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Birth Year
                  </label>
                  <select
                    value={formData.birthYear}
                    onChange={(e) => setFormData({ ...formData, birthYear: e.target.value })}
                    className="w-full border-b-2 border-black py-3 text-lg focus:outline-none focus:border-[#0033FF] transition-colors bg-transparent"
                  >
                    <option value="">출생년도 선택</option>
                    {Array.from({ length: 100 }, (_, i) => 2024 - i).map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Gender
                  </label>
                  <div className="flex gap-2">
                    {["남성", "여성"].map((g) => (
                      <button
                        key={g}
                        onClick={() => setFormData({ ...formData, gender: g })}
                        className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all ${
                          formData.gender === g
                            ? "border-[#0033FF] bg-[#0033FF] text-white"
                            : "border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  disabled={!formData.nickname || !formData.birthYear || !formData.gender}
                  onClick={() => setStep(3)}
                  className="w-full h-14 bg-black text-white rounded-xl font-bold mt-8 flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
                >
                  다음 단계 <ChevronRight size={20} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full"
            >
              <h2 className="text-2xl font-bold mb-8">프로필 사진을 등록하세요</h2>

              <div className="space-y-8">
                <div className="flex flex-col items-center py-12">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                      {formData.profileImagePreview ? (
                        <img
                          src={formData.profileImagePreview}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User size={48} className="text-gray-300" />
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-[#0033FF] transition-colors shadow-lg">
                      <Camera size={20} />
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-400 mt-4 font-medium uppercase tracking-widest">
                    Profile Photo
                  </p>
                </div>

                <div className="flex gap-3 mt-8">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 h-14 border-2 border-gray-100 text-gray-400 rounded-xl font-bold hover:border-gray-200 transition-colors"
                  >
                    이전
                  </button>
                  <button
                    onClick={() => setStep(4)}
                    className="flex-[2] h-14 bg-black text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-opacity"
                  >
                    다음 단계 <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full"
            >
              <h2 className="text-2xl font-bold mb-8">당신의 취향을 알려주세요</h2>

              <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-2 hide-scrollbar">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                    Books
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {BOOK_GENRES.map((genre) => (
                      <button
                        key={genre}
                        onClick={() => toggleGenre(genre)}
                        className={`px-4 py-2 rounded-full border-2 font-bold transition-all ${
                          formData.selectedBookGenres.includes(genre)
                            ? "border-[#0033FF] bg-[#0033FF] text-white"
                            : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200"
                        }`}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                </div>

                <AnimatePresence>
                  {isNovelSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center justify-between mb-4 mt-8">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
                          어떤 소설을 좋아하시나요?
                        </label>
                        <button
                          onClick={() => {
                            const allSelected = NOVEL_SUB_GENRES.every((genre) =>
                              formData.selectedBookGenres.includes(genre)
                            );
                            if (allSelected) {
                              setFormData((prev) => ({
                                ...prev,
                                selectedBookGenres: prev.selectedBookGenres.filter(
                                  (g) => !NOVEL_SUB_GENRES.includes(g)
                                ),
                              }));
                            } else {
                              setFormData((prev) => ({
                                ...prev,
                                selectedBookGenres: Array.from(
                                  new Set([...prev.selectedBookGenres, ...NOVEL_SUB_GENRES])
                                ),
                              }));
                            }
                          }}
                          className="text-[10px] font-black text-[#0033FF] uppercase tracking-widest hover:underline"
                        >
                          {NOVEL_SUB_GENRES.every((genre) =>
                            formData.selectedBookGenres.includes(genre)
                          )
                            ? "전체 해제"
                            : "전체 선택"}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {NOVEL_SUB_GENRES.map((genre) => (
                          <button
                            key={genre}
                            onClick={() => toggleGenre(genre)}
                            className={`px-4 py-2 rounded-full border-2 font-bold text-sm transition-all ${
                              formData.selectedBookGenres.includes(genre)
                                ? "border-black bg-black text-white"
                                : "border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200"
                            }`}
                          >
                            {genre}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setStep(3)}
                  disabled={authMutation.isPending}
                  className="flex-1 h-14 border-2 border-gray-100 text-gray-400 rounded-xl font-bold hover:border-gray-200 transition-colors disabled:opacity-50"
                >
                  이전
                </button>
                <button
                  disabled={isSubGenreMissing || authMutation.isPending || formData.selectedBookGenres.length === 0}
                  onClick={() => authMutation.mutate()}
                  className="flex-[2] h-14 bg-black text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
                >
                  {authMutation.isPending ? "가입 처리중..." : "가입 완료"}
                  {!authMutation.isPending && <Check size={20} />}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
