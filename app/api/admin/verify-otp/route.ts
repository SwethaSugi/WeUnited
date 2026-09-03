import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Service-role client — only used to clean up the shadow auth user that
// send-otp's create_user:true leaves behind after a fresh phone verifies.
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(req: NextRequest) {
  try {
    const { phone, token } = await req.json();
    if (!phone || !token) return NextResponse.json({ error: "Phone and token are required" }, { status: 400 });

    const e164 = phone.startsWith("+") ? phone : `+91${phone.replace(/^0/, "")}`;

    // Verify OTP via Supabase REST — does NOT create a persistent session for the admin's browser
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
      body: JSON.stringify({ phone: e164, token, type: "sms" }),
    });

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ error: err.msg ?? err.error_description ?? "Invalid OTP" }, { status: 400 });
    }

    // This is just a "prove you own this phone" step — the phone gets saved
    // onto a profile separately (onboarding) or passed into admin.createUser
    // separately (admin create-user), never onto *this* auth user. Since
    // send-otp used create_user:true, verifying just created a throwaway
    // auth user with nothing but this phone number attached. Left alone, it
    // would permanently squat on the phone number and make the real
    // account creation fail later with "phone already registered". Delete
    // it now that verification is done, but only if it's clearly a fresh
    // shadow account (no email, no matching profile) — never touch a real
    // existing member's account.
    try {
      const body = await res.json().catch(() => null);
      const verifiedUserId: string | undefined = body?.user?.id;
      const verifiedEmail: string | null | undefined = body?.user?.email;
      if (verifiedUserId && !verifiedEmail) {
        const supabaseAdmin = getAdminClient();
        const { data: existingProfile } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("id", verifiedUserId)
          .maybeSingle();
        if (!existingProfile) {
          await supabaseAdmin.auth.admin.deleteUser(verifiedUserId);
        }
      }
    } catch (cleanupErr) {
      // Non-fatal — verification itself already succeeded
      console.error("verify-otp: shadow user cleanup failed:", cleanupErr);
    }

    return NextResponse.json({ success: true, phone: e164 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
