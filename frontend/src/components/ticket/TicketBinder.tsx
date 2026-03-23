"use client";

import React, { useEffect, useState } from 'react';
import { GalleryTicket } from '@/types/ticket';
import { PhotoCard } from './PhotoCard';

// 바인더용 전체 더미 데이터
const fetchDummyBinderTickets = (): GalleryTicket[] => {
  return Array.from({ length: 15 }).map((_, i) => ({
    id: `binder-${i}`,
    bookId: 200 + i,
    title: `Binder Book Title ${i + 1}`,
    author: `Binder Author ${i + 1}`,
    genre: 'fiction',
    completedAt: `2024-02-${String((i % 28) + 1).padStart(2, '0')}`,
    comment: `Detailed review for binder book ${i + 1}.`,
    templateId: 'minimal',
    style: { font: 'sans', background: 'bg-stone-50', textColor: 'text-stone-900' }
  }));
};

export const TicketBinder = () => {
  const [tickets, setTickets] = useState<GalleryTicket[]>([]);

  useEffect(() => {
    setTickets(fetchDummyBinderTickets());
  }, []);

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8 justify-items-center">
        {tickets.map((ticket) => (
          <div key={ticket.id} className="transform hover:scale-105 transition-transform duration-300 cursor-pointer">
            <PhotoCard ticket={ticket} />
          </div>
        ))}
      </div>
    </div>
  );
};
