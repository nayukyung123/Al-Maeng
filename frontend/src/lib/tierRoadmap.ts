/**
 * DB `tiers.min_exp` 및 V20 마이그레이션과 동일한 티어 로드맵 (완독 권수 기준)
 */
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

/**
 * 로드맵 세로 진행선 높이(%). 티어 행을 동일 높이로 보고 현재 티어 행 중심까지 이어짐.
 * `currentTierCode`가 비어 있으면 `completedCount`로 달성한 최고 티어를 사용.
 */
export function getTierRoadmapSpinePercent(
  currentTierCode: string,
  completedCount: number
): number {
  const n = TIER_ROADMAP.length;
  if (n === 0) return 0;
  let idx = currentTierCode
    ? TIER_ROADMAP.findIndex((t) => t.code === currentTierCode)
    : -1;
  if (idx < 0) {
    idx = 0;
    for (let i = 0; i < TIER_ROADMAP.length; i++) {
      if (completedCount >= TIER_ROADMAP[i].minBooks) idx = i;
    }
  }
  return ((idx + 0.5) / n) * 100;
}
