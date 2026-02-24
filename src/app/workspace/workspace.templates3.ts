import type { FilesMap } from "./workspace.constants";

export interface TemplateInfo3 {
  keywords: string[];
  name: string;
  icon: string;
  description: string;
  category: "game" | "app" | "tool";
  files: FilesMap;
}

// ═══════════════════════════════════════════════════════════════════════════
// ██  1. KANBAN BOARD  ██
// ═══════════════════════════════════════════════════════════════════════════
var KANBAN_HTML = `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Kanban Board</title><link rel="stylesheet" href="style.css"></head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>\u{1F4CB} Kanban Board</h1>
    <button id="clearBtn">초기화</button>
  </div>
  <div class="board">
    <div class="column" data-col="todo">
      <div class="col-header"><span class="col-dot dot-todo"></span>Todo</div>
      <div class="card-list" id="todo"></div>
      <div class="add-area"><input type="text" class="add-input" placeholder="새 카드..." /><button class="add-btn">+ 추가</button></div>
    </div>
    <div class="column" data-col="doing">
      <div class="col-header"><span class="col-dot dot-doing"></span>Doing</div>
      <div class="card-list" id="doing"></div>
      <div class="add-area"><input type="text" class="add-input" placeholder="새 카드..." /><button class="add-btn">+ 추가</button></div>
    </div>
    <div class="column" data-col="done">
      <div class="col-header"><span class="col-dot dot-done"></span>Done</div>
      <div class="card-list" id="done"></div>
      <div class="add-area"><input type="text" class="add-input" placeholder="새 카드..." /><button class="add-btn">+ 추가</button></div>
    </div>
  </div>
</div>
<script src="script.js"></script>
</body></html>`;

var KANBAN_CSS = `*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;background:#0d1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e6edf3}
.wrapper{display:flex;flex-direction:column;min-height:100vh;padding:20px}
.header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}
.header h1{font-size:22px;color:#58a6ff}
.header button{background:rgba(255,255,255,0.06);color:#8b949e;border:1px solid rgba(255,255,255,0.1);padding:6px 16px;border-radius:8px;cursor:pointer;font-family:inherit;font-size:13px}
.header button:hover{color:#e6edf3;border-color:#58a6ff}
.board{display:flex;gap:16px;flex:1;overflow-x:auto}
.column{flex:1;min-width:240px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;display:flex;flex-direction:column;padding:14px}
.col-header{font-size:14px;font-weight:700;margin-bottom:12px;display:flex;align-items:center;gap:8px}
.col-dot{width:10px;height:10px;border-radius:50%;display:inline-block}
.dot-todo{background:#8b949e}.dot-doing{background:#d29922}.dot-done{background:#3fb950}
.card-list{flex:1;display:flex;flex-direction:column;gap:8px;min-height:60px}
.card{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:10px 12px;cursor:grab;display:flex;align-items:center;justify-content:space-between;font-size:13px;transition:border-color 0.2s,transform 0.15s}
.card:hover{border-color:#58a6ff}
.card.dragging{opacity:0.5;transform:scale(0.95)}
.card .del-btn{background:none;border:none;color:#f85149;cursor:pointer;font-size:16px;padding:0 4px;opacity:0.5}
.card .del-btn:hover{opacity:1}
.card-list.drag-over{background:rgba(88,166,255,0.06);border-radius:8px}
.add-area{display:flex;gap:6px;margin-top:10px}
.add-input{flex:1;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:6px;padding:6px 10px;color:#e6edf3;font-size:12px;font-family:inherit;outline:none}
.add-input:focus{border-color:#58a6ff}
.add-btn{background:#238636;color:#fff;border:none;border-radius:6px;padding:6px 12px;font-size:12px;cursor:pointer;font-family:inherit;white-space:nowrap}
.add-btn:hover{filter:brightness(1.15)}`;

var KANBAN_JS = `var STORAGE_KEY = 'f9_kanban_v1';

function loadData() {
  try { var d = localStorage.getItem(STORAGE_KEY); return d ? JSON.parse(d) : null; } catch(e) { return null; }
}

function saveData() {
  var data = { todo: [], doing: [], done: [] };
  ['todo','doing','done'].forEach(function(col) {
    var cards = document.querySelectorAll('#' + col + ' .card');
    for (var i = 0; i < cards.length; i++) {
      data[col].push(cards[i].getAttribute('data-text'));
    }
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function createCard(text) {
  var card = document.createElement('div');
  card.className = 'card';
  card.setAttribute('draggable', 'true');
  card.setAttribute('data-text', text);
  var span = document.createElement('span');
  span.textContent = text;
  var del = document.createElement('button');
  del.className = 'del-btn';
  del.textContent = '\\u00D7';
  del.addEventListener('click', function() { card.remove(); saveData(); });
  card.appendChild(span);
  card.appendChild(del);
  card.addEventListener('dragstart', function(e) {
    card.classList.add('dragging');
    e.dataTransfer.setData('text/plain', '');
  });
  card.addEventListener('dragend', function() {
    card.classList.remove('dragging');
    saveData();
  });
  return card;
}

function setupColumns() {
  var lists = document.querySelectorAll('.card-list');
  for (var i = 0; i < lists.length; i++) {
    (function(list) {
      list.addEventListener('dragover', function(e) {
        e.preventDefault();
        list.classList.add('drag-over');
        var dragging = document.querySelector('.dragging');
        if (dragging) list.appendChild(dragging);
      });
      list.addEventListener('dragleave', function() { list.classList.remove('drag-over'); });
      list.addEventListener('drop', function(e) {
        e.preventDefault();
        list.classList.remove('drag-over');
        saveData();
      });
    })(lists[i]);
  }
}

function setupAddButtons() {
  var cols = document.querySelectorAll('.column');
  for (var i = 0; i < cols.length; i++) {
    (function(col) {
      var input = col.querySelector('.add-input');
      var btn = col.querySelector('.add-btn');
      var list = col.querySelector('.card-list');
      function addCard() {
        var text = input.value.trim();
        if (!text) return;
        list.appendChild(createCard(text));
        input.value = '';
        saveData();
      }
      btn.addEventListener('click', addCard);
      input.addEventListener('keydown', function(e) { if (e.key === 'Enter') addCard(); });
    })(cols[i]);
  }
}

function init() {
  setupColumns();
  setupAddButtons();
  var data = loadData();
  if (data) {
    ['todo','doing','done'].forEach(function(col) {
      var list = document.getElementById(col);
      if (data[col]) {
        data[col].forEach(function(text) { list.appendChild(createCard(text)); });
      }
    });
  }
  document.getElementById('clearBtn').addEventListener('click', function() {
    if (confirm('모든 카드를 삭제할까요?')) {
      ['todo','doing','done'].forEach(function(col) { document.getElementById(col).innerHTML = ''; });
      saveData();
    }
  });
}

init();`;

// ═══════════════════════════════════════════════════════════════════════════
// ██  2. CALENDAR  ██
// ═══════════════════════════════════════════════════════════════════════════
var CALENDAR_HTML = `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Calendar</title><link rel="stylesheet" href="style.css"></head>
<body>
<div class="wrapper">
  <div class="header">
    <button id="prevBtn">\u25C0</button>
    <h1 id="monthTitle"></h1>
    <button id="nextBtn">\u25B6</button>
  </div>
  <div class="weekdays">
    <span>일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span>
  </div>
  <div id="grid" class="grid"></div>
</div>
<div class="modal hidden" id="modal">
  <div class="modal-box">
    <h3 id="modalTitle"></h3>
    <div id="eventList" class="event-list"></div>
    <div class="modal-input-row">
      <input type="text" id="eventInput" placeholder="일정을 입력하세요..." />
      <button id="addEventBtn">추가</button>
    </div>
    <button id="closeModal" class="close-btn">\u00D7</button>
  </div>
</div>
<script src="script.js"></script>
</body></html>`;

var CALENDAR_CSS = `*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;background:#0d1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e6edf3}
.wrapper{max-width:500px;margin:0 auto;padding:20px}
.header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}
.header h1{font-size:20px;color:#58a6ff}
.header button{background:rgba(255,255,255,0.06);color:#e6edf3;border:1px solid rgba(255,255,255,0.1);width:36px;height:36px;border-radius:8px;cursor:pointer;font-size:14px}
.header button:hover{border-color:#58a6ff;background:rgba(88,166,255,0.1)}
.weekdays{display:grid;grid-template-columns:repeat(7,1fr);text-align:center;margin-bottom:8px;font-size:12px;color:#8b949e;font-weight:600}
.grid{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}
.day{aspect-ratio:1;display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:8px;cursor:pointer;font-size:14px;background:rgba(255,255,255,0.03);border:1px solid transparent;transition:border-color 0.2s;position:relative}
.day:hover{border-color:rgba(88,166,255,0.4)}
.day.today{background:rgba(88,166,255,0.15);border-color:#58a6ff;font-weight:700;color:#58a6ff}
.day.empty{background:transparent;cursor:default}
.day.has-event::after{content:'';width:6px;height:6px;background:#3fb950;border-radius:50%;position:absolute;bottom:4px}
.day.sunday{color:#f85149}.day.saturday{color:#79c0ff}
.modal{position:fixed;inset:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:100}
.modal.hidden{display:none}
.modal-box{background:#161b22;border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:24px;width:340px;position:relative}
.modal-box h3{font-size:16px;color:#58a6ff;margin-bottom:14px}
.event-list{display:flex;flex-direction:column;gap:6px;margin-bottom:12px;max-height:200px;overflow-y:auto}
.event-item{display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.04);padding:6px 10px;border-radius:6px;font-size:13px}
.event-item button{background:none;border:none;color:#f85149;cursor:pointer;font-size:14px}
.modal-input-row{display:flex;gap:6px}
.modal-input-row input{flex:1;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:6px;padding:8px 10px;color:#e6edf3;font-size:13px;font-family:inherit;outline:none}
.modal-input-row input:focus{border-color:#58a6ff}
.modal-input-row button{background:#238636;color:#fff;border:none;border-radius:6px;padding:8px 14px;font-size:13px;cursor:pointer;font-family:inherit}
.close-btn{position:absolute;top:12px;right:14px;background:none;border:none;color:#8b949e;font-size:22px;cursor:pointer}
.close-btn:hover{color:#e6edf3}`;

