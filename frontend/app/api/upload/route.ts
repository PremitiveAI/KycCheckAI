import { NextResponse } from "next/server";
import axios from "axios";
import { API_URL, API_TOKEN } from "@/app/utils/api";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { Code: 1, Error: { message: "File field is required" } },
        { status: 400 }
      );
    }

    const uploadFormData = new FormData();
    uploadFormData.append("file", file);

    const response = await axios.post(`${API_URL}upload`, uploadFormData, {
      headers: {
        'accept': 'application/json',
        'Content-Type': 'multipart/form-data',
        'PK-apiToken': API_TOKEN
      },
      maxBodyLength: Infinity,
    });

     console.log("🔵 RAW BACKEND RESPONSE:", response.data);

    console.error("Request:", response);

    return NextResponse.json(response.data, { status: 200 });

  }
  catch (error: any) {
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
