"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import type { Profile, Referral, Meeting, Visitor, UserRole } from "@/lib/types";

interface Props {
  adminProfile: Profile;
  members: Profile[];
  referrals: Referral[];
  meetings: Meeting[];
  visitors: Visitor[];
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function formatCurrency(v: number) {
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000)   return `₹${(v / 1000).toFixed(0)}K`;
  return `₹${v}`;
}

// Avatar gradient per letter
const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,#a855f7,#6366f1)",
  "linear-gradient(135deg,#06b6d4,#3b82f6)",
  "linear-gradient(135deg,#10b981,#06b6d4)",
  "linear-gradient(135deg,#f59e0b,#ef4444)",
  "linear-gradient(135deg,#ec4899,#a855f7)",
  "linear-gradient(135deg,#6366f1,#06b6d4)",
];
function avatarGradient(name: string) {
  const idx = (name.charCodeAt(0) ?? 0) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[idx];
}

const STATUS_BADGE: Record<string, { bg: string; dot: string; text: string }> = {
  pending:   { bg: "rgba(245,158,11,0.1)",  dot: "#f59e0b", text: "#b45309" },
  accepted:  { bg: "rgba(59,130,246,0.1)",  dot: "#3b82f6", text: "#1d4ed8" },
  completed: { bg: "rgba(16,185,129,0.1)",  dot: "#10b981", text: "#047857" },
  rejected:  { bg: "rgba(239,68,68,0.1)",   dot: "#ef4444", text: "#b91c1c" },
  scheduled: { bg: "rgba(99,102,241,0.1)",  dot: "#6366f1", text: "#4338ca" },
  cancelled: { bg: "rgba(239,68,68,0.1)",   dot: "#ef4444", text: "#b91c1c" },
};

function StatusPill({ status }: { status: string }) {
  const s = STATUS_BADGE[status] ?? { bg: "rgba(100,116,139,0.1)", dot: "#64748b", text: "#475569" };
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize"
      style={{ background: s.bg, color: s.text }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />
      {status}
    </span>
  );
}

