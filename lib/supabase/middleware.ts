import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/types";

// Supabase's hosted API can take a while to answer the first request after
// the project has been idle for a bit, then be fast again for a while. Since
// this runs on EVERY request, a slow/failed call here must never take the
// whole app down with it — retry once (usually enough, since the connection
// is warm after the first attempt), and if it still fails, fail OPEN rather
// than block every page load: let the request through and let the page-level
// checks handle auth, instead of a 500 for something that will very likely
// succeed a few seconds later.
async function withRetry<T>(fn: () => PromiseLike<T>, ms = 15000): Promise<T | undefined> {
  function attempt(): Promise<T> {
    return Promise.race([
      Promise.resolve(fn()),
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error("middleware Supabase call timed out")), ms)),
    ]);
  }
  try {
    return await attempt();
  } catch {
    try {
      return await attempt();
    } catch (err) {
      console.error("middleware: Supabase call failed after retry:", err);
      return undefined;
    }
  }
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // ── Why this middleware does almost nothing now ──────────────────────────
  //
  // This used to make TWO network calls to Supabase on every single request:
  // auth.getUser() (which always round-trips to the Auth server to verify the
  // token) and a profiles select for role/is_active. Together they were the
  // whole reason proxy.ts was showing up in the logs at anywhere from 300ms
  // to 28s — that was Supabase API latency, paid on every page load, and it
  // was what made the dashboard look like it was hanging.
  //
  // Middleware's only real job is the cheap UX gate: "is there a session at
  // all? if not, bounce to /login." That question can be answered from the
  // cookie locally, with no network call. Everything that actually needs to
  // be TRUSTED — is this token real, is this account still active, is this
  // person an admin — now happens inside the render, in the layouts and
  // pages, via getCurrentUserProfile() in lib/auth/current-user.ts. That
  // helper uses the real network-verified auth.getUser(), and React's cache()
  // means the layout and the page share a single call per request.
  //
  // Note we only look at whether a session EXISTS — we never read session.user
  // here. Reading .user off getSession() is what triggers supabase-js's
  // "could be insecure" warning, and we genuinely don't need it: no user id is
  // required for a redirect decision.
  const authResult = await withRetry(() => supabase.auth.getSession());
  const isAuthed = !!authResult?.data?.session;

  const { pathname } = request.nextUrl;

  // Protected routes: redirect unauthenticated users to /login
  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/members") ||
    pathname.startsWith("/referrals") ||
    pathname.startsWith("/meetings") ||
    pathname.startsWith("/visitors") ||
    pathname.startsWith("/chapters");

  if (isProtected && !isAuthed) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Onboarding: must be authenticated but DON'T redirect to /dashboard
  if (pathname === "/onboarding" && !isAuthed) {
    return NextResponse.redirect(new URL("/register", request.url));
  }

  // Redirect logged-in users away from auth pages
  const isAuthPage =
    pathname === "/login" || pathname === "/register" || pathname === "/";

  // ...unless they were just bounced here by a gate in a layout (e.g. their
  // account was deactivated). Without this, the layout's redirect to
  // /login?error=... would be sent straight back to /dashboard, which would
  // bounce them here again — an infinite loop.
  const wasBouncedHere = request.nextUrl.searchParams.has("error");

  if (isAuthPage && isAuthed && !wasBouncedHere) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  return supabaseResponse;
}
