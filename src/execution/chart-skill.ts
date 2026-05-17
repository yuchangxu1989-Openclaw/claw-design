// ChartSkill — parses user input to generate pie / bar / line charts as SVG/HTML
// Uses regex-based parsing (no LLM), themed with Claw Design ThemePack CSS variables

import type { DesignSkill, SkillContract, Artifact, ThemePack } from '../types.js';
import { buildArtifact } from './skill-executor.js';
import { escapeHtml } from '../utils.js';

export const CHART_SKILL_PATH = '/root/.openclaw/workspace/skills/chart-craft-plus';

/* ── Types ─────────────────────────────────────────────────────────── */

type ChartType = 'pie' | 'bar' | 'line';

interface DataItem {
  label: string;
  value: number;
}

interface ParsedChart {
  chartType: ChartType;
  title: string;
  subtitle: string;
  items: DataItem[];
}

/* ── Palette ───────────────────────────────────────────────────────── */

const PALETTE = [
  '#6C5CE7', '#E17055', '#0984E3', '#00B894',
  '#FDCB6E', '#E84393', '#00CEC9', '#636E72',
  '#D63031', '#74B9FF', '#55EFC4', '#A29BFE',
];

/* ── Input Parser ──────────────────────────────────────────────────── */

function detectChartType(input: string): ChartType {
  const lower = input.toLowerCase();
  if (/饼图|pie/i.test(lower)) return 'pie';
  if (/折线图|line/i.test(lower)) return 'line';
  // default to bar for 柱状图/bar or unrecognized
  if (/柱状图|bar/i.test(lower)) return 'bar';
  return 'bar';
}

/** Keywords that should never be parsed as data-item labels */
const NOISE_KEYWORDS = /置信度|confidence|数据来源|source|备注|note/i;

/** Max label length (chars) — rejects title text leaking into labels */
const MAX_LABEL_LEN = 20;

/** Chinese unit multipliers */
const UNIT_MULTIPLIERS: Record<string, number> = {
  '万': 10000,
  '亿': 100000000,
  '千': 1000,
  '百': 100,
  'k': 1000,
  'K': 1000,
  'M': 1000000,
  'm': 1000000,
};

/** Parse a number that may have a Chinese/English unit suffix, returning the raw numeric value */
function parseNumberWithUnit(numStr: string, unitStr?: string): number {
  const base = parseFloat(numStr);
  if (unitStr && UNIT_MULTIPLIERS[unitStr]) {
    return base; // Keep the display value (e.g. 120 for "120万"), not multiplied
  }
  return base;
}

/** Build a display label suffix from unit */
function getUnitSuffix(input: string): string {
  const match = input.match(/(\d+(?:\.\d+)?)\s*(万|亿|千|百|[kKmM])/u);
  return match ? match[2] : '';
}

/** Validate a parsed label: not noise, not a range, within length limit */
function isValidLabel(label: string): boolean {
  return !!label
    && !NOISE_KEYWORDS.test(label)
    && !/\d+\s*[-–—]\s*\d+/.test(label)
    && label.length <= MAX_LABEL_LEN;
}

function parseDataItems(input: string): DataItem[] {
  const items: DataItem[] = [];
  let m;

  const cleanedInput = input
    .replace(/^(画一个?|绘制?|生成?|make|create|draw)?\s*(饼图|柱状图|折线图|pie|bar|line)\s*[:：]?\s*/gi, '')
    .replace(/^[\s，。？！、]/, '')
    // Strip descriptive prefix before data (e.g. "展示 2024 年各季度营收：")
    .replace(/^[^:：]*?[:：]\s*(?=\S+\s*\d)/u, '')
    .trim();

  const segments = cleanedInput.split(/[,，、;；]/)
    .map(s => s.trim())
    .filter(Boolean);

  const pctRegex = /^(.+?)\s*(\d+(?:\.\d+)?)\s*(万|亿|千|百|[kKmM])?\s*%?$/;
  for (const seg of segments) {
    const match = seg.match(pctRegex);
    if (match) {
      const label = match[1].trim();
      const value = parseNumberWithUnit(match[2], match[3]);
      if (isValidLabel(label)) {
        items.push({ label, value });
      }
    }
  }
  if (items.length >= 1) return items;

  // Pattern 2: "Label: 20" or "Label：20" (no percent)
  items.length = 0;
  const colonRegex = /([^,;，；\n\d][^,;，；\n]*?)\s*[:：]\s*(\d+(?:\.\d+)?)\s*(万|亿|千|百|[kKmM])?/g;
  for (const seg of segments) {
    colonRegex.lastIndex = 0;
    while ((m = colonRegex.exec(seg)) !== null) {
      const label = m[1].replace(/^[\s·•\-–—]+/, '').trim();
      if (isValidLabel(label) && !/^(pie|bar|line|饼图|柱状图|折线图)$/i.test(label)) {
        items.push({ label, value: parseNumberWithUnit(m[2], m[3]) });
      }
    }
  }
  if (items.length >= 1) return items;

  // Pattern 3: "Label 数字" (space-separated, no colon, no percent)
  // Matches items in comma/semicolon-delimited lists like "手机 500, 电脑 300"
  items.length = 0;
  const spaceRegex = /([\p{L}\p{M}][\p{L}\p{M}\w]*(?:\s[\p{L}\p{M}][\p{L}\p{M}\w]*)*)\s+(\d+(?:\.\d+)?)\s*(万|亿|千|百|[kKmM])?(?=[,;，；。\s]|$)/gu;
  for (const seg of segments) {
    spaceRegex.lastIndex = 0;
    while ((m = spaceRegex.exec(seg)) !== null) {
      const label = m[1].replace(/^[\s·•\-–—]+/, '').trim();
      if (!isValidLabel(label)) continue;
      if (/^(pie|bar|line|饼图|柱状图|折线图)$/i.test(label)) continue;
      items.push({ label, value: parseNumberWithUnit(m[2], m[3]) });
    }
  }
  return items;
}

