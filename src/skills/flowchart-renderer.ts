import type { ThemePack } from '../types.js';
import { escapeHtml } from '../utils.js';
import type {
  FlowEdge,
  FlowNode,
  FlowchartConfig,
  FlowchartLayout,
  FlowchartPlan,
  FlowchartThemeMode,
} from './flowchart-types.js';

const DEFAULT_CONFIG: Required<FlowchartConfig> = {
  themeMode: 'auto',
  padding: 48,
  nodeGapX: 72,
  nodeGapY: 88,
  processWidth: 220,
  startEndWidth: 180,
  decisionWidth: 196,
  decisionHeight: 96,
  parallelSize: 92,
  baseNodeHeight: 72,
  maxLabelCharsPerLine: 10,
  stageWidth: 300,
};

interface ThemeColors {
  bg: string;
  surface: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  accentSoft: string;
  arrow: string;
  yes: string;
  no: string;
  parallel: string;
  shadow: string;
}

export function renderFlowchartHtml(
  plan: FlowchartPlan,
  theme: ThemePack,
  config?: FlowchartConfig,
): string {
  const resolvedConfig = resolveConfig(config);
  const layout = plan.layout ?? computeFlowchartLayout(plan, resolvedConfig);
  const lightColors = resolveColors(theme, 'light');
  const darkColors = resolveColors(theme, 'dark');
  const svg = renderFlowchartSvg(plan, theme, { ...resolvedConfig, themeMode: 'light' }, layout, lightColors);

  const title = escapeHtml(plan.title);
  const summary = escapeHtml(plan.summary);
  const rawCssVars = Object.entries(theme.cssVariables ?? {})
    .map(([key, value]) => `  ${key}: ${String(value)};`)
    .join('\n');

  return `<!DOCTYPE html>
<html data-theme="${resolvedConfig.themeMode}" lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
:root {
${rawCssVars}
  --flow-bg: ${lightColors.bg};
  --flow-surface: ${lightColors.surface};
  --flow-border: ${lightColors.border};
  --flow-text: ${lightColors.text};
  --flow-muted: ${lightColors.muted};
  --flow-accent: ${lightColors.accent};
  --flow-accent-soft: ${lightColors.accentSoft};
  --flow-arrow: ${lightColors.arrow};
  --flow-yes: ${lightColors.yes};
  --flow-no: ${lightColors.no};
  --flow-parallel: ${lightColors.parallel};
  --flow-shadow: ${lightColors.shadow};
}
html[data-theme="dark"] {
  --flow-bg: ${darkColors.bg};
  --flow-surface: ${darkColors.surface};
  --flow-border: ${darkColors.border};
  --flow-text: ${darkColors.text};
  --flow-muted: ${darkColors.muted};
  --flow-accent: ${darkColors.accent};
  --flow-accent-soft: ${darkColors.accentSoft};
  --flow-arrow: ${darkColors.arrow};
  --flow-yes: ${darkColors.yes};
  --flow-no: ${darkColors.no};
  --flow-parallel: ${darkColors.parallel};
  --flow-shadow: ${darkColors.shadow};
}
@media (prefers-color-scheme: dark) {
  html[data-theme="auto"] {
    --flow-bg: ${darkColors.bg};
    --flow-surface: ${darkColors.surface};
    --flow-border: ${darkColors.border};
    --flow-text: ${darkColors.text};
    --flow-muted: ${darkColors.muted};
    --flow-accent: ${darkColors.accent};
    --flow-accent-soft: ${darkColors.accentSoft};
    --flow-arrow: ${darkColors.arrow};
    --flow-yes: ${darkColors.yes};
    --flow-no: ${darkColors.no};
    --flow-parallel: ${darkColors.parallel};
    --flow-shadow: ${darkColors.shadow};
  }
}
* { box-sizing: border-box; }
body {
  margin: 0;
  min-height: 100vh;
  padding: 32px;
  background: var(--flow-bg);
  color: var(--flow-text);
  font-family: var(--cd-font-body, 'Noto Sans SC', 'Noto Sans', sans-serif);
}
.flowchart-shell {
  max-width: ${layout.width + 96}px;
  margin: 0 auto;
  padding: 24px;
  border: 1px solid var(--flow-border);
  background: var(--flow-surface);
  border-radius: max(16px, var(--cd-radius, 12px));
  box-shadow: 0 16px 48px var(--flow-shadow);
}
.flowchart-header {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}
.flowchart-title {
  margin: 0;
  font-family: var(--cd-font-heading, 'Inter', sans-serif);
  font-size: 28px;
  line-height: 1.2;
}
.flowchart-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  color: var(--flow-muted);
  font-size: 14px;
}
.flowchart-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--flow-accent-soft);
  color: var(--flow-accent);
  font-weight: 600;
}
.flowchart-summary {
  margin: 0;
  color: var(--flow-muted);
  font-size: 15px;
  line-height: 1.6;
}
.flowchart-stage {
  width: 100%;
  overflow-x: auto;
}
.flowchart-stage svg {
  width: 100%;
  height: auto;
  display: block;
}
</style>
</head>
<body>
  <main class="flowchart-shell">
    <header class="flowchart-header">
      <h1 class="flowchart-title">${title}</h1>
      <p class="flowchart-summary">${summary}</p>
    </header>
    <section class="flowchart-stage" aria-label="flowchart-diagram">
      ${svg}
    </section>
  </main>
</body>
</html>`;
}

