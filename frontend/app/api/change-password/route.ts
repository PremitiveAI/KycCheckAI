import { NextResponse } from "next/server";
import axios from "axios";
import { API_URL, API_TOKEN } from "@/app/utils/api";

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const config = {
      method: "put",
      maxBodyLength: Infinity,
      url: `${API_URL}update-password`,
      headers: { 
        "Content-Type": "application/json",
       'PK-apiToken': API_TOKEN
      },
      data: body,
    };

  const response = await axios.request(config);

    console.log("🔵 RAW BACKEND RESPONSE:", response.data);

 if (response?.data?.Error?.message) {
      return NextResponse.json(
        { message: response.data.Error.message },
        { status: 400 }
      );
    }

     const res = NextResponse.json(
      { message: "Chnaged passward successful" },
      { status: 200 }
    );
     return res;

  } catch (error: any) {
    console.log("🔵 API CATCH ERROR:", error?.response?.data);
    return NextResponse.json(
      {
        message:
          error?.response?.data?.Error?.message ||
          "Something went wrong. Please try again.",
      },
      { status: error?.response?.status || 500 }
    );
  }
}
