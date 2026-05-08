// FR-H05: Auto-generated brand package from Open Design DESIGN.md
import type { DesignSystemPackage } from '../../types.js';

export const BMW_M_PACKAGE: DesignSystemPackage = {
  id: 'bmw-m',
  name: 'Bmw M',
  version: '1.0.0',
  description: 'Automotive. Motorsport performance sub-brand. Near-black cockpit surfaces, BMW M tricolor accents, sharp engineering geometry.',

  tokens: {
    colors: {
      'primary': '#ffffff',
      'm-blue-light': '#0066b1',
      'm-blue-dark': '#1c69d4',
      'm-red': '#e22718',
      'electric-blue': '#0653b6',
      'canvas': '#000000',
      'surface-soft': '#0d0d0d',
      'surface-card': '#1a1a1a',
      'surface-elevated': '#262626',
      'carbon-gray': '#2b2b2b',
      'hairline': '#3c3c3c',
      'hairline-strong': '#262626',
      'body': '#bbbbbb',
      'body-strong': '#e6e6e6',
      'muted': '#7e7e7e',
      'warning': '#f4b400',
      'success': '#0fa336'
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
        heading: '{colors.primary}, system-ui, sans-serif',
        body: '{colors.primary}, system-ui, sans-serif',
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
        'background': '#ffffff',
        'color': '#ffffff',
        'border-radius': '8px',
        'padding': '10px 20px',
        'font-family': '{colors.primary}, system-ui, sans-serif',
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
        'border-radius': '4px',
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
        'border': '1px solid #ffffff',
        'border-radius': '4px',
        'padding': '10px 14px',
        'font-family': '{colors.primary}, system-ui, sans-serif',
        'font-size': '14px',
        'color': '#ffffff'
      },
    },
    {
      name: 'heading',
      selector: 'h1, h2, h3',
      properties: {
        'font-family': '{colors.primary}, system-ui, sans-serif',
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
        'font-family': '{colors.primary}, system-ui, sans-serif',
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
        description: 'Only use brand-defined colors: #ffffff, #0066b1, #1c69d4, #e22718, #0653b6...',
        check: (_html, _pkg) => null,
      },
      {
        id: 'typographyStack',
        description: 'Only use brand-defined font families: {colors.primary}, system-ui, sans-serif, {colors.primary}, system-ui, sans-serif',
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
