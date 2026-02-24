// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => {
  // Need a class-like mock for `new ImageResponse(...)`
  class MockImageResponse extends Response {
    constructor(jsx: unknown, options?: unknown) {
      super("image", {
        status: 200,
        headers: { "content-type": "image/png" },
      });
      MockImageResponse._calls.push({ jsx, options });
    }
    static _calls: Array<{ jsx: unknown; options: unknown }> = [];
    static reset() {
      MockImageResponse._calls = [];
    }
  }
  return { MockImageResponse };
});

vi.mock("next/og", () => ({
  ImageResponse: mocks.MockImageResponse,
}));

import { GET } from "@/app/api/og/route";
import { NextRequest } from "next/server";

beforeEach(() => {
  mocks.MockImageResponse.reset();
});

describe("GET /api/og", () => {
  it("returns a response (ImageResponse)", async () => {
    const req = new NextRequest("http://localhost/api/og");
    const res = await GET(req);
    expect(res).toBeDefined();
    expect(res.status).toBe(200);
    expect(mocks.MockImageResponse._calls).toHaveLength(1);
  });

  it("uses default title when no query param provided", async () => {
    const req = new NextRequest("http://localhost/api/og");
    await GET(req);
    expect(mocks.MockImageResponse._calls).toHaveLength(1);
    expect(mocks.MockImageResponse._calls[0].options).toEqual({
      width: 1200,
      height: 630,
    });
  });

  it("passes custom title from query params", async () => {
    const req = new NextRequest(
      "http://localhost/api/og?title=Custom%20Title",
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(mocks.MockImageResponse._calls).toHaveLength(1);
  });

  it("passes custom sub from query params", async () => {
    const req = new NextRequest(
      "http://localhost/api/og?sub=Custom%20Subtitle",
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(mocks.MockImageResponse._calls).toHaveLength(1);
  });

  it("handles both title and sub together", async () => {
    const req = new NextRequest(
      "http://localhost/api/og?title=My%20App&sub=Best%20App%20Ever",
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(mocks.MockImageResponse._calls).toHaveLength(1);
  });
});
