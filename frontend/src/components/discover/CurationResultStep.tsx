"use client";

import Image from "next/image";
import Link from "next/link";
import useDiscoverStore from "@/store/useDiscoverStore";
import type { CurationBook, CurationSection } from "@/api/curation";

// ─────────────────────────────────────────────────────────────
// 스켈레톤 컴포넌트
// ─────────────────────────────────────────────────────────────
export function CurationResultSkeleton() {
  return (
    <div className="animate-pulse w-full">
      <div className="h-12 w-1/2 bg-gray-100 mb-4 rounded" />
      <div className="h-4 w-1/3 bg-gray-100 mb-12 rounded" />
      <div className="border-t border-black/10 mb-12" />
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-6 mb-16">
          <div className="h-6 w-40 bg-gray-100 rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-10">
            {[0, 1, 2].map((j) => (
              <div key={j}>
                <div className="w-full aspect-[3/4] bg-gray-100 rounded-sm mb-3" />
                <div className="h-4 bg-gray-100 rounded mb-2" />
                <div className="h-3 w-1/2 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 개별 도서 카드
// ─────────────────────────────────────────────────────────────
function BookCard({ book }: { book: CurationBook }) {
  // slug가 있으면 slug, 없으면 bookId를 경로로 사용
  const href = `/books/${book.slug ?? book.bookId}?source=content`;

  return (
    <Link href={href} className="group cursor-pointer block">
      <div className="w-full aspect-[3/4] bg-gray-100 mb-3 overflow-hidden rounded-sm shadow-md group-hover:shadow-xl transition-all duration-500 relative">
        {/* 책등 효과 */}
        <div className="absolute inset-y-0 left-0 w-[2px] bg-black/10 z-10" />
        {book.coverImageUrl ? (
          <Image
            src={book.coverImageUrl}
            alt={book.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
            <span className="text-xs text-gray-400 font-medium px-2 text-center line-clamp-3">
              {book.title}
            </span>
          </div>
        )}
      </div>
      <h4 className="text-sm md:text-base font-bold leading-tight line-clamp-2 group-hover:text-[#0033FF] transition-colors">
        {book.title}
      </h4>
      <p className="text-[10px] md:text-xs text-gray-400 mt-1 font-medium">
        {book.author}
      </p>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────
// 태그 섹션
// ─────────────────────────────────────────────────────────────
function TagSection({ section }: { section: CurationSection }) {
  // books 배열이 비어있으면 렌더링하지 않음
  if (!section.books || section.books.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-xl md:text-2xl font-black text-[#0033FF]">#</span>
        <h3 className="text-xl md:text-2xl font-black tracking-tight uppercase">
          {section.tagName}
        </h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-10">
        {section.books.map((book) => (
          <BookCard key={book.bookId} book={book} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 메인 결과 컴포넌트
// ─────────────────────────────────────────────────────────────
export default function CurationResultStep() {
  const { curationResult, reset } = useDiscoverStore();

  // 유효한 섹션만 필터링 (books가 1개 이상인 섹션만)
  const validSections = curationResult.filter(
    (s) => Array.isArray(s.books) && s.books.length > 0
  );

  return (
    <div className="animate-in fade-in duration-1000 w-full">
      {/* 헤더 */}
      <div className="text-left mb-8 md:mb-12">
        <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tighter leading-tight mb-4">
          BEYOND THE SCENE
        </h1>
        <p className="text-xs md:text-sm text-gray-400 tracking-[0.3em] font-medium">
          당신이 머물렀던 장면, 그 너머의 페이지들
        </p>
      </div>

      <div className="border-t border-black/10 mb-12" />

      {/* 결과가 없을 때 */}
      {validSections.length === 0 ? (
        <div className="py-16 md:py-24 text-center px-4 max-w-md mx-auto space-y-8">
          <p className="text-gray-600 font-medium text-sm md:text-base leading-relaxed break-keep">
            아직 이 조합에 딱 맞는 책을 찾지 못했어요.
            <br />
            <span className="text-gray-400 text-xs md:text-sm mt-2 inline-block">
              다른 작품이나 분량으로 알맹이 다시 큐레이션해 드릴게요.
            </span>
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-full border-2 border-black text-xs font-black uppercase tracking-[0.2em] hover:bg-[#0033FF] hover:border-[#0033FF] hover:text-white transition-colors"
          >
            처음부터 다시 찾기
          </button>
        </div>
      ) : (
        <div className="space-y-16">
          {validSections.map((section) => (
            <TagSection key={section.tagId} section={section} />
          ))}
        </div>
      )}

      {/* 추천이 있을 때만 — 빈 결과면 위쪽 '처음부터 다시 찾기'만 노출 */}
      {validSections.length > 0 && (
        <div className="mt-32 flex justify-center">
          <button
            type="button"
            onClick={reset}
            className="px-12 py-4 border border-black/20 text-xs font-bold uppercase tracking-[0.3em] hover:bg-black hover:text-white transition-all duration-300 rounded-full"
          >
            다시 찾기
          </button>
        </div>
      )}
    </div>
  );
}
