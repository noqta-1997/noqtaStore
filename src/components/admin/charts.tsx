import { cn } from "@/lib/utils";

export interface ChartPoint {
  label: string;
  value: number;
  /** Optional pre-formatted value shown in the tooltip title. */
  display?: string;
}

interface ChartProps {
  data: ChartPoint[];
  /** Names the chart for assistive technology and labels the data table. */
  caption: string;
  emptyLabel?: string;
  className?: string;
}

/**
 * A chart is a picture of numbers, and a picture is nothing to a screen
 * reader. Each chart below renders the same series as a visually hidden table
 * — the numbers themselves, not a summary of them — and marks the drawing
 * `aria-hidden` so the two are never announced twice.
 */
function DataTable({ data, caption }: { data: ChartPoint[]; caption: string }) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <tbody>
        {data.map((point) => (
          <tr key={point.label}>
            <th scope="row">{point.label}</th>
            <td>{point.display ?? point.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <p className="flex h-40 items-center justify-center rounded-xl bg-surface-low text-body-md text-muted">
      {label}
    </p>
  );
}

/** Vertical bars — one accent colour, no gridlines. */
export function BarChart({ data, caption, emptyLabel, className }: ChartProps) {
  if (data.length === 0) return <Empty label={emptyLabel ?? caption} />;

  const max = Math.max(...data.map((point) => point.value), 1);

  /* Time flows left-to-right in both locales, so the plot stays LTR. */
  return (
    <>
      <DataTable data={data} caption={caption} />
      <div
        aria-hidden
        dir="ltr"
        className={cn("flex h-40 items-stretch gap-1.5 sm:gap-2", className)}
      >
        {data.map((point) => (
          <div key={point.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
            <div className="flex w-full flex-1 items-end">
              <div
                className="w-full rounded-t-md bg-data transition-colors duration-100 ease-fluent hover:bg-primary-container"
                style={{ height: `${Math.max((point.value / max) * 100, 2)}%` }}
                title={`${point.label}: ${point.display ?? point.value}`}
              />
            </div>
            <span className="truncate text-label-md text-muted" data-numeric>
              {point.label}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

/**
 * Filled area line — inline SVG, no charting dependency.
 *
 * The viewBox is stretched (`preserveAspectRatio="none"`) so the plot fills
 * whatever width the card gives it. That is fine for the path, whose stroke is
 * held at a true 1.5px by `vector-effect`, but it is fatal for anything with
 * its own geometry: this used to draw a `<circle>` at every month and each one
 * came out as a flat oval, because a 100×40 box painted at 900×160 squashes a
 * circle by nine to one. The marker is an HTML element positioned in percent
 * instead, so it stays round at any width.
 *
 * The line is smoothed with cubic segments whose control points sit at the
 * midpoint x of each span, level with the two ends. That shape cannot overshoot
 * a value the data never reached — the failure mode of a naive spline on a
 * series like this one, where eleven flat months meet a spike — while still
 * reading as a trend rather than a zigzag.
 *
 * Only the last month is marked. A dot on every point competes with the line
 * for attention and, on a series that is mostly zero, draws a row of full
 * stops along the floor.
 */
export function AreaChart({ data, caption, emptyLabel, className }: ChartProps) {
  if (data.length === 0) return <Empty label={emptyLabel ?? caption} />;

  const max = Math.max(...data.map((point) => point.value), 1);
  const step = data.length > 1 ? 100 / (data.length - 1) : 100;

  /* Headroom above the peak so the marker is never clipped by the top edge. */
  const points = data.map((point, index) => ({
    x: index * step,
    y: 40 - (point.value / max) * 32 - 4,
  }));

  const line = points
    .map((point, index) => {
      if (index === 0) return `M ${point.x},${point.y}`;
      const previous = points[index - 1];
      const midX = (previous.x + point.x) / 2;
      return `C ${midX},${previous.y} ${midX},${point.y} ${point.x},${point.y}`;
    })
    .join(" ");

  const area = `${line} L 100,40 L 0,40 Z`;
  const last = points[points.length - 1];
  const gradientId = "area-chart-fade";

  return (
    <>
      <DataTable data={data} caption={caption} />
      <div aria-hidden dir="ltr" className={cn("space-y-2", className)}>
        <div className="relative">
          <svg
            viewBox="0 0 100 40"
            preserveAspectRatio="none"
            className="h-40 w-full rounded-xl border border-line-divider bg-surface-low"
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--data)" stopOpacity="0.28" />
                <stop offset="100%" stopColor="var(--data)" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {/* Quarter gridlines, so a height can be read rather than guessed. */}
            {[10, 20, 30].map((y) => (
              <line
                key={y}
                x1="0"
                x2="100"
                y1={y}
                y2={y}
                stroke="var(--line-divider)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            ))}

            <path d={area} fill={`url(#${gradientId})`} />
            <path
              d={line}
              fill="none"
              stroke="var(--data)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          <span
            className="absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-data ring-2 ring-card"
            style={{ left: `${last.x}%`, top: `${(last.y / 40) * 100}%` }}
          />
        </div>

        <div className="flex justify-between">
          {data.map((point, index) => (
            <span
              key={point.label}
              className={cn(
                "text-label-md text-muted",
                index % 2 === 1 && "max-sm:hidden",
              )}
              data-numeric
            >
              {point.label}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}

/** Horizontal share bars used for category breakdowns. */
export function ShareBars({ data, caption, emptyLabel, className }: ChartProps) {
  if (data.length === 0) return <Empty label={emptyLabel ?? caption} />;

  const max = Math.max(...data.map((point) => point.value), 1);

  return (
    <>
      <DataTable data={data} caption={caption} />
      <ul aria-hidden className={cn("space-y-3", className)}>
        {data.map((point) => (
          <li key={point.label} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="truncate text-body-md text-on-surface">{point.label}</span>
              <span className="text-label-md text-muted" data-numeric>
                {point.display ?? `${point.value}%`}
              </span>
            </div>
            <span className="block h-2.5 w-full overflow-hidden rounded-full bg-surface-low">
              <span
                className="block h-full rounded-full bg-data"
                style={{ width: `${(point.value / max) * 100}%` }}
              />
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
