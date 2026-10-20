import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/password";

const db = new PrismaClient();
const PASSWORD = "Demo#12345";

async function main() {
  const hash = hashPassword(PASSWORD);

  const admin = await db.user.upsert({
    where: { email: "admin@cvsu.edu.ph" },
    update: { passwordHash: hash },
    create: { email: "admin@cvsu.edu.ph", passwordHash: hash, firstName: "System", lastName: "Administrator", role: "ADMIN" },
  });

  const [t1, t2] = await Promise.all(
    [
      { email: "teacher1@cvsu.edu.ph", firstName: "Maria", lastName: "Santos" },
      { email: "teacher2@cvsu.edu.ph", firstName: "Jose", lastName: "Reyes" },
    ].map((t) =>
      db.user.upsert({ where: { email: t.email }, update: { passwordHash: hash }, create: { ...t, passwordHash: hash, role: "TEACHER" } })
    )
  );

  const students = await Promise.all(
    ["Ana", "Ben", "Carla", "Daniel", "Ella"].map((first, i) =>
      db.user.upsert({
        where: { email: `student${i + 1}@cvsu.edu.ph` },
        update: { passwordHash: hash },
        create: {
          email: `student${i + 1}@cvsu.edu.ph`,
          passwordHash: hash,
          firstName: first,
          lastName: "Dela Cruz",
          role: "STUDENT",
          studentNumber: `CVSU-2024-00${i + 1}`,
        },
      })
    )
  );

  const classDefs = [
    { name: "CS 301 — Software Engineering", section: "BSCS-3A", teacherId: t1.id, code: "SE-3A26" },
    { name: "CS 312 — Database Systems", section: "BSCS-3B", teacherId: t1.id, code: "DB-3B26" },
    { name: "IT 210 — Web Development", section: "BSIT-2A", teacherId: t2.id, code: "WEB-2A26" },
  ];
  const classes = [];
  for (const c of classDefs) {
    const cls = await db.class.upsert({
      where: { code: c.code },
      update: {},
      create: { ...c, description: `${c.name} class workspace.` },
    });
    classes.push(cls);
    await db.enrollment.upsert({
      where: { classId_userId: { classId: cls.id, userId: c.teacherId } },
      update: {},
      create: { classId: cls.id, userId: c.teacherId },
    });
  }
  for (const s of students) {
    for (const cls of classes.slice(0, 2))
      await db.enrollment.upsert({
        where: { classId_userId: { classId: cls.id, userId: s.id } },
        update: {},
        create: { classId: cls.id, userId: s.id },
      });
  }
  for (const s of students.slice(0, 3))
    await db.enrollment.upsert({
      where: { classId_userId: { classId: classes[2].id, userId: s.id } },
      update: {},
      create: { classId: classes[2].id, userId: s.id },
    });

  await db.announcement.create({
    data: {
      classId: classes[0].id,
      authorId: t1.id,
      title: "Welcome to Software Engineering",
      body: "<p>Please review the syllabus and introduce yourself on the stream.</p>",
    },
  });
  const a1 = await db.assignment.create({
    data: {
      classId: classes[0].id,
      title: "Requirements Analysis Document",
      instructions: "<p>Submit a 4-page RAD for your chosen project topic.</p>",
      points: 100,
      dueAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
    },
  });
  await db.assignment.create({
    data: {
      classId: classes[2].id,
      title: "Personal Portfolio Page",
      instructions: "<p>Build a single-page portfolio using semantic HTML and CSS.</p>",
      points: 50,
      dueAt: new Date(Date.now() + 5 * 24 * 3600 * 1000),
    },
  });
  await db.submission.create({
    data: {
      assignmentId: a1.id,
      studentId: students[0].id,
      body: "RAD v1 attached.",
      status: "GRADED",
      grade: 92,
      feedback: "Strong use cases — expand the non-functional requirements.",
    },
  });

  if ((await db.classMeeting.count()) === 0) {
    await db.classMeeting.createMany({
      data: [
        { classId: classes[0].id, dayOfWeek: 1, startTime: "09:00", endTime: "10:30" },
        { classId: classes[0].id, dayOfWeek: 4, startTime: "09:00", endTime: "10:30" },
        { classId: classes[1].id, dayOfWeek: 2, startTime: "13:00", endTime: "14:30" },
      ],
    });
  }
  if ((await db.holiday.count()) === 0) {
    await db.holiday.createMany({
      data: [
        { name: "National Heroes Day", date: new Date("2026-08-31T00:00:00.000Z"), recurring: true },
        { name: "Christmas Day", date: new Date("2026-12-25T00:00:00.000Z"), recurring: true },
      ],
    });
  }
  if ((await db.attendanceRecord.count()) === 0) {
    for (const s of students) {
      for (let d = 1; d <= 3; d++) {
        await db.attendanceRecord.upsert({
          where: { classId_studentId_date: { classId: classes[0].id, studentId: s.id, date: new Date(Date.now() - d * 864e5) } },
          update: {},
          create: { classId: classes[0].id, studentId: s.id, date: new Date(Date.now() - d * 864e5), status: d === 2 && s === students[1] ? "ABSENT" : "PRESENT", markedById: t1.id },
        });
      }
    }
  }

  console.log("Seed complete:", { admin: admin.email, teachers: 2, students: students.length, classes: classes.length });
}

main().finally(() => db.$disconnect());
