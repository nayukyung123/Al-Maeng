"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, Edit2, Trash2, AlertCircle, EyeOff, X } from "lucide-react";
import { cn } from "@/lib/utils";
import useAuthStore from "@/store/useAuthStore";
import { deleteReview, updateReview } from "@/api/bookDetail";
import type { Review } from "@/types/book";

interface ReviewListProps {
  reviews: Review[];
  slug: string;
}

export default function ReviewList({ reviews, slug }: ReviewListProps) {
  const queryClient = useQueryClient();
  const { isLoggedIn, user } = useAuthStore();

  /** 스포일러 리뷰 중 내용을 공개한 ID 집합 */
  const [revealedIds, setRevealedIds] = useState<Set<number>>(new Set());

  /** 수정 모달 */
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editComment, setEditComment] = useState("");
  const [editRating, setEditRating] = useState(0);
  const [editSpoiler, setEditSpoiler] = useState(false);

  /** 삭제 확인 모달 */
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const toggleSpoilerReveal = (id: number) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openEditModal = (review: Review) => {
    setEditingReview(review);
    setEditComment(review.content);
    setEditRating(review.rating);
    setEditSpoiler(review.spoiler);
  };

  const closeEditModal = () => setEditingReview(null);

  /* ── 리뷰 수정 Mutation ── */
  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: { content: string; rating: number; spoiler: boolean } }) =>
      updateReview(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", slug] });
      closeEditModal();
    },
  });

  /* ── 리뷰 삭제 Mutation ── */
  const deleteMutation = useMutation({
    mutationFn: (reviewId: number) => deleteReview(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", slug] });
      setDeletingId(null);
    },
  });

  const handleEditSubmit = () => {
    if (!editingReview || !editComment.trim() || editRating === 0) return;
    updateMutation.mutate({
      id: editingReview.id,
      body: { content: editComment, rating: editRating, spoiler: editSpoiler },
    });
  };

  if (reviews.length === 0) {
    return (
      <p className="text-gray-400 text-sm font-medium text-center py-16">
        아직 작성된 리뷰가 없습니다. 첫 번째 리뷰를 남겨보세요!
      </p>
    );
  }

  return (
    <>
      {/* ── 수정 모달 ── */}
      {editingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeEditModal}
          />
          <div className="relative z-10 bg-white w-full max-w-lg mx-4 shadow-2xl">
            {/* 상단 포인트 바 */}
            <div className="h-1 w-full bg-[#4D41FF]" />

            <div className="p-8">
              {/* 헤더 */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Edit2 size={16} className="text-[#4D41FF]" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#4D41FF]">
                    리뷰 수정
                  </span>
                </div>
                <button
                  onClick={closeEditModal}
                  aria-label="닫기"
                  className="text-gray-300 hover:text-black transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* 별점 */}
              <div className="flex gap-1 mb-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    onClick={() => setEditRating(i)}
                    aria-label={`${i}점`}
                    className={cn(
                      "transition-all duration-200",
                      i <= editRating
                        ? "text-[#4D41FF] scale-110"
                        : "text-gray-200 hover:text-gray-300"
                    )}
                  >
                    <Star
                      size={24}
                      fill={i <= editRating ? "currentColor" : "none"}
                      strokeWidth={2}
                    />
                  </button>
                ))}
              </div>

              {/* 텍스트 입력 */}
              <textarea
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
                rows={4}
                disabled={updateMutation.isPending}
                placeholder="리뷰 내용을 입력해주세요."
                className="w-full text-base font-medium outline-none resize-none border-b border-gray-100 focus:border-[#4D41FF] transition-all py-2 mb-6 disabled:opacity-50"
              />

              {/* 스포일러 토글 */}
              <button
                onClick={() => setEditSpoiler((prev) => !prev)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-[11px] font-bold mb-8",
                  editSpoiler
                    ? "bg-red-50 border-red-200 text-red-600"
                    : "bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-300"
                )}
              >
                <AlertCircle size={14} />
                스포일러가 있습니다
              </button>

              {/* 버튼 */}
              <div className="flex gap-3">
                <button
                  onClick={closeEditModal}
                  className="flex-1 py-3 border border-gray-200 text-[11px] font-black uppercase tracking-widest hover:border-black transition-all"
                >
                  취소
                </button>
                <button
                  onClick={handleEditSubmit}
                  disabled={
                    updateMutation.isPending ||
                    !editComment.trim() ||
                    editRating === 0
                  }
                  className="flex-1 py-3 bg-black text-white text-[11px] font-black uppercase tracking-widest hover:bg-[#4D41FF] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {updateMutation.isPending ? "저장 중…" : "수정 완료"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 삭제 확인 모달 ── */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setDeletingId(null)}
          />
          <div className="relative z-10 bg-white w-full max-w-sm mx-4 shadow-2xl">
            {/* 상단 포인트 바 */}
            <div className="h-1 w-full bg-black" />

            <div className="p-8">
              <div className="flex items-center gap-2 mb-5">
                <Trash2 size={16} className="text-black" />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  리뷰 삭제
                </span>
              </div>

              <p className="text-base font-black leading-snug tracking-tight mb-2">
                이 리뷰를 삭제할까요?
              </p>
              <p className="text-sm text-gray-400 font-medium mb-8">
                삭제한 리뷰는 복구할 수 없습니다.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingId(null)}
                  className="flex-1 py-3 border border-gray-200 text-[11px] font-black uppercase tracking-widest hover:border-black transition-all"
                >
                  취소
                </button>
                <button
                  onClick={() => deleteMutation.mutate(deletingId)}
                  disabled={deleteMutation.isPending}
                  className="flex-1 py-3 bg-black text-white text-[11px] font-black uppercase tracking-widest hover:bg-red-600 transition-all disabled:opacity-30"
                >
                  {deleteMutation.isPending ? "삭제 중…" : "삭제"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 리뷰 목록 ── */}
      <div className="space-y-12">
        {reviews.map((review, i) => {
          const isRevealed = revealedIds.has(review.id);
          const isOwner = isLoggedIn && user?.id === review.userId;

          const profileSrc = review.profileImageUrl
            ? review.profileImageUrl
            : `https://picsum.photos/seed/user${review.userId ?? i}/200/200`;

          const formattedDate = new Date(review.createdAt).toLocaleDateString(
            "ko-KR",
            { year: "numeric", month: "2-digit", day: "2-digit" }
          );

          return (
            <div key={review.id} className="flex gap-6 relative">
              {/* 프로필 아바타 */}
              <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden shrink-0 border border-black/5">
                <img
                  src={profileSrc}
                  alt={review.nickname}
                  className="w-full h-full object-cover transition-all duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="flex-1">
                {/* 닉네임 · 날짜 */}
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-black text-sm">{review.nickname}</span>
                  <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                    {formattedDate}
                  </span>
                </div>

                {/* 별점 */}
                <div className="flex text-[#4D41FF] mb-4 gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={12}
                      fill={star <= review.rating ? "currentColor" : "none"}
                      strokeWidth={2}
                    />
                  ))}
                </div>

                {/* 리뷰 본문 (스포일러 처리 포함) */}
                <div className="relative">
                  <p
                    className={cn(
                      "text-gray-600 text-base leading-relaxed break-keep font-medium transition-all duration-500",
                      review.spoiler && !isRevealed && "blur-md select-none"
                    )}
                  >
                    {review.content}
                  </p>

                  {/* 스포일러 오버레이 */}
                  {review.spoiler && !isRevealed && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 backdrop-blur-[2px] rounded-lg">
                      <div className="flex items-center gap-2 text-red-600 font-bold text-sm mb-3">
                        <AlertCircle size={16} />
                        스포일러가 있는 리뷰입니다
                      </div>
                      <button
                        onClick={() => toggleSpoilerReveal(review.id)}
                        className="px-4 py-2 bg-black text-white text-[10px] font-bold uppercase tracking-widest hover:bg-[#4D41FF] transition-all"
                      >
                        내용 보기
                      </button>
                    </div>
                  )}

                  {/* 스포일러 숨기기 버튼 */}
                  {review.spoiler && isRevealed && (
                    <button
                      onClick={() => toggleSpoilerReveal(review.id)}
                      className="mt-4 text-[10px] font-bold text-gray-400 hover:text-black flex items-center gap-1 uppercase tracking-widest"
                    >
                      <EyeOff size={12} /> 스포일러 숨기기
                    </button>
                  )}
                </div>
              </div>

              {/* 수정·삭제 버튼 — 본인 리뷰에만 표시 */}
              {isOwner && (
                <div className="absolute top-0 right-0 flex items-center gap-0.5">
                  <button
                    onClick={() => openEditModal(review)}
                    aria-label="리뷰 수정"
                    className="p-1.5 text-gray-300 hover:text-black transition-colors"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => setDeletingId(review.id)}
                    aria-label="리뷰 삭제"
                    className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
