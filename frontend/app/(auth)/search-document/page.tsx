"use client";

import { useState, useEffect } from "react";
import { PencilIcon, EyeIcon, ArrowDownTrayIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { DashboardLayout } from '../../(main)/dashboard/DashboardLayout';

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

export default function Search() {

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DocDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [isNewChat, setIsNewChat] = useState(false);
  const [noResult, setNoResult] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<"image" | "pdf" | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    if (isNewChat) {
      setIsNewChat(false); // reset flag
    }
  }, [isNewChat]);

  const handleSearch = async () => {
    if (query.trim().length < 1) return;

    try {
      setLoading(true);
      setNoResult(false);

      const res = await fetch(
        `/api/search-doc?query=${encodeURIComponent(query)}`,
        { cache: "no-store" }
      );

      if (!res.ok) {
        console.error("Search API error:", await res.text());
        setNoResult(true);
        return;
      }

      const response: DocResponse = await res.json();

      // ✅ FIXED PATH
      const resultList = response.Success?.data?.results ?? [];

      if (resultList.length === 0) {
        setResults([]);
        setNoResult(true);
        return;
      }

      setResults(resultList);
      setNoResult(false);

    } catch (error) {
      console.error("Search failed:", error);
      setNoResult(true);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    setIsNewChat(true);
    setNoResult(false);
    setQuery("");
    setResults([]); // clear results
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
      <button
        onClick={handleNewChat}
        className="flex items-center space-x-4 text-purple-300 hover:text-purple-200">
        <PencilIcon className="w-5 h-5" />
        <span> New Chat</span>
      </button>

      {/* Full Screen Center Loader */}
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="flex flex-col items-center">
            <div className="animate-spin h-12 w-12 border-4 border-purple-400 border-t-transparent rounded-full"></div>
            <p className="mt-3 text-purple-400 font-semibold">Thinking...</p>
          </div>
        </div>
      )}

      {/* RESULTS + NO RESULT MESSAGE WRAPPER */}
      {results && results.length > 0 && (
        <div
          className="relative z-10 w-full overflow-y-auto scrollbar-hide p-6"
          style={{ height: "calc(70vh - 80px)" }}
        >
          <div className="max-w-4xl mx-auto space-y-6">
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

            {/* ✅ NO RESULT MESSAGE — EXACTLY BETWEEN LIST & SEARCH */}
            {noResult && !loading && (
              <h1 className="text-gray-400 text-1xl font-semibold text-center">
                No results found
              </h1>
            )}
          </div>
        </div>
      )}

      {noResult && !loading && (
        <p className="relative z-20 text-gray-400 text-3xl font-semibold text-center pt-10">
          No results found.
        </p>
      )}

      <div
        className={`z-20 w-full max-w-4xl px-4 transition-all duration-500 ${results.length === 0
            ? "absolute top-1/2 inset-x-0 mx-auto -translate-y-1/2"
            : "fixed bottom-6 left-1/2 -translate-x-1/2"
          }`}
      >

        <div className="w-full flex shadow-xl rounded-full bg-white/10 backdrop-blur-xl border border-white/20 overflow-hidden">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();   // ✅ Search only on Enter
              }
            }}
            placeholder="Search documents..."
            className="flex-grow p-4 text-lg bg-transparent text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

      </div>

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

