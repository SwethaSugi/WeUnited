import { redirect } from "next/navigation";
import { ProfileClient } from "@/components/profile/profile-client";
import { getCurrentUserProfile } from "@/lib/auth/current-user";

export const metadata = {
  title: "My Profile — We United",
};

export default async function ProfilePage() {
  // Re-use the React-cached result from the layout — this is NOT a second
  // network call, and it uses the same verified auth result the layout used.
  // The old pattern made a separate supabase.auth.getUser() here which could
  // fail on the same request where the middleware just refreshed an expired
  // token (new cookie written to response, but current-request cookies still
  // carry the old value), causing an erroneous redirect to /login → /dashboard.
  const { user, profile } = await getCurrentUserProfile();

  if (!user || !profile) redirect("/login");

  // getCurrentUserProfile fetches the chapter as a separate query and attaches
  // it as `profile.chapter`, which has the same shape ProfileClient expects.
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">My Profile</h1>
        <p className="text-sm text-slate-500 mt-1">View and update your personal and business information</p>
      </div>
      <ProfileClient profile={profile as any} />
    </div>
  );
}
