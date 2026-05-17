// PackagingService — bundles artifacts into deliverable packages
// arc42 §5: Packaging domain — ZIP, folder, or single-file output

import type { Artifact, ThemePack, DeliveryBundle } from '../types.js';

export interface PackagingOptions {
  format: 'folder' | 'zip' | 'single-html';
  includeAssets: boolean;
  outputDir: string;
}

export interface PackagingService {
  package(artifact: Artifact, theme: ThemePack, options: PackagingOptions): Promise<DeliveryBundle>;
}

/** Delegates to ExportAdapter for now, provides the interface for future packaging */
export class DefaultPackagingService implements PackagingService {
  async package(
    artifact: Artifact,
    _theme: ThemePack,
    options: PackagingOptions,
  ): Promise<DeliveryBundle> {
    // Simple folder output (actual packaging delegated to ExportAdapter)
    return {
      taskId: artifact.taskId,
      htmlPath: `${options.outputDir}/index.html`,
      qualitySummary: 'pass',
      files: [`${options.outputDir}/index.html`],
    };
  }
}
