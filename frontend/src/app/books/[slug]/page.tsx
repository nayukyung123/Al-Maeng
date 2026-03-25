import type { Metadata } from "next";
import BookDetailClient from "@/components/book/BookDetailClient";

/**
 * Next.js 16 App Router — 동적 라우팅 페이지
 * /books/[slug]
 *
 * - Server Component: params를 await 하여 slug를 추출한 뒤
 *   클라이언트 오케스트레이터(BookDetailClient)에 prop으로 전달.
 * - 실제 데이터 페칭은 모두 클라이언트 컴포넌트에서 React Query로 처리.
 */

type PageProps = {
  params: Promise<{ slug: string }>;
};

/** 동적 메타데이터 — slug 기반으로 SEO 타이틀 설정 */
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `도서 상세 | ${slug}`,
    description: "도서 상세 정보와 독자들의 리뷰를 확인하세요.",
  };
}

export default async function BookDetailPage({ params }: PageProps) {
  const { slug } = await params;

  return <BookDetailClient slug={slug} />;
}
