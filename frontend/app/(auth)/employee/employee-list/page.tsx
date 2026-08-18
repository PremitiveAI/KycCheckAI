"use client";


import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/app/(main)/dashboard/DashboardLayout";
import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Pencil, Trash2, Search } from "lucide-react";
import Pagination from "@/app/components/pagination";
import { Loader } from "@/app/components/loader";
import Toast from "@/app/components/toast";
import { Button } from "@/app/components/button";

interface EmployeeListResponse {
  message: string;
  items: ApiEmployee[];
  pagination: {
    total_records: number;
  };
  code: number;
}

export interface ApiEmployee {
  id: string;
  emp_id: string;
  emp_name: string;
  createdAt: string;
  aadhaar: boolean;
  pan: boolean;
  qualification: boolean;
  resume: boolean;
  address_proof: boolean;
  kyc_status: boolean;
}

export interface EmployeeListRequest {
  search: string;
  filter: string;
  startDate?: string;
  endDate?: string;
  sort: "createdAt" | "emp_name" | "emp_id";
  order: "ASC" | "DESC";
  limit: number;
  offset: number;
}


/* ================= HELPERS ================= */

const DocIcon = ({ value }: { value: boolean }) =>
  value ? (
    <CheckCircle className="text-green-500 mx-auto" size={16} />
  ) : (
    <XCircle className="text-red-500 mx-auto" size={16} />
  );

interface StatusBadgeProps {
  approved: boolean;
  className?: string;
}

const StatusBadge = ({ approved, className = "" }: StatusBadgeProps) => (
  <span
    className={`inline-flex items-center justify-center rounded-full
      font-semibold whitespace-nowrap text-xs px-3 py-1
      ${approved ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}
      ${className}`}
  >
    {approved ? "Approved" : "Pending"}
  </span>
);



/* ================= PAGE ================= */

