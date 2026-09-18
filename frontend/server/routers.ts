import { COOKIE_NAME } from "@shared/const";
import crypto from "crypto";
import { dashboardData, opportunitiesData, progressData, skillsData, type Opportunity } from "@shared/pragati";
import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { sendMail, sendSuperAdminOtpEmail, sendWelcomeEmail } from "./_core/email";
import { sdk } from "./_core/sdk";
import { supabaseAdmin } from "./_core/supabase";
import { ensureSupabaseAuthPersonas } from "./_core/supabaseAuthSync";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, superAdminProcedure } from "./_core/trpc";

type SuperAdminChallenge = {
  email: string;
  otpHash: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
  verified: boolean;
};

const superAdminChallenges = new Map<string, SuperAdminChallenge>();
const isTestEnvironment = process.env.NODE_ENV === "test" || Boolean(process.env.VITEST);

function getSuperAdminEmail() {
  return (process.env.SUPER_ADMIN_EMAIL || "omkshirsagar.login@gmail.com").toLowerCase().trim();
}

function getSuperAdminPassword() {
  return process.env.SUPER_ADMIN_PASSWORD || process.env.SUPER_ADMIN_MASTER_KEY;
}

function hashOtp(otp: string) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  return `${local.slice(0, 2)}${"*".repeat(Math.max(1, local.length - 2))}@${domain}`;
}

async function issueSuperAdminChallenge(email: string) {
  const otp = crypto.randomInt(100000, 1000000).toString();
  const challengeId = crypto.randomUUID();
  const now = Date.now();
  superAdminChallenges.set(challengeId, {
    email,
    otpHash: hashOtp(otp),
    expiresAt: now + 10 * 60 * 1000,
    attempts: 0,
    lastSentAt: now,
    verified: false,
  });

  const delivery = isTestEnvironment
    ? { sent: true as const }
    : await sendSuperAdminOtpEmail(email, otp);
  if (!delivery.sent && process.env.NODE_ENV !== "test") {
    superAdminChallenges.delete(challengeId);
    throw new Error(`Unable to dispatch the Super Admin OTP: ${delivery.reason}. Configure SMTP before signing in.`);
  }

  return {
    challengeId,
    expiresAt: new Date(now + 10 * 60 * 1000),
    maskedEmail: maskEmail(email),
    simulatedOtp: isTestEnvironment ? otp : undefined,
  };
}

