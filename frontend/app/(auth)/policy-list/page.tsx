"use client";

import { useState, useEffect } from "react";
import { EyeIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { DashboardLayout } from '../../(main)/dashboard/DashboardLayout';
import { Loader } from "@/app/components/loader";
import Toast from "@/app/components/toast";
import { Menu } from "lucide-react";

interface PolicyList {
  id?: string | null;
  policy_name?: string | null;
  policy_type?: string | null;
  policy_number?: string | null;
  filename?: string | null;
  file_hash?: string | null;
  upload_time?: string | null;
  query_url?: string | null;
  size?: number | null;
  json_size?: number | null;
  view_url?: string | null;
  download_url?: string | null;
  has_json?: boolean | null;
  has_pdf?: boolean | null;
}

interface PolicyDetail {
  query?: string | null;
  answer?: Detail | null;
}

interface Detail {
  policy_name?: string | null;
  policy_type?: string | null;
  policy_number?: string | null;
  insured_name?: string | null;
  nominee?: string | null;
  premium_amount?: number | null;
  premium_payment_frequency?: string | null;
  policy_term?: string | null;
  sum_assured?: number | null;
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

  additional_info?: {
    co_pay_clause?: string | null;
    fraudulent_claims?: string | null;
    free_look_period?: string | null;
    portability_benefits?: string | null;
  } | null;

  pdf_reference?: {
    filename?: string | null;
    file_hash?: string | null;
    size?: number | null;
    download_url?: string | null;
  } | null;

  _query_metadata?: {
    query?: string | null;
    file_hash?: string | null;
    retrieved_at?: string | null;
    source?: string | null;
  } | null;
}

export default function List() {

  const [policyList, setPolicyList] = useState<PolicyList[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeHash, setActiveHash] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [openMenu, setOpenMenu] = useState(false);

  const showToast = (message: string, type: "success" | "error") => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3000);
  };


  const safeValue = (value: any, fallback = "N/A") =>
    value !== null && value !== undefined && value !== "" ? value : fallback;

    useEffect(() => {
      const loadPolicies = async () => {
        try {
          const res = await fetch("/api/policy-list");

          if (!res.ok) {
            const text = await res.text();
            console.error("API Error Response:", text);
            return;
          }

          const data = await res.json();
          setPolicyList(data);

          if (data.length > 0) {
            setActiveHash(data[0].file_hash);
            fetchDetails(data[0].file_hash); // auto select

            console.log("filehashfilehashfilehash", data[0].file_hash)
          }
        } catch (error) {
          console.error(error);
          showToast("Failed to load policies:", "error");
        }
      };

      loadPolicies();
    }, []);

    const fetchDetails = async (fileHash: string) => {
      try {
        setLoading(true);
        setActiveHash(fileHash);

        const res = await fetch(`/api/policyDetail/${fileHash}`)

        if (!res.ok) {
          const text = await res.text();
          console.error("Detail API error:", text);
          return;
        }
        const data = await res.json();
        setSelectedPolicy(data);

      } catch (error) {
        console.error(error);
        showToast("Fetch detail failed:", "error");
      } finally {
        setLoading(false);
      }

    };

    const downloadPdf = async (fileHash: string) => {
      try {

        const res = await fetch(`/api/downloadPdf/${fileHash}`);

        if (!res.ok) {
          const text = await res.text();
          console.error("Download API error:", text);
          return;
        }

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);

        const filename = selectedPolicy?.answer?.pdf_reference?.filename || "document.pdf";

        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();

        window.URL.revokeObjectURL(url);

      } catch (error) {
        console.error(error);
        showToast("Fetch detail failed:", "error");
      } finally {
        setLoading(false);
      }
  };

  return (
    <DashboardLayout>
      {/* Full Screen Center Loader */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <Loader size="lg" />
        </div>
      )}

      {toastMessage && <Toast message={toastMessage} type={toastType} />}

      {/* MAIN FLEX WRAPPER */}
      <div className="flex flex-col lg:flex-row flex-1 h-full overflow-hidden text-white">

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden flex items-center text-white "
          onClick={() => setOpenMenu(true)}
        >

          <Menu className="w-5 h-5" />
          {/* <span>Open Policies</span> */}
        </button>

        {/* POLICY LIST */}
        <div

          className={`
          fixed top-0 left-0 h-full w-[220px]  bg-[#1F0B33]/90  lg:bg-transparent border-r border-white/20 
          flex flex-col pr-4 scrollbar-hide flex-shrink-0 z-50
          transform transition-transform duration-300
          ${openMenu ? "translate-x-0" : "-translate-x-full"}
          lg:static lg:translate-x-0 lg:w-[280px]`}>

          <div className="p-4 font-semibold text-lg text-white border-b border-white/20 flex-shrink-0">
            Your Policies
          </div>

        <div className="flex-1 overflow-y-auto pr-4 scrollbar-hide">
          {policyList?.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                fetchDetails(item.file_hash!);
                setOpenMenu(false);   // ✅ Close sidebar on mobile
              }}
              className={`w-full px-4 py-3 m-2 rounded-lg cursor-pointer transition-all
          ${activeHash === item.file_hash
                  ? "bg-purple-700/50 text-white shadow-md"
                  : "text-purple-200 hover:bg-purple-700/20 hover:text-white"
                }`}
            >
              {item.policy_name || "Unnamed Policy"}
            </div>
          ))}
        </div>
        </div>


        {/* POLICY DETAILS */}
        <div className="flex-1 p-4 lg:p-6 sm:p-4 sm:m-2 lg:m-2 mb:m-2 overflow-hidden">

          {selectedPolicy && (
            <div className="w-full h-full flex flex-col bg-white/10 pb-4 
                        backdrop-blur-xl shadow-xl rounded-xl border border-white/20 overflow-hidden">

              {/* FIXED HEADER */}
              <div className="p-4 bg-white/5 shrink-0">
                <h2 className="text-xl font-semibold text-white">
                  {safeValue(selectedPolicy?.answer?.policy_name, "No Name")}
                </h2>
              </div>

              {/* SCROLLING BODY */}
              <div className="flex-1 overflow-y-auto pt-4 px-6 pb-6 text-gray-300 text-sm 
                          leading-relaxed whitespace-pre-line overflow-wrap:break-words space-y-3 scrollbar-hide">

                {/* all your content remains SAME */}
                <p><span className="text-white font-semibold">Policy Number:</span> {safeValue(selectedPolicy?.answer?.policy_number)}</p>
                <p><span className="text-white font-semibold">Type:</span> {safeValue(selectedPolicy?.answer?.policy_type)}</p>
                <p><span className="text-white font-semibold">Insured Name:</span> {safeValue(selectedPolicy?.answer?.insured_name)}</p>
                <p><span className="text-white font-semibold">Nominee:</span> {safeValue(selectedPolicy?.answer?.nominee)}</p>
                <p><span className="text-white font-semibold">Premium Amount:</span> {safeValue(selectedPolicy?.answer?.premium_amount)}</p>

                <p><span className="text-white font-semibold">Coverage:</span> {safeValue(selectedPolicy?.answer?.coverage_details)}</p>
                <p><span className="text-white font-semibold">Exclusions:</span> {safeValue(selectedPolicy?.answer?.exclusions)}</p>
                <p><span className="text-white font-semibold">Claim Process:</span> {safeValue(selectedPolicy?.answer?.claim_process)}</p>
                <p><span className="text-white font-semibold">Renewal Terms:</span> {safeValue(selectedPolicy?.answer?.renewal_terms)}</p>
                <p><span className="text-white font-semibold">Cancellation Rules:</span> {safeValue(selectedPolicy?.answer?.cancellation_rules)}</p>
                <p><span className="text-white font-semibold">Grace Period:</span> {safeValue(selectedPolicy?.answer?.grace_period)}</p>
                <p><span className="text-white font-semibold">Waiting Period:</span> {safeValue(selectedPolicy?.answer?.waiting_period)}</p>

                <p className="text-gray-400 pt-2">
                  <span className="text-white font-semibold">Legal Disclaimer:</span>{" "}
                  {safeValue(selectedPolicy?.answer?.legal_disclaimer)}
                </p>

                <div className="pt-2">
                  <h3 className="text-white font-semibold">Additional Info:</h3>

                  {selectedPolicy?.answer?.additional_info &&
                    Object.keys(selectedPolicy.answer.additional_info).length > 0 ? (
                    <ul className="list-disc ml-5 space-y-1">
                      {Object.entries(selectedPolicy.answer.additional_info).map(
                        ([key, value], idx) => (
                          <li key={idx}>
                            <strong>{key}:</strong> {safeValue(value)}
                          </li>
                        )
                      )}
                    </ul>
                  ) : (
                    <p className="ml-5 text-gray-400">No additional information available.</p>
                  )}
                </div>

                <p><span className="text-white font-semibold">PDF File Name:</span> {safeValue(selectedPolicy?.answer?.pdf_reference?.filename)}</p>
                <p><span className="text-white font-semibold">File Size:</span> {safeValue(selectedPolicy?.answer?.pdf_reference?.size)} KB</p>

                <div className="flex space-x-6 pt-4">
                  <button className="flex items-center space-x-1 text-purple-300 hover:text-purple-200">
                    <EyeIcon className="w-5 h-5" />
                    <span>View</span>
                  </button>

                  <button
                    disabled={!selectedPolicy?.answer?.pdf_reference?.file_hash}
                    onClick={() => {
                      const hash = selectedPolicy?.answer?.pdf_reference?.file_hash;
                      if (hash) downloadPdf(hash);
                    }}

                    className="flex items-center space-x-1 text-purple-300 hover:text-purple-200 disabled:opacity-50"
                  >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                    <span>Download</span>
                  </button>
                </div>

              </div>
            </div>
          )}

        </div>
      </div>
    </DashboardLayout>

  );

}