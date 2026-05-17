// FR-H05: Auto-generated brand package from Open Design DESIGN.md
import type { DesignSystemPackage } from '../../types.js';

export const VERCEL_PACKAGE: DesignSystemPackage = {
  id: 'vercel',
  name: 'Vercel',
  version: '1.0.0',
  description: 'Developer Tools. Frontend deployment. Black and white precision, Geist font.',

  tokens: {
    colors: {
      'vercel-black': '#171717',
      'pure-white': '#ffffff',
      'true-black': '#000000',
      'ship-red': '#ff5b4f',
      'preview-pink': '#de1d8d',
      'develop-blue': '#0a72ef',
      'console-blue': '#0070f3',
      'console-purple': '#7928ca',
      'console-pink': '#eb367f',
      'link-blue': '#0072f5',
      'gray-900': '#171717',
      'gray-600': '#4d4d4d',
      'gray-500': '#666666',
      'gray-400': '#808080',
      'gray-100': '#ebebeb',
      'gray-50': '#fafafa',
      'badge-blue-bg': '#ebf5ff',
      'badge-blue-text': '#0068d6',
      'background': '#ffffff',
      'text': '#171717'
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
        heading: 'Geist, system-ui, sans-serif',
        body: 'Geist, system-ui, sans-serif',
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
      'sm': '6px',
      'md': '8px',
      'lg': '64px',
      'xl': '9999px',
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
        'background': '#ffffff',
        'color': '#ffffff',
        'border-radius': '6px',
        'padding': '0px 6px',
        'font-family': 'Geist, system-ui, sans-serif',
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
        'border-radius': '8px',
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
        'border': '1px solid #171717',
        'border-radius': '6px',
        'padding': '10px 14px',
        'font-family': 'Geist, system-ui, sans-serif',
        'font-size': '14px',
        'color': '#171717'
      },
    },
    {
      name: 'heading',
      selector: 'h1, h2, h3',
      properties: {
        'font-family': 'Geist, system-ui, sans-serif',
        'font-weight': '700',
        'color': '#171717',
        'line-height': '1.2',
        'margin': '0 0 16px 0'
      },
    },
    {
      name: 'link',
      selector: 'a',
      properties: {
        'color': '#171717',
        'text-decoration': 'underline',
        'font-family': 'Geist, system-ui, sans-serif',
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
        description: 'Only use brand-defined colors: #171717, #ffffff, #000000, #ff5b4f, #de1d8d...',
        check: (_html, _pkg) => null,
      },
      {
        id: 'typographyStack',
        description: 'Only use brand-defined font families: Geist, system-ui, sans-serif, Geist, system-ui, sans-serif',
        check: (_html, _pkg) => null,
      },
      {
        id: 'spacingScale',
        description: 'Spacing must be multiples of base unit (8px)',
        check: (_html, _pkg) => null,
      },
      {
        id: 'borderRadiusRange',
        description: 'Border radius must use defined scale: 6px, 8px, 64px, 9999px, 999px',
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
