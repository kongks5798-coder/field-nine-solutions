// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockClient = vi.hoisted(() => ({ from: vi.fn() }));

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(() => mockClient),
}));

describe("getAdminClient", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("returns a Supabase client object", async () => {
    const { getAdminClient } = await import("@/lib/supabase-admin");
    const client = getAdminClient();
    expect(client).toBeDefined();
    expect(client).toHaveProperty("from");
  });

  it("returns the same instance on second call (singleton)", async () => {
    const { getAdminClient } = await import("@/lib/supabase-admin");
    const first = getAdminClient();
    const second = getAdminClient();
    expect(first).toBe(second);
  });
});
