"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Maximize2 } from "lucide-react";

interface ExpandableEventCoverProps {
  src: string | null;
  alt: string;
}

export default function ExpandableEventCover({
  src,
  alt,
}: ExpandableEventCoverProps) {
  const [expanded, setExpanded] = useState(false);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === "Escape") {
      setExpanded(false);
    }
  }, []);

  useEffect(() => {
    if (!expanded) return;

    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [expanded, handleKeyDown]);

  if (!src) {
    return (
      <div className="flex aspect-[16/7] items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-500">
        No cover photo uploaded
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setExpanded(true)}
        aria-label="Expand event cover photo"
        className="group relative block w-full overflow-hidden rounded-xl text-left"
      >
        <img
          src={src}
          alt={alt}
          className="aspect-[16/7] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
        <span className="absolute right-3 top-3 flex items-center gap-2 rounded-lg bg-black/65 px-3 py-2 text-sm text-white shadow backdrop-blur-sm transition group-hover:bg-black/80">
          <Maximize2 size={16} />
          Expand photo
        </span>
      </button>

      {expanded && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setExpanded(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Expanded event cover photo"
        >
          <button
            type="button"
            onClick={() => setExpanded(false)}
            aria-label="Close expanded photo"
            className="absolute right-5 top-5 rounded-full bg-white/15 p-3 text-white hover:bg-white/25"
          >
            <X size={24} />
          </button>

          <img
            src={src}
            alt={alt}
            onClick={(event) => event.stopPropagation()}
            className="max-h-[90vh] max-w-full rounded-lg object-contain"
          />
        </div>
      )}
    </>
  );
}
