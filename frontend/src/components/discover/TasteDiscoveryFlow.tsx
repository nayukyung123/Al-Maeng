"use client";

import { Suspense } from "react";
import useDiscoverStore from "@/store/useDiscoverStore";
import ContentSearchStep from "./ContentSearchStep";
import LengthSelectStep from "./LengthSelectStep";
import CurationResultStep, {
  CurationResultSkeleton,
} from "./CurationResultStep";

/**
 * TasteDiscoveryFlow
 * ──────────────────────────────────────────────────
 * 취향 발견 3단계 플로우의 최상위 오케스트레이터
 *
 * - step 1 : ContentSearchStep  (영상 콘텐츠 검색)
 * - step 2 : LengthSelectStep   (독서 분량 선택 + POST /api/curations)
 * - step 3 : CurationResultStep (추천 결과 렌더링)
 *
 * 단계 간 공유 상태는 모두 useDiscoverStore(Zustand)에서 관리
 */
export default function TasteDiscoveryFlow() {
  const step = useDiscoverStore((s) => s.step);

  return (
    <div className="min-h-[80vh] flex flex-col pt-12 md:pt-20 pb-24 px-6 md:px-12 max-w-4xl mx-auto animate-in fade-in duration-500 relative">
      {/* ── 스텝 프로그레스 바 (1·2단계에서만 표시) ── */}
      {step < 3 && (
        <div className="flex items-center gap-2 mb-16">
          {([1, 2] as const).map((i) => (
            <div
              key={i}
              className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"
            >
              <div
                className={`h-full transition-all duration-500 ${
                  step >= i ? "bg-[#0033FF]" : "bg-transparent"
                }`}
                style={{ width: "100%" }}
              />
            </div>
          ))}
        </div>
      )}

      {/* ── 단계별 렌더링 ── */}
      {step === 1 && <ContentSearchStep />}
      {step === 2 && <LengthSelectStep />}
      {step === 3 && (
        <Suspense fallback={<CurationResultSkeleton />}>
          <CurationResultStep />
        </Suspense>
      )}
    </div>
  );
}
