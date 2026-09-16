-- ============================================================================
-- PRAGATI: ROW LEVEL SECURITY (RLS) POLICIES
-- Multi-Tenancy & Role-Based Access Control on Supabase PostgreSQL
-- ============================================================================

-- 1. ENABLE ROW LEVEL SECURITY ON ALL 26 TABLES
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE backlogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE internship_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE internship_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_drives ENABLE ROW LEVEL SECURITY;
ALTER TABLE placement_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE eligibility_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 2. INSTITUTIONS & DEPARTMENTS (Read-all for authenticated institutional members)
CREATE POLICY "Institutions visible to authenticated members"
  ON institutions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Departments visible to authenticated members"
  ON departments FOR SELECT
  TO authenticated
  USING (true);

-- 3. USERS POLICIES
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own avatar and basic profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4. STUDENT PROFILES POLICIES
CREATE POLICY "Students read own profile"
  ON student_profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Faculty read assigned wards"
  ON student_profiles FOR SELECT
  TO authenticated
  USING (assigned_faculty_id = auth.uid());

CREATE POLICY "HODs and TNP view departmental students"
  ON student_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('HOD', 'TNP_COORDINATOR', 'ADMIN')
      AND users.institution_id = student_profiles.institution_id
    )
  );

-- 5. ACADEMIC RECORDS & BACKLOGS
CREATE POLICY "Students read own academic records"
  ON academic_records FOR SELECT
  TO authenticated
  USING (
    student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Faculty read ward academic records"
  ON academic_records FOR SELECT
  TO authenticated
  USING (
    student_id IN (SELECT id FROM student_profiles WHERE assigned_faculty_id = auth.uid())
  );

CREATE POLICY "Students read own backlogs"
  ON backlogs FOR SELECT
  TO authenticated
  USING (
    student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Faculty read ward backlogs"
  ON backlogs FOR SELECT
  TO authenticated
  USING (
    student_id IN (SELECT id FROM student_profiles WHERE assigned_faculty_id = auth.uid())
  );

-- 6. SKILLS & ASSESSMENTS (Public catalog read)
CREATE POLICY "Skills visible to all authenticated"
  ON skills FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Assessments visible to all authenticated"
  ON assessments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Students read own submissions"
  ON assessment_submissions FOR SELECT
  TO authenticated
  USING (
    student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Students create own submissions"
  ON assessment_submissions FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Students read own skill history"
  ON skill_history FOR SELECT
  TO authenticated
  USING (
    student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
  );

-- 7. EVIDENCE VAULT & DOCUMENTS
CREATE POLICY "Students view own evidence documents"
  ON evidence_documents FOR SELECT
  TO authenticated
  USING (
    student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Students insert own evidence documents"
  ON evidence_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Faculty view ward evidence documents"
  ON evidence_documents FOR SELECT
  TO authenticated
  USING (
    student_id IN (SELECT id FROM student_profiles WHERE assigned_faculty_id = auth.uid())
  );

CREATE POLICY "Faculty create verifications"
  ON verifications FOR INSERT
  TO authenticated
  WITH CHECK (
    verifier_user_id = auth.uid()
  );

-- 8. SKILL GAPS & FACULTY INTERVENTIONS
CREATE POLICY "Students view own skill gaps"
  ON skill_gaps FOR SELECT
  TO authenticated
  USING (
    student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Faculty view ward skill gaps"
  ON skill_gaps FOR SELECT
  TO authenticated
  USING (
    student_id IN (SELECT id FROM student_profiles WHERE assigned_faculty_id = auth.uid())
  );

CREATE POLICY "Students view own interventions"
  ON interventions FOR SELECT
  TO authenticated
  USING (
    student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Faculty view and manage assigned interventions"
  ON interventions FOR ALL
  TO authenticated
  USING (assigned_to = auth.uid())
  WITH CHECK (assigned_to = auth.uid());

-- 9. INTERNSHIPS & MILESTONE CHECK-INS
CREATE POLICY "Students manage own internships"
  ON internships FOR ALL
  TO authenticated
  USING (
    student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Faculty view ward internships"
  ON internships FOR SELECT
  TO authenticated
  USING (
    student_id IN (SELECT id FROM student_profiles WHERE assigned_faculty_id = auth.uid())
  );

CREATE POLICY "Students manage own internship checkins"
  ON internship_checkins FOR ALL
  TO authenticated
  USING (
    student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
  )
  WITH CHECK (
    student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
  );

-- 10. RECRUITMENT DRIVES & PLACEMENT RULES
CREATE POLICY "Students view published recruitment drives"
  ON recruitment_drives FOR SELECT
  TO authenticated
  USING (status = 'PUBLISHED');

CREATE POLICY "TNP and Admins manage recruitment drives"
  ON recruitment_drives FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('TNP_COORDINATOR', 'ADMIN')
    )
  );

CREATE POLICY "Students view own eligibility evaluations"
  ON eligibility_evaluations FOR SELECT
  TO authenticated
  USING (
    student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Students view own applications"
  ON applications FOR SELECT
  TO authenticated
  USING (
    student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Students submit applications"
  ON applications FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
  );

-- 11. NOTIFICATIONS
CREATE POLICY "Users manage own notifications"
  ON notifications FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 12. AUDIT LOGS (Institutional Admin Read-Only)
CREATE POLICY "Institutional Admins view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'ADMIN'
      AND users.institution_id = audit_logs.institution_id
    )
  );
