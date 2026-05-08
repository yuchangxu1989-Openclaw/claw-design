/**
 * ContextPackDetector — FR-A03 上下文包识别
 *
 * Detects and extracts context packs from a DesignRequest:
 * brand context, historical style, attachment constraints, structured data, etc.
 * Resolves conflicts when multiple context sources disagree.
 */

import type { DesignRequest } from '../types.js';

// ── Context pack types ──

export type ContextSource = 'brand' | 'history' | 'attachment' | 'reference' | 'structured-data' | 'inline';

export interface ContextEntry {
  source: ContextSource;
  key: string;
  value: unknown;
  confidence: number; // 0–1
}

export interface ContextConflict {
  key: string;
  entries: ContextEntry[];
  resolved: ContextEntry;
  reason: string;
}

export interface ContextPack {
  entries: ContextEntry[];
  reusable: ContextEntry[];   // AC2: reusable across tasks
  taskSpecific: ContextEntry[]; // AC2: only for this task
  conflicts: ContextConflict[]; // AC3: detected conflicts
}

// ── Priority order for conflict resolution (higher index = higher priority) ──

const SOURCE_PRIORITY: ContextSource[] = [
  'history',
  'reference',
  'structured-data',
  'attachment',
  'brand',
  'inline',
];

function sourcePriority(source: ContextSource): number {
  const idx = SOURCE_PRIORITY.indexOf(source);
  return idx === -1 ? 0 : idx;
}

// ── Detection helpers ──

/**
 * Centralized keyword buckets for lightweight context detection.
 * Keep them in one place so future i18n or user-configurable routing can
 * extend the lists without editing detection logic.
 */
export const CONTEXT_PACK_KEYWORDS = {
  brand: [
    'brand', '品牌', 'logo', '标识', 'ci', 'vi', 'brand kit', '品牌规范',
    'corporate identity', '企业形象',
  ],
  style: [
    'style', '风格', 'theme', '主题', 'color', '颜色', 'font', '字体',
    'palette', '配色', 'aesthetic', '美学',
  ],
  history: [
    '之前', '上次', '历史', 'previous', 'last time', 'history', '沿用', '延续',
    'reuse', '复用', '保持一致',
  ],
  data: [
    'data', '数据', 'csv', 'json', 'excel', 'table', '表格', '指标', 'metric',
    'kpi', '报表',
  ],
} as const;

function matchesAny(text: string, keywords: readonly string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some(kw => lower.includes(kw.toLowerCase()));
}

// ── Color extraction ──

const HEX_COLOR_RE = /#(?:[0-9a-fA-F]{3,4}){1,2}\b/g;
const RGB_RE = /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+/g;

function extractColors(text: string): string[] {
  const hex = text.match(HEX_COLOR_RE) ?? [];
  const rgb = text.match(RGB_RE) ?? [];
  return [...hex, ...rgb];
}

// ── Font extraction ──

