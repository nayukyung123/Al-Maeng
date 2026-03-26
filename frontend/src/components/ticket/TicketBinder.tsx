"use client";

import React, { useMemo, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { GalleryTicket } from "@/types/ticket";
import { cn } from "@/lib/utils";
import { PhotoCard } from "./PhotoCard";
import { useQuery } from "@tanstack/react-query";
import { fetchTopLevelGenres } from "@/api/genres";

interface TicketBinderProps {
  onOpenBook?: (ticket: GalleryTicket) => void;
  onAddTicket?: () => void;
  tickets?: GalleryTicket[];
  isLoadingExternal?: boolean;
}

const fetchDummyBinderTickets = async (): Promise<GalleryTicket[]> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(
        Array.from({ length: 15 }).map((_, i) => {
          const orientation = i % 3 === 2 ? 'vertical' : 'horizontal';
          
          return {
            id: 200 + i,
            bookId: 200 + i,
            title: `Binder Book Title ${i + 1}`,
            author: `Author ${i + 1}`,
            genre: ['소설', '에세이', '과학', '예술'][i % 4],
            completedAt: `2024-02-${String((i % 28) + 1).padStart(2, '0')}`,
            comment: `Detailed review ${i + 1}.`,
            templateId: ['classic', 'minimal', 'modern'][i % 3],
            style: { 
              font: 'sans', 
              background: 'bg-stone-50', 
              textColor: 'text-stone-900',
              orientation: orientation
            }
          };
        })
      );
    }, 500);
  });
};

