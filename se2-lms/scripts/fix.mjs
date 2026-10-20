#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const fixed = [];
const note = (m) => { fixed.push(m); console.log(`  FIX  ${m}`); };
const run = (cmd) => {
  try { execSync(cmd, { stdio: "pipe", cwd: root }); return true; }
  catch (e) { console.log(`  SKIP ${cmd.split(" ")[0]} — ${String(e.message).split("\n")[0]}`); return false; }
};

console.log("\n== CVSU LMS auto-fixer ==\n");

const templates = {
  "src/app/error.tsx": `"use client";
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-mint-50/40 px-4">
      <div className="card max-w-md p-8 text-center">
        <h1 className="text-xl font-extrabold text-forest-900">Something went wrong</h1>
        <p className="mt-2 text-sm text-ink-soft">An unexpected error occurred.</p>
        <button onClick={reset} className="btn-primary btn-sm mt-6">Try again</button>
      </div>
    </main>
  );
}
`,
  "src/app/not-found.tsx": `import Link from "next/link";
export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-mint-50/40 px-4">
      <div className="card max-w-md p-10 text-center">
        <p className="text-6xl font-extrabold text-forest-800">404</p>
        <p className="mt-2 text-sm text-ink-soft">Page not found.</p>
        <Link href="/" className="btn-primary btn-sm mt-6 inline-flex">Home</Link>
      </div>
    </main>
  );
}
`,
};
for (const [rel, tpl] of Object.entries(templates)) {
  if (!existsSync(path.join(root, rel))) {
    writeFileSync(path.join(root, rel), tpl);
    note(`scaffolded missing ${rel}`);
  }
}

if (!existsSync(path.join(root, ".env")) && existsSync(path.join(root, ".env.example"))) {
  writeFileSync(path.join(root, ".env"), readFileSync(path.join(root, ".env.example"), "utf8"));
  note("created .env from .env.example (edit secrets before production!)");
}

if (existsSync(path.join(root, "node_modules"))) {
  if (run("npx next lint --fix")) note("eslint --fix applied");
  if (run('npx prettier --write "src*.{ts,tsx,css}" "*.json" --log-level warn')) note("prettier formatted sources");
} else {
  console.log("  INFO node_modules not installed — skipping eslint/prettier (run npm install first)");
}

console.log(fixed.length ? `\nFixed ${fixed.length} issue(s).` : "\nNothing to fix — project looks good.");
console.log("Run \`npm run doctor\` to verify.\n");
