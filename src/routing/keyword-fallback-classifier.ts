/**
 * KeywordFallbackClassifier — FALLBACK ONLY.
 *
 * This is NOT "intent understanding". It is a degraded keyword-matching fallback
 * used only when:
 *   1. The host did not inject an LLM provider
 *   2. The LLM call failed (timeout, error)
 *
 * All results carry `degraded: true`.
 */

import type { ArtifactType, DesignSkill } from '../types.js';
import type { IntentClassifierProvider, SkillDescription, ClassificationResult } from './intent-classifier.js';
import { CompositeRouter, ExactMatchStrategy, FuzzyMatchStrategy } from './composite-router.js';

export class KeywordFallbackClassifier implements IntentClassifierProvider {
  private compositeRouter: CompositeRouter;
  private registeredCount = 0;

  constructor() {
    this.compositeRouter = new CompositeRouter([
      new ExactMatchStrategy(),
      new FuzzyMatchStrategy(),
    ]);
  }

  /**
   * Register skills into the internal CompositeRouter.
   * Accumulative: re-registers when the skill list has changed (new skills added).
   * Safe to call multiple times — skips if the count hasn't changed.
   */
  registerSkills(skills: DesignSkill[]): void {
    if (skills.length !== this.registeredCount) {
      this.compositeRouter.registerAll(skills);
      this.registeredCount = skills.length;
    }
  }

  async classify(input: string, _skillDescriptions: SkillDescription[]): Promise<ClassificationResult> {
    const packet = this.compositeRouter.route({
      taskId: 'fallback',
      rawInput: input,
    });

    return {
      primaryType: packet.primaryType as ArtifactType,
      secondaryTypes: [],
      confidence: packet.confidence,
      reasoning: 'Fallback: keyword matching (no LLM provider available)',
      degraded: true,
    };
  }
}
