// ── Context Window Manager ───────────────────────────────────────────────────
// Intelligent budget-aware context trimming for multi-turn conversations.
// All functions are pure (no side-effects).

/** Token budget breakdown for a single request */
export interface ContextBudget {
  maxTokens: number;           // model's total context window
  systemPromptTokens: number;  // tokens consumed by the system prompt
  reservedOutputTokens: number; // reserved for the model's response
  availableForHistory: number; // maxTokens - system - reserved
}

/** A single chat message (role + content) */
export interface ChatMessage {
  role: string;
  content: string;
}

// ── Token estimation ─────────────────────────────────────────────────────────

/**
 * Estimate token count for a string.
 *
 * Uses the common heuristic: ~4 characters per token for English,
 * ~2 characters per token for CJK (Korean/Chinese/Japanese).
 * We blend based on the actual ratio of CJK characters.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  const cjkPattern = /[\u3000-\u9fff\uac00-\ud7af\uff00-\uffef]/g;
  const cjkCount = (text.match(cjkPattern) ?? []).length;
  const totalChars = text.length;
  if (totalChars === 0) return 0;

  const cjkRatio = cjkCount / totalChars;
  // CJK-heavy text: ~2 chars/token. Latin text: ~4 chars/token.
  const charsPerToken = 4 - 2 * cjkRatio; // ranges from 2 (all CJK) to 4 (all Latin)
  return Math.ceil(totalChars / charsPerToken);
}

// ── Budget factory ───────────────────────────────────────────────────────────

/**
 * Build a ContextBudget from model parameters.
 * Automatically computes `availableForHistory`.
 */
export function createBudget(
  maxTokens: number,
  systemPromptTokens: number,
  reservedOutputTokens: number,
): ContextBudget {
  return {
    maxTokens,
    systemPromptTokens,
    reservedOutputTokens,
    availableForHistory: Math.max(
      0,
      maxTokens - systemPromptTokens - reservedOutputTokens,
    ),
  };
}

// ── History trimming ─────────────────────────────────────────────────────────

/**
 * Trim message history to fit within the token budget.
 *
 * Strategy:
 * 1. System messages are always preserved (at the front).
 * 2. Starting from the most recent message, accumulate tokens backwards.
 * 3. Drop older messages once the budget is exceeded.
 * 4. Always guarantee at least the last 2 non-system messages
 *    (final user + assistant exchange) even if they exceed the budget.
 */
export function trimHistory(
  messages: ChatMessage[],
  budget: ContextBudget,
): ChatMessage[] {
  if (messages.length === 0) return [];

  // Separate system messages from conversation messages
  const systemMsgs = messages.filter((m) => m.role === "system");
  const convMsgs = messages.filter((m) => m.role !== "system");

  if (convMsgs.length === 0) return systemMsgs;

  // Budget available for conversation (after system messages)
  const systemTokens = systemMsgs.reduce(
    (sum, m) => sum + estimateTokens(m.content),
    0,
  );
  const available = Math.max(0, budget.availableForHistory - systemTokens);

  // Walk backwards, accumulating tokens
  let accumulated = 0;
  let cutIndex = convMsgs.length; // how many messages to keep (from the end)

  for (let i = convMsgs.length - 1; i >= 0; i--) {
    const tokens = estimateTokens(convMsgs[i].content);
    if (accumulated + tokens > available) {
      cutIndex = convMsgs.length - i - 1;
      break;
    }
    accumulated += tokens;
    cutIndex = convMsgs.length - i;
  }

  // Guarantee at least the last 2 conversation messages
  const minKeep = Math.min(2, convMsgs.length);
  const keepCount = Math.max(cutIndex, minKeep);
  const kept = convMsgs.slice(convMsgs.length - keepCount);

  return [...systemMsgs, ...kept];
}

// ── Smart file compression ───────────────────────────────────────────────────

/**
 * Compress a file intelligently based on its type.
 * Returns a summary that preserves structure/signatures without full content.
 * This lets the AI understand ALL files without blowing the token budget.
 */
