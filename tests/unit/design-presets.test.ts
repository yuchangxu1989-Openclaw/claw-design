import { describe, expect, it } from 'vitest';
import {
  DEFAULT_DESIGN_SYSTEM_ID,
  DesignAssetLibrary,
} from '../../src/design-system/design-assets.js';
import {
  DesignPresetLibrary,
  type DesignPresetDescriptor,
  type PresetMatchProvider,
  type PresetMatchRequest,
  type PresetMatchResult,
} from '../../src/design-system/design-presets.js';

/** Records the last call so tests can assert the LLM matcher saw the signals. */
class FakeMatchProvider implements PresetMatchProvider {
  lastRequest?: PresetMatchRequest;
  lastPresets?: DesignPresetDescriptor[];
  constructor(private readonly pick: (presets: DesignPresetDescriptor[]) => PresetMatchResult) {}
  async match(request: PresetMatchRequest, presets: DesignPresetDescriptor[]): Promise<PresetMatchResult> {
    this.lastRequest = request;
    this.lastPresets = presets;
    return this.pick(presets);
  }
}

describe('DesignPresetLibrary (FR-H10)', () => {
  it('AC1: ships at least 5 built-in presets, each with a distinct style personality', async () => {
    const library = new DesignPresetLibrary();
    const presets = await library.listPresets();

    expect(presets.length).toBeGreaterThanOrEqual(5);
    for (const preset of presets) {
      expect(preset.personality.length).toBeGreaterThan(0);
      expect(preset.asset.source).toBe('built-in');
    }
    // Distinct positioning: ids and names are unique.
    expect(new Set(presets.map(p => p.id)).size).toBe(presets.length);
    expect(new Set(presets.map(p => p.name)).size).toBe(presets.length);
  });

  it('AC2: every preset carries a complete structured definition', async () => {
    const library = new DesignPresetLibrary();
    const assetLibrary = new DesignAssetLibrary();
    const presets = await library.listPresets();

    for (const preset of presets) {
      // Full FR-H09 10-section format validates.
      expect(assetLibrary.validate(preset.asset.content).valid).toBe(true);
      const { tokens } = preset.asset;
      expect(tokens.colors.length).toBeGreaterThanOrEqual(5); // palette
      expect(tokens.fonts.length).toBeGreaterThanOrEqual(2); // font pairing
      expect(tokens.fontSizes.length).toBeGreaterThanOrEqual(3); // type scale
      expect(tokens.spacing.length).toBeGreaterThanOrEqual(3); // spacing ratios
      expect(tokens.radius.length).toBeGreaterThanOrEqual(1); // radius strategy
      expect(tokens.components.length).toBeGreaterThan(0); // component style
      expect(preset.scenarios.length).toBeGreaterThan(0); // applicable scenarios
    }
  });

  it('distinct presets yield clearly different visual tokens', async () => {
    const library = new DesignPresetLibrary();
    const presets = await library.listPresets();

    // No two presets share the same primary palette — a recolor is not a preset.
    const palettes = presets.map(p => p.asset.tokens.colors.join('|'));
    expect(new Set(palettes).size).toBe(presets.length);
    // Heading font stacks differ across presets.
    const headings = presets.map(p => p.asset.tokens.fonts[0]);
    expect(new Set(headings).size).toBeGreaterThanOrEqual(5);
  });

  it('AC3 (explicit): selects a preset by name and reports the method', async () => {
    const library = new DesignPresetLibrary();
    const presets = await library.listPresets();
    const target = presets[0];

    const resolution = await library.selectPreset(target.id);

    expect(resolution.method).toBe('explicit');
    expect(resolution.preset.id).toBe(target.id);
    expect(resolution.confidence).toBe(1);
    expect(resolution.summary).toContain(target.id);
  });

  it('AC3 (explicit): throws with the available list for an unknown preset id', async () => {
    const library = new DesignPresetLibrary();
    await expect(library.selectPreset('does-not-exist')).rejects.toThrow(/not found. Available presets:/);
  });

  it('AC3 (auto): matches a preset via the injected LLM provider using task signals', async () => {
    const provider = new FakeMatchProvider(presets => ({
      presetId: presets[presets.length - 1].id,
      confidence: 0.84,
      reasoning: 'tone and audience favor this style',
    }));
    const library = new DesignPresetLibrary({ matchProvider: provider });

    const request = { taskType: 'poster', audience: 'streetwear fans', tone: 'bold', rawInput: 'hype drop' };
    const resolution = await library.matchPreset(request);

    expect(resolution.method).toBe('matched');
    expect(resolution.degraded).toBe(false);
    expect(resolution.confidence).toBeCloseTo(0.84);
    expect(resolution.summary).toContain(resolution.preset.id);
    // The provider received the task signals and lightweight descriptors only.
    expect(provider.lastRequest).toEqual(request);
    expect(provider.lastPresets?.every(p => !('asset' in p))).toBe(true);
  });

  it('AC3 (auto): with no provider, returns an explicit degraded default — never a keyword guess', async () => {
    const library = new DesignPresetLibrary();
    const resolution = await library.matchPreset({ taskType: 'report', tone: 'formal' });

    expect(resolution.method).toBe('default');
    expect(resolution.degraded).toBe(true);
    expect(resolution.preset.id).toBe(DEFAULT_DESIGN_SYSTEM_ID);
    expect(resolution.summary).toContain('requires an LLM provider');
  });

  it('AC3 (auto): falls back to the default base when the provider fails', async () => {
    const provider: PresetMatchProvider = {
      async match() {
        throw new Error('llm unavailable');
      },
    };
    const library = new DesignPresetLibrary({ matchProvider: provider });
    const resolution = await library.matchPreset({ taskType: 'chart' });

    expect(resolution.method).toBe('default');
    expect(resolution.degraded).toBe(true);
    expect(resolution.summary).toContain('llm unavailable');
  });

  it('AC4: shares one preset across all deliverables unless an explicit exception is given', async () => {
    const provider = new FakeMatchProvider(presets => ({ presetId: presets[0].id, confidence: 0.9 }));
    const library = new DesignPresetLibrary({ matchProvider: provider });
    const presets = await library.listPresets();
    const sharedId = presets[0].id;
    const exceptionId = presets[1].id;

    const plan = await library.resolveForDeliverables({
      deliverables: ['slides', 'poster', 'one-pager'],
      match: { taskType: 'campaign' },
      exceptions: { poster: exceptionId },
    });

    expect(plan.sharedPresetId).toBe(sharedId);
    const slides = plan.assignments.find(a => a.deliverable === 'slides');
    const poster = plan.assignments.find(a => a.deliverable === 'poster');
    expect(slides?.presetId).toBe(sharedId);
    expect(slides?.isException).toBe(false);
    expect(poster?.presetId).toBe(exceptionId);
    expect(poster?.isException).toBe(true);
    expect(plan.exceptions).toEqual(['poster']);
    expect(plan.summary).toContain('poster');
  });

  it('AC4: without exceptions every deliverable shares the same preset', async () => {
    const library = new DesignPresetLibrary();
    const presets = await library.listPresets();
    const plan = await library.resolveForDeliverables({
      deliverables: ['slides', 'chart'],
      presetId: presets[2].id,
    });

    expect(plan.assignments.every(a => a.presetId === presets[2].id)).toBe(true);
    expect(plan.assignments.every(a => !a.isException)).toBe(true);
    expect(plan.exceptions).toEqual([]);
  });

  it('AC5: explains override, inherit, and base roles against higher-priority constraints', async () => {
    const library = new DesignPresetLibrary();

    const overridden = library.resolvePriority({ presetId: 'tech-minimal', hasBrandPackage: true, brandPackageName: 'AcmeCorp' });
    const inherited = library.resolvePriority({ presetId: 'tech-minimal', hasDesignMd: true, designMdId: 'custom-brand' });
    const base = library.resolvePriority({ presetId: 'tech-minimal' });

    expect(overridden.role).toBe('overridden');
    expect(overridden.summary).toContain('AcmeCorp');
    expect(inherited.role).toBe('inherited');
    expect(inherited.summary).toContain('custom-brand');
    expect(base.role).toBe('base');
    expect(base.summary).toContain('default visual base');
  });
});
