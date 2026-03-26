import { cn } from "@/lib/utils";

interface HorizontalTicketBackOverlayProps {
  title: string;
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
 * 가로형 티켓 뒷면(이미지 영역) — 그라데이션 + 한줄평 + 선택적 제목·완독일
 */
export function HorizontalTicketBackOverlay({
  title,
  completedAt,
  comment,
  showTitle,
  templateId = "classic",
}: HorizontalTicketBackOverlayProps) {
  const text = normalizeComment(comment);
  const dateLine = completedAt.slice(0, 10).replace(/-/g, ".");

  return (
    <div
      className={cn(
        // 기본 배경 + 기본 글자색(상위 container의 textColor/기본색) 사용
        "absolute inset-0 grid grid-rows-[1fr_auto] h-full min-h-0 text-current",
        // 배경 이미지를 제거했기 때문에, 따옴표/텍스트가 너무 강하지 않게만 약한 대비
        "bg-transparent"
      )}
    >
      {/* quote 영역: 하단 영역 높이가 고정이므로 showTitle 토글에도 중앙 정렬이 안정적으로 유지 */}
      <div className="min-h-0 flex items-center justify-center px-4 py-2 overflow-hidden">
        {text ? (
          <div className="relative w-full max-w-[92%] max-h-full">
            <span
              className="absolute top-0 left-0 font-serif text-[1.85rem] leading-none text-current/35 select-none pointer-events-none -translate-x-0.5 -translate-y-0.5"
              aria-hidden
            >
              “
            </span>
            <p
              className={cn(
                "whitespace-pre-line text-sm leading-relaxed text-current/95 text-center px-5 py-3 relative z-10 line-clamp-4",
                templateId === "minimal"
                  ? "not-italic font-medium font-sans"
                  : "italic font-medium font-noto-serif-kr"
              )}
            >
              {text}
            </p>
            <span
              className="absolute bottom-0 right-0 font-serif text-[1.85rem] leading-none text-current/35 select-none pointer-events-none translate-x-0.5 translate-y-0.5"
              aria-hidden
            >
              ”
            </span>
          </div>
        ) : null}
      </div>

      {/* 제목/완독일 ON이면 해당 높이를 제외한 영역의 중앙, OFF면 전체 높이의 중앙 */}
      <div
        className={cn(
          "shrink-0 w-full overflow-hidden transition-[padding,height] duration-200",
          showTitle ? "px-4 pb-3 pt-1 h-[6.5rem]" : "h-0 px-0 pb-0 pt-0"
        )}
      >
        {showTitle ? (
          <div className="h-full flex flex-col justify-end">
            <p className="font-sans font-black text-lg leading-tight uppercase tracking-tight line-clamp-2 border-b-2 border-current/40 pb-1 mb-1 italic">
              {title}
            </p>
            <p className="font-mono font-bold text-[11px] tracking-widest text-current/90 text-right">
              {dateLine}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
