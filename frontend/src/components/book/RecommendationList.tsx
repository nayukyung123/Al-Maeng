"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { fetchRecommendations } from "@/api/bookDetail";
import type { RecommendedBook } from "@/types/book";

interface RecommendationListProps {
  slug: string;
}

export default function RecommendationList({ slug }: RecommendationListProps) {
  const router = useRouter();

  const { data: recommendations = [], isLoading } = useQuery<RecommendedBook[]>({
    queryKey: ["recommendations", slug],
    queryFn: () => fetchRecommendations(slug),
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <section className="mb-12">
        <h3 className="text-xl font-black uppercase tracking-tight mb-6">
          이런 책은 어떠세요?
        </h3>
        <div className="flex gap-4 overflow-x-hidden pb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="min-w-[140px] animate-pulse">
              <div className="aspect-[2/3] bg-gray-100 mb-4" />
              <div className="h-3 bg-gray-100 rounded mb-2 w-3/4" />
              <div className="h-2 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-12">
      <div className="flex justify-between items-end mb-6">
        <h3 className="text-xl font-black uppercase tracking-tight">
          이런 책은 어떠세요?
        </h3>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-6 hide-scrollbar">
        {recommendations.map((rec, i) => {
          const imgSrc = rec.coverImageUrl
            ? rec.coverImageUrl
            : `https://picsum.photos/seed/${rec.seed ?? `rec${i}`}/400/600`;

          return (
            <div
              key={rec.id}
              onClick={() => router.push(`/books/${rec.slug}?source=book`)}
              className="min-w-[140px] group cursor-pointer"
            >
              <div className="aspect-[2/3] bg-gray-50 mb-4 relative overflow-hidden shadow-sm group-hover:shadow-xl transition-all duration-500">
                <img
                  src={imgSrc}
                  alt={rec.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h4 className="text-xs font-black uppercase tracking-tight line-clamp-1 mb-1">
                {rec.title}
              </h4>
              <p className="text-[10px] text-gray-400 font-serif italic">
                {rec.author}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
