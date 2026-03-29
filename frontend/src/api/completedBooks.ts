import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/types/api";
import type { AddCompletedBookRequest, CompletedBook } from "@/types/completedBook";

export async function fetchCompletedBooks(): Promise<CompletedBook[]> {
  const response = await apiClient.get<ApiResponse<CompletedBook[]>>("/api/completed-books");
  return response.data.data;
}

export async function addCompletedBook(body: AddCompletedBookRequest): Promise<void> {
  await apiClient.post<ApiResponse<void>>("/api/completed-books", body);
}

export async function deleteCompletedBook(bookId: number, source: string = "none"): Promise<void> {
  await apiClient.delete<ApiResponse<void>>(`/api/completed-books/${bookId}`, {
    data: { source },
  });
}
