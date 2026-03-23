"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { GalleryTicket } from '@/types/ticket';
import { DraggableCard } from './DraggableCard';

// 더미 데이터 생성 함수 (API 연동 캐싱 시뮬레이트)
const fetchDummyGalleryTickets = (): GalleryTicket[] => {
  return Array.from({ length: 10 }).map((_, i) => ({
    id: `ticket-${i}`,
    bookId: 100 + i,
    title: `Mock Gallery Book ${i + 1}`,
    author: `Gallery Author ${i + 1}`,
    genre: ['fiction', 'essay', 'science', 'history'][i % 4],
    completedAt: `2024-03-${String(i + 1).padStart(2, '0')}`,
    comment: `This is a mock gallery review for book ${i + 1}.`,
    style: {
      font: ['serif', 'sans', 'mono'][i % 3] as any,
      background: ['bg-white', 'bg-[#f4efe6]', 'bg-[#eef2f5]'][i % 3],
      textColor: 'text-stone-900',
    },
    templateId: ['classic', 'minimal', 'modern'][i % 3]
  }));
};

export const CardGallery = () => {
  const [tickets, setTickets] = useState<GalleryTicket[]>([]);

  useEffect(() => {
    // 빈 배열 마운트 후 데이터를 불러옴 (가짜 지연 없음)
    setTickets(fetchDummyGalleryTickets());
  }, []);

  const scatteredCards = useMemo(() => {
    return tickets.map((ticket, index) => {
      const x = (Math.random() - 0.5) * 1200; 
      const y = (Math.random() - 0.5) * 400;  
      const rotate = (Math.random() - 0.5) * 40;
      return { ticket, x, y, rotate, delay: index * 0.05 };
    });
  }, [tickets]);

  return (
    <div className="relative w-full min-h-[70vh] flex items-center justify-center overflow-x-auto hide-scrollbar py-20 cursor-grab active:cursor-grabbing">
      <div className="relative min-w-[2000px] flex items-center justify-center pt-24">
        {scatteredCards.map((card) => (
          <DraggableCard key={card.ticket.id} {...card} />
        ))}
        {/* 배경 텍스처 */}
        <div className="absolute inset-0 -z-10 bg-stone-50 opacity-50" />
        <div className="absolute inset-0 -z-10 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-20" />
      </div>
    </div>
  );
};
