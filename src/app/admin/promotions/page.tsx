import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { PlatformAdminError, requirePlatformAdmin } from "@/lib/auth/admin";
import {
  getAdminNotificationSettings,
  listAdminAuditLogs,
  listFeaturedEventsForAdmin,
  listNotificationTemplatesForAdmin,
  listPromotionalBannersForAdmin,
  listPublishedEventsForPromotion,
} from "@/services/promotions.service";
import { AdminPromotionsConsole } from "@/components/admin";

export const metadata: Metadata = {
  title: "Admin Promotions | Attend",
  description:
    "Manage featured events, promotional banners, notification controls, and broadcasts.",
};

export default async function AdminPromotionsPage() {
  try {
    await requirePlatformAdmin();
  } catch (error) {
    if (error instanceof PlatformAdminError && error.statusCode === 401) {
      redirect("/login?next=/admin/promotions");
    }

    return (
      <main className="mx-auto max-w-2xl px-5 py-20 text-center">
        <div className="rounded-3xl border border-neutral-200 bg-white p-10 shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="mt-4 font-serif text-2xl font-bold text-neutral-950">
            Platform admin access required
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Your account does not have platform administrator permissions for this console.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-full bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            Back to home
          </Link>
        </div>
      </main>
    );
  }

  const [
    featuredEvents,
    availableEvents,
    banners,
    settings,
    templates,
    auditLogs,
  ] = await Promise.all([
    listFeaturedEventsForAdmin(),
    listPublishedEventsForPromotion(),
    listPromotionalBannersForAdmin(),
    getAdminNotificationSettings(),
    listNotificationTemplatesForAdmin(),
    listAdminAuditLogs(25),
  ]);

  return (
    <main className="min-h-screen bg-neutral-50/40 pb-20">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
            <ShieldCheck className="h-3.5 w-3.5" />
            Platform Admin Console
          </div>
          <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight text-neutral-950">
            Promotions & Notification Controls
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Curate featured events, manage frontend promotional banners, tune recovery triggers, and send platform broadcasts.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6">
        <AdminPromotionsConsole
          initialFeaturedEvents={featuredEvents}
          availableEvents={availableEvents}
          initialBanners={banners}
          initialSettings={settings}
          initialTemplates={templates}
          initialAuditLogs={auditLogs}
        />
      </div>
    </main>
  );
}
