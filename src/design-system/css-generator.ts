// FR-G01 AC1: Generate loadable CSS stylesheet from a DesignSystemPackage
// Packages exist as CSS variables + predefined classes, independently loadable and switchable.
import type { DesignSystemPackage } from './types.js';

/**
 * Generates a complete CSS stylesheet from a DesignSystemPackage.
 * The output can be injected as a <style> block or saved as a .css file.
 * Switching packages = swapping this stylesheet.
 */
export class CssGenerator {
  /**
   * Generate the full CSS for a package: :root variables + component classes.
   */
  generate(pkg: DesignSystemPackage): string {
    const sections: string[] = [];

    sections.push(this.generateRootVariables(pkg));
    sections.push(this.generateBaseReset());
    sections.push(this.generateComponentClasses(pkg));

    return sections.join('\n\n');
  }

  /**
   * Generate only the :root CSS custom properties block.
   */
  generateRootVariables(pkg: DesignSystemPackage): string {
    const vars: string[] = [];

    // Colors
    for (const [name, value] of Object.entries(pkg.tokens.colors)) {
      vars.push(`  --${name}: ${value};`);
    }

    // Spacing
    for (const [name, value] of Object.entries(pkg.tokens.spacing.values)) {
      vars.push(`  --spacing-${name}: ${value};`);
    }

    // Typography sizes
    for (const [name, value] of Object.entries(pkg.tokens.typography.sizes)) {
      vars.push(`  --font-size-${name}: ${value};`);
    }

    // Typography weights
    for (const [name, value] of Object.entries(pkg.tokens.typography.weights)) {
      vars.push(`  --font-weight-${name}: ${value};`);
    }

    // Line heights
    for (const [name, value] of Object.entries(pkg.tokens.typography.lineHeights)) {
      vars.push(`  --line-height-${name}: ${value};`);
    }

    // Radius
    for (const [name, value] of Object.entries(pkg.tokens.radius)) {
      vars.push(`  --radius-${name}: ${value};`);
    }

    // Shadows
    for (const [name, value] of Object.entries(pkg.tokens.shadows)) {
      vars.push(`  --shadow-${name}: ${value};`);
    }

    // Opacity
    for (const [name, value] of Object.entries(pkg.tokens.opacity)) {
      vars.push(`  --opacity-${name}: ${value};`);
    }

    return `:root {\n${vars.join('\n')}\n}`;
  }

  /**
   * Generate base reset using package typography.
   */
  private generateBaseReset(): string {
    return `* { box-sizing: border-box; margin: 0; }`;
  }

  /**
   * Generate component class definitions from the package.
   */
  generateComponentClasses(pkg: DesignSystemPackage): string {
    const rules: string[] = [];

    for (const comp of pkg.components) {
      const selector = comp.selector.includes(' ')
        ? comp.selector.split(' ').map(s => `.${s}`).join('')
        : `.${comp.selector}`;

      const props = Object.entries(comp.properties)
        .map(([prop, val]) => `  ${prop}: ${val};`)
        .join('\n');

      rules.push(`${selector} {\n${props}\n}`);
    }

    return rules.join('\n\n');
  }

  /**
   * Generate a complete HTML page wrapping the CSS for preview/reference.
   */
  generateHtmlWrapper(pkg: DesignSystemPackage, bodyContent: string = ''): string {
    const css = this.generate(pkg);
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${pkg.name} — Design System</title>
<style>
${css}
body {
  background: var(--bg, #fff);
  color: var(--ink, #000);
  font-family: ${pkg.tokens.typography.fontFamily.body};
}
</style>
</head>
<body>
${bodyContent}
</body>
</html>`;
  }
}
