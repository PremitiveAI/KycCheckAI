"use client";

import React, { useState, useEffect } from "react";

import { useRouter, usePathname } from "next/navigation";
import { Menu, LayoutDashboard, FileText, Settings, LogOut, BarChart, Search } from "lucide-react";
import { Button } from "@/app/components/button";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const capitalize = (name: string) =>
    name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const cookieString = document.cookie;
    const match = cookieString.match(/(?:^|;\s*)username=([^;]+)/);

    if (match && match[1]) {
      setUsername(decodeURIComponent(match[1]));
    }
  }, []);

  const menuItems = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      path: "/dashboard",
    },
    {
      icon: BarChart,
      label: "Analytics",
      path: "/Analytics",
    },
    {
      icon: FileText,
      label: "Policies",
      path: "/policies",
      children: [
        { label: "Upload File", path: "/upload-file" },
        { label: "History", path: "/policy-list" },
        { label: "Search", path: "/search" }
      ],
    },
    {
      icon: FileText,
      label: "Employee",
      path: "/employees",
      children: [
        { label: "Add Employee", path: "/employee/create-employee" },
        { label: "Upload Documents", path: "/employee/upload-employee-doc" },
        { label: "Employee List", path: "/employee/employee-list" },
        { label: "Search Documents", path: "/employee/search-employee-doc" }
      ],
    },

    {
      icon: FileText,
      label: "Real Estate",
      path: "/real-estate",
      children: [
        { label: "Upload File", path: "/upload-excel" },
        { label: "Search", path: "/search-excel" }
      ],

    },
    {
      icon: FileText,
      label: "KYC",
      path: "/kyc",
      children: [
        { label: "Upload document", path: "/upload-document" },
        { label: "History", path: "/document-history" },
        { label: "Search", path: "/search-document" }
      ],

    },
    {
      icon: Search,
      label: "Search",
      path: "/chainlit/search",
    },
    {
      icon: Settings,
      label: "Setting",
      path: "/settings",
      children: [

        { label: "Profile Update", path: "/profile-update" },
        { label: "Generate Auth", path: "/generate-auth" },

      ],
    },
  ];

  // Auto-open menu if any child is active
  useEffect(() => {
    menuItems.forEach((item) => {
      if (item.children?.some((child) => pathname === child.path)) {
        setOpenMenu(item.label);
      }
    });
  }, [pathname]);

  const handleLogout = async () => {
    try {
      // 1. Call your backend logout API
      const res = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}), // your API expects a body
      });

      const data = await res.json();
      console.log("Logout Response:", data);

      if (!res.ok) {
        console.error("Logout failed:", data);
        return;
      }

      // 2. Clear any local storage data
      localStorage.removeItem("token");

      // 3. Close the popup
      setShowLogoutPopup(false);

      // 4. Redirect to home
      router.push("/home");

    } catch (error) {
      console.error("Logout error:", error);
    }
  };


  return (

    <div className="relative z-10 flex justify-center items-center w-full h-screen block px-2 py-4 sm:px-4 sm:py-6 md:px-8 md:py-10 lg:px-8 lg:py-8">

      <div className="w-full h-full bg-white/10 rounded-2xl shadow-2xl relative z-20 overflow-hidden mx-auto">
        <div className="flex h-full">

          {/* Sidebar */}
          <aside
            className={`
            absolute lg:relative left-0 top-0 h-auto w-64
            z-50 flex flex-col transition-transform duration-300
            ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
            lg:translate-x-0
          `}
          >
            <div className="flex flex-col h-full px-6 pt-6 pb-4">

              {/* User */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white text-lg font-semibold">
                  {username ? username.charAt(0).toUpperCase() : "U"}

                </div>
                <div>
                  <p className="text-white text-[16px]">{username ? capitalize(username) : "User"}</p>
                </div>
              </div>

              <div className="h-[1px] w-full bg-white/20 mb-6"></div>

              {/* Navigation */}
              <nav className="flex flex-col gap-2">
                {menuItems.map((item, idx) => {
                  const Icon = item.icon;

                  const isActiveParent =
                    pathname === item.path ||
                    item.children?.some((child) => pathname === child.path);

                  const isOpen = openMenu === item.label;

                  return (
                    <div key={idx} className="w-full">

                      {/* Parent Button */}
                      <button
                        onClick={() => {
                          if (item.children) {
                            setOpenMenu(isOpen ? null : item.label);
                          } else {
                            router.push(item.path);
                            setOpenMenu(null);
                          }
                        }}
                        className={`
                        w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm transition-all
                        ${isActiveParent
                            ? "bg-purple-700/50 text-white shadow-md"
                            : "text-purple-200 hover:bg-purple-700/30 hover:text-white"
                          }
                      `}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5" />
                          {item.label}
                        </div>
                      </button>

                      {/* Child Menu */}
                      {isOpen && item.children && (
                        <div className="ml-10 mt-1 flex flex-col gap-1">
                          {item.children.map((child, cIdx) => {
                            const isActiveChild = pathname === child.path;

                            return (
                              <button
                                key={cIdx}
                                onClick={() => router.push(child.path)}
                                className={`
                                text-left px-2 py-2 rounded-md text-sm transition-all
                                ${isActiveChild
                                    ? "text-white bg-purple-700/40"
                                    : "text-purple-300 hover:text-white hover:bg-purple-700/20"
                                  }
                              `}
                              >
                                • {child.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </nav>

              {/* Logout Button */}
              <button
                onClick={() => setShowLogoutPopup(true)}
                className="
                mt-auto flex items-center gap-3 px-4 py-3 rounded-lg
                text-purple-200 hover:text-white hover:bg-purple-700/30 
                transition-all">
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </aside>

          {/* Mobile Overlay */}
          <div
            onClick={() => setSidebarOpen(false)}
            className={`
            fixed inset-0 bg-black/50 backdrop-blur-sm z-40
            lg:hidden transition-all duration-300
            ${isSidebarOpen ? "opacity-100 visible" : "opacity-0 invisible"}
          `}
          />

          {/* Content */}
          <div className="flex-1 flex flex-col min-h-0"> {/* Add min-h-0 here */}

            {/* Header */}
            <header className="shrink-0 w-full flex items-center justify-between px-6 py-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
                <Menu className="w-7 h-7 text-white" />
              </button>
            </header>

            {/* Main Content - Updated Classes */}
            <main className="flex-1 mx-6 mb-2 overflow-hidden rounded-xl border border-white/20 bg-purple-900/40 backdrop-blur-md flex flex-col">
              {/* By adding 'flex flex-col', the child (Home page) can now use 'flex-1' correctly */}
              {children}
            </main>

            {/* Footer */}
            <footer className="shrink-0 w-full flex items-center justify-center px-6 py-2">
              <p className="text-white text-center text-sm opacity-70">
                © {new Date().getFullYear()} Developed and Designed by PremitiveKey
              </p>
            </footer>
          </div>
        </div>

        {/* Logout Popup */}
        {showLogoutPopup && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999]">
            <div className="relative text-center w-auto h-auto px-10 py-10 shadow-xl rounded-xl border border-white/20 bg-purple-900/40 backdrop-blur-md">

              <button
                onClick={() => setShowLogoutPopup(false)}
                className="absolute top-3 right-3 text-white/70 hover:text-white transition"
                aria-label="Close">
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

              <h2 className="text-4xl font-bold text-white">Logout Confirmation</h2>
              <p className="text-white/60 mt-2">Are you sure you want to logout?</p>

              <div className="flex justify-between mt-6 gap-4">
                <Button onClick={() => setShowLogoutPopup(false)}>Cancel</Button>
                <Button onClick={handleLogout}>Logout</Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
