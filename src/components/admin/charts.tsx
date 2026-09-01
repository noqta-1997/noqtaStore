import { cn } from "@/lib/utils";

export interface ChartPoint {
  label: string;
  value: number;
  /** Optional pre-formatted value shown in the tooltip title. */
  display?: string;
}

interface ChartProps {
  data: ChartPoint[];
  className?: string;
}

/** Vertical bars — sharp edges, one accent colour, no gridlines. */
export function BarChart({ data, className }: ChartProps) {
  const max = Math.max(...data.map((point) => point.value), 1);

  /* Time flows left-to-right in both locales, so the plot stays LTR. */
  return (
    <div dir="ltr" className={cn("flex h-48 items-stretch gap-1.5 sm:gap-2", className)}>
      {data.map((point) => (
        <div key={point.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <div className="flex w-full flex-1 items-end">
            <div
              className="w-full border border-line bg-primary-container transition-colors hover:bg-primary"
              style={{ height: `${Math.max((point.value / max) * 100, 2)}%` }}
              title={`${point.label}: ${point.display ?? point.value}`}
            />
          </div>
          <span className="truncate font-mono text-[0.625rem] text-muted" data-numeric>
            {point.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Filled area line — drawn as inline SVG so it scales with the card. */
export function AreaChart({ data, className }: ChartProps) {
  const max = Math.max(...data.map((point) => point.value), 1);
  const step = data.length > 1 ? 100 / (data.length - 1) : 100;

  const points = data.map((point, index) => ({
    x: index * step,
    y: 40 - (point.value / max) * 36,
  }));

  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `0,40 ${line} 100,40`;

  /* Time flows left-to-right in both locales, so the plot stays LTR. */
  return (
    <div dir="ltr" className={cn("space-y-2", className)}>
      <svg
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
        role="img"
        aria-hidden
        className="h-44 w-full border border-line bg-surface-low"
      >
        <polygon points={area} fill="var(--color-primary-container)" opacity="0.25" />
        <polyline
          points={line}
          fill="none"
          stroke="var(--color-primary-container)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        {points.map((point, index) => (
          <rect
            key={data[index].label}
            x={point.x - 0.6}
            y={point.y - 0.6}
            width="1.2"
            height="1.2"
            fill="var(--color-line)"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      <div className="flex justify-between">
        {data.map((point, index) => (
          <span
            key={point.label}
            className={cn(
              "font-mono text-[0.625rem] text-muted",
              index % 2 === 1 && "max-sm:hidden",
            )}
            data-numeric
          >
            {point.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Horizontal share bars used for category breakdowns. */
export function ShareBars({ data, className }: ChartProps) {
  const max = Math.max(...data.map((point) => point.value), 1);

  return (
    <ul className={cn("space-y-3", className)}>
      {data.map((point) => (
        <li key={point.label} className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate text-sm text-on-surface">{point.label}</span>
            <span className="font-mono text-label-sm text-muted" data-numeric>
              {point.display ?? `${point.value}%`}
            </span>
          </div>
          <span className="block h-2.5 w-full border border-line bg-surface-low">
            <span
              className="block h-full bg-primary-container"
              style={{ width: `${(point.value / max) * 100}%` }}
            />
          </span>
        </li>
      ))}
    </ul>
  );
}
