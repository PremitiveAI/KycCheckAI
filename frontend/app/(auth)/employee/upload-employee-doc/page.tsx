"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/app/(main)/dashboard/DashboardLayout";
import { Button } from "@/app/components/button";
import { Loader } from "@/app/components/loader";
import Toast from "@/app/components/toast";
import { XMarkIcon, } from "@heroicons/react/24/outline";

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
  file_path: string;
  chunks: number;
}

interface User {
  id: string;
  name: string;
  employeeId: string;
}

export interface EmployeeDetailsResponse {
  Success: {
    message: string;
    data: EmployeeDetails;
  };
  Code: number;
  Error: any;
}

export interface EmployeeDetails {
  id: string;
  emp_id: string;
  emp_name: string;

  aadhaar: boolean;
  aadhaar_details?: AadhaarDetails | null;

  pan: boolean;
  pan_details?: PanDetails | null;

  qualification: boolean;
  qualification_details?: QualificationDetails | null;

  resume: boolean;
  resume_details?: ResumeDetails | null;

  address_proof: boolean;
  address_proof_details?: AddressProofDetails | null;
}

export interface AadhaarDetails {
  id: number;
  full_name: string;
  date_of_birth_or_yob: string;
  gender: string;
  aadhaar_number: string;
  address: string;
  file_path: string;
}

export interface PanDetails {
  id: number;
  pan_number: string;
  full_name: string;
  date_of_birth: string;
  father_name: string;
  file_path: string;
}

export interface QualificationDetails {
  id?: number;
  highest_qualification: string;
  institute_name: string;
  specialization: string;
  year_of_passing: string;
  file_path?: string;
}

export interface ResumeDetails {
  id?: number;
  full_name: string;
  email: string;
  mobile_number: string;
  total_experience_years: number;
  last_company: string;
  skills: string;
  file_path?: string;
}

export interface AddressProofDetails {
  id?: number;
  full_name: string;
  address: string;
  document_name: string;
  issue_date: string;
  file_path?: string;
}

const allowedTypes = [
  "application/pdf", // PDF
  "application/msword", // DOC
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
  "image/png", // PNG
  "image/jpeg", // JPG / JPEG
];


