// FR-H10: Multi-style design system preset library.
//
// Presets are built-in DESIGN.md assets (FR-H09 format) that additionally
// declare a "## Style Personality" section. This module is a thin layer over
// DesignAssetLibrary so DESIGN.md content stays the single source of truth —
// presets are never re-defined here, only discovered, described, and resolved.
//
// AC3 auto-matching is an intent judgement, so it runs exclusively through an
// injected LLM PresetMatchProvider (mirrors routing/IntentClassifierProvider).
// There is no keyword / regex / rule-based matching fallback: without a
// provider the library returns an explicit degraded result on the default base.
import type { DesignAsset } from './design-assets.js';
import { DEFAULT_DESIGN_SYSTEM_ID, DesignAssetLibrary } from './design-assets.js';

/** Marker section that distinguishes a preset from a plain DESIGN.md asset. */
export const PRESET_PERSONALITY_HEADING = 'Style Personality';

/** Lightweight descriptor handed to the LLM matcher (no full content). */
export interface DesignPresetDescriptor {
  id: string;
  name: string;
  personality: string[];
  scenarios: string[];
}

/** A resolved preset: descriptor plus the underlying DESIGN.md asset. */
export interface DesignPreset extends DesignPresetDescriptor {
  asset: DesignAsset;
}

/** Signals the LLM matcher uses to pick a preset (AC3). */
export interface PresetMatchRequest {
  taskType?: string;
  audience?: string;
  tone?: string;
  brandConstraints?: string;
  rawInput?: string;
}

/** Result returned by an injected PresetMatchProvider. */
export interface PresetMatchResult {
  presetId: string;
  confidence: number;
  reasoning?: string;
  degraded?: boolean;
}

/**
 * Injected by the host environment. Claw Design as a package hardcodes no LLM;
 * the host supplies a matcher that reasons over the descriptors semantically.
 */
export interface PresetMatchProvider {
  match(request: PresetMatchRequest, presets: DesignPresetDescriptor[]): Promise<PresetMatchResult>;
}

export type PresetSelectionMethod = 'explicit' | 'matched' | 'default';

/** Outcome of selecting/auto-matching a single preset. */
export interface PresetResolution {
  preset: DesignPreset;
  method: PresetSelectionMethod;
  confidence: number;
  degraded: boolean;
  summary: string;
  reasoning?: string;
}

/** How a preset relates to a higher-priority visual constraint (AC5). */
export type PresetPriorityRole = 'active' | 'base' | 'inherited' | 'overridden';

export interface PresetPriorityResolution {
  presetId: string;
  role: PresetPriorityRole;
  summary: string;
}

/** Per-task plan that keeps all deliverables on one preset (AC4). */
export interface DeliverablePresetPlan {
  sharedPresetId: string;
  method: PresetSelectionMethod;
  assignments: Array<{ deliverable: string; presetId: string; isException: boolean }>;
  exceptions: string[];
  summary: string;
}

export interface DesignPresetLibraryOptions {
  assetLibrary?: DesignAssetLibrary;
  matchProvider?: PresetMatchProvider;
  /** Neutral base used when auto-match has no provider. Defaults to "general". */
  defaultBaseId?: string;
  matchTimeoutMs?: number;
}

const DEFAULT_MATCH_TIMEOUT_MS = 30_000;

export class DesignPresetLibrary {
  private readonly assets: DesignAssetLibrary;
  private readonly matchProvider: PresetMatchProvider | null;
  private readonly defaultBaseId: string;
  private readonly matchTimeoutMs: number;

  constructor(options: DesignPresetLibraryOptions = {}) {
    this.assets = options.assetLibrary ?? new DesignAssetLibrary();
    this.matchProvider = options.matchProvider ?? null;
    this.defaultBaseId = options.defaultBaseId ?? DEFAULT_DESIGN_SYSTEM_ID;
    this.matchTimeoutMs = options.matchTimeoutMs ?? DEFAULT_MATCH_TIMEOUT_MS;
  }

  /** All built-in presets (assets carrying a Style Personality section). */
  async listPresets(): Promise<DesignPreset[]> {
    const assets = await this.assets.list();
    return assets
      .filter(asset => asset.source === 'built-in' && this.isPreset(asset))
      .map(asset => this.toPreset(asset));
  }

  async getPreset(id: string): Promise<DesignPreset | null> {
    const asset = await this.assets.get(id);
    if (!asset || !this.isPreset(asset)) return null;
    return this.toPreset(asset);
  }

  /** AC3 (explicit): select a preset by name. Throws with the available list. */
  async selectPreset(id: string): Promise<PresetResolution> {
    const preset = await this.getPreset(id);
    if (!preset) {
      const available = (await this.listPresets()).map(p => p.id).join(', ');
      throw new Error(`Design preset "${id}" not found. Available presets: ${available}`);
    }
    return {
      preset,
      method: 'explicit',
      confidence: 1,
      degraded: false,
      summary: `Using preset "${preset.name}" (${preset.id}) — explicitly selected.`,
    };
  }

