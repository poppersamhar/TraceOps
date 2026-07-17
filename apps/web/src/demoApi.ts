import type { DatasetExportFormat } from '../../../packages/trace-core/src/types';

const now = '2026-07-09T09:00:00.000Z';
const traceId = 'demo-trace-kodax-session-001';
const revisionId = 'demo-revision-001';
const sessionId = 'kodax-demo-session-001';
const datasetId = 'dataset-demo-sft-001';
const sampleIds = ['sample-demo-sft-001', 'sample-demo-sft-002', 'sample-demo-review-001'];

const riskSummary = {
  L0: 0,
  L1: 2,
  L2: 1,
  L3: 0,
  L4: 0,
  highRisk: 0,
  blocked: 0,
  unreviewed: 1,
  missingEvidence: 0,
};

const tableCounts = {
  traces: 1,
  events: 6,
  evidence: 4,
  revisions: 1,
  jobs: 1,
  trainingSamplesApprox: 3,
  memoryCandidatesApprox: 1,
  datasetVersions: 1,
  releaseManifests: 1,
  trainingRuns: 0,
  tasks: 2,
  governanceAuditRecords: 2,
};

const runtime = {
  canonicalRepoRoot: '/demo/kodax/product',
  workspaceRoot: '/demo/kodax/product',
  executionCwd: '/demo/kodax/product',
  branch: 'main',
  surface: 'KodaX CLI',
  provider: 'demo-provider',
  model: 'kodax-agent-demo',
  permissionMode: 'workspace-write',
  agentMode: 'coding',
  scope: 'user',
};

const demoTrace = {
  id: traceId,
  source: 'kodax',
  sourceSessionId: sessionId,
  projectKey: 'kodax-product-matrix',
  title: 'KodaX session 数据接入与 SFT 样本整理',
  status: 'completed',
  ingestionStatus: 'imported',
  createdAt: '2026-07-09T08:10:00.000Z',
  importedAt: now,
  updatedAt: now,
  runtime,
  counts: {
    messages: 18,
    activeMessages: 18,
    lineageEntries: 4,
    transcriptEntries: 18,
    artifactLedgerEntries: 3,
    toolUseEvents: 4,
    toolResultEvents: 4,
    compactions: 0,
    branchSummaries: 1,
    goalEvents: 1,
  },
  risk: {
    level: 'L1',
    reasons: ['demo data only', 'local path redacted'],
    containsSourceCodeHint: false,
    containsLocalPathHint: true,
    containsCredentialHint: false,
    containsCustomerDataHint: false,
    trainableByDefault: false,
  },
  latestRevisionId: revisionId,
  latestSourceHash: 'demo-source-hash-001',
};

const demoHarnessBaseline = {
  id: 'harness-demo-h0',
  name: 'KodaX production Harness',
  version: 'h0',
  status: 'active',
  source: { repository: 'BizAgentOS/KodaX', commit: 'demo-h0' },
  components: {
    promptHash: 'sha256:demo-prompt-h0',
    contextPolicyHash: 'sha256:demo-context-h0',
    skillManifestHash: 'sha256:demo-skills-h0',
  },
  compatibleModels: ['kodax-agent-demo'],
  sourceTraceIds: [traceId],
  contentHash: 'sha256:demo-harness-h0',
  createdBy: 'kodax-engineer',
  createdAt: now,
  updatedAt: now,
};

const demoHarnessCandidate = {
  ...demoHarnessBaseline,
  id: 'harness-demo-h1',
  name: 'KodaX verification Harness',
  version: 'h1',
  parentId: demoHarnessBaseline.id,
  status: 'candidate',
  source: { repository: 'BizAgentOS/KodaX', commit: 'demo-h1' },
  components: {
    promptHash: 'sha256:demo-prompt-h1',
    contextPolicyHash: 'sha256:demo-context-h1',
    skillManifestHash: 'sha256:demo-skills-h1',
    verifierHash: 'sha256:demo-verifier-h1',
  },
  changeSummary: 'Require evidence-backed verification before declaring a code task complete.',
  contentHash: 'sha256:demo-harness-h1',
};

const demoAgentIssue = {
  id: 'agent-eval-issue-demo-001',
  title: '代码修改后缺少验证证据',
  description: '真实 Session 显示 Agent 偶尔在没有运行相关测试时声明任务完成。',
  category: 'verification',
  scopeTags: ['kodax', 'code-change'],
  sourceTraceIds: [traceId],
  primaryMetricId: 'task_success',
  owner: 'kodax-engineer',
  status: 'validated',
  createdAt: now,
  updatedAt: now,
};

const demoBenchmarkCase = {
  id: 'agent-case-demo-001',
  sourceTraceId: traceId,
  usage: 'validation',
  title: '修改 API schema 并提供验证证据',
  taskType: 'code-change',
  scopeTags: ['kodax', 'typescript'],
  inputRef: `clean-trace:${traceId}`,
  expectedArtifactRefs: ['evidence-demo-002'],
  grader: { kind: 'trace_signal', version: 'trace-signal-v1' },
  critical: true,
  riskLevel: 'L1',
  status: 'ready',
  createdBy: 'traceops-demo',
  createdAt: now,
  updatedAt: now,
};

const demoBenchmarkSuite = {
  id: 'agent-suite-demo-001',
  name: 'KodaX verification validation v1',
  purpose: 'update_validation',
  issueId: demoAgentIssue.id,
  caseIds: [demoBenchmarkCase.id],
  version: 'v1',
  status: 'frozen',
  snapshotHash: 'sha256:demo-agent-suite',
  createdBy: 'traceops-demo',
  createdAt: now,
  updatedAt: now,
};

const demoAgentMetrics = [
  { id: 'task_success', label: 'Task success', unit: 'percent', direction: 'increase', aggregation: 'rate', role: 'primary', targetDelta: 0.05 },
  { id: 'artifact_verified', label: 'Artifact verified', unit: 'percent', direction: 'increase', aggregation: 'rate', role: 'diagnostic' },
  { id: 'evidence_complete', label: 'Evidence complete', unit: 'percent', direction: 'increase', aggregation: 'rate', role: 'diagnostic' },
  { id: 'runtime_error', label: 'Runtime errors', unit: 'count', direction: 'decrease', aggregation: 'sum', role: 'guardrail' },
  { id: 'token_usage', label: 'Token usage', unit: 'tokens', direction: 'decrease', aggregation: 'mean', role: 'guardrail', maxDelta: 0 },
];

