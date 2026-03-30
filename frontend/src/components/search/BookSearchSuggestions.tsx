"use client";

import { ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { BookSuggestion } from "@/types/home";
import { cn } from "@/lib/utils";

export type BookSearchSuggestionsVariant = "overlay" | "sticky";

interface BookSearchSuggestionsProps {
  show: boolean;
  suggestions: BookSuggestion[];
  onPickTitle: (title: string) => void;
  variant?: BookSearchSuggestionsVariant;
}

const variantShell: Record<BookSearchSuggestionsVariant, string> = {
  overlay: "z-[60] mt-3 rounded-sm shadow-2xl",
  sticky: "z-50 mt-2 rounded-md shadow-xl",
};

/**
 * 도서 검색 자동완성 드롭다운 — 홈 오버레이·검색 결과 스티키 바에서 공통 사용
 */
export default function BookSearchSuggestions({
  show,
  suggestions,
  onPickTitle,
  variant = "overlay",
}: BookSearchSuggestionsProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          role="listbox"
          aria-label="검색 자동완성"
          className={cn(
            "absolute left-0 right-0 top-full overflow-hidden border border-gray-100 bg-white",
            variantShell[variant]
          )}
        >
          {suggestions.map((book) => (
            <button
              key={book.bookId}
              type="button"
              role="option"
              aria-selected="false"
              onMouseDown={(e) => {
                e.preventDefault();
                onPickTitle(book.title);
              }}
              className="flex w-full cursor-pointer items-center justify-between border-b border-gray-50 px-4 py-3 text-left last:border-0 hover:bg-gray-50 group md:px-6 md:py-4"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-base font-bold transition-colors group-hover:text-[#0033FF] md:text-lg">
                  {book.title}
                </span>
                <span className="truncate text-sm text-gray-400">{book.author}</span>
              </div>
              <ArrowRight
                size={20}
                aria-hidden="true"
                className="shrink-0 text-gray-300 transition-colors group-hover:text-[#0033FF]"
              />
            </button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
