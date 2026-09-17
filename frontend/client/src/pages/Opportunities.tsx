import PragatiFrame from "@/components/PragatiFrame";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import type { Opportunity } from "@shared/pragati";
import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  Calendar,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ExternalLink,
  Filter,
  Loader2,
  Plus,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  X,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type FilterValue = "All" | "Eligible" | "Internship" | "Placement" | "Applied" | "Closing Soon";
const filters: FilterValue[] = ["All", "Eligible", "Internship", "Placement", "Applied", "Closing Soon"];

function criteriaGap(criteria: Opportunity["criteria"][number]) {
  const actual = Number.parseFloat(criteria.actual.replace(/[^0-9.]/g, ""));
  const expected = Number.parseFloat(criteria.expected.replace(/[^0-9.]/g, ""));
  return Number.isFinite(actual) && Number.isFinite(expected) ? Math.max(0, expected - actual) : null;
}

export default function Opportunities() {
  const { role } = useAuth();
  const utils = trpc.useUtils();
  const query = trpc.student.opportunities.useQuery();
  const createMutation = trpc.tnp.createPlacement.useMutation({
    onSuccess: () => {
      utils.student.opportunities.invalidate();
      utils.tnp.getPlacements.invalidate();
    },
  });
  const [filter, setFilter] = useState<FilterValue>("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Opportunity | null>(null);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const canManageOpportunities = role === "TNP_COORDINATOR" || role === "ADMIN";

  const opportunities = query.data?.opportunities ?? [];
  const visible = useMemo(() => opportunities.filter(item => {
    const haystack = `${item.company} ${item.role} ${item.type} ${item.location} ${item.skills.join(" ")}`.toLowerCase();
    const matchesSearch = haystack.includes(search.toLowerCase());
    const applied = appliedIds.includes(item.id) || item.applicationStatus !== "Not applied";
    const matchesFilter = filter === "All" || filter === "Eligible" && item.eligibilityStatus === "Eligible" || filter === "Internship" && item.type === "Internship" || filter === "Placement" && item.type === "Placement" || filter === "Applied" && applied || filter === "Closing Soon" && item.closingSoon;
    return matchesSearch && matchesFilter;
  }), [appliedIds, filter, opportunities, search]);

  if (query.isLoading) return <PageSkeleton />;
  if (query.isError || !query.data) return <div className="grid min-h-screen place-items-center bg-[#f5f7fb] text-sm text-[#64718a]">We couldn&apos;t load opportunities. Please try again.</div>;

  const apply = (item: Opportunity) => {
    if (item.eligibilityStatus !== "Eligible") {
      toast.error("You are not eligible for this opportunity yet", { description: "Review the failed criteria to see what needs attention." });
      return;
    }
    setAppliedIds(ids => ids.includes(item.id) ? ids : [...ids, item.id]);
    toast.success("Application saved", { description: `${item.company} will now appear in your applications.` });
  };

  return (
    <PragatiFrame title="Opportunities" activePath="/opportunities">
      <main className="dashboard-grid min-h-[calc(100vh-70px)] px-4 pb-12 pt-7 sm:px-7 xl:px-10">
        <div className="mx-auto max-w-[1420px]">
          <header className="mb-7 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="mb-2 grid grid-flow-col auto-cols-max items-center gap-2">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#e9edfb] text-[#5268cb]">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                <span className="eyebrow">Verified profile matching</span>
              </div>
              <h1 className="text-[28px] font-extrabold leading-tight tracking-[-0.035em] text-[#182643] sm:text-[34px]">Opportunities</h1>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#6c7890]">Explore internships and placement drives matched against your verified academic, skill, and evidence profile.</p>
            </div>
            <div className="grid grid-flow-col auto-cols-max items-center gap-2 rounded-xl border border-[#dfe5ef] bg-white px-3 py-2.5 text-xs font-medium text-[#6e7b93] shadow-sm">
              <ShieldCheck className="h-4 w-4 text-[#16a889]" /> Matching uses verified records
            </div>
          </header>

          {canManageOpportunities && (
            <div className="mb-5 grid gap-3 rounded-2xl border border-[#f0d8b5] bg-[#fffaf2] p-4 shadow-sm sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#bd7a27]">T&amp;P officer controls</div>
                <p className="mt-1 text-sm font-semibold text-[#3a2c1c]">Upload a new internship or placement drive for students to discover here.</p>
              </div>
              <button
                onClick={() => setUploadOpen(true)}
                className="grid h-11 grid-flow-col items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                Upload internship data
              </button>
            </div>
          )}

          <div className="mb-5 grid grid-cols-2 gap-3.5 xl:grid-cols-4">
            {[
              ["Eligible opportunities", query.data.summary.eligible, "of 4 drives", "bg-[#edf0ff] text-[#5268cb]"],
              ["Internship opportunities", query.data.summary.internships, "available now", "bg-[#e5f7f2] text-[#13876f]"],
              ["Placement drives", query.data.summary.placements, "this cycle", "bg-[#f0ebff] text-[#7358c9]"],
              ["Applications submitted", query.data.summary.applications, "1 in review", "bg-[#fff1dc] text-[#bd7a27]"],
            ].map(([label, value, helper, tone]) => (
              <div key={String(label)} className="premium-card motion-enter p-4 sm:p-5">
                <div className="mb-4 grid grid-cols-[auto_auto] justify-between items-start">
                  <span className={`grid h-9 w-9 place-items-center rounded-xl ${tone}`}>
                    <BriefcaseBusiness className="h-4 w-4" />
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#97a2b3]">Live</span>
                </div>
                <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#8490a5]">{label}</div>
                <div className="mt-1 grid grid-flow-col auto-cols-max items-end gap-2">
                  <span className="kpi-value text-[26px] font-extrabold tracking-[-0.04em] text-[#1b2946] sm:text-[28px]">{value}</span>
                  <span className="mb-1 text-[11px] font-medium text-[#8995aa]">{helper}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mb-5 grid gap-3 rounded-2xl border border-[#e2e8f2] bg-white/75 p-3 shadow-sm lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="grid grid-flow-col auto-cols-max items-center gap-1.5 overflow-x-auto">
              {filters.map(item => (
                <button
                  key={item}
                  onClick={() => setFilter(item)}
                  className={`rounded-lg px-3 py-2 text-xs transition ${
                    filter === item
                      ? "bg-primary text-white font-semibold shadow-sm"
                      : "text-[#71809a] font-medium hover:bg-[#eef1f8] hover:text-primary"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            <label className="grid h-10 grid-cols-[auto_1fr] items-center gap-2 rounded-xl border border-[#dfe5ef] bg-white px-3 text-[#8994a8] lg:w-[270px]">
              <Search className="h-4 w-4" />
              <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search opportunities" className="w-full bg-transparent text-xs text-[#304063] outline-none placeholder:text-[#a4afbf]" />
            </label>
          </div>

          <div className="mb-4 grid grid-cols-[1fr_auto] items-center">
            <div>
              <div className="eyebrow mb-1">Matched for you</div>
              <h2 className="text-lg font-extrabold tracking-[-0.03em] text-[#1c2a47]">
                Open opportunities <span className="ml-1 text-sm font-semibold text-[#8995aa]">{visible.length}</span>
              </h2>
            </div>
            <button className="hidden grid-flow-col auto-cols-max items-center gap-1.5 text-xs font-bold text-[#5268cb] sm:grid">
              <Filter className="h-3.5 w-3.5" /> More filters
            </button>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {visible.map((item, index) => (
              <OpportunityCard key={item.id} item={item} index={index} applied={appliedIds.includes(item.id) || item.applicationStatus !== "Not applied"} onOpen={() => setSelected(item)} onApply={() => apply(item)} />
            ))}
          </div>
          {visible.length === 0 && (
            <div className="premium-card p-12 text-center">
              <Search className="mx-auto h-6 w-6 text-[#9ba7b9]" />
              <h3 className="mt-3 text-sm font-bold text-[#34415d]">No opportunities match these filters</h3>
              <p className="mt-1 text-xs text-[#8995aa]">Try clearing the search or switching to All.</p>
            </div>
          )}

          <footer className="mt-10 grid gap-2 border-t border-[#e0e6f0] pt-5 text-[11px] text-[#8290a7] sm:grid-cols-[1fr_auto] sm:items-center">
            <span>PRAGATI · Opportunities matched to verified evidence</span>
            <span className="grid grid-flow-col auto-cols-max items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-[#16a889]" /> Eligibility remains backend-authoritative
            </span>
          </footer>
        </div>
      </main>
      {selected && <OpportunityDrawer item={selected} applied={appliedIds.includes(selected.id) || selected.applicationStatus !== "Not applied"} onClose={() => setSelected(null)} onApply={() => apply(selected)} />}
      {uploadOpen && (
        <OpportunityUploadModal
          isSubmitting={createMutation.isPending}
          onClose={() => setUploadOpen(false)}
          onSubmit={async values => {
            await createMutation.mutateAsync(values);
            toast.success(`${values.type} uploaded`, {
              description: `${values.company} is now listed in opportunities.`,
            });
            setUploadOpen(false);
          }}
        />
      )}
    </PragatiFrame>
  );
}

type OpportunityUploadValues = {
  company: string;
  role: string;
  type: "Internship" | "Placement";
  location: string;
  deadline: string;
  description: string;
  skills: string[];
  criteria: { label: string; expected: string }[];
  verificationRequirements: string[];
};

function OpportunityUploadModal({
  isSubmitting,
  onClose,
  onSubmit,
}: {
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: OpportunityUploadValues) => Promise<void>;
}) {
  const [form, setForm] = useState<OpportunityUploadValues>({
    company: "",
    role: "",
    type: "Internship",
    location: "",
    deadline: "",
    description: "",
    skills: ["DSA", "Python"],
    criteria: [
      { label: "CGPA", expected: ">= 7.0" },
      { label: "Active backlogs", expected: "= 0" },
    ],
    verificationRequirements: ["Verified academic record", "Updated resume"],
  });

  const updateList = <K extends "skills" | "verificationRequirements">(
    key: K,
    index: number,
    value: string
  ) => {
    const next = [...form[key]];
    next[index] = value;
    setForm({ ...form, [key]: next });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = {
      ...form,
      skills: form.skills.map(item => item.trim()).filter(Boolean),
      criteria: form.criteria.filter(item => item.label.trim() && item.expected.trim()),
      verificationRequirements: form.verificationRequirements.map(item => item.trim()).filter(Boolean),
    };

    if (!payload.company || !payload.role || !payload.location || !payload.deadline || !payload.description) {
      toast.error("Please fill every required field.");
      return;
    }
    if (payload.skills.length === 0) {
      toast.error("Add at least one required skill.");
      return;
    }
    if (payload.criteria.length === 0) {
      toast.error("Add at least one eligibility criterion.");
      return;
    }
    if (payload.verificationRequirements.length === 0) {
      toast.error("Add at least one verification requirement.");
      return;
    }

    try {
      await onSubmit(payload);
    } catch (error) {
      toast.error("Could not upload opportunity", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#07112d]/45 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#e2e8f2] bg-white shadow-2xl">
        <div className="sticky top-0 z-10 grid grid-cols-[1fr_auto] items-center border-b border-[#e2e8f2] bg-white px-5 py-4 sm:px-6">
          <div>
            <div className="eyebrow">T&amp;P upload</div>
            <h2 className="text-lg font-extrabold tracking-[-0.03em] text-[#1c2a47]">Upload internship data</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-[#74819a] hover:bg-[#f1f4f9]" aria-label="Close upload form">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="grid gap-5 p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Company" required>
              <input value={form.company} onChange={event => setForm({ ...form, company: event.target.value })} className="form-input" placeholder="Atlas Labs" />
            </FormField>
            <FormField label="Role" required>
              <input value={form.role} onChange={event => setForm({ ...form, role: event.target.value })} className="form-input" placeholder="Product Engineering Intern" />
            </FormField>
            <FormField label="Type" required>
              <select value={form.type} onChange={event => setForm({ ...form, type: event.target.value as "Internship" | "Placement" })} className="form-input">
                <option value="Internship">Internship</option>
                <option value="Placement">Placement</option>
              </select>
            </FormField>
            <FormField label="Location" required>
              <input value={form.location} onChange={event => setForm({ ...form, location: event.target.value })} className="form-input" placeholder="Bengaluru · Hybrid" />
            </FormField>
            <FormField label="Application deadline" required>
              <input type="date" value={form.deadline} onChange={event => setForm({ ...form, deadline: event.target.value })} className="form-input" />
            </FormField>
          </div>

          <FormField label="Description" required>
            <textarea value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} className="form-input min-h-28 resize-y" placeholder="Describe the role, responsibilities, selection process, stipend, and internship duration." />
          </FormField>

          <div className="grid gap-4 lg:grid-cols-3">
            <DynamicTextList
              label="Required skills"
              values={form.skills}
              placeholder="Skill"
              onChange={(index, value) => updateList("skills", index, value)}
              onAdd={() => setForm({ ...form, skills: [...form.skills, ""] })}
            />
            <div>
              <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#6c7890]">Eligibility criteria</div>
              <div className="grid gap-2">
                {form.criteria.map((criteria, index) => (
                  <div key={index} className="grid grid-cols-[1fr_1fr] gap-2">
                    <input value={criteria.label} onChange={event => {
                      const next = [...form.criteria];
                      next[index] = { ...next[index], label: event.target.value };
                      setForm({ ...form, criteria: next });
                    }} className="form-input" placeholder="CGPA" />
                    <input value={criteria.expected} onChange={event => {
                      const next = [...form.criteria];
                      next[index] = { ...next[index], expected: event.target.value };
                      setForm({ ...form, criteria: next });
                    }} className="form-input" placeholder=">= 7.0" />
                  </div>
                ))}
                <button type="button" onClick={() => setForm({ ...form, criteria: [...form.criteria, { label: "", expected: "" }] })} className="grid h-9 grid-flow-col items-center justify-center gap-1 rounded-lg border border-[#dfe5ef] text-xs font-bold text-primary hover:bg-[#f8fafc]">
                  <Plus className="h-3.5 w-3.5" /> Add criterion
                </button>
              </div>
            </div>
            <DynamicTextList
              label="Verification requirements"
              values={form.verificationRequirements}
              placeholder="Requirement"
              onChange={(index, value) => updateList("verificationRequirements", index, value)}
              onAdd={() => setForm({ ...form, verificationRequirements: [...form.verificationRequirements, ""] })}
            />
          </div>

          <div className="grid gap-3 border-t border-[#e2e8f2] pt-5 sm:grid-cols-[1fr_auto_auto] sm:items-center">
            <p className="text-xs leading-5 text-[#7c899f]">Uploaded data is published to the Opportunities list immediately for this demo workspace.</p>
            <button type="button" onClick={onClose} className="rounded-xl border border-[#dfe5ef] px-4 py-2.5 text-xs font-bold text-[#64718a] hover:bg-[#f8fafc]">Cancel</button>
            <button disabled={isSubmitting} className="grid grid-flow-col items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white transition hover:opacity-90 disabled:opacity-60">
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {isSubmitting ? "Uploading..." : "Upload data"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#6c7890]">
        {label} {required && <span className="text-[#bd4c64]">*</span>}
      </span>
      {children}
    </label>
  );
}

function DynamicTextList({
  label,
  values,
  placeholder,
  onChange,
  onAdd,
}: {
  label: string;
  values: string[];
  placeholder: string;
  onChange: (index: number, value: string) => void;
  onAdd: () => void;
}) {
  return (
    <div>
      <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#6c7890]">{label}</div>
      <div className="grid gap-2">
        {values.map((value, index) => (
          <input key={index} value={value} onChange={event => onChange(index, event.target.value)} className="form-input" placeholder={`${placeholder} ${index + 1}`} />
        ))}
        <button type="button" onClick={onAdd} className="grid h-9 grid-flow-col items-center justify-center gap-1 rounded-lg border border-[#dfe5ef] text-xs font-bold text-primary hover:bg-[#f8fafc]">
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>
    </div>
  );
}

function OpportunityCard({ item, index, applied, onOpen, onApply }: { item: Opportunity; index: number; applied: boolean; onOpen: () => void; onApply: () => void }) {
  return (
    <article className={`premium-card motion-enter motion-delay-${Math.min(index + 1, 4)} group overflow-hidden p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[#cbd5ef] hover:shadow-[0_18px_45px_rgba(48,72,168,0.11)] sm:p-6`}>
      <div className="grid grid-cols-[auto_1fr_auto] items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary text-sm font-bold">{item.company.slice(0, 1)}</div>
        <div className="min-w-0">
          <div className="grid grid-flow-col auto-cols-max items-center gap-2">
            <h3 className="truncate text-sm font-bold text-[#263653]">{item.company}</h3>
            <span className={`rounded-full px-2 py-1 text-[9px] font-semibold ${item.type === "Internship" ? "bg-[#e5f7f2] text-[#13876f]" : "bg-[#f0ebff] text-[#7358c9]"}`}>{item.type}</span>
            {item.closingSoon && <span className="rounded-full bg-[#fff1dc] px-2 py-1 text-[9px] font-semibold text-[#bd7a27]">Closing soon</span>}
          </div>
          <div className="mt-1 text-[15px] font-bold tracking-tight text-[#182643]">{item.role}</div>
        </div>
        <button aria-label={`Open ${item.role} details`} onClick={onOpen} className="rounded-lg p-1.5 text-[#97a3b5] hover:bg-[#f1f4f9] hover:text-[#5268cb]">
          <ExternalLink className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 text-[11px] text-[#7c899f]">
        <span className="grid grid-flow-col auto-cols-max items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-[#9ba7b9]" />{item.location}</span>
        <span className="grid grid-flow-col auto-cols-max items-center gap-1.5 justify-self-end"><Calendar className="h-3.5 w-3.5 text-[#9ba7b9]" />{item.deadlineLabel}</span>
      </div>
      <div className="mt-5 flex flex-wrap gap-1.5">
        {item.skills.map(skill => (
          <span key={skill} className="rounded-lg border border-[#e1e7f0] bg-[#f9fafc] px-2 py-1 text-[10px] font-semibold text-[#54627d]">
            {skill}
          </span>
        ))}
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-[#edf1f7] pt-4">
        <div className="flex items-center gap-2 text-xs">
          {item.eligibilityStatus === "Eligible" ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-[#16a889]" />
              <span className="font-bold text-[#13876f]">Eligible to apply</span>
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4 text-[#d75f76]" />
              <span className="font-bold text-[#bd4c64]">Criteria unmet</span>
            </>
          )}
          <span className="text-[#c4cbd6]">·</span>
          <span className="font-medium text-[#8995aa]">{applied ? (item.applicationStatus === "Not applied" ? "Applied" : item.applicationStatus) : item.applicationStatus}</span>
        </div>
        <button onClick={onApply} disabled={applied || item.eligibilityStatus !== "Eligible"} className={`grid grid-flow-col auto-cols-max items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${applied ? "bg-[#e5f7f2] text-[#13876f]" : item.eligibilityStatus === "Eligible" ? "bg-primary text-white hover:opacity-90" : "bg-[#eef1f6] text-[#9aa5b6]"}`}>
          {applied ? "Application saved" : item.eligibilityStatus === "Eligible" ? "Apply now" : "View criteria"}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </article>
  );
}

function OpportunityDrawer({
  item,
  applied,
  onClose,
  onApply,
}: {
  item: Opportunity;
  applied: boolean;
  onClose: () => void;
  onApply: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="Close opportunity details"
        onClick={onClose}
        className="absolute inset-0 bg-[#07112d]/45 backdrop-blur-sm"
      />
      <aside className="motion-enter absolute right-0 top-0 flex h-full w-full max-w-[520px] flex-col overflow-y-auto bg-[#f8f9fc] shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#e1e7f0] bg-[#f8f9fc]/95 px-5 py-4 backdrop-blur-xl sm:px-7">
          <div className="eyebrow">Opportunity details</div>
          <button
            aria-label="Close details"
            onClick={onClose}
            className="rounded-lg p-2 text-[#74819a] hover:bg-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5 sm:p-7">
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
              {item.company.slice(0, 1)}
            </div>
            <div>
              <div className="text-xs font-bold text-primary">{item.company}</div>
              <h2 className="mt-1 text-2xl font-extrabold leading-tight tracking-[-0.035em] text-[#1c2a47]">
                {item.role}
              </h2>
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full bg-[#eef1f7] px-2.5 py-1 text-[10px] font-semibold text-[#64718a]">
                  {item.type}
                </span>
                <span className="flex items-center gap-1 rounded-full bg-[#eef1f7] px-2.5 py-1 text-[10px] font-semibold text-[#64718a]">
                  <MapPin className="h-3 w-3" /> {item.location}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-[#e1e7f0] bg-white p-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8995aa]">Deadline</div>
              <div className="mt-1 text-sm font-bold text-[#34415d]">{item.deadlineLabel}</div>
            </div>
            <div className="rounded-xl border border-[#e1e7f0] bg-white p-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8995aa]">Status</div>
              <div
                className={`mt-1 text-sm font-bold ${
                  item.eligibilityStatus === "Eligible" ? "text-[#13876f]" : "text-[#bd4c64]"
                }`}
              >
                {item.eligibilityStatus}
              </div>
            </div>
          </div>
          <section className="mt-7">
            <div className="eyebrow mb-2">About the role</div>
            <p className="text-sm leading-6 text-[#64718a]">{item.description}</p>
          </section>
          <section className="mt-7">
            <div className="eyebrow mb-3">Skills required</div>
            <div className="flex flex-wrap gap-2">
              {item.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-lg border border-[#dfe5ef] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#52617d]"
                >
                  {skill}
                </span>
              ))}
            </div>
          </section>
          <section className="mt-7 rounded-2xl border border-[#dfe5ef] bg-white p-4 sm:p-5">
            <div className="mb-1 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <div className="text-sm font-bold text-[#34415d]">
                Why you are {item.eligibilityStatus === "Eligible" ? "eligible" : "not eligible"}
              </div>
            </div>
            <p className="mb-4 text-xs leading-5 text-[#8995aa]">
              Eligibility is evaluated against verified profile data. Each criterion is shown so the decision is transparent.
            </p>
            <div className="space-y-2.5">
              {item.criteria.map((criteria) => (
                <div
                  key={criteria.label}
                  className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 ${
                    criteria.pass ? "bg-[#f1faf7]" : "bg-[#fff3f5]"
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#52617d]">
                    {criteria.pass ? (
                      <Check className="h-4 w-4 text-[#16a889]" />
                    ) : (
                      <XCircle className="h-4 w-4 text-[#d75f76]" />
                    )}
                    {criteria.label}
                  </div>
                  <div className="text-[11px] font-bold text-[#34415d]">
                    {criteria.actual}{" "}
                    <span className="font-medium text-[#9aa5b6]">{criteria.expected}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
          {item.eligibilityStatus === "Not eligible" && (
            <section className="mt-7 rounded-2xl border border-[#f1d7a7] bg-[#fffaf1] p-4 sm:p-5">
              <div className="mb-1 flex items-center gap-2">
                <Target className="h-4 w-4 text-[#bd7a27]" />
                <div className="text-sm font-bold text-[#6d4c1d]">What can I improve?</div>
              </div>
              <p className="mb-4 text-xs leading-5 text-[#8f7555]">
                The failed criteria below are the clearest bridge back to your Skills &amp; Assessments workspace.
              </p>
              {item.criteria
                .filter((criteria) => !criteria.pass)
                .map((criteria) => (
                  <div key={criteria.label} className="rounded-xl border border-[#f1ddb9] bg-white/70 p-3 mb-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs font-bold text-[#6d4c1d]">{criteria.label} assessment</div>
                      <div className="text-xs font-bold text-[#bd4c64]">{criteria.actual}</div>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-[10px] text-[#8f7555]">
                      <span>
                        Required<br />
                        <strong className="text-[#6d4c1d]">
                          {criteria.expected.replace(/^>=?\s*/, "")}
                        </strong>
                      </span>
                      <span>
                        Gap<br />
                        <strong className="text-[#bd4c64]">
                          {criteriaGap(criteria) ?? "—"} points
                        </strong>
                      </span>
                      <button
                        onClick={() => window.location.assign("/skills")}
                        className="rounded-lg bg-primary px-2 py-1.5 text-[10px] font-bold text-white transition hover:opacity-90"
                      >
                        Open Skills
                      </button>
                    </div>
                  </div>
                ))}
            </section>
          )}
          <section className="mt-7">
            <div className="eyebrow mb-3">Verification requirements</div>
            <ul className="space-y-2 text-xs text-[#64718a]">
              {item.verificationRequirements.map((requirement) => (
                <li key={requirement} className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#16a889]" />
                  {requirement}
                </li>
              ))}
            </ul>
          </section>
        </div>
        <div className="sticky bottom-0 mt-auto border-t border-[#e1e7f0] bg-white/95 p-5 backdrop-blur-xl sm:p-7">
          <button
            onClick={onApply}
            disabled={applied || item.eligibilityStatus !== "Eligible"}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-semibold ${
              applied
                ? "bg-[#e5f7f2] text-[#13876f]"
                : item.eligibilityStatus === "Eligible"
                ? "bg-primary text-white hover:opacity-90"
                : "bg-[#eef1f6] text-[#9aa5b6]"
            }`}
          >
            {applied ? (
              <>
                <CheckCircle2 className="h-4 w-4" /> Application saved
              </>
            ) : item.eligibilityStatus === "Eligible" ? (
              <>
                Apply for this opportunity <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              <>
                Review eligibility criteria <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </aside>
    </div>
  );
}

function PageSkeleton() { return <div className="min-h-screen bg-[#f5f7fb] p-6"><div className="mx-auto max-w-6xl animate-pulse space-y-5"><div className="h-16 rounded-2xl bg-white" /><div className="h-32 rounded-2xl bg-[#dfe5f4]" /><div className="grid grid-cols-4 gap-4"><div className="col-span-4 h-24 rounded-2xl bg-white" /></div><div className="h-80 rounded-2xl bg-white" /></div></div>; }

