"use client";

import React, { useState } from "react";
import { Plus, ChevronRight } from "lucide-react";
import { CardGallery } from "./CardGallery";
import { TicketBinder } from "./TicketBinder";
import { AddTicketModal } from "./AddTicketModal";
import { TicketDetailModal } from "./TicketDetailModal";
import { GalleryTicket } from "@/types/ticket";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

export const TicketsClient = () => {
  const [view, setView] = useState<"gallery" | "binder">("gallery");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<GalleryTicket | null>(null);

  // 글로벌 Auth 스토어 대신 임시 상수
  const isLoggedIn = true;

  const handleTicketAdded = (newTicket: GalleryTicket) => {
    // API 연동 시 React Query invalidate 후 재 랜더링 유도
    console.log("Ticket Added Success:", newTicket);
  };

  return (
    <div className="pt-24 pb-32 min-h-screen relative animate-in fade-in duration-500 bg-stone-50 overflow-hidden">
      {/* Header & Toggle */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 px-6 md:px-12 gap-6 relative z-10">
        <div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight uppercase">My Archive</h2>
          <p className="text-sm text-gray-400 mt-2 font-medium uppercase tracking-widest">
            {view === "gallery" ? "갤러리" : "티켓 바인더"}
          </p>
        </div>
        
        <div className="flex bg-white/50 backdrop-blur-sm p-1 rounded-full border border-black/5">
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

      <div className="relative w-full">
        {/* 비로그인 안내 오버레이 */}
        {!isLoggedIn && (
          <div className="absolute inset-0 z-50 flex items-center justify-center">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="sticky top-1/2 -translate-y-1/2 bg-white w-full max-w-md p-12 border border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center text-center z-[60] mx-6"
            >
              <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-6 mt-4">
                MY ARCHIVE
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed mb-10 break-keep">
                읽은 책들을 티켓으로 발행하고 나만의 바인더를 채워보세요.<br/>
                당신의 독서 여정이 아름다운 아카이브가 됩니다.
              </p>
              <button 
                className="w-full bg-black text-white py-4 flex items-center justify-center gap-3 font-black text-sm tracking-widest uppercase hover:bg-[#0033FF] transition-colors"
              >
                로그인하고 시작하기 <ChevronRight size={18} />
              </button>
            </motion.div>
            <div className="absolute inset-0 bg-white/40 pointer-events-none" />
          </div>
        )}

        {/* 뷰 스위칭 */}
        {view === "gallery" ? (
          <CardGallery />
        ) : (
          <TicketBinder 
            onOpenBook={setSelectedTicket}
            onAddTicket={() => setIsAddModalOpen(true)}
          />
        )}
      </div>

      {/* 플로팅 버튼 (티켓 추가) */}
      <button 
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-24 md:bottom-12 right-6 md:right-12 w-16 h-16 bg-[#0033FF] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-40"
      >
        <Plus size={32} />
      </button>

      {/* 티켓 발행 모달 */}
      <AddTicketModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={handleTicketAdded} 
      />

      {/* 3D 플립 티켓 상세조회 (다운로드 지원) 모달 */}
      <TicketDetailModal 
        ticket={selectedTicket} 
        onClose={() => setSelectedTicket(null)} 
      />
    </div>
  );
};
