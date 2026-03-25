"use client";

import React, { useState, useRef } from "react";
import { X, Download, Loader2, RotateCcw } from "lucide-react";
import { GalleryTicket } from "@/types/ticket";
import { cn } from "@/lib/utils";
import { toPng } from "html-to-image";
import { PhotoCard } from "./PhotoCard";

interface TicketDetailModalProps {
  ticket: (GalleryTicket & { rating?: number }) | null;
  onClose: () => void;
  onDelete?: (ticketId: number) => Promise<void>;
}

export const TicketDetailModal = ({ ticket, onClose, onDelete }: TicketDetailModalProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  if (!ticket) return null;

  const isHorizontal = ticket.style?.orientation !== 'vertical';
  const cardWidth = isHorizontal ? 480 : 240;
  const cardHeight = isHorizontal ? 240 : 480;

  const downloadTicket = async () => {
    if (!ticketRef.current) return;
    setIsDownloading(true);
    try {
      const dataUrl = await toPng(ticketRef.current, { quality: 1.0, pixelRatio: 3 });
      const link = document.createElement('a');
      link.download = `al-maeng-ticket-${ticket.title}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download ticket:', err);
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
      <button onClick={onClose} className="absolute top-6 right-6 text-white hover:text-[#0033FF] transition-colors z-50">
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
          {/* 앞면 */}
          <div className="absolute inset-0 [backface-visibility:hidden]">
            <PhotoCard ticket={ticket} holeColor="bg-black/90" className="shadow-none m-0" />
          </div>

          {/* 뒷면 */}
          <div className={cn(
            "absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-lg flex shadow-2xl overflow-hidden",
            isHorizontal ? "flex-row-reverse" : "flex-col",
            ticket.templateId === 'minimal' ? 'bg-stone-50 text-stone-900' : `${ticket.style?.background || 'bg-white'} ${ticket.style?.textColor || 'text-stone-900'}`
          )}>
            {!isHorizontal ? (
              // 세로형 뒷면 (이미지 오버레이)
              <div className="w-full h-full relative z-10 rounded-lg overflow-hidden">
                <img 
                  src={ticket.ticketImageUrl || ticket.coverImageUrl || `https://picsum.photos/seed/${ticket.id}/800/800`} 
                  alt="Back Visual" 
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-10 flex flex-col justify-end text-white">
                    <p className="font-sans font-black text-4xl leading-tight uppercase tracking-tight line-clamp-2 border-b-2 border-white pb-2 mb-2 italic">
                        {ticket.title}
                    </p>
                    <p className="font-sans font-bold text-sm tracking-[0.4em] uppercase">Archive</p>
                </div>
              </div>
            ) : (
              // 가로형 뒷면 
              <>
                <div className={cn("flex-1 p-6 flex flex-col items-center justify-center relative z-10 rounded-r-lg")}>
                  <div className="absolute top-6 left-6 font-mono text-[10px] font-bold opacity-40">NO. {ticket.id.toString().padStart(4,'0')}</div>
                  
                  <div className="border-[4px] border-red-600/70 text-red-600 px-6 py-4 flex flex-col items-center justify-center -rotate-6 opacity-80 backdrop-blur-sm shadow-sm">
                    <p className="font-sans font-black text-4xl tracking-tighter uppercase leading-none border-b-[3px] border-red-600/70 pb-2 mb-2">AL-MAENG</p>
                    <p className="font-sans font-bold text-sm tracking-[0.4em] uppercase">Archive</p>
                  </div>

                </div>
                <div className="relative border-dashed border-current opacity-20 flex justify-between z-30 w-px h-full border-l-2 py-2 -mx-px flex-col">
                  <div className={cn("absolute rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] bg-black/90 w-6 h-6 -top-3 -left-[11px]")}/>
                  <div className={cn("absolute rounded-full shadow-[inset_0_-2px_4px_rgba(0,0,0,0.1)] bg-black/90 w-6 h-6 -bottom-3 -left-[11px]")}/>
                </div>
                <div className="shrink-0 p-6 flex items-center justify-center bg-current/5 relative z-10 w-32 h-full border-r border-current/5 rounded-l-lg">
                  <div className="text-center opacity-30 -rotate-90 whitespace-nowrap">
                    <p className="font-sans font-black text-lg tracking-[0.2em] uppercase">TICKET</p>
                    <p className="font-mono text-[10px] font-bold mt-1 tracking-widest">{ticket.completedAt.replace(/-/g, '')}</p>
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
          {isDownloading ? 'DOWNLOADING...' : 'SAVE TICKET'}
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
      
      <div className="fixed -left-[9999px] top-0">
        <div ref={ticketRef} className="bg-transparent p-4 inline-block">
          <PhotoCard ticket={ticket} holeColor="bg-white" />
        </div>
      </div>
    </div>
  );
};