/** 과거 가입 플로우에서 저장된 더미 URL — 표시 시 이미지 없음으로 취급 */
const IGNORED_PROFILE_IMAGE_URLS = new Set(["https://example.com/dummy.jpg"]);

/**
 * 프로필 이미지 표시용 URL. 빈 값·더미 URL은 null로 두면 기본 아바타를 쓸 수 있습니다.
 */
export function displayProfileImageUrl(
  url: string | null | undefined
): string | null {
  if (url == null) return null;
  const t = url.trim();
  if (t === "") return null;
  if (IGNORED_PROFILE_IMAGE_URLS.has(t)) return null;
  return url;
}
