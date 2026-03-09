#!/usr/bin/env npx tsx
// gen-secrets.ts — Generate required environment variable values
// Run: npx tsx scripts/gen-secrets.ts

import { randomBytes } from "crypto";

function gen(label: string, bytes = 32) {
  const value = randomBytes(bytes).toString("hex");
  console.log(`${label}=${value}`);
}

console.log("\n# ─────────────────────────────────────────");
console.log("# Auto-generated secrets — add to Vercel Dashboard");
console.log("# ─────────────────────────────────────────\n");

gen("UNSUBSCRIBE_SECRET");
gen("TOSSPAYMENTS_WEBHOOK_SECRET");

console.log("\n# ─────────────────────────────────────────");
console.log("# Also required (get from respective dashboards):");
console.log("# TOSSPAYMENTS_CLIENT_KEY=test_ck_...");
console.log("# TOSSPAYMENTS_SECRET_KEY=test_sk_...");
console.log("# ANTHROPIC_API_KEY=sk-ant-...  (add to GitHub Secrets too)");
console.log("# ─────────────────────────────────────────\n");
