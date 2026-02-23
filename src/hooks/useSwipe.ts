import { useRef, useCallback } from "react";

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

interface UseSwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;   // min px distance (default 60)
  maxVertical?: number; // max vertical movement (default 100)
}

export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  threshold = 60,
  maxVertical = 100,
}: UseSwipeOptions): SwipeHandlers {
  const startRef = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    startRef.current = { x: t.clientX, y: t.clientY };
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!startRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - startRef.current.x;
    const dy = Math.abs(t.clientY - startRef.current.y);
    startRef.current = null;

    if (dy > maxVertical) return; // vertical scroll, ignore
    if (Math.abs(dx) < threshold) return;

    if (dx < 0) onSwipeLeft?.();
    else onSwipeRight?.();
  }, [onSwipeLeft, onSwipeRight, threshold, maxVertical]);

  return { onTouchStart, onTouchEnd };
}
