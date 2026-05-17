#!/usr/bin/env node

import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createPipeline } from '../index.js';
import { SlopConfigManager } from '../quality/slop-config.js';
import type { IntentClassifierProvider, ClassificationResult, SkillDescription } from '../routing/intent-classifier.js';
import type { ArtifactType } from '../types.js';

const __dirname = resolve(fileURLToPath(import.meta.url), '..');
const pkg = JSON.parse(readFileSync(resolve(__dirname, '../../package.json'), 'utf-8'));
const VERSION = pkg.version;

function printHelp(): void {
  const help = `
claw-design — AI 设计引擎 CLI

用法:
  claw-design generate <prompt> [options]
  claw-design <prompt> [options]
  claw-design slop-list

命令:
  generate <prompt>   根据自然语言描述生成设计制品（HTML/PPTX）
  slop-list           查看 Slop 黑名单规则状态

选项:
  -o, --output <dir>  输出目录（默认 ./output）
  -h, --help          显示帮助
  -v, --version       显示版本

示例:
  claw-design generate "帮我做一个关于AI趋势的演示文稿"
  claw-design "季度汇报 PPT" -o ./my-output
  claw-design generate "system architecture diagram for microservices"
  claw-design slop-list

支持的制品类型:
  slides, chart, arch-diagram, flowchart, poster, landing-page,
  prototype, ui-mockup, dashboard, infographic, logic-diagram, video

无 LLM 时返回 unknown（不降级到关键词匹配），仍可产出完整 HTML 制品。
`.trim();
  console.log(help);
}

function runSlopList(): void {
  const manager = new SlopConfigManager();
  const rules = manager.listRules();

  if (rules.length === 0) {
    console.log('No slop rules configured.');
    return;
  }

  console.log(`Slop Blacklist Rules (${rules.length} total):\n`);
  console.log(`${'ID'.padEnd(24)} ${'NAME'.padEnd(30)} ${'SEVERITY'.padEnd(10)} ${'ENABLED'.padEnd(8)}`);
  console.log(`${'─'.repeat(24)} ${'─'.repeat(30)} ${'─'.repeat(10)} ${'─'.repeat(8)}`);

  for (const rule of rules) {
    const enabled = rule.enabled ? '✓' : '✗';
    console.log(
      `${rule.id.padEnd(24)} ${rule.name.padEnd(30)} ${rule.severity.padEnd(10)} ${enabled}`
    );
  }
}

/**
 * CLI-level keyword classifier for standalone usage without an LLM.
 * This is NOT intent routing fallback — it's the CLI explicitly choosing
 * a best-effort classifier when no LLM host is available.
 */
class CliKeywordClassifier implements IntentClassifierProvider {
  async classify(input: string, skillDescriptions: SkillDescription[]): Promise<ClassificationResult> {
    const inputLower = input.toLowerCase();
    let bestMatch: SkillDescription | null = null;
    let bestScore = 0;

    for (const skill of skillDescriptions) {
      let score = 0;
      // Check artifact type name
      if (inputLower.includes(skill.artifactType)) score += 3;
      // Check skill name
      if (inputLower.includes(skill.name)) score += 3;
      // Check capabilities
      if (skill.capabilities) {
        for (const cap of skill.capabilities) {
          if (inputLower.includes(cap.toLowerCase())) score += 1;
        }
      }
      // Check applicable scenes
      if (skill.applicableScenes) {
        for (const scene of skill.applicableScenes) {
          if (inputLower.includes(scene.toLowerCase())) score += 2;
        }
      }
      // Check example prompts
      if (skill.examplePrompts) {
        for (const ex of skill.examplePrompts) {
          if (inputLower.includes(ex.toLowerCase().slice(0, 6))) score += 2;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestMatch = skill;
      }
    }

    // Common Chinese/English term heuristics
    if (!bestMatch || bestScore < 2) {
      const typeMap: Array<[string[], string]> = [
        [['演示文稿', 'ppt', 'slides', 'deck', '汇报'], 'slides'],
        [['图表', '柱状图', '饼图', 'chart', '折线图'], 'chart'],
        [['架构图', 'architecture', '系统架构'], 'arch-diagram'],
        [['流程图', 'flowchart', 'flow'], 'flowchart'],
        [['海报', 'poster'], 'poster'],
        [['落地页', 'landing'], 'landing-page'],
        [['原型', 'prototype', 'mockup'], 'prototype'],
        [['仪表盘', 'dashboard'], 'dashboard'],
        [['信息图', 'infographic'], 'infographic'],
        [['逻辑图', 'logic'], 'logic-diagram'],
      ];
      for (const [keywords, type] of typeMap) {
        for (const kw of keywords) {
          if (inputLower.includes(kw)) {
            bestMatch = skillDescriptions.find(s => s.artifactType === type) ?? null;
            bestScore = 4;
            break;
          }
        }
        if (bestMatch && bestScore >= 4) break;
      }
    }

    // Default to slides if nothing matched
    if (!bestMatch || bestScore < 2) {
      bestMatch = skillDescriptions.find(s => s.artifactType === 'slides') ?? skillDescriptions[0] ?? null;
      bestScore = 2;
    }

    return {
      primaryType: (bestMatch?.artifactType ?? 'slides') as ArtifactType,
      secondaryTypes: [],
      confidence: Math.min(bestScore / 8, 0.9),
      reasoning: `CLI standalone classifier: matched "${bestMatch?.name ?? 'slides'}"`,
    };
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    printHelp();
    process.exit(0);
  }

  if (args.includes('-v') || args.includes('--version')) {
    console.log(`claw-design v${VERSION}`);
    process.exit(0);
  }

  // Handle slop-list subcommand
  if (args[0] === 'slop-list') {
    runSlopList();
    process.exit(0);
  }

  let prompt: string | undefined;
  let outputDir = './output';

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-o' || arg === '--output') {
      outputDir = args[++i] ?? './output';
    } else if (arg === 'generate') {
      continue;
    } else if (!arg.startsWith('-')) {
      prompt = arg;
    }
  }

  if (!prompt) {
    console.error('错误: 请提供设计需求描述');
    console.error('用法: claw-design generate "你的需求"');
    process.exit(1);
  }

  const resolvedOutput = resolve(outputDir);
  console.log(`正在生成... 输入: "${prompt}"`);
  console.log(`输出目录: ${resolvedOutput}`);

  try {
    // CLI standalone mode: use keyword-based classifier as best-effort
    // (host environments like OpenClaw inject a real LLM classifier)
    const cliClassifier = new CliKeywordClassifier();
    const pipeline = await createPipeline(undefined, { classifierProvider: cliClassifier });
    const result = await pipeline.run(prompt, resolvedOutput);

    if (result.bundle) {
      console.log(`\n生成完成!`);
      console.log(`  HTML: ${result.bundle.htmlPath}`);
      if (result.bundle.pptxPath) {
        console.log(`  PPTX: ${result.bundle.pptxPath}`);
      }
      console.log(`  质量: ${result.quality.conclusion}`);
      console.log(`  文件: ${result.bundle.files.join(', ')}`);
      process.exit(0);
    } else {
      console.error(`\n生成失败: ${result.deliveryMessage}`);
      process.exit(1);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`\n错误: ${message}`);
    process.exit(1);
  }
}

main();
