# Claw Design

一句话把内容变成可交付的设计产物。

🌐 [官网](https://agentos.site/claw-design.html)

Claw Design 是面向真实交付场景的 AI 设计引擎。你给一句需求，它会把任务路由到合适的设计链路，生成可展示、可编辑、可归档、可复用的结果。它适合需要稳定交付的人，而不是只想要一张图的人。

## 你大概率正在被这些问题卡住

- 内容已经有了，还得手工拆成演示文稿、图表、架构图、海报等多个制品
- 结果能看不能改，交付后还要二次返工
- 风格、品牌、版式、导出格式每次都要重新兜底
- 团队缺设计资源，但业务要的是今天就能交付的成品

## 它能带来什么

- 一句话触发完整链路：意图识别、上下文收束、生成、质量门禁、导出交付
- 同一份内容可生成 11 类设计交付物：
  - 演示文稿
  - 图表与数据可视化
  - 架构图与系统图
  - 流程图与时序图
  - 海报与宣传图
  - 落地页
  - 界面稿与线框图
  - 仪表盘
  - 信息图
  - 逻辑关系图
  - 交互原型
- 核心交付标准是 HTML + PPTX，同时支持 PDF、PNG、SVG 等派生格式
- 全链路内置主题包、品牌约束和质量门禁，减少返工和交付失真
- 渲染层基于 HTML、CSS、SVG、JS，核心链路不依赖外部图片生成服务

## 30 秒快速体验

前提：Node.js 18 及以上版本。

直接生成一个演示文稿：

```bash
npx @self-evolving-harness/claw-design generate "帮我做一个关于AI趋势的演示文稿"
```

默认输出到 `./output/`。首次体验时，先打开这两个文件就够了：

- `output/index.html`：浏览器直接打开查看
- `output/output.pptx`：可编辑版本

指定输出目录：

```bash
npx @self-evolving-harness/claw-design generate "给我一页微服务系统架构图" -o ./my-output
```

查看命令帮助：

```bash
npx @self-evolving-harness/claw-design --help
```

## 适合哪些场景

- 把方案文本、会议纪要、提案内容变成演示文稿
- 把经营数据、运营数据变成图表、仪表盘、信息图
- 把系统说明变成架构图、流程图、逻辑关系图
- 把活动信息变成海报、宣传图、落地页
- 把产品构想变成界面稿、线框图、可点击交互原型
- 把同一主题内容打包成一组可展示、可编辑、可归档的交付物

## 接入方式

安装：

```bash
npm install @self-evolving-harness/claw-design
```

代码调用：

```typescript
import { createPipeline } from '@self-evolving-harness/claw-design';

const pipeline = await createPipeline();
const result = await pipeline.run('帮我做一个季度汇报演示文稿');

if (result.bundle) {
  console.log('HTML:', result.bundle.htmlPath);
  console.log('PPTX:', result.bundle.pptxPath);
  console.log('PDF:', result.bundle.pdfPath);
}
```

## 文档索引

- 产品规格：`docs/product-requirements.md`
- 示例代码：`examples/demo.ts`
- 命令行入口：`src/cli/index.ts`
- 公开 API：`src/index.ts`

## 许可证

MIT
