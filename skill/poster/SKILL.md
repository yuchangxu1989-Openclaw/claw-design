---
name: claw-design-poster
description: "海报与宣传图生成。做海报、宣传图、poster、banner、活动海报、促销图、社交媒体图、封面图、event poster、promotional image、social media graphic。输入主题描述，输出高质量 HTML 海报。"
---

# Claw Design — Poster Skill

生成海报与宣传图（HTML/CSS）。

## 使用方式

```bash
npx tsx scripts/generate.ts --content "海报主题描述"
```

参数：
- `--content`：海报内容的自然语言描述
- `--output`：输出目录（默认 ./output）

## 输出

HTML 海报文件 + 质量检查报告（JSON stdout）。
