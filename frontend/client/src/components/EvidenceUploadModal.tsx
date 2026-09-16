import { computeFileSHA256, fileToBase64 } from "@/lib/crypto";
import { trpc } from "@/lib/trpc";
import {
  Check,
  CheckCircle2,
  Copy,
  FileCheck,
  FileText,
  Hash,
  ShieldCheck,
  UploadCloud,
  X,
} from "lucide-react";
import React, { useRef, useState } from "react";
import { toast } from "sonner";

interface EvidenceUploadModalProps {
  onClose: () => void;
  onSuccess?: () => void;
  achievementId?: string;
  defaultTitle?: string;
}

export default function EvidenceUploadModal({
  onClose,
  onSuccess,
  achievementId,
  defaultTitle,
}: EvidenceUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [sha256Hash, setSha256Hash] = useState<string>("");
  const [isHashing, setIsHashing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMutation = trpc.evidence.uploadAndRegister.useMutation();

  const handleFileChange = async (selectedFile: File) => {
    // Validate file size (10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("File exceeds maximum allowed size of 10MB.");
      return;
    }

    // Validate MIME type
    const validTypes = ["application/pdf", "image/png", "image/jpeg"];
    if (!validTypes.includes(selectedFile.type)) {
      toast.error("Invalid file format. Only PDF, PNG, and JPEG are supported.");
      return;
    }

    setFile(selectedFile);
    setIsHashing(true);

    try {
      const hash = await computeFileSHA256(selectedFile);
      setSha256Hash(hash);
    } catch (err: any) {
      toast.error(`Failed to compute SHA-256 hash: ${err.message}`);
    } finally {
      setIsHashing(false);
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const copyHash = () => {
    if (!sha256Hash) return;
    navigator.clipboard.writeText(sha256Hash);
    setCopied(true);
    toast.success("SHA-256 checksum copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpload = async () => {
    if (!file || !sha256Hash) {
      toast.error("Please select a file to compute its cryptographic hash.");
      return;
    }

    setIsUploading(true);
    try {
      const base64Data = await fileToBase64(file);

      await uploadMutation.mutateAsync({
        filename: file.name,
        mimeType: file.type as "application/pdf" | "image/png" | "image/jpeg",
        base64Data,
        clientHash: sha256Hash,
        achievementId,
      });

      toast.success(
        `Document uploaded and vaulted with verified SHA-256: ${sha256Hash.slice(
          0,
          8
        )}...`
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to upload document to evidence vault.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-[#dfe5ef] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#eef1f6] bg-gradient-to-r from-[#f8faff] to-[#f4f7fd]">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#eef2fd] text-[#3048a8]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#182643]">
                Cryptographic Evidence Vault
              </h3>
              <p className="text-xs text-[#71809a]">
                Upload proof with dual-layer SHA-256 tamper verification
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
        <div className="p-6 space-y-5">
          {defaultTitle && (
            <div className="rounded-xl border border-[#e4eaf5] bg-[#fafcff] p-3 text-xs text-[#52617d]">
              Linking proof to: <strong className="text-[#182643]">{defaultTitle}</strong>
            </div>
          )}

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
              file
                ? "border-[#3048a8] bg-[#f5f8ff]"
                : "border-[#ccd6e8] bg-[#f9fafc] hover:border-[#3048a8] hover:bg-[#f4f7fd]"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white shadow-sm border border-[#e2e8f2] text-[#3048a8]">
              <UploadCloud className="h-6 w-6" />
            </div>
            {file ? (
              <div>
                <p className="text-sm font-bold text-[#182643]">{file.name}</p>
                <p className="text-xs text-[#71809a]">
                  {(file.size / 1024).toFixed(1)} KB · {file.type}
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-bold text-[#263653]">
                  Click or drag document to upload
                </p>
                <p className="text-xs text-[#8995aa] mt-0.5">
                  Supports PDF, PNG, JPEG up to 10MB
                </p>
              </div>
            )}
          </div>

          {/* Cryptographic SHA-256 Hash Display */}
          {(isHashing || sha256Hash) && (
            <div className="rounded-2xl border border-[#dfe5ef] bg-[#f8faff] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-[#182643]">
                  <Hash className="h-3.5 w-3.5 text-[#3048a8]" />
                  Client-Computed SHA-256 Checksum
                </span>
                {sha256Hash && (
                  <button
                    type="button"
                    onClick={copyHash}
                    className="flex items-center gap-1 text-[11px] font-semibold text-[#3048a8] hover:underline"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-600" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" /> Copy Hash
                      </>
                    )}
                  </button>
                )}
              </div>
              {isHashing ? (
                <div className="flex items-center gap-2 text-xs text-[#64748b]">
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-[#3048a8] border-t-transparent" />
                  Generating cryptographic digest via Web Crypto API...
                </div>
              ) : (
                <div className="font-mono text-[11px] text-[#2d3748] bg-white border border-[#e2e8f0] p-2.5 rounded-xl break-all select-all">
                  {sha256Hash}
                </div>
              )}
              <p className="mt-2 text-[10px] text-[#8995aa]">
                Guarantees bit-for-bit document integrity in Supabase Storage. Any
                byte modification invalidates this hash.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#eef1f6] bg-[#fcfdff]">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 text-xs font-semibold text-[#64748b] hover:text-[#182643] rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || !sha256Hash || isUploading}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#3048a8] hover:bg-[#3f5ac1] disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-900/15 transition"
          >
            {isUploading ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Vaulting Document...
              </>
            ) : (
              <>
                <FileCheck className="h-3.5 w-3.5" />
                Vault Document & Record Hash
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
