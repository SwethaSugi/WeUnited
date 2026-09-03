"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type VisitorRow = any;

interface Props {
  visitors: VisitorRow[];
  meetings: { id: string; title: string; meeting_date: string }[];
  profile: Profile;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const inputStyle: React.CSSProperties = {
  width: "100%", height: 42, borderRadius: 10, border: "1.5px solid #e2e8f0",
  padding: "0 14px", fontSize: 14, fontWeight: 500, color: "#1e293b",
  background: "white", outline: "none",
};
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 6 };

const VISITOR_GRADIENTS = [
  "linear-gradient(135deg, #a855f7, #6366f1)",
  "linear-gradient(135deg, #6366f1, #38bdf8)",
  "linear-gradient(135deg, #34d399, #38bdf8)",
  "linear-gradient(135deg, #fb923c, #f43f5e)",
  "linear-gradient(135deg, #f472b6, #a855f7)",
];

export function VisitorsClient({ visitors, meetings, profile }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [showNew, setShowNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [meetingId, setMeetingId] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [notes, setNotes] = useState("");

  const filtered = visitors.filter((v: VisitorRow) => {
    const q = search.toLowerCase();
    return !q || v.full_name.toLowerCase().includes(q) ||
      (v.business_name ?? "").toLowerCase().includes(q) ||
      (v.business_category ?? "").toLowerCase().includes(q);
  });

  const converted = visitors.filter((v: VisitorRow) => v.converted_to_member).length;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName) { setError("Full name is required."); return; }
    setSubmitting(true); setError(null);
    const { error: err } = await supabase.from("visitors").insert({
      full_name: fullName,
      email: email || null,
      phone: phone || null,
      business_name: businessName || null,
      business_category: businessCategory || null,
      chapter_id: profile.chapter_id!,
      invited_by: profile.id,
      meeting_id: meetingId || null,
      visit_date: visitDate || null,
      notes: notes || null,
    });
    setSubmitting(false);
    if (err) { setError(err.message); return; }
    setShowNew(false); resetForm(); router.refresh();
  }

  function resetForm() {
    setFullName(""); setEmail(""); setPhone(""); setBusinessName("");
    setBusinessCategory(""); setMeetingId(""); setVisitDate(""); setNotes(""); setError(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-black text-slate-900 font-display">Visitors</h1>
          <p className="text-sm text-slate-500 mt-0.5">{visitors.length} total · {converted} converted to members</p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="shine-hover press-scale flex items-center gap-2 px-5 py-2.5 rounded-2xl text-white text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)", boxShadow: "0 8px 24px rgba(168,85,247,0.35)" }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Visitor
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          className="w-full h-10 pl-10 pr-4 rounded-xl text-sm font-medium text-slate-700 placeholder-slate-400 outline-none transition-all border border-slate-200 bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
          placeholder="Search visitors…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          suppressHydrationWarning
        />
      </div>

      {/* Stats pills */}
      <div className="flex gap-3">
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl transition-transform duration-300 hover:scale-105"
          style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.08))", border: "1px solid rgba(99,102,241,0.15)" }}>
          <span className="w-2 h-2 rounded-full animate-glow-pulse" style={{ background: "#6366f1" }} />
          <span className="text-xs font-bold" style={{ color: "#6366f1" }}>{visitors.length} visitors</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl transition-transform duration-300 hover:scale-105"
          style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
          <span className="w-2 h-2 rounded-full" style={{ background: "#22c55e" }} />
          <span className="text-xs font-bold" style={{ color: "#16a34a" }}>{converted} converted</span>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))" }}>
            <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </div>
          <p className="font-bold text-slate-700 mb-1">No visitors found</p>
          <p className="text-sm text-slate-400">Try a different search or add one</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-in">
          {filtered.map((v: VisitorRow, i: number) => {
            const grad = VISITOR_GRADIENTS[i % VISITOR_GRADIENTS.length];
            return (
              <div key={v.id}
                className="card-hover rounded-2xl border border-slate-100 bg-white p-5 shadow-elevated"
                style={{ ["--stagger" as string]: Math.min(i, 12) }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black text-white shrink-0 transition-transform duration-300 hover:scale-105 hover:rotate-3"
                      style={{ background: grad }}>
                      {v.full_name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-900">{v.full_name}</p>
                      {v.business_name && <p className="text-xs text-slate-500 truncate max-w-[140px]">{v.business_name}</p>}
                    </div>
                  </div>
                  {v.converted_to_member && (
                    <span className="text-[10px] font-black px-2 py-1 rounded-full text-white shrink-0"
                      style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
                      Member
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  {v.business_category && (
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1" }}>
                      {v.business_category}
                    </span>
                  )}
                  <div className="space-y-1 text-xs text-slate-500 pt-1">
                    {v.email && (
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                        </svg>
                        <span className="truncate">{v.email}</span>
                      </div>
                    )}
                    {v.phone && (
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                        </svg>
                        <span>{v.phone}</span>
                      </div>
                    )}
                    {v.visit_date && (
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                        <span>{formatDate(v.visit_date)}</span>
                      </div>
                    )}
                    {v.invited_by_profile && (
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                        <span>Invited by {v.invited_by_profile.full_name}</span>
                      </div>
                    )}
                    {v.meeting && (
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                        </svg>
                        <span className="truncate">{v.meeting.title}</span>
                      </div>
                    )}
                  </div>
                  {v.notes && (
                    <p className="text-xs text-slate-400 italic line-clamp-2 pt-1">{v.notes}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Visitor Dialog */}
      <Dialog open={showNew} onOpenChange={(o) => { setShowNew(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900">Add Visitor</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            {error && (
              <div className="p-3 rounded-xl text-sm font-medium" style={{ background: "rgba(239,68,68,0.1)", color: "#dc2626" }}>
                {error}
              </div>
            )}
            <div>
              <label style={labelStyle}>Full name *</label>
              <input style={inputStyle} placeholder="Ravi Kumar" value={fullName} onChange={(e) => setFullName(e.target.value)} required suppressHydrationWarning />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={labelStyle}>Email</label>
                <input type="email" style={inputStyle} placeholder="ravi@example.com" value={email} onChange={(e) => setEmail(e.target.value)} suppressHydrationWarning />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input style={inputStyle} placeholder="+91 98765 00000" value={phone} onChange={(e) => setPhone(e.target.value)} suppressHydrationWarning />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Business name</label>
              <input style={inputStyle} placeholder="Ravi Designs" value={businessName} onChange={(e) => setBusinessName(e.target.value)} suppressHydrationWarning />
            </div>
            <div>
              <label style={labelStyle}>Business category</label>
              <input style={inputStyle} placeholder="e.g. Architecture" value={businessCategory} onChange={(e) => setBusinessCategory(e.target.value)} suppressHydrationWarning />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={labelStyle}>Visit date</label>
                <input type="date" style={inputStyle} value={visitDate} onChange={(e) => setVisitDate(e.target.value)} suppressHydrationWarning />
              </div>
              <div>
                <label style={labelStyle}>Meeting</label>
                <Select value={meetingId} onValueChange={setMeetingId}>
                  <SelectTrigger className="rounded-xl border-slate-200 h-11">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    {meetings.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label style={labelStyle}>Notes</label>
              <textarea
                style={{ ...inputStyle, height: 72, padding: "10px 14px", resize: "none" }}
                placeholder="Any notes…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                suppressHydrationWarning />
            </div>
            <DialogFooter className="pt-2">
              <button type="button"
                className="px-5 py-2.5 rounded-xl text-sm font-bold border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-all"
                onClick={() => { setShowNew(false); resetForm(); }}>
                Cancel
              </button>
              <button type="submit" disabled={submitting}
                className="shine-hover press-scale px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)", boxShadow: "0 4px 14px rgba(168,85,247,0.35)" }}>
                {submitting ? "Saving…" : "Add Visitor"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
