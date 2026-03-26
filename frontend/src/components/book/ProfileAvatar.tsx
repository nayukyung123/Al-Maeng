"use client";

import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileAvatarProps {
  imageUrl?: string | null;
  alt: string;
  size?: "sm" | "md";
  className?: string;
}

/** 프로필 이미지가 없을 때 회색 배경 + 사람 실루엣 기본 아바타 */
export default function ProfileAvatar({
  imageUrl,
  alt,
  size = "md",
  className,
}: ProfileAvatarProps) {
  const dim = size === "sm" ? "h-12 w-12" : "h-14 w-14";
  const iconSize = size === "sm" ? 22 : 26;

  if (imageUrl) {
    return (
      <div
        className={cn(
          "shrink-0 overflow-hidden rounded-full border border-black/5 bg-gray-100",
          dim,
          className
        )}
      >
        <img
          src={imageUrl}
          alt={alt}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={alt}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border border-black/5 bg-gray-200",
        dim,
        className
      )}
    >
      <User size={iconSize} className="text-gray-400" strokeWidth={1.5} aria-hidden />
    </div>
  );
}