const demoAgentExperiment = {
  id: 'agent-experiment-demo-001',
  issueId: demoAgentIssue.id,
  benchmarkSuiteId: demoBenchmarkSuite.id,
  modelSnapshot: { provider: 'demo-provider', model: 'kodax-agent-demo' },
  baselineHarnessId: demoHarnessBaseline.id,
  candidateHarnessId: demoHarnessCandidate.id,
  runtimeSnapshotHash: 'sha256:demo-runtime-fixed',
  evaluatorVersion: 'traceops-agent-eval-v1',
  repetitions: 1,
  metrics: demoAgentMetrics,
  status: 'completed',
  experimentHash: 'sha256:demo-agent-experiment',
  createdBy: 'traceops-demo',
  createdAt: now,
  updatedAt: now,
  startedAt: now,
  completedAt: now,
};

const demoAgentReport = {
  id: 'agent-eval-report-demo-001',
  experimentId: demoAgentExperiment.id,
  verdict: 'improved',
  baselineSummary: [
    { metricId: 'task_success', value: 0, samples: 1 },
    { metricId: 'artifact_verified', value: 0, samples: 1 },
    { metricId: 'evidence_complete', value: 0, samples: 1 },
    { metricId: 'runtime_error', value: 0, samples: 1 },
    { metricId: 'token_usage', value: 1050, samples: 1 },
  ],
  candidateSummary: [
    { metricId: 'task_success', value: 1, samples: 1 },
    { metricId: 'artifact_verified', value: 1, samples: 1 },
    { metricId: 'evidence_complete', value: 1, samples: 1 },
    { metricId: 'runtime_error', value: 0, samples: 1 },
    { metricId: 'token_usage', value: 980, samples: 1 },
  ],
  deltas: [
    { metricId: 'task_success', baseline: 0, candidate: 1, delta: 1, passed: true, reason: 'Primary target met.' },
    { metricId: 'artifact_verified', baseline: 0, candidate: 1, delta: 1, passed: true, reason: 'Diagnostic improvement.' },
    { metricId: 'evidence_complete', baseline: 0, candidate: 1, delta: 1, passed: true, reason: 'Diagnostic improvement.' },
    { metricId: 'runtime_error', baseline: 0, candidate: 0, delta: 0, passed: true, reason: 'Guardrail held.' },
    { metricId: 'token_usage', baseline: 1050, candidate: 980, delta: -70, passed: true, reason: 'Cost guardrail held.' },
  ],
  churn: { passToPass: 0, failToPass: 1, passToFail: 0, failToFail: 0, criticalRegressions: 0 },
  reasons: ['All primary metrics met their predeclared targets.', '1 validation case moved from fail to pass.'],
  recommendation: 'Retain the candidate Harness for broader generalization and regression evaluation.',
  reportHash: 'sha256:demo-agent-evaluation-report',
  createdAt: now,
};

const demoProductReleases = [
  {
    version: '0.1.0',
    status: 'current',
    title: 'Trace Data Foundation',
    productAreaIds: ['data_access'],
    scope: '只建设 Session 接入、Trace 还原、Evidence 归因、预处理治理和评测数据集整理。',
    deliverable: 'Evaluation-ready Trace Dataset',
    acceptanceCriteria: ['Session 自动接入', 'Raw Trace 与 Evidence 可回放', '数据治理可审计', '评测数据集可版本化'],
    excludedCapabilities: ['Harness 正式评测', '模型评测', '模型后训练与发布'],
  },
  {
    version: '0.2.0',
    status: 'next',
    title: 'Agent & Model Evaluation',
    productAreaIds: ['data_access', 'evaluation'],
    scope: '在 0.1.0 数据基础上建设 Agent / Harness Eval、Model Eval、泛化与回归评测。',
    deliverable: 'Harness Verdict + Model Verdict',
    acceptanceCriteria: ['Harness H0/H1 对照', 'Model Snapshot 对照', '泛化与回归评测', '可审计 Verdict'],
    excludedCapabilities: ['真实训练 Provider', '模型发布与线上反馈'],
    dependsOn: '0.1.0',
  },
  {
    version: '0.3.0',
    status: 'planned',
    title: 'Model Post-training Loop',
    productAreaIds: ['data_access', 'evaluation', 'model_training'],
    scope: '在数据与评测体系稳定后，建设模型后训练、评测门禁、发布和线上反馈闭环。',
    deliverable: 'Validated Model Release + Production Feedback',
    acceptanceCriteria: ['真实训练 Provider', 'Model Snapshot Lineage', '模型评测门禁', 'Canary / Rollback / Feedback'],
    excludedCapabilities: [],
    dependsOn: '0.2.0',
  },
];

