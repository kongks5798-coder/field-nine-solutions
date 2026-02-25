// ── Model Registry ──────────────────────────────────────────────────────────
// Extended model metadata registry with context windows, output limits, vision
// support, strength tags, and per-call cost estimates.
// NOTE: workspace.constants.ts AI_MODELS is intentionally preserved for backward
// compatibility. New code should import from this module instead.

export interface ModelMeta {
  id: string;
  provider: "openai" | "anthropic" | "gemini" | "grok";
  label: string;
  speed: "fast" | "medium" | "slow";
  cost: "$" | "$$" | "$$$";
  contextWindow: number;    // token count
  maxOutput: number;        // max output tokens
  supportsVision: boolean;
  supportsStreaming: boolean;
  strengthTags: string[];   // ["code", "reasoning", "creative", "realtime"]
  costPerCallKrw: number;   // estimated KRW per call
}

export const MODEL_REGISTRY: ModelMeta[] = [
  {
    id: "gpt-4o-mini",
    provider: "openai",
    label: "GPT-4o Mini",
    speed: "fast",
    cost: "$",
    contextWindow: 128_000,
    maxOutput: 16_384,
    supportsVision: true,
    supportsStreaming: true,
    strengthTags: ["code", "fast"],
    costPerCallKrw: 50,
  },
  {
    id: "gpt-4o",
    provider: "openai",
    label: "GPT-4o",
    speed: "medium",
    cost: "$$$",
    contextWindow: 128_000,
    maxOutput: 16_384,
    supportsVision: true,
    supportsStreaming: true,
    strengthTags: ["code", "reasoning", "creative"],
    costPerCallKrw: 200,
  },
  {
    id: "claude-sonnet-4-6",
    provider: "anthropic",
    label: "Claude Sonnet 4.6",
    speed: "medium",
    cost: "$$",
    contextWindow: 200_000,
    maxOutput: 64_000,
    supportsVision: true,
    supportsStreaming: true,
    strengthTags: ["code", "reasoning"],
    costPerCallKrw: 120,
  },
  {
    id: "claude-sonnet-4-5-20250514",
    provider: "anthropic",
    label: "Claude Sonnet 4.5",
    speed: "medium",
    cost: "$$",
    contextWindow: 200_000,
    maxOutput: 8_192,
    supportsVision: true,
    supportsStreaming: true,
    strengthTags: ["code", "reasoning"],
    costPerCallKrw: 120,
  },
  {
    id: "gemini-2.0-flash",
    provider: "gemini",
    label: "Gemini 2.0 Flash",
    speed: "fast",
    cost: "$",
    contextWindow: 1_000_000,
    maxOutput: 8_192,
    supportsVision: true,
    supportsStreaming: true,
    strengthTags: ["fast", "creative"],
    costPerCallKrw: 20,
  },
  {
    id: "gemini-1.5-flash",
    provider: "gemini",
    label: "Gemini 1.5 Flash",
    speed: "fast",
    cost: "$",
    contextWindow: 1_000_000,
    maxOutput: 8_192,
    supportsVision: true,
    supportsStreaming: true,
    strengthTags: ["fast"],
    costPerCallKrw: 20,
  },
  {
    id: "claude-opus-4-6",
    provider: "anthropic",
    label: "Claude Opus 4.6",
    speed: "slow",
    cost: "$$$",
    contextWindow: 200_000,
    maxOutput: 32_000,
    supportsVision: true,
    supportsStreaming: true,
    strengthTags: ["code", "reasoning", "creative"],
    costPerCallKrw: 400,
  },
  {
    id: "grok-3",
    provider: "grok",
    label: "Grok 3",
    speed: "medium",
    cost: "$$",
    contextWindow: 131_072,
    maxOutput: 8_192,
    supportsVision: true,
    supportsStreaming: true,
    strengthTags: ["realtime", "code"],
    costPerCallKrw: 50,
  },
  {
    id: "gpt-3.5-turbo",
    provider: "openai",
    label: "GPT-3.5 Turbo",
    speed: "fast",
    cost: "$",
    contextWindow: 16_385,
    maxOutput: 4_096,
    supportsVision: false,
    supportsStreaming: true,
    strengthTags: ["fast"],
    costPerCallKrw: 10,
  },
];

// ── Lookup helpers ──────────────────────────────────────────────────────────

/** Find model metadata by id. Returns undefined if the model is not in the registry. */
export function getModelMeta(modelId: string): ModelMeta | undefined {
  return MODEL_REGISTRY.find((m) => m.id === modelId);
}

/** Return all models for a given provider. */
export function getProviderModels(provider: string): ModelMeta[] {
  return MODEL_REGISTRY.filter((m) => m.provider === provider);
}

/**
 * Return the best model for a given task type.
 * Selection priority: models whose strengthTags include the task, then sorted
 * by cost (cheapest first for "fast", most capable first for others).
 */
export function getBestModelForTask(
  task: "code" | "reasoning" | "creative" | "fast",
): ModelMeta {
  const candidates = MODEL_REGISTRY.filter((m) =>
    m.strengthTags.includes(task),
  );

  if (candidates.length === 0) {
    // fallback: return the first model in the registry
    return MODEL_REGISTRY[0];
  }

  // For "fast" tasks, prefer cheapest; for others prefer most capable (highest cost)
  if (task === "fast") {
    return candidates.sort((a, b) => a.costPerCallKrw - b.costPerCallKrw)[0];
  }

  return candidates.sort((a, b) => b.costPerCallKrw - a.costPerCallKrw)[0];
}
