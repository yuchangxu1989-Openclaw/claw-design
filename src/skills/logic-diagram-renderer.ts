import type { ThemePack } from '../types.js';
import type { LogicDiagramConfig, LogicDiagramTheme, LogicEdge, LogicNode, LogicRelationType } from './logic-diagram-types.js';

interface LogicPalette {
  bg: string; surface: string; border: string; text: string;
  muted: string; accent: string; accentSoft: string; shadow: string;
  edgeColor: string;
}

/** Subtle level-based node accent colors for visual hierarchy */
const LEVEL_ACCENTS = [
  { stroke: '#4f6df5', fill: 'rgba(79,109,245,0.06)' },
  { stroke: '#22c997', fill: 'rgba(34,201,151,0.06)' },
  { stroke: '#f5a623', fill: 'rgba(245,166,35,0.06)' },
  { stroke: '#e8556d', fill: 'rgba(232,85,109,0.06)' },
  { stroke: '#8b5cf6', fill: 'rgba(139,92,246,0.06)' },
];

const RELATION_LABELS: Record<LogicRelationType, string> = {
  progressive: '递进', parallel: '并列', comparison: '对比',
  cycle: '循环', hierarchy: '层级', matrix: '矩阵',
};

export function renderLogicDiagramHtml(config: LogicDiagramConfig, theme: ThemePack): string {
  const palette = resolvePalette(config.theme, theme);
  const cssVars = buildCssVariables(theme);
  const svgContent = renderLogicSvg(config, palette);

  return `<!DOCTYPE html>
<html lang="zh-CN" data-theme="${config.theme}" data-relation="${config.relationType}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(config.title)} — Logic Diagram</title>
  <style>
    :root {
      ${cssVars}
      --logic-bg: ${palette.bg};
      --logic-surface: ${palette.surface};
      --logic-border: ${palette.border};
      --logic-text: ${palette.text};
      --logic-muted: ${palette.muted};
      --logic-accent: ${palette.accent};
      --logic-accent-soft: ${palette.accentSoft};
      --logic-shadow: ${palette.shadow};
    }
    * { box-sizing: border-box; }
    body {
      margin: 0; min-height: 100vh; padding: 32px;
      background: var(--logic-bg);
      font-family: var(--cd-font-body, 'Noto Sans SC', sans-serif);
      color: var(--logic-text);
    }
    .logic-shell {
      max-width: 1100px; margin: 0 auto;
      background: var(--logic-surface);
      border: 1px solid var(--logic-border);
      border-radius: 18px;
      padding: 28px;
      box-shadow: 0 12px 40px var(--logic-shadow);
    }
    .logic-header { margin-bottom: 20px; }
    .logic-header__title { margin: 0 0 6px; font-size: 1.5rem; font-family: var(--cd-font-heading, 'Inter', sans-serif); }
    .logic-header__summary { margin: 0; color: var(--logic-muted); font-size: 0.92rem; }
    .logic-header__meta { display: flex; gap: 8px; margin-top: 10px; }
    .logic-badge {
      padding: 4px 12px; border-radius: 999px; font-size: 0.72rem; font-weight: 700;
      background: var(--logic-accent); color: #fff; text-transform: uppercase;
    }
    .logic-stage { width: 100%; overflow-x: auto; }
    .logic-stage svg { width: 100%; height: auto; display: block; }
  </style>
</head>
<body>
  <main class="logic-shell">
    <header class="logic-header">
      <h1 class="logic-header__title">${esc(config.title)}</h1>
      <p class="logic-header__summary">${esc(config.summary)}</p>

    </header>
    <section class="logic-stage" aria-label="logic-diagram">
      ${svgContent}
    </section>
  </main>
</body>
</html>`;
}

