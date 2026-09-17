import { COOKIE_NAME } from "@shared/const";
import { dashboardData, opportunitiesData, progressData, skillsData, type Opportunity } from "@shared/pragati";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { sendMail } from "./_core/email";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";

export type PragatiRole = "STUDENT" | "FACULTY" | "HOD" | "TNP_COORDINATOR" | "ADMIN";

export interface PragatiUser {
  id: string;
  name: string;
  email: string;
  role: PragatiRole;
  department: string;
  roleId: string;
  designation: string;
  avatar: string;
}

const DEMO_PERSONAS: Record<PragatiRole, PragatiUser & { demoPassword: string }> = {
  STUDENT: {
    id: "user-student-1",
    name: "Rahul Sharma",
    email: "rahul.sharma@northstar.edu",
    role: "STUDENT",
    department: "Computer Science & Engineering",
    roleId: "CS-2023-0842",
    designation: "B.Tech CSE · Sem 6",
    avatar: "RS",
    demoPassword: "password123",
  },
  FACULTY: {
    id: "user-faculty-1",
    name: "Dr. Meera Nair",
    email: "meera.nair@northstar.edu",
    role: "FACULTY",
    department: "Computer Science & Engineering",
    roleId: "FAC-CS-104",
    designation: "Associate Professor & Mentor",
    avatar: "MN",
    demoPassword: "password123",
  },
  HOD: {
    id: "user-hod-1",
    name: "Dr. Sunita Rao",
    email: "sunita.rao@northstar.edu",
    role: "HOD",
    department: "Computer Science & Engineering",
    roleId: "HOD-CSE-001",
    designation: "Head of Department (CSE)",
    avatar: "SR",
    demoPassword: "password123",
  },
  TNP_COORDINATOR: {
    id: "user-tnp-1",
    name: "Prof. Vikram Mehta",
    email: "vikram.mehta@northstar.edu",
    role: "TNP_COORDINATOR",
    department: "Training & Placement Cell",
    roleId: "TNP-ENG-042",
    designation: "Head of Training & Placement",
    avatar: "VM",
    demoPassword: "password123",
  },
  ADMIN: {
    id: "user-admin-1",
    name: "System Administrator",
    email: "admin@northstar.edu",
    role: "ADMIN",
    department: "Institutional Systems & Governance",
    roleId: "ADM-SYS-001",
    designation: "Platform Administrator",
    avatar: "SA",
    demoPassword: "password123",
  },
};

const usersStore: Map<string, PragatiUser & { passwordHash?: string }> = new Map(
  Object.values(DEMO_PERSONAS).map(user => [user.email.toLowerCase(), user])
);

const FACULTY_WARDS = [
  {
    studentProfileId: "student-rahul-sharma",
    userId: "10000000-0000-0000-0000-000000000005",
    name: "Rahul Sharma",
    email: "student@northstar.edu",
    enrollmentNumber: "CSE2024042",
    program: "B.Tech Computer Science and Engineering",
    currentSemester: 6,
    cgpa: 8.42,
    activeBacklogsCount: 1,
    activeGapsCount: 1,
    activeInterventionsCount: 1,
    status: "NEEDS_ATTENTION" as "NEEDS_ATTENTION" | "ON_TRACK",
    activeGaps: [
      {
        id: "gap-dsa-01",
        skillId: "s1",
        skillName: "Data Structures & Algorithms",
        severity: "HIGH",
        status: "IN_REVIEW",
        reason: {
          score_history: [78, 70, 61],
          active_backlogs: 1,
          trigger_text:
            "Two consecutive score drops accompanied by an active backlog.",
        },
      },
    ],
    recentInterventions: [
      {
        id: "interv-01",
        type: "MENTORING",
        description:
          "1-on-1 mentoring session to review core concepts in Data Structures & Algorithms",
        status: "SCHEDULED",
        startDate: new Date(),
        outcome: null,
      },
    ],
    scorecard: {
      readinessScore: 76,
      attendancePercent: 92,
      creditsEarned: 100,
      totalCredits: 120,
      verifiedEvidenceCount: 9,
      internshipStatus: "Active internship at Atlas Labs",
      academicTrend: [
        { label: "Sem 1", sgpa: 8.5 },
        { label: "Sem 2", sgpa: 8.4 },
        { label: "Sem 3", sgpa: 8.6 },
        { label: "Sem 4", sgpa: 8.1 },
        { label: "Sem 5", sgpa: 8.5 },
        { label: "Sem 6", sgpa: 8.42 },
      ],
      skillScores: [
        { skill: "DSA", score: 78, benchmark: 75, trend: "up" },
        { skill: "Python", score: 84, benchmark: 75, trend: "up" },
        { skill: "DBMS", score: 72, benchmark: 70, trend: "up" },
        { skill: "Operating Systems", score: 61, benchmark: 70, trend: "down" },
        { skill: "Computer Networks", score: 69, benchmark: 70, trend: "up" },
      ],
      recentAssessments: [
        { name: "DSA Assessment Cycle 3", score: 78, date: "12 Sep 2026", status: "Verified" },
        { name: "Python Technical Review", score: 84, date: "10 Sep 2026", status: "Verified" },
        { name: "Operating Systems Review", score: 61, date: "28 Aug 2026", status: "Needs follow-up" },
      ],
    },
  },
];

