export type SkillPoint = {
  label: string;
  score: number;
  delta: number;
  assessmentDate: string;
  series: number[];
};

export type StudentDashboard = {
  student: {
    name: string;
    program: string;
    institution: string;
    avatarInitials: string;
  };
  readiness: {
    score: number;
    delta: number;
    methodology: string;
    formula: string;
    indicators: {
      label: string;
      score: number;
      weight: number;
      helper: string;
    }[];
  };
  metrics: {
    label: string;
    value: string;
    delta: string;
    helper: string;
    tone: "indigo" | "violet" | "emerald" | "amber";
  }[];
  skillProfile: SkillPoint[];
  skillGap: {
    skill: string;
    current: number;
    previous: number;
    reason: string;
    source: "rule" | "ai";
  };
  internship: {
    company: string;
    role: string;
    progress: number;
    status: string;
    nextMilestone: string;
    verification: string;
    evidence: {
      label: string;
      state: "verified" | "pending" | "not_started";
    }[];
  };
  timeline: {
    year: string;
    title: string;
    detail: string;
    state: "complete" | "current" | "upcoming";
  }[];
  actions: {
    title: string;
    detail: string;
    tag: string;
    tone: "blue" | "amber" | "violet";
  }[];
};

/**
 * Temporary server-owned seed response for the first frontend phase.
 * Replace the procedure implementation with the FastAPI/MongoDB adapter once
 * the backend contract is available; the UI consumes only this typed shape.
 */
export const dashboardData: StudentDashboard = {
  student: {
    name: "Rahul Sharma",
    program: "B.Tech Computer Science",
    institution: "Northstar Institute of Technology",
    avatarInitials: "RS",
  },
  readiness: {
    score: 76,
    delta: 4,
    methodology: "A deterministic weighted average of four transparent progress indicators. It is not an AI-generated employability judgment.",
    formula: "(Academic Progress × 30%) + (Skill Coverage × 30%) + (Internship Progress × 20%) + (Verified Evidence × 20%) = 76%",
    indicators: [
      { label: "Academic progress", score: 80, weight: 30, helper: "CGPA and semester trajectory" },
      { label: "Skill coverage", score: 75, weight: 30, helper: "Verified assessment coverage" },
      { label: "Internship progress", score: 60, weight: 20, helper: "Evidence milestones completed" },
      { label: "Verified evidence", score: 90, weight: 20, helper: "Institution-backed records" },
    ],
  },
  metrics: [
    { label: "CGPA", value: "8.42", delta: "+0.18", helper: "vs last semester", tone: "indigo" },
    { label: "Verified skills", value: "07", delta: "+2", helper: "this semester", tone: "violet" },
    { label: "Achievements", value: "12", delta: "09 verified", helper: "across 4 categories", tone: "emerald" },
    { label: "Internship", value: "Active", delta: "60%", helper: "evidence collected", tone: "amber" },
  ],
  skillProfile: [
    { label: "DSA", score: 78, delta: 8, assessmentDate: "12 Sep 2026", series: [61, 70, 78] },
    { label: "Python", score: 84, delta: 5, assessmentDate: "10 Sep 2026", series: [72, 79, 84] },
    { label: "DBMS", score: 72, delta: 3, assessmentDate: "05 Sep 2026", series: [64, 69, 72] },
    { label: "OOP", score: 81, delta: 7, assessmentDate: "02 Sep 2026", series: [68, 76, 81] },
    { label: "OS", score: 61, delta: -9, assessmentDate: "28 Aug 2026", series: [78, 70, 61] },
    { label: "CN", score: 69, delta: 2, assessmentDate: "25 Aug 2026", series: [59, 64, 69] },
  ],
  skillGap: {
    skill: "Operating Systems",
    current: 61,
    previous: 70,
    reason: "Active OS backlog remains open after two consecutive assessment cycles.",
    source: "rule",
  },
  internship: {
    company: "Atlas Labs",
    role: "Product Engineering Intern",
    progress: 68,
    status: "In progress",
    nextMilestone: "Internship report",
    verification: "Institution review pending",
    evidence: [
      { label: "Offer letter", state: "verified" },
      { label: "Check-in 1", state: "verified" },
      { label: "Check-in 2", state: "verified" },
      { label: "Internship report", state: "pending" },
      { label: "Completion certificate", state: "not_started" },
    ],
  },
  timeline: [
    { year: "2025", title: "Programming foundation", detail: "Core programming pathway completed", state: "complete" },
    { year: "2026", title: "Skill assessment cycle", detail: "7 skills verified across 3 assessments", state: "complete" },
    { year: "2026", title: "OS skill gap detected", detail: "Faculty intervention recommended", state: "current" },
    { year: "2026", title: "Atlas Labs internship", detail: "Evidence collection in progress", state: "current" },
    { year: "2027", title: "Placement readiness review", detail: "Eligibility will be recalculated", state: "upcoming" },
  ],
  actions: [
    { title: "Complete OS mentoring", detail: "Faculty office hours available this week", tag: "Recommended", tone: "blue" },
    { title: "Upload internship report", detail: "Due in 8 days · PDF up to 10 MB", tag: "Due soon", tone: "amber" },
    { title: "Explore eligible drives", detail: "3 opportunities match your current profile", tag: "Opportunity", tone: "violet" },
  ],
};

