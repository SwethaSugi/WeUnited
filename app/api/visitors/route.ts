import { NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return NextResponse.json({ error: "Server misconfiguration: service key missing" }, { status: 500 });
    }

    const supabaseAdmin = createSupabaseAdmin(url, serviceKey);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing visitor id" }, { status: 400 });

    const { error } = await supabaseAdmin.from("visitors").delete().eq("id", id);
    if (error) {
      console.error("Visitor delete error:", error.code, error.message, error.details);
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Visitor route unexpected error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
