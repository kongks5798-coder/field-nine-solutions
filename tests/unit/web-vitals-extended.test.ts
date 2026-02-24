// @vitest-environment jsdom
/**
 * web-vitals-extended.test.ts
 *
 * Extended edge-case tests for src/lib/web-vitals:
 * 1. PostHog not on window → no error thrown
 * 2. Metric with rating "poor" → proper PostHog capture with rating
 * 3. PostHog set to null → no error
 * 4. Metric with very large value → no error, correct capture
 * 5. Development mode logs rating in console output
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { reportWebVitals } from '@/lib/web-vitals';

describe('web-vitals extended', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    delete (window as any).posthog;
    vi.unstubAllEnvs();
  });

  it('no error when window.posthog is undefined', () => {
    delete (window as any).posthog;
    expect(() => {
      reportWebVitals({
        name: 'CLS',
        value: 0.1,
        rating: 'good',
        id: 'ext-1',
      });
    }).not.toThrow();
  });

  it('no error when window.posthog is explicitly null', () => {
    (window as any).posthog = null;
    expect(() => {
      reportWebVitals({
        name: 'FCP',
        value: 500,
        rating: 'good',
        id: 'ext-2',
      });
    }).not.toThrow();
  });

  it('metric with rating "poor" is captured correctly by PostHog', () => {
    const captureSpy = vi.fn();
    (window as any).posthog = { capture: captureSpy };

    reportWebVitals({
      name: 'LCP',
      value: 5000,
      rating: 'poor',
      id: 'ext-3',
    });

    expect(captureSpy).toHaveBeenCalledTimes(1);
    expect(captureSpy).toHaveBeenCalledWith('web_vitals', expect.objectContaining({
      metric_name: 'LCP',
      metric_value: 5000,
      metric_rating: 'poor',
      metric_id: 'ext-3',
    }));
  });

  it('metric with very large value does not throw', () => {
    const captureSpy = vi.fn();
    (window as any).posthog = { capture: captureSpy };

    expect(() => {
      reportWebVitals({
        name: 'TTFB',
        value: 999999.999,
        rating: 'poor',
        id: 'ext-4',
      });
    }).not.toThrow();

    expect(captureSpy).toHaveBeenCalledWith('web_vitals', expect.objectContaining({
      metric_value: 999999.999,
    }));
  });

  it('development mode console.log includes the rating string', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    reportWebVitals({
      name: 'INP',
      value: 350,
      rating: 'poor',
      id: 'ext-5',
    });

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const logMsg = consoleSpy.mock.calls[0][0] as string;
    expect(logMsg).toContain('INP');
    expect(logMsg).toContain('350.0');
    expect(logMsg).toContain('poor');
    consoleSpy.mockRestore();
  });
});
