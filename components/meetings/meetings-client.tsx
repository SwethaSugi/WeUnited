"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import type { Meeting, Profile } from "@/lib/types";

interface Props {
  meetings: Meeting[];
  profile: Profile;
}

const STATUS_CONFIG: Record<string, { bg: string; color: string; dot: string }> = {
  scheduled: { bg: "rgba(99,102,241,0.1)",  color: "#6366f1", dot: "#6366f1" },
  completed: { bg: "rgba(34,197,94,0.1)",   color: "#16a34a", dot: "#22c55e" },
  cancelled: { bg: "rgba(239,68,68,0.1)",   color: "#dc2626", dot: "#ef4444" },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "long", year: "numeric",
  });
}

const inputStyle: React.CSSProperties = {
  width: "100%", height: 42, borderRadius: 10, border: "1.5px solid #e2e8f0",
  padding: "0 14px", fontSize: 14, fontWeight: 500, color: "#1e293b",
  background: "white", outline: "none",
};
const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 6,
};

export function MeetingsClient({ meetings: initialMeetings, profile }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const isAdmin = profile.role === "chapter_admin" || profile.role === "super_admin";

  const [meetings, setMeetings] = useState(initialMeetings);

  // ── Create modal ──
  const [showNew, setShowNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ── Edit modal ──
  const [editMeeting, setEditMeeting] = useState<Meeting | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  // ── Delete confirm ──
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [filter, setFilter] = useState<"all" | "scheduled" | "completed">("all");

  // ── Create form fields ──
  const [title, setTitle]       = useState("");
  const [date, setDate]         = useState("");
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime]   = useState("09:00");
  const [venue, setVenue]       = useState("");
  const [agenda, setAgenda]     = useState("");

  // ── Edit form fields ──
  const [eTitle, setETitle]         = useState("");
  const [eDate, setEDate]           = useState("");
  const [eStartTime, setEStartTime] = useState("");
  const [eEndTime, setEEndTime]     = useState("");
  const [eVenue, setEVenue]         = useState("");
  const [eAgenda, setEAgenda]       = useState("");
  const [eStatus, setEStatus]       = useState("scheduled");

  const upcoming      = meetings.filter((m) => m.status === "scheduled");
  const completedList = meetings.filter((m) => m.status === "completed");
  const filtered      = meetings.filter((m) => filter === "all" || m.status === filter);

  // ── Create ───────────────────────────────────────────────────────────────
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !date) { setFormError("Title and date are required."); return; }
    setSubmitting(true); setFormError(null);
    const { data, error: err } = await supabase.from("meetings").insert({
      chapter_id: profile.chapter_id!,
      title, meeting_date: date,
      start_time: startTime || null, end_time: endTime || null,
      venue: venue || null, agenda: agenda || null,
      created_by: profile.id,
    }).select().single();
    setSubmitting(false);
    if (err) { setFormError(err.message); return; }
    if (data) {
      setMeetings((prev) => [data as Meeting, ...prev]);
      // Notify all active chapter members via server route (bypasses RLS)
      const { data: members } = await supabase
        .from("profiles")
        .select("id")
        .eq("chapter_id", profile.chapter_id!)
        .eq("is_active", true)
        .neq("id", profile.id);
      if (members && members.length > 0) {
        await fetch("/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notifications: members.map((m) => ({
              user_id: m.id,
              title: "📅 New Meeting Scheduled",
              message: `${data.title} on ${formatDate(data.meeting_date)}${data.venue ? ` at ${data.venue}` : ""}`,
              type: "meeting",
              is_read: false,
              link: "/meetings",
            })),
          }),
        });
      }
    }
    setShowNew(false); resetCreate();
  }

  function resetCreate() {
    setTitle(""); setDate(""); setStartTime("07:00"); setEndTime("09:00");
    setVenue(""); setAgenda(""); setFormError(null);
  }

  // ── Open edit ────────────────────────────────────────────────────────────
  function openEdit(m: Meeting) {
    setEditMeeting(m);
    setETitle(m.title);
    setEDate(m.meeting_date);
    setEStartTime(m.start_time?.slice(0, 5) ?? "");
    setEEndTime(m.end_time?.slice(0, 5) ?? "");
    setEVenue(m.venue ?? "");
    setEAgenda(m.agenda ?? "");
    setEStatus(m.status);
    setFormError(null);
  }

  // ── Save edit ────────────────────────────────────────────────────────────
  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editMeeting) return;
    if (!eTitle || !eDate) { setFormError("Title and date are required."); return; }
    setEditSubmitting(true); setFormError(null);
    const { error: err } = await supabase.from("meetings").update({
      title: eTitle, meeting_date: eDate,
      start_time: eStartTime || null, end_time: eEndTime || null,
      venue: eVenue || null, agenda: eAgenda || null,
      status: eStatus,
    }).eq("id", editMeeting.id);
    setEditSubmitting(false);
    if (err) { setFormError(err.message); return; }
    setMeetings((prev) => prev.map((m) =>
      m.id === editMeeting.id
        ? { ...m, title: eTitle, meeting_date: eDate, start_time: eStartTime || null, end_time: eEndTime || null, venue: eVenue || null, agenda: eAgenda || null, status: eStatus as Meeting["status"] }
        : m
    ));
    setEditMeeting(null);
    router.refresh();
  }

  // ── Delete ───────────────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    setDeletingId(id);
    setDeleteError(null);
    const { error: err } = await supabase.from("meetings").delete().eq("id", id);
    setDeletingId(null);
    if (err) {
      setDeleteError(err.message);
      setConfirmDeleteId(null);
      return;
    }
    setConfirmDeleteId(null);
    setMeetings((prev) => prev.filter((m) => m.id !== id));
    router.refresh();
  }

  const filterTabs = [
    { key: "all" as const,       label: "All",       count: meetings.length },
    { key: "scheduled" as const, label: "Upcoming",  count: upcoming.length },
    { key: "completed" as const, label: "Completed", count: completedList.length },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Meetings</h1>
          <p className="text-sm text-slate-500 mt-0.5">{upcoming.length} upcoming · {completedList.length} completed</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-white text-sm font-bold transition-all hover:opacity-90 active:scale-95"
            style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)", boxShadow: "0 8px 24px rgba(168,85,247,0.35)" }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Schedule Meeting
          </button>
        )}
      </div>

      {/* ── Delete error banner ── */}
      {deleteError && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-medium"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#dc2626" }}>
          <span>⚠ Delete failed: {deleteError}</span>
          <button onClick={() => setDeleteError(null)} className="text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* ── Filter pills ── */}
      <div className="flex gap-1 p-1 rounded-2xl w-fit" style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.12)" }}>
        {filterTabs.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all"
            style={filter === f.key
              ? { background: "linear-gradient(135deg, #a855f7, #6366f1)", color: "white", boxShadow: "0 4px 12px rgba(168,85,247,0.3)" }
              : { color: "#64748b" }}>
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {/* ── Meeting cards ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1))" }}>
            <svg className="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">No meetings found</p>
          <p className="text-sm text-slate-400">Try a different filter</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((meeting) => {
            const sc = STATUS_CONFIG[meeting.status] ?? STATUS_CONFIG.scheduled;
            const isConfirmingDelete = confirmDeleteId === meeting.id;
            return (
              <div key={meeting.id}
                className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-black text-sm text-slate-900 dark:text-white">{meeting.title}</h3>
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full capitalize"
                        style={{ background: sc.bg, color: sc.color }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot }} />
                        {meeting.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                      </svg>
                      <span className="font-medium">{formatDate(meeting.meeting_date)}</span>
                      {meeting.start_time && (
                        <>
                          <span className="text-slate-300">·</span>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{meeting.start_time.slice(0, 5)}{meeting.end_time && ` – ${meeting.end_time.slice(0, 5)}`}</span>
                        </>
                      )}
                    </div>
                    {meeting.venue && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                        <span>{meeting.venue}</span>
                      </div>
                    )}
                  </div>

                  {/* ── Admin actions ── */}
                  {isAdmin && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!isConfirmingDelete ? (
                        <>
                          <button onClick={() => openEdit(meeting)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-1.414.914l-3 1 1-3a4 4 0 01.914-1.414z" />
                            </svg>
                            Edit
                          </button>
                          <button onClick={() => { setConfirmDeleteId(meeting.id); setDeleteError(null); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Sure?</span>
                          <button onClick={() => handleDelete(meeting.id)} disabled={deletingId === meeting.id}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-60 transition-colors">
                            {deletingId === meeting.id ? "Deleting…" : "Yes, delete"}
                          </button>
                          <button onClick={() => setConfirmDeleteId(null)}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {meeting.agenda && (
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Agenda</p>
                    <pre className="text-xs text-slate-500 whitespace-pre-wrap font-sans line-clamp-3">{meeting.agenda}</pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create Meeting Dialog ── */}
      <Dialog open={showNew} onOpenChange={(o) => { setShowNew(o); if (!o) resetCreate(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-black">Schedule a Meeting</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            {formError && (
              <div className="p-3 rounded-xl text-sm font-medium" style={{ background: "rgba(239,68,68,0.1)", color: "#dc2626" }}>
                {formError}
              </div>
            )}
            <div>
              <label style={labelStyle}>Title *</label>
              <input style={inputStyle} placeholder="Weekly Chapter Meeting" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={labelStyle}>Date *</label>
                <input type="date" style={inputStyle} value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>Start Time</label>
                <input type="time" style={inputStyle} value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={labelStyle}>End Time</label>
                <input type="time" style={inputStyle} value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Venue</label>
                <input style={inputStyle} placeholder="Hotel Residency" value={venue} onChange={(e) => setVenue(e.target.value)} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Agenda</label>
              <textarea style={{ ...inputStyle, height: 88, padding: "10px 14px", resize: "none" }}
                placeholder={"1. Introductions\n2. Education\n3. Referrals"}
                value={agenda} onChange={(e) => setAgenda(e.target.value)} />
            </div>
            <DialogFooter className="pt-2">
              <button type="button" onClick={() => { setShowNew(false); resetCreate(); }}
                className="px-5 py-2.5 rounded-xl text-sm font-bold border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-all">
                Cancel
              </button>
              <button type="submit" disabled={submitting}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)", boxShadow: "0 4px 14px rgba(168,85,247,0.35)" }}>
                {submitting ? "Saving…" : "Schedule"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Edit Meeting Dialog ── */}
      <Dialog open={!!editMeeting} onOpenChange={(o) => { if (!o) setEditMeeting(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-black">Edit Meeting</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 pt-2">
            {formError && (
              <div className="p-3 rounded-xl text-sm font-medium" style={{ background: "rgba(239,68,68,0.1)", color: "#dc2626" }}>
                {formError}
              </div>
            )}
            <div>
              <label style={labelStyle}>Title *</label>
              <input style={inputStyle} value={eTitle} onChange={(e) => setETitle(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={labelStyle}>Date *</label>
                <input type="date" style={inputStyle} value={eDate} onChange={(e) => setEDate(e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>Start Time</label>
                <input type="time" style={inputStyle} value={eStartTime} onChange={(e) => setEStartTime(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label style={labelStyle}>End Time</label>
                <input type="time" style={inputStyle} value={eEndTime} onChange={(e) => setEEndTime(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Venue</label>
                <input style={inputStyle} value={eVenue} onChange={(e) => setEVenue(e.target.value)} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select style={{ ...inputStyle, cursor: "pointer" }} value={eStatus} onChange={(e) => setEStatus(e.target.value)}>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Agenda</label>
              <textarea style={{ ...inputStyle, height: 88, padding: "10px 14px", resize: "none" }}
                value={eAgenda} onChange={(e) => setEAgenda(e.target.value)} />
            </div>
            <DialogFooter className="pt-2">
              <button type="button" onClick={() => setEditMeeting(null)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-all">
                Cancel
              </button>
              <button type="submit" disabled={editSubmitting}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)", boxShadow: "0 4px 14px rgba(168,85,247,0.35)" }}>
                {editSubmitting ? "Saving…" : "Save Changes"}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
