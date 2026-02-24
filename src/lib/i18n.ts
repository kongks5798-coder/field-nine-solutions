/**
 * Lightweight i18n utility for Dalkak.
 * Supports ko / en / ja with localStorage persistence.
 */

export type Locale = "ko" | "en" | "ja";

const DEFAULT_LOCALE: Locale = "ko";
const LOCALE_STORAGE_KEY = "dalkak_locale";

type TranslationKey = string;
type Translations = Record<TranslationKey, string>;

const messages: Record<Locale, Translations> = {
  ko: {
    // common
    "common.loading": "로딩 중...",
    "common.error": "오류가 발생했습니다",
    "common.retry": "다시 시도",
    "common.save": "저장",
    "common.cancel": "취소",
    "common.delete": "삭제",
    "common.confirm": "확인",
    "common.close": "닫기",
    "common.search": "검색",
    "common.back": "뒤로",
    "common.login": "로그인",
    "common.signup": "회원가입",
    "common.logout": "로그아웃",
    // nav
    "nav.home": "홈",
    "nav.workspace": "워크스페이스",
    "nav.dashboard": "대시보드",
    "nav.team": "팀",
    "nav.cloud": "클라우드",
    "nav.settings": "설정",
    "nav.blog": "블로그",
    "nav.showcase": "쇼케이스",
    "nav.pricing": "요금제",
    "nav.login": "로그인",
    "nav.signup": "회원가입",
    "nav.logout": "로그아웃",
    // workspace
    "workspace.newProject": "새 프로젝트",
    "workspace.run": "실행",
    "workspace.deploy": "배포",
    "workspace.templates": "템플릿 갤러리",
    // dashboard
    "dashboard.welcome": "환영합니다",
    "dashboard.recentProjects": "최근 프로젝트",
    "dashboard.noProjects": "첫 프로젝트를 만들어보세요!",
    // pricing
    "pricing.free": "무료",
    "pricing.pro": "프로",
    "pricing.team": "팀",
    "pricing.enterprise": "엔터프라이즈",
    // auth
    "auth.email": "이메일",
    "auth.password": "비밀번호",
    "auth.forgot_password": "비밀번호 찾기",
    // errors
    "error.not_found": "페이지를 찾을 수 없습니다",
    "error.unauthorized": "인증이 필요합니다",
    "error.server": "서버 오류가 발생했습니다",
    "error.rate_limit": "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
  },
  en: {
    // common
    "common.loading": "Loading...",
    "common.error": "An error occurred",
    "common.retry": "Retry",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.confirm": "Confirm",
    "common.close": "Close",
    "common.search": "Search",
    "common.back": "Back",
    "common.login": "Log In",
    "common.signup": "Sign Up",
    "common.logout": "Log Out",
    // nav
    "nav.home": "Home",
    "nav.workspace": "Workspace",
    "nav.dashboard": "Dashboard",
    "nav.team": "Team",
    "nav.cloud": "Cloud",
    "nav.settings": "Settings",
    "nav.blog": "Blog",
    "nav.showcase": "Showcase",
    "nav.pricing": "Pricing",
    "nav.login": "Log in",
    "nav.signup": "Sign up",
    "nav.logout": "Log out",
    // workspace
    "workspace.newProject": "New Project",
    "workspace.run": "Run",
    "workspace.deploy": "Deploy",
    "workspace.templates": "Template Gallery",
    // dashboard
    "dashboard.welcome": "Welcome",
    "dashboard.recentProjects": "Recent Projects",
    "dashboard.noProjects": "Create your first project!",
    // pricing
    "pricing.free": "Free",
    "pricing.pro": "Pro",
    "pricing.team": "Team",
    "pricing.enterprise": "Enterprise",
    // auth
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.forgot_password": "Forgot password",
    // errors
    "error.not_found": "Page not found",
    "error.unauthorized": "Authentication required",
    "error.server": "Server error occurred",
    "error.rate_limit": "Too many requests. Please try again later.",
  },
  ja: {
    // common
    "common.loading": "読み込み中...",
    "common.error": "エラーが発生しました",
    "common.retry": "再試行",
    "common.save": "保存",
    "common.cancel": "キャンセル",
    "common.delete": "削除",
    "common.confirm": "確認",
    "common.close": "閉じる",
    "common.search": "検索",
    "common.back": "戻る",
    "common.login": "ログイン",
    "common.signup": "サインアップ",
    "common.logout": "ログアウト",
    // nav
    "nav.home": "ホーム",
    "nav.workspace": "ワークスペース",
    "nav.dashboard": "ダッシュボード",
    "nav.team": "チーム",
    "nav.cloud": "クラウド",
    "nav.settings": "設定",
    "nav.blog": "ブログ",
    "nav.showcase": "ショーケース",
    "nav.pricing": "料金",
    "nav.login": "ログイン",
    "nav.signup": "サインアップ",
    "nav.logout": "ログアウト",
    // workspace
    "workspace.newProject": "新規プロジェクト",
    "workspace.run": "実行",
    "workspace.deploy": "デプロイ",
    "workspace.templates": "テンプレートギャラリー",
    // dashboard
    "dashboard.welcome": "ようこそ",
    "dashboard.recentProjects": "最近のプロジェクト",
    "dashboard.noProjects": "最初のプロジェクトを作成しましょう！",
    // pricing
    "pricing.free": "無料",
    "pricing.pro": "プロ",
    "pricing.team": "チーム",
    "pricing.enterprise": "エンタープライズ",
    // auth
    "auth.email": "メール",
    "auth.password": "パスワード",
    "auth.forgot_password": "パスワードを忘れた",
    // errors
    "error.not_found": "ページが見つかりません",
    "error.unauthorized": "認証が必要です",
    "error.server": "サーバーエラーが発生しました",
    "error.rate_limit": "リクエストが多すぎます。しばらくしてからもう一度お試しください。",
  },
};

let currentLocale: Locale = DEFAULT_LOCALE;

// Restore locale from localStorage on module load (client-side only)
if (typeof window !== "undefined") {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && (stored === "ko" || stored === "en" || stored === "ja")) {
      currentLocale = stored as Locale;
    }
  } catch { /* localStorage unavailable */ }
}

export function setLocale(locale: Locale): void {
  currentLocale = locale;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch { /* localStorage unavailable */ }
  }
}

export function getLocale(): Locale {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (stored && (stored === "ko" || stored === "en" || stored === "ja")) {
        currentLocale = stored as Locale;
      }
    } catch { /* localStorage unavailable */ }
  }
  return currentLocale;
}

export function t(key: TranslationKey, locale?: Locale): string {
  const loc = locale ?? currentLocale;
  return messages[loc]?.[key] ?? messages[DEFAULT_LOCALE]?.[key] ?? key;
}

export function getSupportedLocales(): Locale[] {
  return Object.keys(messages) as Locale[];
}
