import { NextResponse } from "next/server";
import { API_URL, API_TOKEN } from "@/app/utils/api";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");

    if (!q) {
      return NextResponse.json(
        { message: "Search query is required" },
        { status: 400 }
      );
    }

    const res = await fetch(`${API_URL}query?q=${encodeURIComponent(q)}`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "PK-apiToken": API_TOKEN,
      },
    });
    
    const data = await res.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error("Policy Search API Error:", error);
    return NextResponse.json(null, { status: 500 });
  }
}
