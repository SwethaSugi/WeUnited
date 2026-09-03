"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [isDeactivated, setIsDeactivated] = useState(false);

  // Read ?error=deactivated from the URL on mount (avoids Suspense requirement)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("error") === "deactivated") {
      setIsDeactivated(true);
    }
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    // Check if the account is active before letting them in
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_active")
        .eq("id", user.id)
        .single();

      if (profile && profile.is_active === false) {
        await supabase.auth.signOut();
        setError("Your account has been deactivated. Please contact your chapter administrator.");
        setLoading(false);
        return;
      }
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 font-display" style={{ textWrap: "balance" as any }}>Welcome back 👋</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Sign in to your We United account</p>
      </div>

      {/* Deactivated account banner */}
      {isDeactivated && !error && (
        <div className="mb-5 flex items-start gap-3 px-4 py-3.5 rounded-2xl border animate-fade-in-up"
          style={{ background: "rgba(239,68,68,0.05)", borderColor: "rgba(239,68,68,0.2)" }}>
          <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-600 dark:text-red-400">
            Your account has been deactivated. Please contact your chapter administrator.
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-5 flex items-start gap-3 px-4 py-3.5 rounded-2xl border animate-fade-in-up"
          style={{ background: "rgba(239,68,68,0.05)", borderColor: "rgba(239,68,68,0.2)" }}>
          <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-5">
        {/* Email */}
        <div className="space-y-2 animate-fade-in-up delay-75">
          <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="email">Email address</Label>
          <Input
            id="email" type="email" placeholder="you@example.com"
            value={email} onChange={(e) => setEmail(e.target.value)}
            required autoComplete="email"
            className="h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-purple-400 focus:ring-purple-400/20 transition-all text-sm"
          />
        </div>

        {/* Password */}
        <div className="space-y-2 animate-fade-in-up delay-150">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs font-semibold text-purple-600 hover:text-purple-500 transition-colors">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password" type={showPass ? "text" : "password"} placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)}
              required autoComplete="current-password"
              className="h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:border-purple-400 focus:ring-purple-400/20 transition-all text-sm pr-10"
            />
            <button type="button" onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
              {showPass ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Submit */}
        <Button type="submit" disabled={loading}
          className="w-full h-12 rounded-xl font-bold text-sm text-white border-0 shine-hover press-scale transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 disabled:opacity-60 disabled:scale-100 disabled:translate-y-0 animate-fade-in-up delay-200"
          style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)", boxShadow: "0 8px 24px rgba(168,85,247,0.35)" }}>
          {loading ? (
            <span className="flex items-center justify-center gap-2.5">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Signing in…
            </span>
          ) : "Sign In"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-center text-slate-500 animate-fade-in-up delay-300">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-bold text-purple-600 hover:text-purple-500 transition-colors">
          Create one
        </Link>
      </p>
    </div>
  );
}
