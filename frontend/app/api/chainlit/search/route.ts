import { NextResponse } from "next/server";
import { API_URL, API_TOKEN } from "@/app/utils/api";


export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    const res = await fetch(`${API_URL}KYC/search?query=${encodeURIComponent(query)}`, {
      method: "GET",
      headers: {
        "PK-apiToken": API_TOKEN,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Upstream API failed: ${res.status}`);
    }

    const data = await res.json();

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("SEARCH API ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch data" },
      { status: 500 }
    );
  }
}
