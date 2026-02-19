/**
 * Secret Leak Check — scans SOURCE files (src/) for sensitive env var usage
 * in client components ('use client').
 *
 * Checks: process.env.SENSITIVE_VAR referenced in client-side code
 * Ignores: string literals used as UI labels (e.g., "ADMIN_PASSWORD" as display text)
 */

import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "src");

// Server-only env vars that must NEVER be accessed from client components
const sensitiveVars = [
  "ADMIN_PASSWORD",
  "JWT_SECRET",
  "SESSION_SECRET",
  "SUPABASE_SERVICE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "GOOGLE_CLIENT_SECRET",
  "TOSS_SECRET_KEY",
  "ANTHROPIC_API_KEY",
  "OPENAI_API_KEY",
  "GOOGLE_GENERATIVE_AI_API_KEY",
  "AI_INTEGRATIONS_OPENAI_API_KEY",
  "AI_INTEGRATIONS_OPENROUTER_API_KEY",
  "GEMINI_API_KEY",
  "VERCEL_TOKEN",
  "GITHUB_CLIENT_SECRET",
];

const textExts = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs"]);

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function isClientFile(content) {
  // File must start with 'use client' directive
  return /^['"]use client['"]/.test(content.trimStart());
}

function scan() {
  const files = walk(SRC_DIR).filter((p) => textExts.has(path.extname(p)));
  const findings = [];

  for (const file of files) {
    let content;
    try {
      content = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }

    if (!isClientFile(content)) continue;

    for (const varName of sensitiveVars) {
      // Check for actual process.env access (not just display strings)
      const pattern = new RegExp(`process\\.env\\.${varName}(?!_)`, "g");
      if (pattern.test(content)) {
        findings.push({
          file: path.relative(ROOT, file).replace(/\\/g, "/"),
          varName,
          issue: `process.env.${varName} accessed in client component`,
        });
      }
    }
  }

  return findings;
}

function main() {
  const findings = scan();
  const ok = findings.length === 0;
  const summary = { ok, client_leaks: findings };
  console.log(JSON.stringify(summary, null, 2));
  if (!ok) {
    console.error(
      "\n❌ Secret leak detected: server-only env vars accessed in client components."
    );
    console.error(
      "   Move these to server-side code (API routes, Server Components, etc.)\n"
    );
    process.exit(2);
  }
  console.log("✅ No secret leaks found in client components.");
}

main();
