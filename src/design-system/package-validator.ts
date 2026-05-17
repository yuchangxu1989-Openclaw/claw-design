// FR-H07: Package Quality Gate — validate brand package completeness
import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { DesignSystemPackage } from './types.js';
import type { PackageValidationResult, PackageValidationError } from './package-types.js';

/** The 9 standard sections expected in design.md (FR-H01 AC2) */
const DESIGN_MD_SECTIONS = [
  'Visual Theme',
  'Color Palette',
  'Typography',
  'Component Stylings',
  'Layout Principles',
  'Imagery',
  'Animation',
  'Accessibility',
  'Brand Voice',
] as const;

/** Required token fields in index.ts (FR-H07 AC2) */
const REQUIRED_TOKEN_FIELDS = ['colors', 'typography', 'spacing', 'radius'] as const;

export class PackageValidator {
  /**
   * FR-H07 AC1+AC2: Validate a package directory.
   * Checks design.md structure and index.ts field coverage.
   */
  async validatePackage(packageDir: string): Promise<PackageValidationResult> {
    const errors: PackageValidationError[] = [];
    const warnings: PackageValidationError[] = [];
    let packageId = packageDir.split('/').pop() ?? 'unknown';

    // Check directory exists
    const dirExists = await stat(packageDir).then(s => s.isDirectory()).catch(() => false);
    if (!dirExists) {
      errors.push({
        code: 'DIR_NOT_FOUND',
        message: `Package directory not found: ${packageDir}`,
        file: 'directory',
      });
      return { packageId, valid: false, level: 'block', errors, warnings };
    }

    // FR-H01 AC5: Check required files exist
    const designMdPath = join(packageDir, 'design.md');
    const indexTsPath = join(packageDir, 'index.ts');

    const [hasMd, hasTs] = await Promise.all([
      stat(designMdPath).then(() => true).catch(() => false),
      stat(indexTsPath).then(() => true).catch(() => false),
    ]);

    if (!hasMd) {
      errors.push({
        code: 'MISSING_DESIGN_MD',
        message: 'Missing required file: design.md',
        file: 'design.md',
      });
    }

    if (!hasTs) {
      errors.push({
        code: 'MISSING_INDEX_TS',
        message: 'Missing required file: index.ts',
        file: 'index.ts',
      });
    }

    if (!hasMd || !hasTs) {
      return { packageId, valid: false, level: 'block', errors, warnings };
    }

    // Validate design.md structure (FR-H01 AC2)
    const mdContent = await readFile(designMdPath, 'utf-8');
    const mdErrors = this.validateDesignMd(mdContent);
    errors.push(...mdErrors.errors);
    warnings.push(...mdErrors.warnings);

    // Validate index.ts exports (FR-H07 AC2) — static analysis of source
    const tsContent = await readFile(indexTsPath, 'utf-8');
    const tsErrors = this.validateIndexTs(tsContent);
    errors.push(...tsErrors.errors);
    warnings.push(...tsErrors.warnings);

    // FR-H07 AC3: Dual-layer consistency check (design.md ↔ index.ts)
    const consistencyErrors = this.validateConsistency(mdContent, tsContent);
    errors.push(...consistencyErrors.errors);
    warnings.push(...consistencyErrors.warnings);

    // FR-H07 AC4: Check reference.html exists and is non-empty
    const refHtmlPath = join(packageDir, 'reference.html');
    const refErrors = await this.validateReferenceHtml(refHtmlPath);
    errors.push(...refErrors.errors);
    warnings.push(...refErrors.warnings);

    // Try to extract packageId from TS content
    const idMatch = tsContent.match(/id:\s*['"]([^'"]+)['"]/);
    if (idMatch) packageId = idMatch[1];

    const valid = errors.length === 0;
    const level = errors.length > 0 ? 'block' : warnings.length > 0 ? 'warn' : 'pass';

    return { packageId, valid, level, errors, warnings };
  }

