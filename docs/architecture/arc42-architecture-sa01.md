# Claw Design — arc42 架构文档

**版本**：1.0
**日期**：2026-04-19
**作者**：Claude Code（OpenClaw ACP Agent）
**状态**：Accepted

---

## 1. 引言与目标（Introduction and Goals）

### 1.1 需求概览

Claw Design 是一个 AI 设计引擎 skill pack，一句话生成演示文稿、图表、架构图、海报等 10 余种设计产物。系统按七段管线工作：输入接收 → 意图判定 → 上下文收束 → 结构成稿 → 技能生成 → 质量门禁 → 交付打包。

核心能力分布在六个域：意图路由（A）、设计技能（B）、导出适配器（C）、质量门禁（D）、品牌上下文（E）、Skill 扩展协议（F）。

详细需求规格：`docs/product-requirements.md`

### 1.2 质量目标

| 优先级 | 质量目标 | 场景描述 |
|--------|---------|---------|
| 1 | 交付可靠性 | 相同输入结构一致率 ≥ 95%，假交付率 = 0 |
| 2 | 响应性能 | 路由 ≤ 3s，单页首稿 ≤ 30s，质量门禁 ≤ 10s |
| 3 | 可编辑性 | PPTX 文本可编辑率 ≥ 90%，整页图片退化率 ≤ 5% |
| 4 | 可扩展性 | 新 Skill 接入 ≤ 1 人天，不修改已有代码 |
| 5 | 可移植性 | 核心零平台专属依赖，≥ 3 种浏览器/办公工具可用 |

### 1.3 干系人

| 角色 | 关注点 | 期望 |
|------|--------|------|
| 内容创作者 | 一句话出稿，结果可编辑可交付 | 无需拆解任务，双格式交付 |
| Agent 开发者 | 接入简单，接口稳定 | 标准化 skill contract，宿主解耦 |
| Skill 贡献者 | 扩展门槛低，生态可发现 | 统一合同 + 注册 + 发现入口 |
| 设计系统维护者 | 主题和模板可治理 | Theme Pack 复用，品牌合规检查 |

---

## 2. 架构约束（Architecture Constraints）

### 2.1 技术约束

| 约束 | 说明 |
|------|------|
| HTML 为主表达格式 | 所有产物先生成 HTML，再派生其他格式（AC-02） |
| CSS/SVG 默认 + ImageProvider 接口 | 视觉实现默认使用 CSS/SVG/代码渲染；ImageProvider 接口为一等公民（含 NullImageProvider 默认实现），实际图像生成 provider 按需对接（AC-03, NFR-12） |
| Node.js ≥ 18 运行时 | PPTX 生成依赖 PptxGenJS，质量检查脚本需要 DOM 解析能力 |
| Python 3.10+ 辅助运行时 | 质量门禁脚本、可观测性工具与 harness 生态一致 |
| 独立分发包 ≤ 50 MB | 核心 skill pack 不捆绑大型二进制依赖（NFR-06） |
| CJK 渲染准确率 ≥ 99% | 中日韩字符排版需专门处理字体回退和行距（NFR-09） |

### 2.2 组织约束

| 约束 | 说明 |
|------|------|
| Solo founder + AI agents | 架构偏好约定优于配置，减少人工维护面 |
| 开源核心 + 增强层分离 | 核心能力 MIT 开源，增强主题/模板/企业功能可商业化 |
| 增量交付 | 架构必须支持增量交付，核心模块可独立运行 |

### 2.3 惯例

| 惯例 | 说明 |
|------|------|
| Skill 定义用 SKILL.md + YAML frontmatter | 与 OpenClaw/Claude Code skill 生态一致 |
| 质量脚本用 Python3 | 与 harness hook 生态一致 |
| 主题配置用 YAML | 人类可读，AI 可解析 |
| 导出脚本用 Node.js | PptxGenJS 生态，DOM 操作原生支持 |

---

## 3. 上下文与范围（Context and Scope）

### 3.1 业务上下文

```
                    ┌─────────────────┐
  用户（自然语言）──▶│                 │──▶ Delivery Bundle
                    │   Claw Design   │    (HTML + PPTX + PDF + ...)
  宿主环境 ◀───────▶│   Skill Pack    │
  (OpenClaw/CLI/    │                 │──▶ Quality Report
   其他 harness)    └─────────────────┘
                          │
                    已有 Skills 复用
                    (html-ppt-skill,
                     chart-craft-plus,
                     architecture-diagram-zh,
                     mermaid-generator,
                     anthropic-pptx)
```

| 参与者 | 输入 | 输出 |
|--------|------|------|
| 用户 | 自然语言需求、附件、品牌素材 | Delivery Bundle、Quality Report、路由说明 |
| 宿主环境 | 会话上下文、用户回填答案 | 澄清请求、结果摘要、交付包路径 |
| 已有 Skills | 被 Claw Design 编排调用 | HTML/SVG/Mermaid 中间产物 |
| LLM 服务 | 宿主环境透传的 LLM 能力 | 意图识别结果、内容生成结果（非 Claw Design 自带） |

