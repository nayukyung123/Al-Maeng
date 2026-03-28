/**
 * DB `tiers.min_exp` 및 V20 마이그레이션과 동일한 티어 로드맵 (완독 권수 기준)
 */
export const TIER_ROADMAP_MAX_BOOKS = 200;

export const TIER_ROADMAP = [
  { code: "IRON", minBooks: 0 },
  { code: "BRONZE", minBooks: 3 },
  { code: "SILVER", minBooks: 7 },
  { code: "GOLD", minBooks: 15 },
  { code: "PLATINUM", minBooks: 25 },
  { code: "EMERALD", minBooks: 40 },
  { code: "DIAMOND", minBooks: 60 },
  { code: "MASTER", minBooks: 90 },
  { code: "GRANDMASTER", minBooks: 130 },
  { code: "CHALLENGER", minBooks: 200 },
] as const;

export type TierRoadmapCode = (typeof TIER_ROADMAP)[number]["code"];

/** 타임라인 검은 진행선 높이 비율(%) */
export function getTierRoadmapLinePercent(completedCount: number): number {
  if (completedCount <= 0) return 0;
  return Math.min(100, (completedCount / TIER_ROADMAP_MAX_BOOKS) * 100);
}

/** 승급 알림 미리보기용 완독 권수(해당 티어 기준 권수, 승급 직후 느낌) */
export function getTierPromotionPreviewBooks(code: string): number {
  const row = TIER_ROADMAP.find((t) => t.code === code);
  if (!row) return 0;
  if (row.minBooks === 0) return 1;
  return row.minBooks;
}
