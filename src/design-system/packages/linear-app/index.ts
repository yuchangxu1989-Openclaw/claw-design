// FR-H05: Auto-generated brand package from Open Design DESIGN.md
import type { DesignSystemPackage } from '../../types.js';

export const LINEAR_APP_PACKAGE: DesignSystemPackage = {
  id: 'linear-app',
  name: 'Linear App',
  version: '1.0.0',
  description: 'Productivity & SaaS. Project management. Ultra-minimal, precise, purple accent.',

  tokens: {
    colors: {
      'marketing-black': '#010102',
      'panel-dark': '#0f1011',
      'level-3-surface': '#191a1b',
      'secondary-surface': '#28282c',
      'primary-text': '#f7f8f8',
      'secondary-text': '#d0d6e0',
      'tertiary-text': '#8a8f98',
      'quaternary-text': '#62666d',
      'brand-indigo': '#5e6ad2',
      'accent-violet': '#7170ff',
      'accent-hover': '#828fff',
      'security-lavender': '#7a7fad',
      'green': '#27a644',
      'emerald': '#10b981',
      'border-primary': '#23252a',
      'border-secondary': '#34343a',
      'border-tertiary': '#3e3e44',
      'line-tint': '#141516',
      'line-tertiary': '#18191a',
      'light-background': '#f7f8f8'
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
        heading: 'Inter Variable, system-ui, sans-serif',
        body: 'Inter Variable, system-ui, sans-serif',
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
      'sm': '2px',
      'md': '5px',
      'lg': '6px',
      'xl': '8px',
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
        'background': '#5e6ad2',
        'color': '#ffffff',
        'border-radius': '6px',
        'padding': '0px 6px',
        'font-family': 'Inter Variable, system-ui, sans-serif',
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
        'border-radius': '2px',
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
        'border': '1px solid #010102',
        'border-radius': '6px',
        'padding': '10px 14px',
        'font-family': 'Inter Variable, system-ui, sans-serif',
        'font-size': '14px',
        'color': '#010102'
      },
    },
    {
      name: 'heading',
      selector: 'h1, h2, h3',
      properties: {
        'font-family': 'Inter Variable, system-ui, sans-serif',
        'font-weight': '700',
        'color': '#010102',
        'line-height': '1.2',
        'margin': '0 0 16px 0'
      },
    },
    {
      name: 'link',
      selector: 'a',
      properties: {
        'color': '#010102',
        'text-decoration': 'underline',
        'font-family': 'Inter Variable, system-ui, sans-serif',
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
        description: 'Only use brand-defined colors: #010102, #0f1011, #191a1b, #28282c, #f7f8f8...',
        check: (_html, _pkg) => null,
      },
      {
        id: 'typographyStack',
        description: 'Only use brand-defined font families: Inter Variable, system-ui, sans-serif, Inter Variable, system-ui, sans-serif',
        check: (_html, _pkg) => null,
      },
      {
        id: 'spacingScale',
        description: 'Spacing must be multiples of base unit (8px)',
        check: (_html, _pkg) => null,
      },
      {
        id: 'borderRadiusRange',
        description: 'Border radius must use defined scale: 2px, 5px, 6px, 8px, 9999px, 999px',
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
