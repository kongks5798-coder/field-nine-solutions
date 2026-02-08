/**
 * 보안 유틸리티
 * API Key 암호화/복호화
 */

import crypto from 'crypto';

// 환경 변수에서 암호화 키 가져오기 (실제 운영 시 별도 관리 필요)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

/**
 * 키에서 32바이트 키 생성 (PBKDF2 사용)
 */
function getKeyFromPassword(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha512');
}

/**
 * 데이터 암호화
 * @param text 암호화할 평문
 * @returns 암호화된 문자열 (Base64)
 */
export function encrypt(text: string): string {
  try {
    if (!text) {
      return '';
    }

    // Salt 생성
    const salt = crypto.randomBytes(SALT_LENGTH);
    
    // IV 생성
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // 키 생성
    const key = getKeyFromPassword(ENCRYPTION_KEY, salt);
    
    // 암호화
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    // 인증 태그 가져오기
    const tag = cipher.getAuthTag();
    
    // Salt + IV + Tag + Encrypted 데이터 결합
    const combined = Buffer.concat([
      salt,
      iv,
      tag,
      Buffer.from(encrypted, 'base64'),
    ]);
    
    return combined.toString('base64');
  } catch (error) {
    console.error('[Security] 암호화 오류:', error);
    throw new Error('암호화 실패');
  }
}

/**
 * 데이터 복호화
 * @param encryptedData 암호화된 문자열 (Base64)
 * @returns 복호화된 평문
 */
export function decrypt(encryptedData: string): string {
  try {
    if (!encryptedData) {
      return '';
    }

    // Base64 디코딩
    const combined = Buffer.from(encryptedData, 'base64');
    
    // Salt, IV, Tag, Encrypted 데이터 분리
    const salt = combined.slice(0, SALT_LENGTH);
    const iv = combined.slice(SALT_LENGTH, TAG_POSITION);
    const tag = combined.slice(TAG_POSITION, ENCRYPTED_POSITION);
    const encrypted = combined.slice(ENCRYPTED_POSITION);
    
    // 키 생성
    const key = getKeyFromPassword(ENCRYPTION_KEY, salt);
    
    // 복호화
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('[Security] 복호화 오류:', error);
    throw new Error('복호화 실패');
  }
}

/**
 * 해시 생성 (SHA-256)
 * @param data 해시할 데이터
 * @returns 해시 문자열
 */
export function createHash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * 안전한 랜덤 문자열 생성
 * @param length 길이
 * @returns 랜덤 문자열
 */
export function generateRandomString(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}
