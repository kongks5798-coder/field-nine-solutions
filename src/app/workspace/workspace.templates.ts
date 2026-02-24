import type { FilesMap } from "./workspace.constants";

// ── Template Matching ───────────────────────────────────────────────────────
interface GameTemplate {
  keywords: string[];
  name: string;
  files: FilesMap;
}

/**
 * 사용자 프롬프트에서 게임/앱 키워드를 감지하여 매칭되는 템플릿 반환
 * AI 실패 시 fallback으로 사용되어 "무조건" 동작하는 코드 제공
 */
export function matchTemplate(prompt: string): FilesMap | null {
  const lower = prompt.toLowerCase();
  for (const tpl of TEMPLATES) {
    if (tpl.keywords.some(k => lower.includes(k))) return tpl.files;
  }
  return null;
}

// ── Tetris Template ─────────────────────────────────────────────────────────
const TETRIS_HTML = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>🧱 테트리스 — Pure JS</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="game-wrapper">
    <div class="game-header">
      <div class="game-brand">🧱 TETRIS JS</div>
      <div class="game-hud">
        <div class="hud-item"><span class="hud-label">SCORE</span><span class="hud-value" id="scoreDisplay">0</span></div>
        <div class="hud-item"><span class="hud-label">LEVEL</span><span class="hud-value" id="levelDisplay">1</span></div>
        <div class="hud-item"><span class="hud-label">LINES</span><span class="hud-value" id="linesDisplay">0</span></div>
        <div class="hud-item"><span class="hud-label">BEST</span><span class="hud-value" id="highScoreDisplay">0</span></div>
      </div>
    </div>
    <div class="tetris-layout">
      <div class="side-panel left-panel">
        <div class="panel-card"><div class="panel-label">HOLD</div><canvas id="holdCanvas" width="120" height="120"></canvas></div>
        <div class="panel-card controls-card"><div class="panel-label">CONTROLS</div>
          <div class="ctrl-list">
            <div class="ctrl-item"><kbd>←</kbd><kbd>→</kbd> <span>이동</span></div>
            <div class="ctrl-item"><kbd>↑</kbd> <span>회전</span></div>
            <div class="ctrl-item"><kbd>↓</kbd> <span>소프트 드롭</span></div>
            <div class="ctrl-item"><kbd>Space</kbd> <span>하드 드롭</span></div>
            <div class="ctrl-item"><kbd>C</kbd> <span>홀드</span></div>
            <div class="ctrl-item"><kbd>P</kbd> <span>일시정지</span></div>
          </div>
        </div>
      </div>
      <div class="canvas-container">
        <canvas id="gameCanvas" width="300" height="600"></canvas>
        <div class="game-overlay" id="startScreen">
          <div class="overlay-content">
            <div class="tetris-logo">🧱</div>
            <h1 class="overlay-title">TETRIS</h1>
            <p class="overlay-sub">순수 JavaScript 테트리스</p>
            <button class="btn-game-start" id="startBtn">▶ 게임 시작</button>
          </div>
        </div>
        <div class="game-overlay hidden" id="pauseScreen">
          <div class="overlay-content">
            <h1 class="overlay-title">⏸️ PAUSED</h1>
            <button class="btn-game-start" id="resumeBtn">▶ 계속하기</button>
          </div>
        </div>
        <div class="game-overlay hidden" id="gameOverScreen">
          <div class="overlay-content">
            <h1 class="overlay-title">💀 GAME OVER</h1>
            <p class="overlay-sub" id="finalScore">최종 점수: 0</p>
            <button class="btn-game-start" id="restartBtn">🔄 다시 시작</button>
          </div>
        </div>
      </div>
      <div class="side-panel right-panel">
        <div class="panel-card"><div class="panel-label">NEXT</div><canvas id="nextCanvas" width="120" height="360"></canvas></div>
        <button class="btn-pause-side" id="pauseBtn">⏸ PAUSE</button>
      </div>
    </div>
    <div class="mobile-controls">
      <div class="mobile-row">
        <button class="mobile-btn" id="mLeft">◀</button>
        <button class="mobile-btn" id="mRotate">🔄</button>
        <button class="mobile-btn" id="mRight">▶</button>
      </div>
      <div class="mobile-row">
        <button class="mobile-btn mobile-btn-sm" id="mHold">📦 HOLD</button>
        <button class="mobile-btn mobile-btn-wide" id="mDrop">▼▼ DROP</button>
        <button class="mobile-btn mobile-btn-sm" id="mDown">▼ DOWN</button>
      </div>
    </div>
  </div>
  <script src="script.js"></script>
