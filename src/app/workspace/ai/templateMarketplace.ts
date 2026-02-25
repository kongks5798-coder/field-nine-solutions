// ─── Template Marketplace & Project Forking ──────────────────────────────────
// Provides a curated library of project templates and forking utilities
// for the FieldNine workspace IDE.

// ─── Types ───────────────────────────────────────────────────────────────────

export type TemplateCategory =
  | "starter"
  | "ecommerce"
  | "dashboard"
  | "game"
  | "social"
  | "portfolio"
  | "tool"
  | "ai";

export type MarketplaceTemplate = {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  icon: string;
  author: string;
  stars: number;
  forks: number;
  tags: string[];
  files: Record<string, string>;
  preview?: string;
  createdAt: string;
};

export type ForkResult = {
  projectId: string;
  projectName: string;
  fileCount: number;
};

// ─── Constants ───────────────────────────────────────────────────────────────

export const TEMPLATE_CATEGORIES: {
  id: TemplateCategory;
  label: string;
  icon: string;
}[] = [
  { id: "starter", label: "Starter", icon: "\u{1F680}" },
  { id: "ecommerce", label: "E-Commerce", icon: "\u{1F6D2}" },
  { id: "dashboard", label: "Dashboard", icon: "\u{1F4CA}" },
  { id: "game", label: "Game", icon: "\u{1F3AE}" },
  { id: "social", label: "Social", icon: "\u{1F4AC}" },
  { id: "portfolio", label: "Portfolio", icon: "\u{1F3A8}" },
  { id: "tool", label: "Tool", icon: "\u{1F527}" },
  { id: "ai", label: "AI", icon: "\u{1F916}" },
];

// ─── ID Generation ───────────────────────────────────────────────────────────

function generateId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const segments = [8, 4, 4];
  return segments
    .map((len) =>
      Array.from({ length: len }, () =>
        chars[Math.floor(Math.random() * chars.length)]
      ).join("")
    )
    .join("-");
}

// ─── Built-in Templates ──────────────────────────────────────────────────────

