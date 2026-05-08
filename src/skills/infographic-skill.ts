import type { Artifact, ThemePack } from '../types.js';
import { buildArtifact } from '../execution/skill-executor.js';
import { BaseSkill } from './base-skill.js';
import { renderInfographicHtml } from './infographic-renderer.js';
import { extractInputSpecifics } from '../utils.js';
import type {
  InfographicBlock,
  InfographicConfig,
  InfographicOrientation,
  InfographicSkillContext,
  InfographicTheme,
} from './infographic-types.js';

export class InfographicSkill extends BaseSkill<'infographic', InfographicSkillContext> {
  constructor() {
    super({
      name: 'infographic',
      supportedTypes: ['infographic'],
      description: 'Single-page infographic generation with steps, stats, comparisons and hierarchy blocks',
      triggerKeywords: [
        'infographic', 'info graphic', 'data visualization', 'visual summary',
        '信息图', '数据图', '图解', '一图读懂', '可视化摘要', '信息可视化',
      ],
      supportedOutputs: ['html'],
      requiredContext: ['taskId'],
    });
  }

  async generate(
    input: string,
    theme: ThemePack,
    context: Record<string, unknown>,
  ): Promise<Artifact> {
    const ctx = this.toContext(context);
    const config = buildInfographicConfig(input, ctx);
    const html = renderInfographicHtml(config, theme);

    return buildArtifact(
      String(ctx.taskId ?? 'unknown'),
      'infographic',
      html,
      1,
      {
        orientation: config.orientation,
        themeMode: config.theme,
        blockCount: config.blocks.length,
        qualityRules: this.getQualityRules(ctx),
      },
    );
  }
}

function buildInfographicConfig(input: string, context: InfographicSkillContext): InfographicConfig {
  const explicit = (context.infographicConfig && typeof context.infographicConfig === 'object')
    ? context.infographicConfig as Partial<InfographicConfig>
    : {};

  const orientation = isOrientation(explicit.orientation) ? explicit.orientation
    : isOrientation(context.orientation) ? context.orientation : inferOrientation(input);
  const themeMode = isInfoTheme(explicit.theme) ? explicit.theme
    : isInfoTheme(context.themeMode) ? context.themeMode : 'light';
  const title = normalize(explicit.title) || deriveTitle(input);
  const summary = normalize(explicit.summary) || deriveSummary(input, title);
  const blocks = Array.isArray(explicit.blocks) && explicit.blocks.length > 0
    ? explicit.blocks : buildDefaultBlocks(title, input);

  return { title, summary, orientation, theme: themeMode, blocks };
}

function buildDefaultBlocks(title: string, input: string): InfographicBlock[] {
  const specifics = extractInputSpecifics(input);
  const statsItems = specifics.numbers.length > 0
    ? specifics.numbers.slice(0, 3).map(n => ({ label: `${title}相关`, value: n }))
    : [
      { label: `${title}覆盖范围`, value: '待补充' },
      { label: `${title}关键指标`, value: '待补充' },
      { label: `${title}实施周期`, value: '待补充' },
    ];

  const stepDescriptions = specifics.quotedTerms.length >= 3
    ? specifics.quotedTerms.slice(0, 3)
    : [`${title}的发展现状与背景`, `${title}的核心趋势与发现`, `基于${title}分析的行动建议`];

  return [
    {
      id: 'header', type: 'header', title,
      body: `${title}——以下数据和要点揭示了最值得关注的变化。`,
    },
    {
      id: 'stats', type: 'stats', title: `${title}关键数字`,
      stats: statsItems,
    },
    {
      id: 'steps', type: 'steps', title: `${title}核心要点`,
      steps: [
        { number: 1, title: '现状与背景', description: stepDescriptions[0] },
        { number: 2, title: '关键发现', description: stepDescriptions[1] },
        { number: 3, title: '行动建议', description: stepDescriptions[2] },
      ],
    },
    {
      id: 'conclusion', type: 'conclusion', title: '结论',
      body: specifics.dates.length > 0
        ? `${title}在${specifics.dates[0]}前后进入关键阶段，建议尽早布局。`
        : `${title}已进入规模化阶段，先行者正从试点转向全面落地。`,
    },
  ];
}

function stripPromptPrefix(text: string): string {
  const prefixPattern = /^(?:请|帮我|帮忙)?(?:设计|制作|做|画|生成|创建)\s*(?:一[张个份幅]|)\s*/;
  let stripped = text.replace(prefixPattern, '').trim();
  stripped = stripped.replace(/(?:的\s*)?(?:信息图|数据图|图解|一图读懂|可视化摘要|infographic)/gi, '').trim();
  // Remove leading punctuation left after prefix stripping
  stripped = stripped.replace(/^[，,、；;：:。.\s]+/, '').trim();
  return stripped || text;
}

function extractTopicFromInput(semantic: string): string {
  return semantic.split(/[，,]|(?:包含|包括|含)/)[0]?.trim() || semantic;
}

function deriveTitle(input: string): string {
  const compact = normalize(input);
  if (!compact) return '信息图';
  const semantic = stripPromptPrefix(compact);
  const topicPart = extractTopicFromInput(semantic);
  const sentences = topicPart.split(/[。！？.!?\n]+/).filter(Boolean);
  const firstSentence = sentences[0] || topicPart;
  if (firstSentence.includes('：') || firstSentence.includes(':')) {
    const parts = firstSentence.split(/[：:]/).filter(Boolean);
    const potentialTitle = parts[0]?.trim() || '';
    if (potentialTitle.length > 2 && potentialTitle.length < 25) {
      return potentialTitle.length > 30 ? `${potentialTitle.slice(0, 30)}…` : potentialTitle;
    }
  }
  return firstSentence.length > 30 ? `${firstSentence.slice(0, 30)}…` : firstSentence;
}

function deriveSummary(input: string, title: string): string {
  const fallback = `${title}的全景数据与核心结论。`;
  const compact = normalize(input);
  if (!compact || compact === title) return fallback;
  const semantic = stripPromptPrefix(compact);
  const topicPart = extractTopicFromInput(semantic);
  if (!topicPart || topicPart === title) return fallback;
  return `${topicPart}的关键数据、趋势洞察与行动建议。`;
}

function inferOrientation(input: string): InfographicOrientation {
  if (/horizontal|横向|横版|landscape/.test(input.toLowerCase())) return 'horizontal';
  return 'vertical';
}

function normalize(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const compact = value.replace(/\s+/g, ' ').trim();
  return compact || undefined;
}

function isOrientation(v: unknown): v is InfographicOrientation {
  return v === 'vertical' || v === 'horizontal';
}

function isInfoTheme(v: unknown): v is InfographicTheme {
  return v === 'light' || v === 'dark';
}

const infographicSkill = new InfographicSkill();

export default infographicSkill;
