import { DOMAINS } from '@/data/domains';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { DomainId } from '@/types';

interface Row {
  accuracy: number | null;
  detail: string;
}

/** Horizontal bars, one per exam domain. Bars are labelled with text so colour is never the only signal. */
export function DomainBars({ data, highlight }: { data: Record<DomainId, Row>; highlight?: DomainId | null }) {
  return (
    <ul className="space-y-4">
      {DOMAINS.map((d) => {
        const row = data[d.id];
        const pct = row.accuracy;
        return (
          <li key={d.id}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
              <span className="font-medium">
                {d.name}
                {highlight === d.id && <span className="ml-2 rounded bg-bad/15 px-1.5 py-0.5 text-xs font-semibold text-bad">Weakest</span>}
              </span>
              <span className="tabular-nums text-muted">{pct === null ? 'No data' : `${pct}%`}</span>
            </div>
            <ProgressBar value={pct ?? 0} tone={pct === null ? 'info' : pct >= 75 ? 'ok' : pct >= 50 ? 'brand' : 'bad'} label={`${d.name} accuracy`} />
            <p className="mt-1 text-xs text-muted">{row.detail}</p>
          </li>
        );
      })}
    </ul>
  );
}
