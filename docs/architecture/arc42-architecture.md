# Claw Design - arc42 架构文档

Claude Code(OpenClaw ACP Agent)| 2026-04-19

---

## 1. 引言与目标

### 1.1 需求概述

Claw Design 是一个 AI 设计引擎,用户用一句自然语言触发完整设计流程,产出演示文稿、图表、架构图等 10 余种设计产物。核心交付形态为 HTML(可演示)+ PPTX(可编辑)双结果。

### 1.2 质量目标

| 优先级 | 质量属性 | 目标 |
|--------|---------|------|
| 1 | 路由准确性 | 意图识别准确率 ≥ 90% |
| 2 | 交付可靠性 | 假交付率 = 0,100% 形成明确质量结论 |
| 3 | 可编辑性 | PPTX 文本可编辑率 ≥ 90% |
| 4 | 性能 | 路由 ≤ 3s,单页首稿 ≤ 30s,质量门禁 ≤ 10s |
| 5 | 可扩展性 | 新 Skill 接入 ≤ 1 人天 |
| 6 | 成本可控 | 零模态依赖：文本 LLM 是唯一必要 AI 依赖，模态模型均为可选增强项 |

### 1.3 利益相关者

| 角色 | 关注点 |
|------|--------|
| 内容创作者(产品负责人、咨询顾问、销售、市场运营) | 一句话出稿,结果可演示可编辑可交付 |
| 设计资源有限的创业团队 | 零设计师也能产出商业级交付物 |
| Agent 开发者 | 通过标准接口调用设计能力 |
| Skill 贡献者 | 按统一合同扩展新设计类型 |
| 设计系统维护者 | 主题、模板、组件资产的治理和复用 |

## 2. 约束

### 2.1 技术约束

| 约束 | 来源 | 影响 |
|------|------|------|
| HTML 为主表达格式 | AC-02 | 所有 Skill 输出 HTML,其他格式通过 Export Adapter 派生 |
| 零模态依赖 | AC-03, NFR-12 | 渲染层基于 HTML/CSS/SVG/JS，文本 LLM 为唯一必要 AI 依赖，模态模型可选增强 |
| 分发包 ≤ 50MB | NFR-06 | 不能内置大量图片素材 |
| 跨平台可用 | NFR-06 | 核心运行零平台专属依赖 |
| CJK 渲染准确率 ≥ 99% | NFR-09 | 字体和排版需要专门处理 |

### 2.2 组织约束

| 约束 | 影响 |
|------|------|
| Solo founder + AI agents 团队结构 | 架构必须简单,维护成本低 |
| 开源核心 + 增强层商业化 | 核心功能不能依赖付费服务 |
| 独立产品边界 | 可 `clawhub install claw-design` 独立发布 |

### 2.3 惯例约束

| 约束 | 影响 |
|------|------|
| OpenClaw skill 生态惯例 | Skill 用 YAML frontmatter 声明能力 |
| 路由优先架构 | 先理解任务再选能力再生成(AC-01) |
| 质量门禁先于交付 | 阻断项未清除不能交付(AC-05) |
| Theme Pack 先于生成 | 主题上下文在生成前确定(AC-04) |

## 3. 上下文与范围

### 3.1 业务上下文

```
                    ┌─────────────────────────────────────┐
                    │           Claw Design                │
  用户 ────────────▶│  自然语言 → 意图路由 → 设计生成      │────────▶ 交付包
 (自然语言需求)      │  → 质量门禁 → 格式导出 → 打包交付    │   (HTML + PPTX + ...)
                    └──────────┬──────────────┬────────────┘
                               │              │
                    ┌──────────▼──┐    ┌──────▼──────────┐
                    │  宿主环境    │    │  LLM 服务       │
                    │ (OpenClaw/  │    │ (意图识别/      │
                    │  CLI/其他)  │    │  内容生成)      │
                    └─────────────┘    └─────────────────┘
```

外部参与者:

| 参与者 | 输入/输出 | 说明 |
|--------|----------|------|
| 用户 | 自然语言需求、附件、品牌素材 → 交付包 | 通过宿主环境间接交互 |
| 宿主环境 | 原始输入 → DesignRequest;DeliveryBundle → 渠道分发 | OpenClaw 优先,CLI 通用回退 |
| LLM 服务 | Intent Packet、Theme Pack、Artifact 内容 | 宿主提供的 LLM,非 Claw Design 自带 |

### 3.2 技术上下文

```
┌──────────────────────────────────────────────────────────────┐
│                        宿主环境                               │
│  ┌─────────────┐                          ┌───────────────┐  │
│  │ Host Adapter │◀── adapt/clarify/deliver ──▶│ Claw Design │  │
│  │ (OpenClaw/   │                          │   Core        │  │
│  │  CLI/...)    │                          └───────────────┘  │
│  └─────────────┘                                              │
│        │                                         │            │
│        ▼                                         ▼            │
│  ┌───────────┐                            ┌───────────┐      │
│  │ 用户渠道   │                            │ 文件系统   │      │
│  │ (飞书/Web/ │                            │ (交付包    │      │
│  │  Terminal) │                            │  输出目录) │      │
│  └───────────┘                            └───────────┘      │
└──────────────────────────────────────────────────────────────┘
```

技术接口:

| 接口 | 协议 | 说明 |
|------|------|------|
| Host Adapter → Core | TypeScript 函数调用 | adapt / clarify / deliver 三方法 |
| Core → 文件系统 | Node.js fs | 交付包写入本地目录 |
| Core → LLM | 宿主透传 | 意图识别和内容生成依赖宿主提供的 LLM 能力 |

## 4. 解决方案策略

### 4.1 核心策略

| 策略 | 动机 | 实现方式 |
|------|------|---------|
| 路由优先 | 先理解再生成,避免盲目出稿 | Intent Router 基于 Skill Contract 做能力匹配 |
| HTML 主格式 + PPTX 双轨 | 同时满足演示和编辑需求 | HTML 为唯一生成格式,PPTX 通过 Export Adapter 派生 |
| 零模态依赖 | 成本可控,结果确定 | CSS 渲染 + SVG 图形 + Mermaid 图表,模态模型可选增强 |
| 声明式 Skill 合同 | 新能力零代码接入 | YAML frontmatter 声明能力,目录扫描自动发现 |
| 三层质量门禁 | 快速检查 + 深度可选 | L1 规则引擎 + L2 DOM 检查 + L3 可选 LLM |
| 宿主适配层 | 核心逻辑与环境解耦 | Host Adapter 模式,三方法接口 |

### 4.2 技术选型

| 层面 | 选型 | 理由 |
|------|------|------|
| 运行时 | Node.js (TypeScript) | 与 OpenClaw 生态一致,HTML/CSS 处理原生支持 |
| 视觉渲染 | CSS + SVG + Mermaid | 零外部依赖,矢量输出,Theme Pack 变量注入 |
| PPTX 生成 | PptxGenJS | 已有 lovstudio-any2deck 可复用 |
| DOM 检查 | cheerio | 轻量 HTML 解析,无需浏览器环境 |
| 主题注入 | CSS 自定义属性 | 原生支持级联和覆盖 |

### 4.3 已有可复用 Skill

| Skill | 复用点 |
|-------|--------|
| html-ppt-skill | 演示文稿 HTML 生成(36 主题 × 31 布局 × 20 特效) |
| chart-craft-plus | 图表生成(35+ 种图表类型) |
| architecture-diagram-zh | 架构图生成(HTML/SVG,明暗双主题) |
| mermaid-generator | 流程图/时序图/类图 |
| anthropic-pptx | PPTX 读取/编辑/创建 |
| lovstudio-any2deck | PPTX 生成(16 种视觉风格) |

## 5. 构建块视图

### 5.1 系统层级 1:六域总览

