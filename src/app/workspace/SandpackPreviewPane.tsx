"use client";
import { SandpackProvider, SandpackPreview, SandpackConsole, useSandpack } from "@codesandbox/sandpack-react";
import type { SandpackFiles } from "@codesandbox/sandpack-react";
import type { FilesMap } from "./workspace.constants";
import { useEffect, useCallback, useState } from "react";

interface Props {
  files: FilesMap;
  theme: "light" | "dark";
  onLog?: (level: string, msg: string) => void;
  onError?: (msg: string) => void;
  showConsole?: boolean;
}

function ErrorDetector({ onError, onCompileError }: { onError?: (msg: string) => void; onCompileError?: (msg: string) => void }) {
  const { sandpack } = useSandpack();
  const stableOnError = useCallback((msg: string) => onError?.(msg), [onError]);
  const stableOnCompileError = useCallback((msg: string) => onCompileError?.(msg), [onCompileError]);

  useEffect(() => {
    if (sandpack.status === "timeout") {
      stableOnError("실행 시간 초과: 무한루프나 성능 문제가 있을 수 있습니다.");
      stableOnCompileError("실행 시간 초과: 무한루프나 성능 문제가 있을 수 있습니다.");
    }
  }, [sandpack.status, stableOnError, stableOnCompileError]);

  // Expose Sandpack's bundler errors (compilation errors)
  useEffect(() => {
    const err = sandpack.error;
    if (err) {
      const msg = typeof err === "object" && "message" in err ? String((err as { message: string }).message) : String(err);
      stableOnCompileError(msg);
    }
  }, [sandpack.error, stableOnCompileError]);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const d = e.data;
      if (!d || typeof d !== "object") return;
      // Sandpack runtime errors come as type="console" with level="error"
      if (d.type === "console" && d.level === "error" && d.log?.[0]) {
        stableOnError(String(d.log[0]));
        stableOnCompileError(String(d.log[0]));
      }
      // Also catch sandpack error events
      if (d.type === "action" && d.action === "show-error" && d.message) {
        stableOnError(d.message);
        stableOnCompileError(d.message);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [stableOnError, stableOnCompileError]);

  return null;
}

function FilesSync({ files }: { files: FilesMap }) {
  const { sandpack } = useSandpack();
  useEffect(() => {
    const sp: SandpackFiles = {};
    for (const [name, file] of Object.entries(files)) {
      sp[`/${name}`] = { code: file.content, readOnly: false };
    }
    sandpack.updateFile(sp);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);
  return null;
}

export function SandpackPreviewPane({ files, theme, showConsole, onError }: Props) {
  const [compileError, setCompileError] = useState<string | null>(null);

  const sp: SandpackFiles = {};
  for (const [name, file] of Object.entries(files)) {
    sp[`/${name}`] = { code: file.content };
  }

  // Clear error when files change (user is editing)
  useEffect(() => {
    setCompileError(null);
  }, [files]);

  // Detect template
  const allContent = Object.values(files).map(f => f.content).join("\n");
  const hasReact = /import\s+React|from\s+['"]react['"]|ReactDOM|createRoot/.test(allContent);
  const hasVue = /from\s+['"]vue['"]|createApp/.test(allContent);

  const template = hasReact ? "react" : hasVue ? "vue" : "vanilla";

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", position: "relative" }}>
      {/* Error overlay banner */}
      {compileError && (
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: "rgba(239,68,68,0.97)",
          color: "#fff",
          padding: "10px 14px",
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          fontSize: 13,
          lineHeight: 1.5,
          borderBottom: "2px solid #b91c1c",
        }}>
          <span style={{ flex: 1, whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "monospace" }}>
            {compileError}
          </span>
          <button
            onClick={() => setCompileError(null)}
            style={{
              background: "transparent",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              fontSize: 18,
              lineHeight: 1,
              padding: "0 4px",
              flexShrink: 0,
            }}
            aria-label="오류 닫기"
          >
            ×
          </button>
        </div>
      )}

      <SandpackProvider
        files={sp}
        template={template}
        theme={theme === "dark" ? "dark" : "light"}
        options={{
          recompileMode: "delayed",
          recompileDelay: 500,
          externalResources: [],
        }}
      >
        <FilesSync files={files} />
        <ErrorDetector onError={onError} onCompileError={setCompileError} />
        <SandpackPreview
          style={{ flex: 1, height: showConsole ? "calc(100% - 180px)" : "100%" }}
          showOpenInCodeSandbox={false}
          showRefreshButton
          showNavigator={false}
        />
        {showConsole && (
          <SandpackConsole style={{ height: 180, borderTop: "1px solid #e5e7eb" }} />
        )}
      </SandpackProvider>
    </div>
  );
}
