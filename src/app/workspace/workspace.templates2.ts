import type { FilesMap } from "./workspace.constants";

export interface TemplateInfo2 {
  keywords: string[];
  name: string;
  icon: string;
  description: string;
  category: "game" | "app" | "tool";
  files: FilesMap;
}

// ═══════════════════════════════════════════════════════════════════════════
// ██  1. MEMORY CARD  ██
// ═══════════════════════════════════════════════════════════════════════════
var MEMORY_HTML = `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Memory Card</title><link rel="stylesheet" href="style.css"></head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>🃏 Memory Card</h1>
    <div class="stats">
      <span id="tries">시도: 0</span>
      <span id="timer">시간: 0s</span>
      <span id="matched">매칭: 0/8</span>
    </div>
  </div>
  <div id="grid" class="grid"></div>
  <div class="footer">
    <button id="resetBtn">🔄 다시 시작</button>
  </div>
  <div class="overlay hidden" id="winScreen">
    <div class="overlay-box">
      <h2>🎉 클리어!</h2>
      <p id="winMsg"></p>
      <button id="winResetBtn">다시 하기</button>
    </div>
  </div>
</div>
<script src="script.js"></script>
</body></html>`;

var MEMORY_CSS = `*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;background:#0d1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e6edf3}
.wrapper{display:flex;flex-direction:column;align-items:center;min-height:100vh;padding:20px}
.header{text-align:center;margin-bottom:20px}
.header h1{font-size:24px;margin-bottom:10px;color:#58a6ff}
.stats{display:flex;gap:20px;font-size:14px;color:#8b949e}
.stats span{background:rgba(255,255,255,0.06);padding:6px 14px;border-radius:8px}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;max-width:400px;width:100%}
.card{aspect-ratio:1;background:rgba(255,255,255,0.06);border:2px solid rgba(255,255,255,0.1);border-radius:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:36px;transition:transform 0.3s,background 0.3s;perspective:600px;user-select:none}
.card:hover{border-color:#58a6ff;background:rgba(88,166,255,0.08)}
.card.flipped{background:rgba(88,166,255,0.15);border-color:#58a6ff;transform:rotateY(180deg)}
.card.matched{background:rgba(63,185,80,0.15);border-color:#3fb950;cursor:default}
.card .face{display:none}.card.flipped .face,.card.matched .face{display:block}
.card .back{display:block;color:#484f58;font-size:28px}.card.flipped .back,.card.matched .back{display:none}
.footer{margin-top:20px}
button{background:linear-gradient(135deg,#238636,#2ea043);color:#fff;border:none;padding:10px 24px;border-radius:8px;font-size:14px;cursor:pointer;font-family:inherit}
button:hover{filter:brightness(1.15)}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:100}
.overlay.hidden{display:none}
.overlay-box{background:#161b22;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:40px;text-align:center}
.overlay-box h2{font-size:28px;margin-bottom:12px;color:#58a6ff}
.overlay-box p{color:#8b949e;margin-bottom:20px;font-size:14px}`;

var MEMORY_JS = `var emojis = ['🐶','🐱','🐻','🦊','🐼','🐸','🦁','🐧'];
var cards = [];
var flippedCards = [];
var matchedCount = 0;
var tries = 0;
var timerVal = 0;
var timerInterval = null;
var locked = false;

var gridEl = document.getElementById('grid');
var triesEl = document.getElementById('tries');
var timerEl = document.getElementById('timer');
var matchedEl = document.getElementById('matched');
var resetBtn = document.getElementById('resetBtn');
var winScreen = document.getElementById('winScreen');
var winMsg = document.getElementById('winMsg');
var winResetBtn = document.getElementById('winResetBtn');

function shuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerVal = 0;
  timerInterval = setInterval(function() {
    timerVal++;
    timerEl.textContent = '시간: ' + timerVal + 's';
  }, 1000);
}

function stopTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}

function createBoard() {
  gridEl.innerHTML = '';
  cards = shuffle(emojis.concat(emojis));
  matchedCount = 0;
  tries = 0;
  locked = false;
  flippedCards = [];
  triesEl.textContent = '시도: 0';
  matchedEl.textContent = '매칭: 0/8';
  winScreen.classList.add('hidden');
  stopTimer();
  timerEl.textContent = '시간: 0s';

  for (var i = 0; i < cards.length; i++) {
    var card = document.createElement('div');
    card.className = 'card';
    card.setAttribute('data-emoji', cards[i]);
    card.setAttribute('data-index', String(i));
    card.innerHTML = '<span class="back">?</span><span class="face">' + cards[i] + '</span>';
    card.addEventListener('click', onCardClick);
    gridEl.appendChild(card);
  }
}

function onCardClick(e) {
  var card = e.currentTarget;
  if (locked) return;
  if (card.classList.contains('flipped') || card.classList.contains('matched')) return;

  if (tries === 0 && flippedCards.length === 0) startTimer();

  card.classList.add('flipped');
  flippedCards.push(card);

  if (flippedCards.length === 2) {
    tries++;
    triesEl.textContent = '시도: ' + tries;
    locked = true;

    var a = flippedCards[0];
    var b = flippedCards[1];

    if (a.getAttribute('data-emoji') === b.getAttribute('data-emoji')) {
      a.classList.add('matched');
      b.classList.add('matched');
      matchedCount++;
      matchedEl.textContent = '매칭: ' + matchedCount + '/8';
      flippedCards = [];
      locked = false;

      if (matchedCount === 8) {
        stopTimer();
        winMsg.textContent = tries + '번 시도, ' + timerVal + '초 소요!';
        winScreen.classList.remove('hidden');
      }
    } else {
      setTimeout(function() {
        a.classList.remove('flipped');
        b.classList.remove('flipped');
        flippedCards = [];
        locked = false;
      }, 800);
    }
  }
}

resetBtn.addEventListener('click', createBoard);
winResetBtn.addEventListener('click', createBoard);
createBoard();`;

// ═══════════════════════════════════════════════════════════════════════════
// ██  2. TYPING GAME  ██
// ═══════════════════════════════════════════════════════════════════════════
var TYPING_HTML = `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Typing Game</title><link rel="stylesheet" href="style.css"></head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>⌨️ Typing Game</h1>
    <div class="stats">
      <span id="scoreEl">점수: 0</span>
      <span id="wpmEl">WPM: 0</span>
      <span id="lifeEl">❤️ 5</span>
    </div>
  </div>
  <div id="arena" class="arena"></div>
  <div class="input-area">
    <input type="text" id="wordInput" placeholder="단어를 입력하세요..." autofocus />
  </div>
  <div class="overlay" id="startScreen">
    <div class="overlay-box">
      <h2>⌨️ Typing Game</h2>
      <p>위에서 떨어지는 단어를 타이핑하세요!</p>
      <button id="startBtn">▶ 시작</button>
    </div>
  </div>
  <div class="overlay hidden" id="overScreen">
    <div class="overlay-box">
      <h2>💀 Game Over</h2>
      <p id="overMsg"></p>
      <button id="retryBtn">🔄 다시 하기</button>
    </div>
  </div>
</div>
<script src="script.js"></script>
</body></html>`;

var TYPING_CSS = `*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;background:#0d1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e6edf3;overflow:hidden}
.wrapper{display:flex;flex-direction:column;height:100vh}
.header{text-align:center;padding:12px;background:rgba(255,255,255,0.03);border-bottom:1px solid rgba(255,255,255,0.06)}
.header h1{font-size:20px;color:#f0883e;margin-bottom:6px}
.stats{display:flex;gap:16px;justify-content:center;font-size:13px;color:#8b949e}
.stats span{background:rgba(255,255,255,0.06);padding:4px 12px;border-radius:6px}
.arena{flex:1;position:relative;overflow:hidden;background:linear-gradient(180deg,#0d1117 0%,#161b22 100%)}
.word{position:absolute;font-size:18px;font-weight:700;color:#58a6ff;text-shadow:0 0 8px rgba(88,166,255,0.4);white-space:nowrap;transition:none}
.word.highlight{color:#f0883e;text-shadow:0 0 12px rgba(240,136,62,0.6)}
.input-area{padding:12px;background:rgba(255,255,255,0.03);border-top:1px solid rgba(255,255,255,0.06);display:flex;justify-content:center}
#wordInput{width:100%;max-width:400px;padding:10px 16px;background:rgba(255,255,255,0.06);border:2px solid rgba(255,255,255,0.1);border-radius:8px;color:#e6edf3;font-size:16px;font-family:inherit;outline:none}
#wordInput:focus{border-color:#58a6ff}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:100}
.overlay.hidden{display:none}
.overlay-box{background:#161b22;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:40px;text-align:center;min-width:280px}
.overlay-box h2{font-size:24px;margin-bottom:10px;color:#f0883e}
.overlay-box p{color:#8b949e;margin-bottom:16px;font-size:14px}
button{background:linear-gradient(135deg,#f0883e,#da6d25);color:#fff;border:none;padding:10px 24px;border-radius:8px;font-size:14px;cursor:pointer;font-family:inherit}
button:hover{filter:brightness(1.15)}`;

