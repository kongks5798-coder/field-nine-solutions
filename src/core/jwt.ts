export type JWTPayload = Record<string, unknown> & {
  sub?: string;
  exp?: number;
  iat?: number;
};

const textEncoder = new TextEncoder();

function base64url(input: ArrayBuffer | Uint8Array): string {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  let str = "";
  for (let i = 0; i < bytes.length; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  const b64 = btoa(str);
  return b64.replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64urlJSON(obj: unknown): string {
  return base64url(textEncoder.encode(JSON.stringify(obj)));
}

async function importKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    textEncoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function signJWT(
  payload: JWTPayload,
  secret: string,
  expiresInSeconds = 60 * 60
): Promise<string> {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = { ...payload, iat: now, exp: now + expiresInSeconds };
  const encodedHeader = base64urlJSON(header);
  const encodedPayload = base64urlJSON(fullPayload);
  const data = `${encodedHeader}.${encodedPayload}`;
  const key = await importKey(secret);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    textEncoder.encode(data)
  );
  const encodedSignature = base64url(signature);
  return `${data}.${encodedSignature}`;
}

export async function verifyJWT(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const [encodedHeader, encodedPayload, encodedSignature] = token.split(".");
    if (!encodedHeader || !encodedPayload || !encodedSignature) return null;
    const data = `${encodedHeader}.${encodedPayload}`;
    const key = await importKey(secret);
    const signature = Uint8Array.from(
      atob(encodedSignature.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat((4 - (encodedSignature.length % 4)) % 4)),
      c => c.charCodeAt(0)
    );
    const ok = await crypto.subtle.verify("HMAC", key, signature, textEncoder.encode(data));
    if (!ok) return null;
    const payloadStr = atob(encodedPayload.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat((4 - (encodedPayload.length % 4)) % 4));
    const payload: JWTPayload = JSON.parse(payloadStr);
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) return null;
    return payload;
  } catch {
    return null;
  }
}
