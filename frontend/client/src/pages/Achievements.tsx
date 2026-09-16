import PragatiFrame from "@/components/PragatiFrame";
import EvidenceUploadModal from "@/components/EvidenceUploadModal";
import TamperDemoModal from "@/components/TamperDemoModal";
import { Award, CalendarDays, CheckCircle2, FileCheck2, Plus, ShieldCheck, UploadCloud, XCircle, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const records = [
  { title: "Hackathon Finalist", issuer: "ABC Organization", date: "08 Sep 2026", category: "Competition", state: "Institution Verified", tone: "green", hasEvidence: true, hash: "3b9c7a4e8d2f105b6c3e7a9f1d4c2b8e0a6d5f4c3b2a1e9d8c7b6a5f4e3d2c1b" },
  { title: "Python for Data Structures", issuer: "Code Academy", date: "22 Jul 2026", category: "Certification", state: "Issuer Verified", tone: "blue", hasEvidence: true, hash: "8f4a1c2d3e5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f" },
  { title: "Student Tech Lead", issuer: "Northstar Institute", date: "12 May 2026", category: "Leadership", state: "Pending", tone: "amber", hasEvidence: false },
  { title: "Open Source Sprint", issuer: "Community Program", date: "28 Mar 2026", category: "Project", state: "Self Reported", tone: "slate", hasEvidence: false },
];

export default function Achievements() {
  const [showForm, setShowForm] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showTamperDemo, setShowTamperDemo] = useState(false);
  const [selectedForUpload, setSelectedForUpload] = useState<any | null>(null);

  return (
    <PragatiFrame title="Achievements" activePath="/achievements">
      <main className="dashboard-grid min-h-[calc(100vh-70px)] px-4 pb-12 pt-7 sm:px-7 xl:px-10">
        <div className="mx-auto max-w-[1240px]">
          <header className="mb-7 grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <div className="mb-2 eyebrow">Verified record</div>
              <h1 className="text-[28px] font-extrabold leading-tight tracking-[-0.035em] text-[#182643] sm:text-[34px]">Achievements</h1>
              <p className="mt-1 text-sm leading-relaxed text-[#6c7890]">A clean record of the work, competitions, certificates, and leadership moments that belong in your Career Passport.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowTamperDemo(true)}
                className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-bold text-red-700 hover:bg-red-100 transition shadow-sm"
              >
                <Zap className="h-3.5 w-3.5" /> Tamper Proof Demo
              </button>
              <button
                onClick={() => {
                  setSelectedForUpload(null);
                  setShowUpload(true);
                }}
                className="flex items-center gap-1.5 rounded-xl border border-[#dfe5ef] bg-white px-3.5 py-2.5 text-xs font-bold text-[#3048a8] hover:bg-[#f4f7fd] transition shadow-sm"
              >
                <UploadCloud className="h-3.5 w-3.5" /> Vault Evidence
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-1.5 rounded-xl bg-[#3048a8] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#3f5ac1] transition shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" /> Add achievement
              </button>
            </div>
          </header>
          <div className="mb-5 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
            {[["Total records", "12"], ["Institution verified", "09"], ["Issuer verified", "04"], ["Pending review", "01"]].map(([label, value]) => (
              <div key={label} className="premium-card p-4">
                <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8490a5]">{label}</div>
                <div className="kpi-value mt-2 text-2xl font-extrabold tracking-[-0.04em] text-[#1b2946]">{value}</div>
              </div>
            ))}
          </div>
          <div className="mb-4 grid grid-cols-[1fr_auto] items-center">
            <div>
              <div className="eyebrow mb-1">Achievement registry</div>
              <h2 className="text-lg font-bold tracking-tight text-[#1c2a47]">Your records</h2>
            </div>
            <div className="grid grid-flow-col auto-cols-max items-center gap-2 text-[11px] font-medium text-[#8995aa]">
              <Award className="h-4 w-4 text-[#5268cb]" /> 4 categories
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {records.map((record, index) => (
              <article key={record.title} className={`premium-card motion-enter motion-delay-${index + 1} p-5 transition hover:-translate-y-0.5 hover:border-[#cbd5ef]`}>
                <div className="grid grid-cols-[auto_1fr] items-start gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#edf0ff] text-[#5268cb]">
                    <Award className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                      <h3 className="text-sm font-bold text-[#263653]">{record.title}</h3>
                      <span className="rounded-full bg-[#eef1f7] px-2 py-1 text-[9px] font-bold text-[#71809a]">{record.category}</span>
                    </div>
                    <div className="mt-1 text-xs text-[#7d899f]">{record.issuer}</div>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-[1fr_auto] items-center border-t border-[#edf0f4] pt-4">
                  <div className="grid grid-flow-col auto-cols-max items-center gap-1.5 text-[11px] text-[#8995aa]">
                    <CalendarDays className="h-3.5 w-3.5" /> {record.date}
                  </div>
                  <VerificationBadge state={record.state} tone={record.tone} />
                </div>
                <div className="mt-4 grid grid-cols-[auto_auto] justify-between items-center">
                  <button
                    onClick={() => setShowTamperDemo(true)}
                    className="grid grid-flow-col auto-cols-max items-center gap-1.5 text-[11px] font-bold text-[#5268cb] hover:underline"
                  >
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    {record.hasEvidence ? "Verify SHA-256" : "Tamper Demo"}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedForUpload(record);
                      setShowUpload(true);
                    }}
                    className="grid grid-flow-col auto-cols-max items-center gap-1.5 text-[11px] font-bold text-[#71809a] hover:text-[#182643]"
                  >
                    <UploadCloud className="h-3.5 w-3.5" /> Upload Proof
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>

      {showUpload && (
        <EvidenceUploadModal
          defaultTitle={selectedForUpload?.title}
          onClose={() => {
            setShowUpload(false);
            setSelectedForUpload(null);
          }}
          onSuccess={() => {
            toast.success(
              "Document vaulted in Supabase Storage with verified SHA-256 checksum!"
            );
          }}
        />
      )}

      {showTamperDemo && (
        <TamperDemoModal onClose={() => setShowTamperDemo(false)} />
      )}

      {showForm && (
        <div className="fixed inset-0 z-50">
          <button aria-label="Close add achievement" onClick={() => setShowForm(false)} className="absolute inset-0 bg-[#07112d]/45 backdrop-blur-sm" />
          <aside className="motion-enter absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto bg-[#f8f9fc] p-6 shadow-2xl">
            <div className="mb-7 grid grid-cols-[1fr_auto] items-center">
              <div>
                <div className="eyebrow">New record</div>
                <h2 className="mt-1 text-xl font-extrabold text-[#1c2a47]">Add achievement</h2>
              </div>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-2 text-[#71809a]">×</button>
            </div>
            <div className="grid gap-4">
              <label className="block text-xs font-bold text-[#52617d]">
                Achievement title
                <input className="mt-2 w-full rounded-xl border border-[#dfe5ef] bg-white px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-[#cbd3f6]" placeholder="e.g. Hackathon finalist" />
              </label>
              <label className="block text-xs font-bold text-[#52617d]">
                Issuer
                <input className="mt-2 w-full rounded-xl border border-[#dfe5ef] bg-white px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-[#cbd3f6]" placeholder="Organization or institution" />
              </label>
              <div
                onClick={() => {
                  setShowForm(false);
                  setShowUpload(true);
                }}
                className="rounded-2xl border border-dashed border-[#c8d2e3] bg-white p-6 text-center cursor-pointer hover:border-[#3048a8]"
              >
                <UploadCloud className="mx-auto h-5 w-5 text-[#5268cb]" />
                <div className="mt-2 text-xs font-bold text-[#52617d]">Click to upload proof document</div>
                <div className="mt-1 text-[10px] text-[#8995aa]">PDF, PNG, or JPG · Dual-layer SHA-256 computed on upload</div>
              </div>
              <button onClick={() => { setShowForm(false); toast.success("Achievement saved as Self Reported"); }} className="w-full rounded-xl bg-[#3048a8] py-3 text-xs font-bold text-white">
                Save achievement
              </button>
            </div>
          </aside>
        </div>
      )}
    </PragatiFrame>
  );
}

function VerificationBadge({ state, tone }: { state: string; tone: string }) { const Icon = state === "Rejected" ? XCircle : state === "Pending" || state === "Self Reported" ? FileCheck2 : CheckCircle2; const styles: Record<string, string> = { green: "bg-[#e5f7f2] text-[#13876f]", blue: "bg-[#edf0ff] text-[#5268cb]", amber: "bg-[#fff1dc] text-[#bd7a27]", slate: "bg-[#eef1f6] text-[#71809a]" }; return <span className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-bold ${styles[tone]}`}><Icon className="h-3 w-3" /> {state}</span>; }