const TicketSkeleton = ({ idx }: { idx: number }) => {
  const yOffset = idx === 0 ? 'top-[42%]' : 'top-[58%]';
  return (
    <div className="relative w-full h-full">
      <div className={`absolute ${yOffset} left-1/2 -translate-x-1/2 -translate-y-1/2 scale-[0.45] sm:scale-[0.6] md:scale-[0.75] shadow-sm border border-black/5 rounded-lg`}>
        <div className="w-[480px] h-[240px] bg-white/40 backdrop-blur-md rounded-lg shadow-sm animate-pulse flex p-6 gap-6 border border-white/50">
          <div className="flex-1 flex gap-6">
            <div className="w-[124px] h-[180px] bg-black/10 rounded-sm shadow-inner" />
            <div className="flex-1 flex flex-col pt-4 gap-4">
              <div className="w-3/4 h-8 bg-black/10 rounded" />
              <div className="w-1/2 h-5 bg-black/10 rounded" />
              <div className="w-full h-4 bg-black/10 rounded mt-auto" />
              <div className="w-5/6 h-4 bg-black/10 rounded" />
            </div>
          </div>
          <div className="w-px h-[190px] self-center border-l-2 border-dashed border-black/10" />
          <div className="w-[100px] flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full bg-black/10" />
            <div className="w-20 h-4 bg-black/10 rounded" />
            <div className="w-16 h-4 bg-black/10 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const TicketBinder = ({
  onOpenBook = () => {},
  onAddTicket = () => {},
  tickets,
  isLoadingExternal = false
}: TicketBinderProps) => {
  const [books, setBooks] = useState<GalleryTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [pageIndex, setPageIndex] = useState(0);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [pendingGenre, setPendingGenre] = useState<string | null>(null);
  const [flipState, setFlipState] = useState<'idle' | 'next-start' | 'next-anim' | 'prev-start' | 'prev-anim' | 'genre-flip-start' | 'genre-flip-anim'>('idle');

  useEffect(() => {
    if (tickets) {
      setBooks(tickets);
      setIsLoading(isLoadingExternal);
      return;
    }
    fetchDummyBinderTickets().then((data) => {
      setBooks(data);
      setIsLoading(false);
    });
  }, [tickets, isLoadingExternal]);

  const currentBinderBooks = useMemo(() => {
    let filtered = [...books];
    if (selectedGenre) filtered = filtered.filter(b => b.genre === selectedGenre);
    return filtered.sort((a, b) => a.title.localeCompare(b.title, 'ko'));
  }, [books, selectedGenre]);

  const pendingBinderBooks = useMemo(() => {
    let filtered = [...books];
    if (pendingGenre) filtered = filtered.filter(b => b.genre === pendingGenre);
    return filtered.sort((a, b) => a.title.localeCompare(b.title, 'ko'));
  }, [books, pendingGenre]);

  const { data: topGenres = [] } = useQuery({
    queryKey: ["top-level-genres"],
    queryFn: fetchTopLevelGenres,
    staleTime: Infinity,
  });
  const genres = useMemo(() => {
    return topGenres
      .map((g) => g.genreName)
      .sort((a, b) => {
        if (a === "소설/시/희곡") return -1;
        if (b === "소설/시/희곡") return 1;
        return a.localeCompare(b, "ko");
      });
  }, [topGenres]);

  const handleGenreChange = (genre: string | null) => {
    if (selectedGenre === genre || flipState !== 'idle') return;
    setPendingGenre(genre);
    setFlipState('genre-flip-start');
    setTimeout(() => {
      setFlipState('genre-flip-anim');
    }, 200);
  };

  const turnNext = () => {
    if (pageIndex >= Math.ceil(currentBinderBooks.length / 4) - 1 || flipState !== 'idle') return;
    setFlipState('next-start');
    setTimeout(() => setFlipState('next-anim'), 50);
  };

  const turnPrev = () => {
    if (pageIndex <= 0 || flipState !== 'idle') return;
    setFlipState('prev-start');
    setTimeout(() => setFlipState('prev-anim'), 50);
  };

  const handleTransitionEnd = (e: React.TransitionEvent) => {
    if (e.target !== e.currentTarget) return;

    if (flipState === 'next-anim') {
      setPageIndex(p => p + 1);
      setFlipState('idle');
    } else if (flipState === 'prev-anim') {
      setPageIndex(p => p - 1);
      setFlipState('idle');
    } else if (flipState === 'genre-flip-anim') {
      setSelectedGenre(pendingGenre);
      setPendingGenre(null);
      setPageIndex(0);
      setFlipState('idle');
    }
  };

  const renderSlot = (start: number, idx: number, isPending: boolean = false) => {
    if (isLoading) {
      return <TicketSkeleton idx={idx} />;
    }

    const targetBooks = isPending ? pendingBinderBooks : currentBinderBooks;
    const book = targetBooks[start + idx];
    const yOffset = idx === 0 ? 'top-[42%]' : 'top-[58%]';

    if (book) {
      const isVertical = book.style?.orientation === 'vertical';
      
      const randomRotation = idx % 2 === 0 ? '-rotate-1' : 'rotate-1';
      const isFlipping = flipState !== 'idle';
      
      const wrapperTransition = isFlipping ? '' : 'transition-transform duration-300 hover:scale-[1.02]';
      
      const baseRotation = isVertical ? '-rotate-90' : randomRotation;
      const hoverRotation = isFlipping ? '' : (isVertical ? 'group-hover:-rotate-[88deg]' : 'group-hover:rotate-0');

      return (
        <div key={`ticket-${book.id}`} className={`relative group cursor-pointer w-full h-full transform ${wrapperTransition}`} onClick={() => onOpenBook(book)}>
          <div className={`absolute ${yOffset} left-1/2 -translate-x-1/2 -translate-y-1/2 scale-[0.45] sm:scale-[0.6] md:scale-[0.75] shadow-sm border border-black/5 rounded-lg transition-transform ${baseRotation} ${hoverRotation}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-black/5 pointer-events-none z-10 rounded-lg border border-white/50" />
            <PhotoCard ticket={book} />
          </div>
        </div>
      );
    }

    // 빈 슬롯(추가 버튼)
    const yOffsetEmpty = idx === 0 ? 'top-[42%]' : 'top-[58%]';
    return (
      <div key={`empty-${start}-${idx}`} className="relative w-full h-full">
        <div onClick={onAddTicket} className={`absolute ${yOffsetEmpty} left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] max-w-[300px] border-2 border-dashed border-black/10 rounded-lg flex flex-col bg-black/[0.02] hover:bg-black/5 transition-colors items-center justify-center cursor-pointer`}>
          <Plus size={32} className="text-black/20" />
        </div>
      </div>
    );
  };

  const renderTickets = (start: number, end: number, isPending: boolean = false) => {
    return (
      <div className="grid grid-rows-2 h-full w-full py-2 relative">
        <div className="absolute top-1/2 left-2 right-2 border-t border-white/60 shadow-[0_1px_2px_rgba(0,0,0,0.05)] pointer-events-none -translate-y-1/2" />

        <div className="w-full h-full grid place-items-center p-1 pb-2">
          {renderSlot(start, 0, isPending)}
        </div>
        <div className="w-full h-full grid place-items-center p-1 pt-2">
          {renderSlot(start, 1, isPending)}
        </div>
      </div>
    );
  };

  const getRenderTicketsSafe = (start: number, end: number, isPending: boolean = false) => {
    const refIndex = isPending ? 0 : pageIndex;
    const pageOffset = Math.abs((start / 4) - refIndex);
    if (pageOffset > 2) return null;
    return renderTickets(start, end, isPending);
  };

  return (
    <div className="animate-in fade-in py-12 px-6 md:px-12 flex flex-col items-center justify-center [perspective:2500px] mt-24">
      <div className="relative w-full max-w-5xl ml-10 md:ml-12 aspect-[3/4] md:aspect-[2/1] bg-white/20 backdrop-blur-xl border border-white/50 p-2 md:p-3 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.1),inset_0_0_0_1px_rgba(255,255,255,0.1)] [transform-style:preserve-3d]">
        <div className="absolute -left-14 md:-left-16 top-8 bottom-8 flex flex-col gap-1 z-0">
          <button
            onClick={() => handleGenreChange(null)}
            className={cn(
              "w-14 md:w-16 py-2 rounded-l-lg text-[10px] font-black tracking-tighter uppercase transition-all border-y border-l flex items-center justify-center",
              selectedGenre === null
                ? "bg-black text-white border-black z-10 -translate-x-3 shadow-[-8px_0_20px_rgba(0,0,0,0.4)]"
                : "bg-stone-200 text-stone-500 border-stone-300 hover:bg-stone-300"
            )}
          >
            ALL
          </button>
          {genres.map((genre, idx) => {
            const defaultColors = ['bg-slate-200', 'bg-stone-200', 'bg-zinc-200'];
            return (
              <button
                key={genre}
                onClick={() => handleGenreChange(genre)}
                className={cn(
                  "w-14 md:w-16 py-2 rounded-l-lg text-[10px] font-black tracking-tighter uppercase transition-all border-y border-l flex items-center justify-center text-black/70",
                  defaultColors[idx % defaultColors.length],
                  selectedGenre === genre ? "z-10 -translate-x-3 shadow-[-8px_0_20px_rgba(0,0,0,0.3)] brightness-105 font-bold text-black" : "hover:brightness-95"
                )}
              >
                {genre}
              </button>
            );
          })}
        </div>

        <div
          onClick={turnPrev}
          className={`peer/prev group/prev absolute top-0 bottom-0 left-0 w-16 md:w-24 z-50 cursor-pointer flex items-center justify-start ${pageIndex === 0 || flipState !== 'idle' ? 'hidden' : 'block'}`}
        >
          <div className="ml-2 md:ml-4 opacity-0 group-hover/prev:opacity-100 transition-opacity duration-300">
            <p className="text-black/30 font-black tracking-[0.3em] -rotate-90 text-[10px] uppercase select-none">Prev</p>
          </div>
        </div>

        <div
          onClick={turnNext}
          className={`peer/next group/next absolute top-0 bottom-0 right-0 w-16 md:w-24 z-50 cursor-pointer flex items-center justify-end ${pageIndex >= Math.ceil(currentBinderBooks.length / 4) - 1 || flipState !== 'idle' ? 'hidden' : 'block'}`}
        >
          <div className="mr-2 md:mr-4 opacity-0 group-hover/next:opacity-100 transition-opacity duration-300">
            <p className="text-black/30 font-black tracking-[0.3em] rotate-90 text-[10px] uppercase select-none">Next</p>
          </div>
        </div>

        <div className="relative w-full h-full flex [perspective:3000px] overflow-hidden rounded-lg">
          <div className="w-1/2 h-full relative bg-white/40 backdrop-blur-md rounded-l-sm shadow-[inset_-20px_0_40px_rgba(0,0,0,0.05)] border-r border-white/50 z-0">
            <div className="absolute inset-0 p-4 md:p-10 flex flex-col gap-4">
              {flipState.includes('prev')
                ? getRenderTicketsSafe((pageIndex - 1) * 4, (pageIndex - 1) * 4 + 2)
                : getRenderTicketsSafe(pageIndex * 4, pageIndex * 4 + 2)
              }
            </div>
            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-black/10 to-transparent opacity-0 peer-hover/prev:opacity-100 transition-opacity duration-500 pointer-events-none rounded-l-sm" />
          </div>

          <div className="w-1/2 h-full relative bg-white/40 backdrop-blur-md rounded-r-sm shadow-[inset_20px_0_40px_rgba(0,0,0,0.05)] border-l border-white/50 z-0">
            <div className="absolute inset-0 p-4 md:p-10 flex flex-col gap-4">
              {flipState.includes('next')
                ? getRenderTicketsSafe((pageIndex + 1) * 4 + 2, (pageIndex + 1) * 4 + 4)
                : flipState.includes('genre-flip')
                  ? getRenderTicketsSafe(2, 4, true)
                  : getRenderTicketsSafe(pageIndex * 4 + 2, pageIndex * 4 + 4)
              }
            </div>
          </div>

          <div className={`absolute top-0 right-0 w-1/2 h-full origin-left ease-in-out [transform-style:preserve-3d] z-50 ${(flipState === 'next-start' || flipState === 'genre-flip-start') ? 'transition-none [transform:rotateY(0deg)] opacity-100' :
            (flipState === 'next-anim' || flipState === 'genre-flip-anim') ? 'transition-transform duration-700 [transform:rotateY(-180deg)] opacity-100' :
              flipState === 'prev-start' ? 'transition-none [transform:rotateY(-180deg)] opacity-100' :
                flipState === 'prev-anim' ? 'transition-transform duration-700 [transform:rotateY(0deg)] opacity-100' :
                  'opacity-0 pointer-events-none'
            }`}
            onTransitionEnd={handleTransitionEnd}
          >
            <div className="absolute inset-0 backface-hidden bg-white/40 backdrop-blur-md shadow-[inset_20px_0_60px_rgba(0,0,0,0.1),-10px_0_30px_rgba(0,0,0,0.2)] rounded-r-sm overflow-hidden" style={{ backfaceVisibility: 'hidden' }}>
              <div className="absolute inset-0 p-4 md:p-10 flex flex-col gap-4">
                {flipState.includes('prev')
                  ? getRenderTicketsSafe((pageIndex - 1) * 4 + 2, (pageIndex - 1) * 4 + 4)
                  : getRenderTicketsSafe(pageIndex * 4 + 2, pageIndex * 4 + 4)
                }
              </div>
              <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-black/10 to-transparent opacity-0 peer-hover/next:opacity-100 transition-opacity duration-500 pointer-events-none rounded-r-sm" />
            </div>
            <div className="absolute inset-0 backface-hidden [transform:rotateY(180deg)] bg-white/40 backdrop-blur-md shadow-[inset_-20px_0_60px_rgba(0,0,0,0.1),10px_0_30px_rgba(0,0,0,0.2)] rounded-l-sm border-r border-white/50 overflow-hidden" style={{ backfaceVisibility: 'hidden' }}>
              <div className="absolute inset-0 p-4 md:p-10 flex flex-col gap-4">
                {flipState.includes('next')
                  ? getRenderTicketsSafe((pageIndex + 1) * 4, (pageIndex + 1) * 4 + 2)
                  : flipState.includes('prev')
                    ? getRenderTicketsSafe(pageIndex * 4, pageIndex * 4 + 2)
                    : flipState.includes('genre-flip')
                      ? getRenderTicketsSafe(0, 2, true)
                      : getRenderTicketsSafe(0, 2)
                }
              </div>
            </div>
          </div>

          {/* 바인더 중앙 철제 링 (양쪽 페이지 사이에 absolute로 추가) */}
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-10 md:w-12 z-40 flex flex-col justify-evenly py-8 pointer-events-none">
            {[1, 2, 3, 4].map(ring => (
              <div key={ring} className="w-full h-1.5 md:h-2 bg-gradient-to-b from-gray-300 via-gray-400 to-gray-500 rounded-full shadow-[0_4px_4px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.8)] border border-gray-500/80" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
