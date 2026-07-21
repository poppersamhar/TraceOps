# TraceOps

TraceOps v0.1.2 是一个本地运行的 **Space Workflow Session 采集器**。

它读取电脑上的 KodaX Space Session，完整保留对话、任务拆解、Skill、工具调用与结果、错误、历史分支和 Worker 拓扑，并在原位置遮罩敏感值，最后生成一个 `.json.gz` 数据包。数据只在本机处理，不会自动上传，也不会修改 Space 的原始文件。

## 下载

1. 打开 [TraceOps v0.1.2 Release](https://github.com/BizAgentOS/TraceOps/releases/tag/v0.1.2)。
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
2. 点击 **收集完整 Workflow**。
3. 等待页面显示 **Workflow 数据包已准备好**。
4. 点击 **下载 Workflow 数据包**。
5. 将下载的 `.json.gz` 文件原样发送给 TraceOps 负责人。

无需解压或修改数据包。需要包含最新 Session 时，点击 **重新收集最新数据** 即可。

## 会收集什么

默认读取：

```text
~/.kodax/sessions
```

系统会自动：

- 保留所有可解析的用户、临时、空和 managed Worker Session。
- 保留完整 Transcript、有效与历史分支、Skill、计划信号、工具输入/结果、Evidence、错误和运行元信息。
- 对 API Key、Token、密码、邮箱和本地路径等敏感值执行字段级 `***` 遮罩或安全占位。
- 私密 reasoning 只省略原文并保留位置标记；隐私信号不会导致整个 Session 被丢弃。
- 生成 `sessionIndex`、`workflowReport` 和完整脱敏 `sessions`。
- 将 Evaluation Case、Grader、去重、Holdout 和 Benchmark 准入延后到后续评测阶段。

页面下方提供本机 Session 浏览器。点击任意 Session，即可在统一 Workflow 时间线中查看消息、工具调用与结果、错误、分支和 Evidence；完整 Transcript 与 Event 数据保留在默认折叠的原始数据视图中。

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

v0.1.2 是 v0.1 采集器产品线的当前版本；v0.1.0 和 v0.1.1 Tag 继续保留供回滚。

详细说明见 [v0.1.x 使用手册](docs/v0.1.0-space-session-collector.md) 和 [产品路线](docs/product-release-roadmap.md)。

## License

[MIT](LICENSE)
