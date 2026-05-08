// FR-H05: Auto-generated brand package from Open Design DESIGN.md
import type { DesignSystemPackage } from '../../types.js';

export const VODAFONE_PACKAGE: DesignSystemPackage = {
  id: 'vodafone',
  name: 'Vodafone',
  version: '1.0.0',
  description: 'Media & Consumer. Global telecom brand. Monumental uppercase display, Vodafone Red chapter bands.',

  tokens: {
    colors: {
      'vodafone-red': '#e60000',
      'pure-white': '#ffffff',
      'signal-blue': '#3860be',
      'deep-brand-red-shade': '#ac1811',
      'canvas-white': '#ffffff',
      'light-neutral': '#f2f2f2',
      'charcoal-institutional-panel': '#25282b',
      'charcoal-headline': '#25282b',
      'secondary-body-grey': '#7e7e7e',
      'form-text-grey': '#333333',
      'disabled-grey': '#bebebe',
      'surface-red-band': '#e60000',
      'tag-pill-red-border': '#e60000',
      'red-circular-markers': '#e60000',
      'use-vodafone-red': '#e60000'
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
        heading: 'Vodafone, system-ui, sans-serif',
        body: 'Vodafone, system-ui, sans-serif',
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
      'md': '6px',
      'lg': '24px',
      'xl': '32px',
      '2xl': '60px',
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
        'background': '#e60000',
        'color': '#ffffff',
        'border-radius': '2px',
        'padding': '10px 20px',
        'font-family': 'Vodafone, system-ui, sans-serif',
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
        'box-shadow': 'none — cards rely on spacing and the image aspect ratio for',
        'padding': '24px',
        'border': 'none'
      },
    },
    {
      name: 'input',
      selector: '.input',
      properties: {
        'background': '#ffffff',
        'border': '1px solid Form Text Grey',
        'border-radius': '2px',
        'padding': '10px 14px',
        'font-family': 'Vodafone, system-ui, sans-serif',
        'font-size': '14px',
        'color': '#e60000'
      },
    },
    {
      name: 'heading',
      selector: 'h1, h2, h3',
      properties: {
        'font-family': 'Vodafone, system-ui, sans-serif',
        'font-weight': '700',
        'color': '#e60000',
        'line-height': '1.2',
        'margin': '0 0 16px 0'
      },
    },
    {
      name: 'link',
      selector: 'a',
      properties: {
        'color': '#e60000',
        'text-decoration': 'underline',
        'font-family': 'Vodafone, system-ui, sans-serif',
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
        description: 'Only use brand-defined colors: #e60000, #ffffff, #3860be, #ac1811, #ffffff...',
        check: (_html, _pkg) => null,
      },
      {
        id: 'typographyStack',
        description: 'Only use brand-defined font families: Vodafone, system-ui, sans-serif, Vodafone, system-ui, sans-serif',
        check: (_html, _pkg) => null,
      },
      {
        id: 'spacingScale',
        description: 'Spacing must be multiples of base unit (8px)',
        check: (_html, _pkg) => null,
      },
      {
        id: 'borderRadiusRange',
        description: 'Border radius must use defined scale: 2px, 6px, 24px, 32px, 60px, 999px',
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
