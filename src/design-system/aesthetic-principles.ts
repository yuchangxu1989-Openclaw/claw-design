import type { Artifact, ArtifactType, QualityItem } from '../types.js';

export interface AestheticPrinciple {
  id: string;
  name: string;
  appliesTo: Array<ArtifactType | 'all'>;
  positiveRequirements: string[];
  antiPatterns: string[];
  checkpoints: string[];
}

interface SkillAestheticFrontmatter {
  overrides: string[];
  additions: string[];
}

interface SkillAestheticDefinition {
  overrides?: Record<string, Partial<Omit<AestheticPrinciple, 'id'>>>;
  additions?: Record<string, AestheticPrinciple>;
}

export interface AestheticResolution {
  principles: AestheticPrinciple[];
  promptContext: string;
  generationConstraints: string[];
  qualityItems: QualityItem[];
  overrides: string[];
  additions: string[];
  deviations: string[];
}

type AestheticDimension = 'whitespace' | 'contrast' | 'alignment' | 'hierarchy';

interface AestheticHeuristicRule {
  dimension: AestheticDimension;
  principleId: string;
  severity: QualityItem['severity'];
  keywords: string[];
  approvedKeywords: string[];
  message: string;
  suggestion: string;
}

const AESTHETIC_HEURISTIC_RULES: AestheticHeuristicRule[] = [
  {
    dimension: 'whitespace',
    principleId: 'whitespace-rhythm',
    severity: 'warn',
    keywords: ['dense', 'high density', 'compact', 'cramped', 'tight', 'packed', 'fill every', 'no whitespace', 'low whitespace', 'minimal spacing', '高密度', '紧凑', '拥挤', '塞满', '留白少'],
    approvedKeywords: ['approved aesthetic deviation', 'denser-than-default', 'high information density', 'compact comparison modules', 'dense views must still scan cleanly'],
    message: 'Whitespace rhythm may be weak because the artifact context describes a dense or cramped layout.',
    suggestion: 'Keep density, but preserve repeatable spacing intervals and visible breathing room around major blocks.',
  },
  {
    dimension: 'contrast',
    principleId: 'contrast-hierarchy',
    severity: 'warn',
    keywords: ['low contrast', 'muted', 'subtle contrast', 'same visual weight', 'same emphasis', 'flat hierarchy', 'many accents', 'accent everywhere', '低对比', '弱对比', '层级弱', '同等强调'],
    approvedKeywords: ['reserve the strongest contrast', 'primary content', 'supporting content', 'high contrast'],
    message: 'Contrast hierarchy may be unclear because the artifact context suggests low contrast or competing emphasis.',
    suggestion: 'Reserve the strongest color, weight, or surface contrast for the primary headline, KPI, or action.',
  },
  {
    dimension: 'alignment',
    principleId: 'alignment-order',
    severity: 'warn',
    keywords: ['misaligned', 'freeform', 'scattered', 'random offset', 'asymmetric chaos', 'mixed alignment', 'arbitrary offset', 'broken grid', '错位', '散乱', '随机偏移', '混合对齐'],
    approvedKeywords: ['shared grid', 'stable alignment', 'shared edges', 'shared axis', 'intentional'],
    message: 'Alignment order may be weak because the artifact context describes scattered or mixed alignment.',
    suggestion: 'Use a stable grid, shared edges, or repeated baselines unless the exception is explicit and intentional.',
  },
  {
    dimension: 'hierarchy',
    principleId: 'primary-secondary-order',
    severity: 'warn',
    keywords: ['no primary', 'equal emphasis', 'metadata emphasis', 'hidden cta', 'buried', 'everything loud', 'unclear priority', 'no focal point', '主次不清', '同等强调', '重点埋没'],
    approvedKeywords: ['primary message readable first', 'supporting details readable second', 'dominant focal point', 'single most important'],
    message: 'Primary versus secondary order may be unclear because the artifact context suggests equal emphasis or buried priority.',
    suggestion: 'Make the primary layer readable first, then separate supporting evidence and metadata through scale, spacing, and grouping.',
  },
];

