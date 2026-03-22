import type { Metadata } from "next";
import HomeClient from "@/components/home/HomeClient";

export const metadata: Metadata = {
  title: "Al-Maeng | 취향에 맞는 책을 발견하세요",
  description:
    "영화에서 시작된 독서 여정. Al-Maeng에서 당신만의 북 큐레이션을 경험하세요.",
};

/** 서버 컴포넌트 — SEO 메타데이터만 담당, 렌더링은 HomeClient에 위임 */
export default function HomePage() {
  return <HomeClient />;
}
