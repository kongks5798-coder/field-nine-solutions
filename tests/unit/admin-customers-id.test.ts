// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  db: {
    deleteCustomer: vi.fn(),
    updateCustomer: vi.fn(),
  },
}));

vi.mock("@/core/adminAuth", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/core/rateLimit", () => ({
  ipFromHeaders: () => "127.0.0.1",
  checkLimit: () => ({
    ok: true,
    remaining: 9,
    limit: 10,
    reset: Date.now() + 60000,
  }),
  headersFor: () => ({}),
}));
vi.mock("@/core/database", () => ({ getDB: () => mocks.db }));

import { DELETE, PATCH } from "@/app/api/admin/customers/[id]/route";

const AUTH_OK = { ok: true as const };
const AUTH_FAIL = {
  ok: false as const,
  response: new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
  }),
};

function makeCtx(id: string) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.requireAdmin.mockResolvedValue(AUTH_OK);
});

describe("DELETE /api/admin/customers/[id]", () => {
  it("deletes customer successfully", async () => {
    mocks.db.deleteCustomer.mockResolvedValue(true);
    const req = new NextRequest("http://localhost/api/admin/customers/c1", {
      method: "DELETE",
    });
    const res = await DELETE(req, makeCtx("c1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(mocks.db.deleteCustomer).toHaveBeenCalledWith("c1");
  });

  it("returns 404 when customer not found", async () => {
    mocks.db.deleteCustomer.mockResolvedValue(false);
    const req = new NextRequest("http://localhost/api/admin/customers/c999", {
      method: "DELETE",
    });
    const res = await DELETE(req, makeCtx("c999"));
    expect(res.status).toBe(404);
  });

  it("returns 401 when not authenticated", async () => {
    mocks.requireAdmin.mockResolvedValueOnce(AUTH_FAIL);
    const req = new NextRequest("http://localhost/api/admin/customers/c1", {
      method: "DELETE",
    });
    const res = await DELETE(req, makeCtx("c1"));
    expect(res.status).toBe(401);
  });
});

describe("PATCH /api/admin/customers/[id]", () => {
  it("updates customer name", async () => {
    mocks.db.updateCustomer.mockResolvedValue({
      id: "c1",
      name: "Updated",
      email: "test@test.com",
    });
    const req = new NextRequest("http://localhost/api/admin/customers/c1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated" }),
    });
    const res = await PATCH(req, makeCtx("c1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.customer.name).toBe("Updated");
  });

  it("updates customer email", async () => {
    mocks.db.updateCustomer.mockResolvedValue({
      id: "c1",
      name: "Test",
      email: "new@test.com",
    });
    const req = new NextRequest("http://localhost/api/admin/customers/c1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "new@test.com" }),
    });
    const res = await PATCH(req, makeCtx("c1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.customer.email).toBe("new@test.com");
  });

  it("returns 400 for empty body (no name or email)", async () => {
    const req = new NextRequest("http://localhost/api/admin/customers/c1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await PATCH(req, makeCtx("c1"));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid email format", async () => {
    const req = new NextRequest("http://localhost/api/admin/customers/c1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "not-an-email" }),
    });
    const res = await PATCH(req, makeCtx("c1"));
    expect(res.status).toBe(400);
  });

  it("returns 404 when customer not found for update", async () => {
    mocks.db.updateCustomer.mockResolvedValue(null);
    const req = new NextRequest("http://localhost/api/admin/customers/c999", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Name" }),
    });
    const res = await PATCH(req, makeCtx("c999"));
    expect(res.status).toBe(404);
  });

  it("returns 401 when not authenticated", async () => {
    mocks.requireAdmin.mockResolvedValueOnce(AUTH_FAIL);
    const req = new NextRequest("http://localhost/api/admin/customers/c1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New" }),
    });
    const res = await PATCH(req, makeCtx("c1"));
    expect(res.status).toBe(401);
  });
});
