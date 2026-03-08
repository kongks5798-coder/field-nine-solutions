import type { FilesMap } from "./workspace.constants";

export interface TemplateInfo7 {
  keywords: string[];
  name: string;
  icon: string;
  description: string;
  category: "game" | "app" | "tool" | "platform";
  files: FilesMap;
}

// ══════════════════════════════════════════════════════════════
// 1. 부동산 매물 앱 (직방/호갱노노 스타일)
// ══════════════════════════════════════════════════════════════
const REALESTATE_HTML = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>🏠 부동산 매물</title><link rel="stylesheet" href="style.css"></head>
<body>
<header class="header">
  <div class="logo">🏠 집찾기</div>
  <div class="header-actions">
    <button class="btn-filter" id="filterBtn">⚙️ 필터</button>
    <button class="btn-fav" id="favBtn">❤️ 찜 <span id="favCount">0</span></button>
  </div>
</header>
<div class="search-bar">
  <input type="text" id="searchInput" placeholder="지역, 단지명 검색...">
  <div class="type-tabs">
    <button class="tab active" data-type="all">전체</button>
    <button class="tab" data-type="apt">아파트</button>
    <button class="tab" data-type="villa">빌라</button>
    <button class="tab" data-type="office">오피스텔</button>
    <button class="tab" data-type="house">단독주택</button>
  </div>
</div>
<div class="sort-bar">
  <span id="resultCount" class="result-count">매물 20개</span>
  <select id="sortSelect">
    <option value="recent">최신순</option>
    <option value="price-asc">가격 낮은순</option>
    <option value="price-desc">가격 높은순</option>
    <option value="area-desc">면적 큰순</option>
  </select>
</div>
<div class="filter-panel hidden" id="filterPanel">
  <div class="filter-group">
    <label>거래 유형</label>
    <div class="filter-chips" id="dealTypeChips">
      <button class="fchip active" data-deal="all">전체</button>
      <button class="fchip" data-deal="sale">매매</button>
      <button class="fchip" data-deal="rent">전세</button>
      <button class="fchip" data-deal="monthly">월세</button>
    </div>
  </div>
  <div class="filter-group">
    <label>가격대 (만원)</label>
    <div class="price-range">
      <input type="number" id="priceMin" placeholder="최소" step="1000">
      <span>~</span>
      <input type="number" id="priceMax" placeholder="최대" step="1000">
    </div>
  </div>
  <div class="filter-group">
    <label>전용면적 (㎡)</label>
    <div class="filter-chips" id="areaChips">
      <button class="fchip active" data-area="all">전체</button>
      <button class="fchip" data-area="small">~33㎡</button>
      <button class="fchip" data-area="mid">33~66㎡</button>
      <button class="fchip" data-area="large">66~99㎡</button>
      <button class="fchip" data-area="xlarge">99㎡~</button>
    </div>
  </div>
  <button class="btn-apply" id="applyFilter">적용</button>
</div>
<main class="listing-grid" id="listingGrid"></main>
<div class="modal-overlay hidden" id="modal">
  <div class="modal-box" id="modalBox"></div>
