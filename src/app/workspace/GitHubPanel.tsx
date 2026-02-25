"use client";

import React, { useState, useEffect, useCallback } from "react";
import { T } from "./workspace.constants";
import { useFileSystemStore, useProjectStore, useUiStore, useGitStore } from "./stores";
import type { FilesMap } from "./workspace.constants";

// ── Types ──────────────────────────────────────────────────────────────────────

type GitHubRepo = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  private: boolean;
  language: string | null;
  updated_at: string;
  default_branch: string;
};

// ── localStorage helpers ───────────────────────────────────────────────────────

const GH_TOKEN_KEY = "f9_github_token";
const GH_REPO_KEY = "f9_github_repo";

function getToken(): string | null {
  try { return localStorage.getItem(GH_TOKEN_KEY); } catch { return null; }
}
function setToken(t: string) {
  try { localStorage.setItem(GH_TOKEN_KEY, t); } catch { /* noop */ }
}
function clearToken() {
  try { localStorage.removeItem(GH_TOKEN_KEY); } catch { /* noop */ }
}
function getSavedRepo(): string | null {
  try { return localStorage.getItem(GH_REPO_KEY); } catch { return null; }
}
function setSavedRepo(r: string) {
  try { localStorage.setItem(GH_REPO_KEY, r); } catch { /* noop */ }
}

// ── GitHub API helpers ─────────────────────────────────────────────────────────

async function fetchUserRepos(token: string): Promise<GitHubRepo[]> {
  const res = await fetch("https://api.github.com/user/repos?sort=updated&per_page=30", {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json" },
  });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  return res.json();
}

async function fetchRepoTree(token: string, owner: string, repo: string, branch: string): Promise<Record<string, string>> {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json" },
  });
  if (!res.ok) throw new Error(`Failed to fetch tree: ${res.status}`);
  const data = await res.json();
  const files: Record<string, string> = {};
  const textExts = new Set(["html","css","js","ts","tsx","jsx","json","md","txt","yml","yaml","xml","svg","py","rb","go","rs","java","c","cpp","h","sh","env","toml","cfg","ini"]);

  const blobs = (data.tree || []).filter((item: { type: string; path: string; size?: number }) => {
    if (item.type !== "blob") return false;
    if ((item.size || 0) > 100_000) return false;
    if (item.path.startsWith(".git/") || item.path.includes("node_modules/")) return false;
    const ext = item.path.split(".").pop()?.toLowerCase() || "";
    return textExts.has(ext) || !item.path.includes(".");
  }).slice(0, 50);

  for (const blob of blobs) {
    try {
      const blobRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs/${blob.sha}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json" },
      });
      if (!blobRes.ok) continue;
      const blobData = await blobRes.json();
      if (blobData.encoding === "base64") {
        files[blob.path] = atob(blobData.content.replace(/\n/g, ""));
      }
    } catch { /* skip */ }
  }
  return files;
}

