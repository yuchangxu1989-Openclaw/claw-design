// FR-H05: Auto-generated brand package from Open Design DESIGN.md
import type { DesignSystemPackage } from '../../types.js';

export const MISTRAL_AI_PACKAGE: DesignSystemPackage = {
  id: 'mistral-ai',
  name: 'Mistral Ai',
  version: '1.0.0',
  description: 'AI & LLM. Open-weight LLM provider. French-engineered minimalism, purple-toned.',

  tokens: {
    colors: {
      'mistral-orange': '#fa520f',
      'mistral-flame': '#fb6424',
      'block-orange': '#ff8105',
      'sunshine-900': '#ff8a00',
      'sunshine-700': '#ffa110',
      'sunshine-500': '#ffb83e',
      'sunshine-300': '#ffd06a',
      'block-gold': '#ffe295',
      'bright-yellow': '#ffd900',
      'warm-ivory': '#fffaeb',
      'cream': '#fff0c2',
      'pure-white': '#ffffff',
      'mistral-black': '#1f1f1f',
      'use-mistral-black': '#1f1f1f'
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
        heading: 'Arial, system-ui, sans-serif',
        body: 'Arial, system-ui, sans-serif',
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
      'sm': '4px',
      'md': '8px',
      'lg': '12px',
      'xl': '16px',
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
        'background': '#fff0c2',
        'color': '#ffffff',
        'border-radius': '8px',
        'padding': '8px 0px',
        'font-family': 'Arial, system-ui, sans-serif',
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
        'border-radius': '4px',
        'box-shadow': 'warm golden multi-layer (',
        'padding': '24px',
        'border': 'none'
      },
    },
    {
      name: 'input',
      selector: '.input',
      properties: {
        'background': '#ffffff',
        'border': '1px solid #fa520f',
        'border-radius': '4px',
        'padding': '10px 14px',
        'font-family': 'Arial, system-ui, sans-serif',
        'font-size': '14px',
        'color': '#fa520f'
      },
    },
    {
      name: 'heading',
      selector: 'h1, h2, h3',
      properties: {
        'font-family': 'Arial, system-ui, sans-serif',
        'font-weight': '700',
        'color': '#fa520f',
        'line-height': '1.2',
        'margin': '0 0 16px 0'
      },
    },
    {
      name: 'link',
      selector: 'a',
      properties: {
        'color': '#fa520f',
        'text-decoration': 'underline',
        'font-family': 'Arial, system-ui, sans-serif',
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
        description: 'Only use brand-defined colors: #fa520f, #fb6424, #ff8105, #ff8a00, #ffa110...',
        check: (_html, _pkg) => null,
      },
      {
        id: 'typographyStack',
        description: 'Only use brand-defined font families: Arial, system-ui, sans-serif, Arial, system-ui, sans-serif',
        check: (_html, _pkg) => null,
      },
      {
        id: 'spacingScale',
        description: 'Spacing must be multiples of base unit (8px)',
        check: (_html, _pkg) => null,
      },
      {
        id: 'borderRadiusRange',
        description: 'Border radius must use defined scale: 4px, 8px, 12px, 16px, 999px',
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
