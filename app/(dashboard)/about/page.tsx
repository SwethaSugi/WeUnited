import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-10">

      {/* Hero */}
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-2xl overflow-hidden shadow-lg">
          <img src="/logo.jpg" alt="We United" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">We United</h1>
        <p className="text-slate-500 dark:text-slate-400 text-base max-w-xl mx-auto leading-relaxed">
          A professional networking platform built to help business chapters manage members, track referrals, and grow together.
        </p>
      </div>

      {/* Divider */}
      <div className="h-px bg-slate-100 dark:bg-slate-800" />

      {/* What is We United */}
      <section className="space-y-3">
        <h2 className="text-lg font-black text-slate-800 dark:text-white">What is We United?</h2>
        <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
          We United is a chapter-based business networking application designed for professional groups who want to build meaningful, measurable relationships. Members can exchange referrals, track business opportunities, attend chapter meetings, and stay connected — all from one place.
        </p>
        <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
          Whether you're a chapter admin managing your team or a member looking to grow your business through trusted referrals, We United gives you the tools to do it effectively.
        </p>
      </section>

      {/* Features */}
      <section className="space-y-4">
        <h2 className="text-lg font-black text-slate-800 dark:text-white">Key Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              icon: "🤝",
              title: "Referral Tracking",
              desc: "Send and receive business referrals with your chapter members. Track status, estimated value, and outcomes.",
            },
            {
              icon: "👥",
              title: "Member Management",
              desc: "Chapter admins can add, manage, and monitor members — including roles, business categories, and activity status.",
            },
            {
              icon: "📅",
              title: "Meeting Scheduler",
              desc: "Schedule and manage chapter meetings with venue, agenda, and attendance details in one place.",
            },
            {
              icon: "👋",
              title: "Visitor Log",
              desc: "Record and track visitors who attend chapter meetings as potential future members.",
            },
            {
              icon: "📊",
              title: "Dashboard Insights",
              desc: "At-a-glance stats on referrals sent, received, pending, and completed — plus upcoming meetings.",
            },
            {
              icon: "🔒",
              title: "Role-Based Access",
              desc: "Super admins, chapter admins, and members each have access tailored to their responsibilities.",
            },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="flex gap-3 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="font-bold text-sm text-slate-800 dark:text-white mb-1">{title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-slate-100 dark:bg-slate-800" />

      {/* Mission */}
      <section className="space-y-3">
        <h2 className="text-lg font-black text-slate-800 dark:text-white">Our Mission</h2>
        <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm">
          We believe that business grows best through trust. We United is built on the principle that structured, chapter-driven networking — where members know each other, refer each other, and hold each other accountable — creates real, lasting value for everyone involved.
        </p>
      </section>

      {/* Version / Tech */}
      <section className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 space-y-2">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Platform Info</p>
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <span className="text-slate-500 dark:text-slate-400">Version</span>
          <span className="font-semibold text-slate-700 dark:text-slate-200">1.0.0</span>
          <span className="text-slate-500 dark:text-slate-400">Built with</span>
          <span className="font-semibold text-slate-700 dark:text-slate-200">Next.js · Supabase · Tailwind CSS</span>
          <span className="text-slate-500 dark:text-slate-400">Support</span>
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            <a href="mailto:adminhorizzon@gmail.com" className="text-purple-600 hover:text-purple-500 transition-colors">
              adminhorizzon@gmail.com
            </a>
          </span>
        </div>
      </section>

      {/* Back link */}
      <div className="text-center">
        <Link href="/dashboard" className="text-sm font-semibold text-purple-600 hover:text-purple-500 transition-colors">
          ← Back to Dashboard
        </Link>
      </div>

    </div>
  );
}
