"use client";

import React, { useState, useRef } from "react";
import { X, Download, Loader2, RotateCcw } from "lucide-react";
import { GalleryTicket } from "@/types/ticket";
import { cn } from "@/lib/utils";
import { toPng } from "html-to-image";
import { PhotoCard } from "./PhotoCard";
import { VerticalTicketBackOverlay } from "./VerticalTicketBackOverlay";
import { HorizontalTicketBackOverlay } from "./HorizontalTicketBackOverlay";
import { TicketExportComposite } from "./TicketExportComposite";
import { useVerticalBackTitleVisible } from "@/hooks/useVerticalBackTitleVisible";

interface TicketDetailModalProps {
  ticket: (GalleryTicket & { rating?: number }) | null;
  onClose: () => void;
  onDelete?: (ticketId: number) => Promise<void>;
  /** true면 뒷면 제목 표시 여부를 API(styleData)에서만 읽음. false면 비로그인용 localStorage */
  persistBackTitlePreference?: boolean;
}

export const TicketDetailModal = ({
  ticket,
  onClose,
  onDelete,
  persistBackTitlePreference = false,
}: TicketDetailModalProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);
  const { show: globalShowBackTitle } = useVerticalBackTitleVisible();

  if (!ticket) return null;

  const isHorizontal = ticket.style?.orientation !== "vertical";
  const cardWidth = isHorizontal ? 480 : 240;
  const cardHeight = isHorizontal ? 240 : 480;

  const serverShowBackTitle = ticket.style?.showBackTitle !== false;
  const showVerticalBackTitle = persistBackTitlePreference
    ? serverShowBackTitle
    : globalShowBackTitle;

  const downloadTicket = async () => {
    if (!ticketRef.current) return;
    setIsDownloading(true);
    try {
      const dataUrl = await toPng(ticketRef.current, { quality: 1.0, pixelRatio: 3 });
      const link = document.createElement("a");
      link.download = `al-maeng-ticket-full-${ticket.title.replace(/[\\/:*?"<>|]/g, "_")}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to download ticket:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(ticket.id);
    } catch {
      // 에러가 나도 모달은 닫는다 (쿼리 갱신으로 실제 상태 반영)
    } finally {
      setIsDeleting(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in">
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-white hover:text-[#0033FF] transition-colors z-50"
      >
        <X size={40} />
      </button>

      <div
        className="relative [perspective:2000px] group scale-[0.8] md:scale-100 transition-transform mt-4"
        style={{ width: cardWidth, height: cardHeight }}
      >
        <div
          className={cn(
            "w-full h-full transition-transform duration-1000 [transform-style:preserve-3d] cursor-pointer shadow-2xl rounded-lg relative",
            isFlipped ? "[transform:rotateY(180deg)]" : ""
          )}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className="absolute inset-0 [backface-visibility:hidden]">
            <PhotoCard ticket={ticket} holeColor="bg-black/90" className="shadow-none m-0" />
          </div>

          <div
            className={cn(
              "absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-lg flex shadow-2xl overflow-hidden",
              isHorizontal ? "flex-row-reverse" : "flex-col",
              ticket.templateId === "minimal"
                ? "bg-stone-50 text-stone-900"
                : `${ticket.style?.background || "bg-white"} ${ticket.style?.textColor || "text-stone-900"}`
            )}
          >
            {!isHorizontal ? (
              <div className="w-full h-full relative z-10 rounded-lg overflow-hidden">
                <img
                  src={
                    ticket.ticketImageUrl ||
                    ticket.coverImageUrl ||
                    `https://picsum.photos/seed/${ticket.id}/800/800`
                  }
                  alt="Back Visual"
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                />
                <VerticalTicketBackOverlay
                  title={ticket.title}
                  completedAt={ticket.completedAt}
                  comment={ticket.comment}
                  showTitle={showVerticalBackTitle}
                  templateId={ticket.templateId}
                />
              </div>
            ) : (
              <>
                <div className="flex-1 relative z-10 min-w-0 rounded-r-lg overflow-hidden">
                  <HorizontalTicketBackOverlay
                    title={ticket.title}
                    completedAt={ticket.completedAt}
                    comment={ticket.comment}
                    showTitle={showVerticalBackTitle}
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
              </>
            )}
            <div className="absolute inset-0 pointer-events-none opacity-[0.05] mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')] z-40" />
          </div>
        </div>

        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-white/50 flex items-center gap-2 pointer-events-none whitespace-nowrap">
          <RotateCcw size={16} />
          <span className="text-xs tracking-widest uppercase font-bold">Click to flip</span>
        </div>
      </div>

      <div className="mt-16 md:mt-24 flex items-center gap-3 z-50">
        <button
          onClick={downloadTicket}
          disabled={isDownloading}
          className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:bg-[#0033FF] hover:text-white transition-colors disabled:opacity-50"
        >
          {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          {isDownloading ? "DOWNLOADING..." : "SAVE TICKET"}
        </button>
        {onDelete && (
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {isDeleting && <Loader2 size={16} className="animate-spin" />}
            {isDeleting ? "DELETING..." : "DELETE"}
          </button>
        )}
      </div>

      <div className="fixed -left-[9999px] top-0 w-max pointer-events-none" aria-hidden>
        <div ref={ticketRef} className="inline-block">
          <TicketExportComposite ticket={ticket} showBackTitle={showVerticalBackTitle} />
        </div>
      </div>
    </div>
  );
};
