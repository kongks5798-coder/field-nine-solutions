// ── Diff Applicator ─────────────────────────────────────────────────────────
// Applies search/replace diff patches to original file content with fallback matching.

import type { ApplyResult, SearchReplaceBlock } from "./diffTypes";

/**
 * Simple character-level similarity using Levenshtein distance.
 * Returns a value between 0 (completely different) and 1 (identical).
 */
export function similarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  // For very long strings, use a cheaper heuristic to avoid O(n*m) blowup
  if (a.length > 2000 || b.length > 2000) {
    const aLines = a.split("\n");
    const bLines = b.split("\n");
    if (aLines.length === 0 || bLines.length === 0) return 0;
    let matches = 0;
    const maxLen = Math.max(aLines.length, bLines.length);
    const minLen = Math.min(aLines.length, bLines.length);
    for (let i = 0; i < minLen; i++) {
      if (aLines[i].trim() === bLines[i].trim()) matches++;
    }
    return matches / maxLen;
  }

  // Standard Levenshtein for manageable sizes
  const lenA = a.length;
  const lenB = b.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= lenA; i++) matrix[i] = [i];
  for (let j = 0; j <= lenB; j++) matrix[0][j] = j;

  for (let i = 1; i <= lenA; i++) {
    for (let j = 1; j <= lenB; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  const maxLen = Math.max(lenA, lenB);
  return 1 - matrix[lenA][lenB] / maxLen;
}

/**
 * Normalize whitespace: trim each line, collapse multiple spaces into one,
 * remove blank lines at start/end.
 */
function normalizeWhitespace(s: string): string {
  return s
    .split("\n")
    .map(line => line.trim().replace(/\s+/g, " "))
    .join("\n")
    .trim();
}

/**
 * Try to find the best matching region in `content` for the given `search` text
 * using line-by-line fuzzy matching.
 * Returns { start, end } character indices if a match above threshold is found,
 * or null otherwise.
 */
function fuzzyFind(
  content: string,
  search: string,
  threshold = 0.8
): { start: number; end: number } | null {
  const contentLines = content.split("\n");
  const searchLines = search.split("\n");
  const searchLen = searchLines.length;

  if (searchLen === 0 || contentLines.length === 0) return null;
  if (searchLen > contentLines.length) return null;

  let bestScore = 0;
  let bestIdx = -1;

  for (let i = 0; i <= contentLines.length - searchLen; i++) {
    let totalSim = 0;
    for (let j = 0; j < searchLen; j++) {
      totalSim += similarity(
        contentLines[i + j].trim(),
        searchLines[j].trim()
      );
    }
    const avgSim = totalSim / searchLen;
    if (avgSim > bestScore) {
      bestScore = avgSim;
      bestIdx = i;
    }
  }

  if (bestScore < threshold || bestIdx < 0) return null;

  // Calculate character offsets
  let start = 0;
  for (let i = 0; i < bestIdx; i++) {
    start += contentLines[i].length + 1; // +1 for newline
  }
  let end = start;
  for (let i = 0; i < searchLen; i++) {
    end += contentLines[bestIdx + i].length + (i < searchLen - 1 ? 1 : 0);
  }

  return { start, end };
}

/**
 * Apply a series of search/replace patches to original content.
 *
 * Algorithm:
 * 1. For each search/replace pair:
 *    a. Try exact indexOf match
 *    b. If fail: normalize whitespace and retry
 *    c. If fail: try line-by-line fuzzy match (similarity > 0.8)
 *    d. If all fail: record in failedSearches
 * 2. Apply all successful replacements in order
 * 3. Return result with success/failure counts
 */
export function applyDiffPatch(
  originalContent: string,
  searchBlocks: SearchReplaceBlock[]
): ApplyResult {
  let content = originalContent;
  let appliedCount = 0;
  let failedCount = 0;
  const failedSearches: string[] = [];

  for (const block of searchBlocks) {
    const { search, replace } = block;

    // Strategy 1: Exact match
    const exactIdx = content.indexOf(search);
    if (exactIdx !== -1) {
      content = content.slice(0, exactIdx) + replace + content.slice(exactIdx + search.length);
      appliedCount++;
      continue;
    }

    // Strategy 2: Normalized whitespace match
    const normContent = normalizeWhitespace(content);
    const normSearch = normalizeWhitespace(search);
    const normIdx = normContent.indexOf(normSearch);
    if (normIdx !== -1) {
      // Find corresponding position in original content
      // Map normalized index back to original by scanning lines
      const contentLines = content.split("\n");
      const searchLines = search.split("\n").map(l => l.trim().replace(/\s+/g, " "));
      const searchLineCount = searchLines.length;

      let found = false;
      for (let i = 0; i <= contentLines.length - searchLineCount; i++) {
        let allMatch = true;
        for (let j = 0; j < searchLineCount; j++) {
          const normLine = contentLines[i + j].trim().replace(/\s+/g, " ");
          if (normLine !== searchLines[j]) {
            allMatch = false;
            break;
          }
        }
        if (allMatch) {
          // Replace the matched lines with the replacement
          const before = contentLines.slice(0, i);
          const after = contentLines.slice(i + searchLineCount);
          content = [...before, replace, ...after].join("\n");
          appliedCount++;
          found = true;
          break;
        }
      }
      if (found) continue;
    }

    // Strategy 3: Fuzzy line-by-line match
    const fuzzyResult = fuzzyFind(content, search);
    if (fuzzyResult) {
      content =
        content.slice(0, fuzzyResult.start) +
        replace +
        content.slice(fuzzyResult.end);
      appliedCount++;
      continue;
    }

    // All strategies failed
    failedCount++;
    failedSearches.push(
      search.length > 80 ? search.slice(0, 80) + "..." : search
    );
  }

  return {
    success: failedCount === 0,
    content,
    appliedCount,
    failedCount,
    failedSearches,
  };
}