var TYPING_JS = `var WORDS = [
  'apple','banana','cherry','dragon','eagle','flame','grape','house',
  'ivory','jungle','karma','lemon','mango','noble','ocean','piano',
  'queen','river','storm','tiger','ultra','vivid','whale','xenon',
  'yield','zebra','alpha','brave','cloud','delta','ember','frost',
  'ghost','honey','index','joker','knack','lunar','media','nexus'
];

var arena = document.getElementById('arena');
var wordInput = document.getElementById('wordInput');
var scoreEl = document.getElementById('scoreEl');
var wpmEl = document.getElementById('wpmEl');
var lifeEl = document.getElementById('lifeEl');
var startScreen = document.getElementById('startScreen');
var overScreen = document.getElementById('overScreen');
var overMsg = document.getElementById('overMsg');
var startBtn = document.getElementById('startBtn');
var retryBtn = document.getElementById('retryBtn');

var activeWords = [];
var score = 0;
var lives = 5;
var wordsTyped = 0;
var startTime = 0;
var spawnInterval = null;
var moveInterval = null;
var running = false;
var speed = 1.2;
var spawnRate = 2000;
var wordIdCounter = 0;

function randomWord() {
  return WORDS[Math.floor(Math.random() * WORDS.length)];
}

function spawnWord() {
  if (!running) return;
  var w = randomWord();
  var el = document.createElement('div');
  el.className = 'word';
  el.textContent = w;
  var maxX = arena.offsetWidth - 120;
  var xPos = Math.floor(Math.random() * Math.max(maxX, 60));
  el.style.left = xPos + 'px';
  el.style.top = '-30px';
  arena.appendChild(el);
  wordIdCounter++;
  activeWords.push({ el: el, text: w, y: -30, id: wordIdCounter });
}

function moveWords() {
  if (!running) return;
  var arenaH = arena.offsetHeight;
  for (var i = activeWords.length - 1; i >= 0; i--) {
    var obj = activeWords[i];
    obj.y += speed;
    obj.el.style.top = obj.y + 'px';
    if (obj.y > arenaH) {
      obj.el.remove();
      activeWords.splice(i, 1);
      lives--;
      lifeEl.textContent = '❤️ ' + lives;
      if (lives <= 0) { endGame(); return; }
    }
  }
}

function checkInput() {
  var val = wordInput.value.trim().toLowerCase();
  for (var i = 0; i < activeWords.length; i++) {
    if (activeWords[i].text === val) {
      activeWords[i].el.remove();
      activeWords.splice(i, 1);
      score += 10;
      wordsTyped++;
      scoreEl.textContent = '점수: ' + score;
      updateWPM();
      wordInput.value = '';
      return;
    }
  }
  // highlight partial matches
  for (var j = 0; j < activeWords.length; j++) {
    if (activeWords[j].text.indexOf(val) === 0 && val.length > 0) {
      activeWords[j].el.classList.add('highlight');
    } else {
      activeWords[j].el.classList.remove('highlight');
    }
  }
}

function updateWPM() {
  var elapsed = (Date.now() - startTime) / 60000;
  if (elapsed < 0.05) return;
  var wpm = Math.round(wordsTyped / elapsed);
  wpmEl.textContent = 'WPM: ' + wpm;
}

function endGame() {
  running = false;
  if (spawnInterval) clearInterval(spawnInterval);
  if (moveInterval) clearInterval(moveInterval);
  var elapsed = Math.round((Date.now() - startTime) / 1000);
  overMsg.textContent = '점수: ' + score + ' | 단어: ' + wordsTyped + '개 | 시간: ' + elapsed + '초';
  overScreen.classList.remove('hidden');
}

function startGame() {
  startScreen.classList.add('hidden');
  overScreen.classList.add('hidden');
  arena.innerHTML = '';
  activeWords = [];
  score = 0; lives = 5; wordsTyped = 0; speed = 1.2; spawnRate = 2000; wordIdCounter = 0;
  scoreEl.textContent = '점수: 0';
  wpmEl.textContent = 'WPM: 0';
  lifeEl.textContent = '❤️ 5';
  wordInput.value = '';
  wordInput.focus();
  running = true;
  startTime = Date.now();

  spawnWord();
  spawnInterval = setInterval(function() {
    spawnWord();
    // increase difficulty
    if (speed < 3) speed += 0.02;
    if (spawnRate > 800) {
      spawnRate -= 20;
      clearInterval(spawnInterval);
      spawnInterval = setInterval(arguments.callee, spawnRate);
    }
  }, spawnRate);
  moveInterval = setInterval(moveWords, 30);
}

wordInput.addEventListener('input', checkInput);
startBtn.addEventListener('click', startGame);
retryBtn.addEventListener('click', startGame);`;

// ═══════════════════════════════════════════════════════════════════════════
// ██  3. POMODORO TIMER  ██
// ═══════════════════════════════════════════════════════════════════════════
var POMODORO_HTML = `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Pomodoro Timer</title><link rel="stylesheet" href="style.css"></head>
<body>
<div class="wrapper">
  <h1>🍅 Pomodoro Timer</h1>
  <div class="timer-container">
    <svg class="progress-ring" width="260" height="260">
      <circle class="progress-bg" cx="130" cy="130" r="116" />
      <circle class="progress-bar" id="progressBar" cx="130" cy="130" r="116" />
    </svg>
    <div class="timer-display">
      <div id="modeLabel" class="mode-label">집중</div>
      <div id="timeDisplay" class="time-text">25:00</div>
    </div>
  </div>
  <div class="controls">
    <button id="startBtn" class="btn btn-start">▶ 시작</button>
    <button id="stopBtn" class="btn btn-stop" disabled>⏸ 정지</button>
    <button id="resetBtn" class="btn btn-reset">↺ 리셋</button>
  </div>
  <div class="session-info">
    <span id="sessionCount">세션: 0</span>
    <span id="totalTime">총 집중: 0분</span>
  </div>
  <div class="mode-buttons">
    <button class="mode-btn active" data-mode="work">집중 25분</button>
    <button class="mode-btn" data-mode="short">휴식 5분</button>
    <button class="mode-btn" data-mode="long">긴 휴식 15분</button>
  </div>
</div>
<script src="script.js"></script>
</body></html>`;

var POMODORO_CSS = `*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;background:#0d1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e6edf3}
.wrapper{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:20px;gap:24px}
h1{font-size:24px;color:#f85149}
.timer-container{position:relative;width:260px;height:260px;display:flex;align-items:center;justify-content:center}
.progress-ring{position:absolute;transform:rotate(-90deg)}
.progress-bg{fill:none;stroke:rgba(255,255,255,0.06);stroke-width:8}
.progress-bar{fill:none;stroke:#f85149;stroke-width:8;stroke-linecap:round;stroke-dasharray:729.12;stroke-dashoffset:0;transition:stroke-dashoffset 0.5s linear,stroke 0.3s}
.timer-display{position:relative;text-align:center}
.mode-label{font-size:14px;color:#8b949e;margin-bottom:4px;text-transform:uppercase;letter-spacing:2px}
.time-text{font-size:52px;font-weight:800;font-variant-numeric:tabular-nums;color:#e6edf3}
.controls{display:flex;gap:12px}
.btn{padding:10px 20px;border:none;border-radius:8px;font-size:14px;cursor:pointer;font-family:inherit;font-weight:600;transition:filter 0.15s}
.btn:disabled{opacity:0.4;cursor:default}
.btn:hover:not(:disabled){filter:brightness(1.15)}
.btn-start{background:#238636;color:#fff}
.btn-stop{background:#da3633;color:#fff}
.btn-reset{background:rgba(255,255,255,0.08);color:#8b949e;border:1px solid rgba(255,255,255,0.1)}
.session-info{display:flex;gap:20px;font-size:13px;color:#8b949e}
.session-info span{background:rgba(255,255,255,0.06);padding:6px 14px;border-radius:6px}
.mode-buttons{display:flex;gap:8px}
.mode-btn{padding:8px 16px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:6px;color:#8b949e;font-size:12px;cursor:pointer;font-family:inherit;transition:all 0.15s}
.mode-btn.active{background:rgba(248,81,73,0.15);border-color:#f85149;color:#f85149}
.mode-btn:hover{border-color:#f85149}`;

var POMODORO_JS = `var CIRCUMFERENCE = 2 * Math.PI * 116; // 729.12
var MODES = { work: 25 * 60, short: 5 * 60, long: 15 * 60 };
var currentMode = 'work';
var totalSeconds = MODES.work;
var remaining = totalSeconds;
var timerInterval = null;
var isRunning = false;
var sessions = 0;
var totalFocusMin = 0;

var progressBar = document.getElementById('progressBar');
var timeDisplay = document.getElementById('timeDisplay');
var modeLabel = document.getElementById('modeLabel');
var startBtn = document.getElementById('startBtn');
var stopBtn = document.getElementById('stopBtn');
var resetBtn = document.getElementById('resetBtn');
var sessionCount = document.getElementById('sessionCount');
var totalTime = document.getElementById('totalTime');
var modeBtns = document.querySelectorAll('.mode-btn');

progressBar.style.strokeDasharray = CIRCUMFERENCE;
progressBar.style.strokeDashoffset = '0';

function formatTime(s) {
  var m = Math.floor(s / 60);
  var sec = s % 60;
  return (m < 10 ? '0' : '') + m + ':' + (sec < 10 ? '0' : '') + sec;
}

function updateDisplay() {
  timeDisplay.textContent = formatTime(remaining);
  var progress = 1 - (remaining / totalSeconds);
  var offset = progress * CIRCUMFERENCE;
  progressBar.style.strokeDashoffset = offset;
}

function tick() {
  if (remaining <= 0) {
    clearInterval(timerInterval);
    timerInterval = null;
    isRunning = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    startBtn.textContent = '▶ 시작';

    if (currentMode === 'work') {
      sessions++;
      totalFocusMin += Math.round(totalSeconds / 60);
      sessionCount.textContent = '세션: ' + sessions;
      totalTime.textContent = '총 집중: ' + totalFocusMin + '분';
      // auto switch to break
      if (sessions % 4 === 0) {
        setMode('long');
      } else {
        setMode('short');
      }
    } else {
      setMode('work');
    }
    return;
  }
  remaining--;
  updateDisplay();
}

function startTimer() {
  if (isRunning) return;
  isRunning = true;
  startBtn.disabled = true;
  stopBtn.disabled = false;
  startBtn.textContent = '⏳ 진행중';
  timerInterval = setInterval(tick, 1000);
}

function stopTimer() {
  if (!isRunning) return;
  isRunning = false;
  clearInterval(timerInterval);
  timerInterval = null;
  startBtn.disabled = false;
  stopBtn.disabled = true;
  startBtn.textContent = '▶ 계속';
}

function resetTimer() {
  stopTimer();
  remaining = totalSeconds;
  startBtn.textContent = '▶ 시작';
  updateDisplay();
}

function setMode(mode) {
  if (isRunning) stopTimer();
  currentMode = mode;
  totalSeconds = MODES[mode];
  remaining = totalSeconds;

  var labels = { work: '집중', short: '휴식', long: '긴 휴식' };
  modeLabel.textContent = labels[mode];

  var colors = { work: '#f85149', short: '#3fb950', long: '#58a6ff' };
  progressBar.style.stroke = colors[mode];

  for (var i = 0; i < modeBtns.length; i++) {
    modeBtns[i].classList.toggle('active', modeBtns[i].getAttribute('data-mode') === mode);
  }
  startBtn.textContent = '▶ 시작';
  updateDisplay();
}

startBtn.addEventListener('click', startTimer);
stopBtn.addEventListener('click', stopTimer);
resetBtn.addEventListener('click', resetTimer);

for (var i = 0; i < modeBtns.length; i++) {
  modeBtns[i].addEventListener('click', function() {
    setMode(this.getAttribute('data-mode'));
  });
}

updateDisplay();`;

