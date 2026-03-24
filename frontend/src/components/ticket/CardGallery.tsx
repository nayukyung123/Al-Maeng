"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { GalleryTicket } from '@/types/ticket';
import { DraggableCard } from './DraggableCard';

const fetchDummyGalleryTickets = (): GalleryTicket[] => {
  return Array.from({ length: 7 }).map((_, i) => {
    const orientation = i % 3 === 2 ? 'vertical' : 'horizontal';
    
    return {
      id: `ticket-${i}`,
      bookId: 100 + i,
      title: [
        '사피엔스: 유인원에서 사이보그까지', 
        '데미안: 에밀 싱클레어의 젊은 시절의 이야기', 
        '코스모스: 칼 세이건',
        '쇼펜하우어 소품집: 인생의 지혜'
      ][i % 4],
      author: ['유발 하라리', '헤르만 헤세', '칼 세이건', '아르투어 쇼펜하우어'][i % 4],
      genre: ['인문', '소설', '과학', '철학'][i % 4],
      completedAt: `2024-03-${String(i + 1).padStart(2, '0')}`,
      comment: i % 2 === 0 ? `이 책을 읽고 텍스트 힙 감성이 충만해졌습니다. 삶의 본질에 대해 다시 생각하게 만드는 계기가 되었네요.` : undefined,
      style: {
        font: ['serif', 'sans', 'mono'][i % 3] as 'serif' | 'sans' | 'mono',
        background: ['bg-white', 'bg-[#f4efe6]', 'bg-stone-100'][i % 3],
        textColor: 'text-stone-900',
        orientation: orientation
      },
      templateId: ['classic', 'minimal', 'modern'][i % 3],
      rating: (i % 5) + 1,
      coverImageUrl: `https://picsum.photos/seed/${100 + i}/400/600`
    };
  });
};

export const CardGallery = () => {
  const [tickets, setTickets] = useState<GalleryTicket[]>([]);

  useEffect(() => {
    // 빈 배열 마운트 후 데이터를 불러옴
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
          <DraggableCard 
            key={card.ticket.id} 
            {...card} 
            dragConstraints={{ left: -1000, right: 1000, top: -500, bottom: 500 }} 
          />
        ))}
        {/* 배경 텍스처 */}
        <div className="absolute inset-0 -z-10 bg-stone-50 opacity-50 pointer-events-none" />
        <div className="absolute inset-0 -z-10 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] opacity-20 pointer-events-none" />
      </div>
    </div>
  );
};