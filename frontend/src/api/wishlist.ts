import apiClient from "@/lib/axios";
import type { ApiResponse } from "@/types/api";
import type { WishlistPageData } from "@/types/wishlist";

/**
 * 내 찜 목록을 페이징하여 조회합니다.
 * @param page 페이지 번호 (0부터 시작)
 * @param size 페이지 크기 (기본값 10)
 */
export async function getMyWishlists(page: number = 0, size: number = 10): Promise<WishlistPageData> {
  const response = await apiClient.get<ApiResponse<WishlistPageData>>("/api/wishlists", {
    params: { page, size },
  });
  return response.data.data;
}

/**
 * 도서를 찜 목록에 추가합니다.
 * @param bookId 찜할 도서의 ID
 */
export async function addWishlist(bookId: number): Promise<void> {
  await apiClient.post("/api/wishlists", { bookId });
}

/**
 * 찜 목록에서 도서를 제거합니다.
 * @param bookId 찜 취소할 도서의 ID
 */
export async function removeWishlist(bookId: number): Promise<void> {
  await apiClient.delete(`/api/wishlists/${bookId}`);
}
/**
 * 특정 도서의 찜 여부를 확인합니다.
 * @param bookId 확인하고 싶은 도서 ID
 */
export async function checkWishlistStatus(bookId: number): Promise<boolean> {
  const response = await apiClient.get<ApiResponse<boolean>>(`/api/wishlists/${bookId}/status`);
  return response.data.data;
}
