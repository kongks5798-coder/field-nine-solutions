import type { FilesMap } from "./workspace.constants";

export interface TemplateInfo8 {
  keywords: string[];
  name: string;
  icon: string;
  description: string;
  category: "game" | "app" | "tool" | "platform";
  files: FilesMap;
}

// ══════════════════════════════════════════════════════════════
// 1. 반려동물 케어 다이어리
// ══════════════════════════════════════════════════════════════
const PET_HTML = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>🐾 반려동물 다이어리</title><link rel="stylesheet" href="style.css"></head>
<body>
<header class="header">
  <div class="logo">🐾 펫 다이어리</div>
  <button class="btn-add-pet" id="addPetBtn">+ 반려동물 추가</button>
</header>
<div class="container">
  <div class="pet-tabs" id="petTabs"></div>
  <div class="pet-dashboard" id="petDashboard">
    <div class="empty-state" id="emptyState">
      <div class="empty-icon">🐶</div>
      <h2>아직 등록된 반려동물이 없어요</h2>
      <p>위 버튼으로 첫 번째 반려동물을 추가해보세요!</p>
    </div>
  </div>
</div>
<div class="modal-overlay" id="modalOverlay">
  <div class="modal">
    <div class="modal-header"><h3 id="modalTitle">반려동물 추가</h3><button class="modal-close" id="modalClose">×</button></div>
    <div class="modal-body" id="modalBody"></div>
  </div>
