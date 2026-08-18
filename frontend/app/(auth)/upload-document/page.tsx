"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "../../(main)/dashboard/DashboardLayout";
import { Button } from "../../components/button";
import Toast from "@/app/components/toast";
import { Loader } from "@/app/components/loader";

/* ================= TYPES ================= */

interface UploadResponse {
  Success?: {
    message: string;
    data: DocumentData;
  };
  Error?: string;
}

interface DocumentData {
  userId: string;
  documentId: number;
  document_type: string;
  doc_number: string;
  name: string;
  gender: string;
  dob: string;
  address: string;
  email: string;
  mobile: number;
  job_role: string;
  work_experience_years: number;
  qualifications: Qualifications[] | null;
  work_history: WorkHistory[] | null;
  file_path: string;
  chunks: number;
}

export interface Qualifications {
  level?: string | null;
  percentage?: string | null;
}

export interface WorkHistory {
  company?: string | null;
  role?: string | null;
  duration_years?: number | null;
  start_date?: string | null;
  end_date?: string | null;
}

/* ================= HELPERS ================= */

type FileKind = "image" | "pdf" | "other" | null;

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
];

const getFileType = (file: File | null): FileKind => {
  if (!file) return null;
  if (file.type.startsWith("image/")) return "image";
  if (file.type === "application/pdf") return "pdf";
  return "other";
};

/* ================= COMPONENT ================= */

