// PrototypeSkill — FR-B13 interactive HTML prototype generation
// Provides route / component / state templates and optional provider-based content fill.

import type { Artifact, ThemePack } from '../types.js';
import { buildArtifact } from '../execution/skill-executor.js';
import { BaseSkill } from './base-skill.js';
import { extractInputSpecifics } from '../utils.js';
import {
  PROTOTYPE_COMPONENT_TEMPLATE,
  PROTOTYPE_ROUTE_TEMPLATE,
  PROTOTYPE_STATE_TEMPLATE,
  renderPrototypeHtml,
} from './prototype-renderer.js';
import type {
  PrototypeConfig,
  PrototypeContentProvider,
  PrototypeEmptyStateSpec,
  PrototypeInteractionSpec,
  PrototypePageSpec,
  PrototypeProgressSpec,
  PrototypeProviderContext,
  PrototypeProviderResult,
  PrototypeSectionSpec,
  PrototypeSkillContext,
  PrototypeStatItem,
  PrototypeStyle,
  PrototypeTableSpec,
  PrototypeTheme,
  PrototypeTimelineItem,
} from './prototype-types.js';

export { PROTOTYPE_ROUTE_TEMPLATE, PROTOTYPE_COMPONENT_TEMPLATE, PROTOTYPE_STATE_TEMPLATE } from './prototype-renderer.js';

export class PrototypeSkill extends BaseSkill<'prototype', PrototypeSkillContext, PrototypeProviderContext['templates']> {
  readonly type = 'prototype';

  constructor() {
    super({
      name: 'prototype',
      supportedTypes: ['prototype'],
      description: 'Interactive HTML prototypes with navigation, modals, tab switching, toggle states and responsive layouts',
      triggerKeywords: [
        'prototype', 'interactive prototype', 'clickable prototype', 'interaction',
        '原型', '交互原型', '可点击', '交互', '跳转', '状态切换', '高保真',
        'hash router', 'router', 'routing', 'modal', 'tab',
      ],
      supportedOutputs: ['interactive-html'],
      requiredContext: ['taskId'],
      templates: {
        route: PROTOTYPE_ROUTE_TEMPLATE,
        component: PROTOTYPE_COMPONENT_TEMPLATE,
        state: PROTOTYPE_STATE_TEMPLATE,
      },
    });
  }

  async generate(
    input: string,
    theme: ThemePack,
    context: Record<string, unknown>,
  ): Promise<Artifact> {
    const typedContext = this.toContext(context);
    const seedConfig = buildSeedConfig(input, typedContext);
    const providerConfig = await this.requestProviderConfig(input, theme, typedContext, seedConfig);
    const config = mergePrototypeConfig(seedConfig, providerConfig, typedContext);
    const html = renderPrototypeHtml(config, theme);

    return buildArtifact(
      String(typedContext.taskId ?? 'unknown'),
      'prototype',
      html,
      config.pages.length,
      {
        exportProfile: 'html-only',
        style: config.style,
        themeMode: config.theme,
        pages: config.pages.map(page => page.name),
        defaultRoute: config.defaultPage,
        providerUsed: Boolean(providerConfig),
        templates: this.getTemplates(),
        qualityRules: this.getQualityRules(typedContext),
      },
    );
  }

  private async requestProviderConfig(
    input: string,
    themePack: ThemePack,
    context: PrototypeSkillContext,
    seedConfig: PrototypeConfig,
  ): Promise<PrototypeProviderResult | null> {
    const provider = this.resolveProvider<PrototypeContentProvider>(context, 'prototypeProvider', 'provider');
    if (!provider || typeof provider.generatePrototypePlan !== 'function') return null;

    const payload: PrototypeProviderContext = {
      input,
      themePack,
      seedConfig,
      prompt: buildProviderPrompt(input, seedConfig),
      templates: this.getTemplates(),
      metadata: context,
    };

    return provider.generatePrototypePlan(payload);
  }
}

