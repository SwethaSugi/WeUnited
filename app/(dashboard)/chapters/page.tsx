import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const CHAPTER_GRADIENTS = [
  "linear-gradient(135deg, #a855f7, #6366f1)",
  "linear-gradient(135deg, #6366f1, #38bdf8)",
  "linear-gradient(135deg, #34d399, #38bdf8)",
  "linear-gradient(135deg, #fb923c, #f43f5e)",
  "linear-gradient(135deg, #f472b6, #a855f7)",
  "linear-gradient(135deg, #38bdf8, #34d399)",
];

export default async function ChaptersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/login");

  const { data: chapters } = await supabase
    .from("chapters")
    .select("*, profiles(count)")
    .eq("is_active", true)
    .order("name");

  // Fetch the user's chapter separately to avoid PostgREST ambiguous FK error
  // (two FKs exist between profiles and chapters, so "*,chapter:chapters(*)" fails)
  const { data: myChapter } = profile.chapter_id
    ? await supabase.from("chapters").select("*, profiles(count)").eq("id", profile.chapter_id).single()
    : { data: null };

  const otherChapters = (chapters ?? []).filter((ch) => ch.id !== myChapter?.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white font-display">Chapters</h1>
          <p className="text-sm text-slate-500 mt-0.5">We United chapter directory · {chapters?.length ?? 0} active</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl transition-transform duration-300 hover:scale-105"
          style={{ background: "linear-gradient(135deg, rgba(244,114,182,0.08), rgba(168,85,247,0.08))", border: "1px solid rgba(244,114,182,0.15)" }}>
          <span className="w-2 h-2 rounded-full animate-glow-pulse" style={{ background: "#f472b6" }} />
          <span className="text-xs font-bold" style={{ color: "#f472b6" }}>{chapters?.length ?? 0} chapters</span>
        </div>
      </div>

      {/* My Chapter — hero card */}
      {myChapter && (
        <div className="animate-fade-in-up delay-75">
          <p className="px-1 mb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">My Chapter</p>
          <div className="border-glow-anim shine-hover relative rounded-3xl p-6 sm:p-7 overflow-hidden text-white"
            style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)", boxShadow: "0 16px 40px rgba(168,85,247,0.35)" }}>
            {/* Decorative circles */}
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20 animate-float" style={{ background: "rgba(255,255,255,0.3)" }} />
            <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full opacity-15 animate-float2" style={{ background: "rgba(255,255,255,0.4)" }} />

            <div className="relative flex items-start justify-between gap-4 mb-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shrink-0"
                  style={{ background: "rgba(255,255,255,0.2)" }}>
                  🏢
                </div>
                <div>
                  <h2 className="text-xl font-black font-display leading-tight">{myChapter.name}</h2>
                  <p className="text-white/70 text-sm mt-0.5">
                    {[myChapter.city, myChapter.state].filter(Boolean).join(", ") || "Location not set"}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-black px-3 py-1.5 rounded-full shrink-0"
                style={{ background: "rgba(255,255,255,0.25)" }}>
                YOUR CHAPTER
              </span>
            </div>

            <div className="relative grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Meeting Day", value: myChapter.meeting_day ?? "—", icon: "📅" },
                { label: "Meeting Time", value: myChapter.meeting_time ? myChapter.meeting_time.slice(0, 5) : "—", icon: "🕐" },
                { label: "Venue", value: myChapter.meeting_venue ?? "—", icon: "📍" },
                { label: "Members", value: String(myChapter.profiles?.[0]?.count ?? "—"), icon: "👥" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.12)" }}>
                  <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-1">{item.icon} {item.label}</p>
                  <p className="font-bold text-sm truncate">{item.value}</p>
                </div>
              ))}
            </div>

            {myChapter.description && (
              <p className="relative text-white/75 text-sm mt-5 leading-relaxed">{myChapter.description}</p>
            )}
          </div>
        </div>
      )}

      {/* All Chapters */}
      <div className="animate-fade-in-up delay-150">
        <p className="px-1 mb-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
          All Chapters ({otherChapters.length})
        </p>
        {otherChapters.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-500">No other chapters yet</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-in">
            {otherChapters.map((ch, i) => {
              const grad = CHAPTER_GRADIENTS[i % CHAPTER_GRADIENTS.length];
              const memberCount = ch.profiles?.[0]?.count ?? 0;
              return (
                <div key={ch.id}
                  className="card-hover rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-elevated"
                  style={{ ["--stagger" as string]: Math.min(i, 12) }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-black text-white shrink-0 transition-transform duration-300 hover:scale-105 hover:rotate-3"
                      style={{ background: grad }}>
                      {ch.name[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{ch.name}</p>
                      {(ch.city || ch.state) && (
                        <p className="text-xs text-slate-400 truncate">{[ch.city, ch.state].filter(Boolean).join(", ")}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-500">
                    {ch.meeting_day && ch.meeting_time && (
                      <div className="flex items-center gap-1.5">
                        <span className="w-4">📅</span>
                        <span>{ch.meeting_day}s at {ch.meeting_time.slice(0, 5)}</span>
                      </div>
                    )}
                    {ch.meeting_venue && (
                      <div className="flex items-center gap-1.5">
                        <span className="w-4">🏨</span>
                        <span className="truncate">{ch.meeting_venue}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <span className="w-4">👥</span>
                      <span>{memberCount} member{memberCount === 1 ? "" : "s"}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
