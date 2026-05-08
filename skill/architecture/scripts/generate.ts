#!/usr/bin/env npx tsx
// generate.ts — 架构图生成入口
// 调用 src/execution/arch-diagram-skill.ts，不重复实现逻辑

import { parseArgs } from 'node:util';
import { ArchDiagramSkill } from '../../../src/execution/arch-diagram-skill.js';
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
  console.error('Usage: generate.ts --content "架构描述"');
  process.exit(1);
}

async function main() {
  const content = values.content!;
  const taskId = `arch-${Date.now()}`;

  const skill = new ArchDiagramSkill();
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
    skill: 'architecture',
    outputPath,
    quality: report.conclusion,
    pages: artifact.pages,
  }, null, 2));
}

main().catch(err => {
  console.error('Architecture diagram generation failed:', err.message);
  process.exit(1);
});

