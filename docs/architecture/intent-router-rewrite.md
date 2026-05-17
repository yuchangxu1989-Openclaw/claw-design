# IntentRouter 架构重写方案

OpenClaw（sa-01 子Agent）| 2026-04-21

## 1. 问题诊断

当前 `IntentRouter.route()` 用 `input.includes(kw)` 做关键词匹配，`CompositeRouter` 加了模糊匹配但本质相同。三个核心偏离：

| 偏离点 | spec/ADR 要求 | 当前实现 |
|--------|--------------|----------|
| 意图理解 | FR-A01：自然语言意图识别 | `input.includes(kw)` 关键词匹配 |
| Skill 注册 | ADR-002：目录扫描自动发现 | `createPipeline()` 手动 `new` 12 个 Skill + `registerAll` |
| 路由扩展性 | FR-A04 AC3：新 Skill 声明即路由 | 新 Skill 必须改 `createPipeline()` 源码 |

商用后果：外部用户不知道关键词表，自然语言输入命中率极低，路由准确率远达不到 spec 要求的 ≥ 90%。

## 2. 目标架构

### 2.1 核心思路

IntentRouter 的主路径是 LLM 语义推理链路。关键词匹配仅作为无 LLM 环境的降级 fallback，在代码和文档中显式标注为 fallback。

主路径（LLM）：
```
用户输入
  → LLM IntentClassifier（语义推理，输出产物类型 + 置信度 + 推理过程）
  → SkillRouter（读 Skill Contract，按产物类型 + 上下文匹配度选 Skill）
  → IntentPacket
```

Fallback 路径（仅无 LLM 时）：
```
用户输入
  → KeywordFallbackClassifier（关键词 + 模糊匹配，显式标注为降级模式）
  → SkillRouter
  → IntentPacket（附带 degraded: true 标记）
```

术语纪律："意图路由""意图理解"特指 LLM 语义泛化的意图理解。关键词匹配、正则、规则引擎不属于"意图理解"，只能作为 fallback。

### 2.2 LLM Provider 注入机制

Claw Design 是 npm 包，不绑定具体 LLM。宿主通过 `IntentClassifierProvider` 接口注入 LLM 能力：

```typescript
/** 宿主注入的 LLM 意图分类能力 */
interface IntentClassifierProvider {
  classify(input: string, skillDescriptions: SkillDescription[]): Promise<ClassificationResult>;
}

interface SkillDescription {
  name: string;
  artifactType: ArtifactType;
  description: string;
  applicableScenes: string[];
}

interface ClassificationResult {
  primaryType: ArtifactType;
  secondaryTypes: ArtifactType[];
  confidence: number;
  reasoning?: string;
}
```

Router 构造时接收 provider：

```typescript
// 正常使用：宿主注入 LLM provider（主路径）
const router = new IntentRouter({
  classifierProvider: myLlmClassifier,
});

// 降级模式：无 LLM 环境，显式使用 fallback
const router = new IntentRouter({
  classifierProvider: new KeywordFallbackClassifier(),  // 显式标注为 fallback
});
```

不传 `classifierProvider` 时，Router 自动使用 `KeywordFallbackClassifier` 并在 IntentPacket 中标记 `degraded: true`，让调用方知道当前处于降级模式。

OpenClaw 宿主集成时，`OpenClawAdapter` 从宿主环境获取 LLM provider 并注入（主路径）。独立 CLI 模式若无 LLM 配置，走 fallback 并在输出中提示用户配置 LLM 以获得更好的路由准确率。

### 2.3 LLM 路由流程

IntentRouter 收到 DesignRequest 后：

1. 从 SkillRegistry 收集所有已注册 Skill 的 `SkillDescription`（name + description + applicableScenes）
2. 将用户输入 + Skill 描述列表发给 `IntentClassifierProvider.classify()`
3. LLM 返回最匹配的产物类型和置信度
4. SkillRouter 在该产物类型的 Skill 中按合同条件（inputRange、requiredContext）做精确匹配

LLM 只做"用户想要什么类型的产物"这一个判断，不做 Skill 选择。Skill 选择由 SkillRouter 基于合同字段完成。这样 LLM 调用成本最低（一次调用，输入 token 少），且 Skill 选择逻辑可测试、可确定。

