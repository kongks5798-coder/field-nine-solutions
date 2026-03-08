"use client";
import { SandpackProvider, SandpackPreview, SandpackConsole, useSandpack } from "@codesandbox/sandpack-react";
import type { SandpackFiles } from "@codesandbox/sandpack-react";
import type { FilesMap } from "./workspace.constants";
import { useEffect } from "react";

interface Props {
  files: FilesMap;
  theme: "light" | "dark";
  onLog?: (level: string, msg: string) => void;
  showConsole?: boolean;
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

export function SandpackPreviewPane({ files, theme, showConsole }: Props) {
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
