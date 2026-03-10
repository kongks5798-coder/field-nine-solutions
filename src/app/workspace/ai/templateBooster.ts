// ── Template Booster ──────────────────────────────────────────────────────────
// Maps user prompt keywords to structural code skeletons.
// When a known app type is detected, the AI receives a pre-built scaffold
// to fill in rather than inventing the entire structure from scratch.
// This dramatically reduces SyntaxErrors and blank-canvas generation failures.

export interface BoosterTemplate {
  keywords: RegExp;
  html: string;  // base HTML structure (headings, sections, nav, etc.)
  css: string;   // CSS variable definitions and layout grid
  js: string;    // core JS with functions already named and stubbed
}

// ── E-Commerce Booster ────────────────────────────────────────────────────────

const ECOMMERCE_BOOSTER: BoosterTemplate = {
  keywords: /쇼핑몰|e-?commerce|스토어|상점|shop|store/i,
  html: `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>쇼핑몰</title><link rel="stylesheet" href="style.css"></head>
<body>
<header class="header"><nav class="nav"><div class="logo">SHOP</div>
<div class="nav-links"><a href="#home">홈</a><a href="#products">상품</a></div>
<div class="cart-icon" onclick="toggleCart()">🛒 <span id="cart-count">0</span></div></nav></header>
<main>
<section id="hero" class="hero"><h1>최고의 상품을 만나보세요</h1>
<p>특별한 할인 혜택</p><button onclick="scrollToProducts()">쇼핑 시작</button></section>
<section id="products" class="products"><div id="product-grid" class="product-grid"></div></section>
</main>
<div id="cart-modal" class="cart-modal hidden"><div class="cart-content">
<h2>장바구니</h2><div id="cart-items"></div>
<div class="cart-total">합계: <span id="total-price">₩0</span></div>
<button onclick="checkout()">결제하기</button></div></div>
<script src="script.js"></script></body></html>`,
  css: `/* 쇼핑몰 베이스 CSS */
:root{--primary:#f97316;--bg:#fff;--text:#0a0a0a;--card:#f8f8f8;--border:rgba(0,0,0,0.08)}
*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Pretendard',sans-serif;background:var(--bg);color:var(--text)}
.header{position:sticky;top:0;background:#fff;border-bottom:1px solid var(--border);z-index:100}
.nav{max-width:1200px;margin:0 auto;padding:16px 24px;display:flex;align-items:center;gap:32px}
.logo{font-weight:900;font-size:20px}.nav-links{display:flex;gap:24px;flex:1}
.nav-links a{text-decoration:none;color:var(--text)}
.hero{text-align:center;padding:80px 24px;background:linear-gradient(135deg,#fff5ef,#fff)}
.product-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:24px;padding:40px 24px;max-width:1200px;margin:0 auto}
.product-card{background:var(--card);border-radius:12px;overflow:hidden;cursor:pointer;transition:transform 0.2s}
.product-card:hover{transform:translateY(-4px)}.cart-modal{position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center}
.hidden{display:none!important}`,
  js: `// 쇼핑몰 코어 JS
const products = [
  {id:1,name:'상품 1',price:29000,img:'https://picsum.photos/300/300?random=1',category:'신상'},
  {id:2,name:'상품 2',price:49000,img:'https://picsum.photos/300/300?random=2',category:'인기'},
  {id:3,name:'상품 3',price:19000,img:'https://picsum.photos/300/300?random=3',category:'할인'},
];
let cart = [];
function renderProducts(list) {
  const grid = document.getElementById('product-grid');
  if(!grid) return;
  grid.innerHTML = list.map(p=>\`<div class="product-card" onclick="addToCart(\${p.id})">
    <img src="\${p.img}" style="width:100%;height:200px;object-fit:cover">
    <div style="padding:16px"><h3>\${p.name}</h3><p>₩\${p.price.toLocaleString()}</p></div>
  </div>\`).join('');
}
function addToCart(id) {
  const p = products.find(x=>x.id===id);
  if(!p) return;
  const ex = cart.find(x=>x.id===id);
  if(ex) ex.qty++;
  else cart.push({...p,qty:1});
  const countEl = document.getElementById('cart-count');
  if(countEl) countEl.textContent = String(cart.reduce((a,b)=>a+b.qty,0));
}
function toggleCart() {
  const modal = document.getElementById('cart-modal');
  if(!modal) return;
  modal.classList.toggle('hidden');
  renderCart();
}
function renderCart() {
  const el = document.getElementById('cart-items');
  if(!el) return;
  el.innerHTML = cart.map(i=>\`<div>\${i.name} x\${i.qty} ₩\${(i.price*i.qty).toLocaleString()}</div>\`).join('');
  const totalEl = document.getElementById('total-price');
  if(totalEl) totalEl.textContent = '₩'+cart.reduce((a,b)=>a+b.price*b.qty,0).toLocaleString();
}
function scrollToProducts() {
  const el = document.getElementById('products');
  if(el) el.scrollIntoView({behavior:'smooth'});
}
function checkout() { alert('결제 기능 준비 중입니다!'); }
document.addEventListener('DOMContentLoaded', ()=>renderProducts(products));`,
};

