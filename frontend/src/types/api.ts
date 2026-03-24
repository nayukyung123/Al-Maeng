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
 * 백엔드 Slice JSON 직렬화 스펙: content, last, number, size
 */
export interface SliceResponse<T> {
  content: T[];
  /** 마지막 페이지 여부 (false이면 다음 페이지 존재) */
  last: boolean;
  /** 현재 페이지 번호 (0-based) */
  number: number;
  size: number;
}
