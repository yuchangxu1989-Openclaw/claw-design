// FR-H05: Auto-generated brand package from Open Design DESIGN.md
import type { DesignSystemPackage } from '../../types.js';

export const CLAY_PACKAGE: DesignSystemPackage = {
  id: 'clay',
  name: 'Clay',
  version: '1.0.0',
  description: 'Design & Creative. Creative agency. Organic shapes, soft gradients, art-directed layout.',

  tokens: {
    colors: {
      'clay-black': '#000000',
      'pure-white': '#ffffff',
      'warm-cream': '#faf9f7',
      'matcha-300': '#84e7a5',
      'matcha-600': '#078a52',
      'matcha-800': '#02492a',
      'slushie-500': '#3bd3fd',
      'slushie-800': '#0089ad',
      'lemon-400': '#f8cc65',
      'lemon-500': '#fbbd41',
      'lemon-700': '#d08a11',
      'lemon-800': '#9d6a09',
      'ube-300': '#c1b0ff',
      'ube-800': '#43089f',
      'ube-900': '#32037d',
      'pomegranate-400': '#fc7981',
      'blueberry-800': '#01418d',
      'warm-silver': '#9f9b93',
      'warm-charcoal': '#55534e',
      'dark-charcoal': '#333333'
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
        heading: 'Roobert, system-ui, sans-serif',
        body: 'Roobert, system-ui, sans-serif',
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
      'md': '12px',
      'lg': '24px',
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
        'border-radius': '4px',
        'padding': '10px 20px',
        'font-family': 'Roobert, system-ui, sans-serif',
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
        'border-radius': '12px',
        'box-shadow': 'rgba(0,0,0,0.1) 0px 1px 1px, rgba(0,0,0,0.04) 0px -1px 1px i',
        'padding': '24px',
        'border': 'none'
      },
    },
    {
      name: 'input',
      selector: '.input',
      properties: {
        'background': '#ffffff',
        'border': '1px solid #000000',
        'border-radius': '4px',
        'padding': '10px 14px',
        'font-family': 'Roobert, system-ui, sans-serif',
        'font-size': '14px',
        'color': '#000000'
      },
    },
    {
      name: 'heading',
      selector: 'h1, h2, h3',
      properties: {
        'font-family': 'Roobert, system-ui, sans-serif',
        'font-weight': '700',
        'color': '#000000',
        'line-height': '1.2',
        'margin': '0 0 16px 0'
      },
    },
    {
      name: 'link',
      selector: 'a',
      properties: {
        'color': '#000000',
        'text-decoration': 'underline',
        'font-family': 'Roobert, system-ui, sans-serif',
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
        description: 'Only use brand-defined colors: #000000, #ffffff, #faf9f7, #84e7a5, #078a52...',
        check: (_html, _pkg) => null,
      },
      {
        id: 'typographyStack',
        description: 'Only use brand-defined font families: Roobert, system-ui, sans-serif, Roobert, system-ui, sans-serif',
        check: (_html, _pkg) => null,
      },
      {
        id: 'spacingScale',
        description: 'Spacing must be multiples of base unit (8px)',
        check: (_html, _pkg) => null,
      },
      {
        id: 'borderRadiusRange',
        description: 'Border radius must use defined scale: 4px, 12px, 24px, 999px',
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
