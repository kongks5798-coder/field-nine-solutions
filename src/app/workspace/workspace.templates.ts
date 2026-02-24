import type { FilesMap } from "./workspace.constants";

// ── Types ──────────────────────────────────────────────────────────────────
export interface TemplateInfo {
  keywords: string[];
  name: string;
  icon: string;
  description: string;
  category: "game" | "app" | "tool";
  files: FilesMap;
}

export function matchTemplate(prompt: string): FilesMap | null {
  const lower = prompt.toLowerCase();
  for (const tpl of TEMPLATES) {
    if (tpl.keywords.some(k => lower.includes(k))) return tpl.files;
  }
  return null;
}

export function getTemplateList(): Omit<TemplateInfo, "files">[] {
  return TEMPLATES.map(({ files: _f, ...rest }) => rest);
}

export function applyTemplateByName(name: string): FilesMap | null {
  const tpl = TEMPLATES.find(t => t.name === name);
  return tpl ? tpl.files : null;
}

// ═══════════════════════════════════════════════════════════════════════════
// ██  TETRIS  ██
// ═══════════════════════════════════════════════════════════════════════════
const TETRIS_HTML = `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>🧱 테트리스</title><link rel="stylesheet" href="style.css"></head>
<body>
<div class="game-wrapper">
  <div class="game-header"><div class="game-brand">🧱 TETRIS JS</div>
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
          <div class="ctrl-item"><kbd>←→</kbd><span>이동</span></div><div class="ctrl-item"><kbd>↑</kbd><span>회전</span></div>
          <div class="ctrl-item"><kbd>↓</kbd><span>소프트</span></div><div class="ctrl-item"><kbd>Space</kbd><span>하드</span></div>
          <div class="ctrl-item"><kbd>C</kbd><span>홀드</span></div><div class="ctrl-item"><kbd>P</kbd><span>정지</span></div>
        </div>
      </div>
    </div>
    <div class="canvas-container">
      <canvas id="gameCanvas" width="300" height="600"></canvas>
      <div class="game-overlay" id="startScreen"><div class="overlay-content"><div style="font-size:48px;margin-bottom:12px">🧱</div><h1 class="overlay-title">TETRIS</h1><p class="overlay-sub">순수 JavaScript 테트리스</p><button class="btn-game-start" id="startBtn">▶ 게임 시작</button></div></div>
      <div class="game-overlay hidden" id="pauseScreen"><div class="overlay-content"><h1 class="overlay-title">⏸️ PAUSED</h1><button class="btn-game-start" id="resumeBtn">▶ 계속하기</button></div></div>
      <div class="game-overlay hidden" id="gameOverScreen"><div class="overlay-content"><h1 class="overlay-title">💀 GAME OVER</h1><p class="overlay-sub" id="finalScore">최종 점수: 0</p><button class="btn-game-start" id="restartBtn">🔄 다시 시작</button></div></div>
    </div>
    <div class="side-panel right-panel">
      <div class="panel-card"><div class="panel-label">NEXT</div><canvas id="nextCanvas" width="120" height="360"></canvas></div>
      <button class="btn-pause-side" id="pauseBtn">⏸ PAUSE</button>
    </div>
  </div>
  <div class="mobile-controls">
    <div class="mobile-row"><button class="mobile-btn" id="mLeft">◀</button><button class="mobile-btn" id="mRotate">🔄</button><button class="mobile-btn" id="mRight">▶</button></div>
    <div class="mobile-row"><button class="mobile-btn mobile-btn-sm" id="mHold">📦 HOLD</button><button class="mobile-btn mobile-btn-wide" id="mDrop">▼▼ DROP</button><button class="mobile-btn mobile-btn-sm" id="mDown">▼ DOWN</button></div>
  </div>
</div>
<script src="script.js"></script></body></html>`;

const TETRIS_CSS = `:root{--neon:#00f5ff;--panel:rgba(0,20,40,.9);--dim:#004455}*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%;background:#050510;font-family:'Courier New',Consolas,monospace;overflow-x:hidden}.game-wrapper{display:flex;flex-direction:column;align-items:center;min-height:100vh;padding:12px 16px 24px;background:radial-gradient(ellipse at 50% 0%,#0a0a2e,#050510 70%)}.game-header{width:100%;max-width:700px;display:flex;align-items:center;justify-content:space-between;padding:10px 20px;background:var(--panel);border:2px solid var(--neon);border-radius:8px;margin-bottom:14px;box-shadow:0 0 20px rgba(0,245,255,.25)}.game-brand{font-size:13px;color:var(--neon);text-shadow:0 0 10px var(--neon)}.game-hud{display:flex;gap:20px}.hud-item{display:flex;flex-direction:column;align-items:center;gap:3px}.hud-label{font-size:7px;color:#556;letter-spacing:1px}.hud-value{font-size:12px;color:#fff;text-shadow:0 0 8px var(--neon);min-width:50px;text-align:center}.tetris-layout{display:flex;gap:12px;align-items:flex-start;justify-content:center;width:100%;max-width:700px}.side-panel{display:flex;flex-direction:column;gap:10px;width:140px;flex-shrink:0}.panel-card{background:var(--panel);border:2px solid var(--dim);border-radius:8px;padding:10px;display:flex;flex-direction:column;align-items:center;gap:8px}.panel-label{font-size:8px;color:var(--neon);letter-spacing:2px;text-shadow:0 0 6px var(--neon)}#holdCanvas,#nextCanvas{image-rendering:pixelated;border-radius:4px}.controls-card{align-items:flex-start}.ctrl-list{display:flex;flex-direction:column;gap:6px;width:100%}.ctrl-item{display:flex;align-items:center;gap:6px;font-size:7px;color:#888}.ctrl-item span{color:#aaa}kbd{background:#1a1a2e;border:1px solid #444;border-radius:3px;padding:2px 5px;font-size:7px;font-family:inherit;color:#ccc}.btn-pause-side{padding:10px;background:rgba(0,245,255,.1);border:2px solid var(--dim);border-radius:6px;color:var(--neon);font-family:inherit;font-size:9px;cursor:pointer;width:100%}.btn-pause-side:hover{background:rgba(0,245,255,.2);border-color:var(--neon)}.canvas-container{position:relative;flex-shrink:0;border:3px solid var(--neon);border-radius:6px;overflow:hidden;box-shadow:0 0 30px rgba(0,245,255,.4),inset 0 0 30px rgba(0,0,0,.5)}#gameCanvas{display:block;image-rendering:pixelated;background:#050510}.game-overlay{position:absolute;inset:0;background:rgba(0,0,10,.92);display:flex;align-items:center;justify-content:center;z-index:100;backdrop-filter:blur(6px)}.game-overlay.hidden{display:none}.overlay-content{text-align:center;padding:30px 20px}.overlay-title{font-size:22px;color:var(--neon);text-shadow:0 0 20px var(--neon),3px 3px 0 #003344;margin-bottom:12px;letter-spacing:3px}.overlay-sub{font-size:9px;color:#aaa;margin-bottom:10px;line-height:2}.btn-game-start{margin-top:16px;padding:12px 24px;background:linear-gradient(135deg,#00f5ff22,#00f5ff44);border:2px solid var(--neon);border-radius:6px;color:var(--neon);font-family:inherit;font-size:11px;cursor:pointer;text-shadow:0 0 8px var(--neon);box-shadow:0 0 15px rgba(0,245,255,.3);display:block;width:100%}.btn-game-start:hover{background:linear-gradient(135deg,#00f5ff44,#00f5ff66);box-shadow:0 0 25px rgba(0,245,255,.6);transform:translateY(-2px)}.mobile-controls{width:100%;max-width:700px;margin-top:14px;display:flex;flex-direction:column;gap:10px;align-items:center}.mobile-row{display:flex;gap:10px;justify-content:center;width:100%}.mobile-btn{height:56px;min-width:70px;flex:1;max-width:100px;background:rgba(0,245,255,.08);border:2px solid rgba(0,245,255,.3);border-radius:10px;color:var(--neon);font-family:inherit;font-size:10px;cursor:pointer;user-select:none;-webkit-tap-highlight-color:transparent}.mobile-btn-sm{max-width:90px;font-size:8px}.mobile-btn-wide{max-width:140px;background:rgba(0,245,255,.14);border-color:var(--neon);font-size:9px}.mobile-btn:active{background:rgba(0,245,255,.25);transform:scale(.94);box-shadow:0 0 12px rgba(0,245,255,.4)}@media(max-width:660px){.tetris-layout{gap:8px}.side-panel{width:110px}.game-brand{font-size:10px}.hud-value{font-size:10px;min-width:44px}}@media(max-width:480px){.left-panel .controls-card{display:none}.side-panel{width:90px}.panel-card{padding:7px}.game-header{flex-direction:column;gap:8px}.game-hud{flex-wrap:wrap;gap:10px;justify-content:center}}`;

