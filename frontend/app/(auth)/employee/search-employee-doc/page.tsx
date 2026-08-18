"use client";

import { DashboardLayout } from '@/app/(main)/dashboard/DashboardLayout';

export default function ChainlitEmbed() {

 return (
  <DashboardLayout>
    <div className="w-full h-full relative">
      <iframe
        src="http://localhost:8000"
        className="absolute inset-0 w-full h-full border-0"
        title="PolicyForYou AI"
      />
    </div>
  </DashboardLayout>
);
}