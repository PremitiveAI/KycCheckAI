"use client";

import { useState } from "react";
import { EyeIcon, ArrowDownTrayIcon, PencilIcon } from "@heroicons/react/24/outline";
import { DashboardLayout } from '../../(main)/dashboard/DashboardLayout';
import { Button } from "../../components/button";
import Toast from "@/app/components/toast"; 
import { Loader} from "@/app/components/loader";
interface PdfReference {
  filename: string;
  file_hash: string;
  size: number;
  download_url: string;
}

interface Policy {
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
  additional_info?: Record<string, string>;
  pdf_reference?: PdfReference;
}

export default function UploadFile() {
  // --- State Declarations ---
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showData, setShowData] = useState(false);
  const [policyResults, setPolicyResults] = useState<Policy | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const showToast = (message: string, type: "success" | "error") => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3000);
  };


  const handleUpload = async () => {
    if (!file) {
      showToast("Please select a file first", "error");
      return;
    }

    try {
      setLoading(true);
      setShowData(false);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (data) {
        setPolicyResults(data); // store single object
        setUploadSuccess(true);
        setShowData(true);
        showToast("File uploaded successfully", "success");
      }
    } catch (error) {
      console.error(error);
      showToast("Server error during upload", "error");
      setUploadSuccess(false);
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

  return (
      <DashboardLayout>
       <div className="h-full overflow-y-auto scrollbar-hide" >
        {loading && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <Loader size="lg" />
          </div>
        )}
  
        {toastMessage && <Toast message={toastMessage} type={toastType} />}
        <div className="flex flex-col text-center scrollbar-hide h-full max-h-full">
          <h2 className="text-2xl text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-6 px-2 py-4 sm:px-4 sm:py-6 md:px-8 md:py-10 lg:px-12 lg:py-14">
            <span>📁</span> Upload File Here
          </h2>
  
          {/* This container ensures the upload area is centered and takes appropriate space */}
          <div className="flex flex-col items-center justify-start flex-grow">
            {/* File Drop Area / Input */}
            <label
              htmlFor="fileUpload"
              className={`cursor-pointer border-2 border-dashed rounded-xl w-full max-w-xl h-50 flex flex-col items-center justify-center transition px-2 py-4 sm:px-4 sm:py-6 md:px-8 md:py-10 lg:px-12 lg:py-14
                ${isDragging ? "bg-gray-700 border-purple-400" : "border-gray-500 text-gray-300 hover:bg-gray-800"}`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const droppedFile = e.dataTransfer.files?.[0];
                if (droppedFile) {
                const allowedTypes = [
                  "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                ];
                if (!allowedTypes.includes(droppedFile.type)) {
                  showToast("Only PDF and Word files are allowed", "error");
                  return;
                }
                setFile(droppedFile);
                setUploadSuccess(false);
              }
              }}
            >
              {!loading && <span className="text-6xl text-purple-400">{uploadSuccess ? "✅" : "⬆️"}</span>}
              <span className="text-lg font-semibold text-white mt-2">
                {loading
                  ? "Uploading..."
                  : uploadSuccess
                    ? "File uploaded successfully 🎉"
                    : isDragging
                      ? "Drop file here"
                      : "Click or drag a file here"}
              </span>
              <span className="text-sm text-gray-200 mt-1">
                (PDF, DOC, DOCX only)
              </span>
            </label>
  
            {/* Hidden File Input */}
            <input
              id="fileUpload"
              type="file"
              className="hidden"
              multiple={false}
              accept=".pdf, .doc, .docx"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setUploadSuccess(false);
              }}
            />
  
            {/* Selected File Display and Upload Button */}
            {!uploadSuccess && file && !loading && (
              <>
                <p className={`mt-4 font-medium ${uploadSuccess ? 'text-green-400' : 'text-red-400'}`}>
                  Selected File: **{file.name}**
                </p>
  
                <Button
                  onClick={() => {
                    handleUpload();
                  }}
                >
                  Uploade file
                </Button>
              </>
            )}

            {/* Display API Response */}
          {uploadSuccess && showData && policyResults && (
            <div
              className="relative z-10 scrollbar-hide max-h-[70vh] mb-8 mt-10"
            >
              <div className="space-y-6 mb-8">
                <div className="bg-white/10 backdrop-blur-xl shadow-xl rounded-xl border border-white/20 text-white overflow-hidden">
                  {/* HEADER */}
                  <div className="w-full p-4 text-left bg-white/5">
                    <h2 className="text-xl font-semibold text-white">
                      {policyResults.policy_name || "No Name"}
                    </h2>
                  </div>

                  {/* BODY */}
                  <div className="px-6 pb-6 pt-4 text-gray-300 text-sm space-y-3 text-left">
                    <p>
                      <span className="text-white font-semibold">Type:</span> {policyResults.policy_type || "N/A"}
                    </p>
                    {policyResults.coverage_details && (
                      <p>
                        <span className="text-white font-semibold">Coverage:</span> {policyResults.coverage_details}
                      </p>
                    )}
                    {policyResults.exclusions && (
                      <p>
                        <span className="text-white font-semibold">Exclusions:</span> {policyResults.exclusions}
                      </p>
                    )}
                    {policyResults.claim_process && (
                      <p>
                        <span className="text-white font-semibold">Claim:</span> {policyResults.claim_process}
                      </p>
                    )}
                    {policyResults.renewal_terms && (
                      <p>
                        <span className="text-white font-semibold">Renewal:</span> {policyResults.renewal_terms}
                      </p>
                    )}
                    {policyResults.cancellation_rules && (
                      <p>
                        <span className="text-white font-semibold">Cancellation:</span> {policyResults.cancellation_rules}
                      </p>
                    )}
                    {policyResults.grace_period && (
                      <p>
                        <span className="text-white font-semibold">Grace:</span> {policyResults.grace_period}
                      </p>
                    )}
                    {policyResults.waiting_period && (
                      <p>
                        <span className="text-white font-semibold">Waiting:</span> {policyResults.waiting_period}
                      </p>
                    )}
                    {policyResults.legal_disclaimer && (
                      <p className="text-gray-400 text-sm pt-2">
                        <span className="text-white font-semibold">Disclaimer:</span> {policyResults.legal_disclaimer}
                      </p>
                    )}

                    {policyResults.additional_info && (
                                 <div className="pt-2">
                                   <h3 className="text-white font-semibold">Additional Info:</h3>
                                   <ul className="list-disc ml-5 space-y-1">
                                     {Object.entries(policyResults.additional_info).map(
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
                        onClick={() => downloadPdf(policyResults?.pdf_reference?.file_hash!, policyResults?.pdf_reference?.filename!)}
                        className="flex items-center space-x-1 text-purple-300 hover:text-purple-200"
                      >
                        <ArrowDownTrayIcon className="w-5 h-5" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>
      </div>
      </div>
      </DashboardLayout>
    );
}