const TETRIS_JS = `// NOTE: buildPreview() wraps this in DOMContentLoaded — do NOT add another wrapper
  var canvas = document.getElementById('gameCanvas');
  var ctx = canvas.getContext('2d');
  var holdCvs = document.getElementById('holdCanvas');
  var holdCtx = holdCvs.getContext('2d');
  var nextCvs = document.getElementById('nextCanvas');
  var nextCtx = nextCvs.getContext('2d');
  const COLS = 10, ROWS = 20, SZ = 30;
  const COLORS = ['#00f5ff','#ff006e','#39ff14','#f1c40f','#e74c3c','#9b59b6','#ff8c00'];
  const SHAPES = [[[1,1,1,1]],[[1,1],[1,1]],[[0,1,0],[1,1,1]],[[1,0,0],[1,1,1]],[[0,0,1],[1,1,1]],[[1,1,0],[0,1,1]],[[0,1,1],[1,1,0]]];
  let board = Array.from({length:ROWS}, ()=> Array(COLS).fill(0));
  let score=0, level=1, lines=0, highScore=parseInt(localStorage.getItem('tetris_high')||'0');
  let piece, pieceX, pieceY, pieceColor, ghostY;
  let nextPieces=[], holdPiece=null, canHold=true;
  let gameOver=false, paused=false, started=false;
  let dropInterval=800, lastDrop=0, animId=null;
  const $score=document.getElementById('scoreDisplay'),$level=document.getElementById('levelDisplay'),$lines=document.getElementById('linesDisplay'),$high=document.getElementById('highScoreDisplay');
  const $start=document.getElementById('startScreen'),$pause=document.getElementById('pauseScreen'),$over=document.getElementById('gameOverScreen'),$final=document.getElementById('finalScore');
  if($high)$high.textContent=highScore;
  function randomPiece(){const i=Math.floor(Math.random()*SHAPES.length);return{shape:SHAPES[i].map(r=>[...r]),color:COLORS[i],idx:i}}
  function fillBag(){while(nextPieces.length<4)nextPieces.push(randomPiece())}
  function spawn(){fillBag();const p=nextPieces.shift();piece=p.shape;pieceColor=p.color;pieceX=Math.floor((COLS-piece[0].length)/2);pieceY=0;canHold=true;fillBag();updateGhost();drawNext();if(collides(piece,pieceX,pieceY))endGame()}
  function collides(sh,px,py){for(let r=0;r<sh.length;r++)for(let c=0;c<sh[r].length;c++){if(!sh[r][c])continue;const nx=px+c,ny=py+r;if(nx<0||nx>=COLS||ny>=ROWS)return true;if(ny>=0&&board[ny][nx])return true}return false}
  function lock(){for(let r=0;r<piece.length;r++)for(let c=0;c<piece[r].length;c++){if(!piece[r][c])continue;const ny=pieceY+r;if(ny<0){endGame();return}board[ny][pieceX+c]=pieceColor}clearLines();spawn()}
  function clearLines(){let cleared=0;for(let r=ROWS-1;r>=0;r--){if(board[r].every(c=>c)){board.splice(r,1);board.unshift(Array(COLS).fill(0));cleared++;r++}}if(cleared>0){const pts=[0,100,300,500,800][cleared]*level;score+=pts;lines+=cleared;level=Math.floor(lines/10)+1;dropInterval=Math.max(100,800-(level-1)*70);if($score)$score.textContent=score;if($level)$level.textContent=level;if($lines)$lines.textContent=lines;if(score>highScore){highScore=score;localStorage.setItem('tetris_high',String(highScore));if($high)$high.textContent=highScore}}}
  function rotate(sh){const rows=sh.length,cols=sh[0].length;const res=Array.from({length:cols},()=>Array(rows).fill(0));for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)res[c][rows-1-r]=sh[r][c];return res}
  function updateGhost(){ghostY=pieceY;while(!collides(piece,pieceX,ghostY+1))ghostY++}
  function draw(){ctx.fillStyle='#050510';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.strokeStyle='#111';ctx.lineWidth=0.5;for(let r=0;r<=ROWS;r++){ctx.beginPath();ctx.moveTo(0,r*SZ);ctx.lineTo(COLS*SZ,r*SZ);ctx.stroke()}for(let c=0;c<=COLS;c++){ctx.beginPath();ctx.moveTo(c*SZ,0);ctx.lineTo(c*SZ,ROWS*SZ);ctx.stroke()}for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){if(board[r][c])drawBlock(ctx,c*SZ,r*SZ,SZ,board[r][c])}if(!piece)return;for(let r=0;r<piece.length;r++)for(let c=0;c<piece[r].length;c++){if(piece[r][c]){ctx.fillStyle='rgba(255,255,255,0.08)';ctx.fillRect((pieceX+c)*SZ,(ghostY+r)*SZ,SZ,SZ);ctx.strokeStyle='rgba(255,255,255,0.15)';ctx.strokeRect((pieceX+c)*SZ,(ghostY+r)*SZ,SZ,SZ)}}for(let r=0;r<piece.length;r++)for(let c=0;c<piece[r].length;c++){if(piece[r][c])drawBlock(ctx,(pieceX+c)*SZ,(pieceY+r)*SZ,SZ,pieceColor)}}
  function drawBlock(cx,x,y,sz,color){cx.fillStyle=color;cx.fillRect(x+1,y+1,sz-2,sz-2);cx.fillStyle='rgba(255,255,255,0.2)';cx.fillRect(x+1,y+1,sz-2,4);cx.fillStyle='rgba(0,0,0,0.15)';cx.fillRect(x+1,y+sz-5,sz-2,4)}
  function drawMini(cx,cvs,sh,color){cx.fillStyle='#0a0a1a';cx.fillRect(0,0,cvs.width,cvs.height);if(!sh)return;const bsz=25,offX=(cvs.width-sh[0].length*bsz)/2,offY=(cvs.height-sh.length*bsz)/2;for(let r=0;r<sh.length;r++)for(let c=0;c<sh[r].length;c++){if(sh[r][c])drawBlock(cx,offX+c*bsz,offY+r*bsz,bsz,color)}}
  function drawNext(){nextCtx.fillStyle='#0a0a1a';nextCtx.fillRect(0,0,nextCvs.width,nextCvs.height);for(let i=0;i<Math.min(3,nextPieces.length);i++){const p=nextPieces[i],bsz=20;const offX=(nextCvs.width-p.shape[0].length*bsz)/2;const offY=20+i*110;for(let r=0;r<p.shape.length;r++)for(let c=0;c<p.shape[r].length;c++){if(p.shape[r][c])drawBlock(nextCtx,offX+c*bsz,offY+r*bsz,bsz,p.color)}}}
  function drawHold(){drawMini(holdCtx,holdCvs,holdPiece?holdPiece.shape:null,holdPiece?holdPiece.color:'#fff')}
  function doHold(){if(!canHold)return;canHold=false;const cur={shape:SHAPES[COLORS.indexOf(pieceColor)].map(r=>[...r]),color:pieceColor,idx:COLORS.indexOf(pieceColor)};if(holdPiece){const h=holdPiece;holdPiece=cur;piece=h.shape;pieceColor=h.color;pieceX=Math.floor((COLS-piece[0].length)/2);pieceY=0}else{holdPiece=cur;spawn()}updateGhost();drawHold()}
  function hardDrop(){while(!collides(piece,pieceX,pieceY+1)){pieceY++;score+=2}if($score)$score.textContent=score;lock()}
  function moveLeft(){if(!collides(piece,pieceX-1,pieceY)){pieceX--;updateGhost()}}
  function moveRight(){if(!collides(piece,pieceX+1,pieceY)){pieceX++;updateGhost()}}
  function moveDown(){if(!collides(piece,pieceX,pieceY+1)){pieceY++;score+=1;if($score)$score.textContent=score}else lock()}
  function rotatePiece(){const r=rotate(piece);if(!collides(r,pieceX,pieceY)){piece=r;updateGhost();return}if(!collides(r,pieceX-1,pieceY)){pieceX--;piece=r;updateGhost();return}if(!collides(r,pieceX+1,pieceY)){pieceX++;piece=r;updateGhost();return}}
  function endGame(){gameOver=true;if(animId)cancelAnimationFrame(animId);if($final)$final.textContent='최종 점수: '+score;if($over)$over.classList.remove('hidden')}
  function togglePause(){paused=!paused;if($pause)$pause.classList.toggle('hidden',!paused);if(!paused){lastDrop=performance.now();loop()}}
  function reset(){board=Array.from({length:ROWS},()=>Array(COLS).fill(0));score=0;level=1;lines=0;gameOver=false;paused=false;nextPieces=[];holdPiece=null;canHold=true;dropInterval=800;if($score)$score.textContent='0';if($level)$level.textContent='1';if($lines)$lines.textContent='0';drawHold();spawn();lastDrop=performance.now();loop()}
  function loop(now){now=now||performance.now();if(gameOver||paused)return;if(now-lastDrop>dropInterval){moveDown();lastDrop=now}draw();animId=requestAnimationFrame(loop)}
  function startGame(){started=true;if($start)$start.classList.add('hidden');if($over)$over.classList.add('hidden');reset()}
  document.addEventListener('keydown',function(e){if(!started||gameOver)return;if(e.key==='p'||e.key==='P'||e.key==='Escape'){togglePause();return}if(paused)return;switch(e.key){case'ArrowLeft':moveLeft();break;case'ArrowRight':moveRight();break;case'ArrowDown':moveDown();break;case'ArrowUp':rotatePiece();break;case' ':hardDrop();e.preventDefault();break;case'c':case'C':doHold();break}draw()});
  var startBtnEl=document.getElementById('startBtn'),resumeBtnEl=document.getElementById('resumeBtn'),restartBtnEl=document.getElementById('restartBtn'),pauseBtnEl=document.getElementById('pauseBtn');
  if(startBtnEl)startBtnEl.addEventListener('click',startGame);if(resumeBtnEl)resumeBtnEl.addEventListener('click',togglePause);if(restartBtnEl)restartBtnEl.addEventListener('click',startGame);if(pauseBtnEl)pauseBtnEl.addEventListener('click',togglePause);
  var mL=document.getElementById('mLeft'),mR=document.getElementById('mRight'),mRot=document.getElementById('mRotate'),mD=document.getElementById('mDown'),mDr=document.getElementById('mDrop'),mH=document.getElementById('mHold');
  if(mL)mL.addEventListener('click',function(){if(!paused&&started&&!gameOver){moveLeft();draw()}});if(mR)mR.addEventListener('click',function(){if(!paused&&started&&!gameOver){moveRight();draw()}});if(mRot)mRot.addEventListener('click',function(){if(!paused&&started&&!gameOver){rotatePiece();draw()}});if(mD)mD.addEventListener('click',function(){if(!paused&&started&&!gameOver){moveDown();draw()}});if(mDr)mDr.addEventListener('click',function(){if(!paused&&started&&!gameOver){hardDrop();draw()}});if(mH)mH.addEventListener('click',function(){if(!paused&&started&&!gameOver)doHold()});
  draw();drawHold();
`;

