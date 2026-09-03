import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ChaptersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*, chapter:chapters(*)").eq("id", user.id).single();
  if (!profile) redirect("/login");

  const { data: chapters } = await supabase
    .from("chapters")
    .select("*, profiles(count)")
    .eq("is_active", true)
    .order("name");

  const myChapter = profile.chapter;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Chapters</h1>
        <p className="text-muted-foreground text-sm mt-1">
          We United chapter directory
        </p>
      </div>

      {/* My Chapter */}
      {myChapter && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">My Chapter</h2>
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{myChapter.name}</CardTitle>
                <Badge variant="default">My Chapter</Badge>
              </div>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              {[
                { label: "City", value: [myChapter.city, myChapter.state].filter(Boolean).join(", ") || "—" },
                { label: "Meeting Day", value: myChapter.meeting_day ?? "—" },
                { label: "Meeting Time", value: myChapter.meeting_time ? myChapter.meeting_time.slice(0, 5) : "—" },
                { label: "Venue", value: myChapter.meeting_venue ?? "—" },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                  <p className="font-medium">{item.value}</p>
                </div>
              ))}
              {myChapter.description && (
                <div className="sm:col-span-2 lg:col-span-4">
                  <p className="text-xs text-muted-foreground mb-1">About</p>
                  <p className="text-muted-foreground">{myChapter.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* All Chapters */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          All Chapters ({chapters?.length ?? 0})
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {chapters?.map((ch) => (
            <Card key={ch.id} className={`border-border/50 hover:shadow-sm transition-shadow ${ch.id === myChapter?.id ? "opacity-60" : ""}`}>
              <CardContent className="p-5">
                <p className="font-semibold text-sm mb-2">{ch.name}</p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {(ch.city || ch.state) && (
                    <p>📍 {[ch.city, ch.state].filter(Boolean).join(", ")}</p>
                  )}
                  {ch.meeting_day && ch.meeting_time && (
                    <p>📅 {ch.meeting_day}s at {ch.meeting_time.slice(0, 5)}</p>
                  )}
                  {ch.meeting_venue && (
                    <p>🏨 {ch.meeting_venue}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
