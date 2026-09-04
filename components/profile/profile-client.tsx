"use client";

import { useState, useEffect, useRef } from "react";
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
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

const ROLE_CONFIG: Record<string, { label: string; bg: string; color: string; dot: string }> = {
  chapter_admin: { label: "Chapter Admin", bg: "rgba(168,85,247,0.1)", color: "#a855f7", dot: "#a855f7" },
  super_admin:   { label: "Super Admin",   bg: "rgba(239,68,68,0.1)",  color: "#ef4444", dot: "#ef4444" },
  member:        { label: "Member",        bg: "rgba(99,102,241,0.1)", color: "#6366f1", dot: "#6366f1" },
  visitor:       { label: "Visitor",       bg: "rgba(148,163,184,0.1)",color: "#94a3b8", dot: "#94a3b8" },
};

const inputCls =
  "w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 text-sm font-medium text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all placeholder:text-slate-400 placeholder:font-normal";

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
    </div>
  );
}

/** A single read-only info row shown in view mode */
function InfoRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  if (!value || value === "—") return (
    <div className="space-y-0.5">
      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</p>
      <p className="text-sm text-slate-300 dark:text-slate-600 italic">Not provided</p>
    </div>
  );
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</p>
      <div className="flex items-center gap-1.5">
        {icon && <span className="text-slate-400 dark:text-slate-500">{icon}</span>}
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{value}</p>
      </div>
    </div>
  );
}

function LockIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function ReadonlyField({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Field label={label} hint={hint}>
      <div className="w-full h-11 rounded-xl border border-slate-100 dark:border-slate-800 px-3.5 text-sm font-medium text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2">
        <LockIcon />
        <span className="truncate">{value || "—"}</span>
      </div>
    </Field>
  );
}

function SaveBar({ saving, onCancel }: { saving: boolean; onCancel: () => void }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60"
        style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)", boxShadow: "0 4px 14px rgba(168,85,247,0.3)" }}
      >
        {saving && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
        {saving ? "Saving…" : "Save Changes"}
      </button>
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
      >
        Cancel
      </button>
    </div>
  );
}

