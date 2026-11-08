
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeAuthRedirect } from "@/lib/auth/redirect";

const ALLOWED_SIGNUP_REASONS = [
  "discover_events",
  "create_events",
  "create_campaigns",
  "connect_communities",
] as const;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeAuthRedirect(url.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(
      new URL("/login?error=missing_code", url.origin)
    );
  }

  const supabase = await createClient();

  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return NextResponse.redirect(
      new URL("/login?error=oauth_callback", url.origin)
    );
  }

  // Read the selected signup reasons from the OAuth callback URL.
  const rawReasons = url.searchParams.get("signup_reasons");

  if (rawReasons) {
    try {
      const parsedReasons: unknown = JSON.parse(rawReasons);

      if (Array.isArray(parsedReasons)) {
        const signupReasons = parsedReasons.filter(
          (reason): reason is (typeof ALLOWED_SIGNUP_REASONS)[number] =>
            typeof reason === "string" &&
            ALLOWED_SIGNUP_REASONS.includes(
              reason as (typeof ALLOWED_SIGNUP_REASONS)[number]
            )
        );

        const { data: { user }, error: userError } =
          await supabase.auth.getUser();

        if (!userError && user && signupReasons.length > 0) {
          // Preserve existing metadata and add the signup reasons.
          await supabase.auth.updateUser({
            data: {
              ...user.user_metadata,
              signup_reasons: signupReasons,
            },
          });
        }
      }
    } catch {
      // Invalid optional signup metadata should not block authentication.
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
