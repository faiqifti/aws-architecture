import { AlertTriangle, ArrowLeft, CheckCircle2, MinusCircle, RotateCcw, Send, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArchitectureDiagram } from '@/components/ui/ArchitectureDiagram';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { CATALOG, TIERS } from '@/data/challenges/catalog';
import { getChallenge } from '@/data/challenges';
import { domainById } from '@/data/domains';
import { useProgress } from '@/hooks/useProgress';
import { RULES, XP } from '@/lib/progression/config';
import { completeChallenge } from '@/lib/progression/engine';
import { evaluateChallenge, type ChallengeEvaluation } from '@/lib/scoring/challenge';

export function ChallengePage() {
  const { challengeId = '' } = useParams();
  const challenge = getChallenge(challengeId);
  const { state, commit } = useProgress();
  const [components, setComponents] = useState<string[]>([]);
  const [decisions, setDecisions] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ evaluation: ChallengeEvaluation; passed: boolean; firstPass: boolean } | null>(null);

  const preview = useMemo(() => {
    if (!challenge) return null;
    const tiers = TIERS.map((t) => ({
      label: t.label,
      items: components.filter((id) => CATALOG[id]?.tier === t.id).map((id) => CATALOG[id]!.name),
    })).filter((t) => t.items.length > 0);
    return tiers.length ? { caption: 'Your design, grouped by layer.', tiers } : null;
  }, [challenge, components]);

  if (!challenge) {
    return <EmptyState icon={AlertTriangle} title="Challenge not found" action={<Link to="/challenges" className="btn-primary">All challenges</Link>}>That challenge does not exist.</EmptyState>;
  }

  const locked = result !== null;
  const ready = components.length > 0 && challenge.decisions.every((d) => decisions[d.id]);
  const rec = state.challenges[challenge.id];

  const toggle = (id: string) => setComponents((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  const submit = () => {
    const evaluation = evaluateChallenge(challenge, { components, decisions });
    const wasDone = Boolean(rec?.completedAt);
    const out = completeChallenge(state, challenge.id, evaluation.total);
    commit(out);
    setResult({ evaluation, passed: out.result.passed, firstPass: out.result.passed && !wasDone });
  };

  const reset = () => { setResult(null); setComponents([]); setDecisions({}); };

  return (
    <div className="mx-auto max-w-4xl">
      <Link to="/challenges" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> Challenges</Link>
      <header className="mb-6">
        <div className="mb-2 flex flex-wrap gap-2"><Badge tone="info">{domainById(challenge.domain).short}</Badge><Badge>{challenge.difficulty}</Badge></div>
        <h1 className="text-2xl font-bold sm:text-3xl">{challenge.title}</h1>
        <p className="mt-3 leading-relaxed">{challenge.scenario}</p>
      </header>

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <section className="card p-4"><h2 className="label-eyebrow mb-2">Business requirements</h2><ul className="list-disc space-y-1 pl-5 text-sm">{challenge.requirements.map((r) => <li key={r}>{r}</li>)}</ul></section>
        <section className="card p-4"><h2 className="label-eyebrow mb-2">Constraints</h2><ul className="list-disc space-y-1 pl-5 text-sm">{challenge.constraints.map((r) => <li key={r}>{r}</li>)}</ul></section>
      </div>

      <section className="mb-6" aria-labelledby="components">
        <h2 id="components" className="mb-1 text-lg font-bold">1. Choose AWS components</h2>
        <p className="mb-3 text-sm text-muted">Select what belongs in your design. More is not better: unnecessary components add cost and operational burden.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {challenge.components.map((comp) => {
            const item = CATALOG[comp.id]!;
            const on = components.includes(comp.id);
            return (
              <label key={comp.id} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${on ? 'border-info bg-info/10' : 'border-line bg-surface hover:bg-surface2'} ${locked ? 'pointer-events-none opacity-80' : ''}`}>
                <input type="checkbox" checked={on} disabled={locked} onChange={() => toggle(comp.id)} className="mt-1 h-4 w-4 accent-[rgb(var(--info))]" />
                <span><span className="block text-sm font-semibold">{item.name}</span><span className="text-xs text-muted">{item.blurb}</span></span>
              </label>
            );
          })}
        </div>
      </section>

      <section className="mb-6" aria-labelledby="decisions">
        <h2 id="decisions" className="mb-3 text-lg font-bold">2. Make architecture decisions</h2>
        <div className="space-y-4">
          {challenge.decisions.map((d) => (
            <fieldset key={d.id} className="card p-4" disabled={locked}>
              <legend className="px-1 font-semibold">{d.prompt}</legend>
              <div className="mt-2 space-y-2">
                {d.options.map((opt) => (
                  <label key={opt.id} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm ${decisions[d.id] === opt.id ? 'border-info bg-info/10' : 'border-line hover:bg-surface2'}`}>
                    <input type="radio" name={d.id} checked={decisions[d.id] === opt.id} onChange={() => setDecisions((x) => ({ ...x, [d.id]: opt.id }))} className="mt-0.5 accent-[rgb(var(--info))]" />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      </section>

      <section className="mb-6" aria-labelledby="preview">
        <h2 id="preview" className="mb-3 text-lg font-bold">Your architecture</h2>
        {preview ? <ArchitectureDiagram diagram={preview} /> : <EmptyState icon={AlertTriangle} title="Nothing selected yet">Pick components above to see them arranged by layer.</EmptyState>}
      </section>

      {!locked ? (
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="btn-primary" disabled={!ready} onClick={submit}><Send className="h-4 w-4" /> Submit and evaluate</button>
          {!ready && <span className="text-sm text-muted">Select at least one component and answer every decision.</span>}
        </div>
      ) : (
        <Debrief challengeId={challenge.id} selection={{ components, decisions }} result={result} onRetry={reset} />
      )}
      {rec && !locked && <p className="mt-4 text-sm text-muted">Your best score so far: {rec.bestScore}/100 ({rec.attempts} attempt{rec.attempts === 1 ? '' : 's'}).</p>}
    </div>
  );
}

function Debrief({
  challengeId, selection, result, onRetry,
}: {
  challengeId: string;
  selection: { components: string[]; decisions: Record<string, string> };
  result: { evaluation: ChallengeEvaluation; passed: boolean; firstPass: boolean };
  onRetry: () => void;
}) {
  const challenge = getChallenge(challengeId)!;
  const { evaluation: ev } = result;
  const net = (effects: Record<string, number | undefined>) => Object.values(effects).reduce<number>((s, v) => s + (v ?? 0), 0);
  const chosen = challenge.components.filter((c) => selection.components.includes(c.id));
  const missed = challenge.components.filter((c) => !selection.components.includes(c.id) && challenge.reference.components.includes(c.id));

  return (
    <section className="space-y-6" aria-labelledby="debrief">
      <div className={`card p-6 ${result.passed ? 'border-ok' : 'border-bad'}`} role="status">
        <h2 id="debrief" className="text-lg font-bold">Evaluation</h2>
        <p className="mt-1 text-4xl font-bold tabular-nums">{ev.total}<span className="text-lg text-muted">/100</span></p>
        <p className="mt-1 text-sm">
          {result.passed ? `Passed (${RULES.challengePassScore}+ needed). ` : `Below the ${RULES.challengePassScore} pass mark. `}
          {result.firstPass ? `+${XP.challenge} XP earned for completing this challenge.` : result.passed ? 'XP for this challenge was already awarded; replays do not earn it again.' : 'Review the feedback and try again.'}
        </p>
      </div>

      <div className="card p-5">
        <h3 className="mb-3 font-semibold">Scoring rubric</h3>
        <ul className="space-y-3">
          {ev.criteria.filter((c) => c.weight > 0).map((c) => (
            <li key={c.id}>
              <div className="mb-1 flex justify-between text-sm"><span>{c.label}</span><span className="tabular-nums text-muted">{c.earned}/{c.weight}</span></div>
              <ProgressBar value={(c.earned / c.weight) * 100} tone={c.earned / c.weight >= 0.8 ? 'ok' : c.earned / c.weight >= 0.5 ? 'brand' : 'bad'} label={c.label} />
            </li>
          ))}
        </ul>
      </div>

      <div className="card p-5">
        <h3 className="mb-3 font-semibold">Your components</h3>
        <ul className="space-y-2 text-sm">
          {chosen.map((c) => <Line key={c.id} name={CATALOG[c.id]?.name ?? c.id} note={c.note} tone={ev.harmful.includes(c.id) ? 'bad' : net(c.effects) > 0 ? 'ok' : 'neutral'} />)}
        </ul>
        {missed.length > 0 && (
          <>
            <h3 className="mb-3 mt-5 font-semibold">Worth considering</h3>
            <ul className="space-y-2 text-sm">{missed.map((c) => <Line key={c.id} name={CATALOG[c.id]?.name ?? c.id} note={c.note} tone="neutral" />)}</ul>
          </>
        )}
      </div>

      <div className="card p-5">
        <h3 className="mb-3 font-semibold">Your decisions</h3>
        <ul className="space-y-3 text-sm">
          {challenge.decisions.map((d) => {
            const opt = d.options.find((o) => o.id === selection.decisions[d.id]);
            if (!opt) return null;
            return (
              <li key={d.id}>
                <p className="font-medium">{d.prompt}</p>
                <Line name={opt.label} note={opt.feedback} tone={net(opt.effects) > 0 ? 'ok' : net(opt.effects) < 0 ? 'bad' : 'neutral'} />
              </li>
            );
          })}
        </ul>
      </div>

      <div className="card p-5">
        <h3 className="mb-2 font-semibold">Reference design</h3>
        <p className="text-sm leading-relaxed">{challenge.idealSolution}</p>
        <p className="mt-2 text-xs text-muted">One defensible answer for these requirements. Different requirements would lead to a different design.</p>
      </div>
      <button type="button" className="btn-secondary" onClick={onRetry}><RotateCcw className="h-4 w-4" /> Try again</button>
    </section>
  );
}

function Line({ name, note, tone }: { name: string; note: string; tone: 'ok' | 'bad' | 'neutral' }) {
  const Icon = tone === 'bad' ? XCircle : tone === 'ok' ? CheckCircle2 : MinusCircle;
  return (
    <div className="flex items-start gap-2">
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${tone === 'bad' ? 'text-bad' : tone === 'ok' ? 'text-ok' : 'text-muted'}`} aria-hidden />
      <span><strong>{name}:</strong> <span className="text-muted">{note}</span></span>
    </div>
  );
}