export function renderFlowchartSvg(
  plan: FlowchartPlan,
  theme: ThemePack,
  config?: FlowchartConfig,
  existingLayout?: FlowchartLayout,
  existingColors?: ThemeColors,
): string {
  const resolvedConfig = resolveConfig(config);
  const layout = existingLayout ?? plan.layout ?? computeFlowchartLayout(plan, resolvedConfig);
  const colors = existingColors ?? resolveColors(theme, resolvedConfig.themeMode === 'dark' ? 'dark' : 'light');

  const edgeSvg = plan.edges
    .map(edge => renderEdge(edge, layout, colors))
    .join('\n');
  const nodeSvg = plan.nodes
    .map(node => renderNode(node, layout, resolvedConfig, colors))
    .join('\n');

  return `<svg class="flowchart-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${layout.width} ${layout.height}" role="img" aria-label="${escapeHtml(plan.title)}">
  <defs>
    <marker id="flowchart-arrow" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="12" markerHeight="12" orient="auto-start-reverse">
      <path d="M1 1 L11 6 L1 11 Z" fill="${colors.arrow}" />
    </marker>
  </defs>
  <rect x="0" y="0" width="${layout.width}" height="${layout.height}" rx="24" fill="transparent" />
  <g class="flowchart-edges">${edgeSvg}</g>
  <g class="flowchart-nodes">${nodeSvg}</g>
</svg>`;
}

export function computeFlowchartLayout(
  plan: FlowchartPlan,
  config?: FlowchartConfig,
): FlowchartLayout {
  const resolved = resolveConfig(config);
  const nodeById = new Map(plan.nodes.map(node => [node.id, node]));
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, FlowEdge[]>();

  for (const node of plan.nodes) {
    incoming.set(node.id, 0);
    outgoing.set(node.id, []);
  }
  for (const edge of plan.edges) {
    incoming.set(edge.to, (incoming.get(edge.to) ?? 0) + 1);
    outgoing.set(edge.from, [...(outgoing.get(edge.from) ?? []), edge]);
  }

  const roots = plan.nodes
    .filter(node => (incoming.get(node.id) ?? 0) === 0)
    .sort(sortNodesById);
  const queue = roots.length > 0 ? [...roots.map(node => node.id)] : plan.nodes.slice(0, 1).map(node => node.id);
  const visited = new Set<string>();
  const depthById = new Map<string, number>();

  for (const root of queue) depthById.set(root, 0);

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    const depth = depthById.get(current) ?? 0;

    for (const edge of outgoing.get(current) ?? []) {
      const nextDepth = depth + 1;
      const existingDepth = depthById.get(edge.to);
      if (existingDepth === undefined || nextDepth > existingDepth) {
        depthById.set(edge.to, nextDepth);
      }
      queue.push(edge.to);
    }
  }

  for (const node of plan.nodes) {
    if (!depthById.has(node.id)) {
      depthById.set(node.id, 0);
    }
  }

  const columns = new Map<number, string[]>();
  for (const node of plan.nodes) {
    const column = depthById.get(node.id) ?? 0;
    const bucket = columns.get(column) ?? [];
    bucket.push(node.id);
    columns.set(column, bucket);
  }

  const sortedColumns = [...columns.entries()].sort((a, b) => a[0] - b[0]);
  const positions: FlowchartLayout['positions'] = {};
  let maxHeight = 0;
  let totalWidth = resolved.padding * 2;
  let maxColumn = 0;

  for (const [column, ids] of sortedColumns) {
    ids.sort(sortIdsByGraph(plan.edges));
    const columnNodes = ids.map(id => nodeById.get(id)).filter(Boolean) as FlowNode[];
    const dims = columnNodes.map(node => getNodeDimensions(node, resolved));
    const columnWidth = Math.max(...dims.map(dim => dim.width), resolved.processWidth);
    const columnHeight = dims.reduce((sum, dim) => sum + dim.height, 0) + Math.max(columnNodes.length - 1, 0) * resolved.nodeGapY;
    const startY = resolved.padding + Math.max(0, (columnHeight < maxHeight ? (maxHeight - columnHeight) / 2 : 0));
    const x = resolved.padding + column * (resolved.stageWidth + resolved.nodeGapX);
    let cursorY = startY;

    columnNodes.forEach((node, rowIndex) => {
      const dim = getNodeDimensions(node, resolved);
      positions[node.id] = {
        x: x + Math.max(0, (columnWidth - dim.width) / 2),
        y: cursorY,
        width: dim.width,
        height: dim.height,
        row: rowIndex,
        column,
      };
      cursorY += dim.height + resolved.nodeGapY;
    });

    totalWidth = Math.max(totalWidth, x + columnWidth + resolved.padding);
    maxHeight = Math.max(maxHeight, columnHeight);
    maxColumn = Math.max(maxColumn, column);
  }

  const height = Math.max(maxHeight + resolved.padding * 2, 240);

  return {
    direction: 'TB',
    width: totalWidth,
    height,
    padding: resolved.padding,
    nodeGapX: resolved.nodeGapX,
    nodeGapY: resolved.nodeGapY,
    rows: Math.max(...sortedColumns.map(([, ids]) => ids.length), 1),
    columns: maxColumn + 1,
    positions,
  };
}

