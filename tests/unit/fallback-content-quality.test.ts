import { describe, expect, it } from 'vitest';
import { SlidesSkill } from '../../src/execution/slides-skill.js';
import posterSkill from '../../src/skills/poster-skill.js';
import landingSkill from '../../src/skills/landing-skill.js';
import prototypeSkill from '../../src/skills/prototype-skill.js';
import infographicSkill from '../../src/skills/infographic-skill.js';
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

const HOLLOW_PATTERNS = [
  /Lorem ipsum/i,
  /Your Title Here/i,
  /Description goes here/i,
  /placeholder text/i,
  /sample text/i,
];

function assertNoHollowContent(html: string) {
  for (const pattern of HOLLOW_PATTERNS) {
    expect(html).not.toMatch(pattern);
  }
}

describe('Slides fallback content quality', () => {
  it('includes specific info from user input in output', async () => {
    const skill = new SlidesSkill();
    const artifact = await skill.generate(
      '做一份关于 AI Agent 在企业落地的演示文稿，目前覆盖500家企业',
      THEME, { taskId: 'sq1' },
    );
    expect(artifact.html).toContain('AI Agent');
    expect(artifact.html).toContain('500');
    assertNoHollowContent(artifact.html);
  });

  it('produces topic-specific content even with minimal input', async () => {
    const skill = new SlidesSkill();
    const artifact = await skill.generate('云计算', THEME, { taskId: 'sq2' });
    expect(artifact.html).toContain('云计算');
    expect(artifact.html).not.toContain('30-50%');
    expect(artifact.html).not.toContain('15-25%');
    expect(artifact.html).not.toContain('3-5 倍');
    assertNoHollowContent(artifact.html);
  });
});

describe('Poster fallback content quality', () => {
  it('preserves specific terms in title and body', async () => {
    const artifact = await posterSkill.generate(
      '做一张 AI 峰会的海报，500人规模，12月15日在北京',
      THEME, { taskId: 'pq1' },
    );
    expect(artifact.html).toContain('AI');
    expect(artifact.html).toContain('500');
    expect(artifact.html).toContain('12月15日');
    expect(artifact.html).toContain('北京');
    assertNoHollowContent(artifact.html);
  });

  it('produces meaningful content with minimal input', async () => {
    const artifact = await posterSkill.generate(
      '做一张海报', THEME, { taskId: 'pq2' },
    );
    assertNoHollowContent(artifact.html);
    expect(artifact.html).toContain('海报');
  });
});

describe('Landing page fallback content quality', () => {
  it('includes product name and specifics in output', async () => {
    const artifact = await landingSkill.generate(
      '做一个 SaaS 项目管理工具的落地页，产品叫 TaskFlow',
      THEME, { taskId: 'lq1' },
    );
    expect(artifact.html).toContain('TaskFlow');
    assertNoHollowContent(artifact.html);
  });

  it('produces topic-specific features with minimal input', async () => {
    const artifact = await landingSkill.generate(
      '做一个落地页', THEME, { taskId: 'lq2' },
    );
    assertNoHollowContent(artifact.html);
    expect(artifact.html).not.toContain('5 分钟完成配置');
  });
});

describe('Prototype fallback content quality', () => {
  it('includes topic in stats and timeline', async () => {
    const artifact = await prototypeSkill.generate(
      '做一个电商APP的交互原型，包含首页和购物车',
      THEME, { taskId: 'prq1' },
    );
    expect(artifact.html).toContain('电商');
    const dashCount = (artifact.html.match(/—/g) || []).length;
    expect(dashCount).toBeLessThan(5);
    assertNoHollowContent(artifact.html);
  });

  it('produces meaningful table data with minimal input', async () => {
    const artifact = await prototypeSkill.generate(
      '做一个原型', THEME, { taskId: 'prq2' },
    );
    assertNoHollowContent(artifact.html);
  });
});

describe('Infographic fallback content quality', () => {
  it('uses extracted numbers in stats blocks', async () => {
    const artifact = await infographicSkill.generate(
      '做一张信息图，展示2025年AI市场规模达到1900亿美元',
      THEME, { taskId: 'iq1' },
    );
    expect(artifact.html).toContain('1900亿美元');
    expect(artifact.html).toContain('AI');
    assertNoHollowContent(artifact.html);
  });

  it('produces topic-specific content with minimal input', async () => {
    const artifact = await infographicSkill.generate(
      '新能源汽车', THEME, { taskId: 'iq2' },
    );
    expect(artifact.html).toContain('新能源汽车');
    const dashValues = (artifact.html.match(/>—</g) || []).length;
    expect(dashValues).toBe(0);
    assertNoHollowContent(artifact.html);
  });
});