</body>
</html>`;

const TETRIS_CSS = `@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
:root { --neon:#00f5ff; --panel:rgba(0,20,40,.9); --dim:#004455; }
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;background:#050510;font-family:'Press Start 2P',monospace;overflow-x:hidden}
.game-wrapper{display:flex;flex-direction:column;align-items:center;min-height:100vh;padding:12px 16px 24px;background:radial-gradient(ellipse at 50% 0%,#0a0a2e,#050510 70%)}
.game-header{width:100%;max-width:700px;display:flex;align-items:center;justify-content:space-between;padding:10px 20px;background:var(--panel);border:2px solid var(--neon);border-radius:8px;margin-bottom:14px;box-shadow:0 0 20px rgba(0,245,255,.25)}
.game-brand{font-size:13px;color:var(--neon);text-shadow:0 0 10px var(--neon)}
.game-hud{display:flex;gap:20px}.hud-item{display:flex;flex-direction:column;align-items:center;gap:3px}
.hud-label{font-size:7px;color:#556;letter-spacing:1px}.hud-value{font-size:12px;color:#fff;text-shadow:0 0 8px var(--neon);min-width:50px;text-align:center}
.tetris-layout{display:flex;gap:12px;align-items:flex-start;justify-content:center;width:100%;max-width:700px}
.side-panel{display:flex;flex-direction:column;gap:10px;width:140px;flex-shrink:0}
.panel-card{background:var(--panel);border:2px solid var(--dim);border-radius:8px;padding:10px;display:flex;flex-direction:column;align-items:center;gap:8px}
.panel-label{font-size:8px;color:var(--neon);letter-spacing:2px;text-shadow:0 0 6px var(--neon)}
#holdCanvas,#nextCanvas{image-rendering:pixelated;border-radius:4px}
.controls-card{align-items:flex-start}.ctrl-list{display:flex;flex-direction:column;gap:6px;width:100%}
.ctrl-item{display:flex;align-items:center;gap:6px;font-size:7px;color:#888}.ctrl-item span{color:#aaa}
kbd{background:#1a1a2e;border:1px solid #444;border-radius:3px;padding:2px 5px;font-size:7px;font-family:'Press Start 2P',monospace;color:#ccc}
.btn-pause-side{padding:10px;background:rgba(0,245,255,.1);border:2px solid var(--dim);border-radius:6px;color:var(--neon);font-family:'Press Start 2P',monospace;font-size:9px;cursor:pointer;width:100%}
.btn-pause-side:hover{background:rgba(0,245,255,.2);border-color:var(--neon);box-shadow:0 0 10px rgba(0,245,255,.3)}
.canvas-container{position:relative;flex-shrink:0;border:3px solid var(--neon);border-radius:6px;overflow:hidden;box-shadow:0 0 30px rgba(0,245,255,.4),inset 0 0 30px rgba(0,0,0,.5)}
#gameCanvas{display:block;image-rendering:pixelated;background:#050510}
.game-overlay{position:absolute;inset:0;background:rgba(0,0,10,.92);display:flex;align-items:center;justify-content:center;z-index:100;backdrop-filter:blur(6px)}
.game-overlay.hidden{display:none}.overlay-content{text-align:center;padding:30px 20px}
.tetris-logo{font-size:52px;margin-bottom:14px;animation:floatBrick 1s ease-in-out infinite alternate}
@keyframes floatBrick{from{transform:translateY(0) rotate(-5deg)}to{transform:translateY(-10px) rotate(5deg)}}
.overlay-title{font-size:22px;color:var(--neon);text-shadow:0 0 20px var(--neon),3px 3px 0 #003344;margin-bottom:12px;letter-spacing:3px}
.overlay-sub{font-size:9px;color:#aaa;margin-bottom:10px;line-height:2}
.btn-game-start{margin-top:16px;padding:12px 24px;background:linear-gradient(135deg,#00f5ff22,#00f5ff44);border:2px solid var(--neon);border-radius:6px;color:var(--neon);font-family:'Press Start 2P',monospace;font-size:11px;cursor:pointer;text-shadow:0 0 8px var(--neon);box-shadow:0 0 15px rgba(0,245,255,.3);display:block;width:100%}
.btn-game-start:hover{background:linear-gradient(135deg,#00f5ff44,#00f5ff66);box-shadow:0 0 25px rgba(0,245,255,.6);transform:translateY(-2px)}
.mobile-controls{width:100%;max-width:700px;margin-top:14px;display:flex;flex-direction:column;gap:10px;align-items:center}
.mobile-row{display:flex;gap:10px;justify-content:center;width:100%}
.mobile-btn{height:56px;min-width:70px;flex:1;max-width:100px;background:rgba(0,245,255,.08);border:2px solid rgba(0,245,255,.3);border-radius:10px;color:var(--neon);font-family:'Press Start 2P',monospace;font-size:10px;cursor:pointer;user-select:none;-webkit-tap-highlight-color:transparent}
.mobile-btn-sm{max-width:90px;font-size:8px}.mobile-btn-wide{max-width:140px;background:rgba(0,245,255,.14);border-color:var(--neon);font-size:9px}
.mobile-btn:active{background:rgba(0,245,255,.25);transform:scale(.94);box-shadow:0 0 12px rgba(0,245,255,.4)}
@media(max-width:660px){.tetris-layout{gap:8px}.side-panel{width:110px}.game-brand{font-size:10px}.hud-value{font-size:10px;min-width:44px}}
@media(max-width:480px){.left-panel .controls-card{display:none}.side-panel{width:90px}.panel-card{padding:7px}.game-header{flex-direction:column;gap:8px}.game-hud{flex-wrap:wrap;gap:10px;justify-content:center}}`;

const TETRIS_JS = `// NOTE: buildPreview() wraps this in DOMContentLoaded — do NOT add another wrapper
  var canvas = document.getElementById('gameCanvas');
  var ctx = canvas.getContext('2d');
  var holdCvs = document.getElementById('holdCanvas');
  var holdCtx = holdCvs.getContext('2d');
  var nextCvs = document.getElementById('nextCanvas');
  var nextCtx = nextCvs.getContext('2d');

  const COLS = 10, ROWS = 20, SZ = 30;
  const COLORS = ['#00f5ff','#ff006e','#39ff14','#f1c40f','#e74c3c','#9b59b6','#ff8c00'];
  const SHAPES = [
    [[1,1,1,1]],
    [[1,1],[1,1]],
    [[0,1,0],[1,1,1]],
    [[1,0,0],[1,1,1]],
    [[0,0,1],[1,1,1]],
    [[1,1,0],[0,1,1]],
    [[0,1,1],[1,1,0]]
  ];

  let board = Array.from({length:ROWS}, ()=> Array(COLS).fill(0));
  let score=0, level=1, lines=0, highScore=parseInt(localStorage.getItem('tetris_high')||'0');
  let piece, pieceX, pieceY, pieceColor, ghostY;
  let nextPieces=[], holdPiece=null, canHold=true;
  let gameOver=false, paused=false, started=false;
  let dropInterval=800, lastDrop=0, animId=null;

  const $score = document.getElementById('scoreDisplay');
  const $level = document.getElementById('levelDisplay');
  const $lines = document.getElementById('linesDisplay');
  const $high  = document.getElementById('highScoreDisplay');
  const $start = document.getElementById('startScreen');
  const $pause = document.getElementById('pauseScreen');
  const $over  = document.getElementById('gameOverScreen');
  const $final = document.getElementById('finalScore');

  if($high) $high.textContent = highScore;

  function randomPiece() {
    const i = Math.floor(Math.random()*SHAPES.length);
    return { shape: SHAPES[i].map(r=>[...r]), color: COLORS[i], idx: i };
  }
  function fillBag() { while(nextPieces.length<4) nextPieces.push(randomPiece()); }

  function spawn() {
    fillBag();
    const p = nextPieces.shift();
    piece = p.shape; pieceColor = p.color;
    pieceX = Math.floor((COLS - piece[0].length)/2); pieceY = 0;
    canHold = true;
    fillBag();
    updateGhost();
    drawNext();
    if(collides(piece, pieceX, pieceY)) { endGame(); }
  }

  function collides(sh, px, py) {
    for(let r=0;r<sh.length;r++) for(let c=0;c<sh[r].length;c++) {
      if(!sh[r][c]) continue;
      const nx=px+c, ny=py+r;
      if(nx<0||nx>=COLS||ny>=ROWS) return true;
      if(ny>=0 && board[ny][nx]) return true;
    }
    return false;
  }

  function lock() {
    for(let r=0;r<piece.length;r++) for(let c=0;c<piece[r].length;c++) {
      if(!piece[r][c]) continue;
      const ny=pieceY+r;
      if(ny<0) { endGame(); return; }
      board[ny][pieceX+c] = pieceColor;
    }
    clearLines();
    spawn();
  }

  function clearLines() {
    let cleared=0;
    for(let r=ROWS-1;r>=0;r--) {
      if(board[r].every(c=>c)) { board.splice(r,1); board.unshift(Array(COLS).fill(0)); cleared++; r++; }
    }
    if(cleared>0) {
      const pts = [0,100,300,500,800][cleared]*level;
      score+=pts; lines+=cleared;
      level = Math.floor(lines/10)+1;
      dropInterval = Math.max(100, 800 - (level-1)*70);
      if($score) $score.textContent=score;
      if($level) $level.textContent=level;
      if($lines) $lines.textContent=lines;
      if(score>highScore) { highScore=score; localStorage.setItem('tetris_high',String(highScore)); if($high) $high.textContent=highScore; }
    }
  }

  function rotate(sh) {
    const rows=sh.length, cols=sh[0].length;
    const res=Array.from({length:cols},()=>Array(rows).fill(0));
    for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) res[c][rows-1-r]=sh[r][c];
    return res;
  }

  function updateGhost() {
    ghostY=pieceY;
    while(!collides(piece,pieceX,ghostY+1)) ghostY++;
  }

  function draw() {
    ctx.fillStyle='#050510'; ctx.fillRect(0,0,canvas.width,canvas.height);
    // Grid
    ctx.strokeStyle='#111'; ctx.lineWidth=0.5;
    for(let r=0;r<=ROWS;r++){ctx.beginPath();ctx.moveTo(0,r*SZ);ctx.lineTo(COLS*SZ,r*SZ);ctx.stroke();}
    for(let c=0;c<=COLS;c++){ctx.beginPath();ctx.moveTo(c*SZ,0);ctx.lineTo(c*SZ,ROWS*SZ);ctx.stroke();}
    // Board
    for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) {
      if(board[r][c]) { drawBlock(ctx,c*SZ,r*SZ,SZ,board[r][c]); }
    }
    if(!piece) return;
    // Ghost
    for(let r=0;r<piece.length;r++) for(let c=0;c<piece[r].length;c++) {
      if(piece[r][c]) { ctx.fillStyle='rgba(255,255,255,0.08)'; ctx.fillRect((pieceX+c)*SZ,(ghostY+r)*SZ,SZ,SZ); ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.strokeRect((pieceX+c)*SZ,(ghostY+r)*SZ,SZ,SZ); }
    }
    // Piece
    for(let r=0;r<piece.length;r++) for(let c=0;c<piece[r].length;c++) {
      if(piece[r][c]) drawBlock(ctx,(pieceX+c)*SZ,(pieceY+r)*SZ,SZ,pieceColor);
    }
  }

  function drawBlock(cx,x,y,sz,color) {
    cx.fillStyle=color; cx.fillRect(x+1,y+1,sz-2,sz-2);
    cx.fillStyle='rgba(255,255,255,0.2)'; cx.fillRect(x+1,y+1,sz-2,4);
    cx.fillStyle='rgba(0,0,0,0.15)'; cx.fillRect(x+1,y+sz-5,sz-2,4);
  }

  function drawMini(cx,cvs,sh,color) {
    cx.fillStyle='#0a0a1a'; cx.fillRect(0,0,cvs.width,cvs.height);
    if(!sh) return;
    const bsz=25, offX=(cvs.width-sh[0].length*bsz)/2, offY=(cvs.height-sh.length*bsz)/2;
    for(let r=0;r<sh.length;r++) for(let c=0;c<sh[r].length;c++) {
      if(sh[r][c]) drawBlock(cx,offX+c*bsz,offY+r*bsz,bsz,color);
    }
  }

  function drawNext() {
    nextCtx.fillStyle='#0a0a1a'; nextCtx.fillRect(0,0,nextCvs.width,nextCvs.height);
    for(let i=0;i<Math.min(3,nextPieces.length);i++) {
      const p=nextPieces[i], bsz=20;
      const offX=(nextCvs.width-p.shape[0].length*bsz)/2;
      const offY=20+i*110;
      for(let r=0;r<p.shape.length;r++) for(let c=0;c<p.shape[r].length;c++) {
        if(p.shape[r][c]) drawBlock(nextCtx,offX+c*bsz,offY+r*bsz,bsz,p.color);
      }
    }
  }

  function drawHold() { drawMini(holdCtx,holdCvs,holdPiece?holdPiece.shape:null,holdPiece?holdPiece.color:'#fff'); }

  function doHold() {
    if(!canHold) return;
    canHold=false;
    const cur = { shape: SHAPES[COLORS.indexOf(pieceColor)].map(r=>[...r]), color:pieceColor, idx:COLORS.indexOf(pieceColor) };
    if(holdPiece) {
      const h=holdPiece; holdPiece=cur;
      piece=h.shape; pieceColor=h.color;
      pieceX=Math.floor((COLS-piece[0].length)/2); pieceY=0;
    } else { holdPiece=cur; spawn(); }
    updateGhost(); drawHold();
  }

  function hardDrop() {
    while(!collides(piece,pieceX,pieceY+1)) { pieceY++; score+=2; }
    if($score) $score.textContent=score;
    lock();
  }

  function moveLeft()  { if(!collides(piece,pieceX-1,pieceY)){pieceX--;updateGhost();} }
  function moveRight() { if(!collides(piece,pieceX+1,pieceY)){pieceX++;updateGhost();} }
  function moveDown()  { if(!collides(piece,pieceX,pieceY+1)){pieceY++;score+=1;if($score)$score.textContent=score;}else lock(); }
  function rotatePiece() {
    const r=rotate(piece);
    if(!collides(r,pieceX,pieceY)){piece=r;updateGhost();return;}
    if(!collides(r,pieceX-1,pieceY)){pieceX--;piece=r;updateGhost();return;}
    if(!collides(r,pieceX+1,pieceY)){pieceX++;piece=r;updateGhost();return;}
  }

  function endGame() {
    gameOver=true;
    if(animId) cancelAnimationFrame(animId);
    if($final) $final.textContent='최종 점수: '+score;
    if($over) $over.classList.remove('hidden');
  }

  function togglePause() {
    paused=!paused;
    if($pause) $pause.classList.toggle('hidden',!paused);
    if(!paused) { lastDrop=performance.now(); loop(); }
  }

  function reset() {
    board=Array.from({length:ROWS},()=>Array(COLS).fill(0));
    score=0;level=1;lines=0;gameOver=false;paused=false;
    nextPieces=[];holdPiece=null;canHold=true;
    dropInterval=800;
    if($score)$score.textContent='0';if($level)$level.textContent='1';if($lines)$lines.textContent='0';
    drawHold();
    spawn();
    lastDrop=performance.now();
    loop();
  }

  function loop(now=performance.now()) {
    if(gameOver||paused) return;
    if(now-lastDrop>dropInterval) { moveDown(); lastDrop=now; }
    draw();
    animId=requestAnimationFrame(loop);
  }

  function startGame() {
    started=true;
    if($start) $start.classList.add('hidden');
    if($over) $over.classList.add('hidden');
    reset();
  }

  // Keyboard
  document.addEventListener('keydown', function(e) {
    if(!started||gameOver) return;
    if(e.key==='p'||e.key==='P'||e.key==='Escape') { togglePause(); return; }
    if(paused) return;
    switch(e.key) {
      case 'ArrowLeft':  moveLeft(); break;
      case 'ArrowRight': moveRight(); break;
      case 'ArrowDown':  moveDown(); break;
      case 'ArrowUp':    rotatePiece(); break;
      case ' ':          hardDrop(); e.preventDefault(); break;
      case 'c': case 'C': doHold(); break;
    }
    draw();
  });

  // Buttons
  const startBtn = document.getElementById('startBtn');
  const resumeBtn = document.getElementById('resumeBtn');
  const restartBtn = document.getElementById('restartBtn');
  const pauseBtn = document.getElementById('pauseBtn');

  if(startBtn)   startBtn.addEventListener('click', startGame);
  if(resumeBtn)  resumeBtn.addEventListener('click', togglePause);
  if(restartBtn) restartBtn.addEventListener('click', startGame);
  if(pauseBtn)   pauseBtn.addEventListener('click', togglePause);

  // Mobile
  const mLeft   = document.getElementById('mLeft');
  const mRight  = document.getElementById('mRight');
  const mRotate = document.getElementById('mRotate');
  const mDown   = document.getElementById('mDown');
  const mDrop   = document.getElementById('mDrop');
  const mHold   = document.getElementById('mHold');

  if(mLeft)   mLeft.addEventListener('click', function(){ if(!paused&&started&&!gameOver){moveLeft();draw();} });
  if(mRight)  mRight.addEventListener('click', function(){ if(!paused&&started&&!gameOver){moveRight();draw();} });
  if(mRotate) mRotate.addEventListener('click', function(){ if(!paused&&started&&!gameOver){rotatePiece();draw();} });
  if(mDown)   mDown.addEventListener('click', function(){ if(!paused&&started&&!gameOver){moveDown();draw();} });
  if(mDrop)   mDrop.addEventListener('click', function(){ if(!paused&&started&&!gameOver){hardDrop();draw();} });
  if(mHold)   mHold.addEventListener('click', function(){ if(!paused&&started&&!gameOver) doHold(); });

  // Init
  draw();
  drawHold();
`;

// ── Template Registry ───────────────────────────────────────────────────────
const TEMPLATES: GameTemplate[] = [
  {
    keywords: ["테트리스", "tetris", "블록 게임", "블록게임"],
    name: "테트리스",
    files: {
      "index.html": { name: "index.html", language: "html", content: TETRIS_HTML },
      "style.css":  { name: "style.css",  language: "css",  content: TETRIS_CSS },
      "script.js":  { name: "script.js",  language: "javascript", content: TETRIS_JS },
    },
  },
];
