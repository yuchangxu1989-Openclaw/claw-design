// FR-H05: Auto-generated brand package from Open Design DESIGN.md
import type { DesignSystemPackage } from '../../types.js';

export const SUPABASE_PACKAGE: DesignSystemPackage = {
  id: 'supabase',
  name: 'Supabase',
  version: '1.0.0',
  description: 'Backend & Data. Open-source Firebase alternative. Dark emerald theme, code-first.',

  tokens: {
    colors: {
      'supabase-green': '#3ecf8e',
      'green-link': '#00c573',
      'near-black': '#0f0f0f',
      'dark': '#171717',
      'dark-border': '#242424',
      'border-dark': '#2e2e2e',
      'mid-border': '#363636',
      'border-light': '#393939',
      'charcoal': '#434343',
      'dark-gray': '#4d4d4d',
      'mid-gray': '#898989',
      'light-gray': '#b4b4b4',
      'near-white': '#efefef',
      'off-white': '#fafafa',
      'green': '#00c573',
      'primary-light': '#fafafa',
      'secondary': '#b4b4b4',
      'muted': '#898989',
      'the-green-accent': '#3ecf8e',
      'background': '#0f0f0f'
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
        heading: 'Circular, system-ui, sans-serif',
        body: 'Circular, system-ui, sans-serif',
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
      'lg': '16px',
      'xl': '64px',
      '2xl': '9999px',
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
        'background': '#0f0f0f',
        'color': '#ffffff',
        'border-radius': '9999px',
        'padding': '8px 32px',
        'font-family': 'Circular, system-ui, sans-serif',
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
        'border': '1px solid #3ecf8e',
        'border-radius': '6px',
        'padding': '10px 14px',
        'font-family': 'Circular, system-ui, sans-serif',
        'font-size': '14px',
        'color': '#3ecf8e'
      },
    },
    {
      name: 'heading',
      selector: 'h1, h2, h3',
      properties: {
        'font-family': 'Circular, system-ui, sans-serif',
        'font-weight': '700',
        'color': '#3ecf8e',
        'line-height': '1.2',
        'margin': '0 0 16px 0'
      },
    },
    {
      name: 'link',
      selector: 'a',
      properties: {
        'color': '#3ecf8e',
        'text-decoration': 'underline',
        'font-family': 'Circular, system-ui, sans-serif',
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
        description: 'Only use brand-defined colors: #3ecf8e, #00c573, #0f0f0f, #171717, #242424...',
        check: (_html, _pkg) => null,
      },
      {
        id: 'typographyStack',
        description: 'Only use brand-defined font families: Circular, system-ui, sans-serif, Circular, system-ui, sans-serif',
        check: (_html, _pkg) => null,
      },
      {
        id: 'spacingScale',
        description: 'Spacing must be multiples of base unit (8px)',
        check: (_html, _pkg) => null,
      },
      {
        id: 'borderRadiusRange',
        description: 'Border radius must use defined scale: 6px, 8px, 16px, 64px, 9999px, 999px',
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
