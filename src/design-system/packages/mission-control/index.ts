// FR-H05: Auto-generated brand package from Open Design DESIGN.md
import type { DesignSystemPackage } from '../../types.js';

export const MISSION_CONTROL_PACKAGE: DesignSystemPackage = {
  id: 'mission-control',
  name: 'Mission Control',
  version: '1.0.0',
  description: 'Developer Tools. Space/aerospace mission monitoring. Dark command center, amber telemetry, monospace precision. Functional clarity above all else.',

  tokens: {
    colors: {
      'bg-default': '#0B1120',
      'bg-surface': '#111827',
      'bg-surface-hover': '#1A2535',
      'bg-surface-active': '#1E3A5F',
      'border-default': '#1E3A5F',
      'border-subtle': '#162035',
      'data-primary': '#FFB800',
      'data-secondary': '#00D4FF',
      'data-alert-critical': '#FF4757',
      'data-alert-warning': '#FF9F43',
      'data-success': '#26DE81',
      'fg-primary': '#E8F0FE',
      'fg-secondary': '#8BA3C7',
      'fg-tertiary': '#4A6080'
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
        heading: 'var, system-ui, sans-serif',
        body: 'var, system-ui, sans-serif',
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
      'sm': '1px',
      'md': '2px',
      'lg': '4px',
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
        'background': '#0B1120',
        'color': '#ffffff',
        'border-radius': '2px',
        'padding': '10px 20px',
        'font-family': 'var, system-ui, sans-serif',
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
        'border-radius': '1px',
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
        'border': '1px solid #0B1120',
        'border-radius': '1px',
        'padding': '10px 14px',
        'font-family': 'var, system-ui, sans-serif',
        'font-size': '14px',
        'color': '#0B1120'
      },
    },
    {
      name: 'heading',
      selector: 'h1, h2, h3',
      properties: {
        'font-family': 'var, system-ui, sans-serif',
        'font-weight': '700',
        'color': '#0B1120',
        'line-height': '1.2',
        'margin': '0 0 16px 0'
      },
    },
    {
      name: 'link',
      selector: 'a',
      properties: {
        'color': '#0B1120',
        'text-decoration': 'underline',
        'font-family': 'var, system-ui, sans-serif',
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
        description: 'Only use brand-defined colors: #0B1120, #111827, #1A2535, #1E3A5F, #1E3A5F...',
        check: (_html, _pkg) => null,
      },
      {
        id: 'typographyStack',
        description: 'Only use brand-defined font families: var, system-ui, sans-serif, var, system-ui, sans-serif',
        check: (_html, _pkg) => null,
      },
      {
        id: 'spacingScale',
        description: 'Spacing must be multiples of base unit (8px)',
        check: (_html, _pkg) => null,
      },
      {
        id: 'borderRadiusRange',
        description: 'Border radius must use defined scale: 1px, 2px, 4px, 999px',
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
