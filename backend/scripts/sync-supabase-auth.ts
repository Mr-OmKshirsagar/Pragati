import "dotenv/config";
import { supabaseAdmin, isSupabaseConfigured } from "../src/_core/supabase";

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
    department: "Computer Science and Engineering",
    roleId: "FAC-CS-104",
    designation: "Associate Professor & Mentor",
  },
  {
    id: "10000000-0000-0000-0000-000000000002",
    email: "hod.cse@northstar.edu",
    password: "password123",
    name: "Prof. Sunita Rao",
    role: "HOD",
    department: "Computer Science and Engineering",
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
    department: "Computer Science and Engineering",
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
    department: "Computer Science and Engineering",
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
    department: "Computer Science and Engineering",
    roleId: "FAC-CS-104",
    designation: "Associate Professor & Mentor",
  },
  {
    email: "sunita.rao@northstar.edu",
    password: "password123",
    name: "Prof. Sunita Rao",
    role: "HOD",
    department: "Computer Science and Engineering",
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

export async function syncSupabaseAuthUsers(): Promise<{
  created: number;
  updated: number;
  total: number;
}> {
  console.log("==================================================");
  console.log("   PRAGATI SUPABASE AUTHENTICATION USER SYNC      ");
  console.log("==================================================\n");

  if (!isSupabaseConfigured) {
    console.warn("⚠️ SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL missing; skipping auth user sync.");
    return { created: 0, updated: 0, total: 0 };
  }

  // 1. Fetch all existing users in Supabase auth.users
  const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (listError) {
    console.error("❌ Failed to list Supabase auth users:", listError.message);
    throw listError;
  }

  const existingUsers = listData?.users || [];
  console.log(`📋 Found ${existingUsers.length} existing user(s) in Supabase Authentication.\n`);

  let createdCount = 0;
  let updatedCount = 0;

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
      console.log(`🚀 Creating user in Supabase auth: ${persona.name} <${persona.email}> [${persona.role}]...`);
      const createPayload: any = {
        email: persona.email,
        password: persona.password,
        email_confirm: true,
        user_metadata: userMetadata,
      };

      if (persona.id) {
        createPayload.id = persona.id;
      }

      const { data: createData, error: createError } =
        await supabaseAdmin.auth.admin.createUser(createPayload);

      if (createError) {
        console.error(`   ❌ Failed to create ${persona.email}:`, createError.message);
      } else {
        console.log(`   ✅ Successfully created in Supabase auth (ID: ${createData.user.id})`);
        createdCount++;
      }
    } else {
      console.log(`🔄 User exists in Supabase auth: ${persona.name} <${persona.email}>. Synchronizing metadata & password...`);
      const { data: updateData, error: updateError } =
        await supabaseAdmin.auth.admin.updateUserById(existing.id, {
          password: persona.password,
          email_confirm: true,
          user_metadata: {
            ...existing.user_metadata,
            ...userMetadata,
          },
        });

      if (updateError) {
        console.error(`   ❌ Failed to update ${persona.email}:`, updateError.message);
      } else {
        console.log(`   ✅ Synchronized Supabase user (ID: ${updateData.user.id})`);
        updatedCount++;
      }
    }
  }

  const { data: finalList } = await supabaseAdmin.auth.admin.listUsers();
  const total = finalList?.users?.length || 0;

  console.log("\n==================================================");
  console.log(`🎉 Supabase Auth Sync Finished!`);
  console.log(`   Created: ${createdCount} | Updated: ${updatedCount} | Total in Supabase Users tab: ${total}`);
  console.log("==================================================\n");

  return { created: createdCount, updated: updatedCount, total };
}

// Run directly if called via CLI
if (process.argv[1]?.includes("sync-supabase-auth")) {
  syncSupabaseAuthUsers()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
