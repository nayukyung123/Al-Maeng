/**
 * 마이페이지 티어 진행률 바용 그라데이션 (Tailwind 클래스)
 * 티어 코드 / 한글 표기 모두 지원
 */
export const TIER_PROGRESS_GRADIENT_CLASSES: Record<string, string> = {
  IRON: "bg-gradient-to-r from-stone-400 to-stone-600",
  BRONZE: "bg-gradient-to-r from-orange-600 to-amber-800",
  SILVER: "bg-gradient-to-r from-slate-300 via-slate-400 to-slate-500",
  GOLD: "bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-600",
  PLATINUM: "bg-gradient-to-r from-cyan-400 to-teal-500",
  EMERALD: "bg-gradient-to-r from-emerald-400 to-green-600",
  DIAMOND: "bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-500",
  MASTER: "bg-gradient-to-r from-purple-400 via-fuchsia-500 to-purple-700",
  GRANDMASTER: "bg-gradient-to-r from-red-500 via-rose-600 to-red-800",
  CHALLENGER: "bg-gradient-to-r from-sky-300 via-amber-400 to-yellow-600",
};

const KO_TO_CODE: Record<string, keyof typeof TIER_PROGRESS_GRADIENT_CLASSES> = {
  아이언: "IRON",
  브론즈: "BRONZE",
  실버: "SILVER",
  골드: "GOLD",
  플래티넘: "PLATINUM",
  에메랄드: "EMERALD",
  다이아: "DIAMOND",
  다이아몬드: "DIAMOND",
  마스터: "MASTER",
  그랜드마스터: "GRANDMASTER",
  챌린저: "CHALLENGER",
};

const DEFAULT_PROGRESS_CLASS = "bg-gradient-to-r from-[#0033FF] to-[#0033FF]";

/** 리뷰 등 티어 뱃지(아이콘·텍스트)용 단색 — 티어표 `text` 컬러와 동일 */
const TIER_BADGE_SOLID_TEXT_CLASSES: Record<string, string> = {
  IRON: "text-stone-500",
  BRONZE: "text-orange-800",
  SILVER: "text-slate-400",
  GOLD: "text-yellow-500",
  PLATINUM: "text-cyan-500",
  EMERALD: "text-emerald-500",
  DIAMOND: "text-[#0033FF]",
  MASTER: "text-[#4D41FF]",
  GRANDMASTER: "text-red-500",
  CHALLENGER: "text-sky-400",
};

function resolveTierCode(
  tierName: string | null | undefined
): keyof typeof TIER_PROGRESS_GRADIENT_CLASSES | null {
  if (!tierName?.trim()) return null;
  const t = tierName.trim();
  const upper = t.toUpperCase();
  if (upper in TIER_PROGRESS_GRADIENT_CLASSES) {
    return upper as keyof typeof TIER_PROGRESS_GRADIENT_CLASSES;
  }
  return KO_TO_CODE[t] ?? null;
}

/** 진행률 막대에 쓸 Tailwind 그라데이션 클래스 */
export function getTierProgressGradientClass(
  tierName: string | null | undefined
): string {
  const code = resolveTierCode(tierName);
  if (!code) return DEFAULT_PROGRESS_CLASS;
  return TIER_PROGRESS_GRADIENT_CLASSES[code] ?? DEFAULT_PROGRESS_CLASS;
}

/** 리뷰 티어 뱃지에 쓸 `text-*` 클래스 (미등록 티어는 null) */
export function getTierBadgeSolidClass(
  tierName: string | null | undefined
): string | null {
  const code = resolveTierCode(tierName);
  if (!code) return null;
  return TIER_BADGE_SOLID_TEXT_CLASSES[code] ?? null;
}

/** 뱃지에 표시할 영문 티어명(대문자) */
export function getTierDisplayLabel(tierName: string): string {
  const code = resolveTierCode(tierName);
  if (code) return code;
  return tierName.trim().toUpperCase();
}
