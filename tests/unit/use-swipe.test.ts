// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useSwipe } from '@/hooks/useSwipe';

function makeTouchEvent(clientX: number, clientY: number) {
  return { touches: [{ clientX, clientY }], changedTouches: [{ clientX, clientY }] } as unknown as React.TouchEvent;
}

describe('useSwipe', () => {
  it('calls onSwipeLeft when horizontal left swipe exceeds default threshold (60px)', () => {
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();
    const { result } = renderHook(() => useSwipe({ onSwipeLeft, onSwipeRight }));

    act(() => {
      result.current.onTouchStart(makeTouchEvent(200, 100));
    });
    act(() => {
      result.current.onTouchEnd(makeTouchEvent(100, 105)); // dx = -100, dy = 5
    });

    expect(onSwipeLeft).toHaveBeenCalledTimes(1);
    expect(onSwipeRight).not.toHaveBeenCalled();
  });

  it('calls onSwipeRight when horizontal right swipe exceeds default threshold', () => {
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();
    const { result } = renderHook(() => useSwipe({ onSwipeLeft, onSwipeRight }));

    act(() => {
      result.current.onTouchStart(makeTouchEvent(100, 100));
    });
    act(() => {
      result.current.onTouchEnd(makeTouchEvent(250, 110)); // dx = 150, dy = 10
    });

    expect(onSwipeRight).toHaveBeenCalledTimes(1);
    expect(onSwipeLeft).not.toHaveBeenCalled();
  });

  it('does NOT trigger swipe when vertical movement exceeds maxVertical (default 100)', () => {
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();
    const { result } = renderHook(() => useSwipe({ onSwipeLeft, onSwipeRight }));

    act(() => {
      result.current.onTouchStart(makeTouchEvent(200, 100));
    });
    act(() => {
      result.current.onTouchEnd(makeTouchEvent(100, 250)); // dx = -100, dy = 150 (> 100)
    });

    expect(onSwipeLeft).not.toHaveBeenCalled();
    expect(onSwipeRight).not.toHaveBeenCalled();
  });

  it('does NOT trigger swipe when horizontal distance is below threshold', () => {
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();
    const { result } = renderHook(() => useSwipe({ onSwipeLeft, onSwipeRight }));

    act(() => {
      result.current.onTouchStart(makeTouchEvent(200, 100));
    });
    act(() => {
      result.current.onTouchEnd(makeTouchEvent(170, 105)); // dx = -30, dy = 5 (|dx| < 60)
    });

    expect(onSwipeLeft).not.toHaveBeenCalled();
    expect(onSwipeRight).not.toHaveBeenCalled();
  });

  it('respects custom threshold', () => {
    const onSwipeLeft = vi.fn();
    const { result } = renderHook(() => useSwipe({ onSwipeLeft, threshold: 200 }));

    // Swipe of 100px should NOT trigger with threshold 200
    act(() => {
      result.current.onTouchStart(makeTouchEvent(300, 100));
    });
    act(() => {
      result.current.onTouchEnd(makeTouchEvent(200, 100));
    });

    expect(onSwipeLeft).not.toHaveBeenCalled();

    // Swipe of 250px should trigger
    act(() => {
      result.current.onTouchStart(makeTouchEvent(400, 100));
    });
    act(() => {
      result.current.onTouchEnd(makeTouchEvent(150, 100));
    });

    expect(onSwipeLeft).toHaveBeenCalledTimes(1);
  });

  it('does nothing when onTouchEnd fires without a preceding onTouchStart', () => {
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();
    const { result } = renderHook(() => useSwipe({ onSwipeLeft, onSwipeRight }));

    // Call onTouchEnd without onTouchStart - should not throw
    act(() => {
      result.current.onTouchEnd(makeTouchEvent(100, 100));
    });

    expect(onSwipeLeft).not.toHaveBeenCalled();
    expect(onSwipeRight).not.toHaveBeenCalled();
  });
});
