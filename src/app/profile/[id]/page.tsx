import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Globe, MapPin, UserRound } from "lucide-react";
import { getProfileById, getPublicProfileEvents } from "@/services";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { id } = await params;
  const [profile, events] = await Promise.all([
    getProfileById(id),
    getPublicProfileEvents(id),
  ]);

  if (!profile) {
    notFound();
  }

  const profileName = profile.full_name || profile.name || "Attend Creator";
  const avatarUrl = profile.avatar_url || null;
  const coverUrl = profile.cover_url || null;

  return (
    <main className="min-h-screen bg-neutral-50 pb-12">
      {/* HEADER HERO */}
      <section className="overflow-hidden border-b border-neutral-200 bg-white">
        <div className="relative h-44 bg-neutral-100 sm:h-56">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt="Cover"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-violet-100 via-violet-50 to-white" />
          )}
        </div>

        <div className="mx-auto max-w-5xl px-5 pb-8 sm:px-6">
          <div className="-mt-12 flex flex-col gap-4 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-4">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={profileName}
                  className="h-24 w-24 shrink-0 rounded-2xl border-4 border-white bg-neutral-100 object-cover shadow-sm sm:h-32 sm:w-32"
                />
              ) : (
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-violet-100 text-2xl font-bold text-violet-700 shadow-sm sm:h-32 sm:w-32">
                  <UserRound className="h-10 w-10 text-violet-600" />
                </div>
              )}

              <div className="pb-1">
                <h1 className="text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
                  {profileName}
                </h1>

                {profile.bio && (
                  <p className="mt-1 max-w-2xl text-sm text-neutral-600">
                    {profile.bio}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-neutral-500">
            {profile.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {profile.location}
              </span>
            )}

            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-violet-600 hover:underline"
              >
                <Globe className="h-3.5 w-3.5" />
                {new URL(profile.website).hostname}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* PUBLIC EVENTS LIST */}
      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-6">
        <h2 className="text-xl font-bold text-neutral-950">
          Published Events
        </h2>

        {events && events.length > 0 ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="group block"
              >
                <article className="overflow-hidden rounded-2xl border border-neutral-200 bg-white transition hover:-translate-y-1 hover:shadow-lg">
                  <div className="relative aspect-[16/9] bg-neutral-100">
                    {event.cover_image && (
                      <img
                        src={event.cover_image}
                        alt={event.title}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="line-clamp-1 font-semibold text-neutral-900">
                      {event.title}
                    </h3>

                    <p className="mt-2 flex items-center gap-1 text-xs text-neutral-500">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {event.start_at
                        ? new Date(event.start_at).toLocaleDateString()
                        : "TBA"}
                    </p>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-neutral-500">
            No public events created yet.
          </p>
        )}
      </div>
    </main>
  );
}
