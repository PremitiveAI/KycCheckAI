"use client";

import { useEffect, useRef, useState } from "react";
import { XCircleIcon, SendHorizontal, Search, User, FileText, CheckCircle2 } from "lucide-react";
import { DashboardLayout } from '@/app/(main)/dashboard/DashboardLayout';

type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chainlit/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMsg.content }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: formatResult(data) },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "❌ **Error connecting to the server.**" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") sendMessage();
  };

  const handleClear = () => {
    setMessages([]);
    setInput("");
  };

  return (
    <DashboardLayout>
      {/* Container restricted to available height */}
<div className="flex flex-col h-full w-full text-white font-sans overflow-hidden">        
        {/* Header - Fixed at top */}
        <header className="shrink-0 p-6 border-b border-white/10 bg-[#3B2667]">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Search className="text-purple-400" />
            <span className="tracking-tight">Global Search Assistant</span>
          </h1>
        </header>

        {/* Messages Area - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-purple-500/20">
          {messages.length === 0 && !loading && (
            <div className="h-full flex flex-col items-center justify-center opacity-30">
              <div className="p-8 rounded-full bg-white/5 mb-4 border border-white/10">
                <FileText className="w-16 h-16" />
              </div>
              <p className="text-xl">Search through your employee documents...</p>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex w-full ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] md:max-w-[70%] p-5 rounded-2xl shadow-lg border transition-all ${
                  m.role === "user"
                    ? "bg-purple-600/20 border-purple-400/40 text-white rounded-tr-none"
                    : "bg-white/5 border-white/10 text-purple-50 rounded-tl-none"
                }`}
              >
                <div className="text-xs mb-2 opacity-50 font-bold uppercase tracking-wider">
                  {m.role === "user" ? "You" : "Assistant"}
                </div>
                <div className="whitespace-pre-wrap leading-relaxed text-sm md:text-base">
                  {m.content.split(/(\*\*.*?\*\*)/g).map((part, index) =>
                    part.startsWith("**") && part.endsWith("**") ? (
                      <strong key={index} className="text-purple-300 font-bold">
                        {part.slice(2, -2)}
                      </strong>
                    ) : (
                      part
                    )
                  )}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-purple-300 animate-pulse flex items-center gap-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
                </div>
                <span className="text-sm font-medium">Searching database...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar - Fixed at bottom */}
        <div className="shrink-0 p-6 bg-[#3B2667]/80 backdrop-blur-md border-t border-white/10">
          <div className="max-w-4xl mx-auto flex gap-3 items-center bg-[#1A0B2E] p-2 pl-5 rounded-2xl border border-white/20 shadow-2xl focus-within:border-purple-500/50 transition-all">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1 bg-transparent py-3 outline-none text-white placeholder:text-purple-300/50 text-sm md:text-base"
              placeholder="Type employee name, PAN, or Aadhaar query..."
            />

            <div className="flex gap-2 pr-1">
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:hover:bg-purple-600 text-white p-3 rounded-xl transition-all active:scale-95 shadow-lg"
              >
                <SendHorizontal className="w-5 h-5" />
              </button>

              <button
                onClick={handleClear}
                className="bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 p-3 rounded-xl transition-all border border-white/10 hover:border-red-500/50"
                title="Clear Chat"
              >
                <XCircleIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

/* ---------------- FORMATTER MATCHED TO EMPLOYEE THEME ---------------- */
function formatResult(result: any): string {
  const rec = result?.answer;
  if (!rec) return "❌ **No records found in the database.**";

  if (Array.isArray(rec)) {
    let msg = "📋 **Search Results Found:**\n\n";

    rec.forEach((item, idx) => {
      const docType = item.document_type;
      msg += `🔹 **Record #${idx + 1} (${docType?.replace("_", " ").toUpperCase()})**\n`;
      
      const fields = [
        ["full_name", "Employee Name"], 
        ["pan_number", "PAN Number"],
        ["aadhaar_number", "Aadhaar Number"],
        ["dob", "Date of Birth"], 
        ["gender", "Gender"],
        ["father_name", "Father's Name"],
        ["address", "Address"]
      ];

      fields.forEach(([f, l]) => { 
        if(item[f]) msg += `**${l}:** ${item[f]}\n`;
      });
      msg += "\n---\n\n";
    });
    return msg;
  }

  if (typeof rec === "object") {
    let msg = `👤 **Profile: ${rec.full_name || "Employee"}**\n\n`;
    const sections = [
      { title: "Personal Details", fields: [["full_name", "Name"], ["dob", "DOB"], ["gender", "Gender"]] },
      { title: "Identification", fields: [["pan_number", "PAN"], ["aadhaar_number", "Aadhaar"]] },
      { title: "Contact", fields: [["address", "Address"], ["email", "Email"], ["mobile", "Mobile"]] }
    ];

    sections.forEach(sec => {
      let sectionAdded = false;
      sec.fields.forEach(([f, l]) => {
        if(rec[f]) {
          if(!sectionAdded) { msg += `**${sec.title}**\n`; sectionAdded = true; }
          msg += `• **${l}:** ${rec[f]}\n`;
        }
      });
      if(sectionAdded) msg += "\n";
    });
    return msg;
  }

  return typeof rec === "string" ? `🔍 **Result:** ${rec}` : "❌ **Format Error**";
}