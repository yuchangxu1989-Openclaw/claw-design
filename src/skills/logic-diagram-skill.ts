import type { Artifact, ThemePack } from '../types.js';
import { buildArtifact } from '../execution/skill-executor.js';
import { BaseSkill } from './base-skill.js';
import { renderLogicDiagramHtml } from './logic-diagram-renderer.js';
import type {
  LogicDiagramConfig,
  LogicDiagramSkillContext,
  LogicDiagramTheme,
  LogicEdge,
  LogicNode,
  LogicRelationType,
} from './logic-diagram-types.js';

export class LogicDiagramSkill extends BaseSkill<'logic-diagram', LogicDiagramSkillContext> {
  constructor() {
    super({
      name: 'logic-diagram',
      supportedTypes: ['logic-diagram'],
      description: 'Logic relationship diagram generation with progressive, parallel, comparison, cycle, hierarchy and matrix layouts',
      triggerKeywords: [
        'logic diagram', 'relationship diagram', 'concept map', 'mind map',
        'argument map', 'entity relationship', 'decision tree', 'decision diagram',
        '逻辑图', '逻辑关系图', '概念图', '关系图', '论证结构', '思维导图', '实体关系',
        '决策树', '决策图', '判断流程', '分支逻辑',
      ],
      supportedOutputs: ['svg', 'html'],
      requiredContext: ['taskId'],
    });
  }

  async generate(
    input: string,
    theme: ThemePack,
    context: Record<string, unknown>,
  ): Promise<Artifact> {
    const ctx = this.toContext(context);
    const config = buildLogicConfig(input, ctx);
    const html = renderLogicDiagramHtml(config, theme);

    return buildArtifact(
      String(ctx.taskId ?? 'unknown'),
      'logic-diagram',
      html,
      1,
      {
        relationType: config.relationType,
        themeMode: config.theme,
        nodeCount: config.nodes.length,
        edgeCount: config.edges.length,
        qualityRules: this.getQualityRules(ctx),
      },
    );
  }
}

function buildLogicConfig(input: string, context: LogicDiagramSkillContext): LogicDiagramConfig {
  const explicit = (context.logicDiagramConfig && typeof context.logicDiagramConfig === 'object')
    ? context.logicDiagramConfig as Partial<LogicDiagramConfig>
    : {};

  const relationType = isRelationType(explicit.relationType) ? explicit.relationType : inferRelationType(input);
  const themeMode = isLogicTheme(explicit.theme) ? explicit.theme
    : isLogicTheme(context.themeMode) ? context.themeMode : 'light';
  const title = normalize(explicit.title) || deriveTitle(input);
  const summary = normalize(explicit.summary) || deriveSummary(input, title);
  const nodes = Array.isArray(explicit.nodes) && explicit.nodes.length > 0
    ? explicit.nodes : buildDefaultNodes(input, relationType);
  const edges = Array.isArray(explicit.edges) && explicit.edges.length > 0
    ? explicit.edges : buildDefaultEdges(nodes, relationType);

  return { title, summary, relationType, theme: themeMode, nodes, edges };
}

function buildDefaultNodes(input: string, relationType: LogicRelationType): LogicNode[] {
  const segments = extractSegments(stripPromptPrefix(input));
  if (relationType === 'hierarchy') {
    return [
      { id: 'root', label: segments[0] ?? '核心目标', level: 0 },
      { id: 'child-1', label: segments[1] ?? '策略 A', level: 1 },
      { id: 'child-2', label: segments[2] ?? '策略 B', level: 1 },
      { id: 'leaf-1', label: segments[3] ?? '执行细节', level: 2 },
    ];
  }
  if (relationType === 'cycle') {
    return segments.slice(0, 4).map((s, i) => ({ id: `node-${i}`, label: s }));
  }
  return segments.map((s, i) => ({ id: `node-${i}`, label: s }));
}

