export async function zapierNotify(event: string, payload: unknown) {
  const url = process.env.ZAPIER_WEBHOOK_URL || "";
  if (!url) return;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, payload }),
  }).catch(() => {});
}
