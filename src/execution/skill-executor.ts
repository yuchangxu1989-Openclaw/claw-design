// SkillExecutor — calls matched Skill with ThemePack injection
// ArtifactBuilder — assembles Artifact metadata

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { IntentPacket, ThemePack, Artifact, DesignSkill } from '../types.js';
import { IntentRouter } from '../routing/intent-router.js';
import { DesignAssetLibrary } from '../design-system/design-assets.js';
import { parseAestheticFrontmatter, resolveAestheticPrinciples, checkAestheticPrinciples } from '../design-system/aesthetic-principles.js';
import type { DeliverablePresetPlan, PresetPriorityResolution, PresetResolution } from '../design-system/design-presets.js';
import type { ReferenceStyleResolution } from '../design-system/reference-style.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const DEFAULT_PRIMARY_COLOR = '#1a73e8'; // Google Blue — neutral default for slides/charts

/** Default theme when none provided */
export const DEFAULT_THEME: ThemePack = {
  colorPrimary: DEFAULT_PRIMARY_COLOR,
  colorBg: '#ffffff',
  fontHeading: "'Inter', sans-serif",
  fontBody: "'Noto Sans SC', 'Noto Sans', sans-serif",
  spacingUnit: '8px',
  radius: '4px',
  cssVariables: {
    '--cd-color-primary': DEFAULT_PRIMARY_COLOR,
    '--cd-color-bg': '#ffffff',
    '--cd-font-heading': "'Inter', sans-serif",
    '--cd-font-body': "'Noto Sans SC', 'Noto Sans', sans-serif",
    '--cd-spacing-unit': '8px',
    '--cd-radius': '4px',
  },
};

export class SkillExecutor {
  constructor(
    private router: IntentRouter,
    private designAssets: DesignAssetLibrary = new DesignAssetLibrary(),
  ) {}

