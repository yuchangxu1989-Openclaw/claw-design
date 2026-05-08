// FR-H05: Auto-generated brand package from Open Design DESIGN.md
import type { DesignSystemPackage } from '../../types.js';

export const EXPO_PACKAGE: DesignSystemPackage = {
  id: 'expo',
  name: 'Expo',
  version: '1.0.0',
  description: 'Developer Tools. React Native platform. Dark theme, tight letter-spacing, code-centric.',

  tokens: {
    colors: {
      'expo-black': '#000000',
      'near-black': '#1c2024',
      'link-cobalt': '#0d74ce',
      'legal-blue': '#476cff',
      'widget-sky': '#47c2ff',
      'preview-purple': '#8145b5',
      'cloud-gray': '#f0f0f3',
      'pure-white': '#ffffff',
      'widget-dark': '#1a1a1a',
      'banner-dark': '#171717',
      'slate-gray': '#60646c',
      'mid-slate': '#555860',
      'silver': '#b0b4ba',
      'pewter': '#999999',
      'light-silver': '#cccccc',
      'dark-slate': '#363a3f',
      'charcoal': '#333333',
      'warning-amber': '#ab6400',
      'destructive-rose': '#eb8e90',
      'border-lavender': '#e0e1e6'
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
      'sm': '6px',
      'md': '8px',
      'lg': '144px',
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
        'border-radius': '8px',
        'padding': '0px 12px',
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
        'border': '1px solid #000000',
        'border-radius': '6px',
        'padding': '10px 14px',
        'font-family': 'Inter, system-ui, sans-serif',
        'font-size': '14px',
        'color': '#000000'
      },
    },
    {
      name: 'heading',
      selector: 'h1, h2, h3',
      properties: {
        'font-family': 'Inter, system-ui, sans-serif',
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
        description: 'Only use brand-defined colors: #000000, #1c2024, #0d74ce, #476cff, #47c2ff...',
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
        description: 'Border radius must use defined scale: 6px, 8px, 144px, 999px',
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
