"use client";

import React, { useState, useRef } from "react";
import { X, Download, Loader2 } from "lucide-react";
import { GalleryTicket } from "@/types/ticket";
import { cn } from "@/lib/utils";
import { toPng } from "html-to-image";

interface TicketDetailModalProps {
  ticket: GalleryTicket | null;
  onClose: () => void;
}

export const TicketDetailModal = ({ ticket, onClose }: TicketDetailModalProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  if (!ticket) return null;

  const downloadTicket = async () => {
    if (!ticketRef.current) return;
    setIsDownloading(true);
    try {
      const dataUrl = await toPng(ticketRef.current, { quality: 0.95 });
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in">
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 text-white hover:text-[#0033FF] transition-colors z-50"
      >
        <X size={40} />
      </button>
      
      <div className="w-full max-w-[500px] perspective-1000">
        <div 
          className={`relative w-full aspect-[1/2] transition-transform duration-700 transform-style-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {/* Front Side */}
          <div className={cn(
            "absolute inset-0 backface-hidden bg-white border border-black flex flex-col shadow-2xl rounded-lg overflow-hidden",
            ticket.templateId === 'minimal' ? 'bg-stone-50' : ''
          )}>
            <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/90 rounded-full border-r border-black" />
            <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/90 rounded-full border-l border-black" />
            
            <div className="p-8 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <span className="font-mono text-xs font-bold tracking-[0.3em] uppercase opacity-40">BOOK ADMISSION TICKET</span>
                <span className="font-mono text-xs font-bold text-[#0033FF]">AL-MAENG</span>
              </div>
              <div className={cn(
                "w-full aspect-square mb-6 bg-gray-100 overflow-hidden border border-black shadow-inner",
                ticket.templateId === 'modern' ? 'rounded-full' : 'rounded-none'
              )}>
                <img 
                  crossOrigin="anonymous"
                  src={ticket.ticketImageUrl || ticket.coverImageUrl || `https://picsum.photos/seed/${ticket.id}/800/800`} 
                  alt="Cover" 
                  className={cn(
                    "w-full h-full object-cover",
                    ticket.templateId === 'classic' && !ticket.ticketImageUrl ? 'grayscale contrast-125' : ''
                  )} 
                />
              </div>
              <div className="space-y-2">
                <h3 className={cn(
                  "font-black text-3xl leading-tight uppercase tracking-tighter line-clamp-2 font-serif italic",
                  ticket.templateId === 'minimal' ? 'font-sans not-italic tracking-normal' : ''
                )}>{ticket.title}</h3>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em]">BY {ticket.author}</p>
              </div>
            </div>
            
            <div className="border-t-2 border-dashed border-black/20 p-8 flex flex-col items-center justify-center bg-gray-50/50">
              <div className="w-full h-12 flex justify-between items-end opacity-80 mb-2">
                {Array.from({ length: 30 }).map((_, idx) => (
                  <div key={idx} className="bg-black h-full" style={{ width: `${Math.random() * 3 + 1}px`, height: `${Math.random() * 40 + 60}%` }}></div>
                ))}
              </div>
              <p className="font-mono text-[10px] tracking-[0.4em] opacity-40 uppercase">
                {ticket.id.toString().padStart(4, '0')}-{ticket.completedAt.replace(/-/g, '')}
              </p>
            </div>
          </div>

          {/* Back Side */}
          <div className={cn(
            "absolute inset-0 backface-hidden rotate-y-180 bg-white border border-black flex flex-col shadow-2xl rounded-lg overflow-hidden",
            ticket.templateId === 'minimal' ? 'bg-stone-50' : ''
          )}>
            <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/90 rounded-full border-r border-black" />
            <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/90 rounded-full border-l border-black" />
            
            <div className="p-10 flex-1 flex flex-col">
              <div className="border-b-2 border-black pb-8 mb-10">
                <h3 className="font-black text-2xl uppercase tracking-tight mb-2 font-serif italic">{ticket.title}</h3>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">{ticket.author}</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="font-mono text-[10px] font-bold text-[#0033FF] uppercase tracking-[0.2em]">DATE COMPLETED</span>
                    <span className="font-mono text-sm font-bold">{ticket.completedAt.replace(/-/g, '.')}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 flex flex-col items-center justify-center relative">
                <span className="absolute top-0 left-0 text-7xl text-gray-100 font-serif leading-none">"</span>
                <p className="text-center font-bold text-xl leading-relaxed break-keep px-4 z-10 font-serif italic">
                  {ticket.comment}
                </p>
                <span className="absolute bottom-0 right-0 text-7xl text-gray-100 font-serif leading-none rotate-180">"</span>
              </div>
              
              <div className="mt-10 pt-8 border-t border-black/5 flex flex-wrap gap-2">
                {ticket.genre && <span className="text-[10px] font-bold uppercase tracking-widest bg-black text-white px-4 py-1.5 rounded-full">#{ticket.genre.toUpperCase()}</span>}
                <span className="text-[10px] font-bold uppercase tracking-widest border border-black px-4 py-1.5 rounded-full">#ARCHIVE</span>
                <span className="text-[10px] font-bold uppercase tracking-widest border border-black px-4 py-1.5 rounded-full">#ALMAENG</span>
              </div>
            </div>

            <div className="p-8 bg-gray-50/50 flex justify-center">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  downloadTicket();
                }}
                disabled={isDownloading}
                className="flex items-center gap-2 bg-black text-white px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:bg-[#0033FF] transition-colors disabled:opacity-50"
              >
                {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                {isDownloading ? 'DOWNLOADING...' : 'SAVE TICKET'}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Hidden element for download to ensure full quality and no 3D transform issues */}
      <div className="fixed -left-[9999px] top-0">
        <div ref={ticketRef} className="w-[500px] bg-white p-4">
          <div className={cn(
            "w-full aspect-[1/2] bg-white border border-black flex flex-col rounded-lg overflow-hidden",
            ticket.templateId === 'minimal' ? 'bg-stone-50' : ''
          )}>
            <div className="p-8 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <span className="font-mono text-xs font-bold tracking-[0.3em] uppercase opacity-40">BOOK ADMISSION TICKET</span>
                <span className="font-mono text-xs font-bold text-[#0033FF]">AL-MAENG</span>
              </div>
              <div className={cn(
                "w-full aspect-square mb-6 bg-gray-100 overflow-hidden border border-black shadow-inner",
                ticket.templateId === 'modern' ? 'rounded-full' : 'rounded-none'
              )}>
                <img 
                  crossOrigin="anonymous"
                  src={ticket.ticketImageUrl || ticket.coverImageUrl || `https://picsum.photos/seed/${ticket.id}/800/800`} 
                  alt="Cover" 
                  className={cn(
                    "w-full h-full object-cover",
                    ticket.templateId === 'classic' && !ticket.ticketImageUrl ? 'grayscale contrast-125' : ''
                  )} 
                />
              </div>
              <div className="space-y-2">
                <h3 className={cn(
                  "font-black text-3xl leading-tight uppercase tracking-tighter line-clamp-2 font-serif italic",
                  ticket.templateId === 'minimal' ? 'font-sans not-italic tracking-normal' : ''
                )}>{ticket.title}</h3>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em]">BY {ticket.author}</p>
              </div>
            </div>
            <div className="border-t-2 border-dashed border-black/20 p-8 flex flex-col items-center justify-center bg-gray-50/50">
              <div className="w-full h-12 flex justify-between items-end opacity-80 mb-2">
                {Array.from({ length: 30 }).map((_, idx) => (
                  <div key={idx} className="bg-black h-full" style={{ width: `${Math.random() * 3 + 1}px`, height: `${Math.random() * 40 + 60}%` }}></div>
                ))}
              </div>
              <p className="font-mono text-[10px] tracking-[0.4em] opacity-40 uppercase">
                {ticket.id.toString().padStart(4, '0')}-{ticket.completedAt.replace(/-/g, '')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
