/**
 * Pure functions for npm registry API interaction.
 * Used by usePackageStore for package search and metadata.
 */

export interface NpmSearchResult {
  name: string;
  version: string;
  description: string;
  weeklyDownloads: number;
  homepage: string;
}

export interface PackageMetadata {
  name: string;
  version: string;
  description: string;
  homepage: string;
  license: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  unpackedSize: number;
}

const NPM_REGISTRY = "https://registry.npmjs.org";
const NPM_SEARCH = "https://registry.npmjs.org/-/v1/search";

/**
 * Search npm packages by query string.
 * Returns up to 10 results sorted by popularity.
 */
export async function searchNpmPackages(query: string): Promise<NpmSearchResult[]> {
  if (!query.trim()) return [];
  const url = `${NPM_SEARCH}?text=${encodeURIComponent(query)}&size=10`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.objects ?? []).map((obj: Record<string, unknown>) => {
    const pkg = obj.package as Record<string, unknown>;
    const score = obj.score as Record<string, Record<string, number>> | undefined;
    return {
      name: pkg.name as string,
      version: pkg.version as string,
      description: (pkg.description as string) ?? "",
      weeklyDownloads: score?.detail?.popularity ?? 0,
      homepage: (pkg.links as Record<string, string>)?.homepage ?? "",
    };
  });
}

/**
 * Get full package metadata from npm registry.
 */
export async function getPackageMetadata(name: string): Promise<PackageMetadata | null> {
  const res = await fetch(`${NPM_REGISTRY}/${encodeURIComponent(name)}/latest`);
  if (!res.ok) return null;
  const data = await res.json();
  return {
    name: data.name ?? name,
    version: data.version ?? "0.0.0",
    description: data.description ?? "",
    homepage: data.homepage ?? "",
    license: data.license ?? "unknown",
    dependencies: data.dependencies ?? {},
    devDependencies: data.devDependencies ?? {},
    unpackedSize: data.dist?.unpackedSize ?? 0,
  };
}

/**
 * Get available versions for a package.
 */
export async function getPackageVersions(name: string): Promise<string[]> {
  const res = await fetch(`${NPM_REGISTRY}/${encodeURIComponent(name)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return Object.keys(data.versions ?? {}).reverse().slice(0, 20);
}

/**
 * Estimate bundle size from registry metadata.
 * Returns size in bytes (rough estimate).
 */
export function estimateBundleSize(meta: PackageMetadata): number {
  if (meta.unpackedSize > 0) return meta.unpackedSize;
  // Rough estimate: 50KB base + 10KB per dependency
  const depCount = Object.keys(meta.dependencies).length;
  return 50_000 + depCount * 10_000;
}

/**
 * Format byte size to human-readable string.
 */
export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
