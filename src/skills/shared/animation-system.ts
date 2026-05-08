export type EntranceAnimation = 'fade-in' | 'slide-up' | 'scale-in';
export type InteractionAnimation = 'hover-lift' | 'press-scale' | 'focus-ring';
export type TimingCurve = 'ease-out' | 'spring' | 'bounce';

export interface MotionSpec {
  duration: string;
  easing: string;
  delay?: string;
  fillMode?: string;
}

export interface AnimationKeyframeConfig {
  name: string;
  from: Record<string, string | number>;
  to: Record<string, string | number>;
  middle?: Array<{
    percent: string;
    frame: Record<string, string | number>;
  }>;
}

export const ENTRANCE_ANIMATIONS: Record<EntranceAnimation, MotionSpec> = {
  'fade-in': { duration: '420ms', easing: 'var(--cd-ease-out)', fillMode: 'both' },
  'slide-up': { duration: '520ms', easing: 'var(--cd-ease-spring)', fillMode: 'both' },
  'scale-in': { duration: '460ms', easing: 'var(--cd-ease-spring)', fillMode: 'both' },
};

export const INTERACTION_ANIMATIONS: Record<InteractionAnimation, MotionSpec> = {
  'hover-lift': { duration: '220ms', easing: 'var(--cd-ease-out)' },
  'press-scale': { duration: '140ms', easing: 'var(--cd-ease-bounce)' },
  'focus-ring': { duration: '180ms', easing: 'var(--cd-ease-out)' },
};

export const TIMING_CURVES: Record<TimingCurve, string> = {
  'ease-out': 'cubic-bezier(0.22, 1, 0.36, 1)',
  spring: 'cubic-bezier(0.2, 0.9, 0.22, 1.12)',
  bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
};

const DEFAULT_KEYFRAMES: AnimationKeyframeConfig[] = [
  {
    name: 'cd-fade-in',
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  {
    name: 'cd-slide-up',
    from: { opacity: 0, transform: 'translate3d(0, 24px, 0)' },
    to: { opacity: 1, transform: 'translate3d(0, 0, 0)' },
  },
  {
    name: 'cd-scale-in',
    from: { opacity: 0, transform: 'scale3d(0.96, 0.96, 1)' },
    to: { opacity: 1, transform: 'scale3d(1, 1, 1)' },
  },
  {
    name: 'cd-focus-pulse',
    from: { boxShadow: '0 0 0 0 rgba(59,130,246,0)' },
    middle: [
      { percent: '55%', frame: { boxShadow: '0 0 0 6px rgba(59,130,246,0.22)' } },
    ],
    to: { boxShadow: '0 0 0 0 rgba(59,130,246,0)' },
  },
];

export function generateKeyframes(config: AnimationKeyframeConfig): string {
  const lines = [`@keyframes ${config.name} {`];
  lines.push(`  from { ${serializeFrame(config.from)} }`);
  for (const middle of config.middle ?? []) {
    lines.push(`  ${middle.percent} { ${serializeFrame(middle.frame)} }`);
  }
  lines.push(`  to { ${serializeFrame(config.to)} }`);
  lines.push('}');
  return lines.join('\n');
}

export function getAnimationTokenDeclarations(): string {
  return [
    `--cd-ease-out: ${TIMING_CURVES['ease-out']};`,
    `--cd-ease-spring: ${TIMING_CURVES.spring};`,
    `--cd-ease-bounce: ${TIMING_CURVES.bounce};`,
    `--cd-duration-fast: 180ms;`,
    `--cd-duration-normal: 320ms;`,
    `--cd-duration-slow: 520ms;`,
    `--cd-hover-translate-y: -4px;`,
    `--cd-press-scale: 0.98;`,
    `--cd-focus-ring-color: rgba(59,130,246,0.42);`,
    `--cd-focus-ring-size: 3px;`,
  ].join('\n      ');
}

export function getAnimationUtilityCss(): string {
  return `
    ${DEFAULT_KEYFRAMES.map(generateKeyframes).join('\n\n')}

    .cd-animate-fade-in {
      animation: cd-fade-in ${ENTRANCE_ANIMATIONS['fade-in'].duration} ${ENTRANCE_ANIMATIONS['fade-in'].easing} both;
    }
    .cd-animate-slide-up {
      animation: cd-slide-up ${ENTRANCE_ANIMATIONS['slide-up'].duration} ${ENTRANCE_ANIMATIONS['slide-up'].easing} both;
    }
    .cd-animate-scale-in {
      animation: cd-scale-in ${ENTRANCE_ANIMATIONS['scale-in'].duration} ${ENTRANCE_ANIMATIONS['scale-in'].easing} both;
      transform-origin: center;
    }
    .cd-hover-lift {
      transition:
        transform ${INTERACTION_ANIMATIONS['hover-lift'].duration} ${INTERACTION_ANIMATIONS['hover-lift'].easing},
        box-shadow ${INTERACTION_ANIMATIONS['hover-lift'].duration} ${INTERACTION_ANIMATIONS['hover-lift'].easing},
        border-color ${INTERACTION_ANIMATIONS['hover-lift'].duration} ${INTERACTION_ANIMATIONS['hover-lift'].easing};
    }
    .cd-hover-lift:hover {
      transform: translateY(var(--cd-hover-translate-y));
    }
    .cd-press-scale {
      transition: transform ${INTERACTION_ANIMATIONS['press-scale'].duration} ${INTERACTION_ANIMATIONS['press-scale'].easing};
    }
    .cd-press-scale:active {
      transform: scale(var(--cd-press-scale));
    }
    .cd-focus-ring {
      outline: none;
      transition:
        box-shadow ${INTERACTION_ANIMATIONS['focus-ring'].duration} ${INTERACTION_ANIMATIONS['focus-ring'].easing},
        border-color ${INTERACTION_ANIMATIONS['focus-ring'].duration} ${INTERACTION_ANIMATIONS['focus-ring'].easing};
    }
    .cd-focus-ring:focus-visible {
      box-shadow: 0 0 0 var(--cd-focus-ring-size) var(--cd-focus-ring-color);
      animation: cd-focus-pulse 420ms var(--cd-ease-out) both;
    }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after {
        animation-duration: 1ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 1ms !important;
        scroll-behavior: auto !important;
      }
    }
  `;
}

function serializeFrame(frame: Record<string, string | number>): string {
  return Object.entries(frame)
    .map(([key, value]) => `${toKebabCase(key)}: ${String(value)};`)
    .join(' ');
}

function toKebabCase(value: string): string {
  return value.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
}
