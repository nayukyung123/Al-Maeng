"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Star,
  ExternalLink,
  Heart,
  BookmarkPlus,
  BookmarkMinus,
  Loader2,
  Ticket,
  TicketPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import useAuthStore from "@/store/useAuthStore";
import type { BookDetail } from "@/types/book";
import type { ApiResponse } from "@/types/api";
import type { CompletedBook } from "@/types/completedBook";
import {
  addCompletedBook,
  deleteCompletedBook,
  fetchCompletedBooks,
} from "@/api/completedBooks";
import { useWishlistStatus, useWishlistMutation } from "@/hooks/useWishlist";
import { formatBookContent } from "@/utils/decode";
import { findTicketForBook, ticketForBookQueryKey } from "@/api/tickets";
import type { UserProfileResponse } from "@/api/mypage";
import useToastStore from "@/store/useToastStore";
import TierPromotionModal from "./TierPromotionModal";

type AddCompletedContext = {
  previous: CompletedBook[];
  previousTierId: number | null;
};

/** 완독 API 에러 코드 → 사용자 노출 문구 (백엔드 message와 무관하게 프론트에서 통일) */
const COMPLETED_BOOK_ERROR_USER_MESSAGE: Partial<Record<string, string>> = {
  T001: "이미 완독 리스트에 추가된 도서입니다.",
  T002: "완독 리스트에 존재하지 않는 도서입니다.",
  T006: "먼저 티켓을 삭제해야 완독 리스트에서 제거할 수 있습니다.",
  ALREADY_COMPLETED_BOOK: "이미 완독 리스트에 추가된 도서입니다.",
  COMPLETED_BOOK_NOT_FOUND: "완독 리스트에 존재하지 않는 도서입니다.",
  COMPLETED_BOOK_HAS_TICKET: "먼저 티켓을 삭제해야 완독 리스트에서 제거할 수 있습니다.",
};

interface BookDetailHeroProps {
  book: BookDetail;
  /** 도서 상세 진입 시 유입 경로 — 찜/완독 로그에도 동일하게 사용 */
  source: string;
}

