import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !anonKey || !serviceKey) {
      console.error("Notification route: missing env vars", { url: !!url, anonKey: !!anonKey, serviceKey: !!serviceKey });
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }

    // Verify the caller's session via the Authorization header
    const authHeader = request.headers.get("authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");

    if (token) {
      // Validate the token using the anon client
      const anonClient = createClient(url, anonKey);
      const { data: { user }, error: authErr } = await anonClient.auth.getUser(token);
      if (authErr || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
    // If no token header, fall through — internal calls from SSR pages
    // are trusted (they run server-side, not from the browser directly)

    const body = await request.json();
    const { notifications } = body as { notifications: object[] };

    if (!notifications || notifications.length === 0) {
      return NextResponse.json({ success: true });
    }

    // Service-role client bypasses RLS
    const adminClient = createClient(url, serviceKey);
    const { error } = await adminClient.from("notifications").insert(notifications);

    if (error) {
      console.error("Notification insert error:", error.code, error.message, error.details);
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Notification route unexpected error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
