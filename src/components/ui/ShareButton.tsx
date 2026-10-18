
"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";

type Props = {
  title: string;
  path: string;
  sourceType: "event" | "campaign";
};

export default function ShareButton({ title, path, sourceType }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = new URL(path, window.location.origin);
    url.searchParams.set(
      "src",
      sourceType === "event" ? "event_share" : "campaign_share"
    );

    const shareUrl = url.toString();

    if (navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl });
        return;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", shareUrl);
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label="Share"
      className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50"
    >
      {copied ? (
        <Check className="h-4 w-4" />
      ) : (
        <Share2 className="h-4 w-4" />
      )}
      <span>{copied ? "Copied" : "Share"}</span>
    </button>
  );
}
