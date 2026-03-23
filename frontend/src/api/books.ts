import apiClient from "@/lib/axios";
import type { ApiResponse, SliceResponse } from "@/types/api";
import type { Book, BookSuggestion } from "@/types/home";

// ────────────────────────────────────────────────────────────
// 🟢 자동완성  GET /api/books/suggestions?keyword={keyword}
//    응답: ApiResponse<BookSuggestionResponse[]>
//            └ { bookId, title, author }
// ────────────────────────────────────────────────────────────
export async function fetchBookSuggestions(keyword: string): Promise<BookSuggestion[]> {
  const response = await apiClient.get<ApiResponse<BookSuggestion[]>>(
    "/api/books/suggestions",
    { params: { keyword } }
  );
  return response.data.data;
}

// ────────────────────────────────────────────────────────────
// 🟢 도서 검색  GET /api/books?keyword={keyword}
//    응답: ApiResponse<Slice<BookResponse>>
//            └ { content: Book[], hasNext, ... }
// ────────────────────────────────────────────────────────────
export async function fetchBooks(
  keyword: string,
  page = 0,
  size = 10
): Promise<SliceResponse<Book>> {
  const response = await apiClient.get<ApiResponse<SliceResponse<Book>>>("/api/books", {
    params: { keyword, page, size, sort: "id,DESC" },
  });
  return response.data.data;
}

// ────────────────────────────────────────────────────────────
// RankingType 탭 → 백엔드 enum
// ────────────────────────────────────────────────────────────
export const RANK_TYPE_MAP: Record<string, string> = {
  완독순: "COMPLETED",
  찜한순: "FAVORITE",
  조회순: "VIEW",
};

// ────────────────────────────────────────────────────────────
// 🟢 인기 도서 랭킹  GET /api/books/rankings?period=&type=
//    period: "ALL_TIME" | "WEEKLY" (기본 ALL_TIME)
//    type  : "COMPLETED" | "FAVORITE" | "VIEW" (기본 VIEW)
//    응답: ApiResponse<BookResponse[]>
//            └ { id, title, author, coverImageUrl }
// ────────────────────────────────────────────────────────────
export async function fetchBookRankings(
  period = "ALL_TIME",
  type = "VIEW"
): Promise<Book[]> {
  const response = await apiClient.get<ApiResponse<Book[]>>("/api/books/rankings", {
    params: { period, type },
  });
  return response.data.data;
}

// ────────────────────────────────────────────────────────────
// 🟢 실시간 검색어 랭킹  GET /api/keywords/rankings
//    응답: ApiResponse<List<String>>  →  string[]
// ────────────────────────────────────────────────────────────
export async function fetchKeywordRankings(): Promise<string[]> {
  const response = await apiClient.get<ApiResponse<string[]>>("/api/keywords/rankings");
  return response.data.data;
}
