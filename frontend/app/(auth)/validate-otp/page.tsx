"use client";

import { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/app/components/button";
import Toast from "@/app/components/toast";
import { Loader } from "@/app/components/loader";

export default function ValidateOtpPage() {
  const router = useRouter();
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const searchParams = useSearchParams();
  const mobile = searchParams.get("mobile");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const showToast = (message: string, type: "success" | "error") => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [errors, setErrors] = useState<{ otp: string }>({ otp: "" });
  const [loading, setLoading] = useState<boolean>(false);

  const handleOtpChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const value = e.target.value.replace(/\D/g, "");
    if (!value) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // ✅ Safe focus
    if (index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }

    if (errors.otp) setErrors({ otp: "" });
  };

  const handleOtpKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace") {
      const newOtp = [...otp];

      if (newOtp[index]) {
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0 && inputRefs.current[index - 1]) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const validate = () => {
    const enteredOtp = otp.join("");

    if (enteredOtp.length !== 6) {
      setErrors({ otp: "Please enter the complete 6-digit OTP" });
      return false;
    }

    if (!/^\d{6}$/.test(enteredOtp)) {
      setErrors({ otp: "OTP must contain only numbers" });
      return false;
    }

    setErrors({ otp: "" });
    return true;
  };

  const handleVerifyOtp = async () => {
    if (!validate()) return;

    try {
    setLoading(true);
      const res = await fetch("/api/validate-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: mobile,
          otp: otp.join("")
        }),
      });

      const data = await res.json();

    if (res.ok) {
      showToast("Otp validate successful","success");
      router.push(`/change-password?mobile=${encodeURIComponent(mobile!)}`);

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
          Verify Your OTP
        </h2>
        <p className="text-center text-gray-300 mt-2 italic">
          "Enter the 6-digit code sent to your {mobile}"
        </p>

        {/* ✅ OTP BOXES */}
        <div className="mt-10 mb-4 flex justify-center gap-3">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el: HTMLInputElement | null) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(e, index)}
              onKeyDown={(e) => handleOtpKeyDown(e, index)}
              className=" w-10 h-10 text-lg sm:w-12 sm:h-12 sm:text-xl md:w-14 md:h-14 md:text-2xl
              text-center text-xl font-bold rounded-lg
              bg-white/10 border border-white/20 text-white outline-none
              focus:border-purple-400 focus:ring-2 focus:ring-purple-400"
            />
          ))}
        </div>

        {/* ✅ Error */}
        {errors.otp && (
          <p className="text-red-400 text-sm text-center">
            {errors.otp}
          </p>
        )}

        <Button
          onClick={handleVerifyOtp} 
          disabled={loading}> 
          {loading ? "Verifying..." : "Verify OTP"}
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