const GLOBAL_PRINCIPLES: AestheticPrinciple[] = [
  {
    id: 'whitespace-rhythm',
    name: 'Whitespace Rhythm',
    appliesTo: ['all'],
    positiveRequirements: [
      'Use consistent spacing intervals so adjacent modules read as part of the same system.',
      'Leave enough empty area around titles, charts, and calls to action for them to breathe.',
    ],
    antiPatterns: [
      'Do not compress unrelated content blocks until they visually merge.',
      'Do not fill every empty area with decoration or secondary copy.',
    ],
    checkpoints: [
      'Can the eye detect a repeatable spacing rhythm between sections and within sections?',
      'Does every major block have visible breathing room on at least one side?',
    ],
  },
  {
    id: 'contrast-hierarchy',
    name: 'Contrast Hierarchy',
    appliesTo: ['all'],
    positiveRequirements: [
      'Create clear contrast between primary content, supporting content, and background surfaces.',
      'Reserve the strongest contrast for the single most important action, number, or headline.',
    ],
    antiPatterns: [
      'Do not let all text sit at the same visual weight.',
      'Do not use accent color on too many competing elements.',
    ],
    checkpoints: [
      'Can a viewer identify the first thing to read within one second?',
      'Are low-priority labels visibly quieter than core messages?',
    ],
  },
  {
    id: 'information-density',
    name: 'Information Density',
    appliesTo: ['all'],
    positiveRequirements: [
      'Match density to the artifact type: dense views must still scan cleanly, sparse views must still feel intentional.',
      'Group related facts so each block answers one question instead of many.',
    ],
    antiPatterns: [
      'Do not add decorative sections that dilute the core message.',
      'Do not stack too many unrelated ideas inside one frame or card.',
    ],
    checkpoints: [
      'Does each section have one primary job?',
      'Would removing a block improve clarity more than it hurts completeness?',
    ],
  },
  {
    id: 'visual-focus',
    name: 'Visual Focus',
    appliesTo: ['all'],
    positiveRequirements: [
      'Establish one dominant focal point per page, frame, or viewport.',
      'Use scale, position, and contrast to pull attention toward the business-critical content.',
    ],
    antiPatterns: [
      'Do not create multiple equally loud focal points in the same viewport.',
      'Do not center everything if the artifact needs directional reading.',
    ],
    checkpoints: [
      'Is the visual center obvious without reading all text?',
      'Does the focal point support the task goal rather than decoration?',
    ],
  },
  {
    id: 'alignment-order',
    name: 'Alignment Order',
    appliesTo: ['all'],
    positiveRequirements: [
      'Use a stable alignment system so blocks share edges, columns, or baselines.',
      'Let repeated elements follow the same geometry and spacing rules.',
    ],
    antiPatterns: [
      'Do not offset elements arbitrarily to fake energy.',
      'Do not mix unrelated alignment modes inside the same section without a clear reason.',
    ],
    checkpoints: [
      'Do repeated components snap to a shared grid or axis?',
      'Are misalignments intentional and explainable?',
    ],
  },
  {
    id: 'primary-secondary-order',
    name: 'Primary vs Secondary Order',
    appliesTo: ['all'],
    positiveRequirements: [
      'Make the primary message readable first and the supporting details readable second.',
      'Use typography, spacing, and grouping to show what is core versus optional.',
    ],
    antiPatterns: [
      'Do not give metadata the same emphasis as the headline or KPI.',
      'Do not hide critical next steps under the visual treatment of minor details.',
    ],
    checkpoints: [
      'Can a viewer separate headline, evidence, and footnote layers at a glance?',
      'If someone reads only the primary layer, do they still understand the point?',
    ],
  },
];

