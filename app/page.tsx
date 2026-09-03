import Link from "next/link";
import { Users, TrendingUp, Calendar, Shield, Zap, Globe } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fafaff] dark:bg-[#0b0b18] overflow-hidden">

      {/* ── Animated background orbs ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-120px] left-[-80px] w-[500px] h-[500px] rounded-full opacity-30 animate-float"
          style={{ background: "radial-gradient(circle, #a855f7 0%, transparent 70%)" }} />
        <div className="absolute top-[20%] right-[-100px] w-[400px] h-[400px] rounded-full opacity-20 animate-float2"
          style={{ background: "radial-gradient(circle, #6366f1 0%, transparent 70%)" }} />
        <div className="absolute bottom-[10%] left-[20%] w-[350px] h-[350px] rounded-full opacity-20 animate-float"
          style={{ background: "radial-gradient(circle, #38bdf8 0%, transparent 70%)" }} />
        {/* Mesh grid */}
        <div className="absolute inset-0 mesh-grid opacity-60" />
      </div>

      {/* ── Navbar ── */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto w-full animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)" }}>
            <span className="text-white font-black text-xs tracking-tight">WU</span>
            <div className="absolute inset-0 rounded-2xl opacity-50 blur-md"
              style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)" }} />
          </div>
          <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">We United</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login"
            className="px-5 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-all duration-200 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/30">
            Login
          </Link>
          <Link href="/register"
            className="relative px-6 py-2.5 text-sm font-bold text-white rounded-xl overflow-hidden group transition-all duration-300 hover:scale-105"
            style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)" }}>
            <span className="relative z-10">Get Started</span>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: "linear-gradient(135deg, #9333ea, #4f46e5)" }} />
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 pt-16 pb-12 max-w-5xl mx-auto w-full">

        {/* Badge */}
        <div className="animate-fade-in-up delay-75 inline-flex items-center gap-2.5 mb-8 px-5 py-2 rounded-full text-sm font-semibold border"
          style={{
            background: "linear-gradient(135deg, rgba(168,85,247,0.1), rgba(99,102,241,0.1))",
            borderColor: "rgba(168,85,247,0.3)",
            color: "#7c3aed"
          }}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-600" />
          </span>
          #1 Business Networking Platform
        </div>

        {/* Headline */}
        <h1 className="animate-fade-in-up delay-150 text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-none mb-6">
          <span className="text-slate-900 dark:text-white">Connect.</span>
          <br />
          <span className="shimmer-text">Refer. Grow.</span>
        </h1>

        <p className="animate-fade-in-up delay-300 text-lg sm:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mb-10 leading-relaxed font-medium">
          We United brings your business community together. Track referrals, manage chapter meetings, and build relationships that actually grow your revenue.
        </p>

        {/* CTA Buttons */}
        <div className="animate-fade-in-up delay-400 flex flex-col sm:flex-row gap-4 mb-10">
          <Link href="/register"
            className="relative inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold text-white rounded-2xl overflow-hidden group transition-all duration-300 hover:scale-105 hover:-translate-y-0.5"
            style={{ background: "linear-gradient(135deg, #a855f7, #6366f1, #38bdf8)", backgroundSize: "200% 200%" }}>
            <span className="relative z-10">Start for Free</span>
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: "linear-gradient(135deg, #9333ea, #4f46e5, #0ea5e9)" }} />
            {/* Glow */}
            <div className="absolute inset-0 blur-xl opacity-40"
              style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)" }} />
          </Link>
          <Link href="/login"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold rounded-2xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white/80 dark:bg-slate-900/80 backdrop-blur hover:border-purple-300 dark:hover:border-purple-700 hover:bg-white dark:hover:bg-slate-900 transition-all duration-300 hover:scale-105 hover:-translate-y-0.5">
            Sign In
          </Link>
        </div>

      </main>

      {/* ── Feature Cards ── */}
      <section className="relative z-10 max-w-7xl mx-auto w-full px-6 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            {
              gradient: "from-purple-500 to-violet-600",
              shadow: "rgba(168,85,247,0.3)",
              icon: <Users className="w-6 h-6 text-white" />,
              title: "Member Directory",
              desc: "Browse and connect with professionals across all chapters in your network.",
              delay: "delay-100",
            },
            {
              gradient: "from-blue-500 to-indigo-600",
              shadow: "rgba(99,102,241,0.3)",
              icon: <TrendingUp className="w-6 h-6 text-white" />,
              title: "Referral Tracking",
              desc: "Send, receive, and track business referrals with real-time updates and value insights.",
              delay: "delay-200",
            },
            {
              gradient: "from-cyan-500 to-blue-500",
              shadow: "rgba(56,189,248,0.3)",
              icon: <Calendar className="w-6 h-6 text-white" />,
              title: "Chapter Meetings",
              desc: "Schedule meetings, mark attendance, and manage visitors seamlessly.",
              delay: "delay-300",
            },
          ].map((f) => (
            <div key={f.title}
              className={`animate-fade-in-up ${f.delay} group relative rounded-3xl overflow-hidden p-6 bg-white dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 hover:border-transparent transition-all duration-400 hover:-translate-y-2 cursor-pointer`}
              style={{ boxShadow: `0 4px 32px -8px ${f.shadow}` }}>
              {/* Top gradient accent */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${f.gradient}`} />
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                style={{ boxShadow: `0 8px 20px ${f.shadow}` }}>
                {f.icon}
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{f.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              {/* Hover glow */}
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 bg-gradient-to-br ${f.gradient} transition-opacity duration-400 rounded-3xl`} />
            </div>
          ))}
        </div>

        {/* Bottom feature pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          {[
            { icon: <Shield className="w-4 h-4" />, label: "Enterprise Secure", color: "#6366f1", bg: "rgba(99,102,241,0.08)" },
            { icon: <Zap className="w-4 h-4" />, label: "Real-time Updates", color: "#f59e0b", bg: "rgba(245,158,11,0.08)" },
            { icon: <Globe className="w-4 h-4" />, label: "Multi-Chapter Support", color: "#10b981", bg: "rgba(16,185,129,0.08)" },
          ].map((f, i) => (
            <div key={f.label}
              className={`animate-fade-in-up delay-${(i + 4) * 100} flex items-center gap-3 px-5 py-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur`}>
              <span className="flex-shrink-0 p-2 rounded-xl" style={{ color: f.color, background: f.bg }}>{f.icon}</span>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{f.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-slate-200/60 dark:border-slate-800/60 py-6 text-center text-sm text-slate-400">
        © 2025 <span className="font-semibold text-purple-600 dark:text-purple-400">We United</span>. Built with ❤️ · Next.js · Supabase · Tailwind
      </footer>
    </div>
  );
}
