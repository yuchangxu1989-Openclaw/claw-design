// FR-H05: Auto-generated brand package from Open Design DESIGN.md
import type { DesignSystemPackage } from '../../types.js';

export const MASTERCARD_PACKAGE: DesignSystemPackage = {
  id: 'mastercard',
  name: 'Mastercard',
  version: '1.0.0',
  description: 'Fintech & Crypto. Global payments network. Warm cream canvas, orbital pill shapes, editorial warmth.',

  tokens: {
    colors: {
      'mastercard-red': '#EB001B',
      'mastercard-yellow': '#F79E1B',
      'ink-black': '#141413',
      'signal-orange': '#CF4500',
      'light-signal-orange': '#F37338',
      'clay-brown': '#9A3A0A',
      'canvas-cream': '#F3F0EE',
      'lifted-cream': '#FCFBFA',
      'white': '#FFFFFF',
      'soft-bone': '#F4F4F4',
      'charcoal': '#262627',
      'slate-gray': '#696969',
      'granite': '#555555',
      'dust-taupe': '#D1CDC7',
      'link-blue': '#3860BE',
      'graphite': '#565656',
      'warm-cream-canvas': '#F3F0EE',
      'use-canvas-cream': '#F3F0EE'
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
        heading: 'MarkForMC, system-ui, sans-serif',
        body: 'MarkForMC, system-ui, sans-serif',
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
      'sm': '20px',
      'md': '24px',
      'lg': '40px',
      'xl': '999px',
      '2xl': '1000px',
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
        'background': '#141413',
        'color': '#FFFFFF',
        'border-radius': '20px',
        'padding': '6px 24px',
        'font-family': 'MarkForMC, system-ui, sans-serif',
        'font-weight': '600',
        'border': 'none',
        'cursor': 'pointer'
      },
    },
    {
      name: 'card',
      selector: '.card',
      properties: {
        'background': '#FFFFFF',
        'border-radius': '40px',
        'box-shadow': 'none (sits directly on canvas)',
        'padding': '24px',
        'border': 'none'
      },
    },
    {
      name: 'input',
      selector: '.input',
      properties: {
        'background': '#FFFFFF',
        'border': '1px solid #EB001B',
        'border-radius': '20px',
        'padding': '10px 14px',
        'font-family': 'MarkForMC, system-ui, sans-serif',
        'font-size': '14px',
        'color': '#EB001B'
      },
    },
    {
      name: 'heading',
      selector: 'h1, h2, h3',
      properties: {
        'font-family': 'MarkForMC, system-ui, sans-serif',
        'font-weight': '700',
        'color': '#EB001B',
        'line-height': '1.2',
        'margin': '0 0 16px 0'
      },
    },
    {
      name: 'link',
      selector: 'a',
      properties: {
        'color': '#EB001B',
        'text-decoration': 'underline',
        'font-family': 'MarkForMC, system-ui, sans-serif',
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
        description: 'Only use brand-defined colors: #EB001B, #F79E1B, #141413, #CF4500, #F37338...',
        check: (_html, _pkg) => null,
      },
      {
        id: 'typographyStack',
        description: 'Only use brand-defined font families: MarkForMC, system-ui, sans-serif, MarkForMC, system-ui, sans-serif',
        check: (_html, _pkg) => null,
      },
      {
        id: 'spacingScale',
        description: 'Spacing must be multiples of base unit (8px)',
        check: (_html, _pkg) => null,
      },
      {
        id: 'borderRadiusRange',
        description: 'Border radius must use defined scale: 20px, 24px, 40px, 999px, 1000px, 999px',
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
