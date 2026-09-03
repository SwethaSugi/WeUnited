"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { DashboardStats, Profile, Meeting } from "@/lib/types";

interface Props {
  profile: Profile & { chapter: { name: string; meeting_day: string | null; meeting_time: string | null } | null };
  stats: DashboardStats;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recentReferrals: any[];
  upcomingMeetings: Meeting[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: "Pending",   color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  accepted:  { label: "Accepted",  color: "#6366f1", bg: "rgba(99,102,241,0.12)" },
  completed: { label: "Completed", color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  rejected:  { label: "Rejected",  color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
};

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function formatCurrency(value: number) {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
  return `₹${value}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const KPI_CARDS = (stats: DashboardStats) => [
  {
    title: "Referrals Sent",
    value: stats.myReferralsSent,
    sub: `${stats.completedReferrals} completed`,
    gradient: "linear-gradient(135deg, #a855f7, #7c3aed)",
    shadow: "rgba(168,85,247,0.35)",
    iconBg: "rgba(255,255,255,0.2)",
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4" />
      </svg>
    ),
  },
  {
    title: "Referrals Received",
    value: stats.myReferralsReceived,
    sub: `${stats.pendingReferrals} pending`,
    gradient: "linear-gradient(135deg, #6366f1, #4f46e5)",
    shadow: "rgba(99,102,241,0.35)",
    iconBg: "rgba(255,255,255,0.2)",
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 17H4m0 0l4-4m-4 4l4 4" />
      </svg>
    ),
  },
  {
    title: "Referral Value",
    value: formatCurrency(stats.totalReferralValue),
    sub: "estimated pipeline",
    gradient: "linear-gradient(135deg, #10b981, #059669)",
    shadow: "rgba(16,185,129,0.35)",
    iconBg: "rgba(255,255,255,0.2)",
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: "Chapter Members",
    value: stats.totalMembers,
    sub: "active members",
    gradient: "linear-gradient(135deg, #f97316, #ea580c)",
    shadow: "rgba(249,115,22,0.35)",
    iconBg: "rgba(255,255,255,0.2)",
    icon: (
      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export function DashboardClient({ profile, stats, recentReferrals, upcomingMeetings }: Props) {
  const isAdmin = profile.role === "chapter_admin" || profile.role === "super_admin";
  const firstName = profile.full_name.split(" ")[0];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            {greeting}, <span className="shimmer-text">{firstName}</span>! 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {profile.chapter?.name ?? "No chapter assigned"} &bull;{" "}
            <span className="capitalize font-medium">{profile.role.replace("_", " ")}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/referrals"
            className="px-4 py-2 text-sm font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-purple-300 hover:text-purple-600 transition-all duration-200">
            View Referrals
          </Link>
          <Link href="/referrals?new=true"
            className="px-4 py-2 text-sm font-bold rounded-xl text-white transition-all duration-200 hover:scale-105"
            style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)", boxShadow: "0 4px 14px rgba(168,85,247,0.4)" }}>
            + New Referral
          </Link>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI_CARDS(stats).map((card) => (
          <div key={card.title}
            className="relative rounded-2xl p-5 overflow-hidden text-white group hover:-translate-y-1 transition-all duration-300"
            style={{ background: card.gradient, boxShadow: `0 8px 24px ${card.shadow}` }}>
            {/* Decorative circle */}
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20"
              style={{ background: "rgba(255,255,255,0.3)" }} />
            <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full opacity-15"
              style={{ background: "rgba(255,255,255,0.4)" }} />
            <div className="relative">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                style={{ background: card.iconBg }}>
                {card.icon}
              </div>
              <p className="text-white/70 text-xs font-semibold mb-1">{card.title}</p>
              <p className="text-3xl font-black">{card.value}</p>
              <p className="text-white/60 text-xs mt-1">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Grid ── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Recent Referrals */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(168,85,247,0.12)" }}>
                <svg className="w-3.5 h-3.5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h2 className="font-bold text-slate-800 dark:text-white text-sm">Recent Referrals</h2>
            </div>
            <Link href="/referrals" className="text-xs font-bold text-purple-600 hover:text-purple-500 transition-colors">
              View all
            </Link>
          </div>
          {recentReferrals.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: "rgba(168,85,247,0.08)" }}>
                <svg className="w-7 h-7 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-slate-500 mb-2">No referrals yet</p>
              <Link href="/referrals?new=true" className="text-sm font-bold text-purple-600 hover:text-purple-500">
                Give your first referral
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {recentReferrals.map((ref) => {
                const s = STATUS_CONFIG[ref.status] ?? STATUS_CONFIG.pending;
                return (
                  <div key={ref.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                    <Avatar className="w-9 h-9 shrink-0 ring-2 ring-slate-100 dark:ring-slate-700">
                      <AvatarImage src={ref.sender?.avatar_url} />
                      <AvatarFallback className="text-[10px] font-black text-white"
                        style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)" }}>
                        {ref.sender ? initials(ref.sender.full_name) : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{ref.referred_person_name}</p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {ref.sender?.full_name} → {ref.receiver?.full_name}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{ref.business_category} · {formatDate(ref.created_at)}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full capitalize"
                        style={{ color: s.color, background: s.bg }}>{s.label}</span>
                      {ref.estimated_value > 0 && (
                        <span className="text-xs font-bold text-slate-500">{formatCurrency(ref.estimated_value)}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Upcoming Meetings */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "rgba(52,211,153,0.12)" }}>
                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="font-bold text-slate-800 dark:text-white text-sm">Upcoming Meetings</h2>
              </div>
              <Link href="/meetings" className="text-xs font-bold text-emerald-600 hover:text-emerald-500 transition-colors">View all</Link>
            </div>
            <div className="p-4 space-y-2.5">
              {upcomingMeetings.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-sm font-semibold text-slate-400">No upcoming meetings</p>
                </div>
              ) : upcomingMeetings.map((meeting) => (
                <Link key={meeting.id} href={`/meetings/${meeting.id}`}
                  className="block p-3.5 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-800 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition-all duration-200 group">
                  <p className="text-sm font-bold text-slate-800 dark:text-white line-clamp-1 group-hover:text-emerald-700 transition-colors">{meeting.title}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {formatDate(meeting.meeting_date)}
                    {meeting.start_time && ` · ${meeting.start_time.slice(0, 5)}`}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-bold text-slate-800 dark:text-white text-sm">Quick Actions</h2>
            </div>
            <div className="p-4 space-y-2">
              {[
                { href: "/referrals?new=true", label: "Give a Referral", color: "#a855f7", bg: "rgba(168,85,247,0.08)" },
                { href: "/visitors?new=true", label: "Add Visitor", color: "#38bdf8", bg: "rgba(56,189,248,0.08)" },
                { href: "/members", label: "View Members", color: "#6366f1", bg: "rgba(99,102,241,0.08)" },
                ...(isAdmin ? [{ href: "/admin", label: "Admin Panel", color: "#fb923c", bg: "rgba(251,146,60,0.08)" }] : []),
              ].map((action) => (
                <Link key={action.href} href={action.href}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 group"
                  style={{ color: action.color, background: action.bg }}>
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: action.color }} />
                  {action.label}
                  <svg className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
