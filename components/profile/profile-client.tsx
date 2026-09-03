"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { BUSINESS_CATEGORIES } from "@/lib/constants";
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

const inputCls =
  "w-full h-11 rounded-xl border border-slate-200 px-3.5 text-sm font-medium text-slate-800 bg-white outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all placeholder:text-slate-400 placeholder:font-normal";
const readonlyCls =
  "w-full h-11 rounded-xl border border-slate-100 px-3.5 text-sm font-medium text-slate-500 bg-slate-50 cursor-default flex items-center gap-2";

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function ReadonlyField({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <div className={readonlyCls}>
        <svg
          className="w-3.5 h-3.5 text-slate-300 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <span className="truncate">{value || "—"}</span>
      </div>
    </Field>
  );
}

export function ProfileClient({ profile }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [tab, setTab] = useState<"profile" | "business" | "security">("profile");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("tab");
    if (t === "business" || t === "security") setTab(t as typeof tab);
  }, []);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Profile fields
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");

  // Business fields
  const [businessName, setBusinessName] = useState(profile.business_name ?? "");
  const [businessCategory, setBusinessCategory] = useState(profile.business_category ?? "");
  const [businessTagline, setBusinessTagline] = useState(profile.business_tagline ?? "");
  const [businessWebsite, setBusinessWebsite] = useState(profile.business_website ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedin_url ?? "");

  // Password fields
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSaved, setPwSaved] = useState(false);

  const role = ROLE_CONFIG[profile.role] ?? ROLE_CONFIG.member;
  const chapterLabel = profile.chapter
    ? `${profile.chapter.name}${profile.chapter.city ? ` — ${profile.chapter.city}` : ""}`
    : "—";

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("Full name is required");
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(false);
    const { error: err } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        bio: bio.trim() || null,
        business_name: businessName.trim() || null,
        business_category: businessCategory || null,
        business_tagline: businessTagline.trim() || null,
        business_website: businessWebsite.trim() || null,
        linkedin_url: linkedinUrl.trim() || null,
      })
      .eq("id", profile.id);
    setSaving(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      setPwError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("Passwords do not match.");
      return;
    }
    setPwSaving(true);
    setPwError(null);
    setPwSaved(false);
    const { error: err } = await supabase.auth.updateUser({ password: newPassword });
    setPwSaving(false);
    if (err) {
      setPwError(err.message);
      return;
    }
    setPwSaved(true);
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPwSaved(false), 3000);
  }

  const TABS = [
    { key: "profile" as const, label: "Profile", icon: "👤" },
    { key: "business" as const, label: "Business", icon: "🏢" },
    { key: "security" as const, label: "Security", icon: "🔒" },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      {/* ── Hero card ── */}
      <div className="rounded-2xl border border-slate-100 bg-white shadow-elevated overflow-hidden animate-fade-in-up">
        <div
          className="h-20 w-full relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #a855f7 0%, #6366f1 50%, #38bdf8 100%)",
          }}
        >
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-20 animate-float" style={{ background: "rgba(255,255,255,0.4)" }} />
        </div>
        <div className="px-6 pb-5">
          <div className="flex items-end gap-4 -mt-10 mb-4">
            <div className="relative group">
              <Avatar className="w-20 h-20 ring-4 ring-white shadow transition-transform duration-300 group-hover:scale-105">
                <AvatarImage src={profile.avatar_url ?? undefined} />
                <AvatarFallback
                  className="text-2xl font-black text-white"
                  style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)" }}
                >
                  {initials(profile.full_name ?? "?")}
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full border-2 border-white bg-emerald-500 animate-glow-pulse" />
            </div>
            <div className="pb-1 flex-1 min-w-0">
              <h1 className="text-xl font-black text-slate-900 truncate font-display">{profile.full_name}</h1>
              <p className="text-sm text-slate-400 truncate">{profile.email}</p>
            </div>
          </div>

          {/* Info pills */}
          <div className="flex flex-wrap gap-2">
            <span
              className="inline-flex items-center text-[11px] font-bold px-3 py-1.5 rounded-full"
              style={{ background: role.bg, color: role.color }}
            >
              {role.label}
            </span>
            {profile.chapter && (
              <span
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full text-slate-500"
                style={{
                  background: "rgba(148,163,184,0.1)",
                  border: "1px solid rgba(148,163,184,0.2)",
                }}
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {chapterLabel}
              </span>
            )}
            {profile.business_name && (
              <span
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full text-indigo-600"
                style={{
                  background: "rgba(99,102,241,0.08)",
                  border: "1px solid rgba(99,102,241,0.15)",
                }}
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                {profile.business_name}
              </span>
            )}
            {profile.business_category && (
              <span
                className="inline-flex items-center text-[11px] font-semibold px-3 py-1.5 rounded-full text-slate-400"
                style={{
                  background: "rgba(148,163,184,0.08)",
                  border: "1px solid rgba(148,163,184,0.15)",
                }}
              >
                {profile.business_category}
              </span>
            )}
          </div>

          {profile.business_tagline && (
            <p className="mt-3 text-sm italic text-slate-400">
              &ldquo;{profile.business_tagline}&rdquo;
            </p>
          )}
        </div>
      </div>

      {/* ── Tab nav ── */}
      <div
        className="flex gap-1 p-1 rounded-2xl w-fit animate-fade-in-up delay-75"
        style={{
          background: "rgba(99,102,241,0.06)",
          border: "1px solid rgba(99,102,241,0.12)",
        }}
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="press-scale flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all duration-200"
            style={
              tab === t.key
                ? {
                    background: "linear-gradient(135deg, #a855f7, #6366f1)",
                    color: "white",
                    boxShadow: "0 4px 12px rgba(168,85,247,0.3)",
                  }
                : { color: "#64748b" }
            }
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Profile Tab ── */}
      {tab === "profile" && (
        <form onSubmit={handleSaveProfile} className="space-y-4">
          {/* Account info — read-only */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 space-y-4 shadow-elevated animate-fade-in-up delay-100">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-sm font-black text-slate-900">Account Information</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-slate-400 bg-slate-100">
                Read-only
              </span>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <ReadonlyField
                label="Email address"
                value={profile.email ?? ""}
                hint="Contact support to change your email"
              />
              <ReadonlyField
                label="Chapter"
                value={chapterLabel}
                hint="Assigned by your chapter admin"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <ReadonlyField label="Role" value={role.label} />
              <ReadonlyField
                label="Member since"
                value={
                  (profile as any).created_at
                    ? new Date((profile as any).created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "—"
                }
              />
            </div>
          </div>

          {/* Editable personal info */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 space-y-4 shadow-elevated animate-fade-in-up delay-150">
            <h2 className="text-sm font-black text-slate-900">Personal Details</h2>

            {error && (
              <div
                className="p-3 rounded-xl text-sm font-medium"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  color: "#dc2626",
                  border: "1px solid rgba(239,68,68,0.2)",
                }}
              >
                {error}
              </div>
            )}
            {saved && (
              <div
                className="flex items-center gap-2 p-3 rounded-xl text-sm font-medium"
                style={{
                  background: "rgba(34,197,94,0.08)",
                  color: "#16a34a",
                  border: "1px solid rgba(34,197,94,0.2)",
                }}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Profile saved successfully!
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full name *">
                <input
                  className={inputCls}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  required
                />
              </Field>
              <Field label="Phone number" hint="Used for chapter communications">
                <input
                  className={inputCls}
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98400 00000"
                />
              </Field>
            </div>

            <Field label="Bio" hint="Tell members a bit about yourself">
              <textarea
                className={inputCls + " !h-24 !py-2.5 resize-none"}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A short bio about yourself…"
              />
            </Field>

            <button
              type="submit"
              disabled={saving}
              className="shine-hover press-scale flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #a855f7, #6366f1)",
                boxShadow: "0 4px 14px rgba(168,85,247,0.3)",
              }}
            >
              {saving && (
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              )}
              {saving ? "Saving…" : "Save Profile"}
            </button>
          </div>
        </form>
      )}

      {/* ── Business Tab ── */}
      {tab === "business" && (
        <form
          onSubmit={handleSaveProfile}
          className="rounded-2xl border border-slate-100 bg-white p-6 space-y-4 shadow-elevated animate-fade-in-up"
        >
          <div>
            <h2 className="text-sm font-black text-slate-900">Business Details</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              This information is visible to other chapter members
            </p>
          </div>

          {saved && (
            <div
              className="flex items-center gap-2 p-3 rounded-xl text-sm font-medium"
              style={{
                background: "rgba(34,197,94,0.08)",
                color: "#16a34a",
                border: "1px solid rgba(34,197,94,0.2)",
              }}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Business info saved!
            </div>
          )}
          {error && (
            <div
              className="p-3 rounded-xl text-sm font-medium"
              style={{
                background: "rgba(239,68,68,0.08)",
                color: "#dc2626",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
            >
              {error}
            </div>
          )}

          <Field label="Business name *">
            <input
              className={inputCls}
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Your Business Pvt. Ltd."
              required
            />
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Business category *" hint="Select the category that best fits">
              <select
                className={inputCls + " cursor-pointer"}
                value={businessCategory}
                onChange={(e) => setBusinessCategory(e.target.value)}
                required
                style={{
                  appearance: "none",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 12px center",
                }}
              >
                <option value="">Select category…</option>
                {BUSINESS_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Tagline" hint="A catchy one-liner about your business">
              <input
                className={inputCls}
                value={businessTagline}
                onChange={(e) => setBusinessTagline(e.target.value)}
                placeholder="Empowering businesses to scale smarter"
              />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Website">
              <input
                type="url"
                className={inputCls}
                value={businessWebsite}
                onChange={(e) => setBusinessWebsite(e.target.value)}
                placeholder="https://yourwebsite.com"
              />
            </Field>
            <Field label="LinkedIn URL">
              <input
                type="url"
                className={inputCls}
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/yourname"
              />
            </Field>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="shine-hover press-scale flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, #6366f1, #38bdf8)",
              boxShadow: "0 4px 14px rgba(99,102,241,0.3)",
            }}
          >
            {saving && (
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            {saving ? "Saving…" : "Save Business Info"}
          </button>
        </form>
      )}

      {/* ── Security Tab ── */}
      {tab === "security" && (
        <div className="space-y-4">
          <form
            onSubmit={handleChangePassword}
            className="rounded-2xl border border-slate-100 bg-white p-6 space-y-4 shadow-elevated animate-fade-in-up"
          >
            <h2 className="text-sm font-black text-slate-900">Change Password</h2>

            {pwError && (
              <div
                className="p-3 rounded-xl text-sm font-medium"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  color: "#dc2626",
                  border: "1px solid rgba(239,68,68,0.2)",
                }}
              >
                {pwError}
              </div>
            )}
            {pwSaved && (
              <div
                className="flex items-center gap-2 p-3 rounded-xl text-sm font-medium"
                style={{
                  background: "rgba(34,197,94,0.08)",
                  color: "#16a34a",
                  border: "1px solid rgba(34,197,94,0.2)",
                }}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Password updated successfully!
              </div>
            )}

            <Field label="New password">
              <input
                type="password"
                className={inputCls}
                placeholder="Min. 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </Field>
            <Field label="Confirm new password">
              <input
                type="password"
                className={inputCls}
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </Field>

            <button
              type="submit"
              disabled={pwSaving}
              className="shine-hover press-scale flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #f43f5e, #a855f7)",
                boxShadow: "0 4px 14px rgba(244,63,94,0.3)",
              }}
            >
              {pwSaving && (
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              )}
              {pwSaving ? "Updating…" : "Update Password"}
            </button>
          </form>

          {/* Linked email info */}
          <div className="rounded-2xl border border-red-100 bg-red-50/50 p-6">
            <h2 className="text-sm font-black text-red-700 mb-1">Linked account</h2>
            <p className="text-xs text-red-400 mb-3">
              Your account is linked to{" "}
              <strong className="text-red-500">{profile.email}</strong> via magic link. Contact
              your chapter admin to update your email address.
            </p>
            <div className={readonlyCls + " !text-red-400 !border-red-100 !bg-red-50"}>
              <svg
                className="w-3.5 h-3.5 shrink-0 text-red-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              {profile.email}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
