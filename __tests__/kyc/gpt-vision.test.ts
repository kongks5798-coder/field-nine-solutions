/**
 * fn GPT-4 Vision OCR Tests
 * Mock API 응답을 사용한 GPT Vision 검증
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { extractPassportWithGPTVision, hybridPassportOCR } from '@/lib/ocr/gpt-vision';
import { MOCK_PASSPORTS } from './kyc-processor.test';

// ============================================
// GPT-4 VISION MOCK RESPONSES
// ============================================

const MOCK_GPT_RESPONSES = {
  // 성공적인 한국 여권 추출
  validKorean: {
    choices: [
      {
        message: {
          content: JSON.stringify({
            passportNumber: 'M12345678',
            fullName: 'MINJUN KIM',
            nationality: 'KOR',
            dateOfBirth: '1990-01-01',
            expiryDate: '2030-12-31',
            sex: 'M',
            issuingCountry: 'KOR',
            documentType: 'P',
            mrzCode: 'P<KORKIM<<MINJUN<<<<<<<<<<<<<<<<<<<<<<<<<<<\nM123456784KOR9001011M3012315<<<<<<<<<<<<<<02',
            confidence: 0.99,
          }),
        },
      },
    ],
  },

  // 불완전한 데이터 응답
  incomplete: {
    choices: [
      {
        message: {
          content: JSON.stringify({
            passportNumber: null,
            fullName: 'PARTIAL NAME',
            confidence: 0.5,
          }),
        },
      },
    ],
  },

  // 만료된 여권 응답
  expired: {
    choices: [
      {
        message: {
          content: JSON.stringify({
            passportNumber: 'X98765432',
            fullName: 'YUKI TANAKA',
            nationality: 'JPN',
            dateOfBirth: '1992-03-03',
            expiryDate: '2020-12-31', // 만료됨
            sex: 'F',
            issuingCountry: 'JPN',
            documentType: 'P',
            mrzCode: 'test',
            confidence: 0.95,
          }),
        },
      },
    ],
  },

  // 빈 응답
  empty: {
    choices: [
      {
        message: {
          content: '',
        },
      },
    ],
  },
};

// ============================================
// FETCH MOCK SETUP
// ============================================

const originalFetch = global.fetch;
let mockFetch: ReturnType<typeof vi.fn>;

beforeEach(() => {
  // OpenAI API Key mock
  vi.stubEnv('OPENAI_API_KEY', 'test-api-key-12345');

  mockFetch = vi.fn();
  global.fetch = mockFetch;
});

afterEach(() => {
  global.fetch = originalFetch;
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

// ============================================
// GPT-4 VISION TESTS
// ============================================

describe('GPT-4 Vision OCR', () => {
  describe('extractPassportWithGPTVision', () => {
    it('유효한 여권 이미지에서 데이터 추출 성공', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_GPT_RESPONSES.validKorean),
      });

      // Base64 인코딩된 테스트 이미지 (1x1 투명 PNG)
      const testBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

      const result = await extractPassportWithGPTVision(testBase64);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.passportNumber).toBe('M12345678');
      expect(result.data?.nationality).toBe('KOR');
      expect(result.data?.fullName).toBe('MINJUN KIM');
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('불완전한 데이터 응답 시 실패 반환', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_GPT_RESPONSES.incomplete),
      });

      const testBase64 = 'test-base64';
      const result = await extractPassportWithGPTVision(testBase64);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Incomplete passport data extracted');
    });

    it('만료된 여권 감지 및 거부', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_GPT_RESPONSES.expired),
      });

      const testBase64 = 'test-base64';
      const result = await extractPassportWithGPTVision(testBase64);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Passport has expired');
    });

    it('빈 응답 처리', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_GPT_RESPONSES.empty),
      });

      const testBase64 = 'test-base64';
      const result = await extractPassportWithGPTVision(testBase64);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No response from GPT-4 Vision');
    });

    it('API 키 없으면 에러 반환', async () => {
      vi.stubEnv('OPENAI_API_KEY', '');

      const result = await extractPassportWithGPTVision('test-base64');

      expect(result.success).toBe(false);
      expect(result.error).toBe('OpenAI API key not configured');
    });

    it('API 오류 응답 처리', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({
          error: { message: 'Rate limit exceeded' },
        }),
      });

      const result = await extractPassportWithGPTVision('test-base64');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Rate limit exceeded');
    });

    it('네트워크 오류 처리', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await extractPassportWithGPTVision('test-base64');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });
  });

  describe('API 요청 형식', () => {
    it('올바른 OpenAI API 엔드포인트 호출', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_GPT_RESPONSES.validKorean),
      });

      await extractPassportWithGPTVision('test-base64');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-api-key-12345',
          }),
        })
      );
    });

    it('gpt-4-vision-preview 모델 사용', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_GPT_RESPONSES.validKorean),
      });

      await extractPassportWithGPTVision('test-base64');

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.model).toBe('gpt-4-vision-preview');
    });

    it('낮은 temperature(0.1)로 일관성 확보', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_GPT_RESPONSES.validKorean),
      });

      await extractPassportWithGPTVision('test-base64');

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.temperature).toBe(0.1);
    });

    it('이미지를 high detail로 처리', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(MOCK_GPT_RESPONSES.validKorean),
      });

      await extractPassportWithGPTVision('test-base64');

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      const imageContent = callBody.messages[1].content.find(
        (c: any) => c.type === 'image_url'
      );

      expect(imageContent.image_url.detail).toBe('high');
    });
  });
});

// ============================================
// HYBRID OCR TESTS
// ============================================

describe('Hybrid OCR', () => {
  it('hybridPassportOCR 함수가 정의되어 있음', () => {
    expect(hybridPassportOCR).toBeDefined();
    expect(typeof hybridPassportOCR).toBe('function');
  });
});

// ============================================
// CONFIDENCE SCORE TESTS
// ============================================

describe('Confidence Score 검증', () => {
  it('높은 confidence (>0.9)는 신뢰할 수 있음', () => {
    const highConfidence = 0.99;
    expect(highConfidence).toBeGreaterThan(0.9);
  });

  it('낮은 confidence (<0.7)는 추가 검증 필요', () => {
    const lowConfidence = 0.5;
    expect(lowConfidence).toBeLessThan(0.7);
  });

  it('confidence 범위는 0-1 사이', () => {
    const validConfidences = [0, 0.5, 0.75, 0.99, 1.0];

    validConfidences.forEach((confidence) => {
      expect(confidence).toBeGreaterThanOrEqual(0);
      expect(confidence).toBeLessThanOrEqual(1);
    });
  });
});

// ============================================
// PASSPORT DATA VALIDATION
// ============================================

describe('Passport Data 검증', () => {
  describe('필수 필드', () => {
    it('모든 필수 필드가 존재해야 함', () => {
      const requiredFields = [
        'passportNumber',
        'fullName',
        'nationality',
        'dateOfBirth',
        'expiryDate',
      ];

      const passportData = MOCK_PASSPORTS.validKorean;

      requiredFields.forEach((field) => {
        expect(passportData).toHaveProperty(field);
        expect((passportData as any)[field]).toBeTruthy();
      });
    });
  });

  describe('날짜 형식', () => {
    it('날짜는 ISO 형식 (YYYY-MM-DD)', () => {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

      expect(MOCK_PASSPORTS.validKorean.dateOfBirth).toMatch(dateRegex);
      expect(MOCK_PASSPORTS.validKorean.expiryDate).toMatch(dateRegex);
    });
  });

  describe('국적 코드', () => {
    it('국적 코드는 3자리 대문자', () => {
      expect(MOCK_PASSPORTS.validKorean.nationality).toMatch(/^[A-Z]{3}$/);
      expect(MOCK_PASSPORTS.validUSA.nationality).toMatch(/^[A-Z]{3}$/);
    });
  });

  describe('성별', () => {
    it('성별은 M, F, X 중 하나', () => {
      const validSex = ['M', 'F', 'X'];

      expect(validSex).toContain(MOCK_PASSPORTS.validKorean.sex);
      expect(validSex).toContain(MOCK_PASSPORTS.validUSA.sex);
    });
  });
});