// ═══════════════════════════════════════════════════════════════════════════
// ██  SNAKE  ██
// ═══════════════════════════════════════════════════════════════════════════
const SNAKE_HTML = `<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>🐍 Snake</title><link rel="stylesheet" href="style.css"></head>
<body><div class="game-wrapper">
  <div class="game-header"><div class="game-brand">🐍 SNAKE</div><div class="game-hud"><div class="hud-item"><span class="hud-label">SCORE</span><span class="hud-value" id="scoreDisplay">0</span></div><div class="hud-item"><span class="hud-label">BEST</span><span class="hud-value" id="highScoreDisplay">0</span></div></div></div>
  <div class="canvas-container">
    <canvas id="gameCanvas" width="400" height="400"></canvas>
    <div class="game-overlay" id="startScreen"><div class="overlay-content"><div style="font-size:48px;margin-bottom:12px">🐍</div><h1 class="overlay-title">SNAKE</h1><p class="overlay-sub">화살표 키 또는 버튼으로 조작</p><button class="btn-start" id="startBtn">▶ 게임 시작</button></div></div>
    <div class="game-overlay hidden" id="gameOverScreen"><div class="overlay-content"><h1 class="overlay-title">💀 GAME OVER</h1><p class="overlay-sub">점수: <span id="finalScore">0</span></p><p class="overlay-sub" style="font-size:8px;opacity:.6">클릭하여 재시작</p></div></div>
  </div>
  <div class="mobile-controls"><div class="mobile-row"><button class="mobile-btn" id="mUp">▲</button></div><div class="mobile-row"><button class="mobile-btn" id="mLeft">◀</button><button class="mobile-btn" id="mDown">▼</button><button class="mobile-btn" id="mRight">▶</button></div></div>
</div><script src="script.js"></script></body></html>`;

const SNAKE_CSS = `:root{--neon:#39ff14;--panel:rgba(0,20,40,.9)}*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%;background:#0a0a1a;font-family:'Courier New',Consolas,monospace;overflow-x:hidden}.game-wrapper{display:flex;flex-direction:column;align-items:center;min-height:100vh;padding:12px}.game-header{width:100%;max-width:420px;display:flex;align-items:center;justify-content:space-between;padding:10px 16px;background:var(--panel);border:2px solid var(--neon);border-radius:8px;margin-bottom:10px;box-shadow:0 0 15px rgba(57,255,20,.3)}.game-brand{font-size:14px;color:var(--neon);text-shadow:0 0 10px var(--neon)}.game-hud{display:flex;gap:16px}.hud-item{display:flex;flex-direction:column;align-items:center;gap:2px}.hud-label{font-size:7px;color:#556;letter-spacing:1px}.hud-value{font-size:14px;color:#fff;text-shadow:0 0 8px var(--neon)}.canvas-container{position:relative;border:3px solid var(--neon);border-radius:6px;overflow:hidden;box-shadow:0 0 25px rgba(57,255,20,.3)}#gameCanvas{display:block}.game-overlay{position:absolute;inset:0;background:rgba(0,0,10,.9);display:flex;align-items:center;justify-content:center;z-index:10;backdrop-filter:blur(4px)}.game-overlay.hidden{display:none}.overlay-content{text-align:center;padding:24px}.overlay-title{font-size:20px;color:var(--neon);text-shadow:0 0 15px var(--neon);margin-bottom:10px;letter-spacing:2px}.overlay-sub{font-size:9px;color:#aaa;margin-bottom:8px;line-height:2}.btn-start{margin-top:12px;padding:12px 24px;background:rgba(57,255,20,.15);border:2px solid var(--neon);border-radius:6px;color:var(--neon);font-family:inherit;font-size:11px;cursor:pointer;text-shadow:0 0 6px var(--neon);box-shadow:0 0 12px rgba(57,255,20,.25)}.btn-start:hover{background:rgba(57,255,20,.3);transform:translateY(-2px)}.mobile-controls{width:400px;margin-top:10px;display:flex;flex-direction:column;gap:6px;align-items:center}.mobile-row{display:flex;gap:8px}.mobile-btn{width:60px;height:50px;background:rgba(57,255,20,.08);border:2px solid rgba(57,255,20,.3);border-radius:8px;color:var(--neon);font-size:16px;cursor:pointer;user-select:none;font-family:inherit}.mobile-btn:active{background:rgba(57,255,20,.25);transform:scale(.93)}`;

const SNAKE_JS = `var canvas = document.getElementById('gameCanvas');
var ctx = canvas.getContext('2d');
var scoreDisplay = document.getElementById('scoreDisplay');
var highScoreDisplay = document.getElementById('highScoreDisplay');
var startBtn = document.getElementById('startBtn');
var startScreen = document.getElementById('startScreen');
var gameOverScreen = document.getElementById('gameOverScreen');
var mUp = document.getElementById('mUp');
var mDown = document.getElementById('mDown');
var mLeft = document.getElementById('mLeft');
var mRight = document.getElementById('mRight');
var GRID=20,COLS=canvas.width/GRID,ROWS=canvas.height/GRID;
var snake,dir,nextDir,apple,score,highScore,alive,loopId,speed;
highScore=parseInt(localStorage.getItem('snake_high'))||0;
highScoreDisplay.textContent=highScore;
function init(){snake=[{x:Math.floor(COLS/2),y:Math.floor(ROWS/2)}];dir={x:1,y:0};nextDir={x:1,y:0};score=0;speed=150;alive=true;scoreDisplay.textContent='0';spawnApple()}
function spawnApple(){var occupied=new Set(snake.map(function(s){return s.x+','+s.y}));var free=[];for(var x=0;x<COLS;x++)for(var y=0;y<ROWS;y++){if(!occupied.has(x+','+y))free.push({x:x,y:y})}if(free.length===0){endGame();return}apple=free[Math.floor(Math.random()*free.length)]}
function setDir(x,y){if(x!==0&&dir.x!==-x)nextDir={x:x,y:0};else if(y!==0&&dir.y!==-y)nextDir={x:0,y:y}}
document.addEventListener('keydown',function(e){if(!alive)return;if(e.key==='ArrowUp'){e.preventDefault();setDir(0,-1)}else if(e.key==='ArrowDown'){e.preventDefault();setDir(0,1)}else if(e.key==='ArrowLeft'){e.preventDefault();setDir(-1,0)}else if(e.key==='ArrowRight'){e.preventDefault();setDir(1,0)}});
mUp.addEventListener('click',function(){setDir(0,-1)});mDown.addEventListener('click',function(){setDir(0,1)});mLeft.addEventListener('click',function(){setDir(-1,0)});mRight.addEventListener('click',function(){setDir(1,0)});
function update(){dir=nextDir;var head={x:snake[0].x+dir.x,y:snake[0].y+dir.y};if(head.x<0||head.x>=COLS||head.y<0||head.y>=ROWS){endGame();return}for(var i=0;i<snake.length;i++){if(snake[i].x===head.x&&snake[i].y===head.y){endGame();return}}snake.unshift(head);if(head.x===apple.x&&head.y===apple.y){score++;scoreDisplay.textContent=score;if(score>highScore){highScore=score;highScoreDisplay.textContent=highScore;localStorage.setItem('snake_high',String(highScore))}speed=Math.max(60,150-score*3);spawnApple()}else{snake.pop()}}
function draw(){ctx.fillStyle='#1a1a2e';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.strokeStyle='rgba(255,255,255,0.03)';for(var gx=0;gx<COLS;gx++)for(var gy=0;gy<ROWS;gy++){ctx.strokeRect(gx*GRID,gy*GRID,GRID,GRID)}ctx.fillStyle='#ff006e';ctx.shadowColor='#ff006e';ctx.shadowBlur=12;ctx.beginPath();ctx.arc(apple.x*GRID+GRID/2,apple.y*GRID+GRID/2,GRID/2-2,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;for(var i=0;i<snake.length;i++){ctx.fillStyle=i===0?'#39ff14':'#2bcc0f';ctx.shadowColor='#39ff14';ctx.shadowBlur=i===0?10:4;ctx.fillRect(snake[i].x*GRID+1,snake[i].y*GRID+1,GRID-2,GRID-2)}ctx.shadowBlur=0}
function endGame(){alive=false;gameOverScreen.classList.remove('hidden');var fs=gameOverScreen.querySelector('#finalScore');if(fs)fs.textContent=score}
function gameLoop(){if(!alive)return;update();draw();loopId=setTimeout(function(){requestAnimationFrame(gameLoop)},speed)}
function startGame(){startScreen.classList.add('hidden');gameOverScreen.classList.add('hidden');init();draw();if(loopId)clearTimeout(loopId);gameLoop()}
startBtn.addEventListener('click',startGame);gameOverScreen.addEventListener('click',startGame);
init();draw();`;

// ═══════════════════════════════════════════════════════════════════════════
// ██  2048  ██
// ═══════════════════════════════════════════════════════════════════════════
const GAME_2048_HTML = `<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>2048</title><link rel="stylesheet" href="style.css"></head>
<body><div class="game-wrapper">
  <div class="game-header"><div class="game-brand">2048</div><div class="game-hud"><div class="hud-item"><span class="hud-label">SCORE</span><span class="hud-value" id="scoreDisplay">0</span></div><div class="hud-item"><span class="hud-label">BEST</span><span class="hud-value" id="highScoreDisplay">0</span></div></div><button class="btn-new" id="newGameBtn">New Game</button></div>
  <div class="grid-container"><div id="gameGrid" class="game-grid"></div>
    <div class="game-overlay hidden" id="gameOverScreen"><div class="overlay-content"><h1 class="overlay-title">Game Over!</h1><p class="overlay-sub">클릭하여 재시작</p></div></div>
  </div>
  <div class="mobile-controls"><div class="mobile-row"><button class="mobile-btn" id="mUp">▲</button></div><div class="mobile-row"><button class="mobile-btn" id="mLeft">◀</button><button class="mobile-btn" id="mDown">▼</button><button class="mobile-btn" id="mRight">▶</button></div></div>
</div><script src="script.js"></script></body></html>`;

