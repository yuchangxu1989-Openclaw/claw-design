import { describe, expect, it } from 'vitest';
import prototypeSkill, { PrototypeSkill } from '../../src/skills/prototype-skill.js';
import { renderPrototypeHtml } from '../../src/skills/prototype-renderer.js';
import { SkillRegistry } from '../../src/skills/skill-registry.js';
import type { ThemePack } from '../../src/types.js';
import {
  checkAllClarificationRules,
  checkNavigationLinkValidity,
  checkRouteTableDomConsistency,
} from '../../src/quality/clarification-quality-rules.js';
import type { PrototypeConfig, PrototypeStyle } from '../../src/skills/prototype-types.js';

const theme: ThemePack = {
  colorPrimary: '#3366ff',
  colorBg: '#ffffff',
  fontHeading: 'Heading',
  fontBody: 'Body',
  spacingUnit: '8px',
  radius: '12px',
  cssVariables: {
    '--cd-color-primary': '#3366ff',
    '--cd-color-bg': '#ffffff',
    '--cd-font-heading': 'Heading',
    '--cd-font-body': 'Body',
    '--cd-radius': '12px',
  },
};

describe('PrototypeSkill', () => {
  it('publishes base-skill metadata through the shared contract', () => {
    const skill = new PrototypeSkill();

    expect(skill.contract.supportedTypes).toEqual(['prototype']);
    expect(skill.contract.requiredContext).toEqual(['taskId']);
    expect(skill.type).toBe('prototype');
  });

  it('renders all supported prototype styles', async () => {
    const styles: PrototypeStyle[] = ['minimal', 'material', 'wireframe'];

    for (const style of styles) {
      const artifact = await prototypeSkill.generate(
        `做一个${style}风格的电商 App 可点击原型，包含首页、商品详情和购物车`,
        theme,
        {
          taskId: `prototype-style-${style}`,
          prototypeConfig: {
            style,
            theme: 'light',
          },
        },
      );

      expect(artifact.type).toBe('prototype');
      expect(artifact.pages).toBeGreaterThanOrEqual(3);
      expect(artifact.html).toContain(`proto-shell--${style}`);
      expect(artifact.metadata).toMatchObject({ style, themeMode: 'light' });
    }
  });

  it('generates standalone interactive HTML with navigation, modal, tabs and toggle actions', async () => {
    const artifact = await prototypeSkill.generate(
      '做一个电商 App 的可点击原型，包含首页、商品详情和购物车',
      theme,
      { taskId: 'task-prototype-1' },
    );

    expect(artifact.taskId).toBe('task-prototype-1');
    expect(artifact.type).toBe('prototype');
    expect(artifact.pages).toBeGreaterThanOrEqual(3);
    expect(artifact.html).toContain('const routes = {');
    expect(artifact.html).toContain('window.addEventListener(\'hashchange\', syncPage);');
    expect(artifact.html).toContain('data-action="navigate"');
    expect(artifact.html).toContain('data-action="modal"');
    expect(artifact.html).toContain('data-action="tab-switch"');
    expect(artifact.html).toContain('data-action="toggle"');
    expect(artifact.html).toContain('data-component="global-modal"');
    expect(artifact.html).toContain('data-page="home"');
    expect(artifact.html).toContain('@media (max-width: 767px)');
    expect(artifact.metadata).toMatchObject({
      exportProfile: 'html-only',
      defaultRoute: 'home',
      providerUsed: false,
    });
  });

  it('supports light and dark themes in rendered html', async () => {
    const light = await prototypeSkill.generate(
      '做一个明亮风格的产品原型',
      theme,
      {
        taskId: 'prototype-light',
        prototypeConfig: { style: 'minimal', theme: 'light' },
      },
    );

    const dark = await prototypeSkill.generate(
      '做一个暗色的产品原型',
      theme,
      {
        taskId: 'prototype-dark',
        prototypeConfig: { style: 'material', theme: 'dark' },
      },
    );

    expect(light.html).toContain('<html lang="zh-CN" data-theme="light">');
    expect(dark.html).toContain('<html lang="zh-CN" data-theme="dark">');
    expect(dark.metadata).toMatchObject({ themeMode: 'dark', style: 'material' });
  });

  it('merges provider-supplied content into the generated config', async () => {
    const skill = new PrototypeSkill();
    const providerCalls: string[] = [];

    const artifact = await skill.generate(
      '做一个登录原型，支持验证码和个人中心跳转',
      theme,
      {
        taskId: 'task-prototype-provider',
        prototypeProvider: {
          async generatePrototypePlan(context) {
            providerCalls.push(context.prompt);
            return {
              title: '账户登录体验原型',
              summary: '补全了登录流程、验证反馈和个人中心跳转。',
              style: 'material',
              theme: 'dark',
              defaultPage: 'login',
              pages: [
                {
                  name: 'login',
                  title: '登录页',
                  summary: '验证码登录和错误反馈都在一个视图里。',
                  sections: [
                    {
                      id: 'login-overview',
                      name: 'overview',
                      title: '登录信息',
                      body: '聚焦验证码登录和跳转。',
                      cards: [{ title: '安全提醒', body: '验证码超时后会给出清晰提示。', badge: '安全' }],
                    },
                    {
                      id: 'login-interaction',
                      name: 'interaction',
                      title: '交互区',
                      tabs: [
                        { key: 'overview', label: '概要', body: '先看登录流程。' },
                        { key: 'detail', label: '详情', body: '再看错误反馈。' },
                      ],
                      formFields: [{ label: '手机号', placeholder: '输入手机号', type: 'tel' }],
                    },
                  ],
                  interactions: [
                    { id: 'login-modal', type: 'modal', label: '打开说明', targetComponent: 'global-modal' },
                    { id: 'login-tab', type: 'tab-switch', label: '切换详情', targetComponent: 'tabs-login-interaction', stateValue: 'detail' },
                    { id: 'login-nav', type: 'navigate', label: '跳到个人中心', targetPage: 'profile' },
                  ],
                },
                {
                  name: 'profile',
                  title: '个人中心',
                  summary: '登录成功后落到这里。',
                  sections: [
                    {
                      id: 'profile-overview',
                      name: 'overview',
                      title: '用户信息',
                      cards: [{ title: '欢迎回来', body: '展示用户信息和入口。', badge: '资料' }],
                    },
                  ],
                  interactions: [
                    { id: 'profile-home', type: 'navigate', label: '返回登录', targetPage: 'login' },
                  ],
                },
              ],
            };
          },
        },
      },
    );

    expect(providerCalls).toHaveLength(1);
    expect(artifact.html).toContain('账户登录体验原型');
    expect(artifact.html).toContain('验证码登录和错误反馈都在一个视图里。');
    expect(artifact.html).toContain('data-page="login"');
    expect(artifact.metadata).toMatchObject({ providerUsed: true, defaultRoute: 'login', style: 'material', themeMode: 'dark' });
  });

  it('allows registry lookup by prototype artifact type', () => {
    const registry = new SkillRegistry();
    registry.register(new PrototypeSkill());

    expect(registry.getByArtifactType('prototype').map(skill => skill.contract.name)).toEqual(['prototype']);
  });

  it('passes prototype integrity checks for its own output', async () => {
    const artifact = await prototypeSkill.generate(
      '做一个 SaaS 仪表盘交互原型，包含首页、详情和设置',
      theme,
      { taskId: 'task-prototype-rules' },
    );

    const results = checkAllClarificationRules(artifact);

    expect(results.every(result => result.passed)).toBe(true);
  });

  it('flags route and navigation inconsistencies when prototype HTML is broken', () => {
    const brokenArtifact = {
      taskId: 'broken',
      type: 'prototype' as const,
      status: 'ready' as const,
      pages: 1,
      metadata: {},
      html: `<!DOCTYPE html><html><body>
        <a href="#/ghost" data-action="navigate">Ghost</a>
        <section id="page-home" data-page="home"></section>
        <script>
          const routes = { home: 'page-home', detail: 'page-detail', default: 'home' };
        </script>
      </body></html>`,
    };

    expect(checkRouteTableDomConsistency(brokenArtifact)).toMatchObject({ passed: false, severity: 'block' });
    expect(checkNavigationLinkValidity(brokenArtifact)).toMatchObject({ passed: false, severity: 'warn' });
  });

  it('renders explicit config through the standalone renderer', () => {
    const config: PrototypeConfig = {
      title: 'Prototype Demo',
      summary: '验证交互原型渲染器。',
      style: 'wireframe',
      theme: 'dark',
      defaultPage: 'home',
      pages: [
        {
          name: 'home',
          title: '首页',
          summary: '主入口和核心交互。',
          sections: [
            {
              id: 'home-overview',
              name: 'overview',
              title: '概览区',
              body: '看核心信息。',
              cards: [{ title: '卡片 1', body: '说明 1', badge: 'A' }],
            },
            {
              id: 'home-interaction',
              name: 'interaction',
              title: '交互区',
              tabs: [
                { key: 'overview', label: '概要', body: '先看概要。' },
                { key: 'detail', label: '详情', body: '再看详情。' },
              ],
              formFields: [{ label: '关键词', placeholder: '请输入', type: 'search' }],
            },
          ],
          interactions: [
            { id: 'nav-detail', type: 'navigate', label: '去详情', targetPage: 'detail' },
            { id: 'open-modal', type: 'modal', label: '打开说明', targetComponent: 'global-modal' },
            { id: 'switch-tab', type: 'tab-switch', label: '切换标签', targetComponent: 'tabs-home-interaction', stateValue: 'detail' },
            { id: 'scroll-info', type: 'scroll-to', label: '定位交互区', targetSectionId: 'home-interaction' },
          ],
        },
        {
          name: 'detail',
          title: '详情',
          summary: '详情页面。',
          sections: [
            {
              id: 'detail-overview',
              name: 'overview',
              title: '详情概览',
              cards: [{ title: '卡片 2', body: '说明 2' }],
            },
          ],
          interactions: [
            { id: 'back-home', type: 'navigate', label: '返回首页', targetPage: 'home' },
          ],
        },
      ],
    };

    const html = renderPrototypeHtml(config, theme);

    expect(html).toContain('data-theme="dark"');
    expect(html).toContain('proto-shell--wireframe');
    expect(html).toContain('data-action="scroll-to"');
    expect(html).toContain('data-action="tab-switch"');
    expect(html).toContain('data-page="detail"');
  });
});
