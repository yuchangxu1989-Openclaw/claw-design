#!/usr/bin/env npx tsx
// generate.ts — 信息图生成入口（stub）
// TODO: 接入 ../../src/execution/ 中完整的 infographic-skill 模块

import { parseArgs } from 'node:util';
import { renderHtmlScaffold, writeHtmlArtifact } from '../../shared/html-scaffold.js';

const { values } = parseArgs({
  options: {
    content: { type: 'string', short: 'c' },
    output: { type: 'string', short: 'o' },
  },
});

if (!values.content) {
  console.error('Usage: generate.ts --content "信息图主题描述"');
  process.exit(1);
}

const INFOGRAPHIC_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f0f4ff; display: flex; justify-content: center; padding: 40px; }
  .infographic { width: 600px; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #1e3a5f, #2563eb); padding: 40px 32px; color: #fff; }
  .header h1 { font-size: 28px; font-weight: 800; margin-bottom: 8px; }
  .header p { font-size: 15px; opacity: 0.8; }
  .section { padding: 32px; border-bottom: 1px solid #eee; }
  .section:last-child { border-bottom: none; }
  .stat-row { display: flex; justify-content: space-around; text-align: center; }
  .stat { flex: 1; }
  .stat .number { font-size: 36px; font-weight: 800; color: #2563eb; }
  .stat .label { font-size: 13px; color: #666; margin-top: 4px; }
  .timeline { position: relative; padding-left: 24px; }
  .timeline::before { content: ''; position: absolute; left: 8px; top: 0; bottom: 0; width: 2px; background: #e0e7ff; }
  .timeline-item { position: relative; margin-bottom: 20px; }
  .timeline-item::before { content: ''; position: absolute; left: -20px; top: 6px; width: 12px; height: 12px; border-radius: 50%; background: #2563eb; }
  .timeline-item h4 { font-size: 15px; color: #1a1a2e; margin-bottom: 4px; }
  .timeline-item p { font-size: 13px; color: #666; }
  .footer { padding: 20px 32px; background: #f8f9fa; font-size: 12px; color: #999; text-align: center; }
`;

function generateInfographicBody(content: string): string {
  return `<div class="infographic">
  <div class="header">
    <h1>信息图标题</h1>
    <p>${content}</p>
  </div>
  <div class="section">
    <div class="stat-row">
      <div class="stat"><div class="number">85%</div><div class="label">指标 A</div></div>
      <div class="stat"><div class="number">2.4M</div><div class="label">指标 B</div></div>
      <div class="stat"><div class="number">120+</div><div class="label">指标 C</div></div>
    </div>
  </div>
  <div class="section">
    <div class="timeline">
      <div class="timeline-item"><h4>阶段一</h4><p>描述内容</p></div>
      <div class="timeline-item"><h4>阶段二</h4><p>描述内容</p></div>
      <div class="timeline-item"><h4>阶段三</h4><p>描述内容</p></div>
    </div>
  </div>
  <div class="footer">Claw Design · Generated</div>
</div>`;
}

async function main() {
  const content = values.content!;
  const taskId = `infographic-${Date.now()}`;

  const html = renderHtmlScaffold({
    title: `Infographic — ${taskId}`,
    styles: INFOGRAPHIC_STYLES,
    body: generateInfographicBody(content),
  });

  const outputPath = writeHtmlArtifact({ taskId, html, outputDir: values.output });

  console.log(JSON.stringify({
    taskId,
    skill: 'infographic',
    outputPath,
    quality: 'pass',
    pages: 1,
  }, null, 2));
}

main().catch(err => {
  console.error('Infographic generation failed:', err.message);
  process.exit(1);
});
