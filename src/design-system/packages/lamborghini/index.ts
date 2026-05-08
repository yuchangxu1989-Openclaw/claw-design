// FR-H05: Auto-generated brand package from Open Design DESIGN.md
import type { DesignSystemPackage } from '../../types.js';

export const LAMBORGHINI_PACKAGE: DesignSystemPackage = {
  id: 'lamborghini',
  name: 'Lamborghini',
  version: '1.0.0',
  description: 'Automotive. Supercar brand. True black surfaces, gold accents, dramatic uppercase typography.',

  tokens: {
    colors: {
      'lamborghini-gold': '#FFC000',
      'pure-white': '#FFFFFF',
      'dark-gold': '#917300',
      'gold-text': '#FFCE3E',
      'cyan-pulse': '#29ABE2',
      'link-blue': '#3860BE',
      'absolute-black': '#000000',
      'charcoal': '#202020',
      'dark-iron': '#181818',
      'near-white': '#F8F8F8',
      'mist': '#E6E6E6',
      'smoke': '#F5F5F5',
      'graphite': '#494949',
      'ash': '#7D7D7D',
      'steel': '#969696',
      'slate': '#666666',
      'iron': '#555555',
      'shadow': '#313131',
      'teal-action': '#1EAEDB',
      'badge-tag': '#969696'
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
      'sm': '0px',
      'md': '2px',
      'lg': '20px',
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
        'background': '#FFC000',
        'color': '#FFFFFF',
        'border-radius': '2px',
        'padding': '10px 20px',
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
        'background': '#FFFFFF',
        'border-radius': '0px',
        'box-shadow': 'minimal, uses overlay opacity for depth',
        'padding': '24px',
        'border': 'none'
      },
    },
    {
      name: 'input',
      selector: '.input',
      properties: {
        'background': '#FFFFFF',
        'border': '1px solid #FFC000',
        'border-radius': '0px',
        'padding': '10px 14px',
        'font-family': 'Inter, system-ui, sans-serif',
        'font-size': '14px',
        'color': '#FFC000'
      },
    },
    {
      name: 'heading',
      selector: 'h1, h2, h3',
      properties: {
        'font-family': 'Inter, system-ui, sans-serif',
        'font-weight': '700',
        'color': '#FFC000',
        'line-height': '1.2',
        'margin': '0 0 16px 0'
      },
    },
    {
      name: 'link',
      selector: 'a',
      properties: {
        'color': '#FFC000',
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
        description: 'Only use brand-defined colors: #FFC000, #FFFFFF, #917300, #FFCE3E, #29ABE2...',
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
        description: 'Border radius must use defined scale: 0px, 2px, 20px, 999px',
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