export function AdminClient({ adminProfile, members, referrals, meetings, visitors }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [removeConfirmId, setRemoveConfirmId] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const businessMembers     = members.filter((m) => m.role !== "super_admin");
  const activeMembers       = businessMembers.filter((m) => m.is_active).length;
  const completedReferrals  = referrals.filter((r) => r.status === "completed").length;
  const totalReferralValue  = referrals.reduce((s, r) => s + Number(r.estimated_value ?? 0), 0);
  const convertedVisitors   = visitors.filter((v) => v.converted_to_member).length;

  const filteredMembers = businessMembers.filter((m) => {
    const q = search.toLowerCase();
    return !q ||
      m.full_name.toLowerCase().includes(q) ||
      (m.email ?? "").toLowerCase().includes(q) ||
      (m.business_name ?? "").toLowerCase().includes(q);
  });

  async function handleRoleChange(memberId: string, role: UserRole) {
    setUpdatingRole(memberId);
    await supabase.from("profiles").update({ role }).eq("id", memberId);
    setUpdatingRole(null);
    router.refresh();
  }

  async function handleToggleActive(member: Profile) {
    await supabase.from("profiles").update({ is_active: !member.is_active }).eq("id", member.id);
    router.refresh();
  }

  async function handleMeetingStatus(meetingId: string, status: "completed" | "cancelled") {
    await supabase.from("meetings").update({ status }).eq("id", meetingId);
    router.refresh();
  }

  async function handleRemoveMember(memberId: string) {
    setRemoving(true);
    setRemoveError(null);
    const res = await fetch("/api/admin/remove-member", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: memberId }),
    });
    const data = await res.json();
    setRemoving(false);
    if (!res.ok) { setRemoveError(data.error ?? "Failed to remove member"); return; }
    setRemoveConfirmId(null);
    router.refresh();
  }

  const KPI = [
    {
      title: "Total Members",
      value: businessMembers.length,
      sub: `${activeMembers} active`,
      gradient: "linear-gradient(135deg,#6366f1,#a855f7)",
      glow: "rgba(99,102,241,0.25)",
      icon: (
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      title: "Total Referrals",
      value: referrals.length,
      sub: `${completedReferrals} completed`,
      gradient: "linear-gradient(135deg,#a855f7,#ec4899)",
      glow: "rgba(168,85,247,0.25)",
      icon: (
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4M4 17h12m0 0l-4-4m4 4l-4 4" />
        </svg>
      ),
    },
    {
      title: "Referral Value",
      value: formatCurrency(totalReferralValue),
      sub: "estimated pipeline",
      gradient: "linear-gradient(135deg,#10b981,#06b6d4)",
      glow: "rgba(16,185,129,0.25)",
      icon: (
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: "Visitors",
      value: visitors.length,
      sub: `${convertedVisitors} converted`,
      gradient: "linear-gradient(135deg,#f59e0b,#ef4444)",
      glow: "rgba(245,158,11,0.25)",
      icon: (
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity:0; transform:scale(0.95); }
          to   { opacity:1; transform:scale(1); }
        }
        @keyframes slideRight {
          from { opacity:0; transform:translateX(-12px); }
          to   { opacity:1; transform:translateX(0); }
        }
        .kpi-card { animation: scaleIn .4s ease both; }
        .kpi-card:hover { transform:translateY(-3px) scale(1.01); transition:transform .2s ease,box-shadow .2s ease; }
        .member-row { animation: fadeUp .35s ease both; }
        .member-row:hover { background: rgba(99,102,241,0.04); transition:background .15s; }
        .action-btn { transition:all .15s ease; }
        .action-btn:hover { transform:translateY(-1px); }
        .tab-content { animation: fadeUp .3s ease both; }
        .remove-confirm { animation: slideRight .2s ease both; }
      `}</style>

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        style={{ animation: "fadeUp .3s ease both" }}>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight"
            style={{ background: "linear-gradient(135deg,#6366f1,#a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Admin Panel
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Chapter management overview</p>
        </div>
        {adminProfile.role === "super_admin" && (
          <Link href="/admin/create-user">
            <button className="action-btn inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg,#a855f7,#6366f1)", boxShadow: "0 4px 16px rgba(168,85,247,0.35)" }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Create User
            </button>
          </Link>
        )}
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {KPI.map((k, i) => (
          <div key={k.title} className="kpi-card rounded-2xl p-4 border border-border/40 bg-card cursor-default"
            style={{ animationDelay: `${i * 70}ms`, boxShadow: `0 4px 24px ${k.glow}` }}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: k.gradient, boxShadow: `0 4px 12px ${k.glow}` }}>
                {k.icon}
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground text-right leading-tight max-w-[80px]">
                {k.title}
              </span>
            </div>
            <p className="text-3xl font-black tracking-tight">{k.value}</p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="members">
        <TabsList className="h-10 rounded-xl gap-1 p-1">
          <TabsTrigger value="members" className="text-xs rounded-lg px-3 data-[state=active]:shadow-sm">
            Members <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">{businessMembers.length}</span>
          </TabsTrigger>
          <TabsTrigger value="referrals" className="text-xs rounded-lg px-3">
            Referrals <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">{referrals.length}</span>
          </TabsTrigger>
          <TabsTrigger value="meetings" className="text-xs rounded-lg px-3">
            Meetings <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{meetings.length}</span>
          </TabsTrigger>
          <TabsTrigger value="visitors" className="text-xs rounded-lg px-3">
            Visitors <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">{visitors.length}</span>
          </TabsTrigger>
        </TabsList>

        {/* ── Members Tab ── */}
        <TabsContent value="members" className="tab-content mt-4">
          <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-border/50">
              <div>
                <h2 className="text-sm font-bold">Member Management</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{filteredMembers.length} of {businessMembers.length} members</p>
              </div>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  className="h-9 pl-9 pr-4 text-xs rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all w-52"
                  placeholder="Search by name, email, business…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Member list */}
            {filteredMembers.length === 0 ? (
              <div className="py-16 text-center">
                <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                  style={{ background: "rgba(99,102,241,0.08)" }}>
                  <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-muted-foreground">No members found</p>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {filteredMembers.map((member, idx) => {
                  const isSelf = member.id === adminProfile.id;
                  const isActive = member.is_active;
                  return (
                    <div key={member.id} className="member-row px-5 py-4"
                      style={{ animationDelay: `${idx * 50}ms`, background: isSelf ? "rgba(99,102,241,0.03)" : undefined }}>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">

                        {/* Avatar + name */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="relative flex-shrink-0">
                            <Avatar className="w-10 h-10 ring-2 ring-offset-1 ring-offset-background"
                              style={{ "--tw-ring-color": isActive ? "rgba(16,185,129,0.5)" : "rgba(100,116,139,0.25)" } as any}>
                              <AvatarImage src={member.avatar_url ?? undefined} />
                              <AvatarFallback className="text-[11px] font-extrabold text-white"
                                style={{ background: avatarGradient(member.full_name) }}>
                                {initials(member.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            {/* Active dot */}
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background"
                              style={{ background: isActive ? "#10b981" : "#94a3b8" }} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-sm leading-tight truncate">{member.full_name}</p>
                              {isSelf && (
                                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wide"
                                  style={{ background: "rgba(99,102,241,0.12)", color: "#6366f1" }}>You</span>
                              )}
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                isActive
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                  : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                              }`}>
                                {isActive ? "Active" : "Inactive"}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{member.email}</p>
                          </div>
                        </div>

                        {/* Business info */}
                        <div className="flex-1 min-w-0 hidden sm:block">
                          <p className="text-sm font-semibold truncate">
                            {member.business_name ?? <span className="text-muted-foreground font-normal">—</span>}
                          </p>
                          {member.business_category && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{member.business_category}</p>
                          )}
                          {(member as any).phone && (
                            <p className="text-xs text-muted-foreground mt-0.5">{(member as any).phone}</p>
                          )}
                        </div>

                        {/* Role selector */}
                        <div className="flex-shrink-0">
                          {member.role === "chapter_admin" && isSelf ? (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl"
                              style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1" }}>
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                              Chapter Admin
                            </span>
                          ) : (
                            <Select
                              value={member.role}
                              onValueChange={(v) => handleRoleChange(member.id, v as UserRole)}
                              disabled={updatingRole === member.id}>
                              <SelectTrigger className="h-8 w-36 text-xs rounded-xl border-border/60">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="member">Member</SelectItem>
                                <SelectItem value="chapter_admin">Chapter Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>

                        {/* Actions */}
                        {!isSelf ? (
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            {/* Toggle active */}
                            <button
                              className="action-btn text-xs font-semibold px-3 py-1.5 rounded-xl border transition-colors"
                              style={isActive
                                ? { background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.25)", color: "#dc2626" }
                                : { background: "rgba(16,185,129,0.06)", borderColor: "rgba(16,185,129,0.25)", color: "#059669" }
                              }
                              onClick={() => handleToggleActive(member)}>
                              {isActive ? "Deactivate" : "Activate"}
                            </button>

                            {/* Remove */}
                            {removeConfirmId === member.id ? (
                              <div className="remove-confirm flex flex-col gap-1.5">
                                <p className="text-[11px] font-bold text-red-600">Remove permanently?</p>
                                <div className="flex gap-1">
                                  <button
                                    className="action-btn text-[11px] font-bold px-2.5 py-1 rounded-lg text-white border-0"
                                    style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)", boxShadow: "0 2px 8px rgba(239,68,68,0.3)" }}
                                    disabled={removing}
                                    onClick={() => handleRemoveMember(member.id)}>
                                    {removing ? "Removing…" : "Yes, Remove"}
                                  </button>
                                  <button
                                    className="action-btn text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-border/60 bg-background"
                                    disabled={removing}
                                    onClick={() => { setRemoveConfirmId(null); setRemoveError(null); }}>
                                    Cancel
                                  </button>
                                </div>
                                {removeError && <p className="text-[11px] text-red-500">{removeError}</p>}
                              </div>
                            ) : (
                              <button
                                className="action-btn text-xs font-semibold px-3 py-1.5 rounded-xl border"
                                style={{ background: "rgba(239,68,68,0.05)", borderColor: "rgba(239,68,68,0.2)", color: "#dc2626" }}
                                onClick={() => { setRemoveConfirmId(member.id); setRemoveError(null); }}>
                                Remove
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="w-24 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Referrals Tab ── */}
        <TabsContent value="referrals" className="tab-content mt-4">
          <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border/50">
              <h2 className="text-sm font-bold">All Chapter Referrals</h2>
            </div>
            {referrals.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">No referrals yet.</div>
            ) : (
              <div className="divide-y divide-border/40">
                {referrals.map((r, idx) => (
                  <div key={r.id} className="member-row flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4"
                    style={{ animationDelay: `${idx * 40}ms` }}>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{r.referred_person_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{r.business_category ?? "—"}</p>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <span className="font-bold text-sm" style={{ color: "#10b981" }}>{formatCurrency(Number(r.estimated_value))}</span>
                      <StatusPill status={r.status} />
                      <span className="text-xs text-muted-foreground hidden sm:block">{formatDate(r.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Meetings Tab ── */}
        <TabsContent value="meetings" className="tab-content mt-4">
          <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border/50">
              <h2 className="text-sm font-bold">Meeting Management</h2>
            </div>
            {meetings.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">No meetings yet.</div>
            ) : (
              <div className="divide-y divide-border/40">
                {meetings.map((m, idx) => (
                  <div key={m.id} className="member-row flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4"
                    style={{ animationDelay: `${idx * 40}ms` }}>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{m.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(m.meeting_date)}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <StatusPill status={m.status} />
                      {m.status === "scheduled" && (
                        <div className="flex gap-1.5">
                          <button className="action-btn text-xs font-semibold px-3 py-1.5 rounded-xl text-white border-0"
                            style={{ background: "linear-gradient(135deg,#10b981,#06b6d4)", boxShadow: "0 2px 8px rgba(16,185,129,0.25)" }}
                            onClick={() => handleMeetingStatus(m.id, "completed")}>
                            Complete
                          </button>
                          <button className="action-btn text-xs font-semibold px-3 py-1.5 rounded-xl border border-border/60 bg-background"
                            onClick={() => handleMeetingStatus(m.id, "cancelled")}>
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Visitors Tab ── */}
        <TabsContent value="visitors" className="tab-content mt-4">
          <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border/50">
              <h2 className="text-sm font-bold">Visitor Tracking</h2>
            </div>
            {visitors.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">No visitors recorded yet.</div>
            ) : (
              <div className="divide-y divide-border/40">
                {visitors.map((v, idx) => (
                  <div key={v.id} className="member-row flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4"
                    style={{ animationDelay: `${idx * 40}ms` }}>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{v.full_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{v.email ?? v.phone ?? "—"}</p>
                    </div>
                    <div className="hidden sm:block text-sm text-muted-foreground flex-1 min-w-0 truncate">
                      {v.business_name ?? v.business_category ?? "—"}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs text-muted-foreground">{v.visit_date ? formatDate(v.visit_date) : "—"}</span>
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                        v.converted_to_member
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                      }`}>
                        {v.converted_to_member ? "Converted" : "Prospect"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
