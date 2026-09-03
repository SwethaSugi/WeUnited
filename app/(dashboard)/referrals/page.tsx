import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ReferralsClient } from "@/components/referrals/referrals-client";

export default async function ReferralsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const [{ data: referrals }, { data: members }] = await Promise.all([
    supabase
      .from("referrals")
      .select(`
        *,
        sender:profiles!referrals_sender_id_fkey(id, full_name, business_name, avatar_url),
        receiver:profiles!referrals_receiver_id_fkey(id, full_name, business_name, avatar_url)
      `)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false }),

    supabase
      .from("profiles")
      .select("id, full_name, business_name, business_category, avatar_url, phone")
      .eq("chapter_id", profile.chapter_id ?? "")
      .eq("is_active", true)
      .neq("id", user.id)
      .order("full_name"),
  ]);

  return (
    <ReferralsClient
      referrals={referrals ?? []}
      members={members ?? []}
      currentUserId={user.id}
      currentProfile={profile}
    />
  );
}
