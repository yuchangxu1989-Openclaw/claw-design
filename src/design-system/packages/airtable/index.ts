// FR-H05: Auto-generated brand package from Open Design DESIGN.md
import type { DesignSystemPackage } from '../../types.js';

export const AIRTABLE_PACKAGE: DesignSystemPackage = {
  id: 'airtable',
  name: 'Airtable',
  version: '1.0.0',
  description: 'Design & Creative. Spreadsheet-database hybrid. Colorful, friendly, structured data aesthetic.',

  tokens: {
    colors: {
      'deep-navy': '#181d26',
      'airtable-blue': '#1b61c9',
      'white': '#ffffff',
      'success-green': '#006400',
      'dark-gray': '#333333',
      'mid-blue': '#254fad',
      'border': '#e0e2e6',
      'light-surface': '#f8fafc',
      'primary-blue': '#1b61c9',
      'cookie-consent': '#1b61c9'
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
        heading: 'Haas, system-ui, sans-serif',
        body: 'Haas, system-ui, sans-serif',
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
      'md': '32px',
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
        'background': '#181d26',
        'color': '#ffffff',
        'border-radius': '32px',
        'padding': '10px 20px',
        'font-family': 'Haas, system-ui, sans-serif',
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
        'border': '1px solid #181d26',
        'border-radius': '2px',
        'padding': '10px 14px',
        'font-family': 'Haas, system-ui, sans-serif',
        'font-size': '14px',
        'color': '#181d26'
      },
    },
    {
      name: 'heading',
      selector: 'h1, h2, h3',
      properties: {
        'font-family': 'Haas, system-ui, sans-serif',
        'font-weight': '700',
        'color': '#181d26',
        'line-height': '1.2',
        'margin': '0 0 16px 0'
      },
    },
    {
      name: 'link',
      selector: 'a',
      properties: {
        'color': '#181d26',
        'text-decoration': 'underline',
        'font-family': 'Haas, system-ui, sans-serif',
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
        description: 'Only use brand-defined colors: #181d26, #1b61c9, #ffffff, #006400, #333333...',
        check: (_html, _pkg) => null,
      },
      {
        id: 'typographyStack',
        description: 'Only use brand-defined font families: Haas, system-ui, sans-serif, Haas, system-ui, sans-serif',
        check: (_html, _pkg) => null,
      },
      {
        id: 'spacingScale',
        description: 'Spacing must be multiples of base unit (8px)',
        check: (_html, _pkg) => null,
      },
      {
        id: 'borderRadiusRange',
        description: 'Border radius must use defined scale: 2px, 32px, 999px',
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