// ═══════════════════════════════════════════════════════════════════════════
// ██  4. WEATHER APP  ██
// ═══════════════════════════════════════════════════════════════════════════
var WEATHER_HTML = `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Weather App</title><link rel="stylesheet" href="style.css"></head>
<body>
<div class="wrapper">
  <h1>🌦️ Weather</h1>
  <div class="city-list" id="cityList"></div>
  <div class="weather-card" id="weatherCard">
    <div class="weather-icon" id="weatherIcon">🌤️</div>
    <div class="city-name" id="cityName">서울</div>
    <div class="temp" id="temp">-°C</div>
    <div class="desc" id="desc">도시를 선택하세요</div>
    <div class="details">
      <div class="detail-item"><span class="detail-label">습도</span><span class="detail-val" id="humidity">-</span></div>
      <div class="detail-item"><span class="detail-label">풍속</span><span class="detail-val" id="wind">-</span></div>
      <div class="detail-item"><span class="detail-label">체감</span><span class="detail-val" id="feels">-</span></div>
    </div>
  </div>
  <div class="forecast" id="forecast"></div>
</div>
<script src="script.js"></script>
</body></html>`;

var WEATHER_CSS = `*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;background:#0d1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e6edf3}
.wrapper{display:flex;flex-direction:column;align-items:center;min-height:100vh;padding:24px;gap:20px}
h1{font-size:24px;color:#58a6ff}
.city-list{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
.city-btn{padding:8px 18px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:20px;color:#8b949e;font-size:13px;cursor:pointer;font-family:inherit;transition:all 0.15s}
.city-btn.active{background:rgba(88,166,255,0.15);border-color:#58a6ff;color:#58a6ff}
.city-btn:hover{border-color:#58a6ff;color:#58a6ff}
.weather-card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:32px;text-align:center;width:100%;max-width:360px;backdrop-filter:blur(10px)}
.weather-icon{font-size:64px;margin-bottom:8px}
.city-name{font-size:22px;font-weight:700;margin-bottom:4px}
.temp{font-size:48px;font-weight:800;color:#58a6ff;margin-bottom:4px}
.desc{font-size:14px;color:#8b949e;margin-bottom:20px}
.details{display:flex;justify-content:space-around;border-top:1px solid rgba(255,255,255,0.06);padding-top:16px}
.detail-item{display:flex;flex-direction:column;align-items:center;gap:4px}
.detail-label{font-size:11px;color:#484f58;text-transform:uppercase;letter-spacing:1px}
.detail-val{font-size:16px;font-weight:600}
.forecast{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;max-width:400px;width:100%}
.forecast-item{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:12px;text-align:center;min-width:70px;flex:1}
.forecast-day{font-size:11px;color:#8b949e;margin-bottom:4px}
.forecast-icon{font-size:24px;margin-bottom:4px}
.forecast-temp{font-size:14px;font-weight:600}`;

var WEATHER_JS = `var CITIES = {
  '서울': {
    icon: '🌤️', temp: 12, humidity: 55, wind: 3.2, feels: 10, desc: '대체로 맑음',
    forecast: [
      { day: '내일', icon: '☁️', temp: 10 },
      { day: '모레', icon: '🌧️', temp: 8 },
      { day: '수', icon: '⛅', temp: 11 },
      { day: '목', icon: '🌤️', temp: 14 }
    ]
  },
  '뉴욕': {
    icon: '☁️', temp: 8, humidity: 62, wind: 5.1, feels: 5, desc: '흐림',
    forecast: [
      { day: '내일', icon: '🌧️', temp: 6 },
      { day: '모레', icon: '🌧️', temp: 5 },
      { day: '수', icon: '⛅', temp: 9 },
      { day: '목', icon: '🌤️', temp: 11 }
    ]
  },
  '도쿄': {
    icon: '⛅', temp: 15, humidity: 48, wind: 2.8, feels: 14, desc: '구름 조금',
    forecast: [
      { day: '내일', icon: '🌤️', temp: 17 },
      { day: '모레', icon: '🌤️', temp: 18 },
      { day: '수', icon: '☁️', temp: 14 },
      { day: '목', icon: '🌧️', temp: 12 }
    ]
  },
  '런던': {
    icon: '🌧️', temp: 6, humidity: 78, wind: 6.4, feels: 3, desc: '비',
    forecast: [
      { day: '내일', icon: '🌧️', temp: 5 },
      { day: '모레', icon: '☁️', temp: 7 },
      { day: '수', icon: '⛅', temp: 8 },
      { day: '목', icon: '🌤️', temp: 10 }
    ]
  },
  '파리': {
    icon: '🌥️', temp: 9, humidity: 65, wind: 4.0, feels: 7, desc: '흐리고 바람',
    forecast: [
      { day: '내일', icon: '☁️', temp: 8 },
      { day: '모레', icon: '🌤️', temp: 11 },
      { day: '수', icon: '🌤️', temp: 13 },
      { day: '목', icon: '⛅', temp: 10 }
    ]
  }
};

var cityList = document.getElementById('cityList');
var weatherIcon = document.getElementById('weatherIcon');
var cityName = document.getElementById('cityName');
var tempEl = document.getElementById('temp');
var descEl = document.getElementById('desc');
var humidityEl = document.getElementById('humidity');
var windEl = document.getElementById('wind');
var feelsEl = document.getElementById('feels');
var forecastEl = document.getElementById('forecast');
var currentCity = null;

function selectCity(name) {
  currentCity = name;
  var data = CITIES[name];
  weatherIcon.textContent = data.icon;
  cityName.textContent = name;
  tempEl.textContent = data.temp + '°C';
  descEl.textContent = data.desc;
  humidityEl.textContent = data.humidity + '%';
  windEl.textContent = data.wind + ' m/s';
  feelsEl.textContent = data.feels + '°C';

  forecastEl.innerHTML = '';
  for (var i = 0; i < data.forecast.length; i++) {
    var f = data.forecast[i];
    var div = document.createElement('div');
    div.className = 'forecast-item';
    div.innerHTML = '<div class="forecast-day">' + f.day + '</div>'
      + '<div class="forecast-icon">' + f.icon + '</div>'
      + '<div class="forecast-temp">' + f.temp + '°C</div>';
    forecastEl.appendChild(div);
  }

  var btns = document.querySelectorAll('.city-btn');
  for (var j = 0; j < btns.length; j++) {
    btns[j].classList.toggle('active', btns[j].textContent === name);
  }
}

function init() {
  var names = Object.keys(CITIES);
  for (var i = 0; i < names.length; i++) {
    var btn = document.createElement('button');
    btn.className = 'city-btn';
    btn.textContent = names[i];
    btn.addEventListener('click', function() { selectCity(this.textContent); });
    cityList.appendChild(btn);
  }
  selectCity(names[0]);
}

init();`;

// ═══════════════════════════════════════════════════════════════════════════
// ██  5. CHAT APP  ██
// ═══════════════════════════════════════════════════════════════════════════
var CHAT_HTML = `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Chat App</title><link rel="stylesheet" href="style.css"></head>
<body>
<div class="chat-wrapper">
  <div class="chat-header">
    <div class="avatar bot-avatar">🤖</div>
    <div class="header-info">
      <div class="header-name">Dalkak Bot</div>
      <div class="header-status" id="statusEl">온라인</div>
    </div>
  </div>
  <div class="messages" id="messages">
    <div class="msg received">
      <div class="msg-bubble">안녕하세요! 무엇이든 물어보세요 💬</div>
      <div class="msg-time">지금</div>
    </div>
  </div>
  <div class="chat-input-area">
    <input type="text" id="chatInput" placeholder="메시지를 입력하세요..." />
    <button id="sendBtn">전송</button>
  </div>
</div>
<script src="script.js"></script>
</body></html>`;

var CHAT_CSS = `*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;background:#0d1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e6edf3}
.chat-wrapper{display:flex;flex-direction:column;height:100vh;max-width:480px;margin:0 auto;border-left:1px solid rgba(255,255,255,0.06);border-right:1px solid rgba(255,255,255,0.06)}
.chat-header{display:flex;align-items:center;gap:12px;padding:14px 16px;background:rgba(255,255,255,0.03);border-bottom:1px solid rgba(255,255,255,0.06)}
.avatar{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px}
.bot-avatar{background:rgba(88,166,255,0.15)}
.header-name{font-size:15px;font-weight:600}
.header-status{font-size:11px;color:#3fb950}
.messages{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px}
.msg{display:flex;flex-direction:column;max-width:75%}
.msg.sent{align-self:flex-end;align-items:flex-end}
.msg.received{align-self:flex-start;align-items:flex-start}
.msg-bubble{padding:10px 14px;border-radius:16px;font-size:14px;line-height:1.5;word-wrap:break-word}
.sent .msg-bubble{background:linear-gradient(135deg,#238636,#2ea043);color:#fff;border-bottom-right-radius:4px}
.received .msg-bubble{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);border-bottom-left-radius:4px}
.msg-time{font-size:10px;color:#484f58;margin-top:4px;padding:0 4px}
.typing{color:#8b949e;font-size:13px;font-style:italic;padding:4px 0}
.chat-input-area{display:flex;gap:8px;padding:12px 16px;background:rgba(255,255,255,0.03);border-top:1px solid rgba(255,255,255,0.06)}
#chatInput{flex:1;padding:10px 14px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:20px;color:#e6edf3;font-size:14px;font-family:inherit;outline:none}
#chatInput:focus{border-color:#58a6ff}
#sendBtn{padding:10px 20px;background:#238636;color:#fff;border:none;border-radius:20px;font-size:14px;cursor:pointer;font-family:inherit;font-weight:600}
#sendBtn:hover{filter:brightness(1.15)}
.messages::-webkit-scrollbar{width:4px}
.messages::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px}`;

var CHAT_JS = `var BOT_REPLIES = [
  '흥미롭네요! 더 자세히 알려주세요.',
  '그렇군요! 저도 비슷한 생각이에요.',
  '좋은 질문이네요! 생각해볼게요.',
  '와, 재밌는 이야기네요!',
  '네, 맞아요. 동감합니다!',
  '오, 정말요? 처음 알았어요.',
  '그건 좋은 아이디어예요!',
  '음, 조금 더 생각해봐야 할 것 같아요.',
  '완전 공감해요! 👍',
  '하하, 재밌네요! 😄',
  '그 부분은 좀 더 알아봐야 할 것 같아요.',
  '오늘 날씨가 참 좋죠? ☀️'
];

var messages = document.getElementById('messages');
var chatInput = document.getElementById('chatInput');
var sendBtn = document.getElementById('sendBtn');
var statusEl = document.getElementById('statusEl');

function getTime() {
  var now = new Date();
  var h = now.getHours();
  var m = now.getMinutes();
  var ampm = h >= 12 ? '오후' : '오전';
  h = h % 12; if (h === 0) h = 12;
  return ampm + ' ' + h + ':' + (m < 10 ? '0' : '') + m;
}

function addMessage(text, type) {
  var msg = document.createElement('div');
  msg.className = 'msg ' + type;
  msg.innerHTML = '<div class="msg-bubble">' + escapeHtml(text) + '</div>'
    + '<div class="msg-time">' + getTime() + '</div>';
  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
}

function escapeHtml(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function showTyping() {
  var typing = document.createElement('div');
  typing.className = 'typing';
  typing.id = 'typingIndicator';
  typing.textContent = 'Dalkak Bot이 입력 중...';
  messages.appendChild(typing);
  messages.scrollTop = messages.scrollHeight;
  statusEl.textContent = '입력 중...';
}

function hideTyping() {
  var el = document.getElementById('typingIndicator');
  if (el) el.remove();
  statusEl.textContent = '온라인';
}

function botReply() {
  showTyping();
  var delay = 1000 + Math.floor(Math.random() * 1500);
  setTimeout(function() {
    hideTyping();
    var reply = BOT_REPLIES[Math.floor(Math.random() * BOT_REPLIES.length)];
    addMessage(reply, 'received');
  }, delay);
}

function sendMessage() {
  var text = chatInput.value.trim();
  if (!text) return;
  addMessage(text, 'sent');
  chatInput.value = '';
  chatInput.focus();
  botReply();
}

sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') sendMessage();
});
chatInput.focus();`;