const GAME_2048_CSS = `*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%;background:#faf8ef;font-family:'Courier New',Consolas,monospace}.game-wrapper{display:flex;flex-direction:column;align-items:center;min-height:100vh;padding:16px}.game-header{width:100%;max-width:420px;display:flex;align-items:center;justify-content:space-between;padding:12px;margin-bottom:12px}.game-brand{font-size:36px;font-weight:900;color:#776e65}.game-hud{display:flex;gap:8px}.hud-item{background:#bbada0;border-radius:6px;padding:6px 14px;display:flex;flex-direction:column;align-items:center;gap:2px}.hud-label{font-size:8px;color:#eee4da;letter-spacing:1px;text-transform:uppercase}.hud-value{font-size:16px;color:#fff;font-weight:bold}.btn-new{padding:10px 16px;background:#8f7a66;border:none;border-radius:6px;color:#f9f6f2;font-family:inherit;font-size:11px;font-weight:bold;cursor:pointer}.btn-new:hover{background:#9f8b76}.grid-container{position:relative;background:#bbada0;border-radius:8px;padding:8px;width:340px;height:340px}.game-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;width:100%;height:100%}.tile{border-radius:6px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:32px;transition:transform .12s ease}.tile-pop{animation:pop .2s ease}@keyframes pop{0%{transform:scale(0)}50%{transform:scale(1.1)}100%{transform:scale(1)}}.game-overlay{position:absolute;inset:0;background:rgba(238,228,218,.73);display:flex;align-items:center;justify-content:center;z-index:10;border-radius:8px}.game-overlay.hidden{display:none}.overlay-content{text-align:center}.overlay-title{font-size:28px;color:#776e65;margin-bottom:8px}.overlay-sub{font-size:11px;color:#776e65}.mobile-controls{margin-top:12px;display:flex;flex-direction:column;gap:6px;align-items:center}.mobile-row{display:flex;gap:8px}.mobile-btn{width:56px;height:48px;background:#bbada0;border:none;border-radius:8px;color:#fff;font-size:16px;font-weight:bold;cursor:pointer;font-family:inherit}.mobile-btn:active{background:#9f8b76;transform:scale(.93)}@media(max-width:400px){.grid-container{width:300px;height:300px}.tile{font-size:24px}}`;

const GAME_2048_JS = `var gameGrid = document.getElementById('gameGrid');
var scoreDisplay = document.getElementById('scoreDisplay');
var highScoreDisplay = document.getElementById('highScoreDisplay');
var newGameBtn = document.getElementById('newGameBtn');
var gameOverScreen = document.getElementById('gameOverScreen');
var mUp = document.getElementById('mUp');
var mDown = document.getElementById('mDown');
var mLeft = document.getElementById('mLeft');
var mRight = document.getElementById('mRight');
var SIZE=4,board,score,highScore,moved;
var COLORS={0:'#cdc1b4',2:'#eee4da',4:'#ede0c8',8:'#f2b179',16:'#f59563',32:'#f67c5f',64:'#f65e3b',128:'#edcf72',256:'#edcc61',512:'#edc850',1024:'#edc53f',2048:'#edc22e'};
highScore=parseInt(localStorage.getItem('2048_high'))||0;highScoreDisplay.textContent=highScore;
function emptyBoard(){var b=[];for(var r=0;r<SIZE;r++){b[r]=[0,0,0,0]}return b}
function emptyCells(){var cells=[];for(var r=0;r<SIZE;r++)for(var c=0;c<SIZE;c++){if(board[r][c]===0)cells.push({r:r,c:c})}return cells}
function addRandom(){var cells=emptyCells();if(cells.length===0)return;var cell=cells[Math.floor(Math.random()*cells.length)];board[cell.r][cell.c]=Math.random()<0.9?2:4}
function render(){gameGrid.innerHTML='';for(var r=0;r<SIZE;r++)for(var c=0;c<SIZE;c++){var val=board[r][c];var tile=document.createElement('div');tile.className='tile'+(val?' tile-pop':'');tile.style.background=COLORS[val]||'#3c3a32';tile.style.color=val<=4?'#776e65':'#f9f6f2';tile.style.fontSize=val>=1024?'20px':val>=128?'24px':'32px';if(val)tile.textContent=val;gameGrid.appendChild(tile)}}
function slideRow(row){var filtered=row.filter(function(v){return v!==0});var result=[];for(var i=0;i<filtered.length;i++){if(i+1<filtered.length&&filtered[i]===filtered[i+1]){var merged=filtered[i]*2;result.push(merged);score+=merged;i++;moved=true}else{result.push(filtered[i])}}while(result.length<SIZE)result.push(0);for(var j=0;j<SIZE;j++){if(result[j]!==row[j])moved=true}return result}
function rotateBoard(b){var n=[];for(var r=0;r<SIZE;r++){n[r]=[];for(var c=0;c<SIZE;c++){n[r][c]=b[SIZE-1-c][r]}}return n}
function move(direction){moved=false;var rotations={left:0,up:1,right:2,down:3};var times=rotations[direction];var b=board;for(var i=0;i<times;i++)b=rotateBoard(b);for(var r=0;r<SIZE;r++)b[r]=slideRow(b[r]);for(var j=0;j<(4-times)%4;j++)b=rotateBoard(b);board=b;if(moved){addRandom();scoreDisplay.textContent=score;if(score>highScore){highScore=score;highScoreDisplay.textContent=highScore;localStorage.setItem('2048_high',String(highScore))}render();if(!canMove()){setTimeout(function(){gameOverScreen.classList.remove('hidden')},300)}}}
function canMove(){for(var r=0;r<SIZE;r++)for(var c=0;c<SIZE;c++){if(board[r][c]===0)return true;if(c+1<SIZE&&board[r][c]===board[r][c+1])return true;if(r+1<SIZE&&board[r][c]===board[r+1][c])return true}return false}
function newGame(){board=emptyBoard();score=0;scoreDisplay.textContent='0';gameOverScreen.classList.add('hidden');addRandom();addRandom();render()}
document.addEventListener('keydown',function(e){if(e.key==='ArrowLeft'){e.preventDefault();move('left')}else if(e.key==='ArrowRight'){e.preventDefault();move('right')}else if(e.key==='ArrowUp'){e.preventDefault();move('up')}else if(e.key==='ArrowDown'){e.preventDefault();move('down')}});
mUp.addEventListener('click',function(){move('up')});mDown.addEventListener('click',function(){move('down')});mLeft.addEventListener('click',function(){move('left')});mRight.addEventListener('click',function(){move('right')});
var touchStartX=0,touchStartY=0;
document.addEventListener('touchstart',function(e){touchStartX=e.touches[0].clientX;touchStartY=e.touches[0].clientY},{passive:true});
document.addEventListener('touchend',function(e){var dx=e.changedTouches[0].clientX-touchStartX;var dy=e.changedTouches[0].clientY-touchStartY;if(Math.max(Math.abs(dx),Math.abs(dy))<30)return;if(Math.abs(dx)>Math.abs(dy)){move(dx>0?'right':'left')}else{move(dy>0?'down':'up')}});
newGameBtn.addEventListener('click',newGame);gameOverScreen.addEventListener('click',newGame);newGame();`;

// ═══════════════════════════════════════════════════════════════════════════
// ██  PONG  ██
// ═══════════════════════════════════════════════════════════════════════════
const PONG_HTML = `<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>🏓 Pong</title><link rel="stylesheet" href="style.css"></head>
<body><div class="game-wrapper">
  <div class="game-header"><div class="game-brand">🏓 PONG</div><div class="game-hud"><div class="hud-item"><span class="hud-label">PLAYER</span><span class="hud-value" id="playerScore">0</span></div><div class="hud-item"><span class="hud-label">AI</span><span class="hud-value" id="aiScore">0</span></div></div><button class="btn-pause" id="pauseBtn">Pause</button></div>
  <div class="canvas-container">
    <canvas id="gameCanvas" width="600" height="400"></canvas>
    <div class="game-overlay" id="startScreen"><div class="overlay-content"><div style="font-size:48px;margin-bottom:12px">🏓</div><h1 class="overlay-title">PONG</h1><p class="overlay-sub">↑ ↓ 키로 패들 조작 | 7점 선승</p><button class="btn-start" id="startBtn">▶ 게임 시작</button></div></div>
    <div class="game-overlay hidden" id="gameOverScreen"><div class="overlay-content"><h1 class="overlay-title">GAME OVER</h1><p class="overlay-sub" id="finalScore">0 - 0</p><p class="overlay-sub" style="font-size:8px;opacity:.6">클릭하여 재시작</p></div></div>
  </div>
  <div class="mobile-controls"><div class="mobile-row"><button class="mobile-btn mobile-btn-lg" id="mUp">▲ UP</button><button class="mobile-btn mobile-btn-lg" id="mDown">▼ DOWN</button></div></div>
</div><script src="script.js"></script></body></html>`;

