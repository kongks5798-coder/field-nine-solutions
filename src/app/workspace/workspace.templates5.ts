import type { FilesMap } from "./workspace.constants";

export interface TemplateInfo5 {
  keywords: string[];
  name: string;
  icon: string;
  description: string;
  category: "game" | "app" | "tool" | "platform";
  files: FilesMap;
}

// ══════════════════════════════════════════════════════════════
// 1. 카페 메뉴판
// ══════════════════════════════════════════════════════════════
const CAFE_HTML = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>☕ 카페 메뉴판</title><link rel="stylesheet" href="style.css"></head>
<body>
<header class="header"><div class="logo">☕ Brew & Co.</div><button class="cart-btn" id="cartBtn">🛒 <span id="cartCount">0</span></button></header>
<nav class="cat-nav"><button class="cat active" data-cat="all">전체</button><button class="cat" data-cat="coffee">커피</button><button class="cat" data-cat="non">논커피</button><button class="cat" data-cat="food">푸드</button></nav>
<main class="menu-grid" id="menuGrid"></main>
<div class="cart-panel hidden" id="cartPanel">
  <div class="cart-header"><h2>🛒 주문서</h2><button id="closeCart">✕</button></div>
  <div id="cartItems"></div>
  <div class="cart-footer"><div class="total">합계: <strong id="totalPrice">₩0</strong></div><button class="order-btn" id="orderBtn">주문하기</button></div>
