"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { ArrowRight, X, Search, Loader2, ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useDebounce } from "@/hooks/useDebounce";
import {
  fetchContentSuggestions,
  searchContents,
  type ContentSuggestion,
  type ContentItem,
} from "@/api/curation";
import useDiscoverStore, { type ContentSortType } from "@/store/useDiscoverStore";
import useAuthStore from "@/store/useAuthStore";
import {
  MAX_SEARCH_KEYWORD_LENGTH,
  SEARCH_KEYWORD_LENGTH_HINT,
  clampSearchKeyword,
} from "@/lib/searchKeyword";
import AuthGate from "./AuthGate";

/**
 * 1단계 – 영상 작품 검색
 *
 * 레이아웃 (위 → 아래, 페이지 전체 스크롤)
 *   ① 타이틀
 *   ② 검색 입력창 + 자동완성 패널 (absolute overlay)
 *   ③ Next 버튼 (검색창 바로 아래 고정)
 *   ④ 검색 결과 그리드 (페이지 스크롤 + useInView 무한 스크롤)
 *
 * [자동완성]  typing + focus → GET /api/contents/suggestions (debounced 400ms)
 * [전체 검색] Enter / 돋보기  → GET /api/contents  (Slice: last·number·content)
 *              └ last === false  →  getNextPageParam: number + 1
 * [무한 스크롤] react-intersection-observer useInView → 센티널 진입 시 fetchNextPage
 */
// ─────────────────────────────────────────────────────────────
// 정렬 옵션
// ─────────────────────────────────────────────────────────────
const SORT_OPTIONS: { label: string; value: ContentSortType }[] = [
  { label: "정확도순", value: "accuracy" },
  { label: "최신순", value: "latest" },
];

