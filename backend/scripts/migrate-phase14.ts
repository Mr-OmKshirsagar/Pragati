import "dotenv/config";
import postgres from "postgres";

async function migratePhase14() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const sql = postgres(connectionString);

  console.log("Applying Phase 14 Hierarchical Provisioning & Approval Schema Migrations...");

  try {
    // 1. Create Enums if not exist
    await sql.unsafe(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_status') THEN
          CREATE TYPE approval_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'faculty_request_type') THEN
          CREATE TYPE faculty_request_type AS ENUM ('CREATE', 'DELETE');
        END IF;
      END $$;
    `);
    console.log("✓ Enums created / verified.");

    // 2. Add must_change_password column to users table
    await sql.unsafe(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;
    `);
    console.log("✓ users.must_change_password column added / verified.");

    // 3. Create student_enrollment_requests table
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS student_enrollment_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
        department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
        class_id VARCHAR(50) NOT NULL,
        submitted_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        student_data JSONB NOT NULL,
        status approval_status NOT NULL DEFAULT 'PENDING',
        reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
        review_notes TEXT,
        reviewed_at TIMESTAMP WITH TIME ZONE,
        created_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);
    console.log("✓ student_enrollment_requests table created / verified.");

    // 4. Create faculty_onboarding_requests table
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS faculty_onboarding_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
        department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
        submitted_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        request_type faculty_request_type NOT NULL,
        target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        faculty_data JSONB,
        status approval_status NOT NULL DEFAULT 'PENDING',
        reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
        review_notes TEXT,
        reviewed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);
    console.log("✓ faculty_onboarding_requests table created / verified.");

    // 5. Create class_allocations table
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS class_allocations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
        department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
        class_name VARCHAR(100) NOT NULL,
        academic_year VARCHAR(20) NOT NULL,
        semester INTEGER NOT NULL,
        class_teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);
    console.log("✓ class_allocations table created / verified.");

    console.log("Phase 14 database migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

migratePhase14();