var CALENDAR_JS = `var STORAGE_KEY = 'f9_calendar_v1';
var currentYear, currentMonth;
var events = {};

function loadEvents() {
  try { var d = localStorage.getItem(STORAGE_KEY); events = d ? JSON.parse(d) : {}; } catch(e) { events = {}; }
}

function saveEvents() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

function dateKey(y, m, d) { return y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0'); }

function render() {
  var monthNames = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
  document.getElementById('monthTitle').textContent = currentYear + '년 ' + monthNames[currentMonth];

  var grid = document.getElementById('grid');
  grid.innerHTML = '';

  var firstDay = new Date(currentYear, currentMonth, 1).getDay();
  var daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  var today = new Date();

  for (var i = 0; i < firstDay; i++) {
    var empty = document.createElement('div');
    empty.className = 'day empty';
    grid.appendChild(empty);
  }

  for (var d = 1; d <= daysInMonth; d++) {
    var dayEl = document.createElement('div');
    dayEl.className = 'day';
    dayEl.textContent = String(d);
    var dow = (firstDay + d - 1) % 7;
    if (dow === 0) dayEl.classList.add('sunday');
    if (dow === 6) dayEl.classList.add('saturday');
    if (d === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
      dayEl.classList.add('today');
    }
    var key = dateKey(currentYear, currentMonth, d);
    if (events[key] && events[key].length > 0) dayEl.classList.add('has-event');
    (function(day, k) {
      dayEl.addEventListener('click', function() { openModal(day, k); });
    })(d, key);
    grid.appendChild(dayEl);
  }
}

function openModal(day, key) {
  var modal = document.getElementById('modal');
  document.getElementById('modalTitle').textContent = currentYear + '/' + (currentMonth + 1) + '/' + day + ' 일정';
  renderEventList(key);
  modal.classList.remove('hidden');

  var input = document.getElementById('eventInput');
  input.value = '';
  input.focus();

  document.getElementById('addEventBtn').onclick = function() {
    var text = input.value.trim();
    if (!text) return;
    if (!events[key]) events[key] = [];
    events[key].push(text);
    saveEvents();
    renderEventList(key);
    input.value = '';
    render();
  };
}

function renderEventList(key) {
  var list = document.getElementById('eventList');
  list.innerHTML = '';
  var items = events[key] || [];
  for (var i = 0; i < items.length; i++) {
    (function(idx) {
      var row = document.createElement('div');
      row.className = 'event-item';
      var span = document.createElement('span');
      span.textContent = items[idx];
      var del = document.createElement('button');
      del.textContent = '\\u00D7';
      del.addEventListener('click', function() {
        events[key].splice(idx, 1);
        if (events[key].length === 0) delete events[key];
        saveEvents();
        renderEventList(key);
        render();
      });
      row.appendChild(span);
      row.appendChild(del);
      list.appendChild(row);
    })(i);
  }
}

document.getElementById('closeModal').addEventListener('click', function() {
  document.getElementById('modal').classList.add('hidden');
});
document.getElementById('modal').addEventListener('click', function(e) {
  if (e.target === this) this.classList.add('hidden');
});
document.getElementById('prevBtn').addEventListener('click', function() {
  currentMonth--;
  if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  render();
});
document.getElementById('nextBtn').addEventListener('click', function() {
  currentMonth++;
  if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  render();
});

loadEvents();
var now = new Date();
currentYear = now.getFullYear();
currentMonth = now.getMonth();
render();`;

// ═══════════════════════════════════════════════════════════════════════════
// ██  3. MARKDOWN EDITOR  ██
// ═══════════════════════════════════════════════════════════════════════════
var MARKDOWN_HTML = `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Markdown Editor</title><link rel="stylesheet" href="style.css"></head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>\u270D\uFE0F Markdown Editor</h1>
    <div class="toolbar">
      <button class="tb-btn" data-insert="# " title="제목">#</button>
      <button class="tb-btn" data-insert="**" title="굵게">B</button>
      <button class="tb-btn" data-insert="*" title="기울임">I</button>
      <button class="tb-btn" data-insert="\`" title="코드">&lt;/&gt;</button>
      <button class="tb-btn" data-insert="- " title="리스트">-</button>
      <button class="tb-btn" data-insert="> " title="인용">&gt;</button>
    </div>
  </div>
  <div class="editor-area">
    <div class="pane">
      <div class="pane-label">편집</div>
      <textarea id="editor" spellcheck="false"># 마크다운 에디터

**굵은 텍스트**와 *기울임 텍스트*를 지원합니다.

## 기능

- 실시간 미리보기
- \`인라인 코드\` 지원
- 제목, 리스트, 인용문

> 이것은 인용문입니다.

일반 텍스트도 잘 보입니다.</textarea>
    </div>
    <div class="pane">
      <div class="pane-label">미리보기</div>
      <div id="preview" class="preview"></div>
    </div>
  </div>
</div>
<script src="script.js"></script>
</body></html>`;

var MARKDOWN_CSS = `*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;background:#0d1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e6edf3}
.wrapper{display:flex;flex-direction:column;height:100vh;padding:16px}
.header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px}
.header h1{font-size:20px;color:#58a6ff}
.toolbar{display:flex;gap:4px}
.tb-btn{background:rgba(255,255,255,0.06);color:#e6edf3;border:1px solid rgba(255,255,255,0.1);width:32px;height:32px;border-radius:6px;cursor:pointer;font-family:'Courier New',monospace;font-size:14px;font-weight:700}
.tb-btn:hover{border-color:#58a6ff;background:rgba(88,166,255,0.1)}
.editor-area{display:flex;gap:12px;flex:1;min-height:0}
.pane{flex:1;display:flex;flex-direction:column;min-width:0}
.pane-label{font-size:11px;color:#8b949e;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;font-weight:600}
#editor{flex:1;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:14px;color:#e6edf3;font-family:'Courier New',Consolas,monospace;font-size:14px;line-height:1.7;resize:none;outline:none}
#editor:focus{border-color:#58a6ff}
.preview{flex:1;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:14px;overflow-y:auto;line-height:1.7;font-size:14px}
.preview h1{font-size:24px;color:#58a6ff;margin:12px 0 8px;border-bottom:1px solid rgba(255,255,255,0.08);padding-bottom:6px}
.preview h2{font-size:20px;color:#79c0ff;margin:10px 0 6px}
.preview h3{font-size:17px;color:#a5d6ff;margin:8px 0 4px}
.preview p{margin:6px 0;color:#c9d1d9}
.preview strong{color:#e6edf3}
.preview em{color:#d2a8ff;font-style:italic}
.preview code{background:rgba(255,255,255,0.08);padding:2px 6px;border-radius:4px;font-family:'Courier New',monospace;font-size:13px;color:#ffa657}
.preview blockquote{border-left:3px solid #3fb950;padding:8px 14px;margin:8px 0;background:rgba(63,185,80,0.06);color:#8b949e;border-radius:0 6px 6px 0}
.preview ul{padding-left:20px;margin:6px 0}
.preview li{margin:3px 0;color:#c9d1d9}
@media(max-width:600px){.editor-area{flex-direction:column}}`;

var MARKDOWN_JS = `var editor = document.getElementById('editor');
var preview = document.getElementById('preview');

function parseMd(text) {
  var lines = text.split('\\n');
  var html = '';
  var inList = false;

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];

    // close list if not a list item
    if (inList && !/^\\s*- /.test(line)) {
      html += '</ul>';
      inList = false;
    }

    // headings
    if (/^### /.test(line)) { html += '<h3>' + inline(line.slice(4)) + '</h3>'; continue; }
    if (/^## /.test(line)) { html += '<h2>' + inline(line.slice(3)) + '</h2>'; continue; }
    if (/^# /.test(line)) { html += '<h1>' + inline(line.slice(2)) + '</h1>'; continue; }

    // blockquote
    if (/^> /.test(line)) { html += '<blockquote>' + inline(line.slice(2)) + '</blockquote>'; continue; }

    // list
    if (/^\\s*- /.test(line)) {
      if (!inList) { html += '<ul>'; inList = true; }
      html += '<li>' + inline(line.replace(/^\\s*- /, '')) + '</li>';
      continue;
    }

    // empty line
    if (line.trim() === '') { html += '<br>'; continue; }

    // paragraph
    html += '<p>' + inline(line) + '</p>';
  }
  if (inList) html += '</ul>';
  return html;
}

function inline(text) {
  // escape HTML
  text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // code
  text = text.replace(/\`([^\`]+)\`/g, '<code>$1</code>');
  // bold
  text = text.replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>');
  // italic
  text = text.replace(/\\*([^*]+)\\*/g, '<em>$1</em>');
  return text;
}

function renderPreview() {
  preview.innerHTML = parseMd(editor.value);
}

editor.addEventListener('input', renderPreview);

// toolbar
var buttons = document.querySelectorAll('.tb-btn');
for (var i = 0; i < buttons.length; i++) {
  (function(btn) {
    btn.addEventListener('click', function() {
      var ins = btn.getAttribute('data-insert');
      var start = editor.selectionStart;
      var end = editor.selectionEnd;
      var val = editor.value;
      editor.value = val.substring(0, start) + ins + val.substring(start);
      editor.selectionStart = editor.selectionEnd = start + ins.length;
      editor.focus();
      renderPreview();
    });
  })(buttons[i]);
}

renderPreview();`;

