"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { Search, X, ArrowLeft, Loader2, BookOpen, ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { fetchBooks } from "@/api/books";
import type { Book } from "@/types/home";

// ─────────────────────────────────────────────────────────────
// 개별 도서 카드
// ─────────────────────────────────────────────────────────────
function BookCard({ book }: { book: Book }) {
  const href = `/books/${book.slug ?? book.id}`;

  return (
    <Link href={href} className="group flex flex-col gap-2">
      {/* 표지 */}
      <div className="relative w-full aspect-[2/3] overflow-hidden rounded-md shadow-sm bg-gray-100 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg">
        {book.coverImageUrl ? (
          <img
            src={book.coverImageUrl}
            alt={book.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        ) : (
          /* Fallback UI */
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex flex-col items-center justify-center gap-2 p-3">
            <BookOpen
              size={24}
              className="text-gray-300 shrink-0"
              aria-hidden="true"
            />
            <span className="text-[10px] text-gray-400 font-medium text-center line-clamp-3 leading-snug">
              {book.title}
            </span>
          </div>
        )}

        {/* 호버 오버레이 */}
        <div className="absolute inset-0 bg-[#0033FF]/0 group-hover:bg-[#0033FF]/10 transition-colors duration-300" />
      </div>

      {/* 텍스트 */}
      <div className="px-0.5">
        <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-[#0033FF] transition-colors">
          {book.title}
        </p>
        <p className="text-xs text-gray-500 truncate mt-0.5">{book.author}</p>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────
// 스켈레톤 그리드
// ─────────────────────────────────────────────────────────────
function SkeletonGrid({ count = 15 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2 animate-pulse">
          <div className="w-full aspect-[2/3] rounded-md bg-gray-100" />
          <div className="h-3.5 bg-gray-100 rounded w-4/5" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 정렬 옵션
// ─────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { label: "정확도순", value: "accuracy" },
  { label: "최신순",   value: "latest"   },
  { label: "평점순",   value: "rating"   },
] as const;
type SortValue = (typeof SORT_OPTIONS)[number]["value"];

// ─────────────────────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────────────────────
interface BookSearchResultProps {
  initialQuery: string;
}

export default function BookSearchResult({
  initialQuery,
}: BookSearchResultProps) {
  const router = useRouter();
  const [inputValue, setInputValue] = useState(initialQuery);
  // 실제로 API에 날리는 쿼리 (제출 시에만 변경)
  const [committedQuery, setCommittedQuery] = useState(initialQuery);
  const [sortType, setSortType] = useState<SortValue>("accuracy");

  // ── 스크롤 감지 → TOP 버튼 표시 여부 ───────────────────
  const [showTopBtn, setShowTopBtn] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowTopBtn(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () =>
    window.scrollTo({ top: 0, behavior: "smooth" });
  const inputRef = useRef<HTMLInputElement>(null);

  // URL이 바뀌면 committedQuery도 동기화 (뒤로가기 등)
  useEffect(() => {
    setInputValue(initialQuery);
    setCommittedQuery(initialQuery);
  }, [initialQuery]);

  // ── 무한 스크롤 데이터 ───────────────────────────────────
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery({
    queryKey: ["book-search", committedQuery, sortType],
    queryFn: ({ pageParam }) =>
      fetchBooks(committedQuery, pageParam as number, 20, sortType),
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      !lastPage.last ? lastPage.number + 1 : undefined,
    enabled: committedQuery.trim().length > 0,
    staleTime: 1000 * 60 * 5,
  });

  const allBooks: Book[] = data?.pages.flatMap((p) => p.content) ?? [];

  // ── useInView 센티널 ─────────────────────────────────────
  const { ref: sentinelRef, inView } = useInView({
    threshold: 0,
    rootMargin: "0px 0px 300px 0px",
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ── 검색 제출 ────────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    // URL 변경으로 인해 initialQuery prop이 바뀌면 useEffect에서 반영됨
  }, [inputValue, router]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSubmit();
    if (e.key === "Escape") inputRef.current?.blur();
  };

  const handleClear = () => {
    setInputValue("");
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-white pt-16">
      {/* ── Sticky 검색바 ── */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-sm border-b border-black/10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex items-center gap-4">
          {/* 뒤로가기 */}
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="뒤로가기"
            className="shrink-0 p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-black"
          >
            <ArrowLeft size={22} aria-hidden="true" />
          </button>

          {/* 검색 입력 */}
          <div className="flex-1 relative flex items-center gap-3 border-b-2 border-black/10 focus-within:border-[#0033FF] transition-colors pb-1">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="제목, 작가, 키워드 검색"
              aria-label="도서 검색어 입력"
              className="flex-1 min-w-0 py-2 text-lg md:text-2xl font-bold italic focus:outline-none bg-transparent placeholder:text-gray-200"
            />

            {/* 지우기 버튼 */}
            <AnimatePresence>
              {inputValue && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  type="button"
                  onClick={handleClear}
                  aria-label="검색어 지우기"
                  className="shrink-0 text-gray-300 hover:text-black transition-colors"
                >
                  <X size={20} aria-hidden="true" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* 검색 버튼 */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!inputValue.trim()}
              aria-label="검색"
              className="shrink-0 text-black hover:text-[#0033FF] transition-colors disabled:opacity-20"
            >
              <Search size={24} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* ── 본문 ── */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-8 pb-24">
        {/* 결과 헤더 */}
        {committedQuery && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          >
            <div className="flex items-baseline gap-3">
              <h1 className="text-xs font-black uppercase tracking-[0.3em] text-[#0033FF]">
                Search Results
              </h1>
              <p className="text-xs text-gray-400 font-medium">
                &ldquo;{committedQuery}&rdquo;
                {allBooks.length > 0 && ` · ${allBooks.length}권 이상`}
              </p>
            </div>

            {/* 정렬 탭 */}
            <div className="flex gap-2" role="tablist" aria-label="검색 결과 정렬">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="tab"
                  aria-selected={sortType === opt.value}
                  onClick={() => setSortType(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    sortType === opt.value
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-black"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── 로딩 스켈레톤 ── */}
        {isLoading && <SkeletonGrid count={20} />}

        {/* ── 에러 ── */}
        {isError && !isLoading && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <p className="text-gray-400 font-medium text-sm">
              검색 중 오류가 발생했어요. 다시 시도해주세요.
            </p>
            <button
              onClick={() => handleSubmit()}
              className="px-6 py-3 bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-[#0033FF] transition-colors"
            >
              다시 검색
            </button>
          </div>
        )}

        {/* ── 검색어 없음 ── */}
        {!committedQuery && !isLoading && (
          <div className="flex flex-col items-center justify-center py-40 gap-3">
            <Search size={40} className="text-gray-200" aria-hidden="true" />
            <p className="text-gray-400 font-medium text-sm">
              검색어를 입력해주세요.
            </p>
          </div>
        )}

        {/* ── 결과 없음 ── */}
        {committedQuery && !isLoading && !isError && allBooks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-40 gap-3">
            <BookOpen
              size={40}
              className="text-gray-200"
              aria-hidden="true"
            />
            <p className="text-sm font-medium text-gray-400 text-center">
              <strong className="text-gray-700">&ldquo;{committedQuery}&rdquo;</strong>
              에 대한 검색 결과가 없어요.
            </p>
            <p className="text-xs text-gray-300">
              다른 키워드로 검색해보세요.
            </p>
          </div>
        )}

        {/* ── 도서 그리드 ── */}
        {allBooks.length > 0 && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6"
            >
              {allBooks.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </motion.div>

            {/* 무한 스크롤 센티널 + 스피너 */}
            <div ref={sentinelRef} className="pt-12 flex justify-center">
              {isFetchingNextPage && (
                <div className="flex flex-col items-center gap-3">
                  <Loader2
                    size={28}
                    className="animate-spin text-[#0033FF]"
                    aria-hidden="true"
                  />
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">
                    Loading
                  </p>
                </div>
              )}
              {!hasNextPage && allBooks.length > 0 && (
                <p className="text-xs text-gray-300 font-medium uppercase tracking-widest py-4">
                  · End of results ·
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── TOP 버튼 ── */}
      <AnimatePresence>
        {showTopBtn && (
          <motion.button
            key="top-btn"
            type="button"
            onClick={scrollToTop}
            aria-label="맨 위로 이동"
            initial={{ opacity: 0, scale: 0.7, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
            className="fixed bottom-8 right-6 md:right-10 z-50 w-13 h-13 rounded-full bg-black text-white flex flex-col items-center justify-center gap-0.5 shadow-xl hover:bg-[#0033FF] transition-colors"
            style={{ width: 52, height: 52 }}
          >
            <ArrowUp size={18} strokeWidth={2.5} aria-hidden="true" />
            <span className="text-[9px] font-black tracking-widest leading-none">
              TOP
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
