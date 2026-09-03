"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

import { BUSINESS_CATEGORIES as CATEGORIES } from "@/lib/constants";

type Chapter = { id: string; name: string; location: string | null };

const STEPS = ["Account", "Profile", "Business"];

export default function OnboardingPage() {
  const supabase = createClient();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");

  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
    fullName: "",
    phone: "",
    chapterId: "",
    businessName: "",
    businessCategory: "",
    businessTagline: "",
  });

  // ── Phone OTP state ──────────────────────────────────────────────────────
  const [otp, setOtp]                       = useState("");
  const [otpSent, setOtpSent]               = useState(false);
  const [phoneVerified, setPhoneVerified]   = useState(false);
  const [sendingOtp, setSendingOtp]         = useState(false);
  const [verifyingOtp, setVerifyingOtp]     = useState(false);
  const [otpError, setOtpError]             = useState<string | null>(null);
  const [verifiedPhone, setVerifiedPhone]   = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        setUserEmail(user.email ?? "");
      } else {
        router.replace("/register");
      }
    });
    supabase.from("chapters").select("id, name, location").eq("is_active", true)
      .then(({ data }) => setChapters(data ?? []));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setError(null);
  }

  // ── Send OTP ─────────────────────────────────────────────────────────────
  async function handleSendOtp() {
    setOtpError(null);
    if (!form.phone.trim()) { setOtpError("Enter your phone number first"); return; }
    setSendingOtp(true);
    const res = await fetch("/api/admin/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: form.phone.trim() }),
    });
    const data = await res.json();
    setSendingOtp(false);
    if (!res.ok) { setOtpError(data.error ?? "Failed to send OTP"); return; }
    setOtpSent(true);
    setOtp("");
  }

  // ── Verify OTP ───────────────────────────────────────────────────────────
  async function handleVerifyOtp() {
    setOtpError(null);
    if (!otp.trim()) { setOtpError("Enter the OTP sent to your phone"); return; }
    setVerifyingOtp(true);
    const res = await fetch("/api/admin/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: form.phone.trim(), token: otp.trim() }),
    });
    const data = await res.json();
    setVerifyingOtp(false);
    if (!res.ok) { setOtpError(data.error ?? "Invalid OTP. Please try again."); return; }
    setPhoneVerified(true);
    setVerifiedPhone(data.phone);
  }

  // ── Step navigation ───────────────────────────────────────────────────────
  async function handleNext() {
    setError(null);

    if (step === 0) {
      if (form.password.length < 8) { setError("Password must be at least 8 characters"); return; }
      if (form.password !== form.confirmPassword) { setError("Passwords do not match"); return; }
      setLoading(true);
      const { error: passErr } = await supabase.auth.updateUser({ password: form.password });
      setLoading(false);
      if (passErr) { setError(passErr.message); return; }
    }

    if (step === 1) {
      if (!form.fullName.trim()) { setError("Full name is required"); return; }
      if (!form.phone.trim()) { setError("Phone number is required"); return; }
      if (!phoneVerified) { setError("Please verify your phone number with OTP before continuing"); return; }
      if (!form.chapterId) { setError("Please select a chapter"); return; }
    }

    if (step === 2) {
      if (!form.businessName.trim()) { setError("Business name is required"); return; }
      if (!form.businessCategory) { setError("Please select a business category"); return; }

      setLoading(true);
      const { error: profileErr } = await supabase.from("profiles").upsert({
        id: userId!,
        email: userEmail,
        full_name: form.fullName,
        phone: verifiedPhone || form.phone || null,
        chapter_id: form.chapterId,
        business_name: form.businessName,
        business_category: form.businessCategory,
        business_tagline: form.businessTagline || null,
        role: "member",
        is_active: true,
      });
      setLoading(false);
      if (profileErr) { setError(profileErr.message); return; }
      router.push("/dashboard");
      return;
    }

    setStep((s) => s + 1);
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <Card className="border-border/50 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between mb-1">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                i < step ? "bg-primary text-primary-foreground" :
                i === step ? "bg-primary text-primary-foreground" :
                "bg-muted text-muted-foreground"
              }`}>
                {i < step ? "✓" : i + 1}
              </div>
              <span className={`text-xs hidden sm:inline ${i === step ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {s}
              </span>
              {i < STEPS.length - 1 && <div className={`h-px w-8 sm:w-16 mx-1 ${i < step ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>
        <div className="h-1 w-full bg-muted rounded-full mt-3">
          <div className="h-1 bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <CardTitle className="text-xl font-bold mt-4">
          {step === 0 && "Set your password"}
          {step === 1 && "Tell us about you"}
          {step === 2 && "Your business"}
        </CardTitle>
        <CardDescription>
          {step === 0 && `Setting up account for ${userEmail}`}
          {step === 1 && "Your name and chapter details"}
          {step === 2 && "Help members know what you do"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <p className="text-sm">{error}</p>
          </Alert>
        )}

        {/* ── Step 0: Password ── */}
        {step === 0 && (
          <>
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password" type="password" placeholder="Min. 8 characters"
                value={form.password} onChange={(e) => set("password", e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm Password</Label>
              <Input
                id="confirm" type="password" placeholder="Re-enter password"
                value={form.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </>
        )}

        {/* ── Step 1: Profile + Phone OTP ── */}
        {step === 1 && (
          <>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name <span className="text-destructive">*</span></Label>
              <Input
                id="fullName" placeholder="Priya Sharma"
                value={form.fullName} onChange={(e) => set("fullName", e.target.value)}
              />
            </div>

            {/* Phone + OTP */}
            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone Number <span className="text-destructive">*</span>
                {phoneVerified && (
                  <span className="ml-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Verified
                  </span>
                )}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="phone" placeholder="9876543210" type="tel"
                  value={form.phone}
                  onChange={(e) => {
                    set("phone", e.target.value);
                    setOtpSent(false);
                    setPhoneVerified(false);
                    setOtpError(null);
                    setOtp("");
                  }}
                  disabled={phoneVerified}
                  className="flex-1"
                />
                {!phoneVerified && (
                  <Button
                    type="button" variant="outline" onClick={handleSendOtp}
                    disabled={sendingOtp || !form.phone.trim()}
                    className="whitespace-nowrap text-purple-600 border-purple-300 hover:bg-purple-50">
                    {sendingOtp ? "Sending…" : otpSent ? "Resend" : "Send OTP"}
                  </Button>
                )}
              </div>

              {/* OTP input — shown after SMS sent */}
              {otpSent && !phoneVerified && (
                <div className="flex gap-2 pt-1">
                  <Input
                    placeholder="Enter 6-digit OTP"
                    type="text" inputMode="numeric" maxLength={6}
                    value={otp}
                    onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "")); setOtpError(null); }}
                    className="flex-1 tracking-widest font-bold text-center"
                  />
                  <Button
                    type="button" onClick={handleVerifyOtp}
                    disabled={verifyingOtp || otp.length < 4}
                    className="whitespace-nowrap bg-emerald-600 hover:bg-emerald-700 text-white">
                    {verifyingOtp ? "Verifying…" : "Verify"}
                  </Button>
                </div>
              )}

              {otpError && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {otpError}
                </p>
              )}

              {!otpSent && !phoneVerified && form.phone.trim() && (
                <p className="text-xs text-muted-foreground">
                  We&apos;ll send a one-time password to this number to verify it&apos;s yours.
                </p>
              )}

              {phoneVerified && (
                <p className="text-xs text-emerald-600">
                  ✓ Phone number verified successfully.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Chapter <span className="text-destructive">*</span></Label>
              <Select value={form.chapterId} onValueChange={(v) => set("chapterId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your chapter" />
                </SelectTrigger>
                <SelectContent>
                  {chapters.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}{c.location ? ` — ${c.location}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* ── Step 2: Business ── */}
        {step === 2 && (
          <>
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name <span className="text-destructive">*</span></Label>
              <Input
                id="businessName" placeholder="Sharma & Co."
                value={form.businessName} onChange={(e) => set("businessName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Business Category <span className="text-destructive">*</span></Label>
              <Select value={form.businessCategory} onValueChange={(v) => set("businessCategory", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                id="tagline" placeholder="Empowering businesses to scale smarter"
                value={form.businessTagline} onChange={(e) => set("businessTagline", e.target.value)}
              />
            </div>
          </>
        )}
      </CardContent>

      <CardFooter className="flex gap-3">
        {step > 0 && (
          <Button variant="outline" className="flex-1" onClick={() => setStep((s) => s - 1)} disabled={loading}>
            Back
          </Button>
        )}
        <Button className="flex-1" onClick={handleNext} disabled={loading}>
          {loading ? "Saving…" : step === 2 ? "Complete Setup" : "Continue"}
        </Button>
      </CardFooter>
    </Card>
  );
}
