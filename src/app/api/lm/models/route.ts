import { NextRequest, NextResponse } from "next/server";

export async function GET(_req: NextRequest) {
  const ollamaUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";

  const external = [
    { id: "gpt-4o",            name: "GPT-4o",            provider: "openai",    available: !!process.env.OPENAI_API_KEY,    contextLen: 128000,  speed: "fast",   cost: "$$"  },
    { id: "gpt-4o-mini",       name: "GPT-4o mini",       provider: "openai",    available: !!process.env.OPENAI_API_KEY,    contextLen: 128000,  speed: "fast",   cost: "$"   },
    { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", provider: "anthropic", available: !!process.env.ANTHROPIC_API_KEY, contextLen: 200000,  speed: "medium", cost: "$$"  },
    { id: "claude-opus-4-6",   name: "Claude Opus 4.6",   provider: "anthropic", available: !!process.env.ANTHROPIC_API_KEY, contextLen: 200000,  speed: "slow",   cost: "$$$" },
    { id: "gemini-2.0-flash",  name: "Gemini 2.0 Flash",  provider: "gemini",    available: !!(process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GEMINI_API_KEY), contextLen: 1000000, speed: "fast", cost: "$" },
    { id: "grok-3",            name: "Grok 3",            provider: "grok",      available: !!process.env.XAI_API_KEY,       contextLen: 131072,  speed: "fast",   cost: "$$"  },
  ];

  type OllamaModel = { id: string; name: string; provider: string; available: boolean; contextLen: number; speed: string; cost: string; size?: string };
  let ollamaModels: OllamaModel[] = [];
  try {
    const r = await fetch(`${ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(3000) });
    if (r.ok) {
      const data = await r.json();
      ollamaModels = (data.models ?? []).map((m: { name: string; size?: number }) => ({
        id:         m.name,
        name:       m.name,
        provider:   "ollama",
        available:  true,
        contextLen: 128000,
        speed:      "local",
        cost:       "free",
        size:       m.size ? `${(m.size / 1e9).toFixed(1)}GB` : undefined,
      }));
    }
  } catch { /* Ollama not running */ }

  return NextResponse.json({
    models:       [...ollamaModels, ...external],
    ollamaUrl,
    ollamaOnline: ollamaModels.length > 0,
  });
}