function buildSeedConfig(input: string, context: PrototypeSkillContext): PrototypeConfig {
  const explicit = (context.prototypeConfig && typeof context.prototypeConfig === 'object')
    ? context.prototypeConfig
    : {};

  const style = isPrototypeStyle(explicit.style) ? explicit.style : inferStyle(input);
  const theme = isPrototypeTheme(explicit.theme)
    ? explicit.theme
    : (isPrototypeTheme(context.themeMode) ? context.themeMode : inferTheme(input));
  const pages = Array.isArray(explicit.pages) && explicit.pages.length > 0
    ? explicit.pages.map((page, index) => normalizePage(page, input, index))
    : buildPages(input);

  const title = normalizeText(explicit.title) || deriveTitle(input);
  const appName = normalizeText(explicit.appName) || title;
  const summary = normalizeText(explicit.summary) || normalizeSentence(stripPromptPrefix(input), '把核心流程做成可点击原型，方便快速演示。');

  return {
    title,
    summary,
    pages,
    style,
    theme,
    appName,
    defaultPage: normalizeText(explicit.defaultPage) || pages[0]?.name || 'home',
    footerNote: normalizeText(explicit.footerNote) || `© ${appName} 2026`,
    modalTitle: normalizeText(explicit.modalTitle) || `欢迎使用${title}`,
    modalBody: normalizeText(explicit.modalBody) || buildWelcomeModalBody(title, summary),
  };
}

function buildPages(input: string): PrototypePageSpec[] {
  const names = inferPageNames(input);
  return names.map((name, index) => buildPage(name, input, index));
}

function inferPageNames(input: string): string[] {
  const lower = input.toLowerCase();
  const pageCatalog: Array<{ name: string; matches: RegExp[] }> = [
    { name: 'home', matches: [/首页/, /home/, /主页/] },
    { name: 'detail', matches: [/详情/, /detail/, /商品详情/, /明细/] },
    { name: 'cart', matches: [/购物车/, /cart/, /结算前/] },
    { name: 'dashboard', matches: [/dashboard/, /仪表盘/, /看板/] },
    { name: 'settings', matches: [/设置/, /settings/] },
    { name: 'profile', matches: [/我的/, /个人中心/, /profile/, /账户/] },
    { name: 'checkout', matches: [/结算/, /checkout/, /支付/] },
    { name: 'login', matches: [/登录/, /login/, /注册/] },
  ];

  const matched = pageCatalog.filter(item => item.matches.some(pattern => pattern.test(lower))).map(item => item.name);
  if (matched.length >= 2) return unique(matched).slice(0, 4);

  return unique(['home', 'detail', /购物|电商|shop|store/.test(lower) ? 'cart' : 'dashboard']).slice(0, 4);
}

function buildPage(name: string, input: string, index: number): PrototypePageSpec {
  const title = pageTitle(name);
  const summary = `${title}聚焦${summarizeInput(input)}，支持跳转、状态切换和即时反馈。`;
  const sections = buildSections(name, input);
  const interactions = buildInteractions(name, sections, inferPageNames(input));

  return {
    name,
    title,
    summary,
    sections,
    interactions,
    path: `#/${name}`,
  };
}

