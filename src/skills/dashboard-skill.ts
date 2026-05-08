import type { Artifact, ThemePack } from '../types.js';
import { buildArtifact } from '../execution/skill-executor.js';
import { BaseSkill } from './base-skill.js';
import { renderDashboardHtml } from './dashboard-renderer.js';
import type {
  DashboardConfig,
  DashboardLayout,
  DashboardRow,
  DashboardSkillContext,
  DashboardTheme,
} from './dashboard-types.js';

export class DashboardSkill extends BaseSkill<'dashboard', DashboardSkillContext> {
  constructor() {
    super({
      name: 'dashboard',
      supportedTypes: ['dashboard'],
      description: 'Dashboard generation with metric cards, trend charts, tables, status lists and filter bars',
      triggerKeywords: [
        'dashboard', 'data dashboard', 'metrics dashboard', 'analytics',
        'kpi', 'report dashboard', 'monitoring',
        '仪表盘', '数据看板', '运营看板', '管理驾驶舱', '指标面板', 'KPI 看板',
      ],
      supportedOutputs: ['html'],
      requiredContext: ['taskId'],
    });
  }

  async generate(
    input: string,
    theme: ThemePack,
    context: Record<string, unknown>,
  ): Promise<Artifact> {
    const ctx = this.toContext(context);
    const config = buildDashboardConfig(input, ctx);
    const html = renderDashboardHtml(config, theme);

    return buildArtifact(
      String(ctx.taskId ?? 'unknown'),
      'dashboard',
      html,
      1,
      {
        layout: config.layout,
        themeMode: config.theme,
        widgetCount: config.rows.reduce((n, r) => n + r.widgets.length, 0),
        rowCount: config.rows.length,
        qualityRules: this.getQualityRules(ctx),
      },
    );
  }
}

function buildDashboardConfig(input: string, context: DashboardSkillContext): DashboardConfig {
  const explicit = (context.dashboardConfig && typeof context.dashboardConfig === 'object')
    ? context.dashboardConfig as Partial<DashboardConfig>
    : {};

  const layout = isDashLayout(explicit.layout) ? explicit.layout
    : isDashLayout(context.dashboardLayout) ? context.dashboardLayout : inferLayout(input);
  const themeMode = isDashTheme(explicit.theme) ? explicit.theme
    : isDashTheme(context.themeMode) ? context.themeMode : 'dark';
  const title = normalize(explicit.title) || deriveTitle(input);
  const summary = normalize(explicit.summary) || deriveSummary(input, title);
  const rows = Array.isArray(explicit.rows) && explicit.rows.length > 0
    ? explicit.rows : buildDefaultRows(input, layout);

  return { title, summary, layout, theme: themeMode, rows };
}

