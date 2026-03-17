import { useEffect, useRef, useState, useCallback } from "react";

export function useInfiniteScroll<T>(
  allItems: T[],
  pageSize: number = 4
): { visibleItems: T[]; loaderRef: React.RefObject<HTMLDivElement>; hasMore: boolean } {
  const [count, setCount] = useState(pageSize);
  const loaderRef = useRef<HTMLDivElement>(null!);

  const loadMore = useCallback(() => {
    setCount((prev) => Math.min(prev + pageSize, allItems.length));
  }, [allItems.length, pageSize]);

  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  return {
    visibleItems: allItems.slice(0, count),
    loaderRef,
    hasMore: count < allItems.length,
  };
}
