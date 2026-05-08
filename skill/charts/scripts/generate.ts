#!/usr/bin/env npx tsx
// generate.ts — 图表生成入口
// 调用 src/execution/chart-skill.ts，不重复实现逻辑

import { parseArgs } from 'node:util';
import { ChartSkill } from '../../../src/execution/chart-skill.js';
import { DEFAULT_THEME } from '../../../src/execution/index.js';
import { QualityGateL1 } from '../../../src/quality/index.js';
import { writeHtmlArtifact } from '../../shared/html-scaffold.js';

const { values } = parseArgs({
  options: {
    content: { type: 'string', short: 'c' },
    output: { type: 'string', short: 'o' },
  },
});

if (!values.content) {
  console.error('Usage: generate.ts --content "图表数据描述"');
  process.exit(1);
}

async function main() {
  const content = values.content!;
  const taskId = `chart-${Date.now()}`;

  const skill = new ChartSkill();
  const artifact = await skill.generate(content, DEFAULT_THEME, { taskId });

  // Quality gate L1
  const gate = new QualityGateL1();
  const report = gate.check(artifact);

  const outputPath = writeHtmlArtifact({
    taskId,
    html: artifact.html,
    outputDir: values.output,
  });

  console.log(JSON.stringify({
    taskId,
    skill: 'chart',
    outputPath,
    quality: report.conclusion,
    pages: artifact.pages,
  }, null, 2));
}

main().catch(err => {
  console.error('Chart generation failed:', err.message);
  process.exit(1);
});