function buildDefaultRows(input: string, layout: DashboardLayout): DashboardRow[] {
  const metrics = extractMetricsWithValues(input);
  const metricLabels = metrics.map(m => m.label);

  if (layout === 'grid-2x2') {
    const cards = buildMetricCards(metrics, 2);
    return [
      {
        id: 'grid', columns: 2, widgets: [
          ...cards,
          { id: 'w-g-trend', type: 'trend-chart', title: `${metricLabels[0] ?? '核心指标'}趋势` },
          { id: 'w-g-bar', type: 'bar-chart', title: `${metricLabels.length > 1 ? metricLabels[1] : '指标'}对比` },
        ],
      },
    ];
  }
  if (layout === 'sidebar-main') {
    const cards = buildMetricCards(metrics, 4);
    return [
      { id: 'sidebar-metrics', columns: 4, widgets: cards },
      {
        id: 'main-chart', columns: 1, widgets: [
          { id: 'w-main', type: 'trend-chart', title: `${metricLabels[0] ?? '核心指标'}趋势`, span: 1 },
        ],
      },
    ];
  }
  if (layout === 'fullscreen') {
    return [
      {
        id: 'hero', columns: 1, widgets: [
          { id: 'w-hero', type: 'trend-chart', title: `${metricLabels[0] ?? '实时'}监控`, span: 1 },
        ],
      },
    ];
  }
  if (layout === 'executive') {
    const cards = buildMetricCards(metrics, 4);
    return [
      { id: 'metrics', columns: 4, widgets: cards },
      {
        id: 'charts', columns: 2, widgets: [
          { id: 'w-trend', type: 'trend-chart', title: `${metricLabels[0] ?? '月度'}趋势`, span: 1 },
          { id: 'w-pie', type: 'pie-chart', title: `${metricLabels.length > 1 ? metricLabels[1] : '渠道'}分布`, span: 1 },
        ],
      },
      {
        id: 'detail', columns: 2, widgets: [
          { id: 'w-table', type: 'table', title: `${metricLabels[0] ?? '指标'}明细`, items: [
            { label: '—', value: '—' }, { label: '—', value: '—' }, { label: '—', value: '—' },
          ]},
          { id: 'w-status', type: 'status-list', title: '运行状态', items: [
            { label: '—', value: '—', status: 'healthy' },
            { label: '—', value: '—', status: 'healthy' },
            { label: '—', value: '—', status: 'healthy' },
          ]},
        ],
      },
    ];
  }
  // operational (default)
  const cardCount = Math.max(3, metrics.length);
  const cards = buildMetricCards(metrics, cardCount);
  return [
    {
      id: 'filters', columns: 1, widgets: [
        { id: 'w-filter', type: 'filter-bar', title: '筛选', items: [
          { label: '今日', value: 'today' }, { label: '本周', value: 'week' }, { label: '本月', value: 'month' },
        ]},
      ],
    },
    { id: 'kpis', columns: cardCount, widgets: cards },
    {
      id: 'detail', columns: 1, widgets: [
        { id: 'w-detail-table', type: 'table', title: `${metricLabels[0] ?? '数据'}明细`, span: 1, items: [
          { label: '—', value: '—' }, { label: '—', value: '—' }, { label: '—', value: '—' },
        ]},
      ],
    },
  ];
}

/** Build metric cards that match the extracted metrics from user input */
function buildMetricCards(metrics: ExtractedMetric[], count: number): DashboardRow['widgets'] {
  // Fallback generic metrics when input doesn't specify enough
  const fallbackMetrics: ExtractedMetric[] = [
    { label: '营收', value: '—' },
    { label: '日活用户', value: '—' },
    { label: '转化率', value: '—' },
    { label: '留存率', value: '—' },
  ];

  // Use extracted metrics first, pad with fallbacks if needed
  const selected: ExtractedMetric[] = [...metrics];
  const seenLabels = new Set(selected.map(m => m.label));
  for (const fb of fallbackMetrics) {
    if (selected.length >= count) break;
    if (!seenLabels.has(fb.label)) {
      selected.push(fb);
      seenLabels.add(fb.label);
    }
  }

  return selected.slice(0, count).map((metric, i) => ({
    id: `w-m${i + 1}`,
    type: 'metric-card' as const,
    title: metric.label,
    value: metric.value,
  }));
}

function stripPromptPrefix(text: string): string {
  const prefixPattern = /^(?:请|帮我|帮忙)?(?:设计|制作|做|画|生成|创建)\s*(?:一[张个份幅]|)\s*/;
  let stripped = text.replace(prefixPattern, '').trim();
  stripped = stripped.replace(/(?:的\s*)?(?:数据仪表盘|仪表盘|数据看板|运营看板|管理驾驶舱|指标面板|dashboard)/gi, '').trim();
  return stripped || text;
}

