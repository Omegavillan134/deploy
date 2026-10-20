import crypto from "crypto";

const key = crypto
  .createHash("sha256")
  .update(process.env.NEXTAUTH_SECRET ?? "cvsu-dev-secret")
  .digest();

const TTL_MS = 5 * 60_000;

export function newChallenge() {
  const a = crypto.randomInt(2, 10);
  const b = crypto.randomInt(2, 10);
  const exp = Date.now() + TTL_MS;
  const payload = `${a + b}|${exp}`;
  const sig = crypto.createHmac("sha256", key).update(payload).digest("base64url");
  return { a, b, token: `${Buffer.from(payload).toString("base64url")}.${sig}` };
}

export function checkChallenge(token: string, answer: number): boolean {
  const [p, s] = token.split(".");
  if (!p || !s || !Number.isFinite(answer)) return false;
  let payload: string;
  try {
    payload = Buffer.from(p, "base64url").toString();
  } catch {
    return false;
  }
  const expect = crypto.createHmac("sha256", key).update(payload).digest("base64url");
  const a = Buffer.from(expect), b = Buffer.from(s);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  const [sum, exp] = payload.split("|").map(Number);
  return Date.now() < exp && sum === answer;
}