export type Opportunity = {
  id: string;
  company: string;
  role: string;
  type: "Internship" | "Placement";
  location: string;
  deadline: string;
  deadlineLabel: string;
  eligibilitySummary: string;
  eligibilityStatus: "Eligible" | "Not eligible" | "Not Eligible" | "Pending";
  applicationStatus: "Not applied" | "Applied" | "In review" | "Interviewing" | "Offered" | "Rejected";
  closingSoon: boolean;
  description: string;
  skills: string[];
  criteria: { label: string; actual: string; expected: string; pass: boolean }[];
  verificationRequirements: string[];
};

export type OpportunitiesResponse = {
  summary: {
    eligible: number;
    internships: number;
    placements: number;
    applications: number;
  };
  opportunities: Opportunity[];
};

export const opportunitiesData: OpportunitiesResponse = {
  summary: { eligible: 3, internships: 2, placements: 1, applications: 1 },
  opportunities: [
    {
      id: "atlas-product-engineering",
      company: "Atlas Labs",
      role: "Product Engineering Intern",
      type: "Internship",
      location: "Bengaluru · Hybrid",
      deadline: "2026-09-24",
      deadlineLabel: "Closes in 8 days",
      eligibilitySummary: "Matches your verified profile across CGPA, DSA, and internship readiness.",
      eligibilityStatus: "Eligible",
      applicationStatus: "Applied",
      closingSoon: true,
      description: "Join a product engineering pod building workflow tools used by high-growth teams. You will pair with a mentor, ship scoped features, and present your work at the end of the cohort.",
      skills: ["DSA", "Python", "React", "Product thinking"],
      criteria: [
        { label: "CGPA", actual: "8.42", expected: ">= 7.5", pass: true },
        { label: "Active backlogs", actual: "0", expected: "= 0", pass: true },
        { label: "DSA", actual: "78%", expected: ">= 70%", pass: true },
        { label: "Internship readiness", actual: "68%", expected: ">= 60%", pass: true },
      ],
      verificationRequirements: ["Verified academic record", "Institution-backed skill assessments", "Internship evidence profile"],
    },
    {
      id: "northstar-platform-engineer",
      company: "Northstar Systems",
      role: "Associate Platform Engineer",
      type: "Placement",
      location: "Pune · On-site",
      deadline: "2026-10-04",
      deadlineLabel: "Closes in 18 days",
      eligibilitySummary: "You meet the academic and DSA criteria for the graduate hiring drive.",
      eligibilityStatus: "Eligible",
      applicationStatus: "In review",
      closingSoon: false,
      description: "A graduate engineering role focused on reliable services, developer tooling, and observability. The first six months combine onboarding, shadowing, and ownership of a small production surface.",
      skills: ["DSA", "DBMS", "Operating systems", "Java or Python"],
      criteria: [
        { label: "CGPA", actual: "8.42", expected: ">= 8.0", pass: true },
        { label: "Active backlogs", actual: "0", expected: "= 0", pass: true },
        { label: "DSA", actual: "78%", expected: ">= 75%", pass: true },
        { label: "Graduation year", actual: "2027", expected: "2027", pass: true },
      ],
      verificationRequirements: ["Verified CGPA transcript", "Assessment history", "Resume and portfolio"],
    },
    {
      id: "meridian-data-intern",
      company: "Meridian Analytics",
      role: "Data Engineering Intern",
      type: "Internship",
      location: "Remote · India",
      deadline: "2026-10-17",
      deadlineLabel: "Closes in 31 days",
      eligibilitySummary: "Eligible based on your verified Python, DBMS, and academic records.",
      eligibilityStatus: "Eligible",
      applicationStatus: "Not applied",
      closingSoon: false,
      description: "Work with a small data platform team to build clean pipelines, validation checks, and reporting layers for university and mobility datasets.",
      skills: ["Python", "DBMS", "SQL", "Data quality"],
      criteria: [
        { label: "CGPA", actual: "8.42", expected: ">= 7.0", pass: true },
        { label: "Python", actual: "84%", expected: ">= 75%", pass: true },
        { label: "DBMS", actual: "72%", expected: ">= 70%", pass: true },
        { label: "Portfolio evidence", actual: "1 project", expected: ">= 1 project", pass: true },
      ],
      verificationRequirements: ["Verified skill scores", "One relevant project", "Academic record"],
    },
    {
      id: "orbit-security-associate",
      company: "Orbit Secure",
      role: "Security Engineering Associate",
      type: "Placement",
      location: "Hyderabad · Hybrid",
      deadline: "2026-09-28",
      deadlineLabel: "Closes in 12 days",
      eligibilitySummary: "One criterion needs attention before you can apply.",
      eligibilityStatus: "Not eligible",
      applicationStatus: "Not applied",
      closingSoon: true,
      description: "Join an application security team working across threat modeling, secure code review, and incident learning. The role includes a structured technical foundation program.",
      skills: ["Python", "Operating systems", "Networks", "Secure coding"],
      criteria: [
        { label: "CGPA", actual: "8.42", expected: ">= 7.5", pass: true },
        { label: "Active backlogs", actual: "0", expected: "= 0", pass: true },
        { label: "DSA", actual: "78%", expected: ">= 70%", pass: true },
        { label: "Python", actual: "61%", expected: ">= 65%", pass: false },
      ],
      verificationRequirements: ["Verified academic record", "Python assessment at or above threshold", "Security project or certification"],
    },
  ],
};

