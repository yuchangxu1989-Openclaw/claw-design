---
name: claw-design-dashboard
description: "Dashboard 数据看板生成。做看板、dashboard、数据面板、数据大屏、监控面板、KPI 看板、analytics dashboard、data panel、metrics board、运营看板。输入指标描述，输出 HTML 数据看板。"
---

# Claw Design — Dashboard Skill

生成 Dashboard 数据看板（HTML/CSS/SVG）。

## 使用方式

```bash
npx tsx scripts/generate.ts --content "看板指标描述"
```

参数：
- `--content`：看板数据和指标的自然语言描述
- `--output`：输出目录（默认 ./output）

## 输出

HTML 数据看板文件 + 质量检查报告（JSON stdout）。