const SKILL_DEFINITIONS: Record<string, SkillAestheticDefinition> = {
  dashboard: {
    overrides: {
      'information-density': {
        positiveRequirements: [
          'Support high information density, but keep repeated metrics chunked into scan-friendly groups.',
          'Favor compact comparison modules over oversized decorative wrappers.',
        ],
        antiPatterns: [
          'Do not waste above-the-fold space on decorative hero treatments.',
          'Do not let KPI cards sprawl so widely that comparisons become hard.',
        ],
        checkpoints: [
          'Can a user compare KPIs in a left-to-right or top-to-bottom sweep?',
          'Is density serving monitoring rather than clutter?',
        ],
      },
    },
    additions: {
      'dashboard-scan-path': {
        id: 'dashboard-scan-path',
        name: 'Dashboard Scan Path',
        appliesTo: ['dashboard'],
        positiveRequirements: [
          'Place the highest-priority KPIs and alerts at the start of the natural scan path.',
          'Keep comparison widgets visually adjacent so trend reading is fast.',
        ],
        antiPatterns: [
          'Do not bury urgent metrics below secondary charts.',
          'Do not split tightly related metrics across distant sections.',
        ],
        checkpoints: [
          'Can an operator find the most important KPI within one sweep?',
          'Are alert states and trend states visually distinct?',
        ],
      },
    },
  },
  charts: {
    additions: {
      'chart-data-ink': {
        id: 'chart-data-ink',
        name: 'Data-Ink Discipline',
        appliesTo: ['chart'],
        positiveRequirements: [
          'Use visual emphasis to support the data story, not to decorate the chart shell.',
          'Keep labels, legends, and axes legible without overwhelming the plotted data.',
        ],
        antiPatterns: [
          'Do not add ornamental gradients, shadows, or frames that compete with the marks.',
          'Do not use more highlight colors than needed to tell the comparison story.',
        ],
        checkpoints: [
          'Is the main insight obvious before reading every label?',
          'Would removing a decorative effect improve data clarity?',
        ],
      },
    },
  },
  architecture: {
    additions: {
      'diagram-flow-clarity': {
        id: 'diagram-flow-clarity',
        name: 'Diagram Flow Clarity',
        appliesTo: ['arch-diagram', 'flowchart', 'logic-diagram'],
        positiveRequirements: [
          'Make directional flow, grouping, and containment visible before the viewer reads every label.',
          'Use connectors and containers to reduce ambiguity about relationships.',
        ],
        antiPatterns: [
          'Do not cross connectors gratuitously when layout can avoid it.',
          'Do not mix multiple relationship semantics without visual distinction.',
        ],
        checkpoints: [
          'Can the viewer trace the main path without backtracking?',
          'Are groups, boundaries, and dependencies visually unambiguous?',
        ],
      },
    },
  },
  'landing-page': {
    overrides: {
      'visual-focus': {
        positiveRequirements: [
          'Use the first viewport to establish a brand or product signal immediately.',
          'Ensure the primary offer and action are unmistakable before scrolling.',
        ],
        antiPatterns: [
          'Do not let decorative imagery overpower the offer.',
          'Do not create a hero with no visible next-step action.',
        ],
        checkpoints: [
          'Is the offer obvious in the first viewport?',
          'Does the primary call to action stand out more than supporting links?',
        ],
      },
    },
    additions: {
      'landing-conversion-flow': {
        id: 'landing-conversion-flow',
        name: 'Conversion Flow',
        appliesTo: ['landing-page'],
        positiveRequirements: [
          'Arrange sections so proof, explanation, and action progress in a persuasive order.',
          'Keep calls to action visible at natural decision points.',
        ],
        antiPatterns: [
          'Do not interrupt the page with unrelated visual tangents.',
          'Do not place pricing or proof so late that the page feels evasive.',
        ],
        checkpoints: [
          'Does each section answer the next obvious buyer question?',
          'Are CTA placements aligned with user intent rather than filler repetition?',
        ],
      },
    },
  },
  mockup: {
    additions: {
      'interface-affordance-clarity': {
        id: 'interface-affordance-clarity',
        name: 'Affordance Clarity',
        appliesTo: ['ui-mockup', 'prototype'],
        positiveRequirements: [
          'Interactive elements should look interactive through position, contrast, and shape consistency.',
          'Tool surfaces should prioritize ergonomic grouping over ornamental composition.',
        ],
        antiPatterns: [
          'Do not style primary controls like passive labels.',
          'Do not hide dense workflows inside decorative card stacks.',
        ],
        checkpoints: [
          'Can a first-time user identify primary controls without explanation?',
          'Do layout choices support repeated use rather than static presentation?',
        ],
      },
    },
  },
  flowchart: {
    additions: {
      'diagram-flow-clarity': {
        id: 'diagram-flow-clarity',
        name: 'Diagram Flow Clarity',
        appliesTo: ['arch-diagram', 'flowchart', 'logic-diagram'],
        positiveRequirements: [
          'Make directional flow, grouping, and containment visible before the viewer reads every label.',
          'Use connectors and containers to reduce ambiguity about relationships.',
        ],
        antiPatterns: [
          'Do not cross connectors gratuitously when layout can avoid it.',
          'Do not mix multiple relationship semantics without visual distinction.',
        ],
        checkpoints: [
          'Can the viewer trace the main path without backtracking?',
          'Are groups, boundaries, and dependencies visually unambiguous?',
        ],
      },
    },
  },
  'logic-diagram': {
    additions: {
      'diagram-flow-clarity': {
        id: 'diagram-flow-clarity',
        name: 'Diagram Flow Clarity',
        appliesTo: ['arch-diagram', 'flowchart', 'logic-diagram'],
        positiveRequirements: [
          'Make directional flow, grouping, and containment visible before the viewer reads every label.',
          'Use connectors and containers to reduce ambiguity about relationships.',
        ],
        antiPatterns: [
          'Do not cross connectors gratuitously when layout can avoid it.',
          'Do not mix multiple relationship semantics without visual distinction.',
        ],
        checkpoints: [
          'Can the viewer trace the main path without backtracking?',
          'Are groups, boundaries, and dependencies visually unambiguous?',
        ],
      },
    },
  },
  poster: {
    overrides: {
      'visual-focus': {
        positiveRequirements: [
          'Make one message, date, or event title dominate the composition.',
          'Use scale and contrast to read clearly from a distance.',
        ],
        antiPatterns: [
          'Do not split attention equally across headline, body, and decoration.',
          'Do not let long copy overpower the headline block.',
        ],
        checkpoints: [
          'Can the core message be understood in three seconds?',
          'Is the supporting information subordinate to the hero message?',
        ],
      },
    },
  },
  slides: {
    additions: {
      'slide-pacing': {
        id: 'slide-pacing',
        name: 'Slide Pacing',
        appliesTo: ['slides'],
        positiveRequirements: [
          'Treat each slide as one beat in a sequence, with one message per slide.',
          'Vary dense and sparse slides intentionally so the deck has rhythm.',
        ],
        antiPatterns: [
          'Do not let every slide share the same visual weight and density.',
          'Do not pack multiple arguments into one frame when pagination can clarify them.',
        ],
        checkpoints: [
          'Would a presenter know the key message of this slide immediately?',
          'Does the sequence feel paced rather than monotonous?',
        ],
      },
    },
  },
};

