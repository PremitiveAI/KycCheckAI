import { NextResponse } from "next/server";
import { API_URL, API_TOKEN } from "@/app/utils/api";
import { cookies } from "next/headers";
import axios from "axios";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Missing session token" }, { status: 401 });
    }

    const payload = {
      search: "",
      filter: "",
      startDate: "",
      endDate: "",
      sort: "createdAt",
      order: "DESC",
      limit: 10,
      offset: 0,
    };

    const { data } = await axios.post(
      `${API_URL}/employee/list`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          "PK-apiToken": API_TOKEN,
          "PK-sessionToken": token,
        },
      }
    );

    console.log("🔵 RAW BACKEND RESPONSE:", data);

    if (data?.Error?.message) {
      return NextResponse.json({ message: data.Error.message }, { status: 400 });
    }

    // ✅ Fix: use Success.data directly
    const list = data?.Success?.data ?? [];
    return NextResponse.json({ data: list }, { status: 200 });

  } catch (error: any) {
    console.log("🔴 User list API ERROR DETAILS");
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
          "Server error",
      },
      { status: error?.response?.status || 500 }
    );
  }
}