### 2.4 降级策略（Fallback）

```
有 LLM provider？
  ├─ 是（主路径）→ LLM classify → 置信度 ≥ 阈值？
  │         ├─ 是 → 使用 LLM 结果
  │         └─ 否 → LLM 结果 + 关键词辅助，仍以 LLM 推理为主
  └─ 否（降级 fallback）→ KeywordFallbackClassifier
      → IntentPacket.degraded = true
      → 输出提示："当前处于降级模式，建议配置 LLM 以提升路由准确率"
```

`KeywordFallbackClassifier` 实现 `IntentClassifierProvider` 接口，内部复用 `CompositeRouter` 的关键词/模糊匹配逻辑。类名和文档中显式标注 "Fallback"，避免被误认为主路径实现。

LLM 调用失败（超时、异常）时，同样降级到 `KeywordFallbackClassifier`，并在 IntentPacket 中记录降级原因。

## 3. Skill 自动发现机制

### 3.1 当前问题

`createPipeline()` 手动 `new` 每个 Skill 并 `registerAll`。虽然 `SkillRegistry.discoverAndRegister()` 存在，但只扫描 `execution/skills/` 子目录，且 `createPipeline()` 在调用它之前已经手动注册了所有内置 Skill。

### 3.2 目标：声明即发现

遵循 ADR-002 决策，Skill 通过 contract 声明能力，运行时自动发现和注册：

**内置 Skill**：每个 Skill 类在构造函数中通过 `BaseSkillConfig` 声明完整 contract（已实现）。`SkillRegistry` 启动时扫描 `src/skills/` 和 `src/execution/` 目录，自动实例化并注册。

**外部 Skill（npm 包场景）**：用户安装的 Skill 包在 `package.json` 中声明 `"claw-design-skill"` 入口，`SkillRegistry` 扫描 `node_modules` 中带该标记的包并加载。

**OpenClaw 宿主场景**：宿主的 SKILL.md frontmatter 中声明 `claw-design` 相关字段，`OpenClawAdapter` 读取后转换为 `DesignSkill` 注册到 Registry。

### 3.3 自动发现流程

```typescript
// createPipeline() 重写后
async function createPipeline(options?: PipelineOptions) {
  const registry = new SkillRegistry();

  // 1. 自动发现内置 Skill（扫描 skills/ 目录）
  await registry.discoverBuiltIn();

  // 2. 自动发现外部 Skill（扫描 node_modules）
  await registry.discoverExternal();

  // 3. 宿主注入的额外 Skill
  if (options?.additionalSkills) {
    registry.registerAll(options.additionalSkills);
  }

  // 4. 构造 Router，注入 LLM provider
  const router = new IntentRouter({
    classifierProvider: options?.classifierProvider,
    skills: registry.list(),
  });

  // ... 后续管线不变
}
```

`createPipeline()` 不再手动 `new` 任何 Skill。所有 Skill 通过发现机制注册。

### 3.4 外部 Skill 的 package.json 约定

```json
{
  "name": "claw-design-skill-timeline",
  "claw-design": {
    "skill": "./dist/timeline-skill.js"
  }
}
```

`SkillRegistry.discoverExternal()` 扫描 `node_modules/claw-design-skill-*` 和带 `claw-design.skill` 字段的包，动态 import 并注册。

### 3.5 OpenClaw SKILL.md 集成

OpenClaw 生态中，Skill 以 SKILL.md + frontmatter 形式存在。`OpenClawAdapter` 负责桥接：

```yaml
# SKILL.md frontmatter
---
name: timeline-chart
description: 生成时间线图表
claw_design:
  artifact_type: chart
  applicable_scenes: ["时间线", "里程碑", "项目进度"]
  input_types: ["text", "structured-data"]
  required_context: []
---
```

`OpenClawAdapter` 读取 frontmatter，构造 `SkillContract`，包装为 `DesignSkill` 代理（调用 OpenClaw 的 skill 执行机制），注册到 `SkillRegistry`。

## 4. 模块拆分

当前 `IntentRouter` 是一个大类。重写后拆为 arc42 §5.2.1 定义的模块：

