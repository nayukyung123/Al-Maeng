import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/types/api";

export interface GenreResponse {
  id: number;
  genreName: string;
  parentId: number | null;
}

export async function fetchGenres(): Promise<GenreResponse[]> {
  const response = await apiClient.get<ApiResponse<GenreResponse[]>>("/api/genres");
  return response.data.data;
}

export async function fetchTopLevelGenres(): Promise<GenreResponse[]> {
  const genres = await fetchGenres();
  return genres.filter((g) => g.parentId === null);
}
