import { Award, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useProgress } from '@/hooks/useProgress';
import { ACHIEVEMENTS } from '@/lib/progression/achievements';

export function AchievementsPage() {
  const { state } = useProgress();
  const unlocked = ACHIEVEMENTS.filter((a) => a.id in state.achievements).length;
  return (
    <>
      <PageHeader title="Achievements" subtitle={`${unlocked} of ${ACHIEVEMENTS.length} unlocked. Each one is checked against your saved progress, not a counter that can be clicked.`} />
      <ul className="grid gap-4 md:grid-cols-2">
        {ACHIEVEMENTS.map((a) => {
          const at = state.achievements[a.id];
          const p = a.progress(state);
          return (
            <li key={a.id} className={`card p-5 ${at ? 'border-brand' : ''}`}>
              <div className="flex items-start gap-3">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${at ? 'bg-brand text-on-brand' : 'bg-surface2 text-muted'}`}>
                  {at ? <Award className="h-5 w-5" aria-hidden /> : <Lock className="h-5 w-5" aria-hidden />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-semibold">{a.name}</h2>
                    {at ? <Badge tone="ok">Unlocked {new Date(at).toLocaleDateString()}</Badge> : <Badge>Locked</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-muted">{a.description}</p>
                  <div className="mt-3">
                    <ProgressBar value={(p.current / p.target) * 100} tone={at ? 'ok' : 'brand'} label={`${a.name} progress`} />
                    <p className="mt-1 text-xs tabular-nums text-muted">{p.target === 1 && a.id === 'security-minded' ? (at ? 'Requirement met' : 'Requirement not yet met') : `${p.current}/${p.target}`}</p>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
