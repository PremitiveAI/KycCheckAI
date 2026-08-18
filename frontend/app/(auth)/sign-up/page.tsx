"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Toast from "@/app/components/toast"
import { Button } from "@/app/components/button";
import { Loader } from "@/app/components/loader";

export default function Signup() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [loading, setLoading] = useState(false);

  const showToast = (message: string, type: "success" | "error") => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const [errors, setErrors] = useState({
    fullName: "",
    mobile: "",
    password: "",
    email: ""
  });

  const validate = () => {
    let valid = true;
    let newErrors = { fullName: "", mobile: "", password: "", email: "" };

    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required";
      valid = false;
    } else if (fullName.length < 3) {
      newErrors.fullName = "Name must be at least 3 characters";
      valid = false;
    }

    if (!mobile.trim()) {
      newErrors.mobile = "Mobile number is required";
      valid = false;
    } else if (!/^[6-9]\d{9}$/.test(mobile)) {
      newErrors.mobile = "Enter a valid 10-digit mobile number";
      valid = false;
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
      valid = false;
    } else if (
      !/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)
    ) {
      newErrors.email = "Enter a valid email address";
      valid = false;
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
      valid = false;
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 6 characters";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSignup = async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      const res = await fetch("/api/sign-up", {
        method: "POST",
         headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: fullName,
          mobile: mobile,
          email: email,
          password: password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast("Login successful", "success");
        router.push("/login")
      } else {
        showToast(data?.message || "Something went wrong", "error");
      }
    } catch (error) {
      showToast("Server error", "error");
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

        <div className="px-2 py-4 sm:px-4 sm:py-6 md:px-8 md:py-10 lg:px-12 lg:py-14 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl">

          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center text-white">
            Signup
          </h2>
          <p className="text-center text-sm sm:text-base text-gray-300 mt-2 italic">
            "Turning Documents into Decisions.Intelligence That Works With Your Data."
          </p>

          <div className="mt-8">
            <label className="text-white text-sm sm:text-base">Full Name</label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => {
                const value = e.target.value;

                const nameRegex = /^[a-zA-Z\s]*$/;

                if (!nameRegex.test(value)) {
                  setErrors((prev) => ({
                    ...prev,
                    fullName: "Special characters and numbers are not allowed",
                  }));
                  return;
                }
                setFullName(value);
                if (errors.fullName) {
                  setErrors((prev) => ({ ...prev, fullName: "" }));
                }
              }}
              className="w-full mt-2 px-4 py-3 rounded-full bg-white/10 border border-white/20 text-white outline-none"
            />

            {errors.fullName && (
              <p className="text-red-400 text-sm mt-1">
                {errors.fullName}
              </p>
            )}
          </div>

          <div className="mt-6">
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

          <div className="mt-6">
            <label className="text-white text-sm sm:text-base">Email</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                const value = e.target.value.trim();
                setEmail(value);

                // ✅ Email validation regex
                const emailRegex =
                  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                if (!emailRegex.test(value)) {
                  setErrors((prev) => ({
                    ...prev,
                    email: "Please enter a valid email address",
                  }));
                } else {
                  if (errors.email) {
                    setErrors((prev) => ({ ...prev, email: "" }));
                  }
                }
              }}
              className="w-full mt-2 px-4 py-3 rounded-full 
    bg-white/10 border border-white/20 text-white outline-none"
            />

            {errors.email && (
              <p className="text-red-400 text-sm mt-1">
                {errors.email}
              </p>
            )}
          </div>

          <div className="mt-6 relative">
            <label className="text-white text-sm sm:text-base">Password</label>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
              }}
              className="w-full mt-2 px-4 py-3 rounded-full bg-white/10 border border-white/20 text-white outline-none pr-20"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-5 top-[50%] bottom-[50%] py-1 text-gray-400 hover:text-white"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
            {errors.password && (
              <p className="text-red-400 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          <div className="flex gap-4 mt-8">
            <Button
              onClick={handleSignup}
              disabled={loading}>
              Signup
            </Button>

            <Button
              onClick={() => router.push("/home")}>
              Cancel
            </Button>
          </div>
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
