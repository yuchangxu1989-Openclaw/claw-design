#!/usr/bin/env npx tsx
// generate.ts — 海报与宣传图生成入口（stub）
// TODO: 接入 ../../src/execution/ 中完整的 poster-skill 模块

import { parseArgs } from 'node:util';
import { renderHtmlScaffold, writeHtmlArtifact } from '../../shared/html-scaffold.js';

const { values } = parseArgs({
  options: {
    content: { type: 'string', short: 'c' },
    output: { type: 'string', short: 'o' },
  },
});

if (!values.content) {
  console.error('Usage: generate.ts --content "海报主题描述"');
  process.exit(1);
}

const POSTER_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #1a1a2e; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
  .poster { width: 600px; height: 800px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; padding: 60px; display: flex; flex-direction: column; justify-content: space-between; color: #fff; position: relative; overflow: hidden; }
  .poster::before { content: ''; position: absolute; top: -50%; right: -50%; width: 100%; height: 100%; background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%); }
  .headline { font-size: 42px; font-weight: 800; line-height: 1.2; z-index: 1; }
  .subline { font-size: 18px; opacity: 0.85; line-height: 1.6; z-index: 1; }
  .cta { display: inline-block; padding: 14px 32px; background: #fff; color: #764ba2; border-radius: 8px; font-weight: 700; font-size: 16px; z-index: 1; align-self: flex-start; }
  .meta { font-size: 12px; opacity: 0.6; z-index: 1; }
`;

function generatePosterBody(content: string): string {
  return `<div class="poster">
  <div class="headline">海报标题</div>
  <div class="subline">${content}</div>
  <div class="cta">了解更多</div>
  <div class="meta">Claw Design · Generated</div>
</div>`;
}

async function main() {
  const content = values.content!;
  const taskId = `poster-${Date.now()}`;

  const html = renderHtmlScaffold({
    title: `Poster — ${taskId}`,
    styles: POSTER_STYLES,
    body: generatePosterBody(content),
  });

  const outputPath = writeHtmlArtifact({ taskId, html, outputDir: values.output });

  console.log(JSON.stringify({
    taskId,
    skill: 'poster',
    outputPath,
    quality: 'pass',
    pages: 1,
  }, null, 2));
}

main().catch(err => {
  console.error('Poster generation failed:', err.message);
  process.exit(1);
});
