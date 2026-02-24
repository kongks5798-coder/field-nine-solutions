"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { T } from "./workspace.constants";
import { usePackageStore } from "./stores";
import { formatSize } from "./package/npmRegistry";

type PkgTab = "installed" | "search" | "popular";

const POPULAR_PACKAGES = [
  { name: "react",       description: "UI 라이브러리" },
  { name: "lodash",      description: "유틸리티 함수" },
  { name: "axios",       description: "HTTP 클라이언트" },
  { name: "dayjs",       description: "날짜 처리" },
  { name: "zod",         description: "스키마 검증" },
  { name: "zustand",     description: "상태 관리" },
  { name: "three",       description: "3D 그래픽" },
  { name: "chart.js",    description: "차트 라이브러리" },
  { name: "d3",          description: "데이터 시각화" },
  { name: "framer-motion", description: "애니메이션" },
  { name: "tailwindcss", description: "유틸리티 CSS" },
  { name: "gsap",        description: "고급 애니메이션" },
];

export function PackagePanel() {
  const [tab, setTab] = useState<PkgTab>("installed");
  const packages = usePackageStore((s) => s.packages);
  const installStatus = usePackageStore((s) => s.installStatus);
  const installError = usePackageStore((s) => s.installError);
  const searchQuery = usePackageStore((s) => s.searchQuery);
  const searchResults = usePackageStore((s) => s.searchResults);
  const searchLoading = usePackageStore((s) => s.searchLoading);
  const depGraphExpanded = usePackageStore((s) => s.depGraphExpanded);
  const setSearchQuery = usePackageStore((s) => s.setSearchQuery);
  const setDepGraphExpanded = usePackageStore((s) => s.setDepGraphExpanded);
  const installPackage = usePackageStore((s) => s.installPackage);
  const uninstallPackage = usePackageStore((s) => s.uninstallPackage);
  const searchNpm = usePackageStore((s) => s.searchNpm);

  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const q = e.target.value;
      setSearchQuery(q);
      clearTimeout(searchTimer.current);
      searchTimer.current = setTimeout(() => searchNpm(q), 400);
    },
    [setSearchQuery, searchNpm],
  );

  const handleInstall = useCallback(
    (name: string) => {
      installPackage(name);
    },
    [installPackage],
  );

  useEffect(() => {
    return () => clearTimeout(searchTimer.current);
  }, []);

  const isInstalled = (name: string) => packages.some((p) => p.name === name);
  const installing = installStatus === "resolving" || installStatus === "installing";

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        {(
          [
            ["installed", `설치됨 (${packages.length})`],
            ["search", "검색"],
            ["popular", "인기"],
          ] as [PkgTab, string][]
        ).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: "8px 4px",
              fontSize: 11,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              background: "transparent",
              color: tab === t ? T.accent : T.muted,
              borderBottom: tab === t ? `2px solid ${T.accent}` : "2px solid transparent",
              transition: "all 0.12s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Status bar */}
      {installing && (
        <div
          style={{
            padding: "6px 10px",
            fontSize: 11,
            color: T.accent,
            background: `${T.accent}10`,
            borderBottom: `1px solid ${T.border}`,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⏳</span>
          {installStatus === "resolving" ? "패키지 확인 중..." : "설치 중..."}
        </div>
      )}
      {installError && (
        <div
          style={{
            padding: "6px 10px",
            fontSize: 11,
            color: T.red,
            background: `${T.red}10`,
            borderBottom: `1px solid ${T.border}`,
          }}
        >
          {installError}
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0" }}>
        {tab === "installed" && (
          <InstalledList
            packages={packages}
            depGraphExpanded={depGraphExpanded}
            onToggleGraph={() => setDepGraphExpanded(!depGraphExpanded)}
            onUninstall={uninstallPackage}
          />
        )}
        {tab === "search" && (
          <SearchTab
            query={searchQuery}
            results={searchResults}
            loading={searchLoading}
            installing={installing}
            isInstalled={isInstalled}
            onSearch={handleSearch}
            onInstall={handleInstall}
          />
        )}
        {tab === "popular" && (
          <PopularTab
            installing={installing}
            isInstalled={isInstalled}
            onInstall={handleInstall}
          />
        )}
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function InstalledList({
  packages,
  depGraphExpanded,
  onToggleGraph,
  onUninstall,
}: {
  packages: { name: string; version: string; type: string; size: number; dependencies: string[] }[];
  depGraphExpanded: boolean;
  onToggleGraph: () => void;
  onUninstall: (name: string) => void;
}) {
  if (packages.length === 0) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: T.muted, fontSize: 12 }}>
        설치된 패키지가 없습니다.
        <br />
        <span style={{ fontSize: 11, opacity: 0.7 }}>검색 탭에서 패키지를 설치해보세요.</span>
      </div>
    );
  }

  return (
    <>
      {packages.map((pkg) => (
        <div
          key={pkg.name}
          style={{
            padding: "8px 12px",
            borderBottom: `1px solid ${T.border}`,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {pkg.name}
            </div>
            <div style={{ fontSize: 10, color: T.muted, display: "flex", gap: 8, marginTop: 2 }}>
              <span>{pkg.version}</span>
              <span
                style={{
                  background: pkg.type === "devDep" ? `${T.info}20` : `${T.green}20`,
                  color: pkg.type === "devDep" ? T.info : T.green,
                  padding: "0 4px",
                  borderRadius: 3,
                  fontSize: 9,
                }}
              >
                {pkg.type === "devDep" ? "dev" : "dep"}
              </span>
              {pkg.size > 0 && <span>{formatSize(pkg.size)}</span>}
            </div>
          </div>
          <button
            onClick={() => onUninstall(pkg.name)}
            title="삭제"
            style={{
              background: "transparent",
              border: "none",
              color: T.muted,
              cursor: "pointer",
              fontSize: 13,
              padding: "2px 4px",
              borderRadius: 4,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = T.red; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = T.muted; }}
          >
            ✕
          </button>
        </div>
      ))}

      {/* Dependency Graph Toggle */}
      <button
        onClick={onToggleGraph}
        style={{
          width: "100%",
          padding: "8px 12px",
          background: "transparent",
          border: "none",
          borderBottom: `1px solid ${T.border}`,
          color: T.muted,
          fontSize: 11,
          cursor: "pointer",
          textAlign: "left",
          fontFamily: "inherit",
        }}
      >
        {depGraphExpanded ? "▾" : "▸"} 의존성 트리
      </button>

      {depGraphExpanded && (
        <div style={{ padding: "8px 12px", fontSize: 11, color: T.muted, fontFamily: "monospace" }}>
          {packages.map((pkg) => (
            <div key={pkg.name} style={{ marginBottom: 4 }}>
              <span style={{ color: T.text }}>{pkg.name}</span>
              <span style={{ color: T.muted }}> @{pkg.version}</span>
              {pkg.dependencies.length > 0 && (
                <div style={{ paddingLeft: 16, color: T.muted }}>
                  {pkg.dependencies.slice(0, 5).map((d) => (
                    <div key={d}>└─ {d}</div>
                  ))}
                  {pkg.dependencies.length > 5 && (
                    <div>└─ ... +{pkg.dependencies.length - 5} more</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function SearchTab({
  query,
  results,
  loading,
  installing,
  isInstalled,
  onSearch,
  onInstall,
}: {
  query: string;
  results: { name: string; version: string; description: string }[];
  loading: boolean;
  installing: boolean;
  isInstalled: (name: string) => boolean;
  onSearch: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onInstall: (name: string) => void;
}) {
  return (
    <>
      <div style={{ padding: "8px 10px", borderBottom: `1px solid ${T.border}` }}>
        <input
          type="text"
          value={query}
          onChange={onSearch}
          placeholder="npm 패키지 검색..."
          style={{
            width: "100%",
            padding: "7px 10px",
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 6,
            color: T.text,
            fontSize: 12,
            outline: "none",
            fontFamily: "inherit",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = T.accent; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = T.border; }}
        />
      </div>

      {loading && (
        <div style={{ padding: 16, textAlign: "center", color: T.muted, fontSize: 11 }}>
          검색 중...
        </div>
      )}

      {!loading && results.length === 0 && query.trim() && (
        <div style={{ padding: 16, textAlign: "center", color: T.muted, fontSize: 11 }}>
          결과 없음
        </div>
      )}

      {results.map((r) => {
        const installed = isInstalled(r.name);
        return (
          <div
            key={r.name}
            style={{
              padding: "8px 12px",
              borderBottom: `1px solid ${T.border}`,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {r.name} <span style={{ fontWeight: 400, color: T.muted, fontSize: 10 }}>{r.version}</span>
              </div>
              <div style={{ fontSize: 10, color: T.muted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {r.description}
              </div>
            </div>
            <button
              onClick={() => onInstall(r.name)}
              disabled={installed || installing}
              style={{
                padding: "4px 10px",
                fontSize: 10,
                fontWeight: 600,
                borderRadius: 4,
                border: "none",
                cursor: installed || installing ? "default" : "pointer",
                background: installed ? T.green : T.accent,
                color: "#fff",
                opacity: installed || installing ? 0.5 : 1,
                fontFamily: "inherit",
                transition: "opacity 0.12s",
              }}
            >
              {installed ? "✓" : "설치"}
            </button>
          </div>
        );
      })}
    </>
  );
}

function PopularTab({
  installing,
  isInstalled,
  onInstall,
}: {
  installing: boolean;
  isInstalled: (name: string) => boolean;
  onInstall: (name: string) => void;
}) {
  return (
    <div style={{ padding: "4px 0" }}>
      <div style={{ padding: "8px 12px", fontSize: 11, color: T.muted, fontWeight: 600 }}>
        인기 패키지
      </div>
      {POPULAR_PACKAGES.map((pkg) => {
        const installed = isInstalled(pkg.name);
        return (
          <div
            key={pkg.name}
            style={{
              padding: "7px 12px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              borderBottom: `1px solid ${T.border}`,
            }}
          >
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{pkg.name}</span>
              <span style={{ fontSize: 10, color: T.muted, marginLeft: 8 }}>{pkg.description}</span>
            </div>
            <button
              onClick={() => onInstall(pkg.name)}
              disabled={installed || installing}
              style={{
                padding: "4px 10px",
                fontSize: 10,
                fontWeight: 600,
                borderRadius: 4,
                border: "none",
                cursor: installed || installing ? "default" : "pointer",
                background: installed ? T.green : T.accent,
                color: "#fff",
                opacity: installed || installing ? 0.5 : 1,
                fontFamily: "inherit",
              }}
            >
              {installed ? "✓" : "설치"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
