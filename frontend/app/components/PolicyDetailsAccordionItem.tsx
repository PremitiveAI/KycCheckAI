"use client";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function ExpandableCard({ children }: any) {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full max-w-5xl mx-auto bg-gradient-to-r from-purple-900/90 to-purple-900/40
        rounded-xl p-6 text-white shadow-lg border border-purple-700/40">

      {/* Arrow (Header) */}
      <div
        onClick={() => setOpen(!open)}
        className="flex justify-end items-center cursor-pointer select-none"
      >
        <ChevronDown
          className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          size={28}
        />
      </div>

      {/* Expandable Body */}
      {open && (
        <div className="mt-4 transition-all duration-300">
          {children}
        </div>
      )}
    </div>
  );
}