</div>
<script src="script.js"></script>
</body></html>`;

const PET_CSS = `*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#fef9f5;--surface:#fff;--border:#f0e6da;--accent:#f97316;--text:#2d1f0e;--muted:#9c7c5a;--green:#22c55e;--blue:#3b82f6;--red:#ef4444}
body{font-family:'Pretendard',sans-serif;background:var(--bg);color:var(--text);min-height:100vh}
.header{display:flex;align-items:center;justify-content:space-between;padding:16px 24px;background:var(--surface);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:10}
.logo{font-size:20px;font-weight:900;color:var(--accent)}
.btn-add-pet{padding:8px 18px;border-radius:20px;border:none;background:var(--accent);color:#fff;font-size:13px;font-weight:700;cursor:pointer}
.container{max-width:800px;margin:0 auto;padding:24px 16px}
.pet-tabs{display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap}
.pet-tab{padding:8px 16px;border-radius:20px;border:2px solid var(--border);background:var(--surface);cursor:pointer;font-size:13px;font-weight:600;transition:all 0.2s}
.pet-tab.active{border-color:var(--accent);background:rgba(249,115,22,0.08);color:var(--accent)}
.empty-state{text-align:center;padding:60px 20px}
.empty-icon{font-size:64px;margin-bottom:16px}
.empty-state h2{font-size:22px;margin-bottom:8px;color:var(--text)}
.empty-state p{color:var(--muted)}
.pet-profile{background:var(--surface);border-radius:20px;border:1px solid var(--border);padding:24px;margin-bottom:20px}
.pet-info{display:flex;align-items:center;gap:20px;margin-bottom:24px}
.pet-avatar{width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#f97316,#f43f5e);display:flex;align-items:center;justify-content:center;font-size:40px}
.pet-name{font-size:24px;font-weight:900}
.pet-breed{font-size:14px;color:var(--muted);margin-top:4px}
.pet-age{font-size:13px;color:var(--accent);margin-top:2px;font-weight:600}
.stats-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px}
.stat-card{background:var(--bg);border-radius:12px;padding:16px;text-align:center}
.stat-val{font-size:22px;font-weight:900;color:var(--accent)}
.stat-label{font-size:11px;color:var(--muted);margin-top:4px}
.section-title{font-size:15px;font-weight:800;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center}
.btn-sm{padding:5px 12px;border-radius:8px;border:1px solid var(--border);background:transparent;font-size:11px;cursor:pointer;font-weight:600}
.record-list{display:flex;flex-direction:column;gap:8px}
.record-item{background:var(--bg);border-radius:10px;padding:12px 16px;display:flex;align-items:center;gap:12px}
.record-icon{font-size:20px}
.record-text{flex:1}
.record-title{font-size:13px;font-weight:700}
.record-date{font-size:11px;color:var(--muted)}
.record-badge{padding:3px 8px;border-radius:10px;font-size:10px;font-weight:700}
.badge-green{background:rgba(34,197,94,0.15);color:var(--green)}
.badge-blue{background:rgba(59,130,246,0.15);color:var(--blue)}
.badge-orange{background:rgba(249,115,22,0.15);color:var(--accent)}
.modal-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:100;align-items:center;justify-content:center}
.modal-overlay.open{display:flex}
.modal{background:var(--surface);border-radius:20px;width:90%;max-width:400px;max-height:80vh;overflow:auto}
.modal-header{display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid var(--border)}
.modal-header h3{font-size:16px;font-weight:800}
.modal-close{background:none;border:none;font-size:20px;cursor:pointer;color:var(--muted)}
.modal-body{padding:20px 24px}
.form-group{margin-bottom:16px}
.form-group label{display:block;font-size:12px;font-weight:700;margin-bottom:6px;color:var(--muted)}
.form-group input,.form-group select,.form-group textarea{width:100%;padding:10px 12px;border-radius:10px;border:1px solid var(--border);font-size:14px;font-family:inherit;background:var(--bg);outline:none}
.form-group input:focus,.form-group select:focus{border-color:var(--accent)}
.btn-primary{width:100%;padding:12px;border-radius:12px;border:none;background:var(--accent);color:#fff;font-size:14px;font-weight:700;cursor:pointer;margin-top:8px}`;

const PET_JS = `const PETS_KEY = 'pet_diary_pets';
const RECORDS_KEY = 'pet_diary_records';

let pets = JSON.parse(localStorage.getItem(PETS_KEY) || '[]');
let records = JSON.parse(localStorage.getItem(RECORDS_KEY) || '[]');
let currentPetId = null;

function savePets() { localStorage.setItem(PETS_KEY, JSON.stringify(pets)); }
function saveRecords() { localStorage.setItem(RECORDS_KEY, JSON.stringify(records)); }

function calcAge(birth) {
  if (!birth) return '나이 미등록';
  const d = new Date(birth), now = new Date();
  const m = (now - d) / (1000*60*60*24*30.44);
  if (m < 12) return Math.round(m) + '개월';
  return Math.floor(m/12) + '살 ' + Math.round(m%12) + '개월';
}

function renderPetTabs() {
  const tabs = document.getElementById('petTabs');
  tabs.innerHTML = pets.map(p =>
    \`<button class="pet-tab \${p.id === currentPetId ? 'active' : ''}" onclick="selectPet('\${p.id}')">\${p.emoji || '🐶'} \${p.name}</button>\`
  ).join('');
}

function renderDashboard() {
  const dash = document.getElementById('petDashboard');
  const empty = document.getElementById('emptyState');
  if (!currentPetId || !pets.length) { dash.innerHTML = '<div class="empty-state" id="emptyState"><div class="empty-icon">🐶</div><h2>아직 등록된 반려동물이 없어요</h2><p>위 버튼으로 첫 번째 반려동물을 추가해보세요!</p></div>'; return; }
  const pet = pets.find(p => p.id === currentPetId);
  if (!pet) return;
  const petRecords = records.filter(r => r.petId === currentPetId).slice(-10).reverse();
  const vaccines = petRecords.filter(r => r.type === 'vaccine');
  const checkups = petRecords.filter(r => r.type === 'checkup');
  const weight = petRecords.filter(r => r.type === 'weight').slice(0,1)[0];

  dash.innerHTML = \`
    <div class="pet-profile">
      <div class="pet-info">
        <div class="pet-avatar">\${pet.emoji || '🐶'}</div>
        <div>
          <div class="pet-name">\${pet.name}</div>
          <div class="pet-breed">\${pet.breed || '품종 미등록'} · \${pet.gender || ''}</div>
          <div class="pet-age">🎂 \${calcAge(pet.birth)}</div>
        </div>
      </div>
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-val">\${weight ? weight.value + 'kg' : '—'}</div><div class="stat-label">체중</div></div>
        <div class="stat-card"><div class="stat-val">\${vaccines.length}회</div><div class="stat-label">접종 기록</div></div>
        <div class="stat-card"><div class="stat-val">\${checkups.length}회</div><div class="stat-label">건강 검진</div></div>
      </div>
      <div class="section-title">
        최근 기록
        <button class="btn-sm" onclick="openAddRecord()">+ 기록 추가</button>
      </div>
      <div class="record-list">
        \${petRecords.length === 0 ? '<div style="text-align:center;padding:20px;color:#9c7c5a">아직 기록이 없어요</div>' :
          petRecords.map(r => {
            const icons = {vaccine:'💉',checkup:'🏥',weight:'⚖️',walk:'🚶',feed:'🍖',memo:'📝'};
            const badges = {vaccine:'badge-green',checkup:'badge-blue',weight:'badge-orange',walk:'badge-green',feed:'badge-orange',memo:'badge-blue'};
            const labels = {vaccine:'예방접종',checkup:'건강검진',weight:'체중측정',walk:'산책',feed:'사료변경',memo:'메모'};
            return \`<div class="record-item">
              <div class="record-icon">\${icons[r.type]||'📝'}</div>
              <div class="record-text">
                <div class="record-title">\${r.memo || labels[r.type] || r.type}\${r.value ? ' · ' + r.value + (r.type==='weight'?'kg':'') : ''}</div>
                <div class="record-date">\${new Date(r.date).toLocaleDateString('ko-KR')}</div>
              </div>
              <span class="record-badge \${badges[r.type]||'badge-blue'}">\${labels[r.type]||r.type}</span>
            </div>\`;
          }).join('')}
      </div>
    </div>
  \`;
}

function selectPet(id) {
  currentPetId = id;
  renderPetTabs();
  renderDashboard();
}

function openAddPet() {
  document.getElementById('modalTitle').textContent = '반려동물 추가';
  document.getElementById('modalBody').innerHTML = \`
    <div class="form-group"><label>이름</label><input id="petName" placeholder="이름 입력..."></div>
    <div class="form-group"><label>품종</label><input id="petBreed" placeholder="예: 말티즈, 코리안숏헤어..."></div>
    <div class="form-group"><label>생년월일</label><input type="date" id="petBirth"></div>
    <div class="form-group"><label>성별</label><select id="petGender"><option value="">선택</option><option>수컷</option><option>암컷</option></select></div>
    <div class="form-group"><label>이모지</label><select id="petEmoji"><option value="🐶">🐶 강아지</option><option value="🐱">🐱 고양이</option><option value="🐰">🐰 토끼</option><option value="🐹">🐹 햄스터</option><option value="🐦">🐦 새</option><option value="🐠">🐠 물고기</option></select></div>
    <button class="btn-primary" onclick="savePet()">저장</button>
  \`;
  document.getElementById('modalOverlay').classList.add('open');
}

function savePet() {
  const name = document.getElementById('petName').value.trim();
  if (!name) { alert('이름을 입력해주세요'); return; }
  const pet = {
    id: Date.now().toString(),
    name,
    breed: document.getElementById('petBreed').value,
    birth: document.getElementById('petBirth').value,
    gender: document.getElementById('petGender').value,
    emoji: document.getElementById('petEmoji').value,
  };
  pets.push(pet);
  savePets();
  currentPetId = pet.id;
  closeModal();
  renderPetTabs();
  renderDashboard();
}

function openAddRecord() {
  document.getElementById('modalTitle').textContent = '기록 추가';
  document.getElementById('modalBody').innerHTML = \`
    <div class="form-group"><label>종류</label><select id="recType"><option value="vaccine">💉 예방접종</option><option value="checkup">🏥 건강검진</option><option value="weight">⚖️ 체중측정</option><option value="walk">🚶 산책</option><option value="feed">🍖 사료변경</option><option value="memo">📝 메모</option></select></div>
    <div class="form-group"><label>날짜</label><input type="date" id="recDate" value="\${new Date().toISOString().slice(0,10)}"></div>
    <div class="form-group"><label>값 (체중인 경우 kg)</label><input id="recValue" placeholder="예: 3.2"></div>
    <div class="form-group"><label>메모</label><input id="recMemo" placeholder="메모를 입력하세요..."></div>
    <button class="btn-primary" onclick="saveRecord()">저장</button>
  \`;
  document.getElementById('modalOverlay').classList.add('open');
}

function saveRecord() {
  const rec = {
    id: Date.now().toString(),
    petId: currentPetId,
    type: document.getElementById('recType').value,
    date: document.getElementById('recDate').value,
    value: document.getElementById('recValue').value,
    memo: document.getElementById('recMemo').value,
  };
  records.push(rec);
  saveRecords();
  closeModal();
  renderDashboard();
}

function closeModal() { document.getElementById('modalOverlay').classList.remove('open'); }

document.getElementById('addPetBtn').addEventListener('click', openAddPet);
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalOverlay').addEventListener('click', function(e) { if (e.target === this) closeModal(); });

// Init with demo pet
if (!pets.length) {
  pets = [{id:'demo1', name:'초코', breed:'말티즈', birth:'2021-03-15', gender:'수컷', emoji:'🐶'}];
  records = [
    {id:'r1',petId:'demo1',type:'weight',date:'2024-01-15',value:'3.2',memo:''},
    {id:'r2',petId:'demo1',type:'vaccine',date:'2024-02-20',value:'',memo:'광견병 예방접종'},
    {id:'r3',petId:'demo1',type:'checkup',date:'2024-03-10',value:'',memo:'연간 건강검진'},
  ];
  savePets(); saveRecords();
}
currentPetId = pets[0]?.id;
renderPetTabs();
renderDashboard();`;

// ══════════════════════════════════════════════════════════════
// 2. 약 복용 체커
// ══════════════════════════════════════════════════════════════
const MED_HTML = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>💊 약 복용 체커</title><link rel="stylesheet" href="style.css"></head>
<body>
<header class="header">
  <div>
    <div class="logo">💊 약 복용 체커</div>
    <div class="date-str" id="dateStr"></div>
  </div>
  <button class="btn-add" id="addBtn">+ 약 추가</button>
</header>
<div class="container">
  <div class="progress-bar-wrap">
    <div class="progress-label"><span id="progressText">오늘 복용 현황</span><span id="progressPct">0%</span></div>
    <div class="progress-track"><div class="progress-fill" id="progressFill"></div></div>
  </div>
  <div class="section-label">오늘 복용 약</div>
  <div class="med-list" id="medList"></div>
  <div class="section-label" style="margin-top:24px">복용 기록 (최근 7일)</div>
  <div class="history-grid" id="historyGrid"></div>
</div>
<div class="modal-overlay" id="overlay">
  <div class="modal">
    <div class="modal-hdr"><h3>약 추가</h3><button onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <div class="fg"><label>약 이름</label><input id="mName" placeholder="예: 타이레놀 500mg"></div>
      <div class="fg"><label>복용 시간</label>
        <div style="display:flex;gap:8px;flex-wrap:wrap" id="timeOptions">
          <label class="time-opt"><input type="checkbox" value="아침"> 아침</label>
          <label class="time-opt"><input type="checkbox" value="점심"> 점심</label>
          <label class="time-opt"><input type="checkbox" value="저녁"> 저녁</label>
          <label class="time-opt"><input type="checkbox" value="취침전"> 취침 전</label>
        </div>
      </div>
      <div class="fg"><label>색상</label>
        <div style="display:flex;gap:8px">
          <div class="color-opt selected" data-color="#f97316" style="background:#f97316"></div>
          <div class="color-opt" data-color="#3b82f6" style="background:#3b82f6"></div>
          <div class="color-opt" data-color="#22c55e" style="background:#22c55e"></div>
          <div class="color-opt" data-color="#8b5cf6" style="background:#8b5cf6"></div>
          <div class="color-opt" data-color="#ef4444" style="background:#ef4444"></div>
        </div>
      </div>
      <div class="fg"><label>메모</label><input id="mMemo" placeholder="주의사항, 용량 등..."></div>
      <button class="btn-save" onclick="saveMed()">저장</button>
    </div>
  </div>
</div>
<script src="script.js"></script>
</body></html>`;

const MED_CSS = `*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#f0fdf4;--surface:#fff;--border:#dcfce7;--accent:#22c55e;--text:#14532d;--muted:#6b7280}
body{font-family:'Pretendard',sans-serif;background:var(--bg);color:var(--text);min-height:100vh}
.header{display:flex;align-items:flex-start;justify-content:space-between;padding:20px 20px 16px;background:var(--surface);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:10}
.logo{font-size:20px;font-weight:900}
.date-str{font-size:12px;color:var(--muted);margin-top:4px}
.btn-add{padding:8px 16px;border-radius:20px;border:none;background:var(--accent);color:#fff;font-size:13px;font-weight:700;cursor:pointer}
.container{max-width:600px;margin:0 auto;padding:20px 16px}
.progress-bar-wrap{background:var(--surface);border-radius:16px;padding:16px 20px;margin-bottom:20px;border:1px solid var(--border)}
.progress-label{display:flex;justify-content:space-between;font-size:13px;font-weight:700;margin-bottom:10px}
.progress-track{height:10px;border-radius:5px;background:rgba(34,197,94,0.15)}
.progress-fill{height:100%;border-radius:5px;background:linear-gradient(90deg,#22c55e,#16a34a);transition:width 0.5s}
.section-label{font-size:12px;font-weight:800;color:var(--muted);letter-spacing:0.05em;margin-bottom:10px}
.med-list{display:flex;flex-direction:column;gap:10px}
.med-card{background:var(--surface);border-radius:14px;border:1px solid var(--border);overflow:hidden}
.med-card-top{display:flex;align-items:center;gap:14px;padding:16px}
.med-dot{width:14px;height:14px;border-radius:50%;flex-shrink:0}
.med-name{font-size:15px;font-weight:800;flex:1}
.med-memo{font-size:11px;color:var(--muted);margin-top:2px}
.med-times{display:flex;gap:6px;padding:10px 16px;border-top:1px solid var(--border);flex-wrap:wrap}
.time-pill{display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:20px;border:2px solid var(--border);font-size:12px;font-weight:700;cursor:pointer;transition:all 0.2s;background:var(--surface)}
.time-pill.done{border-color:var(--accent);background:rgba(34,197,94,0.1);color:var(--accent)}
.time-pill .check{font-size:14px}
.history-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
.hist-day{background:var(--surface);border-radius:10px;padding:8px 4px;text-align:center;border:1px solid var(--border)}
.hist-day-label{font-size:10px;color:var(--muted);margin-bottom:6px}
.hist-dots{display:flex;flex-direction:column;gap:3px;align-items:center}
.hist-dot{width:8px;height:8px;border-radius:50%}
.modal-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.4);z-index:100;align-items:center;justify-content:center}
.modal-overlay.open{display:flex}
.modal{background:var(--surface);border-radius:20px;width:90%;max-width:380px}
.modal-hdr{display:flex;justify-content:space-between;align-items:center;padding:20px 20px 0}
.modal-hdr h3{font-size:16px;font-weight:800}
.modal-hdr button{background:none;border:none;font-size:20px;cursor:pointer;color:var(--muted)}
.modal-body{padding:16px 20px 20px}
.fg{margin-bottom:14px}
.fg label{display:block;font-size:12px;font-weight:700;margin-bottom:6px;color:var(--muted)}
.fg input{width:100%;padding:10px 12px;border-radius:10px;border:1px solid var(--border);font-size:14px;font-family:inherit;outline:none}
.fg input:focus{border-color:var(--accent)}
.time-opt{display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:20px;border:1px solid var(--border);font-size:13px;cursor:pointer;font-weight:600}
.color-opt{width:28px;height:28px;border-radius:50%;cursor:pointer;transition:all 0.2s}
.color-opt.selected{outline:3px solid var(--text);outline-offset:2px}
.btn-save{width:100%;padding:12px;border-radius:12px;border:none;background:var(--accent);color:#fff;font-size:14px;font-weight:700;cursor:pointer;margin-top:8px}`;

const MED_JS = `const MEDS_KEY = 'med_checker_meds';
const LOG_KEY = 'med_checker_log';
let meds = JSON.parse(localStorage.getItem(MEDS_KEY)||'[]');
let log = JSON.parse(localStorage.getItem(LOG_KEY)||'{}');
const today = new Date().toISOString().slice(0,10);
let selectedColor = '#f97316';

function saveMeds(){localStorage.setItem(MEDS_KEY,JSON.stringify(meds));}
function saveLog(){localStorage.setItem(LOG_KEY,JSON.stringify(log));}
function todayKey(medId,time){return today+'_'+medId+'_'+time;}
function isDone(medId,time){return log[todayKey(medId,time)];}

function updateProgress(){
  let total=0,done=0;
  meds.forEach(m=>m.times.forEach(t=>{total++;if(isDone(m.id,t))done++;}));
  const pct = total?Math.round(done/total*100):0;
  const el = document.getElementById('progressFill');
  const pt = document.getElementById('progressText');
  const pp = document.getElementById('progressPct');
  if(el) el.style.width=pct+'%';
  if(pp) pp.textContent=pct+'%';
  if(pt) pt.textContent=pct===100?'🎉 오늘 복용 완료!':'오늘 복용 현황 ('+done+'/'+total+')';
}

function renderMeds(){
  const list = document.getElementById('medList');
  if(!list) return;
  if(!meds.length){list.innerHTML='<div style="text-align:center;padding:40px;color:#6b7280">아직 등록된 약이 없어요.<br>위 버튼으로 추가해보세요!</div>';return;}
  list.innerHTML = meds.map(m=>\`
    <div class="med-card">
      <div class="med-card-top">
        <div class="med-dot" style="background:\${m.color}"></div>
        <div style="flex:1">
          <div class="med-name">💊 \${m.name}</div>
          \${m.memo?'<div class="med-memo">'+m.memo+'</div>':''}
        </div>
        <button onclick="deleteMed('\${m.id}')" style="background:none;border:none;cursor:pointer;font-size:16px;color:#9ca3af">🗑</button>
      </div>
      <div class="med-times">
        \${m.times.map(t=>\`
          <div class="time-pill \${isDone(m.id,t)?'done':''}" onclick="toggleDose('\${m.id}','\${t}')">
            <span class="check">\${isDone(m.id,t)?'✓':'○'}</span> \${t}
          </div>
        \`).join('')}
      </div>
    </div>
  \`).join('');
  updateProgress();
}

function renderHistory(){
  const grid = document.getElementById('historyGrid');
  if(!grid) return;
  const days = Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);return d.toISOString().slice(0,10);});
  const dayNames = ['일','월','화','수','목','금','토'];
  grid.innerHTML = days.map(day=>{
    const d = new Date(day);
    const isToday = day===today;
    const dots = meds.map(m=>{
      const allDone = m.times.length && m.times.every(t=>log[day+'_'+m.id+'_'+t]);
      return '<div class="hist-dot" style="background:'+(allDone?m.color:'rgba(0,0,0,0.1)')+'"></div>';
    }).join('');
    return \`<div class="hist-day" style="\${isToday?'border-color:#22c55e;background:rgba(34,197,94,0.05)':''}">
      <div class="hist-day-label" style="\${isToday?'color:#22c55e;font-weight:800':''}">
        \${isToday?'오늘':dayNames[d.getDay()]}
        <br><span style="font-size:9px">\${d.getDate()}일</span>
      </div>
      <div class="hist-dots">\${dots||'<div style="height:8px"></div>'}</div>
    </div>\`;
  }).join('');
}

function toggleDose(medId,time){
  const k = todayKey(medId,time);
  if(log[k]) delete log[k]; else log[k]=Date.now();
  saveLog(); renderMeds(); renderHistory();
}

function deleteMed(id){
  if(!confirm('이 약을 삭제하시겠습니까?')) return;
  meds = meds.filter(m=>m.id!==id); saveMeds(); renderMeds(); renderHistory();
}

function openModal(){document.getElementById('overlay').classList.add('open');}
function closeModal(){document.getElementById('overlay').classList.remove('open');}

document.querySelectorAll('.color-opt').forEach(el=>{
  el.addEventListener('click',function(){
    document.querySelectorAll('.color-opt').forEach(e=>e.classList.remove('selected'));
    this.classList.add('selected');
    selectedColor = this.dataset.color;
  });
});

function saveMed(){
  const name = document.getElementById('mName').value.trim();
  if(!name){alert('약 이름을 입력해주세요');return;}
  const times = [...document.querySelectorAll('#timeOptions input:checked')].map(el=>el.value);
  if(!times.length){alert('복용 시간을 선택해주세요');return;}
  meds.push({id:Date.now().toString(),name,times,color:selectedColor,memo:document.getElementById('mMemo').value});
  saveMeds(); closeModal(); renderMeds(); renderHistory();
  document.getElementById('mName').value='';document.getElementById('mMemo').value='';
}

document.getElementById('addBtn').addEventListener('click',openModal);
document.getElementById('overlay').addEventListener('click',function(e){if(e.target===this)closeModal();});
document.getElementById('dateStr').textContent = new Date().toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric',weekday:'long'});

// Demo data
if(!meds.length){
  meds=[
    {id:'d1',name:'종합비타민',times:['아침'],color:'#f97316',memo:'식후 복용'},
    {id:'d2',name:'오메가3',times:['아침','저녁'],color:'#3b82f6',memo:''},
    {id:'d3',name:'마그네슘',times:['취침전'],color:'#8b5cf6',memo:'수면 전 복용'},
  ];
  log[today+'_d1_아침']=Date.now();
  saveMeds();saveLog();
}
renderMeds();renderHistory();`;

// ══════════════════════════════════════════════════════════════
// 3. 헬스 운동 기록
// ══════════════════════════════════════════════════════════════
const FITNESS_HTML = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>🏋️ 헬스 기록</title><link rel="stylesheet" href="style.css"></head>
<body>
<header class="header">
  <div class="logo">🏋️ 운동 기록</div>
  <div class="header-right">
    <button class="btn-start" id="startBtn">▶ 운동 시작</button>
  </div>
</header>
<div class="container">
  <div class="today-card" id="timerCard" style="display:none">
    <div class="timer-label">운동 시간</div>
    <div class="timer-display" id="timerDisplay">00:00:00</div>
    <button class="btn-end" id="endBtn">■ 종료</button>
  </div>
  <div class="stats-row">
    <div class="stat"><div class="stat-val" id="totalDays">0</div><div class="stat-label">운동일수</div></div>
    <div class="stat"><div class="stat-val" id="thisWeek">0</div><div class="stat-label">이번 주</div></div>
    <div class="stat"><div class="stat-val" id="streakDays">0</div><div class="stat-label">연속일수</div></div>
    <div class="stat"><div class="stat-val" id="totalMin">0</div><div class="stat-label">총 분</div></div>
  </div>
  <div class="section-title">이번 주 루틴</div>
  <div class="week-grid" id="weekGrid"></div>
  <div class="section-title" style="margin-top:24px;display:flex;justify-content:space-between;align-items:center">
    운동 기록 <button class="btn-add-log" id="addLogBtn">+ 기록 추가</button>
  </div>
  <div class="log-list" id="logList"></div>
</div>
<div class="modal-overlay" id="overlay">
  <div class="modal">
    <div class="modal-hdr"><h3>운동 기록 추가</h3><button onclick="closeModal()">×</button></div>
    <div class="modal-body">
      <div class="fg"><label>날짜</label><input type="date" id="logDate"></div>
      <div class="fg"><label>운동 종류</label><select id="logType">
        <option>가슴 (벤치프레스)</option><option>등 (데드리프트/풀업)</option>
        <option>하체 (스쿼트)</option><option>어깨 (오버헤드프레스)</option>
        <option>팔 (바이셉컬)</option><option>유산소 (러닝/사이클)</option><option>전신 (크로스핏)</option>
      </select></div>
      <div class="fg"><label>운동 시간 (분)</label><input type="number" id="logMin" placeholder="60" min="1" max="300"></div>
      <div class="fg"><label>메모</label><input id="logMemo" placeholder="세트, 무게, 느낀 점..."></div>
      <button class="btn-save" onclick="saveLog()">저장</button>
    </div>
  </div>
</div>
<script src="script.js"></script>
</body></html>`;

const FITNESS_CSS = `*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#0f172a;--surface:#1e293b;--border:#334155;--accent:#f97316;--text:#f1f5f9;--muted:#94a3b8;--green:#22d3ee}
body{font-family:'Pretendard',sans-serif;background:var(--bg);color:var(--text);min-height:100vh}
.header{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;background:rgba(30,41,59,0.9);backdrop-filter:blur(12px);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:10}
.logo{font-size:20px;font-weight:900}
.btn-start{padding:8px 18px;border-radius:20px;border:none;background:linear-gradient(135deg,#f97316,#f43f5e);color:#fff;font-size:13px;font-weight:700;cursor:pointer}
.container{max-width:600px;margin:0 auto;padding:20px 16px}
.today-card{background:linear-gradient(135deg,rgba(249,115,22,0.15),rgba(244,63,94,0.1));border:1px solid rgba(249,115,22,0.3);border-radius:20px;padding:24px;margin-bottom:20px;text-align:center}
.timer-label{font-size:13px;font-weight:700;color:var(--accent);margin-bottom:8px}
.timer-display{font-size:48px;font-weight:900;letter-spacing:0.05em;margin-bottom:16px;font-variant-numeric:tabular-nums}
.btn-end{padding:8px 24px;border-radius:20px;border:2px solid var(--accent);background:transparent;color:var(--accent);font-size:14px;font-weight:700;cursor:pointer}
.stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:24px}
.stat{background:var(--surface);border-radius:12px;padding:14px;text-align:center;border:1px solid var(--border)}
.stat-val{font-size:24px;font-weight:900;color:var(--accent)}
.stat-label{font-size:10px;color:var(--muted);margin-top:4px}
.section-title{font-size:13px;font-weight:800;color:var(--muted);letter-spacing:0.05em;margin-bottom:12px}
.week-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
.week-day{background:var(--surface);border-radius:10px;padding:8px 4px;text-align:center;border:1px solid var(--border)}
.week-day.worked{border-color:var(--accent);background:rgba(249,115,22,0.1)}
.week-day.today{border-color:var(--green)}
.week-label{font-size:10px;color:var(--muted)}
.week-check{font-size:16px;margin-top:4px}
.log-list{display:flex;flex-direction:column;gap:10px}
.log-item{background:var(--surface);border-radius:14px;padding:16px;border:1px solid var(--border);display:flex;align-items:center;gap:14px}
.log-icon{font-size:24px}
.log-info{flex:1}
.log-type{font-size:14px;font-weight:800}
.log-meta{font-size:11px;color:var(--muted);margin-top:4px}
.log-dur{font-size:20px;font-weight:900;color:var(--accent)}
.btn-add-log{padding:5px 12px;border-radius:8px;border:1px solid var(--border);background:transparent;color:var(--muted);font-size:11px;cursor:pointer;font-weight:600}
.modal-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:100;align-items:center;justify-content:center}
.modal-overlay.open{display:flex}
.modal{background:#1e293b;border-radius:20px;width:90%;max-width:380px;border:1px solid var(--border)}
.modal-hdr{display:flex;justify-content:space-between;align-items:center;padding:20px 20px 0}
.modal-hdr h3{font-size:16px;font-weight:800}
.modal-hdr button{background:none;border:none;font-size:20px;cursor:pointer;color:var(--muted)}
.modal-body{padding:16px 20px 20px}
.fg{margin-bottom:14px}
.fg label{display:block;font-size:12px;font-weight:700;margin-bottom:6px;color:var(--muted)}
.fg input,.fg select{width:100%;padding:10px 12px;border-radius:10px;border:1px solid var(--border);font-size:14px;font-family:inherit;background:rgba(255,255,255,0.04);color:var(--text);outline:none}
.fg input:focus,.fg select:focus{border-color:var(--accent)}
.btn-save{width:100%;padding:12px;border-radius:12px;border:none;background:linear-gradient(135deg,#f97316,#f43f5e);color:#fff;font-size:14px;font-weight:700;cursor:pointer;margin-top:8px}`;

const FITNESS_JS = `const LOG_KEY='fitness_logs';
let logs=JSON.parse(localStorage.getItem(LOG_KEY)||'[]');
let timerStart=null,timerInterval=null;
const today=new Date().toISOString().slice(0,10);
const ICONS={'가슴':'💪','등':'🦾','하체':'🦵','어깨':'🏋️','팔':'💪','유산소':'🏃','전신':'⚡'};
function saveLogs(){localStorage.setItem(LOG_KEY,JSON.stringify(logs));}
function fmtTime(s){const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60;return [h,m,sec].map(x=>String(x).padStart(2,'0')).join(':');}
function getStats(){
  const days=new Set(logs.map(l=>l.date));
  const weekAgo=new Date();weekAgo.setDate(weekAgo.getDate()-7);
  const thisWeek=logs.filter(l=>new Date(l.date)>=weekAgo).length;
  const sorted=[...days].sort();
  let streak=0;
  if(sorted.includes(today)){
    let d=new Date(today);
    while(sorted.includes(d.toISOString().slice(0,10))){streak++;d.setDate(d.getDate()-1);}
  }
  const totalMin=logs.reduce((s,l)=>s+(+l.minutes||0),0);
  return{total:days.size,thisWeek,streak,totalMin};
}
function renderStats(){
  const s=getStats();
  document.getElementById('totalDays').textContent=s.total;
  document.getElementById('thisWeek').textContent=s.thisWeek;
  document.getElementById('streakDays').textContent=s.streak;
  document.getElementById('totalMin').textContent=s.totalMin;
}
function renderWeek(){
  const grid=document.getElementById('weekGrid');
  const days=['일','월','화','수','목','금','토'];
  const cells=[];
  for(let i=6;i>=0;i--){
    const d=new Date();d.setDate(d.getDate()-i);
    const ds=d.toISOString().slice(0,10);
    const worked=logs.some(l=>l.date===ds);
    const isTd=ds===today;
    cells.push(\`<div class="week-day \${worked?'worked':''} \${isTd?'today':''}">
      <div class="week-label">\${days[d.getDay()]}</div>
      <div class="week-check">\${worked?'🔥':'—'}</div>
    </div>\`);
  }
  grid.innerHTML=cells.join('');
}
function renderLogs(){
  const list=document.getElementById('logList');
  const sorted=[...logs].sort((a,b)=>b.date.localeCompare(a.date));
  if(!sorted.length){list.innerHTML='<div style="text-align:center;padding:40px;color:#94a3b8">아직 운동 기록이 없어요.<br>오늘 첫 운동을 기록해보세요! 💪</div>';return;}
  list.innerHTML=sorted.slice(0,10).map(l=>{
    const cat=Object.keys(ICONS).find(k=>l.type.includes(k))||'전신';
    return \`<div class="log-item">
      <div class="log-icon">\${ICONS[cat]||'💪'}</div>
      <div class="log-info">
        <div class="log-type">\${l.type}</div>
        <div class="log-meta">\${new Date(l.date).toLocaleDateString('ko-KR')}\${l.memo?' · '+l.memo:''}</div>
      </div>
      <div class="log-dur">\${l.minutes||0}분</div>
    </div>\`;
  }).join('');
}
function startTimer(){
  timerStart=Date.now();
  document.getElementById('timerCard').style.display='block';
  document.getElementById('startBtn').disabled=true;
  timerInterval=setInterval(()=>{
    const s=Math.floor((Date.now()-timerStart)/1000);
    document.getElementById('timerDisplay').textContent=fmtTime(s);
  },1000);
}
function stopTimer(){
  clearInterval(timerInterval);
  const min=Math.round((Date.now()-timerStart)/60000);
  const type=prompt('어떤 운동을 했나요?','가슴 (벤치프레스)')||'운동';
  const memo=prompt('메모 (선택사항)','');
  if(type){
    logs.push({id:Date.now().toString(),date:today,type,minutes:min,memo:memo||''});
    saveLogs();
  }
  document.getElementById('timerCard').style.display='none';
  document.getElementById('startBtn').disabled=false;
  document.getElementById('timerDisplay').textContent='00:00:00';
  timerStart=null;
  renderStats();renderWeek();renderLogs();
}
function openModal(){
  document.getElementById('logDate').value=today;
  document.getElementById('overlay').classList.add('open');
}
function closeModal(){document.getElementById('overlay').classList.remove('open');}
function saveLog(){
  const type=document.getElementById('logType').value;
  const minutes=+document.getElementById('logMin').value||0;
  const date=document.getElementById('logDate').value||today;
  const memo=document.getElementById('logMemo').value;
  if(!minutes){alert('운동 시간을 입력해주세요');return;}
  logs.push({id:Date.now().toString(),date,type,minutes,memo});
  saveLogs();closeModal();renderStats();renderWeek();renderLogs();
  document.getElementById('logMin').value='';document.getElementById('logMemo').value='';
}
document.getElementById('startBtn').addEventListener('click',startTimer);
document.getElementById('endBtn').addEventListener('click',stopTimer);
document.getElementById('addLogBtn').addEventListener('click',openModal);
document.getElementById('overlay').addEventListener('click',function(e){if(e.target===this)closeModal();});

// Demo data
if(!logs.length){
  const addDay=(offset,type,min,memo)=>{const d=new Date();d.setDate(d.getDate()-offset);logs.push({id:Date.now().toString()+offset,date:d.toISOString().slice(0,10),type,minutes:min,memo});};
  addDay(0,'가슴 (벤치프레스)',75,'80kg 5×5');
  addDay(1,'유산소 (러닝/사이클)',45,'5km 러닝');
  addDay(2,'하체 (스쿼트)',80,'100kg 스쿼트');
  addDay(4,'등 (데드리프트/풀업)',70,'데드 120kg');
  addDay(5,'어깨 (오버헤드프레스)',60,'밀리터리프레스');
  saveLogs();
}
renderStats();renderWeek();renderLogs();`;

export const TEMPLATES8: TemplateInfo8[] = [
  {
    keywords: ["반려동물", "펫", "강아지", "고양이", "pet", "애완", "댕댕이", "냥이"],
    name: "🐾 반려동물 다이어리",
    icon: "🐾",
    description: "반려동물 건강 기록, 예방접종, 체중 관리, 산책 기록",
    category: "app",
    files: {
      "index.html": { name: "index.html", language: "html",       content: PET_HTML },
      "style.css":  { name: "style.css",  language: "css",        content: PET_CSS  },
      "script.js":  { name: "script.js",  language: "javascript", content: PET_JS   },
    },
  },
  {
    keywords: ["약", "복용", "알림", "약국", "처방", "medication", "약 먹기", "건강 기록"],
    name: "💊 약 복용 체커",
    icon: "💊",
    description: "약 복용 일정 관리, 복용 체크, 7일 기록 추적",
    category: "app",
    files: {
      "index.html": { name: "index.html", language: "html",       content: MED_HTML },
      "style.css":  { name: "style.css",  language: "css",        content: MED_CSS  },
      "script.js":  { name: "script.js",  language: "javascript", content: MED_JS   },
    },
  },
  {
    keywords: ["헬스", "운동", "헬스장", "gym", "fitness", "루틴", "운동 기록", "workout", "근육", "다이어트 운동"],
    name: "🏋️ 헬스 운동 기록",
    icon: "🏋️",
    description: "운동 타이머, 루틴 기록, 주간 현황, 연속 운동일 추적",
    category: "app",
    files: {
      "index.html": { name: "index.html", language: "html",       content: FITNESS_HTML },
      "style.css":  { name: "style.css",  language: "css",        content: FITNESS_CSS  },
      "script.js":  { name: "script.js",  language: "javascript", content: FITNESS_JS   },
    },
  },
];
