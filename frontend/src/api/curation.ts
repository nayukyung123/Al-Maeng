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
  bookLength: "LIGHT" | "MEDIUM" | "LONG";
}

/** 큐레이션 결과 내 개별 도서 */
export interface CurationBook {
  bookId: number;
  /** 백엔드가 slug를 포함해 줄 경우 사용; 없으면 bookId를 fallback으로 사용 */
  slug?: string;
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
// 🟢 영상 콘텐츠 전체 검색  GET /api/contents?keyword={keyword}&sortType={sortType}
//    sortType: "accuracy"(기본) | "latest"
//    응답: ApiResponse<Slice<ContentResponse>>
//            └ { content: ContentItem[], last, number, size }
// ─────────────────────────────────────────────────────────────
export async function searchContents(
  keyword: string,
  page = 0,
  size = 10,
  sortType = "accuracy"
): Promise<SliceResponse<ContentItem>> {
  if (!keyword.trim()) return { content: [], last: true, number: 0, size: 0 };
  const response = await apiClient.get<ApiResponse<SliceResponse<ContentItem>>>(
    "/api/contents",
    { params: { keyword, page, size, sortType } }
  );
  return response.data.data ?? { content: [], last: true, number: 0, size: 0 };
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
