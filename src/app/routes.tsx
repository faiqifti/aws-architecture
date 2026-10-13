import { createBrowserRouter } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { AchievementsPage } from '@/features/achievements/AchievementsPage';
import { ChallengePage } from '@/features/challenges/ChallengePage';
import { ChallengesPage } from '@/features/challenges/ChallengesPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { ExamPage } from '@/features/exam-simulator/ExamPage';
import { LearningPathPage } from '@/features/learning-path/LearningPathPage';
import { ModulePage } from '@/features/learning-path/ModulePage';
import { PracticePage } from '@/features/practice/PracticePage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { SkillTreePage } from '@/features/skill-tree/SkillTreePage';
import { NotFound } from './NotFound';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'learn', element: <LearningPathPage /> },
      { path: 'learn/:moduleId', element: <ModulePage /> },
      { path: 'practice', element: <PracticePage /> },
      { path: 'challenges', element: <ChallengesPage /> },
      { path: 'challenges/:challengeId', element: <ChallengePage /> },
      { path: 'exam', element: <ExamPage /> },
      { path: 'skills', element: <SkillTreePage /> },
      { path: 'achievements', element: <AchievementsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
