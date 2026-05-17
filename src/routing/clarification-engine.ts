// ClarificationEngine — per arc42 §5.2.1 + FR-A09
// Rounds control, convergence detection, fallback, event emission.

import { EventEmitter } from 'node:events';
import type {
  ClarificationInput,
  ClarificationGap,
  ClarificationQuestion,
  ClarificationRequest,
  ClarificationAnswer,
  ClarificationResult,
  ClarificationFallback,
  ClarificationTrace,
  ClarificationTraceEntry,
  ClarificationStage,
  MergeTarget,
} from './clarification-types.js';
import type { ClarificationProvider } from './clarification-provider.js';

const MERGE_TARGET_MAP: Record<ClarificationStage, MergeTarget> = {
  routing: 'IntentPacket',
  execution: 'ArtifactSpec',
  quality: 'QualityReport',
};

export interface ClarificationEngineOptions {
  maxRounds?: number; // default 2 per AC6
}

export class ClarificationEngine extends EventEmitter {
  private readonly maxRounds: number;
  private providers = new Map<string, ClarificationProvider>();
  private traces = new Map<string, ClarificationTrace>();

  constructor(opts?: ClarificationEngineOptions) {
    super();
    this.maxRounds = Math.max(1, Math.min(10, opts?.maxRounds ?? 2));
  }

  registerProvider(provider: ClarificationProvider): void {
    const key = provider.skillType
      ? `${provider.stage}:${provider.skillType}`
      : provider.stage;
    this.providers.set(key, provider);
  }

  /** Detect gaps using the registered provider for this stage/skill */
  detectGaps(
    stage: ClarificationStage,
    context: Record<string, unknown>,
    skillType?: string,
  ): ClarificationInput | null {
    const provider = this.resolveProvider(stage, skillType);
    if (!provider) return null;

    const template = provider.getGapTemplate();
    const gaps = template.filter(g => {
      const key = g.decisionFactorType;
      return context[key] === undefined || context[key] === null || context[key] === '';
    });

    if (gaps.length === 0) return null;

    return { stage, round: 1, gaps, context };
  }

  /** Build a ClarificationRequest from detected gaps */
  buildRequest(input: ClarificationInput): ClarificationRequest {
    this.emit('clarification.started', { stage: input.stage, round: input.round });

    const questions: ClarificationQuestion[] = input.gaps.map((gap, i) => ({
      id: `${input.stage}-${input.round}-${i}`,
      text: `请提供${gap.description}`,
      decisionFactorType: gap.decisionFactorType,
      gapLevel: gap.gapLevel,
      defaultValue: gap.defaultValue,
    }));

    return {
      stage: input.stage,
      round: input.round,
      questions,
      skipCondition: '发送"直接生成"跳过剩余问题',
    };
  }

  /** Process user answers, determine convergence, return result or next round input */
  processAnswers(
    taskId: string,
    request: ClarificationRequest,
    answers: ClarificationAnswer[],
    currentGaps: ClarificationGap[],
  ): { result: ClarificationResult } | { nextRound: ClarificationInput } {
    this.emit('clarification.answered', { stage: request.stage, round: request.round, answers });

    const answerMap = new Map(answers.map(a => [a.questionId, a]));
    const mergedAnswers: Record<string, string> = {};
    const fallbacks: ClarificationFallback[] = [];
    const remainingGaps: ClarificationGap[] = [];

    for (const q of request.questions) {
      const answer = answerMap.get(q.id);
      if (answer && !answer.adoptDefault && answer.value) {
        mergedAnswers[q.id] = answer.value;
      } else if (answer?.adoptDefault && q.defaultValue) {
        mergedAnswers[q.id] = q.defaultValue;
      } else if (q.gapLevel === 'MUST') {
        remainingGaps.push(currentGaps.find(
          g => g.decisionFactorType === q.decisionFactorType,
        )!);
      }
      // SHOULD gaps without answers are silently skipped
    }

    const converged = remainingGaps.length === 0;
    const nextRound = request.round + 1;

    if (converged || nextRound > this.maxRounds) {
      // Apply fallbacks for any remaining MUST gaps at round limit
      if (!converged) {
        for (const gap of remainingGaps) {
          const qId = request.questions.find(
            q => q.decisionFactorType === gap.decisionFactorType,
          )?.id ?? gap.decisionFactorType;
          const defaultVal = gap.defaultValue ?? '系统默认';
          mergedAnswers[qId] = defaultVal;
          fallbacks.push({
            questionId: qId,
            defaultValueUsed: defaultVal,
            reason: 'round_limit_reached',
          });
        }
      }

      const result: ClarificationResult = {
        stage: request.stage,
        totalRounds: request.round,
        converged: remainingGaps.length === 0 || fallbacks.length > 0,
        mergedAnswers,
        fallbackApplied: fallbacks,
        mergeTarget: MERGE_TARGET_MAP[request.stage],
      };

      if (fallbacks.length > 0) {
        this.emit('clarification.fallback', { stage: request.stage, fallbacks });
      }
      this.emit('clarification.converged', result);

      this.recordTrace(taskId, request, answers, result);
      return { result };
    }

    // Not converged and rounds remain — next round
    this.emit('clarification.round', { stage: request.stage, round: nextRound });
    return {
      nextRound: {
        stage: request.stage,
        round: nextRound,
        gaps: remainingGaps,
        context: {},
      },
    };
  }

  /** Get trace for a task */
  getTrace(taskId: string): ClarificationTrace | undefined {
    return this.traces.get(taskId);
  }

  private resolveProvider(stage: ClarificationStage, skillType?: string): ClarificationProvider | undefined {
    if (skillType) {
      const specific = this.providers.get(`${stage}:${skillType}`);
      if (specific) return specific;
    }
    return this.providers.get(stage);
  }

  private recordTrace(
    taskId: string,
    request: ClarificationRequest,
    answers: ClarificationAnswer[],
    result: ClarificationResult,
  ): void {
    let trace = this.traces.get(taskId);
    if (!trace) {
      trace = { taskId, entries: [] };
      this.traces.set(taskId, trace);
    }
    trace.entries.push({
      stage: request.stage,
      round: request.round,
      request,
      answers,
      result,
      timestamp: new Date().toISOString(),
    });
  }
}
