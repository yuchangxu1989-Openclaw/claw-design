import { describe, expect, it } from 'vitest';
import { SlidesSkill } from '../../src/execution/slides-skill.js';
import type { ThemePack } from '../../src/types.js';

const THEME: ThemePack = {
  colorPrimary: '#1a73e8',
  colorBg: '#ffffff',
  fontHeading: "'Inter', sans-serif",
  fontBody: "'Noto Sans SC', 'Noto Sans', sans-serif",
  spacingUnit: '8px',
  radius: '4px',
  cssVariables: {
    '--cd-color-primary': '#1a73e8',
    '--cd-color-bg': '#ffffff',
    '--cd-font-heading': "'Inter', sans-serif",
    '--cd-font-body': "'Noto Sans SC', 'Noto Sans', sans-serif",
    '--cd-spacing-unit': '8px',
    '--cd-radius': '4px',
  },
};

describe('SlidesSkill', () => {
  it('extracts a clean topic title instead of preserving instruction words', async () => {
    const skill = new SlidesSkill();
    const artifact = await skill.generate('做一份 AI 发展趋势的演示文稿，包含 5 页', THEME, { taskId: 't1' });

    expect(artifact.metadata.topic).toBe('AI 发展趋势');
    expect(artifact.html).toContain('<h1>AI 发展趋势</h1>');
    expect(artifact.html).not.toContain('做一份');
    expect(artifact.html).not.toContain('包含 5 页');
    expect(artifact.html).not.toContain('的演示文稿');
  });

  it('renders five slides with at least three bullet points per page', async () => {
    const skill = new SlidesSkill();
    const artifact = await skill.generate('做一份 AI 发展趋势的演示文稿，包含 5 页', THEME, { taskId: 't2' });

    const slides = artifact.html.match(/<section class="slide">[\s\S]*?<\/section>/g) ?? [];
    expect(slides).toHaveLength(5);

    for (const slide of slides) {
      const bullets = slide.match(/<li>/g) ?? [];
      expect(bullets.length).toBeGreaterThanOrEqual(3);
    }
  });
});
