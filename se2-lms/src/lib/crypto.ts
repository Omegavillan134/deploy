

import crypto from "crypto";

const KEY: Buffer = (() => {
  const raw = process.env.DATA_ENCRYPTION_KEY ?? process.env.NEXTAUTH_SECRET ?? "dev-insecure-key-change-me";
  return crypto.createHash("sha256").update(raw).digest();
})();

export function encrypt(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64")}.${tag.toString("base64")}.${enc.toString("base64")}`;
}

export function decrypt(stored: string): string {
  const [iv, tag, data] = stored.split(".");
  if (!iv || !tag || !data) return stored;
  const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64")), decipher.final()]).toString("utf8");
}