  /**
   * FR-H07: Validate a loaded DesignSystemPackage object directly.
   * Useful when the package is already imported.
   */
  validateLoadedPackage(pkg: DesignSystemPackage): PackageValidationResult {
    const errors: PackageValidationError[] = [];
    const warnings: PackageValidationError[] = [];

    // Check required token fields
    for (const field of REQUIRED_TOKEN_FIELDS) {
      if (field === 'colors') {
        if (!pkg.tokens.colors || Object.keys(pkg.tokens.colors).length === 0) {
          errors.push({
            code: 'MISSING_COLORS',
            message: 'tokens.colors is empty or missing',
            file: 'index.ts',
          });
        }
      } else if (field === 'typography') {
        if (!pkg.tokens.typography?.fontFamily?.heading) {
          errors.push({
            code: 'MISSING_TYPOGRAPHY',
            message: 'tokens.typography.fontFamily.heading is missing',
            file: 'index.ts',
          });
        }
        if (!pkg.tokens.typography?.sizes || Object.keys(pkg.tokens.typography.sizes).length === 0) {
          errors.push({
            code: 'MISSING_TYPOGRAPHY_SIZES',
            message: 'tokens.typography.sizes is empty or missing',
            file: 'index.ts',
          });
        }
      } else if (field === 'spacing') {
        if (!pkg.tokens.spacing?.values || Object.keys(pkg.tokens.spacing.values).length === 0) {
          errors.push({
            code: 'MISSING_SPACING',
            message: 'tokens.spacing.values is empty or missing',
            file: 'index.ts',
          });
        }
      } else if (field === 'radius') {
        if (!pkg.tokens.radius || Object.keys(pkg.tokens.radius).length === 0) {
          errors.push({
            code: 'MISSING_RADIUS',
            message: 'tokens.radius is empty or missing',
            file: 'index.ts',
          });
        }
      }
    }

    // Check components
    if (!pkg.components || pkg.components.length === 0) {
      warnings.push({
        code: 'NO_COMPONENTS',
        message: 'No component definitions found',
        file: 'index.ts',
      });
    }

    // Check constraints
    if (!pkg.constraints) {
      warnings.push({
        code: 'NO_CONSTRAINTS',
        message: 'No constraints defined — package will use only generic checks',
        file: 'index.ts',
      });
    }

    const valid = errors.length === 0;
    const level = errors.length > 0 ? 'block' : warnings.length > 0 ? 'warn' : 'pass';

    return { packageId: pkg.id, valid, level, errors, warnings };
  }

