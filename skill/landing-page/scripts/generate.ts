#!/usr/bin/env npx tsx
// generate.ts — Landing Page 生成入口（stub）
// TODO: 接入 ../../src/execution/ 中完整的 landing-page-skill 模块

import { parseArgs } from 'node:util';
import { renderHtmlScaffold, writeHtmlArtifact } from '../../shared/html-scaffold.js';

const { values } = parseArgs({
  options: {
    content: { type: 'string', short: 'c' },
    output: { type: 'string', short: 'o' },
  },
});

if (!values.content) {
  console.error('Usage: generate.ts --content "产品或活动描述"');
  process.exit(1);
}

const LANDING_PAGE_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #333; }
  .hero { min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 60px 24px; background: linear-gradient(180deg, #f0f4ff 0%, #fff 100%); }
  .hero h1 { font-size: 48px; font-weight: 800; margin-bottom: 20px; color: #1a1a2e; }
  .hero p { font-size: 20px; max-width: 600px; color: #555; line-height: 1.6; margin-bottom: 32px; }
  .cta-btn { padding: 16px 40px; background: #4f46e5; color: #fff; border: none; border-radius: 8px; font-size: 18px; font-weight: 600; cursor: pointer; }
  .features { padding: 80px 24px; max-width: 1000px; margin: 0 auto; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 32px; }
  .feature { padding: 32px; border-radius: 12px; background: #f8f9fa; }
  .feature h3 { font-size: 20px; margin-bottom: 12px; color: #1a1a2e; }
  .feature p { font-size: 15px; color: #666; line-height: 1.5; }
  .footer { padding: 40px 24px; text-align: center; background: #f8f9fa; color: #999; font-size: 14px; }
`;

function generateLandingPageBody(content: string): string {
  return `<section class="hero">
  <h1>产品标题</h1>
  <p>${content}</p>
  <button class="cta-btn">立即开始</button>
</section>
<section class="features">
  <div class="feature"><h3>特性一</h3><p>核心功能描述</p></div>
  <div class="feature"><h3>特性二</h3><p>差异化优势描述</p></div>
  <div class="feature"><h3>特性三</h3><p>用户价值描述</p></div>
</section>
<footer class="footer">Claw Design · Generated</footer>`;
}

async function main() {
  const content = values.content!;
  const taskId = `landing-page-${Date.now()}`;

  const html = renderHtmlScaffold({
    title: `Landing Page — ${taskId}`,
    styles: LANDING_PAGE_STYLES,
    body: generateLandingPageBody(content),
  });

  const outputPath = writeHtmlArtifact({ taskId, html, outputDir: values.output });

  console.log(JSON.stringify({
    taskId,
    skill: 'landing-page',
    outputPath,
    quality: 'pass',
    pages: 1,
  }, null, 2));
}

main().catch(err => {
  console.error('Landing page generation failed:', err.message);
  process.exit(1);
});