const demoPlatformArchitecture = {
  version: 'traceops-platform-architecture-v1',
  currentVersion: '0.1.0',
  generatedAt: now,
  releases: demoProductReleases,
  areas: [
    {
      id: 'data_access',
      order: 1,
      introducedIn: '0.1.0',
      releaseStatus: 'current',
      title: '数据接入与治理',
      shortTitle: '数据接入',
      purpose: '把真实 Session 变成可回放、可治理、可直接用于下一阶段评测的数据资产。',
      status: 'ready',
      entryArtifact: 'KodaX / Space / AgentOS Session',
      exitArtifact: 'Evaluation-ready Trace Dataset',
      modules: [
        { id: 'session_ingestion', title: 'Session 数据接入', purpose: '连接并持续接收 Session。', status: 'ready', stageId: 'stage-ingest', apiNamespace: '/api/sources', metrics: [{ value: 1, label: 'sessions', tone: 'good' }], responsibilities: ['Connector 与增量同步', '接入质量'] },
        { id: 'trace_evidence', title: 'Trace 与 Evidence', purpose: '建立真实任务证据链。', status: 'ready', stageId: 'stage-raw', apiNamespace: '/api/raw-traces', metrics: [{ value: 1, label: 'raw traces', tone: 'good' }], responsibilities: ['Raw Trace', 'Evidence 归因'] },
        { id: 'data_governance', title: 'Trace 预处理与治理', purpose: '清洗、风险与评测用途分类。', status: 'attention', stageId: 'stage-governance', apiNamespace: '/api/training-samples', metrics: [{ value: 2, label: 'candidates', tone: 'good' }, { value: 1, label: 'to govern', tone: 'warn' }], responsibilities: ['脱敏与风险', 'Review / Repair'] },
        { id: 'dataset_registry', title: '评测数据集版本', purpose: '固化可追踪的评测数据集版本。', status: 'ready', stageId: 'stage-dataset', apiNamespace: '/api/datasets', metrics: [{ value: 1, label: 'versions', tone: 'good' }], responsibilities: ['Dataset Version', 'Diff 与质量门禁'] },
      ],
    },
    {
      id: 'evaluation',
      order: 2,
      introducedIn: '0.2.0',
      releaseStatus: 'next',
      title: 'Agent 与模型评测',
      shortTitle: '评测',
      purpose: '分别证明 Harness 改动和 Model 改动是否真正提升。',
      status: 'ready',
      entryArtifact: 'Evaluation Issue + Benchmark Suite',
      exitArtifact: 'Agent Verdict + Model Verdict',
      modules: [
        { id: 'agent_harness_evaluation', title: 'Agent / Harness 评测', purpose: '固定 Model，对比 Harness H0/H1。', status: 'ready', stageId: 'stage-evaluation', apiNamespace: '/api/agent-eval', metrics: [{ value: 1, label: 'experiments' }, { value: 1, label: 'improved', tone: 'good' }], responsibilities: ['Harness H0/H1', 'Case Churn'] },
        { id: 'model_evaluation', title: '模型评测', purpose: '固定 Harness，对比 Model Snapshot。', status: 'idle', stageId: 'stage-model-evaluation', apiNamespace: '/api/eval-runs', metrics: [{ value: 0, label: 'model evals' }], responsibilities: ['Model-only Baseline', 'Model × Harness'] },
      ],
    },
    {
      id: 'model_training',
      order: 3,
      introducedIn: '0.3.0',
      releaseStatus: 'planned',
      title: '模型后训练与发布',
      shortTitle: '模型后训练',
      purpose: '用高价值数据后训练模型，通过评测后发布并回流线上信号。',
      status: 'idle',
      entryArtifact: 'Governed Training Dataset',
      exitArtifact: 'Released Model + Production Feedback',
      modules: [
        { id: 'post_training_orchestration', title: '模型后训练', purpose: '启动并跟踪训练。', status: 'idle', stageId: 'stage-training', apiNamespace: '/api/training-runs', metrics: [{ value: 0, label: 'training runs' }], responsibilities: ['Training Handoff', 'Provider Run'] },
        { id: 'model_release', title: '模型发布', purpose: '评测门禁与部署交接。', status: 'idle', stageId: 'stage-release', apiNamespace: '/api/model-release-gates', metrics: [{ value: 0, label: 'release gates' }], responsibilities: ['Release Gate', 'Deployment'] },
        { id: 'production_feedback', title: '上线反馈闭环', purpose: '线上信号回流评测与数据。', status: 'idle', stageId: 'stage-feedback', apiNamespace: '/api/feedback-loops', metrics: [{ value: 0, label: 'feedback loops' }], responsibilities: ['Monitor', 'Feedback Loop'] },
      ],
    },
  ],
  transitions: [
    { from: 'data_access', to: 'evaluation', artifact: 'Clean Trace / Validation Case', rule: '治理完成后进入评测。' },
    { from: 'evaluation', to: 'model_training', artifact: 'Validated Dataset Candidate', rule: '验证通过后晋升训练候选。' },
    { from: 'model_training', to: 'evaluation', artifact: 'Model Snapshot / Production Signal', rule: '训练与上线信号重新进入评测。' },
  ],
  evaluationBoundary: {
    agentEvaluation: '固定 Model 与 Runtime，只改变 Harness；输出 Harness Verdict。',
    modelEvaluation: '固定 Harness 与 Benchmark，对比 Model Snapshot；输出 Model Verdict。',
  },
  sharedFoundation: {
    title: '平台治理',
    purpose: '为三个产品域提供统一审计、权限、任务编排、存储和 Lineage。',
    stageId: 'stage-system',
    capabilities: ['Governance Audit', 'Task Orchestration', 'Segment Lake', 'Snapshot / Restore', 'Lineage'],
  },
};

const events = [
  {
    id: 'evt-001',
    traceId,
    revisionId,
    source: 'kodax_session',
    occurredAt: '2026-07-09T08:10:00.000Z',
    order: 1,
    type: 'message',
    role: 'user',
    active: true,
    label: 'User goal',
    preview: '把 KodaX session 自动整理成可训练数据集。',
    payload: {},
    riskLevel: 'L1',
  },
  {
    id: 'evt-002',
    traceId,
    revisionId,
    source: 'kodax_session',
    occurredAt: '2026-07-09T08:11:00.000Z',
    order: 2,
    type: 'tool_call',
    active: true,
    label: 'Scan sessions',
    preview: '扫描 KodaX session 目录并识别新增会话。',
    payload: {},
    riskLevel: 'L1',
  },
  {
    id: 'evt-003',
    traceId,
    revisionId,
    source: 'kodax_session',
    occurredAt: '2026-07-09T08:12:00.000Z',
    order: 3,
    type: 'tool_result',
    active: true,
    label: 'Normalize trace',
    preview: '生成 Raw Trace、Evidence 和 Candidate Sample。',
    payload: {},
    riskLevel: 'L1',
  },
  {
    id: 'evt-004',
    traceId,
    revisionId,
    source: 'kodax_session',
    occurredAt: '2026-07-09T08:13:00.000Z',
    order: 4,
    type: 'message',
    role: 'assistant',
    active: true,
    label: 'Assistant outcome',
    preview: '已完成接入、治理、数据集版本和导出链路。',
    payload: {},
    riskLevel: 'L1',
  },
];