| 模块 | 职责 | 文件 |
|------|------|------|
| `IntentClassifier` | 从输入识别产物类型（LLM 或关键词） | `routing/intent-classifier.ts` |
| `SkillRouter` | 读 Skill Contract，按产物类型 + 合同条件选 Skill | `routing/skill-router.ts` |
| `GapDetector` | 识别需求缺口 | `routing/gap-detector.ts`（已有逻辑提取） |
| `ContextCollector` | 收束上下文 | `routing/context-collector.ts` |
| `IntentRouter` | 编排以上模块的门面 | `routing/intent-router.ts`（重写） |

`IntentRouter` 变为编排器，不再包含匹配逻辑：

```typescript
class IntentRouter {
  constructor(options: {
    classifierProvider?: IntentClassifierProvider;
    skills: DesignSkill[];
  });

  route(request: DesignRequest): Promise<IntentPacket>;
}
```

注意 `route()` 变为 `async`（LLM 调用是异步的）。

## 5. 与 CompositeRouter 的关系（Fallback 内部实现）

`CompositeRouter`、`ExactMatchStrategy`、`FuzzyMatchStrategy` 保留，但严格限定为 fallback 内部实现。它们被封装在 `KeywordFallbackClassifier` 内部，不直接暴露给 IntentRouter 的主路径：

```typescript
/**
 * Fallback only — 仅在无 LLM 环境时使用。
 * 不属于"意图理解"，是基于关键词的降级匹配。
 */
class KeywordFallbackClassifier implements IntentClassifierProvider {
  private compositeRouter: CompositeRouter;

  async classify(input, skillDescriptions): Promise<ClassificationResult> {
    // 复用 CompositeRouter 的关键词/模糊匹配逻辑
    // 返回结果中 degraded = true
  }
}
```

公共 API 导出 `KeywordFallbackClassifier` 供无 LLM 环境显式使用，但命名和 JSDoc 明确标注其 fallback 性质。

## 6. 迁移策略

### Phase 1：接口抽象 + LLM 主路径（核心，必须先做）
- 提取 `IntentClassifierProvider` 接口
- 实现 `LlmClassifier`（调用注入的 LLM provider）—— 这是主路径
- 将当前关键词匹配包装为 `KeywordFallbackClassifier`，显式标注 fallback
- `IntentRouter` 构造函数接受 `classifierProvider`，不传时使用 fallback 并标记 `degraded: true`
- `OpenClawAdapter` 注入宿主 LLM 作为 classifierProvider
- `route()` 变为 async
- 现有测试迁移为 async，关键词匹配测试标注为 fallback 场景

### Phase 2：自动发现（消除手动注册）
- `SkillRegistry.discoverBuiltIn()` 替代手动 `new`
- `createPipeline()` 不再 import 具体 Skill 类
- 新增 `discoverExternal()` 扫描 node_modules

### Phase 3：SKILL.md 桥接
- `OpenClawAdapter` 读取 SKILL.md frontmatter
- 外部 Skill 自动注册到 Claw Design 路由体系

## 7. 关键设计决策

| 决策 | 理由 |
|------|------|
| LLM 只做产物类型分类，不做 Skill 选择 | 降低 LLM 调用成本，Skill 选择逻辑可测试可确定 |
| LLM 是主路径，`IntentClassifierProvider` 接口解耦具体实现 | npm 包不绑定具体 LLM，但主路径必须是 LLM 推理 |
| 关键词匹配严格限定为 fallback，代码中显式标注 | 无 LLM 时仍可工作，但调用方明确知道处于降级模式 |
| `route()` 变为 async | LLM 调用是异步的，这是必要的接口变更 |
| 外部 Skill 通过 package.json 约定发现 | npm 生态惯例，零配置接入 |
| OpenClaw Skill 通过 frontmatter 桥接 | 复用 OpenClaw 已有 skill 生态，零学习成本 |

## 8. 风险与缓解

| 风险 | 缓解 |
|------|------|
| `route()` 从同步变异步，破坏现有调用方 | Phase 1 先做接口抽象，逐步迁移调用方 |
| LLM 延迟影响路由速度 | LLM 调用是主路径，通过 prompt 优化和缓存降低延迟；LLM 失败时降级到 fallback |
| 外部 Skill 质量不可控 | contract 校验 + 质量门禁兜底 |
| node_modules 扫描性能 | 只扫描 `claw-design-skill-*` 前缀或有 `claw-design` 字段的包 |
