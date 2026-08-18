"use client";

import { useState } from "react";
import { Button } from "@/app/components/button";
import { useRouter, useSearchParams } from "next/navigation";
import Toast from "@/app/components/toast";
import { Loader } from "@/app/components/loader";

export default function ChangePassword() {
  const router = useRouter();

  const searchParams = useSearchParams();
  const mobile = searchParams.get("mobile");

  const [newpassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const showToast = (message: string, type: "success" | "error") => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3000);
  };


  const [errors, setErrors] = useState({ confirmPassword: "", newpassword: "" });

  const validate = () => {
    let valid = true;
    let newErrors = { confirmPassword: "", newpassword: "" };

    if (!newpassword.trim()) {
      newErrors.newpassword = "Password is required";
      valid = false;
    } else if (newpassword.length < 6) {
      newErrors.newpassword = "Password must be at least 6 characters";
      valid = false;
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "Password is required";
      valid = false;
    } else if (confirmPassword.length < 6) {
      newErrors.confirmPassword = "Password must be at least 6 characters";
      valid = false;
    }

    if (newpassword && confirmPassword && newpassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };


  const handleChangePassword = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/change-password", {
        method: "put",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile_number: mobile,
          confirm_password: confirmPassword,
          new_password: newpassword,
        }),
      });

      const data = await res.json();

    if (res.ok) {
      showToast("Login successful","success");
      router.push("/dashboard")
    } else {
      showToast(data?.message || "Something went wrong","error");
    }
  } catch (error) {
    showToast("Server error","error");
  } finally {
    setLoading(false);
  }
  };

  return (
      <div className="min-h-screen w-full flex flex-col items-center  text-sm sm:text-base overflow-hidden">

        {loading && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <Loader size="lg" />
            </div>
          )}
       {toastMessage && <Toast message={toastMessage} type={toastType} />}
      <div className="flex-1 flex flex-col justify-center items-center w-full">

      <div className="m-4 p-8 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl">

        <h2 className="text-3xl font-bold text-center text-white">
          Change Your Password
        </h2>
        <p className="text-center text-gray-300 mt-2 italic">
          "Create a new strong password to keep your account secure"
        </p>

  <div className="mt-6 relative">
        <label className="text-white text-sm sm:text-base">Password</label>
            <div className="relative mt-2">
              <input
                type={showNewPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={newpassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (errors.newpassword)
                    setErrors((prev) => ({ ...prev, password: "" }));
                }}
                className="w-full h-12 px-4 pr-14 rounded-full
                 bg-white/10 border border-white/20 text-white outline-none
                 placeholder-gray-300 text-sm sm:text-base"
              />

              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 mt-1
                text-gray-300 hover:text-white text-sm sm:text-base"
              >
                {showNewPassword ? "Hide" : "Show"}
              </button>
            </div>
        {errors.newpassword && (
          <p className="text-red-400 text-sm mt-1">{errors.newpassword}</p>
        )}
      </div>

        <div className="mt-6">
          <label className="text-white">Confirm Password</label>
          <div className="relative mt-2">
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Enter your new password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: "" }));
            }}
            className="w-full h-12 px-4 pr-14 rounded-full
                 bg-white/10 border border-white/20 text-white outline-none
                 placeholder-gray-300 text-sm sm:text-base"
          />

          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 mt-1
                text-gray-300 hover:text-white text-sm sm:text-base"
          >
            {showConfirmPassword ? "Hide" : "Show"}
          </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>
          )}
        </div>

      {/* Button */}
      <Button
        onClick={handleChangePassword}
        disabled={loading}
        className="mt-6" >
        Okay
      </Button>
    </div>
  </div>
   {/* Sticky footer */}
  <footer className="w-full flex items-center justify-center px-6 py-4 mt-auto">
    <p className="text-white text-center text-lg">
      © {new Date().getFullYear()} Developed and Designed by PremitiveKey
    </p>
  </footer>

    </div>
);
}
