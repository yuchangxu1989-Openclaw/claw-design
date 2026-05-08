// FR-H05: Auto-generated brand package from Open Design DESIGN.md
import type { DesignSystemPackage } from '../../types.js';

export const NOTION_PACKAGE: DesignSystemPackage = {
  id: 'notion',
  name: 'Notion',
  version: '1.0.0',
  description: 'Productivity & SaaS. All-in-one workspace. Warm minimalism, serif headings, soft surfaces.',

  tokens: {
    colors: {
      'pure-white': '#ffffff',
      'notion-blue': '#0075de',
      'deep-navy': '#213183',
      'active-blue': '#005bab',
      'warm-white': '#f6f5f4',
      'warm-dark': '#31302e',
      'warm-gray-500': '#615d59',
      'warm-gray-300': '#a39e98',
      'teal': '#2a9d99',
      'green': '#1aae39',
      'orange': '#dd5b00',
      'pink': '#ff64c8',
      'purple': '#391c57',
      'brown': '#523410',
      'link-blue': '#0075de',
      'link-light-blue': '#62aef0',
      'focus-blue': '#097fe8',
      'badge-blue-bg': '#f2f9ff',
      'badge-blue-text': '#097fe8',
      'disabled': '#a39e98'
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
        heading: 'NotionInter, system-ui, sans-serif',
        body: 'NotionInter, system-ui, sans-serif',
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
      'lg': '9999px',
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
        'background': '#0075de',
        'color': '#ffffff',
        'border-radius': '4px',
        'padding': '8px 16px',
        'font-family': 'NotionInter, system-ui, sans-serif',
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
        'box-shadow': 'rgba(0,0,0,0.04) 0px 4px 18px, rgba(0,0,0,0.027) 0px 2.025px',
        'padding': '24px',
        'border': 'none'
      },
    },
    {
      name: 'input',
      selector: '.input',
      properties: {
        'background': '#ffffff',
        'border': '1px solid #ffffff',
        'border-radius': '4px',
        'padding': '10px 14px',
        'font-family': 'NotionInter, system-ui, sans-serif',
        'font-size': '14px',
        'color': '#ffffff'
      },
    },
    {
      name: 'heading',
      selector: 'h1, h2, h3',
      properties: {
        'font-family': 'NotionInter, system-ui, sans-serif',
        'font-weight': '700',
        'color': '#ffffff',
        'line-height': '1.2',
        'margin': '0 0 16px 0'
      },
    },
    {
      name: 'link',
      selector: 'a',
      properties: {
        'color': '#ffffff',
        'text-decoration': 'underline',
        'font-family': 'NotionInter, system-ui, sans-serif',
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
        description: 'Only use brand-defined colors: #ffffff, #0075de, #213183, #005bab, #f6f5f4...',
        check: (_html, _pkg) => null,
      },
      {
        id: 'typographyStack',
        description: 'Only use brand-defined font families: NotionInter, system-ui, sans-serif, NotionInter, system-ui, sans-serif',
        check: (_html, _pkg) => null,
      },
      {
        id: 'spacingScale',
        description: 'Spacing must be multiples of base unit (8px)',
        check: (_html, _pkg) => null,
      },
      {
        id: 'borderRadiusRange',
        description: 'Border radius must use defined scale: 4px, 12px, 9999px, 999px',
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