// ── Game Booster ──────────────────────────────────────────────────────────────

const GAME_BOOSTER: BoosterTemplate = {
  keywords: /게임|game|플레이|play|아케이드|arcade|퍼즐|puzzle|슈팅|shooting|점프|jump|러너|runner/i,
  html: `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>게임</title><link rel="stylesheet" href="style.css"></head>
<body>
<div class="game-wrapper">
  <header class="game-header">
    <div class="game-title">🎮 GAME</div>
    <div class="game-hud">
      <div class="hud-item"><span class="hud-label">SCORE</span><span class="hud-value" id="score-display">0</span></div>
      <div class="hud-item"><span class="hud-label">LEVEL</span><span class="hud-value" id="level-display">1</span></div>
      <div class="hud-item"><span class="hud-label">LIVES</span><span class="hud-value" id="lives-display">3</span></div>
      <div class="hud-item"><span class="hud-label">BEST</span><span class="hud-value" id="best-display">0</span></div>
    </div>
  </header>
  <div class="canvas-wrapper">
    <canvas id="game-canvas" width="480" height="640"></canvas>
    <div class="overlay" id="start-screen">
      <div class="overlay-content">
        <div class="overlay-icon">🎮</div>
        <h1 class="overlay-title">GAME</h1>
        <p class="overlay-sub">키보드 방향키로 조작</p>
        <button class="btn-start" id="start-btn" onclick="startGame()">▶ 게임 시작</button>
      </div>
    </div>
    <div class="overlay hidden" id="pause-screen">
      <div class="overlay-content">
        <h1 class="overlay-title">⏸ PAUSED</h1>
        <button class="btn-start" onclick="resumeGame()">▶ 계속하기</button>
      </div>
    </div>
    <div class="overlay hidden" id="gameover-screen">
      <div class="overlay-content">
        <h1 class="overlay-title">💀 GAME OVER</h1>
        <p class="overlay-sub" id="final-score-text">최종 점수: 0</p>
        <button class="btn-start" onclick="restartGame()">🔄 다시 시작</button>
      </div>
    </div>
  </div>
  <div class="mobile-controls">
    <button class="mobile-btn" id="btn-left" ontouchstart="keysDown.ArrowLeft=true" ontouchend="keysDown.ArrowLeft=false">◀</button>
    <button class="mobile-btn" id="btn-up"   ontouchstart="keysDown.ArrowUp=true"   ontouchend="keysDown.ArrowUp=false">▲</button>
    <button class="mobile-btn" id="btn-down" ontouchstart="keysDown.ArrowDown=true" ontouchend="keysDown.ArrowDown=false">▼</button>
    <button class="mobile-btn" id="btn-right" ontouchstart="keysDown.ArrowRight=true" ontouchend="keysDown.ArrowRight=false">▶</button>
  </div>
</div>
<script src="script.js"></script></body></html>`,
  css: `/* 게임 베이스 CSS */
:root{--neon:#00f5ff;--bg:#050510;--panel:rgba(0,20,40,.9);--dim:#004455;--danger:#ef4444;--success:#22c55e}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:100%;height:100%;background:var(--bg);font-family:'Courier New',Consolas,monospace;overflow-x:hidden}
.game-wrapper{display:flex;flex-direction:column;align-items:center;min-height:100vh;padding:12px 16px 24px;
  background:radial-gradient(ellipse at 50% 0%,#0a0a2e,#050510 70%)}
.game-header{width:100%;max-width:560px;display:flex;align-items:center;justify-content:space-between;
  padding:10px 20px;background:var(--panel);border:2px solid var(--neon);border-radius:8px;margin-bottom:14px;
  box-shadow:0 0 20px rgba(0,245,255,.25)}
.game-title{font-size:14px;color:var(--neon);text-shadow:0 0 10px var(--neon);letter-spacing:2px}
.game-hud{display:flex;gap:20px}
.hud-item{display:flex;flex-direction:column;align-items:center;gap:3px}
.hud-label{font-size:7px;color:#556;letter-spacing:1px}
.hud-value{font-size:13px;color:#fff;text-shadow:0 0 8px var(--neon);min-width:40px;text-align:center}
.canvas-wrapper{position:relative;border:3px solid var(--neon);border-radius:6px;overflow:hidden;
  box-shadow:0 0 30px rgba(0,245,255,.4),inset 0 0 30px rgba(0,0,0,.5)}
#game-canvas{display:block;image-rendering:pixelated;background:var(--bg)}
.overlay{position:absolute;inset:0;background:rgba(0,0,10,.92);display:flex;align-items:center;
  justify-content:center;z-index:100;backdrop-filter:blur(6px)}
.overlay.hidden{display:none}
.overlay-content{text-align:center;padding:30px 20px}
.overlay-icon{font-size:48px;margin-bottom:12px}
.overlay-title{font-size:22px;color:var(--neon);text-shadow:0 0 20px var(--neon),3px 3px 0 #003344;
  margin-bottom:12px;letter-spacing:3px}
.overlay-sub{font-size:9px;color:#aaa;margin-bottom:10px;line-height:2}
.btn-start{margin-top:16px;padding:12px 28px;background:linear-gradient(135deg,#00f5ff22,#00f5ff44);
  border:2px solid var(--neon);border-radius:6px;color:var(--neon);font-family:inherit;font-size:11px;
  cursor:pointer;text-shadow:0 0 8px var(--neon);box-shadow:0 0 15px rgba(0,245,255,.3);display:block;width:100%}
.btn-start:hover{background:linear-gradient(135deg,#00f5ff44,#00f5ff66);transform:translateY(-2px)}
.mobile-controls{width:100%;max-width:560px;margin-top:14px;display:grid;
  grid-template-columns:repeat(4,1fr);gap:8px}
.mobile-btn{height:56px;background:rgba(0,245,255,.08);border:2px solid rgba(0,245,255,.3);
  border-radius:10px;color:var(--neon);font-size:18px;cursor:pointer;user-select:none;
  -webkit-tap-highlight-color:transparent;transition:background 0.1s}
.mobile-btn:active{background:rgba(0,245,255,.25);box-shadow:0 0 12px rgba(0,245,255,.4)}
@media(max-width:520px){.game-hud{gap:12px}.hud-value{font-size:11px}}`,
  js: `// 게임 코어 JS
const canvas = document.getElementById('game-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;

// ── 게임 상태 ──
let gameState = 'idle'; // 'idle' | 'playing' | 'paused' | 'gameover'
let score = 0;
let level = 1;
let lives = 3;
let bestScore = parseInt(localStorage.getItem('game-best') || '0');
let lastTime = 0;
let animFrameId = 0;

// ── 입력 처리 ──
const keysDown = {};
document.addEventListener('keydown', e => {
  keysDown[e.key] = true;
  if(e.key === 'p' || e.key === 'P' || e.key === 'Escape') togglePause();
  e.preventDefault && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key) && e.preventDefault();
});
document.addEventListener('keyup', e => { keysDown[e.key] = false; });

// ── 플레이어 ──
const player = { x: 200, y: 500, w: 40, h: 40, speed: 5, color: '#00f5ff' };

// ── 적/장애물 ──
const enemies = [];
function spawnEnemy() {
  enemies.push({ x: Math.random() * (canvas.width - 40), y: -40, w: 36, h: 36, speed: 2 + level * 0.5, color: '#ef4444' });
}

// ── 충돌 감지 ──
function rectsCollide(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// ── HUD 업데이트 ──
function updateHUD() {
  const scoreEl = document.getElementById('score-display');
  const levelEl = document.getElementById('level-display');
  const livesEl = document.getElementById('lives-display');
  const bestEl  = document.getElementById('best-display');
  if(scoreEl) scoreEl.textContent = String(score);
  if(levelEl) levelEl.textContent = String(level);
  if(livesEl) livesEl.textContent = String(lives);
  if(bestEl)  bestEl.textContent  = String(bestScore);
}

// ── 렌더링 ──
function render() {
  if(!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 배경 그리드
  ctx.strokeStyle = 'rgba(0,245,255,0.05)';
  ctx.lineWidth = 1;
  for(let x = 0; x < canvas.width; x += 40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); ctx.stroke(); }
  for(let y = 0; y < canvas.height; y += 40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); ctx.stroke(); }

  // 플레이어
  ctx.fillStyle = player.color;
  ctx.shadowColor = player.color;
  ctx.shadowBlur = 12;
  ctx.fillRect(player.x, player.y, player.w, player.h);
  ctx.shadowBlur = 0;

  // 적
  for(const e of enemies) {
    ctx.fillStyle = e.color;
    ctx.shadowColor = e.color;
    ctx.shadowBlur = 8;
    ctx.fillRect(e.x, e.y, e.w, e.h);
    ctx.shadowBlur = 0;
  }
}

// ── 게임 루프 ──
let spawnTimer = 0;
function gameLoop(timestamp) {
  if(gameState !== 'playing') return;
  const dt = Math.min(timestamp - lastTime, 50);
  lastTime = timestamp;

  // 플레이어 이동
  if(keysDown['ArrowLeft']  && player.x > 0)                         player.x -= player.speed;
  if(keysDown['ArrowRight'] && player.x + player.w < canvas.width)   player.x += player.speed;
  if(keysDown['ArrowUp']    && player.y > 0)                         player.y -= player.speed;
  if(keysDown['ArrowDown']  && player.y + player.h < canvas.height)  player.y += player.speed;

  // 적 스폰
  spawnTimer += dt;
  if(spawnTimer > Math.max(400, 1200 - level * 80)) { spawnEnemy(); spawnTimer = 0; }

  // 적 이동 + 충돌
  for(let i = enemies.length - 1; i >= 0; i--) {
    enemies[i].y += enemies[i].speed;
    if(enemies[i].y > canvas.height) { enemies.splice(i, 1); score += 10; continue; }
    if(rectsCollide(player, enemies[i])) {
      enemies.splice(i, 1);
      lives--;
      if(lives <= 0) { endGame(); return; }
    }
  }

  // 레벨업
  if(score > level * 200) level++;

  render();
  updateHUD();
  animFrameId = requestAnimationFrame(gameLoop);
}

// ── 게임 제어 ──
function startGame() {
  score = 0; level = 1; lives = 3; enemies.length = 0; spawnTimer = 0;
  player.x = canvas.width / 2 - player.w / 2;
  player.y = canvas.height - player.h - 20;
  gameState = 'playing';
  hideAllOverlays();
  lastTime = performance.now();
  animFrameId = requestAnimationFrame(gameLoop);
}
function restartGame() { startGame(); }
function togglePause() {
  if(gameState === 'playing') pauseGame();
  else if(gameState === 'paused') resumeGame();
}
function pauseGame() {
  gameState = 'paused';
  cancelAnimationFrame(animFrameId);
  const el = document.getElementById('pause-screen');
  if(el) el.classList.remove('hidden');
}
function resumeGame() {
  gameState = 'playing';
  const el = document.getElementById('pause-screen');
  if(el) el.classList.add('hidden');
  lastTime = performance.now();
  animFrameId = requestAnimationFrame(gameLoop);
}
function endGame() {
  gameState = 'gameover';
  cancelAnimationFrame(animFrameId);
  if(score > bestScore) { bestScore = score; localStorage.setItem('game-best', String(bestScore)); }
  const screen = document.getElementById('gameover-screen');
  const text   = document.getElementById('final-score-text');
  if(screen) screen.classList.remove('hidden');
  if(text)   text.textContent = '최종 점수: ' + score;
  updateHUD();
}
function hideAllOverlays() {
  ['start-screen','pause-screen','gameover-screen'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.classList.add('hidden');
  });
}

// 초기화
document.addEventListener('DOMContentLoaded', () => {
  updateHUD();
  if(ctx && canvas) render(); // 초기 빈 화면 렌더
});`,
};

// ── Registry & Lookup ─────────────────────────────────────────────────────────

const BOOSTERS: BoosterTemplate[] = [
  ECOMMERCE_BOOSTER,
  GAME_BOOSTER,
];

/**
 * Returns a booster template if the user prompt matches a known app type.
 * Returns null if no match — the AI then generates from scratch.
 */
export function getBoosterTemplate(prompt: string): BoosterTemplate | null {
  return BOOSTERS.find(b => b.keywords.test(prompt)) ?? null;
}
