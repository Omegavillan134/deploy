import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import Link from "next/link";
import Icon from "@/components/ui/Icon";

export default async function NotificationsPage() {
  const user = (await getSessionUser())!;
  const items = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-forest-900 tracking-tight">Notifications</h1>
          <p className="text-sm text-ink-soft mt-1">{items.filter((i) => !i.readAt).length} unread</p>
        </div>
        {items.some((i) => !i.readAt) && (
          <form action="/api/notifications/read-all" method="post">
            <button className="btn-outline btn-sm" type="submit">Mark all read</button>
          </form>
        )}
      </div>

      {items.length === 0 ? (
        <div className="card p-10 text-center">
          <Icon name="notifications_off" className=" text-4xl text-forest-700" />
          <p className="mt-3 font-semibold text-ink">All caught up</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((n) => (
            <li key={n.id}>
              <Link
                href={n.link ?? "/dashboard/notifications"}
                className={`card block p-5 transition-all hover:shadow-float ${!n.readAt ? "border-l-4 border-l-forest-700" : ""}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-ink">{n.title}</p>
                    <p className="text-xs text-ink-soft mt-1">{n.body}</p>
                  </div>
                  <span className="shrink-0 text-[11px] text-ink-soft">{new Date(n.createdAt).toLocaleDateString()}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
