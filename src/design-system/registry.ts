// FR-G01 AC3: Design System Registry — manages multiple packages
import type { DesignSystemPackage } from './types.js';

export class DesignSystemRegistry {
  private packages = new Map<string, DesignSystemPackage>();
  private defaultId: string | null = null;

  register(pkg: DesignSystemPackage): void {
    this.packages.set(pkg.id, pkg);
    if (!this.defaultId) {
      this.defaultId = pkg.id;
    }
  }

  get(id: string): DesignSystemPackage | undefined {
    return this.packages.get(id);
  }

  getDefault(): DesignSystemPackage | undefined {
    return this.defaultId ? this.packages.get(this.defaultId) : undefined;
  }

  setDefault(id: string): void {
    if (!this.packages.has(id)) {
      throw new Error(`Design system package "${id}" not registered`);
    }
    this.defaultId = id;
  }

  list(): DesignSystemPackage[] {
    return Array.from(this.packages.values());
  }

  has(id: string): boolean {
    return this.packages.has(id);
  }

  resolve(id?: string): DesignSystemPackage {
    const pkg = id ? this.get(id) : this.getDefault();
    if (!pkg) {
      throw new Error(
        id ? `Design system package "${id}" not found` : 'No default design system package registered'
      );
    }
    return pkg;
  }
}
