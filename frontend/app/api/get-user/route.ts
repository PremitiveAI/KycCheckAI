import { NextResponse } from "next/server";
import { API_URL, API_TOKEN } from "@/app/utils/api";
import { cookies } from "next/headers";

export async function GET() {
  try {
    
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { message: "Session token missing" },
        { status: 401 }
      );
    }
    const res = await fetch(`${API_URL}user/getUser`, {
      method: "get",
      headers: {
        "Content-Type": "application/json",
        "PK-apiToken": API_TOKEN,
        "PK-sessionToken": sessionToken,
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
 