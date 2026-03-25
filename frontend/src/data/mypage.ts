import { Book } from '../types/mypage';

export const WISHLIST_BOOKS: Book[] = [
  { bookId: 1, title: '문과 남자의 과학 공부', author: '유시민', coverImageUrl: 'https://picsum.photos/seed/1/400/600', dateRead: '2023-10-01' },
  { bookId: 2, title: '도둑맞은 집중력', author: '요한 하리', coverImageUrl: 'https://picsum.photos/seed/2/400/600', dateRead: '2023-10-05' },
  { bookId: 3, title: '돈의 속성', author: '김승호', coverImageUrl: 'https://picsum.photos/seed/3/400/600', dateRead: '2023-10-10' },
  { bookId: 4, title: '역행자', author: '자청', coverImageUrl: 'https://picsum.photos/seed/4/400/600', dateRead: '2023-10-12' },
  { bookId: 5, title: '불편한 편의점', author: '김호연', coverImageUrl: 'https://picsum.photos/seed/5/400/600', dateRead: '2023-10-20' },
  { bookId: 6, title: '트렌드 코리아 2024', author: '김난도', coverImageUrl: 'https://picsum.photos/seed/6/400/600', dateRead: '2023-10-25' },
];

export const FINISHED_BOOKS: Book[] = [
  { bookId: 7, title: '사피엔스', author: '유발 하라리', coverImageUrl: 'https://picsum.photos/seed/8/400/600', dateRead: '2023-11-12' },
  { bookId: 8, title: '코스모스', author: '칼 세이건', coverImageUrl: 'https://picsum.photos/seed/9/400/600', dateRead: '2023-11-15' },
  { bookId: 9, title: '이기적 유전자', author: '리처드 도킨스', coverImageUrl: 'https://picsum.photos/seed/10/400/600', dateRead: '2023-11-20' },
  { bookId: 10, title: '총, 균, 쇠', author: '재레드 다이아몬드', coverImageUrl: 'https://picsum.photos/seed/11/400/600', dateRead: '2023-11-25' },
  { bookId: 11, title: '정의란 무엇인가', author: '마이클 샌델', coverImageUrl: 'https://picsum.photos/seed/12/400/600', dateRead: '2023-12-01' },
];

export const MAIN_CHART_DATA = [
  { subject: '문학(소설)', A: 120 },
  { subject: '에세이', A: 98 },
  { subject: '인문/철학', A: 86 },
  { subject: 'SF', A: 99 },
  { subject: '과학', A: 65 },
  { subject: '예술', A: 45 },
];

export const FICTION_SUB_CHART_DATA = [
  { subject: '고전', A: 110, fullMark: 150 },
  { subject: '현대', A: 130, fullMark: 150 },
  { subject: '미스터리', A: 80, fullMark: 150 },
  { subject: '로맨스', A: 60, fullMark: 150 },
  { subject: '판타지', A: 140, fullMark: 150 },
];