function renderNode(
  node: FlowNode,
  layout: FlowchartLayout,
  config: Required<FlowchartConfig>,
  colors: ThemeColors,
): string {
  const position = layout.positions[node.id];
  const { x, y, width, height } = position;
  const lines = wrapLabel(node.label, config.maxLabelCharsPerLine);
  const lineHeight = 18;
  const textStartY = y + height / 2 - ((lines.length - 1) * lineHeight) / 2;
  const fill = node.type === 'parallel' ? colors.parallel : node.type === 'decision' ? colors.accentSoft : colors.surface;
  const stroke = node.type === 'parallel' ? colors.parallel : colors.border;

  let shape = '';
  if (node.type === 'start-end') {
    shape = `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${Math.min(height / 2, 32)}" fill="${fill}" stroke="${stroke}" stroke-width="2" />`;
  } else if (node.type === 'decision') {
    const cx = x + width / 2;
    const cy = y + height / 2;
    shape = `<polygon points="${cx},${y} ${x + width},${cy} ${cx},${y + height} ${x},${cy}" fill="${fill}" stroke="${stroke}" stroke-width="2" />`;
  } else if (node.type === 'parallel') {
    const cx = x + width / 2;
    const cy = y + height / 2;
    const half = Math.min(width, height) / 2;
    shape = `<g>
      <rect x="${cx - half}" y="${cy - half}" width="${half * 2}" height="${half * 2}" rx="18" fill="${fill}" stroke="${stroke}" stroke-width="2" transform="rotate(45 ${cx} ${cy})" />
      <line x1="${cx}" y1="${cy - half * 0.7}" x2="${cx}" y2="${cy + half * 0.7}" stroke="${colors.surface}" stroke-width="4" stroke-linecap="round" />
      <line x1="${cx - half * 0.7}" y1="${cy}" x2="${cx + half * 0.7}" y2="${cy}" stroke="${colors.surface}" stroke-width="4" stroke-linecap="round" />
    </g>`;
  } else {
    shape = `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="18" fill="${fill}" stroke="${stroke}" stroke-width="2" />`;
  }

  const text = lines
    .map((line, index) => `<text x="${x + width / 2}" y="${textStartY + index * lineHeight}" text-anchor="middle" font-size="14" font-weight="${node.type === 'start-end' ? 700 : 600}" fill="${colors.text}" dominant-baseline="middle">${escapeHtml(line)}</text>`)
    .join('');

  return `<g data-node-id="${escapeHtml(node.id)}" data-node-type="${escapeHtml(node.type)}">
    ${shape}
    ${text}
  </g>`;
}

