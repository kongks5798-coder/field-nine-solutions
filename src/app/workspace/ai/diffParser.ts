// ── Diff Parser ─────────────────────────────────────────────────────────────
// Parses AI responses containing [FILE:], [EDIT:], or mixed blocks.

import type { DiffBlock, ParsedAiResponse, SearchReplaceBlock } from "./diffTypes";

/**
 * Parse <<<<<<< SEARCH ... ======= ... >>>>>>> REPLACE pairs
 * inside an [EDIT:] block body.
 */
function parseSearchReplaceBlocks(body: string): SearchReplaceBlock[] {
  const blocks: SearchReplaceBlock[] = [];
  const re = /<<<<<<< SEARCH\n([\s\S]*?)\n=======\n([\s\S]*?)\n>>>>>>> REPLACE/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    blocks.push({
      search: m[1],
      replace: m[2],
    });
  }
  return blocks;
}

/**
 * Parse a complete AI response that may contain any mix of:
 * - [FILE:filename] ... [/FILE]   (full file replacement)
 * - [EDIT:filename] ... [/EDIT]   (search/replace diff patches)
 * - Plain text outside code blocks
 */
export function parseAiResponse(text: string): ParsedAiResponse {
  const fullFiles: Record<string, string> = {};
  const diffs: DiffBlock[] = [];

  // ── Parse [FILE:] blocks ──────────────────────────────────────────────────
  // 유효한 웹 파일 확장자만 허용 (index, server.js, filename.ext 같은 잡다한 파일 제외)
  const VALID_WEB_FILE = /^[\w.-]+\.(html|css|js|jsx|ts|tsx|json|svg|md|txt|xml|yaml|yml|toml|env|cfg|ini|sh|py|rb|php|go|rs|java|c|cpp|h)$/i;
  const fileRe = /\[FILE:([^\]]+)\]([\s\S]*?)\[\/FILE\]/g;
  let m: RegExpExecArray | null;
  while ((m = fileRe.exec(text)) !== null) {
    const fname = m[1].trim();
    if (VALID_WEB_FILE.test(fname)) {
      // AI가 마크다운 코드펜스로 감싸는 경우 제거 (```html ... ```)
      let content = m[2].trim();
      content = content.replace(/^```[\w]*\n?/, "").replace(/\n?```$/, "");
      fullFiles[fname] = content.trim();
    }
  }

  // ── Recover truncated [FILE:] blocks (no closing tag) ───────────────────
  const unclosedFileRe = /\[FILE:([^\]]+)\]([\s\S]+)$/;
  const hasClosedFiles = /\[\/FILE\]/g.test(text);
  const unclosedMatch = unclosedFileRe.exec(
    text.replace(/\[FILE:[^\]]+\][\s\S]*?\[\/FILE\]/g, ""),
  );
  if (unclosedMatch) {
    const fname = unclosedMatch[1].trim();
    const content = unclosedMatch[2].trim();
    // Only recover if we got meaningful content (> 20 chars) AND valid filename
    if (content.length > 20 && !fullFiles[fname] && VALID_WEB_FILE.test(fname)) {
      fullFiles[fname] = content;
    }
  }

  // ── Parse [EDIT:] blocks ──────────────────────────────────────────────────
  const editRe = /\[EDIT:([^\]]+)\]([\s\S]*?)\[\/EDIT\]/g;
  while ((m = editRe.exec(text)) !== null) {
    const filename = m[1].trim();
    const body = m[2];
    const searchBlocks = parseSearchReplaceBlocks(body);
    if (searchBlocks.length > 0) {
      diffs.push({ filename, searchBlocks });
    }
  }

  // ── Extract plain text (everything outside FILE/EDIT blocks) ──────────────
  let plainText = text;
  plainText = plainText.replace(/\[FILE:[^\]]+\][\s\S]*?\[\/FILE\]/g, "");
  plainText = plainText.replace(/\[EDIT:[^\]]+\][\s\S]*?\[\/EDIT\]/g, "");
  plainText = plainText.trim();

  // ── Determine response type ───────────────────────────────────────────────
  const hasFiles = Object.keys(fullFiles).length > 0;
  const hasDiffs = diffs.length > 0;

  let type: ParsedAiResponse["type"];
  if (hasFiles && hasDiffs) {
    type = "mixed";
  } else if (hasDiffs) {
    type = "diff";
  } else if (hasFiles) {
    type = "full-file";
  } else {
    type = "text-only";
  }

  return { type, fullFiles, diffs, text: plainText };
}
