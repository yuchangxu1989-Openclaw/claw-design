// FR-G01: JSON Schema validation for DesignSystemPackage structure
// Ensures packages conform to the required structure before registration.
import type { DesignSystemPackage, DesignTokens, DesignSpacingScale, TypographyScale, ComponentClass, ReferencePage, DesignConstraints } from './types.js';

export interface ValidationError {
  path: string;
  message: string;
}

export interface SchemaValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validates a DesignSystemPackage against the required schema.
 * Supports multi-style instances by validating each package independently.
 */
export class PackageSchemaValidator {
  validate(input: unknown): SchemaValidationResult {
    const errors: ValidationError[] = [];

    if (!input || typeof input !== 'object') {
      return { valid: false, errors: [{ path: '', message: 'Package must be a non-null object' }] };
    }

    const pkg = input as Record<string, unknown>;

    // Required string fields
    this.requireString(pkg, 'id', errors);
    this.requireString(pkg, 'name', errors);
    this.requireString(pkg, 'version', errors);

    // Tokens
    if (!pkg.tokens || typeof pkg.tokens !== 'object') {
      errors.push({ path: 'tokens', message: 'tokens must be an object' });
    } else {
      this.validateTokens(pkg.tokens as Record<string, unknown>, errors);
    }

    // Components
    if (!Array.isArray(pkg.components)) {
      errors.push({ path: 'components', message: 'components must be an array' });
    } else {
      this.validateComponents(pkg.components, errors);
    }

    // Reference
    if (!pkg.reference || typeof pkg.reference !== 'object') {
      errors.push({ path: 'reference', message: 'reference must be an object with html field' });
    } else {
      this.validateReference(pkg.reference as Record<string, unknown>, errors);
    }

    // Constraints
    if (!pkg.constraints || typeof pkg.constraints !== 'object') {
      errors.push({ path: 'constraints', message: 'constraints must be an object with enforce and forbid arrays' });
    } else {
      this.validateConstraints(pkg.constraints as Record<string, unknown>, errors);
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Type-safe validation that returns the typed package or throws.
   */
  validateOrThrow(input: unknown): DesignSystemPackage {
    const result = this.validate(input);
    if (!result.valid) {
      const messages = result.errors.map(e => `  [${e.path}] ${e.message}`).join('\n');
      throw new Error(`Invalid DesignSystemPackage:\n${messages}`);
    }
    return input as DesignSystemPackage;
  }

  private requireString(obj: Record<string, unknown>, field: string, errors: ValidationError[]): void {
    if (typeof obj[field] !== 'string' || (obj[field] as string).trim() === '') {
      errors.push({ path: field, message: `${field} must be a non-empty string` });
    }
  }

  private validateTokens(tokens: Record<string, unknown>, errors: ValidationError[]): void {
    // colors
    if (!tokens.colors || typeof tokens.colors !== 'object' || Array.isArray(tokens.colors)) {
      errors.push({ path: 'tokens.colors', message: 'colors must be a Record<string, string>' });
    } else {
      const colors = tokens.colors as Record<string, unknown>;
      if (Object.keys(colors).length === 0) {
        errors.push({ path: 'tokens.colors', message: 'colors must have at least one entry' });
      }
      for (const [key, val] of Object.entries(colors)) {
        if (typeof val !== 'string') {
          errors.push({ path: `tokens.colors.${key}`, message: 'color value must be a string' });
        }
      }
    }

    // spacing
    if (!tokens.spacing || typeof tokens.spacing !== 'object') {
      errors.push({ path: 'tokens.spacing', message: 'spacing must be an object with unit and values' });
    } else {
      const spacing = tokens.spacing as Record<string, unknown>;
      if (typeof spacing.unit !== 'string') {
        errors.push({ path: 'tokens.spacing.unit', message: 'spacing.unit must be a string' });
      }
      if (!spacing.values || typeof spacing.values !== 'object' || Object.keys(spacing.values as object).length === 0) {
        errors.push({ path: 'tokens.spacing.values', message: 'spacing.values must be a non-empty object' });
      }
    }

    // typography
    if (!tokens.typography || typeof tokens.typography !== 'object') {
      errors.push({ path: 'tokens.typography', message: 'typography must be an object' });
    } else {
      const typo = tokens.typography as Record<string, unknown>;
      if (!typo.fontFamily || typeof typo.fontFamily !== 'object') {
        errors.push({ path: 'tokens.typography.fontFamily', message: 'fontFamily must be an object with heading and body' });
      } else {
        const ff = typo.fontFamily as Record<string, unknown>;
        if (typeof ff.heading !== 'string') errors.push({ path: 'tokens.typography.fontFamily.heading', message: 'must be a string' });
        if (typeof ff.body !== 'string') errors.push({ path: 'tokens.typography.fontFamily.body', message: 'must be a string' });
      }
      if (!typo.sizes || typeof typo.sizes !== 'object' || Object.keys(typo.sizes as object).length === 0) {
        errors.push({ path: 'tokens.typography.sizes', message: 'sizes must be a non-empty object' });
      }
      if (!typo.weights || typeof typo.weights !== 'object') {
        errors.push({ path: 'tokens.typography.weights', message: 'weights must be an object' });
      }
      if (!typo.lineHeights || typeof typo.lineHeights !== 'object') {
        errors.push({ path: 'tokens.typography.lineHeights', message: 'lineHeights must be an object' });
      }
    }

    // radius
    if (!tokens.radius || typeof tokens.radius !== 'object') {
      errors.push({ path: 'tokens.radius', message: 'radius must be an object' });
    }

    // shadows
    if (!tokens.shadows || typeof tokens.shadows !== 'object') {
      errors.push({ path: 'tokens.shadows', message: 'shadows must be an object' });
    }

    // opacity
    if (!tokens.opacity || typeof tokens.opacity !== 'object') {
      errors.push({ path: 'tokens.opacity', message: 'opacity must be an object' });
    }
  }

  private validateComponents(components: unknown[], errors: ValidationError[]): void {
    for (let i = 0; i < components.length; i++) {
      const comp = components[i];
      if (!comp || typeof comp !== 'object') {
        errors.push({ path: `components[${i}]`, message: 'component must be an object' });
        continue;
      }
      const c = comp as Record<string, unknown>;
      if (typeof c.name !== 'string') errors.push({ path: `components[${i}].name`, message: 'must be a string' });
      if (typeof c.selector !== 'string') errors.push({ path: `components[${i}].selector`, message: 'must be a string' });
      if (!c.properties || typeof c.properties !== 'object') {
        errors.push({ path: `components[${i}].properties`, message: 'must be an object' });
      }
    }
  }

  private validateReference(ref: Record<string, unknown>, errors: ValidationError[]): void {
    if (typeof ref.html !== 'string' || (ref.html as string).trim() === '') {
      errors.push({ path: 'reference.html', message: 'reference.html must be a non-empty string' });
    }
  }

  private validateConstraints(constraints: Record<string, unknown>, errors: ValidationError[]): void {
    if (!Array.isArray(constraints.enforce)) {
      errors.push({ path: 'constraints.enforce', message: 'enforce must be an array' });
    }
    if (!Array.isArray(constraints.forbid)) {
      errors.push({ path: 'constraints.forbid', message: 'forbid must be an array' });
    }
  }
}