function extractTitle(input: string): { title: string; subtitle: string } {
  const lines = input.split(/\n/).map(l => l.trim()).filter(Boolean);
  let title = 'Chart';
  let subtitle = '';

  // Try to extract descriptive prefix before data as title
  // e.g. "画一个柱状图展示 2024 年各季度营收：Q1 120万..." -> "2024 年各季度营收"
  const stripped = input.replace(/^(画一个?|绘制?|生成?|make|create|draw)?\s*(饼图|柱状图|折线图|pie|bar|line)\s*/gi, '').trim();
  const colonMatch = stripped.match(/^(.+?)[:：]\s*\S+\s*\d/);
  if (colonMatch) {
    const candidate = colonMatch[1].replace(/^(展示|of|for|about)\s*/gi, '').trim();
    if (candidate.length >= 2 && candidate.length <= 40) {
      title = candidate;
    }
  }

  // Fallback: extract from data labels
  if (title === 'Chart') {
    const chartTypeMatch = input.match(/^(饼图|柱状图|折线图|pie chart|bar chart|line chart)\s*[:：]?\s*/i);
    const chartType = chartTypeMatch ? chartTypeMatch[1] : '';
    const labels: string[] = [];

    if (lines.length > 0) {
      const first = lines[0];
      const withoutType = first.replace(/^(饼图|柱状图|折线图|pie|bar|line)\s*[:：\s]*/gi, '').trim();
      const colonParts = withoutType.split(/[,，、]/);
      for (const part of colonParts) {
        const match = part.trim().match(/^([^:：\d]+?)\s*(\d+(?:\.\d+)?)\s*(万|亿|千|百|[kKmM])?\s*%?$/);
        if (match && match[1].length > 0) {
          labels.push(match[1].trim());
        }
      }
    }

    if (labels.length > 0) {
      const uniqueLabels = [...new Set(labels)];
      if (uniqueLabels.length <= 3) {
        title = uniqueLabels.join('、') + ' 对比';
      } else {
        title = uniqueLabels.slice(0, 3).join('、') + ' 等';
      }
    } else if (chartType) {
      const typeNames: Record<string, string> = {
        '饼图': '占比分布', '柱状图': '对比', '折线图': '趋势',
        'pie': 'Distribution', 'bar': 'Comparison', 'line': 'Trend',
      };
      title = typeNames[chartType.toLowerCase()] || '数据图表';
    }
  }

  // Get unit suffix for subtitle
  const unitSuffix = getUnitSuffix(input);
  if (unitSuffix) {
    subtitle = `单位：${unitSuffix}`;
  } else if (lines.length > 1 && !/\d+\s*%/.test(lines[1]) && !parseDataItems(lines[1]).length) {
    subtitle = lines[1];
  }
  return { title, subtitle };
}

export function parseChartInput(input: string): ParsedChart {
  const chartType = detectChartType(input);
  const items = parseDataItems(input);
  const { title, subtitle } = extractTitle(input);
  return { chartType, title, subtitle, items };
}

/* ── SVG Generators ────────────────────────────────────────────────── */

