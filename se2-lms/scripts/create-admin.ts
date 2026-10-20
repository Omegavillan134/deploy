import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const db = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? "admin@cvsu.edu.ph").toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "Admin#12345";
  const user = await db.user.upsert({
    where: { email },
    update: { passwordHash: hashPassword(password), role: "ADMIN", approved: true },
    create: {
      email,
      passwordHash: hashPassword(password),
      firstName: "System",
      lastName: "Administrator",
      role: "ADMIN",
      approved: true,
    },
  });
  console.log(`Admin ready: ${user.email}`);
}

main().finally(() => db.$disconnect());