// ═══════════════════════════════════════════════════════════════════════════
// ██  4. UNIT CONVERTER  ██
// ═══════════════════════════════════════════════════════════════════════════
var UNIT_HTML = `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Unit Converter</title><link rel="stylesheet" href="style.css"></head>
<body>
<div class="wrapper">
  <h1>\u{1F4D0} Unit Converter</h1>
  <div class="tabs">
    <button class="tab active" data-tab="length">\u{1F4CF} 길이</button>
    <button class="tab" data-tab="weight">\u2696\uFE0F 무게</button>
    <button class="tab" data-tab="temp">\u{1F321}\uFE0F 온도</button>
  </div>
  <div class="converter" id="converter"></div>
</div>
<script src="script.js"></script>
</body></html>`;

var UNIT_CSS = `*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;background:#0d1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e6edf3}
.wrapper{max-width:440px;margin:0 auto;padding:30px 20px}
h1{text-align:center;font-size:22px;color:#58a6ff;margin-bottom:20px}
.tabs{display:flex;gap:6px;margin-bottom:20px}
.tab{flex:1;background:rgba(255,255,255,0.04);color:#8b949e;border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:10px;font-size:13px;cursor:pointer;font-family:inherit;transition:all 0.2s}
.tab:hover{color:#e6edf3;border-color:rgba(88,166,255,0.3)}
.tab.active{background:rgba(88,166,255,0.12);color:#58a6ff;border-color:#58a6ff}
.converter{display:flex;flex-direction:column;gap:12px}
.unit-row{display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:12px}
.unit-row label{width:48px;font-size:13px;color:#8b949e;text-align:right;font-weight:600}
.unit-row input{flex:1;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:6px;padding:10px;color:#e6edf3;font-size:16px;font-family:inherit;outline:none}
.unit-row input:focus{border-color:#58a6ff}
.swap-icon{text-align:center;font-size:20px;color:#8b949e}`;

var UNIT_JS = `var units = {
  length: [
    { label: 'm', factor: 1 },
    { label: 'km', factor: 1000 },
    { label: 'ft', factor: 0.3048 },
    { label: 'mi', factor: 1609.344 }
  ],
  weight: [
    { label: 'kg', factor: 1 },
    { label: 'g', factor: 0.001 },
    { label: 'lb', factor: 0.453592 },
    { label: 'oz', factor: 0.0283495 }
  ],
  temp: [
    { label: '\\u00B0C', name: 'C' },
    { label: '\\u00B0F', name: 'F' },
    { label: 'K', name: 'K' }
  ]
};

var currentTab = 'length';

function buildUI(tab) {
  var container = document.getElementById('converter');
  container.innerHTML = '';
  var list = units[tab];

  for (var i = 0; i < list.length; i++) {
    var row = document.createElement('div');
    row.className = 'unit-row';
    var label = document.createElement('label');
    label.textContent = list[i].label;
    var input = document.createElement('input');
    input.type = 'number';
    input.setAttribute('data-index', String(i));
    input.setAttribute('placeholder', '0');
    input.addEventListener('input', (function(idx) {
      return function(e) { convert(tab, idx, e.target.value); };
    })(i));
    row.appendChild(label);
    row.appendChild(input);
    container.appendChild(row);
  }
}

function convert(tab, fromIdx, val) {
  var v = parseFloat(val);
  var inputs = document.querySelectorAll('.unit-row input');
  if (isNaN(v) || val === '') {
    for (var i = 0; i < inputs.length; i++) {
      if (parseInt(inputs[i].getAttribute('data-index')) !== fromIdx) inputs[i].value = '';
    }
    return;
  }

  if (tab === 'temp') {
    var names = units.temp.map(function(u) { return u.name; });
    var from = names[fromIdx];
    for (var i = 0; i < inputs.length; i++) {
      var idx = parseInt(inputs[i].getAttribute('data-index'));
      if (idx === fromIdx) continue;
      var to = names[idx];
      inputs[i].value = convertTemp(v, from, to).toFixed(2);
    }
  } else {
    var list = units[tab];
    var base = v * list[fromIdx].factor;
    for (var i = 0; i < inputs.length; i++) {
      var idx = parseInt(inputs[i].getAttribute('data-index'));
      if (idx === fromIdx) continue;
      inputs[i].value = (base / list[idx].factor).toFixed(4);
    }
  }
}

function convertTemp(val, from, to) {
  var c;
  if (from === 'C') c = val;
  else if (from === 'F') c = (val - 32) * 5 / 9;
  else c = val - 273.15;

  if (to === 'C') return c;
  if (to === 'F') return c * 9 / 5 + 32;
  return c + 273.15;
}

var tabs = document.querySelectorAll('.tab');
for (var i = 0; i < tabs.length; i++) {
  (function(btn) {
    btn.addEventListener('click', function() {
      for (var j = 0; j < tabs.length; j++) tabs[j].classList.remove('active');
      btn.classList.add('active');
      currentTab = btn.getAttribute('data-tab');
      buildUI(currentTab);
    });
  })(tabs[i]);
}

buildUI(currentTab);`;

// ═══════════════════════════════════════════════════════════════════════════
// ██  5. EXPENSE TRACKER  ██
// ═══════════════════════════════════════════════════════════════════════════
var EXPENSE_HTML = `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Expense Tracker</title><link rel="stylesheet" href="style.css"></head>
<body>
<div class="wrapper">
  <h1>\u{1F4B0} Expense Tracker</h1>
  <div class="summary">
    <div class="sum-card income"><div class="sum-label">수입</div><div class="sum-val" id="incomeVal">0</div></div>
    <div class="sum-card expense"><div class="sum-label">지출</div><div class="sum-val" id="expenseVal">0</div></div>
    <div class="sum-card balance"><div class="sum-label">잔액</div><div class="sum-val" id="balanceVal">0</div></div>
  </div>
  <div class="chart-area"><canvas id="chart" width="200" height="200"></canvas></div>
  <div class="form">
    <select id="typeSelect"><option value="income">수입</option><option value="expense">지출</option></select>
    <input type="number" id="amountInput" placeholder="금액" />
    <input type="text" id="categoryInput" placeholder="카테고리" />
    <input type="text" id="memoInput" placeholder="메모" />
    <button id="addBtn">추가</button>
  </div>
  <div id="list" class="list"></div>
</div>
<script src="script.js"></script>
</body></html>`;

var EXPENSE_CSS = `*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;background:#0d1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e6edf3}
.wrapper{max-width:480px;margin:0 auto;padding:20px}
h1{text-align:center;font-size:22px;color:#58a6ff;margin-bottom:20px}
.summary{display:flex;gap:10px;margin-bottom:16px}
.sum-card{flex:1;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:12px;text-align:center}
.sum-label{font-size:12px;color:#8b949e;margin-bottom:4px}
.sum-val{font-size:18px;font-weight:700}
.income .sum-val{color:#3fb950}
.expense .sum-val{color:#f85149}
.balance .sum-val{color:#58a6ff}
.chart-area{display:flex;justify-content:center;margin-bottom:16px}
#chart{max-width:200px}
.form{display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap}
.form select,.form input{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:6px;padding:8px 10px;color:#e6edf3;font-size:13px;font-family:inherit;outline:none}
.form select:focus,.form input:focus{border-color:#58a6ff}
.form select{width:80px}.form input[type="number"]{width:90px}.form input[type="text"]{flex:1;min-width:80px}
#addBtn{background:#238636;color:#fff;border:none;border-radius:6px;padding:8px 16px;font-size:13px;cursor:pointer;font-family:inherit}
#addBtn:hover{filter:brightness(1.15)}
.list{display:flex;flex-direction:column;gap:6px}
.item{display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:10px 12px;font-size:13px}
.item.is-income{border-left:3px solid #3fb950}
.item.is-expense{border-left:3px solid #f85149}
.item-info{display:flex;flex-direction:column;gap:2px}
.item-cat{font-weight:600}
.item-memo{font-size:11px;color:#8b949e}
.item-right{display:flex;align-items:center;gap:8px}
.item-amount{font-weight:700}
.item-del{background:none;border:none;color:#f85149;cursor:pointer;font-size:16px;opacity:0.5}
.item-del:hover{opacity:1}`;

