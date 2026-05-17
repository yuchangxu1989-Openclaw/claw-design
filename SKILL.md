---
name: claw-design
description: |
  AI 设计引擎——一句话生成 PPT、图表、架构图、海报、视频剪辑、落地页、原型、PDF 等 10+ 种设计产物。Claude Design 的免费开源平替。
  内置 ChartSkill（饼图/柱状图/折线图，纯 SVG，自然语言输入自动解析）、VideoEditorSkill（FFmpeg 本地剪辑）、SlidesSkill（36 主题 PPT）、PosterSkill、ArchDiagramSkill 等。
  零图片 API 依赖，纯 HTML/CSS/SVG + FFmpeg 渲染，成本稳定，结果可控。
  触发词："做个 PPT"、"生成图表"、"画个饼图"、"做个架构图"、"剪个视频"、"做个海报"、"生成落地页"、"做个原型"、"generate a presentation"、"make a chart"、"create a poster"。
---

# Claw Design — AI 设计引擎

一句话生成视频剪辑、PPT、图表、架构图、海报、PDF、落地页、原型等 10+ 种设计产物。

## 安装

```bash
clawhub install claw-design
```

或通过 npm：

```bash
npm install @self-evolving-harness/claw-design
```

## 核心能力

- 意图路由：自然语言输入 → 自动识别交付物类型 → 选择对应 Skill
- 图表：内置 ChartSkill（饼图/柱状图/折线图，纯 SVG 渲染，支持中英文数据解析）+ chart-craft-plus 35+ 种扩展
- 视频：高光提取、多视频融合、精剪、ASR 自动字幕（FFmpeg + Whisper）
- 演示文稿：36 主题 × 31 布局，HTML + PPTX 双格式
- 架构图：C4/部署/边界/模块关系，HTML/SVG 明暗双主题
- 海报：HTML/CSS → PNG，品牌可配置
- 质量门禁：自动拦截不合格产出
- 多格式导出：HTML/PPTX/PDF/PNG/SVG/MP4

## 链接

- [GitHub](https://github.com/yuchangxu1989-Openclaw/claw-design)
- [npm](https://www.npmjs.com/package/@self-evolving-harness/claw-design)
