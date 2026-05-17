// FR-H05: Auto-generated brand package from Open Design DESIGN.md
import type { DesignSystemPackage } from '../../types.js';

export const IBM_PACKAGE: DesignSystemPackage = {
  id: 'ibm',
  name: 'Ibm',
  version: '1.0.0',
  description: 'Media & Consumer. Enterprise technology. Carbon design system, structured blue palette.',

  tokens: {
    colors: {
      'ibm-blue-60': '#0f62fe',
      'white': '#ffffff',
      'gray-100': '#161616',
      'gray-90': '#262626',
      'gray-80': '#393939',
      'gray-70': '#525252',
      'gray-60': '#6f6f6f',
      'gray-50': '#8d8d8d',
      'gray-30': '#c6c6c6',
      'gray-20': '#e0e0e0',
      'gray-10': '#f4f4f4',
      'gray-10-hover': '#e8e8e8',
      'blue-60': '#0f62fe',
      'blue-70': '#0043ce',
      'blue-80': '#002d9c',
      'blue-10': '#edf5ff',
      'focus-blue': '#0f62fe',
      'focus-inset': '#ffffff',
      'red-60': '#da1e28',
      'green-50': '#24a148'
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
        heading: 'IBM Plex Sans, system-ui, sans-serif',
        body: 'IBM Plex Sans, system-ui, sans-serif',
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
      'sm': '0px',
      'md': '24px',
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
        'background': '#0f62fe',
        'color': '#ffffff',
        'border-radius': '0px',
        'padding': '14px 63px',
        'font-family': 'IBM Plex Sans, system-ui, sans-serif',
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
        'border-radius': '0px',
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
        'border': '1px solid #0f62fe',
        'border-radius': '0px',
        'padding': '10px 14px',
        'font-family': 'IBM Plex Sans, system-ui, sans-serif',
        'font-size': '14px',
        'color': '#0f62fe'
      },
    },
    {
      name: 'heading',
      selector: 'h1, h2, h3',
      properties: {
        'font-family': 'IBM Plex Sans, system-ui, sans-serif',
        'font-weight': '700',
        'color': '#0f62fe',
        'line-height': '1.2',
        'margin': '0 0 16px 0'
      },
    },
    {
      name: 'link',
      selector: 'a',
      properties: {
        'color': '#0f62fe',
        'text-decoration': 'underline',
        'font-family': 'IBM Plex Sans, system-ui, sans-serif',
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
        description: 'Only use brand-defined colors: #0f62fe, #ffffff, #161616, #262626, #393939...',
        check: (_html, _pkg) => null,
      },
      {
        id: 'typographyStack',
        description: 'Only use brand-defined font families: IBM Plex Sans, system-ui, sans-serif, IBM Plex Sans, system-ui, sans-serif',
        check: (_html, _pkg) => null,
      },
      {
        id: 'spacingScale',
        description: 'Spacing must be multiples of base unit (8px)',
        check: (_html, _pkg) => null,
      },
      {
        id: 'borderRadiusRange',
        description: 'Border radius must use defined scale: 0px, 24px, 999px',
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
