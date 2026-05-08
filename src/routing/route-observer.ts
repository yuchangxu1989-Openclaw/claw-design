import type { ArtifactType } from '../types.js';
import type { RouteExplanation } from './multi-intent-router.js';

export type RouteOutcome = 'success' | 'mismatch' | 'context_missing' | 'template_mismatch' | 'export_error';

export interface RouteEvent {
  taskId: string;
  timestamp: string;
  primaryType: ArtifactType;
  matchedSkill: string;
  confidence: number;
  explanation: RouteExplanation;
  outcome?: RouteOutcome;
  correctedTo?: string;
  durationMs?: number;
}

export interface RouteStats {
  totalRoutes: number;
  hitRate: number;
  avgConfidence: number;
  outcomeBreakdown: Record<RouteOutcome, number>;
  topSkills: Array<{ skill: string; count: number; avgConfidence: number }>;
}

export interface RouteAnomaly {
  taskId: string;
  type: 'low_confidence' | 'mismatch' | 'repeated_failure';
  message: string;
  timestamp: string;
}

export class RouteObserver {
  private events: RouteEvent[] = [];
  private anomalies: RouteAnomaly[] = [];
  private readonly maxEvents: number;

  constructor(maxEvents = 1000) {
    this.maxEvents = maxEvents;
  }

  record(event: RouteEvent): void {
    this.events.push(event);
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }
    this.detectAnomalies(event);
  }

  recordOutcome(taskId: string, outcome: RouteOutcome, correctedTo?: string): void {
    const event = this.events.find(e => e.taskId === taskId);
    if (event) {
      event.outcome = outcome;
      if (correctedTo) event.correctedTo = correctedTo;
      if (outcome === 'mismatch') {
        this.anomalies.push({
          taskId,
          type: 'mismatch',
          message: `路由误判: ${event.matchedSkill} → 纠正为 ${correctedTo}`,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  getStats(): RouteStats {
    const total = this.events.length;
    if (total === 0) {
      return {
        totalRoutes: 0,
        hitRate: 0,
        avgConfidence: 0,
        outcomeBreakdown: { success: 0, mismatch: 0, context_missing: 0, template_mismatch: 0, export_error: 0 },
        topSkills: [],
      };
    }

    const withOutcome = this.events.filter(e => e.outcome);
    const successes = withOutcome.filter(e => e.outcome === 'success').length;
    const hitRate = withOutcome.length > 0 ? successes / withOutcome.length : 0;

    const avgConfidence = this.events.reduce((s, e) => s + e.confidence, 0) / total;

    const outcomeBreakdown: Record<RouteOutcome, number> = {
      success: 0, mismatch: 0, context_missing: 0, template_mismatch: 0, export_error: 0,
    };
    for (const e of withOutcome) {
      if (e.outcome) outcomeBreakdown[e.outcome]++;
    }

    const skillCounts = new Map<string, { count: number; totalConf: number }>();
    for (const e of this.events) {
      const existing = skillCounts.get(e.matchedSkill) ?? { count: 0, totalConf: 0 };
      existing.count++;
      existing.totalConf += e.confidence;
      skillCounts.set(e.matchedSkill, existing);
    }

    const topSkills = [...skillCounts.entries()]
      .map(([skill, { count, totalConf }]) => ({ skill, count, avgConfidence: totalConf / count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return { totalRoutes: total, hitRate, avgConfidence, outcomeBreakdown, topSkills };
  }

  getAnomalies(since?: string): RouteAnomaly[] {
    if (!since) return [...this.anomalies];
    return this.anomalies.filter(a => a.timestamp >= since);
  }

  getEvents(filter?: { skill?: string; outcome?: RouteOutcome; since?: string }): RouteEvent[] {
    let result = [...this.events];
    if (filter?.skill) result = result.filter(e => e.matchedSkill === filter.skill);
    if (filter?.outcome) result = result.filter(e => e.outcome === filter.outcome);
    if (filter?.since) result = result.filter(e => e.timestamp >= filter.since!);
    return result;
  }

  getCorrectionSuggestions(): Array<{ pattern: string; suggestedSkill: string; count: number }> {
    const corrections = this.events.filter(e => e.outcome === 'mismatch' && e.correctedTo);
    const grouped = new Map<string, number>();
    for (const e of corrections) {
      const key = `${e.matchedSkill}→${e.correctedTo}`;
      grouped.set(key, (grouped.get(key) ?? 0) + 1);
    }
    return [...grouped.entries()]
      .map(([pattern, count]) => {
        const [, suggestedSkill] = pattern.split('→');
        return { pattern, suggestedSkill, count };
      })
      .sort((a, b) => b.count - a.count);
  }

  clear(): void {
    this.events = [];
    this.anomalies = [];
  }

  private detectAnomalies(event: RouteEvent): void {
    if (event.confidence < 0.3) {
      this.anomalies.push({
        taskId: event.taskId,
        type: 'low_confidence',
        message: `低置信度路由: ${event.matchedSkill} (${(event.confidence * 100).toFixed(0)}%)`,
        timestamp: event.timestamp,
      });
    }

    const recentForSkill = this.events
      .filter(e => e.matchedSkill === event.matchedSkill && e.outcome === 'mismatch')
      .slice(-5);
    if (recentForSkill.length >= 3) {
      this.anomalies.push({
        taskId: event.taskId,
        type: 'repeated_failure',
        message: `${event.matchedSkill} 近期连续误判 ${recentForSkill.length} 次`,
        timestamp: event.timestamp,
      });
    }
  }
}
