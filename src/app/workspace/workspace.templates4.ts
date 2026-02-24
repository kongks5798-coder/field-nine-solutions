import type { FilesMap } from "./workspace.constants";

// ═══════════════════════════════════════════════════════════════════════════
// ██  E-COMMERCE (무신사 Style)  ██
// ═══════════════════════════════════════════════════════════════════════════
const ECOM_HTML = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>🛍️ DALKAK SHOP</title>
<link rel="stylesheet" href="style.css">
</head>
<body>
<header class="header">
  <div class="header-inner">
    <a class="logo" href="#">🛍️ DALKAK SHOP</a>
    <div class="search-bar"><input type="text" id="searchInput" placeholder="브랜드, 상품, 키워드 검색"><button id="searchBtn">🔍</button></div>
    <nav class="header-nav">
      <button id="wishlistBtn" class="icon-btn">♡ <span id="wishCount">0</span></button>
      <button id="cartBtn" class="icon-btn">🛒 <span id="cartCount">0</span></button>
      <button id="authBtn" class="icon-btn">👤</button>
    </nav>
  </div>
</header>
<div class="category-bar">
  <div class="category-scroll">
    <button class="cat-chip active" data-cat="all">전체</button>
    <button class="cat-chip" data-cat="outer">아우터</button>
    <button class="cat-chip" data-cat="top">상의</button>
    <button class="cat-chip" data-cat="bottom">하의</button>
    <button class="cat-chip" data-cat="shoes">신발</button>
    <button class="cat-chip" data-cat="bag">가방</button>
    <button class="cat-chip" data-cat="acc">악세서리</button>
  </div>
</div>
<section class="hero">
  <div class="hero-slider" id="heroSlider">
    <div class="slide active" style="background:linear-gradient(135deg,#667eea,#764ba2)"><h2>2026 S/S 신상 컬렉션</h2><p>최대 40% 할인</p></div>
    <div class="slide" style="background:linear-gradient(135deg,#f093fb,#f5576c)"><h2>🔥 타임딜 진행중</h2><p>매일 오전 10시 오픈</p></div>
    <div class="slide" style="background:linear-gradient(135deg,#4facfe,#00f2fe)"><h2>무료배송 이벤트</h2><p>5만원 이상 구매 시</p></div>
  </div>
  <div class="hero-dots" id="heroDots"></div>
</section>
<main class="main-content">
  <h2 class="section-title">인기 상품</h2>
  <div class="product-grid" id="productGrid"></div>
</main>
<div class="cart-drawer" id="cartDrawer">
  <div class="cart-header"><h3>장바구니</h3><button id="closeCart">✕</button></div>
  <div class="cart-items" id="cartItems"></div>
  <div class="cart-footer">
    <div class="cart-total">합계: <strong id="cartTotal">₩0</strong></div>
    <button class="btn-checkout" id="checkoutBtn">결제하기</button>
  </div>
</div>
<div class="modal-overlay" id="productModal">
  <div class="modal-content">
    <button class="modal-close" id="modalClose">✕</button>
    <div class="modal-body">
      <div class="modal-image" id="modalImage"></div>
      <div class="modal-info">
        <h2 id="modalName"></h2>
        <p class="modal-brand" id="modalBrand"></p>
        <div class="modal-price"><span class="price-original" id="modalOriginal"></span><span class="price-sale" id="modalSale"></span><span class="discount-badge" id="modalDiscount"></span></div>
        <div class="size-selector" id="sizeSelector"></div>
        <div class="modal-actions">
          <button class="btn-wish" id="modalWish">♡ 위시리스트</button>
          <button class="btn-add-cart" id="modalAddCart">장바구니 담기</button>
        </div>
      </div>
    </div>
  </div>
</div>
<div class="modal-overlay" id="authModal">
  <div class="auth-box">
    <button class="modal-close" id="authClose">✕</button>
    <h2 id="authTitle">로그인</h2>
    <form id="authForm">
      <input type="email" id="authEmail" placeholder="이메일" required>
      <input type="password" id="authPw" placeholder="비밀번호" required>
      <button type="submit" class="btn-auth">로그인</button>
    </form>
    <p class="auth-toggle">계정이 없으신가요? <a href="#" id="toggleAuth">회원가입</a></p>
  </div>
</div>
<footer class="footer">
  <div class="footer-inner">
    <div class="footer-col"><h4>DALKAK SHOP</h4><p>프리미엄 패션 이커머스</p><p>사업자등록번호: 123-45-67890</p></div>
    <div class="footer-col"><h4>고객센터</h4><p>📞 1588-0000</p><p>운영시간 09:00-18:00</p></div>
    <div class="footer-col"><h4>소셜</h4><p>📸 Instagram</p><p>🐦 Twitter</p></div>
  </div>
  <p class="footer-copy">© 2026 DALKAK SHOP. All rights reserved.</p>
