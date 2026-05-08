import type { DesignRequest, DesignSkill, ArtifactType } from '../types.js';
import type { RouteCandidate, RoutingStrategy } from './composite-router.js';
import { ExactMatchStrategy, FuzzyMatchStrategy } from './composite-router.js';

export interface IntentSegment {
  text: string;
  primaryType: ArtifactType;
  matchedSkill: string;
  confidence: number;
  dependsOn?: number;
}

export interface MultiIntentResult {
  taskId: string;
  segments: IntentSegment[];
  dependencies: Array<[number, number]>;
  explanation: RouteExplanation;
}

export interface RouteExplanation {
  summary: string;
  reasons: string[];
  confidence: number;
  adoptedContext: string[];
  plannedQualityGates: string[];
}

const COMBO_PATTERNS: Array<{ pattern: RegExp; relation: 'sequential' | 'embed' }> = [
  { pattern: /先[做生成写](.+?)[，,].{0,4}再[做生成写配](.+)/u, relation: 'sequential' },
  { pattern: /(.+?)[，,]\s*(?:并|同时|配套|再配)[做生成写]?(.+)/u, relation: 'sequential' },
  { pattern: /(.+?)[，,]\s*(?:嵌入|放入|插入)(.+)/u, relation: 'embed' },
  { pattern: /(.+?)(?:和|与|以及|加上)(.+)/u, relation: 'sequential' },
];

export class MultiIntentRouter {
  private skills: DesignSkill[] = [];
  private strategies: RoutingStrategy[];

  constructor(strategies?: RoutingStrategy[]) {
    this.strategies = strategies ?? [new ExactMatchStrategy(), new FuzzyMatchStrategy()];
  }

  register(skill: DesignSkill): void {
    this.skills.push(skill);
  }

  registerAll(skills: DesignSkill[]): void {
    skills.forEach(s => this.register(s));
  }

  route(request: DesignRequest): MultiIntentResult {
    const segments = this.splitIntents(request);
    const dependencies = this.detectDependencies(segments);
    const explanation = this.buildExplanation(segments, dependencies, request);

    return {
      taskId: request.taskId,
      segments,
      dependencies,
      explanation,
    };
  }

  private splitIntents(request: DesignRequest): IntentSegment[] {
    const input = request.rawInput;

    for (const { pattern, relation } of COMBO_PATTERNS) {
      const match = input.match(pattern);
      if (match && match[1] && match[2]) {
        const seg1 = this.routeSingle(match[1].trim());
        const seg2 = this.routeSingle(match[2].trim());
        if (seg1.confidence > 0.1 && seg2.confidence > 0.1) {
          if (relation === 'embed') {
            seg2.dependsOn = 0;
          }
          return [seg1, seg2];
        }
      }
    }

    const single = this.routeSingle(input);
    return [single];
  }

  private routeSingle(text: string): IntentSegment {
    const fakeRequest: DesignRequest = { taskId: '', rawInput: text, metadata: {} };
    const allCandidates: RouteCandidate[] = [];

    for (const strategy of this.strategies) {
      allCandidates.push(...strategy.score(fakeRequest, this.skills));
    }

    const merged = new Map<string, { skill: DesignSkill; total: number }>();
    for (const c of allCandidates) {
      const weight = c.strategy === 'exact' ? 2.0 : 1.0;
      const existing = merged.get(c.skill.contract.name);
      if (existing) {
        existing.total += c.score * weight;
      } else {
        merged.set(c.skill.contract.name, { skill: c.skill, total: c.score * weight });
      }
    }

    const ranked = [...merged.values()].sort((a, b) => b.total - a.total);
    const best = ranked[0] ?? null;
    const maxPossible = this.strategies.length * 3;
    const confidence = best ? Math.min(best.total / maxPossible, 1.0) : 0;

    return {
      text,
      primaryType: best?.skill.contract.artifactType ?? 'slides',
      matchedSkill: best?.skill.contract.name ?? '',
      confidence,
    };
  }

  private detectDependencies(segments: IntentSegment[]): Array<[number, number]> {
    const deps: Array<[number, number]> = [];
    for (let i = 0; i < segments.length; i++) {
      if (segments[i].dependsOn !== undefined) {
        deps.push([segments[i].dependsOn!, i]);
      }
    }
    if (deps.length === 0 && segments.length > 1) {
      for (let i = 0; i < segments.length - 1; i++) {
        deps.push([i, i + 1]);
      }
    }
    return deps;
  }

  private buildExplanation(
    segments: IntentSegment[],
    dependencies: Array<[number, number]>,
    request: DesignRequest,
  ): RouteExplanation {
    const reasons: string[] = [];
    for (const seg of segments) {
      reasons.push(
        `"${seg.text}" → ${seg.matchedSkill || '(未匹配)'} (置信度 ${(seg.confidence * 100).toFixed(0)}%)`,
      );
    }

    if (dependencies.length > 0) {
      reasons.push(`执行顺序: ${dependencies.map(([a, b]) => `步骤${a + 1} → 步骤${b + 1}`).join(', ')}`);
    }

    const adoptedContext = Object.keys(request.metadata ?? {});
    const avgConfidence = segments.reduce((s, seg) => s + seg.confidence, 0) / segments.length;

    return {
      summary: segments.length > 1
        ? `识别到 ${segments.length} 个设计意图，将按依赖顺序执行`
        : `单一意图: ${segments[0]?.matchedSkill || '未匹配'}`,
      reasons,
      confidence: avgConfidence,
      adoptedContext,
      plannedQualityGates: segments.map(s => `${s.primaryType}-quality`),
    };
  }
}
