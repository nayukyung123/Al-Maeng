"use client";

import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchBanners, type BannerResponse } from "@/api/banners";
import { formatBookContent } from "@/utils/decode";

interface HeroSliderProps {
  /** 배너 클릭 시 해당 배너의 contentId를 부모로 전달 (ContentCuration 동기화 용) */
  onBannerClick: (contentId: number) => void;
}

export default function HeroSlider({ onBannerClick }: HeroSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const { data: banners = [], isLoading } = useQuery<BannerResponse[]>({
    queryKey: ["banners"],
    queryFn: fetchBanners,
    staleTime: 10 * 60 * 1000,
  });

  // 3초마다 슬라이드 자동 이동
  useEffect(() => {
    if (banners.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [banners.length]);

  // 화면 밀림(CLS) 방지를 위한 동사이즈 스켈레톤 UI
  if (isLoading) {
    return (
      <div className="w-full h-[60vh] md:h-[500px] bg-gray-900 animate-pulse flex items-center justify-center">
        <span className="sr-only">배너 로딩 중...</span>
      </div>
    );
  }

  if (banners.length === 0) return null;

  return (
    <div
      onClick={() => {
        const banner = banners[currentSlide];
        if (banner) onBannerClick(banner.contentId);
      }}
      className="cursor-pointer group relative w-full h-[60vh] md:h-[500px] bg-black overflow-hidden"
    >
      {/* 슬라이드 트랙 */}
      <div
        className="flex w-full h-full transition-transform duration-700 ease-in-out gap-4"
        style={{
          transform: `translateX(calc(-${currentSlide * 88}% - ${currentSlide * 16}px + 6%))`,
        }}
      >
        {banners.map((slide, index) => (
          <div
            key={slide.contentId}
            className={`w-[88%] h-full shrink-0 relative text-white flex flex-col justify-end p-8 md:p-16 transition-all duration-700 ${
              currentSlide === index ? "scale-100" : "scale-[0.98]"
            }`}
          >
            {slide.bannerPosterUrl ? (
              <img
                src={slide.bannerPosterUrl}
                alt={slide.title}
                className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 mix-blend-luminosity ${
                  currentSlide === index
                    ? "opacity-40"
                    : "opacity-10 brightness-[0.3]"
                }`}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div
                className={`absolute inset-0 w-full h-full transition-all duration-700 ${
                  currentSlide === index ? "bg-black opacity-40" : "bg-black opacity-10"
                }`}
              />
            )}
            {/* 비활성 슬라이드 어둡게 */}
            <div
              className={`absolute inset-0 bg-black/40 transition-opacity duration-700 ${
                currentSlide === index ? "opacity-0" : "opacity-100"
              }`}
            />

            <div
              className={`relative z-10 max-w-3xl transition-all duration-700 ${
                currentSlide === index
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-4"
              }`}
            >
              <p className="text-[#0033FF] font-mono text-sm md:text-base mb-4 tracking-widest uppercase">
                Curation of the Day
              </p>
              <h2 className="text-4xl md:text-6xl font-black leading-[1.1] tracking-tight mb-6 break-keep">
                <span className="italic font-serif font-light">{formatBookContent(slide.title)}</span>,
                <br />이 작품은 어떠신가요?
              </h2>
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest group-hover:text-[#0033FF] transition-colors">
                Discover <ArrowRight size={16} aria-hidden="true" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 슬라이드 인디케이터 */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-3 z-20">
        {banners.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentSlide(index);
            }}
            aria-label={`슬라이드 ${index + 1}로 이동`}
            className={`h-2 rounded-full transition-all duration-300 ${
              currentSlide === index
                ? "bg-[#0033FF] w-8"
                : "bg-white/50 w-2 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
