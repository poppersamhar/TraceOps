# Changelog

## v0.1.2 — 2026-07-21

- 将产品从 Evaluation-ready Collector 调整为 Workflow-first Collector。
- 保留所有可解析的用户、临时、空和 managed Worker Session。
- 导出完整 Transcript、有效与历史分支、Skill、工具、Evidence、错误和 Worker 拓扑。
- 对敏感值执行字段级 `***` 遮罩或安全占位，不再因隐私信号丢弃整个 Session。
- 新增 `workflowReport`、`sessionIndex` 和完整 `sessions` 包结构。
- 新增本机 Session 浏览器，可按条查看完整脱敏 Workflow 流程；消息、工具调用与结果、错误和 Evidence 合并为统一时间线，原始数据视图默认折叠。
- 将 Case、Grader、去重、质量审核和 Benchmark/Validation 决策延后到 v0.2.0。

## v0.1.0

- 只读接入本机 KodaX Space Session。
- 排除临时 Session 和内部 worker Session。
- 完成结构化脱敏、Thinking 移除和稳定匿名化。
- 生成完整 Evaluation Trace、Evaluation Case、Grader 和 Replay 要求。
- 提供 `eval_ready`、`needs_review`、`privacy_blocked`、`incomplete` 四级质量门禁。
- 生成 `caseIndex`、`qualityReport` 和全内容校验值，供 v0.2.0 导入。
- 支持一键生成、下载和重新收集评测数据包。
- 不自动上传数据，不修改 Space 原始文件。