var EXPENSE_JS = `var STORAGE_KEY = 'f9_expense_v1';
var items = [];

function load() {
  try { var d = localStorage.getItem(STORAGE_KEY); items = d ? JSON.parse(d) : []; } catch(e) { items = []; }
}

function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }

function updateSummary() {
  var inc = 0, exp = 0;
  for (var i = 0; i < items.length; i++) {
    if (items[i].type === 'income') inc += items[i].amount;
    else exp += items[i].amount;
  }
  document.getElementById('incomeVal').textContent = '+' + inc.toLocaleString();
  document.getElementById('expenseVal').textContent = '-' + exp.toLocaleString();
  document.getElementById('balanceVal').textContent = (inc - exp).toLocaleString();
  drawChart();
}

function drawChart() {
  var canvas = document.getElementById('chart');
  var ctx = canvas.getContext('2d');
  var size = canvas.width;
  var cx = size / 2, cy = size / 2, r = size / 2 - 10;
  ctx.clearRect(0, 0, size, size);

  // gather expense categories
  var cats = {};
  for (var i = 0; i < items.length; i++) {
    if (items[i].type === 'expense') {
      var cat = items[i].category || '기타';
      cats[cat] = (cats[cat] || 0) + items[i].amount;
    }
  }
  var keys = Object.keys(cats);
  if (keys.length === 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8b949e';
    ctx.font = '13px -apple-system,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('데이터 없음', cx, cy + 4);
    return;
  }
  var total = 0;
  for (var i = 0; i < keys.length; i++) total += cats[keys[i]];
  var colors = ['#f85149','#d29922','#3fb950','#58a6ff','#bc8cff','#f778ba','#ffa657','#79c0ff'];
  var start = -Math.PI / 2;
  for (var i = 0; i < keys.length; i++) {
    var slice = (cats[keys[i]] / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, start + slice);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();
    // label
    var mid = start + slice / 2;
    var lx = cx + Math.cos(mid) * r * 0.6;
    var ly = cy + Math.sin(mid) * r * 0.6;
    ctx.fillStyle = '#fff';
    ctx.font = '11px -apple-system,sans-serif';
    ctx.textAlign = 'center';
    if (slice > 0.3) ctx.fillText(keys[i], lx, ly);
    start += slice;
  }
}

function renderList() {
  var list = document.getElementById('list');
  list.innerHTML = '';
  for (var i = items.length - 1; i >= 0; i--) {
    (function(idx) {
      var it = items[idx];
      var row = document.createElement('div');
      row.className = 'item ' + (it.type === 'income' ? 'is-income' : 'is-expense');
      var info = document.createElement('div');
      info.className = 'item-info';
      var cat = document.createElement('span');
      cat.className = 'item-cat';
      cat.textContent = it.category || '기타';
      var memo = document.createElement('span');
      memo.className = 'item-memo';
      memo.textContent = it.memo || '';
      info.appendChild(cat);
      info.appendChild(memo);
      var right = document.createElement('div');
      right.className = 'item-right';
      var amt = document.createElement('span');
      amt.className = 'item-amount';
      amt.style.color = it.type === 'income' ? '#3fb950' : '#f85149';
      amt.textContent = (it.type === 'income' ? '+' : '-') + it.amount.toLocaleString();
      var del = document.createElement('button');
      del.className = 'item-del';
      del.textContent = '\\u00D7';
      del.addEventListener('click', function() { items.splice(idx, 1); save(); render(); });
      right.appendChild(amt);
      right.appendChild(del);
      row.appendChild(info);
      row.appendChild(right);
      list.appendChild(row);
    })(i);
  }
}

function render() {
  updateSummary();
  renderList();
}

document.getElementById('addBtn').addEventListener('click', function() {
  var type = document.getElementById('typeSelect').value;
  var amount = parseInt(document.getElementById('amountInput').value);
  var category = document.getElementById('categoryInput').value.trim();
  var memo = document.getElementById('memoInput').value.trim();
  if (!amount || amount <= 0) return;
  items.push({ type: type, amount: amount, category: category || '기타', memo: memo });
  save();
  render();
  document.getElementById('amountInput').value = '';
  document.getElementById('categoryInput').value = '';
  document.getElementById('memoInput').value = '';
});

load();
render();`;

// ═══════════════════════════════════════════════════════════════════════════
// ██  6. MINESWEEPER  ██
// ═══════════════════════════════════════════════════════════════════════════
var MINE_HTML = `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Minesweeper</title><link rel="stylesheet" href="style.css"></head>
<body>
<div class="wrapper">
  <div class="header">
    <h1>\u{1F4A3} Minesweeper</h1>
    <div class="stats">
      <span id="mineCount">\u{1F6A9} 10</span>
      <span id="timer">\u23F1 0s</span>
    </div>
  </div>
  <div id="grid" class="grid"></div>
  <div class="footer">
    <button id="resetBtn">\u{1F504} 새 게임</button>
  </div>
  <div class="overlay hidden" id="overlay">
    <div class="overlay-box">
      <h2 id="resultTitle"></h2>
      <p id="resultMsg"></p>
      <button id="replayBtn">다시 하기</button>
    </div>
  </div>
</div>
<script src="script.js"></script>
</body></html>`;

var MINE_CSS = `*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;background:#0d1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e6edf3}
.wrapper{display:flex;flex-direction:column;align-items:center;min-height:100vh;padding:20px}
.header{text-align:center;margin-bottom:16px}
.header h1{font-size:22px;color:#58a6ff;margin-bottom:8px}
.stats{display:flex;gap:16px;justify-content:center;font-size:14px;color:#8b949e}
.stats span{background:rgba(255,255,255,0.06);padding:6px 14px;border-radius:8px}
.grid{display:grid;grid-template-columns:repeat(9,1fr);gap:3px;max-width:360px;width:100%}
.cell{aspect-ratio:1;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.1);border-radius:4px;cursor:pointer;font-size:14px;font-weight:700;user-select:none;transition:background 0.15s}
.cell:hover{background:rgba(255,255,255,0.12)}
.cell.revealed{background:rgba(255,255,255,0.03);cursor:default;border-color:rgba(255,255,255,0.05)}
.cell.mine{background:rgba(248,81,73,0.2)}
.cell.flagged{background:rgba(210,153,34,0.15)}
.cell .n1{color:#58a6ff}.cell .n2{color:#3fb950}.cell .n3{color:#f85149}
.cell .n4{color:#bc8cff}.cell .n5{color:#d29922}.cell .n6{color:#79c0ff}
.cell .n7{color:#e6edf3}.cell .n8{color:#8b949e}
.footer{margin-top:16px}
button{background:linear-gradient(135deg,#238636,#2ea043);color:#fff;border:none;padding:10px 24px;border-radius:8px;font-size:14px;cursor:pointer;font-family:inherit}
button:hover{filter:brightness(1.15)}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:100}
.overlay.hidden{display:none}
.overlay-box{background:#161b22;border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:40px;text-align:center}
.overlay-box h2{font-size:28px;margin-bottom:12px;color:#58a6ff}
.overlay-box p{color:#8b949e;margin-bottom:20px;font-size:14px}`;

var MINE_JS = `var ROWS = 9, COLS = 9, MINES = 10;
var board = [];
var revealed = [];
var flags = [];
var gameOver = false;
var firstClick = true;
var timerVal = 0;
var timerInterval = null;
var flagCount = 0;

function init() {
  board = [];
  revealed = [];
  flags = [];
  gameOver = false;
  firstClick = true;
  flagCount = 0;
  timerVal = 0;
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = null;
  document.getElementById('timer').textContent = '\\u23F1 0s';
  document.getElementById('mineCount').textContent = '\\u{1F6A9} ' + MINES;
  document.getElementById('overlay').classList.add('hidden');

  for (var r = 0; r < ROWS; r++) {
    board[r] = [];
    revealed[r] = [];
    flags[r] = [];
    for (var c = 0; c < COLS; c++) {
      board[r][c] = 0;
      revealed[r][c] = false;
      flags[r][c] = false;
    }
  }
  renderGrid();
}

function placeMines(safeR, safeC) {
  var placed = 0;
  while (placed < MINES) {
    var r = Math.floor(Math.random() * ROWS);
    var c = Math.floor(Math.random() * COLS);
    if (board[r][c] === -1) continue;
    if (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue;
    board[r][c] = -1;
    placed++;
  }
  // calc numbers
  for (var r = 0; r < ROWS; r++) {
    for (var c = 0; c < COLS; c++) {
      if (board[r][c] === -1) continue;
      var count = 0;
      for (var dr = -1; dr <= 1; dr++) {
        for (var dc = -1; dc <= 1; dc++) {
          var nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc] === -1) count++;
        }
      }
      board[r][c] = count;
    }
  }
}

function renderGrid() {
  var grid = document.getElementById('grid');
  grid.innerHTML = '';
  for (var r = 0; r < ROWS; r++) {
    for (var c = 0; c < COLS; c++) {
      var cell = document.createElement('div');
      cell.className = 'cell';
      cell.setAttribute('data-r', String(r));
      cell.setAttribute('data-c', String(c));
      if (revealed[r][c]) {
        cell.classList.add('revealed');
        if (board[r][c] === -1) {
          cell.classList.add('mine');
          cell.textContent = '\\u{1F4A3}';
        } else if (board[r][c] > 0) {
          var span = document.createElement('span');
          span.className = 'n' + board[r][c];
          span.textContent = String(board[r][c]);
          cell.appendChild(span);
        }
      } else if (flags[r][c]) {
        cell.classList.add('flagged');
        cell.textContent = '\\u{1F6A9}';
      }
      (function(row, col) {
        cell.addEventListener('click', function() { onReveal(row, col); });
        cell.addEventListener('contextmenu', function(e) { e.preventDefault(); onFlag(row, col); });
      })(r, c);
      grid.appendChild(cell);
    }
  }
}

function onReveal(r, c) {
  if (gameOver || flags[r][c] || revealed[r][c]) return;
  if (firstClick) {
    firstClick = false;
    placeMines(r, c);
    timerInterval = setInterval(function() {
      timerVal++;
      document.getElementById('timer').textContent = '\\u23F1 ' + timerVal + 's';
    }, 1000);
  }
  if (board[r][c] === -1) {
    // game over - reveal all mines
    gameOver = true;
    clearInterval(timerInterval);
    for (var i = 0; i < ROWS; i++) for (var j = 0; j < COLS; j++) if (board[i][j] === -1) revealed[i][j] = true;
    renderGrid();
    showResult(false);
    return;
  }
  flood(r, c);
  renderGrid();
  checkWin();
}

function flood(r, c) {
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return;
  if (revealed[r][c] || flags[r][c]) return;
  revealed[r][c] = true;
  if (board[r][c] === 0) {
    for (var dr = -1; dr <= 1; dr++) {
      for (var dc = -1; dc <= 1; dc++) {
        flood(r + dr, c + dc);
      }
    }
  }
}

function onFlag(r, c) {
  if (gameOver || revealed[r][c]) return;
  flags[r][c] = !flags[r][c];
  flagCount += flags[r][c] ? 1 : -1;
  document.getElementById('mineCount').textContent = '\\u{1F6A9} ' + (MINES - flagCount);
  renderGrid();
}

function checkWin() {
  var unrevealed = 0;
  for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) if (!revealed[r][c]) unrevealed++;
  if (unrevealed === MINES) {
    gameOver = true;
    clearInterval(timerInterval);
    showResult(true);
  }
}

function showResult(win) {
  document.getElementById('resultTitle').textContent = win ? '\\u{1F389} 승리!' : '\\u{1F4A5} 패배!';
  document.getElementById('resultMsg').textContent = win ? timerVal + '초 만에 클리어!' : '지뢰를 밟았습니다...';
  document.getElementById('overlay').classList.remove('hidden');
}

document.getElementById('resetBtn').addEventListener('click', init);
document.getElementById('replayBtn').addEventListener('click', init);
init();`;

