// HostAdapter — Infrastructure-level adapter interface
// Provides resource resolution, configuration, output delivery, and progress notification
// Complements the request-lifecycle HostAdapter (adapt/clarify/deliver) in types.ts

/** Skill configuration provided by the host environment */
export interface HostConfig {
  templateDir: string;
  outputDir: string;
  defaultFormat: 'single-html' | 'zip' | 'pdf-ready';
  [key: string]: unknown;
}

/** Progress stage identifiers */
export type ProgressStage =
  | 'routing'
  | 'generating'
  | 'quality-check'
  | 'packaging'
  | 'delivering';

/** Package output descriptor */
export interface OutputPackage {
  path: string;
  format: string;
  sizeBytes: number;
  metadata?: Record<string, unknown>;
}

/** Delivery result from host */
export interface HostDeliveryResult {
  success: boolean;
  location?: string;
  message: string;
}

/**
 * Infrastructure Host Adapter interface.
 * Each host environment (OpenClaw, standalone CLI, etc.) implements this
 * to provide resource access, configuration, and delivery capabilities.
 */
export interface InfraHostAdapter {
  /** Resolve an asset path relative to the host workspace */
  resolveAsset(path: string): Promise<string>;

  /** Get skill configuration from the host environment */
  getConfig(): Promise<HostConfig>;

  /** Deliver a packaged output to the user via host channels */
  deliverOutput(pkg: OutputPackage): Promise<HostDeliveryResult>;

  /** Notify the host of pipeline progress */
  notifyProgress(stage: ProgressStage, percent: number): void;
}
