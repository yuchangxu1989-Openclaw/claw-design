---
name: claw-design-flowchart
description: "流程图与时序图生成。画流程图、时序图、sequence diagram、flowchart、flow chart、活动图、泳道图、swimlane、process flow、业务流程、工作流图。输入流程描述，输出 HTML/SVG 流程图或时序图。"
---

# Claw Design — Flowchart Skill

生成流程图与时序图（HTML/SVG）。

## 使用方式

```bash
npx tsx scripts/generate.ts --content "流程描述"
```

参数：
- `--content`：流程或时序的自然语言描述
- `--output`：输出目录（默认 ./output）

## 输出

HTML 流程图/时序图文件 + 质量检查报告（JSON stdout）。
