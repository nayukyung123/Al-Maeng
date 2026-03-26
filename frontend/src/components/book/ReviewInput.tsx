"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, Send, AlertCircle, X } from "lucide-react";
import axios from "axios";
import { cn } from "@/lib/utils";
import useAuthStore from "@/store/useAuthStore";
import { createReview } from "@/api/bookDetail";
import ProfileAvatar from "./ProfileAvatar";

interface ReviewInputProps {
  slug: string;
}

export default function ReviewInput({ slug }: ReviewInputProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isLoggedIn, user } = useAuthStore();

  /* ── 폼 로컬 상태 ── */
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(0);
  const [isSpoilerInput, setIsSpoilerInput] = useState(false);

  /* ── 에러 팝업 상태 ── */
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /** 에러 메시지가 세팅되면 3초 후 자동으로 사라짐 */
  useEffect(() => {
    if (!errorMessage) return;
    const timer = setTimeout(() => setErrorMessage(null), 1500);
    return () => clearTimeout(timer);
  }, [errorMessage]);

  /** API 에러 → 백엔드 message 필드 추출 후 팝업 표시 */
  const handleApiError = (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const msg = error.response?.data?.message;
      setErrorMessage(msg || "오류가 발생했습니다. 다시 시도해주세요.");
    } else {
      setErrorMessage("오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  /* ── 캐시 무효화 헬퍼 ── */
  const invalidateReviews = () =>
    queryClient.invalidateQueries({ queryKey: ["reviews", slug] });

  /* ── 리뷰 작성 Mutation ── */
  const createMutation = useMutation({
    mutationFn: () =>
      createReview(slug, { content: comment, rating, spoiler: isSpoilerInput }),
    onSuccess: () => {
      invalidateReviews();
      setComment("");
      setRating(0);
      setIsSpoilerInput(false);
    },
    onError: handleApiError,
  });

  const isPending = createMutation.isPending;

  /** 제출 핸들러 */
  const handleSubmit = () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    if (!comment.trim() || rating === 0) return;
    createMutation.mutate();
  };

  /** 프로필 이미지 */
  const profileSrc = user?.profileImageUrl
    ? user.profileImageUrl
    : `https://picsum.photos/seed/${user?.id ?? "myprofile"}/200/200`;

  return (
    <>
    {/* ── 에러 토스트 ── */}
    <div
      className={cn(
        "fixed top-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm bg-white pointer-events-auto",
        "shadow-[0_4px_24px_rgba(0,0,0,0.12)]",
        "transition-all duration-300",
        errorMessage
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-3 pointer-events-none"
      )}
    >
      {/* 상단 포인트 바 */}
      <div className="h-1 w-full bg-[#4D41FF]" />

      <div className="flex items-start gap-4 px-6 py-4">
        {/* 아이콘 */}
        <AlertCircle size={18} className="text-[#4D41FF] shrink-0 mt-0.5" />

        {/* 메시지 */}
        <p className="flex-1 text-sm font-black leading-snug tracking-tight break-keep sm:whitespace-nowrap">
          {errorMessage}
        </p>

        {/* 닫기 버튼 */}
        <button
          onClick={() => setErrorMessage(null)}
          aria-label="닫기"
          className="text-gray-300 hover:text-black transition-colors shrink-0"
        >
          <X size={16} />
        </button>
      </div>
    </div>

    <div
      id="comment-input"
      className="bg-white border border-gray-100 p-8 mb-16 flex gap-6 shadow-sm relative scroll-mt-8 overflow-hidden"
    >
      {/* ── 비로그인 오버레이 ── */}
      {!isLoggedIn && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 backdrop-blur-sm bg-white/60">
          <p className="text-lg font-black tracking-tight">
            로그인 후 이용하실 수 있습니다
          </p>
          <button
            onClick={() => router.push("/login")}
            className="px-8 py-3 bg-black text-white text-sm font-black uppercase tracking-widest hover:bg-[#4D41FF] transition-all"
          >
            로그인 시작하기
          </button>
        </div>
      )}

      {/* 프로필 아바타 — 이미지 없으면 회색 기본 실루엣 */}
      <ProfileAvatar
        imageUrl={user?.profileImageUrl}
        alt="내 프로필"
        size="md"
      />

      <div className="flex-1 space-y-6">
        {/* 별점 · 스포일러 토글 */}
        <div className="flex justify-between items-center">
          {/* 별점 */}
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                onClick={() => setRating(i)}
                aria-label={`${i}점`}
                className={cn(
                  "transition-all duration-200",
                  i <= rating
                    ? "text-[#4D41FF] scale-110"
                    : "text-gray-200 hover:text-gray-300"
                )}
              >
                <Star
                  size={28}
                  fill={i <= rating ? "currentColor" : "none"}
                  strokeWidth={2}
                />
              </button>
            ))}
          </div>

          {/* 스포일러 토글 */}
          <button
            onClick={() => setIsSpoilerInput((prev) => !prev)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-[11px] font-bold",
              isSpoilerInput
                ? "bg-red-50 border-red-200 text-red-600"
                : "bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-300"
            )}
          >
            <AlertCircle size={14} />
            스포일러가 있습니다
          </button>
        </div>

        {/* 텍스트 입력 */}
        <div className="relative">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="이 책에 대한 당신의 문장을 남겨주세요."
            disabled={isPending}
            className="w-full text-lg font-medium outline-none placeholder:text-gray-200 resize-none py-2 pr-12 border-b border-gray-100 focus:border-[#4D41FF] transition-all min-h-[40px] disabled:opacity-50"
            rows={1}
          />
          <button
            onClick={handleSubmit}
            disabled={isPending || !comment.trim() || rating === 0}
            aria-label="리뷰 제출"
            className="absolute right-0 bottom-2 text-black hover:text-[#4D41FF] transition-all p-2 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Send size={24} />
          </button>
        </div>

      </div>
    </div>
    </>
  );
}
