import Link from "next/link";
import { type LucideIcon, ArrowRight } from "lucide-react";

interface OrganizerTabPlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
  actionLabel?: string;
  actionHref?: string;
}

export function OrganizerTabPlaceholder({
  title,
  description,
  icon: Icon,
  badge,
  actionLabel,
  actionHref,
}: OrganizerTabPlaceholderProps) {
  return (
    <div className="rounded-2xl border border-dashed border-neutral-200 bg-white p-8 sm:p-12 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-500">
        <Icon className="h-7 w-7" />
      </div>

      {badge && (
        <span className="mt-4 inline-flex items-center rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
          {badge}
        </span>
      )}

      <h3 className="mt-3 font-serif text-xl font-bold text-neutral-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-xs sm:text-sm text-neutral-500">{description}</p>

      {actionLabel && actionHref && (
        <div className="mt-6">
          <Link
            href={actionHref}
            className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-700"
          >
            <span>{actionLabel}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
