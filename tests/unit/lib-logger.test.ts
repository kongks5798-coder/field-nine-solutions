// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}));

vi.mock("pino", () => {
  const mockLogger = {
    debug: mocks.debug,
    info: mocks.info,
    warn: mocks.warn,
    error: mocks.error,
  };
  const pinoFn = () => mockLogger;
  pinoFn.stdTimeFunctions = { isoTime: () => "" };
  return { default: pinoFn };
});

import { log } from "@/lib/logger";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("lib/logger", () => {
  describe("log.debug()", () => {
    it("calls pino debug with message", () => {
      log.debug("test debug");
      expect(mocks.debug).toHaveBeenCalledWith({}, "test debug");
    });

    it("passes context when provided", () => {
      log.debug("test debug", { key: "val" });
      expect(mocks.debug).toHaveBeenCalledWith({ key: "val" }, "test debug");
    });
  });

  describe("log.info()", () => {
    it("calls pino info with message", () => {
      log.info("test info");
      expect(mocks.info).toHaveBeenCalledWith({}, "test info");
    });
  });

  describe("log.warn()", () => {
    it("calls pino warn with message", () => {
      log.warn("test warn");
      expect(mocks.warn).toHaveBeenCalledWith({}, "test warn");
    });
  });

  describe("log.error()", () => {
    it("calls pino error with message", () => {
      log.error("test error");
      expect(mocks.error).toHaveBeenCalledWith({}, "test error");
    });
  });

  describe("log.api()", () => {
    it("logs API call with method, path, status, and ms", () => {
      log.api("GET", "/api/health", 200, 42);
      expect(mocks.info).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "GET",
          path: "/api/health",
          status: 200,
          ms: 42,
        }),
        "GET /api/health 200 42ms",
      );
    });

    it("includes extra context when provided", () => {
      log.api("POST", "/api/test", 201, 100, { userId: "u1" });
      expect(mocks.info).toHaveBeenCalledWith(
        expect.objectContaining({
          method: "POST",
          path: "/api/test",
          status: 201,
          ms: 100,
          userId: "u1",
        }),
        "POST /api/test 201 100ms",
      );
    });
  });

  describe("log.security()", () => {
    it("logs security event with [SECURITY] prefix", () => {
      log.security("csrf.invalid_token", { ip: "1.2.3.4" });
      expect(mocks.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          security: true,
          event: "csrf.invalid_token",
          ip: "1.2.3.4",
        }),
        "[SECURITY] csrf.invalid_token",
      );
    });
  });

  describe("log.billing()", () => {
    it("logs billing event with [BILLING] prefix", () => {
      log.billing("payment.succeeded", { amount: 39000 });
      expect(mocks.info).toHaveBeenCalledWith(
        expect.objectContaining({
          billing: true,
          event: "payment.succeeded",
          amount: 39000,
        }),
        "[BILLING] payment.succeeded",
      );
    });
  });

  describe("log.auth()", () => {
    it("logs auth event with [AUTH] prefix", () => {
      log.auth("login.success", { email: "user@test.com" });
      expect(mocks.info).toHaveBeenCalledWith(
        expect.objectContaining({
          auth: true,
          event: "login.success",
          email: "user@test.com",
        }),
        "[AUTH] login.success",
      );
    });
  });
});
