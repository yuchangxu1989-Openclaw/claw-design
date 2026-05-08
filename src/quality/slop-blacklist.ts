// FR-D09: Global Slop Blacklist — AI-generated visual anti-pattern rules
// Rules are data-only; detection logic lives in slop-checker.ts

export type SlopSeverity = 'block' | 'warn';

/** A single violation found by a Slop rule */
export interface SlopViolation {
  ruleId: string;
  ruleName: string;
  severity: SlopSeverity;
  message: string;
  /** CSS selector or description of the offending location */
  location?: string;
}

/** Slop rule definition (AC1: id + name + description + detection + severity) */
export interface SlopRule {
  id: string;
  name: string;
  description: string;
  /** Human-readable detection logic description */
  detection: string;
  severity: SlopSeverity;
  /** Automated detection function: receives HTML string, returns violations */
  detect: (html: string) => SlopViolation[];
}

// ── Helper utilities for detection functions ──

function countMatches(html: string, pattern: RegExp): number {
  const matches = html.match(pattern);
  return matches ? matches.length : 0;
}

function makeViolation(rule: Pick<SlopRule, 'id' | 'name' | 'severity'>, message: string, location?: string): SlopViolation {
  return { ruleId: rule.id, ruleName: rule.name, severity: rule.severity, message, location };
}

// ── Built-in Slop Rules (AC2: 20 rules covering AI visual anti-patterns) ──

