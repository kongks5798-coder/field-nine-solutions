/**
 * Logger 테스트
 */

import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import { logger } from '@/src/utils/logger';

describe('Logger', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  let consoleSpy: MockInstance;

  beforeEach(() => {
    // Set to development so info logs work
    process.env.NODE_ENV = 'development';
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('should log info messages in development', () => {
    logger.info('Test message');
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should not log info messages in production', () => {
    process.env.NODE_ENV = 'production';
    logger.info('Test message');
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('should log error messages', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.error('Test error', new Error('Test'));
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('should log error messages even in production', () => {
    process.env.NODE_ENV = 'production';
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.error('Test error', new Error('Test'));
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('should log warning messages', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logger.warn('Test warning');
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('should log with context data', () => {
    logger.info('Test message', { key: 'value' });
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[INFO] Test message'),
      expect.objectContaining({ key: 'value' })
    );
  });
});