export default function UploadDocument() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [showPreview, setShowPreview] = useState(false);

  const fileType = getFileType(file);

  /* ===== Preview URL (memory safe) ===== */
  const previewUrl = useMemo(() => {
    return file ? URL.createObjectURL(file) : null;
  }, [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  /* ===== Toast ===== */
  const showToast = (msg: string, type: "success" | "error") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3000);
  };

  /* ===== Drag & Drop ===== */
  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;

    if (!ALLOWED_TYPES.includes(droppedFile.type)) {
      showToast("Only PDF, Word, and Image files are allowed", "error");
      return;
    }

    setFile(droppedFile);
    setUploadSuccess(false);
    setDocumentData(null);
  };

  /* ===== Upload ===== */
  const handleUpload = async () => {
    if (!file) {
      showToast("Please select a file first", "error");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload-document", {
        method: "POST",
        body: formData,
      });

      const data: UploadResponse = await res.json();

      if (data?.Success?.data) {
        setDocumentData(data.Success.data);
        setUploadSuccess(true);
        showToast(data.Success.message || "File uploaded successfully", "success");
      } else {
        showToast("Invalid server response", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Upload failed", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ================= JSX ================= */

  return (
    <DashboardLayout>
      <div className="h-full overflow-y-auto px-4 md:px-6 lg:px-8 scrollbar-hide">

        {loading && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
            <Loader size="lg" />
          </div>
        )}

        {toastMessage && <Toast message={toastMessage} type={toastType} />}

        <h2 className="text-3xl md:text-5xl font-bold text-white text-center py-6">
          📁 Upload File Here
        </h2>

        <div className={`max-w-6xl mx-auto ${!file ? "flex justify-center mt-12" : ""}`}>
          <div
            className={`w-full ${file
                ? "grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch"
                : "flex justify-center"
              }`}
          >
            {/* UPLOAD BOX */}
            <div className="flex justify-center w-full">
              <label
                htmlFor="fileUpload"
                className={`
                  cursor-pointer border-2 border-dashed rounded-xl
                  w-full max-w-xl
                  h-[260px] md:h-[280px] lg:h-[300px]
                  flex flex-col items-center justify-center
                  transition
                  px-6 py-4
                  ${isDragging
                    ? "bg-gray-700 border-purple-400"
                    : "border-gray-500 text-gray-300 hover:bg-gray-800"}
                `}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <span className="text-5xl text-purple-400">
                  {uploadSuccess ? "✅" : "⬆️"}
                </span>

                <span className="text-lg font-semibold text-white mt-3">
                  {isDragging ? "Drop file here" : "Click or drag a file"}
                </span>

                <span className="text-sm mt-1 text-gray-300 text-center">
                  (PDF, DOC, DOCX, PNG, JPG, JPEG)
                </span>
              </label>

              <input
                id="fileUpload"
                type="file"
                className="hidden"
                accept=".pdf,.documentdata,.docx,.png,.jpg,.jpeg"
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null);
                  setUploadSuccess(false);
                  setDocumentData(null);
                }}
              />
            </div>

            {/* PREVIEW */}
            {file && previewUrl && (
              <div className="flex justify-center">
                <div className="border border-white/20 rounded-xl bg-black/30
                  w-full max-w-xl
                  h-[260px] md:h-[280px] lg:h-[300px]
                  flex items-center justify-center overflow-hidden  scrollbar-hide relative
                ">
                  {fileType === "image" && (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-contain cursor-zoom-in"
                      onClick={() => setShowPreview(true)}
                    />
                  )}

                  {fileType === "pdf" && (
                    <div
                      className="relative w-full h-full cursor-zoom-in"
                      onClick={() => setShowPreview(true)}
                    >
                      <iframe
                        src={`${previewUrl}#page=1&view=FitH&navpanes=0&toolbar=0&scrollbar=0`}
                        className="w-full h-full bg-white"
                        style={{ overflow: "hidden" }}
                        title="PDF Preview"
                      />

                      <div className="absolute inset-0" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {file && !uploadSuccess && (
            <div className="text-center mt-6">
              <p className="text-gray-300 text-sm mb-4">
                Selected File: <span className="text-purple-300">{file.name}</span>
              </p>
              <Button onClick={handleUpload}>Upload file</Button>
            </div>
          )}

          {uploadSuccess && documentData && (
            <div className="mt-10 max-w-4xl mx-auto bg-white/10 border border-white/20 rounded-xl">

              {/* Header */}
              <div className="p-4 bg-white/5 font-semibold text-white">
                {documentData.document_type
                  ?.replace("_", " ")
                  .toUpperCase()}
              </div>

              {/* Basic Info */}
              <div className="p-6 text-sm text-gray-300 space-y-2">
                {documentData.name && <p><b>Name:</b> {documentData.name}</p>}
                {documentData.doc_number && <p><b>Document Number:</b> {documentData.doc_number}</p>}
                {documentData.gender && <p><b>Gender:</b> {documentData.gender}</p>}
                {documentData.dob && <p><b>DOB:</b> {documentData.dob}</p>}
                {documentData.email && <p><b>Email:</b> {documentData.email}</p>}
                {documentData.mobile && <p><b>Mobile:</b> {documentData.mobile}</p>}
                {documentData.address && <p><b>Address:</b> {documentData.address}</p>}
                {documentData.job_role && <p><b>Job Role:</b> {documentData.job_role}</p>}
                {documentData.work_experience_years !== null && (
                  <p><b>Experience:</b> {documentData.work_experience_years} years</p>
                )}
              </div>

              {/* Qualifications */}
              {documentData.qualifications?.length ? (
                <div className="px-6 pb-4">
                  <h3 className="font-semibold text-white mb-2">Qualifications</h3>
                  <ul className="space-y-1 text-gray-300 text-sm">
                    {documentData.qualifications.map((q, index) => (
                      <li key={index}>
                        • {q.level?.replace("_", " ")}
                        {q.percentage && ` - ${q.percentage}%`}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {/* Work History */}
              {documentData.work_history?.length ? (
                <div className="px-6 pb-6">
                  <h3 className="font-semibold text-white mb-2">Work History</h3>
                  <div className="space-y-3 text-sm text-gray-300">
                    {documentData.work_history.map((job, index) => (
                      <div
                        key={index}
                        className="p-3 bg-white/5 rounded-lg border border-white/10"
                      >
                        {job.company && <p><b>Company:</b> {job.company}</p>}
                        {job.role && <p><b>Role:</b> {job.role}</p>}
                        {job.start_date && (
                          <p>
                            <b>Duration:</b> {job.start_date}
                            {job.end_date ? ` – ${job.end_date}` : " – Present"}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

            </div>
          )}

        </div>
      </div>

      {/* FULLSCREEN PREVIEW */}
{showPreview && previewUrl && (
  <div
    className="fixed inset-0 z-50 bg-black/80 flex items-start justify-center p-4"
    onClick={() => setShowPreview(false)}
  >
    {/* Close Button */}
    <button
      className="absolute top-4 right-4 text-white text-3xl z-20"
      onClick={(e) => {
        e.stopPropagation();
        setShowPreview(false);
      }}
    >
      ✕
    </button>

    {/* Image Preview */}
    {fileType === "image" && (
      <img
        src={previewUrl}
        className="w-auto h-full max-h-screen object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    )}

    {/* PDF Preview */}
    {fileType === "pdf" && (
      <iframe
        src={previewUrl}
        className="w-auto h-full max-h-screen bg-white"
        onClick={(e) => e.stopPropagation()}
      />
    )}
  </div>
)}

    </DashboardLayout>
  );
}
