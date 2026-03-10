import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import JSZip from "jszip";
import { checkRateLimit } from "@/lib/rate-limit";

// ── Types ────────────────────────────────────────────────────────────────────

const FileNodeSchema = z.object({
  name: z.string(),
  language: z.string(),
  content: z.string(),
});

const ConvertSchema = z.object({
  files: z.record(z.string(), FileNodeSchema),
  projectName: z.string().min(1).max(100).default("DalkakApp"),
});

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Convert a projectName string into a valid PascalCase React component name. */
function toComponentName(name: string): string {
  const cleaned = name
    .replace(/[^a-zA-Z0-9가-힣\s]/g, " ")
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("")
    .replace(/[^a-zA-Z0-9]/g, "")
    .replace(/^\d+/, ""); // must not start with digit
  return cleaned.length > 0 ? cleaned : "DalkakApp";
}

/** Extract <body> inner HTML from a full HTML document. */
function extractBodyHtml(html: string): string {
  const match = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(html);
  if (match) return match[1].trim();
  // Fallback: strip <html>, <head>, <body> tags
  return html
    .replace(/<html[^>]*>/gi, "")
    .replace(/<\/html>/gi, "")
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<body[^>]*>/gi, "")
    .replace(/<\/body>/gi, "")
    .trim();
}

/** Extract content from all <style> tags inside an HTML string. */
function extractStyleTags(html: string): string {
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  const chunks: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = styleRegex.exec(html)) !== null) {
    if (m[1]) chunks.push(m[1].trim());
  }
  return chunks.join("\n\n");
}

/** Extract content from all inline <script> tags (not src=) inside an HTML string. */
function extractScriptTags(html: string): string {
  const scriptRegex = /<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/gi;
  const chunks: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = scriptRegex.exec(html)) !== null) {
    if (m[1]) chunks.push(m[1].trim());
  }
  return chunks.join("\n\n");
}

/** Strip <style> and <script> tags from body HTML (they go into their own sections). */
function stripStyleAndScript(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .trim();
}

/** Escape a string so it is safe inside a template literal backtick string. */
function escapeTemplateLiteral(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
}

// ── ZIP file generators ───────────────────────────────────────────────────────

function makePackageJson(name: string): string {
  const safeName = name.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/^-+|-+$/g, "") || "dalkak-app";
  return JSON.stringify(
    {
      name: safeName,
      private: true,
      version: "0.1.0",
      type: "module",
      scripts: {
        dev: "vite",
        build: "tsc && vite build",
        preview: "vite preview",
      },
      dependencies: {
        react: "^18.3.1",
        "react-dom": "^18.3.1",
      },
      devDependencies: {
        "@types/react": "^18.3.12",
        "@types/react-dom": "^18.3.1",
        "@vitejs/plugin-react": "^4.3.4",
        typescript: "^5.7.2",
        vite: "^6.0.5",
      },
    },
    null,
    2
  );
}

const viteConfig = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
`;

const indexHtml = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>딸깍 앱</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

const tsConfig = JSON.stringify(
  {
    compilerOptions: {
      target: "ES2020",
      useDefineForClassFields: true,
      lib: ["ES2020", "DOM", "DOM.Iterable"],
      module: "ESNext",
      skipLibCheck: true,
      moduleResolution: "bundler",
      allowImportingTsExtensions: true,
      isolatedModules: true,
      moduleDetection: "force",
      noEmit: true,
      jsx: "react-jsx",
      strict: true,
    },
    include: ["src"],
  },
  null,
  2
);

function makeMainTsx(componentName: string): string {
  return `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import ${componentName} from './${componentName}';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <${componentName} />
  </StrictMode>
);
`;
}

function makeReadme(projectName: string, componentName: string): string {
  return `# ${projectName}

> 딸깍(Dalkak)으로 만든 앱 — React 버전

## 실행 방법

