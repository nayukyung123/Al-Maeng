"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { fetchRecommendations } from "@/api/bookDetail";
import { formatBookContent } from "@/utils/decode";
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 mb-12">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-full animate-pulse">
              <div className="aspect-[2/3] bg-gray-100 mb-4 rounded-sm" />
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

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-x-6 gap-y-10">
        {recommendations.map((rec, i) => {
          const imgSrc = rec.coverImageUrl
            ? rec.coverImageUrl
            : `https://picsum.photos/seed/${rec.seed ?? `rec${i}`}/400/600`;

          return (
            <div
              key={rec.id}
              onClick={() => router.push(`/books/${rec.slug}?source=book`)}
              className="w-full group cursor-pointer"
            >
              <div className="aspect-[2/3] w-full bg-gray-50 mb-4 relative overflow-hidden shadow-sm group-hover:shadow-xl transition-all duration-500 rounded-sm">
                <img
                  src={imgSrc}
                  alt={rec.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h4 className="text-[11px] font-black uppercase tracking-tight line-clamp-2 mb-1 h-8 leading-tight group-hover:text-[#4D41FF] transition-colors">
                {formatBookContent(rec.title)}
              </h4>
              <p className="text-[10px] text-gray-400 font-serif italic truncate">
                {formatBookContent(rec.author)}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
