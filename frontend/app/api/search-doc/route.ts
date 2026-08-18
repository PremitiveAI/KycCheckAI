import { NextResponse } from "next/server";
import { API_URL, API_TOKEN } from "@/app/utils/api";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;
     
    if (!sessionToken) {
      return NextResponse.json(
        { message: "Session token missing" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query")??"";
    const limit = searchParams.get("limit") ?? "10";
    const offset = searchParams.get("offset") ?? "0";

     const backendURL =
      `${API_URL}documents/search?query=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`

    const res = await fetch(backendURL, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "PK-apiToken": API_TOKEN,
        "PK-sessionToken": sessionToken,
      },
    }); 
    
    const data = await res.json();

    return NextResponse.json(data);

  } catch (error) {
    console.error("Policy Search API Error:", error);
    return NextResponse.json(null, { status: 500 });
  }
}
