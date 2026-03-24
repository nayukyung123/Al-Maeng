import { forwardRef } from 'react';
import { GalleryTicket } from '@/types/ticket';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';

interface PhotoCardProps {
  ticket: GalleryTicket & { rating?: number };
  className?: string;
  holeColor?: string;
  rating?: number; 
}

export const PhotoCard = forwardRef<HTMLDivElement, PhotoCardProps>(({ ticket, className, holeColor = 'bg-[#f5f2ed]', rating }, ref) => {
  const templateId = ticket.templateId || 'classic';
  const style = ticket.style || { background: 'bg-white', textColor: 'text-stone-900', font: 'serif' };
  
  const isHorizontal = style.orientation !== 'vertical';

  const fontClass = {
    serif: 'font-serif',
    sans: 'font-sans',
    mono: 'font-mono',
  }[style.font as string] || 'font-serif';

  const renderRating = (score: number | undefined) => {
    if (score === undefined) return null;
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={14} className={cn(i < score ? "fill-current" : "opacity-30")} />
        ))}
        <span className="text-[10px] font-mono font-bold ml-1">{score.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex shadow-2xl isolation-auto shrink-0 transition-all rounded-lg",
        isHorizontal ? "w-[480px] h-[240px] flex-row" : "w-[240px] h-[480px] flex-col",
        // 🔥 톱니바퀴 효과(clip-path) 완전 삭제 완료!
        templateId === 'minimal' ? 'bg-stone-50 text-stone-900' : style.background,
        templateId === 'minimal' ? 'text-stone-900' : style.textColor,
        templateId === 'minimal' ? 'font-sans' : fontClass,
        className
      )}
    >
      
      {isHorizontal ? (
        // === 가로형 레이아웃 (기존 유지) ===
        <>
          <div className="flex-1 p-6 flex gap-6 relative z-10 rounded-l-lg flex-row">
            <div className={cn("shrink-0 bg-black/5 overflow-hidden border border-current/20 shadow-inner w-32 h-full", templateId === 'modern' ? 'rounded-full' : 'rounded-sm')}>
              <img src={ticket.ticketImageUrl || ticket.coverImageUrl || `https://picsum.photos/seed/${ticket.id}/400/600`} alt={ticket.title} className={cn("w-full h-full object-cover", templateId === 'classic' && !ticket.ticketImageUrl ? 'grayscale contrast-125' : '')} crossOrigin="anonymous" />
            </div>
            <div className="flex-1 flex flex-col justify-between min-h-0">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-[9px] uppercase tracking-[0.3em] font-bold opacity-40">BOOK ADMISSION</span>
                  <span className="text-[9px] font-mono opacity-40">#{ticket.id.toString().padStart(4, '0')}</span>
                </div>
                <div className="space-y-1">
                  <h2 className={cn("text-xl leading-tight font-black uppercase tracking-tight line-clamp-2", templateId === 'minimal' ? 'font-sans normal-case tracking-normal' : (style.font === 'serif' ? 'italic' : ''))}>{ticket.title}</h2>
                  <p className="text-[10px] opacity-60 uppercase tracking-widest font-bold">BY {ticket.author}</p>
                </div>
                {ticket.comment && (
                  <p className={cn("text-[10px] leading-relaxed opacity-70 line-clamp-2 italic border-l border-current/30 pl-3", templateId === 'minimal' ? 'not-italic font-medium' : '')}>{ticket.comment}</p>
                )}
              </div>
              <div className="flex justify-between items-end pt-2 border-t border-current/10 gap-4">
                {renderRating(rating || ticket.rating)}
                <div className="flex-1 grid grid-cols-2 gap-x-2 text-right">
                    <div>
                        <p className="text-[8px] uppercase tracking-widest opacity-40 font-bold">DATE</p>
                        <p className="text-[10px] font-mono font-bold">{ticket.completedAt.replace(/-/g, '.')}</p>
                    </div>
                    {ticket.genre && (
                        <div>
                            <p className="text-[8px] uppercase tracking-widest opacity-40 font-bold">GENRE</p>
                            <p className="text-[10px] font-mono font-bold">{ticket.genre.toUpperCase()}</p>
                        </div>
                    )}
                </div>
              </div>
            </div>
          </div>
          <div className="relative border-dashed border-current opacity-20 flex justify-between z-30 w-px h-full border-l-2 py-2 -mx-px flex-col">
            <div className={cn("absolute rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] w-6 h-6 -top-3 -left-[11px]", holeColor)} />
            <div className={cn("absolute rounded-full shadow-[inset_0_-2px_4px_rgba(0,0,0,0.1)] w-6 h-6 -bottom-3 -left-[11px]", holeColor)} />
          </div>
          <div className="shrink-0 p-6 flex justify-between items-center bg-current/5 relative z-10 overflow-hidden w-32 h-full flex-col border-l border-current/5 rounded-r-lg">
            <div className="flex-1 w-full relative flex items-center justify-center min-h-0">
              <div className="absolute whitespace-nowrap text-[9px] uppercase tracking-[0.2em] font-bold opacity-30 -rotate-90">ALMAENG'S GALLERY</div>
            </div>
            <div className="w-full space-y-1 shrink-0 mt-4">
              <div className="flex justify-between h-8 items-end gap-[1px] w-full">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div key={i} className={cn("bg-current shrink-0", (i % 3 === 0) ? "w-[1.5px]" : "w-[0.5px]", (i % 2 === 0) ? "h-full" : "h-3/4")} />
                ))}
              </div>
              <p className="text-[8px] font-mono text-center opacity-40">{ticket.id.toString().slice(0, 4)}-{ticket.completedAt.replace(/-/g, '')}</p>
            </div>
          </div>
        </>
      ) : (
        // === 🔥 세로형 레이아웃 (사진 크기 축소 & 여백 최적화) ===
        <div className="w-full h-full p-6 flex flex-col relative z-10 rounded-lg">
          
          <div className="flex justify-between items-start mb-3">
            <span className="text-[9px] uppercase tracking-[0.3em] font-bold opacity-40">BOOK ADMISSION</span>
            <span className="text-[9px] font-mono opacity-40">#{ticket.id.toString().padStart(4, '0')}</span>
          </div>

          {/* 🔥 이미지 높이를 h-44에서 h-32(약 128px)로 줄여서 하단 공간 확보 */}
          <div className={cn(
            "w-full h-32 shrink-0 bg-black/5 overflow-hidden border border-current/20 shadow-inner mb-4 relative",
            templateId === 'modern' ? 'rounded-full' : 'rounded-sm'
          )}>
            <img 
              src={ticket.ticketImageUrl || ticket.coverImageUrl || `https://picsum.photos/seed/${ticket.id}/800/800`} 
              alt={ticket.title} 
              className={cn(
                "w-full h-full object-cover",
                templateId === 'classic' && !ticket.ticketImageUrl ? 'grayscale contrast-125' : ''
              )}
              crossOrigin="anonymous"
            />
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            {/* 타이틀 영역 */}
            <div className="space-y-1 mb-4">
              <h2 className={cn("text-lg leading-tight font-black uppercase tracking-tight line-clamp-2", style.font === 'serif' ? 'italic' : '')}>{ticket.title}</h2>
              <p className="text-[10px] opacity-60 uppercase tracking-widest font-bold">BY {ticket.author}</p>
            </div>

            {/* 정보 그리드 영역 */}
            <div className="border-t border-current/10 pt-3 pb-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs mb-auto">
                <div className="flex flex-col gap-0.5">
                    <p className="text-[8px] uppercase tracking-widest opacity-40 font-bold">DATE COMPLETED</p>
                    <p className="font-mono font-bold text-xs">{ticket.completedAt.replace(/-/g, '.')}</p>
                </div>
                {ticket.genre && (
                    <div className="flex flex-col gap-0.5 text-right">
                        <p className="text-[8px] uppercase tracking-widest opacity-40 font-bold">GENRE</p>
                        <p className="font-mono font-bold text-xs">{ticket.genre.toUpperCase()}</p>
                    </div>
                )}
                <div className="col-span-2 flex flex-col gap-1 mt-1">
                    <p className="text-[8px] uppercase tracking-widest opacity-40 font-bold">RATING</p>
                    {renderRating(rating || ticket.rating)}
                </div>
            </div>

            {/* 코멘트 영역 (넘치지 않게 처리) */}
            {ticket.comment && (
              <div className="relative border border-current/30 p-3 rounded-md bg-current/5 mt-2 overflow-hidden shrink-0">
                <p className={cn("text-[9px] leading-relaxed opacity-70 break-keep italic line-clamp-2", templateId === 'minimal' ? 'not-italic font-medium' : '')}>{ticket.comment}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="absolute inset-0 pointer-events-none opacity-[0.05] mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')] rounded-lg z-40" />
    </div>
  );
});

PhotoCard.displayName = 'PhotoCard';