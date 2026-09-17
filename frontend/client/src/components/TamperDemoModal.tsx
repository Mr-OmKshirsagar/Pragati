import { computeStringSHA256 } from "@/lib/crypto";
import { trpc } from "@/lib/trpc";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileCode2,
  FileText,
  Info,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import React, { useEffect, useState } from "react";

interface TamperDemoModalProps {
  onClose: () => void;
}

const ORIGINAL_DOCUMENT_CONTENT = `TechCorp Internship Offer Letter
Candidate: Rahul Sharma (CSE2024042)
Role: Product Engineering Intern
Monthly Stipend: INR 45,000 / month
Tenure: 6 Months (June 1, 2026 - Nov 30, 2026)
Location: Bangalore Tech Park
Verification Token: TC-2026-NIT-9821`;

const TAMPERED_DOCUMENT_CONTENT = `TechCorp Internship Offer Letter
Candidate: Rahul Sharma (CSE2024042)
Role: Product Engineering Intern
Monthly Stipend: INR 95,000 / month
Tenure: 6 Months (June 1, 2026 - Nov 30, 2026)
Location: Bangalore Tech Park
Verification Token: TC-2026-NIT-9821`;

export default function TamperDemoModal({ onClose }: TamperDemoModalProps) {
  const [isTampered, setIsTampered] = useState(false);
  const [originalHash, setOriginalHash] = useState("");
  const [currentHash, setCurrentHash] = useState("");
  const [isComputing, setIsComputing] = useState(false);

  // Compute initial original hash on mount
  useEffect(() => {
    async function init() {
      const orig = await computeStringSHA256(ORIGINAL_DOCUMENT_CONTENT);
      setOriginalHash(orig);
      setCurrentHash(orig);
    }
    init();
  }, []);

  const handleToggleTamper = async () => {
    setIsComputing(true);
    const willTamper = !isTampered;
    setIsTampered(willTamper);

    const textToHash = willTamper
      ? TAMPERED_DOCUMENT_CONTENT
      : ORIGINAL_DOCUMENT_CONTENT;

    const hash = await computeStringSHA256(textToHash);
    setCurrentHash(hash);
    setIsComputing(false);
  };

  const isMatch = originalHash === currentHash;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#dfe5ef] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#eef1f6] bg-gradient-to-r from-[#f8faff] to-[#f4f7fd]">
          <div className="flex items-center gap-3">
            <div
              className={`grid h-10 w-10 place-items-center rounded-xl transition ${
                isMatch
                  ? "bg-[#e5f7f2] text-[#13876f]"
                  : "bg-[#fef2f2] text-[#dc2626]"
              }`}
            >
              {isMatch ? (
                <ShieldCheck className="h-5 w-5" />
              ) : (
                <ShieldAlert className="h-5 w-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-[#182643]">
                  Cryptographic Tamper Demonstration
                </h3>
                <span className="rounded-full bg-primary px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                  Evaluator Mode
                </span>
              </div>
              <p className="text-xs text-[#71809a]">
                Live bit-level SHA-256 integrity verification vs authenticity
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-[#8b99bd] hover:bg-slate-100 hover:text-[#182643] transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Status Alert Banner */}
          <div
            className={`rounded-2xl border p-4 transition-all duration-300 ${
              isMatch
                ? "border-[#ccebe2] bg-[#f2faf7]"
                : "border-[#fecaca] bg-[#fff5f5]"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {isMatch ? (
                  <CheckCircle2 className="h-5 w-5 text-[#13876f]" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-[#dc2626]" />
                )}
                <div>
                  <div
                    className={`text-xs font-extrabold uppercase tracking-wider ${
                      isMatch ? "text-[#13876f]" : "text-[#dc2626]"
                    }`}
                  >
                    {isMatch
                      ? "✓ Cryptographic Integrity Verified"
                      : "⚠ Integrity Failure: Document Bytes Altered"}
                  </div>
                  <div className="text-[11px] text-[#52617d] mt-0.5">
                    {isMatch
                      ? "The file byte sequence exactly matches the SHA-256 hash registered in Supabase Storage."
                      : "A 1-character modification in document payload triggered a complete cryptographic hash mismatch."}
                  </div>
                </div>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-extrabold tracking-wider ${
                  isMatch
                    ? "bg-[#e5f7f2] text-[#13876f]"
                    : "bg-[#fee2e2] text-[#b91c1c]"
                }`}
              >
                {isMatch ? "VALID" : "TAMPERED"}
              </span>
            </div>
          </div>

          {/* Document Content Box */}
          <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#182643]">
                <FileText className="h-4 w-4 text-primary" />
                Document: TechCorp_OfferLetter.pdf
              </div>
              <span className="text-[10px] font-mono text-[#8995aa]">
                {isTampered ? "Payload Modified (Stipend: 95,000)" : "Original Seed Payload"}
              </span>
            </div>
            <pre className="p-3 bg-white border border-[#e2e8f0] rounded-xl text-xs font-mono text-[#334155] whitespace-pre-wrap leading-relaxed">
              {isTampered ? (
                <>
                  TechCorp Internship Offer Letter{"\n"}
                  Candidate: Rahul Sharma (CSE2024042){"\n"}
                  Role: Product Engineering Intern{"\n"}
                  Monthly Stipend:{" "}
                  <span className="bg-amber-200 font-bold px-1 rounded text-red-700">
                    INR 95,000 / month
                  </span>{" "}
                  (Altered byte: 4 → 9){"\n"}
                  Tenure: 6 Months (June 1, 2026 - Nov 30, 2026){"\n"}
                  Location: Bangalore Tech Park{"\n"}
                  Verification Token: TC-2026-NIT-9821
                </>
              ) : (
                ORIGINAL_DOCUMENT_CONTENT
              )}
            </pre>
          </div>

          {/* Side-by-Side SHA-256 Hash Comparison */}
          <div className="space-y-3">
            <div className="text-xs font-extrabold text-[#182643] flex items-center justify-between">
              <span>SHA-256 Hash Verification</span>
              <span className="text-[10px] text-[#8995aa] font-normal">
                Cryptographic Avalanche Effect
              </span>
            </div>

            <div className="grid gap-2 text-xs">
              <div className="p-3 rounded-xl border border-[#e2e8f0] bg-[#fafbff]">
                <div className="flex items-center justify-between text-[11px] font-semibold text-[#71809a] mb-1">
                  <span>Vault Registered Hash (Original):</span>
                  <span className="text-[10px] font-mono text-emerald-600">64 Hex Characters</span>
                </div>
                <div className="font-mono text-[11px] text-[#1e293b] break-all select-all">
                  {originalHash || "Computing..."}
                </div>
              </div>

              <div
                className={`p-3 rounded-xl border transition ${
                  isMatch
                    ? "border-[#e2e8f0] bg-[#fafbff]"
                    : "border-red-200 bg-red-50/50"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-semibold text-[#71809a] mb-1">
                  <span>Current Payload Hash:</span>
                  <span
                    className={`text-[10px] font-mono font-bold ${
                      isMatch ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {isMatch ? "MATCHES VAULT" : "HASH MISMATCH"}
                  </span>
                </div>
                <div
                  className={`font-mono text-[11px] break-all select-all ${
                    isMatch ? "text-[#1e293b]" : "text-red-700 font-bold"
                  }`}
                >
                  {currentHash || "Computing..."}
                </div>
              </div>
            </div>
          </div>

          {/* Educational Note */}
          <div className="flex items-start gap-2.5 rounded-xl border border-[#e0e7ff] bg-[#eef2ff] p-3 text-xs text-[#3730a3]">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Core Architecture Principle: </strong>
              SHA-256 cryptographic hashing guarantees <em>Integrity</em> (the
              bytes are unmodified). To guarantee <em>Authenticity</em> (the
              employer actually issued it), PRAGATI combines this with Faculty
              Review (<code>INSTITUTION_VERIFIED</code>) and official Employer
              Tokens.
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#eef1f6] bg-[#fcfdff]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#64748b] hover:text-[#182643] rounded-xl transition"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleToggleTamper}
            disabled={isComputing}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-md ${
              isTampered
                ? "bg-primary hover:opacity-90 text-white shadow-indigo-900/15"
                : "bg-red-600 hover:bg-red-700 text-white shadow-red-900/15"
            }`}
          >
            {isTampered ? (
              <>
                <RefreshCw className="h-3.5 w-3.5" />
                Restore Original Byte
              </>
            ) : (
              <>
                <Zap className="h-3.5 w-3.5" />
                Simulate Byte Tamper (INR 45k → 95k)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

