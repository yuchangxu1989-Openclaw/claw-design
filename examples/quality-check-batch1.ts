// Claw Design — Batch 1 E2E Quality Check
// Tests 5 artifact types: slides, chart, arch-diagram, flowchart, poster
// Run: npx tsx examples/quality-check-batch1.ts

import { createPipeline, DEFAULT_THEME } from '../src/index.js';
import type { PipelineResult } from '../src/index.js';
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUTPUT_DIR = join(import.meta.dirname ?? '.', 'output');

interface TestCase {
  name: string;
  type: string;
  prompt: string;
  expectedKeywords: string[];
}

const CASES: TestCase[] = [
  {
    name: 'slides',
    type: 'slides',
    prompt: '帮我做一个 Q2 季度汇报 PPT，包含业绩概览、核心项目进展、下季度计划',
    expectedKeywords: ['Q2', '业绩', '项目', '计划'],
  },
  {
    name: 'chart',
    type: 'chart',
    prompt: '画一个柱状图展示 2024 年各季度营收：Q1 120万、Q2 150万、Q3 180万、Q4 210万',
    expectedKeywords: ['Q1', 'Q2', 'Q3', 'Q4', '120', '150', '180', '210'],
  },
  {
    name: 'arch-diagram',
    type: 'arch-diagram',
    prompt: '画一个微服务架构图，包含 API Gateway、用户服务、订单服务、支付服务、消息队列',
    expectedKeywords: ['API Gateway', '用户服务', '订单服务', '支付服务', '消息队列'],
  },
  {
    name: 'flowchart',
    type: 'flowchart',
    prompt: '画一个用户注册流程图：输入邮箱→发送验证码→验证→设置密码→创建账户→完成',
    expectedKeywords: ['邮箱', '验证码', '密码', '创建账户'],
  },
  {
    name: 'poster',
    type: 'poster',
    prompt: '设计一张 AI 技术大会的宣传海报，主题是 Agent 自主进化，2026年5月15日，北京',
    expectedKeywords: ['AI', 'Agent', '2026', '北京'],
  },
];

interface CheckResult {
  name: string;
  passed: boolean;
  fileSize: number;
  qualityConclusion: string;
  hasContent: boolean;
  keywordsFound: string[];
  keywordsMissing: string[];
  hasStyles: boolean;
  issues: string[];
}

