"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Toast from "@/app/components/toast"; 
import { Button } from "@/app/components/button";
import { Loader } from "@/app/components/loader";

export default function GenerateOtpPage() {
  const router = useRouter();

  const [mobile, setMobile] = useState("");
  const [errors, setErrors] = useState({ mobile: "" });
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const showToast = (message: string, type: "success" | "error") => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3000);
  };


  const validate = () => {
    let valid = true;
    let newErrors = { mobile: "" };

    if (!mobile.trim()) {
      newErrors.mobile = "Mobile number is required";
      valid = false;
    } else if (!/^[6-9]\d{9}$/.test(mobile)) {
      newErrors.mobile = "Enter a valid 10-digit mobile number";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleForgotPassword = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      const res = await fetch("/api/generate-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json", "accept": "application/json" },
        body: JSON.stringify({
          mobile: mobile,
          length: 6,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast("OTP generated successfully", "success");
        router.push(`/validate-otp?mobile=${encodeURIComponent(mobile)}`);
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

        <div className="w-auto px-2 py-4 sm:px-4 sm:py-6 md:px-8 md:py-10 lg:px-12 lg:py-14 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl">

          <h2 className="text-3xl font-bold text-center text-white">
            Forgot Your Password?
          </h2>
          <p className="text-center text-gray-300 mt-2 italic">
            "Enter your mobile number to receive a verification code"
          </p>

          <div className="mt-10">
            <label className="text-white text-sm sm:text-base">Mobile Number</label>

            <input
              type="tel"
              placeholder="Enter your mobile number"
              value={mobile}
              onChange={(e) => {
                const value = e.target.value;

                const mobileRegex = /^\d*$/;

                if (!mobileRegex.test(value)) {
                  setErrors((prev) => ({
                    ...prev,
                    mobile: "Only numbers are allowed",
                  }));
                  return;
                }

                if (value.length > 10) {
                  setErrors((prev) => ({
                    ...prev,
                    mobile: "Mobile number must be 10 digits",
                  }));
                  return;
                }

                setMobile(value);

                if (errors.mobile) {
                  setErrors((prev) => ({ ...prev, mobile: "" }));
                }
              }}
              className="w-full mt-2 px-4 py-3 rounded-full bg-white/10 border border-white/20 text-white outline-none"
            />

            {errors.mobile && (
              <p className="text-red-400 text-sm mt-1">
                {errors.mobile}
              </p>
            )}
          </div>

          <div className="flex justify-end mt-4">
          </div>

          <Button 
            onClick={handleForgotPassword}
            disabled={loading}
            >
            Send OTP
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
