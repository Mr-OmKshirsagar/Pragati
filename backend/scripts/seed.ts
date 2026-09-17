import "dotenv/config";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import * as schema from "../drizzle/schema";

async function seed() {
  console.log("==================================================");
  console.log("      PRAGATI DATABASE IDEMPOTENT SEED SCRIPT     ");
  console.log("==================================================\n");

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to seed database.");
  }

  const client = postgres(process.env.DATABASE_URL, { max: 5 });
  const db = drizzle(client, { schema });

  try {
    // ------------------------------------------------------------------------
    // 1. INSTITUTION: Northstar Institute of Technology
    // ------------------------------------------------------------------------
    console.log("1. Seeding Institution...");
    let [inst] = await db
      .select()
      .from(schema.institutions)
      .where(eq(schema.institutions.code, "NIT-001"))
      .limit(1);

    if (!inst) {
      [inst] = await db
        .insert(schema.institutions)
        .values({
          name: "Northstar Institute of Technology",
          code: "NIT-001",
        })
        .returning();
      console.log(`   ✅ Created Institution: ${inst.name} (${inst.code})`);
    } else {
      console.log(`   ℹ️ Institution exists: ${inst.name}`);
    }

    // ------------------------------------------------------------------------
    // 2. DEPARTMENT: Computer Science and Engineering (CSE)
    // ------------------------------------------------------------------------
    console.log("\n2. Seeding Department...");
    let [dept] = await db
      .select()
      .from(schema.departments)
      .where(eq(schema.departments.code, "CSE"))
      .limit(1);

    if (!dept) {
      [dept] = await db
        .insert(schema.departments)
        .values({
          institutionId: inst.id,
          name: "Computer Science and Engineering",
          code: "CSE",
        })
        .returning();
      console.log(`   ✅ Created Department: ${dept.name} (${dept.code})`);
    } else {
      console.log(`   ℹ️ Department exists: ${dept.name}`);
    }

    // ------------------------------------------------------------------------
    // 3. SEED PERSONAS & USERS
    // ------------------------------------------------------------------------
    console.log("\n3. Seeding User Personas...");
    const seedUsersData = [
      {
        id: "10000000-0000-0000-0000-000000000001",
        name: "Dr. Anand Verma",
        email: "faculty@northstar.edu",
        role: "FACULTY" as const,
      },
      {
        id: "10000000-0000-0000-0000-000000000002",
        name: "Prof. Sunita Rao",
        email: "hod.cse@northstar.edu",
        role: "HOD" as const,
      },
      {
        id: "10000000-0000-0000-0000-000000000004",
        name: "Platform Administrator",
        email: "admin@northstar.edu",
        role: "ADMIN" as const,
      },
      {
        id: "10000000-0000-0000-0000-000000000005",
        name: "Rahul Sharma",
        email: "student@northstar.edu",
        role: "STUDENT" as const,
      },
    ];

    const usersMap: Record<string, schema.User> = {};

    for (const u of seedUsersData) {
      let [existing] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, u.email))
        .limit(1);

      if (!existing) {
        [existing] = await db
          .insert(schema.users)
          .values({
            id: u.id,
            institutionId: inst.id,
            departmentId: dept.id,
            name: u.name,
            email: u.email,
            role: u.role,
          })
          .returning();
        console.log(`   ✅ Created User: ${existing.name} (${existing.role})`);
      } else {
        console.log(`   ℹ️ User exists: ${existing.name} (${existing.role})`);
      }
      usersMap[u.role] = existing;
    }

    const facultyUser = usersMap["FACULTY"];
    const studentUser = usersMap["STUDENT"];
    const adminUser = usersMap["ADMIN"];

    // ------------------------------------------------------------------------
    // 4. STUDENT PROFILE: Rahul Sharma
    // ------------------------------------------------------------------------
    console.log("\n4. Seeding Student Profile for Rahul Sharma...");
    let [studentProfile] = await db
      .select()
      .from(schema.studentProfiles)
      .where(eq(schema.studentProfiles.userId, studentUser.id))
      .limit(1);

    if (!studentProfile) {
      [studentProfile] = await db
        .insert(schema.studentProfiles)
        .values({
          userId: studentUser.id,
          institutionId: inst.id,
          departmentId: dept.id,
          assignedFacultyId: facultyUser.id,
          enrollmentNumber: "CSE2024042",
          program: "B.Tech Computer Science and Engineering",
          section: "A",
          currentSemester: 6,
          admissionYear: 2021,
          graduationYear: 2025,
        })
        .returning();
      console.log(`   ✅ Created Student Profile: Rahul Sharma (${studentProfile.enrollmentNumber})`);
    } else {
      console.log(`   ℹ️ Student Profile exists: ${studentProfile.enrollmentNumber}`);
    }

    // ------------------------------------------------------------------------
    // 5. ACADEMIC RECORDS: Semesters 1 to 5
    // ------------------------------------------------------------------------
    console.log("\n5. Seeding Academic Records (Semesters 1-5)...");
    const semesterData = [
      { sem: 1, year: "2021-22", sgpa: "8.50", cgpa: "8.50" },
      { sem: 2, year: "2021-22", sgpa: "8.40", cgpa: "8.45" },
      { sem: 3, year: "2022-23", sgpa: "8.60", cgpa: "8.50" },
      { sem: 4, year: "2022-23", sgpa: "8.10", cgpa: "8.40" },
      { sem: 5, year: "2023-24", sgpa: "8.50", cgpa: "8.42" },
    ];

    for (const record of semesterData) {
      const existing = await db
        .select()
        .from(schema.academicRecords)
        .where(
          eq(schema.academicRecords.studentId, studentProfile.id)
        );

      const alreadyHasSem = existing.some((e) => e.semester === record.sem);
      if (!alreadyHasSem) {
        await db.insert(schema.academicRecords).values({
          studentId: studentProfile.id,
          semester: record.sem,
          academicYear: record.year,
          sgpa: record.sgpa,
          cgpa: record.cgpa,
          totalCredits: 20,
        });
        console.log(`   ✅ Inserted Academic Record Sem ${record.sem} (SGPA: ${record.sgpa}, CGPA: ${record.cgpa})`);
      }
    }

    // ------------------------------------------------------------------------
    // 6. SUBJECTS & BACKLOGS
    // ------------------------------------------------------------------------
    console.log("\n6. Seeding Subjects & Backlogs...");
    const subjectsData = [
      { code: "CS301", name: "Data Structures & Algorithms", credits: 4, sem: 3 },
      { code: "CS302", name: "Object-Oriented Programming", credits: 3, sem: 3 },
      { code: "CS401", name: "Operating Systems", credits: 4, sem: 4 },
      { code: "CS402", name: "Database Management Systems", credits: 4, sem: 4 },
      { code: "CS501", name: "Computer Networks", credits: 3, sem: 5 },
      { code: "CS502", name: "Python Programming", credits: 3, sem: 5 },
    ];

    const subjectsMap: Record<string, schema.Subject> = {};
    for (const sub of subjectsData) {
      let [existingSub] = await db
        .select()
        .from(schema.subjects)
        .where(eq(schema.subjects.code, sub.code))
        .limit(1);

      if (!existingSub) {
        [existingSub] = await db
          .insert(schema.subjects)
          .values({
            departmentId: dept.id,
            code: sub.code,
            name: sub.name,
            credits: sub.credits,
            semester: sub.sem,
          })
          .returning();
        console.log(`   ✅ Created Subject: ${existingSub.code} - ${existingSub.name}`);
      }
      subjectsMap[sub.code] = existingSub;
    }

    // Active Backlog in Operating Systems (CS401)
    const osSubject = subjectsMap["CS401"];
    if (osSubject) {
      const [existingBacklog] = await db
        .select()
        .from(schema.backlogs)
        .where(eq(schema.backlogs.studentId, studentProfile.id))
        .limit(1);

      if (!existingBacklog) {
        await db.insert(schema.backlogs).values({
          studentId: studentProfile.id,
          subjectId: osSubject.id,
          semester: 4,
          status: "ACTIVE",
        });
        console.log(`   ⚠️ Created Active Backlog: CS401 Operating Systems (Semester 4)`);
      } else {
        console.log(`   ℹ️ Active backlog already seeded`);
      }
    }

    // ------------------------------------------------------------------------
    // 7. SKILLS TAXONOMY
    // ------------------------------------------------------------------------
    console.log("\n7. Seeding Skills Taxonomy...");
    const skillsList = [
      { name: "Data Structures & Algorithms", category: "Core Technical" },
      { name: "Python", category: "Programming Languages" },
      { name: "DBMS", category: "Data & Storage" },
      { name: "Object-Oriented Programming", category: "Software Engineering" },
      { name: "Operating Systems", category: "Systems & Architecture" },
      { name: "Computer Networks", category: "Systems & Architecture" },
    ];

    const skillsMap: Record<string, schema.Skill> = {};
    for (const s of skillsList) {
      let [existingSkill] = await db
        .select()
        .from(schema.skills)
        .where(eq(schema.skills.name, s.name))
        .limit(1);

      if (!existingSkill) {
        [existingSkill] = await db
          .insert(schema.skills)
          .values({
            name: s.name,
            category: s.category,
            description: `Core proficiency in ${s.name}`,
            isActive: true,
          })
          .returning();
        console.log(`   ✅ Created Skill: ${existingSkill.name} [${existingSkill.category}]`);
      }
      skillsMap[s.name] = existingSkill;
    }

    // ------------------------------------------------------------------------
    // 8. ASSESSMENTS & HISTORICAL DSA SCORES ([78, 70, 61])
    // ------------------------------------------------------------------------
    console.log("\n8. Seeding Assessments & Skill Progression History...");
    const dsaSkill = skillsMap["Data Structures & Algorithms"];

    if (dsaSkill) {
      const historicalCycles = [
        { name: "DSA Assessment Cycle 1", score: "78.00", dateOffsetDays: 60 },
        { name: "DSA Assessment Cycle 2", score: "70.00", dateOffsetDays: 30 },
        { name: "DSA Assessment Cycle 3", score: "61.00", dateOffsetDays: 7 },
      ];

      for (let i = 0; i < historicalCycles.length; i++) {
        const cycle = historicalCycles[i];
        let [assessment] = await db
          .select()
          .from(schema.assessments)
          .where(eq(schema.assessments.name, cycle.name))
          .limit(1);

        if (!assessment) {
          [assessment] = await db
            .insert(schema.assessments)
            .values({
              name: cycle.name,
              departmentId: dept.id,
              skillIds: [dsaSkill.id],
              maxScore: 100,
              durationMinutes: 60,
              status: "PUBLISHED",
            })
            .returning();
        }

        const date = new Date(Date.now() - cycle.dateOffsetDays * 86400000);

        // Check if history already seeded
        const existingHistory = await db
          .select()
          .from(schema.skillHistory)
          .where(eq(schema.skillHistory.studentId, studentProfile.id));

        const historyExists = existingHistory.some((h) => h.assessmentId === assessment.id);
        if (!historyExists) {
          await db.insert(schema.skillHistory).values({
            studentId: studentProfile.id,
            skillId: dsaSkill.id,
            assessmentId: assessment.id,
            score: cycle.score,
            maxScore: "100.00",
            assessmentDate: date,
          });

          await db.insert(schema.assessmentSubmissions).values({
            assessmentId: assessment.id,
            studentId: studentProfile.id,
            score: cycle.score,
            maxScore: "100.00",
            attemptNumber: 1,
            submittedAt: date,
          });
          console.log(`   📉 Seeded DSA Assessment ${cycle.name}: Score ${cycle.score}/100`);
        }
      }
    }

    // ------------------------------------------------------------------------
    // 9. RECRUITMENT DRIVE: ABC Technologies
    // ------------------------------------------------------------------------
    console.log("\n9. Seeding ABC Technologies Placement Drive & Rules...");
    let [drive] = await db
      .select()
      .from(schema.recruitmentDrives)
      .where(eq(schema.recruitmentDrives.companyName, "ABC Technologies"))
      .limit(1);

    if (!drive) {
      const deadline = new Date(Date.now() + 14 * 86400000); // 14 days from now
      [drive] = await db
        .insert(schema.recruitmentDrives)
        .values({
          institutionId: inst.id,
          companyName: "ABC Technologies",
          jobTitle: "Associate Software Engineer",
          description: "Core backend engineering role working on scalable cloud systems.",
          ctcOrStipend: "12 LPA",
          applicationDeadline: deadline,
          status: "PUBLISHED",
          createdBy: adminUser.id,
        })
        .returning();

      // Seed AST Placement Rule
      const ruleAST = {
        type: "AND",
        conditions: [
          { field: "cgpa", operator: ">=", value: 7.5 },
          { field: "active_backlogs", operator: "==", value: 0 },
          { field: "skill.dsa", operator: ">=", value: 70 },
          { field: "internship.status", operator: "==", value: "COMPLETED" },
        ],
      };

      await db.insert(schema.placementRules).values({
        recruitmentDriveId: drive.id,
        version: 1,
        ruleDefinition: ruleAST,
        isActive: true,
        createdBy: adminUser.id,
      });

      console.log(`   ✅ Seeded Drive: ${drive.companyName} - ${drive.jobTitle} (${drive.ctcOrStipend})`);
      console.log(`   📜 Seeded Placement Rule AST: CGPA >= 7.5, Backlogs == 0, DSA >= 70, Internship == COMPLETED`);
    } else {
      console.log(`   ℹ️ Drive exists: ${drive.companyName}`);
    }

    console.log("\n==================================================");
    console.log("          SEED DATA COMPLETED SUCCESSFULLY        ");
    console.log("==================================================");
  } finally {
    await client.end();
  }
}

seed().catch((err) => {
  console.error("❌ Seed Failed:", err);
  process.exit(1);
});
