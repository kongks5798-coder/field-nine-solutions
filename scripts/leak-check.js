import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const NEXT_DIR = path.join(ROOT, ".next");

const sensitiveNames = [
  "ADMIN_PASSWORD",
  "JWT_SECRET",
  "SESSION_SECRET",
  "SUPABASE_SERVICE_KEY",
  "GOOGLE_CLIENT_SECRET",
  "TOSS_SECRET_KEY",
  "AI_INTEGRATIONS_OPENAI_API_KEY",
  "AI_INTEGRATIONS_OPENROUTER_API_KEY",
  "ANTHROPIC_API_KEY",
  "GEMINI_API_KEY",
];

const textExts = new Set([".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx", ".css", ".html"]);

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function isClientPath(p) {
  const rel = path.relative(NEXT_DIR, p).replace(/\\/g, "/");
  return rel.startsWith("static/");
}

function scan() {
  const files = walk(NEXT_DIR).filter((p) => textExts.has(path.extname(p)));
  const findings = [];
  for (const file of files) {
    let content;
    try {
      content = fs.readFileSync(file, "utf8");
    } catch {
      continue;
    }
    for (const name of sensitiveNames) {
      if (content.includes(name)) {
        findings.push({ file, name, client: isClientPath(file) });
      }
    }
  }
  return findings;
}

function main() {
  const findings = scan();
  const clientLeaks = findings.filter((f) => f.client);
  const serverMentions = findings.filter((f) => !f.client);
  const summary = {
    files_scanned: findings.length ? undefined : walk(NEXT_DIR).length,
    client_leaks: clientLeaks,
    server_mentions: serverMentions,
    ok: clientLeaks.length === 0,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (!summary.ok) process.exit(2);
}

main();
