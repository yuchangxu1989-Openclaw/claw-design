import type {
  Artifact,
  SemanticValidationConfig,
  SemanticValidationResult,
} from '../types.js';

export interface SemanticValidator {
  validate(input: string, artifact: Artifact): Promise<SemanticValidationResult>;
}

export class HeuristicSemanticValidator implements SemanticValidator {
  async validate(input: string, artifact: Artifact): Promise<SemanticValidationResult> {
    const requestTokens = tokenize(input);
    const artifactText = artifact.html.replace(/<[^>]+>/g, ' ').toLowerCase();
    const overlapCount = requestTokens.filter(token => artifactText.includes(token)).length;
    const score = requestTokens.length === 0 ? 1 : overlapCount / requestTokens.length;

    return {
      provider: 'heuristic-token-overlap',
      score,
      passed: score >= 0.35,
      rationale: requestTokens.length === 0
        ? 'Request is too short for semantic scoring.'
        : `Matched ${overlapCount}/${requestTokens.length} request token(s) in the rendered artifact.`,
    };
  }
}

export function shouldRunSemanticValidation(config?: SemanticValidationConfig): boolean {
  return Boolean(config?.enabled);
}

function tokenize(text: string): string[] {
  const lower = text.toLowerCase();
  const latin = lower.match(/[a-z]{3,}/g) ?? [];
  const cjk = lower.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) ?? [];
  const cjkTokens: string[] = [];

  for (let i = 0; i < cjk.length - 1; i++) {
    cjkTokens.push(cjk[i] + cjk[i + 1]);
  }

  return [...new Set([...latin, ...cjkTokens])];
}
