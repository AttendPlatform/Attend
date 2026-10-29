import Link from "next/link";
import { LucideIcon, ArrowRight } from "lucide-react";

interface OrganizerTabPlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  actionLabel?: string;
  actionHref?: string;
  badge?: string;
}

export function OrganizerTabPlaceholder({
  title,
  description,
  icon: Icon,
  actionLabel,
  actionHref,
  badge,
}: OrganizerTabPlaceholderProps) {
  return (
    <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-6 py-12 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
        <Icon className="h-6 w-6" />
      </div>
      {badge && (
        <span className="mt-4 inline-block rounded-full bg-violet-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet-800">
          {badge}
        </span>
      )}
      <h3 className="mt-3 font-serif text-lg font-bold text-neutral-900">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-xs text-neutral-500">{description}</p>
      {actionLabel && actionHref && (
        <div className="mt-5">
          <Link
            href={actionHref}
            className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-700"
          >
            <span>{actionLabel}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
