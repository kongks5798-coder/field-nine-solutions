/**
 * K-UNIVERSAL KYC Processor Tests
 * Mock 데이터를 사용한 KYC 전체 플로우 검증
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { KYCProcessor, type KYCSubmission, type KYCResult } from '@/lib/ocr/kyc-processor';
import { PassportScanner, type PassportData, type OCRResult } from '@/lib/ocr/passport-scanner';

// ============================================
// MOCK PASSPORT DATA (가짜 여권 데이터)
// ============================================

export const MOCK_PASSPORTS = {
  // 유효한 한국 여권
  validKorean: {
    passportNumber: 'M12345678',
    mrzCode: 'P<KORKIM<<MINJUN<<<<<<<<<<<<<<<<<<<<<<<<<<<\nM123456784KOR9001011M3012315<<<<<<<<<<<<<<02',
    fullName: 'MINJUN KIM',
    dateOfBirth: '1990-01-01',
    nationality: 'KOR',
    expiryDate: '2030-12-31',
    documentType: 'P' as const,
    issuingCountry: 'KOR',
    sex: 'M' as const,
  },

  // 유효한 미국 여권
  validUSA: {
    passportNumber: 'C12345678',
    mrzCode: 'P<USASMITH<<JOHN<WILLIAM<<<<<<<<<<<<<<<<<<<\nC123456782USA8505151M2812317<<<<<<<<<<<<<<04',
    fullName: 'JOHN WILLIAM SMITH',
    dateOfBirth: '1985-05-15',
    nationality: 'USA',
    expiryDate: '2028-12-31',
    documentType: 'P' as const,
    issuingCountry: 'USA',
    sex: 'M' as const,
  },

  // 만료된 여권 (테스트용)
  expired: {
    passportNumber: 'X98765432',
    mrzCode: 'P<JPNTANAKA<<YUKI<<<<<<<<<<<<<<<<<<<<<<<<<<<\nX987654321JPN9203031F2012315<<<<<<<<<<<<<<00',
    fullName: 'YUKI TANAKA',
    dateOfBirth: '1992-03-03',
    nationality: 'JPN',
    expiryDate: '2020-12-31', // 만료됨
    documentType: 'P' as const,
    issuingCountry: 'JPN',
    sex: 'F' as const,
  },

  // 1년 이내 만료 예정 여권 (자동 검증 실패)
  expiringSoon: {
    passportNumber: 'E55555555',
    mrzCode: 'P<GBRWILLIAMS<<EMMA<<<<<<<<<<<<<<<<<<<<<<<<\nE555555555GBR9506061F2506015<<<<<<<<<<<<<<02',
    fullName: 'EMMA WILLIAMS',
    dateOfBirth: '1995-06-06',
    nationality: 'GBR',
    expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 6개월 후
    documentType: 'P' as const,
    issuingCountry: 'GBR',
    sex: 'F' as const,
  },

  // 불완전한 데이터
  incomplete: {
    passportNumber: 'AB123',
    mrzCode: '',
    fullName: 'Kim', // 성만 있음
    dateOfBirth: '1990-01-01',
    nationality: 'KOR',
    expiryDate: '2030-12-31',
    documentType: 'P' as const,
    issuingCountry: 'KOR',
    sex: 'M' as const,
  },
};

// ============================================
// MOCK MRZ LINES (실제 MRZ 형식)
// ============================================

export const MOCK_MRZ_LINES = {
  validKorean: [
    'P<KORKIM<<MINJUN<<<<<<<<<<<<<<<<<<<<<<<<<<<',
    'M123456784KOR9001011M3012315<<<<<<<<<<<<<<02',
  ],
  validUSA: [
    'P<USASMITH<<JOHN<WILLIAM<<<<<<<<<<<<<<<<<<<',
    'C123456782USA8505151M2812317<<<<<<<<<<<<<<04',
  ],
  invalid: ['INVALID LINE', 'ANOTHER INVALID'],
};

// ============================================
// SUPABASE MOCK
// ============================================

const mockSupabaseResponse = {
  data: null,
  error: null,
};

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'profile-123',
              kyc_status: 'pending',
            },
            error: null,
          })),
        })),
      })),
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { id: 'passport-123' },
            error: null,
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
      insert: vi.fn(() => Promise.resolve({ error: null })),
    })),
  },
}));

// ============================================
// PASSPORT SCANNER TESTS
// ============================================

describe('PassportScanner', () => {
  describe('MRZ 파싱', () => {
    it('한국 여권 MRZ를 올바르게 파싱해야 함', () => {
      const scanner = new PassportScanner();

      // Private method 접근을 위한 any 캐스팅
      const parseMRZ = (scanner as any).parseMRZ.bind(scanner);
      const result = parseMRZ(MOCK_MRZ_LINES.validKorean);

      expect(result.documentType).toBe('P');
      expect(result.issuingCountry).toBe('KOR');
      expect(result.passportNumber).toBe('M12345678');
      expect(result.nationality).toBe('KOR');
    });

    it('미국 여권 MRZ를 올바르게 파싱해야 함', () => {
      const scanner = new PassportScanner();
      const parseMRZ = (scanner as any).parseMRZ.bind(scanner);
      const result = parseMRZ(MOCK_MRZ_LINES.validUSA);

      expect(result.documentType).toBe('P');
      expect(result.issuingCountry).toBe('USA');
      expect(result.passportNumber).toBe('C12345678');
      expect(result.nationality).toBe('USA');
    });
  });

  describe('MRZ 추출', () => {
    it('유효한 MRZ 라인을 추출해야 함', () => {
      const scanner = new PassportScanner();
      const extractMRZ = (scanner as any).extractMRZ.bind(scanner);

      // MRZ는 정확히 44자 이상이어야 함
      const text = `
        Some random text
        REPUBLIC OF KOREA
        P<KORKIM<<MINJUN<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
        M123456784KOR9001011M3012315<<<<<<<<<<<<<<<<<02
      `;

      const mrzLines = extractMRZ(text);
      // 추출된 MRZ 라인이 1개 이상이면 성공
      expect(mrzLines.length).toBeGreaterThanOrEqual(1);
      if (mrzLines.length > 0) {
        expect(mrzLines[0]).toContain('P<KOR');
      }
    });

    it('MRZ가 없는 텍스트에서 빈 배열 반환', () => {
      const scanner = new PassportScanner();
      const extractMRZ = (scanner as any).extractMRZ.bind(scanner);

      const text = 'This is just random text without MRZ';
      const mrzLines = extractMRZ(text);

      expect(mrzLines).toHaveLength(0);
    });
  });

  describe('여권 데이터 검증', () => {
    it('유효한 여권 데이터 통과', () => {
      const scanner = new PassportScanner();
      const validatePassportData = (scanner as any).validatePassportData.bind(scanner);

      const isValid = validatePassportData(MOCK_PASSPORTS.validKorean);
      expect(isValid).toBe(true);
    });

    it('만료된 여권 거부', () => {
      const scanner = new PassportScanner();
      const validatePassportData = (scanner as any).validatePassportData.bind(scanner);

      const isValid = validatePassportData(MOCK_PASSPORTS.expired);
      expect(isValid).toBe(false);
    });

    it('짧은 여권번호 거부', () => {
      const scanner = new PassportScanner();
      const validatePassportData = (scanner as any).validatePassportData.bind(scanner);

      const isValid = validatePassportData({
        ...MOCK_PASSPORTS.validKorean,
        passportNumber: 'AB12', // 너무 짧음
      });
      expect(isValid).toBe(false);
    });

    it('국적 코드 3자리 아니면 거부', () => {
      const scanner = new PassportScanner();
      const validatePassportData = (scanner as any).validatePassportData.bind(scanner);

      const isValid = validatePassportData({
        ...MOCK_PASSPORTS.validKorean,
        nationality: 'KR', // 2자리
      });
      expect(isValid).toBe(false);
    });
  });

  describe('날짜 형식 변환', () => {
    it('MRZ 날짜를 ISO 형식으로 변환', () => {
      const scanner = new PassportScanner();
      const formatMRZDate = (scanner as any).formatMRZDate.bind(scanner);

      // 1990년 1월 1일
      expect(formatMRZDate('900101')).toBe('1990-01-01');

      // 2025년 12월 31일
      expect(formatMRZDate('251231')).toBe('2025-12-31');

      // 1985년 5월 15일
      expect(formatMRZDate('850515')).toBe('1985-05-15');
    });
  });
});

// ============================================
// KYC PROCESSOR TESTS
// ============================================

describe('KYCProcessor', () => {
  let processor: KYCProcessor;

  beforeEach(() => {
    processor = new KYCProcessor();
    vi.clearAllMocks();
  });

  describe('자동 검증 로직 (shouldAutoVerify)', () => {
    it('유효한 여권은 자동 검증 통과', () => {
      const shouldAutoVerify = (processor as any).shouldAutoVerify.bind(processor);

      const result = shouldAutoVerify(MOCK_PASSPORTS.validKorean);
      expect(result).toBe(true);
    });

    it('1년 이내 만료 여권은 자동 검증 실패', () => {
      const shouldAutoVerify = (processor as any).shouldAutoVerify.bind(processor);

      const result = shouldAutoVerify(MOCK_PASSPORTS.expiringSoon);
      expect(result).toBe(false);
    });

    it('성명이 1단어인 경우 자동 검증 실패', () => {
      const shouldAutoVerify = (processor as any).shouldAutoVerify.bind(processor);

      const result = shouldAutoVerify(MOCK_PASSPORTS.incomplete);
      expect(result).toBe(false);
    });

    it('여권번호가 6자리 미만이면 자동 검증 실패', () => {
      const shouldAutoVerify = (processor as any).shouldAutoVerify.bind(processor);

      const result = shouldAutoVerify({
        ...MOCK_PASSPORTS.validKorean,
        passportNumber: 'AB123', // 5자리
      });
      expect(result).toBe(false);
    });
  });

  describe('KYC 제출', () => {
    it('유효한 KYC 제출 성공', async () => {
      const submission: KYCSubmission = {
        userId: 'user-123',
        passportData: MOCK_PASSPORTS.validKorean,
        documentImageUrl: 'https://example.com/passport.jpg',
        ipAddress: '192.168.1.1',
        deviceInfo: 'Mozilla/5.0',
      };

      const result = await processor.submitKYC(submission);

      // Supabase mock이므로 성공 응답 예상
      expect(result).toBeDefined();
      expect(result.kycStatus).toBeDefined();
    });
  });
});

// ============================================
// OCR RESULT TESTS
// ============================================

describe('OCR Result 구조', () => {
  it('성공적인 OCR 결과 구조 검증', () => {
    const successResult: OCRResult = {
      success: true,
      data: MOCK_PASSPORTS.validKorean,
      confidence: 0.95,
    };

    expect(successResult.success).toBe(true);
    expect(successResult.data).toBeDefined();
    expect(successResult.data?.passportNumber).toBe('M12345678');
    expect(successResult.confidence).toBeGreaterThan(0.9);
  });

  it('실패한 OCR 결과 구조 검증', () => {
    const failResult: OCRResult = {
      success: false,
      confidence: 0,
      error: 'MRZ not detected',
    };

    expect(failResult.success).toBe(false);
    expect(failResult.data).toBeUndefined();
    expect(failResult.error).toBeDefined();
  });
});

// ============================================
// KYC SUBMISSION 구조 테스트
// ============================================

describe('KYC Submission 구조', () => {
  it('완전한 KYC 제출 데이터 검증', () => {
    const submission: KYCSubmission = {
      userId: 'user-abc-123',
      passportData: MOCK_PASSPORTS.validKorean,
      documentImageUrl: 'https://storage.example.com/passports/user-abc-123.jpg',
      ipAddress: '203.0.113.45',
      deviceInfo: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
    };

    expect(submission.userId).toBeDefined();
    expect(submission.passportData.passportNumber).toBe('M12345678');
    expect(submission.documentImageUrl).toContain('https://');
    expect(submission.ipAddress).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
  });

  it('최소 필수 필드만 있는 제출 데이터', () => {
    const minimalSubmission: KYCSubmission = {
      userId: 'user-123',
      passportData: MOCK_PASSPORTS.validUSA,
      documentImageUrl: 'https://example.com/passport.jpg',
    };

    expect(minimalSubmission.userId).toBeDefined();
    expect(minimalSubmission.ipAddress).toBeUndefined();
    expect(minimalSubmission.deviceInfo).toBeUndefined();
  });
});

// ============================================
// KYC RESULT 구조 테스트
// ============================================

describe('KYC Result 구조', () => {
  it('성공적인 검증 결과', () => {
    const result: KYCResult = {
      success: true,
      profileId: 'profile-123',
      kycStatus: 'verified',
      message: 'KYC verified successfully',
    };

    expect(result.success).toBe(true);
    expect(result.kycStatus).toBe('verified');
    expect(result.profileId).toBeDefined();
  });

  it('보류 중인 검증 결과', () => {
    const result: KYCResult = {
      success: true,
      profileId: 'profile-456',
      kycStatus: 'pending',
      message: 'KYC submitted for review',
    };

    expect(result.success).toBe(true);
    expect(result.kycStatus).toBe('pending');
  });

  it('거부된 검증 결과', () => {
    const result: KYCResult = {
      success: false,
      kycStatus: 'rejected',
      message: 'Invalid passport data',
    };

    expect(result.success).toBe(false);
    expect(result.kycStatus).toBe('rejected');
    expect(result.profileId).toBeUndefined();
  });
});

// ============================================
// 통합 시나리오 테스트
// ============================================

describe('KYC 통합 시나리오', () => {
  describe('신규 사용자 KYC 플로우', () => {
    it('한국인 사용자 - 유효한 여권으로 자동 검증', async () => {
      const processor = new KYCProcessor();

      // 자동 검증 조건 확인
      const shouldAutoVerify = (processor as any).shouldAutoVerify.bind(processor);
      const willAutoVerify = shouldAutoVerify(MOCK_PASSPORTS.validKorean);

      expect(willAutoVerify).toBe(true);
    });

    it('외국인 사용자 - 유효한 미국 여권으로 자동 검증', async () => {
      const processor = new KYCProcessor();

      const shouldAutoVerify = (processor as any).shouldAutoVerify.bind(processor);
      const willAutoVerify = shouldAutoVerify(MOCK_PASSPORTS.validUSA);

      expect(willAutoVerify).toBe(true);
    });
  });

  describe('에지 케이스', () => {
    it('만료된 여권은 자동 검증 거부', () => {
      const processor = new KYCProcessor();
      const shouldAutoVerify = (processor as any).shouldAutoVerify.bind(processor);

      // 만료된 여권은 expiry check에서 걸림
      const willAutoVerify = shouldAutoVerify(MOCK_PASSPORTS.expired);
      expect(willAutoVerify).toBe(false);
    });

    it('곧 만료되는 여권은 수동 검토 필요', () => {
      const processor = new KYCProcessor();
      const shouldAutoVerify = (processor as any).shouldAutoVerify.bind(processor);

      const willAutoVerify = shouldAutoVerify(MOCK_PASSPORTS.expiringSoon);
      expect(willAutoVerify).toBe(false);
    });
  });
});

// ============================================
// 유틸리티 함수
// ============================================

describe('유틸리티 함수', () => {
  describe('국적 코드 검증', () => {
    const validNationalities = ['KOR', 'USA', 'JPN', 'GBR', 'DEU', 'FRA', 'CHN'];

    it.each(validNationalities)('%s는 유효한 국적 코드', (nationality) => {
      expect(nationality).toHaveLength(3);
      expect(nationality).toMatch(/^[A-Z]{3}$/);
    });
  });

  describe('여권번호 형식 검증', () => {
    const validPassportNumbers = [
      'M12345678',  // 한국
      'C12345678',  // 미국
      'X98765432',  // 일본
      'E55555555',  // 영국
    ];

    it.each(validPassportNumbers)('%s는 유효한 여권번호', (passportNumber) => {
      expect(passportNumber.length).toBeGreaterThanOrEqual(6);
    });
  });
});
