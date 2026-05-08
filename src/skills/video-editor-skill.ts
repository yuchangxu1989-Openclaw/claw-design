import { spawn } from 'node:child_process';
import path from 'node:path';
import type { Artifact, ThemePack } from '../types.js';
import { buildArtifact } from '../execution/skill-executor.js';
import { BaseSkill } from './base-skill.js';
import { renderVideoResultHtml } from './video-editor-renderer.js';
import { parseStoryboardFromPrompt, renderStoryboardHtml } from './video-storyboard-renderer.js';
import type {
  VideoAction,
  VideoEditorConfig,
  VideoEditorSkillContext,
  PipelineResult,
  StoryboardConfig,
} from './video-editor-types.js';

/** Default pipeline.py location relative to workspace skills dir */
const DEFAULT_PIPELINE_REL = 'skills/claw-video-editor/scripts/pipeline.py';
const PROTECTED_ABSOLUTE_PATH_PREFIXES = [
  '/etc',
  '/proc',
  '/sys',
  '/dev',
  '/boot',
  '/bin',
  '/sbin',
  '/lib',
  '/lib64',
  '/root/.ssh',
] as const;

export class VideoEditorSkill extends BaseSkill<'video'> {
  constructor() {
    super({
      name: 'video-editor',
      supportedTypes: ['video'],
      description: 'Video editing skill — highlight extraction, multi-video merge, trim, and ASR subtitle generation via local FFmpeg pipeline',
      triggerKeywords: [
        'video', 'video edit', 'clip', 'highlight', 'trim', 'merge', 'subtitle',
        'storyboard', 'script', 'video script',
        '视频', '剪辑', '视频剪辑', '高光', '高光提取', '字幕', '字幕生成',
        '合并', '视频合并', '拼接', '精剪', '切片',
        '分镜', '分镜脚本', '视频脚本', '视频策划', '脚本',
      ],
      supportedOutputs: ['video/mp4', 'srt'],
      requiredContext: ['taskId', 'videoConfig'],
    });
  }

  async generate(
    input: string,
    _theme: ThemePack,
    context: Record<string, unknown>,
  ): Promise<Artifact> {
    const ctx = this.toContext(context) as unknown as VideoEditorSkillContext;
    const taskId = String(ctx.taskId ?? 'unknown');
    const config = ctx.videoConfig ?? inferConfigFromInput(input);

    // Storyboard mode: generate HTML from text, no pipeline needed
    if (config.action === 'storyboard') {
      const sbConfig: StoryboardConfig = {
        prompt: input,
        duration: (config as StoryboardConfig).duration,
        scenes: (config as StoryboardConfig).scenes,
        style: (config as StoryboardConfig).style,
      };
      const scenes = parseStoryboardFromPrompt(sbConfig);
      const html = renderStoryboardHtml(sbConfig, scenes);
      return buildArtifact(taskId, 'video', html, scenes.length, {
        action: 'storyboard',
        sceneCount: scenes.length,
        duration: sbConfig.duration ?? 15,
      });
    }

    // Pipeline mode: requires real video files
    validateVideoConfig(config);
    const pipelinePath = resolvePipelinePath(ctx.pipelinePath);

    const args = buildPipelineArgs(config);
    const result = await runPipeline(pipelinePath, args);

    const html = renderVideoResultHtml(config.action, result);
    const outputFiles = result.outputs ?? [];

    return buildArtifact(taskId, 'video', html, outputFiles.length, {
      action: config.action,
      pipelineStatus: result.status,
      outputs: outputFiles,
      pipelineMetadata: result.metadata ?? {},
    });
  }
}

/** Resolve pipeline.py path — configurable or default relative to workspace */
function resolvePipelinePath(override?: string): string {
  if (override) return override;
  const workspace = process.env['OPENCLAW_WORKSPACE'] ?? path.join(
    process.env['HOME'] ?? '/root',
    '.openclaw',
    'workspace',
  );
  return path.join(workspace, DEFAULT_PIPELINE_REL);
}

function validateVideoConfig(config: VideoEditorConfig): void {
  switch (config.action) {
    case 'highlight':
      validateRequiredPath('videoConfig.input', config.input);
      validateOptionalPath('videoConfig.outputDir', config.outputDir);
      break;

    case 'merge':
      if (config.inputs.length === 0) {
        throw new Error('videoConfig.inputs must contain at least one input file');
      }
      config.inputs.forEach((inputPath, index) => {
        validateRequiredPath(`videoConfig.inputs[${index}]`, inputPath);
      });
      validateOptionalPath('videoConfig.audio', config.audio);
      validateOptionalPath('videoConfig.subtitle', config.subtitle);
      validateOptionalPath('videoConfig.outputDir', config.outputDir);
      break;

    case 'trim':
      validateRequiredPath('videoConfig.input', config.input);
      validateOptionalPath('videoConfig.watermark', config.watermark);
      validateOptionalPath('videoConfig.outputDir', config.outputDir);
      break;

    case 'subtitle':
      validateRequiredPath('videoConfig.input', config.input);
      validateOptionalPath('videoConfig.outputDir', config.outputDir);
      break;
  }
}

function validateRequiredPath(fieldName: string, rawValue: string | undefined): void {
  if (typeof rawValue !== 'string' || rawValue.trim() === '') {
    throw new Error(`${fieldName} is required before running the video pipeline`);
  }
  validatePathSafety(fieldName, rawValue.trim());
}

function validateOptionalPath(fieldName: string, rawValue?: string): void {
  if (typeof rawValue !== 'string' || rawValue.trim() === '') {
    return;
  }
  validatePathSafety(fieldName, rawValue.trim());
}