const evidence = [
  {
    id: 'evidence-demo-001',
    traceId,
    revisionId,
    source: 'kodax_tool_event',
    sourceLedgerId: 'ledger-demo-001',
    kind: 'file_read',
    sourceTool: 'scan',
    action: 'read',
    target: '/demo/.kodax/sessions/session.jsonl',
    displayTarget: '[demo]/.kodax/sessions/session.jsonl',
    summary: 'KodaX session 文件符合 TraceOps 接入规格。',
    sessionEntryId: 'evt-002',
    timestamp: '2026-07-09T08:11:00.000Z',
    metadata: {},
    riskLevel: 'L1',
  },
  {
    id: 'evidence-demo-002',
    traceId,
    revisionId,
    source: 'kodax_tool_event',
    sourceLedgerId: 'ledger-demo-002',
    kind: 'check_result',
    sourceTool: 'distiller',
    action: 'validate',
    target: 'sft-jsonl',
    displayTarget: 'SFT JSONL',
    summary: '样本已脱敏并满足 messages JSONL 导出格式。',
    sessionEntryId: 'evt-003',
    timestamp: '2026-07-09T08:12:00.000Z',
    metadata: {},
    riskLevel: 'L1',
  },
];

const sampleBase = {
  traceId,
  revisionId,
  source: 'raw_trace',
  sourceSessionId: sessionId,
  projectKey: 'kodax-product-matrix',
  title: 'KodaX session 数据接入与 SFT 样本整理',
  riskLevel: 'L1',
  blockers: [],
  labels: ['kodax', 'session-ingestion', 'sft'],
  toolEventCount: 2,
  evidenceCount: 2,
  eventCount: 4,
  createdAt: now,
  updatedAt: now,
  input: {
    userGoal: '将 KodaX session 数据整理为可用于 SFT 的训练样本。',
    cleanUserGoal: '将 KodaX session 数据整理为 SFT 训练样本。',
    runtime,
    toolEventIds: ['evt-002', 'evt-003'],
    evidenceIds: ['evidence-demo-001', 'evidence-demo-002'],
    sourceEventIds: ['evt-001', 'evt-002', 'evt-003'],
  },
  output: {
    assistantOutcome: 'TraceOps 完成接入、清洗、治理、数据集固化和 JSONL 导出。',
    cleanAssistantOutcome: 'TraceOps 已生成可导出的 SFT JSONL 数据。',
    finalEventId: 'evt-004',
  },
  metadata: {
    generatedBy: 'traceops-p0-sampler',
    traceStatus: 'completed',
    ingestionStatus: 'imported',
    riskReasons: ['demo data only'],
    distillation: {
      version: 'kodax-clean-text-v1',
      redactionCount: 1,
      removedThinking: true,
      readyForFineTune: true,
    },
    datasetBuilder: {
      version: 'kodax-dataset-builder-v1',
      sourceSignals: ['complete_session', 'linked_evidence', 'low_risk'],
    },
  },
};

const samples = [
  {
    ...sampleBase,
    id: sampleIds[0],
    kind: 'sft',
    status: 'candidate',
    trainable: true,
    quality: {
      score: 94,
      grade: 'excellent',
      signals: [
        { label: '目标清晰', impact: 'positive', detail: '用户目标和最终结果都可抽取。' },
        { label: '证据完整', impact: 'positive', detail: '工具事件和结果已挂载。' },
      ],
    },
    promptPreview: '将 KodaX session 数据整理为 SFT 训练样本。',
    responsePreview: 'TraceOps 已生成可导出的 SFT JSONL 数据。',
  },
  {
    ...sampleBase,
    id: sampleIds[1],
    kind: 'sft',
    status: 'candidate',
    trainable: true,
    quality: {
      score: 90,
      grade: 'excellent',
      signals: [
        { label: '可训练', impact: 'positive', detail: '结构满足 messages JSONL。' },
      ],
    },
    promptPreview: '检查 session 是否可增量写入 Segment Lake。',
    responsePreview: '已按 2000 条或 128MB 规则写入分片文件。',
  },
  {
    ...sampleBase,
    id: sampleIds[2],
    kind: 'repair',
    status: 'needs_review',
    trainable: false,
    quality: {
      score: 72,
      grade: 'review',
      signals: [
        { label: '需要复核', impact: 'warning', detail: '示例样本展示 Review 导出路径。' },
      ],
    },
    promptPreview: '补齐一次失败 session 的 evidence。',
    responsePreview: '需要人工确认修复后的 evidence 是否完整。',
    metadata: {
      ...sampleBase.metadata,
      distillation: {
        ...sampleBase.metadata.distillation,
        readyForFineTune: false,
      },
    },
  },
];

const cleanTraces = [
  {
    id: 'clean-demo-001',
    traceId,
    revisionId,
    sourceSessionId: sessionId,
    projectKey: 'kodax-product-matrix',
    title: demoTrace.title,
    kind: 'sft',
    status: 'ready',
    candidateStatus: 'candidate',
    trainable: true,
    riskLevel: 'L1',
    quality: samples[0].quality,
    blockers: [],
    cleanUserGoal: sampleBase.input.cleanUserGoal,
    cleanAssistantOutcome: sampleBase.output.cleanAssistantOutcome,
    rawUserGoal: sampleBase.input.userGoal,
    rawAssistantOutcome: sampleBase.output.assistantOutcome,
    summary: {
      userGoal: '把 KodaX session 接入 TraceOps。',
      assistantOutcome: '生成可导出的 SFT JSONL。',
      execution: '扫描、规范化、清洗、治理、固化数据集。',
      evidence: '工具调用和校验结果均已挂载。',
      governance: '低风险，已脱敏，可训练。',
    },
    cleaning: {
      policyVersion: 'kodax-clean-text-v1',
      rawEventCount: 4,
      keptEventCount: 4,
      droppedEventCount: 0,
      compressionRatio: 0.62,
      redactions: [{ type: 'local_path', count: 1, replacement: '[path]' }],
      removedEventTypes: {},
    },
    evidenceCoverage: {
      status: 'complete',
      linkedEvidenceCount: 2,
      toolEventCount: 2,
      evidenceGapCount: 0,
      notes: ['demo evidence complete'],
    },
    timelinePreview: events.map((event) => ({
      eventId: event.id,
      occurredAt: event.occurredAt,
      type: event.type,
      label: event.label,
      preview: event.preview,
      active: event.active,
      riskLevel: event.riskLevel,
    })),
    redactionCount: 1,
    removedThinking: true,
    readyForFineTune: true,
    metrics: {
      toolEventCount: 2,
      evidenceCount: 2,
      eventCount: 4,
    },
    sourceEventIds: events.map((event) => event.id),
    evidenceIds: evidence.map((item) => item.id),
    policies: {
      samplerVersion: 'traceops-p0-sampler',
      cleaningPolicyVersion: 'kodax-clean-text-v1',
      redactionPolicyVersion: 'kodax-clean-text-v1',
    },
    createdAt: now,
    updatedAt: now,
  },
];

