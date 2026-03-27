import imageCompression from "browser-image-compression";

export type UploadImageKind = "ticket" | "profile";

const MAX_FALLBACK_ORIGINAL_BYTES = 5 * 1024 * 1024; // 5MB

const compressionPolicy: Record<
  UploadImageKind,
  { maxSizeMB: number; maxWidthOrHeight: number; initialQuality: number }
> = {
  ticket: {
    maxSizeMB: 1.5,
    maxWidthOrHeight: 1600,
    initialQuality: 0.8,
  },
  profile: {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 512,
    initialQuality: 0.8,
  },
};

const mimeToExtension: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function getBaseName(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex <= 0) return fileName;
  return fileName.slice(0, dotIndex);
}

function getNormalizedType(file: File): string {
  const t = file.type?.trim().toLowerCase();
  if (t === "image/jpg") return "image/jpeg";
  return t;
}

function extensionFromFile(file: File): string {
  const byMime = mimeToExtension[getNormalizedType(file)];
  if (byMime) return byMime;
  const byName = file.name.split(".").pop()?.toLowerCase() || "";
  if (byName === "jpeg") return "jpg";
  return byName || "jpg";
}

function buildNormalizedFile(file: File, fileType: string): File {
  const ext = mimeToExtension[fileType] ?? extensionFromFile(file);
  const name = `${getBaseName(file.name)}.${ext}`;
  return new File([file], name, {
    type: fileType || file.type,
    lastModified: file.lastModified,
  });
}

export function getFileExtensionForPresigned(file: File): string {
  return extensionFromFile(file);
}

export async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("이미지 미리보기 생성에 실패했습니다."));
    reader.readAsDataURL(file);
  });
}

export async function prepareUploadImage(
  originalFile: File,
  kind: UploadImageKind
): Promise<{
  file: File;
  wasCompressed: boolean;
  usedOriginalFallback: boolean;
}> {
  const originalType = getNormalizedType(originalFile);
  const sourceFile = buildNormalizedFile(originalFile, originalType || originalFile.type);
  const policy = compressionPolicy[kind];

  try {
    const compressedBlob = await imageCompression(sourceFile, {
      maxSizeMB: policy.maxSizeMB,
      maxWidthOrHeight: policy.maxWidthOrHeight,
      initialQuality: policy.initialQuality,
      useWebWorker: true,
      fileType: originalType || undefined,
    });

    const compressedFile = buildNormalizedFile(
      compressedBlob as File,
      getNormalizedType(compressedBlob as File) || originalType || sourceFile.type
    );

    return {
      file: compressedFile,
      wasCompressed: true,
      usedOriginalFallback: false,
    };
  } catch {
    if (sourceFile.size > MAX_FALLBACK_ORIGINAL_BYTES) {
      throw new Error("용량이 너무 크거나 지원하지 않는 파일입니다. (최대 5MB)");
    }

    return {
      file: sourceFile,
      wasCompressed: false,
      usedOriginalFallback: true,
    };
  }
}
