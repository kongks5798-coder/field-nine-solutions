// ── #6 Webhook Notification API ──────────────────────────────────────────────
// Send notifications to Slack, Discord, or custom webhooks
// when build/deploy/error events occur in the workspace.

import { NextRequest, NextResponse } from "next/server";

export type WebhookEvent = "build_success" | "build_error" | "deploy_success" | "deploy_error" | "security_alert" | "quality_report";

interface WebhookPayload {
  event: WebhookEvent;
  project?: string;
  message: string;
  details?: Record<string, unknown>;
  webhookUrl: string;
  platform?: "slack" | "discord" | "custom";
}

export async function POST(request: NextRequest) {
  try {
    const body: WebhookPayload = await request.json();
    const { event, project, message, details, webhookUrl, platform = "custom" } = body;

    if (!webhookUrl || !message) {
      return NextResponse.json(
        { error: "Missing required fields: webhookUrl, message" },
        { status: 400 },
      );
    }

    // Validate URL
    try {
      new URL(webhookUrl);
    } catch {
      return NextResponse.json({ error: "Invalid webhookUrl" }, { status: 400 });
    }

    // Format payload based on platform
    let payload: Record<string, unknown>;

    switch (platform) {
      case "slack":
        payload = {
          text: `*[${event.toUpperCase()}]* ${project ? `_${project}_` : ""}\n${message}`,
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*${getEventEmoji(event)} ${getEventLabel(event)}*\n${project ? `*Project:* ${project}\n` : ""}${message}`,
              },
            },
            ...(details ? [{
              type: "context",
              elements: [{
                type: "mrkdwn",
                text: Object.entries(details).map(([k, v]) => `*${k}:* ${v}`).join(" | "),
              }],
            }] : []),
          ],
        };
        break;

      case "discord":
        payload = {
          embeds: [{
            title: `${getEventEmoji(event)} ${getEventLabel(event)}`,
            description: message,
            color: getEventColor(event),
            fields: [
              ...(project ? [{ name: "Project", value: project, inline: true }] : []),
              ...(details ? Object.entries(details).map(([k, v]) => ({
                name: k, value: String(v), inline: true,
              })) : []),
            ],
            timestamp: new Date().toISOString(),
            footer: { text: "FieldNine AI" },
          }],
        };
        break;

      default:
        payload = {
          event,
          project,
          message,
          details,
          timestamp: new Date().toISOString(),
          source: "fieldnine",
        };
    }

    // Send webhook
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Webhook delivery failed: ${res.status}` },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      event,
      deliveredTo: platform,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Internal error: ${(err as Error)?.message ?? "unknown"}` },
      { status: 500 },
    );
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getEventEmoji(event: WebhookEvent): string {
  const map: Record<string, string> = {
    build_success: "✅", build_error: "❌",
    deploy_success: "🚀", deploy_error: "💥",
    security_alert: "🔒", quality_report: "📊",
  };
  return map[event] ?? "📣";
}

function getEventLabel(event: WebhookEvent): string {
  const map: Record<string, string> = {
    build_success: "빌드 성공", build_error: "빌드 오류",
    deploy_success: "배포 완료", deploy_error: "배포 실패",
    security_alert: "보안 경고", quality_report: "품질 보고서",
  };
  return map[event] ?? event;
}

function getEventColor(event: WebhookEvent): number {
  const map: Record<string, number> = {
    build_success: 0x16a34a, build_error: 0xdc2626,
    deploy_success: 0x2563eb, deploy_error: 0xdc2626,
    security_alert: 0xf97316, quality_report: 0x8b5cf6,
  };
  return map[event] ?? 0x6b7280;
}
