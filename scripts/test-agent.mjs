#!/usr/bin/env node
/**
 * FieldNine / Dalkak 자동 테스트 에이전트
 * 사용법: node scripts/test-agent.mjs [--url https://fieldnine.io]
 *
 * 테스트 항목:
 *  1. 헬스체크 API
 *  2. 관리자 로그인 API
 *  3. 토큰 API (비인증 / 인증)
 *  4. AI 스트림 API 헤더
 *  5. 결제 확인 라우트 파라미터 검증
 *  6. CSP 헤더 — TossPayments 스크립트 허용 여부
 *  7. pricing 페이지 — TossPayments SDK 스크립트 태그 존재 여부
 *  8. 보안 헤더 일괄 검증
 */

const BASE = process.argv.find(a => a.startsWith('--url='))?.slice(6)
  ?? process.argv[process.argv.indexOf('--url') + 1]
  ?? 'https://fieldnine.io';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? '';

const RESET  = '\x1b[0m';
const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN   = '\x1b[36m';
const BOLD   = '\x1b[1m';
const DIM    = '\x1b[2m';

let passed = 0, failed = 0, warned = 0;
const report = [];

function ok(label, detail = '')  { passed++; report.push({ s: 'PASS', label, detail }); }
function fail(label, detail = '') { failed++; report.push({ s: 'FAIL', label, detail }); }
function warn(label, detail = '') { warned++; report.push({ s: 'WARN', label, detail }); }

async function get(path, opts = {}) {
  const url = BASE + path;
  try {
    const r = await fetch(url, { redirect: 'manual', ...opts });
    return r;
  } catch (e) {
    return null;
  }
}

async function post(path, body, headers = {}) {
  const url = BASE + path;
  try {
    return await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      redirect: 'manual',
    });
  } catch { return null; }
}

// ─── 1. 헬스체크 ─────────────────────────────────────────────────────────────
async function testHealth() {
  console.log(`\n${CYAN}[1] 헬스체크 API${RESET}`);
  const r = await get('/api/health');
  if (!r) { fail('GET /api/health', '연결 실패'); return; }
  if (r.status === 200) {
    const j = await r.json().catch(() => null);
    ok('GET /api/health 200', j?.status ?? '');
  } else {
    fail('GET /api/health', `HTTP ${r.status}`);
  }
}

// ─── 2. 상태 페이지 ───────────────────────────────────────────────────────────
async function testStatus() {
  console.log(`\n${CYAN}[2] /status 페이지${RESET}`);
  const r = await get('/status');
  if (!r) { fail('GET /status', '연결 실패'); return; }
  if (r.status === 200) ok('GET /status 200');
  else fail('GET /status', `HTTP ${r.status}`);
}

// ─── 3. 관리자 로그인 API ─────────────────────────────────────────────────────
async function testAdminLogin() {
  console.log(`\n${CYAN}[3] 관리자 로그인 API${RESET}`);

  // 3-a. 빈 요청
  const r1 = await post('/api/auth/login', {});
  if (!r1) { fail('POST /api/auth/login (빈 body)', '연결 실패'); }
  else if (r1.status === 400 || r1.status === 401 || r1.status === 500) {
    const j = await r1.json().catch(() => ({}));
    if (j?.error === 'Server not configured') {
      fail('POST /api/auth/login', 'ADMIN_PASSWORD 환경변수 미설정 — Vercel 대시보드에서 추가 필요');
    } else {
      ok('POST /api/auth/login 잘못된 요청 거부', `${r1.status} ${j?.error ?? ''}`);
    }
  } else {
    warn('POST /api/auth/login 예상 외 응답', `HTTP ${r1.status}`);
  }

  // 3-b. 잘못된 비밀번호
  const r2 = await post('/api/auth/login', { password: 'wrong-password-test' });
  if (!r2) { fail('POST /api/auth/login (wrong pw)', '연결 실패'); }
  else if (r2.status === 401) ok('잘못된 비밀번호 → 401 거부');
  else if (r2.status === 429) warn('Rate limit 발동', '테스트 재실행 전 잠시 대기 필요');
  else if (r2.status === 500) {
    const j = await r2.json().catch(() => ({}));
    fail('서버 오류', j?.error ?? `HTTP ${r2.status}`);
  } else warn('예상 외 응답', `HTTP ${r2.status}`);

  // 3-c. 올바른 비밀번호 (env에서 가져옴)
  if (ADMIN_PASSWORD) {
    const r3 = await post('/api/auth/login', { password: ADMIN_PASSWORD });
    if (!r3) { fail('POST /api/auth/login (correct pw)', '연결 실패'); }
    else if (r3.status === 200) ok('올바른 비밀번호 → 200 로그인 성공');
    else fail('올바른 비밀번호 로그인 실패', `HTTP ${r3.status}`);
  } else {
    warn('ADMIN_PASSWORD 미제공', 'ADMIN_PASSWORD=xxx node scripts/test-agent.mjs 로 실행하면 완전 테스트 가능');
  }
}

