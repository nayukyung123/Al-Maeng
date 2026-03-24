"use client";

import React, { useState, useEffect } from "react";
import { X, Search, Plus, Check, Loader2, ChevronRight, Image as ImageIcon } from "lucide-react";
import { GalleryTicket } from "@/types/ticket";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { PhotoCard } from "./PhotoCard"; // 🔥 미리보기를 위해 PhotoCard 불러오기

// Mock API
const mockSearchCompletedBooks = async (query: string): Promise<any[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const searchPool = [
        { id: '101', title: '사피엔스', author: '유발 하라리', genre: '인문' },
        { id: '102', title: '코스모스', author: '칼 세이건', genre: '과학' },
        { id: '103', title: '데미안', author: '헤르만 헤세', genre: '소설' },
      ];
      resolve(
        searchPool.filter((b) => b.title.includes(query) || b.author.includes(query))
      );
    }, 500);
  });
};

interface AddTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newTicket: GalleryTicket) => void;
}

// 🔥 텍스트 힙 무드에 맞는 저채도 컬러 팔레트
const COLOR_PALETTE = [
  { id: 'bg-white', name: 'WHITE', hex: '#ffffff' },
  { id: 'bg-stone-100', name: 'STONE', hex: '#f5f5f4' },
  { id: 'bg-slate-100', name: 'SLATE', hex: '#f1f5f9' },
  { id: 'bg-zinc-200', name: 'ZINC', hex: '#e4e4e7' },
  { id: 'bg-[#e2e8f0]', name: 'MUTED BLUE', hex: '#e2e8f0' }, // 회색기 도는 하늘색
];