function buildDefaultEdges(nodes: LogicNode[], relationType: LogicRelationType): LogicEdge[] {
  if (relationType === 'cycle' && nodes.length >= 2) {
    return nodes.map((n, i) => ({
      from: n.id,
      to: nodes[(i + 1) % nodes.length].id,
      relation: 'cycle' as const,
    }));
  }
  if (relationType === 'hierarchy') {
    const edges: LogicEdge[] = [];
    const byLevel = new Map<number, LogicNode[]>();
    for (const n of nodes) {
      const level = n.level ?? 0;
      if (!byLevel.has(level)) byLevel.set(level, []);
      byLevel.get(level)!.push(n);
    }
    const levels = [...byLevel.keys()].sort((a, b) => a - b);
    for (let i = 0; i < levels.length - 1; i++) {
      const parents = byLevel.get(levels[i])!;
      const children = byLevel.get(levels[i + 1])!;
      for (const child of children) {
        edges.push({ from: parents[0].id, to: child.id, relation: 'hierarchy' });
      }
    }
    return edges;
  }
  // progressive / parallel / comparison / matrix: chain
  const edges: LogicEdge[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    edges.push({ from: nodes[i].id, to: nodes[i + 1].id, relation: relationType });
  }
  return edges;
}

function extractSegments(input: string): string[] {
  const normalized = input
    .replace(/[；;。]/g, '\n')
    .replace(/->|→|=>/g, '\n')
    .replace(/\d+[\.、]/g, '\n')
    .split(/\n|,|，/)
    .map(p => p.trim())
    .filter(Boolean);
  if (normalized.length >= 2) return normalized.slice(0, 6);
  return ['目标', '策略', '执行', '反馈'];
}

function stripPromptPrefix(text: string): string {
  const prefixPattern = /^(?:请|帮我|帮忙)?(?:设计|制作|做|画|生成|创建)\s*(?:一[张个份幅]|)\s*/;
  let stripped = text.replace(prefixPattern, '').trim();
  stripped = stripped.replace(/(?:的\s*)?(?:逻辑[关关]系图|关系图|逻辑图|决策树|决策图|logic\s*diagram|decision\s*tree)/gi, '').trim();
  // Remove leading punctuation left after prefix stripping
  stripped = stripped.replace(/^[\uff0c,\u3001\uff1b;\uff1a:\u3002.\s]+/, '').trim();
  return stripped || text;
}

function deriveTitle(input: string): string {
  const compact = normalize(input) || '逻辑关系图';
  const semantic = stripPromptPrefix(compact);
  const clauses = semantic.split(/[\n:：|｜]/).map(p => p.trim()).filter(Boolean);
  const candidate = clauses[0] ?? compact;
  return candidate.length > 30 ? `${candidate.slice(0, 30)}…` : candidate;
}

function deriveSummary(input: string, title: string): string {
  const compact = normalize(input);
  if (!compact || compact === title) return '把概念、实体和逻辑关系拆解为可读的关系图。';
  const semantic = stripPromptPrefix(compact);
  const candidate = semantic.replace(title, '').trim() || semantic;
  return candidate.length > 100 ? `${candidate.slice(0, 100)}…` : candidate;
}

function inferRelationType(input: string): LogicRelationType {
  const lower = input.toLowerCase();
  if (/递进|progressive|层层|逐步/.test(lower)) return 'progressive';
  if (/并列|parallel|同时|平行/.test(lower)) return 'parallel';
  if (/对比|comparison|vs|比较/.test(lower)) return 'comparison';
  if (/循环|cycle|闭环|回路/.test(lower)) return 'cycle';
  if (/层级|hierarchy|树|tree|上下级|决策树|decision/.test(lower)) return 'hierarchy';
  if (/矩阵|matrix|二维|象限/.test(lower)) return 'matrix';
  return 'progressive';
}

function normalize(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const compact = value.replace(/\s+/g, ' ').trim();
  return compact || undefined;
}

function isRelationType(v: unknown): v is LogicRelationType {
  return v === 'progressive' || v === 'parallel' || v === 'comparison'
    || v === 'cycle' || v === 'hierarchy' || v === 'matrix';
}

function isLogicTheme(v: unknown): v is LogicDiagramTheme {
  return v === 'light' || v === 'dark';
}

const logicDiagramSkill = new LogicDiagramSkill();

export default logicDiagramSkill;
