# ADR-001: HTML 作为主格式 + PPTX 双轨输出

**日期**:2026-04-19
**状态**:accepted
**决策者**:OpenClaw(sa-01 子Agent)

## 上下文(Context)

Claw Design 需要一种主表达格式来承载所有设计产物。用户同时需要“可演示”和“可编辑”两种交付形态。系统约束要求零模态依赖、跨平台可用、结果可审查可复用。

核心矛盾:PPTX 原生编辑能力强但渲染表达受限,HTML 渲染自由度高但不直接可编辑。需要在两者之间找到架构平衡点。

## 备选方案(Options Considered)

### 方案 A:HTML 主格式 + PPTX 派生

- 描述:所有产物先生成 HTML,再通过 Export Adapter 派生 PPTX/PDF/PNG 等格式
- 优点:HTML 渲染自由度最高,CSS/SVG/Mermaid 原生支持,浏览器直接预览,zip 打包即可分享
- 缺点:HTML→PPTX 映射存在信息损失,复杂版式可能需要图片回退
- 成本/复杂度:需要维护 Export Adapter 层和回退策略

### 方案 B:PPTX 原生生成

- 描述:直接用 PptxGenJS 生成 PPTX 作为主格式
- 优点:编辑能力天然满足,企业用户熟悉
- 缺点:PptxGenJS 渲染能力有限(无 CSS 动画、SVG 受限、布局约束多),难以支撑架构图/海报/Landing Page 等复杂产物
- 成本/复杂度:每种产物都要适配 PPTX 布局限制

### 方案 C:双主格式并行

- 描述:HTML 和 PPTX 各自独立生成,不存在派生关系
- 优点:各自发挥最大能力
- 缺点:维护成本翻倍,一致性难保证,每个 Skill 要写两套生成逻辑
- 成本/复杂度:极高,与 solo founder + AI agents 的资源约束冲突

## 决策(Decision)

选择方案 A:HTML 作为主格式,PPTX 通过 Export Adapter 派生。

理由:
- HTML 是唯一能同时覆盖十类产物渲染需求的格式
- CSS 自定义属性天然支持 Theme Pack 变量注入
- 零模态依赖约束下，CSS/SVG/JS 是主要视觉实现手段，HTML 是其原生宿主
- 回退策略(FR-C03)可控制 PPTX 信息损失在可接受范围内

## 后果(Consequences)

### 正面
- 统一主格式简化管线架构,所有 Skill 只需输出 HTML
- 浏览器即预览器,开发调试效率高
- zip 打包即可分享,零部署成本

### 负面
- HTML→PPTX 映射层需要持续维护和优化
- 复杂页面可能触发图片回退,降低可编辑性

### 风险
- PPTX 可编辑率目标 ≥ 90%(NFR-03),需要早期验证映射质量
- 缓解:FR-C03 回退策略 + Quality Gate L1 导出检查(FR-D06)

## 关联

- 关联需求:AC-02, FR-C01, FR-C02, FR-C03, NFR-03, NFR-06
- 关联 ADR：ADR-004（零模态依赖视觉实现依赖 HTML/CSS/SVG/JS 能力）
- 关联文档:`docs/product-requirements.md`
