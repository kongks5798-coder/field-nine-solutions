type MetricPoint = { t: string; v: number };
type MetricsInput = {
  sales: MetricPoint[];
  trends: MetricPoint[];
};

function summarizeSeries(series: MetricPoint[]) {
  if (series.length < 2) return { delta: 0, growthRate: 0 };
  const first = series[0].v;
  const last = series[series.length - 1].v;
  const delta = last - first;
  const growthRate = first === 0 ? 0 : delta / first;
  return { delta, growthRate };
}

export type AIAnalysis = {
  summary: string[];
  risks: string[];
  actions: string[];
  forecast: string;
};

function coerceAnalysis(value: unknown): AIAnalysis {
  const empty: AIAnalysis = { summary: [], risks: [], actions: [], forecast: "" };
  if (!value || typeof value !== "object") return empty;
  const data = value as Record<string, unknown>;
  const summary = Array.isArray(data.summary) ? data.summary.filter((v) => typeof v === "string") : [];
  const risks = Array.isArray(data.risks) ? data.risks.filter((v) => typeof v === "string") : [];
  const actions = Array.isArray(data.actions) ? data.actions.filter((v) => typeof v === "string") : [];
  const forecast = typeof data.forecast === "string" ? data.forecast : "";
  return { summary, risks, actions, forecast };
}

function localFallback(salesSummary: { delta: number; growthRate: number }, trendSummary: { delta: number; growthRate: number }): AIAnalysis {
  const salesRate = salesSummary.growthRate;
  const trendRate = trendSummary.growthRate;
  const momentum = salesRate * 0.7 + trendRate * 0.3;
  const confidence = Math.max(0.35, Math.min(0.85, 0.55 + Math.abs(momentum)));
  const dir = momentum >= 0 ? "upward" : "downward";
  const summary = [
    `Sales ${salesRate >= 0 ? "grew" : "declined"} ${Math.abs(salesRate * 100).toFixed(1)}% over the period.`,
    `Market trend ${trendRate >= 0 ? "improved" : "softened"} ${Math.abs(trendRate * 100).toFixed(1)}%.`,
    `Net momentum suggests an ${dir} trajectory with moderate confidence.`,
  ];
  const risks = [
    salesRate < 0 ? "Revenue contraction may persist without corrective actions." : "Growth may decelerate if demand normalizes.",
    trendRate < 0 ? "Market headwinds could suppress conversion efficiency." : "Competitive pressure may erode gains.",
  ];
  const actions = [
    "Prioritize high-converting channels and tighten CAC controls.",
    "Run pricing and offer tests to protect margin while sustaining volume.",
    "Strengthen retention with lifecycle messaging and win-back flows.",
  ];
  const forecast = `Next 4 weeks: ${dir} trajectory with ${(confidence * 100).toFixed(0)}% confidence.`;
  return { summary, risks, actions, forecast };
}

export async function analyzeBusiness(input: MetricsInput) {
  const salesSummary = summarizeSeries(input.sales);
  const trendSummary = summarizeSeries(input.trends);
  let ai: AIAnalysis | null = localFallback(salesSummary, trendSummary);

  const prompt = `
You are a world-class CTO Jarvis. Given sales metrics and market trend indices over time, produce:
1) Executive summary (3 bullets)
2) Key risks (2 bullets)
3) Recommended actions (3 bullets)
4) Forecast: next 4 weeks sales trajectory with confidence.

Current stats:
- Sales delta: ${salesSummary.delta.toFixed(2)}, growthRate: ${(salesSummary.growthRate * 100).toFixed(2)}%
- Trend delta: ${trendSummary.delta.toFixed(2)}, growthRate: ${(trendSummary.growthRate * 100).toFixed(2)}%

Return strict JSON with keys: summary, risks, actions, forecast.
`;

  const openaiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY || "";
  const openaiBase = (process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || "https://api.openai.com").replace(/\/+$/, "") + "/v1/chat/completions";
  const orKey = process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY || "";
  const orBase = (process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL || "https://openrouter.ai/api").replace(/\/+$/, "") + "/v1/chat/completions";
  const apiKey = openaiKey || orKey;
  const apiUrl = openaiKey ? openaiBase : orBase;
  const model = process.env.OPENAI_MODEL || process.env.AI_MODEL || "gpt-4o-mini";
  if (apiKey) {
    const { fetchOpenAI } = await import("./circuit");
    const resp = await fetchOpenAI(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 450,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You are a concise CTO analytics assistant." },
          { role: "user", content: prompt },
        ],
      }),
    }, async () => {
      const empty = new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ summary: [], risks: [], actions: [], forecast: "" }) } }] }), { status: 200 });
      return empty;
    });
    if (resp.ok) {
      const data = await resp.json();
      const content = data?.choices?.[0]?.message?.content;
      try {
        ai = coerceAnalysis(JSON.parse(content));
      } catch {
        const match = typeof content === "string" ? content.match(/\{[\s\S]*\}/) : null;
        if (match) {
          try {
            ai = coerceAnalysis(JSON.parse(match[0]));
          } catch {
            ai = localFallback(salesSummary, trendSummary);
          }
        } else {
          ai = localFallback(salesSummary, trendSummary);
        }
      }
    }
  }

  return {
    local: {
      salesSummary,
      trendSummary,
    },
    ai,
  };
}
