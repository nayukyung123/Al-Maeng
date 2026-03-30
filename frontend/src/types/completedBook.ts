export interface CompletedBook {
  completedBookId: number;
  bookId: number;
  slug: string;
  title: string;
  author: string;
  coverImageUrl: string;
  /** 백엔드 `CompletedBookResponse.genreName` (대분류, 없으면 "미분류") */
  genreName: string;
  completedAt: string;
  createdAt: string;
}

export interface AddCompletedBookRequest {
  bookId: number;
  source: string;
}
