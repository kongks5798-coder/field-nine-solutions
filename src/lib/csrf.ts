import { randomBytes, createHmac } from "crypto";

const CSRF_SECRET = process.env.CSRF_SECRET || "dalkak-csrf-default-secret";
const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export function generateCsrfToken(): string {
  const timestamp = Date.now().toString(36);
  const random = randomBytes(16).toString("hex");
  const payload = `${timestamp}.${random}`;
  const signature = createHmac("sha256", CSRF_SECRET).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

export function validateCsrfToken(token: string): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [timestamp, , signature] = parts;
  const payload = `${parts[0]}.${parts[1]}`;
  const expected = createHmac("sha256", CSRF_SECRET).update(payload).digest("hex");

  // Timing-safe comparison
  if (signature.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < signature.length; i++) {
    mismatch |= signature.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  if (mismatch !== 0) return false;

  // Check expiry
  const ts = parseInt(timestamp, 36);
  if (Date.now() - ts > TOKEN_EXPIRY_MS) return false;

  return true;
}