function Toast({ type, message }: { type: "success" | "error"; message: string }) {
  const styles =
    type === "success"
      ? { bg: "rgba(34,197,94,0.08)", color: "#16a34a", border: "1px solid rgba(34,197,94,0.2)" }
      : { bg: "rgba(239,68,68,0.08)", color: "#dc2626", border: "1px solid rgba(239,68,68,0.2)" };
  return (
    <div className="flex items-center gap-2 p-3 rounded-xl text-sm font-medium" style={styles}>
      {type === "success" ? (
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      {message}
    </div>
  );
}

function EditButton({ onClick, label = "Edit" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-all"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
      {label}
    </button>
  );
}

export function ProfileClient({ profile }: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [tab, setTab] = useState<"profile" | "business" | "security">("profile");
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState(false);

  // Avatar upload
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url ?? "");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleRemoveAvatar() {
    if (!avatarUrl) return;
    setAvatarUploading(true);
    setAvatarError(null);

    // Remove from storage (best-effort — ignore if file not found)
    const ext = avatarUrl.split("avatar.")[1]?.split("?")[0] ?? "jpg";
    await supabase.storage.from("avatars").remove([`${profile.id}/avatar.${ext}`]);

    // Clear from profile
    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("id", profile.id);

    if (updateErr) {
      setAvatarError(updateErr.message);
      setAvatarUploading(false);
      return;
    }

    setAvatarUrl("");
    setAvatarUploading(false);
    router.refresh();
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    if (!file.type.startsWith("image/")) {
      setAvatarError("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Image must be under 5 MB.");
      return;
    }

    setAvatarUploading(true);
    setAvatarError(null);

    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${profile.id}/avatar.${ext}`;

    // Upload to Supabase Storage
    const { error: uploadErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadErr) {
      setAvatarError(uploadErr.message);
      setAvatarUploading(false);
      return;
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = urlData.publicUrl + `?t=${Date.now()}`; // bust cache

    // Save to profile
    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ avatar_url: urlData.publicUrl })
      .eq("id", profile.id);

    if (updateErr) {
      setAvatarError(updateErr.message);
      setAvatarUploading(false);
      return;
    }

    setAvatarUrl(publicUrl);
    setAvatarUploading(false);
    router.refresh();
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

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
  const chapterName = profile.chapter?.name ?? "—";
  const chapterLabel = profile.chapter
    ? `${profile.chapter.name}${profile.chapter.city ? ` — ${profile.chapter.city}` : ""}`
    : "—";

  const memberSince = (profile as any).created_at
    ? new Date((profile as any).created_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

  function cancelProfile() {
    setFullName(profile.full_name ?? "");
    setPhone(profile.phone ?? "");
    setBio(profile.bio ?? "");
    setError(null);
    setEditingProfile(false);
  }

  function cancelBusiness() {
    setBusinessName(profile.business_name ?? "");
    setBusinessCategory(profile.business_category ?? "");
    setBusinessTagline(profile.business_tagline ?? "");
    setBusinessWebsite(profile.business_website ?? "");
    setLinkedinUrl(profile.linkedin_url ?? "");
    setError(null);
    setEditingBusiness(false);
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) { setError("Full name is required"); return; }
    setSaving(true); setError(null); setSaved(false);
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
    if (err) { setError(err.message); return; }
    setSaved(true);
    setEditingProfile(false);
    setEditingBusiness(false);
    router.refresh();
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) { setPwError("Password must be at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { setPwError("Passwords do not match."); return; }
    setPwSaving(true); setPwError(null); setPwSaved(false);
    const { error: err } = await supabase.auth.updateUser({ password: newPassword });
    setPwSaving(false);
    if (err) { setPwError(err.message); return; }
    setPwSaved(true);
    setNewPassword(""); setConfirmPassword("");
    setTimeout(() => setPwSaved(false), 3000);
  }

  const TABS = [
    {
      key: "profile" as const, label: "Profile",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      key: "business" as const, label: "Business",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      key: "security" as const, label: "Security",
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-5 max-w-2xl">

      {/* ── Hero card ── */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden animate-fade-in-up">
        {/* Banner */}
        <div
          className="h-24 w-full relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #a855f7 0%, #6366f1 55%, #38bdf8 100%)" }}
        >
          {/* Subtle decorative circles */}
          <div className="absolute -top-8 -left-8 w-36 h-36 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
          <div className="absolute -bottom-6 right-16 w-24 h-24 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
          <div className="absolute top-3 right-8 w-12 h-12 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }} />
        </div>

        {/* Profile info below banner */}
        <div className="px-6 pt-0 pb-5">
          {/* Avatar row — overlaps banner */}
          <div className="flex items-end gap-4 -mt-8 mb-4">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />

            {/* Clickable avatar */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              className="relative shrink-0 group focus:outline-none"
              title="Change profile picture"
            >
              <Avatar className="w-16 h-16 ring-[3px] ring-white dark:ring-slate-900 shadow-md">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback
                  className="text-lg font-black text-white"
                  style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)" }}
                >
                  {initials(profile.full_name ?? "?")}
                </AvatarFallback>
              </Avatar>

              {/* Hover overlay */}
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {avatarUploading ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </div>

              {/* Online dot */}
              {!avatarUploading && (
                <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 bg-emerald-500" />
              )}
            </button>

            {/* Spacer so name aligns below the banner bottom edge */}
            <div className="pb-0.5 flex-1 min-w-0" />
          </div>

          {/* Avatar upload error */}
          {avatarError && (
            <div className="mb-3 -mt-2">
              <Toast type="error" message={avatarError} />
            </div>
          )}

          {/* Avatar action hints */}
          {avatarUploading ? (
            <p className="text-[10px] text-purple-500 -mt-3 mb-2 font-medium">Uploading…</p>
          ) : !avatarError ? (
            <div className="flex items-center gap-3 -mt-3 mb-2">
              <p className="text-[10px] text-slate-400 dark:text-slate-600">
                Click photo to change
              </p>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="text-[10px] font-semibold text-red-400 hover:text-red-500 transition-colors flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Remove photo
                </button>
              )}
            </div>
          ) : null}

          {/* Name + email */}
          <div className="mb-4">
            <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
              {profile.full_name}
            </h2>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">{profile.email}</p>
            {profile.business_tagline && (
              <p className="text-xs italic text-slate-400 dark:text-slate-500 mt-1">&ldquo;{profile.business_tagline}&rdquo;</p>
            )}
          </div>

          {/* Pills row */}
          <div className="flex flex-wrap gap-2">
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full"
              style={{ background: role.bg, color: role.color }}
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: role.dot }} />
              {role.label}
            </span>

            {profile.chapter && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800">
                <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {chapterName}
              </span>
            )}

            {profile.business_name && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40">
                <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {profile.business_name}
              </span>
            )}

            {profile.business_category && (
              <span className="inline-flex items-center text-[11px] font-semibold px-3 py-1 rounded-full text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800">
                {profile.business_category}
              </span>
            )}
          </div>

          {profile.bio && (
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-4">
              {profile.bio}
            </p>
          )}
        </div>
      </div>

      {/* ── Tab nav ── */}
      <div
        className="flex gap-1 p-1 rounded-2xl w-fit animate-fade-in-up"
        style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.12)" }}
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all duration-200"
            style={
              tab === t.key
                ? { background: "linear-gradient(135deg, #a855f7, #6366f1)", color: "white", boxShadow: "0 4px 12px rgba(168,85,247,0.3)" }
                : { color: "#64748b" }
            }
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Global save confirmation */}
      {saved && (
        <Toast type="success" message="Changes saved successfully!" />
      )}

      {/* ── Profile Tab ── */}
      {tab === "profile" && (
        <form onSubmit={handleSaveProfile} className="space-y-4 animate-fade-in-up">

          {/* Account Info — always read-only */}
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Account Information</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Managed by your chapter admin</p>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full text-slate-400 bg-slate-100 dark:bg-slate-800 dark:text-slate-500 uppercase tracking-wide">
                Read-only
              </span>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <ReadonlyField label="Email address" value={profile.email ?? ""} hint="Contact support to change" />
              <ReadonlyField label="Chapter" value={chapterLabel} hint="Assigned by your admin" />
              <ReadonlyField label="Role" value={role.label} />
              <ReadonlyField label="Member since" value={memberSince} />
            </div>
          </div>

          {/* Personal Details */}
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Personal Details</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Your name, phone, and bio</p>
              </div>
              {!editingProfile && <EditButton onClick={() => setEditingProfile(true)} label="Edit Profile" />}
            </div>

            {error && editingProfile && <Toast type="error" message={error} />}

            {editingProfile ? (
              /* ── Edit mode ── */
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Full name *">
                    <input className={inputCls} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" required />
                  </Field>
                  <Field label="Phone number" hint="Used for chapter communications">
                    <input className={inputCls} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98400 00000" />
                  </Field>
                </div>
                <Field label="Bio" hint="A short intro visible to other members">
                  <textarea className={inputCls + " !h-24 !py-2.5 resize-none"} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell members a bit about yourself…" />
                </Field>
                <SaveBar saving={saving} onCancel={cancelProfile} />
              </div>
            ) : (
              /* ── View mode ── */
              <div className="grid sm:grid-cols-2 gap-5">
                <InfoRow label="Full name" value={fullName || "—"} />
                <InfoRow
                  label="Phone number"
                  value={phone || "—"}
                  icon={
                    phone ? (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    ) : undefined
                  }
                />
                <div className="sm:col-span-2">
                  <InfoRow label="Bio" value={bio || "—"} />
                </div>
              </div>
            )}
          </div>
        </form>
      )}

      {/* ── Business Tab ── */}
      {tab === "business" && (
        <form onSubmit={handleSaveProfile} className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm animate-fade-in-up">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Business Details</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Visible to other chapter members</p>
            </div>
            {!editingBusiness && <EditButton onClick={() => setEditingBusiness(true)} label="Edit Business" />}
          </div>

          {saved && <Toast type="success" message="Business info saved!" />}
          {error && editingBusiness && <Toast type="error" message={error} />}

          {editingBusiness ? (
            /* ── Edit mode ── */
            <div className="space-y-4">
              <Field label="Business name *">
                <input className={inputCls} value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Your Business Pvt. Ltd." required />
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
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Tagline" hint="A catchy one-liner">
                  <input className={inputCls} value={businessTagline} onChange={(e) => setBusinessTagline(e.target.value)} placeholder="Empowering businesses to scale smarter" />
                </Field>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Website">
                  <input type="url" className={inputCls} value={businessWebsite} onChange={(e) => setBusinessWebsite(e.target.value)} placeholder="https://yourwebsite.com" />
                </Field>
                <Field label="LinkedIn URL">
                  <input type="url" className={inputCls} value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="https://linkedin.com/in/yourname" />
                </Field>
              </div>
              <SaveBar saving={saving} onCancel={cancelBusiness} />
            </div>
          ) : (
            /* ── View mode ── */
            <div className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <InfoRow label="Business name" value={businessName || "—"} />
                <InfoRow label="Category" value={businessCategory || "—"} />
                <InfoRow label="Tagline" value={businessTagline || "—"} />
              </div>

              {/* Links */}
              <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                {businessWebsite ? (
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Website</p>
                    <a
                      href={businessWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      {businessWebsite.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                ) : (
                  <InfoRow label="Website" value="—" />
                )}

                {linkedinUrl ? (
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">LinkedIn</p>
                    <a
                      href={linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                      LinkedIn Profile
                    </a>
                  </div>
                ) : (
                  <InfoRow label="LinkedIn" value="—" />
                )}
              </div>
            </div>
          )}
        </form>
      )}

      {/* ── Security Tab ── */}
      {tab === "security" && (
        <div className="space-y-4 animate-fade-in-up">
          <form
            onSubmit={handleChangePassword}
            className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm"
          >
            <div className="mb-5">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Change Password</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Choose a strong password of at least 8 characters</p>
            </div>

            {pwError && <div className="mb-4"><Toast type="error" message={pwError} /></div>}
            {pwSaved && <div className="mb-4"><Toast type="success" message="Password updated successfully!" /></div>}

            <div className="space-y-4">
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
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #f43f5e, #a855f7)", boxShadow: "0 4px 14px rgba(244,63,94,0.3)" }}
              >
                {pwSaving && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                {pwSaving ? "Updating…" : "Update Password"}
              </button>
            </div>
          </form>

          {/* Linked email */}
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(99,102,241,0.1)" }}
              >
                <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Linked Email</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 mb-2">
                  Your account is linked to this email address
                </p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{profile.email}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Contact support to change your email</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
