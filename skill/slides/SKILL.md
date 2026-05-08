---
name: claw-design-slides
description: "演示文稿生成。做PPT、演示文稿、slides、deck、presentation、幻灯片、pitch deck、分享稿、演讲稿，也接收 convert to pptx、export pptx、导出PPT、转换为PPT、生成PPT文件、pptx格式 等导出触发词。输入一句话描述，输出多页 HTML 幻灯片；当前 PPTX 导出意图先路由到 slides，anthropic-pptx 接入待补。"
---

# Claw Design — Slides Skill

生成演示文稿（HTML 幻灯片）。

## 使用方式

```bash
npx tsx scripts/generate.ts --content "内容描述"
```

参数：
- `--content`：演示文稿内容的自然语言描述
- `--output`：输出目录（默认 ./output）

## 输出

HTML 幻灯片文件 + 质量检查报告（JSON stdout）。
