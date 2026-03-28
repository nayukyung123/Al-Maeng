"use client";

import React, { useState, useRef } from "react";
import Script from "next/script";
import { useGoogleLogin } from "@react-oauth/google";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, Check, Camera, User, X } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { signup, getPresignedUrl, uploadImageToS3, loginWithProvider, checkNickname, LoginResponse, fetchGenres, GenreResponse } from "@/api/auth";
import useAuthStore from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import {
  getFileExtensionForPresigned,
  prepareUploadImage,
  readFileAsDataUrl,
} from "@/lib/imageCompression";

interface SignupFlowProps {
  onComplete?: (data: any) => void;
  onClose?: () => void;
}


/** JWT payload의 sub 클레임에서 userId(number)를 추출합니다. */
function parseUserIdFromToken(token: string): number {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload: { sub?: string } = JSON.parse(atob(base64));
    return payload.sub ? parseInt(payload.sub, 10) : 0;
  } catch {
    return 0;
  }
}

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
    selectedGenreIds: [] as number[],
  });

  const { data: genres = [], isLoading: isGenresLoading, isError: isGenresError } = useQuery<GenreResponse[]>({
    queryKey: ['genres'],
    queryFn: fetchGenres,
    staleTime: 1000 * 60 * 60 * 24, // 24시간: 오버페칭 방지
  });

  const mainGenres = React.useMemo(() => {
    return genres
      .filter((g) => g.parentId === null)
      .sort((a, b) => {
        if (a.genreName === "소설/시/희곡") return -1;
        if (b.genreName === "소설/시/희곡") return 1;
        return a.genreName.localeCompare(b.genreName, "ko");
      });
  }, [genres]);
  const novelSubGenres = React.useMemo(() => genres.filter((g) => g.parentId === 27594), [genres]);

  const authMutation = useMutation({
    mutationFn: async () => {
      let profileImageUrl: string | undefined;

      if (formData.profileImageFile && user?.id) {
        const ext = getFileExtensionForPresigned(formData.profileImageFile);
        const uploadInfo = await getPresignedUrl(user.id, `.${ext}`);

        if (uploadInfo?.presignedUrl) {
          await uploadImageToS3(
            uploadInfo.presignedUrl,
            formData.profileImageFile,
            uploadInfo.contentType
          );
          profileImageUrl = uploadInfo.imageUrl;
        }
      }

      const genreIds = formData.selectedGenreIds;

      const requestData = {
        nickname: formData.nickname,
        birthYear: parseInt(formData.birthYear, 10),
        gender: formData.gender === "남성" ? "MALE" : "FEMALE" as "MALE" | "FEMALE",
        genreIds: genreIds.length > 0 ? genreIds : [1], // 최소 1개 필수
        ...(profileImageUrl ? { profileImageUrl } : {}),
      };

      // 3. 회원가입 API 호출 
      // 현재 apiClient 인터셉터에 의해 localStorage의 임시 토큰이 Authorization으로 함께 넘어갑니다.
      const res = await signup(requestData);
      return res;
    },
    onSuccess: (res) => {
      // 진짜 토큰 저장 
      const newToken = res.accessToken;
      const newRefToken = res.refreshToken;
      
      if (newToken && newRefToken) {
        // JWT sub 클레임에서 userId 추출 후 정확히 저장
        const userId = parseUserIdFromToken(newToken);
        login({ id: userId, email: "", nickname: formData.nickname }, newToken, newRefToken);
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const prepared = await prepareUploadImage(file, "profile");
      const previewDataUrl = await readFileAsDataUrl(prepared.file);
      setFormData((prev) => ({
        ...prev,
        profileImagePreview: previewDataUrl,
        profileImageFile: prepared.file,
      }));
      if (prepared.usedOriginalFallback) {
        alert("이미지 압축에 실패해 원본 파일로 업로드합니다.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "이미지를 처리하지 못했습니다.";
      alert(message);
    }
  };

  const handleSocialLoginSuccess = (data: LoginResponse) => {
    const userId = parseUserIdFromToken(data.accessToken);

    if (data.isRegistered) {
      // 기존 회원: JWT sub에서 추출한 userId로 정확히 저장
      login({ id: userId, email: "", nickname: "" }, data.accessToken, data.refreshToken);
      router.push("/");
    } else {
      // 신규 회원: 온보딩 단계로 이동 (최종 가입 시 userId 재설정)
      localStorage.setItem("accessToken", data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem("refreshToken", data.refreshToken);
      }
      setStep(2);
    }
  };

  const handleNextStep2 = async () => {
    if (!formData.nickname) {
      alert("닉네임을 입력해주세요.");
      return;
    }
    
    try {
      const res = await checkNickname(formData.nickname);
      if (res.isAvailable) {
        setStep(3);
      } else {
        alert("이미 사용 중인 닉네임입니다. 다른 닉네임을 입력해주세요.");
      }
    } catch (err: any) {
      console.error("Nickname check failed:", err);
      alert("닉네임 확인 중 오류가 발생했습니다.");
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

  const toggleGenreId = (genreId: number) => {
    setFormData((prev) => {
      const current = prev.selectedGenreIds;
      if (current.includes(genreId)) {
        return { ...prev, selectedGenreIds: current.filter((id) => id !== genreId) };
      } else {
        return { ...prev, selectedGenreIds: [...current, genreId] };
      }
    });
  };

  const isNovelSelected = formData.selectedGenreIds.includes(27594);
  const isSubGenreMissing =
    isNovelSelected &&
    novelSubGenres.length > 0 &&
    !novelSubGenres.some((g) => formData.selectedGenreIds.includes(g.id));

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
                    maxLength={10}
                    onChange={(e) => {
                      // 한글, 영문, 숫자만 허용 (특수문자 및 공백 제거)
                      const filtered = e.target.value.replace(/[^a-zA-Z0-9ㄱ-ㅎㅏ-ㅣ가-힣]/g, "");
                      setFormData({ ...formData, nickname: filtered });
                    }}
                    placeholder="사용하실 닉네임을 입력하세요"
                    className="w-full border-b-2 border-black py-3 text-lg focus:outline-none focus:border-[#0033FF] transition-colors"
                  />
                  <p className="text-[10px] text-gray-400 font-medium mt-2">
                    한글, 영문, 숫자만 10자 이내로 입력해 주세요.
                  </p>
                </div>

                <div className="pt-2">
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
                  onClick={handleNextStep2}
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
                {isGenresLoading ? (
                  <div className="flex justify-center items-center py-20">
                    <div className="w-8 h-8 border-4 border-[#0033FF] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : isGenresError ? (
                  <div className="flex justify-center items-center py-20 text-red-500 font-bold">
                    장르 정보를 불러오는 데 실패했습니다. 다시 시도해 주세요.
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                        Books
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {mainGenres.map((genre) => (
                          <button
                            key={genre.id}
                            onClick={() => toggleGenreId(genre.id)}
                            className={`px-4 py-2 rounded-full border-2 font-bold transition-all ${
                              formData.selectedGenreIds.includes(genre.id)
                                ? "border-[#0033FF] bg-[#0033FF] text-white"
                                : "border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200"
                            }`}
                          >
                            {genre.genreName}
                          </button>
                        ))}
                      </div>
                    </div>

                    <AnimatePresence>
                      {isNovelSelected && novelSubGenres.length > 0 && (
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
                                const subGenreIds = novelSubGenres.map(g => g.id);
                                const allSelected = subGenreIds.every((id) =>
                                  formData.selectedGenreIds.includes(id)
                                );
                                if (allSelected) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    selectedGenreIds: prev.selectedGenreIds.filter(
                                      (id) => !subGenreIds.includes(id)
                                    ),
                                  }));
                                } else {
                                  setFormData((prev) => ({
                                    ...prev,
                                    selectedGenreIds: Array.from(
                                      new Set([...prev.selectedGenreIds, ...subGenreIds])
                                    ),
                                  }));
                                }
                              }}
                              className="text-[10px] font-black text-[#0033FF] uppercase tracking-widest hover:underline"
                            >
                              {novelSubGenres.every((g) =>
                                formData.selectedGenreIds.includes(g.id)
                              )
                                ? "전체 해제"
                                : "전체 선택"}
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {novelSubGenres.map((genre) => (
                              <button
                                key={genre.id}
                                onClick={() => toggleGenreId(genre.id)}
                                className={`px-4 py-2 rounded-full border-2 font-bold text-sm transition-all ${
                                  formData.selectedGenreIds.includes(genre.id)
                                    ? "border-black bg-black text-white"
                                    : "border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200"
                                }`}
                              >
                                {genre.genreName}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
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
                  disabled={isSubGenreMissing || authMutation.isPending || formData.selectedGenreIds.length === 0}
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