function generatePieSvg(items: DataItem[]): string {
  const total = items.reduce((s, i) => s + i.value, 0);
  if (total === 0) return '<text x="400" y="250" text-anchor="middle">No data</text>';

  const cx = 240, cy = 270, outerR = 130, innerR = 60;
  let cumAngle = -90; // start from top

  const paths = items.map((item, i) => {
    const pct = item.value / total;
    const angle = pct * 360;
    const startRad = (cumAngle * Math.PI) / 180;
    const endRad = ((cumAngle + angle) * Math.PI) / 180;
    cumAngle += angle;

    const largeArc = angle > 180 ? 1 : 0;
    const ox1 = cx + outerR * Math.cos(startRad);
    const oy1 = cy + outerR * Math.sin(startRad);
    const ox2 = cx + outerR * Math.cos(endRad);
    const oy2 = cy + outerR * Math.sin(endRad);
    const ix1 = cx + innerR * Math.cos(endRad);
    const iy1 = cy + innerR * Math.sin(endRad);
    const ix2 = cx + innerR * Math.cos(startRad);
    const iy2 = cy + innerR * Math.sin(startRad);

    const color = PALETTE[i % PALETTE.length];
    return `    <path d="M${ox1.toFixed(2)},${oy1.toFixed(2)} A${outerR},${outerR} 0 ${largeArc},1 ${ox2.toFixed(2)},${oy2.toFixed(2)} L${ix1.toFixed(2)},${iy1.toFixed(2)} A${innerR},${innerR} 0 ${largeArc},0 ${ix2.toFixed(2)},${iy2.toFixed(2)} Z" fill="${color}"/>`;
  });

  const centerText = `    <text x="${cx}" y="${cy - 6}" text-anchor="middle" font-size="26" font-weight="700" fill="var(--cd-color-text, #26251e)">${total}%</text>
    <text x="${cx}" y="${cy + 16}" text-anchor="middle" font-size="12" fill="#8a8880">总计</text>`;

  // Legend cards on the right
  const legendCards = items.map((item, i) => {
    const color = PALETTE[i % PALETTE.length];
    const y = 100 + i * 76;
    const pct = ((item.value / total) * 100).toFixed(1);
    return `    <g transform="translate(430,${y})">
      <rect x="0" y="0" width="320" height="64" rx="10" fill="#fff" stroke="#e8e6e0" stroke-width="1"/>
      <rect x="16" y="22" width="14" height="14" rx="3" fill="${color}"/>
      <text x="42" y="34" font-size="14" font-weight="600" fill="var(--cd-color-text, #26251e)">${escapeHtml(item.label)}</text>
      <text x="296" y="38" text-anchor="end" font-size="22" font-weight="700" fill="${color}">${pct}%</text>
    </g>`;
  });

  return `  <g transform="translate(0,0)">
${paths.join('\n')}
${centerText}
  </g>
${legendCards.join('\n')}`;
}

function generateBarSvg(items: DataItem[]): string {
  const maxVal = Math.max(...items.map(i => i.value), 1);
  const chartH = 240, chartW = 560, originX = 60, originY = 280;
  const barW = Math.min(50, (chartW / items.length) * 0.6);
  const gap = chartW / items.length;

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(f => {
    const y = originY - f * chartH;
    const val = Math.round(f * maxVal);
    return `    <line x1="${originX}" y1="${y}" x2="${originX + chartW}" y2="${y}" stroke="#f3f4f6" stroke-width="1"/>
    <text x="${originX - 8}" y="${y + 4}" text-anchor="end" font-size="11" fill="#9ca3af">${val}</text>`;
  });

  const bars = items.map((item, i) => {
    const color = PALETTE[i % PALETTE.length];
    const h = (item.value / maxVal) * chartH;
    const x = originX + i * gap + (gap - barW) / 2;
    const y = originY - h;
    return `    <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW}" height="${h.toFixed(1)}" rx="4" fill="${color}"/>
    <text x="${(x + barW / 2).toFixed(1)}" y="${(y - 6).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="700" fill="${color}">${item.value}</text>
    <text x="${(x + barW / 2).toFixed(1)}" y="${originY + 18}" text-anchor="middle" font-size="11" fill="#6b7280">${escapeHtml(item.label.length > 8 ? item.label.slice(0, 8) + '…' : item.label)}</text>`;
  });

  return `  <!-- Axes -->
    <line x1="${originX}" y1="${originY - chartH}" x2="${originX}" y2="${originY}" stroke="#e5e7eb" stroke-width="1"/>
    <line x1="${originX}" y1="${originY}" x2="${originX + chartW}" y2="${originY}" stroke="#e5e7eb" stroke-width="1"/>
${gridLines.join('\n')}
${bars.join('\n')}`;
}

