import { cn } from "@/lib/utils";

interface VerticalTicketBackOverlayProps {
  title: string;
  /** YYYY-MM-DD 등 표시용 완독일 */
  completedAt: string;
  comment?: string | null;
  showTitle: boolean;
  templateId?: string;
}

function normalizeComment(comment: string | null | undefined): string | null {
  if (comment == null) return null;
  const n = comment.replace(/\r\n/g, "\n").trim();
  return n.length > 0 ? n : null;
}

/**
 * 세로형 티켓 뒷면 — 이미지 위 그라데이션 + 한줄평(따옴표, 줄바꿈 반영) + 선택적 제목·완독일(같이 토글)
 */
export function VerticalTicketBackOverlay({
  title,
  completedAt,
  comment,
  showTitle,
  templateId = "classic",
}: VerticalTicketBackOverlayProps) {
  const text = normalizeComment(comment);
  const dateLine = completedAt.slice(0, 10).replace(/-/g, ".");

  return (
    <div
      className={cn(
        "absolute inset-0 bg-gradient-to-t from-black/88 via-black/50 to-black/20",
        "flex flex-col h-full min-h-0 text-white"
      )}
    >
      <div className="flex-1 min-h-0 flex items-center justify-center px-5 sm:px-7 pt-12 pb-2">
        {text ? (
          <div className="relative w-full max-w-[95%]">
            <span
              className="absolute top-0 left-0 font-serif text-[3rem] sm:text-[3.5rem] leading-none text-white/35 select-none pointer-events-none -translate-x-0.5 -translate-y-1"
              aria-hidden
            >
              “
            </span>
            <p
              className={cn(
                "whitespace-pre-line text-base sm:text-lg leading-relaxed text-white/95 text-center px-7 sm:px-9 py-7 relative z-10",
                templateId === "minimal"
                  ? "not-italic font-medium font-sans"
                  : "italic font-medium font-noto-serif-kr"
              )}
            >
              {text}
            </p>
            <span
              className="absolute bottom-0 right-0 font-serif text-[3rem] sm:text-[3.5rem] leading-none text-white/35 select-none pointer-events-none translate-x-0.5 translate-y-1"
              aria-hidden
            >
              ”
            </span>
          </div>
        ) : null}
      </div>

      {/* showTitle 토글에 상관없이 하단 영역 높이는 고정 예약(quote/한줄평 수직 위치 유지) */}
      <div className="shrink-0 px-6 sm:px-8 pb-7 sm:pb-8 pt-2 w-full">
        {showTitle ? (
          <>
            <p className="font-sans font-black text-2xl leading-tight uppercase tracking-tight line-clamp-2 border-b-2 border-white pb-2 mb-2 italic">
              {title}
            </p>
            <p className="font-mono font-bold text-sm tracking-widest text-white/90 text-right">
              {dateLine}
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
