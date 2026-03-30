import type { GalleryTicket } from "@/types/ticket";

/** 완독일 오름차순 → 같은 날/시각이면 티켓 id 오름차순(먼저 만든 것 앞, 나중에 만든 것 뒤) */
export function compareTicketsBinderOrder(a: GalleryTicket, b: GalleryTicket): number {
  const ca = a.completedAt || "";
  const cb = b.completedAt || "";
  if (ca !== cb) return ca < cb ? -1 : ca > cb ? 1 : 0;
  return a.id - b.id;
}

export function sortBinderTickets(list: GalleryTicket[]): GalleryTicket[] {
  return [...list].sort(compareTicketsBinderOrder);
}
