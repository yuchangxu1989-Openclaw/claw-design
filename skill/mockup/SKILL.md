---
name: claw-design-mockup
description: "UI mockup 与线框图生成。画原型、wireframe、mockup、线框图、UI 原型、界面设计、页面原型、app mockup、web mockup、prototype、low-fi、hi-fi。输入界面描述，输出 HTML/SVG 线框图或 mockup。"
---

# Claw Design — Mockup Skill

生成 UI mockup 与线框图（HTML/SVG）。

## 使用方式

```bash
npx tsx scripts/generate.ts --content "界面描述"
```

参数：
- `--content`：UI 界面的自然语言描述
- `--output`：输出目录（默认 ./output）

## 输出

HTML mockup/线框图文件 + 质量检查报告（JSON stdout）。