// ═══════════════════════════════════════════════════════════════════════════
// ██  7. FLAPPY BIRD  ██
// ═══════════════════════════════════════════════════════════════════════════
var FLAPPY_HTML = `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Flappy Bird</title><link rel="stylesheet" href="style.css"></head>
<body>
<div class="wrapper">
  <h1>\u{1F426} Flappy Bird</h1>
  <div class="stats">
    <span id="scoreEl">Score: 0</span>
    <span id="bestEl">Best: 0</span>
  </div>
  <div class="canvas-wrap">
    <canvas id="game" width="320" height="480"></canvas>
    <div class="overlay" id="startScreen">
      <div class="overlay-content">
        <h2>\u{1F426} Flappy Bird</h2>
        <p>클릭 또는 스페이스바로 점프!</p>
        <button id="startBtn">\u25B6 시작</button>
      </div>
    </div>
    <div class="overlay hidden" id="overScreen">
      <div class="overlay-content">
        <h2>\u{1F480} Game Over</h2>
        <p id="finalScore">Score: 0</p>
        <button id="retryBtn">\u{1F504} 다시</button>
      </div>
    </div>
  </div>
</div>
<script src="script.js"></script>
</body></html>`;

var FLAPPY_CSS = `*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;background:#0d1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e6edf3}
.wrapper{display:flex;flex-direction:column;align-items:center;min-height:100vh;padding:20px}
h1{font-size:22px;color:#58a6ff;margin-bottom:10px}
.stats{display:flex;gap:16px;margin-bottom:12px;font-size:14px;color:#8b949e}
.stats span{background:rgba(255,255,255,0.06);padding:6px 14px;border-radius:8px}
.canvas-wrap{position:relative;border:2px solid rgba(255,255,255,0.1);border-radius:10px;overflow:hidden}
#game{display:block;background:#1a1a2e}
.overlay{position:absolute;inset:0;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:10}
.overlay.hidden{display:none}
.overlay-content{text-align:center;padding:20px}
.overlay-content h2{font-size:24px;color:#58a6ff;margin-bottom:10px}
.overlay-content p{color:#8b949e;margin-bottom:16px;font-size:14px}
button{background:linear-gradient(135deg,#238636,#2ea043);color:#fff;border:none;padding:10px 24px;border-radius:8px;font-size:14px;cursor:pointer;font-family:inherit}
button:hover{filter:brightness(1.15)}`;

var FLAPPY_JS = `var canvas = document.getElementById('game');
var ctx = canvas.getContext('2d');
var W = canvas.width, H = canvas.height;
var STORAGE_KEY = 'f9_flappy_best';

var bird, pipes, score, bestScore, gravity, jump, pipeGap, pipeWidth, pipeSpeed, frameId, running;

function loadBest() {
  try { bestScore = parseInt(localStorage.getItem(STORAGE_KEY)) || 0; } catch(e) { bestScore = 0; }
  document.getElementById('bestEl').textContent = 'Best: ' + bestScore;
}

function saveBest() {
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem(STORAGE_KEY, String(bestScore));
    document.getElementById('bestEl').textContent = 'Best: ' + bestScore;
  }
}

function reset() {
  bird = { x: 60, y: H / 2, vy: 0, size: 16 };
  pipes = [];
  score = 0;
  gravity = 0.4;
  jump = -6.5;
  pipeGap = 130;
  pipeWidth = 45;
  pipeSpeed = 2.2;
  running = false;
  document.getElementById('scoreEl').textContent = 'Score: 0';
}

function spawnPipe() {
  var minTop = 60;
  var maxTop = H - pipeGap - 60;
  var topH = minTop + Math.random() * (maxTop - minTop);
  pipes.push({ x: W, topH: topH, passed: false });
}

function flap() {
  if (!running) {
    running = true;
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('overScreen').classList.add('hidden');
    spawnPipe();
    loop();
    return;
  }
  bird.vy = jump;
}

function update() {
  bird.vy += gravity;
  bird.y += bird.vy;

  // spawn pipes
  if (pipes.length === 0 || pipes[pipes.length - 1].x < W - 180) {
    spawnPipe();
  }

  for (var i = pipes.length - 1; i >= 0; i--) {
    pipes[i].x -= pipeSpeed;
    // score
    if (!pipes[i].passed && pipes[i].x + pipeWidth < bird.x) {
      pipes[i].passed = true;
      score++;
      document.getElementById('scoreEl').textContent = 'Score: ' + score;
    }
    // remove offscreen
    if (pipes[i].x + pipeWidth < 0) pipes.splice(i, 1);
  }

  // collision
  if (bird.y - bird.size < 0 || bird.y + bird.size > H) return gameEnd();
  for (var i = 0; i < pipes.length; i++) {
    var p = pipes[i];
    if (bird.x + bird.size > p.x && bird.x - bird.size < p.x + pipeWidth) {
      if (bird.y - bird.size < p.topH || bird.y + bird.size > p.topH + pipeGap) return gameEnd();
    }
  }
}

function draw() {
  // sky
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, W, H);

  // pipes
  ctx.fillStyle = '#238636';
  for (var i = 0; i < pipes.length; i++) {
    var p = pipes[i];
    ctx.fillRect(p.x, 0, pipeWidth, p.topH);
    ctx.fillRect(p.x, p.topH + pipeGap, pipeWidth, H - p.topH - pipeGap);
    // caps
    ctx.fillStyle = '#2ea043';
    ctx.fillRect(p.x - 3, p.topH - 16, pipeWidth + 6, 16);
    ctx.fillRect(p.x - 3, p.topH + pipeGap, pipeWidth + 6, 16);
    ctx.fillStyle = '#238636';
  }

  // bird
  ctx.fillStyle = '#f9c74f';
  ctx.beginPath();
  ctx.arc(bird.x, bird.y, bird.size, 0, Math.PI * 2);
  ctx.fill();
  // eye
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(bird.x + 6, bird.y - 4, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(bird.x + 7, bird.y - 4, 2.5, 0, Math.PI * 2);
  ctx.fill();
  // beak
  ctx.fillStyle = '#f85149';
  ctx.beginPath();
  ctx.moveTo(bird.x + 14, bird.y);
  ctx.lineTo(bird.x + 22, bird.y + 3);
  ctx.lineTo(bird.x + 14, bird.y + 6);
  ctx.closePath();
  ctx.fill();

  // score
  ctx.fillStyle = '#e6edf3';
  ctx.font = 'bold 28px -apple-system,sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(String(score), W / 2, 40);
}

function loop() {
  if (!running) return;
  update();
  draw();
  frameId = requestAnimationFrame(loop);
}

function gameEnd() {
  running = false;
  cancelAnimationFrame(frameId);
  saveBest();
  document.getElementById('finalScore').textContent = 'Score: ' + score;
  document.getElementById('overScreen').classList.remove('hidden');
}

canvas.addEventListener('click', flap);
document.addEventListener('keydown', function(e) {
  if (e.code === 'Space') { e.preventDefault(); flap(); }
});
document.getElementById('startBtn').addEventListener('click', function() { reset(); flap(); });
document.getElementById('retryBtn').addEventListener('click', function() { reset(); flap(); });

loadBest();
reset();
draw();`;

