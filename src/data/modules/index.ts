import type { DomainId, LearningModule } from '@/types';
import { costModules } from './cost';
import { performanceModules } from './performance';
import { resilientModules } from './resilient';
import { secureModules } from './secure';

export const MODULES: LearningModule[] = [...secureModules, ...resilientModules, ...performanceModules, ...costModules];

export const getModule = (id: string): LearningModule | undefined => MODULES.find((m) => m.id === id);
export const modulesForDomain = (d: DomainId): LearningModule[] => MODULES.filter((m) => m.domain === d);
