import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { getCurrentUserProfile } from "@/lib/auth/current-user";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The real, network-verified auth check. Middleware only did a cheap cookie
  // check to keep it off the hot path; this is the one that's trusted.
  // getCurrentUserProfile() is React-cached, so the page rendering inside this
  // layout reuses this same result instead of querying Supabase again.
  const { user, profile } = await getCurrentUserProfile();

  if (!user) redirect("/login");
  if (!profile) redirect("/onboarding");
  if (profile.is_active === false) redirect("/login?error=deactivated");

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto scrollbar-hide">{children}</main>
      </div>
    </div>
  );
}
