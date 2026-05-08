import { describe, expect, it } from 'vitest';
import { MultiIntentRouter } from '../../src/routing/multi-intent-router.js';
import { ProductionOrchestrator } from '../../src/routing/production-orchestrator.js';
import { RouteObserver } from '../../src/routing/route-observer.js';
import type { DesignRequest, DesignSkill, Artifact, ArtifactType } from '../../src/types.js';

function makeSkill(name: string, type: ArtifactType, keywords: string[]): DesignSkill {
  return {
    contract: { name, artifactType: type, description: `${name} skill`, triggerKeywords: keywords },
    async generate(input: string): Promise<Artifact> {
      return { taskId: 'test', type, status: 'ready', html: `<div>${name}: ${input}</div>`, pages: 1, metadata: {} };
    },
  };
}

const slidesSkill = makeSkill('slides', 'slides', ['演示文稿', 'PPT', '幻灯片', '汇报']);
const chartSkill = makeSkill('chart', 'chart', ['图表', '数据', '柱状图', '折线图']);
const archSkill = makeSkill('arch-diagram', 'arch-diagram', ['架构图', '系统图', '组件图']);
const flowSkill = makeSkill('flowchart', 'flowchart', ['流程图', '时序图', '泳道图']);

describe('FR-A05: MultiIntentRouter', () => {
  it('AC1: splits combo request "先做演示文稿，再配套图表"', () => {
    const router = new MultiIntentRouter();
    router.registerAll([slidesSkill, chartSkill, archSkill, flowSkill]);

    const req: DesignRequest = { taskId: 't1', rawInput: '先做演示文稿，再配套图表' };
    const result = router.route(req);

    expect(result.segments.length).toBe(2);
    expect(result.segments[0].primaryType).toBe('slides');
    expect(result.segments[1].primaryType).toBe('chart');
  });

  it('AC2: output includes dependency order', () => {
    const router = new MultiIntentRouter();
    router.registerAll([slidesSkill, chartSkill]);

    const req: DesignRequest = { taskId: 't2', rawInput: '先做演示文稿，再配套图表' };
    const result = router.route(req);

    expect(result.dependencies.length).toBeGreaterThan(0);
    expect(result.dependencies[0]).toEqual([0, 1]);
  });

  it('AC3: embed intent preserves main artifact theme', () => {
    const router = new MultiIntentRouter();
    router.registerAll([archSkill, slidesSkill]);

    const req: DesignRequest = { taskId: 't3', rawInput: '先做架构图，嵌入汇报页' };
    const result = router.route(req);

    expect(result.segments.length).toBe(2);
    expect(result.segments[0].primaryType).toBe('arch-diagram');
  });

  it('single intent returns one segment', () => {
    const router = new MultiIntentRouter();
    router.registerAll([slidesSkill, chartSkill]);

    const req: DesignRequest = { taskId: 't4', rawInput: '做一份演示文稿' };
    const result = router.route(req);

    expect(result.segments.length).toBe(1);
    expect(result.segments[0].primaryType).toBe('slides');
  });
});
