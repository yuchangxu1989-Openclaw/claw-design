// FR-H05: Auto-generated brand package from Open Design DESIGN.md
import type { DesignSystemPackage } from '../../types.js';

export const KRAKEN_PACKAGE: DesignSystemPackage = {
  id: 'kraken',
  name: 'Kraken',
  version: '1.0.0',
  description: 'Fintech & Crypto. Crypto trading. Purple-accented dark UI, data-dense dashboards.',

  tokens: {
    colors: {
      'kraken-purple': '#7132f5',
      'purple-dark': '#5741d8',
      'purple-deep': '#5b1ecf',
      'near-black': '#101114',
      'cool-gray': '#686b82',
      'silver-blue': '#9497a9',
      'white': '#ffffff',
      'border-gray': '#dedee5',
      'green': '#149e61',
      'green-dark': '#026b3f',
      'green-accent': '#149e61',
      'background': '#7132f5',
      'text': '#ffffff',
      'use-kraken-purple': '#7132f5',
      'dark-variant': '#5741d8',
      'secondary-text': '#9497a9'
    },
    spacing: {
      unit: '8px',
      values: {
      'xs': '4px',
      'sm': '8px',
      'md': '16px',
      'lg': '24px',
      'xl': '32px',
      '2xl': '48px'
      },
    },
    typography: {
      fontFamily: {
        heading: 'Inter, system-ui, sans-serif',
        body: 'Inter, system-ui, sans-serif',
      },
      sizes: {
        'xs': '11px',
        'sm': '12px',
        'base': '14px',
        'md': '16px',
        'lg': '20px',
        'xl': '24px',
        '2xl': '32px',
        '3xl': '40px',
        '4xl': '48px',
      },
      weights: {
        'normal': '400',
        'medium': '500',
        'bold': '700',
      },
      lineHeights: {
        'tight': '1.1',
        'normal': '1.5',
        'relaxed': '1.75',
      },
    },
    radius: {
      'sm': '3px',
      'md': '10px',
      'lg': '12px',
      'full': '999px'
    },
    shadows: {
      'sm': '0 1px 2px rgba(0,0,0,0.05)',
      'md': '0 4px 6px rgba(0,0,0,0.1)',
      'lg': '0 10px 15px rgba(0,0,0,0.15)',
    },
    opacity: {
      'subtle': '0.05',
      'light': '0.1',
      'medium': '0.2',
      'strong': '0.4',
    },
  },

  components: [
    {
      name: 'button',
      selector: '.btn-primary',
      properties: {
        'background': '#7132f5',
        'color': '#ffffff',
        'border-radius': '12px',
        'padding': '13px 16px',
        'font-family': 'Inter, system-ui, sans-serif',
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
        'border-radius': '3px',
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
        'border': '1px solid #7132f5',
        'border-radius': '3px',
        'padding': '10px 14px',
        'font-family': 'Inter, system-ui, sans-serif',
        'font-size': '14px',
        'color': '#7132f5'
      },
    },
    {
      name: 'heading',
      selector: 'h1, h2, h3',
      properties: {
        'font-family': 'Inter, system-ui, sans-serif',
        'font-weight': '700',
        'color': '#7132f5',
        'line-height': '1.2',
        'margin': '0 0 16px 0'
      },
    },
    {
      name: 'link',
      selector: 'a',
      properties: {
        'color': '#7132f5',
        'text-decoration': 'underline',
        'font-family': 'Inter, system-ui, sans-serif',
        'font-weight': '500',
        'cursor': 'pointer'
      },
    }
  ],

  reference: {
    html: 'reference.html',
  },

  constraints: {
    enforce: [
      {
        id: 'colorPalette',
        description: 'Only use brand-defined colors: #7132f5, #5741d8, #5b1ecf, #101114, #686b82...',
        check: (_html, _pkg) => null,
      },
      {
        id: 'typographyStack',
        description: 'Only use brand-defined font families: Inter, system-ui, sans-serif, Inter, system-ui, sans-serif',
        check: (_html, _pkg) => null,
      },
      {
        id: 'spacingScale',
        description: 'Spacing must be multiples of base unit (8px)',
        check: (_html, _pkg) => null,
      },
      {
        id: 'borderRadiusRange',
        description: 'Border radius must use defined scale: 3px, 10px, 12px, 999px',
        check: (_html, _pkg) => null,
      }
    ],
    forbid: [
      {
        id: 'noArbitraryColors',
        description: 'Do not use colors outside the defined palette',
        check: (_html, _pkg) => null,
      },
      {
        id: 'noSystemFonts',
        description: 'Do not use system fonts directly; use the brand font stack',
        check: (_html, _pkg) => null,
      }
    ],
  },
};
