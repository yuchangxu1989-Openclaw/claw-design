import { describe, expect, it } from 'vitest';
import uiMockupSkill, { UiMockupSkill } from '../../src/skills/ui-mockup-skill.js';
import { SkillRegistry } from '../../src/skills/skill-registry.js';
import { renderMockupHtml } from '../../src/skills/ui-mockup-renderer.js';
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

describe('UiMockupSkill', () => {
  it('publishes contract metadata', () => {
    const skill = new UiMockupSkill();
    expect(skill.contract.supportedTypes).toEqual(['ui-mockup']);
    expect(skill.contract.requiredContext).toEqual(['taskId']);
  });

  it('generates desktop mockup by default', async () => {
    const artifact = await uiMockupSkill.generate(
      '做一个后台管理系统的界面线框图',
      theme,
      { taskId: 'mockup-1' },
    );
    expect(artifact.type).toBe('ui-mockup');
    expect(artifact.html).toContain('data-viewport="desktop"');
    expect(artifact.html).toContain('data-fidelity="low"');
    expect(artifact.metadata).toMatchObject({ viewport: 'desktop', fidelity: 'low' });
  });

  it('generates mobile mockup when input mentions mobile', async () => {
    const artifact = await uiMockupSkill.generate(
      '做一个手机端 app 的高保真界面设计',
      theme,
      { taskId: 'mockup-mobile' },
    );
    expect(artifact.html).toContain('data-viewport="mobile"');
    expect(artifact.html).toContain('data-fidelity="high"');
    expect(artifact.metadata).toMatchObject({ viewport: 'mobile', fidelity: 'high' });
  });

  it('supports explicit config override', async () => {
    const artifact = await uiMockupSkill.generate(
      '界面设计',
      theme,
      {
        taskId: 'mockup-explicit',
        mockupConfig: {
          title: '订单管理',
          summary: '订单列表和详情页',
          viewport: 'desktop',
          fidelity: 'high',
          theme: 'dark',
          pages: [{
            name: 'orders',
            title: '订单列表',
            viewport: 'desktop',
            sections: [{
              id: 'list', layout: 'column',
              components: [
                { id: 'nav', type: 'navbar', label: '订单管理' },
                { id: 'table', type: 'table', label: '订单数据' },
              ],
            }],
          }],
        },
      },
    );
    expect(artifact.html).toContain('data-theme="dark"');
    expect(artifact.html).toContain('订单管理');
    expect(artifact.html).toContain('data-comp="table"');
    expect(artifact.metadata).toMatchObject({ viewport: 'desktop', fidelity: 'high', themeMode: 'dark' });
  });

  it('renders component state hints', () => {
    const html = renderMockupHtml({
      title: 'Test',
      summary: 'Test summary',
      viewport: 'desktop',
      fidelity: 'low',
      theme: 'light',
      pages: [{
        name: 'main', title: 'Main', viewport: 'desktop',
        sections: [{
          id: 's1', layout: 'row',
          components: [{ id: 'btn', type: 'button', label: 'Submit', state: 'disabled' }],
        }],
      }],
    }, theme);
    expect(html).toContain('mockup-comp__state');
    expect(html).toContain('disabled');
  });

  it('allows registry lookup by ui-mockup artifact type', () => {
    const registry = new SkillRegistry();
    registry.register(new UiMockupSkill());
    expect(registry.getByArtifactType('ui-mockup').map(s => s.contract.name)).toEqual(['ui-mockup']);
  });
});
