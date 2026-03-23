/**
 * 백엔드 공통 응답 래퍼
 * { success, data, code?, message? }
 */
export interface ApiResponse<T> {
  success: boolean;
  code?: string;
  message?: string;
  data: T;
}

/**
 * Spring Data Slice (페이지네이션)
 * GET /api/books?keyword= 응답에 사용
 */
export interface SliceResponse<T> {
  content: T[];
  hasNext: boolean;
  size: number;
  number: number;
}