const FONT_RE = /font[- ]?family[:\s]*['"]?([^'";,\n]+)/gi;

function extractFonts(text: string): string[] {
  const fonts: string[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(FONT_RE.source, FONT_RE.flags);
  while ((m = re.exec(text)) !== null) {
    const f = m[1].trim();
    if (f.length > 0 && f.length < 60) fonts.push(f);
  }
  return fonts;
}

// ── Attachment type detection ──

const IMAGE_EXT = /\.(png|jpe?g|gif|svg|webp|bmp)$/i;
const DATA_EXT = /\.(csv|xlsx?|json|tsv)$/i;
const DOC_EXT = /\.(pdf|docx?|pptx?|md|txt)$/i;

function classifyAttachment(path: string): ContextSource {
  if (IMAGE_EXT.test(path)) return 'reference';
  if (DATA_EXT.test(path)) return 'structured-data';
  if (DOC_EXT.test(path)) return 'reference';
  return 'attachment';
}

// ── Reusability heuristic ──

const REUSABLE_KEYS = new Set([
  'brand-colors', 'brand-fonts', 'brand-logo', 'brand-context',
  'style-preference', 'history-style',
]);

function isReusable(entry: ContextEntry): boolean {
  return REUSABLE_KEYS.has(entry.key) || entry.source === 'brand' || entry.source === 'history';
}

// ── Main detector ──

export class ContextPackDetector {
  /**
   * Detect and extract context packs from a DesignRequest.
   * Returns a structured ContextPack with entries, reusable/task-specific split, and conflicts.
   */
  detect(request: DesignRequest): ContextPack {
    const entries: ContextEntry[] = [];

    // 1. Detect from rawInput text
    entries.push(...this.detectFromText(request.rawInput));

    // 2. Detect from attachments
    if (request.attachments?.length) {
      entries.push(...this.detectFromAttachments(request.attachments));
    }

    // 3. Detect from metadata
    if (request.metadata) {
      entries.push(...this.detectFromMetadata(request.metadata));
    }

    // 4. Resolve conflicts
    const conflicts = this.resolveConflicts(entries);

    // 5. Split reusable vs task-specific (AC2)
    const reusable = entries.filter(isReusable);
    const taskSpecific = entries.filter(e => !isReusable(e));

    return { entries, reusable, taskSpecific, conflicts };
  }

  // ── Text analysis ──

  private detectFromText(text: string): ContextEntry[] {
    const entries: ContextEntry[] = [];

    if (matchesAny(text, CONTEXT_PACK_KEYWORDS.brand)) {
      entries.push({ source: 'brand', key: 'brand-context', value: true, confidence: 0.8 });
    }

    if (matchesAny(text, CONTEXT_PACK_KEYWORDS.style)) {
      entries.push({ source: 'inline', key: 'style-preference', value: true, confidence: 0.7 });
    }

    if (matchesAny(text, CONTEXT_PACK_KEYWORDS.history)) {
      entries.push({ source: 'history', key: 'history-style', value: true, confidence: 0.6 });
    }

    if (matchesAny(text, CONTEXT_PACK_KEYWORDS.data)) {
      entries.push({ source: 'structured-data', key: 'data-context', value: true, confidence: 0.7 });
    }

    // Extract explicit colors
    const colors = extractColors(text);
    if (colors.length > 0) {
      entries.push({ source: 'inline', key: 'brand-colors', value: colors, confidence: 0.9 });
    }

    // Extract explicit fonts
    const fonts = extractFonts(text);
    if (fonts.length > 0) {
      entries.push({ source: 'inline', key: 'brand-fonts', value: fonts, confidence: 0.9 });
    }

    return entries;
  }

  // ── Attachment analysis ──

  private detectFromAttachments(attachments: string[]): ContextEntry[] {
    const entries: ContextEntry[] = [];

    for (const att of attachments) {
      const source = classifyAttachment(att);
      const key = source === 'structured-data' ? 'data-context'
        : source === 'reference' ? 'reference-material'
        : 'attachment-constraint';

      entries.push({ source, key, value: att, confidence: 0.8 });

      // Logo detection
      if (/logo/i.test(att) && IMAGE_EXT.test(att)) {
        entries.push({ source: 'brand', key: 'brand-logo', value: att, confidence: 0.9 });
      }
    }

    return entries;
  }

  // ── Metadata analysis ──

  private detectFromMetadata(metadata: Record<string, unknown>): ContextEntry[] {
    const entries: ContextEntry[] = [];

    if (metadata.brandKit || metadata.brand) {
      entries.push({ source: 'brand', key: 'brand-context', value: metadata.brandKit ?? metadata.brand, confidence: 1.0 });
    }

    if (metadata.colors && Array.isArray(metadata.colors)) {
      entries.push({ source: 'brand', key: 'brand-colors', value: metadata.colors, confidence: 1.0 });
    }

    if (metadata.fonts && Array.isArray(metadata.fonts)) {
      entries.push({ source: 'brand', key: 'brand-fonts', value: metadata.fonts, confidence: 1.0 });
    }

    if (metadata.style || metadata.theme) {
      entries.push({ source: 'inline', key: 'style-preference', value: metadata.style ?? metadata.theme, confidence: 0.9 });
    }

    if (metadata.history) {
      entries.push({ source: 'history', key: 'history-style', value: metadata.history, confidence: 0.7 });
    }

    return entries;
  }

  // ── Conflict resolution (AC3) ──

  /**
   * Detect conflicts: multiple entries with the same key but different sources.
   * Resolve by source priority (inline > brand > attachment > structured-data > reference > history).
   */
  resolveConflicts(entries: ContextEntry[]): ContextConflict[] {
    const byKey = new Map<string, ContextEntry[]>();
    for (const e of entries) {
      const list = byKey.get(e.key) ?? [];
      list.push(e);
      byKey.set(e.key, list);
    }

    const conflicts: ContextConflict[] = [];
    for (const [key, group] of byKey) {
      // Only flag as conflict if multiple distinct sources
      const sources = new Set(group.map(e => e.source));
      if (sources.size < 2) continue;

      // Resolve: highest source priority wins; tie-break by confidence
      const sorted = [...group].sort((a, b) => {
        const pDiff = sourcePriority(b.source) - sourcePriority(a.source);
        return pDiff !== 0 ? pDiff : b.confidence - a.confidence;
      });

      conflicts.push({
        key,
        entries: group,
        resolved: sorted[0],
        reason: `Source '${sorted[0].source}' has higher priority for key '${key}'`,
      });
    }

    return conflicts;
  }
}
