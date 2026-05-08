#!/usr/bin/env npx tsx
// generate.ts — 演示文稿生成入口
// 调用 src/execution/slides-skill.ts，不重复实现逻辑

import { parseArgs } from 'node:util';
import { SlidesSkill } from '../../../src/execution/slides-skill.js';
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
  console.error('Usage: generate.ts --content "演示文稿内容描述"');
  process.exit(1);
}

async function main() {
  const content = values.content!;
  const taskId = `slides-${Date.now()}`;

  const skill = new SlidesSkill();
  const artifact = await skill.generate(content, DEFAULT_THEME, { taskId });

  // Quality gate L1
  const gate = new QualityGateL1();
  const report = gate.check(artifact);

  const outputPath = writeHtmlArtifact({ taskId, html: artifact.html, outputDir: values.output });

  console.log(JSON.stringify({
    taskId,
    skill: 'slides',
    outputPath,
    quality: report.conclusion,
    pages: artifact.pages,
  }, null, 2));
}

main().catch(err => {
  console.error('Slides generation failed:', err.message);
  process.exit(1);
});