export function smartCompressFile(content: string, fname: string, budgetChars: number): string {
  if (!content || content.length <= budgetChars) return content;
  const ext = fname.split(".").pop()?.toLowerCase() ?? "";

  if (ext === "js" || ext === "ts") {
    const lines = content.split("\n");
    // Extract function/class/const signatures and top-level declarations
    const sigs: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      const t = lines[i].trimStart();
      if (/^(function\s+\w+|const\s+\w+\s*=\s*(function|\(|async)|let\s+\w+\s*=|class\s+\w+|async\s+function|\/\/\s*[A-Z─]|\*\s+@|export\s+(function|const|class|default))/.test(t)) {
        sigs.push(`L${i + 1}: ${lines[i].slice(0, 120)}`);
      }
    }
    const head = lines.slice(0, 25).join("\n");
    const tail = lines.slice(-15).join("\n");
    const sigBlock = sigs.length > 0 ? `\n// === 함수/변수 목록 (${sigs.length}개) ===\n${sigs.slice(0, 60).join("\n")}` : "";
    const result = `${head}${sigBlock}\n// ...(${lines.length}줄 총)\n${tail}`;
    return result.length <= budgetChars ? result : result.slice(0, budgetChars) + "\n// ...(압축됨)";
  }

  if (ext === "html") {
    // Keep tag structure: strip long text content, keep id/class/src attributes
    const stripped = content
      .replace(/<!--[\s\S]*?-->/g, "")               // remove comments
      .replace(/>([^<]{40,})</g, ">[...]<")           // shorten long text nodes
      .replace(/\s{2,}/g, " ");                        // collapse whitespace
    return stripped.length <= budgetChars ? stripped : stripped.slice(0, budgetChars) + "\n<!-- ...(압축됨) -->";
  }

  if (ext === "css") {
    // Keep selectors + first property only
    const compressed = content
      .replace(/\/\*[\s\S]*?\*\//g, "")               // remove comments
      .replace(/\{([^}]+)\}/g, (_, body) => {
        const firstProp = body.trim().split(";")[0]?.trim() ?? "";
        return `{ ${firstProp}; /* ... */ }`;
      });
    return compressed.length <= budgetChars ? compressed : compressed.slice(0, budgetChars) + "\n/* ...(압축됨) */";
  }

  return content.slice(0, budgetChars) + "\n// ...(압축됨)";
}

// ── File context builder ─────────────────────────────────────────────────────

/**
 * Build a file-context string that fits within `maxTokens`.
 *
 * Priority:
 * 1. The active file — full content (truncated only if exceeds entire budget).
 * 2. Other files — smart-compressed summaries (JS: signatures, HTML: structure, CSS: selectors).
 * 3. Remaining files — names only.
 */
export function buildFileContext(
  files: Record<string, { content: string }>,
  activeFile: string,
  maxTokens: number,
): string {
  if (maxTokens <= 0) return "";

  const parts: string[] = [];
  let usedTokens = 0;

  // 1. Active file — full content (priority)
  const active = files[activeFile];
  if (active) {
    const header = `[FILE:${activeFile}]\n`;
    const footer = `\n[/FILE]`;
    const block = header + active.content + footer;
    const tokens = estimateTokens(block);
    if (tokens <= maxTokens) {
      parts.push(block);
      usedTokens += tokens;
    } else {
      const availChars = (maxTokens - estimateTokens(header + footer)) * 3;
      parts.push(header + active.content.slice(0, Math.max(0, availChars)) + "\n// ...(truncated)" + footer);
      usedTokens = maxTokens;
    }
  }

  // 2. Other files — smart-compressed (not just 5 lines)
  const otherFiles = Object.keys(files).filter((f) => f !== activeFile);
  const previewed: string[] = [];
  const nameOnly: string[] = [];

  for (const fname of otherFiles) {
    if (usedTokens >= maxTokens) { nameOnly.push(fname); continue; }
    const content = files[fname].content;
    // Reserve up to 30% of remaining budget per non-active file
    const perFileBudgetChars = Math.floor(((maxTokens - usedTokens) * 0.35) * 3.5);
    const compressed = smartCompressFile(content, fname, perFileBudgetChars);
    const block = `[FILE:${fname}] (요약)\n${compressed}\n[/FILE]`;
    const tokens = estimateTokens(block);
    if (usedTokens + tokens <= maxTokens) {
      previewed.push(block);
      usedTokens += tokens;
    } else {
      nameOnly.push(fname);
    }
  }

  if (previewed.length > 0) {
    parts.push("\n--- Other project files (smart-compressed) ---");
    parts.push(...previewed);
  }

  if (nameOnly.length > 0) {
    const listing = `\nOther files (name only): ${nameOnly.join(", ")}`;
    if (usedTokens + estimateTokens(listing) <= maxTokens) parts.push(listing);
  }

  return parts.join("\n");
}
