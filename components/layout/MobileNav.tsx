"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", color: "#a855f7" },
  { label: "Members", href: "/members", color: "#6366f1" },
  { label: "Referrals", href: "/referrals", color: "#38bdf8" },
  { label: "Meetings", href: "/meetings", color: "#34d399" },
  { label: "Visitors", href: "/visitors", color: "#fb923c" },
  { label: "Chapters", href: "/chapters", color: "#f472b6" },
];

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { profile } = useUser();
  const router = useRouter();
  const supabase = createClient();

  const isAdmin = profile?.role === "chapter_admin" || profile?.role === "super_admin";

  async function handleLogout() {
    setOpen(false);
    await supabase.auth.signOut();
    router.push("/login"); router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden w-9 h-9 rounded-xl text-slate-600 hover:bg-slate-100 active:scale-90 transition-transform">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 flex flex-col border-0"
        style={{ background: "#0f0f1a" }}>

        {/* Logo header */}
        <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white"
            style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)" }}>WU</div>
          <div>
            <p className="text-sm font-black text-white">We United</p>
            <p className="text-[10px] text-white/30">Business Network</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-3 mb-3 text-[10px] font-bold text-white/25 uppercase tracking-widest">Navigation</p>
          {NAV_ITEMS.map((item, i) => {
            const active = item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 animate-fade-in-up active:scale-[0.98]",
                  active ? "text-white" : "text-white/40 hover:text-white/70"
                )}
                style={{ animationDelay: `${i * 45}ms`, ...(active ? { background: `${item.color}18`, boxShadow: `0 0 16px ${item.color}20` } : {}) }}>
                <span className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: active ? item.color : "rgba(255,255,255,0.15)" }} />
                {item.label}
              </Link>
            );
          })}

          {isAdmin && (
            <div className="pt-4 mt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <p className="px-3 mb-3 text-[10px] font-bold text-white/25 uppercase tracking-widest">Admin</p>
              <Link href="/admin" onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all",
                  pathname.startsWith("/admin") ? "text-white" : "text-white/40 hover:text-white/70"
                )}
                style={pathname.startsWith("/admin") ? { background: "rgba(251,146,60,0.18)" } : {}}>
                <span className="w-2 h-2 rounded-full" style={{ background: pathname.startsWith("/admin") ? "#fb923c" : "rgba(255,255,255,0.15)" }} />
                Admin Panel
              </Link>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="border-t p-4" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <Link href="/profile" onClick={() => setOpen(false)}
            className="flex items-center gap-3 p-2.5 rounded-xl mb-2 hover:bg-white/5 transition-all">
            <Avatar className="w-9 h-9 flex-shrink-0 ring-2" style={{ ringColor: "rgba(168,85,247,0.4)" }}>
              <AvatarImage src={profile?.avatar_url ?? undefined} />
              <AvatarFallback className="text-xs font-black text-white"
                style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)" }}>
                {profile ? initials(profile.full_name ?? "?") : "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white/80 truncate">{profile?.full_name ?? ""}</p>
              <p className="text-xs text-white/30 truncate">{profile?.business_name ?? profile?.email ?? ""}</p>
            </div>
          </Link>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
