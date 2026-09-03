import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

// Service-role client — never expose on the client side
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set in .env.local");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(req: NextRequest) {
  try {
    // Verify the caller is a logged-in admin
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check the caller is chapter_admin or super_admin
    const { data: callerProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!callerProfile || !["chapter_admin", "super_admin"].includes(callerProfile.role)) {
      return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
    }

    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Prevent self-removal
    if (userId === user.id) {
      return NextResponse.json({ error: "You cannot remove yourself" }, { status: 400 });
    }

    const supabaseAdmin = getAdminClient();

    // Delete from auth.users — this cascades to profiles via FK (if set up)
    // We also explicitly delete from profiles first to be safe
    const { error: profileDeleteError } = await supabaseAdmin.from("profiles").delete().eq("id", userId);
    if (profileDeleteError) {
      console.error("remove-member: profiles delete failed:", profileDeleteError);
      return NextResponse.json(
        { error: `Could not remove member's profile data: ${profileDeleteError.message}` },
        { status: 500 }
      );
    }

    // Best-effort cleanup: remove any storage objects owned by this user (avatars/logos).
    // A leftover storage.objects row referencing this user is a common cause of
    // "Database error deleting user" since that table's owner FK isn't always cascaded.
    for (const bucket of ["avatars", "logos"]) {
      try {
        const { data: files } = await supabaseAdmin.storage.from(bucket).list(userId);
        if (files && files.length > 0) {
          await supabaseAdmin.storage.from(bucket).remove(files.map((f) => `${userId}/${f.name}`));
        }
      } catch {
        // Bucket may not exist — ignore and continue
      }
    }

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error("remove-member: auth.admin.deleteUser failed:", JSON.stringify(deleteError, null, 2));
      return NextResponse.json(
        {
          error: deleteError.message,
          detail:
            "Check Supabase Dashboard → Logs → Postgres Logs around this time for the exact foreign-key constraint blocking this delete.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("remove-member: unexpected error:", err);
    return NextResponse.json({ error: err.message ?? "Internal server error" }, { status: 500 });
  }
}