export default function ContentSearchStep() {
  const keyword = useDiscoverStore((s) => s.contentSearchKeyword);
  const committedSearch = useDiscoverStore((s) => s.contentCommittedSearch);
  const sortType = useDiscoverStore((s) => s.contentSortType);
  const setKeyword = useDiscoverStore((s) => s.setContentSearchKeyword);
  const setCommittedSearch = useDiscoverStore((s) => s.setContentCommittedSearch);
  const setSortType = useDiscoverStore((s) => s.setContentSortType);
  const [showTopBtn, setShowTopBtn] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTopBtn(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // 새 검색 시 결과 영역 상단 스크롤용
  const resultsTopRef = useRef<HTMLDivElement>(null);

  const debouncedKeyword = useDebounce(keyword, 400);
  const selectedContent = useDiscoverStore((s) => s.selectedContent);
  const setSelectedContent = useDiscoverStore((s) => s.setSelectedContent);
  const nextStep = useDiscoverStore((s) => s.nextStep);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  // ── 자동완성: GET /api/contents/suggestions ───────────────
  // 비로그인 사용자도 허용 (백엔드 SecurityConfig에서 공개 처리)
  const { data: suggestions = [], isFetching: isSuggestionFetching } =
    useQuery({
      queryKey: ["content-suggestions", debouncedKeyword],
      queryFn: () => fetchContentSuggestions(debouncedKeyword),
      enabled: debouncedKeyword.trim().length > 0,
      staleTime: 1000 * 60 * 3,
    });

  const showSuggestions = isFocused && keyword.trim().length > 0;

  // ── 전체 검색: GET /api/contents (useInfiniteQuery) ───────
  const {
    data: searchData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isSearchLoading,
  } = useInfiniteQuery({
    queryKey: ["contents-search", committedSearch, sortType],
    queryFn: ({ pageParam }) =>
      searchContents(committedSearch, pageParam as number, 10, sortType),
    initialPageParam: 0,
    /**
     * Spring Slice 스펙:
     *   last === false  →  다음 페이지 존재  →  number + 1 반환
     *   last === true   →  마지막 페이지      →  undefined 반환 (로드 중단)
     */
    getNextPageParam: (lastPage) =>
      !lastPage.last ? lastPage.number + 1 : undefined,
    enabled: committedSearch.trim().length > 0,
    staleTime: 1000 * 60 * 5,
  });

  const allResults: ContentItem[] =
    searchData?.pages.flatMap((p) => p.content) ?? [];
  const hasSearched = committedSearch.trim().length > 0;

  // ── 무한 스크롤 센티널: useInView ────────────────────────
  // 센티널 div가 뷰포트에 진입하면 fetchNextPage() 호출
  const { ref: sentinelRef, inView } = useInView({
    threshold: 0,
    rootMargin: "0px 0px 200px 0px", // 하단 200px 전에 미리 트리거
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ── 검색 실행 (Enter / 돋보기 버튼) ──────────────────────
  const handleSearch = useCallback(() => {
    const k = clampSearchKeyword(keyword.trim());
    if (!k) return;
    // 비로그인 사용자 → 로그인 안내 팝업
    if (!isLoggedIn) {
      setShowAuthGate(true);
      return;
    }
    setKeyword(k);
    setCommittedSearch(k);
    setIsFocused(false);
    if (selectedContent && selectedContent.title !== k) {
      setSelectedContent(null);
    }
    // 새 검색 시 결과 영역 상단으로 스크롤
    setTimeout(() => {
      resultsTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, [keyword, isLoggedIn, selectedContent, setSelectedContent, setKeyword, setCommittedSearch]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = clampSearchKeyword(e.target.value);
      setKeyword(value);
      if (selectedContent && selectedContent.title !== value) {
        setSelectedContent(null);
      }
    },
    [selectedContent, setSelectedContent, setKeyword]
  );

  const handleClear = useCallback(() => {
    setKeyword("");
    setCommittedSearch("");
    setSelectedContent(null);
  }, [setSelectedContent, setKeyword, setCommittedSearch]);

  // 자동완성 항목 직접 선택 → 검색 결과와 동일하게 쿼리 유지 후 바로 2단계
  const handleSuggestionSelect = useCallback(
    (item: ContentSuggestion) => {
      const t = clampSearchKeyword(item.title);
      setSelectedContent(item);
      setKeyword(t);
      setCommittedSearch(t);
      setIsFocused(false);
      if (!isLoggedIn) {
        setShowAuthGate(true);
        return;
      }
      nextStep();
    },
    [
      setSelectedContent,
      setKeyword,
      setCommittedSearch,
      isLoggedIn,
      nextStep,
    ]
  );

  // 검색 결과 카드 선택 시 바로 분량 선택 단계로
  const handleResultSelect = useCallback(
    (item: ContentItem) => {
      setSelectedContent({ id: item.id, title: item.title });
      if (!isLoggedIn) {
        setShowAuthGate(true);
        return;
      }
      nextStep();
    },
    [setSelectedContent, isLoggedIn, nextStep]
  );

  const handleNext = useCallback(() => {
    if (!selectedContent) return;
    if (!isLoggedIn) {
      setShowAuthGate(true);
      return;
    }
    nextStep();
  }, [selectedContent, isLoggedIn, nextStep]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && keyword.trim()) handleSearch();
    if (e.key === "Escape") setIsFocused(false);
  };

  return (
    <>
      <AuthGate
        isVisible={showAuthGate}
        onClose={() => setShowAuthGate(false)}
      />

      <div className="flex-1 flex flex-col animate-in slide-in-from-right-8 duration-500">

        {/* ① 타이틀 */}
        <h2 className="text-3xl md:text-5xl font-black mb-8 md:mb-10 leading-tight">
          가장 최근에
          <br />
          <span className="text-[#0033FF]">심장을 뛰게 한</span>
          <br />
          영상 작품은 무엇인가요?
        </h2>

        {/* ②③ 검색창 + Next 버튼 – 스크롤 시 상단 고정 */}
        <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-sm pt-4 pb-3 -mx-6 md:-mx-12 px-6 md:px-12">

        {/* ② 검색 입력창 */}
        <div className="relative w-full">
          <div className="flex flex-col gap-0">
            <div className="flex items-center gap-3 pb-1">
              <input
                type="text"
                value={keyword}
                maxLength={MAX_SEARCH_KEYWORD_LENGTH}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 150)}
                placeholder="영화, 드라마 제목 검색"
                aria-describedby={
                  keyword.length >= MAX_SEARCH_KEYWORD_LENGTH
                    ? "content-search-keyword-length-hint"
                    : undefined
                }
                className="min-w-0 flex-1 py-3 text-2xl font-bold italic transition-colors placeholder:text-gray-200 focus:outline-none md:text-4xl bg-transparent"
              />

              <AnimatePresence>
                {keyword && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.15 }}
                    onClick={handleClear}
                    className="shrink-0 text-gray-300 hover:text-black transition-colors"
                    aria-label="검색어 지우기"
                  >
                    <X size={24} />
                  </motion.button>
                )}
              </AnimatePresence>

              <button
                onClick={handleSearch}
                disabled={!keyword.trim()}
                className="shrink-0 text-black hover:text-[#0033FF] transition-colors disabled:opacity-20"
                aria-label="검색"
              >
                <Search size={32} />
              </button>
            </div>
            {keyword.length >= MAX_SEARCH_KEYWORD_LENGTH && (
              <p
                id="content-search-keyword-length-hint"
                className="text-sm font-medium text-red-600"
                role="status"
              >
                {SEARCH_KEYWORD_LENGTH_HINT}
              </p>
            )}
          </div>

          {/* 포커스 시 파란 구분선 */}
          <div
            className={`h-px transition-colors duration-300 ${
              isFocused ? "bg-[#0033FF]" : "bg-black/15"
            }`}
          />

          {/* 자동완성 패널 (absolute overlay) */}
          <AnimatePresence>
            {showSuggestions && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="absolute top-full left-0 right-0 z-50 mt-2 max-h-64 overflow-y-auto space-y-1 bg-white/95 backdrop-blur-sm rounded-b-xl shadow-lg"
              >
                {isSuggestionFetching &&
                  [0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="flex items-center px-5 py-4 rounded-2xl bg-gray-50 animate-pulse"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="h-4 w-2/3 bg-gray-200 rounded" />
                        <div className="h-3 w-1/4 bg-gray-100 rounded" />
                      </div>
                    </div>
                  ))}

                {!isSuggestionFetching &&
                  suggestions.map((item) => (
                    <button
                      key={item.id}
                      onMouseDown={() => handleSuggestionSelect(item)}
                      className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-white border border-black/[0.08] hover:border-[#0033FF]/40 hover:bg-blue-50/40 transition-all duration-200 text-left group shadow-sm"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <p className="text-sm md:text-base font-bold text-black line-clamp-1 group-hover:text-[#0033FF] transition-colors">
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 font-medium">
                          영상 작품
                        </p>
                      </div>
                      <ArrowRight
                        size={16}
                        className="shrink-0 text-gray-300 group-hover:text-[#0033FF] transition-colors"
                      />
                    </button>
                  ))}

                {!isSuggestionFetching &&
                  debouncedKeyword.trim().length > 0 &&
                  suggestions.length === 0 && (
                    <div className="px-5 py-4 text-sm text-gray-400 font-medium text-center">
                      검색 결과가 없습니다.
                    </div>
                  )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ③ Next 버튼 */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleNext}
            disabled={!selectedContent}
            className="flex items-center gap-4 text-2xl font-black uppercase tracking-widest disabled:opacity-20 hover:text-[#0033FF] transition-colors"
          >
            Next <ArrowRight size={32} />
          </button>
        </div>

        </div>{/* /sticky wrapper */}

        {/* ④ 검색 결과 그리드 (페이지 자연 스크롤) */}
        {hasSearched && (
          <div
            ref={resultsTopRef}
            className="mt-8 animate-in fade-in duration-500"
          >
            {isSearchLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 size={32} className="animate-spin text-[#0033FF]" />
              </div>
            ) : allResults.length > 0 ? (
              <>
                {/* 정렬 탭 */}
                <div className="flex items-center justify-between mb-6">
                  <p className="text-xs text-gray-400 font-medium">
                    &ldquo;{committedSearch}&rdquo; 검색 결과
                  </p>
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
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                  {allResults.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleResultSelect(item)}
                      className="group cursor-pointer flex flex-col gap-3"
                    >
                      <div
                        className={`w-full aspect-[2/3] overflow-hidden rounded-sm bg-gray-100 shadow-sm transition-all duration-300 group-hover:-translate-y-1 group-hover:scale-105 group-hover:shadow-lg ${
                          selectedContent?.id === item.id
                            ? "ring-4 ring-[#0033FF] ring-offset-4"
                            : ""
                        }`}
                      >
                        {item.posterUrl ? (
                          <img
                            src={item.posterUrl}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center p-2">
                            <span className="text-xs text-gray-400 text-center line-clamp-3">
                              {item.title}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="px-1">
                        <h4 className="font-semibold text-sm md:text-base line-clamp-1 group-hover:text-[#0033FF] transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-xs md:text-sm text-gray-500">
                          {item.type === "MOVIE"
                            ? "영화"
                            : item.type === "DRAMA"
                            ? "드라마"
                            : item.type}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 무한 스크롤 센티널 + 로딩 스피너 */}
                <div ref={sentinelRef} className="py-10 flex justify-center">
                  {isFetchingNextPage && (
                    <Loader2
                      size={28}
                      className="animate-spin text-[#0033FF]"
                    />
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-16 text-gray-500 font-medium">
                검색 결과가 없습니다.
              </div>
            )}
          </div>
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
            className="fixed bottom-8 right-6 md:right-10 z-50 flex flex-col items-center justify-center gap-0.5 rounded-full bg-black text-white shadow-xl hover:bg-[#0033FF] transition-colors"
            style={{ width: 52, height: 52 }}
          >
            <ArrowUp size={18} strokeWidth={2.5} aria-hidden="true" />
            <span className="text-[9px] font-black tracking-widest leading-none">
              TOP
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