// ═══════════════════════════════════════════════════════════════════════════
// ██  6. NOTES APP  ██
// ═══════════════════════════════════════════════════════════════════════════
var NOTES_HTML = `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Notes App</title><link rel="stylesheet" href="style.css"></head>
<body>
<div class="app">
  <div class="sidebar">
    <div class="sidebar-header">
      <h2>📝 메모</h2>
      <button id="newBtn" class="icon-btn" title="새 메모">+</button>
    </div>
    <input type="text" id="searchInput" placeholder="🔍 검색..." />
    <div id="noteList" class="note-list"></div>
  </div>
  <div class="editor">
    <div class="editor-header">
      <input type="text" id="titleInput" placeholder="제목 없음" />
      <button id="deleteBtn" class="icon-btn danger" title="삭제">🗑️</button>
    </div>
    <textarea id="contentArea" placeholder="내용을 입력하세요..."></textarea>
    <div class="editor-footer" id="footer">메모를 선택하거나 새로 만드세요</div>
  </div>
</div>
<script src="script.js"></script>
</body></html>`;

var NOTES_CSS = `*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;background:#0d1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e6edf3}
.app{display:flex;height:100vh}
.sidebar{width:260px;background:rgba(255,255,255,0.02);border-right:1px solid rgba(255,255,255,0.06);display:flex;flex-direction:column;flex-shrink:0}
.sidebar-header{display:flex;align-items:center;justify-content:space-between;padding:14px 12px}
.sidebar-header h2{font-size:16px;color:#58a6ff}
.icon-btn{width:32px;height:32px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.1);border-radius:6px;color:#e6edf3;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center}
.icon-btn:hover{background:rgba(255,255,255,0.12)}
.icon-btn.danger:hover{background:rgba(248,81,73,0.2);border-color:#f85149}
#searchInput{margin:0 12px 8px;padding:8px 10px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:6px;color:#e6edf3;font-size:13px;outline:none;font-family:inherit}
#searchInput:focus{border-color:#58a6ff}
.note-list{flex:1;overflow-y:auto;padding:0 8px}
.note-item{padding:10px;border-radius:6px;cursor:pointer;margin-bottom:4px;transition:background 0.12s}
.note-item:hover{background:rgba(255,255,255,0.04)}
.note-item.active{background:rgba(88,166,255,0.12);border-left:3px solid #58a6ff}
.note-item-title{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.note-item-preview{font-size:11px;color:#484f58;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}
.note-item-date{font-size:10px;color:#30363d;margin-top:2px}
.editor{flex:1;display:flex;flex-direction:column}
.editor-header{display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.06)}
#titleInput{flex:1;padding:8px;background:transparent;border:none;color:#e6edf3;font-size:18px;font-weight:700;font-family:inherit;outline:none}
#contentArea{flex:1;padding:16px;background:transparent;border:none;color:#c9d1d9;font-size:14px;line-height:1.7;font-family:inherit;resize:none;outline:none}
.editor-footer{padding:8px 16px;font-size:11px;color:#484f58;border-top:1px solid rgba(255,255,255,0.06)}
.note-list::-webkit-scrollbar{width:4px}
.note-list::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px}
@media(max-width:600px){.sidebar{width:200px}}`;

var NOTES_JS = `var STORAGE_KEY = 'f9_notes_v1';
var notes = [];
var activeId = null;
var saveTimeout = null;

var noteList = document.getElementById('noteList');
var newBtn = document.getElementById('newBtn');
var deleteBtn = document.getElementById('deleteBtn');
var searchInput = document.getElementById('searchInput');
var titleInput = document.getElementById('titleInput');
var contentArea = document.getElementById('contentArea');
var footer = document.getElementById('footer');

function loadNotes() {
  try {
    var data = localStorage.getItem(STORAGE_KEY);
    notes = data ? JSON.parse(data) : [];
  } catch(e) { notes = []; }
}

function saveNotes() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(notes)); } catch(e) {}
}

function generateId() {
  return 'n_' + Date.now() + '_' + Math.floor(Math.random() * 9999);
}

function formatDate(ts) {
  var d = new Date(ts);
  var m = d.getMonth() + 1;
  var day = d.getDate();
  var h = d.getHours();
  var min = d.getMinutes();
  return m + '/' + day + ' ' + (h < 10 ? '0' : '') + h + ':' + (min < 10 ? '0' : '') + min;
}

function getActiveNote() {
  if (!activeId) return null;
  for (var i = 0; i < notes.length; i++) {
    if (notes[i].id === activeId) return notes[i];
  }
  return null;
}

function renderList(filter) {
  noteList.innerHTML = '';
  var q = (filter || '').toLowerCase();
  var sorted = notes.slice().sort(function(a, b) { return b.updatedAt - a.updatedAt; });

  for (var i = 0; i < sorted.length; i++) {
    var note = sorted[i];
    if (q && note.title.toLowerCase().indexOf(q) === -1 && note.content.toLowerCase().indexOf(q) === -1) continue;

    var div = document.createElement('div');
    div.className = 'note-item' + (note.id === activeId ? ' active' : '');
    div.setAttribute('data-id', note.id);

    var title = note.title || '제목 없음';
    var preview = note.content ? note.content.substring(0, 40) : '내용 없음';

    div.innerHTML = '<div class="note-item-title">' + escHtml(title) + '</div>'
      + '<div class="note-item-preview">' + escHtml(preview) + '</div>'
      + '<div class="note-item-date">' + formatDate(note.updatedAt) + '</div>';
    div.addEventListener('click', function() {
      selectNote(this.getAttribute('data-id'));
    });
    noteList.appendChild(div);
  }
}

function escHtml(s) {
  var d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function selectNote(id) {
  activeId = id;
  var note = getActiveNote();
  if (note) {
    titleInput.value = note.title;
    contentArea.value = note.content;
    footer.textContent = '수정: ' + formatDate(note.updatedAt) + ' | ' + note.content.length + '자';
  }
  renderList(searchInput.value);
}

function createNote() {
  var note = {
    id: generateId(),
    title: '',
    content: '',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  notes.push(note);
  saveNotes();
  selectNote(note.id);
  titleInput.focus();
}

function deleteNote() {
  if (!activeId) return;
  for (var i = 0; i < notes.length; i++) {
    if (notes[i].id === activeId) { notes.splice(i, 1); break; }
  }
  saveNotes();
  activeId = notes.length > 0 ? notes[0].id : null;
  if (activeId) { selectNote(activeId); } else {
    titleInput.value = '';
    contentArea.value = '';
    footer.textContent = '메모를 선택하거나 새로 만드세요';
  }
  renderList(searchInput.value);
}

function onEdit() {
  var note = getActiveNote();
  if (!note) return;
  note.title = titleInput.value;
  note.content = contentArea.value;
  note.updatedAt = Date.now();
  footer.textContent = '수정: ' + formatDate(note.updatedAt) + ' | ' + note.content.length + '자';
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(function() {
    saveNotes();
    renderList(searchInput.value);
  }, 400);
}

newBtn.addEventListener('click', createNote);
deleteBtn.addEventListener('click', deleteNote);
titleInput.addEventListener('input', onEdit);
contentArea.addEventListener('input', onEdit);
searchInput.addEventListener('input', function() {
  renderList(this.value);
});

loadNotes();
if (notes.length === 0) createNote();
else selectNote(notes[0].id);
renderList('');`;

// ═══════════════════════════════════════════════════════════════════════════
// ██  7. STOPWATCH  ██
// ═══════════════════════════════════════════════════════════════════════════
var STOPWATCH_HTML = `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Stopwatch</title><link rel="stylesheet" href="style.css"></head>
<body>
<div class="wrapper">
  <h1>⏱️ Stopwatch</h1>
  <div class="display" id="display">00:00:00<span class="ms">.000</span></div>
  <div class="controls">
    <button id="startBtn" class="btn btn-start">▶ 시작</button>
    <button id="lapBtn" class="btn btn-lap" disabled>🏁 랩</button>
    <button id="resetBtn" class="btn btn-reset">↺ 리셋</button>
  </div>
  <div class="laps-container">
    <div class="laps-header" id="lapsHeader" style="display:none">
      <span>랩</span><span>구간</span><span>전체</span>
    </div>
    <div id="lapList" class="lap-list"></div>
  </div>
</div>
<script src="script.js"></script>
</body></html>`;

var STOPWATCH_CSS = `*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;background:#0d1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e6edf3}
.wrapper{display:flex;flex-direction:column;align-items:center;min-height:100vh;padding:40px 20px;gap:24px}
h1{font-size:24px;color:#f0883e}
.display{font-size:56px;font-weight:800;font-variant-numeric:tabular-nums;color:#e6edf3;letter-spacing:2px}
.ms{font-size:32px;color:#8b949e}
.controls{display:flex;gap:12px}
.btn{padding:12px 24px;border:none;border-radius:10px;font-size:15px;cursor:pointer;font-family:inherit;font-weight:600;transition:filter 0.15s,transform 0.1s;min-width:100px}
.btn:disabled{opacity:0.3;cursor:default}
.btn:hover:not(:disabled){filter:brightness(1.15);transform:translateY(-1px)}
.btn-start{background:#238636;color:#fff}
.btn-start.running{background:#da3633}
.btn-lap{background:rgba(88,166,255,0.15);color:#58a6ff;border:1px solid rgba(88,166,255,0.3)}
.btn-reset{background:rgba(255,255,255,0.08);color:#8b949e;border:1px solid rgba(255,255,255,0.1)}
.laps-container{width:100%;max-width:440px}
.laps-header{display:flex;justify-content:space-between;padding:8px 12px;font-size:11px;color:#484f58;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid rgba(255,255,255,0.06)}
.lap-list{max-height:300px;overflow-y:auto}
.lap-item{display:flex;justify-content:space-between;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.04);font-size:14px;font-variant-numeric:tabular-nums}
.lap-item:first-child{background:rgba(255,255,255,0.03)}
.lap-num{color:#8b949e;min-width:50px}
.lap-split{color:#f0883e;min-width:120px}
.lap-total{color:#e6edf3;min-width:120px;text-align:right}
.lap-item.best .lap-split{color:#3fb950}
.lap-item.worst .lap-split{color:#f85149}
.lap-list::-webkit-scrollbar{width:4px}
.lap-list::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:2px}`;

