/** Supported video editing actions */
export type VideoAction = 'highlight' | 'merge' | 'trim' | 'subtitle' | 'storyboard';

/** Pipeline JSON output from Python process */
export interface PipelineResult {
  status: 'ok' | 'error';
  outputs?: string[];
  message?: string;
  metadata?: Record<string, unknown>;
}

/** Highlight extraction config */
export interface HighlightConfig {
  input: string;
  mode?: string;
  interval?: number;
  threshold?: number;
  maxClips?: number;
  outputDir?: string;
}

/** Multi-video merge config */
export interface MergeConfig {
  inputs: string[];
  transition?: string;
  transitionDuration?: number;
  audio?: string;
  audioVolume?: number;
  subtitle?: string;
  outputDir?: string;
}

/** Single video trim config */
export interface TrimConfig {
  input: string;
  start: string;
  end: string;
  speed?: number;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  watermark?: string;
  watermarkPosition?: string;
  watermarkOpacity?: number;
  outputDir?: string;
}

/** ASR subtitle generation config */
export interface SubtitleConfig {
  input: string;
  language?: string;
  model?: string;
  polish?: boolean;
  burn?: boolean;
  outputDir?: string;
}

/** Storyboard generation config (text-only, no video file needed) */
export interface StoryboardConfig {
  prompt: string;
  duration?: number;
  scenes?: number;
  style?: string;
}

/** Union config for all actions */
export type VideoEditorConfig =
  | { action: 'highlight' } & HighlightConfig
  | { action: 'merge' } & MergeConfig
  | { action: 'trim' } & TrimConfig
  | { action: 'subtitle' } & SubtitleConfig
  | { action: 'storyboard' } & StoryboardConfig;

/** Context passed to VideoEditorSkill.generate() */
export interface VideoEditorSkillContext {
  taskId?: string;
  videoConfig?: VideoEditorConfig;
  pipelinePath?: string;
}
