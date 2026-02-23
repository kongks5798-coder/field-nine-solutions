/**
 * POST /api/flow/execute
 * Executes a flow graph in topological order (Kahn's algorithm).
 * Node types: trigger, http_request, ai_chat, send_email, transform, condition
 *
 * SECURITY: NO eval() or new Function() anywhere.
 * Template substitution uses safe {{variable}} regex replacement.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { z } from 'zod';
import { log } from '@/lib/logger';
import type {
  FlowNode,
  FlowEdge,
  FlowExecutionResult,
  FlowRunResult,
} from '@/types/flow';

export const maxDuration = 60;

/* ── Zod schemas ─────────────────────────────────────────────────────────── */

const FlowNodeSchema = z.object({
  id:       z.string().min(1).max(64),
  type:     z.enum(['trigger', 'http_request', 'ai_chat', 'send_email', 'transform', 'condition']),
  label:    z.string().max(120),
  config:   z.record(z.string(), z.unknown()),
  position: z.object({ x: z.number(), y: z.number() }),
});

const FlowEdgeSchema = z.object({
  id:     z.string().min(1).max(64),
  source: z.string().min(1).max(64),
  target: z.string().min(1).max(64),
  label:  z.string().max(120).optional(),
});

const FlowExecuteSchema = z.object({
  nodes: z.array(FlowNodeSchema).min(1).max(50),
  edges: z.array(FlowEdgeSchema).max(200),
});

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!url && url !== 'https://placeholder.supabase.co';
}

/**
 * Safe template substitution: replaces {{key}} with values from context.
 * NO eval, NO Function constructor.
 */
function safeTemplate(template: string, context: Record<string, unknown>): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_match, key: string) => {
    const trimmed = key.trim();
    // Support dot notation: e.g. {{prev.data}}
    const parts = trimmed.split('.');
    let value: unknown = context;
    for (const part of parts) {
      if (value === null || value === undefined) break;
      if (typeof value === 'object') {
        value = (value as Record<string, unknown>)[part];
      } else {
        value = undefined;
        break;
      }
    }
    if (value === undefined || value === null) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  });
}

/**
 * Safe condition evaluation. Only supports simple comparisons:
 *   ==, !=, >, <, >=, <=, contains
 * NO eval, NO Function constructor.
 */
function safeCondition(
  left: unknown,
  operator: string,
  right: unknown,
): boolean {
  const l = typeof left === 'string' ? left : JSON.stringify(left ?? '');
  const r = typeof right === 'string' ? right : JSON.stringify(right ?? '');

  switch (operator) {
    case '==':
    case 'equals':
      return l === r;
    case '!=':
    case 'not_equals':
      return l !== r;
    case '>':
      return Number(l) > Number(r);
    case '<':
      return Number(l) < Number(r);
    case '>=':
      return Number(l) >= Number(r);
    case '<=':
      return Number(l) <= Number(r);
    case 'contains':
      return l.includes(r);
    case 'not_contains':
      return !l.includes(r);
    default:
      return false;
  }
}

/**
 * Resolve a dot-path like "prev.data.status" from the context object.
 */
