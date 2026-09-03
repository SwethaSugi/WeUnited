"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@/hooks/useUser";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MobileNav } from "./MobileNav";
import type { Notification } from "@/lib/types";
import { useRouter } from "next/navigation";

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

export function TopNav() {
  const { profile } = useUser();
  const router = useRouter();
  const supabase = createClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!profile?.id) return;
    supabase
      .from("notifications").select("*")
      .eq("user_id", profile.id).eq("is_read", false)
      .order("created_at", { ascending: false }).limit(5)
      .then(({ data }) => {
        if (data) { setNotifications(data); setUnreadCount(data.length); }
      });
  }, [profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function markAllRead() {
    if (!profile?.id) return;
    await supabase.from("notifications").update({ is_read: true })
      .eq("user_id", profile.id).eq("is_read", false);
    setNotifications([]); setUnreadCount(0);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login"); router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-4 md:px-6 border-b"
      style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(16px)", borderColor: "rgba(0,0,0,0.06)" }}>

      {/* Left: mobile nav + logo */}
      <div className="flex items-center gap-3">
        <MobileNav />
        <Link href="/dashboard" className="lg:hidden flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-[10px] text-white shadow-md"
            style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)" }}>WU</div>
          <span className="font-black text-sm text-slate-900">We United</span>
        </Link>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon"
              className="relative w-9 h-9 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 text-white text-[9px] font-black rounded-full flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #f43f5e, #ef4444)" }}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 shadow-2xl rounded-2xl border border-slate-100 p-2">
            <DropdownMenuLabel className="flex items-center justify-between px-2 pb-2">
              <span className="font-bold text-slate-800">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-xs font-semibold text-purple-600 hover:text-purple-500">Mark all read</button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="mb-1" />
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.1), rgba(99,102,241,0.1))" }}>
                  <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-slate-600">All caught up!</p>
                <p className="text-xs text-slate-400 mt-1">No new notifications</p>
              </div>
            ) : notifications.map((n) => (
              <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1 py-3 px-3 rounded-xl">
                <span className="font-semibold text-sm text-slate-800">{n.title}</span>
                <span className="text-xs text-slate-500 line-clamp-2">{n.message}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition-all duration-200 group">
              <Avatar className="w-7 h-7 ring-2 ring-purple-200">
                <AvatarImage src={profile?.avatar_url ?? undefined} />
                <AvatarFallback className="text-[10px] font-black text-white"
                  style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)" }}>
                  {profile ? initials(profile.full_name) : "?"}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:block text-sm font-bold text-slate-700 max-w-[120px] truncate">
                {profile?.full_name?.split(" ")[0] ?? ""}
              </span>
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60 shadow-2xl rounded-2xl border border-slate-100 p-2">
            <DropdownMenuLabel className="px-2 pb-2">
              <p className="font-bold text-slate-800">{profile?.full_name}</p>
              <p className="text-xs text-slate-400 font-normal">{profile?.email}</p>
              <Badge className="mt-1.5 text-[10px] font-bold border-0"
                style={{ background: "rgba(168,85,247,0.12)", color: "#9333ea" }}>
                {profile?.role?.replace("_", " ")}
              </Badge>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="mb-1" />
            <DropdownMenuItem asChild className="rounded-xl px-3 py-2 text-sm font-semibold cursor-pointer">
              <a href="/profile">My Profile</a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="rounded-xl px-3 py-2 text-sm font-semibold cursor-pointer">
              <a href="/profile?tab=security">Settings</a>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem onClick={handleLogout}
              className="rounded-xl px-3 py-2 text-sm font-semibold text-red-500 focus:text-red-500 focus:bg-red-50 cursor-pointer">
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
