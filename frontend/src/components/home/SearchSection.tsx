"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { fetchBookSuggestions, fetchKeywordRankings } from "@/api/books";
import type { BookSuggestion } from "@/types/home";

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

  // Header 로고 클릭 시 발행되는 이벤트 수신 → 오버레이 닫기
  useEffect(() => {
    const handleClose = () => {
      setIsSearchOpen(false);
      setSearchQuery("");
    };
    window.addEventListener("closeSearchOverlay", handleClose);
    return () => window.removeEventListener("closeSearchOverlay", handleClose);
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
    if (!query.trim()) return;
    setIsSearchOpen(false);
    setSearchQuery("");
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const handleClose = () => {
    setIsSearchOpen(false);
    setSearchQuery("");
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
            className="w-full border-b-2 border-black py-4 pl-2 pr-12 text-xl md:text-2xl font-medium focus:outline-none cursor-pointer placeholder:text-gray-300"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-black">
            <Search size={28} aria-hidden="true" />
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
            className="fixed inset-0 bg-white z-[35] pt-24 md:pt-32 px-6 md:px-12"
          >
            <div className="max-w-7xl mx-auto relative h-full">
              {/* 닫기 버튼 */}
              <button
                type="button"
                onClick={handleClose}
                aria-label="검색 닫기"
                className="absolute right-0 top-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-50"
              >
                <X size={32} strokeWidth={1.5} aria-hidden="true" />
              </button>

              <div className="mt-20 md:mt-32 max-w-5xl mx-auto">
                {/* 검색 입력 */}
                <div className="relative group">
                  <input
                    ref={searchInputRef}
                    type="text"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit(searchQuery)}
                    placeholder="Type a keyword, author, or text"
                    aria-label="도서 검색어 입력"
                    className="w-full bg-transparent border-b border-[#0033FF]/30 py-6 pr-16 text-4xl md:text-7xl font-serif italic font-light focus:outline-none focus:border-[#0033FF] transition-colors placeholder:text-gray-200"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      aria-label="검색어 지우기"
                      className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-gray-300 hover:text-black transition-colors"
                    >
                      <X size={32} aria-hidden="true" />
                    </button>
                  )}

                  {/* 자동완성 드롭다운 */}
                  <AnimatePresence>
                    {showSuggestions && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        role="listbox"
                        aria-label="검색 자동완성"
                        className="absolute top-full left-0 right-0 bg-white border border-gray-100 shadow-2xl mt-4 rounded-sm overflow-hidden z-[60]"
                      >
                        {suggestions.map((book) => (
                          <div
                            key={book.bookId}
                            role="option"
                            aria-selected="false"
                            onClick={() => handleSearchSubmit(book.title)}
                            className="px-8 py-6 hover:bg-gray-50 cursor-pointer flex items-center justify-between group border-b border-gray-50 last:border-0"
                          >
                            <div className="flex flex-col">
                              <span className="text-2xl font-bold group-hover:text-[#0033FF] transition-colors">
                                {book.title}
                              </span>
                              <span className="text-lg text-gray-400">{book.author}</span>
                            </div>
                            <ArrowRight
                              size={24}
                              aria-hidden="true"
                              className="text-gray-300 group-hover:text-[#0033FF] transition-colors"
                            />
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 실시간 검색어 */}
                <div className="mt-16">
                  <h4 className="text-sm font-black text-[#0033FF] uppercase tracking-[0.3em] mb-8">
                    실시간 검색어
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                    {trendingKeywords.map((keyword, idx) => (
                      <button
                        key={keyword}
                        type="button"
                        onClick={() => handleSearchSubmit(keyword)}
                        className="flex items-center gap-6 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors group text-left"
                      >
                        <span className="text-2xl font-serif italic text-gray-300 group-hover:text-[#0033FF] transition-colors w-8">
                          {idx + 1}
                        </span>
                        <span className="text-xl font-bold text-gray-600 group-hover:text-black transition-colors">
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
