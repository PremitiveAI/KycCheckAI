import { NextResponse } from "next/server";


export async function GET() {
  const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
  const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || "";


  const CLIENT_ID = process.env.CLIENT_ID;
  const redirectUri = process.env.REDIRECT_URI;

  if (!CLIENT_ID || !redirectUri) {
    console.error("Missing CLIENT_ID or REDIRECT_URI");
    return NextResponse.json(
      { error: "Google OAuth environment variables missing" },
      { status: 500 }
    );
  }

  const redirectUrl = new URL(GOOGLE_AUTH_URL);
  redirectUrl.searchParams.set("client_id", CLIENT_ID);
  redirectUrl.searchParams.set("redirect_uri", redirectUri);
  redirectUrl.searchParams.set("response_type", "code");
  redirectUrl.searchParams.set("scope", "openid email profile");
  redirectUrl.searchParams.set("prompt", "select_account");

  return NextResponse.redirect(redirectUrl.toString());
}