export type ProgressResponse = {
  academic: { semester: string; sgpa: number; cgpa: number; backlogs: number }[];
  skills: { label: string; values: number[]; dates: string[] }[];
  assessments: { label: string; score: number; date: string; category: string }[];
  achievements: { label: string; count: number }[];
  internship: { label: string; value: number }[];
  interventions: { date: string; title: string; detail: string; state: "completed" | "open" }[];
  interventionImpact: { skill: string; before: number; after: number; intervention: string; note: string };
};

export const progressData: ProgressResponse = {
  academic: [
    { semester: "S1", sgpa: 7.8, cgpa: 7.8, backlogs: 2 },
    { semester: "S2", sgpa: 8.05, cgpa: 7.92, backlogs: 1 },
    { semester: "S3", sgpa: 8.18, cgpa: 8.01, backlogs: 1 },
    { semester: "S4", sgpa: 8.42, cgpa: 8.12, backlogs: 0 },
    { semester: "S5", sgpa: 8.62, cgpa: 8.28, backlogs: 0 },
    { semester: "S6", sgpa: 8.82, cgpa: 8.42, backlogs: 0 },
  ],
  skills: [
    { label: "DSA", values: [61, 70, 78], dates: ["Jun", "Aug", "Sep"] },
    { label: "Python", values: [72, 79, 84], dates: ["Jun", "Aug", "Sep"] },
    { label: "DBMS", values: [64, 69, 72], dates: ["Jun", "Aug", "Sep"] },
    { label: "Operating Systems", values: [78, 70, 61], dates: ["Jun", "Aug", "Sep"] },
  ],
  assessments: [
    { label: "Technical assessment", score: 82, date: "12 Sep 2026", category: "Technical" },
    { label: "Problem-solving review", score: 76, date: "28 Aug 2026", category: "Technical" },
    { label: "Communication review", score: 88, date: "18 Aug 2026", category: "Behavioural" },
    { label: "Foundation check", score: 69, date: "18 Jul 2026", category: "Technical" },
  ],
  achievements: [
    { label: "Hackathons", count: 3 },
    { label: "Certifications", count: 4 },
    { label: "Projects", count: 3 },
    { label: "Leadership", count: 2 },
  ],
  internship: [
    { label: "Offer letter", value: 100 },
    { label: "Check-ins", value: 100 },
    { label: "Report", value: 0 },
    { label: "Certificate", value: 0 },
  ],
  interventions: [
    { date: "12 Sep 2026", title: "OS skill gap detected", detail: "Rule triggered after two consecutive declines", state: "open" },
    { date: "06 Sep 2026", title: "Python mentoring completed", detail: "Peer session · outcome recorded", state: "completed" },
    { date: "24 Aug 2026", title: "DSA practice plan completed", detail: "Faculty-assigned intervention", state: "completed" },
  ],
  interventionImpact: {
    skill: "Operating Systems",
    before: 61,
    after: 78,
    intervention: "Operating Systems Mentoring",
    note: "Observed progress after the intervention; this comparison does not establish causal proof.",
  },
};

