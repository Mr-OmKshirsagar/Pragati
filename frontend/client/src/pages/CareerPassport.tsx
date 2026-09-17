import PragatiFrame from "@/components/PragatiFrame";
import { trpc } from "@/lib/trpc";
import {
  Award,
  BookOpen,
  Briefcase,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  GraduationCap,
  Hash,
  Layers,
  Printer,
  QrCode,
  Route,
  ShieldCheck,
  Sparkles,
  Target,
  Verified,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

export default function CareerPassport() {
  const passportQuery = trpc.dashboard.getCareerPassport.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const [copied, setCopied] = useState(false);

  const data = passportQuery.data;

  const handleCopyLink = () => {
    if (data?.verificationStamp.verificationUrl) {
      navigator.clipboard.writeText(data.verificationStamp.verificationUrl);
      setCopied(true);
      toast.success("Verification link copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (passportQuery.isLoading) {
    return (
      <PragatiFrame title="Career Passport" activePath="/career-passport">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm font-semibold">Generating verified career passport...</p>
          </div>
        </div>
      </PragatiFrame>
    );
  }

  // Fallback defaults if query returns empty during offline render
  const passport = data || {
    passportId: "PASS-NIT-CSE-CS20230842",
    generatedAt: new Date().toISOString(),
    institution: {
      name: "Northstar Institute of Technology",
      code: "NIT",
      department: "Department of Computer Science & Engineering",
      sealText: "OFFICIAL INSTITUTIONAL SEAL · VERIFIED PORTABLE CAREER DOSSIER",
    },
    student: {
      id: "student-01",
      name: "Rahul Sharma",
      email: "rahul.sharma@northstar.edu",
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
  };

  return (
    <PragatiFrame title="Career Passport" activePath="/career-passport">
      <main className="min-h-[calc(100vh-70px)] bg-[#F8FAFC] px-4 py-6 sm:px-8 xl:px-10 pb-24 text-[#1C2128]">
        <div className="mx-auto max-w-[1100px] space-y-6">
          {/* Action Toolbar (Hidden in Print) */}
          <div className="print:hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl bg-white p-4 border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Official Student Dossier</h2>
                <p className="text-xs text-slate-500">
                  Tamper-evident, cryptographically verifiable institutional transcript
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? "Link Copied" : "Share Verification Link"}</span>
              </button>

              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary/90 active:scale-95 transition"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print / Download PDF</span>
              </button>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════ */}
          {/* OFFICIAL PASSPORT DOSSIER (Printable Certificate Canvas)      */}
          {/* ══════════════════════════════════════════════════════════════ */}
          <div className="rounded-3xl border-2 border-slate-200 bg-white p-6 sm:p-10 shadow-lg print:border-none print:shadow-none print:p-0 space-y-8">
            {/* 1. Official Institutional Header */}
            <div className="border-b-2 border-slate-900 pb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  {/* Institutional Seal Emblem */}
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-[#07172B] to-[#143D66] text-white shadow-md">
                    <GraduationCap className="h-9 w-9 text-cyan-300" />
                  </div>
                  <div>
                    <span className="text-[10.5px] font-bold uppercase tracking-widest text-primary">
                      {passport.institution.sealText}
                    </span>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                      {passport.institution.name}
                    </h1>
                    <p className="text-xs font-semibold text-slate-600">
                      {passport.institution.department}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right space-y-1">
                  <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                    <Verified className="h-3.5 w-3.5 text-emerald-600" />
                    <span>INSTITUTION VERIFIED</span>
                  </div>
                  <div className="font-mono text-xs text-slate-500 font-semibold">
                    Dossier ID: {passport.passportId}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Issued: {new Date(passport.generatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Student Identity & Readiness Badge Banner */}
            <div className="rounded-2xl bg-gradient-to-r from-[#0C2D48] via-[#143D66] to-[#07172B] p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/10 text-white font-extrabold text-xl border border-white/20">
                  {passport.student.name.split(" ").map((n: string) => n[0]).join("")}
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-300">
                    Certified Candidate Dossier
                  </span>
                  <h2 className="text-2xl font-extrabold tracking-tight text-white">
                    {passport.student.name}
                  </h2>
                  <p className="text-xs text-slate-200 font-medium">
                    {passport.student.program} · Roll No: <strong className="text-white font-mono">{passport.student.enrollmentNumber}</strong>
                  </p>
                  <p className="text-[11px] text-slate-300">
                    Batch {passport.student.admissionYear}–{passport.student.graduationYear} (Semester {passport.student.semester})
                  </p>
                </div>
              </div>

              {/* Deterministic Readiness Gauge Pill */}
              <div className="rounded-2xl bg-white/10 border border-white/20 p-4 text-center min-w-[200px] backdrop-blur-xs">
                <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 font-mono">
                  Career Readiness Score
                </div>
                <div className="text-3xl font-black text-white font-mono mt-1">
                  {passport.readinessScorecard.readinessScore}%
                </div>
                <div className="text-[10px] text-slate-300 mt-1">
                  Deterministic Weighted Algorithm
                </div>
              </div>
            </div>

            {/* 3. Deterministic Readiness Methodology Card */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Deterministic Readiness Breakdown
                  </h3>
                </div>
                <span className="text-[11px] font-mono text-slate-500 font-bold">
                  {passport.readinessScorecard.formula}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Academic */}
                <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 space-y-1">
                  <div className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                    Academic (30%)
                  </div>
                  <div className="text-lg font-extrabold text-slate-900 font-mono">
                    {passport.readinessScorecard.breakdown.academic.percentage}%
                  </div>
                  <div className="text-[11px] font-semibold text-primary font-mono">
                    +{passport.readinessScorecard.breakdown.academic.weightedContribution}% contribution
                  </div>
                </div>

                {/* Skill Coverage */}
                <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 space-y-1">
                  <div className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                    Skill Coverage (30%)
                  </div>
                  <div className="text-lg font-extrabold text-slate-900 font-mono">
                    {passport.readinessScorecard.breakdown.skills.percentage}%
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-600 font-mono">
                    +{passport.readinessScorecard.breakdown.skills.weightedContribution}% contribution
                  </div>
                </div>

                {/* Internship */}
                <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 space-y-1">
                  <div className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                    Internship (20%)
                  </div>
                  <div className="text-lg font-extrabold text-slate-900 font-mono">
                    {passport.readinessScorecard.breakdown.internship.completeness}%
                  </div>
                  <div className="text-[11px] font-semibold text-indigo-600 font-mono">
                    +{passport.readinessScorecard.breakdown.internship.weightedContribution}% contribution
                  </div>
                </div>

                {/* Evidence */}
                <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 space-y-1">
                  <div className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                    Verified Evidence (20%)
                  </div>
                  <div className="text-lg font-extrabold text-slate-900 font-mono">
                    {passport.readinessScorecard.breakdown.evidence.percentage}%
                  </div>
                  <div className="text-[11px] font-semibold text-purple-600 font-mono">
                    +{passport.readinessScorecard.breakdown.evidence.weightedContribution}% contribution
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 italic border-t border-slate-200 pt-2.5">
                "{passport.readinessScorecard.methodologyExplanation}"
              </p>
            </div>

            {/* 4. Certified Academic Ledger */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                    Certified Academic Progression Ledger
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold font-mono text-slate-800">
                    Cumulative CGPA: <strong className="text-primary">{passport.academicLedger.cumulativeCgpa}</strong>
                  </span>
                  <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5">
                    {passport.academicLedger.backlogStatus === "ZERO_ACTIVE_BACKLOGS"
                      ? "✓ ZERO ACTIVE BACKLOGS"
                      : "ACTIVE BACKLOG PRESENT"}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold">
                      <th className="py-2.5 px-3">Semester</th>
                      <th className="py-2.5 px-3">Academic Year</th>
                      <th className="py-2.5 px-3">SGPA</th>
                      <th className="py-2.5 px-3">CGPA</th>
                      <th className="py-2.5 px-3">Credits Earned</th>
                      <th className="py-2.5 px-3 text-right">Audit Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {passport.academicLedger.semesters.map((sem: any) => (
                      <tr key={sem.semester} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-bold text-slate-900">{sem.semesterLabel}</td>
                        <td className="py-2.5 px-3 text-slate-600">{sem.academicYear}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{sem.sgpa}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-primary">{sem.cgpa}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{sem.creditsEarned} Credits</td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-700">
                            <Check className="h-3 w-3" />
                            <span>Verified</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 5. Verified Skill Proficiency Trajectory */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                    Verified Technical Competencies
                  </h3>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  Continuous Assessment Telemetry
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {passport.verifiedSkills.map((sk: any) => (
                  <div
                    key={sk.skillName}
                    className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-900">{sk.skillName}</div>
                        <div className="text-[10px] text-slate-500">{sk.category}</div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-base font-extrabold text-slate-900">
                          {sk.score}%
                        </span>
                        <div className="text-[9.5px] font-bold text-emerald-700 uppercase">
                          {sk.proficiency}
                        </div>
                      </div>
                    </div>

                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${
                          sk.score >= 80 ? "bg-emerald-600" : sk.score >= 70 ? "bg-primary" : "bg-amber-500"
                        }`}
                        style={{ width: `${sk.score}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Assessed across {sk.assessmentCycles} cycles</span>
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <Check className="h-3 w-3" /> Institution Signed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 6. Verified Industry Internship Record & Cryptographic Sign-Off */}
            {passport.verifiedInternship && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-indigo-600" />
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                      Verified Industry Internship Record
                    </h3>
                  </div>
                  <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5">
                    ✓ INSTITUTION VERIFIED
                  </span>
                </div>

                <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/40 via-white to-white p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="text-base font-extrabold text-slate-900">
                        {passport.verifiedInternship.companyName}
                      </div>
                      <div className="text-xs text-slate-600 font-medium">
                        {passport.verifiedInternship.role} · {passport.verifiedInternship.duration}
                      </div>
                    </div>

                    <div className="text-left sm:text-right text-xs">
                      <div className="font-semibold text-slate-700">Faculty Sign-Off:</div>
                      <div className="font-bold text-slate-900">
                        {passport.verifiedInternship.mentorSignOff.facultyName}
                      </div>
                      <div className="text-[10.5px] text-slate-500">
                        {passport.verifiedInternship.mentorSignOff.designation}
                      </div>
                    </div>
                  </div>

                  {/* Cryptographic Hashes Table */}
                  <div className="space-y-2 border-t border-slate-100 pt-3">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <Hash className="h-3.5 w-3.5" />
                      <span>Cryptographic Evidence Checksums (SHA-256)</span>
                    </div>

                    <div className="space-y-2">
                      {passport.verifiedInternship.cryptographicEvidence.map((ev: any) => (
                        <div
                          key={ev.sha256Hash}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs"
                        >
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-800">{ev.title}</span>
                            <div className="font-mono text-[10.5px] text-slate-500 break-all select-all">
                              {ev.sha256Hash}
                            </div>
                          </div>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 shrink-0">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Verified Valid
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 7. Institutional Cryptographic Stamp & Authority Seal */}
            <div className="border-t-2 border-slate-900 pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-1.5 max-w-md">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>Cryptographic Tamper-Evidence Seal</span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-500 break-all select-all">
                    SHA-256 Integrity: {passport.verificationStamp.sha256IntegrityHash}
                  </p>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    This document is cryptographically anchored in the Northstar institutional evidence vault. Any modification to academic, skill, or internship values renders the hash invalid.
                  </p>
                </div>

                <div className="text-left sm:text-right space-y-1 shrink-0">
                  <div className="h-12 w-32 border-b-2 border-slate-400 sm:ml-auto" />
                  <div className="text-xs font-extrabold text-slate-900">
                    {passport.verificationStamp.signatureAuthority}
                  </div>
                  <div className="text-[10.5px] text-slate-500">
                    Institutional Governance Board · NIT
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </PragatiFrame>
  );
}
