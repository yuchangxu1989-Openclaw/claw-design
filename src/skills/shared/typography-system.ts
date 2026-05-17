export type TypographyPresetId = 'serif' | 'sans' | 'mono';
export type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5';

export interface TypographyLevel {
  size: string;
  lineHeight: string;
  letterSpacing: string;
  weight: number;
  paragraphSpacing: string;
}

export interface TypographySystem {
  id: TypographyPresetId;
  name: string;
  headingFamily: string;
  bodyFamily: string;
  monoFamily: string;
  headingFallback: string[];
  bodyFallback: string[];
  monoFallback: string[];
  headings: Record<HeadingLevel, TypographyLevel>;
  lead: TypographyLevel;
  body: TypographyLevel;
  caption: TypographyLevel;
  label: TypographyLevel;
  paragraphSpacing: {
    tight: string;
    normal: string;
    relaxed: string;
  };
}

export interface TypographyCssOptions {
  preset?: TypographyPresetId;
  headingFamily?: string;
  bodyFamily?: string;
  monoFamily?: string;
}

const SANS_CJK_STACK = [
  "'Noto Sans SC'",
  "'PingFang SC'",
  "'Hiragino Sans GB'",
  "'Microsoft YaHei'",
  'system-ui',
  'sans-serif',
];

const SERIF_CJK_STACK = [
  "'Noto Serif SC'",
  "'Source Han Serif SC'",
  "'Songti SC'",
  "'STSong'",
  'serif',
];

const MONO_CJK_STACK = [
  "'JetBrains Mono'",
  "'IBM Plex Mono'",
  "'Sarasa Mono SC'",
  "'SFMono-Regular'",
  "'Cascadia Mono'",
  'ui-monospace',
  'monospace',
];

