import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MeetingsClient } from "@/components/meetings/meetings-client";

export default async function MeetingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/login");

  const { data: meetings } = await supabase
    .from("meetings")
    .select("*")
    .eq("chapter_id", profile.chapter_id ?? "")
    .order("meeting_date", { ascending: false });

  return <MeetingsClient meetings={meetings ?? []} profile={profile} />;
}