  /** Validate design.md has the 9 standard sections */
  private validateDesignMd(content: string): { errors: PackageValidationError[]; warnings: PackageValidationError[] } {
    const errors: PackageValidationError[] = [];
    const warnings: PackageValidationError[] = [];

    const headings = content.match(/^##\s+\d+\.\s+(.+)$/gm) ?? [];
    const foundSections = headings.map(h => h.replace(/^##\s+\d+\.\s+/, '').trim());

    for (const section of DESIGN_MD_SECTIONS) {
      const found = foundSections.some(
        s => s.toLowerCase().includes(section.toLowerCase())
      );
      if (!found) {
        warnings.push({
          code: 'MISSING_SECTION',
          message: `design.md missing standard section: "${section}"`,
          file: 'design.md',
        });
      }
    }

    // Check for at least one extractable value per section (hex, px, font name)
    const hasHardValues = /(?:#[0-9a-fA-F]{3,8}|\d+px|\d+rem)/.test(content);
    if (!hasHardValues) {
      errors.push({
        code: 'NO_HARD_VALUES',
        message: 'design.md contains no extractable hard parameter values (hex colors, px/rem sizes)',
        file: 'design.md',
      });
    }

    return { errors, warnings };
  }

  /** Static analysis of index.ts source for required fields */
  private validateIndexTs(content: string): { errors: PackageValidationError[]; warnings: PackageValidationError[] } {
    const errors: PackageValidationError[] = [];
    const warnings: PackageValidationError[] = [];

    // Check for required top-level fields in the export
    const requiredPatterns: Array<[string, string, RegExp]> = [
      ['MISSING_COLORS_FIELD', 'colors field not found in index.ts', /colors\s*:/],
      ['MISSING_TYPOGRAPHY_FIELD', 'typography field not found in index.ts', /typography\s*:/],
      ['MISSING_SPACING_FIELD', 'spacing field not found in index.ts', /spacing\s*:/],
      ['MISSING_RADIUS_FIELD', 'radius (borderRadius) field not found in index.ts', /radius\s*:/],
    ];

    for (const [code, message, pattern] of requiredPatterns) {
      if (!pattern.test(content)) {
        errors.push({ code, message, file: 'index.ts' });
      }
    }

    // Check for DesignSystemPackage type reference
    if (!content.includes('DesignSystemPackage')) {
      warnings.push({
        code: 'NO_TYPE_ANNOTATION',
        message: 'index.ts does not reference DesignSystemPackage type — type safety not guaranteed',
        file: 'index.ts',
      });
    }

    return { errors, warnings };
  }

  /**
   * FR-H07 AC3: Dual-layer consistency check.
   * Verifies that colors/fonts declared in design.md are present in index.ts.
   */
  private validateConsistency(
    mdContent: string,
    tsContent: string
  ): { errors: PackageValidationError[]; warnings: PackageValidationError[] } {
    const errors: PackageValidationError[] = [];
    const warnings: PackageValidationError[] = [];

    // Extract hex colors from design.md
    const mdColors = new Set<string>();
    const hexRe = /#[0-9a-fA-F]{6}\b/g;
    let m: RegExpExecArray | null;
    while ((m = hexRe.exec(mdContent)) !== null) {
      mdColors.add(m[0].toLowerCase());
    }

    // Extract hex colors from index.ts
    const tsColors = new Set<string>();
    const tsHexRe = /'(#[0-9a-fA-F]{6})'/g;
    while ((m = tsHexRe.exec(tsContent)) !== null) {
      tsColors.add(m[1].toLowerCase());
    }

    // Check that at least some design.md colors appear in index.ts
    if (mdColors.size > 0 && tsColors.size > 0) {
      const mdArr = Array.from(mdColors);
      const matchCount = mdArr.filter(c => tsColors.has(c)).length;
      const matchRatio = matchCount / Math.min(mdArr.length, 10); // compare against first 10

      if (matchRatio < 0.3) {
        warnings.push({
          code: 'COLOR_CONSISTENCY_LOW',
          message: `Only ${matchCount}/${Math.min(mdArr.length, 10)} design.md colors found in index.ts — possible extraction drift`,
          file: 'index.ts',
        });
      }
    }

    // Check font family consistency
    const mdFontMatch = mdContent.match(/\*\*(?:Primary|Headline|Display)\*\*[^`]*`([^`]+)`/i);
    if (mdFontMatch) {
      const mdFont = mdFontMatch[1].split(',')[0].trim().toLowerCase();
      const tsFontLower = tsContent.toLowerCase();
      if (mdFont.length > 2 && !tsFontLower.includes(mdFont)) {
        warnings.push({
          code: 'FONT_CONSISTENCY_MISMATCH',
          message: `design.md declares font "${mdFontMatch[1].split(',')[0].trim()}" but it's not found in index.ts`,
          file: 'index.ts',
        });
      }
    }

    return { errors, warnings };
  }

  /**
   * FR-H07 AC4: Validate reference.html exists and is non-empty.
   */
  private async validateReferenceHtml(
    refHtmlPath: string
  ): Promise<{ errors: PackageValidationError[]; warnings: PackageValidationError[] }> {
    const errors: PackageValidationError[] = [];
    const warnings: PackageValidationError[] = [];

    try {
      const refStat = await stat(refHtmlPath);
      if (!refStat.isFile()) {
        errors.push({
          code: 'REFERENCE_HTML_NOT_FILE',
          message: 'reference.html exists but is not a regular file',
          file: 'directory',
        });
      } else if (refStat.size < 100) {
        errors.push({
          code: 'REFERENCE_HTML_TOO_SMALL',
          message: `reference.html is too small (${refStat.size} bytes) — likely empty or placeholder`,
          file: 'directory',
        });
      }
    } catch {
      errors.push({
        code: 'MISSING_REFERENCE_HTML',
        message: 'Missing required file: reference.html',
        file: 'directory',
      });
    }

    return { errors, warnings };
  }
}