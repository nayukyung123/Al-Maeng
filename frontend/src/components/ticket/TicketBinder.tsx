"use client";

import React, { useMemo, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { GalleryTicket } from "@/types/ticket";
import { cn } from "@/lib/utils";
import { PhotoCard } from "./PhotoCard";

interface TicketBinderProps {
  onOpenBook: (ticket: GalleryTicket) => void;
  onAddTicket: () => void;
}

const fetchDummyBinderTickets = async (): Promise<GalleryTicket[]> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(
        Array.from({ length: 15 }).map((_, i) => ({
          id: `b${i}`,
          bookId: 200 + i,
          title: `Binder Book Title ${i + 1}`,
          author: `Author ${i + 1}`,
          genre: ['소설', '에세이', '과학', '예술'][i % 4],
          completedAt: `2024-02-${String((i % 28) + 1).padStart(2, '0')}`,
          comment: `Detailed review ${i + 1}.`,
          templateId: ['classic', 'minimal', 'modern'][i % 3],
          style: { font: 'sans', background: 'bg-stone-50', textColor: 'text-stone-900' }
        }))
      );
    }, 500);
  });
};

export const TicketBinder = ({ onOpenBook, onAddTicket }: TicketBinderProps) => {
  const [books, setBooks] = useState<GalleryTicket[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [flipState, setFlipState] = useState<'idle' | 'next-start' | 'next-anim' | 'prev-start' | 'prev-anim' | 'genre-flip-start' | 'genre-flip-anim'>('idle');

  useEffect(() => {
    fetchDummyBinderTickets().then(setBooks);
  }, []);

  const binderBooks = useMemo(() => {
    let filtered = [...books];
    if (selectedGenre) {
      filtered = filtered.filter(b => b.genre === selectedGenre);
    }
    return filtered.sort((a, b) => a.title.localeCompare(b.title, 'ko'));
  }, [books, selectedGenre]);

  const genres = ['소설', '에세이', '자기계발', '인문학', '경제경영', '과학', '예술', '만화'];

  const handleGenreChange = (genre: string | null) => {
    if (selectedGenre === genre || flipState !== 'idle') return;
    setFlipState('genre-flip-start');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setFlipState('genre-flip-anim');
        setTimeout(() => {
          setSelectedGenre(genre);
          setPageIndex(0);
        }, 350);
      });
    });
  };

  const turnNext = () => {
    if (pageIndex >= Math.ceil(binderBooks.length / 4) - 1 || flipState !== 'idle') return;
    setFlipState('next-start');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setFlipState('next-anim');
      });
    });
  };

  const turnPrev = () => {
    if (pageIndex <= 0 || flipState !== 'idle') return;
    setFlipState('prev-start');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setFlipState('prev-anim');
      });
    });
  };

  const handleTransitionEnd = () => {
    if (flipState === 'next-anim') {
      setPageIndex(p => p + 1);
      setFlipState('idle');
    } else if (flipState === 'prev-anim') {
      setPageIndex(p => p - 1);
      setFlipState('idle');
    } else if (flipState === 'genre-flip-anim') {
      setFlipState('idle');
    }
  };

  const renderTickets = (start: number, end: number) => {
    const pageBooks = binderBooks.slice(start, end);
    const slots = [0, 1];
    
    return (
      <div className="grid grid-cols-2 gap-4 md:gap-8 h-full">
        {slots.map(idx => {
          const book = pageBooks[idx];
          if (book) {
            return (
              <div key={book.id} className="relative group cursor-pointer h-full flex items-center justify-center transform hover:scale-[1.02] transition-transform" onClick={() => onOpenBook(book)}>
                {/* 
                  3D 바인더에 최적화된 작은 사이즈 포토카드.
                  원본 PhotoCard를 사용하면 너무 커서 UI가 망가질 수 있으므로 스케일 적용 
                */}
                <div className="scale-[0.6] md:scale-[0.8] origin-center shadow-xl">
                  <PhotoCard ticket={book} />
                </div>
              </div>
            );
          }
          
          return (
            <div key={`empty-${start}-${idx}`} onClick={onAddTicket} className="w-full aspect-[1/2] border border-black/5 rounded-sm flex flex-col p-3 bg-black/[0.01] relative overflow-hidden cursor-pointer hover:bg-black/5 transition-colors">
              <div className="w-full h-full flex items-center justify-center">
                <Plus size={32} className="text-black/20" />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // 3D 렌더링 가상화 방어
  const getRenderTicketsSafe = (start: number, end: number) => {
    const pageOffset = Math.abs((start / 4) - pageIndex);
    if (pageOffset > 1) return null; 
    return renderTickets(start, end);
  }

  return (
    <div className="animate-in fade-in py-12 px-6 md:px-12 flex flex-col items-center justify-center [perspective:2500px]">
      <div className="relative w-full max-w-5xl ml-10 md:ml-12 aspect-[3/4] md:aspect-[2/1] bg-[#1a1a1a] p-2 md:p-3 rounded-xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5),inset_0_0_0_1px_rgba(255,255,255,0.1)] [transform-style:preserve-3d]">
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

        <div className="relative w-full h-full flex [perspective:3000px] overflow-hidden rounded-lg">
          <div className="w-1/2 h-full relative bg-[#FDFCF8] rounded-l-sm shadow-[inset_-20px_0_40px_rgba(0,0,0,0.05)] border-r border-black/10 z-0">
            <div className="absolute inset-0 p-4 md:p-10 flex flex-col gap-4">
               {getRenderTicketsSafe(pageIndex * 4, pageIndex * 4 + 2)}
            </div>
          </div>

          <div className="w-1/2 h-full relative bg-[#FDFCF8] rounded-r-sm shadow-[inset_20px_0_40px_rgba(0,0,0,0.05)] z-0">
            <div className="absolute inset-0 p-4 md:p-10 flex flex-col gap-4">
               {getRenderTicketsSafe(pageIndex * 4 + 2, pageIndex * 4 + 4)}
            </div>
          </div>

          <div 
            className={`absolute top-0 right-0 w-1/2 h-full origin-left transition-transform duration-700 ease-in-out [transform-style:preserve-3d] z-30 ${
              (flipState === 'next-start' || flipState === 'genre-flip-start') ? '[transform:rotateY(0deg)] opacity-100' : 
              (flipState === 'next-anim' || flipState === 'genre-flip-anim') ? '[transform:rotateY(-180deg)] opacity-100' : 
              flipState === 'prev-start' ? '[transform:rotateY(-180deg)] opacity-100' :
              flipState === 'prev-anim' ? '[transform:rotateY(0deg)] opacity-100' :
              'opacity-0 pointer-events-none'
            }`}
            onTransitionEnd={handleTransitionEnd}
          >
            <div className="absolute inset-0 backface-hidden bg-[#FDFCF8] shadow-[inset_20px_0_60px_rgba(0,0,0,0.1),-10px_0_30px_rgba(0,0,0,0.2)] rounded-r-sm overflow-hidden" style={{ backfaceVisibility: 'hidden' }}>
              <div className="absolute inset-0 p-4 md:p-10 flex flex-col gap-4">
                {flipState.includes('prev') 
                  ? getRenderTicketsSafe((pageIndex - 1) * 4 + 2, (pageIndex - 1) * 4 + 4)
                  : getRenderTicketsSafe(pageIndex * 4 + 2, pageIndex * 4 + 4)
                }
              </div>
            </div>
            <div className="absolute inset-0 backface-hidden [transform:rotateY(180deg)] bg-[#FDFCF8] shadow-[inset_-20px_0_60px_rgba(0,0,0,0.1),10px_0_30px_rgba(0,0,0,0.2)] rounded-l-sm border-r border-black/10 overflow-hidden" style={{ backfaceVisibility: 'hidden' }}>
              <div className="absolute inset-0 p-4 md:p-10 flex flex-col gap-4">
                {flipState.includes('next') 
                  ? getRenderTicketsSafe((pageIndex + 1) * 4, (pageIndex + 1) * 4 + 2)
                  : flipState.includes('prev')
                  ? getRenderTicketsSafe(pageIndex * 4, pageIndex * 4 + 2)
                  : getRenderTicketsSafe(0, 2)
                }
              </div>
            </div>
          </div>
        </div>

        <button onClick={turnPrev} disabled={pageIndex === 0 || flipState !== 'idle'} className="absolute -left-6 md:-left-10 top-1/2 -translate-y-1/2 w-10 h-10 md:w-16 md:h-16 bg-white shadow-xl rounded-full flex items-center justify-center disabled:opacity-0 hover:bg-black hover:text-white transition-all z-50 border border-black/5">
          <ChevronLeft size={24} />
        </button>
        <button onClick={turnNext} disabled={pageIndex >= Math.ceil(binderBooks.length / 4) - 1 || flipState !== 'idle'} className="absolute -right-6 md:-right-10 top-1/2 -translate-y-1/2 w-10 h-10 md:w-16 md:h-16 bg-white shadow-xl rounded-full flex items-center justify-center disabled:opacity-0 hover:bg-black hover:text-white transition-all z-50 border border-black/5">
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
};
