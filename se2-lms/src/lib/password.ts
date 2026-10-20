
import crypto from "crypto";

const KEYLEN = 64;
const SCRYPT_OPTS = { N: 16384, r: 8, p: 1 } as const;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, KEYLEN, SCRYPT_OPTS).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (stored.startsWith("scrypt:")) {
    const [, salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const candidate = crypto.scryptSync(password, salt, KEYLEN, SCRYPT_OPTS);
    const expected = Buffer.from(hash, "hex");
    return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
  }
  if (stored.startsWith("$argon2")) {
    try {
      const argon2 = (await import("argon2")).default;
      return await argon2.verify(stored, password);
    } catch {
      return false;
    }
  }
  return false;
}
