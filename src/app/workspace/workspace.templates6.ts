import type { FilesMap } from "./workspace.constants";

export interface TemplateInfo6 {
  keywords: string[];
  name: string;
  icon: string;
  description: string;
  category: "game" | "app" | "tool" | "platform";
  files: FilesMap;
}

// ══════════════════════════════════════════════════════════════
// 1. 음식 배달 앱 (배달의민족 스타일)
// ══════════════════════════════════════════════════════════════
const DELIVERY_HTML = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>🍕 딜리버리</title><link rel="stylesheet" href="style.css"></head>
<body>
<header class="header"><div class="logo">🛵 딜리버리</div><button class="cart-fab" id="cartFab">🛒 <span class="badge" id="badge">0</span></button></header>
<div class="search-bar"><input type="text" id="search" placeholder="음식점, 메뉴 검색..."><span class="search-icon">🔍</span></div>
<nav class="cat-scroll"><button class="cat active" data-cat="all">전체</button><button class="cat" data-cat="치킨">🍗 치킨</button><button class="cat" data-cat="피자">🍕 피자</button><button class="cat" data-cat="분식">🍜 분식</button><button class="cat" data-cat="중식">🥟 중식</button><button class="cat" data-cat="카페">☕ 카페</button></nav>
<main class="restaurant-list" id="restaurantList"></main>
<div class="cart-drawer" id="cartDrawer">
  <div class="drawer-header"><h3>🛒 장바구니</h3><button id="closeDrawer">✕</button></div>
  <div id="cartItems"></div>
  <div class="drawer-footer"><div class="total-row"><span>합계</span><strong id="total">₩0</strong></div><button class="order-btn" id="orderBtn">주문하기 (배달비 ₩3,000)</button></div>
