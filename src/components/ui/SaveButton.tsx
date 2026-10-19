
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";
import {
  toggleSavedAction,
  type SaveTargetType,
} from "@/app/actions/saved";

type Props = {
  targetId: string;
  targetType: SaveTargetType;
  initialSaved?: boolean;
};

export default function SaveButton({
  targetId,
  targetType,
  initialSaved = false,
}: Props) {
  const [saved, setSaved] = useState(initialSaved);
  const [prevInitialSaved, setPrevInitialSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (initialSaved !== prevInitialSaved) {
    setPrevInitialSaved(initialSaved);
    setSaved(initialSaved);
  }

  function handleClick() {
    if (pending) return;

    const previous = saved;
    setSaved(!previous);

    startTransition(async () => {
      const currentPath =
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : undefined;

      const result = await toggleSavedAction(
        targetType,
        targetId,
        typeof window !== "undefined" ? window.location.pathname : undefined
      );

      if (result.requiresLogin) {
        setSaved(previous);
        const nextUrl = currentPath || "/";
        router.push(`/login?next=${encodeURIComponent(nextUrl)}`);
        return;
      }

      if (result.error || result.saved === undefined) {
        setSaved(previous);
        console.warn(result.error ?? "Failed to update saved item.");
        return;
      }

      setSaved(result.saved);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label={saved ? "Remove from saved items" : "Save item"}
      aria-pressed={saved}
      title={saved ? "Saved" : "Save"}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 transition hover:bg-violet-50 hover:text-violet-700 disabled:opacity-60"
    >
      <Bookmark
        className={`h-5 w-5 ${saved ? "fill-violet-600 text-violet-600" : ""}`}
      />
    </button>
  );
}
