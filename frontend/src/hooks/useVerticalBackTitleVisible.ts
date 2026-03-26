"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "almaeng-show-vertical-back-title";

export function getVerticalBackTitleVisible(): boolean {
  if (typeof window === "undefined") return true;
  const v = localStorage.getItem(STORAGE_KEY);
  if (v === null) return true;
  return v === "true";
}

export function setVerticalBackTitleVisible(show: boolean): void {
  localStorage.setItem(STORAGE_KEY, String(show));
}

/** 세로형 티켓 뒷면 제목(오버레이) 표시 — localStorage에 유지 */
export function useVerticalBackTitleVisible() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    setShow(getVerticalBackTitleVisible());
  }, []);

  const set = useCallback((value: boolean) => {
    setShow(value);
    setVerticalBackTitleVisible(value);
  }, []);

  const toggle = useCallback(() => {
    setShow((prev) => {
      const next = !prev;
      setVerticalBackTitleVisible(next);
      return next;
    });
  }, []);

  return { show, set, toggle };
}
