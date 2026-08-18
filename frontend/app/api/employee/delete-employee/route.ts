import { NextResponse } from "next/server";
import { API_URL, API_TOKEN } from "@/app/utils/api";

export async function DELETE(req: Request) {
  try {
    const employeeId = req.headers.get("employee-id");

    if (!employeeId) {
      return NextResponse.json(
        { message: "employee-id header is required" },
        { status: 400 }
      );
    }

    const headers: Record<string, string> = {
      accept: "application/json",
      "employee-id": employeeId,
      "PK-apiToken": API_TOKEN
    };

    const res = await fetch(`${API_URL}KYC/delete`, {
      method: "DELETE",
      headers,
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { message: data?.message || "Failed to delete KYC" },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("DELETE KYC ERROR:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