SKILL_DEFINITIONS.chart = SKILL_DEFINITIONS.charts;
SKILL_DEFINITIONS['arch-diagram'] = SKILL_DEFINITIONS.architecture;
SKILL_DEFINITIONS['ui-mockup'] = SKILL_DEFINITIONS.mockup;

export function parseAestheticFrontmatter(content: string): SkillAestheticFrontmatter {
  const frontmatter = content.match(/^---\n([\s\S]*?)\n---/);
  const source = frontmatter?.[1] ?? content;
  return {
    overrides: parseCsvField(source, 'aestheticPrincipleOverrides'),
    additions: parseCsvField(source, 'aestheticPrincipleAdditions'),
  };
}

export function resolveAestheticPrinciples(
  skillName: string,
  artifactType: ArtifactType,
  frontmatter: SkillAestheticFrontmatter,
  context: Record<string, unknown> = {},
): AestheticResolution {
  const applicableGlobals = GLOBAL_PRINCIPLES.filter(principle => principle.appliesTo.includes('all') || principle.appliesTo.includes(artifactType));
  const skillDefinition = SKILL_DEFINITIONS[skillName] ?? {};
  const resolvedGlobals = applicableGlobals.map(principle => {
    const override = frontmatter.overrides.includes(principle.id) ? skillDefinition.overrides?.[principle.id] : undefined;
    if (!override) return principle;
    return {
      ...principle,
      ...override,
      positiveRequirements: override.positiveRequirements ?? principle.positiveRequirements,
      antiPatterns: override.antiPatterns ?? principle.antiPatterns,
      checkpoints: override.checkpoints ?? principle.checkpoints,
      appliesTo: override.appliesTo ?? principle.appliesTo,
      name: override.name ?? principle.name,
    };
  });

  const additions = frontmatter.additions
    .map(id => skillDefinition.additions?.[id])
    .filter((principle): principle is AestheticPrinciple => Boolean(principle))
    .filter(principle => principle.appliesTo.includes('all') || principle.appliesTo.includes(artifactType));

  const deviations = normalizeDeviations(context.aestheticDeviations ?? context.aestheticDeviation ?? context.designAestheticDeviation);
  const principles = [...resolvedGlobals, ...additions];

  return {
    principles,
    promptContext: toPromptContext(principles, frontmatter.overrides, frontmatter.additions, deviations),
    generationConstraints: toGenerationConstraints(principles, deviations),
    qualityItems: toQualityItems(principles, frontmatter.overrides, frontmatter.additions, deviations),
    overrides: frontmatter.overrides,
    additions: frontmatter.additions,
    deviations,
  };
}