### 3.2 技术上下文

| 接口 | 协议 | 数据格式 | 说明 |
|------|------|---------|------|
| Skill 入口 | Claude Code skill invoke | Markdown prompt + 文件路径 | 宿主调用 Claw Design 的唯一入口 |
| 宿主适配器 | 函数调用 | JSON（DesignRequest） | 标准化输入，隔离宿主差异 |
| 文件系统 I/O | 本地 FS | HTML/PPTX/PDF/ZIP/YAML | 所有产物通过文件系统交付 |
| 已有 Skill 调用 | Claude Code skill invoke | Prompt + 文件 | 复用已有生成能力 |

---

## 4. 解决方案策略（Solution Strategy）

| 质量目标 | 策略 | 详见 |
|---------|------|------|
| 交付可靠性 | 质量门禁三层架构（规则/DOM/LLM），阻断项硬拦截 | ADR-003 |
| 响应性能 | 管线流式推进，质量检查并行化，重型检查可选 | §6 运行视图 |
| 可编辑性 | HTML→PPTX 双轨输出，结构化映射优先，图片回退兜底 | ADR-001 |
| 可扩展性 | Skill contract 统一声明，路由自动发现，零改动接入 | ADR-002 |
| 可移植性 | Host Adapter 层隔离宿主差异，核心逻辑零平台依赖 | ADR-005 |
| 零模态依赖 + 可选模态增强 | HTML/CSS/SVG/JS 为主渲染路径，模态模型作为可选 Provider 接入，未配置时主渲染路径独立完成全部产出 | ADR-004 |

技术选型：

| 层面 | 选型 | 理由 |
|------|------|------|
| 运行时 | Node.js（TypeScript） | 与 OpenClaw 生态一致，HTML/CSS 处理原生支持 |
| 视觉渲染 | CSS + SVG + Mermaid（默认）；ImageProvider 接口（一等公民） | 默认零外部依赖，矢量输出，Theme Pack 变量注入；NullImageProvider 走 CSS/SVG fallback，按需对接实际图像生成服务 |
| PPTX 生成 | PptxGenJS | 已有 lovstudio-any2deck 可复用 |
| DOM 检查 | cheerio | 轻量 HTML 解析，无需浏览器环境 |
| 主题注入 | CSS 自定义属性 | 原生支持级联和覆盖 |

技术决策摘要：
- HTML 作为主格式 + PPTX 双轨输出 → ADR-001
- Skill contract 驱动路由，简化形态 → ADR-002
- 质量门禁三层分级（规则引擎 / DOM 检查 / 可选 LLM） → ADR-003
- CSS + SVG + Mermaid 默认视觉方案 + ImageProvider 接口（NullImageProvider 默认实现）→ ADR-004
- Host Adapter 模式，OpenClaw 优先兼容其他 harness → ADR-005

---

## 5. 构建块视图（Building Block View）

### 5.1 Level 1：系统整体

