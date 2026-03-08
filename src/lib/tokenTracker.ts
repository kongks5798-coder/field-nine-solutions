import { getAdminClient } from "@/lib/supabase-admin";

export interface TokenUsage {
  used: number;
  limit: number;
  remaining: number;
  plan: string;
  resetDate: string;
}

/**
 * Estimate tokens from text (rough approximation: 1 token ≈ 4 chars)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Plan token limits (mirrors PLAN_TOKENS in plans.ts, with a free/starter fallback)
const TOKEN_PLAN_LIMITS: Record<string, number> = {
  free:    50_000,
  starter: 50_000,
  pro:     500_000,
  team:    2_000_000,
};

/**
 * Get current month's token usage for a user from Supabase.
 * Falls back to permissive defaults if the table doesn't exist yet.
 */
export async function getUserTokenUsage(userId: string): Promise<TokenUsage> {
  try {
    const adminSb = getAdminClient();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Get user plan
    const { data: profile } = await adminSb
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .single();

    const plan = profile?.plan ?? "free";
    const limit = TOKEN_PLAN_LIMITS[plan] ?? 50_000;

    // Sum tokens_used from usage_records for this month
    // Rows without tokens_used (call-count rows) have null — coalesce to 0
    const { data: usage } = await adminSb
      .from("usage_records")
      .select("tokens_used")
      .eq("user_id", userId)
      .gte("created_at", monthStart);

    const used = (usage ?? []).reduce(
      (sum: number, r: { tokens_used?: number | null }) =>
        sum + (r.tokens_used ?? 0),
      0
    );

    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    return {
      used,
      limit,
      remaining: Math.max(0, limit - used),
      plan,
      resetDate: nextMonth.toISOString(),
    };
  } catch {
    // Graceful fallback — don't block AI if tracking fails
    return { used: 0, limit: 50_000, remaining: 50_000, plan: "free", resetDate: "" };
  }
}

/**
 * Record token usage after a successful AI request.
 * Inserts a separate row with type 'token_usage' so it doesn't conflict with
 * the existing call-count rows (type 'ai_call').
 */
export async function recordTokenUsage(
  userId: string,
  tokensUsed: number,
  modelId: string,
): Promise<void> {
  try {
    const adminSb = getAdminClient();
    const period = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
    await adminSb.from("usage_records").insert({
      user_id: userId,
      type: "token_usage",
      tokens_used: tokensUsed,
      model: modelId,
      quantity: tokensUsed,
      unit_price: 0,
      amount: 0,
      billed: false,
      billing_period: period,
      created_at: new Date().toISOString(),
    });
  } catch {
    // Non-fatal — don't fail the request if tracking fails
    console.warn("[tokenTracker] Failed to record token usage:", { userId, tokensUsed, modelId });
  }
}
