# TraceOps Product Brief

> 用途：作为 TraceOps 产品建设的起点文档。后续页面设计、数据模型、接口、原型和工程实现都应以这里的定位为基准。

## 1. 产品定位

TraceOps 的全称可以定义为：

> 企业智能体运行经验沉淀与自蒸馏系统。

TraceOps 不只是保存聊天内容、系统日志或监控指标。它要记录的是：

> Agent 与 Harness 在真实企业任务中的完整协作过程。

它回答的问题包括：

- 用户原始目标是什么？
- Agent 当时加载了什么角色、Skill、工具、权限和上下文？
- ProjectAgent 如何拆解任务？
- PAT 如何分发任务和转运结果？
- Space 如何在端侧执行？
- KodaX CLI / Kernel 调用了哪些工具、命令、文件和接口？
- 失败、重试、审批、纠偏和放弃发生在什么环节？
- 最终成果是否被负责人接受？
- 这条链路能否进入企业记忆、评测集或训练集？

## 2. 与产品矩阵的关系

TraceOps 是横跨 KodaX CLI、KodaX Space 和 AgentOS 的底层数据资产能力，不是第四个并列任务入口。

| 层级 | 产品 | TraceOps 关系 |
|---|---|---|
| 能力执行层 | KodaX CLI | 记录代码理解、命令执行、工具调用、测试反馈、错误修复和软件流程执行轨迹 |
| 员工端侧层 | KodaX Space | 记录本地任务、端侧授权、文件/浏览器/IDE/账号使用、Skill 调用、Connector 连接和结果回传 |
| 企业管理层 | AgentOS | 记录项目目标、任务拆解、成员分工、审批、企业记忆候选、训练授权和组织级治理 |
| 数据取用治理 | AgentMemBase | 决定任务执行前和执行中该取用哪些企业数据、以什么形态取用 |
| 经验资产沉淀 | TraceOps | 记录执行后和复盘时的完整过程，并转化为记忆、评测、训练和反哺资产 |

一句话边界：

> AgentMemBase 管“取用前和取用时的合理性”，TraceOps 管“执行后和复盘时的经验资产化”。

## 3. 核心对象

TraceOps 至少需要管理以下对象：

- Trace：一次完整任务链路。
- Session：一次对话、审批、确认或协作会话。
- Event：任务过程中的一个可追踪事件。
- Context Snapshot：任务发生时的项目、权限、记忆、Skill、工具、策略版本快照。
- Artifact：任务产生的文档、代码、报告、截图、数据、证据或结果文件。
- Evaluation：负责人接受、驳回、质量评分、风险等级和训练价值判断。
- Dataset Candidate：可进入企业记忆、评测集或训练池的候选样本。

## 4. 事件分类

建议首批事件类型：

| 类型 | 说明 | 典型来源 |
|---|---|---|
| `intent.received` | 用户提出原始目标或业务问题 | ProjectAgent / OrgAgent / PAT |
| `context.loaded` | 加载项目、文档、记忆、代码仓库、连接器数据 | AgentOS / Space / AgentMemBase |
| `plan.created` | 生成任务计划、节点和成员分工 | ProjectAgent |
| `task.dispatched` | 将任务分发给成员 PAT 或 Space | ProjectAgent / PAT |
| `permission.requested` | 请求数据、文件、账号、Connector 或训练授权 | PAT / OrgAgent |
| `tool.called` | 调用工具、Skill、Connector、命令或 API | KodaX / Space |
| `error.observed` | 执行失败、测试失败、权限失败或接口失败 | KodaX / Space |
| `repair.succeeded` | 失败后通过重试、改计划或换工具完成任务 | KodaX / ProjectAgent |
| `result.submitted` | Space / PAT 回传结果、摘要和证据 | Space / PAT |
| `result.accepted` | 负责人或成员确认结果有效 | ProjectAgent / 用户 |
| `memory.promoted` | 项目经验被提炼为企业记忆候选 | ProjectAgent / OrgAgent |
| `dataset.candidate_created` | Trace 被标记为训练、评测或偏好样本候选 | TraceOps |

