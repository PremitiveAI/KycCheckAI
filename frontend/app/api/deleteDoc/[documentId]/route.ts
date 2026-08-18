import { NextResponse } from "next/server";
import { API_URL, API_TOKEN } from "@/app/utils/api";
import { cookies } from "next/headers";

export async function DELETE(
  req: Request,
  context: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await context.params; // ✅ unwrap the promise

    if (!documentId) {
      return NextResponse.json({ detail: "documentId not provided" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    const headers: Record<string, string> = {
      accept: "application/json",
      "PK-apiToken": API_TOKEN,
      ...(token ? { "PK-sessionToken": token } : {}),
    };

    const res = await fetch(
      `${API_URL}documents/${documentId}`,
      {
        method: "DELETE",
        headers
      }
    );

    const data = await res.json();

    if (!res.ok || data?.Code !== 0) {
      return NextResponse.json(
        { message: data?.Error || "Failed to delete document" },
        { status: 400 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
