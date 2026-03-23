import React from 'react';
import { LibraryClient } from '@/components/ticket/LibraryClient';

export const metadata = {
  title: '나의 티켓 | Al-Maeng',
  description: '사용자의 독서 완료 티켓과 바인더를 모아보는 공간입니다.',
};

export default function LibraryPage() {
  return <LibraryClient />;
}
