import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/core/adminAuth";
import { getAdminClient } from "@/lib/supabase-admin";
import { sendPlanChangedEmail } from "@/lib/email";
import { z } from "zod";
import { log } from "@/lib/logger";

const PlanSchema = z.object({
  plan: z.enum(["pro", "team"]).nullable(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = PlanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "plan은 pro, team, 또는 null이어야 합니다." }, { status: 400 });
  }
  const { plan } = parsed.data;

  const admin = getAdminClient();
  const now   = new Date().toISOString();

  const expires = plan ? (() => {
    const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString();
  })() : null;

  const { error } = await admin
    .from("profiles")
    .update({ plan, plan_expires_at: expires, plan_updated_at: now })
    .eq("id", id);

  if (error) return NextResponse.json({ error: "Failed to update user plan" }, { status: 500 });

  // billing_events 기록
  await admin.from("billing_events").insert({
    user_id:     id,
    type:        plan ? "subscription_created" : "subscription_canceled",
    amount:      0,
    description: plan ? `관리자 수동 플랜 설정: ${plan}` : "관리자 수동 플랜 해제",
    metadata:    { admin_action: true },
  });

  // 유저 이메일 조회 후 알림 발송 (fire-and-forget)
  admin.from("profiles").select("email").eq("id", id).single().then(({ data }) => {
    if (data?.email) sendPlanChangedEmail(data.email, plan).catch(() => {});
  });

  log.billing("admin.plan.updated", { uid: id, plan });
  return NextResponse.json({ success: true, plan, plan_expires_at: expires });
}
