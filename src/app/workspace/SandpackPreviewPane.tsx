"use client";
import { SandpackProvider, SandpackPreview, SandpackConsole, useSandpack } from "@codesandbox/sandpack-react";
import type { SandpackFiles } from "@codesandbox/sandpack-react";
import type { FilesMap } from "./workspace.constants";
import { useEffect, useCallback } from "react";

interface Props {
  files: FilesMap;
  theme: "light" | "dark";
  onLog?: (level: string, msg: string) => void;
  onError?: (msg: string) => void;
  showConsole?: boolean;
}

function ErrorDetector({ onError }: { onError?: (msg: string) => void }) {
  const { sandpack } = useSandpack();
  const stableOnError = useCallback((msg: string) => onError?.(msg), [onError]);

  useEffect(() => {
    if (sandpack.status === "timeout") {
      stableOnError("실행 시간 초과: 무한루프나 성능 문제가 있을 수 있습니다.");
    }
  }, [sandpack.status, stableOnError]);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      const d = e.data;
      if (!d || typeof d !== "object") return;
      // Sandpack runtime errors come as type="console" with level="error"
      if (d.type === "console" && d.level === "error" && d.log?.[0]) {
        stableOnError(String(d.log[0]));
      }
      // Also catch sandpack error events
      if (d.type === "action" && d.action === "show-error" && d.message) {
        stableOnError(d.message);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [stableOnError]);

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
  const sp: SandpackFiles = {};
  for (const [name, file] of Object.entries(files)) {
    sp[`/${name}`] = { code: file.content };
  }

  // Detect template
  const allContent = Object.values(files).map(f => f.content).join("\n");
  const hasReact = /import\s+React|from\s+['"]react['"]|ReactDOM|createRoot/.test(allContent);
  const hasVue = /from\s+['"]vue['"]|createApp/.test(allContent);

  const template = hasReact ? "react" : hasVue ? "vue" : "vanilla";

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
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
        <ErrorDetector onError={onError} />
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