// ═══════════════════════════════════════════════════════════════════════════
// ██  8. BREAKOUT  ██
// ═══════════════════════════════════════════════════════════════════════════
var BREAKOUT_HTML = `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Breakout</title><link rel="stylesheet" href="style.css"></head>
<body>
<div class="wrapper">
  <h1>\u{1F9F1} Breakout</h1>
  <div class="stats">
    <span id="scoreEl">Score: 0</span>
    <span id="livesEl">\u2764\uFE0F 3</span>
    <span id="levelEl">Lv 1</span>
  </div>
  <div class="canvas-wrap">
    <canvas id="game" width="400" height="500"></canvas>
    <div class="overlay" id="startScreen">
      <div class="overlay-content">
        <h2>\u{1F9F1} Breakout</h2>
        <p>마우스 또는 \\u2190\\u2192 키로 패들을 이동!</p>
        <button id="startBtn">\u25B6 시작</button>
      </div>
    </div>
    <div class="overlay hidden" id="overScreen">
      <div class="overlay-content">
        <h2 id="endTitle"></h2>
        <p id="endMsg"></p>
        <button id="retryBtn">\u{1F504} 다시</button>
      </div>
    </div>
  </div>
</div>
<script src="script.js"></script>
</body></html>`;

var BREAKOUT_CSS = `*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;background:#0d1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e6edf3}
.wrapper{display:flex;flex-direction:column;align-items:center;min-height:100vh;padding:20px}
h1{font-size:22px;color:#58a6ff;margin-bottom:10px}
.stats{display:flex;gap:16px;margin-bottom:12px;font-size:14px;color:#8b949e}
.stats span{background:rgba(255,255,255,0.06);padding:6px 14px;border-radius:8px}
.canvas-wrap{position:relative;border:2px solid rgba(255,255,255,0.1);border-radius:10px;overflow:hidden}
#game{display:block;background:#0d1117}
.overlay{position:absolute;inset:0;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:10}
.overlay.hidden{display:none}
.overlay-content{text-align:center;padding:20px}
.overlay-content h2{font-size:24px;color:#58a6ff;margin-bottom:10px}
.overlay-content p{color:#8b949e;margin-bottom:16px;font-size:14px}
button{background:linear-gradient(135deg,#238636,#2ea043);color:#fff;border:none;padding:10px 24px;border-radius:8px;font-size:14px;cursor:pointer;font-family:inherit}
button:hover{filter:brightness(1.15)}`;

var BREAKOUT_JS = `var canvas = document.getElementById('game');
var ctx = canvas.getContext('2d');
var W = canvas.width, H = canvas.height;

var BRICK_ROWS = 5, BRICK_COLS = 8;
var BRICK_W, BRICK_H = 18, BRICK_PAD = 4, BRICK_TOP = 50;
var PADDLE_H = 12, PADDLE_W = 70;

var ball, paddle, bricks, score, lives, level, running, frameId;
var speedMultiplier;

var brickColors = ['#f85149','#d29922','#3fb950','#58a6ff','#bc8cff'];

function init() {
  BRICK_W = (W - BRICK_PAD * (BRICK_COLS + 1)) / BRICK_COLS;
  score = 0;
  lives = 3;
  level = 1;
  speedMultiplier = 1;
  running = false;
  document.getElementById('scoreEl').textContent = 'Score: 0';
  document.getElementById('livesEl').textContent = '\\u2764\\uFE0F ' + lives;
  document.getElementById('levelEl').textContent = 'Lv ' + level;
  document.getElementById('overScreen').classList.add('hidden');
  resetBall();
  createBricks();
  drawAll();
}

function resetBall() {
  paddle = { x: W / 2 - PADDLE_W / 2, y: H - 30 };
  ball = { x: W / 2, y: H - 50, dx: 3 * speedMultiplier, dy: -3 * speedMultiplier, r: 6 };
}

function createBricks() {
  bricks = [];
  for (var r = 0; r < BRICK_ROWS; r++) {
    for (var c = 0; c < BRICK_COLS; c++) {
      bricks.push({
        x: BRICK_PAD + c * (BRICK_W + BRICK_PAD),
        y: BRICK_TOP + r * (BRICK_H + BRICK_PAD),
        w: BRICK_W, h: BRICK_H,
        color: brickColors[r % brickColors.length],
        alive: true
      });
    }
  }
}

function update() {
  ball.x += ball.dx;
  ball.y += ball.dy;

  // wall bounce
  if (ball.x - ball.r < 0 || ball.x + ball.r > W) ball.dx = -ball.dx;
  if (ball.y - ball.r < 0) ball.dy = -ball.dy;

  // bottom
  if (ball.y + ball.r > H) {
    lives--;
    document.getElementById('livesEl').textContent = '\\u2764\\uFE0F ' + lives;
    if (lives <= 0) { endGame(false); return; }
    resetBall();
  }

  // paddle
  if (ball.dy > 0 && ball.y + ball.r >= paddle.y && ball.y + ball.r <= paddle.y + PADDLE_H &&
      ball.x >= paddle.x && ball.x <= paddle.x + PADDLE_W) {
    ball.dy = -Math.abs(ball.dy);
    var hit = (ball.x - paddle.x) / PADDLE_W - 0.5;
    ball.dx = hit * 6 * speedMultiplier;
  }

  // bricks
  for (var i = 0; i < bricks.length; i++) {
    var b = bricks[i];
    if (!b.alive) continue;
    if (ball.x + ball.r > b.x && ball.x - ball.r < b.x + b.w &&
        ball.y + ball.r > b.y && ball.y - ball.r < b.y + b.h) {
      b.alive = false;
      ball.dy = -ball.dy;
      score += 10;
      document.getElementById('scoreEl').textContent = 'Score: ' + score;
      break;
    }
  }

  // check level clear
  var alive = 0;
  for (var i = 0; i < bricks.length; i++) if (bricks[i].alive) alive++;
  if (alive === 0) {
    level++;
    speedMultiplier += 0.3;
    document.getElementById('levelEl').textContent = 'Lv ' + level;
    resetBall();
    createBricks();
  }
}

function drawAll() {
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, W, H);

  // bricks
  for (var i = 0; i < bricks.length; i++) {
    var b = bricks[i];
    if (!b.alive) continue;
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.roundRect(b.x, b.y, b.w, b.h, 3);
    ctx.fill();
  }

  // paddle
  ctx.fillStyle = '#e6edf3';
  ctx.beginPath();
  ctx.roundRect(paddle.x, paddle.y, PADDLE_W, PADDLE_H, 6);
  ctx.fill();

  // ball
  ctx.fillStyle = '#f9c74f';
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();
}

function loop() {
  if (!running) return;
  update();
  drawAll();
  frameId = requestAnimationFrame(loop);
}

function startGame() {
  running = true;
  document.getElementById('startScreen').classList.add('hidden');
  loop();
}

function endGame(win) {
  running = false;
  cancelAnimationFrame(frameId);
  document.getElementById('endTitle').textContent = win ? '\\u{1F389} 클리어!' : '\\u{1F480} Game Over';
  document.getElementById('endMsg').textContent = 'Score: ' + score + ' (Lv ' + level + ')';
  document.getElementById('overScreen').classList.remove('hidden');
}

// controls
canvas.addEventListener('mousemove', function(e) {
  var rect = canvas.getBoundingClientRect();
  var mx = e.clientX - rect.left;
  paddle.x = Math.max(0, Math.min(W - PADDLE_W, mx - PADDLE_W / 2));
  if (!running) drawAll();
});

var keys = {};
document.addEventListener('keydown', function(e) { keys[e.key] = true; });
document.addEventListener('keyup', function(e) { keys[e.key] = false; });

// keyboard paddle movement in game loop
var origLoop = loop;
loop = function() {
  if (!running) return;
  if (keys['ArrowLeft']) paddle.x = Math.max(0, paddle.x - 7);
  if (keys['ArrowRight']) paddle.x = Math.min(W - PADDLE_W, paddle.x + 7);
  update();
  drawAll();
  frameId = requestAnimationFrame(loop);
};

document.getElementById('startBtn').addEventListener('click', function() { init(); startGame(); });
document.getElementById('retryBtn').addEventListener('click', function() { init(); startGame(); });

init();`;

// ═══════════════════════════════════════════════════════════════════════════
// ██  9. MUSIC PLAYER  ██
// ═══════════════════════════════════════════════════════════════════════════
var MUSIC_HTML = `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Music Player</title><link rel="stylesheet" href="style.css"></head>
<body>
<div class="wrapper">
  <div class="player">
    <div class="album-art" id="albumArt">\u{1F3B5}</div>
    <div class="track-info">
      <div class="track-title" id="trackTitle">재생할 곡을 선택하세요</div>
      <div class="track-artist" id="trackArtist">-</div>
    </div>
    <div class="progress-area">
      <span id="currentTime">0:00</span>
      <div class="progress-bar" id="progressBar">
        <div class="progress-fill" id="progressFill"></div>
      </div>
      <span id="totalTime">0:00</span>
    </div>
    <div class="controls">
      <button id="prevBtn">\u23EE</button>
      <button id="playBtn" class="play-btn">\u25B6</button>
      <button id="nextBtn">\u23ED</button>
    </div>
    <div class="volume-area">
      <span>\u{1F509}</span>
      <input type="range" id="volumeSlider" min="0" max="100" value="70" />
      <span>\u{1F50A}</span>
    </div>
  </div>
  <div class="playlist">
    <div class="pl-header">Playlist</div>
    <div id="playlistEl" class="pl-list"></div>
  </div>
</div>
<script src="script.js"></script>
</body></html>`;