function buildSections(name: string, input: string): PrototypeSectionSpec[] {
  const tone = summarizeInput(input);
  const infoSection: PrototypeSectionSpec = {
    id: `${name}-overview`,
    name: 'overview',
    title: `${pageTitle(name)} · 信息概览`,
    body: sectionBody(name, tone),
    cards: buildCards(name, tone),
  };

  const interactionSection: PrototypeSectionSpec = {
    id: `${name}-interaction`,
    name: 'interaction',
    title: `${pageTitle(name)} · 交互验证`,
    body: '通过模态框、标签切换和表单提交，把点击路径跑通。',
    tabs: buildTabs(name),
    formFields: buildFormFields(name),
  };

  const sections: PrototypeSectionSpec[] = [infoSection, interactionSection];

  // Add data display section for dashboard/detail pages
  if (name === 'dashboard' || name === 'detail') {
    sections.push({
      id: `${name}-data`,
      name: 'data-display',
      title: `${pageTitle(name)} · 数据展示`,
      body: '通过统计面板、表格和时间线展示结构化数据。',
      statsPanel: buildStatsPanel(name),
      table: buildTable(name),
      timeline: buildTimeline(name, input),
    });
  }

  // Add feedback section for pages with form interactions
  if (name === 'cart' || name === 'checkout' || name === 'settings') {
    sections.push({
      id: `${name}-feedback`,
      name: 'feedback',
      title: `${pageTitle(name)} · 反馈状态`,
      body: '进度指示、空状态和确认弹窗，覆盖关键反馈场景。',
      progressBar: buildProgressBar(name),
      emptyState: buildEmptyState(name),
    });
  }

  return sections;
}

function buildInteractions(name: string, sections: PrototypeSectionSpec[], allPages: string[]): PrototypeInteractionSpec[] {
  const interactionSection = sections.find(section => section.name === 'interaction');
  const firstTab = interactionSection?.tabs?.[1]?.key ?? interactionSection?.tabs?.[0]?.key ?? 'detail';
  const nextPage = allPages.find(page => page !== name) ?? 'home';

  return [
    {
      id: `${name}-open-modal`,
      type: 'modal',
      label: '查看详情',
      targetComponent: 'global-modal',
      modalId: 'global-modal',
    },
    {
      id: `${name}-switch-tab`,
      type: 'tab-switch',
      label: '切换视图',
      targetComponent: interactionSection ? `tabs-${interactionSection.id}` : undefined,
      stateValue: firstTab,
    },
    {
      id: `${name}-navigate`,
      type: 'navigate',
      label: name === 'home' ? '进入下一页' : '返回首页',
      targetPage: name === 'home' ? nextPage : 'home',
    },
    {
      id: `${name}-scroll`,
      type: 'scroll-to',
      label: '定位到交互区',
      targetSectionId: interactionSection?.id,
    },
  ];
}

function buildCards(name: string, tone: string) {
  const cardSets: Record<string, Array<{ title: string; body: string; badge?: string }>> = {
    home: [
      { title: '核心入口', body: `把${tone}拆成主导航、内容区和行动按钮，首屏直接说明价值。`, badge: undefined },
      { title: '推荐内容', body: '通过卡片承接高频操作，点击后跳到详情或下一步。', badge: undefined },
      { title: '状态提示', body: '页面内提供显式反馈，让用户知道当前停留位置和后续动作。', badge: undefined },
    ],
    detail: [
      { title: '内容摘要', body: `把${tone}的重点做成信息块，展开后展示更多上下文。`, badge: undefined },
      { title: '对比区域', body: '通过视图切换展示不同信息层，保持页面密度可控。', badge: undefined },
      { title: '操作面板', body: '在固定区域放下一步动作，演示流程更顺。', badge: undefined },
    ],
    cart: [
      { title: '待确认信息', body: '把用户已选内容和价格信息汇总到一屏，方便演示提交流程。', badge: undefined },
      { title: '优惠状态', body: '通过可折叠组件展示优惠、备注和异常提示。', badge: undefined },
      { title: '提交反馈', body: '表单提交后给出即时提示，不让用户停在空白状态。', badge: undefined },
    ],
    dashboard: [
      { title: '指标概览', body: '用摘要卡快速表达关键结论。', badge: undefined },
      { title: '趋势洞察', body: '提供可切换视图，便于看不同时间范围。', badge: undefined },
      { title: '异常处理', body: '异常提示通过欢迎弹窗呈现，减少页面噪音。', badge: undefined },
    ],
    settings: [
      { title: '偏好开关', body: '用切换控件承载布尔状态，点击后立即反馈。', badge: undefined },
      { title: '账号安全', body: '高风险项单独卡片展示，避免误操作。', badge: undefined },
      { title: '同步状态', body: '同步结果通过状态文案和颜色提醒。', badge: undefined },
    ],
    profile: [
      { title: '身份信息', body: '用户核心资料集中展示，入口清楚。', badge: undefined },
      { title: '历史记录', body: '历史卡片支持展开和收起。', badge: undefined },
      { title: '快捷动作', body: '把高频动作收束到操作条里。', badge: undefined },
    ],
    checkout: [
      { title: '支付方式', body: '支持切换不同支付方案，状态变化实时可见。', badge: undefined },
      { title: '地址确认', body: '表单聚焦下单关键字段。', badge: undefined },
      { title: '结果反馈', body: '提交后弹出确认层，保证闭环。', badge: undefined },
    ],
    login: [
      { title: '快速登录', body: '聚焦最短路径，减少输入负担。', badge: undefined },
      { title: '状态反馈', body: '验证码发送、倒计时和错误提示即时反馈。', badge: undefined },
      { title: '下一步引导', body: '登录成功后直接跳到核心页面。', badge: undefined },
    ],
  };

  return (cardSets[name] ?? cardSets.home).map(card => ({ ...card }));
}

