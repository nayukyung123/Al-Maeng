import apiClient from "@/lib/axios";
import {
  USER_TICKET_FOR_BOOK_SEGMENT,
  userTicketForBookQueryKey,
} from "@/lib/userQueryKeys";
import type { ApiResponse, SliceResponse } from "@/types/api";
import type { CardStyle, GalleryTicket } from "@/types/ticket";

/** 백엔드 `StyleData` VO와 동일한 camelCase JSON 필드 */
export interface TicketStyleDataDto {
  orientation: string;
  coverShape: string;
  typography: string;
  ticketColor: string;
  /** 세로형 뒷면 제목 표시 (기본 true, 생략 시 구티켓과 동일하게 취급) */
  showBackTitle?: boolean;
}

interface TicketResponseDto {
  id: number;
  bookId: number;
  title: string;
  author: string;
  coverImageUrl: string;
  comment: string | null;
  completedAt: string;
  ticketImageUrl: string | null;
  styleData: TicketStyleDataDto | null;
  /** 백엔드 `TicketResponse.genreName` (대분류, 없으면 "미분류") */
  genreName: string;
}

interface TicketCreateRequest {
  bookId: number;
  completedAt: string;
  comment?: string;
  ticketImageUrl?: string;
  styleData: TicketStyleDataDto;
}

interface TicketCreateResponse {
  id: number;
}

interface PresignedUrlResponse {
  presignedUrl: string;
  imageUrl: string;
  /** 서명에 사용된 값과 동일해야 PUT 시 403(SignatureDoesNotMatch) 방지 (구 API 없을 수 있음) */
  contentType?: string;
}

function parseStyleFromDto(style: TicketStyleDataDto | null): {
  templateId: string;
  style: CardStyle;
} {
  if (!style) {
    return {
      templateId: "classic",
      style: {
        font: "serif",
        background: "bg-white",
        textColor: "text-stone-900",
        orientation: "horizontal",
      },
    };
  }

  const font =
    style.typography === "sans" || style.typography === "mono" || style.typography === "serif"
      ? style.typography
      : "serif";
  const orientation =
    style.orientation === "vertical" || style.orientation === "horizontal"
      ? style.orientation
      : "horizontal";

  const showBackTitle: boolean | undefined =
    style.showBackTitle === true ? true : style.showBackTitle === false ? false : undefined;

  return {
    templateId: style.coverShape || "classic",
    style: {
      font,
      background: style.ticketColor || "bg-white",
      textColor: "text-stone-900",
      orientation,
      showBackTitle,
    },
  };
}

function toGalleryTicket(dto: TicketResponseDto): GalleryTicket {
  const { templateId, style } = parseStyleFromDto(dto.styleData);
  return {
    id: dto.id,
    bookId: dto.bookId,
    title: dto.title,
    author: dto.author,
    genre: dto.genreName?.trim() ? dto.genreName : "미분류",
    coverImageUrl: dto.coverImageUrl,
    ticketImageUrl: dto.ticketImageUrl ?? undefined,
    comment: dto.comment ?? undefined,
    completedAt: dto.completedAt?.slice(0, 10) ?? "",
    templateId,
    style,
  };
}

export async function fetchGalleryTickets(): Promise<GalleryTicket[]> {
  const response = await apiClient.get<ApiResponse<TicketResponseDto[]>>("/api/tickets/gallery");
  return response.data.data.map(toGalleryTicket);
}

export async function fetchBinderTickets(params: {
  page: number;
  genre?: string | null;
}): Promise<SliceResponse<GalleryTicket>> {
  const response = await apiClient.get<ApiResponse<SliceResponse<TicketResponseDto>>>("/api/tickets", {
    params: {
      page: params.page,
      genre: params.genre ?? undefined,
    },
  });

  return {
    ...response.data.data,
    content: response.data.data.content.map(toGalleryTicket),
  };
}

/**
 * 바인더 전체 티켓을 페이지 순회로 모두 수집합니다.
 * UI 내부 페이징/플립은 프론트에서 처리하기 때문에 전체 목록이 필요합니다.
 */
export async function fetchAllBinderTickets(genre?: string | null): Promise<GalleryTicket[]> {
  const all: GalleryTicket[] = [];
  let page = 0;

  for (;;) {
    const slice = await fetchBinderTickets({ page, genre: genre ?? null });
    all.push(...slice.content);
    if (slice.last) break;
    page += 1;
  }

  const seen = new Set<number>();
  return all.filter((t) => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });
}

/** @deprecated 무효화 시 `userTicketForBookQueryRoot()` 사용 */
export const TICKET_FOR_BOOK_QUERY_KEY_PREFIX = USER_TICKET_FOR_BOOK_SEGMENT;

export { userTicketForBookQueryKey as ticketForBookQueryKey };

/**
 * 해당 도서에 연결된 티켓을 찾습니다. 갤러리(최대 7건)에 없으면 바인더를 페이지 순회합니다.
 * (백엔드 변경 없이 bookId → 티켓 식별용)
 */
export async function findTicketForBook(bookId: number): Promise<GalleryTicket | null> {
  const gallery = await fetchGalleryTickets();
  const fromGallery = gallery.find((t) => t.bookId === bookId);
  if (fromGallery) return fromGallery;

  let page = 0;
  for (;;) {
    const slice = await fetchBinderTickets({ page, genre: null });
    const fromBinder = slice.content.find((t) => t.bookId === bookId);
    if (fromBinder) return fromBinder;
    if (slice.last) break;
    page += 1;
  }
  return null;
}

/** GET /api/tickets/{ticketId} — 티켓 상세(모달용) */
export async function fetchTicketDetail(ticketId: number): Promise<GalleryTicket> {
  const response = await apiClient.get<ApiResponse<TicketResponseDto>>(`/api/tickets/${ticketId}`);
  return toGalleryTicket(response.data.data);
}

export async function createTicket(payload: TicketCreateRequest): Promise<TicketCreateResponse> {
  const response = await apiClient.post<ApiResponse<TicketCreateResponse>>("/api/tickets", payload);
  return response.data.data;
}

export async function deleteTicket(ticketId: number): Promise<void> {
  await apiClient.delete<ApiResponse<void>>(`/api/tickets/${ticketId}`);
}

export async function patchTicketShowBackTitle(
  ticketId: number,
  showBackTitle: boolean
): Promise<void> {
  await apiClient.patch<ApiResponse<void>>(`/api/tickets/${ticketId}/show-back-title`, {
    showBackTitle,
  });
}

export async function fetchTicketImagePresignedUrl(fileExtension: string): Promise<PresignedUrlResponse> {
  const response = await apiClient.post<ApiResponse<PresignedUrlResponse>>("/api/tickets/image-url", {
    fileExtension,
  });
  return response.data.data;
}

