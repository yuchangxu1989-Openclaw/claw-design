export type BreakpointId = 'mobile' | 'tablet' | 'desktop';

export interface BreakpointSpec {
  min: number;
  max?: number;
  containerPadding: string;
  comfortableColumns: number;
}

export interface SpacingScale {
  xxs: string;
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
  '5xl': string;
}

export interface ComponentSpacingSpec {
  pageMargin: Record<BreakpointId, string>;
  sectionGap: Record<BreakpointId, string>;
  sectionInset: Record<BreakpointId, string>;
  cardPadding: Record<BreakpointId, string>;
  cardGap: Record<BreakpointId, string>;
  clusterGap: Record<BreakpointId, string>;
  stackGap: Record<BreakpointId, string>;
  buttonPaddingInline: Record<BreakpointId, string>;
  buttonPaddingBlock: Record<BreakpointId, string>;
}

export const BASE_GRID_UNIT = 8;

export const SPACING_SCALE: SpacingScale = {
  xxs: '0.25rem',
  xs: '0.5rem',
  sm: '0.75rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
  '4xl': '5rem',
  '5xl': '6rem',
};

export const BREAKPOINTS: Record<BreakpointId, BreakpointSpec> = {
  mobile: { min: 0, max: 767, containerPadding: '16px', comfortableColumns: 4 },
  tablet: { min: 768, max: 1199, containerPadding: '24px', comfortableColumns: 8 },
  desktop: { min: 1200, containerPadding: '40px', comfortableColumns: 12 },
};

export const COMPONENT_SPACING: ComponentSpacingSpec = {
  pageMargin: {
    mobile: '16px',
    tablet: '24px',
    desktop: '40px',
  },
  sectionGap: {
    mobile: '32px',
    tablet: '48px',
    desktop: '64px',
  },
  sectionInset: {
    mobile: '24px',
    tablet: '32px',
    desktop: '48px',
  },
  cardPadding: {
    mobile: '16px',
    tablet: '24px',
    desktop: '24px',
  },
  cardGap: {
    mobile: '12px',
    tablet: '16px',
    desktop: '20px',
  },
  clusterGap: {
    mobile: '12px',
    tablet: '16px',
    desktop: '24px',
  },
  stackGap: {
    mobile: '16px',
    tablet: '24px',
    desktop: '32px',
  },
  buttonPaddingInline: {
    mobile: '20px',
    tablet: '24px',
    desktop: '28px',
  },
  buttonPaddingBlock: {
    mobile: '12px',
    tablet: '14px',
    desktop: '14px',
  },
};

export function getSpacingTokenDeclarations(): string {
  return [
    `--cd-grid-unit: ${BASE_GRID_UNIT}px;`,
    `--cd-space-xxs: ${SPACING_SCALE.xxs};`,
    `--cd-space-xs: ${SPACING_SCALE.xs};`,
    `--cd-space-sm: ${SPACING_SCALE.sm};`,
    `--cd-space-md: ${SPACING_SCALE.md};`,
    `--cd-space-lg: ${SPACING_SCALE.lg};`,
    `--cd-space-xl: ${SPACING_SCALE.xl};`,
    `--cd-space-2xl: ${SPACING_SCALE['2xl']};`,
    `--cd-space-3xl: ${SPACING_SCALE['3xl']};`,
    `--cd-space-4xl: ${SPACING_SCALE['4xl']};`,
    `--cd-space-5xl: ${SPACING_SCALE['5xl']};`,
    `--cd-page-margin: ${COMPONENT_SPACING.pageMargin.mobile};`,
    `--cd-page-margin-inline: ${COMPONENT_SPACING.pageMargin.mobile};`,
    `--cd-section-gap: ${COMPONENT_SPACING.sectionGap.mobile};`,
    `--cd-section-inset: ${COMPONENT_SPACING.sectionInset.mobile};`,
    `--cd-card-padding: ${COMPONENT_SPACING.cardPadding.mobile};`,
    `--cd-card-gap: ${COMPONENT_SPACING.cardGap.mobile};`,
    `--cd-cluster-gap: ${COMPONENT_SPACING.clusterGap.mobile};`,
    `--cd-stack-gap: ${COMPONENT_SPACING.stackGap.mobile};`,
    `--cd-button-padding-inline: ${COMPONENT_SPACING.buttonPaddingInline.mobile};`,
    `--cd-button-padding-block: ${COMPONENT_SPACING.buttonPaddingBlock.mobile};`,
    `--cd-container-max-width: 1180px;`,
    `--cd-card-radius: clamp(18px, 2vw, 24px);`,
  ].join('\n      ');
}

export function getSpacingResponsiveCss(): string {
  return `
    .cd-stack > * + * { margin-top: var(--cd-stack-gap); }
    .cd-cluster { display: flex; flex-wrap: wrap; gap: var(--cd-cluster-gap); }
    .cd-card-shell {
      padding: var(--cd-card-padding);
      border-radius: var(--cd-card-radius);
      display: grid;
      gap: var(--cd-card-gap);
    }
    .cd-page-shell {
      width: min(100%, var(--cd-container-max-width));
      margin: 0 auto;
      padding-inline: var(--cd-page-margin-inline);
    }
    .cd-section-shell {
      padding-block: var(--cd-section-gap);
    }
    @media (min-width: ${BREAKPOINTS.tablet.min}px) {
      :root {
        --cd-page-margin: ${COMPONENT_SPACING.pageMargin.tablet};
        --cd-page-margin-inline: ${COMPONENT_SPACING.pageMargin.tablet};
        --cd-section-gap: ${COMPONENT_SPACING.sectionGap.tablet};
        --cd-section-inset: ${COMPONENT_SPACING.sectionInset.tablet};
        --cd-card-padding: ${COMPONENT_SPACING.cardPadding.tablet};
        --cd-card-gap: ${COMPONENT_SPACING.cardGap.tablet};
        --cd-cluster-gap: ${COMPONENT_SPACING.clusterGap.tablet};
        --cd-stack-gap: ${COMPONENT_SPACING.stackGap.tablet};
        --cd-button-padding-inline: ${COMPONENT_SPACING.buttonPaddingInline.tablet};
        --cd-button-padding-block: ${COMPONENT_SPACING.buttonPaddingBlock.tablet};
      }
    }
    @media (min-width: ${BREAKPOINTS.desktop.min}px) {
      :root {
        --cd-page-margin: ${COMPONENT_SPACING.pageMargin.desktop};
        --cd-page-margin-inline: ${COMPONENT_SPACING.pageMargin.desktop};
        --cd-section-gap: ${COMPONENT_SPACING.sectionGap.desktop};
        --cd-section-inset: ${COMPONENT_SPACING.sectionInset.desktop};
        --cd-card-padding: ${COMPONENT_SPACING.cardPadding.desktop};
        --cd-card-gap: ${COMPONENT_SPACING.cardGap.desktop};
        --cd-cluster-gap: ${COMPONENT_SPACING.clusterGap.desktop};
        --cd-stack-gap: ${COMPONENT_SPACING.stackGap.desktop};
        --cd-button-padding-inline: ${COMPONENT_SPACING.buttonPaddingInline.desktop};
        --cd-button-padding-block: ${COMPONENT_SPACING.buttonPaddingBlock.desktop};
      }
    }
  `;
}

export function getBreakpointMinWidth(id: BreakpointId): number {
  return BREAKPOINTS[id].min;
}
