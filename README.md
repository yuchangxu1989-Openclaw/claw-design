# Claw Design

一句话把内容变成可交付的设计产物。

🌐 [官网](https://agentos.site/claw-design.html)

Claw Design 是面向真实交付场景的 AI 设计引擎。你给一句需求，它会把任务路由到合适的设计链路，生成可展示、可编辑、可归档、可复用的结果。

---

## 你大概率正在被这些问题卡住

周五下午三点，老板说"下周一给客户做个方案演示"。内容你有，但拆成演示文稿要半天，调版式又半天，导出 PDF 发现格式乱了再修半天。周末没了。

产品经理画了个交互原型想验证思路，找设计排期要两周。等排上了，需求已经变了三轮。

运营同事每月做数据报告，数据早就跑出来了，但做成图表、仪表盘、信息图，每次都是从零开始拖拽。

技术负责人要画架构图给新人看，Visio 太重，白板太随意，AI 工具生成的东西一股"紫色渐变 + emoji 图标"的塑料味，拿不出手。

共同的困境：**内容早就有了，卡在"变成可交付产物"这一步。**

---

## 核心能力

**一句话触发完整链路**
意图识别 → 上下文收束 → 设计生成 → 质量门禁 → 导出交付。你只管说要什么，链路自动跑完。

**11 类设计产物，覆盖日常交付场景**

| 产物类型 | 差异化价值 |
|---------|-----------|
| 演示文稿 | 文本直接变 PPT，支持翻页演示和可编辑导出，不用再手工拆页 |
| 图表与数据可视化 | 柱状图、桑基图、热力图等一句话生成，数据有了图就有了 |
| 架构图与系统图 | 节点、分组、连接关系清晰可读，深色浅色主题切换，矢量可复用 |
| 流程图与时序图 | 泳道、决策分支、参与者顺序自动编排，复杂流程按模块拆段不拥挤 |
| 海报与宣传图 | 纯代码驱动构图，不依赖外部图片生成服务，文字层级和装饰图形自动编排 |
| 落地页 | 首屏、卖点、分区、CTA 一步到位，直接分享或继续改版 |
| 界面稿与线框图 | 桌面端和移动端画布，低保真到高保真两档，快速验证产品想法 |
| 仪表盘 | 指标卡、趋势图、明细区组合，同一份数据可出演示型和管理型两种版式 |
| 信息图 | 复杂内容压缩成单页，层级、步骤、对比、数字亮点一目了然 |
| 逻辑关系图 | 长文本和论证结构拆解为递进、并列、对比、循环等可视化表达 |
| 交互原型 | 可点击的 HTML 原型，支持页面跳转和状态切换，浏览器打开就能演示 |

**渲染层基于 HTML/CSS/SVG/JS**
核心链路不依赖外部图片生成服务。交付物是标准 Web 技术栈，你能改、能嵌入、能二次开发。

**多格式导出**
主交付是 HTML + PPTX，同时支持 PDF、PNG、SVG。同一份内容，演示用 HTML，归档用 PDF，编辑用 PPTX，传播用 PNG。

---

## Slop 黑名单：干掉 AI 味

这是 Claw Design 的差异化杀手锏。

市面上 AI 设计工具的通病：生成的东西一眼就能看出是 AI 做的。紫蓝渐变背景、emoji 当图标、所有按钮都是药丸形、千篇一律的三列推荐语卡片、到处都是毛玻璃效果……

Claw Design 内置 20+ 条 Slop 检测规则，在交付前自动扫描产物，命中即阻断重做：

- `generic-purple-gradient` — 紫蓝渐变大面积背景
- `emoji-as-icon` — 用 emoji 代替专业图标
- `glassmorphism-overuse` — 毛玻璃效果滥用
- `all-pill-buttons` — 所有按钮都是药丸形
- `uniform-card-grid` — 千篇一律的等尺寸卡片网格
- `generic-hero-layout` — "大标题 + 副标题 + CTA 居中"的万能首屏
- `dark-neon-combo` — 深色背景配霓虹色的赛博朋克审美
- `centered-everything` — 全页面居中对齐，毫无层级变化
- ……以及更多

severity=block 的规则命中后，系统自动重新生成（最多 3 次），并在 prompt 中注入规避指导。你也可以自定义规则、禁用内置规则、调整严重级别：

```bash
npx claw-design slop-list          # 查看当前生效的全部规则
```

结果：交付物看起来像人做的，拿得出手。

---

## 30 秒快速体验

前提：Node.js 18+。

```bash
# 直接生成一个演示文稿
npx @self-evolving-harness/claw-design generate "帮我做一个关于AI趋势的演示文稿"
```

默认输出到 `./output/`，打开这两个文件：
- `output/index.html` — 浏览器直接看
- `output/output.pptx` — 可编辑版本

更多用法：

```bash
# 生成架构图
npx @self-evolving-harness/claw-design generate "微服务系统架构图" -o ./my-output

# 生成数据仪表盘
npx @self-evolving-harness/claw-design generate "Q2 营收数据仪表盘，营收 1200 万，环比增长 15%"

# 查看帮助
npx @self-evolving-harness/claw-design --help
```

---

## 接入项目

```bash
npm install @self-evolving-harness/claw-design
```

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

---

## 使用场景

**方案汇报 / 客户演示**
内容写好了，周五下午一句话变成演示文稿。HTML 在线演示，PPTX 留给客户编辑，PDF 归档备查。

**数据报告 / 经营分析**
每月的数据跑出来后，直接生成图表、仪表盘或信息图。不用再开 Excel 拖图表、截图、贴 PPT。

**技术文档可视化**
系统说明变架构图，业务规则变流程图，API 调用链变时序图。给新人看、给客户讲、写文档用。

**产品构想验证**
想法阶段就能出可点击的交互原型，不用等设计排期。验证完再决定要不要正式投入。

**活动运营 / 品牌传播**
活动信息变海报，产品介绍变落地页，品牌内容变宣传图。急活当天就能交。

**团队缺设计资源**
没有专职设计师的小团队，日常交付靠这个兜底。质量门禁保证产出不翻车。

---

## 文档索引

- 产品规格：`docs/product-requirements.md`
- 示例代码：`examples/demo.ts`
- 命令行入口：`src/cli/index.ts`
- 公开 API：`src/index.ts`

## 许可证

MIT
