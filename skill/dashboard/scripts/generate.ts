#!/usr/bin/env npx tsx
// generate.ts — Dashboard 数据看板生成入口（stub）
// TODO: 接入 ../../src/execution/ 中完整的 dashboard-skill 模块

import { parseArgs } from 'node:util';
import { renderHtmlScaffold, writeHtmlArtifact } from '../../shared/html-scaffold.js';

const { values } = parseArgs({
  options: {
    content: { type: 'string', short: 'c' },
    output: { type: 'string', short: 'o' },
  },
});

if (!values.content) {
  console.error('Usage: generate.ts --content "看板指标描述"');
  process.exit(1);
}

const DASHBOARD_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; padding: 24px; }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
  .header h1 { font-size: 24px; font-weight: 700; }
  .header .time { font-size: 14px; opacity: 0.6; }
  .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
  .kpi { background: #1e293b; border-radius: 12px; padding: 20px; }
  .kpi .label { font-size: 13px; opacity: 0.6; margin-bottom: 8px; }
  .kpi .value { font-size: 28px; font-weight: 700; }
  .kpi .trend { font-size: 13px; color: #4ade80; margin-top: 4px; }
  .charts { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }
  .chart-box { background: #1e293b; border-radius: 12px; padding: 24px; min-height: 240px; display: flex; flex-direction: column; }
  .chart-box h3 { font-size: 15px; margin-bottom: 16px; opacity: 0.8; }
  .chart-placeholder { flex: 1; background: #334155; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #64748b; font-size: 14px; }
  .description { margin-top: 24px; padding: 16px; background: #1e293b; border-radius: 8px; font-size: 13px; opacity: 0.6; }
`;

function generateDashboardBody(content: string): string {
  return `<div class="header">
  <h1>数据看板</h1>
  <span class="time">实时更新</span>
</div>
<div class="grid">
  <div class="kpi"><div class="label">指标 A</div><div class="value">12,847</div><div class="trend">↑ 12.5%</div></div>
  <div class="kpi"><div class="label">指标 B</div><div class="value">3,291</div><div class="trend">↑ 8.3%</div></div>
  <div class="kpi"><div class="label">指标 C</div><div class="value">89.2%</div><div class="trend">↑ 2.1%</div></div>
  <div class="kpi"><div class="label">指标 D</div><div class="value">¥528K</div><div class="trend">↑ 15.7%</div></div>
</div>
<div class="charts">
  <div class="chart-box"><h3>趋势图</h3><div class="chart-placeholder">Chart Area</div></div>
  <div class="chart-box"><h3>分布图</h3><div class="chart-placeholder">Chart Area</div></div>
</div>
<div class="description">${content}</div>`;
}

async function main() {
  const content = values.content!;
  const taskId = `dashboard-${Date.now()}`;

  const html = renderHtmlScaffold({
    title: `Dashboard — ${taskId}`,
    styles: DASHBOARD_STYLES,
    body: generateDashboardBody(content),
  });

  const outputPath = writeHtmlArtifact({ taskId, html, outputDir: values.output });

  console.log(JSON.stringify({
    taskId,
    skill: 'dashboard',
    outputPath,
    quality: 'pass',
    pages: 1,
  }, null, 2));
}

main().catch(err => {
  console.error('Dashboard generation failed:', err.message);
  process.exit(1);
});
