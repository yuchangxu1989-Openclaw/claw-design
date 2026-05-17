import { describe, expect, it } from 'vitest';
import { parseHtmlToSlideBlocks } from '../../src/export/pptx-structure-parser.js';
import type { PptxBlock, PptxSlideBlocks } from '../../src/export/pptx-structure-parser.js';

describe('parseHtmlToSlideBlocks', () => {
  it('returns empty array when no sections exist', () => {
    const result = parseHtmlToSlideBlocks('<div><p>No sections</p></div>');
    expect(result).toEqual([]);
  });

  it('parses data-slide-type and data-slide-index attributes', () => {
    const html = `
      <section class="slide" data-slide-type="title" data-slide-index="1">
        <h1>Welcome</h1>
        <p>Introduction text</p>
      </section>
      <section class="slide" data-slide-type="toc" data-slide-index="2">
        <h2>Table of Contents</h2>
        <ol><li>Chapter 1</li><li>Chapter 2</li></ol>
      </section>
    `;
    const slides = parseHtmlToSlideBlocks(html);

    expect(slides).toHaveLength(2);
    expect(slides[0].slideType).toBe('title');
    expect(slides[0].index).toBe(1);
    expect(slides[0].title).toBe('Welcome');
    expect(slides[1].slideType).toBe('toc');
    expect(slides[1].index).toBe(2);
    expect(slides[1].title).toBe('Table of Contents');
  });

  it('defaults to content type and sequential index when attributes missing', () => {
    const html = `
      <section><h1>First</h1><p>Body</p></section>
      <section><h2>Second</h2><p>More</p></section>
    `;
    const slides = parseHtmlToSlideBlocks(html);

    expect(slides).toHaveLength(2);
    expect(slides[0].slideType).toBe('content');
    expect(slides[0].index).toBe(1);
    expect(slides[1].slideType).toBe('content');
    expect(slides[1].index).toBe(2);
  });

  it('extracts heading blocks with correct level and bold flag', () => {
    const html = `
      <section data-slide-type="content" data-slide-index="1">
        <h1>Main Title</h1>
        <h2>Subtitle</h2>
        <h3>Section</h3>
      </section>
    `;
    const slides = parseHtmlToSlideBlocks(html);
    const blocks = slides[0].blocks;

    expect(blocks).toHaveLength(3);
    expect(blocks[0]).toEqual({ type: 'heading', text: 'Main Title', level: 1, bold: true });
    expect(blocks[1]).toEqual({ type: 'heading', text: 'Subtitle', level: 2, bold: true });
    expect(blocks[2]).toEqual({ type: 'heading', text: 'Section', level: 3, bold: true });
  });

  it('extracts paragraph blocks', () => {
    const html = `
      <section data-slide-type="content" data-slide-index="1">
        <h1>Title</h1>
        <p>First paragraph with some text.</p>
        <p>Second paragraph.</p>
      </section>
    `;
    const slides = parseHtmlToSlideBlocks(html);
    const blocks = slides[0].blocks;

    expect(blocks).toHaveLength(3);
    expect(blocks[1]).toEqual({ type: 'paragraph', text: 'First paragraph with some text.' });
    expect(blocks[2]).toEqual({ type: 'paragraph', text: 'Second paragraph.' });
  });

  it('extracts bullet list blocks with items', () => {
    const html = `
      <section data-slide-type="content" data-slide-index="1">
        <h2>Features</h2>
        <ul>
          <li>Fast performance</li>
          <li>Easy to use</li>
          <li>Extensible</li>
        </ul>
      </section>
    `;
    const slides = parseHtmlToSlideBlocks(html);
    const blocks = slides[0].blocks;

    expect(blocks).toHaveLength(2);
    expect(blocks[1].type).toBe('bullet-list');
    expect(blocks[1].items).toEqual(['Fast performance', 'Easy to use', 'Extensible']);
  });

  it('extracts ordered list blocks with items', () => {
    const html = `
      <section data-slide-type="toc" data-slide-index="2">
        <h2>Agenda</h2>
        <ol>
          <li>Introduction</li>
          <li>Main Topic</li>
          <li>Conclusion</li>
        </ol>
      </section>
    `;
    const slides = parseHtmlToSlideBlocks(html);
    const blocks = slides[0].blocks;

    expect(blocks).toHaveLength(2);
    expect(blocks[1].type).toBe('ordered-list');
    expect(blocks[1].items).toEqual(['Introduction', 'Main Topic', 'Conclusion']);
  });

  it('strips style and script tags before parsing', () => {
    const html = `
      <section data-slide-type="content" data-slide-index="1">
        <style>.slide { color: red; }</style>
        <script>console.log('hi');</script>
        <h1>Clean Title</h1>
        <p>Clean body</p>
      </section>
    `;
    const slides = parseHtmlToSlideBlocks(html);
    const blocks = slides[0].blocks;

    expect(blocks).toHaveLength(2);
    expect(blocks[0].text).toBe('Clean Title');
    expect(blocks[1].text).toBe('Clean body');
  });

  it('falls back to raw text as paragraph when no block elements found', () => {
    const html = `<section data-slide-type="content" data-slide-index="1">Just plain text content here</section>`;
    const slides = parseHtmlToSlideBlocks(html);

    expect(slides[0].blocks).toHaveLength(1);
    expect(slides[0].blocks[0].type).toBe('paragraph');
    expect(slides[0].blocks[0].text).toBe('Just plain text content here');
  });

  describe('comparison slides', () => {
    it('parses comparison slide with left/right class-based columns', () => {
      const html = `
        <section class="slide" data-slide-type="comparison" data-slide-index="3">
          <h1>React vs Vue</h1>
          <div class="comparison-left">
            <h3>React</h3>
            <ul><li>Virtual DOM</li><li>JSX</li><li>Large ecosystem</li></ul>
          </div>
          <div class="comparison-right">
            <h3>Vue</h3>
            <ul><li>Reactive</li><li>Templates</li><li>Easy learning curve</li></ul>
          </div>
        </section>
      `;
      const slides = parseHtmlToSlideBlocks(html);

      expect(slides).toHaveLength(1);
      expect(slides[0].slideType).toBe('comparison');
      expect(slides[0].title).toBe('React vs Vue');
      expect(slides[0].leftHeading).toBe('React');
      expect(slides[0].rightHeading).toBe('Vue');
      expect(slides[0].leftItems).toEqual(['Virtual DOM', 'JSX', 'Large ecosystem']);
      expect(slides[0].rightItems).toEqual(['Reactive', 'Templates', 'Easy learning curve']);
    });

    it('splits two adjacent lists as left/right columns', () => {
      const html = `
        <section class="slide" data-slide-type="comparison" data-slide-index="2">
          <h1>Pros vs Cons</h1>
          <h2>Advantages</h2>
          <ul><li>Fast</li><li>Reliable</li></ul>
          <h2>Disadvantages</h2>
          <ul><li>Expensive</li><li>Complex</li></ul>
        </section>
      `;
      const slides = parseHtmlToSlideBlocks(html);

      expect(slides[0].slideType).toBe('comparison');
      expect(slides[0].leftItems).toEqual(['Fast', 'Reliable']);
      expect(slides[0].rightItems).toEqual(['Expensive', 'Complex']);
      // First heading is title, next two are column headings
      expect(slides[0].leftHeading).toBe('Advantages');
      expect(slides[0].rightHeading).toBe('Disadvantages');
    });

    it('splits single list in half when only one list exists', () => {
      const html = `
        <section class="slide" data-slide-type="comparison" data-slide-index="1">
          <h1>Split View</h1>
          <ul><li>A</li><li>B</li><li>C</li><li>D</li></ul>
        </section>
      `;
      const slides = parseHtmlToSlideBlocks(html);

      expect(slides[0].leftItems).toEqual(['A', 'B']);
      expect(slides[0].rightItems).toEqual(['C', 'D']);
    });
  });

  describe('slide type title extraction', () => {
    it('uses first heading as title', () => {
      const html = `<section data-slide-type="summary" data-slide-index="5"><h2>Key Takeaways</h2><p>Remember these points.</p></section>`;
      const slides = parseHtmlToSlideBlocks(html);
      expect(slides[0].title).toBe('Key Takeaways');
    });

    it('generates fallback title from slide type when no heading', () => {
      const html = `<section data-slide-type="chart" data-slide-index="4"><p>Some chart data</p></section>`;
      const slides = parseHtmlToSlideBlocks(html);
      expect(slides[0].title).toBe('Chart');
    });

    it('generates indexed fallback for content type without heading', () => {
      const html = `<section data-slide-type="content" data-slide-index="7"><p>Body only</p></section>`;
      const slides = parseHtmlToSlideBlocks(html);
      expect(slides[0].title).toBe('Slide 7');
    });
  });

  it('decodes HTML entities in text content', () => {
    const html = `<section data-slide-type="content" data-slide-index="1"><h1>Tom &amp; Jerry</h1><p>A &lt;great&gt; show</p></section>`;
    const slides = parseHtmlToSlideBlocks(html);

    expect(slides[0].blocks[0].text).toBe('Tom & Jerry');
    expect(slides[0].blocks[1].text).toBe('A <great> show');
  });

  it('handles mixed block types in correct order', () => {
    const html = `
      <section data-slide-type="content" data-slide-index="1">
        <h1>Overview</h1>
        <p>Introduction paragraph.</p>
        <ul><li>Point A</li><li>Point B</li></ul>
        <h2>Details</h2>
        <ol><li>Step 1</li><li>Step 2</li></ol>
        <p>Closing remarks.</p>
      </section>
    `;
    const slides = parseHtmlToSlideBlocks(html);
    const types = slides[0].blocks.map(b => b.type);

    expect(types).toEqual([
      'heading',
      'paragraph',
      'bullet-list',
      'heading',
      'ordered-list',
      'paragraph',
    ]);
  });
});
