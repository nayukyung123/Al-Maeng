/**
 * 티켓 카드(PhotoCard) 표시용 작가 문자열.
 *
 * - 쉼표 없음 + '(' 1개 이상: 모든 `(...)` 제거 후 앞뒤 공백 정리 (괄호 두 덩어리 이상이면 전부 제거)
 * - 쉼표 없음 + '(' 없음: 원문 그대로
 * - 쉼표 있음 + '(' 없음: 첫 번째 쉼표 앞만 사용 (`… 외` 없음)
 * - 쉼표 있음 + '(' 있음: 쉼표로 나눈 각 조각에서 모든 `(...)` 제거 후,
 *   2명 이상이면 `첫째 외`, 1명이면 이름만
 */
export function formatTicketAuthorDisplay(raw: string | null | undefined): string {
  if (raw == null) return "";
  const s = raw.trim();
  if (!s) return "";

  const hasComma = s.includes(",");
  const openCount = (s.match(/\(/g) ?? []).length;

  if (!hasComma) {
    if (openCount > 0) return stripAllParenGroups(s);
    return s;
  }

  if (openCount === 0) {
    return s.split(",")[0]?.trim() ?? "";
  }

  const segments = s
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  const names = segments.map((seg) => stripAllParenGroups(seg)).map((n) => n.trim()).filter(Boolean);
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  return `${names[0]} 외`;
}

function stripAllParenGroups(s: string): string {
  return s.replace(/\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
}
