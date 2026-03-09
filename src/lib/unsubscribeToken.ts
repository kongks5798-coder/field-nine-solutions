import { SignJWT, jwtVerify } from "jose";

const ALGORITHM = "HS256";
const EXPIRY = "30d";

function getSecret(): Uint8Array {
  const raw = process.env.UNSUBSCRIBE_SECRET ?? process.env.JWT_SECRET;
  if (!raw) throw new Error("UNSUBSCRIBE_SECRET or JWT_SECRET env var is required");
  return new TextEncoder().encode(raw);
}

/**
 * Generates a signed 30-day unsubscribe token.
 * @param userId  - Supabase user UUID
 * @param type    - 'marketing' | 'all'
 */
export async function generateUnsubscribeToken(
  userId: string,
  type: "marketing" | "all"
): Promise<string> {
  return new SignJWT({ uid: userId, type })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(getSecret());
}

export interface UnsubscribePayload {
  userId: string;
  type: "marketing" | "all";
}

/**
 * Verifies a token and returns the payload, or null if invalid/expired.
 */
export async function verifyUnsubscribeToken(
  token: string
): Promise<UnsubscribePayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: [ALGORITHM] });
    const uid = payload["uid"];
    const type = payload["type"];
    if (typeof uid !== "string" || (type !== "marketing" && type !== "all")) return null;
    return { userId: uid, type };
  } catch {
    return null;
  }
}
