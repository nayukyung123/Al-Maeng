"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowLeft, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { fetchBookSuggestions, fetchKeywordRankings } from "@/api/books";
import type { BookSuggestion } from "@/types/home";
import BookSearchSuggestions from "@/components/search/BookSearchSuggestions";
import {
  clearSearchOverlayReturnTo,
  consumeSearchOverlayReturnTo,
} from "@/lib/searchOverlayReturn";
import {
  MAX_SEARCH_KEYWORD_LENGTH,
  SEARCH_KEYWORD_LENGTH_HINT,
  clampSearchKeyword,
} from "@/lib/searchKeyword";

interface SearchSectionProps {
  /** 스크롤 감지 후 부모에서 주입 — true일 때 하단 플로팅 버튼 표시 */
  isSearchFixed: boolean;
}

export default function SearchSection({ isSearchFixed }: SearchSectionProps) {
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 300ms 디바운스
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 오버레이 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target as Node)
      ) {
        // 결과창만 닫기 (오버레이 자체는 유지)
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Header 로고 클릭 시 발행되는 이벤트 수신 → 오버레이 닫기 (복귀 경로는 버림)
  useEffect(() => {
    const handleClose = () => {
      setIsSearchOpen(false);
      setSearchQuery("");
      clearSearchOverlayReturnTo();
    };
    window.addEventListener("closeSearchOverlay", handleClose);
    return () => window.removeEventListener("closeSearchOverlay", handleClose);
  }, []);

  // 마이페이지·티켓 등에서 홈 검색 오버레이와 동일한 UI로 열기
  useEffect(() => {
    const handleOpen = () => setIsSearchOpen(true);
    window.addEventListener("openSearchOverlay", handleOpen);
    return () => window.removeEventListener("openSearchOverlay", handleOpen);
  }, []);

  // 🟢 자동완성 — GET /api/books/suggestions
  const { data: suggestions = [] } = useQuery<BookSuggestion[]>({
    queryKey: ["suggestions", debouncedQuery],
    queryFn: () => fetchBookSuggestions(debouncedQuery),
    enabled: debouncedQuery.trim().length > 0,
    staleTime: 30_000,
  });

  // 🟢 실시간 검색어 — GET /api/keywords/rankings
  const { data: trendingKeywords = [] } = useQuery<string[]>({
    queryKey: ["keywordRankings"],
    queryFn: fetchKeywordRankings,
    staleTime: 5 * 60 * 1000,
    enabled: isSearchOpen, // 오버레이 열릴 때만 fetch
  });

  const handleSearchSubmit = (query: string) => {
    const q = clampSearchKeyword(query.trim());
    if (!q) return;
    setIsSearchOpen(false);
    setSearchQuery("");
    clearSearchOverlayReturnTo();
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  /** 닫기(X): 다른 페이지에서 열었으면 그 페이지로 복귀 */
  const handleClose = () => {
    setIsSearchOpen(false);
    setSearchQuery("");
    const back = consumeSearchOverlayReturnTo();
    if (back) router.push(back);
  };

  const showSuggestions = debouncedQuery.trim().length > 0 && suggestions.length > 0;

  return (
    <>
      {/* ── 페이지 내 정적 검색 바 ── */}
      <div className="relative w-full max-w-2xl mx-auto z-30">
        <div onClick={() => setIsSearchOpen(true)} className="relative cursor-pointer">
          <input
            type="text"
            readOnly
            placeholder="어떤 텍스트를 찾고 있나요?"
            className="w-full cursor-pointer border-b-2 border-black py-3 pl-2 pr-11 text-lg font-medium placeholder:text-gray-300 focus:outline-none md:py-3.5 md:text-xl md:pr-12"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-black">
            <Search size={24} aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* ── 하단 플로팅 검색 버튼 (스크롤 시 노출) ── */}
      <AnimatePresence>
        {isSearchFixed && !isSearchOpen && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
          >
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              aria-label="검색 열기"
              className="bg-black text-white px-8 py-4 rounded-full flex items-center gap-3 shadow-2xl hover:scale-105 transition-transform active:scale-95"
            >
              <Search size={20} aria-hidden="true" />
              <span className="font-black text-sm tracking-widest uppercase">Search</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 풀스크린 검색 오버레이 ── */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[35] bg-white px-6 pt-20 md:px-12 md:pt-24"
          >
            <div className="relative mx-auto h-full max-w-7xl">
              {/* 뒤로가기 — 오버레이 닫기 (입력 지우기 X와 구분) */}
              <button
                type="button"
                onClick={handleClose}
                aria-label="검색 닫기"
                className="absolute left-0 top-2 z-50 rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-black"
              >
                <ArrowLeft size={26} strokeWidth={2} aria-hidden="true" />
              </button>

              <div className="mx-auto mt-10 max-w-3xl pl-10 md:mt-16 md:pl-11">
                {/* 검색 입력 */}
                <div className="relative group">
                  <input
                    ref={searchInputRef}
                    type="text"
                    autoFocus
                    value={searchQuery}
                    maxLength={MAX_SEARCH_KEYWORD_LENGTH}
                    onChange={(e) =>
                      setSearchQuery(clampSearchKeyword(e.target.value))
                    }
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleSearchSubmit(searchQuery)
                    }
                    placeholder="Type a keyword, author, or text"
                    aria-label="도서 검색어 입력"
                    aria-describedby={
                      searchQuery.length >= MAX_SEARCH_KEYWORD_LENGTH
                        ? "home-search-keyword-length-hint"
                        : undefined
                    }
                    className="w-full border-b border-[#0033FF]/30 bg-transparent py-3 pr-12 font-serif text-xl font-light italic transition-colors placeholder:text-gray-200 focus:border-[#0033FF] focus:outline-none md:py-4 md:text-2xl md:pr-14"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      aria-label="검색어 지우기"
                      className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 text-gray-300 transition-colors hover:text-black"
                    >
                      <X size={22} aria-hidden="true" />
                    </button>
                  )}

                  <BookSearchSuggestions
                    variant="overlay"
                    show={showSuggestions}
                    suggestions={suggestions}
                    onPickTitle={handleSearchSubmit}
                  />
                </div>

                {searchQuery.length >= MAX_SEARCH_KEYWORD_LENGTH && (
                  <p
                    id="home-search-keyword-length-hint"
                    className="mt-3 text-sm font-medium text-red-600"
                    role="status"
                  >
                    {SEARCH_KEYWORD_LENGTH_HINT}
                  </p>
                )}

                {/* 실시간 검색어 */}
                <div className="mt-10 md:mt-12">
                  <h4 className="mb-5 text-xs font-black uppercase tracking-[0.3em] text-[#0033FF] md:mb-6">
                    실시간 검색어
                  </h4>
                  <div className="grid grid-cols-1 gap-y-1 gap-x-8 md:grid-cols-2 md:gap-y-2">
                    {trendingKeywords.map((keyword, idx) => (
                      <button
                        key={keyword}
                        type="button"
                        onClick={() => handleSearchSubmit(keyword)}
                        className="group flex items-center gap-4 border-b border-gray-50 py-2.5 text-left transition-colors hover:bg-gray-50 md:gap-5 md:py-3"
                      >
                        <span className="w-6 font-serif text-lg italic text-gray-300 transition-colors group-hover:text-[#0033FF] md:text-xl">
                          {idx + 1}
                        </span>
                        <span className="text-base font-bold text-gray-600 transition-colors group-hover:text-black md:text-lg">
                          {keyword}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
