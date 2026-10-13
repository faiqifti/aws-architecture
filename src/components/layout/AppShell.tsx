import {
  Award, BookOpen, ChevronsLeft, ChevronsRight, FlaskConical, GraduationCap, LayoutDashboard, Menu, Network, Settings, Timer, Workflow, X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Toasts } from '@/components/ui/Toasts';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useProgress } from '@/hooks/useProgress';
import { levelInfo } from '@/lib/progression/levels';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/learn', label: 'Learning Path', icon: BookOpen },
  { to: '/practice', label: 'Practice Lab', icon: FlaskConical },
  { to: '/challenges', label: 'Architecture Challenges', icon: Workflow },
  { to: '/exam', label: 'Exam Simulator', icon: Timer },
  { to: '/skills', label: 'Skill Tree', icon: Network },
  { to: '/achievements', label: 'Achievements', icon: Award },
  { to: '/settings', label: 'Settings', icon: Settings },
];

function NavItems({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  return (
    <ul className="space-y-1">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <li key={to}>
          <NavLink
            to={to}
            end={end}
            onClick={onNavigate}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'bg-brand/15 text-ink' : 'text-muted hover:bg-surface2 hover:text-ink'
              } ${collapsed ? 'justify-center' : ''}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-brand-ink' : ''}`} aria-hidden />
                <span className={collapsed ? 'sr-only' : ''}>{label}</span>
              </>
            )}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

function LevelCard({ compact }: { compact: boolean }) {
  const { state } = useProgress();
  const info = levelInfo(state.xp);
  if (compact) return <div className="px-2 text-center text-xs font-bold tabular-nums" title={`Level ${info.level}`}>L{info.level}</div>;
  return (
    <div className="rounded-lg border border-line bg-surface2/60 p-3">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-semibold">Level {info.level}</span>
        <span className="tabular-nums text-muted">{info.xp} XP</span>
      </div>
      <p className="text-xs text-muted">{info.title}</p>
      <ProgressBar value={info.progress * 100} className="mt-2" label="Progress to next level" />
      <p className="mt-1 text-xs text-muted">{info.xpNeeded - info.xpIntoLevel} XP to level {info.level + 1}</p>
    </div>
  );
}

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${collapsed ? 'justify-center' : ''}`}>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand text-on-brand"><GraduationCap className="h-5 w-5" aria-hidden /></span>
      {!collapsed && (
        <div className="leading-tight">
          <div className="font-bold">CloudQuest</div>
          <div className="text-xs text-muted">SAA-C03 study companion</div>
        </div>
      )}
    </div>
  );
}

export function AppShell() {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('cloudquest:sidebar') === '1'; } catch { return false; }
  });
  const [drawer, setDrawer] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    try { localStorage.setItem('cloudquest:sidebar', collapsed ? '1' : '0'); } catch { /* ignore */ }
  }, [collapsed]);

  useEffect(() => {
    setDrawer(false);
    window.scrollTo({ top: 0 });
  }, [pathname]);

  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawer(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawer]);

  return (
    <div className="min-h-screen md:flex">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-surface focus:px-3 focus:py-2">Skip to content</a>

      {/* Desktop / tablet sidebar */}
      <aside className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-line bg-surface p-3 transition-[width] duration-200 md:flex ${collapsed ? 'w-[68px]' : 'w-64'}`}>
        <div className="px-1 py-2"><Brand collapsed={collapsed} /></div>
        <nav aria-label="Main" className="mt-4 flex-1 overflow-y-auto"><NavItems collapsed={collapsed} /></nav>
        <div className="space-y-3">
          <LevelCard compact={collapsed} />
          <button type="button" onClick={() => setCollapsed((c) => !c)} aria-pressed={collapsed} className="btn-ghost w-full" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <><ChevronsLeft className="h-4 w-4" /> Collapse</>}
          </button>
        </div>
      </aside>

      {/* Mobile top bar + drawer */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface px-4 py-2 md:hidden">
        <Brand collapsed={false} />
        <button type="button" className="btn-ghost !px-2" aria-label="Open navigation" aria-expanded={drawer} onClick={() => setDrawer(true)}>
          <Menu className="h-6 w-6" />
        </button>
      </div>
      {drawer && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawer(false)} aria-hidden />
          <div role="dialog" aria-modal="true" aria-label="Navigation" className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-surface p-3 shadow-xl">
            <div className="flex items-center justify-between px-1 py-2">
              <Brand collapsed={false} />
              <button type="button" className="btn-ghost !px-2" aria-label="Close navigation" onClick={() => setDrawer(false)} autoFocus><X className="h-5 w-5" /></button>
            </div>
            <nav aria-label="Main" className="mt-3 flex-1 overflow-y-auto"><NavItems collapsed={false} onNavigate={() => setDrawer(false)} /></nav>
            <LevelCard compact={false} />
          </div>
        </div>
      )}

      <main id="main" tabIndex={-1} className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <Outlet />
          <footer className="mt-12 border-t border-line pt-4 text-xs text-muted">
            CloudQuest is independent study material, not official AWS training. Questions are original practice items, not actual exam questions. AWS and related service names are trademarks of Amazon.
          </footer>
        </div>
      </main>
      <Toasts />
    </div>
  );
}
