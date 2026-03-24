import apiClient from "@/lib/axios";
import type { ApiResponse, SliceResponse } from "@/types/api";
import type { GalleryTicket } from "@/types/ticket";

interface TicketResponseDto {
  id: number;
  bookId: number;
  title: string;
  author: string;
  coverImageUrl: string;
  comment: string | null;
  completedAt: string;
  ticketImageUrl: string | null;
}

interface TicketCreateRequest {
  bookId: number;
  completedAt: string;
  comment?: string;
  ticketImageUrl?: string;
}

interface TicketCreateResponse {
  id: number;
}

interface PresignedUrlResponse {
  presignedUrl: string;
  imageUrl: string;
}

function toGalleryTicket(dto: TicketResponseDto): GalleryTicket {
  return {
    id: dto.id,
    bookId: dto.bookId,
    title: dto.title,
    author: dto.author,
    coverImageUrl: dto.coverImageUrl,
    ticketImageUrl: dto.ticketImageUrl ?? undefined,
    comment: dto.comment ?? undefined,
    completedAt: dto.completedAt?.slice(0, 10) ?? "",
    templateId: "classic",
    style: {
      font: "serif",
      background: "bg-white",
      textColor: "text-stone-900",
      orientation: "horizontal",
    },
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

