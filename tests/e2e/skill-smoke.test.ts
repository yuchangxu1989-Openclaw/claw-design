import { describe, it, expect, beforeAll } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ThemePack, Artifact } from '../../src/types.js';

import { SlidesSkill } from '../../src/execution/slides-skill.js';
import { ChartSkill } from '../../src/execution/chart-skill.js';
import { ArchDiagramSkill } from '../../src/execution/arch-diagram-skill.js';
import { FlowchartSkill } from '../../src/skills/flowchart-skill.js';
import { PosterSkill } from '../../src/skills/poster-skill.js';
import { LandingSkill } from '../../src/skills/landing-skill.js';
import { PrototypeSkill } from '../../src/skills/prototype-skill.js';
import { UiMockupSkill } from '../../src/skills/ui-mockup-skill.js';
import { DashboardSkill } from '../../src/skills/dashboard-skill.js';
import { InfographicSkill } from '../../src/skills/infographic-skill.js';
import { LogicDiagramSkill } from '../../src/skills/logic-diagram-skill.js';
import { VideoEditorSkill } from '../../src/skills/video-editor-skill.js';

const OUT_DIR = '/tmp/claw-design-smoke';

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

const CTX: Record<string, unknown> = { taskId: 'smoke-test-001' };

interface SkillCase {
  name: string;
  factory: () => { generate(input: string, theme: ThemePack, ctx: Record<string, unknown>): Promise<Artifact> };
  input: string;
  file: string;
  extraCtx?: Record<string, unknown>;
}

const CASES: SkillCase[] = [
  { name: 'SlidesSkill', factory: () => new SlidesSkill(), input: '做一份 AI 发展趋势的演示文稿，包含 5 页', file: 'slides.html' },
  { name: 'ChartSkill', factory: () => new ChartSkill(), input: '画一个柱状图：苹果 30%，香蕉 25%，橙子 20%，葡萄 15%，草莓 10%', file: 'chart.html' },
  { name: 'ArchDiagramSkill', factory: () => new ArchDiagramSkill(), input: '画一个微服务架构图，包含 API 网关、用户服务、订单服务、数据库', file: 'arch-diagram.html' },
  { name: 'FlowchartSkill', factory: () => new FlowchartSkill(), input: '画一个用户注册流程图：输入信息→验证→发送验证码→确认→完成', file: 'flowchart.html' },
  { name: 'PosterSkill', factory: () => new PosterSkill(), input: '设计一张 AI 技术大会的宣传海报，主题是"智能未来"', file: 'poster.html' },
  { name: 'LandingSkill', factory: () => new LandingSkill(), input: '做一个 SaaS 产品的落地页，包含 hero、功能介绍、定价、CTA', file: 'landing-page.html' },
  { name: 'PrototypeSkill', factory: () => new PrototypeSkill(), input: '做一个待办事项 App 的交互原型，包含列表页和详情页', file: 'prototype.html' },
  { name: 'UiMockupSkill', factory: () => new UiMockupSkill(), input: '设计一个电商 App 的商品详情页 UI 线框图', file: 'ui-mockup.html' },
  { name: 'DashboardSkill', factory: () => new DashboardSkill(), input: '做一个运营数据仪表盘，包含 DAU、收入、转化率、用户留存', file: 'dashboard.html' },
  { name: 'InfographicSkill', factory: () => new InfographicSkill(), input: '做一张信息图：2024年全球AI市场规模达1500亿美元，同比增长35%', file: 'infographic.html' },
  { name: 'LogicDiagramSkill', factory: () => new LogicDiagramSkill(), input: '画一个决策树：如果用户VIP则免运费，否则满99免运费，不满则收10元', file: 'logic-diagram.html' },
  { name: 'VideoEditorSkill', factory: () => new VideoEditorSkill(), input: '做一个 15 秒产品介绍视频的分镜脚本，产品是 AI 设计引擎 ClawDesign', file: 'video.html' },
];

beforeAll(() => {
  mkdirSync(OUT_DIR, { recursive: true });
});

describe('Claw Design — Skill Smoke Tests', () => {
  for (const c of CASES) {
    it(`${c.name}: generate() produces non-empty HTML`, async () => {
      const skill = c.factory();
      const artifact = await skill.generate(c.input, THEME, { ...CTX, ...c.extraCtx });

      expect(artifact).toBeDefined();
      expect(artifact.html).toBeDefined();
      expect(artifact.html.length).toBeGreaterThan(0);
      expect(artifact.type).toBeDefined();
      expect(artifact.status).toBe('ready');

      const outPath = join(OUT_DIR, c.file);
      writeFileSync(outPath, artifact.html, 'utf-8');
    }, 30_000);
  }
});
