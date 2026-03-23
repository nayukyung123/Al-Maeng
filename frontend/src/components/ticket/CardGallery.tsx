"use client";

import React, { useMemo, useState, useEffect, useRef } from 'react';
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
      // 좀 더 응축된 화면 안에서 스폰되도록 조정 (화면 밖으로 나가는 것 최소화)
      const x = (Math.random() - 0.5) * 800; 
      const y = (Math.random() - 0.5) * 300;  
      const rotate = (Math.random() - 0.5) * 40;
      return { ticket, x, y, rotate, delay: index * 0.05 };
    });
  }, [tickets]);

  return (
    // z-10을 부여하고 화면 전체(절대값)를 덮도록 설정. 내부 카드가 상위 요소 밑으로 드래그됨
    <div className="absolute inset-0 pt-24 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing z-10">
      <div className="relative w-full h-full flex items-center justify-center">
        {scatteredCards.map((card) => (
          <DraggableCard key={card.ticket.id} {...card} dragConstraints={{ left: -1000, right: 1000, top: -500, bottom: 500 }} />
        ))}
        {/* 배경 텍스처 */}
        <div className="absolute inset-0 -z-10 bg-stone-50 opacity-50 pointer-events-none" />
        <div className="absolute inset-0 -z-10 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-20 pointer-events-none" />
      </div>
    </div>
  );
};
