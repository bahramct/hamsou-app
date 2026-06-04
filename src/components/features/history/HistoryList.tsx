"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { HistoryItem } from "./HistoryItem";
import type { HistoryItem as HistoryItemType } from "@/types/history";

interface Props {
  initialItems: HistoryItemType[];
  initialCursor: string | null;
  initialHasMore: boolean;
}

export function HistoryList({ initialItems, initialCursor, initialHasMore }: Props) {
  const [items, setItems] = useState<HistoryItemType[]>(initialItems);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading || !cursor) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/history?cursor=${encodeURIComponent(cursor)}&limit=10`);
      if (!res.ok) return;
      const data = await res.json();
      setItems((prev) => [...prev, ...data.items]);
      setCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } finally {
      setIsLoading(false);
    }
  }, [cursor, hasMore, isLoading]);

  // Intersection Observer روی sentinel پایین صفحه
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "200px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  if (items.length === 0) {
    return (
      <p className="text-center text-fog text-sm py-12">
        هنوز تعهدی ثبت نکرده‌ای
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <HistoryItem key={item.id} item={item} />
      ))}

      {/* sentinel — Intersection Observer اینجا را می‌بیند */}
      <div ref={sentinelRef} className="h-1" />

      {isLoading && (
        <p className="text-center text-fog/60 text-xs py-3">در حال بارگذاری…</p>
      )}

      {!hasMore && items.length > 0 && (
        <p className="text-center text-fog/50 text-xs py-3 border-t border-fog/20 mt-1">
          پایان تاریخچه
        </p>
      )}
    </div>
  );
}
