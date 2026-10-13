export type DomainId = 'secure' | 'resilient' | 'performance' | 'cost';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type ThemePref = 'light' | 'dark' | 'system';

// ---------- Educational content ----------

export interface QuestionOption {
  id: string;
  text: string;
  /** Why this option is right or wrong. */
  why: string;
}

export interface Question {
  id: string;
  domain: DomainId;
  /** Module / skill this question belongs to. */
  skill: string;
  difficulty: Difficulty;
  text: string;
  options: QuestionOption[];
  correct: string[];
  explanation: string;
  services: string[];
  takeaway: string;
}

export interface ModuleSection {
  heading: string;
  body: string[];
  bullets?: string[];
}

export interface DiagramTier {
  label: string;
  items: string[];
}

export interface Diagram {
  caption: string;
  tiers: DiagramTier[];
}

export interface LearningModule {
  id: string;
  domain: DomainId;
  title: string;
  summary: string;
  minutes: number;
  objectives: string[];
  sections: ModuleSection[];
  services: string[];
  traps: string[];
  diagram?: Diagram;
}

export type BranchId =
  | 'security'
  | 'networking'
  | 'compute'
  | 'storage'
  | 'databases'
  | 'integration'
  | 'reliability'
  | 'perfcost';

export interface Skill {
  /** Equals the id of its learning module. */
  id: string;
  branch: BranchId;
  name: string;
  prerequisites: string[];
}

export type Criterion = 'availability' | 'security' | 'scalability' | 'performance' | 'cost' | 'operations';

export interface ChallengeComponent {
  id: string;
  /** Per-criterion contribution of including this component in this scenario. */
  effects: Partial<Record<Criterion, number>>;
  /** Scenario-specific rationale shown in the debrief. */
  note: string;
}

export interface ChallengeDecisionOption {
  id: string;
  label: string;
  effects: Partial<Record<Criterion, number>>;
  feedback: string;
}

export interface ChallengeDecision {
  id: string;
  prompt: string;
  options: ChallengeDecisionOption[];
}

export interface Challenge {
  id: string;
  domain: DomainId;
  title: string;
  difficulty: Difficulty;
  scenario: string;
  requirements: string[];
  constraints: string[];
  components: ChallengeComponent[];
  decisions: ChallengeDecision[];
  /** Points (summing to 100) each criterion is worth for this scenario. */
  weights: Record<Criterion, number>;
  /** Raw effect sum needed to earn the full weight of each criterion. */
  targets: Record<Criterion, number>;
  skills: string[];
  /** A defensible reference design shown in the debrief (and used by tests). */
  reference: { components: string[]; decisions: Record<string, string> };
  idealSolution: string;
}

// ---------- Persisted state ----------

export interface Settings {
  dailyTarget: number;
  studyMinutes: number;
  theme: ThemePref;
  reduceMotion: boolean;
}

export type AttemptSource = 'practice' | 'module' | 'retry' | 'exam';

export interface Attempt {
  qid: string;
  domain: DomainId;
  skill: string;
  correct: boolean;
  at: string;
  source: AttemptSource;
}

export interface DomainTally {
  correct: number;
  total: number;
}
export type DomainBreakdown = Record<DomainId, DomainTally>;

export interface QuizResult {
  id: string;
  kind: 'practice' | 'retry' | 'module';
  label: string;
  at: string;
  total: number;
  correct: number;
  byDomain: DomainBreakdown;
}

export interface ExamResult {
  id: string;
  at: string;
  total: number;
  correct: number;
  percent: number;
  timeLimitMin: number;
  timeUsedSec: number;
  timedOut: boolean;
  byDomain: DomainBreakdown;
  missedIds: string[];
  revisionSkills: string[];
}

export interface ChallengeRecord {
  bestScore: number;
  attempts: number;
  completedAt: string | null;
  lastAt: string;
}

export interface ModuleRecord {
  completedAt: string;
  bestScore: number;
}

export interface StreakState {
  current: number;
  longest: number;
  lastDate: string | null;
}

export interface DailyState {
  date: string;
  questions: number;
  modules: number;
  challenges: number;
  /** XP earned today from repeated correct answers (capped). */
  repeatXp: number;
}

export interface AppState {
  version: number;
  settings: Settings;
  xp: number;
  /** Reward keys already paid out (duplicate-XP protection). */
  rewards: Record<string, string>;
  modules: Record<string, ModuleRecord>;
  moduleVisits: Record<string, string>;
  attempts: Attempt[];
  flagged: string[];
  quizHistory: QuizResult[];
  examResults: ExamResult[];
  challenges: Record<string, ChallengeRecord>;
  streak: StreakState;
  daily: DailyState;
  achievements: Record<string, string>;
}

export type GameEvent =
  | { type: 'xp'; amount: number; label: string }
  | { type: 'level'; level: number }
  | { type: 'achievement'; id: string }
  | { type: 'mission'; id: string };
