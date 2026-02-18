/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 75: MOBILE TOUCH GESTURE HOOKS
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 모바일 터치 제스처 훅
 * - Swipe (좌/우/상/하)
 * - Long Press
 * - Double Tap
 * - Pinch Zoom
 * - Pan
 */

import { useCallback, useRef, useState, useEffect } from 'react';

interface Point {
  x: number;
  y: number;
}

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface SwipeOptions {
  threshold?: number; // Minimum distance for swipe
  timeout?: number; // Maximum time for swipe
}

/**
 * Hook for swipe gestures
 */
export function useSwipe(
  handlers: SwipeHandlers,
  options: SwipeOptions = {}
) {
  const { threshold = 50, timeout = 300 } = options;
  const touchStart = useRef<Point | null>(null);
  const touchStartTime = useRef<number>(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
    touchStartTime.current = Date.now();
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.current.x;
    const deltaY = touch.clientY - touchStart.current.y;
    const deltaTime = Date.now() - touchStartTime.current;

    if (deltaTime > timeout) {
      touchStart.current = null;
      return;
    }

    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (absDeltaX > absDeltaY && absDeltaX > threshold) {
      // Horizontal swipe
      if (deltaX > 0) {
        handlers.onSwipeRight?.();
      } else {
        handlers.onSwipeLeft?.();
      }
    } else if (absDeltaY > absDeltaX && absDeltaY > threshold) {
      // Vertical swipe
      if (deltaY > 0) {
        handlers.onSwipeDown?.();
      } else {
        handlers.onSwipeUp?.();
      }
    }

    touchStart.current = null;
  }, [handlers, threshold, timeout]);

  return {
    onTouchStart,
    onTouchEnd,
  };
}

/**
 * Hook for long press gesture
 */
export function useLongPress(
  onLongPress: () => void,
  options: { duration?: number; onStart?: () => void; onCancel?: () => void } = {}
) {
  const { duration = 500, onStart, onCancel } = options;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  const start = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    onStart?.();
    isLongPressRef.current = false;

    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      // Trigger haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
      onLongPress();
    }, duration);
  }, [duration, onLongPress, onStart]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!isLongPressRef.current) {
      onCancel?.();
    }
  }, [onCancel]);

  return {
    onTouchStart: start,
    onTouchEnd: stop,
    onTouchMove: stop,
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
  };
}

/**
 * Hook for double tap gesture
 */
export function useDoubleTap(
  onDoubleTap: () => void,
  options: { delay?: number } = {}
) {
  const { delay = 300 } = options;
  const lastTapRef = useRef<number>(0);

  const handleTap = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;

    if (timeSinceLastTap < delay && timeSinceLastTap > 0) {
      e.preventDefault();
      onDoubleTap();
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  }, [delay, onDoubleTap]);

  return {
    onClick: handleTap,
    onTouchEnd: handleTap,
  };
}

/**
 * Hook for pan gesture (drag)
 */
export function usePan(
  onPan: (delta: Point) => void,
  options: { onPanStart?: () => void; onPanEnd?: () => void } = {}
) {
  const { onPanStart, onPanEnd } = options;
  const [isPanning, setIsPanning] = useState(false);
  const startPos = useRef<Point | null>(null);
  const lastPos = useRef<Point | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    startPos.current = { x: touch.clientX, y: touch.clientY };
    lastPos.current = { x: touch.clientX, y: touch.clientY };
    setIsPanning(true);
    onPanStart?.();
  }, [onPanStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!lastPos.current) return;

    const touch = e.touches[0];
    const delta = {
      x: touch.clientX - lastPos.current.x,
      y: touch.clientY - lastPos.current.y,
    };

    lastPos.current = { x: touch.clientX, y: touch.clientY };
    onPan(delta);
  }, [onPan]);

  const handleTouchEnd = useCallback(() => {
    startPos.current = null;
    lastPos.current = null;
    setIsPanning(false);
    onPanEnd?.();
  }, [onPanEnd]);

  return {
    isPanning,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}

/**
 * Hook for pinch zoom gesture
 */
export function usePinchZoom(
  onZoom: (scale: number) => void,
  options: { minScale?: number; maxScale?: number } = {}
) {
  const { minScale = 0.5, maxScale = 3 } = options;
  const initialDistance = useRef<number | null>(null);
  const currentScale = useRef(1);

  const getDistance = (touch1: Touch, touch2: Touch) => {
    return Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    );
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      initialDistance.current = getDistance(
        e.touches[0] as unknown as Touch,
        e.touches[1] as unknown as Touch
      );
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialDistance.current) {
      const distance = getDistance(
        e.touches[0] as unknown as Touch,
        e.touches[1] as unknown as Touch
      );
      const scale = distance / initialDistance.current;
      const newScale = Math.max(minScale, Math.min(maxScale, currentScale.current * scale));

      onZoom(newScale);
    }
  }, [maxScale, minScale, onZoom]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      initialDistance.current = null;
    }
  }, []);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
}

/**
 * Hook for pull-to-refresh gesture
 */
export function usePullToRefresh(
  onRefresh: () => Promise<void>,
  options: { threshold?: number; resistance?: number } = {}
) {
  const { threshold = 80, resistance = 2.5 } = options;
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (startY.current === null || window.scrollY > 0) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    if (diff > 0) {
      setPullDistance(Math.min(diff / resistance, threshold * 1.5));
    }
  }, [resistance, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
    setPullDistance(0);
    startY.current = null;
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  return {
    pullDistance,
    isRefreshing,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}

/**
 * Hook for edge swipe (navigation gesture)
 */
export function useEdgeSwipe(
  onEdgeSwipe: (direction: 'left' | 'right') => void,
  options: { edgeWidth?: number; threshold?: number } = {}
) {
  const { edgeWidth = 30, threshold = 100 } = options;
  const startPos = useRef<Point | null>(null);
  const startedFromEdge = useRef<'left' | 'right' | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const screenWidth = window.innerWidth;

    if (touch.clientX < edgeWidth) {
      startedFromEdge.current = 'left';
      startPos.current = { x: touch.clientX, y: touch.clientY };
    } else if (touch.clientX > screenWidth - edgeWidth) {
      startedFromEdge.current = 'right';
      startPos.current = { x: touch.clientX, y: touch.clientY };
    }
  }, [edgeWidth]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!startPos.current || !startedFromEdge.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - startPos.current.x;

    if (startedFromEdge.current === 'left' && deltaX > threshold) {
      onEdgeSwipe('left');
    } else if (startedFromEdge.current === 'right' && deltaX < -threshold) {
      onEdgeSwipe('right');
    }

    startPos.current = null;
    startedFromEdge.current = null;
  }, [onEdgeSwipe, threshold]);

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
  };
}

/**
 * Global gesture prevention (for modal/drawer)
 */
export function usePreventBodyScroll(isActive: boolean) {
  useEffect(() => {
    if (isActive) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';

      return () => {
        document.body.style.overflow = originalStyle;
        document.body.style.touchAction = '';
      };
    }
  }, [isActive]);
}
