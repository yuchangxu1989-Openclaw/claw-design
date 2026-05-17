// ClarifyNeededError — thrown when intent confidence is too low to proceed
// Per arc42 §6.1: confidence < 0.3 with required gaps → must clarify

import type { GapItem } from '../types.js';

export class ClarifyNeededError extends Error {
  constructor(
    public readonly taskId: string,
    public readonly confidence: number,
    public readonly gaps: GapItem[],
  ) {
    super(
      `Cannot determine intent for task ${taskId} (confidence=${confidence.toFixed(2)}). ` +
      `Unresolved gaps: ${gaps.map(g => g.name).join(', ')}`,
    );
    this.name = 'ClarifyNeededError';
  }
}
