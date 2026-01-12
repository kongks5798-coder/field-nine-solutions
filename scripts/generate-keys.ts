/**
 * K-UNIVERSAL Key Generation Script
 * Generate secure random keys for production
 */

import { randomBytes } from 'crypto';

function generateKey(length: number): string {
  return randomBytes(length).toString('base64');
}

console.log('🔐 K-UNIVERSAL Security Keys Generator\n');

console.log('Copy these values to your .env.production file:\n');

console.log('# Card Encryption Key (32 bytes)');
console.log(`CARD_ENCRYPTION_KEY=${generateKey(32)}\n`);

console.log('# JWT Secret (64 bytes)');
console.log(`JWT_SECRET=${generateKey(64)}\n`);

console.log('# Encryption Salt (16 bytes)');
console.log(`NEXT_PUBLIC_ENCRYPTION_SALT=${generateKey(16)}\n`);

console.log('✅ Keys generated successfully!');
console.log('⚠️  IMPORTANT: Store these keys securely and NEVER commit them to git!');
