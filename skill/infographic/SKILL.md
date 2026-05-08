---
name: claw-design-infographic
description: "信息图生成。做信息图、infographic、数据图解、图文报告、visual summary、data story、统计图解、信息可视化、information graphic。输入数据或主题描述，输出 HTML/SVG 信息图。"
---

# Claw Design — Infographic Skill

生成信息图（HTML/SVG）。

## 使用方式

```bash
npx tsx scripts/generate.ts --content "信息图主题描述"
```

参数：
- `--content`：信息图内容的自然语言描述
- `--output`：输出目录（默认 ./output）

## 输出

HTML 信息图文件 + 质量检查报告（JSON stdout）。
