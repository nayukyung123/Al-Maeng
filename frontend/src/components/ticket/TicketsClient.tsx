"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Plus, ChevronRight } from "lucide-react";
import { CardGallery, getMockGalleryTickets } from "./CardGallery";
import { TicketBinder } from "./TicketBinder";
import { AddTicketModal } from "./AddTicketModal";
import { TicketDetailModal } from "./TicketDetailModal";
import { GalleryTicket } from "@/types/ticket";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import useAuthStore from "@/store/useAuthStore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteTicket as deleteTicketApi, fetchBinderTickets, fetchGalleryTickets } from "@/api/tickets";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { fetchCompletedBooks } from "@/api/completedBooks";
import { EmptyTicketState } from "./EmptyTicketState";
import { Loader2 } from "lucide-react";

export const TicketsClient = () => {
  const [view, setView] = useState<"gallery" | "binder">("gallery");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<GalleryTicket | null>(null);
  const binderPage = 0;
  const binderGenre: string | null = null;
  const { isLoggedIn } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const issueBookId = useMemo(() => {
    const raw = searchParams.get("issueBookId");
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }, [searchParams]);

  const {
    data: galleryTickets = [],
    isLoading: isGalleryLoading,
  } = useQuery({
    queryKey: ["tickets", "gallery"],
    queryFn: fetchGalleryTickets,
    enabled: isLoggedIn,
  });

  const { data: binderPageData, isLoading: isBinderLoading } = useQuery({
    queryKey: ["tickets", "binder", binderGenre ?? "ALL", binderPage],
    queryFn: () => fetchBinderTickets({ page: binderPage, genre: binderGenre }),
    enabled: isLoggedIn,
  });

  const {
    data: completedBooks = [],
    isLoading: isCompletedLoading,
  } = useQuery({
    queryKey: ["completed-books"],
    queryFn: fetchCompletedBooks,
    enabled: isLoggedIn,
    staleTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    if (!issueBookId) return;
    setIsAddModalOpen(true);
    router.replace(pathname, { scroll: false });
  }, [issueBookId, pathname, router]);

  const handleTicketAdded = async (_newTicket: GalleryTicket) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["tickets", "gallery"] }),
      queryClient.invalidateQueries({ queryKey: ["tickets", "binder"] }),
    ]);
  };

  const handleModalClose = () => {
    setIsAddModalOpen(false);
    router.replace(pathname, { scroll: false });
  };

  const handleDeleteTicket = async (ticketId: number) => {
    await deleteTicketApi(ticketId);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["tickets", "gallery"] }),
      queryClient.invalidateQueries({ queryKey: ["tickets", "binder"] }),
    ]);
  };

  const guestTickets = useMemo(() => getMockGalleryTickets(), []);
  const shownGalleryTickets = isLoggedIn ? galleryTickets : guestTickets;
  const shownBinderTickets = isLoggedIn
    ? (binderPageData?.content ?? [])
    : guestTickets;

  const isTicketsLoading = isLoggedIn && (isGalleryLoading || isBinderLoading || isCompletedLoading);
  const isEmptyGallery = isLoggedIn && !isTicketsLoading && view === "gallery" && shownGalleryTickets.length === 0;
  const isEmptyBinder = isLoggedIn && !isTicketsLoading && view === "binder" && shownBinderTickets.length === 0;
  const emptyVariant = completedBooks.length === 0 ? "newUser" : "hasCompletedBooks";

  return (
    <div className={cn(
      "relative w-full bg-stone-50 overflow-hidden",
      view === "gallery" ? "h-[100dvh]" : "min-h-[100dvh] pt-24 pb-32"
    )}>
      {/* Header & Toggle (공중 부양, 이벤트 통과) */}
      <div className="absolute top-24 left-6 right-6 md:left-12 md:right-12 z-40 pointer-events-none flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight uppercase">My Ticket</h2>
          <p className="text-sm text-gray-400 mt-2 font-medium uppercase tracking-widest">
            {view === "gallery" ? "갤러리" : "티켓 바인더"}
          </p>
        </div>
        
        <div className="flex bg-white/50 backdrop-blur-sm p-1 rounded-full border border-black/5 pointer-events-auto">
          <button 
            onClick={() => setView("gallery")}
            className={cn(
              "px-6 py-2 rounded-full text-xs font-bold transition-all duration-300",
              view === "gallery" ? "bg-black text-white shadow-lg" : "text-gray-400 hover:text-black"
            )}
          >
            갤러리
          </button>
          <button 
            onClick={() => setView("binder")}
            className={cn(
              "px-6 py-2 rounded-full text-xs font-bold transition-all duration-300",
              view === "binder" ? "bg-black text-white shadow-lg" : "text-gray-400 hover:text-black"
            )}
          >
            티켓 바인더
          </button>
        </div>
      </div>

      <div className="relative w-full h-full">
        {!isLoggedIn && <div className="absolute inset-0 z-20 pointer-events-auto" />}
        {(isEmptyGallery || isEmptyBinder) && (
          <div className="absolute inset-0 z-[25] pointer-events-auto" />
        )}

        {/* 비로그인 안내 오버레이 */}
        {!isLoggedIn && (
          <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="sticky top-1/2 -translate-y-1/2 bg-white w-full max-w-md p-12 border border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center text-center z-[60] mx-6 pointer-events-auto"
            >
              <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-6 mt-4">
                MY TICKET
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed mb-10 break-keep">
                읽은 책들을 티켓으로 발행하고 나만의 바인더를 채워보세요.<br/>
                당신의 독서 여정이 아름다운 아카이브가 됩니다.
              </p>
              <button 
                className="w-full bg-black text-white py-4 flex items-center justify-center gap-3 font-black text-sm tracking-widest uppercase hover:bg-[#0033FF] transition-colors"
                onClick={() => router.push("/login")}
              >
                로그인하고 시작하기 <ChevronRight size={18} />
              </button>
            </motion.div>
            <div className="absolute inset-0 bg-white/30 pointer-events-none" />
          </div>
        )}

        {isTicketsLoading && (
          <div className="absolute inset-0 z-10 pt-24 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-gray-400">
              <Loader2 className="animate-spin" size={28} />
              <p className="text-xs font-black uppercase tracking-widest">Loading</p>
            </div>
          </div>
        )}

        {/* 뷰 스위칭 */}
        {!isTicketsLoading &&
          (view === "gallery" ? (
            <CardGallery tickets={shownGalleryTickets} />
          ) : (
            <TicketBinder
              tickets={shownBinderTickets}
              isLoadingExternal={isLoggedIn && isBinderLoading}
              onOpenBook={setSelectedTicket}
              onAddTicket={() => setIsAddModalOpen(true)}
            />
          ))}

        {(isEmptyGallery || isEmptyBinder) && (
          <EmptyTicketState
            variant={emptyVariant}
            primaryLabel={emptyVariant === "newUser" ? "첫 완독 도서 검색하기" : "첫 티켓 발급하기"}
            onPrimaryAction={() => {
              if (emptyVariant === "newUser") {
                router.push("/search?focus=true");
              } else {
                setIsAddModalOpen(true);
              }
            }}
          />
        )}
      </div>

      {/* 플로팅 버튼 (티켓 추가) */}
      {isLoggedIn && (
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="fixed bottom-24 md:bottom-12 right-6 md:right-12 w-16 h-16 bg-[#0033FF] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-40"
        >
          <Plus size={32} />
        </button>
      )}

      {/* 티켓 발행 모달 */}
      <AddTicketModal 
        isOpen={isAddModalOpen} 
        onClose={handleModalClose}
        onSuccess={handleTicketAdded} 
        initialBookId={issueBookId}
      />

      {/* 3D 플립 티켓 상세조회 (다운로드 지원) 모달 */}
      <TicketDetailModal 
        ticket={selectedTicket} 
        onClose={() => setSelectedTicket(null)} 
        onDelete={isLoggedIn ? handleDeleteTicket : undefined}
      />
    </div>
  );
};
