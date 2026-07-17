import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  BookOpenCheck,
  Braces,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock3,
  Database,
  Download,
  FileSearch,
  Filter,
  GitBranch,
  HardDrive,
  History,
  Loader2,
  Play,
  RefreshCw,
  Search,
  Server,
  ShieldAlert,
  TerminalSquare,
  UploadCloud,
  Workflow,
  Wrench,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import {
  applyDatasetVersionDiffReviewPlan,
  approveClosedLoopDeploymentHandoff,
  applyIngestQualityPolicy,
  backfillSegmentStore,
  buildClosedLoopNextDataset,
  createTasks,
  createReleaseManifest,
  createDatasetVersion,
  createAgentBenchmarkCaseFromTrace,
  createAgentBenchmarkSuite,
  createAgentEvaluationExperiment,
  createAgentEvaluationIssue,
  createHarnessSnapshot,
  createDeploymentHandoff,
  createFeedbackDatasetVersion,
  createFeedbackLoop,
  createStorageSnapshot,
  createRetrainingHandoffFromManifest,
  createModelReleaseGate,
  createPostReleaseMonitor,
  createRetrainingHandoff,
  createTrainingRun,
  decideIngestQualityRecommendations,
  datasetVersionExportUrl,
  deploymentHandoffDownloadUrl,
  dryRunIngestQualityPolicy,
  evalRunDownloadUrl,
  feedbackLoopDownloadUrl,
  getDatasetVersionDiff,
  getDatasetVersionDiffReviewPlan,
  getIngestQualityQueue,
  getIngestQualityPolicy,
  getGovernancePolicy,
  getKodaXFeedbackPackage,
  getKodaXFeedbackReport,
  getPlatformArchitecture,
  getSegmentStoreStatus,
  getSourceStatus,
  getStorageHealth,
  getTaskAutomationPlan,
  getTrace,
  installDefaultIngestQualityPolicyRules,
  kodaxFeedbackPackageDownloadUrl,
  listGovernanceAuditLog,
  listIngestQualityPolicyRuns,
  listCleanTraces,
  listClosedLoopRetrainingPlans,
  listDatasetVersionSamples,
  listDatasetVersions,
  listDeploymentHandoffs,
  listEvalRuns,
  listExportRuns,
  listFeedbackLoops,
  listJobs,
  listAgentBenchmarkCases,
  listAgentBenchmarkSuites,
  listAgentEvaluationExperiments,
  listAgentEvaluationIssues,
  listAgentEvaluationReports,
  listHarnessSnapshots,
  listKodaXFeedbackWritebacks,
  listMemoryCandidates,
  listModelReleaseGates,
  listPostReleaseMonitors,
  listProjects,
  listReleaseManifests,
  listReleasePromotions,
  listRetrainingHandoffs,
  listStorageSnapshots,
  listTasks,
  listTrainingLaunchPlans,
  listTrainingRuns,
  listTraces,
  listTrainingSamples,
  listTrainingSampleEvidenceCandidates,
  repairTrainingSample,
  recordDatasetReleaseGateAction,
  recordDatasetVersionDiffReview,
  recordFeedbackLoopDecision,
  recordModelReleaseGateDecision,
  recordPostReleaseSignal,
  recordTrainingProviderStatus,
  restoreStorageSnapshot,
  restoreIngestQualityRecommendation,
  recordTrainingRunResult,
  recordAgentEvaluationRollout,
  resolveFixedKodaXIngestDiagnostics,
  releaseManifestDownloadUrl,
  releasePackageDownloadUrl,
  postReleaseMonitorDownloadUrl,
  prepareClosedLoopDeploymentHandoff,
  prepareClosedLoopModelReleaseGate,
  prepareClosedLoopRetrainingHandoff,
  retrainingHandoffDownloadUrl,
  promoteReleaseManifest,
  reviewMemoryCandidate,
  reviewTrainingSample,
  reviewTrainingSamples,
  rebuildSegmentStore,
  retryTask,
  orchestrateTasks,
  runQueuedTasks,
  runClosedLoopCandidateCycle,
  runClosedLoopRollout,
  revokeExportRun,
  runTrainingEval,
  startAgentEvaluationExperiment,
  completeAgentEvaluationExperiment,
  setKodaXWatch,
  setQualityPolicyAutoApply,
  syncKodaX,
  syncTrainingProviderStatus,
  triageIngestDiagnostic,
  triageIngestQualityIssue,
  upsertIngestQualityPolicyRule,
  trainingSampleExportUrl,
  updateDeploymentHandoffStatus,
  writebackKodaXFeedbackPackage,
  writeClosedLoopFeedbackSignal,
} from './api';
import type {
  AgentBenchmarkCase,
  AgentBenchmarkSuite,
  AgentEvaluationComparisonReport,
  AgentEvaluationExperiment,
  AgentEvaluationIssue,
  CleanTrace,
  CleanTraceListResponse,
  DatasetClosedLoopFeedbackSignalMode,
  DatasetClosedLoopRetrainingPlan,
  DatasetDeploymentHandoffRecord,
  DatasetDeploymentHandoffStatus,
  DatasetEvalRunRecord,
  DatasetFeedbackLoopDecision,
  DatasetFeedbackLoopRecord,
  DatasetModelReleaseGateDecision,
  DatasetModelReleaseGateRecord,
  DatasetPostReleaseMonitorRecord,
  DatasetPostReleaseMonitorStatus,
  DatasetExportFormat,
  DatasetExportRun,
  DatasetReleaseGateActionDecision,
  DatasetReleaseManifest,
  DatasetReleasePromotionRecord,
  DatasetRetrainingHandoffRecord,
  DatasetTrainingLaunchPlan,
  DatasetTrainingProviderStatus,
  DatasetTrainingRunRecord,
  DatasetVersion,
  DatasetVersionDiff,
  DatasetVersionDiffReviewPlan,
  DatasetVersionDiffReviewDecision,
  GovernanceAuditRecord,
  GovernancePolicyResponse,
  HarnessSnapshot,
  IngestDiagnosticTriageDecision,
  IngestJob,
  IngestQualityIssue,
  IngestQualityPolicyAction,
  IngestQualityPolicyDryRunResponse,
  IngestQualityPolicyRecommendation,
  IngestQualityPolicyResponse,
  IngestQualityPolicyRunListResponse,
  IngestQualityPolicyRule,
  IngestQualityPolicySeverity,
  IngestQualityQueueResponse,
  KodaXFeedbackPackage,
  KodaXFeedbackReport,
  KodaXFeedbackWritebackRecord,
  MemoryCandidate,
  MemoryCandidateListResponse,
  RawEvidence,
  RawTrace,
  RawTraceEvent,
  SourceStatus,
  StorePersistenceHealth,
  TraceOpsSegmentBackfillResult,
  TraceOpsSegmentStoreStatus,
  TraceOpsPlatformArchitecture,
  TraceOpsProductAreaId,
  TraceOpsProductRelease,
  TraceOpsReleaseStatus,
  StoreSnapshotRecord,
  TraceOpsTaskAutomationPlan,
  TraceOpsTaskCreateInput,
  TraceOpsTaskListResponse,
  TraceOpsTaskRecord,
  TraceOpsTaskKind,
  TraceDetail,
  TraceListResponse,
  TrainingSample,
  TrainingSampleEvidenceCandidate,
  TrainingSampleListResponse,
} from '../../../packages/trace-core/src/types';
import { evaluateDatasetReleaseGate } from '../../../packages/trace-core/src/releaseGate';

type DetailTab = 'timeline' | 'tools' | 'evidence' | 'dataset' | 'runtime' | 'diagnostics';

interface Filters {
  query: string;
  projectKey: string;
  ingestionStatus: string;
  riskLevel: string;
  scope: string;
  hasEvidence: boolean;
  hasError: boolean;
}

interface ReviewQueueFilters {
  kind: string;
  status: string;
  qualityGrade: string;
  riskLevel: string;
  missingEvidence: boolean;
  redacted: boolean;
  readyOnly: boolean;
}

const defaultFilters: Filters = {
  query: '',
  projectKey: '',
  ingestionStatus: '',
  riskLevel: '',
  scope: '',
  hasEvidence: false,
  hasError: false,
};

const defaultReviewQueueFilters: ReviewQueueFilters = {
  kind: '',
  status: 'needs_review',
  qualityGrade: '',
  riskLevel: '',
  missingEvidence: false,
  redacted: false,
  readyOnly: false,
};

const datasetBuilderKinds = [
  { kind: 'sft', label: 'SFT', copy: 'goal -> response' },
  { kind: 'tool_use', label: 'Tool-use', copy: 'tool call chain' },
  { kind: 'planning', label: 'Planning', copy: 'goal -> plan' },
  { kind: 'repair', label: 'Repair', copy: 'failure -> fix' },
  { kind: 'preference', label: 'Preference', copy: 'branch choice' },
  { kind: 'eval', label: 'Eval', copy: 'task rubric' },
] as const;

type DatasetBuilderKind = (typeof datasetBuilderKinds)[number]['kind'];
const traceFoundationDatasetKinds: DatasetBuilderKind[] = ['eval', 'repair', 'tool_use', 'planning'];
type ReviewQueueFocus = { kind: string; status?: string; requestedAt: number };
type CommandCenterStatus = 'ready' | 'attention' | 'blocked';
type PipelineNodeStatus = 'ready' | 'attention' | 'blocked' | 'idle';
type GovernanceActionSeverity = 'block' | 'warn' | 'ready';
type TaskEntityRef = TraceOpsTaskRecord['entityRefs'][number];
type FocusedTaskEntity = TaskEntityRef & { requestedAt: number };
type CommandPaletteKind = TaskEntityRef['kind'] | 'task';

interface CommandPaletteItem {
  id: string;
  kind: CommandPaletteKind;
  title: string;
  subtitle: string;
  status?: string;
  updatedAt?: string;
  entity?: TaskEntityRef;
  taskId?: string;
  searchText: string;
}

interface EntityInspectorMetric {
  label: string;
  value: string | number;
  tone?: 'good' | 'warn' | 'danger';
}

interface EntityInspectorState {
  item: CommandPaletteItem;
  metrics: EntityInspectorMetric[];
  lineage: TaskEntityRef[];
  relatedTasks: TraceOpsTaskRecord[];
}

type LineageMapStageId = 'capture' | 'dataset' | 'release' | 'training' | 'rollout' | 'feedback';
type LineageMapNodeTone = 'good' | 'warn' | 'danger' | 'neutral';
type LineageMapFilterMode = 'all' | 'path' | 'attention' | 'task_linked';
type PipelineStageId =
  | 'stage-ingest'
  | 'stage-raw'
  | 'stage-governance'
  | 'stage-dataset'
  | 'stage-evaluation'
  | 'stage-model-evaluation'
  | 'stage-training'
  | 'stage-release'
  | 'stage-feedback'
  | 'stage-system';
type WorkspaceAreaId = TraceOpsProductAreaId | 'platform';

interface PipelineStageMeta {
  id: PipelineStageId;
  areaId: WorkspaceAreaId;
  index: string;
  title: string;
  detail: string;
}

const pipelineStageMeta: PipelineStageMeta[] = [
  {
    id: 'stage-ingest',
    areaId: 'data_access',
    index: 'D1',
    title: 'Session 接入',
    detail: '从本机 KodaX sessions 拉取完整运行记录，并把同步异常交给质量治理处理。',
  },
  {
    id: 'stage-raw',
    areaId: 'data_access',
    index: 'D2',
    title: 'Trace 与 Evidence',
    detail: '把 session 还原成 Raw Trace、事件时间线、实体关系和 evidence 链路。',
  },
  {
    id: 'stage-governance',
    areaId: 'data_access',
    index: 'D3',
    title: 'Trace 预处理与治理',
    detail: '把 Raw Trace 清洗成评测候选，并完成风险、证据、脱敏、Review 与 Repair 治理。',
  },
  {
    id: 'stage-dataset',
    areaId: 'data_access',
    index: 'D4',
    title: '评测数据集版本',
    detail: '把通过治理的 Trace 候选固化为 evaluation dataset version，并审查版本差异、质量和 Lineage。',
  },
  {
    id: 'stage-evaluation',
    areaId: 'evaluation',
    index: 'E1',
    title: 'Agent / Harness 评测',
    detail: '固定 Model 与 Runtime，对比工程师提交的 H0/H1 Harness 是否真正改善目标能力。',
  },
  {
    id: 'stage-model-evaluation',
    areaId: 'evaluation',
    index: 'E2',
    title: '模型评测',
    detail: '固定 Harness 与 Benchmark，对比后训练前后的 Model Snapshot，并验证 Model × Harness 组合。',
  },
  {
    id: 'stage-training',
    areaId: 'model_training',
    index: 'T1',
    title: '模型后训练',
    detail: '从已治理数据集创建训练交接、启动 Provider 训练并跟踪模型产物。',
  },
  {
    id: 'stage-release',
    areaId: 'model_training',
    index: 'T2',
    title: '模型发布',
    detail: '将模型评测结论转化为 Release Gate、Deployment Handoff 和可回滚发布。',
  },
  {
    id: 'stage-feedback',
    areaId: 'model_training',
    index: 'T3',
    title: '上线反馈闭环',
    detail: '把训练、评测、部署和上线监控信号回流成下一轮数据集。',
  },
  {
    id: 'stage-system',
    areaId: 'platform',
    index: 'P1',
    title: '平台治理',
    detail: '集中查看审计、存储健康、KodaX 反哺包和自动任务编排。',
  },
];

function getPipelineStageMeta(id?: string): PipelineStageMeta | undefined {
  return pipelineStageMeta.find((stage) => stage.id === id);
}

function getPipelineStageFromHash(hash = typeof window === 'undefined' ? '' : window.location.hash): PipelineStageId | undefined {
  const rawId = hash.replace(/^#\/?/, '');
  const id = rawId === 'stage-delivery' ? 'stage-training' : rawId;
  return getPipelineStageMeta(id)?.id;
}

function stagesForArea(areaId: WorkspaceAreaId): PipelineStageMeta[] {
  return pipelineStageMeta.filter((stage) => stage.areaId === areaId);
}

function defaultStageForArea(areaId: TraceOpsProductAreaId): PipelineStageId {
  return stagesForArea(areaId)[0]?.id ?? 'stage-ingest';
}
type LineageAuditVerdict = 'ready' | 'needs_review' | 'blocked';
type LineageAuditCapability = 'ready' | 'review' | 'blocked';
type LineageAuditCheckStatus = 'passed' | 'warning' | 'failed';
type LineageAuditActionPriority = 'critical' | 'high' | 'normal';
type LineageAuditActionStatus = 'todo' | 'doing' | 'done';

interface LineageMapStage {
  id: LineageMapStageId;
  label: string;
  copy: string;
}

interface LineageMapNode {
  key: string;
  kind: TaskEntityRef['kind'];
  id: string;
  title: string;
  meta: string;
  status?: string;
  updatedAt?: string;
  stage: LineageMapStageId;
  tone: LineageMapNodeTone;
  entity: TaskEntityRef;
}

interface LineageMapEdge {
  from: string;
  to: string;
  label: string;
  tone?: LineageMapNodeTone;
}

interface LineageMapInsight {
  label: string;
  detail: string;
  tone: LineageMapNodeTone;
}

interface LineageMapState {
  nodes: LineageMapNode[];
  edges: LineageMapEdge[];
  activeKeys: Set<string>;
  connectedKeys: Set<string>;
  upstreamNodes: LineageMapNode[];
  downstreamNodes: LineageMapNode[];
  relatedTasks: TraceOpsTaskRecord[];
  tasks: TraceOpsTaskRecord[];
  insights: LineageMapInsight[];
}

interface LineageMapFilters {
  query: string;
  stage: LineageMapStageId | 'all';
  mode: LineageMapFilterMode;
  lockedKey?: string;
}

interface LineageAuditCheck {
  id: string;
  label: string;
  detail: string;
  status: LineageAuditCheckStatus;
}

interface LineageAuditAction {
  id: string;
  checkId: string;
  taskKind: TraceOpsTaskKind;
  title: string;
  detail: string;
  priority: LineageAuditActionPriority;
  owner: string;
  targetStage: LineageMapStageId;
}

interface LineageAuditResult {
  id: string;
  subject: string;
  generatedAt: string;
  verdict: LineageAuditVerdict;
  summary: string;
  capabilities: {
    train: LineageAuditCapability;
    release: LineageAuditCapability;
    rollback: LineageAuditCapability;
  };
  checks: LineageAuditCheck[];
  recommendations: string[];
  actions: LineageAuditAction[];
}

const lineageMapStages: LineageMapStage[] = [
  { id: 'capture', label: 'KodaX Capture', copy: 'session and sync source' },
  { id: 'dataset', label: 'Dataset', copy: 'cleaned trainable versions' },
  { id: 'release', label: 'Release Package', copy: 'manifest, promotion, handoff' },
  { id: 'training', label: 'Training & Eval', copy: 'run, eval, model gate' },
  { id: 'rollout', label: 'Rollout', copy: 'deployment and monitor' },
  { id: 'feedback', label: 'Feedback', copy: 'signals back to datasets' },
];

function sampleKindLabel(kind: string): string {
  return datasetBuilderKinds.find((item) => item.kind === kind)?.label ?? kind;
}

function defaultDatasetFormatForKind(kind: string): DatasetExportFormat {
  if (kind === 'sft') return 'fine_tune_jsonl';
  if (kind === 'eval') return 'eval_jsonl';
  return 'review_jsonl';
}

function datasetFormatLabel(format: DatasetExportFormat): string {
  switch (format) {
    case 'fine_tune_jsonl':
      return 'Fine-tune';
    case 'eval_jsonl':
      return 'Eval';
    case 'review_jsonl':
      return 'Review';
    case 'traceops_jsonl':
      return 'TraceOps';
    case 'repair_jsonl':
      return 'Repair';
    default:
      return format;
  }
}

function datasetSourceLabel(version: DatasetVersion): string {
  if (version.source === 'feedback_loop') {
    return `feedback_loop · ${version.feedbackLoopSummary?.total ?? version.sampleCount} loops`;
  }
  return 'kodax_candidate_pool';
}

function feedbackLoopSummaryText(version: DatasetVersion): string {
  const summary = version.feedbackLoopSummary;
  if (!summary) return '';
  const targets = Object.entries(summary.targetKind).map(([key, count]) => `${key}:${count}`).join(' · ');
  const severity = Object.entries(summary.severity).map(([key, count]) => `${key}:${count}`).join(' · ');
  return `${targets || 'mixed'} · ${severity || 'no severity'} · ${summary.rollbackSignals} rollback`;
}

function exportRunStatusClass(status?: string): string {
  return status === 'revoked' ? 'export-status export-status-revoked' : 'export-status export-status-active';
}

function memoryKindLabel(kind: string): string {
  switch (kind) {
    case 'workflow_pattern':
      return 'Workflow';
    case 'project_knowledge':
      return 'Project';
    case 'failure_recovery':
      return 'Recovery';
    case 'tool_practice':
      return 'Tool practice';
    case 'decision_record':
      return 'Decision';
    default:
      return kind;
  }
}

function memoryStatusClass(status: string): string {
  if (status === 'promoted') return 'memory-status memory-status-promoted';
  if (status === 'rejected') return 'memory-status memory-status-rejected';
  if (status === 'blocked') return 'memory-status memory-status-blocked';
  if (status === 'candidate') return 'memory-status memory-status-candidate';
  return 'memory-status memory-status-review';
}

function countSamplesBy(samples: TrainingSample[], read: (sample: TrainingSample) => string): Array<{ key: string; count: number }> {
  const counts = new Map<string, number>();
  for (const sample of samples) {
    const key = read(sample) || 'unknown';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

function percent(count: number, total: number): string {
  if (total === 0) return '0%';
  return `${Math.round((count / total) * 100)}%`;
}

function averageSampleQuality(samples: TrainingSample[]): number {
  if (samples.length === 0) return 0;
  return Math.round(samples.reduce((sum, sample) => sum + sample.quality.score, 0) / samples.length);
}

function commandCenterStatusLabel(status: CommandCenterStatus): string {
  if (status === 'ready') return 'Ready';
  if (status === 'blocked') return 'Blocked';
  return 'Needs attention';
}

function commandCenterStatusClass(status: CommandCenterStatus): string {
  return `command-status command-status-${status}`;
}

function governanceActionLabel(severity: GovernanceActionSeverity): string {
  if (severity === 'block') return 'Blocking';
  if (severity === 'warn') return 'Action';
  return 'Ready';
}

function governanceActionClass(severity: GovernanceActionSeverity): string {
  return `action-severity action-severity-${severity}`;
}

function governanceActionRank(severity: GovernanceActionSeverity): number {
  if (severity === 'block') return 0;
  if (severity === 'warn') return 1;
  return 2;
}

type ReleaseGateStatus = 'ready' | 'review' | 'blocked';
type ReleaseGateSeverity = 'pass' | 'warn' | 'block';

interface ReleaseGateCheck {
  id: string;
  label: string;
  detail: string;
  metric: string;
  severity: ReleaseGateSeverity;
}

function releaseGateStatusLabel(status: ReleaseGateStatus): string {
  if (status === 'ready') return 'Ready';
  if (status === 'blocked') return 'Blocked';
  return 'Needs review';
}

function releaseManifestStatusLabel(status: DatasetReleaseManifest['status']): string {
  if (status === 'ready') return 'Ready';
  if (status === 'blocked') return 'Blocked';
  return 'Review';
}

function releaseManifestStatusClass(status: DatasetReleaseManifest['status']): string {
  return `release-manifest-status release-manifest-status-${status}`;
}

function releaseManifestPackageLabel(manifest?: DatasetReleaseManifest): string {
  if (!manifest) return 'Not packaged';
  if (manifest.promotionStatus === 'promoted') return 'Release';
  if (manifest.status === 'ready') return 'Release-ready';
  return 'Audit only';
}

function releasePromotionStatusLabel(status?: DatasetReleaseManifest['promotionStatus']): string {
  if (status === 'promoted') return 'Promoted';
  if (status === 'revoked') return 'Revoked';
  return 'Not promoted';
}

function releasePromotionStatusClass(status?: DatasetReleaseManifest['promotionStatus']): string {
  return `release-promotion-status release-promotion-status-${status ?? 'not_promoted'}`;
}

function trainingRunStatusLabel(status: DatasetTrainingRunRecord['status']): string {
  if (status === 'passed') return 'Passed';
  if (status === 'failed') return 'Failed';
  if (status === 'rolled_back') return 'Rolled back';
  if (status === 'cancelled') return 'Cancelled';
  if (status === 'running') return 'Running';
  if (status === 'evaluating') return 'Evaluating';
  return 'Planned';
}

function trainingRunStatusClass(status: DatasetTrainingRunRecord['status']): string {
  return `training-run-status training-run-status-${status}`;
}

function normalizeProviderStatusInput(value: string | null): DatasetTrainingProviderStatus | undefined {
  const normalized = value?.trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (!normalized) return undefined;
  if (normalized === 'queued' || normalized === 'pending') return 'queued';
  if (normalized === 'running' || normalized === 'in_progress' || normalized === 'training') return 'running';
  if (normalized === 'succeeded' || normalized === 'success' || normalized === 'completed' || normalized === 'complete' || normalized === 'passed' || normalized === 'done') return 'succeeded';
  if (normalized === 'failed' || normalized === 'failure' || normalized === 'error') return 'failed';
  if (normalized === 'cancelled' || normalized === 'canceled' || normalized === 'aborted') return 'cancelled';
  if (normalized === 'unknown') return 'unknown';
  return undefined;
}

function trainingRunMetricLabel(metric: DatasetTrainingRunRecord['metrics'][number]): string {
  if (metric.unit === 'percent') return `${Math.round(metric.value * 100)}%`;
  if (metric.unit === 'score') return metric.value ? metric.value.toFixed(2) : '-';
  return String(metric.value);
}

function evalRunStatusLabel(status: DatasetEvalRunRecord['status']): string {
  return status === 'passed' ? 'Passed' : 'Failed';
}

function evalRunStatusClass(status: DatasetEvalRunRecord['status']): string {
  return `eval-run-status eval-run-status-${status}`;
}

function trainingLaunchObjectiveLabel(objective?: DatasetTrainingLaunchPlan['objective']): string {
  if (objective === 'sft') return 'SFT';
  if (objective === 'eval') return 'Eval';
  if (objective === 'repair') return 'Repair';
  if (objective === 'mixed') return 'Mixed';
  return 'Plan';
}

function trainingLaunchReadinessLabel(readiness?: DatasetTrainingLaunchPlan['readiness']): string {
  if (readiness === 'ready') return 'Ready';
  if (readiness === 'blocked') return 'Blocked';
  if (readiness === 'review') return 'Review';
  return 'No plan';
}

function trainingLaunchReadinessClass(readiness?: DatasetTrainingLaunchPlan['readiness']): string {
  return `training-launch-readiness training-launch-readiness-${readiness ?? 'missing'}`;
}

function trainingLaunchCheckClass(status: DatasetTrainingLaunchPlan['checks'][number]['status']): string {
  return `training-launch-check training-launch-check-${status}`;
}

function modelReleaseGateStatusLabel(status: DatasetModelReleaseGateRecord['status']): string {
  if (status === 'approved') return 'Approved';
  if (status === 'rejected') return 'Rejected';
  if (status === 'blocked') return 'Blocked';
  return 'Ready';
}

function modelReleaseGateStatusClass(status: DatasetModelReleaseGateRecord['status']): string {
  return `model-release-gate-status model-release-gate-status-${status}`;
}

function modelReleaseGateDecisionLabel(decision: DatasetModelReleaseGateDecision): string {
  if (decision === 'approved') return 'Approve model release';
  if (decision === 'rejected') return 'Reject model release';
  return 'Reopen model release gate';
}

function modelReleaseGateDefaultNote(decision: DatasetModelReleaseGateDecision): string {
  if (decision === 'approved') return 'Model release gate approved for deployment handoff.';
  if (decision === 'rejected') return 'Model release is rejected until retraining or evaluation is repaired.';
  return 'Model release gate reopened for another review pass.';
}

function deploymentHandoffStatusLabel(status: DatasetDeploymentHandoffStatus): string {
  if (status === 'ready_for_rollout') return 'Ready';
  if (status === 'preparing') return 'Preparing';
  if (status === 'live') return 'Live';
  if (status === 'rolled_back') return 'Rolled back';
  if (status === 'cancelled') return 'Cancelled';
  return 'Queued';
}

function deploymentHandoffStatusClass(status: DatasetDeploymentHandoffStatus): string {
  return `deployment-handoff-status deployment-handoff-status-${status}`;
}

function deploymentHandoffDefaultNote(status: DatasetDeploymentHandoffStatus): string {
  if (status === 'preparing') return 'Deployment handoff is preparing artifacts, rollback and monitoring.';
  if (status === 'ready_for_rollout') return 'Deployment handoff is ready for rollout window.';
  if (status === 'live') return 'Production rollout completed and marked live.';
  if (status === 'rolled_back') return 'Deployment was rolled back according to rollback criteria.';
  if (status === 'cancelled') return 'Deployment handoff cancelled before rollout.';
  return 'Deployment handoff queued.';
}

function postReleaseMonitorStatusLabel(status: DatasetPostReleaseMonitorStatus): string {
  if (status === 'healthy') return 'Healthy';
  if (status === 'attention') return 'Attention';
  if (status === 'rollback_required') return 'Rollback';
  if (status === 'closed') return 'Closed';
  return 'Watching';
}

function postReleaseMonitorStatusClass(status: DatasetPostReleaseMonitorStatus): string {
  return `post-release-monitor-status post-release-monitor-status-${status}`;
}

function postReleaseMetricLabel(metric: DatasetPostReleaseMonitorRecord['metrics'][number]): string {
  if (metric.unit === 'percent') return metric.gate === 'pending' ? '-' : `${Math.round(metric.value * 100)}%`;
  if (metric.unit === 'ms') return metric.gate === 'pending' ? '-' : `${Math.round(metric.value)}ms`;
  return metric.gate === 'pending' ? '-' : String(metric.value);
}

function feedbackLoopStatusLabel(status: DatasetFeedbackLoopRecord['status']): string {
  if (status === 'triaged') return 'Triaged';
  if (status === 'promoted') return 'Promoted';
  if (status === 'rejected') return 'Rejected';
  return 'Candidate';
}

function feedbackLoopStatusClass(status: DatasetFeedbackLoopRecord['status']): string {
  return `feedback-loop-status feedback-loop-status-${status}`;
}

function feedbackLoopSeverityLabel(severity: DatasetFeedbackLoopRecord['severity']): string {
  if (severity === 'critical') return 'Critical';
  if (severity === 'warning') return 'Warning';
  return 'Info';
}

function feedbackLoopTargetLabel(kind: DatasetFeedbackLoopRecord['targetKind']): string {
  if (kind === 'sft') return 'SFT';
  if (kind === 'eval') return 'Eval';
  if (kind === 'repair') return 'Repair';
  return 'Memory';
}

function feedbackLoopDecisionLabel(decision: DatasetFeedbackLoopDecision): string {
  if (decision === 'promoted') return 'Promote feedback candidate';
  if (decision === 'rejected') return 'Reject feedback candidate';
  if (decision === 'reopened') return 'Reopen feedback candidate';
  return 'Triage feedback candidate';
}

function feedbackLoopDefaultNote(decision: DatasetFeedbackLoopDecision): string {
  if (decision === 'promoted') return 'Promoted into the next dataset intake queue.';
  if (decision === 'rejected') return 'Rejected from the next dataset loop.';
  if (decision === 'reopened') return 'Reopened for another feedback review pass.';
  return 'Triaged and ready for curator review.';
}

function signedDelta(value: number): string {
  if (value > 0) return `+${value}`;
  return String(value);
}

function datasetDiffMetricClass(value: number, inverse = false): string {
  if (value === 0) return 'dataset-diff-metric';
  const improved = inverse ? value < 0 : value > 0;
  return `dataset-diff-metric ${improved ? 'dataset-diff-metric-good' : 'dataset-diff-metric-warn'}`;
}

function datasetDiffChangeLabel(kind: DatasetVersionDiff['changes'][number]['kind']): string {
  if (kind === 'added') return 'Added';
  if (kind === 'removed') return 'Removed';
  if (kind === 'changed') return 'Changed';
  return 'Same';
}

function datasetDiffChangeClass(kind: DatasetVersionDiff['changes'][number]['kind']): string {
  return `dataset-diff-change dataset-diff-change-${kind}`;
}

function datasetDiffSignalClass(direction: DatasetVersionDiff['changes'][number]['signals'][number]['direction']): string {
  return `dataset-diff-signal dataset-diff-signal-${direction}`;
}

function datasetDiffPointLabel(point?: DatasetVersionDiff['changes'][number]['before']): string {
  if (!point) return '-';
  return `${point.riskLevel} · Q${point.qualityScore} · ${point.evidenceCount}/${point.toolEventCount}`;
}

function datasetDiffReviewStatusLabel(status: DatasetVersionDiff['reviewStatus']): string {
  if (status === 'approved') return 'Approved';
  if (status === 'changes_requested') return 'Changes requested';
  if (status === 'risk_accepted') return 'Risk accepted';
  if (status === 'reopened') return 'Reopened';
  return 'Pending review';
}

function datasetDiffReviewStatusClass(status: DatasetVersionDiff['reviewStatus']): string {
  return `dataset-diff-review-status dataset-diff-review-status-${status}`;
}

function datasetDiffReviewDecisionLabel(decision: DatasetVersionDiffReviewDecision): string {
  if (decision === 'approved') return 'Approve release';
  if (decision === 'changes_requested') return 'Request repair';
  if (decision === 'risk_accepted') return 'Accept risk';
  return 'Reopen';
}

function datasetDiffReviewDefaultNote(decision: DatasetVersionDiffReviewDecision): string {
  if (decision === 'approved') return 'Diff reviewed and approved for release.';
  if (decision === 'changes_requested') return 'Changes require repair before release.';
  if (decision === 'risk_accepted') return 'Known risk accepted for this dataset release.';
  return 'Diff review reopened for another pass.';
}

function diffReviewPlanReadinessLabel(readiness: DatasetVersionDiffReviewPlan['readiness']): string {
  if (readiness === 'already_reviewed') return 'Already reviewed';
  if (readiness === 'accept_with_note') return 'Accept with note';
  if (readiness === 'repair_first') return 'Repair first';
  return 'Ready to approve';
}

function diffReviewPlanClass(readiness: DatasetVersionDiffReviewPlan['readiness']): string {
  return `closed-loop-review-plan closed-loop-review-plan-${readiness}`;
}

function diffReviewPlanSignalClass(tone: DatasetVersionDiffReviewPlan['signals'][number]['tone']): string {
  return `review-plan-signal review-plan-signal-${tone}`;
}

function diffReviewPlanCheckClass(status: DatasetVersionDiffReviewPlan['checks'][number]['status']): string {
  return `review-plan-check review-plan-check-${status}`;
}

function releaseGateClass(status: ReleaseGateStatus): string {
  return `release-gate release-gate-${status}`;
}

function gateSeverityClass(severity: ReleaseGateSeverity): string {
  return `gate-severity gate-severity-${severity}`;
}

function buildDatasetReleaseGate(version: DatasetVersion, samples: TrainingSample[], diff?: DatasetVersionDiff) {
  const matchingDiff = diff?.headVersionId === version.id ? diff : undefined;
  return evaluateDatasetReleaseGate(version, samples, version.releaseGateActions ?? [], {
    hasComparableVersion: Boolean(matchingDiff),
    baseVersionName: matchingDiff?.baseVersionName,
    diffReviewStatus: matchingDiff?.reviewStatus,
    diffReview: matchingDiff?.review,
  });
}

function releaseGateDecisionLabel(decision: DatasetReleaseGateActionDecision): string {
  if (decision === 'resolved') return 'Resolved';
  if (decision === 'waived') return 'Waived';
  if (decision === 'acknowledged') return 'Acknowledged';
  return 'Reopened';
}

function releaseGateDecisionClass(decision?: DatasetReleaseGateActionDecision): string {
  return `gate-action-state gate-action-state-${decision ?? 'none'}`;
}

function closedLoopReadinessLabel(readiness: DatasetClosedLoopRetrainingPlan['readiness']): string {
  if (readiness === 'needs_diff_review') return 'Needs diff review';
  if (readiness === 'needs_manifest') return 'Needs manifest';
  if (readiness === 'needs_handoff') return 'Needs handoff';
  if (readiness === 'needs_training_run') return 'Needs training run';
  if (readiness === 'training_running') return 'Training running';
  if (readiness === 'needs_model_gate') return 'Needs model gate';
  if (readiness === 'needs_model_approval') return 'Needs approval';
  if (readiness === 'model_gate_blocked') return 'Gate blocked';
  if (readiness === 'needs_deployment_handoff') return 'Needs deployment';
  if (readiness === 'deployment_handoff_ready') return 'Deployment ready';
  if (readiness === 'needs_post_release_monitor') return 'Needs monitor';
  if (readiness === 'monitoring_ready') return 'Monitoring';
  if (readiness === 'monitoring_attention') return 'Monitor attention';
  if (readiness === 'monitoring_rollback') return 'Monitor rollback';
  if (readiness === 'needs_feedback_loop') return 'Needs feedback';
  if (readiness === 'feedback_loop_ready') return 'Feedback ready';
  if (readiness === 'next_dataset_ready') return 'Next dataset';
  if (readiness === 'deployment_live') return 'Live';
  return 'Rolled back';
}

function closedLoopReadinessClass(readiness: DatasetClosedLoopRetrainingPlan['readiness']): string {
  return `closed-loop-readiness closed-loop-readiness-${readiness}`;
}

function closedLoopActionLabel(action: DatasetClosedLoopRetrainingPlan['nextAction']): string {
  if (action === 'review_diff') return 'Review diff';
  if (action === 'create_manifest') return 'Create manifest';
  if (action === 'create_handoff') return 'Prepare handoff';
  if (action === 'launch_training') return 'Launch';
  if (action === 'watch_training') return 'Watch';
  if (action === 'create_model_gate') return 'Create Gate';
  if (action === 'review_model_gate') return 'Review Gate';
  if (action === 'create_deployment_handoff') return 'Deploy Handoff';
  if (action === 'review_deployment') return 'Review Deploy';
  if (action === 'run_rollout') return 'Rollout Live';
  if (action === 'create_post_release_monitor') return 'Create Monitor';
  if (action === 'watch_monitor') return 'Watch Monitor';
  if (action === 'write_feedback_signal') return 'Write Signal';
  if (action === 'review_feedback_loop') return 'Review Feedback';
  if (action === 'build_next_dataset') return 'Next Dataset';
  return 'Complete';
}

function releaseGateDefaultNote(decision: DatasetReleaseGateActionDecision): string {
  if (decision === 'resolved') return 'Issue handled and ready for release gate rerun.';
  if (decision === 'waived') return 'Risk accepted for this dataset version.';
  if (decision === 'acknowledged') return 'Warning reviewed and accepted for this release.';
  return 'Gate item reopened for follow-up.';
}

function formatDate(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatBytes(value?: number): string {
  if (!value || value <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let next = value;
  let unitIndex = 0;
  while (next >= 1024 && unitIndex < units.length - 1) {
    next /= 1024;
    unitIndex += 1;
  }
  const display = unitIndex === 0 || next >= 10 ? Math.round(next).toString() : next.toFixed(1);
  return `${display} ${units[unitIndex]}`;
}

function compact(value?: string): string {
  if (!value) return '-';
  return value.length > 28 ? `${value.slice(0, 25)}...` : value;
}

function riskClass(level: string): string {
  return `risk risk-${level.toLowerCase()}`;
}

function statusClass(status: string): string {
  return `status status-${status.replace(/_/g, '-')}`;
}

function sampleStatusClass(status: string): string {
  return `status sample-status-${status.replace(/_/g, '-')}`;
}

function cleanTraceStatusClass(status: string): string {
  return `status clean-status-${status.replace(/_/g, '-')}`;
}

function qualityClass(grade: string): string {
  return `quality quality-${grade}`;
}

function qualityGradeFromScore(score: number): string {
  if (score >= 85) return 'excellent';
  if (score >= 65) return 'good';
  if (score >= 35) return 'review';
  return 'blocked';
}

type RepairIssueKey =
  | 'l4_governance_lock'
  | 'l3_human_signoff'
  | 'credential_signal'
  | 'local_path_signal'
  | 'source_mutation_signal'
  | 'enterprise_data_signal'
  | 'missing_evidence'
  | 'clean_text_not_ready'
  | 'thin_outcome'
  | 'blocked_status'
  | 'quality_blocked';

type RepairLane = 'governance_lock' | 'rewrite_needed' | 'review_ready';

const repairIssueOrder: RepairIssueKey[] = [
  'l4_governance_lock',
  'credential_signal',
  'blocked_status',
  'quality_blocked',
  'l3_human_signoff',
  'source_mutation_signal',
  'enterprise_data_signal',
  'local_path_signal',
  'missing_evidence',
  'clean_text_not_ready',
  'thin_outcome',
];

const repairIssueCopy: Record<RepairIssueKey, { label: string; tone: 'danger' | 'warn' | 'neutral' }> = {
  l4_governance_lock: { label: 'L4 lock', tone: 'danger' },
  l3_human_signoff: { label: 'L3 signoff', tone: 'warn' },
  credential_signal: { label: 'Credential', tone: 'danger' },
  local_path_signal: { label: 'Local path', tone: 'warn' },
  source_mutation_signal: { label: 'Source mutation', tone: 'warn' },
  enterprise_data_signal: { label: 'Enterprise data', tone: 'warn' },
  missing_evidence: { label: 'Missing evidence', tone: 'warn' },
  clean_text_not_ready: { label: 'Clean text', tone: 'neutral' },
  thin_outcome: { label: 'Thin outcome', tone: 'neutral' },
  blocked_status: { label: 'Blocked', tone: 'danger' },
  quality_blocked: { label: 'Quality blocked', tone: 'danger' },
};

function datasetBuilderKindForSample(kind: string): DatasetBuilderKind | undefined {
  return datasetBuilderKinds.find((item) => item.kind === kind)?.kind;
}

function repairIssuesForSample(sample: TrainingSample): RepairIssueKey[] {
  const text = [
    ...sample.blockers,
    ...sample.metadata.riskReasons,
    ...sample.quality.signals.map((signal) => `${signal.label} ${signal.detail}`),
  ].join(' ').toLowerCase();
  const issues = new Set<RepairIssueKey>();
  if (sample.riskLevel === 'L4') issues.add('l4_governance_lock');
  if (sample.riskLevel === 'L3') issues.add('l3_human_signoff');
  if (text.includes('credential') || text.includes('secret')) issues.add('credential_signal');
  if (text.includes('local') || text.includes('path') || text.includes('filesystem')) issues.add('local_path_signal');
  if (text.includes('source') || text.includes('code') || text.includes('file mutation')) issues.add('source_mutation_signal');
  if (text.includes('customer') || text.includes('account') || text.includes('browser') || text.includes('connector')) issues.add('enterprise_data_signal');
  if (sample.toolEventCount > 0 && sample.evidenceCount === 0) issues.add('missing_evidence');
  if (!sample.metadata.distillation.readyForFineTune) issues.add('clean_text_not_ready');
  if (sample.output.cleanAssistantOutcome && sample.output.cleanAssistantOutcome.length < 12) issues.add('thin_outcome');
  if (sample.status === 'blocked') issues.add('blocked_status');
  if (sample.quality.grade === 'blocked') issues.add('quality_blocked');
  return repairIssueOrder.filter((issue) => issues.has(issue));
}

function repairLaneForSample(sample: TrainingSample, issues: RepairIssueKey[]): RepairLane {
  const locked = issues.some((issue) => (
    issue === 'l4_governance_lock'
    || issue === 'credential_signal'
    || issue === 'blocked_status'
    || issue === 'quality_blocked'
  ));
  if (locked) return 'governance_lock';
  const needsRewrite = issues.some((issue) => (
    issue === 'local_path_signal'
    || issue === 'source_mutation_signal'
    || issue === 'enterprise_data_signal'
    || issue === 'missing_evidence'
    || issue === 'clean_text_not_ready'
    || issue === 'thin_outcome'
  ));
  if (needsRewrite) return 'rewrite_needed';
  if (sample.riskLevel === 'L3') return 'governance_lock';
  return 'review_ready';
}

function repairLaneLabel(lane: RepairLane): string {
  if (lane === 'governance_lock') return 'Governance lock';
  if (lane === 'rewrite_needed') return 'Rewrite needed';
  return 'Review ready';
}

function repairLaneClass(lane: RepairLane): string {
  return `repair-lane repair-lane-${lane.replace(/_/g, '-')}`;
}

function repairLaneRank(lane: RepairLane): number {
  if (lane === 'governance_lock') return 0;
  if (lane === 'rewrite_needed') return 1;
  return 2;
}

function repairActionLabels(sample: TrainingSample, issues: RepairIssueKey[]): string[] {
  const actions = new Set<string>();
  if (issues.includes('credential_signal') || issues.includes('l4_governance_lock') || sample.status === 'blocked') {
    actions.add('Quarantine raw trace');
    actions.add('Remove from training pool');
  }
  if (issues.includes('local_path_signal') || issues.includes('source_mutation_signal') || issues.includes('enterprise_data_signal')) {
    actions.add('Replace sensitive detail with summary');
    actions.add('Require governance signoff');
  }
  if (issues.includes('missing_evidence')) actions.add('Relink evidence ledger');
  if (issues.includes('clean_text_not_ready') || issues.includes('thin_outcome')) actions.add('Rewrite clean prompt/outcome');
  if (sample.kind !== 'sft') actions.add('Keep as review/eval asset');
  if (actions.size === 0) actions.add('Manual review');
  return Array.from(actions);
}

function DatasetQualityCommandCenter(props: {
  samples: TrainingSample[];
  cleanTraces: CleanTrace[];
  traceTotals: TraceListResponse['totals'];
  datasetVersions: DatasetVersion[];
  creating: boolean;
  onReviewKind: (kind: DatasetBuilderKind) => void;
  onCreateKindVersion: (input: { kind: DatasetBuilderKind; sampleIds: string[]; format: DatasetExportFormat }) => Promise<void>;
}) {
  const total = props.samples.length;
  const sftReady = props.samples.filter((sample) =>
    sample.kind === 'sft'
    && sample.status === 'candidate'
    && sample.trainable
    && sample.metadata.distillation.readyForFineTune
  );
  const trainableReady = props.samples.filter((sample) =>
    sample.status === 'candidate'
    && sample.trainable
    && sample.metadata.distillation.readyForFineTune
  );
  const reviewDebt = props.samples.filter((sample) => sample.status === 'needs_review');
  const blocked = props.samples.filter((sample) => sample.status === 'blocked');
  const l4Samples = props.samples.filter((sample) => sample.riskLevel === 'L4');
  const highRisk = props.samples.filter((sample) => sample.riskLevel === 'L3' || sample.riskLevel === 'L4');
  const evidenceRequired = props.samples.filter((sample) => sample.toolEventCount > 0);
  const missingEvidence = props.samples.filter((sample) => sample.toolEventCount > 0 && sample.evidenceCount === 0);
  const redacted = props.samples.filter((sample) => sample.metadata.distillation.redactionCount > 0);
  const cleanReady = props.cleanTraces.filter((trace) => trace.status === 'ready');
  const repairItems = props.samples.map((sample) => {
    const issues = repairIssuesForSample(sample);
    return { sample, issues, lane: repairLaneForSample(sample, issues) };
  });
  const governanceLocks = repairItems.filter((item) => item.lane === 'governance_lock');
  const rewriteNeeded = repairItems.filter((item) => item.lane === 'rewrite_needed');
  const averageQuality = averageSampleQuality(props.samples);
  const evidenceCoverage = evidenceRequired.length === 0
    ? 100
    : Math.round(((evidenceRequired.length - missingEvidence.length) / evidenceRequired.length) * 100);
  const cleanCoverage = props.cleanTraces.length === 0
    ? 0
    : Math.round((cleanReady.length / props.cleanTraces.length) * 100);
  const reviewPenalty = total ? Math.min(24, Math.round((reviewDebt.length / total) * 36)) : 20;
  const blockedPenalty = total ? Math.min(28, Math.round((blocked.length / total) * 42)) : 20;
  const evidencePenalty = evidenceRequired.length ? Math.min(18, Math.round((missingEvidence.length / evidenceRequired.length) * 28)) : 0;
  const riskPenalty = total ? Math.min(20, Math.round((highRisk.length / total) * 28)) : 0;
  const qualityPenalty = averageQuality >= 70 ? 0 : averageQuality >= 50 ? 10 : 22;
  const readinessScore = Math.max(0, Math.min(100, 100 - reviewPenalty - blockedPenalty - evidencePenalty - riskPenalty - qualityPenalty));
  const status: CommandCenterStatus = sftReady.length === 0 || l4Samples.length > 0
    ? 'blocked'
    : readinessScore >= 78 && reviewDebt.length === 0 && missingEvidence.length === 0
      ? 'ready'
      : 'attention';
  const latestVersion = props.datasetVersions[0];
  const nextKind = datasetBuilderKinds
    .map((item) => {
      const samples = props.samples.filter((sample) => sample.kind === item.kind);
      const review = samples.filter((sample) => sample.status === 'needs_review').length;
      const blockedCount = samples.filter((sample) => sample.status === 'blocked').length;
      return { ...item, samples, review, blocked: blockedCount, averageQuality: averageSampleQuality(samples) };
    })
    .sort((a, b) => (b.review + b.blocked) - (a.review + a.blocked) || b.samples.length - a.samples.length)[0];
  const nextKindDebt = nextKind ? nextKind.review + nextKind.blocked : 0;
  const kindRows = datasetBuilderKinds.map((item) => {
    const samples = props.samples.filter((sample) => sample.kind === item.kind);
    return {
      ...item,
      samples,
      candidate: samples.filter((sample) => sample.status === 'candidate').length,
      review: samples.filter((sample) => sample.status === 'needs_review').length,
      blocked: samples.filter((sample) => sample.status === 'blocked').length,
      averageQuality: averageSampleQuality(samples),
    };
  });
  const projectRows = countSamplesBy(props.samples, (sample) => sample.projectKey ?? 'unknown')
    .slice(0, 5)
    .map((project) => {
      const samples = props.samples.filter((sample) => (sample.projectKey ?? 'unknown') === project.key);
      return {
        ...project,
        quality: averageSampleQuality(samples),
        review: samples.filter((sample) => sample.status === 'needs_review').length,
        blocked: samples.filter((sample) => sample.status === 'blocked').length,
        highRisk: samples.filter((sample) => sample.riskLevel === 'L3' || sample.riskLevel === 'L4').length,
        missingEvidence: samples.filter((sample) => sample.toolEventCount > 0 && sample.evidenceCount === 0).length,
      };
    });
  const repairParams = new URLSearchParams();
  const repairIds = repairItems
    .filter((item) => item.lane !== 'review_ready')
    .map((item) => item.sample.id);
  if (repairIds.length > 0) repairParams.set('sampleIds', repairIds.join(','));
  const reviewParams = new URLSearchParams();
  if (reviewDebt.length > 0) reviewParams.set('sampleIds', reviewDebt.map((sample) => sample.id).join(','));

  return (
    <section className="command-panel">
      <div className="panel-title">
        <Workflow size={16} />
        Dataset Quality Command Center
        <span className="panel-count">{total} samples · {props.traceTotals.total} sessions</span>
      </div>
      <div className="command-grid">
        <div className="command-score-card">
          <span className={commandCenterStatusClass(status)}>{commandCenterStatusLabel(status)}</span>
          <strong>{readinessScore}</strong>
          <small>Live pool readiness</small>
          <div className="readiness-meter">
            <span style={{ width: `${Math.max(4, readinessScore)}%` }} />
          </div>
        </div>
        <div className="command-copy">
          <strong>{status === 'ready' ? 'Current KodaX pool can produce a governed release.' : 'Current KodaX pool still has release blockers.'}</strong>
          <small>
            {sftReady.length} SFT samples are release-ready. {reviewDebt.length} samples still need review, {blocked.length} are blocked,
            and evidence coverage is {evidenceCoverage}%.
          </small>
          <div className="command-actions">
            <button
              className="primary-button"
              disabled={sftReady.length === 0 || props.creating}
              onClick={() => props.onCreateKindVersion({
                kind: 'sft',
                sampleIds: sftReady.map((sample) => sample.id),
                format: 'fine_tune_jsonl',
              })}
            >
              {props.creating ? <Loader2 className="spin" size={16} /> : <CheckCircle2 size={16} />}
              Create SFT release set
            </button>
            <button className="secondary-button" disabled={nextKindDebt === 0} onClick={() => nextKind && props.onReviewKind(nextKind.kind)}>
              <Filter size={16} />
              Review top queue
            </button>
            <a className={`export-link ${repairIds.length === 0 ? 'disabled-link' : ''}`} href={repairIds.length ? trainingSampleExportUrl(repairParams, 'repair_jsonl') : undefined} download>
              <Download size={14} />
              Repair pack
            </a>
            <a className={`export-link ${reviewDebt.length === 0 ? 'disabled-link' : ''}`} href={reviewDebt.length ? trainingSampleExportUrl(reviewParams, 'review_jsonl') : undefined} download>
              <Download size={14} />
              Review backlog
            </a>
          </div>
        </div>
        <div className="command-kpi-grid">
          <span>
            <strong>{sftReady.length}</strong>
            SFT ready
          </span>
          <span>
            <strong>{trainableReady.length}</strong>
            Trainable ready
          </span>
          <span>
            <strong>{governanceLocks.length}</strong>
            Governance lock
          </span>
          <span>
            <strong>{rewriteNeeded.length}</strong>
            Rewrite needed
          </span>
          <span>
            <strong>{cleanCoverage}%</strong>
            Clean traces
          </span>
          <span>
            <strong>{redacted.length}</strong>
            Redacted
          </span>
        </div>
      </div>
      <div className="command-second-row">
        <div className="command-lane-table">
          <div className="command-table-title">
            <strong>Sample lanes</strong>
            <small>按样本类型定位审核和修复压力</small>
          </div>
          <div className="command-lane-head">
            <span>Kind</span>
            <span>Pool</span>
            <span>Candidate</span>
            <span>Review</span>
            <span>Blocked</span>
            <span>Quality</span>
            <span></span>
          </div>
          {kindRows.map((row) => (
            <div className="command-lane-row" key={row.kind}>
              <span>
                <strong>{row.label}</strong>
                <small>{row.copy}</small>
              </span>
              <span>{row.samples.length}</span>
              <span>{row.candidate}</span>
              <span>{row.review}</span>
              <span>{row.blocked}</span>
              <span><b className={qualityClass(qualityGradeFromScore(row.averageQuality))}>{row.samples.length ? row.averageQuality : '-'}</b></span>
              <span>
                <button className="secondary-button" disabled={row.review + row.blocked === 0} onClick={() => props.onReviewKind(row.kind)}>
                  Queue
                </button>
              </span>
            </div>
          ))}
        </div>
        <div className="command-project-table">
          <div className="command-table-title">
            <strong>Project pressure</strong>
            <small>{latestVersion ? `Latest dataset: ${latestVersion.name}` : 'No frozen dataset version yet'}</small>
          </div>
          <div className="command-project-head">
            <span>Project</span>
            <span>Samples</span>
            <span>Risk</span>
            <span>Evidence gaps</span>
            <span>Quality</span>
          </div>
          {projectRows.length === 0 ? (
            <p className="muted">还没有项目分布数据。</p>
          ) : projectRows.map((row) => (
            <div className="command-project-row" key={row.key}>
              <span>
                <strong>{row.key}</strong>
                <small>{row.review} review · {row.blocked} blocked</small>
              </span>
              <span>{row.count}</span>
              <span>{row.highRisk}</span>
              <span>{row.missingEvidence}</span>
              <span>
                <b className={qualityClass(qualityGradeFromScore(row.quality))}>{row.quality}</b>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function GovernanceActionPlanPanel(props: {
  samples: TrainingSample[];
  datasetVersions: DatasetVersion[];
  creating: boolean;
  onReviewQueue: (kind: DatasetBuilderKind, status?: string) => void;
  onCreateKindVersion: (input: { kind: DatasetBuilderKind; sampleIds: string[]; format: DatasetExportFormat }) => Promise<void>;
  onSelectDatasetVersion: (id: string) => void;
}) {
  const sftReady = props.samples.filter((sample) =>
    sample.kind === 'sft'
    && sample.status === 'candidate'
    && sample.trainable
    && sample.metadata.distillation.readyForFineTune
  );
  const reviewDebt = props.samples.filter((sample) => sample.status === 'needs_review');
  const candidateNeedsSignoff = props.samples.filter((sample) =>
    sample.status === 'candidate'
    && sample.trainable
    && !sample.review
  );
  const lockedRepair = props.samples.filter((sample) => {
    const issues = repairIssuesForSample(sample);
    return sample.status === 'blocked'
      || issues.includes('l4_governance_lock')
      || issues.includes('credential_signal')
      || issues.includes('quality_blocked');
  });
  const missingEvidence = props.samples.filter((sample) => sample.toolEventCount > 0 && sample.evidenceCount === 0);
  const cleanDebt = props.samples.filter((sample) => !sample.metadata.distillation.readyForFineTune);
  const latestVersion = props.datasetVersions[0];
  const latestGate = latestVersion ? buildDatasetReleaseGate(latestVersion, latestVersion.sampleSnapshots ?? []) : undefined;

  function idsParams(samples: TrainingSample[]): URLSearchParams {
    const params = new URLSearchParams();
    if (samples.length > 0) params.set('sampleIds', samples.map((sample) => sample.id).join(','));
    return params;
  }

  function filterParams(filters: Record<string, string>): URLSearchParams {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) params.set(key, value);
    return params;
  }

  function topKind(samples: TrainingSample[]): DatasetBuilderKind {
    return datasetBuilderKinds
      .map((item) => ({ kind: item.kind, count: samples.filter((sample) => sample.kind === item.kind).length }))
      .sort((a, b) => b.count - a.count)[0]?.kind ?? 'sft';
  }

  const actionItems: Array<{
    id: string;
    severity: GovernanceActionSeverity;
    title: string;
    detail: string;
    metric: string;
    runbook: string[];
    queueKind?: DatasetBuilderKind;
    queueStatus?: string;
    exportFormat?: DatasetExportFormat;
    exportParams?: URLSearchParams;
    releaseSampleIds?: string[];
    datasetId?: string;
  }> = [];

  if (lockedRepair.length > 0) {
    actionItems.push({
      id: 'locked-repair',
      severity: 'block',
      title: 'Quarantine governance-locked samples',
      detail: 'Blocked, L4, credential, or quality-blocked samples should stay out of every training release until repaired.',
      metric: `${lockedRepair.length} samples`,
      runbook: ['export repair pack', 'remove from train pool', 'human signoff required'],
      exportFormat: 'repair_jsonl',
      exportParams: idsParams(lockedRepair),
    });
  }

  if (reviewDebt.length > 0) {
    const kind = topKind(reviewDebt);
    actionItems.push({
      id: 'review-backlog',
      severity: 'warn',
      title: 'Clear needs-review backlog',
      detail: `${sampleKindLabel(kind)} is the highest-pressure review lane. Approve only samples with clean text and sufficient evidence.`,
      metric: `${reviewDebt.length} samples`,
      runbook: ['open review queue', 'approve eligible', 'reject unsafe samples'],
      queueKind: kind,
      queueStatus: 'needs_review',
      exportFormat: 'review_jsonl',
      exportParams: filterParams({ status: 'needs_review' }),
    });
  }

  if (candidateNeedsSignoff.length > 0) {
    const kind = topKind(candidateNeedsSignoff);
    actionItems.push({
      id: 'candidate-signoff',
      severity: 'warn',
      title: 'Sign off candidate pool before release',
      detail: 'Some trainable candidates were generated automatically and should receive explicit governance approval before durable dataset release.',
      metric: `${candidateNeedsSignoff.length} candidates`,
      runbook: ['review candidate status', 'approve/reject explicitly', 'freeze after signoff'],
      queueKind: kind,
      queueStatus: 'candidate',
      exportFormat: 'review_jsonl',
      exportParams: idsParams(candidateNeedsSignoff),
    });
  }

  if (missingEvidence.length > 0) {
    actionItems.push({
      id: 'evidence-gap',
      severity: 'warn',
      title: 'Repair evidence coverage',
      detail: 'Tool-backed samples without artifact ledger evidence are weaker for eval, repair, and supervised training provenance.',
      metric: `${missingEvidence.length} gaps`,
      runbook: ['relink artifact ledger', 'mark evidence gap', 'prefer eval/review until fixed'],
      exportFormat: 'repair_jsonl',
      exportParams: filterParams({ missingEvidence: 'true' }),
    });
  }

  if (cleanDebt.length > 0) {
    actionItems.push({
      id: 'clean-text-debt',
      severity: 'warn',
      title: 'Rewrite clean text debt',
      detail: 'Samples without clean prompt or clean outcome cannot be safely exported for fine-tuning.',
      metric: `${cleanDebt.length} samples`,
      runbook: ['rewrite clean goal', 'rewrite clean outcome', 'rerun release gate'],
      exportFormat: 'repair_jsonl',
      exportParams: idsParams(cleanDebt),
    });
  }

  if (sftReady.length > 0) {
    actionItems.push({
      id: 'create-sft-release',
      severity: candidateNeedsSignoff.length > 0 ? 'warn' : 'ready',
      title: 'Freeze SFT release set',
      detail: candidateNeedsSignoff.length > 0
        ? 'A release set can be created, but explicit candidate signoff should happen before external model work.'
        : 'SFT candidates are clean and trainable. Freeze an immutable snapshot before exporting.',
      metric: `${sftReady.length} SFT ready`,
      runbook: ['snapshot sample ids', 'lock policy versions', 'export fine-tune jsonl'],
      releaseSampleIds: sftReady.map((sample) => sample.id),
      exportFormat: 'fine_tune_jsonl',
      exportParams: filterParams({ kind: 'sft', status: 'candidate', readyForFineTune: 'true' }),
    });
  }

  if (latestVersion && latestGate && latestGate.status !== 'ready') {
    actionItems.push({
      id: 'latest-release-gate',
      severity: latestGate.status === 'blocked' ? 'block' : 'warn',
      title: 'Resolve latest dataset release gate',
      detail: latestGate.recommendation,
      metric: `${latestGate.blockCount} blocks · ${latestGate.warnCount} warnings`,
      runbook: latestGate.checks.filter((check) => check.severity !== 'pass').slice(0, 3).map((check) => check.label),
      datasetId: latestVersion.id,
    });
  }

  if (actionItems.length === 0) {
    actionItems.push({
      id: 'all-clear',
      severity: 'ready',
      title: 'No active governance actions',
      detail: 'The current filtered pool has no review, repair, evidence, or clean text debt.',
      metric: 'clear',
      runbook: ['monitor new KodaX sessions', 'freeze next release when ready'],
    });
  }

  actionItems.sort((a, b) => governanceActionRank(a.severity) - governanceActionRank(b.severity));
  const visibleItems = actionItems.slice(0, 6);

  return (
    <section className="action-panel">
      <div className="panel-title">
        <ShieldAlert size={16} />
        Governance Action Plan
        <span className="panel-count">{visibleItems.length} recommended actions</span>
      </div>
      <div className="action-list">
        {visibleItems.map((item) => (
          <div className={`action-item action-item-${item.severity}`} key={item.id}>
            <span className={governanceActionClass(item.severity)}>{governanceActionLabel(item.severity)}</span>
            <span className="action-copy">
              <strong>{item.title}</strong>
              <small>{item.detail}</small>
              <span className="action-runbook">
                {item.runbook.map((step) => <b key={step}>{step}</b>)}
              </span>
            </span>
            <strong className="action-metric">{item.metric}</strong>
            <span className="action-buttons">
              {item.queueKind && (
                <button className="secondary-button" onClick={() => props.onReviewQueue(item.queueKind!, item.queueStatus)}>
                  <Filter size={14} />
                  Queue
                </button>
              )}
              {item.releaseSampleIds && (
                <button
                  className="primary-button"
                  disabled={props.creating || item.releaseSampleIds.length === 0}
                  onClick={() => props.onCreateKindVersion({
                    kind: 'sft',
                    sampleIds: item.releaseSampleIds ?? [],
                    format: 'fine_tune_jsonl',
                  })}
                >
                  {props.creating ? <Loader2 className="spin" size={14} /> : <CheckCircle2 size={14} />}
                  Freeze
                </button>
              )}
              {item.exportFormat && item.exportParams && (
                <a className="export-link" href={trainingSampleExportUrl(item.exportParams, item.exportFormat)} download>
                  <Download size={14} />
                  {datasetFormatLabel(item.exportFormat)}
                </a>
              )}
              {item.datasetId && (
                <button className="secondary-button" onClick={() => props.onSelectDatasetVersion(item.datasetId!)}>
                  <FileSearch size={14} />
                  Inspect
                </button>
              )}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function eventIcon(type: RawTraceEvent['type']) {
  switch (type) {
    case 'tool_use':
    case 'tool_result':
    case 'tool_call':
      return <TerminalSquare size={15} />;
    case 'artifact':
      return <FileSearch size={15} />;
    case 'compaction':
      return <Archive size={15} />;
    case 'branch_summary':
      return <GitBranch size={15} />;
    case 'error_metadata':
      return <AlertTriangle size={15} />;
    default:
      return <Braces size={15} />;
  }
}

function toParams(filters: Filters): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (typeof value === 'boolean') {
      if (value) params.set(key, 'true');
    } else if (value) {
      params.set(key, value);
    }
  }
  return params;
}

function StatCard(props: { label: string; value: number | string; icon: React.ReactNode; tone?: string }) {
  return (
    <div className={`stat ${props.tone ?? ''}`}>
      <div className="stat-icon">{props.icon}</div>
      <div>
        <div className="stat-value">{props.value}</div>
        <div className="stat-label">{props.label}</div>
      </div>
    </div>
  );
}

function pipelineNodeStatusLabel(status: PipelineNodeStatus): string {
  if (status === 'ready') return 'Ready';
  if (status === 'attention') return 'Needs work';
  if (status === 'blocked') return 'Blocked';
  return 'No data';
}

function PipelineStageSection(props: {
  id: string;
  index: string;
  title: string;
  detail: string;
  summary: string;
  defaultOpen?: boolean;
  lockedOpen?: boolean;
  hideHeader?: boolean;
  activeStageId?: string;
  children: React.ReactNode;
}) {
  const [internalOpen, setInternalOpen] = useState(props.defaultOpen ?? false);
  const open = props.lockedOpen || internalOpen;
  useEffect(() => {
    if (props.activeStageId === props.id) setInternalOpen(true);
  }, [props.activeStageId, props.id]);
  return (
    <section className={`pipeline-stage ${open ? 'open' : 'collapsed'} ${props.hideHeader ? 'headerless' : ''}`} id={props.id}>
      {!props.hideHeader && (
        <div className="pipeline-stage-header">
          <span className="pipeline-stage-index">{props.index}</span>
          <div>
            <h2>{props.title}</h2>
            <p>{props.detail}</p>
          </div>
          <strong>{props.summary}</strong>
          {!props.lockedOpen && (
            <button
              className="secondary-button pipeline-stage-toggle"
              aria-expanded={open}
              aria-controls={`${props.id}-body`}
              onClick={() => setInternalOpen((current) => !current)}
            >
              {open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
              {open ? '收起' : '展开'}
            </button>
          )}
        </div>
      )}
      {open && (
        <div className="pipeline-stage-body" id={`${props.id}-body`}>
          {props.children}
        </div>
      )}
    </section>
  );
}

function productAreaIcon(areaId: TraceOpsProductAreaId) {
  if (areaId === 'data_access') return <Database size={22} />;
  if (areaId === 'evaluation') return <BookOpenCheck size={22} />;
  return <Server size={22} />;
}

function productReleaseStatusLabel(status: TraceOpsReleaseStatus): string {
  if (status === 'current') return '当前正式版本';
  if (status === 'next') return '下一版本';
  return '规划版本';
}

function ProductReleaseRoadmap({ releases }: { releases: TraceOpsProductRelease[] }) {
  return (
    <section className="product-release-roadmap" aria-label="TraceOps product release roadmap">
      <div className="release-roadmap-heading">
        <div>
          <span className="section-label">Semantic Release Roadmap</span>
          <h3>按版本逐层扩大产品边界</h3>
        </div>
        <p>每个版本都继承上一阶段能力；只有达到验收标准，下一阶段才进入正式交付。</p>
      </div>
      <div className="release-roadmap-list">
        {releases.map((release) => (
          <article className={`release-roadmap-card release-${release.status}`} key={release.version}>
            <div className="release-roadmap-card-head">
              <span className="release-version">v{release.version}</span>
              <b className={`release-${release.status}`}>{productReleaseStatusLabel(release.status)}</b>
            </div>
            <strong>{release.title}</strong>
            <p>{release.scope}</p>
            <div className="release-deliverable">
              <small>版本交付物</small>
              <span>{release.deliverable}</span>
            </div>
            <small className="release-acceptance-count">
              <CheckCircle2 size={13} /> {release.acceptanceCriteria.length} 项版本验收标准
            </small>
          </article>
        ))}
      </div>
      <div className="release-scope-rule">
        <GitBranch size={16} />
        <span><strong>当前生产范围：v0.1.0</strong> 评测能力保留为 v0.2.0 开发预览，模型后训练保留为 v0.3.0 规划验证。</span>
      </div>
    </section>
  );
}

function ProductReleaseScopeBanner({ architecture, areaId }: {
  architecture?: TraceOpsPlatformArchitecture;
  areaId: WorkspaceAreaId;
}) {
  if (!architecture || areaId === 'platform') return null;
  const area = architecture.areas.find((item) => item.id === areaId);
  const release = architecture.releases.find((item) => item.version === area?.introducedIn);
  if (!area || !release || release.status === 'current') return null;
  return (
    <section className={`product-release-scope-banner release-${release.status}`}>
      <span className="release-version">v{release.version}</span>
      <div>
        <strong>{productReleaseStatusLabel(release.status)}开发预览，不属于 v{architecture.currentVersion} 正式交付范围</strong>
        <small>{release.scope}</small>
      </div>
      <span className="release-scope-deliverable">目标：{release.deliverable}</span>
    </section>
  );
}

function PlatformArchitectureOverviewPanel({ architecture, onOpenStage }: {
  architecture?: TraceOpsPlatformArchitecture;
  onOpenStage: (id: PipelineStageId) => void;
}) {
  if (!architecture) {
    return (
      <section className="platform-architecture loading">
        <Loader2 className="spin" size={20} />
        正在读取 TraceOps 产品架构…
      </section>
    );
  }
  const areaName = (id: TraceOpsProductAreaId) => architecture.areas.find((area) => area.id === id)?.shortTitle ?? id;
  const openModule = (stageId: string) => {
    const stage = getPipelineStageMeta(stageId);
    if (stage) onOpenStage(stage.id);
  };

  return (
    <section className="platform-architecture">
      <div className="platform-architecture-hero">
        <div>
          <span className="pipeline-eyebrow">Current Release · TraceOps v{architecture.currentVersion}</span>
          <h2>v0.1.0 先把 Trace 数据基础打牢</h2>
          <p>{architecture.releases.find((release) => release.status === 'current')?.scope}</p>
        </div>
        <div className="platform-architecture-version">
          <span>v{architecture.currentVersion}</span>
          <b>Production scope</b>
          <small>{formatDate(architecture.generatedAt)}</small>
        </div>
      </div>

      <ProductReleaseRoadmap releases={architecture.releases} />

      <div className="platform-area-grid">
        {architecture.areas.map((area) => (
          <article className={`platform-area-card platform-area-${area.id} status-${area.status} release-${area.releaseStatus}`} key={area.id}>
            <div className="platform-area-head">
              <span className="platform-area-icon">{productAreaIcon(area.id)}</span>
              <span>
                <small>0{area.order} · v{area.introducedIn}</small>
                <strong>{area.title}</strong>
              </span>
              <b className={`platform-release-status release-${area.releaseStatus}`}>{productReleaseStatusLabel(area.releaseStatus)}</b>
            </div>
            <p>{area.purpose}</p>
            <div className="platform-capability-health">
              <span className={`platform-module-status status-${area.status}`} />
              {area.releaseStatus === 'current' ? '正式能力状态' : '开发预览状态'}：{pipelineNodeStatusLabel(area.status)}
            </div>
            <div className="platform-artifact-flow">
              <span><small>输入</small>{area.entryArtifact}</span>
              <ChevronRight size={16} />
              <span><small>输出</small>{area.exitArtifact}</span>
            </div>
            <div className="platform-module-list">
              {area.modules.map((module) => (
                <button type="button" key={module.id} onClick={() => openModule(module.stageId)}>
                  <span className={`platform-module-status status-${module.status}`} />
                  <span className="platform-module-copy">
                    <strong>{module.title}</strong>
                    <small>{module.purpose}</small>
                  </span>
                  <span className="platform-module-metrics">
                    {module.metrics.slice(0, 3).map((metric) => (
                      <small className={metric.tone ? `tone-${metric.tone}` : ''} key={`${module.id}-${metric.label}`}>
                        <b>{metric.value}</b> {metric.label}
                      </small>
                    ))}
                  </span>
                  <ChevronRight size={15} />
                </button>
              ))}
            </div>
            <button className="secondary-button platform-area-cta" type="button" onClick={() => openModule(area.modules[0]?.stageId ?? '')}>
              {area.releaseStatus === 'current' ? `进入 v${area.introducedIn} ${area.shortTitle}` : `查看 v${area.introducedIn} 开发预览`}
              <ChevronRight size={15} />
            </button>
          </article>
        ))}
      </div>

      <div className="platform-transition-panel">
        <div className="section-label">跨域契约</div>
        <div className="platform-transition-list">
          {architecture.transitions.map((transition) => (
            <div key={`${transition.from}-${transition.to}-${transition.artifact}`}>
              <strong>{areaName(transition.from)}</strong>
              <span><ChevronRight size={14} /> {transition.artifact}</span>
              <strong>{areaName(transition.to)}</strong>
              <small>{transition.rule}</small>
            </div>
          ))}
        </div>
      </div>

      <div className="evaluation-boundary-panel">
        <div>
          <span className="section-label">Agent Evaluation</span>
          <strong>评测 Harness 是否变强</strong>
          <p>{architecture.evaluationBoundary.agentEvaluation}</p>
        </div>
        <div>
          <span className="section-label">Model Evaluation</span>
          <strong>评测模型是否变强</strong>
          <p>{architecture.evaluationBoundary.modelEvaluation}</p>
        </div>
      </div>

      <button className="platform-foundation" type="button" onClick={() => onOpenStage('stage-system')}>
        <Wrench size={18} />
        <span>
          <strong>{architecture.sharedFoundation.title}</strong>
          <small>{architecture.sharedFoundation.purpose}</small>
        </span>
        <span className="platform-foundation-capabilities">
          {architecture.sharedFoundation.capabilities.map((capability) => <small key={capability}>{capability}</small>)}
        </span>
        <ChevronRight size={16} />
      </button>
    </section>
  );
}

function PipelineOverviewPanel(props: {
  source?: SourceStatus;
  traceTotals: TraceListResponse['totals'];
  samples: TrainingSample[];
  sampleTotals: TrainingSampleListResponse['totals'];
  cleanTotals: CleanTraceListResponse['totals'];
  qualitySummary: IngestQualityQueueResponse['summary'];
  datasetVersions: DatasetVersion[];
  releaseManifests: DatasetReleaseManifest[];
  exportRuns: DatasetExportRun[];
  trainingRuns: DatasetTrainingRunRecord[];
  evalRuns: DatasetEvalRunRecord[];
  agentEvaluationExperiments: AgentEvaluationExperiment[];
  agentEvaluationReports: AgentEvaluationComparisonReport[];
  feedbackLoops: DatasetFeedbackLoopRecord[];
  taskSummary: TraceOpsTaskListResponse['summary'];
  storageHealth?: StorePersistenceHealth;
  auditRecords: GovernanceAuditRecord[];
  feedbackReport?: KodaXFeedbackReport;
  syncing: boolean;
  onSync: () => void;
  onOpenStage: (id: PipelineStageId) => void;
}) {
  const evidenceRequired = props.samples.filter((sample) => sample.toolEventCount > 0);
  const evidenceLinked = evidenceRequired.filter((sample) => sample.evidenceCount > 0);
  const evidenceCoverage = evidenceRequired.length === 0
    ? props.samples.length > 0 ? 100 : 0
    : Math.round((evidenceLinked.length / evidenceRequired.length) * 100);
  const cleanCoverage = props.cleanTotals.total === 0
    ? 0
    : Math.round((props.cleanTotals.ready / props.cleanTotals.total) * 100);
  const deliveryCount = props.releaseManifests.length + props.exportRuns.length;
  const feedbackCount = props.feedbackLoops.length + props.trainingRuns.length + props.evalRuns.length;
  const systemAttention = (props.storageHealth?.status !== 'healthy' ? 1 : 0)
    + (props.feedbackReport?.summary.critical ?? 0)
    + props.taskSummary.needsAttention;
  const readySftSamples = props.samples.filter((sample) =>
    sample.kind === 'sft'
    && sample.status === 'candidate'
    && sample.trainable
    && sample.metadata.distillation.readyForFineTune
  );
  const readyTrainableSamples = props.samples.filter((sample) =>
    sample.status === 'candidate'
    && sample.trainable
    && sample.metadata.distillation.readyForFineTune
  );
  const reviewSamples = props.samples.filter((sample) => sample.status === 'needs_review');
  const latestSftDataset = props.datasetVersions
    .filter((version) => version.format === 'fine_tune_jsonl')
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  const latestSftGate = latestSftDataset
    ? buildDatasetReleaseGate(latestSftDataset, latestSftDataset.sampleSnapshots ?? [])
    : undefined;
  const latestExportableDataset = props.datasetVersions
    .map((version) => ({
      version,
      gate: buildDatasetReleaseGate(version, version.sampleSnapshots ?? []),
    }))
    .filter((item) => !item.gate.releaseBlocked)
    .sort((a, b) => b.version.createdAt.localeCompare(a.version.createdAt))[0]?.version;
  const sftCandidateParams = new URLSearchParams();
  sftCandidateParams.set('kind', 'sft');
  sftCandidateParams.set('status', 'candidate');
  sftCandidateParams.set('readyForFineTune', 'true');
  const readyKind = readyTrainableSamples.find((sample) => sample.kind === 'sft')?.kind
    ?? readyTrainableSamples.find((sample) => sample.kind === 'eval')?.kind
    ?? readyTrainableSamples.find((sample) => sample.kind === 'repair')?.kind
    ?? readyTrainableSamples[0]?.kind;
  const readyFormat = readyKind ? defaultDatasetFormatForKind(readyKind) : undefined;
  const readyCandidateParams = new URLSearchParams();
  if (readyKind) {
    readyCandidateParams.set('kind', readyKind);
  }
  readyCandidateParams.set('status', 'candidate');
  readyCandidateParams.set('readyForFineTune', 'true');
  const reviewParams = new URLSearchParams();
  reviewParams.set('status', 'needs_review');
  const traceOpsParams = new URLSearchParams();
  const exportOption = latestSftDataset && !latestSftGate?.releaseBlocked
    ? {
        url: datasetVersionExportUrl(latestSftDataset.id, 'fine_tune_jsonl'),
        cta: '导出 SFT 数据',
        source: '已固化 Fine-tune 数据集',
        detail: `${latestSftDataset.sampleCount} version samples`,
      }
    : readySftSamples.length > 0
      ? {
          url: trainingSampleExportUrl(sftCandidateParams, 'fine_tune_jsonl'),
          cta: '导出 SFT 数据',
          source: '当前 Ready SFT 候选',
          detail: `${readySftSamples.length} ready SFT samples`,
        }
      : latestExportableDataset
        ? {
            url: datasetVersionExportUrl(latestExportableDataset.id, latestExportableDataset.format),
            cta: `导出 ${datasetFormatLabel(latestExportableDataset.format)}`,
            source: '暂无 ready SFT，先导出最新可用数据集',
            detail: `${latestExportableDataset.sampleCount} ${datasetFormatLabel(latestExportableDataset.format)} samples`,
          }
        : readyFormat
          ? {
              url: trainingSampleExportUrl(readyCandidateParams, readyFormat),
              cta: `导出 ${datasetFormatLabel(readyFormat)}`,
              source: '暂无 ready SFT，先导出可训练候选',
              detail: `${readyTrainableSamples.length} ready candidate samples`,
            }
          : reviewSamples.length > 0
            ? {
                url: trainingSampleExportUrl(reviewParams, 'review_jsonl'),
                cta: '导出 Review 数据',
                source: '暂无 ready SFT，先导出待审核样本',
                detail: `${reviewSamples.length} needs review samples`,
              }
            : props.samples.length > 0
              ? {
                  url: trainingSampleExportUrl(traceOpsParams, 'traceops_jsonl'),
                  cta: '导出 TraceOps 数据',
                  source: '暂无 ready SFT，导出完整样本留存',
                  detail: `${props.samples.length} total samples`,
                }
              : undefined;
  const nodes = [
    {
      id: 'ingest',
      stageId: 'stage-ingest',
      title: '数据接入',
      subtitle: props.source?.exists ? 'KodaX 本地 session 可同步' : '等待 KodaX session 源',
      tooltip: '把 KodaX 本地 session 拉进 TraceOps，并检查是否能稳定同步。',
      metric: `${props.traceTotals.total} sessions`,
      status: !props.source?.exists ? 'blocked' : props.qualitySummary.openOccurrences > 0 ? 'attention' : 'ready',
      icon: <HardDrive size={16} />,
    },
    {
      id: 'raw',
      stageId: 'stage-raw',
      title: '原始还原',
      subtitle: 'Session 转 Raw Trace / Timeline',
      tooltip: '把 session 还原成时间线，看清每一步发生了什么。',
      metric: `${props.traceTotals.imported + props.traceTotals.updated} traces`,
      status: props.traceTotals.total > 0 ? 'ready' : 'idle',
      icon: <FileSearch size={16} />,
    },
    {
      id: 'evidence',
      stageId: 'stage-raw',
      title: '证据归因',
      subtitle: 'Tool / artifact / runtime 形成 evidence',
      tooltip: '把工具调用、文件、报错和产物挂到对应样本上。',
      metric: `${evidenceCoverage}% covered`,
      status: props.samples.length === 0 ? 'idle' : evidenceCoverage >= 95 ? 'ready' : 'attention',
      icon: <Braces size={16} />,
    },
    {
      id: 'agent-evaluation',
      stageId: 'stage-evaluation',
      title: 'Agent评测',
      subtitle: '固定Model，对比Harness H0/H1',
      tooltip: '把工程师的 Harness 变更放进同一套 Validation Suite，比较目标能力、成本和 Case Churn。',
      metric: `${props.agentEvaluationExperiments.length} experiments`,
      status: props.agentEvaluationReports.some((item) => item.verdict === 'regressed')
        ? 'attention'
        : props.agentEvaluationReports.length > 0
          ? 'ready'
          : props.agentEvaluationExperiments.length > 0
            ? 'attention'
            : 'idle',
      icon: <BookOpenCheck size={16} />,
    },
    {
      id: 'govern',
      stageId: 'stage-governance',
      title: '数据治理',
      subtitle: '风险、脱敏、Review、Repair',
      tooltip: '检查风险、脱敏和证据，把可用数据筛出来。',
      metric: `${props.sampleTotals.needsReview + props.sampleTotals.blocked} to handle`,
      status: props.sampleTotals.blocked > 0
        ? 'blocked'
        : props.sampleTotals.needsReview > 0
          ? 'attention'
          : props.sampleTotals.candidate > 0
            ? 'ready'
            : 'idle',
      icon: <ShieldAlert size={16} />,
    },
    {
      id: 'dataset',
      stageId: 'stage-dataset',
      title: '数据集构建',
      subtitle: 'Candidate samples 进入版本',
      tooltip: '把通过治理的样本固化成可追踪的数据集版本。',
      metric: `${props.datasetVersions.length} versions`,
      status: props.datasetVersions.length > 0 ? 'ready' : props.sampleTotals.candidate > 0 ? 'attention' : 'idle',
      icon: <Database size={16} />,
    },
    {
      id: 'delivery',
      stageId: 'stage-training',
      title: '导出交付',
      subtitle: 'Manifest / handoff / export',
      tooltip: '生成交付包和清单，给训练、评测或外部系统使用。',
      metric: `${deliveryCount} artifacts`,
      status: deliveryCount > 0 ? 'ready' : props.datasetVersions.length > 0 ? 'attention' : 'idle',
      icon: <Download size={16} />,
    },
    {
      id: 'feedback',
      stageId: 'stage-feedback',
      title: '反馈闭环',
      subtitle: '训练、评测、部署、回流',
      tooltip: '把训练和上线反馈回流，形成下一轮改进数据。',
      metric: `${feedbackCount} signals`,
      status: props.feedbackLoops.length > 0 ? 'ready' : feedbackCount > 0 ? 'attention' : 'idle',
      icon: <GitBranch size={16} />,
    },
    {
      id: 'system',
      stageId: 'stage-system',
      title: '系统治理',
      subtitle: '审计、存储、反哺、自动编排',
      tooltip: '集中处理 TraceOps 自身的审计、快照、KodaX 反哺和自动任务。',
      metric: `${systemAttention} alerts`,
      status: systemAttention > 0 ? 'attention' : props.auditRecords.length > 0 ? 'ready' : 'idle',
      icon: <Wrench size={16} />,
    },
  ] satisfies Array<{
    id: string;
    stageId: PipelineStageId;
    title: string;
    subtitle: string;
    tooltip: string;
    metric: string;
    status: PipelineNodeStatus;
    icon: React.ReactNode;
  }>;
  const readyNodes = nodes.filter((node) => node.status === 'ready').length;
  const nextNode = nodes.find((node) => node.status === 'blocked' || node.status === 'attention')
    ?? nodes.find((node) => node.status === 'idle');
  const inputReady = Boolean(props.source?.exists);
  const sftReady = Boolean(latestSftDataset && !latestSftGate?.releaseBlocked) || readySftSamples.length > 0;
  const transformNodes = nodes.filter((node) => node.id !== 'ingest' && node.id !== 'delivery' && node.id !== 'feedback' && node.id !== 'system');
  const advancedNodes = nodes.filter((node) => node.id === 'feedback' || node.id === 'system');

  return (
    <section className="pipeline-overview-panel">
      <div className="pipeline-hero">
        <div>
          <span className="pipeline-eyebrow">KodaX Session In · SFT Data Out</span>
          <h2>接入 KodaX 数据，导出 SFT 训练集</h2>
          <p>
            首页只回答两个问题：KodaX session 是否符合接入规格，最后是否能导出可用于 SFT 的 JSONL。
          </p>
        </div>
        <div className="pipeline-hero-actions">
          <button className="secondary-button" onClick={props.onSync} disabled={props.syncing}>
            {props.syncing ? <Loader2 className="spin" size={16} /> : <Play size={16} />}
            Sync KodaX
          </button>
          {exportOption ? (
            <a className="primary-button pipeline-export-cta" href={exportOption.url} download>
              <Download size={16} />
              {sftReady ? '导出 SFT JSONL' : exportOption.cta}
            </a>
          ) : (
            <span className="primary-button pipeline-export-cta disabled-cta">
              <Download size={16} />
              等待数据
            </span>
          )}
        </div>
      </div>

      <div className="io-overview-grid">
        <article className={`io-card ${inputReady ? 'ready' : 'blocked'}`}>
          <div className="io-card-head">
            <span><HardDrive size={17} /> 数据接入</span>
            <b>{inputReady ? 'KodaX session 已接入' : '等待 KodaX session'}</b>
          </div>
          <h3>读取 KodaX 当前 session 规格</h3>
          <p>TraceOps 从本地 KodaX sessions 读取完整会话、runtime events、source hash 和项目上下文；未变化的 session 会跳过。</p>
          <div className="io-card-metrics">
            <span><strong>{props.source?.exists ? 'OK' : 'Missing'}</strong><small>session source</small></span>
            <span><strong>{props.traceTotals.total}</strong><small>sessions</small></span>
            <span><strong>{props.qualitySummary.openOccurrences}</strong><small>ingest issues</small></span>
          </div>
          <div className="io-card-actions">
            <button className="primary-button" onClick={props.onSync} disabled={props.syncing}>
              {props.syncing ? <Loader2 className="spin" size={16} /> : <Play size={16} />}
              同步 KodaX
            </button>
            <button className="secondary-button" type="button" onClick={() => props.onOpenStage('stage-ingest')}>
              <FileSearch size={15} />
              查看接入
            </button>
          </div>
          <small className="io-card-path">{props.source?.sessionsDir ?? 'KodaX sessions directory not configured'}</small>
        </article>

        <article className={`io-card ${sftReady ? 'ready' : exportOption ? 'attention' : 'blocked'}`}>
          <div className="io-card-head">
            <span><Download size={17} /> 数据输出</span>
            <b>{sftReady ? 'SFT 可导出' : exportOption ? '有可导出数据' : '等待样本'}</b>
          </div>
          <h3>输出 SFT 训练 JSONL</h3>
          <p>{sftReady
            ? '已经存在可用于 SFT 的候选样本或 Fine-tune 数据集版本，可以直接导出。'
            : '当前还没有 ready SFT，TraceOps 会先提供可用的 Review / Eval / Repair / TraceOps 数据导出。'}</p>
          <div className="io-card-metrics">
            <span><strong>{readySftSamples.length}</strong><small>ready SFT</small></span>
            <span><strong>{latestSftDataset ? latestSftDataset.sampleCount : 0}</strong><small>SFT version samples</small></span>
            <span><strong>{props.exportRuns.length}</strong><small>exports</small></span>
          </div>
          <div className="io-card-actions">
            {exportOption ? (
              <a className="primary-button pipeline-export-cta" href={exportOption.url} download>
                <Download size={16} />
                {sftReady ? '导出 SFT JSONL' : exportOption.cta}
              </a>
            ) : (
              <span className="primary-button pipeline-export-cta disabled-cta">
                <Download size={16} />
                暂无输出
              </span>
            )}
            <button className="secondary-button" type="button" onClick={() => props.onOpenStage('stage-dataset')}>
              <Database size={15} />
              数据集
            </button>
          </div>
          <small className="io-card-path">{exportOption ? `${exportOption.source} · ${exportOption.detail}` : '同步 KodaX 后生成训练样本'}</small>
        </article>
      </div>

      <div className="io-transform-strip">
        <div>
          <span className="pipeline-eyebrow">自动转换</span>
          <strong>中间过程由 TraceOps 自动完成</strong>
          <small>Raw、Clean、Governance、Dataset 是转化状态，不作为首页主操作。</small>
        </div>
        <div className="io-transform-steps">
          {transformNodes.map((node) => (
            <button className={`io-transform-step ${node.status}`} type="button" onClick={() => props.onOpenStage(node.stageId)} key={node.id}>
              <span className="pipeline-node-icon">{node.icon}</span>
              <span>
                <strong>{node.title}</strong>
                <small>{node.metric}</small>
              </span>
            </button>
          ))}
        </div>
        <div className="io-advanced-links">
          <span>高级能力</span>
          {advancedNodes.map((node) => (
            <button className={`io-advanced-link ${node.status}`} type="button" onClick={() => props.onOpenStage(node.stageId)} key={node.id}>
              {node.icon}
              <strong>{node.title}</strong>
              <small>{node.metric}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="pipeline-health-strip">
        <span><strong>{evidenceCoverage}%</strong><small>evidence coverage</small></span>
        <span><strong>{cleanCoverage}%</strong><small>clean readiness</small></span>
        <span><strong>{props.sampleTotals.candidate}</strong><small>candidate samples</small></span>
        <span><strong>{props.datasetVersions.length}</strong><small>dataset versions</small></span>
        <span><strong>{readyNodes}/{nodes.length}</strong><small>system ready</small></span>
      </div>

      {nextNode && (
        <div className="pipeline-next-step">
          <span>下一步</span>
          <button type="button" onClick={() => props.onOpenStage(nextNode.stageId)}>{nextNode.title}</button>
          <small>{nextNode.subtitle}</small>
        </div>
      )}
    </section>
  );
}

function PipelineModulePageHeader({ activeStage, onHome, onOpenStage }: {
  activeStage: PipelineStageMeta;
  onHome: () => void;
  onOpenStage: (id: PipelineStageId) => void;
}) {
  const businessAreas: Array<{ id: TraceOpsProductAreaId; label: string; version: string }> = [
    { id: 'data_access', label: '数据接入', version: 'v0.1.0' },
    { id: 'evaluation', label: '评测', version: 'v0.2.0' },
    { id: 'model_training', label: '模型后训练', version: 'v0.3.0' },
  ];
  const areaStages = stagesForArea(activeStage.areaId);
  return (
    <section className="pipeline-page-header">
      <div className="pipeline-page-main">
        <button className="secondary-button" type="button" onClick={onHome}>
          <ArrowLeft size={16} />
          平台总览
        </button>
        <div>
          <span className="pipeline-eyebrow">Workspace {activeStage.index}</span>
          <h2>{activeStage.title}</h2>
          <p>{activeStage.detail}</p>
        </div>
      </div>
      <div className="platform-area-nav" aria-label="TraceOps product areas">
        {businessAreas.map((area) => (
          <button
            className={activeStage.areaId === area.id ? 'active' : ''}
            type="button"
            onClick={() => onOpenStage(defaultStageForArea(area.id))}
            key={area.id}
          >
            <span>{area.version}</span>
            {area.label}
          </button>
        ))}
        <button
          className={activeStage.areaId === 'platform' ? 'active' : ''}
          type="button"
          onClick={() => onOpenStage('stage-system')}
        >
          <span>·</span>
          平台治理
        </button>
      </div>
      <div className="pipeline-page-nav" aria-label="Current product area modules">
        {areaStages.map((stage) => (
          <button
            className={stage.id === activeStage.id ? 'active' : ''}
            type="button"
            onClick={() => onOpenStage(stage.id)}
            key={stage.id}
          >
            <span>{stage.index}</span>
            {stage.title}
          </button>
        ))}
      </div>
    </section>
  );
}

function SourceStrip(props: {
  source?: SourceStatus;
  syncing: boolean;
  onSync: () => void;
  onRetry: () => void;
  onToggleWatch: () => void;
}) {
  const checkpoint = props.source?.syncCheckpoint;
  const checkpointSummary = checkpoint
    ? `${checkpoint.imported} written · ${checkpoint.updated} updated · ${checkpoint.unchanged} unchanged · ${checkpoint.failed} failed`
    : undefined;
  const openSchemaWarnings = checkpoint?.openSchemaWarnings ?? checkpoint?.schemaWarnings ?? 0;
  const triagedSchemaWarnings = checkpoint?.triagedSchemaWarnings ?? 0;
  return (
    <section className="source-strip">
      <div className="source-main">
        <div className="source-icon">
          <HardDrive size={20} />
        </div>
        <div>
          <div className="source-title">KodaX Local Sessions</div>
          <div className="source-path">{props.source?.sessionsDir ?? '未检测到 sessions 目录'}</div>
          {checkpoint && (
            <div className="source-sync-line">
              Checkpoint {formatDate(checkpoint.lastFinishedAt ?? checkpoint.lastStartedAt)} · {checkpointSummary}
            </div>
          )}
        </div>
      </div>
      <div className="source-meta">
        <span className={props.source?.exists ? 'pill good' : 'pill danger'}>
          {props.source?.exists ? 'Source ready' : 'Source missing'}
        </span>
        <span className="pill">scope: all</span>
        <span className={props.source?.autoWatch ? 'pill good' : 'pill'}>
          {props.source?.autoWatch ? `Auto watch ${props.source?.watcherStatus ?? 'idle'}` : 'Auto watch off'}
        </span>
        {props.source?.lastWatchMessage && <span className="pill">{props.source.lastWatchMessage}</span>}
        {checkpoint && checkpoint.schemaWarnings > 0 && (
          <span className="pill warn">
            {openSchemaWarnings} open warnings{triagedSchemaWarnings > 0 ? ` · ${triagedSchemaWarnings} triaged` : ''}
          </span>
        )}
        <span className="pill">Raw Trace not trainable</span>
        <button className="secondary-button" onClick={props.onToggleWatch}>
          <Workflow size={16} />
          {props.source?.autoWatch ? 'Pause Watch' : 'Start Watch'}
        </button>
        <button className="icon-button" onClick={props.onRetry} title="重试失败导入">
          <RefreshCw size={16} />
        </button>
        <button className="primary-button" onClick={props.onSync} disabled={props.syncing}>
          {props.syncing ? <Loader2 className="spin" size={16} /> : <Play size={16} />}
          Sync
        </button>
      </div>
    </section>
  );
}

function FilterBar(props: {
  filters: Filters;
  projects: string[];
  onChange: (filters: Filters) => void;
}) {
  const update = (patch: Partial<Filters>) => props.onChange({ ...props.filters, ...patch });
  return (
    <section className="filters">
      <div className="search-box">
        <Search size={16} />
        <input
          value={props.filters.query}
          onChange={(event) => update({ query: event.target.value })}
          placeholder="搜索 trace、项目、session、模型"
        />
      </div>
      <select value={props.filters.projectKey} onChange={(event) => update({ projectKey: event.target.value })}>
        <option value="">All projects</option>
        {props.projects.map((project) => (
          <option key={project} value={project}>{project}</option>
        ))}
      </select>
      <select value={props.filters.ingestionStatus} onChange={(event) => update({ ingestionStatus: event.target.value })}>
        <option value="">All statuses</option>
        <option value="imported">Imported</option>
        <option value="updated">Updated</option>
        <option value="ingest_failed">Failed</option>
      </select>
      <select value={props.filters.riskLevel} onChange={(event) => update({ riskLevel: event.target.value })}>
        <option value="">All risk</option>
        <option value="L0">L0</option>
        <option value="L1">L1</option>
        <option value="L2">L2</option>
        <option value="L3">L3</option>
        <option value="L4">L4</option>
      </select>
      <select value={props.filters.scope} onChange={(event) => update({ scope: event.target.value })}>
        <option value="">All scopes</option>
        <option value="user">User</option>
        <option value="managed-task-worker">Worker</option>
      </select>
      <label className="check-filter">
        <input
          type="checkbox"
          checked={props.filters.hasEvidence}
          onChange={(event) => update({ hasEvidence: event.target.checked })}
        />
        Evidence
      </label>
      <label className="check-filter">
        <input
          type="checkbox"
          checked={props.filters.hasError}
          onChange={(event) => update({ hasError: event.target.checked })}
        />
        Failed
      </label>
      <button className="icon-button" title="清空筛选" onClick={() => props.onChange(defaultFilters)}>
        <Filter size={16} />
      </button>
    </section>
  );
}

function CommandPalettePanel(props: {
  items: CommandPaletteItem[];
  onOpen: (item: CommandPaletteItem) => void;
}) {
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<CommandPaletteKind | 'all'>('all');
  const kinds = useMemo(() => Array.from(new Set(props.items.map((item) => item.kind))), [props.items]);
  const normalizedQuery = query.trim().toLowerCase();
  const visibleItems = useMemo(() => {
    const scored = props.items
      .filter((item) => kind === 'all' || item.kind === kind)
      .map((item) => {
        const text = item.searchText.toLowerCase();
        const title = item.title.toLowerCase();
        const id = item.id.toLowerCase();
        let score = 0;
        if (!normalizedQuery) score += 1;
        else if (title.includes(normalizedQuery)) score += 40;
        else if (id.includes(normalizedQuery)) score += 32;
        else if (text.includes(normalizedQuery)) score += 18;
        return { item, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) =>
        b.score - a.score
        || (b.item.updatedAt ?? '').localeCompare(a.item.updatedAt ?? '')
        || a.item.title.localeCompare(b.item.title)
      );
    return scored.slice(0, normalizedQuery ? 14 : 10).map((entry) => entry.item);
  }, [kind, normalizedQuery, props.items]);

  return (
    <section className="entity-command-panel">
      <div className="panel-title">
        <Search size={16} />
        Entity Command
        <span className="panel-count">{visibleItems.length}/{props.items.length} results</span>
      </div>
      <div className="entity-command-controls">
        <div className="search-box entity-command-search">
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索 dataset、run、eval、gate、monitor、feedback、task"
          />
        </div>
        <div className="entity-command-kinds">
          <button className={kind === 'all' ? 'active' : ''} onClick={() => setKind('all')}>All</button>
          {kinds.map((itemKind) => (
            <button className={kind === itemKind ? 'active' : ''} key={itemKind} onClick={() => setKind(itemKind)}>
              {commandKindLabel(itemKind)}
            </button>
          ))}
        </div>
      </div>
      <div className="entity-command-results">
        {visibleItems.length === 0 ? (
          <p className="muted">没有匹配实体。可以试试 dataset 名称、run id、monitor 环境或任务标题。</p>
        ) : visibleItems.map((item) => (
          <button className="entity-command-result" key={`${item.kind}-${item.id}`} onClick={() => props.onOpen(item)}>
            <span className="entity-command-icon">{commandKindIcon(item.kind)}</span>
            <span className="entity-command-copy">
              <strong>{item.title}</strong>
              <small>{item.subtitle}</small>
            </span>
            <span className="entity-command-meta">
              <b>{commandKindLabel(item.kind)}</b>
              {item.status && <small>{item.status}</small>}
            </span>
            <small>{formatDate(item.updatedAt)}</small>
          </button>
        ))}
      </div>
    </section>
  );
}

function EntityInspectorPanel(props: {
  state?: EntityInspectorState;
  onOpenItem: (item: CommandPaletteItem) => void;
  onOpenEntity: (entity: TaskEntityRef) => void;
  onOpenTask: (id: string) => void;
  onClose: () => void;
}) {
  if (!props.state) return null;
  const { item, metrics, lineage, relatedTasks } = props.state;
  return (
    <section className="entity-inspector-panel">
      <div className="entity-inspector-head">
        <span className="entity-command-icon">{commandKindIcon(item.kind)}</span>
        <span className="entity-inspector-title">
          <small>{commandKindLabel(item.kind)}</small>
          <strong>{item.title}</strong>
          <b>{item.subtitle}</b>
        </span>
        <span className="entity-inspector-actions">
          {item.status && <span className="entity-inspector-status">{item.status}</span>}
          <button className="secondary-button" onClick={() => props.onOpenItem(item)}>
            <FileSearch size={14} />
            Locate
          </button>
          <button className="icon-button" onClick={props.onClose} aria-label="Close entity inspector" title="Close">
            <X size={15} />
          </button>
        </span>
      </div>

      <div className="entity-inspector-grid">
        <div className="entity-inspector-card">
          <div className="section-label">Snapshot</div>
          <div className="entity-inspector-metrics">
            {metrics.length === 0 ? (
              <div className="muted-box compact">No extra metrics captured for this entity yet.</div>
            ) : metrics.map((metric) => (
              <span className={inspectorMetricClass(metric.tone)} key={`${metric.label}-${metric.value}`}>
                <strong>{metric.value}</strong>
                <small>{metric.label}</small>
              </span>
            ))}
          </div>
        </div>

        <div className="entity-inspector-card">
          <div className="section-label">Lineage</div>
          <div className="entity-inspector-lineage">
            {lineage.length === 0 ? (
              <div className="muted-box compact">No upstream or downstream entity linked.</div>
            ) : lineage.map((entity) => (
              <button className="entity-lineage-chip" key={`${entity.kind}-${entity.id}`} onClick={() => props.onOpenEntity(entity)}>
                <span>{taskEntityKindLabel(entity.kind)}</span>
                <strong>{entity.label ?? entity.id}</strong>
              </button>
            ))}
          </div>
        </div>

        <div className="entity-inspector-card">
          <div className="section-label">Related tasks</div>
          <div className="entity-inspector-tasks">
            {relatedTasks.length === 0 ? (
              <div className="muted-box compact">No task is currently linked to this entity.</div>
            ) : relatedTasks.slice(0, 6).map((task) => (
              <button className="entity-task-row" key={task.id} onClick={() => props.onOpenTask(task.id)}>
                <span>
                  <strong>{task.title}</strong>
                  <small>{taskKindLabel(task.kind)} · {task.queue}</small>
                </span>
                <span className={taskStatusClass(task.status)}>{taskStatusLabel(task.status)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function LineageMapPanel(props: {
  state: LineageMapState;
  creatingAuditTaskActionId?: string;
  queuedAuditActionIds: string[];
  onOpenEntity: (entity: TaskEntityRef) => void;
  onOpenTask: (id: string) => void;
  onCreateTasks: (tasks: TraceOpsTaskCreateInput[], actionIds: string[]) => Promise<void>;
}) {
  const [filters, setFilters] = useState<LineageMapFilters>({ query: '', stage: 'all', mode: 'all' });
  const [auditResult, setAuditResult] = useState<LineageAuditResult>();
  const [auditActionStatuses, setAuditActionStatuses] = useState<Record<string, LineageAuditActionStatus>>({});
  const nodeByKey = new Map(props.state.nodes.map((node) => [node.key, node]));
  const taskLinkedKeys = new Set(props.state.tasks.flatMap((task) => task.entityRefs.map(lineageEntityKey)));
  const lockedNode = filters.lockedKey ? nodeByKey.get(filters.lockedKey) : undefined;
  const effectiveActiveKeys = lockedNode ? new Set([lockedNode.key]) : props.state.activeKeys;
  const upstreamKeys = new Set<string>();
  const downstreamKeys = new Set<string>();
  props.state.edges.forEach((edge) => {
    if (effectiveActiveKeys.has(edge.to)) upstreamKeys.add(edge.from);
    if (effectiveActiveKeys.has(edge.from)) downstreamKeys.add(edge.to);
  });
  const connectedKeys = new Set([...effectiveActiveKeys, ...upstreamKeys, ...downstreamKeys]);
  const viewState: LineageMapState = {
    ...props.state,
    activeKeys: effectiveActiveKeys,
    connectedKeys,
    upstreamNodes: Array.from(upstreamKeys)
      .map((key) => nodeByKey.get(key))
      .filter((node): node is LineageMapNode => Boolean(node))
      .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '')),
    downstreamNodes: Array.from(downstreamKeys)
      .map((key) => nodeByKey.get(key))
      .filter((node): node is LineageMapNode => Boolean(node))
      .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '')),
    relatedTasks: effectiveActiveKeys.size > 0
      ? props.state.tasks.filter((task) => task.entityRefs.some((ref) => effectiveActiveKeys.has(lineageEntityKey(ref))))
      : props.state.relatedTasks,
  };
  const activeNodes = props.state.nodes.filter((node) => effectiveActiveKeys.has(node.key)).slice(0, 3);
  const normalizedQuery = filters.query.trim().toLowerCase();
  const attentionEdgeKeys = new Set(props.state.edges.flatMap((edge) =>
    edge.tone === 'danger' || edge.tone === 'warn' ? [edge.from, edge.to] : []
  ));
  const filteredNodes = props.state.nodes.filter((node) => {
    if (filters.stage !== 'all' && node.stage !== filters.stage) return false;
    if (filters.mode === 'path' && effectiveActiveKeys.size > 0 && !connectedKeys.has(node.key)) return false;
    if (filters.mode === 'attention' && node.tone !== 'danger' && node.tone !== 'warn' && !attentionEdgeKeys.has(node.key)) return false;
    if (filters.mode === 'task_linked' && !taskLinkedKeys.has(node.key)) return false;
    if (!normalizedQuery) return true;
    return [
      node.id,
      node.kind,
      node.title,
      node.meta,
      node.status,
      taskEntityKindLabel(node.kind),
    ].filter(Boolean).join(' ').toLowerCase().includes(normalizedQuery);
  });
  const filteredNodeKeys = new Set(filteredNodes.map((node) => node.key));
  const visibleEdges = props.state.edges
    .filter((edge) =>
      filteredNodeKeys.has(edge.from)
      && filteredNodeKeys.has(edge.to)
      && (
        effectiveActiveKeys.size === 0
        || connectedKeys.has(edge.from)
        || connectedKeys.has(edge.to)
      )
    )
    .slice(0, 10);
  const sortStageNodes = (nodes: LineageMapNode[]) => [...nodes].sort((a, b) => {
    const activeRank = Number(effectiveActiveKeys.has(b.key)) - Number(effectiveActiveKeys.has(a.key));
    if (activeRank !== 0) return activeRank;
    const connectedRank = Number(connectedKeys.has(b.key)) - Number(connectedKeys.has(a.key));
    if (connectedRank !== 0) return connectedRank;
    return (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '') || a.title.localeCompare(b.title);
  });
  const lockableNode = activeNodes[0];
  const filterModes: LineageMapFilterMode[] = ['all', 'path', 'attention', 'task_linked'];
  const runLineageAudit = () => {
    const next = buildLineageAuditResult(viewState);
    setAuditResult(next);
    setAuditActionStatuses(Object.fromEntries(next.actions.map((action) => [action.id, 'todo'])));
  };
  const actionSummary = auditResult
    ? {
      done: auditResult.actions.filter((action) => auditActionStatuses[action.id] === 'done').length,
      total: auditResult.actions.length,
    }
    : { done: 0, total: 0 };
  const taskEntityRefsForAction = (action: LineageAuditAction): TaskEntityRef[] => {
    const refs = [
      ...viewState.nodes
        .filter((node) => node.stage === action.targetStage && (viewState.activeKeys.has(node.key) || viewState.connectedKeys.has(node.key)))
        .map((node) => node.entity),
      ...viewState.nodes
        .filter((node) => viewState.activeKeys.has(node.key))
        .map((node) => node.entity),
    ];
    return refs.filter((ref, index, list) =>
      index === list.findIndex((candidate) => candidate.kind === ref.kind && candidate.id === ref.id)
    ).slice(0, 6);
  };
  const toTaskInput = (action: LineageAuditAction): TraceOpsTaskCreateInput => ({
    kind: action.taskKind,
    title: action.title,
    description: `${action.detail}\n\nCreated from ${auditResult?.subject ?? 'Lineage audit'} · check=${action.checkId}`,
    priority: action.priority === 'critical' ? 'critical' : action.priority === 'high' ? 'high' : 'normal',
    entityRefs: taskEntityRefsForAction(action),
    createdBy: 'lineage-audit',
  });
  const queueAuditActions = async (actions: LineageAuditAction[]) => {
    const nextActions = actions.filter((action) => !props.queuedAuditActionIds.includes(action.id));
    if (nextActions.length === 0) return;
    await props.onCreateTasks(nextActions.map(toTaskInput), nextActions.map((action) => action.id));
    setAuditActionStatuses((current) => ({
      ...current,
      ...Object.fromEntries(nextActions.map((action) => [action.id, 'doing' as const])),
    }));
  };

  return (
    <section className="lineage-map-panel">
      <div className="lineage-map-head">
        <div>
          <div className="panel-title">
            <GitBranch size={16} />
            KodaX Lineage Map
          </div>
          <p>
            {activeNodes.length > 0
              ? `Focused on ${activeNodes.map((node) => `${taskEntityKindLabel(node.kind)} · ${node.title}`).join(' / ')}`
              : 'Click any entity to inspect the KodaX session-to-training lifecycle.'}
          </p>
        </div>
        <div className="lineage-map-summary">
          <span><strong>{filteredNodes.length}/{props.state.nodes.length}</strong><small>entities</small></span>
          <span><strong>{visibleEdges.length}/{props.state.edges.length}</strong><small>links</small></span>
          <span><strong>{viewState.relatedTasks.length}</strong><small>tasks</small></span>
        </div>
      </div>

      <div className="lineage-map-controls">
        <label className="search-box lineage-map-search">
          <Search size={15} />
          <input
            value={filters.query}
            onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
            placeholder="Filter lineage entities"
          />
        </label>
        <div className="lineage-mode-tabs" aria-label="Lineage filter mode">
          {filterModes.map((mode) => (
            <button
              className={filters.mode === mode ? 'active' : ''}
              key={mode}
              onClick={() => setFilters((current) => ({ ...current, mode }))}
            >
              {lineageFilterModeLabel(mode)}
            </button>
          ))}
        </div>
        <select
          className="lineage-stage-select"
          value={filters.stage}
          onChange={(event) => setFilters((current) => ({ ...current, stage: event.target.value as LineageMapFilters['stage'] }))}
          aria-label="Lineage stage"
        >
          <option value="all">All stages</option>
          {lineageMapStages.map((stage) => (
            <option value={stage.id} key={stage.id}>{stage.label}</option>
          ))}
        </select>
        {lockedNode ? (
          <button className="secondary-button lineage-lock-button active" onClick={() => setFilters((current) => ({ ...current, lockedKey: undefined }))}>
            <GitBranch size={14} />
            Unlock {lockedNode.title}
          </button>
        ) : (
          <button
            className="secondary-button lineage-lock-button"
            disabled={!lockableNode}
            onClick={() => {
              if (lockableNode) setFilters((current) => ({ ...current, lockedKey: lockableNode.key, mode: current.mode === 'all' ? 'path' : current.mode }));
            }}
          >
            <GitBranch size={14} />
            Lock path
          </button>
        )}
        <button className="secondary-button lineage-audit-button" onClick={runLineageAudit}>
          <ShieldAlert size={14} />
          Run audit
        </button>
      </div>

      <div className="lineage-map-body">
        <div className="lineage-stage-grid">
          {lineageMapStages.map((stage) => {
            const stageNodes = sortStageNodes(filteredNodes.filter((node) => node.stage === stage.id));
            const visibleNodes = stageNodes.slice(0, 8);
            return (
              <div className="lineage-stage" key={stage.id}>
                <div className="lineage-stage-head">
                  <strong>{stage.label}</strong>
                  <small>{stage.copy}</small>
                </div>
                <div className="lineage-stage-nodes">
                  {visibleNodes.length === 0 ? (
                    <div className="muted-box compact">No entity yet.</div>
                  ) : visibleNodes.map((node) => (
                    <button className={lineageNodeClass(node, viewState)} key={node.key} onClick={() => props.onOpenEntity(node.entity)}>
                      <span className="lineage-node-top">
                        <span className="entity-command-icon">{commandKindIcon(node.kind)}</span>
                        <span>
                          <strong>{node.title}</strong>
                          <small>{taskEntityKindLabel(node.kind)}</small>
                        </span>
                      </span>
                      <span className="lineage-node-meta">{node.meta}</span>
                      {node.status && <span className="lineage-node-status">{node.status}</span>}
                    </button>
                  ))}
                  {stageNodes.length > visibleNodes.length && (
                    <div className="lineage-stage-more">{stageNodes.length - visibleNodes.length} more in this stage</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <aside className="lineage-map-rail">
          <div className="lineage-rail-card lineage-audit-card">
            <div className="lineage-audit-card-head">
              <div className="section-label">Lineage audit</div>
              {auditResult && <span className={lineageAuditVerdictClass(auditResult.verdict)}>{lineageAuditVerdictLabel(auditResult.verdict)}</span>}
            </div>
            {!auditResult ? (
              <div className="muted-box compact">Run an audit to check train, release and rollback readiness for the current path.</div>
            ) : (
              <>
                <div className="lineage-audit-summary">
                  <strong>{auditResult.subject}</strong>
                  <small>{auditResult.summary} · {formatDate(auditResult.generatedAt)}</small>
                </div>
                <div className="lineage-audit-capabilities">
                  <span className={lineageAuditCapabilityClass(auditResult.capabilities.train)}>
                    <strong>{lineageAuditCapabilityLabel(auditResult.capabilities.train)}</strong>
                    <small>Train</small>
                  </span>
                  <span className={lineageAuditCapabilityClass(auditResult.capabilities.release)}>
                    <strong>{lineageAuditCapabilityLabel(auditResult.capabilities.release)}</strong>
                    <small>Release</small>
                  </span>
                  <span className={lineageAuditCapabilityClass(auditResult.capabilities.rollback)}>
                    <strong>{lineageAuditCapabilityLabel(auditResult.capabilities.rollback)}</strong>
                    <small>Rollback</small>
                  </span>
                </div>
                <div className="lineage-audit-checks">
                  {auditResult.checks.map((check) => (
                    <span className={lineageAuditCheckClass(check.status)} key={check.id}>
                      <strong>{check.label}</strong>
                      <small>{check.detail}</small>
                    </span>
                  ))}
                </div>
                <div className="lineage-audit-recommendations">
                  <strong>Next actions</strong>
                  {auditResult.recommendations.slice(0, 4).map((recommendation) => (
                    <small key={recommendation}>{recommendation}</small>
                  ))}
                </div>
                <div className="lineage-action-plan">
                  <div className="lineage-action-plan-head">
                    <span>
                      <strong>Action plan</strong>
                      <small>{actionSummary.done}/{actionSummary.total} done</small>
                    </span>
                    <button
                      className="secondary-button"
                      disabled={auditResult.actions.length === 0 || auditResult.actions.every((action) => props.queuedAuditActionIds.includes(action.id)) || Boolean(props.creatingAuditTaskActionId)}
                      onClick={() => queueAuditActions(auditResult.actions)}
                    >
                      <Workflow size={13} />
                      Queue all
                    </button>
                  </div>
                  {auditResult.actions.length === 0 ? (
                    <div className="muted-box compact">No remediation action is required for this audit.</div>
                  ) : auditResult.actions.map((action) => {
                    const status = auditActionStatuses[action.id] ?? 'todo';
                    const queued = props.queuedAuditActionIds.includes(action.id);
                    const creating = props.creatingAuditTaskActionId === action.id || props.creatingAuditTaskActionId === 'bulk';
                    return (
                      <div className="lineage-action-row" key={action.id}>
                        <div className="lineage-action-main">
                          <span className={lineageAuditActionPriorityClass(action.priority)}>{lineageAuditActionPriorityLabel(action.priority)}</span>
                          <span>
                            <strong>{action.title}</strong>
                            <small>{action.detail}</small>
                          </span>
                        </div>
                        <div className="lineage-action-meta">
                          <small>{action.owner} · {lineageMapStages.find((stage) => stage.id === action.targetStage)?.label}</small>
                          <span className={lineageAuditActionStatusClass(queued ? 'doing' : status)}>
                            {queued ? 'Queued' : lineageAuditActionStatusLabel(status)}
                          </span>
                        </div>
                        <div className="lineage-action-controls">
                          <button
                            className="secondary-button"
                            disabled={queued || creating}
                            onClick={() => queueAuditActions([action])}
                          >
                            {creating ? 'Queuing' : queued ? 'Queued' : 'Queue'}
                          </button>
                          <button
                            className="secondary-button"
                            onClick={() => setAuditActionStatuses((current) => ({ ...current, [action.id]: status === 'doing' ? 'todo' : 'doing' }))}
                          >
                            {status === 'doing' ? 'Pause' : 'Start'}
                          </button>
                          <button
                            className="secondary-button"
                            onClick={() => setAuditActionStatuses((current) => ({ ...current, [action.id]: status === 'done' ? 'todo' : 'done' }))}
                          >
                            {status === 'done' ? 'Reopen' : 'Done'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="lineage-rail-card">
            <div className="section-label">Active path</div>
            <div className="lineage-edge-list">
              {visibleEdges.length === 0 ? (
                <div className="muted-box compact">Select an entity to reveal its upstream and downstream path.</div>
              ) : visibleEdges.map((edge) => {
                const from = nodeByKey.get(edge.from);
                const to = nodeByKey.get(edge.to);
                if (!from || !to) return null;
                return (
                  <button className="lineage-edge-row" key={`${edge.from}-${edge.to}-${edge.label}`} onClick={() => props.onOpenEntity(to.entity)}>
                    <span>
                      <strong>{from.title}</strong>
                      <small>{taskEntityKindLabel(from.kind)}</small>
                    </span>
                    <b>{edge.label}</b>
                    <span>
                      <strong>{to.title}</strong>
                      <small>{taskEntityKindLabel(to.kind)}</small>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lineage-rail-card">
            <div className="section-label">Context</div>
            <div className="lineage-context-grid">
              <div>
                <strong>Upstream</strong>
                {viewState.upstreamNodes.length === 0 ? (
                  <small>No upstream entity</small>
                ) : viewState.upstreamNodes.slice(0, 4).map((node) => (
                  <button key={node.key} onClick={() => props.onOpenEntity(node.entity)}>{node.title}</button>
                ))}
              </div>
              <div>
                <strong>Downstream</strong>
                {viewState.downstreamNodes.length === 0 ? (
                  <small>No downstream entity</small>
                ) : viewState.downstreamNodes.slice(0, 4).map((node) => (
                  <button key={node.key} onClick={() => props.onOpenEntity(node.entity)}>{node.title}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="lineage-rail-card">
            <div className="section-label">Attention</div>
            <div className="lineage-insight-list">
              {props.state.insights.length === 0 ? (
                <div className="muted-box compact">No lineage gap detected in current workspace.</div>
              ) : props.state.insights.slice(0, 5).map((insight) => (
                <span className={lineageInsightClass(insight.tone)} key={`${insight.label}-${insight.detail}`}>
                  <strong>{insight.label}</strong>
                  <small>{insight.detail}</small>
                </span>
              ))}
            </div>
          </div>

          <div className="lineage-rail-card">
            <div className="section-label">Related tasks</div>
            <div className="lineage-task-list">
              {viewState.relatedTasks.length === 0 ? (
                <div className="muted-box compact">No task currently points at this path.</div>
              ) : viewState.relatedTasks.slice(0, 5).map((task) => (
                <button className="entity-task-row" key={task.id} onClick={() => props.onOpenTask(task.id)}>
                  <span>
                    <strong>{task.title}</strong>
                    <small>{taskKindLabel(task.kind)} · {task.queue}</small>
                  </span>
                  <span className={taskStatusClass(task.status)}>{taskStatusLabel(task.status)}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function TraceTable(props: {
  traces: RawTrace[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  if (props.traces.length === 0) {
    return (
      <div className="empty-state">
        <Database size={30} />
        <h3>还没有接收到 KodaX session</h3>
        <p>先点击 Sync 导入本机 KodaX session。Raw Trace 会默认保持不可训练状态。</p>
      </div>
    );
  }

  return (
    <div className="trace-table">
      <div className="table-head">
        <span>Trace</span>
        <span>Project</span>
        <span>Source</span>
        <span>Scope</span>
        <span>Model</span>
        <span>Status</span>
        <span>Risk</span>
        <span>Tools</span>
        <span>Evidence</span>
        <span>Updated</span>
      </div>
      {props.traces.map((trace) => (
        <button
          className={`table-row ${props.selectedId === trace.id ? 'selected' : ''}`}
          key={trace.id}
          onClick={() => props.onSelect(trace.id)}
        >
          <span>
            <strong>{trace.title}</strong>
            <small>{compact(trace.sourceSessionId)}</small>
          </span>
          <span>{trace.projectKey ?? '-'}</span>
          <span>{trace.runtime.surface ?? 'kodax-cli'}</span>
          <span>{trace.runtime.scope ?? '-'}</span>
          <span>{compact([trace.runtime.provider, trace.runtime.model].filter(Boolean).join(' / '))}</span>
          <span><b className={statusClass(trace.ingestionStatus)}>{trace.ingestionStatus}</b></span>
          <span><b className={riskClass(trace.risk.level)}>{trace.risk.level}</b></span>
          <span>{trace.counts.toolUseEvents}</span>
          <span>{trace.counts.artifactLedgerEntries}</span>
          <span>{formatDate(trace.updatedAt)}</span>
        </button>
      ))}
    </div>
  );
}

function Timeline(props: {
  events: RawTraceEvent[];
  selectedEventId?: string;
  onSelect: (event: RawTraceEvent) => void;
}) {
  return (
    <div className="timeline">
      {props.events.map((event) => (
        <button
          key={event.id}
          className={`timeline-item ${props.selectedEventId === event.id ? 'selected' : ''} ${event.active === false ? 'off-path' : ''}`}
          onClick={() => props.onSelect(event)}
        >
          <span className="timeline-icon">{eventIcon(event.type)}</span>
          <span className="timeline-copy">
            <strong>{event.label}</strong>
            <small>{event.preview || event.type}</small>
          </span>
          {event.riskLevel && <span className={riskClass(event.riskLevel)}>{event.riskLevel}</span>}
        </button>
      ))}
    </div>
  );
}

function EvidenceList(props: { evidence: RawEvidence[] }) {
  if (props.evidence.length === 0) {
    return <div className="muted-box">这条 Raw Trace 还没有 evidence。</div>;
  }
  return (
    <div className="evidence-list">
      {props.evidence.map((item) => (
        <div className="evidence-item" key={item.id}>
          <div className="evidence-top">
            <span className="evidence-kind">{item.kind}</span>
            <span className={riskClass(item.riskLevel)}>{item.riskLevel}</span>
          </div>
          <strong>{item.displayTarget ?? item.target}</strong>
          <p>{item.summary ?? item.action ?? 'No summary'}</p>
          <small>{item.id} · {formatDate(item.timestamp)} · {item.sourceTool ?? 'unknown tool'}</small>
        </div>
      ))}
    </div>
  );
}

function BlockerList(props: { blockers: string[] }) {
  if (props.blockers.length === 0) {
    return <div className="blocker-list clear">No blockers detected. Still requires explicit approval before training.</div>;
  }
  return (
    <ul className="blocker-list">
      {props.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
    </ul>
  );
}

function DatasetCandidateDetail(props: {
  samples: TrainingSample[];
  events: RawTraceEvent[];
  evidence: RawEvidence[];
  errors: TraceDetail['errors'];
  reviewingSampleId?: string;
  onReviewSample: (sampleId: string, decision: 'approved' | 'rejected') => void;
}) {
  const [selectedSampleId, setSelectedSampleId] = useState<string>();
  const orderedSamples = useMemo(() => {
    const rank = new Map(datasetBuilderKinds.map((item, index) => [item.kind, index]));
    return [...props.samples].sort((a, b) =>
      (rank.get(a.kind as never) ?? 99) - (rank.get(b.kind as never) ?? 99)
      || b.quality.score - a.quality.score
    );
  }, [props.samples]);

  useEffect(() => {
    if (orderedSamples.length === 0) {
      setSelectedSampleId(undefined);
      return;
    }
    if (!selectedSampleId || !orderedSamples.some((sample) => sample.id === selectedSampleId)) {
      setSelectedSampleId(orderedSamples[0].id);
    }
  }, [orderedSamples, selectedSampleId]);

  const sample = orderedSamples.find((item) => item.id === selectedSampleId) ?? orderedSamples[0];
  if (!sample) {
    return <div className="muted-box">这条 Raw Trace 暂未生成训练样本候选。</div>;
  }
  const reviewing = props.reviewingSampleId === sample.id;
  const canApprove = sample.status === 'needs_review' && sample.quality.grade !== 'blocked' && sample.metadata.distillation.readyForFineTune && !reviewing;
  const canReject = sample.status !== 'blocked' && !reviewing;
  const distillation = sample.metadata.distillation;
  const sourceSignals = sample.metadata.datasetBuilder?.sourceSignals ?? [];

  return (
    <div className="dataset-detail">
      <div className="sample-kind-strip">
        {orderedSamples.map((item) => (
          <button
            className={`sample-kind-button ${item.id === sample.id ? 'active' : ''}`}
            key={item.id}
            onClick={() => setSelectedSampleId(item.id)}
          >
            <strong>{item.kind}</strong>
            <span className={sampleStatusClass(item.status)}>{item.status}</span>
          </button>
        ))}
      </div>
      <div className="dataset-head">
        <div>
          <div className="eyebrow">Dataset Builder Sample</div>
          <h3>{sample.kind}</h3>
        </div>
        <div className="detail-badges">
          <span className={sampleStatusClass(sample.status)}>{sample.status}</span>
          <span className={riskClass(sample.riskLevel)}>{sample.riskLevel}</span>
          <span className={sample.trainable ? 'pill good' : 'pill danger'}>
            {sample.trainable ? 'trainable' : 'not trainable'}
          </span>
          <span className="pill">{sample.labels?.length ?? 0} labels</span>
        </div>
      </div>
      <div className="sample-review-actions">
        <button className="primary-button" disabled={!canApprove} onClick={() => props.onReviewSample(sample.id, 'approved')}>
          {reviewing ? <Loader2 className="spin" size={16} /> : <CheckCircle2 size={16} />}
          Approve
        </button>
        <button className="secondary-button" disabled={!canReject} onClick={() => props.onReviewSample(sample.id, 'rejected')}>
          <ShieldAlert size={16} />
          Reject
        </button>
      </div>
      <div className="sample-summary-grid">
        <div>
          <span>Tool Events</span>
          <strong>{sample.toolEventCount}</strong>
        </div>
        <div>
          <span>Evidence</span>
          <strong>{sample.evidenceCount}</strong>
        </div>
        <div>
          <span>Events</span>
          <strong>{sample.eventCount}</strong>
        </div>
        <div>
          <span>Redactions</span>
          <strong>{distillation.redactionCount}</strong>
        </div>
        <div>
          <span>Quality</span>
          <strong>{sample.quality.score}</strong>
        </div>
      </div>
      <section>
        <div className="section-label">Builder view</div>
        <SampleBuilderView
          sample={sample}
          events={props.events}
          evidence={props.evidence}
          errors={props.errors}
        />
      </section>
      <section>
        <div className="section-label">Quality signals</div>
        <div className="quality-card">
          <span className={qualityClass(sample.quality.grade)}>{sample.quality.grade}</span>
          <span className="quality-score">{sample.quality.score}/100</span>
          <div className="quality-signals">
            {sample.quality.signals.slice(0, 6).map((signal) => (
              <span className={`signal signal-${signal.impact}`} key={`${signal.label}-${signal.detail}`}>
                {signal.label}
              </span>
            ))}
          </div>
        </div>
      </section>
      <section>
        <div className="section-label">Clean user goal</div>
        <p className="sample-text">{sample.input.cleanUserGoal || sample.promptPreview || 'No prompt captured'}</p>
      </section>
      <section>
        <div className="section-label">Clean assistant outcome</div>
        <p className="sample-text">{sample.output.cleanAssistantOutcome || sample.responsePreview || 'No outcome captured'}</p>
      </section>
      <section>
        <div className="section-label">Distillation</div>
        <div className="distill-card">
          <span className={distillation.readyForFineTune ? 'pill good' : 'pill danger'}>
            {distillation.readyForFineTune ? 'ready text' : 'not ready'}
          </span>
          <span className="pill">{distillation.version}</span>
          {distillation.removedThinking && <span className="pill good">thinking removed</span>}
          <span className="pill">{distillation.redactionCount} redactions</span>
          {sourceSignals.map((signal) => <span className="pill" key={signal}>{signal}</span>)}
        </div>
      </section>
      {sample.labels?.length > 0 && (
        <section>
          <div className="section-label">Labels</div>
          <div className="distill-card">
            {sample.labels.map((label) => <span className="pill" key={label}>{label}</span>)}
          </div>
        </section>
      )}
      <section>
        <div className="section-label">Governance blockers</div>
        <BlockerList blockers={sample.blockers} />
      </section>
      {sample.review && (
        <section>
          <div className="section-label">Review decision</div>
          <div className="review-card">
            <strong>{sample.review.decision}</strong>
            <span>{sample.review.reviewer} · {formatDate(sample.review.decidedAt)}</span>
            {sample.review.note && <p>{sample.review.note}</p>}
          </div>
        </section>
      )}
    </div>
  );
}

function SampleBuilderView(props: {
  sample: TrainingSample;
  events: RawTraceEvent[];
  evidence: RawEvidence[];
  errors: TraceDetail['errors'];
}) {
  const toolEvents = props.sample.input.toolEventIds
    .map((id) => props.events.find((event) => event.id === id))
    .filter((event): event is RawTraceEvent => !!event);
  const linkedEvidence = props.sample.input.evidenceIds
    .map((id) => props.evidence.find((item) => item.id === id))
    .filter((item): item is RawEvidence => !!item);
  const sourceEvents = (props.sample.input.sourceEventIds ?? [])
    .map((id) => props.events.find((event) => event.id === id))
    .filter((event): event is RawTraceEvent => !!event);

  if (props.sample.kind === 'tool_use') {
    return (
      <div className="builder-view-grid">
        <SampleToolList tools={toolEvents} />
        <SampleEvidenceMiniList evidence={linkedEvidence} empty="No evidence linked to this tool-use sample." />
      </div>
    );
  }

  if (props.sample.kind === 'eval') {
    return (
      <div className="builder-view-grid">
        <div className="sample-text">
          <strong>Expected behavior</strong>
          <p>{props.sample.output.cleanAssistantOutcome || props.sample.responsePreview}</p>
        </div>
        <SampleEvidenceMiniList evidence={linkedEvidence} empty="No explicit check_result evidence; eval uses final outcome as expected behavior." />
      </div>
    );
  }

  if (props.sample.kind === 'repair') {
    return (
      <div className="builder-view-grid">
        <div>
          <div className="section-label">Failure signals</div>
          {props.errors.length === 0 ? (
            <div className="muted-box compact">No ingest error metadata linked.</div>
          ) : props.errors.map((error) => (
            <div className="source-row" key={error.id}>
              <strong>{error.errorType}</strong>
              <small>{error.message}</small>
            </div>
          ))}
        </div>
        <div>
          <div className="section-label">Recovery output</div>
          <p className="sample-text">{props.sample.output.cleanAssistantOutcome || props.sample.responsePreview}</p>
        </div>
      </div>
    );
  }

  if (props.sample.kind === 'planning' || props.sample.kind === 'preference') {
    return (
      <div className="builder-view-grid">
        <div>
          <div className="section-label">Source events</div>
          {sourceEvents.length === 0 ? (
            <div className="muted-box compact">No explicit planning or branch events linked.</div>
          ) : sourceEvents.slice(0, 6).map((event) => (
            <div className="source-row" key={event.id}>
              <strong>{event.label}</strong>
              <small>{event.preview}</small>
            </div>
          ))}
        </div>
        <div>
          <div className="section-label">Generated builder output</div>
          <p className="sample-text">{props.sample.output.cleanAssistantOutcome || props.sample.responsePreview}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="builder-view-grid">
      <div>
        <div className="section-label">Instruction</div>
        <p className="sample-text">{props.sample.input.cleanUserGoal || props.sample.promptPreview}</p>
      </div>
      <div>
        <div className="section-label">Response</div>
        <p className="sample-text">{props.sample.output.cleanAssistantOutcome || props.sample.responsePreview}</p>
      </div>
    </div>
  );
}

function SampleToolList(props: { tools: RawTraceEvent[] }) {
  if (props.tools.length === 0) {
    return <div className="muted-box compact">No tool events linked to this sample.</div>;
  }
  return (
    <div>
      <div className="section-label">Tool chain</div>
      {props.tools.slice(0, 10).map((event, index) => (
        <div className="source-row" key={event.id}>
          <strong>{index + 1}. {toolName(event)}</strong>
          <small>{event.preview || event.type}</small>
        </div>
      ))}
    </div>
  );
}

function SampleEvidenceMiniList(props: { evidence: RawEvidence[]; empty: string }) {
  if (props.evidence.length === 0) {
    return <div className="muted-box compact">{props.empty}</div>;
  }
  return (
    <div>
      <div className="section-label">Evidence</div>
      {props.evidence.slice(0, 8).map((item) => (
        <div className="source-row" key={item.id}>
          <strong>{item.kind}</strong>
          <small>{item.summary ?? item.displayTarget ?? item.target}</small>
        </div>
      ))}
    </div>
  );
}

function TrainingSamplesPanel(props: {
  samples: TrainingSample[];
  totals: TrainingSampleListResponse['totals'];
  filters: Filters;
  onSelectTrace: (id: string) => void;
}) {
  const exportParams = toParams(props.filters);
  const candidateParams = new URLSearchParams(exportParams);
  candidateParams.set('status', 'candidate');
  const reviewParams = new URLSearchParams(exportParams);
  reviewParams.set('status', 'needs_review');

  return (
    <section className="sample-panel">
      <div className="panel-title">
        <Database size={16} />
        Dataset Candidate Pool
        <span className="panel-count">{props.totals.total} generated</span>
        <div className="sample-actions">
          <a className="export-link" href={trainingSampleExportUrl(candidateParams, 'eval_jsonl')} download title="导出评测 candidate JSONL">
            <Download size={14} />
            Eval Dataset
          </a>
          <a className="export-link" href={trainingSampleExportUrl(reviewParams, 'review_jsonl')} download title="导出待审核样本 JSONL">
            <Download size={14} />
            Review
          </a>
          <a className="export-link" href={trainingSampleExportUrl(exportParams, 'traceops_jsonl')} download title="导出 TraceOps 完整样本 JSONL">
            <Download size={14} />
            TraceOps
          </a>
        </div>
      </div>
      {props.samples.length === 0 ? (
        <p className="muted">还没有 Trace 数据集候选。先同步 KodaX session。</p>
      ) : (
        <div className="sample-table">
          <div className="sample-head-row">
            <span>Candidate</span>
            <span>Kind</span>
            <span>Status</span>
            <span>Risk</span>
            <span>Quality</span>
            <span>Tool Events</span>
            <span>Evidence</span>
            <span>Blockers</span>
          </div>
          {props.samples.slice(0, 10).map((sample) => (
            <button className="sample-row" key={sample.id} onClick={() => props.onSelectTrace(sample.traceId)}>
              <span>
                <strong>{sample.title}</strong>
                <small>{sample.promptPreview}</small>
              </span>
              <span>{sample.kind}</span>
              <span><b className={sampleStatusClass(sample.status)}>{sample.status}</b></span>
              <span><b className={riskClass(sample.riskLevel)}>{sample.riskLevel}</b></span>
              <span><b className={qualityClass(sample.quality.grade)}>{sample.quality.score}</b></span>
              <span>{sample.toolEventCount}</span>
              <span>{sample.evidenceCount}</span>
              <span>{sample.blockers.length}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function ReviewQueuePanel(props: {
  samples: TrainingSample[];
  focus?: ReviewQueueFocus;
  allowedKinds?: DatasetBuilderKind[];
  onSelectTrace: (id: string) => void;
  onReviewSamples: (sampleIds: string[], decision: 'approved' | 'rejected') => Promise<void>;
}) {
  const [filters, setFilters] = useState<ReviewQueueFilters>(defaultReviewQueueFilters);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [processing, setProcessing] = useState<'approved' | 'rejected' | undefined>();

  useEffect(() => {
    if (!props.focus) return;
    setFilters((current) => ({ ...current, kind: props.focus?.kind ?? '', status: props.focus?.status ?? 'needs_review' }));
    setSelectedIds([]);
  }, [props.focus]);

  const update = (patch: Partial<ReviewQueueFilters>) => setFilters((current) => ({ ...current, ...patch }));
  const filteredSamples = useMemo(() => props.samples.filter((sample) => {
    if (filters.kind && sample.kind !== filters.kind) return false;
    if (filters.status && sample.status !== filters.status) return false;
    if (filters.qualityGrade && sample.quality.grade !== filters.qualityGrade) return false;
    if (filters.riskLevel && sample.riskLevel !== filters.riskLevel) return false;
    if (filters.missingEvidence && !(sample.toolEventCount > 0 && sample.evidenceCount === 0)) return false;
    if (filters.redacted && sample.metadata.distillation.redactionCount === 0) return false;
    if (filters.readyOnly && !sample.metadata.distillation.readyForFineTune) return false;
    return true;
  }), [props.samples, filters]);

  const visibleSamples = filteredSamples.slice(0, 12);
  const selectedSet = new Set(selectedIds);
  const selectedSamples = props.samples.filter((sample) => selectedSet.has(sample.id));
  const approveEligible = selectedSamples.filter((sample) =>
    sample.status === 'needs_review'
    && sample.quality.grade !== 'blocked'
    && sample.metadata.distillation.readyForFineTune
  );
  const rejectEligible = selectedSamples.filter((sample) => sample.status !== 'blocked');

  function toggle(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function selectVisible() {
    setSelectedIds(Array.from(new Set([...selectedIds, ...visibleSamples.map((sample) => sample.id)])));
  }

  async function runBulk(decision: 'approved' | 'rejected') {
    const ids = decision === 'approved' ? approveEligible.map((sample) => sample.id) : rejectEligible.map((sample) => sample.id);
    if (ids.length === 0) return;
    setProcessing(decision);
    try {
      await props.onReviewSamples(ids, decision);
      setSelectedIds([]);
    } finally {
      setProcessing(undefined);
    }
  }

  const selectedParams = new URLSearchParams();
  if (selectedIds.length > 0) selectedParams.set('sampleIds', selectedIds.join(','));

  return (
    <section className="review-panel">
      <div className="panel-title">
        <ShieldAlert size={16} />
        Review Queue
        <span className="panel-count">{filteredSamples.length} in view · {selectedIds.length} selected</span>
      </div>
      <div className="review-toolbar">
        <select value={filters.kind} onChange={(event) => update({ kind: event.target.value })}>
          <option value="">All kinds</option>
          {datasetBuilderKinds.filter((item) => !props.allowedKinds || props.allowedKinds.includes(item.kind)).map((item) => (
            <option key={item.kind} value={item.kind}>{item.label}</option>
          ))}
        </select>
        <select value={filters.status} onChange={(event) => update({ status: event.target.value })}>
          <option value="">All status</option>
          <option value="needs_review">Needs review</option>
          <option value="candidate">Candidate</option>
          <option value="blocked">Blocked</option>
        </select>
        <select value={filters.qualityGrade} onChange={(event) => update({ qualityGrade: event.target.value })}>
          <option value="">All quality</option>
          <option value="excellent">Excellent</option>
          <option value="good">Good</option>
          <option value="review">Review</option>
          <option value="blocked">Blocked</option>
        </select>
        <select value={filters.riskLevel} onChange={(event) => update({ riskLevel: event.target.value })}>
          <option value="">All risk</option>
          <option value="L0">L0</option>
          <option value="L1">L1</option>
          <option value="L2">L2</option>
          <option value="L3">L3</option>
          <option value="L4">L4</option>
        </select>
        <label className="check-filter">
          <input type="checkbox" checked={filters.missingEvidence} onChange={(event) => update({ missingEvidence: event.target.checked })} />
          Missing evidence
        </label>
        <label className="check-filter">
          <input type="checkbox" checked={filters.redacted} onChange={(event) => update({ redacted: event.target.checked })} />
          Redacted
        </label>
        <label className="check-filter">
          <input type="checkbox" checked={filters.readyOnly} onChange={(event) => update({ readyOnly: event.target.checked })} />
          Ready text
        </label>
        <button className="secondary-button" onClick={selectVisible}>Select visible</button>
        <button className="icon-button" title="清空队列筛选" onClick={() => setFilters(defaultReviewQueueFilters)}>
          <Filter size={16} />
        </button>
      </div>
      <div className="review-actions">
        <button className="primary-button" disabled={approveEligible.length === 0 || !!processing} onClick={() => runBulk('approved')}>
          {processing === 'approved' ? <Loader2 className="spin" size={16} /> : <CheckCircle2 size={16} />}
          Approve eligible {approveEligible.length}
        </button>
        <button className="secondary-button" disabled={rejectEligible.length === 0 || !!processing} onClick={() => runBulk('rejected')}>
          {processing === 'rejected' ? <Loader2 className="spin" size={16} /> : <ShieldAlert size={16} />}
          Reject selected {rejectEligible.length}
        </button>
        <a className={`export-link ${selectedIds.length === 0 ? 'disabled-link' : ''}`} href={selectedIds.length ? trainingSampleExportUrl(selectedParams, 'review_jsonl') : undefined}>
          <Download size={14} />
          Export selected
        </a>
        <button className="secondary-button" disabled={selectedIds.length === 0} onClick={() => setSelectedIds([])}>Clear selection</button>
      </div>
      {visibleSamples.length === 0 ? (
        <p className="muted">当前筛选下没有需要处理的样本。</p>
      ) : (
        <div className="review-table">
          <div className="review-head-row">
            <span></span>
            <span>Sample</span>
            <span>Status</span>
            <span>Risk</span>
            <span>Quality</span>
            <span>Evidence</span>
            <span>Actions</span>
          </div>
          {visibleSamples.map((sample) => {
            const canApprove = sample.status === 'needs_review' && sample.quality.grade !== 'blocked' && sample.metadata.distillation.readyForFineTune;
            return (
              <div className="review-row" key={sample.id}>
                <input type="checkbox" checked={selectedSet.has(sample.id)} onChange={() => toggle(sample.id)} />
                <button className="row-link" onClick={() => props.onSelectTrace(sample.traceId)}>
                  <strong>{sample.title}</strong>
                  <small>{sampleKindLabel(sample.kind)} · {sample.promptPreview}</small>
                </button>
                <span><b className={sampleStatusClass(sample.status)}>{sample.status}</b></span>
                <span><b className={riskClass(sample.riskLevel)}>{sample.riskLevel}</b></span>
                <span><b className={qualityClass(sample.quality.grade)}>{sample.quality.score}</b></span>
                <span>{sample.evidenceCount}/{sample.toolEventCount}</span>
                <span className="row-actions">
                  <button className="secondary-button" onClick={() => props.onSelectTrace(sample.traceId)}>Open</button>
                  <button className="secondary-button" disabled={!canApprove || !!processing} onClick={() => props.onReviewSamples([sample.id], 'approved')}>Approve</button>
                  <button className="secondary-button" disabled={sample.status === 'blocked' || !!processing} onClick={() => props.onReviewSamples([sample.id], 'rejected')}>Reject</button>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function RepairWorkbenchPanel(props: {
  samples: TrainingSample[];
  onSelectTrace: (id: string) => void;
  onReviewSamples: (sampleIds: string[], decision: 'approved' | 'rejected') => Promise<void>;
  onRepairSample: (sampleId: string, input: {
    cleanUserGoal?: string;
    cleanAssistantOutcome?: string;
    relinkedEvidenceIds?: string[];
    evidenceGapNote?: string;
    note?: string;
  }) => Promise<void>;
  onLoadEvidenceCandidates: (sampleId: string) => Promise<TrainingSampleEvidenceCandidate[]>;
  onReviewKind: (kind: DatasetBuilderKind) => void;
}) {
  const [kind, setKind] = useState('');
  const [lane, setLane] = useState<RepairLane | ''>('');
  const [issue, setIssue] = useState<RepairIssueKey | ''>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [repairingId, setRepairingId] = useState<string>();
  const [repairProcessingId, setRepairProcessingId] = useState<string>();
  const [evidenceCandidateLoadingId, setEvidenceCandidateLoadingId] = useState<string>();
  const [evidenceCandidateSampleId, setEvidenceCandidateSampleId] = useState<string>();
  const [evidenceCandidates, setEvidenceCandidates] = useState<TrainingSampleEvidenceCandidate[]>([]);
  const [repairDraft, setRepairDraft] = useState({
    cleanUserGoal: '',
    cleanAssistantOutcome: '',
    relinkedEvidenceIds: '',
    evidenceGapNote: '',
    note: '',
  });

  const allRepairItems = useMemo(() => props.samples
    .map((sample) => {
      const issues = repairIssuesForSample(sample);
      return {
        sample,
        issues,
        lane: repairLaneForSample(sample, issues),
        actions: repairActionLabels(sample, issues),
      };
    })
    .filter((item) => item.sample.status !== 'candidate' || item.issues.length > 0), [props.samples]);

  const filteredItems = useMemo(() => allRepairItems
    .filter((item) => !kind || item.sample.kind === kind)
    .filter((item) => !lane || item.lane === lane)
    .filter((item) => !issue || item.issues.includes(issue))
    .sort((a, b) =>
      repairLaneRank(a.lane) - repairLaneRank(b.lane)
      || a.sample.quality.score - b.sample.quality.score
      || a.sample.title.localeCompare(b.sample.title)
    ), [allRepairItems, kind, lane, issue]);

  const visibleItems = filteredItems.slice(0, 12);
  const selectedSet = new Set(selectedIds);
  const selectedSamples = props.samples.filter((sample) => selectedSet.has(sample.id));
  const rejectEligible = selectedSamples.filter((sample) => sample.status !== 'blocked');
  const selectedParams = new URLSearchParams();
  const visibleParams = new URLSearchParams();
  if (selectedIds.length > 0) selectedParams.set('sampleIds', selectedIds.join(','));
  if (visibleItems.length > 0) visibleParams.set('sampleIds', visibleItems.map((item) => item.sample.id).join(','));

  const lockedCount = allRepairItems.filter((item) => item.lane === 'governance_lock').length;
  const rewriteCount = allRepairItems.filter((item) => item.lane === 'rewrite_needed').length;
  const reviewReadyCount = allRepairItems.filter((item) => item.lane === 'review_ready').length;
  const missingEvidenceCount = allRepairItems.filter((item) => item.issues.includes('missing_evidence')).length;

  function updateSelected(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function selectVisible() {
    setSelectedIds(Array.from(new Set([...selectedIds, ...visibleItems.map((item) => item.sample.id)])));
  }

  function draftEvidenceIds(): string[] {
    return repairDraft.relinkedEvidenceIds
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function setDraftEvidenceIds(ids: string[]) {
    updateRepairDraft({
      relinkedEvidenceIds: Array.from(new Set(ids)).join('\n'),
    });
  }

  function addEvidenceCandidate(evidenceId: string) {
    setDraftEvidenceIds([...draftEvidenceIds(), evidenceId]);
  }

  function addSuggestedEvidence() {
    const suggestedIds = evidenceCandidates
      .filter((candidate) => !candidate.alreadyLinked && candidate.confidence >= 45)
      .slice(0, 5)
      .map((candidate) => candidate.evidenceId);
    setDraftEvidenceIds([...draftEvidenceIds(), ...suggestedIds]);
  }

  async function openRepair(sample: TrainingSample) {
    if (repairingId === sample.id) {
      setRepairingId(undefined);
      return;
    }
    setRepairingId(sample.id);
    setRepairDraft({
      cleanUserGoal: sample.repair?.cleanUserGoal ?? sample.input.cleanUserGoal ?? sample.promptPreview,
      cleanAssistantOutcome: sample.repair?.cleanAssistantOutcome ?? sample.output.cleanAssistantOutcome ?? sample.responsePreview,
      relinkedEvidenceIds: sample.repair?.relinkedEvidenceIds.join('\n') ?? sample.input.evidenceIds.join('\n'),
      evidenceGapNote: sample.repair?.evidenceGapNote ?? '',
      note: sample.repair?.note ?? '',
    });
    setEvidenceCandidateSampleId(sample.id);
    setEvidenceCandidates([]);
    setEvidenceCandidateLoadingId(sample.id);
    try {
      const candidates = await props.onLoadEvidenceCandidates(sample.id);
      setEvidenceCandidateSampleId(sample.id);
      setEvidenceCandidates(candidates);
    } finally {
      setEvidenceCandidateLoadingId(undefined);
    }
  }

  function updateRepairDraft(patch: Partial<typeof repairDraft>) {
    setRepairDraft((current) => ({ ...current, ...patch }));
  }

  async function submitRepair(sampleId: string) {
    setRepairProcessingId(sampleId);
    try {
      await props.onRepairSample(sampleId, {
        cleanUserGoal: repairDraft.cleanUserGoal,
        cleanAssistantOutcome: repairDraft.cleanAssistantOutcome,
        relinkedEvidenceIds: repairDraft.relinkedEvidenceIds
          .split(/[\n,]+/)
          .map((item) => item.trim())
          .filter(Boolean),
        evidenceGapNote: repairDraft.evidenceGapNote,
        note: repairDraft.note,
      });
      setRepairingId(undefined);
    } finally {
      setRepairProcessingId(undefined);
    }
  }

  async function quarantineSelected() {
    if (rejectEligible.length === 0) return;
    setProcessing(true);
    try {
      await props.onReviewSamples(rejectEligible.map((sample) => sample.id), 'rejected');
      setSelectedIds([]);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <section className="repair-panel">
      <div className="panel-title">
        <Wrench size={16} />
        Sample Repair Workbench
        <span className="panel-count">{filteredItems.length} in view · {selectedIds.length} selected</span>
      </div>
      <div className="repair-stats">
        <span>
          <strong>{lockedCount}</strong>
          Governance lock
        </span>
        <span>
          <strong>{rewriteCount}</strong>
          Rewrite needed
        </span>
        <span>
          <strong>{reviewReadyCount}</strong>
          Review ready
        </span>
        <span>
          <strong>{missingEvidenceCount}</strong>
          Missing evidence
        </span>
      </div>
      <div className="repair-toolbar">
        <select value={kind} onChange={(event) => setKind(event.target.value)}>
          <option value="">All kinds</option>
          {datasetBuilderKinds.map((item) => (
            <option key={item.kind} value={item.kind}>{item.label}</option>
          ))}
        </select>
        <select value={lane} onChange={(event) => setLane(event.target.value as RepairLane | '')}>
          <option value="">All lanes</option>
          <option value="governance_lock">Governance lock</option>
          <option value="rewrite_needed">Rewrite needed</option>
          <option value="review_ready">Review ready</option>
        </select>
        <select value={issue} onChange={(event) => setIssue(event.target.value as RepairIssueKey | '')}>
          <option value="">All issues</option>
          {repairIssueOrder.map((item) => (
            <option key={item} value={item}>{repairIssueCopy[item].label}</option>
          ))}
        </select>
        <button className="secondary-button" onClick={selectVisible}>Select visible</button>
        <button
          className="icon-button"
          title="清空修复筛选"
          onClick={() => {
            setKind('');
            setLane('');
            setIssue('');
          }}
        >
          <Filter size={16} />
        </button>
      </div>
      <div className="repair-actions">
        <a className={`export-link ${selectedIds.length === 0 ? 'disabled-link' : ''}`} href={selectedIds.length ? trainingSampleExportUrl(selectedParams, 'repair_jsonl') : undefined} download>
          <Download size={14} />
          Export selected repair pack
        </a>
        <a className={`export-link ${visibleItems.length === 0 ? 'disabled-link' : ''}`} href={visibleItems.length ? trainingSampleExportUrl(visibleParams, 'repair_jsonl') : undefined} download>
          <Download size={14} />
          Export visible repair pack
        </a>
        <button className="secondary-button" disabled={rejectEligible.length === 0 || processing} onClick={quarantineSelected}>
          {processing ? <Loader2 className="spin" size={16} /> : <Archive size={16} />}
          Quarantine selected {rejectEligible.length}
        </button>
        <button className="secondary-button" disabled={selectedIds.length === 0} onClick={() => setSelectedIds([])}>Clear selection</button>
      </div>
      {visibleItems.length === 0 ? (
        <p className="muted">当前没有需要修复或隔离的样本。</p>
      ) : (
        <div className="repair-table">
          <div className="repair-head-row">
            <span></span>
            <span>Sample</span>
            <span>Lane</span>
            <span>Issues</span>
            <span>Risk</span>
            <span>Quality</span>
            <span>Repair action</span>
            <span>Actions</span>
          </div>
          {visibleItems.map((item) => {
            const reviewKind = datasetBuilderKindForSample(item.sample.kind);
            const selectedEvidenceIds = new Set(draftEvidenceIds());
            const showEvidenceCandidates = evidenceCandidateSampleId === item.sample.id;
            return (
              <div className="repair-row-group" key={item.sample.id}>
                <div className={`repair-row repair-row-${item.lane.replace(/_/g, '-')}`}>
                  <input type="checkbox" checked={selectedSet.has(item.sample.id)} onChange={() => updateSelected(item.sample.id)} />
                  <button className="row-link" onClick={() => props.onSelectTrace(item.sample.traceId)}>
                    <strong>{item.sample.title}</strong>
                    <small>{sampleKindLabel(item.sample.kind)} · {item.sample.promptPreview}</small>
                  </button>
                  <span><b className={repairLaneClass(item.lane)}>{repairLaneLabel(item.lane)}</b></span>
                  <span className="repair-issue-list">
                    {item.sample.repair && <b className="repair-issue repair-issue-neutral">Repaired</b>}
                    {item.issues.slice(0, 3).map((repairIssue) => (
                      <b className={`repair-issue repair-issue-${repairIssueCopy[repairIssue].tone}`} key={repairIssue}>
                        {repairIssueCopy[repairIssue].label}
                      </b>
                    ))}
                    {item.issues.length > 3 && <b className="repair-issue repair-issue-neutral">+{item.issues.length - 3}</b>}
                  </span>
                  <span><b className={riskClass(item.sample.riskLevel)}>{item.sample.riskLevel}</b></span>
                  <span><b className={qualityClass(item.sample.quality.grade)}>{item.sample.quality.score}</b></span>
                  <span className="repair-action-list">
                    {item.actions.slice(0, 2).map((action) => <small key={action}>{action}</small>)}
                  </span>
                  <span className="row-actions">
                    <button className="secondary-button" onClick={() => props.onSelectTrace(item.sample.traceId)}>Open</button>
                    <button className="secondary-button" onClick={() => void openRepair(item.sample)}>
                      <Wrench size={14} />
                      Repair
                    </button>
                    <button className="secondary-button" disabled={!reviewKind} onClick={() => reviewKind && props.onReviewKind(reviewKind)}>
                      <Filter size={14} />
                      Queue
                    </button>
                  </span>
                </div>
                {repairingId === item.sample.id && (
                  <div className="repair-editor">
                    <label>
                      <span>Clean user goal</span>
                      <textarea value={repairDraft.cleanUserGoal} onChange={(event) => updateRepairDraft({ cleanUserGoal: event.target.value })} />
                    </label>
                    <label>
                      <span>Clean assistant outcome</span>
                      <textarea value={repairDraft.cleanAssistantOutcome} onChange={(event) => updateRepairDraft({ cleanAssistantOutcome: event.target.value })} />
                    </label>
                    <label>
                      <span>Relinked evidence ids</span>
                      <textarea value={repairDraft.relinkedEvidenceIds} onChange={(event) => updateRepairDraft({ relinkedEvidenceIds: event.target.value })} />
                    </label>
                    <div className="evidence-linker">
                      <div className="evidence-linker-head">
                        <span>
                          <FileSearch size={14} />
                          Evidence candidates
                        </span>
                        <button
                          className="secondary-button"
                          disabled={!showEvidenceCandidates || evidenceCandidates.filter((candidate) => !selectedEvidenceIds.has(candidate.evidenceId) && candidate.confidence >= 45).length === 0}
                          onClick={addSuggestedEvidence}
                        >
                          Add suggested
                        </button>
                      </div>
                      {evidenceCandidateLoadingId === item.sample.id ? (
                        <div className="muted-box compact"><Loader2 className="spin" size={14} /> Loading candidates</div>
                      ) : !showEvidenceCandidates || evidenceCandidates.length === 0 ? (
                        <div className="muted-box compact">No same-trace evidence candidates found.</div>
                      ) : (
                        <div className="evidence-candidate-list">
                          {evidenceCandidates.slice(0, 8).map((candidate) => {
                            const selected = selectedEvidenceIds.has(candidate.evidenceId);
                            return (
                              <div className={`evidence-candidate ${selected ? 'selected' : ''}`} key={candidate.evidenceId}>
                                <div className="evidence-candidate-top">
                                  <span className="evidence-kind">{candidate.evidence.kind}</span>
                                  <b className={riskClass(candidate.evidence.riskLevel)}>{candidate.evidence.riskLevel}</b>
                                  <strong>{candidate.confidence}</strong>
                                </div>
                                <p>{candidate.evidence.summary ?? candidate.evidence.displayTarget ?? candidate.evidence.target}</p>
                                <small>{candidate.reasons.slice(0, 2).join(' · ')}</small>
                                <div className="evidence-candidate-actions">
                                  <code>{candidate.evidenceId}</code>
                                  <button className="secondary-button" disabled={selected} onClick={() => addEvidenceCandidate(candidate.evidenceId)}>
                                    {selected ? <CheckCircle2 size={14} /> : <FileSearch size={14} />}
                                    {selected ? 'Linked' : 'Add'}
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <label>
                      <span>Evidence / repair note</span>
                      <textarea value={repairDraft.evidenceGapNote || repairDraft.note} onChange={(event) => {
                        updateRepairDraft({ evidenceGapNote: event.target.value, note: event.target.value });
                      }} />
                    </label>
                    <div className="repair-editor-actions">
                      <span className="muted-inline">
                        {item.sample.repair ? `Last repair: ${formatDate(item.sample.repair.repairedAt)}` : 'Repair will reset old review and send sample back to review.'}
                      </span>
                      <button className="secondary-button" onClick={() => setRepairingId(undefined)}>Cancel</button>
                      <button className="primary-button" disabled={repairProcessingId === item.sample.id} onClick={() => submitRepair(item.sample.id)}>
                        {repairProcessingId === item.sample.id ? <Loader2 className="spin" size={14} /> : <CheckCircle2 size={14} />}
                        Submit repair
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function MemoryCandidateWorkbench(props: {
  candidates: MemoryCandidate[];
  totals: MemoryCandidateListResponse['totals'];
  processingId?: string;
  onSelectTrace: (id: string) => void;
  onReviewCandidate: (candidateId: string, decision: 'promoted' | 'rejected') => Promise<void>;
}) {
  const [kind, setKind] = useState('');
  const [status, setStatus] = useState('');
  const [readyOnly, setReadyOnly] = useState(false);

  const filteredCandidates = useMemo(() => props.candidates
    .filter((candidate) => !kind || candidate.kind === kind)
    .filter((candidate) => !status || candidate.status === status)
    .filter((candidate) => !readyOnly || candidate.metadata.readyForMemoryBase)
    .slice(0, 14), [props.candidates, kind, status, readyOnly]);

  return (
    <section className="memory-panel">
      <div className="panel-title">
        <BookOpenCheck size={16} />
        Memory Candidate Workbench
        <span className="panel-count">{filteredCandidates.length} in view · {props.totals.promoted} promoted</span>
      </div>
      <div className="memory-stats">
        <span>
          <strong>{props.totals.candidate}</strong>
          Candidate
        </span>
        <span>
          <strong>{props.totals.needsReview}</strong>
          Needs review
        </span>
        <span>
          <strong>{props.totals.blocked}</strong>
          Blocked
        </span>
        <span>
          <strong>{props.totals.averageConfidence}</strong>
          Avg confidence
        </span>
      </div>
      <div className="memory-toolbar">
        <select value={kind} onChange={(event) => setKind(event.target.value)}>
          <option value="">All memory types</option>
          <option value="workflow_pattern">Workflow</option>
          <option value="project_knowledge">Project knowledge</option>
          <option value="failure_recovery">Failure recovery</option>
          <option value="tool_practice">Tool practice</option>
          <option value="decision_record">Decision record</option>
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All status</option>
          <option value="candidate">Candidate</option>
          <option value="needs_review">Needs review</option>
          <option value="promoted">Promoted</option>
          <option value="rejected">Rejected</option>
          <option value="blocked">Blocked</option>
        </select>
        <label className="check-filter">
          <input type="checkbox" checked={readyOnly} onChange={(event) => setReadyOnly(event.target.checked)} />
          Ready only
        </label>
        <button
          className="icon-button"
          title="清空记忆候选筛选"
          onClick={() => {
            setKind('');
            setStatus('');
            setReadyOnly(false);
          }}
        >
          <Filter size={16} />
        </button>
      </div>
      {filteredCandidates.length === 0 ? (
        <p className="muted">当前筛选下没有企业记忆候选。同步更多 KodaX session 后会自动生成。</p>
      ) : (
        <div className="memory-table">
          <div className="memory-head-row">
            <span>Memory candidate</span>
            <span>Type</span>
            <span>Status</span>
            <span>Risk</span>
            <span>Confidence</span>
            <span>Sources</span>
            <span>Actions</span>
          </div>
          {filteredCandidates.map((candidate) => {
            const processing = props.processingId === candidate.id;
            const canPromote = candidate.status !== 'blocked' && candidate.status !== 'promoted' && candidate.status !== 'rejected';
            const canReject = candidate.status !== 'rejected' && candidate.status !== 'promoted';
            return (
              <div className="memory-row" key={candidate.id}>
                <button className="row-link" onClick={() => props.onSelectTrace(candidate.traceId)}>
                  <strong>{candidate.summary}</strong>
                  <small>{candidate.title} · {candidate.triggers.slice(0, 2).join(' / ')}</small>
                </button>
                <span>{memoryKindLabel(candidate.kind)}</span>
                <span><b className={memoryStatusClass(candidate.status)}>{candidate.status}</b></span>
                <span><b className={riskClass(candidate.riskLevel)}>{candidate.riskLevel}</b></span>
                <span><b className={qualityClass(candidate.confidence >= 82 ? 'excellent' : candidate.confidence >= 68 ? 'good' : candidate.confidence >= 45 ? 'review' : 'blocked')}>{candidate.confidence}</b></span>
                <span className="memory-source-counts">
                  <small>{candidate.evidenceIds.length} evidence</small>
                  <small>{candidate.sampleIds.length} samples</small>
                </span>
                <span className="row-actions">
                  <button className="secondary-button" onClick={() => props.onSelectTrace(candidate.traceId)}>Open</button>
                  <button className="secondary-button" disabled={!canPromote || processing} onClick={() => props.onReviewCandidate(candidate.id, 'promoted')}>
                    {processing ? <Loader2 className="spin" size={14} /> : <CheckCircle2 size={14} />}
                    Promote
                  </button>
                  <button className="secondary-button" disabled={!canReject || processing} onClick={() => props.onReviewCandidate(candidate.id, 'rejected')}>
                    <ShieldAlert size={14} />
                    Reject
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function toolPayload(event: RawTraceEvent): Record<string, unknown> {
  if (isRecord(event.payload) && event.type === 'tool_call' && isRecord(event.payload.tool)) {
    return event.payload.tool;
  }
  return isRecord(event.payload) ? event.payload : {};
}

function toolName(event: RawTraceEvent): string {
  const payload = toolPayload(event);
  return String(payload.name ?? payload.toolName ?? event.label.replace(/^Tool (card|call|result):\s*/, '') ?? 'unknown');
}

function toolStatus(event: RawTraceEvent): string {
  const payload = toolPayload(event);
  if (typeof payload.status === 'string') return payload.status;
  if (event.type === 'tool_result') return 'result';
  if (event.type === 'tool_use') return 'started';
  return 'unknown';
}

function toolOutput(event: RawTraceEvent): unknown {
  const payload = toolPayload(event);
  return payload.output ?? payload.content ?? payload.error ?? payload.preview;
}

function ToolReplay(props: {
  events: RawTraceEvent[];
  onSelect: (event: RawTraceEvent) => void;
}) {
  const tools = props.events.filter((event) =>
    event.type === 'tool_call' || event.type === 'tool_use' || event.type === 'tool_result'
  );

  if (tools.length === 0) {
    return (
      <div className="muted-box">
        这条 Raw Trace 没有工具调用。若 KodaX session 只有普通对话，这里会保持为空。
      </div>
    );
  }

  return (
    <div className="tool-list">
      {tools.map((event) => {
        const payload = toolPayload(event);
        const duration =
          typeof payload.startTime === 'number' && typeof payload.endTime === 'number'
            ? `${Math.max(0, payload.endTime - payload.startTime)}ms`
            : undefined;
        return (
          <button className="tool-card" key={event.id} onClick={() => props.onSelect(event)}>
            <div className="tool-card-top">
              <span className="tool-name">
                <TerminalSquare size={16} />
                {toolName(event)}
              </span>
              <span className={`tool-status tool-status-${toolStatus(event).replace(/_/g, '-')}`}>
                {toolStatus(event)}
              </span>
            </div>
            <div className="tool-preview">{event.preview || 'No preview'}</div>
            <div className="tool-meta">
              <span>{event.type}</span>
              {duration && <span>{duration}</span>}
              {event.riskLevel && <span className={riskClass(event.riskLevel)}>{event.riskLevel}</span>}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function ToolEventDetail(props: { event: RawTraceEvent }) {
  const payload = toolPayload(props.event);
  const input = payload.input;
  const output = toolOutput(props.event);
  return (
    <div className="tool-detail">
      <div className="tool-detail-head">
        <div>
          <div className="eyebrow">Tool Replay</div>
          <h3>{toolName(props.event)}</h3>
        </div>
        <span className={`tool-status tool-status-${toolStatus(props.event).replace(/_/g, '-')}`}>
          {toolStatus(props.event)}
        </span>
      </div>
      <div className="kv-grid">
        <div>
          <span>Event type</span>
          <strong>{props.event.type}</strong>
        </div>
        <div>
          <span>Occurred</span>
          <strong>{formatDate(props.event.occurredAt)}</strong>
        </div>
        <div>
          <span>Risk</span>
          <strong>{props.event.riskLevel ?? '-'}</strong>
        </div>
      </div>
      <div className="tool-io-grid">
        <section>
          <div className="section-label">Input</div>
          <JsonPanel value={input ?? payload} />
        </section>
        <section>
          <div className="section-label">Output</div>
          <JsonPanel value={output ?? 'No output captured'} />
        </section>
      </div>
    </div>
  );
}

function JsonPanel(props: { value: unknown }) {
  return <pre className="json-panel">{JSON.stringify(props.value, null, 2)}</pre>;
}

function DetailPanel(props: {
  detail?: TraceDetail;
  loading: boolean;
  reviewingSampleId?: string;
  onReviewSample: (sampleId: string, decision: 'approved' | 'rejected') => void;
}) {
  const [tab, setTab] = useState<DetailTab>('timeline');
  const [selectedEvent, setSelectedEvent] = useState<RawTraceEvent | undefined>();

  useEffect(() => {
    const firstOperationalEvent = props.detail?.events.find((event) =>
      event.type === 'tool_call' || event.type === 'tool_use' || event.type === 'tool_result',
    );
    setSelectedEvent(firstOperationalEvent ?? props.detail?.events[0]);
    setTab('timeline');
  }, [props.detail?.trace.id]);

  if (props.loading) {
    return (
      <section className="detail-shell center">
        <Loader2 className="spin" size={24} />
        <span>Loading Raw Trace</span>
      </section>
    );
  }

  if (!props.detail) {
    return (
      <section className="detail-shell center">
        <History size={28} />
        <span>选择一条 Raw Trace 查看回放和证据链</span>
      </section>
    );
  }

  const { trace } = props.detail;
  return (
    <section className="detail-shell">
      <div className="detail-header">
        <div>
          <div className="eyebrow">Raw Trace Detail</div>
          <h2>{trace.title}</h2>
          <p>{trace.projectKey ?? 'unknown project'} · {trace.sourceSessionId}</p>
        </div>
        <div className="detail-badges">
          <span className={statusClass(trace.ingestionStatus)}>{trace.ingestionStatus}</span>
          <span className={riskClass(trace.risk.level)}>{trace.risk.level}</span>
          <span className="pill danger">not trainable</span>
        </div>
      </div>

      <div className="detail-tabs">
        <button className={tab === 'timeline' ? 'active' : ''} onClick={() => setTab('timeline')}>Timeline</button>
        <button className={tab === 'tools' ? 'active' : ''} onClick={() => setTab('tools')}>Tools</button>
        <button className={tab === 'evidence' ? 'active' : ''} onClick={() => setTab('evidence')}>Evidence</button>
        <button className={tab === 'dataset' ? 'active' : ''} onClick={() => setTab('dataset')}>Dataset</button>
        <button className={tab === 'runtime' ? 'active' : ''} onClick={() => setTab('runtime')}>Runtime</button>
        <button className={tab === 'diagnostics' ? 'active' : ''} onClick={() => setTab('diagnostics')}>Diagnostics</button>
      </div>

      {tab === 'timeline' && (
        <div className="detail-grid">
          <Timeline
            events={props.detail.events}
            selectedEventId={selectedEvent?.id}
            onSelect={setSelectedEvent}
          />
          <div className="event-detail">
            <div className="event-title">
              <span>{selectedEvent ? eventIcon(selectedEvent.type) : <Braces size={15} />}</span>
              <strong>{selectedEvent?.label ?? 'No event selected'}</strong>
            </div>
            {selectedEvent ? (
              selectedEvent.type === 'tool_call' || selectedEvent.type === 'tool_use' || selectedEvent.type === 'tool_result'
                ? <ToolEventDetail event={selectedEvent} />
                : <JsonPanel value={selectedEvent.payload} />
            ) : <div className="muted-box">选择左侧事件</div>}
          </div>
        </div>
      )}

      {tab === 'tools' && (
        <ToolReplay
          events={props.detail.events}
          onSelect={(event) => {
            setSelectedEvent(event);
            setTab('timeline');
          }}
        />
      )}
      {tab === 'evidence' && <EvidenceList evidence={props.detail.evidence} />}
      {tab === 'dataset' && (
        <DatasetCandidateDetail
          samples={props.detail.trainingSamples}
          events={props.detail.events}
          evidence={props.detail.evidence}
          errors={props.detail.errors}
          reviewingSampleId={props.reviewingSampleId}
          onReviewSample={props.onReviewSample}
        />
      )}
      {tab === 'runtime' && <JsonPanel value={{ runtime: trace.runtime, counts: trace.counts, risk: trace.risk }} />}
      {tab === 'diagnostics' && <JsonPanel value={{ revisions: props.detail.revisions, errors: props.detail.errors }} />}
    </section>
  );
}

function taskKindLabel(kind: TraceOpsTaskRecord['kind']): string {
  return kind.split('_').map((part) => part[0]?.toUpperCase() + part.slice(1)).join(' ');
}

function taskStatusLabel(status: TraceOpsTaskRecord['status']): string {
  if (status === 'succeeded') return 'Succeeded';
  if (status === 'retrying') return 'Retrying';
  if (status === 'cancelled') return 'Cancelled';
  return status[0]?.toUpperCase() + status.slice(1);
}

function taskStatusClass(status: TraceOpsTaskRecord['status']): string {
  return `task-status task-status-${status}`;
}

function taskPriorityClass(priority: TraceOpsTaskRecord['priority']): string {
  return `task-priority task-priority-${priority}`;
}

function taskEntityText(task: TraceOpsTaskRecord): string {
  const primary = task.entityRefs[0];
  if (!primary) return 'No linked entity';
  const label = primary.label ? `${primary.label} · ` : '';
  return `${label}${primary.kind}:${primary.id}`;
}

function taskEntityKindLabel(kind: TraceOpsTaskRecord['entityRefs'][number]['kind']): string {
  return kind.split('_').map((part) => part[0]?.toUpperCase() + part.slice(1)).join(' ');
}

function commandKindLabel(kind: CommandPaletteKind): string {
  if (kind === 'task') return 'Task';
  return taskEntityKindLabel(kind);
}

function commandKindIcon(kind: CommandPaletteKind) {
  if (kind === 'task') return <Workflow size={14} />;
  if (kind === 'trace') return <TerminalSquare size={14} />;
  if (kind === 'dataset_version') return <Database size={14} />;
  if (kind === 'training_run') return <Server size={14} />;
  if (kind === 'eval_run') return <BookOpenCheck size={14} />;
  if (kind === 'model_release_gate') return <ShieldAlert size={14} />;
  if (kind === 'deployment_handoff') return <HardDrive size={14} />;
  if (kind === 'post_release_monitor') return <History size={14} />;
  if (kind === 'feedback_loop') return <GitBranch size={14} />;
  return <FileSearch size={14} />;
}

function lineageNodeKey(kind: TaskEntityRef['kind'], id: string): string {
  return `${kind}:${id}`;
}

function lineageEntityKey(entity: TaskEntityRef): string {
  return lineageNodeKey(entity.kind, entity.id);
}

function lineageStageForKind(kind: TaskEntityRef['kind']): LineageMapStageId {
  if (kind === 'ingest_job' || kind === 'trace') return 'capture';
  if (kind === 'dataset_version') return 'dataset';
  if (kind === 'release_manifest' || kind === 'release_promotion' || kind === 'retraining_handoff') return 'release';
  if (kind === 'training_run' || kind === 'eval_run' || kind === 'model_release_gate') return 'training';
  if (kind === 'deployment_handoff' || kind === 'post_release_monitor') return 'rollout';
  return 'feedback';
}

function lineageFilterModeLabel(mode: LineageMapFilterMode): string {
  if (mode === 'path') return 'Active path';
  if (mode === 'attention') return 'Attention';
  if (mode === 'task_linked') return 'With tasks';
  return 'All';
}

function lineageAuditVerdictLabel(verdict: LineageAuditVerdict): string {
  if (verdict === 'ready') return 'Ready';
  if (verdict === 'blocked') return 'Blocked';
  return 'Needs review';
}

function lineageAuditCapabilityLabel(capability: LineageAuditCapability): string {
  if (capability === 'ready') return 'Ready';
  if (capability === 'blocked') return 'Blocked';
  return 'Review';
}

function lineageAuditVerdictClass(verdict: LineageAuditVerdict): string {
  return `lineage-audit-verdict lineage-audit-verdict-${verdict}`;
}

function lineageAuditCapabilityClass(capability: LineageAuditCapability): string {
  return `lineage-audit-capability lineage-audit-capability-${capability}`;
}

function lineageAuditCheckClass(status: LineageAuditCheckStatus): string {
  return `lineage-audit-check lineage-audit-check-${status}`;
}

function lineageAuditActionPriorityLabel(priority: LineageAuditActionPriority): string {
  if (priority === 'critical') return 'Critical';
  if (priority === 'high') return 'High';
  return 'Normal';
}

function lineageAuditActionPriorityClass(priority: LineageAuditActionPriority): string {
  return `lineage-action-priority lineage-action-priority-${priority}`;
}

function lineageAuditActionStatusLabel(status: LineageAuditActionStatus): string {
  if (status === 'doing') return 'Doing';
  if (status === 'done') return 'Done';
  return 'To do';
}

function lineageAuditActionStatusClass(status: LineageAuditActionStatus): string {
  return `lineage-action-status lineage-action-status-${status}`;
}

function buildLineageAuditActions(checks: LineageAuditCheck[]): LineageAuditAction[] {
  const actionByCheck: Record<string, Omit<LineageAuditAction, 'id' | 'checkId' | 'priority'>> = {
    'dataset-source': {
      taskKind: 'dataset_build',
      title: 'Create a dataset version',
      detail: 'Build a trainable dataset from approved KodaX samples before continuing.',
      owner: 'Dataset owner',
      targetStage: 'dataset',
    },
    'trace-evidence': {
      taskKind: 'trace_cleaning',
      title: 'Reconnect KodaX evidence',
      detail: 'Open the source trace and repair missing evidence or upstream session linkage.',
      owner: 'TraceOps reviewer',
      targetStage: 'capture',
    },
    'dataset-quality': {
      taskKind: 'dataset_build',
      title: 'Repair dataset quality',
      detail: 'Review low-quality samples, missing evidence and redaction blockers.',
      owner: 'Dataset reviewer',
      targetStage: 'dataset',
    },
    'release-package': {
      taskKind: 'release_manifest',
      title: 'Generate release manifest',
      detail: 'Package the dataset with release gate, risk summary and export manifest.',
      owner: 'Release owner',
      targetStage: 'release',
    },
    'training-eval': {
      taskKind: 'eval_run',
      title: 'Run training and eval',
      detail: 'Launch or complete training, then attach an eval run before gate review.',
      owner: 'Training owner',
      targetStage: 'training',
    },
    'model-gate': {
      taskKind: 'model_release_gate',
      title: 'Create model release gate',
      detail: 'Review metrics, eval result and rollback guardrails before rollout.',
      owner: 'Model gate owner',
      targetStage: 'training',
    },
    rollback: {
      taskKind: 'post_release_monitor',
      title: 'Prepare rollback monitoring',
      detail: 'Attach deployment handoff and post-release monitor for rollback readiness.',
      owner: 'Deployment owner',
      targetStage: 'rollout',
    },
    'task-health': {
      taskKind: 'closed_loop',
      title: 'Repair failed tasks',
      detail: 'Use Task Center to retry or resolve failed linked tasks.',
      owner: 'Ops owner',
      targetStage: 'feedback',
    },
  };
  return checks
    .filter((check) => check.status !== 'passed')
    .map((check) => {
      const action = actionByCheck[check.id] ?? {
        taskKind: 'closed_loop' as TraceOpsTaskKind,
        title: check.label,
        detail: check.detail,
        owner: 'TraceOps owner',
        targetStage: 'dataset' as LineageMapStageId,
      };
      return {
        ...action,
        id: `action-${check.id}`,
        checkId: check.id,
        priority: check.status === 'failed' ? 'critical' : 'high',
      };
    });
}

function buildLineageAuditResult(state: LineageMapState): LineageAuditResult {
  const scopedNodes = state.activeKeys.size > 0
    ? state.nodes.filter((node) => state.activeKeys.has(node.key) || state.connectedKeys.has(node.key))
    : state.nodes;
  const scopedKeys = new Set(scopedNodes.map((node) => node.key));
  const scopedEdges = state.edges.filter((edge) => scopedKeys.has(edge.from) && scopedKeys.has(edge.to));
  const nodesByKind = (kind: TaskEntityRef['kind']) => scopedNodes.filter((node) => node.kind === kind);
  const has = (kind: TaskEntityRef['kind']) => nodesByKind(kind).length > 0;
  const dangerousNodes = scopedNodes.filter((node) => node.tone === 'danger');
  const warningNodes = scopedNodes.filter((node) => node.tone === 'warn');
  const dangerousEdges = scopedEdges.filter((edge) => edge.tone === 'danger');
  const warningEdges = scopedEdges.filter((edge) => edge.tone === 'warn');
  const failedTasks = state.relatedTasks.filter((task) => task.status === 'failed' || task.status === 'cancelled');
  const runningTasks = state.relatedTasks.filter((task) => task.status === 'queued' || task.status === 'running' || task.status === 'retrying');
  const activeNode = scopedNodes.find((node) => state.activeKeys.has(node.key));
  const subject = activeNode
    ? `${taskEntityKindLabel(activeNode.kind)} · ${activeNode.title}`
    : 'Workspace lineage';
  const checks: LineageAuditCheck[] = [];
  const addCheck = (id: string, label: string, detail: string, status: LineageAuditCheckStatus) => {
    checks.push({ id, label, detail, status });
  };

  const datasetNodes = nodesByKind('dataset_version');
  const highQualityDatasets = datasetNodes.filter((node) => !node.meta.includes('Q0') && node.tone !== 'danger');
  addCheck(
    'dataset-source',
    'Dataset source coverage',
    has('dataset_version')
      ? `${datasetNodes.length} dataset version is connected to the current audit scope.`
      : 'No dataset version is connected to this audit scope.',
    has('dataset_version') ? 'passed' : 'failed',
  );
  addCheck(
    'trace-evidence',
    'KodaX evidence chain',
    has('trace')
      ? `${nodesByKind('trace').length} KodaX trace is linked upstream.`
      : 'No upstream KodaX trace is visible for this scope.',
    has('trace') ? 'passed' : has('dataset_version') ? 'warning' : 'failed',
  );
  addCheck(
    'dataset-quality',
    'Dataset quality',
    highQualityDatasets.length > 0
      ? `${highQualityDatasets.length} dataset version passes the local quality heuristic.`
      : 'Dataset quality is weak or missing for this scope.',
    highQualityDatasets.length > 0 ? (warningNodes.some((node) => node.kind === 'dataset_version') ? 'warning' : 'passed') : 'failed',
  );
  addCheck(
    'release-package',
    'Release package',
    has('release_manifest')
      ? `${nodesByKind('release_manifest').length} release manifest is available.`
      : 'No release manifest is available yet.',
    has('release_manifest') ? (dangerousNodes.some((node) => node.kind === 'release_manifest') ? 'failed' : 'passed') : 'warning',
  );
  addCheck(
    'training-eval',
    'Training and eval',
    has('training_run') || has('eval_run')
      ? `${nodesByKind('training_run').length} training run and ${nodesByKind('eval_run').length} eval run are connected.`
      : 'No training or eval record is connected yet.',
    has('training_run') && has('eval_run')
      ? (dangerousNodes.some((node) => node.kind === 'training_run' || node.kind === 'eval_run') ? 'failed' : 'passed')
      : has('training_run') ? 'warning' : 'failed',
  );
  addCheck(
    'model-gate',
    'Model release gate',
    has('model_release_gate')
      ? `${nodesByKind('model_release_gate').length} model gate is connected.`
      : 'No model release gate has been created.',
    has('model_release_gate')
      ? (dangerousNodes.some((node) => node.kind === 'model_release_gate') ? 'failed' : 'passed')
      : 'warning',
  );
  addCheck(
    'rollback',
    'Rollback and monitoring',
    has('deployment_handoff') || has('post_release_monitor')
      ? `${nodesByKind('deployment_handoff').length} deployment handoff and ${nodesByKind('post_release_monitor').length} monitor are connected.`
      : 'No deployment or post-release monitor is connected yet.',
    has('deployment_handoff') && has('post_release_monitor')
      ? (dangerousNodes.some((node) => node.kind === 'deployment_handoff' || node.kind === 'post_release_monitor') ? 'failed' : 'passed')
      : has('deployment_handoff') ? 'warning' : 'failed',
  );
  addCheck(
    'task-health',
    'Task health',
    failedTasks.length > 0
      ? `${failedTasks.length} linked task failed.`
      : runningTasks.length > 0
        ? `${runningTasks.length} linked task is still in progress.`
        : 'No failed task is attached to this audit scope.',
    failedTasks.length > 0 ? 'failed' : runningTasks.length > 0 ? 'warning' : 'passed',
  );

  const failedChecks = checks.filter((check) => check.status === 'failed');
  const warningChecks = checks.filter((check) => check.status === 'warning');
  const train: LineageAuditCapability = checks.some((check) => ['dataset-source', 'dataset-quality', 'trace-evidence', 'task-health'].includes(check.id) && check.status === 'failed')
    ? 'blocked'
    : warningChecks.some((check) => ['dataset-quality', 'trace-evidence', 'task-health'].includes(check.id))
      ? 'review'
      : 'ready';
  const release: LineageAuditCapability = checks.some((check) => ['release-package', 'training-eval', 'model-gate', 'task-health'].includes(check.id) && check.status === 'failed')
    ? 'blocked'
    : warningChecks.some((check) => ['release-package', 'training-eval', 'model-gate', 'task-health'].includes(check.id))
      ? 'review'
      : 'ready';
  const rollback: LineageAuditCapability = checks.some((check) => ['rollback', 'task-health'].includes(check.id) && check.status === 'failed')
    ? 'blocked'
    : warningChecks.some((check) => ['rollback', 'task-health'].includes(check.id))
      ? 'review'
      : 'ready';
  const verdict: LineageAuditVerdict = failedChecks.length > 0 ? 'blocked' : warningChecks.length > 0 ? 'needs_review' : 'ready';
  const recommendations = [
    !has('dataset_version') ? 'Create or select a dataset version from approved KodaX samples.' : undefined,
    !has('release_manifest') ? 'Generate a release manifest before handing off retraining.' : undefined,
    !has('eval_run') && has('training_run') ? 'Run eval before model gate review.' : undefined,
    !has('model_release_gate') ? 'Create a model release gate for deployment approval.' : undefined,
    !has('post_release_monitor') && has('deployment_handoff') ? 'Attach a post-release monitor before marking rollout complete.' : undefined,
    dangerousNodes.length > 0 || dangerousEdges.length > 0 ? 'Resolve red nodes or dangerous lineage links before promotion.' : undefined,
    warningNodes.length > 0 || warningEdges.length > 0 ? 'Review warning nodes and lineage links before final approval.' : undefined,
    failedTasks.length > 0 ? 'Retry or repair failed linked tasks from Task Center.' : undefined,
  ].filter((item): item is string => Boolean(item));

  return {
    id: `audit-${Date.now()}`,
    subject,
    generatedAt: new Date().toISOString(),
    verdict,
    summary: `${failedChecks.length} blocked checks, ${warningChecks.length} review checks across ${scopedNodes.length} entities and ${scopedEdges.length} links.`,
    capabilities: { train, release, rollback },
    checks,
    recommendations: recommendations.length > 0 ? recommendations : ['This lineage is ready for the next operational step.'],
    actions: buildLineageAuditActions(checks),
  };
}

function lineageNodeClass(node: LineageMapNode, state: LineageMapState): string {
  const selected = state.activeKeys.has(node.key) ? ' lineage-node-active' : '';
  const connected = state.connectedKeys.has(node.key) ? ' lineage-node-connected' : '';
  return `lineage-node lineage-node-${node.tone}${selected}${connected}`;
}

function lineageInsightClass(tone: LineageMapNodeTone): string {
  return `lineage-insight lineage-insight-${tone}`;
}

function inspectorMetricClass(tone?: EntityInspectorMetric['tone']): string {
  return `entity-inspector-metric ${tone ? `entity-inspector-metric-${tone}` : ''}`;
}

function entityFocusClass(focused: FocusedTaskEntity | undefined, kind: TaskEntityRef['kind'], id?: string): string {
  if (!focused || focused.kind !== kind) return '';
  if (id && focused.id !== id) return '';
  return 'entity-focus-selected';
}

function taskEventStatusIcon(status: TraceOpsTaskRecord['status']) {
  if (status === 'succeeded') return <CheckCircle2 size={14} />;
  if (status === 'failed' || status === 'cancelled') return <AlertTriangle size={14} />;
  if (status === 'running' || status === 'retrying') return <Loader2 className={status === 'running' ? 'spin' : undefined} size={14} />;
  return <Clock3 size={14} />;
}

function TaskDetailPanel(props: {
  task: TraceOpsTaskRecord;
  tasks: TraceOpsTaskRecord[];
  retryingTaskId?: string;
  runningExecutor: boolean;
  onRetry: (id: string) => Promise<void>;
  onRunQueued: () => Promise<void>;
  onOpenEntity: (entity: TaskEntityRef) => void;
  onSelectTask: (id: string) => void;
  onClose: () => void;
}) {
  const events = props.task.events.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const retryParent = props.task.retryOfTaskId
    ? props.tasks.find((task) => task.id === props.task.retryOfTaskId)
    : undefined;
  const retryChildren = props.tasks.filter((task) => task.retryOfTaskId === props.task.id);
  const canRetry = props.task.status === 'failed' || props.task.status === 'cancelled';
  const canRunQueued = props.task.status === 'queued';

  return (
    <div className="task-detail-drawer">
      <div className="task-detail-main">
        <div className="task-detail-head">
          <div>
            <div className="section-label">Task detail</div>
            <h3>{props.task.title}</h3>
          </div>
          <button className="icon-button" onClick={props.onClose} aria-label="Close task detail" title="Close">
            <X size={15} />
          </button>
        </div>

        <div className="task-detail-meta">
          <span><small>Status</small><strong className={taskStatusClass(props.task.status)}>{taskStatusLabel(props.task.status)}</strong></span>
          <span><small>Queue</small><strong>{props.task.queue}</strong></span>
          <span><small>Priority</small><strong className={taskPriorityClass(props.task.priority)}>{props.task.priority}</strong></span>
          <span><small>Progress</small><strong>{props.task.progress}%</strong></span>
        </div>

        <div className="task-detail-copy">
          <strong>{props.task.resultSummary ?? props.task.description ?? 'Waiting for worker signal.'}</strong>
          {props.task.errorMessage && <small className="task-error-copy">{props.task.errorMessage}</small>}
          <small>ID {props.task.id} · created by {props.task.createdBy}</small>
        </div>

        <div className="task-detail-actions">
          {canRunQueued && (
            <button className="secondary-button" disabled={props.runningExecutor} onClick={props.onRunQueued}>
              {props.runningExecutor ? <Loader2 className="spin" size={14} /> : <Play size={14} />}
              Run queued
            </button>
          )}
          {canRetry && (
            <button className="secondary-button" disabled={props.retryingTaskId === props.task.id} onClick={() => props.onRetry(props.task.id)}>
              {props.retryingTaskId === props.task.id ? <Loader2 className="spin" size={14} /> : <RefreshCw size={14} />}
              Retry task
            </button>
          )}
        </div>

        <div className="task-detail-section">
          <div className="section-label">Linked entities</div>
          <div className="task-entity-list">
            {props.task.entityRefs.length === 0 ? (
              <div className="muted-box compact">No linked entity.</div>
            ) : props.task.entityRefs.map((entity) => (
              <button className="task-entity-row" key={`${entity.kind}-${entity.id}`} onClick={() => props.onOpenEntity(entity)}>
                <span><strong>{entity.label ?? taskEntityKindLabel(entity.kind)}</strong><small>{taskEntityKindLabel(entity.kind)}</small></span>
                <code>{entity.id}</code>
              </button>
            ))}
          </div>
        </div>

        <div className="task-detail-section">
          <div className="section-label">Retry chain</div>
          {retryParent || retryChildren.length > 0 ? (
            <div className="task-retry-list">
              {retryParent && (
                <button className="task-related-row" onClick={() => props.onSelectTask(retryParent.id)}>
                  <span><strong>Original task</strong><small>{retryParent.title}</small></span>
                  <span className={taskStatusClass(retryParent.status)}>{taskStatusLabel(retryParent.status)}</span>
                </button>
              )}
              {retryChildren.map((retry) => (
                <button className="task-related-row" key={retry.id} onClick={() => props.onSelectTask(retry.id)}>
                  <span><strong>Retry task</strong><small>{retry.title}</small></span>
                  <span className={taskStatusClass(retry.status)}>{taskStatusLabel(retry.status)}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="muted-box compact">No retry task linked yet.</div>
          )}
        </div>
      </div>

      <div className="task-detail-events">
        <div className="section-label">Execution events</div>
        {events.length === 0 ? (
          <div className="muted-box compact">No execution event captured.</div>
        ) : (
          <div className="task-event-list">
            {events.map((event) => (
              <div className="task-event-row" key={event.id}>
                <span className={taskStatusClass(event.status)}>{taskEventStatusIcon(event.status)}{taskStatusLabel(event.status)}</span>
                <strong>{event.note}</strong>
                <small>{formatDate(event.createdAt)}</small>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TaskCenterPanel(props: {
  tasks: TraceOpsTaskRecord[];
  summary: TraceOpsTaskListResponse['summary'];
  retryingTaskId?: string;
  runningExecutor: boolean;
  selectedTaskId?: string;
  onSelectTask: (id: string | undefined) => void;
  onOpenEntity: (entity: TaskEntityRef) => void;
  onRetry: (id: string) => Promise<void>;
  onRunQueued: () => Promise<void>;
}) {
  const recent = props.tasks.slice(0, 8);
  const selectedTask = props.selectedTaskId
    ? props.tasks.find((task) => task.id === props.selectedTaskId)
    : undefined;
  return (
    <section className="task-center-panel">
      <div className="panel-title">
        <Workflow size={16} />
        Task Center
        <span className="panel-count">{props.summary.active} active · {props.summary.needsAttention} attention</span>
        <button className="secondary-button task-run-button" disabled={props.summary.queued === 0 || props.runningExecutor} onClick={props.onRunQueued}>
          {props.runningExecutor ? <Loader2 className="spin" size={14} /> : <Play size={14} />}
          Run Queued
        </button>
      </div>
      <div className="task-summary-grid">
        <span><strong>{props.summary.total}</strong><small>Total</small></span>
        <span><strong>{props.summary.queued}</strong><small>Queued</small></span>
        <span><strong>{props.summary.running}</strong><small>Running</small></span>
        <span><strong>{props.summary.succeeded}</strong><small>Succeeded</small></span>
        <span><strong>{props.summary.failed}</strong><small>Failed</small></span>
        <span><strong>{props.summary.retrying}</strong><small>Retrying</small></span>
      </div>
      {recent.length === 0 ? (
        <p className="muted">还没有任务记录。同步、训练、评测、部署和监控动作会进入这里。</p>
      ) : (
        <div className="task-center-table">
          <div className="task-center-head">
            <span>Task</span>
            <span>Status</span>
            <span>Queue</span>
            <span>Priority</span>
            <span>Linked Entity</span>
            <span>Updated</span>
            <span>Action</span>
          </div>
          {recent.map((task) => {
            const canRetry = task.status === 'failed' || task.status === 'cancelled';
            return (
              <div
                className={`task-center-row ${props.selectedTaskId === task.id ? 'selected' : ''}`}
                key={task.id}
                role="button"
                tabIndex={0}
                onClick={() => props.onSelectTask(task.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') props.onSelectTask(task.id);
                }}
              >
                <span className="task-title-cell">
                  <strong>{task.title}</strong>
                  <small>{taskKindLabel(task.kind)} · {task.resultSummary ?? task.description ?? 'Waiting for worker signal'}</small>
                </span>
                <span className={taskStatusClass(task.status)}>{taskStatusLabel(task.status)}</span>
                <span>{task.queue}</span>
                <span className={taskPriorityClass(task.priority)}>{task.priority}</span>
                <span className="task-entity-cell">{taskEntityText(task)}</span>
                <span>{formatDate(task.updatedAt)}</span>
                <span className="task-actions-cell" onClick={(event) => event.stopPropagation()}>
                  {canRetry ? (
                    <button className="secondary-button" disabled={props.retryingTaskId === task.id} onClick={() => props.onRetry(task.id)}>
                      {props.retryingTaskId === task.id ? <Loader2 className="spin" size={14} /> : <RefreshCw size={14} />}
                      Retry
                    </button>
                  ) : (
                    <small className="muted">{task.progress}%</small>
                  )}
                  <button className="icon-button" onClick={() => props.onSelectTask(task.id)} aria-label="Open task detail" title="Details">
                    <FileSearch size={14} />
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      )}
      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          tasks={props.tasks}
          retryingTaskId={props.retryingTaskId}
          runningExecutor={props.runningExecutor}
          onRetry={props.onRetry}
          onRunQueued={props.onRunQueued}
          onOpenEntity={props.onOpenEntity}
          onSelectTask={props.onSelectTask}
          onClose={() => props.onSelectTask(undefined)}
        />
      )}
    </section>
  );
}

function SystemGovernanceCenterPanel(props: {
  storageHealth?: StorePersistenceHealth;
  segmentStoreStatus?: TraceOpsSegmentStoreStatus;
  snapshots: StoreSnapshotRecord[];
  auditLog: GovernanceAuditRecord[];
  governancePolicy?: GovernancePolicyResponse;
  feedbackReport?: KodaXFeedbackReport;
  feedbackPackage?: KodaXFeedbackPackage;
  feedbackWritebacks: KodaXFeedbackWritebackRecord[];
  taskSummary: TraceOpsTaskListResponse['summary'];
  automationPlan?: TraceOpsTaskAutomationPlan;
  creatingSnapshot: boolean;
  restoringSnapshotId?: string;
  backfillingSegments: boolean;
  rebuildingSegments: boolean;
  orchestrating: boolean;
  writingBackFeedback: boolean;
  onCreateSnapshot: () => Promise<void>;
  onRestoreSnapshot: (id: string) => Promise<void>;
  onBackfillSegments: () => Promise<void>;
  onRebuildSegments: () => Promise<void>;
  onOrchestrate: (runNow: boolean) => Promise<void>;
  onWritebackFeedback: () => Promise<void>;
}) {
  const health = props.storageHealth;
  const segmentStatus = props.segmentStoreStatus;
  const feedback = props.feedbackReport;
  const latestSnapshot = props.snapshots[0];
  const latestAudit = props.auditLog.slice(0, 8);
  const actions = feedback?.actionItems.slice(0, 6) ?? [];
  const signals = feedback?.signals.slice(0, 6) ?? [];
  return (
    <section className="system-governance-panel">
      <div className="system-governance-head">
        <div>
          <div className="section-label">System Governance Center</div>
          <h3>系统治理与反哺中心</h3>
          <p>把 TraceOps 自身的可恢复性、审计、KodaX 反哺和自动任务集中在一个操作面。</p>
        </div>
        <div className="system-governance-actions">
          <button className="secondary-button" disabled={props.orchestrating} onClick={() => props.onOrchestrate(false)}>
            {props.orchestrating ? <Loader2 className="spin" size={14} /> : <Workflow size={14} />}
            编排任务
          </button>
          <button className="primary-button" disabled={props.orchestrating} onClick={() => props.onOrchestrate(true)}>
            {props.orchestrating ? <Loader2 className="spin" size={14} /> : <Play size={14} />}
            编排并执行
          </button>
        </div>
      </div>

      <div className="system-governance-metrics">
        <StatCard label="Storage Status" value={health?.status ?? '-'} icon={<HardDrive size={18} />} tone={health?.status === 'blocked' ? 'danger-stat' : health?.status === 'attention' ? 'warn-stat' : 'good-stat'} />
        <StatCard label="Store Size" value={formatBytes(health?.storeBytes)} icon={<Database size={18} />} />
        <StatCard label="Lake Records" value={segmentStatus?.records ?? 0} icon={<Database size={18} />} />
        <StatCard label="Segments" value={segmentStatus?.files ?? 0} icon={<Archive size={18} />} />
        <StatCard label="Audit Events" value={props.auditLog.length} icon={<History size={18} />} />
      </div>

      <div className="system-governance-grid">
        <article className="system-card">
          <div className="system-card-head">
            <span><HardDrive size={15} /> Storage</span>
            <button className="secondary-button" disabled={props.creatingSnapshot} onClick={props.onCreateSnapshot}>
              {props.creatingSnapshot ? <Loader2 className="spin" size={14} /> : <Archive size={14} />}
              Snapshot
            </button>
          </div>
          <div className={`system-status system-status-${health?.status ?? 'idle'}`}>
            <strong>{health?.message ?? 'Waiting for storage health check'}</strong>
            <small>{health ? `${formatBytes(health.storeBytes)} store · ${formatBytes(health.backupBytes)} backup` : 'No storage health loaded'}</small>
          </div>
          {(health?.recommendations ?? []).length > 0 && (
            <div className="system-note-list">
              {health?.recommendations.slice(0, 3).map((item) => <small key={item}>{item}</small>)}
            </div>
          )}
          <div className="system-snapshot-list">
            {props.snapshots.slice(0, 4).map((snapshot) => (
              <div className="system-snapshot-row" key={snapshot.id}>
                <span>
                  <strong>{snapshot.id}</strong>
                  <small>{snapshot.reason} · {formatDate(snapshot.createdAt)} · {formatBytes(snapshot.compressedBytes)}</small>
                </span>
                <button
                  className="secondary-button"
                  disabled={props.restoringSnapshotId === snapshot.id}
                  onClick={() => props.onRestoreSnapshot(snapshot.id)}
                >
                  {props.restoringSnapshotId === snapshot.id ? <Loader2 className="spin" size={14} /> : <RefreshCw size={14} />}
                  Restore
                </button>
              </div>
            ))}
            {!latestSnapshot && <p className="muted">还没有快照。</p>}
          </div>
        </article>

        <article className="system-card">
          <div className="system-card-head">
            <span><Database size={15} /> Segment Lake</span>
            <div className="system-card-actions">
              <button className="secondary-button" disabled={props.backfillingSegments || props.rebuildingSegments} onClick={props.onBackfillSegments}>
                {props.backfillingSegments ? <Loader2 className="spin" size={14} /> : <RefreshCw size={14} />}
                回填
              </button>
              <button className="secondary-button" disabled={props.backfillingSegments || props.rebuildingSegments} onClick={props.onRebuildSegments}>
                {props.rebuildingSegments ? <Loader2 className="spin" size={14} /> : <Archive size={14} />}
                重建
              </button>
            </div>
          </div>
          <div className="system-status system-status-healthy">
            <strong>{segmentStatus ? `${segmentStatus.records} records · ${segmentStatus.files} files` : 'Waiting for segment status'}</strong>
            <small>{segmentStatus ? `${formatBytes(segmentStatus.bytes)} · ${segmentStatus.openFiles} open / ${segmentStatus.sealedFiles} sealed · max ${segmentStatus.maxRecordsPerSegment} records` : 'Local immutable lake is not loaded yet'}</small>
          </div>
          <div className="system-note-list">
            <small>{segmentStatus?.rootDir ?? '.traceops/lake'}</small>
            <small>{segmentStatus?.lastBackfillAt ? `Last backfill ${formatDate(segmentStatus.lastBackfillAt)}` : '未执行过全量回填；新同步会自动写入分片。'}</small>
          </div>
          <div className="system-snapshot-list">
            {(segmentStatus?.streams ?? []).slice(0, 6).map((stream) => (
              <div className="system-snapshot-row" key={stream.stream}>
                <span>
                  <strong>{stream.stream}</strong>
                  <small>{stream.records} records · {stream.files} files · {formatBytes(stream.bytes)}</small>
                </span>
                <span className="pill">{stream.openFiles} open</span>
              </div>
            ))}
            {(!segmentStatus || segmentStatus.streams.length === 0) && <p className="muted">还没有分片数据，点击回填 lake 可把现有数据写入。</p>}
          </div>
        </article>

        <article className="system-card">
          <div className="system-card-head">
            <span><GitBranch size={15} /> KodaX Feedback</span>
            <div className="system-card-actions">
              <button className="secondary-button" disabled={props.writingBackFeedback} onClick={props.onWritebackFeedback}>
                {props.writingBackFeedback ? <Loader2 className="spin" size={14} /> : <UploadCloud size={14} />}
                写回
              </button>
              <a className="secondary-button" href={kodaxFeedbackPackageDownloadUrl()} download>
                <Download size={14} />
                Package
              </a>
            </div>
          </div>
          <div className="system-feedback-summary">
            <span><strong>{feedback?.summary.signals ?? 0}</strong><small>signals</small></span>
            <span><strong>{feedback?.summary.critical ?? 0}</strong><small>critical</small></span>
            <span><strong>{feedback?.summary.actionItems ?? 0}</strong><small>actions</small></span>
          </div>
          <p className="system-top-recommendation">{feedback?.summary.topRecommendation ?? '等待 KodaX 反哺报告生成。'}</p>
          <div className="system-signal-list">
            {signals.map((signal) => (
              <div className={`system-signal-row severity-${signal.severity}`} key={signal.id}>
                <strong>{signal.title}</strong>
                <small>{signal.category} · {signal.metric.label}: {signal.metric.value}{signal.metric.denominator ? ` / ${signal.metric.denominator}` : ''}</small>
              </div>
            ))}
          </div>
          <div className="system-action-list">
            {actions.map((action) => (
              <span key={action.id}>
                <b>{action.priority}</b>
                {action.title}
              </span>
            ))}
          </div>
          <div className="system-writeback-list">
            {props.feedbackWritebacks.slice(0, 3).map((record) => (
              <div className={`system-writeback-row ${record.status}`} key={record.id}>
                <span>
                  <strong>{record.status === 'written' ? '已写回' : '写回失败'}</strong>
                  <small>{formatDate(record.createdAt)} · {record.files.length} files · {record.targetDir}</small>
                </span>
              </div>
            ))}
            {props.feedbackWritebacks.length === 0 && <small className="muted">还没有写回记录。</small>}
          </div>
          {props.feedbackPackage && <small className="muted">Package hash {props.feedbackPackage.packageHash.slice(0, 28)}</small>}
        </article>

        <article className="system-card">
          <div className="system-card-head">
            <span><ShieldAlert size={15} /> Governance Audit</span>
            <span className="pill muted-pill">{props.governancePolicy?.roles.length ?? 0} roles</span>
          </div>
          <div className="system-audit-list">
            {latestAudit.map((record) => (
              <div className="system-audit-row" key={record.id}>
                <span className={`system-audit-decision ${record.decision}`}>{record.decision}</span>
                <span>
                  <strong>{record.action}</strong>
                  <small>{record.actor.displayName ?? record.actor.id} · {record.actor.role} · {formatDate(record.occurredAt)}</small>
                </span>
              </div>
            ))}
            {latestAudit.length === 0 && <p className="muted">还没有治理审计记录。</p>}
          </div>
        </article>

        <article className="system-card">
          <div className="system-card-head">
            <span><Workflow size={15} /> Automation</span>
            <span className="pill muted-pill">{props.taskSummary.active} active</span>
          </div>
          <div className="system-feedback-summary">
            <span><strong>{props.taskSummary.queued}</strong><small>queued</small></span>
            <span><strong>{props.taskSummary.running}</strong><small>running</small></span>
            <span><strong>{props.taskSummary.needsAttention}</strong><small>attention</small></span>
          </div>
          <div className="system-feedback-summary">
            <span><strong>{props.automationPlan?.summary.nodes ?? 0}</strong><small>nodes</small></span>
            <span><strong>{props.automationPlan?.summary.edges ?? 0}</strong><small>edges</small></span>
            <span><strong>{props.automationPlan?.summary.approvalRequired ?? 0}</strong><small>approval</small></span>
          </div>
          <div className="system-note-list">
            <small>编排会检查存储健康、KodaX 反哺信号和治理 blocker。</small>
            <small>DAG 会标出依赖、审批和阻塞告警，便于后续 AgentOS 调度。</small>
          </div>
          {(props.automationPlan?.alerts ?? []).slice(0, 3).map((alert) => (
            <div className={`system-signal-row severity-${alert.severity === 'critical' ? 'critical' : alert.severity === 'warning' ? 'warning' : 'info'}`} key={alert.id}>
              <strong>{alert.title}</strong>
              <small>{alert.severity} · {alert.detail}</small>
            </div>
          ))}
          <div className="system-governance-actions inline">
            <button className="secondary-button" disabled={props.orchestrating} onClick={() => props.onOrchestrate(false)}>
              <Workflow size={14} />
              只编排
            </button>
            <button className="primary-button" disabled={props.orchestrating} onClick={() => props.onOrchestrate(true)}>
              <Play size={14} />
              编排并执行
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}

function diagnosticTriageStatus(diagnostic: NonNullable<IngestJob['diagnostics']>[number]) {
  return diagnostic.triageStatus ?? (diagnostic.level === 'info' ? undefined : 'open');
}

function jobWarningTriageSummary(jobs: IngestJob[]) {
  const warnings = jobs.flatMap((job) => job.diagnostics?.filter((diagnostic) => diagnostic.level === 'warning') ?? []);
  const triaged = warnings.filter((diagnostic) => {
    const status = diagnosticTriageStatus(diagnostic);
    return status && status !== 'open';
  }).length;
  return {
    total: warnings.length,
    open: Math.max(0, warnings.length - triaged),
    triaged,
  };
}

function IngestQualityQueuePanel(props: {
  queue: IngestQualityQueueResponse;
  triagingIssueId?: string;
  resolvingFixedDiagnostics?: boolean;
  onTriageIssue: (issue: IngestQualityIssue, decision: IngestDiagnosticTriageDecision) => Promise<void>;
  onResolveFixedKodaXDiagnostics: () => Promise<void>;
}) {
  const issues = props.queue.issues.slice(0, 8);
  return (
    <section className="ingest-quality-panel">
      <div className="panel-title">
        <ShieldAlert size={16} />
        Ingest Quality Queue
        <span className="panel-count">{props.queue.summary.openIssues} open issues · {props.queue.summary.openOccurrences} open occurrences</span>
        <button
          className="secondary-button task-run-button"
          disabled={props.resolvingFixedDiagnostics || props.queue.summary.openOccurrences === 0}
          onClick={() => void props.onResolveFixedKodaXDiagnostics()}
        >
          {props.resolvingFixedDiagnostics ? <Loader2 className="spin" size={14} /> : <Wrench size={14} />}
          Resolve fixed
        </button>
      </div>
      <div className="ingest-quality-summary">
        <span>
          <strong>{props.queue.summary.totalIssues}</strong>
          <small>issue groups</small>
        </span>
        <span>
          <strong>{props.queue.summary.openOccurrences}</strong>
          <small>open occurrences</small>
        </span>
        <span>
          <strong>{props.queue.summary.triagedOccurrences}</strong>
          <small>triaged</small>
        </span>
        <span>
          <strong>{props.queue.summary.resolved}</strong>
          <small>resolved</small>
        </span>
      </div>
      {issues.length === 0 ? (
        <p className="muted">当前没有接入质量问题。</p>
      ) : (
        <div className="ingest-quality-list">
          {issues.map((issue) => {
            const triaging = props.triagingIssueId === issue.id;
            return (
              <article className={`ingest-quality-row ${issue.level}`} key={issue.id}>
                <div className="ingest-quality-main">
                  <span className={`diagnostic-triage ${issue.openOccurrences > 0 ? 'open' : 'resolved'}`}>
                    {issue.openOccurrences > 0 ? `${issue.openOccurrences} open` : 'triaged'}
                  </span>
                  <div>
                    <b>{issue.code}</b>
                    <p>{issue.message}</p>
                    <small>
                      {issue.sourceSessionId ?? issue.traceId ?? 'source-level'} · {issue.totalOccurrences} occurrences · latest {formatDate(issue.latestOccurredAt)}
                    </small>
                  </div>
                </div>
                <div className="ingest-quality-actions">
                  {issue.openOccurrences > 0 ? (
                    <>
                      <button className="tiny-button" disabled={triaging} onClick={() => void props.onTriageIssue(issue, 'acknowledge')}>Ack all</button>
                      <button className="tiny-button" disabled={triaging} onClick={() => void props.onTriageIssue(issue, 'ignore')}>Ignore all</button>
                      <button className="tiny-button" disabled={triaging} onClick={() => void props.onTriageIssue(issue, 'resolve')}>Resolve all</button>
                    </>
                  ) : (
                    <button className="tiny-button" disabled={triaging} onClick={() => void props.onTriageIssue(issue, 'reopen')}>Reopen all</button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function policyActionLabel(action: IngestQualityPolicyAction) {
  if (action === 'auto_acknowledge') return 'Auto acknowledge';
  if (action === 'auto_ignore') return 'Auto ignore';
  if (action === 'auto_resolve') return 'Auto resolve';
  return 'Manual review';
}

function policySeverityLabel(severity: IngestQualityPolicySeverity) {
  if (severity === 'high') return 'High';
  if (severity === 'medium') return 'Medium';
  return 'Low';
}

function policyRuleStateLabel(state: IngestQualityPolicyRule['state'], enabled: boolean) {
  const nextState = state ?? (enabled ? 'live' : 'draft');
  if (nextState === 'live') return 'Live';
  if (nextState === 'paused') return 'Paused';
  return 'Draft';
}

type RecommendationQueueView = 'pending' | 'accepted' | 'dismissed' | 'reopened';
type RecommendationLevelFilter = 'all' | 'error' | 'warning';
type RecommendationSortMode = 'priority' | 'occurrences' | 'recent' | 'code';
type QualityGovernanceAuditTone = 'neutral' | 'good' | 'warn' | 'danger';

interface QualityGovernanceAuditEvent {
  id: string;
  tone: QualityGovernanceAuditTone;
  label: string;
  title: string;
  detail: string;
  actor: string;
  occurredAt: string;
}

function isAcceptedRecommendationRule(rule: IngestQualityPolicyRule) {
  const notes = [
    rule.lastStateChange?.note,
    ...(rule.lifecycle ?? []).map((event) => event.note),
  ].filter(Boolean).join(' ').toLowerCase();
  return notes.includes('recommendation');
}

function matchesRecommendationQuery(query: string, fields: Array<string | undefined>) {
  if (!query) return true;
  return fields.some((field) => field?.toLowerCase().includes(query));
}

function matchesRecommendationLevel(filter: RecommendationLevelFilter, level: IngestQualityPolicyRecommendation['level'] | IngestQualityPolicyRule['level']) {
  if (filter === 'all') return true;
  if (level === 'any') return true;
  return level === filter;
}

function recommendationLevelRank(level: IngestQualityPolicyRecommendation['level'] | IngestQualityPolicyRule['level']) {
  if (level === 'error') return 3;
  if (level === 'warning') return 2;
  return 1;
}

function policySeverityRank(severity?: IngestQualityPolicySeverity) {
  if (severity === 'high') return 3;
  if (severity === 'medium') return 2;
  if (severity === 'low') return 1;
  return 0;
}

function policyStateRank(rule: IngestQualityPolicyRule) {
  const state = rule.state ?? (rule.enabled ? 'live' : 'draft');
  if (state === 'draft') return 3;
  if (state === 'paused') return 2;
  return 1;
}

function compareText(a: string, b: string) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

function compareIsoDateDesc(a?: string, b?: string) {
  return (b ?? '').localeCompare(a ?? '');
}

function sortPolicyRecommendations(recommendations: IngestQualityPolicyRecommendation[], sortMode: RecommendationSortMode) {
  return recommendations.slice().sort((a, b) => {
    if (sortMode === 'code') return compareText(a.code, b.code);
    if (sortMode === 'recent') {
      return compareIsoDateDesc(a.latestOccurredAt, b.latestOccurredAt)
        || b.openOccurrences - a.openOccurrences
        || compareText(a.code, b.code);
    }
    if (sortMode === 'occurrences') {
      return b.openOccurrences - a.openOccurrences
        || recommendationLevelRank(b.level) - recommendationLevelRank(a.level)
        || compareIsoDateDesc(a.latestOccurredAt, b.latestOccurredAt)
        || compareText(a.code, b.code);
    }
    return recommendationLevelRank(b.level) - recommendationLevelRank(a.level)
      || policySeverityRank(b.suggestedSeverity) - policySeverityRank(a.suggestedSeverity)
      || b.openOccurrences - a.openOccurrences
      || compareIsoDateDesc(a.latestOccurredAt, b.latestOccurredAt)
      || compareText(a.code, b.code);
  });
}

function sortAcceptedRecommendationRules(rules: IngestQualityPolicyRule[], sortMode: RecommendationSortMode) {
  return rules.slice().sort((a, b) => {
    if (sortMode === 'code') return compareText(a.code, b.code);
    if (sortMode === 'recent') return compareIsoDateDesc(a.updatedAt, b.updatedAt) || compareText(a.code, b.code);
    if (sortMode === 'occurrences') {
      return (b.appliedCount ?? 0) - (a.appliedCount ?? 0)
        || compareIsoDateDesc(a.updatedAt, b.updatedAt)
        || compareText(a.code, b.code);
    }
    return policySeverityRank(b.severity) - policySeverityRank(a.severity)
      || recommendationLevelRank(b.level) - recommendationLevelRank(a.level)
      || policyStateRank(b) - policyStateRank(a)
      || compareIsoDateDesc(a.updatedAt, b.updatedAt)
      || compareText(a.code, b.code);
  });
}

function sortRecommendationDecisions(
  records: IngestQualityPolicyResponse['recommendationDecisions'],
  sortMode: RecommendationSortMode,
) {
  return records.slice().sort((a, b) => {
    if (sortMode === 'code') return compareText(a.code, b.code);
    if (sortMode === 'recent') return compareIsoDateDesc(a.decidedAt, b.decidedAt) || compareText(a.code, b.code);
    if (sortMode === 'occurrences') {
      return b.occurrenceCount - a.occurrenceCount
        || compareIsoDateDesc(a.decidedAt, b.decidedAt)
        || compareText(a.code, b.code);
    }
    return recommendationLevelRank(b.level) - recommendationLevelRank(a.level)
      || b.occurrenceCount - a.occurrenceCount
      || compareIsoDateDesc(a.decidedAt, b.decidedAt)
      || compareText(a.code, b.code);
  });
}

function qualityGovernanceRunTone(status: IngestQualityPolicyRunListResponse['runs'][number]['status']): QualityGovernanceAuditTone {
  if (status === 'failed') return 'danger';
  if (status === 'skipped') return 'warn';
  return 'good';
}

function qualityGovernanceStateTone(state: IngestQualityPolicyRule['state']): QualityGovernanceAuditTone {
  if (state === 'live') return 'good';
  if (state === 'paused') return 'warn';
  return 'neutral';
}

function recommendationDecisionTone(decision: IngestQualityPolicyResponse['recommendationDecisions'][number]['decision']): QualityGovernanceAuditTone {
  if (decision === 'reopened') return 'good';
  return 'neutral';
}

function recommendationDecisionLabel(decision: IngestQualityPolicyResponse['recommendationDecisions'][number]['decision']) {
  if (decision === 'reopened') return 'Reopened';
  return 'Dismissed';
}

function aggregatePolicyDryRunPreviews(
  previews: IngestQualityPolicyDryRunResponse[],
  scope: IngestQualityPolicyDryRunResponse['scope'],
  totalRules: number,
): IngestQualityPolicyDryRunResponse {
  const ruleResults = previews.flatMap((preview) => preview.ruleResults);
  const matchedIssues = new Set(ruleResults.flatMap((result) => result.matches.map((match) => match.issueId))).size;
  return {
    generatedAt: new Date().toISOString(),
    scope,
    totalRules,
    matchedRules: ruleResults.filter((result) => result.matchedDiagnostics > 0).length,
    matchedDiagnostics: ruleResults.reduce((sum, result) => sum + result.matchedDiagnostics, 0),
    matchedIssues,
    changeableDiagnostics: ruleResults.reduce((sum, result) => sum + result.changeableDiagnostics, 0),
    ruleResults,
  };
}

function IngestQualityPolicyPanel(props: {
  source?: SourceStatus;
  policy: IngestQualityPolicyResponse;
  policyRuns: IngestQualityPolicyRunListResponse;
  dryRun?: IngestQualityPolicyDryRunResponse;
  savingPolicyKey?: string;
  applyingPolicy: boolean;
  dryRunningPolicyKey?: string;
  selectedRuleIds: string[];
  batchPublishingPolicy: boolean;
  installingPolicyDefaults: boolean;
  savingRecommendations: boolean;
  decidingRecommendationKey?: string;
  togglingAutoApply: boolean;
  onCreateRecommendation: (recommendation: IngestQualityPolicyRecommendation) => Promise<boolean | void>;
  onCreateRecommendations: (recommendations: IngestQualityPolicyRecommendation[]) => Promise<boolean | void>;
  onDismissRecommendations: (recommendations: IngestQualityPolicyRecommendation[]) => Promise<boolean | void>;
  onRestoreRecommendation: (recordId: string) => Promise<void>;
  onUpdateRule: (rule: IngestQualityPolicyRule, patch: Partial<IngestQualityPolicyRule>) => Promise<void>;
  onDryRunRule: (rule?: IngestQualityPolicyRule) => Promise<void>;
  onToggleRuleSelection: (ruleId: string) => void;
  onSelectDraftRules: () => void;
  onClearRuleSelection: () => void;
  onBatchGoLiveRules: () => Promise<void>;
  onInstallDefaultRules: () => Promise<void>;
  onToggleAutoApply: () => Promise<void>;
  onApplyPolicy: () => Promise<void>;
}) {
  const autoApplyEnabled = props.source?.autoApplyQualityPolicy !== false;
  const dryRunBusy = props.dryRunningPolicyKey === '__all__';
  const dryRunResults = props.dryRun?.ruleResults.filter((result) => result.matchedDiagnostics > 0).slice(0, 4) ?? [];
  const [expandedLifecycleRuleId, setExpandedLifecycleRuleId] = useState<string>();
  const [recommendationView, setRecommendationView] = useState<RecommendationQueueView>('pending');
  const [recommendationQuery, setRecommendationQuery] = useState('');
  const [recommendationLevelFilter, setRecommendationLevelFilter] = useState<RecommendationLevelFilter>('all');
  const [recommendationSortMode, setRecommendationSortMode] = useState<RecommendationSortMode>('priority');
  const [selectedRecommendationIssueIds, setSelectedRecommendationIssueIds] = useState<string[]>([]);
  const [recommendationVisibleLimit, setRecommendationVisibleLimit] = useState(4);
  const [recommendationActionNotice, setRecommendationActionNotice] = useState<string>();
  const selectedRules = props.policy.rules.filter((rule) => props.selectedRuleIds.includes(rule.id));
  const selectedDraftRules = selectedRules.filter((rule) => !rule.enabled);
  const selectableRules = props.policy.rules.filter((rule) => !rule.enabled);
  const acceptedRecommendationRules = props.policy.rules.filter(isAcceptedRecommendationRule);
  const policyRuleLifecycleEvents = props.policy.rules.flatMap((rule) =>
    (rule.lifecycle ?? []).map((event) => ({ rule, event }))
  );
  const policyRulesSavedFromRecommendation = policyRuleLifecycleEvents.filter(({ event }) =>
    event.state === 'draft' && (event.note ?? '').toLowerCase().includes('recommendation')
  ).length;
  const policyRulesPublished = policyRuleLifecycleEvents.filter(({ event }) => event.state === 'live').length;
  const policyRulesPaused = policyRuleLifecycleEvents.filter(({ event }) => event.state === 'paused').length;
  const qualityGovernanceAuditEvents: QualityGovernanceAuditEvent[] = [
    ...props.policy.recommendationDecisions.map((record) => ({
      id: `recommendation:${record.id}`,
      tone: recommendationDecisionTone(record.decision),
      label: recommendationDecisionLabel(record.decision),
      title: record.code,
      detail: `${record.occurrenceCount} occurrences${record.note ? ` · ${record.note}` : ''}`,
      actor: record.actor,
      occurredAt: record.decidedAt,
    })),
    ...policyRuleLifecycleEvents.map(({ rule, event }) => ({
      id: `rule:${rule.id}:${event.id}`,
      tone: qualityGovernanceStateTone(event.state),
      label: policyRuleStateLabel(event.state, event.state === 'live'),
      title: rule.code,
      detail: `${policyActionLabel(rule.action)} · ${policySeverityLabel(rule.severity)}${event.note ? ` · ${event.note}` : ''}${event.preview ? ` · preview ${event.preview.matchedDiagnostics}/${event.preview.changeableDiagnostics}` : ''}`,
      actor: event.actor,
      occurredAt: event.changedAt,
    })),
    ...props.policyRuns.runs.map((run) => ({
      id: `run:${run.id}`,
      tone: qualityGovernanceRunTone(run.status),
      label: policyRunStatusLabel(run.status),
      title: run.message,
      detail: `${policyRunTriggerLabel(run.trigger)} · ${run.affectedDiagnostics} diagnostics · ${run.appliedRules}/${run.enabledRules} rules`,
      actor: run.actor,
      occurredAt: run.finishedAt,
    })),
  ].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  const recentGovernanceAuditEvents = qualityGovernanceAuditEvents.slice(0, 8);
  const reopenedRecommendations = props.policy.recommendationDecisions.filter((record) => record.decision === 'reopened');
  const normalizedRecommendationQuery = recommendationQuery.trim().toLowerCase();
  const recommendationFiltersActive = normalizedRecommendationQuery.length > 0 || recommendationLevelFilter !== 'all';
  const filteredRecommendations = props.policy.recommendations.filter((recommendation) =>
    matchesRecommendationLevel(recommendationLevelFilter, recommendation.level)
    && matchesRecommendationQuery(normalizedRecommendationQuery, [
      recommendation.code,
      recommendation.message,
      recommendation.reason,
      recommendation.suggestedAction,
      recommendation.suggestedSeverity,
    ])
  );
  const filteredAcceptedRules = acceptedRecommendationRules.filter((rule) =>
    matchesRecommendationLevel(recommendationLevelFilter, rule.level)
    && matchesRecommendationQuery(normalizedRecommendationQuery, [
      rule.code,
      rule.note,
      rule.action,
      rule.severity,
      rule.state,
      rule.lastStateChange?.note,
    ])
  );
  const filteredDismissedRecommendations = props.policy.dismissedRecommendations.filter((record) =>
    matchesRecommendationLevel(recommendationLevelFilter, record.level)
    && matchesRecommendationQuery(normalizedRecommendationQuery, [
      record.code,
      record.message,
      record.note,
      record.actor,
    ])
  );
  const filteredReopenedRecommendations = reopenedRecommendations.filter((record) =>
    matchesRecommendationLevel(recommendationLevelFilter, record.level)
    && matchesRecommendationQuery(normalizedRecommendationQuery, [
      record.code,
      record.message,
      record.note,
      record.actor,
    ])
  );
  const sortedRecommendations = sortPolicyRecommendations(filteredRecommendations, recommendationSortMode);
  const sortedAcceptedRules = sortAcceptedRecommendationRules(filteredAcceptedRules, recommendationSortMode);
  const sortedDismissedRecommendations = sortRecommendationDecisions(filteredDismissedRecommendations, recommendationSortMode);
  const sortedReopenedRecommendations = sortRecommendationDecisions(filteredReopenedRecommendations, recommendationSortMode);
  const selectedRecommendationSet = new Set(selectedRecommendationIssueIds);
  const selectedMatchingRecommendations = sortedRecommendations.filter((recommendation) => selectedRecommendationSet.has(recommendation.issueId));
  const visibleRecommendations = sortedRecommendations.slice(0, recommendationVisibleLimit);
  const visibleAcceptedRules = sortedAcceptedRules.slice(0, 4);
  const visibleDismissedRecommendations = sortedDismissedRecommendations.slice(0, 4);
  const visibleReopenedRecommendations = sortedReopenedRecommendations.slice(0, 4);
  const hiddenMatchingRecommendations = Math.max(sortedRecommendations.length - visibleRecommendations.length, 0);
  const visibleRecommendationIds = visibleRecommendations.map((recommendation) => recommendation.issueId);
  const allVisibleRecommendationsSelected = visibleRecommendationIds.length > 0
    && visibleRecommendationIds.every((issueId) => selectedRecommendationSet.has(issueId));
  const recommendationViewOptions: Array<{ id: RecommendationQueueView; label: string; count: number }> = [
    { id: 'pending', label: 'Pending', count: filteredRecommendations.length },
    { id: 'accepted', label: 'Accepted', count: filteredAcceptedRules.length },
    { id: 'dismissed', label: 'Dismissed', count: filteredDismissedRecommendations.length },
    { id: 'reopened', label: 'Reopened', count: filteredReopenedRecommendations.length },
  ];
  useEffect(() => {
    const validIssueIds = new Set(props.policy.recommendations.map((recommendation) => recommendation.issueId));
    setSelectedRecommendationIssueIds((current) => {
      const next = current.filter((issueId) => validIssueIds.has(issueId));
      return next.length === current.length ? current : next;
    });
  }, [props.policy.recommendations]);
  useEffect(() => {
    setRecommendationVisibleLimit(4);
  }, [recommendationView, recommendationQuery, recommendationLevelFilter, recommendationSortMode]);
  function toggleRecommendationSelection(issueId: string) {
    setSelectedRecommendationIssueIds((current) =>
      current.includes(issueId)
        ? current.filter((item) => item !== issueId)
        : [...current, issueId]
    );
  }
  function selectVisibleRecommendations() {
    setSelectedRecommendationIssueIds((current) => {
      const next = new Set(current);
      for (const issueId of visibleRecommendationIds) next.add(issueId);
      return Array.from(next);
    });
  }
  function clearVisibleRecommendations() {
    setSelectedRecommendationIssueIds((current) => current.filter((issueId) => !visibleRecommendationIds.includes(issueId)));
  }
  function selectMatchingRecommendations() {
    setSelectedRecommendationIssueIds((current) => {
      const next = new Set(current);
      for (const recommendation of sortedRecommendations) next.add(recommendation.issueId);
      return Array.from(next);
    });
  }
  function clearRecommendationSelection(recommendations: IngestQualityPolicyRecommendation[]) {
    const completedIds = new Set(recommendations.map((recommendation) => recommendation.issueId));
    setSelectedRecommendationIssueIds((current) => current.filter((issueId) => !completedIds.has(issueId)));
  }
  async function saveRecommendationDraft(recommendation: IngestQualityPolicyRecommendation) {
    const completed = await props.onCreateRecommendation(recommendation);
    if (completed === false) return;
    clearRecommendationSelection([recommendation]);
    setRecommendationActionNotice(`Saved ${recommendation.code} as a draft rule.`);
  }
  async function saveSelectedRecommendationDrafts() {
    if (selectedMatchingRecommendations.length === 0) return;
    const targets = selectedMatchingRecommendations.slice(0, 8);
    const completed = await props.onCreateRecommendations(targets);
    if (completed === false) return;
    clearRecommendationSelection(targets);
    setRecommendationActionNotice(`Saved ${targets.length} selected recommendations as draft rules.`);
  }
  async function dismissRecommendations(recommendations: IngestQualityPolicyRecommendation[]) {
    if (recommendations.length === 0) return;
    const targets = recommendations.slice(0, 8);
    const completed = await props.onDismissRecommendations(targets);
    if (completed === false) return;
    clearRecommendationSelection(targets);
    setRecommendationActionNotice(`Dismissed ${targets.length} recommendation${targets.length === 1 ? '' : 's'}.`);
  }
  const dryRunScopeLabel = props.dryRun?.scope === 'single_rule'
    ? 'single rule'
    : props.dryRun?.scope === 'selected_rules'
      ? 'selected rules'
      : 'all enabled rules';
  return (
    <section className="quality-policy-panel">
      <div className="panel-title">
        <Braces size={16} />
        Quality Policy Rules
        <span className="panel-count">{props.policy.summary.enabledRules} live · {props.policy.summary.draftRules} draft · {props.policy.summary.pausedRules} paused · {props.policy.summary.recommendedRules} recommended</span>
        {props.source?.lastPolicyApplyMessage && (
          <span className="panel-count">{props.source.lastPolicyApplyMessage}</span>
        )}
        <button className="secondary-button task-run-button" disabled={props.togglingAutoApply} onClick={() => void props.onToggleAutoApply()}>
          {props.togglingAutoApply ? <Loader2 className="spin" size={14} /> : <Workflow size={14} />}
          {autoApplyEnabled ? 'Auto after watch on' : 'Auto after watch off'}
        </button>
        <button className="secondary-button task-run-button" disabled={props.installingPolicyDefaults} onClick={() => void props.onInstallDefaultRules()}>
          {props.installingPolicyDefaults ? <Loader2 className="spin" size={14} /> : <ShieldAlert size={14} />}
          {props.policy.summary.totalRules === 0 ? 'Install defaults' : 'Ensure defaults'}
        </button>
        <button className="secondary-button task-run-button" disabled={dryRunBusy || props.policy.summary.enabledRules === 0} onClick={() => void props.onDryRunRule()}>
          {dryRunBusy ? <Loader2 className="spin" size={14} /> : <FileSearch size={14} />}
          Preview Impact
        </button>
        <button className="secondary-button task-run-button" disabled={props.applyingPolicy || props.policy.summary.enabledRules === 0} onClick={() => void props.onApplyPolicy()}>
          {props.applyingPolicy ? <Loader2 className="spin" size={14} /> : <Play size={14} />}
          Apply Policy
        </button>
      </div>
      <div className="quality-policy-summary">
        <span>
          <strong>{props.policy.summary.totalRules}</strong>
          <small>saved rules</small>
        </span>
        <span>
          <strong>{props.policy.summary.enabledRules}</strong>
          <small>live rules</small>
        </span>
        <span>
          <strong>{props.policy.summary.draftRules}</strong>
          <small>draft rules</small>
        </span>
        <span>
          <strong>{props.policy.summary.pausedRules}</strong>
          <small>paused rules</small>
        </span>
      </div>
      {props.dryRun && (
        <div className="quality-policy-preview">
          <div className="quality-policy-preview-head">
            <div>
              <b>Impact Preview</b>
              <small>{dryRunScopeLabel} · generated {formatDate(props.dryRun.generatedAt)}</small>
            </div>
            <div className="quality-policy-preview-metrics">
              <span><strong>{props.dryRun.matchedDiagnostics}</strong><small>matched</small></span>
              <span><strong>{props.dryRun.changeableDiagnostics}</strong><small>would change</small></span>
              <span><strong>{props.dryRun.matchedIssues}</strong><small>issues</small></span>
            </div>
          </div>
          {dryRunResults.length === 0 ? (
            <p className="muted">当前预演没有命中开放诊断。</p>
          ) : (
            <div className="quality-policy-preview-list">
              {dryRunResults.map((result) => (
                <article className="quality-policy-preview-row" key={result.ruleId}>
                  <div>
                    <b>{result.code}</b>
                    <p>{result.matchedDiagnostics} matched · {result.changeableDiagnostics} would change · {policyActionLabel(result.action)}</p>
                    {result.matches.slice(0, 2).map((match) => (
                      <small key={match.diagnosticId}>{match.sourceSessionId ?? match.traceId ?? match.jobId} · {match.message} · {formatDate(match.occurredAt)}</small>
                    ))}
                  </div>
                  <span className={`diagnostic-triage ${result.decision ? 'open' : 'acknowledged'}`}>
                    {result.decision ?? 'review'}
                  </span>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="quality-policy-recommendation-summary">
        <span>
          <strong>{props.policy.summary.recommendedRules}</strong>
          <small>recommended</small>
        </span>
        <span>
          <strong>{props.policy.summary.acceptedRecommendations}</strong>
          <small>accepted</small>
        </span>
        <span>
          <strong>{props.policy.summary.dismissedRecommendations}</strong>
          <small>dismissed</small>
        </span>
        <span>
          <strong>{props.policy.summary.reopenedRecommendations}</strong>
          <small>reopened</small>
        </span>
        <span>
          <strong>{props.policy.summary.recommendationDecisionEvents}</strong>
          <small>decision events</small>
        </span>
      </div>
      <div className="quality-policy-block">
        <div className="quality-policy-heading quality-policy-heading-row">
          <span>Recommendation Queue</span>
          <span className="quality-policy-batch-actions">
            {recommendationView === 'pending' && (
              <>
                <small>{selectedMatchingRecommendations.length} selected · {visibleRecommendations.length} visible · {filteredRecommendations.length} matching</small>
                <button
                  className="tiny-button"
                  disabled={visibleRecommendations.length === 0}
                  onClick={allVisibleRecommendationsSelected ? clearVisibleRecommendations : selectVisibleRecommendations}
                >
                  {allVisibleRecommendationsSelected ? 'Unselect visible' : 'Select visible'}
                </button>
                <button
                  className="tiny-button"
                  disabled={sortedRecommendations.length === 0}
                  onClick={selectMatchingRecommendations}
                >
                  Select matching
                </button>
                <button
                  className="tiny-button"
                  disabled={selectedRecommendationIssueIds.length === 0}
                  onClick={() => setSelectedRecommendationIssueIds([])}
                >
                  Clear selection
                </button>
                <button
                  className="tiny-button"
                  disabled={props.savingRecommendations || selectedMatchingRecommendations.length === 0}
                  onClick={() => void saveSelectedRecommendationDrafts()}
                >
                  {props.savingRecommendations ? 'Saving' : 'Save selected'}
                </button>
                <button
                  className="tiny-button"
                  disabled={props.decidingRecommendationKey === '__visible__' || selectedMatchingRecommendations.length === 0}
                  onClick={() => void dismissRecommendations(selectedMatchingRecommendations)}
                >
                  {props.decidingRecommendationKey === '__visible__' ? 'Dismissing' : 'Dismiss selected'}
                </button>
              </>
            )}
            {recommendationView === 'accepted' && <small>{visibleAcceptedRules.length} visible · {filteredAcceptedRules.length} matching</small>}
            {recommendationView === 'dismissed' && <small>{visibleDismissedRecommendations.length} visible · {filteredDismissedRecommendations.length} matching</small>}
            {recommendationView === 'reopened' && <small>{visibleReopenedRecommendations.length} visible · {filteredReopenedRecommendations.length} matching</small>}
          </span>
        </div>
        <div className="quality-policy-recommendation-tabs" aria-label="Recommendation queue view">
          {recommendationViewOptions.map((option) => (
            <button
              className={recommendationView === option.id ? 'active' : ''}
              key={option.id}
              onClick={() => setRecommendationView(option.id)}
              type="button"
            >
              <span>{option.label}</span>
              <b>{option.count}</b>
            </button>
          ))}
        </div>
        <div className="quality-policy-recommendation-filters">
          <div className="search-box quality-policy-recommendation-search">
            <Search size={14} />
            <input
              value={recommendationQuery}
              onChange={(event) => setRecommendationQuery(event.target.value)}
              placeholder="Search code, reason, note"
            />
          </div>
          <select
            value={recommendationLevelFilter}
            onChange={(event) => setRecommendationLevelFilter(event.target.value as RecommendationLevelFilter)}
          >
            <option value="all">All levels</option>
            <option value="error">Error</option>
            <option value="warning">Warning</option>
          </select>
          <select
            value={recommendationSortMode}
            onChange={(event) => setRecommendationSortMode(event.target.value as RecommendationSortMode)}
          >
            <option value="priority">Priority first</option>
            <option value="occurrences">Most occurrences</option>
            <option value="recent">Most recent</option>
            <option value="code">Code A-Z</option>
          </select>
          {recommendationFiltersActive && (
            <button
              className="tiny-button quality-policy-clear-filter"
              onClick={() => {
                setRecommendationQuery('');
                setRecommendationLevelFilter('all');
              }}
              type="button"
            >
              <X size={12} />
              Clear
            </button>
          )}
        </div>
        {recommendationActionNotice && (
          <div className="quality-policy-action-notice">
            <CheckCircle2 size={14} />
            <span>{recommendationActionNotice}</span>
            <button className="tiny-button" onClick={() => setRecommendationActionNotice(undefined)} type="button">
              <X size={12} />
              Dismiss
            </button>
          </div>
        )}
        {recommendationView === 'pending' && (
          visibleRecommendations.length === 0 ? (
            <p className="muted">{recommendationFiltersActive ? '当前筛选下没有待处理推荐。' : '当前没有待处理推荐。'}</p>
          ) : <>
            {visibleRecommendations.map((recommendation) => {
              const selected = selectedRecommendationSet.has(recommendation.issueId);
              return (
                <article className={`quality-policy-row ${selected ? 'selected-row' : ''}`} key={recommendation.issueId}>
                  <div className="quality-policy-main">
                    <label className="quality-policy-select" title="Select recommendation">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleRecommendationSelection(recommendation.issueId)}
                      />
                    </label>
                    <div>
                      <b>{recommendation.code}</b>
                      <p>{recommendation.reason}</p>
                      <small>
                        {recommendation.openOccurrences} open · {policyActionLabel(recommendation.suggestedAction)} · {policySeverityLabel(recommendation.suggestedSeverity)}
                        {recommendation.latestOccurredAt ? ` · latest ${formatDate(recommendation.latestOccurredAt)}` : ''}
                      </small>
                    </div>
                  </div>
                  <button
                    className="tiny-button"
                    disabled={props.savingRecommendations || props.savingPolicyKey === recommendation.issueId || props.decidingRecommendationKey === recommendation.issueId || props.decidingRecommendationKey === '__visible__'}
                    onClick={() => void saveRecommendationDraft(recommendation)}
                  >
                    Save draft
                  </button>
                  <button
                    className="tiny-button"
                    disabled={props.decidingRecommendationKey === recommendation.issueId || props.decidingRecommendationKey === '__visible__'}
                    onClick={() => void dismissRecommendations([recommendation])}
                  >
                    {props.decidingRecommendationKey === recommendation.issueId ? 'Ignoring' : 'Ignore'}
                  </button>
                </article>
              );
            })}
            {hiddenMatchingRecommendations > 0 && (
              <button
                className="quality-policy-show-more"
                onClick={() => setRecommendationVisibleLimit((current) => current + 4)}
                type="button"
              >
                Show {Math.min(4, hiddenMatchingRecommendations)} more · {hiddenMatchingRecommendations} hidden
              </button>
            )}
          </>
        )}
        {recommendationView === 'accepted' && (
          visibleAcceptedRules.length === 0 ? (
            <p className="muted">{recommendationFiltersActive ? '当前筛选下没有已采纳规则。' : '还没有从推荐保存出来的规则。'}</p>
          ) : visibleAcceptedRules.map((rule) => {
            const statusLabel = rule.state ?? (rule.enabled ? 'live' : 'draft');
            return (
              <article className="quality-policy-row" key={rule.id}>
                <div>
                  <b>{rule.code}</b>
                  <p>{rule.note ?? 'Saved from recommendation.'}</p>
                  <small>{statusLabel} · {policyActionLabel(rule.action)} · {policySeverityLabel(rule.severity)} · updated {formatDate(rule.updatedAt)}</small>
                </div>
                <button className="tiny-button" disabled={props.dryRunningPolicyKey === rule.id} onClick={() => void props.onDryRunRule(rule)}>
                  {props.dryRunningPolicyKey === rule.id ? 'Previewing' : 'Preview'}
                </button>
                <button className="tiny-button" disabled={props.savingPolicyKey === rule.id} onClick={() => void props.onUpdateRule(rule, { enabled: !rule.enabled })}>
                  {rule.enabled ? 'Pause' : 'Go live'}
                </button>
              </article>
            );
          })
        )}
        {recommendationView === 'dismissed' && (
          visibleDismissedRecommendations.length === 0 ? (
            <p className="muted">{recommendationFiltersActive ? '当前筛选下没有已忽略推荐。' : '当前没有已忽略的推荐。'}</p>
          ) : visibleDismissedRecommendations.map((record) => (
            <article className="quality-policy-row" key={record.id}>
              <div>
                <b>{record.code}</b>
                <p>{record.note ?? 'Dismissed from current intake.'}</p>
                <small>{record.actor} · {formatDate(record.decidedAt)} · {record.occurrenceCount} occurrences</small>
              </div>
              <button
                className="tiny-button"
                disabled={props.decidingRecommendationKey === `restore:${record.id}`}
                onClick={() => void props.onRestoreRecommendation(record.id)}
              >
                {props.decidingRecommendationKey === `restore:${record.id}` ? 'Restoring' : 'Restore'}
              </button>
            </article>
          ))
        )}
        {recommendationView === 'reopened' && (
          visibleReopenedRecommendations.length === 0 ? (
            <p className="muted">{recommendationFiltersActive ? '当前筛选下没有已恢复推荐。' : '还没有恢复过的推荐。'}</p>
          ) : visibleReopenedRecommendations.map((record) => (
            <article className="quality-policy-row" key={record.id}>
              <div>
                <b>{record.code}</b>
                <p>{record.note ?? 'Restored to recommendation intake.'}</p>
                <small>{record.actor} · {formatDate(record.decidedAt)} · {record.occurrenceCount} occurrences</small>
              </div>
              <span className="diagnostic-triage acknowledged">back in intake</span>
            </article>
          ))
        )}
      </div>
      <div className="quality-policy-governance-audit">
        <div className="quality-policy-heading quality-policy-heading-row">
          <span>Governance Audit Summary</span>
          <span className="quality-policy-batch-actions">
            <small>{qualityGovernanceAuditEvents.length} events · {props.policyRuns.summary.totalRuns} policy runs</small>
          </span>
        </div>
        <div className="quality-policy-audit-summary">
          <span>
            <strong>{policyRulesSavedFromRecommendation}</strong>
            <small>saved drafts</small>
          </span>
          <span>
            <strong>{policyRulesPublished}</strong>
            <small>go-live events</small>
          </span>
          <span>
            <strong>{policyRulesPaused}</strong>
            <small>paused events</small>
          </span>
          <span>
            <strong>{props.policy.summary.recommendationDecisionEvents}</strong>
            <small>recommend decisions</small>
          </span>
        </div>
        {recentGovernanceAuditEvents.length === 0 ? (
          <p className="muted">还没有推荐治理审计记录。</p>
        ) : (
          <div className="quality-policy-audit-list">
            {recentGovernanceAuditEvents.map((event) => (
              <article className="quality-policy-audit-row" key={event.id}>
                <span className={`policy-governance-audit-badge ${event.tone}`}>{event.label}</span>
                <div>
                  <b>{event.title}</b>
                  <small>{event.detail}</small>
                </div>
                <span>
                  <strong>{event.actor}</strong>
                  <small>{formatDate(event.occurredAt)}</small>
                </span>
              </article>
            ))}
          </div>
        )}
      </div>
      {props.policy.recommendationDecisions.length > 0 && (
        <div className="quality-policy-decision-history">
          <div className="quality-policy-heading quality-policy-heading-row">
            <span>Recommendation Decision History</span>
            <span className="quality-policy-batch-actions">
              <small>{props.policy.recommendationDecisions.length} events · {props.policy.summary.reopenedRecommendations} reopened</small>
            </span>
          </div>
          {props.policy.recommendationDecisions.slice(0, 6).map((record) => (
            <div className="quality-policy-decision-row" key={record.id}>
              <span className={`policy-rule-state ${record.decision}`}>{recommendationDecisionLabel(record.decision)}</span>
              <div>
                <b>{record.code}</b>
                <small>{record.actor} · {formatDate(record.decidedAt)} · {record.occurrenceCount} occurrences{record.note ? ` · ${record.note}` : ''}</small>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="quality-policy-block">
        <div className="quality-policy-heading quality-policy-heading-row">
          <span>Saved Rules</span>
          <span className="quality-policy-batch-actions">
            <small>{props.selectedRuleIds.length} selected</small>
            <button className="tiny-button" disabled={selectableRules.length === 0} onClick={props.onSelectDraftRules}>Select drafts</button>
            <button className="tiny-button" disabled={props.selectedRuleIds.length === 0} onClick={props.onClearRuleSelection}>Clear</button>
            <button className="tiny-button" disabled={props.batchPublishingPolicy || selectedDraftRules.length === 0} onClick={() => void props.onBatchGoLiveRules()}>
              {props.batchPublishingPolicy ? 'Publishing' : 'Go live selected'}
            </button>
          </span>
        </div>
        {props.policy.rules.length === 0 ? (
          <p className="muted">还没有规则。可以先保存上方推荐规则。</p>
        ) : props.policy.rules.slice(0, 8).map((rule) => {
          const previewedRule = props.dryRun?.ruleResults.find((result) => result.ruleId === rule.id);
          const statusLabel = rule.state ?? (rule.enabled ? 'live' : 'draft');
          const stateChange = rule.lastStateChange;
          const lifecycle = rule.lifecycle?.length ? rule.lifecycle : stateChange ? [stateChange] : [];
          const lifecycleExpanded = expandedLifecycleRuleId === rule.id;
          const selected = props.selectedRuleIds.includes(rule.id);
          return (
            <article className="quality-policy-row" key={rule.id}>
              <div className="quality-policy-main">
                <label className="quality-policy-select" title={rule.enabled ? 'Live rules cannot be batch-published' : 'Select rule'}>
                  <input
                    type="checkbox"
                    checked={selected}
                    disabled={rule.enabled}
                    onChange={() => props.onToggleRuleSelection(rule.id)}
                  />
                </label>
                <div>
                  <b>{rule.code}</b>
                  <p>{rule.note ?? 'No note'}</p>
                  <small>
                    {statusLabel} · {policyActionLabel(rule.action)} · {policySeverityLabel(rule.severity)}
                    {rule.appliedCount ? ` · ${rule.appliedCount} applied` : ''}
                    {previewedRule ? ` · preview ${previewedRule.matchedDiagnostics} matched` : ''}
                  </small>
                  {stateChange && (
                    <small className="quality-policy-state-note">
                      {stateChange.actor} · {formatDate(stateChange.changedAt)}
                      {stateChange.note ? ` · ${stateChange.note}` : ''}
                      {stateChange.preview ? ` · preview ${stateChange.preview.matchedDiagnostics}/${stateChange.preview.changeableDiagnostics}` : ''}
                    </small>
                  )}
                  {lifecycleExpanded && (
                    <div className="quality-policy-lifecycle">
                      {lifecycle.length === 0 ? (
                        <small>No lifecycle history yet.</small>
                      ) : lifecycle.slice(0, 8).map((event) => (
                        <div className="quality-policy-lifecycle-row" key={event.id}>
                          <span className={`policy-rule-state ${event.state}`}>{policyRuleStateLabel(event.state, event.state === 'live')}</span>
                          <div>
                            <b>{event.actor} · {formatDate(event.changedAt)}</b>
                            <small>{event.note ?? 'No note recorded'}{event.preview ? ` · preview ${event.preview.matchedDiagnostics}/${event.preview.changeableDiagnostics} diagnostics` : ''}</small>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="quality-policy-controls">
                <select
                  value={rule.action}
                  disabled={props.savingPolicyKey === rule.id}
                  onChange={(event) => void props.onUpdateRule(rule, { action: event.target.value as IngestQualityPolicyAction })}
                >
                  <option value="manual_review">Manual review</option>
                  <option value="auto_acknowledge">Auto acknowledge</option>
                  <option value="auto_ignore">Auto ignore</option>
                  <option value="auto_resolve">Auto resolve</option>
                </select>
                <select
                  value={rule.severity}
                  disabled={props.savingPolicyKey === rule.id}
                  onChange={(event) => void props.onUpdateRule(rule, { severity: event.target.value as IngestQualityPolicySeverity })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <button className="tiny-button" disabled={props.savingPolicyKey === rule.id} onClick={() => void props.onUpdateRule(rule, { enabled: !rule.enabled })}>
                  {rule.enabled ? 'Pause' : 'Go live'}
                </button>
                <button className="tiny-button" disabled={props.dryRunningPolicyKey === rule.id} onClick={() => void props.onDryRunRule(rule)}>
                  {props.dryRunningPolicyKey === rule.id ? 'Previewing' : 'Preview'}
                </button>
                <button className="tiny-button" onClick={() => setExpandedLifecycleRuleId(lifecycleExpanded ? undefined : rule.id)}>
                  <History size={12} />
                  {lifecycleExpanded ? 'Hide' : 'History'}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function policyRunTriggerLabel(trigger: IngestQualityPolicyRunListResponse['runs'][number]['trigger']) {
  if (trigger === 'watch') return 'Watch sync';
  if (trigger === 'retry') return 'Retry sync';
  if (trigger === 'scheduled') return 'Scheduled';
  return 'Manual';
}

function policyRunStatusLabel(status: IngestQualityPolicyRunListResponse['runs'][number]['status']) {
  if (status === 'succeeded') return 'Succeeded';
  if (status === 'failed') return 'Failed';
  return 'Skipped';
}

function IngestQualityPolicyRunsPanel(props: {
  runs: IngestQualityPolicyRunListResponse;
}) {
  const recentRuns = props.runs.runs.slice(0, 8);
  return (
    <section className="quality-policy-runs-panel">
      <div className="panel-title">
        <History size={16} />
        Quality Policy Runs
        <span className="panel-count">{props.runs.summary.totalRuns} runs · {props.runs.summary.affectedDiagnostics} diagnostics handled</span>
      </div>
      <div className="quality-policy-run-summary">
        <span>
          <strong>{props.runs.summary.totalRuns}</strong>
          <small>total runs</small>
        </span>
        <span>
          <strong>{props.runs.summary.automaticRuns}</strong>
          <small>automatic</small>
        </span>
        <span>
          <strong>{props.runs.summary.skippedRuns}</strong>
          <small>skipped</small>
        </span>
        <span>
          <strong>{formatDate(props.runs.summary.lastRunAt)}</strong>
          <small>last run</small>
        </span>
      </div>
      {recentRuns.length === 0 ? (
        <p className="muted">还没有策略执行记录。</p>
      ) : (
        <div className="quality-policy-run-list">
          {recentRuns.map((run) => (
            <article className="quality-policy-run-row" key={run.id}>
              <div className="quality-policy-run-main">
                <span className={`policy-run-status ${run.status}`}>{policyRunStatusLabel(run.status)}</span>
                <div>
                  <b>{run.message}</b>
                  <small>
                    {policyRunTriggerLabel(run.trigger)} · {run.actor}{run.sourceJobId ? ` · ${run.sourceJobId}` : ''}
                  </small>
                </div>
              </div>
              <span>
                <strong>{run.affectedDiagnostics}</strong>
                <small>diagnostics</small>
              </span>
              <span>
                <strong>{run.appliedRules}/{run.enabledRules}</strong>
                <small>rules applied</small>
              </span>
              <span>
                <strong>{formatDate(run.finishedAt)}</strong>
                <small>{run.affectedIssues} issues</small>
              </span>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function JobsPanel(props: {
  jobs: IngestJob[];
  focusedEntity?: FocusedTaskEntity;
  triagingDiagnosticId?: string;
  onTriageDiagnostic: (jobId: string, diagnosticId: string, decision: IngestDiagnosticTriageDecision) => Promise<void>;
}) {
  const warningSummary = jobWarningTriageSummary(props.jobs);
  return (
    <section className={`jobs-panel ${entityFocusClass(props.focusedEntity, 'ingest_job')}`} data-entity-panel="ingest_job">
      <div className="panel-title">
        <Workflow size={16} />
        Recent Ingest Jobs
        {warningSummary.total > 0 && (
          <span className="panel-count">{warningSummary.open} open · {warningSummary.triaged} triaged</span>
        )}
      </div>
      {props.jobs.length === 0 ? (
        <p className="muted">还没有同步任务。</p>
      ) : props.jobs.slice(0, 10).map((job) => (
        <article className={`job-card ${entityFocusClass(props.focusedEntity, 'ingest_job', job.id)}`} key={job.id} data-entity-kind="ingest_job" data-entity-id={job.id}>
          <div className="job-row">
            <span>
              <b className={statusClass(job.status)}>{job.status}</b>
              <small>{job.mode}</small>
            </span>
            <span>
              <strong>{job.discovered}</strong>
              <small>discovered</small>
            </span>
            <span>
              <strong>{job.imported}</strong>
              <small>{job.created ?? 0} new · {job.updated ?? 0} updated</small>
            </span>
            <span>
              <strong>{job.unchanged ?? job.skipped}</strong>
              <small>unchanged</small>
            </span>
            <span>
              <strong>{job.failed}</strong>
              <small>{job.schemaWarnings ?? 0} warnings</small>
            </span>
            <span>
              <small>{formatDate(job.finishedAt ?? job.startedAt)}</small>
              <small>{job.checkpointCursor ?? 'no checkpoint'}</small>
            </span>
          </div>
          {(job.message || (job.diagnostics?.length ?? 0) > 0) && (
            <div className="job-diagnostics">
              {job.message && <div className="job-diagnostic error">{job.message}</div>}
              {job.diagnostics?.filter((diagnostic) => diagnostic.level !== 'info').slice(-4).map((diagnostic) => {
                const triageStatus = diagnosticTriageStatus(diagnostic);
                const triaging = props.triagingDiagnosticId === diagnostic.id;
                return (
                  <div className={`job-diagnostic ${diagnostic.level}`} key={diagnostic.id}>
                    <span className="job-diagnostic-copy">
                      <b>{diagnostic.code}</b>: {diagnostic.message}
                      <small>{diagnostic.sourceSessionId ?? diagnostic.traceId ?? 'source-level'}{diagnostic.triage?.note ? ` · ${diagnostic.triage.note}` : ''}</small>
                    </span>
                    {triageStatus && (
                      <span className="job-diagnostic-side">
                        <span className={`diagnostic-triage ${triageStatus}`}>{triageStatus}</span>
                        <span className="diagnostic-actions">
                          {triageStatus === 'open' ? (
                            <>
                              <button className="tiny-button" disabled={triaging} onClick={() => void props.onTriageDiagnostic(job.id, diagnostic.id, 'acknowledge')}>Ack</button>
                              <button className="tiny-button" disabled={triaging} onClick={() => void props.onTriageDiagnostic(job.id, diagnostic.id, 'ignore')}>Ignore</button>
                              <button className="tiny-button" disabled={triaging} onClick={() => void props.onTriageDiagnostic(job.id, diagnostic.id, 'resolve')}>Resolve</button>
                            </>
                          ) : (
                            <button className="tiny-button" disabled={triaging} onClick={() => void props.onTriageDiagnostic(job.id, diagnostic.id, 'reopen')}>Reopen</button>
                          )}
                        </span>
                      </span>
                    )}
                  </div>
                );
              })}
              {job.diagnostics?.some((diagnostic) => diagnostic.level !== 'info') === false && job.diagnostics.slice(-1).map((diagnostic) => (
                <div className={`job-diagnostic ${diagnostic.level}`} key={diagnostic.id}>
                  {diagnostic.code}: {diagnostic.message}
                </div>
              ))}
            </div>
          )}
        </article>
      ))}
    </section>
  );
}

function ExportRunsPanel(props: {
  runs: DatasetExportRun[];
  revokingId?: string;
  onRevoke: (id: string) => Promise<void>;
}) {
  return (
    <section className="exports-panel">
      <div className="panel-title">
        <Download size={16} />
        Dataset Export Runs
        <span className="panel-count">{props.runs.length} recent</span>
      </div>
      {props.runs.length === 0 ? (
        <p className="muted">还没有数据集导出记录。</p>
      ) : props.runs.slice(0, 6).map((run) => (
        <div className="export-row" key={run.id}>
          <span>
            <b className={exportRunStatusClass(run.status)}>{run.status}</b>
            <small>{datasetFormatLabel(run.format)}</small>
          </span>
          <span>
            <strong>{run.exported}</strong>
            <small>{run.skipped} skipped</small>
          </span>
          <span>
            <strong>{run.riskSummary.highRisk}</strong>
            <small>high risk</small>
          </span>
          <span>
            <strong>{run.riskSummary.missingEvidence}</strong>
            <small>evidence gaps</small>
          </span>
          <span className="export-lineage">
            <strong>{run.source === 'dataset_version' ? run.datasetVersionName ?? 'dataset version' : 'sample query'}</strong>
            <small>{run.sampleIds.length} samples · {run.traceIds.length} traces · {Object.keys(run.filters).length ? Object.entries(run.filters).map(([key, value]) => `${key}:${value}`).join(' · ') : 'all samples'}</small>
            {run.revocation && <small>Revoked: {run.revocation.reason} · {formatDate(run.revocation.revokedAt)}</small>}
          </span>
          <span className="row-actions">
            <small>{formatDate(run.generatedAt)}</small>
            <button className="secondary-button" disabled={run.status === 'revoked' || props.revokingId === run.id} onClick={() => props.onRevoke(run.id)}>
              {props.revokingId === run.id ? <Loader2 className="spin" size={14} /> : <Archive size={14} />}
              Revoke
            </button>
          </span>
        </div>
      ))}
    </section>
  );
}

function CleanTraceWorkbench(props: {
  cleanTraces: CleanTrace[];
  totals: CleanTraceListResponse['totals'];
  onSelectTrace: (id: string) => void;
}) {
  return (
    <section className="clean-trace-panel">
      <div className="panel-title">
        <FileSearch size={16} />
        Clean Trace Workbench
        <span className="panel-count">
          {props.totals.ready} ready · {props.totals.needsReview} review · {props.totals.blocked} blocked
        </span>
      </div>
      {props.cleanTraces.length === 0 ? (
        <p className="muted">还没有 Clean Trace。同步 KodaX session 后会自动生成清洗视图。</p>
      ) : (
        <div className="clean-trace-table">
          <div className="clean-trace-head-row">
            <span>Clean Trace</span>
            <span>Status</span>
            <span>Risk</span>
            <span>Quality</span>
            <span>Redactions</span>
            <span>Policy</span>
            <span>Evidence</span>
          </div>
          {props.cleanTraces.slice(0, 10).map((cleanTrace) => (
            <button className="clean-trace-row" key={cleanTrace.id} onClick={() => props.onSelectTrace(cleanTrace.traceId)}>
              <span>
                <strong>{cleanTrace.title}</strong>
                <small>{cleanTrace.cleanUserGoal || cleanTrace.rawUserGoal || cleanTrace.sourceSessionId}</small>
              </span>
              <span><b className={cleanTraceStatusClass(cleanTrace.status)}>{cleanTrace.status}</b></span>
              <span><b className={riskClass(cleanTrace.riskLevel)}>{cleanTrace.riskLevel}</b></span>
              <span><b className={qualityClass(cleanTrace.quality.grade)}>{cleanTrace.quality.score}</b></span>
              <span>{cleanTrace.redactionCount}</span>
              <span>{cleanTrace.policies.cleaningPolicyVersion}</span>
              <span>{cleanTrace.metrics.evidenceCount}/{cleanTrace.metrics.toolEventCount}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function DatasetBuilderPanel(props: {
  samples: TrainingSample[];
  filters: Filters;
  creating: boolean;
  allowedKinds?: DatasetBuilderKind[];
  onReviewKind: (kind: DatasetBuilderKind) => void;
  onCreateKindVersion: (input: { kind: DatasetBuilderKind; sampleIds: string[]; format: DatasetExportFormat }) => Promise<void>;
}) {
  const totalGenerated = props.samples.length;
  return (
    <section className="builder-panel">
      <div className="panel-title">
        <Workflow size={16} />
        Dataset Builder
        <span className="panel-count">{totalGenerated} generated samples</span>
      </div>
      <div className="builder-grid">
        {datasetBuilderKinds.filter((item) => !props.allowedKinds || props.allowedKinds.includes(item.kind)).map((item) => {
          const samples = props.samples.filter((sample) => sample.kind === item.kind);
          const candidateCount = samples.filter((sample) => sample.status === 'candidate').length;
          const reviewCount = samples.filter((sample) => sample.status === 'needs_review').length;
          const readyCount = samples.filter((sample) => sample.metadata.distillation.readyForFineTune).length;
          const versionSamples = samples.filter((sample) =>
            sample.status === 'candidate'
            && sample.trainable
            && sample.metadata.distillation.readyForFineTune
          );
          const averageQuality = samples.length
            ? Math.round(samples.reduce((sum, sample) => sum + sample.quality.score, 0) / samples.length)
            : 0;
          const qualityLabel = samples.length ? String(averageQuality) : '-';
          const exportParams = toParams(props.filters);
          exportParams.set('kind', item.kind);
          const candidateExportParams = new URLSearchParams(exportParams);
          candidateExportParams.set('status', 'candidate');
          candidateExportParams.set('readyForFineTune', 'true');
          const versionFormat = defaultDatasetFormatForKind(item.kind);
          return (
            <div className="builder-card" key={item.kind}>
              <div className="builder-card-top">
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.copy}</small>
                </span>
                <b className={samples.length ? qualityClass(qualityGradeFromScore(averageQuality)) : 'quality muted-pill'}>{qualityLabel}</b>
              </div>
              <div className="builder-metrics">
                <span><strong>{samples.length}</strong> samples</span>
                <span><strong>{readyCount}</strong> ready</span>
                <span><strong>{reviewCount}</strong> review</span>
                <span><strong>{candidateCount}</strong> candidate</span>
              </div>
              <div className="builder-actions">
                <button className="secondary-button" onClick={() => props.onReviewKind(item.kind)}>
                  <Filter size={14} />
                  Queue
                </button>
                <a className={`export-link ${samples.length === 0 ? 'disabled-link' : ''}`} href={samples.length ? trainingSampleExportUrl(exportParams, 'review_jsonl') : undefined} download>
                  <Download size={14} />
                  Review
                </a>
                <a className={`export-link ${versionSamples.length === 0 ? 'disabled-link' : ''}`} href={versionSamples.length ? trainingSampleExportUrl(candidateExportParams, versionFormat) : undefined} download>
                  <Download size={14} />
                  {datasetFormatLabel(versionFormat)}
                </a>
                <button
                  className="secondary-button"
                  disabled={versionSamples.length === 0 || props.creating}
                  onClick={() => props.onCreateKindVersion({
                    kind: item.kind,
                    sampleIds: versionSamples.map((sample) => sample.id),
                    format: versionFormat,
                  })}
                >
                  {props.creating ? <Loader2 className="spin" size={14} /> : <CheckCircle2 size={14} />}
                  Version
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function DatasetVersionExportLink(props: {
  id: string;
  format: DatasetExportFormat;
  label?: string;
  disabled: boolean;
}) {
  const label = props.label ?? datasetFormatLabel(props.format);
  if (props.disabled) {
    return (
      <span className="export-link export-link-disabled" title="Release Gate is blocked">
        <Download size={14} />
        {label}
      </span>
    );
  }
  return (
    <a className="export-link" href={datasetVersionExportUrl(props.id, props.format)} download>
      <Download size={14} />
      {label}
    </a>
  );
}

function ReleaseManifestSummary(props: {
  version: DatasetVersion;
  manifest?: DatasetReleaseManifest;
  releaseBlocked: boolean;
  generating: boolean;
  promoting: boolean;
  onCreateManifest: (versionId: string) => void;
  onPromoteManifest: (manifestId: string) => void;
}) {
  const manifest = props.manifest;
  const canPromote = manifest?.status === 'ready' && manifest.promotionStatus !== 'promoted';
  return (
    <div className={`release-manifest ${manifest ? `release-manifest-${manifest.status}` : 'release-manifest-empty'}`}>
      <div className="release-manifest-copy">
        <span className={manifest ? releaseManifestStatusClass(manifest.status) : 'release-manifest-status'}>
          {manifest ? releaseManifestStatusLabel(manifest.status) : 'Not generated'}
        </span>
        <strong>Release Manifest</strong>
        <small>
          {manifest
            ? `${manifest.id} · ${formatDate(manifest.generatedAt)} · ${manifest.manifestHash.slice(0, 24)}`
            : 'Capture Gate outcome, snapshot hash, policy versions, lineage, risk and evidence coverage before release.'}
        </small>
      </div>
      <div className="release-manifest-metrics">
        <span><strong>{manifest?.sampleCount ?? props.version.sampleCount}</strong><small>samples</small></span>
        <span><strong>{manifest?.traceCount ?? '-'}</strong><small>traces</small></span>
        <span><strong>{manifest?.riskSummary.highRisk ?? '-'}</strong><small>high risk</small></span>
        <span><strong>{releaseManifestPackageLabel(manifest)}</strong><small>package</small></span>
      </div>
      <div className="release-manifest-actions">
        <button className="primary-button" disabled={props.generating} onClick={() => props.onCreateManifest(props.version.id)}>
          {props.generating ? <Loader2 className="spin" size={14} /> : <Archive size={14} />}
          {props.releaseBlocked ? 'Capture blocked manifest' : 'Generate manifest'}
        </button>
        {manifest && (
          <>
            {manifest.promotionStatus === 'promoted' ? (
              <span className="release-promotion-badge">
                <CheckCircle2 size={14} />
                Promoted
              </span>
            ) : canPromote ? (
              <button className="secondary-button" disabled={props.promoting} onClick={() => props.onPromoteManifest(manifest.id)}>
                {props.promoting ? <Loader2 className="spin" size={14} /> : <CheckCircle2 size={14} />}
                Promote
              </button>
            ) : (
              <span className="export-link export-link-disabled">Audit only</span>
            )}
            <a className="export-link" href={releaseManifestDownloadUrl(manifest.id)} download>
              <Download size={14} />
              Manifest JSON
            </a>
            {manifest.promotion?.id && (
              <a className="export-link" href={releasePackageDownloadUrl(manifest.promotion.id)} download>
                <Download size={14} />
                Package JSON
              </a>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function DatasetVersionsPanel(props: {
  mode?: 'evaluation' | 'training';
  versions: DatasetVersion[];
  manifests: DatasetReleaseManifest[];
  diff?: DatasetVersionDiff;
  selectedId?: string;
  selectedSamples: TrainingSample[];
  loadingSamples: boolean;
  candidateCount: number;
  feedbackReadyCount: number;
  creating: boolean;
  generatingManifestVersionId?: string;
  promotingManifestId?: string;
  focusedEntity?: FocusedTaskEntity;
  onCreate: () => void;
  onSelect: (id: string) => void;
  onSelectTrace: (id: string) => void;
  actingGateKey?: string;
  onReleaseGateAction: (versionId: string, checkId: string, decision: DatasetReleaseGateActionDecision) => void;
  onCreateManifest: (versionId: string) => void;
  onPromoteManifest: (manifestId: string) => void;
}) {
  const selectedVersion = props.versions.find((version) => version.id === props.selectedId) ?? props.versions[0];

  return (
    <section className={`dataset-versions-panel ${entityFocusClass(props.focusedEntity, 'dataset_version')}`} data-entity-panel="dataset_version">
      <div className="panel-title">
        <Database size={16} />
        {props.mode === 'evaluation' ? 'Evaluation Dataset Registry' : 'Dataset Registry'}
        <span className="panel-count">{props.versions.length} versions</span>
        {props.mode !== 'evaluation' && <div className="sample-actions">
          <button className="primary-button" disabled={props.candidateCount === 0 || props.creating} onClick={props.onCreate}>
            {props.creating ? <Loader2 className="spin" size={16} /> : <CheckCircle2 size={16} />}
            Create SFT train set
          </button>
        </div>}
      </div>
      <div className="dataset-version-summary">
        <span className={props.candidateCount > 0 ? 'pill good' : 'pill'}>
          {props.candidateCount} {props.mode === 'evaluation' ? 'evaluation candidates' : 'SFT candidates'}
        </span>
        <span className="pill">source: kodax_candidate_pool</span>
        {props.mode !== 'evaluation' && (
          <span className={props.feedbackReadyCount > 0 ? 'pill good' : 'pill'}>
            {props.feedbackReadyCount} feedback loops ready
          </span>
        )}
        <span className="pill">default: {props.mode === 'evaluation' ? 'eval_jsonl' : 'fine_tune_jsonl'}</span>
      </div>
      {props.versions.length === 0 ? (
        <p className="muted">还没有固化的数据集版本。治理通过后，可以从候选池生成第一版{props.mode === 'evaluation' ? '评测数据集' : '训练集'}。</p>
      ) : props.versions.slice(0, 8).map((version) => {
        const rowGate = buildDatasetReleaseGate(version, version.sampleSnapshots ?? [], props.diff);
        return (
          <div
            className={`dataset-version-row ${version.id === selectedVersion?.id ? 'selected-row' : ''} ${entityFocusClass(props.focusedEntity, 'dataset_version', version.id)}`}
            key={version.id}
            data-entity-kind="dataset_version"
            data-entity-id={version.id}
          >
            <span className="dataset-version-name">
              <strong>{version.name}</strong>
              <small>{version.id} · {datasetSourceLabel(version)} · {formatDate(version.createdAt)} · {version.snapshotHash ? version.snapshotHash.slice(0, 18) : 'live sample ids'}</small>
              {version.feedbackLoopSummary && <small>{feedbackLoopSummaryText(version)}</small>}
            </span>
            <span className="status">{version.format}</span>
            <span>{version.sampleCount} samples</span>
            <span><b className={qualityClass(qualityGradeFromScore(version.averageQuality))}>{version.averageQuality}</b></span>
            <span className={`pill release-status-${rowGate.status}`}>
              {releaseGateStatusLabel(rowGate.status)}
            </span>
            <span className="dataset-version-actions">
              <button className="secondary-button" onClick={() => props.onSelect(version.id)}>
                <FileSearch size={14} />
                Inspect
              </button>
              <DatasetVersionExportLink id={version.id} format={version.format} disabled={rowGate.releaseBlocked} />
              <DatasetVersionExportLink id={version.id} format="traceops_jsonl" label="TraceOps" disabled={rowGate.releaseBlocked} />
            </span>
          </div>
        );
      })}
      <DatasetVersionDetail
        mode={props.mode}
        version={selectedVersion}
        manifest={props.manifests.find((manifest) => manifest.datasetVersionId === selectedVersion?.id)}
        diff={props.diff?.headVersionId === selectedVersion?.id ? props.diff : undefined}
        samples={props.selectedSamples}
        loading={props.loadingSamples}
        focusedEntity={props.focusedEntity}
        onSelectTrace={props.onSelectTrace}
        actingGateKey={props.actingGateKey}
        onReleaseGateAction={props.onReleaseGateAction}
        generatingManifestVersionId={props.generatingManifestVersionId}
        promotingManifestId={props.promotingManifestId}
        onCreateManifest={props.onCreateManifest}
        onPromoteManifest={props.onPromoteManifest}
      />
    </section>
  );
}

function DatasetVersionDetail(props: {
  mode?: 'evaluation' | 'training';
  version?: DatasetVersion;
  manifest?: DatasetReleaseManifest;
  diff?: DatasetVersionDiff;
  samples: TrainingSample[];
  loading: boolean;
  focusedEntity?: FocusedTaskEntity;
  onSelectTrace: (id: string) => void;
  actingGateKey?: string;
  onReleaseGateAction: (versionId: string, checkId: string, decision: DatasetReleaseGateActionDecision) => void;
  generatingManifestVersionId?: string;
  promotingManifestId?: string;
  onCreateManifest: (versionId: string) => void;
  onPromoteManifest: (manifestId: string) => void;
}) {
  if (!props.version) return null;

  const samples = props.samples;
  const kindCounts = countSamplesBy(samples, (sample) => sample.kind);
  const riskCounts = countSamplesBy(samples, (sample) => sample.riskLevel);
  const statusCounts = countSamplesBy(samples, (sample) => sample.status);
  const projectCounts = countSamplesBy(samples, (sample) => sample.projectKey ?? 'unknown');
  const redactedCount = samples.filter((sample) => sample.metadata.distillation.redactionCount > 0).length;
  const evidenceBackedCount = samples.filter((sample) => sample.evidenceCount > 0 || sample.toolEventCount === 0).length;
  const reviewSummary = props.version.reviewSummary ?? {
    approved: samples.filter((sample) => sample.review?.decision === 'approved').length,
    rejected: samples.filter((sample) => sample.review?.decision === 'rejected').length,
    unreviewed: samples.filter((sample) => !sample.review).length,
  };
  const policy = props.version.policies;
  const sourceSignals = Array.from(new Set(samples.flatMap((sample) => sample.metadata.datasetBuilder?.sourceSignals ?? []))).slice(0, 8);
  const releaseGate = buildDatasetReleaseGate(props.version, samples, props.diff);
  const exportDisabled = releaseGate.releaseBlocked;
  const lineageSteps = props.version.source === 'feedback_loop'
    ? ['Post-release Monitor', 'Promoted Feedback', 'Closed-loop Sample', 'Immutable Snapshot', datasetFormatLabel(props.version.format)]
    : ['KodaX session', 'Clean trace', 'Approved candidate', 'Immutable snapshot', datasetFormatLabel(props.version.format)];

  return (
    <div className={`dataset-version-detail ${entityFocusClass(props.focusedEntity, 'dataset_version', props.version.id)}`} data-entity-kind="dataset_version" data-entity-id={props.version.id}>
      <div className="dataset-version-detail-title">
        <span>
          <strong>{props.version.name}</strong>
          <small>{props.version.id} · {datasetFormatLabel(props.version.format)} · {formatDate(props.version.createdAt)}</small>
        </span>
        <span className="dataset-version-detail-actions">
          <DatasetVersionExportLink id={props.version.id} format={props.version.format} disabled={exportDisabled} />
          <DatasetVersionExportLink id={props.version.id} format="traceops_jsonl" label="TraceOps" disabled={exportDisabled} />
        </span>
      </div>

      <div className="dataset-lineage">
        {lineageSteps.map((step) => <span key={step}>{step}</span>)}
      </div>

      {props.version.feedbackLoopSummary && (
        <div className="dataset-source-signals">
          <span className="pill good">{props.version.feedbackLoopSummary.total} promoted loops</span>
          <span className="pill">{feedbackLoopSummaryText(props.version)}</span>
          <span className="pill">{props.version.feedbackLoopSummary.postReleaseMonitorIds.length} monitors</span>
          <span className="pill">{props.version.feedbackLoopSummary.releasePackageIds.length} release packages</span>
        </div>
      )}

      <div className={releaseGateClass(releaseGate.status)}>
        <div className="release-gate-score">
          <span>Release Gate</span>
          <strong>{releaseGate.score}</strong>
          <small>{releaseGateStatusLabel(releaseGate.status)}</small>
        </div>
        <div className="release-gate-copy">
          <strong>{releaseGateStatusLabel(releaseGate.status)}</strong>
          <small>{releaseGate.recommendation}</small>
        </div>
        <div className="release-gate-summary">
          <span><strong>{releaseGate.passCount}</strong> pass</span>
          <span><strong>{releaseGate.warnCount}</strong> warn</span>
          <span><strong>{releaseGate.blockCount}</strong> block</span>
        </div>
        <div className="release-gate-checks">
          {releaseGate.checks.map((check) => {
            const canAct = check.severity !== 'pass' && !check.locked;
            const actionKey = `${props.version!.id}:${check.id}`;
            const isActing = props.actingGateKey?.startsWith(`${actionKey}:`) ?? false;
            return (
              <div className={`release-gate-check ${check.action && check.action.decision !== 'reopened' ? 'release-gate-check-actioned' : ''}`} key={check.id}>
                <span className={gateSeverityClass(check.effectiveSeverity)}>{check.effectiveSeverity}</span>
                <span>
                  <strong>{check.label}</strong>
                  <small>{check.detail}</small>
                  {check.action && (
                    <small className={releaseGateDecisionClass(check.action.decision)}>
                      {releaseGateDecisionLabel(check.action.decision)} · {formatDate(check.action.decidedAt)}
                      {check.action.note ? ` · ${check.action.note}` : ''}
                    </small>
                  )}
                </span>
                <b>{check.metric}</b>
                <span className="release-gate-actions">
                  {canAct && check.severity === 'block' && (
                    <>
                      <button
                        className="secondary-button"
                        disabled={isActing}
                        onClick={() => props.onReleaseGateAction(props.version!.id, check.id, 'resolved')}
                      >
                        Resolve
                      </button>
                      <button
                        className="secondary-button"
                        disabled={isActing}
                        onClick={() => props.onReleaseGateAction(props.version!.id, check.id, 'waived')}
                      >
                        Waive
                      </button>
                    </>
                  )}
                  {canAct && check.severity === 'warn' && (
                    <>
                      <button
                        className="secondary-button"
                        disabled={isActing}
                        onClick={() => props.onReleaseGateAction(props.version!.id, check.id, 'acknowledged')}
                      >
                        Acknowledge
                      </button>
                      <button
                        className="secondary-button"
                        disabled={isActing}
                        onClick={() => props.onReleaseGateAction(props.version!.id, check.id, 'resolved')}
                      >
                        Resolve
                      </button>
                    </>
                  )}
                  {check.action && check.action.decision !== 'reopened' && (
                    <button
                      className="secondary-button"
                      disabled={isActing}
                      onClick={() => props.onReleaseGateAction(props.version!.id, check.id, 'reopened')}
                    >
                      Reopen
                    </button>
                  )}
                  {check.locked && check.effectiveSeverity !== 'pass' && (
                    <span className="gate-action-clear">Use Diff Review</span>
                  )}
                  {!canAct && !check.locked && <span className="gate-action-clear">Clear</span>}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {props.mode !== 'evaluation' && (
        <ReleaseManifestSummary
          version={props.version}
          manifest={props.manifest}
          releaseBlocked={releaseGate.releaseBlocked}
          generating={props.generatingManifestVersionId === props.version.id}
          promoting={props.manifest ? props.promotingManifestId === props.manifest.id : false}
          onCreateManifest={props.onCreateManifest}
          onPromoteManifest={props.onPromoteManifest}
        />
      )}

      <div className="dataset-version-detail-grid">
        <div className="dataset-version-detail-block">
          <h3>Snapshot</h3>
          <div className="kv-list">
            <span>Samples</span><strong>{props.version.sampleCount}</strong>
            <span>Average quality</span><strong>{props.version.averageQuality}</strong>
            <span>Snapshot hash</span><strong>{props.version.snapshotHash?.slice(0, 28) ?? 'live sample ids'}</strong>
            <span>Created by</span><strong>{props.version.createdBy}</strong>
          </div>
        </div>
        <div className="dataset-version-detail-block">
          <h3>Governance</h3>
          <div className="kv-list">
            <span>Approved</span><strong>{reviewSummary.approved}</strong>
            <span>Rejected</span><strong>{reviewSummary.rejected}</strong>
            <span>Unreviewed</span><strong>{reviewSummary.unreviewed}</strong>
            <span>Redacted</span><strong>{redactedCount}/{samples.length || props.version.sampleCount}</strong>
          </div>
        </div>
        <div className="dataset-version-detail-block">
          <h3>Policy</h3>
          <div className="kv-list">
            <span>Sampler</span><strong>{policy?.samplerVersion ?? 'traceops-p0-sampler'}</strong>
            <span>Cleaning</span><strong>{policy?.cleaningPolicyVersion ?? 'kodax-clean-text-v1'}</strong>
            <span>Redaction</span><strong>{policy?.redactionPolicyVersion ?? 'kodax-clean-text-v1'}</strong>
            <span>Evidence</span><strong>{evidenceBackedCount}/{samples.length || props.version.sampleCount}</strong>
          </div>
        </div>
      </div>

      <div className="dataset-distribution-grid">
        <DistributionBlock title="Kind" total={samples.length} items={kindCounts.map((item) => ({ ...item, label: sampleKindLabel(item.key) }))} />
        <DistributionBlock title="Risk" total={samples.length} items={riskCounts} />
        <DistributionBlock title="Status" total={samples.length} items={statusCounts} />
        <DistributionBlock title="Project" total={samples.length} items={projectCounts.slice(0, 4)} />
      </div>

      <div className="dataset-source-signals">
        {(sourceSignals.length ? sourceSignals : ['sample_snapshot', 'governance_review', 'policy_hash']).map((signal) => (
          <span className="pill" key={signal}>{signal}</span>
        ))}
      </div>

      {props.loading ? (
        <p className="muted"><Loader2 className="spin" size={14} /> Loading snapshot samples</p>
      ) : (
        <div className="dataset-sample-table">
          <div className="dataset-sample-head">
            <span>Sample</span>
            <span>Kind</span>
            <span>Risk</span>
            <span>Quality</span>
            <span>Evidence</span>
            <span>Trace</span>
          </div>
          {samples.slice(0, 8).map((sample) => (
            <div className="dataset-sample-row" key={sample.id}>
              <span className="dataset-sample-name">
                <strong>{sample.title}</strong>
                <small>{sample.id} · {sample.promptPreview}</small>
              </span>
              <span>{sampleKindLabel(sample.kind)}</span>
              <span><b className={riskClass(sample.riskLevel)}>{sample.riskLevel}</b></span>
              <span><b className={qualityClass(sample.quality.grade)}>{sample.quality.score}</b></span>
              <span>{sample.evidenceCount}/{sample.toolEventCount}</span>
              <span className="row-actions">
                <button className="secondary-button" onClick={() => props.onSelectTrace(sample.traceId)}>Open</button>
              </span>
            </div>
          ))}
          {samples.length === 0 && <p className="muted">这个版本还没有可展示的样本快照。</p>}
        </div>
      )}
    </div>
  );
}

function DistributionBlock(props: {
  title: string;
  total: number;
  items: Array<{ key: string; label?: string; count: number }>;
}) {
  return (
    <div className="dataset-distribution-block">
      <h3>{props.title}</h3>
      {props.items.length === 0 ? (
        <span className="muted-inline">No data</span>
      ) : props.items.map((item) => (
        <div className="distribution-row" key={item.key}>
          <span>{item.label ?? item.key}</span>
          <strong>{item.count}</strong>
          <small>{percent(item.count, props.total)}</small>
        </div>
      ))}
    </div>
  );
}

function DatasetVersionDiffPanel(props: {
  versions: DatasetVersion[];
  selectedId?: string;
  baseVersionId?: string;
  diff?: DatasetVersionDiff;
  reviewPlan?: DatasetVersionDiffReviewPlan;
  loading: boolean;
  reviewingDecision?: DatasetVersionDiffReviewDecision;
  applyingReviewPlan: boolean;
  onBaseChange: (id: string) => void;
  onReviewDecision: (decision: DatasetVersionDiffReviewDecision) => void;
  onApplyReviewPlan: () => void;
  onSelectDatasetVersion: (id: string) => void;
  onSelectTrace: (id: string) => void;
}) {
  const headVersion = props.versions.find((version) => version.id === props.selectedId);
  const baseOptions = props.versions.filter((version) => version.id !== props.selectedId);
  const diff = props.diff;
  const deltaRows = [
    { key: 'risk', title: 'Risk delta', items: diff ? Object.entries(diff.riskDelta) : [] },
    { key: 'kind', title: 'Kind delta', items: diff ? Object.entries(diff.kindDelta) : [] },
    { key: 'project', title: 'Project delta', items: diff ? Object.entries(diff.projectDelta).slice(0, 6) : [] },
  ];

  return (
    <section className="dataset-diff-panel">
      <div className="panel-title">
        <GitBranch size={16} />
        Dataset Version Diff
        <span className="panel-count">{diff ? `${diff.summary.added + diff.summary.removed + diff.summary.changed} changes` : 'release review'}</span>
        <div className="sample-actions">
          <select
            disabled={!props.selectedId || baseOptions.length === 0}
            value={props.baseVersionId ?? ''}
            onChange={(event) => props.onBaseChange(event.target.value)}
          >
            <option value="">Compare baseline</option>
            {baseOptions.map((version) => (
              <option value={version.id} key={version.id}>{version.name}</option>
            ))}
          </select>
        </div>
      </div>

      {props.versions.length < 2 ? (
        <p className="muted">至少需要两个 Dataset Version 才能进行版本差异对比。</p>
      ) : props.loading ? (
        <p className="muted">正在计算两个冻结数据集版本之间的变化...</p>
      ) : !diff || !headVersion ? (
        <p className="muted">请选择一个 Dataset Version 和基线版本。</p>
      ) : (
        <>
          <div className="dataset-diff-hero">
            <div className="dataset-diff-version">
              <span>Baseline</span>
              <strong>{diff.baseVersionName}</strong>
              <small>{diff.baseVersionId} · {diff.baseSnapshotHash?.slice(0, 24) ?? 'live sample ids'}</small>
              <button className="secondary-button" onClick={() => props.onSelectDatasetVersion(diff.baseVersionId)}>
                <FileSearch size={14} />
                Inspect
              </button>
            </div>
            <div className="dataset-diff-version dataset-diff-version-head">
              <span>Selected</span>
              <strong>{diff.headVersionName}</strong>
              <small>{diff.headVersionId} · {diff.headSnapshotHash?.slice(0, 24) ?? 'live sample ids'}</small>
            </div>
            <div className="dataset-diff-recommendation">
              <AlertTriangle size={15} />
              <span>{diff.recommendation}</span>
            </div>
          </div>

          <div className={`dataset-diff-review dataset-diff-review-${diff.reviewStatus}`}>
            <div className="dataset-diff-review-copy">
              <span className={datasetDiffReviewStatusClass(diff.reviewStatus)}>
                {datasetDiffReviewStatusLabel(diff.reviewStatus)}
              </span>
              <strong>Diff Review</strong>
              <small>
                {diff.review
                  ? `${diff.review.decidedBy} · ${formatDate(diff.review.decidedAt)} · ${diff.review.note ?? 'No note'}`
                  : 'No release owner has confirmed this version diff yet.'}
              </small>
            </div>
            <div className="dataset-diff-review-actions">
              <button
                className="primary-button"
                disabled={Boolean(props.reviewingDecision)}
                onClick={() => props.onReviewDecision('approved')}
              >
                {props.reviewingDecision === 'approved' ? <Loader2 className="spin" size={14} /> : <CheckCircle2 size={14} />}
                Approve
              </button>
              <button
                className="secondary-button"
                disabled={Boolean(props.reviewingDecision)}
                onClick={() => props.onReviewDecision('changes_requested')}
              >
                {props.reviewingDecision === 'changes_requested' ? <Loader2 className="spin" size={14} /> : <Wrench size={14} />}
                Repair
              </button>
              <button
                className="secondary-button"
                disabled={Boolean(props.reviewingDecision)}
                onClick={() => props.onReviewDecision('risk_accepted')}
              >
                {props.reviewingDecision === 'risk_accepted' ? <Loader2 className="spin" size={14} /> : <ShieldAlert size={14} />}
                Accept risk
              </button>
              <button
                className="secondary-button"
                disabled={Boolean(props.reviewingDecision)}
                onClick={() => props.onReviewDecision('reopened')}
              >
                {props.reviewingDecision === 'reopened' ? <Loader2 className="spin" size={14} /> : <RefreshCw size={14} />}
                Reopen
              </button>
            </div>
          </div>

          {props.reviewPlan && (
            <div className={diffReviewPlanClass(props.reviewPlan.readiness)}>
              <div className="closed-loop-review-plan-top">
                <span>
                  <b>{headVersion.source === 'feedback_loop' ? 'Closed-loop Review Plan' : 'Diff Review Plan'}</b>
                  <small>{props.reviewPlan.recommendation}</small>
                </span>
                <span className="closed-loop-review-plan-actions">
                  <span className={datasetDiffReviewStatusClass(props.reviewPlan.recommendedDecision)}>
                    {datasetDiffReviewDecisionLabel(props.reviewPlan.recommendedDecision)}
                  </span>
                  <span className="pill">{diffReviewPlanReadinessLabel(props.reviewPlan.readiness)}</span>
                  <button
                    className="primary-button"
                    disabled={props.applyingReviewPlan || props.reviewPlan.recommendedDecision === 'changes_requested'}
                    onClick={props.onApplyReviewPlan}
                  >
                    {props.applyingReviewPlan ? <Loader2 className="spin" size={14} /> : <CheckCircle2 size={14} />}
                    Apply plan
                  </button>
                </span>
              </div>
              <div className="review-plan-signals">
                {props.reviewPlan.signals.map((signal) => (
                  <span className={diffReviewPlanSignalClass(signal.tone)} key={signal.label}>
                    <small>{signal.label}</small>
                    <strong>{signal.value}</strong>
                  </span>
                ))}
              </div>
              <div className="review-plan-checks">
                {props.reviewPlan.checks.map((check) => (
                  <div className={diffReviewPlanCheckClass(check.status)} key={check.id}>
                    <span>{check.status}</span>
                    <strong>{check.label}</strong>
                    <small>{check.detail}</small>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="dataset-diff-metrics">
            <span><strong>{signedDelta(diff.summary.sampleDelta)}</strong><small>samples</small></span>
            <span><strong>{diff.summary.added}</strong><small>added</small></span>
            <span><strong>{diff.summary.removed}</strong><small>removed</small></span>
            <span><strong>{diff.summary.changed}</strong><small>changed</small></span>
            <span className={datasetDiffMetricClass(diff.summary.averageQualityDelta)}>
              <strong>{signedDelta(diff.summary.averageQualityDelta)}</strong><small>quality</small>
            </span>
            <span className={datasetDiffMetricClass(diff.summary.highRiskDelta, true)}>
              <strong>{signedDelta(diff.summary.highRiskDelta)}</strong><small>high risk</small>
            </span>
            <span className={datasetDiffMetricClass(diff.summary.evidenceGapDelta, true)}>
              <strong>{signedDelta(diff.summary.evidenceGapDelta)}</strong><small>evidence gaps</small>
            </span>
            <span className={datasetDiffMetricClass(diff.summary.approvedDelta)}>
              <strong>{signedDelta(diff.summary.approvedDelta)}</strong><small>approved</small>
            </span>
          </div>

          <div className="dataset-diff-distribution">
            {deltaRows.map((group) => (
              <div className="dataset-diff-delta-card" key={group.key}>
                <h3>{group.title}</h3>
                {group.items.length === 0 ? (
                  <span className="muted-inline">No movement</span>
                ) : group.items.map(([key, value]) => (
                  <div className="dataset-diff-delta-row" key={key}>
                    <span>{key}</span>
                    <strong className={Number(value) > 0 ? 'delta-positive' : 'delta-negative'}>{signedDelta(Number(value))}</strong>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="dataset-diff-table">
            <div className="dataset-diff-head">
              <span>Change</span>
              <span>Sample</span>
              <span>Before</span>
              <span>After</span>
              <span>Signals</span>
              <span>Trace</span>
            </div>
            {diff.changes.filter((change) => change.kind !== 'unchanged').slice(0, 10).map((change) => (
              <div className={`dataset-diff-row dataset-diff-row-${change.importance}`} key={`${change.kind}-${change.sampleId}`}>
                <span className={datasetDiffChangeClass(change.kind)}>{datasetDiffChangeLabel(change.kind)}</span>
                <span className="dataset-diff-sample-name">
                  <strong>{change.title}</strong>
                  <small>{change.sampleId} · {change.sourceSessionId}</small>
                </span>
                <span>{datasetDiffPointLabel(change.before)}</span>
                <span>{datasetDiffPointLabel(change.after)}</span>
                <span className="dataset-diff-signals">
                  {change.signals.length === 0 ? (
                    <b className="dataset-diff-signal">No signal</b>
                  ) : change.signals.slice(0, 3).map((signal) => (
                    <b className={datasetDiffSignalClass(signal.direction)} key={`${change.sampleId}-${signal.label}`}>
                      {signal.label}
                    </b>
                  ))}
                </span>
                <span className="row-actions">
                  <button className="secondary-button" onClick={() => props.onSelectTrace(change.traceId)}>
                    Open
                  </button>
                </span>
              </div>
            ))}
            {diff.changes.every((change) => change.kind === 'unchanged') && (
              <p className="muted">这个版本和基线版本没有样本级变化。</p>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function ReleaseManifestsPanel(props: {
  manifests: DatasetReleaseManifest[];
  handoffs: DatasetRetrainingHandoffRecord[];
  promotingManifestId?: string;
  creatingHandoffManifestId?: string;
  focusedEntity?: FocusedTaskEntity;
  onSelectDatasetVersion: (id: string) => void;
  onPromoteManifest: (manifestId: string) => void;
  onCreateHandoffFromManifest: (manifestId: string) => void;
}) {
  return (
    <section className={`release-manifests-panel ${entityFocusClass(props.focusedEntity, 'release_manifest')}`} data-entity-panel="release_manifest">
      <div className="panel-title">
        <Archive size={16} />
        Release Manifest Registry
        <span className="panel-count">{props.manifests.length} manifests</span>
      </div>
      {props.manifests.length === 0 ? (
        <p className="muted">还没有生成发布清单。先在 Dataset Registry 中选择一个 dataset version，再生成 Manifest。</p>
      ) : (
        <div className="release-manifest-table">
          <div className="release-manifest-head">
            <span>Manifest</span>
            <span>Status</span>
            <span>Samples</span>
            <span>Risk</span>
            <span>Package</span>
            <span>Actions</span>
          </div>
          {props.manifests.slice(0, 8).map((manifest) => {
            const hasHandoff = props.handoffs.some((handoff) => handoff.manifestId === manifest.id && handoff.status !== 'cancelled');
            return (
              <div className={`release-manifest-row ${entityFocusClass(props.focusedEntity, 'release_manifest', manifest.id)}`} key={manifest.id} data-entity-kind="release_manifest" data-entity-id={manifest.id}>
                <span className="release-manifest-name">
                  <strong>{manifest.datasetVersionName}</strong>
                  <small>{manifest.id} · {formatDate(manifest.generatedAt)} · {manifest.manifestHash.slice(0, 18)}</small>
                </span>
                <span className={releaseManifestStatusClass(manifest.status)}>{releaseManifestStatusLabel(manifest.status)}</span>
                <span>{manifest.sampleCount} samples · {manifest.traceCount} traces</span>
                <span>{manifest.riskSummary.highRisk} high · {manifest.riskSummary.blocked} blocked</span>
                <span className={releasePromotionStatusClass(manifest.promotionStatus)}>
                  {hasHandoff ? 'Handoff' : manifest.promotionStatus === 'promoted' ? 'Release' : manifest.status === 'ready' ? 'Release-ready' : 'Audit only'}
                </span>
                <span className="release-manifest-row-actions">
                  <button className="secondary-button" onClick={() => props.onSelectDatasetVersion(manifest.datasetVersionId)}>
                    <FileSearch size={14} />
                    Dataset
                  </button>
                  {manifest.promotionStatus === 'promoted' ? (
                    <span className="release-promotion-badge compact">
                      <CheckCircle2 size={14} />
                      Promoted
                    </span>
                  ) : manifest.status === 'ready' ? (
                    <button className="secondary-button" disabled={props.promotingManifestId === manifest.id} onClick={() => props.onPromoteManifest(manifest.id)}>
                      {props.promotingManifestId === manifest.id ? <Loader2 className="spin" size={14} /> : <CheckCircle2 size={14} />}
                      Promote
                    </button>
                  ) : (
                    <span className="export-link export-link-disabled">Audit</span>
                  )}
                  {hasHandoff ? (
                    <span className="release-promotion-badge compact">
                      <Workflow size={14} />
                      Handoff
                    </span>
                  ) : (
                    <button
                      className="secondary-button"
                      disabled={manifest.status !== 'ready' || props.creatingHandoffManifestId === manifest.id}
                      onClick={() => props.onCreateHandoffFromManifest(manifest.id)}
                    >
                      {props.creatingHandoffManifestId === manifest.id ? <Loader2 className="spin" size={14} /> : <Workflow size={14} />}
                      Handoff
                    </button>
                  )}
                  <a className="export-link" href={releaseManifestDownloadUrl(manifest.id)} download>
                    <Download size={14} />
                    JSON
                  </a>
                  {manifest.promotion?.id && (
                    <a className="export-link" href={releasePackageDownloadUrl(manifest.promotion.id)} download>
                      <Download size={14} />
                      Package
                    </a>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function ReleasePromotionsPanel(props: {
  promotions: DatasetReleasePromotionRecord[];
  handoffs: DatasetRetrainingHandoffRecord[];
  creatingHandoffPromotionId?: string;
  focusedEntity?: FocusedTaskEntity;
  onSelectDatasetVersion: (id: string) => void;
  onCreateHandoff: (promotionId: string) => void;
}) {
  return (
    <section className={`release-promotions-panel ${entityFocusClass(props.focusedEntity, 'release_promotion')}`} data-entity-panel="release_promotion">
      <div className="panel-title">
        <CheckCircle2 size={16} />
        Promoted Releases
        <span className="panel-count">{props.promotions.length} releases</span>
      </div>
      {props.promotions.length === 0 ? (
        <p className="muted">还没有正式晋级的发布包。Ready Manifest 通过 Promote 后会出现在这里。</p>
      ) : (
        <div className="release-promotion-table">
          <div className="release-promotion-head">
            <span>Release</span>
            <span>Status</span>
            <span>Manifest</span>
            <span>Promoted</span>
            <span>Actions</span>
          </div>
          {props.promotions.slice(0, 8).map((promotion) => (
            <div className={`release-promotion-row ${entityFocusClass(props.focusedEntity, 'release_promotion', promotion.id)}`} key={promotion.id} data-entity-kind="release_promotion" data-entity-id={promotion.id}>
              <span className="release-manifest-name">
                <strong>{promotion.datasetVersionName}</strong>
                <small>{promotion.id} · {promotion.manifestHash.slice(0, 18)}</small>
              </span>
              <span className={releasePromotionStatusClass(promotion.status)}>{releasePromotionStatusLabel(promotion.status)}</span>
              <span>{promotion.manifestId}</span>
              <span>{promotion.promotedBy} · {formatDate(promotion.promotedAt)}</span>
              <span className="release-manifest-row-actions">
                <button className="secondary-button" onClick={() => props.onSelectDatasetVersion(promotion.datasetVersionId)}>
                  <FileSearch size={14} />
                  Dataset
                </button>
                {props.handoffs.some((handoff) => handoff.promotionId === promotion.id && handoff.status !== 'cancelled') ? (
                  <span className="release-promotion-badge compact">
                    <CheckCircle2 size={14} />
                    Handoff
                  </span>
                ) : (
                  <button className="secondary-button" disabled={props.creatingHandoffPromotionId === promotion.id} onClick={() => props.onCreateHandoff(promotion.id)}>
                    {props.creatingHandoffPromotionId === promotion.id ? <Loader2 className="spin" size={14} /> : <Workflow size={14} />}
                    Handoff
                  </button>
                )}
                <a className="export-link" href={releasePackageDownloadUrl(promotion.id)} download>
                  <Download size={14} />
                  Package
                </a>
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function RetrainingHandoffsPanel(props: {
  handoffs: DatasetRetrainingHandoffRecord[];
  launchPlans: DatasetTrainingLaunchPlan[];
  trainingRuns: DatasetTrainingRunRecord[];
  creatingTrainingRunHandoffId?: string;
  focusedEntity?: FocusedTaskEntity;
  onSelectDatasetVersion: (id: string) => void;
  onCreateTrainingRun: (handoffId: string) => void;
}) {
  return (
    <section className={`retraining-handoff-panel ${entityFocusClass(props.focusedEntity, 'retraining_handoff')}`} data-entity-panel="retraining_handoff">
      <div className="panel-title">
        <Workflow size={16} />
        Retraining Handoffs
        <span className="panel-count">{props.handoffs.length} handoffs</span>
      </div>
      {props.handoffs.length === 0 ? (
        <p className="muted">还没有复训交接任务单。Promoted Release 创建 Handoff 后会出现在这里。</p>
      ) : (
        <div className="retraining-handoff-table">
          <div className="retraining-handoff-head">
            <span>Handoff</span>
            <span>Status</span>
            <span>Owner</span>
            <span>Launch Plan</span>
            <span>Checklist</span>
            <span>Actions</span>
          </div>
          {props.handoffs.slice(0, 8).map((handoff) => {
            const done = handoff.checklist.filter((item) => item.status === 'done').length;
            const hasRun = props.trainingRuns.some((run) => run.handoffId === handoff.id && run.status !== 'cancelled');
            const launchPlan = props.launchPlans.find((plan) => plan.handoffId === handoff.id);
            const blockedChecks = launchPlan?.checks.filter((check) => check.status === 'block').length ?? 0;
            const reviewChecks = launchPlan?.checks.filter((check) => check.status === 'review').length ?? 0;
            return (
              <div className={`retraining-handoff-row ${entityFocusClass(props.focusedEntity, 'retraining_handoff', handoff.id)}`} key={handoff.id} data-entity-kind="retraining_handoff" data-entity-id={handoff.id}>
                <span className="release-manifest-name">
                  <strong>{handoff.datasetVersionName}</strong>
                  <small>{handoff.id} · {handoff.handoffHash.slice(0, 18)}</small>
                </span>
                <span className={`retraining-handoff-status retraining-handoff-status-${handoff.status}`}>{handoff.status.replace(/_/g, ' ')}</span>
                <span>{handoff.trainingOwner} · {handoff.targetSystem}</span>
                <span className="training-launch-plan-cell">
                  <b className={trainingLaunchReadinessClass(launchPlan?.readiness)}>{trainingLaunchReadinessLabel(launchPlan?.readiness)}</b>
                  <small>{trainingLaunchObjectiveLabel(launchPlan?.objective)} · {launchPlan?.recommendedModelName ?? 'waiting'}</small>
                </span>
                <span>{done}/{handoff.checklist.length} done · {blockedChecks} block · {reviewChecks} review</span>
                <span className="release-manifest-row-actions">
                  <button className="secondary-button" onClick={() => props.onSelectDatasetVersion(handoff.datasetVersionId)}>
                    <FileSearch size={14} />
                    Dataset
                  </button>
                  {hasRun ? (
                    <span className="release-promotion-badge compact">
                      <CheckCircle2 size={14} />
                      Run
                    </span>
                  ) : (
                    <button className="secondary-button" disabled={!launchPlan || launchPlan.readiness === 'blocked' || props.creatingTrainingRunHandoffId === handoff.id} onClick={() => props.onCreateTrainingRun(handoff.id)}>
                      {props.creatingTrainingRunHandoffId === handoff.id ? <Loader2 className="spin" size={14} /> : <Play size={14} />}
                      Launch
                    </button>
                  )}
                  <a className="export-link" href={retrainingHandoffDownloadUrl(handoff.id)} download>
                    <Download size={14} />
                    Handoff
                  </a>
                  <a className="export-link" href={handoff.packageUrl} download>
                    <Download size={14} />
                    Package
                  </a>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function TrainingRunsPanel(props: {
  runs: DatasetTrainingRunRecord[];
  evalRuns: DatasetEvalRunRecord[];
  gates: DatasetModelReleaseGateRecord[];
  recordingRunId?: string;
  syncingProviderRunId?: string;
  runningEvalRunId?: string;
  creatingModelGateRunId?: string;
  focusedEntity?: FocusedTaskEntity;
  onSelectDatasetVersion: (id: string) => void;
  onRecordResult: (runId: string) => void;
  onSyncProvider: (runId: string) => void;
  onRunEval: (runId: string) => void;
  onCreateModelReleaseGate: (runId: string) => void;
}) {
  return (
    <section className={`training-runs-panel ${entityFocusClass(props.focusedEntity, 'training_run')}`} data-entity-panel="training_run">
      <div className="panel-title">
        <Server size={16} />
        Training Runs
        <span className="panel-count">{props.runs.length} runs</span>
      </div>
      {props.runs.length === 0 ? (
        <p className="muted">还没有复训运行记录。从 Retraining Handoff 创建 Run 后会出现在这里。</p>
      ) : (
        <div className="training-runs-table">
          <div className="training-runs-head">
            <span>Run</span>
            <span>Status</span>
            <span>Model</span>
            <span>Evaluation</span>
            <span>Source</span>
            <span>Actions</span>
          </div>
          {props.runs.slice(0, 10).map((run) => {
            const validation = run.metrics.find((metric) => metric.id === 'validation-score');
            const regression = run.metrics.find((metric) => metric.id === 'regression-rate');
            const blocked = run.metrics.find((metric) => metric.id === 'blocked-issues');
            const latestEval = props.evalRuns.find((item) => item.trainingRunId === run.id);
            const hasGate = props.gates.some((gate) => gate.trainingRunId === run.id && gate.status !== 'rejected');
            const latestProviderStatus = run.providerStatusChecks?.[0];
            const evaluation = run.qualityGate === 'pending'
              ? latestEval ? `${evalRunStatusLabel(latestEval.status)} · ${latestEval.evalHash.slice(0, 18)}` : 'Waiting for result'
              : `V ${validation ? trainingRunMetricLabel(validation) : '-'} · R ${regression ? trainingRunMetricLabel(regression) : '-'} · B ${blocked ? trainingRunMetricLabel(blocked) : '-'}`;
            return (
              <div className={`training-runs-row ${entityFocusClass(props.focusedEntity, 'training_run', run.id)}`} key={run.id} data-entity-kind="training_run" data-entity-id={run.id}>
                <span className="release-manifest-name">
                  <strong>{run.datasetVersionName}</strong>
                  <small>{run.id} · {run.runHash.slice(0, 18)}</small>
                  {run.launchPlan && <small>{trainingLaunchObjectiveLabel(run.launchPlan.objective)} plan · {run.launchPlanHash?.slice(0, 18)}</small>}
                </span>
                <span className={trainingRunStatusClass(run.status)}>{trainingRunStatusLabel(run.status)}</span>
                <span>{run.modelName}{run.modelVersion ? ` · ${run.modelVersion}` : ''}</span>
                <span className="training-eval-cell">
                  {evaluation}
                  {latestEval && <small>{latestEval.runnerVersion} · {formatDate(latestEval.completedAt)}</small>}
                  {latestProviderStatus && <small>Provider {latestProviderStatus.providerStatus} · {formatDate(latestProviderStatus.checkedAt)}</small>}
                </span>
                <span>{run.owner} · {run.externalRunId ?? run.targetSystem}</span>
                <span className="release-manifest-row-actions">
                  <button className="secondary-button" onClick={() => props.onSelectDatasetVersion(run.datasetVersionId)}>
                    <FileSearch size={14} />
                    Dataset
                  </button>
                  <button className="secondary-button" disabled={props.recordingRunId === run.id} onClick={() => props.onRecordResult(run.id)}>
                    {props.recordingRunId === run.id ? <Loader2 className="spin" size={14} /> : <CheckCircle2 size={14} />}
                    Result
                  </button>
                  <button className="secondary-button" disabled={props.syncingProviderRunId === run.id} onClick={() => props.onSyncProvider(run.id)}>
                    {props.syncingProviderRunId === run.id ? <Loader2 className="spin" size={14} /> : <RefreshCw size={14} />}
                    Provider
                  </button>
                  <button className="secondary-button" disabled={props.runningEvalRunId === run.id} onClick={() => props.onRunEval(run.id)}>
                    {props.runningEvalRunId === run.id ? <Loader2 className="spin" size={14} /> : <BookOpenCheck size={14} />}
                    {latestEval ? 'Re-eval' : 'Eval'}
                  </button>
                  {hasGate ? (
                    <span className="release-promotion-badge compact">
                      <ShieldAlert size={14} />
                      Gate
                    </span>
                  ) : (
                    <button className="secondary-button" disabled={props.creatingModelGateRunId === run.id} onClick={() => props.onCreateModelReleaseGate(run.id)}>
                      {props.creatingModelGateRunId === run.id ? <Loader2 className="spin" size={14} /> : <ShieldAlert size={14} />}
                      Gate
                    </button>
                  )}
                  <a className="export-link" href={run.trainingDataUrl} download>
                    <Download size={14} />
                    Data
                  </a>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function EvalRunsPanel(props: {
  evalRuns: DatasetEvalRunRecord[];
  focusedEntity?: FocusedTaskEntity;
  onSelectDatasetVersion: (id: string) => void;
}) {
  return (
    <section className={`eval-runs-panel ${entityFocusClass(props.focusedEntity, 'eval_run')}`} data-entity-panel="eval_run">
      <div className="panel-title">
        <BookOpenCheck size={16} />
        Eval Runs
        <span className="panel-count">{props.evalRuns.length} evals</span>
      </div>
      {props.evalRuns.length === 0 ? (
        <p className="muted">还没有 TraceOps 标准评估记录。从 Training Run 点击 Eval 后会生成。</p>
      ) : (
        <div className="eval-runs-table">
          <div className="eval-runs-head">
            <span>Eval</span>
            <span>Status</span>
            <span>Metrics</span>
            <span>Cases</span>
            <span>Lineage</span>
            <span>Actions</span>
          </div>
          {props.evalRuns.slice(0, 10).map((evalRun) => {
            const metricText = evalRun.metrics.map((metric) => `${metric.label}: ${trainingRunMetricLabel(metric)}`).join(' · ');
            const passedCases = evalRun.cases.filter((item) => item.status === 'passed').length;
            const warningCases = evalRun.cases.filter((item) => item.status === 'warning').length;
            const failedCases = evalRun.cases.filter((item) => item.status === 'failed').length;
            return (
              <div className={`eval-runs-row ${entityFocusClass(props.focusedEntity, 'eval_run', evalRun.id)}`} key={evalRun.id} data-entity-kind="eval_run" data-entity-id={evalRun.id}>
                <span className="release-manifest-name">
                  <strong>{evalRun.modelName}{evalRun.modelVersion ? ` · ${evalRun.modelVersion}` : ''}</strong>
                  <small>{evalRun.id} · {evalRun.evalHash.slice(0, 18)}</small>
                  <small>{evalRun.runnerVersion} · {formatDate(evalRun.completedAt)}</small>
                </span>
                <span className={evalRunStatusClass(evalRun.status)}>{evalRunStatusLabel(evalRun.status)}</span>
                <span>{metricText}</span>
                <span>{passedCases} pass · {warningCases} warn · {failedCases} fail</span>
                <span>{evalRun.datasetVersionName} · {evalRun.launchPlanHash?.slice(0, 18) ?? evalRun.trainingRunHash.slice(0, 18)}</span>
                <span className="release-manifest-row-actions">
                  <button className="secondary-button" onClick={() => props.onSelectDatasetVersion(evalRun.datasetVersionId)}>
                    <FileSearch size={14} />
                    Dataset
                  </button>
                  <a className="export-link" href={evalRunDownloadUrl(evalRun.id)} download>
                    <Download size={14} />
                    Eval
                  </a>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function ModelReleaseGatesPanel(props: {
  gates: DatasetModelReleaseGateRecord[];
  deploymentHandoffs: DatasetDeploymentHandoffRecord[];
  decidingKey?: string;
  creatingDeploymentGateId?: string;
  focusedEntity?: FocusedTaskEntity;
  onSelectDatasetVersion: (id: string) => void;
  onDecision: (gateId: string, decision: DatasetModelReleaseGateDecision) => void;
  onCreateDeploymentHandoff: (gateId: string) => void;
}) {
  return (
    <section className={`model-release-gates-panel ${entityFocusClass(props.focusedEntity, 'model_release_gate')}`} data-entity-panel="model_release_gate">
      <div className="panel-title">
        <ShieldAlert size={16} />
        Model Release Gates
        <span className="panel-count">{props.gates.length} gates</span>
      </div>
      {props.gates.length === 0 ? (
        <p className="muted">还没有模型发布门禁。从 passed Training Run 创建 Gate 后会出现在这里。</p>
      ) : (
        <div className="model-release-gates-table">
          <div className="model-release-gates-head">
            <span>Gate</span>
            <span>Status</span>
            <span>Model</span>
            <span>Checks</span>
            <span>Approved</span>
            <span>Actions</span>
          </div>
          {props.gates.slice(0, 10).map((gate) => {
            const passed = gate.checks.filter((check) => check.status === 'passed').length;
            const failedChecks = gate.checks.filter((check) => check.status === 'failed');
            const latestDecision = gate.decisions.at(-1);
            const hasDeployment = props.deploymentHandoffs.some((handoff) => handoff.modelReleaseGateId === gate.id && handoff.status !== 'cancelled');
            return (
              <div className={`model-release-gates-row ${entityFocusClass(props.focusedEntity, 'model_release_gate', gate.id)}`} key={gate.id} data-entity-kind="model_release_gate" data-entity-id={gate.id}>
                <span className="release-manifest-name">
                  <strong>{gate.datasetVersionName}</strong>
                  <small>{gate.id} · {gate.gateHash.slice(0, 18)}</small>
                  {gate.evalRunHash && <small>Eval {gate.evalStatus ?? 'unknown'} · {gate.evalRunHash.slice(0, 18)}</small>}
                </span>
                <span className={modelReleaseGateStatusClass(gate.status)}>{modelReleaseGateStatusLabel(gate.status)}</span>
                <span>{gate.modelName}{gate.externalRunId ? ` · ${gate.externalRunId}` : ''}</span>
                <span className="model-gate-check-cell">
                  {passed}/{gate.checks.length} passed{failedChecks[0] ? ` · ${failedChecks[0].label}` : ''}
                  {gate.evalCaseSummary && <small>{gate.evalCaseSummary.passed} eval pass · {gate.evalCaseSummary.warning} warn · {gate.evalCaseSummary.failed} fail</small>}
                </span>
                <span>{gate.approvedBy ? `${gate.approvedBy} · ${formatDate(gate.approvedAt)}` : latestDecision ? `${latestDecision.decision} · ${formatDate(latestDecision.decidedAt)}` : 'Not decided'}</span>
                <span className="release-manifest-row-actions">
                  <button className="secondary-button" onClick={() => props.onSelectDatasetVersion(gate.datasetVersionId)}>
                    <FileSearch size={14} />
                    Dataset
                  </button>
                  <button
                    className="secondary-button"
                    disabled={gate.status !== 'ready' || props.decidingKey === `${gate.id}:approved`}
                    onClick={() => props.onDecision(gate.id, 'approved')}
                  >
                    {props.decidingKey === `${gate.id}:approved` ? <Loader2 className="spin" size={14} /> : <CheckCircle2 size={14} />}
                    Approve
                  </button>
                  <button
                    className="secondary-button"
                    disabled={props.decidingKey === `${gate.id}:rejected`}
                    onClick={() => props.onDecision(gate.id, 'rejected')}
                  >
                    {props.decidingKey === `${gate.id}:rejected` ? <Loader2 className="spin" size={14} /> : <AlertTriangle size={14} />}
                    Reject
                  </button>
                  <button
                    className="secondary-button"
                    disabled={props.decidingKey === `${gate.id}:reopened`}
                    onClick={() => props.onDecision(gate.id, 'reopened')}
                  >
                    {props.decidingKey === `${gate.id}:reopened` ? <Loader2 className="spin" size={14} /> : <RefreshCw size={14} />}
                    Reopen
                  </button>
                  {hasDeployment ? (
                    <span className="release-promotion-badge compact">
                      <Server size={14} />
                      Deploy
                    </span>
                  ) : (
                    <button
                      className="secondary-button"
                      disabled={gate.status !== 'approved' || props.creatingDeploymentGateId === gate.id}
                      onClick={() => props.onCreateDeploymentHandoff(gate.id)}
                    >
                      {props.creatingDeploymentGateId === gate.id ? <Loader2 className="spin" size={14} /> : <Server size={14} />}
                      Deploy
                    </button>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function DeploymentHandoffsPanel(props: {
  handoffs: DatasetDeploymentHandoffRecord[];
  monitors: DatasetPostReleaseMonitorRecord[];
  updatingKey?: string;
  creatingMonitorDeploymentId?: string;
  focusedEntity?: FocusedTaskEntity;
  onSelectDatasetVersion: (id: string) => void;
  onUpdateStatus: (handoffId: string, status: DatasetDeploymentHandoffStatus) => void;
  onCreatePostReleaseMonitor: (handoffId: string) => void;
}) {
  return (
    <section className={`deployment-handoffs-panel ${entityFocusClass(props.focusedEntity, 'deployment_handoff')}`} data-entity-panel="deployment_handoff">
      <div className="panel-title">
        <HardDrive size={16} />
        Deployment Handoffs
        <span className="panel-count">{props.handoffs.length} handoffs</span>
      </div>
      {props.handoffs.length === 0 ? (
        <p className="muted">还没有部署交接。Approved Model Release Gate 创建 Deploy 后会出现在这里。</p>
      ) : (
        <div className="deployment-handoffs-table">
          <div className="deployment-handoffs-head">
            <span>Handoff</span>
            <span>Status</span>
            <span>Environment</span>
            <span>Checklist</span>
            <span>Updated</span>
            <span>Actions</span>
          </div>
          {props.handoffs.slice(0, 10).map((handoff) => {
            const done = handoff.checklist.filter((item) => item.status === 'done').length;
            const latest = handoff.events.at(-1);
            const hasMonitor = props.monitors.some((monitor) => monitor.deploymentHandoffId === handoff.id && monitor.status !== 'closed');
            return (
              <div className={`deployment-handoffs-row ${entityFocusClass(props.focusedEntity, 'deployment_handoff', handoff.id)}`} key={handoff.id} data-entity-kind="deployment_handoff" data-entity-id={handoff.id}>
                <span className="release-manifest-name">
                  <strong>{handoff.modelName}</strong>
                  <small>{handoff.id} · {handoff.handoffHash.slice(0, 18)}</small>
                  <small>Gate {handoff.modelReleaseGateHash.slice(0, 18)}{handoff.evalRunHash ? ` · Eval ${handoff.evalRunHash.slice(0, 18)}` : ''}</small>
                </span>
                <span className={deploymentHandoffStatusClass(handoff.status)}>{deploymentHandoffStatusLabel(handoff.status)}</span>
                <span>{handoff.environment} · {handoff.deploymentOwner}</span>
                <span className="deployment-evidence-cell">
                  {done}/{handoff.checklist.length} done
                  {handoff.evalCaseSummary && <small>{handoff.evalCaseSummary.passed} eval pass · {handoff.evalCaseSummary.warning} warn · {handoff.evalCaseSummary.failed} fail</small>}
                  {handoff.modelGateCheckSummary && <small>{handoff.modelGateCheckSummary.passed} gate pass · {handoff.modelGateCheckSummary.failed} fail</small>}
                </span>
                <span>{latest ? `${latest.status} · ${formatDate(latest.recordedAt)}` : formatDate(handoff.updatedAt)}</span>
                <span className="release-manifest-row-actions">
                  <button className="secondary-button" onClick={() => props.onSelectDatasetVersion(handoff.datasetVersionId)}>
                    <FileSearch size={14} />
                    Dataset
                  </button>
                  <button
                    className="secondary-button"
                    disabled={props.updatingKey === `${handoff.id}:preparing`}
                    onClick={() => props.onUpdateStatus(handoff.id, 'preparing')}
                  >
                    {props.updatingKey === `${handoff.id}:preparing` ? <Loader2 className="spin" size={14} /> : <Wrench size={14} />}
                    Prep
                  </button>
                  <button
                    className="secondary-button"
                    disabled={props.updatingKey === `${handoff.id}:ready_for_rollout`}
                    onClick={() => props.onUpdateStatus(handoff.id, 'ready_for_rollout')}
                  >
                    {props.updatingKey === `${handoff.id}:ready_for_rollout` ? <Loader2 className="spin" size={14} /> : <Play size={14} />}
                    Ready
                  </button>
                  <button
                    className="secondary-button"
                    disabled={props.updatingKey === `${handoff.id}:live`}
                    onClick={() => props.onUpdateStatus(handoff.id, 'live')}
                  >
                    {props.updatingKey === `${handoff.id}:live` ? <Loader2 className="spin" size={14} /> : <CheckCircle2 size={14} />}
                    Live
                  </button>
                  <button
                    className="secondary-button"
                    disabled={props.updatingKey === `${handoff.id}:rolled_back`}
                    onClick={() => props.onUpdateStatus(handoff.id, 'rolled_back')}
                  >
                    {props.updatingKey === `${handoff.id}:rolled_back` ? <Loader2 className="spin" size={14} /> : <RefreshCw size={14} />}
                    Rollback
                  </button>
                  {hasMonitor ? (
                    <span className="release-promotion-badge compact">
                      <History size={14} />
                      Monitor
                    </span>
                  ) : (
                    <button
                      className="secondary-button"
                      disabled={handoff.status !== 'live' || props.creatingMonitorDeploymentId === handoff.id}
                      onClick={() => props.onCreatePostReleaseMonitor(handoff.id)}
                    >
                      {props.creatingMonitorDeploymentId === handoff.id ? <Loader2 className="spin" size={14} /> : <History size={14} />}
                      Monitor
                    </button>
                  )}
                  <a className="export-link" href={deploymentHandoffDownloadUrl(handoff.id)} download>
                    <Download size={14} />
                    Handoff
                  </a>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function PostReleaseMonitorsPanel(props: {
  monitors: DatasetPostReleaseMonitorRecord[];
  feedbackLoops: DatasetFeedbackLoopRecord[];
  recordingId?: string;
  creatingFeedbackMonitorId?: string;
  focusedEntity?: FocusedTaskEntity;
  onSelectDatasetVersion: (id: string) => void;
  onRecordSignal: (monitorId: string, mode: 'healthy' | 'attention' | 'rollback' | 'close') => void;
  onCreateFeedbackLoop: (monitorId: string) => void;
}) {
  return (
    <section className={`post-release-monitors-panel ${entityFocusClass(props.focusedEntity, 'post_release_monitor')}`} data-entity-panel="post_release_monitor">
      <div className="panel-title">
        <History size={16} />
        Post-release Monitors
        <span className="panel-count">{props.monitors.length} monitors</span>
      </div>
      {props.monitors.length === 0 ? (
        <p className="muted">还没有上线后监控回流。Live Deployment Handoff 创建 Monitor 后会出现在这里。</p>
      ) : (
        <div className="post-release-monitors-table">
          <div className="post-release-monitors-head">
            <span>Monitor</span>
            <span>Status</span>
            <span>Online Metrics</span>
            <span>Alerts</span>
            <span>Updated</span>
            <span>Actions</span>
          </div>
          {props.monitors.slice(0, 10).map((monitor) => {
            const success = monitor.metrics.find((metric) => metric.id === 'task-success-rate');
            const regression = monitor.metrics.find((metric) => metric.id === 'regression-alert-rate');
            const latency = monitor.metrics.find((metric) => metric.id === 'p95-latency-ms');
            const hasFeedback = props.feedbackLoops.some((loop) => loop.postReleaseMonitorId === monitor.id && loop.status !== 'rejected');
            const metricText = `S ${success ? postReleaseMetricLabel(success) : '-'} · R ${regression ? postReleaseMetricLabel(regression) : '-'} · P95 ${latency ? postReleaseMetricLabel(latency) : '-'}`;
            const alertText = monitor.alerts.length > 0
              ? `${monitor.alerts.length} · ${monitor.alerts[0]?.label ?? 'alert'}`
              : monitor.rollbackSignal ? 'rollback signal' : 'clear';
            return (
              <div className={`post-release-monitors-row ${entityFocusClass(props.focusedEntity, 'post_release_monitor', monitor.id)}`} key={monitor.id} data-entity-kind="post_release_monitor" data-entity-id={monitor.id}>
                <span className="release-manifest-name">
                  <strong>{monitor.modelName}</strong>
                  <small>{monitor.id} · {monitor.monitorHash.slice(0, 18)}</small>
                  <small>Deploy {monitor.deploymentHandoffHash.slice(0, 18)}{monitor.evalRunHash ? ` · Eval ${monitor.evalRunHash.slice(0, 18)}` : ''}</small>
                </span>
                <span className={postReleaseMonitorStatusClass(monitor.status)}>{postReleaseMonitorStatusLabel(monitor.status)}</span>
                <span className="post-release-evidence-cell">
                  {metricText}
                  {monitor.signalSummary && <small>{monitor.signalSummary.passed} pass · {monitor.signalSummary.warning} warn · {monitor.signalSummary.failed} fail · {feedbackLoopTargetLabel(monitor.signalSummary.targetKind)}</small>}
                  {monitor.releaseEvidenceHash && <small>Evidence {monitor.releaseEvidenceHash.slice(0, 18)}</small>}
                </span>
                <span>{alertText}</span>
                <span>{formatDate(monitor.updatedAt)} · {monitor.monitorOwner}</span>
                <span className="release-manifest-row-actions">
                  <button className="secondary-button" onClick={() => props.onSelectDatasetVersion(monitor.datasetVersionId)}>
                    <FileSearch size={14} />
                    Dataset
                  </button>
                  <button className="secondary-button" disabled={props.recordingId === monitor.id} onClick={() => props.onRecordSignal(monitor.id, 'healthy')}>
                    {props.recordingId === monitor.id ? <Loader2 className="spin" size={14} /> : <CheckCircle2 size={14} />}
                    Healthy
                  </button>
                  <button className="secondary-button" disabled={props.recordingId === monitor.id} onClick={() => props.onRecordSignal(monitor.id, 'attention')}>
                    {props.recordingId === monitor.id ? <Loader2 className="spin" size={14} /> : <AlertTriangle size={14} />}
                    Watch
                  </button>
                  <button className="secondary-button" disabled={props.recordingId === monitor.id} onClick={() => props.onRecordSignal(monitor.id, 'rollback')}>
                    {props.recordingId === monitor.id ? <Loader2 className="spin" size={14} /> : <RefreshCw size={14} />}
                    Rollback
                  </button>
                  <button className="secondary-button" disabled={props.recordingId === monitor.id} onClick={() => props.onRecordSignal(monitor.id, 'close')}>
                    {props.recordingId === monitor.id ? <Loader2 className="spin" size={14} /> : <Archive size={14} />}
                    Close
                  </button>
                  {hasFeedback ? (
                    <span className="release-promotion-badge compact">
                      <GitBranch size={14} />
                      Feedback
                    </span>
                  ) : (
                    <button className="secondary-button" disabled={props.creatingFeedbackMonitorId === monitor.id} onClick={() => props.onCreateFeedbackLoop(monitor.id)}>
                      {props.creatingFeedbackMonitorId === monitor.id ? <Loader2 className="spin" size={14} /> : <GitBranch size={14} />}
                      Feedback
                    </button>
                  )}
                  <a className="export-link" href={postReleaseMonitorDownloadUrl(monitor.id)} download>
                    <Download size={14} />
                    Monitor
                  </a>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function FeedbackLoopsPanel(props: {
  loops: DatasetFeedbackLoopRecord[];
  datasetReadyCount: number;
  creatingDataset: boolean;
  decidingKey?: string;
  focusedEntity?: FocusedTaskEntity;
  onSelectDatasetVersion: (id: string) => void;
  onDecision: (loopId: string, decision: DatasetFeedbackLoopDecision) => void;
  onCreateDatasetVersion: () => void;
}) {
  const promotedCount = props.loops.filter((loop) => loop.status === 'promoted').length;
  const targetSummary = Object.entries(props.loops
    .filter((loop) => loop.status === 'promoted')
    .reduce<Record<string, number>>((counts, loop) => {
      counts[loop.targetKind] = (counts[loop.targetKind] ?? 0) + 1;
      return counts;
    }, {}))
    .map(([key, count]) => `${key}:${count}`)
    .join(' · ');
  return (
    <section className={`feedback-loops-panel ${entityFocusClass(props.focusedEntity, 'feedback_loop')}`} data-entity-panel="feedback_loop">
      <div className="panel-title">
        <GitBranch size={16} />
        Feedback Dataset Loop
        <span className="panel-count">{props.loops.length} candidates</span>
        <div className="sample-actions">
          <button className="primary-button" disabled={props.datasetReadyCount === 0 || props.creatingDataset} onClick={props.onCreateDatasetVersion}>
            {props.creatingDataset ? <Loader2 className="spin" size={16} /> : <Database size={16} />}
            Build Dataset
          </button>
        </div>
      </div>
      <div className="feedback-loop-builder-strip">
        <span className={promotedCount > 0 ? 'pill good' : 'pill'}>{promotedCount} promoted</span>
        <span className={props.datasetReadyCount > 0 ? 'pill good' : 'pill'}>{props.datasetReadyCount} not versioned</span>
        <span className="pill">{targetSummary || 'no promoted target'}</span>
      </div>
      {props.loops.length === 0 ? (
        <p className="muted">还没有线上反馈回灌候选。Post-release Monitor 创建 Feedback 后会出现在这里。</p>
      ) : (
        <div className="feedback-loops-table">
          <div className="feedback-loops-head">
            <span>Candidate</span>
            <span>Status</span>
            <span>Target</span>
            <span>Signal</span>
            <span>Updated</span>
            <span>Actions</span>
          </div>
          {props.loops.slice(0, 10).map((loop) => (
            <div className={`feedback-loops-row ${entityFocusClass(props.focusedEntity, 'feedback_loop', loop.id)}`} key={loop.id} data-entity-kind="feedback_loop" data-entity-id={loop.id}>
              <span className="release-manifest-name">
                <strong>{loop.title}</strong>
                <small>{loop.id} · {loop.loopHash.slice(0, 18)}</small>
                <small>{loop.evalRunHash ? `Eval ${loop.evalRunHash.slice(0, 18)} · ` : ''}{loop.releaseEvidenceHash ? `Evidence ${loop.releaseEvidenceHash.slice(0, 18)}` : 'Release evidence pending'}</small>
              </span>
              <span className={feedbackLoopStatusClass(loop.status)}>{feedbackLoopStatusLabel(loop.status)}</span>
              <span>{feedbackLoopTargetLabel(loop.targetKind)} · {feedbackLoopSeverityLabel(loop.severity)}</span>
              <span>{loop.alerts[0]?.label ?? loop.monitorStatus} · {loop.environment}</span>
              <span>{formatDate(loop.updatedAt)}</span>
              <span className="release-manifest-row-actions">
                <button className="secondary-button" onClick={() => props.onSelectDatasetVersion(loop.datasetVersionId)}>
                  <FileSearch size={14} />
                  Dataset
                </button>
                <button className="secondary-button" disabled={props.decidingKey === `${loop.id}:triaged`} onClick={() => props.onDecision(loop.id, 'triaged')}>
                  {props.decidingKey === `${loop.id}:triaged` ? <Loader2 className="spin" size={14} /> : <BookOpenCheck size={14} />}
                  Triage
                </button>
                <button className="secondary-button" disabled={props.decidingKey === `${loop.id}:promoted`} onClick={() => props.onDecision(loop.id, 'promoted')}>
                  {props.decidingKey === `${loop.id}:promoted` ? <Loader2 className="spin" size={14} /> : <CheckCircle2 size={14} />}
                  Promote
                </button>
                <button className="secondary-button" disabled={props.decidingKey === `${loop.id}:rejected`} onClick={() => props.onDecision(loop.id, 'rejected')}>
                  {props.decidingKey === `${loop.id}:rejected` ? <Loader2 className="spin" size={14} /> : <AlertTriangle size={14} />}
                  Reject
                </button>
                <button className="secondary-button" disabled={props.decidingKey === `${loop.id}:reopened`} onClick={() => props.onDecision(loop.id, 'reopened')}>
                  {props.decidingKey === `${loop.id}:reopened` ? <Loader2 className="spin" size={14} /> : <RefreshCw size={14} />}
                  Reopen
                </button>
                <a className="export-link" href={feedbackLoopDownloadUrl(loop.id)} download>
                  <Download size={14} />
                  Loop
                </a>
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ClosedLoopRetrainingPanel(props: {
  plans: DatasetClosedLoopRetrainingPlan[];
  preparingDatasetId?: string;
  runningDatasetId?: string;
  creatingGateDatasetId?: string;
  creatingDeploymentDatasetId?: string;
  rollingOutDatasetId?: string;
  writingFeedbackDatasetId?: string;
  buildingNextDatasetId?: string;
  onPrepareHandoff: (datasetVersionId: string) => void;
  onRunTrainingCycle: (datasetVersionId: string) => void;
  onCreateModelGate: (datasetVersionId: string) => void;
  onApproveDeploymentHandoff: (datasetVersionId: string) => void;
  onCreateDeploymentHandoff: (datasetVersionId: string) => void;
  onRunRollout: (datasetVersionId: string) => void;
  onWriteFeedbackSignal: (datasetVersionId: string) => void;
  onBuildNextDataset: (datasetVersionId: string) => void;
  onSelectDatasetVersion: (id: string) => void;
}) {
  return (
    <section className="closed-loop-retraining-panel">
      <div className="panel-title">
        <Workflow size={16} />
        Closed-loop Retraining
        <span className="panel-count">{props.plans.length} plans</span>
      </div>
      {props.plans.length === 0 ? (
        <p className="muted">还没有 feedback dataset 可以进入闭环复训。先从 promoted feedback loop 生成 dataset version。</p>
      ) : (
        <div className="closed-loop-retraining-table">
          <div className="closed-loop-retraining-head">
            <span>Feedback Dataset</span>
            <span>Readiness</span>
            <span>Evidence Chain</span>
            <span>Release Gate</span>
            <span>Training / Gate / Deploy</span>
            <span>Actions</span>
          </div>
          {props.plans.slice(0, 8).map((plan) => {
            const canPrepare = ['review_diff', 'create_manifest', 'create_handoff'].includes(plan.nextAction);
            const canRunCycle = plan.nextAction === 'launch_training' || plan.nextAction === 'watch_training';
            const canCreateGate = plan.nextAction === 'create_model_gate';
            const canApproveDeployment = plan.nextAction === 'review_model_gate' && plan.modelReleaseGate?.status === 'ready';
            const canCreateDeployment = plan.nextAction === 'create_deployment_handoff';
            const canRunRollout = plan.nextAction === 'run_rollout' || plan.nextAction === 'create_post_release_monitor';
            const canWriteFeedbackSignal = plan.nextAction === 'write_feedback_signal';
            const canBuildNextDataset = plan.nextAction === 'review_feedback_loop' || plan.nextAction === 'build_next_dataset';
            return (
              <div className="closed-loop-retraining-row" key={plan.id}>
                <span className="release-manifest-name">
                  <strong>{plan.datasetVersionName}</strong>
                  <small>{plan.datasetVersionId} · {plan.format} · {plan.sampleCount} samples</small>
                  <small>{plan.feedbackLoopSummary?.total ?? plan.feedbackLoopIds.length} feedback loops · {plan.feedbackLoopSummary ? feedbackLoopSummaryText({
                    id: plan.datasetVersionId,
                    name: plan.datasetVersionName,
                    source: 'feedback_loop',
                    status: 'ready',
                    format: plan.format,
                    sampleIds: [],
                    sampleCount: plan.sampleCount,
                    averageQuality: 0,
                    filters: {},
                    createdAt: plan.generatedAt,
                    createdBy: 'traceops',
                    feedbackLoopSummary: plan.feedbackLoopSummary,
                  }) : 'feedback summary pending'}</small>
                </span>
                <span className={closedLoopReadinessClass(plan.readiness)}>{closedLoopReadinessLabel(plan.readiness)}</span>
                <span className="closed-loop-evidence-cell">
                  <b>{plan.releaseEvidenceHashes[0]?.slice(0, 18) ?? 'evidence pending'}</b>
                  <small>{plan.evalRunIds.length} eval · {plan.postReleaseMonitorIds.length} monitor · {plan.sourceDatasetVersionIds.length} source dataset</small>
                </span>
                <span className="closed-loop-gate-cell">
                  <b className={`pill release-status-${plan.releaseGate.status}`}>{releaseGateStatusLabel(plan.releaseGate.status)}</b>
                  <small>{plan.releaseGate.passCount} pass · {plan.releaseGate.warnCount} warn · {plan.releaseGate.blockCount} block · diff {plan.diffReviewStatus ?? 'pending'}</small>
                </span>
                <span className="closed-loop-evidence-cell">
                  <b>{plan.trainingRun ? `${plan.trainingRun.status} · ${plan.trainingRun.modelName}` : plan.retrainingHandoff ? `${plan.retrainingHandoff.status} handoff` : 'training pending'}</b>
                  <small>{plan.downstreamDatasetVersion
                    ? `Next ${plan.downstreamDatasetVersion.name} · ${plan.downstreamDatasetVersion.sampleCount} samples`
                    : plan.downstreamFeedbackLoop
                    ? `Feedback ${plan.downstreamFeedbackLoop.status} · ${plan.downstreamFeedbackLoop.targetKind}`
                    : plan.postReleaseMonitor
                      ? `Monitor ${plan.postReleaseMonitor.status} · ${plan.postReleaseMonitor.signalSummary?.severity ?? 'info'}`
                    : plan.deploymentHandoff
                      ? `Deploy ${plan.deploymentHandoff.status} · ${plan.deploymentHandoff.environment}`
                    : plan.modelReleaseGate
                      ? `Gate ${plan.modelReleaseGate.status} · ${plan.modelReleaseGate.gateHash.slice(0, 18)}`
                      : plan.evalRun ? `Eval ${plan.evalRun.status} · model gate pending` : plan.recommendation}</small>
                </span>
                <span className="release-manifest-row-actions">
                  <button className="secondary-button" onClick={() => props.onSelectDatasetVersion(plan.datasetVersionId)}>
                    <FileSearch size={14} />
                    Dataset
                  </button>
                  {canPrepare ? (
                    <button
                      className="secondary-button"
                      disabled={props.preparingDatasetId === plan.datasetVersionId}
                      onClick={() => props.onPrepareHandoff(plan.datasetVersionId)}
                    >
                      {props.preparingDatasetId === plan.datasetVersionId ? <Loader2 className="spin" size={14} /> : <Workflow size={14} />}
                      {closedLoopActionLabel(plan.nextAction)}
                    </button>
                  ) : (
                    <span className="release-promotion-badge compact">
                      <CheckCircle2 size={14} />
                      {closedLoopActionLabel(plan.nextAction)}
                    </span>
                  )}
                  {canRunCycle && (
                    <button
                      className="secondary-button"
                      disabled={props.runningDatasetId === plan.datasetVersionId}
                      onClick={() => props.onRunTrainingCycle(plan.datasetVersionId)}
                    >
                      {props.runningDatasetId === plan.datasetVersionId ? <Loader2 className="spin" size={14} /> : <Play size={14} />}
                      Run + Gate
                    </button>
                  )}
                  {canCreateGate && (
                    <button
                      className="secondary-button"
                      disabled={props.creatingGateDatasetId === plan.datasetVersionId}
                      onClick={() => props.onCreateModelGate(plan.datasetVersionId)}
                    >
                      {props.creatingGateDatasetId === plan.datasetVersionId ? <Loader2 className="spin" size={14} /> : <ShieldAlert size={14} />}
                      Create Gate
                    </button>
                  )}
                  {canApproveDeployment && (
                    <button
                      className="secondary-button"
                      disabled={props.creatingDeploymentDatasetId === plan.datasetVersionId}
                      onClick={() => props.onApproveDeploymentHandoff(plan.datasetVersionId)}
                    >
                      {props.creatingDeploymentDatasetId === plan.datasetVersionId ? <Loader2 className="spin" size={14} /> : <CheckCircle2 size={14} />}
                      Approve + Deploy
                    </button>
                  )}
                  {canCreateDeployment && (
                    <button
                      className="secondary-button"
                      disabled={props.creatingDeploymentDatasetId === plan.datasetVersionId}
                      onClick={() => props.onCreateDeploymentHandoff(plan.datasetVersionId)}
                    >
                      {props.creatingDeploymentDatasetId === plan.datasetVersionId ? <Loader2 className="spin" size={14} /> : <Workflow size={14} />}
                      Deploy Handoff
                    </button>
                  )}
                  {canRunRollout && (
                    <button
                      className="secondary-button"
                      disabled={props.rollingOutDatasetId === plan.datasetVersionId}
                      onClick={() => props.onRunRollout(plan.datasetVersionId)}
                    >
                      {props.rollingOutDatasetId === plan.datasetVersionId ? <Loader2 className="spin" size={14} /> : <Server size={14} />}
                      {closedLoopActionLabel(plan.nextAction)}
                    </button>
                  )}
                  {canWriteFeedbackSignal && (
                    <button
                      className="secondary-button"
                      disabled={props.writingFeedbackDatasetId === plan.datasetVersionId}
                      onClick={() => props.onWriteFeedbackSignal(plan.datasetVersionId)}
                    >
                      {props.writingFeedbackDatasetId === plan.datasetVersionId ? <Loader2 className="spin" size={14} /> : <GitBranch size={14} />}
                      Write Signal
                    </button>
                  )}
                  {canBuildNextDataset && (
                    <button
                      className="secondary-button"
                      disabled={props.buildingNextDatasetId === plan.datasetVersionId}
                      onClick={() => props.onBuildNextDataset(plan.datasetVersionId)}
                    >
                      {props.buildingNextDatasetId === plan.datasetVersionId ? <Loader2 className="spin" size={14} /> : <Database size={14} />}
                      Next Dataset
                    </button>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function AgentEvaluationWorkbench(props: {
  traces: RawTrace[];
  harnessSnapshots: HarnessSnapshot[];
  issues: AgentEvaluationIssue[];
  benchmarkCases: AgentBenchmarkCase[];
  benchmarkSuites: AgentBenchmarkSuite[];
  experiments: AgentEvaluationExperiment[];
  reports: AgentEvaluationComparisonReport[];
  busyKey?: string;
  onCreateHarness: () => void;
  onCreateIssue: () => void;
  onCreateCase: () => void;
  onCreateSuite: (issueId: string) => void;
  onCreateExperiment: () => void;
  onStartExperiment: (id: string) => void;
  onImportPairedResults: (experiment: AgentEvaluationExperiment) => void;
  onCompleteExperiment: (id: string) => void;
}) {
  const completed = props.reports.filter((report) => report.verdict === 'improved').length;
  const validationCases = props.benchmarkCases.filter((item) => item.usage === 'validation' && item.status === 'ready');
  const latestReport = props.reports[0];
  const metricLabel = (experiment: AgentEvaluationExperiment, id: string) => experiment.metrics.find((metric) => metric.id === id)?.label ?? id;
  const metricValue = (value: number, unit?: string) => {
    if (unit === 'percent') return `${Math.round(value * 1000) / 10}%`;
    if (unit === 'tokens') return `${Math.round(value).toLocaleString()} tok`;
    if (unit === 'ms') return `${Math.round(value).toLocaleString()} ms`;
    return String(Math.round(value * 1000) / 1000);
  };

  return (
    <div className="agent-eval-workbench">
      <section className="stats-grid agent-eval-stats">
        <StatCard label="Harness Snapshots" value={props.harnessSnapshots.length} icon={<GitBranch size={18} />} />
        <StatCard label="Evaluation Issues" value={props.issues.length} icon={<AlertTriangle size={18} />} />
        <StatCard label="Validation Cases" value={validationCases.length} icon={<BookOpenCheck size={18} />} />
        <StatCard label="Improved" value={completed} icon={<CheckCircle2 size={18} />} />
      </section>

      <section className="agent-eval-toolbar">
        <div>
          <div className="section-label">Target-capability A/B workflow</div>
          <h2>固定 Model，对比 Harness H0 与 H1</h2>
          <p>先声明工程问题和成功指标，再冻结 Validation Suite，导入成对 Rollout，最后生成可审计 Verdict。</p>
        </div>
        <div className="agent-eval-actions">
          <button className="secondary-button" onClick={props.onCreateHarness}><GitBranch size={15} /> New Harness</button>
          <button className="secondary-button" onClick={props.onCreateIssue}><AlertTriangle size={15} /> New Issue</button>
          <button className="secondary-button" disabled={props.traces.length === 0} onClick={props.onCreateCase}><BookOpenCheck size={15} /> Case from Trace</button>
          <button className="primary-button" disabled={props.harnessSnapshots.length < 2 || props.benchmarkSuites.length === 0} onClick={props.onCreateExperiment}><Play size={15} /> New Experiment</button>
        </div>
      </section>

      <div className="agent-eval-columns">
        <section className="agent-eval-panel">
          <div className="panel-title"><GitBranch size={16} /> Harness Registry <span className="panel-count">{props.harnessSnapshots.length}</span></div>
          {props.harnessSnapshots.length === 0 ? <p className="muted">先登记当前线上 H0 和工程师候选 H1。</p> : (
            <div className="agent-eval-list">
              {props.harnessSnapshots.slice(0, 8).map((snapshot) => (
                <article key={snapshot.id} className="agent-eval-card">
                  <div><strong>{snapshot.name}</strong><span className={`pill agent-eval-status-${snapshot.status}`}>{snapshot.status}</span></div>
                  <small>{snapshot.version} · {snapshot.source.commit ?? snapshot.source.profileVersion ?? 'local snapshot'}</small>
                  <p>{snapshot.changeSummary ?? 'Baseline Harness snapshot'}</p>
                  <code>{snapshot.contentHash.slice(0, 24)}</code>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="agent-eval-panel">
          <div className="panel-title"><AlertTriangle size={16} /> Issues & Suites <span className="panel-count">{props.issues.length}</span></div>
          {props.issues.length === 0 ? <p className="muted">从真实 Session 创建一个可验证的工程问题。</p> : (
            <div className="agent-eval-list">
              {props.issues.slice(0, 8).map((issue) => {
                const suites = props.benchmarkSuites.filter((suite) => suite.issueId === issue.id);
                return (
                  <article key={issue.id} className="agent-eval-card">
                    <div><strong>{issue.title}</strong><span className={`pill agent-eval-status-${issue.status}`}>{issue.status}</span></div>
                    <small>{issue.category} · primary {issue.primaryMetricId} · {issue.sourceTraceIds.length} traces</small>
                    <p>{issue.description || 'No issue description.'}</p>
                    <div className="agent-eval-card-footer">
                      <span>{suites.length} suites</span>
                      <button className="text-button" disabled={validationCases.length === 0} onClick={() => props.onCreateSuite(issue.id)}>Freeze validation suite</button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <section className="agent-eval-panel agent-eval-experiments">
        <div className="panel-title"><Workflow size={16} /> H0/H1 Experiments <span className="panel-count">{props.experiments.length}</span></div>
        {props.experiments.length === 0 ? <p className="muted">冻结 Suite 后创建第一个固定 Model 的成对实验。</p> : (
          <div className="agent-eval-experiment-list">
            {props.experiments.slice(0, 10).map((experiment) => {
              const baseline = props.harnessSnapshots.find((item) => item.id === experiment.baselineHarnessId);
              const candidate = props.harnessSnapshots.find((item) => item.id === experiment.candidateHarnessId);
              const suite = props.benchmarkSuites.find((item) => item.id === experiment.benchmarkSuiteId);
              const report = props.reports.find((item) => item.experimentId === experiment.id);
              return (
                <article key={experiment.id} className="agent-eval-experiment-card">
                  <div className="agent-eval-experiment-head">
                    <div>
                      <strong>{baseline?.version ?? 'H0'} → {candidate?.version ?? 'H1'}</strong>
                      <small>{experiment.modelSnapshot.provider}/{experiment.modelSnapshot.model} · {suite?.name ?? experiment.benchmarkSuiteId}</small>
                    </div>
                    <span className={`pill agent-eval-status-${report?.verdict ?? experiment.status}`}>{report?.verdict ?? experiment.status}</span>
                  </div>
                  {report ? (
                    <>
                      <div className="agent-eval-metric-grid">
                        {report.deltas.slice(0, 7).map((delta) => {
                          const definition = experiment.metrics.find((item) => item.id === delta.metricId);
                          return (
                            <div key={delta.metricId} className={delta.passed ? 'agent-eval-metric good' : 'agent-eval-metric warn'}>
                              <span>{metricLabel(experiment, delta.metricId)}</span>
                              <strong>{metricValue(delta.baseline, definition?.unit)} → {metricValue(delta.candidate, definition?.unit)}</strong>
                              <small>Δ {metricValue(delta.delta, definition?.unit)}</small>
                            </div>
                          );
                        })}
                      </div>
                      <div className="agent-eval-churn">
                        <span>Pass→Pass <b>{report.churn.passToPass}</b></span>
                        <span>Fail→Pass <b>{report.churn.failToPass}</b></span>
                        <span>Pass→Fail <b>{report.churn.passToFail}</b></span>
                        <span>Critical <b>{report.churn.criticalRegressions}</b></span>
                      </div>
                      <p className="agent-eval-recommendation">{report.recommendation}</p>
                    </>
                  ) : (
                    <div className="agent-eval-card-footer">
                      <span>{experiment.status} · {experiment.repetitions} repetition · {suite?.caseIds.length ?? 0} cases</span>
                      <div>
                        {experiment.status === 'draft' && <button className="secondary-button" disabled={props.busyKey === experiment.id} onClick={() => props.onStartExperiment(experiment.id)}><Play size={14} /> Start</button>}
                        {experiment.status === 'running' && <button className="secondary-button" disabled={props.busyKey === experiment.id} onClick={() => props.onImportPairedResults(experiment)}><UploadCloud size={14} /> Import Pair</button>}
                        {experiment.status === 'running' && <button className="primary-button" disabled={props.busyKey === experiment.id} onClick={() => props.onCompleteExperiment(experiment.id)}><BookOpenCheck size={14} /> Complete</button>}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {latestReport && (
        <section className={`agent-eval-latest agent-eval-latest-${latestReport.verdict}`}>
          <div><strong>Latest verdict: {latestReport.verdict}</strong><span>{latestReport.reportHash.slice(0, 26)}</span></div>
          <p>{latestReport.reasons.join(' ')}</p>
        </section>
      )}
    </div>
  );
}

export function App() {
  const [platformArchitecture, setPlatformArchitecture] = useState<TraceOpsPlatformArchitecture>();
  const [source, setSource] = useState<SourceStatus>();
  const [jobs, setJobs] = useState<IngestJob[]>([]);
  const [ingestQualityQueue, setIngestQualityQueue] = useState<IngestQualityQueueResponse>({
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
  });
  const [ingestQualityPolicy, setIngestQualityPolicy] = useState<IngestQualityPolicyResponse>({
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
  });
  const [ingestQualityPolicyRuns, setIngestQualityPolicyRuns] = useState<IngestQualityPolicyRunListResponse>({
    runs: [],
    summary: {
      totalRuns: 0,
      manualRuns: 0,
      automaticRuns: 0,
      skippedRuns: 0,
      affectedDiagnostics: 0,
      affectedIssues: 0,
    },
  });
  const [taskList, setTaskList] = useState<TraceOpsTaskListResponse>({
    tasks: [],
    summary: { total: 0, queued: 0, running: 0, succeeded: 0, failed: 0, retrying: 0, cancelled: 0, active: 0, needsAttention: 0 },
  });
  const [taskAutomationPlan, setTaskAutomationPlan] = useState<TraceOpsTaskAutomationPlan>();
  const [exportRuns, setExportRuns] = useState<DatasetExportRun[]>([]);
  const [releaseManifests, setReleaseManifests] = useState<DatasetReleaseManifest[]>([]);
  const [releasePromotions, setReleasePromotions] = useState<DatasetReleasePromotionRecord[]>([]);
  const [retrainingHandoffs, setRetrainingHandoffs] = useState<DatasetRetrainingHandoffRecord[]>([]);
  const [trainingLaunchPlans, setTrainingLaunchPlans] = useState<DatasetTrainingLaunchPlan[]>([]);
  const [trainingRuns, setTrainingRuns] = useState<DatasetTrainingRunRecord[]>([]);
  const [evalRuns, setEvalRuns] = useState<DatasetEvalRunRecord[]>([]);
  const [harnessSnapshots, setHarnessSnapshots] = useState<HarnessSnapshot[]>([]);
  const [agentEvaluationIssues, setAgentEvaluationIssues] = useState<AgentEvaluationIssue[]>([]);
  const [agentBenchmarkCases, setAgentBenchmarkCases] = useState<AgentBenchmarkCase[]>([]);
  const [agentBenchmarkSuites, setAgentBenchmarkSuites] = useState<AgentBenchmarkSuite[]>([]);
  const [agentEvaluationExperiments, setAgentEvaluationExperiments] = useState<AgentEvaluationExperiment[]>([]);
  const [agentEvaluationReports, setAgentEvaluationReports] = useState<AgentEvaluationComparisonReport[]>([]);
  const [agentEvaluationBusyKey, setAgentEvaluationBusyKey] = useState<string>();
  const [modelReleaseGates, setModelReleaseGates] = useState<DatasetModelReleaseGateRecord[]>([]);
  const [deploymentHandoffs, setDeploymentHandoffs] = useState<DatasetDeploymentHandoffRecord[]>([]);
  const [postReleaseMonitors, setPostReleaseMonitors] = useState<DatasetPostReleaseMonitorRecord[]>([]);
  const [feedbackLoops, setFeedbackLoops] = useState<DatasetFeedbackLoopRecord[]>([]);
  const [closedLoopRetrainingPlans, setClosedLoopRetrainingPlans] = useState<DatasetClosedLoopRetrainingPlan[]>([]);
  const [datasetVersions, setDatasetVersions] = useState<DatasetVersion[]>([]);
  const [datasetVersionDiff, setDatasetVersionDiff] = useState<DatasetVersionDiff>();
  const [projects, setProjects] = useState<string[]>([]);
  const [traceList, setTraceList] = useState<TraceListResponse>({
    traces: [],
    totals: { total: 0, imported: 0, updated: 0, failed: 0, highRisk: 0 },
  });
  const [sampleList, setSampleList] = useState<TrainingSampleListResponse>({
    samples: [],
    totals: { total: 0, candidate: 0, needsReview: 0, blocked: 0, highRisk: 0, averageQuality: 0 },
  });
  const [cleanTraceList, setCleanTraceList] = useState<CleanTraceListResponse>({
    cleanTraces: [],
    totals: { total: 0, ready: 0, needsReview: 0, blocked: 0, highRisk: 0, averageQuality: 0 },
  });
  const traceFoundationSamples = useMemo(
    () => sampleList.samples.filter((sample) => sample.kind !== 'sft' && sample.kind !== 'preference'),
    [sampleList.samples],
  );
  const traceFoundationSampleTotals = useMemo(
    () => ({ ...sampleList.totals, total: traceFoundationSamples.length }),
    [sampleList.totals, traceFoundationSamples.length],
  );
  const [memoryCandidateList, setMemoryCandidateList] = useState<MemoryCandidateListResponse>({
    candidates: [],
    totals: { total: 0, candidate: 0, needsReview: 0, promoted: 0, rejected: 0, blocked: 0, highRisk: 0, averageConfidence: 0 },
  });
  const [governancePolicy, setGovernancePolicy] = useState<GovernancePolicyResponse>();
  const [governanceAuditLog, setGovernanceAuditLog] = useState<GovernanceAuditRecord[]>([]);
  const [storageHealth, setStorageHealth] = useState<StorePersistenceHealth>();
  const [storageSnapshots, setStorageSnapshots] = useState<StoreSnapshotRecord[]>([]);
  const [segmentStoreStatus, setSegmentStoreStatus] = useState<TraceOpsSegmentStoreStatus>();
  const [kodaxFeedbackReport, setKodaxFeedbackReport] = useState<KodaXFeedbackReport>();
  const [kodaxFeedbackPackage, setKodaxFeedbackPackage] = useState<KodaXFeedbackPackage>();
  const [kodaxFeedbackWritebacks, setKodaxFeedbackWritebacks] = useState<KodaXFeedbackWritebackRecord[]>([]);
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [selectedTraceId, setSelectedTraceId] = useState<string>();
  const [detail, setDetail] = useState<TraceDetail>();
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [triagingDiagnosticId, setTriagingDiagnosticId] = useState<string>();
  const [triagingIssueId, setTriagingIssueId] = useState<string>();
  const [savingPolicyKey, setSavingPolicyKey] = useState<string>();
  const [decidingRecommendationKey, setDecidingRecommendationKey] = useState<string>();
  const [applyingPolicy, setApplyingPolicy] = useState(false);
  const [installingPolicyDefaults, setInstallingPolicyDefaults] = useState(false);
  const [resolvingFixedDiagnostics, setResolvingFixedDiagnostics] = useState(false);
  const [dryRunningPolicyKey, setDryRunningPolicyKey] = useState<string>();
  const [policyDryRun, setPolicyDryRun] = useState<IngestQualityPolicyDryRunResponse>();
  const [selectedPolicyRuleIds, setSelectedPolicyRuleIds] = useState<string[]>([]);
  const [batchPublishingPolicy, setBatchPublishingPolicy] = useState(false);
  const [togglingPolicyAutoApply, setTogglingPolicyAutoApply] = useState(false);
  const [retryingTaskId, setRetryingTaskId] = useState<string>();
  const [runningTaskExecutor, setRunningTaskExecutor] = useState(false);
  const [writingBackKodaXFeedback, setWritingBackKodaXFeedback] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>();
  const [creatingAuditTaskActionId, setCreatingAuditTaskActionId] = useState<string>();
  const [queuedAuditActionIds, setQueuedAuditActionIds] = useState<string[]>([]);
  const [focusedTaskEntity, setFocusedTaskEntity] = useState<FocusedTaskEntity>();
  const [creatingDatasetVersion, setCreatingDatasetVersion] = useState(false);
  const [creatingFeedbackDatasetVersion, setCreatingFeedbackDatasetVersion] = useState(false);
  const [reviewQueueFocus, setReviewQueueFocus] = useState<ReviewQueueFocus>();
  const [selectedDatasetVersionId, setSelectedDatasetVersionId] = useState<string>();
  const [diffBaseVersionId, setDiffBaseVersionId] = useState<string>();
  const [datasetVersionSamples, setDatasetVersionSamples] = useState<TrainingSample[]>([]);
  const [loadingDatasetVersionSamples, setLoadingDatasetVersionSamples] = useState(false);
  const [loadingDatasetVersionDiff, setLoadingDatasetVersionDiff] = useState(false);
  const [datasetDiffReviewPlan, setDatasetDiffReviewPlan] = useState<DatasetVersionDiffReviewPlan>();
  const [reviewingDiffDecision, setReviewingDiffDecision] = useState<DatasetVersionDiffReviewDecision>();
  const [applyingDiffReviewPlan, setApplyingDiffReviewPlan] = useState(false);
  const [reviewingSampleId, setReviewingSampleId] = useState<string>();
  const [reviewingMemoryCandidateId, setReviewingMemoryCandidateId] = useState<string>();
  const [revokingExportId, setRevokingExportId] = useState<string>();
  const [actingGateKey, setActingGateKey] = useState<string>();
  const [generatingManifestVersionId, setGeneratingManifestVersionId] = useState<string>();
  const [promotingManifestId, setPromotingManifestId] = useState<string>();
  const [creatingHandoffManifestId, setCreatingHandoffManifestId] = useState<string>();
  const [creatingHandoffPromotionId, setCreatingHandoffPromotionId] = useState<string>();
  const [creatingTrainingRunHandoffId, setCreatingTrainingRunHandoffId] = useState<string>();
  const [recordingTrainingRunId, setRecordingTrainingRunId] = useState<string>();
  const [syncingProviderRunId, setSyncingProviderRunId] = useState<string>();
  const [runningEvalRunId, setRunningEvalRunId] = useState<string>();
  const [creatingModelGateRunId, setCreatingModelGateRunId] = useState<string>();
  const [decidingModelGateKey, setDecidingModelGateKey] = useState<string>();
  const [creatingDeploymentGateId, setCreatingDeploymentGateId] = useState<string>();
  const [updatingDeploymentKey, setUpdatingDeploymentKey] = useState<string>();
  const [creatingPostMonitorDeploymentId, setCreatingPostMonitorDeploymentId] = useState<string>();
  const [recordingPostMonitorId, setRecordingPostMonitorId] = useState<string>();
  const [creatingFeedbackMonitorId, setCreatingFeedbackMonitorId] = useState<string>();
  const [decidingFeedbackKey, setDecidingFeedbackKey] = useState<string>();
  const [preparingClosedLoopDatasetId, setPreparingClosedLoopDatasetId] = useState<string>();
  const [runningClosedLoopDatasetId, setRunningClosedLoopDatasetId] = useState<string>();
  const [creatingClosedLoopModelGateDatasetId, setCreatingClosedLoopModelGateDatasetId] = useState<string>();
  const [creatingClosedLoopDeploymentDatasetId, setCreatingClosedLoopDeploymentDatasetId] = useState<string>();
  const [rollingOutClosedLoopDatasetId, setRollingOutClosedLoopDatasetId] = useState<string>();
  const [writingClosedLoopFeedbackDatasetId, setWritingClosedLoopFeedbackDatasetId] = useState<string>();
  const [buildingClosedLoopNextDatasetId, setBuildingClosedLoopNextDatasetId] = useState<string>();
  const [creatingStorageSnapshot, setCreatingStorageSnapshot] = useState(false);
  const [restoringSnapshotId, setRestoringSnapshotId] = useState<string>();
  const [backfillingSegments, setBackfillingSegments] = useState(false);
  const [rebuildingSegments, setRebuildingSegments] = useState(false);
  const [orchestratingSystemTasks, setOrchestratingSystemTasks] = useState(false);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [activePipelineStageId, setActivePipelineStageId] = useState<PipelineStageId | undefined>(() => getPipelineStageFromHash());

  const params = useMemo(() => toParams(filters), [filters]);
  const fineTuneCandidateIds = useMemo(() => sampleList.samples
    .filter((sample) =>
      sample.kind === 'sft'
      && sample.status === 'candidate'
      && sample.trainable
      && sample.metadata.distillation.readyForFineTune
    )
    .map((sample) => sample.id), [sampleList.samples]);

  function openPipelineStage(id: PipelineStageId) {
    setActivePipelineStageId(id);
    if (window.location.hash !== `#${id}`) {
      window.location.hash = id;
    }
    window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 0);
  }

  function goPipelineHome() {
    setActivePipelineStageId(undefined);
    if (window.location.hash) {
      window.history.pushState('', document.title, `${window.location.pathname}${window.location.search}`);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  useEffect(() => {
    const handleHashChange = () => {
      setActivePipelineStageId(getPipelineStageFromHash());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const activePipelineStage = getPipelineStageMeta(activePipelineStageId);
  const versionedFeedbackLoopIds = useMemo(() => new Set(datasetVersions.flatMap((version) => version.feedbackLoopIds ?? [])), [datasetVersions]);
  const feedbackLoopsReadyForDataset = useMemo(() => feedbackLoops
    .filter((loop) => loop.status === 'promoted' && !versionedFeedbackLoopIds.has(loop.id)), [feedbackLoops, versionedFeedbackLoopIds]);
  const commandItems = useMemo<CommandPaletteItem[]>(() => {
    const item = (input: Omit<CommandPaletteItem, 'searchText'> & { searchParts?: Array<string | number | undefined> }): CommandPaletteItem => ({
      ...input,
      searchText: [
        input.id,
        input.kind,
        input.title,
        input.subtitle,
        input.status,
        ...(input.searchParts ?? []),
      ].filter(Boolean).join(' '),
    });
    return [
      ...traceList.traces.slice(0, 80).map((trace) => item({
        id: trace.id,
        kind: 'trace' as const,
        title: trace.title,
        subtitle: `${trace.projectKey ?? 'unknown project'} · ${trace.sourceSessionId}`,
        status: trace.ingestionStatus,
        updatedAt: trace.updatedAt,
        entity: { kind: 'trace', id: trace.id, label: trace.projectKey ?? trace.title },
        searchParts: [trace.runtime.model, trace.runtime.provider, trace.risk.level],
      })),
      ...jobs.map((job) => item({
        id: job.id,
        kind: 'ingest_job' as const,
        title: `KodaX sync ${job.mode}`,
        subtitle: `${job.imported} imported · ${job.skipped} skipped · ${job.failed} failed`,
        status: job.status,
        updatedAt: job.finishedAt ?? job.startedAt,
        entity: { kind: 'ingest_job', id: job.id, label: job.mode },
        searchParts: [job.message, job.discovered],
      })),
      ...datasetVersions.map((version) => item({
        id: version.id,
        kind: 'dataset_version' as const,
        title: version.name,
        subtitle: `${datasetFormatLabel(version.format)} · ${version.sampleCount} samples`,
        status: releaseGateStatusLabel(buildDatasetReleaseGate(version, version.sampleSnapshots ?? [], datasetVersionDiff).status),
        updatedAt: version.createdAt,
        entity: { kind: 'dataset_version', id: version.id, label: version.name },
        searchParts: [version.snapshotHash, version.source, version.averageQuality],
      })),
      ...releaseManifests.map((manifest) => item({
        id: manifest.id,
        kind: 'release_manifest' as const,
        title: manifest.datasetVersionName,
        subtitle: `${manifest.sampleCount} samples · ${manifest.manifestHash.slice(0, 18)}`,
        status: manifest.status,
        updatedAt: manifest.generatedAt,
        entity: { kind: 'release_manifest', id: manifest.id, label: manifest.datasetVersionName },
        searchParts: [manifest.datasetVersionId, manifest.promotionStatus],
      })),
      ...releasePromotions.map((promotion) => item({
        id: promotion.id,
        kind: 'release_promotion' as const,
        title: promotion.datasetVersionName,
        subtitle: `${promotion.status} · ${promotion.manifestHash.slice(0, 18)}`,
        status: promotion.status,
        updatedAt: promotion.promotedAt,
        entity: { kind: 'release_promotion', id: promotion.id, label: promotion.datasetVersionName },
        searchParts: [promotion.datasetVersionId, promotion.manifestId, promotion.promotedBy],
      })),
      ...retrainingHandoffs.map((handoff) => item({
        id: handoff.id,
        kind: 'retraining_handoff' as const,
        title: handoff.datasetVersionName,
        subtitle: `${handoff.trainingOwner} -> ${handoff.targetSystem}`,
        status: handoff.status,
        updatedAt: handoff.createdAt,
        entity: { kind: 'retraining_handoff', id: handoff.id, label: handoff.datasetVersionName },
        searchParts: [handoff.datasetVersionId, handoff.handoffHash],
      })),
      ...trainingRuns.map((run) => item({
        id: run.id,
        kind: 'training_run' as const,
        title: run.modelName,
        subtitle: `${run.datasetVersionName} · ${run.owner}`,
        status: run.status,
        updatedAt: run.updatedAt,
        entity: { kind: 'training_run', id: run.id, label: run.modelName },
        searchParts: [run.datasetVersionId, run.externalRunId, run.targetSystem, run.qualityGate],
      })),
      ...evalRuns.map((evalRun) => item({
        id: evalRun.id,
        kind: 'eval_run' as const,
        title: evalRun.modelName,
        subtitle: `${evalRun.datasetVersionName} · ${evalRun.runnerVersion}`,
        status: evalRun.status,
        updatedAt: evalRun.completedAt,
        entity: { kind: 'eval_run', id: evalRun.id, label: evalRun.modelName },
        searchParts: [evalRun.datasetVersionId, evalRun.trainingRunId, evalRun.evalHash],
      })),
      ...modelReleaseGates.map((gate) => item({
        id: gate.id,
        kind: 'model_release_gate' as const,
        title: gate.modelName,
        subtitle: `${gate.datasetVersionName} · ${gate.owner}`,
        status: gate.status,
        updatedAt: gate.updatedAt,
        entity: { kind: 'model_release_gate', id: gate.id, label: gate.modelName },
        searchParts: [gate.datasetVersionId, gate.trainingRunId, gate.evalRunId, gate.gateHash],
      })),
      ...deploymentHandoffs.map((handoff) => item({
        id: handoff.id,
        kind: 'deployment_handoff' as const,
        title: handoff.modelName,
        subtitle: `${handoff.environment} · ${handoff.deploymentOwner}`,
        status: handoff.status,
        updatedAt: handoff.updatedAt,
        entity: { kind: 'deployment_handoff', id: handoff.id, label: handoff.environment },
        searchParts: [handoff.datasetVersionId, handoff.modelReleaseGateId, handoff.handoffHash],
      })),
      ...postReleaseMonitors.map((monitor) => item({
        id: monitor.id,
        kind: 'post_release_monitor' as const,
        title: monitor.modelName,
        subtitle: `${monitor.environment} · ${monitor.monitorOwner}`,
        status: monitor.status,
        updatedAt: monitor.updatedAt,
        entity: { kind: 'post_release_monitor', id: monitor.id, label: monitor.environment },
        searchParts: [monitor.datasetVersionId, monitor.deploymentHandoffId, monitor.monitorHash],
      })),
      ...feedbackLoops.map((loop) => item({
        id: loop.id,
        kind: 'feedback_loop' as const,
        title: loop.title,
        subtitle: `${feedbackLoopTargetLabel(loop.targetKind)} · ${loop.environment}`,
        status: loop.status,
        updatedAt: loop.updatedAt,
        entity: { kind: 'feedback_loop', id: loop.id, label: loop.targetKind },
        searchParts: [loop.datasetVersionId, loop.postReleaseMonitorId, loop.loopHash, loop.severity],
      })),
      ...taskList.tasks.map((task) => item({
        id: task.id,
        kind: 'task' as const,
        title: task.title,
        subtitle: `${taskKindLabel(task.kind)} · ${task.queue}`,
        status: task.status,
        updatedAt: task.updatedAt,
        taskId: task.id,
        searchParts: [task.description, task.resultSummary, task.errorMessage, ...task.entityRefs.flatMap((ref) => [ref.kind, ref.id, ref.label])],
      })),
    ].sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));
  }, [
    datasetVersionDiff,
    datasetVersions,
    deploymentHandoffs,
    evalRuns,
    feedbackLoops,
    jobs,
    modelReleaseGates,
    postReleaseMonitors,
    releaseManifests,
    releasePromotions,
    retrainingHandoffs,
    taskList.tasks,
    traceList.traces,
    trainingRuns,
  ]);
  const entityInspectorState = useMemo<EntityInspectorState | undefined>(() => {
    const activeItem = selectedTaskId
      ? commandItems.find((item) => item.kind === 'task' && item.taskId === selectedTaskId)
      : focusedTaskEntity
        ? commandItems.find((item) =>
          item.entity?.kind === focusedTaskEntity.kind && item.entity.id === focusedTaskEntity.id
        ) ?? {
          id: focusedTaskEntity.id,
          kind: focusedTaskEntity.kind,
          title: focusedTaskEntity.label ?? focusedTaskEntity.id,
          subtitle: taskEntityKindLabel(focusedTaskEntity.kind),
          status: 'linked',
          updatedAt: new Date(focusedTaskEntity.requestedAt).toISOString(),
          entity: focusedTaskEntity,
          searchText: `${focusedTaskEntity.kind} ${focusedTaskEntity.id} ${focusedTaskEntity.label ?? ''}`,
        }
        : undefined;
    if (!activeItem) return undefined;

    const metrics: EntityInspectorMetric[] = [];
    const lineage: TaskEntityRef[] = [];
    const addMetric = (label: string, value: string | number | undefined, tone?: EntityInspectorMetric['tone']) => {
      if (value === undefined || value === '') return;
      metrics.push({ label, value, tone });
    };
    const addLineage = (kind: TaskEntityRef['kind'], id?: string, label?: string) => {
      if (!id || lineage.some((item) => item.kind === kind && item.id === id)) return;
      lineage.push({ kind, id, label });
    };

    let relatedTasks = activeItem.entity
      ? taskList.tasks.filter((task) =>
        task.entityRefs.some((ref) => ref.kind === activeItem.entity?.kind && ref.id === activeItem.entity.id)
      )
      : [];

    if (activeItem.kind === 'task' && activeItem.taskId) {
      const task = taskList.tasks.find((item) => item.id === activeItem.taskId);
      if (task) {
        addMetric('status', taskStatusLabel(task.status), task.status === 'succeeded' ? 'good' : task.status === 'failed' ? 'danger' : undefined);
        addMetric('progress', `${task.progress}%`);
        addMetric('attempts', `${task.attempts}/${task.maxAttempts}`);
        addMetric('priority', task.priority, task.priority === 'critical' ? 'danger' : task.priority === 'high' ? 'warn' : undefined);
        task.entityRefs.forEach((ref) => addLineage(ref.kind, ref.id, ref.label));
        relatedTasks = [
          task,
          ...taskList.tasks.filter((item) => item.id === task.retryOfTaskId || item.retryOfTaskId === task.id),
        ].filter((item, index, list) => index === list.findIndex((candidate) => candidate.id === item.id));
      }
      return { item: activeItem, metrics, lineage, relatedTasks };
    }

    if (activeItem.entity) addLineage(activeItem.entity.kind, activeItem.entity.id, activeItem.entity.label);

    switch (activeItem.kind) {
      case 'ingest_job': {
        const job = jobs.find((item) => item.id === activeItem.id);
        addMetric('imported', job?.imported ?? 0, job?.status === 'succeeded' ? 'good' : undefined);
        addMetric('skipped', job?.skipped ?? 0);
        addMetric('failed', job?.failed ?? 0, job && job.failed > 0 ? 'danger' : undefined);
        addMetric('discovered', job?.discovered ?? 0);
        break;
      }
      case 'trace': {
        const trace = traceList.traces.find((item) => item.id === activeItem.id);
        addMetric('risk', trace?.risk.level, trace?.risk.level === 'L4' || trace?.risk.level === 'L3' ? 'danger' : undefined);
        addMetric('messages', trace?.counts.messages);
        addMetric('tools', trace?.counts.toolUseEvents);
        addMetric('evidence', trace?.counts.artifactLedgerEntries);
        break;
      }
      case 'dataset_version': {
        const version = datasetVersions.find((item) => item.id === activeItem.id);
        const gate = version ? buildDatasetReleaseGate(version, version.sampleSnapshots ?? [], datasetVersionDiff) : undefined;
        addMetric('samples', version?.sampleCount);
        addMetric('quality', version?.averageQuality, (version?.averageQuality ?? 0) >= 80 ? 'good' : 'warn');
        addMetric('gate', gate ? releaseGateStatusLabel(gate.status) : undefined, gate?.status === 'ready' ? 'good' : gate?.status === 'blocked' ? 'danger' : 'warn');
        addMetric('source', version ? datasetSourceLabel(version) : undefined);
        version?.feedbackLoopIds?.forEach((id) => addLineage('feedback_loop', id, 'feedback'));
        releaseManifests.filter((manifest) => manifest.datasetVersionId === activeItem.id).forEach((manifest) =>
          addLineage('release_manifest', manifest.id, manifest.datasetVersionName)
        );
        break;
      }
      case 'release_manifest': {
        const manifest = releaseManifests.find((item) => item.id === activeItem.id);
        addMetric('samples', manifest?.sampleCount);
        addMetric('high risk', manifest?.riskSummary.highRisk, (manifest?.riskSummary.highRisk ?? 0) > 0 ? 'warn' : 'good');
        addMetric('blockers', manifest?.releaseGate.blockCount, (manifest?.releaseGate.blockCount ?? 0) > 0 ? 'danger' : 'good');
        addLineage('dataset_version', manifest?.datasetVersionId, manifest?.datasetVersionName);
        if (manifest?.promotion?.id) addLineage('release_promotion', manifest.promotion.id, 'promotion');
        retrainingHandoffs.filter((handoff) => handoff.manifestId === activeItem.id).forEach((handoff) =>
          addLineage('retraining_handoff', handoff.id, handoff.datasetVersionName)
        );
        break;
      }
      case 'release_promotion': {
        const promotion = releasePromotions.find((item) => item.id === activeItem.id);
        addMetric('status', promotion?.status, promotion?.status === 'promoted' ? 'good' : 'danger');
        addMetric('promoted by', promotion?.promotedBy);
        addLineage('dataset_version', promotion?.datasetVersionId, promotion?.datasetVersionName);
        addLineage('release_manifest', promotion?.manifestId, 'manifest');
        retrainingHandoffs.filter((handoff) => handoff.promotionId === activeItem.id).forEach((handoff) =>
          addLineage('retraining_handoff', handoff.id, handoff.datasetVersionName)
        );
        break;
      }
      case 'retraining_handoff': {
        const handoff = retrainingHandoffs.find((item) => item.id === activeItem.id);
        addMetric('status', handoff?.status, handoff?.status === 'completed' ? 'good' : undefined);
        addMetric('owner', handoff?.trainingOwner);
        addMetric('checklist', handoff ? `${handoff.checklist.filter((item) => item.status === 'done').length}/${handoff.checklist.length}` : undefined);
        addLineage('dataset_version', handoff?.datasetVersionId, handoff?.datasetVersionName);
        addLineage('release_manifest', handoff?.manifestId, 'manifest');
        addLineage('release_promotion', handoff?.promotionId, 'promotion');
        trainingRuns.filter((run) => run.handoffId === activeItem.id).forEach((run) => addLineage('training_run', run.id, run.modelName));
        break;
      }
      case 'training_run': {
        const run = trainingRuns.find((item) => item.id === activeItem.id);
        addMetric('status', run ? trainingRunStatusLabel(run.status) : undefined, run?.status === 'passed' ? 'good' : run?.status === 'failed' ? 'danger' : undefined);
        addMetric('gate', run?.qualityGate);
        addMetric('metrics', run?.metrics.length);
        addLineage('retraining_handoff', run?.handoffId, 'handoff');
        addLineage('dataset_version', run?.datasetVersionId, run?.datasetVersionName);
        evalRuns.filter((evalRun) => evalRun.trainingRunId === activeItem.id).forEach((evalRun) => addLineage('eval_run', evalRun.id, evalRun.modelName));
        modelReleaseGates.filter((gate) => gate.trainingRunId === activeItem.id).forEach((gate) => addLineage('model_release_gate', gate.id, gate.modelName));
        break;
      }
      case 'eval_run': {
        const evalRun = evalRuns.find((item) => item.id === activeItem.id);
        addMetric('status', evalRun?.status, evalRun?.status === 'passed' ? 'good' : 'danger');
        addMetric('passed', evalRun?.cases.filter((item) => item.status === 'passed').length);
        addMetric('failed', evalRun?.cases.filter((item) => item.status === 'failed').length, (evalRun?.cases.filter((item) => item.status === 'failed').length ?? 0) > 0 ? 'danger' : undefined);
        addLineage('training_run', evalRun?.trainingRunId, evalRun?.modelName);
        addLineage('dataset_version', evalRun?.datasetVersionId, evalRun?.datasetVersionName);
        modelReleaseGates.filter((gate) => gate.evalRunId === activeItem.id).forEach((gate) => addLineage('model_release_gate', gate.id, gate.modelName));
        break;
      }
      case 'model_release_gate': {
        const gate = modelReleaseGates.find((item) => item.id === activeItem.id);
        addMetric('status', gate?.status, gate?.status === 'approved' ? 'good' : gate?.status === 'blocked' || gate?.status === 'rejected' ? 'danger' : undefined);
        addMetric('checks', gate ? `${gate.checks.filter((item) => item.status === 'passed').length}/${gate.checks.length}` : undefined);
        addMetric('eval', gate?.evalStatus);
        addLineage('training_run', gate?.trainingRunId, gate?.modelName);
        addLineage('eval_run', gate?.evalRunId, gate?.modelName);
        addLineage('dataset_version', gate?.datasetVersionId, gate?.datasetVersionName);
        deploymentHandoffs.filter((handoff) => handoff.modelReleaseGateId === activeItem.id).forEach((handoff) =>
          addLineage('deployment_handoff', handoff.id, handoff.environment)
        );
        break;
      }
      case 'deployment_handoff': {
        const handoff = deploymentHandoffs.find((item) => item.id === activeItem.id);
        addMetric('status', handoff ? deploymentHandoffStatusLabel(handoff.status) : undefined, handoff?.status === 'live' ? 'good' : handoff?.status === 'rolled_back' ? 'danger' : undefined);
        addMetric('checklist', handoff ? `${handoff.checklist.filter((item) => item.status === 'done').length}/${handoff.checklist.length}` : undefined);
        addMetric('env', handoff?.environment);
        addLineage('model_release_gate', handoff?.modelReleaseGateId, handoff?.modelName);
        addLineage('dataset_version', handoff?.datasetVersionId, handoff?.datasetVersionName);
        postReleaseMonitors.filter((monitor) => monitor.deploymentHandoffId === activeItem.id).forEach((monitor) =>
          addLineage('post_release_monitor', monitor.id, monitor.environment)
        );
        break;
      }
      case 'post_release_monitor': {
        const monitor = postReleaseMonitors.find((item) => item.id === activeItem.id);
        addMetric('status', monitor ? postReleaseMonitorStatusLabel(monitor.status) : undefined, monitor?.status === 'healthy' ? 'good' : monitor?.status === 'rollback_required' ? 'danger' : 'warn');
        addMetric('alerts', monitor?.alerts.length, (monitor?.alerts.length ?? 0) > 0 ? 'warn' : 'good');
        addMetric('rollback', monitor?.rollbackSignal ? 'yes' : 'no', monitor?.rollbackSignal ? 'danger' : 'good');
        addLineage('deployment_handoff', monitor?.deploymentHandoffId, monitor?.environment);
        addLineage('dataset_version', monitor?.datasetVersionId, monitor?.datasetVersionName);
        feedbackLoops.filter((loop) => loop.postReleaseMonitorId === activeItem.id).forEach((loop) =>
          addLineage('feedback_loop', loop.id, loop.targetKind)
        );
        break;
      }
      case 'feedback_loop': {
        const loop = feedbackLoops.find((item) => item.id === activeItem.id);
        addMetric('status', loop?.status, loop?.status === 'promoted' ? 'good' : loop?.status === 'rejected' ? 'danger' : undefined);
        addMetric('severity', loop?.severity, loop?.severity === 'critical' ? 'danger' : loop?.severity === 'warning' ? 'warn' : 'good');
        addMetric('target', loop?.targetKind);
        addLineage('post_release_monitor', loop?.postReleaseMonitorId, loop?.environment);
        addLineage('deployment_handoff', loop?.deploymentHandoffId, loop?.environment);
        addLineage('model_release_gate', loop?.modelReleaseGateId, loop?.modelName);
        addLineage('training_run', loop?.trainingRunId, loop?.modelName);
        addLineage('eval_run', loop?.evalRunId, loop?.modelName);
        addLineage('dataset_version', loop?.datasetVersionId, loop?.datasetVersionName);
        break;
      }
      default:
        break;
    }

    return { item: activeItem, metrics, lineage, relatedTasks };
  }, [
    commandItems,
    datasetVersionDiff,
    datasetVersions,
    deploymentHandoffs,
    evalRuns,
    feedbackLoops,
    focusedTaskEntity,
    jobs,
    modelReleaseGates,
    postReleaseMonitors,
    releaseManifests,
    releasePromotions,
    retrainingHandoffs,
    selectedTaskId,
    taskList.tasks,
    traceList.traces,
    trainingRuns,
  ]);
  const lineageMapState = useMemo<LineageMapState>(() => {
    const nodes = new Map<string, LineageMapNode>();
    const edgeKeys = new Set<string>();
    const edges: LineageMapEdge[] = [];
    const addNode = (input: Omit<LineageMapNode, 'key' | 'stage' | 'entity'>) => {
      const key = lineageNodeKey(input.kind, input.id);
      const next: LineageMapNode = {
        ...input,
        key,
        stage: lineageStageForKind(input.kind),
        entity: { kind: input.kind, id: input.id, label: input.title },
      };
      const existing = nodes.get(key);
      if (!existing || (next.updatedAt ?? '').localeCompare(existing.updatedAt ?? '') >= 0) {
        nodes.set(key, next);
      }
    };
    const addEdge = (
      fromKind: TaskEntityRef['kind'],
      fromId: string | undefined,
      toKind: TaskEntityRef['kind'],
      toId: string | undefined,
      label: string,
      tone?: LineageMapNodeTone,
    ) => {
      if (!fromId || !toId) return;
      const from = lineageNodeKey(fromKind, fromId);
      const to = lineageNodeKey(toKind, toId);
      const edgeKey = `${from}->${to}:${label}`;
      if (!nodes.has(from) || !nodes.has(to) || edgeKeys.has(edgeKey)) return;
      edgeKeys.add(edgeKey);
      edges.push({ from, to, label, tone });
    };

    const traceIdsFromVersions = new Set(datasetVersions.flatMap((version) =>
      (version.sampleSnapshots ?? []).map((sample) => sample.traceId)
    ));
    jobs.forEach((job) => addNode({
      id: job.id,
      kind: 'ingest_job',
      title: `KodaX sync ${job.mode}`,
      meta: `${job.imported} imported · ${job.skipped} skipped · ${job.failed} failed`,
      status: job.status,
      updatedAt: job.finishedAt ?? job.startedAt,
      tone: job.status === 'failed' || job.failed > 0 ? 'danger' : job.status === 'succeeded' ? 'good' : 'warn',
    }));
    traceList.traces
      .filter((trace, index) => index < 40 || traceIdsFromVersions.has(trace.id) || trace.id === selectedTraceId)
      .forEach((trace) => addNode({
        id: trace.id,
        kind: 'trace',
        title: trace.title,
        meta: `${trace.projectKey ?? 'unknown project'} · ${trace.counts.messages} messages · ${trace.counts.toolUseEvents} tools`,
        status: trace.risk.level,
        updatedAt: trace.updatedAt,
        tone: trace.risk.level === 'L4' || trace.risk.level === 'L3' ? 'danger' : trace.risk.level === 'L2' ? 'warn' : 'neutral',
      }));
    datasetVersions.forEach((version) => addNode({
      id: version.id,
      kind: 'dataset_version',
      title: version.name,
      meta: `${datasetFormatLabel(version.format)} · ${version.sampleCount} samples · Q${version.averageQuality}`,
      status: datasetSourceLabel(version),
      updatedAt: version.createdAt,
      tone: version.averageQuality >= 80 ? 'good' : version.averageQuality >= 65 ? 'warn' : 'danger',
    }));
    releaseManifests.forEach((manifest) => addNode({
      id: manifest.id,
      kind: 'release_manifest',
      title: manifest.datasetVersionName,
      meta: `${manifest.sampleCount} samples · ${manifest.manifestHash.slice(0, 12)}`,
      status: releaseManifestStatusLabel(manifest.status),
      updatedAt: manifest.generatedAt,
      tone: manifest.status === 'ready' ? 'good' : manifest.status === 'blocked' ? 'danger' : 'warn',
    }));
    releasePromotions.forEach((promotion) => addNode({
      id: promotion.id,
      kind: 'release_promotion',
      title: promotion.datasetVersionName,
      meta: `${promotion.promotedBy} · ${promotion.manifestHash.slice(0, 12)}`,
      status: promotion.status,
      updatedAt: promotion.promotedAt,
      tone: promotion.status === 'promoted' ? 'good' : 'danger',
    }));
    retrainingHandoffs.forEach((handoff) => addNode({
      id: handoff.id,
      kind: 'retraining_handoff',
      title: handoff.datasetVersionName,
      meta: `${handoff.trainingOwner} -> ${handoff.targetSystem}`,
      status: handoff.status,
      updatedAt: handoff.createdAt,
      tone: handoff.status === 'completed' ? 'good' : 'neutral',
    }));
    trainingRuns.forEach((run) => addNode({
      id: run.id,
      kind: 'training_run',
      title: run.modelName,
      meta: `${run.owner} · ${run.metrics.length} metrics · ${run.targetSystem}`,
      status: trainingRunStatusLabel(run.status),
      updatedAt: run.updatedAt,
      tone: run.status === 'passed' ? 'good' : run.status === 'failed' || run.rollbackRequired ? 'danger' : 'warn',
    }));
    evalRuns.forEach((evalRun) => addNode({
      id: evalRun.id,
      kind: 'eval_run',
      title: evalRun.modelName,
      meta: `${evalRun.cases.filter((item) => item.status === 'passed').length}/${evalRun.cases.length} cases passed`,
      status: evalRunStatusLabel(evalRun.status),
      updatedAt: evalRun.completedAt,
      tone: evalRun.status === 'passed' ? 'good' : 'danger',
    }));
    modelReleaseGates.forEach((gate) => addNode({
      id: gate.id,
      kind: 'model_release_gate',
      title: gate.modelName,
      meta: `${gate.owner} · ${gate.checks.filter((item) => item.status === 'passed').length}/${gate.checks.length} checks`,
      status: modelReleaseGateStatusLabel(gate.status),
      updatedAt: gate.updatedAt,
      tone: gate.status === 'approved' ? 'good' : gate.status === 'blocked' || gate.status === 'rejected' ? 'danger' : 'warn',
    }));
    deploymentHandoffs.forEach((handoff) => addNode({
      id: handoff.id,
      kind: 'deployment_handoff',
      title: handoff.modelName,
      meta: `${handoff.environment} · ${handoff.deploymentOwner}`,
      status: deploymentHandoffStatusLabel(handoff.status),
      updatedAt: handoff.updatedAt,
      tone: handoff.status === 'live' ? 'good' : handoff.status === 'rolled_back' || handoff.status === 'cancelled' ? 'danger' : 'warn',
    }));
    postReleaseMonitors.forEach((monitor) => addNode({
      id: monitor.id,
      kind: 'post_release_monitor',
      title: monitor.modelName,
      meta: `${monitor.environment} · ${monitor.alerts.length} alerts`,
      status: postReleaseMonitorStatusLabel(monitor.status),
      updatedAt: monitor.updatedAt,
      tone: monitor.status === 'healthy' ? 'good' : monitor.status === 'rollback_required' || monitor.rollbackSignal ? 'danger' : 'warn',
    }));
    feedbackLoops.forEach((loop) => addNode({
      id: loop.id,
      kind: 'feedback_loop',
      title: loop.title,
      meta: `${feedbackLoopTargetLabel(loop.targetKind)} · ${loop.environment}`,
      status: feedbackLoopStatusLabel(loop.status),
      updatedAt: loop.updatedAt,
      tone: loop.severity === 'critical' ? 'danger' : loop.severity === 'warning' ? 'warn' : 'good',
    }));

    const latestJob = [...jobs].sort((a, b) => (b.finishedAt ?? b.startedAt).localeCompare(a.finishedAt ?? a.startedAt))[0];
    if (latestJob) {
      traceList.traces.slice(0, Math.min(8, latestJob.imported || 8)).forEach((trace) =>
        addEdge('ingest_job', latestJob.id, 'trace', trace.id, 'imports', latestJob.failed > 0 ? 'warn' : undefined)
      );
    }
    datasetVersions.forEach((version) => {
      const traceIds = Array.from(new Set((version.sampleSnapshots ?? []).map((sample) => sample.traceId))).slice(0, 10);
      traceIds.forEach((traceId) => addEdge('trace', traceId, 'dataset_version', version.id, 'distills'));
      (version.feedbackLoopIds ?? []).forEach((loopId) => addEdge('feedback_loop', loopId, 'dataset_version', version.id, 'feeds'));
    });
    releaseManifests.forEach((manifest) => {
      addEdge('dataset_version', manifest.datasetVersionId, 'release_manifest', manifest.id, 'packages', manifest.status === 'blocked' ? 'danger' : undefined);
      if (manifest.promotion?.id) addEdge('release_manifest', manifest.id, 'release_promotion', manifest.promotion.id, 'promotes');
    });
    releasePromotions.forEach((promotion) => {
      addEdge('dataset_version', promotion.datasetVersionId, 'release_promotion', promotion.id, 'promotes');
      addEdge('release_manifest', promotion.manifestId, 'release_promotion', promotion.id, 'promotes');
    });
    retrainingHandoffs.forEach((handoff) => {
      addEdge('release_manifest', handoff.manifestId, 'retraining_handoff', handoff.id, 'hands off');
      addEdge('release_promotion', handoff.promotionId, 'retraining_handoff', handoff.id, 'hands off');
      addEdge('dataset_version', handoff.datasetVersionId, 'retraining_handoff', handoff.id, 'trains');
    });
    trainingRuns.forEach((run) => {
      addEdge('retraining_handoff', run.handoffId, 'training_run', run.id, 'launches', run.rollbackRequired ? 'danger' : undefined);
      addEdge('dataset_version', run.datasetVersionId, 'training_run', run.id, 'trains');
    });
    evalRuns.forEach((evalRun) => {
      addEdge('training_run', evalRun.trainingRunId, 'eval_run', evalRun.id, 'evaluates', evalRun.status === 'failed' ? 'danger' : undefined);
      addEdge('dataset_version', evalRun.datasetVersionId, 'eval_run', evalRun.id, 'tests');
    });
    modelReleaseGates.forEach((gate) => {
      addEdge('training_run', gate.trainingRunId, 'model_release_gate', gate.id, 'gates');
      addEdge('eval_run', gate.evalRunId, 'model_release_gate', gate.id, 'gates', gate.evalStatus === 'failed' ? 'danger' : undefined);
      addEdge('dataset_version', gate.datasetVersionId, 'model_release_gate', gate.id, 'approves');
    });
    deploymentHandoffs.forEach((handoff) => {
      addEdge('model_release_gate', handoff.modelReleaseGateId, 'deployment_handoff', handoff.id, 'deploys', handoff.status === 'rolled_back' ? 'danger' : undefined);
      addEdge('training_run', handoff.trainingRunId, 'deployment_handoff', handoff.id, 'ships');
    });
    postReleaseMonitors.forEach((monitor) => {
      addEdge('deployment_handoff', monitor.deploymentHandoffId, 'post_release_monitor', monitor.id, 'monitors', monitor.rollbackSignal ? 'danger' : undefined);
      addEdge('model_release_gate', monitor.modelReleaseGateId, 'post_release_monitor', monitor.id, 'observes');
    });
    feedbackLoops.forEach((loop) => {
      addEdge('post_release_monitor', loop.postReleaseMonitorId, 'feedback_loop', loop.id, 'signals', loop.severity === 'critical' ? 'danger' : loop.severity === 'warning' ? 'warn' : undefined);
      addEdge('deployment_handoff', loop.deploymentHandoffId, 'feedback_loop', loop.id, 'reports');
      addEdge('model_release_gate', loop.modelReleaseGateId, 'feedback_loop', loop.id, 'repairs');
      addEdge('training_run', loop.trainingRunId, 'feedback_loop', loop.id, 'learns');
      addEdge('eval_run', loop.evalRunId, 'feedback_loop', loop.id, 'learns');
      addEdge('dataset_version', loop.datasetVersionId, 'feedback_loop', loop.id, 'origin');
    });

    const activeTask = selectedTaskId ? taskList.tasks.find((task) => task.id === selectedTaskId) : undefined;
    const activeRefs = focusedTaskEntity ? [focusedTaskEntity] : activeTask?.entityRefs ?? [];
    const activeKeys = new Set(activeRefs.map(lineageEntityKey).filter((key) => nodes.has(key)));
    const upstreamKeys = new Set<string>();
    const downstreamKeys = new Set<string>();
    edges.forEach((edge) => {
      if (activeKeys.has(edge.to)) upstreamKeys.add(edge.from);
      if (activeKeys.has(edge.from)) downstreamKeys.add(edge.to);
    });
    const connectedKeys = new Set([...activeKeys, ...upstreamKeys, ...downstreamKeys]);
    const nodeList = Array.from(nodes.values());
    const toNodeList = (keys: Set<string>) =>
      Array.from(keys)
        .map((key) => nodes.get(key))
        .filter((node): node is LineageMapNode => Boolean(node))
        .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? ''));
    const relatedTasks = activeKeys.size > 0
      ? taskList.tasks.filter((task) => task.entityRefs.some((ref) => activeKeys.has(lineageEntityKey(ref))))
      : [...taskList.tasks].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5);
    const insights: LineageMapInsight[] = [];
    const failedJobs = jobs.filter((job) => job.status === 'failed' || job.failed > 0).length;
    if (failedJobs > 0) insights.push({ label: 'Sync needs attention', detail: `${failedJobs} ingest job has failures.`, tone: 'danger' });
    const latestDataset = [...datasetVersions].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    if (latestDataset && !releaseManifests.some((manifest) => manifest.datasetVersionId === latestDataset.id)) {
      insights.push({ label: 'Dataset not packaged', detail: `${latestDataset.name} has no release manifest yet.`, tone: 'warn' });
    }
    const blockedGates = modelReleaseGates.filter((gate) => gate.status === 'blocked' || gate.status === 'rejected').length;
    if (blockedGates > 0) insights.push({ label: 'Model release blocked', detail: `${blockedGates} gate needs review before rollout.`, tone: 'danger' });
    const rollbackMonitors = postReleaseMonitors.filter((monitor) => monitor.rollbackSignal || monitor.status === 'rollback_required').length;
    if (rollbackMonitors > 0) insights.push({ label: 'Rollback signal', detail: `${rollbackMonitors} monitor is asking for intervention.`, tone: 'danger' });
    const loopIdsInDatasets = new Set(datasetVersions.flatMap((version) => version.feedbackLoopIds ?? []));
    const promotedLoopsWithoutDataset = feedbackLoops.filter((loop) => loop.status === 'promoted' && !loopIdsInDatasets.has(loop.id)).length;
    if (promotedLoopsWithoutDataset > 0) {
      insights.push({ label: 'Feedback not recycled', detail: `${promotedLoopsWithoutDataset} promoted loop is not yet a dataset version.`, tone: 'warn' });
    }
    if (taskList.summary.failed > 0) {
      insights.push({ label: 'Task executor failures', detail: `${taskList.summary.failed} task failed in the queue.`, tone: 'danger' });
    }
    if (insights.length === 0 && nodeList.length > 0) {
      insights.push({ label: 'Lifecycle connected', detail: 'Current KodaX pipeline has no obvious lineage gap.', tone: 'good' });
    }

    return {
      nodes: nodeList,
      edges,
      activeKeys,
      connectedKeys,
      upstreamNodes: toNodeList(upstreamKeys),
      downstreamNodes: toNodeList(downstreamKeys),
      relatedTasks,
      tasks: [...taskList.tasks].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
      insights,
    };
  }, [
    datasetVersions,
    deploymentHandoffs,
    evalRuns,
    feedbackLoops,
    focusedTaskEntity,
    jobs,
    modelReleaseGates,
    postReleaseMonitors,
    releaseManifests,
    releasePromotions,
    retrainingHandoffs,
    selectedTaskId,
    selectedTraceId,
    taskList.summary.failed,
    taskList.tasks,
    traceList.traces,
    trainingRuns,
  ]);

  useEffect(() => {
    if (selectedTaskId && !taskList.tasks.some((task) => task.id === selectedTaskId)) {
      setSelectedTaskId(undefined);
    }
  }, [selectedTaskId, taskList.tasks]);

  useEffect(() => {
    if (!focusedTaskEntity) return;
    const timer = window.setTimeout(() => {
      const selector = `[data-entity-kind="${focusedTaskEntity.kind}"][data-entity-id="${focusedTaskEntity.id}"]`;
      const fallbackSelector = `[data-entity-panel="${focusedTaskEntity.kind}"]`;
      const target = document.querySelector<HTMLElement>(selector);
      const fallback = document.querySelector<HTMLElement>(fallbackSelector);
      const element = target ?? fallback;
      if (!element) return;
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('entity-focus-flash');
      window.setTimeout(() => element.classList.remove('entity-focus-flash'), 1800);
    }, 80);
    return () => window.clearTimeout(timer);
  }, [focusedTaskEntity]);

  async function refreshList(nextSelectedId?: string) {
    const [architecture, status, traces, recentJobs, qualityQueue, policy, policyRuns, taskItems, automationPlan, recentExports, manifests, promotions, handoffs, closedLoopPlans, launchPlans, runs, evalItems, harnessItems, agentIssues, agentCases, agentSuites, agentExperiments, agentReports, gates, deploymentItems, postMonitors, feedbackItems, versions, projectList, samples, cleanTraces, memoryCandidates, governanceRules, auditLog, persistenceHealth, segmentStatus, snapshots, feedbackReport, feedbackPackage, feedbackWritebacks] = await Promise.all([
      getPlatformArchitecture(),
      getSourceStatus(),
      listTraces(params),
      listJobs(),
      getIngestQualityQueue(),
      getIngestQualityPolicy(),
      listIngestQualityPolicyRuns(),
      listTasks(),
      getTaskAutomationPlan(),
      listExportRuns(),
      listReleaseManifests(),
      listReleasePromotions(),
      listRetrainingHandoffs(),
      listClosedLoopRetrainingPlans(),
      listTrainingLaunchPlans(),
      listTrainingRuns(),
      listEvalRuns(),
      listHarnessSnapshots(),
      listAgentEvaluationIssues(),
      listAgentBenchmarkCases(),
      listAgentBenchmarkSuites(),
      listAgentEvaluationExperiments(),
      listAgentEvaluationReports(),
      listModelReleaseGates(),
      listDeploymentHandoffs(),
      listPostReleaseMonitors(),
      listFeedbackLoops(),
      listDatasetVersions(),
      listProjects(),
      listTrainingSamples(params),
      listCleanTraces(params),
      listMemoryCandidates(params),
      getGovernancePolicy(),
      listGovernanceAuditLog(12),
      getStorageHealth(),
      getSegmentStoreStatus(),
      listStorageSnapshots(),
      getKodaXFeedbackReport(),
      getKodaXFeedbackPackage(),
      listKodaXFeedbackWritebacks(8),
    ]);
    setPlatformArchitecture(architecture);
    setSource(status);
    setTraceList(traces);
    setJobs(recentJobs);
    setIngestQualityQueue(qualityQueue);
    setIngestQualityPolicy(policy);
    setIngestQualityPolicyRuns(policyRuns);
    setTaskList(taskItems);
    setTaskAutomationPlan(automationPlan);
    setExportRuns(recentExports);
    setReleaseManifests(manifests);
    setReleasePromotions(promotions);
    setRetrainingHandoffs(handoffs);
    setClosedLoopRetrainingPlans(closedLoopPlans);
    setTrainingLaunchPlans(launchPlans);
    setTrainingRuns(runs);
    setEvalRuns(evalItems);
    setHarnessSnapshots(harnessItems);
    setAgentEvaluationIssues(agentIssues);
    setAgentBenchmarkCases(agentCases);
    setAgentBenchmarkSuites(agentSuites);
    setAgentEvaluationExperiments(agentExperiments);
    setAgentEvaluationReports(agentReports);
    setModelReleaseGates(gates);
    setDeploymentHandoffs(deploymentItems);
    setPostReleaseMonitors(postMonitors);
    setFeedbackLoops(feedbackItems);
    setDatasetVersions(versions);
    setSelectedDatasetVersionId((current) =>
      current && versions.some((version) => version.id === current) ? current : versions[0]?.id
    );
    setProjects(projectList);
    setSampleList(samples);
    setCleanTraceList(cleanTraces);
    setMemoryCandidateList(memoryCandidates);
    setGovernancePolicy(governanceRules);
    setGovernanceAuditLog(auditLog);
    setStorageHealth(persistenceHealth);
    setSegmentStoreStatus(segmentStatus);
    setStorageSnapshots(snapshots);
    setKodaxFeedbackReport(feedbackReport);
    setKodaxFeedbackPackage(feedbackPackage);
    setKodaxFeedbackWritebacks(feedbackWritebacks);
    const target = nextSelectedId ?? selectedTraceId ?? traces.traces[0]?.id;
    setSelectedTraceId(target);
  }

  async function runSync(mode: 'manual' | 'retry' = 'manual') {
    setSyncing(true);
    setError(undefined);
    try {
      await syncKodaX(mode);
      await refreshList();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSyncing(false);
    }
  }

  async function toggleWatch() {
    setError(undefined);
    try {
      const status = await setKodaXWatch(!(source?.autoWatch ?? true));
      setSource(status);
      await refreshList();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleTriageDiagnostic(jobId: string, diagnosticId: string, decision: IngestDiagnosticTriageDecision) {
    const label = decision === 'acknowledge'
      ? 'Acknowledge'
      : decision === 'ignore'
        ? 'Ignore'
        : decision === 'resolve'
          ? 'Resolve'
          : 'Reopen';
    const note = decision === 'reopen'
      ? ''
      : window.prompt(`${label} warning note`, decision === 'ignore' ? 'Known harmless KodaX metadata gap.' : '');
    if (note === null) return;
    setTriagingDiagnosticId(diagnosticId);
    setError(undefined);
    try {
      await triageIngestDiagnostic(jobId, diagnosticId, decision, note);
      await refreshList(selectedTraceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setTriagingDiagnosticId(undefined);
    }
  }

  async function handleTriageQualityIssue(issue: IngestQualityIssue, decision: IngestDiagnosticTriageDecision) {
    const label = decision === 'acknowledge'
      ? 'Acknowledge'
      : decision === 'ignore'
        ? 'Ignore'
        : decision === 'resolve'
          ? 'Resolve'
          : 'Reopen';
    const note = decision === 'reopen'
      ? ''
      : window.prompt(`${label} all open occurrences`, decision === 'ignore' ? 'Known harmless KodaX metadata gap.' : '');
    if (note === null) return;
    setTriagingIssueId(issue.id);
    setError(undefined);
    try {
      await triageIngestQualityIssue(issue.id, decision, note);
      await refreshList(selectedTraceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setTriagingIssueId(undefined);
    }
  }

  async function handleResolveFixedKodaXDiagnostics() {
    setResolvingFixedDiagnostics(true);
    setError(undefined);
    setNotice(undefined);
    try {
      const result = await resolveFixedKodaXIngestDiagnostics();
      setIngestQualityQueue(result.queue);
      const categoryText = result.categories
        .map((category) => `${category.label}: ${category.affectedDiagnostics}`)
        .join(' · ');
      setNotice(result.affectedDiagnostics > 0
        ? `Resolved ${result.affectedDiagnostics} fixed KodaX diagnostics.${categoryText ? ` ${categoryText}` : ''}`
        : 'No fixed KodaX diagnostics needed resolution.');
      await refreshList(selectedTraceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setResolvingFixedDiagnostics(false);
    }
  }

  async function handleCreatePolicyRecommendation(recommendation: IngestQualityPolicyRecommendation) {
    setSavingPolicyKey(recommendation.issueId);
    setError(undefined);
    try {
      const nextPolicy = await upsertIngestQualityPolicyRule({
        code: recommendation.code,
        level: recommendation.level,
        action: recommendation.suggestedAction,
        severity: recommendation.suggestedSeverity,
        enabled: false,
        state: 'draft',
        note: recommendation.reason,
        stateChangeActor: 'traceops-operator',
        stateChangeNote: `Saved draft from recommendation: ${recommendation.reason}`,
      });
      setIngestQualityPolicy(nextPolicy);
      const createdRule = nextPolicy.rules.find((rule) => rule.code === recommendation.code);
      if (createdRule) {
        setDryRunningPolicyKey(createdRule.id);
        const preview = await dryRunIngestQualityPolicy(createdRule.id);
        setPolicyDryRun(preview);
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return false;
    } finally {
      setDryRunningPolicyKey(undefined);
      setSavingPolicyKey(undefined);
    }
  }

  async function handleCreatePolicyRecommendations(recommendations: IngestQualityPolicyRecommendation[]) {
    const visibleRecommendations = recommendations.slice(0, 8);
    if (visibleRecommendations.length === 0) return false;
    setSavingPolicyKey('__recommendations__');
    setError(undefined);
    try {
      let nextPolicy = ingestQualityPolicy;
      const createdCodes: string[] = [];
      for (const recommendation of visibleRecommendations) {
        nextPolicy = await upsertIngestQualityPolicyRule({
          code: recommendation.code,
          level: recommendation.level,
          action: recommendation.suggestedAction,
          severity: recommendation.suggestedSeverity,
          enabled: false,
          state: 'draft',
          note: recommendation.reason,
          stateChangeActor: 'traceops-operator',
          stateChangeNote: `Batch saved draft from recommendation: ${recommendation.reason}`,
        });
        createdCodes.push(recommendation.code);
      }
      setIngestQualityPolicy(nextPolicy);
      const createdRules = nextPolicy.rules.filter((rule) => createdCodes.includes(rule.code));
      setSelectedPolicyRuleIds(createdRules.map((rule) => rule.id));
      const previews = [];
      for (const rule of createdRules) {
        previews.push(await dryRunIngestQualityPolicy(rule.id));
      }
      if (previews.length > 0) {
        setPolicyDryRun(aggregatePolicyDryRunPreviews(previews, 'selected_rules', createdRules.length));
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return false;
    } finally {
      setSavingPolicyKey(undefined);
    }
  }

  async function handleDismissPolicyRecommendations(recommendations: IngestQualityPolicyRecommendation[]) {
    const visibleRecommendations = recommendations.slice(0, 8);
    if (visibleRecommendations.length === 0) return false;
    const key = visibleRecommendations.length === 1 ? visibleRecommendations[0].issueId : '__visible__';
    const note = window.prompt(
      visibleRecommendations.length === 1 ? 'Ignore recommendation note' : 'Dismiss selected recommendations note',
      'Not useful for current KodaX ingest policy.'
    );
    if (note === null) return false;
    setDecidingRecommendationKey(key);
    setError(undefined);
    try {
      const nextPolicy = await decideIngestQualityRecommendations(visibleRecommendations, note);
      setIngestQualityPolicy(nextPolicy);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      return false;
    } finally {
      setDecidingRecommendationKey(undefined);
    }
  }

  async function handleRestorePolicyRecommendation(recordId: string) {
    const note = window.prompt('Restore recommendation note', 'Restored to recommendation intake.');
    if (note === null) return;
    setDecidingRecommendationKey(`restore:${recordId}`);
    setError(undefined);
    try {
      const nextPolicy = await restoreIngestQualityRecommendation(recordId, note);
      setIngestQualityPolicy(nextPolicy);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setDecidingRecommendationKey(undefined);
    }
  }

  async function handleUpdatePolicyRule(rule: IngestQualityPolicyRule, patch: Partial<IngestQualityPolicyRule>) {
    const stateChange: {
      state?: IngestQualityPolicyRule['state'];
      stateChangeActor?: string;
      stateChangeNote?: string;
      stateChangePreview?: {
        matchedDiagnostics: number;
        changeableDiagnostics: number;
        matchedIssues: number;
      };
    } = {};
    if (patch.enabled === true && !rule.enabled) {
      setDryRunningPolicyKey(rule.id);
      setError(undefined);
      try {
        const preview = await dryRunIngestQualityPolicy(rule.id);
        setPolicyDryRun(preview);
        const previewedRule = preview.ruleResults.find((result) => result.ruleId === rule.id);
        const matched = previewedRule?.matchedDiagnostics ?? 0;
        const changeable = previewedRule?.changeableDiagnostics ?? 0;
        const confirmed = window.confirm(`Go live with ${rule.code}? ${matched} open diagnostics match, ${changeable} would change when policy runs.`);
        if (!confirmed) return;
        const note = window.prompt('Go live note', `Reviewed preview: ${matched} matched, ${changeable} would change.`);
        if (note === null) return;
        stateChange.state = 'live';
        stateChange.stateChangeActor = 'traceops-operator';
        stateChange.stateChangeNote = note;
        stateChange.stateChangePreview = {
          matchedDiagnostics: matched,
          changeableDiagnostics: changeable,
          matchedIssues: previewedRule?.matchedIssues ?? 0,
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        return;
      } finally {
        setDryRunningPolicyKey(undefined);
      }
    }
    if (patch.enabled === false && rule.enabled) {
      const note = window.prompt('Pause rule reason', 'Paused after operator review.');
      if (note === null) return;
      stateChange.state = 'paused';
      stateChange.stateChangeActor = 'traceops-operator';
      stateChange.stateChangeNote = note;
    }
    setSavingPolicyKey(rule.id);
    setError(undefined);
    try {
      const nextPolicy = await upsertIngestQualityPolicyRule({
        id: rule.id,
        code: rule.code,
        level: patch.level ?? rule.level,
        action: patch.action ?? rule.action,
        severity: patch.severity ?? rule.severity,
        enabled: patch.enabled ?? rule.enabled,
        state: stateChange.state,
        note: patch.note ?? rule.note,
        stateChangeActor: stateChange.stateChangeActor,
        stateChangeNote: stateChange.stateChangeNote,
        stateChangePreview: stateChange.stateChangePreview,
      });
      setIngestQualityPolicy(nextPolicy);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingPolicyKey(undefined);
    }
  }

  async function handleApplyPolicy() {
    setApplyingPolicy(true);
    setError(undefined);
    try {
      const result = await applyIngestQualityPolicy();
      setIngestQualityQueue(result.queue);
      setIngestQualityPolicy(result.policy);
      await refreshList(selectedTraceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setApplyingPolicy(false);
    }
  }

  async function handleInstallDefaultPolicyRules() {
    const confirmed = ingestQualityPolicy.summary.totalRules === 0
      || window.confirm('Install TraceOps default quality rules and apply them to the current queue?');
    if (!confirmed) return;
    setInstallingPolicyDefaults(true);
    setError(undefined);
    try {
      const result = await installDefaultIngestQualityPolicyRules();
      setIngestQualityQueue(result.queue);
      setIngestQualityPolicy(result.policy);
      if (result.run) {
        const run = result.run;
        setIngestQualityPolicyRuns((current) => ({
          runs: [run, ...current.runs.filter((item) => item.id !== run.id)].slice(0, 50),
          summary: {
            totalRuns: current.summary.totalRuns + 1,
            manualRuns: current.summary.manualRuns + 1,
            automaticRuns: current.summary.automaticRuns,
            skippedRuns: current.summary.skippedRuns + (run.status === 'skipped' ? 1 : 0),
            affectedDiagnostics: current.summary.affectedDiagnostics + run.affectedDiagnostics,
            affectedIssues: current.summary.affectedIssues + run.affectedIssues,
            lastRunAt: run.finishedAt,
          },
        }));
      }
      await refreshList(selectedTraceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setInstallingPolicyDefaults(false);
    }
  }

  async function handleDryRunPolicy(rule?: IngestQualityPolicyRule) {
    const key = rule?.id ?? '__all__';
    setDryRunningPolicyKey(key);
    setError(undefined);
    try {
      const result = await dryRunIngestQualityPolicy(rule?.id);
      setPolicyDryRun(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setDryRunningPolicyKey(undefined);
    }
  }

  function handleTogglePolicyRuleSelection(ruleId: string) {
    setSelectedPolicyRuleIds((current) =>
      current.includes(ruleId) ? current.filter((id) => id !== ruleId) : [...current, ruleId]
    );
  }

  function handleSelectDraftPolicyRules() {
    setSelectedPolicyRuleIds(
      ingestQualityPolicy.rules
        .filter((rule) => !rule.enabled)
        .map((rule) => rule.id)
    );
  }

  function handleClearPolicyRuleSelection() {
    setSelectedPolicyRuleIds([]);
  }

  async function handleBatchGoLivePolicyRules() {
    const selectedRules = ingestQualityPolicy.rules.filter((rule) =>
      selectedPolicyRuleIds.includes(rule.id) && !rule.enabled
    );
    if (selectedRules.length === 0) return;
    setBatchPublishingPolicy(true);
    setError(undefined);
    try {
      const previews = [];
      for (const rule of selectedRules) {
        previews.push(await dryRunIngestQualityPolicy(rule.id));
      }
      const batchPreview = aggregatePolicyDryRunPreviews(previews, 'selected_rules', selectedRules.length);
      const ruleResults = batchPreview.ruleResults;
      setPolicyDryRun(batchPreview);
      const confirmed = window.confirm(
        `Go live with ${selectedRules.length} selected rules? ${batchPreview.matchedDiagnostics} open diagnostics match, ${batchPreview.changeableDiagnostics} would change when policy runs.`
      );
      if (!confirmed) return;
      const note = window.prompt(
        'Batch go live note',
        `Batch reviewed preview: ${batchPreview.matchedDiagnostics} matched, ${batchPreview.changeableDiagnostics} would change.`
      );
      if (note === null) return;
      for (const rule of selectedRules) {
        const previewedRule = ruleResults.find((result) => result.ruleId === rule.id);
        await upsertIngestQualityPolicyRule({
          id: rule.id,
          code: rule.code,
          level: rule.level,
          action: rule.action,
          severity: rule.severity,
          enabled: true,
          state: 'live',
          note: rule.note,
          stateChangeActor: 'traceops-operator',
          stateChangeNote: note,
          stateChangePreview: {
            matchedDiagnostics: previewedRule?.matchedDiagnostics ?? 0,
            changeableDiagnostics: previewedRule?.changeableDiagnostics ?? 0,
            matchedIssues: previewedRule?.matchedIssues ?? 0,
          },
        });
      }
      setSelectedPolicyRuleIds([]);
      await refreshList(selectedTraceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBatchPublishingPolicy(false);
    }
  }

  async function handleTogglePolicyAutoApply() {
    setTogglingPolicyAutoApply(true);
    setError(undefined);
    try {
      const nextSource = await setQualityPolicyAutoApply(source?.autoApplyQualityPolicy === false);
      setSource(nextSource);
      await refreshList(selectedTraceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setTogglingPolicyAutoApply(false);
    }
  }

  async function handleRetryTask(taskId: string) {
    const note = window.prompt('Retry task note', 'Retry requested from Task Center.');
    if (note === null) return;
    setRetryingTaskId(taskId);
    setError(undefined);
    try {
      await retryTask(taskId, note);
      await refreshList(selectedTraceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRetryingTaskId(undefined);
    }
  }

  async function handleRunQueuedTasks() {
    setRunningTaskExecutor(true);
    setError(undefined);
    try {
      await runQueuedTasks(3);
      await refreshList(selectedTraceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunningTaskExecutor(false);
    }
  }

  async function handleCreateStorageSnapshot() {
    setCreatingStorageSnapshot(true);
    setError(undefined);
    try {
      const result = await createStorageSnapshot('created_from_system_governance_center');
      setStorageHealth(result.health);
      setStorageSnapshots((current) => [result.snapshot, ...current.filter((snapshot) => snapshot.id !== result.snapshot.id)]);
      setNotice(`已创建存储快照 ${result.snapshot.id}`);
      await refreshList(selectedTraceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreatingStorageSnapshot(false);
    }
  }

  async function handleRestoreStorageSnapshot(id: string) {
    const confirmed = window.confirm(`Restore snapshot ${id}? 当前 store 会先自动生成 pre-restore 快照。`);
    if (!confirmed) return;
    setRestoringSnapshotId(id);
    setError(undefined);
    try {
      const result = await restoreStorageSnapshot(id);
      setStorageHealth(result.health);
      setNotice(`已从快照 ${result.snapshot.id} 恢复`);
      await refreshList(selectedTraceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRestoringSnapshotId(undefined);
    }
  }

  async function handleBackfillSegmentStore() {
    setBackfillingSegments(true);
    setError(undefined);
    try {
      const result: TraceOpsSegmentBackfillResult = await backfillSegmentStore('manual_backfill_from_system_governance_center');
      setSegmentStoreStatus(result.status);
      setNotice(`Segment lake 回填完成：写入 ${result.written} 条，跳过 ${result.skipped} 条`);
      await refreshList(selectedTraceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBackfillingSegments(false);
    }
  }

  async function handleRebuildSegmentStore() {
    const confirmed = window.confirm('重建 Segment Lake 会删除现有分片文件并按当前稳定规则重新生成。继续吗？');
    if (!confirmed) return;
    setRebuildingSegments(true);
    setError(undefined);
    try {
      const result = await rebuildSegmentStore('manual_rebuild_from_system_governance_center');
      setSegmentStoreStatus(result.status);
      setNotice(`Segment lake 已重建：写入 ${result.written} 条，生成 ${result.filesCreated} 个分片`);
      await refreshList(selectedTraceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRebuildingSegments(false);
    }
  }

  async function handleOrchestrateSystemTasks(runNow: boolean) {
    setOrchestratingSystemTasks(true);
    setError(undefined);
    try {
      const result = await orchestrateTasks({ runNow, limit: 3 });
      setNotice(runNow
        ? `已编排 ${result.summary.created} 个任务并执行 ${result.execution?.executed ?? 0} 个`
        : `已编排 ${result.summary.created} 个系统任务`);
      await refreshList(selectedTraceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setOrchestratingSystemTasks(false);
    }
  }

  async function handleWritebackKodaXFeedback() {
    setWritingBackKodaXFeedback(true);
    setError(undefined);
    try {
      const result = await writebackKodaXFeedbackPackage('manual_writeback_from_system_governance_center');
      setKodaxFeedbackWritebacks((current) => [result.record, ...current.filter((item) => item.id !== result.record.id)].slice(0, 8));
      setNotice(result.record.status === 'written'
        ? `已写回 KodaX inbox：${result.record.files.length} 个文件`
        : `KodaX 写回失败：${result.record.errorMessage ?? '未知错误'}`);
      await refreshList(selectedTraceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setWritingBackKodaXFeedback(false);
    }
  }

  async function handleCreateAuditActionTasks(tasks: TraceOpsTaskCreateInput[], actionIds: string[]) {
    if (tasks.length === 0) return;
    setCreatingAuditTaskActionId(actionIds.length > 1 ? 'bulk' : actionIds[0]);
    setError(undefined);
    try {
      const result = await createTasks(tasks);
      setQueuedAuditActionIds((current) => Array.from(new Set([...current, ...actionIds])));
      await refreshList(selectedTraceId);
      setSelectedTaskId(result.created[0]?.id);
      window.setTimeout(() => {
        document.querySelector<HTMLElement>('.task-center-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 120);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreatingAuditTaskActionId(undefined);
    }
  }

  function handleOpenTaskEntity(entity: TaskEntityRef) {
    setSelectedTaskId(undefined);
    setFocusedTaskEntity({ ...entity, requestedAt: Date.now() });
    if (entity.kind === 'trace') {
      setSelectedTraceId(entity.id);
      return;
    }
    if (entity.kind === 'dataset_version') {
      setSelectedDatasetVersionId(entity.id);
      return;
    }

    const datasetVersionId =
      entity.kind === 'release_manifest' ? releaseManifests.find((item) => item.id === entity.id)?.datasetVersionId
        : entity.kind === 'release_promotion' ? releasePromotions.find((item) => item.id === entity.id)?.datasetVersionId
          : entity.kind === 'retraining_handoff' ? retrainingHandoffs.find((item) => item.id === entity.id)?.datasetVersionId
            : entity.kind === 'training_run' ? trainingRuns.find((item) => item.id === entity.id)?.datasetVersionId
              : entity.kind === 'eval_run' ? evalRuns.find((item) => item.id === entity.id)?.datasetVersionId
                : entity.kind === 'model_release_gate' ? modelReleaseGates.find((item) => item.id === entity.id)?.datasetVersionId
                  : entity.kind === 'deployment_handoff' ? deploymentHandoffs.find((item) => item.id === entity.id)?.datasetVersionId
                    : entity.kind === 'post_release_monitor' ? postReleaseMonitors.find((item) => item.id === entity.id)?.datasetVersionId
                      : entity.kind === 'feedback_loop' ? feedbackLoops.find((item) => item.id === entity.id)?.datasetVersionId
                        : undefined;
    if (datasetVersionId) setSelectedDatasetVersionId(datasetVersionId);
  }

  function handleOpenCommandItem(item: CommandPaletteItem) {
    if (item.kind === 'task' && item.taskId) {
      setFocusedTaskEntity(undefined);
      setSelectedTaskId(item.taskId);
      window.setTimeout(() => {
        document.querySelector<HTMLElement>('.task-center-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 80);
      return;
    }
    if (item.entity) handleOpenTaskEntity(item.entity);
  }

  async function handleReviewSample(sampleId: string, decision: 'approved' | 'rejected') {
    const traceId = detail?.trace.id ?? selectedTraceId;
    setReviewingSampleId(sampleId);
    setError(undefined);
    try {
      await reviewTrainingSample(sampleId, decision);
      await refreshList(traceId);
      if (traceId) setDetail(await getTrace(traceId));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setReviewingSampleId(undefined);
    }
  }

  async function handleReviewSamples(sampleIds: string[], decision: 'approved' | 'rejected') {
    setError(undefined);
    try {
      const result = await reviewTrainingSamples(sampleIds, decision);
      await refreshList(selectedTraceId);
      if (selectedTraceId) setDetail(await getTrace(selectedTraceId));
      if (result.failed.length > 0) {
        setError(`${result.updated.length} updated, ${result.failed.length} failed: ${result.failed[0]?.message ?? 'review failed'}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleRepairSample(sampleId: string, input: {
    cleanUserGoal?: string;
    cleanAssistantOutcome?: string;
    relinkedEvidenceIds?: string[];
    evidenceGapNote?: string;
    note?: string;
  }) {
    setError(undefined);
    try {
      const repaired = await repairTrainingSample(sampleId, input);
      await refreshList(repaired.traceId);
      setDetail(await getTrace(repaired.traceId));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    }
  }

  async function handleLoadEvidenceCandidates(sampleId: string) {
    setError(undefined);
    try {
      return await listTrainingSampleEvidenceCandidates(sampleId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    }
  }

  async function handleReviewMemoryCandidate(candidateId: string, decision: 'promoted' | 'rejected') {
    setReviewingMemoryCandidateId(candidateId);
    setError(undefined);
    try {
      const candidate = await reviewMemoryCandidate(candidateId, decision);
      await refreshList(candidate.traceId);
      if (selectedTraceId === candidate.traceId) setDetail(await getTrace(candidate.traceId));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setReviewingMemoryCandidateId(undefined);
    }
  }

  async function handleRevokeExportRun(id: string) {
    setRevokingExportId(id);
    setError(undefined);
    try {
      await revokeExportRun(id, 'Revoked from TraceOps export audit.');
      await refreshList(selectedTraceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRevokingExportId(undefined);
    }
  }

  async function handleReleaseGateAction(
    versionId: string,
    checkId: string,
    decision: DatasetReleaseGateActionDecision,
  ) {
    const note = window.prompt(`${releaseGateDecisionLabel(decision)} note`, releaseGateDefaultNote(decision));
    if (note === null) return;
    setActingGateKey(`${versionId}:${checkId}:${decision}`);
    setError(undefined);
    try {
      await recordDatasetReleaseGateAction(versionId, { checkId, decision, note });
      await refreshList(selectedTraceId);
      setSelectedDatasetVersionId(versionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActingGateKey(undefined);
    }
  }

  async function handleCreateReleaseManifest(versionId: string) {
    setGeneratingManifestVersionId(versionId);
    setError(undefined);
    try {
      await createReleaseManifest(versionId, 'Generated from TraceOps Dataset Registry.');
      await refreshList(selectedTraceId);
      setSelectedDatasetVersionId(versionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setGeneratingManifestVersionId(undefined);
    }
  }

  async function handlePromoteReleaseManifest(manifestId: string) {
    const note = window.prompt('Promote release manifest', 'Approved as the active TraceOps release package.');
    if (note === null) return;
    setPromotingManifestId(manifestId);
    setError(undefined);
    try {
      const manifest = await promoteReleaseManifest(manifestId, note);
      await refreshList(selectedTraceId);
      setSelectedDatasetVersionId(manifest.datasetVersionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPromotingManifestId(undefined);
    }
  }

  async function handleCreateRetrainingHandoffFromManifest(manifestId: string) {
    const trainingOwner = window.prompt('Training owner', 'training-owner');
    if (trainingOwner === null) return;
    const note = window.prompt('Retraining handoff note', 'Promote this ready manifest and create a retraining handoff.');
    if (note === null) return;
    setCreatingHandoffManifestId(manifestId);
    setError(undefined);
    try {
      const result = await createRetrainingHandoffFromManifest(manifestId, {
        trainingOwner,
        targetSystem: 'manual-training',
        note,
      });
      await refreshList(selectedTraceId);
      setSelectedDatasetVersionId(result.handoff.datasetVersionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreatingHandoffManifestId(undefined);
    }
  }

  async function handleCreateRetrainingHandoff(promotionId: string) {
    const trainingOwner = window.prompt('Training owner', 'training-owner');
    if (trainingOwner === null) return;
    const note = window.prompt('Retraining handoff note', 'Use the promoted TraceOps release package as the retraining source of truth.');
    if (note === null) return;
    setCreatingHandoffPromotionId(promotionId);
    setError(undefined);
    try {
      await createRetrainingHandoff(promotionId, {
        trainingOwner,
        targetSystem: 'manual-training',
        note,
      });
      await refreshList(selectedTraceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreatingHandoffPromotionId(undefined);
    }
  }

  async function handleCreateTrainingRun(handoffId: string) {
    const launchPlan = trainingLaunchPlans.find((plan) => plan.handoffId === handoffId);
    const owner = window.prompt('Training owner', 'training-owner');
    if (owner === null) return;
    const modelName = window.prompt('Target model', launchPlan?.recommendedModelName ?? 'kodax-agent-sft-candidate');
    if (modelName === null) return;
    const externalRunId = window.prompt('External run id', `manual-${Date.now()}`);
    if (externalRunId === null) return;
    setCreatingTrainingRunHandoffId(handoffId);
    setError(undefined);
    try {
      await createTrainingRun(handoffId, {
        owner,
        targetSystem: launchPlan?.targetSystem ?? 'manual-training',
        modelName,
        externalRunId,
        note: launchPlan
          ? `Launched from ${trainingLaunchObjectiveLabel(launchPlan.objective)} plan ${launchPlan.launchHash.slice(0, 24)}.`
          : 'Registered from TraceOps retraining handoff.',
      });
      await refreshList(selectedTraceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreatingTrainingRunHandoffId(undefined);
    }
  }

  async function handleRecordTrainingRunResult(runId: string) {
    const scoreText = window.prompt('Validation score, 0-1', '0.86');
    if (scoreText === null) return;
    const regressionText = window.prompt('Regression rate, 0-1', '0.02');
    if (regressionText === null) return;
    const blockedText = window.prompt('Blocked issue count', '0');
    if (blockedText === null) return;
    const rollbackText = window.prompt('Rollback required? yes/no', 'no');
    if (rollbackText === null) return;
    const resultSummary = window.prompt('Result summary', 'Training run completed and evaluation metrics were attached.');
    if (resultSummary === null) return;
    const validationScore = Number(scoreText);
    const regressionRate = Number(regressionText);
    const blockedIssueCount = Number(blockedText);
    if (!Number.isFinite(validationScore) || !Number.isFinite(regressionRate) || !Number.isFinite(blockedIssueCount)) {
      setError('Training result needs valid numeric values.');
      return;
    }
    setRecordingTrainingRunId(runId);
    setError(undefined);
    try {
      await recordTrainingRunResult(runId, {
        validationScore,
        regressionRate,
        blockedIssueCount,
        rollbackRequired: rollbackText.trim().toLowerCase().startsWith('y'),
        resultSummary,
      });
      await refreshList(selectedTraceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRecordingTrainingRunId(undefined);
    }
  }

  async function handleSyncTrainingProviderStatus(runId: string) {
    const run = trainingRuns.find((item) => item.id === runId);
    const defaultEndpoint = run?.providerLaunches?.[0]?.endpoint ?? '';
    const endpoint = window.prompt('Provider status endpoint，留空则手动记录状态', defaultEndpoint);
    if (endpoint === null) return;
    setSyncingProviderRunId(runId);
    setError(undefined);
    try {
      if (endpoint.trim()) {
        await syncTrainingProviderStatus(runId, {
          endpoint,
          externalRunId: run?.externalRunId,
          method: 'GET',
        });
      } else {
        const statusText = window.prompt('Provider status', run?.lastProviderStatus ?? 'running');
        const providerStatus = normalizeProviderStatusInput(statusText);
        if (!providerStatus) {
          setError('Provider status 需要是 queued/running/succeeded/failed/cancelled/unknown。');
          return;
        }
        await recordTrainingProviderStatus(runId, {
          providerStatus,
          externalRunId: run?.externalRunId,
          note: `Manually recorded provider status ${providerStatus}.`,
        });
      }
      await refreshList(selectedTraceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSyncingProviderRunId(undefined);
    }
  }

  async function handleRunTrainingEval(runId: string) {
    const note = window.prompt('Eval runner note', 'Run TraceOps local eval runner from the attached launch plan.');
    if (note === null) return;
    setRunningEvalRunId(runId);
    setError(undefined);
    try {
      await runTrainingEval(runId, note);
      await refreshList(selectedTraceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunningEvalRunId(undefined);
    }
  }

  async function handleCreateModelReleaseGate(runId: string) {
    const note = window.prompt('Model release gate note', 'Create model release gate from passed training run.');
    if (note === null) return;
    setCreatingModelGateRunId(runId);
    setError(undefined);
    try {
      await createModelReleaseGate(runId, note);
      await refreshList(selectedTraceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreatingModelGateRunId(undefined);
    }
  }

  async function handleModelReleaseGateDecision(gateId: string, decision: DatasetModelReleaseGateDecision) {
    const note = window.prompt(modelReleaseGateDecisionLabel(decision), modelReleaseGateDefaultNote(decision));
    if (note === null) return;
    setDecidingModelGateKey(`${gateId}:${decision}`);
    setError(undefined);
    try {
      await recordModelReleaseGateDecision(gateId, { decision, note });
      await refreshList(selectedTraceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setDecidingModelGateKey(undefined);
    }
  }

  async function handleCreateDeploymentHandoff(gateId: string) {
    const deploymentOwner = window.prompt('Deployment owner', 'deployment-owner');
    if (deploymentOwner === null) return;
    const environment = window.prompt('Environment', 'production-canary');
    if (environment === null) return;
    const rolloutStrategy = window.prompt('Rollout strategy', '5% canary for 30 minutes, then 25%, 50%, 100% if online monitors stay green.');
    if (rolloutStrategy === null) return;
    setCreatingDeploymentGateId(gateId);
    setError(undefined);
    try {
      await createDeploymentHandoff(gateId, {
        deploymentOwner,
        environment,
        rolloutStrategy,
        note: 'Deployment handoff created from approved model release gate.',
      });
      await refreshList(selectedTraceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreatingDeploymentGateId(undefined);
    }
  }

  async function handleDeploymentStatus(handoffId: string, status: DatasetDeploymentHandoffStatus) {
    const note = window.prompt(deploymentHandoffStatusLabel(status), deploymentHandoffDefaultNote(status));
    if (note === null) return;
    setUpdatingDeploymentKey(`${handoffId}:${status}`);
    setError(undefined);
    try {
      await updateDeploymentHandoffStatus(handoffId, { status, note });
      await refreshList(selectedTraceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setUpdatingDeploymentKey(undefined);
    }
  }

  async function handleCreatePostReleaseMonitor(deploymentHandoffId: string) {
    const monitorOwner = window.prompt('Monitor owner', 'monitor-owner');
    if (monitorOwner === null) return;
    setCreatingPostMonitorDeploymentId(deploymentHandoffId);
    setError(undefined);
    try {
      await createPostReleaseMonitor(deploymentHandoffId, {
        monitorOwner,
        note: 'Post-release monitor created from live deployment handoff.',
      });
      await refreshList(selectedTraceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreatingPostMonitorDeploymentId(undefined);
    }
  }

  async function handleRecordPostReleaseSignal(monitorId: string, mode: 'healthy' | 'attention' | 'rollback' | 'close' = 'healthy') {
    if (mode === 'close') {
      setRecordingPostMonitorId(monitorId);
      setError(undefined);
      try {
        await recordPostReleaseSignal(monitorId, {
          status: 'closed',
          note: 'Post-release monitoring window closed.',
        });
        await refreshList(selectedTraceId);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setRecordingPostMonitorId(undefined);
      }
      return;
    }
    const defaults = mode === 'rollback'
      ? ['0.81', '0.08', '4200', '0.09', '0.18', 'yes']
      : mode === 'attention'
        ? ['0.89', '0.035', '2900', '0.04', '0.1', 'no']
        : ['0.96', '0.01', '1800', '0.01', '0.03', 'no'];
    const successText = window.prompt('Task success rate, 0-1', defaults[0]);
    if (successText === null) return;
    const regressionText = window.prompt('Regression alert rate, 0-1', defaults[1]);
    if (regressionText === null) return;
    const latencyText = window.prompt('P95 latency ms', defaults[2]);
    if (latencyText === null) return;
    const toolErrorText = window.prompt('Tool error rate, 0-1', defaults[3]);
    if (toolErrorText === null) return;
    const interventionText = window.prompt('Manual intervention rate, 0-1', defaults[4]);
    if (interventionText === null) return;
    const rollbackText = window.prompt('Rollback signal? yes/no', defaults[5]);
    if (rollbackText === null) return;
    const alertNote = window.prompt('Online signal note', mode === 'rollback' ? 'Rollback signal reported by online monitoring.' : 'Online metrics written back to TraceOps.');
    if (alertNote === null) return;
    const taskSuccessRate = Number(successText);
    const regressionAlertRate = Number(regressionText);
    const p95LatencyMs = Number(latencyText);
    const toolErrorRate = Number(toolErrorText);
    const manualInterventionRate = Number(interventionText);
    if (![taskSuccessRate, regressionAlertRate, p95LatencyMs, toolErrorRate, manualInterventionRate].every(Number.isFinite)) {
      setError('Post-release signal needs valid numeric values.');
      return;
    }
    setRecordingPostMonitorId(monitorId);
    setError(undefined);
    try {
      await recordPostReleaseSignal(monitorId, {
        taskSuccessRate,
        regressionAlertRate,
        p95LatencyMs,
        toolErrorRate,
        manualInterventionRate,
        rollbackSignal: rollbackText.trim().toLowerCase().startsWith('y'),
        alertNote,
        note: alertNote,
      });
      await refreshList(selectedTraceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRecordingPostMonitorId(undefined);
    }
  }

  async function handleCreateFeedbackLoop(monitorId: string) {
    const note = window.prompt('Feedback loop note', 'Create next dataset candidate from post-release monitor.');
    if (note === null) return;
    setCreatingFeedbackMonitorId(monitorId);
    setError(undefined);
    try {
      await createFeedbackLoop(monitorId, note);
      await refreshList(selectedTraceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreatingFeedbackMonitorId(undefined);
    }
  }

  async function handleFeedbackLoopDecision(loopId: string, decision: DatasetFeedbackLoopDecision) {
    const note = window.prompt(feedbackLoopDecisionLabel(decision), feedbackLoopDefaultNote(decision));
    if (note === null) return;
    setDecidingFeedbackKey(`${loopId}:${decision}`);
    setError(undefined);
    try {
      await recordFeedbackLoopDecision(loopId, { decision, note });
      await refreshList(selectedTraceId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setDecidingFeedbackKey(undefined);
    }
  }

  async function handleCreateFeedbackDatasetVersion() {
    if (feedbackLoopsReadyForDataset.length === 0) return;
    const defaultName = `KodaX closed-loop dataset ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`;
    const name = window.prompt('Closed-loop dataset version name', defaultName);
    if (name === null) return;
    setCreatingFeedbackDatasetVersion(true);
    setError(undefined);
    try {
      const version = await createFeedbackDatasetVersion({
        name,
        feedbackLoopIds: feedbackLoopsReadyForDataset.map((loop) => loop.id),
        notes: `Created from ${feedbackLoopsReadyForDataset.length} promoted feedback loop(s).`,
      });
      await refreshList(selectedTraceId);
      setSelectedDatasetVersionId(version.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreatingFeedbackDatasetVersion(false);
    }
  }

  async function handlePrepareClosedLoopRetrainingHandoff(datasetVersionId: string) {
    const trainingOwner = window.prompt('Closed-loop training owner', 'closed-loop-owner');
    if (trainingOwner === null) return;
    const note = window.prompt('Closed-loop handoff note', 'Accept closed-loop diff, generate manifest, and prepare retraining handoff.');
    if (note === null) return;
    setPreparingClosedLoopDatasetId(datasetVersionId);
    setError(undefined);
    try {
      const result = await prepareClosedLoopRetrainingHandoff(datasetVersionId, {
        trainingOwner,
        targetSystem: 'closed-loop-training',
        note,
      });
      await refreshList(selectedTraceId);
      setSelectedDatasetVersionId(result.plan.datasetVersionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPreparingClosedLoopDatasetId(undefined);
    }
  }

  async function handleRunClosedLoopTrainingCycle(datasetVersionId: string) {
    const plan = closedLoopRetrainingPlans.find((item) => item.datasetVersionId === datasetVersionId);
    const owner = window.prompt('Closed-loop candidate owner', plan?.retrainingHandoff?.trainingOwner ?? 'closed-loop-owner');
    if (owner === null) return;
    const defaultModel = plan?.trainingRun?.modelName
      ?? (plan?.format === 'eval_jsonl'
        ? 'kodax-agent-eval-candidate'
        : plan?.format === 'repair_jsonl'
          ? 'kodax-agent-repair-candidate'
          : 'kodax-agent-closed-loop-candidate');
    const modelName = window.prompt('Closed-loop candidate model', defaultModel);
    if (modelName === null) return;
    const note = window.prompt('Closed-loop candidate cycle note', 'Run training, attach TraceOps eval evidence, and create model release gate.');
    if (note === null) return;
    setRunningClosedLoopDatasetId(datasetVersionId);
    setError(undefined);
    try {
      const result = await runClosedLoopCandidateCycle(datasetVersionId, {
        owner,
        targetSystem: 'closed-loop-training',
        modelName,
        note,
      });
      await refreshList(selectedTraceId);
      setSelectedDatasetVersionId(result.plan.datasetVersionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunningClosedLoopDatasetId(undefined);
    }
  }

  async function handleCreateClosedLoopModelGate(datasetVersionId: string) {
    const plan = closedLoopRetrainingPlans.find((item) => item.datasetVersionId === datasetVersionId);
    const owner = window.prompt('Closed-loop release owner', plan?.retrainingHandoff?.trainingOwner ?? 'closed-loop-owner');
    if (owner === null) return;
    const note = window.prompt('Closed-loop model gate note', 'Create model release gate from closed-loop training and TraceOps eval evidence.');
    if (note === null) return;
    setCreatingClosedLoopModelGateDatasetId(datasetVersionId);
    setError(undefined);
    try {
      const result = await prepareClosedLoopModelReleaseGate(datasetVersionId, {
        owner,
        targetSystem: plan?.retrainingHandoff?.targetSystem ?? 'closed-loop-training',
        modelName: plan?.trainingRun?.modelName,
        note,
      });
      await refreshList(selectedTraceId);
      setSelectedDatasetVersionId(result.plan.datasetVersionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreatingClosedLoopModelGateDatasetId(undefined);
    }
  }

  async function handleApproveClosedLoopDeploymentHandoff(datasetVersionId: string) {
    const plan = closedLoopRetrainingPlans.find((item) => item.datasetVersionId === datasetVersionId);
    const decisionNote = window.prompt('Closed-loop model approval note', 'Model gate approved for deployment handoff.');
    if (decisionNote === null) return;
    const deploymentOwner = window.prompt('Closed-loop deployment owner', plan?.deploymentHandoff?.deploymentOwner ?? 'closed-loop-deployment-owner');
    if (deploymentOwner === null) return;
    const environment = window.prompt('Deployment environment', plan?.deploymentHandoff?.environment ?? 'production-canary');
    if (environment === null) return;
    const rolloutStrategy = window.prompt('Rollout strategy', '5% canary for 30 minutes, then 25%, 50%, 100% if monitors stay green.');
    if (rolloutStrategy === null) return;
    setCreatingClosedLoopDeploymentDatasetId(datasetVersionId);
    setError(undefined);
    try {
      const result = await approveClosedLoopDeploymentHandoff(datasetVersionId, {
        decisionNote,
        deploymentOwner,
        environment,
        rolloutStrategy,
        note: 'Approved model gate and created closed-loop deployment handoff.',
      });
      await refreshList(selectedTraceId);
      setSelectedDatasetVersionId(result.plan.datasetVersionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreatingClosedLoopDeploymentDatasetId(undefined);
    }
  }

  async function handleCreateClosedLoopDeploymentHandoff(datasetVersionId: string) {
    const plan = closedLoopRetrainingPlans.find((item) => item.datasetVersionId === datasetVersionId);
    const deploymentOwner = window.prompt('Closed-loop deployment owner', plan?.modelReleaseGate?.status === 'approved' ? 'closed-loop-deployment-owner' : 'deployment-owner');
    if (deploymentOwner === null) return;
    const environment = window.prompt('Deployment environment', 'production-canary');
    if (environment === null) return;
    const rolloutStrategy = window.prompt('Rollout strategy', '5% canary for 30 minutes, then 25%, 50%, 100% if monitors stay green.');
    if (rolloutStrategy === null) return;
    setCreatingClosedLoopDeploymentDatasetId(datasetVersionId);
    setError(undefined);
    try {
      const result = await prepareClosedLoopDeploymentHandoff(datasetVersionId, {
        deploymentOwner,
        environment,
        rolloutStrategy,
        note: 'Create deployment handoff from approved closed-loop model release gate.',
      });
      await refreshList(selectedTraceId);
      setSelectedDatasetVersionId(result.plan.datasetVersionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreatingClosedLoopDeploymentDatasetId(undefined);
    }
  }

  async function handleRunClosedLoopRollout(datasetVersionId: string) {
    const plan = closedLoopRetrainingPlans.find((item) => item.datasetVersionId === datasetVersionId);
    const ownerDefault = plan?.deploymentHandoff?.deploymentOwner
      ?? plan?.postReleaseMonitor?.monitorOwner
      ?? 'closed-loop-rollout-owner';
    const owner = window.prompt('Closed-loop rollout / monitor owner', ownerDefault);
    if (owner === null) return;
    const note = window.prompt(
      'Closed-loop rollout note',
      plan?.deploymentHandoff?.status === 'live'
        ? 'Create post-release monitor for this closed-loop deployment.'
        : 'Advance closed-loop deployment to live and attach post-release monitoring.',
    );
    if (note === null) return;
    setRollingOutClosedLoopDatasetId(datasetVersionId);
    setError(undefined);
    try {
      const result = await runClosedLoopRollout(datasetVersionId, {
        deploymentOwner: owner,
        monitorOwner: owner,
        environment: plan?.deploymentHandoff?.environment ?? 'production-canary',
        rolloutStrategy: '5% canary for 30 minutes, then 25%, 50%, 100% if monitors stay green.',
        note,
      });
      await refreshList(selectedTraceId);
      setSelectedDatasetVersionId(result.plan.datasetVersionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRollingOutClosedLoopDatasetId(undefined);
    }
  }

  async function handleWriteClosedLoopFeedbackSignal(datasetVersionId: string) {
    const plan = closedLoopRetrainingPlans.find((item) => item.datasetVersionId === datasetVersionId);
    const modeText = window.prompt('Closed-loop signal mode: healthy / attention / rollback', plan?.postReleaseMonitor?.status === 'rollback_required' ? 'rollback' : 'attention');
    if (modeText === null) return;
    const mode = modeText.trim().toLowerCase() as DatasetClosedLoopFeedbackSignalMode;
    if (mode !== 'healthy' && mode !== 'attention' && mode !== 'rollback') {
      setError('Closed-loop signal mode must be healthy, attention, or rollback.');
      return;
    }
    const note = window.prompt(
      'Closed-loop signal note',
      mode === 'healthy'
        ? 'Healthy online signal written back to TraceOps monitor.'
        : mode === 'rollback'
          ? 'Rollback signal written back and converted to feedback loop.'
          : 'Attention signal written back and converted to feedback loop.',
    );
    if (note === null) return;
    setWritingClosedLoopFeedbackDatasetId(datasetVersionId);
    setError(undefined);
    try {
      const result = await writeClosedLoopFeedbackSignal(datasetVersionId, {
        mode,
        note,
        alertNote: note,
      });
      await refreshList(selectedTraceId);
      setSelectedDatasetVersionId(result.plan.datasetVersionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setWritingClosedLoopFeedbackDatasetId(undefined);
    }
  }

  async function handleBuildClosedLoopNextDataset(datasetVersionId: string) {
    const plan = closedLoopRetrainingPlans.find((item) => item.datasetVersionId === datasetVersionId);
    const defaultName = `KodaX next-loop ${plan?.downstreamFeedbackLoop?.targetKind ?? 'feedback'} ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`;
    const name = window.prompt('Next closed-loop dataset name', defaultName);
    if (name === null) return;
    const owner = window.prompt('Next closed-loop training owner', 'closed-loop-owner');
    if (owner === null) return;
    const notes = window.prompt('Next dataset note', 'Promote feedback, build next closed-loop dataset, and prepare retraining handoff.');
    if (notes === null) return;
    setBuildingClosedLoopNextDatasetId(datasetVersionId);
    setError(undefined);
    try {
      const result = await buildClosedLoopNextDataset(datasetVersionId, {
        name,
        notes,
        trainingOwner: owner,
        targetSystem: 'closed-loop-training',
      });
      await refreshList(selectedTraceId);
      setSelectedDatasetVersionId(result.datasetVersion.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBuildingClosedLoopNextDatasetId(undefined);
    }
  }

  async function handleDatasetDiffReview(decision: DatasetVersionDiffReviewDecision) {
    if (!datasetVersionDiff) return;
    const note = window.prompt(datasetDiffReviewDecisionLabel(decision), datasetDiffReviewDefaultNote(decision));
    if (note === null) return;
    setReviewingDiffDecision(decision);
    setError(undefined);
    try {
      const updated = await recordDatasetVersionDiffReview(datasetVersionDiff.headVersionId, {
        baseVersionId: datasetVersionDiff.baseVersionId,
        decision,
        note,
      });
      setDatasetVersionDiff(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setReviewingDiffDecision(undefined);
    }
  }

  async function handleApplyDatasetDiffReviewPlan() {
    if (!datasetVersionDiff || !datasetDiffReviewPlan) return;
    const note = window.prompt(
      datasetDiffReviewDecisionLabel(datasetDiffReviewPlan.recommendedDecision),
      datasetDiffReviewPlan.recommendation,
    );
    if (note === null) return;
    setApplyingDiffReviewPlan(true);
    setError(undefined);
    try {
      const result = await applyDatasetVersionDiffReviewPlan(datasetVersionDiff.headVersionId, {
        baseVersionId: datasetVersionDiff.baseVersionId,
        decision: datasetDiffReviewPlan.recommendedDecision,
        note,
        acknowledgeWarnings: true,
        createManifest: true,
      });
      setDatasetVersionDiff(result.diff);
      setDatasetDiffReviewPlan(result.plan);
      await refreshList(selectedTraceId);
      setSelectedDatasetVersionId(result.diff.headVersionId);
      setDiffBaseVersionId(result.diff.baseVersionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setApplyingDiffReviewPlan(false);
    }
  }

  async function handleCreateDatasetVersion() {
    setCreatingDatasetVersion(true);
    setError(undefined);
    try {
      if (fineTuneCandidateIds.length === 0) return;
      const version = await createDatasetVersion({
        sampleIds: fineTuneCandidateIds,
        format: 'fine_tune_jsonl',
        name: `KodaX SFT train set ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`,
      });
      await refreshList(selectedTraceId);
      setSelectedDatasetVersionId(version.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreatingDatasetVersion(false);
    }
  }

  async function handleCreateKindDatasetVersion(input: { kind: DatasetBuilderKind; sampleIds: string[]; format: DatasetExportFormat }) {
    setCreatingDatasetVersion(true);
    setError(undefined);
    try {
      if (input.sampleIds.length === 0) return;
      const version = await createDatasetVersion({
        sampleIds: input.sampleIds,
        format: input.format,
        name: `KodaX ${sampleKindLabel(input.kind)} set ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`,
        notes: `Created from Dataset Builder kind=${input.kind}`,
      });
      await refreshList(selectedTraceId);
      setSelectedDatasetVersionId(version.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCreatingDatasetVersion(false);
    }
  }

  async function handleCreateHarnessSnapshot() {
    const name = window.prompt('Harness name', harnessSnapshots.length === 0 ? 'KodaX baseline Harness' : 'KodaX candidate Harness');
    if (!name) return;
    const version = window.prompt('Harness version', harnessSnapshots.length === 0 ? 'h0' : `h${harnessSnapshots.length}`);
    if (!version) return;
    const defaultParent = harnessSnapshots[0]?.id ?? '';
    const parentId = window.prompt('Parent Harness ID（baseline留空）', defaultParent);
    if (parentId === null) return;
    const commit = window.prompt('Git commit / config revision', 'local-working-tree');
    if (commit === null) return;
    const changeSummary = window.prompt('Change objective', parentId ? 'Improve the target capability discovered from real sessions.' : 'Current production baseline.');
    if (changeSummary === null) return;
    setAgentEvaluationBusyKey('harness');
    setError(undefined);
    try {
      await createHarnessSnapshot({
        name,
        version,
        parentId: parentId.trim() || undefined,
        status: parentId.trim() ? 'candidate' : 'active',
        source: { commit: commit.trim() || undefined },
        components: {
          promptHash: `revision:${commit.trim() || version}:prompt`,
          contextPolicyHash: `revision:${commit.trim() || version}:context`,
          skillManifestHash: `revision:${commit.trim() || version}:skills`,
        },
        compatibleModels: Array.from(new Set(traceList.traces.map((trace) => trace.runtime.model).filter((item): item is string => Boolean(item)))),
        changeSummary,
        sourceTraceIds: selectedTraceId ? [selectedTraceId] : [],
      });
      await refreshList(selectedTraceId);
      setNotice(`Harness ${version} 已登记。`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setAgentEvaluationBusyKey(undefined);
    }
  }

  async function handleCreateAgentEvaluationIssue() {
    const title = window.prompt('Evaluation issue', detail?.trace.title ? `${detail.trace.title}：目标能力改进` : 'KodaX target capability issue');
    if (!title) return;
    const description = window.prompt('Observed failure and expected improvement', 'Describe the repeated failure observed in real sessions and the expected Harness improvement.');
    if (description === null) return;
    const categoryInput = window.prompt('Category: context / skill / memory / tool_use / planning / verification / runtime', 'verification');
    if (categoryInput === null) return;
    const allowed = ['context', 'skill', 'memory', 'tool_use', 'planning', 'verification', 'runtime'] as const;
    const category = allowed.find((item) => item === categoryInput) ?? 'other';
    setAgentEvaluationBusyKey('issue');
    setError(undefined);
    try {
      await createAgentEvaluationIssue({
        title,
        description,
        category,
        sourceTraceIds: selectedTraceId ? [selectedTraceId] : [],
        scopeTags: detail?.trace.projectKey ? [detail.trace.projectKey, 'kodax'] : ['kodax'],
        primaryMetricId: 'task_success',
      });
      await refreshList(selectedTraceId);
      setNotice('Evaluation Issue 已创建。');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setAgentEvaluationBusyKey(undefined);
    }
  }

  async function handleCreateAgentBenchmarkCase() {
    const defaultTraceId = selectedTraceId ?? traceList.traces[0]?.id;
    const traceId = window.prompt('Validation source Trace ID', defaultTraceId ?? '');
    if (!traceId) return;
    const title = window.prompt('Validation case title', traceList.traces.find((trace) => trace.id === traceId)?.title ?? 'KodaX validation task');
    if (title === null) return;
    const critical = window.confirm('是否将此任务标记为关键能力 Case？');
    setAgentEvaluationBusyKey('case');
    setError(undefined);
    try {
      await createAgentBenchmarkCaseFromTrace(traceId, {
        title: title.trim() || undefined,
        usage: 'validation',
        taskType: 'kodax-task',
        critical,
      });
      await refreshList(selectedTraceId);
      setNotice('Validation Case 已从 Clean Trace 创建。');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setAgentEvaluationBusyKey(undefined);
    }
  }

  async function handleCreateAgentBenchmarkSuite(issueId: string) {
    const issue = agentEvaluationIssues.find((item) => item.id === issueId);
    const available = agentBenchmarkCases.filter((item) => item.usage === 'validation' && item.status === 'ready');
    if (available.length === 0) return;
    const name = window.prompt('Frozen Validation Suite name', `${issue?.title ?? 'Harness validation'} v1`);
    if (!name) return;
    setAgentEvaluationBusyKey(issueId);
    setError(undefined);
    try {
      await createAgentBenchmarkSuite({
        name,
        issueId,
        caseIds: available.map((item) => item.id),
        version: 'v1',
        freeze: true,
      });
      await refreshList(selectedTraceId);
      setNotice(`已冻结 ${available.length} 个 Validation Cases。`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setAgentEvaluationBusyKey(undefined);
    }
  }

  async function handleCreateAgentEvaluationExperiment() {
    const suite = agentBenchmarkSuites.find((item) => item.status === 'frozen');
    if (!suite) return;
    const issue = agentEvaluationIssues.find((item) => item.id === suite.issueId);
    const candidate = harnessSnapshots.find((item) => item.parentId) ?? harnessSnapshots[0];
    const baseline = harnessSnapshots.find((item) => item.id === candidate?.parentId) ?? harnessSnapshots.find((item) => item.id !== candidate?.id);
    if (!issue || !candidate || !baseline) return;
    const model = window.prompt('Fixed model', detail?.trace.runtime.model ?? candidate.compatibleModels[0] ?? 'kodax-model');
    if (!model) return;
    const provider = window.prompt('Model provider', detail?.trace.runtime.provider ?? 'configured-provider');
    if (!provider) return;
    setAgentEvaluationBusyKey('experiment');
    setError(undefined);
    try {
      await createAgentEvaluationExperiment({
        issueId: issue.id,
        benchmarkSuiteId: suite.id,
        modelSnapshot: { provider, model },
        baselineHarnessId: baseline.id,
        candidateHarnessId: candidate.id,
        runtimeSnapshotHash: detail?.trace.latestSourceHash ?? 'runtime:fixed-local',
        repetitions: 1,
      });
      await refreshList(selectedTraceId);
      setNotice('H0/H1 Experiment 已创建。');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setAgentEvaluationBusyKey(undefined);
    }
  }

  async function handleStartAgentEvaluationExperiment(id: string) {
    setAgentEvaluationBusyKey(id);
    setError(undefined);
    try {
      await startAgentEvaluationExperiment(id);
      await refreshList(selectedTraceId);
      setNotice('Experiment 已开始，可以导入成对 Rollout。');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setAgentEvaluationBusyKey(undefined);
    }
  }

  async function handleImportAgentEvaluationPair(experiment: AgentEvaluationExperiment) {
    const suite = agentBenchmarkSuites.find((item) => item.id === experiment.benchmarkSuiteId);
    if (!suite) return;
    const baselineStatusInput = window.prompt('H0 result for these cases: passed / failed / error', 'failed');
    if (!baselineStatusInput) return;
    const candidateStatusInput = window.prompt('H1 result for these cases: passed / failed / error', 'passed');
    if (!candidateStatusInput) return;
    const allowed = ['passed', 'failed', 'error'] as const;
    const baselineStatus = allowed.find((item) => item === baselineStatusInput);
    const candidateStatus = allowed.find((item) => item === candidateStatusInput);
    if (!baselineStatus || !candidateStatus) {
      setError('Rollout status 必须是 passed、failed 或 error。');
      return;
    }
    const baselineTokens = Number(window.prompt('H0 average token usage', '1000') ?? '1000');
    const candidateTokens = Number(window.prompt('H1 average token usage', '950') ?? '950');
    setAgentEvaluationBusyKey(experiment.id);
    setError(undefined);
    try {
      for (const caseId of suite.caseIds) {
        for (let repetition = 1; repetition <= experiment.repetitions; repetition += 1) {
          await recordAgentEvaluationRollout(experiment.id, {
            arm: 'baseline',
            caseId,
            repetition,
            status: baselineStatus,
            metrics: [
              { metricId: 'artifact_verified', value: baselineStatus === 'passed' ? 1 : 0 },
              { metricId: 'evidence_complete', value: baselineStatus === 'passed' ? 1 : 0 },
              { metricId: 'runtime_error', value: baselineStatus === 'error' ? 1 : 0 },
              { metricId: 'token_usage', value: Number.isFinite(baselineTokens) ? baselineTokens : 1000 },
            ],
          });
          await recordAgentEvaluationRollout(experiment.id, {
            arm: 'candidate',
            caseId,
            repetition,
            status: candidateStatus,
            metrics: [
              { metricId: 'artifact_verified', value: candidateStatus === 'passed' ? 1 : 0 },
              { metricId: 'evidence_complete', value: candidateStatus === 'passed' ? 1 : 0 },
              { metricId: 'runtime_error', value: candidateStatus === 'error' ? 1 : 0 },
              { metricId: 'token_usage', value: Number.isFinite(candidateTokens) ? candidateTokens : 950 },
            ],
          });
        }
      }
      await refreshList(selectedTraceId);
      setNotice(`已导入 ${suite.caseIds.length * experiment.repetitions * 2} 条成对 Rollout。`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setAgentEvaluationBusyKey(undefined);
    }
  }

  async function handleCompleteAgentEvaluationExperiment(id: string) {
    setAgentEvaluationBusyKey(id);
    setError(undefined);
    try {
      const report = await completeAgentEvaluationExperiment(id);
      await refreshList(selectedTraceId);
      setNotice(`Agent Evaluation 完成：${report.verdict}。`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setAgentEvaluationBusyKey(undefined);
    }
  }

  useEffect(() => {
    refreshList().catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, [params.toString()]);

  useEffect(() => {
    if (!selectedTraceId) {
      setDetail(undefined);
      return;
    }
    setLoadingDetail(true);
    getTrace(selectedTraceId)
      .then(setDetail)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoadingDetail(false));
  }, [selectedTraceId]);

  useEffect(() => {
    if (!selectedDatasetVersionId) {
      setDatasetVersionSamples([]);
      setLoadingDatasetVersionSamples(false);
      return;
    }
    const version = datasetVersions.find((item) => item.id === selectedDatasetVersionId);
    if (version?.sampleSnapshots) {
      setDatasetVersionSamples(version.sampleSnapshots);
      setLoadingDatasetVersionSamples(false);
      return;
    }

    let cancelled = false;
    setDatasetVersionSamples([]);
    setLoadingDatasetVersionSamples(true);
    listDatasetVersionSamples(selectedDatasetVersionId)
      .then((samples) => {
        if (!cancelled) setDatasetVersionSamples(samples);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoadingDatasetVersionSamples(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedDatasetVersionId, datasetVersions]);

  useEffect(() => {
    if (!selectedDatasetVersionId || datasetVersions.length < 2) {
      setDatasetVersionDiff(undefined);
      setDatasetDiffReviewPlan(undefined);
      setDiffBaseVersionId(undefined);
      setLoadingDatasetVersionDiff(false);
      return;
    }

    const selectedExists = datasetVersions.some((version) => version.id === selectedDatasetVersionId);
    if (!selectedExists) {
      setDatasetVersionDiff(undefined);
      setDatasetDiffReviewPlan(undefined);
      setLoadingDatasetVersionDiff(false);
      return;
    }

    const validBase = diffBaseVersionId
      && diffBaseVersionId !== selectedDatasetVersionId
      && datasetVersions.some((version) => version.id === diffBaseVersionId);
    const fallbackBaseId = datasetVersions.find((version) => version.id !== selectedDatasetVersionId)?.id;
    const baseId = validBase ? diffBaseVersionId : fallbackBaseId;
    if (!baseId) {
      setDatasetVersionDiff(undefined);
      setDatasetDiffReviewPlan(undefined);
      setLoadingDatasetVersionDiff(false);
      return;
    }
    if (baseId !== diffBaseVersionId) setDiffBaseVersionId(baseId);

    let cancelled = false;
    setLoadingDatasetVersionDiff(true);
    Promise.all([
      getDatasetVersionDiff(selectedDatasetVersionId, baseId),
      getDatasetVersionDiffReviewPlan(selectedDatasetVersionId, baseId),
    ])
      .then(([diff, plan]) => {
        if (!cancelled) {
          setDatasetVersionDiff(diff);
          setDatasetDiffReviewPlan(plan);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setDatasetVersionDiff(undefined);
          setDatasetDiffReviewPlan(undefined);
          setError(err instanceof Error ? err.message : String(err));
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingDatasetVersionDiff(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedDatasetVersionId, diffBaseVersionId, datasetVersions]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <div className="product-mark">
            <Server size={21} />
            TraceOps
          </div>
          <h1>TraceOps v{platformArchitecture?.currentVersion ?? '0.1.0'} · Trace Data Foundation</h1>
          <p>当前正式范围只建设 Session 接入、Trace 预处理与评测数据整理；评测和模型后训练分别进入 v0.2.0 与 v0.3.0。</p>
        </div>
        <div className="top-actions">
          <span className="pill muted-pill"><Clock3 size={14} /> {formatDate(source?.lastSyncAt)}</span>
          <button className="secondary-button" onClick={() => refreshList()}><RefreshCw size={16} /> Refresh</button>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          <ShieldAlert size={18} />
          {error}
        </div>
      )}
      {notice && (
        <div className="notice-banner">
          <CheckCircle2 size={18} />
          {notice}
        </div>
      )}

      {!activePipelineStage && (
        <PlatformArchitectureOverviewPanel
          architecture={platformArchitecture}
          onOpenStage={openPipelineStage}
        />
      )}

      {activePipelineStage && (
      <>
      <PipelineModulePageHeader
        activeStage={activePipelineStage}
        onHome={goPipelineHome}
        onOpenStage={openPipelineStage}
      />

      <ProductReleaseScopeBanner
        architecture={platformArchitecture}
        areaId={activePipelineStage.areaId}
      />

      {activePipelineStageId === 'stage-ingest' && (
      <PipelineStageSection
        id="stage-ingest"
        lockedOpen
        hideHeader
        activeStageId={activePipelineStageId}
        index="D1"
        title="Session 接入"
        detail="从本机 KodaX sessions 拉取完整运行记录，并把同步异常交给质量治理处理。"
        summary={`${traceList.totals.total} sessions · ${ingestQualityQueue.summary.openOccurrences} open issues`}
      >
        <SourceStrip
          source={source}
          syncing={syncing}
          onSync={() => runSync('manual')}
          onRetry={() => runSync('retry')}
          onToggleWatch={toggleWatch}
        />

        <div className="pipeline-two-column">
          <IngestQualityQueuePanel
            queue={ingestQualityQueue}
            triagingIssueId={triagingIssueId}
            resolvingFixedDiagnostics={resolvingFixedDiagnostics}
            onTriageIssue={handleTriageQualityIssue}
            onResolveFixedKodaXDiagnostics={handleResolveFixedKodaXDiagnostics}
          />

          <IngestQualityPolicyRunsPanel runs={ingestQualityPolicyRuns} />
        </div>

        <IngestQualityPolicyPanel
          source={source}
          policy={ingestQualityPolicy}
          policyRuns={ingestQualityPolicyRuns}
          dryRun={policyDryRun}
          savingPolicyKey={savingPolicyKey}
          applyingPolicy={applyingPolicy}
          dryRunningPolicyKey={dryRunningPolicyKey}
          selectedRuleIds={selectedPolicyRuleIds}
          batchPublishingPolicy={batchPublishingPolicy}
          installingPolicyDefaults={installingPolicyDefaults}
          savingRecommendations={savingPolicyKey === '__recommendations__'}
          decidingRecommendationKey={decidingRecommendationKey}
          togglingAutoApply={togglingPolicyAutoApply}
          onCreateRecommendation={handleCreatePolicyRecommendation}
          onCreateRecommendations={handleCreatePolicyRecommendations}
          onDismissRecommendations={handleDismissPolicyRecommendations}
          onRestoreRecommendation={handleRestorePolicyRecommendation}
          onUpdateRule={handleUpdatePolicyRule}
          onDryRunRule={handleDryRunPolicy}
          onToggleRuleSelection={handleTogglePolicyRuleSelection}
          onSelectDraftRules={handleSelectDraftPolicyRules}
          onClearRuleSelection={handleClearPolicyRuleSelection}
          onBatchGoLiveRules={handleBatchGoLivePolicyRules}
          onInstallDefaultRules={handleInstallDefaultPolicyRules}
          onToggleAutoApply={handleTogglePolicyAutoApply}
          onApplyPolicy={handleApplyPolicy}
        />

        <JobsPanel
          jobs={jobs}
          focusedEntity={focusedTaskEntity}
          triagingDiagnosticId={triagingDiagnosticId}
          onTriageDiagnostic={handleTriageDiagnostic}
        />
      </PipelineStageSection>
      )}

      {activePipelineStageId === 'stage-raw' && (
      <PipelineStageSection
        id="stage-raw"
        lockedOpen
        hideHeader
        activeStageId={activePipelineStageId}
        index="D2"
        title="Trace 与 Evidence"
        detail="把 session 还原成 Raw Trace、事件时间线、实体关系和 evidence 链路。"
        summary={`${traceList.totals.imported + traceList.totals.updated} traces · ${sampleList.samples.filter((sample) => sample.evidenceCount > 0).length} evidenced samples`}
      >
        <CommandPalettePanel items={commandItems} onOpen={handleOpenCommandItem} />
        <EntityInspectorPanel
          state={entityInspectorState}
          onOpenItem={handleOpenCommandItem}
          onOpenEntity={handleOpenTaskEntity}
          onOpenTask={(id) => {
            setFocusedTaskEntity(undefined);
            setSelectedTaskId(id);
          }}
          onClose={() => {
            setFocusedTaskEntity(undefined);
            setSelectedTaskId(undefined);
          }}
        />
        <LineageMapPanel
          state={lineageMapState}
          creatingAuditTaskActionId={creatingAuditTaskActionId}
          queuedAuditActionIds={queuedAuditActionIds}
          onOpenEntity={handleOpenTaskEntity}
          onOpenTask={(id) => {
            setFocusedTaskEntity(undefined);
            setSelectedTaskId(id);
          }}
          onCreateTasks={handleCreateAuditActionTasks}
        />

        <section className="stats-grid">
          <StatCard label="Total Sessions" value={traceList.totals.total} icon={<Database size={18} />} />
          <StatCard label="Imported Raw Traces" value={traceList.totals.imported} icon={<CheckCircle2 size={18} />} tone="good-stat" />
          <StatCard label="Evaluation Candidates" value={sampleList.totals.candidate} icon={<Database size={18} />} />
          <StatCard label="Avg Quality" value={sampleList.totals.averageQuality} icon={<CheckCircle2 size={18} />} />
          <StatCard label="Needs Review" value={sampleList.totals.needsReview} icon={<AlertTriangle size={18} />} tone="warn-stat" />
          <StatCard label="Blocked Samples" value={sampleList.totals.blocked} icon={<ShieldAlert size={18} />} tone="danger-stat" />
        </section>

        <FilterBar filters={filters} projects={projects} onChange={setFilters} />

        <div className="workspace-grid">
          <section className="inbox-panel">
            <div className="panel-title">
              <Database size={16} />
              Raw Trace Inbox
            </div>
            <TraceTable
              traces={traceList.traces}
              selectedId={selectedTraceId}
              onSelect={setSelectedTraceId}
            />
          </section>
          <DetailPanel
            detail={detail}
            loading={loadingDetail}
            reviewingSampleId={reviewingSampleId}
            onReviewSample={handleReviewSample}
          />
        </div>
      </PipelineStageSection>
      )}

      {activePipelineStageId === 'stage-evaluation' && (
      <PipelineStageSection
        id="stage-evaluation"
        lockedOpen
        hideHeader
        activeStageId={activePipelineStageId}
        index="E1"
        title="Agent / Harness 评测"
        detail="固定 Model 和 Runtime，对比工程师提交的 Harness H0/H1 是否真正改善目标能力。"
        summary={`${agentEvaluationExperiments.length} experiments · ${agentEvaluationReports.filter((item) => item.verdict === 'improved').length} improved`}
      >
        <section className="evaluation-scope-banner agent-scope">
          <div>
            <span className="section-label">Agent Evaluation Boundary</span>
            <h2>这里评测 Harness，不评测模型</h2>
            <p>保持 Model、Runtime 和 Validation Suite 不变，只替换 Prompt、Context、Skill、Memory、Tool 或 Workflow Harness。</p>
          </div>
          <div className="evaluation-scope-rules">
            <span><strong>固定</strong><small>Model / Runtime / Benchmark</small></span>
            <span><strong>变量</strong><small>Harness H0 / H1</small></span>
            <span><strong>输出</strong><small>Harness Verdict</small></span>
          </div>
        </section>

        <AgentEvaluationWorkbench
          traces={traceList.traces}
          harnessSnapshots={harnessSnapshots}
          issues={agentEvaluationIssues}
          benchmarkCases={agentBenchmarkCases}
          benchmarkSuites={agentBenchmarkSuites}
          experiments={agentEvaluationExperiments}
          reports={agentEvaluationReports}
          busyKey={agentEvaluationBusyKey}
          onCreateHarness={handleCreateHarnessSnapshot}
          onCreateIssue={handleCreateAgentEvaluationIssue}
          onCreateCase={handleCreateAgentBenchmarkCase}
          onCreateSuite={handleCreateAgentBenchmarkSuite}
          onCreateExperiment={handleCreateAgentEvaluationExperiment}
          onStartExperiment={handleStartAgentEvaluationExperiment}
          onImportPairedResults={handleImportAgentEvaluationPair}
          onCompleteExperiment={handleCompleteAgentEvaluationExperiment}
        />
      </PipelineStageSection>
      )}

      {activePipelineStageId === 'stage-governance' && (
      <PipelineStageSection
        id="stage-governance"
        lockedOpen
        hideHeader
        activeStageId={activePipelineStageId}
        index="D3"
        title="Trace 预处理与治理"
        detail="把 Raw Trace 清洗成评测候选，并完成风险、证据、脱敏、Review 与 Repair 治理。"
        summary={`${sampleList.totals.candidate} candidates · ${sampleList.totals.needsReview + sampleList.totals.blocked} to handle`}
      >
        <ReviewQueuePanel
          samples={traceFoundationSamples}
          allowedKinds={traceFoundationDatasetKinds}
          focus={reviewQueueFocus}
          onSelectTrace={setSelectedTraceId}
          onReviewSamples={handleReviewSamples}
        />

        <RepairWorkbenchPanel
          samples={sampleList.samples}
          onSelectTrace={setSelectedTraceId}
          onReviewSamples={handleReviewSamples}
          onRepairSample={handleRepairSample}
          onLoadEvidenceCandidates={handleLoadEvidenceCandidates}
          onReviewKind={(kind) => setReviewQueueFocus({ kind, requestedAt: Date.now() })}
        />

        <CleanTraceWorkbench
          cleanTraces={cleanTraceList.cleanTraces}
          totals={cleanTraceList.totals}
          onSelectTrace={setSelectedTraceId}
        />

        <TrainingSamplesPanel
          samples={traceFoundationSamples}
          totals={traceFoundationSampleTotals}
          filters={filters}
          onSelectTrace={setSelectedTraceId}
        />
      </PipelineStageSection>
      )}

      {activePipelineStageId === 'stage-dataset' && (
      <PipelineStageSection
        id="stage-dataset"
        lockedOpen
        hideHeader
        activeStageId={activePipelineStageId}
        index="D4"
        title="评测数据集版本"
        detail="把治理后的 Trace 候选固化为 evaluation dataset version，并审查版本差异、质量和 Lineage。"
        summary={`${datasetVersions.length} versions · ${sampleList.totals.candidate} evaluation candidates`}
      >
        <DatasetBuilderPanel
          samples={sampleList.samples}
          filters={filters}
          creating={creatingDatasetVersion}
          allowedKinds={traceFoundationDatasetKinds}
          onReviewKind={(kind) => setReviewQueueFocus({ kind, requestedAt: Date.now() })}
          onCreateKindVersion={handleCreateKindDatasetVersion}
        />

        <DatasetVersionsPanel
          mode="evaluation"
          versions={datasetVersions}
          manifests={releaseManifests}
          diff={datasetVersionDiff}
          selectedId={selectedDatasetVersionId}
          selectedSamples={datasetVersionSamples}
          loadingSamples={loadingDatasetVersionSamples}
          candidateCount={sampleList.samples.filter((sample) => sample.kind === 'eval' && sample.status === 'candidate').length}
          feedbackReadyCount={feedbackLoopsReadyForDataset.length}
          creating={creatingDatasetVersion || creatingFeedbackDatasetVersion}
          generatingManifestVersionId={generatingManifestVersionId}
          promotingManifestId={promotingManifestId}
          focusedEntity={focusedTaskEntity}
          onCreate={handleCreateDatasetVersion}
          onSelect={setSelectedDatasetVersionId}
          onSelectTrace={setSelectedTraceId}
          actingGateKey={actingGateKey}
          onReleaseGateAction={handleReleaseGateAction}
          onCreateManifest={handleCreateReleaseManifest}
          onPromoteManifest={handlePromoteReleaseManifest}
        />

        <DatasetVersionDiffPanel
          versions={datasetVersions}
          selectedId={selectedDatasetVersionId}
          baseVersionId={diffBaseVersionId}
          diff={datasetVersionDiff}
          reviewPlan={datasetDiffReviewPlan}
          loading={loadingDatasetVersionDiff}
          reviewingDecision={reviewingDiffDecision}
          applyingReviewPlan={applyingDiffReviewPlan}
          onBaseChange={setDiffBaseVersionId}
          onReviewDecision={handleDatasetDiffReview}
          onApplyReviewPlan={handleApplyDatasetDiffReviewPlan}
          onSelectDatasetVersion={setSelectedDatasetVersionId}
          onSelectTrace={setSelectedTraceId}
        />
      </PipelineStageSection>
      )}

      {activePipelineStageId === 'stage-model-evaluation' && (
      <PipelineStageSection
        id="stage-model-evaluation"
        lockedOpen
        hideHeader
        activeStageId={activePipelineStageId}
        index="E2"
        title="模型评测"
        detail="固定 Harness 与 Benchmark，对比后训练前后的 Model Snapshot，并验证 Model × Harness 组合。"
        summary={`${evalRuns.length} model evals · ${evalRuns.filter((run) => run.status === 'passed').length} passed`}
      >
        <section className="evaluation-scope-banner model-scope">
          <div>
            <span className="section-label">Model Evaluation Boundary</span>
            <h2>这里评测模型，不评测 Harness</h2>
            <p>保持 Harness、Runtime 和 Benchmark 不变，只替换 Model Snapshot；训练前后结果必须单独记录，再进行 Model × Harness 组合验证。</p>
          </div>
          <div className="evaluation-scope-rules">
            <span><strong>固定</strong><small>Harness / Runtime / Benchmark</small></span>
            <span><strong>变量</strong><small>Model Snapshot</small></span>
            <span><strong>输出</strong><small>Model Verdict</small></span>
          </div>
        </section>

        <EvalRunsPanel
          evalRuns={evalRuns}
          focusedEntity={focusedTaskEntity}
          onSelectDatasetVersion={setSelectedDatasetVersionId}
        />
      </PipelineStageSection>
      )}

      {activePipelineStageId === 'stage-training' && (
      <PipelineStageSection
        id="stage-training"
        lockedOpen
        hideHeader
        activeStageId={activePipelineStageId}
        index="T1"
        title="模型后训练"
        detail="把 dataset version 封装成训练交接，启动 Provider 训练并跟踪模型产物。"
        summary={`${releaseManifests.length + exportRuns.length} release artifacts · ${trainingRuns.length} training runs`}
      >
        <ReleaseManifestsPanel
          manifests={releaseManifests}
          handoffs={retrainingHandoffs}
          promotingManifestId={promotingManifestId}
          creatingHandoffManifestId={creatingHandoffManifestId}
          focusedEntity={focusedTaskEntity}
          onSelectDatasetVersion={setSelectedDatasetVersionId}
          onPromoteManifest={handlePromoteReleaseManifest}
          onCreateHandoffFromManifest={handleCreateRetrainingHandoffFromManifest}
        />

        <ReleasePromotionsPanel
          promotions={releasePromotions}
          handoffs={retrainingHandoffs}
          creatingHandoffPromotionId={creatingHandoffPromotionId}
          focusedEntity={focusedTaskEntity}
          onSelectDatasetVersion={setSelectedDatasetVersionId}
          onCreateHandoff={handleCreateRetrainingHandoff}
        />

        <RetrainingHandoffsPanel
          handoffs={retrainingHandoffs}
          launchPlans={trainingLaunchPlans}
          trainingRuns={trainingRuns}
          creatingTrainingRunHandoffId={creatingTrainingRunHandoffId}
          focusedEntity={focusedTaskEntity}
          onSelectDatasetVersion={setSelectedDatasetVersionId}
          onCreateTrainingRun={handleCreateTrainingRun}
        />

        <TrainingRunsPanel
          runs={trainingRuns}
          evalRuns={evalRuns}
          gates={modelReleaseGates}
          recordingRunId={recordingTrainingRunId}
          syncingProviderRunId={syncingProviderRunId}
          runningEvalRunId={runningEvalRunId}
          creatingModelGateRunId={creatingModelGateRunId}
          focusedEntity={focusedTaskEntity}
          onSelectDatasetVersion={setSelectedDatasetVersionId}
          onRecordResult={handleRecordTrainingRunResult}
          onSyncProvider={handleSyncTrainingProviderStatus}
          onRunEval={handleRunTrainingEval}
          onCreateModelReleaseGate={handleCreateModelReleaseGate}
        />

        <ExportRunsPanel
          runs={exportRuns}
          revokingId={revokingExportId}
          onRevoke={handleRevokeExportRun}
        />
      </PipelineStageSection>
      )}

      {activePipelineStageId === 'stage-release' && (
      <PipelineStageSection
        id="stage-release"
        lockedOpen
        hideHeader
        activeStageId={activePipelineStageId}
        index="T2"
        title="模型发布"
        detail="将模型评测结论转化为 Release Gate、Deployment Handoff 和可回滚发布。"
        summary={`${modelReleaseGates.length} release gates · ${deploymentHandoffs.length} deployment handoffs`}
      >
        <ModelReleaseGatesPanel
          gates={modelReleaseGates}
          deploymentHandoffs={deploymentHandoffs}
          decidingKey={decidingModelGateKey}
          creatingDeploymentGateId={creatingDeploymentGateId}
          focusedEntity={focusedTaskEntity}
          onSelectDatasetVersion={setSelectedDatasetVersionId}
          onDecision={handleModelReleaseGateDecision}
          onCreateDeploymentHandoff={handleCreateDeploymentHandoff}
        />

        <DeploymentHandoffsPanel
          handoffs={deploymentHandoffs}
          monitors={postReleaseMonitors}
          updatingKey={updatingDeploymentKey}
          creatingMonitorDeploymentId={creatingPostMonitorDeploymentId}
          focusedEntity={focusedTaskEntity}
          onSelectDatasetVersion={setSelectedDatasetVersionId}
          onUpdateStatus={handleDeploymentStatus}
          onCreatePostReleaseMonitor={handleCreatePostReleaseMonitor}
        />
      </PipelineStageSection>
      )}

      {activePipelineStageId === 'stage-feedback' && (
      <PipelineStageSection
        id="stage-feedback"
        lockedOpen
        hideHeader
        activeStageId={activePipelineStageId}
        index="T3"
        title="上线反馈闭环"
        detail="把训练、评测、部署和上线监控信号回流成下一轮数据集。"
        summary={`${feedbackLoops.length} feedback loops · ${closedLoopRetrainingPlans.length} closed-loop plans`}
      >
        <PostReleaseMonitorsPanel
          monitors={postReleaseMonitors}
          feedbackLoops={feedbackLoops}
          recordingId={recordingPostMonitorId}
          creatingFeedbackMonitorId={creatingFeedbackMonitorId}
          focusedEntity={focusedTaskEntity}
          onSelectDatasetVersion={setSelectedDatasetVersionId}
          onRecordSignal={handleRecordPostReleaseSignal}
          onCreateFeedbackLoop={handleCreateFeedbackLoop}
        />

        <FeedbackLoopsPanel
          loops={feedbackLoops}
          datasetReadyCount={feedbackLoopsReadyForDataset.length}
          creatingDataset={creatingFeedbackDatasetVersion}
          decidingKey={decidingFeedbackKey}
          focusedEntity={focusedTaskEntity}
          onSelectDatasetVersion={setSelectedDatasetVersionId}
          onDecision={handleFeedbackLoopDecision}
          onCreateDatasetVersion={handleCreateFeedbackDatasetVersion}
        />

        <ClosedLoopRetrainingPanel
          plans={closedLoopRetrainingPlans}
          preparingDatasetId={preparingClosedLoopDatasetId}
          runningDatasetId={runningClosedLoopDatasetId}
          creatingGateDatasetId={creatingClosedLoopModelGateDatasetId}
          creatingDeploymentDatasetId={creatingClosedLoopDeploymentDatasetId}
          rollingOutDatasetId={rollingOutClosedLoopDatasetId}
          writingFeedbackDatasetId={writingClosedLoopFeedbackDatasetId}
          buildingNextDatasetId={buildingClosedLoopNextDatasetId}
          onPrepareHandoff={handlePrepareClosedLoopRetrainingHandoff}
          onRunTrainingCycle={handleRunClosedLoopTrainingCycle}
          onCreateModelGate={handleCreateClosedLoopModelGate}
          onApproveDeploymentHandoff={handleApproveClosedLoopDeploymentHandoff}
          onCreateDeploymentHandoff={handleCreateClosedLoopDeploymentHandoff}
          onRunRollout={handleRunClosedLoopRollout}
          onWriteFeedbackSignal={handleWriteClosedLoopFeedbackSignal}
          onBuildNextDataset={handleBuildClosedLoopNextDataset}
          onSelectDatasetVersion={setSelectedDatasetVersionId}
        />

        <TaskCenterPanel
          tasks={taskList.tasks}
          summary={taskList.summary}
          retryingTaskId={retryingTaskId}
          runningExecutor={runningTaskExecutor}
          selectedTaskId={selectedTaskId}
          onSelectTask={setSelectedTaskId}
          onOpenEntity={handleOpenTaskEntity}
          onRetry={handleRetryTask}
          onRunQueued={handleRunQueuedTasks}
        />
      </PipelineStageSection>
      )}

      {activePipelineStageId === 'stage-system' && (
      <PipelineStageSection
        id="stage-system"
        lockedOpen
        hideHeader
        activeStageId={activePipelineStageId}
        index="P1"
        title="平台治理"
        detail="集中查看审计、存储健康、KodaX 反哺包和自动任务编排。"
        summary={`${governanceAuditLog.length} audit events · ${storageSnapshots.length} snapshots`}
      >
        <SystemGovernanceCenterPanel
          storageHealth={storageHealth}
          segmentStoreStatus={segmentStoreStatus}
          snapshots={storageSnapshots}
          auditLog={governanceAuditLog}
          governancePolicy={governancePolicy}
          feedbackReport={kodaxFeedbackReport}
          feedbackPackage={kodaxFeedbackPackage}
          feedbackWritebacks={kodaxFeedbackWritebacks}
          taskSummary={taskList.summary}
          automationPlan={taskAutomationPlan}
          creatingSnapshot={creatingStorageSnapshot}
          restoringSnapshotId={restoringSnapshotId}
          backfillingSegments={backfillingSegments}
          rebuildingSegments={rebuildingSegments}
          orchestrating={orchestratingSystemTasks}
          writingBackFeedback={writingBackKodaXFeedback}
          onCreateSnapshot={handleCreateStorageSnapshot}
          onRestoreSnapshot={handleRestoreStorageSnapshot}
          onBackfillSegments={handleBackfillSegmentStore}
          onRebuildSegments={handleRebuildSegmentStore}
          onOrchestrate={handleOrchestrateSystemTasks}
          onWritebackFeedback={handleWritebackKodaXFeedback}
        />

        <TaskCenterPanel
          tasks={taskList.tasks}
          summary={taskList.summary}
          retryingTaskId={retryingTaskId}
          runningExecutor={runningTaskExecutor}
          selectedTaskId={selectedTaskId}
          onSelectTask={setSelectedTaskId}
          onOpenEntity={handleOpenTaskEntity}
          onRetry={handleRetryTask}
          onRunQueued={handleRunQueuedTasks}
        />
      </PipelineStageSection>
      )}
      </>
      )}
    </main>
  );
}
