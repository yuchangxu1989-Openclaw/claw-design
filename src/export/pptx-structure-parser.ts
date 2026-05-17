// pptx-structure-parser.ts — Parse HTML slide sections into structured blocks for PPTX generation.
// Reads data-slide-type / data-slide-index semantic attributes from slides-skill output.

export interface PptxBlock {
  type: 'heading' | 'paragraph' | 'bullet-list' | 'ordered-list';
  text: string;
  level?: number;       // heading: 1-3, list: indent level
  items?: string[];     // list items
  bold?: boolean;
}

export interface PptxSlideBlocks {
  index: number;
  slideType: string;    // from data-slide-type attribute (title|toc|content|comparison|chart|summary)
  title: string;        // from first heading or fallback
  blocks: PptxBlock[];
  /** For comparison slides: left column items */
  leftItems?: string[];
  /** For comparison slides: right column items */
  rightItems?: string[];
  /** For comparison slides: left column heading */
  leftHeading?: string;
  /** For comparison slides: right column heading */
  rightHeading?: string;
}

const SECTION_PATTERN = /<section[^>]*>[\s\S]*?<\/section>/gi;
const DATA_SLIDE_TYPE_PATTERN = /data-slide-type=["']([^"']+)["']/i;
const DATA_SLIDE_INDEX_PATTERN = /data-slide-index=["']([^"']+)["']/i;
const HEADING_PATTERN = /<(h[1-6])[^>]*>([\s\S]*?)<\/\1>/gi;
const PARAGRAPH_PATTERN = /<p[^>]*>([\s\S]*?)<\/p>/gi;
const UL_PATTERN = /<ul[^>]*>([\s\S]*?)<\/ul>/gi;
const OL_PATTERN = /<ol[^>]*>([\s\S]*?)<\/ol>/gi;
const LI_PATTERN = /<li[^>]*>([\s\S]*?)<\/li>/gi;

/**
 * Parse HTML into structured slide blocks for PPTX generation.
 * Reads data-slide-type and data-slide-index attributes when available.
 */
export function parseHtmlToSlideBlocks(html: string): PptxSlideBlocks[] {
  const sections = html.match(SECTION_PATTERN) ?? [];
  if (sections.length === 0) {
    return [];
  }

  return sections.map((sectionHtml, fallbackIndex) => {
    const slideType = extractAttribute(sectionHtml, DATA_SLIDE_TYPE_PATTERN) ?? 'content';
    const slideIndex = parseInt(extractAttribute(sectionHtml, DATA_SLIDE_INDEX_PATTERN) ?? '', 10);
    const index = isNaN(slideIndex) ? fallbackIndex + 1 : slideIndex;

    if (slideType === 'comparison') {
      return parseComparisonSlide(sectionHtml, index);
    }

    const blocks = parseBlocks(sectionHtml);
    const title = extractSlideTitle(blocks, slideType, index);

    return { index, slideType, title, blocks };
  });
}

