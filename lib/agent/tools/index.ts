import { ToolContext } from '../types';
import { buildResearchTools } from './research-tools';
import { buildReadTools } from './read-tools';
import { buildActionTools } from './action-tools';
import { buildRoutineTools } from './routine-tools';
import { buildDocumentTools } from './document-tools';

export function buildTools(ctx: ToolContext) {
  return [
    ...buildResearchTools(ctx),
    ...buildReadTools(ctx),
    ...buildActionTools(ctx),
    ...buildRoutineTools(ctx),
    ...buildDocumentTools(ctx),
  ];
}
