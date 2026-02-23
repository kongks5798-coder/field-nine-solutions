// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockSendContactEmail = vi.hoisted(() => vi.fn());

vi.mock("@/lib/logger", () => ({
  log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn(), api: vi.fn(), security: vi.fn() },
}));

vi.mock("@/lib/email", () => ({
  sendContactEmail: mockSendContactEmail,
}));

import { POST } from "@/app/api/contact/route";

function makePostReq(body: unknown) {
  return new NextRequest("http://localhost/api/contact", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function makeInvalidJsonReq() {
  return new NextRequest("http://localhost/api/contact", {
    method: "POST",
    body: "not-valid-json{{",
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/contact", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.RESEND_API_KEY;
  });

  it("returns 200 with valid name and email", async () => {
    const res = await POST(makePostReq({ name: "John", email: "john@example.com" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it("returns 400 when name is missing", async () => {
    const res = await POST(makePostReq({ email: "john@example.com" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when email is invalid", async () => {
    const res = await POST(makePostReq({ name: "John", email: "not-an-email" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid JSON body", async () => {
    const res = await POST(makeInvalidJsonReq());
    expect(res.status).toBe(400);
  });

  it("sends email when RESEND_API_KEY is set", async () => {
    process.env.RESEND_API_KEY = "test-key";
    mockSendContactEmail.mockResolvedValue(undefined);
    const res = await POST(makePostReq({
      name: "Alice",
      email: "alice@example.com",
      company: "Acme",
      message: "Hello!",
      type: "inquiry",
    }));
    expect(res.status).toBe(200);
    expect(mockSendContactEmail).toHaveBeenCalledWith({
      name: "Alice",
      email: "alice@example.com",
      company: "Acme",
      message: "Hello!",
      type: "inquiry",
    });
  });

  it("succeeds even if email sending fails", async () => {
    process.env.RESEND_API_KEY = "test-key";
    mockSendContactEmail.mockRejectedValue(new Error("SMTP error"));
    const res = await POST(makePostReq({ name: "Bob", email: "bob@example.com" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});
