"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Toast from "@/app/components/toast"; // <-- adjust path if needed
import { Button } from "@/app/components/button";
import { Loader } from "@/app/components/loader";
import useNetworkStatus from "@/app/hooks/useNetworkStatus";

export default function LoginPage() {
  const router = useRouter();
  const isOnline = useNetworkStatus(); 

  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const showToast = (message: string, type: "success" | "error") => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const [errors, setErrors] = useState({ mobile: "", password: "" });

  const validate = () => {
    let valid = true;
    let newErrors = { mobile: "", password: "" };

    if (!mobile.trim()) {
      newErrors.mobile = "Mobile number is required";
      valid = false;
    } else if (!/^[6-9]\d{9}$/.test(mobile)) {
      newErrors.mobile = "Enter a valid 10-digit mobile number";
      valid = false;
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
      valid = false;
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleForgotPassword = () => {
    router.push("/generate-otp");
  };

  const handleLogin = async () => {

     if (!isOnline) {
      showToast("No internet connection. Please check your network.", "error");
      return;
    }

    if (!validate()) return;

    try {
      setLoading(true);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: mobile,
          password: password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast("Login successful", "success");
        router.push("/dashboard");
      } else {
        showToast(data?.message || "Something went wrong", "error");
      }
    } catch {
      showToast("Server error", "error");
    } finally {
      setLoading(false);
    }
  };
  // ---------------------------
  // GOOGLE LOGIN HANDLER
  // ---------------------------
  const handleGoogleLogin = () => {

     if (!isOnline) {
      showToast("No internet connection. Please check your network.", "error");
      return;
    }
    window.location.href = "/api/google"; // <-- You will create this API route
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center text-sm sm:text-base overflow-hidden">
    
      {loading && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <Loader size="lg" />
            </div>
          )}

      {toastMessage && <Toast message={toastMessage} type={toastType} />}

      <div className="flex-1 flex flex-col justify-center items-center w-full">
        <div className="m-4 p-8 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl">
          <h2 className="text-3xl font-bold text-center text-white">
            Welcome to AgenticAI
          </h2>
          <p className="text-center text-gray-300 mt-2 italic">
            "Turning Documents into Decisions.Intelligence That Works With Your Data."
          </p>

          {/* GOOGLE SIGN-IN BUTTON */}
          <button
            onClick={handleGoogleLogin}
            className="w-full mt-6 flex items-center justify-center gap-2 
                       bg-white text-black rounded-full py-2 font-semibold 
                       hover:bg-gray-200 transition"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="h-5 w-5"
            />
            Continue with Google
          </button>

          <div className="relative mt-8">
            <label className="text-white">Mobile Number</label>
            <div className="relative mt-2">
              <input
                type="tel"
                placeholder="Enter your Mobile number"
                value={mobile}
                onChange={(e) => {
                  if (e.target.value.length <= 10) setMobile(e.target.value);
                  if (errors.mobile) setErrors((prev) => ({ ...prev, mobile: "" }));
                }}
                className="w-full h-12 px-4 pr-14 rounded-full
                 bg-white/10 border border-white/20 text-white outline-none
                 placeholder-gray-300 text-sm sm:text-base"
              />
            </div>
            {errors.mobile && (
              <p className="text-red-400 text-sm mt-1">{errors.mobile}</p>
            )}
          </div>

          <div className="mt-6 relative">
            <label className="text-white text-sm sm:text-base">Password</label>
            <div className="relative mt-2">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password)
                    setErrors((prev) => ({ ...prev, password: "" }));
                }}
                className="w-full h-12 px-4 pr-14 rounded-full
                 bg-white/10 border border-white/20 text-white outline-none
                 placeholder-gray-300 text-sm sm:text-base"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 mt-1
                text-gray-300 hover:text-white text-sm sm:text-base"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-400 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          <div className="flex justify-end mt-2">
            <span
              onClick={handleForgotPassword}
              className="text-sm text-purple-400 cursor-pointer hover:underline"
            >
              Forgot Password?
            </span>
          </div>

         <Button onClick={handleLogin} disabled={loading}>
            {loading ? <Loader size="sm" /> : "Login"}
          </Button>

          <p className="text-center mt-4 text-gray-300 text-sm">
            Don’t have an account?{" "}
            <span
              onClick={() => router.push("/sign-up")}
              className="text-purple-400 cursor-pointer hover:underline"
            >
              Signup
            </span>
          </p>
        </div>
      </div>

      {/* Sticky footer */}
      <footer className="w-full flex items-center justify-center px-6 py-4 mt-auto">
        <p className="text-white text-center text-lg ">
          © {new Date().getFullYear()} Developed and Designed by PremitiveKey
        </p>
      </footer>
    </div>
  );
}
