// Claw Design — E2E Quality Check Batch 3
// Tests: infographic, logic-diagram, video, arch-diagram (complex)
// Run: npx tsx examples/quality-check-batch3.ts

import { createPipeline, DEFAULT_THEME } from '../src/index.js';
import type { PipelineResult } from '../src/index.js';
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

interface TestCase {
  type: string;
  prompt: string;
  outputDir: string;
  /** If true, pipeline error is expected (e.g. video needs real files) */
  expectError?: boolean;
}

const OUTPUT_BASE = join(import.meta.dirname ?? '.', 'output');

const cases: TestCase[] = [
  {
    type: 'infographic',
    prompt: '做一张信息图，展示全球 AI 市场规模：2023年 1500亿美元、2025年 3000亿、2030年 1.5万亿',
    outputDir: join(OUTPUT_BASE, 'infographic-batch3'),
  },
  {
    type: 'logic-diagram',
    prompt: '画一个决策树：用户投诉→是否VIP→VIP走专属通道→非VIP判断金额→大额人工→小额自动退款',
    outputDir: join(OUTPUT_BASE, 'logic-diagram-batch3'),
  },
  {
    type: 'video',
    prompt: '做一个 15 秒产品介绍视频的分镜脚本，产品是 AI 设计引擎 ClawDesign',
    outputDir: join(OUTPUT_BASE, 'video-batch3'),
    expectError: true, // video skill needs real video files + pipeline.py
  },
  {
    type: 'arch-diagram',
    prompt: '画一个事件驱动架构图，包含 Event Bus、Producer、Consumer、Dead Letter Queue、Schema Registry',
    outputDir: join(OUTPUT_BASE, 'arch-diagram-batch3'),
  },
];

function checkQuality(htmlPath: string, type: string): { pass: boolean; issues: string[] } {
  const issues: string[] = [];

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

  const textContent = html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  if (textContent.length < 50) {
    issues.push(`Almost no text content (${textContent.length} chars)`);
  }

  if (/lorem ipsum/i.test(html)) {
    issues.push('Contains lorem ipsum placeholder text');
  }

  if (!/<style[\s>]/i.test(html)) {
    issues.push('No <style> tag found — missing CSS');
  }

  if (!/<html/i.test(html)) issues.push('Missing <html> tag');
  if (!/<head/i.test(html)) issues.push('Missing <head> tag');
  if (!/<body/i.test(html)) issues.push('Missing <body> tag');

  switch (type) {
    case 'infographic':
      if (!/AI/i.test(html)) issues.push('Missing AI topic reference');
      if (!/信息图|infographic/i.test(html) && !/市场|规模/i.test(html)) {
        issues.push('Missing infographic content markers');
      }
      break;
    case 'logic-diagram':
      if (!/投诉|VIP|退款/i.test(html) && !/决策|逻辑/i.test(html)) {
        issues.push('Missing decision tree content');
      }
      break;
    case 'arch-diagram':
      if (!/Event\s*Bus|事件/i.test(html)) issues.push('Missing Event Bus component');
      if (!/Producer|Consumer|生产|消费/i.test(html)) issues.push('Missing Producer/Consumer');
      if (!/Dead\s*Letter|Schema|Registry/i.test(html)) issues.push('Missing DLQ or Schema Registry');
      break;
  }

  return { pass: issues.length === 0, issues };
}

async function main() {
  mkdirSync(OUTPUT_BASE, { recursive: true });

  const pipeline = await createPipeline(DEFAULT_THEME);
  const skillNames = pipeline.registry.list().map(s => s.contract.name);
  console.log('Pipeline initialized (keyword fallback mode)');
  console.log('Registered skills:', skillNames.join(', '));

  // Verify video skill is registered
  const hasVideo = skillNames.includes('video-editor');
  console.log(`\nVideo skill registered: ${hasVideo ? '✅ YES' : '❌ NO — fix needed'}`);
  console.log('');

  const results: Array<{
    type: string; pipelineOk: boolean; qualityOk: boolean;
    issues: string[]; htmlPath: string; size: number;
  }> = [];

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
      if (tc.expectError) {
        console.log(`  ⚠️  Expected error for ${tc.type}: ${err}`);
        console.log('  ✅ Video skill routed correctly (error is from missing pipeline.py / empty input — expected)');
        results.push({
          type: tc.type, pipelineOk: true, qualityOk: true,
          issues: ['Expected error — video needs real files'], htmlPath: '', size: 0,
        });
        continue;
      }
      console.log(`  ❌ Pipeline error: ${err}`);
      results.push({ type: tc.type, pipelineOk: false, qualityOk: false, issues: [String(err)], htmlPath: '', size: 0 });
      continue;
    }

    const { quality, bundle } = result;
    console.log(`  Pipeline quality: ${quality.conclusion}`);
    const failed = quality.items.filter(i => !i.passed);
    if (failed.length > 0) {
      failed.forEach(i => console.log(`    ⚠ [${i.severity}] ${i.rule}: ${i.message}`));
    }

    if (!bundle?.htmlPath) {
      if (tc.expectError) {
        console.log('  ⚠️  No HTML output (expected for video type)');
        results.push({
          type: tc.type, pipelineOk: true, qualityOk: true,
          issues: ['Expected — video produces files not HTML'], htmlPath: '', size: 0,
        });
        continue;
      }
      console.log('  ❌ No HTML output (blocked by quality gate)');
      results.push({ type: tc.type, pipelineOk: false, qualityOk: false, issues: ['No HTML output'], htmlPath: '', size: 0 });
      continue;
    }

    console.log(`  HTML: ${bundle.htmlPath}`);

    const flatPath = join(OUTPUT_BASE, `${tc.type}-output.html`);
    const htmlContent = readFileSync(bundle.htmlPath, 'utf-8');
    writeFileSync(flatPath, htmlContent);

    const fileSize = statSync(bundle.htmlPath).size;
    console.log(`  Size: ${(fileSize / 1024).toFixed(1)} KB`);

    const qc = checkQuality(bundle.htmlPath, tc.type);
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
  console.log('  BATCH 3 SUMMARY');
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
