# ADR-002: Skill Contract 与路由机制

**日期**：2026-04-19
**状态**：accepted
**决策者**：OpenClaw（sa-01 子Agent）

## 上下文（Context）

Claw Design 需要支持十类以上设计产物，每类由独立 Skill 实现。Intent Router 需要一种机制来发现、匹配和调用 Skill，同时保证新 Skill 接入不修改已有代码（NFR-05：≤ 1 人天接入）。

关键约束：初期只有 3 个 Skill，扩展协议（域 F）后续正式开放。路由机制需要在简单起步和未来扩展之间取得平衡。

## 备选方案（Options Considered）

### 方案 A：YAML Frontmatter 声明式合同 + 自动发现

- 描述：每个 Skill 在 SKILL.md 的 YAML frontmatter 中声明能力合同（产物类型、输入范围、上下文需求、质量预期），Router 启动时扫描 skills/ 目录自动注册
- 优点：与 OpenClaw/Claude Code skill 生态一致，声明即注册，零代码接入
- 缺点：YAML 表达能力有限，复杂匹配逻辑需要额外约定
- 成本/复杂度：低，复用已有 skill 生态惯例

### 方案 B：代码注册 + 插件接口

- 描述：每个 Skill 实现标准接口（register/match/generate），通过代码注册到 Router
- 优点：匹配逻辑灵活，可做复杂条件判断
- 缺点：接入门槛高，每个 Skill 需要写代码，与 AI agent 生态的声明式惯例不一致
- 成本/复杂度：中高，需要维护插件框架

### 方案 C：硬编码路由表

- 描述：Router 内部维护产物类型→Skill 的映射表
- 优点：实现最简单，初期够用
- 缺点：新 Skill 必须改 Router 代码，违反 NFR-05 和 FR-A04 AC3
- 成本/复杂度：初始低，长期高

## 决策（Decision）

选择方案 A：YAML Frontmatter 声明式合同 + 目录扫描自动发现。

简化形态：合同只声明 `artifact_type`、`input_types`、`required_context` 三个核心字段，Router 按产物类型精确匹配。后续扩展完整合同结构（FR-F01/F02），支持模糊匹配和评分排序。

理由：
- 与 OpenClaw skill 生态惯例一致，Skill 贡献者零学习成本
- 声明式合同天然支持 Router、Quality Gate、Export Adapter 三方读取
- 简化形态足够支撑 3 个内置 Skill，不过度设计

## 后果（Consequences）

### 正面
- 新 Skill 接入只需写 SKILL.md + frontmatter，满足 ≤ 1 人天目标
- 路由逻辑与 Skill 实现解耦，可独立演进
- 合同结构可渐进扩展，不需要一步到位

### 负面
- 精确匹配不支持模糊意图（如"帮我做个好看的东西"），需要 IntentClassifier 先收敛到具体产物类型
- YAML 表达能力有限，后续可能需要引入 JSON Schema 做合同校验

### 风险
- 合同字段设计不当可能导致破坏性变更
- 缓解：只用最小字段集，预留 `extensions` 字段供未来扩展

## 关联

- 关联需求：FR-A04, FR-F01, FR-F02, NFR-05, AC-06
- 关联 ADR：无
- 关联文档：`docs/product-requirements.md`