```
┌─────────────────────────────────────────────────────────────────┐
│                        Claw Design Core                         │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌───────────────┐  │
│  │ Routing  │─▶│ Template │─▶│ Rendering │─▶│   Quality     │  │
│  │  域      │  │  域      │  │   域      │  │    域         │  │
│  └──────────┘  └──────────┘  └───────────┘  └───────┬───────┘  │
│                                                      │          │
│                                              ┌───────▼───────┐  │
│                                              │  Packaging    │  │
│                                              │    域         │  │
│                                              └───────────────┘  │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              Skill Extension 域(生态扩展)                     ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Host Adapter 域                           ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 域职责与边界

#### 5.2.1 Routing 域(意图路由)

职责:理解用户要什么、缺什么、该走哪条链路。

| 模块 | 职责 |
|------|------|
| IntentClassifier | 通过 LLM 语义推理从自然语言识别主交付物类型和附属交付物。主路径为 LLM 推理，关键词匹配仅作为无 LLM 环境的降级 fallback（ADR-006） |
| GapDetector | 识别需求缺口,生成结构化澄清清单 |
| ClarificationEngine | 全阶段意图模糊检测与结构化提问引擎,单阶段最多 2 轮澄清(FR-A09) |
| ContextCollector | 识别和收束品牌素材、历史稿件、参考样式等上下文 |
| SkillRouter | 读取 Skill Contract,按产物类型匹配可执行 Skill |

LLM 意图理解机制（ADR-006）:
- IntentClassifier 主路径通过 `IntentClassifierProvider` 接口调用 LLM 做语义意图分类
- LLM 接收用户输入 + 所有已注册 Skill 的描述（name + description + applicableScenes），返回产物类型 + 置信度
- 宿主通过 `IntentClassifierProvider` 注入 LLM 能力，Claw Design 不绑定具体 LLM 实现
- 无 LLM 环境降级为 `KeywordFallbackClassifier`，IntentPacket 携带 `degraded: true` 标记
- 术语纪律："意图路由""意图理解"特指 LLM 语义泛化，关键词匹配不属于此范畴

输入:DesignRequest(经 Host Adapter 标准化后的用户需求)
输出:IntentPacket(主产物类型、附属产物、缺口清单、已采纳上下文、匹配的 Skill 列表、degraded 标记）

边界规则:
- Routing 域只做判断和匹配,不做内容生成。
- 置信度不足时返回候选和澄清建议,不进入生成链路。
- SkillRouter 只在满足合同条件的 Skill 范围内选择。
- ClarificationEngine 在 routing / execution / quality 三阶段均可触发,每阶段最多 2 轮提问,超限后采用默认值继续推进。
- 澄清接口以工具化形式输出(questions_v2 机制),宿主通过 Host Adapter 消费并回填答案。

增强模块:

| 模块 | 职责 | 对应 FR |
|------|------|------|---------|
| CompositeIntentSplitter | 从单条请求中拆分多个设计意图,输出意图依赖图(DAG),标注执行顺序和嵌入关系 | FR-A05 |
| CoProductionOrchestrator | 按意图依赖图编排多 Skill 并行/串行执行,共享 ThemePack 和信息主线,输出联产清单 | FR-A06 |
| RouteExplainer | 将路由结论翻译为业务用户可读的说明(主产物、附属产物、缺口、已采纳上下文、计划触发的门禁类型),支持用户触发重新路由 | FR-A07 |
| PipelineTracer | 关联记录路由→澄清→生成→质量→交付全链路事件,写入 `output/<task-id>/.trace/`,支持失败归因分类(路由误判/上下文缺失/模板不匹配/导出问题) | FR-A08 |

CompositeIntentSplitter 接口:

```typescript
interface IntentGraph {
  nodes: IntentNode[];       // 每个节点对应一个设计意图
  edges: IntentEdge[];       // 依赖关系(嵌入/前置/独立)
}
interface IntentNode {
  intentId: string;
  productType: string;       // 产物类型
  role: 'primary' | 'subsidiary';
  embeddedIn?: string;       // 嵌入型意图的宿主 intentId
}
interface IntentEdge {
  from: string;              // 前置意图 intentId
  to: string;                // 后续意图 intentId
  relation: 'depends_on' | 'embedded_in' | 'independent';
}
```

CoProductionOrchestrator 编排规则:
- independent 关系的意图可并行执行
- depends_on 关系的意图严格串行,前置产物作为后续 Skill 的输入上下文
- embedded_in 关系的意图在宿主意图生成后执行,产出嵌入宿主 Artifact 的指定位置
- 所有意图共享同一份 ThemePack,联产结果标注用途、推荐使用场景和建议使用顺序

RouteExplainer 输出结构:

```typescript
interface RouteExplanation {
  summary: string;           // 一句话说明本次任务走哪条链路
  primaryProduct: string;    // 主交付物类型
  subsidiaryProducts: string[];  // 附属交付物
  keyGaps: string[];         // 关键缺口
  adoptedContext: string[];  // 已采纳的上下文
  qualityGateTypes: string[];// 计划触发的门禁类型
  rerouteHint: string;       // 用户可触发重新路由的操作说明
}
```

PipelineTracer 失败归因分类:

| 归因类型 | 判定条件 | 可复盘信息 |
|----------|----------|------------|
| route_mismatch | 用户纠偏或重新路由 | 原始意图 vs 路由结论 |
| context_missing | 生成阶段因上下文不足降级 | 缺失的上下文字段 |
| template_mismatch | 模板骨架与内容不匹配 | 选中模板 vs 实际内容结构 |
| export_failure | 导出阶段失败或回退 | 失败页面和回退原因 |
| quality_block | 质量门禁阻断 | 阻断项清单 |

ClarificationEngine 结构化接口契约:

```typescript
// --- 输入 ---
interface ClarificationInput {
  stage: 'routing' | 'execution' | 'quality';
  round: number;           // 当前轮次(1-based,上限 2)
  gaps: ClarificationGap[];
  context: IntentPacket | ArtifactSpec | QualityReport; // 按 stage 不同传入不同上下文
}

interface ClarificationGap {
  gapLevel: 'MUST' | 'SHOULD';
  decisionFactorType: 'audience' | 'style' | 'brand_tone' | 'content_scope' | 'delivery_format' | 'color_preference' | 'info_density' | 'use_case' | 'layout' | 'visual_focus' | 'info_hierarchy';
  description: string;
  defaultValue: string | null;  // null 表示无可用默认值
  defaultPolicy: 'auto_adopt_on_timeout' | 'require_explicit_confirm' | 'skip';
}

// --- 输出 ---
interface ClarificationRequest {
  stage: 'routing' | 'execution' | 'quality';
  round: number;
  questions: ClarificationQuestion[];
  skipCondition: string;   // 用户可发出的跳过指令描述
}

interface ClarificationQuestion {
  id: string;              // 唯一标识,用于回填匹配
  text: string;            // 面向用户的问题文本
  decisionFactorType: ClarificationGap['decisionFactorType'];
  gapLevel: 'MUST' | 'SHOULD';
  defaultValue: string | null;
  options?: string[];      // 可选的预设选项
}

// --- 用户回填 ---
interface ClarificationAnswer {
  questionId: string;
  value: string;           // 用户回答内容
  adoptDefault: boolean;   // true 表示用户确认采用默认值
}

// --- 收敛结果 ---
interface ClarificationResult {
  stage: 'routing' | 'execution' | 'quality';
  totalRounds: number;
  converged: boolean;      // true = 所有 MUST 缺口已填或已采用默认值
  mergedAnswers: Record<string, string>;  // questionId → 最终值
  fallbackApplied: ClarificationFallback[];
  mergeTarget: 'IntentPacket' | 'ArtifactSpec' | 'QualityReport'; // 结果写回哪个对象
}

interface ClarificationFallback {
  questionId: string;
  defaultValueUsed: string;
  reason: 'round_limit_reached' | 'user_skip' | 'timeout';
}

// --- 追踪记录 ---
interface ClarificationTrace {
  taskId: string;
  entries: Array<{
    stage: ClarificationInput['stage'];
    round: number;
    request: ClarificationRequest;
    answers: ClarificationAnswer[];
    result: ClarificationResult;
    timestamp: string;
  }>;
}
```

事件:
- `clarification.started` - 引擎触发时发出,携带 stage + round
- `clarification.answered` - 用户回填后发出,携带 answers
- `clarification.converged` - 收敛判定完成后发出,携带 ClarificationResult
- `clarification.fallback` - 采用默认值时发出,携带 fallback 详情

ClarificationEngine 与 Skill 层的分层职责:

| 层 | 职责 | 提供者 |
|---|------|--------|
| ClarificationEngine(引擎层) | 轮次控制、收敛判定、问题组装、结果合并、trace 记录 | 核心管线内置 |
| ClarificationProvider(内容层) | 按 stage 或 skill 类型提供:澄清模板、决策因素词表、默认值策略、跳过条件 | Skill 层注入 |

引擎层只关心「问几轮、何时收敛、结果写回哪里」,具体「问什么、默认值是什么」由各 Skill 通过 ClarificationProvider 接口注入。新增设计类型时只需实现对应 Provider,无需修改引擎主体。

```typescript
interface ClarificationProvider {
  stage: ClarificationInput['stage'];
  skillType?: string;  // 可选,execution 阶段按 skill 类型区分
  getGapTemplate(): ClarificationGap[];       // 该阶段/skill 的标准缺口模板
  getDecisionFactors(): string[];             // 该阶段关注的决策因素词表
  getDefaultPolicy(gapLevel: 'MUST' | 'SHOULD'): ClarificationGap['defaultPolicy'];
}
```

注入方式:各 Skill 在 SKILL.md frontmatter 中声明 `clarification` 字段,运行时由 SkillExecutor 加载并注册到 ClarificationEngine。routing 阶段的 Provider 由 IntentRouter 内置提供。

#### 5.2.2 Template 域(主题与模板)

职责:管理任务级视觉上下文,为生成链路提供统一风格边界。

| 模块 | 职责 |
|------|------|
| ThemeResolver | 组装 Theme Pack:合并品牌规则、历史风格、任务级要求 |
| BrandExtractor | 从素材中提取品牌线索,形成 Brand Kit |
| TemplateRegistry | 管理预置模板骨架和变体方案 |
| ComponentLibrary | 管理可复用组件资产(标题区、图表容器、封面结构等)(FR-E04) |
| VariantGenerator | 同一内容+主题下生成多种可区分的版式/风格方案,差异体现在信息节奏、版式组织和图形语言上(FR-E03) |
| ThemeConflictResolver | 处理 ThemePack、BrandKit 和任务材料之间的优先关系冲突,输出裁定结果和采用理由(FR-E05) |

输入:IntentPacket 中的上下文信息 + 用户提供的品牌素材
输出:ThemePack(颜色、字体、间距、版式偏好、图形语言)+ 匹配的模板骨架 + 变体方案列表

边界规则:
- Theme Pack 在生成前确定,生成过程必须服从其边界。
- 多来源冲突时输出优先级判断和采用结果。
- 未提供品牌上下文时采用统一基线风格。

模板系统扩展:

VariantGenerator 工作机制(FR-E03):
- 输入:内容结构(ArtifactSpec)+ ThemePack
- 输出:≥ 2 个可区分的变体方案,每个变体包含独立的 LayoutSkeleton + 风格参数
- 变体差异维度:信息节奏(密集/疏朗)、版式组织(网格/流式/卡片)、图形语言(线框/填充/渐变)
- 用户选中变体后,后续增量调整基于该变体的 LayoutSkeleton 进行

ComponentLibrary 资产管理(FR-E04):

```typescript
interface ComponentAsset {
  id: string;                    // 如 'title-block-v1'
  type: 'title' | 'chart-container' | 'cover' | 'comparison' | 'flow' | 'data-card';
  themeAgnostic: boolean;        // true = 可跨主题使用
  html: string;                  // 组件 HTML 模板(含 CSS 自定义属性占位)
  slots: string[];               // 可填充的内容插槽
  version: string;               // 语义化版本号
}
```

- 资产按类型注册到 ComponentLibrary,Skill 通过 `resolveComponent(type)` 获取
- 资产更新后新版本自动生效,旧版本保留供回退
- 跨主题使用时,组件通过 CSS 自定义属性适配不同 ThemePack

ThemeConflictResolver 优先级规则(FR-E05):

| 优先级 | 来源 | 说明 |
|--------|------|------|
| 1(最高) | 任务级显式指令 | 用户在当前任务中明确指定的风格要求 |
| 2 | BrandKit 约束 | 品牌规范中的硬性规则(颜色、字体、标识) |
| 3 | ThemePack 偏好 | 主题包中的风格倾向和版式偏好 |
| 4 | 历史风格 | 从历史稿件中提取的风格线索 |
| 5(最低) | 基线默认值 | 系统内置的默认风格 |

冲突裁定结果写入 IntentPacket.themeConflicts 字段,供后续链路和 trace 日志使用。

#### 5.2.3 Rendering 域(设计生成)

职责:按交付物类型调用对应 Skill,生成 HTML 格式的设计产物。

| 模块 | 职责 |
|------|------|
| SkillExecutor | 调用匹配的 Skill 执行生成,注入 ThemePack 变量 |
| ArtifactBuilder | 组装 Artifact 元数据(状态、页面清单、依赖资源) |
| SharedFoundation | 提供共享能力底座(图形基元、版式骨架、反模式清单) |
| RevisionEngine | 管理 Artifact 增量修订:状态流转(ready→revision→ready)、修订指令解析、差量生成、版本快照(FR-B12) |

内置 Skill:
- SlidesSkill - 演示文稿(复用 html-ppt-skill)
- ChartSkill - 图表与数据可视化(复用 chart-craft-plus)
- ArchDiagramSkill - 架构图(复用 architecture-diagram-zh)
- DashboardSkill - Dashboard 数据看板(复用 chart-craft-plus 的图表能力)
- FlowchartSkill - 流程图与时序图(复用 mermaid-generator,FR-B04)
- InfographicSkill - 信息图(复用 chart-craft-plus 的图表组件能力,FR-B09)
- LandingPageSkill - Landing Page 落地页(复用 html-ppt-skill 的主题与布局能力,FR-B06)
- LogicDiagramSkill - 逻辑关系图(复用 text-logic-diagram,FR-B10)
- MockupSkill - UI mockup 与线框图(复用 html-ppt-skill 的版式骨架能力,FR-B07)
- PosterSkill - 海报与宣传图(复用 lovstudio-event-poster,FR-B05)
- PrototypeSkill - 交互原型(FR-B13):生成可点击、有状态切换、有页面路由的 HTML 交互原型

Skill 继承体系(SharedFoundation / SkillBase):

所有 Design Skill 继承自 `SkillBase` 抽象类,SkillBase 由 SharedFoundation 模块提供(FR-B11)。

```typescript
abstract class SkillBase {
  // SharedFoundation 提供的共享能力
  protected themeVars: ThemeVariables;       // CSS 自定义属性集
  protected graphicPrimitives: GraphicLib;   // SVG 图形基元库
  protected layoutSkeletons: LayoutRegistry; // 版式骨架注册表
  protected antiPatterns: AntiPatternList;   // 反模式清单(L1 检查复用)
  protected componentAssets: ComponentLib;   // 可复用组件资产(FR-E04)

