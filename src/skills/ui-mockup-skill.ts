import type { Artifact, ThemePack } from '../types.js';
import { buildArtifact } from '../execution/skill-executor.js';
import { BaseSkill } from './base-skill.js';
import { renderMockupHtml } from './ui-mockup-renderer.js';
import type {
  MockupConfig,
  MockupFidelity,
  MockupPage,
  MockupPageTemplate,
  MockupSkillContext,
  MockupTheme,
  MockupViewport,
} from './ui-mockup-types.js';
import { buildPagesFromTemplate, inferPageTemplate } from './ui-mockup-page-templates.js';

export class UiMockupSkill extends BaseSkill<'ui-mockup', MockupSkillContext> {
  constructor() {
    super({
      name: 'ui-mockup',
      supportedTypes: ['ui-mockup'],
      description: 'UI mockup and wireframe generation with desktop/mobile viewports and lo-fi/hi-fi fidelity',
      triggerKeywords: [
        'mockup', 'wireframe', 'ui design', 'ui mockup', 'interface design',
        'prototype ui', 'page layout', 'screen design',
        '线框图', 'UI设计', 'UI 设计', 'UI模拟', '界面设计', '页面原型', '界面草图', '低保真', '高保真',
      ],
      supportedOutputs: ['html'],
      requiredContext: ['taskId'],
    });
  }

  async generate(
    input: string,
    theme: ThemePack,
    context: Record<string, unknown>,
  ): Promise<Artifact> {
    const ctx = this.toContext(context);
    const config = buildMockupConfig(input, ctx);
    const html = renderMockupHtml(config, theme);

    return buildArtifact(
      String(ctx.taskId ?? 'unknown'),
      'ui-mockup',
      html,
      config.pages.length,
      {
        viewport: config.viewport,
        fidelity: config.fidelity,
        themeMode: config.theme,
        pageCount: config.pages.length,
        qualityRules: this.getQualityRules(ctx),
      },
    );
  }
}

function buildMockupConfig(input: string, context: MockupSkillContext): MockupConfig {
  const explicit = (context.mockupConfig && typeof context.mockupConfig === 'object')
    ? context.mockupConfig as Partial<MockupConfig>
    : {};

  const viewport = isViewport(explicit.viewport) ? explicit.viewport
    : isViewport(context.viewport) ? context.viewport : inferViewport(input);
  const fidelity = isFidelity(explicit.fidelity) ? explicit.fidelity
    : isFidelity(context.fidelity) ? context.fidelity : inferFidelity(input);
  const themeMode = isMockupTheme(explicit.theme) ? explicit.theme
    : isMockupTheme(context.themeMode) ? context.themeMode : 'light';
  const title = normalizeText(explicit.title) || deriveTitle(input);
  const summary = normalizeText(explicit.summary) || deriveSummary(input, title);
  const pageTemplate = isPageTemplate(explicit.pageTemplate) ? explicit.pageTemplate
    : isPageTemplate(context.pageTemplate) ? context.pageTemplate : undefined;
  const pages = Array.isArray(explicit.pages) && explicit.pages.length > 0
    ? explicit.pages : buildDefaultPages(title, viewport, fidelity, pageTemplate);

  return { title, summary, pages, fidelity, theme: themeMode, viewport, pageTemplate };
}

function buildDefaultPages(title: string, viewport: MockupViewport, _fidelity: MockupFidelity, template?: MockupPageTemplate): MockupPage[] {
  const tpl = template ?? inferPageTemplate(title);
  return buildPagesFromTemplate(tpl, title, viewport);
}

function stripPromptPrefix(text: string): string {
  const prefixPattern = /^(?:请|帮我|帮忙)?(?:设计|制作|做|画|生成|创建)\s*(?:一[张个份幅]|)\s*/;
  let stripped = text.replace(prefixPattern, '').trim();
  stripped = stripped.replace(/(?:的\s*)?(?:UI\s*(?:线框图|mockup|模型)|线框图|mockup|界面草图|界面设计)/gi, '').trim();
  return stripped || text;
}

function deriveTitle(input: string): string {
  const compact = normalizeText(input) || 'UI Mockup';
  const semantic = stripPromptPrefix(compact);
  const clauses = semantic.split(/[\n:：|｜]/).map(p => p.trim()).filter(Boolean);
  const candidate = clauses[0] ?? compact;
  return candidate.length > 30 ? `${candidate.slice(0, 30)}…` : candidate;
}

function deriveSummary(input: string, title: string): string {
  const fallback = `围绕${title}展示页面结构、主要内容和关键操作。`;
  const compact = normalizeText(input);
  if (!compact || compact === title) return fallback;
  const semantic = stripPromptPrefix(compact);
  const candidate = semantic.replace(title, '').trim() || semantic;
  return candidate.length > 100 ? `${candidate.slice(0, 100)}…` : candidate;
}

function inferViewport(input: string): MockupViewport {
  if (/mobile|手机|移动端|app|小程序/.test(input.toLowerCase())) return 'mobile';
  return 'desktop';
}

function inferFidelity(input: string): MockupFidelity {
  const lower = input.toLowerCase();
  if (/lo-?fi|低保真|线框|wireframe|草图|sketch/.test(lower)) return 'low';
  if (/hi-?fi|高保真|精细|polished/.test(lower)) return 'high';
  return 'low';
}

function normalizeText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const compact = value.replace(/\s+/g, ' ').trim();
  return compact || undefined;
}

function isViewport(v: unknown): v is MockupViewport {
  return v === 'desktop' || v === 'mobile';
}

function isFidelity(v: unknown): v is MockupFidelity {
  return v === 'low' || v === 'high';
}

function isMockupTheme(v: unknown): v is MockupTheme {
  return v === 'light' || v === 'dark';
}

const VALID_PAGE_TEMPLATES = new Set([
  'generic', 'login', 'register', 'forgot-password', 'settings',
  'profile', 'product-list', 'product-detail', 'article-detail', 'dashboard',
]);

function isPageTemplate(v: unknown): v is MockupPageTemplate {
  return typeof v === 'string' && VALID_PAGE_TEMPLATES.has(v);
}

const uiMockupSkill = new UiMockupSkill();

export default uiMockupSkill;
