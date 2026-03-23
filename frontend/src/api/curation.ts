import apiClient from "@/lib/axios";
import type { ApiResponse, SliceResponse } from "@/types/api";

// ─────────────────────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────────────────────

/**
 * 자동완성 전용 응답 (GET /api/contents/suggestions)
 * 백엔드 ContentSuggestionResponse: { id, title }
 */
export interface ContentSuggestion {
  id: number;
  title: string;
}

/**
 * 전체 검색 응답 항목 (GET /api/contents)
 * 백엔드 ContentResponse: { id, title, type, posterUrl }
 */
export interface ContentItem {
  id: number;
  title: string;
  type: string;
  posterUrl: string;
}

/** 큐레이션 요청 본문 */
export interface CurationRequest {
  contentId: number;
  bookLength: "SHORT" | "MEDIUM" | "LONG";
}

/** 큐레이션 결과 내 개별 도서 */
export interface CurationBook {
  bookId: number;
  title: string;
  author: string;
  coverImageUrl: string;
}

/** 큐레이션 결과 태그 섹션 */
export interface CurationSection {
  tagId: number;
  tagName: string;
  books: CurationBook[];
}

// ─────────────────────────────────────────────────────────────
// 🟢 자동완성  GET /api/contents/suggestions?keyword={keyword}
//    응답: ApiResponse<ContentSuggestionResponse[]>
//            └ { id, title }
// ─────────────────────────────────────────────────────────────
export async function fetchContentSuggestions(
  keyword: string
): Promise<ContentSuggestion[]> {
  if (!keyword.trim()) return [];
  const response = await apiClient.get<ApiResponse<ContentSuggestion[]>>(
    "/api/contents/suggestions",
    { params: { keyword } }
  );
  return response.data.data ?? [];
}

// ─────────────────────────────────────────────────────────────
// 🟢 영상 콘텐츠 전체 검색  GET /api/contents?keyword={keyword}
//    응답: ApiResponse<Slice<ContentResponse>>
//            └ { content: ContentItem[], hasNext, size, number }
// ─────────────────────────────────────────────────────────────
export async function searchContents(
  keyword: string,
  page = 0,
  size = 10
): Promise<SliceResponse<ContentItem>> {
  if (!keyword.trim()) return { content: [], hasNext: false, size: 0, number: 0 };
  const response = await apiClient.get<ApiResponse<SliceResponse<ContentItem>>>(
    "/api/contents",
    { params: { keyword, page, size, sort: "id,DESC" } }
  );
  return response.data.data ?? { content: [], hasNext: false, size: 0, number: 0 };
}

// ─────────────────────────────────────────────────────────────
// 🟢 큐레이션 생성  POST /api/curations
//    요청: { contentId, bookLength }
//    응답: ApiResponse<CurationResponse[]>
//            └ { tagId, tagName, books: BookInfo[] }
// ─────────────────────────────────────────────────────────────
export async function createCuration(
  body: CurationRequest
): Promise<CurationSection[]> {
  const response = await apiClient.post<ApiResponse<CurationSection[]>>(
    "/api/curations",
    body
  );
  return response.data.data ?? [];
}