export function checkAestheticPrinciples(artifact: Artifact, principles: AestheticPrinciple[], deviations: string[] = []): QualityItem[] {
  const applicablePrincipleIds = new Set(principles.map(principle => principle.id));
  const contextText = collectAestheticContext(artifact);
  const deviationText = normalizeForSearch(deviations.join(' '));
  const items: QualityItem[] = [];

  for (const rule of AESTHETIC_HEURISTIC_RULES) {
    if (!applicablePrincipleIds.has(rule.principleId)) continue;
    const matchedKeyword = rule.keywords.find(keyword => contextText.includes(normalizeForSearch(keyword)));
    if (!matchedKeyword) continue;

    const approved = rule.approvedKeywords.some(keyword => contextText.includes(normalizeForSearch(keyword)) || deviationText.includes(normalizeForSearch(keyword)));
    items.push({
      rule: `aesthetic:${rule.principleId}:${rule.dimension}`,
      passed: approved,
      severity: approved ? 'info' : rule.severity,
      message: approved
        ? `${rule.message} Approved deviation or stronger local constraint is present.`
        : `${rule.message} Matched context marker: "${matchedKeyword}".`,
      suggestion: rule.suggestion,
      group: 'aesthetic-principles',
    });
  }

  if (items.length === 0) {
    items.push({
      rule: 'aesthetic:heuristic-scan',
      passed: true,
      severity: 'info',
      message: 'Aesthetic heuristic scan completed for whitespace, contrast, alignment, and primary-secondary order without structured context violations.',
      group: 'aesthetic-principles',
    });
  }

  return items;
}

