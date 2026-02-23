// @vitest-environment node
import { describe, it, expect } from "vitest";

import { GET } from "@/app/api/docs/route";

describe("GET /api/docs", () => {
  it("200 응답 반환", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
  });

  it("Content-Type: application/json 헤더 포함", async () => {
    const res = await GET();
    expect(res.headers.get("Content-Type")).toBe("application/json");
  });

  it("CORS 헤더 포함 (Access-Control-Allow-Origin: *)", async () => {
    const res = await GET();
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });

  it("Cache-Control 헤더 포함", async () => {
    const res = await GET();
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=3600");
  });

  it("OpenAPI 3.0 스펙 구조 포함", async () => {
    const res = await GET();
    const body = await res.json();
    expect(body.openapi).toBe("3.0.3");
    expect(body.info).toBeDefined();
    expect(body.info.title).toBe("FieldNine API");
    expect(body.info.version).toBe("1.0.0");
    expect(body.paths).toBeDefined();
    expect(body.servers).toBeDefined();
  });

  it("서버 목록에 production + local 포함", async () => {
    const res = await GET();
    const body = await res.json();
    const urls = body.servers.map((s: { url: string }) => s.url);
    expect(urls).toContain("https://fieldnine.io");
    expect(urls).toContain("http://localhost:3000");
  });

  it("securitySchemes에 cookieAuth + adminSecret 포함", async () => {
    const res = await GET();
    const body = await res.json();
    expect(body.components.securitySchemes.cookieAuth).toBeDefined();
    expect(body.components.securitySchemes.cookieAuth.type).toBe("apiKey");
    expect(body.components.securitySchemes.adminSecret).toBeDefined();
    expect(body.components.securitySchemes.adminSecret.in).toBe("header");
  });
});
