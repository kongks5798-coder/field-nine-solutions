export async function slackNotify(text: string) {
  const webhook = process.env.SLACK_WEBHOOK_URL || "";
  const botToken = process.env.SLACK_BOT_TOKEN || "";
  const channel = process.env.SLACK_CHANNEL_ID || "";
  if (webhook) {
    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    }).catch(() => {});
    return;
  }
  if (botToken && channel) {
    await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Bearer ${botToken}`,
      },
      body: JSON.stringify({ channel, text }),
    }).catch(() => {});
  }
}
