"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

interface Props {
  profile: Profile & {
    chapter?: { id: string; name: string; city: string | null } | null;
  };
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

const ROLE_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  chapter_admin: { label: "Chapter Admin", bg: "rgba(168,85,247,0.12)", color: "#a855f7" },
  super_admin:   { label: "Super Admin",   bg: "rgba(239,68,68,0.12)",  color: "#ef4444" },
  member:        { label: "Member",         bg: "rgba(99,102,241,0.12)", color: "#6366f1" },
  visitor:       { label: "Visitor",        bg: "rgba(148,163,184,0.12)",color: "#94a3b8" },
};

const inputStyle: React.CSSProperties = {
  width: "100%", height: 44, borderRadius: 12, border: "1.5px solid #e2e8f0",
  padding: "0 14px", fontSize: 14, fontWeight: 500, color: "#1e293b",
  background: "white", outline: "none",
};
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: "#64748b", display: "block", marginBottom: 6 };

export function ProfileClient({ profile }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [tab, setTab] = useState<"profile" | "business" | "security">("profile");

  // Read ?tab= from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("tab");
    if (t === "business" || t === "security") setTab(t);
  }, []);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState(profile.full_name);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [businessName, setBusinessName] = useState(profile.business_name ?? "");
  const [businessCategory, setBusinessCategory] = useState(profile.business_category ?? "");
  const [businessTagline, setBusinessTagline] = useState(profile.business_tagline ?? "");
  const [businessWebsite, setBusinessWebsite] = useState(profile.business_website ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedin_url ?? "");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSaved, setPwSaved] = useState(false);

  const role = ROLE_CONFIG[profile.role] ?? ROLE_CONFIG.member;

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null); setSaved(false);
    const { error: err } = await supabase.from("profiles").update({
      full_name: fullName, phone: phone || null, bio: bio || null,
      business_name: businessName || null, business_category: businessCategory || null,
      business_tagline: businessTagline || null, business_website: businessWebsite || null,
      linkedin_url: linkedinUrl || null,
    }).eq("id", profile.id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setSaved(true); router.refresh();
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setPwError("Passwords do not match."); return; }
    if (newPassword.length < 8) { setPwError("Password must be at least 8 characters."); return; }
    setPwSaving(true); setPwError(null); setPwSaved(false);
    const { error: err } = await supabase.auth.updateUser({ password: newPassword });
    setPwSaving(false);
    if (err) { setPwError(err.message); return; }
    setPwSaved(true); setNewPassword(""); setConfirmPassword("");
    setTimeout(() => setPwSaved(false), 3000);
  }

  const tabs = [
    { key: "profile" as const, label: "Profile" },
    { key: "business" as const, label: "Business" },
    { key: "security" as const, label: "Security" },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Profile header card */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 flex items-start gap-5">
        <div className="relative shrink-0">
          <Avatar className="w-20 h-20">
            <AvatarImage src={profile.avatar_url ?? undefined} />
            <AvatarFallback className="text-2xl font-black text-white"
              style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)" }}>
              {initials(profile.full_name)}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center"
            style={{ background: "#22c55e" }} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-black text-slate-900 truncate">{profile.full_name}</h1>
          <p className="text-sm text-slate-500 truncate">{profile.email}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ background: role.bg, color: role.color }}>
              {role.label}
            </span>
            {profile.chapter && (
              <span className="text-[11px] font-medium text-slate-500 px-2.5 py-1 rounded-full"
                style={{ background: "rgba(148,163,184,0.1)", border: "1px solid rgba(148,163,184,0.2)" }}>
                {profile.chapter.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 p-1 rounded-2xl w-fit" style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.12)" }}>
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-5 py-2 rounded-xl text-sm font-bold transition-all"
            style={tab === t.key
              ? { background: "linear-gradient(135deg, #a855f7, #6366f1)", color: "white", boxShadow: "0 4px 12px rgba(168,85,247,0.3)" }
              : { color: "#64748b" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === "profile" && (
        <div className="rounded-2xl border border-slate-100 bg-white p-6">
          <h2 className="text-sm font-black text-slate-900 mb-5">Personal Information</h2>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl text-sm font-medium" style={{ background: "rgba(239,68,68,0.1)", color: "#dc2626" }}>{error}</div>
            )}
            {saved && (
              <div className="p-3 rounded-xl text-sm font-medium" style={{ background: "rgba(34,197,94,0.1)", color: "#16a34a" }}>Profile saved successfully!</div>
            )}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label style={labelStyle}>Full name</label>
                <input style={inputStyle} value={fullName} onChange={(e) => setFullName(e.target.value)} required suppressHydrationWarning />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input style={inputStyle} placeholder="+91 98400 00000" value={phone} onChange={(e) => setPhone(e.target.value)} suppressHydrationWarning />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Bio</label>
              <textarea
                style={{ ...inputStyle, height: 88, padding: "10px 14px", resize: "none" }}
                placeholder="A short bio about yourself…"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                suppressHydrationWarning />
            </div>
            <button type="submit" disabled={saving}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)", boxShadow: "0 4px 14px rgba(168,85,247,0.35)" }}>
              {saving ? "Saving…" : "Save Profile"}
            </button>
          </form>
        </div>
      )}

      {/* Business Tab */}
      {tab === "business" && (
        <div className="rounded-2xl border border-slate-100 bg-white p-6">
          <h2 className="text-sm font-black text-slate-900 mb-5">Business Details</h2>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            {saved && (
              <div className="p-3 rounded-xl text-sm font-medium" style={{ background: "rgba(34,197,94,0.1)", color: "#16a34a" }}>Saved successfully!</div>
            )}
            <div>
              <label style={labelStyle}>Business name</label>
              <input style={inputStyle} placeholder="Your Business Pvt. Ltd." value={businessName} onChange={(e) => setBusinessName(e.target.value)} suppressHydrationWarning />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label style={labelStyle}>Category</label>
                <input style={inputStyle} placeholder="Interior Design" value={businessCategory} onChange={(e) => setBusinessCategory(e.target.value)} suppressHydrationWarning />
              </div>
              <div>
                <label style={labelStyle}>Tagline</label>
                <input style={inputStyle} placeholder="Your catchy tagline" value={businessTagline} onChange={(e) => setBusinessTagline(e.target.value)} suppressHydrationWarning />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Website</label>
              <input type="url" style={inputStyle} placeholder="https://yourwebsite.com" value={businessWebsite} onChange={(e) => setBusinessWebsite(e.target.value)} suppressHydrationWarning />
            </div>
            <div>
              <label style={labelStyle}>LinkedIn URL</label>
              <input type="url" style={inputStyle} placeholder="https://linkedin.com/in/yourname" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} suppressHydrationWarning />
            </div>
            <button type="submit" disabled={saving}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #6366f1, #38bdf8)", boxShadow: "0 4px 14px rgba(99,102,241,0.35)" }}>
              {saving ? "Saving…" : "Save Business Info"}
            </button>
          </form>
        </div>
      )}

      {/* Security Tab */}
      {tab === "security" && (
        <div className="rounded-2xl border border-slate-100 bg-white p-6">
          <h2 className="text-sm font-black text-slate-900 mb-5">Change Password</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            {pwError && (
              <div className="p-3 rounded-xl text-sm font-medium" style={{ background: "rgba(239,68,68,0.1)", color: "#dc2626" }}>{pwError}</div>
            )}
            {pwSaved && (
              <div className="p-3 rounded-xl text-sm font-medium" style={{ background: "rgba(34,197,94,0.1)", color: "#16a34a" }}>Password updated successfully!</div>
            )}
            <div>
              <label style={labelStyle}>New password</label>
              <input type="password" style={inputStyle} placeholder="Min. 8 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required suppressHydrationWarning />
            </div>
            <div>
              <label style={labelStyle}>Confirm new password</label>
              <input type="password" style={inputStyle} placeholder="Re-enter new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required suppressHydrationWarning />
            </div>
            <button type="submit" disabled={pwSaving}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #f43f5e, #a855f7)", boxShadow: "0 4px 14px rgba(244,63,94,0.35)" }}>
              {pwSaving ? "Updating…" : "Update Password"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
