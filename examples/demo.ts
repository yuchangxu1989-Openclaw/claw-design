// Claw Design — E2E Demo
// 演示完整的设计引擎管线：route → execute → quality check → export
// 运行: npx tsx examples/demo.ts

import { createPipeline, DEFAULT_THEME } from '../src/index.js';
import type { PipelineResult } from '../src/index.js';
import { mkdirSync } from 'node:fs';

function printDivider(title: string) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${'═'.repeat(60)}\n`);
}

function printResult(result: PipelineResult) {
  // 路由结果（从 bundle 或 quality 中提取）
  console.log('  taskId:', result.quality.taskId);

  // 质量检查结果
  const { conclusion, items } = result.quality;
  const passed = items.filter(i => i.passed).length;
  const failed = items.filter(i => !i.passed).length;
  console.log(`  质量结论: ${conclusion} (${passed} passed, ${failed} failed)`);
  if (failed > 0) {
    items.filter(i => !i.passed).forEach(i => {
      console.log(`    ⚠ [${i.severity}] ${i.rule}: ${i.message}`);
    });
  }

  // 导出格式
  if (result.bundle) {
    console.log('  导出文件:');
    console.log('    HTML:', result.bundle.htmlPath);
    if (result.bundle.pptxPath) console.log('    PPTX:', result.bundle.pptxPath);
    if (result.bundle.pdfPath) console.log('    PDF:', result.bundle.pdfPath);
    if (result.bundle.pngPath) console.log('    PNG:', result.bundle.pngPath);
    if (result.bundle.svgPaths?.length) console.log('    SVG:', result.bundle.svgPaths.join(', '));
    console.log(`    共 ${result.bundle.files.length} 个文件`);

    // 格式一致性
    if (result.bundle.consistency) {
      const fmts = result.bundle.consistency.checkedFormats.join(', ');
      console.log(`  格式一致性检查: [${fmts}]`);
    }
  } else {
    console.log('  导出: 被质量门禁拦截，无产出');
  }

  console.log('  交付消息:', result.deliveryMessage);
}

async function main() {
  const outBase = '/tmp/claw-design-demo';
  mkdirSync(outBase, { recursive: true });

  // 创建管线（无 LLM provider，走 keyword fallback 降级路由）
  const pipeline = await createPipeline(DEFAULT_THEME);
  console.log('管线初始化完成（keyword fallback 模式）');
  console.log('已注册 Skills:', pipeline.registry.list().map(s => s.contract.name).join(', '));

  // ── Case 1: 生成 PPT（slides） ──
  // 输入一句话，走完 route → execute → quality check → export 全链路
  printDivider('Case 1: 生成 PPT（slides）');
  console.log('  输入: "做一份关于 AI Agent 技术栈的演示文稿，包含 5 页"');
  const r1 = await pipeline.run(
    '做一份关于 AI Agent 技术栈的演示文稿，包含 5 页',
    `${outBase}/case1-slides`,
  );
  printResult(r1);

  // ── Case 2: 生成架构图（arch-diagram） ──
  // 演示架构图 Skill 的路由和产出
  printDivider('Case 2: 生成架构图（arch-diagram）');
  console.log('  输入: "画一个微服务架构图，包含 API 网关、用户服务、订单服务、消息队列、数据库"');
  const r2 = await pipeline.run(
    '画一个微服务架构图，包含 API 网关、用户服务、订单服务、消息队列、数据库',
    `${outBase}/case2-arch`,
  );
  printResult(r2);

  // ── Case 3: 生成图表（chart） ──
  // 演示图表 Skill 的路由和产出
  printDivider('Case 3: 生成图表（chart）');
  console.log('  输入: "画一个柱状图：Q1 收入 120万，Q2 收入 180万，Q3 收入 250万，Q4 收入 310万"');
  const r3 = await pipeline.run(
    '画一个柱状图：Q1 收入 120万，Q2 收入 180万，Q3 收入 250万，Q4 收入 310万',
    `${outBase}/case3-chart`,
  );
  printResult(r3);

  printDivider('Demo 完成');
  console.log(`所有产出在 ${outBase}/`);
}

main().catch(err => {
  console.error('Demo 失败:', err);
  process.exit(1);
});
