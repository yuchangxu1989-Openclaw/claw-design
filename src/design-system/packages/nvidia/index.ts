// FR-H05: Auto-generated brand package from Open Design DESIGN.md
import type { DesignSystemPackage } from '../../types.js';

export const NVIDIA_PACKAGE: DesignSystemPackage = {
  id: 'nvidia',
  name: 'Nvidia',
  version: '1.0.0',
  description: 'Media & Consumer. GPU computing. Green-black energy, technical power aesthetic.',

  tokens: {
    colors: {
      'nvidia-green': '#76b900',
      'true-black': '#000000',
      'pure-white': '#ffffff',
      'nvidia-green-light': '#bff230',
      'orange-400': '#df6500',
      'yellow-300': '#ef9100',
      'yellow-050': '#feeeb2',
      'red-500': '#e52020',
      'red-800': '#650b0b',
      'green-500': '#3f8500',
      'blue-700': '#0046a4',
      'purple-800': '#4d1368',
      'purple-100': '#f9d4ff',
      'fuchsia-700': '#8c1c55',
      'gray-300': '#a7a7a7',
      'gray-400': '#898989',
      'gray-500': '#757575',
      'gray-border': '#5e5e5e',
      'near-black': '#1a1a1a',
      'link-default-dark-bg': '#ffffff'
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
        heading: 'NVIDIA-EMEA, system-ui, sans-serif',
        body: 'NVIDIA-EMEA, system-ui, sans-serif',
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
      'md': '8px',
      'lg': '12px',
      'xl': '16px',
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
        'background': '#76b900',
        'color': '#ffffff',
        'border-radius': '2px',
        'padding': '11px 13px',
        'font-family': 'NVIDIA-EMEA, system-ui, sans-serif',
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
        'box-shadow': 'rgba(0, 0, 0, 0.3) 0px 0px 5px 0px',
        'padding': '24px',
        'border': 'none'
      },
    },
    {
      name: 'input',
      selector: '.input',
      properties: {
        'background': '#ffffff',
        'border': '1px solid #76b900',
        'border-radius': '4px',
        'padding': '10px 14px',
        'font-family': 'NVIDIA-EMEA, system-ui, sans-serif',
        'font-size': '14px',
        'color': '#76b900'
      },
    },
    {
      name: 'heading',
      selector: 'h1, h2, h3',
      properties: {
        'font-family': 'NVIDIA-EMEA, system-ui, sans-serif',
        'font-weight': '700',
        'color': '#76b900',
        'line-height': '1.2',
        'margin': '0 0 16px 0'
      },
    },
    {
      name: 'link',
      selector: 'a',
      properties: {
        'color': '#76b900',
        'text-decoration': 'underline',
        'font-family': 'NVIDIA-EMEA, system-ui, sans-serif',
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
        description: 'Only use brand-defined colors: #76b900, #000000, #ffffff, #bff230, #df6500...',
        check: (_html, _pkg) => null,
      },
      {
        id: 'typographyStack',
        description: 'Only use brand-defined font families: NVIDIA-EMEA, system-ui, sans-serif, NVIDIA-EMEA, system-ui, sans-serif',
        check: (_html, _pkg) => null,
      },
      {
        id: 'spacingScale',
        description: 'Spacing must be multiples of base unit (8px)',
        check: (_html, _pkg) => null,
      },
      {
        id: 'borderRadiusRange',
        description: 'Border radius must use defined scale: 4px, 8px, 12px, 16px, 999px',
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
