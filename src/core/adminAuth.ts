/**
 * Server-side admin authentication utility.
 * Verifies the httpOnly "auth" cookie containing a signed JWT.
 */
import { verifyJWT } from "./jwt";

const JWT_SECRET = () =>
  process.env.JWT_SECRET || process.env.SESSION_SECRET || "secret";

function extractCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const entry = cookieHeader.split(";").find((c) => c.trim().startsWith(`${name}=`));
  return entry ? entry.split("=").slice(1).join("=").trim() : null;
}

type AdminAuthOk = { ok: true };
type AdminAuthFail = { ok: false; response: Response };

export async function requireAdmin(req: Request): Promise<AdminAuthOk | AdminAuthFail> {
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

  const payload = await verifyJWT(token, JWT_SECRET());
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