  // 子类必须实现
  abstract getContract(): SkillContract;     // 能力声明合同
  abstract generate(input: SkillInput): Promise<Artifact>;

  // 共享方法
  protected injectTheme(html: string): string;  // 注入 CSS 自定义属性
  protected resolveLayout(type: string): LayoutSkeleton;  // 匹配版式骨架
  protected checkAntiPatterns(html: string): AntiPatternResult[];  // 生成时自检
}
```

各 Skill 的 renderer 模式:

| Skill | 主渲染器 | 辅助渲染器 | 输出特征 |
|-------|---------|-----------|----------|
| SlidesSkill | HTML+CSS 翻页布局 | - | 多页 section,键盘翻页 |
| ChartSkill | SVG + CSS | Mermaid(可选) | 数据驱动的矢量图表 |
| ArchDiagramSkill | SVG 节点+连线 | CSS 分层着色 | 明暗双主题矢量图 |
| FlowchartSkill | Mermaid DSL→SVG | CSS 泳道布局 | 流程/时序/泳道图 |
| PosterSkill | CSS Grid+Flexbox | SVG 装饰图形 | 单页视觉构图 |
| LandingPageSkill | HTML 语义结构 | CSS scroll-snap | 单页滚动式展示 |
| MockupSkill | HTML+CSS 组件 | SVG 线框元素 | 静态界面稿 |
| DashboardSkill | CSS Grid 布局 | SVG 图表组件 | 指标卡+趋势图+明细区 |
| InfographicSkill | SVG+CSS 混合 | CSS 数字高亮 | 单页信息压缩图 |
| LogicDiagramSkill | SVG 节点+连线 | CSS 矩阵/层级布局 | 逻辑关系表达 |
| PrototypeSkill | HTML+JS 交互 | hash router+事件委托 | 可点击多页原型 |

输入:IntentPacket + ThemePack + 模板骨架
输出:Artifact(HTML 主结果 + 元数据,状态为 generating → ready)

边界规则:
- 每个 Skill 只输出 HTML,不关心其他格式。
- Skill 通过 CSS 自定义属性消费 ThemePack 变量。
- 视觉实现基于 HTML/CSS/SVG/JS,零模态依赖。模态模型（图像生成等）为可选增强项。

#### 5.2.4 Quality 域(质量门禁)

职责:独立于生成链路的验证层,为每次任务给出交付结论。

| 模块 | 职责 |
|------|------|
| L1RuleEngine | 静态规则检查:页面计数、标题存在性、占位残留、数据一致性(< 2s) |
| L2DomInspector | DOM 解析检查:字号/对比度/留白/对齐/密度/层级(< 5s) |
| L3SemanticReview | 可选 LLM 语义审查:意图符合度、信息完整度(默认关闭) |
| ReportBuilder | 汇总检查结果,生成 QualityReport(通过项/提醒项/阻断项/人工建议) |

| BrandComplianceChecker | 检查产物是否遵循 ThemePack / BrandKit 约束:颜色、字体、标识、版式节奏(FR-D04) |
| AntiPatternDetector | 基于结构化反模式清单检测低质量排版、信息堆砌、风格漂移,命中阻断级时同时输出替代建议(FR-D05) |
| SemanticReviewer | 可选 LLM 语义审查:将用户原始需求和生成结果发给独立 LLM 评估意图符合度(FR-D08,默认关闭) |

输入:Artifact(HTML 主结果)+ IntentPacket(原始意图,用于语义比对)+ ThemePack(品牌合规比对)
输出:QualityReport + 交付结论(pass / warn / block)

边界规则:
- L1 + L2 默认启用,L3 用户显式开启。
- 存在阻断项时任务不能进入交付状态。
- 质量域不修改 Artifact 内容,只给结论。

质量检查管线扩展:

```
Artifact + ThemePack + IntentPacket
  → L1RuleEngine: 结构完整性 + 反模式检测(AntiPatternDetector)
  → L2DomInspector: 视觉版式 + 品牌合规(BrandComplianceChecker)
  → [可选] L3SemanticReview(SemanticReviewer): 意图符合度
  → ReportBuilder: 汇总 QualityReport
