// SlidesSkill - generates HTML slide decks with 5+ semantic slides

import type { DesignSkill, SkillContract, Artifact, ThemePack } from '../types.js';
import { buildArtifact } from './skill-executor.js';
import { escapeHtml, extractInputSpecifics, type InputSpecifics } from '../utils.js';

/** Slide type for semantic markup and export mapping */
type SlideType = 'title' | 'toc' | 'content' | 'comparison' | 'chart' | 'summary';

interface SlideSpec {
  title: string;
  bullets: string[];
  type: SlideType;
  /** Left/right items for comparison slides */
  comparison?: { leftLabel: string; rightLabel: string; leftItems: string[]; rightItems: string[] };
  /** Data points for chart slides */
  chartData?: Array<{ label: string; value: number }>;
}

const INSTRUCTION_PATTERNS = [
  /^(请|帮我|帮忙|麻烦|需要|想要|我要|给我|替我)/iu,
  /^(做一份|做个|做一套|生成一份|生成一个|制作一份|制作一个|写一份|整理一份|准备一份)/iu,
  /^(create|make|build|generate|design)\s+/iu,
  /(的\s*)?(演示文稿|幻灯片|简报|汇报稿|PPT|ppt|slides|slide deck|deck|presentation)$/iu,
  /(包含|需要|一共|共)\s*\d+\s*(页|slides?)$/iu,
  /(^|[\s,,。;;])(\d+\s*(页|slides?))/iu,
];

interface ParsedPresentation {
  topic: string;
  sections: string[];
}