var STOPWATCH_JS = `var startTime = 0;
var elapsed = 0;
var animId = null;
var running = false;
var laps = [];
var lastLapTime = 0;

var display = document.getElementById('display');
var startBtn = document.getElementById('startBtn');
var lapBtn = document.getElementById('lapBtn');
var resetBtn = document.getElementById('resetBtn');
var lapList = document.getElementById('lapList');
var lapsHeader = document.getElementById('lapsHeader');

function formatTime(ms) {
  var totalMs = ms;
  var hours = Math.floor(totalMs / 3600000);
  totalMs %= 3600000;
  var mins = Math.floor(totalMs / 60000);
  totalMs %= 60000;
  var secs = Math.floor(totalMs / 1000);
  var millis = totalMs % 1000;
  return (hours < 10 ? '0' : '') + hours + ':'
    + (mins < 10 ? '0' : '') + mins + ':'
    + (secs < 10 ? '0' : '') + secs
    + '.' + (millis < 100 ? '0' : '') + (millis < 10 ? '0' : '') + millis;
}

function formatDisplay(ms) {
  var totalMs = ms;
  var hours = Math.floor(totalMs / 3600000);
  totalMs %= 3600000;
  var mins = Math.floor(totalMs / 60000);
  totalMs %= 60000;
  var secs = Math.floor(totalMs / 1000);
  var millis = totalMs % 1000;
  return (hours < 10 ? '0' : '') + hours + ':'
    + (mins < 10 ? '0' : '') + mins + ':'
    + (secs < 10 ? '0' : '') + secs
    + '<span class="ms">.' + (millis < 100 ? '0' : '') + (millis < 10 ? '0' : '') + millis + '</span>';
}

function update() {
  elapsed = Date.now() - startTime;
  display.innerHTML = formatDisplay(elapsed);
  animId = requestAnimationFrame(update);
}

function start() {
  if (running) {
    // stop
    running = false;
    cancelAnimationFrame(animId);
    elapsed = Date.now() - startTime;
    startBtn.textContent = '▶ 계속';
    startBtn.classList.remove('running');
    lapBtn.disabled = true;
  } else {
    // start
    running = true;
    startTime = Date.now() - elapsed;
    startBtn.textContent = '⏸ 정지';
    startBtn.classList.add('running');
    lapBtn.disabled = false;
    update();
  }
}

function lap() {
  if (!running) return;
  var currentElapsed = Date.now() - startTime;
  var splitTime = currentElapsed - lastLapTime;
  lastLapTime = currentElapsed;
  laps.unshift({ split: splitTime, total: currentElapsed });
  renderLaps();
}

function reset() {
  running = false;
  if (animId) cancelAnimationFrame(animId);
  elapsed = 0;
  lastLapTime = 0;
  laps = [];
  startTime = 0;
  display.innerHTML = '00:00:00<span class="ms">.000</span>';
  startBtn.textContent = '▶ 시작';
  startBtn.classList.remove('running');
  lapBtn.disabled = true;
  lapList.innerHTML = '';
  lapsHeader.style.display = 'none';
}

function renderLaps() {
  lapList.innerHTML = '';
  if (laps.length === 0) { lapsHeader.style.display = 'none'; return; }
  lapsHeader.style.display = 'flex';

  var bestIdx = 0, worstIdx = 0;
  for (var i = 1; i < laps.length; i++) {
    if (laps[i].split < laps[bestIdx].split) bestIdx = i;
    if (laps[i].split > laps[worstIdx].split) worstIdx = i;
  }

  for (var j = 0; j < laps.length; j++) {
    var lapNum = laps.length - j;
    var cls = 'lap-item';
    if (laps.length >= 3) {
      if (j === bestIdx) cls += ' best';
      else if (j === worstIdx) cls += ' worst';
    }
    var div = document.createElement('div');
    div.className = cls;
    div.innerHTML = '<span class="lap-num">#' + lapNum + '</span>'
      + '<span class="lap-split">' + formatTime(laps[j].split) + '</span>'
      + '<span class="lap-total">' + formatTime(laps[j].total) + '</span>';
    lapList.appendChild(div);
  }
}

startBtn.addEventListener('click', start);
lapBtn.addEventListener('click', lap);
resetBtn.addEventListener('click', reset);`;

// ═══════════════════════════════════════════════════════════════════════════
// ██  8. COLOR PICKER  ██
// ═══════════════════════════════════════════════════════════════════════════
var COLORPICKER_HTML = `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Color Picker</title><link rel="stylesheet" href="style.css"></head>
<body>
<div class="wrapper">
  <h1>🎨 Color Picker</h1>
  <div class="picker-card">
    <div class="preview" id="preview"></div>
    <div class="values">
      <div class="value-row">
        <span class="value-label">HEX</span>
        <span class="value-text" id="hexVal">#FF6600</span>
        <button class="copy-btn" data-target="hexVal">📋</button>
      </div>
      <div class="value-row">
        <span class="value-label">RGB</span>
        <span class="value-text" id="rgbVal">rgb(255, 102, 0)</span>
        <button class="copy-btn" data-target="rgbVal">📋</button>
      </div>
      <div class="value-row">
        <span class="value-label">HSL</span>
        <span class="value-text" id="hslVal">hsl(24, 100%, 50%)</span>
        <button class="copy-btn" data-target="hslVal">📋</button>
      </div>
    </div>
    <div class="sliders">
      <div class="slider-row">
        <label>R</label>
        <input type="range" id="rSlider" min="0" max="255" value="255" class="slider red-slider" />
        <span id="rVal" class="slider-val">255</span>
      </div>
      <div class="slider-row">
        <label>G</label>
        <input type="range" id="gSlider" min="0" max="255" value="102" class="slider green-slider" />
        <span id="gVal" class="slider-val">102</span>
      </div>
      <div class="slider-row">
        <label>B</label>
        <input type="range" id="bSlider" min="0" max="255" value="0" class="slider blue-slider" />
        <span id="bVal" class="slider-val">0</span>
      </div>
    </div>
    <div class="hex-input-row">
      <input type="text" id="hexInput" value="#FF6600" maxlength="7" placeholder="#000000" />
      <button id="applyHex" class="apply-btn">적용</button>
    </div>
  </div>
  <div class="recent-section">
    <h3>최근 색상</h3>
    <div id="recentColors" class="recent-colors"></div>
  </div>
</div>
<script src="script.js"></script>
</body></html>`;

var COLORPICKER_CSS = `*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;background:#0d1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e6edf3}
.wrapper{display:flex;flex-direction:column;align-items:center;min-height:100vh;padding:30px 20px;gap:24px}
h1{font-size:24px;color:#d2a8ff}
.picker-card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:24px;width:100%;max-width:380px}
.preview{width:100%;height:120px;border-radius:12px;margin-bottom:20px;border:2px solid rgba(255,255,255,0.1);transition:background 0.15s}
.values{display:flex;flex-direction:column;gap:8px;margin-bottom:20px}
.value-row{display:flex;align-items:center;gap:8px;padding:6px 10px;background:rgba(255,255,255,0.04);border-radius:6px}
.value-label{font-size:11px;color:#484f58;min-width:30px;text-transform:uppercase;letter-spacing:1px}
.value-text{flex:1;font-size:14px;font-family:'Courier New',monospace;font-weight:600}
.copy-btn{background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.1);border-radius:4px;color:#e6edf3;font-size:12px;cursor:pointer;padding:4px 8px}
.copy-btn:hover{background:rgba(255,255,255,0.15)}
.sliders{display:flex;flex-direction:column;gap:12px;margin-bottom:16px}
.slider-row{display:flex;align-items:center;gap:10px}
.slider-row label{font-size:14px;font-weight:700;min-width:16px}
.slider{flex:1;-webkit-appearance:none;appearance:none;height:8px;border-radius:4px;outline:none;cursor:pointer}
.slider::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:#fff;border:2px solid rgba(0,0,0,0.3);cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,0.3)}
.red-slider{background:linear-gradient(to right,#000,#ff0000)}
.green-slider{background:linear-gradient(to right,#000,#00ff00)}
.blue-slider{background:linear-gradient(to right,#000,#0000ff)}
.slider-val{font-size:13px;min-width:30px;text-align:right;font-variant-numeric:tabular-nums;color:#8b949e}
.hex-input-row{display:flex;gap:8px}
#hexInput{flex:1;padding:8px 12px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:6px;color:#e6edf3;font-size:14px;font-family:'Courier New',monospace;outline:none}
#hexInput:focus{border-color:#d2a8ff}
.apply-btn{padding:8px 16px;background:#8b5cf6;color:#fff;border:none;border-radius:6px;font-size:13px;cursor:pointer;font-family:inherit}
.apply-btn:hover{filter:brightness(1.15)}
.recent-section{width:100%;max-width:380px}
.recent-section h3{font-size:14px;color:#8b949e;margin-bottom:10px}
.recent-colors{display:flex;gap:8px;flex-wrap:wrap}
.recent-swatch{width:40px;height:40px;border-radius:8px;cursor:pointer;border:2px solid rgba(255,255,255,0.1);transition:transform 0.12s,border-color 0.12s}
.recent-swatch:hover{transform:scale(1.1);border-color:#d2a8ff}
.toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#238636;color:#fff;padding:8px 20px;border-radius:8px;font-size:13px;opacity:0;transition:opacity 0.3s;pointer-events:none;z-index:999}
.toast.show{opacity:1}`;

