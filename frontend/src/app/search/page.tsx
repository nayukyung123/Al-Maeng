import type { Metadata } from "next";
import BookSearchResult from "@/components/search/BookSearchResult";

type PageProps = {
  searchParams: Promise<{ q?: string; focus?: string }>;
};

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `"${q}" 검색 결과 | Al-Maeng` : "도서 검색 | Al-Maeng",
    description: q
      ? `"${q}"에 대한 도서 검색 결과를 확인하세요.`
      : "Al-Maeng에서 원하는 도서를 검색하세요.",
  };
}

/**
 * /search?q={keyword}
 * Server Component — URL 파라미터를 읽어 Client Component에 전달
 */
export default async function SearchPage({ searchParams }: PageProps) {
  const { q = "", focus } = await searchParams;
  return <BookSearchResult initialQuery={q} initialAutoFocus={focus === "true"} />;
}