export default function BookDetailHero({ book, source }: BookDetailHeroProps) {
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();
  const addToast = useToastStore((s) => s.addToast);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDescriptionToggle, setShowDescriptionToggle] = useState(false);
  const [tierPromotionOpen, setTierPromotionOpen] = useState(false);
  const [promotionTierName, setPromotionTierName] = useState("");
  const [promotionCompletedCount, setPromotionCompletedCount] = useState(0);
  const descriptionRef = useRef<HTMLDivElement>(null);

  // 설명글이 3줄을 초과하는지 체크 (더보기 버튼 표시 여부 결정)
  useEffect(() => {
    if (descriptionRef.current) {
      const { scrollHeight, clientHeight } = descriptionRef.current;
      if (scrollHeight > clientHeight) {
        setShowDescriptionToggle(true);
      }
    }
  }, [book.description]);
  const queryClient = useQueryClient();

  // 찜하기 상태 및 뮤테이션 (진입 source 그대로 전달)
  const { data: isWishlisted = false } = useWishlistStatus(book.id, isLoggedIn);
  const { addWishlist, removeWishlist } = useWishlistMutation(book.id, source);

  const { data: completedBooks = [] } = useQuery<CompletedBook[]>({
    queryKey: ["completed-books"],
    queryFn: fetchCompletedBooks,
    enabled: isLoggedIn,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const isCompleted = completedBooks.some((completedBook) => completedBook.bookId === book.id);

  const {
    data: ticketForBook,
    isPending: isTicketLookupPending,
  } = useQuery({
    queryKey: ticketForBookQueryKey(book.id),
    queryFn: () => findTicketForBook(book.id),
    enabled: isLoggedIn && isCompleted,
    staleTime: 2 * 60 * 1000,
  });

  const handleCompletedError = (error: unknown) => {
    const axiosError = error as AxiosError<ApiResponse<unknown>>;
    const data = axiosError.response?.data;
    const code = data?.code;
    const serverMessage = data?.message?.trim();

    const completedBookCopy = code ? COMPLETED_BOOK_ERROR_USER_MESSAGE[code] : undefined;
    if (completedBookCopy) {
      addToast(completedBookCopy, "info");
      return;
    }

    addToast(
      serverMessage ||
        "완독 리스트 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      "error"
    );
  };

  const addCompletedMutation = useMutation({
    mutationFn: () =>
      addCompletedBook({
        bookId: book.id,
        source,
      }),
    onMutate: async (): Promise<AddCompletedContext> => {
      const previousTierId =
        queryClient.getQueryData<UserProfileResponse>(["my-profile"])?.tier?.id ?? null;
      await queryClient.cancelQueries({ queryKey: ["completed-books"] });
      const previous = queryClient.getQueryData<CompletedBook[]>(["completed-books"]) ?? [];

      queryClient.setQueryData<CompletedBook[]>(["completed-books"], (old = []) => {
        if (old.some((item) => item.bookId === book.id)) return old;
        return [
          {
            completedBookId: -book.id,
            bookId: book.id,
            slug: book.slug,
            title: book.title,
            author: book.author,
            coverImageUrl: book.coverImageUrl ?? "",
            genreName: "미분류",
            completedAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          },
          ...old,
        ];
      });

      return { previous, previousTierId };
    },
    onSuccess: async (_data, _variables, context) => {
      const oldTierId = context?.previousTierId ?? null;
      await new Promise((r) => setTimeout(r, 500));
      await queryClient.refetchQueries({ queryKey: ["my-profile"] });
      const newProfile = queryClient.getQueryData<UserProfileResponse>(["my-profile"]);
      const newTierId = newProfile?.tier?.id ?? null;
      if (oldTierId != null && newTierId != null && newTierId > oldTierId) {
        setPromotionTierName(newProfile?.tier?.tierName ?? "");
        setPromotionCompletedCount(newProfile?.completedCount ?? 0);
        setTierPromotionOpen(true);
      }
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["completed-books"], context.previous);
      }
      handleCompletedError(error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["completed-books"] });
      queryClient.invalidateQueries({ queryKey: ticketForBookQueryKey(book.id) });
    },
  });

  const deleteCompletedMutation = useMutation({
    mutationFn: () => deleteCompletedBook(book.id, source),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["completed-books"] });
      const previous = queryClient.getQueryData<CompletedBook[]>(["completed-books"]) ?? [];

      queryClient.setQueryData<CompletedBook[]>(
        ["completed-books"],
        (old = []) => old.filter((item) => item.bookId !== book.id)
      );

      return { previous };
    },
    onError: (error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["completed-books"], context.previous);
      }
      handleCompletedError(error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["completed-books"] });
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      queryClient.invalidateQueries({ queryKey: ticketForBookQueryKey(book.id) });
    },
  });

  /** 로그인 필요 동작 — 비로그인 시 로그인 페이지로 이동 */
  const requireAuth = (action: () => void) => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    action();
  };

  const coverSrc = book.coverImageUrl
    ? book.coverImageUrl
    : `https://picsum.photos/seed/${book.seed ?? book.id}/800/1200`;

  return (
    <section className="flex flex-col lg:flex-row gap-8 lg:gap-16 mb-12">
      {/* ── 좌측: 책 표지 ── */}
      <div className="w-full lg:w-[40%] bg-gray-50 aspect-square lg:aspect-auto lg:h-[450px] flex items-center justify-center p-6 rounded-sm">
        <div className="w-full max-w-[240px] aspect-[2/3] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.3)] relative group">
          <img
            src={coverSrc}
            alt={book.title}
            className="w-full h-full object-cover transition-all duration-700"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-black/20 via-transparent to-white/10 pointer-events-none" />
        </div>
      </div>

      {/* ── 우측: 도서 정보 ── */}
      <div className="flex-1 flex flex-col justify-center py-4">
        {/* 장르 · 평점 뱃지 */}
        <div className="flex items-center gap-3 mb-6">
          {book.genre && (
            <>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                {book.genre}
              </span>
              <span className="w-1 h-1 bg-gray-300 rounded-full" />
            </>
          )}
          <div className="flex items-center gap-1">
            <Star size={12} fill="#111" className="text-black" />
            <span className="text-xs font-black">
              {Number(book.averageRating ?? 0).toFixed(1)}
            </span>
          </div>
        </div>

        {/* 제목 · 저자 */}
        <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-3 leading-[1.1] break-keep">
          {formatBookContent(book.title)}
        </h2>
        <p className="text-lg text-gray-400 font-serif italic mb-6">
          {formatBookContent(book.author)}
        </p>

        {/* 상세 설명 (3줄 요약 + 더보기 토글) */}
        {book.description && (
          <div className="mb-8 max-w-xl">
            <div
              ref={descriptionRef}
              className={cn(
                "text-sm leading-relaxed text-gray-600 break-keep font-medium mb-1 transition-all duration-300",
                !isExpanded && "line-clamp-3"
              )}
            >
              {formatBookContent(book.description)}
            </div>
            {showDescriptionToggle && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs font-bold text-gray-400 hover:text-black transition-colors uppercase tracking-wider cursor-pointer"
              >
                {isExpanded ? "[접기]" : "[더보기]"}
              </button>
            )}
          </div>
        )}

        {/* 구매 링크 */}
        <div className="flex flex-wrap gap-2 mb-6">
          <a
            href={book.purchaseUrl ?? "https://www.aladin.co.kr"}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 border border-black bg-white text-[11px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center gap-3 group shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] cursor-pointer"
          >
            <img
              src="https://www.aladin.co.kr/favicon.ico"
              alt="Aladin"
              className="w-4 h-4 transition-all"
              referrerPolicy="no-referrer"
            />
            <span>알라딘에서 구매하기</span>
            <ExternalLink size={12} className="ml-1" />
          </a>
        </div>

        {/* 액션 버튼: 찜하기 · 완독 리스트 */}
        <div className="flex gap-3">
          {/* 찜하기 (Heart) */}
          <button
            onClick={() =>
              requireAuth(() => {
                if (isWishlisted) {
                  removeWishlist();
                } else {
                  addWishlist();
                }
              })
            }
            aria-label={isWishlisted ? "찜 해제" : "찜하기"}
            className={cn(
              "w-14 h-14 border border-gray-200 flex items-center justify-center transition-all relative cursor-pointer",
              isWishlisted
                ? "bg-red-50 border-red-200 text-red-500"
                : "hover:border-black"
            )}
          >
            <motion.div
              key={isWishlisted ? "active" : "inactive"}
              initial={{ scale: 1 }}
              animate={isWishlisted ? { 
                scale: [1, 1.5, 1],
                rotate: [0, 10, -10, 0] 
              } : { scale: 1 }}
              transition={{ duration: 0.4, ease: "backOut" }}
            >
              <Heart size={24} fill={isWishlisted ? "currentColor" : "none"} />
            </motion.div>
            
            {/* 뾰로롱 스파클링 효과 (찜했을 때만) */}
            <AnimatePresence>
              {isWishlisted && (
                <>
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                    <motion.div
                      key={angle}
                      initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                      animate={{ 
                        opacity: 0, 
                        scale: 1, 
                        x: Math.cos((angle * Math.PI) / 180) * 20,
                        y: Math.sin((angle * Math.PI) / 180) * 20 
                      }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5 }}
                      className="absolute w-1 h-1 bg-red-400 rounded-full"
                    />
                  ))}
                </>
              )}
            </AnimatePresence>
          </button>

          {/* 완독: 미추가 시 기존 단일 버튼 / 추가 후 제거 + 티켓 */}
          {!isCompleted ? (
            <button
              onClick={() => requireAuth(() => addCompletedMutation.mutate())}
              disabled={addCompletedMutation.isPending}
              className={cn(
                "flex-1 min-h-14 rounded-none text-white font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-lg cursor-pointer",
                "bg-[#4D41FF] hover:bg-[#3D31EF] shadow-[#4D41FF]/20",
                addCompletedMutation.isPending && "opacity-70 pointer-events-none"
              )}
            >
              <BookmarkPlus size={20} />
              완독 리스트에 추가
            </button>
          ) : (
            <div className="flex flex-1 min-w-0 min-h-14 flex-row gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => requireAuth(() => deleteCompletedMutation.mutate())}
                disabled={deleteCompletedMutation.isPending}
                className={cn(
                  "flex-1 min-w-0 rounded-none border border-gray-300 bg-gray-700 px-3 text-white font-black text-xs sm:text-sm uppercase tracking-[0.12em] sm:tracking-[0.15em]",
                  "flex items-center justify-center gap-2 sm:gap-2.5 shadow-md transition-all cursor-pointer hover:bg-gray-800 hover:border-gray-400",
                  deleteCompletedMutation.isPending && "opacity-70 pointer-events-none"
                )}
              >
                <BookmarkMinus size={18} className="shrink-0 opacity-90" aria-hidden />
                <span className="text-center leading-tight">완독 도서 제거</span>
              </button>
              {isTicketLookupPending ? (
                <div
                  className="flex-1 min-w-0 rounded-none border border-gray-200 bg-white px-3 shadow-md flex items-center justify-center text-gray-400"
                  aria-busy
                >
                  <Loader2 className="animate-spin shrink-0" size={22} aria-label="티켓 여부 확인 중" />
                </div>
              ) : ticketForBook ? (
                <button
                  type="button"
                  onClick={() =>
                    requireAuth(() =>
                      router.push(`/tickets?view=binder&ticketId=${ticketForBook.id}`)
                    )
                  }
                  className={cn(
                    "flex-1 min-w-0 rounded-none border border-black/15 bg-white px-3 text-black font-black text-xs sm:text-sm uppercase tracking-[0.12em] sm:tracking-[0.15em]",
                    "flex items-center justify-center gap-2 sm:gap-2.5 shadow-md transition-all cursor-pointer hover:bg-stone-50 hover:border-black/25"
                  )}
                >
                  <Ticket size={18} className="shrink-0" aria-hidden />
                  <span className="text-center leading-tight">티켓 보러가기</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    requireAuth(() => router.push(`/tickets?issueBookId=${book.id}`))
                  }
                  className={cn(
                    "flex-1 min-w-0 rounded-none border border-[#3D31EF] bg-[#4D41FF] px-3 text-white font-black text-xs sm:text-sm uppercase tracking-[0.12em] sm:tracking-[0.15em]",
                    "flex items-center justify-center gap-2 sm:gap-2.5 shadow-md shadow-[#4D41FF]/25 transition-all cursor-pointer hover:bg-[#3D31EF]"
                  )}
                >
                  <TicketPlus size={18} className="shrink-0 opacity-95" aria-hidden />
                  <span className="text-center leading-tight">티켓 생성</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <TierPromotionModal
        open={tierPromotionOpen}
        tierName={promotionTierName}
        completedCount={promotionCompletedCount}
        onClose={() => setTierPromotionOpen(false)}
      />
    </section>
  );
}
