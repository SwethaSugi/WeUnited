"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/dashboard",
    emoji: "🏠",
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    color: "#a855f7",
    bg: "rgba(168,85,247,0.12)",
  },
  {
    label: "Members",
    href: "/members",
    emoji: "👥",
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    color: "#6366f1",
    bg: "rgba(99,102,241,0.12)",
  },
  {
    label: "Referrals",
    href: "/referrals",
    emoji: "🔀",
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
    color: "#38bdf8",
    bg: "rgba(56,189,248,0.12)",
  },
  {
    label: "Meetings",
    href: "/meetings",
    emoji: "📅",
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    color: "#34d399",
    bg: "rgba(52,211,153,0.12)",
  },
  {
    label: "Visitors",
    href: "/visitors",
    emoji: "🙋",
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    ),
    color: "#fb923c",
    bg: "rgba(251,146,60,0.12)",
  },
  {
    label: "Chapters",
    href: "/chapters",
    emoji: "🏢",
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    color: "#f472b6",
    bg: "rgba(244,114,182,0.12)",
  },
];

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

export function Sidebar() {
  const pathname = usePathname();
  const { profile } = useUser();
  const router = useRouter();
  const supabase = createClient();

  const isAdmin = profile?.role === "chapter_admin" || profile?.role === "super_admin";

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 flex-shrink-0 border-r"
      style={{ background: "#0f0f1a", borderColor: "rgba(255,255,255,0.06)" }}>

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-white shadow-md">
          <img src="data:image/jpeg;base64,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" alt="We United" className="w-full h-full object-cover" />
        </div>
        <div>
          <p className="text-sm font-black text-white leading-tight">We United</p>
          <p className="text-[10px] text-white/30 leading-tight">Business Network</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hide">
        <p className="px-3 mb-3 text-[10px] font-bold text-white/25 uppercase tracking-widest">Navigation</p>
        {NAV_ITEMS.map((item) => {
          const active = item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group",
                active
                  ? "text-white"
                  : "text-white/40 hover:text-white/80"
              )}
              style={active ? { background: item.bg, boxShadow: `0 0 16px ${item.color}25` } : {}}>
              {/* Icon wrapper */}
              <span className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
                style={active
                  ? { background: item.color, color: "white" }
                  : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }}>
                {item.icon}
              </span>
              {item.label}
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: item.color }} />
              )}
            </Link>
          );
        })}

        {isAdmin && (
          <div className="pt-4 mt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <p className="px-3 mb-3 text-[10px] font-bold text-white/25 uppercase tracking-widest">Admin</p>
            <Link href="/admin"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
                pathname.startsWith("/admin")
                  ? "text-white"
                  : "text-white/40 hover:text-white/80"
              )}
              style={pathname.startsWith("/admin")
                ? { background: "rgba(251,146,60,0.12)", boxShadow: "0 0 16px rgba(251,146,60,0.15)" }
                : {}}>
              <span className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                style={pathname.startsWith("/admin")
                  ? { background: "#fb923c", color: "white" }
                  : { background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }}>
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </span>
              Admin Panel
            </Link>
          </div>
        )}
      </nav>

      {/* Profile footer */}
      <div className="border-t p-4" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <Link href="/profile"
          className="flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 group mb-2"
          style={{ hover: "background: rgba(255,255,255,0.05)" }}>
          <Avatar className="w-9 h-9 flex-shrink-0 ring-2" style={{ ringColor: "rgba(168,85,247,0.4)" }}>
            <AvatarImage src={profile?.avatar_url ?? undefined} />
            <AvatarFallback className="text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)" }}>
              {profile ? initials(profile.full_name) : "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white/80 truncate group-hover:text-white transition-colors">
              {profile?.full_name ?? "Loading…"}
            </p>
            <Badge variant="secondary"
              className="text-[10px] px-1.5 h-4 mt-0.5 font-semibold border-0"
              style={{ background: "rgba(168,85,247,0.2)", color: "#c084fc" }}>
              {profile?.role?.replace("_", " ") ?? "member"}
            </Badge>
          </div>
        </Link>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  );
}
