import { NextResponse } from "next/server";
import axios from "axios";
import { API_URL, API_TOKEN } from "@/app/utils/api";
import { encrypt } from "@/app/utils/crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const config = {
      method: "post",
      url: `${API_URL}user/login`,
      headers: {
        "Content-Type": "application/json",
        "PK-apiToken": API_TOKEN,
      },
      data: body,
    };

    const response = await axios.request(config);

    console.log("🔵 RAW BACKEND RESPONSE:", response.data);

    const token = response.data?.Success?.data?.session_token;
    const username = response.data?.Success?.data?.username;
    // Error from backend structure
    if (response?.data?.Error?.message) {
      return NextResponse.json(
        { message: response.data.Error.message },
        { status: 400 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { message: "Token missing from backend" },
        { status: 400 }
      );
    }

    if (!username) {
      return NextResponse.json(
        { message: "username missing from backend" },
        { status: 400 }
      );
    }

    const encryptedToken = encrypt(token);

    const res = NextResponse.json(
      { message: "Login successful" },
      { status: 200 }
    );

    res.cookies.set("session_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    res.cookies.set("username", username, {
      httpOnly: false,
      secure: true,
      sameSite: "lax",
      path: "/",
    });

    return res;
  } catch (error: any) {
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
          "Something went wrong",
      },
      { status: error?.response?.status || 500 }
    );
  }
}