export const BUILTIN_SLOP_RULES: SlopRule[] = [
  {
    id: 'generic-purple-gradient',
    name: 'Generic Purple Gradient',
    description: '紫蓝渐变背景（purple-to-blue / purple-to-pink linear-gradient 作为大面积背景）。',
    detection: 'Detect linear-gradient declarations containing purple/violet hues (#800080-#9400D3 range or named purple/violet) combined with blue or pink as background or background-image on body, section, or div elements.',
    severity: 'block',
    detect(html: string): SlopViolation[] {
      // Match linear-gradient with purple/violet combined with blue/pink
      const pattern = /linear-gradient\s*\([^)]*(?:purple|violet|#[89a-f][0-4][0-9a-f]{4}|rgb\s*\(\s*1[2-9]\d|rgb\s*\(\s*[89]\d)[^)]*(?:blue|pink|#[0-4][0-4][8-f][a-f]|#f[0-9a-f]{2}[0-9a-f](?:c|d|e|f))[^)]*\)/gi;
      const matches = html.match(pattern);
      if (matches && matches.length > 0) {
        return [makeViolation(this, `Found ${matches.length} purple gradient declaration(s)`, 'background/background-image')];
      }
      // Also check for common AI-generated purple gradient patterns
      const namedPattern = /(?:background|background-image)\s*:\s*[^;]*linear-gradient\s*\([^)]*(?:#[6-9a-f][0-3][0-9a-f]{4})[^)]*(?:#[0-5][0-5][8-f][a-f]{3})[^)]*\)/gi;
      const namedMatches = html.match(namedPattern);
      if (namedMatches && namedMatches.length > 0) {
        return [makeViolation(this, `Found ${namedMatches.length} purple-to-blue gradient(s)`, 'background')];
      }
      return [];
    },
  },
  {
    id: 'emoji-as-icon',
    name: 'Emoji as Icon',
    description: '用通用 emoji 字符代替专业 SVG/icon-font 图标。',
    detection: 'Detect sequences of 3+ emoji characters (Unicode emoji ranges) used as content, or emoji inside heading/button/nav elements suggesting icon usage.',
    severity: 'block',
    detect(html: string): SlopViolation[] {
      // Match 3+ consecutive emoji characters (common emoji ranges)
      const emojiPattern = /(?:[\u{1F300}-\u{1F9FF}][\u{FE0F}\u{200D}]?){3,}/gu;
      const matches = html.match(emojiPattern);
      if (matches && matches.length > 0) {
        return [makeViolation(this, `Found ${matches.length} cluster(s) of 3+ consecutive emoji characters`, 'content')];
      }
      return [];
    },
  },
  {
    id: 'inter-as-display',
    name: 'Inter as Display Font',
    description: 'Inter 字体用作标题或展示字体（Inter 只适合 body text）。',
    detection: 'Detect font-family declarations containing "Inter" applied to h1-h6, .title, .heading, .display, or elements with font-size >= 24px.',
    severity: 'block',
    detect(html: string): SlopViolation[] {
      // Check if Inter is used in heading styles
      const headingWithInter = /<(?:h[1-6])[^>]*style\s*=\s*"[^"]*font-family[^"]*Inter[^"]*"/gi;
      const styleBlockPattern = /(?:h[1-6]|\.heading|\.title|\.display|\.hero)[^{]*\{[^}]*font-family[^}]*Inter/gi;
      const violations: SlopViolation[] = [];
      const inlineMatches = html.match(headingWithInter);
      if (inlineMatches && inlineMatches.length > 0) {
        violations.push(makeViolation(this, `Inter font used on ${inlineMatches.length} heading element(s)`, 'h1-h6 inline style'));
      }
      const blockMatches = html.match(styleBlockPattern);
      if (blockMatches && blockMatches.length > 0) {
        violations.push(makeViolation(this, `Inter font declared for heading/display selectors in style block`, 'style block'));
      }
      return violations;
    },
  },
  {
    id: 'hand-drawn-faces',
    name: 'Hand-drawn Faces',
    description: '手绘风格 SVG 真人脸或通用人物插画。',
    detection: 'Detect SVG elements containing path data with face-related class names (face, avatar, person, character) or inline SVGs with circle+path combinations suggesting simplified face illustrations.',
    severity: 'block',
    detect(html: string): SlopViolation[] {
      const pattern = /<svg[^>]*(?:class|id)\s*=\s*"[^"]*(?:face|avatar|person|character|illustration)[^"]*"[^>]*>[\s\S]*?<\/svg>/gi;
      const matches = html.match(pattern);
      if (matches && matches.length > 0) {
        return [makeViolation(this, `Found ${matches.length} SVG element(s) with face/avatar/person class names`, 'svg')];
      }
      return [];
    },
  },
  {
    id: 'fabricated-data',
    name: 'Fabricated Data',
    description: '编造统计数字或百分比（没有真实数据源时应使用破折号或标注"示例数据"）。',
    detection: 'Detect common fabricated metric patterns: "N+ users", "N% uptime", "Nx faster", "$NM revenue" without data-source attribution or "示例" marker.',
    severity: 'block',
    detect(html: string): SlopViolation[] {
      const patterns = [
        /\b\d+[KkMm]\+?\s*(?:users?|customers?|clients?|downloads?|installs?)\b/gi,
        /\b(?:99\.?\d*|100)%\s*(?:uptime|accuracy|satisfaction|reliability)\b/gi,
        /\b\d+[xX]\s*(?:faster|better|more efficient|improvement)\b/gi,
        /\$\d+[MmBbKk]\+?\s*(?:revenue|saved|raised|ARR|MRR)\b/gi,
      ];
      const violations: SlopViolation[] = [];
      for (const pattern of patterns) {
        const matches = html.match(pattern);
        if (matches && matches.length > 0) {
          // Check if there's a data-source or 示例 marker nearby
          const hasAttribution = /data-source|data-attribution|示例数据|example data/i.test(html);
          if (!hasAttribution) {
            violations.push(makeViolation(this, `Fabricated metric: "${matches[0]}" (and ${matches.length - 1} more) without data source`, 'content'));
          }
        }
      }
      return violations;
    },
  },
  {
    id: 'stock-photo-description',
    name: 'Stock Photo Description',
    description: '在 img alt 或注释中使用通用 stock photo 风格描述。',
    detection: 'Detect img alt text or HTML comments containing stock photo clichés: "happy diverse team", "modern office", "business meeting", "professional woman smiling".',
    severity: 'block',
    detect(html: string): SlopViolation[] {
      const stockPhrases = [
        /happy\s+(?:diverse\s+)?team/i,
        /(?:modern|bright)\s+office/i,
        /business\s+(?:meeting|people)/i,
        /professional\s+(?:woman|man|person)\s+smiling/i,
        /diverse\s+group\s+of\s+(?:people|professionals)/i,
        /team\s+(?:collaboration|working\s+together)/i,
      ];
      const altTexts = html.match(/alt\s*=\s*"([^"]*)"/gi) ?? [];
      const violations: SlopViolation[] = [];
      for (const alt of altTexts) {
        for (const phrase of stockPhrases) {
          if (phrase.test(alt)) {
            violations.push(makeViolation(this, `Stock photo description in alt text: "${alt}"`, 'img alt'));
            break;
          }
        }
      }
      return violations;
    },
  },
  {
    id: 'lorem-ipsum',
    name: 'Lorem Ipsum',
    description: '残留 Lorem ipsum、placeholder text 或明显占位文本。',
    detection: 'Detect "Lorem ipsum", "dolor sit amet", "consectetur adipiscing", or common placeholder markers in visible text content.',
    severity: 'block',
    detect(html: string): SlopViolation[] {
      const patterns = [
        /lorem\s+ipsum/i,
        /dolor\s+sit\s+amet/i,
        /consectetur\s+adipiscing/i,
        /sed\s+do\s+eiusmod/i,
      ];
      for (const pattern of patterns) {
        if (pattern.test(html)) {
          return [makeViolation(this, 'Lorem ipsum placeholder text detected', 'content')];
        }
      }
      return [];
    },
  },
  {
    id: 'excessive-drop-shadow',
    name: 'Excessive Drop Shadow',
    description: '同一页面超过 3 个元素使用 drop-shadow 且参数相同。',
    detection: 'Count elements with box-shadow or drop-shadow declarations. Flag when more than 3 elements share identical shadow parameters.',
    severity: 'block',
    detect(html: string): SlopViolation[] {
      // Extract all shadow declarations
      const shadowPattern = /(?:box-shadow|filter\s*:[^;]*drop-shadow)\s*:\s*([^;}"]+)/gi;
      const shadows: string[] = [];
      let match: RegExpExecArray | null;
      while ((match = shadowPattern.exec(html)) !== null) {
        shadows.push(match[1].trim().toLowerCase());
      }
      // Count duplicates
      const counts = new Map<string, number>();
      for (const s of shadows) {
        counts.set(s, (counts.get(s) ?? 0) + 1);
      }
      for (const [shadow, count] of counts) {
        if (count > 3) {
          return [makeViolation(this, `${count} elements share identical shadow: "${shadow}"`, 'box-shadow/drop-shadow')];
        }
      }
      return [];
    },
  },
  {
    id: 'all-pill-buttons',
    name: 'All Pill Buttons',
    description: '页面中所有按钮都是全圆角药丸形（border-radius ≥ 999px 或 50%）。',
    detection: 'Find all button/a.btn elements and check if ALL of them have border-radius >= 999px or 50%. Flag only when there are 2+ buttons and zero non-pill variants.',
    severity: 'block',
    detect(html: string): SlopViolation[] {
      // Find button-related elements with border-radius
      const buttonPattern = /<(?:button|a)[^>]*style\s*=\s*"[^"]*border-radius\s*:\s*([^;"]+)/gi;
      const pillValues: number[] = [];
      const nonPillCount = { value: 0 };
      let btnMatch: RegExpExecArray | null;
      while ((btnMatch = buttonPattern.exec(html)) !== null) {
        const val = btnMatch[1].trim();
        if (/(?:999|1000|9999)\s*px|50\s*%/.test(val)) {
          pillValues.push(1);
        } else {
          nonPillCount.value++;
        }
      }
      // Also check style blocks for button selectors
      const styleBlockBtnPattern = /(?:button|\.btn|\.button|a\.btn)[^{]*\{[^}]*border-radius\s*:\s*(?:999|1000|9999)\s*px|50\s*%/gi;
      const styleMatches = html.match(styleBlockBtnPattern);
      if (styleMatches && styleMatches.length > 0 && nonPillCount.value === 0) {
        return [makeViolation(this, 'All buttons use pill shape (border-radius >= 999px) with no variation', 'button styles')];
      }
      if (pillValues.length >= 2 && nonPillCount.value === 0) {
        return [makeViolation(this, `All ${pillValues.length} buttons are pill-shaped with no variation`, 'button inline styles')];
      }
      return [];
    },
  },
  {
    id: 'uniform-card-grid',
    name: 'Uniform Card Grid',
    description: '页面主体内容区仅由相同尺寸的卡片网格组成，无视觉层级变化。',
    detection: 'Detect grid/flex containers where all direct children have identical dimensions (same width, height, padding) and there are 4+ cards with no size variation.',
    severity: 'block',
    detect(html: string): SlopViolation[] {
      // Look for repeated card patterns with identical classes
      const cardPattern = /<div[^>]*class\s*=\s*"([^"]*card[^"]*)"[^>]*>/gi;
      const cardClasses: string[] = [];
      let cardMatch: RegExpExecArray | null;
      while ((cardMatch = cardPattern.exec(html)) !== null) {
        cardClasses.push(cardMatch[1].trim());
      }
      if (cardClasses.length >= 4) {
        const unique = new Set(cardClasses);
        if (unique.size === 1) {
          return [makeViolation(this, `${cardClasses.length} cards with identical class "${cardClasses[0]}" — no visual hierarchy`, 'card grid')];
        }
      }
      return [];
    },
  },
  {
    id: 'glassmorphism-overuse',
    name: 'Glassmorphism Overuse',
    description: '超过 2 个容器同时使用 backdrop-filter: blur + 半透明背景。',
    detection: 'Count elements with backdrop-filter containing blur(). Flag when count exceeds 2.',
    severity: 'block',
    detect(html: string): SlopViolation[] {
      const pattern = /backdrop-filter\s*:\s*[^;]*blur\s*\(/gi;
      const count = countMatches(html, pattern);
      if (count > 2) {
        return [makeViolation(this, `${count} elements use backdrop-filter: blur (max 2 allowed)`, 'backdrop-filter')];
      }
      return [];
    },
  },
  {
    id: 'generic-gradient-blob',
    name: 'Generic Gradient Blob',
    description: '使用大面积模糊渐变色块（blob）作为纯装饰背景元素。',
    detection: 'Detect absolutely/fixed positioned elements with large border-radius (50%+), gradient background, and filter: blur — the classic AI decorative blob pattern.',
    severity: 'block',
    detect(html: string): SlopViolation[] {
      // Look for blob-like patterns: position absolute/fixed + large blur + gradient + border-radius
      const blobPattern = /(?:position\s*:\s*(?:absolute|fixed))[^}]*(?:border-radius\s*:\s*(?:50%|9999px|100%))[^}]*(?:filter\s*:[^;]*blur|background[^;]*gradient)/gi;
      const blobPattern2 = /(?:class|id)\s*=\s*"[^"]*(?:blob|decoration|ornament|bg-shape)[^"]*"/gi;
      const matches1 = html.match(blobPattern);
      const matches2 = html.match(blobPattern2);
      const total = (matches1?.length ?? 0) + (matches2?.length ?? 0);
      if (total > 0) {
        return [makeViolation(this, `Found ${total} decorative gradient blob element(s)`, 'decorative elements')];
      }
      return [];
    },
  },
  {
    id: 'centered-everything',
    name: 'Centered Everything',
    description: '页面所有内容块均居中对齐（text-align: center），无左对齐或层级变化。',
    detection: 'Count text-align: center declarations vs other alignments. Flag when center is used on 5+ elements and no left/right/justify alignment exists.',
    severity: 'warn',
    detect(html: string): SlopViolation[] {
      const centerCount = countMatches(html, /text-align\s*:\s*center/gi);
      const otherAlign = countMatches(html, /text-align\s*:\s*(?:left|right|justify|start|end)/gi);
      if (centerCount >= 5 && otherAlign === 0) {
        return [makeViolation(this, `All ${centerCount} text-align declarations are center — no alignment variation`, 'text-align')];
      }
      return [];
    },
  },
  {
    id: 'generic-isometric-illustration',
    name: 'Generic Isometric Illustration',
    description: '使用通用等距（isometric）插画风格作为主视觉。',
    detection: 'Detect SVG or img elements with class/alt/src containing "isometric" or transform matrices suggesting isometric projection (skewX/skewY 30deg patterns).',
    severity: 'warn',
    detect(html: string): SlopViolation[] {
      const pattern = /(?:class|alt|src|id)\s*=\s*"[^"]*isometric[^"]*"/gi;
      const matches = html.match(pattern);
      if (matches && matches.length > 0) {
        return [makeViolation(this, `Found ${matches.length} isometric illustration reference(s)`, 'img/svg')];
      }
      return [];
    },
  },
  {
    id: 'excessive-border-radius',
    name: 'Excessive Border Radius',
    description: '所有容器元素统一使用 ≥ 16px 大圆角，无圆角层级区分。',
    detection: 'Extract all border-radius values. Flag when 5+ elements use >= 16px radius and no element uses a smaller radius (indicating no hierarchy).',
    severity: 'warn',
    detect(html: string): SlopViolation[] {
      const radiusPattern = /border-radius\s*:\s*(\d+)\s*px/gi;
      let large = 0;
      let small = 0;
      let m: RegExpExecArray | null;
      while ((m = radiusPattern.exec(html)) !== null) {
        const val = parseInt(m[1], 10);
        if (val >= 16) large++;
        else if (val > 0) small++;
      }
      if (large >= 5 && small === 0) {
        return [makeViolation(this, `${large} elements use border-radius >= 16px with no smaller radius variation`, 'border-radius')];
      }
      return [];
    },
  },
  {
    id: 'dark-neon-combo',
    name: 'Dark + Neon Combo',
    description: '深色背景搭配霓虹色（高饱和度亮色）文字或边框作为主视觉风格。',
    detection: 'Detect dark background colors (#000-#333 or rgb 0-51) combined with high-saturation bright colors (#0ff, #0f0, #f0f, etc.) for text or borders.',
    severity: 'warn',
    detect(html: string): SlopViolation[] {
      const darkBg = /background(?:-color)?\s*:\s*(?:#[0-3][0-3][0-3]|#[0-2][0-2][0-2][0-2][0-2][0-2]|rgb\s*\(\s*[0-4]\d\s*,\s*[0-4]\d\s*,\s*[0-4]\d)/gi;
      const neonColor = /(?:color|border(?:-color)?)\s*:\s*(?:#[0f][0f][0f]{1,2}|#(?:0ff|f0f|0f0|ff0)|rgb\s*\(\s*(?:0|255)\s*,\s*(?:0|255)\s*,\s*(?:0|255))/gi;
      const hasDark = darkBg.test(html);
      const hasNeon = neonColor.test(html);
      if (hasDark && hasNeon) {
        return [makeViolation(this, 'Dark background with neon-colored text/borders detected', 'color scheme')];
      }
      return [];
    },
  },
  {
    id: 'generic-hero-layout',
    name: 'Generic Hero Layout',
    description: 'hero section 采用"大标题 + 副标题 + 单个 CTA 按钮垂直居中"的千篇一律布局。',
    detection: 'Detect a section/div with hero-related class containing exactly: one h1, one p/subtitle, one button/CTA, all centered — the most common AI-generated hero pattern.',
    severity: 'warn',
    detect(html: string): SlopViolation[] {
      // Look for hero sections with the generic pattern
      const heroPattern = /(<(?:section|div)[^>]*(?:class|id)\s*=\s*"[^"]*hero[^"]*"[^>]*>)([\s\S]*?)<\/(?:section|div)>/gi;
      let heroMatch: RegExpExecArray | null;
      while ((heroMatch = heroPattern.exec(html)) !== null) {
        const openTag = heroMatch[1];
        const content = heroMatch[2];
        const fullBlock = openTag + content;
        const hasH1 = /<h1[^>]*>/.test(content);
        const hasSubtitle = /<(?:p|span)[^>]*(?:class\s*=\s*"[^"]*(?:subtitle|sub|desc)[^"]*")?[^>]*>/.test(content);
        const hasButton = /<(?:button|a)[^>]*(?:class\s*=\s*"[^"]*(?:btn|cta|button)[^"]*")?[^>]*>/.test(content);
        const isCentered = /text-align\s*:\s*center|items-center|justify-center|mx-auto/i.test(fullBlock);
        if (hasH1 && hasSubtitle && hasButton && isCentered) {
          return [makeViolation(this, 'Generic hero layout: centered h1 + subtitle + CTA button', 'hero section')];
        }
      }
      return [];
    },
  },
  {
    id: 'gradient-text-overuse',
    name: 'Gradient Text Overuse',
    description: '超过 2 处文字使用 background-clip: text + 渐变色效果。',
    detection: 'Count occurrences of -webkit-background-clip: text or background-clip: text combined with gradient. Flag when count > 2.',
    severity: 'block',
    detect(html: string): SlopViolation[] {
      const pattern = /(?:-webkit-)?background-clip\s*:\s*text/gi;
      const count = countMatches(html, pattern);
      if (count > 2) {
        return [makeViolation(this, `${count} elements use gradient text effect (max 2 allowed)`, 'background-clip: text')];
      }
      return [];
    },
  },
  {
    id: 'generic-testimonial-cards',
    name: 'Generic Testimonial Cards',
    description: '三列等宽推荐语卡片（头像 + 引言 + 姓名），无设计差异化。',
    detection: 'Detect 3+ sibling elements each containing an img/avatar + blockquote/quote + name/author pattern with identical structure.',
    severity: 'warn',
    detect(html: string): SlopViolation[] {
      // Look for testimonial patterns
      const testimonialPattern = /<(?:div|article)[^>]*class\s*=\s*"[^"]*(?:testimonial|review|quote)[^"]*"[^>]*>/gi;
      const matches = html.match(testimonialPattern);
      if (matches && matches.length >= 3) {
        // Check if they all have the same class (uniform)
        const classes = matches.map(m => {
          const classMatch = /class\s*=\s*"([^"]*)"/.exec(m);
          return classMatch ? classMatch[1] : '';
        });
        const unique = new Set(classes);
        if (unique.size === 1) {
          return [makeViolation(this, `${matches.length} identical testimonial cards with no design variation`, 'testimonial section')];
        }
      }
      return [];
    },
  },
  {
    id: 'ai-avatar-placeholder',
    name: 'AI Avatar Placeholder',
    description: '使用 AI 生成的通用人物头像或圆形纯色占位头像。',
    detection: 'Detect img elements with avatar-related classes and generic src patterns (placeholder services, single-color backgrounds) or circular divs with background-color used as avatar placeholders.',
    severity: 'warn',
    detect(html: string): SlopViolation[] {
      const violations: SlopViolation[] = [];
      // Placeholder avatar services
      const placeholderSrc = /(?:src|href)\s*=\s*"[^"]*(?:ui-avatars\.com|placeholder\.com|placehold\.co|pravatar|robohash|dicebear|boring-avatars)[^"]*"/gi;
      const placeholderMatches = html.match(placeholderSrc);
      if (placeholderMatches && placeholderMatches.length > 0) {
        violations.push(makeViolation(this, `${placeholderMatches.length} placeholder avatar service URL(s) detected`, 'img src'));
      }
      // Circular colored divs as avatar placeholders
      const circleAvatar = /<div[^>]*class\s*=\s*"[^"]*avatar[^"]*"[^>]*style\s*=\s*"[^"]*(?:border-radius\s*:\s*50%|border-radius\s*:\s*9999px)[^"]*background-color[^"]*"/gi;
      const circleMatches = html.match(circleAvatar);
      if (circleMatches && circleMatches.length > 0) {
        violations.push(makeViolation(this, `${circleMatches.length} circular color-block avatar placeholder(s)`, 'avatar div'));
      }
      return violations;
    },
  },
];
