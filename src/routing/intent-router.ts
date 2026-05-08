/**
 * IntentRouter — LLM-based intent routing (primary path).
 *
 * Main path: LLM semantic reasoning via injected IntentClassifierProvider.
 * Fallback: KeywordFallbackClassifier (degraded mode, explicit `degraded: true`).
 *
 * "Intent routing" and "intent understanding" mean LLM semantic generalization.
 * Keyword matching is NOT intent understanding — it is only a degraded fallback.
 */

import type { DesignRequest, IntentPacket, DesignSkill, ArtifactType } from '../types.js';
import type { IntentClassifierProvider, SkillDescription } from './intent-classifier.js';
import { KeywordFallbackClassifier } from './keyword-fallback-classifier.js';

export interface IntentRouterOptions {
  /** LLM classifier injected by host. If omitted, falls back to keyword matching (degraded). */
  classifierProvider?: IntentClassifierProvider;
  /** Pre-registered skills for routing */
  skills?: DesignSkill[];
  /** Timeout in ms for LLM classify calls. Defaults to 30 000 ms. */
  classifyTimeoutMs?: number;
}

export class IntentRouter {
  private skills: DesignSkill[] = [];
  private readonly classifier: IntentClassifierProvider;
  private readonly usedFallbackClassifier: boolean;
  private readonly fallback: KeywordFallbackClassifier;
  private readonly classifyTimeoutMs: number;

  constructor(options: IntentRouterOptions = {}) {
    this.fallback = new KeywordFallbackClassifier();
    this.classifyTimeoutMs = options.classifyTimeoutMs ?? 30_000;

    if (options.classifierProvider && !(options.classifierProvider instanceof KeywordFallbackClassifier)) {
      this.classifier = options.classifierProvider;
      this.usedFallbackClassifier = false;
    } else {
      // No LLM provider — use keyword fallback (degraded mode)
      this.classifier = this.fallback;
      this.usedFallbackClassifier = true;
    }

    if (options.skills) {
      this.registerAll(options.skills);
    }
  }

  register(skill: DesignSkill): void {
    this.skills.push(skill);
    // Keep fallback in sync for error recovery
    this.fallback.registerSkills(this.skills);
  }

  registerAll(skills: DesignSkill[]): void {
    for (const s of skills) {
      this.skills.push(s);
    }
    this.fallback.registerSkills(this.skills);
  }

  /**
   * Route a design request to the best matching skill.
   *
   * Primary path: LLM semantic classification.
   * Fallback: keyword matching if LLM unavailable or fails.
   */
  async route(request: DesignRequest): Promise<IntentPacket> {
    const descriptions = this.buildSkillDescriptions();

    let result;
    let usedFallback = this.usedFallbackClassifier;

    if (!this.usedFallbackClassifier) {
      try {
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('classify timeout')), this.classifyTimeoutMs),
        );
        result = await Promise.race([
          this.classifier.classify(request.rawInput, descriptions),
          timeout,
        ]);
      } catch {
        // LLM call failed or timed out — degrade to keyword fallback
        usedFallback = true;
        this.fallback.registerSkills(this.skills);
        result = await this.fallback.classify(request.rawInput, descriptions);
      }
    } else {
      result = await this.classifier.classify(request.rawInput, descriptions);
    }

    // Find the matched skill by artifact type
    const matchedSkill = this.findSkillByType(result.primaryType);

    const confidence = result.confidence;
    const degraded = result.degraded ?? usedFallback;

    return {
      taskId: request.taskId,
      primaryType: result.primaryType,
      secondaryTypes: result.secondaryTypes,
      confidence,
      gaps: confidence < 0.3
        ? [{ name: 'intent', reason: 'Cannot determine artifact type', priority: 'required' as const }]
        : [],
      context: request.metadata ?? {},
      matchedSkill: matchedSkill?.contract.name ?? null,
      degraded,
      reasoning: result.reasoning,
    };
  }

  getSkillByName(name: string): DesignSkill | undefined {
    return this.skills.find(s => s.contract.name === name);
  }

  listSkills(): string[] {
    return this.skills.map(s => s.contract.name);
  }

  private buildSkillDescriptions(): SkillDescription[] {
    return this.skills
      .filter(s => s.contract.status !== 'retired')
      .map(s => ({
        name: s.contract.name,
        artifactType: s.contract.artifactType,
        description: s.contract.description,
        capabilities: s.contract.capabilities,
        applicableScenes: s.contract.applicableScenes,
        examplePrompts: s.contract.examplePrompts,
      }));
  }

  private findSkillByType(type: ArtifactType): DesignSkill | undefined {
    return this.skills.find(s => {
      if (s.contract.status === 'retired') return false;
      if (s.contract.artifactType === type) return true;
      return s.contract.supportedTypes?.includes(type) ?? false;
    });
  }
}