/** Parse a comparison slide with left/right column structure */
function parseComparisonSlide(sectionHtml: string, index: number): PptxSlideBlocks {
  const blocks = parseBlocks(sectionHtml);
  const title = extractSlideTitle(blocks, 'comparison', index);

  // Try to detect dual-column structure from the HTML
  // Look for elements with class containing "left"/"right" or two adjacent lists
  const leftMatch = /<div[^>]*class=["'][^"']*left[^"']*["'][^>]*>([\s\S]*?)<\/div>/i.exec(sectionHtml);
  const rightMatch = /<div[^>]*class=["'][^"']*right[^"']*["'][^>]*>([\s\S]*?)<\/div>/i.exec(sectionHtml);

  let leftItems: string[] = [];
  let rightItems: string[] = [];
  let leftHeading = '';
  let rightHeading = '';

  if (leftMatch && rightMatch) {
    const leftBlocks = parseBlocks(leftMatch[1]);
    const rightBlocks = parseBlocks(rightMatch[1]);
    leftHeading = extractColumnHeading(leftBlocks);
    rightHeading = extractColumnHeading(rightBlocks);
    leftItems = extractListItems(leftBlocks);
    rightItems = extractListItems(rightBlocks);
  } else {
    // Fallback: split lists evenly if we find multiple lists
    const listBlocks = blocks.filter(b => b.type === 'bullet-list' || b.type === 'ordered-list');
    if (listBlocks.length >= 2) {
      leftItems = listBlocks[0].items ?? [];
      rightItems = listBlocks[1].items ?? [];
      // Try to find headings before each list
      const headings = blocks.filter(b => b.type === 'heading');
      if (headings.length >= 3) {
        // First heading is slide title, next two are column headings
        leftHeading = headings[1].text;
        rightHeading = headings[2].text;
      }
    } else if (listBlocks.length === 1 && listBlocks[0].items) {
      // Single list: split in half
      const items = listBlocks[0].items;
      const mid = Math.ceil(items.length / 2);
      leftItems = items.slice(0, mid);
      rightItems = items.slice(mid);
    }
  }

  return {
    index,
    slideType: 'comparison',
    title,
    blocks,
    leftItems,
    rightItems,
    leftHeading,
    rightHeading,
  };
}

/** Parse HTML content into ordered blocks */
function parseBlocks(html: string): PptxBlock[] {
  const blocks: PptxBlock[] = [];

  // Strip <style> and <script> tags before parsing
  const cleaned = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

  // Use a sequential scan approach: find all block-level elements in order
  const blockPattern = /<(h[1-6]|p|ul|ol)(\s[^>]*)?>[\s\S]*?<\/\1>/gi;
  let match: RegExpExecArray | null;

  while ((match = blockPattern.exec(cleaned)) !== null) {
    const tagName = match[1].toLowerCase();
    const content = match[0];

    if (tagName.startsWith('h')) {
      const level = parseInt(tagName[1], 10);
      const text = stripHtml(extractInnerContent(content, tagName));
      if (text) {
        blocks.push({ type: 'heading', text, level, bold: true });
      }
    } else if (tagName === 'p') {
      const text = stripHtml(extractInnerContent(content, tagName));
      if (text) {
        blocks.push({ type: 'paragraph', text });
      }
    } else if (tagName === 'ul') {
      const inner = extractInnerContent(content, 'ul');
      const items = extractItems(inner);
      if (items.length > 0) {
        blocks.push({ type: 'bullet-list', text: items.join('; '), items });
      }
    } else if (tagName === 'ol') {
      const inner = extractInnerContent(content, 'ol');
      const items = extractItems(inner);
      if (items.length > 0) {
        blocks.push({ type: 'ordered-list', text: items.join('; '), items });
      }
    }
  }

  // If no block-level elements found, extract raw text as a paragraph
  if (blocks.length === 0) {
    const text = stripHtml(cleaned).trim();
    if (text) {
      blocks.push({ type: 'paragraph', text });
    }
  }

  return blocks;
}

/** Extract the title from parsed blocks or generate a fallback */
function extractSlideTitle(blocks: PptxBlock[], slideType: string, index: number): string {
  const firstHeading = blocks.find(b => b.type === 'heading');
  if (firstHeading) {
    return firstHeading.text;
  }

  // Fallback based on slide type
  const typeLabels: Record<string, string> = {
    title: 'Title',
    toc: 'Table of Contents',
    content: `Slide ${index}`,
    comparison: 'Comparison',
    chart: 'Chart',
    summary: 'Summary',
  };

  return typeLabels[slideType] ?? `Slide ${index}`;
}

/** Extract column heading from blocks (first heading that isn't the slide title) */
function extractColumnHeading(blocks: PptxBlock[]): string {
  const heading = blocks.find(b => b.type === 'heading');
  return heading?.text ?? '';
}

/** Extract all list items from blocks */
function extractListItems(blocks: PptxBlock[]): string[] {
  const items: string[] = [];
  for (const block of blocks) {
    if ((block.type === 'bullet-list' || block.type === 'ordered-list') && block.items) {
      items.push(...block.items);
    }
  }
  // If no list blocks, collect paragraph text
  if (items.length === 0) {
    for (const block of blocks) {
      if (block.type === 'paragraph') {
        items.push(block.text);
      }
    }
  }
  return items;
}

/** Extract list items from <li> elements */
function extractItems(listInnerHtml: string): string[] {
  const items: string[] = [];
  let liMatch: RegExpExecArray | null;
  const liPattern = new RegExp(LI_PATTERN.source, 'gi');

  while ((liMatch = liPattern.exec(listInnerHtml)) !== null) {
    const text = stripHtml(liMatch[1]).trim();
    if (text) {
      items.push(text);
    }
  }

  return items;
}

/** Extract inner content of a tag (content between opening and closing tag) */
function extractInnerContent(fullMatch: string, tagName: string): string {
  const openPattern = new RegExp(`^<${tagName}[^>]*>`, 'i');
  const closePattern = new RegExp(`</${tagName}>$`, 'i');
  return fullMatch.replace(openPattern, '').replace(closePattern, '');
}

/** Extract a regex attribute value from HTML */
function extractAttribute(html: string, pattern: RegExp): string | null {
  const match = pattern.exec(html);
  return match?.[1] ?? null;
}

/** Strip HTML tags and decode basic entities */
function stripHtml(value: string): string {
  return decodeEntities(
    value
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  );
}

/** Decode common HTML entities */
function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}
