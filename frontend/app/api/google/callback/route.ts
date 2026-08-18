import { NextResponse } from "next/server";
import { API_URL, API_TOKEN } from "@/app/utils/api";
import { encrypt } from "@/app/utils/crypto";

export async function GET(req: Request) {
  const url = new URL(req.url);

  const code = url.searchParams.get("code");
  const CLIENT_ID = process.env.CLIENT_ID;
  const CLIENT_SECRET = process.env.CLIENT_SECRET;
  const REDIRECT_URI = process.env.REDIRECT_URI;

  if (!code) {
    return NextResponse.json(
      { error: "Authorization code missing" },
      { status: 400 }
    );
  }

  if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
    return NextResponse.json(
      { error: "OAuth environment variables missing" },
      { status: 500 }
    );
  }

  // ================================
  // 1. Exchange CODE → ACCESS TOKEN
  // ================================
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
      code,
    }),
  });

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;

  if (!accessToken) {
    return NextResponse.json(
      { error: "Failed to exchange code for access token" },
      { status: 400 }
    );
  }

  // ================================
  // 2. Fetch USER from Google
  // ================================
  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const user = await userRes.json();

  if (!user?.email) {
    return NextResponse.json(
      { error: "Failed to fetch Google user info" },
      { status: 400 }
    );
  }

  // ================================
  // 3. Login to Backend API
  // ================================
  let token;

  try {
    const apiRes = await fetch(`${API_URL}user/login-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "PK-apiToken": API_TOKEN,
      },
      body: JSON.stringify({ email: user.email }),
    });

    console.log("login-email POST status:", apiRes.status);

    const data = await apiRes.json();
    console.log("login-email POST response:", data);

    token = data?.Success?.data?.session_token;

    if (!apiRes.ok) {
      return NextResponse.json(
        { error: data?.message || "login-email API failed" },
        { status: apiRes.status }
      );
    }

    if (!token) {
      return NextResponse.json(
        { message: "Token missing from backend" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.log("🔴 LOGIN API ERROR", error);

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

  // ================================
  // 4. Redirect → profile-update
  //    AND SET COOKIES HERE only
  // ================================
  const response = NextResponse.redirect(`${url.origin}/profile-update`);

  // session token cookie
  response.cookies.set("session_token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  response.cookies.set("user_email", user.email, {
    httpOnly: false,
    secure: true,
    sameSite: "lax",
    path: "/",
  });

  return response;
}