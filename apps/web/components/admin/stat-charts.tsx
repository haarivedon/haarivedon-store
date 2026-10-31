import type { AdminStats } from "@repo/contract";

/**
 * Dependency-free dashboard charts. Pure SVG/CSS, server-rendered — they match
 * the admin's square, hairline aesthetic without pulling in a chart library.
 */

const dayLabel = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });

/** 14-day grouped bars: bookings (gold) vs enquiries (green). */
export function ActivityChart({ data }: { data: AdminStats["activity"] }) {
  const W = 700;
  const H = 180;
  const padX = 12;
  const padTop = 12;
  const padBottom = 28;
  const chartH = H - padTop - padBottom;
  const groupW = (W - padX * 2) / data.length;
  const barW = Math.min(14, groupW / 2 - 2);
  const max = Math.max(1, ...data.map((d) => Math.max(d.bookings, d.enquiries)));
  const y = (v: number) => padTop + chartH - (v / max) * chartH;

  return (
    <div>
      <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 bg-gold" /> Bookings
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 bg-brand-600" /> Enquiries
        </span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-44 w-full"
        role="img"
        aria-label="Bookings and enquiries over the last 14 days"
      >
        {/* baseline */}
        <line
          x1={padX}
          x2={W - padX}
          y1={padTop + chartH}
          y2={padTop + chartH}
          className="stroke-border"
          strokeWidth="1"
        />
        {data.map((d, i) => {
          const gx = padX + i * groupW + groupW / 2;
          return (
            <g key={d.date}>
              <rect
                x={gx - barW - 1}
                y={y(d.bookings)}
                width={barW}
                height={padTop + chartH - y(d.bookings)}
                className="fill-gold"
              />
              <rect
                x={gx + 1}
                y={y(d.enquiries)}
                width={barW}
                height={padTop + chartH - y(d.enquiries)}
                className="fill-brand-600"
              />
              {i % 2 === 0 && (
                <text
                  x={gx}
                  y={H - 8}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[9px]"
                >
                  {dayLabel(d.date)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/** Horizontal bars for a status breakdown. */
export function BreakdownBars({
  items,
}: {
  items: { label: string; value: number }[];
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">Nothing yet.</p>;
  }
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-3 text-sm">
          <span className="w-20 shrink-0 capitalize text-charcoal/80">
            {it.label}
          </span>
          <span className="h-3 flex-1 bg-cream">
            <span
              className="block h-3 bg-forest"
              style={{ width: `${(it.value / max) * 100}%` }}
            />
          </span>
          <span className="w-8 shrink-0 text-right font-semibold text-forest">
            {it.value}
          </span>
        </li>
      ))}
    </ul>
  );
}
