import { NextResponse } from "next/server";
import { API_URL, API_TOKEN } from "@/app/utils/api";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
   
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;
   
   if (!sessionToken) {
      return NextResponse.json(
        { message: "Session token missing" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const config = { 
        method: "post",
         maxBodyLength: Infinity,
          url: `${API_URL}logout`, 
          headers: { 
            "Content-Type": "application/json",
             'PK-apiToken': API_TOKEN, 
             'PK-sessionToken': sessionToken, },
              credentials: "include",
    };

    cookieStore.delete("session_token"); 
    cookieStore.delete("user_email");

    return NextResponse.json( 
        { Success: "API call success" },
        { status: 200 } );
        
  }catch (error: any) {
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