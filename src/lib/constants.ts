/* ── Site URL ────────────────────────────────────────────────────────────── */

/** Canonical site URL — respects NEXT_PUBLIC_SITE_URL override for staging / preview */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://fieldnine.io";

/* ── External API base URLs ──────────────────────────────────────────────── */

/** OpenAI API base (GPT, DALL-E, etc.) */
export const OPENAI_API_BASE = "https://api.openai.com/v1";

/** Anthropic API base (Claude) */
export const ANTHROPIC_API_BASE = "https://api.anthropic.com/v1";

/** Google Generative Language API base (Gemini) */
export const GEMINI_API_BASE = "https://generativelanguage.googleapis.com";

/** TossPayments API base */
export const TOSS_API_BASE = "https://api.tosspayments.com/v1";

/** xAI API base (Grok) */
export const XAI_API_BASE = "https://api.x.ai/v1";