```

BrandComplianceChecker 检查项(FR-D04):

| 检查维度 | 判定方式 | 结论 |
|----------|----------|------|
| 颜色合规 | 提取 Artifact 中实际使用的颜色值,与 ThemePack 声明的调色板比对,偏差 > ΔE 10 标记 | 偏差 → warn |
| 字体合规 | 检查 CSS font-family 是否在 ThemePack 声明的字体栈内 | 不在栈内 → warn |
| 标识使用 | 检查 BrandKit 中声明的标识是否按规则出现(位置、尺寸、保护区) | 违规 → warn |
| 版式节奏 | 检查间距是否为 ThemePack `--cd-spacing-unit` 的整数倍 | 偏差 > 2px → warn |
| 无品牌上下文 | ThemePack 未提供品牌约束时,跳过品牌检查,采用基线风格 | pass + 说明 |

AntiPatternDetector 数据驱动架构(FR-D05):

```typescript
interface AntiPatternRule {
  id: string;                    // 如 'AP-V01'
  category: 'visual' | 'ai_behavior' | 'layout' | 'content';
  severity: 'CRITICAL' | 'WARNING';
  selector: string;              // CSS 选择器或正则表达式
  condition: string;             // 判定条件描述
  alternative: string;           // 替代建议
  exemptionCondition?: string;   // 用户显式要求时的豁免条件
}
```

反模式清单以 JSON 数据文件维护(`scripts/quality/anti-patterns.json`),新增条目只需追加记录,不修改检查逻辑代码。初期最小规则集内联在 L1RuleEngine 中,后续迁移到 SharedFoundation 做结构化维护。

#### 5.2.5 Packaging 域(导出与交付)

职责:从 HTML 主结果派生其他格式,组织交付包。

| 模块 | 职责 |
|------|------|
| HtmlExporter | 打包独立 HTML(index.html + assets/ → zip) |
| PptxExporter | HTML → PPTX 映射(复用 PptxGenJS / anthropic-pptx) |
| PdfExporter | HTML → PDF 导出,保持页序、标题层级和视觉内容稳定(FR-C04) |
| ImageExporter | 单页/单图 → PNG/SVG 导出,矢量优先(FR-C05) |
| FallbackHandler | 识别复杂页面,执行图片回退策略 |
| CrossFormatValidator | 跨格式一致性校验:标题、页序、核心图表、重点结论在各格式间一一对应(FR-C06) |
| BundleAssembler | 组织交付包:产物文件 + 清单 + 阅读说明 + 质量摘要 |

输入:Artifact(质量通过后)+ QualityReport
输出:DeliveryBundle(zip 包含 HTML + PPTX + PDF + PNG/SVG + 清单 + 说明)

边界规则:
- 只在质量结论为 pass 或 warn 时执行导出。
- PPTX 回退策略只影响必要页面,不拖累整个交付物。
- 导出后执行跨格式一致性检查(FR-D06)。

导出管线扩展:

PdfExporter 技术方案(FR-C04):
- 输入:Artifact HTML + ThemePack CSS
- 渲染方式:Puppeteer headless Chrome `page.pdf()`,保留 CSS 排版和 SVG 矢量
- 页面映射:HTML 中每个 `<section data-page>` 对应 PDF 一页,通过 CSS `@page` + `page-break` 控制分页
- CJK 支持:ThemePack 字体栈中的 Noto Sans SC/JP/KR 在 PDF 中嵌入子集
- 输出:`output/<task-id>/delivery/<artifact-name>.pdf`

ImageExporter 技术方案(FR-C05):
- 矢量路径:Artifact 中 SVG 元素直接提取为独立 `.svg` 文件,保留矢量可编辑性
- 位图路径:Puppeteer `page.screenshot({ type: 'png', clip: ... })` 按页面/区域截图
- 优先级:产物具备矢量表达条件时优先 SVG,否则 PNG
- 输出:`output/<task-id>/delivery/<artifact-name>-<page>.{svg|png}`

CrossFormatValidator 校验规则(FR-C06):

| 校验维度 | 判定方式 | 结论 |
|----------|----------|------|
| 页数一致 | HTML section 数 = PPTX slide 数 = PDF 页数 | 不一致 → warn + 差异说明 |
| 标题对应 | 各格式主标题文本完全匹配 | 不匹配 → warn |
| 核心图表 | 各格式中图表数量和类型一致 | 缺失 → warn |
| 重点结论 | 各格式中结论区域文本一致 | 不一致 → warn |
| 局部适配 | 格式差异不可避免时,输出差异说明 | 记录到 QualityReport |

#### 5.2.6 Skill Extension 域(Skill 扩展协议)

职责:定义新能力如何接入、如何被发现、如何保持质量一致。

| 模块 | 职责 |
|------|------|
| ContractRegistry | 管理所有 Skill 的能力声明合同(SkillContract),提供注册、查询、版本比对(FR-F01) |
| InterfaceValidator | 校验扩展 Skill 的输入输出是否符合接口定义,拒绝不合规 Skill 注册(FR-F02) |
| LifecycleManager | 管理 Skill 从注册→测试→发布→更新→退役的完整生命周期(FR-F03) |
| SandboxExecutor | 限制扩展 Skill 的执行边界,隔离失败影响,保证核心链路稳定(FR-F04) |
| EcosystemPortal | 提供 Skill 发现、筛选、安装的统一入口(FR-F05) |

SkillContract 完整结构(FR-F01):

```typescript
interface SkillContract {
  // 基础声明
  name: string;                  // Skill 唯一标识
  version: string;               // 语义化版本号
  productType: string;           // 产物类型(slides/chart/arch-diagram/...)
  description: string;           // 一句话职责描述

  // 能力边界(FR-F01 AC1)
  applicableScenes: string[];    // 适用场景列表
  inputRange: InputSpec;         // 接受的输入范围
  requiredContext: string[];     // 所需上下文字段(ThemePack 字段列表)
  supportedOutputs: string[];    // 支持的输出格式
  qualityExpectation: QualitySpec; // 质量预期(覆盖哪些检查项)

  // 接口定义(FR-F02)
  input: SkillInputSchema;       // 输入 JSON Schema
  output: SkillOutputSchema;     // 输出 JSON Schema
  themeFields: string[];         // 消费的 ThemePack CSS 变量列表
  qualityCoverage: string[];     // 声明覆盖的质量检查类型

  // 生命周期(FR-F03)
  status: 'draft' | 'testing' | 'published' | 'deprecated' | 'retired';
  minCoreVersion: string;        // 兼容的最低核心版本

  // 执行边界(FR-F04)
  exportProfile: 'standard' | 'html-only' | 'custom';
  maxExecutionMs: number;        // 最大执行时间
  sideEffects: boolean;          // 是否有副作用(文件写入等)

  // 生态元数据(FR-F05)
  author: string;
  license: string;
  tags: string[];                // 行业场景标签
  maturityLevel: 'experimental' | 'stable' | 'production';
}
```

SandboxExecutor 隔离机制(FR-F04):
- 扩展 Skill 只能访问声明过的输入字段和 ThemePack 变量
- 扩展 Skill 不能绕开统一主题、质量和交付规则
- 单个 Skill 执行超时(maxExecutionMs)后强制终止,不拖垮整条管线
- 扩展 Skill 的输出必须通过 InterfaceValidator 校验后才进入 Quality Gate

LifecycleManager 状态流转:
```
draft → testing → published → deprecated → retired
                     ↑              │
                     └──── update ──┘
```
- `testing`:通过 InterfaceValidator 校验 + 至少一个端到端测试通过
- `published`:进入路由体系,可被 SkillRouter 选择
- `deprecated`:仍可执行但不再被新任务路由选择,提示迁移
- `retired`:完全移除,不参与任何路由
- 版本更新创建新版本记录,旧版本自动进入 deprecated

EcosystemPortal 发现机制(FR-F05):
- 通过 `clawhub search --type design-skill` 搜索可安装的扩展 Skill
- 按产物类型、行业场景、质量成熟度(maturityLevel)筛选
- 安装后自动注册到 ContractRegistry,进入路由体系
- 生态扩展不破坏核心产品边界:扩展 Skill 与内置 Skill 共用同一份 SkillContract 结构

#### 5.2.7 Host Adapter 域(宿主适配)

职责:将核心管线与宿主环境解耦,标准化输入输出。

| 模块 | 职责 |
|------|------|
| OpenClawAdapter | OpenClaw 环境适配(会话上下文、文件交付、澄清交互) |
| CLIAdapter | 通用 CLI 回退(stdin/stdout/文件系统) |

接口契约:
- `adapt(rawInput) → DesignRequest`:标准化输入
- `clarify(gaps) → ClarificationRequest`:缺口澄清转发
- `deliver(bundle) → DeliveryResult`:交付包送达

边界规则:
- 核心管线零宿主依赖,所有宿主交互通过 Adapter 接口。
- 新宿主只需实现三个方法。
- DesignRequest 包含 `metadata: Record<string, unknown>` 扩展字段。

### 5.3 Skill 接口清单

| Skill | 职责(一句话) | 触发条件 | 核心模块/入口 |
|-------|------|----------|---------------|
| SlidesSkill | 基于文本生成演示文稿 HTML | 意图包含"PPT""演示""汇报""slides" | Rendering/SkillExecutor |
| ChartSkill | 把数据转成图表与可视化组件 | 意图包含"图表""可视化""chart""数据" | Rendering/SkillExecutor |
| ArchDiagramSkill | 生成架构图、系统边界图、组件关系图 | 意图包含"架构""系统图""组件图" | Rendering/SkillExecutor |
| DashboardSkill | 生成 Dashboard 数据看板 | 意图包含"看板""dashboard""数据面板" | Rendering/SkillExecutor |
| FlowchartSkill | 生成流程图、泳道图、时序图 | 意图包含"流程""时序""泳道" | Rendering/SkillExecutor |
| InfographicSkill | 生成信息图 | 意图包含"信息图""infographic" | Rendering/SkillExecutor |
| LandingPageSkill | 生成 Landing Page 落地页 | 意图包含"落地页""landing""官网" | Rendering/SkillExecutor |
| LogicDiagramSkill | 生成逻辑关系图 | 意图包含"逻辑图""关系图""思维导图" | Rendering/SkillExecutor |
| MockupSkill | 生成静态 UI mockup 与线框图 | 意图包含"界面""mockup""线框图"且不含交互信号 | Rendering/SkillExecutor |
| PosterSkill | 生成海报与宣传图 | 意图包含"海报""宣传图""poster" | Rendering/SkillExecutor |
| PrototypeSkill | 生成可点击、有状态切换的 HTML 交互原型 | 意图包含"可点击""交互""跳转""状态切换""原型" | Rendering/SkillExecutor |
| ClarificationEngine | 全阶段意图模糊检测与结构化提问 | 任何阶段检测到意图模糊或决策缺口时自动触发 | Routing/ClarificationEngine |

新增 Skill 接口清单补充:

| Skill | 职责 | 触发条件 | 对应 FR |
|-------|------|----------|----------|
| CompositeIntentSplitter | 多意图拆分与依赖图构建 | 请求包含多个设计目标 | FR-A05 |
| CoProductionOrchestrator | 多产物联产编排 | 多意图拆分后触发 | FR-A06 |
| RouteExplainer | 路由结果可解释输出 | 每次路由完成后自动触发 | FR-A07 |
| PipelineTracer | 全链路可观测性记录 | 每次任务执行时自动记录 | FR-A08 |
| RevisionEngine | Artifact 增量修订与版本管理 | 用户对已生成结果发起修改要求 | FR-B12 |
| BrandComplianceChecker | 品牌合规检查 | 质量门禁 L2 阶段自动触发 | FR-D04 |
| AntiPatternDetector | 反模式检测 | 质量门禁 L1 阶段自动触发 | FR-D05 |
| SemanticReviewer | 可选 LLM 语义审查 | 用户显式开启时触发 | FR-D08 |
| PdfExporter | PDF 导出 | 交付打包时自动触发 | FR-C04 |
| ImageExporter | PNG/SVG 导出 | 单页/单图导出时触发 | FR-C05 |
| CrossFormatValidator | 跨格式一致性校验 | 导出完成后自动触发 | FR-C06 |
| VariantGenerator | 风格变体生成 | 模板选择阶段触发 | FR-E03 |
| ThemeConflictResolver | 主题冲突裁定 | ThemePack 组装时检测到冲突触发 | FR-E05 |

Skill 间依赖关系:
- 所有 Design Skill 依赖 ThemeResolver 提供的 ThemePack
- PrototypeSkill 与 MockupSkill 互斥:同一任务只走其中一条链路,由路由层根据交互信号判定
- ClarificationEngine 被 Routing/Rendering/Quality 三域共享调用,不属于单一域独占
- 所有 Design Skill 的输出统一进入 Quality 域检查,再进入 Packaging 域导出

## 6. 运行时视图

### 6.1 场景:单产物生成(主路径)

```
用户 → 宿主 → HostAdapter: 自然语言需求
HostAdapter → IntentRouter: DesignRequest
IntentRouter → IntentClassifier: 识别产物类型
IntentRouter → GapDetector: 检查缺口
  [Clarify 跳过判定] 见下方跳过条件
  [缺口存在且不满足跳过条件] IntentRouter → HostAdapter → 宿主: 澄清请求
  [缺口回填] 宿主 → HostAdapter → IntentRouter: 补充信息