export default function EmployeeListPage() {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [employees, setEmployees] = useState<ApiEmployee[]>([]);
  const [loading, setLoading] = useState(false);

  const [initialLoading, setInitialLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const showToast = (message: string, type: "success" | "error") => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3000);
  };


  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<ApiEmployee | null>(null);
  const [sortBy, setSortBy] = useState<EmployeeListRequest["sort"]>("createdAt");
  const [sortOrder, setSortOrder] = useState<EmployeeListRequest["order"]>("DESC");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState("");
  const [renderPage, setRenderPage] = useState(1);

  const confirmDelete = (doc: ApiEmployee) => {
    setSelectedDoc(doc);
    setShowDeleteModal(true);
  };

  const fetchEmployees = async () => {
    setLoading(true);

    try {
      const payload: EmployeeListRequest = {
        search,
        filter,
        startDate: "",
        endDate: "",
        sort: sortBy,
        order: sortOrder,
        limit: rowsPerPage,
        offset: (currentPage - 1) * rowsPerPage,
      };

      const res = await fetch("/api/employee/employee-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      // HTTP error
      if (!res.ok) {
        showToast(json?.message || "Server error", "error");
        setEmployees([]);
        setTotalCount(0);
        return;
      }

      // API error (✅ FIXED HERE)
      if (json?.code !== 0) {
        showToast(json?.message || "Something went wrong", "error");
        setEmployees([]);
        setTotalCount(0);
        return;
      }

      // SUCCESS
      setEmployees(json.items ?? []);
      setTotalCount(json.pagination?.total_records ?? 0);
      setRenderPage(currentPage);

    } catch (error) {
      showToast("Network error. Please check your connection.", "error");
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };


  const handleSort = (column: EmployeeListRequest["sort"]) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "ASC" ? "DESC" : "ASC"));
    } else {
      setSortBy(column);
      setSortOrder("ASC");
    }
    setCurrentPage(1);
  };

  const handleDelete = async () => {
    if (!selectedDoc) return;
    setDeleting(true);

    try {
    const res = await fetch("/api/employee/delete-employee", {
      method: "DELETE",
      headers: {
        "employee-id": selectedDoc.id,
      },
    });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to delete document");
      }

      setEmployees((prev) =>
        prev.filter((doc) => doc.id !== selectedDoc.id)
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

  useEffect(() => {
    fetchEmployees();
  }, [currentPage, rowsPerPage, search, filter, sortBy, sortOrder]);

  const totalPages = Math.ceil(totalCount / rowsPerPage);

  return (
    <DashboardLayout>

      {initialLoading && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <Loader size="lg" />
        </div>
      )}

      {toastMessage && <Toast message={toastMessage} type={toastType} />}

      <div className="w-full h-full flex flex-col px-4">

        {/* HEADER */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <h2 className="text-2xl font-semibold text-white">
            Employee List
          </h2>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center w-full sm:w-auto">

            {/* FILTER */}
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="
              bg-[#4b2b6a] border border-white/20
              text-white text-sm rounded-full
              px-4 py-2 outline-none
              w-full sm:w-[240px]
              appearance-none
            "
            >
              <option value="" className="bg-[#4b2b6a] text-white">All</option>
              <option value="Approved" className="bg-[#4b2b6a] text-white">
                KYC Approved
              </option>
              <option value="Pending" className="bg-[#4b2b6a] text-white">
                KYC Pending
              </option>
            </select>

            {/* SEARCH */}
            <div className="relative flex items-center bg-white/10
                    border border-white/20 rounded-full px-4
                    w-full sm:w-[240px]">
              <Search size={18} className="text-gray-400" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search employee..."
                className="bg-transparent py-2 pl-3 outline-none
                   text-white placeholder:text-gray-500 w-full"
              />
            </div>

          </div>
        </div>


        {/* LOADING */}
        {/* {loading && (
          <div className="py-10 text-center text-gray-400">
            Loading employees...
          </div>
        )} */}

        {/* EMPTY STATE */}
        {!loading && employees.length === 0 && (
          <div className="py-60 text-center text-gray-400">
            No employees found
          </div>
        )}

        {/* ================= DESKTOP TABLE ================= */}
        {employees.length > 0 && (
          <div className="hidden xl:block mt-8 rounded-2xl bg-white/5 backdrop-blur-md shadow-xl overflow-hidden">
            <div className="h-[520px] overflow-y-auto scrollbar-hide">
              <table className="w-full text-base border-collapse">
                <thead className="sticky top-0 z-10 bg-gradient-to-r from-purple-900 to-indigo-900 text-white">
                  <tr className="text-center text-lg">
                    <th className="py-4 w-12">Sr.</th>
                    <th
                      onClick={() => handleSort("emp_id")}
                      className="cursor-pointer select-none hover:text-purple-300"
                    >
                      ID {sortBy === "emp_id" && (sortOrder === "ASC" ? "▲" : "▼")}
                    </th>

                    <th
                      onClick={() => handleSort("emp_name")}
                      className="cursor-pointer select-none hover:text-purple-300 text-left pl-4"
                    >
                      Employee {sortBy === "emp_name" && (sortOrder === "ASC" ? "▲" : "▼")}
                    </th>

                    <th>PAN</th>
                    <th>Aadhaar</th>
                    <th>Address</th>
                    <th>Resume</th>
                    <th>Qualification</th>
                    <th>Status</th>
                    <th className="w-32">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-white/10">
                  {employees.map((emp, index) => (
                    <tr
                      key={emp.emp_id}
                      className="h-16 text-center hover:bg-white/10 transition cursor-pointer"
                    >
                      <td className="text-gray-300 text-base">
                        {(renderPage - 1) * rowsPerPage + index + 1}
                      </td>

                      <td className="font-mono text-purple-400 text-sm">
                        {emp.emp_id}
                      </td>

                      <td className="text-left pl-4 text-white font-semibold text-lg">
                        {emp.emp_name}
                      </td>

                      <td className="text-lg"><DocIcon value={emp.pan} /></td>
                      <td className="text-lg"><DocIcon value={emp.aadhaar} /></td>
                      <td className="text-lg"><DocIcon value={emp.address_proof} /></td>
                      <td className="text-lg"><DocIcon value={emp.resume} /></td>
                      <td className="text-lg"><DocIcon value={emp.qualification} /></td>
                      <td className="px-4 py-3 border-l border-white/10">
                        <StatusBadge approved={emp.kyc_status} />
                      </td>
                      <td>
                        <div className="flex justify-center gap-4">
                          <button onClick={() => router.push(`/employee/upload-employee-doc?id=${encodeURIComponent(emp.id)}`)} className="p-2 rounded-lg hover:bg-white/10">
                            <Pencil size={18} className="text-blue-400" />
                          </button>
                          <button onClick={() => confirmDelete(emp)} className="p-2 rounded-lg hover:bg-red-500/20">
                            <Trash2 size={18} className="text-red-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= MOBILE / TABLET LIST ================= */}
        {employees.length > 0 && (
          <div className="xl:hidden overflow-y-auto scrollbar-hide  mt-6 space-y-4">
            {employees.map((emp, index) => (
              <div
                key={emp.emp_id}
                className="rounded-xl bg-white/5 border border-white/10 p-3 sm:p-4 backdrop-blur-md" >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="text-sm text-gray-400">
                      #{(renderPage - 1) * rowsPerPage + index + 1}
                    </p>
                    <p className="text-base font-semibold text-white leading-tight break-words">
                      {emp.emp_name}
                    </p>
                    <p className="text-sm font-mono text-purple-400">
                      {emp.emp_id}
                    </p>

                    <div className="mt-1">
                      <StatusBadge approved={emp.kyc_status} />
                    </div>

                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/employee/upload-employee-doc`)}
                      className="p-2 rounded-lg bg-white/10"
                    >
                      <Pencil size={16} className="text-blue-400" />
                    </button>
                    <button
                      onClick={() => confirmDelete(emp)}
                      className="p-2 rounded-lg bg-red-500/20"
                    >
                      <Trash2 size={16} className="text-red-400" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 text-center text-xs">

                  <div>
                    <p className="text-gray-400 text-[11px] leading-tight">PAN</p>
                    <DocIcon value={emp.pan} />
                  </div>
                  <div>
                    <p className="text-gray-400 text-[11px] leading-tight">Aadhaar</p>
                    <DocIcon value={emp.aadhaar} />
                  </div>
                  <div>
                    <p className="text-gray-400 text-[11px] leading-tight">Address</p>
                    <DocIcon value={emp.address_proof} />
                  </div>
                  <div>
                    <p className="text-gray-400 text-[11px] leading-tight">Resume</p>
                    <DocIcon value={emp.resume} />
                  </div>
                  <div>
                    <p className="text-gray-400 text-[11px] leading-tight">Qualification</p>
                    <DocIcon value={emp.qualification} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}


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
                Are you sure you want to delete employee
              </p>
              <p>
                {" "}
                <span className="text-white font-semibold">
                  {selectedDoc.emp_name} ?
                </span>
                ?
              </p>

              <div className="flex justify-between mt-6 gap-4">
                <Button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-6 py-2 rounded border border-white/20 text-white/80 hover:bg-white/10 transition"
                //disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-6 py-2 rounded bg-red-500 text-white hover:bg-red-600 transition"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ================= PAGINATION ================= */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          rowsPerPage={rowsPerPage}
          setCurrentPage={(p) => !loading && setCurrentPage(p)}
          setRowsPerPage={setRowsPerPage}
        />

      </div>
    </DashboardLayout>
  );
}
