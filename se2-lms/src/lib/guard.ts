import { securityEvent } from "./audit";
import { clientIp } from "./rate-limit";

export const hidden = (req: Request, detail?: string) => {
  securityEvent("UNAUTH_PROBE", { ip: clientIp(req), detail }).catch(() => {});
  return Response.json({ error: "Not found." }, { status: 404 });
};
