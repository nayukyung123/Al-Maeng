/** 
 * 티켓 목업 및 API 스키마를 반영한 갤러리/바인더용 티켓 타입 
 */
export interface CardStyle {
  background: string;
  textColor: string;
  font: 'serif' | 'sans' | 'mono';
}

export interface GalleryTicket {
  /** 티켓 고유 식별자 */
  id: string;

  /** 기반이 된 원본 도서 ID */
  bookId: number;

  /** 도서 제목 */
  title: string;

  /** 도서 저자 */
  author: string;

  /** 장르 (더미 데이터용) */
  genre?: string;

  /** 도서 표지 URL */
  coverImageUrl?: string;

  /** 백엔드에서 생성해준 티켓 포토카드 URL */
  ticketImageUrl?: string;

  /** 짧은 감상평 (리뷰) */
  comment?: string;

  /** 완독 일자 */
  completedAt: string;

  // --- 이하 프론트엔드 목업 및 디자인 속성 --- //

  /** 카드 템플릿 식별 (classic, minimal, modern 등) */
  templateId?: string;

  /** 템플릿 세부 스타일 (폰트, 컬러셋) */
  style?: CardStyle;
}
