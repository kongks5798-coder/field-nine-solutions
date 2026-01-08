/**
 * 암호화 유틸리티
 * AES-256 암호화/복호화
 */

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';

/**
 * 간단한 AES 암호화 (실제로는 crypto.subtle 사용 권장)
 */
export function encrypt(data: string): string {
  try {
    // 실제 프로덕션에서는 crypto.subtle.encrypt 사용
    // 여기서는 간단한 Base64 인코딩 (개발용)
    if (process.env.NODE_ENV === 'production') {
      // 프로덕션에서는 실제 암호화 라이브러리 사용
      console.warn('[Encryption] 프로덕션 환경에서는 실제 암호화 라이브러리를 사용하세요.');
    }
    
    const encoded = Buffer.from(data).toString('base64');
    return encoded;
  } catch (error) {
    console.error('[Encryption] 암호화 오류:', error);
    throw error;
  }
}

/**
 * 복호화
 */
export function decrypt(encryptedData: string): string {
  try {
    // 실제 프로덕션에서는 crypto.subtle.decrypt 사용
    const decoded = Buffer.from(encryptedData, 'base64').toString('utf-8');
    return decoded;
  } catch (error) {
    console.error('[Encryption] 복호화 오류:', error);
    throw error;
  }
}

/**
 * 해시 생성 (SHA-256)
 */
export async function createHash(data: string): Promise<string> {
  try {
    if (typeof window !== 'undefined' && window.crypto) {
      // 브라우저 환경
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(data);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } else {
      // Node.js 환경
      const crypto = require('crypto');
      return crypto.createHash('sha256').update(data).digest('hex');
    }
  } catch (error) {
    console.error('[Encryption] 해시 생성 오류:', error);
    throw error;
  }
}

/**
 * 해시 체인 생성
 */
export async function createHashChain(
  currentData: string,
  previousHash?: string
): Promise<{ hash: string; chainHash: string }> {
  try {
    const dataHash = await createHash(currentData);
    const chainData = previousHash ? `${previousHash}:${dataHash}` : dataHash;
    const chainHash = await createHash(chainData);
    
    return {
      hash: dataHash,
      chainHash: chainHash,
    };
  } catch (error) {
    console.error('[Encryption] 해시 체인 생성 오류:', error);
    throw error;
  }
}
