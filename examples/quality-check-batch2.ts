// Claw Design — E2E Quality Check Batch 2
// Tests: landing-page, prototype, ui-mockup, dashboard
// Run: npx tsx examples/quality-check-batch2.ts

import { createPipeline, DEFAULT_THEME } from '../src/index.js';
import type { PipelineResult } from '../src/index.js';
import { mkdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

interface TestCase {
  type: string;
  prompt: string;
  outputDir: string;
}

const OUTPUT_BASE = join(import.meta.dirname ?? '.', 'output');

const cases: TestCase[] = [
  {
    type: 'landing-page',
    prompt: '做一个 SaaS 产品的落地页，产品叫 ClawDesign，一句话生成设计产物的 AI 引擎',
    outputDir: join(OUTPUT_BASE, 'landing-page-batch2'),
  },
  {
    type: 'prototype',
    prompt: '做一个移动端登录页面的交互原型，包含手机号输入、验证码、微信登录按钮',
    outputDir: join(OUTPUT_BASE, 'prototype-batch2'),
  },
  {
    type: 'ui-mockup',
    prompt: '设计一个后台管理系统的仪表盘页面，左侧导航栏、顶部搜索、中间数据卡片',
    outputDir: join(OUTPUT_BASE, 'ui-mockup-batch2'),
  },
  {
    type: 'dashboard',
    prompt: '做一个运营数据看板，展示 DAU 5万、MAU 30万、转化率 3.2%、ARPU ¥45',
    outputDir: join(OUTPUT_BASE, 'dashboard-batch2'),
  },
];

function checkQuality(htmlPath: string, type: string, prompt: string): { pass: boolean; issues: string[] } {
  const issues: string[] = [];

  // 1. File exists and size check
  let stat;
  try {
    stat = statSync(htmlPath);
  } catch {
    issues.push(`HTML file not found: ${htmlPath}`);
    return { pass: false, issues };
  }
  if (stat.size < 1024) {
    issues.push(`HTML too small: ${stat.size} bytes (need >1KB)`);
  }

  const html = readFileSync(htmlPath, 'utf-8');

  // 2. Not empty shell — must have actual text content
  const textContent = html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  if (textContent.length < 50) {
    issues.push(`Almost no text content (${textContent.length} chars)`);
  }

  // 3. No lorem ipsum
  if (/lorem ipsum/i.test(html)) {
    issues.push('Contains lorem ipsum placeholder text');
  }

  // 4. Has CSS styles
  if (!/<style[\s>]/i.test(html)) {
    issues.push('No <style> tag found — missing CSS');
  }

  // 5. Has proper HTML structure
  if (!/<html/i.test(html)) issues.push('Missing <html> tag');
  if (!/<head/i.test(html)) issues.push('Missing <head> tag');
  if (!/<body/i.test(html)) issues.push('Missing <body> tag');

  // 6. Type-specific checks
  switch (type) {
    case 'landing-page':
      if (!/ClawDesign/i.test(html)) issues.push('Missing product name "ClawDesign"');
      if (!/<section/i.test(html) && !/<div[^>]*class="[^"]*hero/i.test(html)) {
        issues.push('No section/hero structure found');
      }
      break;
    case 'prototype':
      if (!/登录|login/i.test(html)) issues.push('Missing login-related content');
      if (!/手机|phone|验证码|微信/i.test(html)) issues.push('Missing phone/wechat login elements');
      break;
    case 'ui-mockup':
      if (!/导航|nav|sidebar/i.test(html)) issues.push('Missing navigation elements');
      if (!/搜索|search/i.test(html)) issues.push('Missing search element');
      break;
    case 'dashboard':
      if (!/DAU|日活/i.test(html)) issues.push('Missing DAU metric');
      if (!/MAU|月活/i.test(html)) issues.push('Missing MAU metric');
      if (!/转化率|3\.2/i.test(html)) issues.push('Missing conversion rate');
      if (!/ARPU|客单价|¥?45/i.test(html)) issues.push('Missing ARPU metric');
      break;
  }

  return { pass: issues.length === 0, issues };
}

async function main() {
  mkdirSync(OUTPUT_BASE, { recursive: true });

  const pipeline = await createPipeline(DEFAULT_THEME);
  console.log('Pipeline initialized (keyword fallback mode)');
  console.log('Registered skills:', pipeline.registry.list().map(s => s.contract.name).join(', '));
  console.log('');

  const results: Array<{ type: string; pipelineOk: boolean; qualityOk: boolean; issues: string[]; htmlPath: string; size: number }> = [];

  for (const tc of cases) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`  Testing: ${tc.type}`);
    console.log(`  Prompt: "${tc.prompt}"`);
    console.log(`${'─'.repeat(60)}`);

    mkdirSync(tc.outputDir, { recursive: true });

    let result: PipelineResult;
    try {
      result = await pipeline.run(tc.prompt, tc.outputDir);
    } catch (err) {
      console.log(`  ❌ Pipeline error: ${err}`);
      results.push({ type: tc.type, pipelineOk: false, qualityOk: false, issues: [String(err)], htmlPath: '', size: 0 });
      continue;
    }

    // Pipeline quality gate result
    const { quality, bundle } = result;
    console.log(`  Pipeline quality: ${quality.conclusion}`);
    const failed = quality.items.filter(i => !i.passed);
    if (failed.length > 0) {
      failed.forEach(i => console.log(`    ⚠ [${i.severity}] ${i.rule}: ${i.message}`));
    }

    if (!bundle?.htmlPath) {
      console.log('  ❌ No HTML output (blocked by quality gate)');
      results.push({ type: tc.type, pipelineOk: false, qualityOk: false, issues: ['No HTML output'], htmlPath: '', size: 0 });
      continue;
    }

    console.log(`  HTML: ${bundle.htmlPath}`);

    // Also copy to flat output for easy access
    const flatPath = join(OUTPUT_BASE, `${tc.type}-output.html`);
    const htmlContent = readFileSync(bundle.htmlPath, 'utf-8');
    const { writeFileSync } = await import('node:fs');
    writeFileSync(flatPath, htmlContent);

    const fileSize = statSync(bundle.htmlPath).size;
    console.log(`  Size: ${(fileSize / 1024).toFixed(1)} KB`);

    // Our own quality check
    const qc = checkQuality(bundle.htmlPath, tc.type, tc.prompt);
    if (qc.pass) {
      console.log('  ✅ Quality check PASSED');
    } else {
      console.log('  ❌ Quality check FAILED:');
      qc.issues.forEach(issue => console.log(`    - ${issue}`));
    }

    results.push({
      type: tc.type,
      pipelineOk: quality.conclusion !== 'block',
      qualityOk: qc.pass,
      issues: qc.issues,
      htmlPath: flatPath,
      size: fileSize,
    });
  }

  // Summary
  console.log(`\n${'═'.repeat(60)}`);
  console.log('  BATCH 2 SUMMARY');
  console.log(`${'═'.repeat(60)}`);
  let allPass = true;
  for (const r of results) {
    const status = r.pipelineOk && r.qualityOk ? '✅' : '❌';
    if (!r.qualityOk) allPass = false;
    console.log(`  ${status} ${r.type.padEnd(15)} ${(r.size / 1024).toFixed(1).padStart(6)} KB  ${r.issues.length === 0 ? 'OK' : r.issues.join('; ')}`);
  }
  console.log(`\n  Overall: ${allPass ? '✅ ALL PASSED' : '❌ SOME FAILED — fixes needed'}`);

  if (!allPass) process.exit(1);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