function deriveTitle(input: string): string {
  const compact = normalize(input);
  if (!compact) return '数据仪表盘';
  const metrics = extractMetrics(compact);
  if (metrics.length > 1) return '运营数据看板';
  const keywords: Record<string, string> = {
    'DAU': '日活用户数据',
    'dau': '日活用户数据',
    '收入': '营收数据看板',
    '营收': '营收数据看板',
    '转化率': '转化率分析',
    '转化': '转化率分析',
    '留存': '留存分析看板',
    'retention': '留存分析看板',
    '订单': '订单数据看板',
    '销售': '销售数据看板',
    '流量': '流量分析看板',
    '用户': '用户数据分析',
  };
  for (const [key, label] of Object.entries(keywords)) {
    if (compact.includes(key)) return label;
  }
  const semantic = stripPromptPrefix(compact);
  const clauses = semantic.split(/[\n:：|｜]/).map(p => p.trim()).filter(Boolean);
  const candidate = clauses[0] ?? compact;
  return candidate.length > 30 ? `${candidate.slice(0, 30)}…` : candidate;
}

function deriveSummary(input: string, title: string): string {
  const compact = normalize(input);
  if (!compact || compact === title) return '关键指标一目了然，趋势变化实时掌握。';
  const metrics = extractMetrics(compact);
  if (metrics.length > 0) {
    return `包含 ${metrics.join('、')} 等核心指标的实时监控与分析。`;
  }
  const candidate = compact.replace(title, '').trim() || compact;
  const sentences = candidate.split(/[。！？.!?\n]+/).filter(Boolean);
  const meaningful = sentences.find(s => s.length > 10) || candidate;
  return meaningful.length > 100 ? `${meaningful.slice(0, 100)}…` : meaningful;
}

interface ExtractedMetric {
  label: string;
  value: string;
}

function extractMetricsWithValues(input: string): ExtractedMetric[] {
  const metricKeywords: [RegExp, string][] = [
    [/DAU|dau|日活|日活用户/i, '日活用户'],
    [/MAU|mau|月活/i, '月活用户'],
    [/收入|营收|营业额/i, '营收'],
    [/转化率|转化/i, '转化率'],
    [/留存|retention/i, '留存率'],
    [/订单|order/i, '订单量'],
    [/ARPU|arpu|客单价/i, '客单价'],
    [/NPS|nps/i, '用户满意度'],
    [/PV|pv|页面浏览/i, '浏览量'],
    [/UV|uv|独立访客/i, '独立访客'],
  ];
  // Pattern to capture a value near a metric keyword:
  // e.g. "DAU 5万" or "转化率 3.2%" or "ARPU ¥45"
  const valuePattern = /[\s:：]*([$¥￥]?\s*[\d,.]+\s*[万亿千百%％]?(?:\.\d+[%％]?)?)/;
  const found: ExtractedMetric[] = [];
  const seenLabels = new Set<string>();
  for (const [regex, label] of metricKeywords) {
    if (!regex.test(input) || seenLabels.has(label)) continue;
    seenLabels.add(label);
    // Try to extract the value that follows the keyword
    const match = input.match(new RegExp(`(?:${regex.source})${valuePattern.source}`, 'i'));
    const value = match?.[1]?.trim() || '—';
    found.push({ label, value });
  }
  return found;
}

function extractMetrics(input: string): string[] {
  return extractMetricsWithValues(input).map(m => m.label);
}

function inferLayout(input: string): DashboardLayout {
  if (/executive|汇报|管理层|高管|总览|overview/.test(input.toLowerCase())) return 'executive';
  if (/grid|2x2|四宫格|网格/.test(input.toLowerCase())) return 'grid-2x2';
  if (/sidebar|侧边|侧栏/.test(input.toLowerCase())) return 'sidebar-main';
  if (/fullscreen|全屏|大屏|single/.test(input.toLowerCase())) return 'fullscreen';
  return 'operational';
}

function normalize(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const compact = value.replace(/\s+/g, ' ').trim();
  return compact || undefined;
}

function isDashLayout(v: unknown): v is DashboardLayout {
  return v === 'executive' || v === 'operational' || v === 'grid-2x2' || v === 'sidebar-main' || v === 'fullscreen';
}

function isDashTheme(v: unknown): v is DashboardTheme {
  return v === 'light' || v === 'dark';
}

const dashboardSkill = new DashboardSkill();

export default dashboardSkill;
