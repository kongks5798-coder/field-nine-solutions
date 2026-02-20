import { SignJWT, jwtVerify } from "jose";

function getKey(secret: string) {
  return new TextEncoder().encode(secret);
}

export async function signJWT(
  payload: Record<string, unknown>,
  secret: string,
  expiresIn: number
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresIn)
    .sign(getKey(secret));
}

export async function verifyJWT(
  token: string,
  secret: string
): Promise<Record<string, unknown> | null> {
  try {
    const { payload } = await jwtVerify(token, getKey(secret));
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}