function generateLineSvg(items: DataItem[]): string {
  const maxVal = Math.max(...items.map(i => i.value), 1);
  const chartH = 240, chartW = 560, originX = 60, originY = 280;
  const gap = items.length > 1 ? chartW / (items.length - 1) : chartW;

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(f => {
    const y = originY - f * chartH;
    const val = Math.round(f * maxVal);
    return `    <line x1="${originX}" y1="${y}" x2="${originX + chartW}" y2="${y}" stroke="#f3f4f6" stroke-width="1"/>
    <text x="${originX - 8}" y="${y + 4}" text-anchor="end" font-size="11" fill="#9ca3af">${val}</text>`;
  });

  const points = items.map((item, i) => {
    const x = originX + i * gap;
    const y = originY - (item.value / maxVal) * chartH;
    return { x, y, item };
  });

  const polyline = points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const color = PALETTE[0];

  const dots = points.map(p =>
    `    <circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4" fill="${color}" stroke="#fff" stroke-width="2"/>
    <text x="${p.x.toFixed(1)}" y="${(p.y - 10).toFixed(1)}" text-anchor="middle" font-size="11" font-weight="700" fill="${color}">${p.item.value}</text>
    <text x="${p.x.toFixed(1)}" y="${originY + 18}" text-anchor="middle" font-size="11" fill="#6b7280">${escapeHtml(p.item.label.length > 8 ? p.item.label.slice(0, 8) + '…' : p.item.label)}</text>`
  );

  return `  <!-- Axes -->
    <line x1="${originX}" y1="${originY - chartH}" x2="${originX}" y2="${originY}" stroke="#e5e7eb" stroke-width="1"/>
    <line x1="${originX}" y1="${originY}" x2="${originX + chartW}" y2="${originY}" stroke="#e5e7eb" stroke-width="1"/>
${gridLines.join('\n')}
    <polyline points="${polyline}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round"/>
${dots.join('\n')}`;
}

/* ── HTML Builder ──────────────────────────────────────────────────── */

function buildChartHtml(parsed: ParsedChart, cssVars: string): string {
  const svgW = parsed.chartType === 'pie' ? 800 : 660;
  const svgH = parsed.chartType === 'pie' ? Math.max(500, 100 + parsed.items.length * 76 + 40) : 320;

  let svgContent: string;
  switch (parsed.chartType) {
    case 'pie':  svgContent = generatePieSvg(parsed.items); break;
    case 'line': svgContent = generateLineSvg(parsed.items); break;
    default:     svgContent = generateBarSvg(parsed.items); break;
  }

  const subtitleHtml = parsed.subtitle
    ? `\n  <p class="chart-subtitle">${escapeHtml(parsed.subtitle)}</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(parsed.title || '数据图表')}</title>
<style>
:root {
${cssVars}
}
body {
  font-family: var(--cd-font-body, 'Noto Sans SC', sans-serif);
  background: var(--cd-color-bg, #faf9f5);
  margin: 2rem;
}
.chart-container {
  max-width: ${svgW + 40}px;
  margin: 0 auto;
  padding: 2rem;
  border-radius: var(--cd-radius, 8px);
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  background: #fff;
}
h1 { font-family: var(--cd-font-heading); color: var(--cd-color-primary, #26251e); font-size: 1.5rem; margin-bottom: 0.25rem; }
.chart-subtitle { color: #8a8880; font-size: 0.9rem; margin-bottom: 1.5rem; }
</style>
</head>
<body>
<div class="chart-container">
  <h1>${escapeHtml(parsed.title)}</h1>${subtitleHtml}
  <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 ${svgW} ${svgH}" font-family="'Noto Sans SC','PingFang SC',sans-serif">
${svgContent}
  </svg>
</div>
</body>
</html>`;
}

/* ── Skill Class ───────────────────────────────────────────────────── */

export class ChartSkill implements DesignSkill {
  readonly contract: SkillContract = {
    name: 'chart',
    artifactType: 'chart',
    description: 'Charts & data visualization via chart-craft-plus (35+ types)',
    triggerKeywords: [
      'chart', 'graph', 'visualization', 'diagram', '图表', '可视化',
      '柱状图', '折线图', '饼图', '漏斗图', '桑基图', '热力图',
      'bar chart', 'line chart', 'pie chart',
    ],
  };

  async generate(
    input: string,
    theme: ThemePack,
    context: Record<string, unknown>,
  ): Promise<Artifact> {
    const cssVars = Object.entries(theme.cssVariables)
      .map(([k, v]) => `  ${k}: ${v};`)
      .join('\n');

    const parsed = parseChartInput(input);
    const html = buildChartHtml(parsed, cssVars);

    return buildArtifact(
      context['taskId'] as string ?? 'unknown',
      'chart',
      html,
      1,
      { skillPath: CHART_SKILL_PATH, chartType: parsed.chartType, itemCount: parsed.items.length },
    );
  }
}

export default new ChartSkill();
