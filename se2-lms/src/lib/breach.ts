import crypto from "crypto";

export async function isBreachedPassword(password: string): Promise<boolean> {
  if (process.env.HIBP_CHECK !== "true") return false;
  try {
    const sha1 = crypto.createHash("sha1").update(password).digest("hex").toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3000);
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true" },
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return false; 
    const text = await res.text();
    return text.split("\n").some((line) => line.split(":")[0].trim() === suffix);
  } catch {
    return false;
  }
}
