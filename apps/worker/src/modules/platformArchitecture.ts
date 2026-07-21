import { Router } from 'express';

import type {
  TraceOpsCapabilityModule,
  TraceOpsCapabilityStatus,
  TraceOpsPlatformArchitecture,
  TraceOpsProductArea,
  TraceOpsProductAreaId,
  TraceOpsProductRelease,
  TraceOpsProductVersion,
} from '../../../../packages/trace-core/src/types';
import type { TraceOpsStore } from '../store';

function areaStatus(modules: TraceOpsCapabilityModule[]): TraceOpsCapabilityStatus {
  if (modules.some((module) => module.status === 'blocked')) return 'blocked';
  if (modules.some((module) => module.status === 'attention')) return 'attention';
  if (modules.some((module) => module.status === 'ready')) return 'ready';
  return 'idle';
}

function productArea(input: Omit<TraceOpsProductArea, 'status'>): TraceOpsProductArea {
  return { ...input, status: areaStatus(input.modules) };
}

export const TRACEOPS_CURRENT_VERSION: TraceOpsProductVersion = '0.1.0';

export const TRACEOPS_PRODUCT_RELEASES: TraceOpsProductRelease[] = [
  {
    version: '0.1.0',
    status: 'current',
    title: 'Space Workflow Collector',
    productAreaIds: ['data_access'],
    scope: '为数据提供同事建设独立的 Space Session 完整采集、字段级隐私遮罩、Workflow 还原、打包和下载工具。',
    deliverable: 'Sanitized Full-fidelity Space Workflow Package',
    acceptanceCriteria: [
      '同事可以通过一个主按钮完成 Space Session 收集和整理。',
      '采集器只读本机数据，不自动上传，也不修改 Space 源文件。',
      '私密 reasoning、原始路径、原始 Session ID 和已识别敏感值不会进入数据包，同时保留完整 Workflow 结构。',
      '隐私信号不会导致整个 Session 被丢弃，评测建模和 Benchmark 准入延后到 v0.2.0。',
      'v0.1.0 有独立入口、启动命令和构建产物，后续版本不得覆盖。',
    ],
    excludedCapabilities: ['多数据源治理工作台', 'Dataset Version / Diff / Review', 'Harness H0/H1 正式评测', '模型评测', '模型后训练', '模型发布与线上反馈'],
  },
  {
    version: '0.2.0',
    status: 'next',
    title: 'Agent & Model Evaluation',
    productAreaIds: ['data_access', 'evaluation'],
    scope: '在 0.1.0 数据基础上建设 Agent / Harness Eval、Model Eval、泛化与回归评测。',
    deliverable: 'Harness Verdict + Model Verdict',
    acceptanceCriteria: [
      '固定 Model 与 Runtime，能够比较 Harness H0/H1。',
      '固定 Harness 与 Benchmark，能够比较 Model Snapshot。',
      '目标能力、泛化、回归、成本与稳定性指标可以形成可审计 Verdict。',
      '评测通过的数据可以晋升为后训练候选，但不会在本版本内启动训练。',
    ],
    excludedCapabilities: ['真实训练 Provider 编排', '模型发布', 'Canary / Rollback', '线上反馈闭环'],
    dependsOn: '0.1.0',
  },
  {
    version: '0.3.0',
    status: 'planned',
    title: 'Model Post-training Loop',
    productAreaIds: ['data_access', 'evaluation', 'model_training'],
    scope: '在数据与评测体系稳定后，建设模型后训练、模型评测门禁、发布和线上反馈闭环。',
    deliverable: 'Validated Model Release + Production Feedback',
    acceptanceCriteria: [
      '治理后的训练数据可以交接给真实训练 Provider。',
      '训练任务、Model Snapshot、成本和数据 Lineage 全程可追踪。',
      '后训练模型必须通过独立 Model Eval 与 Model × Harness 组合评测。',
      '模型发布支持门禁、Canary、Rollback 和线上反馈回流。',
    ],
    excludedCapabilities: [],
    dependsOn: '0.2.0',
  },
];

