// FlowchartSkill — FR-B04: Flowchart & sequence diagram generation
// Uses Mermaid.js CDN for rendering flowchart / sequence / state diagrams

import type { DesignSkill, SkillContract, Artifact, ThemePack } from '../../types.js';
import { buildArtifact } from '../skill-executor.js';
import { escapeHtml } from '../../utils.js';

type DiagramSubtype = 'flowchart' | 'sequence' | 'state';

function detectSubtype(input: string): DiagramSubtype {
  const lower = input.toLowerCase();
  if (/时序|sequence|消息|调用链|请求.*响应/.test(lower)) return 'sequence';
  if (/状态|state|状态机|lifecycle|生命周期/.test(lower)) return 'state';
  return 'flowchart';
}

function buildMermaidStub(subtype: DiagramSubtype, input: string): string {
  const desc = escapeHtml(input.slice(0, 120));
  switch (subtype) {
    case 'sequence':
      return `sequenceDiagram
    participant A as 用户
    participant B as 系统
    A->>B: 请求
    B-->>A: 响应
    Note over A,B: ${desc}`;
    case 'state':
      return `stateDiagram-v2
    [*] --> 初始
    初始 --> 处理中: 触发
    处理中 --> 完成: 成功
    处理中 --> 失败: 异常
    完成 --> [*]
    note right of 初始: ${desc}`;
    default:
      return `flowchart TD
    A[开始] --> B{判断}
    B -->|是| C[处理]
    B -->|否| D[跳过]
    C --> E[结束]
    D --> E`;
  }
}

const flowchartSkill: DesignSkill = {
  contract: {
    name: 'flowchart',
    artifactType: 'flowchart',
    description: 'Flowcharts, sequence diagrams & state diagrams via Mermaid.js',
    triggerKeywords: [
      'flowchart', 'flow chart', 'sequence', 'sequence diagram', 'state diagram',
      'state machine', '流程图', '时序图', '状态图', '状态机', '流程',
      '泳道图', 'swimlane', 'workflow', '工作流',
    ],
  } satisfies SkillContract,

  async generate(
    input: string,
    theme: ThemePack,
    context: Record<string, unknown>,
  ): Promise<Artifact> {
    const subtype = detectSubtype(input);
    const mermaidCode = buildMermaidStub(subtype, input);

    const cssVars = Object.entries(theme.cssVariables)
      .map(([k, v]) => `  ${k}: ${v};`)
      .join('\n');

    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Claw Design — ${subtypeLabel(subtype)}</title>
<style>
:root {
${cssVars}
}
body {
  font-family: var(--cd-font-body, 'Noto Sans SC', sans-serif);
  background: var(--cd-color-bg, #fff);
  margin: 2rem;
  display: flex;
  justify-content: center;
}
.diagram-wrapper {
  max-width: 900px;
  width: 100%;
  padding: 2rem;
  border-radius: var(--cd-radius, 4px);
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}
h1 {
  font-family: var(--cd-font-heading);
  color: var(--cd-color-primary);
  margin-bottom: 1.5rem;
}
.mermaid { text-align: center; }
.description {
  margin-top: 1.5rem;
  color: #666;
  font-size: 0.9rem;
}
</style>
</head>
<body>
<div class="diagram-wrapper">
  <h1>${subtypeLabel(subtype)}</h1>
  <div class="mermaid">
${mermaidCode}
  </div>
  <p class="description">${escapeHtml(input.slice(0, 300))}</p>
</div>
<script type="module">
  import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
  mermaid.initialize({
    startOnLoad: true,
    theme: 'default',
    themeVariables: {
      primaryColor: getComputedStyle(document.documentElement).getPropertyValue('--cd-color-primary').trim() || '#1a73e8', // Google Blue — neutral default for slides/charts
    },
  });
</script>
</body>
</html>`;

    return buildArtifact(
      (context['taskId'] as string) ?? 'unknown',
      'flowchart',
      html,
      1,
      { subtype },
    );
  },
};

function subtypeLabel(subtype: DiagramSubtype): string {
  const labels: Record<DiagramSubtype, string> = {
    flowchart: 'Flowchart 流程图',
    sequence: 'Sequence Diagram 时序图',
    state: 'State Diagram 状态图',
  };
  return labels[subtype];
}

export default flowchartSkill;
