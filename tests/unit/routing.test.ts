import { describe, expect, it, vi } from 'vitest';
import { IntentRouter } from '../../src/routing/intent-router.js';
import { SlidesSkill } from '../../src/execution/slides-skill.js';
import type { DesignRequest, DesignSkill, ThemePack, Artifact } from '../../src/types.js';
import type { IntentClassifierProvider, ClassificationResult, SkillDescription } from '../../src/routing/intent-classifier.js';

const theme: ThemePack = {
  colorPrimary: '#000000',
  colorBg: '#ffffff',
  fontHeading: 'Heading',
  fontBody: 'Body',
  spacingUnit: '8px',
  radius: '4px',
  cssVariables: {},
};

function makeSkill(
  name: string,
  artifactType: DesignSkill['contract']['artifactType'],
  triggerKeywords: string[],
): DesignSkill {
  return {
    contract: {
      name,
      artifactType,
      description: `${name} description`,
      triggerKeywords,
    },
    async generate(): Promise<Artifact> {
      return {
        taskId: 'artifact-1',
        type: artifactType,
        status: 'ready',
        html: '<html><body>ok</body></html>',
        pages: 1,
        metadata: { theme },
      };
    },
  };
}

function makeRequest(rawInput: string, metadata?: Record<string, unknown>): DesignRequest {
  return {
    taskId: 'task-1',
    rawInput,
    metadata,
  };
}

/** Mock LLM classifier that returns a predetermined result */
function makeMockClassifier(
  result: ClassificationResult,
): IntentClassifierProvider {
  return {
    classify: vi.fn().mockResolvedValue(result),
  };
}

/** Mock LLM classifier that rejects with an error */
function makeErrorClassifier(error: Error): IntentClassifierProvider {
  return {
    classify: vi.fn().mockRejectedValue(error),
  };
}

/** Mock LLM classifier that never resolves (for timeout tests) */
function makeHangingClassifier(): IntentClassifierProvider {
  return {
    classify: vi.fn().mockImplementation(
      () => new Promise<ClassificationResult>(() => { /* never resolves */ }),
    ),
  };
}

describe('IntentRouter — LLM main path', () => {
  it('uses LLM classifier when provider is injected', async () => {
    const mockClassifier = makeMockClassifier({
      primaryType: 'chart',
      secondaryTypes: [],
      confidence: 0.95,
      reasoning: 'User wants a chart',
    });

    const router = new IntentRouter({ classifierProvider: mockClassifier });
    router.registerAll([
      makeSkill('slides', 'slides', ['演示文稿']),
      makeSkill('chart', 'chart', ['图表']),
    ]);

    const result = await router.route(makeRequest('show me quarterly revenue'));

    expect(mockClassifier.classify).toHaveBeenCalledOnce();
    expect(result.primaryType).toBe('chart');
    expect(result.matchedSkill).toBe('chart');
    expect(result.confidence).toBe(0.95);
    expect(result.degraded).toBe(false);
    expect(result.reasoning).toBe('User wants a chart');
  });

  it('LLM result carries secondaryTypes through to IntentPacket', async () => {
    const mockClassifier = makeMockClassifier({
      primaryType: 'slides',
      secondaryTypes: ['chart'],
      confidence: 0.8,
    });

    const router = new IntentRouter({ classifierProvider: mockClassifier });
    router.register(makeSkill('slides', 'slides', ['演示文稿']));
    router.register(makeSkill('chart', 'chart', ['图表']));

    const result = await router.route(makeRequest('季度汇报含图表'));

    expect(result.primaryType).toBe('slides');
    expect(result.secondaryTypes).toEqual(['chart']);
    expect(result.degraded).toBe(false);
  });

  it('degrades to keyword fallback when LLM classifier throws', async () => {
    const errorClassifier = makeErrorClassifier(new Error('LLM API 500'));

    const router = new IntentRouter({ classifierProvider: errorClassifier });
    router.registerAll([
      makeSkill('slides', 'slides', ['演示文稿', 'deck']),
      makeSkill('chart', 'chart', ['图表']),
    ]);

    const result = await router.route(makeRequest('做一个 deck'));

    expect(errorClassifier.classify).toHaveBeenCalledOnce();
    // Should fall back to keyword matching
    expect(result.matchedSkill).toBe('slides');
    expect(result.degraded).toBe(true);
  });

  it('degrades to keyword fallback when LLM classifier times out', async () => {
    vi.useFakeTimers();

    const hangingClassifier = makeHangingClassifier();

    // Use a short timeout so the test doesn't actually wait 30s
    const router = new IntentRouter({
      classifierProvider: hangingClassifier,
      classifyTimeoutMs: 100,
    });
    router.registerAll([
      makeSkill('slides', 'slides', ['演示文稿', 'deck']),
      makeSkill('chart', 'chart', ['图表']),
    ]);

    const routePromise = router.route(makeRequest('做一个 deck'));

    // Advance past the timeout
    await vi.advanceTimersByTimeAsync(150);

    const result = await routePromise;

    expect(hangingClassifier.classify).toHaveBeenCalledOnce();
    expect(result.matchedSkill).toBe('slides');
    expect(result.degraded).toBe(true);

    vi.useRealTimers();
  });

  it('respects custom classifyTimeoutMs option', async () => {
    vi.useFakeTimers();

    const hangingClassifier = makeHangingClassifier();

    const router = new IntentRouter({
      classifierProvider: hangingClassifier,
      classifyTimeoutMs: 50,
    });
    router.register(makeSkill('slides', 'slides', ['演示文稿']));

    const routePromise = router.route(makeRequest('演示文稿'));

    // At 40ms the classifier should still be pending (not timed out yet)
    await vi.advanceTimersByTimeAsync(40);

    // Advance past the 50ms timeout
    await vi.advanceTimersByTimeAsync(20);

    const result = await routePromise;

    expect(result.degraded).toBe(true);

    vi.useRealTimers();
  });

  it('passes skill descriptions to the LLM classifier', async () => {
    const classifySpy = vi.fn().mockResolvedValue({
      primaryType: 'slides',
      secondaryTypes: [],
      confidence: 0.9,
    } satisfies ClassificationResult);

    const mockClassifier: IntentClassifierProvider = { classify: classifySpy };

    const router = new IntentRouter({ classifierProvider: mockClassifier });
    router.registerAll([
      makeSkill('slides', 'slides', ['演示文稿']),
      makeSkill('chart', 'chart', ['图表']),
    ]);

    await router.route(makeRequest('test'));

    expect(classifySpy).toHaveBeenCalledWith(
      'test',
      expect.arrayContaining([
        expect.objectContaining({ name: 'slides', artifactType: 'slides' }),
        expect.objectContaining({ name: 'chart', artifactType: 'chart' }),
      ]),
    );
  });
});

