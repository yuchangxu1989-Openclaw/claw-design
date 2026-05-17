import type { Artifact, ThemePack } from '../types.js';
import { buildArtifact } from '../execution/skill-executor.js';
import { BaseSkill } from './base-skill.js';
import { computeFlowchartLayout, renderFlowchartHtml } from './flowchart-renderer.js';
import type {
  FlowEdge,
  FlowNode,
  FlowchartPlan,
  FlowchartProviderContext,
  FlowchartProviderResult,
  FlowchartSkillContext,
} from './flowchart-types.js';

export class FlowchartSkill extends BaseSkill<'flowchart', FlowchartSkillContext> {
  constructor() {
    super({
      name: 'flowchart',
      supportedTypes: ['flowchart'],
      description: 'Flowchart generation with SVG/HTML output, auto layout, branch and parallel support',
      triggerKeywords: [
        'flowchart', 'flow chart', 'workflow', 'process flow', 'business flow',
        '流程图', '流程', '工作流', '业务流程', '审批流程', '并行流程', '分支流程',
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
    const typedContext = this.toContext(context);
    const fallbackPlan = buildSeedPlan(input);
    const providerPlan = await this.requestProviderPlan(input, theme, typedContext, fallbackPlan);
    const plan = normalizePlan(mergePlan(fallbackPlan, providerPlan));
    const flowchartConfig = typedContext.flowchartConfig ?? {};
    plan.layout = computeFlowchartLayout(plan, {
      ...flowchartConfig,
      themeMode: typedContext.themeMode ?? flowchartConfig.themeMode,
    });

    const html = renderFlowchartHtml(plan, theme, {
      ...flowchartConfig,
      themeMode: typedContext.themeMode ?? flowchartConfig.themeMode,
    });

    return buildArtifact(
      String(typedContext.taskId ?? 'unknown'),
      'flowchart',
      html,
      1,
      {
        title: plan.title,
        summary: plan.summary,
        flowType: plan.flowType,
        nodeCount: plan.nodes.length,
        edgeCount: plan.edges.length,
        providerUsed: Boolean(providerPlan),
        layout: plan.layout,
        qualityRules: this.getQualityRules(typedContext),
      },
    );
  }

  private async requestProviderPlan(
    input: string,
    theme: ThemePack,
    context: FlowchartSkillContext,
    fallbackPlan: FlowchartPlan,
  ): Promise<FlowchartProviderResult | null> {
    const provider = this.resolveProvider(context, 'flowchartProvider', 'provider');
    if (!provider || typeof (provider as { generateFlowchartPlan?: unknown }).generateFlowchartPlan !== 'function') {
      return null;
    }

    const payload: FlowchartProviderContext = {
      input,
      theme,
      fallbackPlan,
      prompt: buildProviderPrompt(input, fallbackPlan),
      metadata: context,
    };

    return (provider as { generateFlowchartPlan: (ctx: FlowchartProviderContext) => Promise<FlowchartProviderResult | null> })
      .generateFlowchartPlan(payload);
  }
}

function buildSeedPlan(input: string): FlowchartPlan {
  const cleaned = sanitizeFlowInput(input);
  const flowType = inferFlowType(cleaned);
  const steps = extractSteps(cleaned);
  const title = deriveTitle(input, flowType, steps);
  const summary = buildSummary(steps, flowType);

  if (flowType === 'parallel') {
    return buildParallelPlan(title, summary, steps);
  }
  if (flowType === 'branch') {
    return buildBranchPlan(title, summary, steps);
  }
  return buildSequentialPlan(title, summary, steps);
}

function buildSequentialPlan(title: string, summary: string, steps: string[]): FlowchartPlan {
  const processSteps = ensureSequentialSteps(steps);
  const nodes: FlowNode[] = [
    { id: 'start', label: '开始', type: 'start-end' },
    ...processSteps.map((step, index) => ({ id: `step-${index + 1}`, label: step, type: 'process' as const })),
    { id: 'end', label: '结束', type: 'start-end' },
  ];

  const edges: FlowEdge[] = [];
  for (let index = 0; index < nodes.length - 1; index += 1) {
    edges.push({ from: nodes[index].id, to: nodes[index + 1].id, kind: 'default' });
  }

  return { title, summary, flowType: 'sequential', nodes, edges };
}

function buildBranchPlan(title: string, summary: string, steps: string[]): FlowchartPlan {
  const base = ensureSequentialSteps(steps);
  const beforeDecision = base[0] ?? '接收输入';
  const yesStep = pickBranchStep(base, /成功|通过|满足|确认|同意|approved?|yes/i, 1, '执行主流程');
  const noStep = pickBranchStep(base, /失败|拒绝|不满足|异常|驳回|no/i, 2, '异常处理');
  const mergeStep = base[3] ?? '汇总结果';

  const nodes: FlowNode[] = [
    { id: 'start', label: '开始', type: 'start-end' },
    { id: 'intake', label: beforeDecision, type: 'process' },
    { id: 'decision', label: inferDecisionLabel(summary), type: 'decision' },
    { id: 'branch-yes', label: yesStep, type: 'process' },
    { id: 'branch-no', label: noStep, type: 'process' },
    { id: 'merge', label: mergeStep, type: 'process' },
    { id: 'end', label: '结束', type: 'start-end' },
  ];

  const edges: FlowEdge[] = [
    { from: 'start', to: 'intake' },
    { from: 'intake', to: 'decision' },
    { from: 'decision', to: 'branch-yes', label: '是', kind: 'yes' },
    { from: 'decision', to: 'branch-no', label: '否', kind: 'no' },
    { from: 'branch-yes', to: 'merge' },
    { from: 'branch-no', to: 'merge' },
    { from: 'merge', to: 'end' },
  ];

  return { title, summary, flowType: 'branch', nodes, edges };
}

function buildParallelPlan(title: string, summary: string, steps: string[]): FlowchartPlan {
  const base = ensureSequentialSteps(steps);
  const branchA = base[1] ?? '路径 A';
  const branchB = base[2] ?? '路径 B';
  const mergeStep = base[3] ?? '汇总并继续';

  const nodes: FlowNode[] = [
    { id: 'start', label: '开始', type: 'start-end' },
    { id: 'prepare', label: base[0] ?? '准备上下文', type: 'process' },
    { id: 'fork', label: '并行拆分', type: 'parallel' },
    { id: 'lane-a', label: branchA, type: 'process', lane: 'A' },
    { id: 'lane-b', label: branchB, type: 'process', lane: 'B' },
    { id: 'join', label: '汇合', type: 'parallel' },
    { id: 'merge', label: mergeStep, type: 'process' },
    { id: 'end', label: '结束', type: 'start-end' },
  ];

  const edges: FlowEdge[] = [
    { from: 'start', to: 'prepare' },
    { from: 'prepare', to: 'fork' },
    { from: 'fork', to: 'lane-a', label: '并行 A', kind: 'parallel' },
    { from: 'fork', to: 'lane-b', label: '并行 B', kind: 'parallel' },
    { from: 'lane-a', to: 'join' },
    { from: 'lane-b', to: 'join' },
    { from: 'join', to: 'merge' },
    { from: 'merge', to: 'end' },
  ];

  return { title, summary, flowType: 'parallel', nodes, edges };
}

function mergePlan(seed: FlowchartPlan, incoming: FlowchartProviderResult | null): FlowchartPlan {
  if (!incoming) return seed;

  return {
    title: normalizeSentence(incoming.title, seed.title),
    summary: normalizeSentence(incoming.summary, seed.summary),
    flowType: incoming.flowType ?? seed.flowType,
    nodes: Array.isArray(incoming.nodes) && incoming.nodes.length > 0 ? incoming.nodes : seed.nodes,
    edges: Array.isArray(incoming.edges) && incoming.edges.length > 0 ? incoming.edges : seed.edges,
  };
}

function normalizePlan(plan: FlowchartPlan): FlowchartPlan {
  const seen = new Set<string>();
  const nodes = plan.nodes.filter(node => {
    if (!node?.id || seen.has(node.id)) return false;
    seen.add(node.id);
    return Boolean(node.label) && Boolean(node.type);
  });

  const nodeIds = new Set(nodes.map(node => node.id));
  const edges = plan.edges.filter(edge => nodeIds.has(edge.from) && nodeIds.has(edge.to));

  return {
    ...plan,
    nodes,
    edges,
  };
}

function buildProviderPrompt(input: string, fallbackPlan: FlowchartPlan): string {
  return [
    '把输入解析成流程图结构 JSON。',
    '要求：只用以下节点类型 start-end / process / decision / parallel。',
    '要求：只输出自上而下流程，不要泳道。',
    '要求：edges 使用 from/to/label/kind。',
    `输入：${input}`,
    `兜底结构：${JSON.stringify(fallbackPlan)}`,
  ].join('\n');
}

function inferFlowType(input: string): FlowchartPlan['flowType'] {
  if (/并行|parallel|同时|并发|fork|join/i.test(input)) return 'parallel';
  if (/如果|是否|判断|分支|审批|通过|拒绝|yes|no|条件/i.test(input)) return 'branch';
  return 'sequential';
}

function deriveTitle(input: string, flowType: FlowchartPlan['flowType'], steps: string[]): string {
  const subject = extractFlowSubject(input, steps);
  const prefix = flowType === 'parallel' ? '并行流程图' : flowType === 'branch' ? '分支流程图' : '流程图';
  return subject ? `${subject}${prefix}` : prefix;
}

function extractSteps(input: string): string[] {
  const normalized = input
    .replace(/[；;。]/g, '\n')
    .replace(/->|→|=>/g, '\n')
    .replace(/\d+[\.、]/g, '\n')
    .split(/\n|,/)
    .map(part => part.trim())
    .map(part => sanitizeStep(part))
    .filter(Boolean);

  if (normalized.length >= 2) {
    return normalized.slice(0, 6);
  }

  return fallbackStepsFromText(input);
}

function fallbackStepsFromText(input: string): string[] {
  const trimmed = input.trim();
  if (!trimmed) return ['启动', '处理', '完成'];
  return ['启动', normalizeSentence(sanitizeStep(trimmed).slice(0, 20), '处理'), '完成'];
}

function ensureSequentialSteps(steps: string[]): string[] {
  if (steps.length >= 3) return steps.slice(0, 4);
  return [...steps, ...['处理信息', '输出结果']].slice(0, 3);
}

function inferDecisionLabel(input: string): string {
  if (/审批/.test(input)) return '是否通过审批';
  if (/库存/.test(input)) return '库存是否充足';
  if (/支付/.test(input)) return '支付是否成功';
  return '条件是否满足';
}

function pickBranchStep(
  steps: string[],
  matcher: RegExp,
  fallbackIndex: number,
  fallbackText: string,
): string {
  return steps.find(step => matcher.test(step)) ?? steps[fallbackIndex] ?? fallbackText;
}

function normalizeSentence(input: unknown, fallback: string): string {
  if (typeof input !== 'string') return fallback;
  const cleaned = input.trim().replace(/\s+/g, ' ');
  return cleaned || fallback;
}

function sanitizeFlowInput(input: string): string {
  const normalized = normalizeSentence(input, '把业务流程拆成可读的流程图。');
  const parts = normalized.split(/[:：]/);
  if (parts.length >= 2) {
    const stepSection = parts.slice(1).join('：').trim();
    if (stepSection) return stepSection;
  }

  return normalized
    .replace(/^(请|帮我|麻烦)?(画|生成|制作|做|设计)一个?/u, '')
    .replace(/(用户)?[^，。,；;]{0,24}(流程图|工作流图|业务流程图|审批流程图)\s*/u, '')
    .trim() || normalized;
}

function sanitizeStep(step: string): string {
  return step
    .replace(/^(请|帮我|麻烦)?(画|生成|制作|做|设计)(一个)?/u, '')
    .replace(/^(用户注册|注册|登录|下单|审批)?流程图/u, '')
    .replace(/^(流程图|工作流图|业务流程图|审批流程图)[：:]?/u, '')
    .replace(/^(并行|分支|顺序)?流程[：:]?/u, '')
    .replace(/^(步骤|阶段)[：:]?/u, '')
    .trim();
}

function extractFlowSubject(input: string, steps: string[]): string {
  const original = normalizeSentence(input, '');
  const beforeColon = original.split(/[:：]/)[0]?.trim() ?? '';
  const subject = beforeColon
    .replace(/^(请|帮我|麻烦)?(画|生成|制作|做|设计)(一个)?/u, '')
    .replace(/(流程图|工作流图|业务流程图|审批流程图)$/u, '')
    .trim();

  if (subject) return subject;
  if (steps.length > 0) return steps[0];
  return '';
}

function buildSummary(steps: string[], flowType: FlowchartPlan['flowType']): string {
  const normalizedSteps = ensureSequentialSteps(steps);
  const prefix = flowType === 'parallel' ? '并行步骤' : flowType === 'branch' ? '关键决策流程' : '关键步骤';
  return `${prefix}：${normalizedSteps.join(' → ')}`;
}

const flowchartSkill = new FlowchartSkill();

export default flowchartSkill;
