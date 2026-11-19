import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import {
  dispatchOrganizerProgressInsights,
  dispatchUpcomingEventReminders,
  processDueScheduledNotifications,
} from "@/lib/notifications/scheduler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function hasValidCronAuthorization(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const provided = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const providedBytes = Buffer.from(provided);
  const expectedBytes = Buffer.from(expected);

  return (
    providedBytes.length === expectedBytes.length &&
    timingSafeEqual(providedBytes, expectedBytes)
  );
}

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: "Notification cron is not configured." },
      { status: 503 }
    );
  }

  if (!hasValidCronAuthorization(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const scheduled = await processDueScheduledNotifications();
    const reminders = await dispatchUpcomingEventReminders();
    const organizerInsights = await dispatchOrganizerProgressInsights();

    return NextResponse.json({
      success: true,
      scheduled,
      reminders,
      organizerInsights,
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Notification cron failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Notification processing failed.",
      },
      { status: 500 }
    );
  }
}
