// SkillExecutor — calls matched Skill with ThemePack injection
// ArtifactBuilder — assembles Artifact metadata

import type { IntentPacket, ThemePack, Artifact, DesignSkill } from '../types.js';
import { IntentRouter } from '../routing/intent-router.js';

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
  constructor(private router: IntentRouter) {}

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

    // Ensure taskId is propagated into context so skills can access it
    const contextWithTaskId = { ...intent.context, taskId: intent.taskId };
    const artifact = await skill.generate(rawInput, theme, contextWithTaskId);
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
