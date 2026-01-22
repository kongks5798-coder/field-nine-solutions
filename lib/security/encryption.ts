/**
 * K-UNIVERSAL AES-256 Encryption
 * Secure encryption for Personally Identifiable Information (PII)
 *
 * Features:
 * - AES-256-GCM encryption (authenticated encryption)
 * - Secure key derivation using PBKDF2
 * - Random IV for each encryption
 * - Type-safe encryption/decryption
 */

import { createCipheriv, createDecipheriv, randomBytes, scrypt, createHash } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

// ============================================
// Configuration
// ============================================

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;        // 16 bytes for GCM
const AUTH_TAG_LENGTH = 16;  // 16 bytes for GCM auth tag
const SALT_LENGTH = 32;      // 32 bytes for salt
const KEY_LENGTH = 32;       // 32 bytes for AES-256

// Get encryption key from environment or generate a secure default
const getEncryptionKey = (): string => {
  const key = process.env.PII_ENCRYPTION_KEY;
  if (!key) {
    console.warn('PII_ENCRYPTION_KEY not set. Using derived key from NEXTAUTH_SECRET.');
    return process.env.NEXTAUTH_SECRET || 'k-universal-default-key-change-in-production';
  }
  return key;
};

// ============================================
// Types
// ============================================

export interface EncryptedData {
  ciphertext: string;    // Base64 encoded encrypted data
  iv: string;            // Base64 encoded initialization vector
  authTag: string;       // Base64 encoded authentication tag
  salt: string;          // Base64 encoded salt for key derivation
  version: number;       // Encryption version for future migrations
}

export interface PIIData {
  [key: string]: string | number | boolean | null | undefined;
}

export interface EncryptedPII {
  data: string;          // Base64 encoded EncryptedData JSON
  hash: string;          // SHA-256 hash for integrity verification
  encryptedAt: string;   // ISO timestamp
}

// ============================================
// Core Encryption Functions
// ============================================

/**
 * Derive encryption key using PBKDF2-like scrypt
 */
async function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
}

/**
 * Encrypt a string using AES-256-GCM
 */
export async function encrypt(plaintext: string): Promise<EncryptedData> {
  const encryptionKey = getEncryptionKey();

  // Generate random salt and IV
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);

  // Derive key from password + salt
  const key = await deriveKey(encryptionKey, salt);

  // Create cipher
  const cipher = createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  // Encrypt
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  // Get authentication tag
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    salt: salt.toString('base64'),
    version: 1,
  };
}

/**
 * Decrypt a string using AES-256-GCM
 */