function parseCsvField(source: string, field: string): string[] {
  const match = source.match(new RegExp(`^${field}:\\s*([^\\n]+)$`, 'm'));
  if (!match?.[1]) return [];
  return match[1]
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);
}

function normalizeDeviations(value: unknown): string[] {
  if (typeof value === 'string' && value.trim()) {
    return [value.trim()];
  }
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map(item => item.trim());
  }
  return [];
}

function toPromptContext(
  principles: AestheticPrinciple[],
  overrides: string[],
  additions: string[],
  deviations: string[],
): string {
  const lines = [
    '## Aesthetic Principles',
    `Overrides declared by skill: ${overrides.length > 0 ? overrides.join(', ') : 'none'}`,
    `Additions declared by skill: ${additions.length > 0 ? additions.join(', ') : 'none'}`,
  ];

  if (deviations.length > 0) {
    lines.push('Task-specific deviations from defaults:');
    for (const deviation of deviations) {
      lines.push(`- ${deviation}`);
    }
  }

  for (const principle of principles) {
    lines.push('');
    lines.push(`### ${principle.name} (${principle.id})`);
    lines.push(`Applies to: ${principle.appliesTo.join(', ')}`);
    lines.push('Positive requirements:');
    for (const item of principle.positiveRequirements) lines.push(`- ${item}`);
    lines.push('Anti-patterns:');
    for (const item of principle.antiPatterns) lines.push(`- ${item}`);
    lines.push('Checkpoints:');
    for (const item of principle.checkpoints) lines.push(`- ${item}`);
  }

  return lines.join('\n');
}

function toGenerationConstraints(principles: AestheticPrinciple[], deviations: string[]): string[] {
  const constraints = principles.flatMap(principle => [
    `${principle.name}: ${principle.positiveRequirements.join(' ')}`,
    `Avoid for ${principle.name}: ${principle.antiPatterns.join(' ')}`,
  ]);
  return [
    ...constraints,
    ...deviations.map(deviation => `Approved aesthetic deviation for this task: ${deviation}`),
  ];
}

function toQualityItems(
  principles: AestheticPrinciple[],
  overrides: string[],
  additions: string[],
  deviations: string[],
): QualityItem[] {
  const items: QualityItem[] = principles.map(principle => ({
    rule: `aesthetic:${principle.id}`,
    passed: true,
    severity: 'info',
    message: `${principle.name} checks loaded: ${principle.checkpoints.join(' | ')}`,
    suggestion: principle.antiPatterns.join(' | '),
    group: 'aesthetic-principles',
  }));

  items.unshift({
    rule: 'aesthetic:loaded',
    passed: true,
    severity: 'info',
    message: `Loaded ${principles.length} aesthetic principles. Overrides: ${overrides.join(', ') || 'none'}. Additions: ${additions.join(', ') || 'none'}.`,
    group: 'aesthetic-principles',
  });

  for (const deviation of deviations) {
    items.push({
      rule: 'aesthetic:deviation',
      passed: true,
      severity: 'info',
      message: `Task-specific aesthetic deviation recorded: ${deviation}`,
      group: 'aesthetic-principles',
    });
  }

  return items;
}

function collectAestheticContext(artifact: Artifact): string {
  const parts: string[] = [artifact.type, String(artifact.pages)];
  collectUnknown(artifact.metadata, parts, 0);
  return normalizeForSearch(parts.join(' '));
}

function collectUnknown(value: unknown, parts: string[], depth: number): void {
  if (depth > 5 || value == null) return;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    parts.push(String(value));
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectUnknown(item, parts, depth + 1);
    return;
  }
  if (typeof value === 'object') {
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      parts.push(key);
      collectUnknown(item, parts, depth + 1);
    }
  }
}

function normalizeForSearch(value: string): string {
  return value.toLowerCase().replace(/[\s_-]+/g, ' ').trim();
}
