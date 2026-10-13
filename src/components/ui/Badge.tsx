import type { ReactNode } from 'react';

type Tone = 'neutral' | 'brand' | 'ok' | 'bad' | 'info';

const TONES: Record<Tone, string> = {
  neutral: 'bg-surface2 text-muted',
  brand: 'bg-brand/15 text-brand-ink',
  ok: 'bg-ok/15 text-ok',
  bad: 'bg-bad/15 text-bad',
  info: 'bg-info/15 text-info',
};

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONES[tone]}`}>{children}</span>;
}
