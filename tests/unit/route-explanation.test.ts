import { describe, expect, it } from 'vitest';
import { MultiIntentRouter } from '../../src/routing/multi-intent-router.js';
import type { DesignSkill, Artifact, ArtifactType } from '../../src/types.js';

function makeSkill(name: string, type: ArtifactType, keywords: string[]): DesignSkill {
  return {
    contract: { name, artifactType: type, description: `${name} skill`, triggerKeywords: keywords },
    async generate(): Promise<Artifact> {
      return { taskId: 'test', type, status: 'ready', html: '<div/>', pages: 1, metadata: {} };
    },
  };
}

describe('FR-A07: Route Explanation', () => {
  it('AC1: explanation includes primary type, gaps, adopted context, quality gates', () => {
    const router = new MultiIntentRouter();
    router.registerAll([
      makeSkill('slides', 'slides', ['演示文稿', 'PPT']),
      makeSkill('chart', 'chart', ['图表', '数据']),
    ]);

    const req = { taskId: 't1', rawInput: '做一份演示文稿', metadata: { brand: 'acme' } };
    const result = router.route(req);

    expect(result.explanation.summary).toContain('slides');
    expect(result.explanation.confidence).toBeGreaterThan(0);
    expect(result.explanation.adoptedContext).toContain('brand');
    expect(result.explanation.plannedQualityGates.length).toBeGreaterThan(0);
  });

  it('AC2: explanation is human-readable', () => {
    const router = new MultiIntentRouter();
    router.registerAll([
      makeSkill('slides', 'slides', ['演示文稿', 'PPT']),
    ]);

    const req = { taskId: 't2', rawInput: '做一份演示文稿' };
    const result = router.route(req);

    expect(result.explanation.reasons.length).toBeGreaterThan(0);
    expect(result.explanation.reasons[0]).toContain('slides');
  });

  it('AC3: multi-intent explanation includes execution order', () => {
    const router = new MultiIntentRouter();
    router.registerAll([
      makeSkill('slides', 'slides', ['演示文稿', 'PPT', '汇报']),
      makeSkill('chart', 'chart', ['图表', '数据']),
    ]);

    const req = { taskId: 't3', rawInput: '先做演示文稿，再配套图表' };
    const result = router.route(req);

    expect(result.explanation.summary).toContain('2');
    expect(result.explanation.reasons.some(r => r.includes('步骤'))).toBe(true);
  });
});