var COLORPICKER_JS = `var r = 255, g = 102, b = 0;
var recentList = [];
var MAX_RECENT = 5;

var preview = document.getElementById('preview');
var hexVal = document.getElementById('hexVal');
var rgbVal = document.getElementById('rgbVal');
var hslVal = document.getElementById('hslVal');
var rSlider = document.getElementById('rSlider');
var gSlider = document.getElementById('gSlider');
var bSlider = document.getElementById('bSlider');
var rValEl = document.getElementById('rVal');
var gValEl = document.getElementById('gVal');
var bValEl = document.getElementById('bVal');
var hexInput = document.getElementById('hexInput');
var applyHex = document.getElementById('applyHex');
var recentColors = document.getElementById('recentColors');
var copyBtns = document.querySelectorAll('.copy-btn');

function toHex(n) {
  var h = n.toString(16).toUpperCase();
  return h.length === 1 ? '0' + h : h;
}

function rgbToHsl(r, g, b) {
  var rr = r / 255, gg = g / 255, bb = b / 255;
  var max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb);
  var h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rr) h = ((gg - bb) / d + (gg < bb ? 6 : 0)) / 6;
    else if (max === gg) h = ((bb - rr) / d + 2) / 6;
    else h = ((rr - gg) / d + 4) / 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function updateColor() {
  var hex = '#' + toHex(r) + toHex(g) + toHex(b);
  var hsl = rgbToHsl(r, g, b);

  preview.style.background = hex;
  hexVal.textContent = hex;
  rgbVal.textContent = 'rgb(' + r + ', ' + g + ', ' + b + ')';
  hslVal.textContent = 'hsl(' + hsl[0] + ', ' + hsl[1] + '%, ' + hsl[2] + '%)';
  hexInput.value = hex;

  rSlider.value = r;
  gSlider.value = g;
  bSlider.value = b;
  rValEl.textContent = r;
  gValEl.textContent = g;
  bValEl.textContent = b;
}

function addRecent(hex) {
  var idx = recentList.indexOf(hex);
  if (idx !== -1) recentList.splice(idx, 1);
  recentList.unshift(hex);
  if (recentList.length > MAX_RECENT) recentList.pop();
  renderRecent();
}

function renderRecent() {
  recentColors.innerHTML = '';
  for (var i = 0; i < recentList.length; i++) {
    var swatch = document.createElement('div');
    swatch.className = 'recent-swatch';
    swatch.style.background = recentList[i];
    swatch.setAttribute('data-hex', recentList[i]);
    swatch.title = recentList[i];
    swatch.addEventListener('click', function() {
      applyHexColor(this.getAttribute('data-hex'));
    });
    recentColors.appendChild(swatch);
  }
}

function applyHexColor(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  if (hex.length !== 6) return;
  r = parseInt(hex.substring(0, 2), 16);
  g = parseInt(hex.substring(2, 4), 16);
  b = parseInt(hex.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) { r = 0; g = 0; b = 0; }
  updateColor();
  addRecent('#' + hex.toUpperCase());
}

function showToast(msg) {
  var existing = document.querySelector('.toast');
  if (existing) existing.remove();
  var toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(function() { toast.classList.add('show'); }, 10);
  setTimeout(function() { toast.classList.remove('show'); setTimeout(function() { toast.remove(); }, 300); }, 1500);
}

rSlider.addEventListener('input', function() { r = parseInt(this.value); updateColor(); });
gSlider.addEventListener('input', function() { g = parseInt(this.value); updateColor(); });
bSlider.addEventListener('input', function() { b = parseInt(this.value); updateColor(); });

rSlider.addEventListener('change', function() { addRecent(hexVal.textContent); });
gSlider.addEventListener('change', function() { addRecent(hexVal.textContent); });
bSlider.addEventListener('change', function() { addRecent(hexVal.textContent); });

applyHex.addEventListener('click', function() {
  applyHexColor(hexInput.value);
});
hexInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') applyHexColor(hexInput.value);
});

for (var i = 0; i < copyBtns.length; i++) {
  copyBtns[i].addEventListener('click', function() {
    var target = this.getAttribute('data-target');
    var el = document.getElementById(target);
    if (el && navigator.clipboard) {
      navigator.clipboard.writeText(el.textContent).then(function() {
        showToast('복사 완료!');
      });
    }
  });
}

updateColor();
addRecent('#FF6600');`;

// ═══════════════════════════════════════════════════════════════════════════
// ██  9. LOGIN PAGE  ██
// ═══════════════════════════════════════════════════════════════════════════
var LOGIN_HTML = `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Login</title><link rel="stylesheet" href="style.css"></head>
<body>
<div class="wrapper">
  <div class="login-card">
    <div class="logo">🔐</div>
    <h1>로그인</h1>
    <p class="subtitle">계정에 로그인하세요</p>
    <form id="loginForm" novalidate>
      <div class="field">
        <label for="email">이메일</label>
        <input type="email" id="email" placeholder="name@example.com" autocomplete="email" />
        <span class="error" id="emailError"></span>
      </div>
      <div class="field">
        <label for="password">비밀번호</label>
        <div class="password-wrap">
          <input type="password" id="password" placeholder="비밀번호 입력" autocomplete="current-password" />
          <button type="button" id="togglePw" class="toggle-pw">👁️</button>
        </div>
        <span class="error" id="pwError"></span>
      </div>
      <div class="options">
        <label class="checkbox-label"><input type="checkbox" id="remember" /> 로그인 유지</label>
        <a href="#" class="forgot">비밀번호 찾기</a>
      </div>
      <button type="submit" class="btn-login">로그인</button>
    </form>
    <div class="divider"><span>또는</span></div>
    <div class="social-buttons">
      <button class="social-btn google"><span class="social-icon">G</span> Google</button>
      <button class="social-btn github"><span class="social-icon">🐙</span> GitHub</button>
      <button class="social-btn kakao"><span class="social-icon">💬</span> Kakao</button>
    </div>
    <p class="signup-link">계정이 없으신가요? <a href="#">회원가입</a></p>
  </div>
</div>
<div class="toast hidden" id="toast"></div>
<script src="script.js"></script>
</body></html>`;

var LOGIN_CSS = `*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;background:#0d1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e6edf3}
.wrapper{display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}
.login-card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:40px 36px;width:100%;max-width:400px;backdrop-filter:blur(10px)}
.logo{font-size:48px;text-align:center;margin-bottom:8px}
h1{text-align:center;font-size:24px;margin-bottom:4px}
.subtitle{text-align:center;font-size:13px;color:#8b949e;margin-bottom:28px}
.field{margin-bottom:18px}
.field label{display:block;font-size:13px;font-weight:600;margin-bottom:6px;color:#c9d1d9}
.field input{width:100%;padding:10px 14px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:8px;color:#e6edf3;font-size:14px;font-family:inherit;outline:none;transition:border-color 0.15s}
.field input:focus{border-color:#58a6ff}
.field input.invalid{border-color:#f85149}
.password-wrap{position:relative}
.password-wrap input{padding-right:42px}
.toggle-pw{position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;color:#8b949e;font-size:16px;cursor:pointer;padding:4px}
.error{display:block;font-size:11px;color:#f85149;margin-top:4px;min-height:16px}
.options{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;font-size:13px}
.checkbox-label{display:flex;align-items:center;gap:6px;color:#8b949e;cursor:pointer}
.checkbox-label input{accent-color:#58a6ff}
.forgot{color:#58a6ff;text-decoration:none;font-size:12px}
.forgot:hover{text-decoration:underline}
.btn-login{width:100%;padding:12px;background:#238636;color:#fff;border:none;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;transition:filter 0.15s}
.btn-login:hover{filter:brightness(1.15)}
.btn-login:disabled{opacity:0.5;cursor:default}
.divider{display:flex;align-items:center;margin:24px 0;gap:12px}
.divider::before,.divider::after{content:'';flex:1;height:1px;background:rgba(255,255,255,0.08)}
.divider span{font-size:12px;color:#484f58}
.social-buttons{display:flex;flex-direction:column;gap:10px}
.social-btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:10px;border:1px solid rgba(255,255,255,0.1);border-radius:8px;font-size:14px;font-family:inherit;cursor:pointer;font-weight:600;transition:background 0.15s}
.social-icon{font-size:16px;min-width:20px;text-align:center}
.social-btn.google{background:rgba(255,255,255,0.06);color:#e6edf3}
.social-btn.google:hover{background:rgba(255,255,255,0.1)}
.social-btn.github{background:rgba(255,255,255,0.06);color:#e6edf3}
.social-btn.github:hover{background:rgba(255,255,255,0.1)}
.social-btn.kakao{background:rgba(254,229,0,0.12);color:#3C1E1E;border-color:rgba(254,229,0,0.3)}
.social-btn.kakao:hover{background:rgba(254,229,0,0.2)}
.signup-link{text-align:center;margin-top:24px;font-size:13px;color:#8b949e}
.signup-link a{color:#58a6ff;text-decoration:none}
.signup-link a:hover{text-decoration:underline}
.toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);padding:10px 24px;border-radius:8px;font-size:13px;z-index:999;transition:opacity 0.3s}
.toast.hidden{opacity:0;pointer-events:none}
.toast.success{background:#238636;color:#fff;opacity:1}
.toast.error{background:#da3633;color:#fff;opacity:1}
@media(max-width:440px){.login-card{padding:28px 20px}}`;

var LOGIN_JS = `var form = document.getElementById('loginForm');
var emailInput = document.getElementById('email');
var passwordInput = document.getElementById('password');
var emailError = document.getElementById('emailError');
var pwError = document.getElementById('pwError');
var togglePw = document.getElementById('togglePw');
var toast = document.getElementById('toast');
var socialBtns = document.querySelectorAll('.social-btn');

var EMAIL_RE = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;

function validateEmail() {
  var val = emailInput.value.trim();
  if (!val) {
    emailError.textContent = '이메일을 입력해주세요';
    emailInput.classList.add('invalid');
    return false;
  }
  if (!EMAIL_RE.test(val)) {
    emailError.textContent = '올바른 이메일 형식이 아닙니다';
    emailInput.classList.add('invalid');
    return false;
  }
  emailError.textContent = '';
  emailInput.classList.remove('invalid');
  return true;
}

function validatePassword() {
  var val = passwordInput.value;
  if (!val) {
    pwError.textContent = '비밀번호를 입력해주세요';
    passwordInput.classList.add('invalid');
    return false;
  }
  if (val.length < 6) {
    pwError.textContent = '비밀번호는 6자 이상이어야 합니다';
    passwordInput.classList.add('invalid');
    return false;
  }
  pwError.textContent = '';
  passwordInput.classList.remove('invalid');
  return true;
}

function showToast(msg, type) {
  toast.textContent = msg;
  toast.className = 'toast ' + type;
  setTimeout(function() {
    toast.className = 'toast hidden';
  }, 2500);
}

togglePw.addEventListener('click', function() {
  var isPassword = passwordInput.type === 'password';
  passwordInput.type = isPassword ? 'text' : 'password';
  togglePw.textContent = isPassword ? '🙈' : '👁️';
});

emailInput.addEventListener('blur', validateEmail);
passwordInput.addEventListener('blur', validatePassword);

emailInput.addEventListener('input', function() {
  if (emailInput.classList.contains('invalid')) validateEmail();
});
passwordInput.addEventListener('input', function() {
  if (passwordInput.classList.contains('invalid')) validatePassword();
});

form.addEventListener('submit', function(e) {
  e.preventDefault();
  var emailOk = validateEmail();
  var pwOk = validatePassword();
  if (!emailOk || !pwOk) return;

  var btn = form.querySelector('.btn-login');
  btn.disabled = true;
  btn.textContent = '로그인 중...';

  setTimeout(function() {
    btn.disabled = false;
    btn.textContent = '로그인';
    showToast('로그인 성공! 환영합니다 🎉', 'success');
  }, 1500);
});

for (var i = 0; i < socialBtns.length; i++) {
  socialBtns[i].addEventListener('click', function() {
    var provider = this.textContent.trim();
    showToast(provider + ' 로그인은 데모에서 지원되지 않습니다', 'error');
  });
}`;

