import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Fetches the signed-in user and their profile — ONCE per request.
 *
 * React's cache() dedupes this across the whole server render pass, so the
 * layout and the page can both call it and only one round-trip to Supabase
 * actually happens. That matters a lot here: this is the authoritative,
 * network-verified auth check (supabase.auth.getUser(), not getSession()),
 * so we want exactly one of them per request — not one in middleware, one in
 * the layout and one in the page.
 *
 * Middleware deliberately does NOT call this. It only does a fast, local
 * cookie check to decide whether to bounce to /login; the real verification
 * happens here, inside the render, where it's cached.
 *
 * IMPORTANT — no embedded select here. This used to be
 *   .select("*, chapter:chapters(*)")
 * but there are now TWO foreign keys between profiles and chapters
 * (profiles.chapter_id -> chapters.id, and chapters.chapter_admin_id ->
 * profiles.id, the latter added by the remove-member FK migration). PostgREST
 * refuses an ambiguous embed like that and returns an error instead of data,
 * which made `profile` null and bounced everyone to /onboarding. The chapter
 * is fetched separately below and attached, which is unambiguous and can't
 * break again if the relationships change.
 */
export const getCurrentUserProfile = cache(async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, profile: null, profileMissing: false };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // A genuinely absent row (PGRST116 = "no rows returned") means this account
  // hasn't onboarded yet, and /onboarding is the right destination. ANY other
  // error is a real failure — it must NOT be mistaken for "not onboarded",
  // which is exactly what was bouncing signed-up users to /onboarding.
  if (profileError) {
    const isMissing = profileError.code === "PGRST116";
    if (!isMissing) {
      console.error("getCurrentUserProfile: profiles select failed:", profileError);
    }
    return { user, profile: null, profileMissing: isMissing };
  }

  if (!profile) return { user, profile: null, profileMissing: true };

  // Attach the chapter as a separate, unambiguous query (only if there is one).
  let chapter = null;
  if (profile.chapter_id) {
    const { data: chapterRow, error: chapterError } = await supabase
      .from("chapters")
      .select("*")
      .eq("id", profile.chapter_id)
      .single();

    if (chapterError) {
      // A missing/unreadable chapter must not block the whole page — the UI
      // already handles a null chapter ("No chapter assigned").
      console.error("getCurrentUserProfile: chapters select failed:", chapterError);
    } else {
      chapter = chapterRow;
    }
  }

  return { user, profile: { ...profile, chapter }, profileMissing: false };
});