function buildTabs(name: string) {
  return [
    { key: 'overview', label: '概要', body: `${pageTitle(name)}当前展示概要信息，适合首轮演示和快速过稿。` },
    { key: 'detail', label: '详情', body: '切换到详情视图后，可以展开更多流程说明和边界条件。' },
  ];
}

function buildFormFields(name: string) {
  if (name === 'cart' || name === 'checkout') {
    return [
      { label: '收货姓名', placeholder: '输入姓名', type: 'text' as const },
      { label: '联系方式', placeholder: '输入手机号', type: 'tel' as const },
      { label: '配送方式', placeholder: '请选择', type: 'select' as const, options: [
        { value: 'express', label: '快递配送' },
        { value: 'pickup', label: '到店自取' },
        { value: 'same-day', label: '当日达' },
      ] },
      { label: '期望送达日期', placeholder: '选择日期', type: 'date' as const },
    ];
  }
  if (name === 'login') {
    return [
      { label: '邮箱', placeholder: 'you@example.com', type: 'email' as const },
      { label: '验证码', placeholder: '输入验证码', type: 'text' as const },
    ];
  }
  if (name === 'settings') {
    return [
      { label: '显示名称', placeholder: '输入昵称', type: 'text' as const },
      { label: '语言偏好', placeholder: '请选择', type: 'select' as const, options: [
        { value: 'zh', label: '简体中文' },
        { value: 'en', label: 'English' },
        { value: 'ja', label: '日本語' },
      ] },
      { label: '头像上传', placeholder: '选择文件', type: 'file' as const },
      { label: '个人简介', placeholder: '介绍一下自己…', type: 'textarea' as const },
    ];
  }
  if (name === 'profile') {
    return [
      { label: '头像', placeholder: '选择图片', type: 'file' as const },
      { label: '个性签名', placeholder: '写点什么…', type: 'textarea' as const },
    ];
  }
  return [
    { label: '搜索关键词', placeholder: '输入你想看的内容', type: 'search' as const },
  ];
}

function buildStatsPanel(name: string): PrototypeStatItem[] {
  if (name === 'dashboard') {
    return [
      { label: '总用户', value: '待填充', change: undefined, changeType: 'positive' },
      { label: '活跃率', value: '待填充', change: undefined, changeType: 'positive' },
      { label: '转化率', value: '待填充', change: undefined, changeType: 'neutral' },
      { label: '平均时长', value: '待填充', change: undefined, changeType: 'positive' },
    ];
  }
  return [
    { label: '浏览量', value: '待填充', change: undefined, changeType: 'positive' },
    { label: '收藏数', value: '待填充', change: undefined, changeType: 'positive' },
  ];
}

