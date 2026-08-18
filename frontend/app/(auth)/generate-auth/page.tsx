"use client";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "../../(main)/dashboard/DashboardLayout";
import { Button } from "@/app/components/button";
import { ClipboardIcon, CheckIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { useState, useEffect, useRef } from "react";
export default function GenerateAuthPage() {
  const [authValue, setAuthValue] = useState("");
  const [copied, setCopied] = useState(false);

  const [selectedMaster, setSelectedMaster] = useState("");
  const [profile, setProfile] = useState("");

  const [masterOptions, setMasterOptions] = useState<{ value: string; label: string }[]>([]);
  const [profileOptions, setProfileOptions] = useState<{ value: string; label: string }[]>([]);

  const [masterOpen, setMasterOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [profileSearchTerm, setProfileSearchTerm] = useState("");

  const masterRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const handleGenerate = () => {
    const newValue = "AUTH-" + Math.random().toString(36).substring(2, 10).toUpperCase();
    setAuthValue(newValue);
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!authValue) return;
    await navigator.clipboard.writeText(authValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (masterRef.current && !masterRef.current.contains(event.target as Node)) {
        setMasterOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch master options
useEffect(() => {
  async function fetchMasterOptions() {
    try {
      const res = await fetch("/api/feature-list", {
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
      const arr = Array.isArray(json?.data) ? json.data : [];

      setMasterOptions(
        arr.map((item: any) => ({
          value: String(item.id),
          label: item.name,
        }))
      );
    } catch (err) {
      console.error("Failed to fetch master dropdown data", err);
      setMasterOptions([]); // optional: clear options on error
    }
  }

  fetchMasterOptions();
}, []);



 // Fetch profile options
useEffect(() => {
  async function fetchProfileOptions() {
    try {
      const res = await fetch("/api/profile-feature-list", {
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
      const arr = Array.isArray(json?.data) ? json.data : [];

      setProfileOptions(
        arr.map((item: any) => ({
          value: String(item.id),
          label: item.name,
        }))
      );
    } catch (err) {
      console.error("Failed to fetch profile dropdown data", err);
      setProfileOptions([]); // optional: clear options on error
    }
  }

  fetchProfileOptions();
}, []);
  const getSelectedLabel = (value: string, options: { value: string; label: string }[]) => {
    const option = options.find(opt => opt.value === value);
    return option ? option.label : "Select";
  };

  return (
    <DashboardLayout>
      <div className="w-full px-3 sm:px-6 py-6 sm:py-8 h-full overflow-y-auto scrollbar-hide">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
              Generate Auth
            </h1>
            <p className="text-purple-200 text-sm sm:text-base">
              Generate authentication credentials for your application
            </p>
          </div>

          {/* Content Box */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-white/10 p-4 sm:p-6 lg:p-8 shadow-xl">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
                  {/* Master Dropdown - Custom */}
                  <div ref={masterRef}>
                  <label className="block text-white text-sm sm:text-base font-medium mb-2">
                    Organization Master
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setMasterOpen(!masterOpen)}
                      className="w-full px-4 py-2.5 sm:py-3 pr-10 rounded-xl bg-white/10 border border-white/20 text-white outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all cursor-pointer text-left"
                    >
                      <span className={selectedMaster ? "" : "text-purple-300/50"}>
                        {selectedMaster ? getSelectedLabel(selectedMaster, masterOptions) : "Select Master"}
                      </span>
                    </button>
                    <ChevronDownIcon
                      className={`absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white pointer-events-none transition-transform ${
                        masterOpen ? "rotate-180" : ""
                      }`}
                    />

                    {masterOpen && (
                      <div className="absolute z-50 w-full mt-2 bg-purple-900 border border-white/20 rounded-xl shadow-2xl max-h-60 overflow-y-auto scrollbar-hide">
                        {/* 🔎 Search box */}
                        <div className="p-2 border-b border-white/20">
                          <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 rounded-md bg-purple-800 text-white text-sm outline-none placeholder-purple-300/50"
                          />
                        </div>

                        {/* Options */}
                        {masterOptions.length === 0 ? (
                          <div className="px-4 py-3 text-purple-300/50 text-sm">Loading...</div>
                        ) : (
                          masterOptions
                            .filter((opt) =>
                              opt.label.toLowerCase().includes(searchTerm.toLowerCase())
                            )
                            .map((opt) => (
                              <div
                                key={opt.value}
                                onClick={() => {
                                  setSelectedMaster(opt.value);
                                  setMasterOpen(false);
                                  setSearchTerm(""); // clear search after selection
                                }}
                                className={`px-4 py-3 cursor-pointer transition-colors ${
                                  selectedMaster === opt.value
                                    ? "bg-purple-700 text-white"
                                    : "text-white hover:bg-purple-800"
                                }`}
                              >
                                {opt.label}
                              </div>
                            ))
                        )}
                      </div>
                    )}
                  </div>
                </div>

                  {/* Profile Dropdown - Custom */}
                  <div ref={profileRef}>
                  <label className="block text-white text-sm sm:text-base font-medium mb-2">
                    Organization Profile
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setProfileOpen(!profileOpen)}
                      className="w-full px-4 py-2.5 sm:py-3 pr-10 rounded-xl bg-white/10 border border-white/20 text-white outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all cursor-pointer text-left"
                    >
                      <span className={profile ? "" : "text-purple-300/50"}>
                        {profile ? getSelectedLabel(profile, profileOptions) : "Select Profile"}
                      </span>
                    </button>
                    <ChevronDownIcon
                      className={`absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white pointer-events-none transition-transform ${
                        profileOpen ? "rotate-180" : ""
                      }`}
                    />

                    {profileOpen && (
                      <div className="absolute z-50 w-full mt-2 bg-purple-900 border border-white/20 rounded-xl shadow-2xl max-h-60 overflow-y-auto scrollbar-hide">
                        {/* 🔎 Search box */}
                        <div className="p-2 border-b border-white/20">
                          <input
                            type="text"
                            placeholder="Search..."
                            value={profileSearchTerm}
                            onChange={(e) => setProfileSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 rounded-md bg-purple-800 text-white text-sm outline-none placeholder-purple-300/50"
                          />
                        </div>

                        {/* Options */}
                        {profileOptions.length === 0 ? (
                          <div className="px-4 py-3 text-purple-300/50 text-sm">Loading...</div>
                        ) : (
                          profileOptions
                            .filter((opt) =>
                              opt.label.toLowerCase().includes(profileSearchTerm.toLowerCase())
                            )
                            .map((opt) => (
                              <div
                                key={opt.value}
                                onClick={() => {
                                  setProfile(opt.value);
                                  setProfileOpen(false);
                                  setProfileSearchTerm(""); // clear search after selection
                                }}
                                className={`px-4 py-3 cursor-pointer transition-colors ${
                                  profile === opt.value
                                    ? "bg-purple-700 text-white"
                                    : "text-white hover:bg-purple-800"
                                }`}
                              >
                                {opt.label}
                              </div>
                            ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              
                </div>

            {/* Generated Auth Key */}
            <div className="mb-6">
              <label className="block text-white text-sm sm:text-base font-medium mb-2">
                Generated Auth Key
              </label>
              <div className="relative">
                <div className="w-full px-4 py-3 sm:py-4 pr-12 rounded-xl bg-white/10 border border-white/20 text-white  flex items-center">
                  <span className="break-all text-sm sm:text-base font-mono">
                    {authValue || (
                      <span className="text-purple-300/50">
                        Click "Generate" to create a new key
                      </span>
                    )}
                  </span>
                </div>
                <button
                  onClick={handleCopy}
                  disabled={!authValue}
                  className={`absolute top-1/2 -translate-y-1/2 right-3 p-2 rounded-lg transition-all ${
                    authValue 
                      ? "hover:bg-white/10 cursor-pointer" 
                      : "opacity-30 cursor-not-allowed"
                  }`}
                  aria-label="Copy to clipboard"
                  title={authValue ? "Copy to clipboard" : "Generate auth key first"}
                >
                  {copied ? (
                    <CheckIcon className="h-5 w-5 sm:h-6 sm:w-6 text-purple-300" />
                  ) : (
                    <ClipboardIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  )}
                </button>
              </div>
              {copied && (
                <p className="mt-2 text-sm text-purple-300 font-medium">
                  ✓ Copied to clipboard!
                </p>
              )}
            </div>

            {/* Generate Button */}
            <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
              <Button 
                onClick={handleGenerate} 
                className="w-full sm:w-auto px-8 py-3 text-base font-semibold"
              >
                Generate
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}