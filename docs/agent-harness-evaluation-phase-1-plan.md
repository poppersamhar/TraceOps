# TraceOps Agent / Harness 评测体系第一阶段计划

## 1. 阶段目标

第一阶段先交付一条 KodaX-first 的“目标能力 H0/H1 对照评测”链路，服务工程师已经在进行的 Harness 优化。

产品只回答一个明确问题：

> 在 Model、Runtime 和验证集保持不变时，候选 Harness `H1` 是否比线上基线 `H0` 更好地解决了声明的问题？

本阶段不做 Harness 自动改写、不做大范围 OOD 泛化评测、不做模型后训练，也不做生产发布。工程师继续负责修改 Prompt、Context、Skill、Memory、Tool、Workflow、Verifier 等 Harness 组件；TraceOps 负责固化版本、关联真实 Session、执行或接收成对结果，并给出可复现、可审计的结论。

## 2. 产品流程

```text
KodaX Session / Raw Trace
  -> Evaluation Issue（发现了什么能力缺口）
  -> Harness H0 + Harness H1（工程师改了什么）
  -> Validation Benchmark Suite（用什么独立样本验证）
  -> Fixed Model / Runtime Experiment（控制变量）
  -> Baseline / Candidate Paired Rollouts（成对运行）
  -> Metric Delta + Case Churn（怎么变化）
  -> improved / inconclusive / regressed（是否真正变强）
```

## 3. 三阶段建设路线

### Phase 1：目标能力 H0/H1 对照评测

- Harness Snapshot 注册、版本与组件 Hash。
- 从真实 Trace 创建 Evaluation Issue。
- Validation Benchmark Case / Suite。
- 固定 Model、Runtime 的 H0/H1 Experiment。
- 接收 KodaX 或外部 Runner 的成对 Rollout。
- 目标指标、成本指标、Case Churn 和确定性 Verdict。

### Phase 2：泛化与回归评测

- ID、OOD 和跨业务场景 Suite。
- 历史任务回放与关键能力回归集。
- 安全、权限和高风险操作测试集。
- 多次 Rollout、方差、置信区间与预算感知评测。
- 跨业务、跨 Runtime、跨后端兼容矩阵。

### Phase 3：发布治理与训练数据回流

- Harness Release Gate、审批、Canary、Rollback 和 Deprecation。
- 新 Session 进入后的持续评测。
- 面向 Harness 工程师或外部 Evolution Provider 的反馈包。
- 将通过泛化验证的 Rollout 晋升为训练数据候选。
- 后训练后的 Model-only 评测，以及重新组合后的 Model × Harness 评测。

## 4. Phase 1 Feature 清单

### F1. Harness Snapshot Registry

注册不可变的基线和候选 Harness。Snapshot 不复制密钥或不受控源码，只记录来源、Commit 和组件 Hash，包括 Prompt、Context Policy、Skill、Memory Policy、Tool、Workflow、Verifier、Runtime Policy。

验收标准：

- 每个 Snapshot 有不可变 `contentHash`。
- 候选 Snapshot 可以引用父级基线。
- 可以查看组件级 Diff。
- 记录兼容模型、变更摘要、来源 Trace、作者和时间。

### F2. Evaluation Issue

从一个或多个真实 Trace 创建结构化工程问题，用来描述当前 Agent 的能力边界，而不是直接描述解决方案。

验收标准：

- 记录问题类别、影响范围、Owner、来源 Trace 和 Primary Metric。
- 生命周期为 `open -> evaluating -> validated / rejected`。
- Issue 可以关联所有验证该问题的 Harness Experiment。

### F3. Validation Benchmark Builder

从 Clean Trace 或人工任务规格创建脱敏、可版本化的验证 Case，并固化为 Suite。

验收标准：

- Case 明确区分 `update_evidence` 与 `validation`。
- 用来设计 H1 的已知问题样本不能混入 Validation Suite，防止数据泄漏。
- Frozen Suite 有不可变 Snapshot Hash，每个 Case 有声明好的 Grader。
- 默认只保存 Trace / Evidence Lineage，不复制高风险原文。

### F4. Harness A/B Experiment

创建一份控制变量实验，绑定固定 Model、Runtime、H0、H1、Suite、Evaluator Version、重复次数和预声明指标阈值。

验收标准：

- 两个 Arm 使用相同 Model、Runtime、Suite、Evaluator 和预算。
- Primary Metric 与 Guardrail 在完成实验前已经声明。
- 实验生命周期完整持久化并进入审计记录。
- Agent/Harness Experiment 与后训练后的 Model Eval 使用独立领域对象，避免混淆“Agent 变强”和“模型变强”。

### F5. Rollout Result Intake

