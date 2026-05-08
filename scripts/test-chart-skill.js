#!/usr/bin/env node
// Test script for ChartSkill — validates input parsing and SVG output

// We test the exported parseChartInput + the full generate() via ChartSkill

import { parseChartInput, ChartSkill } from '../dist/execution/chart-skill.js';

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) { passed++; console.log(`  ✅ ${msg}`); }
  else { failed++; console.error(`  ❌ ${msg}`); }
}

// ── Parser tests ──────────────────────────────────────────────────

console.log('\n🔍 Parser tests');

const pie1 = parseChartInput('饼图：Step 1 选题脚本 20%, Step 2 拍摄 15%, Step 3 素材管理与粗剪 25%, Step 4 精剪发布 40%');
assert(pie1.chartType === 'pie', `Detects 饼图 → pie (got ${pie1.chartType})`);
assert(pie1.items.length === 4, `Parses 4 items (got ${pie1.items.length})`);
assert(pie1.items[0].label.includes('选题脚本'), `First item label contains 选题脚本 (got "${pie1.items[0]?.label}")`);
assert(pie1.items[0].value === 20, `First item value = 20 (got ${pie1.items[0]?.value})`);
assert(pie1.items[3].value === 40, `Last item value = 40 (got ${pie1.items[3]?.value})`);

const bar1 = parseChartInput('柱状图：A: 30, B: 50, C: 80');
assert(bar1.chartType === 'bar', `Detects 柱状图 → bar (got ${bar1.chartType})`);
assert(bar1.items.length === 3, `Parses 3 colon items (got ${bar1.items.length})`);

const line1 = parseChartInput('line chart: Jan 10%, Feb 25%, Mar 40%');
assert(line1.chartType === 'line', `Detects line → line (got ${line1.chartType})`);
assert(line1.items.length === 3, `Parses 3 items (got ${line1.items.length})`);

const def1 = parseChartInput('Sales: 100, Revenue: 200');
assert(def1.chartType === 'bar', `Defaults to bar (got ${def1.chartType})`);

// ── Generate tests (full HTML output) ─────────────────────────────

console.log('\n🎨 Generate tests');

const skill = new ChartSkill();
const theme = {
  colorPrimary: '#6C5CE7',
  colorBg: '#faf9f5',
  fontHeading: "'Noto Sans SC'",
  fontBody: "'Noto Sans SC'",
  spacingUnit: '8px',
  radius: '8px',
  cssVariables: {
    '--cd-color-primary': '#6C5CE7',
    '--cd-color-bg': '#faf9f5',
    '--cd-font-heading': "'Noto Sans SC'",
    '--cd-font-body': "'Noto Sans SC'",
    '--cd-radius': '8px',
  },
};

const ctx = { taskId: 'test-001' };

const pieInput = '饼图：Step 1 选题脚本 20%, Step 2 拍摄 15%, Step 3 素材管理与粗剪 25%, Step 4 精剪发布 40%';
const pieResult = await skill.generate(pieInput, theme, ctx);

assert(pieResult.type === 'chart', `Artifact type = chart (got ${pieResult.type})`);
assert(pieResult.status === 'ready', `Artifact status = ready (got ${pieResult.status})`);
assert(pieResult.html.includes('<svg'), 'HTML contains <svg');
assert(pieResult.html.includes('<path'), 'HTML contains <path (donut arcs)');
assert(pieResult.html.includes('选题脚本'), 'HTML contains 选题脚本 label');
assert(pieResult.html.includes('拍摄'), 'HTML contains 拍摄 label');
assert(!pieResult.html.includes('Q1'), 'HTML does NOT contain hardcoded Q1');
assert(!pieResult.html.includes('Series A'), 'HTML does NOT contain hardcoded Series A');

// Bar chart test
const barResult = await skill.generate('柱状图：A: 30, B: 50, C: 80', theme, ctx);
assert(barResult.html.includes('<rect'), 'Bar chart HTML contains <rect');
assert(barResult.html.includes('>30<'), 'Bar chart shows value 30');

// Line chart test
const lineResult = await skill.generate('折线图：Jan 10%, Feb 25%, Mar 40%', theme, ctx);
assert(lineResult.html.includes('<polyline'), 'Line chart HTML contains <polyline');
assert(lineResult.html.includes('<circle'), 'Line chart HTML contains <circle dots');

// ── Summary ───────────────────────────────────────────────────────

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
