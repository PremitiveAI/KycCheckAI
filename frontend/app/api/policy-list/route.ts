import { NextResponse } from "next/server";
import { API_URL, API_TOKEN } from "@/app/utils/api";

export async function GET() {

  try {

    const res = await fetch(`${API_URL}policies`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "PK-apiToken": API_TOKEN,
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Backend Error Response:", errorText);

      return NextResponse.json(
        { message: "Backend returned an error", details: errorText },
        { status: res.status }
      );
    }
    const data = await res.json();
    
    console.log("🔵 BACKEND API RESPONSE:", data); 

    return NextResponse.json(data);

  } catch (error: any) {
    console.log("🔴 LOGIN API ERROR DETAILS");
    console.log("error.message:", error?.message);
    console.log("error.response?.status:", error?.response?.status);
    console.log("error.response?.data:", error?.response?.data);
    console.log("error.config?.url:", error?.config?.url);

    return NextResponse.json(
      {
        message:
          error?.response?.data?.Error?.message ||
          error?.response?.data?.detail ||
          error?.message ||
          "File upload failed or server error",
      },
      { status: error?.response?.status || 500 }
    );
  }
}
