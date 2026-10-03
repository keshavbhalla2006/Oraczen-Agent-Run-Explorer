import type { DayCount } from "@/lib/types";

const WIDTH = 760;
const HEIGHT = 240;
const LEFT = 36;
const RIGHT = 8;
const TOP = 10;
const BOTTOM = 30;

/** Vertical bars, one per day. Days with zero runs are kept so gaps stay visible. */
export default function DayChart({ days, title }: { days: DayCount[]; title: string }) {
  const plotW = WIDTH - LEFT - RIGHT;
  const plotH = HEIGHT - TOP - BOTTOM;
  const maxCount = Math.max(1, ...days.map((d) => d.count));
  const yMax = maxCount % 2 === 0 ? maxCount : maxCount + 1; // even top, so the middle gridline is a whole number
  const slot = plotW / days.length;
  const barW = Math.max(1, slot * 0.7);
  const labelEvery = Math.ceil(days.length / 7);
  const ticks = [0, yMax / 2, yMax];

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={title} className="chart">
      {ticks.map((tick) => {
        const y = TOP + plotH - (tick / yMax) * plotH;
        return (
          <g key={tick}>
            <line x1={LEFT} x2={WIDTH - RIGHT} y1={y} y2={y} className="chart-grid" />
            <text x={LEFT - 6} y={y + 4} textAnchor="end" className="chart-axis">
              {tick}
            </text>
          </g>
        );
      })}
      {days.map((day, i) => {
        const h = (day.count / yMax) * plotH;
        const x = LEFT + i * slot + (slot - barW) / 2;
        return (
          <g key={day.date}>
            <title>{`${day.date}: ${day.count} run${day.count === 1 ? "" : "s"}`}</title>
            {day.count > 0 && <rect x={x} y={TOP + plotH - h} width={barW} height={h} className="chart-bar" />}
            {i % labelEvery === 0 && (
              <text x={x + barW / 2} y={HEIGHT - 10} textAnchor="middle" className="chart-axis">
                {day.date.slice(5)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}