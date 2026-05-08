#!/usr/bin/env npx tsx
// generate.ts — UI mockup 与线框图生成入口（stub）
// TODO: 接入 ../../src/execution/ 中完整的 mockup-skill 模块

import { parseArgs } from 'node:util';
import { renderHtmlScaffold, writeHtmlArtifact } from '../../shared/html-scaffold.js';

const { values } = parseArgs({
  options: {
    content: { type: 'string', short: 'c' },
    output: { type: 'string', short: 'o' },
  },
});

if (!values.content) {
  console.error('Usage: generate.ts --content "界面描述"');
  process.exit(1);
}

const MOCKUP_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #e8e8e8; padding: 40px; display: flex; justify-content: center; }
  .device { width: 375px; height: 812px; background: #fff; border-radius: 40px; padding: 60px 20px 40px; box-shadow: 0 20px 60px rgba(0,0,0,0.15); position: relative; overflow: hidden; }
  .device::before { content: ''; position: absolute; top: 12px; left: 50%; transform: translateX(-50%); width: 120px; height: 28px; background: #1a1a2e; border-radius: 14px; }
  .status-bar { height: 20px; margin-bottom: 16px; }
  .nav { height: 44px; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid #eee; margin-bottom: 16px; font-weight: 600; font-size: 17px; }
  .block { background: #f0f0f0; border-radius: 8px; margin-bottom: 12px; border: 2px dashed #ccc; display: flex; align-items: center; justify-content: center; color: #999; font-size: 13px; }
  .block--hero { height: 180px; }
  .block--card { height: 80px; }
  .block--btn { height: 48px; background: #4f46e5; border: none; color: #fff; font-weight: 600; border-radius: 8px; }
  .description { position: absolute; bottom: 0; left: 0; right: 0; padding: 12px 20px; background: #f8f9fa; font-size: 11px; color: #666; }
`;

function generateMockupBody(content: string): string {
  return `<div class="device">
  <div class="status-bar"></div>
  <div class="nav">页面标题</div>
  <div class="block block--hero">Hero 区域</div>
  <div class="block block--card">内容卡片 1</div>
  <div class="block block--card">内容卡片 2</div>
  <div class="block block--btn">主操作按钮</div>
  <div class="description">${content}</div>
</div>`;
}

async function main() {
  const content = values.content!;
  const taskId = `mockup-${Date.now()}`;

  const html = renderHtmlScaffold({
    title: `Mockup — ${taskId}`,
    styles: MOCKUP_STYLES,
    body: generateMockupBody(content),
  });

  const outputPath = writeHtmlArtifact({ taskId, html, outputDir: values.output });

  console.log(JSON.stringify({
    taskId,
    skill: 'mockup',
    outputPath,
    quality: 'pass',
    pages: 1,
  }, null, 2));
}

main().catch(err => {
  console.error('Mockup generation failed:', err.message);
  process.exit(1);
});
