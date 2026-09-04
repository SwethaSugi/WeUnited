"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
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

  // ── Create ──
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

  // ── Edit ──
  const [editVisitor, setEditVisitor] = useState<VisitorRow | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [eName, setEName] = useState("");
  const [eEmail, setEEmail] = useState("");
  const [ePhone, setEPhone] = useState("");
  const [eBizName, setEBizName] = useState("");
  const [eBizCat, setEBizCat] = useState("");
  const [eMeetingId, setEMeetingId] = useState("");
  const [eVisitDate, setEVisitDate] = useState("");
  const [eNotes, setENotes] = useState("");

  // ── Delete ──
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // ── Tab ──
  const [activeTab, setActiveTab] = useState<"mine" | "all">("all");

  // Role helpers
  const isPrivileged = profile.role === "chapter_admin" || profile.role === "super_admin";
  function canManage(v: VisitorRow) {
    return isPrivileged || v.invited_by === profile.id;
  }

  const myVisitors = visitors.filter((v: VisitorRow) => v.invited_by === profile.id);
  const tabVisitors = activeTab === "mine" ? myVisitors : visitors;

  const filtered = tabVisitors.filter((v: VisitorRow) => {
    const q = search.toLowerCase();
    return !q || v.full_name.toLowerCase().includes(q) ||
      (v.business_name ?? "").toLowerCase().includes(q) ||
      (v.business_category ?? "").toLowerCase().includes(q);
  });

  const converted = visitors.filter((v: VisitorRow) => v.converted_to_member).length;

  // Filter meetings by selected visit date
  const filteredMeetings = visitDate
    ? meetings.filter((m) => m.meeting_date === visitDate)
    : meetings;
  const editFilteredMeetings = eVisitDate
    ? meetings.filter((m) => m.meeting_date === eVisitDate)
    : meetings;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName) { setError("Full name is required."); return; }
    if (!email) { setError("Email is required."); return; }
    if (!phone) { setError("Phone is required."); return; }
    if (!businessName) { setError("Business name is required."); return; }
    if (!businessCategory) { setError("Business category is required."); return; }
    if (!visitDate) { setError("Visit date is required."); return; }
    if (!meetingId) { setError("Please select a meeting."); return; }
    setSubmitting(true); setError(null);
    const { error: err } = await supabase.from("visitors").insert({
      full_name: fullName, email, phone,
      business_name: businessName, business_category: businessCategory,
      chapter_id: profile.chapter_id!, invited_by: profile.id,
      meeting_id: meetingId, visit_date: visitDate,
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

  function openEdit(v: VisitorRow) {
    setEditVisitor(v);
    setEName(v.full_name ?? "");
    setEEmail(v.email ?? "");
    setEPhone(v.phone ?? "");
    setEBizName(v.business_name ?? "");
    setEBizCat(v.business_category ?? "");
    setEVisitDate(v.visit_date ?? "");
    setEMeetingId(v.meeting_id ?? "");
    setENotes(v.notes ?? "");
    setEditError(null);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editVisitor) return;
    if (!eName) { setEditError("Full name is required."); return; }
    if (!eEmail) { setEditError("Email is required."); return; }
    if (!ePhone) { setEditError("Phone is required."); return; }
    if (!eBizName) { setEditError("Business name is required."); return; }
    if (!eBizCat) { setEditError("Business category is required."); return; }
    if (!eVisitDate) { setEditError("Visit date is required."); return; }
    if (!eMeetingId) { setEditError("Please select a meeting."); return; }
    setEditSubmitting(true); setEditError(null);
    const { error: err } = await supabase.from("visitors").update({
      full_name: eName, email: eEmail, phone: ePhone,
      business_name: eBizName, business_category: eBizCat,
      meeting_id: eMeetingId, visit_date: eVisitDate,
      notes: eNotes || null,
    }).eq("id", editVisitor.id);
    setEditSubmitting(false);
    if (err) { setEditError(err.message); return; }
    setEditVisitor(null); router.refresh();
  }

  function downloadVisitorCard(v: VisitorRow) {
    const W = 900, H = 500;
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#1e1b4b");
    grad.addColorStop(1, "#312e81");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Decorative circles
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = "#a5b4fc";
    ctx.beginPath(); ctx.arc(W - 80, 80, 180, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(80, H + 40, 160, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // Left accent bar
    const accent = ctx.createLinearGradient(0, 0, 0, H);
    accent.addColorStop(0, "#818cf8");
    accent.addColorStop(1, "#a78bfa");
    ctx.fillStyle = accent;
    ctx.fillRect(0, 0, 6, H);

    // "VISITOR PASS" label top-left
    ctx.font = "bold 11px sans-serif";
    ctx.letterSpacing = "3px";
    ctx.fillStyle = "rgba(165,180,252,0.7)";
    ctx.fillText("VISITOR PASS", 32, 38);
    ctx.letterSpacing = "0px";

    // Avatar circle
    const initials = (v.full_name ?? "?").split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
    const cx = 110, cy = 200;
    const avatarGrad = ctx.createLinearGradient(cx - 60, cy - 60, cx + 60, cy + 60);
    avatarGrad.addColorStop(0, "#818cf8");
    avatarGrad.addColorStop(1, "#a78bfa");
    ctx.fillStyle = avatarGrad;
    ctx.beginPath(); ctx.arc(cx, cy, 68, 0, Math.PI * 2); ctx.fill();
    ctx.font = "bold 36px sans-serif";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.fillText(initials, cx, cy + 13);
    ctx.textAlign = "left";

    // Name
    ctx.font = "bold 36px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(v.full_name ?? "", 210, 150);

    // Business name
    if (v.business_name) {
      ctx.font = "500 20px sans-serif";
      ctx.fillStyle = "rgba(199,210,254,0.9)";
      ctx.fillText(v.business_name, 210, 185);
    }

    // Category chip
    if (v.business_category) {
      ctx.save();
      const chipX = 210, chipY = 205, chipW = Math.min(ctx.measureText(v.business_category).width + 24, 260), chipH = 28;
      ctx.fillStyle = "rgba(129,140,248,0.25)";
      ctx.beginPath();
      ctx.roundRect(chipX, chipY, chipW, chipH, 14);
      ctx.fill();
      ctx.font = "bold 12px sans-serif";
      ctx.fillStyle = "#a5b4fc";
      ctx.fillText(v.business_category, chipX + 12, chipY + 19);
      ctx.restore();
    }

    // Details — icons as text symbols, values
    const details: [string, string][] = [];
    if (v.email) details.push(["✉", v.email]);
    if (v.phone) details.push(["✆", v.phone]);
    if (v.visit_date) details.push(["📅", formatDate(v.visit_date)]);
    if (v.invited_by_profile?.full_name) details.push(["👤", `Invited by ${v.invited_by_profile.full_name}`]);
    if (v.meeting?.title) details.push(["📋", v.meeting.title]);

    let dy = 265;
    details.forEach(([icon, text]) => {
      ctx.font = "14px sans-serif";
      ctx.fillStyle = "rgba(165,180,252,0.6)";
      ctx.fillText(icon, 210, dy);
      ctx.fillStyle = "rgba(224,231,255,0.9)";
      ctx.fillText(text, 235, dy);
      dy += 30;
    });

    // Divider
    ctx.fillStyle = "rgba(165,180,252,0.15)";
    ctx.fillRect(32, H - 64, W - 64, 1);

    // Footer
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "rgba(165,180,252,0.5)";
    ctx.fillText("We United", 32, H - 28);

    // Load logo and draw, then download
    const img = new Image();
    img.onload = () => {
      const lh = 40, lw = (img.width / img.height) * lh;
      ctx.drawImage(img, W - lw - 32, 18, lw, lh);
      const link = document.createElement("a");
      link.download = `visitor-${(v.full_name ?? "card").toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.onerror = () => {
      // Download without logo if it fails to load
      const link = document.createElement("a");
      link.download = `visitor-${(v.full_name ?? "card").toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "/logo.jpg";
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/visitors?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        setDeleteError(json.error ?? "Failed to delete visitor");
        setDeletingId(null);
        return;
      }
    } catch {
      setDeleteError("Network error — please try again");
      setDeletingId(null);
      return;
    }
    setDeletingId(null);
    setConfirmDeleteId(null);
    router.refresh();
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

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl w-fit"
        style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.1)" }}>
        {(["all", "mine"] as const).map((tab) => {
          const count = tab === "all" ? visitors.length : myVisitors.length;
          const label = tab === "all" ? "All Visitors" : "My Visitors";
          const active = activeTab === tab;
          return (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-200"
              style={active
                ? { background: "white", color: "#6366f1", boxShadow: "0 2px 8px rgba(99,102,241,0.15)" }
                : { color: "#94a3b8" }}>
              {label}
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
                style={active
                  ? { background: "rgba(99,102,241,0.1)", color: "#6366f1" }
                  : { background: "rgba(148,163,184,0.15)", color: "#94a3b8" }}>
                {count}
              </span>
            </button>
          );
        })}
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
          <p className="font-bold text-slate-700 mb-1">
            {activeTab === "mine" ? "You haven't added any visitors yet" : "No visitors found"}
          </p>
          <p className="text-sm text-slate-400">
            {activeTab === "mine" ? "Click Add Visitor to register your first guest" : "Try a different search or add one"}
          </p>
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
                  <div className="flex items-center gap-1.5 shrink-0">
                    {v.converted_to_member && (
                      <span className="text-[10px] font-black px-2 py-1 rounded-full text-white"
                        style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)" }}>
                        Member
                      </span>
                    )}
                    {/* Download card — visible to all */}
                    <button
                      onClick={() => downloadVisitorCard(v)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                      style={{ background: "rgba(99,102,241,0.06)", color: "#94a3b8" }}
                      title="Download visitor card">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                      </svg>
                    </button>
                    {/* Edit button — only for owner / admins */}
                    {canManage(v) && (
                    <button
                      onClick={() => openEdit(v)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                      style={{ background: "rgba(99,102,241,0.08)", color: "#6366f1" }}
                      title="Edit visitor">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 7.125L18 6" />
                      </svg>
                    </button>
                    )}
                    {/* Delete button / confirm — only for owner / admins */}
                    {canManage(v) && (
                      confirmDeleteId === v.id ? (
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(v.id)}
                              disabled={deletingId === v.id}
                              className="text-[10px] font-bold px-2 py-1 rounded-lg text-white transition-all hover:opacity-90 disabled:opacity-60"
                              style={{ background: "#ef4444" }}>
                              {deletingId === v.id ? "…" : "Yes, delete"}
                            </button>
                            <button
                              onClick={() => { setConfirmDeleteId(null); setDeleteError(null); }}
                              className="text-[10px] font-bold px-2 py-1 rounded-lg transition-all"
                              style={{ background: "rgba(100,116,139,0.1)", color: "#64748b" }}>
                              No
                            </button>
                          </div>
                          {deleteError && confirmDeleteId === v.id && (
                            <p className="text-[10px] text-red-500 font-medium max-w-[160px] text-right">{deleteError}</p>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(v.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                          style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444" }}
                          title="Delete visitor">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                      )
                    )}
                  </div>
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

      {/* Edit Visitor Dialog */}
      <Dialog open={!!editVisitor} onOpenChange={(o) => { if (!o) setEditVisitor(null); }}>
        <DialogContent className="max-w-lg p-0 overflow-hidden border-0 flex flex-col" style={{ maxHeight: "90vh", borderRadius: 24 }}>

          {/* Gradient header */}
          <div className="px-6 pt-5 pb-4 shrink-0"
            style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.06), rgba(20,184,166,0.06))", borderBottom: "1px solid rgba(99,102,241,0.1)" }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, #6366f1, #14b8a6)" }}>
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                </svg>
              </div>
              <div>
                <DialogTitle className="text-base font-black text-slate-900">Edit Visitor</DialogTitle>
                <p className="text-xs text-slate-500">Update visitor details</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleEdit} className="flex flex-col min-h-0 flex-1">
            <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">

              {editError && (
                <div className="flex items-center gap-2 p-3 rounded-xl text-sm font-medium"
                  style={{ background: "rgba(239,68,68,0.08)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.15)" }}>
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  {editError}
                </div>
              )}

              {/* Full name */}
              <div>
                <label style={labelStyle}>Full name <span style={{ color: "#6366f1" }}>*</span></label>
                <div className="relative">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  <input style={{ ...inputStyle, paddingLeft: 40 }} placeholder="Enter visitor's full name" value={eName} onChange={(e) => setEName(e.target.value)} required suppressHydrationWarning />
                </div>
              </div>

              {/* Email + Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={labelStyle}>Email <span style={{ color: "#6366f1" }}>*</span></label>
                  <div className="relative">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                    <input type="email" style={{ ...inputStyle, paddingLeft: 40 }} placeholder="Enter email address" value={eEmail} onChange={(e) => setEEmail(e.target.value)} required suppressHydrationWarning />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Phone <span style={{ color: "#6366f1" }}>*</span></label>
                  <div className="relative">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                    <input style={{ ...inputStyle, paddingLeft: 40 }} placeholder="Enter phone number" value={ePhone} onChange={(e) => setEPhone(e.target.value)} required suppressHydrationWarning />
                  </div>
                </div>
              </div>

              {/* Business name */}
              <div>
                <label style={labelStyle}>Business name <span style={{ color: "#6366f1" }}>*</span></label>
                <div className="relative">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                  </svg>
                  <input style={{ ...inputStyle, paddingLeft: 40 }} placeholder="Enter business name" value={eBizName} onChange={(e) => setEBizName(e.target.value)} required suppressHydrationWarning />
                </div>
              </div>

              {/* Business category */}
              <div>
                <label style={labelStyle}>Business category <span style={{ color: "#6366f1" }}>*</span></label>
                <div className="relative">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                  </svg>
                  <input style={{ ...inputStyle, paddingLeft: 40 }} placeholder="Enter business category" value={eBizCat} onChange={(e) => setEBizCat(e.target.value)} required suppressHydrationWarning />
                </div>
              </div>

              {/* Visit date + Meeting */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={labelStyle}>Visit date <span style={{ color: "#6366f1" }}>*</span></label>
                  <div className="relative">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                    <input type="date" style={{ ...inputStyle, paddingLeft: 40 }} value={eVisitDate}
                      onChange={(e) => { setEVisitDate(e.target.value); setEMeetingId(""); }}
                      required suppressHydrationWarning />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Meeting <span style={{ color: "#6366f1" }}>*</span></label>
                  <Select value={eMeetingId} onValueChange={setEMeetingId}>
                    <SelectTrigger className="rounded-xl border-slate-200 h-11">
                      <SelectValue placeholder={eVisitDate && editFilteredMeetings.length === 0 ? "No meetings on this date" : "Select a meeting"} />
                    </SelectTrigger>
                    <SelectContent>
                      {editFilteredMeetings.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-slate-400 italic">
                          {eVisitDate ? "No meetings scheduled on this date" : "Select a date first"}
                        </div>
                      ) : (
                        editFilteredMeetings.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.title}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={labelStyle}>Notes</label>
                <textarea
                  style={{ ...inputStyle, height: 72, padding: "10px 14px", resize: "none" }}
                  placeholder="Add any notes about this visitor"
                  value={eNotes}
                  onChange={(e) => setENotes(e.target.value)}
                  suppressHydrationWarning />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 flex items-center justify-end gap-3 shrink-0"
              style={{ borderTop: "1px solid #f1f5f9", background: "#fafafa" }}>
              <button type="button"
                className="px-5 py-2.5 rounded-xl text-sm font-bold border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-all"
                onClick={() => setEditVisitor(null)}>
                Cancel
              </button>
              <button type="submit" disabled={editSubmitting}
                className="shine-hover press-scale flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #6366f1, #14b8a6)", boxShadow: "0 4px 14px rgba(99,102,241,0.35)" }}>
                {editSubmitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Saving…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Visitor Dialog */}
      <Dialog open={showNew} onOpenChange={(o) => { setShowNew(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-lg p-0 overflow-hidden border-0 flex flex-col" style={{ maxHeight: "90vh", borderRadius: 24 }}>

          {/* Gradient header */}
          <div className="px-6 pt-5 pb-4 shrink-0"
            style={{ background: "linear-gradient(135deg, rgba(251,146,60,0.06), rgba(244,114,182,0.06))", borderBottom: "1px solid rgba(251,146,60,0.1)" }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, #fb923c, #f472b6)" }}>
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div>
                <DialogTitle className="text-base font-black text-slate-900">Add a Visitor</DialogTitle>
                <p className="text-xs text-slate-500">Register a guest visiting your chapter</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleCreate} className="flex flex-col min-h-0 flex-1">
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

              {/* Full name */}
              <div>
                <label style={labelStyle}>Full name <span style={{ color: "#fb923c" }}>*</span></label>
                <div className="relative">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  <input style={{ ...inputStyle, paddingLeft: 40 }} placeholder="Enter visitor's full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required suppressHydrationWarning />
                </div>
              </div>

              {/* Email + Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={labelStyle}>Email <span style={{ color: "#fb923c" }}>*</span></label>
                  <div className="relative">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                    <input type="email" style={{ ...inputStyle, paddingLeft: 40 }} placeholder="Enter email address" value={email} onChange={(e) => setEmail(e.target.value)} required suppressHydrationWarning />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Phone <span style={{ color: "#fb923c" }}>*</span></label>
                  <div className="relative">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                    <input style={{ ...inputStyle, paddingLeft: 40 }} placeholder="Enter phone number" value={phone} onChange={(e) => setPhone(e.target.value)} required suppressHydrationWarning />
                  </div>
                </div>
              </div>

              {/* Business name */}
              <div>
                <label style={labelStyle}>Business name <span style={{ color: "#fb923c" }}>*</span></label>
                <div className="relative">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                  </svg>
                  <input style={{ ...inputStyle, paddingLeft: 40 }} placeholder="Enter business name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required suppressHydrationWarning />
                </div>
              </div>

              {/* Business category */}
              <div>
                <label style={labelStyle}>Business category <span style={{ color: "#fb923c" }}>*</span></label>
                <div className="relative">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                  </svg>
                  <input style={{ ...inputStyle, paddingLeft: 40 }} placeholder="Enter business category" value={businessCategory} onChange={(e) => setBusinessCategory(e.target.value)} required suppressHydrationWarning />
                </div>
              </div>

              {/* Visit date + Meeting */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label style={labelStyle}>Visit date <span style={{ color: "#fb923c" }}>*</span></label>
                  <div className="relative">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                    <input type="date" style={{ ...inputStyle, paddingLeft: 40 }} value={visitDate}
                      onChange={(e) => { setVisitDate(e.target.value); setMeetingId(""); }}
                      required suppressHydrationWarning />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Meeting <span style={{ color: "#fb923c" }}>*</span></label>
                  <Select value={meetingId} onValueChange={setMeetingId}>
                    <SelectTrigger className="rounded-xl border-slate-200 h-11">
                      <SelectValue placeholder={visitDate && filteredMeetings.length === 0 ? "No meetings on this date" : "Select a meeting"} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredMeetings.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-slate-400 italic">
                          {visitDate ? "No meetings scheduled on this date" : "Select a date first"}
                        </div>
                      ) : (
                        filteredMeetings.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.title}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={labelStyle}>Notes</label>
                <textarea
                  style={{ ...inputStyle, height: 72, padding: "10px 14px", resize: "none" }}
                  placeholder="Add any notes about this visitor"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  suppressHydrationWarning />
              </div>
            </div>

            {/* Footer — always visible */}
            <div className="px-6 py-4 flex items-center justify-end gap-3 shrink-0"
              style={{ borderTop: "1px solid #f1f5f9", background: "#fafafa" }}>
              <button type="button"
                className="px-5 py-2.5 rounded-xl text-sm font-bold border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-all"
                onClick={() => { setShowNew(false); resetForm(); }}>
                Cancel
              </button>
              <button type="submit" disabled={submitting}
                className="shine-hover press-scale flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #fb923c, #f472b6)", boxShadow: "0 4px 14px rgba(251,146,60,0.35)" }}>
                {submitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Saving…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Add Visitor
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