  async execute(
    intent: IntentPacket,
    rawInput: string,
    theme: ThemePack = DEFAULT_THEME,
  ): Promise<Artifact> {
    if (!intent.matchedSkill) {
      throw new Error(`No skill matched for task ${intent.taskId}`);
    }

    const skill = this.router.getSkillByName(intent.matchedSkill);
    if (!skill) {
      throw new Error(`Skill "${intent.matchedSkill}" not found in registry`);
    }

    const designAsset = await this.designAssets.resolveForSkill(intent.matchedSkill, intent.context);
    const effectiveTheme = this.designAssets.toThemePack(designAsset.asset, theme);
    const aestheticPrinciples = resolveAestheticPrinciples(
      intent.matchedSkill,
      intent.primaryType,
      parseAestheticFrontmatter(await this.getSkillSource(intent.matchedSkill, skill)),
      intent.context,
    );
    const presetResolution = this.getPresetResolution(intent.context);
    const presetPlan = this.getPresetPlan(intent.context);
    const presetPriority = this.getPresetPriorityResolution(intent.context);
    const presetConstraints = this.toPresetGenerationConstraints(presetResolution, presetPlan, presetPriority);
    const presetDeliveryNotes = this.toPresetDeliveryNotes(presetResolution, presetPlan, presetPriority);
    const referenceStyle = this.getReferenceStyle(intent.context);
    const referenceQualityItems = referenceStyle?.qualityItems ?? [];

    // Ensure taskId, DESIGN.md context, aesthetic rules, and reference-image
    // overlays are propagated so skills can use them as prompt constraints,
    // quality rules, and delivery notes.
    const contextWithTaskId = {
      ...intent.context,
      taskId: intent.taskId,
      designSystemId: designAsset.asset.id,
      designSystemName: designAsset.asset.name,
      designMdContext: designAsset.promptContext,
      aestheticPrinciples: aestheticPrinciples.principles,
      aestheticPrinciplesContext: aestheticPrinciples.promptContext,
      aestheticGenerationConstraints: aestheticPrinciples.generationConstraints,
      aestheticDeviations: aestheticPrinciples.deviations,
      presetUsed: presetResolution ? {
        id: presetResolution.preset.id,
        name: presetResolution.preset.name,
        method: presetResolution.method,
        confidence: presetResolution.confidence,
        degraded: presetResolution.degraded,
        summary: presetResolution.summary,
      } : undefined,
      presetPrioritySummary: presetPriority?.summary,
      referenceStyle,
      referenceStyleDesignMd: referenceStyle?.designMd,
      referenceStyleAnalysis: referenceStyle?.analysis,
      referenceStyleGenerationConstraints: referenceStyle?.generationConstraints ?? [],
      referenceStyleDeliveryNotes: referenceStyle?.deliveryNotes ?? [],
      designGenerationConstraints: [
        ...designAsset.generationConstraints,
        ...presetConstraints,
        ...aestheticPrinciples.generationConstraints,
        ...(referenceStyle?.generationConstraints ?? []),
      ],
      designDeliveryNotes: [
        ...designAsset.deliveryNotes,
        ...presetDeliveryNotes,
        ...(referenceStyle?.deliveryNotes ?? []),
      ],
      qualityRules: [
        ...designAsset.qualityRules.map(rule => ({ id: rule.rule, severity: rule.severity, description: rule.message })),
        ...aestheticPrinciples.qualityItems.map(rule => ({ id: rule.rule, severity: rule.severity, description: rule.message })),
        ...referenceQualityItems.map(rule => ({ id: rule.rule, severity: rule.severity, description: rule.message })),
        ...((intent.context.qualityRules as unknown[]) ?? []),
      ],
    };
    const artifact = await skill.generate(rawInput, effectiveTheme, contextWithTaskId);
    const designQualityItems = [
      ...designAsset.qualityRules,
      ...aestheticPrinciples.qualityItems,
      ...referenceQualityItems,
      ...checkAestheticPrinciples(artifact, aestheticPrinciples.principles, aestheticPrinciples.deviations),
      ...this.designAssets.checkHtml(artifact.html ?? '', designAsset.asset, intent.taskId),
    ];
    const referenceMetadata = referenceStyle ? {
      referenceStyle: {
        source: referenceStyle.source,
        status: referenceStyle.analysis.status,
        analysis: referenceStyle.analysis,
        designMd: referenceStyle.designMd,
        prompt: referenceStyle.prompt,
        generationConstraints: referenceStyle.generationConstraints,
        deliveryNotes: referenceStyle.deliveryNotes,
      },
    } : {};
    artifact.metadata = {
      ...artifact.metadata,
      designSystem: {
        id: designAsset.asset.id,
        name: designAsset.asset.name,
        source: designAsset.asset.source,
        promptContext: designAsset.promptContext,
        generationConstraints: designAsset.generationConstraints,
        deliveryNotes: [
          ...designAsset.deliveryNotes,
          ...presetDeliveryNotes,
          ...(referenceStyle?.deliveryNotes ?? []),
        ],
      },
      designSystemQualityReport: {
        taskId: intent.taskId,
        conclusion: designQualityItems.some(item => !item.passed && item.severity === 'block')
          ? 'block'
          : designQualityItems.some(item => !item.passed && item.severity === 'warn')
            ? 'warn'
            : 'pass',
        items: designQualityItems,
        checkedAt: new Date().toISOString(),
      },
      ...(presetResolution ? {
        presetUsed: {
          id: presetResolution.preset.id,
          name: presetResolution.preset.name,
          method: presetResolution.method,
          confidence: presetResolution.confidence,
          degraded: presetResolution.degraded,
          summary: presetResolution.summary,
        },
        presetPlan: presetPlan ? {
          sharedPresetId: presetPlan.sharedPresetId,
          method: presetPlan.method,
          assignments: presetPlan.assignments,
          exceptions: presetPlan.exceptions,
          summary: presetPlan.summary,
        } : undefined,
        presetPriorityResolution: presetPriority,
      } : {}),
      aestheticPrinciples: {
        count: aestheticPrinciples.principles.length,
        overrides: aestheticPrinciples.overrides,
        additions: aestheticPrinciples.additions,
        deviations: aestheticPrinciples.deviations,
        promptContext: aestheticPrinciples.promptContext,
        generationConstraints: aestheticPrinciples.generationConstraints,
      },
      ...referenceMetadata,
    };
    return artifact;
  }


