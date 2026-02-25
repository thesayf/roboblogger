import { ToolContext } from '../types';
import { buildResearchTools } from './research-tools';
import { buildReadTools } from './read-tools';
import { buildActionTools } from './action-tools';

export function buildTools(ctx: ToolContext) {
  return [
    ...buildResearchTools(ctx),
    ...buildReadTools(ctx),
    ...buildActionTools(ctx),
  ];
}
