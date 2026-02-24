// ── Diff Decorations ────────────────────────────────────────────────────────
// Monaco editor decorations for visualizing added/modified lines after diff application.

export interface DiffDecoration {
  range: { startLine: number; endLine: number };
  type: "added" | "modified";
}

/**
 * Compare original and modified content line-by-line to produce decoration ranges.
 * - Lines present in modified but not in original are "added"
 * - Lines present in both but with different content are "modified"
 */
export function computeDecorations(
  original: string,
  modified: string
): DiffDecoration[] {
  const origLines = original.split("\n");
  const modLines = modified.split("\n");
  const decorations: DiffDecoration[] = [];

  // Use a simple LCS-inspired diff to find added/modified regions
  const maxLen = Math.max(origLines.length, modLines.length);
  let i = 0;
  let j = 0;

  while (j < modLines.length) {
    if (i < origLines.length && origLines[i] === modLines[j]) {
      // Lines match — no decoration needed
      i++;
      j++;
    } else if (i < origLines.length) {
      // Check if this is a modification (original line replaced) vs insertion
      // Look ahead to see if original line appears later in modified
      const lookAhead = modLines.indexOf(origLines[i], j);
      if (lookAhead === -1 || lookAhead - j > 10) {
        // Original line was replaced — mark modified line as "modified"
        const startLine = j + 1; // Monaco is 1-indexed
        // Consume modified lines until we find the next matching original line
        let endJ = j;
        while (endJ < modLines.length && i < origLines.length) {
          if (origLines[i] === modLines[endJ]) break;
          endJ++;
        }
        if (endJ === j) endJ = j + 1;
        decorations.push({
          range: { startLine, endLine: endJ },
          type: "modified",
        });
        // Advance both pointers past the modified region
        i++;
        j = endJ;
      } else {
        // Lines were inserted before the next matching original line
        decorations.push({
          range: { startLine: j + 1, endLine: lookAhead },
          type: "added",
        });
        j = lookAhead;
      }
    } else {
      // All original lines consumed — remaining modified lines are "added"
      decorations.push({
        range: { startLine: j + 1, endLine: modLines.length },
        type: "added",
      });
      break;
    }
  }

  // Merge adjacent decorations of the same type
  const merged: DiffDecoration[] = [];
  for (const dec of decorations) {
    const prev = merged[merged.length - 1];
    if (
      prev &&
      prev.type === dec.type &&
      prev.range.endLine >= dec.range.startLine - 1
    ) {
      prev.range.endLine = Math.max(prev.range.endLine, dec.range.endLine);
    } else {
      merged.push({ ...dec, range: { ...dec.range } });
    }
  }

  return merged;
}

/**
 * Apply Monaco editor decorations to highlight added/modified lines.
 *
 * @param editor - Monaco editor instance (monaco.editor.IStandaloneCodeEditor)
 * @param decorations - Decoration ranges from computeDecorations()
 * @returns Array of decoration IDs for later cleanup via editor.deltaDecorations()
 */
export function applyMonacoDecorations(
  editor: { deltaDecorations: (oldDecorations: string[], newDecorations: unknown[]) => string[] },
  decorations: DiffDecoration[]
): string[] {
  const monacoDecorations = decorations.map((dec) => ({
    range: {
      startLineNumber: dec.range.startLine,
      startColumn: 1,
      endLineNumber: dec.range.endLine,
      endColumn: 1,
    },
    options: {
      isWholeLine: true,
      className:
        dec.type === "added" ? "diff-added-line" : "diff-modified-line",
      glyphMarginClassName:
        dec.type === "added"
          ? "diff-added-glyph"
          : "diff-modified-glyph",
      overviewRuler: {
        color:
          dec.type === "added"
            ? "rgba(34, 197, 94, 0.6)"
            : "rgba(251, 146, 60, 0.6)",
        position: 1, // OverviewRulerLane.Left
      },
    },
  }));

  return editor.deltaDecorations([], monacoDecorations);
}

/**
 * CSS styles to inject for diff decorations.
 * Call this once or inject via <style> tag.
 */
export const DIFF_DECORATION_CSS = `
.diff-added-line {
  background: rgba(34, 197, 94, 0.12) !important;
  border-left: 3px solid rgba(34, 197, 94, 0.7) !important;
}
.diff-modified-line {
  background: rgba(251, 146, 60, 0.12) !important;
  border-left: 3px solid rgba(251, 146, 60, 0.7) !important;
}
.diff-added-glyph {
  background: rgba(34, 197, 94, 0.5);
  width: 4px !important;
  margin-left: 3px;
}
.diff-modified-glyph {
  background: rgba(251, 146, 60, 0.5);
  width: 4px !important;
  margin-left: 3px;
}
`;
