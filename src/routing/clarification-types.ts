// Clarification types — per arc42 §5.2.1 ClarificationEngine interface contract

export type ClarificationStage = 'routing' | 'execution' | 'quality';

export type GapLevel = 'MUST' | 'SHOULD';

export type DecisionFactorType =
  | 'audience'
  | 'style'
  | 'brand_tone'
  | 'content_scope'
  | 'delivery_format'
  | 'color_preference'
  | 'info_density'
  | 'use_case'
  | 'layout'
  | 'visual_focus'
  | 'info_hierarchy';

export type DefaultPolicy = 'auto_adopt_on_timeout' | 'require_explicit_confirm' | 'skip';

export type FallbackReason = 'round_limit_reached' | 'user_skip' | 'timeout';

export type MergeTarget = 'IntentPacket' | 'ArtifactSpec' | 'QualityReport';

export interface ClarificationGap {
  gapLevel: GapLevel;
  decisionFactorType: DecisionFactorType;
  description: string;
  defaultValue: string | null;
  defaultPolicy: DefaultPolicy;
}

export interface ClarificationInput {
  stage: ClarificationStage;
  round: number;
  gaps: ClarificationGap[];
  // Engine keeps context generic so each stage can pass its own structured payload
  // without coupling routing logic to a specific upstream schema.
  context: Record<string, unknown>;
}

export interface ClarificationQuestion {
  id: string;
  text: string;
  decisionFactorType: DecisionFactorType;
  gapLevel: GapLevel;
  defaultValue: string | null;
  options?: string[];
}

export interface ClarificationRequest {
  stage: ClarificationStage;
  round: number;
  questions: ClarificationQuestion[];
  skipCondition: string;
}

export interface ClarificationAnswer {
  questionId: string;
  value: string;
  adoptDefault: boolean;
}

export interface ClarificationFallback {
  questionId: string;
  defaultValueUsed: string;
  reason: FallbackReason;
}

export interface ClarificationResult {
  stage: ClarificationStage;
  totalRounds: number;
  converged: boolean;
  mergedAnswers: Record<string, string>;
  fallbackApplied: ClarificationFallback[];
  mergeTarget: MergeTarget;
}

export interface ClarificationTraceEntry {
  stage: ClarificationStage;
  round: number;
  request: ClarificationRequest;
  answers: ClarificationAnswer[];
  result: ClarificationResult;
  timestamp: string;
}

export interface ClarificationTrace {
  taskId: string;
  entries: ClarificationTraceEntry[];
}
