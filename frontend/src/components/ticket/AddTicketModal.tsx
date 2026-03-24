"use client";

import React, { useState, useEffect, useMemo } from "react";
import { X, Search, Plus, Check, Loader2, ChevronRight, Image as ImageIcon } from "lucide-react";
import { GalleryTicket } from "@/types/ticket";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { PhotoCard } from "./PhotoCard";
import { useQuery } from "@tanstack/react-query";
import { fetchCompletedBooks } from "@/api/completedBooks";
import { createTicket, fetchTicketImagePresignedUrl, type TicketStyleDataDto } from "@/api/tickets";

interface AddTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newTicket: GalleryTicket) => void;
  initialBookId?: number | null;
}

const COLOR_PALETTE = [
  { id: 'bg-white', name: 'WHITE', hex: '#ffffff' },
  { id: 'bg-stone-100', name: 'STONE', hex: '#f5f5f4' },
  { id: 'bg-slate-100', name: 'SLATE', hex: '#f1f5f9' },
  { id: 'bg-zinc-200', name: 'ZINC', hex: '#e4e4e7' },
  { id: 'bg-[#e2e8f0]', name: 'MUTED BLUE', hex: '#e2e8f0' },
];

export const AddTicketModal = ({ isOpen, onClose, onSuccess, initialBookId }: AddTicketModalProps) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [selectedBook, setSelectedBook] = useState<any | null>(null);
  
  const [ticketData, setTicketData] = useState({
    dateRead: new Date().toISOString().split("T")[0],
    startDate: "",
    review: "",
    customImage: "",
    orientation: "horizontal" as 'horizontal' | 'vertical',
    imageLayout: "classic", // 'classic'(직사각형) | 'modern'(원형)
    font: "serif", // 'serif' | 'sans' | 'mono'
    background: "bg-white",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [customImageFile, setCustomImageFile] = useState<File | null>(null);

  const { data: completedBooks = [] } = useQuery({
    queryKey: ["completed-books"],
    queryFn: fetchCompletedBooks,
    enabled: isOpen,
  });

  const searchResults = useMemo(() => {
    const mapped = completedBooks.map((book) => ({
      id: String(book.bookId),
      title: book.title,
      author: book.author,
      genre: book.genreName ?? "미분류",
      completedAt: book.completedAt,
      coverImageUrl: book.coverImageUrl,
    }));
  
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return mapped;
  
    return mapped.filter(
      (book) =>
        book.title.toLowerCase().includes(normalized) ||
        book.author.toLowerCase().includes(normalized)
    );
  }, [completedBooks, searchQuery]);

  useEffect(() => {
    if (!isOpen || !initialBookId || completedBooks.length === 0) return;
    const matched = completedBooks.find((book) => book.bookId === initialBookId);
    if (!matched) return;
    handleSelectBook({
      id: String(matched.bookId),
      title: matched.title,
      author: matched.author,
      genre: matched.genreName ?? "미분류",
      completedAt: matched.completedAt,
      coverImageUrl: matched.coverImageUrl,
    });
  }, [isOpen, initialBookId, completedBooks]);

  const handleSelectBook = (book: any) => {
    setSelectedBook(book);
    setStep(2);
  };

  const handleIssueTicket = async () => {
    if (!selectedBook) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      let uploadedImageUrl = ticketData.customImage;
      if (customImageFile) {
        try {
          const ext = (customImageFile.name.split(".").pop()?.toLowerCase() || "jpg");
          const mimeType = customImageFile.type || (ext === "jpg" ? "image/jpeg" : `image/${ext}`);
          const { presignedUrl, imageUrl } = await fetchTicketImagePresignedUrl(ext);
          const s3Response = await fetch(presignedUrl, {
            method: "PUT",
            headers: {
              "Content-Type": mimeType,
            },
            body: customImageFile,
          });
          if (!s3Response.ok) {
            throw new Error(`이미지 업로드 실패 (${s3Response.status})`);
          }
          uploadedImageUrl = imageUrl;
        } catch (uploadErr) {
          // S3 업로드 실패 시 이미지 없이 티켓 생성 진행 (경고만 표시)
          console.warn("S3 이미지 업로드 실패, 이미지 없이 티켓을 생성합니다:", uploadErr);
          setSubmitError("이미지 업로드에 실패했습니다. 이미지 없이 티켓을 생성합니다.");
          uploadedImageUrl = "";
        }
      }
      const completedAtIso = `${ticketData.dateRead}T00:00:00`;
      const styleData: TicketStyleDataDto = {
        orientation: ticketData.orientation,
        coverShape: ticketData.imageLayout,
        typography: ticketData.font,
        ticketColor: ticketData.background,
      };
      const created = await createTicket({
        bookId: parseInt(selectedBook.id, 10),
        completedAt: completedAtIso,
        comment: ticketData.review || undefined,
        ticketImageUrl: uploadedImageUrl || undefined,
        styleData,
      });
      const newTicket: GalleryTicket = {
        id: created.id,
        bookId: parseInt(selectedBook.id),
        title: selectedBook.title,
        author: selectedBook.author,
        genre: selectedBook.genre,
        completedAt: ticketData.dateRead,
        comment: ticketData.review,
        templateId: ticketData.imageLayout, // 레이아웃 매핑
        style: { 
          font: ticketData.font as 'serif' | 'sans' | 'mono', 
          background: ticketData.background, 
          textColor: 'text-stone-900',
          orientation: ticketData.orientation 
        },
        coverImageUrl: selectedBook.coverImageUrl,
        ticketImageUrl: uploadedImageUrl || selectedBook.coverImageUrl || `https://picsum.photos/seed/${selectedBook.id}/400/600`,
        rating: 4.5 // 임시
      };
      onSuccess(newTicket);
      resetState();
    } catch (e) {
      console.error(e);
      const message = e instanceof Error ? e.message : "티켓 생성에 실패했습니다.";
      setSubmitError((prev) => prev ?? message); // 이미 이미지 경고가 있으면 덮어쓰지 않음
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetState = () => {
    setStep(1);
    setSearchQuery("");
    setSubmitError(null);
    setTicketData({
      dateRead: new Date().toISOString().split("T")[0],
      startDate: "",
      review: "",
      customImage: "",
      orientation: "horizontal",
      imageLayout: "classic",
      font: "serif",
      background: "bg-white",
    });
    setSelectedBook(null);
    setCustomImageFile(null);
    onClose();
  };

  const previewTicket: GalleryTicket & { rating?: number } = {
    id: -1,
    bookId: parseInt(selectedBook?.id || '0'),
    title: selectedBook?.title || 'TITLE',
    author: selectedBook?.author || 'AUTHOR',
    genre: selectedBook?.genre || 'GENRE',
    completedAt: ticketData.dateRead,
    comment: ticketData.review || '이 책이 남긴 여운을 한 줄로 적어주세요.',
    templateId: ticketData.imageLayout,
    style: { 
      font: ticketData.font as 'serif' | 'sans' | 'mono', 
      background: ticketData.background, 
      textColor: 'text-stone-900',
      orientation: ticketData.orientation
    },
    ticketImageUrl: ticketData.customImage || `https://picsum.photos/seed/${selectedBook?.id}/400/600`,
    rating: 4.5
  };

  const isHorizontal = ticketData.orientation === 'horizontal';

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-white/95 backdrop-blur-sm"
      >
        <button onClick={resetState} disabled={isSubmitting} className="absolute top-8 right-8 text-black hover:opacity-50 transition-opacity disabled:opacity-20 z-50">
          <X size={32} />
        </button>

        <div className="w-full max-w-7xl px-6 h-[95vh] flex flex-col justify-center">
          {step === 1 ? (
            <div className="flex flex-col items-center">
              <h2 className="text-4xl font-black mb-12">기록할 도서를 검색하세요.</h2>
              <div className="w-full max-w-2xl relative">
                <div className="relative border-b-2 border-[#0033FF] pb-2 flex items-center">
                  <input 
                    type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="이미 완독한 도서명 또는 작가명을 입력하세요"
                    className="w-full text-2xl font-bold outline-none bg-transparent placeholder:text-gray-300" autoFocus
                  />
                  <Search className="text-gray-300 ml-4" size={28} />
                </div>
                <div className="mt-8 space-y-2 max-h-[50vh] overflow-y-auto pr-2 hide-scrollbar">
                  {searchResults.map((book, idx) => (
                    <div key={book.id} onClick={() => handleSelectBook(book)} className={cn("flex items-center p-4 cursor-pointer transition-all border border-transparent rounded-lg group", idx === 0 ? "bg-stone-50 border-stone-200 shadow-sm" : "hover:bg-stone-50")}>
                      <div className="w-12 h-16 bg-stone-200 mr-6 overflow-hidden shadow-sm group-hover:scale-105 transition-transform">
                        <img src={book.coverImageUrl || `https://picsum.photos/seed/${book.id}/200/300`} alt="Cover" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" crossOrigin="anonymous"/>
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
            <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-12 lg:gap-16 h-full overflow-y-auto hide-scrollbar py-10">
              
              {/* 왼쪽: 컨트롤 폼 영역 */}
              <div className="flex-1 w-full max-w-md space-y-8 shrink-0">
                <div className="text-left mb-8 border-b border-black/10 pb-6">
                  <h3 className="text-3xl font-black mb-1">{selectedBook?.title}</h3>
                  <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">{selectedBook?.author}</p>
                </div>

                {/* 1. 디자인 컨트롤 (방향, 레이아웃, 폰트, 컬러) */}
                <div className="space-y-6 bg-stone-50 p-6 rounded-lg border border-stone-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">ORIENTATION (방향)</p>
                      <div className="flex bg-white rounded-md border p-1">
                        <button onClick={() => setTicketData({...ticketData, orientation: 'horizontal'})} className={cn("flex-1 py-2 text-xs font-bold rounded-sm transition-colors", ticketData.orientation === 'horizontal' ? "bg-black text-white" : "text-gray-400 hover:bg-gray-50")}>가로형</button>
                        <button onClick={() => setTicketData({...ticketData, orientation: 'vertical'})} className={cn("flex-1 py-2 text-xs font-bold rounded-sm transition-colors", ticketData.orientation === 'vertical' ? "bg-black text-white" : "text-gray-400 hover:bg-gray-50")}>세로형</button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">COVER SHAPE (사진 모양)</p>
                      <div className="flex bg-white rounded-md border p-1">
                        <button onClick={() => setTicketData({...ticketData, imageLayout: 'classic'})} className={cn("flex-1 py-2 text-xs font-bold rounded-sm transition-colors", ticketData.imageLayout === 'classic' ? "bg-black text-white" : "text-gray-400 hover:bg-gray-50")}>직사각형</button>
                        <button onClick={() => setTicketData({...ticketData, imageLayout: 'modern'})} className={cn("flex-1 py-2 text-xs font-bold rounded-sm transition-colors", ticketData.imageLayout === 'modern' ? "bg-black text-white" : "text-gray-400 hover:bg-gray-50")}>원형</button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">TYPOGRAPHY (글씨체)</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[{ id: 'serif', name: '노토 세리프' }, { id: 'sans', name: '프리텐다드' }, { id: 'mono', name: '고운 돋움' }].map(font => (
                        <button key={font.id} onClick={() => setTicketData({ ...ticketData, font: font.id })} className={cn("py-2 rounded-md text-xs font-bold border transition-colors bg-white", ticketData.font === font.id ? "border-black text-black ring-1 ring-black" : "border-gray-200 text-gray-400 hover:border-black")}>
                          {font.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">TICKET COLOR (배경색)</p>
                    <div className="flex gap-4">
                      {COLOR_PALETTE.map(color => (
                        <button key={color.id} onClick={() => setTicketData({ ...ticketData, background: color.id })} className={cn("w-8 h-8 rounded-full border-2 transition-transform shadow-sm", ticketData.background === color.id ? "border-black scale-110" : "border-transparent hover:scale-105")} style={{ backgroundColor: color.hex }} title={color.name} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. 데이터 입력 컨트롤 */}
                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">CUSTOM COVER (선택)</p>
                  <label className="flex items-center justify-center w-full h-12 border border-dashed border-gray-300 hover:border-black hover:bg-stone-50 transition-colors cursor-pointer rounded-sm group disabled:opacity-50">
                    <ImageIcon className="text-gray-400 group-hover:text-black mr-2" size={20} />
                    <span className="text-xs font-bold text-gray-500 group-hover:text-black tracking-widest">UPLOAD IMAGE</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setCustomImageFile(file);
                        const reader = new FileReader();
                        reader.onloadend = () => setTicketData({ ...ticketData, customImage: reader.result as string });
                        reader.readAsDataURL(file);
                      }
                    }} />
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">DATE COMPLETED (완독일)</p>
                    <div className="relative border-b border-black pb-2"><input type="date" value={ticketData.dateRead} onChange={(e) => setTicketData({ ...ticketData, dateRead: e.target.value })} className="w-full text-base font-bold outline-none bg-transparent"/></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">ONE-LINE REVIEW</p>
                  <div className="relative border-b border-black pb-2">
                    <textarea value={ticketData.review} onChange={(e) => setTicketData({ ...ticketData, review: e.target.value })} placeholder="이 책이 남긴 여운을 한 줄로 적어주세요." maxLength={255} className="w-full text-lg font-medium outline-none placeholder:text-gray-300 resize-none h-16 bg-transparent" />
                    <span className={cn("absolute bottom-3 right-0 text-[10px] font-bold tabular-nums", ticketData.review.length >= 255 ? "text-red-500" : "text-gray-300")}>
                      {ticketData.review.length} / 255
                    </span>
                  </div>
                </div>

                {submitError && (
                  <p className="text-xs text-red-500 font-medium mb-2 px-1">{submitError}</p>
                )}
                <button onClick={handleIssueTicket} disabled={isSubmitting} className="w-full border-b border-black pb-4 flex items-center justify-between group hover:border-[#0033FF] transition-colors pt-4 disabled:opacity-50">
                  <span className={cn("text-3xl font-black transition-colors", isSubmitting ? "text-gray-400" : "group-hover:text-[#0033FF]")}>
                    {isSubmitting ? "ISSUING TICKET..." : "ISSUE TICKET"}
                  </span>
                  {isSubmitting ? <Loader2 className="text-gray-400 animate-spin" size={28} /> : <Check className="text-black group-hover:text-[#0033FF] transition-colors" size={28} />}
                </button>
              </div>

              {/* 오른쪽: 양면 라이브 미리보기 */}
              <div className="flex-1 w-full hidden lg:flex flex-col items-center justify-center sticky top-10">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mb-6">LIVE TICKET PREVIEW</p>
                
                {/* 방향에 따라 미리보기 배치를 다르게 함 (가로는 위아래로, 세로는 양옆으로) */}
                <div className={cn("flex w-full items-center justify-center", isHorizontal ? "flex-col gap-6" : "flex-row gap-8")}>
                  
                  {/* 앞면 (Front) */}
                  <div className="flex flex-col items-center">
                    <div className="scale-[0.6] xl:scale-[0.8] origin-center drop-shadow-xl">
                      <PhotoCard ticket={previewTicket} holeColor="bg-[#f5f2ed]" rating={4.5} />
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mt-[-10px]">FRONT SIDE</span>
                  </div>

                  {/* 뒷면 (Back) - TicketDetailModal에 있는 뒷면 디자인을 그대로 복사해옴 */}
                  <div className="flex flex-col items-center">
                    <div className="scale-[0.6] xl:scale-[0.8] origin-center drop-shadow-xl">
                      
                      {isHorizontal ? (
                        /* 가로형 뒷면 미리보기 */
                        <div className={cn("w-[480px] h-[240px] flex flex-row-reverse shadow-2xl rounded-lg overflow-hidden relative", previewTicket.style?.background, previewTicket.style?.textColor)}>
                          <div className="flex-1 p-6 flex flex-col items-center justify-center relative z-10 rounded-r-lg">
                            <div className="absolute top-6 left-6 font-mono text-[10px] font-bold opacity-40">NO. PREVIEW</div>
                            <div className="border-[4px] border-red-600/70 text-red-600 px-6 py-4 flex flex-col items-center justify-center -rotate-6 opacity-80 backdrop-blur-sm shadow-sm">
                              <p className="font-sans font-black text-4xl tracking-tighter uppercase leading-none border-b-[3px] border-red-600/70 pb-2 mb-2">AL-MAENG</p>
                              <p className="font-sans font-bold text-sm tracking-[0.4em] uppercase">Archive</p>
                            </div>
                          </div>
                          <div className="relative border-dashed border-current opacity-20 flex justify-between z-30 w-px h-full border-l-2 py-2 -mx-px flex-col">
                            <div className="absolute rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] bg-black/90 w-6 h-6 -top-3 -left-[11px]" />
                            <div className="absolute rounded-full shadow-[inset_0_-2px_4px_rgba(0,0,0,0.1)] bg-black/90 w-6 h-6 -bottom-3 -left-[11px]" />
                          </div>
                          <div className="shrink-0 p-6 flex items-center justify-center bg-current/5 relative z-10 w-32 h-full border-r border-current/5 rounded-l-lg">
                            <div className="text-center opacity-30 -rotate-90 whitespace-nowrap">
                              <p className="font-sans font-black text-lg tracking-[0.2em] uppercase">TICKET</p>
                              <p className="font-mono text-[10px] font-bold mt-1 tracking-widest">{ticketData.dateRead.replace(/-/g, '')}</p>
                            </div>
                          </div>
                          <div className="absolute inset-0 pointer-events-none opacity-[0.05] mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')] z-40" />
                        </div>
                      ) : (
                        /* 세로형 뒷면 미리보기 */
                        <div className={cn("w-[240px] h-[480px] flex flex-col shadow-2xl rounded-lg overflow-hidden relative", previewTicket.style?.background, previewTicket.style?.textColor)}>
                          <div className="w-full h-full relative z-10 rounded-lg overflow-hidden">
                            <img src={previewTicket.ticketImageUrl} alt="Back" className="w-full h-full object-cover" crossOrigin="anonymous" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-10 flex flex-col justify-end text-white">
                                <p className="font-sans font-black text-3xl leading-tight uppercase tracking-tight line-clamp-2 border-b-2 border-white pb-2 mb-2 italic">{previewTicket.title}</p>
                                <p className="font-sans font-bold text-sm tracking-[0.4em] uppercase">Archive</p>
                            </div>
                          </div>
                          <div className="absolute inset-0 pointer-events-none opacity-[0.05] mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')] z-40" />
                        </div>
                      )}

                    </div>
                    <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase mt-[-10px]">BACK SIDE</span>
                  </div>

                </div>
              </div>

            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};