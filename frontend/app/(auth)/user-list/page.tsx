"use client";

import { DashboardLayout } from "@/app/(main)/dashboard/DashboardLayout";
import { Button } from "@/app/components/button";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function UserListPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("/api/user-list", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
          },
          body: JSON.stringify({
            search: "",
            filter: "",
            startDate: "",
            endDate: "",
            sort: "createdAt",
            order: "DESC",
            limit: 10,
            offset: 0,
          }),
        });

        if (!res.ok) throw new Error(`HTTP error ${res.status}`);

        const json = await res.json();
        console.log("🔵 API response:", json);

        const arr = Array.isArray(json?.data) ? json.data : [];

        // ✅ Spread backend fields and add SR_NO
        setUsers(arr.map((item: any, index: number) => ({ srNo: index + 1, ...item })));
      } catch (err) {
        console.error("Failed to fetch user list", err);
        setUsers([]);
      }
    }

    fetchUsers();
  }, []);

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);

  // SORT FUNCTION
  const sortedUsers = useMemo(() => {
    let sortableData = [...users];

    if (sortConfig) {
      const { key, direction } = sortConfig;

      sortableData.sort((a, b) => {
        let aValue = a[key as keyof typeof a];
        let bValue = b[key as keyof typeof b];

        if (key === "createdAt") {
          aValue = new Date(aValue as any);
          bValue = new Date(bValue as any);
        }

        if (aValue < bValue) return direction === "asc" ? -1 : 1;
        if (aValue > bValue) return direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return sortableData;
  }, [users, sortConfig]);

  const requestSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev && prev.key === key && prev.direction === "asc") {
        return { key, direction: "desc" };
      }
      return { key, direction: "asc" };
    });
  };

  // APPLY SEARCH
  const filteredUsers = sortedUsers.filter((u) =>
    Object.values(u).some((val) =>
      String(val).toLowerCase().includes(search.toLowerCase())
    )
  );

  // PAGINATION VALUES
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  return (
    <DashboardLayout>
      {/* SEARCH + ADD BUTTON */}
      <div className="w-full flex flex-col sm:flex-row items-center gap-4 mb-4">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full mt-2 px-4 py-3 rounded-full bg-white/10 border border-white/20 text-white outline-none focus:ring-2 focus:ring-purple-500 transition-all"
        />

        <div className="w-full sm:w-auto sm:ml-auto">
          <Button onClick={() => router.push("/dashboard")} className="w-full sm:w-auto">
            Add User
          </Button>
        </div>
      </div>

      {/* TABLE */}
      <div className="my-0.1 flex-1 overflow-x-auto rounded-xl border border-white/20 bg-purple-950/40 backdrop-blur-md p-4">
        <table className="min-w-full border-collapse text-purple-100">
          <thead className="hidden md:table-header-group rounded-full">
            <tr className="rounded text-left font-large tracking-wide text-purple-200 bg-gray-100/20">
              {["SR_NO", "username", "mobile", "email", "companyName", "createdAt"].map((col) => (
                <th
                  key={col}
                  className="py-3 px-4 cursor-pointer select-none"
                  onClick={() => requestSort(col === "SR_NO" ? "srNo" : col)}
                >
                  {col}{" "}
                  {sortConfig?.key === (col === "SR_NO" ? "srNo" : col)
                    ? sortConfig.direction === "asc"
                      ? "↑"
                      : "↓"
                    : ""}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="md:table-row-group">
            {paginatedUsers.map((user, idx) => (
              <tr
                key={idx}
                className="block md:table-row mb-4 md:mb-0 border md:border-0 rounded-md md:rounded-none bg-purple-900/20 md:bg-transparent"
              >
                <td className="block md:table-cell py-3 px-4" data-label="SR NO">
                  {user.srNo}
                </td>
                <td className="block md:table-cell py-3 px-4" data-label="Username">
                  {user.username ?? "-"}
                </td>
                <td className="block md:table-cell py-3 px-4" data-label="Mobile">
                  {user.mobile ?? "-"}
                </td>
                <td className="block md:table-cell py-3 px-4" data-label="Email">
                  {user.email ?? "-"}
                </td>
                <td className="block md:table-cell py-3 px-4" data-label="Company Name">
                  {user.companyName ?? "-"}
                </td>
                <td className="block md:table-cell py-3 px-4" data-label="Created At">
                  {user.createdAt ? new Date(user.createdAt).toLocaleString() : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="my-0.1 flex justify-between items-center mt-4">
        <button
          className="px-3 py-1 border rounded-full disabled:opacity-40"
          onClick={() => setCurrentPage((p) => p - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>

        <span className="font-medium">
          Page {currentPage} of {totalPages}
        </span>

        <button
          className="px-3 py-1 border rounded-full disabled:opacity-40"
          onClick={() => setCurrentPage((p) => p + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          td:before {
            content: attr(data-label);
            font-weight: bold;
            display: inline-block;
            width: 140px;
          }
          tr {
            display: block;
            margin-bottom: 1rem;
            border: 1px solid #ddd;
            padding: 0.8rem;
            border-radius: 10px;
          }
          td {
            display: block;
            padding: 0.6rem 0;
            border: none;
          }
        }
      `}</style>
    </DashboardLayout>
  );
}
