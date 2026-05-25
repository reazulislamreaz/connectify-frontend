"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/skeletons/Skeleton";
import { cn } from "@/lib/cn";

interface PostImageProps {
  src: string;
  alt?: string;
}

export function PostImage({ src, alt = "Post" }: PostImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [src]);

  return (
    <div className="relative min-h-64 w-full max-h-[28rem] overflow-hidden border-y border-surface-border">
      {!loaded && !error && (
        <Skeleton className="absolute inset-0 rounded-none" aria-hidden />
      )}
      {error ? (
        <p className="flex min-h-64 items-center justify-center px-4 py-8 text-center text-sm text-slate-500">
          Image unavailable
        </p>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={cn(
            "max-h-[28rem] w-full object-cover transition-opacity",
            loaded ? "animate-fade-in opacity-100" : "opacity-0",
          )}
        />
      )}
    </div>
  );
}
