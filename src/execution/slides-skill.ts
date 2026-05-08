// SlidesSkill - generates HTML slide decks with 5+ semantic slides

import type { DesignSkill, SkillContract, Artifact, ThemePack } from '../types.js';
import { buildArtifact } from './skill-executor.js';
import { escapeHtml, extractInputSpecifics } from '../utils.js';

interface SlideSpec {
  title: string;
  bullets: string[];
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

    for (const section of sections) {
      slides.push({
        title: section,
        bullets: [
          `${section}——作为${topic}的核心板块之一，以下为要点梳理。`,
          `${section}的当前状态与阶段性进展。`,
          `${section}面临的主要挑战和待解决问题。`,
          `${section}的下一步行动建议和优先级排列。`,
        ],
      });
    }

    slides.push({
      title: '总结与展望',
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

  return [
    {
      title: topic,
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
      bullets: [
        `场景一：${topic}在日常工作流中的典型应用方式。`,
        `场景二：${topic}在关键决策环节的辅助作用。`,
        `场景三：${topic}在跨团队协作中的价值体现。`,
        `每个场景建议配合具体案例和效果数据来增强说服力。`,
      ],
    },
    {
      title: `${topic}：总结与下一步`,
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
}

function renderSlide(slide: SlideSpec): string {
  const bulletItems = slide.bullets
    .map((bullet) => `    <li>${escapeHtml(bullet)}</li>`)
    .join('\n');

  return `<section class="slide">
  <div class="slide-inner">
    <h1>${escapeHtml(slide.title)}</h1>
    <ul>
${bulletItems}
    </ul>
  </div>
</section>`;
}

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

    const slideSections = slides.map(renderSlide).join('\n');

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
</style>
</head>
<body>
${slideSections}
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
