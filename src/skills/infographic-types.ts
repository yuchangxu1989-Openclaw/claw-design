export type InfographicOrientation = 'vertical' | 'horizontal';
export type InfographicTheme = 'light' | 'dark';

export type InfographicBlockType =
  | 'header'
  | 'steps'
  | 'comparison'
  | 'stats'
  | 'hierarchy'
  | 'conclusion'
  | 'callout';

export interface InfographicStatItem {
  label: string;
  value: string;
  icon?: string;
}

export interface InfographicStepItem {
  number: number;
  title: string;
  description: string;
}

export interface InfographicComparisonItem {
  label: string;
  left: string;
  right: string;
}

export interface InfographicBlock {
  id: string;
  type: InfographicBlockType;
  title?: string;
  body?: string;
  stats?: InfographicStatItem[];
  steps?: InfographicStepItem[];
  comparisons?: InfographicComparisonItem[];
  children?: InfographicBlock[];
}

export interface InfographicConfig {
  title: string;
  summary: string;
  orientation: InfographicOrientation;
  theme: InfographicTheme;
  blocks: InfographicBlock[];
}

export interface InfographicSkillContext extends Record<string, unknown> {
  taskId?: string;
  infographicConfig?: Partial<InfographicConfig>;
  themeMode?: InfographicTheme;
  orientation?: InfographicOrientation;
}
