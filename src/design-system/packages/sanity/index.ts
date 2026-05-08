// FR-H05: Auto-generated brand package from Open Design DESIGN.md
import type { DesignSystemPackage } from '../../types.js';

export const SANITY_PACKAGE: DesignSystemPackage = {
  id: 'sanity',
  name: 'Sanity',
  version: '1.0.0',
  description: 'Backend & Data. Headless CMS. Red accent, content-first editorial layout.',

  tokens: {
    colors: {
      'sanity-black': '#0b0b0b',
      'pure-black': '#000000',
      'sanity-red': '#f36458',
      'electric-blue': '#0052ef',
      'light-blue': '#55beff',
      'near-black': '#0b0b0b',
      'dark-gray': '#212121',
      'medium-dark': '#353535',
      'pure-white': '#ffffff',
      'light-gray': '#ededed',
      'white': '#ffffff',
      'silver': '#b9b9b9',
      'medium-gray': '#797979',
      'charcoal': '#212121',
      'near-black-text': '#0b0b0b',
      'error-red': '#dd0000',
      'gpc-green': '#37cd84',
      'focus-ring-blue': '#0052ef',
      'dark-border': '#0b0b0b',
      'subtle-border': '#212121'
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
      'md': '5px',
      'lg': '6px',
      'xl': '12px',
      '2xl': '99999px',
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
        'background': '#f36458',
        'color': '#ffffff',
        'border-radius': '99999px',
        'padding': '8px 16px',
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
        'border-radius': '6px',
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
        'border': '1px solid #0b0b0b',
        'border-radius': '3px',
        'padding': '10px 14px',
        'font-family': 'Inter, system-ui, sans-serif',
        'font-size': '14px',
        'color': '#0b0b0b'
      },
    },
    {
      name: 'heading',
      selector: 'h1, h2, h3',
      properties: {
        'font-family': 'Inter, system-ui, sans-serif',
        'font-weight': '700',
        'color': '#0b0b0b',
        'line-height': '1.2',
        'margin': '0 0 16px 0'
      },
    },
    {
      name: 'link',
      selector: 'a',
      properties: {
        'color': '#0b0b0b',
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
        description: 'Only use brand-defined colors: #0b0b0b, #000000, #f36458, #0052ef, #55beff...',
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
        description: 'Border radius must use defined scale: 3px, 5px, 6px, 12px, 99999px, 999px',
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