// ═══════════════════════════════════════════════════════════════════════════
// ██  10. PORTFOLIO  ██
// ═══════════════════════════════════════════════════════════════════════════
var PORTFOLIO_HTML = `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Portfolio</title><link rel="stylesheet" href="style.css"></head>
<body>
<nav class="nav" id="nav">
  <div class="nav-brand">Portfolio</div>
  <div class="nav-links">
    <a href="#hero">Home</a>
    <a href="#about">About</a>
    <a href="#skills">Skills</a>
    <a href="#projects">Projects</a>
    <a href="#contact">Contact</a>
  </div>
  <button class="menu-btn" id="menuBtn">☰</button>
</nav>

<section class="hero" id="hero">
  <div class="hero-content">
    <p class="hero-greeting" id="greeting">안녕하세요, 저는</p>
    <h1 class="hero-name" id="heroName">홍길동</h1>
    <p class="hero-role" id="heroRole">Full-Stack Developer</p>
    <p class="hero-desc">웹과 모바일 경험을 만들어내는 개발자입니다.<br/>깔끔한 코드와 직관적인 UX를 추구합니다.</p>
    <div class="hero-actions">
      <a href="#projects" class="btn btn-primary">프로젝트 보기</a>
      <a href="#contact" class="btn btn-outline">연락하기</a>
    </div>
  </div>
</section>

<section class="section" id="about">
  <h2 class="section-title">About Me</h2>
  <div class="about-content">
    <div class="about-avatar">👨‍💻</div>
    <div class="about-text">
      <p>5년차 풀스택 개발자로, React, Node.js, Python을 활용한 웹 애플리케이션 개발을 주로 하고 있습니다.</p>
      <p>사용자 중심의 설계와 성능 최적화에 관심이 많으며, 오픈소스 커뮤니티에도 적극적으로 기여하고 있습니다.</p>
      <div class="about-stats">
        <div class="stat"><span class="stat-num" data-target="50">0</span>+<div class="stat-label">프로젝트</div></div>
        <div class="stat"><span class="stat-num" data-target="5">0</span>+<div class="stat-label">경력(년)</div></div>
        <div class="stat"><span class="stat-num" data-target="30">0</span>+<div class="stat-label">고객사</div></div>
      </div>
    </div>
  </div>
</section>

<section class="section section-alt" id="skills">
  <h2 class="section-title">Skills</h2>
  <div class="skills-grid">
    <div class="skill-item"><div class="skill-header"><span>JavaScript / TypeScript</span><span class="skill-pct">92%</span></div><div class="skill-bar"><div class="skill-fill" data-pct="92"></div></div></div>
    <div class="skill-item"><div class="skill-header"><span>React / Next.js</span><span class="skill-pct">88%</span></div><div class="skill-bar"><div class="skill-fill" data-pct="88"></div></div></div>
    <div class="skill-item"><div class="skill-header"><span>Node.js / Express</span><span class="skill-pct">85%</span></div><div class="skill-bar"><div class="skill-fill" data-pct="85"></div></div></div>
    <div class="skill-item"><div class="skill-header"><span>Python / Django</span><span class="skill-pct">78%</span></div><div class="skill-bar"><div class="skill-fill" data-pct="78"></div></div></div>
    <div class="skill-item"><div class="skill-header"><span>PostgreSQL / MongoDB</span><span class="skill-pct">82%</span></div><div class="skill-bar"><div class="skill-fill" data-pct="82"></div></div></div>
    <div class="skill-item"><div class="skill-header"><span>Docker / AWS</span><span class="skill-pct">75%</span></div><div class="skill-bar"><div class="skill-fill" data-pct="75"></div></div></div>
  </div>
</section>

<section class="section" id="projects">
  <h2 class="section-title">Projects</h2>
  <div class="projects-grid">
    <div class="project-card">
      <div class="project-img">🛒</div>
      <div class="project-body">
        <h3>E-Commerce Platform</h3>
        <p>React + Node.js 기반 풀스택 쇼핑몰. 결제, 재고관리, 관리자 대시보드 포함.</p>
        <div class="project-tags"><span>React</span><span>Node.js</span><span>PostgreSQL</span></div>
      </div>
    </div>
    <div class="project-card">
      <div class="project-img">📊</div>
      <div class="project-body">
        <h3>Analytics Dashboard</h3>
        <p>실시간 데이터 시각화 대시보드. 차트, 필터링, CSV 내보내기 지원.</p>
        <div class="project-tags"><span>Next.js</span><span>D3.js</span><span>WebSocket</span></div>
      </div>
    </div>
    <div class="project-card">
      <div class="project-img">💬</div>
      <div class="project-body">
        <h3>Chat Application</h3>
        <p>WebSocket 기반 실시간 채팅. 그룹채팅, 파일공유, 읽음확인 기능.</p>
        <div class="project-tags"><span>React</span><span>Socket.io</span><span>MongoDB</span></div>
      </div>
    </div>
  </div>
</section>

<section class="section section-alt" id="contact">
  <h2 class="section-title">Contact</h2>
  <div class="contact-wrapper">
    <form id="contactForm" class="contact-form" novalidate>
      <div class="form-row">
        <div class="form-group"><label>이름</label><input type="text" id="nameInput" placeholder="홍길동" /></div>
        <div class="form-group"><label>이메일</label><input type="email" id="emailInput" placeholder="name@example.com" /></div>
      </div>
      <div class="form-group"><label>제목</label><input type="text" id="subjectInput" placeholder="문의 제목" /></div>
      <div class="form-group"><label>메시지</label><textarea id="msgInput" rows="5" placeholder="내용을 입력하세요..."></textarea></div>
      <button type="submit" class="btn btn-primary btn-full">📨 메시지 보내기</button>
    </form>
  </div>
</section>

<footer class="footer">
  <p>Designed & Built with ❤️</p>
</footer>
<script src="script.js"></script>
</body></html>`;

var PORTFOLIO_CSS = `*{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{background:#0d1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e6edf3;line-height:1.6}
/* Nav */
.nav{position:fixed;top:0;left:0;right:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:14px 24px;background:rgba(13,17,23,0.9);backdrop-filter:blur(10px);border-bottom:1px solid rgba(255,255,255,0.06)}
.nav-brand{font-size:18px;font-weight:800;color:#58a6ff}
.nav-links{display:flex;gap:24px}
.nav-links a{color:#8b949e;text-decoration:none;font-size:13px;font-weight:500;transition:color 0.15s}
.nav-links a:hover{color:#58a6ff}
.menu-btn{display:none;background:none;border:none;color:#e6edf3;font-size:20px;cursor:pointer}
/* Hero */
.hero{min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:80px 20px 40px;background:radial-gradient(ellipse at 50% 0%,rgba(88,166,255,0.08),transparent 60%)}
.hero-greeting{font-size:16px;color:#8b949e;margin-bottom:8px}
.hero-name{font-size:52px;font-weight:900;background:linear-gradient(135deg,#58a6ff,#d2a8ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:8px}
.hero-role{font-size:20px;color:#f0883e;font-weight:600;margin-bottom:16px}
.hero-desc{font-size:15px;color:#8b949e;max-width:480px;margin:0 auto 28px;line-height:1.8}
.hero-actions{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
.btn{display:inline-block;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;text-decoration:none;transition:all 0.15s;border:none}
.btn-primary{background:#238636;color:#fff}
.btn-primary:hover{filter:brightness(1.15);transform:translateY(-1px)}
.btn-outline{background:transparent;color:#58a6ff;border:1px solid rgba(88,166,255,0.4)}
.btn-outline:hover{background:rgba(88,166,255,0.1)}
.btn-full{width:100%}
/* Sections */
.section{padding:80px 24px;max-width:900px;margin:0 auto}
.section-alt{background:rgba(255,255,255,0.02);max-width:100%;padding-left:24px;padding-right:24px}
.section-alt .section-inner{max-width:900px;margin:0 auto}
.section-title{font-size:28px;font-weight:800;text-align:center;margin-bottom:40px;color:#e6edf3}
/* About */
.about-content{display:flex;gap:32px;align-items:center;flex-wrap:wrap;justify-content:center}
.about-avatar{font-size:80px;background:rgba(255,255,255,0.04);border-radius:20px;padding:24px;border:1px solid rgba(255,255,255,0.08)}
.about-text{flex:1;min-width:280px}
.about-text p{color:#8b949e;margin-bottom:12px;font-size:14px}
.about-stats{display:flex;gap:24px;margin-top:20px}
.stat{text-align:center}
.stat-num{font-size:32px;font-weight:800;color:#58a6ff}
.stat-label{font-size:12px;color:#484f58;margin-top:4px}
/* Skills */
.skills-grid{max-width:600px;margin:0 auto;display:flex;flex-direction:column;gap:16px}
.skill-item{background:rgba(255,255,255,0.03);padding:14px 18px;border-radius:10px;border:1px solid rgba(255,255,255,0.06)}
.skill-header{display:flex;justify-content:space-between;margin-bottom:8px;font-size:13px;font-weight:600}
.skill-pct{color:#58a6ff}
.skill-bar{height:8px;background:rgba(255,255,255,0.06);border-radius:4px;overflow:hidden}
.skill-fill{height:100%;background:linear-gradient(90deg,#238636,#58a6ff);border-radius:4px;width:0;transition:width 1s ease}
/* Projects */
.projects-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px}
.project-card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:14px;overflow:hidden;transition:transform 0.2s,border-color 0.2s}
.project-card:hover{transform:translateY(-4px);border-color:rgba(88,166,255,0.3)}
.project-img{height:120px;display:flex;align-items:center;justify-content:center;font-size:48px;background:rgba(255,255,255,0.02)}
.project-body{padding:16px}
.project-body h3{font-size:16px;margin-bottom:8px}
.project-body p{font-size:13px;color:#8b949e;margin-bottom:12px;line-height:1.6}
.project-tags{display:flex;gap:6px;flex-wrap:wrap}
.project-tags span{padding:4px 10px;background:rgba(88,166,255,0.1);border-radius:12px;font-size:11px;color:#58a6ff}
/* Contact */
.contact-wrapper{max-width:600px;margin:0 auto}
.contact-form{display:flex;flex-direction:column;gap:16px}
.form-row{display:flex;gap:16px}
.form-group{flex:1;display:flex;flex-direction:column;gap:6px}
.form-group label{font-size:13px;font-weight:600;color:#c9d1d9}
.form-group input,.form-group textarea{padding:10px 14px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#e6edf3;font-size:14px;font-family:inherit;outline:none;resize:vertical}
.form-group input:focus,.form-group textarea:focus{border-color:#58a6ff}
/* Footer */
.footer{text-align:center;padding:24px;font-size:13px;color:#484f58;border-top:1px solid rgba(255,255,255,0.06)}
@media(max-width:640px){
  .nav-links{display:none}
  .nav-links.open{display:flex;flex-direction:column;position:absolute;top:100%;left:0;right:0;background:rgba(13,17,23,0.95);padding:16px 24px;gap:12px;border-bottom:1px solid rgba(255,255,255,0.06)}
  .menu-btn{display:block}
  .hero-name{font-size:36px}
  .form-row{flex-direction:column}
  .about-content{flex-direction:column;text-align:center}
  .about-stats{justify-content:center}
}`;