  /**
   * AC3 (auto): when no preset is explicitly chosen, match one from task type,
   * audience, tone, and brand constraints via the injected LLM provider.
   * Without a provider — or on provider failure / invalid output — returns an
   * explicit degraded result on the default base, never a keyword guess.
   */
  async matchPreset(request: PresetMatchRequest): Promise<PresetResolution> {
    const presets = await this.listPresets();

    if (!this.matchProvider) {
      return this.defaultBaseResolution(
        'Preset auto-match requires an LLM provider; none injected. Using the default base.',
      );
    }
    if (presets.length === 0) {
      return this.defaultBaseResolution('No presets available to match against. Using the default base.');
    }

    let result: PresetMatchResult;
    try {
      const descriptors = presets.map(({ id, name, personality, scenarios }) => ({ id, name, personality, scenarios }));
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('preset match timeout')), this.matchTimeoutMs),
      );
      result = await Promise.race([this.matchProvider.match(request, descriptors), timeout]);
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'unknown error';
      return this.defaultBaseResolution(`Preset auto-match failed (${reason}). Using the default base.`);
    }

    const matched = presets.find(p => p.id === result.presetId);
    if (!matched) {
      return this.defaultBaseResolution(
        `Preset matcher returned unknown preset "${result.presetId}". Using the default base.`,
      );
    }
    return {
      preset: matched,
      method: 'matched',
      confidence: result.confidence,
      degraded: result.degraded ?? false,
      reasoning: result.reasoning,
      summary: `Auto-matched preset "${matched.name}" (${matched.id})${
        result.reasoning ? ` — ${result.reasoning}` : ''
      }.`,
    };
  }

  /** Explicit id when given, otherwise auto-match. Single entry for callers. */
  async resolve(options: { presetId?: string; match?: PresetMatchRequest } = {}): Promise<PresetResolution> {
    if (options.presetId) return this.selectPreset(options.presetId);
    return this.matchPreset(options.match ?? {});
  }

  /**
   * AC4: resolve one shared preset for every deliverable in a task. Callers may
   * pass explicit per-deliverable exceptions; everything else inherits the
   * shared preset so co-produced artifacts cannot drift apart silently.
   */
  async resolveForDeliverables(options: {
    deliverables: string[];
    presetId?: string;
    match?: PresetMatchRequest;
    exceptions?: Record<string, string>;
  }): Promise<DeliverablePresetPlan> {
    const shared = await this.resolve({ presetId: options.presetId, match: options.match });
    const sharedId = shared.preset.id;
    const exceptions = options.exceptions ?? {};

    const assignments = await Promise.all(
      options.deliverables.map(async deliverable => {
        const overrideId = exceptions[deliverable];
        if (overrideId && overrideId !== sharedId && (await this.getPreset(overrideId))) {
          return { deliverable, presetId: overrideId, isException: true };
        }
        return { deliverable, presetId: sharedId, isException: false };
      }),
    );

    const exceptionNames = assignments.filter(a => a.isException).map(a => a.deliverable);
    const summary = exceptionNames.length
      ? `${shared.summary} Shared across deliverables, with explicit exceptions: ${exceptionNames.join(', ')}.`
      : `${shared.summary} Shared across all ${assignments.length} deliverable(s).`;

    return { sharedPresetId: sharedId, method: shared.method, assignments, exceptions: exceptionNames, summary };
  }

  /**
   * AC5: explain how a preset relates to a higher-priority constraint
   * (brand package > DESIGN.md > preset) so the choice is never silent.
   */
  resolvePriority(options: {
    presetId: string;
    hasBrandPackage?: boolean;
    brandPackageName?: string;
    hasDesignMd?: boolean;
    designMdId?: string;
  }): PresetPriorityResolution {
    const { presetId } = options;
    if (options.hasBrandPackage) {
      const pkg = options.brandPackageName ?? 'active brand package';
      return {
        presetId,
        role: 'overridden',
        summary: `Brand package "${pkg}" takes precedence; preset "${presetId}" is overridden and only fills values the package leaves unset.`,
      };
    }
    if (options.hasDesignMd && options.designMdId && options.designMdId !== presetId) {
      return {
        presetId,
        role: 'inherited',
        summary: `DESIGN.md "${options.designMdId}" is active; preset "${presetId}" is inherited as the base layer beneath it.`,
      };
    }
    return {
      presetId,
      role: 'base',
      summary: `No higher-priority brand package or DESIGN.md is active; preset "${presetId}" is the default visual base.`,
    };
  }

  private async defaultBaseResolution(reason: string): Promise<PresetResolution> {
    const asset = await this.assets.get(this.defaultBaseId);
    const resolvedAsset = asset ?? (await this.assets.getActive());
    const preset = this.toPreset(resolvedAsset);
    return {
      preset,
      method: 'default',
      confidence: 0,
      degraded: true,
      summary: `${reason} (${preset.name}, ${preset.id})`,
      reasoning: reason,
    };
  }

  private isPreset(asset: DesignAsset): boolean {
    return new RegExp(`^##\\s+${PRESET_PERSONALITY_HEADING}\\s*$`, 'im').test(asset.content);
  }

  private toPreset(asset: DesignAsset): DesignPreset {
    return {
      id: asset.id,
      name: asset.name,
      personality: this.extractSection(asset.content, PRESET_PERSONALITY_HEADING),
      scenarios: this.extractSection(asset.content, 'Applicable Scenarios'),
      asset,
    };
  }

  private extractSection(content: string, heading: string): string[] {
    const lines = content.split('\n');
    const headingRe = new RegExp(`^##\\s+${heading}\\s*$`, 'i');
    const index = lines.findIndex(line => headingRe.test(line));
    if (index < 0) return [];
    const result: string[] = [];
    for (const line of lines.slice(index + 1)) {
      if (/^##\s+/.test(line)) break;
      const trimmed = line.replace(/^[-*]\s*/, '').trim();
      if (trimmed) result.push(trimmed);
    }
    return result;
  }
}
