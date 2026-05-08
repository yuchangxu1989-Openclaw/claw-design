---
name: claw-design-logic-diagram
description: "逻辑关系图生成。逻辑图、关系图、概念图、logic diagram、concept map、mind map、思维导图、知识图谱、entity relationship、因果图、树状图、层级图。输入概念或关系描述，输出 HTML/SVG 逻辑关系图。"
---

# Claw Design — Logic Diagram Skill

生成逻辑关系图（HTML/SVG）。

## 使用方式

```bash
npx tsx scripts/generate.ts --content "逻辑关系描述"
```

参数：
- `--content`：概念或逻辑关系的自然语言描述
- `--output`：输出目录（默认 ./output）

## 输出

HTML 逻辑关系图文件 + 质量检查报告（JSON stdout）。
