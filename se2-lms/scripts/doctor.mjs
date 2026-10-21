#!/usr/bin/env node

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { createConnection } from "node:net";
import path from "node:path";

const root = process.cwd();
let errors = 0, warnings = 0;
const ok = (m) => console.log(`  PASS  ${m}`);
const warn = (m) => { warnings++; console.log(`  WARN  ${m}`); };
const err = (m) => { errors++; console.log(`  FAIL  ${m}`); };

console.log("\n== CVSU LMS doctor ==\n");

const [maj] = process.versions.node.split(".").map(Number);
maj >= 18 ? ok(`Node ${process.versions.node}`) : err(`Node ${process.versions.node} — Node 18+ required`);

for (const f of ["package.json", ".env.example", "prisma/schema.prisma",
                 "src/app/layout.tsx", "src/lib/db.ts", "src/app/api/auth/login/route.ts",
                 "tests/unit/rate-limit.test.ts", "scripts/smoke-test.mjs"]) {
  existsSync(path.join(root, f)) ? ok(`found ${f}`) : err(`missing ${f}`);
}

if (existsSync(path.join(root, ".env"))) {
  ok("found .env");
  const env = readFileSync(path.join(root, ".env"), "utf8");
  for (const key of ["DATABASE_URL", "NEXTAUTH_SECRET", "NEXTAUTH_URL"]) {
    const m = env.match(new RegExp(`^${key}=(.+)$`, "m"));
    if (!m || !m[1]) err(`${key} is missing`);
    else if (m[1].includes("change-me")) err(`${key} is still a placeholder`);
    else if (key === "NEXTAUTH_SECRET" && m[1].length < 16) err("NEXTAUTH_SECRET too short (<16 chars)");
    else ok(`${key} set`);
  }
  const dbUrl = env.match(/^DATABASE_URL="?([^"]+)"?$/m)?.[1];
  if (dbUrl) {
    try {
      const u = new URL(dbUrl);
      const port = Number(u.port || 5432);
      const reachable = await new Promise((res) => {
        const s = createConnection({ host: u.hostname, port, timeout: 1500 });
        s.on("connect", () => { s.end(); res(true); });
        s.on("timeout", () => { s.destroy(); res(false); });
        s.on("error", () => res(false));
      });
      reachable
        ? ok(`database reachable at ${u.hostname}:${port}`)
        : err(`database NOT reachable at ${u.hostname}:${port} — run: docker compose up -d`);
    } catch { err("DATABASE_URL is not a valid URL"); }
  }
} else {
  err(".env missing — run: cp .env.example .env");
}

try {
  const s = readFileSync(path.join(root, "prisma/schema.prisma"), "utf8");
  for (const model of ["User", "Class", "Assignment", "Submission", "Notification"])
    s.includes(`model ${model} `) ? ok(`schema model ${model}`) : err(`schema missing model ${model}`);
} catch { err("could not read prisma/schema.prisma"); }

if (existsSync(path.join(root, ".env"))) {
  const env = readFileSync(path.join(root, ".env"), "utf8");
  if (/^ALLOW_DEVCODES=true$/m.test(env) && process.env.NODE_ENV === "production")
    err("ALLOW_DEVCODES is enabled — verification codes leak in API responses");
  else ok("dev codes gated");
  if (!/^DATA_ENCRYPTION_KEY=/m.test(env))
    warn("DATA_ENCRYPTION_KEY not set — field encryption derives from NEXTAUTH_SECRET");
  else ok("dedicated encryption key set");
  if (/^NEXTAUTH_SECRET=.{1,15}$/m.test(env)) err("NEXTAUTH_SECRET too short (<16 chars)");
}
try {
  const gi = readFileSync(path.join(root, ".gitignore"), "utf8");
  gi.includes(".env") ? ok(".env is gitignored") : err(".env NOT in .gitignore — secrets could be committed");
} catch { err(".gitignore missing"); }

for (const f of ["src/app/error.tsx", "src/app/global-error.tsx", "src/app/not-found.tsx"])
  existsSync(path.join(root, f)) ? ok(`error boundary ${f}`) : err(`missing error boundary ${f}`);

function collect(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith(".") || name === "node_modules" || name === ".next") continue;
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) collect(p, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}
try {
  let scanned = 0;
  for (const f of collect(path.join(root, "src"))) {
    const c = readFileSync(f, "utf8");
    const rel = path.relative(root, f);
    scanned++;
    if (/useSearchParams/.test(c) && c.includes('"use client"') && !c.includes("Suspense"))
      err(`${rel}: useSearchParams without a Suspense boundary (breaks prerendering)`);
    if (/dangerouslySetInnerHTML/.test(c) && !/sanitize|clean/i.test(c) && !rel.includes("p/") && !rel.includes("announcements"))
      warn(`${rel}: dangerouslySetInnerHTML — verify input is sanitized`);
    if (/fetch\(\s*[`"']\/api\//.test(c) && !rel.includes("api/") && !/res\.ok|catch/.test(c))
      warn(`${rel}: fetch to /api without res.ok handling`);
  }
  ok(`scanned ${scanned} source files`);
} catch (e) { warn(`source scan skipped: ${e.message}`); }

console.log(`\n== Result: ${errors} error(s), ${warnings} warning(s) ==\n`);
process.exit(errors ? 1 : 0);
