const fs = require('fs');
const path = require('path');

const base = '/root/.openclaw/workspace/projects/claw-design';

// 1. Add ./template export to package.json
const pkgPath = path.join(base, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
pkg.exports['./template'] = {
  types: './dist/template/index.d.ts',
  import: './dist/template/index.js'
};
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log('package.json updated');

// 2. Add TD-02 + TD-04 exports to index.ts
const indexPath = path.join(base, 'src/index.ts');
let index = fs.readFileSync(indexPath, 'utf-8');

const qualityInsert = `export { DEFAULT_RULE_SET, loadRuleSet } from './quality/index.js';
export type { QualityRuleSet, L1RuleConfig, L1StructuralRuleConfig, L2RuleConfig, RuleSeverity } from './quality/index.js';`;

const themeInsert = `export { ThemeEngine, createThemeEngine, BUILT_IN_THEMES as BUILT_IN_THEME_DEFS } from './template/index.js';
export type { ThemeDefinition, ThemeValidationError } from './template/index.js';`;

index = index.replace(
  "export type { QualityGateL3 } from './quality/index.js';",
  "export type { QualityGateL3 } from './quality/index.js';\n" + qualityInsert
);

index = index.replace(
  "export type { TemplateResolver, TemplateDescriptor } from './template/index.js';",
  "export type { TemplateResolver, TemplateDescriptor } from './template/index.js';\n" + themeInsert
);

fs.writeFileSync(indexPath, index);
console.log('index.ts updated');

// 3. Remove td-exports.ts if it exists
const tdPath = path.join(base, 'src/td-exports.ts');
if (fs.existsSync(tdPath)) {
  fs.unlinkSync(tdPath);
  console.log('td-exports.ts removed');
}

console.log('All done');