var MUSIC_CSS = `*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;background:#0d1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e6edf3}
.wrapper{max-width:380px;margin:0 auto;padding:30px 20px;display:flex;flex-direction:column;gap:20px}
.player{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:24px;display:flex;flex-direction:column;align-items:center;gap:16px}
.album-art{width:120px;height:120px;background:rgba(255,255,255,0.06);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:48px;border:3px solid rgba(88,166,255,0.2);transition:transform 2s linear}
.album-art.spinning{animation:spin 3s linear infinite}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
.track-info{text-align:center}
.track-title{font-size:16px;font-weight:700;color:#e6edf3;margin-bottom:4px}
.track-artist{font-size:13px;color:#8b949e}
.progress-area{display:flex;align-items:center;gap:8px;width:100%;font-size:12px;color:#8b949e}
.progress-bar{flex:1;height:6px;background:rgba(255,255,255,0.08);border-radius:3px;cursor:pointer;position:relative;overflow:hidden}
.progress-fill{height:100%;background:#58a6ff;border-radius:3px;width:0;transition:width 0.3s}
.controls{display:flex;align-items:center;gap:16px}
.controls button{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#e6edf3;width:44px;height:44px;border-radius:50%;cursor:pointer;font-size:18px;display:flex;align-items:center;justify-content:center;transition:all 0.2s}
.controls button:hover{border-color:#58a6ff;background:rgba(88,166,255,0.1)}
.play-btn{width:52px!important;height:52px!important;font-size:22px!important;background:rgba(88,166,255,0.15)!important;border-color:#58a6ff!important}
.volume-area{display:flex;align-items:center;gap:8px;width:100%;font-size:14px}
.volume-area input{flex:1;accent-color:#58a6ff;height:4px}
.playlist{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:14px;overflow:hidden}
.pl-header{padding:12px 16px;font-size:14px;font-weight:700;color:#58a6ff;border-bottom:1px solid rgba(255,255,255,0.06)}
.pl-list{display:flex;flex-direction:column}
.pl-item{display:flex;align-items:center;gap:12px;padding:10px 16px;cursor:pointer;transition:background 0.15s;border-bottom:1px solid rgba(255,255,255,0.04)}
.pl-item:hover{background:rgba(255,255,255,0.04)}
.pl-item.active{background:rgba(88,166,255,0.08)}
.pl-item .pl-icon{font-size:24px}
.pl-item .pl-info{flex:1}
.pl-item .pl-name{font-size:13px;font-weight:600}
.pl-item .pl-artist{font-size:11px;color:#8b949e}
.pl-item .pl-dur{font-size:12px;color:#8b949e}`;

var MUSIC_JS = `var playlist = [
  { title: 'Midnight Groove', artist: 'DJ Chill', icon: '\\u{1F3B7}', duration: 214 },
  { title: 'Sunset Drive', artist: 'Lofi Beats', icon: '\\u{1F305}', duration: 187 },
  { title: 'Electric Dreams', artist: 'Synth Wave', icon: '\\u26A1', duration: 243 },
  { title: 'Ocean Breeze', artist: 'Nature Sound', icon: '\\u{1F30A}', duration: 198 },
  { title: 'Pixel Adventure', artist: '8-Bit Hero', icon: '\\u{1F3AE}', duration: 162 }
];

var currentIdx = -1;
var isPlaying = false;
var currentTime = 0;
var volume = 70;
var simInterval = null;

function formatTime(s) {
  var m = Math.floor(s / 60);
  var sec = Math.floor(s % 60);
  return m + ':' + (sec < 10 ? '0' : '') + sec;
}

function renderPlaylist() {
  var el = document.getElementById('playlistEl');
  el.innerHTML = '';
  for (var i = 0; i < playlist.length; i++) {
    (function(idx) {
      var item = document.createElement('div');
      item.className = 'pl-item' + (idx === currentIdx ? ' active' : '');
      item.innerHTML = '<span class="pl-icon">' + playlist[idx].icon + '</span>' +
        '<div class="pl-info"><div class="pl-name">' + playlist[idx].title + '</div>' +
        '<div class="pl-artist">' + playlist[idx].artist + '</div></div>' +
        '<span class="pl-dur">' + formatTime(playlist[idx].duration) + '</span>';
      item.addEventListener('click', function() { selectTrack(idx); play(); });
      el.appendChild(item);
    })(i);
  }
}

function selectTrack(idx) {
  currentIdx = idx;
  currentTime = 0;
  var track = playlist[idx];
  document.getElementById('albumArt').textContent = track.icon;
  document.getElementById('trackTitle').textContent = track.title;
  document.getElementById('trackArtist').textContent = track.artist;
  document.getElementById('totalTime').textContent = formatTime(track.duration);
  document.getElementById('currentTime').textContent = '0:00';
  document.getElementById('progressFill').style.width = '0%';
  renderPlaylist();
}

function play() {
  if (currentIdx < 0) selectTrack(0);
  isPlaying = true;
  document.getElementById('playBtn').textContent = '\\u23F8';
  document.getElementById('albumArt').classList.add('spinning');
  startSimulation();
}

function pause() {
  isPlaying = false;
  document.getElementById('playBtn').textContent = '\\u25B6';
  document.getElementById('albumArt').classList.remove('spinning');
  if (simInterval) { clearInterval(simInterval); simInterval = null; }
}

function startSimulation() {
  if (simInterval) clearInterval(simInterval);
  simInterval = setInterval(function() {
    if (!isPlaying || currentIdx < 0) return;
    currentTime += 1;
    var dur = playlist[currentIdx].duration;
    if (currentTime >= dur) {
      nextTrack();
      return;
    }
    document.getElementById('currentTime').textContent = formatTime(currentTime);
    document.getElementById('progressFill').style.width = (currentTime / dur * 100) + '%';
  }, 1000);
}

function nextTrack() {
  var idx = (currentIdx + 1) % playlist.length;
  selectTrack(idx);
  play();
}

function prevTrack() {
  if (currentTime > 3) {
    currentTime = 0;
    document.getElementById('currentTime').textContent = '0:00';
    document.getElementById('progressFill').style.width = '0%';
    return;
  }
  var idx = (currentIdx - 1 + playlist.length) % playlist.length;
  selectTrack(idx);
  if (isPlaying) play();
}

document.getElementById('playBtn').addEventListener('click', function() {
  if (isPlaying) pause(); else play();
});
document.getElementById('nextBtn').addEventListener('click', nextTrack);
document.getElementById('prevBtn').addEventListener('click', prevTrack);
document.getElementById('volumeSlider').addEventListener('input', function() {
  volume = parseInt(this.value);
});
document.getElementById('progressBar').addEventListener('click', function(e) {
  if (currentIdx < 0) return;
  var rect = this.getBoundingClientRect();
  var pct = (e.clientX - rect.left) / rect.width;
  currentTime = Math.floor(pct * playlist[currentIdx].duration);
  document.getElementById('currentTime').textContent = formatTime(currentTime);
  document.getElementById('progressFill').style.width = (pct * 100) + '%';
});

renderPlaylist();`;

// ═══════════════════════════════════════════════════════════════════════════
// ██  10. QR GENERATOR  ██
// ═══════════════════════════════════════════════════════════════════════════
var QR_HTML = `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>QR Generator</title><link rel="stylesheet" href="style.css"></head>
<body>
<div class="wrapper">
  <h1>\u{1F4F1} QR Generator</h1>
  <p class="desc">텍스트를 입력하면 QR 스타일 매트릭스를 생성합니다.</p>
  <div class="input-area">
    <textarea id="textInput" placeholder="텍스트 또는 URL을 입력하세요..." rows="3">https://example.com</textarea>
    <button id="genBtn">생성</button>
  </div>
  <div class="canvas-area">
    <canvas id="qrCanvas" width="290" height="290"></canvas>
  </div>
  <button id="downloadBtn" class="dl-btn">\u{1F4E5} 이미지 다운로드</button>
</div>
<script src="script.js"></script>
</body></html>`;

var QR_CSS = `*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;background:#0d1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e6edf3}
.wrapper{max-width:400px;margin:0 auto;padding:30px 20px;display:flex;flex-direction:column;align-items:center;gap:16px}
h1{font-size:22px;color:#58a6ff}
.desc{font-size:13px;color:#8b949e;text-align:center}
.input-area{width:100%;display:flex;flex-direction:column;gap:8px}
textarea{width:100%;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px;color:#e6edf3;font-size:14px;font-family:inherit;resize:vertical;outline:none}
textarea:focus{border-color:#58a6ff}
#genBtn{background:#238636;color:#fff;border:none;border-radius:8px;padding:10px;font-size:14px;cursor:pointer;font-family:inherit}
#genBtn:hover{filter:brightness(1.15)}
.canvas-area{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:16px;display:flex;align-items:center;justify-content:center}
#qrCanvas{image-rendering:pixelated}
.dl-btn{background:rgba(255,255,255,0.06);color:#e6edf3;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:10px 20px;font-size:13px;cursor:pointer;font-family:inherit}
.dl-btn:hover{border-color:#58a6ff;background:rgba(88,166,255,0.1)}`;

