#!/usr/bin/env node
/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * TESLA FLEET API - OAuth Token Generator
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * 이 스크립트를 로컬에서 실행하여 Tesla Fleet API Access Token을 발급받습니다.
 *
 * 사용법:
 *   1. .env.local에 TESLA_CLIENT_ID와 TESLA_CLIENT_SECRET 설정
 *   2. node scripts/get-tesla-tokens.js 실행
 *   3. 브라우저에서 Tesla 계정 로그인
 *   4. 발급된 토큰을 Vercel 환경변수에 등록
 *
 * 필요한 환경변수:
 *   - TESLA_CLIENT_ID: Tesla Developer App Client ID
 *   - TESLA_CLIENT_SECRET: Tesla Developer App Client Secret
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const http = require('http');
const https = require('https');
const { URL, URLSearchParams } = require('url');
const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

// Load .env.local if exists
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
    }
  });
}

const CONFIG = {
  CLIENT_ID: process.env.TESLA_CLIENT_ID || '',
  CLIENT_SECRET: process.env.TESLA_CLIENT_SECRET || '',
  REDIRECT_PORT: 8888,
  REDIRECT_URI: 'http://localhost:8888/callback',

  // Tesla OAuth Endpoints
  AUTH_URL: 'https://auth.tesla.com/oauth2/v3/authorize',
  TOKEN_URL: 'https://auth.tesla.com/oauth2/v3/token',

  // Scopes for Fleet API
  SCOPES: [
    'openid',
    'offline_access',
    'user_data',
    'vehicle_device_data',
    'vehicle_cmds',
    'vehicle_charging_cmds',
  ].join(' '),
};

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function generateState() {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

function generateCodeVerifier() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  for (let i = 0; i < 128; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function generateCodeChallenge(verifier) {
  const crypto = require('crypto');
  const hash = crypto.createHash('sha256').update(verifier).digest();
  return hash.toString('base64url');
}

function httpsRequest(url, options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN OAUTH FLOW
// ═══════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('👑 TESLA FLEET API - OAuth Token Generator');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('');

  // Validate configuration
  if (!CONFIG.CLIENT_ID) {
    console.error('❌ ERROR: TESLA_CLIENT_ID not set');
    console.error('');
    console.error('Set it in .env.local:');
    console.error('  TESLA_CLIENT_ID=your-client-id');
    process.exit(1);
  }

  if (!CONFIG.CLIENT_SECRET) {
    console.error('❌ ERROR: TESLA_CLIENT_SECRET not set');
    console.error('');
    console.error('Set it in .env.local:');
    console.error('  TESLA_CLIENT_SECRET=your-client-secret');
    process.exit(1);
  }

  console.log('✅ Configuration loaded');
  console.log(`   Client ID: ${CONFIG.CLIENT_ID.substring(0, 8)}...`);
  console.log('');

  // Generate PKCE parameters
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Build authorization URL
  const authParams = new URLSearchParams({
    response_type: 'code',
    client_id: CONFIG.CLIENT_ID,
    redirect_uri: CONFIG.REDIRECT_URI,
    scope: CONFIG.SCOPES,
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  const authUrl = `${CONFIG.AUTH_URL}?${authParams.toString()}`;

  // Start local callback server
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url, `http://localhost:${CONFIG.REDIRECT_PORT}`);

      if (url.pathname === '/callback') {
        const code = url.searchParams.get('code');
        const returnedState = url.searchParams.get('state');
        const error = url.searchParams.get('error');

        if (error) {
          res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`<h1>❌ Error: ${error}</h1><p>${url.searchParams.get('error_description')}</p>`);
          server.close();
          reject(new Error(error));
          return;
        }

        if (returnedState !== state) {
          res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end('<h1>❌ State mismatch - possible CSRF attack</h1>');
          server.close();
          reject(new Error('State mismatch'));
          return;
        }

        if (!code) {
          res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end('<h1>❌ No authorization code received</h1>');
          server.close();
          reject(new Error('No code'));
          return;
        }

        console.log('');
        console.log('✅ Authorization code received');
        console.log('   Exchanging for tokens...');

        // Exchange code for tokens
        try {
          const tokenParams = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: CONFIG.CLIENT_ID,
            client_secret: CONFIG.CLIENT_SECRET,
            code: code,
            redirect_uri: CONFIG.REDIRECT_URI,
            code_verifier: codeVerifier,
          });

          const tokenResponse = await httpsRequest(CONFIG.TOKEN_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }, tokenParams.toString());

          if (tokenResponse.status !== 200) {
            throw new Error(`Token exchange failed: ${JSON.stringify(tokenResponse.data)}`);
          }

          const tokens = tokenResponse.data;

          // Success response
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`
            <!DOCTYPE html>
            <html>
            <head>
              <title>Tesla OAuth Success</title>
              <style>
                body { font-family: system-ui; padding: 40px; background: #1a1a2e; color: #fff; }
                .container { max-width: 800px; margin: 0 auto; }
                h1 { color: #00d4aa; }
                .token-box { background: #16213e; padding: 20px; border-radius: 8px; margin: 20px 0; overflow-wrap: break-word; }
                .label { color: #888; font-size: 14px; margin-bottom: 5px; }
                .value { font-family: monospace; font-size: 12px; color: #00d4aa; }
                .warning { background: #3d1f1f; padding: 15px; border-radius: 8px; margin-top: 20px; }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>✅ Tesla OAuth Success!</h1>
                <p>아래 토큰을 Vercel 환경변수에 등록하세요:</p>

                <div class="token-box">
                  <div class="label">TESLA_ACCESS_TOKEN:</div>
                  <div class="value">${tokens.access_token}</div>
                </div>

                <div class="token-box">
                  <div class="label">TESLA_REFRESH_TOKEN:</div>
                  <div class="value">${tokens.refresh_token || 'N/A'}</div>
                </div>

                <div class="token-box">
                  <div class="label">Expires In:</div>
                  <div class="value">${tokens.expires_in} seconds (약 ${Math.round(tokens.expires_in / 3600)} 시간)</div>
                </div>

                <div class="warning">
                  ⚠️ 이 창을 닫기 전에 토큰을 복사하세요!<br>
                  Access Token은 일정 시간 후 만료됩니다. Refresh Token을 사용해 갱신하세요.
                </div>
              </div>
            </body>
            </html>
          `);

          // Print to console as well
          console.log('');
          console.log('═══════════════════════════════════════════════════════════════════');
          console.log('✅ TOKENS RECEIVED SUCCESSFULLY');
          console.log('═══════════════════════════════════════════════════════════════════');
          console.log('');
          console.log('Copy these to Vercel Environment Variables:');
          console.log('');
          console.log('TESLA_ACCESS_TOKEN=');
          console.log(tokens.access_token);
          console.log('');
          console.log('TESLA_REFRESH_TOKEN=');
          console.log(tokens.refresh_token || 'N/A');
          console.log('');
          console.log(`Token expires in: ${tokens.expires_in} seconds`);
          console.log('═══════════════════════════════════════════════════════════════════');

          // Save to file for convenience
          const outputPath = path.join(__dirname, 'tesla-tokens.json');
          fs.writeFileSync(outputPath, JSON.stringify({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_in: tokens.expires_in,
            created_at: new Date().toISOString(),
          }, null, 2));
          console.log('');
          console.log(`Tokens also saved to: ${outputPath}`);

          server.close();
          resolve(tokens);

        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`<h1>❌ Token Exchange Failed</h1><pre>${err.message}</pre>`);
          server.close();
          reject(err);
        }
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    server.listen(CONFIG.REDIRECT_PORT, () => {
      console.log(`📡 Callback server running on port ${CONFIG.REDIRECT_PORT}`);
      console.log('');
      console.log('═══════════════════════════════════════════════════════════════════');
      console.log('🔗 Open this URL in your browser to authorize:');
      console.log('═══════════════════════════════════════════════════════════════════');
      console.log('');
      console.log(authUrl);
      console.log('');
      console.log('═══════════════════════════════════════════════════════════════════');
      console.log('Waiting for authorization...');

      // Try to open browser automatically
      const { exec } = require('child_process');
      const platform = process.platform;

      if (platform === 'win32') {
        exec(`start "" "${authUrl}"`);
      } else if (platform === 'darwin') {
        exec(`open "${authUrl}"`);
      } else {
        exec(`xdg-open "${authUrl}"`);
      }
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${CONFIG.REDIRECT_PORT} is already in use`);
        console.error('   Close any other processes using this port and try again.');
      }
      reject(err);
    });
  });
}

// Run
main().catch(err => {
  console.error('');
  console.error('❌ Error:', err.message);
  process.exit(1);
});
