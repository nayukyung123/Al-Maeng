import React, { Suspense } from 'react';
import { TicketsClient } from '@/components/ticket/TicketsClient';

export const metadata = {
  title: '나의 티켓 | Al-Maeng',
  description: '사용자의 독서 완료 티켓과 바인더를 모아보는 공간입니다.',
};

export default function TicketsPage() {
  return (
    <Suspense fallback={<div className="pt-24 pb-32 px-6 min-h-screen bg-stone-50" />}>
      <TicketsClient />
    </Suspense>
  );
}
