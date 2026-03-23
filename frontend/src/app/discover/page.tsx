import type { Metadata } from "next";
import TasteDiscoveryFlow from "@/components/discover/TasteDiscoveryFlow";

export const metadata: Metadata = {
  title: "취향 찾기 | AL-MAENG",
  description:
    "좋아하는 영상 작품을 입력하고 당신만의 책 큐레이션을 발견하세요.",
};

/**
 * /discover 페이지
 *
 * - 서버 컴포넌트로 SEO 메타데이터만 담당
 * - 실제 3단계 플로우는 클라이언트 컴포넌트인 TasteDiscoveryFlow에 위임
 */
export default function DiscoverPage() {
  return <TasteDiscoveryFlow />;
}