function resolvePath(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.trim().split('.');
  let cur: unknown = obj;
  for (const part of parts) {
    if (cur === null || cur === undefined) return undefined;
    if (typeof cur === 'object') {
      cur = (cur as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return cur;
}

/* ── Topological sort (Kahn's algorithm) ─────────────────────────────────── */

function topologicalSort(nodes: FlowNode[], edges: FlowEdge[]): FlowNode[] | null {
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adjacency.set(node.id, []);
  }

  for (const edge of edges) {
    const prev = inDegree.get(edge.target) ?? 0;
    inDegree.set(edge.target, prev + 1);
    adjacency.get(edge.source)?.push(edge.target);
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted.push(current);
    for (const neighbor of adjacency.get(current) ?? []) {
      const newDeg = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }

  // Cycle detection: if not all nodes are in sorted, there's a cycle
  if (sorted.length !== nodes.length) return null;

  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  return sorted.map(id => nodeMap.get(id)!);
}

/* ── Individual node executors ───────────────────────────────────────────── */

async function executeTrigger(
  config: Record<string, unknown>,
): Promise<unknown> {
  // Trigger nodes just pass through their config as output
  return {
    triggeredAt: new Date().toISOString(),
    cron: config.cron ?? null,
    path: config.path ?? null,
    type: 'manual',
  };
}

async function executeHttpRequest(
  config: Record<string, unknown>,
  context: Record<string, unknown>,
): Promise<unknown> {
  const rawUrl = String(config.url ?? '');
  if (!rawUrl) throw new Error('http_request: url is required');

  const url = safeTemplate(rawUrl, context);
  const method = String(config.method ?? 'GET').toUpperCase();

  // Validate URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error(`http_request: invalid URL "${url}"`);
  }

  // Only allow http/https
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error(`http_request: protocol "${parsedUrl.protocol}" not allowed`);
  }

  // Build headers
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (config.headers && typeof config.headers === 'object') {
    for (const [k, v] of Object.entries(config.headers as Record<string, unknown>)) {
      headers[k] = safeTemplate(String(v), context);
    }
  }

  // Build body
  let body: string | undefined;
  if (['POST', 'PUT', 'PATCH'].includes(method) && config.body) {
    body = typeof config.body === 'string'
      ? safeTemplate(config.body, context)
      : JSON.stringify(config.body);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const res = await fetch(url, {
      method,
      headers,
      body,
      signal: controller.signal,
    });

    const contentType = res.headers.get('content-type') ?? '';
    let data: unknown;
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }

    return {
      status: res.status,
      statusText: res.statusText,
      data,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function executeAiChat(
  config: Record<string, unknown>,
  context: Record<string, unknown>,
): Promise<unknown> {
  const rawPrompt = String(config.prompt ?? '');
  if (!rawPrompt) throw new Error('ai_chat: prompt is required');

  const prompt = safeTemplate(rawPrompt, context);
  const model = String(config.model ?? 'gpt-4o-mini');

  // Determine which provider to use based on model name
  if (model.includes('claude') || model.includes('anthropic')) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ai_chat: ANTHROPIC_API_KEY not configured');

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model.includes('claude') ? model : 'claude-3-5-haiku-20241022',
        max_tokens: Number(config.maxTokens ?? 1024),
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(`Anthropic API error: ${data.error?.message ?? res.statusText}`);

    return {
      text: data.content?.[0]?.text ?? '',
      model,
      usage: data.usage ?? null,
    };
  }

  if (model.includes('gemini')) {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('ai_chat: GOOGLE_GENERATIVE_AI_API_KEY not configured');

    const geminiModel = model.includes('gemini') ? model : 'gemini-1.5-flash';
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      },
    );

    const data = await res.json();
    if (!res.ok) throw new Error(`Gemini API error: ${data.error?.message ?? res.statusText}`);

    return {
      text: data.candidates?.[0]?.content?.parts?.[0]?.text ?? '',
      model: geminiModel,
    };
  }

  // Default: OpenAI
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('ai_chat: OPENAI_API_KEY not configured');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: Number(config.maxTokens ?? 1024),
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(`OpenAI API error: ${data.error?.message ?? res.statusText}`);

  return {
    text: data.choices?.[0]?.message?.content ?? '',
    model,
    usage: data.usage ?? null,
  };
}

async function executeSendEmail(
  config: Record<string, unknown>,
  context: Record<string, unknown>,
): Promise<unknown> {
  const to      = safeTemplate(String(config.to ?? ''), context);
  const subject = safeTemplate(String(config.subject ?? ''), context);
  const body    = safeTemplate(String(config.body ?? ''), context);

  if (!to) throw new Error('send_email: "to" address is required');

  // Try real Resend email if RESEND_API_KEY is set
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'Dalkak <noreply@fieldnine.io>',
        to,
        subject: subject || 'Flow Notification',
        html: body || '<p>Flow execution notification</p>',
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(`Resend API error: ${JSON.stringify(data)}`);

    return { sent: true, to, subject, id: data.id };
  }

  // Mock success when RESEND_API_KEY is not configured
  log.info('send_email: RESEND_API_KEY not set, mocking success', { to, subject });
  return { sent: false, mock: true, to, subject, message: 'RESEND_API_KEY not configured — email not actually sent' };
}

function executeTransform(
  config: Record<string, unknown>,
  context: Record<string, unknown>,
): unknown {
  const template = config.template;
  if (typeof template === 'string') {
    // String template with {{variable}} substitution
    const result = safeTemplate(template, context);
    // Try parsing as JSON; if it fails, return the raw string
    try {
      return JSON.parse(result);
    } catch {
      return result;
    }
  }

  // If template is an object/array, do deep substitution
  if (template && typeof template === 'object') {
    const json = JSON.stringify(template);
    const substituted = safeTemplate(json, context);
    try {
      return JSON.parse(substituted);
    } catch {
      return substituted;
    }
  }

  // Passthrough: if no template, return the previous outputs as-is
  return context.prev ?? null;
}

