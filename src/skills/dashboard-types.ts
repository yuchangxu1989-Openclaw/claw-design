export type DashboardLayout = 'executive' | 'operational' | 'grid-2x2' | 'sidebar-main' | 'fullscreen' | 'three-col' | 'kpi-focus';
export type DashboardTheme = 'light' | 'dark' | 'business' | 'tech' | 'minimal' | 'vibrant' | 'pastel' | 'presentation';

export type DashboardWidgetType =
  | 'metric-card'
  | 'trend-chart'
  | 'bar-chart'
  | 'pie-chart'
  | 'area-chart'
  | 'multi-line-chart'
  | 'table'
  | 'status-list'
  | 'filter-bar'
  | 'progress'
  | 'kpi-card'
  | 'time-range-selector'
  | 'sparkline-card';

export interface ChartSeries {
  name: string;
  color?: string;
  data: number[];
}

export interface DashboardWidget {
  id: string;
  type: DashboardWidgetType;
  title: string;
  value?: string;
  subtitle?: string;
  span?: number;
  items?: Array<{ label: string; value: string; status?: string }>;
  /** Multi-series data for trend/bar/area/multi-line charts */
  series?: ChartSeries[];
  /** X-axis labels */
  xLabels?: string[];
  /** Show data labels on chart points/bars */
  showDataLabels?: boolean;
  /** Show trend line overlay */
  showTrendLine?: boolean;
  /** Show grid lines */
  showGrid?: boolean;
  /** Trend direction for KPI cards */
  trend?: 'up' | 'down' | 'flat';
  /** Trend percentage for KPI cards */
  trendValue?: string;
  /** Sparkline data points for sparkline-card */
  sparkline?: number[];
}

export interface DashboardRow {
  id: string;
  columns: number;
  widgets: DashboardWidget[];
}

export interface DashboardConfig {
  title: string;
  summary: string;
  layout: DashboardLayout;
  theme: DashboardTheme;
  rows: DashboardRow[];
}

export interface DashboardSkillContext extends Record<string, unknown> {
  taskId?: string;
  dashboardConfig?: Partial<DashboardConfig>;
  themeMode?: DashboardTheme;
  dashboardLayout?: DashboardLayout;
}
