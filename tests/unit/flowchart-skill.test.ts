import { describe, expect, it } from 'vitest';
import flowchartSkill, { FlowchartSkill } from '../../src/skills/flowchart-skill.js';
import { SkillRegistry } from '../../src/skills/skill-registry.js';
import { computeFlowchartLayout, renderFlowchartSvg } from '../../src/skills/flowchart-renderer.js';
import type { ThemePack } from '../../src/types.js';

const theme: ThemePack = {
  colorPrimary: '#3366ff',
  colorBg: '#ffffff',
  fontHeading: 'Heading',
  fontBody: 'Body',
  spacingUnit: '8px',
  radius: '12px',
  cssVariables: {
    '--cd-color-primary': '#3366ff',
    '--cd-color-bg': '#ffffff',
    '--cd-font-heading': 'Heading',
    '--cd-font-body': 'Body',
    '--cd-radius': '12px',
  },
};

describe('FlowchartSkill', () => {
  it('publishes base-skill metadata through the shared contract', () => {
    const skill = new FlowchartSkill();

    expect(skill.contract.supportedTypes).toEqual(['flowchart']);
    expect(skill.contract.requiredContext).toEqual(['taskId']);
    expect(skill.contract.supportedOutputs).toEqual(['svg', 'html']);
  });

  it('generates a sequential flowchart with SVG inside standalone HTML', async () => {
    const artifact = await flowchartSkill.generate(
      '用户提交申请，系统校验信息，生成结果并通知用户',
      theme,
      { taskId: 'task-flow-1', themeMode: 'light' },
    );

    expect(artifact.taskId).toBe('task-flow-1');
    expect(artifact.type).toBe('flowchart');
    expect(artifact.pages).toBe(1);
    expect(artifact.html).toContain('<svg class="flowchart-svg"');
    expect(artifact.html).toContain('data-node-type="start-end"');
    expect(artifact.html).toContain('流程图');
    expect(artifact.metadata).toMatchObject({
      flowType: 'sequential',
      providerUsed: false,
    });
  });

  it('parses steps from prompt text instead of echoing the original instruction into node labels', async () => {
    const artifact = await flowchartSkill.generate(
      '画一个用户注册流程图：输入信息→验证→发送验证码→确认→完成',
      theme,
      { taskId: 'task-flow-clean' },
    );

    expect(artifact.html).toContain('用户注册流程图');
    expect(artifact.html).toContain('输入信息');
    expect(artifact.html).not.toContain('画一个用户注册流程图：输入信息');
    expect(artifact.html).not.toContain('画一个');
  });

  it('generates a branch flowchart with decision node and yes/no edges', async () => {
    const artifact = await flowchartSkill.generate(
      '审批流程：提交申请，如果审批通过则执行主流程，否则通知驳回，最后结束',
      theme,
      { taskId: 'task-flow-branch' },
    );

    expect(artifact.html).toContain('data-node-type="decision"');
    expect(artifact.html).toContain('>是<');
    expect(artifact.html).toContain('>否<');
    expect(artifact.metadata).toMatchObject({ flowType: 'branch' });
  });

  it('generates a parallel flowchart with parallel gateways', async () => {
    const artifact = await flowchartSkill.generate(
      '订单处理并行流程：接收订单，同时进行库存检查，同时进行支付校验，汇总结果后发货',
      theme,
      { taskId: 'task-flow-parallel', themeMode: 'dark' },
    );

    expect(artifact.html).toContain('data-node-type="parallel"');
    expect(artifact.html).toContain('html data-theme="dark"');
    expect(artifact.metadata).toMatchObject({ flowType: 'parallel' });
  });

  it('merges provider-supplied nodes and edges into the rendered flowchart', async () => {
    const skill = new FlowchartSkill();
    const providerCalls: string[] = [];

    const artifact = await skill.generate(
      '做一个登录审批流程图',
      theme,
      {
        taskId: 'task-flow-provider',
        flowchartProvider: {
          async generateFlowchartPlan(context) {
            providerCalls.push(context.prompt);
            return {
              title: '登录审批流程',
              summary: '校验用户身份后分支处理',
              flowType: 'branch',
              nodes: [
                { id: 'start', label: '开始', type: 'start-end' },
                { id: 'auth', label: '校验身份', type: 'process' },
                { id: 'decision', label: '是否通过', type: 'decision' },
                { id: 'allow', label: '允许登录', type: 'process' },
                { id: 'deny', label: '拒绝登录', type: 'process' },
                { id: 'end', label: '结束', type: 'start-end' },
              ],
              edges: [
                { from: 'start', to: 'auth' },
                { from: 'auth', to: 'decision' },
                { from: 'decision', to: 'allow', label: '是', kind: 'yes' },
                { from: 'decision', to: 'deny', label: '否', kind: 'no' },
                { from: 'allow', to: 'end' },
                { from: 'deny', to: 'end' },
              ],
            };
          },
        },
      },
    );

    expect(providerCalls).toHaveLength(1);
    expect(artifact.html).toContain('登录审批流程');
    expect(artifact.html).toContain('校验身份');
    expect(artifact.metadata).toMatchObject({ providerUsed: true, flowType: 'branch' });
  });

  it('allows registry lookup by flowchart artifact type', () => {
    const registry = new SkillRegistry();
    registry.register(new FlowchartSkill());

    expect(registry.getByArtifactType('flowchart').map(skill => skill.contract.name)).toEqual(['flowchart']);
  });

  it('computes top-down layout and renders edge markers in svg', () => {
    const plan = {
      title: '测试流程图',
      summary: '测试布局',
      flowType: 'branch' as const,
      nodes: [
        { id: 'start', label: '开始', type: 'start-end' as const },
        { id: 'decision', label: '是否通过', type: 'decision' as const },
        { id: 'yes', label: '执行', type: 'process' as const },
        { id: 'no', label: '回退', type: 'process' as const },
        { id: 'end', label: '结束', type: 'start-end' as const },
      ],
      edges: [
        { from: 'start', to: 'decision' },
        { from: 'decision', to: 'yes', label: '是', kind: 'yes' as const },
        { from: 'decision', to: 'no', label: '否', kind: 'no' as const },
        { from: 'yes', to: 'end' },
        { from: 'no', to: 'end' },
      ],
    };

    const layout = computeFlowchartLayout(plan);
    const svg = renderFlowchartSvg(plan, theme, undefined, layout);

    expect(layout.direction).toBe('TB');
    expect(layout.columns).toBeGreaterThanOrEqual(3);
    expect(layout.positions.decision.column).toBeGreaterThan(layout.positions.start.column);
    expect(svg).toContain('marker-end="url(#flowchart-arrow)"');
    expect(svg).toContain('data-node-type="decision"');
  });
});