const ACTIVITY_INVITE_STUDENTS = Array.from(
  new Map(
    [
      ...FACULTY_WARDS.map(ward => ({
        name: ward.name,
        email: ward.email,
        enrollmentNumber: ward.enrollmentNumber,
      })),
      {
        name: DEMO_PERSONAS.STUDENT.name,
        email: DEMO_PERSONAS.STUDENT.email,
        enrollmentNumber: DEMO_PERSONAS.STUDENT.roleId,
      },
      ...(process.env.ACTIVITY_INVITE_EMAILS || "")
        .split(",")
        .map(email => email.trim())
        .filter(Boolean)
        .map(email => ({
          name: "PRAGATI Student",
          email,
          enrollmentNumber: "Department Student",
        })),
    ].map(student => [student.email.toLowerCase(), student])
  ).values()
);

const placementInputSchema = z.object({
  company: z.string().min(1, "Company name required").max(100),
  role: z.string().min(1, "Role required").max(100),
  type: z.enum(["Internship", "Placement"]),
  location: z.string().min(1, "Location required").max(100),
  deadline: z.string().refine(value => !Number.isNaN(Date.parse(value)), "Invalid deadline date"),
  description: z.string().min(10, "Description too short").max(1000),
  skills: z.array(z.string().min(1)).min(1, "At least one skill required").max(10),
  criteria: z.array(
    z.object({
      label: z.string().min(1).max(50),
      expected: z.string().min(1).max(50),
    })
  ).min(1, "At least one eligibility criterion required"),
  verificationRequirements: z.array(z.string().min(1)).min(1).max(5),
});

const tnpUploadedOpportunities: Opportunity[] = [];

function getOpportunityStore() {
  const opportunities = [...opportunitiesData.opportunities, ...tnpUploadedOpportunities];
  return {
    summary: {
      eligible: opportunities.filter(item => item.eligibilityStatus === "Eligible").length,
      internships: opportunities.filter(item => item.type === "Internship").length,
      placements: opportunities.filter(item => item.type === "Placement").length,
      applications: opportunities.filter(item => item.applicationStatus !== "Not applied").length,
    },
    opportunities,
  };
}