const PONG_CSS = `:root{--neon:#ff006e;--cyan:#00f5ff;--panel:rgba(0,20,40,.9)}*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%;background:#0a0a1a;font-family:'Courier New',Consolas,monospace;overflow-x:hidden}.game-wrapper{display:flex;flex-direction:column;align-items:center;min-height:100vh;padding:12px}.game-header{width:100%;max-width:620px;display:flex;align-items:center;justify-content:space-between;padding:10px 16px;background:var(--panel);border:2px solid var(--cyan);border-radius:8px;margin-bottom:10px;box-shadow:0 0 15px rgba(0,245,255,.3)}.game-brand{font-size:14px;color:var(--cyan);text-shadow:0 0 10px var(--cyan)}.game-hud{display:flex;gap:20px}.hud-item{display:flex;flex-direction:column;align-items:center;gap:2px}.hud-label{font-size:7px;color:#556;letter-spacing:1px}.hud-value{font-size:18px;color:#fff;text-shadow:0 0 8px var(--cyan)}.btn-pause{padding:8px 14px;background:rgba(0,245,255,.1);border:2px solid rgba(0,245,255,.3);border-radius:6px;color:var(--cyan);font-family:inherit;font-size:9px;cursor:pointer}.btn-pause:hover{background:rgba(0,245,255,.2)}.canvas-container{position:relative;border:3px solid var(--cyan);border-radius:6px;overflow:hidden;box-shadow:0 0 25px rgba(0,245,255,.3)}#gameCanvas{display:block}.game-overlay{position:absolute;inset:0;background:rgba(0,0,10,.9);display:flex;align-items:center;justify-content:center;z-index:10;backdrop-filter:blur(4px)}.game-overlay.hidden{display:none}.overlay-content{text-align:center;padding:24px}.overlay-title{font-size:22px;color:var(--cyan);text-shadow:0 0 15px var(--cyan);margin-bottom:10px;letter-spacing:2px}.overlay-sub{font-size:9px;color:#aaa;margin-bottom:8px;line-height:2}.btn-start{margin-top:12px;padding:12px 24px;background:rgba(0,245,255,.15);border:2px solid var(--cyan);border-radius:6px;color:var(--cyan);font-family:inherit;font-size:11px;cursor:pointer;box-shadow:0 0 12px rgba(0,245,255,.25)}.btn-start:hover{background:rgba(0,245,255,.3);transform:translateY(-2px)}.mobile-controls{margin-top:10px}.mobile-row{display:flex;gap:12px}.mobile-btn-lg{width:120px;height:56px;background:rgba(0,245,255,.08);border:2px solid rgba(0,245,255,.3);border-radius:10px;color:var(--cyan);font-family:inherit;font-size:12px;cursor:pointer;user-select:none}.mobile-btn-lg:active{background:rgba(0,245,255,.25);transform:scale(.93)}`;

const PONG_JS = `var canvas = document.getElementById('gameCanvas');
var ctx = canvas.getContext('2d');
var playerScoreEl = document.getElementById('playerScore');
var aiScoreEl = document.getElementById('aiScore');
var startBtn = document.getElementById('startBtn');
var pauseBtn = document.getElementById('pauseBtn');
var startScreen = document.getElementById('startScreen');
var gameOverScreen = document.getElementById('gameOverScreen');
var finalScore = document.getElementById('finalScore');
var mUp = document.getElementById('mUp');
var mDown = document.getElementById('mDown');
var W=canvas.width,H=canvas.height,PADDLE_W=12,PADDLE_H=80,BALL_R=8,WIN_SCORE=7;
var player,ai,ball,pScore,aScore,running,paused,animId;
var keysDown={};
function resetBall(towardPlayer){ball={x:W/2,y:H/2,speed:5,dx:0,dy:0};var angle=Math.random()*0.8-0.4;ball.dx=Math.cos(angle)*ball.speed*(towardPlayer?-1:1);ball.dy=Math.sin(angle)*ball.speed}
function init(){player={x:15,y:H/2-PADDLE_H/2,w:PADDLE_W,h:PADDLE_H,speed:6};ai={x:W-15-PADDLE_W,y:H/2-PADDLE_H/2,w:PADDLE_W,h:PADDLE_H};pScore=0;aScore=0;playerScoreEl.textContent='0';aiScoreEl.textContent='0';resetBall(false)}
document.addEventListener('keydown',function(e){keysDown[e.key]=true;if(e.key==='ArrowUp'||e.key==='ArrowDown')e.preventDefault()});
document.addEventListener('keyup',function(e){keysDown[e.key]=false});
var mUpPressed=false,mDownPressed=false;
mUp.addEventListener('mousedown',function(){mUpPressed=true});mUp.addEventListener('mouseup',function(){mUpPressed=false});mUp.addEventListener('mouseleave',function(){mUpPressed=false});mUp.addEventListener('touchstart',function(e){e.preventDefault();mUpPressed=true});mUp.addEventListener('touchend',function(){mUpPressed=false});
mDown.addEventListener('mousedown',function(){mDownPressed=true});mDown.addEventListener('mouseup',function(){mDownPressed=false});mDown.addEventListener('mouseleave',function(){mDownPressed=false});mDown.addEventListener('touchstart',function(e){e.preventDefault();mDownPressed=true});mDown.addEventListener('touchend',function(){mDownPressed=false});
function movePlayer(){if(keysDown['ArrowUp']||mUpPressed)player.y-=player.speed;if(keysDown['ArrowDown']||mDownPressed)player.y+=player.speed;player.y=Math.max(0,Math.min(H-player.h,player.y))}
function moveAI(){var difficulty=0.04+Math.min(aScore+pScore,10)*0.008;var target=ball.y-PADDLE_H/2;ai.y+=(target-ai.y)*difficulty;ai.y=Math.max(0,Math.min(H-ai.h,ai.y))}
function collides(paddle){return ball.x+BALL_R>paddle.x&&ball.x-BALL_R<paddle.x+paddle.w&&ball.y+BALL_R>paddle.y&&ball.y-BALL_R<paddle.y+paddle.h}
function update(){movePlayer();moveAI();ball.x+=ball.dx;ball.y+=ball.dy;if(ball.y-BALL_R<=0){ball.y=BALL_R;ball.dy=Math.abs(ball.dy)}if(ball.y+BALL_R>=H){ball.y=H-BALL_R;ball.dy=-Math.abs(ball.dy)}if(collides(player)){ball.x=player.x+player.w+BALL_R;var offset=(ball.y-(player.y+PADDLE_H/2))/(PADDLE_H/2);var angle=offset*(Math.PI/3);ball.speed=Math.min(12,ball.speed+0.15);ball.dx=Math.cos(angle)*ball.speed;ball.dy=Math.sin(angle)*ball.speed}if(collides(ai)){ball.x=ai.x-BALL_R;var offset2=(ball.y-(ai.y+PADDLE_H/2))/(PADDLE_H/2);var angle2=offset2*(Math.PI/3);ball.speed=Math.min(12,ball.speed+0.15);ball.dx=-Math.cos(angle2)*ball.speed;ball.dy=Math.sin(angle2)*ball.speed}if(ball.x<-BALL_R){aScore++;aiScoreEl.textContent=aScore;if(aScore>=WIN_SCORE){endGame();return}resetBall(true)}if(ball.x>W+BALL_R){pScore++;playerScoreEl.textContent=pScore;if(pScore>=WIN_SCORE){endGame();return}resetBall(false)}}
function draw(){ctx.fillStyle='#0a0a1a';ctx.fillRect(0,0,W,H);ctx.setLineDash([8,8]);ctx.strokeStyle='rgba(255,255,255,0.25)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(W/2,0);ctx.lineTo(W/2,H);ctx.stroke();ctx.setLineDash([]);ctx.shadowColor='#00f5ff';ctx.shadowBlur=15;ctx.fillStyle='#00f5ff';ctx.fillRect(player.x,player.y,player.w,player.h);ctx.fillRect(ai.x,ai.y,ai.w,ai.h);ctx.shadowColor='#ff006e';ctx.shadowBlur=18;ctx.fillStyle='#ff006e';ctx.beginPath();ctx.arc(ball.x,ball.y,BALL_R,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0}
function loop(){if(!running)return;if(!paused){update();draw()}animId=requestAnimationFrame(loop)}
function endGame(){running=false;cancelAnimationFrame(animId);finalScore.textContent=pScore+' - '+aScore;gameOverScreen.classList.remove('hidden')}
function startGame(){startScreen.classList.add('hidden');gameOverScreen.classList.add('hidden');init();running=true;paused=false;pauseBtn.textContent='Pause';loop()}
startBtn.addEventListener('click',startGame);gameOverScreen.addEventListener('click',startGame);
pauseBtn.addEventListener('click',function(){if(!running)return;paused=!paused;pauseBtn.textContent=paused?'Resume':'Pause'});
init();draw();`;

// ═══════════════════════════════════════════════════════════════════════════
// ██  CALCULATOR  ██
// ═══════════════════════════════════════════════════════════════════════════
const CALC_HTML = `<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>🔢 Calculator</title><link rel="stylesheet" href="style.css"></head>
<body><div class="calc-wrapper">
  <div class="calc-header">🔢 Scientific Calculator</div>
  <div class="calc-body">
    <div class="display-area"><div class="expression" id="expression">&nbsp;</div><div class="display" id="display">0</div></div>
    <div class="btn-grid">
      <button id="btnMC" class="btn btn-mem">MC</button><button id="btnMR" class="btn btn-mem">MR</button><button id="btnMPlus" class="btn btn-mem">M+</button><button id="btnMMinus" class="btn btn-mem">M-</button>
      <button id="btnSin" class="btn btn-sci">sin</button><button id="btnCos" class="btn btn-sci">cos</button><button id="btnTan" class="btn btn-sci">tan</button><button id="btnPi" class="btn btn-sci">\u03C0</button>
      <button id="btnSqrt" class="btn btn-sci">\u221A</button><button id="btnPow" class="btn btn-sci">x\u00B2</button><button id="btnLog" class="btn btn-sci">log</button><button id="btnBackspace" class="btn btn-op">\u232B</button>
      <button id="btn7" class="btn">7</button><button id="btn8" class="btn">8</button><button id="btn9" class="btn">9</button><button id="btnDiv" class="btn btn-op">\u00F7</button>
      <button id="btn4" class="btn">4</button><button id="btn5" class="btn">5</button><button id="btn6" class="btn">6</button><button id="btnMul" class="btn btn-op">\u00D7</button>
      <button id="btn1" class="btn">1</button><button id="btn2" class="btn">2</button><button id="btn3" class="btn">3</button><button id="btnSub" class="btn btn-op">-</button>
      <button id="btnClear" class="btn btn-clear">C</button><button id="btn0" class="btn">0</button><button id="btnDot" class="btn">.</button><button id="btnAdd" class="btn btn-op">+</button>
      <button id="btnEquals" class="btn btn-equals" style="grid-column:span 4">=</button>
    </div>
  </div>
</div><script src="script.js"></script></body></html>`;

