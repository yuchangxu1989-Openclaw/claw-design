export interface ColorPalette {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

export const BUILT_IN_PALETTES: ColorPalette[] = [
  {
    id: 'business-blue',
    name: '商务蓝',
    primary: '#1a73e8', // Google Blue — neutral default for slides/charts
    secondary: '#4285f4',
    accent: '#fbbc04',
    background: '#ffffff',
    surface: '#f8f9fa',
    text: '#202124',
    textSecondary: '#5f6368',
    border: '#dadce0',
    success: '#34a853',
    warning: '#fbbc04',
    error: '#ea4335',
  },
  {
    id: 'tech-dark',
    name: '科技暗',
    primary: '#4fc3f7',
    secondary: '#81d4fa',
    accent: '#ff6e40',
    background: '#1e1e2e',
    surface: '#2d2d3f',
    text: '#e0e0e0',
    textSecondary: '#9e9e9e',
    border: '#424242',
    success: '#66bb6a',
    warning: '#ffa726',
    error: '#ef5350',
  },
  {
    id: 'warm-earth',
    name: '暖色大地',
    primary: '#8d6e63',
    secondary: '#a1887f',
    accent: '#ff8a65',
    background: '#fafafa',
    surface: '#efebe9',
    text: '#3e2723',
    textSecondary: '#6d4c41',
    border: '#d7ccc8',
    success: '#66bb6a',
    warning: '#ffa726',
    error: '#ef5350',
  },
  {
    id: 'sunset-gradient',
    name: '暮光渐层',
    primary: '#f97316',
    secondary: '#fb7185',
    accent: '#facc15',
    background: '#fff7ed',
    surface: '#ffedd5',
    text: '#431407',
    textSecondary: '#9a3412',
    border: '#fdba74',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
  },
  {
    id: 'forest-green',
    name: '森林绿',
    primary: '#166534',
    secondary: '#22c55e',
    accent: '#84cc16',
    background: '#f6fff7',
    surface: '#dcfce7',
    text: '#052e16',
    textSecondary: '#3f6212',
    border: '#86efac',
    success: '#16a34a',
    warning: '#ca8a04',
    error: '#dc2626',
  },
  {
    id: 'ocean-deep',
    name: '深海蓝',
    primary: '#0f766e',
    secondary: '#0284c7',
    accent: '#38bdf8',
    background: '#f0fdfa',
    surface: '#ccfbf1',
    text: '#082f49',
    textSecondary: '#155e75',
    border: '#67e8f9',
    success: '#14b8a6',
    warning: '#f59e0b',
    error: '#ef4444',
  },
  {
    id: 'rose-gold',
    name: '玫瑰金',
    primary: '#b76e79',
    secondary: '#e9a5b3',
    accent: '#d4a373',
    background: '#fff8f7',
    surface: '#fce7ea',
    text: '#4a1d24',
    textSecondary: '#7f4b53',
    border: '#f5c2c7',
    success: '#65a30d',
    warning: '#d97706',
    error: '#dc2626',
  },
  {
    id: 'midnight-purple',
    name: '午夜紫',
    primary: '#6d28d9',
    secondary: '#8b5cf6',
    accent: '#22d3ee',
    background: '#0f0a19',
    surface: '#1e1630',
    text: '#f5f3ff',
    textSecondary: '#c4b5fd',
    border: '#4c1d95',
    success: '#34d399',
    warning: '#fbbf24',
    error: '#fb7185',
  },
  {
    id: 'neon-tech',
    name: '霓虹科技',
    primary: '#00f5d4',
    secondary: '#7c3aed',
    accent: '#f72585',
    background: '#050816',
    surface: '#111827',
    text: '#ecfeff',
    textSecondary: '#94a3b8',
    border: '#1f2937',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
  },
  {
    id: 'pastel-soft',
    name: '柔雾粉彩',
    primary: '#8b5cf6',
    secondary: '#f9a8d4',
    accent: '#67e8f9',
    background: '#fdfcff',
    surface: '#f5f3ff',
    text: '#312e81',
    textSecondary: '#7c6f9b',
    border: '#ddd6fe',
    success: '#4ade80',
    warning: '#fbbf24',
    error: '#fb7185',
  },
  {
    id: 'monochrome-elegant',
    name: '雅黑单色',
    primary: '#111827',
    secondary: '#4b5563',
    accent: '#9ca3af',
    background: '#f9fafb',
    surface: '#f3f4f6',
    text: '#111111',
    textSecondary: '#6b7280',
    border: '#d1d5db',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  },
  {
    id: 'corporate-blue',
    name: '企业蓝',
    primary: '#2563eb',
    secondary: '#1d4ed8',
    accent: '#06b6d4',
    background: '#f8fbff',
    surface: '#eff6ff',
    text: '#0f172a',
    textSecondary: '#475569',
    border: '#bfdbfe',
    success: '#16a34a',
    warning: '#f59e0b',
    error: '#dc2626',
  },
  {
    id: 'cool-minimal',
    name: '冷感极简',
    primary: '#334155',
    secondary: '#64748b',
    accent: '#94a3b8',
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#0f172a',
    textSecondary: '#64748b',
    border: '#e2e8f0',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
  },
];

export function getPalette(id: string): ColorPalette | undefined {
  return BUILT_IN_PALETTES.find(p => p.id === id);
}

export function paletteToCssVars(palette: ColorPalette): Record<string, string> {
  return {
    '--cd-color-primary': palette.primary,
    '--cd-color-secondary': palette.secondary,
    '--cd-color-accent': palette.accent,
    '--cd-color-bg': palette.background,
    '--cd-color-surface': palette.surface,
    '--cd-color-text': palette.text,
    '--cd-color-text-secondary': palette.textSecondary,
    '--cd-color-border': palette.border,
    '--cd-color-success': palette.success,
    '--cd-color-warning': palette.warning,
    '--cd-color-error': palette.error,
  };
}

export function deriveContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#202124' : '#ffffff';
}
