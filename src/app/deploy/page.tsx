"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";

type DeployStatus =
  | "idle"
  | "loading_project"
  | "ready"
  | "deploying"
  | "polling"
  | "success"
  | "error";

interface ProjectData {
  name: string;
  files: Record<string, { content: string }>;
}

interface DeployResponse {
  error?: string;
  url?: string;
  deploymentId?: string;
}

interface StatusResponse {
  readyState?: string;
  state?: string;
  url?: string;
}

function DeployContent() {
  const params = useSearchParams();
  const projectId = params.get("projectId") ?? "";
  const [status, setStatus] = useState<DeployStatus>("idle");
  const [project, setProject] = useState<ProjectData | null>(null);
  const [platform, setPlatform] = useState<"vercel" | "netlify">("vercel");
  const [deployUrl, setDeployUrl] = useState("");
  const [deploymentId, setDeploymentId] = useState("");
  const [error, setError] = useState("");
  const [pollCount, setPollCount] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load project on mount
  useEffect(() => {
    if (!projectId) {
      setStatus("idle");
      return;
    }
    setStatus("loading_project");
    fetch(`/api/projects/${projectId}`)
      .then((r) => r.json())
      .then((data: { error?: string; project?: { name: string; files: Record<string, { content: string }> } }) => {
        if (data.error) throw new Error(data.error);
        // API returns { project: { name, files, ... } }
        const proj = data.project;
        if (!proj) throw new Error("프로젝트를 찾을 수 없습니다");
        setProject({ name: proj.name, files: proj.files ?? {} });
        setStatus("ready");
      })
      .catch((e: Error) => {
        setError(e.message);
        setStatus("error");
      });
  }, [projectId]);

  // Poll deployment status
  useEffect(() => {
    if (status !== "polling" || !deploymentId) return;

    pollRef.current = setInterval(() => {
      setPollCount((c) => c + 1);
      fetch(`/api/deploy/vercel?id=${deploymentId}`)
        .then((res) => res.json())
        .then((data: StatusResponse) => {
          if (data.readyState === "READY" || data.state === "READY") {
            if (pollRef.current) clearInterval(pollRef.current);
            if (data.url) setDeployUrl(data.url);
            setStatus("success");
          }
        })
        .catch(() => {
          // silently retry
        });
    }, 3000);

    // Timeout after 5 minutes — assume success
    const timeout = setTimeout(() => {
      if (pollRef.current) clearInterval(pollRef.current);
      setStatus("success");
    }, 300000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      clearTimeout(timeout);
    };
  }, [status, deploymentId]);

  const deploy = async () => {
    if (!project) return;
    setStatus("deploying");
    setError("");
    try {
      const files: Record<string, string> = {};
      for (const [name, f] of Object.entries(project.files)) {
        files[name] = f.content;
      }
      const res = await fetch(`/api/deploy/${platform}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: project.name,
          files,
          projectId,
        }),
      });
      const data = (await res.json()) as DeployResponse;
      if (!res.ok) throw new Error(data.error ?? "배포 실패");
      setDeployUrl(data.url ?? "");
      setDeploymentId(data.deploymentId ?? "");
      setStatus("polling");
    } catch (e) {
      setError((e as Error).message);
      setStatus("error");
    }
  };

  const card: React.CSSProperties = {
    background: "#161b22",
    border: "1px solid #30363d",
    borderRadius: 12,
    padding: 24,
  };

  // ── No projectId ──────────────────────────────────────────────────────────
  if (!projectId) {
    return (
      <AppShell>
        <div
          style={{
            minHeight: "100vh",
            background: "#0d1117",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "sans-serif",
          }}
        >
          <div style={{ ...card, textAlign: "center", maxWidth: 480 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
            <h2 style={{ marginBottom: 8 }}>워크스페이스에서 배포하세요</h2>
            <p style={{ color: "#8b949e", marginBottom: 24 }}>
              배포하려면 워크스페이스에서 프로젝트를 열고 배포 버튼을 누르세요.
            </p>
            <a
              href="/workspace"
              style={{
                background: "#238636",
                color: "#fff",
                borderRadius: 8,
                padding: "10px 24px",
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              워크스페이스로 이동 →
            </a>
          </div>
        </div>
      </AppShell>
    );
  }

  // ── Loading project ───────────────────────────────────────────────────────
  if (status === "loading_project") {
    return (
      <AppShell>
        <div
          style={{
            minHeight: "100vh",
            background: "#0d1117",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "sans-serif",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                width: 48,
                height: 48,
                border: "3px solid #30363d",
                borderTop: "3px solid #58a6ff",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 16px",
              }}
            />
            <p style={{ color: "#8b949e" }}>프로젝트 불러오는 중...</p>
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </AppShell>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (status === "success") {
    return (
      <AppShell>
        <div
          style={{
            minHeight: "100vh",
            background: "#0d1117",
            color: "#fff",
            padding: "60px 20px",
            fontFamily: "sans-serif",
          }}
        >
          <div style={{ maxWidth: 600, margin: "0 auto" }}>
            <div
              style={{
                background: "#0d2818",
                border: "1px solid #238636",
                borderRadius: 12,
                padding: 40,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
              <h2 style={{ color: "#3fb950", fontSize: 24, marginBottom: 8 }}>
                배포 완료!
              </h2>
              <p style={{ color: "#8b949e", marginBottom: 24 }}>
                {project?.name ?? "프로젝트"}가 성공적으로 배포됐습니다.
              </p>
              {deployUrl && (
                <a
                  href={deployUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-block",
                    background: "#161b22",
                    border: "1px solid #30363d",
                    borderRadius: 8,
                    padding: "10px 20px",
                    color: "#58a6ff",
                    wordBreak: "break-all",
                    textDecoration: "none",
                    marginBottom: 28,
                    fontSize: 15,
                  }}
                >
                  🔗 {deployUrl}
                </a>
              )}
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  onClick={() => {
                    setStatus("ready");
                    setDeployUrl("");
                    setDeploymentId("");
                    setPollCount(0);
                  }}
                  style={{
                    background: "transparent",
                    border: "1px solid #30363d",
                    color: "#fff",
                    borderRadius: 8,
                    padding: "10px 20px",
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                >
                  다시 배포
                </button>
                <a
                  href={`/workspace?projectId=${projectId}`}
                  style={{
                    background: "#1f6feb",
                    color: "#fff",
                    borderRadius: 8,
                    padding: "10px 20px",
                    textDecoration: "none",
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  워크스페이스로 돌아가기
                </a>
                {deployUrl && (
                  <a
                    href={deployUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: "#238636",
                      color: "#fff",
                      borderRadius: 8,
                      padding: "10px 20px",
                      textDecoration: "none",
                      fontSize: 14,
                      fontWeight: 700,
                    }}
                  >
                    앱 열기 →
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  // ── Main UI ───────────────────────────────────────────────────────────────
  const isDeploying = status === "deploying" || status === "polling";
  const fileCount = project ? Object.keys(project.files).length : 0;

  const platforms: { id: "vercel" | "netlify"; name: string; icon: string; desc: string }[] = [
    { id: "vercel", name: "Vercel", icon: "▲", desc: "빠른 글로벌 CDN 배포" },
    { id: "netlify", name: "Netlify", icon: "🌐", desc: "정적 사이트 무료 호스팅" },
  ];

  return (
    <AppShell>
      <div
        style={{
          minHeight: "100vh",
          background: "#0d1117",
          color: "#fff",
          padding: "60px 20px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
            🚀 배포하기
          </h1>
          <p style={{ color: "#8b949e", marginBottom: 32 }}>
            플랫폼을 선택하고 한 번에 배포하세요
          </p>

          {/* Project info card */}
          {project && (
            <div style={{ ...card, marginBottom: 24 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <span style={{ fontSize: 20 }}>📁</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>
                    {project.name}
                  </div>
                  <div style={{ color: "#8b949e", fontSize: 13 }}>
                    파일 {fileCount}개
                  </div>
                </div>
              </div>
              <div
                style={{
                  background: "#0d1117",
                  borderRadius: 8,
                  padding: "10px 14px",
                  maxHeight: 120,
                  overflowY: "auto",
                }}
              >
                {Object.keys(project.files)
                  .slice(0, 20)
                  .map((name) => (
                    <div
                      key={name}
                      style={{
                        color: "#8b949e",
                        fontSize: 12,
                        padding: "2px 0",
                        fontFamily: "monospace",
                      }}
                    >
                      {name}
                    </div>
                  ))}
                {fileCount > 20 && (
                  <div
                    style={{ color: "#58a6ff", fontSize: 12, marginTop: 4 }}
                  >
                    외 {fileCount - 20}개 파일
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Platform selector */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginBottom: 24,
            }}
          >
            {platforms.map((p) => (
              <button
                key={p.id}
                onClick={() => !isDeploying && setPlatform(p.id)}
                disabled={isDeploying}
                style={{
                  background: platform === p.id ? "#161b22" : "#0d1117",
                  border: `2px solid ${platform === p.id ? "#58a6ff" : "#30363d"}`,
                  borderRadius: 12,
                  padding: 24,
                  cursor: isDeploying ? "not-allowed" : "pointer",
                  textAlign: "left",
                  transition: "all 0.2s",
                  opacity: isDeploying ? 0.6 : 1,
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>{p.icon}</div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>
                  {p.name}
                </div>
                <div style={{ color: "#8b949e", fontSize: 13, marginTop: 4 }}>
                  {p.desc}
                </div>
              </button>
            ))}
          </div>

          {/* Error */}
          {status === "error" && error && (
            <div
              style={{
                background: "#2d1117",
                border: "1px solid #da3633",
                borderRadius: 8,
                padding: "12px 16px",
                color: "#f85149",
                marginBottom: 16,
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* Progress */}
          {isDeploying && (
            <div style={{ ...card, marginBottom: 16, textAlign: "center" }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  border: "3px solid #30363d",
                  borderTop: "3px solid #58a6ff",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                  margin: "0 auto 12px",
                }}
              />
              <div style={{ color: "#58a6ff", fontWeight: 600 }}>
                {status === "deploying"
                  ? "배포 요청 중..."
                  : `빌드 중... (${pollCount}회 확인)`}
              </div>
              <div style={{ color: "#8b949e", fontSize: 13, marginTop: 6 }}>
                {status === "polling"
                  ? "Vercel이 프로젝트를 빌드하고 있습니다. 잠시만 기다려주세요."
                  : ""}
              </div>
              {/* Simple progress bar */}
              {status === "polling" && (
                <div
                  style={{
                    background: "#30363d",
                    borderRadius: 4,
                    height: 4,
                    marginTop: 16,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      background: "#58a6ff",
                      borderRadius: 4,
                      width: `${Math.min(pollCount * 5, 90)}%`,
                      transition: "width 0.5s ease",
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Deploy button */}
          <button
            onClick={deploy}
            disabled={isDeploying || !project || status === "error"}
            style={{
              width: "100%",
              background: isDeploying || !project ? "#161b22" : "#238636",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "14px",
              fontSize: 16,
              fontWeight: 700,
              cursor: isDeploying || !project ? "not-allowed" : "pointer",
              opacity: isDeploying ? 0.7 : 1,
              transition: "background 0.2s",
            }}
          >
            {isDeploying
              ? status === "deploying"
                ? "⏳ 배포 중..."
                : "⏳ 빌드 대기 중..."
              : `▲ ${platforms.find((p) => p.id === platform)?.name ?? "Vercel"}에 배포`}
          </button>

          {/* Retry button after error */}
          {status === "error" && (
            <button
              onClick={() => setStatus("ready")}
              style={{
                width: "100%",
                marginTop: 12,
                background: "transparent",
                border: "1px solid #30363d",
                color: "#8b949e",
                borderRadius: 10,
                padding: "12px",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              다시 시도
            </button>
          )}

          {/* Back link */}
          <div style={{ textAlign: "center", marginTop: 24 }}>
            <a
              href={projectId ? `/workspace?projectId=${projectId}` : "/workspace"}
              style={{ color: "#8b949e", fontSize: 13, textDecoration: "none" }}
            >
              ← 워크스페이스로 돌아가기
            </a>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </AppShell>
  );
}

export default function DeployPage() {
  return (
    <Suspense>
      <DeployContent />
    </Suspense>
  );
}