</div>
<div class="dim" id="dim"></div>
<script src="script.js"></script></body></html>`;

const DELIVERY_CSS = `:root{--bg:#f7f8fa;--card:#fff;--accent:#fa3e3e;--text:#1a1a2e;--sub:#888;--border:#f0f0f0}
*{margin:0;padding:0;box-sizing:border-box}body{background:var(--bg);color:var(--text);font-family:'Pretendard',sans-serif;min-height:100vh;padding-bottom:80px}
.header{background:#fff;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border);position:sticky;top:0;z-index:100}
.logo{font-size:20px;font-weight:800;color:var(--accent)}.cart-fab{position:relative;background:var(--accent);color:#fff;border:none;padding:8px 16px;border-radius:20px;font-weight:700;cursor:pointer}
.badge{background:#fff;color:var(--accent);border-radius:50%;width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;margin-left:4px}
.search-bar{padding:12px 20px;background:#fff;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px}
.search-bar input{flex:1;border:1px solid var(--border);border-radius:10px;padding:10px 16px;font-size:15px;outline:none;font-family:inherit}
.cat-scroll{display:flex;gap:8px;padding:12px 20px;overflow-x:auto;background:#fff;border-bottom:1px solid var(--border)}
.cat{background:var(--bg);border:1px solid var(--border);border-radius:20px;padding:8px 16px;cursor:pointer;white-space:nowrap;font-size:14px;font-weight:600;transition:.2s}
.cat.active{background:var(--accent);color:#fff;border-color:var(--accent)}
.restaurant-list{padding:16px 20px;display:flex;flex-direction:column;gap:16px}
.r-card{background:var(--card);border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.06);cursor:pointer;transition:.2s}
.r-card:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.1)}.r-thumb{height:160px;display:flex;align-items:center;justify-content:center;font-size:64px;background:linear-gradient(135deg,#fff5f5,#ffe0e0)}
.r-info{padding:16px}.r-name{font-size:18px;font-weight:800;margin-bottom:4px}.r-meta{display:flex;gap:12px;font-size:13px;color:var(--sub);margin-bottom:8px}
.r-tags{display:flex;gap:6px;flex-wrap:wrap}.r-tag{background:var(--bg);border-radius:6px;padding:3px 8px;font-size:12px}
.cart-drawer{position:fixed;bottom:0;left:0;right:0;background:#fff;border-radius:24px 24px 0 0;padding:24px;z-index:200;transform:translateY(100%);transition:.3s;max-height:70vh;overflow-y:auto}
.cart-drawer.open{transform:translateY(0)}.drawer-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
.drawer-header h3{font-size:18px;font-weight:800}#closeDrawer{background:none;border:none;font-size:20px;cursor:pointer;color:var(--sub)}
.cart-item{display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--border)}
.ci-name{font-weight:600}.ci-ctrl{display:flex;align-items:center;gap:8px}.ci-ctrl button{background:var(--bg);border:1px solid var(--border);width:28px;height:28px;border-radius:8px;cursor:pointer;font-size:16px}
.ci-qty{font-weight:700;min-width:20px;text-align:center}.ci-price{color:var(--accent);font-weight:700}
.drawer-footer{margin-top:16px}.total-row{display:flex;justify-content:space-between;font-size:16px;margin-bottom:12px}
.order-btn{width:100%;background:var(--accent);color:#fff;border:none;padding:16px;border-radius:14px;font-size:16px;font-weight:700;cursor:pointer}
.dim{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:150;display:none}.dim.show{display:block}`;

const DELIVERY_JS = `"use strict";
var RESTAURANTS=[
  {id:1,name:'BBQ 치킨',emoji:'🍗',cat:'치킨',rating:4.8,time:'25~35분',minOrder:15000,tags:['황금올리브','순살','뼈치킨'],
   menu:[{n:'황금올리브 치킨',p:20000},{n:'순살 치킨',p:19000},{n:'반반 치킨',p:21000}]},
  {id:2,name:'도미노 피자',emoji:'🍕',cat:'피자',rating:4.5,time:'30~40분',minOrder:18000,tags:['페퍼로니','치즈','크러스트'],
   menu:[{n:'페퍼로니 피자 L',p:25000},{n:'슈퍼 치즈 피자',p:23000},{n:'불고기 피자',p:24000}]},
  {id:3,name:'엄마네 분식',emoji:'🍜',cat:'분식',rating:4.9,time:'20~30분',minOrder:10000,tags:['떡볶이','순대','튀김'],
   menu:[{n:'떡볶이',p:8000},{n:'순대 세트',p:10000},{n:'튀김 세트',p:9000}]},
  {id:4,name:'홍콩반점',emoji:'🥟',cat:'중식',rating:4.6,time:'30~40분',minOrder:13000,tags:['짜장면','짬뽕','탕수육'],
   menu:[{n:'짜장면',p:8000},{n:'짬뽕',p:9000},{n:'탕수육 소',p:16000}]},
  {id:5,name:'메가커피',emoji:'☕',cat:'카페',rating:4.7,time:'15~25분',minOrder:8000,tags:['아메리카노','라떼','케이크'],
   menu:[{n:'아메리카노 L',p:2500},{n:'카페라떼 L',p:3500},{n:'딸기케이크',p:6500}]},
];
var cart=[];
var currentCat='all';
var currentSearch='';
function getFiltered(){return RESTAURANTS.filter(function(r){var matchCat=currentCat==='all'||r.cat===currentCat;var matchSearch=!currentSearch||r.name.includes(currentSearch)||r.tags.some(function(t){return t.includes(currentSearch);});return matchCat&&matchSearch;});}
function renderList(){var list=document.getElementById('restaurantList');if(!list)return;var items=getFiltered();list.innerHTML=items.length===0?'<div style="text-align:center;padding:40px;color:#aaa">검색 결과가 없습니다</div>':items.map(function(r){return'<div class="r-card" onclick="showMenu('+r.id+')"><div class="r-thumb">'+r.emoji+'</div><div class="r-info"><div class="r-name">'+r.name+'</div><div class="r-meta"><span>⭐ '+r.rating+'</span><span>🕐 '+r.time+'</span><span>최소 ₩'+r.minOrder.toLocaleString()+'</span></div><div class="r-tags">'+r.tags.map(function(t){return'<span class="r-tag">'+t+'</span>';}).join('')+'</div></div></div>';}).join('');list.innerHTML=list.innerHTML;}
function showMenu(id){var r=RESTAURANTS.find(function(x){return x.id===id;});if(!r)return;var msg=r.name+' 메뉴:\n\n'+r.menu.map(function(m,i){return(i+1)+'. '+m.n+' — ₩'+m.p.toLocaleString();}).join('\n')+'\n\n메뉴 번호를 입력하세요:';var input=prompt(msg);if(!input)return;var idx=parseInt(input)-1;if(idx<0||idx>=r.menu.length)return;var item=r.menu[idx];var existing=cart.find(function(c){return c.n===item.n;});if(existing){existing.qty++;}else{cart.push({n:item.n,p:item.p,qty:1});}updateCart();}
function updateCart(){var total=cart.reduce(function(s,c){return s+c.p*c.qty;},0);var count=cart.reduce(function(s,c){return s+c.qty;},0);var b=document.getElementById('badge');if(b)b.textContent=count;var t=document.getElementById('total');if(t)t.textContent='₩'+total.toLocaleString();var ci=document.getElementById('cartItems');if(ci)ci.innerHTML=cart.length===0?'<p style="text-align:center;padding:20px;color:#aaa">장바구니가 비어있습니다</p>':cart.map(function(c,i){return'<div class="cart-item"><span class="ci-name">'+c.n+'</span><div class="ci-ctrl"><button onclick="changeQty('+i+',-1)">-</button><span class="ci-qty">'+c.qty+'</span><button onclick="changeQty('+i+',1)">+</button></div><span class="ci-price">₩'+(c.p*c.qty).toLocaleString()+'</span></div>';}).join('');}
function changeQty(i,d){if(!cart[i])return;cart[i].qty+=d;if(cart[i].qty<=0)cart.splice(i,1);updateCart();}
function openDrawer(){var dr=document.getElementById('cartDrawer');var dim=document.getElementById('dim');if(dr)dr.classList.add('open');if(dim)dim.classList.add('show');}
function closeDrawer(){var dr=document.getElementById('cartDrawer');var dim=document.getElementById('dim');if(dr)dr.classList.remove('open');if(dim)dim.classList.remove('show');}
document.addEventListener('DOMContentLoaded',function(){
  renderList();
  document.querySelectorAll('.cat').forEach(function(btn){btn.addEventListener('click',function(){document.querySelectorAll('.cat').forEach(function(b){b.classList.remove('active');});btn.classList.add('active');currentCat=btn.dataset.cat||'all';renderList();});});
  var s=document.getElementById('search');if(s)s.addEventListener('input',function(){currentSearch=s.value.trim();renderList();});
  var fab=document.getElementById('cartFab');if(fab)fab.addEventListener('click',openDrawer);
  var close=document.getElementById('closeDrawer');if(close)close.addEventListener('click',closeDrawer);
  var dim=document.getElementById('dim');if(dim)dim.addEventListener('click',closeDrawer);
  var ob=document.getElementById('orderBtn');if(ob)ob.addEventListener('click',function(){if(cart.length===0){alert('장바구니가 비어있습니다.');return;}alert('주문이 완료되었습니다! 🎉\n\n예상 배달 시간: 30~40분\n배달원이 곧 출발합니다.');cart=[];updateCart();closeDrawer();});
});`;

// ══════════════════════════════════════════════════════════════
// 2. 병원 예약 시스템
// ══════════════════════════════════════════════════════════════
const HOSPITAL_HTML = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>🏥 온라인 진료 예약</title><link rel="stylesheet" href="style.css"></head>
<body>
<header class="header"><div class="logo">🏥 우리동네 병원</div><div class="header-sub">내과 · 가정의학과 · 피부과</div></header>
<main class="main">
  <section class="step-card" id="step1">
    <h2>1단계 — 진료과 선택</h2>
    <div class="dept-grid" id="deptGrid"></div>
  </section>
  <section class="step-card hidden" id="step2">
    <h2>2단계 — 날짜 선택</h2>
    <div class="date-grid" id="dateGrid"></div>
  </section>
  <section class="step-card hidden" id="step3">
    <h2>3단계 — 시간 선택</h2>
    <div class="time-grid" id="timeGrid"></div>
  </section>
  <section class="step-card hidden" id="step4">
    <h2>4단계 — 정보 입력</h2>
    <form id="patientForm">
      <input type="text" id="pname" placeholder="이름" required>
      <input type="tel" id="pphone" placeholder="전화번호 (010-xxxx-xxxx)" required>
      <textarea id="psymptom" placeholder="증상을 간략히 입력해주세요" rows="3"></textarea>
      <button type="submit" class="btn-primary">예약 완료</button>
    </form>
  </section>
  <div class="confirm-card hidden" id="confirmCard"></div>
</main>
<script src="script.js"></script></body></html>`;

const HOSPITAL_CSS = `:root{--bg:#f0f7ff;--card:#fff;--accent:#2563eb;--text:#1e293b;--sub:#64748b;--border:#e2e8f0;--green:#16a34a}
*{margin:0;padding:0;box-sizing:border-box}body{background:var(--bg);color:var(--text);font-family:'Pretendard',sans-serif;min-height:100vh}
.header{background:var(--accent);color:#fff;padding:20px 24px;text-align:center}.logo{font-size:22px;font-weight:800}.header-sub{font-size:13px;opacity:.8;margin-top:4px}
.main{max-width:600px;margin:0 auto;padding:24px 16px;display:flex;flex-direction:column;gap:16px}
.step-card{background:var(--card);border-radius:20px;padding:24px;box-shadow:0 4px 16px rgba(37,99,235,.08)}
.step-card h2{font-size:18px;font-weight:700;margin-bottom:20px;color:var(--accent)}
.dept-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
.dept-btn{background:var(--bg);border:2px solid var(--border);border-radius:14px;padding:20px;text-align:center;cursor:pointer;transition:.2s}
.dept-btn:hover,.dept-btn.active{border-color:var(--accent);background:#eff6ff}.dept-emoji{font-size:32px;margin-bottom:8px}.dept-name{font-weight:700;font-size:15px}.dept-desc{font-size:12px;color:var(--sub);margin-top:4px}
.date-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.date-btn{background:var(--bg);border:2px solid var(--border);border-radius:12px;padding:12px 4px;text-align:center;cursor:pointer;transition:.2s}
.date-btn:hover,.date-btn.active{border-color:var(--accent);background:#eff6ff}.date-day{font-size:11px;color:var(--sub)}.date-num{font-size:20px;font-weight:700;margin:4px 0}.date-avail{font-size:11px;color:var(--green)}
.time-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
.time-btn{background:var(--bg);border:2px solid var(--border);border-radius:10px;padding:10px 4px;text-align:center;cursor:pointer;font-size:14px;font-weight:600;transition:.2s}
.time-btn:hover,.time-btn.active{border-color:var(--accent);background:#eff6ff}.time-btn.disabled{opacity:.4;cursor:not-allowed;text-decoration:line-through}
form{display:flex;flex-direction:column;gap:12px}
form input,form textarea{border:2px solid var(--border);border-radius:12px;padding:14px 16px;font-size:15px;font-family:inherit;outline:none;transition:.2s}
form input:focus,form textarea:focus{border-color:var(--accent)}
.btn-primary{background:var(--accent);color:#fff;border:none;border-radius:14px;padding:16px;font-size:16px;font-weight:700;cursor:pointer}
.confirm-card{background:#f0fdf4;border:2px solid var(--green);border-radius:20px;padding:32px;text-align:center}
.confirm-icon{font-size:64px;margin-bottom:16px}.confirm-title{font-size:22px;font-weight:800;color:var(--green);margin-bottom:8px}
.confirm-info{font-size:15px;color:var(--text);line-height:2;background:#fff;border-radius:12px;padding:16px;margin-top:16px;text-align:left}
.hidden{display:none!important}`;

const HOSPITAL_JS = `"use strict";
var DEPTS=[{emoji:'🫁',name:'내과',desc:'감기·소화기·만성질환'},{emoji:'🦷',name:'치과',desc:'충치·스케일링·임플란트'},{emoji:'🧴',name:'피부과',desc:'여드름·습진·레이저'},{emoji:'🧠',name:'신경과',desc:'두통·어지럼·수면장애'}];
var DAYS=['일','월','화','수','목','금','토'];
var TIMES=['09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','15:30','16:00','16:30'];
var sel={dept:null,date:null,time:null};
function showStep(n){['step1','step2','step3','step4'].forEach(function(id,i){var el=document.getElementById(id);if(el)el.classList.toggle('hidden',i+1!==n);});document.getElementById('confirmCard')?.classList.add('hidden');}
function renderDepts(){var g=document.getElementById('deptGrid');if(!g)return;g.innerHTML=DEPTS.map(function(d,i){return'<div class="dept-btn'+(sel.dept===i?' active':'') +'" onclick="selectDept('+i+')"><div class="dept-emoji">'+d.emoji+'</div><div class="dept-name">'+d.name+'</div><div class="dept-desc">'+d.desc+'</div></div>';}).join('');}
function selectDept(i){sel.dept=i;renderDepts();setTimeout(function(){showStep(2);renderDates();},200);}
function renderDates(){var g=document.getElementById('dateGrid');if(!g)return;var today=new Date();g.innerHTML=Array.from({length:8},function(_,i){var d=new Date(today);d.setDate(today.getDate()+i);var isWeekend=d.getDay()===0||d.getDay()===6;var avail=isWeekend?'휴진':'예약가능';var dateStr=d.toDateString();return'<div class="date-btn'+(sel.date===dateStr?' active':'')+(isWeekend?' disabled':'')+'" onclick="'+(isWeekend?'':'"selectDate(\''+dateStr+'\')"')+'"><div class="date-day">'+DAYS[d.getDay()]+'</div><div class="date-num">'+d.getDate()+'</div><div class="date-avail" style="color:'+(isWeekend?'#ef4444':'#16a34a')+'">'+avail+'</div></div>';}).join('');}
function selectDate(d){sel.date=d;renderDates();setTimeout(function(){showStep(3);renderTimes();},200);}
function renderTimes(){var g=document.getElementById('timeGrid');if(!g)return;var busy=[TIMES[1],TIMES[4],TIMES[7]];g.innerHTML=TIMES.map(function(t){var isBusy=busy.includes(t);return'<div class="time-btn'+(sel.time===t?' active':'')+(isBusy?' disabled':'')+'" onclick="'+(isBusy?'':'"selectTime(\''+t+'\')"')+'">'+t+(isBusy?'<br><small>예약완료</small>':'')+'</div>';}).join('');}
function selectTime(t){sel.time=t;renderTimes();setTimeout(function(){showStep(4);},200);}
document.addEventListener('DOMContentLoaded',function(){
  renderDepts();showStep(1);
  var form=document.getElementById('patientForm');
  if(form)form.addEventListener('submit',function(e){
    e.preventDefault();
    var name=document.getElementById('pname')?.value||'';var phone=document.getElementById('pphone')?.value||'';
    if(!name||!phone){alert('이름과 전화번호를 입력해주세요.');return;}
    var dept=DEPTS[sel.dept||0];var dateObj=new Date(sel.date||'');
    var cc=document.getElementById('confirmCard');
    if(cc){cc.classList.remove('hidden');cc.innerHTML='<div class="confirm-icon">✅</div><div class="confirm-title">예약 완료!</div><div class="confirm-info">👤 환자명: '+name+'<br>📋 진료과: '+dept.emoji+' '+dept.name+'<br>📅 날짜: '+(dateObj.getMonth()+1)+'월 '+dateObj.getDate()+'일 ('+DAYS[dateObj.getDay()]+')<br>🕐 시간: '+sel.time+'<br>📞 연락처: '+phone+'</div><p style="margin-top:16px;font-size:13px;color:#64748b">예약 확인 문자가 발송됩니다.</p>';}
    ['step1','step2','step3','step4'].forEach(function(id){var el=document.getElementById(id);if(el)el.classList.add('hidden');});
  });
});`;

// ══════════════════════════════════════════════════════════════
// 3. 온라인 강의 플랫폼 (클래스101 스타일)
// ══════════════════════════════════════════════════════════════
const LECTURE_HTML = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>📚 런어블</title><link rel="stylesheet" href="style.css"></head>
<body>
<header class="header"><div class="logo">📚 런어블</div><nav class="nav"><button class="nav-btn active">전체</button><button class="nav-btn">개발</button><button class="nav-btn">디자인</button><button class="nav-btn">비즈니스</button></nav><button class="login-btn">로그인</button></header>
<section class="hero"><h1>당신의 성장을<br>시작하세요</h1><p>현직 전문가가 알려주는 실무 강의</p><button class="hero-btn">강의 둘러보기</button></section>
<section class="section"><h2 class="section-title">🔥 인기 강의</h2><div class="course-grid" id="courseGrid"></div></section>
<div class="modal-overlay hidden" id="modal"><div class="modal"><button class="modal-close" id="modalClose">✕</button><div id="modalContent"></div></div></div>
<script src="script.js"></script></body></html>`;

const LECTURE_CSS = `:root{--bg:#f8f9fa;--card:#fff;--accent:#6c5ce7;--text:#2d3436;--sub:#636e72;--border:#e9ecef}
*{margin:0;padding:0;box-sizing:border-box}body{background:var(--bg);color:var(--text);font-family:'Pretendard',sans-serif}
.header{background:#fff;border-bottom:1px solid var(--border);padding:0 40px;display:flex;align-items:center;gap:24px;height:64px;position:sticky;top:0;z-index:100}
.logo{font-size:20px;font-weight:800;color:var(--accent);margin-right:auto}
.nav{display:flex;gap:4px}.nav-btn{background:none;border:none;padding:8px 16px;border-radius:20px;cursor:pointer;font-size:14px;font-weight:600;color:var(--sub);transition:.2s}
.nav-btn.active,.nav-btn:hover{background:#f0eeff;color:var(--accent)}.login-btn{background:var(--accent);color:#fff;border:none;padding:8px 20px;border-radius:20px;font-weight:700;cursor:pointer}
.hero{background:linear-gradient(135deg,#6c5ce7,#a29bfe);color:#fff;padding:80px 40px;text-align:center}
.hero h1{font-size:42px;font-weight:900;line-height:1.2;margin-bottom:16px}.hero p{font-size:18px;opacity:.9;margin-bottom:32px}
.hero-btn{background:#fff;color:var(--accent);border:none;padding:16px 40px;border-radius:50px;font-size:16px;font-weight:800;cursor:pointer}
.section{padding:48px 40px}.section-title{font-size:24px;font-weight:800;margin-bottom:24px}
.course-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:24px}
.c-card{background:var(--card);border-radius:20px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.06);cursor:pointer;transition:.25s}
.c-card:hover{transform:translateY(-4px);box-shadow:0 12px 32px rgba(108,92,231,.15)}
.c-thumb{height:160px;display:flex;align-items:center;justify-content:center;font-size:64px}
.c-body{padding:20px}.c-cat{font-size:12px;color:var(--accent);font-weight:700;margin-bottom:6px}
.c-title{font-size:16px;font-weight:800;margin-bottom:8px;line-height:1.4}.c-instructor{font-size:13px;color:var(--sub);margin-bottom:12px}
.c-meta{display:flex;align-items:center;justify-content:space-between}.c-rating{font-size:13px;color:#f39c12}
.c-price{font-size:18px;font-weight:800;color:var(--accent)}.c-badge{background:#fff3cd;color:#856404;font-size:11px;padding:3px 8px;border-radius:6px;font-weight:700}
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:200;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)}
.modal{background:#fff;border-radius:24px;width:600px;max-width:90vw;max-height:85vh;overflow-y:auto;padding:32px;position:relative}
.modal-close{position:absolute;top:16px;right:16px;background:var(--bg);border:none;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:16px}
.m-thumb{height:200px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:80px;background:var(--bg);margin-bottom:20px}
.m-cat{color:var(--accent);font-weight:700;font-size:13px;margin-bottom:8px}.m-title{font-size:24px;font-weight:900;margin-bottom:8px}
.m-desc{color:var(--sub);line-height:1.7;margin-bottom:20px}.m-stats{display:flex;gap:16px;margin-bottom:24px;font-size:14px}
.enroll-btn{width:100%;background:var(--accent);color:#fff;border:none;padding:16px;border-radius:14px;font-size:16px;font-weight:700;cursor:pointer}
.hidden{display:none!important}`;

const LECTURE_JS = `"use strict";
var COURSES=[
  {id:1,cat:'개발',emoji:'💻',thumb:'#e8f4fd',title:'파이썬으로 시작하는 데이터 분석',instructor:'김데이터 · 카카오 데이터사이언티스트',rating:'⭐ 4.9 (2,341)',price:'₩89,000',badge:'베스트셀러',desc:'판다스, 넘파이, 시각화까지 실무에서 바로 쓰는 데이터 분석 완전 정복. 실제 카카오 데이터로 실습합니다.',students:'수강생 12,341명',duration:'총 48강 · 24시간'},
  {id:2,cat:'디자인',emoji:'🎨',thumb:'#fef3e2',title:'피그마 마스터 클래스 — UI/UX 실전',instructor:'이디자인 · 네이버 UX 디자이너',rating:'⭐ 4.8 (1,876)',price:'₩79,000',badge:'신규',desc:'피그마 기초부터 프로토타입, 디자인 시스템까지. 포트폴리오 3개를 완성하는 실전 강의.',students:'수강생 8,210명',duration:'총 36강 · 18시간'},
  {id:3,cat:'개발',emoji:'⚛️',thumb:'#f0fff4',title:'React + Next.js 실무 프로젝트',instructor:'박풀스택 · 토스 프론트엔드',rating:'⭐ 4.9 (3,210)',price:'₩99,000',badge:'인기',desc:'리액트 훅, 상태관리, Next.js App Router까지. 실제 서비스 수준의 웹앱을 함께 만들어봅니다.',students:'수강생 18,500명',duration:'총 60강 · 30시간'},
  {id:4,cat:'비즈니스',emoji:'📊',thumb:'#fdf0ff',title:'스타트업 마케팅 그로스 해킹',instructor:'최마케터 · 당근마켓 Growth',rating:'⭐ 4.7 (987)',price:'₩69,000',badge:'',desc:'퍼포먼스 마케팅, SEO, CRM 자동화까지. 적은 예산으로 큰 성과를 내는 그로스 전략.',students:'수강생 4,320명',duration:'총 24강 · 12시간'},
  {id:5,cat:'디자인',emoji:'🖼️',thumb:'#fff0f3',title:'브랜드 아이덴티티 디자인',instructor:'한브랜드 · 삼성 디자인센터',rating:'⭐ 4.8 (654)',price:'₩109,000',badge:'프리미엄',desc:'로고, 컬러시스템, 타이포그래피, 가이드라인까지. 브랜드를 처음부터 끝까지 설계하는 법.',students:'수강생 2,890명',duration:'총 32강 · 16시간'},
  {id:6,cat:'개발',emoji:'🤖',thumb:'#f0f4ff',title:'ChatGPT API로 AI 서비스 개발',instructor:'조AI · 네이버 AI Lab',rating:'⭐ 4.9 (2,100)',price:'₩129,000',badge:'최신',desc:'OpenAI API, 랭체인, 임베딩까지. 실제 AI 서비스를 처음부터 배포까지 완성합니다.',students:'수강생 9,840명',duration:'총 40강 · 20시간'},
];
function renderCourses(){var g=document.getElementById('courseGrid');if(!g)return;g.innerHTML=COURSES.map(function(c){return'<div class="c-card" onclick="openModal('+c.id+')"><div class="c-thumb" style="background:'+c.thumb+'">'+c.emoji+'</div><div class="c-body"><div class="c-cat">'+c.cat+'</div><div class="c-title">'+c.title+'</div><div class="c-instructor">'+c.instructor+'</div><div class="c-meta"><span class="c-rating">'+c.rating+'</span>'+(c.badge?'<span class="c-badge">'+c.badge+'</span>':'')+'</div><div class="c-meta" style="margin-top:8px"><span></span><span class="c-price">'+c.price+'</span></div></div></div>';}).join('');}
function openModal(id){var c=COURSES.find(function(x){return x.id===id;});if(!c)return;var mc=document.getElementById('modalContent');if(mc)mc.innerHTML='<div class="m-thumb" style="background:'+c.thumb+'">'+c.emoji+'</div><div class="m-cat">'+c.cat+'</div><div class="m-title">'+c.title+'</div><div style="color:#636e72;font-size:13px;margin-bottom:12px">👨‍🏫 '+c.instructor+'</div><div class="m-stats"><span>'+c.rating+'</span><span>👥 '+c.students+'</span><span>📹 '+c.duration+'</span></div><div class="m-desc">'+c.desc+'</div><button class="enroll-btn" onclick="alert(\'수강 신청이 완료되었습니다! 🎉\')">'+c.price+' · 수강 신청하기</button>';var mo=document.getElementById('modal');if(mo)mo.classList.remove('hidden');}
document.addEventListener('DOMContentLoaded',function(){
  renderCourses();
  document.getElementById('modalClose')?.addEventListener('click',function(){document.getElementById('modal')?.classList.add('hidden');});
  document.getElementById('modal')?.addEventListener('click',function(e){if(e.target===document.getElementById('modal'))document.getElementById('modal')?.classList.add('hidden');});
  document.querySelectorAll('.nav-btn').forEach(function(btn){btn.addEventListener('click',function(){document.querySelectorAll('.nav-btn').forEach(function(b){b.classList.remove('active');});btn.classList.add('active');});});
});`;

// ══════════════════════════════════════════════════════════════
// 4. 세금 계산기 (사업자용)
// ══════════════════════════════════════════════════════════════
const TAX_HTML = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>🧾 세금 계산기</title><link rel="stylesheet" href="style.css"></head>
<body>
<div class="app">
  <header class="header"><h1>🧾 사업자 세금 계산기</h1><p>부가세 · 소득세 · 4대보험 한 번에</p></header>
  <div class="tab-bar"><button class="tab active" data-tab="vat">부가가치세</button><button class="tab" data-tab="income">종합소득세</button><button class="tab" data-tab="insurance">4대보험</button></div>
  <div class="content" id="vatTab">
    <div class="card"><h3>부가가치세 계산</h3>
      <div class="form-group"><label>과세 유형</label><select id="vatType"><option value="include">공급가액 포함 (역산)</option><option value="exclude">공급가액 기준 (정산)</option></select></div>
      <div class="form-group"><label>금액 입력 (원)</label><input type="number" id="vatAmount" placeholder="10000000"></div>
      <button class="calc-btn" id="vatCalc">계산하기</button>
      <div class="result-box hidden" id="vatResult"></div>
    </div>
  </div>
  <div class="content hidden" id="incomeTab">
    <div class="card"><h3>종합소득세 계산 (간이)</h3>
      <div class="form-group"><label>연간 사업소득 (원)</label><input type="number" id="incomeAmount" placeholder="50000000"></div>
      <div class="form-group"><label>인적공제 (명)</label><select id="deductCount"><option value="1">1명 (본인)</option><option value="2">2명</option><option value="3">3명</option><option value="4">4명 이상</option></select></div>
      <button class="calc-btn" id="incomeCalc">계산하기</button>
      <div class="result-box hidden" id="incomeResult"></div>
    </div>
  </div>
  <div class="content hidden" id="insuranceTab">
    <div class="card"><h3>4대보험 계산</h3>
      <div class="form-group"><label>월 급여 (원)</label><input type="number" id="salaryAmount" placeholder="3000000"></div>
      <button class="calc-btn" id="insuranceCalc">계산하기</button>
      <div class="result-box hidden" id="insuranceResult"></div>
    </div>
  </div>
</div>
<script src="script.js"></script></body></html>`;

const TAX_CSS = `:root{--bg:#f0f2f5;--card:#fff;--accent:#1d4ed8;--text:#1e293b;--sub:#64748b;--border:#e2e8f0;--green:#059669;--red:#dc2626}
*{margin:0;padding:0;box-sizing:border-box}body{background:var(--bg);color:var(--text);font-family:'Pretendard',sans-serif;min-height:100vh}
.app{max-width:600px;margin:0 auto;padding:0 0 60px}
.header{background:linear-gradient(135deg,var(--accent),#2563eb);color:#fff;padding:32px 24px;text-align:center}
.header h1{font-size:24px;font-weight:800;margin-bottom:8px}.header p{opacity:.8;font-size:14px}
.tab-bar{display:flex;background:#fff;border-bottom:2px solid var(--border)}.tab{flex:1;padding:16px;border:none;background:none;font-size:14px;font-weight:600;color:var(--sub);cursor:pointer;border-bottom:3px solid transparent;margin-bottom:-2px;transition:.2s}
.tab.active{color:var(--accent);border-bottom-color:var(--accent)}.content{padding:24px}
.card{background:var(--card);border-radius:20px;padding:24px;box-shadow:0 4px 16px rgba(0,0,0,.06)}
.card h3{font-size:18px;font-weight:700;margin-bottom:20px;color:var(--accent)}.form-group{margin-bottom:16px}
.form-group label{display:block;font-size:13px;font-weight:600;color:var(--sub);margin-bottom:6px}
.form-group input,.form-group select{width:100%;border:2px solid var(--border);border-radius:12px;padding:12px 16px;font-size:16px;font-family:inherit;outline:none;transition:.2s}
.form-group input:focus,.form-group select:focus{border-color:var(--accent)}.calc-btn{width:100%;background:var(--accent);color:#fff;border:none;border-radius:14px;padding:16px;font-size:16px;font-weight:700;cursor:pointer;margin-top:8px}
.result-box{background:linear-gradient(135deg,#eff6ff,#dbeafe);border-radius:16px;padding:20px;margin-top:20px;border:1px solid #bfdbfe}
.result-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(37,99,235,.1);font-size:15px}
.result-row:last-child{border-bottom:none;font-weight:800;font-size:16px;color:var(--accent);padding-top:12px;margin-top:4px}
.result-label{color:var(--sub)}.result-value{font-weight:600}
.hidden{display:none!important}`;

const TAX_JS = `"use strict";
function fmt(n){return Math.round(n).toLocaleString()+'원';}
document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('.tab').forEach(function(tab){tab.addEventListener('click',function(){document.querySelectorAll('.tab').forEach(function(t){t.classList.remove('active');});document.querySelectorAll('.content').forEach(function(c){c.classList.add('hidden');});tab.classList.add('active');var target=document.getElementById(tab.dataset.tab+'Tab');if(target)target.classList.remove('hidden');});});
  var vatCalc=document.getElementById('vatCalc');
  if(vatCalc)vatCalc.addEventListener('click',function(){
    var amt=parseFloat(document.getElementById('vatAmount')?.value||'0');var type=document.getElementById('vatType')?.value;if(!amt){alert('금액을 입력해주세요.');return;}
    var supply,vat,total;
    if(type==='include'){total=amt;supply=Math.round(total/1.1);vat=total-supply;}else{supply=amt;vat=Math.round(supply*0.1);total=supply+vat;}
    var r=document.getElementById('vatResult');if(!r)return;
    r.classList.remove('hidden');r.innerHTML='<div class="result-row"><span class="result-label">공급가액</span><span class="result-value">'+fmt(supply)+'</span></div><div class="result-row"><span class="result-label">부가세 (10%)</span><span class="result-value">'+fmt(vat)+'</span></div><div class="result-row"><span class="result-label">합계 금액</span><span class="result-value">'+fmt(total)+'</span></div>';
  });
  var incomeCalc=document.getElementById('incomeCalc');
  if(incomeCalc)incomeCalc.addEventListener('click',function(){
    var income=parseFloat(document.getElementById('incomeAmount')?.value||'0');var deduct=parseInt(document.getElementById('deductCount')?.value||'1');if(!income){alert('소득을 입력해주세요.');return;}
    var STANDARD_DEDUCT=1500000;var PERSONAL_DEDUCT=1500000*deduct;var totalDeduct=STANDARD_DEDUCT+PERSONAL_DEDUCT;var taxable=Math.max(0,income-totalDeduct);
    var tax=0;
    if(taxable<=14000000)tax=taxable*0.06;
    else if(taxable<=50000000)tax=840000+(taxable-14000000)*0.15;
    else if(taxable<=88000000)tax=6240000+(taxable-50000000)*0.24;
    else if(taxable<=150000000)tax=15360000+(taxable-88000000)*0.35;
    else tax=37060000+(taxable-150000000)*0.38;
    var localTax=tax*0.1;var r=document.getElementById('incomeResult');if(!r)return;
    r.classList.remove('hidden');r.innerHTML='<div class="result-row"><span class="result-label">총소득</span><span class="result-value">'+fmt(income)+'</span></div><div class="result-row"><span class="result-label">공제 합계</span><span class="result-value">'+fmt(totalDeduct)+'</span></div><div class="result-row"><span class="result-label">과세표준</span><span class="result-value">'+fmt(taxable)+'</span></div><div class="result-row"><span class="result-label">종합소득세</span><span class="result-value">'+fmt(tax)+'</span></div><div class="result-row"><span class="result-label">지방소득세 (10%)</span><span class="result-value">'+fmt(localTax)+'</span></div><div class="result-row"><span class="result-label">납부세액 합계</span><span class="result-value">'+fmt(tax+localTax)+'</span></div>';
  });
  var insCalc=document.getElementById('insuranceCalc');
  if(insCalc)insCalc.addEventListener('click',function(){
    var salary=parseFloat(document.getElementById('salaryAmount')?.value||'0');if(!salary){alert('급여를 입력해주세요.');return;}
    var national=Math.round(salary*0.045);var health=Math.round(salary*0.03545);var care=Math.round(health*0.1295);var employ=Math.round(salary*0.009);var total=national+health+care+employ;
    var r=document.getElementById('insuranceResult');if(!r)return;
    r.classList.remove('hidden');r.innerHTML='<div class="result-row"><span class="result-label">월 급여</span><span class="result-value">'+fmt(salary)+'</span></div><div class="result-row"><span class="result-label">국민연금 (4.5%)</span><span class="result-value">'+fmt(national)+'</span></div><div class="result-row"><span class="result-label">건강보험 (3.545%)</span><span class="result-value">'+fmt(health)+'</span></div><div class="result-row"><span class="result-label">장기요양 (건보×12.95%)</span><span class="result-value">'+fmt(care)+'</span></div><div class="result-row"><span class="result-label">고용보험 (0.9%)</span><span class="result-value">'+fmt(employ)+'</span></div><div class="result-row"><span class="result-label">근로자 부담 합계</span><span class="result-value">'+fmt(total)+'</span></div>';
  });
});`;

// ══════════════════════════════════════════════════════════════
// EXPORT
// ══════════════════════════════════════════════════════════════
export const TEMPLATES6: TemplateInfo6[] = [
  {
    keywords: ["배달","음식","치킨","피자","분식","딜리버리","배달앱","배달의민족","쿠팡이츠","요기요"],
    name: "음식 배달 앱",
    icon: "🛵",
    description: "배달의민족 스타일 음식 배달 앱 — 음식점 목록, 장바구니, 주문",
    category: "platform",
    files: {
      "index.html": { name: "index.html", language: "html", content: DELIVERY_HTML },
      "style.css":  { name: "style.css",  language: "css",  content: DELIVERY_CSS  },
      "script.js":  { name: "script.js",  language: "javascript", content: DELIVERY_JS },
    },
  },
  {
    keywords: ["병원","예약","진료","의원","클리닉","건강","치과","피부과","내과","병원예약","진료예약"],
    name: "병원 예약 시스템",
    icon: "🏥",
    description: "4단계 진료 예약 — 진료과 선택 → 날짜 → 시간 → 정보 입력",
    category: "app",
    files: {
      "index.html": { name: "index.html", language: "html", content: HOSPITAL_HTML },
      "style.css":  { name: "style.css",  language: "css",  content: HOSPITAL_CSS  },
      "script.js":  { name: "script.js",  language: "javascript", content: HOSPITAL_JS },
    },
  },
  {
    keywords: ["강의","온라인강의","클래스101","유데미","학원","교육","수강","강사","코딩강의","디자인강의"],
    name: "온라인 강의 플랫폼",
    icon: "📚",
    description: "클래스101 스타일 강의 플랫폼 — 카테고리, 강의 목록, 수강 신청",
    category: "platform",
    files: {
      "index.html": { name: "index.html", language: "html", content: LECTURE_HTML },
      "style.css":  { name: "style.css",  language: "css",  content: LECTURE_CSS  },
      "script.js":  { name: "script.js",  language: "javascript", content: LECTURE_JS },
    },
  },
  {
    keywords: ["세금","부가세","소득세","4대보험","세금계산기","사업자","납세","vat","세무","회계"],
    name: "사업자 세금 계산기",
    icon: "🧾",
    description: "부가가치세 · 종합소득세 · 4대보험 계산기 — 사업자 필수 도구",
    category: "tool",
    files: {
      "index.html": { name: "index.html", language: "html", content: TAX_HTML },
      "style.css":  { name: "style.css",  language: "css",  content: TAX_CSS  },
      "script.js":  { name: "script.js",  language: "javascript", content: TAX_JS },
    },
  },
];
