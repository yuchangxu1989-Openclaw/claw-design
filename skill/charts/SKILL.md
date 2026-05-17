---
name: claw-design-charts
description: "图表与数据可视化生成。画图表、chart、数据可视化、柱状图、饼图、折线图、漏斗图、桑基图、热力图、bar chart、line chart、pie chart。输入数据描述，输出 HTML 图表，支持 35+ 种图表类型。"
---

# Claw Design — Charts Skill

生成图表与数据可视化（HTML/SVG）。

## 使用方式

```bash
npx tsx scripts/generate.ts --content "数据描述"
```

参数：
- `--content`：图表内容的自然语言描述
- `--output`：输出目录（默认 ./output）

## 输出

HTML 图表文件 + 质量检查报告（JSON stdout）。
