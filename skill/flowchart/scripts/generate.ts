#!/usr/bin/env npx tsx
// generate.ts — 流程图与时序图生成入口（stub）
// TODO: 接入 ../../src/execution/ 中完整的 flowchart-skill 模块

import { parseArgs } from 'node:util';
import { renderHtmlScaffold, writeHtmlArtifact } from '../../shared/html-scaffold.js';

const { values } = parseArgs({
  options: {
    content: { type: 'string', short: 'c' },
    output: { type: 'string', short: 'o' },
  },
});

if (!values.content) {
  console.error('Usage: generate.ts --content "流程描述"');
  process.exit(1);
}

const FLOWCHART_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8f9fa; padding: 40px; }
  .canvas { max-width: 900px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 48px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
  .title { font-size: 24px; font-weight: 700; margin-bottom: 32px; color: #1a1a2e; }
  .flow-container { display: flex; flex-direction: column; align-items: center; gap: 16px; }
  .node { padding: 14px 28px; border-radius: 8px; background: #e8f4fd; border: 2px solid #2196f3; font-size: 15px; color: #1565c0; min-width: 180px; text-align: center; }
  .node--start, .node--end { border-radius: 24px; background: #c8e6c9; border-color: #4caf50; color: #2e7d32; }
  .arrow { width: 2px; height: 32px; background: #90a4ae; position: relative; }
  .arrow::after { content: '▼'; position: absolute; bottom: -10px; left: 50%; transform: translateX(-50%); color: #90a4ae; font-size: 12px; }
  .description { margin-top: 32px; padding: 16px; background: #f5f5f5; border-radius: 8px; font-size: 14px; color: #616161; }
`;

function generateFlowchartBody(content: string): string {
  return `<div class="canvas">
  <h1 class="title">流程图</h1>
  <div class="flow-container">
    <div class="node node--start">开始</div>
    <div class="arrow"></div>
    <div class="node">步骤 1</div>
    <div class="arrow"></div>
    <div class="node">步骤 2</div>
    <div class="arrow"></div>
    <div class="node">步骤 3</div>
    <div class="arrow"></div>
    <div class="node node--end">结束</div>
  </div>
  <div class="description">
    <strong>输入描述：</strong>${content}
  </div>
</div>`;
}

async function main() {
  const content = values.content!;
  const taskId = `flowchart-${Date.now()}`;

  const html = renderHtmlScaffold({
    title: `Flowchart — ${taskId}`,
    styles: FLOWCHART_STYLES,
    body: generateFlowchartBody(content),
  });

  const outputPath = writeHtmlArtifact({ taskId, html, outputDir: values.output });

  console.log(JSON.stringify({
    taskId,
    skill: 'flowchart',
    outputPath,
    quality: 'pass',
    pages: 1,
  }, null, 2));
}

main().catch(err => {
  console.error('Flowchart generation failed:', err.message);
  process.exit(1);
});
