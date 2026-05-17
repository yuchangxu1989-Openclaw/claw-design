// FR-G05: Visual Verification — headless screenshot + image comparison
import type { DesignSystemPackage, VisualVerificationResult } from './types.js';

export interface ScreenshotProvider {
  capture(html: string): Promise<Buffer>;
}

export interface ImageComparator {
  compare(actual: Buffer, reference: Buffer): Promise<{ deviationPercent: number }>;
}

export interface VisualVerifierOptions {
  threshold?: number;
  screenshotProvider?: ScreenshotProvider;
  imageComparator?: ImageComparator;
}

const DEFAULT_THRESHOLD = 10;

export class VisualVerifier {
  private threshold: number;
  private screenshotProvider?: ScreenshotProvider;
  private imageComparator?: ImageComparator;

  constructor(options: VisualVerifierOptions = {}) {
    this.threshold = options.threshold ?? DEFAULT_THRESHOLD;
    this.screenshotProvider = options.screenshotProvider;
    this.imageComparator = options.imageComparator;
  }

  async verify(html: string, pkg: DesignSystemPackage): Promise<VisualVerificationResult> {
    if (!this.screenshotProvider || !this.imageComparator) {
      return {
        passed: true,
        skipped: true,
        deviationPercent: 0,
        threshold: this.threshold,
        details: 'Visual verification skipped — no screenshot provider configured',
      };
    }

    const actual = await this.screenshotProvider.capture(html);

    let reference: Buffer;
    if (pkg.reference.screenshotPath) {
      const { readFile } = await import('node:fs/promises');
      reference = await readFile(pkg.reference.screenshotPath);
    } else if (pkg.reference.html) {
      reference = await this.screenshotProvider.capture(pkg.reference.html);
    } else {
      return {
        passed: true,
        skipped: true,
        deviationPercent: 0,
        threshold: this.threshold,
        details: 'Visual verification skipped — no reference available',
      };
    }

    const { deviationPercent } = await this.imageComparator.compare(actual, reference);

    return {
      passed: deviationPercent <= this.threshold,
      deviationPercent,
      threshold: this.threshold,
      details: deviationPercent > this.threshold
        ? `Visual deviation ${deviationPercent.toFixed(1)}% exceeds threshold ${this.threshold}%`
        : undefined,
    };
  }

  setThreshold(threshold: number): void {
    this.threshold = threshold;
  }
}
