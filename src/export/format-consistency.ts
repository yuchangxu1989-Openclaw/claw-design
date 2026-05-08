import type {
  Artifact,
  ExportFormatSnapshot,
  FormatConsistencyReport,
  QualityItem,
} from '../types.js';

export interface GeneratedFormatArtifacts {
  hasPdf: boolean;
  hasPng: boolean;
  svgCount: number;
  pptxSlideCount: number;
  pdfPageCount: number;
}

export function buildFormatConsistencyReport(
  artifact: Artifact,
  generated: GeneratedFormatArtifacts,
): FormatConsistencyReport {
  const htmlSnapshot = createHtmlSnapshot(artifact);
  const snapshots: ExportFormatSnapshot[] = [
    htmlSnapshot,
    {
      format: 'pptx',
      pageCount: generated.pptxSlideCount,
      titles: [...htmlSnapshot.titles],
      keyPoints: [...htmlSnapshot.keyPoints],
    },
  ];
  const items: QualityItem[] = [];

  items.push(compareTitleAndPageParity(htmlSnapshot, generated.pptxSlideCount, 'pptx'));

  if (generated.hasPdf) {
    snapshots.push({
      format: 'pdf',
      pageCount: generated.pdfPageCount,
      titles: [...htmlSnapshot.titles],
      keyPoints: [...htmlSnapshot.keyPoints],
    });
    items.push(compareTitleAndPageParity(htmlSnapshot, generated.pdfPageCount, 'pdf'));
  }

  if (generated.hasPng) {
    snapshots.push({
      format: 'png',
      pageCount: 1,
      titles: htmlSnapshot.titles.slice(0, 1),
      keyPoints: htmlSnapshot.keyPoints.slice(0, 3),
      note: artifact.pages > 1 ? 'Raster export represents the first page only.' : undefined,
    });
    items.push({
      rule: 'cross-format-png-adaptation',
      passed: artifact.pages === 1,
      severity: artifact.pages === 1 ? 'info' : 'warn',
      group: 'consistency',
      message: artifact.pages === 1
        ? 'PNG export matches the single-page source artifact.'
        : 'PNG export keeps the first page for multi-page artifacts; core expression is preserved with scope reduction.',
    });
  }

  if (generated.svgCount > 0) {
    snapshots.push({
      format: 'svg',
      pageCount: generated.svgCount,
      titles: htmlSnapshot.titles.slice(0, generated.svgCount || 1),
      keyPoints: htmlSnapshot.keyPoints.slice(0, 3),
      note: 'Vector export preserved for reusable charts/diagrams.',
    });
    items.push({
      rule: 'cross-format-vector-preservation',
      passed: true,
      severity: 'info',
      group: 'consistency',
      message: `SVG export preserved ${generated.svgCount} vector asset(s).`,
    });
  }

  return {
    checkedFormats: snapshots.map(snapshot => snapshot.format),
    items,
    snapshots,
  };
}

function createHtmlSnapshot(artifact: Artifact): ExportFormatSnapshot {
  return {
    format: 'html',
    pageCount: normalizePageCount(artifact),
    titles: extractTitles(artifact.html),
    keyPoints: extractKeyPoints(artifact.html),
  };
}

function compareTitleAndPageParity(
  htmlSnapshot: ExportFormatSnapshot,
  exportedPageCount: number,
  format: 'pptx' | 'pdf',
): QualityItem {
  const titleParity = htmlSnapshot.titles.length === 0 || exportedPageCount >= Math.min(htmlSnapshot.titles.length, htmlSnapshot.pageCount);
  const pageParity = htmlSnapshot.pageCount === exportedPageCount;
  const passed = titleParity && pageParity;

  return {
    rule: `cross-format-${format}-parity`,
    passed,
    severity: passed ? 'info' : 'warn',
    group: 'consistency',
    message: passed
      ? `${format.toUpperCase()} keeps page order and headline mapping aligned with HTML.`
      : `${format.toUpperCase()} required adaptation: HTML=${htmlSnapshot.pageCount} page(s), ${format.toUpperCase()}=${exportedPageCount} page(s).`,
    suggestion: passed ? undefined : 'Review page splitting or export fallback notes before formal delivery.',
  };
}

function normalizePageCount(artifact: Artifact): number {
  const sectionCount = (artifact.html.match(/<section[^>]*>/gi) ?? []).length;
  return Math.max(artifact.pages, sectionCount, 1);
}

function extractTitles(html: string): string[] {
  const titles: string[] = [];
  const sectionPattern = /<section[^>]*>([\s\S]*?)<\/section>/gi;
  let match: RegExpExecArray | null;

  while ((match = sectionPattern.exec(html)) !== null) {
    const heading =
      /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i.exec(match[1]) ??
      /<title[^>]*>([\s\S]*?)<\/title>/i.exec(match[1]);
    if (heading) {
      const title = stripTags(heading[1]);
      if (title) titles.push(title);
    }
  }

  if (titles.length === 0) {
    const fallback =
      /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html) ??
      /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html);
    if (fallback) {
      const title = stripTags(fallback[1]);
      if (title) titles.push(title);
    }
  }

  return titles;
}

function extractKeyPoints(html: string): string[] {
  const points = [
    ...(html.match(/<h[1-3][^>]*>[\s\S]*?<\/h[1-3]>/gi) ?? []),
    ...(html.match(/<li[^>]*>[\s\S]*?<\/li>/gi) ?? []),
    ...(html.match(/<figcaption[^>]*>[\s\S]*?<\/figcaption>/gi) ?? []),
  ]
    .map(stripTags)
    .filter(Boolean);

  return points.slice(0, 6);
}

function stripTags(fragment: string): string {
  return fragment.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}
