import { describe, it, expect } from 'vitest';
import { createPipeline, ClarifyNeededError } from '../../src/index.js';
import type { IntentClassifierProvider, ClassificationResult, SkillDescription } from '../../src/routing/intent-classifier.js';
import type { ArtifactType } from '../../src/types.js';

/**
 * Mock LLM classifier for e2e tests.
 * Simulates LLM semantic classification by matching skill keywords.
 */
class MockLLMClassifier implements IntentClassifierProvider {
  async classify(input: string, skillDescriptions: SkillDescription[]): Promise<ClassificationResult> {
    const inputLower = input.toLowerCase();

    // Simulate LLM reasoning: match based on description and example prompts
    let bestMatch: SkillDescription | null = null;
    let bestScore = 0;

    for (const skill of skillDescriptions) {
      let score = 0;
      const descWords = skill.description.toLowerCase().split(/\s+/);
      for (const word of descWords) {
        if (word.length > 2 && inputLower.includes(word)) score += 1;
      }
      if (skill.examplePrompts) {
        for (const ex of skill.examplePrompts) {
          if (inputLower.includes(ex.toLowerCase().slice(0, 4))) score += 2;
        }
      }
      // Check artifact type name in input
      if (inputLower.includes(skill.artifactType)) score += 3;
      // Check skill name in input
      if (inputLower.includes(skill.name)) score += 3;

      if (score > bestScore) {
        bestScore = score;
        bestMatch = skill;
      }
    }

    // Heuristic: common Chinese terms
    if (!bestMatch || bestScore < 2) {
      if (inputLower.includes('演示文稿') || inputLower.includes('ppt') || inputLower.includes('slides')) {
        bestMatch = skillDescriptions.find(s => s.artifactType === 'slides') ?? null;
        bestScore = 5;
      } else if (inputLower.includes('图表') || inputLower.includes('柱状图') || inputLower.includes('chart')) {
        bestMatch = skillDescriptions.find(s => s.artifactType === 'chart') ?? null;
        bestScore = 5;
      } else if (inputLower.includes('架构') || inputLower.includes('arch')) {
        bestMatch = skillDescriptions.find(s => s.artifactType === 'arch-diagram') ?? null;
        bestScore = 5;
      }
    }

    if (bestMatch && bestScore >= 2) {
      return {
        primaryType: bestMatch.artifactType as ArtifactType,
        secondaryTypes: [],
        confidence: Math.min(bestScore / 10, 0.95),
        reasoning: `Mock LLM: matched "${bestMatch.name}" with score ${bestScore}`,
      };
    }

    return {
      primaryType: 'slides',
      secondaryTypes: [],
      confidence: 0.1,
      reasoning: 'Mock LLM: no strong match found',
    };
  }
}

const mockClassifier = new MockLLMClassifier();

describe('E2E: createPipeline full flow', () => {
  it('routes a slides request through the full pipeline and produces a bundle', async () => {
    const pipeline = await createPipeline(undefined, { classifierProvider: mockClassifier });
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
    const pipeline = await createPipeline(undefined, { classifierProvider: mockClassifier });
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
    const pipeline = await createPipeline(undefined, { classifierProvider: mockClassifier });
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

  it('throws ClarifyNeededError for ambiguous input without classifier', async () => {
    const pipeline = await createPipeline();

    await expect(pipeline.run('做点什么', '/tmp/claw-e2e-vague'))
      .rejects.toThrow(ClarifyNeededError);
  });
});
