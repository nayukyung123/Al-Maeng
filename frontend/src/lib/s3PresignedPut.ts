/**
 * S3 presigned PUT: 서명에는 host·content-type만 포함되는 경우가 많음.
 * axios 기본 Accept: application/json … 헤더는 일부 환경에서 서명 검증과 충돌할 수 있어 fetch로 최소 헤더만 전송.
 */
export async function putPresignedObject(
  presignedUrl: string,
  body: Blob,
  contentType: string
): Promise<void> {
  const res = await fetch(presignedUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`S3 업로드 실패 (${res.status}): ${text.slice(0, 400)}`);
  }
}

export function guessImageContentTypeFromFile(file: File): string {
  const t = file.type?.trim();
  if (t) return t;
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (ext === "jpg" || ext === "jpeg" || ext === "jpe") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "gif") return "image/gif";
  if (ext === "webp") return "image/webp";
  return ext ? `image/${ext}` : "application/octet-stream";
}
