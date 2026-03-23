import { forwardRef } from 'react';
import { GalleryTicket } from '@/types/ticket';
import { cn } from '@/lib/utils';

interface PhotoCardProps {
  ticket: GalleryTicket;
  className?: string;
  holeColor?: string;
}

export const PhotoCard = forwardRef<HTMLDivElement, PhotoCardProps>(({ ticket, className, holeColor = 'bg-[#f5f2ed]' }, ref) => {
  const templateId = ticket.templateId || 'classic';
  const style = ticket.style || { background: 'bg-white', textColor: 'text-stone-900', font: 'serif' };
  
  const fontClass = {
    serif: 'font-serif',
    sans: 'font-sans',
    mono: 'font-mono',
  }[style.font];

  return (
    <div
      ref={ref}
      className={cn(
        "relative w-[480px] h-[240px] flex rounded-lg shadow-2xl isolation-auto transition-all duration-500", 
        templateId === 'minimal' ? 'bg-stone-50 text-stone-900' : style.background,
        templateId === 'minimal' ? 'text-stone-900' : style.textColor,
        templateId === 'minimal' ? 'font-sans' : fontClass,
        className
      )}
    >
      {/* 왼쪽 메인 섹션 */}
      <div className="flex-1 p-6 flex gap-6 relative z-10 rounded-l-lg">
        {/* Image Section */}
        <div className={cn(
          "w-32 h-full shrink-0 bg-black/5 overflow-hidden border border-current/20 shadow-inner transition-all duration-500",
          templateId === 'modern' ? 'rounded-full' : 'rounded-sm'
        )}>
          <img 
            src={ticket.ticketImageUrl || ticket.coverImageUrl || `https://picsum.photos/seed/${ticket.id}/400/600`} 
            alt={ticket.title} 
            className={cn(
              "w-full h-full object-cover transition-all duration-500",
              templateId === 'classic' && !ticket.ticketImageUrl ? 'grayscale contrast-125' : ''
            )}
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Info Section */}
        <div className="flex-1 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-[9px] uppercase tracking-[0.3em] font-bold opacity-40">
                BOOK ADMISSION
              </span>
              <span className="text-[9px] font-mono opacity-40">
                #{ticket.id.toString().padStart(4, '0')}
              </span>
            </div>

            <div className="space-y-1">
              <h2 className={cn(
                "text-xl leading-tight font-black uppercase tracking-tight line-clamp-2",
                templateId === 'minimal' ? 'font-sans normal-case tracking-normal' : (style.font === 'serif' ? 'italic' : '')
              )}>
                {ticket.title}
              </h2>
              <p className="text-[10px] opacity-60 uppercase tracking-widest font-bold">
                BY {ticket.author}
              </p>
            </div>

            {ticket.comment && (
              <p className={cn(
                "text-[10px] leading-relaxed opacity-70 line-clamp-2 italic border-l border-current/30 pl-3",
                templateId === 'minimal' ? 'not-italic font-medium' : ''
              )}>
                {ticket.comment}
              </p>
            )}
          </div>

          <div className="flex justify-between items-end pt-2 border-t border-current/10">
            <div className="space-y-0.5">
              <p className="text-[8px] uppercase tracking-widest opacity-40 font-bold">DATE</p>
              <p className="text-[10px] font-mono font-bold">{ticket.completedAt.replace(/-/g, '.')}</p>
            </div>
            {ticket.genre && (
              <div className="space-y-0.5 text-right">
                <p className="text-[8px] uppercase tracking-widest opacity-40 font-bold">GENRE</p>
                <p className="text-[10px] font-mono font-bold">{ticket.genre.toUpperCase()}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 절취선 및 펀칭 구멍 섹션 */}
      <div className="relative w-px h-full border-l-2 border-dashed border-current opacity-20 flex flex-col justify-between py-2 -mx-px z-30">
        <div className={cn("absolute -top-3 -left-[11px] w-6 h-6 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]", holeColor)} />
        <div className={cn("absolute -bottom-3 -left-[11px] w-6 h-6 rounded-full shadow-[inset_0_-2px_4px_rgba(0,0,0,0.1)]", holeColor)} />
      </div>

      {/* 오른쪽 섹션 (Stub) */}
      <div className="w-32 p-6 flex flex-col justify-between items-center border-l border-current/5 bg-current/5 rounded-r-lg relative z-10">
        <div className="writing-vertical-rl rotate-180 text-[10px] uppercase tracking-[0.3em] font-bold opacity-30 h-full flex items-center justify-center">
          BIBLIOPHILE'S GALLERY
        </div>
        
        {/* 바코드 */}
        <div className="w-full space-y-1 mt-4">
          <div className="flex justify-between h-8 items-end gap-[1px]">
            {Array.from({ length: 24 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "bg-current",
                  (i % 3 === 0) ? "w-[1.5px]" : "w-[0.5px]",
                  (i % 2 === 0) ? "h-full" : "h-3/4"
                )}
              />
            ))}
          </div>
          <p className="text-[8px] font-mono text-center opacity-40">
            {ticket.id.toString().slice(0, 4)}-{ticket.completedAt.replace(/-/g, '')}
          </p>
        </div>
      </div>

      {/* 종이 질감 오버레이 */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.05] mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')] rounded-lg z-40" />
    </div>
  );
});

PhotoCard.displayName = 'PhotoCard';
