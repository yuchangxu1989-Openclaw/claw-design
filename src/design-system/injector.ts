// FR-H04: On-Demand Brand Injection
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DesignSystemPackage } from './types.js';
import type { BrandInjectionResult } from './package-types.js';
import { BrandPackageRegistry } from './brand-registry.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const DEFAULT_PACKAGES_DIR = resolve(__dirname, 'packages');

export class BrandInjector {
  private registry: BrandPackageRegistry;
  private packagesDir: string;
  private designMdCache = new Map<string, string>();

  constructor(registry: BrandPackageRegistry, packagesDir?: string) {
    this.registry = registry;
    this.packagesDir = packagesDir ?? DEFAULT_PACKAGES_DIR;
  }

  /**
   * FR-H04 AC2+AC3: Inject brand package dual-layer content.
   * Returns design.md as prompt context + TS package as constraint source.
   */
  async injectDesignSystem(brandName: string): Promise<BrandInjectionResult> {
    const pkg = this.registry.findByName(brandName);
    if (!pkg) {
      const available = this.registry.listPackages();
      throw new Error(
        `Brand package "${brandName}" not found. Available: ${available.join(', ')}`
      );
    }

    const promptContext = await this.loadDesignMd(pkg.id);

    return {
      promptContext,
      constraints: pkg,
    };
  }

  /**
   * FR-H04 AC5: Get default brand injection (dark-sci-fi or configured default).
   */
  async injectDefault(defaultId = 'dark-sci-fi'): Promise<BrandInjectionResult> {
    return this.injectDesignSystem(defaultId);
  }

  /**
   * FR-H04 AC1: List available brands for user selection on match failure.
   */
  listAvailableBrands(): string[] {
    return this.registry.listPackages();
  }

  private async loadDesignMd(packageId: string): Promise<string> {
    if (this.designMdCache.has(packageId)) {
      return this.designMdCache.get(packageId)!;
    }

    const mdPath = join(this.packagesDir, packageId, 'design.md');
    try {
      const content = await readFile(mdPath, 'utf-8');
      this.designMdCache.set(packageId, content);
      return content;
    } catch {
      // Fallback: generate context from package tokens
      const pkg = this.registry.getPackage(packageId);
      if (!pkg) throw new Error(`Package "${packageId}" not found in registry`);
      return this.generateFallbackContext(pkg);
    }
  }

  private generateFallbackContext(pkg: DesignSystemPackage): string {
    const lines: string[] = [
      `# ${pkg.name} Design System`,
      '',
      `${pkg.description ?? ''}`,
      '',
      '## Color Palette',
      ...Object.entries(pkg.tokens.colors).map(([k, v]) => `- ${k}: ${v}`),
      '',
      '## Typography',
      `Font: ${pkg.tokens.typography.fontFamily.heading}`,
      ...Object.entries(pkg.tokens.typography.sizes).map(([k, v]) => `- ${k}: ${v}`),
      '',
      '## Spacing',
      ...Object.entries(pkg.tokens.spacing.values).map(([k, v]) => `- ${k}: ${v}`),
    ];
    return lines.join('\n');
  }

  /** Clear cached design.md content (for hot-reload) */
  clearCache(): void {
    this.designMdCache.clear();
  }
}