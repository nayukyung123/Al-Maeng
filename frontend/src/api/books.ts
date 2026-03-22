import apiClient from "@/lib/axios";
import type { ApiResponse, SliceResponse } from "@/types/api";
import type { Book, BookSuggestion } from "@/types/home";

// ────────────────────────────────────────────────────────────
// RankingType 매핑 (UI 탭 라벨 → 백엔드 enum)
// ────────────────────────────────────────────────────────────
export const RANK_TAB_MAP: Record<string, string> = {
  완독순: "COMPLETED",
  찜한순: "FAVORITE",
  조회순: "VIEW",
};

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
// 🟢 인기 도서 랭킹  GET /api/books/rankings?type=&period=
//    응답: ApiResponse<BookResponse[]>
//            └ { id, title, author, coverImageUrl }
// ────────────────────────────────────────────────────────────
export async function fetchBookRankings(
  rankTab = "완독순",
  period = "ALL_TIME"
): Promise<Book[]> {
  const type = RANK_TAB_MAP[rankTab] ?? "VIEW";
  const response = await apiClient.get<ApiResponse<Book[]>>("/api/books/rankings", {
    params: { type, period },
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
