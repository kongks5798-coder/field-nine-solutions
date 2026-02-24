/**
 * Pure functions for dependency graph computation.
 * Builds tree from installed packages and detects circular dependencies.
 */

export interface DepNode {
  name: string;
  version: string;
  children: DepNode[];
  isCircular: boolean;
}

export interface PackageEntry {
  name: string;
  version: string;
  dependencies: string[];
}

/**
 * Build dependency tree from a list of packages.
 * Each package's `dependencies` is an array of package names
 * that are also in the list.
 */
export function buildDepGraph(packages: PackageEntry[]): DepNode[] {
  const pkgMap = new Map<string, PackageEntry>();
  for (const pkg of packages) {
    pkgMap.set(pkg.name, pkg);
  }

  function buildNode(name: string, visited: Set<string>): DepNode | null {
    const pkg = pkgMap.get(name);
    if (!pkg) return null;

    if (visited.has(name)) {
      return { name, version: pkg.version, children: [], isCircular: true };
    }

    visited.add(name);
    const children: DepNode[] = [];
    for (const dep of pkg.dependencies) {
      const child = buildNode(dep, new Set(visited));
      if (child) children.push(child);
    }

    return { name, version: pkg.version, children, isCircular: false };
  }

  const roots: DepNode[] = [];
  for (const pkg of packages) {
    const node = buildNode(pkg.name, new Set());
    if (node) roots.push(node);
  }
  return roots;
}

/**
 * Flatten dependency tree to a unique list of package names.
 */
export function flattenDeps(roots: DepNode[]): string[] {
  const seen = new Set<string>();
  function walk(node: DepNode) {
    if (seen.has(node.name)) return;
    seen.add(node.name);
    for (const child of node.children) walk(child);
  }
  for (const root of roots) walk(root);
  return Array.from(seen);
}

/**
 * Detect circular dependencies in the package list.
 * Returns arrays of package name cycles.
 */
export function detectCircular(packages: PackageEntry[]): string[][] {
  const pkgMap = new Map<string, PackageEntry>();
  for (const pkg of packages) {
    pkgMap.set(pkg.name, pkg);
  }

  const cycles: string[][] = [];
  const visited = new Set<string>();
  const inStack = new Set<string>();

  function dfs(name: string, path: string[]) {
    if (inStack.has(name)) {
      const cycleStart = path.indexOf(name);
      if (cycleStart >= 0) {
        cycles.push([...path.slice(cycleStart), name]);
      }
      return;
    }
    if (visited.has(name)) return;

    visited.add(name);
    inStack.add(name);
    path.push(name);

    const pkg = pkgMap.get(name);
    if (pkg) {
      for (const dep of pkg.dependencies) {
        dfs(dep, [...path]);
      }
    }

    inStack.delete(name);
  }

  for (const pkg of packages) {
    dfs(pkg.name, []);
  }
  return cycles;
}
