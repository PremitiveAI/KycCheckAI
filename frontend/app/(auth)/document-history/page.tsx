"use client";

import { TrashIcon } from "@heroicons/react/24/outline";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  EyeIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { DashboardLayout } from "../../(main)/dashboard/DashboardLayout";
import { Loader } from "@/app/components/loader";
import Toast from "@/app/components/toast";
import { Button } from "@/app/components/button";

export interface DocResponse {
  Success?: {
    data?: {
      query?: string | null;
      limit?: number;
      offset?: number;
      total?: number;
      results?: DocDetail[] | null;
    } | null;
  } | null;
  Code?: number;
  Error?: string | null;
}

interface DocDetail {
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
  score: number;
  createdAt: string;
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

export default function List() {
  const [results, setResults] = useState<DocDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<"image" | "pdf" | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocDetail | null>(null);
  const [deleting, setDeleting] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isFetchingRef = useRef(false);

  const LIMIT = 4;

  const showToast = (message: string, type: "success" | "error") => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const confirmDelete = (doc: DocDetail) => {
    setSelectedDoc(doc);
    setShowDeleteModal(true);
  };

  const fetchList = useCallback(async () => {
    if (loading || !hasMore || isFetchingRef.current) return;

    try {
      isFetchingRef.current = true;
      setLoading(true);

      const offset = results.length;

      const res = await fetch(
        `/api/search-doc?query=all&limit=${LIMIT}&offset=${offset}`,
        { cache: "no-store" }
      );

      if (!res.ok) throw new Error("Failed");

      const response: DocResponse = await res.json();
      const data = response.Success?.data;
      const newResults = data?.results ?? [];

      // ✅ FIXED: de-duplicate + append correctly
      setResults((prev) => {
        const map = new Map<number, DocDetail>();

        prev.forEach((item) => {
          if (item.documentId != null) {
            map.set(item.documentId, item);
          }
        });

        newResults.forEach((item) => {
          if (item.documentId != null) {
            map.set(item.documentId, item);
          }
        });

        return Array.from(map.values());
      });

      if (offset + newResults.length >= (data?.total ?? 0)) {
        setHasMore(false);
      }
    } catch {
      showToast("Server error", "error");
    } finally {
      setLoading(false);
      setInitialLoading(false);
      isFetchingRef.current = false;
    }
  }, [results.length, loading, hasMore]);

  useEffect(() => {
    fetchList();
  }, []);

  const handleDelete = async () => {
    if (!selectedDoc) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/deleteDoc/${selectedDoc.documentId}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to delete document");
      }

      setResults((prev) =>
        prev.filter((doc) => doc.documentId !== selectedDoc.documentId)
      );
      showToast("Document deleted successfully!", "success");
      setShowDeleteModal(false);
    } catch (error: any) {
      console.error(error);
      showToast(error.message || "Failed to delete document", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleScroll = () => {
    if (!scrollRef.current || loading || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 80) {
      fetchList();
    }
  };

  const openPreview = (url: string) => {
    setPreviewType(url.toLowerCase().endsWith(".pdf") ? "pdf" : "image");
    setPreviewUrl(url);
    document.body.style.overflow = "hidden";
  };

  const closePreview = () => {
    setPreviewUrl(null);
    setPreviewType(null);
    document.body.style.overflow = "auto";
  };

  const downloadFile = async (fileUrl: string) => {
  try {
    setLoading(true);

    const res = await fetch(
      `/api/downloadDoc?fileUrl=${encodeURIComponent(fileUrl)}`
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("Download API error:", text);
      return;
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const filename = fileUrl.split("/").pop() || "document.pdf";

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error(error);
    showToast("Download failed", "error");
  } finally {
    setLoading(false);
  }
};


  return (
    <DashboardLayout>
      {initialLoading && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <Loader size="lg" />
        </div>
      )}

      {toastMessage && <Toast message={toastMessage} type={toastType} />}

      <div className="flex flex-col h-full">
        <h1 className="font-semibold text-lg md:text-xl text-white mx-6 mb-4">
          Uploaded Documents
        </h1>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto scrollbar-hide px-6">
          <div className="max-w-4xl mx-auto space-y-6 pb-10">
            {results.map((doc) => (
              <div
                key={doc.documentId ?? doc.createdAt}
                className="bg-white/10 rounded-xl border border-white/20 text-white"
              >
                {/* Header */}
                <div className="w-full flex items-center justify-between p-4 bg-white/5">
                  <h2 className="text-xl font-semibold">
                    {doc.document_type?.replace("_", " ").toUpperCase()}
                  </h2>

                  <button onClick={() => confirmDelete(doc)}>
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Basic Details */}
                <div className="px-6 py-4 text-sm text-gray-300 space-y-2">
                  {doc.name && <p><b>Name:</b> {doc.name}</p>}
                  {doc.doc_number && <p><b>Document Number:</b> {doc.doc_number}</p>}
                  {doc.gender && <p><b>Gender:</b> {doc.gender}</p>}
                  {doc.dob && <p><b>DOB:</b> {doc.dob}</p>}
                  {doc.email && <p><b>Email:</b> {doc.email}</p>}
                  {doc.mobile && <p><b>Mobile:</b> {doc.mobile}</p>}
                  {doc.address && <p><b>Address:</b> {doc.address}</p>}
                  {doc.job_role && <p><b>Job Role:</b> {doc.job_role}</p>}
                  {doc.work_experience_years !== null && (<p><b>Experience:</b> {doc.work_experience_years} years</p>)}
                </div>

                {/* Qualifications */}
                {doc.qualifications?.length ? (
                  <div className="px-6 pb-4">
                    <h3 className="font-semibold text-white mb-2">Qualifications</h3>
                    <ul className="space-y-1 text-sm text-gray-300">
                      {doc.qualifications.map((q, idx) => (
                        <li key={idx}>
                          • {q.level?.replace("_", " ")}
                          {q.percentage && ` (${q.percentage}%)`}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {/* Work History */}
                {doc.work_history?.length ? (
                  <div className="px-6 pb-4">
                    <h3 className="font-semibold text-white mb-2">Work History</h3>
                    <div className="space-y-3 text-sm text-gray-300">
                      {doc.work_history.map((job, idx) => (
                        <div
                          key={idx}
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

                {/* Actions */}
                <div className="px-6 py-4 flex gap-6">
                  {doc.file_path && (
                    <button
                      onClick={() => openPreview(doc.file_path)}
                      className="flex items-center gap-1 text-purple-300 hover:text-purple-200"
                    >
                      <EyeIcon className="w-5 h-5" /> View
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (!doc.file_path) {
                        showToast("File not available", "error");
                        return;
                      }
                      downloadFile(doc.file_path);
                    }}
                    className="flex items-center gap-1 text-purple-300 hover:text-purple-200"
                  >
                    <ArrowDownTrayIcon className="w-5 h-5" />
                    Download
                  </button>
                </div>
              </div>
            ))}

            {loading && !initialLoading &&  (
              <div className="flex justify-center py-6">
                <Loader size="sm" />
              </div>
            )}

            {!hasMore && results.length > 0 && (
              <p className="text-center text-gray-400 text-sm py-6">
                No more records
              </p>
            )}
          </div>
        </div>
      </div>

      {showDeleteModal && selectedDoc && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999]">
          <div className="relative text-center w-auto h-auto px-10 py-10 shadow-xl rounded-xl border border-white/20 bg-purple-900/40 backdrop-blur-md">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="absolute top-3 right-3 text-white/70 hover:text-white transition"
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <h2 className="text-4xl font-bold text-white">
              Delete Confirmation
            </h2>
            <p className="text-white/60 mt-4">
              Are you sure you want to delete the{" "}
              <span className="text-white font-semibold">
                {selectedDoc.document_type?.replace("_", " ").toUpperCase()}
              </span>{" "}
              of{" "}
            </p>
            <p>
              {" "}
              <span className="text-white font-semibold">
                {selectedDoc.name}
              </span>
              ?
            </p>

            <div className="flex justify-between mt-6 gap-4">
              <Button
                onClick={() => setShowDeleteModal(false)}
                className="px-6 py-2 rounded border border-white/20 text-white/80 hover:bg-white/10 transition"
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                className="px-6 py-2 rounded bg-red-500 text-white hover:bg-red-600 transition"
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {previewUrl && (
        <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4">
          <div className="relative bg-black rounded-xl w-[90%] max-w-3xl h-full overflow-auto  py-6 scrollbar-none">
            <button
              onClick={closePreview}
              className="absolute top-3 right-3 text-white hover:text-red-400 z-20"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>

            {previewType === "image" ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-auto h-full object-contain block mx-auto"
              />
            ) : (
              <iframe
                src={previewUrl}
                className="w-full h-full bg-white"
                title="PDF Preview"
              />
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
