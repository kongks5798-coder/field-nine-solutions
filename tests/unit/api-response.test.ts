// @vitest-environment node
import { describe, it, expect } from "vitest";
import {
  apiError,
  apiSuccess,
  apiForbidden,
  apiUnauthorized,
  apiBadRequest,
  apiServerError,
} from "@/lib/api-response";

describe("apiError", () => {
  it("올바른 status와 body 구조를 반환한다", async () => {
    const res = apiError("문제가 발생했습니다", 422, "VALIDATION");
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body).toEqual({ error: "문제가 발생했습니다", code: "VALIDATION" });
  });

  it("code가 없으면 body에 code 필드가 포함되지 않는다", async () => {
    const res = apiError("에러", 500);
    const body = await res.json();
    expect(body).toEqual({ error: "에러" });
    expect(body).not.toHaveProperty("code");
  });
});

describe("apiSuccess", () => {
  it("data 래핑으로 응답한다", async () => {
    const res = apiSuccess({ items: [1, 2, 3] });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ data: { items: [1, 2, 3] } });
  });

  it("커스텀 status를 지원한다", async () => {
    const res = apiSuccess({ id: "new" }, 201);
    expect(res.status).toBe(201);
  });
});

describe("apiForbidden", () => {
  it("403 + FORBIDDEN 코드를 반환한다", async () => {
    const res = apiForbidden();
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("접근 권한이 없습니다");
    expect(body.code).toBe("FORBIDDEN");
  });

  it("커스텀 메시지를 지원한다", async () => {
    const res = apiForbidden("관리자 전용");
    const body = await res.json();
    expect(body.error).toBe("관리자 전용");
  });
});

describe("apiUnauthorized", () => {
  it("401 + UNAUTHORIZED 코드를 반환한다", async () => {
    const res = apiUnauthorized();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("인증이 필요합니다");
    expect(body.code).toBe("UNAUTHORIZED");
  });
});

describe("apiBadRequest", () => {
  it("400 + BAD_REQUEST 코드와 메시지를 반환한다", async () => {
    const res = apiBadRequest("잘못된 입력입니다");
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("잘못된 입력입니다");
    expect(body.code).toBe("BAD_REQUEST");
  });
});

describe("apiServerError", () => {
  it("500 + INTERNAL_ERROR 코드를 반환한다", async () => {
    const res = apiServerError();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("서버 오류가 발생했습니다");
    expect(body.code).toBe("INTERNAL_ERROR");
  });
});