async function pushToGitHub(
  token: string, owner: string, repo: string, branch: string,
  files: Record<string, string>, message: string,
): Promise<{ success: boolean; commitUrl?: string; error?: string }> {
  const headers = { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json", "Content-Type": "application/json" };

  try {
    // 1. Get latest commit SHA
    const refRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${branch}`, { headers });
    if (!refRes.ok) throw new Error("Failed to get ref");
    const refData = await refRes.json();
    const latestCommitSha = refData.object.sha;

    // 2. Create blobs for each file
    const tree: { path: string; mode: string; type: string; sha: string }[] = [];
    for (const [path, content] of Object.entries(files)) {
      const blobRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
        method: "POST", headers,
        body: JSON.stringify({ content, encoding: "utf-8" }),
      });
      if (!blobRes.ok) continue;
      const blobData = await blobRes.json();
      tree.push({ path, mode: "100644", type: "blob", sha: blobData.sha });
    }

    // 3. Create tree
    const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
      method: "POST", headers,
      body: JSON.stringify({ base_tree: latestCommitSha, tree }),
    });
    if (!treeRes.ok) throw new Error("Failed to create tree");
    const treeData = await treeRes.json();

    // 4. Create commit
    const commitRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
      method: "POST", headers,
      body: JSON.stringify({ message, tree: treeData.sha, parents: [latestCommitSha] }),
    });
    if (!commitRes.ok) throw new Error("Failed to create commit");
    const commitData = await commitRes.json();

    // 5. Update ref
    const updateRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
      method: "PATCH", headers,
      body: JSON.stringify({ sha: commitData.sha }),
    });
    if (!updateRes.ok) throw new Error("Failed to update ref");

    return { success: true, commitUrl: commitData.html_url };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

async function createGitHubRepo(token: string, name: string, isPrivate: boolean): Promise<GitHubRepo> {
  const res = await fetch("https://api.github.com/user/repos", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json", "Content-Type": "application/json" },
    body: JSON.stringify({ name, private: isPrivate, auto_init: true }),
  });
  if (!res.ok) throw new Error(`Failed to create repo: ${res.status}`);
  return res.json();
}

// ── Component ──────────────────────────────────────────────────────────────────

export interface GitHubPanelProps {
  onClose: () => void;
}

export function GitHubPanel({ onClose }: GitHubPanelProps) {
  const files = useFileSystemStore(s => s.files);
  const setFiles = useFileSystemStore(s => s.setFiles);
  const projectName = useProjectStore(s => s.projectName);
  const showToast = useUiStore(s => s.showToast);
  const commitAction = useGitStore(s => s.commit);

  const [token, setTokenState] = useState(getToken() || "");
  const [connected, setConnected] = useState(!!getToken());
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<string | null>(getSavedRepo());
  const [tab, setTab] = useState<"connect" | "repos" | "actions">(getToken() ? "repos" : "connect");
  const [pushing, setPushing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [commitMsg, setCommitMsg] = useState("");
  const [newRepoName, setNewRepoName] = useState("");
  const [newRepoPrivate, setNewRepoPrivate] = useState(true);
  const [showCreateRepo, setShowCreateRepo] = useState(false);

  const loadRepos = useCallback(async (t?: string) => {
    const tk = t || getToken();
    if (!tk) return;
    setLoading(true);
    try {
      const r = await fetchUserRepos(tk);
      setRepos(r);
      setTab("repos");
    } catch (err) {
      showToast(`GitHub 연결 실패: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (connected) loadRepos();
  }, [connected, loadRepos]);

  const handleConnect = () => {
    if (!token.trim()) return;
    setToken(token.trim());
    setConnected(true);
    loadRepos(token.trim());
    showToast("GitHub 연결됨");
  };

  const handleDisconnect = () => {
    clearToken();
    setConnected(false);
    setRepos([]);
    setSelectedRepo(null);
    setTab("connect");
    setTokenState("");
    showToast("GitHub 연결 해제됨");
  };

  const handleImport = async (repo: GitHubRepo) => {
    const tk = getToken();
    if (!tk) return;
    setImporting(true);
    try {
      const imported = await fetchRepoTree(tk, repo.full_name.split("/")[0], repo.name, repo.default_branch);
      const fileCount = Object.keys(imported).length;
      if (fileCount === 0) {
        showToast("가져올 파일이 없습니다");
        return;
      }
      const filesMap: FilesMap = {};
      const extToLang = (name: string) => {
        const ext = name.split(".").pop()?.toLowerCase() || "";
        const map: Record<string, "html" | "css" | "javascript" | "typescript" | "python" | "json" | "markdown"> = {
          html: "html", css: "css", js: "javascript", ts: "typescript",
          tsx: "typescript", jsx: "javascript", json: "json", md: "markdown", py: "python",
        };
        return map[ext] || "javascript";
      };
      for (const [path, content] of Object.entries(imported)) {
        filesMap[path] = { name: path, language: extToLang(path), content };
      }
      setFiles(filesMap);
      commitAction(`Import from ${repo.full_name}`);
      setSelectedRepo(repo.full_name);
      setSavedRepo(repo.full_name);
      setTab("actions");
      showToast(`📥 ${repo.name}에서 ${fileCount}개 파일 가져옴`);
    } catch (err) {
      showToast(`Import 실패: ${String(err)}`);
    } finally {
      setImporting(false);
    }
  };

  const handlePush = async () => {
    const tk = getToken();
    if (!tk || !selectedRepo) return;
    const [owner, repo] = selectedRepo.split("/");
    if (!owner || !repo) return;
    setPushing(true);
    const msg = commitMsg.trim() || `Update from Dalkak - ${new Date().toISOString()}`;
    const fileContents: Record<string, string> = {};
    for (const [k, v] of Object.entries(files)) fileContents[k] = v.content;
    const result = await pushToGitHub(tk, owner, repo, "main", fileContents, msg);
    setPushing(false);
    if (result.success) {
      showToast(`✅ GitHub에 푸시 완료`);
      setCommitMsg("");
    } else {
      showToast(`❌ 푸시 실패: ${result.error}`);
    }
  };

  const handleCreateRepo = async () => {
    const tk = getToken();
    if (!tk || !newRepoName.trim()) return;
    setLoading(true);
    try {
      const repo = await createGitHubRepo(tk, newRepoName.trim(), newRepoPrivate);
      setSelectedRepo(repo.full_name);
      setSavedRepo(repo.full_name);
      setShowCreateRepo(false);
      setNewRepoName("");
      await loadRepos(tk);
      setTab("actions");
      showToast(`✅ ${repo.full_name} 생성됨`);
    } catch (err) {
      showToast(`레포 생성 실패: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "8px 10px", background: "#f3f4f6",
    border: `1px solid ${T.border}`, borderRadius: 6, color: T.text,
    fontSize: 12, outline: "none", fontFamily: "inherit",
    boxSizing: "border-box",
  };

  const btnPrimary: React.CSSProperties = {
    width: "100%", padding: "9px 0", borderRadius: 8, border: "none",
    background: `linear-gradient(135deg, ${T.accent}, ${T.accentB})`,
    color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
    boxShadow: "0 2px 12px rgba(249,115,22,0.25)",
  };

  return (
    <div style={{
      position: "fixed", top: 40, right: 0, bottom: 0, width: 380, maxWidth: "100%",
      background: T.surface, borderLeft: `1px solid ${T.border}`,
      display: "flex", flexDirection: "column", zIndex: 45,
      boxShadow: "-8px 0 32px rgba(0,0,0,0.12)",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 14px", borderBottom: `1px solid ${T.border}`, flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill={T.text}>
            <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>GitHub</span>
          {connected && (
            <span style={{
              fontSize: 9, fontWeight: 700, color: T.green,
              background: `${T.green}15`, padding: "2px 7px", borderRadius: 8,
            }}>연결됨</span>
          )}
        </div>
        <button onClick={onClose}
          style={{ background: "none", border: "none", color: T.muted, fontSize: 18, cursor: "pointer", padding: "2px 4px", lineHeight: 1 }}
          onMouseEnter={e => { e.currentTarget.style.color = T.text; }}
          onMouseLeave={e => { e.currentTarget.style.color = T.muted; }}
        >{"\u2715"}</button>
      </div>

      {/* Tabs */}
      {connected && (
        <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
          {(["repos", "actions"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{
                flex: 1, padding: "8px 0", border: "none", fontSize: 11, fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
                background: tab === t ? `${T.accent}10` : "transparent",
                color: tab === t ? T.accent : T.muted,
                borderBottom: tab === t ? `2px solid ${T.accent}` : "2px solid transparent",
              }}>
              {t === "repos" ? "레포지토리" : "Push / Pull"}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>

        {/* Connect tab */}
        {tab === "connect" && !connected && (
          <div>
            <div style={{ fontSize: 12, color: T.text, fontWeight: 600, marginBottom: 12 }}>
              GitHub Personal Access Token
            </div>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 12, lineHeight: 1.6 }}>
              GitHub Settings &rarr; Developer settings &rarr; Personal access tokens &rarr; Fine-grained tokens에서 생성하세요. <code style={{ background: "#f3f4f6", padding: "1px 4px", borderRadius: 3 }}>repo</code> 권한이 필요합니다.
            </div>
            <input
              value={token}
              onChange={e => setTokenState(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleConnect(); }}
              placeholder="ghp_xxxxxxxxxxxx..."
              type="password"
              style={{ ...inputStyle, marginBottom: 10 }}
              onFocus={e => { e.currentTarget.style.borderColor = T.accent; }}
              onBlur={e => { e.currentTarget.style.borderColor = T.border; }}
            />
            <button onClick={handleConnect} disabled={!token.trim()} style={{
              ...btnPrimary,
              opacity: token.trim() ? 1 : 0.5,
              cursor: token.trim() ? "pointer" : "not-allowed",
            }}>
              연결
            </button>
          </div>
        )}

        {/* Repos tab */}
        {tab === "repos" && connected && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: T.muted, fontWeight: 600 }}>
                {repos.length}개 레포지토리
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => setShowCreateRepo(!showCreateRepo)}
                  style={{
                    padding: "4px 10px", borderRadius: 6, border: `1px solid ${T.border}`,
                    background: showCreateRepo ? `${T.accent}15` : "#f3f4f6",
                    color: showCreateRepo ? T.accent : T.muted,
                    fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                  }}>+ 새 레포</button>
                <button onClick={handleDisconnect}
                  style={{
                    padding: "4px 10px", borderRadius: 6, border: `1px solid ${T.border}`,
                    background: "#f3f4f6", color: T.red,
                    fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                  }}>연결 해제</button>
              </div>
            </div>

            {/* Create repo form */}
            {showCreateRepo && (
              <div style={{
                padding: "10px 12px", marginBottom: 10, borderRadius: 8,
                background: "#f9fafb", border: `1px solid ${T.border}`,
              }}>
                <input value={newRepoName} onChange={e => setNewRepoName(e.target.value)}
                  placeholder="repository-name" style={{ ...inputStyle, marginBottom: 8 }}
                  onKeyDown={e => { if (e.key === "Enter") handleCreateRepo(); }}
                />
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <label style={{ fontSize: 11, color: T.muted, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                    <input type="checkbox" checked={newRepoPrivate} onChange={e => setNewRepoPrivate(e.target.checked)} />
                    Private
                  </label>
                </div>
                <button onClick={handleCreateRepo} disabled={!newRepoName.trim() || loading} style={{
                  ...btnPrimary, fontSize: 11, padding: "7px 0",
                  opacity: newRepoName.trim() && !loading ? 1 : 0.5,
                }}>
                  {loading ? "생성 중..." : "레포지토리 생성"}
                </button>
              </div>
            )}

            {loading && repos.length === 0 && (
              <div style={{ textAlign: "center", padding: "20px 0", color: T.muted, fontSize: 12 }}>
                불러오는 중...
              </div>
            )}

            {repos.map(repo => (
              <div key={repo.id} style={{
                padding: "10px 12px", borderBottom: `1px solid ${T.border}`,
                display: "flex", alignItems: "center", gap: 10,
                cursor: "pointer", transition: "background 0.1s",
                background: selectedRepo === repo.full_name ? `${T.accent}08` : "transparent",
              }}
                onMouseEnter={e => { if (selectedRepo !== repo.full_name) e.currentTarget.style.background = "#f9fafb"; }}
                onMouseLeave={e => { if (selectedRepo !== repo.full_name) e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{ flex: 1, minWidth: 0 }} onClick={() => { setSelectedRepo(repo.full_name); setSavedRepo(repo.full_name); setTab("actions"); }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {repo.name}
                    </span>
                    {repo.private && (
                      <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, background: "#f3f4f6", color: T.muted }}>private</span>
                    )}
                  </div>
                  {repo.description && (
                    <div style={{ fontSize: 10, color: T.muted, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {repo.description}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8, marginTop: 4, fontSize: 9, color: T.muted }}>
                    {repo.language && <span>{repo.language}</span>}
                    <span>{new Date(repo.updated_at).toLocaleDateString("ko-KR")}</span>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleImport(repo); }}
                  disabled={importing}
                  style={{
                    padding: "5px 10px", borderRadius: 6, border: `1px solid ${T.border}`,
                    background: "#f3f4f6", color: T.accent,
                    fontSize: 10, fontWeight: 600, cursor: importing ? "default" : "pointer", fontFamily: "inherit",
                    flexShrink: 0,
                  }}>
                  {importing ? "..." : "Import"}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Actions tab */}
        {tab === "actions" && connected && (
          <div>
            {selectedRepo ? (
              <>
                <div style={{
                  padding: "10px 12px", borderRadius: 8, marginBottom: 14,
                  background: `${T.accent}08`, border: `1px solid ${T.borderHi}`,
                }}>
                  <div style={{ fontSize: 10, color: T.muted, fontWeight: 600, marginBottom: 4 }}>연결된 레포</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{selectedRepo}</div>
                </div>

                {/* Push */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.text, marginBottom: 8 }}>
                    Push to GitHub
                  </div>
                  <input value={commitMsg} onChange={e => setCommitMsg(e.target.value)}
                    placeholder={`Update ${projectName}`}
                    style={{ ...inputStyle, marginBottom: 8 }}
                    onKeyDown={e => { if (e.key === "Enter") handlePush(); }}
                  />
                  <button onClick={handlePush} disabled={pushing} style={{
                    ...btnPrimary, opacity: pushing ? 0.6 : 1,
                  }}>
                    {pushing ? "Pushing..." : `Push ${Object.keys(files).length}개 파일`}
                  </button>
                </div>

                {/* Pull */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.text, marginBottom: 8 }}>
                    Pull from GitHub
                  </div>
                  <button onClick={() => {
                    const repo = repos.find(r => r.full_name === selectedRepo);
                    if (repo) handleImport(repo);
                  }} disabled={importing} style={{
                    width: "100%", padding: "9px 0", borderRadius: 8,
                    border: `1px solid ${T.border}`, background: "#f3f4f6",
                    color: importing ? T.muted : T.text,
                    fontSize: 12, fontWeight: 600, cursor: importing ? "default" : "pointer", fontFamily: "inherit",
                  }}>
                    {importing ? "Pulling..." : "Pull (최신 코드 가져오기)"}
                  </button>
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", padding: "30px 0", color: T.muted, fontSize: 12, lineHeight: 1.7 }}>
                레포지토리를 선택하세요.<br />
                레포지토리 탭에서 Import 또는 클릭으로 선택할 수 있습니다.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