const datasetVersion = {
  id: datasetId,
  name: 'KodaX Demo SFT Dataset',
  source: 'kodax_candidate_pool',
  status: 'ready',
  format: 'fine_tune_jsonl',
  sampleIds: sampleIds.slice(0, 2),
  sampleCount: 2,
  averageQuality: 92,
  filters: { kind: 'sft', status: 'candidate', readyForFineTune: 'true' },
  snapshotHash: 'demo-dataset-snapshot-hash',
  sampleSnapshots: samples.slice(0, 2),
  policies: {
    samplerVersion: 'traceops-p0-sampler',
    cleaningPolicyVersion: 'kodax-clean-text-v1',
    redactionPolicyVersion: 'kodax-clean-text-v1',
  },
  reviewSummary: {
    approved: 2,
    rejected: 0,
    unreviewed: 0,
  },
  createdAt: now,
  createdBy: 'traceops-demo',
  notes: 'Vercel Demo Mode dataset for product preview.',
};

const manifest = {
  id: 'manifest-demo-001',
  datasetVersionId: datasetId,
  datasetVersionName: datasetVersion.name,
  manifestVersion: 'traceops-release-manifest-v1',
  status: 'ready',
  format: 'fine_tune_jsonl',
  sampleCount: 2,
  traceCount: 1,
  manifestHash: 'demo-manifest-hash',
  snapshotHash: datasetVersion.snapshotHash,
  exportUrls: {
    traceops_jsonl: demoExportUrl('traceops_jsonl'),
    fine_tune_jsonl: demoExportUrl('fine_tune_jsonl'),
    review_jsonl: demoExportUrl('review_jsonl'),
    eval_jsonl: demoExportUrl('eval_jsonl'),
    repair_jsonl: demoExportUrl('repair_jsonl'),
  },
  releaseGate: {
    status: 'ready',
    score: 96,
    checks: [],
    blockCount: 0,
    warnCount: 0,
    passCount: 5,
    originalBlockCount: 0,
    originalWarnCount: 0,
    actionedCount: 0,
    releaseBlocked: false,
    recommendation: 'Ready for SFT handoff.',
  },
  reviewSummary: datasetVersion.reviewSummary,
  qualitySummary: {
    averageQuality: 92,
    excellent: 2,
    good: 0,
    review: 0,
    blocked: 0,
  },
  evidenceSummary: {
    complete: 2,
    partial: 0,
    missing: 0,
    notRequired: 0,
  },
  riskSummary,
  createdAt: now,
  createdBy: 'traceops-demo',
  notes: 'Demo release manifest.',
};

const promotion = {
  id: 'promotion-demo-001',
  manifestId: manifest.id,
  datasetVersionId: datasetId,
  datasetVersionName: datasetVersion.name,
  manifestHash: manifest.manifestHash,
  status: 'promoted',
  promotedAt: now,
  promotedBy: 'traceops-demo',
  note: 'Demo promotion for preview.',
};

const sourceStatus = {
  id: 'kodax-local',
  type: 'kodax',
  displayName: 'KodaX Session Demo',
  enabled: true,
  sessionsDir: '~/.kodax/sessions',
  exists: true,
  lastSyncAt: now,
  autoWatch: true,
  watcherStatus: 'idle',
  watchIntervalMs: 15000,
  autoApplyQualityPolicy: true,
  scope: 'all',
  rawTraceTrainable: false,
  syncCheckpoint: {
    jobId: 'job-demo-001',
    mode: 'manual',
    cursor: 'demo-cursor',
    lastStartedAt: now,
    lastFinishedAt: now,
    discovered: 1,
    created: 1,
    imported: 1,
    updated: 0,
    unchanged: 0,
    skipped: 0,
    failed: 0,
    schemaWarnings: 0,
    runtimeFilesDiscovered: 1,
    runtimeFilesImported: 1,
    runtimeEventsImported: 4,
    runtimeSpansImported: 2,
  },
};

const job = {
  id: 'job-demo-001',
  sourceId: 'kodax-local',
  status: 'succeeded',
  mode: 'manual',
  discovered: 1,
  created: 1,
  imported: 1,
  updated: 0,
  unchanged: 0,
  skipped: 0,
  failed: 0,
  schemaWarnings: 0,
  runtimeFilesDiscovered: 1,
  runtimeFilesImported: 1,
  runtimeEventsImported: 4,
  runtimeSpansImported: 2,
  startedAt: now,
  finishedAt: now,
  message: 'Demo KodaX session imported.',
};

const qualityQueue = {
  issues: [],
  summary: {
    totalIssues: 0,
    openIssues: 0,
    triagedIssues: 0,
    totalOccurrences: 0,
    openOccurrences: 0,
    triagedOccurrences: 0,
    warningOccurrences: 0,
    errorOccurrences: 0,
    acknowledged: 0,
    ignored: 0,
    resolved: 0,
  },
};

const taskList = {
  tasks: [
    {
      id: 'task-demo-001',
      kind: 'kodax_sync',
      status: 'succeeded',
      title: 'Sync KodaX sessions',
      description: 'Import KodaX session data into TraceOps.',
      queue: 'ingestion',
      priority: 'normal',
      progress: 100,
      attempts: 1,
      maxAttempts: 3,
      entityRefs: [{ kind: 'ingest_job', id: job.id, label: job.id }],
      resultSummary: 'Imported 1 demo session.',
      createdBy: 'traceops-demo',
      createdAt: now,
      updatedAt: now,
      startedAt: now,
      finishedAt: now,
      events: [{ id: 'task-event-demo-001', status: 'succeeded', note: 'Demo sync complete.', createdAt: now }],
    },
  ],
  summary: {
    total: 1,
    queued: 0,
    running: 0,
    succeeded: 1,
    failed: 0,
    retrying: 0,
    cancelled: 0,
    active: 0,
    needsAttention: 0,
  },
};

