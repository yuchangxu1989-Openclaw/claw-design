import { describe, expect, it } from 'vitest';
import { RouteObserver } from '../../src/routing/route-observer.js';
import type { RouteEvent } from '../../src/routing/route-observer.js';

function makeEvent(taskId: string, skill: string, confidence: number): RouteEvent {
  return {
    taskId,
    timestamp: new Date().toISOString(),
    primaryType: 'slides',
    matchedSkill: skill,
    confidence,
    explanation: {
      summary: 'test',
      reasons: [],
      confidence,
      adoptedContext: [],
      plannedQualityGates: [],
    },
  };
}

describe('FR-A08: RouteObserver', () => {
  it('AC1: records route events with full context', () => {
    const observer = new RouteObserver();
    const event = makeEvent('t1', 'slides', 0.8);
    observer.record(event);

    const events = observer.getEvents();
    expect(events.length).toBe(1);
    expect(events[0].taskId).toBe('t1');
    expect(events[0].matchedSkill).toBe('slides');
  });

  it('AC1: correlates outcome with route decision', () => {
    const observer = new RouteObserver();
    observer.record(makeEvent('t1', 'slides', 0.8));
    observer.recordOutcome('t1', 'success');

    const events = observer.getEvents();
    expect(events[0].outcome).toBe('success');
  });

  it('AC2: distinguishes failure sources', () => {
    const observer = new RouteObserver();
    observer.record(makeEvent('t1', 'slides', 0.8));
    observer.record(makeEvent('t2', 'chart', 0.5));
    observer.recordOutcome('t1', 'mismatch', 'chart');
    observer.recordOutcome('t2', 'context_missing');

    const stats = observer.getStats();
    expect(stats.outcomeBreakdown.mismatch).toBe(1);
    expect(stats.outcomeBreakdown.context_missing).toBe(1);
  });

  it('AC3: correction suggestions from mismatch patterns', () => {
    const observer = new RouteObserver();
    observer.record(makeEvent('t1', 'slides', 0.6));
    observer.recordOutcome('t1', 'mismatch', 'chart');
    observer.record(makeEvent('t2', 'slides', 0.5));
    observer.recordOutcome('t2', 'mismatch', 'chart');

    const suggestions = observer.getCorrectionSuggestions();
    expect(suggestions.length).toBe(1);
    expect(suggestions[0].suggestedSkill).toBe('chart');
    expect(suggestions[0].count).toBe(2);
  });

  it('detects low confidence anomaly', () => {
    const observer = new RouteObserver();
    observer.record(makeEvent('t1', 'slides', 0.1));

    const anomalies = observer.getAnomalies();
    expect(anomalies.some(a => a.type === 'low_confidence')).toBe(true);
  });

  it('computes hit rate stats', () => {
    const observer = new RouteObserver();
    observer.record(makeEvent('t1', 'slides', 0.9));
    observer.record(makeEvent('t2', 'chart', 0.8));
    observer.record(makeEvent('t3', 'slides', 0.7));
    observer.recordOutcome('t1', 'success');
    observer.recordOutcome('t2', 'success');
    observer.recordOutcome('t3', 'mismatch', 'chart');

    const stats = observer.getStats();
    expect(stats.totalRoutes).toBe(3);
    expect(stats.hitRate).toBeCloseTo(2 / 3);
  });
});
