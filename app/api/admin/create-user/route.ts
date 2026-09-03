import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// This route uses the SERVICE ROLE key — never expose this on the client.
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set in .env.local");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email, password, fullName, phone,
      businessName, businessCategory, businessTagline,
      chapterId, role,
    } = body;

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: "email, password and fullName are required" }, { status: 400 });
    }

    const supabaseAdmin = getAdminClient();

    // 1. Create auth user (email confirmed; phone confirmed if provided)
    const e164 = phone ? (phone.startsWith("+") ? phone : `+91${phone.replace(/^0/, "")}`) : undefined;

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      phone: e164,
      email_confirm: true,
      phone_confirm: !!e164,
      user_metadata: { full_name: fullName },
    });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user.id;

    // 2. Insert profile row
    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: userId,
      email,
      full_name: fullName,
      phone: e164 ?? null,
      business_name: businessName ?? null,
      business_category: businessCategory ?? null,
      business_tagline: businessTagline ?? null,
      chapter_id: chapterId ?? null,
      role: role ?? "member",
      is_active: true,
    });

    if (profileError) {
      // Roll back auth user so we don't leave orphans
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, userId });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