const storageHealth = {
  status: 'healthy',
  driver: 'local-json',
  message: 'Demo persistence store is healthy.',
  storePath: '.traceops/store.json',
  backupPath: '.traceops/store.json.bak',
  snapshotsDir: '.traceops/snapshots',
  storeBytes: 48291,
  backupBytes: 48291,
  storeSha256: 'demo-store-sha',
  tableCounts,
  snapshotCount: 1,
  recommendations: [],
  checkedAt: now,
};

const segmentStatus = {
  rootDir: '.traceops/lake',
  maxRecordsPerSegment: 2000,
  maxBytesPerSegment: 134217728,
  files: 4,
  openFiles: 4,
  sealedFiles: 0,
  records: 7,
  bytes: 18432,
  streams: [
    { stream: 'raw_trace', kind: 'raw_trace', files: 1, openFiles: 1, sealedFiles: 0, records: 1, bytes: 4096, latestFileId: 'segment-demo-raw', latestWriteAt: now },
    { stream: 'clean_trace', kind: 'clean_trace', files: 1, openFiles: 1, sealedFiles: 0, records: 1, bytes: 4096, latestFileId: 'segment-demo-clean', latestWriteAt: now },
    { stream: 'training_sample', kind: 'training_sample', files: 1, openFiles: 1, sealedFiles: 0, records: 3, bytes: 8192, latestFileId: 'segment-demo-sample', latestWriteAt: now },
    { stream: 'dataset_version', kind: 'dataset_version', files: 1, openFiles: 1, sealedFiles: 0, records: 1, bytes: 2048, latestFileId: 'segment-demo-dataset', latestWriteAt: now },
  ],
  recentFiles: [
    {
      id: 'segment-demo-sample',
      stream: 'training_sample',
      kind: 'training_sample',
      path: '.traceops/lake/training_sample/segment-demo-sample.jsonl',
      status: 'open',
      schemaVersion: 'traceops-segment-v1',
      recordCount: 3,
      byteSize: 8192,
      maxRecords: 2000,
      maxBytes: 134217728,
      createdAt: now,
      updatedAt: now,
      firstRecordAt: now,
      lastRecordAt: now,
    },
  ],
  lastBackfillAt: now,
  checkedAt: now,
};

const feedbackReport = {
  id: 'kodax-feedback-demo-001',
  generatedAt: now,
  product: 'kodax',
  summary: {
    signals: 1,
    critical: 0,
    warning: 0,
    info: 1,
    actionItems: 1,
    topRecommendation: '继续提高 session evidence 覆盖率。',
  },
  signals: [
    {
      id: 'signal-demo-001',
      severity: 'info',
      category: 'tracing_gap',
      title: 'Demo feedback signal',
      detail: '线上预览展示 KodaX 反哺闭环入口。',
      evidenceRefs: [{ kind: 'trace', id: traceId }],
      createdAt: now,
    },
  ],
  actionItems: [
    {
      id: 'action-demo-001',
      category: 'tracing_gap',
      title: '补齐真实 KodaX runtime span',
      detail: '真实接入时建议持续记录 tool span 和 artifact ledger。',
      priority: 'medium',
      evidenceRefs: [{ kind: 'trace', id: traceId }],
    },
  ],
  nextActions: ['Use local worker for real KodaX ingestion.'],
};

function emptyPolicy() {
  return {
    rules: [],
    recommendations: [],
    dismissedRecommendations: [],
    recommendationDecisions: [],
    summary: {
      totalRules: 0,
      enabledRules: 0,
      draftRules: 0,
      pausedRules: 0,
      manualReviewRules: 0,
      automationRules: 0,
      recommendedRules: 0,
      acceptedRecommendations: 0,
      dismissedRecommendations: 0,
      reopenedRecommendations: 0,
      recommendationDecisionEvents: 0,
    },
  };
}

function demoSftRows(format: DatasetExportFormat) {
  if (format === 'traceops_jsonl') {
    return samples.map((sample) => ({
      id: sample.id,
      trace_id: sample.traceId,
      kind: sample.kind,
      status: sample.status,
      trainable: sample.trainable,
      prompt: sample.promptPreview,
      response: sample.responsePreview,
      evidence_ids: sample.input.evidenceIds,
      quality_score: sample.quality.score,
    }));
  }
  if (format === 'review_jsonl') {
    return samples.filter((sample) => sample.status === 'needs_review').map((sample) => ({
      sample_id: sample.id,
      review_reason: sample.quality.signals[0]?.detail ?? 'needs review',
      prompt: sample.promptPreview,
      response: sample.responsePreview,
    }));
  }
  if (format === 'eval_jsonl') {
    return samples.slice(0, 2).map((sample) => ({
      input: sample.promptPreview,
      expected: sample.responsePreview,
      metadata: { sample_id: sample.id, trace_id: sample.traceId },
    }));
  }
  if (format === 'repair_jsonl') {
    return samples.filter((sample) => sample.kind === 'repair').map((sample) => ({
      sample_id: sample.id,
      issue: sample.quality.signals[0]?.detail,
      proposed_prompt: sample.promptPreview,
      proposed_response: sample.responsePreview,
    }));
  }
  return samples.slice(0, 2).map((sample) => ({
    messages: [
      { role: 'system', content: 'You are KodaX, an enterprise coding agent.' },
      { role: 'user', content: sample.promptPreview },
      { role: 'assistant', content: sample.responsePreview },
    ],
    metadata: {
      sample_id: sample.id,
      trace_id: sample.traceId,
      project_key: sample.projectKey,
      quality_score: sample.quality.score,
    },
  }));
}

export function demoExportUrl(format: DatasetExportFormat = 'fine_tune_jsonl') {
  const body = `${demoSftRows(format).map((row) => JSON.stringify(row)).join('\n')}\n`;
  return `data:application/x-ndjson;charset=utf-8,${encodeURIComponent(body)}`;
}

