import type { Metadata } from 'next';
import MyPageClient from '@/components/mypage/MyPageClient';

export const metadata: Metadata = {
  title: '마이페이지 | AL-MAENG',
  description: '사용자 프로필, 위시리스트, 완독 도서 관리를 위한 마이페이지입니다.',
};

export default function MyPage() {
  return <MyPageClient />;
}