const CALC_CSS = `*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%;background:#1a1a2e;font-family:'Courier New',Consolas,monospace}.calc-wrapper{display:flex;flex-direction:column;align-items:center;min-height:100vh;padding:20px;justify-content:center}.calc-header{font-size:14px;color:#00f5ff;text-shadow:0 0 10px rgba(0,245,255,.5);margin-bottom:14px;letter-spacing:2px}.calc-body{width:320px;background:#0f0f23;border:2px solid #00f5ff;border-radius:16px;padding:16px;box-shadow:0 0 30px rgba(0,245,255,.2)}.display-area{background:#050510;border-radius:10px;padding:16px;margin-bottom:14px;border:1px solid rgba(0,245,255,.2)}.expression{font-size:11px;color:#556;min-height:18px;text-align:right;margin-bottom:4px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.display{font-size:28px;color:#fff;text-align:right;text-shadow:0 0 10px rgba(0,245,255,.5);min-height:36px;word-break:break-all}.btn-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.btn{height:44px;border:none;border-radius:8px;font-family:inherit;font-size:15px;font-weight:bold;cursor:pointer;background:#1a1a3e;color:#e0e0e0;transition:all .12s}.btn:hover{background:#2a2a4e;transform:translateY(-1px)}.btn:active{transform:scale(.95)}.btn-op{background:#1a2a3e;color:#00f5ff}.btn-sci{background:#0f1a2a;color:#f97316;font-size:11px}.btn-mem{background:#0f1a2a;color:#9b59b6;font-size:10px}.btn-clear{background:#3a1a1a;color:#ff006e}.btn-equals{background:linear-gradient(135deg,#00f5ff33,#00f5ff55);color:#00f5ff;font-size:18px;border:1px solid #00f5ff;text-shadow:0 0 8px rgba(0,245,255,.5)}.btn-equals:hover{background:linear-gradient(135deg,#00f5ff55,#00f5ff77);box-shadow:0 0 15px rgba(0,245,255,.4)}`;

const CALC_JS = `var display = document.getElementById('display');
var expression = document.getElementById('expression');
var currentInput = '0';
var currentExpression = '';
var memory = 0;
var lastResult = null;
var shouldResetInput = false;
function updateDisplay(){display.textContent=currentInput;expression.textContent=currentExpression||'\\u00A0'}
function inputDigit(d){if(shouldResetInput){currentInput=d;shouldResetInput=false}else{currentInput=currentInput==='0'?d:currentInput+d}updateDisplay()}
function inputDot(){if(shouldResetInput){currentInput='0.';shouldResetInput=false}else if(!currentInput.includes('.')){currentInput+='.'}updateDisplay()}
function inputOperator(op){var displayOp=op==='*'?'\\u00D7':op==='/'?'\\u00F7':op;if(currentExpression&&shouldResetInput){currentExpression=currentExpression.replace(/[\\+\\-\\u00D7\\u00F7]\\s*$/,'')+' '+displayOp+' '}else{currentExpression+=currentInput+' '+displayOp+' '}shouldResetInput=true;updateDisplay()}
function sanitizeExpression(expr){return expr.replace(/\\u00D7/g,'*').replace(/\\u00F7/g,'/').replace(/[^0-9+\\-*/().e ]/g,'')}
function calculate(){var fullExpr=currentExpression+(shouldResetInput?'':currentInput);if(!fullExpr.trim())return;var sanitized=sanitizeExpression(fullExpr);if(/\\/\\s*0(?![0-9.])/.test(sanitized)){currentInput='Error: Div/0';currentExpression='';shouldResetInput=true;updateDisplay();return}try{var result=Function('"use strict"; return ('+sanitized+')')();if(!isFinite(result))throw new Error('Invalid');currentExpression='';currentInput=parseFloat(result.toPrecision(12)).toString();shouldResetInput=true;updateDisplay()}catch(e){currentInput='Error';currentExpression='';shouldResetInput=true;updateDisplay()}}
function clearAll(){currentInput='0';currentExpression='';shouldResetInput=false;updateDisplay()}
function backspace(){if(shouldResetInput)return;currentInput=currentInput.length>1?currentInput.slice(0,-1):'0';updateDisplay()}
function applyScientific(fn){var val=parseFloat(currentInput);var result;try{switch(fn){case'sin':result=Math.sin(val*Math.PI/180);break;case'cos':result=Math.cos(val*Math.PI/180);break;case'tan':if(Math.abs(val%180)===90){currentInput='Error';updateDisplay();return}result=Math.tan(val*Math.PI/180);break;case'sqrt':if(val<0){currentInput='Error';updateDisplay();return}result=Math.sqrt(val);break;case'pow':result=val*val;break;case'log':if(val<=0){currentInput='Error';updateDisplay();return}result=Math.log10(val);break;case'pi':result=Math.PI;break;default:return}currentInput=parseFloat(result.toPrecision(12)).toString();shouldResetInput=true;updateDisplay()}catch(e){currentInput='Error';shouldResetInput=true;updateDisplay()}}
['0','1','2','3','4','5','6','7','8','9'].forEach(function(d){document.getElementById('btn'+d).addEventListener('click',function(){inputDigit(d)})});
document.getElementById('btnAdd').addEventListener('click',function(){inputOperator('+')});document.getElementById('btnSub').addEventListener('click',function(){inputOperator('-')});document.getElementById('btnMul').addEventListener('click',function(){inputOperator('*')});document.getElementById('btnDiv').addEventListener('click',function(){inputOperator('/')});document.getElementById('btnEquals').addEventListener('click',calculate);document.getElementById('btnClear').addEventListener('click',clearAll);document.getElementById('btnBackspace').addEventListener('click',backspace);document.getElementById('btnDot').addEventListener('click',inputDot);
document.getElementById('btnSin').addEventListener('click',function(){applyScientific('sin')});document.getElementById('btnCos').addEventListener('click',function(){applyScientific('cos')});document.getElementById('btnTan').addEventListener('click',function(){applyScientific('tan')});document.getElementById('btnSqrt').addEventListener('click',function(){applyScientific('sqrt')});document.getElementById('btnPow').addEventListener('click',function(){applyScientific('pow')});document.getElementById('btnLog').addEventListener('click',function(){applyScientific('log')});document.getElementById('btnPi').addEventListener('click',function(){applyScientific('pi')});
document.getElementById('btnMC').addEventListener('click',function(){memory=0});document.getElementById('btnMR').addEventListener('click',function(){currentInput=memory.toString();shouldResetInput=true;updateDisplay()});document.getElementById('btnMPlus').addEventListener('click',function(){memory+=parseFloat(currentInput)||0});document.getElementById('btnMMinus').addEventListener('click',function(){memory-=parseFloat(currentInput)||0});
document.addEventListener('keydown',function(e){if(e.key>='0'&&e.key<='9'){inputDigit(e.key);e.preventDefault()}else if(e.key==='.'){inputDot();e.preventDefault()}else if(e.key==='+'){inputOperator('+');e.preventDefault()}else if(e.key==='-'){inputOperator('-');e.preventDefault()}else if(e.key==='*'){inputOperator('*');e.preventDefault()}else if(e.key==='/'){inputOperator('/');e.preventDefault()}else if(e.key==='Enter'||e.key==='='){calculate();e.preventDefault()}else if(e.key==='Escape'){clearAll();e.preventDefault()}else if(e.key==='Backspace'){backspace();e.preventDefault()}});
updateDisplay();`;

// ═══════════════════════════════════════════════════════════════════════════
// ██  TODO  ██
// ═══════════════════════════════════════════════════════════════════════════
const TODO_HTML = `<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Todo App</title><link rel="stylesheet" href="style.css"></head>
<body><div class="todo-wrapper">
  <h1 class="todo-title">todos</h1>
  <div class="todo-card">
    <div class="input-row"><input type="text" id="taskInput" placeholder="할 일을 입력하세요..." autocomplete="off"><button id="addBtn">+</button></div>
    <ul id="taskList" class="task-list"></ul>
    <div class="footer-row"><span id="taskCount">0 items left</span><div class="filters"><button id="filterAll" class="filter-btn active">All</button><button id="filterActive" class="filter-btn">Active</button><button id="filterCompleted" class="filter-btn">Done</button></div><button id="clearCompleted" class="clear-btn">Clear done</button></div>
  </div>
</div><script src="script.js"></script></body></html>`;

