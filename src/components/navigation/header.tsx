"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LogOut } from "lucide-react";

import { NotificationBell } from "@/components/notifications/NotificationBell";
import { toast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";

import { useAuthStore } from "@/stores/useAuthStore";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const isDiscover = pathname === "/discover";
  const { user, clearAuth } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const logoutTimeoutRef = useRef<number | null>(null);
  const logoutDestinationRef = useRef<string | null>(null);

  useEffect(() => {
    if (logoutDestinationRef.current !== pathname) return;

    logoutDestinationRef.current = null;
    setIsLoggingOut(false);
  }, [pathname]);

  useEffect(() => {
    return () => {
      if (logoutTimeoutRef.current !== null) {
        window.clearTimeout(logoutTimeoutRef.current);
      }
    };
  }, []);

  async function handleLogout() {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    const supabase = createClient();

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error("Failed to sign out:", error);
      setIsLoggingOut(false);
      toast.error("Failed to sign out. Please try again.");
      return;
    }

    logoutTimeoutRef.current = window.setTimeout(() => {
      logoutTimeoutRef.current = null;
      if (pathname === "/") {
        clearAuth();
        router.refresh();
        setIsLoggingOut(false);
        return;
      }

      logoutDestinationRef.current = "/";
      router.push("/");
      clearAuth();
    }, 500);
  }
  
  /*
   * =========================================================
   * AVATAR
   * =========================================================
   */
  const avatarSrc =
    user?.user_metadata?.avatarUrl ||
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.avatar;

  /*
   * =========================================================
   * USER NAME
   * =========================================================
   */
  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    "";

  const initial = displayName
    ? displayName[0].toUpperCase()
    : "P";

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */
  return (
    <header className={`sticky top-0 z-50 border-b border-neutral-100 bg-white/90 backdrop-blur-xl ${isDiscover ? "hidden md:block" : ""}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6">

        {/* =====================================================
            LOGO
        ===================================================== */}
        <Link
          href="/"
          className="text-xl font-bold tracking-tight"
        >
          Attend<span className="text-violet-600">.</span>
        </Link>


        {/* =====================================================
            DESKTOP NAVIGATION
        ===================================================== */}
        <nav className="hidden items-center gap-1 md:flex">

          <Link
            href="/"
            className="rounded-full px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
          >
            Home
          </Link>

          <Link
            href="/discover"
            className="rounded-full px-4 py-2 text-sm font-medium text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
          >
            Discover
          </Link>

          <Link
            href="/create"
            className="rounded-full px-4 py-2 text-sm font-medium text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
          >
            Create
          </Link>

        </nav>


        {/* =====================================================
            RIGHT SIDE
        ===================================================== */}
        <div className="flex items-center gap-2">
          {user || isLoggingOut ? (
            <>
              {/* ===================================================
                  NOTIFICATIONS
              =================================================== */}
              <NotificationBell />

              {/* ===================================================
                  SAVED
              =================================================== */}
              <Link
                href="/saved"
                className="hidden rounded-full px-4 py-2 text-sm font-medium text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 sm:block"
              >
                Saved
              </Link>

              {/* ===================================================
                  PROFILE
              =================================================== */}
              <Link
                href="/profile"
                className="group flex items-center gap-2 rounded-full p-1 transition hover:bg-neutral-50 sm:px-3 sm:py-1.5"
              >
                {avatarSrc ? (
                  <Image
                    src={avatarSrc}
                    alt={displayName || "User profile"}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full object-cover ring-2 ring-violet-600/10"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700">
                    {initial}
                  </div>
                )}
                <span className="hidden text-sm font-medium text-neutral-700 group-hover:text-neutral-900 md:inline">
                  Profile
                </span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                aria-label={isLoggingOut ? "Logging out" : "Log out"}
                className={`rounded-full border p-2 text-sm font-medium transition-all duration-300 md:px-3 md:py-2 ${
                  isLoggingOut
                    ? "cursor-wait border-violet-200 bg-violet-50 text-violet-700 shadow-sm"
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  {isLoggingOut ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" aria-hidden="true" />
                  ) : (
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span className="hidden md:inline">
                    {isLoggingOut ? "Logging out..." : "Logout"}
                  </span>
                </span>
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

      </div>
    </header>
  );
}