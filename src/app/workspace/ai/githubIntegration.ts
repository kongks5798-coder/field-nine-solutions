// ============================================================
// GitHub Integration Utilities for FieldNine Workspace
// ============================================================

// --------------- Types ---------------

export type GitHubRepo = {
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

export type GitHubFile = {
  name: string;
  path: string;
  content: string;
  sha: string;
};

export type GitHubConfig = {
  token: string;
  owner: string;
  repo: string;
};

// --------------- Constants ---------------

const GITHUB_API = "https://api.github.com";
const STORAGE_KEY = "f9_github_token";
const MAX_IMPORT_FILES = 50;
const SKIP_DIRS = new Set([".git", "node_modules", ".next", "dist", "build", ".cache"]);
const BINARY_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".ico", ".bmp", ".webp",
  ".woff", ".woff2", ".ttf", ".eot", ".otf",
  ".pdf", ".zip", ".tar", ".gz", ".7z", ".rar",
  ".mp3", ".mp4", ".wav", ".avi", ".mov",
  ".exe", ".dll", ".so", ".dylib",
  ".lock",
]);

// --------------- Token Management ---------------

export function getGitHubToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function setGitHubToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, token);
}

export function clearGitHubToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function isGitHubConnected(): boolean {
  return getGitHubToken() !== null;
}

// --------------- Internal Helpers ---------------

function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github.v3+json",
    "Content-Type": "application/json",
  };
}

function isBinaryPath(filePath: string): boolean {
  const ext = filePath.slice(filePath.lastIndexOf(".")).toLowerCase();
  return BINARY_EXTENSIONS.has(ext);
}

function decodeBase64Content(encoded: string): string {
  try {
    return atob(encoded.replace(/\n/g, ""));
  } catch {
    return "";
  }
}

// --------------- API Functions ---------------

/**
 * Fetch the authenticated user's repositories, sorted by most recently
 * updated, limited to 30 results.
 */
export async function fetchUserRepos(token: string): Promise<GitHubRepo[]> {
  const url = `${GITHUB_API}/user/repos?sort=updated&direction=desc&per_page=30`;
  const res = await fetch(url, { headers: authHeaders(token) });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to fetch repos (${res.status}): ${body}`);
  }

  const data: GitHubRepo[] = await res.json();
  return data;
}

/**
 * Fetch the contents of a specific path within a repository.
 * For file entries the base64-encoded content is decoded automatically.
 * For directory entries `content` will be an empty string.
 */
export async function fetchRepoContents(
  config: GitHubConfig,
  path: string = "",
): Promise<GitHubFile[]> {
  const safePath = path.replace(/^\/+/, "");
  const url = `${GITHUB_API}/repos/${config.owner}/${config.repo}/contents/${safePath}`;
  const res = await fetch(url, { headers: authHeaders(config.token) });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to fetch contents (${res.status}): ${body}`);
  }

  const data = await res.json();

  // The API returns a single object when the path points to a file.
  const items: Array<Record<string, unknown>> = Array.isArray(data) ? data : [data];

  return items.map((item) => ({
    name: item.name as string,
    path: item.path as string,
    content: item.content ? decodeBase64Content(item.content as string) : "",
    sha: item.sha as string,
  }));
}

/**
 * Recursively import all text files from the root of a repository into a
 * flat file map keyed by file path.  Binary files, `.git`, and
 * `node_modules` directories are skipped.  The import is capped at
 * {@link MAX_IMPORT_FILES} files to prevent excessively large imports.
 */
export async function importRepoToFiles(
  config: GitHubConfig,
): Promise<Record<string, { name: string; content: string }>> {
  const result: Record<string, { name: string; content: string }> = {};
  let fileCount = 0;

  async function walk(dirPath: string): Promise<void> {
    if (fileCount >= MAX_IMPORT_FILES) return;

    const url = `${GITHUB_API}/repos/${config.owner}/${config.repo}/contents/${dirPath}`;
    const res = await fetch(url, { headers: authHeaders(config.token) });

    if (!res.ok) return; // silently skip inaccessible paths

    const items: Array<Record<string, unknown>> = await res.json();
    if (!Array.isArray(items)) return;

    for (const item of items) {
      if (fileCount >= MAX_IMPORT_FILES) break;

      const name = item.name as string;
      const itemPath = item.path as string;
      const type = item.type as string;

      if (type === "dir") {
        if (SKIP_DIRS.has(name)) continue;
        await walk(itemPath);
      } else if (type === "file") {
        if (isBinaryPath(name)) continue;

        // Fetch individual file to get content
        const fileUrl = `${GITHUB_API}/repos/${config.owner}/${config.repo}/contents/${itemPath}`;
        const fileRes = await fetch(fileUrl, { headers: authHeaders(config.token) });
        if (!fileRes.ok) continue;

        const fileData: Record<string, unknown> = await fileRes.json();
        const content = fileData.content
          ? decodeBase64Content(fileData.content as string)
          : "";

        result[itemPath] = { name, content };
        fileCount++;
      }
    }
  }

  await walk("");
  return result;
}