function validatePathSafety(fieldName: string, rawValue: string): void {
  const normalizedInput = rawValue.replace(/\\/g, '/');
  const segments = normalizedInput.split('/').filter(Boolean);

  if (segments.includes('..')) {
    throw new Error(`${fieldName} contains forbidden path traversal segments: ${rawValue}`);
  }

  if (!path.isAbsolute(rawValue)) {
    return;
  }

  const resolvedPath = path.resolve(rawValue).replace(/\\/g, '/');
  const isProtectedPath = PROTECTED_ABSOLUTE_PATH_PREFIXES.some((prefix) => (
    resolvedPath === prefix || resolvedPath.startsWith(`${prefix}/`)
  ));

  if (isProtectedPath) {
    throw new Error(`${fieldName} points to a protected system path: ${rawValue}`);
  }
}

/** Build CLI args array for pipeline.py from typed config */
function buildPipelineArgs(config: VideoEditorConfig): string[] {
  const args: string[] = [config.action];

  switch (config.action) {
    case 'highlight':
      args.push('--input', config.input);
      if (config.mode) args.push('--mode', config.mode);
      if (config.interval != null) args.push('--interval', String(config.interval));
      if (config.threshold != null) args.push('--threshold', String(config.threshold));
      if (config.maxClips != null) args.push('--max-clips', String(config.maxClips));
      if (config.outputDir) args.push('--output-dir', config.outputDir);
      break;

    case 'merge':
      for (const inp of config.inputs) {
        args.push('--input', inp);
      }
      if (config.transition) args.push('--transition', config.transition);
      if (config.transitionDuration != null) args.push('--transition-duration', String(config.transitionDuration));
      if (config.audio) args.push('--audio', config.audio);
      if (config.audioVolume != null) args.push('--audio-volume', String(config.audioVolume));
      if (config.subtitle) args.push('--subtitle', config.subtitle);
      if (config.outputDir) args.push('--output-dir', config.outputDir);
      break;

    case 'trim':
      args.push('--input', config.input);
      args.push('--start', config.start);
      args.push('--end', config.end);
      if (config.speed != null) args.push('--speed', String(config.speed));
      if (config.brightness != null) args.push('--brightness', String(config.brightness));
      if (config.contrast != null) args.push('--contrast', String(config.contrast));
      if (config.saturation != null) args.push('--saturation', String(config.saturation));
      if (config.watermark) args.push('--watermark', config.watermark);
      if (config.watermarkPosition) args.push('--watermark-position', config.watermarkPosition);
      if (config.watermarkOpacity != null) args.push('--watermark-opacity', String(config.watermarkOpacity));
      if (config.outputDir) args.push('--output-dir', config.outputDir);
      break;

    case 'subtitle':
      args.push('--input', config.input);
      if (config.language) args.push('--language', config.language);
      if (config.model) args.push('--model', config.model);
      if (config.polish) args.push('--polish');
      if (config.burn) args.push('--burn');
      if (config.outputDir) args.push('--output-dir', config.outputDir);
      break;
  }

  return args;
}

/** Spawn Python pipeline.py and collect JSON output */
function runPipeline(pipelinePath: string, args: string[]): Promise<PipelineResult> {
  const TIMEOUT_MS = 120_000;
  return new Promise((resolve, reject) => {
    const proc = spawn('python3', [pipelinePath, ...args], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    let stdout = '';
    let stderr = '';
    let killed = false;

    const timer = setTimeout(() => {
      killed = true;
      proc.kill('SIGKILL');
    }, TIMEOUT_MS);

    proc.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
    proc.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(new Error(`Failed to start pipeline: ${err.message}`));
    });

    proc.on('close', (code) => {
      clearTimeout(timer);
      if (killed) {
        resolve({ status: 'error', message: `pipeline.py timed out after ${TIMEOUT_MS / 1000}s` });
        return;
      }
      if (code !== 0 && !stdout.trim()) {
        const errMsg = stderr.trim() || `pipeline.py exited with code ${code}`;
        resolve({ status: 'error', message: errMsg });
        return;
      }

      try {
        const parsed = JSON.parse(stdout) as PipelineResult;
        resolve(parsed);
      } catch {
        resolve({
          status: 'error',
          message: `Failed to parse pipeline output: ${stdout.slice(0, 500)}`,
        });
      }
    });
  });
}

/** Infer action and minimal config from raw natural-language input */
function inferConfigFromInput(input: string): VideoEditorConfig {
  const lower = input.toLowerCase();

  if (/highlight|高光|精彩/.test(lower)) {
    return { action: 'highlight', input: '' };
  }
  if (/merge|合并|拼接|融合/.test(lower)) {
    return { action: 'merge', inputs: [] };
  }
  if (/subtitle|字幕|asr|转写/.test(lower)) {
    return { action: 'subtitle', input: '' };
  }
  if (/trim|裁剪|截取|切割/.test(lower)) {
    return { action: 'trim', input: '', start: '0', end: '0' };
  }

  // Extract duration hint from prompt
  const durMatch = input.match(/(\d+)\s*[秒sS]/);
  const duration = durMatch ? parseInt(durMatch[1], 10) : 15;

  // Default to storyboard — text-only generation, no video file needed
  return { action: 'storyboard', prompt: input, duration };
}

/** Check if input text matches video-related intent (Chinese + English) */
export function canHandleVideoIntent(input: string): boolean {
  const lower = input.toLowerCase();
  const keywords = [
    'video', 'clip', 'highlight', 'trim', 'merge', 'subtitle',
    'storyboard', 'video script',
    '视频', '剪辑', '高光', '字幕', '合并', '拼接', '精剪', '切片',
    '分镜', '视频脚本', '视频策划',
  ];
  return keywords.some(kw => lower.includes(kw));
}

const videoEditorSkill = new VideoEditorSkill();

export default videoEditorSkill;
