// Simple line-diff utility for visual highlighting

export interface DiffLine {
  type: "added" | "removed" | "unchanged";
  content: string;
  lineNo: number;
}

/**
 * Compute line-level diff between two strings.
 * Returns only the first 50 changed lines to avoid performance issues.
 */
export function computeLineDiff(oldContent: string, newContent: string): DiffLine[] {
  const oldLines = oldContent.split("\n");
  const newLines = newContent.split("\n");
  const result: DiffLine[] = [];
  const maxLines = Math.max(oldLines.length, newLines.length);

  for (let i = 0; i < Math.min(maxLines, 200); i++) {
    const oldLine = oldLines[i] ?? "";
    const newLine = newLines[i] ?? "";
    if (oldLine !== newLine) {
      if (newLine) result.push({ type: "added", content: newLine, lineNo: i + 1 });
      if (oldLine) result.push({ type: "removed", content: oldLine, lineNo: i + 1 });
    }
  }
  return result.slice(0, 50);
}

/**
 * Get count of changed lines between two strings.
 */
export function getChangedLineCount(oldContent: string, newContent: string): number {
  const oldLines = oldContent.split("\n");
  const newLines = newContent.split("\n");
  let changed = 0;
  const maxLines = Math.max(oldLines.length, newLines.length);
  for (let i = 0; i < maxLines; i++) {
    if ((oldLines[i] ?? "") !== (newLines[i] ?? "")) changed++;
  }
  return changed;
}