IntentRouter → ContextCollector: 收束上下文
IntentRouter → SkillRouter: 选择 Skill

SkillRouter → ThemeResolver: 组装 ThemePack
ThemeResolver → BrandExtractor: 提取品牌线索(如有素材)
ThemeResolver → TemplateRegistry: 匹配模板骨架
ThemeResolver → SkillRouter: ThemePack + 模板骨架

SkillRouter → SkillExecutor: IntentPacket + ThemePack + 模板骨架
SkillExecutor → DesignSkill: 注入 CSS 自定义属性,调用 Skill 生成
DesignSkill → ArtifactBuilder: HTML 主结果(状态: generating → ready)

ArtifactBuilder → L1RuleEngine: 静态规则检查(< 2s)
L1RuleEngine → L2DomInspector: DOM 解析检查(< 5s)
  [L3 启用] L2DomInspector → L3SemanticReview: LLM 语义审查
ReportBuilder → QualityReport: 汇总结论(pass / warn / block)
  [block] QualityReport → HostAdapter: 阻断,不交付
  [pass/warn] QualityReport → HtmlExporter: 打包 HTML ZIP
  [pass/warn] QualityReport → PptxExporter: HTML → PPTX 映射
    [复杂页面] PptxExporter → FallbackHandler: 图片回退
  ExportAdapter → L1RuleEngine: 导出可用性检查(FR-D06)

BundleAssembler → DeliveryBundle: 产物 + 清单 + 说明 + 质量摘要
HostAdapter → 宿主: 交付包路径 + 结果摘要
```

关键时序约束:
- 路由阶段(IntentClassifier → SkillRouter)总耗时 ≤ 3s
- 单页生成(SkillExecutor → ArtifactBuilder)≤ 30s
- 质量门禁(L1 + L2)≤ 10s
- 导出打包(ExportAdapter → BundleAssembler)≤ 15s

Clarify 跳过条件(GapDetector 判定逻辑):

GapDetector 评估以下三个维度,全部满足时跳过 Clarify 直接进入 Execute:

| 维度 | 满足条件 | 判定方式 |
|------|----------|----------|
| 产物类型明确 | IntentClassifier 返回单一候选且置信度 ≥ 0.85 | 候选数 = 1 且 confidence ≥ 0.85 |
| 内容主题明确 | 用户输入包含可提取的实质性内容(非纯指令) | 输入中存在 ≥ 1 个实体/主题词,且不是纯格式指令(如"做个 PPT") |
| 无歧义 | 不存在多义词、矛盾约束或模糊范围 | GapDetector 缺口清单为空,或仅包含 SHOULD 级约束的可选项 |

跳过时 IntentPacket 中记录 `clarifySkipped: true` + 跳过理由,供后续链路和 trace 日志使用。

### 6.2 场景:多产物联产

```
IntentRouter → IntentClassifier: 识别主产物 + 附属产物
IntentClassifier → SkillRouter: 按依赖顺序分配 Skills
SkillRouter → Skill_A: 主交付物生成(共享 ThemePack)
SkillRouter → Skill_B: 附属交付物生成(共享 ThemePack + 主产物上下文)
[所有 Artifact ready] → QualityGate: 批量检查
QualityGate → BundleAssembler: 按用途分组打包
```

联产约束:所有产物共享同一份 ThemePack,中间结构复用率 ≥ 70%(NFR-12)。

### 6.3 场景:增量修订

```
用户: "把第三页配色换成深蓝"
IntentRouter: 识别为修订意图,定位目标 Artifact
Artifact: ready → revision
DesignSkill: 增量修改(不重新生成整个产物)
Artifact: revision → ready
QualityGate: 重新检查修改部分
ExportAdapter: 增量导出
```

### 6.4 场景:主动交互式需求澄清(FR-A09)

```
用户 → 宿主 → HostAdapter: "帮我做个产品介绍"(意图模糊)
HostAdapter → IntentRouter: DesignRequest
IntentRouter → IntentClassifier: 识别产物类型(置信度 < 0.85,多候选)
IntentRouter → ClarificationEngine: 触发 routing 阶段澄清

ClarificationEngine:
  1. 评估决策因素缺口(目标受众/风格偏好/品牌调性/内容范围/交付格式/色彩倾向/信息密度/使用场景)
  2. 生成结构化提问清单(questions_v2 格式:问题文本 + 决策因素类型 + 默认值 + 跳过条件)
  3. → HostAdapter → 宿主: ClarificationRequest(第 1 轮)

宿主 → HostAdapter → ClarificationEngine: 用户回填答案
ClarificationEngine: 收敛判定
  [所有 MUST 级缺口已回填 或 用户确认默认值 或 "直接生成"] → 收敛,继续管线
  [仍有 MUST 级缺口且轮次 < 2] → 第 2 轮提问
  [轮次 = 2 且仍有缺口] → 剩余缺口采用默认值,标记 clarifyFallback: true

ClarificationEngine → IntentRouter: 收敛后的补充信息合入 IntentPacket
IntentRouter → SkillRouter: 继续正常路由

--- execution 阶段澄清(可选触发)---
SkillExecutor: 生成前检测关键设计决策缺口(版式/信息层级/视觉重点)
  [缺口存在] SkillExecutor → ClarificationEngine → HostAdapter → 宿主: 确认式提问
  [用户确认/修正] → 继续生成

--- quality 阶段澄清(可选触发)---
ReportBuilder: 交付前检测存疑项(品牌合规不确定/内容取舍有歧义)
  [存疑] ReportBuilder → ClarificationEngine → HostAdapter → 宿主: 最终确认
  [用户回应] → 进入交付打包
```

关键约束:
- 每阶段最多 2 轮提问,超限后采用默认值继续推进(AC6)
- 澄清模板和决策因素词表由 skill 层提供,通过 prompt 注入植入各阶段执行上下文(AC7)
- 收敛条件:所有 MUST 级缺口已回填 / 用户确认默认值 / 用户发出"直接生成"指令(AC5)

### 6.5 场景:交互原型生成(FR-B13)

```
用户: "做一个电商 App 的可点击原型,包含首页、商品详情和购物车"
IntentRouter → IntentClassifier: 识别意图包含"可点击""交互"信号
IntentClassifier → SkillRouter: 路由至 PrototypeSkill(非 MockupSkill)

SkillRouter → ThemeResolver: 组装 ThemePack
ThemeResolver → SkillRouter: ThemePack + 响应式布局参数

SkillRouter → SkillExecutor: IntentPacket + ThemePack
SkillExecutor → PrototypeSkill:
  1. 加载交互骨架模板(路由模板 + 组件模板 + 状态管理模板)
  2. LLM 填充具体内容、布局和业务逻辑
  3. 生成单文件 HTML 原型:
     - hash router 实现多页面导航(首页 / 商品详情 / 购物车)
     - data-state 属性驱动状态切换(tab/折叠/弹窗)
     - JS 事件绑定实现点击反馈和表单交互
     - 响应式布局适配桌面端和移动端视口
PrototypeSkill → ArtifactBuilder: HTML 原型(状态: generating → ready)

ArtifactBuilder → L1RuleEngine: 静态规则检查(交互完整性 + 路由完整性 + 状态一致性)
L1RuleEngine → L2DomInspector: DOM 检查(对比度/布局/响应式断点)
```

PrototypeSkill 交互完整性检查规则(L1RuleEngine 执行):

| 检查项 | 规则 | 判定方式 | 结论 |
|--------|------|----------|------|
| 事件绑定完整性 | 所有带 `data-action` 的元素必须位于已注册 handler 的事件委托范围内 | 扫描 DOM 中 `[data-action]` 元素,校验 script 中存在对应 action type 的处理分支 | 缺失 → block |
| 路由表-DOM 一致性 | routes 对象中每个 value 必须对应一个存在的 `[data-page]` section | 解析 script 中 routes 常量,逐项检查 `document.getElementById(value)` 是否存在 | 不一致 → block |
| 导航链接有效性 | 所有 `href="#/..."` 的锚点,其路径必须存在于 routes 注册表中 | 扫描 `a[href^="#/"]`,提取路径与 routes keys 比对 | 死链 → warn |
| 状态目标存在性 | 所有 `data-state-target` 的值必须匹配到一个 `data-component` 同名节点 | 扫描 `[data-state-target]`,查找祖先或文档中是否存在 `[data-component="{value}"]` | 目标不存在 → block |
| 状态死循环检测 | 同一组件的状态切换操作不能形成无出口环路 | 构建状态转移图(action → from_state → to_state),检测是否存在无外部触发的自循环 | 死循环 → block |
| 页面可达性 | 从默认路由出发,所有 routes 中的页面至少有一条导航路径可达 | 从 nav 和页面内 `a[href^="#/"]` 构建可达图,BFS 检查连通性 | 孤立页面 → warn |
| data-page 唯一性 | 每个 `[data-page]` section 的 id 必须唯一 | 扫描所有 `[data-page]` 的 id,检查重复 | 重复 → block |

```
ReportBuilder → QualityReport

