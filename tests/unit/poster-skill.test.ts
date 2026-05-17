import { describe, expect, it } from 'vitest';
import posterSkill, { PosterSkill } from '../../src/skills/poster-skill.js';
import { SkillRegistry } from '../../src/skills/skill-registry.js';
import { renderPosterHtml } from '../../src/skills/poster-renderer.js';
import type { ThemePack } from '../../src/types.js';

const theme: ThemePack = {
  colorPrimary: '#6d28d9',
  colorBg: '#ffffff',
  fontHeading: 'Heading',
  fontBody: 'Body',
  spacingUnit: '8px',
  radius: '16px',
  cssVariables: {
    '--cd-color-primary': '#6d28d9',
    '--cd-color-bg': '#ffffff',
    '--cd-font-heading': 'Heading',
    '--cd-font-body': 'Body',
    '--cd-radius': '16px',
  },
};

describe('PosterSkill', () => {
  it('publishes base-skill metadata through the shared contract', () => {
    const skill = new PosterSkill();

    expect(skill.contract.supportedTypes).toEqual(['poster']);
    expect(skill.contract.requiredContext).toEqual(['taskId']);
    expect(skill.contract.supportedOutputs).toEqual(['html']);
  });

  it('renders all supported poster styles', async () => {
    const styles = ['modern', 'classic', 'minimal', 'bold'] as const;

    for (const style of styles) {
      const artifact = await posterSkill.generate(
        `做一张${style}风格的活动海报，主题是春季发布会，强调新品体验和现场报名`,
        theme,
        {
          taskId: `poster-style-${style}`,
          posterConfig: {
            title: '春季发布会',
            subtitle: '新品体验与现场交流',
            body: '用一张海报把活动亮点、参与方式和时间地点集中表达。',
            style,
            size: 'social',
            theme: 'dark',
          },
        },
      );

      expect(artifact.type).toBe('poster');
      expect(artifact.pages).toBe(1);
      expect(artifact.html).toContain(`data-style="${style}"`);
      expect(artifact.html).toContain(`poster--${style}`);
      expect(artifact.metadata).toMatchObject({ style, size: 'social' });
    }
  });

  it('renders all supported poster sizes', async () => {
    const sizes = ['A4', 'social', 'banner', 'square'] as const;

    for (const size of sizes) {
      const artifact = await posterSkill.generate(
        `做一张${size}尺寸的宣传图，主题是会员招募`,
        theme,
        {
          taskId: `poster-size-${size}`,
          posterConfig: {
            title: '会员招募',
            body: '突出权益说明、限时窗口和行动按钮。',
            style: 'modern',
            size,
            theme: 'light',
          },
        },
      );

      expect(artifact.html).toContain(`data-size="${size}"`);
      expect(artifact.metadata).toMatchObject({ size, themeMode: 'light' });
    }
  });

  it('supports both light and dark themes', async () => {
    const light = await posterSkill.generate(
      '做一张明亮风格的海报',
      theme,
      {
        taskId: 'poster-light',
        posterConfig: {
          title: '夏季计划',
          body: '清楚表达节奏、主题和下一步动作。',
          style: 'minimal',
          size: 'square',
          theme: 'light',
        },
      },
    );

    const dark = await posterSkill.generate(
      '做一张暗黑风格的海报',
      theme,
      {
        taskId: 'poster-dark',
        posterConfig: {
          title: '夜场活动',
          body: '强调冲击感、倒计时和入口。',
          style: 'bold',
          size: 'banner',
          theme: 'dark',
        },
      },
    );

    expect(light.html).toContain('<html lang="zh-CN" data-theme="light">');
    expect(light.html).toContain('theme--light');
    expect(dark.html).toContain('<html lang="zh-CN" data-theme="dark">');
    expect(dark.html).toContain('theme--dark');
  });

  it('allows registry lookup by poster artifact type', () => {
    const registry = new SkillRegistry();
    registry.register(new PosterSkill());

    expect(registry.getByArtifactType('poster').map(skill => skill.contract.name)).toEqual(['poster']);
  });

  it('renders custom background image and color overrides', () => {
    const html = renderPosterHtml({
      title: '品牌快闪',
      subtitle: '城市巡回主题视觉',
      body: '强化主标题、行动标签和活动信息。',
      style: 'classic',
      size: 'A4',
      theme: 'dark',
      backgroundImage: 'https://example.com/bg.png',
      colors: {
        primary: '#ef4444',
        accent: '#f59e0b',
        background: '#111827',
      },
    }, theme);

    expect(html).toContain("--poster-bg-image: url('https://example.com/bg.png');");
    expect(html).toContain('--poster-primary: #ef4444;');
    expect(html).toContain('data-size="A4"');
    expect(html).toContain('poster--classic');
  });
});
