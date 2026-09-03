import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileClient } from "@/components/profile/profile-client";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, chapter:chapters(id, name, city)")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  return <ProfileClient profile={profile} />;
}
