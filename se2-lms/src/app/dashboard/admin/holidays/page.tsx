import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import HolidaysClient from "@/components/dashboard/admin/HolidaysClient";

export default async function HolidaysPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") redirect("/dashboard");
  const holidays = await db.holiday.findMany({ orderBy: { date: "asc" } });
  return <HolidaysClient holidays={holidays.map((h) => ({ id: h.id, name: h.name, date: h.date.toISOString().slice(0, 10), recurring: h.recurring }))} />;
}