const BUILTIN_TEMPLATES: MarketplaceTemplate[] = [
  // 1 ── React Starter ────────────────────────────────────────────────────────
  {
    id: "tpl-react-starter",
    name: "React Starter",
    description:
      "A minimal React application with component structure, hooks, and modern styling.",
    category: "starter",
    icon: "\u269B\uFE0F",
    author: "FieldNine",
    stars: 342,
    forks: 128,
    tags: ["react", "starter", "hooks", "components"],
    createdAt: "2025-06-15",
    files: {
      "index.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>React Starter</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div id="root"></div>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script type="text/babel" src="App.jsx"></script>
</body>
</html>`,
      "App.jsx": `const { useState } = React;

function Header() {
  return (
    <header className="header">
      <h1>\u269B\uFE0F React Starter</h1>
      <p>Edit <code>App.jsx</code> to get started</p>
    </header>
  );
}

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div className="card">
      <h2>Counter</h2>
      <p className="count">{count}</p>
      <div className="btn-group">
        <button onClick={() => setCount(c => c - 1)}>-</button>
        <button onClick={() => setCount(0)}>Reset</button>
        <button onClick={() => setCount(c => c + 1)}>+</button>
      </div>
    </div>
  );
}

function FeatureList() {
  const features = ["Component-based", "Hooks ready", "Fast refresh", "Modern CSS"];
  return (
    <div className="card">
      <h2>Features</h2>
      <ul className="features">
        {features.map((f, i) => <li key={i}>\u2705 {f}</li>)}
      </ul>
    </div>
  );
}

function App() {
  return (
    <div className="app">
      <Header />
      <main className="main">
        <Counter />
        <FeatureList />
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);`,
      "styles.css": `* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f0f23; color: #e0e0e0; min-height: 100vh; }
.app { max-width: 800px; margin: 0 auto; padding: 2rem; }
.header { text-align: center; padding: 3rem 0; }
.header h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
.header code { background: #1e1e3f; padding: 0.2em 0.5em; border-radius: 4px; color: #7c7cff; }
.main { display: grid; gap: 1.5rem; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); }
.card { background: #1a1a2e; border-radius: 12px; padding: 1.5rem; border: 1px solid #2a2a4a; }
.card h2 { margin-bottom: 1rem; color: #7c7cff; }
.count { font-size: 3rem; text-align: center; padding: 1rem 0; font-weight: bold; }
.btn-group { display: flex; gap: 0.5rem; justify-content: center; }
.btn-group button { padding: 0.5rem 1.5rem; border: none; border-radius: 8px; background: #7c7cff; color: #fff; cursor: pointer; font-size: 1rem; transition: background 0.2s; }
.btn-group button:hover { background: #5a5aff; }
.features { list-style: none; }
.features li { padding: 0.5rem 0; border-bottom: 1px solid #2a2a4a; }
.features li:last-child { border-bottom: none; }`,
    },
  },

  // 2 ── E-Commerce Store ─────────────────────────────────────────────────────
  {
    id: "tpl-ecommerce-store",
    name: "E-Commerce Store",
    description:
      "Product listing with cart functionality, quantity controls, and checkout summary.",
    category: "ecommerce",
    icon: "\u{1F6D2}",
    author: "FieldNine",
    stars: 287,
    forks: 95,
    tags: ["ecommerce", "cart", "shop", "products"],
    createdAt: "2025-07-02",
    files: {
      "index.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ShopNine Store</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <header>
    <h1>\u{1F6D2} ShopNine</h1>
    <button id="cartBtn" class="cart-btn">Cart (<span id="cartCount">0</span>)</button>
  </header>
  <main id="products" class="products"></main>
  <aside id="cartPanel" class="cart-panel hidden">
    <h2>Shopping Cart</h2>
    <div id="cartItems"></div>
    <div id="cartTotal" class="cart-total"></div>
    <button id="checkoutBtn" class="checkout-btn">Checkout</button>
  </aside>
  <script src="app.js"></script>
</body>
</html>`,
      "styles.css": `* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; color: #333; }
header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; background: #1a73e8; color: #fff; position: sticky; top: 0; z-index: 10; }
header h1 { font-size: 1.5rem; }
.cart-btn { background: #fff; color: #1a73e8; border: none; padding: 0.5rem 1rem; border-radius: 20px; cursor: pointer; font-weight: 600; }
.products { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1.5rem; padding: 2rem; max-width: 1200px; margin: 0 auto; }
.product-card { background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); transition: transform 0.2s; }
.product-card:hover { transform: translateY(-4px); }
.product-img { width: 100%; height: 180px; display: flex; align-items: center; justify-content: center; font-size: 4rem; background: #f0f4ff; }
.product-info { padding: 1rem; }
.product-info h3 { margin-bottom: 0.3rem; }
.product-info .price { color: #1a73e8; font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; }
.product-info .desc { font-size: 0.85rem; color: #666; margin-bottom: 0.75rem; }
.add-btn { width: 100%; padding: 0.5rem; background: #1a73e8; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-size: 0.9rem; }
.add-btn:hover { background: #1557b0; }
.cart-panel { position: fixed; top: 0; right: 0; width: 360px; height: 100vh; background: #fff; box-shadow: -4px 0 16px rgba(0,0,0,0.1); padding: 1.5rem; overflow-y: auto; z-index: 20; transition: transform 0.3s; }
.cart-panel.hidden { transform: translateX(100%); }
.cart-panel h2 { margin-bottom: 1rem; }
.cart-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid #eee; }
.cart-item-controls button { width: 28px; height: 28px; border: 1px solid #ddd; background: #fff; cursor: pointer; border-radius: 4px; }
.cart-total { padding: 1rem 0; font-size: 1.2rem; font-weight: 700; text-align: right; }
.checkout-btn { width: 100%; padding: 0.75rem; background: #34a853; color: #fff; border: none; border-radius: 8px; font-size: 1rem; cursor: pointer; }`,
      "app.js": `const products = [
  { id: 1, name: "Wireless Headphones", price: 79.99, emoji: "\u{1F3A7}", desc: "Noise-cancelling over-ear headphones" },
  { id: 2, name: "Mechanical Keyboard", price: 129.99, emoji: "\u2328\uFE0F", desc: "RGB backlit tactile switches" },
  { id: 3, name: "Smart Watch", price: 199.99, emoji: "\u231A", desc: "Fitness tracking, notifications" },
  { id: 4, name: "USB-C Hub", price: 49.99, emoji: "\u{1F50C}", desc: "7-in-1 multiport adapter" },
  { id: 5, name: "Webcam HD", price: 69.99, emoji: "\u{1F4F7}", desc: "1080p autofocus with mic" },
  { id: 6, name: "Desk Lamp", price: 39.99, emoji: "\u{1F4A1}", desc: "LED adjustable brightness" },
];

let cart = [];

function renderProducts() {
  const el = document.getElementById("products");
  el.innerHTML = products.map(p => \`
    <div class="product-card">
      <div class="product-img">\${p.emoji}</div>
      <div class="product-info">
        <h3>\${p.name}</h3>
        <div class="price">$\${p.price.toFixed(2)}</div>
        <div class="desc">\${p.desc}</div>
        <button class="add-btn" onclick="addToCart(\${p.id})">Add to Cart</button>
      </div>
    </div>
  \`).join("");
}

function addToCart(id) {
  const existing = cart.find(i => i.id === id);
  if (existing) { existing.qty++; } else {
    const p = products.find(p => p.id === id);
    cart.push({ ...p, qty: 1 });
  }
  updateCart();
}

function removeFromCart(id) {
  const idx = cart.findIndex(i => i.id === id);
  if (idx !== -1) {
    cart[idx].qty--;
    if (cart[idx].qty <= 0) cart.splice(idx, 1);
  }
  updateCart();
}

function updateCart() {
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const count = cart.reduce((s, i) => s + i.qty, 0);
  document.getElementById("cartCount").textContent = count;
  document.getElementById("cartItems").innerHTML = cart.map(i => \`
    <div class="cart-item">
      <span>\${i.emoji} \${i.name} x\${i.qty}</span>
      <span class="cart-item-controls">
        <button onclick="removeFromCart(\${i.id})">-</button>
        <button onclick="addToCart(\${i.id})">+</button>
      </span>
    </div>
  \`).join("");
  document.getElementById("cartTotal").textContent = "Total: $" + total.toFixed(2);
}

document.getElementById("cartBtn").addEventListener("click", () => {
  document.getElementById("cartPanel").classList.toggle("hidden");
});

document.getElementById("checkoutBtn").addEventListener("click", () => {
  if (cart.length === 0) { alert("Cart is empty!"); return; }
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  alert("Order placed! Total: $" + total.toFixed(2));
  cart = [];
  updateCart();
});

renderProducts();`,
    },
  },

  // 3 ── Admin Dashboard ──────────────────────────────────────────────────────
  {
    id: "tpl-admin-dashboard",
    name: "Admin Dashboard",
    description:
      "Analytics dashboard with stat cards, a chart area, and data tables.",
    category: "dashboard",
    icon: "\u{1F4CA}",
    author: "FieldNine",
    stars: 412,
    forks: 167,
    tags: ["dashboard", "admin", "charts", "analytics"],
    createdAt: "2025-05-20",
    files: {
      "index.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Admin Dashboard</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <nav class="sidebar">
    <div class="logo">\u{1F4CA} Dashboard</div>
    <a href="#" class="nav-item active">Overview</a>
    <a href="#" class="nav-item">Analytics</a>
    <a href="#" class="nav-item">Users</a>
    <a href="#" class="nav-item">Settings</a>
  </nav>
  <main class="main">
    <header class="topbar">
      <h1>Overview</h1>
      <span class="user-badge">Admin \u{1F464}</span>
    </header>
    <section class="stats" id="stats"></section>
    <section class="charts">
      <div class="chart-card">
        <h3>Revenue (last 7 days)</h3>
        <canvas id="chart" width="600" height="220"></canvas>
      </div>
      <div class="chart-card">
        <h3>Recent Orders</h3>
        <table class="data-table">
          <thead><tr><th>Order</th><th>Customer</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody id="orders"></tbody>
        </table>
      </div>
    </section>
  </main>
  <script src="app.js"></script>
</body>
</html>`,
      "styles.css": `* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; min-height: 100vh; background: #f0f2f5; color: #333; }
.sidebar { width: 220px; background: #1a1a2e; color: #ccc; padding: 1.5rem 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
.logo { font-size: 1.3rem; font-weight: 700; color: #fff; margin-bottom: 1.5rem; }
.nav-item { color: #aaa; text-decoration: none; padding: 0.6rem 0.8rem; border-radius: 8px; transition: background 0.2s; }
.nav-item.active, .nav-item:hover { background: #2a2a4a; color: #fff; }
.main { flex: 1; padding: 1.5rem 2rem; overflow-y: auto; }
.topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.user-badge { background: #e8eaff; padding: 0.4rem 0.8rem; border-radius: 20px; font-size: 0.85rem; }
.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
.stat-card { background: #fff; padding: 1.25rem; border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.stat-card .label { font-size: 0.85rem; color: #888; margin-bottom: 0.3rem; }
.stat-card .value { font-size: 1.8rem; font-weight: 700; }
.stat-card .change { font-size: 0.8rem; margin-top: 0.3rem; }
.change.up { color: #34a853; }
.change.down { color: #ea4335; }
.charts { display: grid; grid-template-columns: 1.2fr 1fr; gap: 1rem; }
.chart-card { background: #fff; padding: 1.25rem; border-radius: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.chart-card h3 { margin-bottom: 1rem; font-size: 1rem; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { text-align: left; padding: 0.6rem 0.5rem; border-bottom: 1px solid #eee; font-size: 0.85rem; }
.status { padding: 0.2rem 0.6rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
.status.completed { background: #e6f4ea; color: #34a853; }
.status.pending { background: #fef7e0; color: #f9ab00; }
.status.cancelled { background: #fce8e6; color: #ea4335; }
@media(max-width: 900px) { .charts { grid-template-columns: 1fr; } .sidebar { display: none; } }`,
      "app.js": `const statsData = [
  { label: "Revenue", value: "$48,250", change: "+12.5%", up: true },
  { label: "Orders", value: "1,284", change: "+8.2%", up: true },
  { label: "Customers", value: "3,721", change: "+5.1%", up: true },
  { label: "Refunds", value: "$1,040", change: "-2.3%", up: false },
];

document.getElementById("stats").innerHTML = statsData.map(s => \`
  <div class="stat-card">
    <div class="label">\${s.label}</div>
    <div class="value">\${s.value}</div>
    <div class="change \${s.up ? "up" : "down"}">\${s.change} vs last week</div>
  </div>
\`).join("");

const orders = [
  { id: "#1042", customer: "Alice Johnson", amount: "$245.00", status: "completed" },
  { id: "#1041", customer: "Bob Smith", amount: "$89.50", status: "pending" },
  { id: "#1040", customer: "Carol Davis", amount: "$312.00", status: "completed" },
  { id: "#1039", customer: "Dan Wilson", amount: "$67.25", status: "cancelled" },
  { id: "#1038", customer: "Eve Martinez", amount: "$198.00", status: "completed" },
];

document.getElementById("orders").innerHTML = orders.map(o => \`
  <tr>
    <td>\${o.id}</td>
    <td>\${o.customer}</td>
    <td>\${o.amount}</td>
    <td><span class="status \${o.status}">\${o.status}</span></td>
  </tr>
\`).join("");

// Simple bar chart on canvas
const canvas = document.getElementById("chart");
const ctx = canvas.getContext("2d");
const data = [4200, 5800, 3900, 6700, 5200, 7100, 6400];
const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const max = Math.max(...data);
const barW = 50, gap = 25, offsetX = 40, offsetY = 30;
ctx.fillStyle = "#f0f2f5";
ctx.fillRect(0, 0, canvas.width, canvas.height);
data.forEach((v, i) => {
  const h = (v / max) * 160;
  const x = offsetX + i * (barW + gap);
  const y = canvas.height - offsetY - h;
  ctx.fillStyle = "#4285f4";
  ctx.beginPath();
  ctx.roundRect(x, y, barW, h, 4);
  ctx.fill();
  ctx.fillStyle = "#666";
  ctx.font = "12px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(labels[i], x + barW / 2, canvas.height - 8);
  ctx.fillText("$" + (v / 1000).toFixed(1) + "k", x + barW / 2, y - 6);
});`,
    },
  },

  // 4 ── Snake Game ───────────────────────────────────────────────────────────
  {
    id: "tpl-snake-game",
    name: "Snake Game",
    description:
      "Classic snake game with arrow key controls, score tracking, and increasing difficulty.",
    category: "game",
    icon: "\u{1F40D}",
    author: "FieldNine",
    stars: 523,
    forks: 214,
    tags: ["game", "snake", "canvas", "arcade"],
    createdAt: "2025-04-10",
    files: {
      "index.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Snake Game</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div class="container">
    <h1>\u{1F40D} Snake</h1>
    <div class="score-bar">
      <span>Score: <strong id="score">0</strong></span>
      <span>High: <strong id="high">0</strong></span>
    </div>
    <canvas id="game" width="400" height="400"></canvas>
    <p id="msg" class="msg">Press any arrow key to start</p>
  </div>
  <script src="game.js"></script>
</body>
</html>`,
      "styles.css": `* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Segoe UI', sans-serif; background: #0a0a1a; color: #e0e0e0; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
.container { text-align: center; }
h1 { font-size: 2rem; margin-bottom: 0.5rem; }
.score-bar { display: flex; gap: 2rem; justify-content: center; margin-bottom: 0.75rem; font-size: 1.1rem; }
canvas { background: #111; border: 2px solid #333; border-radius: 8px; display: block; margin: 0 auto; }
.msg { margin-top: 0.75rem; color: #888; font-size: 0.9rem; min-height: 1.2em; }`,
      "game.js": `const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const SIZE = 20, COLS = canvas.width / SIZE, ROWS = canvas.height / SIZE;
let snake, dir, food, score, highScore = 0, running = false, gameOver = false, interval;

function init() {
  snake = [{ x: 10, y: 10 }];
  dir = { x: 0, y: 0 };
  score = 0;
  gameOver = false;
  placeFood();
  update();
}

function placeFood() {
  food = {
    x: Math.floor(Math.random() * COLS),
    y: Math.floor(Math.random() * ROWS),
  };
  if (snake.some(s => s.x === food.x && s.y === food.y)) placeFood();
}

function draw() {
  ctx.fillStyle = "#111";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Grid lines
  ctx.strokeStyle = "#1a1a2a";
  for (let i = 0; i < COLS; i++) { ctx.beginPath(); ctx.moveTo(i * SIZE, 0); ctx.lineTo(i * SIZE, canvas.height); ctx.stroke(); }
  for (let i = 0; i < ROWS; i++) { ctx.beginPath(); ctx.moveTo(0, i * SIZE); ctx.lineTo(canvas.width, i * SIZE); ctx.stroke(); }
  // Food
  ctx.fillStyle = "#ea4335";
  ctx.beginPath();
  ctx.arc(food.x * SIZE + SIZE / 2, food.y * SIZE + SIZE / 2, SIZE / 2 - 2, 0, Math.PI * 2);
  ctx.fill();
  // Snake
  snake.forEach((s, i) => {
    ctx.fillStyle = i === 0 ? "#34a853" : "#2d8c46";
    ctx.fillRect(s.x * SIZE + 1, s.y * SIZE + 1, SIZE - 2, SIZE - 2);
  });
  document.getElementById("score").textContent = score;
  document.getElementById("high").textContent = highScore;
}

function update() {
  if (gameOver) return;
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS || snake.some(s => s.x === head.x && s.y === head.y)) {
    gameOver = true;
    if (score > highScore) highScore = score;
    document.getElementById("msg").textContent = "Game Over! Press any arrow key to restart";
    clearInterval(interval);
    draw();
    return;
  }
  snake.unshift(head);
  if (head.x === food.x && head.y === food.y) {
    score += 10;
    placeFood();
    clearInterval(interval);
    interval = setInterval(update, Math.max(60, 120 - score));
  } else {
    snake.pop();
  }
  draw();
}

document.addEventListener("keydown", (e) => {
  const dirs = { ArrowUp: {x:0,y:-1}, ArrowDown: {x:0,y:1}, ArrowLeft: {x:-1,y:0}, ArrowRight: {x:1,y:0} };
  const d = dirs[e.key];
  if (!d) return;
  e.preventDefault();
  if (gameOver || !running) { running = true; init(); }
  if (d.x !== -dir.x || d.y !== -dir.y) dir = d;
  if (!interval) interval = setInterval(update, 120);
});

draw();`,
    },
  },

  // 5 ── Chat Application ─────────────────────────────────────────────────────
  {
    id: "tpl-chat-app",
    name: "Chat Application",
    description:
      "Real-time chat UI with message bubbles, user list, and typing indicator.",
    category: "social",
    icon: "\u{1F4AC}",
    author: "FieldNine",
    stars: 198,
    forks: 76,
    tags: ["chat", "social", "messaging", "realtime"],
    createdAt: "2025-08-05",
    files: {
      "index.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Chat App</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div class="chat-app">
    <aside class="sidebar">
      <h2>\u{1F4AC} Chats</h2>
      <div class="user-list" id="users"></div>
    </aside>
    <main class="chat-main">
      <header class="chat-header" id="chatHeader">Select a conversation</header>
      <div class="messages" id="messages"></div>
      <div class="typing" id="typing"></div>
      <form class="input-bar" id="inputForm">
        <input type="text" id="msgInput" placeholder="Type a message..." autocomplete="off" />
        <button type="submit">Send</button>
      </form>
    </main>
  </div>
  <script src="app.js"></script>
</body>
</html>`,
      "styles.css": `* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #eee; height: 100vh; display: flex; }
.chat-app { display: flex; width: 100%; max-width: 1000px; margin: auto; height: 90vh; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.1); }
.sidebar { width: 260px; background: #1a1a2e; color: #fff; padding: 1rem; overflow-y: auto; }
.sidebar h2 { margin-bottom: 1rem; font-size: 1.2rem; }
.user-item { display: flex; align-items: center; gap: 0.6rem; padding: 0.7rem; border-radius: 8px; cursor: pointer; margin-bottom: 0.3rem; }
.user-item:hover, .user-item.active { background: #2a2a4a; }
.user-avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; background: #3a3a5a; }
.user-info .name { font-size: 0.9rem; font-weight: 600; }
.user-info .preview { font-size: 0.75rem; color: #aaa; }
.chat-main { flex: 1; display: flex; flex-direction: column; }
.chat-header { padding: 1rem 1.25rem; border-bottom: 1px solid #eee; font-weight: 600; }
.messages { flex: 1; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
.msg { max-width: 70%; padding: 0.6rem 1rem; border-radius: 16px; font-size: 0.9rem; line-height: 1.4; }
.msg.sent { background: #1a73e8; color: #fff; align-self: flex-end; border-bottom-right-radius: 4px; }
.msg.received { background: #f0f0f0; color: #333; align-self: flex-start; border-bottom-left-radius: 4px; }
.msg .time { font-size: 0.65rem; opacity: 0.7; margin-top: 0.2rem; }
.typing { padding: 0 1rem; font-size: 0.8rem; color: #888; min-height: 1.5em; }
.input-bar { display: flex; gap: 0.5rem; padding: 1rem; border-top: 1px solid #eee; }
.input-bar input { flex: 1; padding: 0.6rem 1rem; border: 1px solid #ddd; border-radius: 20px; outline: none; font-size: 0.9rem; }
.input-bar button { padding: 0.6rem 1.2rem; background: #1a73e8; color: #fff; border: none; border-radius: 20px; cursor: pointer; }`,
      "app.js": `const users = [
  { id: 1, name: "Alice", avatar: "\u{1F469}", messages: [
    { text: "Hey! How's the project going?", sent: false, time: "10:30" },
    { text: "Going well! Just finished the UI.", sent: true, time: "10:32" },
    { text: "That's awesome, can't wait to see it", sent: false, time: "10:33" },
  ]},
  { id: 2, name: "Bob", avatar: "\u{1F468}", messages: [
    { text: "Meeting at 3pm today?", sent: false, time: "09:15" },
    { text: "Yes, I'll be there", sent: true, time: "09:20" },
  ]},
  { id: 3, name: "Carol", avatar: "\u{1F469}\u200D\u{1F4BB}", messages: [
    { text: "I pushed the latest changes", sent: false, time: "Yesterday" },
    { text: "Great, I'll review them now", sent: true, time: "Yesterday" },
    { text: "Let me know if you have questions!", sent: false, time: "Yesterday" },
  ]},
  { id: 4, name: "Dave", avatar: "\u{1F9D1}\u200D\u{1F3A8}", messages: [
    { text: "New designs are ready", sent: false, time: "Monday" },
  ]},
];

let activeUser = null;

function renderUsers() {
  document.getElementById("users").innerHTML = users.map(u => \`
    <div class="user-item \${activeUser === u.id ? 'active' : ''}" onclick="selectUser(\${u.id})">
      <div class="user-avatar">\${u.avatar}</div>
      <div class="user-info">
        <div class="name">\${u.name}</div>
        <div class="preview">\${u.messages[u.messages.length - 1]?.text.slice(0, 30) || ''}</div>
      </div>
    </div>
  \`).join("");
}

function selectUser(id) {
  activeUser = id;
  const u = users.find(u => u.id === id);
  document.getElementById("chatHeader").textContent = u.avatar + " " + u.name;
  renderUsers();
  renderMessages(u);
}

function renderMessages(u) {
  const el = document.getElementById("messages");
  el.innerHTML = u.messages.map(m => \`
    <div class="msg \${m.sent ? 'sent' : 'received'}">
      \${m.text}
      <div class="time">\${m.time}</div>
    </div>
  \`).join("");
  el.scrollTop = el.scrollHeight;
}

document.getElementById("inputForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = document.getElementById("msgInput");
  const text = input.value.trim();
  if (!text || !activeUser) return;
  const u = users.find(u => u.id === activeUser);
  const now = new Date();
  const time = now.getHours().toString().padStart(2, "0") + ":" + now.getMinutes().toString().padStart(2, "0");
  u.messages.push({ text, sent: true, time });
  input.value = "";
  renderMessages(u);
  renderUsers();
  // Simulate reply
  document.getElementById("typing").textContent = u.name + " is typing...";
  setTimeout(() => {
    document.getElementById("typing").textContent = "";
    const replies = ["Got it!", "Interesting!", "I'll look into it.", "Sounds good \u{1F44D}", "Let me think about that..."];
    u.messages.push({ text: replies[Math.floor(Math.random() * replies.length)], sent: false, time });
    renderMessages(u);
    renderUsers();
  }, 1200 + Math.random() * 800);
});

renderUsers();`,
    },
  },

  // 6 ── Portfolio Site ───────────────────────────────────────────────────────
  {
    id: "tpl-portfolio",
    name: "Portfolio Site",
    description:
      "Developer portfolio with hero section, projects showcase, skills, and contact form.",
    category: "portfolio",
    icon: "\u{1F3A8}",
    author: "FieldNine",
    stars: 375,
    forks: 142,
    tags: ["portfolio", "personal", "developer", "showcase"],
    createdAt: "2025-06-28",
    files: {
      "index.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Dev Portfolio</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <nav class="nav">
    <a href="#" class="logo">JD</a>
    <div class="nav-links">
      <a href="#about">About</a>
      <a href="#projects">Projects</a>
      <a href="#skills">Skills</a>
      <a href="#contact">Contact</a>
    </div>
  </nav>
  <section class="hero" id="about">
    <div class="hero-text">
      <p class="greeting">Hi, I'm</p>
      <h1>Jane Developer</h1>
      <p class="tagline">Full-stack engineer crafting delightful web experiences</p>
      <div class="hero-btns">
        <a href="#projects" class="btn primary">View Work</a>
        <a href="#contact" class="btn secondary">Contact Me</a>
      </div>
    </div>
  </section>
  <section class="section" id="projects">
    <h2>Projects</h2>
    <div class="project-grid" id="projectGrid"></div>
  </section>
  <section class="section dark" id="skills">
    <h2>Skills</h2>
    <div class="skill-grid" id="skillGrid"></div>
  </section>
  <section class="section" id="contact">
    <h2>Contact</h2>
    <form class="contact-form" onsubmit="event.preventDefault(); alert('Message sent!');">
      <input type="text" placeholder="Name" required />
      <input type="email" placeholder="Email" required />
      <textarea placeholder="Message" rows="4" required></textarea>
      <button type="submit" class="btn primary">Send Message</button>
    </form>
  </section>
  <footer class="footer"><p>\u00A9 2025 Jane Developer. Built with \u2764\uFE0F</p></footer>
  <script src="app.js"></script>
</body>
</html>`,
      "styles.css": `* { margin: 0; padding: 0; box-sizing: border-box; scroll-behavior: smooth; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #333; }
.nav { position: fixed; top: 0; width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 1rem 2rem; background: rgba(255,255,255,0.95); backdrop-filter: blur(8px); z-index: 100; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.logo { font-weight: 800; font-size: 1.4rem; text-decoration: none; color: #1a73e8; }
.nav-links a { margin-left: 1.5rem; text-decoration: none; color: #555; font-weight: 500; }
.nav-links a:hover { color: #1a73e8; }
.hero { min-height: 100vh; display: flex; align-items: center; justify-content: center; text-align: center; padding: 2rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; }
.greeting { font-size: 1.2rem; opacity: 0.9; }
.hero h1 { font-size: 3.5rem; margin: 0.5rem 0; }
.tagline { font-size: 1.2rem; opacity: 0.85; margin-bottom: 2rem; }
.hero-btns { display: flex; gap: 1rem; justify-content: center; }
.btn { display: inline-block; padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 600; border: none; cursor: pointer; font-size: 1rem; }
.btn.primary { background: #fff; color: #667eea; }
.btn.secondary { background: transparent; color: #fff; border: 2px solid #fff; }
.section { padding: 5rem 2rem; max-width: 1000px; margin: 0 auto; }
.section h2 { text-align: center; font-size: 2rem; margin-bottom: 2.5rem; }
.section.dark { background: #f8f9fa; max-width: 100%; }
.section.dark .skill-grid { max-width: 1000px; margin: 0 auto; }
.project-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; }
.project-card { border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); background: #fff; transition: transform 0.2s; }
.project-card:hover { transform: translateY(-4px); }
.project-thumb { height: 160px; display: flex; align-items: center; justify-content: center; font-size: 3rem; }
.project-body { padding: 1rem; }
.project-body h3 { margin-bottom: 0.3rem; }
.project-body p { font-size: 0.85rem; color: #666; }
.project-tags { display: flex; gap: 0.4rem; margin-top: 0.5rem; flex-wrap: wrap; }
.project-tags span { font-size: 0.7rem; padding: 0.2rem 0.5rem; background: #e8eaff; color: #667eea; border-radius: 4px; }
.skill-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 1rem; }
.skill-card { background: #fff; padding: 1.25rem; border-radius: 12px; text-align: center; box-shadow: 0 2px 6px rgba(0,0,0,0.06); }
.skill-card .icon { font-size: 2rem; margin-bottom: 0.5rem; }
.skill-card .name { font-weight: 600; font-size: 0.9rem; }
.contact-form { max-width: 500px; margin: 0 auto; display: flex; flex-direction: column; gap: 1rem; }
.contact-form input, .contact-form textarea { padding: 0.75rem; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem; font-family: inherit; }
.contact-form .btn.primary { background: #667eea; color: #fff; }
.footer { text-align: center; padding: 2rem; color: #888; font-size: 0.85rem; }`,
      "app.js": `const projects = [
  { name: "TaskFlow", desc: "Project management with Kanban boards", emoji: "\u{1F4CB}", bg: "#e8eaff", tags: ["React", "Node.js", "MongoDB"] },
  { name: "CloudSync", desc: "Real-time file synchronization tool", emoji: "\u2601\uFE0F", bg: "#e6f4ea", tags: ["Go", "WebSocket", "AWS"] },
  { name: "PixelCraft", desc: "Online image editor and design tool", emoji: "\u{1F3A8}", bg: "#fef7e0", tags: ["Canvas", "TypeScript", "Wasm"] },
  { name: "DataViz", desc: "Interactive data visualization platform", emoji: "\u{1F4CA}", bg: "#fce8e6", tags: ["D3.js", "Python", "Flask"] },
];

document.getElementById("projectGrid").innerHTML = projects.map(p => \`
  <div class="project-card">
    <div class="project-thumb" style="background:\${p.bg}">\${p.emoji}</div>
    <div class="project-body">
      <h3>\${p.name}</h3>
      <p>\${p.desc}</p>
      <div class="project-tags">\${p.tags.map(t => \`<span>\${t}</span>\`).join("")}</div>
    </div>
  </div>
\`).join("");

const skills = [
  { icon: "\u269B\uFE0F", name: "React" },
  { icon: "\u{1F4A0}", name: "TypeScript" },
  { icon: "\u{1F332}", name: "Node.js" },
  { icon: "\u{1F40D}", name: "Python" },
  { icon: "\u2601\uFE0F", name: "AWS" },
  { icon: "\u{1F433}", name: "Docker" },
  { icon: "\u{1F5C3}\uFE0F", name: "PostgreSQL" },
  { icon: "\u{1F310}", name: "GraphQL" },
];

document.getElementById("skillGrid").innerHTML = skills.map(s => \`
  <div class="skill-card">
    <div class="icon">\${s.icon}</div>
    <div class="name">\${s.name}</div>
  </div>
\`).join("");`,
    },
  },

  // 7 ── Todo App ─────────────────────────────────────────────────────────────
  {
    id: "tpl-todo-app",
    name: "Todo App",
    description:
      "CRUD todo list with localStorage persistence, filters, and completion tracking.",
    category: "tool",
    icon: "\u2705",
    author: "FieldNine",
    stars: 445,
    forks: 189,
    tags: ["todo", "productivity", "localstorage", "crud"],
    createdAt: "2025-03-18",
    files: {
      "index.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Todo App</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div class="app">
    <h1>\u2705 Todo List</h1>
    <form id="addForm" class="add-form">
      <input type="text" id="todoInput" placeholder="What needs to be done?" autocomplete="off" />
      <button type="submit">Add</button>
    </form>
    <div class="filters">
      <button class="filter active" data-filter="all">All</button>
      <button class="filter" data-filter="active">Active</button>
      <button class="filter" data-filter="completed">Completed</button>
    </div>
    <ul id="todoList" class="todo-list"></ul>
    <div class="footer">
      <span id="count">0 items left</span>
      <button id="clearBtn" class="clear-btn">Clear completed</button>
    </div>
  </div>
  <script src="app.js"></script>
</body>
</html>`,
      "styles.css": `* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; min-height: 100vh; display: flex; align-items: flex-start; justify-content: center; padding: 3rem 1rem; }
.app { width: 100%; max-width: 520px; background: #fff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); padding: 2rem; }
h1 { text-align: center; margin-bottom: 1.5rem; font-size: 1.8rem; color: #333; }
.add-form { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
.add-form input { flex: 1; padding: 0.75rem 1rem; border: 2px solid #e0e0e0; border-radius: 10px; font-size: 1rem; outline: none; transition: border 0.2s; }
.add-form input:focus { border-color: #1a73e8; }
.add-form button { padding: 0.75rem 1.25rem; background: #1a73e8; color: #fff; border: none; border-radius: 10px; cursor: pointer; font-size: 1rem; font-weight: 600; }
.filters { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
.filter { flex: 1; padding: 0.5rem; border: 1px solid #e0e0e0; background: #fff; border-radius: 8px; cursor: pointer; font-size: 0.85rem; }
.filter.active { background: #1a73e8; color: #fff; border-color: #1a73e8; }
.todo-list { list-style: none; min-height: 60px; }
.todo-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 0; border-bottom: 1px solid #f0f0f0; }
.todo-item input[type="checkbox"] { width: 20px; height: 20px; cursor: pointer; accent-color: #1a73e8; }
.todo-item .text { flex: 1; font-size: 0.95rem; }
.todo-item .text.done { text-decoration: line-through; color: #aaa; }
.todo-item .delete { background: none; border: none; color: #ccc; cursor: pointer; font-size: 1.2rem; padding: 0 0.3rem; }
.todo-item .delete:hover { color: #ea4335; }
.footer { display: flex; justify-content: space-between; align-items: center; margin-top: 1rem; font-size: 0.85rem; color: #888; }
.clear-btn { background: none; border: none; color: #888; cursor: pointer; font-size: 0.85rem; }
.clear-btn:hover { color: #ea4335; }`,
      "app.js": `let todos = JSON.parse(localStorage.getItem("todos") || "[]");
let filter = "all";

function save() { localStorage.setItem("todos", JSON.stringify(todos)); }

function render() {
  const filtered = todos.filter(t => {
    if (filter === "active") return !t.done;
    if (filter === "completed") return t.done;
    return true;
  });
  const list = document.getElementById("todoList");
  list.innerHTML = filtered.map(t => \`
    <li class="todo-item">
      <input type="checkbox" \${t.done ? "checked" : ""} onchange="toggle('\${t.id}')" />
      <span class="text \${t.done ? 'done' : ''}">\${escapeHtml(t.text)}</span>
      <button class="delete" onclick="remove('\${t.id}')">\u00D7</button>
    </li>
  \`).join("");
  const left = todos.filter(t => !t.done).length;
  document.getElementById("count").textContent = left + " item" + (left !== 1 ? "s" : "") + " left";
}

function escapeHtml(s) {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function toggle(id) {
  const t = todos.find(t => t.id === id);
  if (t) t.done = !t.done;
  save(); render();
}

function remove(id) {
  todos = todos.filter(t => t.id !== id);
  save(); render();
}

document.getElementById("addForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const input = document.getElementById("todoInput");
  const text = input.value.trim();
  if (!text) return;
  todos.push({ id: Date.now().toString(36), text, done: false });
  input.value = "";
  save(); render();
});

document.querySelectorAll(".filter").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    filter = btn.dataset.filter;
    render();
  });
});

document.getElementById("clearBtn").addEventListener("click", () => {
  todos = todos.filter(t => !t.done);
  save(); render();
});

render();`,
    },
  },

  // 8 ── AI Chat Bot ──────────────────────────────────────────────────────────
  {
    id: "tpl-ai-chatbot",
    name: "AI Chat Bot",
    description:
      "Chatbot interface with message history, streaming simulation, and API integration placeholder.",
    category: "ai",
    icon: "\u{1F916}",
    author: "FieldNine",
    stars: 612,
    forks: 278,
    tags: ["ai", "chatbot", "gpt", "assistant"],
    createdAt: "2025-09-01",
    files: {
      "index.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AI Chat Bot</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div class="chatbot">
    <header class="chat-header">
      <span>\u{1F916} AI Assistant</span>
      <button id="clearChat" title="Clear chat">\u{1F5D1}\uFE0F</button>
    </header>
    <div class="messages" id="messages">
      <div class="msg bot">
        <div class="avatar">\u{1F916}</div>
        <div class="bubble">Hello! I'm your AI assistant. How can I help you today?</div>
      </div>
    </div>
    <form class="input-area" id="chatForm">
      <input type="text" id="userInput" placeholder="Ask me anything..." autocomplete="off" />
      <button type="submit" id="sendBtn">\u27A4</button>
    </form>
  </div>
  <script src="app.js"></script>
</body>
</html>`,
      "styles.css": `* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f0f23; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
.chatbot { width: 100%; max-width: 680px; height: 90vh; display: flex; flex-direction: column; background: #1a1a2e; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.3); }
.chat-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.25rem; background: #16213e; color: #fff; font-weight: 600; font-size: 1.1rem; }
.chat-header button { background: none; border: none; color: #888; cursor: pointer; font-size: 1.1rem; }
.messages { flex: 1; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: 1rem; }
.msg { display: flex; gap: 0.6rem; max-width: 85%; }
.msg.user { align-self: flex-end; flex-direction: row-reverse; }
.avatar { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1rem; flex-shrink: 0; background: #2a2a4a; }
.msg.user .avatar { background: #1a73e8; }
.bubble { padding: 0.7rem 1rem; border-radius: 16px; font-size: 0.9rem; line-height: 1.5; color: #e0e0e0; }
.msg.bot .bubble { background: #2a2a4a; border-bottom-left-radius: 4px; }
.msg.user .bubble { background: #1a73e8; color: #fff; border-bottom-right-radius: 4px; }
.bubble .cursor { display: inline-block; width: 2px; height: 1em; background: #7c7cff; animation: blink 0.6s infinite; vertical-align: text-bottom; margin-left: 2px; }
@keyframes blink { 50% { opacity: 0; } }
.input-area { display: flex; gap: 0.5rem; padding: 1rem; background: #16213e; }
.input-area input { flex: 1; padding: 0.7rem 1rem; border: 1px solid #2a2a4a; background: #1a1a2e; color: #e0e0e0; border-radius: 12px; font-size: 0.95rem; outline: none; }
.input-area input:focus { border-color: #7c7cff; }
.input-area button { width: 42px; height: 42px; border: none; background: #7c7cff; color: #fff; border-radius: 12px; cursor: pointer; font-size: 1.1rem; }
.input-area button:disabled { opacity: 0.5; cursor: default; }`,
      "app.js": `const messagesEl = document.getElementById("messages");
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

// Simulated AI responses (replace with real API call)
const responses = [
  "That's a great question! Let me think about that...",
  "Here's what I found: the key is to break the problem into smaller pieces and tackle each one step by step.",
  "I'd recommend starting with the documentation, then building a small prototype to test your assumptions.",
  "There are several approaches you could take. The most common one involves using a combination of algorithms and data structures optimized for your use case.",
  "Based on my training data, the best practice is to follow the SOLID principles and write comprehensive tests.",
  "Interesting! That reminds me of a common design pattern called the Observer pattern, which might be exactly what you need.",
  "I can help with that! The first step would be to set up your development environment, then we can move on to implementation.",
  "Great thinking! You might also want to consider edge cases and error handling to make your solution more robust.",
];

function addMessage(text, isUser) {
  const div = document.createElement("div");
  div.className = "msg " + (isUser ? "user" : "bot");
  div.innerHTML = \`<div class="avatar">\${isUser ? "\u{1F464}" : "\u{1F916}"}</div><div class="bubble">\${text}</div>\`;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
  return div;
}

async function streamResponse(text) {
  const div = document.createElement("div");
  div.className = "msg bot";
  div.innerHTML = \`<div class="avatar">\u{1F916}</div><div class="bubble"><span class="text"></span><span class="cursor"></span></div>\`;
  messagesEl.appendChild(div);
  const textEl = div.querySelector(".text");
  const cursorEl = div.querySelector(".cursor");
  for (let i = 0; i < text.length; i++) {
    textEl.textContent += text[i];
    messagesEl.scrollTop = messagesEl.scrollHeight;
    await new Promise(r => setTimeout(r, 15 + Math.random() * 25));
  }
  cursorEl.remove();
}

chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = userInput.value.trim();
  if (!text) return;
  addMessage(text, true);
  userInput.value = "";
  sendBtn.disabled = true;
  userInput.disabled = true;
  // Simulate thinking delay
  await new Promise(r => setTimeout(r, 500 + Math.random() * 500));
  /*
   * TODO: Replace with real API call:
   * const res = await fetch("/api/ai/chat", {
   *   method: "POST",
   *   headers: { "Content-Type": "application/json" },
   *   body: JSON.stringify({ message: text })
   * });
   * const data = await res.json();
   * await streamResponse(data.reply);
   */
  const reply = responses[Math.floor(Math.random() * responses.length)];
  await streamResponse(reply);
  sendBtn.disabled = false;
  userInput.disabled = false;
  userInput.focus();
});

document.getElementById("clearChat").addEventListener("click", () => {
  messagesEl.innerHTML = "";
  addMessage("Chat cleared. How can I help you?", false);
});`,
    },
  },

  // 9 ── Landing Page ─────────────────────────────────────────────────────────
  {
    id: "tpl-landing-page",
    name: "Landing Page",
    description:
      "Marketing landing page with hero section, feature highlights, pricing, and CTA.",
    category: "starter",
    icon: "\u{1F680}",
    author: "FieldNine",
    stars: 302,
    forks: 113,
    tags: ["landing", "marketing", "startup", "hero"],
    createdAt: "2025-07-15",
    files: {
      "index.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>LaunchPad - Ship Faster</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <nav>
    <a class="brand" href="#">LaunchPad \u{1F680}</a>
    <div class="nav-links">
      <a href="#features">Features</a>
      <a href="#pricing">Pricing</a>
      <a href="#" class="cta-btn small">Get Started</a>
    </div>
  </nav>
  <section class="hero">
    <h1>Ship your product<br/><span class="gradient">10x faster</span></h1>
    <p>The all-in-one platform for building, deploying, and scaling modern web applications.</p>
    <div class="hero-actions">
      <a href="#" class="cta-btn">Start Free Trial</a>
      <a href="#features" class="cta-btn outline">Learn More</a>
    </div>
    <p class="social-proof">\u2B50 Trusted by 5,000+ developers worldwide</p>
  </section>
  <section class="features" id="features">
    <h2>Everything you need</h2>
    <div class="feature-grid" id="featureGrid"></div>
  </section>
  <section class="pricing" id="pricing">
    <h2>Simple pricing</h2>
    <div class="pricing-grid" id="pricingGrid"></div>
  </section>
  <section class="cta-section">
    <h2>Ready to launch?</h2>
    <p>Join thousands of developers shipping faster with LaunchPad.</p>
    <a href="#" class="cta-btn large">Get Started Free</a>
  </section>
  <footer>\u00A9 2025 LaunchPad. All rights reserved.</footer>
  <script src="app.js"></script>
</body>
</html>`,
      "styles.css": `* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a2e; }
nav { display: flex; justify-content: space-between; align-items: center; padding: 1rem 3rem; position: fixed; width: 100%; top: 0; background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); z-index: 50; }
.brand { font-weight: 800; font-size: 1.3rem; text-decoration: none; color: #1a1a2e; }
.nav-links { display: flex; align-items: center; gap: 1.5rem; }
.nav-links a { text-decoration: none; color: #555; font-weight: 500; }
.cta-btn { display: inline-block; padding: 0.7rem 1.5rem; background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; border-radius: 8px; text-decoration: none; font-weight: 600; transition: transform 0.2s, box-shadow 0.2s; }
.cta-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(102,126,234,0.4); }
.cta-btn.outline { background: transparent; color: #667eea; border: 2px solid #667eea; }
.cta-btn.small { padding: 0.45rem 1rem; font-size: 0.85rem; }
.cta-btn.large { padding: 1rem 2.5rem; font-size: 1.1rem; }
.hero { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 6rem 2rem 4rem; }
.hero h1 { font-size: 3.5rem; line-height: 1.2; margin-bottom: 1rem; }
.gradient { background: linear-gradient(135deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.hero p { font-size: 1.2rem; color: #666; max-width: 500px; margin-bottom: 2rem; }
.hero-actions { display: flex; gap: 1rem; margin-bottom: 2rem; }
.social-proof { font-size: 0.9rem; color: #888; }
.features, .pricing { padding: 5rem 2rem; max-width: 1100px; margin: 0 auto; }
.features h2, .pricing h2 { text-align: center; font-size: 2.2rem; margin-bottom: 3rem; }
.feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 2rem; }
.feature-card { padding: 1.5rem; border-radius: 12px; background: #f8f9ff; text-align: center; }
.feature-card .icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
.feature-card h3 { margin-bottom: 0.5rem; }
.feature-card p { font-size: 0.9rem; color: #666; }
.pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.5rem; max-width: 900px; margin: 0 auto; }
.price-card { padding: 2rem; border-radius: 16px; background: #fff; border: 2px solid #eee; text-align: center; }
.price-card.popular { border-color: #667eea; position: relative; }
.price-card.popular::before { content: "Most Popular"; position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: #667eea; color: #fff; padding: 0.2rem 0.8rem; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
.price-card h3 { margin-bottom: 0.5rem; }
.price-card .price { font-size: 2.5rem; font-weight: 800; margin: 0.5rem 0; }
.price-card .price span { font-size: 1rem; font-weight: 400; color: #888; }
.price-card ul { list-style: none; margin: 1rem 0; text-align: left; }
.price-card ul li { padding: 0.3rem 0; font-size: 0.9rem; color: #555; }
.price-card ul li::before { content: "\u2713 "; color: #34a853; font-weight: 700; }
.cta-section { text-align: center; padding: 5rem 2rem; background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; }
.cta-section h2 { font-size: 2.2rem; margin-bottom: 0.5rem; }
.cta-section p { font-size: 1.1rem; opacity: 0.9; margin-bottom: 2rem; }
.cta-section .cta-btn { background: #fff; color: #667eea; }
footer { text-align: center; padding: 2rem; color: #888; font-size: 0.85rem; }`,
      "app.js": `const features = [
  { icon: "\u26A1", title: "Lightning Fast", desc: "Edge-first deployment with sub-second cold starts globally." },
  { icon: "\u{1F6E1}\uFE0F", title: "Secure by Default", desc: "Enterprise-grade security with automatic SSL and DDoS protection." },
  { icon: "\u{1F504}", title: "CI/CD Built-in", desc: "Push to deploy with automatic previews for every pull request." },
  { icon: "\u{1F4CA}", title: "Analytics", desc: "Real-time performance insights and user behavior analytics." },
  { icon: "\u{1F91D}", title: "Team Collab", desc: "Built-in collaboration tools for teams of any size." },
  { icon: "\u{1F9E9}", title: "Integrations", desc: "Connect with 100+ tools and services out of the box." },
];

document.getElementById("featureGrid").innerHTML = features.map(f => \`
  <div class="feature-card">
    <div class="icon">\${f.icon}</div>
    <h3>\${f.title}</h3>
    <p>\${f.desc}</p>
  </div>
\`).join("");

const plans = [
  { name: "Starter", price: "Free", period: "", features: ["1 project", "1GB bandwidth", "Community support", "Basic analytics"], popular: false },
  { name: "Pro", price: "$19", period: "/mo", features: ["Unlimited projects", "100GB bandwidth", "Priority support", "Advanced analytics", "Custom domains"], popular: true },
  { name: "Enterprise", price: "$79", period: "/mo", features: ["Everything in Pro", "Unlimited bandwidth", "24/7 phone support", "SSO & SAML", "SLA guarantee", "Dedicated account manager"], popular: false },
];

document.getElementById("pricingGrid").innerHTML = plans.map(p => \`
  <div class="price-card \${p.popular ? 'popular' : ''}">
    <h3>\${p.name}</h3>
    <div class="price">\${p.price}<span>\${p.period}</span></div>
    <ul>\${p.features.map(f => \`<li>\${f}</li>\`).join("")}</ul>
    <a href="#" class="cta-btn" style="width:100%;text-align:center;\${p.popular ? '' : 'background:#eee;color:#333;'}">Choose \${p.name}</a>
  </div>
\`).join("");`,
    },
  },

  // 10 ── Blog Platform ───────────────────────────────────────────────────────
  {
    id: "tpl-blog-platform",
    name: "Blog Platform",
    description:
      "Blog with post listing, individual post view, comments, and category filtering.",
    category: "social",
    icon: "\u{1F4DD}",
    author: "FieldNine",
    stars: 231,
    forks: 88,
    tags: ["blog", "posts", "comments", "writing"],
    createdAt: "2025-08-20",
    files: {
      "index.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>DevBlog</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <header class="site-header">
    <h1>\u{1F4DD} DevBlog</h1>
    <p>Thoughts on code, design, and technology</p>
  </header>
  <main class="layout">
    <aside class="sidebar">
      <h3>Categories</h3>
      <div id="categories" class="cat-list"></div>
      <h3 style="margin-top:1.5rem">About</h3>
      <p class="about-text">A blog about web development, design patterns, and building great software.</p>
    </aside>
    <section id="content" class="content"></section>
  </main>
  <script src="app.js"></script>
</body>
</html>`,
      "styles.css": `* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: Georgia, 'Times New Roman', serif; background: #fafafa; color: #333; line-height: 1.7; }
.site-header { text-align: center; padding: 3rem 1rem 2rem; background: #1a1a2e; color: #fff; }
.site-header h1 { font-size: 2rem; }
.site-header p { opacity: 0.8; font-style: italic; }
.layout { display: grid; grid-template-columns: 220px 1fr; gap: 2rem; max-width: 960px; margin: 2rem auto; padding: 0 1rem; }
.sidebar h3 { font-size: 1rem; margin-bottom: 0.5rem; font-family: -apple-system, sans-serif; }
.cat-list { display: flex; flex-direction: column; gap: 0.3rem; }
.cat-btn { background: none; border: 1px solid #ddd; padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer; text-align: left; font-family: -apple-system, sans-serif; font-size: 0.85rem; }
.cat-btn.active { background: #1a1a2e; color: #fff; border-color: #1a1a2e; }
.about-text { font-size: 0.85rem; color: #666; font-family: -apple-system, sans-serif; }
.post-card { background: #fff; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 1px 4px rgba(0,0,0,0.06); cursor: pointer; transition: box-shadow 0.2s; }
.post-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.post-card .meta { font-size: 0.8rem; color: #888; font-family: -apple-system, sans-serif; margin-bottom: 0.5rem; }
.post-card h2 { font-size: 1.3rem; margin-bottom: 0.4rem; }
.post-card .excerpt { color: #555; font-size: 0.95rem; }
.post-card .tag { display: inline-block; font-size: 0.7rem; padding: 0.15rem 0.5rem; background: #e8eaff; color: #667eea; border-radius: 4px; margin-right: 0.3rem; font-family: -apple-system, sans-serif; }
.post-full { background: #fff; border-radius: 12px; padding: 2rem; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.post-full .back { font-family: -apple-system, sans-serif; font-size: 0.85rem; color: #667eea; cursor: pointer; background: none; border: none; margin-bottom: 1rem; }
.post-full h1 { font-size: 1.8rem; margin-bottom: 0.5rem; }
.post-full .body { margin: 1.5rem 0; white-space: pre-wrap; }
.comments { margin-top: 2rem; border-top: 1px solid #eee; padding-top: 1rem; }
.comments h3 { font-family: -apple-system, sans-serif; font-size: 1rem; margin-bottom: 0.75rem; }
.comment { background: #f8f8f8; padding: 0.75rem; border-radius: 8px; margin-bottom: 0.5rem; font-family: -apple-system, sans-serif; font-size: 0.85rem; }
.comment .author { font-weight: 600; }
@media(max-width: 700px) { .layout { grid-template-columns: 1fr; } }`,
      "app.js": `const posts = [
  { id: 1, title: "Getting Started with TypeScript", cat: "tutorial", date: "2025-08-18", excerpt: "TypeScript adds type safety to JavaScript, catching bugs before they reach production...", body: "TypeScript has become the industry standard for large-scale JavaScript applications. In this guide, we'll cover the basics of type annotations, interfaces, generics, and how to set up a new project from scratch.\\n\\nFirst, install TypeScript globally:\\n  npm install -g typescript\\n\\nThen initialize a project:\\n  tsc --init\\n\\nThis creates a tsconfig.json file where you can configure compiler options. Start with strict mode enabled for the best experience.", comments: [{ author: "Alice", text: "Great intro! Helped me get started." }, { author: "Bob", text: "Would love a follow-up on advanced generics." }] },
  { id: 2, title: "Why I Switched to Vim", cat: "opinion", date: "2025-08-10", excerpt: "After 5 years with VS Code, I made the switch to Neovim and never looked back...", body: "The switch wasn't easy. The first two weeks were painful, and my productivity dropped significantly. But after building muscle memory for the keybindings, something clicked.\\n\\nThe modal editing paradigm fundamentally changes how you think about text manipulation. Instead of reaching for the mouse, everything flows through keyboard shortcuts that compose naturally.", comments: [{ author: "Carol", text: "Vim is life!" }] },
  { id: 3, title: "Building a REST API with Node.js", cat: "tutorial", date: "2025-07-28", excerpt: "A step-by-step guide to building a production-ready REST API using Express and PostgreSQL...", body: "We'll build a complete CRUD API with authentication, validation, error handling, and database integration.\\n\\nStart by setting up Express:\\n  npm init -y\\n  npm install express pg dotenv\\n\\nCreate your server entry point and define routes for your resources. We'll use middleware for authentication and input validation.", comments: [] },
  { id: 4, title: "The State of CSS in 2025", cat: "news", date: "2025-08-01", excerpt: "Container queries, cascade layers, and :has() — CSS has never been more powerful...", body: "CSS has evolved dramatically. Features that once required JavaScript or preprocessors are now native to the platform.\\n\\nContainer queries let components respond to their container's size rather than the viewport. Cascade layers give you fine-grained control over specificity. The :has() selector enables parent selection, a long-requested feature.", comments: [{ author: "Dave", text: "CSS has come so far!" }, { author: "Eve", text: "Container queries changed everything for me." }] },
  { id: 5, title: "Design Patterns Every Dev Should Know", cat: "tutorial", date: "2025-07-15", excerpt: "From Observer to Strategy — the patterns that will level up your code architecture...", body: "Design patterns are reusable solutions to common software design problems. Here are the essential ones:\\n\\n1. Observer: Subscribe to events from a subject\\n2. Strategy: Swap algorithms at runtime\\n3. Factory: Create objects without specifying exact classes\\n4. Singleton: Ensure only one instance exists\\n5. Decorator: Add behavior without modifying existing code", comments: [{ author: "Frank", text: "Decorator pattern is my favorite!" }] },
];

const categories = ["all", ...new Set(posts.map(p => p.cat))];
let activeCat = "all";

function renderCategories() {
  document.getElementById("categories").innerHTML = categories.map(c => \`
    <button class="cat-btn \${c === activeCat ? 'active' : ''}" onclick="filterCat('\${c}')">\${c === "all" ? "All Posts" : c.charAt(0).toUpperCase() + c.slice(1)}</button>
  \`).join("");
}

function filterCat(cat) {
  activeCat = cat;
  renderCategories();
  renderPosts();
}

function renderPosts() {
  const filtered = activeCat === "all" ? posts : posts.filter(p => p.cat === activeCat);
  document.getElementById("content").innerHTML = filtered.map(p => \`
    <div class="post-card" onclick="viewPost(\${p.id})">
      <div class="meta">\${p.date} \u00B7 <span class="tag">\${p.cat}</span></div>
      <h2>\${p.title}</h2>
      <p class="excerpt">\${p.excerpt}</p>
    </div>
  \`).join("");
}

function viewPost(id) {
  const p = posts.find(p => p.id === id);
  document.getElementById("content").innerHTML = \`
    <div class="post-full">
      <button class="back" onclick="renderPosts()">\u2190 Back to posts</button>
      <div class="meta">\${p.date} \u00B7 <span class="tag">\${p.cat}</span></div>
      <h1>\${p.title}</h1>
      <div class="body">\${p.body}</div>
      <div class="comments">
        <h3>Comments (\${p.comments.length})</h3>
        \${p.comments.map(c => \`<div class="comment"><span class="author">\${c.author}:</span> \${c.text}</div>\`).join("")}
        \${p.comments.length === 0 ? '<p style="color:#888;font-size:0.85rem;">No comments yet.</p>' : ''}
      </div>
    </div>
  \`;
}

renderCategories();
renderPosts();`,
    },
  },

  // 11 ── Weather App ─────────────────────────────────────────────────────────
  {
    id: "tpl-weather-app",
    name: "Weather App",
    description:
      "Weather dashboard with city search, current conditions, and 5-day forecast display.",
    category: "tool",
    icon: "\u{1F326}\uFE0F",
    author: "FieldNine",
    stars: 267,
    forks: 102,
    tags: ["weather", "api", "dashboard", "forecast"],
    createdAt: "2025-06-05",
    files: {
      "index.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Weather App</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <div class="app">
    <h1>\u{1F326}\uFE0F Weather</h1>
    <form id="searchForm" class="search-bar">
      <input type="text" id="cityInput" placeholder="Search city..." value="San Francisco" />
      <button type="submit">Search</button>
    </form>
    <div id="current" class="current"></div>
    <div id="forecast" class="forecast"></div>
    <p class="note">Demo data \u2014 replace with real API for live weather</p>
  </div>
  <script src="app.js"></script>
</body>
</html>`,
      "styles.css": `* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: flex-start; justify-content: center; padding: 3rem 1rem; }
.app { width: 100%; max-width: 600px; }
h1 { color: #fff; text-align: center; font-size: 2rem; margin-bottom: 1.5rem; }
.search-bar { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
.search-bar input { flex: 1; padding: 0.75rem 1rem; border: none; border-radius: 12px; font-size: 1rem; outline: none; }
.search-bar button { padding: 0.75rem 1.25rem; border: none; border-radius: 12px; background: rgba(255,255,255,0.2); color: #fff; cursor: pointer; font-size: 1rem; backdrop-filter: blur(4px); }
.current { background: rgba(255,255,255,0.15); backdrop-filter: blur(12px); border-radius: 20px; padding: 2rem; color: #fff; text-align: center; margin-bottom: 1.5rem; }
.current .city { font-size: 1.4rem; font-weight: 600; }
.current .icon { font-size: 4rem; margin: 0.5rem 0; }
.current .temp { font-size: 3.5rem; font-weight: 700; }
.current .desc { font-size: 1.1rem; opacity: 0.9; text-transform: capitalize; margin-bottom: 1rem; }
.current .details { display: flex; justify-content: center; gap: 2rem; font-size: 0.9rem; opacity: 0.85; }
.forecast { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.75rem; }
.forecast-day { background: rgba(255,255,255,0.15); backdrop-filter: blur(12px); border-radius: 16px; padding: 1rem; color: #fff; text-align: center; }
.forecast-day .day { font-size: 0.85rem; font-weight: 600; margin-bottom: 0.3rem; }
.forecast-day .f-icon { font-size: 1.8rem; margin: 0.3rem 0; }
.forecast-day .f-temp { font-size: 1.1rem; font-weight: 700; }
.forecast-day .f-range { font-size: 0.75rem; opacity: 0.8; }
.note { text-align: center; color: rgba(255,255,255,0.5); font-size: 0.8rem; margin-top: 1.5rem; }
@media(max-width: 500px) { .forecast { grid-template-columns: repeat(3, 1fr); } }`,
      "app.js": `// Simulated weather data (replace with real API like OpenWeatherMap)
const weatherDB = {
  "san francisco": { temp: 18, desc: "partly cloudy", icon: "\u26C5", humidity: 72, wind: 14, high: 21, low: 13, forecast: [
    { day: "Tue", icon: "\u2600\uFE0F", high: 22, low: 14 },
    { day: "Wed", icon: "\u26C5", high: 20, low: 12 },
    { day: "Thu", icon: "\u{1F327}\uFE0F", high: 16, low: 10 },
    { day: "Fri", icon: "\u26C5", high: 19, low: 11 },
    { day: "Sat", icon: "\u2600\uFE0F", high: 23, low: 15 },
  ]},
  "new york": { temp: 28, desc: "sunny", icon: "\u2600\uFE0F", humidity: 55, wind: 8, high: 31, low: 22, forecast: [
    { day: "Tue", icon: "\u2600\uFE0F", high: 30, low: 23 },
    { day: "Wed", icon: "\u{1F329}\uFE0F", high: 27, low: 20 },
    { day: "Thu", icon: "\u{1F327}\uFE0F", high: 22, low: 18 },
    { day: "Fri", icon: "\u26C5", high: 25, low: 19 },
    { day: "Sat", icon: "\u2600\uFE0F", high: 29, low: 21 },
  ]},
  "london": { temp: 14, desc: "overcast", icon: "\u2601\uFE0F", humidity: 80, wind: 18, high: 16, low: 10, forecast: [
    { day: "Tue", icon: "\u{1F327}\uFE0F", high: 13, low: 8 },
    { day: "Wed", icon: "\u{1F327}\uFE0F", high: 12, low: 7 },
    { day: "Thu", icon: "\u2601\uFE0F", high: 14, low: 9 },
    { day: "Fri", icon: "\u26C5", high: 16, low: 10 },
    { day: "Sat", icon: "\u2600\uFE0F", high: 18, low: 11 },
  ]},
  "tokyo": { temp: 32, desc: "hot and humid", icon: "\u2600\uFE0F", humidity: 85, wind: 6, high: 34, low: 26, forecast: [
    { day: "Tue", icon: "\u2600\uFE0F", high: 33, low: 27 },
    { day: "Wed", icon: "\u{1F329}\uFE0F", high: 30, low: 24 },
    { day: "Thu", icon: "\u{1F327}\uFE0F", high: 28, low: 22 },
    { day: "Fri", icon: "\u26C5", high: 31, low: 25 },
    { day: "Sat", icon: "\u2600\uFE0F", high: 34, low: 27 },
  ]},
};

function getWeather(city) {
  const key = city.toLowerCase().trim();
  if (weatherDB[key]) return weatherDB[key];
  // Generate random weather for unknown cities
  const icons = ["\u2600\uFE0F", "\u26C5", "\u2601\uFE0F", "\u{1F327}\uFE0F"];
  const descs = ["sunny", "partly cloudy", "overcast", "light rain"];
  const temp = Math.floor(Math.random() * 30) + 5;
  const i = Math.floor(Math.random() * icons.length);
  return {
    temp, desc: descs[i], icon: icons[i], humidity: 40 + Math.floor(Math.random() * 50), wind: 5 + Math.floor(Math.random() * 20), high: temp + 4, low: temp - 5,
    forecast: ["Mon","Tue","Wed","Thu","Fri"].map(day => ({ day, icon: icons[Math.floor(Math.random()*icons.length)], high: temp + Math.floor(Math.random()*6), low: temp - Math.floor(Math.random()*6) })),
  };
}

function render(city) {
  const w = getWeather(city);
  document.getElementById("current").innerHTML = \`
    <div class="city">\${city}</div>
    <div class="icon">\${w.icon}</div>
    <div class="temp">\${w.temp}\u00B0C</div>
    <div class="desc">\${w.desc}</div>
    <div class="details">
      <span>\u{1F4A7} \${w.humidity}%</span>
      <span>\u{1F32C}\uFE0F \${w.wind} km/h</span>
      <span>\u2B06\uFE0F \${w.high}\u00B0 \u2B07\uFE0F \${w.low}\u00B0</span>
    </div>
  \`;
  document.getElementById("forecast").innerHTML = w.forecast.map(d => \`
    <div class="forecast-day">
      <div class="day">\${d.day}</div>
      <div class="f-icon">\${d.icon}</div>
      <div class="f-temp">\${d.high}\u00B0</div>
      <div class="f-range">\${d.low}\u00B0</div>
    </div>
  \`).join("");
}

document.getElementById("searchForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const city = document.getElementById("cityInput").value.trim();
  if (city) render(city);
});

render("San Francisco");`,
    },
  },

  // 12 ── Kanban Board ────────────────────────────────────────────────────────
  {
    id: "tpl-kanban-board",
    name: "Kanban Board",
    description:
      "Drag-and-drop task management board with columns, task creation, and state persistence.",
    category: "tool",
    icon: "\u{1F4CB}",
    author: "FieldNine",
    stars: 389,
    forks: 156,
    tags: ["kanban", "tasks", "drag-drop", "project-management"],
    createdAt: "2025-05-10",
    files: {
      "index.html": `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Kanban Board</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <header>
    <h1>\u{1F4CB} Kanban Board</h1>
  </header>
  <main class="board" id="board"></main>
  <script src="app.js"></script>
</body>
</html>`,
      "styles.css": `* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f0f23; color: #e0e0e0; min-height: 100vh; }
header { padding: 1.25rem 2rem; background: #1a1a2e; border-bottom: 1px solid #2a2a4a; }
header h1 { font-size: 1.4rem; }
.board { display: flex; gap: 1rem; padding: 1.5rem; overflow-x: auto; min-height: calc(100vh - 65px); align-items: flex-start; }
.column { background: #1a1a2e; border-radius: 12px; width: 300px; min-width: 300px; display: flex; flex-direction: column; max-height: calc(100vh - 100px); }
.col-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem; font-weight: 700; font-size: 0.95rem; border-bottom: 1px solid #2a2a4a; }
.col-header .count { background: #2a2a4a; padding: 0.1rem 0.5rem; border-radius: 10px; font-size: 0.75rem; font-weight: 400; }
.col-body { flex: 1; overflow-y: auto; padding: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem; min-height: 60px; }
.col-body.drag-over { background: rgba(122,122,255,0.08); border-radius: 0 0 12px 12px; }
.task { background: #16213e; padding: 0.75rem; border-radius: 8px; cursor: grab; border: 1px solid #2a2a4a; transition: box-shadow 0.2s, opacity 0.2s; }
.task:active { cursor: grabbing; }
.task.dragging { opacity: 0.5; }
.task .task-title { font-size: 0.9rem; margin-bottom: 0.3rem; }
.task .task-meta { display: flex; gap: 0.5rem; font-size: 0.7rem; color: #888; }
.task .priority { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 0.3rem; vertical-align: middle; }
.priority.high { background: #ea4335; }
.priority.medium { background: #f9ab00; }
.priority.low { background: #34a853; }
.add-task { padding: 0.75rem; border-top: 1px solid #2a2a4a; }
.add-task button { width: 100%; padding: 0.5rem; background: transparent; border: 1px dashed #2a2a4a; border-radius: 8px; color: #888; cursor: pointer; font-size: 0.85rem; }
.add-task button:hover { border-color: #7c7cff; color: #7c7cff; }
.add-form { display: flex; flex-direction: column; gap: 0.5rem; padding: 0.75rem; border-top: 1px solid #2a2a4a; }
.add-form input, .add-form select { padding: 0.5rem; border: 1px solid #2a2a4a; background: #0f0f23; color: #e0e0e0; border-radius: 6px; font-size: 0.85rem; }
.add-form .form-actions { display: flex; gap: 0.5rem; }
.add-form .form-actions button { flex: 1; padding: 0.4rem; border: none; border-radius: 6px; cursor: pointer; font-size: 0.8rem; }
.add-form .form-actions .save { background: #7c7cff; color: #fff; }
.add-form .form-actions .cancel { background: #2a2a4a; color: #ccc; }`,
      "app.js": `const defaultData = {
  columns: [
    { id: "backlog", title: "\u{1F4E5} Backlog", tasks: [
      { id: "t1", title: "Research competitor features", priority: "low", tag: "research" },
      { id: "t2", title: "Design system color tokens", priority: "medium", tag: "design" },
    ]},
    { id: "todo", title: "\u{1F4CB} To Do", tasks: [
      { id: "t3", title: "Set up CI/CD pipeline", priority: "high", tag: "devops" },
      { id: "t4", title: "Create user auth flow", priority: "high", tag: "backend" },
      { id: "t5", title: "Write API documentation", priority: "medium", tag: "docs" },
    ]},
    { id: "progress", title: "\u{1F3D7}\uFE0F In Progress", tasks: [
      { id: "t6", title: "Build dashboard layout", priority: "high", tag: "frontend" },
      { id: "t7", title: "Implement search feature", priority: "medium", tag: "frontend" },
    ]},
    { id: "done", title: "\u2705 Done", tasks: [
      { id: "t8", title: "Project setup & scaffolding", priority: "low", tag: "devops" },
      { id: "t9", title: "Database schema design", priority: "medium", tag: "backend" },
    ]},
  ]
};

let data = JSON.parse(localStorage.getItem("kanban") || "null") || defaultData;
let draggedTask = null;
let dragSourceCol = null;

function save() { localStorage.setItem("kanban", JSON.stringify(data)); }

function render() {
  const board = document.getElementById("board");
  board.innerHTML = data.columns.map(col => \`
    <div class="column" data-col="\${col.id}">
      <div class="col-header">
        <span>\${col.title}</span>
        <span class="count">\${col.tasks.length}</span>
      </div>
      <div class="col-body" data-col="\${col.id}">
        \${col.tasks.map(t => \`
          <div class="task" draggable="true" data-id="\${t.id}" data-col="\${col.id}">
            <div class="task-title"><span class="priority \${t.priority}"></span>\${t.title}</div>
            <div class="task-meta"><span>\${t.tag}</span><span>\${t.priority}</span></div>
          </div>
        \`).join("")}
      </div>
      <div class="add-task">
        <button onclick="showAddForm('\${col.id}')">+ Add task</button>
      </div>
    </div>
  \`).join("");
  attachDragListeners();
}

function attachDragListeners() {
  document.querySelectorAll(".task").forEach(el => {
    el.addEventListener("dragstart", (e) => {
      draggedTask = e.target.dataset.id;
      dragSourceCol = e.target.dataset.col;
      e.target.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
    });
    el.addEventListener("dragend", (e) => {
      e.target.classList.remove("dragging");
      document.querySelectorAll(".col-body").forEach(b => b.classList.remove("drag-over"));
    });
  });
  document.querySelectorAll(".col-body").forEach(body => {
    body.addEventListener("dragover", (e) => { e.preventDefault(); body.classList.add("drag-over"); });
    body.addEventListener("dragleave", () => { body.classList.remove("drag-over"); });
    body.addEventListener("drop", (e) => {
      e.preventDefault();
      body.classList.remove("drag-over");
      const targetCol = body.dataset.col;
      if (!draggedTask) return;
      const srcCol = data.columns.find(c => c.id === dragSourceCol);
      const tgtCol = data.columns.find(c => c.id === targetCol);
      const taskIdx = srcCol.tasks.findIndex(t => t.id === draggedTask);
      if (taskIdx === -1) return;
      const [task] = srcCol.tasks.splice(taskIdx, 1);
      tgtCol.tasks.push(task);
      draggedTask = null;
      dragSourceCol = null;
      save();
      render();
    });
  });
}

function showAddForm(colId) {
  const col = document.querySelector(\`.column[data-col="\${colId}"]\`);
  const addDiv = col.querySelector(".add-task");
  addDiv.outerHTML = \`
    <div class="add-form" data-col="\${colId}">
      <input type="text" placeholder="Task title..." id="newTitle-\${colId}" />
      <select id="newPriority-\${colId}">
        <option value="low">Low</option>
        <option value="medium" selected>Medium</option>
        <option value="high">High</option>
      </select>
      <div class="form-actions">
        <button class="save" onclick="addTask('\${colId}')">Add</button>
        <button class="cancel" onclick="render()">Cancel</button>
      </div>
    </div>
  \`;
  document.getElementById("newTitle-" + colId).focus();
}

function addTask(colId) {
  const title = document.getElementById("newTitle-" + colId).value.trim();
  const priority = document.getElementById("newPriority-" + colId).value;
  if (!title) return;
  const col = data.columns.find(c => c.id === colId);
  col.tasks.push({ id: "t" + Date.now(), title, priority, tag: "task" });
  save();
  render();
}

render();`,
    },
  },
];

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Returns all built-in marketplace templates.
 */
export function getTemplates(): MarketplaceTemplate[] {
  return BUILTIN_TEMPLATES;
}

/**
 * Returns templates filtered by a specific category.
 */
export function getTemplatesByCategory(
  category: TemplateCategory
): MarketplaceTemplate[] {
  return BUILTIN_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Searches templates by name, description, and tags.
 * The query is matched case-insensitively against all searchable fields.
 */
export function searchTemplates(query: string): MarketplaceTemplate[] {
  const q = query.toLowerCase().trim();
  if (!q) return BUILTIN_TEMPLATES;
  return BUILTIN_TEMPLATES.filter((t) => {
    const haystack = [
      t.name,
      t.description,
      ...t.tags,
      t.category,
    ]
      .join(" ")
      .toLowerCase();
    return q.split(/\s+/).every((word) => haystack.includes(word));
  });
}

/**
 * Returns a single template by its ID, or undefined if not found.
 */
export function getTemplate(id: string): MarketplaceTemplate | undefined {
  return BUILTIN_TEMPLATES.find((t) => t.id === id);
}

/**
 * Forks a marketplace template into a new project.
 * Generates a unique project ID and returns metadata ready to be persisted.
 */
export function forkTemplate(
  template: MarketplaceTemplate,
  newName?: string
): ForkResult {
  const projectId = generateId();
  const projectName = newName || `${template.name} (Fork)`;
  const fileCount = Object.keys(template.files).length;

  // Increment fork count on the source template (in-memory only)
  const source = BUILTIN_TEMPLATES.find((t) => t.id === template.id);
  if (source) {
    source.forks++;
  }

  return {
    projectId,
    projectName,
    fileCount,
  };
}

/**
 * Forks an existing user project.
 * Takes the project's files and creates a new project with a fresh ID.
 */
export function forkProject(
  _projectId: string,
  files: Record<string, { content: string }>,
  newName: string
): ForkResult {
  const projectId = generateId();
  const fileCount = Object.keys(files).length;

  return {
    projectId,
    projectName: newName,
    fileCount,
  };
}