function renderEdge(edge: FlowEdge, layout: FlowchartLayout, colors: ThemeColors): string {
  const from = layout.positions[edge.from];
  const to = layout.positions[edge.to];
  if (!from || !to) return '';

  const startX = from.x + from.width;
  const startY = from.y + from.height / 2;
  const endX = to.x;
  const endY = to.y + to.height / 2;
  const deltaX = endX - startX;
  const bendX = startX + Math.max(deltaX / 2, 36);
  const path = `M ${startX} ${startY} C ${bendX} ${startY}, ${bendX} ${endY}, ${endX} ${endY}`;
  const color = edge.kind === 'yes'
    ? colors.yes
    : edge.kind === 'no'
      ? colors.no
      : edge.kind === 'parallel'
        ? colors.parallel
        : colors.arrow;

  const labelSvg = edge.label
    ? `<text x="${startX + deltaX / 2}" y="${Math.min(startY, endY) - 10}" text-anchor="middle" font-size="12" font-weight="700" fill="${color}">${escapeHtml(edge.label)}</text>`
    : '';

  return `<g data-edge="${escapeHtml(edge.from)}-${escapeHtml(edge.to)}">
    <path d="${path}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" marker-end="url(#flowchart-arrow)" />
    ${labelSvg}
  </g>`;
}

function resolveColors(theme: ThemePack, mode: Exclude<FlowchartThemeMode, 'auto'>): ThemeColors {
  const primary = theme.colorPrimary || '#1a73e8'; // Google Blue — neutral default for slides/charts
  const bg = mode === 'dark' ? '#0b1220' : theme.colorBg || '#f6f8fb';
  const surface = mode === 'dark' ? '#101a2f' : '#ffffff';
  const text = mode === 'dark' ? '#e5eefb' : '#132238';
  const muted = mode === 'dark' ? '#93a4bf' : '#516078';
  const border = mode === 'dark' ? '#2a3a54' : '#cad5e4';
  const accentSoft = mode === 'dark' ? 'rgba(77, 147, 255, 0.18)' : 'rgba(26, 115, 232, 0.12)';
  const parallel = mode === 'dark' ? '#8b7bff' : '#635bff';

  return {
    bg,
    surface,
    border,
    text,
    muted,
    accent: primary,
    accentSoft,
    arrow: mode === 'dark' ? '#b7c6dd' : '#56708f',
    yes: '#1f9d55',
    no: '#d64545',
    parallel,
    shadow: mode === 'dark' ? 'rgba(0, 0, 0, 0.35)' : 'rgba(19, 34, 56, 0.12)',
  };
}

function resolveConfig(config?: FlowchartConfig): Required<FlowchartConfig> {
  const safeConfig = Object.fromEntries(
    Object.entries(config ?? {}).filter(([, value]) => value !== undefined),
  ) as FlowchartConfig;
  return { ...DEFAULT_CONFIG, ...safeConfig };
}

function getNodeDimensions(node: FlowNode, config: Required<FlowchartConfig>): { width: number; height: number } {
  if (node.width && node.height) {
    return { width: node.width, height: node.height };
  }

  switch (node.type) {
    case 'start-end':
      return { width: node.width ?? config.startEndWidth, height: node.height ?? config.baseNodeHeight };
    case 'decision':
      return { width: node.width ?? config.decisionWidth, height: node.height ?? config.decisionHeight };
    case 'parallel':
      return { width: node.width ?? config.parallelSize, height: node.height ?? config.parallelSize };
    default:
      return { width: node.width ?? config.processWidth, height: node.height ?? config.baseNodeHeight };
  }
}

function wrapLabel(label: string, maxCharsPerLine: number): string[] {
  const normalized = label.trim().replace(/\s+/g, ' ');
  if (normalized.length <= maxCharsPerLine) return [normalized];

  const segments: string[] = [];
  let current = '';
  for (const char of normalized) {
    current += char;
    if (current.length >= maxCharsPerLine) {
      segments.push(current);
      current = '';
    }
  }
  if (current) segments.push(current);
  return segments;
}

function sortNodesById(a: FlowNode, b: FlowNode): number {
  return a.id.localeCompare(b.id, 'zh-CN');
}

function sortIdsByGraph(edges: FlowEdge[]): (a: string, b: string) => number {
  const rank = new Map<string, number>();
  let cursor = 0;
  for (const edge of edges) {
    if (!rank.has(edge.from)) rank.set(edge.from, cursor++);
    if (!rank.has(edge.to)) rank.set(edge.to, cursor++);
  }
  return (a, b) => (rank.get(a) ?? 999) - (rank.get(b) ?? 999) || a.localeCompare(b, 'zh-CN');
}