var QR_JS = `var canvas = document.getElementById('qrCanvas');
var ctx = canvas.getContext('2d');
var SIZE = 29; // QR Version 3 is 29x29
var CELL;

function hashStr(str) {
  var h = 0;
  for (var i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return h;
}

function generateMatrix(text) {
  var grid = [];
  for (var r = 0; r < SIZE; r++) {
    grid[r] = [];
    for (var c = 0; c < SIZE; c++) {
      grid[r][c] = 0;
    }
  }

  // Finder patterns (3 corners)
  function drawFinder(sr, sc) {
    for (var r = 0; r < 7; r++) {
      for (var c = 0; c < 7; c++) {
        if (r === 0 || r === 6 || c === 0 || c === 6 ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
          grid[sr + r][sc + c] = 1;
        }
      }
    }
  }
  drawFinder(0, 0);
  drawFinder(0, SIZE - 7);
  drawFinder(SIZE - 7, 0);

  // Timing patterns
  for (var i = 8; i < SIZE - 8; i++) {
    grid[6][i] = (i % 2 === 0) ? 1 : 0;
    grid[i][6] = (i % 2 === 0) ? 1 : 0;
  }

  // Alignment pattern (Version 3: at 22,22)
  var ax = 22, ay = 22;
  for (var r = -2; r <= 2; r++) {
    for (var c = -2; c <= 2; c++) {
      if (Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0)) {
        grid[ay + r][ax + c] = 1;
      }
    }
  }

  // Data area: fill based on text hash + character codes
  var seed = hashStr(text);
  var charIdx = 0;
  for (var r = 0; r < SIZE; r++) {
    for (var c = 0; c < SIZE; c++) {
      // skip finder/timing/alignment regions
      if ((r < 9 && c < 9) || (r < 9 && c >= SIZE - 8) || (r >= SIZE - 8 && c < 9)) continue;
      if (r === 6 || c === 6) continue;
      if (r >= 20 && r <= 24 && c >= 20 && c <= 24) continue;

      // deterministic pattern from text
      var ch = text.charCodeAt(charIdx % text.length);
      var bit = ((seed ^ (ch * (r + 1)) ^ (r * 7 + c * 13)) >>> 0) % 3;
      grid[r][c] = bit === 0 ? 0 : 1;
      charIdx++;
      seed = (seed * 1103515245 + 12345) | 0;
    }
  }

  // Apply mask (checkerboard XOR for visual interest)
  for (var r = 0; r < SIZE; r++) {
    for (var c = 0; c < SIZE; c++) {
      if ((r < 9 && c < 9) || (r < 9 && c >= SIZE - 8) || (r >= SIZE - 8 && c < 9)) continue;
      if (r === 6 || c === 6) continue;
      if (r >= 20 && r <= 24 && c >= 20 && c <= 24) continue;
      if ((r + c) % 2 === 0) grid[r][c] = grid[r][c] ? 0 : 1;
    }
  }

  return grid;
}

function drawQR(grid) {
  CELL = Math.floor(canvas.width / SIZE);
  var offset = Math.floor((canvas.width - CELL * SIZE) / 2);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#0d1117';
  for (var r = 0; r < SIZE; r++) {
    for (var c = 0; c < SIZE; c++) {
      if (grid[r][c]) {
        ctx.fillRect(offset + c * CELL, offset + r * CELL, CELL, CELL);
      }
    }
  }
}

function generate() {
  var text = document.getElementById('textInput').value.trim();
  if (!text) return;
  var grid = generateMatrix(text);
  drawQR(grid);
}

document.getElementById('genBtn').addEventListener('click', generate);
document.getElementById('textInput').addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); generate(); }
});

document.getElementById('downloadBtn').addEventListener('click', function() {
  var link = document.createElement('a');
  link.download = 'qr_' + Date.now() + '.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
});

generate();`;

// ═══════════════════════════════════════════════════════════════════════════
// ██  TEMPLATE REGISTRY  ██
// ═══════════════════════════════════════════════════════════════════════════
export const TEMPLATES3: TemplateInfo3[] = [
  {
    keywords: ["칸반", "kanban", "보드", "board", "프로젝트관리"],
    name: "Kanban Board", icon: "\u{1F4CB}", description: "칸반 보드 \u2014 Todo/Doing/Done, 카드 드래그앤드롭, localStorage",
    category: "app",
    files: {
      "index.html": { name: "index.html", language: "html", content: KANBAN_HTML },
      "style.css": { name: "style.css", language: "css", content: KANBAN_CSS },
      "script.js": { name: "script.js", language: "javascript", content: KANBAN_JS },
    },
  },
  {
    keywords: ["달력", "calendar", "일정", "캘린더", "스케줄"],
    name: "Calendar", icon: "\u{1F4C5}", description: "달력 \u2014 월간 그리드, 일정 추가/삭제, localStorage",
    category: "app",
    files: {
      "index.html": { name: "index.html", language: "html", content: CALENDAR_HTML },
      "style.css": { name: "style.css", language: "css", content: CALENDAR_CSS },
      "script.js": { name: "script.js", language: "javascript", content: CALENDAR_JS },
    },
  },
  {
    keywords: ["마크다운", "markdown", "에디터", "editor", "md"],
    name: "Markdown Editor", icon: "\u270D\uFE0F", description: "마크다운 에디터 \u2014 실시간 미리보기, 제목/굵게/코드/리스트",
    category: "tool",
    files: {
      "index.html": { name: "index.html", language: "html", content: MARKDOWN_HTML },
      "style.css": { name: "style.css", language: "css", content: MARKDOWN_CSS },
      "script.js": { name: "script.js", language: "javascript", content: MARKDOWN_JS },
    },
  },
  {
    keywords: ["단위", "unit", "변환", "converter", "환산"],
    name: "Unit Converter", icon: "\u{1F4D0}", description: "단위 변환기 \u2014 길이/무게/온도, 양방향 실시간 변환",
    category: "tool",
    files: {
      "index.html": { name: "index.html", language: "html", content: UNIT_HTML },
      "style.css": { name: "style.css", language: "css", content: UNIT_CSS },
      "script.js": { name: "script.js", language: "javascript", content: UNIT_JS },
    },
  },
  {
    keywords: ["가계부", "expense", "지출", "수입", "돈", "finance"],
    name: "Expense Tracker", icon: "\u{1F4B0}", description: "가계부 \u2014 수입/지출 관리, 파이차트, localStorage",
    category: "app",
    files: {
      "index.html": { name: "index.html", language: "html", content: EXPENSE_HTML },
      "style.css": { name: "style.css", language: "css", content: EXPENSE_CSS },
      "script.js": { name: "script.js", language: "javascript", content: EXPENSE_JS },
    },
  },
  {
    keywords: ["지뢰찾기", "minesweeper", "지뢰", "mine"],
    name: "Minesweeper", icon: "\u{1F4A3}", description: "지뢰찾기 \u2014 9x9, 좌클릭 열기, 우클릭 깃발, 승/패 판정",
    category: "game",
    files: {
      "index.html": { name: "index.html", language: "html", content: MINE_HTML },
      "style.css": { name: "style.css", language: "css", content: MINE_CSS },
      "script.js": { name: "script.js", language: "javascript", content: MINE_JS },
    },
  },
  {
    keywords: ["플래피", "flappy", "bird", "새", "파이프"],
    name: "Flappy Bird", icon: "\u{1F426}", description: "Flappy Bird \u2014 클릭/스페이스 점프, 파이프 장애물, 하이스코어",
    category: "game",
    files: {
      "index.html": { name: "index.html", language: "html", content: FLAPPY_HTML },
      "style.css": { name: "style.css", language: "css", content: FLAPPY_CSS },
      "script.js": { name: "script.js", language: "javascript", content: FLAPPY_JS },
    },
  },
  {
    keywords: ["벽돌깨기", "breakout", "brick", "아르카노이드", "블록깨기"],
    name: "Breakout", icon: "\u{1F9F1}", description: "벽돌깨기 \u2014 패들+공+벽돌 5줄, 생명 3개, 레벨 속도 증가",
    category: "game",
    files: {
      "index.html": { name: "index.html", language: "html", content: BREAKOUT_HTML },
      "style.css": { name: "style.css", language: "css", content: BREAKOUT_CSS },
      "script.js": { name: "script.js", language: "javascript", content: BREAKOUT_JS },
    },
  },
  {
    keywords: ["음악", "music", "player", "플레이어", "뮤직"],
    name: "Music Player", icon: "\u{1F3B5}", description: "뮤직 플레이어 \u2014 플레이리스트, 재생 컨트롤, 프로그레스 바",
    category: "app",
    files: {
      "index.html": { name: "index.html", language: "html", content: MUSIC_HTML },
      "style.css": { name: "style.css", language: "css", content: MUSIC_CSS },
      "script.js": { name: "script.js", language: "javascript", content: MUSIC_JS },
    },
  },
  {
    keywords: ["qr", "큐알", "코드생성", "qr코드", "barcode"],
    name: "QR Generator", icon: "\u{1F4F1}", description: "QR 생성기 \u2014 텍스트 입력, Canvas 매트릭스 렌더링, PNG 다운로드",
    category: "tool",
    files: {
      "index.html": { name: "index.html", language: "html", content: QR_HTML },
      "style.css": { name: "style.css", language: "css", content: QR_CSS },
      "script.js": { name: "script.js", language: "javascript", content: QR_JS },
    },
  },
];
