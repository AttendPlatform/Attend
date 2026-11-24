import { createClient } from "@/lib/supabase/server";

export class PlatformAdminError extends Error {
  readonly statusCode: 401 | 403;

  constructor(message: string, statusCode: 401 | 403) {
    super(message);
    this.name = "PlatformAdminError";
    this.statusCode = statusCode;
  }
}

export interface PlatformAdminContext {
  userId: string;
  email: string | null;
  supabase: Awaited<ReturnType<typeof createClient>>;
}

export async function requirePlatformAdmin(): Promise<PlatformAdminContext> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new PlatformAdminError("Authentication required", 401);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_platform_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile?.is_platform_admin) {
    throw new PlatformAdminError("Platform admin access required", 403);
  }

  return {
    userId: user.id,
    email: user.email ?? null,
    supabase,
  };
}

export async function isPlatformAdmin(): Promise<boolean> {
  try {
    await requirePlatformAdmin();
    return true;
  } catch {
    return false;
  }
}