export const TYPOGRAPHY_SYSTEMS: Record<TypographyPresetId, TypographySystem> = {
  serif: {
    id: 'serif',
    name: 'Editorial Serif',
    headingFamily: "'Iowan Old Style', 'Georgia', serif",
    bodyFamily: "'Noto Serif', 'Source Serif 4', serif",
    monoFamily: "'JetBrains Mono', 'IBM Plex Mono', monospace",
    headingFallback: SERIF_CJK_STACK,
    bodyFallback: SERIF_CJK_STACK,
    monoFallback: MONO_CJK_STACK,
    headings: {
      h1: { size: 'clamp(2.8rem, 7vw, 5.4rem)', lineHeight: '0.96', letterSpacing: '-0.045em', weight: 700, paragraphSpacing: '0.52em' },
      h2: { size: 'clamp(2.2rem, 5vw, 3.8rem)', lineHeight: '1.02', letterSpacing: '-0.036em', weight: 700, paragraphSpacing: '0.48em' },
      h3: { size: 'clamp(1.72rem, 3.6vw, 2.7rem)', lineHeight: '1.08', letterSpacing: '-0.026em', weight: 650, paragraphSpacing: '0.4em' },
      h4: { size: 'clamp(1.34rem, 2.8vw, 2rem)', lineHeight: '1.16', letterSpacing: '-0.016em', weight: 650, paragraphSpacing: '0.34em' },
      h5: { size: 'clamp(1.1rem, 2vw, 1.5rem)', lineHeight: '1.24', letterSpacing: '-0.008em', weight: 600, paragraphSpacing: '0.28em' },
    },
    lead: { size: 'clamp(1.05rem, 2vw, 1.3rem)', lineHeight: '1.62', letterSpacing: '-0.012em', weight: 450, paragraphSpacing: '1.05em' },
    body: { size: '1rem', lineHeight: '1.76', letterSpacing: '0em', weight: 400, paragraphSpacing: '0.92em' },
    caption: { size: '0.9rem', lineHeight: '1.58', letterSpacing: '0.01em', weight: 400, paragraphSpacing: '0.68em' },
    label: { size: '0.78rem', lineHeight: '1.38', letterSpacing: '0.12em', weight: 700, paragraphSpacing: '0.4em' },
    paragraphSpacing: {
      tight: '0.56em',
      normal: '0.92em',
      relaxed: '1.24em',
    },
  },
  sans: {
    id: 'sans',
    name: 'Modern Sans',
    headingFamily: "'Inter', 'Manrope', sans-serif",
    bodyFamily: "'Inter', 'Noto Sans', sans-serif",
    monoFamily: "'JetBrains Mono', 'IBM Plex Mono', monospace",
    headingFallback: SANS_CJK_STACK,
    bodyFallback: SANS_CJK_STACK,
    monoFallback: MONO_CJK_STACK,
    headings: {
      h1: { size: 'clamp(2.7rem, 7.2vw, 5.6rem)', lineHeight: '0.94', letterSpacing: '-0.05em', weight: 800, paragraphSpacing: '0.48em' },
      h2: { size: 'clamp(2.1rem, 4.8vw, 3.9rem)', lineHeight: '1', letterSpacing: '-0.04em', weight: 750, paragraphSpacing: '0.42em' },
      h3: { size: 'clamp(1.68rem, 3.4vw, 2.8rem)', lineHeight: '1.08', letterSpacing: '-0.026em', weight: 700, paragraphSpacing: '0.36em' },
      h4: { size: 'clamp(1.3rem, 2.5vw, 2rem)', lineHeight: '1.16', letterSpacing: '-0.016em', weight: 650, paragraphSpacing: '0.3em' },
      h5: { size: 'clamp(1.04rem, 1.8vw, 1.4rem)', lineHeight: '1.22', letterSpacing: '-0.008em', weight: 650, paragraphSpacing: '0.24em' },
    },
    lead: { size: 'clamp(1.02rem, 1.9vw, 1.24rem)', lineHeight: '1.58', letterSpacing: '-0.01em', weight: 450, paragraphSpacing: '1em' },
    body: { size: '1rem', lineHeight: '1.68', letterSpacing: '0em', weight: 400, paragraphSpacing: '0.88em' },
    caption: { size: '0.88rem', lineHeight: '1.54', letterSpacing: '0.004em', weight: 400, paragraphSpacing: '0.62em' },
    label: { size: '0.76rem', lineHeight: '1.32', letterSpacing: '0.14em', weight: 700, paragraphSpacing: '0.36em' },
    paragraphSpacing: {
      tight: '0.5em',
      normal: '0.88em',
      relaxed: '1.18em',
    },
  },
  mono: {
    id: 'mono',
    name: 'Signal Mono',
    headingFamily: "'Space Grotesk', 'JetBrains Mono', sans-serif",
    bodyFamily: "'IBM Plex Sans', 'JetBrains Mono', sans-serif",
    monoFamily: "'JetBrains Mono', 'IBM Plex Mono', monospace",
    headingFallback: [...MONO_CJK_STACK, ...SANS_CJK_STACK],
    bodyFallback: SANS_CJK_STACK,
    monoFallback: MONO_CJK_STACK,
    headings: {
      h1: { size: 'clamp(2.6rem, 6.8vw, 5.3rem)', lineHeight: '0.96', letterSpacing: '-0.04em', weight: 780, paragraphSpacing: '0.48em' },
      h2: { size: 'clamp(2rem, 4.4vw, 3.6rem)', lineHeight: '1.02', letterSpacing: '-0.03em', weight: 730, paragraphSpacing: '0.42em' },
      h3: { size: 'clamp(1.6rem, 3vw, 2.5rem)', lineHeight: '1.1', letterSpacing: '-0.02em', weight: 700, paragraphSpacing: '0.34em' },
      h4: { size: 'clamp(1.24rem, 2.2vw, 1.82rem)', lineHeight: '1.18', letterSpacing: '-0.01em', weight: 650, paragraphSpacing: '0.28em' },
      h5: { size: 'clamp(1rem, 1.7vw, 1.32rem)', lineHeight: '1.24', letterSpacing: '0em', weight: 650, paragraphSpacing: '0.22em' },
    },
    lead: { size: 'clamp(1rem, 1.8vw, 1.18rem)', lineHeight: '1.54', letterSpacing: '-0.008em', weight: 500, paragraphSpacing: '0.94em' },
    body: { size: '0.98rem', lineHeight: '1.7', letterSpacing: '0em', weight: 420, paragraphSpacing: '0.82em' },
    caption: { size: '0.86rem', lineHeight: '1.5', letterSpacing: '0.02em', weight: 450, paragraphSpacing: '0.58em' },
    label: { size: '0.74rem', lineHeight: '1.32', letterSpacing: '0.16em', weight: 700, paragraphSpacing: '0.34em' },
    paragraphSpacing: {
      tight: '0.48em',
      normal: '0.82em',
      relaxed: '1.12em',
    },
  },
};