[pass/warn] → HtmlExporter: 打包独立 HTML(无需构建工具或运行时依赖)
BundleAssembler → DeliveryBundle
HostAdapter → 宿主: 交付(用户可直接在浏览器中打开和交互)
```

路由判定规则:用户意图中包含"可点击""交互""跳转""状态切换"等信号时进入 PrototypeSkill 链路,否则按静态界面表达进入 MockupSkill。

PrototypeSkill 导出策略(html-only):

PrototypeSkill 的交付物为可交互 HTML 原型,包含 hash 路由、状态切换和事件绑定,这些能力无法保真映射到 PPTX 格式。因此 PrototypeSkill 独立于通用导出管线:

- `exportProfile = 'html-only'`
- 默认交付为独立 HTML 文件或 HTML ZIP(index.html + 内联资源)
- 跳过 PptxExporter 和 FallbackHandler,直接进入 HtmlExporter → BundleAssembler
- DeliveryBundle 中标注 `format: 'interactive-html'`,交付说明注明「该产物为交互原型,浏览器直接打开即可体验,不提供 PPTX 导出」

PrototypeSkill 最小实现骨架:

单文件 HTML 约定结构:

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{prototype_title}}</title>
  <style>
    /* 1. CSS 自定义属性(消费 ThemePack) */
    :root { /* --cd-color-primary, --cd-font-body, etc. */ }
    /* 2. 全局重置与基础排版 */
    /* 3. 页面容器样式(每个 hash 路由页面一个 section) */
    /* 4. 组件样式(按 data-component 命名空间隔离) */
    /* 5. 状态样式([data-state] 选择器) */
    /* 6. 响应式断点:桌面 ≥ 768px / 移动 < 768px */
  </style>
</head>
<body>
  <!-- 导航区 -->
  <nav data-component="nav">
    <a href="#/home">首页</a>
    <a href="#/detail">详情</a>
  </nav>

  <!-- 页面容器:每个路由页面一个 section,id 与路由表对应 -->
  <main>
    <section id="page-home" data-page>
      <!-- 页面内容 -->
      <div data-component="card" data-state="collapsed">
        <button data-action="toggle" data-state-target="card">展开</button>
      </div>
    </section>
    <section id="page-detail" data-page hidden>
      <!-- 页面内容 -->
    </section>
  </main>

  <script>
    // === 路由注册表 ===
    const routes = {
      '/home': 'page-home',
      '/detail': 'page-detail',
    };

    // === Hash Router ===
    function navigate() {
      const path = location.hash.slice(1) || '/home';
      document.querySelectorAll('[data-page]').forEach(p => p.hidden = true);
      const target = document.getElementById(routes[path]);
      if (target) target.hidden = false;
    }
    window.addEventListener('hashchange', navigate);
    navigate();

    // === 状态管理(事件委托) ===
    document.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]');
      if (!action) return;
      const type = action.dataset.action;
      const targetId = action.dataset.stateTarget;
      const component = action.closest(`[data-component="${targetId}"]`);
      if (!component) return;
      // 状态切换逻辑
      const current = component.dataset.state;
      component.dataset.state = current === 'collapsed' ? 'expanded' : 'collapsed';
    });
  </script>
</body>
</html>
```

骨架约定:

| 约定项 | 规则 |
|--------|------|
| 文件结构 | `<style>` → `<body>` (nav + main + sections) → `<script>`,严格按此顺序 |
| 路由注册表 | `const routes: Record<string, string>`,key 为 hash 路径,value 为 section id |
| 页面 ID | `page-{slug}` 格式,slug 为小写英文 + 连字符 |
| 组件 ID | `data-component="{name}"` 属性标识,name 为小写英文 + 连字符 |
| 状态作用域 | `data-state` 仅作用于最近的 `data-component` 祖先节点,禁止跨组件串状态 |
| 事件绑定 | 统一使用事件委托(document 级),通过 `data-action` 声明动作类型 |
| 状态目标 | `data-state-target` 指向目标组件的 `data-component` 值 |
| 响应式策略 | 单画布 + CSS media query 响应式切换(断点 768px),非双画布模板 |
| 外部依赖 | 零依赖,浏览器直接打开可运行 |

## 7. 部署视图

### 7.1 分发形态

Claw Design 作为 skill pack 运行在用户本地环境,不需要独立服务器。通过 `clawhub install claw-design` 一键安装。

### 7.2 部署映射

| 构建块 | 部署形态 | 说明 |
|--------|---------|------|
| Skill Pack 整体 | 本地目录 `skills/claw-design/` | clawhub install 安装 |
| Design Skills | `skills/<skill-name>/SKILL.md` + `references/` + `templates/` | 每个 Skill 一个子目录 |
| Quality Gate 脚本 | `scripts/quality/` 下 Python3 脚本 | 随 skill pack 分发 |
| Export Adapters | `scripts/export/` 下 Node.js 脚本 | PptxGenJS 等依赖通过 package.json 管理 |
| Theme Packs | `themes/` 下 YAML + CSS 文件 | 预置主题随 pack 分发,用户可扩展 |
| 产物输出 | 用户工作目录下 `output/` | 运行时创建,不随 pack 分发 |

### 7.3 目录结构

```
claw-design/
├── SKILL.md                  # 顶层 Skill 声明
├── package.json              # Node.js 依赖(pptxgenjs, cheerio)
├── requirements.txt          # Python 依赖(beautifulsoup4, pyyaml)
├── install.sh                # 一键安装脚本
├── skills/                   # Design Skills
│   ├── slides/               # 演示文稿 Skill
│   ├── chart/                # 图表 Skill
│   ├── arch-diagram/         # 架构图 Skill
│   ├── prototype/            # 交互原型 Skill(FR-B13)
│   ├── flowchart/            # 流程图与时序图 Skill(FR-B04)
│   ├── poster/               # 海报与宣传图 Skill(FR-B05)
│   ├── landing-page/         # Landing Page Skill(FR-B06)
│   ├── mockup/               # UI mockup 与线框图 Skill(FR-B07)
│   ├── dashboard/            # Dashboard Skill(FR-B08)
│   ├── infographic/          # 信息图 Skill(FR-B09)
│   └── logic-diagram/        # 逻辑关系图 Skill(FR-B10)
├── scripts/
│   ├── quality/              # L1/L2 质量检查脚本
│   └── export/               # 导出适配脚本
├── themes/                   # 预置 Theme Packs
├── adapters/                 # Host Adapters
│   ├── openclaw-adapter.ts
│   └── cli-adapter.ts
└── output/                   # 运行时产物(.gitignore)
```

### 7.4 宿主适配

| 宿主 | Adapter | 安装方式 | 优先级 |
|------|---------|---------|--------|
| OpenClaw | OpenClawAdapter | 随 skill pack 内置 |
| CLI | CLIAdapter | 随 skill pack 内置 |
| 其他 Agent 平台 | 按需实现 | 独立 Adapter 包 |

### 7.5 依赖与环境要求

- Node.js ≥ 18(TypeScript 运行时、PptxGenJS、cheerio)
- Python ≥ 3.11(Quality Gate L1 脚本)
- 分发包体积 ≤ 50 MB(NFR-06)
- 性能基准:Apple M1 / 16GB RAM / Node 18 / Python 3.11。云端或低配环境允许 1.5x 系数。

## 8. 横切关注点

### 8.1 领域模型

核心对象及流转关系:

```
DesignRequest → IntentPacket → ThemePack
                    ↓
              ArtifactSpec → Artifact → QualityReport → DeliveryBundle
                               ↑↓
                            ExportedFile
```

| 对象 | 技术表示 | 持久化 |
|------|---------|--------|
| DesignRequest | JSON 对象 | 不持久化,管线内传递 |
| IntentPacket | JSON 对象 | 可选写入 `output/.trace/` |
| ThemePack | YAML 文件 | `themes/` 目录,可跨任务复用 |
| ArtifactSpec | JSON 对象 | 管线内传递 |
| Artifact | HTML 文件 + 元数据 JSON | `output/<task-id>/` |
| QualityReport | JSON 文件 | `output/<task-id>/quality-report.json` |
| DeliveryBundle | ZIP 文件 | `output/<task-id>/delivery/` |
| SkillContract | YAML frontmatter in SKILL.md | 随 skill 定义文件 |

Artifact 状态机(四态):`generating → ready ⇄ revision → archived`

RevisionEngine 增量修订机制(FR-B12):

RevisionEngine 位于 Rendering 域,负责在已有 Artifact 基础上做增量修改,不重新生成整个交付物。

```typescript
interface RevisionRequest {
  artifactId: string;            // 目标 Artifact
  instruction: string;           // 用户修订指令(自然语言)
  targetScope: 'page' | 'element' | 'global';  // 修订范围
  targetSelector?: string;       // 可选,精确定位目标元素的 CSS 选择器
}

interface RevisionPlan {
  operations: RevisionOp[];      // 解析后的修订操作序列
  affectedPages: number[];       // 受影响的页面索引
  preserveScope: string[];       // 明确不受影响的区域
}

type RevisionOp =
  | { type: 'style_change'; selector: string; properties: Record<string, string> }
  | { type: 'content_replace'; selector: string; newContent: string }
  | { type: 'page_add'; position: number; spec: ArtifactSpec }
  | { type: 'page_remove'; pageIndex: number }
  | { type: 'layout_change'; pageIndex: number; newLayout: string };

interface ArtifactSnapshot {
  version: number;
  html: string;                  // 完整 HTML 快照
  timestamp: string;
  instruction: string;           // 触发该版本的修订指令
}
```

状态流转:
1. 用户发起修订 → Artifact 从 `ready` 转入 `revision`
2. RevisionEngine 解析修订指令 → 生成 RevisionPlan
3. 按 RevisionPlan 对 HTML DOM 做增量修改(不重新调用 Skill 生成)
4. 保存修订前快照(ArtifactSnapshot)
5. Artifact 从 `revision` 回到 `ready`
6. 触发 Quality Gate 重新检查修改部分
7. 触发 Export Adapter 增量导出

版本回退:用户可指定回退到任意历史快照,回退后 Artifact 状态为 `ready`,可继续新的修订。

### 8.2 主题变量注入

Theme Pack 通过 CSS 自定义属性注入所有 Design Skill 的输出:

