# CVSU LMS

Learning platform for Cavite State University – Carmona Campus.  
Students, teachers, and admins can run classes, submit work, grade, and track attendance.

## What you need

- Node.js 18+
- A Postgres database (e.g. [Neon](https://neon.tech))
- (Optional) Google Apps Script URL for sending OTP emails

## Setup

```bash
npm install
```

Create a file named `.env.local` in the project root:

```env
DATABASE_URL="your-neon-postgres-url"
NEXTAUTH_SECRET="long-random-string"
NEXTAUTH_URL="http://localhost:3000"
ALLOW_DEVCODES=true
```

Optional email (Google Apps Script):

```env
EMAIL_FROM="CVSU LMS <you@gmail.com>"
MAIL_WEBHOOK_URL="https://script.google.com/macros/s/XXXX/exec"
MAIL_WEBHOOK_SECRET="same-secret-as-in-the-script"
```

Then:

```bash
npx prisma generate
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Create an admin

```bash
# PowerShell
$env:ADMIN_EMAIL="you@cvsu.edu.ph"
$env:ADMIN_PASSWORD="YourStrongPassword1"
npx tsx scripts/create-admin.ts
```

## Useful scripts

| Command | What it does |
|---------|----------------|
| `npm run dev` | Start locally |
| `npm run build` | Production build |
| `npm run test:smoke` | API smoke test (needs `ALLOW_DEVCODES=true`) |
| `npx prisma studio` | Browse the database in the browser |

## Notes

- Only `@cvsu.edu.ph` emails can register.
- `ALLOW_DEVCODES=true` puts OTP codes in the API response for local testing. **Never** set this on Vercel production.
- Deploy on Vercel: set the same env vars in the project settings (without `ALLOW_DEVCODES`).