var PORTFOLIO_JS = `var nav = document.getElementById('nav');
var menuBtn = document.getElementById('menuBtn');
var navLinks = document.querySelector('.nav-links');
var contactForm = document.getElementById('contactForm');
var skillFills = document.querySelectorAll('.skill-fill');
var statNums = document.querySelectorAll('.stat-num');

// Mobile menu toggle
menuBtn.addEventListener('click', function() {
  navLinks.classList.toggle('open');
});

// Close mobile menu on link click
var links = navLinks.querySelectorAll('a');
for (var i = 0; i < links.length; i++) {
  links[i].addEventListener('click', function() {
    navLinks.classList.remove('open');
  });
}

// Navbar scroll effect
var lastScroll = 0;
window.addEventListener('scroll', function() {
  var st = window.pageYOffset || document.documentElement.scrollTop;
  if (st > 60) {
    nav.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
  } else {
    nav.style.boxShadow = 'none';
  }
  lastScroll = st;
});

// Animate skill bars on scroll
var skillsAnimated = false;
function animateSkills() {
  if (skillsAnimated) return;
  var section = document.getElementById('skills');
  if (!section) return;
  var rect = section.getBoundingClientRect();
  if (rect.top < window.innerHeight * 0.8) {
    skillsAnimated = true;
    for (var i = 0; i < skillFills.length; i++) {
      var pct = skillFills[i].getAttribute('data-pct');
      skillFills[i].style.width = pct + '%';
    }
  }
}

// Animate stat counters on scroll
var statsAnimated = false;
function animateStats() {
  if (statsAnimated) return;
  var about = document.getElementById('about');
  if (!about) return;
  var rect = about.getBoundingClientRect();
  if (rect.top < window.innerHeight * 0.8) {
    statsAnimated = true;
    for (var i = 0; i < statNums.length; i++) {
      (function(el) {
        var target = parseInt(el.getAttribute('data-target'));
        var current = 0;
        var step = Math.ceil(target / 40);
        var timer = setInterval(function() {
          current += step;
          if (current >= target) {
            current = target;
            clearInterval(timer);
          }
          el.textContent = current;
        }, 30);
      })(statNums[i]);
    }
  }
}

window.addEventListener('scroll', function() {
  animateSkills();
  animateStats();
});

// Initial check
animateSkills();
animateStats();

// Contact form
contactForm.addEventListener('submit', function(e) {
  e.preventDefault();
  var name = document.getElementById('nameInput').value.trim();
  var email = document.getElementById('emailInput').value.trim();
  var subject = document.getElementById('subjectInput').value.trim();
  var msg = document.getElementById('msgInput').value.trim();

  if (!name || !email || !msg) {
    showPortfolioToast('모든 필수 항목을 입력해주세요', '#da3633');
    return;
  }

  var btn = contactForm.querySelector('button');
  btn.disabled = true;
  btn.textContent = '전송 중...';

  setTimeout(function() {
    btn.disabled = false;
    btn.textContent = '📨 메시지 보내기';
    contactForm.reset();
    showPortfolioToast('메시지가 전송되었습니다! 감사합니다 🎉', '#238636');
  }, 1500);
});

function showPortfolioToast(msg, bg) {
  var existing = document.querySelector('.p-toast');
  if (existing) existing.remove();
  var toast = document.createElement('div');
  toast.className = 'p-toast';
  toast.textContent = msg;
  toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:' + bg + ';color:#fff;padding:10px 24px;border-radius:8px;font-size:13px;z-index:999;opacity:0;transition:opacity 0.3s;font-family:inherit';
  document.body.appendChild(toast);
  setTimeout(function() { toast.style.opacity = '1'; }, 10);
  setTimeout(function() {
    toast.style.opacity = '0';
    setTimeout(function() { toast.remove(); }, 300);
  }, 2500);
}

// Typing effect for hero name
var heroName = document.getElementById('heroName');
var originalName = heroName.textContent;
heroName.textContent = '';
var charIdx = 0;
function typeHeroName() {
  if (charIdx < originalName.length) {
    heroName.textContent += originalName[charIdx];
    charIdx++;
    setTimeout(typeHeroName, 80);
  }
}
setTimeout(typeHeroName, 500);`;

// ═══════════════════════════════════════════════════════════════════════════
// ██  TEMPLATE REGISTRY  ██
// ═══════════════════════════════════════════════════════════════════════════
export const TEMPLATES2: TemplateInfo2[] = [
  {
    keywords: ["메모리", "카드", "매칭", "memory", "card", "matching"],
    name: "Memory Card", icon: "\u{1F0CF}", description: "4x4 이모지 카드 매칭 게임 \u2014 시도 횟수, 시간 표시",
    category: "game",
    files: {
      "index.html": { name: "index.html", language: "html", content: MEMORY_HTML },
      "style.css": { name: "style.css", language: "css", content: MEMORY_CSS },
      "script.js": { name: "script.js", language: "javascript", content: MEMORY_JS },
    },
  },
  {
    keywords: ["타이핑", "typing", "타자", "타자게임"],
    name: "Typing Game", icon: "\u2328\uFE0F", description: "떨어지는 영어 단어 타이핑 게임 \u2014 스코어, WPM 표시",
    category: "game",
    files: {
      "index.html": { name: "index.html", language: "html", content: TYPING_HTML },
      "style.css": { name: "style.css", language: "css", content: TYPING_CSS },
      "script.js": { name: "script.js", language: "javascript", content: TYPING_JS },
    },
  },
  {
    keywords: ["뽀모도로", "pomodoro", "타이머", "timer", "집중"],
    name: "Pomodoro Timer", icon: "\uD83C\uDF45", description: "25분/5분 교대 뽀모도로 \u2014 원형 SVG 프로그레스, 세션 카운터",
    category: "tool",
    files: {
      "index.html": { name: "index.html", language: "html", content: POMODORO_HTML },
      "style.css": { name: "style.css", language: "css", content: POMODORO_CSS },
      "script.js": { name: "script.js", language: "javascript", content: POMODORO_JS },
    },
  },
  {
    keywords: ["날씨", "weather", "기상", "온도"],
    name: "Weather App", icon: "\uD83C\uDF26\uFE0F", description: "도시별 날씨 정보 \u2014 온도, 습도, 풍속, 예보",
    category: "app",
    files: {
      "index.html": { name: "index.html", language: "html", content: WEATHER_HTML },
      "style.css": { name: "style.css", language: "css", content: WEATHER_CSS },
      "script.js": { name: "script.js", language: "javascript", content: WEATHER_JS },
    },
  },
  {
    keywords: ["채팅", "chat", "메신저", "messenger", "대화"],
    name: "Chat App", icon: "\uD83D\uDCAC", description: "메시지 버블 채팅 \u2014 봇 자동답장, 타임스탬프",
    category: "app",
    files: {
      "index.html": { name: "index.html", language: "html", content: CHAT_HTML },
      "style.css": { name: "style.css", language: "css", content: CHAT_CSS },
      "script.js": { name: "script.js", language: "javascript", content: CHAT_JS },
    },
  },
  {
    keywords: ["메모", "notes", "노트", "메모장", "notepad"],
    name: "Notes App", icon: "\uD83D\uDCDD", description: "메모 앱 \u2014 목록+편집기, localStorage, 검색",
    category: "app",
    files: {
      "index.html": { name: "index.html", language: "html", content: NOTES_HTML },
      "style.css": { name: "style.css", language: "css", content: NOTES_CSS },
      "script.js": { name: "script.js", language: "javascript", content: NOTES_JS },
    },
  },
  {
    keywords: ["스톱워치", "stopwatch", "초시계", "타이머"],
    name: "Stopwatch", icon: "\u23F1\uFE0F", description: "스톱워치 \u2014 시:분:초.밀리초, 랩 기록, 최고/최저 표시",
    category: "tool",
    files: {
      "index.html": { name: "index.html", language: "html", content: STOPWATCH_HTML },
      "style.css": { name: "style.css", language: "css", content: STOPWATCH_CSS },
      "script.js": { name: "script.js", language: "javascript", content: STOPWATCH_JS },
    },
  },
  {
    keywords: ["색상", "color", "picker", "컬러", "팔레트"],
    name: "Color Picker", icon: "\uD83C\uDFA8", description: "컬러 피커 \u2014 RGB 슬라이더, HEX/RGB/HSL, 최근 색상",
    category: "tool",
    files: {
      "index.html": { name: "index.html", language: "html", content: COLORPICKER_HTML },
      "style.css": { name: "style.css", language: "css", content: COLORPICKER_CSS },
      "script.js": { name: "script.js", language: "javascript", content: COLORPICKER_JS },
    },
  },
  {
    keywords: ["로그인", "login", "signin", "회원가입", "signup"],
    name: "Login Page", icon: "\uD83D\uDD10", description: "로그인 페이지 \u2014 유효성검사, 소셜로그인 UI, 반응형",
    category: "app",
    files: {
      "index.html": { name: "index.html", language: "html", content: LOGIN_HTML },
      "style.css": { name: "style.css", language: "css", content: LOGIN_CSS },
      "script.js": { name: "script.js", language: "javascript", content: LOGIN_JS },
    },
  },
  {
    keywords: ["포트폴리오", "portfolio", "이력서", "resume", "소개"],
    name: "Portfolio", icon: "\uD83D\uDCBC", description: "포트폴리오 \u2014 Hero, About, Skills, Projects, Contact",
    category: "app",
    files: {
      "index.html": { name: "index.html", language: "html", content: PORTFOLIO_HTML },
      "style.css": { name: "style.css", language: "css", content: PORTFOLIO_CSS },
      "script.js": { name: "script.js", language: "javascript", content: PORTFOLIO_JS },
    },
  },
];
