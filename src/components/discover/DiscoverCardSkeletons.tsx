export function EventCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-neutral-200 bg-white p-2.5 sm:p-3" aria-hidden="true">
      <div className="aspect-square rounded-xl bg-neutral-100" />
      <div className="mt-2 h-4 w-3/4 rounded bg-neutral-100" />
      <div className="mt-1 h-3 w-1/2 rounded bg-neutral-100" />
      <div className="mt-1 h-3 w-2/3 rounded bg-neutral-100" />
      <div className="mt-2 flex items-center justify-between border-t border-neutral-100 pt-1.5">
        <div className="h-3 w-1/3 rounded bg-neutral-100" />
        <div className="h-5 w-12 rounded-full bg-neutral-100" />
      </div>
    </div>
  );
}

export function CampaignCardSkeleton() {
  return (
    <div className="animate-pulse flex flex-row overflow-hidden rounded-2xl border border-neutral-200 bg-white p-2.5 sm:p-3" aria-hidden="true">
      <div className="aspect-square w-28 sm:w-44 md:w-52 shrink-0 rounded-xl bg-neutral-100" />
      <div className="flex flex-1 flex-col justify-between pl-2.5 sm:pl-4">
        <div>
          <div className="h-4 w-3/4 rounded bg-neutral-100" />
          <div className="mt-2 h-3 w-full rounded bg-neutral-100" />
          <div className="mt-1.5 h-3 w-1/2 rounded bg-neutral-100" />
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-2">
          <div className="h-3 w-1/3 rounded bg-neutral-100" />
          <div className="h-6 w-20 rounded-full bg-neutral-100" />
        </div>
      </div>
    </div>
  );
}

export function DiscoverCardSkeletons({ kind, count = 3 }: { kind: "event" | "campaign"; count?: number }) {
  const Skeleton = kind === "event" ? EventCardSkeleton : CampaignCardSkeleton;
  const layoutClass =
    kind === "campaign"
      ? "flex flex-col gap-3 sm:gap-4"
      : "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
  return <div className={layoutClass}>{Array.from({ length: count }, (_, index) => <Skeleton key={index} />)}</div>;
}