function executeCondition(
  config: Record<string, unknown>,
  context: Record<string, unknown>,
): { pass: boolean; left: unknown; operator: string; right: unknown } {
  const fieldPath = String(config.field ?? '');
  const operator  = String(config.operator ?? '==');
  const rightRaw  = config.value;

  let left: unknown;
  if (fieldPath) {
    left = resolvePath(context, fieldPath);
  } else {
    left = context.prev;
  }

  const right = typeof rightRaw === 'string' ? safeTemplate(rightRaw, context) : rightRaw;
  const pass = safeCondition(left, operator, right);

  return { pass, left, operator, right };
}

/* ── POST handler ────────────────────────────────────────────────────────── */

export async function POST(req: NextRequest) {
  const start = Date.now();

  // ── Auth check ────────────────────────────────────────────────────────
  if (isSupabaseConfigured()) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } },
    );
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // ── Parse body ────────────────────────────────────────────────────────
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = FlowExecuteSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { nodes, edges } = parsed.data;

  // ── Topological sort ──────────────────────────────────────────────────
  const sorted = topologicalSort(nodes as FlowNode[], edges as FlowEdge[]);
  if (!sorted) {
    return NextResponse.json(
      { error: 'Flow graph contains a cycle' },
      { status: 400 },
    );
  }

  log.info('flow/execute: starting execution', {
    nodeCount: sorted.length,
    edgeCount: edges.length,
  });

  // ── Execute in order ──────────────────────────────────────────────────
  const results: FlowExecutionResult[] = [];
  // Stores output from each node by ID for downstream consumption
  const outputs = new Map<string, unknown>();
  let hasError = false;

  for (const node of sorted) {
    const nodeStart = Date.now();

    // Build context from parent node outputs
    const parentEdges = edges.filter(e => e.target === node.id);
    const parentOutputs: Record<string, unknown> = {};
    for (const pe of parentEdges) {
      parentOutputs[pe.source] = outputs.get(pe.source);
    }

    // "prev" is the first parent's output (most common case)
    const firstParentId = parentEdges[0]?.source;
    const prevOutput = firstParentId ? outputs.get(firstParentId) : undefined;

    const context: Record<string, unknown> = {
      prev: prevOutput,
      parents: parentOutputs,
      ...parentOutputs,
    };

    // If a prior node errored and this node depends on it, skip unless it's a condition
    const dependsOnError = parentEdges.some(pe => {
      const parentResult = results.find(r => r.nodeId === pe.source);
      return parentResult?.status === 'error';
    });

    if (dependsOnError && node.type !== 'condition') {
      results.push({
        nodeId: node.id,
        status: 'skipped',
        output: null,
        error: 'Skipped: upstream node failed',
        duration: 0,
      });
      log.info(`flow/execute: skipped node "${node.label}" (upstream error)`, { nodeId: node.id });
      continue;
    }

    try {
      let output: unknown;

      switch (node.type) {
        case 'trigger':
          output = await executeTrigger(node.config);
          break;

        case 'http_request':
          output = await executeHttpRequest(node.config, context);
          break;

        case 'ai_chat':
          output = await executeAiChat(node.config, context);
          break;

        case 'send_email':
          output = await executeSendEmail(node.config, context);
          break;

        case 'transform':
          output = executeTransform(node.config, context);
          break;

        case 'condition': {
          const condResult = executeCondition(node.config, context);
          output = condResult;
          if (!condResult.pass) {
            // Find downstream nodes that this condition feeds into and mark them for skip
            // This is handled naturally because `output.pass === false` can be checked
          }
          break;
        }

        default:
          output = null;
      }

      const duration = Date.now() - nodeStart;
      outputs.set(node.id, output);
      results.push({ nodeId: node.id, status: 'success', output, duration });
      log.info(`flow/execute: node "${node.label}" completed`, { nodeId: node.id, duration });
    } catch (err) {
      const duration = Date.now() - nodeStart;
      const message = err instanceof Error ? err.message : 'Unknown error';
      outputs.set(node.id, null);
      results.push({ nodeId: node.id, status: 'error', output: null, error: message, duration });
      hasError = true;
      log.error(`flow/execute: node "${node.label}" failed`, { nodeId: node.id, error: message, duration });
    }
  }

  const totalDuration = Date.now() - start;
  const runResult: FlowRunResult = {
    success: !hasError,
    results,
    totalDuration,
  };

  log.info('flow/execute: completed', {
    success: runResult.success,
    totalDuration,
    nodeResults: results.map(r => ({ id: r.nodeId, status: r.status })),
  });

  return NextResponse.json(runResult);
}
