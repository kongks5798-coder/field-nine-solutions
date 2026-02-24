// ── Diff-based AI Code Patching Types ────────────────────────────────────────

/** A single search/replace pair inside an [EDIT:] block */
export interface SearchReplaceBlock {
  search: string;
  replace: string;
}

/** Parsed [EDIT:filename] block containing one or more search/replace pairs */
export interface DiffBlock {
  filename: string;
  searchBlocks: SearchReplaceBlock[];
}

/** Full parse result of an AI response that may mix [FILE:], [EDIT:], and plain text */
export interface ParsedAiResponse {
  /** "full-file" = only [FILE:] blocks, "diff" = only [EDIT:] blocks,
   *  "mixed" = both, "text-only" = no code blocks at all */
  type: "full-file" | "diff" | "mixed" | "text-only";
  /** [FILE:filename] complete-content [/FILE] blocks */
  fullFiles: Record<string, string>;
  /** [EDIT:filename] search/replace [/EDIT] blocks */
  diffs: DiffBlock[];
  /** Any text outside of FILE/EDIT blocks */
  text: string;
}

/** Result of applying diff patches to a file */
export interface ApplyResult {
  success: boolean;
  content: string;
  appliedCount: number;
  failedCount: number;
  failedSearches: string[];
}
