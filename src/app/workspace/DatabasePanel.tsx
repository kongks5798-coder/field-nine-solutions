"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { T } from "./workspace.constants";
import { useUiStore, useProjectStore } from "./stores";

// ── Types ──────────────────────────────────────────────────────────────────────

type QueryResult = {
  columns: string[];
  rows: unknown[][];
  rowCount: number;
  executionTimeMs: number;
  type: string;
};

type TableInfo = {
  name: string;
  columns: { name: string; type: string; pk: boolean }[];
  rowCount: number;
};

type QueryHistoryEntry = {
  query: string;
  timestamp: string;
  success: boolean;
  rowCount?: number;
  error?: string;
};

// ── Component ──────────────────────────────────────────────────────────────────

export interface DatabasePanelProps {
  onClose: () => void;
}

export function DatabasePanel({ onClose }: DatabasePanelProps) {
  const showToast = useUiStore(s => s.showToast);
  const projectId = useProjectStore(s => s.projectId);

  const [db, setDb] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<QueryResult | null>(null);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<QueryHistoryEntry[]>([]);
  const [tab, setTab] = useState<"query" | "tables" | "history">("query");
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const dbRef = useRef<unknown>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const STORAGE_KEY = `f9_db_${projectId}`;

  // Sample queries
  const SAMPLES = [
    { label: "테이블 생성", query: "CREATE TABLE users (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  name TEXT NOT NULL,\n  email TEXT UNIQUE,\n  created_at DATETIME DEFAULT CURRENT_TIMESTAMP\n);" },
    { label: "데이터 추가", query: "INSERT INTO users (name, email) VALUES ('홍길동', 'hong@example.com');" },
    { label: "전체 조회", query: "SELECT * FROM users;" },
    { label: "집계 쿼리", query: "SELECT COUNT(*) as total FROM users;" },
    { label: "테이블 목록", query: "SELECT name FROM sqlite_master WHERE type='table';" },
    { label: "Products 테이블", query: "CREATE TABLE products (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  name TEXT NOT NULL,\n  price REAL DEFAULT 0,\n  stock INTEGER DEFAULT 0,\n  category TEXT\n);" },
    { label: "Orders 테이블", query: "CREATE TABLE orders (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  user_id INTEGER REFERENCES users(id),\n  total REAL,\n  status TEXT DEFAULT 'pending',\n  ordered_at DATETIME DEFAULT CURRENT_TIMESTAMP\n);" },
  ];

  // Initialize sql.js
  const initDB = useCallback(async () => {
    setLoading(true);
    try {
      const initSqlJs = (await import("sql.js")).default;
      const SQL = await initSqlJs({
        locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
      });

      // Try to load from localStorage
      let database;
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const binaryArray = Uint8Array.from(atob(saved), c => c.charCodeAt(0));
          database = new SQL.Database(binaryArray);
        } else {
          database = new SQL.Database();
        }
      } catch {
        database = new SQL.Database();
      }

      dbRef.current = database;
      setDb(database);
      refreshTables(database);
      showToast("SQLite 데이터베이스 초기화됨");
    } catch (err) {
      setError(`sql.js 로드 실패: ${String(err)}`);
      showToast("DB 로드 실패 — sql.js CDN 연결 필요");
    } finally {
      setLoading(false);
    }
  }, [STORAGE_KEY, showToast]);

  useEffect(() => { initDB(); }, [initDB]);

  // Save DB to localStorage
  const saveDB = useCallback(() => {
    const database = dbRef.current as { export: () => Uint8Array } | null;
    if (!database) return;
    try {
      const data = database.export();
      const binary = String.fromCharCode(...data);
      localStorage.setItem(STORAGE_KEY, btoa(binary));
    } catch { /* storage full */ }
  }, [STORAGE_KEY]);

  // Refresh table list
  const refreshTables = (database?: unknown) => {
    const d = (database || dbRef.current) as { exec: (sql: string) => { columns: string[]; values: unknown[][] }[] } | null;
    if (!d) return;
    try {
      const result = d.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
      if (result.length === 0) { setTables([]); return; }
      const tableNames = result[0].values.map(r => String(r[0]));
      const infos: TableInfo[] = tableNames.map(name => {
        const pragma = d.exec(`PRAGMA table_info(${name})`);
        const cols = pragma.length > 0 ? pragma[0].values.map(r => ({
          name: String(r[1]),
          type: String(r[2]),
          pk: r[5] === 1,
        })) : [];
        const countResult = d.exec(`SELECT COUNT(*) FROM ${name}`);
        const rowCount = countResult.length > 0 ? Number(countResult[0].values[0][0]) : 0;
        return { name, columns: cols, rowCount };
      });
      setTables(infos);
    } catch { /* ignore */ }
  };

  // Execute query
  const executeQuery = useCallback((sql?: string) => {
    const d = dbRef.current as { exec: (sql: string) => { columns: string[]; values: unknown[][] }[] } | null;
    if (!d) return;
    const q = (sql || query).trim();
    if (!q) return;

    const start = performance.now();
    try {
      const result = d.exec(q);
      const elapsed = performance.now() - start;

      if (result.length > 0) {
        setResults({
          columns: result[0].columns,
          rows: result[0].values,
          rowCount: result[0].values.length,
          executionTimeMs: elapsed,
          type: q.toUpperCase().startsWith("SELECT") ? "select" : "other",
        });
      } else {
        setResults({
          columns: [], rows: [], rowCount: 0,
          executionTimeMs: elapsed,
          type: q.toUpperCase().startsWith("SELECT") ? "select" : "other",
        });
      }
      setError(null);
      setHistory(prev => [{ query: q, timestamp: new Date().toISOString(), success: true, rowCount: result[0]?.values.length }, ...prev].slice(0, 50));
      saveDB();
      refreshTables();
    } catch (err) {
      const elapsed = performance.now() - start;
      setError(String(err));
      setResults(null);
      setHistory(prev => [{ query: q, timestamp: new Date().toISOString(), success: false, error: String(err) }, ...prev].slice(0, 50));
    }
  }, [query, saveDB]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      executeQuery();
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "#f9fafb", border: `1px solid ${T.border}`,
    borderRadius: 6, color: T.text, fontSize: 12, outline: "none",
    fontFamily: '"JetBrains Mono","Fira Code","Cascadia Code",monospace',
    resize: "vertical", padding: "8px 10px", boxSizing: "border-box",
  };

  return (
    <div style={{
      position: "fixed", top: 40, right: 0, bottom: 0, width: 480, maxWidth: "100%",
      background: T.surface, borderLeft: `1px solid ${T.border}`,
      display: "flex", flexDirection: "column", zIndex: 45,
      boxShadow: "-8px 0 32px rgba(0,0,0,0.12)",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 14px", borderBottom: `1px solid ${T.border}`, flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14 }}>{"\uD83D\uDDC3\uFE0F"}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>데이터베이스</span>
          {tables.length > 0 && (
            <span style={{
              fontSize: 9, fontWeight: 700, color: T.info,
              background: `${T.info}15`, padding: "2px 7px", borderRadius: 8,
            }}>{tables.length} tables</span>
          )}
        </div>
        <button onClick={onClose}
          style={{ background: "none", border: "none", color: T.muted, fontSize: 18, cursor: "pointer", padding: "2px 4px", lineHeight: 1 }}
        >{"\u2715"}</button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        {(["query", "tables", "history"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              flex: 1, padding: "7px 0", border: "none", fontSize: 11, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
              background: tab === t ? `${T.accent}10` : "transparent",
              color: tab === t ? T.accent : T.muted,
              borderBottom: tab === t ? `2px solid ${T.accent}` : "2px solid transparent",
            }}>
            {t === "query" ? "SQL 쿼리" : t === "tables" ? "테이블" : "히스토리"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>

        {loading && (
          <div style={{ textAlign: "center", padding: "40px 0", color: T.muted, fontSize: 12 }}>
            <div style={{ width: 16, height: 16, border: `2px solid ${T.border}`, borderTopColor: T.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 10px" }} />
            sql.js 로딩 중...
          </div>
        )}

        {/* Query tab */}
        {tab === "query" && !loading && (
          <>
            {/* Sample queries */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
              {SAMPLES.map((s, i) => (
                <button key={i} onClick={() => { setQuery(s.query); textareaRef.current?.focus(); }}
                  style={{
                    padding: "3px 8px", borderRadius: 5, border: `1px solid ${T.border}`,
                    background: "#f9fafb", color: T.muted, fontSize: 9, cursor: "pointer",
                    fontFamily: "inherit", transition: "all 0.1s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.color = T.accent; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}
                >{s.label}</button>
              ))}
            </div>

            <textarea
              ref={textareaRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="SELECT * FROM users;"
              rows={4}
              style={{ ...inputStyle, marginBottom: 8 }}
              onFocus={e => { e.currentTarget.style.borderColor = T.accent; }}
              onBlur={e => { e.currentTarget.style.borderColor = T.border; }}
            />

            <button onClick={() => executeQuery()} disabled={!db || !query.trim()}
              style={{
                width: "100%", padding: "8px 0", borderRadius: 8, border: "none",
                background: db && query.trim() ? `linear-gradient(135deg, ${T.accent}, ${T.accentB})` : "#e5e7eb",
                color: db && query.trim() ? "#fff" : T.muted,
                fontSize: 12, fontWeight: 700, cursor: db && query.trim() ? "pointer" : "not-allowed",
                fontFamily: "inherit", marginBottom: 12,
              }}>
              실행 (Ctrl+Enter)
            </button>

            {/* Error */}
            {error && (
              <div style={{
                padding: "8px 10px", borderRadius: 6, marginBottom: 10,
                background: `${T.red}08`, border: `1px solid ${T.red}25`, color: T.red, fontSize: 11,
                fontFamily: '"JetBrains Mono",monospace',
              }}>{error}</div>
            )}

            {/* Results table */}
            {results && results.columns.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: T.muted, marginBottom: 6 }}>
                  {results.rowCount} rows · {results.executionTimeMs.toFixed(1)}ms
                </div>
                <div style={{ overflowX: "auto", borderRadius: 6, border: `1px solid ${T.border}` }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                    <thead>
                      <tr>
                        {results.columns.map((col, i) => (
                          <th key={i} style={{
                            padding: "6px 10px", textAlign: "left", fontWeight: 700,
                            color: T.accent, background: "#f9fafb",
                            borderBottom: `1px solid ${T.border}`,
                            fontSize: 10, whiteSpace: "nowrap",
                          }}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.rows.slice(0, 100).map((row, ri) => (
                        <tr key={ri}>
                          {row.map((cell, ci) => (
                            <td key={ci} style={{
                              padding: "5px 10px",
                              borderBottom: `1px solid ${T.border}`,
                              color: cell === null ? T.muted : T.text,
                              fontFamily: '"JetBrains Mono",monospace',
                              fontSize: 11, whiteSpace: "nowrap", maxWidth: 200,
                              overflow: "hidden", textOverflow: "ellipsis",
                            }}>
                              {cell === null ? "NULL" : String(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {results.rowCount > 100 && (
                  <div style={{ fontSize: 10, color: T.muted, marginTop: 4, textAlign: "center" }}>
                    처음 100행만 표시 (총 {results.rowCount}행)
                  </div>
                )}
              </div>
            )}

            {results && results.columns.length === 0 && !error && (
              <div style={{
                padding: "8px 10px", borderRadius: 6, marginBottom: 10,
                background: `${T.green}08`, border: `1px solid ${T.green}25`,
                color: T.green, fontSize: 11,
              }}>
                쿼리 실행 완료 ({results.executionTimeMs.toFixed(1)}ms)
              </div>
            )}
          </>
        )}

        {/* Tables tab */}
        {tab === "tables" && !loading && (
          <>
            {tables.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px 0", color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
                테이블이 없습니다.<br />
                SQL 쿼리 탭에서 CREATE TABLE을 실행하세요.
              </div>
            ) : (
              tables.map(table => (
                <div key={table.name} style={{ marginBottom: 8 }}>
                  <button onClick={() => setSelectedTable(selectedTable === table.name ? null : table.name)}
                    style={{
                      width: "100%", padding: "8px 12px", borderRadius: 8,
                      border: `1px solid ${selectedTable === table.name ? T.borderHi : T.border}`,
                      background: selectedTable === table.name ? `${T.accent}08` : "#f9fafb",
                      cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                      fontFamily: "inherit", textAlign: "left",
                    }}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke={selectedTable === table.name ? T.accent : T.muted} strokeWidth="1.5" strokeLinecap="round">
                      <rect x="1" y="3" width="14" height="10" rx="1.5" />
                      <path d="M1 7h14M1 11h14M6 3v10" />
                    </svg>
                    <span style={{ flex: 1, fontWeight: 600, fontSize: 12, color: T.text }}>{table.name}</span>
                    <span style={{ fontSize: 10, color: T.muted }}>{table.rowCount} rows</span>
                    <span style={{ fontSize: 10, color: T.muted }}>{table.columns.length} cols</span>
                  </button>
                  {selectedTable === table.name && (
                    <div style={{ padding: "8px 12px", borderLeft: `2px solid ${T.accent}`, marginLeft: 16 }}>
                      {table.columns.map((col, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0", fontSize: 11 }}>
                          <span style={{ fontWeight: 600, color: col.pk ? T.accent : T.text, minWidth: 80 }}>{col.name}</span>
                          <span style={{ color: T.muted, fontSize: 10 }}>{col.type}</span>
                          {col.pk && <span style={{ fontSize: 8, padding: "1px 4px", borderRadius: 3, background: `${T.accent}15`, color: T.accent, fontWeight: 700 }}>PK</span>}
                        </div>
                      ))}
                      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                        <button onClick={() => { setQuery(`SELECT * FROM ${table.name} LIMIT 100;`); setTab("query"); executeQuery(`SELECT * FROM ${table.name} LIMIT 100;`); }}
                          style={{
                            padding: "4px 10px", borderRadius: 5, border: `1px solid ${T.border}`,
                            background: "#f3f4f6", color: T.accent, fontSize: 10, cursor: "pointer", fontFamily: "inherit",
                          }}>조회</button>
                        <button onClick={() => {
                          if (confirm(`${table.name} 테이블을 삭제하시겠습니까?`)) {
                            executeQuery(`DROP TABLE ${table.name};`);
                            setSelectedTable(null);
                          }
                        }}
                          style={{
                            padding: "4px 10px", borderRadius: 5, border: `1px solid ${T.border}`,
                            background: "#f3f4f6", color: T.red, fontSize: 10, cursor: "pointer", fontFamily: "inherit",
                          }}>삭제</button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </>
        )}

        {/* History tab */}
        {tab === "history" && (
          <>
            {history.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px 0", color: T.muted, fontSize: 12 }}>
                쿼리 기록이 없습니다.
              </div>
            ) : (
              history.map((h, i) => (
                <div key={i}
                  onClick={() => { setQuery(h.query); setTab("query"); }}
                  style={{
                    padding: "8px 10px", borderBottom: `1px solid ${T.border}`,
                    cursor: "pointer", transition: "background 0.1s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#f9fafb"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: h.success ? T.green : T.red, flexShrink: 0,
                    }} />
                    <span style={{ fontSize: 9, color: T.muted }}>
                      {new Date(h.timestamp).toLocaleTimeString("ko-KR")}
                    </span>
                    {h.success && h.rowCount !== undefined && (
                      <span style={{ fontSize: 9, color: T.muted }}>{h.rowCount} rows</span>
                    )}
                  </div>
                  <code style={{
                    fontSize: 10, color: h.success ? T.text : T.red,
                    fontFamily: '"JetBrains Mono",monospace',
                    display: "block", overflow: "hidden", textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>{h.query}</code>
                  {h.error && (
                    <div style={{ fontSize: 9, color: T.red, marginTop: 2 }}>{h.error}</div>
                  )}
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* Footer: Reset button */}
      <div style={{ padding: "8px 14px", borderTop: `1px solid ${T.border}`, flexShrink: 0, display: "flex", gap: 6 }}>
        <button onClick={() => {
          const d = dbRef.current as { exec: (sql: string) => void } | null;
          if (!d) return;
          // Export as SQL
          try {
            const result = (d as { exec: (sql: string) => { values: unknown[][] }[] }).exec(
              "SELECT sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
            );
            if (result.length > 0) {
              const sql = result[0].values.map(r => String(r[0]) + ";").join("\n\n");
              const blob = new Blob([sql], { type: "text/sql" });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = `${projectId}_db.sql`;
              a.click();
              showToast("SQL 내보내기 완료");
            }
          } catch (err) {
            showToast(`내보내기 실패: ${String(err)}`);
          }
        }}
          style={{
            flex: 1, padding: "7px 0", borderRadius: 6, border: `1px solid ${T.border}`,
            background: "#f3f4f6", color: T.muted, fontSize: 11, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
          }}>
          SQL 내보내기
        </button>
        <button onClick={() => {
          if (!confirm("모든 테이블을 삭제하시겠습니까?")) return;
          const d = dbRef.current as { exec: (sql: string) => { values: unknown[][] }[] } | null;
          if (!d) return;
          try {
            const result = d.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
            if (result.length > 0) {
              for (const row of result[0].values) {
                d.exec(`DROP TABLE IF EXISTS ${row[0]}`);
              }
            }
            refreshTables();
            setResults(null);
            saveDB();
            showToast("데이터베이스 초기화됨");
          } catch (err) {
            showToast(`초기화 실패: ${String(err)}`);
          }
        }}
          style={{
            padding: "7px 14px", borderRadius: 6, border: `1px solid ${T.border}`,
            background: "#f3f4f6", color: T.red, fontSize: 11, fontWeight: 600,
            cursor: "pointer", fontFamily: "inherit",
          }}>
          초기화
        </button>
      </div>
    </div>
  );
}
