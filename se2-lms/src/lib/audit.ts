import { db } from "@/lib/db";
import { clientIp } from "./rate-limit";

export async function audit(actorId: string | null, action: string, target?: string, meta?: object, req?: Request) {
  await db.auditLog.create({
    data: { actorId, action, target, meta, ip: req ? clientIp(req) : null },
  }).catch(() => {});
}

export async function securityEvent(type: string, opts: { userId?: string; ip?: string; detail?: string }) {
  await db.securityEvent.create({ data: { type, userId: opts.userId, ip: opts.ip, detail: opts.detail } }).catch(() => {});
}
