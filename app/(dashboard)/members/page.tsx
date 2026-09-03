import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MembersClient } from "@/components/members/members-client";

export default async function MembersPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!currentProfile) redirect("/login");

  const { data: members } = await supabase
    .from("profiles")
    .select("*, chapter:chapters(id, name, city)")
    .eq("chapter_id", currentProfile.chapter_id ?? "")
    .eq("is_active", true)
    .order("full_name");

  return <MembersClient members={members ?? []} currentProfile={currentProfile} />;
}
