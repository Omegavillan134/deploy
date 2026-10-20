
const BASE = process.env.BASE_URL ?? "http://localhost:3000";

async function login(j, email, password) {
  const r1 = await call(j, "POST", "/api/auth/login", { email, password });
  if (r1.status !== 200) return r1;
  if (!r1.data?.devCode) return { status: 500, data: { error: "no devCode — set ALLOW_DEVCODES=true in .env.local (and restart next)" } };
  return call(j, "POST", "/api/auth/otp/verify", { email, code: r1.data.devCode });
}

let passed = 0, failed = 0;

const jar = () => ({ cookie: "" });
const setCookie = (j, res) => {
  const c = res.headers.get("set-cookie");
  if (c) j.cookie = c.split(";")[0];
};
async function call(j, method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json", ...(j.cookie ? { cookie: j.cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  setCookie(j, res);
  let data = null;
  try { data = await res.json(); } catch {}
  return { status: res.status, data };
}

function check(name, cond, extra = "") {
  if (cond) { passed++; console.log(`  PASS ${name}`); }
  else { failed++; console.log(`  FAIL ${name} ${extra}`); }
}

const teacher = jar(), student = jar(), anon = jar();
const t = Date.now();
const teacherEmail = `smoke-teacher-${t}@cvsu.edu.ph`;
const studentEmail = `smoke-student-${t}@cvsu.edu.ph`;

console.log("CVSU LMS smoke test against", BASE);

let r = await call(teacher, "POST", "/api/auth/register", { firstName: "Smoke", lastName: "Teacher", email: teacherEmail, password: "Passw0rd!x", role: "TEACHER" });
check("teacher code sent", r.status === 200 && r.data?.requiresVerification && r.data?.devCode, JSON.stringify(r.data));
r = await call(teacher, "POST", "/api/auth/register/verify", { email: teacherEmail, code: r.data?.devCode });
check("teacher verified (awaiting approval)", r.status === 201 && r.data?.awaitingApproval === true, JSON.stringify(r.data));
const teacherUserId = r.data?.userId;

const admin = jar();
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@cvsu.edu.ph";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "Admin#12345";
r = await login(admin, ADMIN_EMAIL, ADMIN_PASSWORD);
check("admin login (2-step)", r.status === 200, JSON.stringify(r.data));
r = await call(admin, "PATCH", `/api/admin/users/${teacherUserId}`, { approved: true });
check("admin approves teacher", r.status === 200, JSON.stringify(r.data));
r = await login(teacher, teacherEmail, "Passw0rd!x");
check("teacher login after approval (2-step)", r.status === 200, JSON.stringify(r.data));

r = await call(anon, "POST", "/api/auth/register", { firstName: "Bad", lastName: "Domain", email: `smoke-${t}@gmail.com`, password: "Passw0rd!x", role: "STUDENT" });
check("register rejects non-CVSU email", r.status === 400);

r = await call(student, "POST", "/api/auth/register", { firstName: "Smoke", lastName: "Student", email: studentEmail, password: "Passw0rd!x", role: "STUDENT" });
check("student code sent", r.status === 200 && r.data?.devCode);
r = await call(student, "POST", "/api/auth/register/verify", { email: studentEmail, code: "000000" });
check("register verify rejects wrong code", r.status === 401);
const studentCode = (await call(student, "POST", "/api/auth/register", { firstName: "Smoke", lastName: "Student", email: studentEmail, password: "Passw0rd!x", role: "STUDENT" })).data?.devCode;
r = await call(student, "POST", "/api/auth/register/verify", { email: studentEmail, code: studentCode });
check("student verified + signed in", r.status === 201 && r.data?.user?.role === "STUDENT");

r = await call(anon, "POST", "/api/auth/login", { email: teacherEmail, password: "wrong-password" });
check("login rejects bad password", r.status === 401);
r = await call(anon, "POST", "/api/auth/login", { email: teacherEmail, password: "Passw0rd!x" });
check("password accepted -> code sent", r.status === 200 && r.data?.requiresVerification && r.data?.devCode, JSON.stringify(r.data));
r = await call(anon, "POST", "/api/auth/otp/verify", { email: teacherEmail, code: "000000" });
check("login rejects wrong code", r.status === 401);
r = await login(anon, teacherEmail, "Passw0rd!x");
check("teacher login (2-step)", r.status === 200 && r.data?.ok);

r = await call(anon, "GET", "/api/auth/me");
check("session /me", r.status === 200 && r.data?.user?.email === teacherEmail);

r = await call(teacher, "POST", "/api/classes", { name: "SMK 101 — Smoke Test Class", section: "TST-1" });
check("teacher creates class", r.status === 201 && r.data?.code, JSON.stringify(r.data));
const classId = r.data?.classId, classCode = r.data?.code;

r = await call(student, "POST", "/api/classes/join", { code: "BADCODE" });
check("join rejects bad code", r.status === 404);
r = await call(student, "POST", "/api/classes/join", { code: classCode });
check("student joins class", r.status === 200);

r = await call(student, "POST", "/api/classes", { name: "Nope", section: "X" });
check("student cannot create class", r.status === 403);

r = await call(teacher, "POST", `/api/classes/${classId}/announcements`, { title: "Welcome", body: "Hello <b>class</b><script>alert(1)</script>" });
check("announcement posted", r.status === 201);
r = await call(student, "GET", "/api/notifications");
check("student notified of announcement", r.data?.notifications?.some?.((n) => n.title.includes("Welcome")) ?? false, JSON.stringify(r.data));

r = await call(teacher, "POST", `/api/classes/${classId}/assignments`, { title: "Smoke Assignment", instructions: "Do the thing", points: 50, dueAt: new Date(Date.now() + 864e5).toISOString() });
check("assignment created", r.status === 201, JSON.stringify(r.data));
const assignmentId = r.data?.id;

r = await call(student, "POST", "/api/submissions", { assignmentId, body: "My work: https://example.com" });
check("student submits", r.status === 201, JSON.stringify(r.data));

r = await call(teacher, "PATCH", `/api/submissions/${r.data?.id}`, { action: "grade", grade: 45, feedback: "Nice" });
check("teacher grades", r.status === 200 && r.data?.status === "GRADED");

r = await call(student, "GET", "/api/notifications");
check("student notified of grade", JSON.stringify(r.data).includes("45"));

r = await call(student, "POST", "/api/portfolio/sections", { kind: "personal", title: "About Me" });
check("portfolio section created", r.status === 201, JSON.stringify(r.data));
const sectionId = r.data?.id;
r = await call(student, "PATCH", `/api/portfolio/sections/${sectionId}`, { visibility: "PUBLIC" });
check("section set public", r.status === 200);
r = await call(student, "POST", "/api/portfolio/achievements", { title: "Smoke Badge" });
check("achievement added", r.status === 201);

r = await call(student, "PATCH", "/api/share/settings", { shareEnabled: true });
check("share enabled", r.status === 200);
r = await call(anon, "GET", `/p/${r.data?.handle ?? ""}`);
r = await fetch(BASE + `/api/share/settings`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: "{}" });
check("share settings rejects anon", r.status === 403);

r = await call(anon, "POST", "/api/auth/login", { email: "nobody@cvsu.edu.ph", password: "xxxxxxxx" });
check("unauth login blocked/401", r.status === 401);

r = await call(teacher, "POST", "/api/auth/logout");
check("logout", r.status === 200);
r = await call(teacher, "GET", "/api/auth/me");
check("session destroyed", r.status === 401);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