function buildOpportunity(input: z.infer<typeof placementInputSchema>): Opportunity {
  const id = `${input.company.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Date.now()}`;
  const deadline = new Date(input.deadline);
  const daysUntilDeadline = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  return {
    id,
    company: input.company,
    role: input.role,
    type: input.type,
    location: input.location,
    deadline: input.deadline,
    deadlineLabel:
      daysUntilDeadline > 0
        ? `Closes in ${daysUntilDeadline} day${daysUntilDeadline === 1 ? "" : "s"}`
        : "Deadline passed",
    eligibilitySummary: `${input.type} opportunity uploaded by the Training & Placement Cell.`,
    eligibilityStatus: "Eligible",
    applicationStatus: "Not applied",
    closingSoon: daysUntilDeadline <= 7,
    description: input.description,
    skills: input.skills,
    criteria: input.criteria.map(criteria => ({
      label: criteria.label,
      actual: "Pending verification",
      expected: criteria.expected,
      pass: true,
    })),
    verificationRequirements: input.verificationRequirements,
  };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    demoAccounts: publicProcedure.query(() => {
      return Object.values(DEMO_PERSONAS).map(({ demoPassword, ...user }) => ({
        ...user,
        hintPassword: demoPassword,
      }));
    }),
    login: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          password: z.string().min(1),
          role: z.enum(["STUDENT", "FACULTY", "HOD", "TNP_COORDINATOR", "ADMIN"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const found = usersStore.get(input.email.toLowerCase());
        if (!found) {
          // Allow demo login fallback if demo user was requested
          const demoFallback = DEMO_PERSONAS[input.role];
          if (demoFallback && (input.email.toLowerCase() === demoFallback.email.toLowerCase() || input.password === "password123")) {
            return { success: true, user: demoFallback };
          }
          throw new Error("Invalid credentials or account not found. Use a Demo Persona or Register.");
        }

        if (found.role !== input.role) {
          throw new Error(`Account registered as ${found.role}, not ${input.role}. Please select the correct role tab.`);
        }

        return { success: true, user: found };
      }),
    register: publicProcedure
      .input(
        z.object({
          name: z.string().min(2),
          email: z.string().email(),
          password: z.string().min(6),
          role: z.enum(["STUDENT", "FACULTY", "HOD", "TNP_COORDINATOR", "ADMIN"]),
          department: z.string().default("Computer Science & Engineering"),
          roleId: z.string().min(2),
          designation: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const key = input.email.toLowerCase();
        if (usersStore.has(key)) {
          throw new Error("An account with this email already exists. Please sign in instead.");
        }

        const initials = input.name
          .split(" ")
          .map(part => part[0])
          .slice(0, 2)
          .join("")
          .toUpperCase() || "U";

        const newUser: PragatiUser = {
          id: `user-${Date.now()}`,
          name: input.name,
          email: input.email,
          role: input.role,
          department: input.department,
          roleId: input.roleId,
          designation: input.designation || `${input.role} (${input.department})`,
          avatar: initials,
        };

        usersStore.set(key, newUser);
        return { success: true, user: newUser };
      }),
    demoLogin: publicProcedure
      .input(z.object({ role: z.enum(["STUDENT", "FACULTY", "HOD", "TNP_COORDINATOR", "ADMIN"]) }))
      .mutation(({ input }) => {
        const personaNames: Record<string, string> = {
          STUDENT: "Rahul Sharma",
          FACULTY: "Dr. Anand Verma",
          HOD: "Prof. Sunita Rao",
          TNP_COORDINATOR: "Vikram Malhotra",
          ADMIN: "Platform Administrator",
        };
        return {
          success: true,
          token: `demo_${input.role}`,
          user: {
            id: "10000000-0000-0000-0000-000000000005",
            name: personaNames[input.role] || "Demo User",
            email: `${input.role.toLowerCase()}@northstar.edu`,
            role: input.role,
            institutionId: "NIT-001",
            departmentId: "CSE",
            studentProfile:
              input.role === "STUDENT"
                ? {
                    id: "student-rahul-sharma",
                    enrollmentNumber: "CSE2024042",
                    program: "B.Tech Computer Science and Engineering",
                    currentSemester: 6,
                  }
                : undefined,
          },
        };
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  student: router({
    dashboard: publicProcedure.query(() => dashboardData),
    opportunities: publicProcedure.query(() => getOpportunityStore()),
    progress: publicProcedure.query(() => progressData),
    skills: publicProcedure.query(() => skillsData),
    getProfile: publicProcedure.query(() => ({
      id: "student-rahul-sharma",
      userId: "10000000-0000-0000-0000-000000000005",
      name: "Rahul Sharma",
      email: "student@northstar.edu",
      avatarUrl: null,
      enrollmentNumber: "CSE2024042",
      program: "B.Tech Computer Science and Engineering",
      section: "A",
      currentSemester: 6,
      admissionYear: 2021,
      graduationYear: 2025,
      institution: { id: "inst-nit-001", name: "Northstar Institute of Technology", code: "NIT-001" },
      department: { id: "dept-cse-001", name: "Computer Science and Engineering", code: "CSE" },
      mentor: { id: "faculty-anand-verma", name: "Dr. Anand Verma", email: "faculty@northstar.edu" },
    })),
    getAcademics: publicProcedure.query(() => ({
      cgpa: 8.42,
      totalCredits: 100,
      activeBacklogsCount: 1,
      semesters: [
        { semester: 1, academicYear: "2021-22", sgpa: 8.5, cgpa: 8.5, totalCredits: 20, subjects: [] },
        { semester: 2, academicYear: "2021-22", sgpa: 8.4, cgpa: 8.45, totalCredits: 20, subjects: [] },
        { semester: 3, academicYear: "2022-23", sgpa: 8.6, cgpa: 8.5, totalCredits: 20, subjects: [] },
        { semester: 4, academicYear: "2022-23", sgpa: 8.1, cgpa: 8.4, totalCredits: 20, subjects: [] },
        { semester: 5, academicYear: "2023-24", sgpa: 8.5, cgpa: 8.42, totalCredits: 20, subjects: [] },
      ],
      backlogs: [
        { id: "backlog-os", subjectCode: "CS401", subjectName: "Operating Systems", semester: 4, status: "ACTIVE" as const },
      ],
    })),
    getSkills: publicProcedure.query(() => ({
      skills: [
        { id: "s1", name: "Data Structures & Algorithms", category: "Core Technical", latestScore: 61, delta: -9, scoreHistory: [78, 70, 61], verified: true },
        { id: "s2", name: "Python", category: "Programming Languages", latestScore: 84, delta: 5, scoreHistory: [72, 79, 84], verified: true },
        { id: "s3", name: "DBMS", category: "Data & Storage", latestScore: 72, delta: 3, scoreHistory: [64, 69, 72], verified: true },
        { id: "s4", name: "Object-Oriented Programming", category: "Software Engineering", latestScore: 81, delta: 5, scoreHistory: [68, 76, 81], verified: true },
        { id: "s5", name: "Operating Systems", category: "Systems & Architecture", latestScore: 61, delta: -9, scoreHistory: [78, 70, 61], verified: true },
        { id: "s6", name: "Computer Networks", category: "Systems & Architecture", latestScore: 69, delta: 5, scoreHistory: [59, 64, 69], verified: true },
      ],
    })),
    getAssessments: publicProcedure.query(() => [
      { id: "assess-dsa-1", name: "DSA Assessment Cycle 1", maxScore: 100, durationMinutes: 60, status: "PUBLISHED" },
      { id: "assess-dsa-2", name: "DSA Assessment Cycle 2", maxScore: 100, durationMinutes: 60, status: "PUBLISHED" },
      { id: "assess-dsa-3", name: "DSA Assessment Cycle 3", maxScore: 100, durationMinutes: 60, status: "PUBLISHED" },
    ]),
    submitAssessment: publicProcedure
      .input(
        z.object({
          assessmentId: z.string(),
          answers: z.record(z.string(), z.any()).optional(),
          score: z.number().optional(),
        })
      )
      .mutation(({ input }) => ({
        success: true,
        submissionId: "demo-sub-id",
        assessmentName: "DSA Assessment",
        score: input.score ?? 85,
        attemptNumber: 1,
        submittedAt: new Date().toISOString(),
      })),
    getInterventions: publicProcedure.query(() => [
      {
        id: "interv-01",
        studentId: "student-rahul-sharma",
        skillGapId: "gap-dsa-01",
        assignedTo: "10000000-0000-0000-0000-000000000001",
        assignedFacultyName: "Dr. Anand Verma",
        type: "MENTORING" as const,
        description:
          "1-on-1 mentoring session to review core concepts in Data Structures & Algorithms and address backlog concepts.",
        status: "SCHEDULED" as const,
        startDate: new Date(),
        endDate: null,
        outcome: null,
        skillGap: {
          id: "gap-dsa-01",
          skillName: "Data Structures & Algorithms",
          severity: "HIGH",
          status: "IN_REVIEW",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]),
  }),
  skillGap: router({
    getMyGaps: publicProcedure.query(() => [
      {
        id: "gap-dsa-01",
        studentId: "student-rahul-sharma",
        skillId: "s1",
        skillName: "Data Structures & Algorithms",
        ruleId: "RULE_GAP_01",
        severity: "HIGH" as const,
        status: "OPEN" as const,
        reason: {
          score_history: [78, 70, 61],
          active_backlogs: 1,
          backlog_subject: "Operating Systems",
          trigger_text: "Two consecutive score drops accompanied by an active backlog.",
        },
        createdAt: new Date(),
        resolvedAt: null,
      },
    ]),
    explainGap: publicProcedure
      .input(z.object({ skillGapId: z.string() }))
      .query(() => ({
        explanation:
          "Data Structures & Algorithms assessment scores declined across consecutive cycles (78 → 70 → 61) while an active backlog in Operating Systems remains unresolved.",
        recommendedAction:
          "Schedule a 1-on-1 faculty mentoring session to review core concepts in Data Structures & Algorithms and Operating Systems remediation.",
        source: "ai" as const,
      })),
    getDepartmentGaps: publicProcedure
      .input(z.object({ departmentId: z.string().optional() }).optional())
      .query(() => []),
    createAssessment: publicProcedure
      .input(
        z.object({
          name: z.string(),
          departmentId: z.string().optional(),
          skillIds: z.array(z.string()),
          maxScore: z.number().optional(),
          durationMinutes: z.number().optional(),
        })
      )
      .mutation(({ input }) => ({
        id: "new-assessment-id",
        name: input.name,
        skillIds: input.skillIds,
        maxScore: input.maxScore ?? 100,
        durationMinutes: input.durationMinutes ?? 60,
        status: "PUBLISHED",
        createdAt: new Date(),
      })),
  }),
  tnp: router({
    getPlacements: publicProcedure.query(() => getOpportunityStore().opportunities),
    createPlacement: publicProcedure
      .input(placementInputSchema)
      .mutation(({ input }) => {
        const opportunity = buildOpportunity(input);
        tnpUploadedOpportunities.unshift(opportunity);
        return {
          success: true,
          placement: opportunity,
          message: `${input.type} data for ${input.role} at ${input.company} uploaded successfully.`,
        };
      }),
    deletePlacement: publicProcedure
      .input(z.object({ id: z.string() }))
      .mutation(({ input }) => {
        const index = tnpUploadedOpportunities.findIndex(item => item.id === input.id);
        if (index === -1) {
          throw new Error("Only newly uploaded opportunities can be deleted in this demo workspace.");
        }
        tnpUploadedOpportunities.splice(index, 1);
        return { success: true, message: "Opportunity deleted successfully." };
      }),
  }),
  faculty: router({
    getWards: publicProcedure.query(() => FACULTY_WARDS),
    createIntervention: publicProcedure
      .input(
        z.object({
          studentId: z.string(),
          skillGapId: z.string().optional(),
          type: z
            .enum(["MENTORING", "REMEDIAL_CLASS", "ASSIGNMENT", "PEER_TUTORING"])
            .default("MENTORING"),
          description: z.string().min(5),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const ward = FACULTY_WARDS.find(item => item.studentProfileId === input.studentId);
        const facultyName = ctx.user?.name || "Your faculty mentor";
        const sessionDate = input.startDate ? new Date(input.startDate) : new Date();
        const intervention = {
          id: "new-interv-id",
          studentId: input.studentId,
          skillGapId: input.skillGapId ?? null,
          type: input.type,
          description: input.description,
          status: "SCHEDULED",
          startDate: input.startDate ? new Date(input.startDate) : new Date(),
          endDate: input.endDate ? new Date(input.endDate) : null,
          outcome: null,
          createdAt: new Date(),
        };

        let emailNotification = {
          sent: false,
          reason: "student_not_found" as "student_not_found" | "missing_config" | "smtp_error" | undefined,
        };

        if (ward) {
          const mailResult = await sendMail({
            to: ward.email,
            subject: "PRAGATI mentoring session scheduled",
            text: [
              `Hello ${ward.name},`,
              "",
              `${facultyName} has scheduled a ${input.type.replace(/_/g, " ").toLowerCase()} session for you in PRAGATI.`,
              "",
              `Date: ${sessionDate.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}`,
              `Student ID: ${ward.enrollmentNumber}`,
              "",
              "Session plan:",
              input.description,
              "",
              "Please open your PRAGATI mentoring workspace for the latest intervention details and follow-up actions.",
              "",
              "Regards,",
              "PRAGATI Teacher-Guardian Desk",
            ].join("\n"),
          });

          emailNotification = mailResult.sent
            ? { sent: true, reason: undefined }
            : { sent: false, reason: mailResult.reason };
        }

        return {
          success: true,
          intervention,
          emailNotification,
        };
      }),
    recordOutcome: publicProcedure
      .input(
        z.object({
          interventionId: z.string(),
          outcome: z.string().min(5),
          status: z.enum(["COMPLETED", "CANCELLED"]).default("COMPLETED"),
        })
      )
      .mutation(({ input }) => ({
        success: true,
        intervention: {
          id: input.interventionId,
          outcome: input.outcome,
          status: input.status,
          updatedAt: new Date(),
        },
      })),
    getWardInterventions: publicProcedure
      .input(z.object({ studentProfileId: z.string() }))
      .query(() => []),
  }),
  hod: router({
    getDepartmentSummary: publicProcedure.query(() => ({
      departmentName: "Computer Science & Engineering",
      code: "CSE",
      institution: "Northstar Institute of Technology",
      hodName: "Prof. Sunita Rao",
      totalStudents: 248,
      activeBatches: ["2021-2025 (Final Year)", "2022-2026 (Pre-Final Year)"],
      facultyCount: 14,
      avgCgpa: 8.12,
      readinessScore: 79.4,
      readinessDelta: "+3.8%",
      internshipRate: 84.2,
      activeGapsCount: 18,
      resolvedInterventionsCount: 42,
      metrics: [
        {
          label: "Total CSE Students",
          value: "248",
          delta: "4 active cohorts",
          helper: "98.4% attendance index",
          tone: "indigo" as const,
        },
        {
          label: "Dept Readiness Index",
          value: "79.4%",
          delta: "+3.8%",
          helper: "vs previous cycle",
          tone: "violet" as const,
        },
        {
          label: "Verified Internships",
          value: "84.2%",
          delta: "168 / 200",
          helper: "SHA-256 signed evidence",
          tone: "emerald" as const,
        },
        {
          label: "Active Skill Gaps",
          value: "18",
          delta: "11 DSA · 7 OS",
          helper: "Closed-loop remedial active",
          tone: "amber" as const,
        },
      ],
      readinessIndicators: [
        { label: "Academic progress", score: 81.2, weight: 30, helper: "Dept avg CGPA 8.12 across semesters" },
        { label: "Verified skill coverage", score: 77.5, weight: 30, helper: "18 core competencies benchmarked" },
        { label: "Internship progress", score: 84.2, weight: 20, helper: "168 students completed verified industry stints" },
        { label: "Authenticated evidence", score: 96.5, weight: 20, helper: "Faculty-verified SHA-256 cryptographic records" },
      ],
      skillHotspots: [
        {
          skill: "Data Structures & Algorithms",
          code: "CS301",
          flaggedStudents: 11,
          avgScore: 61,
          benchmark: 75,
          severity: "HIGH" as const,
          mentor: "Dr. Anand Verma",
          status: "Remedial Workshop Active",
        },
        {
          skill: "Operating Systems",
          code: "CS401",
          flaggedStudents: 7,
          avgScore: 64,
          benchmark: 70,
          severity: "MEDIUM" as const,
          mentor: "Dr. Meera Nair",
          status: "Lab Remediation Scheduled",
        },
        {
          skill: "Computer Networks",
          code: "CS501",
          flaggedStudents: 4,
          avgScore: 69,
          benchmark: 70,
          severity: "MEDIUM" as const,
          mentor: "Dr. Anand Verma",
          status: "Review Cycle Pending",
        },
        {
          skill: "Database Management Systems",
          code: "CS302",
          flaggedStudents: 3,
          avgScore: 72,
          benchmark: 70,
          severity: "LOW" as const,
          mentor: "Prof. Rajesh Gupta",
          status: "Cohort On Track",
        },
        {
          skill: "Object-Oriented Programming",
          code: "CS201",
          flaggedStudents: 2,
          avgScore: 81,
          benchmark: 70,
          severity: "LOW" as const,
          mentor: "Prof. Vikram Malhotra",
          status: "Proficient",
        },
      ],
      facultyMentors: [
        {
          id: "f1",
          name: "Dr. Anand Verma",
          role: "Associate Professor",
          wardsCount: 18,
          flaggedCount: 2,
          activeInterventions: 3,
          complianceRate: 94,
        },
        {
          id: "f2",
          name: "Dr. Meera Nair",
          role: "Professor",
          wardsCount: 22,
          flaggedCount: 1,
          activeInterventions: 2,
          complianceRate: 100,
        },
        {
          id: "f3",
          name: "Prof. Rajesh Gupta",
          role: "Assistant Professor",
          wardsCount: 19,
          flaggedCount: 3,
          activeInterventions: 4,
          complianceRate: 89,
        },
        {
          id: "f4",
          name: "Prof. Vikram Malhotra",
          role: "Associate Professor",
          wardsCount: 20,
          flaggedCount: 0,
          activeInterventions: 1,
          complianceRate: 100,
        },
      ],
      placementReadiness: {
        eligibleTier1: 112,
        eligibleCore: 198,
        drivesPublished: 14,
        totalOffers: 86,
        topRecruiters: ["TechCorp", "Infosys SpringBoard", "Google Cloud", "Microsoft Engage"],
      },
      recentActivities: [
        {
          id: "act-1",
          title: "DSA Mentoring Session Scheduled",
          detail: "Dr. Anand Verma scheduled 1-on-1 session for Rahul Sharma (CSE2024042)",
          time: "12 mins ago",
          badge: "Intervention",
          tone: "violet" as const,
        },
        {
          id: "act-2",
          title: "Internship Certificate Verified",
          detail: "TechCorp 8-week completion certificate cryptographically confirmed via SHA-256",
          time: "1 hour ago",
          badge: "Verified",
          tone: "emerald" as const,
        },
        {
          id: "act-3",
          title: "Campus Drive Published",
          detail: "T&P cell opened ABC Technologies drive (min CGPA 7.5, DSA 70)",
          time: "3 hours ago",
          badge: "Placement",
          tone: "indigo" as const,
        },
        {
          id: "act-4",
          title: "Assessment Cycle 3 Completed",
          detail: "DSA Assessment Cycle 3 closed for Sem 6 with 96% cohort turnout",
          time: "Yesterday",
          badge: "Assessment",
          tone: "amber" as const,
        },
      ],
    })),
    scheduleRemedialClinic: publicProcedure
      .input(
        z.object({
          subjectCode: z.string(),
          facultyMentor: z.string(),
          batchYear: z.string(),
          scheduledDate: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(({ input }) => ({
        success: true,
        clinicId: `clinic-${Date.now()}`,
        subjectCode: input.subjectCode,
        facultyMentor: input.facultyMentor,
        message: `Remedial clinic for ${input.subjectCode} assigned to ${input.facultyMentor} successfully.`,
      })),
    sendActivityInvitation: publicProcedure
      .input(
        z.object({
          activityId: z.string(),
          title: z.string().min(3),
          detail: z.string().min(3),
          badge: z.string().optional(),
          time: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const senderName = ctx.user?.name || "PRAGATI HOD Desk";
        const results = await Promise.all(
          ACTIVITY_INVITE_STUDENTS.map(async student => {
            const mailResult = await sendMail({
              to: student.email,
              subject: `PRAGATI invitation: ${input.title}`,
              text: [
                `Hello ${student.name},`,
                "",
                `${senderName} has sent you an invitation for the following PRAGATI department activity.`,
                "",
                `Activity: ${input.title}`,
                `Category: ${input.badge || "Department Activity"}`,
                input.time ? `Posted: ${input.time}` : "",
                "",
                "Details:",
                input.detail,
                "",
                "Please log in to PRAGATI and check your workspace for any required action.",
                "",
                "Regards,",
                "PRAGATI Department Desk",
              ].filter(Boolean).join("\n"),
            });

            return {
              studentEmail: student.email,
              sent: mailResult.sent,
              reason: mailResult.sent ? undefined : mailResult.reason,
            };
          })
        );

        return {
          success: true,
          activityId: input.activityId,
          totalStudents: ACTIVITY_INVITE_STUDENTS.length,
          sentCount: results.filter(result => result.sent).length,
          failedCount: results.filter(result => !result.sent).length,
          results,
        };
      }),
    exportAuditReport: publicProcedure.query(() => ({
      success: true,
      reportTitle: "PRAGATI CSE Department Skill & Placement Audit",
      department: "Computer Science & Engineering",
      institution: "Northstar Institute of Technology",
      generatedAt: new Date().toISOString(),
      format: "PDF (NAAC Criterion 2 & NBA Sub-tier compliant)",
    })),
  }),
  evidence: router({
    getMyEvidence: publicProcedure.query(() => [
      {
        id: "ev-01",
        studentId: "student-rahul-sharma",
        achievementId: null,
        filename: "TechCorp_OfferLetter.pdf",
        storageBucket: "evidence-vault",
        storagePath:
          "NIT-001/student-rahul-sharma/1726500000000-TechCorp_OfferLetter.pdf",
        mimeType: "application/pdf",
        fileSize: 245000,
        sha256Hash:
          "3b9c7a4e8d2f105b6c3e7a9f1d4c2b8e0a6d5f4c3b2a1e9d8c7b6a5f4e3d2c1b",
        verificationStatus: "INSTITUTION_VERIFIED" as const,
        uploadedAt: new Date(),
        downloadUrl: "/mock-storage/TechCorp_OfferLetter.pdf",
      },
    ]),
    registerEvidence: publicProcedure
      .input(
        z.object({
          filename: z.string(),
          storagePath: z.string(),
          mimeType: z.enum(["application/pdf", "image/png", "image/jpeg"]),
          fileSize: z.number(),
          sha256Hash: z.string(),
          achievementId: z.string().optional(),
        })
      )
      .mutation(({ input }) => ({
        id: "new-ev-id",
        studentId: "student-rahul-sharma",
        achievementId: input.achievementId ?? null,
        filename: input.filename,
        storageBucket: "evidence-vault",
        storagePath: input.storagePath,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
        sha256Hash: input.sha256Hash,
        verificationStatus: "SELF_REPORTED" as const,
        uploadedAt: new Date(),
      })),
    uploadAndRegister: publicProcedure
      .input(
        z.object({
          filename: z.string(),
          mimeType: z.enum(["application/pdf", "image/png", "image/jpeg"]),
          base64Data: z.string(),
          clientHash: z.string().optional(),
          achievementId: z.string().optional(),
        })
      )
      .mutation(({ input }) => ({
        id: "new-ev-id",
        studentId: "student-rahul-sharma",
        achievementId: input.achievementId ?? null,
        filename: input.filename,
        storageBucket: "evidence-vault",
        storagePath: `NIT-001/student-rahul-sharma/${Date.now()}-${input.filename}`,
        mimeType: input.mimeType,
        fileSize: Math.round(input.base64Data.length * 0.75),
        sha256Hash:
          input.clientHash ||
          "3b9c7a4e8d2f105b6c3e7a9f1d4c2b8e0a6d5f4c3b2a1e9d8c7b6a5f4e3d2c1b",
        verificationStatus: "SELF_REPORTED" as const,
        uploadedAt: new Date(),
      })),
    verifyIntegrity: publicProcedure
      .input(
        z.object({
          evidenceId: z.string(),
          base64Data: z.string().optional(),
        })
      )
      .query(({ input }) => ({
        evidenceId: input.evidenceId,
        filename: "TechCorp_OfferLetter.pdf",
        storedHash:
          "3b9c7a4e8d2f105b6c3e7a9f1d4c2b8e0a6d5f4c3b2a1e9d8c7b6a5f4e3d2c1b",
        computedHash:
          "3b9c7a4e8d2f105b6c3e7a9f1d4c2b8e0a6d5f4c3b2a1e9d8c7b6a5f4e3d2c1b",
        isIntact: true,
        status: "VERIFIED" as const,
        message:
          "Cryptographic integrity verified: Stored SHA-256 matches exact document byte sequence.",
      })),
    simulateTamper: publicProcedure
      .input(
        z
          .object({
            originalText: z.string().optional(),
            tamperedText: z.string().optional(),
          })
          .optional()
      )
      .mutation(() => ({
        documentName: "TechCorp_OfferLetter.pdf",
        originalText: "Monthly Stipend: INR 45,000",
        tamperedText: "Monthly Stipend: INR 95,000",
        originalHash:
          "3b9c7a4e8d2f105b6c3e7a9f1d4c2b8e0a6d5f4c3b2a1e9d8c7b6a5f4e3d2c1b",
        tamperedHash:
          "e81a4b2c1d3e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a",
        isMatch: false,
        status: "TAMPER_DETECTED" as const,
        alertMessage:
          "INTEGRITY FAILURE: Document bytes altered. SHA-256 hash mismatch detected.",
        educationalNote:
          "SHA-256 cryptographic hashing detects any bit-level tampering. Institutional authenticity requires faculty sign-off.",
      })),
  }),
  internship: router({
    getMyInternship: publicProcedure.query(() => ({
      id: "internship-01",
      studentId: "student-rahul-sharma",
      companyName: "Atlas Labs",
      role: "Product Engineering Intern",
      startDate: "2026-06-01",
      endDate: "2026-11-30",
      stipend: "45000.00",
      status: "IN_PROGRESS" as "APPLIED" | "OFFERED" | "IN_PROGRESS" | "COMPLETED" | "TERMINATED",
      supervisorName: "Sarah Jenkins",
      supervisorEmail: "s.jenkins@atlaslabs.io",
      verificationStatus: "PENDING" as "SELF_REPORTED" | "PENDING" | "INSTITUTION_VERIFIED" | "ISSUER_VERIFIED" | "REJECTED",
      completeness: 50,
      milestones: {
        hasOfferLetter: true,
        hasCheckin: true,
        hasReport: false,
        hasCertificate: false,
      },
      evidence: [
        {
          id: "ie-01",
          internshipId: "internship-01",
          evidenceType: "OFFER_LETTER" as const,
          status: "INSTITUTION_VERIFIED" as const,
          createdAt: new Date(),
          documentId: "ev-01",
          filename: "TechCorp_OfferLetter.pdf",
          storagePath: "NIT-001/student-rahul-sharma/TechCorp_OfferLetter.pdf",
          mimeType: "application/pdf",
          fileSize: 245000,
          sha256Hash: "3b9c7a4e8d2f105b6c3e7a9f1d4c2b8e0a6d5f4c3b2a1e9d8c7b6a5f4e3d2c1b",
          verificationStatus: "INSTITUTION_VERIFIED" as const,
          downloadUrl: "/mock-storage/TechCorp_OfferLetter.pdf",
        },
      ],
      checkins: [
        {
          id: "chk-01",
          internshipId: "internship-01",
          studentId: "student-rahul-sharma",
          checkInDate: "2026-07-15",
          summary: "Completed backend API integration and added comprehensive test coverage for Phase 6.",
          status: "SUBMITTED",
          createdAt: new Date(),
        },
      ],
    })),
    createInternship: publicProcedure
      .input(
        z.object({
          companyName: z.string().min(2),
          role: z.string().min(2),
          startDate: z.string(),
          endDate: z.string().optional(),
          stipend: z.number().optional(),
          supervisorName: z.string().optional(),
          supervisorEmail: z.string().email().optional(),
        })
      )
      .mutation(({ input }) => ({
        id: "internship-new",
        studentId: "student-rahul-sharma",
        companyName: input.companyName,
        role: input.role,
        startDate: input.startDate,
        endDate: input.endDate ?? null,
        stipend: input.stipend ? input.stipend.toString() : null,
        status: "IN_PROGRESS" as const,
        supervisorName: input.supervisorName ?? null,
        supervisorEmail: input.supervisorEmail ?? null,
        verificationStatus: "PENDING" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    submitCheckin: publicProcedure
      .input(
        z.object({
          internshipId: z.string(),
          summary: z.string().min(5),
          checkInDate: z.string().optional(),
        })
      )
      .mutation(({ input }) => ({
        id: `chk-${Date.now()}`,
        internshipId: input.internshipId,
        studentId: "student-rahul-sharma",
        checkInDate: input.checkInDate || new Date().toISOString().split("T")[0],
        summary: input.summary,
        status: "SUBMITTED" as const,
        reviewedBy: null,
        createdAt: new Date(),
      })),
    linkEvidence: publicProcedure
      .input(
        z.object({
          internshipId: z.string(),
          evidenceDocumentId: z.string(),
          evidenceType: z.enum([
            "OFFER_LETTER",
            "CHECK_IN",
            "COMPLETION_CERTIFICATE",
            "INTERNSHIP_REPORT",
            "SUPERVISOR_CONFIRMATION",
            "SKILL_CERTIFICATE",
          ]),
        })
      )
      .mutation(({ input }) => ({
        id: `ie-${Date.now()}`,
        internshipId: input.internshipId,
        evidenceDocumentId: input.evidenceDocumentId,
        evidenceType: input.evidenceType,
        status: "PENDING" as const,
        createdAt: new Date(),
      })),
    getReviewQueue: publicProcedure.query(() => [
      {
        id: "internship-01",
        studentId: "student-rahul-sharma",
        studentName: "Rahul Sharma",
        studentEmail: "student@northstar.edu",
        enrollmentNumber: "CSE2024042",
        companyName: "Atlas Labs",
        role: "Product Engineering Intern",
        startDate: "2026-06-01",
        endDate: "2026-11-30",
        stipend: "45000.00",
        status: "IN_PROGRESS" as "APPLIED" | "OFFERED" | "IN_PROGRESS" | "COMPLETED" | "TERMINATED",
        verificationStatus: "PENDING" as "SELF_REPORTED" | "PENDING" | "INSTITUTION_VERIFIED" | "ISSUER_VERIFIED" | "REJECTED",
        createdAt: new Date(),
        completeness: 50,
        evidenceCount: 1,
        checkinCount: 1,
        evidence: [
          {
            id: "ie-01",
            evidenceType: "OFFER_LETTER" as const,
            status: "INSTITUTION_VERIFIED" as const,
            filename: "TechCorp_OfferLetter.pdf",
            storagePath: "NIT-001/student-rahul-sharma/TechCorp_OfferLetter.pdf",
            sha256Hash: "3b9c7a4e8d2f105b6c3e7a9f1d4c2b8e0a6d5f4c3b2a1e9d8c7b6a5f4e3d2c1b",
            uploadedAt: new Date(),
          },
        ],
        checkins: [
          {
            id: "chk-01",
            internshipId: "internship-01",
            studentId: "student-rahul-sharma",
            checkInDate: "2026-07-15",
            summary: "Completed backend API integration and added comprehensive test coverage for Phase 6.",
            status: "SUBMITTED",
            createdAt: new Date(),
          },
        ],
      },
    ]),
    verifyInternship: publicProcedure
      .input(
        z.object({
          internshipId: z.string(),
          status: z.enum(["INSTITUTION_VERIFIED", "REJECTED"]),
          notes: z.string().optional(),
        })
      )
      .mutation(({ input }) => ({
        success: true,
        internshipId: input.internshipId,
        verificationStatus: input.status,
        status: input.status === "INSTITUTION_VERIFIED" ? "COMPLETED" : "IN_PROGRESS",
        verifiedAt: new Date().toISOString(),
      })),
  }),
});

export type AppRouter = typeof appRouter;


