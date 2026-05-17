export type MockupViewport = 'desktop' | 'mobile';
export type MockupFidelity = 'low' | 'high';
export type MockupTheme = 'light' | 'dark';

export type MockupComponentType =
  | 'navbar'
  | 'sidebar'
  | 'card'
  | 'form'
  | 'table'
  | 'button'
  | 'input'
  | 'list'
  | 'hero'
  | 'footer'
  | 'modal'
  | 'tabs'
  | 'stat'
  | 'placeholder'
  | 'avatar'
  | 'badge'
  | 'toggle'
  | 'search'
  | 'image'
  | 'divider'
  | 'breadcrumb'
  | 'tag'
  | 'rating'
  | 'price';

export interface MockupComponent {
  id: string;
  type: MockupComponentType;
  label: string;
  children?: MockupComponent[];
  state?: string;
  width?: string;
  height?: string;
}

export interface MockupSection {
  id: string;
  title?: string;
  layout: 'row' | 'column' | 'grid';
  components: MockupComponent[];
}

export interface MockupPage {
  name: string;
  title: string;
  viewport: MockupViewport;
  sections: MockupSection[];
}

export type MockupPageTemplate =
  | 'generic'
  | 'login'
  | 'register'
  | 'forgot-password'
  | 'settings'
  | 'profile'
  | 'product-list'
  | 'product-detail'
  | 'article-detail'
  | 'dashboard';

export interface MockupConfig {
  title: string;
  summary: string;
  pages: MockupPage[];
  fidelity: MockupFidelity;
  theme: MockupTheme;
  viewport: MockupViewport;
  pageTemplate?: MockupPageTemplate;
}

export interface MockupSkillContext extends Record<string, unknown> {
  taskId?: string;
  mockupConfig?: Partial<MockupConfig>;
  themeMode?: MockupTheme;
  viewport?: MockupViewport;
  fidelity?: MockupFidelity;
}
