"use client";

import { DashboardLayout } from "./DashboardLayout";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { Button } from "@/app/components/button";

export default function Dashboard() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);

  const capitalize = (name: string) =>
    name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

  useEffect(() => {
    const cookieString = document.cookie;
    const match = cookieString.match(/(?:^|;\s*)username=([^;]+)/);
    if (match && match[1]) setUsername(decodeURIComponent(match[1]));
  }, []);

  // Dashboard stats based on BRD requirements
  const stats = [
    { title: "Total Employees", value: "120", path: "/employee-list" },
    { title: "Completed Documents", value: "85", path: "/employee-list?status=completed" },
    { title: "Pending Documents", value: "35", path: "/employee-list?status=pending" },
    { title: "Total Documents Uploaded", value: "450", path: "/document-list" },
    { title: "Pending / Invalid Docs", value: "30", path: "/document-list?status=pending" },
  ];

  return (
    <DashboardLayout>
      <div className="w-full p-4 overflow-y-auto scrollbar-hide">

        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-purple-700 via-fuchsia-600 to-pink-500 p-5 sm:p-6 lg:p-8 shadow-2xl mb-6 sm:mb-8">
          <div className="absolute inset-0 bg-white/10" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-6">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                Welcome back, {username ? capitalize(username) : "Admin"}
              </h1>
              <p className="text-white/80 mt-1 text-sm sm:text-base">
                Manage employee onboarding efficiently
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={() => router.push("/employees")}
                className="w-full sm:w-auto mx-2 my-2 h-12 min-w-[150px] px-6 py-3 rounded-full text-[16px] font-semibold bg-white text-purple-700 shadow-lg border border-2 border-gray-400 hover:border-purple-500 hover:scale-105 transition-all duration-300 ease-in-out text-center whitespace-normal mt-4 mb-4"
              >
                Add Employee
              </button>

              <button
                onClick={() => router.push("/upload-employee-doc")}
                className="w-full sm:w-auto mx-2 my-2 h-12 min-w-[150px] px-6 py-3 rounded-full text-[16px] font-semibold text-white shadow-lg border border-2 border-white hover:border-white hover:scale-105 transition-all duration-300 ease-in-out text-center whitespace-normal mt-4 mb-4"
              >
                Upload Documents
              </button>

            </div>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {stats.map((stat) => (
            <StatCard key={stat.title} title={stat.title} value={stat.value} onClick={() => router.push(stat.path)} />
          ))}
        </div>

        {/* Recent Activity */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl">
          <h2 className="text-base sm:text-lg font-semibold mb-4 text-white">
            Recent Activity
          </h2>
          <ul className="space-y-3 text-white/80 text-xs sm:text-sm">
            <li className="flex justify-between gap-2">
              <span>✅ Employee John Doe created</span>
              <span className="whitespace-nowrap">5 min ago</span>
            </li>
            <li className="flex justify-between gap-2">
              <span>⬆️ Documents uploaded for Jane Smith</span>
              <span className="whitespace-nowrap">15 min ago</span>
            </li>
            <li className="flex justify-between gap-2">
              <span>✔️ Document validation completed</span>
              <span className="whitespace-nowrap">30 min ago</span>
            </li>
          </ul>
        </div>

      </div>
    </DashboardLayout>
  );
}

// Reusable StatCard component
const StatCard = ({ title, value, onClick }: { title: string; value: string; onClick?: () => void }) => {
  return (
    <div
      onClick={onClick}
      className="bg-gradient-to-br from-purple-700/40 to-fuchsia-600/40 backdrop-blur-md rounded-2xl p-6 shadow-md hover:scale-105 transition cursor-pointer"
    >
      <p className="text-sm text-white/70">{title}</p>
      <h3 className="text-3xl font-bold text-white mt-2">{value}</h3>
    </div>
  );
};
