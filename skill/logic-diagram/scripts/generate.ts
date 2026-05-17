#!/usr/bin/env npx tsx
// generate.ts — 逻辑关系图生成入口（stub）
// TODO: 接入 ../../src/execution/ 中完整的 logic-diagram-skill 模块

import { parseArgs } from 'node:util';
import { renderHtmlScaffold, writeHtmlArtifact } from '../../shared/html-scaffold.js';

const { values } = parseArgs({
  options: {
    content: { type: 'string', short: 'c' },
    output: { type: 'string', short: 'o' },
  },
});

if (!values.content) {
  console.error('Usage: generate.ts --content "逻辑关系描述"');
  process.exit(1);
}

const LOGIC_DIAGRAM_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8f9fa; padding: 40px; }
  .canvas { max-width: 900px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 48px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
  .title { font-size: 24px; font-weight: 700; margin-bottom: 40px; color: #1a1a2e; text-align: center; }
  .diagram { position: relative; min-height: 400px; }
  .concept { position: absolute; padding: 12px 20px; border-radius: 8px; font-size: 14px; font-weight: 600; text-align: center; min-width: 120px; }
  .concept--root { top: 50%; left: 50%; transform: translate(-50%, -50%); background: #4f46e5; color: #fff; font-size: 16px; padding: 16px 28px; border-radius: 12px; }
  .concept--l1 { background: #e8f4fd; border: 2px solid #2196f3; color: #1565c0; }
  .concept--l1:nth-child(2) { top: 10%; left: 20%; }
  .concept--l1:nth-child(3) { top: 10%; right: 20%; }
  .concept--l1:nth-child(4) { bottom: 10%; left: 20%; }
  .concept--l1:nth-child(5) { bottom: 10%; right: 20%; }
  svg.links { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
  svg.links line { stroke: #90a4ae; stroke-width: 2; stroke-dasharray: 6 4; }
  .description { margin-top: 32px; padding: 16px; background: #f5f5f5; border-radius: 8px; font-size: 14px; color: #616161; }
`;

function generateLogicDiagramBody(content: string): string {
  return `<div class="canvas">
  <h1 class="title">逻辑关系图</h1>
  <div class="diagram">
    <svg class="links" viewBox="0 0 800 400">
      <line x1="400" y1="200" x2="200" y2="60"/>
      <line x1="400" y1="200" x2="600" y2="60"/>
      <line x1="400" y1="200" x2="200" y2="340"/>
      <line x1="400" y1="200" x2="600" y2="340"/>
    </svg>
    <div class="concept concept--root">核心概念</div>
    <div class="concept concept--l1">子概念 A</div>
    <div class="concept concept--l1">子概念 B</div>
    <div class="concept concept--l1">子概念 C</div>
    <div class="concept concept--l1">子概念 D</div>
  </div>
  <div class="description"><strong>输入描述：</strong>${content}</div>
</div>`;
}

async function main() {
  const content = values.content!;
  const taskId = `logic-diagram-${Date.now()}`;

  const html = renderHtmlScaffold({
    title: `Logic Diagram — ${taskId}`,
    styles: LOGIC_DIAGRAM_STYLES,
    body: generateLogicDiagramBody(content),
  });

  const outputPath = writeHtmlArtifact({ taskId, html, outputDir: values.output });

  console.log(JSON.stringify({
    taskId,
    skill: 'logic-diagram',
    outputPath,
    quality: 'pass',
    pages: 1,
  }, null, 2));
}

main().catch(err => {
  console.error('Logic diagram generation failed:', err.message);
  process.exit(1);
});
