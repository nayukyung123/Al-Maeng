import { GalleryTicket } from "@/types/ticket";
import { cn } from "@/lib/utils";
import { PhotoCard } from "./PhotoCard";
import { VerticalTicketBackOverlay } from "./VerticalTicketBackOverlay";
import { HorizontalTicketBackOverlay } from "./HorizontalTicketBackOverlay";

interface TicketExportCompositeProps {
  ticket: GalleryTicket & { rating?: number };
  showBackTitle: boolean;
}

/**
 * PNG 저장용 — 3D 플립 없이 앞·뒤를 평면으로 나란히(세로형) / 위아래(가로형) 배치
 */
export function TicketExportComposite({ ticket, showBackTitle }: TicketExportCompositeProps) {
  const isHorizontal = ticket.style?.orientation !== "vertical";
  const shell = cn(
    ticket.templateId === "minimal"
      ? "bg-stone-50 text-stone-900"
      : `${ticket.style?.background || "bg-white"} ${ticket.style?.textColor || "text-stone-900"}`
  );

  const backImg =
    ticket.ticketImageUrl ||
    ticket.coverImageUrl ||
    `https://picsum.photos/seed/${ticket.id}/800/${isHorizontal ? "400" : "800"}`;

  const backFace = !isHorizontal ? (
    <div className={cn("w-[240px] h-[480px] flex flex-col shadow-2xl rounded-lg overflow-hidden relative shrink-0", shell)}>
      <div className="w-full h-full relative z-10 rounded-lg overflow-hidden">
        <img src={backImg} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
        <VerticalTicketBackOverlay
          title={ticket.title}
          completedAt={ticket.completedAt}
          comment={ticket.comment}
          showTitle={showBackTitle}
          templateId={ticket.templateId}
        />
      </div>
      <div className="absolute inset-0 pointer-events-none opacity-[0.05] mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')] z-40 rounded-lg" />
    </div>
  ) : (
    <div className={cn("w-[480px] h-[240px] flex flex-row-reverse shadow-2xl rounded-lg overflow-hidden relative shrink-0", shell)}>
      <div className="flex-1 relative z-10 min-w-0 rounded-r-lg overflow-hidden">
        <HorizontalTicketBackOverlay
          title={ticket.title}
          completedAt={ticket.completedAt}
          comment={ticket.comment}
          showTitle={showBackTitle}
          templateId={ticket.templateId}
        />
      </div>
      <div className="relative border-dashed border-current opacity-20 flex justify-between z-30 w-px h-full border-l-2 py-2 -mx-px flex-col">
        <div
          className={cn(
            "absolute rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] bg-black/90 w-6 h-6 -top-3 -left-[11px]"
          )}
        />
        <div
          className={cn(
            "absolute rounded-full shadow-[inset_0_-2px_4px_rgba(0,0,0,0.1)] bg-black/90 w-6 h-6 -bottom-3 -left-[11px]"
          )}
        />
      </div>
      <div className="shrink-0 p-6 flex items-center justify-center bg-current/5 relative z-10 w-32 h-full border-r border-current/5 rounded-l-lg">
        <div className="text-center opacity-30 -rotate-90 whitespace-nowrap">
          <p className="font-sans font-black text-lg tracking-[0.2em] uppercase">TICKET</p>
          <p className="font-mono text-[10px] font-bold mt-1 tracking-widest">
            {ticket.completedAt.replace(/-/g, "")}
          </p>
        </div>
      </div>
      <div className="absolute inset-0 pointer-events-none opacity-[0.05] mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')] z-40 rounded-lg" />
    </div>
  );

  return (
    <div
      className={cn(
        "inline-flex bg-stone-200/90 p-6 rounded-xl shadow-inner",
        isHorizontal ? "flex-col items-center gap-6" : "flex-row items-center gap-6"
      )}
    >
      <div className="shrink-0 rounded-lg shadow-2xl overflow-hidden">
        <PhotoCard ticket={ticket} holeColor="bg-white" className="shadow-none m-0" />
      </div>
      <div className="shrink-0 rounded-lg overflow-hidden">{backFace}</div>
    </div>
  );
}
