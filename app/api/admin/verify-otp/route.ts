import { NextRequest, NextResponse } from "next/server";

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

    // We only care about success — ignore the returned session (admin stays signed in)
    return NextResponse.json({ success: true, phone: e164 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
