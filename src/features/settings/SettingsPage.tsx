import { Download, RotateCcw, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PageHeader } from '@/components/ui/PageHeader';
import { useProgress } from '@/hooks/useProgress';
import { exportProgress, parseImport, type ImportResult } from '@/lib/storage/backup';
import type { Settings } from '@/types';

const TARGETS = [5, 10, 15, 20, 30, 50];
const DURATIONS = [10, 15, 20, 30, 45, 60, 90];

function Section({ title, children, description }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="card p-5">
      <h2 className="font-semibold">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export function SettingsPage() {
  const { state, update, replaceState, resetAll, storageOk } = useProgress();
  const s = state.settings;
  const set = (patch: Partial<Settings>) => update((st) => ({ ...st, settings: { ...st.settings, ...patch } }));
  const fileRef = useRef<HTMLInputElement>(null);
  const [imp, setImp] = useState<ImportResult | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [notice, setNotice] = useState('');

  const download = () => {
    const blob = new Blob([exportProgress(state)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cloudquest-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setNotice('Backup downloaded.');
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setNotice('');
    setImp(parseImport(await file.text()));
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Preferences and data management. Everything is stored in this browser only." />
      {!storageOk && <p role="alert" className="mb-4 rounded-lg border border-bad bg-bad/10 p-3 text-sm">Your browser is blocking local storage, so progress will be lost when you close this tab. Export a backup to keep it.</p>}
      <div className="max-w-3xl space-y-6">
        <Section title="Learning goals" description="These change your daily mission and your recommendations.">
          <label className="block text-sm">
            <span className="font-medium">Daily question target</span>
            <span className="block text-muted">Sets the "Answer N questions" daily mission.</span>
            <select className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2.5 sm:w-48" value={s.dailyTarget} onChange={(e) => set({ dailyTarget: Number(e.target.value) })}>
              {TARGETS.map((t) => <option key={t} value={t}>{t} questions</option>)}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-medium">Preferred study session</span>
            <span className="block text-muted">Used to size practice sessions and suggest modules that fit.</span>
            <select className="mt-2 w-full rounded-lg border border-line bg-surface px-3 py-2.5 sm:w-48" value={s.studyMinutes} onChange={(e) => set({ studyMinutes: Number(e.target.value) })}>
              {DURATIONS.map((t) => <option key={t} value={t}>{t} minutes</option>)}
            </select>
          </label>
        </Section>

        <Section title="Appearance">
          <fieldset>
            <legend className="text-sm font-medium">Theme</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {(['light', 'dark', 'system'] as const).map((t) => (
                <label key={t} className={`cursor-pointer rounded-lg border px-4 py-2 text-sm capitalize ${s.theme === t ? 'border-info bg-info/10 font-semibold' : 'border-line hover:bg-surface2'}`}>
                  <input type="radio" name="theme" className="sr-only" checked={s.theme === t} onChange={() => set({ theme: t })} />
                  {t}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="flex cursor-pointer items-start gap-3 text-sm">
            <input type="checkbox" className="mt-1 h-4 w-4 accent-[rgb(var(--info))]" checked={s.reduceMotion} onChange={(e) => set({ reduceMotion: e.target.checked })} />
            <span><span className="font-medium">Reduce motion</span><span className="block text-muted">Turns off transitions and animations. CloudQuest has no sound effects.</span></span>
          </label>
        </Section>

        <Section title="Your data" description="Progress lives in this browser's LocalStorage. Clearing site data or switching browsers or devices means starting over, unless you restore from an exported backup.">
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-secondary" onClick={download}><Download className="h-4 w-4" /> Export progress</button>
            <button type="button" className="btn-secondary" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" /> Import progress</button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" aria-label="Choose a CloudQuest backup file" onChange={(e) => void onFile(e.target.files?.[0])} />
          </div>
          <p role="status" className="text-sm text-muted">{notice}</p>
          {imp && !imp.ok && <p role="alert" className="rounded-lg border border-bad bg-bad/10 p-3 text-sm">Import failed: {imp.error} Your current progress was not changed.</p>}
        </Section>

        <Section title="Reset" description="Permanently deletes all XP, progress, history and settings from this browser.">
          <button type="button" className="btn-danger" onClick={() => setConfirmReset(true)}><RotateCcw className="h-4 w-4" /> Reset all progress</button>
        </Section>
      </div>

      <ConfirmDialog
        open={imp?.ok === true}
        title="Replace your progress?"
        confirmLabel="Replace with backup"
        danger
        onCancel={() => setImp(null)}
        onConfirm={() => { if (imp?.ok) { replaceState(imp.state); setNotice('Progress imported.'); } setImp(null); }}
      >
        <p>The backup contains {imp?.ok ? imp.summary : ''} This will replace everything currently saved in this browser.</p>
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmReset}
        title="Reset all progress?"
        confirmLabel="Delete everything"
        danger
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => { resetAll(); setConfirmReset(false); setNotice('All progress was reset.'); }}
      >
        <p>This deletes your XP, streak, achievements, quiz history and settings. It cannot be undone. Consider exporting a backup first.</p>
      </ConfirmDialog>
    </>
  );
}
