// SkillExecutor — calls matched Skill with ThemePack injection
// ArtifactBuilder — assembles Artifact metadata

import type { IntentPacket, ThemePack, Artifact, DesignSkill } from '../types.js';
import { IntentRouter } from '../routing/intent-router.js';
import { DesignAssetLibrary } from '../design-system/design-assets.js';

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

    // Ensure taskId and DESIGN.md context are propagated so skills can use them
    // as prompt constraints, quality rules, and delivery notes.
    const contextWithTaskId = {
      ...intent.context,
      taskId: intent.taskId,
      designSystemId: designAsset.asset.id,
      designSystemName: designAsset.asset.name,
      designMdContext: designAsset.promptContext,
      designGenerationConstraints: designAsset.generationConstraints,
      designDeliveryNotes: designAsset.deliveryNotes,
      qualityRules: [
        ...designAsset.qualityRules.map(rule => ({ id: rule.rule, severity: rule.severity, description: rule.message })),
        ...((intent.context.qualityRules as unknown[]) ?? []),
      ],
    };
    const artifact = await skill.generate(rawInput, effectiveTheme, contextWithTaskId);
    const designQualityItems = [
      ...designAsset.qualityRules,
      ...this.designAssets.checkHtml(artifact.html ?? '', designAsset.asset, intent.taskId),
    ];
    artifact.metadata = {
      ...artifact.metadata,
      designSystem: {
        id: designAsset.asset.id,
        name: designAsset.asset.name,
        source: designAsset.asset.source,
        promptContext: designAsset.promptContext,
        generationConstraints: designAsset.generationConstraints,
        deliveryNotes: designAsset.deliveryNotes,
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
    };
    return artifact;
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
