// FR-H05: Auto-generated brand package from Open Design DESIGN.md
import type { DesignSystemPackage } from '../../types.js';

export const NIKE_PACKAGE: DesignSystemPackage = {
  id: 'nike',
  name: 'Nike',
  version: '1.0.0',
  description: 'E-Commerce & Retail. Athletic retail. Monochrome UI, massive uppercase type, full-bleed photography.',

  tokens: {
    colors: {
      'nike-black': '#111111',
      'nike-white': '#FFFFFF',
      'snow': '#FAFAFA',
      'light-gray': '#F5F5F5',
      'hover-gray': '#E5E5E5',
      'dark-surface': '#28282A',
      'deep-charcoal': '#1F1F21',
      'dark-hover': '#39393B',
      'primary-text': '#111111',
      'secondary-text': '#707072',
      'disabled-text': '#9E9EA0',
      'disabled-inverse': '#4B4B4D',
      'border-primary': '#707072',
      'border-secondary': '#CACACB',
      'border-disabled': '#CACACB',
      'border-active': '#111111',
      'nike-red': '#D30005',
      'bright-red': '#EE0005',
      'nike-orange-badge': '#D33918',
      'orange-flash': '#FF5000'
    },
    spacing: {
      unit: '4px',
      values: {
      'xs': '2px',
      'sm': '4px',
      'md': '8px',
      'lg': '12px',
      'xl': '16px',
      '2xl': '24px'
      },
    },
    typography: {
      fontFamily: {
        heading: 'Helvetica Now Text, Helvetica, Arial, system-ui, sans-serif',
        body: 'Helvetica Now Text, Helvetica, Arial, system-ui, sans-serif',
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
      'lg': '30px',
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
        'color': '#FFFFFF',
        'border-radius': '30px',
        'padding': '10px 20px',
        'font-family': 'Helvetica Now Text, Helvetica, Arial, system-ui, sans-serif',
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
        'border-radius': '0px',
        'box-shadow': 'none — Nike uses no card shadows whatsoever',
        'padding': '24px',
        'border': 'none'
      },
    },
    {
      name: 'input',
      selector: '.input',
      properties: {
        'background': '#FFFFFF',
        'border': '1px solid #111111',
        'border-radius': '24px',
        'padding': '10px 14px',
        'font-family': 'Helvetica Now Text, Helvetica, Arial, system-ui, sans-serif',
        'font-size': '14px',
        'color': '#111111'
      },
    },
    {
      name: 'heading',
      selector: 'h1, h2, h3',
      properties: {
        'font-family': 'Helvetica Now Text, Helvetica, Arial, system-ui, sans-serif',
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
        'font-family': 'Helvetica Now Text, Helvetica, Arial, system-ui, sans-serif',
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
        description: 'Only use brand-defined colors: #111111, #FFFFFF, #FAFAFA, #F5F5F5, #E5E5E5...',
        check: (_html, _pkg) => null,
      },
      {
        id: 'typographyStack',
        description: 'Only use brand-defined font families: Helvetica Now Text, Helvetica, Arial, system-ui, sans-serif, Helvetica Now Text, Helvetica, Arial, system-ui, sans-serif',
        check: (_html, _pkg) => null,
      },
      {
        id: 'spacingScale',
        description: 'Spacing must be multiples of base unit (4px)',
        check: (_html, _pkg) => null,
      },
      {
        id: 'borderRadiusRange',
        description: 'Border radius must use defined scale: 0px, 24px, 30px, 999px',
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
