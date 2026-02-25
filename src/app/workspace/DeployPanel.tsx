"use client";

import React, { useEffect, useRef } from "react";
import { T } from "./workspace.constants";
import { useDeployStore } from "./stores";
import { getFrameworkLabel, getFrameworkColor } from "./deploy/frameworkDetector";

export function DeployPanel() {
  const config = useDeployStore((s) => s.deployConfig);
  const status = useDeployStore((s) => s.deployStatus);
  const error = useDeployStore((s) => s.deployError);
  const history = useDeployStore((s) => s.deployHistory);
  const buildLogs = useDeployStore((s) => s.buildLogs);
  const previewUrl = useDeployStore((s) => s.previewUrl);
  const showDeployPanel = useDeployStore((s) => s.showDeployPanel);
  const showBuildLogs = useDeployStore((s) => s.showBuildLogs);

  const vercelToken = useDeployStore((s) => s.vercelToken);
  const netlifyToken = useDeployStore((s) => s.netlifyToken);

  const setShowDeployPanel = useDeployStore((s) => s.setShowDeployPanel);
  const setShowBuildLogs = useDeployStore((s) => s.setShowBuildLogs);
  const setDeployConfig = useDeployStore((s) => s.setDeployConfig);
  const detectFramework = useDeployStore((s) => s.detectFramework);
  const startDeploy = useDeployStore((s) => s.startDeploy);
  const setVercelToken = useDeployStore((s) => s.setVercelToken);
  const setNetlifyToken = useDeployStore((s) => s.setNetlifyToken);

  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showDeployPanel) detectFramework();
  }, [showDeployPanel, detectFramework]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [buildLogs.length]);

  if (!showDeployPanel) return null;

  const isDeploying = status === "detecting" || status === "building" || status === "uploading";
  const fwLabel = getFrameworkLabel(config.framework);
  const fwColor = getFrameworkColor(config.framework);

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: 380,
        height: "100%",
        background: T.panel,
        borderLeft: `1px solid ${T.borderHi}`,
        zIndex: 80,
        display: "flex",
        flexDirection: "column",
        boxShadow: "-8px 0 40px rgba(0,0,0,0.5)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          borderBottom: `1px solid ${T.border}`,
          background: T.topbar,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 13, color: T.text }}>
          🚀 배포
        </span>
        <button
          onClick={() => setShowDeployPanel(false)}
          style={{
            background: "none",
            border: "none",
            color: T.muted,
            cursor: "pointer",
            fontSize: 16,
          }}
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>
        {/* Framework badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 16,
            padding: "8px 12px",
            background: `${fwColor}10`,
            border: `1px solid ${fwColor}30`,
            borderRadius: 8,
          }}
        >
          <span style={{ color: fwColor, fontWeight: 700, fontSize: 12 }}>
            {fwLabel}
          </span>
          <span style={{ fontSize: 11, color: T.muted }}>감지됨</span>
        </div>

        {/* Deploy target */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, color: T.muted, fontWeight: 600, display: "block", marginBottom: 6 }}>
            배포 대상
          </label>
          <div style={{ display: "flex", gap: 6 }}>
            {(["simulated", "vercel", "netlify"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setDeployConfig({ target: t })}
                style={{
                  flex: 1,
                  padding: "6px 0",
                  fontSize: 10,
                  fontWeight: 600,
                  borderRadius: 6,
                  border: `1px solid ${config.target === t ? T.accent : T.border}`,
                  background: config.target === t ? `${T.accent}15` : "transparent",
                  color: config.target === t ? T.accent : T.muted,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textTransform: "capitalize",
                }}
              >
                {t === "simulated" ? "시뮬" : t}
              </button>
            ))}
          </div>
        </div>

        {/* API Token input — shown for Vercel and Netlify targets */}
        {(config.target === "vercel" || config.target === "netlify") && (
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 11, color: T.muted, fontWeight: 600, display: "block", marginBottom: 6 }}>
              {config.target === "vercel" ? "Vercel" : "Netlify"} API 토큰
            </label>
            <input
              type="password"
              value={config.target === "vercel" ? vercelToken : netlifyToken}
              onChange={(e) =>
                config.target === "vercel"
                  ? setVercelToken(e.target.value)
                  : setNetlifyToken(e.target.value)
              }
              placeholder={`${config.target === "vercel" ? "Vercel" : "Netlify"} API token`}
              style={{
                width: "100%",
                padding: "7px 10px",
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: 6,
                color: T.text,
                fontSize: 12,
                outline: "none",
                fontFamily: '"JetBrains Mono", monospace',
              }}
            />
            <div style={{ fontSize: 9, color: T.muted, marginTop: 4 }}>
              {config.target === "vercel"
                ? "Vercel > Settings > Tokens 에서 생성"
                : "Netlify > User settings > Applications > Personal access tokens 에서 생성"}
            </div>
          </div>
        )}

        {/* Build command */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, color: T.muted, fontWeight: 600, display: "block", marginBottom: 6 }}>
            빌드 명령어
          </label>
          <input
            value={config.buildCommand}
            onChange={(e) => setDeployConfig({ buildCommand: e.target.value })}
            placeholder="npm run build"
            style={{
              width: "100%",
              padding: "7px 10px",
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: 6,
              color: T.text,
              fontSize: 12,
              outline: "none",
              fontFamily: '"JetBrains Mono", monospace',
            }}
          />
        </div>

        {/* Output dir */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 11, color: T.muted, fontWeight: 600, display: "block", marginBottom: 6 }}>
            출력 디렉토리
          </label>
          <input
            value={config.outputDir}
            onChange={(e) => setDeployConfig({ outputDir: e.target.value })}
            placeholder="dist"
            style={{
              width: "100%",
              padding: "7px 10px",
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: 6,
              color: T.text,
              fontSize: 12,
              outline: "none",
              fontFamily: '"JetBrains Mono", monospace',
            }}
          />
        </div>

        {/* Deploy button */}
        <button
          onClick={() => startDeploy()}
          disabled={isDeploying}
          style={{
            width: "100%",
            padding: "11px 0",
            background: isDeploying
              ? T.muted
              : "linear-gradient(135deg, #f97316, #f43f5e)",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            cursor: isDeploying ? "default" : "pointer",
            fontFamily: "inherit",
            boxShadow: isDeploying ? "none" : "0 4px 20px rgba(249,115,22,0.35)",
            transition: "all 0.15s",
            marginBottom: 14,
          }}
        >
          {status === "detecting"
            ? "프레임워크 감지 중..."
            : status === "building"
              ? "빌드 중..."
              : status === "uploading"
                ? "업로드 중..."
                : status === "deployed"
                  ? "✓ 배포 완료!"
                  : "배포 시작"}
        </button>

        {/* Error */}
        {error && (
          <div
            style={{
              padding: "8px 12px",
              background: `${T.red}10`,
              border: `1px solid ${T.red}30`,
              borderRadius: 8,
              color: T.red,
              fontSize: 11,
              marginBottom: 14,
            }}
          >
            {error}
          </div>
        )}

        {/* Preview URL */}
        {previewUrl && status === "deployed" && (
          <div
            style={{
              padding: "8px 12px",
              background: `${T.green}10`,
              border: `1px solid ${T.green}30`,
              borderRadius: 8,
              marginBottom: 14,
            }}
          >
            <div style={{ fontSize: 11, color: T.green, fontWeight: 600, marginBottom: 4 }}>
              배포 URL
            </div>
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 11,
                color: T.info,
                wordBreak: "break-all",
                textDecoration: "underline",
              }}
            >
              {previewUrl.length > 80 ? previewUrl.slice(0, 80) + "..." : previewUrl}
            </a>
          </div>
        )}

        {/* Build logs toggle */}
        <button
          onClick={() => setShowBuildLogs(!showBuildLogs)}
          style={{
            width: "100%",
            padding: "7px 12px",
            background: "transparent",
            border: `1px solid ${T.border}`,
            borderRadius: 6,
            color: T.muted,
            fontSize: 11,
            cursor: "pointer",
            textAlign: "left",
            fontFamily: "inherit",
            marginBottom: 10,
          }}
        >
          {showBuildLogs ? "▾" : "▸"} 빌드 로그 ({buildLogs.length} lines)
        </button>

        {/* Build logs */}
        {showBuildLogs && buildLogs.length > 0 && (
          <div
            style={{
              background: "#010104",
              borderRadius: 8,
              padding: "8px 10px",
              maxHeight: 200,
              overflowY: "auto",
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 10,
              lineHeight: 1.6,
              color: T.text,
              border: `1px solid ${T.border}`,
              marginBottom: 14,
            }}
          >
            {buildLogs.map((line, i) => (
              <div key={i} dangerouslySetInnerHTML={{ __html: ansiToHtml(line) }} />
            ))}
            <div ref={logEndRef} />
          </div>
        )}

        {/* Deploy History */}
        {history.length > 0 && (
          <>
            <div
              style={{
                fontSize: 11,
                color: T.muted,
                fontWeight: 600,
                marginBottom: 8,
                marginTop: 4,
              }}
            >
              배포 이력
            </div>
            {history.slice(0, 5).map((r) => (
              <div
                key={r.id}
                style={{
                  padding: "7px 10px",
                  borderBottom: `1px solid ${T.border}`,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: r.status === "success" ? T.green : T.red,
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: T.text, fontWeight: 600 }}>
                    {r.target}
                  </div>
                  <div style={{ fontSize: 9, color: T.muted }}>
                    {new Date(r.timestamp).toLocaleString("ko-KR")} · {r.buildDurationMs}ms
                    {r.commitId && ` · ${r.commitId.slice(0, 7)}`}
                  </div>
                </div>
                {r.url && (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 10, color: T.info }}
                  >
                    열기
                  </a>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

/** Simple ANSI → HTML color converter for build logs */
function ansiToHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\x1b\[32m/g, '<span style="color:#22c55e">')
    .replace(/\x1b\[31m/g, '<span style="color:#f87171">')
    .replace(/\x1b\[33m/g, '<span style="color:#fb923c">')
    .replace(/\x1b\[36m/g, '<span style="color:#67e8f9">')
    .replace(/\x1b\[38;5;208m/g, '<span style="color:#f97316">')
    .replace(/\x1b\[1m/g, '<span style="font-weight:700">')
    .replace(/\x1b\[2m/g, '<span style="opacity:0.5">')
    .replace(/\x1b\[0m/g, "</span>");
}
