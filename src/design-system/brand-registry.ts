// FR-H03: Brand Package Registry — auto-scan packages/ directory
import { readdir, readFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DesignSystemPackage } from './types.js';
import type { PackageMetadata, PackageSearchOptions } from './package-types.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const DEFAULT_PACKAGES_DIR = resolve(__dirname, 'packages');

export class BrandPackageRegistry {
  private packages = new Map<string, DesignSystemPackage>();
  private metadata = new Map<string, PackageMetadata>();
  private packagesDir: string;
  private scanned = false;

  constructor(packagesDir?: string) {
    this.packagesDir = packagesDir ?? DEFAULT_PACKAGES_DIR;
  }

  /** FR-H03 AC1: Auto-scan packages directory */
  async scan(): Promise<void> {
    this.packages.clear();
    this.metadata.clear();

    let entries: string[];
    try {
      entries = await readdir(this.packagesDir);
    } catch {
      entries = [];
    }

    for (const entry of entries) {
      const dir = join(this.packagesDir, entry);
      const dirStat = await stat(dir).catch(() => null);
      if (!dirStat?.isDirectory()) continue;

      // FR-H01 AC5: Must have both design.md and index.ts
      const designMdPath = join(dir, 'design.md');
      const indexPath = join(dir, 'index.ts');

      const [hasMd, hasTs] = await Promise.all([
        stat(designMdPath).then(() => true).catch(() => false),
        stat(indexPath).then(() => true).catch(() => false),
      ]);

      if (!hasMd || !hasTs) continue;

      try {
        // Dynamic import of the package module
        const mod = await import(join(dir, 'index.js'));
        const pkg: DesignSystemPackage | undefined =
          mod.default ?? Object.values(mod).find((v: unknown) =>
            v && typeof v === 'object' && 'id' in (v as Record<string, unknown>) && 'tokens' in (v as Record<string, unknown>)
          ) as DesignSystemPackage | undefined;

        if (!pkg) continue;

        // FR-H03 AC5: Reject duplicate IDs
        if (this.packages.has(pkg.id)) {
          console.error(`[BrandPackageRegistry] Duplicate package id "${pkg.id}" — skipping ${dir}`);
          continue;
        }

        this.packages.set(pkg.id, pkg);
        this.metadata.set(pkg.id, this.buildMetadata(pkg));
      } catch {
        // Package failed to load — skip silently for scan robustness
      }
    }

    this.scanned = true;
  }

  /** FR-H03 AC4: Synchronous registration for pre-loaded packages */
  register(pkg: DesignSystemPackage): void {
    if (this.packages.has(pkg.id)) {
      throw new Error(`[BrandPackageRegistry] Duplicate package id "${pkg.id}"`);
    }
    this.packages.set(pkg.id, pkg);
    this.metadata.set(pkg.id, this.buildMetadata(pkg));
  }

  /** FR-H03 AC6: listAll() */
  listAll(): PackageMetadata[] {
    return Array.from(this.metadata.values());
  }

  /** FR-H03 AC6: findByName(name) — exact match */
  findByName(name: string): DesignSystemPackage | undefined {
    // Match by id or name (case-insensitive)
    for (const pkg of this.packages.values()) {
      if (pkg.id === name || pkg.name.toLowerCase() === name.toLowerCase()) {
        return pkg;
      }
    }
    return undefined;
  }

  /** FR-H03 AC6: findByTag(tag) */
  findByTag(tag: string): PackageMetadata[] {
    const t = tag.toLowerCase();
    return this.listAll().filter(m => m.tags.some(mt => mt.toLowerCase() === t));
  }

  /** FR-H03 AC6: search(keyword) — fuzzy search across name, description, tags */
  search(keyword: string): PackageMetadata[] {
    const kw = keyword.toLowerCase();
    return this.listAll().filter(m =>
      m.name.toLowerCase().includes(kw) ||
      m.id.toLowerCase().includes(kw) ||
      (m.description ?? '').toLowerCase().includes(kw) ||
      m.tags.some(t => t.toLowerCase().includes(kw))
    );
  }

  /** Get the full package by id */
  getPackage(id: string): DesignSystemPackage | undefined {
    return this.packages.get(id);
  }

  /** List available package IDs */
  listPackages(): string[] {
    return Array.from(this.packages.keys());
  }

  /** Check if a package exists */
  has(id: string): boolean {
    return this.packages.has(id);
  }

  /** FR-H03 AC4: Hot-reload support */
  async reload(): Promise<void> {
    await this.scan();
  }

  private buildMetadata(pkg: DesignSystemPackage): PackageMetadata {
    const colorValues = Object.values(pkg.tokens.colors);
    const colorPreview = colorValues.slice(0, 5);
    const tags = this.extractTags(pkg);

    return {
      id: pkg.id,
      name: pkg.name,
      version: pkg.version,
      description: pkg.description,
      tags,
      colorPreview,
      valid: true,
    };
  }

  private extractTags(pkg: DesignSystemPackage): string[] {
    const tags: string[] = [];
    // Derive tags from package characteristics
    const colors = Object.values(pkg.tokens.colors);
    const hasDarkBg = colors.some(c => {
      const hex = c.replace('#', '');
      if (hex.length !== 6) return false;
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return (r + g + b) / 3 < 64;
    });
    if (hasDarkBg) tags.push('dark');
    else tags.push('light');

    if (pkg.description) {
      const desc = pkg.description.toLowerCase();
      if (desc.includes('fintech') || desc.includes('finance')) tags.push('fintech');
      if (desc.includes('saas') || desc.includes('software')) tags.push('saas');
      if (desc.includes('consumer')) tags.push('consumer');
      if (desc.includes('futuristic') || desc.includes('sci-fi')) tags.push('futuristic');
    }

    return tags;
  }
}