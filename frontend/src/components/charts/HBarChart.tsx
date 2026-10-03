export interface Bar {
  label: string;
  value: number;
  valueLabel: string;
}

interface Props {
  title: string; // read aloud by screen readers
  bars: Bar[];
  max: number; // the value that fills the whole track
}

const WIDTH = 720;
const ROW_H = 34;
const LABEL_W = 150;
const VALUE_W = 200;
const BAR_W = WIDTH - LABEL_W - VALUE_W;

/** A horizontal bar chart drawn as plain SVG. */
export default function HBarChart({ title, bars, max }: Props) {
  const height = bars.length * ROW_H + 4;
  return (
    <svg viewBox={`0 0 ${WIDTH} ${height}`} role="img" aria-label={title} className="chart">
      {bars.map((bar, i) => {
        const y = i * ROW_H + 4;
        const w = max > 0 ? Math.min(bar.value / max, 1) * BAR_W : 0;
        return (
          <g key={bar.label}>
            <title>{`${bar.label}: ${bar.valueLabel}`}</title>
            <text x={LABEL_W - 8} y={y + 19} textAnchor="end" className="chart-label">
              {bar.label}
            </text>
            <rect x={LABEL_W} y={y + 4} width={BAR_W} height={20} rx={3} className="chart-track" />
            <rect x={LABEL_W} y={y + 4} width={w} height={20} rx={3} className="chart-bar" />
            <text x={LABEL_W + BAR_W + 8} y={y + 19} className="chart-value">
              {bar.valueLabel}
            </text>
          </g>
        );
      })}
    </svg>
  );
}