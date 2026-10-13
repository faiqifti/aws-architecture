interface Props {
  value: number; // 0..100
  label?: string;
  tone?: 'brand' | 'ok' | 'bad' | 'info';
  className?: string;
}

const TONES = { brand: 'bg-brand', ok: 'bg-ok', bad: 'bg-bad', info: 'bg-info' };

export function ProgressBar({ value, label, tone = 'brand', className = '' }: Props) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-valuenow={v}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={`h-2 w-full overflow-hidden rounded-full bg-surface2 ${className}`}
    >
      <div className={`h-full rounded-full transition-[width] duration-500 ${TONES[tone]}`} style={{ width: `${v}%` }} />
    </div>
  );
}
