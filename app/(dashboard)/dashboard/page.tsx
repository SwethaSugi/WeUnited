import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard/dashboard-client";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, chapter:chapters(*)")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const chapterId = profile.chapter_id;

  // Parallel data fetching
  const [
    { count: totalMembers },
    { data: myReferralsSent },
    { data: myReferralsReceived },
    { data: upcomingMeetings },
    { data: recentReferrals },
  ] = await Promise.all([
    // Total chapter members
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("chapter_id", chapterId ?? "")
      .eq("is_active", true),

    // My sent referrals
    supabase
      .from("referrals")
      .select("*")
      .eq("sender_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),

    // My received referrals
    supabase
      .from("referrals")
      .select("*")
      .eq("receiver_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),

    // Upcoming meetings
    supabase
      .from("meetings")
      .select("*")
      .eq("chapter_id", chapterId ?? "")
      .eq("status", "scheduled")
      .gte("meeting_date", new Date().toISOString().split("T")[0])
      .order("meeting_date")
      .limit(3),

    // Recent referrals with sender/receiver
    supabase
      .from("referrals")
      .select(`
        *,
        sender:profiles!referrals_sender_id_fkey(id, full_name, business_name, avatar_url),
        receiver:profiles!referrals_receiver_id_fkey(id, full_name, business_name, avatar_url)
      `)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const sent = myReferralsSent ?? [];
  const received = myReferralsReceived ?? [];
  const allReferrals = [...sent, ...received];

  const stats = {
    totalMembers: totalMembers ?? 0,
    totalReferrals: allReferrals.length,
    pendingReferrals: allReferrals.filter((r) => r.status === "pending").length,
    completedReferrals: allReferrals.filter((r) => r.status === "completed").length,
    totalReferralValue: sent.reduce(
      (sum, r) => sum + Number(r.estimated_value ?? 0),
      0
    ),
    upcomingMeetings: upcomingMeetings?.length ?? 0,
    myReferralsSent: sent.length,
    myReferralsReceived: received.length,
  };

  return (
    <DashboardClient
      profile={profile}
      stats={stats}
      recentReferrals={recentReferrals ?? []}
      upcomingMeetings={upcomingMeetings ?? []}
    />
  );
}
