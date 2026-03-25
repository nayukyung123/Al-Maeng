export interface WishlistItem {
  wishlistId: number;
  bookId: number;
  title: string;
  author: string;
  coverImageUrl: string;
}

export interface WishlistPageData {
  content: WishlistItem[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
  isFirst: boolean;
  isLast: boolean;
}

export interface WishlistAddRequest {
  bookId: number;
}
