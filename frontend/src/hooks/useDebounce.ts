import { useState, useEffect } from "react";

/**
 * 주어진 값을 지정한 delay(ms)만큼 지연시켜 반환하는 훅
 * 빠른 연속 입력(예: 검색창 타이핑) 시 불필요한 API 호출을 방지
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
