"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/app/components/button";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center text-center text-sm sm:text-base overflow-hidden">

      {/* Centered content */}
      <div className="flex-1 flex flex-col justify-center items-center">
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold text-white mb-6 drop-shadow-lg">
          Welcome to Our AgenticAI
        </h1>

        <p className="text-white/90 text-lg md:text-xl lg:text-2xl mb-8 max-w-6xl drop-shadow-md">
          Streamline employee onboarding with document upload, OCR-based validation, and real-time status tracking.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 pt-4 pb-4">
          <Button onClick={() => router.push("/login")}>Login</Button>
          <Button onClick={() => router.push("/sign-up")}>Signup</Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full flex items-center justify-center px-6 py-4 mt-auto">
        <p className="text-white text-center text-lg">
          © {new Date().getFullYear()} Developed and Designed by PremitiveKey
        </p>
      </footer>

    </div>
  );
}