export const AddTicketModal = ({ isOpen, onClose, onSuccess }: AddTicketModalProps) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [selectedBook, setSelectedBook] = useState<any | null>(null);
  
  const [ticketData, setTicketData] = useState({
    dateRead: new Date().toISOString().split("T")[0],
    startDate: "",
    review: "",
    customImage: "",
    templateId: "classic",
    background: "bg-white", // 🔥 컬러 상태 추가
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (step === 1 && searchQuery.trim()) {
      setIsSearching(true);
      mockSearchCompletedBooks(searchQuery).then((results) => {
        setSearchResults(results);
        setIsSearching(false);
      });
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, step]);

  const handleSelectBook = (book: any) => {
    setSelectedBook(book);
    setStep(2);
  };

  const handleIssueTicket = async () => {
    if (!selectedBook) return;
    setIsSubmitting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newTicket: GalleryTicket = {
        id: `t-${Date.now()}`,
        bookId: parseInt(selectedBook.id),
        title: selectedBook.title,
        author: selectedBook.author,
        genre: selectedBook.genre,
        completedAt: ticketData.dateRead,
        comment: ticketData.review,
        templateId: ticketData.templateId,
        style: { font: 'serif', background: ticketData.background, textColor: 'text-stone-900' },
        ticketImageUrl: ticketData.customImage || `https://picsum.photos/seed/${selectedBook.id}/400/600`,
      };

      onSuccess(newTicket);
      
      setStep(1);
      setSearchQuery("");
      setTicketData({
        dateRead: new Date().toISOString().split("T")[0],
        startDate: "",
        review: "",
        customImage: "",
        templateId: "classic",
        background: "bg-white",
      });
      setSelectedBook(null);
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🔥 실시간 미리보기를 위한 가짜(Pseudo) 티켓 데이터 생성
  const previewTicket: GalleryTicket = {
    id: 'preview',
    bookId: parseInt(selectedBook?.id || '0'),
    title: selectedBook?.title || 'TITLE',
    author: selectedBook?.author || 'AUTHOR',
    genre: selectedBook?.genre || 'GENRE',
    completedAt: ticketData.dateRead,
    comment: ticketData.review || '이 책이 남긴 여운을 미리보기로 확인하세요.',
    templateId: ticketData.templateId,
    style: { 
      font: ticketData.templateId === 'classic' ? 'serif' : 'sans', 
      background: ticketData.background, 
      textColor: 'text-stone-900' 
    },
    ticketImageUrl: ticketData.customImage || `https://picsum.photos/seed/${selectedBook?.id}/400/600`,
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-white/95 backdrop-blur-sm"
      >
        <button 
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-8 right-8 text-black hover:opacity-50 transition-opacity disabled:opacity-20 z-50"
        >
          <X size={32} />
        </button>

        <div className="w-full max-w-6xl px-6 h-[90vh] flex flex-col justify-center">
          {step === 1 ? (
            <div className="flex flex-col items-center">
              <h2 className="text-4xl font-black mb-12">기록할 도서를 검색하세요.</h2>
              <div className="w-full max-w-2xl relative">
                <div className="relative border-b-2 border-[#0033FF] pb-2 flex items-center">
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="이미 완독한 도서명 또는 작가명을 입력하세요"
                    className="w-full text-2xl font-bold outline-none bg-transparent placeholder:text-gray-300"
                    autoFocus
                  />
                  {isSearching ? (
                    <Loader2 className="text-[#0033FF] ml-4 animate-spin" size={28} />
                  ) : (
                    <Search className="text-gray-300 ml-4" size={28} />
                  )}
                </div>

                <div className="mt-8 space-y-2 max-h-[50vh] overflow-y-auto pr-2 hide-scrollbar">
                  {searchResults.map((book, idx) => (
                    <div 
                      key={book.id}
                      onClick={() => handleSelectBook(book)}
                      className={cn(
                        "flex items-center p-4 cursor-pointer transition-all border border-transparent rounded-lg group",
                        idx === 0 ? "bg-stone-50 border-stone-200 shadow-sm" : "hover:bg-stone-50"
                      )}
                    >
                      <div className="w-12 h-16 bg-stone-200 mr-6 overflow-hidden shadow-sm group-hover:scale-105 transition-transform">
                        <img 
                          crossOrigin="anonymous"
                          src={`https://picsum.photos/seed/${book.id}/200/300`} 
                          alt="Cover" 
                          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-lg tracking-tight group-hover:text-[#0033FF] transition-colors">{book.title}</p>
                        <p className="text-xs text-stone-400 font-bold uppercase tracking-widest">{book.author}</p>
                      </div>
                      <ChevronRight className="text-stone-300 group-hover:text-[#0033FF] transition-colors" size={20} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // 🔥 STEP 2: 좌측 폼, 우측 실시간 미리보기 레이아웃
            <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-12 lg:gap-24 h-full overflow-y-auto hide-scrollbar py-10">
              
              {/* Left: Input Form */}
              <div className="flex-1 w-full max-w-md space-y-8 shrink-0">
                <div className="text-left mb-8 border-b border-black/10 pb-6">
                  <h3 className="text-3xl font-black mb-1">{selectedBook?.title}</h3>
                  <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">{selectedBook?.author}</p>
                </div>

                {/* Template Selection */}
                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">SELECT TEMPLATE</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[{ id: 'classic', name: 'CLASSIC' }, { id: 'modern', name: 'MODERN' }, { id: 'minimal', name: 'MINIMAL' }].map(template => (
                      <button
                        key={template.id}
                        disabled={isSubmitting}
                        onClick={() => setTicketData({ ...ticketData, templateId: template.id })}
                        className={cn(
                          "py-3 rounded-sm text-[10px] font-black tracking-widest border transition-all disabled:opacity-50",
                          ticketData.templateId === template.id 
                            ? "bg-black text-white border-black" 
                            : "bg-white text-gray-400 border-gray-200 hover:border-black hover:text-black"
                        )}
                      >
                        {template.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Selection */}
                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">BACKGROUND COLOR</p>
                  <div className="flex gap-4">
                    {COLOR_PALETTE.map(color => (
                      <button
                        key={color.id}
                        disabled={isSubmitting}
                        onClick={() => setTicketData({ ...ticketData, background: color.id })}
                        className={cn(
                          "w-8 h-8 rounded-full border-2 transition-transform",
                          ticketData.background === color.id ? "border-black scale-110" : "border-transparent hover:scale-105"
                        )}
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Custom Image Upload */}
                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">CUSTOM COVER (OPTIONAL)</p>
                  <label className="flex items-center justify-center w-full h-14 border border-dashed border-gray-300 hover:border-black hover:bg-stone-50 transition-colors cursor-pointer rounded-sm group disabled:opacity-50">
                    <ImageIcon className="text-gray-400 group-hover:text-black mr-2" size={20} />
                    <span className="text-xs font-bold text-gray-500 group-hover:text-black tracking-widest">UPLOAD IMAGE</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      disabled={isSubmitting}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setTicketData({ ...ticketData, customImage: reader.result as string });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">START DATE</p>
                    <div className="relative border-b border-black pb-2 flex items-center justify-between">
                      <input 
                        type="date"
                        disabled={isSubmitting}
                        value={ticketData.startDate}
                        onChange={(e) => setTicketData({ ...ticketData, startDate: e.target.value })}
                        className="w-full text-base font-bold outline-none bg-transparent disabled:opacity-50"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">READING DATE</p>
                    <div className="relative border-b border-black pb-2 flex items-center justify-between">
                      <input 
                        type="date"
                        disabled={isSubmitting}
                        value={ticketData.dateRead}
                        onChange={(e) => setTicketData({ ...ticketData, dateRead: e.target.value })}
                        className="w-full text-base font-bold outline-none bg-transparent disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Review */}
                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">ONE-LINE REVIEW</p>
                  <div className="relative border-b border-black pb-2">
                    <textarea 
                      disabled={isSubmitting}
                      value={ticketData.review}
                      onChange={(e) => setTicketData({ ...ticketData, review: e.target.value })}
                      placeholder="이 책이 남긴 여운을 한 줄로 적어주세요."
                      className="w-full text-lg font-medium outline-none placeholder:text-gray-300 resize-none h-20 bg-transparent disabled:opacity-50"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleIssueTicket}
                  disabled={isSubmitting}
                  className="w-full border-b border-black pb-4 flex items-center justify-between group hover:border-[#0033FF] transition-colors pt-4 disabled:opacity-50 disabled:hover:border-black"
                >
                  <span className={cn("text-3xl font-black transition-colors", isSubmitting ? "text-gray-400" : "group-hover:text-[#0033FF]")}>
                    {isSubmitting ? "ISSUING TICKET..." : "ISSUE TICKET"}
                  </span>
                  {isSubmitting ? (
                    <Loader2 className="text-gray-400 animate-spin" size={28} />
                  ) : (
                    <Check className="text-black group-hover:text-[#0033FF] transition-colors" size={28} />
                  )}
                </button>
              </div>

              {/* Right: Live Preview */}
              <div className="flex-1 w-full hidden lg:flex flex-col items-center justify-center sticky top-20">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mb-12">LIVE TICKET PREVIEW</p>
                {/* PhotoCard가 480x240 규격이므로 화면에 맞게 스케일링 */}
                <div className="scale-100 xl:scale-125 origin-center drop-shadow-2xl">
                  <PhotoCard ticket={previewTicket} />
                </div>
              </div>

            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};