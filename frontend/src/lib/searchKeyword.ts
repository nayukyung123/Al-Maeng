/** 백엔드 BookSearchController / ContentSearchController 의 keyword @Size(max = 50) 와 동일 */
export const MAX_SEARCH_KEYWORD_LENGTH = 50;

/** 입력창 아래 빨간 안내에 사용 */
export const SEARCH_KEYWORD_LENGTH_HINT =
  "검색어는 최대 50자까지 입력할 수 있습니다.";

export function clampSearchKeyword(value: string): string {
  if (value.length <= MAX_SEARCH_KEYWORD_LENGTH) return value;
  return value.slice(0, MAX_SEARCH_KEYWORD_LENGTH);
}
