import { describe, expect, it } from 'vitest';
import { ContextPackDetector } from '../../src/routing/context-pack-detector.js';
import type { DesignRequest } from '../../src/types.js';

function makeRequest(overrides: Partial<DesignRequest> = {}): DesignRequest {
  return {
    taskId: 'ctx-test-1',
    rawInput: '帮我做一个品牌演示文稿',
    ...overrides,
  };
}

describe('ContextPackDetector', () => {
  const detector = new ContextPackDetector();

  // ── AC1: identify brand, style, history context ──

  it('detects brand context from rawInput keywords', () => {
    const pack = detector.detect(makeRequest({ rawInput: '按照我们的品牌规范做一个PPT' }));
    const brandEntry = pack.entries.find(e => e.key === 'brand-context');
    expect(brandEntry).toBeDefined();
    expect(brandEntry!.source).toBe('brand');
  });

  it('detects style preference from rawInput', () => {
    const pack = detector.detect(makeRequest({ rawInput: '用深色主题风格做一个图表' }));
    const styleEntry = pack.entries.find(e => e.key === 'style-preference');
    expect(styleEntry).toBeDefined();
  });

  it('detects history context from rawInput', () => {
    const pack = detector.detect(makeRequest({ rawInput: '沿用上次的风格做一个新版本' }));
    const historyEntry = pack.entries.find(e => e.key === 'history-style');
    expect(historyEntry).toBeDefined();
    expect(historyEntry!.source).toBe('history');
  });

  it('extracts explicit hex colors from text', () => {
    const pack = detector.detect(makeRequest({ rawInput: '主色用 #FF5733，辅色 #333333' }));
    const colorEntry = pack.entries.find(e => e.key === 'brand-colors');
    expect(colorEntry).toBeDefined();
    expect(colorEntry!.value).toEqual(['#FF5733', '#333333']);
  });

  it('extracts font declarations from text', () => {
    const pack = detector.detect(makeRequest({ rawInput: '字体用 font-family: "Noto Sans SC"' }));
    const fontEntry = pack.entries.find(e => e.key === 'brand-fonts');
    expect(fontEntry).toBeDefined();
    expect((fontEntry!.value as string[])[0]).toContain('Noto Sans SC');
  });

  it('detects structured data context from keywords', () => {
    const pack = detector.detect(makeRequest({ rawInput: '把这份 CSV 数据做成图表' }));
    const dataEntry = pack.entries.find(e => e.key === 'data-context');
    expect(dataEntry).toBeDefined();
  });

  // ── Attachment detection ──

  it('classifies image attachments as reference', () => {
    const pack = detector.detect(makeRequest({
      rawInput: '参考这张图',
      attachments: ['screenshot.png', 'reference.jpg'],
    }));
    const refs = pack.entries.filter(e => e.key === 'reference-material');
    expect(refs.length).toBe(2);
    expect(refs[0].source).toBe('reference');
  });

  it('classifies data file attachments as structured-data', () => {
    const pack = detector.detect(makeRequest({
      rawInput: '用这份数据',
      attachments: ['sales.csv', 'metrics.xlsx'],
    }));
    const dataEntries = pack.entries.filter(e => e.source === 'structured-data');
    // 2 from attachments + 1 from rawInput keyword match
    expect(dataEntries.length).toBeGreaterThanOrEqual(2);
  });

  it('detects logo from attachment filename', () => {
    const pack = detector.detect(makeRequest({
      rawInput: '加上公司logo',
      attachments: ['company-logo.png'],
    }));
    const logoEntry = pack.entries.find(e => e.key === 'brand-logo');
    expect(logoEntry).toBeDefined();
    expect(logoEntry!.source).toBe('brand');
  });

  // ── Metadata detection ──

  it('detects brand context from metadata.brandKit', () => {
    const pack = detector.detect(makeRequest({
      rawInput: '做个PPT',
      metadata: { brandKit: { colors: ['#000'], fonts: ['Arial'] } },
    }));
    const brandEntry = pack.entries.find(e => e.key === 'brand-context' && e.source === 'brand');
    expect(brandEntry).toBeDefined();
    expect(brandEntry!.confidence).toBe(1.0);
  });

  it('detects colors and fonts from metadata', () => {
    const pack = detector.detect(makeRequest({
      rawInput: '做个图表',
      metadata: { colors: ['#FF0000'], fonts: ['Helvetica'] },
    }));
    expect(pack.entries.find(e => e.key === 'brand-colors')).toBeDefined();
    expect(pack.entries.find(e => e.key === 'brand-fonts')).toBeDefined();
  });

  // ── AC2: reusable vs task-specific ──

  it('splits entries into reusable and task-specific', () => {
    const pack = detector.detect(makeRequest({
      rawInput: '按品牌规范做，用这份 CSV 数据',
      attachments: ['data.csv'],
    }));
    expect(pack.reusable.length).toBeGreaterThan(0);
    expect(pack.taskSpecific.length).toBeGreaterThan(0);
    // brand-context should be reusable
    expect(pack.reusable.some(e => e.key === 'brand-context')).toBe(true);
    // data-context from attachment should be task-specific
    expect(pack.taskSpecific.some(e => e.source === 'structured-data')).toBe(true);
  });

  // ── AC3: conflict detection and resolution ──

  it('detects conflicts when same key from multiple sources', () => {
    const pack = detector.detect(makeRequest({
      rawInput: '用 #FF0000 做品牌色',
      metadata: { colors: ['#0000FF'] },
    }));
    const colorConflict = pack.conflicts.find(c => c.key === 'brand-colors');
    expect(colorConflict).toBeDefined();
    expect(colorConflict!.entries.length).toBe(2);
  });

  it('resolves conflicts by source priority (inline > brand)', () => {
    const pack = detector.detect(makeRequest({
      rawInput: '用 #FF0000',
      metadata: { colors: ['#0000FF'] },
    }));
    const colorConflict = pack.conflicts.find(c => c.key === 'brand-colors');
    expect(colorConflict).toBeDefined();
    // inline has higher priority than brand in our model
    expect(colorConflict!.resolved).toBeDefined();
    expect(colorConflict!.resolved.source).toBe('inline');
    expect(colorConflict!.resolved.value).toEqual(['#FF0000']);
    expect(colorConflict!.reason).toContain("Source 'inline'");
  });

  it('returns no conflicts when all entries have same source', () => {
    const pack = detector.detect(makeRequest({
      rawInput: '做个简单的图表',
    }));
    expect(pack.conflicts.length).toBe(0);
  });

  // ── Edge cases ──

  it('handles empty request gracefully', () => {
    const pack = detector.detect(makeRequest({ rawInput: '' }));
    expect(pack.entries).toEqual([]);
    expect(pack.conflicts).toEqual([]);
  });

  it('handles request with no attachments or metadata', () => {
    const pack = detector.detect(makeRequest({ rawInput: '做个PPT' }));
    expect(pack.entries).toBeDefined();
    expect(Array.isArray(pack.reusable)).toBe(true);
    expect(Array.isArray(pack.taskSpecific)).toBe(true);
  });
});
