import { supabaseAdmin } from "./supabase";

export interface PersonaAuthData {
  id?: string;
  email: string;
  password: string;
  name: string;
  role: "STUDENT" | "FACULTY" | "HOD" | "TNP_COORDINATOR" | "ADMIN";
  department: string;
  roleId: string;
  designation: string;
  enrollmentNumber?: string;
  program?: string;
  currentSemester?: number;
}

export const SEED_AUTH_PERSONAS: PersonaAuthData[] = [
  {
    id: "10000000-0000-0000-0000-000000000001",
    email: "faculty@northstar.edu",
    password: "password123",
    name: "Dr. Anand Verma",
    role: "FACULTY",
    department: "Computer Science & Engineering",
    roleId: "FAC-CS-104",
    designation: "Associate Professor & Mentor",
  },
  {
    id: "10000000-0000-0000-0000-000000000002",
    email: "hod.cse@northstar.edu",
    password: "password123",
    name: "Prof. Sunita Rao",
    role: "HOD",
    department: "Computer Science & Engineering",
    roleId: "HOD-CSE-001",
    designation: "Head of Department (CSE)",
  },
  {
    id: "10000000-0000-0000-0000-000000000003",
    email: "tnp@northstar.edu",
    password: "password123",
    name: "Vikram Malhotra",
    role: "TNP_COORDINATOR",
    department: "Training & Placement Cell",
    roleId: "TNP-ENG-042",
    designation: "Head of Training & Placement",
  },
  {
    id: "10000000-0000-0000-0000-000000000004",
    email: "admin@northstar.edu",
    password: "password123",
    name: "Platform Administrator",
    role: "ADMIN",
    department: "Institutional Systems & Governance",
    roleId: "ADM-SYS-001",
    designation: "Platform Administrator",
  },
  {
    id: "10000000-0000-0000-0000-000000000005",
    email: "student@northstar.edu",
    password: "password123",
    name: "Rahul Sharma",
    role: "STUDENT",
    department: "Computer Science & Engineering",
    enrollmentNumber: "CSE2024042",
    program: "B.Tech Computer Science and Engineering",
    currentSemester: 6,
    roleId: "CS-2023-0842",
    designation: "B.Tech CSE · Sem 6",
  },
  {
    email: "rahul.sharma@northstar.edu",
    password: "password123",
    name: "Rahul Sharma",
    role: "STUDENT",
    department: "Computer Science & Engineering",
    enrollmentNumber: "CSE2024042",
    program: "B.Tech Computer Science and Engineering",
    currentSemester: 6,
    roleId: "CS-2023-0842",
    designation: "B.Tech CSE · Sem 6",
  },
  {
    email: "meera.nair@northstar.edu",
    password: "password123",
    name: "Dr. Meera Nair",
    role: "FACULTY",
    department: "Computer Science & Engineering",
    roleId: "FAC-CS-104",
    designation: "Associate Professor & Mentor",
  },
  {
    email: "sunita.rao@northstar.edu",
    password: "password123",
    name: "Prof. Sunita Rao",
    role: "HOD",
    department: "Computer Science & Engineering",
    roleId: "HOD-CSE-001",
    designation: "Head of Department (CSE)",
  },
  {
    email: "vikram.mehta@northstar.edu",
    password: "password123",
    name: "Prof. Vikram Mehta",
    role: "TNP_COORDINATOR",
    department: "Training & Placement Cell",
    roleId: "TNP-ENG-042",
    designation: "Head of Training & Placement",
  },
];

let syncExecuted = false;

export async function ensureSupabaseAuthPersonas(): Promise<void> {
  if (syncExecuted) return;
  syncExecuted = true;

  try {
    const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (listError) {
      return;
    }

    const existingUsers = listData?.users || [];

    for (const persona of SEED_AUTH_PERSONAS) {
      const emailLower = persona.email.toLowerCase();
      const existing = existingUsers.find(
        u => u.email?.toLowerCase() === emailLower || (persona.id && u.id === persona.id)
      );

      const userMetadata = {
        name: persona.name,
        role: persona.role,
        department: persona.department,
        roleId: persona.roleId,
        designation: persona.designation,
        enrollmentNumber: persona.enrollmentNumber,
        program: persona.program,
        currentSemester: persona.currentSemester,
        email_verified: true,
      };

      if (!existing) {
        const payload: any = {
          email: persona.email,
          password: persona.password,
          email_confirm: true,
          user_metadata: userMetadata,
        };
        if (persona.id) {
          payload.id = persona.id;
        }
        await supabaseAdmin.auth.admin.createUser(payload);
      }
    }
  } catch (err) {
    // Non-blocking background sync
  }
}