/**
 * Push a set of files to a repository as a single commit using the
 * Git Trees / Commits API:
 *   1. Create a blob for each file
 *   2. Create a tree referencing all blobs
 *   3. Create a commit pointing to the new tree
 *   4. Update the branch ref to the new commit
 */
export async function pushFilesToRepo(
  config: GitHubConfig,
  files: Record<string, { content: string }>,
  message: string,
  branch?: string,
): Promise<{ success: boolean; commitUrl?: string; error?: string }> {
  const { token, owner, repo } = config;
  const headers = authHeaders(token);

  try {
    // 1. Resolve target branch and get the latest commit SHA
    const targetBranch = branch ?? (await getDefaultBranch(config));
    const refUrl = `${GITHUB_API}/repos/${owner}/${repo}/git/refs/heads/${targetBranch}`;
    const refRes = await fetch(refUrl, { headers });
    if (!refRes.ok) {
      return { success: false, error: `Branch "${targetBranch}" not found (${refRes.status})` };
    }
    const refData = await refRes.json();
    const latestCommitSha: string = refData.object.sha;

    // 2. Get the tree SHA of the latest commit
    const commitUrl = `${GITHUB_API}/repos/${owner}/${repo}/git/commits/${latestCommitSha}`;
    const commitRes = await fetch(commitUrl, { headers });
    if (!commitRes.ok) {
      return { success: false, error: `Failed to fetch commit (${commitRes.status})` };
    }
    const commitData = await commitRes.json();
    const baseTreeSha: string = commitData.tree.sha;

    // 3. Create blobs for every file
    const treeItems: Array<{
      path: string;
      mode: string;
      type: string;
      sha: string;
    }> = [];

    for (const [filePath, { content }] of Object.entries(files)) {
      const blobRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/git/blobs`, {
        method: "POST",
        headers,
        body: JSON.stringify({ content, encoding: "utf-8" }),
      });
      if (!blobRes.ok) {
        const body = await blobRes.text();
        return { success: false, error: `Failed to create blob for ${filePath}: ${body}` };
      }
      const blobData = await blobRes.json();
      treeItems.push({
        path: filePath,
        mode: "100644",
        type: "blob",
        sha: blobData.sha,
      });
    }

    // 4. Create a new tree
    const treeRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/git/trees`, {
      method: "POST",
      headers,
      body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems }),
    });
    if (!treeRes.ok) {
      const body = await treeRes.text();
      return { success: false, error: `Failed to create tree: ${body}` };
    }
    const treeData = await treeRes.json();

    // 5. Create the commit
    const newCommitRes = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/git/commits`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        message,
        tree: treeData.sha,
        parents: [latestCommitSha],
      }),
    });
    if (!newCommitRes.ok) {
      const body = await newCommitRes.text();
      return { success: false, error: `Failed to create commit: ${body}` };
    }
    const newCommitData = await newCommitRes.json();

    // 6. Update the branch reference
    const updateRefRes = await fetch(refUrl, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ sha: newCommitData.sha }),
    });
    if (!updateRefRes.ok) {
      const body = await updateRefRes.text();
      return { success: false, error: `Failed to update ref: ${body}` };
    }

    return {
      success: true,
      commitUrl: `https://github.com/${owner}/${repo}/commit/${newCommitData.sha}`,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMessage };
  }
}

/**
 * Create a new repository for the authenticated user.
 */
export async function createRepo(
  token: string,
  name: string,
  isPrivate: boolean = false,
): Promise<GitHubRepo> {
  const res = await fetch(`${GITHUB_API}/user/repos`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({
      name,
      private: isPrivate,
      auto_init: true,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to create repo (${res.status}): ${body}`);
  }

  const data: GitHubRepo = await res.json();
  return data;
}

/**
 * Build a GitHub OAuth authorization URL for the "repo" scope.
 */
export function buildGitHubOAuthUrl(clientId: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "repo",
  });
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

// --------------- Private Helpers ---------------

async function getDefaultBranch(config: GitHubConfig): Promise<string> {
  const url = `${GITHUB_API}/repos/${config.owner}/${config.repo}`;
  const res = await fetch(url, { headers: authHeaders(config.token) });
  if (!res.ok) return "main";
  const data = await res.json();
  return (data.default_branch as string) ?? "main";
}
