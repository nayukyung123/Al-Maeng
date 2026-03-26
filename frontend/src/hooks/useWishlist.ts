import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addWishlist, removeWishlist, getMyWishlists, checkWishlistStatus } from "@/api/wishlist";
import type { WishlistPageData } from "@/types/wishlist";

/**
 * 특정 도서의 찜 여부를 확인하는 쿼리 훅
 */
export function useWishlistStatus(bookId: number, enabled: boolean) {
  return useQuery<boolean>({
    queryKey: ["wishlistStatus", bookId],
    queryFn: () => checkWishlistStatus(bookId),
    enabled: enabled && !!bookId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 찜하기 상태 추가/취소를 낙관적 업데이트(Optimistic Update)로 처리하는 커스텀 훅
 * 하트 UI를 클릭했을 때 서버 응답을 기다리지 않고 즉각적으로 UI를 변경하여 UX를 향상시킵니다.
 */
export function useWishlistMutation(bookId: number, source: string = "none") {
  const queryClient = useQueryClient();

  // 찜하기 추가 Mutation
  const addMutation = useMutation({
    mutationFn: () => addWishlist(bookId, source),
    onMutate: async () => {
      // 1. 진행 중인 쿼리가 있다면 취소하여 낙관적 업데이트가 덮어씌워지는 것을 방지
      await queryClient.cancelQueries({ queryKey: ["wishlistStatus", bookId] });

      // 2. 업뎃 실패 시 복구를 위한 이전 상태 스냅샷 저장
      const previousStatus = queryClient.getQueryData<boolean>(["wishlistStatus", bookId]);

      // 3. UI를 위한 낙관적 상태 업데이트 (즉시 true로 변경)
      queryClient.setQueryData(["wishlistStatus", bookId], true);

      return { previousStatus };
    },
    onError: (err, variables, context) => {
      // 4. 서버 에러 시 저장해둔 이전 상태로 롤백
      if (context?.previousStatus !== undefined) {
        queryClient.setQueryData(["wishlistStatus", bookId], context.previousStatus);
      }
    },
    onSettled: () => {
      // 5. 성공이든 에러든 끝난 후 최신 상태 동기화 (단일 아이템 및 목록 전체)
      queryClient.invalidateQueries({ queryKey: ["wishlistStatus", bookId] });
      queryClient.invalidateQueries({ queryKey: ["myWishlists"] });
    },
  });

  // 찜하기 취소 Mutation
  const removeMutation = useMutation({
    mutationFn: () => removeWishlist(bookId, source),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["wishlistStatus", bookId] });
      const previousStatus = queryClient.getQueryData<boolean>(["wishlistStatus", bookId]);

      // UI 낙관적 업데이트 (즉시 false로 변경)
      queryClient.setQueryData(["wishlistStatus", bookId], false);

      return { previousStatus };
    },
    onError: (err, variables, context) => {
      if (context?.previousStatus !== undefined) {
        queryClient.setQueryData(["wishlistStatus", bookId], context.previousStatus);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlistStatus", bookId] });
      queryClient.invalidateQueries({ queryKey: ["myWishlists"] });
    },
  });

  return {
    addWishlist: addMutation.mutate,
    removeWishlist: removeMutation.mutate,
    isPending: addMutation.isPending || removeMutation.isPending,
  };
}

/**
 * 내 찜 목록을 조회하는 쿼리 훅 (페이지네이션 지원)
 */
export function useMyWishlists(
  page: number = 0,
  size: number = 10,
  enabled: boolean = true
) {
  return useQuery<WishlistPageData>({
    queryKey: ["myWishlists", page, size],
    queryFn: () => getMyWishlists(page, size),
    staleTime: 5 * 60 * 1000, // 5분
    enabled,
  });
}
