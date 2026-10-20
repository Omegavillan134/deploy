import { db } from "@/lib/db";

export async function notify(userId: string, title: string, body: string, link?: string) {
  await db.notification.create({ data: { userId, title, body, link } });
}

export async function notifyMany(userIds: string[], title: string, body: string, link?: string) {
  if (!userIds.length) return;
  await db.notification.createMany({
    data: userIds.map((userId) => ({ userId, title, body, link })),
  });
}
