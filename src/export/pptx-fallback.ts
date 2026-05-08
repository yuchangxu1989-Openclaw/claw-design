import type { ThemePack } from '../types.js';
import { SLIDE_WIDTH_PX, SLIDE_HEIGHT_PX } from './export-constants.js';

export interface PptxFallbackReason {
  code: 'complex-svg' | 'nested-layout' | 'animation';
  message: string;
}

export interface PptxPageAnalysis {
  index: number;
  title: string;
  sourceHtml: string;
  text: string;
  excerpt: string;
  requiresFallback: boolean;
  fallbackReasons: PptxFallbackReason[];
}

const SECTION_PATTERN = /<section[^>]*>[\s\S]*?<\/section>/gi;
const BODY_PATTERN = /<body[^>]*>([\s\S]*?)<\/body>/i;
const HEADING_PATTERN = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i;
const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

export function extractPptxPageAnalyses(html: string): PptxPageAnalysis[] {
  const sections = html.match(SECTION_PATTERN) ?? [];
  const pageMarkup = sections.length > 0 ? sections : [extractBodyOrHtml(html)];

  return pageMarkup
    .map((sourceHtml, index) => buildPageAnalysis(sourceHtml, index + 1))
    .filter(page => page.text.length > 0 || page.requiresFallback);
}

export function buildFallbackImageData(page: PptxPageAnalysis, theme: ThemePack): string {
  const title = escapeXml(page.title || `Page ${page.index}`);
  const excerpt = wrapLines(page.excerpt || 'Original page is preserved as HTML in the delivery bundle.', 54)
    .slice(0, 8)
    .map((line, index) => `<text x="80" y="${210 + index * 48}" font-size="28" fill="#1f2937">${escapeXml(line)}</text>`)
    .join('');
  const reasons = page.fallbackReasons
    .slice(0, 3)
    .map((reason, index) => {
      const y = 118 + index * 52;
      return [
        `<rect x="80" y="${y}" width="1040" height="36" rx="18" fill="#eef2ff" />`,
        `<text x="104" y="${y + 24}" font-size="20" fill="#334155">${escapeXml(reason.message)}</text>`,
      ].join('');
    })
    .join('');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${SLIDE_WIDTH_PX}" height="${SLIDE_HEIGHT_PX}" viewBox="0 0 ${SLIDE_WIDTH_PX} ${SLIDE_HEIGHT_PX}">
      <rect width="${SLIDE_WIDTH_PX}" height="${SLIDE_HEIGHT_PX}" fill="#ffffff" />
      <rect x="48" y="48" width="1184" height="624" rx="32" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2" />
      <rect x="80" y="72" width="1120" height="18" rx="9" fill="#${normalizePptxColor(theme.colorPrimary)}" opacity="0.18" />
      <text x="80" y="96" font-size="34" font-weight="700" fill="#111827">${title}</text>
      <text x="80" y="168" font-size="22" fill="#475569">Rendered as fallback image for PPTX compatibility</text>
      ${reasons}
      ${excerpt}
      <text x="80" y="640" font-size="20" fill="#64748b">Editable HTML source remains in the delivery bundle.</text>
    </svg>
  `.replace(/\n\s+/g, ' ').trim();

  return `image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

export function buildFallbackNote(page: PptxPageAnalysis): string {
  const reasons = page.fallbackReasons.map(reason => reason.message).join('；');
  return `此页为截图嵌入，原始 HTML 可编辑版本见交付包。回退页：第 ${page.index} 页。原因：${reasons}`;
}

function buildPageAnalysis(sourceHtml: string, index: number): PptxPageAnalysis {
  const text = normalizeWhitespace(stripHtml(sourceHtml));
  const title = extractTitle(sourceHtml, index, text);
  const fallbackReasons = detectFallbackReasons(sourceHtml);

  return {
    index,
    title,
    sourceHtml,
    text,
    excerpt: text.slice(0, 360),
    requiresFallback: fallbackReasons.length > 0,
    fallbackReasons,
  };
}

function detectFallbackReasons(markup: string): PptxFallbackReason[] {
  const reasons: PptxFallbackReason[] = [];
  const svgCount = countMatches(markup, /<svg\b/gi);
  const complexSvgSignals = countMatches(markup, /<(?:foreignObject|filter|mask|pattern|clipPath|animate|animateTransform|linearGradient|radialGradient|path|defs|use)\b/gi);
  const nestedDepth = computeMaxTagDepth(markup);
  const layoutWrappers = countMatches(markup, /<(?:div|article|aside|header|footer|main)\b/gi);
  const absolutelyPositioned = countMatches(markup, /position\s*:\s*absolute/gi);
  const animationSignals = countMatches(markup, /(?:animation\s*:|transition\s*:|@keyframes|data-animate|data-motion|class=["'][^"']*(?:animate|motion|transition))/gi);

  if (svgCount > 0 && (complexSvgSignals >= 3 || svgCount > 1)) {
    reasons.push({
      code: 'complex-svg',
      message: '包含复杂 SVG 结构，PPTX 难以稳定保留可编辑关系',
    });
  }

  if (nestedDepth >= 9 || layoutWrappers >= 14 || absolutelyPositioned >= 3) {
    reasons.push({
      code: 'nested-layout',
      message: '页面嵌套布局较深，块级结构回写到 PPTX 风险高',
    });
  }

  if (animationSignals > 0) {
    reasons.push({
      code: 'animation',
      message: '页面含动画或过渡效果，静态 PPTX 需回退为截图',
    });
  }

  return reasons;
}

function extractBodyOrHtml(html: string): string {
  const bodyMatch = BODY_PATTERN.exec(html);
  return bodyMatch?.[1] ?? html;
}

function extractTitle(sourceHtml: string, index: number, fallbackText: string): string {
  const heading = HEADING_PATTERN.exec(sourceHtml)?.[1];
  const normalizedHeading = normalizeWhitespace(stripHtml(heading ?? ''));
  if (normalizedHeading) {
    return normalizedHeading;
  }

  return fallbackText.slice(0, 48) || `Page ${index}`;
}

function stripHtml(value: string): string {
  return decodeHtmlEntities(value.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' '));
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function computeMaxTagDepth(markup: string, maxDepth: number = 100): number {
  const tagPattern = /<\/?([a-z0-9:-]+)(?:\s[^>]*?)?\/?\s*>/gi;
  let depth = 0;
  let best = 0;
  let match: RegExpExecArray | null;

  while ((match = tagPattern.exec(markup)) !== null) {
    const raw = match[0];
    const tagName = match[1].toLowerCase();
    const isClosing = raw.startsWith('</');
    const isSelfClosing = raw.endsWith('/>') || VOID_TAGS.has(tagName);

    if (isClosing) {
      depth = Math.max(0, depth - 1);
      continue;
    }

    depth += 1;
    best = Math.max(best, depth);

    if (best >= maxDepth) {
      return best;
    }

    if (isSelfClosing) {
      depth = Math.max(0, depth - 1);
    }
  }

  return best;
}

function countMatches(value: string, pattern: RegExp): number {
  return value.match(pattern)?.length ?? 0;
}

function wrapLines(value: string, maxChars: number): string[] {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
      continue;
    }
    if (current) {
      lines.push(current);
    }
    current = word;
  }

  if (current) {
    lines.push(current);
  }

  return lines.length > 0 ? lines : [''];
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function normalizePptxColor(color: string): string {
  return (color || '#1a73e8').replace('#', '') || '1a73e8'; // Google Blue — neutral default for slides/charts
}
