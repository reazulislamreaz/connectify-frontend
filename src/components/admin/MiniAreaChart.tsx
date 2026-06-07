"use client";

import { useId, useMemo } from "react";
import type { TimePoint } from "@/types";

/**
 * Dependency-free area chart (raw SVG). Far lighter than pulling in a charting
 * library — the whole admin bundle stays small. Scales to its container via
 * viewBox; strokes stay crisp with non-scaling-stroke.
 */
export function MiniAreaChart({
  data,
  stroke = "#3b82f6",
  fill = "rgba(59,130,246,0.12)",
  height = 88,
}: {
  data: TimePoint[];
  stroke?: string;
  fill?: string;
  height?: number;
}) {
  const gradId = useId();
  const W = 320;
  const H = 100;
  const PAD = 6;

  const { line, area, max } = useMemo(() => {
    const counts = data.map((d) => d.count);
    const maxV = Math.max(1, ...counts);
    const minV = Math.min(0, ...counts);
    const span = maxV - minV || 1;
    const n = data.length;
    const x = (i: number) =>
      n <= 1 ? W / 2 : PAD + (i / (n - 1)) * (W - 2 * PAD);
    const y = (v: number) => H - PAD - ((v - minV) / span) * (H - 2 * PAD);

    const pts = data.map((d, i) => `${x(i).toFixed(1)},${y(d.count).toFixed(1)}`);
    const lineP = pts.length ? `M${pts.join(" L")}` : "";
    const areaP = pts.length
      ? `M${x(0).toFixed(1)},${H - PAD} L${pts.join(" L")} L${x(n - 1).toFixed(1)},${H - PAD} Z`
      : "";
    return { line: lineP, area: areaP, max: maxV };
  }, [data]);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      width="100%"
      height={height}
      role="img"
      aria-label={`Trend, peak ${max}`}
      className="block"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      {area && <path d={area} fill={`url(#${gradId})`} />}
      {line && (
        <path
          d={line}
          fill="none"
          stroke={stroke}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
}
