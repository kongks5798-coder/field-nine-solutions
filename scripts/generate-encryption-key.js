/**
 * Generate AES-256 Encryption Key
 * K-Universal Security Module
 */

const crypto = require('crypto');

console.log('\n🔐 K-Universal Encryption Key Generator\n');
console.log('='.repeat(60));
console.log('\n📋 Generating 32-byte (256-bit) encryption key...\n');

const key = crypto.randomBytes(32).toString('hex');

console.log('✅ Key Generated Successfully!\n');
console.log('📝 Copy this value to your .env.production file:\n');
console.log('─'.repeat(60));
console.log(`AES_ENCRYPTION_KEY=${key}`);
console.log('─'.repeat(60));
console.log('\n⚠️  SECURITY NOTICE:');
console.log('   - Keep this key SECRET');
console.log('   - Never commit to Git');
console.log('   - Store securely (password manager recommended)');
console.log('   - Changing this key will invalidate existing encrypted data');
console.log('\n✅ Key length:', key.length, 'characters (64 hex = 32 bytes)');
console.log('✅ Algorithm: AES-256-CBC');
console.log('✅ Use case: Passport data & card encryption\n');
console.log('='.repeat(60));
console.log('\n🚀 Ready to paste into .env.production!\n');
