// FR-G03: Built-in dark-sci-fi design system package
// Extracted from /var/www/html/harness-design/claw-design.html
import type { DesignSystemPackage } from '../../types.js';

export const DARK_SCI_FI_PACKAGE: DesignSystemPackage = {
  id: 'dark-sci-fi',
  name: 'Dark Sci-Fi',
  version: '1.0.0',
  description: 'Deep purple/pink futuristic theme with neon accents — the default Claw Design visual identity',

  tokens: {
    colors: {
      'bg': '#0b0612',
      'bg2': '#25105c',
      'accent-a': '#ec4899',
      'accent-b': '#7dd3fc',
      'accent-c': '#facc15',
      'ink': '#f8fbff',
      'muted': '#b7c4d9',
      'soft': '#8ea1bd',
      'line': 'rgba(255,255,255,.14)',
      'panel': 'rgba(255,255,255,.075)',
      'panel2': 'rgba(255,255,255,.12)',
      'warm': '#ffd166',
    },
    spacing: {
      unit: '8px',
      values: {
        'xs': '4px',
        'sm': '8px',
        'md': '14px',
        'lg': '20px',
        'xl': '28px',
        '2xl': '34px',
        '3xl': '42px',
      },
    },
    typography: {
      fontFamily: {
        heading: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        body: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      },
      sizes: {
        'xs': '11px',
        'sm': '12px',
        'base': '14px',
        'md': '15px',
        'lg': '16px',
        'xl': '21px',
        '2xl': '25px',
        '3xl': 'clamp(28px, 3.4vw, 44px)',
        '4xl': 'clamp(42px, 5.1vw, 68px)',
      },
      weights: {
        'normal': '400',
        'medium': '500',
      },
      lineHeights: {
        'tight': '1.02',
        'snug': '1.12',
        'normal': '1.42',
        'relaxed': '1.62',
        'loose': '1.68',
      },
    },
    radius: {
      'sm': '10px',
      'md': '15px',
      'lg': '19px',
      'xl': '24px',
      '2xl': '26px',
      '3xl': '30px',
      'full': '999px',
    },
    shadows: {
      'card': '0 34px 92px rgba(0,0,0,.42)',
      'glow-a': '0 20px 48px color-mix(in srgb, var(--accent-a) 20%, transparent)',
      'dropdown': '0 22px 54px rgba(0,0,0,.35)',
    },
    opacity: {
      'subtle': '0.045',
      'light': '0.075',
      'medium': '0.12',
      'strong': '0.14',
    },
  },

  components: [
    {
      name: 'button',
      selector: '.btn-primary',
      properties: {
        'background': '#0b0612',
        'color': '#ffffff',
        'border-radius': '15px',
        'padding': '10px 20px',
        'font-family': 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        'font-weight': '600',
        'border': 'none',
        'cursor': 'pointer'
      },
    },
    {
      name: 'card',
      selector: '.card',
      properties: {
        'background': '#ffffff',
        'border-radius': '10px',
        'box-shadow': '0 4px 6px rgba(0,0,0,0.1)',
        'padding': '24px',
        'border': 'none'
      },
    },
    {
      name: 'input',
      selector: '.input',
      properties: {
        'background': '#ffffff',
        'border': '1px solid #0b0612',
        'border-radius': '10px',
        'padding': '10px 14px',
        'font-family': 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        'font-size': '14px',
        'color': '#0b0612'
      },
    },
    {
      name: 'heading',
      selector: 'h1, h2, h3',
      properties: {
        'font-family': 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        'font-weight': '700',
        'color': '#0b0612',
        'line-height': '1.2',
        'margin': '0 0 16px 0'
      },
    },
    {
      name: 'link',
      selector: 'a',
      properties: {
        'color': '#0b0612',
        'text-decoration': 'underline',
        'font-family': 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        'font-weight': '500',
        'cursor': 'pointer'
      },
    }
  ],

  reference: {
    html: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Dark Sci-Fi — Design System Reference</title>
<style>
:root {
  --bg: #0b0612;
  --bg2: #25105c;
  --accent-a: #ec4899;
  --accent-b: #7dd3fc;
  --accent-c: #facc15;
  --ink: #f8fbff;
  --muted: #b7c4d9;
  --panel: rgba(255,255,255,.075);
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: Inter, ui-sans-serif, system-ui, sans-serif; background: var(--bg); color: var(--ink); padding: 40px 24px; max-width: 960px; margin: 0 auto; }
h1 { font-size: 28px; margin-bottom: 8px; color: var(--accent-a); }
h2 { font-size: 20px; margin: 32px 0 12px; border-bottom: 1px solid var(--panel); padding-bottom: 8px; }
.card { background: var(--panel); border-radius: 16px; padding: 24px; margin: 12px 0; }
.btn { background: var(--accent-a); color: var(--bg); border: none; border-radius: 999px; padding: 10px 20px; font-weight: 600; cursor: pointer; }
.swatch { display: inline-block; width: 60px; height: 60px; border-radius: 8px; margin: 4px; }
</style>
</head>
<body>
<h1>Dark Sci-Fi</h1>
<p style="color:var(--muted)">Design System Reference — Package ID: dark-sci-fi</p>
<h2>Colors</h2>
<div class="swatch" style="background:var(--accent-a)"></div>
<div class="swatch" style="background:var(--accent-b)"></div>
<div class="swatch" style="background:var(--accent-c)"></div>
<div class="swatch" style="background:var(--bg2)"></div>
<h2>Components</h2>
<div class="card"><h3>Card Component</h3><p style="color:var(--muted)">Panel with brand radius and background.</p></div>
<button class="btn">Primary Button</button>
</body>
</html>`,
  },

  constraints: {
    enforce: [
      {
        id: 'color-palette-limit',
        description: 'Only use colors defined in the brand palette',
        check: (html, pkg) => {
          const hexRe = /#[0-9a-fA-F]{6}\b/g;
          const paletteColors = new Set(Object.values(pkg.tokens.colors).map(c => c.toLowerCase()));
          let m: RegExpExecArray | null;
          while ((m = hexRe.exec(html)) !== null) {
            if (!paletteColors.has(m[0].toLowerCase())) {
              return {
                ruleId: 'color-palette-limit',
                message: `Color ${m[0]} is not in the brand palette`,
                severity: 'block' as const,
              };
            }
          }
          return null;
        },
      },
      {
        id: 'typographyStack',
        description: 'Only use brand-defined font families',
        check: (_html, _pkg) => null,
      },
      {
        id: 'spacingScale',
        description: 'Spacing must be multiples of base unit (8px)',
        check: (_html, _pkg) => null,
      },
      {
        id: 'borderRadiusRange',
        description: 'Border radius must use defined scale values',
        check: (_html, _pkg) => null,
      },
    ],
    forbid: [
      {
        id: 'no-rgb-hsl-colors',
        description: 'Do not use rgb() or hsl() color functions — use hex or CSS variables',
        check: (html, _pkg) => {
          if (/(?:rgb|hsl)a?\s*\(/i.test(html)) {
            return {
              ruleId: 'no-rgb-hsl-colors',
              message: 'rgb/hsl color functions detected — use hex tokens or CSS variables instead',
              severity: 'block' as const,
            };
          }
          return null;
        },
      },
      {
        id: 'no-external-fonts',
        description: 'Do not use fonts not declared in the design system',
        check: (html, pkg) => {
          const fontFamilyRe = /font-family:\s*["']?([^;"']+)/gi;
          const brandFonts = [
            pkg.tokens.typography.fontFamily.heading.toLowerCase(),
            pkg.tokens.typography.fontFamily.body.toLowerCase(),
          ];
          let m: RegExpExecArray | null;
          while ((m = fontFamilyRe.exec(html)) !== null) {
            const usedFont = m[1].trim().toLowerCase();
            const isAllowed = brandFonts.some(bf => bf.includes(usedFont.split(',')[0].replace(/["']/g, '').trim()));
            if (!isAllowed) {
              return {
                ruleId: 'no-external-fonts',
                message: `Font "${m[1].trim()}" is not in the brand font stack`,
                severity: 'block' as const,
              };
            }
          }
          return null;
        },
      },
    ],
  },
};
