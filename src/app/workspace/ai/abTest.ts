// ── A/B Test Engine Types ──────────────────────────────────────────────────────

export interface AbVersion {
  id: 'A' | 'B';
  files: Record<string, string>; // filename → content
  status: 'generating' | 'done' | 'error';
  modelLabel: string;
}

export interface AbTestResult {
  prompt: string;
  versions: [AbVersion, AbVersion];
  winner: 'A' | 'B' | null;
}
