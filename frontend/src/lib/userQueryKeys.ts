/**
 * React Query: 인증 사용자 종속 데이터 키 계층 (도메인 루트 `user`).
 * 공용 데이터(장르 마스터, 배너 등)는 이 파일에 두지 않습니다.
 */
export const USER_QUERY_ROOT = "user" as const;

export const USER_TICKET_FOR_BOOK_SEGMENT = "ticket-for-book" as const;

export function userCompletedBooksQueryKey() {
  return [USER_QUERY_ROOT, "completed-books"] as const;
}

export function userProfileQueryKey() {
  return [USER_QUERY_ROOT, "profile"] as const;
}

export function userTasteReportQueryKey() {
  return [USER_QUERY_ROOT, "taste-report"] as const;
}

export function userWishlistStatusQueryKey(bookId: number) {
  return [USER_QUERY_ROOT, "wishlistStatus", bookId] as const;
}

export function userWishlistsQueryKey(page: number, size: number) {
  return [USER_QUERY_ROOT, "wishlists", page, size] as const;
}

export function userWishlistsQueryKeyPrefix() {
  return [USER_QUERY_ROOT, "wishlists"] as const;
}

export function userTicketsGalleryQueryKey() {
  return [USER_QUERY_ROOT, "tickets", "gallery"] as const;
}

export function userTicketsBinderAllQueryKey() {
  return [USER_QUERY_ROOT, "tickets", "binder", "all"] as const;
}

/** 바인더 목록 계열 무효화용 (all 등 하위 키 일치) */
export function userTicketsBinderQueryKeyPrefix() {
  return [USER_QUERY_ROOT, "tickets", "binder"] as const;
}

export function userTicketForBookQueryKey(bookId: number) {
  return [USER_QUERY_ROOT, USER_TICKET_FOR_BOOK_SEGMENT, bookId] as const;
}

/** 도서별 티켓 존재 캐시 일괄 무효화용 접두 키 */
export function userTicketForBookQueryRoot() {
  return [USER_QUERY_ROOT, USER_TICKET_FOR_BOOK_SEGMENT] as const;
}
