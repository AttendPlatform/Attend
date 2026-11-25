"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Bookmark,
  CalendarDays,
  ChevronDown,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  Sparkles,
  UserRound,
} from "lucide-react";

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
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);
  const logoutTimeoutRef = useRef<number | null>(null);
  const logoutDestinationRef = useRef<string | null>(null);
  const cachedUserRef = useRef(user);

  if (user) {
    cachedUserRef.current = user;
  }

  const displayUser = user ?? (isLoggingOut ? cachedUserRef.current : null);

  useEffect(() => {
    if (logoutDestinationRef.current !== pathname) return;

    logoutDestinationRef.current = null;
    setIsLoggingOut(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMoreOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMoreOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isMoreOpen]);

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

      logoutTimeoutRef.current = window.setTimeout(() => {
        logoutTimeoutRef.current = null;
        setIsLoggingOut(false);
      }, 2000);
    }, 500);
  }
  
  /*
   * =========================================================
   * AVATAR
   * =========================================================
   */
  const avatarSrc =
    displayUser?.user_metadata?.avatarUrl ||
    displayUser?.user_metadata?.avatar_url ||
    displayUser?.user_metadata?.avatar;

  /*
   * =========================================================
   * USER NAME
   * =========================================================
   */
  const displayName =
    displayUser?.user_metadata?.full_name ||
    displayUser?.user_metadata?.name ||
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

          <Link
            href="/about"
            className="rounded-full px-4 py-2 text-sm font-medium text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
          >
            About
          </Link>

        </nav>


        {/* =====================================================
            RIGHT SIDE
        ===================================================== */}
        <div className="flex items-center gap-2">
          {user || isLoggingOut ? (
            <>
              <NotificationBell />

              <Link
                href="/dashboard"
                className="hidden rounded-full px-4 py-2 text-sm font-medium text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 sm:block"
              >
                Dashboard
              </Link>

              <Link
                href="/saved"
                className="hidden rounded-full px-4 py-2 text-sm font-medium text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 md:block"
              >
                Saved
              </Link>

              <div className="relative" ref={moreMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsMoreOpen((prev) => !prev)}
                  aria-expanded={isMoreOpen}
                  aria-haspopup="menu"
                  aria-label="Account and more menu"
                  className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white p-1 pr-2.5 text-sm font-medium text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50"
                >
                  {avatarSrc ? (
                    <Image
                      src={avatarSrc}
                      alt={displayName || "User profile"}
                      width={32}
                      height={32}
                      className="h-7 w-7 rounded-full object-cover ring-2 ring-violet-600/10"
                    />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700">
                      {initial}
                    </div>
                  )}
                  <span className="hidden sm:inline">More</span>
                  <ChevronDown className={`h-4 w-4 text-neutral-400 transition-transform ${isMoreOpen ? "rotate-180" : ""}`} />
                </button>

                {isMoreOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-neutral-200 bg-white py-1.5 shadow-xl"
                  >
                    <Link
                      href="/profile"
                      role="menuitem"
                      onClick={() => setIsMoreOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 hover:text-neutral-950"
                    >
                      <UserRound className="h-4 w-4 text-neutral-400" />
                      <span>Profile</span>
                    </Link>

                    <Link
                      href="/dashboard"
                      role="menuitem"
                      onClick={() => setIsMoreOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 hover:text-neutral-950"
                    >
                      <LayoutDashboard className="h-4 w-4 text-neutral-400" />
                      <span>Dashboard</span>
                    </Link>

                    <Link
                      href="/dashboard#events"
                      role="menuitem"
                      onClick={() => setIsMoreOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 hover:text-neutral-950"
                    >
                      <CalendarDays className="h-4 w-4 text-neutral-400" />
                      <span>My Events</span>
                    </Link>

                    <Link
                      href="/dashboard#campaigns"
                      role="menuitem"
                      onClick={() => setIsMoreOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 hover:text-neutral-950"
                    >
                      <Sparkles className="h-4 w-4 text-neutral-400" />
                      <span>My Campaigns</span>
                    </Link>

                    <Link
                      href="/drafts"
                      role="menuitem"
                      onClick={() => setIsMoreOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 hover:text-neutral-950"
                    >
                      <FileText className="h-4 w-4 text-neutral-400" />
                      <span>Drafts</span>
                    </Link>

                    <Link
                      href="/saved"
                      role="menuitem"
                      onClick={() => setIsMoreOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 hover:text-neutral-950"
                    >
                      <Bookmark className="h-4 w-4 text-neutral-400" />
                      <span>Saved Events</span>
                    </Link>

                    <Link
                      href="/settings"
                      role="menuitem"
                      onClick={() => setIsMoreOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 hover:text-neutral-950"
                    >
                      <Settings className="h-4 w-4 text-neutral-400" />
                      <span>Account Settings</span>
                    </Link>

                    <div className="my-1 border-t border-neutral-100" />

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setIsMoreOpen(false);
                        void handleLogout();
                      }}
                      disabled={isLoggingOut}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                    >
                      {isLoggingOut ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" aria-hidden="true" />
                      ) : (
                        <LogOut className="h-4 w-4" aria-hidden="true" />
                      )}
                      <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
                    </button>
                  </div>
                )}
              </div>
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