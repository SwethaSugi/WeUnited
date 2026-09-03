import Link from "next/link";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{ background: "#0b0b18" }}>

      {/* Background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[500px] h-[500px] rounded-full -top-40 -left-40 opacity-20 animate-float"
          style={{ background: "radial-gradient(circle, #a855f7, transparent 70%)" }} />
        <div className="absolute w-[400px] h-[400px] rounded-full top-1/2 -right-32 opacity-15 animate-float2"
          style={{ background: "radial-gradient(circle, #6366f1, transparent 70%)" }} />
        <div className="absolute w-[300px] h-[300px] rounded-full -bottom-20 left-1/3 opacity-10 animate-float"
          style={{ background: "radial-gradient(circle, #34d399, transparent 70%)" }} />
        {/* Mesh grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      </div>

      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 mb-8 group relative z-10 animate-fade-in-up">
        <div className="relative w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs text-white transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
          style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)", boxShadow: "0 8px 24px rgba(168,85,247,0.4)" }}>
          WU
          <div className="absolute inset-0 rounded-2xl blur-md opacity-60 group-hover:opacity-90 transition-opacity duration-300"
            style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)" }} />
        </div>
        <div>
          <p className="text-sm font-black text-white leading-tight font-display">We United</p>
          <p className="text-[10px] leading-tight" style={{ color: "rgba(255,255,255,0.3)" }}>Business Network</p>
        </div>
      </Link>

      {/* Content */}
      <div className="w-full max-w-lg relative z-10 animate-scale-in">
        {children}
      </div>
    </div>
  );
}