```
┌──────────────────────────────────────────────────────┐
│                   Claw Design Skill Pack              │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ Host     │  │ Intent   │  │ Design Skills    │   │
│  │ Adapter  │─▶│ Router   │─▶│ (B01-B12)        │   │
│  │ (基础设施)│  │ (域 A)   │  │ (域 B)           │   │
│  └──────────┘  └────┬─────┘  └────────┬─────────┘   │
│                     │                  │              │
│  ┌──────────┐  ┌────▼─────┐  ┌────────▼─────────┐   │
│  │ Theme    │  │ Quality  │  │ Export           │   │
│  │ Engine   │─▶│ Gate     │◀─│ Adapters         │   │
│  │ (域 E)   │  │ (域 D)   │  │ (域 C)           │   │
│  └──────────┘  └──────────┘  └──────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │ Skill Extension Protocol (域 F)     │    │
│  └──────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

| 构建块 | 职责 | 对外接口 |
|--------|------|---------|
| Host Adapter（基础设施层） | 标准化宿主输入为 DesignRequest，回传结果和澄清请求。独立于六域，属于跨域基础设施 | `adapt(rawInput) → DesignRequest`，`deliver(bundle)` |
| Intent Router（域 A） | 意图识别、缺口澄清、上下文收束、Skill 路由选择 | `route(DesignRequest) → RoutingPlan` |
| Design Skills（域 B） | 按产物类型生成 HTML 主结果 | `generate(ArtifactSpec, ThemePack) → Artifact` |
| Export Adapters（域 C） | 从 HTML 主结果派生 PPTX/PDF/PNG/SVG/ZIP | `export(Artifact, format) → ExportedFile` |
| Quality Gate（域 D） | 三层质量检查，输出 Quality Report | `check(Artifact) → QualityReport` |
| Theme Engine（域 E） | Theme Pack 解析、Brand Kit 提取、主题变量注入 | `resolve(context) → ThemePack` |
| Skill Extension Protocol（域 F） | Skill 合同定义、注册、发现、生命周期管理。初期只保留内置注册表 + sidecar contract，不做开放式插件系统 | `register(SkillContract)`，`discover(criteria)` |

### 5.2 Level 2：关键子系统分解

#### Intent Router（域 A）内部

| 组件 | 职责 |
|------|------|------|
| IntentClassifier | 从自然语言识别主/附交付物类型（十类） |
| GapAnalyzer | 识别缺口，生成结构化澄清清单 |
| ContextCollector | 识别并收束上下文包（品牌、历史、参考） |
| SkillMatcher | 基于 skill contract 匹配最佳 Skill |
| CompositeRouter | 多意图组合路由、联产编排 |
| RouteExplainer | 生成用户可读的路由说明 |
| RouteTracer | 路由可观测性，关联全链路记录 |

输入：DesignRequest（经 Host Adapter 标准化后的用户需求）
输出：RoutingPlan（主产物类型、附属产物、缺口清单、已采纳上下文、匹配的 Skill 列表）

边界规则：
- Routing 域只做判断和匹配，不做内容生成
- 置信度不足时返回候选和澄清建议，不进入生成链路
- SkillMatcher 只在满足合同条件的 Skill 范围内选择

#### Design Skills（域 B）内部

每个 Skill 是独立模块，共享 SkillBase 底座：

| Skill | 复用已有 Skill |
|-------|---------------|------|
| SlidesSkill（FR-B01） | html-ppt-skill |
| ChartSkill（FR-B02） | chart-craft-plus |
| ArchDiagramSkill（FR-B03） | architecture-diagram-zh, mermaid-generator |
| FlowchartSkill（FR-B04） | mermaid-generator |
| PosterSkill（FR-B05） | — |
| LandingPageSkill（FR-B06） | — |
| MockupSkill（FR-B07） | — |
| DashboardSkill（FR-B08） | — |
| InfographicSkill（FR-B09） | — |
| LogicDiagramSkill（FR-B10） | mermaid-generator |
| SkillBase（FR-B11） | — |
| ImageProvider 接口 | — |
| NullImageProvider | — |

SkillBase（FR-B11）提供完整共享能力底座（主题变量、图形基元、版式骨架、反模式清单）。各 Skill 内联实现模板装载、ThemePack token 注入、统一 Artifact 输出结构三项最小能力，后续抽取为独立模块。

输入：ArtifactSpec + ThemePack + 模板骨架
输出：Artifact（HTML 主结果 + 元数据，状态为 generating → ready）

边界规则：
- 每个 Skill 只输出 HTML，不关心其他格式
- Skill 通过 CSS 自定义属性消费 ThemePack 变量
- 视觉实现默认使用 CSS + SVG + Mermaid；Skill 通过 ImageProvider 接口请求图像素材，有实际 provider 时使用生成图，否则 NullImageProvider 返回 null 触发 CSS/SVG fallback
- ImageProvider 接口：`generate(prompt, constraints) → ImageAsset | null`，NullImageProvider 为默认实现，按需对接 DALL-E/Gemini 等实际图像生成服务
- 单 Skill 失败不拖垮整条管线（FR-F04）

Skill 注册方式：现有 skill（html-ppt-skill、chart-craft-plus、architecture-diagram-zh）的 SKILL.md frontmatter 不包含 ADR-002 定义的 `artifact_type` / `input_types` / `required_context` 字段。采用内置注册表（built-in registry）显式映射首批 Skill 的能力合同，而非目录扫描自动发现。每个 Skill 配套一份 sidecar contract 文件（`skills/<skill>/contract.yaml`），声明产物类型、输入范围、上下文需求和能力边界。目录扫描自动发现延迟到 Skill Extension Protocol 完整实现时启用。

#### Theme Engine（域 E）内部

| 组件 | 职责 |
|------|------|------|
| ThemeResolver | 组装 Theme Pack：合并品牌规则、历史风格、任务级要求 |
| BrandExtractor | 从素材中提取品牌线索，形成 Brand Kit |
| TemplateRegistry | 管理预置模板骨架和变体方案 |
| ComponentLibrary | 管理可复用组件资产（标题区、图表容器、封面结构等） |

输入：IntentPacket 中的上下文信息 + 用户提供的品牌素材
输出：ThemePack（颜色、字体、间距、版式偏好、图形语言）+ 匹配的模板骨架

边界规则：
- Theme Pack 在生成前确定，生成过程必须服从其边界
- 多来源冲突时输出优先级判断和采用结果
- 未提供品牌上下文时采用统一基线风格

最小字段集：ThemePack 先冻结为颜色（主色/辅色）、字体（标题/正文）、间距级别、亮/暗主题、少量版式 token。图形语言、高级品牌规则、模板变体等字段后续扩展。

#### Export Adapters（域 C）内部

| 组件 | 职责 |
|------|------|------|
| HtmlExporter | 打包独立 HTML（index.html + assets/ → zip） |
| PptxExporter | HTML → PPTX 结构化映射（复用 PptxGenJS） |
| PdfExporter | HTML → PDF 导出，保持页序、标题层级和主视觉内容（FR-C04） |
| ImageExporter | 单页/单图导出为 PNG 或 SVG，矢量产物优先保留 SVG（FR-C05） |
| FallbackHandler | 识别复杂页面，执行图片回退策略（FR-C03） |
| BundleAssembler | 组织交付包：产物文件 + 清单 + 阅读说明 + 质量摘要（结构见下方 DeliveryBundle 定义） |

输入：Artifact（质量通过后）+ QualityReport
输出：DeliveryBundle（zip 包含 HTML + PPTX + 清单 + 说明）

DeliveryBundle ZIP 内部结构（FR-C07 AC4）：

```
<task-id>-delivery.zip
├── index.html              # HTML 主产物入口
├── assets/                 # HTML 依赖资源
│   ├── style.css
│   ├── fonts/
│   └── images/             # SVG/内联图片
├── slides.pptx             # PPTX 导出（如有）
├── manifest.json           # 产物清单（文件名、类型、用途分组）
├── quality-summary.json    # 质量摘要（通过/提醒/阻断计数 + 后续可调整方向）
└── README.md               # 阅读说明（产物概览、打开方式、修订建议）
```

- `manifest.json` 列出所有产物文件及其用途分组（FR-C07 AC1/AC2）
- `quality-summary.json` 为 QualityReport 的精简版，附后续可调整方向（FR-C07 AC3）
- HTML 类产物解压后可直接在浏览器中打开（FR-C07 AC4）

边界规则：
- 只在质量结论为 pass 或 warn 时执行导出
- PPTX 回退策略只影响必要页面，不拖累整个交付物
- 导出后执行跨格式一致性检查（FR-D06）

HTML→PPTX 映射策略：PptxExporter 按语义块映射 HTML 到 PPTX 元素。可 1:1 映射的结构（标题、正文段落、列表、表格、基础形状）直接转为 PPTX 文本框/表格/形状；复杂结构（多层嵌套布局、CSS 动画、自定义 SVG 组合）触发 FallbackHandler 回退为页面截图。回退页在 QualityReport 中逐页标注原因。先跑通 10 个典型页面的映射 PoC，确立可编辑率基线后再扩展覆盖面。验收标准包含 PowerPoint 和 WPS 双端打开测试、中文字体渲染校验、回退页标注完整性。

#### Host Adapter 内部

| 组件 | 职责 |
|------|------|------|
| OpenClawAdapter | OpenClaw 环境适配（会话上下文、文件交付、澄清交互） |
| CLIAdapter | 通用 CLI 回退（stdin/stdout/文件系统） |

接口契约：
- `adapt(rawInput) → DesignRequest`：标准化输入
- `clarify(gaps) → ClarificationRequest`：缺口澄清转发
- `deliver(bundle) → DeliveryResult`：交付包送达

边界规则：
- Host Adapter 是独立基础设施层，不属于六域中的任何一个
- 核心管线零宿主依赖，所有宿主交互通过 Adapter 接口
- 新宿主只需实现三个方法
- 初期只实现 OpenClawAdapter + CLIAdapter，不做更多宿主适配

#### Quality Gate（域 D）三层架构

| 层 | 检查方式 | 工具 | 延迟 |
|----|---------|------|------|
| L1 规则引擎 | 静态规则匹配（结构、内容、格式） | Python3 脚本 + 正则/JSON Schema | < 2s |
| L2 DOM 检查 | HTML DOM 解析（结构校验、样式 token 级检查、对比度计算） | cheerio（Node.js）或 BeautifulSoup | < 5s |
| L3 LLM 语义 | 独立 LLM 意图符合度审查（FR-D08） | Claude API 调用 | < 15s |

L1 + L2 为默认启用，L3 为用户可选（默认关闭）。

品牌合规检查（FR-D04）分布在两层：L1 通过规则匹配检查颜色值、字体名称是否落在 Brand Kit 边界内；L2 通过 DOM 解析检查视觉一致性（如标题层级、配色节奏、间距规律）。

反模式检查（FR-D05）同样跨两层：L1 通过规则匹配识别常见低质量模式（信息堆砌、字号滥用、过度动画）；L2 通过 DOM 结构分析检测风格漂移和模板化痕迹。

L1 + L2 的能力边界：L1 和 L2 均为静态分析，基于 DOM 结构和样式 token 做检查，能覆盖结构完整性、属性值校验、对比度计算、元素计数等场景。真实渲染级检查（字号溢出、元素重叠、留白失衡等布局问题）需要浏览器渲染环境，作为增强能力单独规划，不纳入默认链路。

---

## 6. 运行视图（Runtime View）

### 6.1 场景：单产物生成（主路径）

```
用户 → 宿主 → HostAdapter: 自然语言需求
HostAdapter → IntentRouter: DesignRequest
IntentRouter → IntentClassifier: 识别产物类型
IntentRouter → GapAnalyzer: 检查缺口
  [缺口存在] IntentRouter → HostAdapter → 宿主: 澄清请求
  [缺口回填] 宿主 → HostAdapter → IntentRouter: 补充信息
