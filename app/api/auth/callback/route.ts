import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      // Fetch profile to check active status and onboarding state
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, business_name, is_active")
        .eq("id", data.user.id)
        .single();

      // Deactivated account — sign them out immediately
      if (profile && profile.is_active === false) {
        await supabase.auth.signOut();
        return NextResponse.redirect(new URL("/login?error=deactivated", request.url));
      }

      // New user or incomplete profile → go to onboarding
      if (!profile?.full_name || !profile?.business_name) {
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth_failed", request.url));
}