const TODO_CSS = `*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}.todo-wrapper{display:flex;flex-direction:column;align-items:center;min-height:100vh;padding:40px 16px}.todo-title{font-size:64px;color:rgba(175,47,47,.15);font-weight:100;margin-bottom:20px}.todo-card{width:100%;max-width:500px;background:#fff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,.1);overflow:hidden}.input-row{display:flex;border-bottom:1px solid #eee}#taskInput{flex:1;padding:16px 20px;border:none;font-size:16px;font-family:inherit;outline:none}#taskInput::placeholder{color:#ccc}#addBtn{width:50px;background:#f97316;border:none;color:#fff;font-size:24px;cursor:pointer;font-weight:300}#addBtn:hover{background:#ea6c0e}.task-list{list-style:none;max-height:400px;overflow-y:auto}.todo-item{display:flex;align-items:center;padding:12px 16px;border-bottom:1px solid #f0f0f0;gap:12px;transition:background .2s;cursor:grab}.todo-item:hover{background:#fafafa}.todo-item.completed .todo-text{text-decoration:line-through;color:#bbb}.todo-checkbox{width:20px;height:20px;accent-color:#f97316;cursor:pointer;flex-shrink:0}.todo-text{flex:1;font-size:15px;color:#333;word-break:break-word}.todo-delete{width:28px;height:28px;background:none;border:none;color:#ddd;font-size:20px;cursor:pointer;border-radius:50%;display:flex;align-items:center;justify-content:center}.todo-delete:hover{color:#ff006e;background:rgba(255,0,110,.05)}.edit-input{flex:1;padding:4px 8px;border:2px solid #f97316;border-radius:4px;font-size:15px;font-family:inherit;outline:none}.footer-row{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;font-size:12px;color:#999;gap:8px}.filters{display:flex;gap:4px}.filter-btn{padding:4px 10px;border:1px solid transparent;border-radius:4px;background:none;color:#999;font-family:inherit;font-size:11px;cursor:pointer}.filter-btn.active{border-color:#f97316;color:#f97316}.filter-btn:hover{border-color:#ddd}.clear-btn{background:none;border:none;color:#999;font-family:inherit;font-size:11px;cursor:pointer}.clear-btn:hover{text-decoration:underline;color:#f97316}.dragging{opacity:.5}.drag-over{border-top:2px solid #f97316}@keyframes fadeIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}@keyframes fadeOut{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(10px)}}`;

const TODO_JS = `var taskInput = document.getElementById('taskInput');
var addBtn = document.getElementById('addBtn');
var taskList = document.getElementById('taskList');
var filterAll = document.getElementById('filterAll');
var filterActive = document.getElementById('filterActive');
var filterCompleted = document.getElementById('filterCompleted');
var clearCompletedBtn = document.getElementById('clearCompleted');
var taskCount = document.getElementById('taskCount');
var todos=[],currentFilter='all',dragSrcIndex=null;
function generateId(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function saveTodos(){localStorage.setItem('dalkak_todos',JSON.stringify(todos))}
function loadTodos(){try{var stored=localStorage.getItem('dalkak_todos');if(stored)todos=JSON.parse(stored)}catch(e){todos=[]}}
function updateCount(){var active=todos.filter(function(t){return!t.completed}).length;taskCount.textContent=active+' item'+(active!==1?'s':'')+' left'}
function setFilter(f){currentFilter=f;[filterAll,filterActive,filterCompleted].forEach(function(btn){btn.classList.remove('active')});if(f==='all')filterAll.classList.add('active');else if(f==='active')filterActive.classList.add('active');else filterCompleted.classList.add('active');renderTodos()}
function getFilteredTodos(){if(currentFilter==='active')return todos.filter(function(t){return!t.completed});if(currentFilter==='completed')return todos.filter(function(t){return t.completed});return todos}
function createTaskEl(todo){var li=document.createElement('li');li.className='todo-item'+(todo.completed?' completed':'');li.setAttribute('draggable','true');li.dataset.id=todo.id;var checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=todo.completed;checkbox.className='todo-checkbox';checkbox.addEventListener('change',function(){todo.completed=checkbox.checked;saveTodos();renderTodos()});var span=document.createElement('span');span.className='todo-text';span.textContent=todo.text;span.addEventListener('dblclick',function(){var input=document.createElement('input');input.type='text';input.className='edit-input';input.value=todo.text;li.replaceChild(input,span);input.focus();input.select();function finishEdit(){var val=input.value.trim();if(val){todo.text=val;span.textContent=val}if(input.parentNode===li)li.replaceChild(span,input);saveTodos()}input.addEventListener('blur',finishEdit);input.addEventListener('keydown',function(e){if(e.key==='Enter')finishEdit();if(e.key==='Escape'){if(input.parentNode===li)li.replaceChild(span,input)}})});var delBtn=document.createElement('button');delBtn.className='todo-delete';delBtn.textContent='\\u00D7';delBtn.addEventListener('click',function(){li.style.animation='fadeOut 0.3s ease';li.addEventListener('animationend',function(){todos=todos.filter(function(t){return t.id!==todo.id});saveTodos();renderTodos()})});li.addEventListener('dragstart',function(e){dragSrcIndex=todos.indexOf(todo);li.classList.add('dragging');e.dataTransfer.effectAllowed='move'});li.addEventListener('dragend',function(){li.classList.remove('dragging')});li.addEventListener('dragover',function(e){e.preventDefault()});li.addEventListener('dragenter',function(e){e.preventDefault();li.classList.add('drag-over')});li.addEventListener('dragleave',function(){li.classList.remove('drag-over')});li.addEventListener('drop',function(e){e.preventDefault();li.classList.remove('drag-over');var dropIndex=todos.indexOf(todo);if(dragSrcIndex!==null&&dragSrcIndex!==dropIndex){var moved=todos.splice(dragSrcIndex,1)[0];todos.splice(dropIndex,0,moved);saveTodos();renderTodos()}});li.appendChild(checkbox);li.appendChild(span);li.appendChild(delBtn);return li}
function renderTodos(){taskList.innerHTML='';getFilteredTodos().forEach(function(todo){taskList.appendChild(createTaskEl(todo))});updateCount()}
function addTodo(){var text=taskInput.value.trim();if(!text)return;todos.push({id:generateId(),text:text,completed:false});taskInput.value='';saveTodos();renderTodos();var items=taskList.querySelectorAll('.todo-item');if(items.length>0){items[items.length-1].style.animation='fadeIn 0.3s ease'}}
addBtn.addEventListener('click',addTodo);taskInput.addEventListener('keydown',function(e){if(e.key==='Enter')addTodo()});
filterAll.addEventListener('click',function(){setFilter('all')});filterActive.addEventListener('click',function(){setFilter('active')});filterCompleted.addEventListener('click',function(){setFilter('completed')});
clearCompletedBtn.addEventListener('click',function(){todos=todos.filter(function(t){return!t.completed});saveTodos();renderTodos()});
loadTodos();setFilter('all');`;

// ═══════════════════════════════════════════════════════════════════════════
// ██  DRAWING  ██
// ═══════════════════════════════════════════════════════════════════════════
const DRAW_HTML = `<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>🎨 Drawing</title><link rel="stylesheet" href="style.css"></head>
<body><div class="draw-wrapper">
  <div class="toolbar">
    <button id="toolPen" class="tool-btn active">🖊 Pen</button><button id="toolEraser" class="tool-btn">🧹 Eraser</button><button id="toolRect" class="tool-btn">▭ Rect</button><button id="toolCircle" class="tool-btn">◯ Circle</button><button id="toolLine" class="tool-btn">╱ Line</button><button id="toolFill" class="tool-btn">🪣 Fill</button>
    <div class="separator"></div>
    <input type="color" id="colorPicker" value="#000000" title="Color">
    <div class="size-control"><label>Size</label><input type="range" id="brushSize" min="1" max="50" value="4"><span id="sizeLabel">4px</span></div>
    <div class="separator"></div>
    <button id="undoBtn" class="action-btn">↩ Undo</button><button id="clearBtn" class="action-btn">🗑 Clear</button><button id="saveBtn" class="action-btn">💾 Save</button>
  </div>
  <div class="canvas-area"><canvas id="drawCanvas"></canvas></div>
</div><script src="script.js"></script></body></html>`;

const DRAW_CSS = `*{margin:0;padding:0;box-sizing:border-box}html,body{width:100%;height:100%;background:#f0f0f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;overflow:hidden}.draw-wrapper{display:flex;flex-direction:column;height:100vh}.toolbar{display:flex;align-items:center;gap:6px;padding:8px 12px;background:#fff;border-bottom:1px solid #ddd;flex-wrap:wrap;min-height:48px}.tool-btn{padding:6px 10px;border:1px solid #ddd;border-radius:6px;background:#fff;font-size:11px;cursor:pointer;font-family:inherit;white-space:nowrap}.tool-btn.active{background:#f97316;color:#fff;border-color:#f97316}.tool-btn:hover:not(.active){background:#f5f5f5}.action-btn{padding:6px 10px;border:1px solid #ddd;border-radius:6px;background:#fff;font-size:11px;cursor:pointer;font-family:inherit;white-space:nowrap}.action-btn:hover{background:#f5f5f5}.separator{width:1px;height:28px;background:#ddd;margin:0 4px}#colorPicker{width:32px;height:32px;border:2px solid #ddd;border-radius:6px;padding:1px;cursor:pointer}.size-control{display:flex;align-items:center;gap:6px;font-size:11px;color:#666}#brushSize{width:80px;accent-color:#f97316}#sizeLabel{min-width:30px;font-size:10px}.canvas-area{flex:1;position:relative;overflow:hidden;background:#e8e8e8}#drawCanvas{display:block;cursor:crosshair;background:#fff;position:absolute;inset:0;width:100%;height:100%}`;

