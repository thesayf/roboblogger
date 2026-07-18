import { ToolContext } from '../types';
import { buildResearchTools } from './research-tools';
import { buildReadTools } from './read-tools';
import { buildActionTools } from './action-tools';
import { buildRoutineTools } from './routine-tools';
import { buildDocumentTools } from './document-tools';
import { buildStrategyTools } from './strategy-tools';
import { buildPlanningTools } from './planning-tools';
import { buildDeepResearchTools } from './deep-research-tools';

export function buildTools(ctx: ToolContext) {
  return [
    ...buildPlanningTools(ctx),
    ...buildDeepResearchTools(ctx),
    ...buildResearchTools(ctx),
    ...buildReadTools(ctx),
    ...buildActionTools(ctx),
    ...buildStrategyTools(ctx),
    ...buildRoutineTools(ctx),
    ...buildDocumentTools(ctx),
  ];
}
