import { logger, LogLevel } from '@/src/utils/logger';

describe('Logger', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'info').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should log info messages', () => {
    logger.info('Test message');
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should log error messages', () => {
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    logger.error('Test error', new Error('Test'));
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('should log with context', () => {
    logger.info('Test message', { key: 'value' });
    expect(consoleSpy).toHaveBeenCalled();
  });
});
