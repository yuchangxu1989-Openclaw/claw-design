/**
 * IntentRouter — LLM-based intent routing.
 *
 * Intent routing uses LLM semantic reasoning exclusively via injected IntentClassifierProvider.
 * No keyword fallback — if no LLM classifier is provided, routing returns unknown.
 *
 * AC-08: Intent routing must be based on LLM semantic classification.
 */

import type { DesignRequest, IntentPacket, DesignSkill, ArtifactType } from '../types.js';
import type { IntentClassifierProvider, SkillDescription } from './intent-classifier.js';

export interface IntentRouterOptions {
  /** LLM classifier injected by host. Required for intent routing. */
  classifierProvider?: IntentClassifierProvider;
  /** Pre-registered skills for routing */
  skills?: DesignSkill[];
  /** Timeout in ms for LLM classify calls. Defaults to 30 000 ms. */
  classifyTimeoutMs?: number;
}

export class IntentRouter {
  private skills: DesignSkill[] = [];
  private readonly classifier: IntentClassifierProvider | null;
  private readonly classifyTimeoutMs: number;

  constructor(options: IntentRouterOptions = {}) {
    this.classifyTimeoutMs = options.classifyTimeoutMs ?? 30_000;
    this.classifier = options.classifierProvider ?? null;

    if (options.skills) {
      this.registerAll(options.skills);
    }
  }

  register(skill: DesignSkill): void {
    this.skills.push(skill);
  }

  registerAll(skills: DesignSkill[]): void {
    for (const s of skills) {
      this.skills.push(s);
    }
  }

  /**
   * Route a design request to the best matching skill via LLM semantic classification.
   *
   * If no LLM classifier is injected, returns an unknown result with confidence 0.
   */
  async route(request: DesignRequest): Promise<IntentPacket> {
    if (!this.classifier) {
      // No LLM classifier available — return unknown (no keyword fallback)
      return {
        taskId: request.taskId,
        primaryType: 'slides',
        secondaryTypes: [],
        confidence: 0,
        gaps: [{ name: 'intent', reason: 'No LLM classifier provided — cannot determine intent', priority: 'required' as const }],
        context: request.metadata ?? {},
        matchedSkill: null,
        degraded: true,
        reasoning: 'No LLM classifier injected. Intent routing requires an LLM provider.',
      };
    }

    const descriptions = this.buildSkillDescriptions();

    let result;
    try {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('classify timeout')), this.classifyTimeoutMs),
      );
      result = await Promise.race([
        this.classifier.classify(request.rawInput, descriptions),
        timeout,
      ]);
    } catch (err) {
      // LLM call failed or timed out — return error, no keyword fallback
      return {
        taskId: request.taskId,
        primaryType: 'slides',
        secondaryTypes: [],
        confidence: 0,
        gaps: [{ name: 'intent', reason: `LLM classification failed: ${err instanceof Error ? err.message : 'unknown error'}`, priority: 'required' as const }],
        context: request.metadata ?? {},
        matchedSkill: null,
        degraded: true,
        reasoning: `LLM classification error: ${err instanceof Error ? err.message : 'unknown'}`,
      };
    }

    // Find the matched skill by artifact type
    const matchedSkill = this.findSkillByType(result.primaryType);

    const confidence = result.confidence;

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
      degraded: result.degraded ?? false,
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
