import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  Search,
  Users,
  Briefcase,
  BookOpen,
  ArrowRight,
  X,
  Loader2,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";

interface GlobalSearchModalProps {
  open: boolean;
  onClose: () => void;
}

export default function GlobalSearchModal({ open, onClose }: GlobalSearchModalProps) {
  const [, navigate] = useLocation();
  const [queryText, setQueryText] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce input by 200ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(queryText.trim());
    }, 200);
    return () => clearTimeout(timer);
  }, [queryText]);

  // Global search tRPC query
  const searchQuery = trpc.search.globalSearch.useQuery(
    { q: debouncedQuery, limit: 8 },
    {
      enabled: open && debouncedQuery.length >= 1,
      refetchOnWindowFocus: false,
    }
  );

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const results = searchQuery.data?.data;
  const hasResults =
    results &&
    ((results.students && results.students.length > 0) ||
      (results.internships && results.internships.length > 0) ||
      (results.subjects && results.subjects.length > 0));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 bg-slate-50/50">
          <Search className="h-5 w-5 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="Search students, corporate internships, academic subjects..."
            className="w-full bg-transparent text-sm sm:text-base text-slate-800 placeholder:text-slate-400 outline-none"
          />
          {searchQuery.isFetching && (
            <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
          )}
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search Results Area */}
        <div className="overflow-y-auto p-4 space-y-5">
          {debouncedQuery.length === 0 && (
            <div className="py-10 text-center space-y-2">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-primary mx-auto">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">Instant Institutional Search</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Search across students by name or PRN, corporate attachments by company or role, and subjects by course code.
              </p>
              <div className="flex justify-center gap-2 pt-2">
                {["Rahul", "Atlas Labs", "Data Structures", "Python"].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setQueryText(suggestion)}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:border-primary hover:text-primary transition"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {debouncedQuery.length > 0 && !hasResults && !searchQuery.isFetching && (
            <div className="py-10 text-center text-xs text-slate-400">
              No matching records found for "{debouncedQuery}". Try another keyword.
            </div>
          )}

          {/* Students Results */}
          {results?.students && results.students.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-1">
                <Users className="h-3.5 w-3.5 text-primary" />
                <span>Students ({results.students.length})</span>
              </div>
              <div className="space-y-1">
                {results.students.map((student: any) => (
                  <button
                    key={student.id}
                    onClick={() => {
                      navigate(`/admin/students`);
                      onClose();
                    }}
                    className="w-full text-left flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100 group"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800 group-hover:text-primary transition">
                        {student.name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {student.enrollmentNumber || "PRN Registered"} · {student.department || "Engineering"}
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-primary transition" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Internships Results */}
          {results?.internships && results.internships.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-1">
                <Briefcase className="h-3.5 w-3.5 text-amber-600" />
                <span>Internships & Corporate Drives ({results.internships.length})</span>
              </div>
              <div className="space-y-1">
                {results.internships.map((internship: any) => (
                  <button
                    key={internship.id}
                    onClick={() => {
                      navigate(`/internship`);
                      onClose();
                    }}
                    className="w-full text-left flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100 group"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800 group-hover:text-amber-600 transition">
                        {internship.companyName || internship.company}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {internship.role || "Internship Attachment"} · {internship.status || "ACTIVE"}
                      </div>
                    </div>
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700 border border-amber-200">
                      Corporate
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Subjects Results */}
          {results?.subjects && results.subjects.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-1">
                <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
                <span>Academic Subjects ({results.subjects.length})</span>
              </div>
              <div className="space-y-1">
                {results.subjects.map((subject: any) => (
                  <button
                    key={subject.id}
                    onClick={() => {
                      navigate(`/academics`);
                      onClose();
                    }}
                    className="w-full text-left flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100 group"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-600 transition">
                        {subject.name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Code: {subject.code || "CS-REG"} · Semester {subject.semester || 1}
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-200">
                      Academic
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Shortcut Helper */}
        <div className="border-t border-slate-100 px-4 py-2 bg-slate-50 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Tip: Press <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-600 text-[10px]">ESC</kbd> to close</span>
          <span className="text-[10px]">Powered by PRAGATI Search Engine</span>
        </div>
      </div>
    </div>
  );
}
