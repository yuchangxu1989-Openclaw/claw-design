import { describe, expect, it } from 'vitest';
import { ProductionOrchestrator } from '../../src/routing/production-orchestrator.js';
import { MultiIntentRouter } from '../../src/routing/multi-intent-router.js';
import type { DesignSkill, Artifact, ArtifactType, ThemePack } from '../../src/types.js';

const theme: ThemePack = {
  colorPrimary: '#000', colorBg: '#fff', fontHeading: 'H', fontBody: 'B',
  spacingUnit: '8px', radius: '4px', cssVariables: {},
};

function makeSkill(name: string, type: ArtifactType, keywords: string[]): DesignSkill {
  return {
    contract: { name, artifactType: type, description: `${name} skill`, triggerKeywords: keywords },
    async generate(input: string): Promise<Artifact> {
      return { taskId: 'test', type, status: 'ready', html: `<div>${name}</div>`, pages: 1, metadata: {} };
    },
  };
}

const slidesSkill = makeSkill('slides', 'slides', ['演示文稿', 'PPT']);
const chartSkill = makeSkill('chart', 'chart', ['图表', '数据']);

describe('FR-A06: ProductionOrchestrator', () => {
  it('AC1: produces main + secondary artifacts in one run', async () => {
    const router = new MultiIntentRouter();
    router.registerAll([slidesSkill, chartSkill]);
    const req = { taskId: 't1', rawInput: '先做演示文稿，再配套图表' };
    const multiResult = router.route(req);

    const orch = new ProductionOrchestrator();
    orch.registerAll([slidesSkill, chartSkill]);
    const plan = orch.buildPlan(multiResult);
    const result = await orch.execute(plan, theme, req.rawInput);

    expect(result.artifacts.length).toBe(2);
    expect(result.artifacts[0].artifact.type).toBe('slides');
    expect(result.artifacts[1].artifact.type).toBe('chart');
  });

  it('AC2: artifacts share same theme context', async () => {
    const router = new MultiIntentRouter();
    router.registerAll([slidesSkill, chartSkill]);
    const req = { taskId: 't2', rawInput: '先做演示文稿，再配套图表' };
    const multiResult = router.route(req);

    const orch = new ProductionOrchestrator();
    orch.registerAll([slidesSkill, chartSkill]);
    const plan = orch.buildPlan(multiResult);
    const result = await orch.execute(plan, theme, req.rawInput);

    expect(result.artifacts.every(a => a.artifact.status === 'ready')).toBe(true);
  });

  it('AC3: each artifact has usage and scene metadata', async () => {
    const router = new MultiIntentRouter();
    router.registerAll([slidesSkill, chartSkill]);
    const req = { taskId: 't3', rawInput: '先做演示文稿，再配套图表' };
    const multiResult = router.route(req);

    const orch = new ProductionOrchestrator();
    orch.registerAll([slidesSkill, chartSkill]);
    const plan = orch.buildPlan(multiResult);
    const result = await orch.execute(plan, theme, req.rawInput);

    for (const a of result.artifacts) {
      expect(a.usage).toBeTruthy();
      expect(a.recommendedScene).toBeTruthy();
      expect(a.order).toBeGreaterThan(0);
    }
  });
});