```css
:root {
  --cd-color-primary: #1a73e8;
  --cd-color-bg: #ffffff;
  --cd-font-heading: 'Inter', sans-serif;
  --cd-font-body: 'Noto Sans SC', sans-serif;
  --cd-spacing-unit: 8px;
  --cd-radius: 4px;
}
```

PPTX 导出时,Export Adapter 读取同一份 ThemePack YAML 映射为 PptxGenJS 主题参数,保证跨格式视觉一致性(NFR-04)。

### 8.3 错误处理

| 管线阶段 | 失败行为 | 用户可见信息 |
|---------|---------|-------------|
| 意图识别 | 返回候选类型 + 澄清建议,不进入错误链路 | "无法确定任务类型,请补充..." |
| Skill 生成 | 单 Skill 失败不拖垮整条管线(FR-F04),失败位置和原因 5 秒内返回(NFR-01) | "演示文稿生成失败:[原因]" |
| 质量门禁 | 阻断项阻止交付,提醒项放行并标注 | QualityReport 中分级展示 |
| 导出 | 回退策略(FR-C03),标明回退页面和原因 | "第 5 页使用图片回退导出" |
| 交付 | Host Adapter 交付失败时保留本地产物,返回本地路径 | "交付失败,产物已保存至 output/xxx/" |

### 8.4 可观测性

任务追踪覆盖全链路七段(NFR-07),写入 `output/<task-id>/.trace/pipeline.jsonl`:

```json
{
  "task_id": "uuid",
  "trace": [
    {"stage": "intent", "result": "slides", "duration_ms": 1200},
    {"stage": "context", "theme": "business-blue", "gaps": []},
    {"stage": "generate", "skill": "SlidesSkill", "pages": 12},
    {"stage": "quality", "pass": 8, "warn": 2, "block": 0},
    {"stage": "export", "formats": ["html-zip", "pptx"]},
    {"stage": "deliver", "bundle_path": "output/xxx/delivery/"}
  ]
}
```

48 小时内可复盘,失败归因可定位到具体管线环节。

### 8.5 国际化与 CJK 支持

| 关注点 | 实现方式 |
|--------|----------|
| CJK 字体 | ThemePack 中 `--cd-font-body` 默认包含 Noto Sans SC/JP/KR 回退链 |
| 文本渲染 | HTML 原生 Unicode 支持,PPTX 导出时嵌入字体子集 |
| 日期/数字/单位 | 根据 IntentPacket 中的 locale 字段自动适配格式 |
| 排版方向 | CSS `writing-mode` 支持竖排(预留) |
| 渲染准确率 | CJK 文本渲染准确率 ≥ 99%(NFR-09) |

### 8.6 无障碍

| 关注点 | 实现方式 | 对应需求 |
|--------|----------|----------|
| 颜色对比度 | Quality Gate L2 检查文本/背景对比度 ≥ 4.5:1 | NFR-10 |
| 图表辅助说明 | 所有图表和图解生成 `aria-label` 或 `<figcaption>` | NFR-10 |
| 键盘导航 | 演示文稿 HTML 支持方向键翻页、Tab 焦点切换 | NFR-10 |
| 语义标签 | HTML 输出使用 `<section>`、`<article>`、`<nav>` 等语义元素 | NFR-10 |

### 8.7 生成反模式拦截(Anti-Pattern Registry)

L1RuleEngine 内置一份已知的 AI 生成 HTML 失败模式清单,在静态检查阶段逐条匹配。每条反模式独立标注影响级别(CRITICAL / WARNING),CRITICAL 命中即阻断交付,WARNING 命中标记为提醒项并附替代建议。清单随质量回路持续补充。

反模式清单初期内联在 L1RuleEngine 中(硬编码最小规则集),后续迁移到 SharedFoundation 做结构化维护(FR-B11),支持追加数据记录而不修改检查逻辑。

#### 视觉与渲染类反模式

| 禁止项 | 影响级别 | 原因 | 替代方案 |
|--------|----------|------|----------|
| CSS 渐变滥用(> 2 层叠加或径向渐变铺满背景) | CRITICAL | LLM 倾向堆砌渐变掩盖排版空洞,导致 PPTX 导出失真、打印不可控 | 纯色背景 + 单层线性渐变(仅用于强调区域) |
| 依赖 Inter / Roboto 等通用 Web 字体 | CRITICAL | 离线环境无法加载,CJK 回退链断裂 | ThemePack `--cd-font-*` 变量指定的字体栈,必须包含系统回退 |
| `scrollIntoView` / `scroll-behavior: smooth` | CRITICAL | 演示文稿场景破坏翻页逻辑,嵌入 iframe 时触发宿主滚动 | CSS `scroll-snap` 或 Skill 自身的翻页控制器 |
| `localStorage` / `sessionStorage` 读写 | WARNING | 沙箱环境(iframe / OpenClaw preview)不可用,静默失败导致状态丢失 | 数据通过 Artifact 元数据 JSON 持久化,运行时通过 CSS 自定义属性传递 |
| `<img src="https://...">` 外部图片引用 | CRITICAL | 违反零模态依赖约束(AC-03),离线不可用 | CSS 背景图案 / 内联 SVG / Mermaid 图表 |
| `position: fixed` 全屏遮罩 | CRITICAL | 嵌入宿主时遮挡宿主 UI,打印时丢失 | `position: absolute` 限定在 Artifact 容器内 |

#### AI 行为类反模式

| 禁止项 | 影响级别 | 原因 | 替代方案 |
|--------|----------|------|----------|
| 自动添加大标题(如 "Presentation Title") | WARNING | 用户未要求的标题占据首屏空间,暴露 AI 生成痕迹 | 仅在用户明确提供标题或 IntentPacket 包含标题字段时生成 |
| 填充无意义占位内容("Lorem ipsum" / "在此输入内容") | CRITICAL | 占位文本通过质量门禁后交付给用户,造成假交付 | 宁可留空并在 QualityReport 中标记为提醒项 |
| 添加用户未要求的演讲者注释 | WARNING | 注释内容通常是 AI 自说自话,干扰用户编辑 | 仅在 IntentPacket 显式包含 `speakerNotes: true` 时生成 |
| 用内容堆砌掩盖设计空洞 | CRITICAL | 信息密度失控,排版崩溃,核心信息被噪音淹没 | 每页信息点 ≤ 5 条,超出时拆页或使用层级折叠 |

L1RuleEngine 消费方式:启动时加载反模式清单为规则集合,对 Artifact HTML 做正则 + DOM 选择器匹配。按每条反模式的影响级别判定:CRITICAL 命中标记为阻断项(block),WARNING 命中标记为提醒项(warn)并附带替代建议。

### 8.8 约束优先级分级

系统约束按违反后果分为三级,冲突时低级约束向高级让步:

| 级别 | 含义 | 冲突时行为 | 典型约束 |
|------|------|-----------|----------|
| CRITICAL | 硬约束,绝不违反 | 违反即阻断交付(block),无例外 | 假交付率 = 0(NFR-01)、CSS 自定义属性命名规范(`--cd-*`)、零模态依赖(AC-03)、跨任务数据隔离(NFR-11)、反模式清单中的 CRITICAL 级禁止项 |
| MUST | 强约束,极端情况可降级但必须记录 | 违反标记为提醒项(warn),QualityReport 中说明降级原因 | CJK 渲染准确率 ≥ 99%(NFR-09)、HTML 有效性(无未闭合标签)、PPTX 文本可编辑率 ≥ 90%(NFR-03)、颜色对比度 ≥ 4.5:1(NFR-10)、路由 ≤ 3s / 生成 ≤ 30s / 门禁 ≤ 10s(NFR-02) |
| SHOULD | 软约束,推荐遵守 | 违反不阻断,可在 QualityReport 人工建议中提及 | 主题变体数量建议 ≥ 3、特定颜色空间(sRGB)、单页信息点 ≤ 5、语义化 HTML 标签使用 |

让步规则:
- CRITICAL 之间不存在冲突(如果出现,说明约束定义有矛盾,需要修正约束本身)。
- MUST 与 CRITICAL 冲突时,MUST 无条件让步。
- 同域内 MUST 之间冲突时(如 Template 域内 CJK 字体嵌入导致包体积逼近 50MB),由 ThemeResolver 在组装阶段裁定并记录裁定理由到 IntentPacket.tradeoffs 字段。ThemeResolver 只裁定 Template 域内的 MUST 冲突,跨域质量权衡(如性能 vs 渲染质量)由 QualityGate 的 ReportBuilder 裁定并记录到 QualityReport。
- SHOULD 与任何更高级别冲突时让步,违反记录到 QualityReport 人工建议项(FR-D07 AC1)。

### 8.9 安全与内容隔离

- 跨任务数据隔离:每个任务独立 `output/<task-id>/` 目录,ThemePack 复用通过显式引用而非隐式共享(NFR-11)。
- 交付物零调试信息:Quality Gate L1 检查产物中不含 `console.log`、注释中的调试标记、过程元数据。
- 上下文复用边界:ContextCollector 区分可复用上下文和任务专属上下文(FR-A03),专属上下文不跨任务泄露。

## 9. 架构决策

关键技术决策通过 ADR 记录,存放于 `docs/architecture/decisions/` 目录。

| ADR | 决策 | 状态 | 核心取舍 |
|-----|------|------|----------|
| [ADR-001](decisions/sa01-ADR-001-html-primary-format.md) | HTML 作为主格式 + PPTX 双轨输出 | accepted | 渲染自由度 vs PPTX 映射成本,选择 HTML 统一管线 + Export Adapter 派生 |
| [ADR-002](decisions/sa01-ADR-002-skill-contract-routing.md) | Skill Contract 与路由机制 | accepted | 声明式合同 vs 代码注册,选择 YAML frontmatter + 目录扫描自动发现 |
| [ADR-003](decisions/sa01-ADR-003-quality-gate-strategy.md) | 质量门禁三层分级策略 | accepted | 检查深度 vs 延迟成本,选择 L1 规则 + L2 DOM + L3 可选 LLM 分层递进 |
| [ADR-004](decisions/sa01-ADR-004-zero-image-api-visual.md) | 零模态依赖视觉实现 | accepted | 视觉丰富度 vs 外部依赖,选择 HTML/CSS/SVG/JS 纯本地渲染,模态模型可选增强 |
| [ADR-005](decisions/sa01-ADR-005-host-adapter-design.md) | 宿主适配层设计 | accepted | 集成深度 vs 可移植性,选择 Host Adapter 模式隔离宿主差异 |

