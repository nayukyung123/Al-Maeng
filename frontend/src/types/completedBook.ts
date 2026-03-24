export interface CompletedBook {
  completedBookId: number;
  bookId: number;
  title: string;
  author: string;
  coverImageUrl: string;
  completedAt: string;
  createdAt: string;
}

export interface AddCompletedBookRequest {
  bookId: number;
  readDate: string;
}