export async function decrypt(encryptedData: EncryptedData): Promise<string> {
  const encryptionKey = getEncryptionKey();

  // Decode from base64
  const ciphertext = Buffer.from(encryptedData.ciphertext, 'base64');
  const iv = Buffer.from(encryptedData.iv, 'base64');
  const authTag = Buffer.from(encryptedData.authTag, 'base64');
  const salt = Buffer.from(encryptedData.salt, 'base64');

  // Derive key from password + salt
  const key = await deriveKey(encryptionKey, salt);

  // Create decipher
  const decipher = createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  // Decrypt
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

// ============================================
// PII-Specific Functions
// ============================================

/**
 * Encrypt PII data object
 * Use this for storing sensitive user information in database
 */
export async function encryptPII(data: PIIData): Promise<EncryptedPII> {
  const jsonString = JSON.stringify(data);
  const encrypted = await encrypt(jsonString);

  const base64Data = Buffer.from(JSON.stringify(encrypted)).toString('base64');

  // Create integrity hash
  const hash = createHash('sha256')
    .update(base64Data)
    .digest('hex');

  return {
    data: base64Data,
    hash,
    encryptedAt: new Date().toISOString(),
  };
}

/**
 * Decrypt PII data object
 */
export async function decryptPII<T = PIIData>(encryptedPII: EncryptedPII): Promise<T> {
  // Verify integrity
  const calculatedHash = createHash('sha256')
    .update(encryptedPII.data)
    .digest('hex');

  if (calculatedHash !== encryptedPII.hash) {
    throw new Error('PII data integrity check failed');
  }

  // Decode and decrypt
  const encryptedData: EncryptedData = JSON.parse(
    Buffer.from(encryptedPII.data, 'base64').toString('utf8')
  );

  const decrypted = await decrypt(encryptedData);
  return JSON.parse(decrypted) as T;
}

// ============================================
// Field-Level Encryption (for specific fields)
// ============================================

/**
 * Encrypt specific PII fields in an object
 * Non-PII fields are left unchanged
 */
export async function encryptPIIFields<T extends Record<string, unknown>>(
  data: T,
  piiFields: (keyof T)[]
): Promise<T> {
  const result = { ...data };

  for (const field of piiFields) {
    const value = data[field];
    if (value !== undefined && value !== null) {
      const encrypted = await encrypt(String(value));
      (result as Record<string, unknown>)[field as string] = {
        _encrypted: true,
        ...encrypted,
      };
    }
  }

  return result;
}

/**
 * Decrypt specific PII fields in an object
 */
export async function decryptPIIFields<T extends Record<string, unknown>>(
  data: T,
  piiFields: (keyof T)[]
): Promise<T> {
  const result = { ...data };

  for (const field of piiFields) {
    const value = data[field];
    if (value && typeof value === 'object' && '_encrypted' in value) {
      const encryptedData = value as unknown as EncryptedData & { _encrypted: boolean };
      const decrypted = await decrypt({
        ciphertext: encryptedData.ciphertext,
        iv: encryptedData.iv,
        authTag: encryptedData.authTag,
        salt: encryptedData.salt,
        version: encryptedData.version,
      });
      (result as Record<string, unknown>)[field as string] = decrypted;
    }
  }

  return result;
}

// ============================================
// Masking Functions (for display)
// ============================================

/**
 * Mask email for display (e.g., "j***@example.com")
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***';

  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

/**
 * Mask phone number for display (e.g., "010-****-1234")
 */
export function maskPhone(phone: string): string {
  if (!phone) return '***';

  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7) return '***';

  // Korean phone format
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-****-${digits.slice(-4)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 2)}-****-${digits.slice(-4)}`;
  }

  return `***-****-${digits.slice(-4)}`;
}

/**
 * Mask passport number for display (e.g., "M****1234")
 */
export function maskPassport(passport: string): string {
  if (!passport || passport.length < 5) return '***';

  return `${passport[0]}****${passport.slice(-4)}`;
}

/**
 * Mask credit card number for display (e.g., "**** **** **** 1234")
 */
export function maskCreditCard(cardNumber: string): string {
  if (!cardNumber) return '***';

  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 4) return '***';

  return `**** **** **** ${digits.slice(-4)}`;
}

/**
 * Mask name for display (e.g., "김*수")
 */
export function maskName(name: string): string {
  if (!name || name.length < 2) return '***';

  if (name.length === 2) {
    return `${name[0]}*`;
  }

  // Mask middle characters
  const first = name[0];
  const last = name[name.length - 1];
  const middleMask = '*'.repeat(name.length - 2);

  return `${first}${middleMask}${last}`;
}

// ============================================
// Hashing Functions (for indexing/lookup)
// ============================================

/**
 * Create a searchable hash of PII for lookup without exposing the value
 * Uses SHA-256 with a pepper for additional security
 */
export function hashPII(value: string): string {
  const pepper = process.env.PII_HASH_PEPPER || 'k-universal-pepper';
  return createHash('sha256')
    .update(`${pepper}:${value.toLowerCase().trim()}`)
    .digest('hex');
}

/**
 * Hash email for database lookup
 */
export function hashEmail(email: string): string {
  return hashPII(email.toLowerCase());
}

/**
 * Hash phone for database lookup
 */
export function hashPhone(phone: string): string {
  // Normalize phone number
  const normalized = phone.replace(/\D/g, '');
  return hashPII(normalized);
}

// ============================================
// Validation
// ============================================

/**
 * Check if encryption is properly configured
 */
export function isEncryptionConfigured(): boolean {
  return !!(process.env.PII_ENCRYPTION_KEY && process.env.PII_ENCRYPTION_KEY.length >= 32);
}

/**
 * Validate encrypted data structure
 */
export function isValidEncryptedData(data: unknown): data is EncryptedData {
  if (!data || typeof data !== 'object') return false;

  const obj = data as Record<string, unknown>;
  return (
    typeof obj.ciphertext === 'string' &&
    typeof obj.iv === 'string' &&
    typeof obj.authTag === 'string' &&
    typeof obj.salt === 'string' &&
    typeof obj.version === 'number'
  );
}
