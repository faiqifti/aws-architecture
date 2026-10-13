/** Central, configurable gamification rules. These are study-app rewards, not official AWS values. */
export const XP = {
  correctFirstTime: 10,
  correctRepeat: 2,
  /** Cap on XP from repeated correct answers per calendar day. */
  repeatDailyCap: 20,
  module: 50,
  mission: 30,
  challenge: 100,
  examFirst: 100,
  /** Awarded for a later exam only when it beats the previous best score. */
  examImprovement: 25,
};

export const RULES = {
  /** Fraction of the knowledge check required to complete a module. */
  modulePassRatio: 0.7,
  challengePassScore: 70,
  /** Minimum exam length to count toward readiness/achievements. */
  minExamQuestions: 20,
  /** Mock exam percent that counts as "Exam Ready". */
  examReadyThreshold: 72,
  securityMinQuestions: 10,
  securityAccuracy: 80,
};

/** Skill proficiency rules. */
export const SKILL_RULES = {
  practicedMinAttempts: 5,
  practicedAccuracy: 60,
  proficientMinAttempts: 8,
  proficientMinDistinct: 3,
  proficientAccuracy: 80,
  /** Accuracy is measured over this many most recent attempts. */
  window: 12,
};

export const DEFAULT_SETTINGS = {
  dailyTarget: 10,
  studyMinutes: 20,
  theme: 'system' as const,
  reduceMotion: false,
};