export function getTypographySystem(id: TypographyPresetId = 'sans'): TypographySystem {
  return TYPOGRAPHY_SYSTEMS[id] ?? TYPOGRAPHY_SYSTEMS.sans;
}

export function getTypographyTokenDeclarations(options: TypographyCssOptions = {}): string {
  const system = getTypographySystem(options.preset ?? 'sans');
  const headingFamily = buildFontStack(options.headingFamily ?? system.headingFamily, system.headingFallback);
  const bodyFamily = buildFontStack(options.bodyFamily ?? system.bodyFamily, system.bodyFallback);
  const monoFamily = buildFontStack(options.monoFamily ?? system.monoFamily, system.monoFallback);

  return [
    `--cd-font-heading: ${headingFamily};`,
    `--cd-font-body: ${bodyFamily};`,
    `--cd-font-mono: ${monoFamily};`,
    `--cd-paragraph-gap-tight: ${system.paragraphSpacing.tight};`,
    `--cd-paragraph-gap: ${system.paragraphSpacing.normal};`,
    `--cd-paragraph-gap-relaxed: ${system.paragraphSpacing.relaxed};`,
    `--cd-reading-measure: 64ch;`,
    `--cd-reading-measure-wide: 78ch;`,
    `--cd-reading-measure-compact: 42ch;`,
    `--cd-cjk-leading-trim: 0.08em;`,
    ...Object.entries(system.headings).flatMap(([level, spec]) => [
      `--cd-type-${level}-size: ${spec.size};`,
      `--cd-type-${level}-line-height: ${spec.lineHeight};`,
      `--cd-type-${level}-letter-spacing: ${spec.letterSpacing};`,
      `--cd-type-${level}-weight: ${spec.weight};`,
      `--cd-type-${level}-paragraph-gap: ${spec.paragraphSpacing};`,
    ]),
    `--cd-type-lead-size: ${system.lead.size};`,
    `--cd-type-lead-line-height: ${system.lead.lineHeight};`,
    `--cd-type-lead-letter-spacing: ${system.lead.letterSpacing};`,
    `--cd-type-lead-weight: ${system.lead.weight};`,
    `--cd-type-body-size: ${system.body.size};`,
    `--cd-type-body-line-height: ${system.body.lineHeight};`,
    `--cd-type-body-letter-spacing: ${system.body.letterSpacing};`,
    `--cd-type-body-weight: ${system.body.weight};`,
    `--cd-type-caption-size: ${system.caption.size};`,
    `--cd-type-caption-line-height: ${system.caption.lineHeight};`,
    `--cd-type-caption-letter-spacing: ${system.caption.letterSpacing};`,
    `--cd-type-caption-weight: ${system.caption.weight};`,
    `--cd-type-label-size: ${system.label.size};`,
    `--cd-type-label-line-height: ${system.label.lineHeight};`,
    `--cd-type-label-letter-spacing: ${system.label.letterSpacing};`,
    `--cd-type-label-weight: ${system.label.weight};`,
  ].join('\n      ');
}

