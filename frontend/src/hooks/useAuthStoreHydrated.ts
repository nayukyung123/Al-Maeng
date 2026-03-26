"use client";

import { useEffect, useState } from "react";
import useAuthStore from "@/store/useAuthStore";

/** persist(localStorage) 복원 완료 여부 — 첫 렌더에서 로그인 상태 오판 방지 */
export function useAuthStoreHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
    }
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    return unsub;
  }, []);
  return hydrated;
}