function checkHtmlQuality(name: string, htmlPath: string, expectedKeywords: string[]): Omit<CheckResult, 'qualityConclusion'> {
  const issues: string[] = [];
  let fileSize = 0;
  let hasContent = false;
  let hasStyles = false;
  const keywordsFound: string[] = [];
  const keywordsMissing: string[] = [];

  try {
    const stat = statSync(htmlPath);
    fileSize = stat.size;
  } catch {
    issues.push('HTML file does not exist');
    return { name, passed: false, fileSize: 0, hasContent: false, keywordsFound: [], keywordsMissing: expectedKeywords, hasStyles: false, issues };
  }

  if (fileSize < 1024) {
    issues.push(`File too small: ${fileSize} bytes (expected >1KB)`);
  }

  const html = readFileSync(htmlPath, 'utf-8');

  // Check for actual content (not just boilerplate)
  const hasTextContent = html.replace(/<[^>]*>/g, '').trim().length > 100;
  const hasLoremIpsum = /lorem ipsum/i.test(html);
  const hasPlaceholder = /\{\{[^}]+\}\}/.test(html) || /TODO|PLACEHOLDER|FIXME/i.test(html);

  if (!hasTextContent) issues.push('HTML has very little text content');
  if (hasLoremIpsum) issues.push('Contains lorem ipsum placeholder text');
  if (hasPlaceholder) issues.push('Contains unresolved placeholders');
  hasContent = hasTextContent && !hasLoremIpsum && !hasPlaceholder;

  // Check for CSS styles
  hasStyles = /<style[\s>]/i.test(html) || /style\s*=/i.test(html);
  if (!hasStyles) issues.push('No CSS styles found');

  // Check for expected keywords
  for (const kw of expectedKeywords) {
    if (html.includes(kw)) {
      keywordsFound.push(kw);
    } else {
      keywordsMissing.push(kw);
    }
  }
  if (keywordsMissing.length > expectedKeywords.length / 2) {
    issues.push(`Missing >50% expected keywords: ${keywordsMissing.join(', ')}`);
  }

  const passed = fileSize >= 1024 && hasContent && hasStyles && issues.length === 0;
  return { name, passed, fileSize, hasContent, keywordsFound, keywordsMissing, hasStyles, issues };
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log('═══════════════════════════════════════════════════════');
  console.log('  Claw Design — Batch 1 E2E Quality Check');
  console.log('═══════════════════════════════════════════════════════\n');

  const pipeline = await createPipeline(DEFAULT_THEME);
  const skills = pipeline.registry.list().map(s => s.contract.name);
  console.log(`Registered skills: ${skills.join(', ')}\n`);

  const results: CheckResult[] = [];

  for (const tc of CASES) {
    console.log(`── ${tc.name} ──`);
    console.log(`  Prompt: "${tc.prompt}"`);

    const outDir = join(OUTPUT_DIR, tc.name);
    mkdirSync(outDir, { recursive: true });

    try {
      const result = await pipeline.run(tc.prompt, outDir);
      const htmlPath = result.bundle?.htmlPath;

      if (!htmlPath) {
        console.log(`  ❌ No HTML output (quality: ${result.quality.conclusion})`);
        result.quality.items.filter(i => !i.passed).forEach(i => {
          console.log(`     ⚠ [${i.severity}] ${i.rule}: ${i.message}`);
        });
        results.push({
          name: tc.name,
          passed: false,
          fileSize: 0,
          qualityConclusion: result.quality.conclusion,
          hasContent: false,
          keywordsFound: [],
          keywordsMissing: tc.expectedKeywords,
          hasStyles: false,
          issues: ['No HTML output produced'],
        });
        continue;
      }

      // Copy to flat output for easy access
      const flatPath = join(OUTPUT_DIR, `${tc.name}-output.html`);
      const htmlContent = readFileSync(htmlPath, 'utf-8');
      writeFileSync(flatPath, htmlContent);

      const check = checkHtmlQuality(tc.name, htmlPath, tc.expectedKeywords);
      const checkResult: CheckResult = { ...check, qualityConclusion: result.quality.conclusion };
      results.push(checkResult);

      const icon = checkResult.passed ? '✅' : '⚠️';
      console.log(`  ${icon} Size: ${checkResult.fileSize} bytes | Quality: ${checkResult.qualityConclusion}`);
      console.log(`     Content: ${checkResult.hasContent ? 'yes' : 'NO'} | Styles: ${checkResult.hasStyles ? 'yes' : 'NO'}`);
      console.log(`     Keywords found: ${checkResult.keywordsFound.length}/${tc.expectedKeywords.length}`);
      if (checkResult.issues.length > 0) {
        checkResult.issues.forEach(i => console.log(`     ⚠ ${i}`));
      }
    } catch (err: any) {
      console.log(`  ❌ Error: ${err.message}`);
      results.push({
        name: tc.name,
        passed: false,
        fileSize: 0,
        qualityConclusion: 'error',
        hasContent: false,
        keywordsFound: [],
        keywordsMissing: tc.expectedKeywords,
        hasStyles: false,
        issues: [`Runtime error: ${err.message}`],
      });
    }
    console.log();
  }

  // Summary
  console.log('═══════════════════════════════════════════════════════');
  console.log('  SUMMARY');
  console.log('═══════════════════════════════════════════════════════');
  const passCount = results.filter(r => r.passed).length;
  const failCount = results.filter(r => !r.passed).length;
  console.log(`  Total: ${results.length} | Passed: ${passCount} | Failed: ${failCount}\n`);

  for (const r of results) {
    const icon = r.passed ? '✅' : '❌';
    console.log(`  ${icon} ${r.name.padEnd(15)} ${String(r.fileSize).padStart(6)} bytes  quality=${r.qualityConclusion}  keywords=${r.keywordsFound.length}/${r.keywordsFound.length + r.keywordsMissing.length}`);
    if (!r.passed && r.issues.length > 0) {
      r.issues.forEach(i => console.log(`     → ${i}`));
    }
  }

  console.log(`\nOutput directory: ${OUTPUT_DIR}`);
  process.exit(failCount > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