\`\`\`bash
npm install
npm run dev
\`\`\`

## 구조

- \`src/${componentName}.tsx\` — 메인 React 컴포넌트
- \`src/main.tsx\` — React 앱 엔트리포인트

---

Made with [딸깍 (Dalkak)](https://fieldnine.io) — AI App Builder
`;
}

function makeAppTsx(componentName: string, css: string, js: string, htmlBody: string): string {
  const escapedCss = escapeTemplateLiteral(css);
  const escapedJs = escapeTemplateLiteral(js);
  const escapedHtml = escapeTemplateLiteral(htmlBody);

  const useEffectBlock =
    escapedJs.trim().length > 0
      ? `
  useEffect(() => {
    const script = document.createElement('script');
    script.textContent = \`${escapedJs}\`;
    containerRef.current?.appendChild(script);
    return () => {
      script.remove();
    };
  }, []);
`
      : "";

  const imports =
    escapedJs.trim().length > 0
      ? `import React, { useEffect, useRef } from 'react';`
      : `import React from 'react';`;

  const refDecl = escapedJs.trim().length > 0 ? `\n  const containerRef = useRef<HTMLDivElement>(null);` : "";

  const refProp = escapedJs.trim().length > 0 ? ` ref={containerRef}` : "";

  return `${imports}

const styles = \`
${escapedCss}
\`;

export default function ${componentName}() {${refDecl}
${useEffectBlock}
  return (
    <>
      <style>{styles}</style>
      <div${refProp} dangerouslySetInnerHTML={{ __html: \`${escapedHtml}\` }} />
    </>
  );
}
`;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Rate limit: 10 conversions / minute per IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
  const rl = checkRateLimit(`convert-react:${ip}`, { limit: 10, windowMs: 60_000 });
  if (!rl.success) {
    return NextResponse.json({ error: "Too many requests. Please wait a moment." }, { status: 429 });
  }

  // Body size guard (2MB)
  const contentLength = parseInt(req.headers.get("content-length") ?? "0");
  if (contentLength > 2_000_000) {
    return NextResponse.json({ error: "Request too large (max 2MB)" }, { status: 413 });
  }

  const parsed = ConvertSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const { files, projectName } = parsed.data;
  const componentName = toComponentName(projectName);

  // ── Extract CSS ───────────────────────────────────────────────────────────
  let css = files["style.css"]?.content ?? "";
  // Also pull <style> blocks from index.html
  const htmlRaw = files["index.html"]?.content ?? "";
  const inlineCss = extractStyleTags(htmlRaw);
  if (inlineCss) css = [css, inlineCss].filter(Boolean).join("\n\n");

  // ── Extract JS ────────────────────────────────────────────────────────────
  let js = files["script.js"]?.content ?? "";
  const inlineJs = extractScriptTags(htmlRaw);
  if (inlineJs) js = [js, inlineJs].filter(Boolean).join("\n\n");

  // ── Extract body HTML ─────────────────────────────────────────────────────
  const bodyRaw = extractBodyHtml(htmlRaw);
  const htmlBody = stripStyleAndScript(bodyRaw);

  // ── Build ZIP ─────────────────────────────────────────────────────────────
  const zip = new JSZip();

  zip.file("package.json", makePackageJson(projectName));
  zip.file("vite.config.ts", viteConfig);
  zip.file("index.html", indexHtml);
  zip.file("tsconfig.json", tsConfig);
  zip.file("README.md", makeReadme(projectName, componentName));
  zip.file(`src/main.tsx`, makeMainTsx(componentName));
  zip.file(`src/${componentName}.tsx`, makeAppTsx(componentName, css, js, htmlBody));

  const zipBuffer = await zip.generateAsync({ type: "arraybuffer", compression: "DEFLATE" });

  return new NextResponse(zipBuffer as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${componentName}.zip"`,
      "Content-Length": String(zipBuffer.byteLength),
    },
  });
}
