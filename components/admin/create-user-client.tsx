"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { BUSINESS_CATEGORIES as CATEGORIES } from "@/lib/constants";

const ROLES = [
  { value: "member", label: "Member" },
  { value: "chapter_admin", label: "Chapter Admin" },
  { value: "super_admin", label: "Super Admin" },
];

type Chapter = { id: string; name: string; location: string | null };

interface Props { chapters: Chapter[] }

// ── Shared input / label styles ────────────────────────────────────────────
const inputCls =
  "w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400/40 focus:border-purple-400 transition-all";
const selectCls =
  "w-full h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-400/40 focus:border-purple-400 transition-all appearance-none";
const labelCls = "block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wide";

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

export function CreateUserClient({ chapters }: Props) {
  const router = useRouter();

  // ── form state ──
  const [fullName, setFullName] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [phone, setPhone]       = useState("");
  const [businessName, setBusinessName]         = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [businessTagline, setBusinessTagline]   = useState("");
  const [chapterId, setChapterId] = useState("");
  const [role, setRole]           = useState("member");

  // ── submit state ──
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess]         = useState(false);

  // ── Create User ───────────────────────────────────────────────────────────
  // NOTE: phone OTP verification is temporarily disabled (no SMS provider
  // configured in Supabase yet) — phone is collected as a plain field for
  // now. Re-enable by restoring the OTP send/verify UI + phoneVerified gate
  // once Authentication → Phone has a provider set up.
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);

    if (password.length < 8) { setSubmitError("Password must be at least 8 characters."); return; }

    const e164 = phone.trim() ? (phone.trim().startsWith("+") ? phone.trim() : `+91${phone.trim().replace(/^0/, "")}`) : "";

    setSubmitting(true);
    const res = await fetch("/api/admin/create-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        phone: e164,
        businessName: businessName.trim(),
        businessCategory,
        businessTagline: businessTagline.trim(),
        chapterId: chapterId || null,
        role,
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) { setSubmitError(data.error ?? "Failed to create user"); return; }
    setSuccess(true);
  }

  // ── Success screen ────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-[#fafaff] dark:bg-[#0b0b18] flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center text-4xl"
            style={{ background: "linear-gradient(135deg, rgba(168,85,247,0.15), rgba(99,102,241,0.15))", border: "2px solid rgba(168,85,247,0.3)" }}>
            ✓
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">User Created!</h2>
          <p className="text-slate-500 text-sm mb-8">
            <span className="font-semibold text-slate-700 dark:text-slate-300">{fullName}</span> can now log in with their email and password.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setSuccess(false); setFullName(""); setEmail(""); setPassword(""); setPhone(""); setBusinessName(""); setBusinessCategory(""); setBusinessTagline(""); setChapterId(""); setRole("member"); }}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.02]"
              style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)", boxShadow: "0 6px 20px rgba(168,85,247,0.3)" }}>
              + Create Another
            </button>
            <Link href="/admin"
              className="px-6 py-2.5 rounded-xl text-sm font-bold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
              Back to Admin
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#fafaff] dark:bg-[#0b0b18] py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8 animate-fade-in-up">
          <Link href="/admin"
            className="press-scale w-9 h-9 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 hover:-translate-x-0.5 transition-all duration-200 text-slate-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white font-display">Create New User</h1>
            <p className="text-sm text-slate-500 mt-0.5">Super admin only — fill in the member&apos;s details</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ── Section: Account ── */}
          <SectionCard title="Account Details" icon="👤">
            <FieldGroup label="Full Name">
              <input className={inputCls} placeholder="e.g. Priya Sharma" value={fullName}
                onChange={(e) => setFullName(e.target.value)} required />
            </FieldGroup>

            <FieldGroup label="Email Address">
              <input className={inputCls} type="email" placeholder="priya@example.com" value={email}
                onChange={(e) => setEmail(e.target.value)} required />
            </FieldGroup>

            <FieldGroup label="Password">
              <div className="relative">
                <input className={inputCls + " pr-10"} type={showPass ? "text" : "password"}
                  placeholder="Min. 8 characters" value={password}
                  onChange={(e) => setPassword(e.target.value)} required minLength={8} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    {showPass
                      ? <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      : <><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                    }
                  </svg>
                </button>
              </div>
            </FieldGroup>
          </SectionCard>

          {/* ── Section: Phone ── */}
          <SectionCard title="Phone Number" icon="📱">
            <FieldGroup label="Phone Number">
              <div className="flex gap-2">
                <div className="flex items-center px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-600 dark:text-slate-400 select-none">
                  🇮🇳 +91
                </div>
                <input className={inputCls + " flex-1"} type="tel" placeholder="9876543210"
                  value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                OTP verification is temporarily off — the number is saved as entered.
              </p>
            </FieldGroup>
          </SectionCard>

          {/* ── Section: Business ── */}
          <SectionCard title="Business Info" icon="🏢">
            <FieldGroup label="Business Name">
              <input className={inputCls} placeholder="Acme Consulting Pvt. Ltd." value={businessName}
                onChange={(e) => setBusinessName(e.target.value)} />
            </FieldGroup>

            <FieldGroup label="Business Category">
              <div className="relative">
                <select className={selectCls} value={businessCategory}
                  onChange={(e) => setBusinessCategory(e.target.value)}>
                  <option value="">— Select category —</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </FieldGroup>

            <FieldGroup label="Tagline (optional)">
              <input className={inputCls} placeholder="Your trusted partner in growth" value={businessTagline}
                onChange={(e) => setBusinessTagline(e.target.value)} />
            </FieldGroup>
          </SectionCard>

          {/* ── Section: Chapter + Role ── */}
          <SectionCard title="Chapter & Role" icon="🌐">
            <FieldGroup label="Assign to Chapter">
              <div className="relative">
                <select className={selectCls} value={chapterId} onChange={(e) => setChapterId(e.target.value)}>
                  <option value="">— Select chapter —</option>
                  {chapters.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      {ch.name}{ch.location ? ` (${ch.location})` : ""}
                    </option>
                  ))}
                </select>
                <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </FieldGroup>

            <FieldGroup label="Role">
              <div className="grid grid-cols-3 gap-3">
                {ROLES.map((r) => (
                  <button key={r.value} type="button"
                    onClick={() => setRole(r.value)}
                    className={`h-11 rounded-xl text-sm font-semibold border transition-all ${
                      role === r.value
                        ? "text-white border-transparent"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 hover:border-purple-300"
                    }`}
                    style={role === r.value ? { background: "linear-gradient(135deg, #a855f7, #6366f1)" } : {}}>
                    {r.label}
                  </button>
                ))}
              </div>
            </FieldGroup>
          </SectionCard>

          {/* ── Error ── */}
          {submitError && (
            <div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl border animate-fade-in"
              style={{ background: "rgba(239,68,68,0.05)", borderColor: "rgba(239,68,68,0.2)" }}>
              <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
            </div>
          )}

          {/* ── Submit ── */}
          <button type="submit" disabled={submitting}
            className="shine-hover w-full h-12 rounded-xl font-bold text-sm text-white border-0 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-60 disabled:scale-100 disabled:translate-y-0"
            style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)", boxShadow: "0 8px 24px rgba(168,85,247,0.35)" }}>
            {submitting
              ? <span className="flex items-center justify-center gap-2.5">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Creating user…
                </span>
              : "Create User"
            }
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Reusable section card ──────────────────────────────────────────────────
function SectionCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900/50 overflow-hidden shadow-elevated animate-fade-in-up">
      <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <span className="text-base">{icon}</span>
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">{title}</h3>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}
