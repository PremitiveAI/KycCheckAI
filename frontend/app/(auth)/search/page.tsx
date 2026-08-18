"use client";

import { useState, useEffect } from "react";
import { EyeIcon, ArrowDownTrayIcon, PencilIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { DashboardLayout } from '../../(main)/dashboard/DashboardLayout';

export interface PolicyResponse {
  query?: string | null;
  answer?: {
    query?: string | null;
    summary?: {
      total_results?: number | null;
      search_scope?: string | null;
    } | null;
    results?: PolicyDetail[] | null;
  } | null;
}

export interface PolicyDetail {
  policy_name?: string | null;
  policy_type?: string | null;
  policy_number?: string | null;
  insured_name?: string | null;
  nominee?: string | null;
  premium_amount?: string | null;
  premium_payment_frequency?: string | null;
  policy_term?: string | null;
  sum_assured?: string | null;
  coverage_details?: string | null;
  exclusions?: string | null;
  claim_process?: string | null;
  renewal_terms?: string | null;
  cancellation_rules?: string | null;
  maturity_benefits?: string | null;
  surrender_value?: string | null;
  grace_period?: string | null;
  waiting_period?: string | null;
  issue_date?: string | null;
  expiry_date?: string | null;
  agent_name?: string | null;
  agent_code?: string | null;
  company_name?: string | null;
  contact_details?: string | null;
  legal_disclaimer?: string | null;

  additional_info?: Record<string, any> | null;

  _metadata?: {
    file_hash?: string | null;
    filename?: string | null;
    policy_name?: string | null;
  } | null;

  pdf_reference?: {
    file_hash?: string | null;
    download_url?: string | null;
  } | null;
}

export default function Search() {

  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PolicyDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [isNewChat, setIsNewChat] = useState(false);
  const [noResult, setNoResult] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

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

    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Search API error:", text);
      setNoResult(true);
      return;
    }

    const data: PolicyResponse = await res.json();

    const resultList = data?.answer?.results ?? [];

    if (resultList.length === 0) {
      setNoResult(true);
      setResults([]);
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

  const downloadPdf = async (fileHash: string, pdfName: string) => {
    try {

      const res = await fetch(`/api/downloadPdf/${fileHash}`);

      if (!res.ok) {
        const text = await res.text();
        console.error("Download API error:", text);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const filename = pdfName || "document.pdf";

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Fetch download failed:", error);
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
          style={{ height: "calc(100vh - 110px)" }}
        >
          <div className="max-w-4xl mx-auto space-y-6">
            {results.map((policy, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-xl shadow-xl rounded-xl border border-white/20 text-white overflow-hidden">
                {/* HEADER – CLICK TO TOGGLE */}
                <button
                  onClick={() =>
                    setOpenIndex(openIndex === index ? null : index)
                  }
                  className="w-full flex items-center justify-between p-4 text-left bg-white/5 transition">
                  <h2 className="text-xl font-semibold">
                    {policy?.policy_name}
                  </h2>
                  <span>
                    {openIndex === index ? "Hide" : "Show"}
                  </span>
                </button>

                <div>
                  <div className="px-4 pb-2 text-gray-300 text-sm space-y-2 pt-2">

                    <p><strong>Type:</strong> {policy?.policy_type}</p>
                    {policy?.coverage_details && <p><strong>Coverage:</strong> {policy?.coverage_details}</p>}
                  </div>
                </div>

                {/* COLLAPSIBLE BODY */}
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden ${openIndex === index ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"}`}>
                  <div className="px-4 pb-6 text-gray-300 text-sm space-y-2">
                    {policy?.exclusions && <p><strong>Exclusions:</strong> {policy?.exclusions}</p>}
                    {policy?.claim_process && <p><strong>Claim:</strong> {policy?.claim_process}</p>}
                    {policy?.renewal_terms && <p><strong>Renewal:</strong> {policy?.renewal_terms}</p>}
                    {policy?.cancellation_rules && <p><strong>Cancellation:</strong> {policy?.cancellation_rules}</p>}
                    {policy?.grace_period && <p><strong>Grace:</strong> {policy?.grace_period}</p>}
                    {policy?.waiting_period && <p><strong>Waiting:</strong> {policy?.waiting_period}</p>}

                    {policy?.legal_disclaimer && (
                      <p className="text-sm text-gray-500 pt-2">
                        <strong>Disclaimer:</strong> {policy?.legal_disclaimer}
                      </p>
                    )}

                    {policy?.additional_info && (
                      <div className="pt-3">
                        <h3 className="font-semibold">Additional Info:</h3>
                        <ul className="list-disc ml-5 space-y-1">
                          {Object.entries(policy?.additional_info).map(
                            ([key, value], idx) => (
                              <li key={idx}>
                                <strong>{key}:</strong> {value}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                    {/* ACTION BUTTONS */}
                    <div className="flex space-x-6 pt-4">
                      <button className="flex items-center space-x-1 text-purple-300 hover:text-purple-200">
                        <EyeIcon className="w-5 h-5" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => downloadPdf(policy?._metadata?.file_hash!, policy?._metadata?.filename!)}
                        className="flex items-center space-x-1 text-purple-300 hover:text-purple-200"
                      >
                        <ArrowDownTrayIcon className="w-5 h-5" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
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
        className={`z-20 w-full max-w-4xl px-4 transition-all duration-500
            ${results.length === 0
            ? "absolute top-1/2 inset-x-0 mx-auto -translate-y-1/2"
            : "sticky bottom-6 inset-x-0 mx-auto"
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
    </DashboardLayout>
  );

}
