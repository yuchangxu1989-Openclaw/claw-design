/**
 * IntentClassifier — LLM-based intent classification interfaces.
 *
 * Intent routing is exclusively LLM semantic reasoning (AC-08).
 * No keyword fallback path exists.
 */

import type { ArtifactType } from '../types.js';

/** Skill description fed to the LLM for routing decisions */
export interface SkillDescription {
  name: string;
  artifactType: ArtifactType;
  description: string;
  capabilities?: string[];
  applicableScenes?: string[];
  examplePrompts?: string[];
}

/** LLM classification result */
export interface ClassificationResult {
  primaryType: ArtifactType;
  secondaryTypes: ArtifactType[];
  confidence: number;
  reasoning?: string;
  /** true when result comes from fallback (non-LLM) classifier */
  degraded?: boolean;
}

/**
 * IntentClassifierProvider — injected by the host environment.
 *
 * Claw Design as an npm package does not hardcode any LLM API.
 * The host (e.g. OpenClaw) injects an implementation that calls its own LLM.
 */
export interface IntentClassifierProvider {
  classify(input: string, skillDescriptions: SkillDescription[]): Promise<ClassificationResult>;
}
