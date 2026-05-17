import type { Artifact, ThemePack } from '../types.js';
import { buildArtifact } from '../execution/skill-executor.js';
import { BaseSkill } from './base-skill.js';
import { renderLandingHtml } from './landing-renderer.js';
import { extractInputSpecifics } from '../utils.js';
import type {
  LandingConfig,
  LandingFeatureItem,
  LandingFooterSection,
  LandingPricingSection,
  LandingSection,
  LandingSkillContext,
  LandingStyle,
  LandingTheme,
  LandingTestimonialsSection,
} from './landing-types.js';

export class LandingSkill extends BaseSkill<'landing-page', LandingSkillContext> {
  constructor() {
    super({
      name: 'landing-page',
      supportedTypes: ['landing-page'],
      description: 'Responsive landing page generation with hero, value sections, pricing, testimonials and CTA',
      triggerKeywords: [
        'landing page', 'landing', 'homepage', 'product page', 'one-pager',
        'landingpage', 'product landing', 'marketing page',
        '落地页', '着陆页', '官网首页', '产品页', '营销页', '单页介绍', '单页营销',
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
    const typedContext = this.toContext(context);
    const config = buildLandingConfig(input, typedContext as Record<string, unknown>);
    const html = renderLandingHtml(config, theme);

    return buildArtifact(
      String(typedContext.taskId ?? 'unknown'),
      'landing-page',
      html,
      1,
      {
        style: config.style,
        themeMode: config.theme,
        sections: config.sections.map(section => section.type),
        sectionCount: config.sections.length,
        qualityRules: this.getQualityRules(typedContext),
      },
    );
  }
}

function buildLandingConfig(input: string, context: Record<string, unknown>): LandingConfig {
  const explicit = (context.landingConfig && typeof context.landingConfig === 'object')
    ? context.landingConfig as Partial<LandingConfig>
    : {};

  const style = isLandingStyle(explicit.style) ? explicit.style : inferStyle(input);
  const theme = isLandingTheme(explicit.theme) ? explicit.theme : inferTheme(input, style);
  const title = normalizeText(explicit.title) || deriveTitle(input);
  const subtitle = normalizeText(explicit.subtitle) || deriveSubtitle(input, title);
  const sections = buildSections(title, subtitle, input, explicit.sections);

  return {
    title,
    subtitle,
    style,
    theme,
    sections,
    colors: explicit.colors,
  };
}

function buildSections(
  title: string,
  subtitle: string,
  input: string,
  sections: LandingConfig['sections'] | undefined,
): LandingSection[] {
  if (Array.isArray(sections) && sections.length > 0) {
    return sections.map(section => normalizeSection(section, title, subtitle));
  }

  return [
    {
      type: 'hero',
      eyebrow: inferEyebrow(input),
      title,
      subtitle,
      primaryAction: { label: buildPrimaryActionLabel(title), href: '#cta' },
      secondaryAction: { label: buildSecondaryActionLabel(title), href: '#features' },
      stats: buildHeroStats(title),
    },
    {
      type: 'features',
      title: '为什么选择我们',
      subtitle: '从效率、灵活性到数据洞察，每个环节都经过打磨。',
      items: buildDefaultFeatures(title, subtitle),
    },
    buildDefaultPricingSection(),
    buildDefaultTestimonialsSection(title, input),
    {
      type: 'cta',
      title: `了解 ${title}`,
      subtitle: `${title} 的核心亮点、适用场景和接入方式已经准备好。`,
      primaryAction: { label: `体验${shortTitle(title)}`, href: '#hero' },
    },
    buildDefaultFooterSection(title),
  ];
}

function normalizeSection(section: LandingSection, title: string, subtitle: string): LandingSection {
  switch (section.type) {
    case 'hero':
      return {
        ...section,
        title: normalizeText(section.title) || title,
        subtitle: normalizeText(section.subtitle) || subtitle,
      };
    case 'features':
      return {
        ...section,
        title: normalizeText(section.title) || '核心卖点',
        subtitle: normalizeText(section.subtitle) || subtitle,
        items: section.items?.length ? section.items.map(normalizeFeatureItem) : buildDefaultFeatures(title, subtitle),
      };
    case 'pricing':
      return {
        ...section,
        title: normalizeText(section.title) || '定价方案',
        subtitle: normalizeText(section.subtitle) || '不同阶段都能找到适合自己的入口。',
        tiers: section.tiers?.length ? section.tiers.map(tier => ({
          ...tier,
          description: normalizeText(tier.description),
          features: tier.features?.filter(Boolean) ?? [],
        })) : buildDefaultPricingSection().tiers,
      };
    case 'cta':
      return {
        ...section,
        title: normalizeText(section.title) || '准备开始了吗？',
        subtitle: normalizeText(section.subtitle) || '给用户一个明确动作，不让兴趣停在页面里。',
      };
    case 'testimonials':
      return {
        ...section,
        title: normalizeText(section.title) || '用户怎么评价这件事',
        subtitle: normalizeText(section.subtitle) || '用真实角色补强说服力。',
        items: section.items?.length ? section.items.map(item => ({
          ...item,
          role: normalizeText(item.role),
        })) : buildDefaultTestimonialsSection(title).items,
      };
    case 'footer':
      return {
        ...section,
        brand: normalizeText(section.brand) || title,
        note: normalizeText(section.note) || subtitle,
      };
    default:
      return section;
  }
}

function normalizeFeatureItem(item: LandingFeatureItem): LandingFeatureItem {
  return {
    ...item,
    icon: normalizeText(item.icon),
  };
}

function buildDefaultFeatures(title: string, _subtitle: string): LandingFeatureItem[] {
  return [
    {
      title: `${shortTitle(title)}快速上手`,
      description: `${title}开箱即用，最短路径完成配置，无需额外依赖。`,
      icon: '✦',
    },
    {
      title: `${shortTitle(title)}灵活扩展`,
      description: `${title}支持按需组合，满足从轻量到复杂的多种场景。`,
      icon: '▣',
    },
    {
      title: `${shortTitle(title)}持续优化`,
      description: `${title}内置分析能力，实时追踪关键指标，让每次迭代有据可依。`,
      icon: '→',
    },
  ];
}

function shortTitle(title: string): string {
  return title.length > 10 ? `${title.slice(0, 10)}…` : title;
}

function buildPrimaryActionLabel(title: string): string {
  return `了解${shortTitle(title)}`;
}

function buildSecondaryActionLabel(title: string): string {
  return `查看${shortTitle(title)}亮点`;
}

function buildHeroStats(title: string) {
  const short = shortTitle(title);
  return [
    { label: '核心主题', value: short },
    { label: '价值表达', value: `讲清${short}` },
    { label: '下一步', value: `体验${short}` },
  ];
}

function buildDefaultPricingSection(): LandingPricingSection {
  return {
    type: 'pricing',
    title: '选择适合你的方案',
    subtitle: '不同阶段都能找到适合自己的入口。',
    tiers: [
      {
        name: '基础版',
        price: '联系咨询',
        description: '满足核心需求，快速上手。',
        features: ['核心功能', '标准支持', '基础报表'],
        ctaLabel: '了解详情',
      },
      {
        name: '专业版',
        price: '联系咨询',
        description: '覆盖进阶场景，提升效率。',
        features: ['全部功能', '优先支持', '高级分析'],
        ctaLabel: '立即咨询',
        badge: '推荐',
        highlighted: true,
      },
      {
        name: '企业版',
        price: '联系咨询',
        description: '定制化部署，专属服务。',
        features: ['定制集成', '专属顾问', '私有部署'],
        ctaLabel: '联系咨询',
      },
    ],
  };
}

function buildDefaultTestimonialsSection(title: string, input = ''): LandingTestimonialsSection {
  const industry = inferIndustryLabel(input) || '科技企业';
  const specifics = extractInputSpecifics(input);
  const detail = specifics.quotedTerms.length > 0
    ? `，尤其在${specifics.quotedTerms[0]}方面`
    : '';
  return {
    type: 'testimonials',
    title: `谁在用 ${shortTitle(title)}`,
    subtitle: `来自${industry}团队的一线反馈。`,
    items: [
      {
        quote: `接入 ${title} 后${detail}，团队更快对齐重点，上线节奏也更稳。`,
        name: '技术负责人',
        role: industry,
      },
      {
        quote: `${title} 让日常沟通和推进动作更集中，决策效率明显提高。`,
        name: '运营负责人',
        role: industry,
      },
      {
        quote: `现在只看一页就能快速理解 ${title} 的核心价值和下一步动作。`,
        name: '业务负责人',
        role: industry,
      },
    ],
  };
}

function buildDefaultFooterSection(title: string): LandingFooterSection {
  return {
    type: 'footer',
    brand: title,
    note: '© 2026',
    links: [
      {
        title: '页面导航',
        links: [
          { label: '首屏', href: '#hero' },
          { label: '卖点', href: '#features' },
          { label: 'CTA', href: '#cta' },
        ],
      },
      {
        title: '下一步',
        links: [
          { label: '预约演示', href: '#cta' },
          { label: '获取方案', href: '#pricing' },
        ],
      },
    ],
  };
}

function stripPromptPrefix(text: string): string {
  const prefixPattern = /^(?:请|帮我|帮忙)?(?:设计|制作|做|画|生成|创建)\s*(?:一[张个份幅]|)\s*/;
  let stripped = text.replace(prefixPattern, '').trim();
  stripped = stripped.replace(/(?:的\s*)?(?:落地页|着陆页|landing\s*page|首页|主页)/gi, '').trim();
  return stripped || text;
}

function extractProductName(input: string): string | undefined {
  // Match patterns like "产品叫 X", "叫做 X", "叫 X", "名叫 X", "名为 X"
  const namePatterns = [
    /(?:产品|项目|平台|工具|系统|应用|App|app)\s*(?:叫做?|名[叫为]|名称[是为]|是)\s*([A-Za-z0-9\u4e00-\u9fff][A-Za-z0-9\u4e00-\u9fff\s-]*)/,
    /(?:叫做?|名[叫为])\s*([A-Za-z0-9\u4e00-\u9fff][A-Za-z0-9\u4e00-\u9fff\s-]*)/,
  ];
  for (const pattern of namePatterns) {
    const match = input.match(pattern);
    if (match?.[1]) {
      // Trim trailing punctuation and common suffixes
      return match[1].replace(/[，,。.！!？?、\s]+$/, '').trim();
    }
  }
  return undefined;
}

function extractTopicFromInput(semantic: string): string {
  return semantic.split(/[，,]|(?:包含|包括|含)/)[0]?.trim() || semantic;
}

function deriveTitle(input: string): string {
  const compact = normalizeText(input) || '产品 Landing Page';
  // First try to extract an explicit product name
  const productName = extractProductName(compact);
  if (productName) return productName;
  const semantic = stripPromptPrefix(compact);
  const topicPart = extractTopicFromInput(semantic);
  const candidate = topicPart
    .split(/[\n:：|｜]/)
    .map(part => part.trim())
    .filter(Boolean)[0] ?? compact;
  return candidate.length > 38 ? `${candidate.slice(0, 38)}…` : candidate;
}

function deriveSubtitle(input: string, title: string): string {
  const compact = normalizeText(input);
  if (!compact) return `${title}——把核心价值和行动入口收束到一页里。`;
  const semantic = stripPromptPrefix(compact);
  if (semantic === title || !semantic) return `${title}——把核心价值和行动入口收束到一页里。`;
  const topicPart = extractTopicFromInput(semantic);
  if (!topicPart || topicPart === title) return `${title}——把核心价值和行动入口收束到一页里。`;
  return `围绕${topicPart}，把核心价值和行动入口收束到一页里。`;
}

function inferIndustryLabel(input: string): string {
  const lower = input.toLowerCase();
  const candidates: Array<[RegExp, string]> = [
    [/ai|人工智能|智能/, 'AI 行业'],
    [/saas|软件|平台|企业服务/, '企业服务'],
    [/ecommerce|电商|零售|shop|store/, '电商行业'],
    [/edu|教育|培训|学习/, '教育行业'],
    [/medical|医疗|健康|health/, '医疗行业'],
    [/finance|金融|银行|保险/, '金融行业'],
    [/manufacturing|制造|工业|factory/, '制造行业'],
    [/media|内容|品牌|marketing|market/, '品牌行业'],
  ];
  for (const [pattern, label] of candidates) {
    if (pattern.test(lower)) return label;
  }
  return '';
}

function inferEyebrow(input: string): string {
  return inferIndustryLabel(input);
}

function inferStyle(input: string): LandingStyle {
  const lower = input.toLowerCase();
  if (/corporate|enterprise|专业|商务|正式/.test(lower)) return 'corporate';
  if (/creative|大胆|创意|潮流|品牌感/.test(lower)) return 'creative';
  if (/saas|software|dashboard|平台|订阅/.test(lower)) return 'saas';
  if (/portfolio|作品集|个人站|个人主页|简历|展示/.test(lower)) return 'portfolio';
  if (/event|活动|报名|会议|峰会|conference|meetup|沿龙/.test(lower)) return 'event';
  return 'startup';
}

function inferTheme(input: string, style: LandingStyle): LandingTheme {
  const lower = input.toLowerCase();
  if (/light|浅色|明亮|白底/.test(lower)) return 'light';
  if (/dark|深色|暗黑|夜间|黑底/.test(lower)) return 'dark';
  const lightStyles: LandingStyle[] = ['corporate', 'portfolio'];
  return lightStyles.includes(style) ? 'light' : 'dark';
}

function normalizeText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const compact = value.replace(/\s+/g, ' ').trim();
  return compact || undefined;
}

function isLandingStyle(value: unknown): value is LandingStyle {
  return value === 'startup' || value === 'corporate' || value === 'creative' || value === 'saas'
    || value === 'portfolio' || value === 'event';
}

function isLandingTheme(value: unknown): value is LandingTheme {
  return value === 'light' || value === 'dark';
}

const landingSkill = new LandingSkill();

export default landingSkill;
