import { describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { Artifact, DesignRequest, DesignSkill, ThemePack } from '../src/types.ts';
import type { IntentClassifierProvider } from '../src/routing/intent-classifier.ts';
import { createPipeline } from '../src/index.ts';
import {
  collectReferenceImageSources,
  findReferenceImageSource,
  resolveReferenceStyleForRequest,
  type ReferenceImageAnalyzerProvider,
} from '../src/design-system/reference-style.ts';

const classifier: IntentClassifierProvider = {
  async classify() {
    return {
      primaryType: 'slides',
      secondaryTypes: [],
      confidence: 0.95,
      reasoning: 'test classifier',
    };
  },
};

class CapturingSlidesSkill implements DesignSkill {
  readonly contract = {
    name: 'slides',
    artifactType: 'slides' as const,
    supportedTypes: ['slides' as const],
    description: 'Test slides skill for FR-H12 reference style assertions',
    triggerKeywords: [],
    supportedOutputs: ['html'],
    status: 'active' as const,
  };

  lastContext: Record<string, unknown> | null = null;
  lastTheme: ThemePack | null = null;

  async generate(_input: string, theme: ThemePack, context: Record<string, unknown>): Promise<Artifact> {
    this.lastContext = context;
    this.lastTheme = theme;
    return {
      taskId: String(context.taskId),
      type: 'slides',
      status: 'ready',
      pages: 1,
      html: [
        '<html><head><style>',
        'body{font-family:"Noto Sans SC";color:#1f2937;background:#f8fafc}',
        'section{padding:8px;margin:8px;border-radius:4px}',
        '</style></head><body><section><h1>Reference Style</h1><p>Dense grid editorial direction</p></section></body></html>',
      ].join(''),
      metadata: {},
    };
  }
}

const analyzer: ReferenceImageAnalyzerProvider = {
  async analyzeReferenceImage(request) {
    expect(request.source.uri).toBe('./reference.png');
    expect(request.prompt).toContain('palette');
    expect(request.prompt).toContain('style direction only');
    expect(request.prompt).toContain('palette');
    expect(request.prompt).toContain('style direction only');
    return {
      status: 'complete',
      palette: ['#101820', '#f2aa4c', '#f7f3e8'],
      paletteDescription: 'dark editorial canvas with warm amber accents',
      layout: {
        direction: 'grid',
        proportions: 'asymmetric 60/40 hero grid with tight gutters',
        visualFocus: 'large upper-left hero block',
      },
      typography: {
        style: 'condensed editorial headings with restrained sans body',
        density: 'high',
        hierarchy: 'large heading, compact metadata, dense supporting copy',
        alignment: 'left',
      },
      informationDensity: 'high',
      borrowableFeatures: ['warm accent over dark neutrals', 'asymmetric grid', 'compact captions'],
      nonBorrowableElements: ['logo', 'exact photography', 'headline copy'],
      conflicts: ['selected brand package prefers lower density'],
      missingDimensions: [],
      notes: ['style direction only'],
    };
  },
};
describe('reference image style extraction (FR-H12)', () => {
  it('detects reference images from metadata, attachments, and prompt markers', () => {
    expect(findReferenceImageSource({ taskId: 't1', rawInput: 'x', metadata: { referenceImage: './ref.png' } })?.declaredBy).toBe('metadata');
    expect(findReferenceImageSource({ taskId: 't2', rawInput: 'x', attachments: ['notes.txt', 'https://example.com/ref.webp'] })?.declaredBy).toBe('attachment');
    expect(findReferenceImageSource({ taskId: 't3', rawInput: 'make this [reference-image: ./style.jpg]' })?.uri).toBe('./style.jpg');
  });

  it('collects multiple distinct reference sources instead of silently discarding ambiguity', () => {
    const sources = collectReferenceImageSources({
      taskId: 't-multi',
      rawInput: 'make this [reference-image: ./prompt.jpg]',
      attachments: ['./attachment.png'],
      metadata: { referenceImage: './metadata.png' },
    });

    expect(sources.map(source => source.uri)).toEqual(['./metadata.png', './attachment.png', './prompt.jpg']);
  });

  it('turns analyzer output into temporary DESIGN.md constraints with copying guardrails', async () => {
    const request: DesignRequest = {
      taskId: 'fr-h12-direct',
      rawInput: 'Design a launch deck',
      metadata: { referenceImage: './reference.png' },
    };

    const resolution = await resolveReferenceStyleForRequest(request, { analyzer });

    expect(resolution?.designMd).toContain('Reference Image Style Overlay');
    expect(resolution?.designMd).toContain('#101820');
    expect(resolution?.generationConstraints).toContain('Reference information density: high');
    expect(resolution?.qualityItems.find(item => item.rule === 'reference-style:no-copying')?.passed).toBe(true);
    expect(resolution?.analysis.nonBorrowableElements).toContain('logo');
    expect(resolution?.analysis.conflicts).toContain('selected brand package prefers lower density');
  });
  it('injects reference style overlay into pipeline context, theme, metadata, and quality report', async () => {
    const outputDir = await mkdtemp(join(tmpdir(), 'claw-frh12-'));
    const skill = new CapturingSlidesSkill();
    const pipelineAnalyzer: ReferenceImageAnalyzerProvider = {
      async analyzeReferenceImage(request) {
        expect(request.allSources.map(source => source.uri)).toEqual(['./reference.png']);
        expect(request.skillName).toBe('slides');
        expect(request.artifactType).toBe('slides');
        expect(request.designSystem?.id).toBe('general');
        expect(request.designSystem?.tokens.fonts.join(' | ')).toContain('Inter');
        expect(request.prompt).toContain('Base palette');
        return analyzer.analyzeReferenceImage(request);
      },
    };

    try {
      const pipeline = await createPipeline(undefined, {
        classifierProvider: classifier,
        additionalSkills: [skill],
        referenceImageAnalyzer: pipelineAnalyzer,
      });

      const result = await pipeline.run({
        taskId: 'fr-h12-pipeline',
        rawInput: 'Design a launch deck',
        metadata: { referenceImage: './reference.png' },
      }, outputDir);

      expect(result.bundle).not.toBeNull();
      expect(skill.lastContext?.designMdContext).toContain('Reference Image Style Overlay');
      expect(skill.lastContext?.designGenerationConstraints).toContain('Reference information density: high');
      expect(skill.lastTheme?.colorPrimary).toBe('#f2aa4c');
      expect(skill.lastTheme?.colorBg).toBe('#101820');
      expect(skill.lastTheme?.fontHeading).toBe('Inter, ui-sans-serif, system-ui, sans-serif');
      expect(skill.lastTheme?.fontBody).toBe('ui-monospace, SFMono-Regular, Menlo, monospace');
      expect(skill.lastTheme?.spacingUnit).toBe('12px');

      const metadata = skill.lastContext?.referenceStyle as { analysis?: { status?: string }; designMd?: string } | undefined;
      expect(metadata?.analysis?.status).toBe('complete');
      expect(metadata?.designMd).toContain('Do not perform pixel-level replication');
      expect(result.quality.items.find(item => item.rule === 'reference-style:source')?.passed).toBe(true);
      expect(result.quality.items.find(item => item.rule === 'reference-style:conflicts')?.message).toContain('priority order');
    } finally {
      await rm(outputDir, { recursive: true, force: true });
    }
  });

  it('does not call the analyzer or change context/theme when no reference image exists', async () => {
    const outputDir = await mkdtemp(join(tmpdir(), 'claw-frh12-no-ref-'));
    const skill = new CapturingSlidesSkill();
    let calls = 0;

    try {
      const pipeline = await createPipeline(undefined, {
        classifierProvider: classifier,
        additionalSkills: [skill],
        referenceImageAnalyzer: { async analyzeReferenceImage() { calls += 1; return null; } },
      });

      await pipeline.run({ taskId: 'fr-h12-no-ref', rawInput: 'Design a launch deck' }, outputDir);

      expect(calls).toBe(0);
      expect(skill.lastContext?.referenceStyle).toBeNull();
      expect(skill.lastContext?.designMdContext).not.toContain('Reference Image Style Overlay');
      expect(skill.lastTheme?.fontHeading).toBe('Inter, ui-sans-serif, system-ui, sans-serif');
      expect(skill.lastTheme?.spacingUnit).toBe('12px');
    } finally {
      await rm(outputDir, { recursive: true, force: true });
    }
  });

  it('surfaces ambiguity when multiple reference images are supplied', async () => {
    const resolution = await resolveReferenceStyleForRequest({
      taskId: 'fr-h12-multiple',
      rawInput: 'Design a deck [reference-image: ./prompt.jpg]',
      attachments: ['./attachment.png'],
      metadata: { referenceImage: './reference.png' },
    }, { analyzer });

    expect(resolution?.allSources.map(source => source.uri)).toEqual(['./reference.png', './attachment.png', './prompt.jpg']);
    expect(resolution?.analysis.conflicts[0]).toContain('Multiple reference images were supplied');
    expect(resolution?.qualityItems.find(item => item.rule === 'reference-style:multiple-sources')?.message).toContain('./attachment.png');
  });

  it('reports insufficient extraction when a reference image is supplied without a vision provider', async () => {
    const resolution = await resolveReferenceStyleForRequest({
      taskId: 'fr-h12-missing-provider',
      rawInput: 'Design a landing page',
      metadata: { referenceImage: './low-quality.png' },
    });

    expect(resolution?.analysis.status).toBe('insufficient');
    expect(resolution?.qualityItems.find(item => item.rule === 'reference-style:missing-dimensions')?.message).toContain('palette');
    expect(resolution?.generationConstraints[0]).toContain('could not be converted into stable style constraints');
  });
});
