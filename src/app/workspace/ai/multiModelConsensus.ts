// ── #2 Multi-Model Consensus ─────────────────────────────────────────────────
// Run generation through multiple AI models and merge the best results.
// Uses a reviewer model to compare outputs and synthesize the optimal version.

export interface ConsensusModel {
  id: string;
  provider: string;
  label: string;
}

export interface ConsensusConfig {
  /** Models to generate with (run in parallel) */
  generators: ConsensusModel[];
  /** Model used to review and merge outputs */
  reviewer: ConsensusModel;
}

export interface ConsensusOutput {
  modelId: string;
  modelLabel: string;
  html: string;
  css: string;
  js: string;
}

/**
 * Default consensus config: use 2 fast generators + 1 smart reviewer.
 * The generators produce candidate outputs; the reviewer merges the best parts.
 */
export function getDefaultConsensusConfig(availableModels: { id: string; provider: string; label: string }[]): ConsensusConfig | null {
  // Need at least 2 models for consensus
  if (availableModels.length < 2) return null;

  // Prefer diverse providers for better consensus
  const providerMap = new Map<string, typeof availableModels>();
  for (const m of availableModels) {
    if (!providerMap.has(m.provider)) providerMap.set(m.provider, []);
    providerMap.get(m.provider)!.push(m);
  }

  const generators: ConsensusModel[] = [];

  // Pick one model from each provider (up to 2)
  for (const [, models] of providerMap) {
    if (generators.length >= 2) break;
    generators.push(models[0]);
  }

  // If only one provider, pick 2 different models
  if (generators.length < 2 && availableModels.length >= 2) {
    for (const m of availableModels) {
      if (!generators.find(g => g.id === m.id)) {
        generators.push(m);
        if (generators.length >= 2) break;
      }
    }
  }

  if (generators.length < 2) return null;

  // Reviewer: prefer Claude or GPT-4o for best judgment
  const reviewerCandidates = availableModels.filter(m =>
    m.id.includes("claude") || m.id.includes("gpt-4o")
  );
  const reviewer = reviewerCandidates[0] ?? availableModels[0];

  return { generators, reviewer };
}

/**
 * Build the merge/review prompt.
 * The reviewer compares outputs from multiple models and synthesizes the best version.
 */
export function buildMergePrompt(
  outputs: ConsensusOutput[],
  originalPrompt: string,
): string {
  const outputBlocks = outputs.map((o, i) => {
    const parts: string[] = [];
    if (o.html) parts.push(`[FILE:index.html]\n${o.html.slice(0, 8000)}\n[/FILE]`);
    if (o.css) parts.push(`[FILE:style.css]\n${o.css.slice(0, 5000)}\n[/FILE]`);
    if (o.js) parts.push(`[FILE:script.js]\n${o.js.slice(0, 8000)}\n[/FILE]`);
    return `### 후보 ${i + 1} (${o.modelLabel}):\n${parts.join("\n\n")}`;
  }).join("\n\n---\n\n");

  return `너는 시니어 코드 리뷰어야. 여러 AI 모델이 같은 요청으로 생성한 코드를 비교 분석하고, 각 후보의 장점만 모아 최종 버전을 만들어줘.

## 원본 요청:
${originalPrompt}

## AI 후보 출력물:
${outputBlocks}

## 작업 지침:
1. 각 후보의 **강점**을 분석해 (디자인, 기능, 반응형, 코드 품질)
2. 최고의 요소들만 합쳐서 **최종 통합 버전** 생성
3. 어떤 후보에서도 부족한 부분은 직접 보강
4. 모든 버튼/인터랙션이 실제로 동작해야 함
5. 반응형 필수 (@media 쿼리)
6. DOMContentLoaded 래핑, null 체크 필수

## 출력:
최종 통합 코드를 [FILE:파일명]...[/FILE] 형식으로 출력해.
- [FILE:index.html]...[/FILE]
- [FILE:style.css]...[/FILE]
- [FILE:script.js]...[/FILE]`;
}

/**
 * Extract file contents from a parsed AI response for consensus comparison.
 */
export function extractConsensusFiles(
  fullFiles: Record<string, string>,
  modelId: string,
  modelLabel: string,
): ConsensusOutput {
  return {
    modelId,
    modelLabel,
    html: fullFiles["index.html"] ?? "",
    css: fullFiles["style.css"] ?? "",
    js: fullFiles["script.js"] ?? "",
  };
}

/**
 * Get a progress label for the consensus process.
 */
export function getConsensusLabel(
  phase: "generating" | "reviewing" | "merging",
  modelLabel?: string,
  index?: number,
  total?: number,
): string {
  switch (phase) {
    case "generating":
      return `🤖 멀티모델 생성 중... (${index ?? 0 + 1}/${total ?? 2}: ${modelLabel ?? "AI"})`;
    case "reviewing":
      return "🔍 후보 비교 분석 중...";
    case "merging":
      return "✨ 최적 코드 통합 중...";
  }
}
