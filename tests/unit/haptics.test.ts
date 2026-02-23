// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { hapticLight, hapticMedium, hapticHeavy } from '@/utils/haptics';

describe('haptics', () => {
  let vibrateMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vibrateMock = vi.fn();
    Object.defineProperty(navigator, 'vibrate', {
      value: vibrateMock,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('hapticLight calls navigator.vibrate(10)', () => {
    hapticLight();
    expect(vibrateMock).toHaveBeenCalledWith(10);
  });

  it('hapticMedium calls navigator.vibrate(25)', () => {
    hapticMedium();
    expect(vibrateMock).toHaveBeenCalledWith(25);
  });

  it('hapticHeavy calls navigator.vibrate([30, 10, 30])', () => {
    hapticHeavy();
    expect(vibrateMock).toHaveBeenCalledWith([30, 10, 30]);
  });

  it('hapticLight does not throw when navigator.vibrate is absent', () => {
    // Delete the property so "vibrate" in navigator returns false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (navigator as any).vibrate;
    expect(() => hapticLight()).not.toThrow();
  });

  it('hapticMedium does not throw when navigator.vibrate is absent', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (navigator as any).vibrate;
    expect(() => hapticMedium()).not.toThrow();
  });

  it('hapticHeavy does not throw when navigator.vibrate is absent', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (navigator as any).vibrate;
    expect(() => hapticHeavy()).not.toThrow();
  });
});