决策间依赖关系:
- ADR-001(HTML 主格式)是 ADR-003(DOM 检查层)和 ADR-004(CSS/SVG 视觉)的前提
- ADR-002(Skill Contract)是 ADR-005(Host Adapter)的路由基础
- ADR-004 依赖 ADR-001 提供的 HTML/CSS 原生宿主环境

## 10. 质量需求

### 10.1 质量树

```
                        Claw Design 质量
                              │
          ┌───────────┬───────┼───────┬───────────┐
          │           │       │       │           │
       交付可靠性   响应性能  可编辑性  可扩展性    可移植性
          │           │       │       │           │
     ┌────┴────┐   ┌──┴──┐  ┌┴┐   ┌──┴──┐     ┌──┴──┐
     结构一致  假交付  路由  生成  文本  图片  接入  零改动  跨平台  包体积
     ≥95%    =0    ≤3s  ≤30s ≥90% ≤5%  ≤1天  扩展   ≥3    ≤50MB
```

### 10.2 质量场景

| ID | 质量属性 | 场景 | 度量 | 对应需求 |
|----|---------|------|------|----------|
| QS-01 | 交付可靠性 | 相同输入两次生成,页面结构和信息层级一致 | 结构一致率 ≥ 95% | NFR-01 |
| QS-02 | 交付可靠性 | 质量门禁存在阻断项时,系统阻止交付包生成 | 假交付率 = 0 | NFR-01, AC-05 |
| QS-03 | 响应性能 | 用户输入一句话,系统返回路由结论和缺口清单 | 路由 ≤ 3s,澄清 ≤ 5s | NFR-02 |
| QS-04 | 响应性能 | 单页产物从 Skill 接收 ArtifactSpec 到输出 HTML | 首稿 ≤ 30s | NFR-02 |
| QS-05 | 响应性能 | Quality Gate L1+L2 完成全部检查并输出报告 | ≤ 10s | NFR-02 |
| QS-06 | 可编辑性 | 用户用 PowerPoint/WPS 打开导出的 PPTX,文本框可直接编辑 | 文本可编辑率 ≥ 90% | NFR-03 |
| QS-07 | 可编辑性 | 复杂页面触发图片回退导出 | 整页图片退化率 ≤ 5% | NFR-03, FR-C03 |
| QS-08 | 可扩展性 | Skill 贡献者写好 SKILL.md + frontmatter,放入 skills/ 目录 | 路由可用 ≤ 1 人天 | NFR-05, ADR-002 |
| QS-09 | 可扩展性 | 新增一种交付物类型 | 不修改 Router/Gate/Export 代码 | NFR-05 |
| QS-10 | 可移植性 | 用户在 macOS Safari、Windows Chrome、Linux Firefox 打开 HTML 交付物 | ≥ 3 种浏览器可用 | NFR-06 |
| QS-11 | 可移植性 | `clawhub install claw-design` 安装完整 skill pack | 包体积 ≤ 50 MB | NFR-06 |
| QS-12 | 可观测性 | 任务失败后查看 trace 日志定位失败环节 | 7 段管线均有 trace 记录 | NFR-07 |
| QS-13 | 视觉一致性 | 同一任务生成的 HTML 和 PPTX 在标题、配色、图表上保持一致 | 主题偏差项 ≤ 2 处 | NFR-04 |
| QS-14 | 安全 | 任务 A 的品牌素材不出现在任务 B 的交付物中 | 跨任务泄露 = 0 | NFR-11 |

## 11. 风险与技术债

### 11.1 技术风险

| ID | 风险 | 影响 | 概率 | 缓解措施 |
|----|------|------|------|----------|
| R-01 | HTML→PPTX 映射质量不达标 | PPTX 可编辑率 < 90%,用户体验下降 | 中 | 早期做映射 PoC,建立回退策略(FR-C03),Quality Gate L1 检查导出质量 |
| R-02 | CSS/SVG 视觉表现力不足 | 海报、宣传图等视觉密集型产物吸引力不够 | 中 | 持续积累 CSS/SVG 模式库,产品定位聚焦结构化设计而非图片生成 |
| R-03 | LLM 意图识别不稳定 | 路由准确率 < 90%,用户需要反复纠偏 | 中 | IntentClassifier 输出候选列表 + 置信度,低置信度走澄清路径而非猜测 |
| R-04 | 质量门禁规则覆盖面初期不足 | 低质量产物漏过门禁 | 高 | 质量回路机制持续补充规则,聚焦高频问题的阻断规则 |
| R-05 | 已有 Skill 接口不稳定 | html-ppt-skill 等上游 Skill 变更导致生成失败 | 低 | Design Skill 通过 SkillBase 封装上游调用,隔离变更影响 |

### 11.2 技术债

| ID | 债务 | 产生原因 | 偿还计划 |
|----|------|---------|----------|
| TD-01 | 路由为精确匹配,不支持模糊意图 | 简化起步,3 个 Skill 不需要复杂匹配 | 后续引入 CompositeRouter 和评分排序 |
| TD-02 | Quality Gate L1/L2 规则硬编码 | 快速验证门禁机制 | 后续抽取为可配置规则文件,AntiPatternDetector 消费 JSON 数据清单 |
| TD-03 | 只有 OpenClawAdapter 和 CLIAdapter | 初期资源有限 | 按需增加其他宿主 Adapter |
| TD-04 | Theme Pack 只支持 CSS 自定义属性注入 | 满足基础主题需求 | 后续扩展为完整 Theme Engine(VariantGenerator + ThemeConflictResolver + ComponentLibrary) |
| TD-05 | Skill Contract 只有 3 个核心字段 | 简化形态 | 后续扩展完整合同结构(ContractRegistry + InterfaceValidator + LifecycleManager) |

---

## 12. 术语表

| 术语 | 定义 |
|------|------|
| Artifact | 设计产物,Skill 生成的主结果(HTML 文件 + 元数据)。生命周期:generating → ready ⇄ revision → archived |
| ArtifactSpec | 交付物结构定义,描述页面数、信息层级、模块清单和产物关系 |
| Brand Kit | Theme Pack 的结构化子集,聚焦颜色、字体、标识、间距等品牌约束 |
| DeliveryBundle | 最终交付包,含产物文件、用途分组、阅读说明和质量摘要 |
| DesignRequest | 用户原始需求经 Host Adapter 标准化后的结构化输入 |
| Design Skill | 生成特定类型设计产物的能力单元,通过 Skill Contract 声明能力 |
| Export Adapter | 从 HTML 主结果派生其他交付格式的适配组件 |
| Host Adapter | 宿主适配层,将不同宿主环境的输入/输出标准化为统一接口 |
| IntentPacket | 识别和收束后的任务意图包,定义主产物、附属产物、优先级和缺口 |
| Quality Gate | 质量门禁,独立于生成链路的三层验证机制(L1 规则 / L2 DOM / L3 LLM) |
| QualityReport | 质量门禁输出,包含通过项、提醒项、阻断项和人工建议 |
| Skill Contract | Skill 的能力声明合同,YAML frontmatter 格式 |
| SkillBase | Design Skill 共享能力底座,提供主题变量、图形基元、版式骨架和反模式清单 |
| Theme Engine | 品牌上下文引擎,管理 Theme Pack 解析、Brand Kit 提取和主题变量注入 |
| ThemePack | 任务级视觉上下文容器,承接品牌规则、风格倾向、版式偏好和历史风格 |
| ClarificationEngine | 全阶段意图模糊检测与结构化提问引擎。在 routing/execution/quality 三阶段检测到意图模糊或决策缺口时触发结构化提问,单阶段最多 2 轮,超限后采用默认值继续推进 |
| CompositeIntentSplitter | 多意图拆分器。从单条请求中识别多个设计意图,输出意图依赖图(DAG),标注执行顺序和嵌入关系(FR-A05) |
| CoProductionOrchestrator | 联产编排器。按意图依赖图编排多 Skill 并行/串行执行,共享 ThemePack 和信息主线(FR-A06) |
| RouteExplainer | 路由解释器。将路由结论翻译为业务用户可读的说明,支持触发重新路由(FR-A07) |
| PipelineTracer | 管线追踪器。关联记录全链路事件,支持失败归因分类和 48 小时内复盘(FR-A08) |
| RevisionEngine | 增量修订引擎。管理 Artifact 的增量修改、状态流转(ready⇄revision)和版本快照(FR-B12) |
| ContractRegistry | 合同注册表。管理所有 Skill 的 SkillContract,提供注册、查询、版本比对(FR-F01) |
| SandboxExecutor | 沙箱执行器。限制扩展 Skill 的执行边界,隔离失败影响(FR-F04) |
| EcosystemPortal | 生态发现入口。提供 Skill 搜索、筛选、安装的统一入口(FR-F05) |
| BrandComplianceChecker | 品牌合规检查器。检查产物是否遵循 ThemePack/BrandKit 约束(FR-D04) |
| AntiPatternDetector | 反模式检测器。基于结构化数据清单检测低质量产物(FR-D05) |
| CrossFormatValidator | 跨格式校验器。检查不同导出格式间的信息结构和视觉语言一致性(FR-C06) |
| VariantGenerator | 变体生成器。同一内容+主题下生成多种可区分的版式/风格方案(FR-E03) |
| ThemeConflictResolver | 主题冲突裁定器。处理 ThemePack/BrandKit/任务材料间的优先关系冲突(FR-E05) |
| PrototypeSkill | 交互原型生成 Skill。产出可点击、有状态切换、有 hash 路由的单文件 HTML 原型,无需构建工具或运行时依赖 |