export type SkillDetail = {
  label: string;
  current: number;
  trend: "up" | "down" | "steady";
  history: { score: number; date: string; assessment: string; verification: "Institution Verified" | "Issuer Verified" | "Pending" }[];
  relatedGaps: string[];
  interventions: string[];
  improvement?: { before: number; after: number; intervention: string; note: string };
};

export type SkillsResponse = { skills: SkillDetail[] };

export const skillsData: SkillsResponse = {
  skills: [
    { label: "C", current: 74, trend: "up", history: [{ score: 62, date: "18 Jul 2026", assessment: "Foundation check", verification: "Institution Verified" }, { score: 69, date: "28 Aug 2026", assessment: "Programming review", verification: "Institution Verified" }, { score: 74, date: "12 Sep 2026", assessment: "Technical assessment", verification: "Institution Verified" }], relatedGaps: [], interventions: ["Foundation practice plan"] },
    { label: "C++", current: 71, trend: "up", history: [{ score: 60, date: "18 Jul 2026", assessment: "Foundation check", verification: "Institution Verified" }, { score: 66, date: "28 Aug 2026", assessment: "Programming review", verification: "Institution Verified" }, { score: 71, date: "12 Sep 2026", assessment: "Technical assessment", verification: "Institution Verified" }], relatedGaps: [], interventions: ["Competitive programming plan"] },
    { label: "Python", current: 84, trend: "up", history: [{ score: 72, date: "18 Jul 2026", assessment: "Foundation check", verification: "Institution Verified" }, { score: 79, date: "28 Aug 2026", assessment: "Problem-solving review", verification: "Institution Verified" }, { score: 84, date: "10 Sep 2026", assessment: "Technical assessment", verification: "Institution Verified" }], relatedGaps: ["Security Engineering Associate: 4 points below threshold"], interventions: ["Python mentoring", "Data engineering practice"] },
    { label: "DSA", current: 78, trend: "up", history: [{ score: 61, date: "18 Jul 2026", assessment: "Foundation check", verification: "Institution Verified" }, { score: 70, date: "28 Aug 2026", assessment: "Problem-solving review", verification: "Institution Verified" }, { score: 78, date: "12 Sep 2026", assessment: "Technical assessment", verification: "Institution Verified" }], relatedGaps: [], interventions: ["DSA Mentoring"], improvement: { before: 61, after: 78, intervention: "DSA Mentoring", note: "Observed progress after the intervention; this is not causal proof." } },
    { label: "DBMS", current: 72, trend: "up", history: [{ score: 64, date: "18 Jul 2026", assessment: "Foundation check", verification: "Institution Verified" }, { score: 69, date: "28 Aug 2026", assessment: "Technical review", verification: "Institution Verified" }, { score: 72, date: "05 Sep 2026", assessment: "Technical assessment", verification: "Institution Verified" }], relatedGaps: [], interventions: ["SQL practice plan"] },
    { label: "OOP", current: 81, trend: "up", history: [{ score: 68, date: "18 Jul 2026", assessment: "Foundation check", verification: "Institution Verified" }, { score: 76, date: "28 Aug 2026", assessment: "Programming review", verification: "Institution Verified" }, { score: 81, date: "02 Sep 2026", assessment: "Technical assessment", verification: "Institution Verified" }], relatedGaps: [], interventions: ["Object design workshop"] },
    { label: "Operating Systems", current: 61, trend: "down", history: [{ score: 78, date: "18 Jul 2026", assessment: "Foundation check", verification: "Institution Verified" }, { score: 70, date: "28 Aug 2026", assessment: "Technical review", verification: "Institution Verified" }, { score: 61, date: "12 Sep 2026", assessment: "Technical assessment", verification: "Institution Verified" }], relatedGaps: ["Active backlog remains open", "Orbit Secure: 4 points below threshold"], interventions: ["Operating Systems Mentoring"], improvement: { before: 61, after: 78, intervention: "Operating Systems Mentoring", note: "Observed progress after an earlier intervention; the latest assessment later recorded 61%, so the gap remains open. This is not causal proof." } },
    { label: "Computer Networks", current: 69, trend: "up", history: [{ score: 59, date: "18 Jul 2026", assessment: "Foundation check", verification: "Institution Verified" }, { score: 64, date: "28 Aug 2026", assessment: "Networks review", verification: "Institution Verified" }, { score: 69, date: "25 Aug 2026", assessment: "Technical assessment", verification: "Institution Verified" }], relatedGaps: [], interventions: ["Networks lab review"] },
  ],
};
