# ADR-006: LLM 意图路由作为 IntentRouter 主路径

OpenClaw（sa-01 子Agent）| 2026-04-21

**状态**：proposed
**决策者**：OpenClaw（sa-01 子Agent）

## 上下文（Context）

IntentRouter 当前用关键词匹配（`input.includes(kw)`）做意图识别。这与 spec FR-A01"自然语言意图识别"的要求严重偏离。

关键矛盾：
- 商用场景下，外部用户不知道关键词表，自然语言输入命中率极低
- spec 要求路由准确率 ≥ 90%，关键词匹配无法达到
- "意图路由""意图理解"特指 LLM 语义泛化的意图理解，关键词匹配不属于此范畴

ADR-002 已决策 Skill 通过 YAML frontmatter 声明合同 + 目录扫描自动发现。本 ADR 解决的是"如何理解用户意图"这一前置问题——Skill 发现之后，Router 如何从自然语言中判断用户想要什么产物类型。

## 备选方案（Options Considered）

### 方案 A：LLM 推理主路径 + 关键词 fallback

- 描述：IntentRouter 主路径调用 LLM 做语义意图分类，将用户输入和所有已注册 Skill 的描述发给 LLM，LLM 返回最匹配的产物类型和置信度。关键词匹配仅在无 LLM 环境时作为降级 fallback，代码中显式标注为 fallback。
- 优点：语义泛化能力强，用户用任何自然语言都能路由到正确 Skill；新 Skill 只需写好 description 就能被 LLM 理解和路由
- 缺点：依赖 LLM 调用，增加延迟和成本
- 成本/复杂度：中，需要定义 provider 注入接口

### 方案 B：嵌入向量相似度匹配

- 描述：将 Skill 描述和用户输入分别编码为向量，用余弦相似度匹配
- 优点：不需要 LLM 推理调用，延迟低
- 缺点：需要嵌入模型，语义理解深度不如 LLM 推理，复杂意图（多产物、模糊表达）处理能力弱
- 成本/复杂度：中，需要嵌入模型和向量计算

### 方案 C：增强关键词匹配（同义词扩展 + 权重调优）

- 描述：在现有关键词匹配基础上增加同义词表、权重配置和模糊匹配
- 优点：无外部依赖，延迟最低
- 缺点：无法处理语义泛化（"帮我做个好看的东西展示给投资人"），维护成本随 Skill 增加线性增长，不符合"意图理解"的术语定义
- 成本/复杂度：低初始，高长期

## 决策（Decision）

选择方案 A：LLM 推理主路径 + 关键词 fallback。

LLM 通过 `IntentClassifierProvider` 接口注入，Claw Design 作为 npm 包不绑定具体 LLM 实现。LLM 只做产物类型分类（"用户想要什么"），不做 Skill 选择（"用哪个 Skill 生成"）。Skill 选择由 SkillRouter 基于合同字段完成，逻辑可测试、可确定。

关键词匹配封装为 `KeywordFallbackClassifier`，仅在以下场景使用：
1. 宿主未注入 LLM provider
2. LLM 调用失败（超时、异常）

Fallback 模式下，IntentPacket 携带 `degraded: true` 标记，调用方明确知道当前处于降级模式。

理由：
- "意图理解"特指 LLM 语义泛化，关键词匹配不满足术语定义
- LLM 推理是达到 ≥ 90% 路由准确率的唯一可行路径
- provider 注入模式保持 npm 包的环境无关性
- 新 Skill 写好 description + applicableScenes 就能被 LLM 路由，满足 FR-A04 AC3

## 后果（Consequences）

### 正面
- 路由准确率大幅提升，用户用自然语言就能触发正确链路
- 新 Skill 接入零代码改动（写好描述即可被 LLM 理解）
- 降级模式保证无 LLM 环境仍可工作

### 负面
- 主路径增加一次 LLM 调用的延迟和成本
- `route()` 从同步变为异步，所有调用方需要迁移

### 风险
- LLM 分类结果不稳定（同一输入不同次调用结果不同）
  - 缓解：prompt 工程 + 温度设为 0 + 结构化输出约束
- LLM provider 不可用导致服务降级
  - 缓解：fallback 机制 + degraded 标记 + 监控告警

## 关联

- 关联需求：FR-A01, FR-A04, FR-A07
- 关联 ADR：ADR-002（Skill Contract 与路由机制）
- 关联文档：`docs/architecture/intent-router-rewrite.md`