export function shouldUseDemoApi(fallback = false) {
  if (import.meta.env.VITE_TRACEOPS_DEMO === 'true') return true;
  if (!fallback || typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return host !== 'localhost' && host !== '127.0.0.1' && host !== '::1';
}

function genericMutationResult(path: string) {
  if (path.endsWith('/complete') && path.includes('/api/agent-eval/experiments/')) return demoAgentReport;
  if (path.endsWith('/start') && path.includes('/api/agent-eval/experiments/')) {
    return { ...demoAgentExperiment, status: 'running', completedAt: undefined };
  }
  if (path.includes('/api/agent-eval/experiments/') && path.endsWith('/rollouts')) {
    return { id: 'agent-rollout-demo-imported', experimentId: demoAgentExperiment.id, createdAt: now };
  }
  if (path === '/api/harness-snapshots') return demoHarnessCandidate;
  if (path === '/api/agent-eval/issues') return demoAgentIssue;
  if (path === '/api/agent-eval/benchmark-cases' || path.includes('/benchmark-cases/from-trace/')) {
    return demoBenchmarkCase;
  }
  if (path === '/api/agent-eval/benchmark-suites') return demoBenchmarkSuite;
  if (path === '/api/agent-eval/experiments') return demoAgentExperiment;
  if (path.includes('/sync')) return job;
  if (path.includes('/watch')) return sourceStatus;
  if (path.includes('/segments/backfill') || path.includes('/segments/rebuild')) {
    return {
      written: 7,
      skipped: 0,
      filesCreated: 4,
      filesSealed: 0,
      streamWrites: { raw_trace: 1, clean_trace: 1, training_sample: 3, dataset_version: 1 },
      status: segmentStatus,
      backfilledAt: now,
    };
  }
  if (path.includes('/snapshots')) {
    return {
      snapshot: {
        id: 'snapshot-demo-001',
        path: '.traceops/snapshots/snapshot-demo.store.json.gz',
        reason: 'demo_snapshot',
        createdBy: 'traceops-demo',
        createdAt: now,
        storeBytes: 48291,
        compressedBytes: 8192,
        sha256: 'demo-snapshot-sha',
        tableCounts,
      },
      health: storageHealth,
    };
  }
  if (path.includes('/datasets')) return datasetVersion;
  return { ok: true, demo: true, updatedAt: now };
}

export async function demoApiResponse<T>(url: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? 'GET').toUpperCase();
  const [path] = url.split('?');

  if (method !== 'GET') return genericMutationResult(path) as T;

  if (path === '/api/sources/kodax/status') return sourceStatus as T;
  if (path === '/api/ingest/jobs') return [job] as T;
  if (path === '/api/ingest/quality') return qualityQueue as T;
  if (path === '/api/ingest/quality/policy') return emptyPolicy() as T;
  if (path === '/api/ingest/quality/policy/runs') {
    return {
      runs: [],
      summary: {
        totalRuns: 0,
        manualRuns: 0,
        automaticRuns: 0,
        skippedRuns: 0,
        affectedDiagnostics: 0,
        affectedIssues: 0,
      },
    } as T;
  }
  if (path === '/api/tasks') return taskList as T;
  if (path === '/api/platform/architecture') return demoPlatformArchitecture as T;
  if (path === '/api/platform/releases') return { currentVersion: '0.1.0', releases: demoProductReleases } as T;
  if (path.startsWith('/api/platform/releases/')) {
    return demoProductReleases.find((release) => release.version === path.split('/')[4]) as T;
  }
  if (path.startsWith('/api/platform/areas/') && path.endsWith('/overview')) {
    const areaId = path.split('/')[4];
    return { generatedAt: now, area: demoPlatformArchitecture.areas.find((area) => area.id === areaId) } as T;
  }
  if (path === '/api/harness-snapshots') return [demoHarnessCandidate, demoHarnessBaseline] as T;
  if (path.startsWith('/api/harness-snapshots/') && path.endsWith('/diff')) {
    return {
      baseline: demoHarnessBaseline,
      candidate: demoHarnessCandidate,
      changedComponents: ['promptHash', 'contextPolicyHash', 'skillManifestHash', 'verifierHash'],
      unchangedComponents: [],
      changeSummary: demoHarnessCandidate.changeSummary,
    } as T;
  }
  if (path.startsWith('/api/harness-snapshots/')) {
    return (path.endsWith(demoHarnessBaseline.id) ? demoHarnessBaseline : demoHarnessCandidate) as T;
  }
  if (path === '/api/agent-eval/issues') return [demoAgentIssue] as T;
  if (path.startsWith('/api/agent-eval/issues/')) return demoAgentIssue as T;
  if (path === '/api/agent-eval/benchmark-cases') return [demoBenchmarkCase] as T;
  if (path === '/api/agent-eval/benchmark-suites') return [demoBenchmarkSuite] as T;
  if (path.startsWith('/api/agent-eval/benchmark-suites/')) {
    return { suite: demoBenchmarkSuite, cases: [demoBenchmarkCase] } as T;
  }
  if (path === '/api/agent-eval/experiments') return [demoAgentExperiment] as T;
  if (path === '/api/agent-eval/reports') return [demoAgentReport] as T;
  if (path.startsWith('/api/agent-eval/experiments/') && path.endsWith('/report')) {
    return demoAgentReport as T;
  }
  if (path.startsWith('/api/agent-eval/experiments/')) {
    return { experiment: demoAgentExperiment, rollouts: [], report: demoAgentReport } as T;
  }
  if (path === '/api/tasks/automation-plan') {
    return {
      generatedAt: now,
      nodes: [],
      edges: [],
      alerts: [],
      summary: { nodes: 0, edges: 0, approvalRequired: 0, blocked: 0 },
    } as T;
  }
  if (path === '/api/exports') {
    return [
      {
        id: 'export-demo-001',
        status: 'active',
        source: 'dataset_version',
        format: 'fine_tune_jsonl',
        filename: 'traceops-demo-sft.jsonl',
        filters: datasetVersion.filters,
        sampleIds: datasetVersion.sampleIds,
        traceIds: [traceId],
        datasetVersionId: datasetId,
        datasetVersionName: datasetVersion.name,
        snapshotHash: datasetVersion.snapshotHash,
        exported: 2,
        skipped: 0,
        totals: { candidate: 2, needs_review: 0, blocked: 0 },
        riskSummary,
        generatedAt: now,
        generatedBy: 'traceops-demo',
      },
    ] as T;
  }
  if (path === '/api/release-manifests') return [manifest] as T;
  if (path === '/api/release-promotions') return [promotion] as T;
  if (path.startsWith('/api/release-promotions/') && path.endsWith('/package')) {
    return {
      id: 'package-demo-001',
      packageVersion: 'traceops-release-package-v1',
      promotionId: promotion.id,
      manifestId: manifest.id,
      datasetVersionId: datasetId,
      datasetVersionName: datasetVersion.name,
      packageHash: 'demo-package-hash',
      manifestHash: manifest.manifestHash,
      snapshotHash: datasetVersion.snapshotHash,
      promotion,
      manifest,
      exportUrls: manifest.exportUrls,
      approvals: { releaseGate: manifest.releaseGate, promotion },
      trainingEntry: {
        defaultFormat: 'fine_tune_jsonl',
        defaultExportUrl: demoExportUrl('fine_tune_jsonl'),
        traceopsExportUrl: demoExportUrl('traceops_jsonl'),
        reviewExportUrl: demoExportUrl('review_jsonl'),
        packageUrl: demoExportUrl('traceops_jsonl'),
      },
      summaries: {
        samples: 2,
        traces: 1,
        risk: riskSummary,
        review: manifest.reviewSummary,
        quality: manifest.qualitySummary,
        evidence: manifest.evidenceSummary,
        kind: { sft: 2 },
        project: { 'kodax-product-matrix': 2 },
      },
      generatedAt: now,
      generatedBy: 'traceops-demo',
    } as T;
  }
  if (path === '/api/retraining-handoffs') return [] as T;
  if (path === '/api/closed-loop-retraining-plans') return [] as T;
  if (path === '/api/training-launch-plans') return [] as T;
  if (path === '/api/training-runs') return [] as T;
  if (path === '/api/eval-runs') return [] as T;
  if (path === '/api/model-release-gates') return [] as T;
  if (path === '/api/deployment-handoffs') return [] as T;
  if (path === '/api/post-release-monitors') return [] as T;
  if (path === '/api/feedback-loops') return [] as T;
  if (path === '/api/datasets') return [datasetVersion] as T;
  if (path.startsWith('/api/datasets/') && path.endsWith('/samples')) return samples.slice(0, 2) as T;
  if (path.startsWith('/api/datasets/') && path.endsWith('/diff')) {
    return {
      id: 'diff-demo-001',
      datasetVersionId: datasetId,
      baseVersionId: undefined,
      generatedAt: now,
      summary: { added: 2, removed: 0, unchanged: 0, changed: 0, qualityDelta: 0 },
      signals: [],
      changes: [],
    } as T;
  }
  if (path.startsWith('/api/datasets/') && path.endsWith('/diff-review-plan')) {
    return {
      datasetVersionId: datasetId,
      generatedAt: now,
      checks: [],
      signals: [],
      recommendation: 'approve',
      releaseBlocked: false,
    } as T;
  }
  if (path === '/api/raw-traces/projects') return ['kodax-product-matrix'] as T;
  if (path === '/api/raw-traces') {
    return {
      traces: [demoTrace],
      totals: { total: 1, imported: 1, updated: 0, failed: 0, highRisk: 0 },
    } as T;
  }
  if (path.startsWith('/api/raw-traces/')) {
    return {
      trace: demoTrace,
      events,
      evidence,
      revisions: [
        {
          id: revisionId,
          traceId,
          sourceHash: demoTrace.latestSourceHash,
          sourceMessageCount: demoTrace.counts.messages,
          sourceLineageEntryCount: demoTrace.counts.lineageEntries,
          sourceArtifactCount: demoTrace.counts.artifactLedgerEntries,
          importedAt: now,
        },
      ],
      errors: [],
      trainingSamples: samples,
      memoryCandidates: [],
    } as T;
  }
  if (path === '/api/training-samples') {
    return {
      samples,
      totals: {
        total: 3,
        candidate: 2,
        needsReview: 1,
        blocked: 0,
        highRisk: 0,
        averageQuality: 85,
      },
    } as T;
  }
  if (path === '/api/clean-traces') {
    return {
      cleanTraces,
      totals: {
        total: 1,
        ready: 1,
        needsReview: 0,
        blocked: 0,
        highRisk: 0,
        averageQuality: 94,
      },
    } as T;
  }
  if (path === '/api/memory-candidates') {
    return {
      candidates: [],
      totals: {
        total: 0,
        candidate: 0,
        needsReview: 0,
        promoted: 0,
        rejected: 0,
        blocked: 0,
        highRisk: 0,
        averageConfidence: 0,
      },
    } as T;
  }
  if (path === '/api/governance/policy') {
    return {
      roles: [
        { role: 'local_admin', label: 'Local Admin', permissions: ['*'] },
        { role: 'data_governance', label: 'Data Governance', permissions: ['review', 'approve', 'export'] },
      ],
      highImpactActions: ['dataset_export', 'release_promotion', 'storage_restore'],
      defaultRole: 'local_admin',
      auditRetentionLimit: 200,
    } as T;
  }
  if (path === '/api/governance/audit-log') {
    return [
      {
        id: 'audit-demo-001',
        action: 'dataset_export',
        decision: 'allowed',
        actor: { id: 'traceops-demo', role: 'local_admin', displayName: 'TraceOps Demo' },
        entityRefs: [{ kind: 'dataset_version', id: datasetId, label: datasetVersion.name }],
        reason: 'Demo export link generated.',
        occurredAt: now,
      },
    ] as T;
  }
  if (path === '/api/storage/health') return storageHealth as T;
  if (path === '/api/storage/segments') return segmentStatus as T;
  if (path === '/api/storage/snapshots') return [] as T;
  if (path === '/api/kodax/feedback-report') return feedbackReport as T;
  if (path === '/api/kodax/feedback-package') {
    return {
      id: 'kodax-feedback-package-demo-001',
      generatedAt: now,
      packageVersion: 'traceops-kodax-feedback-package-v1',
      report: feedbackReport,
      kodaxInbox: {
        tracingGaps: feedbackReport.actionItems,
        skillCandidates: [],
        memoryPromotions: [],
        evalBacklog: [],
        connectorOrTooling: [],
      },
      packageHash: 'demo-feedback-package-hash',
    } as T;
  }
  if (path === '/api/kodax/feedback-writebacks') return [] as T;

  return [] as T;
}