</footer>
<div class="toast" id="toast"></div>
<script src="script.js"></script>
</body>
</html>`;

const ECOM_CSS = `@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
:root{--bg:#0a0a0a;--surface:#141414;--surface2:#1e1e1e;--text:#f5f5f5;--text2:#999;--accent:#ff3e6c;--accent2:#ff6b81;--border:#2a2a2a;--radius:12px;--font:'Pretendard',system-ui,sans-serif}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:var(--font);background:var(--bg);color:var(--text);min-height:100vh}
a{color:inherit;text-decoration:none}
.header{position:sticky;top:0;z-index:100;background:rgba(10,10,10,.92);backdrop-filter:blur(20px);border-bottom:1px solid var(--border)}
.header-inner{max-width:1400px;margin:0 auto;display:flex;align-items:center;gap:20px;padding:12px 24px}
.logo{font-size:1.3rem;font-weight:800;white-space:nowrap}
.search-bar{flex:1;display:flex;background:var(--surface2);border-radius:var(--radius);overflow:hidden;max-width:500px}
.search-bar input{flex:1;background:none;border:none;color:var(--text);padding:10px 16px;font-size:.95rem;outline:none}
.search-bar button{background:var(--accent);border:none;color:#fff;padding:0 16px;cursor:pointer;font-size:1.1rem}
.header-nav{display:flex;gap:12px}
.icon-btn{background:none;border:none;color:var(--text);cursor:pointer;font-size:1rem;position:relative;padding:8px}
.icon-btn span{font-size:.75rem;background:var(--accent);color:#fff;border-radius:50%;padding:1px 6px;position:absolute;top:0;right:-4px}
.category-bar{background:var(--surface);border-bottom:1px solid var(--border);overflow-x:auto;scrollbar-width:none}
.category-bar::-webkit-scrollbar{display:none}
.category-scroll{display:flex;gap:8px;padding:12px 24px;max-width:1400px;margin:0 auto}
.cat-chip{background:var(--surface2);border:1px solid var(--border);color:var(--text2);padding:8px 20px;border-radius:20px;cursor:pointer;white-space:nowrap;font-size:.9rem;transition:.3s}
.cat-chip:hover,.cat-chip.active{background:var(--accent);color:#fff;border-color:var(--accent)}
.hero{position:relative;height:320px;overflow:hidden}
.slide{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;align-items:center;color:#fff;opacity:0;transition:opacity .8s}
.slide.active{opacity:1}
.slide h2{font-size:2.5rem;font-weight:800;margin-bottom:8px}
.slide p{font-size:1.2rem;opacity:.9}
.hero-dots{position:absolute;bottom:16px;left:50%;transform:translateX(-50%);display:flex;gap:8px}
.hero-dots .dot{width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,.4);cursor:pointer;transition:.3s}
.hero-dots .dot.active{background:#fff;transform:scale(1.3)}
.main-content{max-width:1400px;margin:0 auto;padding:32px 24px}
.section-title{font-size:1.5rem;font-weight:700;margin-bottom:24px}
.product-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:20px}
.product-card{background:var(--surface);border-radius:var(--radius);overflow:hidden;cursor:pointer;transition:transform .3s,box-shadow .3s}
.product-card:hover{transform:translateY(-6px);box-shadow:0 12px 40px rgba(255,62,108,.15)}
.product-img{height:260px;display:flex;align-items:center;justify-content:center;font-size:3rem}
.product-info{padding:14px}
.product-brand{font-size:.8rem;color:var(--text2);margin-bottom:4px}
.product-name{font-size:.95rem;font-weight:600;margin-bottom:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.product-prices{display:flex;align-items:center;gap:8px}
.price-original{text-decoration:line-through;color:var(--text2);font-size:.85rem}
.price-sale{font-weight:700;font-size:1.05rem}
.discount-badge{background:var(--accent);color:#fff;font-size:.75rem;padding:2px 8px;border-radius:4px;font-weight:700}
.product-rating{margin-top:6px;font-size:.8rem;color:#ffd700}
.cart-drawer{position:fixed;top:0;right:-420px;width:400px;height:100vh;background:var(--surface);z-index:200;transition:right .4s;display:flex;flex-direction:column;box-shadow:-4px 0 30px rgba(0,0,0,.5)}
.cart-drawer.open{right:0}
.cart-header{display:flex;justify-content:space-between;align-items:center;padding:20px;border-bottom:1px solid var(--border)}
.cart-header button{background:none;border:none;color:var(--text);font-size:1.3rem;cursor:pointer}
.cart-items{flex:1;overflow-y:auto;padding:16px}
.cart-item{display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--border)}
.cart-item-img{width:64px;height:64px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.5rem}
.cart-item-info{flex:1}
.cart-item-name{font-weight:600;font-size:.9rem}
.cart-item-meta{font-size:.8rem;color:var(--text2);margin:4px 0}
.cart-item-bottom{display:flex;justify-content:space-between;align-items:center}
.qty-ctrl{display:flex;align-items:center;gap:8px}
.qty-ctrl button{width:28px;height:28px;border-radius:50%;border:1px solid var(--border);background:none;color:var(--text);cursor:pointer;font-size:1rem}
.cart-item-price{font-weight:700}
.cart-item-remove{background:none;border:none;color:var(--text2);cursor:pointer;font-size:.8rem}
.cart-footer{padding:20px;border-top:1px solid var(--border)}
.cart-total{display:flex;justify-content:space-between;margin-bottom:16px;font-size:1.1rem}
.btn-checkout{width:100%;padding:14px;background:var(--accent);color:#fff;border:none;border-radius:var(--radius);font-size:1rem;font-weight:700;cursor:pointer;transition:.3s}
.btn-checkout:hover{background:var(--accent2)}
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:300;display:none;justify-content:center;align-items:center;backdrop-filter:blur(4px)}
.modal-overlay.open{display:flex}
.modal-content{background:var(--surface);border-radius:var(--radius);width:90%;max-width:800px;max-height:90vh;overflow-y:auto;position:relative}
.modal-close{position:absolute;top:16px;right:16px;background:none;border:none;color:var(--text);font-size:1.4rem;cursor:pointer;z-index:10}
.modal-body{display:grid;grid-template-columns:1fr 1fr;min-height:400px}
.modal-image{display:flex;align-items:center;justify-content:center;font-size:5rem;min-height:300px}
.modal-info{padding:32px}
.modal-info h2{font-size:1.4rem;font-weight:700;margin-bottom:8px}
.modal-brand{color:var(--text2);margin-bottom:16px}
.modal-price{display:flex;align-items:center;gap:12px;margin-bottom:24px}
.modal-price .price-sale{font-size:1.5rem}
.size-selector{display:flex;gap:8px;margin-bottom:24px;flex-wrap:wrap}
.size-btn{padding:10px 18px;border:1px solid var(--border);border-radius:8px;background:none;color:var(--text);cursor:pointer;transition:.3s}
.size-btn:hover,.size-btn.selected{border-color:var(--accent);color:var(--accent)}
.modal-actions{display:flex;gap:12px}
.btn-wish{flex:1;padding:12px;border:1px solid var(--border);border-radius:var(--radius);background:none;color:var(--text);cursor:pointer;font-size:.95rem;transition:.3s}
.btn-wish:hover,.btn-wish.active{border-color:var(--accent);color:var(--accent)}
.btn-add-cart{flex:2;padding:12px;background:var(--accent);color:#fff;border:none;border-radius:var(--radius);font-size:.95rem;font-weight:700;cursor:pointer;transition:.3s}
.btn-add-cart:hover{background:var(--accent2)}
.auth-box{background:var(--surface);border-radius:var(--radius);padding:40px;width:90%;max-width:400px;position:relative}
.auth-box h2{margin-bottom:24px;text-align:center}
.auth-box input{width:100%;padding:12px 16px;margin-bottom:12px;background:var(--surface2);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:.95rem}
.btn-auth{width:100%;padding:14px;background:var(--accent);color:#fff;border:none;border-radius:8px;font-size:1rem;font-weight:700;cursor:pointer;margin-top:8px}
.auth-toggle{text-align:center;margin-top:16px;font-size:.9rem;color:var(--text2)}
.auth-toggle a{color:var(--accent)}
.footer{background:var(--surface);border-top:1px solid var(--border);margin-top:60px;padding:40px 24px 20px}
.footer-inner{max-width:1400px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:32px}
.footer-col h4{margin-bottom:12px;font-size:1rem}
.footer-col p{color:var(--text2);font-size:.9rem;margin-bottom:6px}
.footer-copy{text-align:center;color:var(--text2);font-size:.8rem;margin-top:32px;padding-top:20px;border-top:1px solid var(--border)}
.toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%) translateY(100px);background:var(--accent);color:#fff;padding:12px 24px;border-radius:var(--radius);font-size:.95rem;transition:transform .4s;z-index:999}
.toast.show{transform:translateX(-50%) translateY(0)}
@media(max-width:768px){
  .header-inner{padding:10px 16px;gap:12px}
  .search-bar{max-width:none}
  .hero{height:200px}
  .slide h2{font-size:1.5rem}
  .product-grid{grid-template-columns:repeat(2,1fr);gap:12px}
  .product-img{height:180px}
  .modal-body{grid-template-columns:1fr}
  .cart-drawer{width:100%}
}
@media(max-width:480px){
  .product-grid{grid-template-columns:repeat(2,1fr);gap:8px}
  .product-info{padding:10px}
  .product-name{font-size:.85rem}
}`;

const ECOM_JS = `document.addEventListener('DOMContentLoaded', function() {
  const products = [
    {id:1,name:'오버사이즈 블레이저',brand:'MUSINSA STANDARD',price:89000,originalPrice:129000,discount:31,category:'outer',sizes:['S','M','L','XL'],rating:4.5,reviews:234,gradient:'linear-gradient(135deg,#2c3e50,#4ca1af)',emoji:'🧥'},
    {id:2,name:'와이드 데님 팬츠',brand:'COVERNAT',price:59000,originalPrice:79000,discount:25,category:'bottom',sizes:['S','M','L'],rating:4.3,reviews:189,gradient:'linear-gradient(135deg,#667eea,#764ba2)',emoji:'👖'},
    {id:3,name:'크루넥 니트',brand:'THISISNEVERTHAT',price:45000,originalPrice:65000,discount:30,category:'top',sizes:['M','L','XL'],rating:4.7,reviews:312,gradient:'linear-gradient(135deg,#f093fb,#f5576c)',emoji:'👕'},
    {id:4,name:'청키 러닝화',brand:'NEW BALANCE',price:139000,originalPrice:159000,discount:12,category:'shoes',sizes:['250','260','270','280'],rating:4.8,reviews:567,gradient:'linear-gradient(135deg,#a8edea,#fed6e3)',emoji:'👟'},
    {id:5,name:'미니 크로스백',brand:'MARHEN.J',price:68000,originalPrice:89000,discount:24,category:'bag',sizes:['ONE'],rating:4.4,reviews:156,gradient:'linear-gradient(135deg,#ffecd2,#fcb69f)',emoji:'👜'},
    {id:6,name:'실버 체인 목걸이',brand:'VINTAGE HOLLYWOOD',price:32000,originalPrice:42000,discount:24,category:'acc',sizes:['ONE'],rating:4.6,reviews:98,gradient:'linear-gradient(135deg,#c9d6ff,#e2e2e2)',emoji:'📿'},
    {id:7,name:'코듀로이 셔츠 자켓',brand:'MUSINSA STANDARD',price:79000,originalPrice:99000,discount:20,category:'outer',sizes:['S','M','L','XL'],rating:4.2,reviews:145,gradient:'linear-gradient(135deg,#d4a574,#a0785a)',emoji:'🧥'},
    {id:8,name:'그래픽 반팔 티',brand:'MAHAGRID',price:35000,originalPrice:45000,discount:22,category:'top',sizes:['S','M','L','XL'],rating:4.1,reviews:267,gradient:'linear-gradient(135deg,#ff9a9e,#fecfef)',emoji:'👕'},
    {id:9,name:'카고 조거 팬츠',brand:'SCULPTOR',price:55000,originalPrice:72000,discount:24,category:'bottom',sizes:['S','M','L'],rating:4.5,reviews:198,gradient:'linear-gradient(135deg,#a18cd1,#fbc2eb)',emoji:'👖'},
    {id:10,name:'가죽 토트백',brand:'FIND KAPOOR',price:118000,originalPrice:158000,discount:25,category:'bag',sizes:['ONE'],rating:4.7,reviews:342,gradient:'linear-gradient(135deg,#30cfd0,#330867)',emoji:'👜'},
    {id:11,name:'에어 맥스 스니커즈',brand:'NIKE',price:159000,originalPrice:179000,discount:11,category:'shoes',sizes:['260','270','280','290'],rating:4.9,reviews:789,gradient:'linear-gradient(135deg,#a8e6cf,#dcedc1)',emoji:'👟'},
    {id:12,name:'볼캡',brand:'KANGOL',price:38000,originalPrice:48000,discount:21,category:'acc',sizes:['ONE'],rating:4.3,reviews:112,gradient:'linear-gradient(135deg,#fbc2eb,#a6c1ee)',emoji:'🧢'},
  ];

  let cart = JSON.parse(localStorage.getItem('dalkak_cart') || '[]');
  let wishlist = JSON.parse(localStorage.getItem('dalkak_wish') || '[]');
  let user = JSON.parse(localStorage.getItem('dalkak_user') || 'null');
  let currentCat = 'all';
  let selectedProduct = null;
  let selectedSize = null;

  function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2000);
  }

  function updateCounts() {
    const cc = document.getElementById('cartCount');
    const wc = document.getElementById('wishCount');
    if (cc) cc.textContent = cart.reduce((s, i) => s + i.qty, 0);
    if (wc) wc.textContent = wishlist.length;
  }

  function saveCart() { localStorage.setItem('dalkak_cart', JSON.stringify(cart)); updateCounts(); }
  function saveWish() { localStorage.setItem('dalkak_wish', JSON.stringify(wishlist)); updateCounts(); }

  function renderProducts() {
    const grid = document.getElementById('productGrid');
    if (!grid) return;
    const filtered = currentCat === 'all' ? products : products.filter(p => p.category === currentCat);
    grid.innerHTML = filtered.map(p => {
      const stars = '★'.repeat(Math.floor(p.rating)) + (p.rating % 1 >= .5 ? '½' : '');
      return \`<div class="product-card" data-id="\${p.id}">
        <div class="product-img" style="background:\${p.gradient}">\${p.emoji}</div>
        <div class="product-info">
          <div class="product-brand">\${p.brand}</div>
          <div class="product-name">\${p.name}</div>
          <div class="product-prices">
            <span class="price-original">₩\${p.originalPrice.toLocaleString()}</span>
            <span class="price-sale">₩\${p.price.toLocaleString()}</span>
            <span class="discount-badge">\${p.discount}%</span>
          </div>
          <div class="product-rating">\${stars} (\${p.reviews})</div>
        </div>
      </div>\`;
    }).join('');
    grid.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', () => openProductModal(Number(card.dataset.id)));
    });
  }

  function openProductModal(id) {
    selectedProduct = products.find(p => p.id === id);
    if (!selectedProduct) return;
    selectedSize = null;
    const modal = document.getElementById('productModal');
    const img = document.getElementById('modalImage');
    const name = document.getElementById('modalName');
    const brand = document.getElementById('modalBrand');
    const orig = document.getElementById('modalOriginal');
    const sale = document.getElementById('modalSale');
    const disc = document.getElementById('modalDiscount');
    const sizes = document.getElementById('sizeSelector');
    const wish = document.getElementById('modalWish');
    if (img) { img.style.background = selectedProduct.gradient; img.textContent = selectedProduct.emoji; }
    if (name) name.textContent = selectedProduct.name;
    if (brand) brand.textContent = selectedProduct.brand;
    if (orig) orig.textContent = '₩' + selectedProduct.originalPrice.toLocaleString();
    if (sale) sale.textContent = '₩' + selectedProduct.price.toLocaleString();
    if (disc) disc.textContent = selectedProduct.discount + '%';
    if (sizes) sizes.innerHTML = selectedProduct.sizes.map(s => \`<button class="size-btn" data-size="\${s}">\${s}</button>\`).join('');
    sizes?.querySelectorAll('.size-btn').forEach(btn => {
      btn.addEventListener('click', () => { selectedSize = btn.dataset.size; sizes.querySelectorAll('.size-btn').forEach(b => b.classList.remove('selected')); btn.classList.add('selected'); });
    });
    if (wish) wish.className = wishlist.includes(id) ? 'btn-wish active' : 'btn-wish';
    modal?.classList.add('open');
  }

  document.getElementById('modalClose')?.addEventListener('click', () => document.getElementById('productModal')?.classList.remove('open'));
  document.getElementById('modalWish')?.addEventListener('click', () => {
    if (!selectedProduct) return;
    const idx = wishlist.indexOf(selectedProduct.id);
    if (idx >= 0) { wishlist.splice(idx, 1); document.getElementById('modalWish')?.classList.remove('active'); showToast('위시리스트에서 제거됨'); }
    else { wishlist.push(selectedProduct.id); document.getElementById('modalWish')?.classList.add('active'); showToast('위시리스트에 추가됨 ♡'); }
    saveWish();
  });
  document.getElementById('modalAddCart')?.addEventListener('click', () => {
    if (!selectedProduct) return;
    if (!selectedSize) { showToast('사이즈를 선택해주세요'); return; }
    const exist = cart.find(c => c.id === selectedProduct.id && c.size === selectedSize);
    if (exist) { exist.qty++; } else { cart.push({ id: selectedProduct.id, name: selectedProduct.name, price: selectedProduct.price, size: selectedSize, qty: 1, gradient: selectedProduct.gradient, emoji: selectedProduct.emoji }); }
    saveCart();
    showToast('장바구니에 추가됨 🛒');
    document.getElementById('productModal')?.classList.remove('open');
  });

  // Cart drawer
  document.getElementById('cartBtn')?.addEventListener('click', () => { renderCart(); document.getElementById('cartDrawer')?.classList.add('open'); });
  document.getElementById('closeCart')?.addEventListener('click', () => document.getElementById('cartDrawer')?.classList.remove('open'));
  function renderCart() {
    const container = document.getElementById('cartItems');
    const total = document.getElementById('cartTotal');
    if (!container) return;
    if (cart.length === 0) { container.innerHTML = '<p style="text-align:center;color:#999;padding:40px">장바구니가 비어있습니다</p>'; if (total) total.textContent = '₩0'; return; }
    container.innerHTML = cart.map((item, i) => \`<div class="cart-item">
      <div class="cart-item-img" style="background:\${item.gradient}">\${item.emoji}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">\${item.name}</div>
        <div class="cart-item-meta">\${item.size}</div>
        <div class="cart-item-bottom">
          <div class="qty-ctrl"><button class="qty-minus" data-i="\${i}">−</button><span>\${item.qty}</span><button class="qty-plus" data-i="\${i}">+</button></div>
          <span class="cart-item-price">₩\${(item.price * item.qty).toLocaleString()}</span>
        </div>
        <button class="cart-item-remove" data-i="\${i}">삭제</button>
      </div>
    </div>\`).join('');
    container.querySelectorAll('.qty-minus').forEach(b => b.addEventListener('click', () => { const idx = Number(b.dataset.i); if (cart[idx].qty > 1) cart[idx].qty--; saveCart(); renderCart(); }));
    container.querySelectorAll('.qty-plus').forEach(b => b.addEventListener('click', () => { const idx = Number(b.dataset.i); cart[idx].qty++; saveCart(); renderCart(); }));
    container.querySelectorAll('.cart-item-remove').forEach(b => b.addEventListener('click', () => { cart.splice(Number(b.dataset.i), 1); saveCart(); renderCart(); }));
    if (total) total.textContent = '₩' + cart.reduce((s, i) => s + i.price * i.qty, 0).toLocaleString();
  }
  document.getElementById('checkoutBtn')?.addEventListener('click', () => { if (cart.length === 0) return; showToast('결제가 완료되었습니다! 🎉'); cart = []; saveCart(); renderCart(); document.getElementById('cartDrawer')?.classList.remove('open'); });

  // Categories
  document.querySelectorAll('.cat-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      currentCat = chip.dataset.cat || 'all';
      document.querySelectorAll('.cat-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      renderProducts();
    });
  });

  // Search
  document.getElementById('searchBtn')?.addEventListener('click', () => {
    const q = (document.getElementById('searchInput') as HTMLInputElement)?.value?.toLowerCase() || '';
    const grid = document.getElementById('productGrid');
    if (!grid) return;
    if (!q) { renderProducts(); return; }
    const filtered = products.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
    grid.innerHTML = filtered.length ? filtered.map(p => \`<div class="product-card" data-id="\${p.id}"><div class="product-img" style="background:\${p.gradient}">\${p.emoji}</div><div class="product-info"><div class="product-brand">\${p.brand}</div><div class="product-name">\${p.name}</div><div class="product-prices"><span class="price-sale">₩\${p.price.toLocaleString()}</span></div></div></div>\`).join('') : '<p style="text-align:center;color:#999;padding:40px;grid-column:1/-1">검색 결과가 없습니다</p>';
    grid.querySelectorAll('.product-card').forEach(card => card.addEventListener('click', () => openProductModal(Number(card.dataset.id))));
  });

  // Auth
  let isLogin = true;
  document.getElementById('authBtn')?.addEventListener('click', () => { if (user) { user = null; localStorage.removeItem('dalkak_user'); showToast('로그아웃 되었습니다'); } else { document.getElementById('authModal')?.classList.add('open'); } });
  document.getElementById('authClose')?.addEventListener('click', () => document.getElementById('authModal')?.classList.remove('open'));
  document.getElementById('toggleAuth')?.addEventListener('click', (e) => { e.preventDefault(); isLogin = !isLogin; const t = document.getElementById('authTitle'); if (t) t.textContent = isLogin ? '로그인' : '회원가입'; });
  document.getElementById('authForm')?.addEventListener('submit', (e) => { e.preventDefault(); const email = (document.getElementById('authEmail') as HTMLInputElement)?.value; user = { email }; localStorage.setItem('dalkak_user', JSON.stringify(user)); document.getElementById('authModal')?.classList.remove('open'); showToast(isLogin ? '로그인 성공!' : '회원가입 완료!'); });

  // Hero slider
  let slideIdx = 0;
  const slides = document.querySelectorAll('.slide');
  const dotsContainer = document.getElementById('heroDots');
  if (dotsContainer && slides.length) {
    slides.forEach((_, i) => { const d = document.createElement('div'); d.className = 'dot' + (i === 0 ? ' active' : ''); d.addEventListener('click', () => goSlide(i)); dotsContainer.appendChild(d); });
  }
  function goSlide(i) { slideIdx = i; slides.forEach((s, j) => s.classList.toggle('active', j === i)); dotsContainer?.querySelectorAll('.dot').forEach((d, j) => d.classList.toggle('active', j === i)); }
  setInterval(() => goSlide((slideIdx + 1) % slides.length), 4000);

  updateCounts();
  renderProducts();
});`.replace(/ as HTMLInputElement/g, '');

// ═══════════════════════════════════════════════════════════════════════════
// ██  VIDEO PLATFORM (유튜브 Style)  ██
// ═══════════════════════════════════════════════════════════════════════════
const VIDEO_HTML = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>📺 DalkakTube</title>
<link rel="stylesheet" href="style.css">
</head>
<body>
<header class="header">
  <div class="header-left"><button id="menuToggle">☰</button><a class="logo" href="#">📺 DalkakTube</a></div>
  <div class="search-wrap"><input type="text" id="searchInput" placeholder="검색"><button id="searchBtn">🔍</button></div>
  <div class="header-right"><button class="icon-btn" id="darkToggle">🌙</button><button class="icon-btn">🔔</button><div class="avatar" id="userAvatar">D</div></div>
</header>
<div class="layout">
  <aside class="sidebar" id="sidebar">
    <nav class="side-nav">
      <a class="nav-item active" data-page="home">🏠 홈</a>
      <a class="nav-item" data-page="trending">🔥 인기</a>
      <a class="nav-item" data-page="subs">📋 구독</a>
      <a class="nav-item" data-page="library">📚 보관함</a>
      <a class="nav-item" data-page="history">⏱️ 시청기록</a>
      <a class="nav-item" data-page="liked">👍 좋아요</a>
    </nav>
  </aside>
  <main class="main" id="mainContent">
    <div class="chip-bar" id="chipBar">
      <button class="chip active" data-filter="all">전체</button>
      <button class="chip" data-filter="music">음악</button>
      <button class="chip" data-filter="game">게임</button>
      <button class="chip" data-filter="news">뉴스</button>
      <button class="chip" data-filter="sports">스포츠</button>
      <button class="chip" data-filter="cook">요리</button>
      <button class="chip" data-filter="tech">기술</button>
    </div>
    <div id="homePage">
      <div class="video-grid" id="videoGrid"></div>
    </div>
    <div id="playerPage" class="hidden">
      <div class="player-layout">
        <div class="player-main">
          <div class="video-player" id="videoPlayer">▶</div>
          <div class="video-meta">
            <h1 id="playerTitle"></h1>
            <div class="meta-row"><span id="playerViews"></span><span id="playerDate"></span></div>
            <div class="action-bar">
              <button class="action-btn" id="likeBtn">👍 <span id="likeCount">0</span></button>
              <button class="action-btn" id="dislikeBtn">👎</button>
              <button class="action-btn">↗ 공유</button>
              <button class="action-btn" id="saveBtn">📥 저장</button>
            </div>
            <div class="channel-info">
              <div class="channel-avatar" id="chAvatar">C</div>
              <div class="channel-text"><strong id="chName"></strong><span id="chSubs"></span></div>
              <button class="sub-btn" id="subBtn">구독</button>
            </div>
            <div class="description" id="playerDesc"></div>
          </div>
          <div class="comments-section">
            <h3>댓글 <span id="commentCount">0</span>개</h3>
            <div class="comment-input"><input type="text" id="newComment" placeholder="댓글 추가..."><button id="postComment">게시</button></div>
            <div id="commentList"></div>
          </div>
        </div>
        <aside class="recommended" id="recommended"></aside>
      </div>
    </div>
  </main>
</div>
<script src="script.js"></script>
</body>
</html>`;

const VIDEO_CSS = `@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
:root{--bg:#0f0f0f;--surface:#1a1a1a;--surface2:#272727;--text:#f1f1f1;--text2:#aaa;--accent:#ff0000;--border:#333;--sidebar-w:240px;--font:'Pretendard',system-ui,sans-serif}
[data-theme="light"]{--bg:#fff;--surface:#f9f9f9;--surface2:#e5e5e5;--text:#0f0f0f;--text2:#606060;--border:#e0e0e0}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:var(--font);background:var(--bg);color:var(--text)}
.header{position:fixed;top:0;left:0;right:0;height:56px;background:var(--surface);display:flex;align-items:center;justify-content:space-between;padding:0 16px;z-index:100;border-bottom:1px solid var(--border)}
.header-left{display:flex;align-items:center;gap:16px}
.header-left button{background:none;border:none;color:var(--text);font-size:1.3rem;cursor:pointer}
.logo{font-size:1.2rem;font-weight:800;color:var(--text);text-decoration:none}
.search-wrap{display:flex;max-width:600px;flex:1;margin:0 40px}
.search-wrap input{flex:1;background:var(--bg);border:1px solid var(--border);border-right:none;border-radius:20px 0 0 20px;padding:8px 16px;color:var(--text);font-size:.95rem;outline:none}
.search-wrap button{background:var(--surface2);border:1px solid var(--border);border-radius:0 20px 20px 0;padding:0 20px;color:var(--text);cursor:pointer;font-size:1rem}
.header-right{display:flex;align-items:center;gap:12px}
.icon-btn{background:none;border:none;color:var(--text);cursor:pointer;font-size:1.2rem;padding:8px}
.avatar{width:32px;height:32px;border-radius:50%;background:var(--accent);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.9rem;cursor:pointer}
.layout{display:flex;margin-top:56px}
.sidebar{width:var(--sidebar-w);position:fixed;left:0;top:56px;bottom:0;background:var(--surface);overflow-y:auto;transition:transform .3s;z-index:50}
.sidebar.collapsed{transform:translateX(calc(var(--sidebar-w)*-1))}
.side-nav{padding:12px 0}
.nav-item{display:flex;align-items:center;gap:16px;padding:10px 24px;color:var(--text);cursor:pointer;font-size:.9rem;transition:.2s}
.nav-item:hover,.nav-item.active{background:var(--surface2)}
.main{margin-left:var(--sidebar-w);flex:1;padding:16px 24px;min-height:calc(100vh - 56px);transition:margin .3s}
.main.expanded{margin-left:0}
.chip-bar{display:flex;gap:8px;overflow-x:auto;padding-bottom:16px;scrollbar-width:none}
.chip-bar::-webkit-scrollbar{display:none}
.chip{background:var(--surface2);border:none;color:var(--text);padding:8px 16px;border-radius:8px;cursor:pointer;white-space:nowrap;font-size:.9rem;transition:.2s}
.chip:hover,.chip.active{background:var(--text);color:var(--bg)}
.video-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px}
.video-card{cursor:pointer;transition:transform .2s}
.video-card:hover{transform:scale(1.02)}
.video-thumb{position:relative;border-radius:12px;overflow:hidden;aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;font-size:3rem}
.video-thumb .duration{position:absolute;bottom:6px;right:6px;background:rgba(0,0,0,.8);color:#fff;padding:2px 6px;border-radius:4px;font-size:.75rem}
.video-card-info{display:flex;gap:12px;padding:12px 0}
.video-card-avatar{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.8rem;font-weight:700;flex-shrink:0}
.video-card-text h3{font-size:.95rem;font-weight:600;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.video-card-text p{font-size:.8rem;color:var(--text2);margin-top:4px}
.hidden{display:none!important}
.player-layout{display:grid;grid-template-columns:1fr 400px;gap:24px}
.video-player{aspect-ratio:16/9;background:linear-gradient(135deg,#1a1a2e,#16213e);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:4rem;cursor:pointer;transition:.3s}
.video-player:hover{background:linear-gradient(135deg,#16213e,#0f3460)}
.video-meta{padding:16px 0}
.video-meta h1{font-size:1.3rem;font-weight:700}
.meta-row{color:var(--text2);font-size:.9rem;margin:8px 0;display:flex;gap:8px}
.action-bar{display:flex;gap:8px;padding:12px 0;border-bottom:1px solid var(--border)}
.action-btn{background:var(--surface2);border:none;color:var(--text);padding:8px 16px;border-radius:20px;cursor:pointer;font-size:.9rem;transition:.2s}
.action-btn:hover,.action-btn.active{background:var(--text);color:var(--bg)}
.channel-info{display:flex;align-items:center;gap:12px;padding:16px 0;border-bottom:1px solid var(--border)}
.channel-avatar{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700}
.channel-text{flex:1}
.channel-text strong{display:block;font-size:.95rem}
.channel-text span{font-size:.8rem;color:var(--text2)}
.sub-btn{background:var(--accent);color:#fff;border:none;padding:10px 20px;border-radius:20px;font-weight:700;cursor:pointer;transition:.3s}
.sub-btn.subscribed{background:var(--surface2);color:var(--text)}
.description{padding:16px 0;font-size:.9rem;color:var(--text2);line-height:1.6}
.comments-section{padding:24px 0}
.comments-section h3{margin-bottom:16px}
.comment-input{display:flex;gap:12px;margin-bottom:24px}
.comment-input input{flex:1;background:none;border:none;border-bottom:1px solid var(--border);color:var(--text);padding:8px 0;font-size:.95rem;outline:none}
.comment-input button{background:var(--accent);color:#fff;border:none;padding:8px 16px;border-radius:20px;cursor:pointer;font-weight:600}
.comment{display:flex;gap:12px;margin-bottom:16px}
.comment-avatar{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.8rem;font-weight:700;flex-shrink:0}
.comment-body{flex:1}
.comment-body strong{font-size:.85rem}
.comment-body span{font-size:.8rem;color:var(--text2);margin-left:8px}
.comment-body p{font-size:.9rem;margin-top:4px;line-height:1.4}
.recommended .video-card{display:flex;gap:8px}
.recommended .video-thumb{width:168px;min-width:168px;aspect-ratio:16/9;border-radius:8px;font-size:1.5rem}
.recommended .video-card-info{padding:0}
.recommended .video-card-avatar{display:none}
.recommended .video-card-text h3{font-size:.85rem}
@media(max-width:1024px){.player-layout{grid-template-columns:1fr}.recommended{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr))}}
@media(max-width:768px){.sidebar{transform:translateX(calc(var(--sidebar-w)*-1))}.sidebar.open{transform:none}.main{margin-left:0}.video-grid{grid-template-columns:1fr}.search-wrap{margin:0 12px}}`;

const VIDEO_JS = `document.addEventListener('DOMContentLoaded', function() {
  const videos = [
    {id:1,title:'Next.js 16 완벽 가이드 - 풀스택 웹앱 만들기',channel:'코딩채널',channelColor:'#ff6b6b',subs:'32만',views:'124만',date:'3일 전',duration:'25:14',category:'tech',gradient:'linear-gradient(135deg,#667eea,#764ba2)',likes:5200,desc:'Next.js 16의 새로운 기능과 풀스택 개발 방법을 알아봅니다.'},
    {id:2,title:'2026 봄 트렌드 패션 하울 🌸',channel:'패션TV',channelColor:'#f093fb',subs:'89만',views:'67만',date:'1주 전',duration:'18:32',category:'all',gradient:'linear-gradient(135deg,#f093fb,#f5576c)',likes:3100,desc:'올 봄 꼭 사야할 아이템 총정리!'},
    {id:3,title:'프로 게이머의 하루 브이로그',channel:'게임마스터',channelColor:'#4facfe',subs:'156만',views:'230만',date:'5일 전',duration:'32:10',category:'game',gradient:'linear-gradient(135deg,#4facfe,#00f2fe)',likes:15000,desc:'대회 준비하는 프로게이머의 리얼 일상'},
    {id:4,title:'뉴진스 새 앨범 리뷰 & 분석',channel:'뮤직리뷰',channelColor:'#a8edea',subs:'45만',views:'89만',date:'2일 전',duration:'15:45',category:'music',gradient:'linear-gradient(135deg,#a8edea,#fed6e3)',likes:8700,desc:'음악적 분석과 함께 들어보는 신보 리뷰'},
    {id:5,title:'손흥민 EPL 하이라이트 모음',channel:'스포츠하이',channelColor:'#ffecd2',subs:'210만',views:'450만',date:'1일 전',duration:'10:22',category:'sports',gradient:'linear-gradient(135deg,#ffecd2,#fcb69f)',likes:25000,desc:'이번 시즌 골 & 어시스트 하이라이트'},
    {id:6,title:'5분 원팬 파스타 레시피 🍝',channel:'요리왕',channelColor:'#ff9a9e',subs:'78만',views:'156만',date:'4일 전',duration:'8:15',category:'cook',gradient:'linear-gradient(135deg,#ff9a9e,#fecfef)',likes:9800,desc:'자취생 필수! 초간단 파스타'},
    {id:7,title:'AI 시대 개발자 생존 전략',channel:'테크톡',channelColor:'#a18cd1',subs:'67만',views:'98만',date:'6일 전',duration:'22:30',category:'tech',gradient:'linear-gradient(135deg,#a18cd1,#fbc2eb)',likes:6300,desc:'AI가 바꾸는 개발 생태계'},
    {id:8,title:'K-POP 안무 커버 모음',channel:'댄스팩토리',channelColor:'#fbc2eb',subs:'120만',views:'310만',date:'3일 전',duration:'12:48',category:'music',gradient:'linear-gradient(135deg,#fbc2eb,#a6c1ee)',likes:18000,desc:'이번 달 핫한 K-POP 안무 모음'},
    {id:9,title:'오늘의 뉴스 브리핑',channel:'뉴스24',channelColor:'#30cfd0',subs:'340만',views:'89만',date:'12시간 전',duration:'5:30',category:'news',gradient:'linear-gradient(135deg,#30cfd0,#330867)',likes:2100,desc:'주요 뉴스 5분 정리'},
    {id:10,title:'마인크래프트 건축 타임랩스',channel:'마크장인',channelColor:'#38ef7d',subs:'92만',views:'178만',date:'1주 전',duration:'20:15',category:'game',gradient:'linear-gradient(135deg,#38ef7d,#11998e)',likes:12000,desc:'중세 성 건축 과정'},
    {id:11,title:'헬스 3개월 변화 기록',channel:'운동일기',channelColor:'#fc5c7d',subs:'55만',views:'210만',date:'2주 전',duration:'14:22',category:'sports',gradient:'linear-gradient(135deg,#fc5c7d,#6a82fb)',likes:9500,desc:'초보자 3개월 변화'},
    {id:12,title:'집밥 백선생 김치찌개',channel:'쿡방',channelColor:'#ed6ea0',subs:'180만',views:'560만',date:'1개월 전',duration:'11:08',category:'cook',gradient:'linear-gradient(135deg,#ed6ea0,#ec8c69)',likes:32000,desc:'백선생이 알려주는 진짜 김치찌개'},
  ];

  let liked = JSON.parse(localStorage.getItem('dtube_liked') || '[]');
  let saved = JSON.parse(localStorage.getItem('dtube_saved') || '[]');
  let subs = JSON.parse(localStorage.getItem('dtube_subs') || '[]');
  let history = JSON.parse(localStorage.getItem('dtube_history') || '[]');
  let currentFilter = 'all';
  let isDark = true;

  function renderGrid(filter) {
    const grid = document.getElementById('videoGrid');
    if (!grid) return;
    const list = filter === 'all' ? videos : videos.filter(v => v.category === filter);
    grid.innerHTML = list.map(v => \`<div class="video-card" data-id="\${v.id}">
      <div class="video-thumb" style="background:\${v.gradient}">▶<span class="duration">\${v.duration}</span></div>
      <div class="video-card-info">
        <div class="video-card-avatar" style="background:\${v.channelColor}">\${v.channel[0]}</div>
        <div class="video-card-text"><h3>\${v.title}</h3><p>\${v.channel} · 조회수 \${v.views}회 · \${v.date}</p></div>
      </div>
    </div>\`).join('');
    grid.querySelectorAll('.video-card').forEach(c => c.addEventListener('click', () => openPlayer(Number(c.dataset.id))));
  }

  function openPlayer(id) {
    const v = videos.find(x => x.id === id);
    if (!v) return;
    if (!history.includes(id)) { history.unshift(id); localStorage.setItem('dtube_history', JSON.stringify(history)); }
    document.getElementById('homePage')?.classList.add('hidden');
    document.getElementById('chipBar')?.classList.add('hidden');
    const pp = document.getElementById('playerPage');
    if (pp) pp.classList.remove('hidden');
    const vp = document.getElementById('videoPlayer');
    if (vp) vp.style.background = v.gradient;
    const pt = document.getElementById('playerTitle');
    if (pt) pt.textContent = v.title;
    const pv = document.getElementById('playerViews');
    if (pv) pv.textContent = '조회수 ' + v.views + '회';
    const pd = document.getElementById('playerDate');
    if (pd) pd.textContent = v.date;
    const lc = document.getElementById('likeCount');
    if (lc) lc.textContent = v.likes.toLocaleString();
    const ca = document.getElementById('chAvatar');
    if (ca) { ca.style.background = v.channelColor; ca.textContent = v.channel[0]; }
    const cn = document.getElementById('chName');
    if (cn) cn.textContent = v.channel;
    const cs = document.getElementById('chSubs');
    if (cs) cs.textContent = '구독자 ' + v.subs;
    const pde = document.getElementById('playerDesc');
    if (pde) pde.textContent = v.desc;
    const lb = document.getElementById('likeBtn');
    if (lb) lb.className = liked.includes(id) ? 'action-btn active' : 'action-btn';
    const sb = document.getElementById('subBtn');
    if (sb) { sb.textContent = subs.includes(v.channel) ? '구독중' : '구독'; sb.className = subs.includes(v.channel) ? 'sub-btn subscribed' : 'sub-btn'; }
    renderComments(v);
    renderRecommended(id);
  }

  const defaultComments = [
    {author:'코딩좋아',text:'너무 유익해요! 감사합니다 🙏',date:'2일 전',likes:42},
    {author:'학생123',text:'이거 보고 바로 따라해봤는데 잘 됩니다',date:'1일 전',likes:28},
    {author:'개발자K',text:'설명이 정말 깔끔하네요',date:'5시간 전',likes:15},
  ];

  function renderComments(v) {
    const cl = document.getElementById('commentList');
    const cc = document.getElementById('commentCount');
    if (!cl) return;
    const userComments = JSON.parse(localStorage.getItem('dtube_comments_' + v.id) || '[]');
    const all = [...userComments, ...defaultComments];
    if (cc) cc.textContent = String(all.length);
    cl.innerHTML = all.map(c => \`<div class="comment"><div class="comment-avatar" style="background:hsl(\${c.author.length*40},60%,50%)">\${c.author[0]}</div><div class="comment-body"><strong>\${c.author}</strong><span>\${c.date}</span><p>\${c.text}</p></div></div>\`).join('');
  }

  function renderRecommended(excludeId) {
    const rec = document.getElementById('recommended');
    if (!rec) return;
    rec.innerHTML = '<h3 style="margin-bottom:16px">추천 동영상</h3>' + videos.filter(v => v.id !== excludeId).slice(0, 8).map(v => \`<div class="video-card" data-id="\${v.id}"><div class="video-thumb" style="background:\${v.gradient}">▶<span class="duration">\${v.duration}</span></div><div class="video-card-info"><div class="video-card-text"><h3>\${v.title}</h3><p>\${v.channel} · \${v.views}회</p></div></div></div>\`).join('');
    rec.querySelectorAll('.video-card').forEach(c => c.addEventListener('click', () => openPlayer(Number(c.dataset.id))));
  }

  // Event listeners
  document.getElementById('menuToggle')?.addEventListener('click', () => { document.getElementById('sidebar')?.classList.toggle('collapsed'); document.querySelector('.main')?.classList.toggle('expanded'); });
  document.getElementById('darkToggle')?.addEventListener('click', () => { isDark = !isDark; document.documentElement.setAttribute('data-theme', isDark ? '' : 'light'); });
  document.querySelectorAll('.chip').forEach(c => c.addEventListener('click', () => { currentFilter = c.dataset.filter || 'all'; document.querySelectorAll('.chip').forEach(x => x.classList.remove('active')); c.classList.add('active'); renderGrid(currentFilter); }));
  document.querySelectorAll('.nav-item').forEach(n => n.addEventListener('click', () => { document.querySelectorAll('.nav-item').forEach(x => x.classList.remove('active')); n.classList.add('active'); document.getElementById('playerPage')?.classList.add('hidden'); document.getElementById('homePage')?.classList.remove('hidden'); document.getElementById('chipBar')?.classList.remove('hidden'); }));
  document.getElementById('searchBtn')?.addEventListener('click', () => { const q = document.getElementById('searchInput')?.value?.toLowerCase() || ''; const grid = document.getElementById('videoGrid'); if (!grid) return; const list = q ? videos.filter(v => v.title.toLowerCase().includes(q) || v.channel.toLowerCase().includes(q)) : videos; grid.innerHTML = list.map(v => \`<div class="video-card" data-id="\${v.id}"><div class="video-thumb" style="background:\${v.gradient}">▶<span class="duration">\${v.duration}</span></div><div class="video-card-info"><div class="video-card-avatar" style="background:\${v.channelColor}">\${v.channel[0]}</div><div class="video-card-text"><h3>\${v.title}</h3><p>\${v.channel} · \${v.views}회</p></div></div></div>\`).join(''); grid.querySelectorAll('.video-card').forEach(c => c.addEventListener('click', () => openPlayer(Number(c.dataset.id)))); });
  document.getElementById('likeBtn')?.addEventListener('click', () => { const pp = document.getElementById('playerPage'); if (pp?.classList.contains('hidden')) return; });
  document.getElementById('postComment')?.addEventListener('click', () => { const input = document.getElementById('newComment'); if (!input || !input.value.trim()) return; });

  renderGrid('all');
});`;

// ═══════════════════════════════════════════════════════════════════════════
// ██  SOCIAL FEED (인스타 Style)  ██
// ═══════════════════════════════════════════════════════════════════════════
const SOCIAL_HTML = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>📱 Dalkagram</title>
<link rel="stylesheet" href="style.css">
</head>
<body>
<header class="header">
  <a class="logo" href="#">📱 Dalkagram</a>
  <div class="header-icons">
    <button class="icon-btn" id="createBtn">➕</button>
    <button class="icon-btn" id="notiBtn">🔔</button>
    <button class="icon-btn" id="dmBtn">💬</button>
  </div>
</header>
<div class="stories-bar" id="storiesBar"></div>
<main class="feed" id="feed"></main>
<nav class="bottom-nav">
  <button class="bnav active" data-tab="home">🏠</button>
  <button class="bnav" data-tab="explore">🔍</button>
  <button class="bnav" data-tab="reels">🎬</button>
  <button class="bnav" data-tab="profile">👤</button>
</nav>
<div class="modal-overlay" id="storyModal">
  <div class="story-viewer">
    <div class="story-progress" id="storyProgress"></div>
    <div class="story-header"><div class="story-user" id="storyUser"></div><button class="story-close" id="storyClose">✕</button></div>
    <div class="story-content" id="storyContent"></div>
  </div>
</div>
<div class="modal-overlay" id="createModal">
  <div class="create-box">
    <h3>새 게시물 작성</h3>
    <div class="create-preview" id="createPreview">📷 이미지를 선택하세요</div>
    <textarea id="captionInput" placeholder="문구 입력..." rows="3"></textarea>
    <button class="btn-share" id="shareBtn">공유하기</button>
    <button class="btn-cancel" id="cancelCreate">취소</button>
  </div>
</div>
<div class="toast" id="toast"></div>
<script src="script.js"></script>
</body>
</html>`;

const SOCIAL_CSS = `@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
:root{--bg:#fafafa;--surface:#fff;--text:#262626;--text2:#8e8e8e;--accent:#e1306c;--accent2:#833ab4;--border:#dbdbdb;--font:'Pretendard',system-ui,sans-serif}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:var(--font);background:var(--bg);color:var(--text);max-width:470px;margin:0 auto;min-height:100vh;padding-bottom:60px}
.header{position:sticky;top:0;background:var(--surface);border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;padding:12px 16px;z-index:50}
.logo{font-size:1.3rem;font-weight:800;background:linear-gradient(45deg,var(--accent),var(--accent2));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.header-icons{display:flex;gap:16px}
.icon-btn{background:none;border:none;font-size:1.3rem;cursor:pointer}
.stories-bar{display:flex;gap:12px;padding:16px;overflow-x:auto;scrollbar-width:none;border-bottom:1px solid var(--border);background:var(--surface)}
.stories-bar::-webkit-scrollbar{display:none}
.story-circle{display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;min-width:64px}
.story-avatar{width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.5rem;border:3px solid var(--accent);padding:2px}
.story-avatar.seen{border-color:var(--border)}
.story-name{font-size:.7rem;color:var(--text2);max-width:64px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center}
.feed{padding-top:8px}
.post{background:var(--surface);border-bottom:1px solid var(--border);margin-bottom:8px}
.post-header{display:flex;align-items:center;gap:10px;padding:12px 16px}
.post-avatar{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.9rem;font-weight:700}
.post-username{font-weight:600;font-size:.9rem;flex:1}
.post-follow{background:none;border:none;color:#0095f6;font-weight:600;cursor:pointer;font-size:.85rem}
.post-image{width:100%;aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:5rem;cursor:pointer;user-select:none}
.post-actions{display:flex;gap:16px;padding:12px 16px}
.post-actions button{background:none;border:none;font-size:1.4rem;cursor:pointer;transition:transform .2s}
.post-actions button:active{transform:scale(1.3)}
.post-actions .save{margin-left:auto}
.post-likes{padding:0 16px;font-weight:600;font-size:.9rem}
.post-caption{padding:4px 16px 8px}
.post-caption strong{font-weight:600}
.post-caption span{font-size:.9rem}
.post-comments-link{padding:0 16px 4px;color:var(--text2);font-size:.85rem;cursor:pointer}
.post-time{padding:0 16px 12px;color:var(--text2);font-size:.7rem;text-transform:uppercase}
.heart-anim{position:absolute;font-size:4rem;opacity:0;transform:scale(0);animation:heartPop .8s ease forwards;pointer-events:none}
@keyframes heartPop{0%{opacity:1;transform:scale(0)}25%{transform:scale(1.2)}50%{transform:scale(1);opacity:1}100%{opacity:0;transform:scale(1)}}
.bottom-nav{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:470px;background:var(--surface);border-top:1px solid var(--border);display:flex;justify-content:space-around;padding:8px 0;z-index:50}
.bnav{background:none;border:none;font-size:1.4rem;cursor:pointer;padding:8px;opacity:.5;transition:.2s}
.bnav.active{opacity:1}
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:200;display:none;justify-content:center;align-items:center}
.modal-overlay.open{display:flex}
.story-viewer{width:100%;max-width:400px;height:90vh;border-radius:12px;overflow:hidden;position:relative;display:flex;flex-direction:column}
.story-progress{display:flex;gap:4px;padding:8px 12px;position:absolute;top:0;left:0;right:0;z-index:10}
.story-progress .bar{flex:1;height:3px;background:rgba(255,255,255,.3);border-radius:2px;overflow:hidden}
.story-progress .bar .fill{height:100%;background:#fff;width:0;transition:width 3s linear}
.story-progress .bar.done .fill{width:100%}
.story-progress .bar.active .fill{width:100%;transition:width 3s linear}
.story-header{position:absolute;top:16px;left:12px;right:12px;display:flex;justify-content:space-between;align-items:center;z-index:10;color:#fff}
.story-close{background:none;border:none;color:#fff;font-size:1.5rem;cursor:pointer}
.story-content{flex:1;display:flex;align-items:center;justify-content:center;font-size:6rem}
.create-box{background:var(--surface);border-radius:12px;padding:24px;width:90%;max-width:400px}
.create-box h3{margin-bottom:16px;text-align:center}
.create-preview{width:100%;aspect-ratio:1;display:flex;align-items:center;justify-content:center;background:var(--bg);border:2px dashed var(--border);border-radius:8px;font-size:1rem;color:var(--text2);margin-bottom:12px;cursor:pointer}
.create-box textarea{width:100%;border:1px solid var(--border);border-radius:8px;padding:12px;font-family:var(--font);font-size:.95rem;resize:none;margin-bottom:12px}
.btn-share{width:100%;padding:12px;background:#0095f6;color:#fff;border:none;border-radius:8px;font-weight:700;font-size:1rem;cursor:pointer;margin-bottom:8px}
.btn-cancel{width:100%;padding:10px;background:none;border:1px solid var(--border);border-radius:8px;cursor:pointer;font-size:.9rem;color:var(--text2)}
.toast{position:fixed;bottom:80px;left:50%;transform:translateX(-50%) translateY(100px);background:#262626;color:#fff;padding:10px 20px;border-radius:8px;font-size:.9rem;transition:transform .3s;z-index:999}
.toast.show{transform:translateX(-50%) translateY(0)}
@media(min-width:768px){body{border-left:1px solid var(--border);border-right:1px solid var(--border)}}`;

const SOCIAL_JS = `document.addEventListener('DOMContentLoaded', function() {
  const users = [
    {id:1,name:'달칵_official',avatar:'🌟',color:'#e1306c'},{id:2,name:'travel_korea',avatar:'✈️',color:'#4facfe'},
    {id:3,name:'food_diary',avatar:'🍜',color:'#f093fb'},{id:4,name:'code_master',avatar:'💻',color:'#667eea'},
    {id:5,name:'fashion_k',avatar:'👗',color:'#a18cd1'},{id:6,name:'pet_love',avatar:'🐶',color:'#ffecd2'},
    {id:7,name:'music_vibes',avatar:'🎵',color:'#ff9a9e'},{id:8,name:'fit_life',avatar:'💪',color:'#38ef7d'},
    {id:9,name:'art_studio',avatar:'🎨',color:'#30cfd0'},{id:10,name:'book_worm',avatar:'📚',color:'#fc5c7d'},
  ];

  const posts = [
    {id:1,userId:2,gradient:'linear-gradient(135deg,#4facfe,#00f2fe)',caption:'제주도의 아침 🌅 #여행 #제주',likes:1234,comments:['너무 예뻐요!','여기 어디에요?','저도 가고싶다'],time:'2시간 전'},
    {id:2,userId:3,gradient:'linear-gradient(135deg,#f093fb,#f5576c)',caption:'오늘의 브런치 🥞 맛있다~ #맛집',likes:856,comments:['맛있겠다!','레시피 알려주세요'],time:'4시간 전'},
    {id:3,userId:4,gradient:'linear-gradient(135deg,#667eea,#764ba2)',caption:'새벽 코딩 💻 오늘도 화이팅 #개발자 #코딩',likes:2341,comments:['화이팅!','저도 코딩중...','대단해요'],time:'6시간 전'},
    {id:4,userId:5,gradient:'linear-gradient(135deg,#a18cd1,#fbc2eb)',caption:'오늘의 OOTD 👗 봄 코디 완성 #패션 #ootd',likes:3456,comments:['너무 예뻐요!','어디 옷이에요?','스타일 좋다'],time:'8시간 전'},
    {id:5,userId:6,gradient:'linear-gradient(135deg,#ffecd2,#fcb69f)',caption:'우리 댕댕이 산책 중 🐕 #강아지 #산책',likes:5678,comments:['귀여워!!','몇 살이에요?','너무 사랑스럽다'],time:'10시간 전'},
    {id:6,userId:7,gradient:'linear-gradient(135deg,#ff9a9e,#fecfef)',caption:'새 앨범 들으면서 작업 중 🎧 #음악 #chill',likes:987,comments:['무슨 앨범이에요?','좋은 취향!'],time:'12시간 전'},
    {id:7,userId:8,gradient:'linear-gradient(135deg,#38ef7d,#11998e)',caption:'오운완 💪 3개월 차 벌크업 기록 #운동 #헬스',likes:4321,comments:['대박!','루틴 공유해주세요','동기부여 됩니다'],time:'1일 전'},
    {id:8,userId:1,gradient:'linear-gradient(135deg,#e1306c,#833ab4)',caption:'달칵 2.0 업데이트 소식 🚀 #달칵 #업데이트',likes:7890,comments:['기대됩니다!','언제 출시?','대박 기능이다'],time:'1일 전'},
  ];

  let likedPosts = JSON.parse(localStorage.getItem('dg_liked') || '[]');
  let savedPosts = JSON.parse(localStorage.getItem('dg_saved') || '[]');
  let following = JSON.parse(localStorage.getItem('dg_following') || '[]');

  function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2000);
  }

  function renderStories() {
    const bar = document.getElementById('storiesBar');
    if (!bar) return;
    bar.innerHTML = '<div class="story-circle" data-id="my"><div class="story-avatar" style="background:#eee">➕</div><div class="story-name">내 스토리</div></div>' +
      users.map(u => \`<div class="story-circle" data-id="\${u.id}"><div class="story-avatar" style="background:\${u.color}">\${u.avatar}</div><div class="story-name">\${u.name}</div></div>\`).join('');
    bar.querySelectorAll('.story-circle').forEach(s => {
      s.addEventListener('click', () => {
        const id = s.dataset.id;
        if (id === 'my') { document.getElementById('createModal')?.classList.add('open'); return; }
        openStory(Number(id));
      });
    });
  }

  function openStory(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const modal = document.getElementById('storyModal');
    const content = document.getElementById('storyContent');
    const userEl = document.getElementById('storyUser');
    if (content) { content.style.background = user.color; content.textContent = user.avatar; }
    if (userEl) userEl.textContent = user.avatar + ' ' + user.name;
    const progress = document.getElementById('storyProgress');
    if (progress) { progress.innerHTML = '<div class="bar active"><div class="fill"></div></div>'; setTimeout(() => { const fill = progress.querySelector('.fill'); if (fill) fill.style.width = '100%'; }, 50); }
    modal?.classList.add('open');
    setTimeout(() => modal?.classList.remove('open'), 3500);
  }

  function renderFeed() {
    const feed = document.getElementById('feed');
    if (!feed) return;
    feed.innerHTML = posts.map(p => {
      const user = users.find(u => u.id === p.userId);
      if (!user) return '';
      const isLiked = likedPosts.includes(p.id);
      const isSaved = savedPosts.includes(p.id);
      const isFollowing = following.includes(p.userId);
      return \`<article class="post" data-id="\${p.id}">
        <div class="post-header">
          <div class="post-avatar" style="background:\${user.color}">\${user.avatar}</div>
          <span class="post-username">\${user.name}</span>
          \${!isFollowing ? '<button class="post-follow" data-uid="' + p.userId + '">팔로우</button>' : ''}
        </div>
        <div class="post-image" style="background:\${p.gradient}" data-pid="\${p.id}">\${user.avatar}</div>
        <div class="post-actions">
          <button class="like-btn" data-pid="\${p.id}">\${isLiked ? '❤️' : '🤍'}</button>
          <button>💬</button>
          <button>↗️</button>
          <button class="save save-btn" data-pid="\${p.id}">\${isSaved ? '🔖' : '🏷️'}</button>
        </div>
        <div class="post-likes">좋아요 \${(isLiked ? p.likes + 1 : p.likes).toLocaleString()}개</div>
        <div class="post-caption"><strong>\${user.name}</strong> <span>\${p.caption}</span></div>
        <div class="post-comments-link">댓글 \${p.comments.length}개 모두 보기</div>
        <div class="post-time">\${p.time}</div>
      </article>\`;
    }).join('');

    feed.querySelectorAll('.like-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pid = Number(btn.dataset.pid);
        const idx = likedPosts.indexOf(pid);
        if (idx >= 0) { likedPosts.splice(idx, 1); btn.textContent = '🤍'; } else { likedPosts.push(pid); btn.textContent = '❤️'; }
        localStorage.setItem('dg_liked', JSON.stringify(likedPosts));
        const likesEl = btn.closest('.post')?.querySelector('.post-likes');
        const post = posts.find(p => p.id === pid);
        if (likesEl && post) likesEl.textContent = '좋아요 ' + (likedPosts.includes(pid) ? post.likes + 1 : post.likes).toLocaleString() + '개';
      });
    });
    feed.querySelectorAll('.save-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const pid = Number(btn.dataset.pid);
        const idx = savedPosts.indexOf(pid);
        if (idx >= 0) { savedPosts.splice(idx, 1); btn.textContent = '🏷️'; } else { savedPosts.push(pid); btn.textContent = '🔖'; showToast('저장됨'); }
        localStorage.setItem('dg_saved', JSON.stringify(savedPosts));
      });
    });
    feed.querySelectorAll('.post-follow').forEach(btn => {
      btn.addEventListener('click', () => {
        const uid = Number(btn.dataset.uid);
        following.push(uid);
        localStorage.setItem('dg_following', JSON.stringify(following));
        btn.textContent = '팔로잉';
        btn.style.color = '#999';
        showToast('팔로우 했습니다');
      });
    });
    // Double-tap to like
    feed.querySelectorAll('.post-image').forEach(img => {
      let lastTap = 0;
      img.addEventListener('click', () => {
        const now = Date.now();
        if (now - lastTap < 300) {
          const pid = Number(img.dataset.pid);
          if (!likedPosts.includes(pid)) { likedPosts.push(pid); localStorage.setItem('dg_liked', JSON.stringify(likedPosts)); }
          const heart = document.createElement('div');
          heart.className = 'heart-anim';
          heart.textContent = '❤️';
          img.style.position = 'relative';
          img.appendChild(heart);
          setTimeout(() => heart.remove(), 800);
          const likeBtn = img.closest('.post')?.querySelector('.like-btn');
          if (likeBtn) likeBtn.textContent = '❤️';
          renderFeed();
        }
        lastTap = now;
      });
    });
  }

  document.getElementById('storyClose')?.addEventListener('click', () => document.getElementById('storyModal')?.classList.remove('open'));
  document.getElementById('createBtn')?.addEventListener('click', () => document.getElementById('createModal')?.classList.add('open'));
  document.getElementById('cancelCreate')?.addEventListener('click', () => document.getElementById('createModal')?.classList.remove('open'));
  document.getElementById('shareBtn')?.addEventListener('click', () => { document.getElementById('createModal')?.classList.remove('open'); showToast('게시물이 공유되었습니다!'); });
  document.querySelectorAll('.bnav').forEach(b => b.addEventListener('click', () => { document.querySelectorAll('.bnav').forEach(x => x.classList.remove('active')); b.classList.add('active'); }));

  renderStories();
  renderFeed();
});`;

// ═══════════════════════════════════════════════════════════════════════════
// ██  DASHBOARD (SaaS Style)  ██
// ═══════════════════════════════════════════════════════════════════════════
const DASH_HTML = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>📊 Dalkak Dashboard</title>
<link rel="stylesheet" href="style.css">
</head>
<body>
<aside class="sidebar" id="sidebar">
  <div class="sidebar-logo">📊 Dalkak</div>
  <nav class="sidebar-nav">
    <a class="nav-item active" data-page="dashboard">📈 대시보드</a>
    <a class="nav-item" data-page="orders">📦 주문</a>
    <a class="nav-item" data-page="users">👥 사용자</a>
    <a class="nav-item" data-page="products">🏷️ 상품</a>
    <a class="nav-item" data-page="analytics">📊 분석</a>
    <a class="nav-item" data-page="settings">⚙️ 설정</a>
  </nav>
</aside>
<div class="main-wrap">
  <header class="topbar">
    <button id="sidebarToggle">☰</button>
    <div class="breadcrumb">대시보드 / 개요</div>
    <div class="topbar-right">
      <div class="search-box"><input type="text" id="globalSearch" placeholder="검색..."></div>
      <button class="noti-btn">🔔 <span class="noti-badge">3</span></button>
      <div class="user-menu">👤 관리자</div>
    </div>
  </header>
  <main class="content">
    <div class="kpi-row" id="kpiRow"></div>
    <div class="charts-row">
      <div class="chart-card">
        <h3>월별 매출</h3>
        <div class="bar-chart" id="barChart"></div>
      </div>
      <div class="chart-card">
        <h3>카테고리 비율</h3>
        <div class="donut-wrap"><div class="donut" id="donut"></div><div class="donut-legend" id="donutLegend"></div></div>
      </div>
    </div>
    <div class="table-section">
      <div class="table-header">
        <h3>최근 주문</h3>
        <input type="text" id="tableSearch" placeholder="주문 검색...">
      </div>
      <table class="data-table" id="dataTable">
        <thead><tr><th data-sort="id">주문번호 ↕</th><th data-sort="customer">고객 ↕</th><th data-sort="amount">금액 ↕</th><th>상태</th><th data-sort="date">날짜 ↕</th></tr></thead>
        <tbody id="tableBody"></tbody>
      </table>
      <div class="pagination" id="pagination"></div>
    </div>
    <div class="activity-section">
      <h3>최근 활동</h3>
      <div class="activity-feed" id="activityFeed"></div>
    </div>
  </main>
</div>
<script src="script.js"></script>
</body>
</html>`;

const DASH_CSS = `@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
:root{--bg:#0f1117;--surface:#1a1d26;--surface2:#242832;--text:#e4e6eb;--text2:#8b8fa3;--accent:#6366f1;--accent2:#818cf8;--green:#22c55e;--red:#ef4444;--yellow:#eab308;--border:#2a2d38;--sidebar-w:240px;--font:'Pretendard',system-ui,sans-serif}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:var(--font);background:var(--bg);color:var(--text);display:flex;min-height:100vh}
.sidebar{width:var(--sidebar-w);background:var(--surface);border-right:1px solid var(--border);position:fixed;top:0;bottom:0;left:0;display:flex;flex-direction:column;z-index:50;transition:transform .3s}
.sidebar.collapsed{transform:translateX(calc(var(--sidebar-w)*-1))}
.sidebar-logo{padding:20px 24px;font-size:1.2rem;font-weight:800;border-bottom:1px solid var(--border)}
.sidebar-nav{padding:12px 0;flex:1}
.nav-item{display:flex;align-items:center;gap:12px;padding:12px 24px;color:var(--text2);cursor:pointer;transition:.2s;font-size:.9rem}
.nav-item:hover,.nav-item.active{color:var(--text);background:var(--surface2)}
.nav-item.active{border-right:3px solid var(--accent)}
.main-wrap{margin-left:var(--sidebar-w);flex:1;transition:margin .3s}
.main-wrap.expanded{margin-left:0}
.topbar{display:flex;align-items:center;gap:16px;padding:12px 24px;background:var(--surface);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:40}
.topbar button:first-child{background:none;border:none;color:var(--text);font-size:1.3rem;cursor:pointer}
.breadcrumb{font-size:.9rem;color:var(--text2);flex:1}
.topbar-right{display:flex;align-items:center;gap:16px}
.search-box input{background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:8px 16px;color:var(--text);font-size:.85rem;width:200px;outline:none}
.noti-btn{background:none;border:none;color:var(--text);font-size:1.1rem;cursor:pointer;position:relative}
.noti-badge{position:absolute;top:-4px;right:-8px;background:var(--red);color:#fff;font-size:.65rem;padding:1px 5px;border-radius:50%}
.user-menu{font-size:.9rem;color:var(--text2);cursor:pointer}
.content{padding:24px}
.kpi-row{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px}
.kpi-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:20px}
.kpi-label{font-size:.85rem;color:var(--text2);margin-bottom:8px}
.kpi-value{font-size:1.8rem;font-weight:800}
.kpi-trend{font-size:.8rem;margin-top:8px;display:flex;align-items:center;gap:4px}
.kpi-trend.up{color:var(--green)}
.kpi-trend.down{color:var(--red)}
.charts-row{display:grid;grid-template-columns:2fr 1fr;gap:16px;margin-bottom:24px}
.chart-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:20px}
.chart-card h3{font-size:1rem;margin-bottom:16px}
.bar-chart{display:flex;align-items:flex-end;gap:8px;height:200px;padding-top:20px}
.bar-col{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px}
.bar{width:100%;border-radius:4px 4px 0 0;background:var(--accent);transition:height .8s ease;min-height:4px}
.bar-label{font-size:.7rem;color:var(--text2)}
.donut-wrap{display:flex;align-items:center;gap:20px;justify-content:center}
.donut{width:140px;height:140px;border-radius:50%;position:relative}
.donut::after{content:'';position:absolute;inset:30%;border-radius:50%;background:var(--surface)}
.donut-legend{display:flex;flex-direction:column;gap:8px}
.legend-item{display:flex;align-items:center;gap:8px;font-size:.85rem}
.legend-dot{width:12px;height:12px;border-radius:50%}
.table-section{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:24px}
.table-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
.table-header input{background:var(--surface2);border:1px solid var(--border);border-radius:8px;padding:8px 12px;color:var(--text);font-size:.85rem;width:200px;outline:none}
.data-table{width:100%;border-collapse:collapse}
.data-table th{text-align:left;padding:12px;font-size:.85rem;color:var(--text2);border-bottom:1px solid var(--border);cursor:pointer;user-select:none}
.data-table th:hover{color:var(--accent)}
.data-table td{padding:12px;font-size:.9rem;border-bottom:1px solid var(--border)}
.status-badge{padding:4px 12px;border-radius:20px;font-size:.75rem;font-weight:600}
.status-badge.delivered{background:rgba(34,197,94,.15);color:var(--green)}
.status-badge.shipping{background:rgba(99,102,241,.15);color:var(--accent2)}
.status-badge.cancelled{background:rgba(239,68,68,.15);color:var(--red)}
.status-badge.pending{background:rgba(234,179,8,.15);color:var(--yellow)}
.pagination{display:flex;justify-content:center;gap:8px;margin-top:16px}
.page-btn{background:var(--surface2);border:1px solid var(--border);color:var(--text);padding:6px 12px;border-radius:6px;cursor:pointer;font-size:.85rem}
.page-btn.active{background:var(--accent);border-color:var(--accent);color:#fff}
.activity-section{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:20px}
.activity-section h3{margin-bottom:16px}
.activity-feed{display:flex;flex-direction:column;gap:12px}
.activity-item{display:flex;gap:12px;padding:8px 0;border-bottom:1px solid var(--border);align-items:center}
.activity-icon{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0}
.activity-text{flex:1;font-size:.9rem}
.activity-time{font-size:.8rem;color:var(--text2);white-space:nowrap}
@media(max-width:1024px){.kpi-row{grid-template-columns:repeat(2,1fr)}.charts-row{grid-template-columns:1fr}}
@media(max-width:768px){.sidebar{transform:translateX(calc(var(--sidebar-w)*-1))}.sidebar.open{transform:none}.main-wrap{margin-left:0}.kpi-row{grid-template-columns:1fr}.topbar-right .search-box{display:none}}`;

const DASH_JS = `document.addEventListener('DOMContentLoaded', function() {
  const kpis = [
    {label:'총 매출',value:'₩12,450,000',trend:'+12.5%',up:true,icon:'💰'},
    {label:'총 주문',value:'1,234',trend:'+8.2%',up:true,icon:'📦'},
    {label:'신규 사용자',value:'567',trend:'+23.1%',up:true,icon:'👥'},
    {label:'전환율',value:'3.24%',trend:'-0.5%',up:false,icon:'📈'},
  ];

  const orders = [
    {id:'ORD-001',customer:'김민수',email:'minsu@email.com',amount:89000,status:'delivered',date:'2026-02-25'},
    {id:'ORD-002',customer:'이지은',email:'jieun@email.com',amount:156000,status:'shipping',date:'2026-02-24'},
    {id:'ORD-003',customer:'박서준',email:'seojun@email.com',amount:45000,status:'pending',date:'2026-02-24'},
    {id:'ORD-004',customer:'최유리',email:'yuri@email.com',amount:234000,status:'delivered',date:'2026-02-23'},
    {id:'ORD-005',customer:'정다현',email:'dahyun@email.com',amount:67000,status:'cancelled',date:'2026-02-23'},
    {id:'ORD-006',customer:'한동훈',email:'donghun@email.com',amount:178000,status:'delivered',date:'2026-02-22'},
    {id:'ORD-007',customer:'윤서아',email:'seoa@email.com',amount:92000,status:'shipping',date:'2026-02-22'},
    {id:'ORD-008',customer:'송민호',email:'minho@email.com',amount:310000,status:'delivered',date:'2026-02-21'},
    {id:'ORD-009',customer:'강예린',email:'yerin@email.com',amount:54000,status:'pending',date:'2026-02-21'},
    {id:'ORD-010',customer:'임재범',email:'jaebum@email.com',amount:125000,status:'delivered',date:'2026-02-20'},
    {id:'ORD-011',customer:'오세훈',email:'sehun@email.com',amount:198000,status:'shipping',date:'2026-02-20'},
    {id:'ORD-012',customer:'나연서',email:'yeonseo@email.com',amount:76000,status:'delivered',date:'2026-02-19'},
    {id:'ORD-013',customer:'배수지',email:'suji@email.com',amount:145000,status:'cancelled',date:'2026-02-19'},
    {id:'ORD-014',customer:'조현우',email:'hyunwoo@email.com',amount:267000,status:'delivered',date:'2026-02-18'},
    {id:'ORD-015',customer:'신예은',email:'yeeun@email.com',amount:83000,status:'pending',date:'2026-02-18'},
    {id:'ORD-016',customer:'류현진',email:'hyunjin@email.com',amount:412000,status:'delivered',date:'2026-02-17'},
    {id:'ORD-017',customer:'김소현',email:'sohyun@email.com',amount:59000,status:'shipping',date:'2026-02-17'},
    {id:'ORD-018',customer:'이동욱',email:'dongwook@email.com',amount:189000,status:'delivered',date:'2026-02-16'},
    {id:'ORD-019',customer:'문가영',email:'gayoung@email.com',amount:134000,status:'pending',date:'2026-02-16'},
    {id:'ORD-020',customer:'차은우',email:'eunwoo@email.com',amount:278000,status:'delivered',date:'2026-02-15'},
  ];

  const monthlyData = [
    {month:'1월',value:8200},{month:'2월',value:9500},{month:'3월',value:7800},{month:'4월',value:11200},
    {month:'5월',value:10400},{month:'6월',value:12100},{month:'7월',value:9800},{month:'8월',value:13500},
    {month:'9월',value:11800},{month:'10월',value:14200},{month:'11월',value:12800},{month:'12월',value:15600},
  ];

  const categories = [
    {name:'아우터',pct:35,color:'#6366f1'},{name:'상의',pct:25,color:'#22c55e'},
    {name:'하의',pct:20,color:'#eab308'},{name:'신발',pct:12,color:'#ef4444'},{name:'기타',pct:8,color:'#8b8fa3'},
  ];

  const activities = [
    {icon:'📦',text:'주문 ORD-001이 배송 완료되었습니다',time:'5분 전',color:'#22c55e'},
    {icon:'👤',text:'신규 사용자 김민수님이 가입했습니다',time:'15분 전',color:'#6366f1'},
    {icon:'💰',text:'₩234,000 결제가 완료되었습니다',time:'30분 전',color:'#eab308'},
    {icon:'🔔',text:'재고 부족 알림: 오버사이즈 블레이저 (잔여 3개)',time:'1시간 전',color:'#ef4444'},
    {icon:'⭐',text:'새 리뷰가 등록되었습니다 (★★★★★)',time:'2시간 전',color:'#f093fb'},
  ];

  let currentPage = 1;
  const pageSize = 5;
  let sortField = '';
  let sortAsc = true;
  let filteredOrders = [...orders];

  // KPIs
  function renderKpis() {
    const row = document.getElementById('kpiRow');
    if (!row) return;
    row.innerHTML = kpis.map(k => \`<div class="kpi-card">
      <div class="kpi-label">\${k.icon} \${k.label}</div>
      <div class="kpi-value">\${k.value}</div>
      <div class="kpi-trend \${k.up ? 'up' : 'down'}">\${k.up ? '↑' : '↓'} \${k.trend}</div>
    </div>\`).join('');
  }

  // Bar chart
  function renderBarChart() {
    const chart = document.getElementById('barChart');
    if (!chart) return;
    const maxVal = Math.max(...monthlyData.map(d => d.value));
    chart.innerHTML = monthlyData.map(d => {
      const h = Math.round((d.value / maxVal) * 180);
      return \`<div class="bar-col"><div class="bar" style="height:\${h}px" title="₩\${(d.value * 1000).toLocaleString()}"></div><span class="bar-label">\${d.month}</span></div>\`;
    }).join('');
    // Animate bars
    setTimeout(() => chart.querySelectorAll('.bar').forEach(b => { const h = b.style.height; b.style.height = '4px'; requestAnimationFrame(() => b.style.height = h); }), 100);
  }

  // Donut chart
  function renderDonut() {
    const donut = document.getElementById('donut');
    const legend = document.getElementById('donutLegend');
    if (!donut || !legend) return;
    let cumPct = 0;
    const gradientParts = categories.map(c => { const start = cumPct; cumPct += c.pct; return \`\${c.color} \${start}% \${cumPct}%\`; });
    donut.style.background = \`conic-gradient(\${gradientParts.join(',')})\`;
    legend.innerHTML = categories.map(c => \`<div class="legend-item"><div class="legend-dot" style="background:\${c.color}"></div>\${c.name} \${c.pct}%</div>\`).join('');
  }

  // Data table
  function renderTable() {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;
    const start = (currentPage - 1) * pageSize;
    const pageData = filteredOrders.slice(start, start + pageSize);
    const statusMap = {delivered:'배송완료',shipping:'배송중',pending:'준비중',cancelled:'취소'};
    tbody.innerHTML = pageData.map(o => \`<tr>
      <td>\${o.id}</td><td>\${o.customer}</td><td>₩\${o.amount.toLocaleString()}</td>
      <td><span class="status-badge \${o.status}">\${statusMap[o.status]}</span></td><td>\${o.date}</td>
    </tr>\`).join('');
    renderPagination();
  }

  function renderPagination() {
    const pg = document.getElementById('pagination');
    if (!pg) return;
    const totalPages = Math.ceil(filteredOrders.length / pageSize);
    pg.innerHTML = Array.from({length: totalPages}, (_, i) =>
      \`<button class="page-btn \${i + 1 === currentPage ? 'active' : ''}" data-page="\${i + 1}">\${i + 1}</button>\`
    ).join('');
    pg.querySelectorAll('.page-btn').forEach(b => b.addEventListener('click', () => { currentPage = Number(b.dataset.page); renderTable(); }));
  }

  // Table sort
  document.querySelectorAll('.data-table th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const field = th.dataset.sort;
      if (sortField === field) sortAsc = !sortAsc; else { sortField = field; sortAsc = true; }
      filteredOrders.sort((a, b) => {
        const va = a[field], vb = b[field];
        if (typeof va === 'number') return sortAsc ? va - vb : vb - va;
        return sortAsc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
      });
      currentPage = 1;
      renderTable();
    });
  });

  // Table search
  document.getElementById('tableSearch')?.addEventListener('input', function() {
    const q = this.value.toLowerCase();
    filteredOrders = q ? orders.filter(o => o.customer.toLowerCase().includes(q) || o.id.toLowerCase().includes(q)) : [...orders];
    currentPage = 1;
    renderTable();
  });

  // Activity feed
  function renderActivity() {
    const feed = document.getElementById('activityFeed');
    if (!feed) return;
    feed.innerHTML = activities.map(a => \`<div class="activity-item">
      <div class="activity-icon" style="background:\${a.color}20">\${a.icon}</div>
      <div class="activity-text">\${a.text}</div>
      <div class="activity-time">\${a.time}</div>
    </div>\`).join('');
  }

  // Sidebar toggle
  document.getElementById('sidebarToggle')?.addEventListener('click', () => {
    const sb = document.getElementById('sidebar');
    const mw = document.querySelector('.main-wrap');
    sb?.classList.toggle('collapsed');
    sb?.classList.toggle('open');
    mw?.classList.toggle('expanded');
  });

  // Sidebar nav
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(n => {
    n.addEventListener('click', () => {
      document.querySelectorAll('.sidebar-nav .nav-item').forEach(x => x.classList.remove('active'));
      n.classList.add('active');
    });
  });

  renderKpis();
  renderBarChart();
  renderDonut();
  renderTable();
  renderActivity();
});`;

// ═══════════════════════════════════════════════════════════════════════════
// ██  EXPORT  ██
// ═══════════════════════════════════════════════════════════════════════════
export const TEMPLATES4: Array<{
  keywords: string[];
  name: string;
  icon: string;
  description: string;
  category: "platform";
  files: FilesMap;
}> = [
  {
    keywords: ["쇼핑몰", "이커머스", "e-commerce", "ecommerce", "무신사", "쿠팡", "온라인스토어", "패션몰"],
    name: "쇼핑몰", icon: "🛍️", description: "무신사 스타일 패션 이커머스 — 상품 그리드, 장바구니, 결제, 필터", category: "platform",
    files: {
      "index.html": { name: "index.html", language: "html", content: ECOM_HTML },
      "style.css": { name: "style.css", language: "css", content: ECOM_CSS },
      "script.js": { name: "script.js", language: "javascript", content: ECOM_JS },
    },
  },
  {
    keywords: ["유튜브", "youtube", "동영상 플랫폼", "video platform", "비디오 사이트"],
    name: "비디오 플랫폼", icon: "📺", description: "유튜브 스타일 동영상 플랫폼 — 비디오 그리드, 플레이어, 사이드바", category: "platform",
    files: {
      "index.html": { name: "index.html", language: "html", content: VIDEO_HTML },
      "style.css": { name: "style.css", language: "css", content: VIDEO_CSS },
      "script.js": { name: "script.js", language: "javascript", content: VIDEO_JS },
    },
  },
  {
    keywords: ["인스타", "instagram", "sns", "소셜미디어", "social media", "소셜 피드"],
    name: "소셜 피드", icon: "📱", description: "인스타그램 스타일 소셜 미디어 — 피드, 스토리, 좋아요, 팔로우", category: "platform",
    files: {
      "index.html": { name: "index.html", language: "html", content: SOCIAL_HTML },
      "style.css": { name: "style.css", language: "css", content: SOCIAL_CSS },
      "script.js": { name: "script.js", language: "javascript", content: SOCIAL_JS },
    },
  },
  {
    keywords: ["대시보드", "dashboard", "admin", "관리자", "어드민", "백오피스"],
    name: "대시보드", icon: "📊", description: "SaaS 관리자 대시보드 — KPI 카드, 차트, 데이터 테이블, 활동 피드", category: "platform",
    files: {
      "index.html": { name: "index.html", language: "html", content: DASH_HTML },
      "style.css": { name: "style.css", language: "css", content: DASH_CSS },
      "script.js": { name: "script.js", language: "javascript", content: DASH_JS },
    },
  },
];