第一阶段先支持导入 KodaX / 外部 Harness Runner 的结果，同时保留后续自动执行的 Adapter 边界。

验收标准：

- 每条 Rollout 绑定 Experiment Arm、Benchmark Case、重复序号和可选来源 Trace。
- 支持任务成功、产物验证、证据完整、Runtime Error、Token、Latency、Tool Call 等指标。
- 同一 Arm / Case / Repetition 的重复导入采用确定性替换。
- Experiment 只有收齐完整成对结果后才能完成。

### F6. Comparison & Verdict Engine

对 H0/H1 成对结果做聚合，输出指标差异、Case Churn、Guardrail 和确定性结论。

验收标准：

- 报告包含 `Pass->Pass`、`Fail->Pass`、`Pass->Fail`、`Fail->Fail`。
- Verdict 只有 `improved`、`inconclusive`、`regressed` 三种。
- `improved` 要求 Primary Threshold 达标、没有 Critical Regression、没有 Runtime 回归且成本在预算内。
- Critical Case 回归或任一 Guardrail 失败时判定 `regressed`。
- 报告包含解释原因、建议和不可变 `reportHash`。

### F7. Agent Evaluation Workbench

新增独立的 Agent 评测工作台，不与模型后训练评测混在一起。

验收标准：

- 可以查看 Harness Registry、Issue、Validation Case / Suite、Experiment 和 Report。
- 可以从现有 Trace 创建 Case。
- 可以创建 H0/H1 Experiment、启动、导入成对结果并完成评测。
- H0/H1 指标并排展示，Critical Regression、Case Churn 和 Verdict 足够突出。
- Demo Mode 可以直接展示一条完整的 `fail -> pass -> improved` 链路。

### F8. Persistence、Audit 与 Test

沿用现有 Local Store 和 Governance Audit 模式，但 Agent Eval 不复用后训练模型评测的 `DatasetEvalRunRecord`。

验收标准：

- 旧 Store 加载时自动补空新集合，不破坏已有数据。
- Harness、Issue、Suite、Experiment、Rollout、Report 重启后仍存在。
- 创建、启动、导入结果和完成实验都有审计记录。
- 覆盖完整 Happy Path、Validation 泄漏拦截、成本 Guardrail 和既有回归测试。
- `npm test`、`npm run build` 和真实浏览器页面验证通过。

## 5. 内置指标

第一阶段内置：

- `task_success`：任务是否成功，是默认 Primary Metric。
- `artifact_verified`：目标产物是否存在且通过验证。
- `evidence_complete`：关键动作是否有可追溯证据。
- `runtime_error`：Runtime / Tool Error 数量，默认 Guardrail。
- `token_usage`：Token 消耗，默认 Guardrail。
- `latency_ms`：延迟诊断指标。
- `tool_call_count`：工具调用次数诊断指标。

每个 Metric 都声明 Direction、Aggregation、Target Delta 或 Limit、Unit 和 Role。Issue 还可以增加 `test_execution_rate`、`false_completion_rate`、`repair_success_rate` 等自定义指标。

## 6. API Surface

```text
GET/POST  /api/harness-snapshots
GET       /api/harness-snapshots/:id
GET       /api/harness-snapshots/:id/diff

GET/POST  /api/agent-eval/issues
GET/PATCH /api/agent-eval/issues/:id

GET/POST  /api/agent-eval/benchmark-cases
POST      /api/agent-eval/benchmark-cases/from-trace/:traceId
GET/POST  /api/agent-eval/benchmark-suites
GET       /api/agent-eval/benchmark-suites/:id

GET/POST  /api/agent-eval/experiments
GET       /api/agent-eval/experiments/:id
POST      /api/agent-eval/experiments/:id/start
POST      /api/agent-eval/experiments/:id/rollouts
POST      /api/agent-eval/experiments/:id/complete
GET       /api/agent-eval/experiments/:id/report
GET       /api/agent-eval/reports
```

## 7. 开发顺序

1. 领域类型、Hash、Comparison Engine 和向后兼容的持久化。
2. Harness、Issue、Benchmark、Experiment、Rollout、Report Store 方法。
3. Worker API 与 Governance Audit。
4. Agent Evaluation Workbench 和 Demo Fixture。
5. Happy Path / Guardrail 测试、构建、真实浏览器验证和 README 更新。

## 8. Phase 1 Definition of Done

当用户可以从真实 KodaX Trace 创建问题与独立验证集，注册 H0/H1，在固定 Model / Runtime 下导入完整成对结果，并得到带指标差异、Case Churn、证据、解释与不可变 Hash 的 Verdict Report，第一阶段完成。

第一阶段输出的 `improved` 只表示“目标能力验证通过”，不会直接进入训练集或生产发布；它是进入 Phase 2 泛化与回归评测的候选。
