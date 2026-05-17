export interface AntiPatternRule {
  id: string;
  name: string;
  description: string;
  check: (html: string) => AntiPatternViolation | null;
}

export interface AntiPatternViolation {
  ruleId: string;
  message: string;
  severity: 'block' | 'warn';
}

export const ANTI_PATTERN_RULES: AntiPatternRule[] = [
  {
    id: 'no-inline-style-color',
    name: '禁止硬编码颜色',
    description: '颜色应使用 CSS 变量而非硬编码值',
    check: (html) => {
      const match = html.match(/style="[^"]*color:\s*#[0-9a-fA-F]{3,8}/);
      if (match) {
        return { ruleId: 'no-inline-style-color', message: '发现硬编码颜色，应使用 --cd-color-* 变量', severity: 'warn' };
      }
      return null;
    },
  },
  {
    id: 'no-fixed-font-size',
    name: '禁止固定像素字号',
    description: '字号应使用 rem/em 或字阶变量',
    check: (html) => {
      const match = html.match(/font-size:\s*\d+px/);
      if (match) {
        return { ruleId: 'no-fixed-font-size', message: '发现固定像素字号，建议使用 rem 或字阶 class', severity: 'warn' };
      }
      return null;
    },
  },
  {
    id: 'no-empty-section',
    name: '禁止空内容区块',
    description: '每个区块必须有实质内容',
    check: (html) => {
      const match = html.match(/<(section|div|article)[^>]*>\s*<\/\1>/);
      if (match) {
        return { ruleId: 'no-empty-section', message: '发现空内容区块', severity: 'block' };
      }
      return null;
    },
  },
  {
    id: 'max-nesting-depth',
    name: '嵌套深度限制',
    description: 'HTML 嵌套不超过 8 层',
    check: (html) => {
      let depth = 0;
      let maxDepth = 0;
      const tagPattern = /<\/?[a-z][a-z0-9]*[^>]*>/gi;
      let m;
      while ((m = tagPattern.exec(html)) !== null) {
        if (m[0].startsWith('</')) {
          depth--;
        } else if (!m[0].endsWith('/>')) {
          depth++;
          if (depth > maxDepth) maxDepth = depth;
        }
      }
      if (maxDepth > 8) {
        return { ruleId: 'max-nesting-depth', message: `HTML 嵌套深度 ${maxDepth} 超过限制 8`, severity: 'warn' };
      }
      return null;
    },
  },
];

export function checkAntiPatterns(html: string, rules?: AntiPatternRule[]): AntiPatternViolation[] {
  const activeRules = rules ?? ANTI_PATTERN_RULES;
  const violations: AntiPatternViolation[] = [];
  for (const rule of activeRules) {
    const v = rule.check(html);
    if (v) violations.push(v);
  }
  return violations;
}
