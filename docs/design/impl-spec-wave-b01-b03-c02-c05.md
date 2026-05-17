# Claw Design - 实现规格:FR-B01/B03/C02/C04/C05 Gap 补全

OpenClaw(pm-01 子Agent)| 2026-05-16

---

## 1. 范围与现状

本规格覆盖 L2 gap scan 发现的 5 个 AC 未完全覆盖的 FR。所有 FR 已有基础实现,本轮目标是补全 AC 差距。

| FR | 名称 | 实现文件 | AC 覆盖状态 |
|----|------|----------|-------------|
| FR-B01 | 演示文稿生成 | `src/execution/slides-skill.ts` | AC1 部分、AC2 未覆盖、AC3 未覆盖 |
| FR-B03 | 架构图生成 | `src/execution/arch-diagram-skill.ts` | AC1 部分、AC2 未覆盖、AC3 ✅ |
| FR-C02 | PPTX 可编辑导出 | `src/export/export-adapter.ts` | AC1 部分、AC2 ✅、AC3 部分 |
| FR-C04 | PDF 导出 | `src/packaging/pdf-exporter.ts` | AC1 ✅、AC2 ✅、AC3 ✅ |
| FR-C05 | PNG/SVG 导出 | `src/packaging/image-exporter.ts` | AC1 ✅、AC2 ✅、AC3 ✅ |

结论:FR-C04 和 FR-C05 已满足所有 AC,仅需补充测试。核心开发工作集中在 FR-B01、FR-B03、FR-C02。

---

## 2. FR-B01:演示文稿生成 - Gap 补全

### 2.1 当前实现分析

文件:`src/execution/slides-skill.ts`

已有能力:
- 解析用户输入提取主题和章节
- 生成多页 HTML slide deck(title + content + summary)
- ThemePack CSS 变量驱动样式
- 960×540 固定尺寸 slide 容器
- `page-break-after: always` 支持打印分页

### 2.2 AC 差距

| AC | 要求 | 差距 |
|----|------|------|
| AC1 | 支持标题页、目录页、正文页、对比页、图表页、总结页 | 缺少 TOC 页、对比页、图表页 |
| AC2 | 主结果支持稳定翻页和连续浏览 | 仅滚动浏览,无翻页模式切换 |
| AC3 | 导出结果保留可编辑文本和主要版式关系 | 无 `data-slide-type`/`data-slide-index` 语义属性 |

### 2.3 实现方案

#### 2.3.1 新增页面类型(AC1)

在 `buildSlideOutline` 函数中增加三种 slide 类型的生成逻辑:

**TOC 页**:当 slides 数量 ≥ 5 时,在标题页后插入目录页。
```typescript
function renderTocSlide(sections: string[]): string {
  // 渲染为编号列表,每项对应后续 slide 标题
}
```

**对比页**:当输入包含对比关键词(vs、对比、比较、优劣、差异)时生成。
```typescript
function renderComparisonSlide(title: string, leftItems: string[], rightItems: string[]): string {
  // 左右双栏布局,各含标题+要点列表
}
```

**图表页**:当输入包含数字数据(百分比、金额、数量)时生成。
```typescript
function renderChartSlide(title: string, data: Array<{label: string; value: number}>): string {
  // 内嵌 SVG 柱状图或饼图
}
```

#### 2.3.2 双模式浏览(AC2)

支持两种浏览模式共存,默认连续滚动,可切换到翻页模式:

**模式定义**:
- **连续滚动模式(默认)**:所有 slide 垂直排列,用户滚动浏览,与当前实现一致
- **翻页模式**:单页全屏展示,键盘/点击翻页

**模式切换**:
- 通过 `context.viewMode` 参数控制初始模式:`'scroll'`(默认)| `'paginated'`
- HTML 内嵌切换按钮,用户可运行时切换

**HTML 结构兼容性约束**:两种模式共用同一 HTML 结构(`.slide` section 列表),仅通过 CSS class 切换展示方式,不改变 DOM。

