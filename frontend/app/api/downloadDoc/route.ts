import { NextResponse } from "next/server";
import { API_URL, API_TOKEN } from "@/app/utils/api";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

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
    const fileUrl = searchParams.get("fileUrl");

    if (!fileUrl) {
      return NextResponse.json(
        { message: "fileUrl not provided" },
        { status: 400 }
      );
    }

    const backendRes = await fetch(
      `${API_URL}documents/download?file_url=${encodeURIComponent(fileUrl)}`,
      {
        cache: "no-store",
        headers: {
          "PK-apiToken": API_TOKEN,
          "PK-sessionToken": sessionToken,
        },
      }
    );

    if (!backendRes.ok) {
      return NextResponse.json(
        { message: "Backend download failed" },
        { status: backendRes.status }
      );
    }

    const buffer = await backendRes.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          backendRes.headers.get("content-type") ||
          "application/octet-stream",
        "Content-Disposition": "attachment",
      },
    });
  } catch (error) {
    console.error("Download API Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
