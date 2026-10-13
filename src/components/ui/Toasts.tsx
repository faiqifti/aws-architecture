import { Award, Flame, Sparkles, Target, X } from 'lucide-react';
import { useEffect } from 'react';
import { achievementById } from '@/lib/progression/achievements';
import { useProgress, type Toast } from '@/hooks/useProgress';

function describe(t: Toast) {
  const e = t.event;
  switch (e.type) {
    case 'xp':
      return { Icon: Sparkles, text: `+${e.amount} XP`, sub: e.label };
    case 'level':
      return { Icon: Flame, text: `Level ${e.level} reached`, sub: 'Keep going!' };
    case 'achievement':
      return { Icon: Award, text: 'Achievement unlocked', sub: achievementById(e.id)?.name ?? e.id };
    case 'mission':
      return { Icon: Target, text: 'Daily mission complete', sub: e.id };
  }
}

function ToastItem({ toast }: { toast: Toast }) {
  const { dismissToast } = useProgress();
  useEffect(() => {
    const id = window.setTimeout(() => dismissToast(toast.id), 4500);
    return () => window.clearTimeout(id);
  }, [toast.id, dismissToast]);
  const { Icon, text, sub } = describe(toast);
  return (
    <div className="toast-in flex items-start gap-3 rounded-lg border border-line bg-surface p-3 shadow-lg">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-ink" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{text}</p>
        <p className="truncate text-xs text-muted">{sub}</p>
      </div>
      <button type="button" aria-label="Dismiss notification" onClick={() => dismissToast(toast.id)} className="rounded p-1 text-muted hover:bg-surface2">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function Toasts() {
  const { toasts } = useProgress();
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-72 max-w-[calc(100vw-2rem)] flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} />
        </div>
      ))}
    </div>
  );
}
