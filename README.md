# TraceOps

TraceOps v0.1.1 是一个本地运行的 **Space Session 评测数据采集器**。

它读取电脑上的 KodaX Space Session，自动完成筛选、脱敏、Trace 还原、Evaluation Case 构建和质量检查，最后生成一个 `.json.gz` 数据包。数据只在本机处理，不会自动上传，也不会修改 Space 的原始文件。

## 下载

1. 打开 [TraceOps v0.1.1 Release](https://github.com/BizAgentOS/TraceOps/releases/tag/v0.1.1)。
2. 在 **Assets** 中下载 `Source code (zip)`。
3. 解压到本地。
4. 安装 [Node.js 20+](https://nodejs.org/)（已经安装可以跳过）。

也可以使用 Git：

```bash
git clone https://github.com/BizAgentOS/TraceOps.git
cd TraceOps
```

## 启动

在解压后的 TraceOps 目录中运行：

```bash
npm install
npm run collector
```

看到启动成功提示后，打开：

```text
http://localhost:4177/
```

## 收集数据

1. 页面会自动检测本机的 Space Session。
2. 点击 **收集并生成评测数据**。
3. 等待页面显示 **评测数据包已准备好**。
4. 点击 **下载评测数据包**。
5. 将下载的 `.json.gz` 文件原样发送给 TraceOps 负责人。

无需解压或修改数据包。需要包含最新 Session 时，点击 **重新收集最新数据** 即可。

## 会收集什么

默认读取：

```text
~/.kodax/sessions
```

系统会自动：

- 保留用户主 Session，排除临时 Session 和内部 worker Session。
- 保留完整 Trace、工具调用、工具结果、Evidence 和对话分支关系。
- 移除 Thinking，并脱敏密钥、Token、邮箱、本地路径和原始 Session ID。
- 区分“配置名或占位符提及”与“高置信真实凭据”：前者保留脱敏 Trace 并进入人工复核，只有后者会阻断详细 Payload。
- 生成 Evaluation Case、成功判据、Grader、Replay 要求和质量门禁结果。
- 输出 `eval_ready`、`needs_review`、`privacy_blocked`、`incomplete` 四种状态。
- 生成供 v0.2.0 使用的 `caseIndex` 和 `qualityReport`。

真实 Session 默认只作为 `update_evidence`，不会自动进入 Benchmark。正式验证集仍需在 v0.2.0 中完成 Review、去重和独立 Holdout 冻结。

## 隐私说明

- 数据处理只在本机完成。
- 不会自动上传到 GitHub 或第三方服务。
- 不会修改 Space 原始 Session。
- 自动脱敏不能替代企业数据审核；发送前请确认接收人和传输渠道符合团队规范。

## 开发与测试

```bash
npm run dev:v0.1
npm test
npm run build:v0.1
```

v0.1.1 是 v0.1 采集器产品线的当前版本；v0.1.0 Tag 继续保留供回滚。v0.2.0 将建设 Agent/Harness 评测，v0.3.0 将建设模型后训练。

详细说明见 [v0.1.x 使用手册](docs/v0.1.0-space-session-collector.md) 和 [产品路线](docs/product-release-roadmap.md)。

## License

[MIT](LICENSE)
