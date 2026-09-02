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
                className="w-full rounded-t-md bg-primary-container transition-colors duration-100 ease-fluent hover:bg-primary-container-hover"
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

/** Filled area line — drawn as inline SVG so it scales with the card. */
export function AreaChart({ data, caption, emptyLabel, className }: ChartProps) {
  if (data.length === 0) return <Empty label={emptyLabel ?? caption} />;

  const max = Math.max(...data.map((point) => point.value), 1);
  const step = data.length > 1 ? 100 / (data.length - 1) : 100;

  const points = data.map((point, index) => ({
    x: index * step,
    y: 40 - (point.value / max) * 36,
  }));

  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `0,40 ${line} 100,40`;

  return (
    <>
      <DataTable data={data} caption={caption} />
      <div aria-hidden dir="ltr" className={cn("space-y-2", className)}>
        <svg
          viewBox="0 0 100 40"
          preserveAspectRatio="none"
          className="h-40 w-full rounded-xl bg-surface-low"
        >
          <polygon points={area} fill="var(--colorBrandBackground)" opacity="0.16" />
          <polyline
            points={line}
            fill="none"
            stroke="var(--colorBrandBackground)"
            strokeWidth="1.5"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          {points.map((point, index) => (
            <circle
              key={data[index].label}
              cx={point.x}
              cy={point.y}
              r="1.5"
              fill="var(--colorBrandBackground)"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

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
                className="block h-full rounded-full bg-primary-container"
                style={{ width: `${(point.value / max) * 100}%` }}
              />
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
