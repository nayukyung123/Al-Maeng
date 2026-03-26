const KEY = "searchOverlayReturnTo";

export function setSearchOverlayReturnTo(path: string) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, path);
}

/** 읽고 즉시 제거. X로 오버레이를 닫을 때 복귀 경로로 사용 */
export function consumeSearchOverlayReturnTo(): string | null {
  if (typeof window === "undefined") return null;
  const v = sessionStorage.getItem(KEY);
  if (v) sessionStorage.removeItem(KEY);
  return v;
}

/** 로고 클릭 등으로 닫을 때 복귀 의도 취소 */
export function clearSearchOverlayReturnTo() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
}