export function getTypographyUtilityCss(options: TypographyCssOptions = {}): string {
  const system = getTypographySystem(options.preset ?? 'sans');

  return `
    .cd-heading-1,
    .cd-heading-2,
    .cd-heading-3,
    .cd-heading-4,
    .cd-heading-5,
    .cd-display {
      margin: 0;
      font-family: var(--cd-font-heading);
      text-wrap: balance;
    }
    .cd-heading-1,
    .cd-display {
      font-size: var(--cd-type-h1-size);
      line-height: var(--cd-type-h1-line-height);
      letter-spacing: var(--cd-type-h1-letter-spacing);
      font-weight: var(--cd-type-h1-weight);
    }
    .cd-heading-2 {
      font-size: var(--cd-type-h2-size);
      line-height: var(--cd-type-h2-line-height);
      letter-spacing: var(--cd-type-h2-letter-spacing);
      font-weight: var(--cd-type-h2-weight);
    }
    .cd-heading-3 {
      font-size: var(--cd-type-h3-size);
      line-height: var(--cd-type-h3-line-height);
      letter-spacing: var(--cd-type-h3-letter-spacing);
      font-weight: var(--cd-type-h3-weight);
    }
    .cd-heading-4 {
      font-size: var(--cd-type-h4-size);
      line-height: var(--cd-type-h4-line-height);
      letter-spacing: var(--cd-type-h4-letter-spacing);
      font-weight: var(--cd-type-h4-weight);
    }
    .cd-heading-5 {
      font-size: var(--cd-type-h5-size);
      line-height: var(--cd-type-h5-line-height);
      letter-spacing: var(--cd-type-h5-letter-spacing);
      font-weight: var(--cd-type-h5-weight);
    }
    .cd-lead {
      margin: 0;
      font-family: var(--cd-font-body);
      font-size: var(--cd-type-lead-size);
      line-height: var(--cd-type-lead-line-height);
      letter-spacing: var(--cd-type-lead-letter-spacing);
      font-weight: var(--cd-type-lead-weight);
      max-width: var(--cd-reading-measure);
    }
    .cd-copy {
      font-family: var(--cd-font-body);
      font-size: var(--cd-type-body-size);
      line-height: var(--cd-type-body-line-height);
      letter-spacing: var(--cd-type-body-letter-spacing);
      font-weight: var(--cd-type-body-weight);
      max-width: var(--cd-reading-measure);
    }
    .cd-copy > p {
      margin: 0;
    }
    .cd-copy > p + p {
      margin-top: var(--cd-paragraph-gap);
    }
    .cd-caption {
      margin: 0;
      font-family: var(--cd-font-body);
      font-size: var(--cd-type-caption-size);
      line-height: var(--cd-type-caption-line-height);
      letter-spacing: var(--cd-type-caption-letter-spacing);
      font-weight: var(--cd-type-caption-weight);
    }
    .cd-label {
      margin: 0;
      font-family: var(--cd-font-mono);
      font-size: var(--cd-type-label-size);
      line-height: var(--cd-type-label-line-height);
      letter-spacing: var(--cd-type-label-letter-spacing);
      font-weight: var(--cd-type-label-weight);
      text-transform: uppercase;
    }
    .cd-mono {
      font-family: var(--cd-font-mono);
    }
    .cd-cjk-mix {
      font-family: var(--cd-font-body);
      word-break: normal;
      overflow-wrap: anywhere;
      line-break: auto;
      text-rendering: optimizeLegibility;
      font-variant-east-asian: proportional-width;
    }
    .cd-cjk-mix h1,
    .cd-cjk-mix h2,
    .cd-cjk-mix h3,
    .cd-cjk-mix h4,
    .cd-cjk-mix h5,
    .cd-cjk-mix .cd-heading-1,
    .cd-cjk-mix .cd-heading-2,
    .cd-cjk-mix .cd-heading-3,
    .cd-cjk-mix .cd-heading-4,
    .cd-cjk-mix .cd-heading-5 {
      text-wrap: balance;
      margin-block-end: ${system.headings.h3.paragraphSpacing};
    }
    .cd-cjk-mix p,
    .cd-cjk-mix li,
    .cd-cjk-mix blockquote {
      hanging-punctuation: first allow-end last;
    }
  `;
}

function buildFontStack(primary: string, fallback: string[]): string {
  return [primary, ...fallback].join(', ');
}
