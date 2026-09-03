import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { VisitorsClient } from "@/components/visitors/visitors-client";

export default async function VisitorsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/login");

  const [{ data: visitors }, { data: meetings }] = await Promise.all([
    supabase
      .from("visitors")
      .select(`*, invited_by_profile:profiles!visitors_invited_by_fkey(id, full_name), meeting:meetings(id, title, meeting_date)`)
      .eq("chapter_id", profile.chapter_id ?? "")
      .order("created_at", { ascending: false }),

    supabase
      .from("meetings")
      .select("id, title, meeting_date")
      .eq("chapter_id", profile.chapter_id ?? "")
      .gte("meeting_date", new Date().toISOString().split("T")[0])
      .order("meeting_date"),
  ]);

  return <VisitorsClient visitors={visitors ?? []} meetings={meetings ?? []} profile={profile} />;
}
