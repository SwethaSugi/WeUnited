import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();
    if (!phone) return NextResponse.json({ error: "Phone is required" }, { status: 400 });

    // Normalise to E.164 — assume Indian numbers if no country code
    const e164 = phone.startsWith("+") ? phone : `+91${phone.replace(/^0/, "")}`;

    // Use anon key to send OTP via Supabase Auth REST — does NOT affect the caller's session
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
      // create_user: true — Supabase's phone-OTP endpoint refuses to even
      // send a code for a phone with no existing account when this is
      // false ("Signups not allowed for otp"), which is the case for
      // basically every first-time verification. The shadow auth user this
      // creates is cleaned up in verify-otp right after the code checks out.
      body: JSON.stringify({ phone: e164, create_user: true }),
    });

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ error: err.msg ?? err.error_description ?? "Failed to send OTP" }, { status: 400 });
    }

    return NextResponse.json({ success: true, phone: e164 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
