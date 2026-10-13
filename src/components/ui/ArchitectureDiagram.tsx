import { ArrowDown } from 'lucide-react';
import type { Diagram } from '@/types';

/** Lightweight tiered diagram: each tier is a labelled row of service chips, connected by arrows. */
export function ArchitectureDiagram({ diagram }: { diagram: Diagram }) {
  return (
    <figure className="rounded-xl border border-line bg-surface2/60 p-4">
      <ol className="flex flex-col items-stretch gap-1">
        {diagram.tiers.map((tier, i) => (
          <li key={tier.label} className="flex flex-col items-center">
            <div className="w-full rounded-lg border border-line bg-surface p-3">
              <div className="label-eyebrow mb-2">{tier.label}</div>
              <div className="flex flex-wrap gap-2">
                {tier.items.map((item) => (
                  <span key={item} className="rounded-md border border-line bg-surface2 px-2.5 py-1 text-sm font-medium">{item}</span>
                ))}
              </div>
            </div>
            {i < diagram.tiers.length - 1 && <ArrowDown className="my-1 h-4 w-4 text-muted" aria-hidden />}
          </li>
        ))}
      </ol>
      <figcaption className="mt-3 text-center text-sm text-muted">{diagram.caption}</figcaption>
    </figure>
  );
}
