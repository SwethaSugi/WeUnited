"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin}/api/auth/callback`,
      },
    });

    setLoading(false);
    if (otpError) {
      setError(otpError.message);
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="text-center animate-scale-in">
        {/* Icon */}
        <div className="relative mx-auto w-20 h-20 mb-6">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, rgba(52,211,153,0.15), rgba(56,189,248,0.15))", border: "1px solid rgba(52,211,153,0.3)" }}>
            <svg className="w-9 h-9 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          {/* Pulse ring */}
          <div className="absolute inset-0 rounded-3xl animate-ping opacity-20"
            style={{ background: "linear-gradient(135deg, #34d399, #38bdf8)" }} />
        </div>

        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 font-display">Verify your email</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
          We&apos;ve sent a verification link to{" "}
          <span className="font-bold text-slate-700 dark:text-slate-200">{email}</span>
        </p>

        <div className="p-4 rounded-2xl mb-3 text-sm text-slate-600 dark:text-slate-300 text-left space-y-2"
          style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.2)" }}>
          <p>Please check your inbox and <strong className="text-slate-800 dark:text-slate-100">click the verification link</strong> to complete your registration.</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">The link will expire in <strong>1 hour</strong>. If you don&apos;t see the email, please check your spam or junk folder.</p>
        </div>

        <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">
          Once verified, you&apos;ll be guided through setting up your profile.
        </p>

        <button onClick={() => setSent(false)}
          className="text-sm font-semibold text-purple-600 hover:text-purple-500 transition-colors">
          ← Use a different email
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 font-display" style={{ textWrap: "balance" as any }}>Create account ✨</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Join We United and start building real business relationships</p>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-3 px-4 py-3.5 rounded-2xl border animate-fade-in-up"
          style={{ background: "rgba(239,68,68,0.05)", borderColor: "rgba(239,68,68,0.2)" }}>
          <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2 animate-fade-in-up delay-75">
          <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="email">Email address</Label>
          <Input
            id="email" type="email" placeholder="Enter your email address"
            value={email} onChange={(e) => setEmail(e.target.value)}
            required autoComplete="email" autoFocus
            className="h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-emerald-400 focus:ring-emerald-400/20 transition-all text-sm"
          />
        </div>

        {/* What to expect */}
        <div className="flex items-start gap-3 p-4 rounded-2xl animate-fade-in-up delay-150 transition-transform duration-300 hover:scale-[1.01]"
          style={{ background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.15)" }}>
          <div className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5"
            style={{ background: "rgba(99,102,241,0.15)" }}>
            <svg className="w-3 h-3 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Enter your email address and we&apos;ll send you a <strong className="text-slate-700 dark:text-slate-200">verification link</strong> to complete your registration.
          </p>
        </div>

        <Button type="submit" disabled={loading}
          className="w-full h-12 rounded-xl font-bold text-sm text-white border-0 shine-hover press-scale transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 disabled:opacity-60 disabled:scale-100 disabled:translate-y-0 animate-fade-in-up delay-200"
          style={{ background: "linear-gradient(135deg, #34d399, #059669)", boxShadow: "0 8px 24px rgba(52,211,153,0.35)" }}>
          {loading ? (
            <span className="flex items-center justify-center gap-2.5">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Sending link…
            </span>
          ) : "Send sign-up link"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-center text-slate-500 animate-fade-in-up delay-300">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-purple-600 hover:text-purple-500 transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