function buildTable(name: string): PrototypeTableSpec {
  if (name === 'dashboard') {
    return {
      headers: ['名称', '状态', '数值', '趋势'],
      rows: [
        ['核心指标 A', '正常', '待填充', '持平'],
        ['核心指标 B', '关注', '待填充', '上升'],
        ['核心指标 C', '正常', '待填充', '稳定'],
      ],
    };
  }
  return {
    headers: ['属性', '值', '说明'],
    rows: [
      ['类型', '待填充', '由业务数据决定'],
      ['版本', '待填充', '当前版本信息'],
    ],
  };
}

function buildTimeline(name: string, input: string): PrototypeTimelineItem[] {
  const topic = summarizeInput(input);
  const specifics = extractInputSpecifics(input);
  const dateLabels = specifics.dates.length >= 3
    ? specifics.dates.slice(0, 3)
    : ['阶段 1', '阶段 2', '阶段 3'];

  if (name === 'dashboard') {
    return [
      { time: dateLabels[0], title: `确认${topic}`, description: `对齐${topic}的核心目标与页面结构`, status: 'done' },
      { time: dateLabels[1], title: `整理${topic}数据视图`, description: `把${topic}的重要信息收束到同一屏内`, status: 'active' },
      { time: dateLabels[2], title: `准备${topic}演示`, description: `补齐${topic}的说明文案和后续动作`, status: 'pending' },
    ];
  }
  return [
    { time: dateLabels[0], title: `梳理${topic}`, description: `确认${topic}的主要内容和页面目标`, status: 'done' },
    { time: dateLabels[1], title: `完善${pageTitle(name)}`, description: `补齐${topic}在当前页面的重点信息`, status: 'active' },
    { time: dateLabels[2], title: '等待下一步确认', description: `根据反馈继续细化${topic}的体验`, status: 'pending' },
  ];
}

function buildProgressBar(name: string): PrototypeProgressSpec {
  if (name === 'checkout') return { label: '支付处理中', value: 75, max: 100 };
  if (name === 'cart') return { label: '满减进度', value: 180, max: 200 };
  return { label: '完成度', value: 60, max: 100 };
}

function buildEmptyState(name: string): PrototypeEmptyStateSpec {
  if (name === 'cart') return { title: '购物车是空的', description: '去逛逛，发现好物吧', actionLabel: '去首页', icon: '🛒' };
  if (name === 'settings') return { title: '暂无自定义配置', description: '系统使用默认设置', icon: '⚙️' };
  return { title: '暂无数据', description: '稍后再来看看', icon: '📭' };
}

function mergePrototypeConfig(
  seed: PrototypeConfig,
  incoming: PrototypeProviderResult | null,
  context: PrototypeSkillContext,
): PrototypeConfig {
  if (!incoming) return applyExplicitOverrides(seed, context.prototypeConfig);

  const providerPages = Array.isArray(incoming.pages)
    ? incoming.pages.map((page, index) => normalizePage(page, incoming.summary ?? incoming.title ?? seed.summary, index))
    : seed.pages;

  return applyExplicitOverrides({
    ...seed,
    ...pickDefined(incoming, ['title', 'summary', 'style', 'theme', 'appName', 'defaultPage', 'footerNote', 'modalTitle', 'modalBody']),
    pages: providerPages,
  }, context.prototypeConfig);
}

function applyExplicitOverrides(config: PrototypeConfig, explicit?: Partial<PrototypeConfig>): PrototypeConfig {
  if (!explicit) return config;

  return {
    ...config,
    ...pickDefined(explicit, ['title', 'summary', 'style', 'theme', 'appName', 'defaultPage', 'footerNote', 'modalTitle', 'modalBody', 'navVariant']),
    pages: Array.isArray(explicit.pages) && explicit.pages.length > 0
      ? explicit.pages.map((page, index) => normalizePage(page, config.summary, index))
      : config.pages,
  };
}

