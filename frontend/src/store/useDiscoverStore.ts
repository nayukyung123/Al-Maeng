import { create } from "zustand";
import type { ContentSuggestion, CurationSection } from "@/api/curation";

/** 독서 분량 타입 */
export type BookLength = "SHORT" | "MEDIUM" | "LONG";

/** 취향 발견 플로우 단계 */
export type DiscoverStep = 1 | 2 | 3;

interface DiscoverState {
  // ── 현재 단계 ──────────────────────────────────────────────
  step: DiscoverStep;

  // ── 1단계: 선택한 영상 콘텐츠 ────────────────────────────
  selectedContent: ContentSuggestion | null;

  // ── 2단계: 선택한 독서 분량 ──────────────────────────────
  bookLength: BookLength | null;

  // ── 3단계: 큐레이션 결과 ─────────────────────────────────
  curationResult: CurationSection[];

  // ── Actions ──────────────────────────────────────────────
  setStep: (step: DiscoverStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  setSelectedContent: (content: ContentSuggestion | null) => void;
  setBookLength: (length: BookLength | null) => void;
  setCurationResult: (result: CurationSection[]) => void;
  /** 전체 플로우 초기화 (다시 찾기) */
  reset: () => void;
}

const initialState = {
  step: 1 as DiscoverStep,
  selectedContent: null,
  bookLength: null,
  curationResult: [],
};

const useDiscoverStore = create<DiscoverState>()((set) => ({
  ...initialState,

  setStep: (step) => set({ step }),

  nextStep: () =>
    set((state) => ({
      step: Math.min(3, state.step + 1) as DiscoverStep,
    })),

  prevStep: () =>
    set((state) => ({
      step: Math.max(1, state.step - 1) as DiscoverStep,
    })),

  setSelectedContent: (content) => set({ selectedContent: content }),

  setBookLength: (length) => set({ bookLength: length }),

  setCurationResult: (result) => set({ curationResult: result }),

  reset: () => set({ ...initialState }),
}));

export default useDiscoverStore;
