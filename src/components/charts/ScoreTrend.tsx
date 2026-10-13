interface Point {
  label: string;
  percent: number;
}

/** Small SVG line chart of recent quiz scores (0–100%). */
export function ScoreTrend({ points }: { points: Point[] }) {
  if (points.length < 2) return null;
  const w = 320;
  const h = 90;
  const pad = 8;
  const x = (i: number) => pad + (i * (w - pad * 2)) / (points.length - 1);
  const y = (p: number) => h - pad - (p / 100) * (h - pad * 2);
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.percent).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`Recent scores: ${points.map((p) => `${p.percent}%`).join(', ')}`} className="h-24 w-full">
      <line x1={pad} x2={w - pad} y1={y(70)} y2={y(70)} stroke="rgb(var(--line))" strokeDasharray="4 4" />
      <path d={path} fill="none" stroke="rgb(var(--brand))" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.percent)} r={3.5} fill="rgb(var(--surface))" stroke="rgb(var(--brand))" strokeWidth={2}>
          <title>{`${p.label}: ${p.percent}%`}</title>
        </circle>
      ))}
    </svg>
  );
}
