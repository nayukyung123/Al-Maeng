"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useDebounce } from "@/hooks/useDebounce";
import {
  fetchContentSuggestions,
  type ContentSuggestion,
} from "@/api/curation";
import useDiscoverStore from "@/store/useDiscoverStore";
import useAuthStore from "@/store/useAuthStore";
import AuthGate from "./AuthGate";

/**
 * 1단계 – 영상 작품 검색
 *
 * - 자동완성: 디바운싱된 키워드로 GET /api/contents/suggestions 호출
 *   → ContentSuggestionResponse({ id, title }) 배열 반환
 * - 구분선 아래 인라인 카드 목록으로 결과 표시
 * - 항목 선택 → Zustand selectedContent에 { id, title } 저장
 * - 비로그인 상태에서 Next 클릭 시 AuthGate 표시
 */
export default function ContentSearchStep() {
  const [keyword, setKeyword] = useState("");
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const debouncedKeyword = useDebounce(keyword, 400);

  const { selectedContent, setSelectedContent, nextStep } = useDiscoverStore();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  // ── 자동완성: GET /api/contents/suggestions ───────────────
  const { data: suggestions = [], isFetching } = useQuery({
    queryKey: ["content-suggestions", debouncedKeyword],
    queryFn: () => fetchContentSuggestions(debouncedKeyword),
    enabled: debouncedKeyword.trim().length > 0,
    staleTime: 1000 * 60 * 3,
  });

  // 결과 패널 표시 조건: 포커스 중이고 키워드가 있을 때
  const showResults = isFocused && keyword.trim().length > 0;

  // ── 검색어 변경 핸들러 ───────────────────────────────────
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setKeyword(value);
      if (selectedContent && selectedContent.title !== value) {
        setSelectedContent(null);
      }
    },
    [selectedContent, setSelectedContent]
  );

  // ── 입력 초기화 ──────────────────────────────────────────
  const handleClear = useCallback(() => {
    setKeyword("");
    setSelectedContent(null);
  }, [setSelectedContent]);

  // ── 결과 항목 선택 ───────────────────────────────────────
  const handleSelect = useCallback(
    (item: ContentSuggestion) => {
      setSelectedContent(item);
      setKeyword(item.title);
      setIsFocused(false);
    },
    [setSelectedContent]
  );

  // ── Next 버튼 처리 ────────────────────────────────────────
  const handleNext = useCallback(() => {
    if (!selectedContent) return;
    if (!isLoggedIn) {
      setShowAuthGate(true);
      return;
    }
    nextStep();
  }, [selectedContent, isLoggedIn, nextStep]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (suggestions.length > 0 && !selectedContent) {
        handleSelect(suggestions[0]);
      } else if (selectedContent) {
        handleNext();
      }
    }
    if (e.key === "Escape") {
      setIsFocused(false);
    }
  };

  return (
    <>
      <AuthGate
        isVisible={showAuthGate}
        onClose={() => setShowAuthGate(false)}
      />

      <div className="flex-1 flex flex-col justify-center animate-in slide-in-from-right-8 duration-500">
        <h2 className="text-3xl md:text-5xl font-black mb-12 leading-tight">
          가장 최근에
          <br />
          <span className="text-[#0033FF]">심장을 뛰게 한</span>
          <br />
          영상 작품은 무엇인가요?
        </h2>

        {/* ── 검색 영역 ── */}
        <div className="w-full">
          {/* 입력창 행 */}
          <div className="flex items-center gap-3 pb-1">
            <input
              type="text"
              value={keyword}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 150)}
              placeholder="영화, 드라마 제목 검색"
              className="flex-1 min-w-0 py-3 text-2xl md:text-4xl font-bold italic focus:outline-none transition-colors placeholder:text-gray-200 bg-transparent"
            />
            {/* X 버튼: 입력값이 있을 때만 표시 */}
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
          </div>

          {/* 구분선 */}
          <div
            className={`h-px transition-colors duration-300 ${
              isFocused ? "bg-[#0033FF]" : "bg-black/15"
            }`}
          />

          {/* ── 자동완성 결과 패널 ── */}
          <AnimatePresence>
            {showResults && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="mt-2 max-h-64 overflow-y-auto space-y-1"
              >
                {/* 로딩 스켈레톤 */}
                {isFetching &&
                  [0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-5 py-4 rounded-2xl bg-gray-50 animate-pulse"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="h-4 w-2/3 bg-gray-200 rounded" />
                        <div className="h-3 w-1/4 bg-gray-100 rounded" />
                      </div>
                    </div>
                  ))}

                {/* 결과 카드 목록 */}
                {!isFetching &&
                  suggestions.map((item) => (
                    <button
                      key={item.id}
                      onMouseDown={() => handleSelect(item)}
                      className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-white border border-black/8 hover:border-[#0033FF]/40 hover:bg-blue-50/40 transition-all duration-200 text-left group shadow-sm"
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

                {/* 결과 없음 */}
                {!isFetching &&
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

        {/* Next 버튼 */}
        <button
          onClick={handleNext}
          disabled={!selectedContent}
          className="mt-16 self-end flex items-center gap-4 text-2xl font-black uppercase tracking-widest disabled:opacity-20 hover:text-[#0033FF] transition-colors"
        >
          Next <ArrowRight size={32} />
        </button>
      </div>
    </>
  );
}