function renderLogicSvg(config: LogicDiagramConfig, palette: LogicPalette): string {
  const nodes = config.nodes;
  const edges = config.edges;
  const nodeW = 180;
  const nodeH = 60;
  const gapX = 60;
  const gapY = 80;
  const padding = 40;

  const positions = layoutNodes(nodes, edges, config.relationType, nodeW, nodeH, gapX, gapY);
  const maxX = Math.max(...Object.values(positions).map(p => p.x + nodeW));
  const maxY = Math.max(...Object.values(positions).map(p => p.y + nodeH));
  const svgW = maxX + padding * 2;
  const svgH = maxY + padding * 2;

  const edgesSvg = edges.map(e => {
    const from = positions[e.from];
    const to = positions[e.to];
    if (!from || !to) return '';
    const x1 = padding + from.x + nodeW / 2;
    const y1 = padding + from.y + nodeH;
    const x2 = padding + to.x + nodeW / 2;
    const y2 = padding + to.y;
    const midY = (y1 + y2) / 2;
    const pathD = x1 === x2
      ? `M ${x1} ${y1} L ${x2} ${y2}`
      : `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
    const labelHtml = e.label
      ? `<text x="${(x1 + x2) / 2 + 8}" y="${midY}" text-anchor="start" fill="${palette.muted}" font-size="11" font-weight="500">${esc(e.label)}</text>`
      : '';
    return `<path d="${pathD}" fill="none" stroke="${palette.edgeColor}" stroke-width="1.5" marker-end="url(#logic-arrow)"/>${labelHtml}`;
  }).join('\n    ');

  const nodesSvg = nodes.map(n => {
    const pos = positions[n.id];
    if (!pos) return '';
    const x = padding + pos.x;
    const y = padding + pos.y;
    const levelIdx = (n.level ?? 0) % LEVEL_ACCENTS.length;
    const nodeAccent = LEVEL_ACCENTS[levelIdx];
    const desc = n.description ? `<text x="${x + nodeW / 2}" y="${y + nodeH / 2 + 18}" text-anchor="middle" fill="${palette.muted}" font-size="10">${esc(n.description.length > 24 ? n.description.slice(0, 23) + '…' : n.description)}</text>` : '';
    return `<g data-node="${n.id}">
      <rect x="${x}" y="${y}" width="${nodeW}" height="${nodeH}" rx="12" fill="${nodeAccent.fill}" stroke="${nodeAccent.stroke}" stroke-width="1.5"/>
      <text x="${x + nodeW / 2}" y="${y + nodeH / 2 + (desc ? -2 : 5)}" text-anchor="middle" fill="${palette.text}" font-size="13" font-weight="600">${esc(n.label)}</text>
      ${desc}
    </g>`;
  }).join('\n    ');

  return `<svg class="logic-svg" viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <marker id="logic-arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="${palette.edgeColor}"/>
      </marker>
    </defs>
    ${edgesSvg}
    ${nodesSvg}
  </svg>`;
}

function layoutNodes(
  nodes: LogicNode[],
  edges: LogicEdge[],
  relationType: LogicRelationType,
  nodeW: number, nodeH: number, gapX: number, gapY: number,
): Record<string, { x: number; y: number }> {
  const positions: Record<string, { x: number; y: number }> = {};

  if (relationType === 'hierarchy') {
    const levels = new Map<number, LogicNode[]>();
    for (const n of nodes) {
      const level = n.level ?? 0;
      if (!levels.has(level)) levels.set(level, []);
      levels.get(level)!.push(n);
    }
    const sortedLevels = [...levels.keys()].sort((a, b) => a - b);
    for (const level of sortedLevels) {
      const row = sortedLevels.indexOf(level);
      const nodesInLevel = levels.get(level)!;
      for (let col = 0; col < nodesInLevel.length; col++) {
        positions[nodesInLevel[col].id] = {
          x: col * (nodeW + gapX),
          y: row * (nodeH + gapY),
        };
      }
    }
  } else if (relationType === 'parallel' || relationType === 'matrix') {
    const cols = Math.ceil(Math.sqrt(nodes.length));
    for (let i = 0; i < nodes.length; i++) {
      positions[nodes[i].id] = {
        x: (i % cols) * (nodeW + gapX),
        y: Math.floor(i / cols) * (nodeH + gapY),
      };
    }
  } else if (relationType === 'cycle') {
    const cx = nodes.length * (nodeW + gapX) / 4;
    const cy = cx;
    const radius = Math.max(cx, 120);
    for (let i = 0; i < nodes.length; i++) {
      const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
      positions[nodes[i].id] = {
        x: cx + radius * Math.cos(angle) - nodeW / 2 + nodeW,
        y: cy + radius * Math.sin(angle) - nodeH / 2 + nodeH,
      };
    }
  } else {
    // progressive, comparison, default: top-down sequential
    for (let i = 0; i < nodes.length; i++) {
      positions[nodes[i].id] = {
        x: 0,
        y: i * (nodeH + gapY),
      };
    }
  }

  return positions;
}

function resolvePalette(themeMode: LogicDiagramTheme, theme: ThemePack): LogicPalette {
  const light: LogicPalette = {
    bg: '#f7f8fb', surface: '#ffffff', border: '#e2e5ea', text: '#111827',
    muted: '#6b7280', accent: '#4f46e5', accentSoft: 'rgba(79,70,229,0.08)',
    shadow: 'rgba(0,0,0,0.05)', edgeColor: '#94a3b8',
  };
  const dark: LogicPalette = {
    bg: '#0c1018', surface: '#161b28', border: '#272e40', text: '#f0f2f6',
    muted: '#8892a8', accent: '#818cf8', accentSoft: 'rgba(129,140,248,0.12)',
    shadow: 'rgba(0,0,0,0.25)', edgeColor: '#64748b',
  };
  const base = themeMode === 'dark' ? dark : light;
  if (theme.colorPrimary) base.accent = theme.colorPrimary;
  return base;
}

function buildCssVariables(theme: ThemePack): string {
  return Object.entries(theme.cssVariables)
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n      ');
}

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
