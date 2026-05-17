import type { DesignSkill, SkillContract, Artifact, ThemePack } from '../types.js';
import { buildArtifact } from './skill-executor.js';
import { escapeHtml } from '../utils.js';

interface ArchNode {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  groupId?: string;
}

interface ArchEdge {
  from: string;
  to: string;
}

/** A logical grouping of nodes (layer/zone/module) */
interface ArchGroup {
  id: string;
  label: string;
  nodeIds: string[];
}

const LIGHT_COLORS = ['#dbeafe', '#dcfce7', '#fef3c7', '#fce7f3', '#ede9fe', '#e0f2fe'];
const DARK_COLORS = ['#1e3a5f', '#1a3d2e', '#3d2e1a', '#3d1a2e', '#2e1a3d', '#1a2e3d'];

const LIGHT_THEME_VARS = `
  --arch-surface: #ffffff;
  --arch-border: #d7dfec;
  --arch-text: #122033;
  --arch-muted: #5d6b82;
  --arch-edge: #5b6478;
  --bg-primary: #f5f7fb;
  --text-primary: #122033;
  --border-color: #d7dfec;
`;

const DARK_THEME_VARS = `
  --arch-surface: #1a1f2e;
  --arch-border: #2d3548;
  --arch-text: #e2e8f0;
  --arch-muted: #94a3b8;
  --arch-edge: #64748b;
  --bg-primary: #0f1219;
  --text-primary: #e2e8f0;
  --border-color: #2d3548;
`;

const DEFAULT_COMPONENTS = ['客户端', 'API网关', '应用服务', '数据库'];

export class ArchDiagramSkill implements DesignSkill {
  readonly contract: SkillContract = {
    name: 'arch-diagram',
    artifactType: 'arch-diagram',
    description: '中文架构图生成，输出 HTML/SVG 架构关系图',
    triggerKeywords: [
      'architecture', 'system diagram', 'component diagram', 'deployment',
      '架构图', '系统图', '组件图', '部署图', '拓扑图', '技术架构',
    ],
  };