在 HTML 底部注入双模式 JS:
```typescript
const NAVIGATION_SCRIPT = `
<style>
  /* 连续滚动模式(默认) */
  body.mode-scroll .slide {
    display: block;
    width: 960px;
    max-width: 100%;
    margin: 24px auto;
  }
  /* 翻页模式 */
  body.mode-paginated .slide {
    display: none;
    width: 100vw;
    height: 100vh;
    max-width: 960px;
    max-height: 540px;
    margin: auto;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  body.mode-paginated .slide.active { display: block; }
  /* 打印:始终显示所有页,每页分页 */
  @media print {
    .slide {
      display: block !important;
      position: static !important;
      transform: none !important;
      width: 100% !important;
      height: auto !important;
      margin: 0 !important;
      page-break-after: always;
    }
    .slide:last-child { page-break-after: avoid; }
    #slide-indicator, #mode-toggle { display: none !important; }
  }
</style>
<noscript>
  <style>
    /* JS 禁用时:所有页面可见,垂直排列 */
    .slide { display: block !important; position: static !important; transform: none !important; width: 960px; max-width: 100%; margin: 24px auto; }
    #slide-indicator, #mode-toggle { display: none !important; }
  </style>
</noscript>
<script>
(function() {
  var viewMode = '{{VIEW_MODE}}';
  var slides = document.querySelectorAll('.slide');
  var current = 0;
  function setMode(mode) {
    viewMode = mode;
    document.body.className = 'mode-' + mode;
    if (mode === 'paginated') { showSlide(current); }
    updateToggle();
  }
  function showSlide(index) {
    slides.forEach(function(s, i) { s.classList.toggle('active', i === index); });
    updateIndicator();
  }
  function updateIndicator() {
    var el = document.getElementById('slide-indicator');
    if (el) el.textContent = viewMode === 'paginated' ? (current + 1) + ' / ' + slides.length : '';
  }
  function updateToggle() {
    var btn = document.getElementById('mode-toggle');
    if (btn) btn.textContent = viewMode === 'scroll' ? '切换翻页' : '切换滚动';
  }
  function next() { if (current < slides.length - 1) { current++; showSlide(current); } }
  function prev() { if (current > 0) { current--; showSlide(current); } }
  document.addEventListener('keydown', function(e) {
    if (viewMode !== 'paginated') return;
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
  });
  document.addEventListener('click', function(e) {
    if (viewMode !== 'paginated') return;
    if (e.target.id === 'mode-toggle') return;
    var x = e.clientX / window.innerWidth;
    if (x > 0.6) next();
    else if (x < 0.4) prev();
  });
  // 切换按钮
  var toggle = document.createElement('button');
  toggle.id = 'mode-toggle';
  toggle.style.cssText = 'position:fixed;bottom:16px;left:24px;padding:6px 12px;font-size:13px;cursor:pointer;z-index:999;border:1px solid #ccc;border-radius:4px;background:#fff;';
  toggle.addEventListener('click', function() { setMode(viewMode === 'scroll' ? 'paginated' : 'scroll'); });
  document.body.appendChild(toggle);
  setMode(viewMode);
})();
</script>
<div id="slide-indicator" style="position:fixed;bottom:16px;right:24px;font-size:14px;color:#666;z-index:999;"></div>
`;
```

`{{VIEW_MODE}}` 在生成时替换为 `context.viewMode ?? 'scroll'`。

**打印/导出兼容性约束**:
- `@media print` 规则确保打印时所有 slide 可见并逐页分页,不受当前浏览模式影响
- `<noscript>` fallback 确保 JS 禁用环境下所有页面以滚动方式可见
- 翻页模式使用 CSS class `.active` 控制可见性(非 inline `display:none`),配合 print 媒体查询覆盖

#### 2.3.3 语义属性(AC3)

每个 slide section 添加:
```html
<section class="slide" data-slide-type="title|toc|content|comparison|chart|summary" data-slide-index="1">
```

这些属性供 ExportAdapter 解析,实现结构化 PPTX 映射。

### 2.4 文件变更

```
src/execution/slides-skill.ts  - 修改:增加页面类型 + 翻页 JS + 语义属性
```

---

## 3. FR-B03:架构图生成 - Gap 补全

### 3.1 当前实现分析

文件:`src/execution/arch-diagram-skill.ts`

已有能力:
- 解析输入提取组件名称
- 构建节点/边图结构
- 渲染 SVG(矩形节点 + 贝塞尔曲线连线 + 箭头标记)
- ThemePack CSS 变量驱动
- 最多 6 个节点,2 行 3 列布局

### 3.2 AC 差距

| AC | 要求 | 差距 |
|----|------|------|
| AC1 | 节点、分组、连接关系和层级关系清晰可读 | 无分组支持,布局固定 2×3,无层级表达 |
| AC2 | 支持浅色和深色两种展示主题 | 仅浅色主题 |
| AC3 | 关键图形优先保留矢量表达能力 | ✅ 已满足(纯 SVG) |

### 3.3 实现方案

#### 3.3.1 分组与层级支持(AC1 增强)

增加分组识别逻辑:
```typescript
interface ArchGroup {
  id: string;
  label: string;
  nodeIds: string[];
}

function extractGroups(input: string): ArchGroup[] {
  // 识别"层""区""模块""服务组"等关键词
  // 例如:"前端层:Web、App;后端层:API、Worker;数据层:MySQL、Redis"
  // 按冒号/括号分组
}
```

增强布局算法:
- 支持按 group 分区排列(每组一个虚线边框区域)
- 组内节点水平排列,组间垂直排列
- 最大节点数从 6 提升到 12
- 连线避让分组边界

SVG 渲染增加分组边框:
```typescript
function renderGroupBoundary(group: ArchGroup, nodes: ArchNode[]): string {
  // 计算组内节点 bounding box
  // 渲染虚线圆角矩形 + 组标签
}
```

#### 3.3.2 深色主题(AC2)

增加 CSS 变量集合切换:
```typescript
const DARK_THEME_VARS = `
  --arch-surface: #1a1f2e;
  --arch-border: #2d3548;
  --arch-text: #e2e8f0;
  --arch-muted: #94a3b8;
  --arch-edge: #64748b;
`;

const LIGHT_THEME_VARS = `
  --arch-surface: #ffffff;
  --arch-border: #d7dfec;
  --arch-text: #122033;
  --arch-muted: #5d6b82;
  --arch-edge: #5b6478;
`;
```

在 `generate` 方法中根据 `context.themeMode` 选择变量集:
```typescript
const themeMode = (context as any).themeMode ?? 'light';
const themeVars = themeMode === 'dark' ? DARK_THEME_VARS : LIGHT_THEME_VARS;
```

节点填充色也需要深色变体:
```typescript
const DARK_COLORS = ['#1e3a5f', '#1a3d2e', '#3d2e1a', '#3d1a2e', '#2e1a3d', '#1a2e3d'];
const LIGHT_COLORS = ['#dbeafe', '#dcfce7', '#fef3c7', '#fce7f3', '#ede9fe', '#e0f2fe'];
```

### 3.4 文件变更

```
src/execution/arch-diagram-skill.ts  - 修改:增加分组+层级+深色主题
```

---

## 4. FR-C02:PPTX 可编辑导出 - 结构化增强

### 4.1 当前实现分析

文件:`src/export/export-adapter.ts` + `src/export/pptx-fallback.ts`

已有能力:
- pptxgenjs 生成标准 PPTX
- 每个 `<section>` 提取纯文本放到一个 slide
- 复杂页面走 fallback(SVG 图片嵌入)
- fallback 页面标注原因

### 4.2 AC 差距

| AC | 要求 | 差距 |
|----|------|------|
| AC1 | 保留可编辑文本、块级结构和主要图形关系 | 仅纯文本,无标题/列表/分栏结构 |
| AC2 | 能被常见办公工具打开 | ✅ 已满足 |
| AC3 | 用户可继续做文字和版式微调 | 文本可编辑但无层级结构 |

### 4.3 实现方案

新增文件 `src/export/pptx-structure-parser.ts`:

```typescript
export interface PptxBlock {
  type: 'heading' | 'paragraph' | 'bullet-list' | 'ordered-list';
  text: string;
  level?: number;       // heading: 1-6, list: indent level
  items?: string[];     // list items
  bold?: boolean;
}

export interface PptxSlideBlocks {
  index: number;
  slideType: string;    // from data-slide-type attribute
  title: string;        // from first heading or data-slide-type
  blocks: PptxBlock[];
}

/**
 * Parse HTML sections into structured blocks for PPTX generation.
 * Reads data-slide-type and data-slide-index attributes when available.
 */
export function parseHtmlToSlideBlocks(html: string): PptxSlideBlocks[];
```

解析规则:
- `<h1>`-`<h3>` → `heading` block(fontSize 按 level 递减:36/28/24)
- `<p>` → `paragraph` block(fontSize 16)
- `<ul>/<ol>` → `bullet-list`/`ordered-list` block(带 items 数组)
- `<li>` 嵌套 → indent level +1
- 其他元素 → 提取 textContent 作为 paragraph

修改 `export-adapter.ts` 的 `generatePptx` 方法:

```typescript
// 替换当前的纯文本 addText 逻辑
for (const page of parsedPages) {
  const slide = pptx.addSlide();

  if (page.slideType === 'comparison') {
    // 双栏布局
    this.renderComparisonSlide(slide, page);
  } else {
    // 标准布局:标题区 + 内容区
    let yOffset = 0.5;
    for (const block of page.blocks) {
      yOffset = this.renderBlock(slide, block, yOffset);
    }
  }
}
```

Block 渲染映射:
- `heading` → `addText` with bold, fontSize 28-36, y=0.5
- `paragraph` → `addText` with fontSize 16, wrap=true
- `bullet-list` → `addText` with bullet=true, indentLevel per nesting
- `ordered-list` → `addText` with bullet={type:'number'}

### 4.4 文件变更

```
src/export/pptx-structure-parser.ts  - 新增:HTML 结构解析器
src/export/export-adapter.ts         - 修改:使用结构化解析替代纯文本
src/export/index.ts                  - 修改:导出新模块
```

---

## 5. FR-C04 & FR-C05:验证与测试补全

### 5.1 FR-C04 PDF 导出

当前实现已满足所有 AC。需补全测试:
- `injectPrintStyles` 正确注入 `@media print` CSS
- Playwright 不可用时返回 `pdfPath: null`
- `estimatePageCount` 与 section 数一致

### 5.2 FR-C05 PNG/SVG 导出

当前实现已满足所有 AC。需补全:
- 多页 artifact PNG 导出增强(当前仅单页)
- SVG 提取正确性测试(xmlns + XML 声明)

增强方案:修改 `image-exporter.ts` 的 `capturePngs` 方法,移除 `pages !== 1` 限制,改为逐 section 截图。

---

## 6. 实现计划

```
Wave 1(核心 Skill 增强,可并行):
  ├── Task A: slides-skill.ts 增强(TOC/对比/图表页 + 翻页JS + 语义属性)
  └── Task B: arch-diagram-skill.ts 增强(分组+层级+深色主题)

Wave 2(Export 增强,依赖 Wave 1 的语义属性):
  └── Task C: PPTX 结构化导出(新增 parser + 修改 adapter)

Wave 3(测试补全,可并行):
  ├── Task D: PDF 导出测试
  └── Task E: PNG/SVG 多页增强 + 测试
```

预估工作量:
- Task A: ~200 行新增/修改
- Task B: ~150 行新增/修改
- Task C: ~250 行新增/修改(含新文件)
- Task D: ~50 行测试
- Task E: ~80 行修改+测试

---

## 7. 技术约束

- 零外部依赖新增:使用项目已有的 pptxgenjs、jszip
- 零模态依赖:图表页使用 SVG 代码渲染,不调用图片生成 API
- Provider 模式保持:fallback plan 为基础能力,LLM provider 为可选增强
- 向后兼容:现有 API 签名不变,新增功能通过 context 参数控制
- TypeScript strict mode

---

## 8. 验收标准

### FR-B01 验收
- [ ] 输入“帮我做一个关于 AI 发展的 PPT，包含背景、技术、应用、展望”生成 ≥6 页
- [ ] 生成结果包含 TOC 页（slides ≥ 5 时自动插入）
- [ ] 输入含“对比”关键词时生成双栏对比页
- [ ] 输入含数字数据时生成图表页（SVG 柱状图/饼图）
- [ ] 默认以连续滚动模式展示所有 slide
- [ ] 点击切换按钮后进入翻页模式，可用键盘左右键翻页
- [ ] 翻页模式下页码指示器显示当前页/总页数
- [ ] 浏览器打印（Ctrl+P）输出所有页面，每页独立分页
- [ ] JS 禁用时所有 slide 以滚动方式可见（noscript fallback）
- [ ] 每个 section 带 `data-slide-type` 和 `data-slide-index` 属性

### FR-B03 验收
- [ ] 输入"前端层:Web、App;后端层:API、Worker;数据层:MySQL、Redis"生成分组架构图
- [ ] 分组有虚线边框和标签
- [ ] 传入 `themeMode: 'dark'` 时背景为深色、文字为浅色
- [ ] SVG 可被 ImageExporter 提取为独立 .svg 文件

### FR-C02 验收
- [ ] PPTX 中标题使用大字号 + 粗体(区别于正文)
- [ ] PPTX 中列表保留 bullet 符号和缩进
- [ ] 对比页在 PPTX 中呈现左右分栏
- [ ] 文本可选中、可编辑、可修改

### FR-C04 验收
- [ ] 单元测试通过(print CSS 注入、降级处理、页数估算)

### FR-C05 验收
- [ ] 多页 artifact 可逐页导出 PNG
- [ ] SVG 文件包含 xmlns 和 XML 声明
- [ ] 单元测试通过

---

## 9. 测试策略

每个增强需要:
1. 单元测试:新增渲染函数的输入/输出验证
2. 集成测试:Skill.generate() 端到端调用,验证 HTML 结构
3. 回归测试:确保已有功能不受影响(现有测试全部通过)

测试文件位置:`__tests__/` 或 `tests/` 目录,与源文件对应。
