"use client";

import { useState, useEffect, useMemo, useCallback } from "react";

/* ────────────────────── Theme constants ────────────────────── */
const T = {
  bg: "#07080f",
  surface: "#0d1020",
  card: "#111827",
  accent: "#f97316",
  text: "#e2e8f0",
  textDim: "#94a3b8",
  border: "#1e293b",
  white: "#ffffff",
};

const METHOD_COLORS: Record<string, string> = {
  get: "#10b981",
  post: "#3b82f6",
  put: "#f97316",
  delete: "#ef4444",
  patch: "#8b5cf6",
};

/* ────────────────────── Type helpers ────────────────────── */
interface OpenAPISchema {
  type?: string;
  format?: string;
  example?: unknown;
  enum?: string[];
  items?: OpenAPISchema;
  properties?: Record<string, OpenAPISchema>;
  additionalProperties?: boolean | OpenAPISchema;
  required?: string[];
  description?: string;
  maxLength?: number;
  maximum?: number;
  minimum?: number;
}

interface OpenAPIParameter {
  name: string;
  in: string;
  required?: boolean;
  schema?: OpenAPISchema;
  description?: string;
}

interface OpenAPIRequestBody {
  required?: boolean;
  content?: Record<string, { schema?: OpenAPISchema }>;
}

interface OpenAPIResponse {
  description?: string;
  content?: Record<string, { schema?: OpenAPISchema }>;
}

type OpenAPISecurityRequirement = Record<string, string[]>;

interface OpenAPIOperation {
  tags?: string[];
  summary?: string;
  description?: string;
  operationId?: string;
  parameters?: OpenAPIParameter[];
  requestBody?: OpenAPIRequestBody;
  responses?: Record<string, OpenAPIResponse>;
  security?: OpenAPISecurityRequirement[];
  deprecated?: boolean;
}

interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
    contact?: { email?: string; url?: string };
  };
  servers?: { url: string; description?: string }[];
  tags?: { name: string; description?: string }[];
  paths: Record<string, Record<string, OpenAPIOperation>>;
  components?: { schemas?: Record<string, OpenAPISchema>; securitySchemes?: Record<string, unknown> };
}

interface Endpoint {
  path: string;
  method: string;
  operation: OpenAPIOperation;
  tag: string;
}

/* ────────────────────── Helpers ────────────────────── */
function collectEndpoints(spec: OpenAPISpec): Endpoint[] {
  const eps: Endpoint[] = [];
  for (const [path, methods] of Object.entries(spec.paths)) {
    for (const [method, op] of Object.entries(methods)) {
      if (["get", "post", "put", "delete", "patch"].includes(method)) {
        eps.push({
          path,
          method,
          operation: op,
          tag: op.tags?.[0] ?? "default",
        });
      }
    }
  }
  return eps;
}

function groupByTag(eps: Endpoint[]): Record<string, Endpoint[]> {
  const groups: Record<string, Endpoint[]> = {};
  for (const ep of eps) {
    if (!groups[ep.tag]) groups[ep.tag] = [];
    groups[ep.tag].push(ep);
  }
  return groups;
}

function schemaToExample(schema: OpenAPISchema | undefined, depth = 0): unknown {
  if (!schema || depth > 5) return null;
  if (schema.example !== undefined) return schema.example;
  if (schema.enum) return schema.enum[0];

  switch (schema.type) {
    case "string":
      if (schema.format === "date-time") return "2025-01-01T00:00:00Z";
      if (schema.format === "email") return "user@example.com";
      if (schema.format === "uuid") return "550e8400-e29b-41d4-a716-446655440000";
      return "string";
    case "integer":
    case "number":
      return schema.maximum ?? schema.minimum ?? 0;
    case "boolean":
      return true;
    case "array":
      return schema.items ? [schemaToExample(schema.items, depth + 1)] : [];
    case "object": {
      const obj: Record<string, unknown> = {};
      if (schema.properties) {
        for (const [k, v] of Object.entries(schema.properties)) {
          obj[k] = schemaToExample(v as OpenAPISchema, depth + 1);
        }
      }
      if (schema.additionalProperties && typeof schema.additionalProperties === "object") {
        obj["key"] = schemaToExample(schema.additionalProperties, depth + 1);
      }
      return obj;
    }
    default:
      return null;
  }
}

