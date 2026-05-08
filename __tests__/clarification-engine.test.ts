// ClarificationEngine unit tests — FR-A09
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClarificationEngine } from '../src/routing/clarification-engine.ts';
import { DefaultClarificationProvider } from '../src/routing/clarification-provider.ts';
import type {
  ClarificationAnswer,
  ClarificationGap,
  ClarificationResult,
} from '../src/routing/clarification-types.ts';

describe('ClarificationEngine', () => {
  let engine: ClarificationEngine;

  beforeEach(() => {
    engine = new ClarificationEngine();
    engine.registerProvider(new DefaultClarificationProvider());
  });

  it('returns null when all gaps are filled in context', () => {
    const ctx = {
      audience: 'developers',
      content_scope: 'API overview',
      delivery_format: 'slides',
      style: 'minimal',
      brand_tone: 'tech',
      color_preference: 'blue',
      info_density: 'high',
      use_case: 'conference',
    };
    const result = engine.detectGaps('routing', ctx);
    expect(result).toBeNull();
  });

  it('detects gaps for missing context fields', () => {
    const input = engine.detectGaps('routing', {});
    expect(input).not.toBeNull();
    expect(input!.gaps.length).toBeGreaterThan(0);
    expect(input!.stage).toBe('routing');
    expect(input!.round).toBe(1);
  });

  it('builds a request with questions from gaps', () => {
    const input = engine.detectGaps('routing', {})!;
    const request = engine.buildRequest(input);
    expect(request.stage).toBe('routing');
    expect(request.round).toBe(1);
    expect(request.questions.length).toBe(input.gaps.length);
    expect(request.questions[0].id).toMatch(/^routing-1-/);
  });

  it('converges in single round when all MUST gaps answered', () => {
    const input = engine.detectGaps('routing', {})!;
    const request = engine.buildRequest(input);
    const mustQs = request.questions.filter(q => q.gapLevel === 'MUST');
    const answers: ClarificationAnswer[] = mustQs.map(q => ({
      questionId: q.id,
      value: 'user-provided-value',
      adoptDefault: false,
    }));
    const outcome = engine.processAnswers('task-1', request, answers, input.gaps);
    expect('result' in outcome).toBe(true);
    const r = (outcome as { result: ClarificationResult }).result;
    expect(r.converged).toBe(true);
    expect(r.fallbackApplied).toHaveLength(0);
    expect(r.totalRounds).toBe(1);
  });

  it('applies fallback when round limit reached with unanswered MUST gaps', () => {
    const engine2 = new ClarificationEngine({ maxRounds: 1 });
    engine2.registerProvider(new DefaultClarificationProvider());
    const input = engine2.detectGaps('routing', {})!;
    const request = engine2.buildRequest(input);
    // Answer nothing
    const outcome = engine2.processAnswers('task-2', request, [], input.gaps);
    expect('result' in outcome).toBe(true);
    const r = (outcome as { result: ClarificationResult }).result;
    expect(r.converged).toBe(true); // converged via fallback
    expect(r.fallbackApplied.length).toBeGreaterThan(0);
    expect(r.fallbackApplied[0].reason).toBe('round_limit_reached');
  });

  it('returns nextRound when MUST gaps remain and rounds available', () => {
    const input = engine.detectGaps('routing', {})!;
    const request = engine.buildRequest(input);
    // Answer nothing — round 1 of max 2
    const outcome = engine.processAnswers('task-3', request, [], input.gaps);
    expect('nextRound' in outcome).toBe(true);
  });

  it('emits events during lifecycle', () => {
    const events: string[] = [];
    engine.on('clarification.started', () => events.push('started'));
    engine.on('clarification.answered', () => events.push('answered'));
    engine.on('clarification.converged', () => events.push('converged'));

    const input = engine.detectGaps('routing', {})!;
    const request = engine.buildRequest(input);
    const mustQs = request.questions.filter(q => q.gapLevel === 'MUST');
    const answers: ClarificationAnswer[] = mustQs.map(q => ({
      questionId: q.id,
      value: 'val',
      adoptDefault: false,
    }));
    engine.processAnswers('task-4', request, answers, input.gaps);

    expect(events).toEqual(['started', 'answered', 'converged']);
  });

  it('records trace entries', () => {
    const input = engine.detectGaps('routing', {})!;
    const request = engine.buildRequest(input);
    const mustQs = request.questions.filter(q => q.gapLevel === 'MUST');
    const answers: ClarificationAnswer[] = mustQs.map(q => ({
      questionId: q.id,
      value: 'v',
      adoptDefault: false,
    }));
    engine.processAnswers('task-5', request, answers, input.gaps);
    const trace = engine.getTrace('task-5');
    expect(trace).toBeDefined();
    expect(trace!.entries).toHaveLength(1);
    expect(trace!.entries[0].stage).toBe('routing');
  });

  it('returns null for unregistered stage', () => {
    const result = engine.detectGaps('execution', {});
    expect(result).toBeNull();
  });
});