describe('IntentRouter — keyword fallback path', () => {
  it('routes to the skill with the highest keyword match score', async () => {
    const router = new IntentRouter();
    router.registerAll([
      makeSkill('slides', 'slides', ['演示文稿', '汇报', 'deck']),
      makeSkill('chart', 'chart', ['图表', '柱状图']),
    ]);

    const result = await router.route(makeRequest('请做一个季度汇报演示文稿 deck'));

    expect(result.matchedSkill).toBe('slides');
    expect(result.primaryType).toBe('slides');
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.degraded).toBe(true);
  });

  it('matches keywords case-insensitively', async () => {
    const router = new IntentRouter();
    router.register(makeSkill('chart', 'chart', ['bar chart', 'sales']));

    const result = await router.route(makeRequest('Need a BAR CHART for sales review'));

    expect(result.matchedSkill).toBe('chart');
    expect(result.primaryType).toBe('chart');
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('preserves request metadata inside the routing context', async () => {
    const router = new IntentRouter();
    router.register(makeSkill('slides', 'slides', ['演示文稿']));

    const result = await router.route(makeRequest('做一个演示文稿', { locale: 'zh-CN', audience: 'exec' }));

    expect(result.context).toEqual({ locale: 'zh-CN', audience: 'exec' });
  });

  it('returns low confidence with degraded flag for ambiguous input', async () => {
    const router = new IntentRouter();
    router.register(makeSkill('slides', 'slides', ['演示文稿']));

    const result = await router.route(makeRequest('做点什么'));

    // Fallback mode: keyword classifier may still find a fuzzy match
    expect(result.degraded).toBe(true);
    expect(result.confidence).toBeLessThan(1);
    expect(result.primaryType).toBe('slides');
  });

  it('routes PPTX export intents to slides via added trigger keywords', async () => {
    const router = new IntentRouter();
    router.register(makeSkill('slides', 'slides', [
      'presentation', 'ppt', 'slides', 'deck',
      'convert to .pptx', 'convert to pptx', 'export as pptx', 'save as pptx',
      '导出pptx', '转换为pptx', '生成pptx', '保存为pptx',
    ]));
    router.register(makeSkill('chart', 'chart', ['图表', 'bar chart']));

    const inputs = [
      'convert to .pptx',
      'convert to pptx',
      '请帮我导出pptx',
      '把这个转换为pptx',
      '生成pptx',
      '保存为pptx',
    ];

    for (const rawInput of inputs) {
      const result = await router.route(makeRequest(rawInput));
      expect(result.matchedSkill).toBe('slides');
      expect(result.primaryType).toBe('slides');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.degraded).toBe(true);
    }
  });

  it('ships PPTX export trigger phrases on SlidesSkill contract', () => {
    const triggerKeywords = new Set(new SlidesSkill().contract.triggerKeywords);

    expect(triggerKeywords.has('convert to .pptx')).toBe(true);
    expect(triggerKeywords.has('convert to pptx')).toBe(true);
    expect(triggerKeywords.has('导出pptx')).toBe(true);
    expect(triggerKeywords.has('转换为pptx')).toBe(true);
    expect(triggerKeywords.has('生成pptx')).toBe(true);
    expect(triggerKeywords.has('保存为pptx')).toBe(true);
  });

  it('exposes registered skill names and lookup by name', () => {
    const router = new IntentRouter();
    const slides = makeSkill('slides', 'slides', ['演示文稿']);
    const chart = makeSkill('chart', 'chart', ['图表']);
    router.registerAll([slides, chart]);

    expect(router.listSkills()).toEqual(['slides', 'chart']);
    expect(router.getSkillByName('chart')).toBe(chart);
    expect(router.getSkillByName('missing')).toBeUndefined();
  });
});
