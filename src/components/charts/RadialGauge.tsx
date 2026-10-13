/** Circular gauge with a text value in the middle. `value` null renders an empty placeholder. */
export function RadialGauge({ value, label }: { value: number | null; label: string }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const pct = value ?? 0;
  return (
    <div className="relative h-24 w-24 shrink-0" role="img" aria-label={`${label}: ${value === null ? 'not enough data' : `${value}%`}`}>
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgb(var(--surface2))" strokeWidth="8" />
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgb(var(--brand))" strokeWidth="8" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} className="transition-[stroke-dashoffset] duration-700" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-lg font-bold tabular-nums">{value === null ? '—' : `${value}%`}</div>
    </div>
  );
}
