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
}

interface ArchEdge {
  from: string;
  to: string;
}

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
    const parsed = parseArchInput(input);
    const title = parsed.title;
    const subtitle = parsed.subtitle;
    const components = extractComponents(input);
    const { nodes, edges } = buildDiagramGraph(components);
    const svg = renderDiagramSvg(nodes, edges);

    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>系统架构图</title>
<style>
:root {
${cssVars}
  --arch-surface: #ffffff;
  --arch-border: #d7dfec;
  --arch-text: #122033;
  --arch-muted: #5d6b82;
  --arch-edge: #5b6478;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  min-height: 100vh;
  padding: 32px;
  background: var(--cd-color-bg, #f5f7fb);
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
<body>
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

  return dedupe(parts.length > 0 ? parts : DEFAULT_COMPONENTS).slice(0, 6);
}

function buildDiagramGraph(components: string[]): { nodes: ArchNode[]; edges: ArchEdge[] } {
  const layers = normalizeLayers(components);
  const nodes: ArchNode[] = [];
  const edges: ArchEdge[] = [];
  const boxWidth = 180;
  const boxHeight = 68;
  const colors = ['#dbeafe', '#dcfce7', '#fef3c7', '#fce7f3', '#ede9fe', '#e0f2fe'];

  layers.forEach((label, index) => {
    const id = `node-${index + 1}`;
    const column = index < 3 ? index : index - 1;
    const row = index < 3 ? 0 : 1;
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

function renderDiagramSvg(nodes: ArchNode[], edges: ArchEdge[]): string {
  const padding = 56;
  const maxX = Math.max(...nodes.map(n => n.x + n.width));
  const maxY = Math.max(...nodes.map(n => n.y + n.height));
  const width = maxX + padding;
  const height = maxY + padding;
  const nodeById = new Map(nodes.map(node => [node.id, node]));
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
      .node-label { fill: #122033; font-size: 14px; font-weight: 700; text-anchor: middle; dominant-baseline: middle; }
    </style>
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

function dedupe(items: string[]): string[] {
  return [...new Set(items)];
}

export default new ArchDiagramSkill();