  private getPresetResolution(context: Record<string, unknown>): PresetResolution | null {
    const value = context.presetResolution;
    if (!value || typeof value !== 'object') return null;
    const candidate = value as Partial<PresetResolution>;
    if (!candidate.preset || !candidate.method || typeof candidate.summary !== 'string') return null;
    return candidate as PresetResolution;
  }

  private getPresetPlan(context: Record<string, unknown>): DeliverablePresetPlan | null {
    const value = context.presetPlan;
    if (!value || typeof value !== 'object') return null;
    const candidate = value as Partial<DeliverablePresetPlan>;
    if (!candidate.sharedPresetId || !Array.isArray(candidate.assignments) || typeof candidate.summary !== 'string') return null;
    return candidate as DeliverablePresetPlan;
  }

  private getPresetPriorityResolution(context: Record<string, unknown>): PresetPriorityResolution | null {
    const value = context.presetPriorityResolution;
    if (!value || typeof value !== 'object') return null;
    const candidate = value as Partial<PresetPriorityResolution>;
    if (!candidate.presetId || !candidate.role || typeof candidate.summary !== 'string') return null;
    return candidate as PresetPriorityResolution;
  }

  private toPresetGenerationConstraints(
    resolution: PresetResolution | null,
    plan: DeliverablePresetPlan | null,
    priority: PresetPriorityResolution | null,
  ): string[] {
    if (!resolution) return [];
    return [
      `Design preset selected: ${resolution.preset.name} (${resolution.preset.id}); method=${resolution.method}; confidence=${resolution.confidence}.`,
      resolution.summary,
      ...(plan ? [`Shared preset plan: ${plan.summary}`] : []),
      ...(priority ? [`Preset priority: ${priority.summary}`] : []),
    ];
  }

  private toPresetDeliveryNotes(
    resolution: PresetResolution | null,
    plan: DeliverablePresetPlan | null,
    priority: PresetPriorityResolution | null,
  ): string[] {
    if (!resolution) return [];
    return [
      `Preset used: ${resolution.preset.name} (${resolution.preset.id}) via ${resolution.method}${resolution.degraded ? ' degraded fallback' : ''}.`,
      resolution.summary,
      ...(plan ? [plan.summary] : []),
      ...(priority ? [priority.summary] : []),
    ];
  }

  private getReferenceStyle(context: Record<string, unknown>): ReferenceStyleResolution | null {
    const value = context.referenceStyle;
    if (!value || typeof value !== 'object') return null;
    const candidate = value as Partial<ReferenceStyleResolution>;
    if (!candidate.source || !candidate.analysis || !Array.isArray(candidate.generationConstraints)) return null;
    return candidate as ReferenceStyleResolution;
  }

  private async getSkillSource(skillName: string, skill: DesignSkill): Promise<string> {
    const skillPath = resolve(__dirname, '../../skill', this.skillNameToDir(skillName), 'SKILL.md');
    const content = await readFile(skillPath, 'utf-8').catch(() => null);
    if (content) return content;

    const metadata = skill.contract as unknown as Record<string, unknown>;
    const source = metadata.skillMd ?? metadata.skillMarkdown ?? metadata.source;
    if (typeof source === 'string') return source;
    return [
      '---',
      `name: ${skill.contract.name}`,
      `description: ${skill.contract.description}`,
      `aestheticPrincipleOverrides: ${this.readStringList(metadata.aestheticPrincipleOverrides).join(', ')}`,
      `aestheticPrincipleAdditions: ${this.readStringList(metadata.aestheticPrincipleAdditions).join(', ')}`,
      '---',
    ].join('\n');
  }

  private readStringList(value: unknown): string[] {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  }

  private skillNameToDir(skillName: string): string {
    const map: Record<string, string> = {
      chart: 'charts',
      'arch-diagram': 'architecture',
      'ui-mockup': 'mockup',
    };
    return map[skillName] ?? skillName;
  }
}

/** Builds artifact metadata wrapper — used by skills internally */
export function buildArtifact(
  taskId: string,
  type: IntentPacket['primaryType'],
  html: string,
  pages: number,
  extra: Record<string, unknown> = {},
): Artifact {
  return {
    taskId,
    type,
    status: 'ready',
    html,
    pages,
    metadata: { generatedAt: new Date().toISOString(), ...extra },
  };
}