function normalizePage(page: Partial<PrototypePageSpec>, input: string, index: number): PrototypePageSpec {
  const name = normalizeText(page.name) || inferPageNames(input)[index] || `page-${index + 1}`;
  const base = buildPage(name, input, index);
  const sections = Array.isArray(page.sections) && page.sections.length > 0
    ? page.sections.map((section, sectionIndex) => normalizeSection(section, name, sectionIndex))
    : base.sections;
  const interactions = Array.isArray(page.interactions) && page.interactions.length > 0
    ? page.interactions.map((interaction, interactionIndex) => normalizeInteraction(interaction, sections, name, interactionIndex))
    : buildInteractions(name, sections, inferPageNames(input));

  return {
    ...base,
    ...page,
    name,
    title: normalizeText(page.title) || base.title,
    summary: normalizeText(page.summary) || base.summary,
    sections,
    interactions,
    path: normalizeText(page.path) || `#/${name}`,
  };
}

function normalizeSection(section: Partial<PrototypeSectionSpec>, pageName: string, index: number): PrototypeSectionSpec {
  const name = normalizeText(section.name) || `section-${index + 1}`;
  return {
    id: normalizeText(section.id) || `${pageName}-${name}`,
    name,
    title: normalizeText(section.title) || '交互区块',
    body: normalizeText(section.body),
    cards: Array.isArray(section.cards)
      ? section.cards.map(card => ({
        title: normalizeText(card.title) || '信息卡片',
        body: normalizeText(card.body) || '补充说明待完善',
        badge: normalizeText(card.badge),
      }))
      : undefined,
    formFields: Array.isArray(section.formFields)
      ? section.formFields.map(field => ({
        label: normalizeText(field.label) || '输入项',
        placeholder: normalizeText(field.placeholder) || '请输入',
        type: field.type ?? 'text',
        options: Array.isArray(field.options) ? field.options : undefined,
      }))
      : undefined,
    tabs: Array.isArray(section.tabs)
      ? section.tabs.map((tab, tabIndex) => ({
        key: normalizeText(tab.key) || `tab-${tabIndex + 1}`,
        label: normalizeText(tab.label) || '标签',
        body: normalizeText(tab.body) || '标签内容待补充',
      }))
      : undefined,
    timeline: Array.isArray(section.timeline) ? section.timeline : undefined,
    statsPanel: Array.isArray(section.statsPanel) ? section.statsPanel : undefined,
    table: section.table ?? undefined,
    emptyState: section.emptyState ?? undefined,
    progressBar: section.progressBar ?? undefined,
  };
}

function normalizeInteraction(
  interaction: Partial<PrototypeInteractionSpec>,
  sections: PrototypeSectionSpec[],
  pageName: string,
  index: number,
): PrototypeInteractionSpec {
  return {
    id: normalizeText(interaction.id) || `${pageName}-interaction-${index + 1}`,
    type: interaction.type ?? 'toggle',
    label: normalizeText(interaction.label) || '触发交互',
    targetPage: normalizeText(interaction.targetPage),
    targetSectionId: normalizeText(interaction.targetSectionId) || sections[0]?.id,
    targetComponent: normalizeText(interaction.targetComponent),
    stateValue: normalizeText(interaction.stateValue),
    modalId: normalizeText(interaction.modalId),
  };
}

function buildWelcomeModalBody(title: string, summary: string): string {
  return `${title} 已准备好展示核心页面与关键操作，你可以从这里快速浏览重点内容。${summary}`;
}

function buildProviderPrompt(input: string, seedConfig: PrototypeConfig): string {
  return [
    '你在补全一个交互原型计划。',
    '保持单文件 HTML、hash router、多页面、data-state、事件委托、响应式布局。',
    '优先补充页面标题、摘要、区块内容、交互按钮、表单字段。',
    `用户需求：${input}`,
    `默认页面：${seedConfig.defaultPage}`,
    `已推断页面：${seedConfig.pages.map(page => page.name).join(', ')}`,
    '返回 JSON 兼容的结构化结果。',
  ].join('\n');
}

