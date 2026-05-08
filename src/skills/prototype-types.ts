import type { ThemePack } from '../types.js';

export type PrototypeStyle = 'minimal' | 'material' | 'wireframe';
export type PrototypeTheme = 'light' | 'dark';
export type InteractionType = 'navigate' | 'modal' | 'tab-switch' | 'toggle' | 'scroll-to' | 'confirm-dialog';
export type NavVariant = 'sidebar' | 'top-nav' | 'bottom-tab';

export interface PrototypeCardSpec {
  title: string;
  body: string;
  badge?: string;
}

export interface PrototypeSelectOption {
  value: string;
  label: string;
}

export interface PrototypeFormFieldSpec {
  label: string;
  placeholder: string;
  type: 'text' | 'email' | 'tel' | 'search' | 'number' | 'select' | 'date' | 'file' | 'textarea';
  options?: PrototypeSelectOption[];
}

export interface PrototypeTimelineItem {
  time: string;
  title: string;
  description?: string;
  status?: 'done' | 'active' | 'pending';
}

export interface PrototypeStatItem {
  label: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}

export interface PrototypeTableSpec {
  headers: string[];
  rows: string[][];
}

export interface PrototypeEmptyStateSpec {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
}

export interface PrototypeProgressSpec {
  label: string;
  value: number;
  max?: number;
}

export interface PrototypeTabSpec {
  key: string;
  label: string;
  body: string;
}

export interface PrototypeSectionSpec {
  id: string;
  name: string;
  title: string;
  body?: string;
  cards?: PrototypeCardSpec[];
  formFields?: PrototypeFormFieldSpec[];
  tabs?: PrototypeTabSpec[];
  timeline?: PrototypeTimelineItem[];
  statsPanel?: PrototypeStatItem[];
  table?: PrototypeTableSpec;
  emptyState?: PrototypeEmptyStateSpec;
  progressBar?: PrototypeProgressSpec;
}

export interface PrototypeInteractionSpec {
  id: string;
  type: InteractionType;
  label: string;
  targetPage?: string;
  targetSectionId?: string;
  targetComponent?: string;
  stateValue?: string;
  modalId?: string;
}

export interface PrototypePageSpec {
  name: string;
  title: string;
  summary: string;
  sections: PrototypeSectionSpec[];
  interactions: PrototypeInteractionSpec[];
  path?: string;
}

export interface PrototypeConfig {
  title: string;
  summary: string;
  pages: PrototypePageSpec[];
  style: PrototypeStyle;
  theme: PrototypeTheme;
  appName?: string;
  defaultPage?: string;
  footerNote?: string;
  modalTitle?: string;
  modalBody?: string;
  navVariant?: NavVariant;
}

export interface PrototypeProviderTemplates {
  route: string;
  component: string;
  state: string;
}

export interface PrototypeProviderContext {
  input: string;
  themePack: ThemePack;
  seedConfig: PrototypeConfig;
  prompt: string;
  templates: PrototypeProviderTemplates;
  metadata: Record<string, unknown>;
}

export interface PrototypeProviderResult {
  title?: string;
  summary?: string;
  style?: PrototypeStyle;
  theme?: PrototypeTheme;
  appName?: string;
  defaultPage?: string;
  footerNote?: string;
  modalTitle?: string;
  modalBody?: string;
  pages?: Array<Partial<PrototypePageSpec>>;
}

export interface PrototypeContentProvider {
  generatePrototypePlan(context: PrototypeProviderContext): Promise<PrototypeProviderResult | null>;
}

export interface PrototypeSkillContext extends Record<string, unknown> {
  taskId?: string;
  themeMode?: PrototypeTheme;
  prototypeConfig?: Partial<PrototypeConfig>;
  provider?: PrototypeContentProvider;
  prototypeProvider?: PrototypeContentProvider;
}