function parsePresentation(input: string): ParsedPresentation {
  let text = input.trim()
    .replace(/["""']/g, '')
    .replace(/\s+/g, ' ');

  // Extract user-specified sections from "包含/包括 A、B、C" before stripping
  const sections: string[] = [];
  const sectionMatch = text.match(/[，,]?\s*(?:包含|包括|需要|涵盖|覆盖)\s*(.+)$/iu);
  if (sectionMatch) {
    const raw = sectionMatch[1]
      .replace(/(的\s*)?(演示文稿|幻灯片|简报|汇报稿|PPT|ppt|slides|slide deck|deck|presentation)\s*$/giu, '')
      .trim();
    const parts = raw.split(/[、，,;；和与及]/).map(s => s.trim()).filter(Boolean);
    // Filter out page count patterns like "5 页" or "10 slides"
    const validSections = parts.filter(p => !/^\d+\s*(页|slides?|pages?)$/i.test(p));
    sections.push(...validSections);
  }

  // Extract topic by stripping instruction prefixes and section suffixes
  let topic = text
    .replace(/[：:]/g, ' ')
    .replace(/[，。？！、；;（）()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  for (const pattern of INSTRUCTION_PATTERNS) {
    topic = topic.replace(pattern, ' ').replace(/\s+/g, ' ').trim();
  }

  topic = topic
    .replace(/^(介绍|分析|汇报|展示|说明)\s*/giu, '')
    .replace(/\b(关于|有关|围绕|主题是|主题为|topic|about|on)\b/giu, ' ')
    .replace(/(^|[\s，,])(关于|有关|围绕|主题是|主题为)/giu, ' ')
    .replace(/[，,]?\s*(包含|包括|需要|涵盖|覆盖).*$/giu, '')
    .replace(/(的\s*)?(演示文稿|幻灯片|简报|汇报稿|PPT|ppt|slides|slide deck|deck|presentation)\s*$/giu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!topic) topic = '演示主题';

  return { topic, sections };
}

function buildSlideOutline(topic: string, sections: string[], input: string): SlideSpec[] {
  // If user specified sections, build slides around those
  if (sections.length > 0) {
    const specifics = extractInputSpecifics(input);
    const slides: SlideSpec[] = [
      {
        title: topic,
        type: 'title',
        bullets: [
          `本次${topic}涵盖以下核心内容：${sections.join('、')}。`,
          specifics.numbers.length > 0
            ? `关键数据参考：${specifics.numbers.join('、')}。`
            : `每个板块将从现状、关键发现和下一步行动三个维度展开。`,
          specifics.dates.length > 0
            ? `时间节点：${specifics.dates.join('、')}。`
            : `重点关注可量化的成果和待解决的问题。`,
          `最终目标是对齐团队认知，明确后续优先级。`,
        ],
      },
    ];

    // TOC page when total slides will be >= 5
    if (sections.length >= 3) {
      slides.push(buildTocSlide(sections));
    }

    for (const section of sections) {
      slides.push({
        title: section,
        type: 'content',
        bullets: [
          `${section}——作为${topic}的核心板块之一，以下为要点梳理。`,
          `${section}的当前状态与阶段性进展。`,
          `${section}面临的主要挑战和待解决问题。`,
          `${section}的下一步行动建议和优先级排列。`,
        ],
      });
    }

    // Insert comparison slide if input contains comparison keywords
    const comparisonSlide = tryBuildComparisonSlide(input, sections);
    if (comparisonSlide) slides.splice(slides.length, 0, comparisonSlide);

    // Insert chart slide if input contains numeric data
    const chartSlide = tryBuildChartSlide(input, specifics);
    if (chartSlide) slides.splice(slides.length, 0, chartSlide);

    slides.push({
      title: '总结与展望',
      type: 'summary',
      bullets: [
        `${topic}涵盖 ${sections.length} 个核心板块：${sections.join('、')}。`,
        `各板块的进展和待办事项已在前述页面中梳理。`,
        `下一阶段建议聚焦优先级最高的板块，集中资源推进。`,
        `期待在后续讨论中对齐具体行动计划和时间节点。`,
      ],
    });

    return slides;
  }

  // Default outline: use extracted specifics from user input
  const specifics = extractInputSpecifics(input);
  const contextLine = [
    ...specifics.numbers.map(n => `数据参考：${n}`),
    ...specifics.dates.map(d => `时间节点：${d}`),
    ...specifics.locations.map(l => `地点：${l}`),
  ].join('；');

  const detailBullet = contextLine
    ? `关键信息：${contextLine}。`
    : `本次分享围绕「${topic}」展开，以下为结构化梳理。`;

  const defaultSlides: SlideSpec[] = [
    {
      title: topic,
      type: 'title',
      bullets: [
        `${topic}——本次演示的核心主题，以下从背景、要点、应用和展望四个维度展开。`,
        detailBullet,
        `目标：帮助听众快速理解${topic}的现状与下一步方向。`,
        specifics.quotedTerms.length > 0
          ? `涉及关键概念：${specifics.quotedTerms.join('、')}。`
          : `建议在正式演示时补充具体案例和数据支撑。`,
      ],
    },
    {
      title: `${topic}：背景与现状`,
      type: 'content',
      bullets: [
        `${topic}的讨论背景：为什么现在需要关注这个方向。`,
        `当前阶段的核心特征：${topic}正处于从认知到实践的转化期。`,
        specifics.numbers.length > 0
          ? `参考数据：${specifics.numbers.join('、')}。`
          : `建议补充行业数据或内部指标来量化当前状态。`,
        `需要回答的关键问题：${topic}的边界在哪里，优先级如何排列。`,
      ],
    },
    {
      title: `${topic}：核心要点`,
      type: 'content',
      bullets: [
        `要点一：${topic}的核心价值主张——解决什么问题、服务什么场景。`,
        `要点二：实现路径与关键依赖——需要哪些条件才能落地。`,
        `要点三：与现有方案的差异——${topic}相比替代方案的独特优势。`,
        specifics.keyPhrases.length > 0
          ? `相关领域：${specifics.keyPhrases.join('、')}。`
          : `要点四：风险与约束——推进过程中需要注意的限制条件。`,
      ],
    },
    {
      title: `${topic}：应用与案例`,
      type: 'content',
      bullets: [
        `场景一：${topic}在日常工作流中的典型应用方式。`,
        `场景二：${topic}在关键决策环节的辅助作用。`,
        `场景三：${topic}在跨团队协作中的价值体现。`,
        `每个场景建议配合具体案例和效果数据来增强说服力。`,
      ],
    },
    {
      title: `${topic}：总结与下一步`,
      type: 'summary',
      bullets: [
        `核心结论：${topic}的价值已经明确，关键在于选择正确的切入点。`,
        `下一步行动：明确优先级、分配资源、设定验收标准。`,
        specifics.dates.length > 0
          ? `时间节点：${specifics.dates.join('、')}。`
          : `建议设定明确的时间节点和里程碑。`,
        `期待反馈：哪些方向需要深入、哪些假设需要验证。`,
      ],
    },
  ];

  // Insert TOC when >= 5 slides
  if (defaultSlides.length >= 5) {
    const sectionTitles = defaultSlides.slice(1, -1).map(s => s.title);
    defaultSlides.splice(1, 0, buildTocSlide(sectionTitles));
  }

  // Insert comparison slide if input contains comparison keywords
  const compSlide = tryBuildComparisonSlide(input, []);
  if (compSlide) defaultSlides.splice(defaultSlides.length - 1, 0, compSlide);

  // Insert chart slide if input contains numeric data
  const chSlide = tryBuildChartSlide(input, specifics);
  if (chSlide) defaultSlides.splice(defaultSlides.length - 1, 0, chSlide);

  return defaultSlides;
}

/** Build a table-of-contents slide listing section titles */
function buildTocSlide(sectionTitles: string[]): SlideSpec {
  return {
    title: '目录',
    type: 'toc',
    bullets: sectionTitles,
  };
}

/** Build a comparison slide if input contains comparison keywords */
function tryBuildComparisonSlide(input: string, _sections: string[]): SlideSpec | null {
  const compKeywords = /(?:vs|VS|对比|比较|优劣|差异|区别|不同)/;
  if (!compKeywords.test(input)) return null;

  const parts = input.split(compKeywords);
  const leftRaw = parts[0]?.replace(/.*(?:包含|包括|需要|涵盖)/, '').trim() || '方案A';
  const rightRaw = parts[1]?.replace(/(?:的|，|。|,|\.).*$/, '').trim() || '方案B';

  const leftLabel = leftRaw.slice(0, 20) || '方案A';
  const rightLabel = rightRaw.slice(0, 20) || '方案B';

  return {
    title: `${leftLabel} vs ${rightLabel}`,
    type: 'comparison',
    bullets: [],
    comparison: {
      leftLabel,
      rightLabel,
      leftItems: [`${leftLabel}的核心优势`, `${leftLabel}的适用场景`, `${leftLabel}的局限性`],
      rightItems: [`${rightLabel}的核心优势`, `${rightLabel}的适用场景`, `${rightLabel}的局限性`],
    },
  };
}

/** Build a chart slide if input contains numeric data */
function tryBuildChartSlide(input: string, specifics: InputSpecifics): SlideSpec | null {
  if (specifics.numbers.length < 2) return null;

  const data = specifics.numbers.slice(0, 6).map((n, i) => ({
    label: `指标${i + 1}`,
    value: parseFloat(n.replace(/[^0-9.]/g, '')) || (i + 1) * 10,
  }));

  return {
    title: '关键数据',
    type: 'chart',
    bullets: [],
    chartData: data,
  };
}

/** Render an inline SVG bar chart from data points */
function renderChartSvg(data: Array<{ label: string; value: number }>): string {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const barWidth = 60;
  const gap = 24;
  const chartHeight = 280;
  const chartWidth = data.length * (barWidth + gap) + gap;
  const bars = data.map((d, i) => {
    const barH = (d.value / maxVal) * (chartHeight - 40);
    const x = gap + i * (barWidth + gap);
    const y = chartHeight - barH - 30;
    return `<rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" rx="4" fill="var(--cd-color-primary, #1a73e8)" opacity="0.85"/>
    <text x="${x + barWidth / 2}" y="${chartHeight - 10}" text-anchor="middle" font-size="12" fill="currentColor">${escapeHtml(d.label)}</text>
    <text x="${x + barWidth / 2}" y="${y - 6}" text-anchor="middle" font-size="12" fill="currentColor">${d.value}</text>`;
  }).join('\n  ');

  return `<svg width="${chartWidth}" height="${chartHeight}" viewBox="0 0 ${chartWidth} ${chartHeight}" role="img" aria-label="数据图表">
  ${bars}
</svg>`;
}

function renderSlide(slide: SlideSpec, index: number): string {
  const typeAttr = slide.type;
  const indexAttr = index + 1;

  if (slide.type === 'toc') {
    const items = slide.bullets
      .map((b, i) => `    <li><span class="toc-num">${i + 1}</span>${escapeHtml(b)}</li>`)
      .join('\n');
    return `<section class="slide" data-slide-type="${typeAttr}" data-slide-index="${indexAttr}">
  <div class="slide-inner">
    <h1>${escapeHtml(slide.title)}</h1>
    <ol class="toc-list">
${items}
    </ol>
  </div>
</section>`;
  }

  if (slide.type === 'comparison' && slide.comparison) {
    const c = slide.comparison;
    const leftItems = c.leftItems.map(i => `      <li>${escapeHtml(i)}</li>`).join('\n');
    const rightItems = c.rightItems.map(i => `      <li>${escapeHtml(i)}</li>`).join('\n');
    return `<section class="slide" data-slide-type="${typeAttr}" data-slide-index="${indexAttr}">
  <div class="slide-inner">
    <h1>${escapeHtml(slide.title)}</h1>
    <div class="comparison-grid">
      <div class="comparison-col">
        <h2>${escapeHtml(c.leftLabel)}</h2>
        <ul>
${leftItems}
        </ul>
      </div>
      <div class="comparison-col">
        <h2>${escapeHtml(c.rightLabel)}</h2>
        <ul>
${rightItems}
        </ul>
      </div>
    </div>
  </div>
</section>`;
  }

  if (slide.type === 'chart' && slide.chartData) {
    const svg = renderChartSvg(slide.chartData);
    return `<section class="slide" data-slide-type="${typeAttr}" data-slide-index="${indexAttr}">
  <div class="slide-inner">
    <h1>${escapeHtml(slide.title)}</h1>
    <div class="chart-container">${svg}</div>
  </div>
</section>`;
  }

  const bulletItems = slide.bullets
    .map((bullet) => `    <li>${escapeHtml(bullet)}</li>`)
    .join('\n');

  return `<section class="slide" data-slide-type="${typeAttr}" data-slide-index="${indexAttr}">
  <div class="slide-inner">
    <h1>${escapeHtml(slide.title)}</h1>
    <ul>
${bulletItems}
    </ul>
  </div>
</section>`;
}

/** Dual-mode navigation: scroll (default) + paginated, with print and noscript fallbacks */
const NAVIGATION_SCRIPT = `<style>
  body.mode-scroll .slide {
    display: block;
    width: 960px;
    max-width: 100%;
    margin: 24px auto;
  }
  body.mode-paginated .slide {
    display: none;
    width: 100vw;
    height: 100vh;
    max-width: 960px;
    max-height: 540px;
    margin: auto;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  body.mode-paginated .slide.active { display: block; }
  @media print {
    .slide {
      display: block !important;
      position: static !important;
      transform: none !important;
      width: 100% !important;
      height: auto !important;
      margin: 0 !important;
      page-break-after: always;
    }
    .slide:last-child { page-break-after: avoid; }
    #slide-indicator, #mode-toggle { display: none !important; }
  }
</style>
<noscript>
  <style>
    .slide { display: block !important; position: static !important; transform: none !important; width: 960px; max-width: 100%; margin: 24px auto; }
    #slide-indicator, #mode-toggle { display: none !important; }
  </style>
</noscript>
<script>
(function() {
  var viewMode = '{{VIEW_MODE}}';
  var slides = document.querySelectorAll('.slide');
  var current = 0;
  function setMode(mode) {
    viewMode = mode;
    document.body.className = 'mode-' + mode;
    if (mode === 'paginated') { showSlide(current); }
    updateToggle();
  }
  function showSlide(index) {
    slides.forEach(function(s, i) { s.classList.toggle('active', i === index); });
    updateIndicator();
  }
  function updateIndicator() {
    var el = document.getElementById('slide-indicator');
    if (el) el.textContent = viewMode === 'paginated' ? (current + 1) + ' / ' + slides.length : '';
  }
  function updateToggle() {
    var btn = document.getElementById('mode-toggle');
    if (btn) btn.textContent = viewMode === 'scroll' ? '切换翻页' : '切换滚动';
  }
  function next() { if (current < slides.length - 1) { current++; showSlide(current); } }
  function prev() { if (current > 0) { current--; showSlide(current); } }
  document.addEventListener('keydown', function(e) {
    if (viewMode !== 'paginated') return;
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
  });
  document.addEventListener('click', function(e) {
    if (viewMode !== 'paginated') return;
    if (e.target.id === 'mode-toggle') return;
    var x = e.clientX / window.innerWidth;
    if (x > 0.6) next();
    else if (x < 0.4) prev();
  });
  var toggle = document.createElement('button');
  toggle.id = 'mode-toggle';
  toggle.style.cssText = 'position:fixed;bottom:16px;left:24px;padding:6px 12px;font-size:13px;cursor:pointer;z-index:999;border:1px solid #ccc;border-radius:4px;background:#fff;';
  toggle.addEventListener('click', function() { setMode(viewMode === 'scroll' ? 'paginated' : 'scroll'); });
  document.body.appendChild(toggle);
  setMode(viewMode);
})();
</script>
<div id="slide-indicator" style="position:fixed;bottom:16px;right:24px;font-size:14px;color:#666;z-index:999;"></div>`;

export class SlidesSkill implements DesignSkill {
  readonly contract: SkillContract = {
    name: 'slides',
    artifactType: 'slides',
    description: 'Default presentation/slides skill via html-ppt-skill (36 themes × 31 layouts × 20 FX). Handles all generic PPT/slides/deck/presentation requests. PPTX export intents currently route here as an HTML-first placeholder; editable anthropic-pptx handoff is TODO. For .pptx file editing use anthropic-pptx; for AI image-based visual decks use lovstudio-any2deck.',
    triggerKeywords: [
      'presentation', 'ppt', 'slides', 'deck', 'keynote', 'slideshow',
      '演示文稿', '幻灯片', '演讲稿', '分享稿', 'pitch deck',
      'convert to .pptx', 'convert to pptx', 'export pptx', 'export as pptx', 'save as pptx',
      '导出PPT', '导出pptx', '转换为PPT', '转换为pptx', '生成PPT文件', '生成pptx', 'pptx格式',
      '下载ppt', '下载PPT', '导出演示文稿', '保存为pptx', '保存为PPT',
    ],
    capabilities: [
      'HTML static presentations with 36 themes, 31 layouts, 20 canvas FX',
      'Keyboard navigation runtime',
      'Headless Chrome PNG export',
      'Zero external API dependencies',
      'PPTX export intent placeholder routed to slides until anthropic-pptx integration lands',
    ],
    examplePrompts: [
      '做一份 PPT',
      'Create a presentation about AI',
      '帮我做个技术分享的幻灯片',
      'Make a pitch deck for my startup',
      'convert to .pptx',
      'convert to pptx',
      'export as pptx',
      'save as pptx',
      '导出PPT',
      '导出pptx',
      '下载ppt',
      '导出演示文稿',
      '保存为pptx',
    ],
  };

  async generate(
    input: string,
    theme: ThemePack,
    context: Record<string, unknown>,
  ): Promise<Artifact> {
    const { topic, sections } = parsePresentation(input);
    const slides = buildSlideOutline(topic, sections, input);
    const slideCount = slides.length;
    const cssVars = Object.entries(theme.cssVariables)
      .map(([k, v]) => `  ${k}: ${v};`)
      .join('\n');

    const slideSections = slides.map((s, i) => renderSlide(s, i)).join('\n');
    const viewMode = (context.viewMode as string) ?? 'scroll';
    const navScript = NAVIGATION_SCRIPT.replace('{{VIEW_MODE}}', viewMode);

    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(topic)}</title>
<style>
:root {
${cssVars}
  --cd-slide-border: rgba(26, 115, 232, 0.16);
  --cd-slide-shadow: rgba(15, 23, 42, 0.12);
}
body {
  font-family: var(--cd-font-body, 'Noto Sans SC', sans-serif);
  background:
    radial-gradient(circle at top left, rgba(26, 115, 232, 0.08), transparent 24%),
    linear-gradient(180deg, #f6f9ff 0%, var(--cd-color-bg, #fff) 55%);
  color: #1f2937;
  margin: 0;
  padding: 24px 0 48px;
}
.slide {
  width: 960px;
  height: 540px;
  margin: 24px auto;
  padding: 0;
  box-sizing: border-box;
  border-radius: 24px;
  border: 1px solid var(--cd-slide-border);
  box-shadow: 0 18px 48px var(--cd-slide-shadow);
  background: rgba(255, 255, 255, 0.94);
  overflow: hidden;
  page-break-after: always;
}
.slide-inner {
  height: 100%;
  padding: 48px 64px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  background:
    linear-gradient(135deg, rgba(26, 115, 232, 0.08), transparent 38%),
    linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.96));
}
.slide h1 {
  margin: 0 0 24px;
  font-family: var(--cd-font-heading);
  color: var(--cd-color-primary);
  font-size: 36px;
  line-height: 1.15;
}
.slide ul {
  margin: 0;
  padding-left: 24px;
  display: grid;
  gap: 16px;
  font-size: 22px;
  line-height: 1.55;
}
.slide li::marker {
  color: var(--cd-color-primary);
}
.toc-list {
  list-style: none;
  padding: 0;
  display: grid;
  gap: 12px;
  font-size: 22px;
}
.toc-list li { display: flex; align-items: center; gap: 12px; }
.toc-num {
  display: inline-flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border-radius: 50%;
  background: var(--cd-color-primary, #1a73e8); color: #fff;
  font-size: 16px; font-weight: 700; flex-shrink: 0;
}
.comparison-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  flex: 1;
}
.comparison-col h2 {
  font-size: 22px;
  color: var(--cd-color-primary);
  margin: 0 0 16px;
}
.comparison-col ul {
  font-size: 18px;
  padding-left: 20px;
  display: grid;
  gap: 10px;
}
.chart-container { flex: 1; display: flex; align-items: center; justify-content: center; }
.chart-container svg { max-width: 100%; max-height: 100%; }
</style>
</head>
<body>
${slideSections}
${navScript}
</body>
</html>`;

    return buildArtifact(
      context['taskId'] as string ?? 'unknown',
      'slides',
      html,
      slideCount,
      { slideCount, topic },
    );
  }
}

export default new SlidesSkill();
