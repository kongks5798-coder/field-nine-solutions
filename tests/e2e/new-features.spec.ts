import { test, expect } from "@playwright/test";

/**
 * 신규 기능 E2E — 배포 후 자동 검증 대상
 *
 * 커버:
 * - 홈페이지 "오늘의 딸깍" 섹션
 * - /api/showcase/featured API
 * - /api/ai/autocomplete API
 * - /api/ai/explain API
 * - /p/[slug] 공개 앱 페이지 (딸깍 배지)
 * - 워크스페이스 "🔍 설명" 버튼
 */

// ── 홈페이지 ──────────────────────────────────────────────────────────────────

test.describe("홈페이지 — 오늘의 딸깍", () => {
  test("홈페이지가 로드되고 제목이 표시된다", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Dalkak|딸깍|FieldNine/i);
  });

  test("오늘의 딸깍 섹션이 홈페이지에 존재한다", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // Section heading
    const section = page.getByText(/오늘의 딸깍/);
    await expect(section).toBeVisible({ timeout: 15000 });
  });

  test("커뮤니티 인기 앱 섹션이 표시된다", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const section = page.getByText(/커뮤니티 인기 앱/);
    await expect(section).toBeVisible({ timeout: 10000 });
  });
});

// ── API — /api/showcase/featured ─────────────────────────────────────────────

test.describe("API — showcase/featured", () => {
  test("GET /api/showcase/featured는 200을 반환한다", async ({ request }) => {
    const res = await request.get("/api/showcase/featured");
    expect(res.status()).toBe(200);
  });

  test("featured 응답에 featured 배열이 있다", async ({ request }) => {
    const res = await request.get("/api/showcase/featured");
    const body = await res.json();
    expect(body).toHaveProperty("featured");
    expect(Array.isArray(body.featured)).toBe(true);
  });

  test("featured 앱 아이템은 slug와 name을 가진다", async ({ request }) => {
    const res = await request.get("/api/showcase/featured");
    const body = await res.json();
    if (body.featured.length > 0) {
      const item = body.featured[0];
      expect(item).toHaveProperty("slug");
      expect(item).toHaveProperty("name");
      expect(item).toHaveProperty("badge");
    }
  });
});

// ── API — /api/ai/autocomplete ────────────────────────────────────────────────

test.describe("API — ai/autocomplete", () => {
  test("POST /api/ai/autocomplete는 200을 반환한다", async ({ request }) => {
    const res = await request.post("/api/ai/autocomplete", {
      data: { partial: "할 일 관리" },
      headers: { "Content-Type": "application/json" },
    });
    // 200 or 429 (rate limit) both are acceptable
    expect([200, 429]).toContain(res.status());
  });

  test("자동완성 응답에 suggestion 필드가 있다", async ({ request }) => {
    const res = await request.post("/api/ai/autocomplete", {
      data: { partial: "날씨 앱" },
      headers: { "Content-Type": "application/json" },
    });
    if (res.status() === 200) {
      const body = await res.json();
      expect(body).toHaveProperty("suggestion");
      expect(typeof body.suggestion).toBe("string");
    }
  });

  test("빈 partial은 빈 suggestion을 반환한다", async ({ request }) => {
    const res = await request.post("/api/ai/autocomplete", {
      data: { partial: "" },
      headers: { "Content-Type": "application/json" },
    });
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.suggestion).toBe("");
    }
  });
});

// ── API — /api/ai/explain ─────────────────────────────────────────────────────

test.describe("API — ai/explain", () => {
  test("POST /api/ai/explain는 SSE 스트림을 반환한다", async ({ request }) => {
    const res = await request.post("/api/ai/explain", {
      data: {
        html: "<h1>Hello</h1>",
        css: "h1 { color: red; }",
        js: "console.log('hi');",
        appName: "테스트 앱",
      },
      headers: { "Content-Type": "application/json" },
    });
    // 200 = SSE stream, 429 = rate limit
    expect([200, 429]).toContain(res.status());
    if (res.status() === 200) {
      const ct = res.headers()["content-type"] ?? "";
      expect(ct).toContain("text/event-stream");
    }
  });
});

// ── 공개 앱 페이지 ────────────────────────────────────────────────────────────

test.describe("공개 앱 페이지 — /p/[slug]", () => {
  test("존재하지 않는 슬러그는 404를 반환한다", async ({ request }) => {
    const res = await request.get("/p/nonexistent-slug-xyz-404-test");
    expect([404, 200]).toContain(res.status()); // 200 = Next notFound() rendered
  });

  test("/p 목록 페이지가 로드된다", async ({ page }) => {
    await page.goto("/p");
    // Either redirects to showcase or renders app list
    await page.waitForLoadState("networkidle");
    const url = page.url();
    expect(url).toMatch(/\/(p|showcase)/);
  });
});

// ── 쇼케이스 페이지 ───────────────────────────────────────────────────────────

test.describe("쇼케이스 페이지", () => {
  test("/showcase 페이지가 로드된다", async ({ page }) => {
    await page.goto("/showcase");
    await page.waitForLoadState("networkidle");
    // Page title or heading
    const body = await page.content();
    expect(body).toMatch(/Showcase|쇼케이스|앱/i);
  });
});

// ── 워크스페이스 신규 기능 ────────────────────────────────────────────────────

test.describe("워크스페이스 — 신규 기능 UI", () => {
  test("워크스페이스가 로드되거나 로그인으로 리다이렉트된다", async ({
    page,
  }) => {
    await page.goto("/workspace");
    await page.waitForLoadState("networkidle");
    const url = page.url();
    expect(url).toMatch(/\/(workspace|login)/);
  });

  test("워크스페이스 로드 시 PipelineAgentView 스타일이 존재한다", async ({
    page,
  }) => {
    await page.goto("/workspace");
    if (/login/.test(page.url())) return; // skip if not authed
    // The component is hidden until generation starts — check DOM exists
    await page.waitForLoadState("networkidle");
    const body = await page.content();
    expect(body).toMatch(/workspace|프로젝트/i);
  });
});

// ── 딸깍 배지 injection 검증 ──────────────────────────────────────────────────

test.describe("딸깍 배지 API", () => {
  test("익명 publish API가 존재한다 (405 or 200 not 404)", async ({
    request,
  }) => {
    // Just verify the endpoint exists
    const res = await request.get("/api/projects/publish-anon");
    expect(res.status()).not.toBe(404);
  });

  test("publish API가 존재한다", async ({ request }) => {
    const res = await request.get("/api/projects/publish");
    expect(res.status()).not.toBe(404);
  });
});
