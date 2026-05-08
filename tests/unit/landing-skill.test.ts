import { describe, expect, it } from 'vitest';
import landingSkill, { LandingSkill } from '../../src/skills/landing-skill.js';
import { SkillRegistry } from '../../src/skills/skill-registry.js';
import { renderLandingHtml } from '../../src/skills/landing-renderer.js';
import type { ThemePack } from '../../src/types.js';

const theme: ThemePack = {
  colorPrimary: '#4f46e5',
  colorBg: '#ffffff',
  fontHeading: 'Heading',
  fontBody: 'Body',
  spacingUnit: '8px',
  radius: '16px',
  cssVariables: {
    '--cd-color-primary': '#4f46e5',
    '--cd-color-bg': '#ffffff',
    '--cd-font-heading': 'Heading',
    '--cd-font-body': 'Body',
    '--cd-radius': '16px',
  },
};

describe('LandingSkill', () => {
  it('publishes base-skill metadata through the shared contract', () => {
    const skill = new LandingSkill();

    expect(skill.contract.supportedTypes).toEqual(['landing-page']);
    expect(skill.contract.requiredContext).toEqual(['taskId']);
    expect(skill.contract.supportedOutputs).toEqual(['html']);
  });

  it('renders all supported landing styles', async () => {
    const styles = ['startup', 'corporate', 'creative', 'saas'] as const;

    for (const style of styles) {
      const artifact = await landingSkill.generate(
        `做一个${style}风格的产品 Landing Page，展示 AI 协作平台的核心能力`,
        theme,
        {
          taskId: `landing-style-${style}`,
          landingConfig: {
            title: 'AI 协作平台',
            subtitle: '把策略、执行和交付压缩到同一页里。',
            style,
            theme: 'dark',
          },
        },
      );

      expect(artifact.type).toBe('landing-page');
      expect(artifact.pages).toBe(1);
      expect(artifact.html).toContain(`landing--${style}`);
      expect(artifact.html).toContain('data-section="hero"');
      expect(artifact.metadata).toMatchObject({ style, themeMode: 'dark' });
    }
  });

  it('supports section combinations including pricing, testimonials and footer', async () => {
    const artifact = await landingSkill.generate(
      '做一个带价格和客户证言的产品落地页',
      theme,
      {
        taskId: 'landing-sections',
        landingConfig: {
          title: 'Claw Growth',
          subtitle: '帮助团队把增长实验讲清楚并快速上线。',
          style: 'saas',
          theme: 'light',
          sections: [
            {
              type: 'hero',
              eyebrow: 'Launch',
              title: 'Claw Growth',
              subtitle: '帮助团队把增长实验讲清楚并快速上线。',
              primaryAction: { label: '申请试用', href: '#cta' },
              secondaryAction: { label: '查看价格', href: '#pricing' },
              stats: [
                { label: '上线速度', value: '当天' },
                { label: '协作体验', value: '统一' },
              ],
            },
            {
              type: 'features',
              title: '核心卖点',
              subtitle: '从洞察到行动在一页里完成。',
              items: [
                { title: '策略对齐', description: '先统一判断，再推进执行。', icon: '✦' },
                { title: '页面可复用', description: '活动版和产品版都能继续扩。', icon: '↗' },
              ],
            },
            {
              type: 'pricing',
              title: '价格方案',
              subtitle: '团队规模不同，选择不同。',
              tiers: [
                { name: 'Solo', price: '¥99', features: ['基础模块', '单项目'], ctaLabel: '开始' },
                { name: 'Team', price: '¥299', features: ['多人协作', '高级主题'], ctaLabel: '升级', highlighted: true, badge: '推荐' },
              ],
            },
            {
              type: 'testimonials',
              title: '客户评价',
              items: [
                { quote: '一页就把价值讲透了。', name: 'Ada', role: '增长负责人' },
              ],
            },
            {
              type: 'cta',
              title: '现在开始',
              subtitle: '把兴趣直接推进到下一步。',
              primaryAction: { label: '预约演示', href: '#hero' },
            },
            {
              type: 'footer',
              brand: 'Claw Growth',
              note: '适合产品上线页和营销活动页。',
              links: [
                { title: '导航', links: [{ label: '首屏', href: '#hero' }] },
              ],
            },
          ],
        },
      },
    );

    expect(artifact.html).toContain('data-section="pricing"');
    expect(artifact.html).toContain('data-section="testimonials"');
    expect(artifact.html).toContain('data-section="footer"');
    expect(artifact.html).toContain('Team');
    expect(artifact.html).toContain('Ada');
    expect(artifact.metadata).toMatchObject({
      sections: ['hero', 'features', 'pricing', 'testimonials', 'cta', 'footer'],
      sectionCount: 6,
    });
  });

  it('supports light and dark themes with responsive viewport meta', async () => {
    const light = await landingSkill.generate(
      '做一个明亮风格的落地页',
      theme,
      {
        taskId: 'landing-light',
        landingConfig: {
          title: 'Light Landing',
          subtitle: '强调清晰信息层级。',
          style: 'corporate',
          theme: 'light',
        },
      },
    );

    const dark = await landingSkill.generate(
      '做一个暗色落地页',
      theme,
      {
        taskId: 'landing-dark',
        landingConfig: {
          title: 'Dark Landing',
          subtitle: '强调质感和聚焦。',
          style: 'startup',
          theme: 'dark',
        },
      },
    );

    expect(light.html).toContain('<html lang="zh-CN" data-theme="light">');
    expect(light.html).toContain('theme--light');
    expect(light.html).toContain('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
    expect(light.html).toContain('@media (max-width: 767px)');
    expect(dark.html).toContain('<html lang="zh-CN" data-theme="dark">');
    expect(dark.html).toContain('theme--dark');
  });

  it('allows registry lookup by landing-page artifact type', () => {
    const registry = new SkillRegistry();
    registry.register(new LandingSkill());

    expect(registry.getByArtifactType('landing-page').map(skill => skill.contract.name)).toEqual(['landing-page']);
  });

  it('renders custom color overrides through the landing renderer', () => {
    const html = renderLandingHtml({
      title: 'Creative Launch',
      subtitle: '大胆风格的新品发布页。',
      style: 'creative',
      theme: 'dark',
      colors: {
        primary: '#f43f5e',
        accent: '#fb923c',
        background: '#140b1f',
      },
      sections: [
        {
          type: 'hero',
          title: 'Creative Launch',
          subtitle: '大胆风格的新品发布页。',
          primaryAction: { label: 'Start', href: '#cta' },
          secondaryAction: { label: 'Explore', href: '#features' },
        },
        {
          type: 'features',
          items: [
            { title: '强识别', description: '第一眼就知道是谁。', icon: '✦' },
          ],
        },
        {
          type: 'cta',
          title: '开始行动',
          primaryAction: { label: '立即报名', href: '#hero' },
        },
        {
          type: 'footer',
          brand: 'Creative Launch',
        },
      ],
    }, theme);

    expect(html).toContain('--landing-primary: #f43f5e;');
    expect(html).toContain('--landing-accent: #fb923c;');
    expect(html).toContain('--landing-background: #140b1f;');
    expect(html).toContain('landing--creative');
    expect(html).toContain('data-section="cta"');
  });
});