/* ────────────────────── Components ────────────────────── */

function MethodBadge({ method }: { method: string }) {
  const color = METHOD_COLORS[method] ?? T.textDim;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 700,
        fontFamily: "monospace",
        textTransform: "uppercase",
        color: T.white,
        background: color,
        minWidth: 52,
        textAlign: "center",
        letterSpacing: "0.05em",
        flexShrink: 0,
      }}
    >
      {method}
    </span>
  );
}

function ParamsTable({ params }: { params: OpenAPIParameter[] }) {
  if (!params?.length) return null;
  return (
    <div style={{ marginTop: 16 }}>
      <h4 style={{ color: T.accent, fontSize: 14, margin: "0 0 8px" }}>Parameters</h4>
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 13,
            fontFamily: "monospace",
          }}
        >
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
              {["Name", "In", "Required", "Type"].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    padding: "8px 12px",
                    color: T.textDim,
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {params.map((p, i) => (
              <tr
                key={i}
                style={{
                  borderBottom: `1px solid ${T.border}`,
                }}
              >
                <td style={{ padding: "8px 12px", color: T.white }}>{p.name}</td>
                <td style={{ padding: "8px 12px", color: T.textDim }}>{p.in}</td>
                <td style={{ padding: "8px 12px" }}>
                  {p.required ? (
                    <span style={{ color: "#ef4444", fontWeight: 600 }}>Yes</span>
                  ) : (
                    <span style={{ color: T.textDim }}>No</span>
                  )}
                </td>
                <td style={{ padding: "8px 12px", color: "#8b5cf6" }}>
                  {p.schema?.type ?? "any"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RequestBodySection({ body }: { body: OpenAPIRequestBody }) {
  if (!body) return null;

  const contentType = Object.keys(body.content ?? {})[0];
  const schema = body.content?.[contentType]?.schema;
  const example = schema ? schemaToExample(schema) : null;

  return (
    <div style={{ marginTop: 16 }}>
      <h4 style={{ color: T.accent, fontSize: 14, margin: "0 0 8px" }}>
        Request Body
        {body.required && (
          <span style={{ color: "#ef4444", fontSize: 11, marginLeft: 8 }}>required</span>
        )}
      </h4>
      {contentType && (
        <span
          style={{
            display: "inline-block",
            fontSize: 11,
            color: T.textDim,
            background: T.surface,
            padding: "2px 8px",
            borderRadius: 4,
            marginBottom: 8,
            fontFamily: "monospace",
          }}
        >
          {contentType}
        </span>
      )}
      {schema?.properties && (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
              fontFamily: "monospace",
              marginBottom: 8,
            }}
          >
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {["Field", "Type", "Required", "Info"].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: "left",
                      padding: "8px 12px",
                      color: T.textDim,
                      fontWeight: 600,
                      fontSize: 12,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(schema.properties).map(([name, prop]: [string, OpenAPISchema]) => (
                <tr key={name} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: "8px 12px", color: T.white }}>{name}</td>
                  <td style={{ padding: "8px 12px", color: "#8b5cf6" }}>
                    {prop.type ?? "any"}
                    {prop.format ? ` (${prop.format})` : ""}
                  </td>
                  <td style={{ padding: "8px 12px" }}>
                    {schema.required?.includes(name) ? (
                      <span style={{ color: "#ef4444", fontWeight: 600 }}>Yes</span>
                    ) : (
                      <span style={{ color: T.textDim }}>No</span>
                    )}
                  </td>
                  <td style={{ padding: "8px 12px", color: T.textDim, fontSize: 12 }}>
                    {prop.description ?? ""}
                    {prop.enum ? ` [${prop.enum.join(", ")}]` : ""}
                    {prop.maxLength ? ` max: ${prop.maxLength}` : ""}
                    {prop.maximum !== undefined ? ` max: ${prop.maximum}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {example != null && (
        <pre
          style={{
            background: T.bg,
            border: `1px solid ${T.border}`,
            borderRadius: 6,
            padding: 12,
            fontSize: 12,
            color: T.text,
            overflowX: "auto",
            margin: 0,
          }}
        >
          {JSON.stringify(example, null, 2)}
        </pre>
      )}
    </div>
  );
}

function ResponsesSection({ responses }: { responses: Record<string, OpenAPIResponse> }) {
  if (!responses) return null;
  return (
    <div style={{ marginTop: 16 }}>
      <h4 style={{ color: T.accent, fontSize: 14, margin: "0 0 8px" }}>Responses</h4>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {Object.entries(responses).map(([code, resp]: [string, OpenAPIResponse]) => {
          const isOk = code.startsWith("2");
          const isClient = code.startsWith("4");
          const isServer = code.startsWith("5");
          const dotColor = isOk ? "#10b981" : isClient ? "#f97316" : isServer ? "#ef4444" : T.textDim;

          const schema =
            resp.content?.["application/json"]?.schema;
          const example = schema ? schemaToExample(schema) : null;

          return (
            <div
              key={code}
              style={{
                background: T.surface,
                borderRadius: 6,
                padding: "8px 12px",
                border: `1px solid ${T.border}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: dotColor,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: "monospace",
                    fontWeight: 700,
                    fontSize: 13,
                    color: T.white,
                  }}
                >
                  {code}
                </span>
                <span style={{ color: T.textDim, fontSize: 13 }}>
                  {resp.description ?? ""}
                </span>
              </div>
              {example != null && (
                <pre
                  style={{
                    background: T.bg,
                    border: `1px solid ${T.border}`,
                    borderRadius: 4,
                    padding: 8,
                    fontSize: 11,
                    color: T.text,
                    overflowX: "auto",
                    margin: "8px 0 0",
                  }}
                >
                  {JSON.stringify(example, null, 2)}
                </pre>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SecurityBadges({ security }: { security?: OpenAPISecurityRequirement[] }) {
  if (!security?.length) return null;
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
      {security.map((s, i) => {
        const name = Object.keys(s)[0];
        return (
          <span
            key={i}
            style={{
              fontSize: 11,
              padding: "2px 8px",
              borderRadius: 4,
              background: "rgba(249,115,22,0.15)",
              color: T.accent,
              border: `1px solid rgba(249,115,22,0.3)`,
              fontFamily: "monospace",
            }}
          >
            {name}
          </span>
        );
      })}
    </div>
  );
}

/* ────────────────────── Endpoint Detail ────────────────────── */
function EndpointDetail({ ep }: { ep: Endpoint }) {
  const { method, path, operation } = ep;
  return (
    <div
      style={{
        background: T.card,
        borderRadius: 8,
        border: `1px solid ${T.border}`,
        padding: 24,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <MethodBadge method={method} />
        <code
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: T.white,
            wordBreak: "break-all",
          }}
        >
          {path}
        </code>
      </div>

      {/* Summary & description */}
      {operation.summary && (
        <h3 style={{ color: T.white, fontSize: 18, margin: "12px 0 4px", fontWeight: 600 }}>
          {operation.summary}
        </h3>
      )}
      {operation.description && (
        <p style={{ color: T.textDim, fontSize: 14, margin: "4px 0 0", lineHeight: 1.6 }}>
          {operation.description}
        </p>
      )}

      {/* Security */}
      <SecurityBadges security={operation.security} />

      {/* Parameters */}
      {operation.parameters && <ParamsTable params={operation.parameters} />}

      {/* Request body */}
      {operation.requestBody && <RequestBodySection body={operation.requestBody} />}

      {/* Responses */}
      {operation.responses && <ResponsesSection responses={operation.responses} />}
    </div>
  );
}

/* ────────────────────── Sidebar item ────────────────────── */
function SidebarItem({
  ep,
  isActive,
  onClick,
}: {
  ep: Endpoint;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        width: "100%",
        padding: "6px 12px",
        border: "none",
        borderRadius: 4,
        background: isActive ? "rgba(249,115,22,0.12)" : "transparent",
        cursor: "pointer",
        textAlign: "left",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.04)";
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = "transparent";
      }}
    >
      <MethodBadge method={ep.method} />
      <span
        style={{
          fontSize: 12,
          color: isActive ? T.white : T.textDim,
          fontFamily: "monospace",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {ep.path}
      </span>
    </button>
  );
}

/* ────────────────────── Main Page ────────────────────── */
export default function DocsContent() {
  const [spec, setSpec] = useState<OpenAPISpec | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetch("/api/docs")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setSpec)
      .catch((e) => setError(e.message));
  }, []);

  const endpoints = useMemo(() => (spec ? collectEndpoints(spec) : []), [spec]);

  const filtered = useMemo(() => {
    if (!search.trim()) return endpoints;
    const q = search.toLowerCase();
    return endpoints.filter(
      (ep) =>
        ep.path.toLowerCase().includes(q) ||
        ep.method.toLowerCase().includes(q) ||
        ep.operation.summary?.toLowerCase().includes(q) ||
        ep.tag.toLowerCase().includes(q)
    );
  }, [endpoints, search]);

  const grouped = useMemo(() => groupByTag(filtered), [filtered]);

  const selectedEp = useMemo(() => {
    if (!selectedKey) return null;
    return endpoints.find((ep) => `${ep.method}:${ep.path}` === selectedKey) ?? null;
  }, [endpoints, selectedKey]);

  const handleSelect = useCallback((ep: Endpoint) => {
    setSelectedKey(`${ep.method}:${ep.path}`);
    setSidebarOpen(false);
  }, []);

  /* ── Loading ── */
  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: T.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ef4444",
          fontFamily: "system-ui, sans-serif",
          padding: 24,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>!</div>
          <h2 style={{ margin: "0 0 8px", color: T.white }}>API 문서를 불러올 수 없습니다</h2>
          <p style={{ color: T.textDim }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!spec) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: T.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 40,
              height: 40,
              border: `3px solid ${T.border}`,
              borderTop: `3px solid ${T.accent}`,
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <p style={{ color: T.textDim, fontSize: 14 }}>API 스펙 로딩 중...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  const tagMeta: Record<string, string> = {};
  if (spec.tags) {
    for (const t of spec.tags) tagMeta[t.name] = t.description ?? "";
  }

  /* ── Render ── */
  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.bg,
        color: T.text,
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* ─── Header ─── */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: T.surface,
          borderBottom: `1px solid ${T.border}`,
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        {/* Mobile hamburger */}
        <button
          onClick={() => setSidebarOpen((p) => !p)}
          aria-label="Toggle sidebar"
          style={{
            display: "none",
            background: "none",
            border: `1px solid ${T.border}`,
            borderRadius: 4,
            color: T.text,
            padding: "4px 8px",
            cursor: "pointer",
            fontSize: 18,
          }}
          className="docs-hamburger"
        >
          {sidebarOpen ? "\u2715" : "\u2630"}
        </button>

        <div style={{ flex: 1, minWidth: 200 }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: T.white }}>
            <span style={{ color: T.accent }}>Dalkak</span> API 문서
          </h1>
          <div style={{ display: "flex", gap: 16, marginTop: 4, fontSize: 12, color: T.textDim }}>
            <span>
              OpenAPI{" "}
              <span style={{ color: T.accent, fontFamily: "monospace" }}>{spec.openapi}</span>
            </span>
            <span>
              v
              <span style={{ color: T.accent, fontFamily: "monospace" }}>
                {spec.info.version}
              </span>
            </span>
            {spec.servers?.[0] && (
              <span style={{ fontFamily: "monospace" }}>{spec.servers[0].url}</span>
            )}
          </div>
        </div>

        {/* Search */}
        <div style={{ position: "relative", width: 280, maxWidth: "100%" }}>
          <input
            type="text"
            placeholder="엔드포인트 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px 8px 36px",
              background: T.bg,
              border: `1px solid ${T.border}`,
              borderRadius: 6,
              color: T.white,
              fontSize: 13,
              outline: "none",
              boxSizing: "border-box",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = T.accent)}
            onBlur={(e) => (e.currentTarget.style.borderColor = T.border)}
          />
          <span
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: T.textDim,
              fontSize: 14,
              pointerEvents: "none",
            }}
          >
            &#x1F50D;
          </span>
        </div>
      </header>

      {/* ─── Body ─── */}
      <div style={{ display: "flex", minHeight: "calc(100vh - 80px)" }}>
        {/* Sidebar overlay on mobile */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 49,
            }}
            className="docs-overlay"
          />
        )}

        {/* ─── Sidebar ─── */}
        <aside
          className="docs-sidebar"
          style={{
            width: 280,
            minWidth: 280,
            background: T.surface,
            borderRight: `1px solid ${T.border}`,
            overflowY: "auto",
            padding: "12px 8px",
            height: "calc(100vh - 80px)",
            position: "sticky",
            top: 80,
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: T.textDim,
              padding: "4px 12px 8px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Endpoints ({filtered.length})
          </div>
          {Object.entries(grouped).map(([tag, eps]) => (
            <div key={tag} style={{ marginBottom: 12 }}>
              <div
                style={{
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  color: T.accent,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
                title={tagMeta[tag] ?? ""}
              >
                {tag}
                {tagMeta[tag] && (
                  <span
                    style={{
                      display: "block",
                      fontSize: 11,
                      fontWeight: 400,
                      color: T.textDim,
                      textTransform: "none",
                      letterSpacing: "normal",
                      marginTop: 2,
                    }}
                  >
                    {tagMeta[tag]}
                  </span>
                )}
              </div>
              {eps.map((ep) => (
                <SidebarItem
                  key={`${ep.method}:${ep.path}`}
                  ep={ep}
                  isActive={selectedKey === `${ep.method}:${ep.path}`}
                  onClick={() => handleSelect(ep)}
                />
              ))}
            </div>
          ))}
          {filtered.length === 0 && (
            <p
              style={{
                color: T.textDim,
                fontSize: 13,
                textAlign: "center",
                padding: "24px 12px",
              }}
            >
              검색 결과가 없습니다.
            </p>
          )}
        </aside>

        {/* ─── Main ─── */}
        <main
          style={{
            flex: 1,
            padding: 24,
            overflowY: "auto",
            maxWidth: 900,
          }}
        >
          {selectedEp ? (
            <EndpointDetail ep={selectedEp} />
          ) : (
            /* Welcome / overview */
            <div>
              <div
                style={{
                  background: T.card,
                  borderRadius: 8,
                  border: `1px solid ${T.border}`,
                  padding: 32,
                  marginBottom: 24,
                }}
              >
                <h2 style={{ color: T.white, margin: "0 0 8px", fontSize: 24 }}>
                  {spec.info.title}
                </h2>
                <p style={{ color: T.textDim, margin: "0 0 16px", lineHeight: 1.6 }}>
                  {spec.info.description}
                </p>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13 }}>
                  <span
                    style={{
                      background: T.surface,
                      padding: "4px 12px",
                      borderRadius: 4,
                      color: T.text,
                      fontFamily: "monospace",
                    }}
                  >
                    Version: {spec.info.version}
                  </span>
                  {spec.servers?.map((s, i) => (
                    <span
                      key={i}
                      style={{
                        background: T.surface,
                        padding: "4px 12px",
                        borderRadius: 4,
                        color: T.text,
                        fontFamily: "monospace",
                      }}
                    >
                      {s.description}: {s.url}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tag overview cards */}
              <h3 style={{ color: T.white, margin: "0 0 12px", fontSize: 16 }}>
                카테고리 ({Object.keys(grouped).length})
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                  gap: 12,
                }}
              >
                {Object.entries(grouped).map(([tag, eps]) => (
                  <div
                    key={tag}
                    style={{
                      background: T.card,
                      borderRadius: 8,
                      border: `1px solid ${T.border}`,
                      padding: 16,
                      cursor: "pointer",
                      transition: "border-color 0.15s",
                    }}
                    onClick={() => handleSelect(eps[0])}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.borderColor = T.accent)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.borderColor = T.border)
                    }
                  >
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: T.accent,
                        textTransform: "uppercase",
                        marginBottom: 4,
                      }}
                    >
                      {tag}
                    </div>
                    <div style={{ color: T.textDim, fontSize: 12, marginBottom: 8 }}>
                      {tagMeta[tag] ?? ""}
                    </div>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {eps.slice(0, 4).map((ep) => (
                        <MethodBadge key={`${ep.method}:${ep.path}`} method={ep.method} />
                      ))}
                      {eps.length > 4 && (
                        <span style={{ fontSize: 11, color: T.textDim, alignSelf: "center" }}>
                          +{eps.length - 4} more
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: T.textDim, marginTop: 6 }}>
                      {eps.length} endpoint{eps.length > 1 ? "s" : ""}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ─── Responsive CSS ─── */}
      <style>{`
        @media (max-width: 768px) {
          .docs-hamburger {
            display: block !important;
          }
          .docs-sidebar {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            height: 100vh !important;
            z-index: 50 !important;
            transform: translateX(${sidebarOpen ? "0" : "-100%"});
            transition: transform 0.2s ease;
          }
        }
        @media (min-width: 769px) {
          .docs-overlay {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