export function buildPlatformArchitecture(store: TraceOpsStore): TraceOpsPlatformArchitecture {
  const source = store.getSource();
  const traces = store.listTraces({});
  const cleanTraces = store.listCleanTraces();
  const samples = store.listTrainingSamples();
  const datasets = store.listDatasetVersions();
  const agentIssues = store.listAgentEvaluationIssues();
  const agentExperiments = store.listAgentEvaluationExperiments();
  const agentReports = store.listAgentEvaluationReports();
  const trainingRuns = store.listTrainingRuns();
  const modelEvalRuns = store.listEvalRuns();
  const handoffs = store.listRetrainingHandoffs();
  const modelGates = store.listModelReleaseGates();
  const deployments = store.listDeploymentHandoffs();
  const monitors = store.listPostReleaseMonitors();
  const feedbackLoops = store.listFeedbackLoops();

  const dataModules: TraceOpsCapabilityModule[] = [
    {
      id: 'session_ingestion',
      title: 'Session 数据接入',
      purpose: '连接 KodaX、Space 与 AgentOS，持续接收 Session 和 Runtime 事件。',
      status: !source.exists ? 'blocked' : traces.totals.total > 0 ? 'ready' : 'attention',
      stageId: 'stage-ingest',
      apiNamespace: '/api/sources',
      metrics: [
        { value: traces.totals.total, label: 'sessions', tone: traces.totals.total > 0 ? 'good' : 'warn' },
        { value: traces.totals.failed, label: 'failed', tone: traces.totals.failed > 0 ? 'danger' : 'neutral' },
      ],
      responsibilities: ['Connector 与增量同步', 'Schema / Source Hash', '接入质量与失败重试'],
    },
    {
      id: 'trace_evidence',
      title: 'Trace 与 Evidence',
      purpose: '还原真实任务过程，建立事件、产物、工具和运行环境的证据链。',
      status: traces.totals.total === 0 ? 'idle' : cleanTraces.totals.total > 0 ? 'ready' : 'attention',
      stageId: 'stage-raw',
      apiNamespace: '/api/raw-traces',
      metrics: [
        { value: traces.totals.imported + traces.totals.updated, label: 'raw traces', tone: 'good' },
        { value: cleanTraces.totals.ready, label: 'clean ready', tone: cleanTraces.totals.ready > 0 ? 'good' : 'warn' },
      ],
      responsibilities: ['Raw Trace 回放', 'Evidence 归因', 'Clean Trace 与 Lineage'],
    },
    {
      id: 'data_governance',
      title: 'Trace 预处理与治理',
      purpose: '完成清洗、脱敏、风险、Review、Repair 和评测用途分类。',
      status: samples.totals.total === 0
        ? 'idle'
        : samples.totals.blocked + samples.totals.needsReview > 0
          ? 'attention'
          : 'ready',
      stageId: 'stage-governance',
      apiNamespace: '/api/training-samples',
      metrics: [
        { value: samples.totals.candidate, label: 'candidates', tone: samples.totals.candidate > 0 ? 'good' : 'neutral' },
        { value: samples.totals.blocked + samples.totals.needsReview, label: 'to govern', tone: samples.totals.blocked > 0 ? 'danger' : 'warn' },
      ],
      responsibilities: ['脱敏与风险策略', 'Review / Repair', '评测用途与质量评分'],
    },
    {
      id: 'dataset_registry',
      title: '评测数据集版本',
      purpose: '把治理后的 Trace 固化成可追踪、可比较、可交付的评测数据集版本。',
      status: datasets.length > 0 ? 'ready' : samples.totals.candidate > 0 ? 'attention' : 'idle',
      stageId: 'stage-dataset',
      apiNamespace: '/api/datasets',
      metrics: [
        { value: datasets.length, label: 'versions', tone: datasets.length > 0 ? 'good' : 'neutral' },
        { value: datasets.reduce((count, dataset) => count + dataset.sampleCount, 0), label: 'versioned samples' },
      ],
      responsibilities: ['Dataset Version', 'Diff 与质量门禁', 'Eval / Review / Repair 导出'],
    },
  ];

  const regressedAgentReports = agentReports.filter((report) => report.verdict === 'regressed').length;
  const passedModelEvals = modelEvalRuns.filter((run) => run.status === 'passed').length;
  const failedModelEvals = modelEvalRuns.filter((run) => run.status === 'failed').length;
  const evaluationModules: TraceOpsCapabilityModule[] = [
    {
      id: 'agent_harness_evaluation',
      title: 'Agent / Harness 评测',
      purpose: '固定 Model 与 Runtime，验证 Prompt、Context、Skill、Memory 和 Tool Harness 是否变强。',
      status: regressedAgentReports > 0
        ? 'attention'
        : agentReports.length > 0
          ? 'ready'
          : agentExperiments.length + agentIssues.length > 0
            ? 'attention'
            : 'idle',
      stageId: 'stage-evaluation',
      apiNamespace: '/api/agent-eval',
      metrics: [
        { value: agentExperiments.length, label: 'experiments' },
        { value: agentReports.filter((report) => report.verdict === 'improved').length, label: 'improved', tone: 'good' },
        { value: regressedAgentReports, label: 'regressed', tone: regressedAgentReports > 0 ? 'danger' : 'neutral' },
      ],
      responsibilities: ['Harness H0/H1', 'Validation Benchmark', 'Case Churn 与 Guardrail'],
    },
    {
      id: 'model_evaluation',
      title: '模型评测',
      purpose: '固定 Harness，验证后训练前后的 Model Snapshot 是否真正提升。',
      status: failedModelEvals > 0
        ? 'attention'
        : passedModelEvals > 0
          ? 'ready'
          : trainingRuns.length > 0
            ? 'attention'
            : 'idle',
      stageId: 'stage-model-evaluation',
      apiNamespace: '/api/eval-runs',
      metrics: [
        { value: modelEvalRuns.length, label: 'model evals' },
        { value: passedModelEvals, label: 'passed', tone: 'good' },
        { value: failedModelEvals, label: 'failed', tone: failedModelEvals > 0 ? 'danger' : 'neutral' },
      ],
      responsibilities: ['Model-only Baseline', '训练后 Eval Run', 'Model × Harness 组合验证'],
    },
  ];

  const failedTrainingRuns = trainingRuns.filter((run) => run.status === 'failed' || run.status === 'rolled_back').length;
  const passedTrainingRuns = trainingRuns.filter((run) => run.status === 'passed').length;
  const blockedGates = modelGates.filter((gate) => gate.status === 'blocked' || gate.status === 'rejected').length;
  const approvedGates = modelGates.filter((gate) => gate.status === 'approved').length;
  const rollbackMonitors = monitors.filter((monitor) => monitor.rollbackSignal || monitor.status === 'rollback_required').length;
  const trainingModules: TraceOpsCapabilityModule[] = [
    {
      id: 'post_training_orchestration',
      title: '模型后训练',
      purpose: '从已治理数据集创建训练交接、启动训练并跟踪 Provider 运行。',
      status: failedTrainingRuns > 0
        ? 'attention'
        : passedTrainingRuns > 0
          ? 'ready'
          : trainingRuns.length + handoffs.length > 0
            ? 'attention'
            : 'idle',
      stageId: 'stage-training',
      apiNamespace: '/api/training-runs',
      metrics: [
        { value: handoffs.length, label: 'handoffs' },
        { value: trainingRuns.length, label: 'training runs' },
        { value: passedTrainingRuns, label: 'passed', tone: 'good' },
      ],
      responsibilities: ['Training Handoff', 'Provider Launch / Sync', '训练产物与模型版本'],
    },
    {
      id: 'model_release',
      title: '模型发布',
      purpose: '把模型评测结论转化为发布门禁、部署交接和可回滚版本。',
      status: blockedGates > 0
        ? 'attention'
        : approvedGates > 0
          ? 'ready'
          : modelGates.length + deployments.length > 0
            ? 'attention'
            : 'idle',
      stageId: 'stage-release',
      apiNamespace: '/api/model-release-gates',
      metrics: [
        { value: modelGates.length, label: 'release gates' },
        { value: approvedGates, label: 'approved', tone: 'good' },
        { value: deployments.length, label: 'deployments' },
      ],
      responsibilities: ['Model Release Gate', 'Deployment Handoff', 'Canary / Rollback'],
    },
    {
      id: 'production_feedback',
      title: '上线反馈闭环',
      purpose: '将线上表现、回滚信号和新失败经验回流到评测集与训练数据。',
      status: rollbackMonitors > 0
        ? 'attention'
        : monitors.length + feedbackLoops.length > 0
          ? 'ready'
          : deployments.length > 0
            ? 'attention'
            : 'idle',
      stageId: 'stage-feedback',
      apiNamespace: '/api/feedback-loops',
      metrics: [
        { value: monitors.length, label: 'monitors' },
        { value: feedbackLoops.length, label: 'feedback loops' },
        { value: rollbackMonitors, label: 'rollback signals', tone: rollbackMonitors > 0 ? 'danger' : 'neutral' },
      ],
      responsibilities: ['Post-release Monitor', 'Feedback Loop', '下一轮 Eval / Dataset'],
    },
  ];

  return {
    version: 'traceops-platform-architecture-v1',
    currentVersion: TRACEOPS_CURRENT_VERSION,
    generatedAt: new Date().toISOString(),
    releases: TRACEOPS_PRODUCT_RELEASES,
    areas: [
      productArea({
        id: 'data_access',
        order: 1,
        introducedIn: '0.1.0',
        releaseStatus: 'current',
        title: '数据接入与治理',
        shortTitle: '数据接入',
        purpose: '把真实 Session 变成可回放、可治理、可直接用于下一阶段评测的数据资产。',
        entryArtifact: 'KodaX / Space / AgentOS Session',
        exitArtifact: 'Evaluation-ready Trace Dataset',
        modules: dataModules,
      }),
      productArea({
        id: 'evaluation',
        order: 2,
        introducedIn: '0.2.0',
        releaseStatus: 'next',
        title: 'Agent 与模型评测',
        shortTitle: '评测',
        purpose: '分别证明 Harness 改动和 Model 改动是否真正提升，并守住回归与成本边界。',
        entryArtifact: 'Evaluation Issue + Benchmark Suite',
        exitArtifact: 'Agent Verdict + Model Verdict',
        modules: evaluationModules,
      }),
      productArea({
        id: 'model_training',
        order: 3,
        introducedIn: '0.3.0',
        releaseStatus: 'planned',
        title: '模型后训练与发布',
        shortTitle: '模型后训练',
        purpose: '用高价值数据后训练模型，通过模型评测后发布，并将线上信号回流。',
        entryArtifact: 'Governed Training Dataset',
        exitArtifact: 'Released Model + Production Feedback',
        modules: trainingModules,
      }),
    ],
    transitions: [
      {
        from: 'data_access',
        to: 'evaluation',
        artifact: 'Clean Trace / Validation Case',
        rule: '只有完成 Lineage、风险和用途标注的数据才能进入正式评测。',
      },
      {
        from: 'evaluation',
        to: 'model_training',
        artifact: 'Validated Dataset Candidate',
        rule: '目标能力验证通过且泛化无回归后，才允许晋升为训练数据候选。',
      },
      {
        from: 'model_training',
        to: 'evaluation',
        artifact: 'Model Snapshot / Production Signal',
        rule: '后训练模型和上线反馈必须重新进入 Model Eval 与 Model × Harness 评测。',
      },
    ],
    evaluationBoundary: {
      agentEvaluation: '固定 Model 与 Runtime，只改变 Harness；输出 Harness Verdict。',
      modelEvaluation: '固定 Harness 与 Benchmark，对比 Model Snapshot；输出 Model Verdict。',
    },
    sharedFoundation: {
      title: '平台治理',
      purpose: '为三个产品域提供统一的审计、权限、任务编排、存储和可追溯 Lineage。',
      stageId: 'stage-system',
      capabilities: ['Governance Audit', 'Task Orchestration', 'Segment Lake', 'Snapshot / Restore', 'Lineage'],
    },
  };
}

export function createPlatformArchitectureRouter(store: TraceOpsStore): Router {
  const router = Router();

  router.get('/architecture', (_req, res) => {
    res.json(buildPlatformArchitecture(store));
  });

  router.get('/releases', (_req, res) => {
    res.json({ currentVersion: TRACEOPS_CURRENT_VERSION, releases: TRACEOPS_PRODUCT_RELEASES });
  });

  router.get('/releases/:version', (req, res) => {
    const release = TRACEOPS_PRODUCT_RELEASES.find((item) => item.version === req.params.version);
    if (!release) {
      res.status(404).json({ error: 'Product release was not found.' });
      return;
    }
    res.json(release);
  });

  router.get('/areas/:areaId/overview', (req, res) => {
    const areaId = req.params.areaId as TraceOpsProductAreaId;
    const architecture = buildPlatformArchitecture(store);
    const area = architecture.areas.find((item) => item.id === areaId);
    if (!area) {
      res.status(404).json({ error: 'Product area was not found.' });
      return;
    }
    res.json({ currentVersion: architecture.currentVersion, generatedAt: architecture.generatedAt, area });
  });

  return router;
}
