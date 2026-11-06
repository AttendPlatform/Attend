import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { safeAuthRedirect } from "@/lib/auth/redirect";

const allowedTypes: EmailOtpType[] = ["signup", "email", "recovery", "invite", "email_change"];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = safeAuthRedirect(url.searchParams.get("next"));

  if (!tokenHash || !type || !allowedTypes.includes(type)) {
    return NextResponse.redirect(new URL("/login?error=invalid_confirmation", url.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

  if (error) {
    return NextResponse.redirect(new URL("/login?error=expired_confirmation", url.origin));
  }

  const destination = type === "recovery" ? "/reset-password" : next;
  return NextResponse.redirect(new URL(destination, url.origin));
}
