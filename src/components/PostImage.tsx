"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/skeletons/Skeleton";
import { getUploadUrl } from "@/lib/api";
import { cn } from "@/lib/cn";

interface PostImageProps {
  src: string;
  alt?: string;
}

function syncImageState(
  img: HTMLImageElement | null,
  setLoaded: (v: boolean) => void,
  setError: (v: boolean) => void,
) {
  if (!img) return;
  if (!img.complete) return;
  if (img.naturalHeight > 0) {
    setLoaded(true);
    setError(false);
  } else {
    setLoaded(false);
    setError(true);
  }
}

export function PostImage({ src, alt = "Post" }: PostImageProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const resolvedSrc = getUploadUrl(src) || src;
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(!resolvedSrc);

  useLayoutEffect(() => {
    setLoaded(false);
    setError(!resolvedSrc);
    syncImageState(imgRef.current, setLoaded, setError);
  }, [resolvedSrc]);

  if (!resolvedSrc || error) {
    return (
      <div className="flex min-h-64 w-full items-center justify-center border-y border-surface-border px-4 py-8">
        <p className="text-center text-sm text-slate-500">Image unavailable</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-64 w-full max-h-[28rem] overflow-hidden border-y border-surface-border">
      {!loaded && (
        <Skeleton className="absolute inset-0 z-[1] rounded-none" aria-hidden />
      )}
      <img
        ref={imgRef}
        src={resolvedSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => {
          setLoaded(true);
          setError(false);
        }}
        onError={() => {
          setLoaded(false);
          setError(true);
        }}
        className={cn(
          "relative z-[2] max-h-[28rem] w-full object-cover transition-opacity",
          loaded ? "animate-fade-in opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}
