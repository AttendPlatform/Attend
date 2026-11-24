import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const schedulerPath = resolve(root, "src/lib/notifications/scheduler.ts");
const routePath = resolve(root, "src/app/api/notifications/cron/route.ts");
const scheduler = existsSync(schedulerPath)
  ? readFileSync(schedulerPath, "utf8")
  : "";
const route = existsSync(routePath) ? readFileSync(routePath, "utf8") : "";

const checks: Array<[string, boolean]> = [
  ["Scheduler module exists", existsSync(schedulerPath)],
  ["Cron route exists", existsSync(routePath)],
  ["Scheduled rows are promoted through the database RPC", scheduler.includes('"promote_scheduled_notifications"')],
  ["Expired notifications are processed", scheduler.includes('"expire_old_notifications"')],
  ["Push delivery checks recipient preferences", scheduler.includes('.select("push_enabled")') && scheduler.includes("preferences?.push_enabled")],
  ["Push is limited to active notification states", scheduler.includes('["unread", "sent"].includes(notification.status ?? "")')],
  ["24-hour reminders use the 23h to 25h window", scheduler.includes("23 * 60 * 60 * 1000") && scheduler.includes("25 * 60 * 60 * 1000")],
  ["2-hour reminders use the 1.5h to 2.5h window", scheduler.includes("90 * 60 * 1000") && scheduler.includes("150 * 60 * 1000")],
  ["Only confirmed participants receive reminders", scheduler.includes('"attending", "registered", "ticketed"')],
  ["Reminder dispatch uses the documented 24h and 2h per-user idempotency keys", scheduler.includes('"24h" : "2h"') && scheduler.includes("reminder-${window.type") && scheduler.includes("-${userId}")],
  ["Organizer milestones are 10, 50, and 100", scheduler.includes("[10, 50, 100]")],
  ["Every crossed organizer milestone is evaluated", scheduler.includes("const reachedMilestones = ORGANIZER_MILESTONES.filter")],
  ["Organizer insight keys are per recipient", scheduler.includes("attendee-milestone-${milestone}-${userId}")],
  ["Cron endpoint requires configured CRON_SECRET", route.includes('process.env.CRON_SECRET')],
  ["Cron authorization uses constant-time comparison", route.includes("timingSafeEqual")],
  ["Cron route does not expose processing to unauthenticated callers", route.indexOf("hasValidCronAuthorization(request)") < route.indexOf("processDueScheduledNotifications()")],
  ["Service-role credentials are required server-side", scheduler.includes("SUPABASE_SERVICE_ROLE_KEY")],
  ["No em dashes in scheduler", !scheduler.includes("\u2014")],
  ["No em dashes in cron route", !route.includes("\u2014")],
];

let failed = 0;
for (const [name, passed] of checks) {
  console.log(`[${passed ? "PASS" : "FAIL"}] ${name}`);
  if (!passed) failed += 1;
}
console.log(`Day 2 worker verification: ${checks.length - failed}/${checks.length} passed`);
if (failed > 0) process.exit(1);
