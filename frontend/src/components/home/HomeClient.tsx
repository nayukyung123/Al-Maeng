"use client";

import { useState, useRef, useEffect } from "react";
import HeroSlider from "./HeroSlider";
import SearchSection from "./SearchSection";
import TodayCuration from "./TodayCuration";
import ContentCuration from "./ContentCuration";
import RankingBoard from "./RankingBoard";

/**
 * Home 페이지 클라이언트 조율 컴포넌트
 *
 * 담당:
 *  - curationIndex: HeroSlider 클릭 → ContentCuration 동기화
 *  - isSearchFixed: TodayCuration 섹션 스크롤 감지 → SearchSection 플로팅 버튼
 *  - curationSectionRef: TodayCuration 위치 추적
 */
export default function HomeClient() {
  const [selectedContentId, setSelectedContentId] = useState<number | null>(null);
  const [isSearchFixed, setIsSearchFixed] = useState(false);
  const curationSectionRef = useRef<HTMLDivElement | null>(null);

  // TodayCuration 섹션이 뷰포트 상단에 닿으면 플로팅 검색 버튼 표시
  useEffect(() => {
    const handleScroll = () => {
      if (curationSectionRef.current) {
        const rect = curationSectionRef.current.getBoundingClientRect();
        setIsSearchFixed(rect.top <= 100);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // /?openSearch=1 로 진입 시 URL 정리 후 홈과 동일한 풀스크린 검색 오버레이 오픈
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("openSearch") !== "1") return;
    const path = window.location.pathname || "/";
    window.history.replaceState(null, "", path);
    queueMicrotask(() => {
      window.dispatchEvent(new CustomEvent("openSearchOverlay"));
    });
  }, []);

  const handleBannerClick = (contentId: number) => {
    setSelectedContentId(contentId);
    document.getElementById("section3")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex flex-col gap-16 pb-24 pt-20 md:pt-12 px-6 md:px-12 animate-in fade-in duration-500">
      {/* 히어로 배너 슬라이더 */}
      <HeroSlider onBannerClick={handleBannerClick} />

      {/* 검색 바 (정적) + 플로팅 버튼 + 풀스크린 오버레이 */}
      <SearchSection isSearchFixed={isSearchFixed} />

      {/* 오늘의 도서 추천 (인증 필요) */}
      <TodayCuration sectionRef={curationSectionRef} />

      {/* 영화 기반 크로스 추천 */}
      <ContentCuration selectedContentId={selectedContentId} />

      {/* 인기 도서 랭킹 */}
      <RankingBoard />
    </div>
  );
}