  async generate(
    input: string,
    theme: ThemePack,
    context: Record<string, unknown>,
  ): Promise<Artifact> {
    const cssVars = Object.entries(theme.cssVariables)
      .map(([k, v]) => `  ${k}: ${v};`)
      .join('\n');
    const themeMode = (context.themeMode as string) ?? 'light';
    const nodeColors = themeMode === 'dark' ? DARK_COLORS : LIGHT_COLORS;

    const parsed = parseArchInput(input);
    const title = parsed.title;
    const subtitle = parsed.subtitle;
    const groups = extractGroups(input);
    const components = groups.length > 0
      ? groups.flatMap(g => g.nodeIds)
      : extractComponents(input);
    const { nodes, edges } = groups.length > 0
      ? buildGroupedDiagramGraph(groups, nodeColors)
      : buildDiagramGraph(components, nodeColors);
    const svg = renderDiagramSvg(nodes, edges, groups);

    const bodyClass = themeMode === 'dark' ? ' class="theme-dark"' : '';

    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>系统架构图</title>
<style>
:root {
${cssVars}
${LIGHT_THEME_VARS}
}
body.theme-dark {
${DARK_THEME_VARS}
}
* { box-sizing: border-box; }
body {
  margin: 0;
  min-height: 100vh;
  padding: 32px;
  background: var(--bg-primary, var(--cd-color-bg, #f5f7fb));
  color: var(--arch-text);
  font-family: var(--cd-font-body, 'Noto Sans SC', sans-serif);
}
.diagram-container {
  max-width: 1080px;
  margin: 0 auto;
  padding: 28px;
  border: 1px solid var(--arch-border);
  border-radius: 24px;
  background: var(--arch-surface);
  box-shadow: 0 16px 48px rgba(18, 32, 51, 0.08);
}
.diagram-header {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}
.diagram-title {
  margin: 0;
  font-family: var(--cd-font-heading, 'Noto Sans SC', sans-serif);
  color: var(--cd-color-primary, #1a73e8);
  font-size: 30px;
}
.diagram-subtitle {
  margin: 0;
  color: var(--arch-muted);
  font-size: 15px;
  line-height: 1.6;
}
.diagram-stage {
  overflow-x: auto;
}
.diagram-stage svg {
  width: 100%;
  height: auto;
  display: block;
}
.diagram-caption {
  margin: 18px 0 0;
  color: var(--arch-muted);
  font-size: 14px;
  line-height: 1.7;
}
</style>
</head>
<body${bodyClass}>
<div class="diagram-container">
  <header class="diagram-header">
    <h1 class="diagram-title">${escapeHtml(title)}</h1>
    <p class="diagram-subtitle">${escapeHtml(subtitle)}</p>
  </header>
  <section class="diagram-stage" aria-label="architecture-diagram">
    ${svg}
  </section>
  <p class="diagram-caption">${escapeHtml(`包含 ${nodes.map(n => n.label).join('、')} 等组件。`)}</p>
</div>
</body>
</html>`;

    return buildArtifact(
      String(context.taskId ?? 'unknown'),
      'arch-diagram',
      html,
      1,
      {
        title,
        components: nodes.map(node => node.label),
        edgeCount: edges.length,
      },
    );
  }
}

function parseArchInput(input: string): { title: string; subtitle: string } {
  const stripped = input
    .replace(/^(?:请|帮我|帮忙)?(?:设计|制作|做|画|生成|创建)\s*(?:一[张个份幅]|)\s*/u, '')
    .replace(/(?:的\s*)?(?:微服务架构图|系统架构图|架构图|组件图|部署图)/g, '')
    .replace(/^[，、,\s]+/, '')
    .trim();
  const beforeColon = stripped.split(/[:：]/)[0]?.trim() || '';
  const subject = beforeColon.replace(/^(?:包含|包括|例如|比如)\s*/, '').trim();
  // If subject is a component list (contains enumeration separator), use generic title
  const isComponentList = /[、，,]/.test(subject);
  const title = !isComponentList && subject.length > 2 && subject.length <= 30
    ? `${subject}架构图`
    : '系统架构图';
  const subtitle = subject && subject.length > 2
    ? `${subject}的核心组件与调用关系。`
    : `${title}的核心组件与调用关系。`;
  return { title, subtitle };
}

function extractComponents(input: string): string[] {
  const afterColon = input.split(/[:：]/)[1]?.trim();
  const source = afterColon || input;
  const normalized = source
    .replace(/[，、]/g, ',')
    .replace(/\s+/g, ' ')
    .replace(/包含|包括|例如|比如|画一个|做一个|生成一个|微服务架构图|系统架构图|架构图|组件图|部署图/g, '')
    .trim();

  const parts = normalized
    .split(',')
    .map(item => item.trim())
    .map(item => item.replace(/^(和|以及)/, '').trim())
    .filter(Boolean);

  return dedupe(parts.length > 0 ? parts : DEFAULT_COMPONENTS).slice(0, 12);
}

function buildDiagramGraph(components: string[], colors: string[]): { nodes: ArchNode[]; edges: ArchEdge[] } {
  const layers = normalizeLayers(components);
  const nodes: ArchNode[] = [];
  const edges: ArchEdge[] = [];
  const boxWidth = 180;
  const boxHeight = 68;
  const cols = Math.min(layers.length, 4);

  layers.forEach((label, index) => {
    const id = `node-${index + 1}`;
    const column = index % cols;
    const row = Math.floor(index / cols);
    nodes.push({
      id,
      label,
      x: 56 + column * 240,
      y: 56 + row * 170,
      width: boxWidth,
      height: boxHeight,
      fill: colors[index % colors.length],
    });
  });

  for (let index = 0; index < nodes.length - 1; index += 1) {
    edges.push({ from: nodes[index].id, to: nodes[index + 1].id });
  }

  return { nodes, edges };
}

function normalizeLayers(components: string[]): string[] {
  const layers = dedupe(components);
  if (layers.length >= 4) return layers;

  const expanded = [...layers];
  for (const fallback of DEFAULT_COMPONENTS) {
    if (expanded.length >= 4) break;
    if (!expanded.includes(fallback)) expanded.push(fallback);
  }
  return expanded;
}

function renderDiagramSvg(nodes: ArchNode[], edges: ArchEdge[], groups: ArchGroup[] = []): string {
  const padding = 56;
  const maxX = Math.max(...nodes.map(n => n.x + n.width));
  const maxY = Math.max(...nodes.map(n => n.y + n.height));
  const width = maxX + padding;
  const height = maxY + padding;
  const nodeById = new Map(nodes.map(node => [node.id, node]));

  const groupSvg = groups.map(group => {
    const groupNodes = group.nodeIds
      .map(id => nodes.find(n => n.label === id || n.id === id))
      .filter((n): n is ArchNode => !!n);
    if (groupNodes.length === 0) return '';
    return renderGroupBoundary(group, groupNodes);
  }).join('');

  const edgeSvg = edges.map(edge => {
    const from = nodeById.get(edge.from);
    const to = nodeById.get(edge.to);
    if (!from || !to) return '';
    const startX = from.x + from.width;
    const startY = from.y + from.height / 2;
    const endX = to.x;
    const endY = to.y + to.height / 2;
    const midX = startX + (endX - startX) / 2;
    return `<path d="M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}" class="edge" />`;
  }).join('');

  const nodeSvg = nodes.map(node => `<g data-node-id="${escapeHtml(node.id)}">
    <rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" rx="18" fill="${node.fill}" stroke="#364152" stroke-width="1.5" />
    <text x="${node.x + node.width / 2}" y="${node.y + node.height / 2}" class="node-label">${escapeHtml(node.label)}</text>
  </g>`).join('');

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="系统架构图">
    <defs>
      <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--arch-edge, #5b6478)" />
      </marker>
    </defs>
    <style>
      .edge { stroke: var(--arch-edge, #5b6478); stroke-width: 2.4; fill: none; marker-end: url(#arrow); }
      .node-label { fill: var(--arch-text, #122033); font-size: 14px; font-weight: 700; text-anchor: middle; dominant-baseline: middle; }
      .group-boundary { fill: none; stroke: var(--arch-border, #d7dfec); stroke-width: 1.5; stroke-dasharray: 6 4; }
      .group-label { fill: var(--arch-muted, #5d6b82); font-size: 12px; font-weight: 600; }
    </style>
    ${groupSvg}
    ${edgeSvg}
    ${nodeSvg}
  </svg>`;
}

function buildDescription(nodes: ArchNode[], edges: ArchEdge[]): string {
  const labels = nodes.map(node => node.label);
  const chain = edges.map(edge => {
    const from = nodes.find(node => node.id === edge.from)?.label ?? '';
    const to = nodes.find(node => node.id === edge.to)?.label ?? '';
    return `${from} -> ${to}`;
  }).filter(Boolean);

  return `图中包含 ${labels.join('、')}。主链路为 ${chain.join('，')}。`;
}

/** Extract groups from input using colon/semicolon patterns like "前端层:Web、App;后端层:API" */
function extractGroups(input: string): ArchGroup[] {
  const groupPattern = /([^;；,，]+?)\s*[:：]\s*([^;；]+)/g;
  const groups: ArchGroup[] = [];
  let match: RegExpExecArray | null;

  while ((match = groupPattern.exec(input)) !== null) {
    const label = match[1].trim()
      .replace(/^(?:请|帮我|帮忙)?(?:设计|制作|做|画|生成|创建)\s*(?:一[张个份幅]|)\s*/u, '')
      .trim();
    if (!label) continue;
    const nodeIds = match[2]
      .split(/[、，,]/)
      .map(s => s.trim())
      .filter(Boolean);
    if (nodeIds.length > 0) {
      groups.push({ id: `group-${groups.length + 1}`, label, nodeIds });
    }
  }

  return groups;
}

/** Build diagram graph with nodes arranged by group (groups stacked vertically, nodes horizontal within) */
function buildGroupedDiagramGraph(groups: ArchGroup[], colors: string[]): { nodes: ArchNode[]; edges: ArchEdge[] } {
  const nodes: ArchNode[] = [];
  const edges: ArchEdge[] = [];
  const boxWidth = 180;
  const boxHeight = 68;
  let nodeIndex = 0;

  groups.forEach((group, groupRow) => {
    group.nodeIds.forEach((label, col) => {
      const id = `node-${nodeIndex + 1}`;
      nodes.push({
        id,
        label,
        x: 80 + col * 220,
        y: 80 + groupRow * 180,
        width: boxWidth,
        height: boxHeight,
        fill: colors[nodeIndex % colors.length],
        groupId: group.id,
      });
      nodeIndex++;
    });
  });

  // Connect last node of each group to first node of next group
  let prevGroupLastNode: ArchNode | undefined;
  for (const group of groups) {
    const groupNodes = nodes.filter(n => n.groupId === group.id);
    // Intra-group edges
    for (let i = 0; i < groupNodes.length - 1; i++) {
      edges.push({ from: groupNodes[i].id, to: groupNodes[i + 1].id });
    }
    // Inter-group edge
    if (prevGroupLastNode && groupNodes.length > 0) {
      edges.push({ from: prevGroupLastNode.id, to: groupNodes[0].id });
    }
    prevGroupLastNode = groupNodes[groupNodes.length - 1];
  }

  return { nodes, edges };
}

/** Render a dashed boundary rectangle around a group of nodes */
function renderGroupBoundary(group: ArchGroup, groupNodes: ArchNode[]): string {
  const pad = 24;
  const minX = Math.min(...groupNodes.map(n => n.x)) - pad;
  const minY = Math.min(...groupNodes.map(n => n.y)) - pad - 16;
  const maxX = Math.max(...groupNodes.map(n => n.x + n.width)) + pad;
  const maxY = Math.max(...groupNodes.map(n => n.y + n.height)) + pad;
  const w = maxX - minX;
  const h = maxY - minY;

  return `<g class="layer" data-group-id="${escapeHtml(group.id)}" data-layer-name="${escapeHtml(group.label)}">
    <rect x="${minX}" y="${minY}" width="${w}" height="${h}" rx="12" class="group-boundary" />
    <text x="${minX + 8}" y="${minY + 14}" class="group-label">${escapeHtml(group.label)}</text>
  </g>`;
}

function dedupe(items: string[]): string[] {
  return [...new Set(items)];
}

export default new ArchDiagramSkill();
