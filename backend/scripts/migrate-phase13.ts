import "dotenv/config";
import postgres from "postgres";

async function migratePhase13() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL is not set.");
    process.exit(1);
  }

  const sql = postgres(connectionString);

  console.log("Applying Phase 13 Multi-Tenant Schema Migrations...");

  try {
    // 1. Create Enums if not exist
    await sql.unsafe(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'institution_status') THEN
          CREATE TYPE institution_status AS ENUM ('ACTIVE', 'SUSPENDED', 'ARCHIVED');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'change_request_status') THEN
          CREATE TYPE change_request_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
        END IF;
      END $$;
    `);
    console.log("✓ Enums created / verified.");

    // 2. Add columns to institutions table
    await sql.unsafe(`
      ALTER TABLE institutions ADD COLUMN IF NOT EXISTS domain VARCHAR(150);
      ALTER TABLE institutions ADD COLUMN IF NOT EXISTS university_board VARCHAR(255);
      ALTER TABLE institutions ADD COLUMN IF NOT EXISTS address TEXT;
      ALTER TABLE institutions ADD COLUMN IF NOT EXISTS city VARCHAR(100);
      ALTER TABLE institutions ADD COLUMN IF NOT EXISTS state VARCHAR(100);
      ALTER TABLE institutions ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(30);
      ALTER TABLE institutions ADD COLUMN IF NOT EXISTS contact_email VARCHAR(150);
      ALTER TABLE institutions ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE institutions ADD COLUMN IF NOT EXISTS status institution_status NOT NULL DEFAULT 'ACTIVE';
      ALTER TABLE institutions ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
      ALTER TABLE institutions ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE;
      ALTER TABLE institutions ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE institutions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
      ALTER TABLE institutions ADD COLUMN IF NOT EXISTS deleted_by UUID;
    `);
    console.log("✓ Institutions columns created / verified.");

    // 3. Create institution_change_requests table
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS institution_change_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
        requested_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        requested_changes JSONB NOT NULL,
        reason TEXT NOT NULL,
        status change_request_status NOT NULL DEFAULT 'PENDING',
        reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
        review_notes TEXT,
        reviewed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);
    console.log("✓ institution_change_requests table created / verified.");

    // 4. Mark existing Northstar Institute as Demo Sandbox
    await sql.unsafe(`
      UPDATE institutions 
      SET is_demo = true, domain = 'northstar.edu', university_board = 'Autonomous Technical University', city = 'Pune', state = 'Maharashtra'
      WHERE code = 'NIT-CSE' OR name ILIKE '%Northstar%';
    `);
    console.log("✓ Existing Northstar institution tagged as demo sandbox.");

    console.log("Phase 13 database migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

migratePhase13();
