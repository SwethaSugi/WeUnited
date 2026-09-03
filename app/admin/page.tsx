import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminClient } from "@/components/admin/admin-client";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile || (profile.role !== "chapter_admin" && profile.role !== "super_admin")) {
    redirect("/dashboard");
  }

  const isSuperAdmin = profile.role === "super_admin";

  // Super admin sees all data across chapters; chapter admin sees only their chapter
  const [
    { data: members },
    { data: referrals },
    { data: meetings },
    { data: visitors },
  ] = await Promise.all([
    isSuperAdmin
      ? supabase.from("profiles").select("*").order("full_name")
      : supabase.from("profiles").select("*").eq("chapter_id", profile.chapter_id ?? "").order("full_name"),
    isSuperAdmin
      ? supabase.from("referrals").select("*").order("created_at", { ascending: false })
      : supabase.from("referrals").select("*").eq("chapter_id", profile.chapter_id ?? ""),
    isSuperAdmin
      ? supabase.from("meetings").select("*").order("meeting_date", { ascending: false })
      : supabase.from("meetings").select("*").eq("chapter_id", profile.chapter_id ?? "").order("meeting_date", { ascending: false }),
    isSuperAdmin
      ? supabase.from("visitors").select("*").order("created_at", { ascending: false })
      : supabase.from("visitors").select("*").eq("chapter_id", profile.chapter_id ?? "").order("created_at", { ascending: false }),
  ]);

  return (
    <AdminClient
      adminProfile={profile}
      members={members ?? []}
      referrals={referrals ?? []}
      meetings={meetings ?? []}
      visitors={visitors ?? []}
    />
  );
}