</div>
<div class="overlay hidden" id="overlay"></div>
<script src="script.js"></script></body></html>`;

const CAFE_CSS = `:root{--bg:#0d0d12;--card:#1a1a24;--accent:#c9a84c;--text:#f0ede8;--sub:#8b8694}
*{margin:0;padding:0;box-sizing:border-box}body{background:var(--bg);color:var(--text);font-family:'Pretendard',sans-serif;min-height:100vh}
.header{display:flex;justify-content:space-between;align-items:center;padding:16px 24px;background:rgba(20,18,28,.95);backdrop-filter:blur(12px);position:sticky;top:0;z-index:100;border-bottom:1px solid rgba(201,168,76,.2)}
.logo{font-size:20px;font-weight:800;color:var(--accent)}.cart-btn{background:var(--accent);color:#000;border:none;padding:8px 16px;border-radius:20px;cursor:pointer;font-weight:700;font-size:14px}
.cat-nav{display:flex;gap:8px;padding:16px 24px;overflow-x:auto}.cat{background:var(--card);color:var(--sub);border:1px solid rgba(255,255,255,.08);padding:8px 20px;border-radius:20px;cursor:pointer;white-space:nowrap;transition:.2s}
.cat.active{background:var(--accent);color:#000;border-color:var(--accent)}.menu-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:16px;padding:16px 24px}
.menu-card{background:var(--card);border-radius:16px;overflow:hidden;cursor:pointer;transition:.25s;border:1px solid rgba(255,255,255,.06)}
.menu-card:hover{transform:translateY(-4px);border-color:var(--accent)}.menu-img{height:120px;display:flex;align-items:center;justify-content:center;font-size:48px}
.menu-info{padding:12px}.menu-name{font-weight:700;font-size:15px;margin-bottom:4px}.menu-desc{font-size:12px;color:var(--sub);margin-bottom:8px}
.menu-price{color:var(--accent);font-weight:700}.add-btn{float:right;background:var(--accent);color:#000;border:none;width:28px;height:28px;border-radius:50%;cursor:pointer;font-size:18px;line-height:28px;text-align:center}
.cart-panel{position:fixed;bottom:0;right:0;width:360px;max-width:100%;background:var(--card);border-radius:20px 20px 0 0;border:1px solid rgba(201,168,76,.3);z-index:200;padding:24px;transform:translateY(100%);transition:.3s}
.cart-panel.open{transform:translateY(0)}.cart-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
.cart-header h2{font-size:18px}#closeCart{background:none;border:none;color:var(--sub);font-size:20px;cursor:pointer}
.cart-item{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.06)}
.item-name{font-weight:600;font-size:14px}.item-ctrl{display:flex;align-items:center;gap:8px}
.item-ctrl button{background:rgba(255,255,255,.1);border:none;color:var(--text);width:24px;height:24px;border-radius:6px;cursor:pointer}
.item-price{color:var(--accent);font-size:13px}.cart-footer{margin-top:16px;display:flex;justify-content:space-between;align-items:center}
.total{font-size:16px}.order-btn{background:var(--accent);color:#000;border:none;padding:12px 24px;border-radius:12px;font-weight:700;cursor:pointer}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:150}.hidden{display:none!important}`;

const CAFE_JS = `"use strict";
var MENU=[
  {id:1,name:'아메리카노',desc:'진한 에스프레소 블렌드',price:4500,emoji:'☕',cat:'coffee'},
  {id:2,name:'카페라떼',desc:'부드러운 우유 거품',price:5000,emoji:'🥛',cat:'coffee'},
  {id:3,name:'카푸치노',desc:'풍성한 폼 아트',price:5500,emoji:'☕',cat:'coffee'},
  {id:4,name:'바닐라라떼',desc:'달콤한 바닐라 향',price:5500,emoji:'✨',cat:'coffee'},
  {id:5,name:'딸기 에이드',desc:'신선한 딸기 착즙',price:6000,emoji:'🍓',cat:'non'},
  {id:6,name:'말차라떼',desc:'일본산 말차 블렌드',price:6000,emoji:'🍵',cat:'non'},
  {id:7,name:'자몽 허니',desc:'자몽+꿀 조합',price:5800,emoji:'🍊',cat:'non'},
  {id:8,name:'크루아상',desc:'버터 듬뿍 프랑스식',price:4000,emoji:'🥐',cat:'food'},
  {id:9,name:'치즈케이크',desc:'뉴욕 스타일 진한 맛',price:7000,emoji:'🍰',cat:'food'},
  {id:10,name:'초코머핀',desc:'초콜릿 칩 가득',price:3500,emoji:'🧁',cat:'food'}
];
var cart=[];
var activeCat='all';
function getCount(){return cart.reduce(function(a,i){return a+i.qty;},0);}
function getTotal(){return cart.reduce(function(a,i){return a+i.price*i.qty;},0);}
function render(){
  var grid=document.getElementById('menuGrid');
  if(!grid)return;
  var filtered=activeCat==='all'?MENU:MENU.filter(function(m){return m.cat===activeCat;});
  grid.innerHTML=filtered.map(function(m){
    return '<div class="menu-card"><div class="menu-img">'+m.emoji+'</div><div class="menu-info"><div class="menu-name">'+m.name+'</div><div class="menu-desc">'+m.desc+'</div><div class="menu-price">₩'+m.price.toLocaleString()+'<button class="add-btn" data-id="'+m.id+'">+</button></div></div></div>';
  }).join('');
  grid.querySelectorAll('.add-btn').forEach(function(btn){
    btn.addEventListener('click',function(e){e.stopPropagation();addToCart(Number(btn.dataset.id));});
  });
}
function addToCart(id){
  var item=MENU.find(function(m){return m.id===id;});
  if(!item)return;
  var ex=cart.find(function(c){return c.id===id;});
  if(ex){ex.qty++;}else{cart.push({id:item.id,name:item.name,price:item.price,emoji:item.emoji,qty:1});}
  updateCartUI();
}
function updateCartUI(){
  var countEl=document.getElementById('cartCount');
  if(countEl)countEl.textContent=String(getCount());
  var totalEl=document.getElementById('totalPrice');
  if(totalEl)totalEl.textContent='₩'+getTotal().toLocaleString();
  var itemsEl=document.getElementById('cartItems');
  if(itemsEl){
    itemsEl.innerHTML=cart.length===0?'<p style="color:#8b8694;text-align:center;padding:20px">담긴 항목이 없습니다</p>':cart.map(function(c){
      return '<div class="cart-item"><span class="item-name">'+c.emoji+' '+c.name+'</span><div class="item-ctrl"><button data-dec="'+c.id+'">-</button><span>'+c.qty+'</span><button data-inc="'+c.id+'">+</button></div><span class="item-price">₩'+(c.price*c.qty).toLocaleString()+'</span></div>';
    }).join('');
    itemsEl.querySelectorAll('[data-inc]').forEach(function(b){b.addEventListener('click',function(){addToCart(Number(b.dataset.inc));});});
    itemsEl.querySelectorAll('[data-dec]').forEach(function(b){
      b.addEventListener('click',function(){
        var ex=cart.find(function(c){return c.id===Number(b.dataset.dec);});
        if(ex){ex.qty--;if(ex.qty<=0)cart=cart.filter(function(c){return c.id!==Number(b.dataset.dec);});}
        updateCartUI();
      });
    });
  }
}
function openCart(){
  var p=document.getElementById('cartPanel');var o=document.getElementById('overlay');
  if(p)p.classList.add('open');if(p)p.classList.remove('hidden');if(o)o.classList.remove('hidden');
}
function closeCart(){
  var p=document.getElementById('cartPanel');var o=document.getElementById('overlay');
  if(p)p.classList.remove('open');if(o)o.classList.add('hidden');
}
document.addEventListener('DOMContentLoaded',function(){
  render();
  var cartBtn=document.getElementById('cartBtn');if(cartBtn)cartBtn.addEventListener('click',openCart);
  var closeBtn=document.getElementById('closeCart');if(closeBtn)closeBtn.addEventListener('click',closeCart);
  var overlay=document.getElementById('overlay');if(overlay)overlay.addEventListener('click',closeCart);
  var orderBtn=document.getElementById('orderBtn');
  if(orderBtn)orderBtn.addEventListener('click',function(){
    if(cart.length===0){alert('메뉴를 선택해주세요!');return;}
    alert('✅ 주문 완료! 총 ₩'+getTotal().toLocaleString()+'\n잠시 후 준비됩니다 ☕');
    cart=[];updateCartUI();closeCart();
  });
  document.querySelectorAll('.cat').forEach(function(btn){
    btn.addEventListener('click',function(){
      document.querySelectorAll('.cat').forEach(function(b){b.classList.remove('active');});
      btn.classList.add('active');activeCat=btn.dataset.cat||'all';render();
    });
  });
});`;

// ══════════════════════════════════════════════════════════════
// 2. 가계부
// ══════════════════════════════════════════════════════════════
const BUDGET_HTML = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>💰 가계부</title><link rel="stylesheet" href="style.css"></head>
<body>
<div class="app"><header class="hdr"><h1>💰 가계부</h1><span id="monthLabel"></span></header>
<div class="summary"><div class="sum-card income"><div class="sum-label">수입</div><div class="sum-val" id="totalIncome">₩0</div></div>
<div class="sum-card expense"><div class="sum-label">지출</div><div class="sum-val" id="totalExpense">₩0</div></div>
<div class="sum-card balance"><div class="sum-label">잔액</div><div class="sum-val" id="balance">₩0</div></div></div>
<div class="add-form"><select id="typeSelect"><option value="income">수입</option><option value="expense">지출</option></select>
<input type="text" id="descInput" placeholder="항목 (예: 월급, 카페)">
<input type="number" id="amtInput" placeholder="금액" min="0">
<button id="addBtn">추가</button></div>
<div id="txList"></div></div>
<script src="script.js"></script></body></html>`;

const BUDGET_CSS = `:root{--bg:#0d1117;--card:#161b22;--green:#3fb950;--red:#f85149;--blue:#58a6ff;--text:#e6edf3;--sub:#8b949e}
*{margin:0;padding:0;box-sizing:border-box}body{background:var(--bg);color:var(--text);font-family:system-ui,sans-serif;min-height:100vh}
.app{max-width:480px;margin:0 auto;padding:20px}
.hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
.hdr h1{font-size:22px;font-weight:700}.hdr span{color:var(--sub);font-size:14px}
.summary{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:20px}
.sum-card{background:var(--card);border-radius:12px;padding:14px;text-align:center;border:1px solid rgba(255,255,255,.06)}
.sum-label{font-size:12px;color:var(--sub);margin-bottom:6px}
.sum-val{font-size:18px;font-weight:700}.income .sum-val{color:var(--green)}.expense .sum-val{color:var(--red)}.balance .sum-val{color:var(--blue)}
.add-form{display:grid;grid-template-columns:auto 1fr auto auto;gap:8px;margin-bottom:20px;background:var(--card);padding:14px;border-radius:12px;border:1px solid rgba(255,255,255,.06)}
.add-form select,.add-form input{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:var(--text);padding:8px 10px;border-radius:8px;font-size:14px}
.add-form input[type="text"]{min-width:0}.add-form input[type="number"]{width:100px}
.add-form button{background:var(--blue);color:#000;border:none;padding:8px 16px;border-radius:8px;font-weight:700;cursor:pointer;white-space:nowrap}
.tx-item{display:flex;justify-content:space-between;align-items:center;background:var(--card);border-radius:10px;padding:12px 14px;margin-bottom:8px;border:1px solid rgba(255,255,255,.04)}
.tx-left .tx-desc{font-weight:600;font-size:14px}.tx-left .tx-date{font-size:12px;color:var(--sub)}
.tx-right{display:flex;align-items:center;gap:10px}.tx-amt{font-weight:700;font-size:15px}
.tx-del{background:none;border:none;color:var(--sub);cursor:pointer;font-size:16px;opacity:.5;transition:.2s}.tx-del:hover{opacity:1;color:var(--red)}
.empty{text-align:center;color:var(--sub);padding:40px;font-size:14px}`;

const BUDGET_JS = `"use strict";
var KEY='dalkak_budget';
var txs=JSON.parse(localStorage.getItem(KEY)||'[]');
function save(){localStorage.setItem(KEY,JSON.stringify(txs));}
function fmt(n){return '₩'+n.toLocaleString();}
function render(){
  var income=txs.filter(function(t){return t.type==='income';}).reduce(function(a,t){return a+t.amt;},0);
  var expense=txs.filter(function(t){return t.type==='expense';}).reduce(function(a,t){return a+t.amt;},0);
  var inc=document.getElementById('totalIncome');var exp=document.getElementById('totalExpense');var bal=document.getElementById('balance');
  if(inc)inc.textContent=fmt(income);if(exp)exp.textContent=fmt(expense);if(bal)bal.textContent=fmt(income-expense);
  var list=document.getElementById('txList');
  if(!list)return;
  if(txs.length===0){list.innerHTML='<div class="empty">거래 내역이 없습니다<br>수입/지출을 추가해보세요!</div>';return;}
  list.innerHTML=txs.slice().reverse().map(function(t,ri){
    var i=txs.length-1-ri;
    return '<div class="tx-item"><div class="tx-left"><div class="tx-desc">'+t.desc+'</div><div class="tx-date">'+t.date+'</div></div>'
      +'<div class="tx-right"><span class="tx-amt" style="color:'+(t.type==='income'?'#3fb950':'#f85149')+'">'+
      (t.type==='income'?'+':'-')+fmt(t.amt)+'</span><button class="tx-del" data-idx="'+i+'">🗑</button></div></div>';
  }).join('');
  list.querySelectorAll('.tx-del').forEach(function(btn){
    btn.addEventListener('click',function(){txs.splice(Number(btn.dataset.idx),1);save();render();});
  });
}
document.addEventListener('DOMContentLoaded',function(){
  var now=new Date();var ml=document.getElementById('monthLabel');
  if(ml)ml.textContent=now.getFullYear()+'년 '+(now.getMonth()+1)+'월';
  render();
  var addBtn=document.getElementById('addBtn');
  if(addBtn)addBtn.addEventListener('click',function(){
    var type=document.getElementById('typeSelect')?.value||'expense';
    var desc=document.getElementById('descInput')?.value.trim()||'';
    var amt=Number(document.getElementById('amtInput')?.value)||0;
    if(!desc||amt<=0){alert('항목과 금액을 입력해주세요');return;}
    var d=new Date();
    txs.push({type:type,desc:desc,amt:amt,date:d.getMonth()+1+'/'+d.getDate()});
    save();render();
    var di=document.getElementById('descInput');var ai=document.getElementById('amtInput');
    if(di)di.value='';if(ai)ai.value='';
  });
});`;

// ══════════════════════════════════════════════════════════════
// 3. 영단어 플래시카드
// ══════════════════════════════════════════════════════════════
const FLASH_HTML = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>📚 영단어 암기</title><link rel="stylesheet" href="style.css"></head>
<body>
<div class="app">
  <header><h1>📚 영단어 암기</h1><div id="progress">1 / 20</div></header>
  <div class="stats"><div class="stat"><span id="knownCnt">0</span>알아요</div><div class="stat"><span id="unknownCnt">0</span>모르겠어요</div></div>
  <div class="card-wrap" id="cardWrap">
    <div class="card" id="card">
      <div class="card-front" id="cardFront"></div>
      <div class="card-back hidden" id="cardBack"></div>
    </div>
  </div>
  <button class="show-btn" id="showBtn">뜻 보기</button>
  <div class="answer-btns hidden" id="answerBtns">
    <button class="btn-no" id="noBtn">❌ 모르겠어요</button>
    <button class="btn-yes" id="yesBtn">✅ 알아요</button>
  </div>
</div>
<script src="script.js"></script></body></html>`;

const FLASH_CSS = `:root{--bg:#0f1419;--card:#1e2732;--accent:#1d9bf0;--green:#00ba7c;--red:#f4212e;--text:#e7e9ea;--sub:#71767b}
*{margin:0;padding:0;box-sizing:border-box}body{background:var(--bg);color:var(--text);font-family:system-ui,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center}
.app{width:360px;padding:24px}header{display:flex;justify-content:space-between;margin-bottom:16px}
h1{font-size:18px;font-weight:800}#progress{color:var(--sub);font-size:14px;align-self:center}
.stats{display:flex;gap:12px;margin-bottom:20px}.stat{flex:1;background:var(--card);border-radius:10px;padding:10px;text-align:center;font-size:13px;color:var(--sub)}
.stat span{display:block;font-size:22px;font-weight:700;color:var(--text);margin-bottom:2px}
.card-wrap{perspective:1000px;margin-bottom:20px}
.card{background:var(--card);border-radius:20px;padding:40px 24px;text-align:center;min-height:180px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.06);cursor:pointer;transition:transform .1s}
.card:hover{transform:scale(1.01)}
.card-front{font-size:32px;font-weight:800;letter-spacing:-1px}
.card-back{font-size:20px;color:var(--sub);line-height:1.6}
.show-btn{width:100%;background:var(--accent);color:#fff;border:none;padding:14px;border-radius:14px;font-size:16px;font-weight:700;cursor:pointer;margin-bottom:12px;transition:.2s}
.show-btn:hover{opacity:.88}
.answer-btns{display:flex;gap:12px}
.btn-no,.btn-yes{flex:1;padding:14px;border:none;border-radius:14px;font-size:15px;font-weight:700;cursor:pointer;transition:.2s}
.btn-no{background:rgba(244,33,46,.15);color:var(--red)}.btn-yes{background:rgba(0,186,124,.15);color:var(--green)}
.btn-no:hover{background:rgba(244,33,46,.3)}.btn-yes:hover{background:rgba(0,186,124,.3)}
.hidden{display:none!important}.done-msg{text-align:center;padding:20px;font-size:16px;line-height:1.8}`;

const FLASH_JS = `"use strict";
var WORDS=[
  {en:'ambiguous',ko:'모호한, 애매한'},{en:'benevolent',ko:'자비로운, 친절한'},{en:'cogent',ko:'설득력 있는'},
  {en:'diligent',ko:'부지런한, 근면한'},{en:'eloquent',ko:'웅변적인, 유창한'},{en:'fastidious',ko:'까다로운, 꼼꼼한'},
  {en:'gregarious',ko:'사교적인, 무리 짓는'},{en:'haughty',ko:'거만한, 오만한'},{en:'intricate',ko:'복잡한, 뒤얽힌'},
  {en:'jovial',ko:'쾌활한, 즐거운'},{en:'kindle',ko:'불붙이다, 자극하다'},{en:'lucid',ko:'명쾌한, 투명한'},
  {en:'meticulous',ko:'꼼꼼한, 세심한'},{en:'nostalgia',ko:'향수, 그리움'},{en:'ominous',ko:'불길한, 흉조의'},
  {en:'persevere',ko:'인내하다, 견디다'},{en:'quandary',ko:'진퇴양난, 딜레마'},{en:'resilient',ko:'회복력 있는, 탄력적인'},
  {en:'serene',ko:'고요한, 평온한'},{en:'tenacious',ko:'끈질긴, 완강한'}
];
var idx=0;var known=0;var unknown=0;var flipped=false;
var shuffled=WORDS.slice().sort(function(){return Math.random()-.5;});
function showCard(){
  var front=document.getElementById('cardFront');var back=document.getElementById('cardBack');
  var prog=document.getElementById('progress');var showBtn=document.getElementById('showBtn');
  var answerBtns=document.getElementById('answerBtns');
  if(idx>=shuffled.length){
    var card=document.getElementById('card');
    if(card)card.innerHTML='<div class="done-msg">🎉 완료!<br>알아요: <strong style="color:#00ba7c">'+known+'개</strong><br>모르겠어요: <strong style="color:#f4212e">'+unknown+'개</strong><br><button onclick="location.reload()" style="margin-top:16px;background:#1d9bf0;color:#fff;border:none;padding:10px 24px;border-radius:10px;cursor:pointer;font-size:15px">다시하기</button></div>';
    if(showBtn)showBtn.style.display='none';if(answerBtns)answerBtns.classList.add('hidden');return;
  }
  var w=shuffled[idx];
  if(front)front.textContent=w.en;if(back)back.textContent=w.ko;
  if(back)back.classList.add('hidden');if(front)front.classList.remove('hidden');
  if(prog)prog.textContent=(idx+1)+' / '+shuffled.length;
  if(showBtn)showBtn.classList.remove('hidden');if(answerBtns)answerBtns.classList.add('hidden');
  flipped=false;
}
document.addEventListener('DOMContentLoaded',function(){
  showCard();
  var showBtn=document.getElementById('showBtn');
  if(showBtn)showBtn.addEventListener('click',function(){
    var front=document.getElementById('cardFront');var back=document.getElementById('cardBack');
    var answerBtns=document.getElementById('answerBtns');
    if(front)front.classList.add('hidden');if(back)back.classList.remove('hidden');
    showBtn.classList.add('hidden');if(answerBtns)answerBtns.classList.remove('hidden');
    flipped=true;
  });
  var yesBtn=document.getElementById('yesBtn');
  if(yesBtn)yesBtn.addEventListener('click',function(){known++;var kc=document.getElementById('knownCnt');if(kc)kc.textContent=String(known);idx++;showCard();});
  var noBtn=document.getElementById('noBtn');
  if(noBtn)noBtn.addEventListener('click',function(){unknown++;var uc=document.getElementById('unknownCnt');if(uc)uc.textContent=String(unknown);idx++;showCard();});
});`;

// ══════════════════════════════════════════════════════════════
// 4. 운동 기록
// ══════════════════════════════════════════════════════════════
const WORKOUT_HTML = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>💪 운동 기록</title><link rel="stylesheet" href="style.css"></head>
<body>
<div class="app"><header><h1>💪 운동 기록</h1><div id="streakBadge">🔥 0일 연속</div></header>
<div class="week-strip" id="weekStrip"></div>
<div class="add-form">
  <select id="exSelect"><option>스쿼트</option><option>데드리프트</option><option>벤치프레스</option><option>풀업</option><option>런지</option><option>플랭크</option><option>달리기</option><option>사이클</option></select>
  <input type="number" id="setsInput" placeholder="세트" min="1" max="20">
  <input type="number" id="repsInput" placeholder="회 / 분" min="1">
  <input type="number" id="weightInput" placeholder="kg (선택)" min="0">
  <button id="addBtn">기록</button>
</div>
<div id="logList"></div></div>
<script src="script.js"></script></body></html>`;

const WORKOUT_CSS = `:root{--bg:#0a0a0f;--card:#131318;--accent:#7c3aed;--text:#f4f4f8;--sub:#6b7280;--green:#10b981}
*{margin:0;padding:0;box-sizing:border-box}body{background:var(--bg);color:var(--text);font-family:system-ui,sans-serif;min-height:100vh}
.app{max-width:480px;margin:0 auto;padding:20px}
header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
h1{font-size:22px;font-weight:800}#streakBadge{background:rgba(124,58,237,.2);color:#a78bfa;padding:6px 14px;border-radius:20px;font-size:13px;font-weight:700}
.week-strip{display:flex;gap:6px;margin-bottom:20px;overflow-x:auto;padding-bottom:4px}
.day-dot{flex-shrink:0;width:40px;height:48px;background:var(--card);border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:10px;gap:3px;border:1px solid rgba(255,255,255,.06)}
.day-dot .d-name{color:var(--sub)}.day-dot .d-num{font-weight:700;font-size:14px}
.day-dot.today{border-color:var(--accent)}.day-dot.done{background:rgba(124,58,237,.2)}
.add-form{display:grid;grid-template-columns:1fr auto auto auto auto;gap:8px;background:var(--card);padding:14px;border-radius:14px;border:1px solid rgba(255,255,255,.06);margin-bottom:16px}
.add-form select,.add-form input{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);color:var(--text);padding:8px;border-radius:8px;font-size:13px}
.add-form input{width:70px}.add-form button{background:var(--accent);color:#fff;border:none;padding:8px 16px;border-radius:8px;font-weight:700;cursor:pointer;white-space:nowrap}
.log-group{margin-bottom:16px}.log-date{font-size:12px;color:var(--sub);margin-bottom:8px;font-weight:600}
.log-item{background:var(--card);border-radius:10px;padding:12px 14px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;border:1px solid rgba(255,255,255,.04)}
.log-name{font-weight:700;font-size:15px}.log-detail{font-size:13px;color:var(--sub)}
.log-del{background:none;border:none;color:var(--sub);cursor:pointer;font-size:15px;opacity:.4;transition:.2s}.log-del:hover{opacity:1}
.empty{text-align:center;color:var(--sub);padding:40px;font-size:14px}`;

const WORKOUT_JS = `"use strict";
var KEY='dalkak_workout';
var logs=JSON.parse(localStorage.getItem(KEY)||'[]');
function save(){localStorage.setItem(KEY,JSON.stringify(logs));}
function todayStr(){var d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();}
function renderWeek(){
  var strip=document.getElementById('weekStrip');if(!strip)return;
  var today=new Date();var days=['일','월','화','수','목','금','토'];
  var html='';
  for(var i=6;i>=0;i--){
    var d=new Date(today);d.setDate(today.getDate()-i);
    var ds=d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate();
    var hasDone=logs.some(function(l){return l.date===ds;});
    var isToday=(i===0);
    html+='<div class="day-dot'+(isToday?' today':'')+(hasDone?' done':'')+'"><span class="d-name">'+days[d.getDay()]+'</span><span class="d-num">'+d.getDate()+'</span></div>';
  }
  strip.innerHTML=html;
  var streak=0;var cur=new Date();
  while(true){var ds2=cur.getFullYear()+'-'+(cur.getMonth()+1)+'-'+cur.getDate();if(!logs.some(function(l){return l.date===ds2;}))break;streak++;cur.setDate(cur.getDate()-1);}
  var badge=document.getElementById('streakBadge');if(badge)badge.textContent='🔥 '+streak+'일 연속';
}
function renderLogs(){
  var list=document.getElementById('logList');if(!list)return;
  if(logs.length===0){list.innerHTML='<div class="empty">아직 기록이 없습니다<br>오늘 운동을 기록해보세요 💪</div>';return;}
  var byDate={};
  logs.forEach(function(l,i){if(!byDate[l.date])byDate[l.date]=[];byDate[l.date].push({l:l,i:i});});
  var dates=Object.keys(byDate).sort(function(a,b){return b>a?1:-1;});
  list.innerHTML=dates.map(function(dt){
    return '<div class="log-group"><div class="log-date">'+dt+'</div>'+
      byDate[dt].map(function(entry){
        var l=entry.l;var i=entry.i;
        var detail=l.sets+'세트 × '+l.reps+(l.weight?' | '+l.weight+'kg':'');
        return '<div class="log-item"><div><div class="log-name">'+l.name+'</div><div class="log-detail">'+detail+'</div></div><button class="log-del" data-idx="'+i+'">🗑</button></div>';
      }).join('')+'</div>';
  }).join('');
  list.querySelectorAll('.log-del').forEach(function(btn){
    btn.addEventListener('click',function(){logs.splice(Number(btn.dataset.idx),1);save();renderWeek();renderLogs();});
  });
}
document.addEventListener('DOMContentLoaded',function(){
  renderWeek();renderLogs();
  var addBtn=document.getElementById('addBtn');
  if(addBtn)addBtn.addEventListener('click',function(){
    var name=document.getElementById('exSelect')?.value||'';
    var sets=Number(document.getElementById('setsInput')?.value)||0;
    var reps=Number(document.getElementById('repsInput')?.value)||0;
    var weight=Number(document.getElementById('weightInput')?.value)||0;
    if(!sets||!reps){alert('세트와 횟수를 입력해주세요');return;}
    logs.push({date:todayStr(),name:name,sets:sets,reps:reps,weight:weight});
    save();renderWeek();renderLogs();
    var si=document.getElementById('setsInput');var ri=document.getElementById('repsInput');var wi=document.getElementById('weightInput');
    if(si)si.value='';if(ri)ri.value='';if(wi)wi.value='';
  });
});`;

// ══════════════════════════════════════════════════════════════
// 5. 링크 공유 (링크트리 스타일)
// ══════════════════════════════════════════════════════════════
const LINKTREE_HTML = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>🔗 내 링크 모음</title><link rel="stylesheet" href="style.css"></head>
<body>
<div class="app">
  <div class="profile"><div class="avatar" id="avatarEl">🧑‍💻</div><h1 id="nameEl">개발자 김민준</h1><p id="bioEl">풀스택 개발자 & UI 디자이너<br>서울 기반</p></div>
  <div id="linkList"></div>
  <div class="add-section">
    <h3>링크 추가</h3>
    <input type="text" id="labelInput" placeholder="링크 제목 (예: 내 GitHub)">
    <input type="url" id="urlInput" placeholder="https://...">
    <select id="emojiSelect"><option value="🔗">🔗 링크</option><option value="💻">💻 GitHub</option><option value="📸">📸 Instagram</option><option value="🐦">🐦 Twitter</option><option value="▶️">▶️ YouTube</option><option value="📝">📝 블로그</option><option value="💼">💼 LinkedIn</option></select>
    <button id="addBtn">추가</button>
  </div>
</div>
<script src="script.js"></script></body></html>`;

const LINKTREE_CSS = `:root{--bg:linear-gradient(135deg,#1a1a2e,#16213e,#0f3460);--card:rgba(255,255,255,.08);--text:#fff;--sub:rgba(255,255,255,.6);--accent:#e94560}
*{margin:0;padding:0;box-sizing:border-box}body{background:var(--bg);min-height:100vh;color:var(--text);font-family:system-ui,sans-serif;display:flex;align-items:flex-start;justify-content:center;padding:40px 16px}
.app{width:100%;max-width:420px}
.profile{text-align:center;margin-bottom:32px}
.avatar{font-size:64px;margin-bottom:12px;filter:drop-shadow(0 4px 16px rgba(0,0,0,.4))}
h1{font-size:22px;font-weight:800;margin-bottom:6px}#bioEl{color:var(--sub);font-size:14px;line-height:1.6}
.link-btn{display:flex;align-items:center;gap:12px;width:100%;background:var(--card);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.15);border-radius:14px;padding:16px 20px;margin-bottom:10px;color:var(--text);text-decoration:none;cursor:pointer;transition:.25s;font-size:15px;font-weight:600}
.link-btn:hover{background:rgba(255,255,255,.16);transform:scale(1.02)}.link-emoji{font-size:22px}
.link-btn .del{margin-left:auto;background:none;border:none;color:rgba(255,255,255,.4);cursor:pointer;font-size:14px;padding:4px 8px;border-radius:6px;transition:.2s}.link-btn .del:hover{color:var(--accent)}
.add-section{margin-top:24px;background:rgba(0,0,0,.3);border-radius:16px;padding:20px;border:1px solid rgba(255,255,255,.1)}
.add-section h3{margin-bottom:14px;font-size:16px}
.add-section input,.add-section select{width:100%;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:var(--text);padding:10px 14px;border-radius:10px;font-size:14px;margin-bottom:10px}
.add-section button{width:100%;background:var(--accent);color:#fff;border:none;padding:12px;border-radius:10px;font-weight:700;font-size:15px;cursor:pointer;transition:.2s}.add-section button:hover{opacity:.88}`;

const LINKTREE_JS = `"use strict";
var KEY='dalkak_links';
var DEFAULT_LINKS=[
  {emoji:'💻',label:'GitHub',url:'https://github.com'},
  {emoji:'📝',label:'개인 블로그',url:'https://velog.io'},
  {emoji:'▶️',label:'유튜브 채널',url:'https://youtube.com'}
];
var links=JSON.parse(localStorage.getItem(KEY)||JSON.stringify(DEFAULT_LINKS));
function save(){localStorage.setItem(KEY,JSON.stringify(links));}
function render(){
  var list=document.getElementById('linkList');if(!list)return;
  list.innerHTML=links.map(function(l,i){
    return '<a class="link-btn" href="'+l.url+'" target="_blank" rel="noopener"><span class="link-emoji">'+l.emoji+'</span><span>'+l.label+'</span><button class="del" data-idx="'+i+'" onclick="event.preventDefault();event.stopPropagation();">✕</button></a>';
  }).join('');
  list.querySelectorAll('.del').forEach(function(btn){
    btn.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();links.splice(Number(btn.dataset.idx),1);save();render();});
  });
}
document.addEventListener('DOMContentLoaded',function(){
  render();
  var addBtn=document.getElementById('addBtn');
  if(addBtn)addBtn.addEventListener('click',function(){
    var label=document.getElementById('labelInput')?.value.trim()||'';
    var url=document.getElementById('urlInput')?.value.trim()||'';
    var emoji=document.getElementById('emojiSelect')?.value||'🔗';
    if(!label||!url){alert('제목과 URL을 입력해주세요');return;}
    if(!url.startsWith('http')){url='https://'+url;}
    links.push({emoji:emoji,label:label,url:url});save();render();
    var li=document.getElementById('labelInput');var ui=document.getElementById('urlInput');
    if(li)li.value='';if(ui)ui.value='';
  });
});`;

// ══════════════════════════════════════════════════════════════
// 6. 음악 플레이어
// ══════════════════════════════════════════════════════════════
const MUSIC_HTML = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>🎵 뮤직 플레이어</title><link rel="stylesheet" href="style.css"></head>
<body>
<div class="player">
  <div class="album-art" id="albumArt">🎵</div>
  <div class="track-info"><div class="track-title" id="trackTitle">노래 제목</div><div class="artist" id="artistName">아티스트</div></div>
  <div class="progress-wrap"><div class="progress-bar" id="progressBar"><div class="progress-fill" id="progressFill" style="width:0%"></div></div>
  <div class="time-row"><span id="curTime">0:00</span><span id="durTime">0:00</span></div></div>
  <div class="controls">
    <button id="shuffleBtn" class="ctrl-btn sm">🔀</button>
    <button id="prevBtn" class="ctrl-btn">⏮</button>
    <button id="playBtn" class="ctrl-btn play">▶</button>
    <button id="nextBtn" class="ctrl-btn">⏭</button>
    <button id="repeatBtn" class="ctrl-btn sm">🔁</button>
  </div>
  <div class="volume-row"><span>🔈</span><input type="range" id="volSlider" min="0" max="100" value="70"><span>🔊</span></div>
  <div class="playlist" id="playlist"></div>
</div>
<script src="script.js"></script></body></html>`;

const MUSIC_CSS = `:root{--bg:#0d0d12;--card:#1a1a24;--accent:#a855f7;--text:#f0f0f8;--sub:#8b8694}
*{margin:0;padding:0;box-sizing:border-box}body{background:var(--bg);color:var(--text);font-family:system-ui,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center}
.player{width:340px;background:var(--card);border-radius:24px;padding:28px 24px;border:1px solid rgba(168,85,247,.2);box-shadow:0 24px 64px rgba(0,0,0,.5)}
.album-art{font-size:96px;text-align:center;margin-bottom:20px;height:130px;display:flex;align-items:center;justify-content:center;background:rgba(168,85,247,.08);border-radius:16px;transition:.3s}
.album-art.playing{animation:pulse 2s ease-in-out infinite}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
.track-info{text-align:center;margin-bottom:20px}
.track-title{font-size:18px;font-weight:700;margin-bottom:4px}.artist{color:var(--sub);font-size:14px}
.progress-bar{height:4px;background:rgba(255,255,255,.1);border-radius:2px;cursor:pointer;margin-bottom:6px;position:relative}
.progress-fill{height:100%;background:var(--accent);border-radius:2px;transition:.1s}
.time-row{display:flex;justify-content:space-between;font-size:11px;color:var(--sub)}
.controls{display:flex;align-items:center;justify-content:center;gap:12px;margin:20px 0}
.ctrl-btn{background:none;border:none;color:var(--text);cursor:pointer;font-size:24px;transition:.2s;opacity:.7;padding:4px}
.ctrl-btn:hover{opacity:1}.ctrl-btn.sm{font-size:16px}.ctrl-btn.play{background:var(--accent);color:#fff;width:52px;height:52px;border-radius:50%;font-size:20px;display:flex;align-items:center;justify-content:center;opacity:1}
.volume-row{display:flex;align-items:center;gap:8px;font-size:14px;margin-bottom:20px}
.volume-row input{flex:1;accent-color:var(--accent)}
.playlist{max-height:180px;overflow-y:auto}.pl-item{display:flex;align-items:center;gap:10px;padding:10px 8px;border-radius:10px;cursor:pointer;transition:.15s}
.pl-item:hover{background:rgba(255,255,255,.06)}.pl-item.active{background:rgba(168,85,247,.15)}
.pl-emoji{font-size:22px}.pl-info .pl-title{font-size:14px;font-weight:600}.pl-info .pl-artist{font-size:12px;color:var(--sub)}.pl-dur{margin-left:auto;font-size:12px;color:var(--sub)}`;

const MUSIC_JS = `"use strict";
var TRACKS=[
  {title:'봄날',artist:'BTS',emoji:'🌸',dur:'4:01'},{title:'사랑이 잘',artist:'IU & 오혁',emoji:'💛',dur:'3:44'},
  {title:'Celebrity',artist:'IU',emoji:'⭐',dur:'3:31'},{title:'Short Hair',artist:'볼빨간사춘기',emoji:'🎀',dur:'3:26'},
  {title:'Through the Night',artist:'IU',emoji:'🌙',dur:'3:54'},{title:'Black Swan',artist:'BTS',emoji:'🦢',dur:'3:17'},
  {title:'Panorama',artist:'IZ*ONE',emoji:'🌅',dur:'3:04'},{title:'Love Poem',artist:'IU',emoji:'📖',dur:'3:40'},
];
var cur=0;var playing=false;var progress=0;var interval=null;var repeat=false;var shuffle=false;
function renderPlaylist(){
  var pl=document.getElementById('playlist');if(!pl)return;
  pl.innerHTML=TRACKS.map(function(t,i){
    return '<div class="pl-item'+(i===cur?' active':'')+'" data-idx="'+i+'"><span class="pl-emoji">'+t.emoji+'</span><div class="pl-info"><div class="pl-title">'+t.title+'</div><div class="pl-artist">'+t.artist+'</div></div><span class="pl-dur">'+t.dur+'</span></div>';
  }).join('');
  pl.querySelectorAll('.pl-item').forEach(function(item){
    item.addEventListener('click',function(){cur=Number(item.dataset.idx);loadTrack();togglePlay(true);});
  });
}
function loadTrack(){
  var t=TRACKS[cur];
  var title=document.getElementById('trackTitle');var artist=document.getElementById('artistName');var art=document.getElementById('albumArt');
  if(title)title.textContent=t.title;if(artist)artist.textContent=t.artist;if(art)art.textContent=t.emoji;
  progress=0;updateProgress();renderPlaylist();
}
function updateProgress(){
  var fill=document.getElementById('progressFill');var ct=document.getElementById('curTime');var dt=document.getElementById('durTime');
  if(fill)fill.style.width=progress+'%';
  var t=TRACKS[cur];var parts=t.dur.split(':');var total=Number(parts[0])*60+Number(parts[1]);
  var elapsed=Math.floor(total*progress/100);
  if(ct)ct.textContent=Math.floor(elapsed/60)+':'+(elapsed%60<10?'0':'')+elapsed%60;
  if(dt)dt.textContent=t.dur;
}
function togglePlay(forcePlay){
  playing=(forcePlay===true)?true:!playing;
  var btn=document.getElementById('playBtn');
  if(btn)btn.textContent=playing?'⏸':'▶';
  var art=document.getElementById('albumArt');
  if(art)art.classList.toggle('playing',playing);
  if(interval)clearInterval(interval);
  if(playing){
    interval=setInterval(function(){
      progress+=0.5;if(progress>=100){
        if(repeat){progress=0;}else if(shuffle){cur=Math.floor(Math.random()*TRACKS.length);loadTrack();progress=0;}
        else{cur=(cur+1)%TRACKS.length;loadTrack();if(cur===0)playing=false;}
        var b=document.getElementById('playBtn');if(b)b.textContent=playing?'⏸':'▶';
      }
      updateProgress();
    },100);
  }
}
document.addEventListener('DOMContentLoaded',function(){
  loadTrack();
  var playBtn=document.getElementById('playBtn');if(playBtn)playBtn.addEventListener('click',function(){togglePlay();});
  var prevBtn=document.getElementById('prevBtn');if(prevBtn)prevBtn.addEventListener('click',function(){cur=(cur-1+TRACKS.length)%TRACKS.length;loadTrack();if(playing)togglePlay(true);});
  var nextBtn=document.getElementById('nextBtn');if(nextBtn)nextBtn.addEventListener('click',function(){cur=(cur+1)%TRACKS.length;loadTrack();if(playing)togglePlay(true);});
  var shuffleBtn=document.getElementById('shuffleBtn');if(shuffleBtn)shuffleBtn.addEventListener('click',function(){shuffle=!shuffle;shuffleBtn.style.opacity=shuffle?'1':'.7';});
  var repeatBtn=document.getElementById('repeatBtn');if(repeatBtn)repeatBtn.addEventListener('click',function(){repeat=!repeat;repeatBtn.style.opacity=repeat?'1':'.7';});
  var pb=document.getElementById('progressBar');if(pb)pb.addEventListener('click',function(e){progress=(e.offsetX/pb.offsetWidth)*100;updateProgress();});
});`;

// ══════════════════════════════════════════════════════════════
// 7. 당근마켓 스타일 중고거래
// ══════════════════════════════════════════════════════════════
const DANG_HTML = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>🥕 당근 중고거래</title><link rel="stylesheet" href="style.css"></head>
<body>
<header class="hdr"><h1>🥕 동네 중고거래</h1><input type="text" id="searchInput" placeholder="검색..."></header>
<div class="filters" id="filters"><button class="f-btn active" data-cat="all">전체</button><button class="f-btn" data-cat="전자">전자기기</button><button class="f-btn" data-cat="의류">의류</button><button class="f-btn" data-cat="가구">가구</button><button class="f-btn" data-cat="도서">도서</button></div>
<div class="item-list" id="itemList"></div>
<div class="modal-bg hidden" id="modalBg">
  <div class="modal" id="modal"></div>
</div>
<script src="script.js"></script></body></html>`;

const DANG_CSS = `:root{--bg:#f5f5f5;--white:#fff;--accent:#ff6f0f;--text:#1c1c1e;--sub:#8e8e93;--border:#e5e5ea}
*{margin:0;padding:0;box-sizing:border-box}body{background:var(--bg);color:var(--text);font-family:'Apple SD Gothic Neo',system-ui,sans-serif;max-width:480px;margin:0 auto;min-height:100vh}
.hdr{background:var(--white);padding:14px 16px;display:flex;gap:10px;align-items:center;border-bottom:1px solid var(--border);position:sticky;top:0;z-index:10}
.hdr h1{font-size:18px;font-weight:800;white-space:nowrap}
.hdr input{flex:1;background:var(--bg);border:none;border-radius:8px;padding:8px 12px;font-size:14px;color:var(--text)}
.filters{display:flex;gap:6px;padding:12px 16px;overflow-x:auto;background:var(--white);border-bottom:1px solid var(--border)}
.f-btn{background:var(--bg);border:1px solid var(--border);padding:6px 14px;border-radius:20px;font-size:13px;cursor:pointer;white-space:nowrap}
.f-btn.active{background:var(--accent);color:#fff;border-color:var(--accent)}
.item-list{padding:0}.item-card{background:var(--white);display:flex;gap:12px;padding:14px 16px;border-bottom:1px solid var(--border);cursor:pointer;transition:.15s}
.item-card:hover{background:#fafafa}
.item-img{width:80px;height:80px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:40px;background:var(--bg);flex-shrink:0}
.item-info{flex:1;min-width:0}.item-title{font-size:15px;font-weight:600;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.item-meta{font-size:12px;color:var(--sub);margin-bottom:6px}.item-price{font-size:16px;font-weight:700}
.item-stats{font-size:12px;color:var(--sub);margin-top:4px}
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:100;display:flex;align-items:flex-end}
.modal{background:var(--white);border-radius:20px 20px 0 0;padding:24px;width:100%;max-height:80vh;overflow-y:auto}
.m-emoji{font-size:64px;text-align:center;margin-bottom:12px}.m-title{font-size:20px;font-weight:700;margin-bottom:6px}
.m-price{font-size:22px;font-weight:800;color:var(--accent);margin-bottom:8px}.m-desc{font-size:14px;color:var(--sub);line-height:1.6;margin-bottom:16px}
.m-user{display:flex;align-items:center;gap:8px;padding:12px 0;border-top:1px solid var(--border);font-size:14px}
.m-btns{display:flex;gap:10px;margin-top:16px}
.btn-chat{flex:1;background:var(--accent);color:#fff;border:none;padding:14px;border-radius:12px;font-weight:700;font-size:15px;cursor:pointer}
.btn-like{background:var(--bg);border:1px solid var(--border);padding:14px 18px;border-radius:12px;font-size:20px;cursor:pointer}
.hidden{display:none!important}`;

const DANG_JS = `"use strict";
var ITEMS=[
  {id:1,title:'맥북 프로 M3 14인치',price:2200000,cat:'전자',emoji:'💻',area:'강남구',time:'1시간 전',likes:12,views:89,desc:'작년 12월 구매. 완품 박스 있음. 기스 하나 없이 깨끗하게 사용했습니다. 정가 3.5M에 구매했어요.',user:'seoullaptop'},
  {id:2,title:'아이폰 15 Pro 256GB',price:1050000,cat:'전자',emoji:'📱',area:'서초구',time:'3시간 전',likes:8,views:45,desc:'유심 개통 안 한 새제품. 색상 블랙 티타늄.',user:'apple_seller'},
  {id:3,title:'나이키 조던1 레트로 265',price:320000,cat:'의류',emoji:'👟',area:'마포구',time:'5시간 전',likes:21,views:167,desc:'정품 구매. 딱 2번 신음. 박스 포함. 발볼 넓으신 분은 구매 전 상담 추천.',user:'sneaker_kim'},
  {id:4,title:'버즈 프로2 이어폰',price:98000,cat:'전자',emoji:'🎧',area:'용산구',time:'어제',likes:5,views:33,desc:'2개월 사용. 정상 작동. 케이스, 이어팁 포함.',user:'gadget_park'},
  {id:5,title:'원목 커피 테이블',price:85000,cat:'가구',emoji:'🪑',area:'송파구',time:'2일 전',likes:3,views:28,desc:'이케아 라크 테이블. 이사 가면서 팝니다. 직거래만.',user:'move_choi'},
  {id:6,title:'클린코드 외 개발서 5권',price:45000,cat:'도서',emoji:'📚',area:'강동구',time:'3일 전',likes:7,views:52,desc:'클린코드, 리팩토링, 오브젝트, 실용주의 프로그래머, DDD. 전부 좋은 상태.',user:'dev_lee'},
  {id:7,title:'무신사 스탠다드 코트 M',price:55000,cat:'의류',emoji:'🧥',area:'성동구',time:'4일 전',likes:9,views:74,desc:'작년 겨울 3회 착용. 드라이클리닝 완료. 정가 12만원.',user:'fashion_jung'},
  {id:8,title:'다이슨 에어랩',price:450000,cat:'전자',emoji:'💨',area:'노원구',time:'5일 전',likes:15,views:120,desc:'1년 사용. 수리 이력 없음. 정품 부속 전부 포함.',user:'beauty_na'},
];
var activeCat='all';var query='';
function filtered(){
  return ITEMS.filter(function(i){
    return (activeCat==='all'||i.cat===activeCat)&&(!query||i.title.includes(query)||i.desc.includes(query));
  });
}
function render(){
  var list=document.getElementById('itemList');if(!list)return;
  var items=filtered();
  if(items.length===0){list.innerHTML='<div style="text-align:center;padding:40px;color:#8e8e93">검색 결과가 없습니다</div>';return;}
  list.innerHTML=items.map(function(i){
    return '<div class="item-card" data-id="'+i.id+'"><div class="item-img">'+i.emoji+'</div><div class="item-info"><div class="item-title">'+i.title+'</div><div class="item-meta">'+i.area+' · '+i.time+'</div><div class="item-price">₩'+i.price.toLocaleString()+'</div><div class="item-stats">관심 '+i.likes+' · 조회 '+i.views+'</div></div></div>';
  }).join('');
  list.querySelectorAll('.item-card').forEach(function(card){
    card.addEventListener('click',function(){openModal(Number(card.dataset.id));});
  });
}
function openModal(id){
  var item=ITEMS.find(function(i){return i.id===id;});if(!item)return;
  var modal=document.getElementById('modal');var bg=document.getElementById('modalBg');
  if(!modal||!bg)return;
  modal.innerHTML='<div class="m-emoji">'+item.emoji+'</div><div class="m-title">'+item.title+'</div><div class="m-price">₩'+item.price.toLocaleString()+'</div><div class="m-desc">'+item.desc+'</div><div class="m-user">👤 <strong>'+item.user+'</strong><span style="color:#8e8e93;margin-left:auto">'+item.area+'</span></div><div class="m-btns"><button class="btn-chat" onclick="alert(\'채팅 기능은 로그인 후 이용 가능합니다\')">💬 채팅하기</button><button class="btn-like">🤍 '+item.likes+'</button></div>';
  bg.classList.remove('hidden');
}
document.addEventListener('DOMContentLoaded',function(){
  render();
  var bg=document.getElementById('modalBg');
  if(bg)bg.addEventListener('click',function(e){if(e.target===bg)bg.classList.add('hidden');});
  document.querySelectorAll('.f-btn').forEach(function(btn){
    btn.addEventListener('click',function(){
      document.querySelectorAll('.f-btn').forEach(function(b){b.classList.remove('active');});
      btn.classList.add('active');activeCat=btn.dataset.cat||'all';render();
    });
  });
  var search=document.getElementById('searchInput');
  if(search)search.addEventListener('input',function(){query=search.value.trim();render();});
});`;

// ══════════════════════════════════════════════════════════════
// 8. 여행 플래너
// ══════════════════════════════════════════════════════════════
const TRAVEL_HTML = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>✈️ 여행 플래너</title><link rel="stylesheet" href="style.css"></head>
<body>
<div class="app">
  <header><h1>✈️ 여행 플래너</h1><button id="addTripBtn">+ 여행 추가</button></header>
  <div class="trips" id="tripList"></div>
</div>
<div class="modal-bg hidden" id="modalBg">
  <div class="modal">
    <h2>🗺️ 새 여행</h2>
    <input id="destInput" placeholder="여행지 (예: 도쿄, 파리, 제주도)">
    <div class="date-row"><input type="date" id="startDate"><input type="date" id="endDate"></div>
    <input id="budgetInput" type="number" placeholder="예산 (원)">
    <textarea id="memoInput" placeholder="메모 (숙소, 항공권 등)"></textarea>
    <div class="modal-btns"><button id="cancelBtn">취소</button><button id="saveBtn">저장</button></div>
  </div>
</div>
<script src="script.js"></script></body></html>`;

const TRAVEL_CSS = `:root{--bg:#f8faff;--white:#fff;--accent:#3b82f6;--text:#1e293b;--sub:#64748b;--border:#e2e8f0}
*{margin:0;padding:0;box-sizing:border-box}body{background:var(--bg);color:var(--text);font-family:system-ui,sans-serif;min-height:100vh}
.app{max-width:480px;margin:0 auto;padding:20px}
header{display:flex;justify-content:space-between;align-items:center;margin-bottom:24px}
h1{font-size:22px;font-weight:800}
header button{background:var(--accent);color:#fff;border:none;padding:10px 18px;border-radius:12px;font-weight:700;cursor:pointer}
.trip-card{background:var(--white);border-radius:16px;padding:20px;margin-bottom:14px;border:1px solid var(--border);position:relative;overflow:hidden}
.trip-card::before{content:'';position:absolute;top:0;left:0;width:4px;height:100%;background:var(--accent)}
.trip-dest{font-size:20px;font-weight:800;margin-bottom:6px}.trip-dates{font-size:13px;color:var(--sub);margin-bottom:8px}
.trip-budget{font-size:15px;font-weight:600;color:var(--accent);margin-bottom:8px}
.trip-memo{font-size:13px;color:var(--sub);line-height:1.6;margin-bottom:10px}
.trip-days{display:inline-block;background:rgba(59,130,246,.1);color:var(--accent);padding:4px 12px;border-radius:20px;font-size:12px;font-weight:600}
.trip-del{position:absolute;top:16px;right:16px;background:none;border:none;color:var(--sub);cursor:pointer;font-size:16px;opacity:.5;transition:.2s}.trip-del:hover{opacity:1}
.empty{text-align:center;color:var(--sub);padding:60px 20px;font-size:15px;line-height:1.8}
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.3);z-index:100;display:flex;align-items:center;justify-content:center}
.modal{background:var(--white);border-radius:20px;padding:24px;width:90%;max-width:420px}
.modal h2{margin-bottom:16px;font-size:18px}
.modal input,.modal textarea,.modal select{width:100%;border:1px solid var(--border);border-radius:10px;padding:10px 14px;font-size:14px;margin-bottom:10px;color:var(--text);background:var(--bg)}
.modal textarea{min-height:80px;resize:vertical}
.date-row{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.modal-btns{display:flex;gap:10px;margin-top:4px}
.modal-btns button{flex:1;padding:12px;border-radius:10px;font-weight:700;font-size:15px;cursor:pointer;border:none}
#cancelBtn{background:var(--border);color:var(--sub)}#saveBtn{background:var(--accent);color:#fff}
.hidden{display:none!important}`;

const TRAVEL_JS = `"use strict";
var KEY='dalkak_travel';
var EMOJIS=['🗼','🏯','🗽','🏝️','🏔️','🌊','🌸','🌍','🏛️','🎡'];
var trips=JSON.parse(localStorage.getItem(KEY)||'[]');
function save(){localStorage.setItem(KEY,JSON.stringify(trips));}
function daysBetween(s,e){var a=new Date(s);var b=new Date(e);return Math.max(1,Math.round((b-a)/(1000*60*60*24))+1);}
function render(){
  var list=document.getElementById('tripList');if(!list)return;
  if(trips.length===0){list.innerHTML='<div class="empty">✈️ 아직 여행 계획이 없습니다<br>첫 여행을 추가해보세요!</div>';return;}
  list.innerHTML=trips.slice().reverse().map(function(t,ri){
    var i=trips.length-1-ri;
    var emoji=EMOJIS[i%EMOJIS.length];
    var days=t.start&&t.end?daysBetween(t.start,t.end):0;
    return '<div class="trip-card"><button class="trip-del" data-idx="'+i+'">🗑</button>'
      +'<div class="trip-dest">'+emoji+' '+t.dest+'</div>'
      +(t.start?'<div class="trip-dates">'+t.start+' ~ '+t.end+'</div>':'')
      +(t.budget?'<div class="trip-budget">예산 ₩'+Number(t.budget).toLocaleString()+'</div>':'')
      +(t.memo?'<div class="trip-memo">'+t.memo+'</div>':'')
      +(days?'<span class="trip-days">'+days+'박 '+(days)+'일</span>':'')+'</div>';
  }).join('');
  list.querySelectorAll('.trip-del').forEach(function(btn){
    btn.addEventListener('click',function(){trips.splice(Number(btn.dataset.idx),1);save();render();});
  });
}
document.addEventListener('DOMContentLoaded',function(){
  render();
  var addBtn=document.getElementById('addTripBtn');var bg=document.getElementById('modalBg');
  var cancelBtn=document.getElementById('cancelBtn');var saveBtn=document.getElementById('saveBtn');
  if(addBtn)addBtn.addEventListener('click',function(){if(bg)bg.classList.remove('hidden');});
  if(cancelBtn)cancelBtn.addEventListener('click',function(){if(bg)bg.classList.add('hidden');});
  if(bg)bg.addEventListener('click',function(e){if(e.target===bg)bg.classList.add('hidden');});
  if(saveBtn)saveBtn.addEventListener('click',function(){
    var dest=document.getElementById('destInput')?.value.trim()||'';
    if(!dest){alert('여행지를 입력해주세요');return;}
    trips.push({dest:dest,start:document.getElementById('startDate')?.value||'',end:document.getElementById('endDate')?.value||'',budget:document.getElementById('budgetInput')?.value||'',memo:document.getElementById('memoInput')?.value.trim()||''});
    save();render();if(bg)bg.classList.add('hidden');
    var di=document.getElementById('destInput');var si=document.getElementById('startDate');var ei=document.getElementById('endDate');var bi=document.getElementById('budgetInput');var mi=document.getElementById('memoInput');
    if(di)di.value='';if(si)si.value='';if(ei)ei.value='';if(bi)bi.value='';if(mi)mi.value='';
  });
});`;

// ══════════════════════════════════════════════════════════════
// 9. BMI/건강 계산기
// ══════════════════════════════════════════════════════════════
const BMI_HTML = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>🏃 건강 계산기</title><link rel="stylesheet" href="style.css"></head>
<body>
<div class="app">
  <h1>🏃 건강 계산기</h1>
  <div class="tabs"><button class="tab active" data-tab="bmi">BMI</button><button class="tab" data-tab="calories">칼로리</button><button class="tab" data-tab="water">수분</button></div>
  <div class="panel" id="bmi-panel">
    <label>키 (cm)<input type="number" id="heightInput" placeholder="170" min="100" max="250"></label>
    <label>몸무게 (kg)<input type="number" id="weightInput" placeholder="65" min="30" max="300"></label>
    <button class="calc-btn" id="bmiBtn">계산하기</button>
    <div class="result hidden" id="bmiResult"></div>
  </div>
  <div class="panel hidden" id="calories-panel">
    <label>나이<input type="number" id="ageInput" placeholder="25"></label>
    <label>키 (cm)<input type="number" id="cHeightInput" placeholder="170"></label>
    <label>몸무게 (kg)<input type="number" id="cWeightInput" placeholder="65"></label>
    <label>성별<select id="genderSelect"><option value="m">남성</option><option value="f">여성</option></select></label>
    <label>활동량<select id="activitySelect"><option value="1.2">거의 없음</option><option value="1.375">가벼운 운동</option><option value="1.55">보통 운동</option><option value="1.725">심한 운동</option></select></label>
    <button class="calc-btn" id="calBtn">계산하기</button>
    <div class="result hidden" id="calResult"></div>
  </div>
  <div class="panel hidden" id="water-panel">
    <label>몸무게 (kg)<input type="number" id="wWeightInput" placeholder="65"></label>
    <label>운동 시간 (분)<input type="number" id="exerciseInput" placeholder="30"></label>
    <button class="calc-btn" id="waterBtn">계산하기</button>
    <div class="result hidden" id="waterResult"></div>
  </div>
</div>
<script src="script.js"></script></body></html>`;

const BMI_CSS = `:root{--bg:#f0fdf4;--white:#fff;--accent:#22c55e;--text:#14532d;--sub:#6b7280;--border:#dcfce7}
*{margin:0;padding:0;box-sizing:border-box}body{background:var(--bg);color:var(--text);font-family:system-ui,sans-serif;min-height:100vh;display:flex;align-items:flex-start;justify-content:center;padding:32px 16px}
.app{width:100%;max-width:400px}
h1{font-size:22px;font-weight:800;margin-bottom:20px}
.tabs{display:flex;gap:6px;margin-bottom:24px;background:var(--white);padding:4px;border-radius:12px;border:1px solid var(--border)}
.tab{flex:1;padding:10px;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;background:none;color:var(--sub);transition:.2s}
.tab.active{background:var(--accent);color:#fff}
.panel{background:var(--white);border-radius:16px;padding:20px;border:1px solid var(--border)}
label{display:block;font-size:13px;font-weight:600;margin-bottom:12px;color:var(--text)}
label input,label select{display:block;width:100%;margin-top:4px;padding:10px 14px;border:1px solid var(--border);border-radius:10px;font-size:15px;color:var(--text);background:var(--bg)}
.calc-btn{width:100%;background:var(--accent);color:#fff;border:none;padding:14px;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;margin-top:4px;transition:.2s}
.calc-btn:hover{opacity:.88}
.result{margin-top:16px;padding:16px;background:var(--bg);border-radius:12px;border:1px solid var(--border);font-size:14px;line-height:1.8}
.result .val{font-size:28px;font-weight:800;color:var(--accent)}.result .label{font-size:13px;font-weight:700;margin:4px 0}.result .tip{font-size:12px;color:var(--sub)}
.hidden{display:none!important}`;

const BMI_JS = `"use strict";
document.addEventListener('DOMContentLoaded',function(){
  document.querySelectorAll('.tab').forEach(function(tab){
    tab.addEventListener('click',function(){
      document.querySelectorAll('.tab').forEach(function(t){t.classList.remove('active');});
      document.querySelectorAll('.panel').forEach(function(p){p.classList.add('hidden');});
      tab.classList.add('active');
      var panel=document.getElementById(tab.dataset.tab+'-panel');
      if(panel)panel.classList.remove('hidden');
    });
  });
  var bmiBtn=document.getElementById('bmiBtn');
  if(bmiBtn)bmiBtn.addEventListener('click',function(){
    var h=Number(document.getElementById('heightInput')?.value)||0;
    var w=Number(document.getElementById('weightInput')?.value)||0;
    if(!h||!w){alert('키와 몸무게를 입력해주세요');return;}
    var bmi=w/((h/100)*(h/100));var result=document.getElementById('bmiResult');
    var cat=bmi<18.5?'저체중':bmi<23?'정상':bmi<25?'과체중':bmi<30?'비만':'고도비만';
    var tip=bmi<18.5?'체중 증량이 필요합니다':bmi<23?'건강한 체중입니다! 유지하세요 💪':bmi<25?'약간의 체중 감량을 권장합니다':bmi<30?'적극적인 식이요법과 운동이 필요합니다':'의사와 상담을 권장합니다';
    if(result){result.innerHTML='<div class="val">'+bmi.toFixed(1)+'</div><div class="label">'+cat+'</div><div class="tip">'+tip+'</div>';result.classList.remove('hidden');}
  });
  var calBtn=document.getElementById('calBtn');
  if(calBtn)calBtn.addEventListener('click',function(){
    var age=Number(document.getElementById('ageInput')?.value)||0;
    var h=Number(document.getElementById('cHeightInput')?.value)||0;
    var w=Number(document.getElementById('cWeightInput')?.value)||0;
    var g=document.getElementById('genderSelect')?.value||'m';
    var act=Number(document.getElementById('activitySelect')?.value)||1.2;
    if(!age||!h||!w){alert('모든 항목을 입력해주세요');return;}
    var bmr=g==='m'?(10*w)+(6.25*h)-(5*age)+5:(10*w)+(6.25*h)-(5*age)-161;
    var tdee=Math.round(bmr*act);var result=document.getElementById('calResult');
    if(result){result.innerHTML='<div class="val">'+tdee+'</div><div class="label">kcal/일 (유지 칼로리)</div><div class="tip">감량 목표: '+Math.round(tdee-500)+' kcal | 증량 목표: '+Math.round(tdee+500)+' kcal</div>';result.classList.remove('hidden');}
  });
  var waterBtn=document.getElementById('waterBtn');
  if(waterBtn)waterBtn.addEventListener('click',function(){
    var w=Number(document.getElementById('wWeightInput')?.value)||0;
    var ex=Number(document.getElementById('exerciseInput')?.value)||0;
    if(!w){alert('몸무게를 입력해주세요');return;}
    var base=w*30;var extra=ex*7;var total=Math.round((base+extra)/100)*100;
    var result=document.getElementById('waterResult');
    if(result){result.innerHTML='<div class="val">'+(total/1000).toFixed(1)+'L</div><div class="label">하루 권장 수분 섭취량</div><div class="tip">기본 '+base+'ml + 운동 '+extra+'ml<br>하루 '+Math.round(total/240)+'잔 (240ml 기준)</div>';result.classList.remove('hidden');}
  });
});`;

// ══════════════════════════════════════════════════════════════
// 10. 간단 메모장
// ══════════════════════════════════════════════════════════════
const MEMO_HTML = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>📝 메모장</title><link rel="stylesheet" href="style.css"></head>
<body>
<div class="app">
  <header><h1>📝 메모장</h1><button id="newBtn">+ 새 메모</button></header>
  <div class="search-row"><input type="text" id="searchInput" placeholder="🔍 메모 검색..."></div>
  <div class="memo-grid" id="memoGrid"></div>
</div>
<div class="modal-bg hidden" id="modalBg">
  <div class="modal">
    <input class="title-input" id="titleInput" placeholder="제목">
    <textarea id="contentInput" placeholder="내용을 입력하세요..."></textarea>
    <div class="color-row" id="colorRow"><button data-color="#fef9c3">💛</button><button data-color="#dcfce7">💚</button><button data-color="#dbeafe">💙</button><button data-color="#fce7f3">💗</button><button data-color="#f3e8ff">💜</button></div>
    <div class="modal-btns"><button id="deleteBtn" class="del-btn">삭제</button><button id="saveBtn" class="save-btn">저장</button></div>
  </div>
</div>
<script src="script.js"></script></body></html>`;

const MEMO_CSS = `:root{--bg:#fafafa;--text:#1c1c1e;--sub:#8e8e93;--border:#e5e5ea;--white:#fff}
*{margin:0;padding:0;box-sizing:border-box}body{background:var(--bg);color:var(--text);font-family:'Apple SD Gothic Neo',system-ui,sans-serif;min-height:100vh}
.app{max-width:600px;margin:0 auto;padding:20px}
header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
h1{font-size:22px;font-weight:800}header button{background:#1c1c1e;color:#fff;border:none;padding:10px 18px;border-radius:12px;font-weight:700;cursor:pointer}
.search-row{margin-bottom:16px}
.search-row input{width:100%;background:var(--white);border:1px solid var(--border);border-radius:12px;padding:10px 16px;font-size:14px;color:var(--text)}
.memo-grid{columns:2;column-gap:10px}
@media(max-width:400px){.memo-grid{columns:1}}
.memo-card{background:var(--white);border-radius:12px;padding:14px;margin-bottom:10px;break-inside:avoid;cursor:pointer;border:1px solid var(--border);transition:.2s}
.memo-card:hover{box-shadow:0 4px 16px rgba(0,0,0,.08)}.memo-card-title{font-weight:700;font-size:15px;margin-bottom:6px}.memo-card-content{font-size:13px;color:var(--sub);line-height:1.6;max-height:80px;overflow:hidden}
.memo-card-date{font-size:11px;color:#aeaeb2;margin-top:8px}
.empty{text-align:center;color:var(--sub);padding:60px;font-size:15px}
.modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.3);z-index:100;display:flex;align-items:center;justify-content:center;padding:16px}
.modal{background:var(--white);border-radius:20px;padding:24px;width:100%;max-width:480px}
.title-input{width:100%;border:none;border-bottom:1px solid var(--border);padding:8px 0;font-size:18px;font-weight:700;margin-bottom:12px;color:var(--text);background:transparent}
.title-input:focus{outline:none;border-color:#1c1c1e}
#contentInput{width:100%;border:none;resize:none;font-size:14px;min-height:160px;color:var(--text);line-height:1.7}
#contentInput:focus{outline:none}
.color-row{display:flex;gap:8px;margin:12px 0;padding-top:12px;border-top:1px solid var(--border)}
.color-row button{border:none;background:none;font-size:20px;cursor:pointer;padding:4px;border-radius:6px;transition:.15s}.color-row button:hover{transform:scale(1.2)}
.modal-btns{display:flex;justify-content:flex-end;gap:10px;margin-top:12px}
.del-btn{background:none;border:1px solid var(--border);color:var(--sub);padding:10px 18px;border-radius:10px;font-size:14px;cursor:pointer}
.save-btn{background:#1c1c1e;color:#fff;border:none;padding:10px 20px;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer}
.hidden{display:none!important}`;

const MEMO_JS = `"use strict";
var KEY='dalkak_memo';
var memos=JSON.parse(localStorage.getItem(KEY)||'[]');
var curId=null;var curColor='#fef9c3';var query='';
function save(){localStorage.setItem(KEY,JSON.stringify(memos));}
function fmt(iso){var d=new Date(iso);return (d.getMonth()+1)+'/'+d.getDate();}
function render(){
  var grid=document.getElementById('memoGrid');if(!grid)return;
  var filtered=memos.filter(function(m){return !query||(m.title+m.content).includes(query);}).slice().reverse();
  if(filtered.length===0){grid.innerHTML='<div class="empty">📝 메모가 없습니다<br>새 메모를 작성해보세요</div>';return;}
  grid.innerHTML=filtered.map(function(m){
    return '<div class="memo-card" data-id="'+m.id+'" style="background:'+m.color+'"><div class="memo-card-title">'+m.title+'</div><div class="memo-card-content">'+m.content+'</div><div class="memo-card-date">'+fmt(m.updatedAt)+'</div></div>';
  }).join('');
  grid.querySelectorAll('.memo-card').forEach(function(card){
    card.addEventListener('click',function(){openMemo(card.dataset.id);});
  });
}
function openModal(id){
  var bg=document.getElementById('modalBg');if(bg)bg.classList.remove('hidden');
  if(id){
    var m=memos.find(function(x){return x.id===id;});if(!m)return;
    curId=id;curColor=m.color;
    var ti=document.getElementById('titleInput');var ci=document.getElementById('contentInput');
    if(ti)ti.value=m.title;if(ci)ci.value=m.content;
    if(bg)bg.querySelector('.modal').style.background=m.color;
  } else {
    curId=null;curColor='#fef9c3';
    var ti2=document.getElementById('titleInput');var ci2=document.getElementById('contentInput');
    if(ti2)ti2.value='';if(ci2)ci2.value='';
    if(bg)bg.querySelector('.modal').style.background=curColor;
  }
}
function openMemo(id){openModal(id);}
document.addEventListener('DOMContentLoaded',function(){
  render();
  var newBtn=document.getElementById('newBtn');if(newBtn)newBtn.addEventListener('click',function(){openModal(null);});
  var bg=document.getElementById('modalBg');
  if(bg)bg.addEventListener('click',function(e){if(e.target===bg)bg.classList.add('hidden');});
  var si=document.getElementById('searchInput');if(si)si.addEventListener('input',function(){query=si.value;render();});
  document.querySelectorAll('#colorRow button').forEach(function(btn){
    btn.addEventListener('click',function(){curColor=btn.dataset.color||'#fef9c3';var modal=document.querySelector('.modal');if(modal)modal.style.background=curColor;});
  });
  var saveBtn=document.getElementById('saveBtn');
  if(saveBtn)saveBtn.addEventListener('click',function(){
    var title=document.getElementById('titleInput')?.value.trim()||'';
    var content=document.getElementById('contentInput')?.value.trim()||'';
    if(!title&&!content){alert('내용을 입력해주세요');return;}
    var now=new Date().toISOString();
    if(curId){var m=memos.find(function(x){return x.id===curId;});if(m){m.title=title;m.content=content;m.color=curColor;m.updatedAt=now;}}
    else{memos.push({id:Date.now().toString(),title:title,content:content,color:curColor,createdAt:now,updatedAt:now});}
    save();render();if(bg)bg.classList.add('hidden');
  });
  var delBtn=document.getElementById('deleteBtn');
  if(delBtn)delBtn.addEventListener('click',function(){
    if(!curId){if(bg)bg.classList.add('hidden');return;}
    if(confirm('메모를 삭제하시겠습니까?')){memos=memos.filter(function(m){return m.id!==curId;});save();render();if(bg)bg.classList.add('hidden');}
  });
});`;

// ══════════════════════════════════════════════════════════════
// EXPORT
// ══════════════════════════════════════════════════════════════
export const TEMPLATES5: TemplateInfo5[] = [
  {
    keywords: ["카페","메뉴판","카페 앱","메뉴 앱","음료","커피","주문"],
    name: "카페 메뉴판", icon: "☕", description: "카페 메뉴 주문 앱 — 카테고리 필터, 장바구니, 주문", category: "app",
    files: {
      "index.html": { name: "index.html", language: "html", content: CAFE_HTML },
      "style.css": { name: "style.css", language: "css", content: CAFE_CSS },
      "script.js": { name: "script.js", language: "javascript", content: CAFE_JS },
    },
  },
  {
    keywords: ["가계부","지출","수입","돈 관리","예산","재테크","가계"],
    name: "가계부", icon: "💰", description: "수입/지출 가계부 — 합계, 잔액, localStorage 저장", category: "app",
    files: {
      "index.html": { name: "index.html", language: "html", content: BUDGET_HTML },
      "style.css": { name: "style.css", language: "css", content: BUDGET_CSS },
      "script.js": { name: "script.js", language: "javascript", content: BUDGET_JS },
    },
  },
  {
    keywords: ["영단어","플래시카드","단어장","암기","영어 공부","단어 암기","영어 단어"],
    name: "영단어 암기", icon: "📚", description: "영단어 플래시카드 — 알아요/모르겠어요, 진도 표시", category: "app",
    files: {
      "index.html": { name: "index.html", language: "html", content: FLASH_HTML },
      "style.css": { name: "style.css", language: "css", content: FLASH_CSS },
      "script.js": { name: "script.js", language: "javascript", content: FLASH_JS },
    },
  },
  {
    keywords: ["운동","헬스","헬스장","운동 기록","workout","트레이닝","피트니스","스쿼트","데드리프트"],
    name: "운동 기록", icon: "💪", description: "운동 로그 앱 — 연속 기록 스트릭, 주간 달성 현황", category: "app",
    files: {
      "index.html": { name: "index.html", language: "html", content: WORKOUT_HTML },
      "style.css": { name: "style.css", language: "css", content: WORKOUT_CSS },
      "script.js": { name: "script.js", language: "javascript", content: WORKOUT_JS },
    },
  },
  {
    keywords: ["링크트리","링크 공유","내 링크","소개 페이지","링크 모음","링크트리 만들기"],
    name: "링크 공유 페이지", icon: "🔗", description: "링크트리 스타일 — 프로필, 링크 목록, 추가/삭제", category: "app",
    files: {
      "index.html": { name: "index.html", language: "html", content: LINKTREE_HTML },
      "style.css": { name: "style.css", language: "css", content: LINKTREE_CSS },
      "script.js": { name: "script.js", language: "javascript", content: LINKTREE_JS },
    },
  },
  {
    keywords: ["음악","플레이어","뮤직","노래","멜론","spotify","음악 앱","음악 플레이어"],
    name: "음악 플레이어", icon: "🎵", description: "뮤직 플레이어 — 재생목록, 진행바, 셔플/반복", category: "app",
    files: {
      "index.html": { name: "index.html", language: "html", content: MUSIC_HTML },
      "style.css": { name: "style.css", language: "css", content: MUSIC_CSS },
      "script.js": { name: "script.js", language: "javascript", content: MUSIC_JS },
    },
  },
  {
    keywords: ["당근","중고","중고거래","당근마켓","장터","중고 마켓","중고 앱"],
    name: "중고거래 앱", icon: "🥕", description: "당근마켓 스타일 — 상품 목록, 카테고리 필터, 상세 모달", category: "platform",
    files: {
      "index.html": { name: "index.html", language: "html", content: DANG_HTML },
      "style.css": { name: "style.css", language: "css", content: DANG_CSS },
      "script.js": { name: "script.js", language: "javascript", content: DANG_JS },
    },
  },
  {
    keywords: ["여행","여행 계획","여행 플래너","여행지","일정","travel","trip"],
    name: "여행 플래너", icon: "✈️", description: "여행 계획 앱 — 여행지, 날짜, 예산, 메모 관리", category: "app",
    files: {
      "index.html": { name: "index.html", language: "html", content: TRAVEL_HTML },
      "style.css": { name: "style.css", language: "css", content: TRAVEL_CSS },
      "script.js": { name: "script.js", language: "javascript", content: TRAVEL_JS },
    },
  },
  {
    keywords: ["bmi","칼로리","건강","다이어트","체중","체질량","건강 계산기"],
    name: "건강 계산기", icon: "🏃", description: "BMI · 칼로리 · 수분 3종 건강 계산기", category: "tool",
    files: {
      "index.html": { name: "index.html", language: "html", content: BMI_HTML },
      "style.css": { name: "style.css", language: "css", content: BMI_CSS },
      "script.js": { name: "script.js", language: "javascript", content: BMI_JS },
    },
  },
  {
    keywords: ["메모","메모장","노트","note","메모 앱","메모장 만들기","노트 앱"],
    name: "메모장", icon: "📝", description: "컬러 메모장 — 검색, 컬러 테마, localStorage 저장", category: "app",
    files: {
      "index.html": { name: "index.html", language: "html", content: MEMO_HTML },
      "style.css": { name: "style.css", language: "css", content: MEMO_CSS },
      "script.js": { name: "script.js", language: "javascript", content: MEMO_JS },
    },
  },
];
