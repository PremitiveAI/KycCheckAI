import { NextResponse } from "next/server";
import axios from "axios";
import { API_URL, API_TOKEN } from "@/app/utils/api";

export async function POST(request: Request) {
  
  try {
    const body = await request.json();

    console.log("🔵 REQUEST HEADERS:");
    request.headers.forEach((value, key) => {
      console.log(`${key}: ${value}`);
    });
    console.log("🔵 REQUEST BODY:", body);

    const config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `${API_URL}user/signup`,
      headers: { 
        "Content-Type": "application/json",
        'PK-apiToken': API_TOKEN
      },
      data: body,
    };

    const response = await axios.request(config);

     console.log("🔵 RAW BACKEND RESPONSE:", response.data);

      if (response?.data?.Error) {
        return NextResponse.json(
          { Error: response.data.Error },
          { status: 400 }
        );
      }


    const res = NextResponse.json(
          { message: "User Create successful" },
          { status: 200 }
        );

   return res;

  } catch (error: any) {

      console.log("🔵 API CATCH ERROR:", error?.response?.data);
 return NextResponse.json(
      {
        Error:
          error?.response?.data?.Error?.message ||
          "Something went wrong. Please try again.",
      },
      { status: error?.response?.status || 500 }
    );
  }
}


