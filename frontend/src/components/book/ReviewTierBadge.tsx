"use client";

import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTierBadgeSolidClass, getTierDisplayLabel } from "@/lib/tierProgressGradient";

interface ReviewTierBadgeProps {
  tierName: string;
  className?: string;
}

/**
 * 리뷰 목록 — 닉네임 옆 티어 (실드 아이콘 + 티어명, 단색)
 */
export default function ReviewTierBadge({ tierName, className }: ReviewTierBadgeProps) {
  const colorClass = getTierBadgeSolidClass(tierName);
  if (!colorClass) return null;

  const label = getTierDisplayLabel(tierName);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 shrink-0",
        colorClass,
        className
      )}
      aria-label={`티어 ${label}`}
    >
      <Shield
        size={14}
        className="shrink-0 fill-current stroke-none"
        strokeWidth={0}
        aria-hidden
      />
      <span className="text-[10px] font-black uppercase tracking-tight leading-none">
        {label}
      </span>
    </span>
  );
}
