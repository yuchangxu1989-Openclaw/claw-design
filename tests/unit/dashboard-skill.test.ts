import { describe, expect, it } from 'vitest';
import dashboardSkill, { DashboardSkill } from '../../src/skills/dashboard-skill.js';
import { SkillRegistry } from '../../src/skills/skill-registry.js';
import type { ThemePack } from '../../src/types.js';

const theme: ThemePack = {
  colorPrimary: '#4f46e5',
  colorBg: '#ffffff',
  fontHeading: 'Heading',
  fontBody: 'Body',
  spacingUnit: '8px',
  radius: '12px',
  cssVariables: {
    '--cd-color-primary': '#4f46e5',
    '--cd-color-bg': '#ffffff',
    '--cd-font-heading': 'Heading',
    '--cd-font-body': 'Body',
    '--cd-radius': '12px',
  },
};

describe('DashboardSkill', () => {
  it('publishes contract metadata', () => {
    const skill = new DashboardSkill();
    expect(skill.contract.supportedTypes).toEqual(['dashboard']);
    expect(skill.contract.requiredContext).toEqual(['taskId']);
  });

  it('generates executive layout when input mentions overview', async () => {
    const artifact = await dashboardSkill.generate(
      '做一个管理层总览仪表盘，展示营收、用户和转化率',
      theme,
      { taskId: 'dash-exec' },
    );
    expect(artifact.type).toBe('dashboard');
    expect(artifact.html).toContain('data-layout="executive"');
    expect(artifact.html).toContain('dash-widget__value');
    expect(artifact.metadata).toMatchObject({ layout: 'executive' });
  });

  it('generates operational layout by default', async () => {
    const artifact = await dashboardSkill.generate(
      '做一个运营数据看板',
      theme,
      { taskId: 'dash-ops' },
    );
    expect(artifact.html).toContain('data-layout="operational"');
    expect(artifact.metadata).toMatchObject({ layout: 'operational' });
  });

  it('supports both light and dark themes', async () => {
    const light = await dashboardSkill.generate('仪表盘', theme, {
      taskId: 'dash-light',
      dashboardConfig: { theme: 'light' },
    });
    const dark = await dashboardSkill.generate('仪表盘', theme, {
      taskId: 'dash-dark',
      dashboardConfig: { theme: 'dark' },
    });
    expect(light.html).toContain('data-theme="light"');
    expect(dark.html).toContain('data-theme="dark"');
  });

  it('renders metric cards, charts, tables and status lists', async () => {
    const artifact = await dashboardSkill.generate(
      '管理层总览仪表盘',
      theme,
      { taskId: 'dash-widgets' },
    );
    expect(artifact.html).toContain('data-widget="w-m1"');
    expect(artifact.html).toContain('data-widget="w-trend"');
    expect(artifact.html).toContain('data-widget="w-table"');
    expect(artifact.html).toContain('data-widget="w-status"');
  });

  it('allows registry lookup by dashboard artifact type', () => {
    const registry = new SkillRegistry();
    registry.register(new DashboardSkill());
    expect(registry.getByArtifactType('dashboard').map(s => s.contract.name)).toEqual(['dashboard']);
  });
});
