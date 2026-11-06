"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { NotificationBell } from "@/components/notifications/NotificationBell";
import { createClient } from "@/lib/supabase/client";

import { useAuthStore } from "@/stores/useAuthStore";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const isDiscover = pathname === "/discover";
  const { user, clearAuth } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    const supabase = createClient();

    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Failed to sign out:", error);
      setIsLoggingOut(false);
      return;
    }

    clearAuth();

    window.setTimeout(() => {
      router.push("/");
      router.refresh();
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
          {user ? (
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
                className={`rounded-full border px-3 py-2 text-sm font-medium transition-all duration-300 ${
                  isLoggingOut
                    ? "cursor-wait border-violet-200 bg-violet-50 text-violet-700 shadow-sm"
                    : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900"
                }`}
              >
                <span
                  className={`inline-flex items-center gap-2 ${isLoggingOut ? "animate-pulse" : ""}`}
                >
                  {isLoggingOut && (
                    <span className="h-2 w-2 rounded-full bg-violet-600" />
                  )}
                  {isLoggingOut ? "Logging out..." : "Logout"}
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