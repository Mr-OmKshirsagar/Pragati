import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { eq } from "drizzle-orm";
import { studentProfiles, users, type User } from "../../drizzle/schema";
import { getDb } from "../db";
import { supabaseAdmin } from "./supabase";

export interface StudentProfileContext {
  id: string;
  enrollmentNumber: string;
  program: string;
  currentSemester: number;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: "STUDENT" | "FACULTY" | "HOD" | "ADMIN";
  institutionId: string;
  departmentId?: string | null;
  name: string;
  studentProfile?: StudentProfileContext;
}

export async function createContext({ req, res }: CreateExpressContextOptions) {
  let user: AuthenticatedUser | null = null;
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();

    try {
      const db = await getDb();
      if (db) {
        // 1. Check for Demo Fast-Switch Tokens (demo_STUDENT, demo_FACULTY, etc.)
        if (token.startsWith("demo_")) {
          const targetRole = token.replace("demo_", "") as
            | "STUDENT"
            | "FACULTY"
            | "HOD"
            | "ADMIN";

          const [matchedUser] = await db
            .select()
            .from(users)
            .where(eq(users.role, targetRole))
            .limit(1);

          if (matchedUser) {
            let studentProf: StudentProfileContext | undefined;
            if (matchedUser.role === "STUDENT") {
              const [sp] = await db
                .select()
                .from(studentProfiles)
                .where(eq(studentProfiles.userId, matchedUser.id))
                .limit(1);

              if (sp) {
                studentProf = {
                  id: sp.id,
                  enrollmentNumber: sp.enrollmentNumber,
                  program: sp.program,
                  currentSemester: sp.currentSemester,
                };
              }
            }

            user = {
              id: matchedUser.id,
              email: matchedUser.email,
              role: matchedUser.role,
              institutionId: matchedUser.institutionId,
              departmentId: matchedUser.departmentId,
              name: matchedUser.name,
              studentProfile: studentProf,
            };
          }
        } else {
          // 2. Standard Supabase Auth Bearer JWT validation
          const {
            data: { user: authUser },
            error,
          } = await supabaseAdmin.auth.getUser(token);

          if (!error && authUser) {
            const [profile] = await db
              .select()
              .from(users)
              .where(eq(users.id, authUser.id))
              .limit(1);

            if (profile) {
              let studentProf: StudentProfileContext | undefined;
              if (profile.role === "STUDENT") {
                const [sp] = await db
                  .select()
                  .from(studentProfiles)
                  .where(eq(studentProfiles.userId, profile.id))
                  .limit(1);

                if (sp) {
                  studentProf = {
                    id: sp.id,
                    enrollmentNumber: sp.enrollmentNumber,
                    program: sp.program,
                    currentSemester: sp.currentSemester,
                  };
                }
              }

              user = {
                id: profile.id,
                email: profile.email,
                role: profile.role,
                institutionId: profile.institutionId,
                departmentId: profile.departmentId,
                name: profile.name,
                studentProfile: studentProf,
              };
            }
          }
        }
      }
    } catch (e) {
      console.warn("[Auth] Token verification failed:", e);
    }
  }

  return { req, res, user };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