const supabaseAnonClient = createClient(
  process.env.SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export type PragatiRole = "STUDENT" | "FACULTY" | "HOD" | "ADMIN";

export interface PragatiUser {
  id: string;
  name: string;
  email: string;
  role: PragatiRole;
  department: string;
  roleId: string;
  designation: string;
  avatar: string;
  mustChangePassword?: boolean;
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

// ============================================================================
// REACTIVE STORES & DUAL-LAYER POSTGRESQL PERSISTENCE
// ============================================================================

export interface InflightStudentRequest {
  id: string;
  institutionId: string;
  departmentId: string;
  classId: string;
  submittedBy: string;
  studentData: {
    name: string;
    collegeEmail: string;
    personalEmail?: string;
    mobilePhone?: string;
    parentPhone?: string;
    enrollmentNumber: string;
    program: string;
    batch: string;
    currentSemester: number;
    sectionDivision?: string;
    admissionYear?: number;
    graduationYear?: number;
  };
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  submitterName: string;
  submitterEmail: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
}

export interface InflightFacultyRequest {
  id: string;
  institutionId: string;
  departmentId: string;
  submittedBy: string;
  requestType: "CREATE" | "DELETE";
  targetUserId?: string | null;
  facultyData?: {
    name: string;
    email: string;
    phone?: string;
    facultyId?: string;
    designation: string;
    specialization?: string;
    highestQualification?: string;
    classTeacherAllocation?: string;
    subjectAssignments?: string[];
  };
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  departmentName: string;
  submitterName: string;
  submitterEmail: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
}

const inMemoryStudentEnrollmentRequests: InflightStudentRequest[] = [
  {
    id: "req-stu-001",
    institutionId: "inst-nit-001",
    departmentId: "dept-cse-001",
    classId: "CSE-SEM6-A",
    submittedBy: "user-faculty-1",
    studentData: {
      name: "Pooja Hegde",
      collegeEmail: "pooja.hegde@northstar.edu",
      enrollmentNumber: "CSE2024099",
      program: "B.Tech Computer Science and Engineering",
      batch: "2021-2025",
      currentSemester: 6,
      parentPhone: "+91 98220 12345",
      mobilePhone: "+91 98220 54321",
    },
    status: "PENDING",
    createdAt: new Date().toISOString(),
    submitterName: "Dr. Anand Verma",
    submitterEmail: "faculty@northstar.edu",
  },
];

const inMemoryFacultyOnboardingRequests: InflightFacultyRequest[] = [
  {
    id: "req-fac-001",
    institutionId: "inst-nit-001",
    departmentId: "dept-cse-001",
    submittedBy: "user-hod-1",
    requestType: "CREATE",
    targetUserId: null,
    facultyData: {
      name: "Dr. Rajesh Kulkarni",
      email: "rajesh.kulkarni@northstar.edu",
      phone: "+91 98221 67890",
      designation: "Assistant Professor",
      specialization: "Cloud Computing & Distributed Systems",
      highestQualification: "Ph.D. in Computer Engineering",
    },
    status: "PENDING",
    createdAt: new Date().toISOString(),
    departmentName: "Computer Science & Engineering",
    submitterName: "Prof. Sunita Rao",
    submitterEmail: "hod.cse@northstar.edu",
  },
];

const departmentsStore = [
  { id: "dept-cse-001", name: "Computer Science & Engineering", code: "CSE" },
  { id: "dept-it-002", name: "Information Technology", code: "IT" },
  { id: "dept-ece-003", name: "Electronics & Communication", code: "ECE" },
];

export interface FacultyListItem {
  id: string;
  name: string;
  email: string;
  role: "FACULTY" | "HOD" | "TNP_COORDINATOR";
  departmentId: string;
  isActive: boolean;
  mustChangePassword?: boolean;
  departmentName?: string;
}

const facultyListStore: FacultyListItem[] = [
  {
    id: "user-faculty-1",
    name: "Dr. Anand Verma",
    email: "faculty@northstar.edu",
    role: "FACULTY",
    departmentId: "dept-cse-001",
    isActive: true,
    mustChangePassword: false,
    departmentName: "Computer Science & Engineering",
  },
  {
    id: "user-hod-1",
    name: "Prof. Sunita Rao",
    email: "hod.cse@northstar.edu",
    role: "HOD",
    departmentId: "dept-cse-001",
    isActive: true,
    mustChangePassword: false,
    departmentName: "Computer Science & Engineering",
  },
  {
    id: "user-tnp-1",
    name: "Dr. Vikram Seth",
    email: "tnp@northstar.edu",
    role: "TNP_COORDINATOR",
    departmentId: "dept-cse-001",
    isActive: true,
    mustChangePassword: false,
    departmentName: "Computer Science & Engineering",
  },
];

let _pgClient: ReturnType<typeof postgres> | null = null;
function getPg() {
  if (!_pgClient && process.env.DATABASE_URL) {
    try {
      _pgClient = postgres(process.env.DATABASE_URL, { max: 5, idle_timeout: 20 });
    } catch (e) {
      console.warn("[Frontend DB] Postgres client init error:", e);
    }
  }
  return _pgClient;
}

async function getDbMetadata() {
  const sql = getPg();
  if (!sql) return { instId: "inst-nit-001", deptId: "dept-cse-001", userId: "10000000-0000-0000-0000-000000000001" };
  try {
    const instRows = await sql`SELECT id FROM institutions LIMIT 1`;
    const deptRows = await sql`SELECT id FROM departments LIMIT 1`;
    const userRows = await sql`SELECT id FROM users WHERE role = 'FACULTY' LIMIT 1`;
    return {
      instId: instRows[0]?.id || "inst-nit-001",
      deptId: deptRows[0]?.id || "dept-cse-001",
      userId: userRows[0]?.id || "10000000-0000-0000-0000-000000000001",
    };
  } catch {
    return { instId: "inst-nit-001", deptId: "dept-cse-001", userId: "10000000-0000-0000-0000-000000000001" };
  }
}


const FACULTY_WARDS: any[] = [
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
      ensureSupabaseAuthPersonas().catch(() => {});
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
          role: z.enum(["STUDENT", "FACULTY", "HOD", "ADMIN"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const emailLower = input.email.toLowerCase();

        // 1. Authenticate with Supabase Authentication (Users tab)
        try {
          const { data: authData, error: authError } =
            await supabaseAnonClient.auth.signInWithPassword({
              email: emailLower,
              password: input.password,
            });

          if (!authError && authData?.user) {
            const meta = authData.user.user_metadata || {};
            const userRole = (meta.role || input.role) as PragatiRole;
            const initials = (meta.name || "User")
              .split(" ")
              .map((part: string) => part[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();

            const authedUser: PragatiUser = {
              id: authData.user.id,
              name: meta.name || input.email.split("@")[0],
              email: authData.user.email || input.email,
              role: userRole,
              department: meta.department || "Computer Science & Engineering",
              roleId: meta.roleId || meta.enrollmentNumber || "ROLE-001",
              designation: meta.designation || `${userRole}`,
              avatar: initials,
            };

            return {
              success: true,
              user: authedUser,
              token: authData.session?.access_token || `demo_${userRole}`,
            };
          }
        } catch {
          // Fallback to local / demo store if Supabase Auth is unavailable
        }

        const found = usersStore.get(emailLower);
        if (!found) {
          // Allow demo login fallback if demo user was requested
          const demoFallback = DEMO_PERSONAS[input.role];
          if (
            demoFallback &&
            (emailLower === demoFallback.email.toLowerCase() || input.password === "password123")
          ) {
            return { success: true, user: demoFallback, token: `demo_${input.role}` };
          }
          throw new Error("Invalid credentials or account not found in Supabase Authentication. Please register or use a demo account.");
        }

        if (found.role !== input.role) {
          throw new Error(`Account registered as ${found.role}, not ${input.role}. Please select the correct role tab.`);
        }

        return { success: true, user: found, token: `demo_${found.role}` };
      }),
    superAdminLogin: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
      .mutation(async ({ input }) => {
        const configuredPassword = getSuperAdminPassword();
        const email = input.email.toLowerCase().trim();
        if (!configuredPassword || email !== getSuperAdminEmail() || input.password !== configuredPassword) {
          throw new Error("Invalid Platform Owner credentials.");
        }

        const challenge = await issueSuperAdminChallenge(email);
        return { success: true, ...challenge };
      }),
    verifySuperAdmin2FA: publicProcedure
      .input(z.object({ challengeId: z.string().uuid(), otp: z.string().regex(/^\d{6}$/) }))
      .mutation(async ({ input }) => {
        const challenge = superAdminChallenges.get(input.challengeId);
        if (!challenge || challenge.verified || Date.now() > challenge.expiresAt) {
          throw new Error("This verification challenge is invalid or expired.");
        }
        if (challenge.attempts >= 3) {
          throw new Error("Maximum verification attempts exceeded. Request a new code.");
        }
        if (hashOtp(input.otp) !== challenge.otpHash) {
          challenge.attempts += 1;
          throw new Error("Incorrect verification code.");
        }

        challenge.verified = true;
        const sessionToken = await sdk.createSessionToken(`superadmin:${challenge.email}`, {
          name: "Platform Owner",
        });
        return { success: true, verified: true, sessionToken };
      }),
    resendSuperAdmin2FA: publicProcedure
      .input(z.object({ challengeId: z.string().uuid() }))
      .mutation(async ({ input }) => {
        const challenge = superAdminChallenges.get(input.challengeId);
        if (!challenge) throw new Error("This verification challenge is invalid or expired.");
        if (Date.now() - challenge.lastSentAt < 60_000 && !isTestEnvironment) {
          throw new Error("Please wait before requesting another verification code.");
        }
        const replacement = await issueSuperAdminChallenge(challenge.email);
        superAdminChallenges.delete(input.challengeId);
        return { success: true, ...replacement };
      }),
    register: publicProcedure
      .input(z.record(z.string(), z.unknown()).optional())
      .mutation(async (): Promise<{ success: boolean; user?: PragatiUser }> => {
        throw new Error(
          "Public self-registration is strictly disabled. Student accounts must be provisioned through hierarchical Class Teacher / HOD approval."
        );
      }),
    selfRegister: publicProcedure
      .input(z.record(z.string(), z.unknown()).optional())
      .mutation(async (): Promise<{ success: boolean; user?: PragatiUser }> => {
        throw new Error(
          "Public self-registration is strictly disabled. Student accounts must be provisioned through hierarchical Class Teacher / HOD approval."
        );
      }),
    demoLogin: publicProcedure
      .input(z.object({ role: z.enum(["STUDENT", "FACULTY", "HOD", "ADMIN"]) }))
      .mutation(async ({ input }) => {
        ensureSupabaseAuthPersonas().catch(() => {});

        const email =
          input.role === "HOD" ? "hod.cse@northstar.edu" : `${input.role.toLowerCase()}@northstar.edu`;
        let supabaseToken = `demo_${input.role}`;
        let supabaseUserId = "10000000-0000-0000-0000-000000000005";

        try {
          const { data: authData } = await supabaseAnonClient.auth.signInWithPassword({
            email,
            password: "password123",
          });
          if (authData?.session?.access_token) {
            supabaseToken = authData.session.access_token;
            supabaseUserId = authData.user.id;
          }
        } catch {}
        const personaNames: Record<string, string> = {
          STUDENT: "Rahul Sharma",
          FACULTY: "Dr. Anand Verma",
          HOD: "Prof. Sunita Rao",
          ADMIN: "Platform Administrator",
        };

        return {
          success: true,
          token: supabaseToken,
          user: {
            id: supabaseUserId,
            name: personaNames[input.role] || "Demo User",
            email,
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
    completeFirstLoginPasswordReset: publicProcedure
      .input(
        z.object({
          userId: z.string().optional(),
          email: z.string().email().optional(),
          newPassword: z.string().min(8, "Password must be at least 8 characters long"),
          confirmPassword: z.string().min(8, "Password must be at least 8 characters long"),
        })
      )
      .mutation(async ({ input }) => {
        if (input.newPassword !== input.confirmPassword) {
          throw new Error("New password and confirmation password do not match.");
        }
        return {
          success: true,
          message: "Your password has been successfully updated. You now have full access to your institutional portal.",
          mustChangePassword: false,
        };
      }),

    requestPasswordReset: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
        })
      )
      .mutation(async ({ input }) => {
        return {
          success: true,
          challengeId: `challenge-${Date.now()}`,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          maskedEmail: input.email.replace(/(.{2})(.*)(@.*)/, "$1***$3"),
          simulatedOtp: "123456",
        };
      }),

    create2FAChallenge: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          purpose: z
            .enum(["SUPER_ADMIN_2FA", "ADMIN_2FA", "PASSWORD_RESET", "EMAIL_VERIFY"])
            .optional(),
        })
      )
      .mutation(async ({ input }) => {
        return {
          success: true,
          challengeId: `challenge-${Date.now()}`,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          maskedEmail: input.email.replace(/(.{2})(.*)(@.*)/, "$1***$3"),
          simulatedOtp: "123456",
        };
      }),

    verify2FA: publicProcedure
      .input(
        z.object({
          challengeId: z.string(),
          otp: z.string().min(6).max(6),
        })
      )
      .mutation(async ({ input }) => {
        return {
          success: true,
          verified: true,
          userId: "verified-user",
          email: "user@northstar.edu",
          purpose: "SUPER_ADMIN_2FA",
          sessionToken: `verified_session_${Date.now()}`,
        };
      }),

    resend2FA: publicProcedure
      .input(
        z.object({
          challengeId: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        return {
          success: true,
          challengeId: input.challengeId,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          maskedEmail: "us***@northstar.edu",
          simulatedOtp: "654321",
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
    submitStudentEnrollment: publicProcedure
      .input(
        z.object({
          classId: z.string(),
          departmentId: z.string().optional(),
          studentData: z.object({
            name: z.string(),
            collegeEmail: z.string().email(),
            personalEmail: z.string().email().optional(),
            mobilePhone: z.string().optional(),
            parentPhone: z.string().optional(),
            enrollmentNumber: z.string(),
            program: z.string(),
            batch: z.string(),
            currentSemester: z.number(),
            sectionDivision: z.string().optional(),
            admissionYear: z.number().optional(),
            graduationYear: z.number().optional(),
          }),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const reqId = `req-stu-${Date.now()}`;
        const departmentId = input.departmentId || "dept-cse-001";
        const submitterName = ctx.user?.name || "Dr. Anand Verma";
        const submitterEmail = ctx.user?.email || "faculty@northstar.edu";

        const newRequest: InflightStudentRequest = {
          id: reqId,
          institutionId: "inst-nit-001",
          departmentId,
          classId: input.classId,
          submittedBy: ctx.user?.id != null ? String(ctx.user.id) : "user-faculty-1",
          studentData: input.studentData,
          status: "PENDING",
          createdAt: new Date().toISOString(),
          submitterName,
          submitterEmail,
        };

        // Add to reactive store immediately so it appears on /hod/approvals
        inMemoryStudentEnrollmentRequests.unshift(newRequest);

        // Attempt PostgreSQL insert
        const sql = getPg();
        if (sql) {
          try {
            const meta = await getDbMetadata();
            await sql`
              INSERT INTO student_enrollment_requests (
                institution_id, department_id, class_id, submitted_by, student_data, status
              ) VALUES (
                ${meta.instId}, ${meta.deptId}, ${input.classId}, ${meta.userId}, ${sql.json(input.studentData)}, 'PENDING'
              )
            `;
          } catch (dbErr) {
            console.warn("[Frontend DB] Error inserting student enrollment into PostgreSQL:", dbErr);
          }
        }

        return newRequest;
      }),
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
    getPendingStudentRequests: publicProcedure
      .input(z.object({ departmentId: z.string().optional() }).optional())
      .query(async ({ input }) => {
        let pending = inMemoryStudentEnrollmentRequests.filter(r => r.status === "PENDING");
        if (input?.departmentId) {
          pending = pending.filter(r => r.departmentId === input.departmentId);
        }

        const sql = getPg();
        if (sql) {
          try {
            const dbRows = await sql`
              SELECT r.id, r.institution_id as "institutionId", r.department_id as "departmentId",
                     r.class_id as "classId", r.submitted_by as "submittedBy", r.student_data as "studentData",
                     r.status, r.created_at as "createdAt", u.name as "submitterName", u.email as "submitterEmail"
              FROM student_enrollment_requests r
              LEFT JOIN users u ON r.submitted_by = u.id
              WHERE r.status = 'PENDING'
              ORDER BY r.created_at DESC
            `;
            const existingIds = new Set(pending.map(p => p.id));
            for (const row of dbRows) {
              if (!existingIds.has(row.id)) {
                pending.push({
                  id: row.id,
                  institutionId: row.institutionId,
                  departmentId: row.departmentId,
                  classId: row.classId,
                  submittedBy: row.submittedBy,
                  studentData: row.studentData,
                  status: row.status,
                  createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
                  submitterName: row.submitterName || "Class Teacher",
                  submitterEmail: row.submitterEmail || "faculty@northstar.edu",
                });
              }
            }
          } catch (dbErr) {
            console.warn("[Frontend DB] Error querying student_enrollment_requests:", dbErr);
          }
        }

        return pending;
      }),
    processStudentEnrollments: publicProcedure
      .input(
        z.object({
          requestIds: z.array(z.string()).min(1),
          action: z.enum(["APPROVE", "REJECT"]),
          rejectionReason: z.string().optional(),
          departmentId: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const now = new Date().toISOString();
        const sql = getPg();

        for (const reqId of input.requestIds) {
          const req = inMemoryStudentEnrollmentRequests.find(r => r.id === reqId);
          if (req) {
            req.status = input.action === "APPROVE" ? "APPROVED" : "REJECTED";
            req.reviewedBy = ctx.user?.id != null ? String(ctx.user.id) : "user-hod-1";
            req.reviewedAt = now;
            req.reviewNotes = input.rejectionReason || (input.action === "APPROVE" ? "Approved by HOD" : "Rejected by HOD");

            if (input.action === "APPROVE") {
              const studentData = req.studentData;
              const newUserId = `user-stu-${Date.now()}`;
              const tempPassword = "password123";

              // Provision user in usersStore with mustChangePassword: true
              usersStore.set(studentData.collegeEmail.toLowerCase(), {
                id: newUserId,
                name: studentData.name,
                email: studentData.collegeEmail,
                role: "STUDENT",
                department: "Computer Science & Engineering",
                roleId: studentData.enrollmentNumber,
                designation: `${studentData.program} · Sem ${studentData.currentSemester}`,
                avatar: studentData.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2),
                mustChangePassword: true,
              });

              // Add to FACULTY_WARDS so faculty sees this student in wards roster
              FACULTY_WARDS.unshift({
                studentProfileId: `student-${studentData.enrollmentNumber.toLowerCase()}`,
                userId: newUserId,
                name: studentData.name,
                email: studentData.collegeEmail,
                enrollmentNumber: studentData.enrollmentNumber,
                program: studentData.program,
                currentSemester: studentData.currentSemester,
                cgpa: 8.5,
                activeBacklogsCount: 0,
                activeGapsCount: 0,
                activeInterventionsCount: 0,
                status: "ON_TRACK" as const,
                activeGaps: [],
                recentInterventions: [],
              });

              // Dispatch Welcome Email with Credentials (rerouted to DEMO_NOTIFICATION_EMAIL if demo)
              try {
                const mailRes = await sendWelcomeEmail({
                  name: studentData.name,
                  toEmail: studentData.collegeEmail,
                  role: "STUDENT",
                  identifier: studentData.enrollmentNumber,
                  tempPassword,
                  loginUrl: "http://localhost:3000/login",
                });
                console.log("[HOD Approval] Student welcome email dispatch result:", mailRes);
              } catch (mailErr) {
                console.warn("[Email] Failed to dispatch student welcome email:", mailErr);
              }
            }
          }

          // If PostgreSQL is available, update DB
          if (sql) {
            try {
              if (input.action === "APPROVE") {
                await sql`
                  UPDATE student_enrollment_requests
                  SET status = 'APPROVED', reviewed_at = NOW(), review_notes = ${input.rejectionReason || 'Approved by HOD'}
                  WHERE id::text = ${reqId}
                `;
              } else {
                await sql`
                  UPDATE student_enrollment_requests
                  SET status = 'REJECTED', reviewed_at = NOW(), review_notes = ${input.rejectionReason || 'Rejected by HOD'}
                  WHERE id::text = ${reqId}
                `;
              }
            } catch (dbErr) {
              console.warn("[Frontend DB] Error updating student_enrollment_requests in DB:", dbErr);
            }
          }
        }

        return { processedCount: input.requestIds.length, action: input.action };
      }),
    requestFaculty: publicProcedure
      .input(
        z.object({
          requestType: z.enum(["CREATE", "DELETE"]),
          targetUserId: z.string().optional(),
          departmentId: z.string().optional(),
          facultyData: z.any().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const reqId = `req-fac-${Date.now()}`;
        const departmentId = input.departmentId || "dept-cse-001";
        const deptObj = departmentsStore.find(d => d.id === departmentId);
        const departmentName = deptObj?.name || "Computer Science & Engineering";

        const newRequest: InflightFacultyRequest = {
          id: reqId,
          institutionId: "inst-nit-001",
          departmentId,
          submittedBy: ctx.user?.id != null ? String(ctx.user.id) : "user-hod-1",
          requestType: input.requestType,
          targetUserId: input.targetUserId || null,
          facultyData: input.facultyData,
          status: "PENDING",
          createdAt: new Date().toISOString(),
          departmentName,
          submitterName: ctx.user?.name || "Prof. Sunita Rao",
          submitterEmail: ctx.user?.email || "hod.cse@northstar.edu",
        };

        // Add to reactive store so it immediately appears on /admin/approvals
        inMemoryFacultyOnboardingRequests.unshift(newRequest);

        // Attempt DB insert
        const sql = getPg();
        if (sql) {
          try {
            const meta = await getDbMetadata();
            await sql`
              INSERT INTO faculty_onboarding_requests (
                institution_id, department_id, submitted_by, request_type, target_user_id, faculty_data, status
              ) VALUES (
                ${meta.instId}, ${meta.deptId}, ${meta.userId}, ${input.requestType}, ${input.targetUserId || null}, ${sql.json(input.facultyData || {})}, 'PENDING'
              )
            `;
          } catch (dbErr) {
            console.warn("[Frontend DB] Error inserting faculty_onboarding_requests into PostgreSQL:", dbErr);
          }
        }

        return newRequest;
      }),
    assignClassTeacher: publicProcedure
      .input(z.object({ classId: z.string(), facultyId: z.string() }))
      .mutation(async () => {
        return { success: true };
      }),
    assignSubjectTeacher: publicProcedure
      .input(
        z.object({
          subjectId: z.string(),
          facultyId: z.string(),
          classId: z.string().optional(),
          departmentId: z.string().optional(),
          semester: z.number().optional(),
          academicYear: z.string().optional(),
          role: z.string().optional(),
        })
      )
      .mutation(async () => {
        return { success: true };
      }),
    listClasses: publicProcedure
      .input(z.object({ departmentId: z.string().optional() }).optional())
      .query(async () => {
        return [
          {
            id: "class-cse-sem6-a",
            className: "Third Year CSE - Div A",
            academicYear: "2024-2025",
            semester: 6,
            classTeacherId: "user-faculty-1",
            classTeacherName: "Dr. Anand Verma",
            classTeacherEmail: "faculty@northstar.edu",
            createdAt: new Date().toISOString(),
          },
        ];
      }),
    createClass: publicProcedure
      .input(
        z.object({
          className: z.string(),
          academicYear: z.string(),
          semester: z.number(),
          departmentId: z.string().optional(),
          classTeacherId: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return {
          id: `class-${Date.now()}`,
          className: input.className,
          academicYear: input.academicYear,
          semester: input.semester,
          classTeacherId: input.classTeacherId || null,
          createdAt: new Date().toISOString(),
        };
      }),
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
  placement: router({
    checkMyEligibility: publicProcedure
      .input(z.object({ driveId: z.string() }))
      .query(({ input }) => ({
        studentId: "student-rahul-sharma",
        driveId: input.driveId,
        eligible: true,
        reasons: [
          "Cumulative CGPA: Actual 8.42 >= Required 7.5 [PASS]",
          "Active Backlogs: Actual 0 = Required 0 [PASS]",
          "DSA Score: Actual 78 >= Required 70 [PASS]",
          "Python Score: Actual 84 >= Required 65 [PASS]",
          "Internship Status: Actual COMPLETED = Required COMPLETED [PASS]",
        ],
        criteriaResults: [
          {
            passed: true,
            reason: "Cumulative CGPA: Actual 8.42 >= Required 7.5 [PASS]",
            field: "cgpa",
            actualValue: 8.42,
            expectedValue: 7.5,
            operator: ">=",
          },
          {
            passed: true,
            reason: "Active Backlogs: Actual 0 = Required 0 [PASS]",
            field: "active_backlogs",
            actualValue: 0,
            expectedValue: 0,
            operator: "=",
          },
          {
            passed: true,
            reason: "DSA Score: Actual 78 >= Required 70 [PASS]",
            field: "skill.DSA",
            actualValue: 78,
            expectedValue: 70,
            operator: ">=",
          },
          {
            passed: true,
            reason: "Python Score: Actual 84 >= Required 65 [PASS]",
            field: "skill.Python",
            actualValue: 84,
            expectedValue: 65,
            operator: ">=",
          },
          {
            passed: true,
            reason: "Internship Status: Actual COMPLETED = Required COMPLETED [PASS]",
            field: "internship_status",
            actualValue: "COMPLETED",
            expectedValue: "COMPLETED",
            operator: "=",
          },
        ],
        companyName: "ABC Technologies",
        jobTitle: "Associate Software Engineer",
        ctcOrStipend: "14.5 LPA",
        candidateSnapshot: {
          id: "student-rahul-sharma",
          name: "Rahul Sharma",
          cgpa: 8.42,
          activeBacklogs: 0,
          skills: { DSA: 78, Python: 84 },
          internshipStatus: "COMPLETED" as const,
        },
      })),
    getDrives: publicProcedure.query(() => [
      {
        id: "drive-abc-tech",
        companyName: "ABC Technologies",
        jobTitle: "Associate Software Engineer",
        description:
          "Core software engineering and systems development role requiring robust foundation in data structures, algorithms, python, and verified internship experience.",
        ctcOrStipend: "14.5 LPA",
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: "PUBLISHED" as const,
        createdAt: new Date(),
        ruleVersion: 1,
        ruleDefinition: {
          operator: "AND" as const,
          conditions: [
            { field: "cgpa", operator: ">=" as const, value: 7.5 },
            { field: "active_backlogs", operator: "=" as const, value: 0 },
            { field: "skill.DSA", operator: ">=" as const, value: 70 },
            { field: "skill.Python", operator: ">=" as const, value: 65 },
            { field: "internship_status", operator: "=" as const, value: "COMPLETED" },
          ],
        },
        eligibleCount: 18,
        totalEvaluated: 24,
      },
    ]),
    getDriveById: publicProcedure
      .input(z.object({ driveId: z.string() }))
      .query(({ input }) => ({
        drive: {
          id: input.driveId,
          companyName: "ABC Technologies",
          jobTitle: "Associate Software Engineer",
          description: "Core software engineering and systems development role.",
          ctcOrStipend: "14.5 LPA",
          applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: "PUBLISHED" as const,
          createdAt: new Date(),
        },
        rule: {
          operator: "AND" as const,
          conditions: [
            { field: "cgpa", operator: ">=" as const, value: 7.5 },
            { field: "active_backlogs", operator: "=" as const, value: 0 },
            { field: "skill.DSA", operator: ">=" as const, value: 70 },
            { field: "skill.Python", operator: ">=" as const, value: 65 },
            { field: "internship_status", operator: "=" as const, value: "COMPLETED" },
          ],
        },
      })),
    getBenchmarkDrive: publicProcedure.query(() => ({
      drive: {
        id: "drive-abc-tech",
        companyName: "ABC Technologies",
        jobTitle: "Associate Software Engineer",
        description: "Core software engineering role.",
        ctcOrStipend: "14.5 LPA",
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: "PUBLISHED" as const,
        createdAt: new Date(),
      },
      rule: {
        operator: "AND" as const,
        conditions: [
          { field: "cgpa", operator: ">=" as const, value: 7.5 },
          { field: "active_backlogs", operator: "=" as const, value: 0 },
          { field: "skill.DSA", operator: ">=" as const, value: 70 },
          { field: "skill.Python", operator: ">=" as const, value: 65 },
          { field: "internship_status", operator: "=" as const, value: "COMPLETED" },
        ],
      },
    })),
    evaluateRoster: publicProcedure
      .input(z.object({ driveId: z.string() }))
      .mutation(({ input }) => ({
        driveId: input.driveId,
        companyName: "ABC Technologies",
        jobTitle: "Associate Software Engineer",
        totalEvaluated: 42,
        eligibleCount: 31,
        ineligibleCount: 11,
        results: [
          {
            studentId: "student-rahul-sharma",
            studentName: "Rahul Sharma",
            enrollmentNumber: "CSE2024042",
            eligible: true,
            reasons: ["All benchmarks passed"],
            criteriaResults: [],
            snapshot: {
              id: "student-rahul-sharma",
              name: "Rahul Sharma",
              cgpa: 8.42,
              activeBacklogs: 0,
              skills: { DSA: 78, Python: 84 },
              internshipStatus: "COMPLETED" as const,
            },
          },
        ],
      })),
    saveRule: publicProcedure
      .input(
        z.object({
          driveId: z.string(),
          rule: z.object({
            operator: z.enum(["AND", "OR"]),
            conditions: z.array(z.any()),
          }),
        })
      )
      .mutation(({ input }) => ({
        id: "rule-new",
        recruitmentDriveId: input.driveId,
        version: 2,
        ruleDefinition: input.rule,
        isActive: true,
        createdAt: new Date(),
      })),
  }),
  recruitment: router({
    getActiveDrives: publicProcedure.query(() => [
      {
        id: "drive-abc-tech",
        companyName: "ABC Technologies",
        jobTitle: "Associate Software Engineer",
        description: "Core software engineering role.",
        ctcOrStipend: "14.5 LPA",
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: "PUBLISHED" as const,
        totalApplicants: 12,
        rule: {
          operator: "AND" as const,
          conditions: [
            { field: "cgpa", operator: ">=" as const, value: 7.5 },
            { field: "active_backlogs", operator: "=" as const, value: 0 },
            { field: "skill.DSA", operator: ">=" as const, value: 70 },
            { field: "skill.Python", operator: ">=" as const, value: 65 },
            { field: "internship_status", operator: "=" as const, value: "COMPLETED" },
          ],
        },
      },
    ]),
    applyToDrive: publicProcedure
      .input(z.object({ driveId: z.string() }))
      .mutation(({ input }) => ({
        application: {
          id: "app-demo-1",
          studentId: "student-rahul-sharma",
          recruitmentDriveId: input.driveId,
          status: "APPLIED" as const,
          appliedAt: new Date(),
        },
        drive: {
          id: input.driveId,
          companyName: "ABC Technologies",
          jobTitle: "Associate Software Engineer",
          ctcOrStipend: "14.5 LPA",
        },
        evaluation: {
          studentId: "student-rahul-sharma",
          driveId: input.driveId,
          eligible: true,
          reasons: ["All criteria passed"],
          criteriaResults: [],
        },
      })),
    getMyApplications: publicProcedure.query(() => [
      {
        id: "app-1",
        recruitmentDriveId: "drive-abc-tech",
        status: "APPLIED" as "APPLIED" | "SHORTLISTED" | "INTERVIEWING" | "OFFERED" | "REJECTED",
        appliedAt: new Date(),
        companyName: "ABC Technologies",
        jobTitle: "Associate Software Engineer",
        description: "Core software engineering role.",
        ctcOrStipend: "14.5 LPA",
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        driveStatus: "PUBLISHED" as const,
      },
    ]),
    getDriveApplicants: publicProcedure
      .input(z.object({ driveId: z.string() }))
      .query(({ input }) => [
        {
          applicationId: "app-1",
          status: "APPLIED" as "APPLIED" | "SHORTLISTED" | "INTERVIEWING" | "OFFERED" | "REJECTED",
          appliedAt: new Date(),
          studentId: "student-rahul-sharma",
          enrollmentNumber: "CSE2024042",
          program: "B.Tech Computer Science and Engineering",
          currentSemester: 6,
          studentName: "Rahul Sharma",
          studentEmail: "rahul.sharma@northstar.edu",
          snapshot: {
            id: "student-rahul-sharma",
            name: "Rahul Sharma",
            cgpa: 8.42,
            activeBacklogs: 0,
            skills: { DSA: 78, Python: 84 },
            internshipStatus: "COMPLETED" as const,
          },
        },
      ]),
    updateApplicantStatus: publicProcedure
      .input(
        z.object({
          applicationId: z.string(),
          status: z.enum([
            "APPLIED",
            "SHORTLISTED",
            "INTERVIEWING",
            "OFFERED",
            "REJECTED",
          ]),
          remarks: z.string().optional(),
        })
      )
      .mutation(({ input }) => ({
        id: input.applicationId,
        status: input.status,
        updatedAt: new Date(),
      })),
  }),
  dashboard: router({
    getStudentDashboard: publicProcedure.query(() => ({
      student: {
        id: "student-rahul-sharma",
        name: "Rahul Sharma",
        email: "student@northstar.edu",
        enrollmentNumber: "CS-2023-0842",
        program: "B.Tech Computer Science and Engineering",
        institution: "Northstar Institute of Technology",
        semester: 6,
        admissionYear: 2023,
        graduationYear: 2027,
      },
      metrics: {
        cgpa: 8.42,
        totalCredits: 132,
        activeBacklogs: 0,
        verifiedSkillsCount: 5,
        totalSkillsCount: 6,
        internshipStatus: "COMPLETED",
        internshipCompleteness: 100,
        totalEvidenceDocuments: 10,
        verifiedEvidenceDocuments: 9,
      },
      readinessScorecard: {
        readinessScore: 87.26,
        methodologyExplanation:
          "A deterministic weighted average of four transparent progress indicators: (Academic 30%) + (Skill Coverage 30%) + (Internship 20%) + (Verified Evidence 20%). It is not an AI-generated employability score.",
        formula: "ReadinessScore = (A * 0.30) + (S * 0.30) + (I * 0.20) + (E * 0.20)",
        breakdown: {
          academic: {
            rawCgpa: 8.42,
            percentage: 84.2,
            weight: 0.3,
            weightedContribution: 25.26,
          },
          skills: {
            totalCoreSkills: 5,
            skillsAboveThreshold: 4,
            percentage: 80,
            weight: 0.3,
            weightedContribution: 24,
          },
          internship: {
            completeness: 100,
            weight: 0.2,
            weightedContribution: 20,
          },
          evidence: {
            totalClaims: 10,
            verifiedClaims: 9,
            percentage: 90,
            weight: 0.2,
            weightedContribution: 18,
          },
        },
      },
      academics: {
        cgpa: 8.42,
        totalCredits: 132,
        activeBacklogsCount: 0,
        semesters: [] as any[],
      },
      skills: [] as any[],
      internship: null as any,
      skillGap: {
        skill: "Operating Systems",
        severity: "MEDIUM",
        reason: "OS score dropped by 9% across two assessment cycles.",
        detectedAt: "2026-09-17T12:00:00.000Z",
      },
      applications: [] as any[],
    })),
    getCareerPassport: publicProcedure.query(() => ({
      passportId: "PASS-NIT-CSE-CS20230842",
      generatedAt: "2026-09-17T12:00:00.000Z",
      institution: {
        name: "Northstar Institute of Technology",
        code: "NIT",
        department: "Department of Computer Science & Engineering",
        sealText: "OFFICIAL INSTITUTIONAL SEAL · VERIFIED PORTABLE CAREER DOSSIER",
      },
      student: {
        id: "student-rahul-sharma",
        name: "Rahul Sharma",
        email: "student@northstar.edu",
        enrollmentNumber: "CS-2023-0842",
        program: "B.Tech Computer Science and Engineering",
        institution: "Northstar Institute of Technology",
        semester: 6,
        admissionYear: 2023,
        graduationYear: 2027,
      },
      readinessScorecard: {
        readinessScore: 87.26,
        methodologyExplanation:
          "A deterministic weighted average of four transparent progress indicators: (Academic 30%) + (Skill Coverage 30%) + (Internship 20%) + (Verified Evidence 20%). It is not an AI-generated employability score.",
        formula: "ReadinessScore = (A * 0.30) + (S * 0.30) + (I * 0.20) + (E * 0.20)",
        breakdown: {
          academic: { rawCgpa: 8.42, percentage: 84.2, weight: 0.3, weightedContribution: 25.26 },
          skills: { totalCoreSkills: 5, skillsAboveThreshold: 4, percentage: 80, weight: 0.3, weightedContribution: 24 },
          internship: { completeness: 100, weight: 0.2, weightedContribution: 20 },
          evidence: { totalClaims: 10, verifiedClaims: 9, percentage: 90, weight: 0.2, weightedContribution: 18 },
        },
      },
      academicLedger: {
        cumulativeCgpa: 8.42,
        totalCredits: 132,
        activeBacklogs: 0,
        backlogStatus: "ZERO_ACTIVE_BACKLOGS" as const,
        verifiedStatus: "INSTITUTION_VERIFIED" as const,
        semesters: [
          { semester: 1, semesterLabel: "Semester 1", academicYear: "2023-24", sgpa: 8.2, cgpa: 8.2, creditsEarned: 22, status: "COMPLETED" },
          { semester: 2, semesterLabel: "Semester 2", academicYear: "2023-24", sgpa: 8.5, cgpa: 8.35, creditsEarned: 22, status: "COMPLETED" },
          { semester: 3, semesterLabel: "Semester 3", academicYear: "2024-25", sgpa: 8.4, cgpa: 8.37, creditsEarned: 22, status: "COMPLETED" },
          { semester: 4, semesterLabel: "Semester 4", academicYear: "2024-25", sgpa: 8.1, cgpa: 8.3, creditsEarned: 22, status: "COMPLETED" },
          { semester: 5, semesterLabel: "Semester 5", academicYear: "2025-26", sgpa: 8.6, cgpa: 8.36, creditsEarned: 22, status: "COMPLETED" },
          { semester: 6, semesterLabel: "Semester 6", academicYear: "2025-26", sgpa: 8.7, cgpa: 8.42, creditsEarned: 22, status: "COMPLETED" },
        ],
      },
      verifiedSkills: [
        { skillName: "Python Programming", category: "Software Development", score: 84, proficiency: "EXPERT" as const, lastAssessed: "Assessment Cycle 3", assessmentCycles: 3, verified: true },
        { skillName: "Data Structures & Algorithms", category: "Core Technical", score: 78, proficiency: "PROFICIENT" as const, lastAssessed: "Assessment Cycle 3", assessmentCycles: 3, verified: true },
        { skillName: "Object-Oriented Programming", category: "Software Development", score: 81, proficiency: "EXPERT" as const, lastAssessed: "Assessment Cycle 3", assessmentCycles: 3, verified: true },
        { skillName: "Database Management Systems", category: "Core Technical", score: 72, proficiency: "PROFICIENT" as const, lastAssessed: "Assessment Cycle 3", assessmentCycles: 3, verified: true },
      ],
      verifiedInternship: {
        companyName: "TechCorp Innovations",
        role: "Software Engineering Intern",
        duration: "8 Weeks (Jun 2026 - Aug 2026)",
        startDate: "2026-06-01",
        endDate: "2026-08-01",
        status: "COMPLETED",
        verificationStatus: "INSTITUTION_VERIFIED",
        mentorSignOff: {
          facultyName: "Dr. Anand Verma",
          designation: "Associate Professor & Faculty Placement Advisor",
          signedAt: "16 Sep 2026",
          notes: "Approved with complete institutional compliance and milestone verification.",
        },
        cryptographicEvidence: [
          {
            documentType: "PDF_DOCUMENT",
            title: "TechCorp_Offer_Letter.pdf",
            sha256Hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            verified: true,
            verifiedAt: "2026-09-16",
          },
          {
            documentType: "PDF_DOCUMENT",
            title: "TechCorp_Completion_Certificate.pdf",
            sha256Hash: "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9",
            verified: true,
            verifiedAt: "2026-09-16",
          },
        ],
      },
      placementDrives: [
        {
          companyName: "ABC Technologies",
          jobTitle: "Associate Software Engineer",
          ctcOrStipend: "14.5 LPA",
          status: "SHORTLISTED",
          appliedAt: new Date().toISOString(),
        },
      ],
      verificationStamp: {
        sha256IntegrityHash: "a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0",
        signatureAuthority: "Dean of Academic Affairs & Faculty Placement Board",
        verificationUrl: "https://pragati.nit.ac.in/verify/PASS-NIT-CSE-CS20230842",
      },
    })),
    getHodAnalytics: publicProcedure.query(() => ({
      department: {
        id: "dept-cse-001",
        name: "Department of Computer Science & Engineering",
        code: "CSE",
        totalStudents: 120,
        facultyCount: 14,
        averageCgpa: 8.15,
      },
      skillHeatmap: {
        semesters: ["Sem 3", "Sem 4", "Sem 5", "Sem 6"],
        skills: [
          {
            skillName: "Data Structures & Algorithms",
            category: "Core Technical",
            semesterAverages: [
              { semester: "Sem 3", averageScore: 72, status: "MODERATE" as const },
              { semester: "Sem 4", averageScore: 68, status: "MODERATE" as const },
              { semester: "Sem 5", averageScore: 76, status: "EXCELLENT" as const },
              { semester: "Sem 6", averageScore: 78, status: "EXCELLENT" as const },
            ],
          },
          {
            skillName: "Operating Systems",
            category: "Systems",
            semesterAverages: [
              { semester: "Sem 3", averageScore: 65, status: "MODERATE" as const },
              { semester: "Sem 4", averageScore: 59, status: "CRITICAL" as const },
              { semester: "Sem 5", averageScore: 64, status: "CRITICAL" as const },
              { semester: "Sem 6", averageScore: 71, status: "MODERATE" as const },
            ],
          },
          {
            skillName: "Database Management Systems",
            category: "Core Technical",
            semesterAverages: [
              { semester: "Sem 3", averageScore: 75, status: "EXCELLENT" as const },
              { semester: "Sem 4", averageScore: 79, status: "EXCELLENT" as const },
              { semester: "Sem 5", averageScore: 82, status: "EXCELLENT" as const },
              { semester: "Sem 6", averageScore: 84, status: "EXCELLENT" as const },
            ],
          },
          {
            skillName: "Python Programming",
            category: "Software Development",
            semesterAverages: [
              { semester: "Sem 3", averageScore: 80, status: "EXCELLENT" as const },
              { semester: "Sem 4", averageScore: 83, status: "EXCELLENT" as const },
              { semester: "Sem 5", averageScore: 85, status: "EXCELLENT" as const },
              { semester: "Sem 6", averageScore: 88, status: "EXCELLENT" as const },
            ],
          },
          {
            skillName: "Computer Networks",
            category: "Systems",
            semesterAverages: [
              { semester: "Sem 3", averageScore: 68, status: "MODERATE" as const },
              { semester: "Sem 4", averageScore: 67, status: "MODERATE" as const },
              { semester: "Sem 5", averageScore: 70, status: "MODERATE" as const },
              { semester: "Sem 6", averageScore: 75, status: "EXCELLENT" as const },
            ],
          },
        ],
      },
      interventionVelocity: {
        flaggedGaps: 18,
        scheduledInterventions: 16,
        completedInterventions: 14,
        resolutionRate: 77.8,
        breakdown: [
          { category: "Systems (OS/CN)", flagged: 9, resolved: 7 },
          { category: "Algorithms & Data Structures", flagged: 6, resolved: 5 },
          { category: "Core Databases", flagged: 3, resolved: 2 },
        ],
      },
      placementReadinessDistribution: {
        totalEligible: 101,
        tier1Eligible: { count: 46, percentage: 38, label: "Tier 1 (10+ LPA)" as const },
        tier2Eligible: { count: 55, percentage: 46, label: "Tier 2 (6-10 LPA)" as const },
        remedialRequired: { count: 19, percentage: 16, label: "Remedial Needed (<65)" as const },
      },
    })),
  }),

  superAdmin: router({
    getPlatformStats: superAdminProcedure.query(async () => {
      return {
        totalInstitutions: 2,
        activeInstitutions: 2,
        suspendedInstitutions: 0,
        demoInstitutions: 1,
        totalUsers: 9,
        totalStudents: 1,
      };
    }),
    listInstitutions: superAdminProcedure
      .input(
        z
          .object({
            status: z.enum(["ACTIVE", "SUSPENDED", "ALL"]).optional(),
            includeDemo: z.boolean().default(true),
            search: z.string().optional(),
          })
          .optional()
      )
      .query(async () => {
        return [
          {
            id: "10000000-0000-0000-0000-000000000000",
            name: "Northstar Institute of Technology (Demo)",
            code: "NIT-DEMO",
            domain: "northstar.edu",
            universityBoard: "Autonomous Technical University",
            address: "100 Innovation Boulevard, Tech District",
            city: "Pune",
            state: "Maharashtra",
            contactPhone: "+91 98765 43210",
            contactEmail: "admin@northstar.edu",
            isDemo: true,
            status: "ACTIVE" as const,
            suspensionReason: null,
            suspendedAt: null,
            isDeleted: false,
            deletedAt: null,
            createdAt: new Date().toISOString(),
          },
        ];
      }),
    provisionInstitution: superAdminProcedure
      .input(
        z.object({
          name: z.string().min(3),
          code: z.string().min(2),
          domain: z.string().min(3),
          universityBoard: z.string().min(2),
          address: z.string().min(5),
          city: z.string().min(2),
          state: z.string().min(2),
          contactPhone: z.string().min(8),
          contactEmail: z.string().email(),
          adminName: z.string().min(2),
          adminEmail: z.string().email(),
          adminPhone: z.string().min(8),
          adminDesignation: z.string().min(2),
          adminEmployeeId: z.string().min(2),
        })
      )
      .mutation(async ({ input }) => {
        return {
          success: true,
          message: `Institution '${input.name}' and administrator '${input.adminName}' provisioned successfully.`,
          institution: {
            id: "inst-" + Date.now(),
            name: input.name,
            code: input.code,
            domain: input.domain,
            status: "ACTIVE" as const,
            isDemo: false,
          },
        };
      }),
    suspendInstitution: superAdminProcedure
      .input(
        z.object({
          institutionId: z.string(),
          reason: z.string().min(5),
        })
      )
      .mutation(async () => {
        return {
          success: true,
          message: `Institution suspended. Lockout reason recorded.`,
        };
      }),
    reviveInstitution: superAdminProcedure
      .input(z.object({ institutionId: z.string() }))
      .mutation(async () => {
        return {
          success: true,
          message: "Institution revived successfully.",
        };
      }),
    softDeleteInstitution: superAdminProcedure
      .input(z.object({ institutionId: z.string() }))
      .mutation(async () => {
        return {
          success: true,
          message: "Institution soft-deleted into 30-day recovery pool.",
        };
      }),
    listTrash: superAdminProcedure.query(async () => {
      return [] as {
        resourceType: "INSTITUTION";
        resourceId: string;
        name: string;
        code: string;
        deletedAt: string;
        daysRemaining: number;
        isExpired: boolean;
      }[];
    }),
    restoreFromTrash: superAdminProcedure
      .input(
        z.object({
          resourceType: z.enum(["INSTITUTION", "USER", "DEPARTMENT"]),
          resourceId: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        return {
          success: true,
          message: `${input.resourceType} restored from trash.`,
        };
      }),
    listChangeRequests: superAdminProcedure
      .input(
        z
          .object({
            status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
          })
          .optional()
      )
      .query(async () => {
        return [] as {
          id: string;
          institutionId: string;
          institutionName: string | null;
          requestedBy: string;
          requestedByName: string | null;
          requestedChanges: unknown;
          reason: string;
          status: "PENDING" | "APPROVED" | "REJECTED";
          reviewNotes: string | null;
          reviewedAt: string | null;
          createdAt: string;
        }[];
      }),
    reviewChangeRequest: superAdminProcedure
      .input(
        z.object({
          requestId: z.string(),
          action: z.enum(["APPROVE", "REJECT"]),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        return {
          success: true,
          message: `Change request marked as ${input.action}.`,
        };
      }),
  }),

  admin: router({
    getPendingFacultyRequests: superAdminProcedure.query(async () => {
      let pending = inMemoryFacultyOnboardingRequests.filter(r => r.status === "PENDING");

      const sql = getPg();
      if (sql) {
        try {
          const dbRows = await sql`
            SELECT r.id, r.institution_id as "institutionId", r.department_id as "departmentId",
                   r.submitted_by as "submittedBy", r.request_type as "requestType", r.target_user_id as "targetUserId",
                   r.faculty_data as "facultyData", r.status, r.created_at as "createdAt",
                   d.name as "departmentName", u.name as "submitterName", u.email as "submitterEmail"
            FROM faculty_onboarding_requests r
            LEFT JOIN departments d ON r.department_id = d.id
            LEFT JOIN users u ON r.submitted_by = u.id
            WHERE r.status = 'PENDING'
            ORDER BY r.created_at DESC
          `;
          const existingIds = new Set(pending.map(p => p.id));
          for (const row of dbRows) {
            if (!existingIds.has(row.id)) {
              pending.push({
                id: row.id,
                institutionId: row.institutionId,
                departmentId: row.departmentId,
                submittedBy: row.submittedBy,
                requestType: row.requestType,
                targetUserId: row.targetUserId,
                facultyData: row.facultyData,
                status: row.status,
                createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
                departmentName: row.departmentName || "Computer Science & Engineering",
                submitterName: row.submitterName || "Prof. Sunita Rao",
                submitterEmail: row.submitterEmail || "hod.cse@northstar.edu",
              });
            }
          }
        } catch (dbErr) {
          console.warn("[Frontend DB] Error querying faculty_onboarding_requests:", dbErr);
        }
      }

      return pending;
    }),
    processFacultyRequests: superAdminProcedure
      .input(
        z.object({
          requestIds: z.array(z.string()).min(1),
          action: z.enum(["APPROVE", "REJECT"]),
          rejectionReason: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const now = new Date().toISOString();
        const sql = getPg();

        for (const reqId of input.requestIds) {
          const req = inMemoryFacultyOnboardingRequests.find(r => r.id === reqId);
          if (req) {
            req.status = input.action === "APPROVE" ? "APPROVED" : "REJECTED";
            req.reviewedBy = ctx.user?.id != null ? String(ctx.user.id) : "user-admin-1";
            req.reviewedAt = now;
            req.reviewNotes = input.rejectionReason || (input.action === "APPROVE" ? "Approved by Admin" : "Rejected by Admin");

            if (input.action === "APPROVE" && req.requestType === "CREATE" && req.facultyData) {
              const facultyData = req.facultyData;
              const newFacultyId = `user-fac-${Date.now()}`;
              const tempPassword = "password123";

              // Provision user in usersStore with mustChangePassword: true
              usersStore.set(facultyData.email.toLowerCase(), {
                id: newFacultyId,
                name: facultyData.name,
                email: facultyData.email,
                role: "FACULTY",
                department: req.departmentName || "Computer Science & Engineering",
                roleId: facultyData.facultyId || `FAC-CS-${Date.now().toString().slice(-3)}`,
                designation: facultyData.designation || "Assistant Professor",
                avatar: facultyData.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2),
                mustChangePassword: true,
              });

              // Add to facultyListStore so Admin and HOD see the new faculty member in faculty roster
              facultyListStore.unshift({
                id: newFacultyId,
                name: facultyData.name,
                email: facultyData.email,
                role: "FACULTY" as const,
                departmentId: req.departmentId,
                isActive: true,
                mustChangePassword: true,
                departmentName: req.departmentName,
              });

              // Dispatch Welcome Email with Credentials (rerouted to DEMO_NOTIFICATION_EMAIL if demo)
              try {
                const mailRes = await sendWelcomeEmail({
                  name: facultyData.name,
                  toEmail: facultyData.email,
                  role: "FACULTY",
                  identifier: facultyData.facultyId || "FAC-EMP",
                  tempPassword,
                  loginUrl: "http://localhost:3000/login",
                });
                console.log("[Admin Approval] Faculty welcome email dispatch result:", mailRes);
              } catch (mailErr) {
                console.warn("[Email] Failed to dispatch faculty welcome email:", mailErr);
              }
            } else if (input.action === "APPROVE" && req.requestType === "DELETE" && req.targetUserId) {
              const targetIdx = facultyListStore.findIndex(f => f.id === req.targetUserId);
              if (targetIdx !== -1) {
                facultyListStore.splice(targetIdx, 1);
              }
            }
          }

          // Update DB if PostgreSQL available
          if (sql) {
            try {
              if (input.action === "APPROVE") {
                await sql`
                  UPDATE faculty_onboarding_requests
                  SET status = 'APPROVED', reviewed_at = NOW(), review_notes = ${input.rejectionReason || 'Approved by Admin'}
                  WHERE id::text = ${reqId}
                `;
              } else {
                await sql`
                  UPDATE faculty_onboarding_requests
                  SET status = 'REJECTED', reviewed_at = NOW(), review_notes = ${input.rejectionReason || 'Rejected by Admin'}
                  WHERE id::text = ${reqId}
                `;
              }
            } catch (dbErr) {
              console.warn("[Frontend DB] Error updating faculty_onboarding_requests in DB:", dbErr);
            }
          }
        }

        return { processedCount: input.requestIds.length, action: input.action };
      }),
    reassignFacultyDesignation: superAdminProcedure
      .input(
        z.object({
          facultyUserId: z.string(),
          newRole: z.enum(["FACULTY", "HOD", "TNP_COORDINATOR"]),
          departmentId: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const fac = facultyListStore.find(f => f.id === input.facultyUserId);
        if (fac) {
          fac.role = input.newRole;
          if (input.departmentId) fac.departmentId = input.departmentId;
        }
        Array.from(usersStore.values()).forEach(user => {
          if (user.id === input.facultyUserId) {
            user.role = input.newRole as any;
            if (input.newRole === "HOD") user.designation = `Head of Department (${user.department})`;
            if (input.newRole === "TNP_COORDINATOR") user.designation = `Training & Placement Coordinator`;
            if (input.newRole === "FACULTY") user.designation = `Faculty Member`;
          }
        });
        return {
          id: input.facultyUserId,
          role: input.newRole,
          departmentId: input.departmentId,
        };
      }),
    listDepartments: superAdminProcedure.query(async () => {
      const sql = getPg();
      if (sql) {
        try {
          const dbDepts = await sql`SELECT id, name, code FROM departments`;
          const existingIds = new Set(departmentsStore.map(d => d.id));
          for (const d of dbDepts) {
            if (!existingIds.has(d.id)) {
              departmentsStore.push({ id: d.id, name: d.name, code: d.code });
            }
          }
        } catch {}
      }
      return departmentsStore;
    }),
    createDepartment: superAdminProcedure
      .input(
        z.object({
          name: z.string().min(2),
          code: z.string().min(2).max(10).toUpperCase(),
        })
      )
      .mutation(async ({ input }) => {
        const newDept = {
          id: `dept-${input.code.toLowerCase()}-${Date.now()}`,
          name: input.name,
          code: input.code,
        };
        departmentsStore.push(newDept);

        const sql = getPg();
        if (sql) {
          try {
            const meta = await getDbMetadata();
            await sql`
              INSERT INTO departments (institution_id, name, code)
              VALUES (${meta.instId}, ${input.name}, ${input.code})
            `;
          } catch {}
        }
        return newDept;
      }),
    listFaculty: superAdminProcedure.query(async () => {
      return facultyListStore;
    }),
    listStudents: superAdminProcedure.query(async () => {
      const studentsList = [
        {
          id: "student-rahul-sharma",
          userId: "10000000-0000-0000-0000-000000000005",
          name: "Rahul Sharma",
          email: "student@northstar.edu",
          departmentId: "dept-cse-001",
          departmentName: "Computer Science & Engineering",
          enrollmentNumber: "CSE2024042",
          program: "B.Tech Computer Science and Engineering",
          currentSemester: 6,
          cgpa: 8.42,
          internshipStatus: "COMPLETED",
          skillGapsCount: 1,
          status: "active",
        },
      ];

      // Merge newly approved students from FACULTY_WARDS
      for (const ward of FACULTY_WARDS) {
        if (ward.enrollmentNumber !== "CSE2024042") {
          studentsList.unshift({
            id: ward.studentProfileId,
            userId: ward.userId,
            name: ward.name,
            email: ward.email,
            departmentId: "dept-cse-001",
            departmentName: "Computer Science & Engineering",
            enrollmentNumber: ward.enrollmentNumber,
            program: ward.program,
            currentSemester: ward.currentSemester,
            cgpa: ward.cgpa || 8.5,
            internshipStatus: "NOT_STARTED",
            skillGapsCount: 0,
            status: "active",
          });
        }
      }

      return studentsList;
    }),
  }),
});

export type AppRouter = typeof appRouter;


