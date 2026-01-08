import { validateEmail, validatePassword, validateText, validateUrl, validateNumber } from '@/src/utils/validation';

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('should validate correct email', () => {
      const result = validateEmail('test@example.com');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid email format', () => {
      const result = validateEmail('invalid-email');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject XSS attempts', () => {
      const result = validateEmail('<script>alert("xss")</script>@example.com');
      expect(result.isValid).toBe(false);
    });

    it('should reject empty email', () => {
      const result = validateEmail('');
      expect(result.isValid).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate password for login (min 6 chars)', () => {
      const result = validatePassword('password123', false);
      expect(result.isValid).toBe(true);
    });

    it('should validate strong password for signup', () => {
      const result = validatePassword('Password123!', true);
      expect(result.isValid).toBe(true);
    });

    it('should reject weak password for signup', () => {
      const result = validatePassword('weak', true);
      expect(result.isValid).toBe(false);
    });

    it('should reject XSS attempts', () => {
      const result = validatePassword('<script>alert("xss")</script>', false);
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateText', () => {
    it('should validate normal text', () => {
      const result = validateText('Hello World');
      expect(result.isValid).toBe(true);
    });

    it('should reject XSS attempts', () => {
      const result = validateText('<script>alert("xss")</script>');
      expect(result.isValid).toBe(false);
    });

    it('should validate empty text', () => {
      const result = validateText('');
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateUrl', () => {
    it('should validate HTTP URL', () => {
      const result = validateUrl('http://example.com');
      expect(result.isValid).toBe(true);
    });

    it('should validate HTTPS URL', () => {
      const result = validateUrl('https://example.com');
      expect(result.isValid).toBe(true);
    });

    it('should reject invalid URL', () => {
      const result = validateUrl('not-a-url');
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateNumber', () => {
    it('should validate number within range', () => {
      const result = validateNumber('5', 0, 10);
      expect(result.isValid).toBe(true);
    });

    it('should reject number below minimum', () => {
      const result = validateNumber('5', 10, 20);
      expect(result.isValid).toBe(false);
    });

    it('should reject number above maximum', () => {
      const result = validateNumber('25', 10, 20);
      expect(result.isValid).toBe(false);
    });
  });
});
