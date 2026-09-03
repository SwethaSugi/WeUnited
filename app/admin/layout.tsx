import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopNav } from "@/components/layout/TopNav";
import { getCurrentUserProfile } from "@/lib/auth/current-user";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Admin gate — this used to live in middleware, where it cost a Supabase
  // round-trip on EVERY request app-wide just to protect these few routes.
  // Here it only runs on /admin, and it's React-cached so the admin pages
  // inside reuse the same fetch.
  const { user, profile, profileMissing } = await getCurrentUserProfile();

  if (!user) redirect("/login");
  if (profileMissing) redirect("/onboarding");
  if (profile?.is_active === false) redirect("/login?error=deactivated");

  // If the profile fetch failed outright, don't silently demote an admin to
  // /dashboard — let the page render and surface the real error instead.
  if (profile && profile.role !== "chapter_admin" && profile.role !== "super_admin") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav />
        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