const DRAW_JS = `var canvas = document.getElementById('drawCanvas');
var ctx = canvas.getContext('2d');
var toolPen = document.getElementById('toolPen');
var toolEraser = document.getElementById('toolEraser');
var toolRect = document.getElementById('toolRect');
var toolCircle = document.getElementById('toolCircle');
var toolLine = document.getElementById('toolLine');
var toolFill = document.getElementById('toolFill');
var colorPicker = document.getElementById('colorPicker');
var brushSize = document.getElementById('brushSize');
var sizeLabel = document.getElementById('sizeLabel');
var undoBtn = document.getElementById('undoBtn');
var clearBtn = document.getElementById('clearBtn');
var saveBtn = document.getElementById('saveBtn');
var currentTool='pen',isDrawing=false,startX=0,startY=0,undoStack=[],maxUndo=50,snapshotBeforeShape=null;
function resizeCanvas(){var container=canvas.parentElement;var imgData=null;if(canvas.width>0&&canvas.height>0){try{imgData=ctx.getImageData(0,0,canvas.width,canvas.height)}catch(e){}}canvas.width=container.clientWidth;canvas.height=container.clientHeight;ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);if(imgData){try{ctx.putImageData(imgData,0,0)}catch(e){}}}
function saveState(){if(undoStack.length>=maxUndo)undoStack.shift();undoStack.push(canvas.toDataURL())}
function undo(){if(undoStack.length===0)return;var img=new Image();img.onload=function(){ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0)};img.src=undoStack.pop()}
function setTool(tool){currentTool=tool;[toolPen,toolEraser,toolRect,toolCircle,toolLine,toolFill].forEach(function(btn){btn.classList.remove('active')});var map={pen:toolPen,eraser:toolEraser,rectangle:toolRect,circle:toolCircle,line:toolLine,fill:toolFill};if(map[tool])map[tool].classList.add('active')}
function getPos(e){var rect=canvas.getBoundingClientRect();var cx,cy;if(e.touches&&e.touches.length>0){cx=e.touches[0].clientX;cy=e.touches[0].clientY}else if(e.changedTouches&&e.changedTouches.length>0){cx=e.changedTouches[0].clientX;cy=e.changedTouches[0].clientY}else{cx=e.clientX;cy=e.clientY}return{x:(cx-rect.left)*(canvas.width/rect.width),y:(cy-rect.top)*(canvas.height/rect.height)}}
function setupBrush(){var size=parseInt(brushSize.value);ctx.lineWidth=size;ctx.lineCap='round';ctx.lineJoin='round';if(currentTool==='eraser'){ctx.strokeStyle='#ffffff';ctx.fillStyle='#ffffff'}else{ctx.strokeStyle=colorPicker.value;ctx.fillStyle=colorPicker.value}}
function floodFill(sx,sy,fillColor){var imageData=ctx.getImageData(0,0,canvas.width,canvas.height);var data=imageData.data;var w=canvas.width,h=canvas.height;var idx=(sy*w+sx)*4;var tr=data[idx],tg=data[idx+1],tb=data[idx+2],ta=data[idx+3];var fr=parseInt(fillColor.slice(1,3),16),fg=parseInt(fillColor.slice(3,5),16),fb=parseInt(fillColor.slice(5,7),16);if(tr===fr&&tg===fg&&tb===fb)return;var stack=[[sx,sy]];while(stack.length>0){var p=stack.pop();var px=p[0],py=p[1];if(px<0||px>=w||py<0||py>=h)continue;var i=(py*w+px)*4;if(data[i]!==tr||data[i+1]!==tg||data[i+2]!==tb||data[i+3]!==ta)continue;data[i]=fr;data[i+1]=fg;data[i+2]=fb;data[i+3]=255;stack.push([px+1,py],[px-1,py],[px,py+1],[px,py-1])}ctx.putImageData(imageData,0,0)}
function handleStart(e){e.preventDefault();isDrawing=true;var pos=getPos(e);startX=pos.x;startY=pos.y;saveState();if(currentTool==='fill'){floodFill(Math.round(pos.x),Math.round(pos.y),colorPicker.value);isDrawing=false;return}if(currentTool==='pen'||currentTool==='eraser'){setupBrush();ctx.beginPath();ctx.moveTo(pos.x,pos.y);ctx.lineTo(pos.x,pos.y);ctx.stroke()}if(currentTool==='rectangle'||currentTool==='circle'||currentTool==='line'){snapshotBeforeShape=ctx.getImageData(0,0,canvas.width,canvas.height)}}
function handleMove(e){if(!isDrawing)return;e.preventDefault();var pos=getPos(e);setupBrush();if(currentTool==='pen'||currentTool==='eraser'){ctx.lineTo(pos.x,pos.y);ctx.stroke()}else if(currentTool==='rectangle'&&snapshotBeforeShape){ctx.putImageData(snapshotBeforeShape,0,0);ctx.strokeRect(startX,startY,pos.x-startX,pos.y-startY)}else if(currentTool==='circle'&&snapshotBeforeShape){ctx.putImageData(snapshotBeforeShape,0,0);var rx=Math.abs(pos.x-startX)/2,ry=Math.abs(pos.y-startY)/2;ctx.beginPath();ctx.ellipse(startX+(pos.x-startX)/2,startY+(pos.y-startY)/2,rx,ry,0,0,Math.PI*2);ctx.stroke()}else if(currentTool==='line'&&snapshotBeforeShape){ctx.putImageData(snapshotBeforeShape,0,0);ctx.beginPath();ctx.moveTo(startX,startY);ctx.lineTo(pos.x,pos.y);ctx.stroke()}}
function handleEnd(){if(!isDrawing)return;isDrawing=false;snapshotBeforeShape=null;ctx.beginPath()}
canvas.addEventListener('mousedown',handleStart);canvas.addEventListener('mousemove',handleMove);canvas.addEventListener('mouseup',handleEnd);canvas.addEventListener('mouseleave',handleEnd);
canvas.addEventListener('touchstart',handleStart,{passive:false});canvas.addEventListener('touchmove',handleMove,{passive:false});canvas.addEventListener('touchend',handleEnd);
toolPen.addEventListener('click',function(){setTool('pen')});toolEraser.addEventListener('click',function(){setTool('eraser')});toolRect.addEventListener('click',function(){setTool('rectangle')});toolCircle.addEventListener('click',function(){setTool('circle')});toolLine.addEventListener('click',function(){setTool('line')});toolFill.addEventListener('click',function(){setTool('fill')});
brushSize.addEventListener('input',function(){sizeLabel.textContent=brushSize.value+'px'});
undoBtn.addEventListener('click',undo);clearBtn.addEventListener('click',function(){saveState();ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height)});
saveBtn.addEventListener('click',function(){var link=document.createElement('a');link.download='drawing_'+Date.now()+'.png';link.href=canvas.toDataURL('image/png');link.click()});
window.addEventListener('resize',resizeCanvas);resizeCanvas();setTool('pen');sizeLabel.textContent=brushSize.value+'px';`;

// ═══════════════════════════════════════════════════════════════════════════
// ██  TEMPLATE REGISTRY  ██
// ═══════════════════════════════════════════════════════════════════════════
const TEMPLATES: TemplateInfo[] = [
  {
    keywords: ["테트리스", "tetris", "블록 게임", "블록게임"],
    name: "테트리스", icon: "🧱", description: "클래식 테트리스 — 회전, 홀드, 고스트, 레벨업", category: "game",
    files: { "index.html": { name: "index.html", language: "html", content: TETRIS_HTML }, "style.css": { name: "style.css", language: "css", content: TETRIS_CSS }, "script.js": { name: "script.js", language: "javascript", content: TETRIS_JS } },
  },
  {
    keywords: ["뱀", "스네이크", "snake", "뱀 게임", "뱀게임"],
    name: "뱀 게임", icon: "🐍", description: "클래식 Snake — 점점 빨라지는 속도, 하이스코어", category: "game",
    files: { "index.html": { name: "index.html", language: "html", content: SNAKE_HTML }, "style.css": { name: "style.css", language: "css", content: SNAKE_CSS }, "script.js": { name: "script.js", language: "javascript", content: SNAKE_JS } },
  },
  {
    keywords: ["2048", "이공사팔", "숫자 퍼즐", "숫자퍼즐", "타일 게임"],
    name: "2048", icon: "🔢", description: "2048 퍼즐 — 스와이프, 타일 합치기, 최고점수", category: "game",
    files: { "index.html": { name: "index.html", language: "html", content: GAME_2048_HTML }, "style.css": { name: "style.css", language: "css", content: GAME_2048_CSS }, "script.js": { name: "script.js", language: "javascript", content: GAME_2048_JS } },
  },
  {
    keywords: ["퐁", "pong", "탁구", "탁구 게임", "탁구게임", "핑퐁", "ping pong"],
    name: "Pong", icon: "🏓", description: "Pong — AI 대전, 각도 변화, 난이도 상승", category: "game",
    files: { "index.html": { name: "index.html", language: "html", content: PONG_HTML }, "style.css": { name: "style.css", language: "css", content: PONG_CSS }, "script.js": { name: "script.js", language: "javascript", content: PONG_JS } },
  },
  {
    keywords: ["계산기", "calculator", "공학 계산기", "공학계산기", "과학 계산기"],
    name: "계산기", icon: "🧮", description: "공학용 계산기 — sin/cos/tan, 메모리, 키보드 지원", category: "tool",
    files: { "index.html": { name: "index.html", language: "html", content: CALC_HTML }, "style.css": { name: "style.css", language: "css", content: CALC_CSS }, "script.js": { name: "script.js", language: "javascript", content: CALC_JS } },
  },
  {
    keywords: ["할일", "투두", "todo", "할 일", "할일 관리", "to-do", "체크리스트", "checklist"],
    name: "할일 관리", icon: "✅", description: "Todo App — 드래그 정렬, 필터, 로컬 저장", category: "app",
    files: { "index.html": { name: "index.html", language: "html", content: TODO_HTML }, "style.css": { name: "style.css", language: "css", content: TODO_CSS }, "script.js": { name: "script.js", language: "javascript", content: TODO_JS } },
  },
  {
    keywords: ["그림", "드로잉", "drawing", "그림판", "그림 그리기", "paint", "페인트", "캔버스", "스케치"],
    name: "그림판", icon: "🎨", description: "Drawing App — 펜/도형/채우기, 언두, PNG 저장", category: "tool",
    files: { "index.html": { name: "index.html", language: "html", content: DRAW_HTML }, "style.css": { name: "style.css", language: "css", content: DRAW_CSS }, "script.js": { name: "script.js", language: "javascript", content: DRAW_JS } },
  },
];
