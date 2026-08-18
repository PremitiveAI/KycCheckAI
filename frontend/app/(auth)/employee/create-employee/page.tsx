"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from '@/app/(main)/dashboard/DashboardLayout';
import { Button } from "@/app/components/button";
import Toast from "@/app/components/toast"
import { Loader } from "@/app/components/loader";

export default function AddEmployee() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [nameError, setNameError] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [loading, setLoading] = useState(false);

  const showToast = (message: string, type: "success" | "error") => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const validateEmployee = () => {
    let valid = true;

    setNameError("");

    if (!name.trim()) {
      setNameError("Employee name is required");
      valid = false;
    } else if (name.trim().length < 3) {
      setNameError("Name must be at least 3 characters");
      valid = false;
    }

    return valid;
  };

  const handleAddEmployee = async () => {
    if (!validateEmployee()) return;

    try {
      setLoading(true);
      const res = await fetch("/api/employee/create-employee", {
        method: "POST",
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          emp_name: name,
          emp_id: employeeId
        }),
      });

      const data = await res.json();

      const id = data?.Success?.data?.id;
      if (res.ok) {
        const message = data?.Success?.message || "Employee added successfully!";
        showToast(message, "success");
        setName("");
        router.push(`/employee/upload-employee-doc?id=${encodeURIComponent(id)}`)
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

  return (
    <DashboardLayout>
      <div className="h-full w-full flex flex-col overflow-y-auto scrollbar-hide px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {loading && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <Loader size="lg" />
          </div>
        )}

        {toastMessage && <Toast message={toastMessage} type={toastType} />}

        <div className="max-w-5xl w-full mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
              Create Employee
            </h2>
            <p className="text-purple-200 text-sm sm:text-base">
              Enter employee details to get started
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-white/10 p-4 sm:p-6 lg:p-8 shadow-xl">

            {/* Employee Name */}

            <label className="text-white text-sm sm:text-base">Employee Name</label>
            <span className=" text-red-400 text-xs ml-2">*</span>
            <input
              type="text"
              placeholder="Enter Employee Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full mt-2 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white outline-none transition-all
        focus:ring-2 focus:ring-purple-500`}
            />
            {nameError && (
              <p className="text-red-400 text-sm mt-1">{nameError}</p>
            )}
            <div className="mt-6">
              <label className="text-white text-sm sm:text-base">Employee ID</label>
              <input
                type="text"
                placeholder="Enter Employee Id"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className={`w-full mt-2 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white outline-none transition-all
        focus:ring-2 focus:ring-purple-500`}
              />
            </div>
            <p className="mt-1 text-sm text-white/60">
              Auto-generated but editable. Must be unique
            </p>

            <div className="flex gap-4 mt-8 justify-center-safe lg:col-span-2">
              <Button onClick={handleAddEmployee} disabled={loading}>Create</Button>
            </div>

          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
