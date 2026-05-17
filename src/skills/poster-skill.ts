import type { Artifact, ThemePack } from '../types.js';
import { buildArtifact } from '../execution/skill-executor.js';
import { BaseSkill } from './base-skill.js';
import { renderPosterHtml } from './poster-renderer.js';
import { extractInputSpecifics } from '../utils.js';
import type { PosterConfig, PosterSize, PosterStyle, PosterTheme } from './poster-types.js';

export class PosterSkill extends BaseSkill<'poster'> {
  constructor() {
    super({
      name: 'poster',
      supportedTypes: ['poster'],
      description: 'Poster and promotional visual generation with pure HTML/CSS layouts for campaigns, social media and banners',
      triggerKeywords: [
        'poster', 'poster design', 'promo visual', 'promotional image', 'banner', 'flyer',
        '海报', '宣传图', '社交媒体图', '社媒图', '活动海报', '封面图', '横幅',
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
    const config = buildPosterConfig(input, typedContext as Record<string, unknown>);
    const html = renderPosterHtml(config, theme);

    return buildArtifact(
      String(typedContext.taskId ?? 'unknown'),
      'poster',
      html,
      1,
      {
        style: config.style,
        size: config.size,
        themeMode: config.theme,
        hasBackgroundImage: Boolean(config.backgroundImage),
        qualityRules: this.getQualityRules(typedContext),
      },
    );
  }
}

function buildPosterConfig(input: string, context: Record<string, unknown>): PosterConfig {
  const explicit = (context.posterConfig && typeof context.posterConfig === 'object')
    ? context.posterConfig as Partial<PosterConfig>
    : {};

  const title = normalizeText(explicit.title) || deriveTitle(input);
  const subtitle = normalizeText(explicit.subtitle) || deriveSubtitle(input, title);
  const body = normalizeText(explicit.body) || deriveBody(input, title);
  const style = isPosterStyle(explicit.style) ? explicit.style : inferStyle(input);
  const size = isPosterSize(explicit.size) ? explicit.size : inferSize(input);
  const theme = isPosterTheme(explicit.theme) ? explicit.theme : inferTheme(input, style);

  return {
    title,
    subtitle,
    body,
    style,
    size,
    theme,
    colors: explicit.colors,
    backgroundImage: normalizeText(explicit.backgroundImage),
  };
}

function deriveTitle(input: string): string {
  const compact = normalizeText(input);
  if (!compact) return '活动海报';
  const sentences = compact.split(/[。！？.!?\n]+/).filter(Boolean);
  const firstSentence = sentences[0] || compact;
  const titleMatch = firstSentence.match(/主题[是为是：:]\s*["「『]?([^"」』,\n，。！？]+)["」』]?/);
  if (titleMatch && titleMatch[1]) {
    const title = titleMatch[1].trim();
    return title.length > 34 ? `${title.slice(0, 34)}…` : title;
  }
  const keywords: [string, string][] = [
    ['发布会', '新品发布会'],
    ['音乐会', '音乐会'],
    ['演唱会', '演唱会'],
    ['讲座', '专题讲座'],
    ['培训', '技能培训'],
    ['促销', '促销活动'],
    ['招聘', '招聘启事'],
    ['婚礼', '婚礼请柬'],
    ['典礼', '开业典礼'],
    ['峰会', '行业峰会'],
    ['展览', '主题展览'],
  ];
  for (const [kw, label] of keywords) {
    if (firstSentence.includes(kw)) {
      const topicMatch = firstSentence.match(/["「『]([^"」』]+)["」』]/);
      if (topicMatch && topicMatch[1]) {
        return `${topicMatch[1]} - ${label}`;
      }
      // Preserve user's original text if it's more specific than the generic label
      if (firstSentence.length > kw.length + 1 && firstSentence.length <= 34) {
        return firstSentence;
      }
      return label;
    }
  }
  return firstSentence.length > 34 ? `${firstSentence.slice(0, 34)}…` : firstSentence;
}

function deriveSubtitle(input: string, title: string): string {
  const compact = normalizeText(input);
  if (!compact) return buildSubtitleFromTitle(title);
  const semantic = stripPromptPrefix(compact);
  let cleaned = semantic;
  // Remove the title portion so subtitle doesn't repeat it
  if (cleaned.includes(title)) {
    cleaned = cleaned.replace(title, '').trim();
  }
  // Remove leading punctuation
  cleaned = cleaned.replace(/^[，,、：:；;]+/, '').trim();
  if (!cleaned || cleaned.length < 3) {
    return buildSubtitleFromTitle(title);
  }
  // If what remains still looks like a raw prompt, generate from title
  if (looksLikePrompt(cleaned)) {
    return buildSubtitleFromTitle(title);
  }
  const sentences = cleaned.split(/[。！？.!?\\n]+/).filter(Boolean);
  const meaningful = sentences.find(s => s.length > 5) || sentences[0] || cleaned;
  return meaningful.length > 88 ? `${meaningful.slice(0, 88)}…` : meaningful;
}

function deriveBody(input: string, title: string): string {
  const compact = normalizeText(input);
  if (!compact) {
    return buildBodyFromTitle(title);
  }

  const semantic = stripPromptPrefix(compact);
  if (!semantic || semantic === title || looksLikePrompt(semantic)) {
    return buildBodyWithSpecifics(title, compact);
  }

  let cleaned = semantic.includes(title) ? semantic.replace(title, '').trim() : semantic;
  cleaned = cleaned.replace(/^[，,、：:；;]+/, '').trim();

  if (!cleaned || cleaned.length < 5 || looksLikePrompt(cleaned)) {
    return buildBodyWithSpecifics(title, compact);
  }

  const sentences = cleaned.split(/[。！？.!?\n]+/).filter(Boolean);
  const firstFew = sentences.slice(0, 2).join('。');
  return firstFew.length > 280 ? `${firstFew.slice(0, 280)}…` : (firstFew || cleaned.slice(0, 280));
}

function buildBodyWithSpecifics(title: string, input: string): string {
  const specifics = extractInputSpecifics(input);
  const parts: string[] = [];
  parts.push(buildBodyFromTitle(title));
  if (specifics.dates.length > 0) parts.push(`时间：${specifics.dates.join('、')}。`);
  if (specifics.locations.length > 0) parts.push(`地点：${specifics.locations.join('、')}。`);
  if (specifics.numbers.length > 0) parts.push(`${specifics.numbers.join(' | ')}。`);
  return parts.join(' ');
}

/** Strip prompt-style prefixes, artifact type references, and theme markers */
function stripPromptPrefix(text: string): string {
  // Step 1: Remove leading verb prefix ("设计一张", "帮我制作一份", etc.)
  const prefixPattern = /^(?:请|帮我|帮忙)?(?:设计|制作|做|画|生成|创建)\s*(?:一[张个份幅]|)\s*/;
  let stripped = text.replace(prefixPattern, '').trim();
  // Step 2: Remove artifact type references from ANYWHERE (not just end)
  stripped = stripped.replace(/(?:的\s*)?(?:宣传海报|活动海报|海报|宣传图|封面图|横幅|banner|flyer|传单|招贴)/gi, '').trim();
  // Step 3: Remove "主题是X" / "主题为X" pattern (theme is extracted separately by deriveTitle)
  stripped = stripped.replace(/[，,]?\s*主题[是为是：:]\s*["\"「『]?[^"\"」』,\n，。！？]*["\"」』]?/g, '').trim();
  // Step 4: Clean up orphaned punctuation
  stripped = stripped.replace(/^[，,、：:；;\s]+/, '').replace(/[，,、：:；;\s]+$/, '').trim();
  return stripped || text;
}

/** Detect if text still looks like a raw user prompt rather than display content */
function looksLikePrompt(text: string): boolean {
  return /^(?:请|帮我|帮忙)?(?:设计|制作|做|画|生成|创建)\s*(?:一[张个份幅]|)/.test(text);
}

function buildSubtitleFromTitle(title: string): string {
  const subtitleMap: [RegExp, string][] = [
    [/发布会|新品/, '探索前沿科技，见证创新时刻'],
    [/音乐|演唱|concert/i, '沉浸音乐盛宴，感受律动魅力'],
    [/讲座|培训|教育/, '知识分享，启迪思维'],
    [/促销|优惠|打折/, '限时特惠，不容错过'],
    [/招聘|hiring/i, '加入我们，共创未来'],
    [/婚礼|婚庆/, '执子之手，共赴美好'],
    [/峰会|大会|论坛/, '汇聚行业精英，共话发展趋势'],
    [/AI|人工智能|智能/, '探索智能边界，引领技术变革'],
    [/展览|展会/, '精彩展品，等你发现'],
  ];
  for (const [pattern, sub] of subtitleMap) {
    if (pattern.test(title)) return sub;
  }
  return `${title}，敬请关注。`;
}

function buildBodyFromTitle(title: string): string {
  const bodyMap: [RegExp, string][] = [
    [/发布会|新品/, `${title}即将盛大开启。汇聚行业领袖与技术先锋，共同见证突破性创新成果。`],
    [/音乐|演唱|concert/i, `${title}诚邀您的参与。顶级阵容倾情演绎，带来一场视听盛宴。`],
    [/讲座|培训|教育/, `${title}火热报名中。资深专家深度分享，助力您的专业成长。`],
    [/促销|优惠|打折/, `${title}限时开启。精选好物超值优惠，先到先得。`],
    [/招聘|hiring/i, `${title}期待优秀的你。丰厚待遇与广阔发展空间，与我们一起创造价值。`],
    [/婚礼|婚庆/, `诚挚邀请您出席${title}。共同见证这美好而珍贵的时刻。`],
    [/峰会|大会|论坛/, `${title}即将启幕。行业顶尖专家齐聚一堂，分享前沿洞察与实践经验。`],
    [/AI|人工智能|智能/, `${title}诚邀您的参与。探索人工智能最新突破，洞见智能化未来趋势。`],
    [/展览|展会/, `${title}精彩呈现。汇集优秀作品与创新成果，带来沉浸式观展体验。`],
  ];
  for (const [pattern, body] of bodyMap) {
    if (pattern.test(title)) return body;
  }
  return `${title}相关信息正在持续更新，欢迎了解核心看点与参与方式。`;
}

function inferStyle(input: string): PosterStyle {
  const lower = input.toLowerCase();
  if (/tech|科技|发布会|product\s*launch|新品发布|ai|数码/.test(lower)) return 'tech-launch';
  if (/music|音乐|音乐节|festival|演唱会|concert|dj/.test(lower)) return 'music-fest';
  if (/edu|教育|讲座|lecture|培训|workshop|课程|seminar/.test(lower)) return 'edu-lecture';
  if (/ecommerce|电商|促销|sale|打折|优惠|双十一|618|黑五/.test(lower)) return 'ecommerce';
  if (/recruit|招聘|hiring|join\s*us|人才|校招|社招/.test(lower)) return 'recruitment';
  if (/wedding|婚礼|婚庆|喜帖|请柬|invitation/.test(lower)) return 'wedding';
  if (/classic|典雅|复古|杂志|海报感/.test(lower)) return 'classic';
  if (/minimal|极简|简洁|留白/.test(lower)) return 'minimal';
  if (/bold|强烈|炸裂|醒目|高冲击/.test(lower)) return 'bold';
  return 'modern';
}

function inferSize(input: string): PosterSize {
  const lower = input.toLowerCase();
  if (/a4|打印|print|海报纸/.test(lower)) return 'A4';
  if (/portrait|竖版|手机海报|手机屏|9:16|9：16/.test(lower)) return 'portrait';
  if (/landscape|横版|社交媒体封面|16:9|16：9|封面图/.test(lower)) return 'landscape';
  if (/banner|横幅|公众号封面|1200|628/.test(lower)) return 'banner';
  if (/square|800x800|方图/.test(lower)) return 'square';
  return 'social';
}

function inferTheme(input: string, style: PosterStyle): PosterTheme {
  const lower = input.toLowerCase();
  if (/light|浅色|明亮|白底/.test(lower)) return 'light';
  if (/dark|暗黑|深色|夜间|黑底/.test(lower)) return 'dark';
  const lightStyles: PosterStyle[] = ['classic', 'minimal', 'edu-lecture', 'wedding'];
  return lightStyles.includes(style) ? 'light' : 'dark';
}

function normalizeText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const compact = value.replace(/\s+/g, ' ').trim();
  return compact || undefined;
}

function isPosterStyle(value: unknown): value is PosterStyle {
  return value === 'modern' || value === 'classic' || value === 'minimal' || value === 'bold'
    || value === 'tech-launch' || value === 'music-fest' || value === 'edu-lecture'
    || value === 'ecommerce' || value === 'recruitment' || value === 'wedding';
}

function isPosterSize(value: unknown): value is PosterSize {
  return value === 'A4' || value === 'social' || value === 'banner' || value === 'square'
    || value === 'portrait' || value === 'landscape';
}

function isPosterTheme(value: unknown): value is PosterTheme {
  return value === 'light' || value === 'dark';
}

const posterSkill = new PosterSkill();

export default posterSkill;
