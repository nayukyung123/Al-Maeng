import apiClient from "@/lib/axios";
import type { ApiResponse, SliceResponse } from "@/types/api";
import type { CardStyle, GalleryTicket } from "@/types/ticket";

/** 백엔드 `StyleData` VO와 동일한 camelCase JSON 필드 */
export interface TicketStyleDataDto {
  orientation: string;
  coverShape: string;
  typography: string;
  ticketColor: string;
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

  return {
    templateId: style.coverShape || "classic",
    style: {
      font,
      background: style.ticketColor || "bg-white",
      textColor: "text-stone-900",
      orientation,
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

export async function createTicket(payload: TicketCreateRequest): Promise<TicketCreateResponse> {
  const response = await apiClient.post<ApiResponse<TicketCreateResponse>>("/api/tickets", payload);
  return response.data.data;
}

export async function deleteTicket(ticketId: number): Promise<void> {
  await apiClient.delete<ApiResponse<void>>(`/api/tickets/${ticketId}`);
}

export async function fetchTicketImagePresignedUrl(fileExtension: string): Promise<PresignedUrlResponse> {
  const response = await apiClient.post<ApiResponse<PresignedUrlResponse>>("/api/tickets/image-url", {
    fileExtension,
  });
  return response.data.data;
}

