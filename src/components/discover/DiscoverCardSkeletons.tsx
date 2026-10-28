export function EventCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-neutral-200 bg-white p-3" aria-hidden="true">
      <div className="aspect-[16/10] rounded-xl bg-neutral-100" />
      <div className="mt-4 h-4 w-2/3 rounded bg-neutral-100" />
      <div className="mt-3 h-3 w-1/2 rounded bg-neutral-100" />
      <div className="mt-5 h-3 w-full rounded bg-neutral-100" />
      <div className="mt-2 h-3 w-4/5 rounded bg-neutral-100" />
    </div>
  );
}

export function CampaignCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-neutral-200 bg-white" aria-hidden="true">
      <div className="aspect-[16/10] bg-neutral-100" />
      <div className="p-5">
        <div className="h-3 w-1/4 rounded bg-neutral-100" />
        <div className="mt-3 h-5 w-3/4 rounded bg-neutral-100" />
        <div className="mt-2 h-3 w-1/2 rounded bg-neutral-100" />
        <div className="mt-5 h-10 rounded-xl bg-neutral-100" />
      </div>
    </div>
  );
}

export function DiscoverCardSkeletons({ kind, count = 3 }: { kind: "event" | "campaign"; count?: number }) {
  const Skeleton = kind === "event" ? EventCardSkeleton : CampaignCardSkeleton;
  return <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: count }, (_, index) => <Skeleton key={index} />)}</div>;
}
