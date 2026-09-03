"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Profile } from "@/lib/types";

interface Member extends Profile {
  chapter?: { id: string; name: string; city: string | null } | null;
}
interface Props { members: Member[]; currentProfile: Profile; }

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

const ROLE_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  chapter_admin: { label: "Chapter Admin", bg: "rgba(168,85,247,0.12)", color: "#a855f7" },
  super_admin:   { label: "Super Admin",   bg: "rgba(239,68,68,0.12)",  color: "#ef4444" },
  member:        { label: "Member",         bg: "rgba(99,102,241,0.12)", color: "#6366f1" },
  visitor:       { label: "Visitor",        bg: "rgba(148,163,184,0.12)",color: "#94a3b8" },
};

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg, #a855f7, #6366f1)",
  "linear-gradient(135deg, #6366f1, #38bdf8)",
  "linear-gradient(135deg, #34d399, #38bdf8)",
  "linear-gradient(135deg, #fb923c, #f43f5e)",
  "linear-gradient(135deg, #f472b6, #a855f7)",
  "linear-gradient(135deg, #38bdf8, #34d399)",
];

export function MembersClient({ members, currentProfile }: Props) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const categories = ["All", ...Array.from(new Set(members.map((m) => m.business_category).filter(Boolean) as string[])).sort()];

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    const matchSearch = !q || m.full_name.toLowerCase().includes(q) ||
      (m.business_name ?? "").toLowerCase().includes(q) ||
      (m.business_category ?? "").toLowerCase().includes(q);
    return matchSearch && (categoryFilter === "All" || m.business_category === categoryFilter);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Member Directory</h1>
          <p className="text-sm text-slate-500 mt-0.5">{members.length} active members in your chapter</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl"
          style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.08))", border: "1px solid rgba(99,102,241,0.15)" }}>
          <span className="w-2 h-2 rounded-full" style={{ background: "#6366f1" }} />
          <span className="text-xs font-bold" style={{ color: "#6366f1" }}>{filtered.length} shown</span>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="w-full h-10 pl-10 pr-4 rounded-xl text-sm font-medium text-slate-700 placeholder-slate-400 outline-none transition-all border border-slate-200 bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
            placeholder="Search members…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            suppressHydrationWarning
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.slice(0, 5).map((cat) => (
            <button key={cat} onClick={() => setCategoryFilter(cat)}
              className="px-3 h-10 rounded-xl text-xs font-bold transition-all"
              style={categoryFilter === cat
                ? { background: "linear-gradient(135deg, #a855f7, #6366f1)", color: "white", boxShadow: "0 4px 12px rgba(168,85,247,0.3)" }
                : { background: "white", color: "#64748b", border: "1px solid #e2e8f0" }}>
              {cat}
            </button>
          ))}
          {categories.length > 5 && (
            <select
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 outline-none"
              value={categories.slice(5).includes(categoryFilter) ? categoryFilter : ""}
              onChange={(e) => e.target.value && setCategoryFilter(e.target.value)}>
              <option value="">More…</option>
              {categories.slice(5).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))" }}>
            <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="font-bold text-slate-700 mb-1">No members found</p>
          <p className="text-sm text-slate-400">Try a different search or filter</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((member, i) => {
            const role = ROLE_CONFIG[member.role] ?? ROLE_CONFIG.member;
            const grad = AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length];
            const isMe = member.id === currentProfile.id;
            return (
              <div key={member.id}
                className="rounded-2xl border border-slate-100 bg-white p-5 flex flex-col items-center text-center gap-3 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5">
                <div className="relative">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={member.avatar_url ?? undefined} />
                    <AvatarFallback className="text-lg font-black text-white" style={{ background: grad }}>
                      {initials(member.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  {isMe && (
                    <span className="absolute -bottom-1 -right-1 text-[9px] font-black text-white px-1.5 py-0.5 rounded-full"
                      style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)" }}>YOU</span>
                  )}
                </div>

                <div className="w-full space-y-1">
                  <p className="font-bold text-sm text-slate-900 truncate">{member.full_name}</p>
                  {member.business_name && <p className="text-xs text-slate-500 truncate">{member.business_name}</p>}
                  {member.business_category && (
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1" }}>
                      {member.business_category}
                    </span>
                  )}
                </div>

                {member.business_tagline && (
                  <p className="text-xs text-slate-400 line-clamp-2 italic">&ldquo;{member.business_tagline}&rdquo;</p>
                )}

                <div className="flex gap-2 w-full mt-1">
                  {member.phone && (
                    <a href={`tel:${member.phone}`}
                      className="flex-1 h-8 rounded-xl text-xs font-bold flex items-center justify-center transition-all"
                      style={{ background: "rgba(52,211,153,0.1)", color: "#059669", border: "1px solid rgba(52,211,153,0.2)" }}>
                      Call
                    </a>
                  )}
                  <Link href={`/referrals?new=true&receiver=${member.id}`}
                    className="flex-1 h-8 rounded-xl text-xs font-bold flex items-center justify-center transition-all hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)", color: "white" }}>
                    Refer
                  </Link>
                </div>

                {member.role !== "member" && (
                  <span className="w-full text-center text-[10px] font-bold py-1 rounded-xl"
                    style={{ background: role.bg, color: role.color }}>
                    {role.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