function pageTitle(name: string): string {
  const titles: Record<string, string> = {
    home: '总览首页',
    detail: '详情视图',
    cart: '确认与提交',
    dashboard: '数据总览',
    settings: '配置中心',
    profile: '个人中心',
    checkout: '支付确认',
    login: '登录入口',
  };
  return titles[name] ?? '页面视图';
}

function sectionBody(name: string, tone: string): string {
  const descriptions: Record<string, string> = {
    home: `把${tone}拆成导航、推荐内容和行动入口，便于首屏验证。`,
    detail: `围绕${tone}补足上下文、状态切换和下一步动作。`,
    cart: '把确认信息、优惠状态和提交流程收束到同一页。',
    dashboard: '通过指标、趋势和异常提示验证信息密度。',
    settings: '用开关和状态提示验证配置反馈。',
    profile: '展示身份信息、历史记录和快捷动作。',
    checkout: '把支付、地址和完成反馈串成闭环。',
    login: '验证验证码、错误提示和成功跳转。',
  };
  return descriptions[name] ?? `围绕${tone}验证信息层级和点击反馈。`;
}

function stripPromptPrefix(text: string): string {
  const prefixPattern = /^(?:请|帮我|帮忙)?(?:设计|制作|做|画|生成|创建)\s*(?:一[张个份幅]|)\s*/;
  let stripped = text.replace(prefixPattern, '').trim();
  stripped = stripped.replace(/(?:的\s*)?(?:交互原型|原型|prototype|可点击原型|高保真原型)/gi, '').trim();
  return stripped || text;
}

function extractTopicFromInput(semantic: string): string {
  return semantic.split(/[，,]|(?:包含|包括|含)/)[0]?.trim() || semantic;
}

function deriveTitle(input: string): string {
  const cleaned = input.replace(/\s+/g, ' ').trim();
  if (!cleaned) return 'Interactive Prototype';
  const semantic = stripPromptPrefix(cleaned);
  const topic = extractTopicFromInput(semantic);
  return `${topic.slice(0, 28)}${topic.length > 28 ? '…' : ''} 原型`;
}

function summarizeInput(input: string): string {
  const compact = input.replace(/\s+/g, ' ').trim();
  if (!compact) return '核心业务';
  const semantic = stripPromptPrefix(compact);
  const topic = extractTopicFromInput(semantic);
  return topic.length > 20 ? `${topic.slice(0, 20)}…` : topic;
}

function normalizeSentence(text: string, fallback: string): string {
  const compact = text.replace(/\s+/g, ' ').trim();
  return compact ? compact : fallback;
}

function normalizeText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function inferStyle(input: string): PrototypeStyle {
  const lower = input.toLowerCase();
  if (/wireframe|线框|低保真/.test(lower)) return 'wireframe';
  if (/material|material design|安卓/.test(lower)) return 'material';
  return 'minimal';
}

function inferTheme(input: string): PrototypeTheme {
  const lower = input.toLowerCase();
  return /dark|暗色|深色|夜间/.test(lower) ? 'dark' : 'light';
}

function isPrototypeStyle(value: unknown): value is PrototypeStyle {
  return value === 'minimal' || value === 'material' || value === 'wireframe';
}

function isPrototypeTheme(value: unknown): value is PrototypeTheme {
  return value === 'light' || value === 'dark';
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function pickDefined<T extends object, K extends keyof T>(source: T, keys: K[]): Partial<Pick<T, K>> {
  const next: Partial<Pick<T, K>> = {};
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined) {
      next[key] = value;
    }
  }
  return next;
}

const prototypeSkill = new PrototypeSkill();

export default prototypeSkill;
