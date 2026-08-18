"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "../../(main)/dashboard/DashboardLayout";
import { Button } from "@/app/components/button";
import { useRouter } from "next/navigation";

export default function Setting() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    companyName: "",
    mobile: "",
    email: "",
    address: "",
    country: "",
    state: "",
    city: "",
    pincode: "",
    gst: "",
    pan: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [loading, setLoading] = useState(false);

  const showToast = (message: string, type: "success" | "error") => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleChange = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: "" }));
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};

    if (!form.name.trim() || form.name.length < 3) e.name = "Name must be at least 3 characters";
    if (!form.companyName.trim() || form.companyName.length < 3) e.companyName = "Company name must be at least 3 characters";
    if (!/^[6-9]\d{9}$/.test(form.mobile)) e.mobile = "Enter a valid 10-digit mobile number";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address";
    if (!form.address.trim()) e.address = "Address is required";
    if (!form.country.trim()) e.country = "Country is required";
    if (!form.state.trim()) e.state = "State is required";
    if (!form.city.trim()) e.city = "City is required";
    if (!/^\d{6}$/.test(form.pincode)) e.pincode = "Enter a valid 6-digit pincode";
    if (form.gst && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(form.gst))
      e.gst = "Enter a valid GST number";
    if (form.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(form.pan))
      e.pan = "Enter a valid PAN number";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      const res = await fetch("/api/profile-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, username: form.name })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update profile");

      showToast("Profile updated successfully", "success");
      router.push("/dashboard");
    } catch (err) {
      showToast((err as Error).message || "An error occurred.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/get-user");
      const data = await res.json();
      const user = data?.Success?.data;
      if (!user) return;

      setForm({
        name: user.username ?? "",
        email: user.email ?? "",
        mobile: user.mobile ?? "",
        companyName: user.companyName ?? "",
        address: user.address ?? "",
        country: user.country ?? "",
        state: user.state ?? "",
        city: user.city ?? "",
        pincode: user.pincode ?? "",
        gst: user.gst ?? "",
        pan: user.pan ?? ""
      });
    } catch (err) {
      console.error("❌ Failed to fetch profile", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  return (
    <DashboardLayout>
      <div className="h-full w-full flex flex-col overflow-y-auto scrollbar-hide px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
          Profile Update
        </h1>

        <div className="max-w-5xl w-full mx-auto">
          {/* Header */}
          <div className="mb-6 mt-4 sm:mt-6 sm:mb-8">
            <h3 className="text-xl sm:text-1xl lg:text-2xl font-bold text-white mb-2">
              Profile Details
            </h3>
            <p className="text-purple-200 text-sm sm:text-base">
              Update your account information and preferences
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-white/10 p-4 sm:p-6 lg:p-8 shadow-xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

              {/* Full Name */}
              <div>
                <label className="text-white text-sm sm:text-base">Full Name</label>
                <span className=" text-red-400 text-xs ml-2">*</span>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="w-full mt-2 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white outline-none transition-all
                  truncate sm:whitespace-normal focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="text-white text-sm sm:text-base">Email</label>
                <span className=" text-red-400 text-xs ml-2">*</span>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="w-full mt-2 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white outline-none transition-all
                  truncate sm:whitespace-normal focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
              </div>

              {/* Mobile */}
              <div className="mt-6">
                <label className="text-white text-sm sm:text-base">Mobile Number</label>
                <span className=" text-red-400 text-xs ml-2">*</span>
                <input
                  type="tel"
                  placeholder="Enter your mobile number"
                  value={form.mobile}
                  onChange={(e) => handleChange("mobile", e.target.value)}
                  className="w-full mt-2 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white outline-none transition-all
                  truncate sm:whitespace-normal focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {errors.mobile && <p className="text-red-400 text-sm mt-1">{errors.mobile}</p>}
              </div>

            </div>
          </div>
        </div>

        {/* Organization Details */}
        <div className="max-w-5xl w-full mx-auto">
          <div className="mb-6 mt-4 sm:mt-6 sm:mb-8">
            <h3 className="text-xl sm:text-1xl lg:text-2xl font-bold text-white mb-2">
              Organization Details
            </h3>
            <p className="text-purple-200 text-sm sm:text-base">
              Update Organization information and preferences
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-white/10 p-4 sm:p-6 lg:p-8 shadow-xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

              {/* Organization Name */}
              <div>
                <label className="text-white text-sm sm:text-base">Organization Name</label>
                <span className=" text-red-400 text-xs ml-2">*</span>
                <input
                  type="text"
                  placeholder="Enter organization name"
                  value={form.companyName}
                  onChange={(e) => handleChange("companyName", e.target.value)}
                  className="w-full mt-2 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white outline-none transition-all
                  truncate sm:whitespace-normal focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {errors.companyName && <p className="text-red-400 text-sm mt-1">{errors.companyName}</p>}
              </div>

              {/* Address */}
              <div>
                <label className="text-white text-sm sm:text-base">Address</label>
                <span className=" text-red-400 text-xs ml-2">*</span>
                <input
                  type="text"
                  placeholder="Enter address"
                  value={form.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  className="w-full mt-2 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white outline-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {errors.address && <p className="text-red-400 text-sm mt-1">{errors.address}</p>}
              </div>

              {/* Country */}
              <div className="mt-6">
                <label className="text-white text-sm sm:text-base">Country</label>
                <span className=" text-red-400 text-xs ml-2">*</span>
                <input
                  type="text"
                  placeholder="Enter country"
                  value={form.country}
                  onChange={(e) => handleChange("country", e.target.value)}
                  className="w-full mt-2 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white outline-none transition-all
                  truncate sm:whitespace-normal focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {errors.country && <p className="text-red-400 text-sm mt-1">{errors.country}</p>}
              </div>

              {/* State */}
              <div className="mt-6">
                <label className="text-white text-sm sm:text-base">State</label>
                <span className=" text-red-400 text-xs ml-2">*</span>
                <input
                  type="text"
                  placeholder="Enter state"
                  value={form.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                  className="w-full mt-2 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white outline-none transition-all
                  truncate sm:whitespace-normal focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {errors.state && <p className="text-red-400 text-sm mt-1">{errors.state}</p>}
              </div>

              {/* City */}
              <div className="mt-6">
                <label className="text-white text-sm sm:text-base">City</label>
                <span className=" text-red-400 text-xs ml-2">*</span>
                <input
                  type="text"
                  placeholder="Enter city"
                  value={form.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  className="w-full mt-2 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white outline-none transition-all
                  truncate sm:whitespace-normal focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {errors.city && <p className="text-red-400 text-sm mt-1">{errors.city}</p>}
              </div>

              {/* Pincode */}
              <div className="mt-6">
                <label className="text-white text-sm sm:text-base">Pincode</label>
                <span className=" text-red-400 text-xs ml-2">*</span>
                <input
                  type="text"
                  placeholder="Enter pincode"
                  value={form.pincode}
                  onChange={(e) => handleChange("pincode", e.target.value)}
                  className="w-full mt-2 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white outline-none transition-all
                  truncate sm:whitespace-normal focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {errors.pincode && <p className="text-red-400 text-sm mt-1">{errors.pincode}</p>}
              </div>

              {/* GST */}
              <div className="mt-6">
                <label className="text-white text-sm sm:text-base">GST Number</label>
                <span className=" text-purple-300 text-xs ml-2">(Optional)</span>
                <input
                  type="text"
                  placeholder="Enter GST number"
                  value={form.gst}
                  onChange={(e) => handleChange("gst", e.target.value.toUpperCase())}
                  className="w-full mt-2 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white outline-none transition-all
                  truncate sm:whitespace-normal focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {errors.gst && <p className="text-red-400 text-sm mt-1">{errors.gst}</p>}
              </div>

              {/* PAN */}
              <div className="mt-6">
                <label className="text-white text-sm sm:text-base">PAN Number</label>
                <span className=" text-purple-300 text-xs ml-2">(Optional)</span>
                <input
                  type="text"
                  placeholder="Enter PAN number"
                  value={form.pan}
                  onChange={(e) => handleChange("pan", e.target.value.toUpperCase())}
                  className="w-full mt-2 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white outline-none transition-all
                  truncate sm:whitespace-normal focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {errors.pan && <p className="text-red-400 text-sm mt-1">{errors.pan}</p>}
              </div>

              {/* Buttons */}
              <div className="flex gap-4 mt-8 justify-center-safe lg:col-span-2">
                <Button onClick={handleSubmit} disabled={loading}>SUBMIT</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
