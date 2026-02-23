/**
 * Server-side admin authentication utility.
 * Verifies the httpOnly "auth" cookie containing a signed JWT.
 */
import { verifyJWT } from "./jwt";

const JWT_SECRET = () =>
  process.env.JWT_SECRET || process.env.SESSION_SECRET || "";

function extractCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const entry = cookieHeader.split(";").find((c) => c.trim().startsWith(`${name}=`));
  return entry ? entry.split("=").slice(1).join("=").trim() : null;
}

type AdminAuthOk = { ok: true };
type AdminAuthFail = { ok: false; response: Response };

/**
 * 서버 측 관리자 인증을 수행한다.
 *
 * 요청의 httpOnly `auth` 쿠키에서 JWT를 추출한 뒤 서명을 검증하고,
 * `sub` 클레임이 `"admin"`인지 확인한다.
 *
 * @param req - 인증을 검증할 들어오는 HTTP {@link Request} 객체
 * @returns `{ ok: true }` (인증 성공) 또는 `{ ok: false, response }` (인증 실패).
 *          실패 시 `response`는 즉시 클라이언트에 반환할 수 있는 JSON 응답이다.
 *
 * @throws 이 함수는 예외를 직접 던지지 않으며, 모든 에러를 판별 공용체(discriminated union)로 반환한다.
 *
 * @example
 * ```ts
 * const auth = await requireAdmin(request);
 * if (!auth.ok) return auth.response; // 401 또는 500
 * // 이후 관리자 전용 로직 수행
 * ```
 *
 * 에러 케이스:
 * - **500**: `JWT_SECRET` / `SESSION_SECRET` 환경변수가 모두 설정되지 않은 경우
 * - **401**: `auth` 쿠키가 없거나, JWT 검증 실패, 또는 `sub !== "admin"`인 경우
 */
export async function requireAdmin(req: Request): Promise<AdminAuthOk | AdminAuthFail> {
  const secret = JWT_SECRET();
  if (!secret) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Server misconfigured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }

  const token = extractCookie(req.headers.get("cookie"), "auth");
  if (!token) {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }

  const payload = await verifyJWT(token, secret);
  if (!payload || payload.sub !== "admin") {
    return {
      ok: false,
      response: new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }

  return { ok: true };
}
