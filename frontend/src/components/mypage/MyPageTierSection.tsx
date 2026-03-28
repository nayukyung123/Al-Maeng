import React from "react";
import type { UserProfileResponse } from "@/api/mypage";
import { getTierProgressGradientClass } from "@/lib/tierProgressGradient";

type Tier = UserProfileResponse["tier"];

type TierSectionPart = "all" | "badge" | "progress" | "message";

export default function MyPageTierSection({
  tier,
  part = "all",
}: {
  tier: Tier | undefined;
  part?: TierSectionPart;
}) {
  const tierName =
    tier?.tierName ?? (tier?.id !== null && tier?.id !== undefined ? `LV.${tier.id}` : null);

  const exp = tier?.exp ?? 0;
  const min = tier?.minExp ?? 0;
  const next = tier?.nextMinExp ?? null;

  const pct =
    !tier
      ? 0
      : next !== null
        ? Math.max(0, Math.min(100, ((exp - min) / Math.max(1, next - min)) * 100))
        : 100;

  const message = !tier
    ? "티어 정보를 불러오는 중입니다."
    : next === null
      ? "최고 티어입니다."
      : `다음 티어까지 ${Math.max(0, next - exp)}권 남았습니다.`;

  const badgeEl = (
    <span className="bg-black text-white px-3 py-1 text-[10px] md:text-xs font-bold uppercase tracking-widest shrink-0">
      {tierName ?? "티어 로딩중"}
    </span>
  );

  const progressGradientClass = getTierProgressGradientClass(tier?.tierName ?? null);

  const progressEl = (
    <div className="w-full max-w-sm bg-gray-100 h-2 rounded-full overflow-hidden mb-2 mx-auto md:mx-0">
      <div
        className={`h-full rounded-full ${progressGradientClass}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );

  const messageEl = (
    <p className="text-[10px] md:text-xs text-gray-400 font-medium">{message}</p>
  );

  if (part === "badge") return badgeEl;
  if (part === "progress") return progressEl;
  if (part === "message") return messageEl;
  return (
    <>
      {badgeEl}
      {progressEl}
      {messageEl}
    </>
  );
}

