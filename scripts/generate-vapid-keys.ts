/**
 * VAPID Key Generator for Web Push Notifications
 *
 * Usage: npx ts-node scripts/generate-vapid-keys.ts
 *
 * This script generates VAPID (Voluntary Application Server Identification)
 * keys required for Web Push notifications.
 */

import * as crypto from 'crypto';

interface VapidKeys {
  publicKey: string;
  privateKey: string;
}

function generateVapidKeys(): VapidKeys {
  // Generate ECDH key pair using P-256 curve
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1', // P-256
  });

  // Export keys in the format needed for web push
  const publicKeyBuffer = publicKey.export({
    type: 'spki',
    format: 'der',
  });

  const privateKeyBuffer = privateKey.export({
    type: 'pkcs8',
    format: 'der',
  });

  // Convert to URL-safe base64
  const publicKeyBase64 = Buffer.from(publicKeyBuffer)
    .slice(27) // Remove DER header
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const privateKeyBase64 = Buffer.from(privateKeyBuffer)
    .slice(36) // Remove DER header
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return {
    publicKey: publicKeyBase64,
    privateKey: privateKeyBase64,
  };
}

function main() {
  console.log('\n🔑 Generating VAPID Keys for Web Push Notifications\n');
  console.log('='.repeat(60));

  const keys = generateVapidKeys();

  console.log('\n📝 Add these to your .env.local file:\n');
  console.log('# VAPID Keys for Web Push Notifications');
  console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY="${keys.publicKey}"`);
  console.log(`VAPID_PRIVATE_KEY="${keys.privateKey}"`);

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Keys generated successfully!\n');
  console.log('⚠️  Important:');
  console.log('   - Keep the PRIVATE key secret (server-side only)');
  console.log('   - The PUBLIC key is safe to expose in client code');
  console.log('   - These keys are used for push notification authentication\n');
}

main();
