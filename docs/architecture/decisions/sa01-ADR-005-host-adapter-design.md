# ADR-005: 宿主适配层设计

**日期**：2026-04-19
**状态**：accepted
**决策者**：OpenClaw（sa-01 子Agent）

## 上下文（Context）

Claw Design 定位为独立 skill pack，可被 OpenClaw、Claude Code、CLI 及其他 Agent 平台调用（AC-07）。不同宿主的输入格式、会话管理、文件交付方式各不相同。核心逻辑需要与宿主环境解耦，同时优先支持 OpenClaw。

## 备选方案（Options Considered）

### 方案 A：Host Adapter 模式（适配器层）

- 描述：定义标准 DesignRequest/DeliveryBundle 接口，每个宿主实现一个 Adapter 做输入标准化和输出适配
- 优点：核心管线零宿主依赖，新宿主只需写 Adapter，不改核心代码
- 缺点：Adapter 层增加一层间接调用，需要定义清晰的接口契约
- 成本/复杂度：中等，但长期收益高

### 方案 B：宿主 SDK 集成

- 描述：核心代码直接引用宿主 SDK（如 OpenClaw API），通过条件编译或运行时检测适配不同环境
- 优点：集成深度高，能利用宿主特有能力
- 缺点：核心代码与宿主耦合，换宿主需要改核心逻辑，违反 AC-07
- 成本/复杂度：初始低，每增加一个宿主成本线性增长

### 方案 C：纯 CLI 接口

- 描述：Claw Design 只暴露 CLI 入口，宿主通过 shell 调用
- 优点：最大程度解耦，任何能执行 shell 的环境都能调用
- 缺点：无法利用宿主的会话上下文、澄清交互和流式反馈能力
- 成本/复杂度：低，但用户体验受限

## 决策（Decision）

选择方案 A：Host Adapter 模式。

接口定义：
- `adapt(rawInput) → DesignRequest`：将宿主原始输入标准化
- `clarify(gaps) → ClarificationRequest`：将缺口澄清请求转为宿主可处理的格式
- `deliver(bundle) → DeliveryResult`：将交付包通过宿主渠道送达用户

实现 OpenClawAdapter，同时提供 CLIAdapter 作为通用回退。后续宿主按需增加 Adapter。

## 后果（Consequences）

### 正面
- 核心管线（Intent Router → Design Skills → Quality Gate → Export）零宿主依赖
- 新宿主接入只需实现三个方法，满足可移植性目标（NFR-06）
- CLIAdapter 保证任何环境都能使用基础功能

### 负面
- Adapter 接口设计需要预判多种宿主的共性需求，设计不当可能导致频繁变更
- 澄清交互（FR-A02）的体验受限于 Adapter 能力

### 风险
- DesignRequest 接口过于简化，无法承载某些宿主的丰富上下文
- 缓解：DesignRequest 包含 `metadata: Record<string, unknown>` 扩展字段，Adapter 可透传宿主特有信息

## 关联

- 关联需求：AC-07, NFR-06, FR-A02
- 关联 ADR：无
- 关联文档：`docs/product-requirements.md`