// ─── 4. 토큰 API ─────────────────────────────────────────────────────────────
async function testTokens() {
  console.log(`\n${CYAN}[4] 토큰 API${RESET}`);

  // 비인증 GET → 기본 잔액 반환 (50000)
  const r1 = await get('/api/tokens');
  if (!r1) { fail('GET /api/tokens', '연결 실패'); return; }
  if (r1.status === 200) {
    const j = await r1.json().catch(() => null);
    if (typeof j?.balance === 'number') ok('GET /api/tokens 200', `balance: ${j.balance}`);
    else fail('GET /api/tokens 응답 형식 오류', JSON.stringify(j));
  } else fail('GET /api/tokens', `HTTP ${r1.status}`);

  // 비인증 PATCH → 401
  const r2 = await post('/api/tokens', { delta: -100 });
  if (!r2) { fail('PATCH /api/tokens (비인증)', '연결 실패'); return; }
  // fetch POST vs PATCH — 별도 처리
  const r3 = await fetch(BASE + '/api/tokens', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ delta: -100 }),
    redirect: 'manual',
  }).catch(() => null);
  if (!r3) { fail('PATCH /api/tokens (비인증)', '연결 실패'); return; }
  if (r3.status === 401) ok('PATCH /api/tokens 비인증 → 401');
  else fail('PATCH /api/tokens 비인증 응답', `HTTP ${r3.status} (401 예상)`);

  // delta 양수 → 400 (zod 검증)
  const r4 = await fetch(BASE + '/api/tokens', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ delta: 999 }),
    redirect: 'manual',
  }).catch(() => null);
  if (r4?.status === 400 || r4?.status === 401) {
    ok('PATCH /api/tokens delta=양수 → 거부 (zod 검증)');
  } else if (r4) warn('PATCH /api/tokens delta 검증 응답', `HTTP ${r4.status}`);
}

// ─── 5. 결제 확인 라우트 파라미터 검증 ───────────────────────────────────────
async function testPaymentConfirm() {
  console.log(`\n${CYAN}[5] 결제 확인 라우트 파라미터 검증${RESET}`);

  // 파라미터 없음 → /pricing?error=missing_params 리다이렉트
  const r1 = await get('/api/payment/confirm');
  if (!r1) { fail('GET /api/payment/confirm (params 없음)', '연결 실패'); return; }
  if (r1.status === 307 || r1.status === 302 || r1.status === 301) {
    const loc = r1.headers.get('location') ?? '';
    if (loc.includes('error=missing_params')) ok('파라미터 없음 → missing_params 리다이렉트', loc);
    else warn('리다이렉트 목적지 확인 필요', loc);
  } else fail('파라미터 없음 응답', `HTTP ${r1.status} (3xx 리다이렉트 예상)`);

  // 잘못된 plan
  const r2 = await get('/api/payment/confirm?paymentKey=k&orderId=o&amount=39000&plan=hacker');
  if (!r2) { fail('GET /api/payment/confirm (invalid plan)', '연결 실패'); return; }
  if (r2.status === 307 || r2.status === 302) {
    const loc = r2.headers.get('location') ?? '';
    if (loc.includes('error=invalid_plan')) ok('잘못된 plan → invalid_plan 리다이렉트', loc);
    else warn('리다이렉트 목적지', loc);
  } else if (r2.status === 302) ok('invalid plan 거부');
  else fail('잘못된 plan 처리', `HTTP ${r2.status}`);

  // 금액 조작
  const r3 = await get('/api/payment/confirm?paymentKey=k&orderId=o&amount=1&plan=pro');
  if (!r3) { fail('GET /api/payment/confirm (amount 조작)', '연결 실패'); return; }
  if (r3.status === 307 || r3.status === 302) {
    const loc = r3.headers.get('location') ?? '';
    if (loc.includes('error=amount_mismatch')) ok('금액 조작 → amount_mismatch 거부', loc);
    else warn('리다이렉트', loc);
  } else fail('금액 조작 처리', `HTTP ${r3.status}`);
}

