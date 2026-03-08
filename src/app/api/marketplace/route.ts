import { NextResponse } from "next/server";

// Curated template library — hardcoded for now, can move to DB later
const TEMPLATES = [
  {
    id: "rpg-game",
    name: "RPG 게임",
    category: "game",
    icon: "🎮",
    description: "마을을 탐험하고 몬스터를 잡는 턴제 RPG 게임",
    difficulty: "advanced",
    tags: ["게임", "RPG", "인터랙티브"],
    prompt: "리니지급 2D RPG 게임을 만들어줘. 캐릭터 이동, 몬스터 전투, 레벨업, 인벤토리 시스템 포함. 픽셀아트 스타일.",
    preview_gradient: "linear-gradient(135deg, #1a1a2e, #16213e, #0f3460)",
    stars: 4.9, forks: 234, views: 12500,
  },
  {
    id: "ecommerce",
    name: "패션 쇼핑몰",
    category: "ecommerce",
    icon: "🛒",
    description: "무신사급 패션 e커머스 플랫폼",
    difficulty: "advanced",
    tags: ["쇼핑몰", "이커머스", "패션"],
    prompt: "무신사 같은 프리미엄 패션 쇼핑몰 만들어줘. 상품 목록, 필터, 장바구니, 결제 UI 포함.",
    preview_gradient: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
    stars: 4.8, forks: 189, views: 9800,
  },
  {
    id: "dashboard",
    name: "어드민 대시보드",
    category: "dashboard",
    icon: "📊",
    description: "실시간 차트와 KPI를 보여주는 분석 대시보드",
    difficulty: "intermediate",
    tags: ["대시보드", "차트", "분석"],
    prompt: "매출 분석 어드민 대시보드 만들어줘. 라인차트, 파이차트, KPI카드, 최근 주문 테이블 포함.",
    preview_gradient: "linear-gradient(135deg, #0d1117, #161b22, #1f2937)",
    stars: 4.7, forks: 156, views: 8200,
  },
  {
    id: "music-player",
    name: "음악 플레이어",
    category: "entertainment",
    icon: "🎵",
    description: "스포티파이 스타일의 음악 스트리밍 UI",
    difficulty: "intermediate",
    tags: ["음악", "플레이어", "스트리밍"],
    prompt: "스포티파이 같은 음악 플레이어 앱 만들어줘. 앨범 아트, 재생바, 플레이리스트, 음악 시각화 포함.",
    preview_gradient: "linear-gradient(135deg, #1db954, #191414)",
    stars: 4.8, forks: 201, views: 11000,
  },
  {
    id: "social-media",
    name: "소셜 미디어",
    category: "social",
    icon: "📱",
    description: "인스타그램 스타일의 소셜 피드",
    difficulty: "advanced",
    tags: ["소셜", "SNS", "피드"],
    prompt: "인스타그램 같은 소셜 미디어 앱 만들어줘. 피드, 스토리, 좋아요, 댓글, DM UI 포함.",
    preview_gradient: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)",
    stars: 4.6, forks: 145, views: 7600,
  },
  {
    id: "weather-app",
    name: "날씨 앱",
    category: "utility",
    icon: "🌤",
    description: "현재 날씨와 주간 예보를 보여주는 날씨 앱",
    difficulty: "beginner",
    tags: ["날씨", "API", "유틸리티"],
    prompt: "애플 날씨 앱 같은 미니멀한 날씨 앱 만들어줘. 현재 날씨, 7일 예보, 시간별 예보, 애니메이션 배경 포함.",
    preview_gradient: "linear-gradient(135deg, #2980b9, #6dd5fa, #ffffff)",
    stars: 4.5, forks: 98, views: 5400,
  },
  {
    id: "calculator",
    name: "공학용 계산기",
    category: "utility",
    icon: "🔢",
    description: "삼각함수, 로그 등 공학 계산 기능이 있는 계산기",
    difficulty: "beginner",
    tags: ["계산기", "수학", "유틸리티"],
    prompt: "아이폰 공학용 계산기 같은 계산기 만들어줘. sin/cos/tan, log, 제곱근, 괄호 연산 지원.",
    preview_gradient: "linear-gradient(135deg, #1a1a1a, #2d2d2d)",
    stars: 4.4, forks: 78, views: 4200,
  },
  {
    id: "todo-app",
    name: "Todo 앱",
    category: "productivity",
    icon: "✅",
    description: "드래그앤드롭 칸반 보드 Todo 앱",
    difficulty: "beginner",
    tags: ["Todo", "생산성", "칸반"],
    prompt: "Notion 같은 칸반 보드 Todo 앱 만들어줘. 드래그앤드롭, 태그, 마감일, 우선순위 기능 포함.",
    preview_gradient: "linear-gradient(135deg, #667eea, #764ba2)",
    stars: 4.3, forks: 67, views: 3800,
  },
  {
    id: "crypto-tracker",
    name: "암호화폐 트래커",
    category: "finance",
    icon: "₿",
    description: "비트코인/이더리움 실시간 가격 추적 앱",
    difficulty: "intermediate",
    tags: ["암호화폐", "금융", "차트"],
    prompt: "코인마켓캡 같은 암호화폐 트래커 만들어줘. 실시간 가격, 차트, 포트폴리오 추적 포함. Mock 데이터 사용.",
    preview_gradient: "linear-gradient(135deg, #f7971e, #ffd200)",
    stars: 4.6, forks: 134, views: 7100,
  },
  {
    id: "blog-platform",
    name: "블로그 플랫폼",
    category: "content",
    icon: "✍️",
    description: "Medium 스타일의 블로그 플랫폼",
    difficulty: "intermediate",
    tags: ["블로그", "콘텐츠", "에디터"],
    prompt: "Medium 같은 블로그 플랫폼 만들어줘. 글 목록, 에디터, 태그, 읽기 시간, 좋아요 포함.",
    preview_gradient: "linear-gradient(135deg, #00b09b, #96c93d)",
    stars: 4.5, forks: 112, views: 6200,
  },
  {
    id: "portfolio",
    name: "개발자 포트폴리오",
    category: "portfolio",
    icon: "💼",
    description: "스크롤 애니메이션이 있는 개발자 포트폴리오",
    difficulty: "beginner",
    tags: ["포트폴리오", "이력서", "애니메이션"],
    prompt: "세련된 개발자 포트폴리오 웹사이트 만들어줘. 스크롤 애니메이션, 프로젝트 갤러리, 기술 스택, 연락처 포함.",
    preview_gradient: "linear-gradient(135deg, #2c3e50, #4ca1af)",
    stars: 4.7, forks: 189, views: 10200,
  },
  {
    id: "chat-app",
    name: "채팅 앱",
    category: "social",
    icon: "💬",
    description: "카카오톡 스타일의 채팅 인터페이스",
    difficulty: "intermediate",
    tags: ["채팅", "메신저", "소셜"],
    prompt: "카카오톡 같은 채팅 앱 UI 만들어줘. 대화 목록, 채팅방, 이모지, 파일 전송 UI, 읽음 표시 포함.",
    preview_gradient: "linear-gradient(135deg, #fee140, #fa709a)",
    stars: 4.4, forks: 89, views: 5100,
  },
];

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const q = searchParams.get("q")?.toLowerCase();
  const sort = searchParams.get("sort") ?? "views";

  let filtered = [...TEMPLATES];
  if (category && category !== "all") filtered = filtered.filter(t => t.category === category);
  if (q) filtered = filtered.filter(t =>
    t.name.toLowerCase().includes(q) || t.tags.some(tag => tag.toLowerCase().includes(q))
  );
  filtered.sort((a, b) => sort === "stars" ? b.stars - a.stars : b.views - a.views);

  return Response.json({ templates: filtered });
}
