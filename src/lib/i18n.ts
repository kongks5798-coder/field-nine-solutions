/**
 * Lightweight i18n utility for Dalkak.
 * Currently Korean-only, structured for future expansion.
 */

export type Locale = "ko" | "en" | "ja";

const DEFAULT_LOCALE: Locale = "ko";

type TranslationKey = string;
type Translations = Record<TranslationKey, string>;

const messages: Record<Locale, Translations> = {
  ko: {
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
    "nav.home": "홈",
    "nav.workspace": "워크스페이스",
    "nav.dashboard": "대시보드",
    "nav.settings": "설정",
    "nav.login": "로그인",
    "nav.signup": "회원가입",
    "nav.logout": "로그아웃",
    "auth.email": "이메일",
    "auth.password": "비밀번호",
    "auth.forgot_password": "비밀번호 찾기",
    "error.not_found": "페이지를 찾을 수 없습니다",
    "error.unauthorized": "인증이 필요합니다",
    "error.server": "서버 오류가 발생했습니다",
    "error.rate_limit": "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.",
  },
  en: {
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
    "nav.home": "Home",
    "nav.workspace": "Workspace",
    "nav.dashboard": "Dashboard",
    "nav.settings": "Settings",
    "nav.login": "Log in",
    "nav.signup": "Sign up",
    "nav.logout": "Log out",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.forgot_password": "Forgot password",
    "error.not_found": "Page not found",
    "error.unauthorized": "Authentication required",
    "error.server": "Server error occurred",
    "error.rate_limit": "Too many requests. Please try again later.",
  },
  ja: {
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
    "nav.home": "ホーム",
    "nav.workspace": "ワークスペース",
    "nav.dashboard": "ダッシュボード",
    "nav.settings": "設定",
    "nav.login": "ログイン",
    "nav.signup": "サインアップ",
    "nav.logout": "ログアウト",
    "auth.email": "メール",
    "auth.password": "パスワード",
    "auth.forgot_password": "パスワードを忘れた",
    "error.not_found": "ページが見つかりません",
    "error.unauthorized": "認証が必要です",
    "error.server": "サーバーエラーが発生しました",
    "error.rate_limit": "リクエストが多すぎます。しばらくしてからもう一度お試しください。",
  },
};

let currentLocale: Locale = DEFAULT_LOCALE;

export function setLocale(locale: Locale): void {
  currentLocale = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

export function t(key: TranslationKey, locale?: Locale): string {
  const loc = locale ?? currentLocale;
  return messages[loc]?.[key] ?? messages[DEFAULT_LOCALE]?.[key] ?? key;
}

export function getSupportedLocales(): Locale[] {
  return Object.keys(messages) as Locale[];
}
