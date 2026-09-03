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
 */
export const getCurrentUserProfile = cache(async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, profile: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, chapter:chapters(*)")
    .eq("id", user.id)
    .single();

  return { user, profile };
});
