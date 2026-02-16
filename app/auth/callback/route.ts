import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {

  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  console.log("Callback hit:", request.url);
  console.log("OAuth callback code:", code);

  if (!code) {
    console.error("No authorization code received");
    return NextResponse.redirect(new URL("/", request.url));
  }

  const cookieStore =  await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name, options) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  console.log("Session exchange result:", error);

  if (error) {
    console.error("Session exchange failed:", error.message);
    return NextResponse.redirect(new URL("/", request.url));
  }

  console.log("Session stored successfully");

    return NextResponse.redirect(new URL("/dashboard", request.url));

}