</div>
<script src="script.js"></script>
</body></html>`;

const REALESTATE_CSS = `:root{--bg:#f5f6f8;--card:#fff;--accent:#1e6fdc;--accent2:#ff5c5c;--text:#222;--sub:#777;--border:#e4e7eb;--radius:12px}*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}body{background:var(--bg);font-family:-apple-system,BlinkMacSystemFont,'Noto Sans KR',sans-serif;color:var(--text);min-height:100vh}
.header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--card);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:100}.logo{font-size:17px;font-weight:700;color:var(--accent)}.header-actions{display:flex;gap:8px}.btn-filter,.btn-fav{padding:6px 12px;border:1px solid var(--border);border-radius:20px;background:var(--card);cursor:pointer;font-size:13px;color:var(--text)}.btn-filter:hover,.btn-fav:hover{border-color:var(--accent);color:var(--accent)}
.search-bar{padding:12px 16px 0;background:var(--card)}.search-bar input{width:100%;padding:10px 14px;border:1.5px solid var(--border);border-radius:8px;font-size:14px;outline:none}.search-bar input:focus{border-color:var(--accent)}.type-tabs{display:flex;gap:6px;margin-top:10px;padding-bottom:12px;overflow-x:auto}.tab{padding:6px 14px;border-radius:20px;border:1.5px solid var(--border);background:transparent;cursor:pointer;font-size:13px;white-space:nowrap;color:var(--sub)}.tab.active{background:var(--accent);color:#fff;border-color:var(--accent)}
.sort-bar{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;background:var(--card);border-bottom:1px solid var(--border);margin-bottom:4px}.result-count{font-size:13px;color:var(--sub)}.sort-bar select{border:none;background:transparent;font-size:13px;color:var(--sub);cursor:pointer;outline:none}
.filter-panel{background:var(--card);padding:16px;border-bottom:2px solid var(--accent);margin-bottom:4px}.filter-group{margin-bottom:14px}.filter-group label{font-size:12px;font-weight:600;color:var(--sub);display:block;margin-bottom:8px}.filter-chips{display:flex;flex-wrap:wrap;gap:6px}.fchip{padding:5px 12px;border-radius:16px;border:1.5px solid var(--border);background:transparent;cursor:pointer;font-size:12px;color:var(--text)}.fchip.active{background:var(--accent);color:#fff;border-color:var(--accent)}.price-range{display:flex;align-items:center;gap:8px}.price-range input{flex:1;padding:7px 10px;border:1.5px solid var(--border);border-radius:7px;font-size:13px;outline:none}.price-range span{color:var(--sub)}.btn-apply{width:100%;padding:11px;background:var(--accent);color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer}
.listing-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px;padding:14px 16px}
.listing-card{background:var(--card);border-radius:var(--radius);overflow:hidden;border:1px solid var(--border);cursor:pointer;transition:box-shadow .2s}.listing-card:hover{box-shadow:0 4px 20px rgba(0,0,0,.1)}.card-img{width:100%;height:160px;background:linear-gradient(135deg,#e3eeff,#c5d8ff);display:flex;align-items:center;justify-content:center;font-size:48px;position:relative}.card-badge{position:absolute;top:8px;left:8px;background:var(--accent);color:#fff;font-size:11px;font-weight:700;padding:3px 8px;border-radius:5px}.card-fav{position:absolute;top:8px;right:8px;background:rgba(255,255,255,.9);border:none;border-radius:50%;width:30px;height:30px;cursor:pointer;font-size:15px;display:flex;align-items:center;justify-content:center}.card-body{padding:12px}.card-price{font-size:17px;font-weight:700;color:var(--accent);margin-bottom:2px}.card-type{font-size:11px;font-weight:600;color:var(--accent2);margin-bottom:6px}.card-name{font-size:14px;font-weight:600;margin-bottom:3px}.card-addr{font-size:12px;color:var(--sub)}.card-meta{display:flex;gap:10px;margin-top:8px;padding-top:8px;border-top:1px solid var(--border)}.card-meta span{font-size:11px;color:var(--sub)}.card-meta strong{font-size:11px;color:var(--text)}
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:200;display:flex;align-items:flex-end;justify-content:center}.modal-overlay.hidden{display:none}.modal-box{background:var(--card);border-radius:var(--radius) var(--radius) 0 0;width:100%;max-width:560px;max-height:85vh;overflow-y:auto;padding:20px}.modal-img{width:100%;height:200px;background:linear-gradient(135deg,#e3eeff,#c5d8ff);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:80px;margin-bottom:16px}.modal-price{font-size:22px;font-weight:700;color:var(--accent);margin-bottom:4px}.modal-deal{font-size:13px;font-weight:600;color:var(--accent2);margin-bottom:10px}.modal-name{font-size:18px;font-weight:700;margin-bottom:4px}.modal-addr{font-size:13px;color:var(--sub);margin-bottom:16px}.modal-info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px}.info-item{background:var(--bg);border-radius:8px;padding:10px}.info-label{font-size:11px;color:var(--sub);margin-bottom:3px}.info-value{font-size:14px;font-weight:600}.modal-desc{font-size:13px;color:#555;line-height:1.7;margin-bottom:16px}.modal-actions{display:flex;gap:10px}.modal-actions button{flex:1;padding:12px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer}.btn-contact{background:var(--accent);color:#fff;border:none}.btn-fav-modal{background:var(--card);color:var(--text);border:1.5px solid var(--border)}.btn-close-modal{position:sticky;top:0;float:right;background:none;border:none;font-size:20px;cursor:pointer;color:var(--sub);line-height:1}
.hidden{display:none!important}@media(max-width:480px){.listing-grid{grid-template-columns:1fr;padding:10px}.card-img{height:140px}}`;

const REALESTATE_JS = `// NOTE: buildPreview() wraps this in DOMContentLoaded — do NOT add another wrapper
var LISTINGS = [
  {id:1,type:"apt",deal:"sale",name:"래미안 퍼스티지",addr:"서울 서초구 반포동",area:84.9,floor:"12/25층",year:2009,price:1850000,monthly:0,deposit:0,rooms:"3룸",desc:"조용한 단지, 남향 84㎡. 한강 뷰, 초등학교 도보 2분. 최근 리모델링 완료.",icon:"🏢",badge:"매매"},
  {id:2,type:"apt",deal:"rent",name:"힐스테이트 역삼",addr:"서울 강남구 역삼동",area:59.4,floor:"8/20층",year:2015,price:80000,monthly:0,deposit:80000,rooms:"2룸",desc:"강남역 도보 5분. 풀옵션, 주차 1대. 햇볕 잘 드는 동향 59㎡.",icon:"🏗️",badge:"전세"},
  {id:3,type:"office",deal:"monthly",name:"서울숲 오피스텔",addr:"서울 성동구 성수동",area:33.1,floor:"5/15층",year:2020,price:500,monthly:500,deposit:2000,rooms:"1룸",desc:"서울숲 5분 거리. 세탁기/냉장고/에어컨 풀옵션. 주변 카페 밀집.",icon:"🏬",badge:"월세"},
  {id:4,type:"villa",deal:"sale",name:"마포 빌라",addr:"서울 마포구 합정동",area:66.1,floor:"2/4층",year:2005,price:42000,monthly:0,deposit:0,rooms:"3룸",desc:"합정역 도보 7분, 조용한 골목길. 실거주 최적, 주차 1대.",icon:"🏘️",badge:"매매"},
  {id:5,type:"apt",deal:"sale",name:"은마아파트",addr:"서울 강남구 대치동",area:76.8,floor:"7/14층",year:1979,price:200000,monthly:0,deposit:0,rooms:"3룸",desc:"대치동 학원가 최근거리. 리모델링 예정 구역 포함 가능성.",icon:"🏢",badge:"매매"},
  {id:6,type:"house",deal:"rent",name:"용산 단독주택",addr:"서울 용산구 후암동",area:120.0,floor:"1/2층",year:1990,price:50000,monthly:0,deposit:50000,rooms:"4룸",desc:"마당 있는 2층 단독주택. 조용하고 햇볕 잘 드는 남향. 반려동물 가능.",icon:"🏡",badge:"전세"},
  {id:7,type:"office",deal:"sale",name:"판교 오피스텔",addr:"경기 성남시 분당구 판교동",area:49.5,floor:"10/22층",year:2018,price:62000,monthly:0,deposit:0,rooms:"1.5룸",desc:"판교역 도보 3분. IT 기업 밀집. 수익형 투자 또는 실거주 모두 가능.",icon:"🏬",badge:"매매"},
  {id:8,type:"apt",deal:"monthly",name:"송파 파크리오",addr:"서울 송파구 신천동",area:114.9,floor:"15/35층",year:2008,price:200,monthly:200,deposit:20000,rooms:"4룸",desc:"잠실역 도보 5분. 한강 조망, 롯데월드몰 인근. 넓은 주방.",icon:"🏢",badge:"월세"},
  {id:9,type:"villa",deal:"rent",name:"홍대 빌라",addr:"서울 마포구 서교동",area:39.6,floor:"3/5층",year:2010,price:20000,monthly:0,deposit:20000,rooms:"2룸",desc:"홍대입구역 5분. 상권 인접, 젊은층 선호 지역. 채광 좋은 남서향.",icon:"🏘️",badge:"전세"},
  {id:10,type:"apt",deal:"sale",name:"반포 아크로리버파크",addr:"서울 서초구 반포동",area:99.7,floor:"20/38층",year:2016,price:400000,monthly:0,deposit:0,rooms:"4룸",desc:"한강변 최고 브랜드 아파트. 반포한강공원 도보 1분. 고층 한강뷰.",icon:"🏢",badge:"매매"},
  {id:11,type:"house",deal:"monthly",name:"성북 빌라주택",addr:"서울 성북구 삼선동",area:82.6,floor:"1/3층",year:2000,price:100,monthly:100,deposit:5000,rooms:"3룸",desc:"조용한 주택가. 지하철 2분. 마당 딸린 단독주택형 빌라.",icon:"🏡",badge:"월세"},
  {id:12,type:"office",deal:"rent",name:"강남 역세권 오피스텔",addr:"서울 강남구 삼성동",area:27.2,floor:"7/18층",year:2021,price:40000,monthly:0,deposit:40000,rooms:"원룸",desc:"삼성역 초역세권. 신축 오피스텔. 풀옵션, 헬스장 공용. 혼자 살기 최적.",icon:"🏬",badge:"전세"},
];
var favorites = JSON.parse(localStorage.getItem("re_favs")||"[]");
var activeType = "all", activeDeal = "all", activeArea = "all", sortBy = "recent";
var priceMin = 0, priceMax = Infinity, searchTerm = "";

function formatPrice(p, deal) {
  if (deal === "monthly") return (p >= 10000 ? (p/10000).toFixed(1)+"억" : p.toLocaleString()+"만") + "/월";
  if (p >= 10000) return (p/10000 % 1 === 0 ? p/10000 : (p/10000).toFixed(1)) + "억";
  return p.toLocaleString() + "만";
}
function filterListings() {
  return LISTINGS.filter(l => {
    if (activeType !== "all" && l.type !== activeType) return false;
    if (activeDeal !== "all" && l.deal !== activeDeal) return false;
    if (activeArea !== "all") {
      if (activeArea === "small" && l.area >= 33) return false;
      if (activeArea === "mid" && (l.area < 33 || l.area >= 66)) return false;
      if (activeArea === "large" && (l.area < 66 || l.area >= 99)) return false;
      if (activeArea === "xlarge" && l.area < 99) return false;
    }
    if (l.price < priceMin || l.price > priceMax) return false;
    if (searchTerm && !l.name.includes(searchTerm) && !l.addr.includes(searchTerm)) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === "price-asc") return a.price - b.price;
    if (sortBy === "price-desc") return b.price - a.price;
    if (sortBy === "area-desc") return b.area - a.area;
    return b.id - a.id;
  });
}
function isFav(id) { return favorites.includes(id); }
function toggleFav(id) {
  if (isFav(id)) favorites = favorites.filter(f => f !== id);
  else favorites.push(id);
  localStorage.setItem("re_favs", JSON.stringify(favorites));
  document.getElementById("favCount").textContent = favorites.length;
}
function renderGrid() {
  var list = filterListings();
  var grid = document.getElementById("listingGrid");
  document.getElementById("resultCount").textContent = "매물 " + list.length + "개";
  grid.innerHTML = list.map(l => \`
    <div class="listing-card" data-id="\${l.id}" onclick="openModal(\${l.id})">
      <div class="card-img">
        <span class="card-badge">\${l.badge}</span>
        <button class="card-fav \${isFav(l.id)?"fav-on":""}" onclick="event.stopPropagation();toggleFav(\${l.id});renderGrid();">\${isFav(l.id)?"❤️":"🤍"}</button>
        \${l.icon}
      </div>
      <div class="card-body">
        <div class="card-price">\${formatPrice(l.price, l.deal)}</div>
        <div class="card-type">\${l.badge} · \${l.type==="apt"?"아파트":l.type==="villa"?"빌라":l.type==="office"?"오피스텔":"단독주택"}</div>
        <div class="card-name">\${l.name}</div>
        <div class="card-addr">📍 \${l.addr}</div>
        <div class="card-meta">
          <span>면적 <strong>\${l.area}㎡</strong></span>
          <span>층 <strong>\${l.floor}</strong></span>
          <span>준공 <strong>\${l.year}년</strong></span>
        </div>
      </div>
    </div>
  \`).join("");
  document.getElementById("favCount").textContent = favorites.length;
}
function openModal(id) {
  var l = LISTINGS.find(x => x.id === id);
  if (!l) return;
  var box = document.getElementById("modalBox");
  box.innerHTML = \`
    <button class="btn-close-modal" onclick="closeModal()">✕</button>
    <div class="modal-img">\${l.icon}</div>
    <div class="modal-price">\${formatPrice(l.price, l.deal)}</div>
    <div class="modal-deal">\${l.badge}</div>
    <div class="modal-name">\${l.name}</div>
    <div class="modal-addr">📍 \${l.addr}</div>
    <div class="modal-info-grid">
      <div class="info-item"><div class="info-label">전용면적</div><div class="info-value">\${l.area}㎡</div></div>
      <div class="info-item"><div class="info-label">층</div><div class="info-value">\${l.floor}</div></div>
      <div class="info-item"><div class="info-label">준공년도</div><div class="info-value">\${l.year}년</div></div>
      <div class="info-item"><div class="info-label">방 구성</div><div class="info-value">\${l.rooms}</div></div>
    </div>
    <div class="modal-desc">\${l.desc}</div>
    <div class="modal-actions">
      <button class="btn-contact">📞 문의하기</button>
      <button class="btn-fav-modal" onclick="toggleFav(\${l.id});this.textContent=isFav(\${l.id})?\\'❤️ 찜됨\\':\\'🤍 찜하기\\'">\${isFav(l.id)?"❤️ 찜됨":"🤍 찜하기"}</button>
    </div>
  \`;
  document.getElementById("modal").classList.remove("hidden");
}
function closeModal() { document.getElementById("modal").classList.add("hidden"); }

document.getElementById("modal").addEventListener("click", function(e) {
  if (e.target === this) closeModal();
});
document.getElementById("searchInput").addEventListener("input", function() {
  searchTerm = this.value.trim();
  renderGrid();
});
document.getElementById("sortSelect").addEventListener("change", function() {
  sortBy = this.value;
  renderGrid();
});
document.getElementById("filterBtn").addEventListener("click", function() {
  document.getElementById("filterPanel").classList.toggle("hidden");
});
document.querySelectorAll(".tab").forEach(function(btn) {
  btn.addEventListener("click", function() {
    document.querySelectorAll(".tab").forEach(function(b){ b.classList.remove("active"); });
    this.classList.add("active");
    activeType = this.dataset.type;
    renderGrid();
  });
});
document.querySelectorAll("#dealTypeChips .fchip").forEach(function(btn) {
  btn.addEventListener("click", function() {
    document.querySelectorAll("#dealTypeChips .fchip").forEach(function(b){ b.classList.remove("active"); });
    this.classList.add("active");
    activeDeal = this.dataset.deal;
  });
});
document.querySelectorAll("#areaChips .fchip").forEach(function(btn) {
  btn.addEventListener("click", function() {
    document.querySelectorAll("#areaChips .fchip").forEach(function(b){ b.classList.remove("active"); });
    this.classList.add("active");
    activeArea = this.dataset.area;
  });
});
document.getElementById("applyFilter").addEventListener("click", function() {
  var mn = parseInt(document.getElementById("priceMin").value) || 0;
  var mx = parseInt(document.getElementById("priceMax").value) || Infinity;
  priceMin = mn * 10000;
  priceMax = mx * 10000;
  document.getElementById("filterPanel").classList.add("hidden");
  renderGrid();
});
document.getElementById("favBtn").addEventListener("click", function() {
  var favList = LISTINGS.filter(l => isFav(l.id));
  var box = document.getElementById("modalBox");
  if (favList.length === 0) { alert("찜한 매물이 없습니다."); return; }
  box.innerHTML = \`<button class="btn-close-modal" onclick="closeModal()">✕</button><h3 style="margin-bottom:14px;">❤️ 찜한 매물 \${favList.length}개</h3>\` +
    favList.map(l => \`<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #eee;">
      <div style="font-size:28px">\${l.icon}</div>
      <div><div style="font-weight:700;font-size:14px">\${l.name}</div><div style="font-size:12px;color:#777">\${l.addr}</div><div style="font-size:13px;color:#1e6fdc;font-weight:700">\${formatPrice(l.price,l.deal)}</div></div>
    </div>\`).join("");
  document.getElementById("modal").classList.remove("hidden");
});
renderGrid();`;

// ══════════════════════════════════════════════════════════════
// 2. 독서 기록 앱 (책 리뷰 + 독서 목표)
// ══════════════════════════════════════════════════════════════
const BOOKLOG_HTML = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>📖 독서 기록</title><link rel="stylesheet" href="style.css"></head>
<body>
<header class="header">
  <div class="logo">📖 독서 노트</div>
  <button class="btn-add" id="btnAdd">+ 책 추가</button>
</header>
<div class="progress-bar-wrap">
  <div class="progress-info">
    <span>📅 2024년 독서 목표</span>
    <span id="progressLabel">0 / 12권</span>
  </div>
  <div class="progress-track"><div class="progress-fill" id="progressFill" style="width:0%"></div></div>
</div>
<div class="status-tabs">
  <button class="stab active" data-s="all">전체</button>
  <button class="stab" data-s="reading">읽는 중</button>
  <button class="stab" data-s="done">완독</button>
  <button class="stab" data-s="wish">읽고 싶어요</button>
</div>
<div class="stats-row" id="statsRow"></div>
<main class="book-list" id="bookList"></main>
<div class="modal-overlay hidden" id="modal">
  <div class="modal-box">
    <h3 id="modalTitle">책 추가</h3>
    <label>제목 *<input id="f_title" placeholder="책 제목"></label>
    <label>저자<input id="f_author" placeholder="저자명"></label>
    <label>장르
      <select id="f_genre"><option value="소설">소설</option><option value="자기계발">자기계발</option><option value="경제/경영">경제/경영</option><option value="과학/기술">과학/기술</option><option value="역사">역사</option><option value="철학">철학</option><option value="에세이">에세이</option><option value="기타">기타</option></select>
    </label>
    <label>상태
      <select id="f_status"><option value="wish">읽고 싶어요</option><option value="reading">읽는 중</option><option value="done">완독</option></select>
    </label>
    <label>별점 (완독 시)
      <div class="star-input" id="starInput">
        <span class="star" data-v="1">★</span><span class="star" data-v="2">★</span><span class="star" data-v="3">★</span><span class="star" data-v="4">★</span><span class="star" data-v="5">★</span>
      </div>
    </label>
    <label>한줄평<input id="f_note" placeholder="기억에 남는 문장이나 감상..."></label>
    <div class="modal-actions">
      <button id="btnSave">저장</button>
      <button id="btnCancel" class="btn-secondary">취소</button>
    </div>
  </div>
</div>
<script src="script.js"></script>
</body></html>`;

const BOOKLOG_CSS = `:root{--bg:#fdf8f3;--card:#fff;--accent:#e8612f;--text:#2d2d2d;--sub:#888;--border:#ecddd0;--reading:#2196f3;--done:#43a047;--wish:#9e9e9e}*{margin:0;padding:0;box-sizing:border-box}body{background:var(--bg);font-family:-apple-system,BlinkMacSystemFont,'Noto Sans KR',sans-serif;color:var(--text);min-height:100vh}
.header{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:var(--card);border-bottom:1px solid var(--border)}.logo{font-size:17px;font-weight:700;color:var(--accent)}.btn-add{padding:8px 16px;background:var(--accent);color:#fff;border:none;border-radius:20px;cursor:pointer;font-size:13px;font-weight:600}
.progress-bar-wrap{background:var(--card);padding:12px 16px;border-bottom:1px solid var(--border)}.progress-info{display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px;color:var(--sub)}.progress-track{height:8px;background:#f0e5d8;border-radius:4px;overflow:hidden}.progress-fill{height:100%;background:linear-gradient(90deg,var(--accent),#f4975a);border-radius:4px;transition:width .4s}
.status-tabs{display:flex;padding:10px 16px;gap:8px;background:var(--card);border-bottom:1px solid var(--border)}.stab{padding:6px 14px;border-radius:16px;border:1.5px solid var(--border);background:transparent;cursor:pointer;font-size:13px;color:var(--sub)}.stab.active{background:var(--accent);color:#fff;border-color:var(--accent)}
.stats-row{display:flex;gap:12px;padding:12px 16px;overflow-x:auto}.stat-chip{background:var(--card);border:1px solid var(--border);border-radius:10px;padding:10px 16px;text-align:center;min-width:90px;flex-shrink:0}.stat-chip .num{font-size:20px;font-weight:700;color:var(--accent)}.stat-chip .label{font-size:11px;color:var(--sub);margin-top:2px}
.book-list{padding:14px 16px;display:flex;flex-direction:column;gap:10px}
.book-card{background:var(--card);border-radius:12px;border:1px solid var(--border);padding:14px;display:flex;gap:14px}.book-emoji{font-size:40px;line-height:1;flex-shrink:0}.book-info{flex:1;min-width:0}.book-title{font-size:15px;font-weight:700;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.book-author{font-size:12px;color:var(--sub);margin-bottom:6px}.book-tags{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px}.book-tag{font-size:10px;padding:2px 8px;border-radius:10px;font-weight:600}.tag-reading{background:#e3f2fd;color:var(--reading)}.tag-done{background:#e8f5e9;color:var(--done)}.tag-wish{background:#f5f5f5;color:var(--wish)}.stars{color:#f4b400;font-size:14px}.book-note{font-size:12px;color:#666;margin-top:4px;line-height:1.5;font-style:italic}.book-actions{display:flex;flex-direction:column;gap:6px;flex-shrink:0}.book-actions button{border:none;background:none;cursor:pointer;font-size:18px;opacity:.6}.book-actions button:hover{opacity:1}
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:100;display:flex;align-items:center;justify-content:center;padding:16px}.modal-overlay.hidden{display:none}.modal-box{background:var(--card);border-radius:14px;padding:20px;width:100%;max-width:420px;max-height:90vh;overflow-y:auto}.modal-box h3{font-size:16px;font-weight:700;margin-bottom:14px}.modal-box label{display:block;font-size:12px;font-weight:600;color:var(--sub);margin-bottom:10px}.modal-box input,.modal-box select{width:100%;padding:9px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:14px;margin-top:4px;outline:none;background:var(--bg)}.modal-box input:focus,.modal-box select:focus{border-color:var(--accent)}.star-input{display:flex;gap:4px;margin-top:6px}.star{font-size:24px;cursor:pointer;color:#ddd;transition:color .15s}.star.on{color:#f4b400}.modal-actions{display:flex;gap:8px;margin-top:14px}.modal-actions button{flex:1;padding:11px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;border:none;background:var(--accent);color:#fff}.btn-secondary{background:var(--bg)!important;color:var(--text)!important;border:1.5px solid var(--border)!important}
.hidden{display:none!important}`;

const BOOKLOG_JS = `// NOTE: buildPreview() wraps this in DOMContentLoaded — do NOT add another wrapper
var GOAL = 12;
var GENRES_EMOJI = {"소설":"📗","자기계발":"💪","경제/경영":"💰","과학/기술":"🔬","역사":"🏛️","철학":"🤔","에세이":"✍️","기타":"📚"};
var books = JSON.parse(localStorage.getItem("bl_books")||"null") || [
  {id:1,title:"아몬드",author:"손원평",genre:"소설",status:"done",rating:5,note:"감정을 모르는 주인공이 오히려 더 많은 걸 느끼게 해줬다."},
  {id:2,title:"원씽",author:"게리 켈러",genre:"자기계발",status:"done",rating:4,note:"한 가지에 집중하는 것이 얼마나 강력한지 깨달았다."},
  {id:3,title:"코스모스",author:"칼 세이건",genre:"과학/기술",status:"reading",rating:0,note:""},
  {id:4,title:"돈의 속성",author:"김승호",genre:"경제/경영",status:"wish",rating:0,note:""},
];
var nextId = 5, activeStatus = "all", editId = null, selectedRating = 0;

function save() { localStorage.setItem("bl_books", JSON.stringify(books)); }
function getFiltered() { return activeStatus === "all" ? books : books.filter(b => b.status === activeStatus); }
function renderStats() {
  var done = books.filter(b => b.status === "done").length;
  var reading = books.filter(b => b.status === "reading").length;
  var wish = books.filter(b => b.status === "wish").length;
  var avg = books.filter(b => b.rating > 0).reduce((s,b) => s+b.rating, 0) / (books.filter(b=>b.rating>0).length||1);
  document.getElementById("statsRow").innerHTML =
    '<div class="stat-chip"><div class="num">'+done+'</div><div class="label">완독</div></div>'+
    '<div class="stat-chip"><div class="num">'+reading+'</div><div class="label">읽는 중</div></div>'+
    '<div class="stat-chip"><div class="num">'+wish+'</div><div class="label">읽고 싶어요</div></div>'+
    '<div class="stat-chip"><div class="num">'+avg.toFixed(1)+'</div><div class="label">평균 별점</div></div>';
  var pct = Math.min(100, Math.round(done/GOAL*100));
  document.getElementById("progressFill").style.width = pct+"%";
  document.getElementById("progressLabel").textContent = done+" / "+GOAL+"권 ("+pct+"%)";
}
function renderList() {
  var list = getFiltered();
  var el = document.getElementById("bookList");
  if (!list.length) { el.innerHTML = '<p style="text-align:center;padding:40px;color:var(--sub)">책이 없어요. + 버튼으로 추가하세요!</p>'; return; }
  el.innerHTML = list.map(b => {
    var tagCls = b.status==="reading"?"tag-reading":b.status==="done"?"tag-done":"tag-wish";
    var tagLabel = b.status==="reading"?"읽는 중":b.status==="done"?"완독":"읽고 싶어요";
    var stars = b.rating > 0 ? '<div class="stars">'+"★".repeat(b.rating)+"☆".repeat(5-b.rating)+'</div>' : "";
    return '<div class="book-card">'+
      '<div class="book-emoji">'+(GENRES_EMOJI[b.genre]||"📚")+'</div>'+
      '<div class="book-info">'+
        '<div class="book-title">'+b.title+'</div>'+
        '<div class="book-author">'+b.author+'</div>'+
        '<div class="book-tags"><span class="book-tag '+tagCls+'">'+tagLabel+'</span><span class="book-tag" style="background:#f5f5f5;color:#888">'+b.genre+'</span></div>'+
        stars+
        (b.note ? '<div class="book-note">"'+b.note+'"</div>' : '')+
      '</div>'+
      '<div class="book-actions">'+
        '<button onclick="openEdit('+b.id+')" title="수정">✏️</button>'+
        '<button onclick="deleteBook('+b.id+')" title="삭제">🗑️</button>'+
      '</div>'+
    '</div>';
  }).join("");
}
function render() { renderStats(); renderList(); }
function openAdd() {
  editId = null; selectedRating = 0;
  document.getElementById("modalTitle").textContent = "책 추가";
  document.getElementById("f_title").value = "";
  document.getElementById("f_author").value = "";
  document.getElementById("f_genre").value = "소설";
  document.getElementById("f_status").value = "wish";
  document.getElementById("f_note").value = "";
  updateStars(0);
  document.getElementById("modal").classList.remove("hidden");
}
function openEdit(id) {
  var b = books.find(x => x.id === id); if (!b) return;
  editId = id; selectedRating = b.rating;
  document.getElementById("modalTitle").textContent = "책 수정";
  document.getElementById("f_title").value = b.title;
  document.getElementById("f_author").value = b.author;
  document.getElementById("f_genre").value = b.genre;
  document.getElementById("f_status").value = b.status;
  document.getElementById("f_note").value = b.note;
  updateStars(b.rating);
  document.getElementById("modal").classList.remove("hidden");
}
function deleteBook(id) {
  books = books.filter(b => b.id !== id);
  save(); render();
}
function updateStars(v) {
  document.querySelectorAll(".star").forEach(function(s,i){ s.classList.toggle("on", i < v); });
}
document.querySelectorAll(".star").forEach(function(s) {
  s.addEventListener("click", function() {
    selectedRating = parseInt(this.dataset.v);
    updateStars(selectedRating);
  });
});
document.getElementById("btnAdd").addEventListener("click", openAdd);
document.getElementById("btnCancel").addEventListener("click", function(){ document.getElementById("modal").classList.add("hidden"); });
document.getElementById("btnSave").addEventListener("click", function() {
  var title = document.getElementById("f_title").value.trim();
  if (!title) { alert("제목을 입력하세요."); return; }
  var data = { title:title, author:document.getElementById("f_author").value.trim(), genre:document.getElementById("f_genre").value, status:document.getElementById("f_status").value, rating:selectedRating, note:document.getElementById("f_note").value.trim() };
  if (editId) { var i = books.findIndex(b => b.id === editId); if (i>=0) books[i] = Object.assign({id:editId},data); }
  else { data.id = nextId++; books.push(data); }
  save(); document.getElementById("modal").classList.add("hidden"); render();
});
document.querySelectorAll(".stab").forEach(function(btn) {
  btn.addEventListener("click", function() {
    document.querySelectorAll(".stab").forEach(function(b){ b.classList.remove("active"); });
    this.classList.add("active");
    activeStatus = this.dataset.s;
    renderList();
  });
});
render();`;

// ══════════════════════════════════════════════════════════════
// 3. 식단 관리 앱
// ══════════════════════════════════════════════════════════════
const MEALPLAN_HTML = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>🥗 식단 관리</title><link rel="stylesheet" href="style.css"></head>
<body>
<header class="header">
  <div class="logo">🥗 식단 관리</div>
  <div class="date-nav">
    <button id="prevDay">◀</button>
    <span id="dateLabel"></span>
    <button id="nextDay">▶</button>
  </div>
</header>
<div class="goal-bar">
  <div class="goal-info">
    <span>🎯 목표 칼로리</span>
    <input type="number" id="goalInput" value="2000" min="1000" max="4000" step="100"> kcal
  </div>
  <div class="progress-wrap">
    <div class="progress-track"><div class="progress-fill" id="calFill" style="width:0%"></div></div>
    <span id="calLabel">0 / 2000 kcal</span>
  </div>
</div>
<div class="meals-grid" id="mealsGrid"></div>
<div class="nutrition-summary" id="nutritionSummary"></div>
<div class="modal-overlay hidden" id="modal">
  <div class="modal-box">
    <h3 id="modalTitle">음식 추가</h3>
    <label>음식 이름 *<input id="f_name" placeholder="예: 닭가슴살 샐러드"></label>
    <label>칼로리 (kcal) *<input id="f_cal" type="number" placeholder="0" min="0"></label>
    <div class="macro-row">
      <label>탄수화물(g)<input id="f_carb" type="number" placeholder="0" min="0"></label>
      <label>단백질(g)<input id="f_prot" type="number" placeholder="0" min="0"></label>
      <label>지방(g)<input id="f_fat" type="number" placeholder="0" min="0"></label>
    </div>
    <div class="modal-actions">
      <button id="btnSave">저장</button>
      <button id="btnCancel" class="btn-secondary">취소</button>
    </div>
  </div>
</div>
<script src="script.js"></script>
</body></html>`;

const MEALPLAN_CSS = `:root{--bg:#f0fdf4;--card:#fff;--accent:#22c55e;--accent2:#16a34a;--text:#1a2e1a;--sub:#6b8f6b;--border:#d1fae5;--warn:#f59e0b;--danger:#ef4444}*{margin:0;padding:0;box-sizing:border-box}body{background:var(--bg);font-family:-apple-system,BlinkMacSystemFont,'Noto Sans KR',sans-serif;color:var(--text);min-height:100vh}
.header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--card);border-bottom:2px solid var(--border)}.logo{font-size:17px;font-weight:700;color:var(--accent2)}.date-nav{display:flex;align-items:center;gap:10px}.date-nav button{width:28px;height:28px;border-radius:50%;border:1px solid var(--border);background:var(--bg);cursor:pointer;font-size:14px}.date-nav span{font-size:13px;font-weight:600;min-width:100px;text-align:center}
.goal-bar{background:var(--card);padding:12px 16px;border-bottom:1px solid var(--border)}.goal-info{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--sub);margin-bottom:8px}.goal-info input{width:70px;padding:3px 6px;border:1.5px solid var(--border);border-radius:6px;font-size:13px;font-weight:700;color:var(--accent2);outline:none;text-align:center}.progress-wrap{display:flex;align-items:center;gap:10px}.progress-track{flex:1;height:10px;background:#dcfce7;border-radius:5px;overflow:hidden}.progress-fill{height:100%;background:linear-gradient(90deg,var(--accent),var(--accent2));border-radius:5px;transition:width .4s}.progress-fill.over{background:linear-gradient(90deg,var(--warn),var(--danger))}.progress-wrap span{font-size:12px;font-weight:700;color:var(--accent2);min-width:110px;text-align:right}
.meals-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;padding:14px 16px}
.meal-card{background:var(--card);border-radius:12px;border:1px solid var(--border);overflow:hidden}.meal-header{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-bottom:1px solid var(--border)}.meal-title{font-size:13px;font-weight:700;color:var(--accent2)}.meal-cal{font-size:11px;color:var(--sub)}.btn-add-food{padding:4px 10px;border-radius:20px;border:1.5px solid var(--accent);background:transparent;color:var(--accent);font-size:11px;font-weight:700;cursor:pointer}.btn-add-food:hover{background:var(--accent);color:#fff}.food-list{padding:8px}.food-item{display:flex;align-items:center;justify-content:space-between;padding:6px 4px;border-bottom:1px solid #f0fdf4;font-size:12px}.food-item:last-child{border-bottom:none}.food-name{flex:1;font-weight:500}.food-kcal{color:var(--sub);font-size:11px}.btn-del{background:none;border:none;cursor:pointer;color:#ccc;font-size:14px;padding:0 4px}.btn-del:hover{color:var(--danger)}.empty-tip{padding:12px;text-align:center;font-size:11px;color:#bbb}
.nutrition-summary{background:var(--card);border-top:2px solid var(--border);padding:14px 16px}.nutrition-summary h4{font-size:13px;font-weight:700;color:var(--sub);margin-bottom:12px}.macro-bars{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.macro-item{text-align:center}.macro-label{font-size:11px;color:var(--sub);margin-bottom:4px}.macro-track{height:6px;background:#f0f0f0;border-radius:3px;margin-bottom:4px;overflow:hidden}.macro-fill{height:100%;border-radius:3px;transition:width .4s}.macro-fill.carb{background:#6366f1}.macro-fill.prot{background:#22c55e}.macro-fill.fat{background:#f59e0b}.macro-val{font-size:12px;font-weight:700}
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:100;display:flex;align-items:center;justify-content:center;padding:16px}.modal-overlay.hidden{display:none}.modal-box{background:var(--card);border-radius:14px;padding:20px;width:100%;max-width:380px}.modal-box h3{font-size:15px;font-weight:700;margin-bottom:14px}.modal-box label{display:block;font-size:12px;font-weight:600;color:var(--sub);margin-bottom:10px}.modal-box input{width:100%;padding:8px 10px;border:1.5px solid var(--border);border-radius:7px;font-size:13px;margin-top:4px;outline:none}.macro-row{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.modal-actions{display:flex;gap:8px;margin-top:14px}.modal-actions button{flex:1;padding:10px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;border:none;background:var(--accent);color:#fff}.btn-secondary{background:#f3f4f6!important;color:var(--text)!important;border:1.5px solid var(--border)!important}
.hidden{display:none!important}@media(max-width:480px){.meals-grid{grid-template-columns:1fr}}`;

const MEALPLAN_JS = `// NOTE: buildPreview() wraps this in DOMContentLoaded — do NOT add another wrapper
var MEALS = ["아침", "점심", "저녁", "간식"];
var MEAL_ICONS = ["☀️", "🌞", "🌙", "🍪"];
var today = new Date(); today.setHours(0,0,0,0);
var currentDate = new Date(today);
var goal = 2000;
var data = JSON.parse(localStorage.getItem("mp_data")||"{}");
var addingMeal = null;

function dateKey(d) { return d.toISOString().slice(0,10); }
function getDayData(d) {
  var k = dateKey(d);
  if (!data[k]) data[k] = { meals: { "아침":[], "점심":[], "저녁":[], "간식":[] } };
  return data[k];
}
function save() { localStorage.setItem("mp_data", JSON.stringify(data)); }
function getTotals(d) {
  var dd = getDayData(d);
  var cal=0,carb=0,prot=0,fat=0;
  MEALS.forEach(function(m){ (dd.meals[m]||[]).forEach(function(f){ cal+=f.cal||0; carb+=f.carb||0; prot+=f.prot||0; fat+=f.fat||0; }); });
  return { cal,carb,prot,fat };
}
function renderDate() {
  var opts = { month:"long", day:"numeric", weekday:"short" };
  document.getElementById("dateLabel").textContent = currentDate.toLocaleDateString("ko-KR", opts);
}
function renderGoalBar() {
  var t = getTotals(currentDate);
  var pct = Math.min(110, Math.round(t.cal/goal*100));
  var fill = document.getElementById("calFill");
  fill.style.width = Math.min(100,pct)+"%";
  fill.className = "progress-fill" + (t.cal > goal ? " over" : "");
  document.getElementById("calLabel").textContent = t.cal+" / "+goal+" kcal";
}
function renderMeals() {
  var dd = getDayData(currentDate);
  document.getElementById("mealsGrid").innerHTML = MEALS.map(function(m, i) {
    var foods = dd.meals[m] || [];
    var mCal = foods.reduce(function(s,f){ return s+f.cal; }, 0);
    return '<div class="meal-card">'+
      '<div class="meal-header">'+
        '<div class="meal-title">'+MEAL_ICONS[i]+' '+m+'</div>'+
        '<div style="display:flex;align-items:center;gap:8px">'+
          '<span class="meal-cal">'+mCal+'kcal</span>'+
          '<button class="btn-add-food" onclick="openAdd(\''+m+'\')">+ 추가</button>'+
        '</div>'+
      '</div>'+
      '<div class="food-list">'+
        (foods.length ? foods.map(function(f,fi){
          return '<div class="food-item">'+
            '<span class="food-name">'+f.name+'</span>'+
            '<span class="food-kcal">'+f.cal+'kcal</span>'+
            '<button class="btn-del" onclick="delFood(\''+m+'\','+fi+')">×</button>'+
          '</div>';
        }).join("") : '<div class="empty-tip">+ 추가를 눌러 음식을 기록하세요</div>')+
      '</div>'+
    '</div>';
  }).join("");
}
function renderNutrition() {
  var t = getTotals(currentDate);
  var total = (t.carb+t.prot+t.fat)||1;
  var carbPct=Math.round(t.carb/total*100), protPct=Math.round(t.prot/total*100), fatPct=Math.round(t.fat/total*100);
  document.getElementById("nutritionSummary").innerHTML =
    '<h4>📊 오늘 영양소 합계</h4>'+
    '<div class="macro-bars">'+
      '<div class="macro-item"><div class="macro-label">탄수화물</div><div class="macro-track"><div class="macro-fill carb" style="width:'+carbPct+'%"></div></div><div class="macro-val" style="color:#6366f1">'+t.carb+'g</div></div>'+
      '<div class="macro-item"><div class="macro-label">단백질</div><div class="macro-track"><div class="macro-fill prot" style="width:'+protPct+'%"></div></div><div class="macro-val" style="color:#22c55e">'+t.prot+'g</div></div>'+
      '<div class="macro-item"><div class="macro-label">지방</div><div class="macro-track"><div class="macro-fill fat" style="width:'+fatPct+'%"></div></div><div class="macro-val" style="color:#f59e0b">'+t.fat+'g</div></div>'+
    '</div>';
}
function render() { renderDate(); renderGoalBar(); renderMeals(); renderNutrition(); }
function openAdd(meal) {
  addingMeal = meal;
  document.getElementById("modalTitle").textContent = meal+" 음식 추가";
  ["f_name","f_cal","f_carb","f_prot","f_fat"].forEach(function(id){ document.getElementById(id).value=""; });
  document.getElementById("modal").classList.remove("hidden");
  document.getElementById("f_name").focus();
}
function delFood(meal, idx) {
  var dd = getDayData(currentDate);
  dd.meals[meal].splice(idx,1);
  save(); render();
}
document.getElementById("btnSave").addEventListener("click", function() {
  var name = document.getElementById("f_name").value.trim();
  var cal = parseInt(document.getElementById("f_cal").value)||0;
  if (!name) { alert("음식 이름을 입력하세요."); return; }
  var dd = getDayData(currentDate);
  dd.meals[addingMeal].push({ name, cal, carb:parseInt(document.getElementById("f_carb").value)||0, prot:parseInt(document.getElementById("f_prot").value)||0, fat:parseInt(document.getElementById("f_fat").value)||0 });
  save(); document.getElementById("modal").classList.add("hidden"); render();
});
document.getElementById("btnCancel").addEventListener("click", function(){ document.getElementById("modal").classList.add("hidden"); });
document.getElementById("prevDay").addEventListener("click", function(){ currentDate.setDate(currentDate.getDate()-1); render(); });
document.getElementById("nextDay").addEventListener("click", function(){ currentDate.setDate(currentDate.getDate()+1); render(); });
document.getElementById("goalInput").addEventListener("change", function(){ goal=parseInt(this.value)||2000; renderGoalBar(); });
render();`;

// ══════════════════════════════════════════════════════════════
// 4. 도시락 주문 앱
// ══════════════════════════════════════════════════════════════
const BENTO_HTML = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>🍱 도시락 주문</title><link rel="stylesheet" href="style.css"></head>
<body>
<header class="header">
  <div class="logo">🍱 도시락 주문</div>
  <button class="cart-btn" id="cartBtn">🛒 <span id="cartCount">0</span> <span id="cartTotal">₩0</span></button>
</header>
<div class="filter-bar">
  <button class="ftab active" data-cat="all">전체</button>
  <button class="ftab" data-cat="classic">클래식</button>
  <button class="ftab" data-cat="diet">다이어트</button>
  <button class="ftab" data-cat="premium">프리미엄</button>
  <button class="ftab" data-cat="vegan">비건</button>
</div>
<div class="delivery-info">
  <span>🚴 오늘 11:30 마감 · 12:00 배달</span>
  <span id="countdown" class="countdown"></span>
</div>
<main class="menu-grid" id="menuGrid"></main>
<div class="cart-overlay hidden" id="cartOverlay">
  <div class="cart-panel">
    <div class="cart-header"><h3>🛒 장바구니</h3><button id="cartClose">✕</button></div>
    <div class="cart-items" id="cartItems"></div>
    <div class="cart-footer">
      <div class="cart-subtotal"><span>소계</span><span id="subtotal">₩0</span></div>
      <div class="cart-subtotal"><span>배달비</span><span>₩2,000</span></div>
      <div class="cart-total"><span>합계</span><span id="total">₩0</span></div>
      <button class="btn-order" id="btnOrder">주문하기</button>
    </div>
  </div>
</div>
<script src="script.js"></script>
</body></html>`;

const BENTO_CSS = `:root{--bg:#fffbf0;--card:#fff;--accent:#e67e22;--accent2:#d35400;--text:#2c1810;--sub:#8b6f47;--border:#fde8c8;--green:#27ae60}*{margin:0;padding:0;box-sizing:border-box}body{background:var(--bg);font-family:-apple-system,BlinkMacSystemFont,'Noto Sans KR',sans-serif;color:var(--text);min-height:100vh}
.header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:var(--card);border-bottom:2px solid var(--border);position:sticky;top:0;z-index:100}.logo{font-size:17px;font-weight:700;color:var(--accent2)}.cart-btn{padding:8px 14px;background:var(--accent);color:#fff;border:none;border-radius:20px;cursor:pointer;font-size:13px;font-weight:700;display:flex;align-items:center;gap:6px}
.filter-bar{display:flex;gap:6px;padding:10px 16px;background:var(--card);border-bottom:1px solid var(--border);overflow-x:auto}.ftab{padding:6px 14px;border-radius:20px;border:1.5px solid var(--border);background:transparent;cursor:pointer;font-size:12px;color:var(--sub);white-space:nowrap;font-weight:600}.ftab.active{background:var(--accent);color:#fff;border-color:var(--accent)}
.delivery-info{display:flex;align-items:center;justify-content:space-between;padding:8px 16px;background:#fff8f0;border-bottom:1px solid var(--border);font-size:12px;color:var(--sub)}.countdown{font-weight:700;color:var(--accent)}
.menu-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;padding:14px 16px}
.menu-card{background:var(--card);border-radius:14px;border:1px solid var(--border);overflow:hidden;transition:box-shadow .2s}.menu-card:hover{box-shadow:0 4px 16px rgba(230,126,34,.15)}.card-img{height:150px;background:linear-gradient(135deg,#fef3e2,#fde8c8);display:flex;align-items:center;justify-content:center;font-size:60px;position:relative}.badge-tag{position:absolute;top:8px;left:8px;background:var(--accent);color:#fff;font-size:10px;font-weight:700;padding:3px 7px;border-radius:5px}.badge-sold{position:absolute;inset:0;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px;font-weight:700}.card-body{padding:12px}.card-name{font-size:14px;font-weight:700;margin-bottom:3px}.card-desc{font-size:11px;color:var(--sub);margin-bottom:8px;line-height:1.5}.card-footer{display:flex;align-items:center;justify-content:space-between}.card-price{font-size:16px;font-weight:700;color:var(--accent2)}.card-kcal{font-size:10px;color:var(--sub)}.card-actions{display:flex;align-items:center;gap:8px}.qty-btn{width:26px;height:26px;border-radius:50%;border:1.5px solid var(--border);background:var(--bg);cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center}.qty-btn:hover{border-color:var(--accent);color:var(--accent)}.qty-count{font-size:13px;font-weight:700;min-width:20px;text-align:center}.btn-add{padding:6px 12px;background:var(--accent);color:#fff;border:none;border-radius:20px;cursor:pointer;font-size:12px;font-weight:700}
.cart-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:200;display:flex;justify-content:flex-end}.cart-overlay.hidden{display:none}.cart-panel{background:var(--card);width:min(340px,100vw);height:100%;display:flex;flex-direction:column}.cart-header{display:flex;align-items:center;justify-content:space-between;padding:16px;border-bottom:1px solid var(--border)}.cart-header h3{font-size:15px;font-weight:700}.cart-header button{background:none;border:none;cursor:pointer;font-size:18px;color:var(--sub)}.cart-items{flex:1;overflow-y:auto;padding:12px}.cart-item{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border)}.ci-icon{font-size:28px}.ci-info{flex:1}.ci-name{font-size:13px;font-weight:600}.ci-price{font-size:12px;color:var(--sub)}.ci-qty{display:flex;align-items:center;gap:6px}.empty-cart{padding:40px;text-align:center;color:var(--sub);font-size:13px}.cart-footer{padding:16px;border-top:1px solid var(--border)}.cart-subtotal{display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;color:var(--sub)}.cart-total{display:flex;justify-content:space-between;font-size:16px;font-weight:700;margin:8px 0 12px;padding-top:8px;border-top:1px solid var(--border)}.btn-order{width:100%;padding:13px;background:var(--accent);color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer}.btn-order:hover{background:var(--accent2)}
.hidden{display:none!important}@media(max-width:480px){.menu-grid{grid-template-columns:1fr;padding:10px}}`;

const BENTO_JS = `// NOTE: buildPreview() wraps this in DOMContentLoaded — do NOT add another wrapper
var MENU = [
  {id:1,name:"불고기 도시락",cat:"classic",price:8500,kcal:620,desc:"부드러운 소불고기와 계절 반찬 4종",icon:"🍱",sold:false},
  {id:2,name:"닭가슴살 다이어트",cat:"diet",price:7900,kcal:380,desc:"저칼로리 닭가슴살 + 샐러드 + 현미밥",icon:"🥗",sold:false},
  {id:3,name:"한우 프리미엄",cat:"premium",price:14900,kcal:750,desc:"한우 불고기 + 전복죽 + 고급 반찬 5종",icon:"🥩",sold:false},
  {id:4,name:"두부 비건",cat:"vegan",price:7500,kcal:340,desc:"두부구이 + 나물반찬 + 잡곡밥",icon:"🫘",sold:false},
  {id:5,name:"제육볶음 도시락",cat:"classic",price:8000,kcal:680,desc:"매콤한 제육볶음 + 계란말이 + 반찬",icon:"🌶️",sold:false},
  {id:6,name:"연어 샐러드 볼",cat:"diet",price:9500,kcal:420,desc:"노르웨이 연어 + 아보카도 + 퀴노아",icon:"🐟",sold:true},
  {id:7,name:"삼겹살 도시락",cat:"premium",price:11000,kcal:820,desc:"숯불 삼겹살 + 쌈채소 + 된장찌개",icon:"🥓",sold:false},
  {id:8,name:"채식 비빔밥",cat:"vegan",price:8500,kcal:450,desc:"유기농 채소 비빔밥 + 고추장 드레싱",icon:"🥬",sold:false},
];
var cart = {};
var activecat = "all";

function getFiltered() { return activecat==="all" ? MENU : MENU.filter(m=>m.cat===activecat); }
function getCartTotal() { return Object.values(cart).reduce(function(s,c){ return s+(c.price*c.qty); },0); }
function getCartCount() { return Object.values(cart).reduce(function(s,c){ return s+c.qty; },0); }
function updateCartBtn() {
  document.getElementById("cartCount").textContent=getCartCount();
  document.getElementById("cartTotal").textContent="₩"+getCartTotal().toLocaleString();
}
function renderGrid() {
  var list=getFiltered();
  document.getElementById("menuGrid").innerHTML=list.map(function(m){
    var qty=(cart[m.id]||{}).qty||0;
    return '<div class="menu-card">'+
      '<div class="card-img"><span class="badge-tag">'+{classic:"클래식",diet:"다이어트",premium:"프리미엄",vegan:"비건"}[m.cat]+'</span>'+
      (m.sold?'<div class="badge-sold">품절</div>':'')+m.icon+'</div>'+
      '<div class="card-body">'+
        '<div class="card-name">'+m.name+'</div>'+
        '<div class="card-desc">'+m.desc+'</div>'+
        '<div class="card-footer">'+
          '<div><div class="card-price">₩'+m.price.toLocaleString()+'</div><div class="card-kcal">'+m.kcal+'kcal</div></div>'+
          '<div class="card-actions">'+(m.sold?'<span style="font-size:11px;color:#999">품절</span>':(qty>0?
            '<button class="qty-btn" onclick="changeQty('+m.id+',-1)">−</button><span class="qty-count">'+qty+'</span><button class="qty-btn" onclick="changeQty('+m.id+',1)">+</button>':
            '<button class="btn-add" onclick="addToCart('+m.id+')">담기</button>'
          ))+'</div>'+
        '</div>'+
      '</div>'+
    '</div>';
  }).join("");
}
function addToCart(id) {
  var m=MENU.find(x=>x.id===id); if(!m||m.sold)return;
  cart[id]={...m,qty:1};
  updateCartBtn(); renderGrid();
}
function changeQty(id,delta) {
  if(!cart[id])return;
  cart[id].qty+=delta;
  if(cart[id].qty<=0) delete cart[id];
  updateCartBtn(); renderGrid();
}
function renderCart() {
  var items=Object.values(cart);
  var sub=getCartTotal();
  document.getElementById("cartItems").innerHTML=items.length?items.map(function(c){
    return '<div class="cart-item"><span class="ci-icon">'+c.icon+'</span><div class="ci-info"><div class="ci-name">'+c.name+'</div><div class="ci-price">₩'+c.price.toLocaleString()+' × '+c.qty+'</div></div><div class="ci-qty"><button class="qty-btn" onclick="changeQty('+c.id+',-1);renderCart()">−</button><span>'+c.qty+'</span><button class="qty-btn" onclick="changeQty('+c.id+',1);renderCart()">+</button></div></div>';
  }).join("") : '<div class="empty-cart">장바구니가 비어있어요</div>';
  document.getElementById("subtotal").textContent="₩"+sub.toLocaleString();
  document.getElementById("total").textContent="₩"+(sub+2000).toLocaleString();
}
document.getElementById("cartBtn").addEventListener("click",function(){document.getElementById("cartOverlay").classList.remove("hidden");renderCart();});
document.getElementById("cartClose").addEventListener("click",function(){document.getElementById("cartOverlay").classList.add("hidden");});
document.getElementById("cartOverlay").addEventListener("click",function(e){if(e.target===this)this.classList.add("hidden");});
document.getElementById("btnOrder").addEventListener("click",function(){
  if(!Object.keys(cart).length){alert("담긴 메뉴가 없습니다.");return;}
  alert("✅ 주문 완료! 12:00에 배달 예정입니다.");
  cart={};updateCartBtn();renderGrid();document.getElementById("cartOverlay").classList.add("hidden");
});
document.querySelectorAll(".ftab").forEach(function(btn){
  btn.addEventListener("click",function(){
    document.querySelectorAll(".ftab").forEach(function(b){b.classList.remove("active");});
    this.classList.add("active");
    activecat=this.dataset.cat;
    renderGrid();
  });
});
// Countdown to 11:30 cutoff
function updateCountdown(){
  var now=new Date(),cutoff=new Date();cutoff.setHours(11,30,0,0);
  var diff=cutoff-now;
  if(diff<0){document.getElementById("countdown").textContent="마감됨";return;}
  var h=Math.floor(diff/3600000),m=Math.floor((diff%3600000)/60000),s=Math.floor((diff%60000)/1000);
  document.getElementById("countdown").textContent="마감까지 "+(h>0?h+"시간 ":"")+m+"분 "+s+"초";
}
updateCountdown();setInterval(updateCountdown,1000);
renderGrid();`;

export const TEMPLATES7: TemplateInfo7[] = [
  {
    keywords: ["부동산", "집찾기", "아파트", "매물", "전세", "월세", "매매", "빌라", "오피스텔", "직방", "호갱노노", "부동산앱", "부동산매물", "주택"],
    name: "부동산 매물",
    icon: "🏠",
    description: "직방·호갱노노 스타일 부동산 매물 앱 — 아파트/빌라/오피스텔 목록, 필터링, 찜하기, 상세 모달",
    category: "platform",
    files: {
      "index.html": { name: "index.html", language: "html", content: REALESTATE_HTML },
      "style.css":  { name: "style.css",  language: "css",  content: REALESTATE_CSS  },
      "script.js":  { name: "script.js",  language: "javascript", content: REALESTATE_JS },
    },
  },
  {
    keywords: ["독서", "책", "독서기록", "책기록", "독서노트", "읽은책", "독서일지", "북로그", "booklog", "독서앱", "도서", "완독"],
    name: "독서 기록",
    icon: "📖",
    description: "독서 기록 앱 — 읽는 중·완독·읽고 싶어요 관리, 별점·한줄평, 연간 독서 목표 프로그레스",
    category: "app",
    files: {
      "index.html": { name: "index.html", language: "html", content: BOOKLOG_HTML },
      "style.css":  { name: "style.css",  language: "css",  content: BOOKLOG_CSS  },
      "script.js":  { name: "script.js",  language: "javascript", content: BOOKLOG_JS },
    },
  },
  {
    keywords: ["식단", "식단관리", "다이어트", "식단기록", "meal", "diet", "칼로리", "칼로리계산", "영양소", "식사기록", "식이요법", "체중관리", "식단앱"],
    name: "식단 관리",
    icon: "🥗",
    description: "식단 관리 앱 — 하루 식사 기록, 칼로리 추적, 영양소 분석, 주간 목표 관리",
    category: "app",
    files: {
      "index.html": { name: "index.html", language: "html", content: MEALPLAN_HTML },
      "style.css":  { name: "style.css",  language: "css",  content: MEALPLAN_CSS  },
      "script.js":  { name: "script.js",  language: "javascript", content: MEALPLAN_JS },
    },
  },
  {
    keywords: ["도시락", "도시락주문", "도시락앱", "도시락배달", "점심도시락", "구내식당", "사내식당", "오피스점심", "직장인도시락", "bento", "lunch box"],
    name: "도시락 주문",
    icon: "🍱",
    description: "도시락 주문 앱 — 메뉴 선택, 수량 조절, 장바구니, 주문 확인까지 한 번에",
    category: "app",
    files: {
      "index.html": { name: "index.html", language: "html", content: BENTO_HTML },
      "style.css":  { name: "style.css",  language: "css",  content: BENTO_CSS  },
      "script.js":  { name: "script.js",  language: "javascript", content: BENTO_JS },
    },
  },
];
