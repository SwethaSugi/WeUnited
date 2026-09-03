import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileClient } from "@/components/profile/profile-client";

export const metadata = {
  title: "My Profile — We United",
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, chapter:chapters(id, name, city)")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">My Profile</h1>
        <p className="text-sm text-slate-500 mt-1">View and update your personal and business information</p>
      </div>
      <ProfileClient profile={profile} />
    </div>
  );
}
