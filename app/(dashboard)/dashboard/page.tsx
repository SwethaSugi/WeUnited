import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { getCurrentUserProfile } from "@/lib/auth/current-user";

// Supabase's hosted API/connection layer can take a while to respond to the
// first request after the project has been idle for a bit (a "cold start"),
// then be fast again for a while. A fixed short timeout was turning that
// normal warm-up delay into a hard failure. This gives a generous window for
// a genuine cold start, and — since a cold start is usually a one-time cost —
// retries once immediately on timeout, which typically succeeds fast because
// the connection is now warm. Only a second failure surfaces as a real error.
function withRetry<T>(fn: () => PromiseLike<T>, label: string, ms = 20000): Promise<T> {
  function attempt(): Promise<T> {
    return Promise.race([
      Promise.resolve(fn()),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Timed out after ${ms}ms waiting on: ${label}`)), ms)
      ),
    ]);
  }
  return attempt().catch(() => attempt());
}

export default async function DashboardPage() {
  const supabase = await createClient();

  // The layout above already did the verified auth check and fetched the
  // profile. getCurrentUserProfile() is React-cached, so this reuses that
  // result rather than making the same two Supabase calls a second time.
  const { user, profile, profileMissing } = await getCurrentUserProfile();

  if (!user) redirect("/login");
  if (profileMissing) redirect("/onboarding");

  // If we got here with no profile, the fetch genuinely failed. Throw so the
  // error boundary shows the reason (and it's logged server-side) instead of
  // rendering a blank page or bouncing somewhere misleading.
  if (!profile) {
    throw new Error(
      "Could not load your profile from Supabase. Check the dev server terminal for the underlying error."
    );
  }

  const chapterId = profile.chapter_id;

  // Parallel data fetching.
  //
  // This used to be 5 queries here (member count, sent referrals, received
  // referrals, upcoming meetings, recent-referrals-with-embeds) on top of the
  // auth.getUser() + profile fetch above — 7 Supabase API calls from a single
  // page load. Dashboard is also the page every login lands on (middleware
  // sends authenticated users on /login or /register straight here), so it's
  // the page most likely to hit Supabase's connection pooler while it's cold.
  // Every other page in the app only fires 1-2 queries in parallel and is
  // usually visited after the pool is already warm, which is why this was
  // the only page that hung. The three referrals queries below are one
  // Supabase call now instead of three: sent/received/recent are all derived
  // from a single `.or(sender/receiver)` fetch in JS.
  const [
    { count: totalMembers },
    { data: myReferrals },
    { data: upcomingMeetings },
  ] = await withRetry(() => Promise.all([
    // Total chapter members
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("chapter_id", chapterId ?? "")
      .eq("is_active", true),

    // All my referrals (sent + received), with sender/receiver embedded so
    // this one query also covers what "recent referrals" needs.
    supabase
      .from("referrals")
      .select(`
        *,
        sender:profiles!referrals_sender_id_fkey(id, full_name, business_name, avatar_url),
        receiver:profiles!referrals_receiver_id_fkey(id, full_name, business_name, avatar_url)
      `)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(100),

    // Upcoming meetings
    supabase
      .from("meetings")
      .select("*")
      .eq("chapter_id", chapterId ?? "")
      .eq("status", "scheduled")
      .gte("meeting_date", new Date().toISOString().split("T")[0])
      .order("meeting_date")
      .limit(3),
  ]), "dashboard Promise.all (members count, referrals, meetings)");
  // Note: on a retry, the individual queries above run again since withRetry
  // re-invokes the whole factory function passed to it.

  const allMyReferrals = myReferrals ?? [];
  const sent = allMyReferrals.filter((r) => r.sender_id === user.id);
  const received = allMyReferrals.filter((r) => r.receiver_id === user.id);
  const recentReferrals = allMyReferrals.slice(0, 5);

  const stats = {
    totalMembers: totalMembers ?? 0,
    totalReferrals: allMyReferrals.length,
    pendingReferrals: allMyReferrals.filter((r) => r.status === "pending").length,
    completedReferrals: allMyReferrals.filter((r) => r.status === "completed").length,
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
      recentReferrals={recentReferrals}
      upcomingMeetings={upcomingMeetings ?? []}
    />
  );
}
