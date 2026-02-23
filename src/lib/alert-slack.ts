/**
 * Dalkak — Slack Alert Integration
 *
 * 에러를 심각도에 따라 분류한 뒤, critical/error 등급이면
 * Slack Incoming Webhook으로 자동 알림을 보낸다.
 * 알림 실패 시 순환 에러를 방지하기 위해 예외를 무시한다.
 */

import {
  classifyError,
  severityEmoji,
  type ClassifiedError,
} from "./error-severity";

const SLACK_WEBHOOK_URL = process.env.SLACK_ALERT_WEBHOOK_URL;

export async function alertIfNeeded(
  error: Error | string,
  context?: Record<string, unknown>,
): Promise<ClassifiedError> {
  const classified = classifyError(error, context);

  if (classified.shouldAlert && SLACK_WEBHOOK_URL) {
    try {
      await fetch(SLACK_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `${severityEmoji(classified.severity)} *[${classified.severity.toUpperCase()}]* ${classified.category}\n${classified.message}`,
          blocks: [
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `${severityEmoji(classified.severity)} *[Dalkak ${classified.severity.toUpperCase()}]*\n*\uCE74\uD14C\uACE0\uB9AC:* ${classified.category}\n*\uBA54\uC2DC\uC9C0:* ${classified.message}`,
              },
            },
            ...(classified.context
              ? [
                  {
                    type: "context",
                    elements: [
                      {
                        type: "mrkdwn",
                        text: `\`\`\`${JSON.stringify(classified.context, null, 2).slice(0, 500)}\`\`\``,
                      },
                    ],
                  },
                ]
              : []),
          ],
        }),
      });
    } catch {
      // Slack 알림 실패는 무시 (순환 에러 방지)
    }
  }

  return classified;
}