IntentRouter → ContextCollector: 收束上下文 + ThemePack
IntentRouter → SkillMatcher: 选择 Skill
SkillMatcher → DesignSkill: ArtifactSpec + ThemePack
DesignSkill → Artifact(HTML): 生成主结果（状态: generating → ready）
Artifact → QualityGate: L1 规则检查 + L2 DOM 检查
  [阻断] QualityGate → QualityReport: 阻断项 → 不交付
  [通过] QualityGate → QualityReport: 通过/提醒
Artifact → ExportAdapter: HTML→ZIP, HTML→PPTX
ExportAdapter → QualityGate: L1 导出可用性检查（FR-D06）
ExportAdapter + QualityReport → DeliveryBundle: 打包
HostAdapter → 宿主: 交付包路径 + 结果摘要
```

关键时序约束：
- 路由阶段（IntentClassifier → SkillMatcher）总耗时 ≤ 3s
- 单页生成（DesignSkill → Artifact）≤ 30s
- 质量门禁（L1 + L2）≤ 10s
- 导出打包（ExportAdapter → BundleAssembler）≤ 15s

### 6.2 场景：多产物联产

```
IntentRouter → CompositeRouter: 识别主+附交付物
CompositeRouter → SkillMatcher: 按依赖顺序分配 Skills
SkillMatcher → Skill_A: 主交付物生成
SkillMatcher → Skill_B: 附属交付物生成（共享 ThemePack）
[所有 Artifact ready] → QualityGate: 批量检查
QualityGate → DeliveryBundle: 按用途分组打包
```

联产约束：所有产物共享同一份 ThemePack，中间结构复用率 ≥ 70%。

### 6.3 场景：增量修订

```
用户: "把第三页配色换成深蓝"
IntentRouter: 识别为修订意图，定位目标 Artifact
Artifact: ready → revision
DesignSkill: 增量修改（不重新生成）
Artifact: revision → ready
QualityGate: 重新检查修改部分
ExportAdapter: 增量导出
```

---

## 7. 部署视图（Deployment View）

### 7.1 基础设施

Claw Design 作为 skill pack 运行在用户本地环境，不需要独立服务器。

### 7.2 部署映射

| 构建块 | 部署形态 | 说明 |
|--------|---------|------|
| Skill Pack 整体 | 本地目录 `skills/claw-design/` | `clawhub install claw-design` 安装 |
| Design Skills | SKILL.md + references/ + templates/ | 每个 Skill 一个子目录 |
| Quality Gate 脚本 | `scripts/quality/` 下 Python3 脚本 | 随 skill pack 分发 |
| Export Adapters | `scripts/export/` 下 Node.js 脚本 | PptxGenJS 等依赖通过 package.json 管理 |
| Theme Packs | `themes/` 下 YAML + CSS 文件 | 预置主题随 pack 分发，用户可扩展 |
| 产物输出 | 用户工作目录下 `output/` | 运行时创建，不随 pack 分发 |

### 7.3 目录结构

```
claw-design/
├── SKILL.md                  # 顶层 Skill 声明
├── package.json              # Node.js 依赖（pptxgenjs, cheerio）
├── requirements.txt          # Python 依赖（beautifulsoup4, pyyaml）
├── install.sh                # 一键安装脚本
├── skills/                   # Design Skills
│   ├── slides/               # 演示文稿 Skill
│   ├── chart/                # 图表 Skill
│   └── arch-diagram/         # 架构图 Skill
├── scripts/
│   ├── quality/              # L1/L2 质量检查脚本
│   └── export/               # 导出适配脚本
├── themes/                   # 预置 Theme Packs
├── adapters/                 # Host Adapters
│   ├── openclaw-adapter.ts
│   └── cli-adapter.ts
└── output/                   # 运行时产物（.gitignore）
```

### 7.4 宿主适配

| 宿主 | Adapter | 安装方式 | 优先级 |
|------|---------|---------|--------|
| OpenClaw | OpenClawAdapter | 随 skill pack 内置 |
| CLI | CLIAdapter | 随 skill pack 内置 |
| 其他 Agent 平台 | 按需实现 | 独立 Adapter 包 |

### 7.5 依赖与环境要求

- Node.js ≥ 18（TypeScript 运行时、PptxGenJS、cheerio）
- Python ≥ 3.11（Quality Gate L1 脚本）
- 分发包体积 ≤ 50 MB（NFR-06）
- 性能基准：Apple M1 / 16GB RAM / Node 18 / Python 3.11。云端或低配环境允许 1.5x 系数。

---

## 8. 横切关注点（Crosscutting Concepts）

### 8.1 领域模型

核心对象及流转关系（对应需求规格概念架构）：

```
DesignRequest → IntentPacket → ThemePack
                    ↓
              ArtifactSpec → Artifact → QualityReport → DeliveryBundle
                               ↑↓
                            ExportedFile
