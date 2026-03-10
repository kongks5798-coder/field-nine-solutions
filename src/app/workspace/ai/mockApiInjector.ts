// ── Mock API Injector ──────────────────────────────────────────────────────────
// Intercepts fetch() calls inside the preview iframe and returns realistic
// mock data immediately, without hitting the network. Unknown URLs fall
// through to the original fetch so live APIs still work.

export const MOCK_PRESETS = {
  users: [
    { id: 1, name: "김민준", email: "minjun.kim@example.com", role: "admin",    avatar: "https://i.pravatar.cc/150?img=1", createdAt: "2024-01-15" },
    { id: 2, name: "이서연", email: "seoyeon.lee@example.com", role: "editor",   avatar: "https://i.pravatar.cc/150?img=2", createdAt: "2024-02-08" },
    { id: 3, name: "박지훈", email: "jihoon.park@example.com", role: "viewer",   avatar: "https://i.pravatar.cc/150?img=3", createdAt: "2024-03-22" },
    { id: 4, name: "최수아", email: "sua.choi@example.com",    role: "editor",   avatar: "https://i.pravatar.cc/150?img=4", createdAt: "2024-04-01" },
    { id: 5, name: "정우진", email: "woojin.jung@example.com", role: "viewer",   avatar: "https://i.pravatar.cc/150?img=5", createdAt: "2024-05-19" },
  ],
  products: [
    { id: 1, name: "스마트 노트북 Pro",    price: 1299000, category: "전자기기", image: "https://picsum.photos/seed/prod1/300/200", stock: 42,  rating: 4.8 },
    { id: 2, name: "무선 이어버드 X3",     price:  89000,  category: "음향기기", image: "https://picsum.photos/seed/prod2/300/200", stock: 158, rating: 4.5 },
    { id: 3, name: "에르고 오피스 체어",   price:  349000, category: "가구",    image: "https://picsum.photos/seed/prod3/300/200", stock: 17,  rating: 4.6 },
    { id: 4, name: "UHD 모니터 27인치",    price:  429000, category: "전자기기", image: "https://picsum.photos/seed/prod4/300/200", stock: 35,  rating: 4.7 },
    { id: 5, name: "기계식 키보드 TKL",    price:  129000, category: "주변기기", image: "https://picsum.photos/seed/prod5/300/200", stock: 93,  rating: 4.4 },
  ],
  posts: [
    { id: 1, title: "AI가 바꾸는 소프트웨어 개발의 미래",   body: "인공지능 도구는 개발자의 생산성을 혁신적으로 높이고 있습니다. 코드 자동완성부터 전체 기능 생성까지, AI는 이미 실무에 깊숙이 들어와 있습니다.",   author: "김민준", tags: ["AI", "개발", "트렌드"],   views: 4823, publishedAt: "2026-02-10" },
    { id: 2, title: "TypeScript 5.0 주요 변경사항 정리",   body: "TypeScript 5.0에서는 데코레이터가 정식 지원되고 const 타입 파라미터가 도입되었습니다. 마이그레이션 가이드와 함께 핵심 변경사항을 정리했습니다.",               author: "이서연", tags: ["TypeScript", "JavaScript"], views: 3201, publishedAt: "2026-01-28" },
    { id: 3, title: "Zustand vs Redux — 언제 무엇을 쓸까?", body: "상태관리 라이브러리 선택은 프로젝트 규모와 팀 컨벤션에 달려있습니다. 두 라이브러리의 장단점과 실제 사용 시나리오를 비교분석합니다.",                      author: "박지훈", tags: ["React", "상태관리"],      views: 2754, publishedAt: "2026-01-14" },
    { id: 4, title: "Next.js App Router 완벽 가이드",       body: "App Router는 React Server Components를 기반으로 레이아웃, 로딩, 에러 처리를 파일 시스템으로 선언합니다. Pages Router와의 차이점을 실전 예제로 설명합니다.", author: "최수아", tags: ["Next.js", "React"],       views: 5912, publishedAt: "2025-12-30" },
    { id: 5, title: "CSS Grid로 만드는 반응형 레이아웃",    body: "Flexbox와 달리 Grid는 2차원 레이아웃을 선언적으로 정의할 수 있습니다. 실무에서 자주 쓰는 패턴과 브레이크포인트 전략을 소개합니다.",                          author: "정우진", tags: ["CSS", "디자인"],          views: 1876, publishedAt: "2025-12-18" },
  ],
  weather: {
    city: "서울", country: "KR", timezone: "Asia/Seoul",
    current: { temp: 14, feelsLike: 11, humidity: 62, windSpeed: 3.2, description: "맑음", icon: "☀️" },
    forecast: [
      { day: "월",  high: 15, low:  8, icon: "🌤️" },
      { day: "화",  high: 17, low: 10, icon: "☀️"  },
      { day: "수",  high: 12, low:  6, icon: "🌧️" },
      { day: "목",  high: 10, low:  4, icon: "⛈️" },
      { day: "금",  high: 13, low:  7, icon: "🌥️" },
      { day: "토",  high: 16, low:  9, icon: "☀️"  },
      { day: "일",  high: 18, low: 11, icon: "🌤️" },
    ],
    uvIndex: 3, visibility: 10, pressure: 1013,
  },
  crypto: [
    { symbol: "BTC",  name: "Bitcoin",  price: 94250.00, change24h:  2.34, marketCap: 1853000000000, volume24h: 38200000000 },
    { symbol: "ETH",  name: "Ethereum", price:  3215.50, change24h: -0.87, marketCap:  386000000000, volume24h: 18900000000 },
    { symbol: "SOL",  name: "Solana",   price:   182.30, change24h:  5.12, marketCap:   85000000000, volume24h:  4200000000 },
    { symbol: "BNB",  name: "BNB",      price:   421.80, change24h:  0.45, marketCap:   62000000000, volume24h:  1900000000 },
    { symbol: "DOGE", name: "Dogecoin", price:     0.19, change24h: -1.23, marketCap:   27000000000, volume24h:   980000000 },
  ],
} as const;

