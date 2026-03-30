/**
 * 티켓 카드(PhotoCard) 표시용 작가 문자열.
 *
 * - 쉼표 없음 + 괄호 있음: 모든 `(...)` 제거 후 이름만
 * - 쉼표 없음 + 괄호 없음: 원문 그대로
 * - 쉼표 있음 + 괄호 없음: 첫 번째 이름만
 * - 쉼표 있음 + 괄호 있음:
 *   - `(지은이)`가 2명 이상이면 `첫째 외`
 *   - `(지은이)`가 1명이면 그 이름만
 *   - `(지은이)`가 없으면 첫 번째 이름만
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
    .filter(Boolean)
    .map(parseSegment)
    .filter((seg) => !!seg.name);
  const resolvedSegments = resolveRolesByRightContext(segments);

  const authors = resolvedSegments.filter((seg) => seg.role === "author").map((seg) => seg.name);
  if (authors.length >= 2) return `${authors[0]} 외`;
  if (authors.length === 1) return authors[0];

  return resolvedSegments[0]?.name ?? "";
}

function stripAllParenGroups(s: string): string {
  return s.replace(/\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
}

type SegmentRole = "author" | "translator" | "unknown";

function parseSegment(rawSegment: string): { name: string; role: SegmentRole } {
  const segment = rawSegment.trim();
  const roleTexts = [...segment.matchAll(/\(([^)]*)\)/g)].map((m) => m[1].trim());
  const name = stripAllParenGroups(segment);
  const roleTextJoined = roleTexts.join(" ");

  if (/지은이|저자|저\b/.test(roleTextJoined)) {
    return { name, role: "author" };
  }
  if (/옮긴이|역자|번역/.test(roleTextJoined)) {
    return { name, role: "translator" };
  }
  return { name, role: "unknown" };
}

function resolveRolesByRightContext(
  segments: Array<{ name: string; role: SegmentRole }>
): Array<{ name: string; role: SegmentRole }> {
  const resolved = [...segments];
  let currentRole: SegmentRole = "unknown";

  // "A, B(지은이), C(옮긴이)" 같은 패턴에서
  // 괄호 역할은 왼쪽 인접 이름 묶음에도 적용되는 것으로 간주한다.
  for (let i = resolved.length - 1; i >= 0; i -= 1) {
    if (resolved[i].role !== "unknown") {
      currentRole = resolved[i].role;
      continue;
    }
    if (currentRole !== "unknown") {
      resolved[i] = { ...resolved[i], role: currentRole };
    }
  }

  return resolved;
}
