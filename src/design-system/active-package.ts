// FR-H08: Active Package Manager — dynamic brand package switching
import type { DesignSystemPackage } from './types.js';
import { DARK_SCI_FI_PACKAGE } from './packages/index.js';

/**
 * FR-H08: Manages the currently active brand package for constraint checking.
 * All constraint validation uses the active package's rules.
 * Switching packages does not affect already-generated artifacts (FR-H04 AC6).
 */
export class ActivePackageManager {
  private current: DesignSystemPackage;

  constructor(defaultPackage?: DesignSystemPackage) {
    this.current = defaultPackage ?? DARK_SCI_FI_PACKAGE;
  }

  /** Get the currently active package */
  getActive(): DesignSystemPackage {
    return this.current;
  }

  /** FR-H08 AC1: Switch active package — constraint-checker auto-follows */
  setActive(pkg: DesignSystemPackage): void {
    this.current = pkg;
  }

  /** Reset to default */
  reset(): void {
    this.current = DARK_SCI_FI_PACKAGE;
  }

  /** Get active package ID */
  getActiveId(): string {
    return this.current.id;
  }
}