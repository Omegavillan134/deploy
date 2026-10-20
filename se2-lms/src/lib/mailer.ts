
export async function sendMail(to: string, subject: string, html: string) {
  const devLog = () =>
    console.log(`[mail:dev] to=${to} subject="${subject}"\n${html}`);

  const urls = (process.env.MAIL_WEBHOOK_URL ?? "")
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean);

  if (urls.length === 0) {
    console.warn("[mail] MAIL_WEBHOOK_URL not set — logging to console only");
    devLog();
    return;
  }

  let lastErr: unknown = null;
  for (let i = 0; i < urls.length; i++) {
    try {
      const res = await fetch(urls[i], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: process.env.MAIL_WEBHOOK_SECRET ?? "",
          to,
          subject,
          html,
          from: process.env.EMAIL_FROM ?? "CVSU LMS",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.ok !== true)
        throw new Error(`Webhook#${i + 1} ${res.status}: ${JSON.stringify(data)}`);
      return;
    } catch (e) {
      lastErr = e;
      console.error(`[mail] webhook relay #${i + 1} FAILED to ${to}:`, e);
    }
  }

  console.error(`[mail] all ${urls.length} webhook relay(s) failed`, lastErr);
  devLog();
}

export const signinOtpEmail = (code: string) => `
  <div style="font-family:sans-serif;max-width:420px;margin:auto;padding:32px;border:1px solid #c8e6c9;border-radius:16px">
    <h2 style="color:#1b5e20;margin:0 0 8px">Your CVSU LMS sign-in code</h2>
    <p style="color:#5f6b76;font-size:14px">Enter this one-time code to sign in. It expires in 10 minutes.</p>
    <p style="font-size:32px;letter-spacing:8px;font-weight:700;color:#2e7d32">${code}</p>
    <p style="color:#9aa5ad;font-size:12px">If you did not request this code, you can ignore this email.</p>
  </div>`;

export const verifyOtpEmail = (code: string) => `
  <div style="font-family:sans-serif;max-width:420px;margin:auto;padding:32px;border:1px solid #c8e6c9;border-radius:16px">
    <h2 style="color:#1b5e20;margin:0 0 8px">Verify your CVSU LMS account</h2>
    <p style="color:#5f6b76;font-size:14px">Welcome! Enter this 6-digit code to activate your account. It expires in 10 minutes.</p>
    <p style="font-size:32px;letter-spacing:8px;font-weight:700;color:#2e7d32">${code}</p>
    <p style="color:#9aa5ad;font-size:12px">If you did not create an account, you can ignore this email.</p>
  </div>`;