export default function DocumentUploadPage() {

  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [name, setName] = useState("");
  const [userId, setUserId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [nameError, setNameError] = useState("");
  const [selectedDocName, setSelectedDocName] = useState<string | null>(null);
  const [employeeData, setEmployeeData] = useState<EmployeeDetails | null>(null);

  const [commonFiles, setCommonFiles] = useState<File[]>([]);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<"image" | "pdf" | null>(null);

  /* ================= TOAST ================= */
  const showToast = (msg: string, type: "success" | "error") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchEmployeeDetails = async (id: string) => {
    try {
      setLoading(true);
      console.log("📡 Fetching employee docs for:", id);

      const res = await fetch(
        `/api/employee-details/${encodeURIComponent(id)}/details`
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.message || "Failed to fetch documents");
      }

      const data = json?.Success?.data;

      if (!data) {
        console.warn("⚠️ No document data found");
        return;
      }
      setName(data.emp_name ?? "")
      setEmployeeId(data.emp_id ?? "")

      setEmployeeData(data);

    } catch (error) {
      console.error("❌ FETCH ERROR:", error);
      showToast("Failed to fetch documents", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      console.log("Employee ID:", id);
      setUserId(id);
      fetchEmployeeDetails(id);
    }
  }, [id]);

  const handleEditEmployee = async () => {
    if (!selectedUser) {
      showToast("Please select employee", "error");
      return;
    }
    setNameError("");

    // Validation
    if (!name.trim()) {
      setNameError("Employee name is required");
      return;
    } else if (name.trim().length < 3) {
      setNameError("Name must be at least 3 characters");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/employee/create-employee", {
        method: "POST",
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: id,
          emp_name: name,
          emp_id: employeeId
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const message = data?.Success?.message || "Employee added successfully!";
        showToast(message, "success");
        fetchEmployeeList();
      } else {
        showToast(
          data?.Error?.message || "Something went wrong",
          "error"
        );
      }
    } catch (error) {
      showToast("Server error", "error");
    } finally {
      setLoading(false);
    }

  };

  const fetchEmployeeList = async () => {
    try {
      const payload = { limit: 200, offset: 0 };
      const res = await fetch("/api/employee/employee-list", {
        method: "POST",
        headers: { "Content-Type": "application/json", accept: "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Request failed");

      const json = await res.json();
      const items = Array.isArray(json?.items) ? json.items : [];

      const mappedUsers = items.map((item: any) => ({
        id: item.id,
        name: item.emp_name,
        employeeId: item.emp_id,
      }));

      setUsers(mappedUsers);

      // ✅ Check if id is in searchParams and set selected employee
      const id = searchParams.get("id");
      if (id) {
        const matchedUser = mappedUsers.find((u: any) => u.id === id || u.employeeId === id);
        if (matchedUser) setSelectedUser(matchedUser);
      }
    } catch (error) {
      console.error("Failed to fetch employees", error);
      // showToast("Failed to load employees", "error"); // Uncomment if you have showToast
    }
  };

  useEffect(() => {
    fetchEmployeeList();
  }, [searchParams]);


  const handleEmployeeSelect = (user: User) => {
    setSelectedUser(user);
    setCommonFiles([]);
    setUploadSuccess(false);
    setOpen(false);
    setSearch("");
    setUserId(user.id);
    fetchEmployeeDetails(user.id);
  };

  const handleFileUpload = async () => {
    if (!selectedUser) {
      showToast("Please select employee", "error");
      return;
    }

    if (!commonFiles) {
      showToast("Please select a file first", "error");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      commonFiles.forEach((f) => formData.append("files", f));

      const res = await fetch(`/api/employee/employee-upload?employee_id=${encodeURIComponent(userId)}`, {
        method: "POST",
        body: formData,
      });

      const data: UploadResponse = await res.json();

      if (data?.Success?.data) {
        setCommonFiles([]);
        fetchEmployeeDetails(userId);
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

  /* ================= REMOVE ================= */
  const handleRemove = async (docId: number) => {
    if (!selectedUser) return;

    await fetch(`/api/employee-document/${docId}`, {
      method: "DELETE",
    });

    fetchEmployeeDetails(selectedUser.id);
  };

  const mergeFilesByName = (existing: File[], incoming: File[]) => {
    const map = new Map<string, File>();

    // existing first
    existing.forEach((file) => {
      map.set(file.name, file);
    });

    // incoming replaces if same name
    incoming.forEach((file) => {
      map.set(file.name, file);
    });

    return Array.from(map.values());
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

  {/* ================= DEBUG PANEL ================= */ }
  <div className="mt-4 p-3 rounded-lg bg-black/40 text-xs text-white space-y-1">
    <div>open: {String(open)}</div>
    <div>selectedUser: {selectedUser ? "YES" : "NO"}</div>
    <div>selected emp_id: {selectedUser?.employeeId ?? "—"}</div>
    {/* <div>files length: {files.length}</div> */}
  </div>

  return (
    <DashboardLayout>
      <div className="max-w-full h-full mx-auto px-4 py-6 space-y-6 overflow-y-auto scrollbar-hide">

        {loading && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <Loader size="lg" />
          </div>
        )}

        {toastMessage && <Toast message={toastMessage} type={toastType} />}

        {/* ================= HEADER ================= */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ">
          <h1 className="text-2xl font-bold text-white">
            Employee Details
          </h1>

          {/* Search Employee (Moved Here) */}
          <div className="relative w-full sm:w-72 items-center bg-white/10 border border-white/20 rounded-full">
            <button
              onClick={() => setOpen(!open)}
              className="bg-transparent w-full flex justify-between items-center px-3 py-4
              rounded-lg text-white text-sm"
            >
              {selectedUser
                ? `${selectedUser.name} (${selectedUser.employeeId})`
                : "Search Employee"}
              <span>▾</span>
            </button>

            {open && (
              <div className="absolute z-50 w-full mt-2
                 bg-purple-900 border border-white/20 rounded-lg shadow-xl
                 max-h-64 overflow-y-auto scrollbar-hide">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search employee..."
                  className="w-full px-3 py-2 bg-purple-800 text-white text-sm
                  border-b border-white/20 outline-none"
                />
                {users
                  .filter(
                    (u) =>
                      u.name.toLowerCase().includes(search.toLowerCase()) ||
                      u.employeeId
                        .toLowerCase()
                        .includes(search.toLowerCase())
                  )
                  .map((u) => (
                    <div
                      key={u.id}
                      onClick={() => {
                        handleEmployeeSelect(u);
                      }}
                      className="px-4 py-2 cursor-pointer hover:bg-purple-800">
                      <div className="text-white text-sm">{u.name}</div>
                      <div className="text-xs text-white/60">
                        {u.employeeId}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 sm:items-end">
          {/* Employee Name */}
          <div className="w-full sm:w-1/2">
            <label className="text-white text-sm sm:text-base">Employee Name</label>
            <span className=" text-red-400 text-xs ml-2">*</span>
            <input
              type="text"
              placeholder="Enter Employee Name"
              value={name}
              onChange={(e) => { setName(e.target.value); if (nameError) setNameError(""); }}
              className={`w-full mt-2 px-4 py-3 rounded-xl bg-white/10 text-white outline-none transition-all
                 border ${nameError
                  ? "border-red-500 focus:ring-1 focus:ring-red-500"
                  : "border-white/20 focus:ring-2 focus:ring-purple-500"
                }`}
            />

          </div>

          <div className="w-full sm:w-1/4">
            <label className="text-white text-sm sm:text-base">Employee ID</label>
            <input
              type="text"
              placeholder="Enter Employee Id"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className={`w-full mt-2 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white outline-none transition-all
        focus:ring-2 focus:ring-purple-500`}
            /></div>

          <div className="w-full sm:w-auto flex justify-center sm:justify-center">
            <Button 
            onClick={handleEditEmployee} 
            className="min-w-[150px] h-[50px]">
              Edit Employee
            </Button>
          </div>
        </div>

        {/* ================= COMMON UPLOAD AREA ================= */}
        <div className="bg-purple-900/40 border border-white/20 rounded-2xl p-6 shadow-lg">
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Document Upload
              </h2>
              <p className="text-sm text-white/60">
                Upload multiple documents at once. Drag & drop or browse files.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* ---------- Drag & Drop Area ---------- */}
            <label
              htmlFor="fileUpload"
              className={`cursor-pointer border-2 border-dashed rounded-2xl w-full
      flex flex-col items-center justify-center transition-all duration-200
      px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-14
      ${isDragging
                  ? "bg-purple-800/40 border-purple-400 scale-[1.01]"
                  : "border-gray-500 text-gray-300 hover:bg-purple-900/40 hover:border-purple-500"
                }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);

                const droppedFiles = Array.from(e.dataTransfer.files);
                const validFiles = droppedFiles.filter((file) =>
                  allowedTypes.includes(file.type)
                );

                if (validFiles.length === 0) {
                  showToast(
                    "Only PNG, JPG, PDF, DOC and DOCX files are allowed",
                    "error"
                  );
                  return;
                }

                setCommonFiles((prev) => mergeFilesByName(prev, validFiles));
                setUploadSuccess(false);
              }}
            >
              <input
                id="fileUpload"
                type="file"
                multiple
                hidden
                accept=".png,.jpg,.jpeg,.pdf,.doc,.docx"
                onChange={(e) => {
                  if (!e.target.files) return;

                  const selectedFiles = Array.from(e.target.files);
                  const validFiles = selectedFiles.filter((file) =>
                    allowedTypes.includes(file.type)
                  );

                  if (validFiles.length === 0) {
                    showToast(
                      "Only PNG, JPG, PDF, DOC and DOCX files are allowed",
                      "error"
                    );
                    return;
                  }

                  setCommonFiles((prev) => mergeFilesByName(prev, validFiles));
                  setUploadSuccess(false);
                }}
              />

              {/* Icon */}
              <div className="w-12 h-12 mb-3 rounded-full bg-purple-700/30
        flex items-center justify-center text-purple-300 text-xl">
                ⬆
              </div>

              <p className="text-white font-medium text-sm">
                Drag & Drop files here
              </p>
              <p className="text-xs text-white/50 mt-1">
                or click to browse
              </p>
            </label>

            {/* ---------- Preview List ---------- */}
            <div className="bg-purple-900/30 border border-white/10 rounded-2xl p-4 h-72 flex flex-col">
              {/* Scrollable File List */}
              <div className="flex-1 overflow-y-auto scrollbar-hide space-y-2 pr-1">
                {commonFiles.length === 0 && (
                  <p className="text-xs text-white/50 text-center mt-8">
                    No files selected
                  </p>
                )}

                {commonFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between
            bg-purple-900/50 border border-white/10
            rounded-lg px-3 py-2 hover:border-purple-500/40 transition"
                  >
                    <span
                      className="text-xs text-white truncate pr-2"
                      title={file.name}
                    >
                      {file.name}
                    </span>

                    <button
                      onClick={() =>
                        setCommonFiles((prev) =>
                          prev.filter((_, i) => i !== idx)
                        )
                      }
                      className="text-white/60 hover:text-red-400 transition text-sm"
                      aria-label="Remove file"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              {/* Sticky Action Bar */}
              <div className="mt-3 pt-3 border-t border-white/10
        flex justify-between items-center">
                <Button
                  onClick={() => setCommonFiles([])}
                  disabled={commonFiles.length === 0}
                  className="px-4 py-1.5 hover:bg-purple-700 disabled:opacity-40 transition"
                >
                  Clear All
                </Button>

                <Button
                  onClick={handleFileUpload}
                  disabled={commonFiles.length === 0}
                  className="px-6 py-2.5 hover:bg-purple-700 disabled:opacity-40 transition"
                >
                  Upload Files
                </Button>
              </div>
            </div>
          </div>

          <p className="text-xs text-white/50 mt-4">
            Supported formats: PNG, JPG, PDF, DOC, DOCX
          </p>
        </div>

        {/* ================= MANDATORY DOCUMENTS ================= */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-white mb-4">
                Mandatory Documents
              </h2>

          {/* No employee selected */}
          {!selectedUser && (
            <div className="text-sm text-white/50 bg-purple-900/30
            border border-white/10 rounded-xl p-6 text-center">
              Select an employee to view uploaded documents
            </div>
          )}

          {/* Employee selected */}
          {selectedUser && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <DocumentCard
                docName="Aadhaar Card"
                uploaded={Boolean(employeeData?.aadhaar)}
                details={[
                  { label: "Name", value: employeeData?.aadhaar_details?.full_name ?? "N/A" },
                  { label: "Aadhaar Number", value: employeeData?.aadhaar_details?.aadhaar_number ?? "N/A" },
                  { label: "Date of Birth", value: employeeData?.aadhaar_details?.date_of_birth_or_yob ?? "N/A" },
                  { label: "Gender", value: employeeData?.aadhaar_details?.gender ?? "N/A" },
                  { label: "Address", value: employeeData?.aadhaar_details?.address ?? "N/A" },
                ]}
                onViewClick={() => employeeData?.aadhaar_details?.file_path && openPreview(employeeData.aadhaar_details.file_path)}
                onRemoveClick={() => {
                  setSelectedDocName("Aadhaar Card");
                  setShowDeleteModal(true);
                }}
              />

              <DocumentCard
                docName="PAN Card"
                uploaded={Boolean(employeeData?.pan)}
                details={[
                  { label: "Name", value: employeeData?.pan_details?.full_name ?? "N/A" },
                  { label: "PAN Number", value: employeeData?.pan_details?.pan_number ?? "N/A" },
                  { label: "Date of Birth", value: employeeData?.pan_details?.date_of_birth ?? "N/A" },
                  { label: "Father Name", value: employeeData?.pan_details?.father_name ?? "N/A" },
                ]}
                onViewClick={() => employeeData?.pan_details?.file_path && openPreview(employeeData.pan_details.file_path)}
                onRemoveClick={() => {
                  setSelectedDocName("Pan Card");
                  setShowDeleteModal(true);
                }}
              />

              <DocumentCard
                docName="Qualification"
                uploaded={Boolean(employeeData?.qualification)}
                details={[
                  { label: "Institute Name", value: employeeData?.qualification_details?.institute_name ?? "N/A" },
                  { label: "Highest Qualification", value: employeeData?.qualification_details?.highest_qualification || "N/A" },
                  { label: "Specialization", value: employeeData?.qualification_details?.specialization || "N/A" },
                  { label: "Year of Passing", value: employeeData?.qualification_details?.year_of_passing ?? "N/A" },
                ]}
                onViewClick={() => employeeData?.qualification_details?.file_path && openPreview(employeeData.qualification_details.file_path)}
                onRemoveClick={() => {
                  setSelectedDocName("Qualification");
                  setShowDeleteModal(true);
                }}
              />

              <DocumentCard
                docName="Resume"
                uploaded={Boolean(employeeData?.resume)}
                details={[
                  { label: "Name", value: employeeData?.resume_details?.full_name ?? "N/A" },
                  { label: "Email", value: employeeData?.resume_details?.email ?? "N/A" },
                  { label: "Mobile Number", value: employeeData?.resume_details?.mobile_number ?? "N/A" },
                  { label: "Total Experience", value: employeeData?.resume_details?.total_experience_years ?? "N/A" },
                  { label: "Last Company", value: employeeData?.resume_details?.last_company ?? "N/A" },
                ]}
                onViewClick={() => employeeData?.resume_details?.file_path && openPreview(employeeData.resume_details.file_path)}
                onRemoveClick={() => {
                  setSelectedDocName("Resume");
                  setShowDeleteModal(true);
                }}
              />

              <DocumentCard
                docName="Address Proof"
                uploaded={Boolean(employeeData?.address_proof)}
                details={[
                  { label: "Name", value: employeeData?.address_proof_details?.full_name ?? "N/A" },
                  { label: "Document Type", value: employeeData?.address_proof_details?.document_name ?? "N/A" },
                  { label: "Address", value: employeeData?.address_proof_details?.address ?? "N/A" },
                  { label: "Issue Date", value: employeeData?.address_proof_details?.issue_date ?? "N/A" },
                ]}
                onViewClick={() => employeeData?.address_proof_details?.file_path && openPreview(employeeData.address_proof_details.file_path)}
                onRemoveClick={() => {
                  setSelectedDocName("Address Proof");
                  setShowDeleteModal(true);
                }}
              />

            </div>
          )}
        </div>
      </div>

      {showDeleteModal && (
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
                {selectedDocName}
              </span>{" "}
              of{" "}
              <span className="text-white font-semibold">
                {name}
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
                onClick={() => setShowDeleteModal(false)}
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

type DocumentDetail = {
  label: string;
  value: string | number;
};

const DocumentCard = ({ docName, uploaded, details = [], onViewClick, onRemoveClick }:
  { docName: string; uploaded: boolean; details?: DocumentDetail[]; onViewClick?: () => void; onRemoveClick?: () => void; }) => {
  return (
    <div
      className="bg-purple-900/40 border border-white/20 rounded-2xl p-4 flex flex-col shadow-lg shadow-purple-900/30 hover:shadow-purple-900/50 transition " >
      {/* ================= Header ================= */}
      <div className="flex justify-between items-start gap-3 mb-3">
        <p className="text-white text-sm font-semibold truncate">
          {docName}
        </p>

        <span
          className={` text-[11px] px-2.5 py-0.5 rounded-full font-medium shrink-0
            ${uploaded
              ? "bg-green-500/20 text-green-400"
              : "bg-yellow-500/20 text-yellow-400"
            } `}
        >
          {uploaded ? "Uploaded" : "Missing"}
        </span>
      </div>

      {/* ================= Details ================= */}
      {uploaded && details.length > 0 && (
        <div
          className=" p-3 space-y-2 mb-2">
          {details.map((detail, index) => (
            <div
              key={index}
              className="flex items-start gap-3 text-sm"
            >
              <span className="font-semibold text-white min-w-[130px]">
                {detail.label} :
              </span>
              <span className="text-white/70 break-words leading-snug">
                {detail.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ================= Empty State ================= */}
      {!uploaded && (
        <div className="flex flex-col justify-center items-center flex-1 py-8">
          <div className="w-10 h-10 rounded-full bg-purple-700/30 flex items-center justify-center mb-2">
            📄
          </div>
          <p className="text-white/70 text-sm font-medium text-center">
            No document uploaded
          </p>
        </div>
      )}

      {/* ================= Actions ================= */}
      {uploaded && (
        <div className="flex gap-2 mt-auto pt-4 border-t border-white/10">
          <button
            onClick={onViewClick}
            className=" flex-1 py-2 rounded-lg bg-purple-700/30 text-purple-200 text-xs hover:bg-purple-700/50 transition" >
            View
          </button>

          <button
            onClick={onRemoveClick}
            className=" flex-1 py-2 rounded-lg bg-red-500/20 text-red-400 text-xs hover:bg-red-500/30 transition" >
            Remove
          </button>

        </div>
      )}
    </div>
  );
};
