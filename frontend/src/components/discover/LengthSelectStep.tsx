"use client";

import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { createCuration } from "@/api/curation";
import useDiscoverStore, { type BookLength } from "@/store/useDiscoverStore";
import useToastStore from "@/store/useToastStore";

const LENGTH_OPTIONS: { id: BookLength; label: string; desc: string }[] = [
  { id: "LIGHT", label: "짧은 분량", desc: "단숨에 읽기 좋은" },
  { id: "MEDIUM", label: "중간 분량", desc: "반나절 정도 집중하는" },
  { id: "LONG", label: "긴 분량", desc: "며칠간 두고 읽는 대작" },
];

/**
 * 2단계 – 독서 분량 선택
 * - 분량 선택 후 '결과 보기' → POST /api/curations (useMutation)
 * - 성공 시 결과를 Zustand에 저장하고 3단계로 이동
 */
export default function LengthSelectStep() {
  const {
    selectedContent,
    bookLength,
    setBookLength,
    setCurationResult,
    prevStep,
    setStep,
  } = useDiscoverStore();
  const addToast = useToastStore((s) => s.addToast);

  const { mutate, isPending } = useMutation({
    mutationFn: createCuration,
    onSuccess: (data) => {
      setCurationResult(data);
      setStep(3);
    },
    onError: (err) => {
      console.error("큐레이션 생성 실패:", err);
      addToast(
        "추천을 준비하지 못했어요. 잠시 후 다시 시도해주세요.",
        "error"
      );
    },
  });

  const handleShowResults = () => {
    if (!selectedContent || !bookLength || isPending) return;
    mutate({ contentId: selectedContent.id, bookLength });
  };

  return (
    <div className="flex-1 flex flex-col justify-center animate-in slide-in-from-right-8 duration-500">
      {/* Back 버튼 */}
      <button
        onClick={prevStep}
        className="mb-8 flex items-center gap-2 text-gray-400 hover:text-black transition-colors text-sm font-bold uppercase tracking-widest"
      >
        <ArrowRight size={16} className="rotate-180" /> Back
      </button>

      <h2 className="text-3xl md:text-4xl font-black mb-8 md:mb-12 leading-tight">
        <span className="text-sm md:text-base uppercase tracking-[0.3em] text-[#0033FF] block mb-4">
          #{selectedContent?.title}
        </span>
        어느 정도의
        <br />
        호흡을 원하시나요?
      </h2>

      {/* 분량 선택 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {LENGTH_OPTIONS.map((l) => (
          <button
            key={l.id}
            onClick={() => setBookLength(l.id)}
            className={`flex flex-col items-start p-6 md:p-8 border-2 transition-all duration-300 text-left h-full ${
              bookLength === l.id
                ? "border-[#0033FF] bg-black text-white"
                : "border-black/10 text-gray-400 hover:border-black hover:text-black"
            }`}
          >
            <span className="text-xl md:text-2xl font-black mb-2">
              {l.label}
            </span>
            <span
              className={`text-xs md:text-sm leading-relaxed break-keep ${
                bookLength === l.id ? "text-gray-300" : "text-gray-500"
              }`}
            >
              {l.desc}
            </span>
          </button>
        ))}
      </div>

      {/* Show Results / 로딩 버튼 */}
      <button
        onClick={handleShowResults}
        disabled={!bookLength || isPending}
        className="mt-16 self-end flex items-center gap-4 text-2xl font-black uppercase tracking-widest disabled:opacity-20 hover:text-[#0033FF] transition-colors"
      >
        {isPending ? (
          <>
            Generating <Loader2 size={32} className="animate-spin" />
          </>
        ) : (
          <>
            Show Results <Check size={32} />
          </>
        )}
      </button>
    </div>
  );
}
