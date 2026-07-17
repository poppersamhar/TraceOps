# Changelog

## v0.1.0

- 只读接入本机 KodaX Space Session。
- 排除临时 Session 和内部 worker Session。
- 完成结构化脱敏、Thinking 移除和稳定匿名化。
- 生成完整 Evaluation Trace、Evaluation Case、Grader 和 Replay 要求。
- 提供 `eval_ready`、`needs_review`、`privacy_blocked`、`incomplete` 四级质量门禁。
- 生成 `caseIndex`、`qualityReport` 和全内容校验值，供 v0.2.0 导入。
- 支持一键生成、下载和重新收集评测数据包。
- 不自动上传数据，不修改 Space 原始文件。
