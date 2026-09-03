"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import type { Profile, ReferralStatus } from "@/lib/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReferralWithProfiles = any;

interface Props {
  referrals: ReferralWithProfiles[];
  members: Partial<Profile>[];
  currentUserId: string;
  currentProfile: Profile;
}

const STATUS_CONFIG: Record<string, { bg: string; color: string; dot: string }> = {
  pending:   { bg: "rgba(245,158,11,0.1)",  color: "#d97706", dot: "#f59e0b" },
  accepted:  { bg: "rgba(59,130,246,0.1)",  color: "#2563eb", dot: "#3b82f6" },
  completed: { bg: "rgba(34,197,94,0.1)",   color: "#16a34a", dot: "#22c55e" },
  rejected:  { bg: "rgba(239,68,68,0.1)",   color: "#dc2626", dot: "#ef4444" },
};

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}
function formatCurrency(v: number) {
  if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
  return `₹${v}`;
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function ReferralsClient({ referrals, members, currentUserId, currentProfile }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [tab, setTab] = useState<"all" | "sent" | "received">("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [receiverId, setReceiverId] = useState("");
  const [referredName, setReferredName] = useState("");
  const [referredContact, setReferredContact] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedValue, setEstimatedValue] = useState("");

  const sentCount = referrals.filter((r: ReferralWithProfiles) => r.sender_id === currentUserId).length;
  const receivedCount = referrals.filter((r: ReferralWithProfiles) => r.receiver_id === currentUserId).length;

  const filtered = referrals.filter((r: ReferralWithProfiles) => {
    if (tab === "sent" && r.sender_id !== currentUserId) return false;
    if (tab === "received" && r.receiver_id !== currentUserId) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    const q = search.toLowerCase();
    if (q && !r.referred_person_name.toLowerCase().includes(q) &&
        !(r.sender?.full_name ?? "").toLowerCase().includes(q) &&
        !(r.receiver?.full_name ?? "").toLowerCase().includes(q)) return false;
    return true;
  });

  async function handleUpdateStatus(id: string, status: ReferralStatus) {
    await supabase.from("referrals").update({ status }).eq("id", id);
    router.refresh();
  }

  async function handleNewReferral(e: React.FormEvent) {
    e.preventDefault();
    if (!receiverId || !referredName) { setError("Please fill in receiver and referred person name."); return; }
    setSubmitting(true); setError(null);
    const { error: err } = await supabase.from("referrals").insert({
      sender_id: currentUserId,
      receiver_id: receiverId,
      referred_person_name: referredName,
      referred_person_contact: referredContact || null,
      business_category: category || null,
      description: description || null,
      estimated_value: estimatedValue ? parseFloat(estimatedValue) : 0,
      chapter_id: currentProfile.chapter_id,
    });
    setSubmitting(false);
    if (err) { setError(err.message); return; }
    setShowNew(false); resetForm(); router.refresh();
  }

  function resetForm() {
    setReceiverId(""); setReferredName(""); setReferredContact("");
    setCategory(""); setDescription(""); setEstimatedValue(""); setError(null);
  }

  const tabs: { key: "all" | "sent" | "received"; label: string; count: number }[] = [
    { key: "all", label: "All", count: referrals.length },
    { key: "sent", label: "Sent", count: sentCount },
    { key: "received", label: "Received", count: receivedCount },
  ];

  const inputStyle: React.CSSProperties = {
    width: "100%", height: 42, borderRadius: 10, border: "1.5px solid #e2e8f0",
    padding: "0 14px", fontSize: 14, fontWeight: 500, color: "#1e293b",
    background: "white", outline: "none",
  };
  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 6 };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Referrals</h1>
          <p className="text-sm text-slate-500 mt-0.5">{sentCount} sent · {receivedCount} received</p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-95"
          style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)", boxShadow: "0 8px 24px rgba(168,85,247,0.35)" }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Referral
        </button>
      </div>

      {/* Tabs + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.12)" }}>
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
              style={tab === t.key
                ? { background: "linear-gradient(135deg, #a855f7, #6366f1)", color: "white", boxShadow: "0 4px 12px rgba(168,85,247,0.3)" }
                : { color: "#64748b" }}>
              {t.label} ({t.count})
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              className="h-10 pl-10 pr-4 rounded-xl text-sm font-medium text-slate-700 placeholder-slate-400 outline-none transition-all border border-slate-200 bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
              style={{ width: 180 }}
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              suppressHydrationWarning
            />
          </div>
          <select
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 outline-none cursor-pointer"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))" }}>
            <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
            </svg>
          </div>
          <p className="font-bold text-slate-700 mb-1">No referrals found</p>
          <p className="text-sm text-slate-400 mb-4">Try a different filter or create one</p>
          <button onClick={() => setShowNew(true)}
            className="px-5 py-2 rounded-xl text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)" }}>
            Create Referral
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ref: ReferralWithProfiles) => {
            const isSender = ref.sender_id === currentUserId;
            const sc = STATUS_CONFIG[ref.status] ?? STATUS_CONFIG.pending;
            return (
              <div key={ref.id}
                className="rounded-2xl border border-slate-100 bg-white p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Referred person */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-black text-white shrink-0"
                      style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)" }}>
                      {ref.referred_person_name[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-slate-900 truncate">{ref.referred_person_name}</p>
                      {ref.referred_person_contact && (
                        <p className="text-xs text-slate-500">{ref.referred_person_contact}</p>
                      )}
                      {ref.business_category && (
                        <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-1"
                          style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1" }}>
                          {ref.business_category}
                        </span>
                      )}
                      {ref.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">{ref.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Arrow: sender → receiver */}
                  <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={ref.sender?.avatar_url} />
                      <AvatarFallback className="text-[9px] font-black text-white"
                        style={{ background: "linear-gradient(135deg, #6366f1, #38bdf8)" }}>
                        {ref.sender ? initials(ref.sender.full_name) : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-bold text-slate-700">{isSender ? "You" : ref.sender?.full_name}</span>
                    <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={ref.receiver?.avatar_url} />
                      <AvatarFallback className="text-[9px] font-black text-white"
                        style={{ background: "linear-gradient(135deg, #a855f7, #f472b6)" }}>
                        {ref.receiver ? initials(ref.receiver.full_name) : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-bold text-slate-700">{!isSender ? "You" : ref.receiver?.full_name}</span>
                  </div>

                  {/* Status + value + actions */}
                  <div className="flex items-center gap-3 shrink-0 flex-wrap">
                    {ref.estimated_value > 0 && (
                      <span className="text-sm font-black text-slate-700">{formatCurrency(ref.estimated_value)}</span>
                    )}
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full capitalize"
                      style={{ background: sc.bg, color: sc.color }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot }} />
                      {ref.status}
                    </span>
                    {!isSender && ref.status === "pending" && (
                      <div className="flex gap-1">
                        <button className="h-7 px-3 rounded-xl text-xs font-bold text-white"
                          style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)" }}
                          onClick={() => handleUpdateStatus(ref.id, "accepted")}>Accept</button>
                        <button className="h-7 px-3 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 bg-white"
                          onClick={() => handleUpdateStatus(ref.id, "rejected")}>Reject</button>
                      </div>
                    )}
                    {!isSender && ref.status === "accepted" && (
                      <button className="h-7 px-3 rounded-xl text-xs font-bold text-white"
                        style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}
                        onClick={() => handleUpdateStatus(ref.id, "completed")}>Mark Done</button>
                    )}
                    <span className="text-xs text-slate-400 hidden sm:block">{formatDate(ref.created_at)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Referral Dialog */}
      <Dialog open={showNew} onOpenChange={(o) => { setShowNew(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-lg p-0 overflow-hidden border-0 flex flex-col" style={{ maxHeight: "90vh", borderRadius: 24 }}>
          {/* Dialog header */}
          <div className="px-6 pt-5 pb-4 shrink-0" style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.06), rgba(99,102,241,0.06))", borderBottom: "1px solid rgba(99,102,241,0.1)" }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)" }}>
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                </svg>
              </div>
              <div>
                <DialogTitle className="text-base font-black text-slate-900">Give a Referral</DialogTitle>
                <p className="text-xs text-slate-500">Connect a member with someone who needs their service</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleNewReferral} className="flex flex-col min-h-0 flex-1">
            <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-xl text-sm font-medium"
                  style={{ background: "rgba(239,68,68,0.08)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.15)" }}>
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  {error}
                </div>
              )}

              {/* Refer to member */}
              <div>
                <label style={labelStyle}>
                  Refer to <span style={{ color: "#a855f7" }}>*</span>
                </label>
                <div className="relative">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: "#a855f7" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  <select
                    value={receiverId}
                    onChange={(e) => {
                      setReceiverId(e.target.value);
                    }}
                    required
                    suppressHydrationWarning
                    style={{ ...inputStyle, paddingLeft: 40, appearance: "none", cursor: "pointer", color: receiverId ? "#1e293b" : "#94a3b8" }}>
                    <option value="" disabled>Select a member…</option>
                    {members.map((m) => (
                      <option key={m.id!} value={m.id!}>
                        {m.full_name}{m.business_name ? ` — ${m.business_name}` : ""}
                      </option>
                    ))}
                  </select>
                  <svg className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">About the referred person</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              {/* Referred person name */}
              <div>
                <label style={labelStyle}>Full name <span style={{ color: "#a855f7" }}>*</span></label>
                <div className="relative">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  <input style={{ ...inputStyle, paddingLeft: 40 }} placeholder="Ravi Kumar" value={referredName} onChange={(e) => setReferredName(e.target.value)} required suppressHydrationWarning />
                </div>
              </div>

              {/* Contact + Category row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={labelStyle}>Phone / Contact</label>
                  <div className="relative">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                    <input style={{ ...inputStyle, paddingLeft: 40 }} placeholder="+91 98765 00000" value={referredContact} onChange={(e) => setReferredContact(e.target.value)} suppressHydrationWarning />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Business category</label>
                  <div className="relative">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                    </svg>
                    <input style={{ ...inputStyle, paddingLeft: 40 }} placeholder="e.g. Interior Design" value={category} onChange={(e) => setCategory(e.target.value)} suppressHydrationWarning />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  style={{ ...inputStyle, height: 68, padding: "10px 14px", resize: "none" }}
                  placeholder="Brief context — what does this person need?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  suppressHydrationWarning />
              </div>

              {/* Estimated value */}
              <div>
                <label style={labelStyle}>Estimated value</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 pointer-events-none select-none">₹</span>
                  <input type="number" style={{ ...inputStyle, paddingLeft: 28 }} placeholder="0" min="0" value={estimatedValue} onChange={(e) => setEstimatedValue(e.target.value)} suppressHydrationWarning />
                </div>
              </div>
            </div>

            {/* Footer — always visible, never scrolls */}
            <div className="px-6 py-4 flex items-center justify-end gap-3 shrink-0" style={{ borderTop: "1px solid #f1f5f9", background: "#fafafa" }}>
              <button type="button"
                className="px-5 py-2.5 rounded-xl text-sm font-bold border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-all"
                onClick={() => { setShowNew(false); resetForm(); }}>
                Cancel
              </button>
              <button type="submit" disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)", boxShadow: "0 4px 14px rgba(168,85,247,0.35)" }}>
                {submitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Sending…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                    Send Referral
                  </>
                )}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
