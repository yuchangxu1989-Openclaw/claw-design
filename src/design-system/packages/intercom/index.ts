// FR-H05: Auto-generated brand package from Open Design DESIGN.md
import type { DesignSystemPackage } from '../../types.js';

export const INTERCOM_PACKAGE: DesignSystemPackage = {
  id: 'intercom',
  name: 'Intercom',
  version: '1.0.0',
  description: 'Productivity & SaaS. Customer messaging. Friendly blue palette, conversational UI patterns.',

  tokens: {
    colors: {
      'off-black': '#111111',
      'pure-white': '#ffffff',
      'warm-cream': '#faf9f6',
      'fin-orange': '#ff5600',
      'report-orange': '#fe4c02',
      'report-blue': '#65b5ff',
      'report-green': '#0bdf50',
      'report-red': '#c41c1c',
      'report-pink': '#ff2067',
      'report-lime': '#b3e01c',
      'green': '#00da00',
      'deep-blue': '#0007cb',
      'black-80': '#313130',
      'black-60': '#626260',
      'black-50': '#7b7b78',
      'content-tertiary': '#9c9fa5',
      'oat-border': '#dedbd6',
      'warm-sand': '#d3cec6',
      'background': '#111111',
      'text': '#ffffff'
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
        heading: 'Saans, system-ui, sans-serif',
        body: 'Saans, system-ui, sans-serif',
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
        'background': '#111111',
        'color': '#ffffff',
        'border-radius': '4px',
        'padding': '0px 14px',
        'font-family': 'Saans, system-ui, sans-serif',
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
        'border': '1px solid #111111',
        'border-radius': '4px',
        'padding': '10px 14px',
        'font-family': 'Saans, system-ui, sans-serif',
        'font-size': '14px',
        'color': '#111111'
      },
    },
    {
      name: 'heading',
      selector: 'h1, h2, h3',
      properties: {
        'font-family': 'Saans, system-ui, sans-serif',
        'font-weight': '700',
        'color': '#111111',
        'line-height': '1.2',
        'margin': '0 0 16px 0'
      },
    },
    {
      name: 'link',
      selector: 'a',
      properties: {
        'color': '#111111',
        'text-decoration': 'underline',
        'font-family': 'Saans, system-ui, sans-serif',
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
        description: 'Only use brand-defined colors: #111111, #ffffff, #faf9f6, #ff5600, #fe4c02...',
        check: (_html, _pkg) => null,
      },
      {
        id: 'typographyStack',
        description: 'Only use brand-defined font families: Saans, system-ui, sans-serif, Saans, system-ui, sans-serif',
        check: (_html, _pkg) => null,
      },
      {
        id: 'spacingScale',
        description: 'Spacing must be multiples of base unit (8px)',
        check: (_html, _pkg) => null,
      },
      {
        id: 'borderRadiusRange',
        description: 'Border radius must use defined scale: 4px, 8px, 999px',
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
