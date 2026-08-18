"use client";

import { useState } from "react";
import { DashboardLayout } from "../../(main)/dashboard/DashboardLayout";
import { Button } from "../../components/button";

import { Loader } from "@/app/components/loader";

import Toast from "@/app/components/toast";

export default function UploadFile() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
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

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload-excel", { method: "POST", body: formData });
      const data = await res.json();

      if (data) {
        setUploadSuccess(true);
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
        <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-6 px-2 py-4 sm:px-4 sm:py-6 md:px-8 md:py-10 lg:px-12 lg:py-14">
          <span>📁</span> Upload File Here
        </h2>

        {/* This container ensures the upload area is centered and takes appropriate space */}
        <div className="flex flex-col items-center justify-start grow">
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
              (Excel .xls, .xlsx files only)
            </span>
          </label>

          {/* Hidden File Input */}
          <input
            id="fileUpload"
            type="file"
            className="hidden"
            multiple={false}
            accept=".xls,.xlsx"
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
        </div>
    </div>
    </div>
    </DashboardLayout>
  );
}