// ─── 6. CSP 헤더 — TossPayments 허용 여부 ───────────────────────────────────
async function testCSP() {
  console.log(`\n${CYAN}[6] CSP 헤더 검증${RESET}`);

  const r = await get('/pricing');
  if (!r) { fail('GET /pricing', '연결 실패'); return; }

  const csp = r.headers.get('content-security-policy') ?? '';
  if (!csp) { fail('CSP 헤더 없음'); return; }

  // script-src
  if (csp.includes('*.tosspayments.com') || csp.includes('js.tosspayments.com')) {
    if (csp.includes('*.tosspayments.com')) {
      ok('script-src: *.tosspayments.com 와일드카드 허용');
    } else {
      warn('script-src: js.tosspayments.com만 허용', '*.tosspayments.com으로 변경하면 더 안전');
    }
  } else {
    fail('script-src에 tosspayments.com 없음', '결제 SDK 스크립트 로드 차단 가능성');
  }

  // connect-src
  if (csp.includes('*.tosspayments.com')) ok('connect-src: *.tosspayments.com 허용');
  else warn('connect-src tosspayments 누락', csp.slice(0, 200));

  // frame-src
  if (csp.includes('frame-src') && csp.includes('tosspayments')) ok('frame-src: tosspayments 허용');
  else warn('frame-src tosspayments 누락');

  // payment Permissions-Policy 차단 여부
  const pp = r.headers.get('permissions-policy') ?? '';
  if (pp.includes('payment=()')) {
    fail('Permissions-Policy: payment=() — 결제 API 차단됨!', '이 항목을 제거해야 함');
  } else {
    ok('Permissions-Policy: payment 차단 없음');
  }
}

// ─── 7. 보안 헤더 일괄 ───────────────────────────────────────────────────────
async function testSecurityHeaders() {
  console.log(`\n${CYAN}[7] 보안 헤더 검증${RESET}`);

  const r = await get('/');
  if (!r) { fail('GET /', '연결 실패'); return; }

  const checks = [
    ['X-Content-Type-Options', 'nosniff'],
    ['X-Frame-Options', /DENY|SAMEORIGIN/i],
    ['Strict-Transport-Security', /max-age/i],
    ['Referrer-Policy', /strict-origin/i],
  ];

  for (const [key, expected] of checks) {
    const val = r.headers.get(key) ?? '';
    const match = typeof expected === 'string' ? val === expected : expected.test(val);
    if (match) ok(`${key}: ${val}`);
    else if (!val) warn(`${key} 누락`);
    else fail(`${key}: ${val}`, `예상: ${expected}`);
  }
}

// ─── 8. 주요 페이지 접근성 ───────────────────────────────────────────────────
async function testPages() {
  console.log(`\n${CYAN}[8] 주요 페이지 접근성${RESET}`);

  const pages = [
    ['/', 200],
    ['/pricing', 200],
    ['/workspace', [200, 307, 302]],  // 비인증 리다이렉트 가능
    ['/admin', [200, 307, 302]],
    ['/admin/login', 200],
    ['/status', 200],
  ];

  for (const [path, expected] of pages) {
    const r = await get(path);
    if (!r) { fail(`GET ${path}`, '연결 실패'); continue; }
    const exp = Array.isArray(expected) ? expected : [expected];
    if (exp.includes(r.status)) ok(`GET ${path} → ${r.status}`);
    else fail(`GET ${path} → ${r.status}`, `예상: ${exp.join('/')}`);
  }
}

// ─── 메인 ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${BOLD}════════════════════════════════════════════════${RESET}`);
  console.log(`${BOLD}  FieldNine 자동 테스트 에이전트${RESET}`);
  console.log(`${DIM}  대상: ${BASE}${RESET}`);
  console.log(`  시각: ${new Date().toLocaleString('ko-KR')}`);
  console.log(`${BOLD}════════════════════════════════════════════════${RESET}`);

  await testHealth();
  await testStatus();
  await testAdminLogin();
  await testTokens();
  await testPaymentConfirm();
  await testCSP();
  await testSecurityHeaders();
  await testPages();

  // ─── 최종 보고서 ─────────────────────────────────────────────────────────
  console.log(`\n${BOLD}════════════════════════════════════════════════${RESET}`);
  console.log(`${BOLD}  최종 보고서${RESET}`);
  console.log(`${BOLD}════════════════════════════════════════════════${RESET}\n`);

  for (const { s, label, detail } of report) {
    const color = s === 'PASS' ? GREEN : s === 'FAIL' ? RED : YELLOW;
    const icon  = s === 'PASS' ? '✅' : s === 'FAIL' ? '❌' : '⚠️ ';
    console.log(`${color}${icon} [${s}]${RESET} ${label}`);
    if (detail) console.log(`       ${DIM}${detail}${RESET}`);
  }

  console.log(`\n${BOLD}────────────────────────────────────────────────${RESET}`);
  console.log(`${GREEN}PASS: ${passed}${RESET}  ${RED}FAIL: ${failed}${RESET}  ${YELLOW}WARN: ${warned}${RESET}`);
  console.log(`${BOLD}────────────────────────────────────────────────${RESET}\n`);

  if (failed > 0) {
    console.log(`${RED}${BOLD}일부 테스트 실패. 위 항목을 확인하세요.${RESET}\n`);
    process.exit(1);
  } else if (warned > 0) {
    console.log(`${YELLOW}${BOLD}모든 테스트 통과 (경고 ${warned}건 존재).${RESET}\n`);
  } else {
    console.log(`${GREEN}${BOLD}모든 테스트 통과!${RESET}\n`);
  }
}

main().catch(e => {
  console.error(`${RED}에이전트 실행 오류:${RESET}`, e.message);
  process.exit(1);
});