```

| 对象 | 技术表示 | 持久化 |
|------|---------|--------|
| DesignRequest | JSON 对象 | 不持久化，管线内传递 |
| IntentPacket | JSON 对象 | 可选写入 `output/.trace/` |
| ThemePack | YAML 文件 | `themes/` 目录，可跨任务复用 |
| ArtifactSpec | JSON 对象 | 管线内传递 |
| Artifact | HTML 文件 + 元数据 JSON | `output/<task-id>/` |
| QualityReport | JSON 文件 | `output/<task-id>/quality-report.json` |
| DeliveryBundle | ZIP 文件（结构见 §5.2 Export Adapters） | `output/<task-id>/delivery/` |
| SkillContract | YAML frontmatter in SKILL.md | 随 skill 定义文件 |

Artifact 状态机（四态）：`generating → ready ⇄ revision → archived`

### 8.2 主题变量注入

Theme Pack 通过 CSS 自定义属性注入所有 Design Skill 的输出：

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

PPTX 导出时，Export Adapter 读取同一份 ThemePack YAML 映射为 PptxGenJS 主题参数。

### 8.3 错误处理

| 管线阶段 | 失败行为 | 用户可见信息 |
|---------|---------|-------------|
| 意图识别 | 返回候选类型 + 澄清建议，不进入错误链路 | "无法确定任务类型，请补充..." |
| Skill 生成 | 单 Skill 失败不拖垮整条管线（FR-F04） | "演示文稿生成失败：[原因]" |
| 质量门禁 | 阻断项阻止交付，提醒项放行并标注 | Quality Report 中分级展示 |
| 导出 | 回退策略（FR-C03），标明回退页面和原因 | "第 5 页使用图片回退导出" |
| 交付 | Host Adapter 交付失败时保留本地产物，返回本地路径 | "交付失败，产物已保存至 output/xxx/" |

### 8.4 可观测性

任务追踪覆盖全链路七段（NFR-07）：

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

写入 `output/<task-id>/.trace/pipeline.jsonl`，48 小时内可复盘（NFR-07）。

### 8.5 国际化与 CJK 支持

| 关注点 | 实现方式 |
|--------|----------|
| CJK 字体 | ThemePack 中 `--cd-font-body` 默认包含 Noto Sans SC/JP/KR 回退链 |
| 文本渲染 | HTML 原生 Unicode 支持，PPTX 导出时嵌入字体子集 |
| 日期/数字/单位 | 根据 IntentPacket 中的 locale 字段自动适配格式 |
| 排版方向 | CSS `writing-mode` 支持竖排（预留） |
| 渲染准确率 | CJK 文本渲染准确率 ≥ 99%（NFR-09） |

### 8.6 无障碍

| 关注点 | 实现方式 | 对应需求 |
|--------|----------|----------|
| 颜色对比度 | Quality Gate L2 检查文本/背景对比度 ≥ 4.5:1 | NFR-10 |
| 图表辅助说明 | 所有图表和图解生成 `aria-label` 或 `<figcaption>` | NFR-10 |
| 键盘导航 | 演示文稿 HTML 支持方向键翻页、Tab 焦点切换 | NFR-10 |
| 语义标签 | HTML 输出使用 `<section>`、`<article>`、`<nav>` 等语义元素 | NFR-10 |

### 8.7 安全与内容隔离

- 跨任务数据隔离：每个任务独立 `output/<task-id>/` 目录，ThemePack 复用通过显式引用而非隐式共享（NFR-11）。
- 交付物零调试信息：Quality Gate L1 检查产物中不含 `console.log`、注释中的调试标记、过程元数据。
- 上下文复用边界：ContextCollector 区分可复用上下文和任务专属上下文（FR-A03），专属上下文不跨任务泄露。

---

## 9. 架构决策（Architecture Decisions）

关键技术决策通过 ADR 记录，存放于 `docs/architecture/decisions/` 目录。

| ADR | 决策 | 状态 | 核心取舍 |
|-----|------|------|----------|
| ADR-001 | HTML 作为主格式 + PPTX 双轨输出 | accepted | 渲染自由度 vs PPTX 映射成本，选择 HTML 统一管线 + Export Adapter 派生 |
| ADR-002 | Skill Contract 与路由机制 | accepted | 声明式合同 vs 代码注册，选择 YAML frontmatter 声明式合同；内置注册表 + sidecar contract，目录扫描自动发现延迟到 Skill Extension Protocol 完整实现 |
| ADR-003 | 质量门禁三层分级策略 | accepted | 检查深度 vs 延迟成本，选择 L1 规则 + L2 DOM + L3 可选 LLM 分层递进 |
| ADR-004 | CSS/SVG 默认 + ImageProvider 一等公民 | accepted | 视觉丰富度 vs 外部依赖，默认 CSS + SVG + Mermaid 本地渲染，ImageProvider 接口以 NullImageProvider 跑通，按需对接实际图像生成服务 |
| ADR-005 | 宿主适配层设计 | accepted | 集成深度 vs 可移植性，选择 Host Adapter 模式隔离宿主差异 |

决策间依赖关系：
- ADR-001（HTML 主格式）是 ADR-003（DOM 检查层）和 ADR-004（CSS/SVG 视觉）的前提
- ADR-002（Skill Contract）是 ADR-005（Host Adapter）的路由基础
- ADR-004 依赖 ADR-001 提供的 HTML/CSS 原生宿主环境，ImageProvider 接口作为一等公民定义

---

## 10. 质量需求（Quality Requirements）

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
| QS-01 | 交付可靠性 | 用户提交相同输入，两次生成的页面结构和信息层级一致 | 结构一致率 ≥ 95% | NFR-01 |
| QS-02 | 交付可靠性 | 质量门禁存在阻断项时，系统阻止交付包生成 | 假交付率 = 0 | NFR-01, AC-05 |
| QS-03 | 响应性能 | 用户输入一句话，系统在 3 秒内返回路由结论和缺口清单 | 路由 ≤ 3s，澄清 ≤ 5s | NFR-02 |
| QS-04 | 响应性能 | 单页产物从 Skill 接收 ArtifactSpec 到输出 HTML | 首稿 ≤ 30s | NFR-02 |
| QS-05 | 响应性能 | Quality Gate L1+L2 完成全部检查并输出报告 | ≤ 10s | NFR-02 |
| QS-06 | 可编辑性 | 用户用 PowerPoint/WPS 打开导出的 PPTX，文本框可直接编辑 | 文本可编辑率 ≥ 90% | NFR-03 |
| QS-07 | 可编辑性 | 复杂页面触发图片回退导出 | 整页图片退化率 ≤ 5% | NFR-03, FR-C03 |
| QS-08 | 可扩展性 | Skill 贡献者写好 SKILL.md + frontmatter，放入 skills/ 目录 | 路由可用 ≤ 1 人天 | NFR-05, ADR-002 |
| QS-09 | 可扩展性 | 新增一种交付物类型（如「思维导图」） | 不修改 Router/Gate/Export 代码 | NFR-05 |
| QS-10 | 可移植性 | 用户在 macOS Safari、Windows Chrome、Linux Firefox 打开 HTML 交付物 | ≥ 3 种浏览器可用 | NFR-06 |
| QS-11 | 可移植性 | `clawhub install claw-design` 安装完整 skill pack | 包体积 ≤ 50 MB | NFR-06 |
| QS-12 | 可观测性 | 任务失败后，运维人员查看 trace 日志定位失败环节 | 7 段管线均有 trace 记录 | NFR-07 |
| QS-13 | 视觉一致性 | 同一任务生成的 HTML 和 PPTX 在标题、配色、图表上保持一致 | 主题偏差项 ≤ 2 处 | NFR-04 |
| QS-14 | 安全 | 任务 A 的品牌素材不出现在任务 B 的交付物中 | 跨任务泄露 = 0 | NFR-11 |
| QS-15 | 可用性 | 非技术用户无指导完成首次任务，结果摘要不含内部术语 | 首次成功率 ≥ 80%，术语泄露 = 0 | NFR-08 |
| QS-16 | 国际化 | 中日韩文本在 HTML 和 PPTX 交付物中字体回退正确、行距稳定、无乱码 | CJK 渲染准确率 ≥ 99% | NFR-09 |
| QS-17 | 无障碍 | 交付物文本颜色对比度达标，图表和图解均有辅助说明 | 对比度 ≥ 4.5:1，辅助说明覆盖率 100% | NFR-10 |

---

## 11. 风险与技术债（Risks and Technical Debt）

### 11.1 技术风险

| ID | 风险 | 影响 | 概率 | 缓解措施 |
|----|------|------|------|----------|
| R-01 | HTML→PPTX 映射质量不达标 | PPTX 可编辑率 < 90%，用户体验下降 | 中 | 早期做映射 PoC，建立回退策略（FR-C03），Quality Gate L1 检查导出质量 |
| R-02 | CSS/SVG 视觉表现力不足 | 海报、宣传图等视觉密集型产物吸引力不够 | 中 | 持续积累 CSS/SVG 模式库；ImageProvider 接口已就绪，对接实际图像生成服务后可增强视觉效果 |
| R-06 | 产出效果分级预期管理 | 用户对视觉效果期望超出当前能力范围 | 中 | 两级效果分级：Tier 1（CSS+SVG + NullImageProvider）覆盖结构化内容（PPT/图表/架构图/流程图），可达专业水准；Tier 2（+实际 ImageProvider 实现）覆盖自定义插画、照片级装饰、复杂视觉效果。Tier 1 已交付并跑通 ImageProvider 接口，对接实际图像生成服务后交付 Tier 2 |
| R-03 | LLM 意图识别不稳定 | 路由准确率 < 90%，用户需要反复纠偏 | 中 | IntentClassifier 输出候选列表 + 置信度，低置信度走澄清路径而非猜测 |
| R-04 | 质量门禁规则覆盖面初期不足 | 低质量产物漏过门禁 | 高 | 质量回路机制持续补充规则，聚焦高频问题的阻断规则 |
| R-05 | 已有 Skill 接口不稳定 | html-ppt-skill 等上游 Skill 变更导致 Claw Design 生成失败 | 低 | 各 Design Skill 内联封装上游调用，后续抽取为 SkillBase 统一隔离变更影响 |

### 11.2 技术债

| ID | 债务 | 产生原因 | 偿还计划 |
|----|------|---------|----------|
| TD-01 | 路由为精确匹配，不支持模糊意图 | 简化起步，3 个 Skill 不需要复杂匹配 | 后续引入 CompositeRouter 和评分排序 |
| TD-02 | Quality Gate L1/L2 规则硬编码 | 快速验证门禁机制 | 后续抽取为可配置规则文件（YAML/JSON） |
| TD-03 | 只有 OpenClawAdapter 和 CLIAdapter | 初期资源有限 | 按需增加其他宿主 Adapter |
| TD-04 | Theme Pack 只支持 CSS 自定义属性注入 | 满足基础主题需求 | 后续扩展为完整 Theme Engine（FR-E03/E04/E05） |
| TD-05 | Skill Contract 只有 3 个核心字段 | 简化形态 | 后续扩展完整合同结构（FR-F01/F02） |

---

## 12. 术语表（Glossary）

| 术语 | 定义 |
|------|------|
| Artifact | 设计产物，Skill 生成的主结果（HTML 文件 + 元数据）。生命周期：generating → ready ⇄ revision → archived |
| Artifact Spec | 交付物结构定义，描述页面数、信息层级、模块清单和产物关系 |
| Brand Kit | Theme Pack 的结构化子集，聚焦颜色、字体、标识、间距等品牌约束 |
| Delivery Bundle | 最终交付包，含产物文件、用途分组、阅读说明和质量摘要 |
| Design Request | 用户原始需求经 Host Adapter 标准化后的结构化输入 |
| Design Skill | 生成特定类型设计产物的能力单元，通过 Skill Contract 声明能力 |
| Export Adapter | 从 HTML 主结果派生其他交付格式（PPTX/PDF/PNG/SVG）的适配组件 |
| Host Adapter | 宿主适配层，将不同宿主环境的输入/输出标准化为统一接口 |
| ImageProvider | 图像生成接口（一等公民），`generate(prompt, constraints) → ImageAsset | null`。NullImageProvider 为默认实现（返回 null，触发 CSS/SVG fallback），按需对接 DALL-E/Gemini 等实际服务 |
| NullImageProvider | ImageProvider 的默认实现，始终返回 null，确保接口跑通，Skill 走 CSS/SVG fallback 路径 |
| Intent Packet | 识别和收束后的任务意图包，定义主产物、附属产物、优先级和缺口 |
| Intent Router | 意图路由器（域 A），负责意图识别、缺口澄清、上下文收束和 Skill 选择 |
| Quality Gate | 质量门禁（域 D），独立于生成链路的三层验证机制（L1 规则 / L2 DOM / L3 LLM） |
| Quality Report | 质量门禁输出，包含通过项、提醒项、阻断项和人工建议 |
| Skill Contract | Skill 的能力声明合同，YAML frontmatter 格式，声明产物类型、输入范围和上下文需求 |
| Skill Extension Protocol | Skill 扩展协议（域 F），定义新能力接入、发现和生命周期管理规则 |
| SkillBase | Design Skill 共享能力底座，提供主题变量、图形基元、版式骨架和反模式清单 |
| Theme Engine | 品牌上下文引擎（域 E），管理 Theme Pack 解析、Brand Kit 提取和主题变量注入 |
| Theme Pack | 任务级视觉上下文容器，承接品牌规则、风格倾向、版式偏好和历史风格 |
