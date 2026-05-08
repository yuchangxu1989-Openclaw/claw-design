---
name: claw-design-architecture
description: "架构图生成。架构图、系统图、部署图、组件图、拓扑图、技术架构、architecture diagram、system diagram、component diagram、deployment diagram。输入架构描述，输出 HTML/SVG 架构图，支持明暗双主题。"
---

# Claw Design — Architecture Diagram Skill

生成架构图（HTML/SVG）。

## 使用方式

```bash
npx tsx scripts/generate.ts --content "架构描述"
```

参数：
- `--content`：架构图内容的自然语言描述
- `--output`：输出目录（默认 ./output）

## 输出

HTML 架构图文件 + 质量检查报告（JSON stdout）。
