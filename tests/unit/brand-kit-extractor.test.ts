import { describe, expect, it } from 'vitest';
import { BrandKitExtractor, type BrandKitSource } from '../../src/template/brand-kit-extractor.js';

const extractor = new BrandKitExtractor();

function extractFrom(...sources: BrandKitSource[]) {
  return extractor.extract(sources);
}

describe('BrandKitExtractor (FR-E02)', () => {
  it('extracts colors, fonts, spacing rhythm and logo selectors from html and css sources', () => {
    const result = extractFrom(
      {
        kind: 'html',
        content: `
          <html>
            <head>
              <style>
                :root {
                  --brand-color-primary: #123456;
                  --brand-color-accent: rgba(255, 0, 0, 0.8);
                  --brand-font-heading: 'Inter', sans-serif;
                  --brand-spacing-unit: 24px;
                }
                body { font-family: 'Inter', sans-serif; color: #123456; }
                .hero { padding: 24px 32px; gap: 16px; }
              </style>
            </head>
            <body>
              <header>
                <img id="brand-logo" class="brand-logo mark" data-brand-logo alt="Acme Logo" src="/assets/logo.svg" />
              </header>
              <section class="hero"><h1>Acme</h1></section>
              <section><p>Second page</p></section>
            </body>
          </html>
        `,
      },
      {
        kind: 'css',
        content: `.card { margin: 24px; font-family: "IBM Plex Sans", sans-serif; color: #123456; }`,
      },
      {
        kind: 'artifact',
        path: '/tmp/brand-logo.svg',
        content: '<div class="logo-lockup"></div>',
      }
    );

    expect(result.confirmationStatus).toBe('inferred');
    expect(result.colors).toEqual(expect.arrayContaining(['#123456', 'rgba(255, 0, 0, 0.8)']));
    expect(result.fonts).toEqual(expect.arrayContaining(['Inter', 'IBM Plex Sans']));
    expect(result.logo?.required).toBe(true);
    expect(result.logo?.selectors).toEqual(expect.arrayContaining(['#brand-logo', '.brand-logo', '[data-brand-logo]', '/tmp/brand-logo.svg']));
    expect(result.logo?.alt).toBe('Acme Logo');
    expect(result.layoutRhythm?.maxSectionsPerPage).toBe(2);
    expect(result.evidence.spacing).toEqual(expect.arrayContaining(['24px', '16px', '32px']));
  });

  it('returns structured inferred brand kit from css-only material', () => {
    const result = extractFrom({
      kind: 'css',
      content: `
        :root {
          --brand-color-primary: #0f172a;
          --brand-color-secondary: #38bdf8;
          --brand-font-body: 'Source Sans Pro', sans-serif;
          --brand-spacing-lg: 40px;
        }
        .deck { color: #0f172a; font-family: 'Source Sans Pro', sans-serif; padding: 40px 20px; }
      `,
    });

    expect(result.colors).toEqual(expect.arrayContaining(['#0f172a', '#38bdf8']));
    expect(result.fonts).toContain('Source Sans Pro');
    expect(result.logo).toBeUndefined();
    expect(result.evidence.spacing).toEqual(expect.arrayContaining(['40px', '20px']));
  });

  it('infers maxSectionsPerPage correctly with explicit page markers', () => {
    const result = extractFrom({
      kind: 'html',
      content: `
        <div class="slide">
          <section><h1>A</h1></section>
          <section><p>B</p></section>
          <section><p>C</p></section>
        </div>
        <div class="slide">
          <section><p>D</p></section>
          <section><p>E</p></section>
        </div>
      `,
    });
    // 5 sections, 2 page markers → ceil(5/2) = 3
    expect(result.layoutRhythm?.maxSectionsPerPage).toBe(3);
  });

  it('infers maxSectionsPerPage as total sections when no page markers exist', () => {
    const result = extractFrom({
      kind: 'html',
      content: `
        <section><h1>One</h1></section>
        <section><p>Two</p></section>
        <section><p>Three</p></section>
        <section><p>Four</p></section>
        <section><p>Five</p></section>
      `,
    });
    // 5 sections, 0 page markers → pages=1 → ceil(5/1) = 5
    expect(result.layoutRhythm?.maxSectionsPerPage).toBe(5);
  });

  it('returns layoutRhythm undefined when no sections exist', () => {
    const result = extractFrom({
      kind: 'html',
      content: '<div><p>No sections here</p></div>',
    });
    expect(result.layoutRhythm).toBeUndefined();
  });
});