export type MockPreset = keyof typeof MOCK_PRESETS;

export const ALL_MOCK_PRESETS: MockPreset[] = ["users", "products", "posts", "weather", "crypto"];

/** URL patterns that map to each preset (all case-insensitive substring matches) */
const PRESET_PATTERNS: Record<MockPreset, string[]> = {
  users:    ["/api/users", "/users", "/api/user", "/api/members", "/api/accounts"],
  products: ["/api/products", "/products", "/api/items", "/api/catalog", "/api/goods"],
  posts:    ["/api/posts", "/posts", "/api/articles", "/api/blog", "/api/news"],
  weather:  ["/api/weather", "/weather", "/api/forecast", "/api/climate"],
  crypto:   ["/api/crypto", "/crypto", "/api/coins", "/api/prices", "/api/ticker"],
};

// Build a flat URL-pattern → data mapping for the enabled presets
function buildMockData(enabledPresets: readonly MockPreset[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const preset of enabledPresets) {
    for (const pattern of PRESET_PATTERNS[preset]) {
      result[pattern] = MOCK_PRESETS[preset];
    }
  }
  return result;
}

/**
 * Returns a self-invoking JS script string that overrides `window.fetch` inside
 * the preview iframe. Matching requests are resolved immediately with mock JSON.
 */
export function buildMockApiScript(enabledPresets: readonly MockPreset[]): string {
  if (enabledPresets.length === 0) return "";
  const mocks = buildMockData(enabledPresets);
  return `<script>(function(){
var _f=window.fetch;
var MOCKS=${JSON.stringify(mocks)};
window.fetch=function(url,opts){
  var u=String(url).toLowerCase();
  for(var pattern in MOCKS){
    if(u.includes(pattern)){
      var data=MOCKS[pattern];
      return Promise.resolve(new Response(JSON.stringify(data),{status:200,headers:{'Content-Type':'application/json'}}));
    }
  }
  return _f?_f.call(window,url,opts):Promise.reject(new Error('fetch not available'));
};
})()</script>`;
}
