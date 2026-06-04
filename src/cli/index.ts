#!/usr/bin/env node

import { resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createPipeline, ClarifyNeededError } from '../index.js';
import { SlopConfigManager } from '../quality/slop-config.js';
import { PluginManager } from '../plugins/index.js';

const __dirname = resolve(fileURLToPath(import.meta.url), '..');
const pkg = JSON.parse(readFileSync(resolve(__dirname, '../../package.json'), 'utf-8'));
const VERSION = pkg.version;

function printHelp(): void {
  const help = `
claw-design — AI 设计引擎 CLI

用法:
  claw-design generate <prompt> [options]
  claw-design <prompt> [options]
  claw-design plugin <list|install|uninstall|enable|disable|discover> [target]
  claw-design slop-list

命令:
  generate <prompt>   根据自然语言描述生成设计制品（HTML/PPTX）
  plugin list         列出已安装插件
  plugin install <dir|registry:name>
                      安装本地插件或已发现的 registry 插件
  plugin uninstall <name>
                      卸载插件
  plugin enable <name>
                      启用插件
  plugin disable <name>
                      停用插件
  plugin discover     发现本地目录和已配置 registry 中的插件
  slop-list           查看 Slop 黑名单规则状态

选项:
  -o, --output <dir>  输出目录（默认 ./output）
  -h, --help          显示帮助
  -v, --version       显示版本

示例:
  claw-design generate "帮我做一个关于AI趋势的演示文稿"
  claw-design "季度汇报 PPT" -o ./my-output
  claw-design generate "system architecture diagram for microservices"
  claw-design plugin install ./plugins/icon-pack
  claw-design plugin list
  claw-design slop-list

支持的制品类型:
  slides, chart, arch-diagram, flowchart, poster, landing-page,
  prototype, ui-mockup, dashboard, infographic, logic-diagram, video

说明:
  意图识别由文本 LLM 完成。standalone CLI 不内置 LLM，
  需由宿主环境（如 OpenClaw）注入文本 LLM classifier 后才能识别意图。
  未注入 LLM 时不会降级到关键词匹配，而是提示去 OpenClaw 或注入 classifier。
`.trim();
  console.log(help);
}

async function runPluginCommand(args: string[]): Promise<void> {
  const action = args[1] ?? 'list';
  const target = args[2];
  const manager = new PluginManager();

  if (action === 'list') {
    const installed = await manager.list();
    if (installed.length === 0) {
      console.log('No plugins installed.');
      return;
    }
    console.log(`${'NAME'.padEnd(24)} ${'TYPE'.padEnd(10)} ${'VERSION'.padEnd(10)} ${'STATUS'.padEnd(10)} ${'SOURCE'.padEnd(10)} CAPABILITIES`);
    for (const plugin of installed) {
      console.log(
        `${plugin.name.padEnd(24)} ${plugin.type.padEnd(10)} ${plugin.version.padEnd(10)} ${plugin.status.padEnd(10)} ${plugin.sourceKind.padEnd(10)} ${plugin.capabilities.join('; ')}`
      );
    }
    return;
  }

  if (action === 'discover') {
    const discovered = await manager.discover();
    console.log(`Discovered plugins: ${discovered.total}`);
    for (const listing of discovered.listings) {
      console.log(`${listing.manifest.name} ${listing.manifest.version} ${listing.manifest.type} ${listing.source.kind} ${listing.manifest.quality.maturity}`);
    }
    return;
  }

  if (!target) {
    throw new Error(`plugin ${action} requires a target`);
  }

  if (action === 'install') {
    const installed = await manager.install(target);
    console.log(`Installed plugin: ${installed.manifest.name} ${installed.manifest.version} (${installed.manifest.type})`);
    return;
  }

  if (action === 'uninstall') {
    const removed = await manager.uninstall(target);
    console.log(removed ? `Uninstalled plugin: ${target}` : `Plugin not installed: ${target}`);
    return;
  }

  if (action === 'enable') {
    const changed = await manager.enable(target);
    console.log(changed ? `Enabled plugin: ${target}` : `Plugin not installed: ${target}`);
    return;
  }

  if (action === 'disable') {
    const changed = await manager.disable(target);
    console.log(changed ? `Disabled plugin: ${target}` : `Plugin not installed: ${target}`);
    return;
  }

  throw new Error(`Unknown plugin command: ${action}`);
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

  if (args[0] === 'plugin') {
    try {
      await runPluginCommand(args);
      process.exit(0);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`错误: ${message}`);
      process.exit(1);
    }
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
    // standalone CLI: no LLM classifier is injected here. Intent routing is
    // LLM-only by design (PRD AC-08) — there is no keyword fallback. When no
    // host LLM is available, the pipeline cannot determine intent and raises
    // ClarifyNeededError, which we surface as a guiding message below.
    const pipeline = await createPipeline();
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
    if (err instanceof ClarifyNeededError) {
      console.error('\n无法识别设计意图：当前没有可用的文本 LLM。');
      console.error('Claw Design 的意图识别只走 LLM 语义理解，不降级到关键词匹配。');
      console.error('请在已配置文本 LLM 的 OpenClaw 中使用，或在程序内通过');
      console.error('createPipeline(theme, { classifierProvider }) 注入文本 LLM classifier。');
      process.exit(1);
    }
    const message = err instanceof Error ? err.message : String(err);
    console.error(`\n错误: ${message}`);
    process.exit(1);
  }
}

main();
