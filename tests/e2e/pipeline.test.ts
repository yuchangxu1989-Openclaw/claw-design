import { describe, it, expect } from 'vitest';
import { createPipeline, ClarifyNeededError } from '../../src/index.js';

describe('E2E: createPipeline full flow', () => {
  it('routes a slides request through the full pipeline and produces a bundle', async () => {
    const pipeline = await createPipeline();
    const result = await pipeline.run('做一份关于人工智能发展趋势的演示文稿', '/tmp/claw-e2e-test');

    // Quality gate should produce a report
    expect(result.quality).toBeDefined();
    expect(result.quality.conclusion).toBeDefined();
    expect(['pass', 'warn', 'block']).toContain(result.quality.conclusion);

    // If not blocked, bundle should exist with files
    if (result.quality.conclusion !== 'block') {
      expect(result.bundle).not.toBeNull();
      expect(result.bundle!.taskId).toBeDefined();
      expect(result.bundle!.htmlPath).toBeDefined();
      expect(result.bundle!.files.length).toBeGreaterThan(0);
    }

    // Delivery message should be present
    expect(result.deliveryMessage).toBeDefined();
    expect(typeof result.deliveryMessage).toBe('string');
  });

  it('routes a chart request and produces output', async () => {
    const pipeline = await createPipeline();
    const result = await pipeline.run('画一个柱状图展示Q1-Q4销售数据', '/tmp/claw-e2e-chart');

    expect(result.quality).toBeDefined();
    expect(result.quality.taskId).toBeDefined();

    if (result.quality.conclusion !== 'block') {
      expect(result.bundle).not.toBeNull();
      expect(result.bundle!.htmlPath).toContain('.html');
      expect(result.bundle!.pdfPath).toContain('.pdf');
      expect(result.bundle!.pngPath).toContain('.png');
      expect(result.bundle!.consistency?.checkedFormats).toEqual(expect.arrayContaining(['html', 'pptx', 'pdf', 'png']));
    }
  });

  it('runs semantic cross validation only when explicitly enabled', async () => {
    const pipeline = await createPipeline();
    const result = await pipeline.run({
      rawInput: '做一张 AI 战略复盘图表',
      metadata: {
        semanticValidation: {
          enabled: true,
          userAcknowledgedCost: true,
        },
      },
    }, '/tmp/claw-e2e-semantic');

    expect(result.quality.items.some(item => item.rule === 'semantic-cross-validation')).toBe(true);
  });

  it('throws ClarifyNeededError for ambiguous input', async () => {
    const pipeline = await createPipeline();

    await expect(pipeline.run('做点什么', '/tmp/claw-e2e-vague'))
      .rejects.toThrow(ClarifyNeededError);
  });
});