## 5. 数据生命周期

TraceOps 数据建议分为三层：

### Raw Trace

原始 Trace，用于审计、回放、排障和完整链路保留。

特点：

- 信息最完整。
- 敏感度最高。
- 权限最严格。
- 不直接用于训练。

### Clean Trace

清洗 Trace，用于分析、复盘、质量评分、项目经验提炼和失败链路总结。

特点：

- 已去噪。
- 已做基础脱敏。
- 可用于内部分析。
- 仍需权限控制。

### Train Trace

训练 Trace，用于 SFT、Tool-use、Planning、Preference、Repair 和 Evaluation 数据集。

特点：

- 已授权。
- 已脱敏。
- 有明确输入输出。
- 有质量标签。
- 可追溯来源。

## 6. 产品形态

TraceOps 不一定第一天作为独立一级导航出现。更合理的形态是先作为 AgentOS 底层能力，然后在关键页面中露出。

### 项目页

- Trace 时间线。
- ProjectAgent 拆解过程。
- PAT 分发过程。
- Space 执行过程。
- KodaX 工具调用过程。
- 成果回传过程。
- 人工审批和纠偏过程。
- 项目记忆候选。
- 成果证据链。

### OrgAgent 管理视角

- Trace 总览。
- 高价值 Trace 候选。
- 可训练样本候选。
- 敏感 Trace 审核。
- 失败链路分析。
- Skill 调用效果。
- Connector 调用效果。
- 成员执行链路统计。
- 数据集导出中心。
- 自蒸馏进度。

### 企业记忆库

TraceOps 与企业记忆库的关系：

```text
TraceOps 保留过程
  -> Trace Distiller / Data Agent 提炼候选经验
  -> ProjectAgent / 负责人确认
  -> OrgAgent 审批治理
  -> 企业记忆库发布
```

企业记忆库沉淀“结论”，TraceOps 沉淀“结论形成过程”。

## 7. MVP 建议

第一版不要做成庞大的训练平台，应先做记录、回放和候选池。

P0：

- 统一 `trace_id`。
- 基础事件协议。
- 项目任务 Trace 时间线。
- ProjectAgent -> PAT -> Space -> PAT -> ProjectAgent 链路回放。
- 每条 Trace 的训练授权状态。

P1：

- 高价值 Trace 候选池。
- 基础脱敏。
- 质量评分。
- JSONL 导出。
- 企业记忆候选提炼。

P2：

- Tool-use / Planning / Preference / Repair / Evaluation 数据集生成。
- Trace 对 Skill、Connector、Agent 配置、路由策略的反哺分析。
- 自蒸馏面板。

## 8. 治理原则

- 默认最小采集。
- 端侧敏感数据默认不出端。
- 原始 Trace 不直接进入训练。
- 训练数据必须经过脱敏、授权和审批。
- Trace 要保留来源、版本、用途和导出记录。
- 所有导出都应可追溯、可撤回、可审计。

建议风险等级：

| 级别 | 含义 | 使用范围 |
|---|---|---|
| L0 公开样本 | 无敏感信息 | 可公开展示或通用训练 |
| L1 企业内部 | 企业内部信息 | 仅企业租户内使用，可进入企业私有训练 |
| L2 项目受限 | 项目上下文、客户或业务细节 | 只允许项目内回放和分析 |
| L3 端侧敏感 | 本地文件、账号、源码、隐私 | 只允许摘要、指标或哈希出端 |
| L4 禁止训练 | 高敏感或合规限制数据 | 仅审计，不进入记忆、评测或训练 |

## 9. 当前建设原则

- TraceOps 是产品，不只是后台日志能力。
- TraceOps 的第一价值是“可回放和可复盘”。
- TraceOps 的长期价值是“真实任务经验资产 + 自蒸馏飞轮”。
- TraceOps 与 AgentMemBase 不冲突：一个管数据取用治理，一个管任务过程沉淀。
- TraceOps 的页面表达要让管理者、项目负责人和数据负责人看懂，而不是只给工程师看。

