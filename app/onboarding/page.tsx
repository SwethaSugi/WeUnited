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

  // ── Step navigation ───────────────────────────────────────────────────────
  // NOTE: phone OTP verification is temporarily disabled (no SMS provider
  // configured in Supabase yet) — phone is collected as a plain field for
  // now. Re-enable by restoring the OTP send/verify UI + phoneVerified gate
  // once Authentication → Phone has a provider set up.
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
        phone: form.phone || null,
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
    <Card className="border-border/50 shadow-elevated-lg animate-scale-in">
      <CardHeader>
        <div className="flex items-center justify-between mb-1">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                i < step ? "bg-primary text-primary-foreground scale-100" :
                i === step ? "bg-primary text-primary-foreground scale-110 ring-glow-purple" :
                "bg-muted text-muted-foreground"
              }`}>
                {i < step ? <span className="animate-pop-in">✓</span> : i + 1}
              </div>
              <span className={`text-xs hidden sm:inline transition-colors duration-300 ${i === step ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {s}
              </span>
              {i < STEPS.length - 1 && <div className={`h-px w-8 sm:w-16 mx-1 transition-colors duration-500 ${i < step ? "bg-primary" : "bg-muted"}`} />}
            </div>
          ))}
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full mt-3 overflow-hidden">
          <div className="h-1.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%`, background: "linear-gradient(90deg, #a855f7, #6366f1)" }} />
        </div>
        <CardTitle key={`title-${step}`} className="text-xl font-bold mt-4 font-display animate-fade-in-up">
          {step === 0 && "Set your password"}
          {step === 1 && "Tell us about you"}
          {step === 2 && "Your business"}
        </CardTitle>
        <CardDescription key={`desc-${step}`} className="animate-fade-in-up delay-75">
          {step === 0 && `Setting up account for ${userEmail}`}
          {step === 1 && "Your name and chapter details"}
          {step === 2 && "Help members know what you do"}
        </CardDescription>
      </CardHeader>

      <CardContent key={`content-${step}`} className="space-y-4 animate-fade-in-up delay-100">
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

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone" placeholder="9876543210" type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
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
          <Button variant="outline" className="flex-1 press-scale" onClick={() => setStep((s) => s - 1)} disabled={loading}>
            Back
          </Button>
        )}
        <Button className="flex-1 shine-hover press-scale" onClick={handleNext} disabled={loading}>
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Saving…
            </span>
          ) : step === 2 ? "Complete Setup" : "Continue"}
        </Button>
      </CardFooter>
    </Card>
  );
}
