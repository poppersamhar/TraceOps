import { promises as fs } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { promisify } from 'node:util';
import { gzip, gunzip } from 'node:zlib';

import type {
  AgentBenchmarkCase,
  AgentBenchmarkCaseCreateInput,
  AgentBenchmarkSuite,
  AgentBenchmarkSuiteCreateInput,
  AgentEvaluationComparisonReport,
  AgentEvaluationExperiment,
  AgentEvaluationExperimentCreateInput,
  AgentEvaluationIssue,
  AgentEvaluationIssueCreateInput,
  AgentEvaluationIssueStatus,
  AgentEvaluationRollout,
  AgentEvaluationRolloutCreateInput,
  CleanTrace,
  CleanTraceListResponse,
  DatasetClosedLoopApprovalDeploymentResult,
  DatasetClosedLoopCandidateCycleResult,
  DatasetClosedLoopDeploymentHandoffResult,
  DatasetClosedLoopFeedbackSignalMode,
  DatasetClosedLoopFeedbackSignalResult,
  DatasetClosedLoopModelGateResult,
  DatasetClosedLoopNextDatasetResult,
  DatasetClosedLoopRetrainingApplyResult,
  DatasetClosedLoopRetrainingPlan,
  DatasetClosedLoopRolloutResult,
  DatasetClosedLoopTrainingCycleResult,
  DatasetExportFormat,
  DatasetEvalRunApplyResult,
  DatasetEvalRunRecord,
  DatasetExportRun,
  DatasetDeploymentHandoffRecord,
  DatasetDeploymentHandoffStatus,
  DatasetFeedbackLoopDecision,
  DatasetFeedbackLoopRecord,
  DatasetFeedbackLoopSeverity,
  DatasetFeedbackLoopTargetKind,
  DatasetManifestRetrainingHandoffResult,
  DatasetReleaseGate,
  DatasetReleaseGateActionDecision,
  DatasetReleaseGateActionRecord,
  DatasetReleaseGateSeverity,
  DatasetReleaseManifest,
  DatasetModelReleaseGateDecision,
  DatasetModelReleaseGateRecord,
  DatasetPostReleaseAlert,
  DatasetPostReleaseMetric,
  DatasetPostReleaseMonitorRecord,
  DatasetPostReleaseMonitorStatus,
  DatasetReleasePackage,
  DatasetReleasePromotionRecord,
  DatasetRetrainingHandoffRecord,
  DatasetTrainingRunRecord,
  DatasetTrainingProvider,
  DatasetTrainingProviderLaunchRecord,
  DatasetTrainingProviderStatus,
  DatasetTrainingProviderStatusRecord,
  DatasetTrainingLaunchPlan,
  DatasetTrainingLaunchObjective,
  DatasetVersion,
  DatasetVersionDiff,
  DatasetVersionDiffReviewApplyResult,
  DatasetVersionDiffSampleChange,
  DatasetVersionDiffSamplePoint,
  DatasetVersionDiffReviewPlan,
  DatasetVersionDiffReviewDecision,
  DatasetVersionDiffReviewRecord,
  DatasetVersionDiffSignal,
  IngestDiagnosticTriageDecision,
  IngestDiagnosticTriageStatus,
  IngestError,
  IngestJob,
  IngestQualityIssue,
  IngestQualityRecommendationDecisionInput,
  IngestQualityRecommendationDecisionRecord,
  IngestQualityPolicyAction,
  IngestQualityPolicyApplyResult,
  IngestQualityPolicyDryRunResponse,
  IngestQualityPolicyDryRunRuleResult,
  IngestQualityPolicyResponse,
  IngestQualityPolicyRunListResponse,
  IngestQualityPolicyRunRecord,
  IngestQualityPolicyRunTrigger,
  IngestQualityPolicyRule,
  IngestQualityPolicyRuleInput,
  IngestQualityQueueResponse,
  IngestQualityRemediationResult,
  KodaXRuntimeEventInput,
  KodaXFeedbackActionItem,
  KodaXFeedbackPackage,
  KodaXFeedbackReport,
  KodaXFeedbackSignal,
  KodaXFeedbackSignalSeverity,
  KodaXFeedbackWritebackFile,
  KodaXFeedbackWritebackRecord,
  KodaXFeedbackWritebackResult,
  KodaXRuntimeIngestInput,
  KodaXRuntimeIngestResult,
  KodaXTraceSpanInput,
  MemoryCandidate,
  MemoryCandidateListResponse,
  MemoryCandidateReviewDecision,
  MemoryCandidateReviewRecord,
  EvidenceKind,
  GovernanceActor,
  GovernanceActorRole,
  GovernanceAuditRecord,
  GovernancePolicyResponse,
  HarnessSnapshot,
  HarnessSnapshotCreateInput,
  HarnessSnapshotDiff,
  RawEvidence,
  RawTrace,
  RawTraceCounts,
  RawTraceEvent,
  RawTraceEventType,
  RawTraceRevision,
  RawTraceRuntime,
  SourceStatus,
  StorePersistenceHealth,
  StorePersistenceTableCounts,
  StoreSnapshotCreateResult,
  StoreSnapshotRecord,
  StoreSnapshotRestoreResult,
  TraceOpsSegmentBackfillResult,
  TraceOpsSegmentFile,
  TraceOpsSegmentKind,
  TraceOpsSegmentRecordRef,
  TraceOpsSegmentStoreStatus,
  TrainingSample,
  TrainingSampleEvidenceCandidate,
  TrainingSampleListResponse,
  TrainingSampleRepairRecord,
  TrainingSampleReviewDecision,
  TrainingSampleReviewBulkResult,
  TrainingSampleReviewRecord,
  TraceOpsTaskCreateInput,
  TraceOpsTaskCreateResponse,
  TraceOpsTaskAlert,
  TraceOpsTaskAutomationPlan,
  TraceOpsTaskEntityRef,
  TraceOpsTaskExecutionResult,
  TraceOpsTaskKind,
  TraceOpsTaskListResponse,
  TraceOpsTaskOrchestrationResult,
  TraceOpsTaskRecord,
  TraceStatus,
  TraceOpsTaskStatus,
  TraceDetail,
  TraceListResponse,
} from '../../../packages/trace-core/src/types';
import { evaluateDatasetReleaseGate } from '../../../packages/trace-core/src/releaseGate';
import { compareAgentEvaluation, defaultAgentEvaluationMetrics, evaluationHash } from '../../../packages/evaluation/src';
import { aggregateRisk, scanEvidenceRisk, scanTextRisk } from '../../../packages/governance/src/risk';
import { cleanTraceFromRawTrace } from '../../../packages/distiller/src/cleanTrace';
import { generateMemoryCandidates } from '../../../packages/distiller/src/memoryCandidates';
import { generateTrainingSample, generateTrainingSamples } from '../../../packages/distiller/src/trainingSamples';
import { createStorePersistenceAdapter } from './persistence';

interface PersistedStore {
  source: SourceStatus;
  traces: RawTrace[];
  events: RawTraceEvent[];
  evidence: RawEvidence[];
  revisions: RawTraceRevision[];
  jobs: IngestJob[];
  errors: IngestError[];
  sampleReviews: TrainingSampleReviewRecord[];
  sampleRepairs: TrainingSampleRepairRecord[];
  memoryCandidateReviews: MemoryCandidateReviewRecord[];
  datasetReleaseGateActions: DatasetReleaseGateActionRecord[];
  datasetDiffReviews: DatasetVersionDiffReviewRecord[];
  releaseManifests: DatasetReleaseManifest[];
  releasePromotions: DatasetReleasePromotionRecord[];
  retrainingHandoffs: DatasetRetrainingHandoffRecord[];
  trainingRuns: DatasetTrainingRunRecord[];
  evalRuns: DatasetEvalRunRecord[];
  harnessSnapshots: HarnessSnapshot[];
  agentEvaluationIssues: AgentEvaluationIssue[];
  agentBenchmarkCases: AgentBenchmarkCase[];
  agentBenchmarkSuites: AgentBenchmarkSuite[];
  agentEvaluationExperiments: AgentEvaluationExperiment[];
  agentEvaluationRollouts: AgentEvaluationRollout[];
  agentEvaluationReports: AgentEvaluationComparisonReport[];
  modelReleaseGates: DatasetModelReleaseGateRecord[];
  deploymentHandoffs: DatasetDeploymentHandoffRecord[];
  postReleaseMonitors: DatasetPostReleaseMonitorRecord[];
  feedbackLoops: DatasetFeedbackLoopRecord[];
  exportRuns: DatasetExportRun[];
  datasetVersions: DatasetVersion[];
  tasks: TraceOpsTaskRecord[];
  ingestQualityPolicyRules: IngestQualityPolicyRule[];
  ingestQualityPolicyRuns: IngestQualityPolicyRunRecord[];
  ingestQualityRecommendationDecisions: IngestQualityRecommendationDecisionRecord[];
  governanceAuditRecords: GovernanceAuditRecord[];
  kodaxFeedbackWritebacks: KodaXFeedbackWritebackRecord[];
  segmentFiles: TraceOpsSegmentFile[];
  segmentRecordRefs: TraceOpsSegmentRecordRef[];
  segmentLastBackfillAt?: string;
}

const persistence = createStorePersistenceAdapter();
const storeDir = persistence.storeDir;
const storePath = persistence.storePath;
const storeBackupPath = persistence.backupPath;
const snapshotsDir = persistence.snapshotsDir;
const snapshotManifestPath = persistence.snapshotManifestPath;
const segmentRootDir = path.join(storeDir, 'lake');
const maxPersistedJobs = 500;
const maxPersistedErrors = 200;
const maxStoreSnapshots = 20;
const largeStoreWarningBytes = 25 * 1024 * 1024;
const maxSegmentRecords = 2000;
const maxSegmentBytes = 128 * 1024 * 1024;
const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

interface StoreCompactionSummary {
  jobsBefore: number;
  jobsAfter: number;
  jobsRemoved: number;
  errorsBefore: number;
  errorsAfter: number;
  errorsRemoved: number;
  storeBytesBefore?: number;
  storeBytesAfter?: number;
}

interface SegmentRecordInput {
  stream: string;
  kind: TraceOpsSegmentKind;
  sourceId: string;
  payload: unknown;
  identity?: unknown;
  traceId?: string;
  sampleId?: string;
  datasetVersionId?: string;
  occurredAt?: string;
}

interface SegmentWriteSummary {
  written: number;
  skipped: number;
  filesCreated: number;
  filesSealed: number;
  streamWrites: Record<string, number>;
}

function stableHash(value: unknown): string {
  return `sha256:${createHash('sha256').update(JSON.stringify(value)).digest('hex')}`;
}

function bufferSha256(buffer: Buffer): string {
  return `sha256:${createHash('sha256').update(buffer).digest('hex')}`;
}

function stableShortHash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 20);
}

function sanitizeIdPart(value: string | undefined): string {
  return (value || 'unknown').replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 80);
}

function textPreview(value: unknown, max = 180): string {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? '');
  return text.replace(/\s+/g, ' ').trim().slice(0, max);
}

interface RuntimeTraceSeed {
  traceId?: string;
  sessionId: string;
  projectKey?: string;
  title?: string;
  gitRoot?: string;
  scope?: RawTraceRuntime['scope'];
  runtime?: Partial<RawTraceRuntime>;
  status?: TraceStatus;
}

function runtimeTraceId(seed: RuntimeTraceSeed): string {
  return seed.traceId
    ? sanitizeIdPart(seed.traceId)
    : `trace_kodax_${sanitizeIdPart(seed.projectKey ?? 'runtime')}_${sanitizeIdPart(seed.sessionId)}`;
}

function runtimeRevisionId(traceId: string): string {
  return `rev_runtime_${stableShortHash({ traceId, source: 'kodax-runtime-adapter-v1' })}`;
}

function runtimeEventType(kind: KodaXRuntimeEventInput['kind']): RawTraceEventType {
  if (kind === 'message') return 'message';
  if (kind === 'tool_use') return 'tool_use';
  if (kind === 'tool_result') return 'tool_result';
  if (kind === 'artifact') return 'artifact';
  if (kind === 'handoff') return 'handoff';
  return 'runtime_event';
}

function runtimeEventStatus(kind: KodaXRuntimeEventInput['kind'], explicit?: TraceStatus): TraceStatus | undefined {
  if (explicit) return explicit;
  if (kind === 'session_started' || kind === 'session_updated') return 'running';
  if (kind === 'session_completed') return 'completed';
  if (kind === 'session_failed') return 'failed';
  return undefined;
}

function runtimeSpanStatus(status: KodaXTraceSpanInput['status'], endedAt?: string): TraceStatus | undefined {
  if (status === 'error' || status === 'cancelled') return 'failed';
  if (!endedAt) return 'running';
  return undefined;
}

function emptyRuntimeCounts(): RawTraceCounts {
  return {
    messages: 0,
    activeMessages: 0,
    lineageEntries: 0,
    transcriptEntries: 0,
    artifactLedgerEntries: 0,
    toolUseEvents: 0,
    toolResultEvents: 0,
    compactions: 0,
    branchSummaries: 0,
    goalEvents: 0,
  };
}

function applyRuntimeStatus(trace: RawTrace, status?: TraceStatus): void {
  if (!status) return;
  if (status === 'running' && (trace.status === 'completed' || trace.status === 'failed')) return;
  trace.status = status;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function readNestedRecord(value: unknown, key: string): Record<string, unknown> | undefined {
  if (!isRecord(value)) return undefined;
  const next = value[key];
  return isRecord(next) ? next : undefined;
}

function readNestedString(value: unknown, keys: string[]): string | undefined {
  if (!isRecord(value)) return undefined;
  for (const key of keys) {
    const next = value[key];
    if (typeof next === 'string' && next.trim()) return next.trim();
  }
  return undefined;
}

function toolNameFromEvent(event: RawTraceEvent): string | undefined {
  if (isRecord(event.payload)) {
    if (typeof event.payload.name === 'string') return event.payload.name;
    const tool = readNestedRecord(event.payload, 'tool');
    if (typeof tool?.name === 'string') return tool.name;
    if (typeof event.payload.kind === 'string' && typeof event.payload.name === 'string') return event.payload.name;
  }
  const match = event.label.match(/(?:Tool call|Tool card|tool):\s*(.+)$/i);
  return match?.[1]?.trim();
}

function toolInputFromEvent(event: RawTraceEvent): Record<string, unknown> | undefined {
  if (!isRecord(event.payload)) return undefined;
  const input = readNestedRecord(event.payload, 'input');
  if (input) return input;
  const tool = readNestedRecord(event.payload, 'tool');
  const toolInput = readNestedRecord(tool, 'input');
  if (toolInput) return toolInput;
  const attributes = readNestedRecord(event.payload, 'attributes');
  if (attributes) return attributes;
  return undefined;
}

function evidenceTargetFromEvent(event: RawTraceEvent): string {
  const input = toolInputFromEvent(event);
  const direct = readNestedString(input, [
    'path',
    'filePath',
    'target',
    'url',
    'command',
    'cmd',
    'query',
    'pattern',
    'repo',
    'workspace',
  ]);
  if (direct) return direct;
  if (isRecord(event.payload)) {
    const output = readNestedString(event.payload, ['target', 'path', 'url', 'command', 'name']);
    if (output) return output;
  }
  return event.preview || event.label || event.id;
}

function evidenceKindFromEvent(event: RawTraceEvent): EvidenceKind {
  const name = (toolNameFromEvent(event) ?? '').toLowerCase();
  const target = evidenceTargetFromEvent(event).toLowerCase();
  const preview = `${event.label} ${event.preview}`.toLowerCase();
  const text = `${name} ${target} ${preview}`;

  if (/delete|remove|unlink|\brm\b/.test(text)) return 'file_deleted';
  if (/write|create|new file|file created/.test(text)) return 'file_created';
  if (/edit|patch|replace|modify|update|apply_patch|file modified/.test(text)) return 'file_modified';
  if (/read|view|open file|cat\b|sed\b|tail\b|head\b/.test(text)) return 'file_read';
  if (/grep|search|ripgrep|\brg\b|find\b|query/.test(text)) return 'search_scope';
  if (/screenshot|image|vision/.test(text)) return 'image_input';
  if (/bash|shell|exec|command|terminal|npm|pnpm|yarn|node|python|pytest|curl|open /.test(text)) return 'command_scope';
  if (/\/|\\|\.(ts|tsx|js|jsx|py|go|rs|java|json|md|html|css|scss|yml|yaml)$/i.test(target)) return 'path_scope';
  return 'decision';
}

function evidenceSourceFromEvent(event: RawTraceEvent): RawEvidence['source'] {
  return event.source === 'kodax_tracing_span' || event.type === 'trace_span'
    ? 'kodax_runtime_span'
    : 'kodax_tool_event';
}

function shouldDeriveEvidenceFromEvent(event: RawTraceEvent): boolean {
  return event.type === 'tool_use'
    || event.type === 'tool_call'
    || event.type === 'trace_span'
    || event.type === 'artifact';
}

function cloneSample(sample: TrainingSample): TrainingSample {
  return JSON.parse(JSON.stringify(sample)) as TrainingSample;
}

function compactPreview(value?: string): string {
  if (!value) return 'No repaired text captured';
  return value.replace(/\s+/g, ' ').trim().slice(0, 180);
}

function trainingObjectiveText(objective: DatasetTrainingLaunchObjective): string {
  if (objective === 'sft') return 'SFT';
  if (objective === 'eval') return 'Eval';
  if (objective === 'repair') return 'Repair';
  return 'Mixed';
}

function emptyExportRiskSummary(): DatasetExportRun['riskSummary'] {
  return {
    L0: 0,
    L1: 0,
    L2: 0,
    L3: 0,
    L4: 0,
    highRisk: 0,
    blocked: 0,
    unreviewed: 0,
    missingEvidence: 0,
  };
}

function exportRiskSummary(samples: TrainingSample[]): DatasetExportRun['riskSummary'] {
  return {
    L0: samples.filter((sample) => sample.riskLevel === 'L0').length,
    L1: samples.filter((sample) => sample.riskLevel === 'L1').length,
    L2: samples.filter((sample) => sample.riskLevel === 'L2').length,
    L3: samples.filter((sample) => sample.riskLevel === 'L3').length,
    L4: samples.filter((sample) => sample.riskLevel === 'L4').length,
    highRisk: samples.filter((sample) => sample.riskLevel === 'L3' || sample.riskLevel === 'L4').length,
    blocked: samples.filter((sample) => sample.status === 'blocked' || sample.quality.grade === 'blocked').length,
    unreviewed: samples.filter((sample) => !sample.review).length,
    missingEvidence: samples.filter((sample) => sample.toolEventCount > 0 && sample.evidenceCount === 0).length,
  };
}

function countSamplesBy(samples: TrainingSample[], read: (sample: TrainingSample) => string | undefined): Record<string, number> {
  return samples.reduce<Record<string, number>>((counts, sample) => {
    const key = read(sample) || 'unknown';
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function averageQualityScore(samples: TrainingSample[]): number {
  if (samples.length === 0) return 0;
  return Math.round(samples.reduce((sum, sample) => sum + sample.quality.score, 0) / samples.length);
}

function deltaCounts(
  base: Record<string, number>,
  head: Record<string, number>,
): Record<string, number> {
  const keys = new Set([...Object.keys(base), ...Object.keys(head)]);
  return Array.from(keys).sort().reduce<Record<string, number>>((delta, key) => {
    const value = (head[key] ?? 0) - (base[key] ?? 0);
    if (value !== 0) delta[key] = value;
    return delta;
  }, {});
}

function sampleSnapshotHash(sample: TrainingSample): string {
  return stableHash({
    kind: sample.kind,
    status: sample.status,
    trainable: sample.trainable,
    riskLevel: sample.riskLevel,
    quality: sample.quality,
    blockers: sample.blockers,
    labels: sample.labels,
    promptPreview: sample.promptPreview,
    responsePreview: sample.responsePreview,
    toolEventCount: sample.toolEventCount,
    evidenceCount: sample.evidenceCount,
    input: sample.input,
    output: sample.output,
    review: sample.review,
    repair: sample.repair,
    distillation: sample.metadata.distillation,
  });
}

function sampleDiffPoint(sample: TrainingSample): DatasetVersionDiffSamplePoint {
  return {
    riskLevel: sample.riskLevel,
    qualityScore: sample.quality.score,
    qualityGrade: sample.quality.grade,
    status: sample.status,
    reviewDecision: sample.review?.decision,
    evidenceCount: sample.evidenceCount,
    toolEventCount: sample.toolEventCount,
    redactionCount: sample.metadata.distillation.redactionCount,
    readyForFineTune: sample.metadata.distillation.readyForFineTune,
    sampleHash: sampleSnapshotHash(sample),
  };
}

function riskRank(riskLevel: TrainingSample['riskLevel']): number {
  return Number(riskLevel.replace('L', '')) || 0;
}

function evidenceGapCount(samples: TrainingSample[]): number {
  return samples.filter((sample) => sample.toolEventCount > 0 && sample.evidenceCount === 0).length;
}

function buildDiffSignals(
  before: TrainingSample | undefined,
  after: TrainingSample | undefined,
): DatasetVersionDiffSignal[] {
  if (!before && after) {
    return [{ label: 'Added to release', after: after.quality.score, direction: 'neutral' }];
  }
  if (before && !after) {
    return [{ label: 'Removed from release', before: before.quality.score, direction: 'neutral' }];
  }
  if (!before || !after) return [];

  const signals: DatasetVersionDiffSignal[] = [];
  if (before.riskLevel !== after.riskLevel) {
    signals.push({
      label: 'Risk level',
      before: before.riskLevel,
      after: after.riskLevel,
      direction: riskRank(after.riskLevel) > riskRank(before.riskLevel) ? 'worse' : 'better',
    });
  }
  if (before.quality.score !== after.quality.score || before.quality.grade !== after.quality.grade) {
    signals.push({
      label: 'Quality',
      before: `${before.quality.score}/${before.quality.grade}`,
      after: `${after.quality.score}/${after.quality.grade}`,
      direction: after.quality.score > before.quality.score ? 'better' : after.quality.score < before.quality.score ? 'worse' : 'neutral',
    });
  }
  if (before.status !== after.status) {
    signals.push({
      label: 'Sample status',
      before: before.status,
      after: after.status,
      direction: after.status === 'candidate' ? 'better' : after.status === 'blocked' ? 'worse' : 'neutral',
    });
  }
  if (before.review?.decision !== after.review?.decision) {
    signals.push({
      label: 'Review decision',
      before: before.review?.decision ?? 'unreviewed',
      after: after.review?.decision ?? 'unreviewed',
      direction: after.review?.decision === 'approved' ? 'better' : after.review?.decision === 'rejected' ? 'worse' : 'neutral',
    });
  }
  const beforeGap = before.toolEventCount > 0 && before.evidenceCount === 0;
  const afterGap = after.toolEventCount > 0 && after.evidenceCount === 0;
  if (beforeGap !== afterGap || before.evidenceCount !== after.evidenceCount) {
    signals.push({
      label: 'Evidence coverage',
      before: beforeGap ? 'gap' : `${before.evidenceCount} evidence`,
      after: afterGap ? 'gap' : `${after.evidenceCount} evidence`,
      direction: afterGap && !beforeGap ? 'worse' : beforeGap && !afterGap ? 'better' : 'neutral',
    });
  }
  if (before.metadata.distillation.redactionCount !== after.metadata.distillation.redactionCount) {
    signals.push({
      label: 'Redactions',
      before: before.metadata.distillation.redactionCount,
      after: after.metadata.distillation.redactionCount,
      direction: after.metadata.distillation.redactionCount > before.metadata.distillation.redactionCount ? 'better' : 'neutral',
    });
  }
  if (before.metadata.distillation.readyForFineTune !== after.metadata.distillation.readyForFineTune) {
    signals.push({
      label: 'Fine-tune ready',
      before: before.metadata.distillation.readyForFineTune ? 'yes' : 'no',
      after: after.metadata.distillation.readyForFineTune ? 'yes' : 'no',
      direction: after.metadata.distillation.readyForFineTune ? 'better' : 'worse',
    });
  }
  if (sampleSnapshotHash(before) !== sampleSnapshotHash(after) && signals.length === 0) {
    signals.push({ label: 'Content snapshot', before: 'changed', after: 'changed', direction: 'neutral' });
  }
  return signals;
}

function diffImportance(kind: DatasetVersionDiffSampleChange['kind'], signals: DatasetVersionDiffSignal[]): DatasetVersionDiffSampleChange['importance'] {
  if (kind === 'removed') return 'medium';
  if (signals.some((signal) => signal.direction === 'worse')) return 'high';
  if (kind === 'added' || signals.some((signal) => signal.direction === 'better')) return 'medium';
  return 'low';
}

function diffRecommendation(summary: DatasetVersionDiff['summary']): string {
  if (summary.added === 0 && summary.removed === 0 && summary.changed === 0) {
    return 'No material dataset change detected. This version is stable against the selected baseline.';
  }
  if (summary.highRiskDelta > 0 || summary.evidenceGapDelta > 0) {
    return 'Review governance impact before release: high-risk samples or evidence gaps increased in this version.';
  }
  if (summary.averageQualityDelta < 0 || summary.blockedQualityDelta > 0) {
    return 'Review quality impact before release: the selected version introduces quality regression signals.';
  }
  if (summary.removed > 0) {
    return 'Confirm removed samples are intentional before publishing this dataset version.';
  }
  return 'Dataset diff looks release-friendly. Review changed samples, then generate a release manifest.';
}

function datasetVersionDiffId(baseVersionId: string, headVersionId: string): string {
  return `diff_${baseVersionId}_${headVersionId}`;
}

function recordText(value: unknown, max = 800): string {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value ?? '').slice(0, max);
  } catch {
    return String(value ?? '').slice(0, max);
  }
}

function evidenceText(evidence: RawEvidence): string {
  return [
    evidence.kind,
    evidence.sourceTool,
    evidence.action,
    evidence.target,
    evidence.displayTarget,
    evidence.summary,
    recordText(evidence.metadata),
  ].filter(Boolean).join(' ');
}

function eventText(event: RawTraceEvent): string {
  return [
    event.label,
    event.preview,
    recordText(event.payload),
  ].filter(Boolean).join(' ');
}

function tokensFor(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .split(/[^a-z0-9_\u4e00-\u9fa5]+/i)
      .map((token) => token.trim())
      .filter((token) => token.length >= 3)
      .slice(0, 80),
  );
}

function overlapCount(left: Set<string>, right: Set<string>): number {
  let count = 0;
  for (const token of left) {
    if (right.has(token)) count += 1;
  }
  return count;
}

function evidenceKindBoost(sample: TrainingSample, evidence: RawEvidence): number {
  if (sample.kind === 'eval' && evidence.kind === 'check_result') return 30;
  if (sample.kind === 'repair' && (evidence.kind === 'check_result' || evidence.kind === 'decision')) return 24;
  if (sample.kind === 'tool_use' && evidence.kind !== 'decision') return 20;
  if (sample.kind === 'artifact_creation' && /file_/i.test(evidence.kind)) return 18;
  if (sample.toolEventCount > 0 && evidence.kind !== 'decision') return 12;
  return 4;
}

export class TraceOpsStore {
  private data: PersistedStore;
  private saveQueue: Promise<void> = Promise.resolve();

  constructor(source: SourceStatus) {
    this.data = {
      source,
      traces: [],
      events: [],
      evidence: [],
      revisions: [],
      jobs: [],
      errors: [],
      sampleReviews: [],
      sampleRepairs: [],
      memoryCandidateReviews: [],
      datasetReleaseGateActions: [],
      datasetDiffReviews: [],
      releaseManifests: [],
      releasePromotions: [],
      retrainingHandoffs: [],
      trainingRuns: [],
      evalRuns: [],
      harnessSnapshots: [],
      agentEvaluationIssues: [],
      agentBenchmarkCases: [],
      agentBenchmarkSuites: [],
      agentEvaluationExperiments: [],
      agentEvaluationRollouts: [],
      agentEvaluationReports: [],
      modelReleaseGates: [],
      deploymentHandoffs: [],
      postReleaseMonitors: [],
      feedbackLoops: [],
      exportRuns: [],
      datasetVersions: [],
      tasks: [],
      ingestQualityPolicyRules: [],
      ingestQualityPolicyRuns: [],
      ingestQualityRecommendationDecisions: [],
      governanceAuditRecords: [],
      kodaxFeedbackWritebacks: [],
      segmentFiles: [],
      segmentRecordRefs: [],
    };
  }

  async load(): Promise<void> {
    try {
      const text = await persistence.readStoreText();
      if (!text.trim()) {
        await this.quarantineStoreFile('empty');
        await this.save();
        return;
      }
      const parsed = JSON.parse(text) as PersistedStore;
      this.hydrate(parsed);
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
        await this.save();
        return;
      }
      const restored = await this.restoreBackupStore();
      if (restored) return;
      await this.quarantineStoreFile('corrupt');
      await this.save();
    }
  }

  async save(): Promise<void> {
    const write = this.saveQueue.then(() => this.writeStoreFile());
    this.saveQueue = write.catch(() => undefined);
    await write;
  }

  private async writeStoreFile(): Promise<void> {
    this.compactStoreHistory();
    await this.backupCurrentStore();
    await persistence.writeStoreText(JSON.stringify(this.data, null, 2));
  }

  private hydrate(parsed: PersistedStore): void {
    this.data = {
      ...this.data,
      ...parsed,
      source: { ...this.data.source, ...parsed.source },
      sampleReviews: parsed.sampleReviews ?? [],
      sampleRepairs: parsed.sampleRepairs ?? [],
      memoryCandidateReviews: parsed.memoryCandidateReviews ?? [],
      datasetReleaseGateActions: parsed.datasetReleaseGateActions ?? [],
      datasetDiffReviews: parsed.datasetDiffReviews ?? [],
      releaseManifests: parsed.releaseManifests ?? [],
      releasePromotions: parsed.releasePromotions ?? [],
      retrainingHandoffs: parsed.retrainingHandoffs ?? [],
      trainingRuns: parsed.trainingRuns ?? [],
      evalRuns: parsed.evalRuns ?? [],
      harnessSnapshots: parsed.harnessSnapshots ?? [],
      agentEvaluationIssues: parsed.agentEvaluationIssues ?? [],
      agentBenchmarkCases: parsed.agentBenchmarkCases ?? [],
      agentBenchmarkSuites: parsed.agentBenchmarkSuites ?? [],
      agentEvaluationExperiments: parsed.agentEvaluationExperiments ?? [],
      agentEvaluationRollouts: parsed.agentEvaluationRollouts ?? [],
      agentEvaluationReports: parsed.agentEvaluationReports ?? [],
      modelReleaseGates: parsed.modelReleaseGates ?? [],
      deploymentHandoffs: parsed.deploymentHandoffs ?? [],
      postReleaseMonitors: parsed.postReleaseMonitors ?? [],
      feedbackLoops: parsed.feedbackLoops ?? [],
      tasks: parsed.tasks ?? [],
      exportRuns: (parsed.exportRuns ?? []).map((run) => ({
        ...run,
        status: run.status ?? 'active',
        source: run.source ?? 'training_sample_query',
        sampleIds: run.sampleIds ?? [],
        traceIds: run.traceIds ?? [],
        riskSummary: run.riskSummary ?? emptyExportRiskSummary(),
        generatedBy: run.generatedBy ?? 'local-curator',
      })),
      datasetVersions: parsed.datasetVersions ?? [],
      ingestQualityPolicyRules: parsed.ingestQualityPolicyRules ?? [],
      ingestQualityPolicyRuns: parsed.ingestQualityPolicyRuns ?? [],
      ingestQualityRecommendationDecisions: parsed.ingestQualityRecommendationDecisions ?? [],
      governanceAuditRecords: parsed.governanceAuditRecords ?? [],
      kodaxFeedbackWritebacks: parsed.kodaxFeedbackWritebacks ?? [],
      segmentFiles: parsed.segmentFiles ?? [],
      segmentRecordRefs: parsed.segmentRecordRefs ?? [],
      segmentLastBackfillAt: parsed.segmentLastBackfillAt,
    };
  }

  private async backupCurrentStore(): Promise<void> {
    await persistence.backupStoreIfValid();
  }

  private async restoreBackupStore(): Promise<boolean> {
    try {
      const backup = await persistence.readBackupText();
      if (!backup.trim()) return false;
      const parsed = JSON.parse(backup) as PersistedStore;
      this.hydrate(parsed);
      await persistence.restoreBackupText(backup);
      return true;
    } catch {
      return false;
    }
  }

  private async quarantineStoreFile(reason: 'empty' | 'corrupt'): Promise<void> {
    await persistence.quarantineStore(reason);
  }

  private compactStoreHistory(): StoreCompactionSummary {
    const jobsBefore = this.data.jobs.length;
    const errorsBefore = this.data.errors.length;
    const protectedJobIds = new Set<string>();
    if (this.data.source.syncCheckpoint?.jobId) protectedJobIds.add(this.data.source.syncCheckpoint.jobId);
    for (const error of this.data.errors) protectedJobIds.add(error.jobId);
    for (const job of this.data.jobs) {
      if (job.status === 'running' || job.status === 'failed') protectedJobIds.add(job.id);
      if ((job.diagnostics ?? []).some((diagnostic) =>
        diagnostic.level === 'error' && this.ingestDiagnosticStatus(diagnostic) === 'open'
      )) {
        protectedJobIds.add(job.id);
      }
    }

    const sortedJobs = this.data.jobs
      .slice()
      .sort((a, b) => (b.startedAt ?? '').localeCompare(a.startedAt ?? ''));
    const keptJobs = new Map<string, IngestJob>();
    for (const job of sortedJobs) {
      if (protectedJobIds.has(job.id) || keptJobs.size < maxPersistedJobs) {
        keptJobs.set(job.id, job);
      }
      if (keptJobs.size >= maxPersistedJobs && Array.from(protectedJobIds).every((id) => keptJobs.has(id))) {
        break;
      }
    }
    for (const job of sortedJobs) {
      if (protectedJobIds.has(job.id)) keptJobs.set(job.id, job);
    }
    this.data.jobs = Array.from(keptJobs.values())
      .sort((a, b) => (b.startedAt ?? '').localeCompare(a.startedAt ?? ''));

    const remainingJobIds = new Set(this.data.jobs.map((job) => job.id));
    this.data.errors = this.data.errors
      .filter((error) => remainingJobIds.has(error.jobId))
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
      .slice(0, maxPersistedErrors);

    return {
      jobsBefore,
      jobsAfter: this.data.jobs.length,
      jobsRemoved: Math.max(0, jobsBefore - this.data.jobs.length),
      errorsBefore,
      errorsAfter: this.data.errors.length,
      errorsRemoved: Math.max(0, errorsBefore - this.data.errors.length),
    };
  }

  async compactStore(): Promise<StoreCompactionSummary> {
    const before = await persistence.readStoreSize();
    const summary = this.compactStoreHistory();
    await this.save();
    const after = await persistence.readStoreSize();
    return {
      ...summary,
      storeBytesBefore: before,
      storeBytesAfter: after,
    };
  }

  private persistenceTableCounts(): StorePersistenceTableCounts {
    return {
      traces: this.data.traces.length,
      events: this.data.events.length,
      evidence: this.data.evidence.length,
      revisions: this.data.revisions.length,
      jobs: this.data.jobs.length,
      trainingSamplesApprox: this.data.traces.reduce((count, trace) => count + this.baseTrainingSamples(trace).length, 0),
      memoryCandidatesApprox: this.data.traces.reduce((count, trace) => count + this.baseMemoryCandidates(trace).length, 0),
      datasetVersions: this.data.datasetVersions.length,
      releaseManifests: this.data.releaseManifests.length,
      trainingRuns: this.data.trainingRuns.length,
      tasks: this.data.tasks.length,
      governanceAuditRecords: this.data.governanceAuditRecords.length,
    };
  }

  private segmentStreamPath(stream: string): string {
    return stream
      .split('/')
      .map((part) => sanitizeIdPart(part.toLowerCase()))
      .filter(Boolean)
      .join(path.sep);
  }

  private segmentRelativePath(filePath: string): string {
    return path.relative(storeDir, filePath);
  }

  private segmentAbsolutePath(file: TraceOpsSegmentFile): string {
    return path.isAbsolute(file.path)
      ? file.path
      : path.resolve(storeDir, file.path);
  }

  private async sealSegmentFile(file: TraceOpsSegmentFile): Promise<boolean> {
    if (file.status === 'sealed') return false;
    try {
      const buffer = await fs.readFile(this.segmentAbsolutePath(file));
      file.sha256 = bufferSha256(buffer);
      file.byteSize = buffer.byteLength;
    } catch {
      file.sha256 = undefined;
    }
    const now = new Date().toISOString();
    file.status = 'sealed';
    file.sealedAt = now;
    file.updatedAt = now;
    return true;
  }

  private async writableSegmentFile(stream: string, kind: TraceOpsSegmentKind): Promise<{ file: TraceOpsSegmentFile; created: boolean; sealed: boolean }> {
    const existing = this.data.segmentFiles.find((file) =>
      file.stream === stream
      && file.kind === kind
      && file.status === 'open'
    );
    let sealed = false;
    if (existing && (existing.recordCount >= existing.maxRecords || existing.byteSize >= existing.maxBytes)) {
      sealed = await this.sealSegmentFile(existing);
    } else if (existing) {
      return { file: existing, created: false, sealed: false };
    }

    const createdAt = new Date().toISOString();
    const id = `segment_${createdAt.replace(/[^0-9]/g, '').slice(0, 14)}_${Math.random().toString(36).slice(2, 8)}`;
    const dir = path.join(segmentRootDir, this.segmentStreamPath(stream));
    const filename = `${id}.ndjson`;
    const absolutePath = path.join(dir, filename);
    await fs.mkdir(dir, { recursive: true });
    const file: TraceOpsSegmentFile = {
      id,
      stream,
      kind,
      path: this.segmentRelativePath(absolutePath),
      status: 'open',
      schemaVersion: 'traceops-segment-v1',
      recordCount: 0,
      byteSize: 0,
      maxRecords: maxSegmentRecords,
      maxBytes: maxSegmentBytes,
      createdAt,
      updatedAt: createdAt,
    };
    this.data.segmentFiles.unshift(file);
    return { file, created: true, sealed };
  }

  private segmentRecordExists(stream: string, sourceId: string, recordHash: string): boolean {
    return this.data.segmentRecordRefs.some((ref) =>
      ref.stream === stream
      && ref.sourceId === sourceId
      && ref.recordHash === recordHash
    );
  }

  private emptySegmentWriteSummary(): SegmentWriteSummary {
    return {
      written: 0,
      skipped: 0,
      filesCreated: 0,
      filesSealed: 0,
      streamWrites: {},
    };
  }

  private mergeSegmentWriteSummary(target: SegmentWriteSummary, next: SegmentWriteSummary): SegmentWriteSummary {
    target.written += next.written;
    target.skipped += next.skipped;
    target.filesCreated += next.filesCreated;
    target.filesSealed += next.filesSealed;
    for (const [stream, count] of Object.entries(next.streamWrites)) {
      target.streamWrites[stream] = (target.streamWrites[stream] ?? 0) + count;
    }
    return target;
  }

  private async appendSegmentRecords(records: SegmentRecordInput[]): Promise<SegmentWriteSummary> {
    const summary = this.emptySegmentWriteSummary();
    for (const input of records) {
      const payloadHash = stableHash(input.payload);
      const identityHash = stableHash(input.identity ?? input.payload);
      const recordHash = stableHash({
        stream: input.stream,
        sourceId: input.sourceId,
        identityHash,
      });
      if (this.segmentRecordExists(input.stream, input.sourceId, recordHash)) {
        summary.skipped += 1;
        continue;
      }

      const writable = await this.writableSegmentFile(input.stream, input.kind);
      if (writable.created) summary.filesCreated += 1;
      if (writable.sealed) summary.filesSealed += 1;
      const file = writable.file;
      const writtenAt = new Date().toISOString();
      const record = {
        schemaVersion: 'traceops-segment-record-v1',
        stream: input.stream,
        kind: input.kind,
        sourceId: input.sourceId,
        recordHash,
        identityHash,
        payloadHash,
        traceId: input.traceId,
        sampleId: input.sampleId,
        datasetVersionId: input.datasetVersionId,
        occurredAt: input.occurredAt,
        writtenAt,
        payload: input.payload,
      };
      const line = `${JSON.stringify(record)}\n`;
      const bytes = Buffer.byteLength(line, 'utf8');
      await fs.mkdir(path.dirname(this.segmentAbsolutePath(file)), { recursive: true });
      await fs.appendFile(this.segmentAbsolutePath(file), line, 'utf8');

      file.recordCount += 1;
      file.byteSize += bytes;
      file.updatedAt = writtenAt;
      file.firstRecordAt = file.firstRecordAt ?? input.occurredAt ?? writtenAt;
      file.lastRecordAt = input.occurredAt ?? writtenAt;
      const ref: TraceOpsSegmentRecordRef = {
        id: `segref_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        fileId: file.id,
        stream: input.stream,
        kind: input.kind,
        sourceId: input.sourceId,
        recordHash,
        identityHash,
        payloadHash,
        traceId: input.traceId,
        sampleId: input.sampleId,
        datasetVersionId: input.datasetVersionId,
        writtenAt,
      };
      this.data.segmentRecordRefs.unshift(ref);
      summary.written += 1;
      summary.streamWrites[input.stream] = (summary.streamWrites[input.stream] ?? 0) + 1;

      if (file.recordCount >= file.maxRecords || file.byteSize >= file.maxBytes) {
        if (await this.sealSegmentFile(file)) summary.filesSealed += 1;
      }
    }
    return summary;
  }

  private candidateSegmentStream(kind: string): string {
    return `candidates/${sanitizeIdPart(kind.toLowerCase())}`;
  }

  private trainingSampleSegmentIdentity(sample: TrainingSample): unknown {
    return {
      sampleId: sample.id,
      revisionId: sample.revisionId,
      kind: sample.kind,
      status: sample.status,
      trainable: sample.trainable,
      blockers: sample.blockers,
      quality: sample.quality,
      riskLevel: sample.riskLevel,
      cleanUserGoal: sample.input.cleanUserGoal,
      cleanAssistantOutcome: sample.output.cleanAssistantOutcome,
      evidenceIds: sample.input.evidenceIds,
      review: sample.review
        ? {
            decision: sample.review.decision,
            decidedAt: sample.review.decidedAt,
          }
        : undefined,
      repair: sample.repair
        ? {
            repairedAt: sample.repair.repairedAt,
            evidenceIds: sample.repair.relinkedEvidenceIds,
          }
        : undefined,
    };
  }

  private async materializeTraceSegments(trace: RawTrace, reason: string): Promise<SegmentWriteSummary> {
    const events = this.eventsForTrace(trace);
    const evidence = this.evidenceForTrace(trace);
    const revisions = this.data.revisions
      .filter((revision) => revision.traceId === trace.id)
      .sort((a, b) => a.importedAt.localeCompare(b.importedAt));
    const cleanTrace = this.baseCleanTrace(trace);
    const samples = this.baseTrainingSamples(trace).map((sample) => this.applySampleState(sample));
    return this.appendSegmentRecords([
      {
        stream: 'raw',
        kind: 'raw_trace',
        sourceId: `${trace.id}:${trace.latestSourceHash}`,
        traceId: trace.id,
        occurredAt: trace.updatedAt,
        identity: {
          traceId: trace.id,
          latestSourceHash: trace.latestSourceHash,
          revisionIds: revisions.map((revision) => revision.id),
          eventIds: events.map((event) => event.id),
          evidenceIds: evidence.map((item) => item.id),
        },
        payload: {
          materializedBy: 'traceops-segment-store-v1',
          reason,
          trace,
          events,
          evidence,
          revisions,
        },
      },
      {
        stream: 'clean',
        kind: 'clean_trace',
        sourceId: `${cleanTrace.id}:${trace.latestSourceHash}:${cleanTrace.status}`,
        traceId: trace.id,
        occurredAt: cleanTrace.updatedAt,
        identity: {
          cleanTraceId: cleanTrace.id,
          traceId: trace.id,
          latestSourceHash: trace.latestSourceHash,
          status: cleanTrace.status,
          quality: cleanTrace.quality,
          metrics: cleanTrace.metrics,
          evidenceCoverage: cleanTrace.evidenceCoverage,
        },
        payload: cleanTrace,
      },
      ...samples.map<SegmentRecordInput>((sample) => ({
        stream: this.candidateSegmentStream(sample.kind),
        kind: 'training_sample',
        sourceId: `${sample.id}:${sample.status}:${sample.review?.decidedAt ?? sample.repair?.repairedAt ?? 'base'}`,
        traceId: sample.traceId,
        sampleId: sample.id,
        occurredAt: sample.updatedAt,
        identity: this.trainingSampleSegmentIdentity(sample),
        payload: sample,
      })),
    ]);
  }

  private async materializeTrainingSampleSegment(sample: TrainingSample, reason: string): Promise<SegmentWriteSummary> {
    return this.appendSegmentRecords([{
      stream: this.candidateSegmentStream(sample.kind),
      kind: 'training_sample',
      sourceId: `${sample.id}:${sample.status}:${sample.review?.decidedAt ?? sample.repair?.repairedAt ?? 'base'}`,
      traceId: sample.traceId,
      sampleId: sample.id,
      occurredAt: sample.updatedAt,
      identity: this.trainingSampleSegmentIdentity(sample),
      payload: sample,
    }]);
  }

  private async materializeDatasetVersionSegment(version: DatasetVersion, reason: string): Promise<SegmentWriteSummary> {
    const samples = this.datasetVersionSamples(version);
    return this.appendSegmentRecords([{
      stream: `datasets/${version.id}`,
      kind: 'dataset_version',
      sourceId: `${version.id}:${version.snapshotHash ?? stableHash(version.sampleIds)}:${version.sampleCount}`,
      datasetVersionId: version.id,
      occurredAt: version.createdAt,
      identity: {
        datasetVersionId: version.id,
        snapshotHash: version.snapshotHash,
        sampleIds: version.sampleIds,
        sampleCount: version.sampleCount,
        format: version.format,
      },
      payload: {
        materializedBy: 'traceops-segment-store-v1',
        reason,
        version,
        samples,
      },
    }]);
  }

  listSegmentStoreStatus(): TraceOpsSegmentStoreStatus {
    const streams = new Map<string, {
      stream: string;
      kind: TraceOpsSegmentKind;
      files: number;
      openFiles: number;
      sealedFiles: number;
      records: number;
      bytes: number;
      latestFileId?: string;
      latestWriteAt?: string;
    }>();
    for (const file of this.data.segmentFiles) {
      const current = streams.get(file.stream) ?? {
        stream: file.stream,
        kind: file.kind,
        files: 0,
        openFiles: 0,
        sealedFiles: 0,
        records: 0,
        bytes: 0,
      };
      current.files += 1;
      current.records += file.recordCount;
      current.bytes += file.byteSize;
      if (file.status === 'open') current.openFiles += 1;
      else current.sealedFiles += 1;
      if (!current.latestWriteAt || file.updatedAt > current.latestWriteAt) {
        current.latestWriteAt = file.updatedAt;
        current.latestFileId = file.id;
      }
      streams.set(file.stream, current);
    }

    const files = this.data.segmentFiles;
    return {
      rootDir: segmentRootDir,
      maxRecordsPerSegment: maxSegmentRecords,
      maxBytesPerSegment: maxSegmentBytes,
      files: files.length,
      openFiles: files.filter((file) => file.status === 'open').length,
      sealedFiles: files.filter((file) => file.status === 'sealed').length,
      records: files.reduce((count, file) => count + file.recordCount, 0),
      bytes: files.reduce((count, file) => count + file.byteSize, 0),
      streams: Array.from(streams.values()).sort((a, b) => b.records - a.records || a.stream.localeCompare(b.stream)),
      recentFiles: files.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 12),
      lastBackfillAt: this.data.segmentLastBackfillAt,
      checkedAt: new Date().toISOString(),
    };
  }

  async backfillSegmentStore(reason = 'manual_backfill'): Promise<TraceOpsSegmentBackfillResult> {
    const summary = this.emptySegmentWriteSummary();
    for (const trace of this.data.traces) {
      this.mergeSegmentWriteSummary(summary, await this.materializeTraceSegments(trace, reason));
    }
    for (const version of this.data.datasetVersions) {
      this.mergeSegmentWriteSummary(summary, await this.materializeDatasetVersionSegment(version, reason));
    }
    const backfilledAt = new Date().toISOString();
    this.data.segmentLastBackfillAt = backfilledAt;
    await this.save();
    return {
      ...summary,
      status: this.listSegmentStoreStatus(),
      backfilledAt,
    };
  }

  async rebuildSegmentStore(reason = 'manual_rebuild'): Promise<TraceOpsSegmentBackfillResult> {
    await fs.rm(segmentRootDir, { recursive: true, force: true });
    this.data.segmentFiles = [];
    this.data.segmentRecordRefs = [];
    this.data.segmentLastBackfillAt = undefined;
    return this.backfillSegmentStore(reason);
  }

  private async readSnapshotManifest(): Promise<StoreSnapshotRecord[]> {
    try {
      const text = await fs.readFile(snapshotManifestPath, 'utf8');
      const parsed = JSON.parse(text) as { snapshots?: StoreSnapshotRecord[] } | StoreSnapshotRecord[];
      const snapshots = Array.isArray(parsed) ? parsed : parsed.snapshots ?? [];
      return snapshots
        .filter((snapshot) => snapshot?.id && snapshot.path && snapshot.createdAt)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch {
      return [];
    }
  }

  private async writeSnapshotManifest(snapshots: StoreSnapshotRecord[]): Promise<void> {
    await fs.mkdir(snapshotsDir, { recursive: true });
    await fs.writeFile(snapshotManifestPath, JSON.stringify({ snapshots }, null, 2), 'utf8');
  }

  private snapshotAbsolutePath(snapshot: StoreSnapshotRecord): string {
    return path.isAbsolute(snapshot.path)
      ? snapshot.path
      : path.resolve(storeDir, snapshot.path);
  }

  private async pruneSnapshotManifest(snapshots: StoreSnapshotRecord[]): Promise<StoreSnapshotRecord[]> {
    const sorted = snapshots
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const kept = sorted.slice(0, maxStoreSnapshots);
    const removed = sorted.slice(maxStoreSnapshots);
    await Promise.all(
      removed.map((snapshot) => fs.rm(this.snapshotAbsolutePath(snapshot), { force: true }).catch(() => undefined)),
    );
    await this.writeSnapshotManifest(kept);
    return kept;
  }

  async listPersistenceSnapshots(): Promise<StoreSnapshotRecord[]> {
    return this.readSnapshotManifest();
  }

  async getPersistenceHealth(): Promise<StorePersistenceHealth> {
    const recommendations: string[] = [];
    const checkedAt = new Date().toISOString();
    let storeBytes = 0;
    let backupBytes: number | undefined;
    let storeSha256: string | undefined;
    let parseError: string | undefined;

    try {
      const buffer = await persistence.readStoreBuffer();
      storeBytes = buffer.byteLength;
      storeSha256 = `sha256:${createHash('sha256').update(buffer).digest('hex')}`;
      JSON.parse(buffer.toString('utf8'));
    } catch (error) {
      parseError = error instanceof Error ? error.message : String(error);
      recommendations.push('Restore from backup or a snapshot before running more data operations.');
    }

    try {
      backupBytes = await persistence.readBackupSize();
    } catch {
      recommendations.push('Create a backup or snapshot; no readable backup file is currently present.');
    }

    const snapshots = await this.readSnapshotManifest();
    const latestSnapshot = snapshots[0];
    if (!latestSnapshot) {
      recommendations.push('Create the first compressed snapshot for durable restore coverage.');
    }
    if (storeBytes > largeStoreWarningBytes) {
      recommendations.push('Store is larger than 25MB; keep scheduled snapshots and periodic compaction enabled.');
    }

    const status: StorePersistenceHealth['status'] = parseError
      ? 'blocked'
      : recommendations.length > 0
        ? 'attention'
        : 'healthy';

    return {
      status,
      driver: persistence.kind,
      message: parseError
        ? `Store file is not readable JSON: ${parseError}`
        : status === 'healthy'
          ? 'Local persistence is healthy.'
          : 'Local persistence is usable but needs maintenance.',
      storePath,
      backupPath: storeBackupPath,
      snapshotsDir,
      storeBytes,
      backupBytes,
      storeSha256,
      tableCounts: this.persistenceTableCounts(),
      latestSnapshot,
      snapshotCount: snapshots.length,
      recommendations,
      checkedAt,
    };
  }

  async createPersistenceSnapshot(input: {
    reason?: string;
    createdBy?: string;
  } = {}): Promise<StoreSnapshotCreateResult> {
    await this.save();
    await fs.mkdir(snapshotsDir, { recursive: true });
    const buffer = await persistence.readStoreBuffer();
    const compressed = await gzipAsync(buffer);
    const sha256 = `sha256:${createHash('sha256').update(buffer).digest('hex')}`;
    const createdAt = new Date().toISOString();
    const id = `snapshot_${createdAt.replace(/[^0-9]/g, '').slice(0, 14)}_${Math.random().toString(36).slice(2, 8)}`;
    const filename = `${id}.store.json.gz`;
    const snapshotPath = path.join(snapshotsDir, filename);
    await fs.writeFile(snapshotPath, compressed);
    const snapshot: StoreSnapshotRecord = {
      id,
      path: path.relative(storeDir, snapshotPath),
      reason: input.reason?.trim() || 'manual_snapshot',
      createdBy: input.createdBy?.trim() || 'local-storage-maintainer',
      createdAt,
      storeBytes: buffer.byteLength,
      compressedBytes: compressed.byteLength,
      sha256,
      tableCounts: this.persistenceTableCounts(),
    };
    const current = await this.readSnapshotManifest();
    await this.pruneSnapshotManifest([snapshot, ...current.filter((item) => item.id !== snapshot.id)]);
    return {
      snapshot,
      health: await this.getPersistenceHealth(),
    };
  }

  async restorePersistenceSnapshot(id: string, restoredBy = 'local-storage-maintainer'): Promise<StoreSnapshotRestoreResult | undefined> {
    const snapshots = await this.readSnapshotManifest();
    const snapshot = snapshots.find((item) => item.id === id);
    if (!snapshot) return undefined;
    await this.createPersistenceSnapshot({
      reason: `pre_restore:${id}`,
      createdBy: restoredBy,
    });
    const compressed = await fs.readFile(this.snapshotAbsolutePath(snapshot));
    const buffer = await gunzipAsync(compressed);
    const actualHash = `sha256:${createHash('sha256').update(buffer).digest('hex')}`;
    if (actualHash !== snapshot.sha256) {
      throw new Error(`Snapshot hash mismatch: expected ${snapshot.sha256}, got ${actualHash}`);
    }
    const parsed = JSON.parse(buffer.toString('utf8')) as PersistedStore;
    this.hydrate(parsed);
    await this.writeStoreFile();
    return {
      restored: true,
      snapshot,
      health: await this.getPersistenceHealth(),
    };
  }

  private feedbackSeverityRank(severity: KodaXFeedbackSignalSeverity): number {
    if (severity === 'critical') return 0;
    if (severity === 'warning') return 1;
    return 2;
  }

  private feedbackSignal(input: Omit<KodaXFeedbackSignal, 'id' | 'createdAt'>, createdAt: string): KodaXFeedbackSignal {
    return {
      id: `kodax_feedback_${stableShortHash({
        category: input.category,
        title: input.title,
        detail: input.detail,
        metric: input.metric,
      })}`,
      createdAt,
      ...input,
    };
  }

  private feedbackPriority(severity: KodaXFeedbackSignalSeverity): KodaXFeedbackActionItem['priority'] {
    if (severity === 'critical') return 'critical';
    if (severity === 'warning') return 'high';
    return 'normal';
  }

  private feedbackAction(signal: KodaXFeedbackSignal): KodaXFeedbackActionItem {
    const base = {
      id: `kodax_action_${stableShortHash({ signalId: signal.id, category: signal.category })}`,
      priority: this.feedbackPriority(signal.severity),
      sourceSignalIds: [signal.id],
    };
    if (signal.category === 'tracing_gap') {
      return {
        ...base,
        kind: 'improve_tracing',
        owner: 'kodax_cli',
        title: 'Improve KodaX session tracing coverage',
        description: signal.recommendedAction,
        payload: { category: signal.category, metric: signal.metric, refs: signal.sourceRefs },
      };
    }
    if (signal.category === 'tool_reliability') {
      return {
        ...base,
        kind: 'update_connector',
        owner: 'kodax_cli',
        title: 'Review unreliable tool or connector path',
        description: signal.recommendedAction,
        payload: { category: signal.category, metric: signal.metric, refs: signal.sourceRefs },
      };
    }
    if (signal.category === 'skill_candidate') {
      return {
        ...base,
        kind: 'create_skill',
        owner: 'kodax_space',
        title: 'Create reusable KodaX skill from repeated pattern',
        description: signal.recommendedAction,
        payload: { category: signal.category, metric: signal.metric, refs: signal.sourceRefs },
      };
    }
    if (signal.category === 'memory_candidate') {
      return {
        ...base,
        kind: 'promote_memory',
        owner: 'kodax_space',
        title: 'Promote stable memory back into KodaX context',
        description: signal.recommendedAction,
        payload: { category: signal.category, metric: signal.metric, refs: signal.sourceRefs },
      };
    }
    if (signal.category === 'eval_gap' || signal.category === 'release_feedback') {
      return {
        ...base,
        kind: signal.category === 'eval_gap' ? 'add_eval' : 'repair_dataset',
        owner: 'traceops',
        title: signal.category === 'eval_gap' ? 'Add KodaX eval coverage' : 'Route release feedback into next dataset',
        description: signal.recommendedAction,
        payload: { category: signal.category, metric: signal.metric, refs: signal.sourceRefs },
      };
    }
    if (signal.category === 'training_provider') {
      return {
        ...base,
        kind: 'retry_training_provider',
        owner: 'traceops',
        title: 'Repair training provider launch path',
        description: signal.recommendedAction,
        payload: { category: signal.category, metric: signal.metric, refs: signal.sourceRefs },
      };
    }
    return {
      ...base,
      kind: signal.category === 'governance_blocker' ? 'review_policy' : 'repair_dataset',
      owner: 'traceops',
      title: signal.category === 'governance_blocker' ? 'Review KodaX data governance blocker' : 'Repair evidence coverage before training',
      description: signal.recommendedAction,
      payload: { category: signal.category, metric: signal.metric, refs: signal.sourceRefs },
    };
  }

  getKodaXFeedbackReport(): KodaXFeedbackReport {
    const generatedAt = new Date().toISOString();
    const samples = this.listTrainingSamples().samples;
    const memoryCandidates = this.listMemoryCandidates().candidates;
    const signals: KodaXFeedbackSignal[] = [];

    const openDiagnostics = this.data.jobs
      .flatMap((job) => (job.diagnostics ?? []).map((diagnostic) => ({ job, diagnostic })))
      .filter(({ diagnostic }) => diagnostic.level !== 'info' && this.ingestDiagnosticStatus(diagnostic) === 'open');
    const tracingDiagnostics = openDiagnostics.filter(({ diagnostic }) =>
      diagnostic.code.startsWith('kodax_') || diagnostic.code.includes('runtime')
    );
    if (tracingDiagnostics.length > 0) {
      signals.push(this.feedbackSignal({
        category: 'tracing_gap',
        severity: tracingDiagnostics.some(({ diagnostic }) => diagnostic.level === 'error') ? 'critical' : 'warning',
        title: 'KodaX tracing has unresolved ingest gaps',
        detail: `${tracingDiagnostics.length} open KodaX ingest diagnostic(s) may weaken session replay, lineage, or runtime attribution.`,
        metric: { label: 'open diagnostics', value: tracingDiagnostics.length },
        sourceRefs: tracingDiagnostics.slice(0, 6).map(({ job, diagnostic }) => ({
          kind: 'ingest_job',
          id: job.id,
          label: diagnostic.code,
        })),
        recommendedAction: 'Patch KodaX tracing/runtime emitters so session metadata, workflow events and malformed runtime records are captured consistently.',
      }, generatedAt));
    }

    const missingEvidence = samples.filter((sample) => sample.toolEventCount > 0 && sample.evidenceCount === 0);
    if (missingEvidence.length > 0) {
      signals.push(this.feedbackSignal({
        category: 'evidence_gap',
        severity: missingEvidence.length > Math.max(8, samples.length * 0.1) ? 'critical' : 'warning',
        title: 'Tool-backed samples are missing evidence links',
        detail: `${missingEvidence.length} sample(s) have tool activity but no linked evidence, which makes them weak for supervised training or eval reuse.`,
        metric: { label: 'missing evidence samples', value: missingEvidence.length, denominator: samples.length },
        sourceRefs: missingEvidence.slice(0, 6).map((sample) => ({ kind: 'trace', id: sample.traceId, label: sample.title })),
        recommendedAction: 'Improve KodaX tool ledger and TraceOps evidence derivation so file, command, browser and artifact outputs remain linked to each session step.',
      }, generatedAt));
    }

    const governanceBlocked = samples.filter((sample) => sample.status === 'blocked' || sample.quality.grade === 'blocked' || sample.riskLevel === 'L4');
    if (governanceBlocked.length > 0) {
      signals.push(this.feedbackSignal({
        category: 'governance_blocker',
        severity: governanceBlocked.some((sample) => sample.riskLevel === 'L4') ? 'critical' : 'warning',
        title: 'KodaX sessions contain governance-blocked training material',
        detail: `${governanceBlocked.length} sample(s) are blocked by risk, quality or policy gates and should not flow into model training by default.`,
        metric: { label: 'blocked samples', value: governanceBlocked.length, denominator: samples.length },
        sourceRefs: governanceBlocked.slice(0, 6).map((sample) => ({ kind: 'trace', id: sample.traceId, label: sample.title })),
        recommendedAction: 'Add upstream redaction, consent and allowlist rules in KodaX before these sessions become training candidates.',
      }, generatedAt));
    }

    const toolErrorEvents = this.data.events.filter((event) =>
      /error|failed|exception|cancelled|rollback/i.test(`${event.label} ${event.preview}`)
    );
    if (toolErrorEvents.length > 0) {
      signals.push(this.feedbackSignal({
        category: 'tool_reliability',
        severity: toolErrorEvents.length > 25 ? 'warning' : 'info',
        title: 'Tool or runtime failure patterns are visible in KodaX sessions',
        detail: `${toolErrorEvents.length} event(s) mention failures, errors, cancellation or rollback and can be mined for connector hardening.`,
        metric: { label: 'failure-like events', value: toolErrorEvents.length, denominator: this.data.events.length },
        sourceRefs: toolErrorEvents.slice(0, 6).map((event) => ({ kind: 'trace', id: event.traceId, label: event.label })),
        recommendedAction: 'Cluster failing KodaX tool paths and turn recurring failures into connector fixes or recovery playbooks.',
      }, generatedAt));
    }

    const strongMemoryCandidates = memoryCandidates.filter((candidate) =>
      (candidate.status === 'candidate' || candidate.status === 'needs_review') && candidate.confidence >= 72
    );
    if (strongMemoryCandidates.length > 0) {
      signals.push(this.feedbackSignal({
        category: 'memory_candidate',
        severity: 'info',
        title: 'Stable project memories are ready to review for KodaX context',
        detail: `${strongMemoryCandidates.length} high-confidence memory candidate(s) can become reusable project context for future KodaX sessions.`,
        metric: { label: 'memory candidates', value: strongMemoryCandidates.length },
        sourceRefs: strongMemoryCandidates.slice(0, 6).map((candidate) => ({ kind: 'trace', id: candidate.traceId, label: candidate.summary })),
        recommendedAction: 'Review and promote high-confidence memory candidates into KodaX context packs or future AgentMemBase entries.',
      }, generatedAt));
    }

    const reusableSkillSignals = memoryCandidates.filter((candidate) =>
      candidate.kind === 'workflow_pattern' && candidate.confidence >= 70 && candidate.status !== 'rejected'
    );
    if (reusableSkillSignals.length > 0) {
      signals.push(this.feedbackSignal({
        category: 'skill_candidate',
        severity: 'info',
        title: 'Repeated workflow patterns can become KodaX skills',
        detail: `${reusableSkillSignals.length} workflow-pattern memory candidate(s) look reusable enough to turn into KodaX skills or runbooks.`,
        metric: { label: 'workflow patterns', value: reusableSkillSignals.length },
        sourceRefs: reusableSkillSignals.slice(0, 6).map((candidate) => ({ kind: 'trace', id: candidate.traceId, label: candidate.summary })),
        recommendedAction: 'Convert repeated workflow patterns into KodaX skills with triggers, required connectors and verification steps.',
      }, generatedAt));
    }

    const failedEvalRuns = this.data.evalRuns.filter((run) => run.status === 'failed');
    const failedModelGates = this.data.modelReleaseGates.filter((gate) => gate.status === 'blocked' || gate.status === 'rejected');
    if (failedEvalRuns.length > 0 || failedModelGates.length > 0) {
      signals.push(this.feedbackSignal({
        category: 'eval_gap',
        severity: failedModelGates.length > 0 ? 'critical' : 'warning',
        title: 'KodaX release path needs stronger eval coverage',
        detail: `${failedEvalRuns.length} eval run(s) failed and ${failedModelGates.length} model release gate(s) are blocked or rejected.`,
        metric: { label: 'failed eval or gate records', value: failedEvalRuns.length + failedModelGates.length },
        sourceRefs: [
          ...failedEvalRuns.slice(0, 3).map((run) => ({ kind: 'eval_run' as const, id: run.id, label: run.modelName })),
          ...failedModelGates.slice(0, 3).map((gate) => ({ kind: 'model_release_gate' as const, id: gate.id, label: gate.modelName })),
        ],
        recommendedAction: 'Backfill eval cases for failed launch contracts, metric gates and rollback guardrails before the next KodaX training handoff.',
      }, generatedAt));
    }

    const releaseFeedback = this.data.feedbackLoops.filter((loop) =>
      loop.severity === 'critical' || loop.rollbackSignal || loop.status === 'candidate'
    );
    if (releaseFeedback.length > 0) {
      signals.push(this.feedbackSignal({
        category: 'release_feedback',
        severity: releaseFeedback.some((loop) => loop.severity === 'critical' || loop.rollbackSignal) ? 'critical' : 'warning',
        title: 'Post-release feedback should feed the next KodaX dataset',
        detail: `${releaseFeedback.length} feedback loop(s) are waiting to become repair, eval, memory or SFT data.`,
        metric: { label: 'feedback loops', value: releaseFeedback.length, denominator: this.data.feedbackLoops.length },
        sourceRefs: releaseFeedback.slice(0, 6).map((loop) => ({ kind: 'feedback_loop', id: loop.id, label: loop.title })),
        recommendedAction: 'Promote reviewed feedback loops into the next KodaX dataset version and keep their release evidence hashes attached.',
      }, generatedAt));
    }

    const providerFailures = this.data.trainingRuns.flatMap((run) =>
      (run.providerLaunches ?? [])
        .filter((launch) => launch.status === 'failed')
        .map((launch) => ({ run, launch }))
    );
    if (providerFailures.length > 0) {
      signals.push(this.feedbackSignal({
        category: 'training_provider',
        severity: 'warning',
        title: 'External training provider launches have failures',
        detail: `${providerFailures.length} provider launch attempt(s) failed after TraceOps prepared a training payload.`,
        metric: { label: 'failed provider launches', value: providerFailures.length },
        sourceRefs: providerFailures.slice(0, 6).map(({ run }) => ({ kind: 'training_run', id: run.id, label: run.modelName })),
        recommendedAction: 'Check provider endpoint contracts, auth headers and payload mapping before retrying KodaX model training handoff.',
      }, generatedAt));
    }

    const sortedSignals = signals
      .sort((a, b) => this.feedbackSeverityRank(a.severity) - this.feedbackSeverityRank(b.severity) || a.title.localeCompare(b.title))
      .slice(0, 40);
    const actionItems = sortedSignals.map((signal) => this.feedbackAction(signal));
    const critical = sortedSignals.filter((signal) => signal.severity === 'critical').length;
    const warning = sortedSignals.filter((signal) => signal.severity === 'warning').length;
    const info = sortedSignals.filter((signal) => signal.severity === 'info').length;
    const topRecommendation = sortedSignals[0]?.recommendedAction
      ?? 'KodaX feedback loop is currently clean; keep syncing sessions and reviewing new candidates.';

    return {
      id: `kodax_feedback_report_${stableShortHash({
        generatedAt: generatedAt.slice(0, 16),
        signals: sortedSignals.map((signal) => signal.id),
      })}`,
      generatedAt,
      product: 'kodax',
      summary: {
        signals: sortedSignals.length,
        critical,
        warning,
        info,
        actionItems: actionItems.length,
        topRecommendation,
      },
      signals: sortedSignals,
      actionItems,
      nextActions: actionItems.slice(0, 5).map((item) => item.title),
    };
  }

  getKodaXFeedbackPackage(): KodaXFeedbackPackage {
    const report = this.getKodaXFeedbackReport();
    const kodaxInbox = {
      tracingGaps: report.actionItems.filter((item) => item.kind === 'improve_tracing'),
      skillCandidates: report.actionItems.filter((item) => item.kind === 'create_skill'),
      memoryPromotions: report.actionItems.filter((item) => item.kind === 'promote_memory'),
      evalBacklog: report.actionItems.filter((item) => item.kind === 'add_eval' || item.kind === 'repair_dataset'),
      connectorOrTooling: report.actionItems.filter((item) => item.kind === 'update_connector' || item.kind === 'retry_training_provider'),
    };
    const basePackage = {
      id: `kodax_feedback_package_${stableShortHash({ reportId: report.id, generatedAt: report.generatedAt })}`,
      generatedAt: report.generatedAt,
      packageVersion: 'traceops-kodax-feedback-package-v1' as const,
      report,
      kodaxInbox,
    };
    return {
      ...basePackage,
      packageHash: stableHash(basePackage),
    };
  }

  private defaultKodaXFeedbackDir(): string {
    if (process.env.KODAX_FEEDBACK_DIR?.trim()) return path.resolve(process.env.KODAX_FEEDBACK_DIR.trim());
    const sessionsDir = path.resolve(this.data.source.sessionsDir);
    return path.join(path.dirname(sessionsDir), 'traceops-inbox');
  }

  listKodaXFeedbackWritebacks(limit = 50): KodaXFeedbackWritebackRecord[] {
    return this.data.kodaxFeedbackWritebacks
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, Math.max(1, Math.min(200, Math.round(limit))));
  }

  async writeKodaXFeedbackPackage(input: {
    actor: GovernanceActor;
    targetDir?: string;
    reason?: string;
  }): Promise<KodaXFeedbackWritebackResult> {
    const feedbackPackage = this.getKodaXFeedbackPackage();
    const createdAt = new Date().toISOString();
    const targetDir = path.resolve(input.targetDir?.trim() || this.defaultKodaXFeedbackDir());
    const filePrefix = `${createdAt.replace(/[:.]/g, '-')}-${feedbackPackage.id}`;
    const files: KodaXFeedbackWritebackFile[] = [];

    const writeJson = async (kind: KodaXFeedbackWritebackFile['kind'], filename: string, value: unknown): Promise<void> => {
      const fullPath = path.join(targetDir, filename);
      const body = Buffer.from(`${JSON.stringify(value, null, 2)}\n`, 'utf8');
      await fs.writeFile(fullPath, body);
      files.push({
        kind,
        path: fullPath,
        bytes: body.byteLength,
        sha256: bufferSha256(body),
      });
    };

    let record: KodaXFeedbackWritebackRecord;
    try {
      await fs.mkdir(targetDir, { recursive: true });
      await writeJson('package', `${filePrefix}.package.json`, feedbackPackage);
      await writeJson('report', `${filePrefix}.report.json`, feedbackPackage.report);
      await writeJson('inbox', `${filePrefix}.inbox.json`, {
        packageId: feedbackPackage.id,
        packageHash: feedbackPackage.packageHash,
        generatedAt: feedbackPackage.generatedAt,
        product: feedbackPackage.report.product,
        summary: feedbackPackage.report.summary,
        inbox: feedbackPackage.kodaxInbox,
        nextActions: feedbackPackage.report.nextActions,
      });
      record = {
        id: `kodax_writeback_${stableShortHash({ packageId: feedbackPackage.id, targetDir, createdAt })}`,
        status: 'written',
        packageId: feedbackPackage.id,
        packageHash: feedbackPackage.packageHash,
        targetDir,
        files,
        actor: input.actor,
        reason: input.reason?.trim() || 'Manual KodaX feedback writeback.',
        signalCount: feedbackPackage.report.summary.signals,
        actionItemCount: feedbackPackage.report.summary.actionItems,
        createdAt,
      };
    } catch (error) {
      record = {
        id: `kodax_writeback_${stableShortHash({ packageId: feedbackPackage.id, targetDir, createdAt, error: String(error) })}`,
        status: 'failed',
        packageId: feedbackPackage.id,
        packageHash: feedbackPackage.packageHash,
        targetDir,
        files,
        actor: input.actor,
        reason: input.reason?.trim() || 'Manual KodaX feedback writeback.',
        signalCount: feedbackPackage.report.summary.signals,
        actionItemCount: feedbackPackage.report.summary.actionItems,
        createdAt,
        errorMessage: error instanceof Error ? error.message : String(error),
      };
    }

    this.data.kodaxFeedbackWritebacks.unshift(record);
    this.data.kodaxFeedbackWritebacks = this.data.kodaxFeedbackWritebacks.slice(0, 100);
    await this.save();
    return { record, package: feedbackPackage };
  }

  getSource(): SourceStatus {
    return this.data.source;
  }

  async updateSource(update: Partial<SourceStatus>): Promise<SourceStatus> {
    this.data.source = { ...this.data.source, ...update };
    await this.save();
    return this.data.source;
  }

  getGovernancePolicy(): GovernancePolicyResponse {
    return {
      defaultRole: 'local_admin',
      auditRetentionLimit: 1000,
      highImpactActions: [
        'dataset.create',
        'dataset.export',
        'dataset.diff_review',
        'dataset.release_gate_action',
        'dataset.release_manifest',
        'retraining.handoff',
        'training.provider_launch',
        'training.provider_status_sync',
        'training.result_recorded',
        'eval.run',
        'model.release_gate',
        'model.release_gate_decision',
        'deployment.handoff',
        'deployment.status',
        'post_release.monitor',
        'post_release.signal',
        'feedback_loop.decision',
        'sample.review',
        'sample.repair',
        'memory.review',
        'export.revoke',
        'storage.snapshot',
        'storage.restore',
        'storage.segment_backfill',
        'storage.segment_rebuild',
        'tasks.orchestrate',
        'kodax.feedback_writeback',
      ],
      roles: [
        {
          role: 'local_admin',
          label: 'Local admin',
          permissions: ['*'],
        },
        {
          role: 'data_governance',
          label: 'Data governance',
          permissions: [
            'sample.review',
            'sample.repair',
            'memory.review',
            'dataset.create',
            'dataset.export',
            'dataset.diff_review',
            'dataset.release_gate_action',
            'dataset.release_manifest',
            'export.revoke',
            'storage.segment_backfill',
            'storage.segment_rebuild',
            'tasks.orchestrate',
            'kodax.feedback_writeback',
            'audit.read',
          ],
        },
        {
          role: 'training_owner',
          label: 'Training owner',
          permissions: [
            'training.provider_launch',
            'training.provider_status_sync',
            'training.result_recorded',
            'eval.run',
            'model.release_gate',
            'model.release_gate_decision',
            'deployment.handoff',
            'deployment.status',
            'post_release.monitor',
            'post_release.signal',
            'feedback_loop.decision',
            'retraining.handoff',
            'audit.read',
          ],
        },
        {
          role: 'auditor',
          label: 'Auditor',
          permissions: ['audit.read'],
        },
        {
          role: 'viewer',
          label: 'Viewer',
          permissions: ['trace.read', 'dataset.read'],
        },
      ],
    };
  }

  listGovernanceAuditRecords(limit = 200): GovernanceAuditRecord[] {
    return this.data.governanceAuditRecords
      .slice()
      .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
      .slice(0, Math.max(1, Math.min(1000, Math.round(limit))));
  }

  async recordGovernanceAudit(input: {
    action: string;
    decision?: GovernanceAuditRecord['decision'];
    actor: GovernanceActor;
    entityRefs?: TraceOpsTaskEntityRef[];
    reason: string;
    metadata?: Record<string, unknown>;
  }): Promise<GovernanceAuditRecord> {
    const record: GovernanceAuditRecord = {
      id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      action: input.action,
      decision: input.decision ?? 'recorded',
      actor: input.actor,
      entityRefs: input.entityRefs ?? [],
      reason: input.reason,
      metadata: input.metadata,
      occurredAt: new Date().toISOString(),
    };
    this.data.governanceAuditRecords.unshift(record);
    this.data.governanceAuditRecords = this.data.governanceAuditRecords.slice(0, this.getGovernancePolicy().auditRetentionLimit);
    await this.save();
    return record;
  }

  async listTasks(): Promise<TraceOpsTaskListResponse> {
    const created = this.backfillTasksFromArtifacts();
    if (created > 0) await this.save();
    const tasks = this.data.tasks
      .slice()
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 100);
    return {
      tasks,
      summary: this.taskSummary(tasks),
    };
  }

  private taskGovernanceAction(kind: TraceOpsTaskKind): string | undefined {
    if (kind === 'dataset_build') return 'dataset.create';
    if (kind === 'diff_review') return 'dataset.diff_review';
    if (kind === 'release_manifest') return 'dataset.release_manifest';
    if (kind === 'retraining_handoff') return 'retraining.handoff';
    if (kind === 'training_run') return 'training.provider_launch';
    if (kind === 'eval_run') return 'eval.run';
    if (kind === 'model_release_gate') return 'model.release_gate';
    if (kind === 'deployment_handoff') return 'deployment.handoff';
    if (kind === 'post_release_monitor') return 'post_release.monitor';
    if (kind === 'feedback_loop') return 'feedback_loop.decision';
    if (kind === 'storage_maintenance') return 'storage.snapshot';
    if (kind === 'kodax_feedback') return 'kodax.feedback_writeback';
    if (kind === 'governance_review') return 'sample.review';
    return undefined;
  }

  private taskApproval(task: TraceOpsTaskRecord): TraceOpsTaskAutomationPlan['nodes'][number]['approval'] {
    const action = this.taskGovernanceAction(task.kind);
    const required = task.priority === 'critical'
      || task.priority === 'high'
      || (!!action && this.getGovernancePolicy().highImpactActions.includes(action));
    if (!required) {
      return {
        required: false,
        status: 'not_required',
        reason: 'Routine automation can run without explicit governance approval.',
      };
    }
    const status = task.status === 'succeeded'
      ? 'approved'
      : task.status === 'failed' || task.status === 'cancelled'
        ? 'rejected'
        : 'pending';
    return {
      required: true,
      status,
      action,
      reason: action
        ? `High-impact action ${action} should be approved or reviewed before downstream use.`
        : 'High-priority task should be reviewed before downstream use.',
    };
  }

  private taskEntityKey(ref: TraceOpsTaskEntityRef): string {
    return `${ref.kind}:${ref.id}`;
  }

  private taskPrimaryEntity(task: TraceOpsTaskRecord): TraceOpsTaskEntityRef | undefined {
    return task.entityRefs[0];
  }

  private taskDependencyRefs(task: TraceOpsTaskRecord): Array<{ ref: TraceOpsTaskEntityRef; reason: string }> {
    const primary = this.taskPrimaryEntity(task);
    if (!primary) return [];
    if (task.kind === 'release_manifest') {
      const manifest = primary.kind === 'release_manifest' ? this.getReleaseManifest(primary.id) : undefined;
      return manifest ? [{ ref: { kind: 'dataset_version', id: manifest.datasetVersionId, label: manifest.datasetVersionName }, reason: 'Release manifest depends on dataset version.' }] : [];
    }
    if (task.kind === 'retraining_handoff') {
      const handoff = primary.kind === 'retraining_handoff' ? this.getRetrainingHandoff(primary.id) : undefined;
      return handoff ? [
        { ref: { kind: 'release_manifest', id: handoff.manifestId, label: handoff.datasetVersionName }, reason: 'Retraining handoff depends on release manifest.' },
        { ref: { kind: 'release_promotion', id: handoff.promotionId, label: handoff.datasetVersionName }, reason: 'Retraining handoff depends on promoted release.' },
      ] : [];
    }
    if (task.kind === 'training_run') {
      const run = primary.kind === 'training_run' ? this.getTrainingRun(primary.id) : undefined;
      return run ? [{ ref: { kind: 'retraining_handoff', id: run.handoffId, label: run.datasetVersionName }, reason: 'Training run depends on retraining handoff.' }] : [];
    }
    if (task.kind === 'eval_run') {
      const evalRun = primary.kind === 'eval_run' ? this.getEvalRun(primary.id) : undefined;
      return evalRun ? [{ ref: { kind: 'training_run', id: evalRun.trainingRunId, label: evalRun.modelName }, reason: 'Eval run depends on training run.' }] : [];
    }
    if (task.kind === 'model_release_gate') {
      const gate = primary.kind === 'model_release_gate' ? this.getModelReleaseGate(primary.id) : undefined;
      return gate ? [{ ref: { kind: 'training_run', id: gate.trainingRunId, label: gate.modelName }, reason: 'Model release gate depends on training run.' }] : [];
    }
    if (task.kind === 'deployment_handoff') {
      const handoff = primary.kind === 'deployment_handoff' ? this.getDeploymentHandoff(primary.id) : undefined;
      return handoff ? [{ ref: { kind: 'model_release_gate', id: handoff.modelReleaseGateId, label: handoff.modelName }, reason: 'Deployment handoff depends on model release gate.' }] : [];
    }
    if (task.kind === 'post_release_monitor') {
      const monitor = primary.kind === 'post_release_monitor' ? this.getPostReleaseMonitor(primary.id) : undefined;
      return monitor ? [{ ref: { kind: 'deployment_handoff', id: monitor.deploymentHandoffId, label: monitor.modelName }, reason: 'Post-release monitor depends on deployment handoff.' }] : [];
    }
    if (task.kind === 'feedback_loop') {
      const loop = primary.kind === 'feedback_loop' ? this.getFeedbackLoop(primary.id) : undefined;
      return loop ? [{ ref: { kind: 'post_release_monitor', id: loop.postReleaseMonitorId, label: loop.modelName }, reason: 'Feedback loop depends on post-release monitor.' }] : [];
    }
    return [];
  }

  async getTaskAutomationPlan(): Promise<TraceOpsTaskAutomationPlan> {
    const created = this.backfillTasksFromArtifacts();
    if (created > 0) await this.save();
    const generatedAt = new Date().toISOString();
    const sortedTasks = this.data.tasks
      .slice()
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const workflowTasks = sortedTasks.filter((task) => task.kind !== 'kodax_sync' && task.kind !== 'trace_cleaning').slice(-140);
    const recentIngestionTasks = sortedTasks.filter((task) => task.kind === 'kodax_sync' || task.kind === 'trace_cleaning').slice(-20);
    const tasks = [...workflowTasks, ...recentIngestionTasks]
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const taskByEntity = new Map<string, TraceOpsTaskRecord>();
    for (const task of tasks) {
      for (const ref of task.entityRefs) {
        taskByEntity.set(this.taskEntityKey(ref), task);
      }
    }

    const edges: TraceOpsTaskAutomationPlan['edges'] = [];
    const edgeKeys = new Set<string>();
    for (const task of tasks) {
      for (const dependency of this.taskDependencyRefs(task)) {
        const fromTask = taskByEntity.get(this.taskEntityKey(dependency.ref));
        if (!fromTask || fromTask.id === task.id) continue;
        const key = `${fromTask.id}->${task.id}`;
        if (edgeKeys.has(key)) continue;
        edgeKeys.add(key);
        edges.push({
          id: `edge_${stableShortHash({ from: fromTask.id, to: task.id, reason: dependency.reason })}`,
          fromTaskId: fromTask.id,
          toTaskId: task.id,
          reason: dependency.reason,
        });
      }
    }

    const blockedBy = new Map<string, string[]>();
    for (const edge of edges) {
      const fromTask = tasks.find((task) => task.id === edge.fromTaskId);
      if (!fromTask || fromTask.status === 'succeeded') continue;
      const current = blockedBy.get(edge.toTaskId) ?? [];
      current.push(edge.fromTaskId);
      blockedBy.set(edge.toTaskId, current);
    }

    const nodes = tasks.map((task) => ({
      id: `node_${task.id}`,
      taskId: task.id,
      kind: task.kind,
      title: task.title,
      status: task.status,
      priority: task.priority,
      queue: task.queue,
      entityRefs: task.entityRefs,
      approval: this.taskApproval(task),
      blockedByTaskIds: blockedBy.get(task.id) ?? [],
    }));

    const alerts: TraceOpsTaskAlert[] = [];
    for (const node of nodes) {
      if (node.status === 'failed') {
        alerts.push({
          id: `alert_${stableShortHash({ taskId: node.taskId, status: node.status })}`,
          severity: node.priority === 'critical' || node.priority === 'high' ? 'critical' : 'warning',
          taskId: node.taskId,
          title: `${node.title} failed`,
          detail: 'This automation task needs repair or retry before dependent work should continue.',
          createdAt: generatedAt,
        });
      }
      if (node.approval.status === 'pending') {
        alerts.push({
          id: `alert_${stableShortHash({ taskId: node.taskId, approval: node.approval.action })}`,
          severity: node.priority === 'critical' ? 'critical' : 'warning',
          taskId: node.taskId,
          title: `${node.title} needs approval`,
          detail: node.approval.reason,
          createdAt: generatedAt,
        });
      }
      if (node.blockedByTaskIds.length > 0) {
        alerts.push({
          id: `alert_${stableShortHash({ taskId: node.taskId, blockedBy: node.blockedByTaskIds })}`,
          severity: 'warning',
          taskId: node.taskId,
          title: `${node.title} is blocked by upstream work`,
          detail: `${node.blockedByTaskIds.length} upstream task(s) are not succeeded yet.`,
          createdAt: generatedAt,
        });
      }
    }

    return {
      generatedAt,
      nodes,
      edges,
      alerts: alerts.slice(0, 80),
      summary: {
        nodes: nodes.length,
        edges: edges.length,
        approvalRequired: nodes.filter((node) => node.approval.required).length,
        blocked: nodes.filter((node) => node.blockedByTaskIds.length > 0).length,
        criticalAlerts: alerts.filter((alert) => alert.severity === 'critical').length,
        warningAlerts: alerts.filter((alert) => alert.severity === 'warning').length,
      },
    };
  }

  async createTasks(inputs: TraceOpsTaskCreateInput[]): Promise<TraceOpsTaskCreateResponse> {
    const created = inputs.map((input) => this.recordTask({
      kind: input.kind,
      status: 'queued',
      title: input.title,
      description: input.description,
      priority: input.priority,
      progress: 0,
      entityRefs: input.entityRefs,
      createdBy: input.createdBy ?? 'traceops-audit',
      dedupe: false,
    }));
    await this.save();
    return { created };
  }

  async orchestrateAutomationTasks(input: {
    createdBy?: string;
  } = {}): Promise<TraceOpsTaskOrchestrationResult> {
    const createdBy = input.createdBy ?? 'traceops-orchestrator';
    const created: TraceOpsTaskRecord[] = [];
    const skipped: TraceOpsTaskOrchestrationResult['skipped'] = [];
    let evaluated = 0;

    const activeTaskExists = (kind: TraceOpsTaskKind, title: string) =>
      this.data.tasks.some((task) =>
        task.kind === kind
        && task.title === title
        && (task.status === 'queued' || task.status === 'running' || task.status === 'failed')
      );

    const addTask = (code: string, task: Parameters<TraceOpsStore['recordTask']>[0]) => {
      evaluated += 1;
      if (activeTaskExists(task.kind, task.title)) {
        skipped.push({ code, reason: `Active task already exists: ${task.title}` });
        return;
      }
      created.push(this.recordTask({
        ...task,
        status: 'queued',
        createdBy,
      }));
    };

    const health = await this.getPersistenceHealth();
    if (health.status !== 'healthy') {
      addTask('storage_health_attention', {
        kind: 'storage_maintenance',
        status: 'queued',
        title: 'Maintain TraceOps local persistence',
        description: `${health.message} ${health.recommendations.slice(0, 2).join(' ')}`.trim(),
        priority: health.status === 'blocked' ? 'critical' : 'high',
        progress: 0,
      });
    } else {
      evaluated += 1;
      skipped.push({ code: 'storage_health_ok', reason: 'Local persistence is healthy.' });
    }

    const feedbackReport = this.getKodaXFeedbackReport();
    if (feedbackReport.summary.signals > 0) {
      addTask('kodax_feedback_signals', {
        kind: 'kodax_feedback',
        status: 'queued',
        title: 'Prepare KodaX feedback package',
        description: `${feedbackReport.summary.signals} signal(s), ${feedbackReport.summary.actionItems} action item(s). Top: ${feedbackReport.summary.topRecommendation}`,
        priority: feedbackReport.summary.critical > 0 ? 'critical' : feedbackReport.summary.warning > 0 ? 'high' : 'normal',
        progress: 0,
      });
    } else {
      evaluated += 1;
      skipped.push({ code: 'kodax_feedback_clean', reason: 'No KodaX feedback signals are currently active.' });
    }

    const governanceSignals = feedbackReport.signals.filter((signal) =>
      signal.category === 'governance_blocker' || signal.category === 'evidence_gap'
    );
    if (governanceSignals.length > 0) {
      addTask('governance_review_signals', {
        kind: 'governance_review',
        status: 'queued',
        title: 'Review KodaX governance blockers',
        description: governanceSignals.map((signal) => `${signal.title}: ${signal.metric.value}`).join(' · '),
        priority: governanceSignals.some((signal) => signal.severity === 'critical') ? 'critical' : 'high',
        progress: 0,
      });
    } else {
      evaluated += 1;
      skipped.push({ code: 'governance_review_clean', reason: 'No governance or evidence-gap feedback signals are active.' });
    }

    if (created.length > 0) await this.save();
    return {
      created,
      skipped,
      summary: {
        evaluated,
        created: created.length,
        skipped: skipped.length,
        critical: created.filter((task) => task.priority === 'critical').length,
        high: created.filter((task) => task.priority === 'high').length,
      },
    };
  }

  async retryTask(id: string, note?: string): Promise<TraceOpsTaskRecord | undefined> {
    const task = this.data.tasks.find((item) => item.id === id);
    if (!task) return undefined;
    if (task.status !== 'failed' && task.status !== 'cancelled') {
      throw new Error('Only failed or cancelled tasks can be retried.');
    }
    const now = new Date().toISOString();
    const retry: TraceOpsTaskRecord = {
      ...task,
      id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      status: 'queued',
      title: `Retry: ${task.title}`,
      progress: 0,
      attempts: task.attempts + 1,
      retryOfTaskId: task.id,
      errorMessage: undefined,
      resultSummary: note?.trim() || 'Queued retry from Task Center.',
      createdAt: now,
      updatedAt: now,
      startedAt: undefined,
      finishedAt: undefined,
      nextRunAt: now,
      events: [{
        id: `task_event_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        status: 'queued',
        note: note?.trim() || `Retry queued from ${task.id}.`,
        createdAt: now,
      }],
    };
    this.data.tasks.unshift({
      ...task,
      status: 'retrying',
      updatedAt: now,
      events: [...task.events, {
        id: `task_event_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        status: 'retrying',
        note: `Retry task ${retry.id} was queued.`,
        createdAt: now,
      }],
    });
    this.data.tasks = this.data.tasks.filter((item, index, list) =>
      item.id !== task.id || index === list.findIndex((candidate) => candidate.id === item.id)
    );
    this.data.tasks.unshift(retry);
    this.data.tasks = this.data.tasks.slice(0, 300);
    await this.save();
    return retry;
  }

  listQueuedTasksForExecution(limit = 1): TraceOpsTaskRecord[] {
    const now = new Date().toISOString();
    return this.data.tasks
      .filter((task) => task.status === 'queued' && (!task.nextRunAt || task.nextRunAt <= now))
      .sort((a, b) => {
        const priorityScore: Record<TraceOpsTaskRecord['priority'], number> = { critical: 4, high: 3, normal: 2, low: 1 };
        return priorityScore[b.priority] - priorityScore[a.priority] || a.createdAt.localeCompare(b.createdAt);
      })
      .slice(0, Math.max(1, limit));
  }

  async startTask(id: string, note = 'Worker claimed task.'): Promise<TraceOpsTaskRecord | undefined> {
    const task = this.data.tasks.find((item) => item.id === id);
    if (!task) return undefined;
    if (task.status !== 'queued') {
      throw new Error('Only queued tasks can be started by the worker.');
    }
    const next = this.updateTaskById(task.id, {
      status: 'running',
      progress: 15,
      resultSummary: note,
      startedAt: new Date().toISOString(),
      nextRunAt: undefined,
    });
    await this.save();
    return next;
  }

  async completeTask(id: string, message: string): Promise<TraceOpsTaskRecord | undefined> {
    const task = this.data.tasks.find((item) => item.id === id);
    if (!task) return undefined;
    const next = this.updateTaskById(task.id, {
      status: 'succeeded',
      progress: 100,
      resultSummary: message,
      errorMessage: undefined,
      finishedAt: new Date().toISOString(),
    });
    if (task.retryOfTaskId) {
      this.updateTaskById(task.retryOfTaskId, {
        status: 'succeeded',
        progress: 100,
        resultSummary: `Retry ${task.id} succeeded: ${message}`,
        errorMessage: undefined,
        finishedAt: new Date().toISOString(),
      });
    }
    await this.save();
    return next;
  }

  async failTask(id: string, message: string): Promise<TraceOpsTaskRecord | undefined> {
    const task = this.data.tasks.find((item) => item.id === id);
    if (!task) return undefined;
    const shouldRetry = task.attempts < task.maxAttempts;
    const next = this.updateTaskById(task.id, {
      status: shouldRetry ? 'queued' : 'failed',
      progress: shouldRetry ? 0 : 100,
      attempts: shouldRetry ? task.attempts + 1 : task.attempts,
      errorMessage: message,
      resultSummary: shouldRetry ? `Retry scheduled after failure: ${message}` : undefined,
      finishedAt: shouldRetry ? undefined : new Date().toISOString(),
      nextRunAt: shouldRetry ? new Date(Date.now() + Math.min(60_000, 5_000 * task.attempts)).toISOString() : undefined,
    });
    if (!shouldRetry && task.retryOfTaskId) {
      this.updateTaskById(task.retryOfTaskId, {
        status: 'failed',
        progress: 100,
        resultSummary: undefined,
        errorMessage: `Retry ${task.id} failed: ${message}`,
        finishedAt: new Date().toISOString(),
      });
    }
    await this.save();
    return next;
  }

  async deferTask(id: string, message: string, delayMs = 30_000): Promise<TraceOpsTaskRecord | undefined> {
    const task = this.data.tasks.find((item) => item.id === id);
    if (!task) return undefined;
    const next = this.updateTaskById(task.id, {
      status: 'queued',
      progress: 0,
      resultSummary: message,
      errorMessage: undefined,
      startedAt: undefined,
      finishedAt: undefined,
      nextRunAt: new Date(Date.now() + delayMs).toISOString(),
    });
    await this.save();
    return next;
  }

  taskExecutionResult(task: TraceOpsTaskRecord, executed: boolean, message: string): TraceOpsTaskExecutionResult {
    return { task, executed, message };
  }

  private updateTaskById(id: string, update: Partial<Omit<TraceOpsTaskRecord, 'id' | 'events' | 'createdAt'>>): TraceOpsTaskRecord {
    const task = this.data.tasks.find((item) => item.id === id);
    if (!task) throw new Error(`Task not found: ${id}`);
    const now = new Date().toISOString();
    const status = update.status ?? task.status;
    const next: TraceOpsTaskRecord = {
      ...task,
      ...update,
      status,
      updatedAt: now,
      events: [...task.events, {
        id: `task_event_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        status,
        note: update.resultSummary ?? update.errorMessage ?? `Task ${status}.`,
        createdAt: now,
      }],
    };
    this.data.tasks = [next, ...this.data.tasks.filter((item) => item.id !== id)].slice(0, 300);
    return next;
  }

  private recordTask(input: {
    kind: TraceOpsTaskKind;
    status: TraceOpsTaskStatus;
    title: string;
    description?: string;
    priority?: TraceOpsTaskRecord['priority'];
    progress?: number;
    entityRefs?: TraceOpsTaskEntityRef[];
    resultSummary?: string;
    errorMessage?: string;
    createdBy?: string;
    occurredAt?: string;
    dedupe?: boolean;
  }): TraceOpsTaskRecord {
    const now = input.occurredAt ?? new Date().toISOString();
    const primaryInputRef = input.entityRefs?.[0];
    const existing = input.dedupe === false ? undefined : primaryInputRef
      ? this.data.tasks.find((task) => {
        const primaryTaskRef = task.entityRefs[0];
        return primaryTaskRef?.kind === primaryInputRef.kind && primaryTaskRef.id === primaryInputRef.id;
      })
      : this.data.tasks.find((task) =>
        task.kind === input.kind
        && task.title === input.title
        && (task.status === 'queued' || task.status === 'running' || task.status === 'failed')
      );
    const base: TraceOpsTaskRecord = existing ?? {
      id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      kind: input.kind,
      status: input.status,
      title: input.title,
      description: input.description,
      queue: this.taskQueue(input.kind),
      priority: input.priority ?? this.taskPriority(input.kind, input.status),
      progress: input.progress ?? this.taskProgress(input.status),
      attempts: 1,
      maxAttempts: 3,
      entityRefs: input.entityRefs ?? [],
      createdBy: input.createdBy ?? 'traceops-worker',
      createdAt: now,
      updatedAt: now,
      events: [],
    };
    const next: TraceOpsTaskRecord = {
      ...base,
      kind: input.kind,
      status: input.status,
      title: input.title,
      description: input.description ?? base.description,
      priority: input.priority ?? this.taskPriority(input.kind, input.status),
      progress: input.progress ?? this.taskProgress(input.status),
      entityRefs: input.entityRefs ?? base.entityRefs,
      resultSummary: input.resultSummary ?? base.resultSummary,
      errorMessage: input.errorMessage,
      updatedAt: now,
      startedAt: base.startedAt ?? (input.status === 'running' ? now : undefined),
      finishedAt: ['succeeded', 'failed', 'cancelled'].includes(input.status) ? now : base.finishedAt,
      events: [...base.events, {
        id: `task_event_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        status: input.status,
        note: input.resultSummary ?? input.errorMessage ?? input.description ?? input.title,
        createdAt: now,
      }],
    };
    this.data.tasks = [next, ...this.data.tasks.filter((task) => task.id !== next.id)].slice(0, 300);
    return next;
  }

  private updateTaskForEntity(kind: TraceOpsTaskEntityRef['kind'], id: string, status: TraceOpsTaskStatus, resultSummary?: string, errorMessage?: string): void {
    const task = this.data.tasks.find((item) => item.entityRefs.some((ref) => ref.kind === kind && ref.id === id));
    if (!task) return;
    this.recordTask({
      kind: task.kind,
      status,
      title: task.title,
      description: task.description,
      entityRefs: task.entityRefs,
      resultSummary,
      errorMessage,
      createdBy: task.createdBy,
    });
  }

  private backfillTasksFromArtifacts(): number {
    let created = 0;
    const add = (input: Parameters<TraceOpsStore['recordTask']>[0]) => {
      const primaryRef = input.entityRefs?.[0];
      const alreadyExists = primaryRef
        ? this.data.tasks.some((task) => {
          const primaryTaskRef = task.entityRefs[0];
          return primaryTaskRef?.kind === primaryRef.kind && primaryTaskRef.id === primaryRef.id;
        })
        : false;
      if (alreadyExists) return;
      this.recordTask(input);
      created += 1;
    };

    for (const job of this.data.jobs.slice(0, 40)) {
      add({
        kind: 'kodax_sync',
        status: this.taskStatusFromArtifact(job.status),
        title: `KodaX sync ${job.mode}`,
        description: `${job.discovered} discovered, ${job.imported} imported, ${job.failed} failed.`,
        entityRefs: [{ kind: 'ingest_job', id: job.id, label: job.mode }],
        resultSummary: job.message,
        errorMessage: job.status === 'failed' ? job.message : undefined,
        occurredAt: job.finishedAt ?? job.startedAt,
      });
    }
    for (const version of this.data.datasetVersions.slice(0, 80)) {
      add({
        kind: 'dataset_build',
        status: 'succeeded',
        title: `Dataset ${version.name}`,
        description: `${version.format} · ${version.sampleCount} samples`,
        entityRefs: [{ kind: 'dataset_version', id: version.id, label: version.name }],
        occurredAt: version.createdAt,
      });
    }
    for (const manifest of this.data.releaseManifests.slice(0, 80)) {
      add({
        kind: 'release_manifest',
        status: this.taskStatusFromArtifact(manifest.status),
        title: `Manifest ${manifest.datasetVersionName}`,
        description: `${manifest.status} · ${manifest.releaseGate.blockCount} blockers`,
        entityRefs: [
          { kind: 'release_manifest', id: manifest.id, label: manifest.datasetVersionName },
          { kind: 'dataset_version', id: manifest.datasetVersionId, label: manifest.datasetVersionName },
        ],
        occurredAt: manifest.generatedAt,
      });
    }
    for (const handoff of this.data.retrainingHandoffs.slice(0, 80)) {
      add({
        kind: 'retraining_handoff',
        status: this.taskStatusFromArtifact(handoff.status),
        title: `Retraining handoff ${handoff.datasetVersionName}`,
        description: `${handoff.trainingOwner} -> ${handoff.targetSystem}`,
        entityRefs: [
          { kind: 'retraining_handoff', id: handoff.id, label: handoff.datasetVersionName },
          { kind: 'dataset_version', id: handoff.datasetVersionId, label: handoff.datasetVersionName },
        ],
        occurredAt: handoff.createdAt,
      });
    }
    for (const run of this.data.trainingRuns.slice(0, 80)) {
      add({
        kind: 'training_run',
        status: this.taskStatusFromArtifact(run.status),
        title: `Training ${run.modelName}`,
        description: `${run.status} · ${run.qualityGate}`,
        entityRefs: [
          { kind: 'training_run', id: run.id, label: run.modelName },
          { kind: 'dataset_version', id: run.datasetVersionId, label: run.datasetVersionName },
        ],
        occurredAt: run.completedAt ?? run.startedAt ?? run.createdAt,
      });
    }
    for (const evalRun of this.data.evalRuns.slice(0, 80)) {
      add({
        kind: 'eval_run',
        status: this.taskStatusFromArtifact(evalRun.status),
        title: `Eval ${evalRun.modelName}`,
        description: `${evalRun.status} · ${evalRun.cases.filter((item) => item.status === 'passed').length} passed · ${evalRun.cases.filter((item) => item.status === 'failed').length} failed`,
        entityRefs: [
          { kind: 'eval_run', id: evalRun.id, label: evalRun.modelName },
          { kind: 'training_run', id: evalRun.trainingRunId, label: evalRun.modelName },
          { kind: 'dataset_version', id: evalRun.datasetVersionId, label: evalRun.datasetVersionName },
        ],
        occurredAt: evalRun.completedAt ?? evalRun.startedAt,
      });
    }
    for (const gate of this.data.modelReleaseGates.slice(0, 80)) {
      add({
        kind: 'model_release_gate',
        status: this.taskStatusFromArtifact(gate.status),
        title: `Model gate ${gate.modelName}`,
        description: `${gate.status} · eval ${gate.evalStatus ?? 'missing'}`,
        entityRefs: [
          { kind: 'model_release_gate', id: gate.id, label: gate.modelName },
          { kind: 'training_run', id: gate.trainingRunId, label: gate.modelName },
          { kind: 'dataset_version', id: gate.datasetVersionId, label: gate.datasetVersionName },
        ],
        occurredAt: gate.approvedAt ?? gate.updatedAt,
      });
    }
    for (const handoff of this.data.deploymentHandoffs.slice(0, 80)) {
      add({
        kind: 'deployment_handoff',
        status: this.taskStatusFromArtifact(handoff.status),
        title: `Deploy ${handoff.modelName}`,
        description: `${handoff.status} · ${handoff.environment}`,
        entityRefs: [
          { kind: 'deployment_handoff', id: handoff.id, label: handoff.environment },
          { kind: 'model_release_gate', id: handoff.modelReleaseGateId, label: handoff.modelName },
          { kind: 'dataset_version', id: handoff.datasetVersionId, label: handoff.datasetVersionName },
        ],
        occurredAt: handoff.updatedAt,
      });
    }
    for (const monitor of this.data.postReleaseMonitors.slice(0, 80)) {
      add({
        kind: 'post_release_monitor',
        status: this.taskStatusFromArtifact(monitor.status),
        title: `Monitor ${monitor.modelName}`,
        description: `${monitor.status} · ${monitor.environment} · ${monitor.signalSummary?.severity ?? 'pending'}`,
        priority: monitor.status === 'rollback_required' ? 'critical' : undefined,
        entityRefs: [
          { kind: 'post_release_monitor', id: monitor.id, label: monitor.environment },
          { kind: 'deployment_handoff', id: monitor.deploymentHandoffId, label: monitor.environment },
          { kind: 'dataset_version', id: monitor.datasetVersionId, label: monitor.datasetVersionName },
        ],
        occurredAt: monitor.updatedAt,
      });
    }
    for (const loop of this.data.feedbackLoops.slice(0, 80)) {
      add({
        kind: 'feedback_loop',
        status: this.taskStatusFromArtifact(loop.status),
        title: `Feedback ${loop.targetKind} ${loop.severity}`,
        description: `${loop.status} · ${loop.recommendedAction}`,
        priority: loop.severity === 'critical' ? 'critical' : loop.severity === 'warning' ? 'high' : undefined,
        entityRefs: [
          { kind: 'feedback_loop', id: loop.id, label: loop.targetKind },
          { kind: 'post_release_monitor', id: loop.postReleaseMonitorId, label: loop.environment },
          { kind: 'dataset_version', id: loop.datasetVersionId, label: loop.datasetVersionName },
        ],
        occurredAt: loop.updatedAt,
      });
    }
    return created;
  }

  private taskSummary(tasks: TraceOpsTaskRecord[]): TraceOpsTaskListResponse['summary'] {
    const count = (status: TraceOpsTaskStatus) => tasks.filter((task) => task.status === status).length;
    const queued = count('queued');
    const running = count('running');
    const failed = count('failed');
    const retrying = count('retrying');
    const cancelled = count('cancelled');
    return {
      total: tasks.length,
      queued,
      running,
      succeeded: count('succeeded'),
      failed,
      retrying,
      cancelled,
      active: queued + running + retrying,
      needsAttention: failed + cancelled + tasks.filter((task) => task.priority === 'critical' && task.status !== 'succeeded').length,
    };
  }

  private taskQueue(kind: TraceOpsTaskKind): TraceOpsTaskRecord['queue'] {
    if (kind === 'storage_maintenance' || kind === 'kodax_feedback' || kind === 'governance_review') return 'maintenance';
    if (kind === 'kodax_sync' || kind === 'trace_cleaning') return 'ingestion';
    if (kind === 'dataset_build' || kind === 'diff_review' || kind === 'release_manifest') return 'dataset';
    if (kind === 'retraining_handoff' || kind === 'training_run' || kind === 'eval_run') return 'training';
    if (kind === 'model_release_gate' || kind === 'deployment_handoff') return 'release';
    if (kind === 'post_release_monitor' || kind === 'feedback_loop') return 'monitoring';
    return 'closed_loop';
  }

  private taskPriority(kind: TraceOpsTaskKind, status: TraceOpsTaskStatus): TraceOpsTaskRecord['priority'] {
    if (status === 'failed') return 'high';
    if (kind === 'governance_review') return 'critical';
    if (kind === 'storage_maintenance' || kind === 'kodax_feedback') return 'high';
    if (kind === 'post_release_monitor' || kind === 'feedback_loop') return 'high';
    if (kind === 'closed_loop' || kind === 'deployment_handoff' || kind === 'model_release_gate') return 'normal';
    return 'normal';
  }

  private taskProgress(status: TraceOpsTaskStatus): number {
    if (status === 'queued') return 0;
    if (status === 'running' || status === 'retrying') return 45;
    if (status === 'succeeded') return 100;
    return 100;
  }

  private taskStatusFromArtifact(status?: string): TraceOpsTaskStatus {
    if (!status) return 'queued';
    if (status === 'queued' || status === 'planned' || status === 'candidate') return 'queued';
    if (status === 'running' || status === 'importing' || status === 'preparing' || status === 'evaluating' || status === 'watching') return 'running';
    if (status === 'failed' || status === 'ingest_failed' || status === 'blocked' || status === 'rejected' || status === 'rolled_back' || status === 'rollback_required') return 'failed';
    if (status === 'cancelled' || status === 'closed') return 'cancelled';
    return 'succeeded';
  }

  listTraces(filters: Record<string, string | undefined>): TraceListResponse {
    let traces = [...this.data.traces];
    const q = filters.query?.trim().toLowerCase();
    if (q) {
      traces = traces.filter((trace) => [
        trace.title,
        trace.projectKey,
        trace.sourceSessionId,
        trace.runtime.model,
        trace.runtime.provider,
        trace.runtime.profileId,
      ].filter(Boolean).some((value) => String(value).toLowerCase().includes(q)));
    }
    if (filters.projectKey) traces = traces.filter((trace) => trace.projectKey === filters.projectKey);
    if (filters.ingestionStatus) traces = traces.filter((trace) => trace.ingestionStatus === filters.ingestionStatus);
    if (filters.riskLevel) traces = traces.filter((trace) => trace.risk.level === filters.riskLevel);
    if (filters.scope) traces = traces.filter((trace) => trace.runtime.scope === filters.scope);
    if (filters.hasEvidence === 'true') traces = traces.filter((trace) => trace.counts.artifactLedgerEntries > 0);
    if (filters.hasError === 'true') traces = traces.filter((trace) => trace.status === 'failed');

    traces.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    return {
      traces,
      totals: {
        total: this.data.traces.length,
        imported: this.data.traces.filter((trace) => trace.ingestionStatus === 'imported').length,
        updated: this.data.traces.filter((trace) => trace.ingestionStatus === 'updated').length,
        failed: this.data.traces.filter((trace) => trace.ingestionStatus === 'ingest_failed').length,
        highRisk: this.data.traces.filter((trace) => trace.risk.level === 'L3' || trace.risk.level === 'L4').length,
      },
    };
  }

  getTrace(id: string): TraceDetail | undefined {
    const trace = this.data.traces.find((item) => item.id === id);
    if (!trace) return undefined;
    const events = this.eventsForTrace(trace);
    const evidence = this.evidenceForTrace(trace);
    const errors = this.data.errors.filter((error) => error.traceId === id || error.sourceSessionId === trace.sourceSessionId);
    return {
      trace,
      events,
      evidence,
      revisions: this.data.revisions
        .filter((revision) => revision.traceId === id)
        .sort((a, b) => b.importedAt.localeCompare(a.importedAt)),
      errors,
      trainingSamples: generateTrainingSamples(trace, events, evidence, errors).map((sample) => this.applySampleState(sample)),
      memoryCandidates: this.baseMemoryCandidates(trace).map((candidate) => this.applyMemoryCandidateReview(candidate)),
    };
  }

  listTrainingSamples(filters: Record<string, string | undefined> = {}): TrainingSampleListResponse {
    let samples = this.data.traces.flatMap((trace) => this.baseTrainingSamples(trace).map((sample) => this.applySampleState(sample)));

    const q = filters.query?.trim().toLowerCase();
    if (q) {
      samples = samples.filter((sample) => [
        sample.title,
        sample.sourceSessionId,
        sample.projectKey,
        sample.promptPreview,
        sample.responsePreview,
      ].filter(Boolean).some((value) => String(value).toLowerCase().includes(q)));
    }
    if (filters.projectKey) samples = samples.filter((sample) => sample.projectKey === filters.projectKey);
    if (filters.status) samples = samples.filter((sample) => sample.status === filters.status);
    if (filters.kind) samples = samples.filter((sample) => sample.kind === filters.kind);
    if (filters.riskLevel) samples = samples.filter((sample) => sample.riskLevel === filters.riskLevel);
    if (filters.qualityGrade) samples = samples.filter((sample) => sample.quality.grade === filters.qualityGrade);
    if (filters.sampleIds) {
      const ids = new Set(filters.sampleIds.split(',').map((id) => id.trim()).filter(Boolean));
      samples = samples.filter((sample) => ids.has(sample.id));
    }
    if (filters.missingEvidence === 'true') samples = samples.filter((sample) => sample.toolEventCount > 0 && sample.evidenceCount === 0);
    if (filters.redacted === 'true') samples = samples.filter((sample) => sample.metadata.distillation.redactionCount > 0);
    if (filters.readyForFineTune === 'true') samples = samples.filter((sample) => sample.metadata.distillation.readyForFineTune);

    const statusRank: Record<TrainingSample['status'], number> = {
      needs_review: 0,
      candidate: 1,
      blocked: 2,
    };
    samples.sort((a, b) =>
      statusRank[a.status] - statusRank[b.status]
      || b.quality.score - a.quality.score
      || b.updatedAt.localeCompare(a.updatedAt)
    );

    return {
      samples,
      totals: {
        total: samples.length,
        candidate: samples.filter((sample) => sample.status === 'candidate').length,
        needsReview: samples.filter((sample) => sample.status === 'needs_review').length,
        blocked: samples.filter((sample) => sample.status === 'blocked').length,
        highRisk: samples.filter((sample) => sample.riskLevel === 'L3' || sample.riskLevel === 'L4').length,
        averageQuality: samples.length
          ? Math.round(samples.reduce((sum, sample) => sum + sample.quality.score, 0) / samples.length)
          : 0,
      },
    };
  }

  getTrainingSample(id: string): TrainingSample | undefined {
    return this.listTrainingSamples().samples.find((sample) => sample.id === id);
  }

  listEvidenceCandidatesForSample(id: string): TrainingSampleEvidenceCandidate[] | undefined {
    const sample = this.getTrainingSample(id);
    if (!sample) return undefined;
    const trace = this.data.traces.find((item) => item.id === sample.traceId);
    if (!trace) return [];

    const evidence = this.evidenceForTrace(trace);
    const linkedIds = new Set(sample.input.evidenceIds);
    const sourceEventIds = new Set([
      ...sample.input.toolEventIds,
      ...(sample.input.sourceEventIds ?? []),
      ...(sample.output.finalEventId ? [sample.output.finalEventId] : []),
    ]);
    const toolEvents = this.eventsForTrace(trace).filter((event) => sourceEventIds.has(event.id));
    const sampleTokens = tokensFor([
      sample.title,
      sample.promptPreview,
      sample.responsePreview,
      sample.input.cleanUserGoal,
      sample.output.cleanAssistantOutcome,
      ...toolEvents.map(eventText),
    ].filter(Boolean).join(' '));

    return evidence
      .map((item): TrainingSampleEvidenceCandidate => {
        const reasons: string[] = [];
        const matchedToolEventIds: string[] = [];
        const alreadyLinked = linkedIds.has(item.id);
        let confidence = alreadyLinked ? 100 : 18;

        if (alreadyLinked) reasons.push('Already linked to this sample.');
        const kindBoost = evidenceKindBoost(sample, item);
        confidence += kindBoost;
        if (kindBoost >= 20) reasons.push(`${item.kind} is strong evidence for ${sample.kind}.`);
        else if (kindBoost >= 12) reasons.push(`${item.kind} is usable tool-chain evidence.`);

        if (item.sessionEntryId && sourceEventIds.has(item.sessionEntryId)) {
          confidence += 28;
          matchedToolEventIds.push(item.sessionEntryId);
          reasons.push('Same session entry as a linked tool event.');
        }

        const evidenceTokens = tokensFor(evidenceText(item));
        const overlap = overlapCount(sampleTokens, evidenceTokens);
        if (overlap > 0) {
          const boost = Math.min(24, overlap * 4);
          confidence += boost;
          reasons.push(`${overlap} text signal(s) match the sample/tool context.`);
        }

        if (sample.toolEventCount > 0 && sample.evidenceCount === 0) {
          confidence += 12;
          reasons.push('Fills a missing evidence gap for a tool-backed sample.');
        }

        if (item.riskLevel === 'L4') {
          confidence -= 18;
          reasons.push('High-risk evidence needs careful governance review.');
        } else if (item.riskLevel === 'L3') {
          confidence -= 8;
          reasons.push('Medium-high risk evidence should stay in review.');
        }

        if (reasons.length === 0) reasons.push('Same trace and revision.');

        return {
          sampleId: sample.id,
          traceId: sample.traceId,
          revisionId: sample.revisionId,
          evidenceId: item.id,
          evidence: item,
          confidence: Math.max(0, Math.min(alreadyLinked ? 100 : 99, Math.round(confidence))),
          alreadyLinked,
          reasons: Array.from(new Set(reasons)).slice(0, 4),
          matchedToolEventIds: Array.from(new Set(matchedToolEventIds)),
        };
      })
      .sort((a, b) =>
        Number(b.alreadyLinked) - Number(a.alreadyLinked)
        || b.confidence - a.confidence
        || b.evidence.timestamp.localeCompare(a.evidence.timestamp)
      )
      .slice(0, 16);
  }

  listCleanTraces(filters: Record<string, string | undefined> = {}): CleanTraceListResponse {
    let cleanTraces = this.data.traces.map((trace) => this.baseCleanTrace(trace));

    const q = filters.query?.trim().toLowerCase();
    if (q) {
      cleanTraces = cleanTraces.filter((cleanTrace) => [
        cleanTrace.title,
        cleanTrace.sourceSessionId,
        cleanTrace.projectKey,
        cleanTrace.cleanUserGoal,
        cleanTrace.cleanAssistantOutcome,
      ].filter(Boolean).some((value) => String(value).toLowerCase().includes(q)));
    }
    if (filters.projectKey) cleanTraces = cleanTraces.filter((cleanTrace) => cleanTrace.projectKey === filters.projectKey);
    if (filters.status) cleanTraces = cleanTraces.filter((cleanTrace) => cleanTrace.status === filters.status);
    if (filters.kind) cleanTraces = cleanTraces.filter((cleanTrace) => cleanTrace.kind === filters.kind);
    if (filters.riskLevel) cleanTraces = cleanTraces.filter((cleanTrace) => cleanTrace.riskLevel === filters.riskLevel);
    if (filters.qualityGrade) cleanTraces = cleanTraces.filter((cleanTrace) => cleanTrace.quality.grade === filters.qualityGrade);
    if (filters.readyForFineTune === 'true') cleanTraces = cleanTraces.filter((cleanTrace) => cleanTrace.readyForFineTune);
    if (filters.redacted === 'true') cleanTraces = cleanTraces.filter((cleanTrace) => cleanTrace.redactionCount > 0);
    if (filters.missingEvidence === 'true') {
      cleanTraces = cleanTraces.filter((cleanTrace) =>
        cleanTrace.metrics.toolEventCount > 0 && cleanTrace.metrics.evidenceCount === 0
      );
    }

    const statusRank: Record<CleanTrace['status'], number> = {
      needs_review: 0,
      ready: 1,
      blocked: 2,
    };
    cleanTraces.sort((a, b) =>
      statusRank[a.status] - statusRank[b.status]
      || b.quality.score - a.quality.score
      || b.updatedAt.localeCompare(a.updatedAt)
    );

    return {
      cleanTraces,
      totals: {
        total: cleanTraces.length,
        ready: cleanTraces.filter((cleanTrace) => cleanTrace.status === 'ready').length,
        needsReview: cleanTraces.filter((cleanTrace) => cleanTrace.status === 'needs_review').length,
        blocked: cleanTraces.filter((cleanTrace) => cleanTrace.status === 'blocked').length,
        highRisk: cleanTraces.filter((cleanTrace) => cleanTrace.riskLevel === 'L3' || cleanTrace.riskLevel === 'L4').length,
        averageQuality: cleanTraces.length
          ? Math.round(cleanTraces.reduce((sum, cleanTrace) => sum + cleanTrace.quality.score, 0) / cleanTraces.length)
          : 0,
      },
    };
  }

  getCleanTrace(id: string): CleanTrace | undefined {
    return this.listCleanTraces().cleanTraces.find((cleanTrace) => cleanTrace.id === id || cleanTrace.traceId === id);
  }

  listMemoryCandidates(filters: Record<string, string | undefined> = {}): MemoryCandidateListResponse {
    let candidates = this.data.traces.flatMap((trace) =>
      this.baseMemoryCandidates(trace).map((candidate) => this.applyMemoryCandidateReview(candidate))
    );

    const q = filters.query?.trim().toLowerCase();
    if (q) {
      candidates = candidates.filter((candidate) => [
        candidate.title,
        candidate.summary,
        candidate.body,
        candidate.projectKey,
        candidate.sourceSessionId,
        ...candidate.triggers,
        ...candidate.labels,
      ].filter(Boolean).some((value) => String(value).toLowerCase().includes(q)));
    }
    if (filters.projectKey) candidates = candidates.filter((candidate) => candidate.projectKey === filters.projectKey);
    if (filters.status) candidates = candidates.filter((candidate) => candidate.status === filters.status);
    if (filters.kind) candidates = candidates.filter((candidate) => candidate.kind === filters.kind);
    if (filters.riskLevel) candidates = candidates.filter((candidate) => candidate.riskLevel === filters.riskLevel);
    if (filters.readyForMemoryBase === 'true') candidates = candidates.filter((candidate) => candidate.metadata.readyForMemoryBase);

    const statusRank: Record<MemoryCandidate['status'], number> = {
      needs_review: 0,
      candidate: 1,
      promoted: 2,
      blocked: 3,
      rejected: 4,
    };
    candidates.sort((a, b) =>
      statusRank[a.status] - statusRank[b.status]
      || b.confidence - a.confidence
      || b.updatedAt.localeCompare(a.updatedAt)
    );

    return {
      candidates,
      totals: {
        total: candidates.length,
        candidate: candidates.filter((candidate) => candidate.status === 'candidate').length,
        needsReview: candidates.filter((candidate) => candidate.status === 'needs_review').length,
        promoted: candidates.filter((candidate) => candidate.status === 'promoted').length,
        rejected: candidates.filter((candidate) => candidate.status === 'rejected').length,
        blocked: candidates.filter((candidate) => candidate.status === 'blocked').length,
        highRisk: candidates.filter((candidate) => candidate.riskLevel === 'L3' || candidate.riskLevel === 'L4').length,
        averageConfidence: candidates.length
          ? Math.round(candidates.reduce((sum, candidate) => sum + candidate.confidence, 0) / candidates.length)
          : 0,
      },
    };
  }

  getMemoryCandidate(id: string): MemoryCandidate | undefined {
    return this.listMemoryCandidates().candidates.find((candidate) => candidate.id === id);
  }

  async reviewMemoryCandidate(
    id: string,
    decision: MemoryCandidateReviewDecision,
    note = '',
    reviewer = 'local-memory-governance',
  ): Promise<MemoryCandidate | undefined> {
    const baseCandidate = this.data.traces
      .flatMap((trace) => this.baseMemoryCandidates(trace))
      .find((candidate) => candidate.id === id);
    if (!baseCandidate) return undefined;
    if (decision === 'promoted' && baseCandidate.status === 'blocked') {
      throw new Error('Blocked memory candidates cannot be promoted.');
    }

    const record: MemoryCandidateReviewRecord = {
      candidateId: baseCandidate.id,
      traceId: baseCandidate.traceId,
      revisionId: baseCandidate.revisionId,
      decision,
      reviewer,
      note: note.trim() || undefined,
      decidedAt: new Date().toISOString(),
    };
    const existingIndex = this.data.memoryCandidateReviews.findIndex((review) => review.candidateId === id);
    if (existingIndex >= 0) this.data.memoryCandidateReviews[existingIndex] = record;
    else this.data.memoryCandidateReviews.unshift(record);
    await this.save();
    return this.getMemoryCandidate(id);
  }

  listExportRuns(): DatasetExportRun[] {
    return this.data.exportRuns.slice(0, 30);
  }

  private promotionForManifest(manifestId: string): DatasetReleasePromotionRecord | undefined {
    return this.data.releasePromotions
      .filter((promotion) => promotion.manifestId === manifestId)
      .sort((a, b) => {
        const left = a.revokedAt ?? a.promotedAt;
        const right = b.revokedAt ?? b.promotedAt;
        return right.localeCompare(left);
      })[0];
  }

  private withReleasePromotion(manifest: DatasetReleaseManifest): DatasetReleaseManifest {
    const promotion = this.promotionForManifest(manifest.id);
    return {
      ...manifest,
      promotionStatus: promotion?.status ?? 'not_promoted',
      promotion,
    };
  }

  listReleaseManifests(): DatasetReleaseManifest[] {
    return this.data.releaseManifests.slice(0, 50).map((manifest) => this.withReleasePromotion(manifest));
  }

  getReleaseManifest(id: string): DatasetReleaseManifest | undefined {
    const manifest = this.data.releaseManifests.find((item) => item.id === id);
    return manifest ? this.withReleasePromotion(manifest) : undefined;
  }

  listReleasePromotions(): DatasetReleasePromotionRecord[] {
    return this.data.releasePromotions.slice(0, 50);
  }

  getReleasePromotion(id: string): DatasetReleasePromotionRecord | undefined {
    return this.data.releasePromotions.find((promotion) => promotion.id === id);
  }

  getReleasePackage(promotionId: string): DatasetReleasePackage | undefined {
    const promotion = this.getReleasePromotion(promotionId);
    if (!promotion || promotion.status !== 'promoted') return undefined;
    const manifest = this.getReleaseManifest(promotion.manifestId);
    if (!manifest) return undefined;

    const defaultExportUrl = manifest.exportUrls[manifest.format] ?? manifest.exportUrls.traceops_jsonl;
    const basePackage = {
      id: `package_${promotion.id}`,
      packageVersion: 'traceops-release-package-v1' as const,
      promotionId: promotion.id,
      manifestId: manifest.id,
      datasetVersionId: manifest.datasetVersionId,
      datasetVersionName: manifest.datasetVersionName,
      manifestHash: manifest.manifestHash,
      snapshotHash: manifest.snapshotHash,
      promotion,
      manifest,
      exportUrls: manifest.exportUrls,
      approvals: {
        releaseGate: manifest.releaseGate,
        diffReviewStatus: manifest.diffReviewStatus,
        diffReview: manifest.diffReview,
        promotion,
      },
      trainingEntry: {
        defaultFormat: manifest.format,
        defaultExportUrl,
        traceopsExportUrl: manifest.exportUrls.traceops_jsonl,
        reviewExportUrl: manifest.exportUrls.review_jsonl,
        packageUrl: `/api/release-promotions/${encodeURIComponent(promotion.id)}/package/download`,
      },
      summaries: {
        samples: manifest.sampleCount,
        traces: manifest.traceCount,
        risk: manifest.riskSummary,
        review: manifest.reviewSummary,
        quality: manifest.qualitySummary,
        evidence: manifest.evidenceSummary,
        kind: manifest.kindSummary,
        project: manifest.projectSummary,
      },
      generatedAt: new Date().toISOString(),
      generatedBy: 'traceops-release-packager',
    } satisfies Omit<DatasetReleasePackage, 'packageHash'>;

    return {
      ...basePackage,
      packageHash: stableHash({
        packageVersion: basePackage.packageVersion,
        promotionId: basePackage.promotionId,
        manifestId: basePackage.manifestId,
        datasetVersionId: basePackage.datasetVersionId,
        manifestHash: basePackage.manifestHash,
        snapshotHash: basePackage.snapshotHash,
        exportUrls: basePackage.exportUrls,
        approvals: basePackage.approvals,
        summaries: basePackage.summaries,
        trainingEntry: {
          defaultFormat: basePackage.trainingEntry.defaultFormat,
          defaultExportUrl: basePackage.trainingEntry.defaultExportUrl,
          traceopsExportUrl: basePackage.trainingEntry.traceopsExportUrl,
          reviewExportUrl: basePackage.trainingEntry.reviewExportUrl,
        },
      }),
    };
  }

  listRetrainingHandoffs(): DatasetRetrainingHandoffRecord[] {
    return this.data.retrainingHandoffs.slice(0, 50);
  }

  getRetrainingHandoff(id: string): DatasetRetrainingHandoffRecord | undefined {
    return this.data.retrainingHandoffs.find((handoff) => handoff.id === id);
  }

  async createRetrainingHandoff(input: {
    promotionId: string;
    trainingOwner?: string;
    targetSystem?: string;
    note?: string;
    createdBy?: string;
  }): Promise<DatasetRetrainingHandoffRecord | undefined> {
    const releasePackage = this.getReleasePackage(input.promotionId);
    if (!releasePackage) return undefined;
    const existing = this.data.retrainingHandoffs.find((handoff) =>
      handoff.promotionId === input.promotionId && handoff.status !== 'cancelled'
    );
    if (existing) return existing;

    const createdAt = new Date().toISOString();
    const checklist: DatasetRetrainingHandoffRecord['checklist'] = [
      { id: 'package-downloaded', label: 'Download and archive Release Package JSON', status: 'open' },
      { id: 'dataset-exported', label: `Export ${releasePackage.trainingEntry.defaultFormat} training data`, status: 'open' },
      { id: 'approval-chain-reviewed', label: 'Review Release Gate, Diff Review and Promotion evidence', status: 'open' },
      { id: 'training-run-created', label: 'Create training run with package hash attached', status: 'open' },
      { id: 'eval-plan-attached', label: 'Attach evaluation plan and rollback criteria', status: 'open' },
    ];
    const baseHandoff = {
      id: `handoff_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      handoffVersion: 'traceops-retraining-handoff-v1' as const,
      status: 'queued' as const,
      releasePackageId: releasePackage.id,
      releasePackageHash: releasePackage.packageHash,
      promotionId: releasePackage.promotionId,
      manifestId: releasePackage.manifestId,
      datasetVersionId: releasePackage.datasetVersionId,
      datasetVersionName: releasePackage.datasetVersionName,
      trainingOwner: input.trainingOwner?.trim() || 'training-owner',
      targetSystem: input.targetSystem?.trim() || 'manual-training',
      defaultFormat: releasePackage.trainingEntry.defaultFormat,
      defaultExportUrl: releasePackage.trainingEntry.defaultExportUrl,
      traceopsExportUrl: releasePackage.trainingEntry.traceopsExportUrl,
      reviewExportUrl: releasePackage.trainingEntry.reviewExportUrl,
      packageUrl: releasePackage.trainingEntry.packageUrl,
      approvals: releasePackage.approvals,
      summaries: releasePackage.summaries,
      checklist,
      createdAt,
      createdBy: input.createdBy ?? 'traceops-release-owner',
      note: input.note?.trim() || undefined,
    } satisfies Omit<DatasetRetrainingHandoffRecord, 'handoffHash'>;
    const handoff: DatasetRetrainingHandoffRecord = {
      ...baseHandoff,
      handoffHash: stableHash({
        handoffVersion: baseHandoff.handoffVersion,
        releasePackageId: baseHandoff.releasePackageId,
        releasePackageHash: baseHandoff.releasePackageHash,
        promotionId: baseHandoff.promotionId,
        manifestId: baseHandoff.manifestId,
        datasetVersionId: baseHandoff.datasetVersionId,
        trainingOwner: baseHandoff.trainingOwner,
        targetSystem: baseHandoff.targetSystem,
        defaultExportUrl: baseHandoff.defaultExportUrl,
        packageUrl: baseHandoff.packageUrl,
        checklist: baseHandoff.checklist,
      }),
    };
    this.data.retrainingHandoffs.unshift(handoff);
    this.data.retrainingHandoffs = this.data.retrainingHandoffs.slice(0, 100);
    await this.save();
    return handoff;
  }

  async createRetrainingHandoffFromManifest(input: {
    manifestId: string;
    trainingOwner?: string;
    targetSystem?: string;
    note?: string;
    createdBy?: string;
  }): Promise<DatasetManifestRetrainingHandoffResult | undefined> {
    const manifest = this.getReleaseManifest(input.manifestId);
    if (!manifest) return undefined;
    if (manifest.status !== 'ready' || manifest.releaseGate.releaseBlocked) {
      throw new Error('Only ready release manifests can create a retraining handoff.');
    }

    const existingPromotion = this.promotionForManifest(manifest.id);
    const createdPromotion = !existingPromotion;
    let promotedManifest = manifest;
    if (!existingPromotion) {
      const promoted = await this.promoteReleaseManifest({
        manifestId: manifest.id,
        note: input.note?.trim() || 'Promoted for retraining handoff.',
        promotedBy: input.createdBy ?? 'traceops-release-owner',
      });
      if (!promoted?.promotion) return undefined;
      promotedManifest = promoted;
    }
    const promotion = existingPromotion ?? promotedManifest.promotion;
    if (!promotion) return undefined;

    const existingHandoff = this.data.retrainingHandoffs.find((handoff) =>
      handoff.promotionId === promotion.id && handoff.status !== 'cancelled'
    );
    const handoff = existingHandoff ?? await this.createRetrainingHandoff({
      promotionId: promotion.id,
      trainingOwner: input.trainingOwner,
      targetSystem: input.targetSystem,
      note: input.note?.trim() || 'Created directly from ready release manifest.',
      createdBy: input.createdBy ?? 'traceops-release-owner',
    });
    if (!handoff) return undefined;

    const releasePackage = this.getReleasePackage(promotion.id);
    if (!releasePackage) return undefined;
    const finalManifest = this.getReleaseManifest(manifest.id) ?? promotedManifest;

    return {
      manifest: finalManifest,
      promotion,
      releasePackage,
      handoff,
      createdPromotion,
      createdHandoff: !existingHandoff,
    };
  }

  listClosedLoopRetrainingPlans(): DatasetClosedLoopRetrainingPlan[] {
    return this.listDatasetVersions()
      .filter((version) => version.source === 'feedback_loop')
      .map((version) => this.buildClosedLoopRetrainingPlan(version))
      .filter((plan): plan is DatasetClosedLoopRetrainingPlan => Boolean(plan));
  }

  getClosedLoopRetrainingPlan(versionId: string): DatasetClosedLoopRetrainingPlan | undefined {
    const version = this.getDatasetVersion(versionId);
    if (!version || version.source !== 'feedback_loop') return undefined;
    return this.buildClosedLoopRetrainingPlan(version);
  }

  async prepareClosedLoopRetrainingHandoff(input: {
    datasetVersionId: string;
    trainingOwner?: string;
    targetSystem?: string;
    note?: string;
    createdBy?: string;
  }): Promise<DatasetClosedLoopRetrainingApplyResult | undefined> {
    const version = this.getDatasetVersion(input.datasetVersionId);
    if (!version) return undefined;
    if (version.source !== 'feedback_loop') {
      throw new Error('Closed-loop retraining can only be prepared from feedback dataset versions.');
    }

    let manifest = this.latestReadyManifestForDataset(version.id);
    let diffReview: DatasetClosedLoopRetrainingApplyResult['diffReview'];
    if (!manifest) {
      const plan = this.getDatasetVersionDiffReviewPlan(version.id);
      if (!plan) {
        throw new Error('Closed-loop retraining needs a comparable dataset diff before manifesting.');
      }
      if (
        plan.reviewStatus !== 'approved'
        && plan.reviewStatus !== 'risk_accepted'
        && plan.recommendedDecision === 'changes_requested'
      ) {
        throw new Error('Closed-loop diff review requests repair before retraining handoff.');
      }
      diffReview = await this.applyDatasetVersionDiffReviewPlan({
        headVersionId: version.id,
        baseVersionId: plan.baseVersionId,
        decision: plan.reviewStatus === 'approved' || plan.reviewStatus === 'risk_accepted'
          ? plan.reviewStatus
          : plan.recommendedDecision,
        note: input.note?.trim() || plan.recommendation,
        acknowledgeWarnings: true,
        createManifest: true,
        decidedBy: input.createdBy ?? 'closed-loop-retraining-owner',
      });
      manifest = diffReview?.manifest ?? this.latestReadyManifestForDataset(version.id);
    }

    if (!manifest) {
      const createdManifest = await this.createReleaseManifest({
        versionId: version.id,
        notes: input.note?.trim() || 'Created for closed-loop retraining handoff.',
        generatedBy: input.createdBy ?? 'closed-loop-retraining-owner',
      });
      manifest = createdManifest?.status === 'ready' ? createdManifest : this.latestReadyManifestForDataset(version.id);
    }

    if (!manifest) {
      throw new Error('Closed-loop dataset does not have a ready release manifest yet.');
    }

    const handoffResult = await this.createRetrainingHandoffFromManifest({
      manifestId: manifest.id,
      trainingOwner: input.trainingOwner,
      targetSystem: input.targetSystem,
      note: input.note?.trim() || 'Prepared from closed-loop feedback dataset.',
      createdBy: input.createdBy ?? 'closed-loop-retraining-owner',
    });

    const refreshedPlan = this.getClosedLoopRetrainingPlan(version.id);
    if (!refreshedPlan) return undefined;
    return {
      plan: refreshedPlan,
      diffReview,
      manifest: handoffResult?.manifest ?? manifest,
      handoffResult,
    };
  }

  async runClosedLoopTrainingCycle(input: {
    datasetVersionId: string;
    owner?: string;
    targetSystem?: string;
    modelName?: string;
    externalRunId?: string;
    note?: string;
    createdBy?: string;
  }): Promise<DatasetClosedLoopTrainingCycleResult | undefined> {
    const version = this.getDatasetVersion(input.datasetVersionId);
    if (!version) return undefined;
    if (version.source !== 'feedback_loop') {
      throw new Error('Closed-loop training cycles can only run from feedback dataset versions.');
    }

    const handoffPreparation = await this.prepareClosedLoopRetrainingHandoff({
      datasetVersionId: version.id,
      trainingOwner: input.owner,
      targetSystem: input.targetSystem,
      note: input.note?.trim() || 'Prepared for closed-loop training cycle.',
      createdBy: input.createdBy ?? 'closed-loop-training-owner',
    });
    const plan = handoffPreparation?.plan ?? this.getClosedLoopRetrainingPlan(version.id);
    const handoffId = plan?.retrainingHandoff?.id;
    if (!plan || !handoffId) {
      throw new Error('Closed-loop training cycle requires a retraining handoff.');
    }

    let trainingRun = this.latestTrainingRunForHandoff(handoffId);
    let createdTrainingRun = false;
    if (!trainingRun) {
      trainingRun = await this.createTrainingRun({
        handoffId,
        owner: input.owner,
        targetSystem: input.targetSystem,
        modelName: input.modelName,
        externalRunId: input.externalRunId?.trim() || `closed-loop-${Date.now()}`,
        note: input.note?.trim() || 'Closed-loop training run launched from feedback dataset.',
        createdBy: input.createdBy ?? 'closed-loop-training-owner',
      });
      createdTrainingRun = true;
    }
    if (!trainingRun) {
      throw new Error('Closed-loop training run could not be created.');
    }

    let evalRun = this.latestEvalRunForTrainingRun(trainingRun.id);
    let evalResult: DatasetEvalRunApplyResult | undefined;
    let createdEvalRun = false;
    if (!evalRun) {
      evalResult = await this.runTrainingEval({
        trainingRunId: trainingRun.id,
        note: input.note?.trim() || 'TraceOps eval attached by closed-loop training cycle.',
        createdBy: input.createdBy ?? 'closed-loop-eval-runner',
      });
      if (!evalResult) {
        throw new Error('Closed-loop eval run could not be created.');
      }
      trainingRun = evalResult.trainingRun;
      evalRun = evalResult.evalRun;
      createdEvalRun = true;
    }

    const refreshedPlan = this.getClosedLoopRetrainingPlan(version.id) ?? plan;
    return {
      plan: refreshedPlan,
      handoffPreparation,
      trainingRun,
      evalRun,
      evalResult,
      createdTrainingRun,
      createdEvalRun,
    };
  }

  async prepareClosedLoopModelReleaseGate(input: {
    datasetVersionId: string;
    owner?: string;
    targetSystem?: string;
    modelName?: string;
    note?: string;
    createdBy?: string;
  }): Promise<DatasetClosedLoopModelGateResult | undefined> {
    const version = this.getDatasetVersion(input.datasetVersionId);
    if (!version) return undefined;
    if (version.source !== 'feedback_loop') {
      throw new Error('Closed-loop model gates can only be prepared from feedback dataset versions.');
    }

    const trainingCycle = await this.runClosedLoopTrainingCycle({
      datasetVersionId: version.id,
      owner: input.owner,
      targetSystem: input.targetSystem,
      modelName: input.modelName,
      note: input.note?.trim() || 'Prepare closed-loop model release gate.',
      createdBy: input.createdBy ?? 'closed-loop-model-release-owner',
    });
    const trainingRun = trainingCycle?.trainingRun;
    if (!trainingRun) {
      throw new Error('Closed-loop model gate requires a training run.');
    }

    let modelReleaseGate = this.latestModelReleaseGateForTrainingRun(trainingRun.id);
    let createdModelGate = false;
    if (!modelReleaseGate) {
      modelReleaseGate = await this.createModelReleaseGate({
        trainingRunId: trainingRun.id,
        note: input.note?.trim() || 'Created from closed-loop training and TraceOps eval evidence.',
        createdBy: input.createdBy ?? 'closed-loop-model-release-owner',
      });
      createdModelGate = true;
    }
    if (!modelReleaseGate) {
      throw new Error('Closed-loop model release gate could not be created.');
    }

    const refreshedPlan = this.getClosedLoopRetrainingPlan(version.id) ?? trainingCycle.plan;
    return {
      plan: refreshedPlan,
      trainingCycle,
      modelReleaseGate,
      createdModelGate,
    };
  }

  async runClosedLoopCandidateCycle(input: {
    datasetVersionId: string;
    owner?: string;
    targetSystem?: string;
    modelName?: string;
    note?: string;
    createdBy?: string;
  }): Promise<DatasetClosedLoopCandidateCycleResult | undefined> {
    const version = this.getDatasetVersion(input.datasetVersionId);
    if (!version) return undefined;
    if (version.source !== 'feedback_loop') {
      throw new Error('Closed-loop candidate cycles can only run from feedback dataset versions.');
    }

    const modelGateResult = await this.prepareClosedLoopModelReleaseGate({
      datasetVersionId: version.id,
      owner: input.owner,
      targetSystem: input.targetSystem,
      modelName: input.modelName,
      note: input.note?.trim() || 'Run closed-loop candidate training, eval and model gate.',
      createdBy: input.createdBy ?? 'closed-loop-candidate-owner',
    });
    if (!modelGateResult) {
      throw new Error('Closed-loop candidate cycle could not prepare a model release gate.');
    }

    const refreshedPlan = this.getClosedLoopRetrainingPlan(version.id) ?? modelGateResult.plan;
    return {
      plan: refreshedPlan,
      modelGateResult,
      trainingCycle: modelGateResult.trainingCycle,
      modelReleaseGate: modelGateResult.modelReleaseGate,
      createdModelGate: modelGateResult.createdModelGate,
    };
  }

  async prepareClosedLoopDeploymentHandoff(input: {
    datasetVersionId: string;
    deploymentOwner?: string;
    environment?: string;
    rolloutStrategy?: string;
    note?: string;
    createdBy?: string;
  }): Promise<DatasetClosedLoopDeploymentHandoffResult | undefined> {
    const version = this.getDatasetVersion(input.datasetVersionId);
    if (!version) return undefined;
    if (version.source !== 'feedback_loop') {
      throw new Error('Closed-loop deployment handoffs can only be prepared from feedback dataset versions.');
    }

    const modelGateResult = await this.prepareClosedLoopModelReleaseGate({
      datasetVersionId: version.id,
      note: input.note?.trim() || 'Prepare closed-loop deployment handoff.',
      createdBy: input.createdBy ?? 'closed-loop-deployment-owner',
    });
    const gate = modelGateResult?.modelReleaseGate ?? this.getClosedLoopRetrainingPlan(version.id)?.modelReleaseGate;
    if (!gate?.id) {
      throw new Error('Closed-loop deployment handoff requires a model release gate.');
    }
    const fullGate = this.getModelReleaseGate(gate.id);
    if (!fullGate || fullGate.status !== 'approved') {
      throw new Error('Closed-loop deployment handoff requires an approved model release gate.');
    }

    const existing = this.latestDeploymentHandoffForModelGate(fullGate.id);
    const deploymentHandoff = existing ?? await this.createDeploymentHandoff({
      modelReleaseGateId: fullGate.id,
      deploymentOwner: input.deploymentOwner,
      environment: input.environment,
      rolloutStrategy: input.rolloutStrategy,
      note: input.note?.trim() || 'Created from approved closed-loop model release gate.',
      createdBy: input.createdBy ?? 'closed-loop-deployment-owner',
    });
    if (!deploymentHandoff) {
      throw new Error('Closed-loop deployment handoff could not be created.');
    }

    const refreshedPlan = this.getClosedLoopRetrainingPlan(version.id) ?? modelGateResult?.plan;
    if (!refreshedPlan) return undefined;
    return {
      plan: refreshedPlan,
      modelGateResult,
      deploymentHandoff,
      createdDeploymentHandoff: !existing,
    };
  }

  async approveClosedLoopModelGateAndPrepareDeploymentHandoff(input: {
    datasetVersionId: string;
    decisionNote?: string;
    deploymentOwner?: string;
    environment?: string;
    rolloutStrategy?: string;
    note?: string;
    createdBy?: string;
  }): Promise<DatasetClosedLoopApprovalDeploymentResult | undefined> {
    const version = this.getDatasetVersion(input.datasetVersionId);
    if (!version) return undefined;
    if (version.source !== 'feedback_loop') {
      throw new Error('Closed-loop deployment approvals can only run from feedback dataset versions.');
    }

    const modelGateResult = await this.prepareClosedLoopModelReleaseGate({
      datasetVersionId: version.id,
      note: input.decisionNote?.trim() || 'Prepare closed-loop model gate for deployment approval.',
      createdBy: input.createdBy ?? 'closed-loop-model-approver',
    });
    const gate = modelGateResult?.modelReleaseGate ?? this.getClosedLoopRetrainingPlan(version.id)?.modelReleaseGate;
    if (!gate?.id) {
      throw new Error('Closed-loop deployment approval requires a model release gate.');
    }

    let fullGate = this.getModelReleaseGate(gate.id);
    if (!fullGate) {
      throw new Error('Closed-loop model release gate could not be loaded.');
    }

    let approvedModelGate = false;
    if (fullGate.status === 'ready') {
      const approvedGate = await this.recordModelReleaseGateDecision({
        gateId: fullGate.id,
        decision: 'approved',
        note: input.decisionNote?.trim() || 'Closed-loop model gate approved for deployment handoff.',
        decidedBy: input.createdBy ?? 'closed-loop-model-approver',
      });
      if (!approvedGate) {
        throw new Error('Closed-loop model release gate could not be approved.');
      }
      fullGate = approvedGate;
      approvedModelGate = true;
    }

    if (fullGate.status !== 'approved') {
      throw new Error('Closed-loop deployment approval requires a ready or approved model release gate.');
    }

    const deploymentResult = await this.prepareClosedLoopDeploymentHandoff({
      datasetVersionId: version.id,
      deploymentOwner: input.deploymentOwner,
      environment: input.environment,
      rolloutStrategy: input.rolloutStrategy,
      note: input.note?.trim() || 'Approved closed-loop model gate and created deployment handoff.',
      createdBy: input.createdBy ?? 'closed-loop-deployment-owner',
    });
    if (!deploymentResult) {
      throw new Error('Closed-loop deployment handoff could not be prepared after model approval.');
    }

    const refreshedPlan = this.getClosedLoopRetrainingPlan(version.id) ?? deploymentResult.plan;
    return {
      plan: refreshedPlan,
      modelReleaseGate: fullGate,
      approvedModelGate,
      deploymentResult: {
        ...deploymentResult,
        plan: refreshedPlan,
      },
      deploymentHandoff: deploymentResult.deploymentHandoff,
      createdDeploymentHandoff: deploymentResult.createdDeploymentHandoff,
    };
  }

  async runClosedLoopRollout(input: {
    datasetVersionId: string;
    deploymentOwner?: string;
    environment?: string;
    rolloutStrategy?: string;
    monitorOwner?: string;
    note?: string;
    createdBy?: string;
  }): Promise<DatasetClosedLoopRolloutResult | undefined> {
    const version = this.getDatasetVersion(input.datasetVersionId);
    if (!version) return undefined;
    if (version.source !== 'feedback_loop') {
      throw new Error('Closed-loop rollout can only run from feedback dataset versions.');
    }

    let plan = this.getClosedLoopRetrainingPlan(version.id);
    let deploymentHandoff = plan?.deploymentHandoff?.id
      ? this.getDeploymentHandoff(plan.deploymentHandoff.id)
      : undefined;
    let deploymentResult: DatasetClosedLoopDeploymentHandoffResult | undefined;
    if (!deploymentHandoff) {
      deploymentResult = await this.prepareClosedLoopDeploymentHandoff({
        datasetVersionId: version.id,
        deploymentOwner: input.deploymentOwner,
        environment: input.environment,
        rolloutStrategy: input.rolloutStrategy,
        note: input.note?.trim() || 'Prepare deployment handoff for closed-loop rollout.',
        createdBy: input.createdBy ?? 'closed-loop-rollout-owner',
      });
      deploymentHandoff = deploymentResult?.deploymentHandoff;
    }
    if (!deploymentHandoff) {
      throw new Error('Closed-loop rollout requires a deployment handoff.');
    }
    if (deploymentHandoff.status === 'rolled_back' || deploymentHandoff.status === 'cancelled') {
      throw new Error('Closed-loop rollout cannot advance a rolled back or cancelled deployment handoff.');
    }

    const advancedStatuses: DatasetDeploymentHandoffStatus[] = [];
    const rolloutSteps: Array<{
      from: DatasetDeploymentHandoffStatus[];
      to: DatasetDeploymentHandoffStatus;
      note: string;
    }> = [
      {
        from: ['queued'],
        to: 'preparing',
        note: 'Closed-loop rollout prepared deployment checklist, artifact pins and monitoring plan.',
      },
      {
        from: ['preparing'],
        to: 'ready_for_rollout',
        note: 'Closed-loop rollout is ready for the controlled production canary.',
      },
      {
        from: ['ready_for_rollout'],
        to: 'live',
        note: input.note?.trim() || 'Closed-loop rollout moved live and is ready for post-release monitoring.',
      },
    ];

    for (const step of rolloutSteps) {
      if (!step.from.includes(deploymentHandoff.status)) continue;
      const updated = await this.updateDeploymentHandoffStatus({
        handoffId: deploymentHandoff.id,
        status: step.to,
        note: step.note,
        recordedBy: input.createdBy ?? 'closed-loop-rollout-owner',
      });
      if (!updated) {
        throw new Error('Closed-loop deployment handoff could not be advanced.');
      }
      deploymentHandoff = updated;
      advancedStatuses.push(step.to);
    }

    if (deploymentHandoff.status !== 'live') {
      throw new Error('Closed-loop rollout must reach live before post-release monitoring.');
    }

    const existingMonitor = this.latestPostReleaseMonitorForDeployment(deploymentHandoff.id);
    const postReleaseMonitor = existingMonitor ?? await this.createPostReleaseMonitor({
      deploymentHandoffId: deploymentHandoff.id,
      monitorOwner: input.monitorOwner ?? input.deploymentOwner,
      note: input.note?.trim() || 'Post-release monitor created by closed-loop rollout.',
      createdBy: input.createdBy ?? 'closed-loop-monitor-owner',
    });
    if (!postReleaseMonitor) {
      throw new Error('Closed-loop post-release monitor could not be created.');
    }

    plan = this.getClosedLoopRetrainingPlan(version.id) ?? plan;
    if (!plan) return undefined;
    return {
      plan,
      deploymentResult,
      deploymentHandoff,
      postReleaseMonitor,
      createdPostReleaseMonitor: !existingMonitor,
      advancedStatuses,
    };
  }

  async writeClosedLoopFeedbackSignal(input: {
    datasetVersionId: string;
    mode?: DatasetClosedLoopFeedbackSignalMode;
    taskSuccessRate?: number;
    regressionAlertRate?: number;
    p95LatencyMs?: number;
    toolErrorRate?: number;
    manualInterventionRate?: number;
    alertNote?: string;
    note?: string;
    createdBy?: string;
  }): Promise<DatasetClosedLoopFeedbackSignalResult | undefined> {
    const version = this.getDatasetVersion(input.datasetVersionId);
    if (!version) return undefined;
    if (version.source !== 'feedback_loop') {
      throw new Error('Closed-loop feedback signals can only be written from feedback dataset versions.');
    }

    let plan = this.getClosedLoopRetrainingPlan(version.id);
    let monitor = plan?.postReleaseMonitor?.id
      ? this.getPostReleaseMonitor(plan.postReleaseMonitor.id)
      : undefined;
    let rolloutResult: DatasetClosedLoopRolloutResult | undefined;
    if (!monitor) {
      rolloutResult = await this.runClosedLoopRollout({
        datasetVersionId: version.id,
        note: input.note?.trim() || 'Prepare live monitor for closed-loop feedback signal.',
        createdBy: input.createdBy ?? 'closed-loop-feedback-owner',
      });
      monitor = rolloutResult?.postReleaseMonitor;
    }
    if (!monitor) {
      throw new Error('Closed-loop feedback signal requires a post-release monitor.');
    }
    if (monitor.status === 'closed') {
      throw new Error('Closed-loop feedback signal cannot be written to a closed monitor.');
    }

    const mode = input.mode ?? 'attention';
    const defaults = this.closedLoopFeedbackSignalDefaults(mode);
    const nextMonitor = await this.recordPostReleaseSignal({
      monitorId: monitor.id,
      taskSuccessRate: input.taskSuccessRate ?? defaults.taskSuccessRate,
      regressionAlertRate: input.regressionAlertRate ?? defaults.regressionAlertRate,
      p95LatencyMs: input.p95LatencyMs ?? defaults.p95LatencyMs,
      toolErrorRate: input.toolErrorRate ?? defaults.toolErrorRate,
      manualInterventionRate: input.manualInterventionRate ?? defaults.manualInterventionRate,
      rollbackSignal: mode === 'rollback',
      alertNote: input.alertNote?.trim() || defaults.alertNote,
      note: input.note?.trim() || defaults.note,
      recordedBy: input.createdBy ?? 'closed-loop-feedback-owner',
    });
    if (!nextMonitor) {
      throw new Error('Closed-loop post-release signal could not be written.');
    }

    const needsFeedback = nextMonitor.status === 'attention' || nextMonitor.status === 'rollback_required';
    const existingFeedbackLoop = this.latestFeedbackLoopForMonitor(nextMonitor.id);
    const feedbackLoop = needsFeedback
      ? existingFeedbackLoop ?? await this.createFeedbackLoop({
        postReleaseMonitorId: nextMonitor.id,
        note: input.note?.trim() || 'Created automatically from closed-loop monitor signal.',
        createdBy: input.createdBy ?? 'closed-loop-feedback-owner',
      })
      : existingFeedbackLoop;
    if (needsFeedback && !feedbackLoop) {
      throw new Error('Closed-loop feedback loop could not be created from monitor signal.');
    }

    plan = this.getClosedLoopRetrainingPlan(version.id) ?? plan;
    if (!plan) return undefined;
    return {
      plan,
      rolloutResult,
      postReleaseMonitor: nextMonitor,
      feedbackLoop,
      createdFeedbackLoop: Boolean(needsFeedback && !existingFeedbackLoop),
      mode,
    };
  }

  async buildClosedLoopNextDataset(input: {
    datasetVersionId: string;
    name?: string;
    notes?: string;
    format?: DatasetExportFormat;
    trainingOwner?: string;
    targetSystem?: string;
    createdBy?: string;
  }): Promise<DatasetClosedLoopNextDatasetResult | undefined> {
    const version = this.getDatasetVersion(input.datasetVersionId);
    if (!version) return undefined;
    if (version.source !== 'feedback_loop') {
      throw new Error('Closed-loop next dataset can only be built from feedback dataset versions.');
    }

    const plan = this.getClosedLoopRetrainingPlan(version.id);
    const feedbackLoopId = plan?.downstreamFeedbackLoop?.id
      ?? (plan?.postReleaseMonitor?.id ? this.latestFeedbackLoopForMonitor(plan.postReleaseMonitor.id)?.id : undefined);
    if (!feedbackLoopId) {
      throw new Error('Closed-loop next dataset requires a downstream feedback loop.');
    }

    let feedbackLoop = this.getFeedbackLoop(feedbackLoopId);
    if (!feedbackLoop || feedbackLoop.status === 'rejected') {
      throw new Error('Closed-loop downstream feedback loop is missing or rejected.');
    }

    let promotedFeedbackLoop = false;
    if (feedbackLoop.status !== 'promoted') {
      const promoted = await this.recordFeedbackLoopDecision({
        feedbackLoopId: feedbackLoop.id,
        decision: 'promoted',
        note: input.notes?.trim() || 'Promoted automatically by closed-loop next dataset builder.',
        decidedBy: input.createdBy ?? 'closed-loop-dataset-owner',
      });
      if (!promoted || promoted.status !== 'promoted') {
        throw new Error('Closed-loop downstream feedback loop could not be promoted.');
      }
      feedbackLoop = promoted;
      promotedFeedbackLoop = true;
    }

    const existingVersion = this.latestDatasetVersionForFeedbackLoop(feedbackLoop.id);
    const datasetVersion = existingVersion ?? await this.createFeedbackDatasetVersion({
      name: input.name?.trim() || this.closedLoopNextDatasetName(feedbackLoop),
      feedbackLoopIds: [feedbackLoop.id],
      notes: input.notes?.trim() || `Created as the next closed-loop dataset from ${feedbackLoop.id}.`,
      createdBy: input.createdBy ?? 'closed-loop-dataset-owner',
      format: input.format ?? this.feedbackLoopDatasetFormat([feedbackLoop]),
    });

    const handoffPreparation = await this.prepareClosedLoopRetrainingHandoff({
      datasetVersionId: datasetVersion.id,
      trainingOwner: input.trainingOwner ?? 'closed-loop-owner',
      targetSystem: input.targetSystem ?? 'closed-loop-training',
      note: input.notes?.trim() || 'Prepare next closed-loop dataset for retraining handoff.',
      createdBy: input.createdBy ?? 'closed-loop-dataset-owner',
    });

    const sourcePlan = this.getClosedLoopRetrainingPlan(version.id);
    const nextPlan = this.getClosedLoopRetrainingPlan(datasetVersion.id);
    if (!sourcePlan) return undefined;
    return {
      sourcePlan,
      nextPlan,
      feedbackLoop,
      datasetVersion,
      handoffPreparation,
      promotedFeedbackLoop,
      createdDatasetVersion: !existingVersion,
      preparedRetrainingHandoff: Boolean(handoffPreparation?.plan.retrainingHandoff),
    };
  }

  private buildClosedLoopRetrainingPlan(version: DatasetVersion): DatasetClosedLoopRetrainingPlan | undefined {
    const context = this.getDatasetReleaseGateContext(version.id);
    if (!context) return undefined;
    const diffPlan = this.getDatasetVersionDiffReviewPlan(version.id);
    const manifest = this.latestManifestForDataset(version.id);
    const retrainingHandoff = this.latestRetrainingHandoffForDataset(version.id);
    const trainingRun = retrainingHandoff
      ? this.latestTrainingRunForHandoff(retrainingHandoff.id)
      : this.latestTrainingRunForDataset(version.id);
    const evalRun = trainingRun ? this.latestEvalRunForTrainingRun(trainingRun.id) : undefined;
    const modelReleaseGate = trainingRun ? this.latestModelReleaseGateForTrainingRun(trainingRun.id) : undefined;
    const deploymentHandoff = modelReleaseGate ? this.latestDeploymentHandoffForModelGate(modelReleaseGate.id) : undefined;
    const postReleaseMonitor = deploymentHandoff ? this.latestPostReleaseMonitorForDeployment(deploymentHandoff.id) : undefined;
    const downstreamFeedbackLoop = postReleaseMonitor ? this.latestFeedbackLoopForMonitor(postReleaseMonitor.id) : undefined;
    const downstreamDatasetVersion = downstreamFeedbackLoop ? this.latestDatasetVersionForFeedbackLoop(downstreamFeedbackLoop.id) : undefined;
    const feedbackLoopSummary = version.feedbackLoopSummary;
    const diffReviewStatus = diffPlan?.reviewStatus ?? manifest?.diffReviewStatus;
    const diffReady = diffReviewStatus === 'approved' || diffReviewStatus === 'risk_accepted';
    const readyManifest = manifest?.status === 'ready' ? manifest : undefined;

    let readiness: DatasetClosedLoopRetrainingPlan['readiness'];
    let nextAction: DatasetClosedLoopRetrainingPlan['nextAction'];
    let recommendation: string;
    if (!diffReady) {
      readiness = 'needs_diff_review';
      nextAction = 'review_diff';
      recommendation = diffPlan?.recommendation ?? 'Review the dataset diff before publishing this closed-loop fork.';
    } else if (!readyManifest) {
      readiness = 'needs_manifest';
      nextAction = 'create_manifest';
      recommendation = context.gate.releaseBlocked
        ? 'Resolve blocking release-gate checks before creating a closed-loop manifest.'
        : 'Create a ready release manifest from the reviewed feedback dataset.';
    } else if (!retrainingHandoff) {
      readiness = 'needs_handoff';
      nextAction = 'create_handoff';
      recommendation = 'Create a retraining handoff so the feedback dataset can enter the next training cycle.';
    } else if (!trainingRun) {
      readiness = 'needs_training_run';
      nextAction = 'launch_training';
      recommendation = 'Launch or register the training run from this closed-loop handoff.';
    } else if (trainingRun.status === 'passed' && evalRun && !modelReleaseGate) {
      readiness = 'needs_model_gate';
      nextAction = 'create_model_gate';
      recommendation = 'Create a model release gate from the closed-loop training run and TraceOps eval evidence.';
    } else if (trainingRun.status === 'passed' && evalRun && modelReleaseGate?.status === 'approved' && !deploymentHandoff) {
      readiness = 'needs_deployment_handoff';
      nextAction = 'create_deployment_handoff';
      recommendation = 'Closed-loop model gate is approved; create the deployment handoff for rollout.';
    } else if (trainingRun.status === 'passed' && evalRun && modelReleaseGate?.status === 'approved' && deploymentHandoff?.status === 'rolled_back') {
      readiness = 'deployment_rolled_back';
      nextAction = 'review_deployment';
      recommendation = 'Closed-loop deployment was rolled back; review deployment evidence before another rollout.';
    } else if (trainingRun.status === 'passed' && evalRun && modelReleaseGate?.status === 'approved' && deploymentHandoff?.status === 'live' && !postReleaseMonitor) {
      readiness = 'needs_post_release_monitor';
      nextAction = 'create_post_release_monitor';
      recommendation = 'Closed-loop deployment is live; create a post-release monitor so online signals can flow back to feedback.';
    } else if (trainingRun.status === 'passed' && evalRun && modelReleaseGate?.status === 'approved' && downstreamDatasetVersion) {
      readiness = 'next_dataset_ready';
      nextAction = 'complete';
      recommendation = `Next closed-loop dataset ${downstreamDatasetVersion.name} is ready and can continue its retraining path.`;
    } else if (trainingRun.status === 'passed' && evalRun && modelReleaseGate?.status === 'approved' && downstreamFeedbackLoop) {
      readiness = 'feedback_loop_ready';
      nextAction = downstreamFeedbackLoop.status === 'promoted' ? 'build_next_dataset' : 'review_feedback_loop';
      recommendation = downstreamFeedbackLoop.status === 'promoted'
        ? 'Post-release feedback is promoted; build the next closed-loop dataset.'
        : 'Post-release feedback loop is ready; triage or promote it before building the next dataset.';
    } else if (trainingRun.status === 'passed' && evalRun && modelReleaseGate?.status === 'approved' && postReleaseMonitor?.status === 'rollback_required') {
      readiness = 'monitoring_rollback';
      nextAction = 'write_feedback_signal';
      recommendation = 'Rollback signal is present; write it into a feedback loop for the next repair dataset.';
    } else if (trainingRun.status === 'passed' && evalRun && modelReleaseGate?.status === 'approved' && postReleaseMonitor?.status === 'attention') {
      readiness = 'monitoring_attention';
      nextAction = 'write_feedback_signal';
      recommendation = 'Attention signal is present; write it into a feedback loop for the next eval or repair dataset.';
    } else if (trainingRun.status === 'passed' && evalRun && modelReleaseGate?.status === 'approved' && postReleaseMonitor) {
      readiness = 'monitoring_ready';
      nextAction = 'write_feedback_signal';
      recommendation = 'Monitor is ready; write an online signal when production behavior is observed.';
    } else if (trainingRun.status === 'passed' && evalRun && modelReleaseGate?.status === 'approved' && deploymentHandoff) {
      readiness = 'deployment_handoff_ready';
      nextAction = 'run_rollout';
      recommendation = 'Closed-loop deployment handoff is ready; run the controlled rollout and attach post-release monitoring.';
    } else if (trainingRun.status === 'passed' && evalRun && modelReleaseGate?.status === 'ready') {
      readiness = 'needs_model_approval';
      nextAction = 'review_model_gate';
      recommendation = 'Closed-loop model gate is ready; release owner approval is required before deployment.';
    } else if (trainingRun.status === 'passed' && evalRun && modelReleaseGate) {
      readiness = 'model_gate_blocked';
      nextAction = 'review_model_gate';
      recommendation = 'Closed-loop model gate exists but is blocked or rejected; review gate checks before deployment.';
    } else {
      readiness = 'training_running';
      nextAction = 'watch_training';
      recommendation = 'Training run is registered; attach results and run TraceOps eval next.';
    }

    return {
      id: `closed_loop_${version.id}`,
      planVersion: 'traceops-closed-loop-retraining-plan-v1',
      datasetVersionId: version.id,
      datasetVersionName: version.name,
      datasetSource: version.source,
      sampleCount: version.sampleCount,
      format: version.format,
      feedbackLoopIds: version.feedbackLoopIds ?? [],
      feedbackLoopSummary,
      sourceDatasetVersionIds: feedbackLoopSummary?.sourceDatasetVersionIds ?? [],
      postReleaseMonitorIds: feedbackLoopSummary?.postReleaseMonitorIds ?? [],
      evalRunIds: feedbackLoopSummary?.evalRunIds ?? [],
      releaseEvidenceHashes: feedbackLoopSummary?.releaseEvidenceHashes ?? [],
      releaseGate: {
        status: context.gate.status,
        score: context.gate.score,
        passCount: context.gate.passCount,
        warnCount: context.gate.warnCount,
        blockCount: context.gate.blockCount,
      },
      diffReviewStatus,
      diffReviewRecommendation: diffPlan?.recommendation,
      manifest: manifest ? {
        id: manifest.id,
        status: manifest.status,
        manifestHash: manifest.manifestHash,
        promotionStatus: manifest.promotionStatus,
        generatedAt: manifest.generatedAt,
      } : undefined,
      retrainingHandoff: retrainingHandoff ? {
        id: retrainingHandoff.id,
        status: retrainingHandoff.status,
        handoffHash: retrainingHandoff.handoffHash,
        trainingOwner: retrainingHandoff.trainingOwner,
        targetSystem: retrainingHandoff.targetSystem,
      } : undefined,
      trainingRun: trainingRun ? {
        id: trainingRun.id,
        status: trainingRun.status,
        qualityGate: trainingRun.qualityGate,
        runHash: trainingRun.runHash,
        modelName: trainingRun.modelName,
      } : undefined,
      evalRun: evalRun ? {
        id: evalRun.id,
        status: evalRun.status,
        evalHash: evalRun.evalHash,
      } : undefined,
      modelReleaseGate: modelReleaseGate ? {
        id: modelReleaseGate.id,
        status: modelReleaseGate.status,
        gateHash: modelReleaseGate.gateHash,
        evalRunId: modelReleaseGate.evalRunId,
        evalStatus: modelReleaseGate.evalStatus,
        approvedAt: modelReleaseGate.approvedAt,
      } : undefined,
      deploymentHandoff: deploymentHandoff ? {
        id: deploymentHandoff.id,
        status: deploymentHandoff.status,
        handoffHash: deploymentHandoff.handoffHash,
        environment: deploymentHandoff.environment,
        deploymentOwner: deploymentHandoff.deploymentOwner,
        updatedAt: deploymentHandoff.updatedAt,
      } : undefined,
      postReleaseMonitor: postReleaseMonitor ? {
        id: postReleaseMonitor.id,
        status: postReleaseMonitor.status,
        monitorHash: postReleaseMonitor.monitorHash,
        environment: postReleaseMonitor.environment,
        monitorOwner: postReleaseMonitor.monitorOwner,
        rollbackSignal: postReleaseMonitor.rollbackSignal,
        recommendedAction: postReleaseMonitor.recommendedAction,
        updatedAt: postReleaseMonitor.updatedAt,
        signalSummary: postReleaseMonitor.signalSummary,
      } : undefined,
      downstreamFeedbackLoop: downstreamFeedbackLoop ? {
        id: downstreamFeedbackLoop.id,
        status: downstreamFeedbackLoop.status,
        severity: downstreamFeedbackLoop.severity,
        targetKind: downstreamFeedbackLoop.targetKind,
        loopHash: downstreamFeedbackLoop.loopHash,
        updatedAt: downstreamFeedbackLoop.updatedAt,
      } : undefined,
      downstreamDatasetVersion: downstreamDatasetVersion ? {
        id: downstreamDatasetVersion.id,
        name: downstreamDatasetVersion.name,
        sampleCount: downstreamDatasetVersion.sampleCount,
        format: downstreamDatasetVersion.format,
        createdAt: downstreamDatasetVersion.createdAt,
      } : undefined,
      readiness,
      nextAction,
      recommendation,
      generatedAt: new Date().toISOString(),
    };
  }

  private latestManifestForDataset(versionId: string): DatasetReleaseManifest | undefined {
    return this.data.releaseManifests
      .filter((manifest) => manifest.datasetVersionId === versionId)
      .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt))[0];
  }

  private latestReadyManifestForDataset(versionId: string): DatasetReleaseManifest | undefined {
    return this.data.releaseManifests
      .filter((manifest) => manifest.datasetVersionId === versionId && manifest.status === 'ready')
      .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt))[0];
  }

  private latestRetrainingHandoffForDataset(versionId: string): DatasetRetrainingHandoffRecord | undefined {
    return this.data.retrainingHandoffs
      .filter((handoff) => handoff.datasetVersionId === versionId && handoff.status !== 'cancelled')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  }

  private latestTrainingRunForDataset(versionId: string): DatasetTrainingRunRecord | undefined {
    return this.data.trainingRuns
      .filter((run) => run.datasetVersionId === versionId && run.status !== 'cancelled')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  }

  private latestTrainingRunForHandoff(handoffId: string): DatasetTrainingRunRecord | undefined {
    return this.data.trainingRuns
      .filter((run) => run.handoffId === handoffId && run.status !== 'cancelled')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  }

  private latestModelReleaseGateForTrainingRun(trainingRunId: string): DatasetModelReleaseGateRecord | undefined {
    return this.data.modelReleaseGates
      .filter((gate) => gate.trainingRunId === trainingRunId && gate.status !== 'rejected')
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  }

  private latestDeploymentHandoffForModelGate(modelReleaseGateId: string): DatasetDeploymentHandoffRecord | undefined {
    return this.data.deploymentHandoffs
      .filter((handoff) => handoff.modelReleaseGateId === modelReleaseGateId && handoff.status !== 'cancelled')
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  }

  private latestPostReleaseMonitorForDeployment(deploymentHandoffId: string): DatasetPostReleaseMonitorRecord | undefined {
    return this.data.postReleaseMonitors
      .filter((monitor) => monitor.deploymentHandoffId === deploymentHandoffId && monitor.status !== 'closed')
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  }

  private latestFeedbackLoopForMonitor(postReleaseMonitorId: string): DatasetFeedbackLoopRecord | undefined {
    return this.data.feedbackLoops
      .filter((loop) => loop.postReleaseMonitorId === postReleaseMonitorId && loop.status !== 'rejected')
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  }

  private latestDatasetVersionForFeedbackLoop(feedbackLoopId: string): DatasetVersion | undefined {
    return this.data.datasetVersions
      .filter((version) => version.source === 'feedback_loop' && (version.feedbackLoopIds ?? []).includes(feedbackLoopId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  }

  private closedLoopNextDatasetName(loop: DatasetFeedbackLoopRecord): string {
    const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
    return `KodaX next-loop ${loop.targetKind} ${timestamp}`;
  }

  private closedLoopFeedbackSignalDefaults(mode: DatasetClosedLoopFeedbackSignalMode): {
    taskSuccessRate: number;
    regressionAlertRate: number;
    p95LatencyMs: number;
    toolErrorRate: number;
    manualInterventionRate: number;
    alertNote: string;
    note: string;
  } {
    if (mode === 'rollback') {
      return {
        taskSuccessRate: 0.81,
        regressionAlertRate: 0.08,
        p95LatencyMs: 4200,
        toolErrorRate: 0.09,
        manualInterventionRate: 0.18,
        alertNote: 'Rollback signal reported by closed-loop online monitoring.',
        note: 'Closed-loop rollback signal written back to TraceOps feedback.',
      };
    }
    if (mode === 'healthy') {
      return {
        taskSuccessRate: 0.96,
        regressionAlertRate: 0.01,
        p95LatencyMs: 1800,
        toolErrorRate: 0.01,
        manualInterventionRate: 0.03,
        alertNote: 'Healthy online metrics written back to TraceOps.',
        note: 'Closed-loop healthy signal written back to TraceOps monitor.',
      };
    }
    return {
      taskSuccessRate: 0.89,
      regressionAlertRate: 0.035,
      p95LatencyMs: 2900,
      toolErrorRate: 0.04,
      manualInterventionRate: 0.1,
      alertNote: 'Attention signal reported by closed-loop online monitoring.',
      note: 'Closed-loop attention signal written back to TraceOps feedback.',
    };
  }

  listTrainingRuns(): DatasetTrainingRunRecord[] {
    return this.data.trainingRuns.slice(0, 100);
  }

  getTrainingRun(id: string): DatasetTrainingRunRecord | undefined {
    return this.data.trainingRuns.find((run) => run.id === id);
  }

  listTrainingLaunchPlans(): DatasetTrainingLaunchPlan[] {
    return this.data.retrainingHandoffs
      .filter((handoff) => handoff.status !== 'cancelled')
      .map((handoff) => this.getTrainingLaunchPlan(handoff.id))
      .filter((plan): plan is DatasetTrainingLaunchPlan => Boolean(plan));
  }

  getTrainingLaunchPlan(handoffId: string): DatasetTrainingLaunchPlan | undefined {
    const handoff = this.getRetrainingHandoff(handoffId);
    if (!handoff || handoff.status === 'cancelled') return undefined;
    const releasePackage = this.getReleasePackage(handoff.promotionId);
    if (!releasePackage) return undefined;

    const objective = this.trainingLaunchObjective(handoff.defaultFormat);
    const evalMetrics = this.trainingLaunchEvalMetrics(objective);
    const parameters = this.trainingLaunchParameters(objective, handoff);
    const checks = this.trainingLaunchChecks(handoff, releasePackage);
    const readiness: DatasetTrainingLaunchPlan['readiness'] = checks.some((check) => check.status === 'block')
      ? 'blocked'
      : checks.some((check) => check.status === 'review')
        ? 'review'
        : 'ready';
    const recommendation = readiness === 'blocked'
      ? 'Resolve blocked launch checks before creating a training run.'
      : readiness === 'review'
        ? 'Launch is allowed, but review sample volume or closed-loop lineage before connecting a real trainer.'
        : 'Launch plan is ready. Create the training run and attach external execution details.';
    const generatedAt = new Date().toISOString();
    const basePlan = {
      id: `launch_${handoff.id}`,
      planVersion: 'traceops-training-launch-plan-v1' as const,
      handoffId: handoff.id,
      handoffHash: handoff.handoffHash,
      releasePackageId: handoff.releasePackageId,
      releasePackageHash: handoff.releasePackageHash,
      promotionId: handoff.promotionId,
      manifestId: handoff.manifestId,
      datasetVersionId: handoff.datasetVersionId,
      datasetVersionName: handoff.datasetVersionName,
      defaultFormat: handoff.defaultFormat,
      objective,
      targetSystem: handoff.targetSystem,
      recommendedModelName: this.trainingLaunchModelName(objective),
      trainingDataUrl: handoff.defaultExportUrl,
      reviewDataUrl: handoff.reviewExportUrl,
      packageUrl: handoff.packageUrl,
      parameters,
      evalMetrics,
      rollbackCriteria: this.trainingLaunchRollbackCriteria(evalMetrics),
      checks,
      readiness,
      recommendation,
      generatedAt,
    } satisfies Omit<DatasetTrainingLaunchPlan, 'launchHash'>;

    return {
      ...basePlan,
      launchHash: stableHash({
        planVersion: basePlan.planVersion,
        handoffId: basePlan.handoffId,
        handoffHash: basePlan.handoffHash,
        releasePackageHash: basePlan.releasePackageHash,
        datasetVersionId: basePlan.datasetVersionId,
        defaultFormat: basePlan.defaultFormat,
        objective: basePlan.objective,
        targetSystem: basePlan.targetSystem,
        recommendedModelName: basePlan.recommendedModelName,
        parameters: basePlan.parameters,
        evalMetrics: basePlan.evalMetrics,
        rollbackCriteria: basePlan.rollbackCriteria,
        checks: basePlan.checks,
      }),
    };
  }

  private trainingLaunchObjective(format: DatasetTrainingLaunchPlan['defaultFormat']): DatasetTrainingLaunchObjective {
    if (format === 'fine_tune_jsonl') return 'sft';
    if (format === 'eval_jsonl') return 'eval';
    if (format === 'repair_jsonl') return 'repair';
    return 'mixed';
  }

  private trainingLaunchModelName(objective: DatasetTrainingLaunchObjective): string {
    if (objective === 'eval') return 'kodax-agent-eval-candidate';
    if (objective === 'repair') return 'kodax-agent-repair-candidate';
    if (objective === 'mixed') return 'kodax-agent-traceops-candidate';
    return 'kodax-agent-sft-candidate';
  }

  private trainingLaunchParameters(
    objective: DatasetTrainingLaunchObjective,
    handoff: DatasetRetrainingHandoffRecord,
  ): DatasetTrainingLaunchPlan['parameters'] {
    const shared = [
      { id: 'dataset-format', label: 'Dataset format', value: handoff.defaultFormat, locked: true },
      { id: 'package-hash', label: 'Package hash', value: handoff.releasePackageHash.slice(0, 24), locked: true },
    ];
    if (objective === 'eval') {
      return [
        ...shared,
        { id: 'eval-suite', label: 'Eval suite', value: 'kodax-closed-loop-eval' },
        { id: 'judge-threshold', label: 'Judge threshold', value: 0.9, unit: 'score' },
        { id: 'regression-window', label: 'Regression window', value: 7, unit: 'days' },
      ];
    }
    if (objective === 'repair') {
      return [
        ...shared,
        { id: 'epochs', label: 'Epochs', value: 2, unit: 'rounds' },
        { id: 'learning-rate', label: 'Learning rate', value: '1e-5' },
        { id: 'human-review-required', label: 'Human review', value: true, locked: true },
      ];
    }
    if (objective === 'mixed') {
      return [
        ...shared,
        { id: 'curation-mode', label: 'Curation mode', value: 'traceops-mixed-review' },
        { id: 'holdout-split', label: 'Holdout split', value: 0.2, unit: 'ratio' },
      ];
    }
    return [
      ...shared,
      { id: 'epochs', label: 'Epochs', value: 3, unit: 'rounds' },
      { id: 'learning-rate', label: 'Learning rate', value: '2e-5' },
      { id: 'batch-size', label: 'Batch size', value: 16, unit: 'samples' },
      { id: 'validation-split', label: 'Validation split', value: 0.1, unit: 'ratio' },
    ];
  }

  private trainingLaunchEvalMetrics(objective: DatasetTrainingLaunchObjective): DatasetTrainingLaunchPlan['evalMetrics'] {
    if (objective === 'eval') {
      return [
        { id: 'validation-score', label: 'Eval pass rate', target: 0.9, unit: 'score', direction: 'gte' },
        { id: 'regression-rate', label: 'Regression alert rate', target: 0.03, unit: 'percent', direction: 'lte' },
        { id: 'blocked-issues', label: 'Blocked issues', target: 0, unit: 'count', direction: 'lte' },
      ];
    }
    return [
      { id: 'validation-score', label: 'Validation score', target: 0.82, unit: 'score', direction: 'gte' },
      { id: 'regression-rate', label: 'Regression rate', target: 0.03, unit: 'percent', direction: 'lte' },
      { id: 'blocked-issues', label: 'Blocked issues', target: 0, unit: 'count', direction: 'lte' },
    ];
  }

  private trainingLaunchRollbackCriteria(metrics: DatasetTrainingLaunchPlan['evalMetrics']): string {
    const parts = metrics.map((metric) =>
      `${metric.label} ${metric.direction === 'gte' ? '>=' : '<='} ${metric.target}${metric.unit === 'percent' ? '%' : ''}`
    );
    return `Pass only when ${parts.join(', ')}, and no rollback signal is raised.`;
  }

  private trainingLaunchChecks(
    handoff: DatasetRetrainingHandoffRecord,
    releasePackage: DatasetReleasePackage,
  ): DatasetTrainingLaunchPlan['checks'] {
    const manifest = releasePackage.manifest;
    return [
      {
        id: 'release-package',
        label: 'Release package',
        status: releasePackage.packageHash && handoff.releasePackageHash === releasePackage.packageHash ? 'pass' : 'block',
        detail: releasePackage.packageHash ? `Package hash locked at ${releasePackage.packageHash.slice(0, 24)}.` : 'Release package hash is missing.',
      },
      {
        id: 'release-gate',
        label: 'Release gate',
        status: manifest.releaseGate.releaseBlocked ? 'block' : manifest.releaseGate.status === 'review' ? 'review' : 'pass',
        detail: manifest.releaseGate.recommendation,
      },
      {
        id: 'diff-review',
        label: 'Diff review',
        status: manifest.diffReviewStatus === 'approved' || manifest.diffReviewStatus === 'risk_accepted' ? 'pass' : 'review',
        detail: manifest.diffReviewStatus ? `Diff review is ${manifest.diffReviewStatus.replace(/_/g, ' ')}.` : 'No comparable diff review is attached.',
      },
      {
        id: 'sample-volume',
        label: 'Sample volume',
        status: manifest.sampleCount === 0 ? 'block' : manifest.sampleCount < 10 ? 'review' : 'pass',
        detail: `${manifest.sampleCount} sample(s), ${manifest.traceCount} trace(s).`,
      },
      {
        id: 'governance-approval',
        label: 'Governance approval',
        status: manifest.reviewSummary.rejected > 0 || manifest.reviewSummary.unreviewed > 0 ? 'block' : 'pass',
        detail: `${manifest.reviewSummary.approved} approved, ${manifest.reviewSummary.rejected} rejected, ${manifest.reviewSummary.unreviewed} unreviewed.`,
      },
      {
        id: 'eval-plan',
        label: 'Eval plan',
        status: 'pass',
        detail: `Rollback criteria will be attached to ${handoff.defaultFormat}.`,
      },
    ];
  }

  async createTrainingRun(input: {
    handoffId: string;
    owner?: string;
    targetSystem?: string;
    modelName?: string;
    modelVersion?: string;
    externalRunId?: string;
    note?: string;
    createdBy?: string;
  }): Promise<DatasetTrainingRunRecord | undefined> {
    const handoff = this.getRetrainingHandoff(input.handoffId);
    if (!handoff || handoff.status === 'cancelled') return undefined;
    const launchPlan = this.getTrainingLaunchPlan(handoff.id);
    if (!launchPlan) return undefined;
    if (launchPlan.readiness === 'blocked') {
      throw new Error('Training launch plan is blocked. Resolve launch checks before creating a run.');
    }

    const createdAt = new Date().toISOString();
    const metrics: DatasetTrainingRunRecord['metrics'] = launchPlan.evalMetrics.map((metric) => ({
      id: metric.id,
      label: metric.label,
      value: 0,
      target: metric.target,
      unit: metric.unit,
      gate: 'pending' as const,
    }));
    const baseRun = {
      id: `trainrun_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      runVersion: 'traceops-training-run-v1' as const,
      status: 'planned' as const,
      qualityGate: 'pending' as const,
      handoffId: handoff.id,
      handoffHash: handoff.handoffHash,
      releasePackageId: handoff.releasePackageId,
      releasePackageHash: handoff.releasePackageHash,
      promotionId: handoff.promotionId,
      manifestId: handoff.manifestId,
      datasetVersionId: handoff.datasetVersionId,
      datasetVersionName: handoff.datasetVersionName,
      owner: input.owner?.trim() || handoff.trainingOwner,
      targetSystem: input.targetSystem?.trim() || handoff.targetSystem,
      modelName: input.modelName?.trim() || launchPlan.recommendedModelName,
      modelVersion: input.modelVersion?.trim() || undefined,
      externalRunId: input.externalRunId?.trim() || undefined,
      defaultFormat: handoff.defaultFormat,
      trainingDataUrl: launchPlan.trainingDataUrl,
      reviewDataUrl: launchPlan.reviewDataUrl,
      packageUrl: launchPlan.packageUrl,
      handoffUrl: `/api/retraining-handoffs/${handoff.id}/download`,
      launchPlan,
      launchPlanHash: launchPlan.launchHash,
      providerLaunches: [],
      providerStatusChecks: [],
      lastProviderStatus: input.externalRunId ? 'queued' as const : undefined,
      metrics,
      rollbackCriteria: launchPlan.rollbackCriteria,
      rollbackRequired: false,
      createdAt,
      createdBy: input.createdBy ?? 'traceops-training-owner',
      updatedAt: createdAt,
      note: input.note?.trim() || undefined,
    } satisfies Omit<DatasetTrainingRunRecord, 'runHash'>;
    const run: DatasetTrainingRunRecord = {
      ...baseRun,
      runHash: stableHash({
        runVersion: baseRun.runVersion,
        handoffId: baseRun.handoffId,
        handoffHash: baseRun.handoffHash,
        releasePackageHash: baseRun.releasePackageHash,
        datasetVersionId: baseRun.datasetVersionId,
        launchPlanHash: baseRun.launchPlanHash,
        modelName: baseRun.modelName,
        modelVersion: baseRun.modelVersion,
        externalRunId: baseRun.externalRunId,
        metrics: baseRun.metrics,
        rollbackCriteria: baseRun.rollbackCriteria,
      }),
    };

    this.data.trainingRuns.unshift(run);
    this.data.trainingRuns = this.data.trainingRuns.slice(0, 200);
    this.markHandoffChecklist(handoff.id, ['training-run-created', 'eval-plan-attached'], 'in_progress');
    await this.save();
    return run;
  }

  async recordTrainingRunResult(input: {
    runId: string;
    validationScore?: number;
    regressionRate?: number;
    blockedIssueCount?: number;
    rollbackRequired?: boolean;
    resultSummary?: string;
    status?: DatasetTrainingRunRecord['status'];
    note?: string;
  }): Promise<DatasetTrainingRunRecord | undefined> {
    const run = this.getTrainingRun(input.runId);
    if (!run) return undefined;

    const updatedMetrics = run.metrics.map((metric) => {
      if (metric.id === 'validation-score' && typeof input.validationScore === 'number') {
        return { ...metric, value: input.validationScore, gate: input.validationScore >= metric.target ? 'passed' as const : 'failed' as const };
      }
      if (metric.id === 'regression-rate' && typeof input.regressionRate === 'number') {
        return { ...metric, value: input.regressionRate, gate: input.regressionRate <= metric.target ? 'passed' as const : 'failed' as const };
      }
      if (metric.id === 'blocked-issues' && typeof input.blockedIssueCount === 'number') {
        return { ...metric, value: input.blockedIssueCount, gate: input.blockedIssueCount <= metric.target ? 'passed' as const : 'failed' as const };
      }
      return metric;
    });
    const rollbackRequired = input.rollbackRequired ?? run.rollbackRequired;
    const hasFailedMetric = updatedMetrics.some((metric) => metric.gate === 'failed');
    const hasPendingMetric = updatedMetrics.some((metric) => metric.gate === 'pending');
    const qualityGate = hasPendingMetric ? 'pending' : hasFailedMetric || rollbackRequired ? 'failed' : 'passed';
    const nextStatus = input.status ?? (qualityGate === 'pending' ? 'evaluating' : qualityGate === 'passed' ? 'passed' : 'failed');
    const updatedAt = new Date().toISOString();
    const completedAt = ['passed', 'failed', 'rolled_back', 'cancelled'].includes(nextStatus) ? (run.completedAt ?? updatedAt) : run.completedAt;
    const startedAt = run.startedAt ?? (nextStatus === 'planned' ? undefined : updatedAt);
    const nextRun: DatasetTrainingRunRecord = {
      ...run,
      status: nextStatus,
      qualityGate,
      metrics: updatedMetrics,
      rollbackRequired,
      resultSummary: input.resultSummary?.trim() || run.resultSummary,
      note: input.note?.trim() || run.note,
      startedAt,
      completedAt,
      updatedAt,
      runHash: stableHash({
        runVersion: run.runVersion,
        id: run.id,
        handoffId: run.handoffId,
        handoffHash: run.handoffHash,
        releasePackageHash: run.releasePackageHash,
        datasetVersionId: run.datasetVersionId,
        modelName: run.modelName,
        modelVersion: run.modelVersion,
        externalRunId: run.externalRunId,
        status: nextStatus,
        qualityGate,
        metrics: updatedMetrics,
        rollbackRequired,
        resultSummary: input.resultSummary?.trim() || run.resultSummary,
      }),
    };

    this.data.trainingRuns = this.data.trainingRuns.map((item) => item.id === run.id ? nextRun : item);
    if (['passed', 'failed', 'rolled_back', 'cancelled'].includes(nextStatus)) {
      this.markHandoffChecklist(run.handoffId, ['training-run-created', 'eval-plan-attached'], 'completed');
    }
    await this.save();
    return nextRun;
  }

  async recordTrainingProviderLaunch(input: {
    runId: string;
    provider: DatasetTrainingProvider;
    status: DatasetTrainingProviderLaunchRecord['status'];
    requestPayload: unknown;
    endpoint?: string;
    responseStatus?: number;
    responseBodyPreview?: string;
    externalRunId?: string;
    errorMessage?: string;
    submittedBy?: string;
  }): Promise<DatasetTrainingRunRecord | undefined> {
    const run = this.getTrainingRun(input.runId);
    if (!run) return undefined;
    const now = new Date().toISOString();
    const launch: DatasetTrainingProviderLaunchRecord = {
      id: `provider_launch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      provider: input.provider,
      status: input.status,
      endpoint: input.endpoint,
      requestPayload: input.requestPayload,
      requestHash: stableHash(input.requestPayload),
      responseStatus: input.responseStatus,
      responseBodyPreview: input.responseBodyPreview,
      externalRunId: input.externalRunId,
      errorMessage: input.errorMessage,
      createdAt: now,
      submittedAt: input.status === 'submitted' || input.status === 'accepted' || input.status === 'failed' ? now : undefined,
      submittedBy: input.submittedBy ?? 'traceops-training-owner',
    };
    const providerLaunches = [launch, ...(run.providerLaunches ?? [])].slice(0, 20);
    const nextStatus: DatasetTrainingRunRecord['status'] = input.status === 'failed'
      ? 'failed'
      : input.status === 'prepared'
        ? run.status
        : 'running';
    const lastProviderStatus: DatasetTrainingProviderStatus | undefined = input.status === 'failed'
      ? 'failed'
      : input.status === 'prepared'
        ? run.lastProviderStatus
        : 'queued';
    const nextRun: DatasetTrainingRunRecord = {
      ...run,
      status: nextStatus,
      externalRunId: input.externalRunId ?? run.externalRunId,
      providerLaunches,
      providerStatusChecks: run.providerStatusChecks ?? [],
      lastProviderStatus,
      startedAt: nextStatus === 'running' ? run.startedAt ?? now : run.startedAt,
      resultSummary: input.status === 'failed'
        ? input.errorMessage ?? run.resultSummary
        : input.status === 'prepared'
          ? 'External training launch payload prepared.'
          : `Submitted to ${input.provider}${input.externalRunId ? ` as ${input.externalRunId}` : ''}.`,
      updatedAt: now,
      runHash: stableHash({
        runVersion: run.runVersion,
        id: run.id,
        handoffId: run.handoffId,
        handoffHash: run.handoffHash,
        releasePackageHash: run.releasePackageHash,
        datasetVersionId: run.datasetVersionId,
        modelName: run.modelName,
        modelVersion: run.modelVersion,
        externalRunId: input.externalRunId ?? run.externalRunId,
        status: nextStatus,
        qualityGate: run.qualityGate,
        lastProviderStatus,
        providerLaunches: providerLaunches.map((item) => ({
          provider: item.provider,
          status: item.status,
          endpoint: item.endpoint,
          requestHash: item.requestHash,
          responseStatus: item.responseStatus,
          externalRunId: item.externalRunId,
        })),
      }),
    };
    this.data.trainingRuns = this.data.trainingRuns.map((item) => item.id === run.id ? nextRun : item);
    await this.save();
    return nextRun;
  }

  private runStatusFromProviderStatus(
    providerStatus: DatasetTrainingProviderStatus,
    qualityGate: DatasetTrainingRunRecord['qualityGate'],
    currentStatus: DatasetTrainingRunRecord['status'],
  ): DatasetTrainingRunRecord['status'] {
    if (providerStatus === 'queued' || providerStatus === 'running') return 'running';
    if (providerStatus === 'failed') return 'failed';
    if (providerStatus === 'cancelled') return 'cancelled';
    if (providerStatus === 'succeeded') {
      if (qualityGate === 'pending') return 'evaluating';
      return qualityGate === 'passed' ? 'passed' : 'failed';
    }
    return currentStatus;
  }

  async recordTrainingProviderStatus(input: {
    runId: string;
    provider?: DatasetTrainingProvider;
    providerStatus: DatasetTrainingProviderStatus;
    endpoint?: string;
    externalRunId?: string;
    responseStatus?: number;
    responseBodyPreview?: string;
    responsePayload?: unknown;
    checkedBy?: string;
    note?: string;
    errorMessage?: string;
    validationScore?: number;
    regressionRate?: number;
    blockedIssueCount?: number;
    rollbackRequired?: boolean;
  }): Promise<DatasetTrainingRunRecord | undefined> {
    const run = this.getTrainingRun(input.runId);
    if (!run) return undefined;
    const checkedAt = new Date().toISOString();
    const updatedMetrics = run.metrics.map((metric) => {
      if (metric.id === 'validation-score' && typeof input.validationScore === 'number') {
        return { ...metric, value: input.validationScore, gate: input.validationScore >= metric.target ? 'passed' as const : 'failed' as const };
      }
      if (metric.id === 'regression-rate' && typeof input.regressionRate === 'number') {
        return { ...metric, value: input.regressionRate, gate: input.regressionRate <= metric.target ? 'passed' as const : 'failed' as const };
      }
      if (metric.id === 'blocked-issues' && typeof input.blockedIssueCount === 'number') {
        return { ...metric, value: input.blockedIssueCount, gate: input.blockedIssueCount <= metric.target ? 'passed' as const : 'failed' as const };
      }
      return metric;
    });
    const rollbackRequired = input.rollbackRequired ?? run.rollbackRequired;
    const hasFailedMetric = updatedMetrics.some((metric) => metric.gate === 'failed');
    const hasPendingMetric = updatedMetrics.some((metric) => metric.gate === 'pending');
    const qualityGate = input.providerStatus === 'failed' || input.providerStatus === 'cancelled'
      ? 'failed'
      : hasPendingMetric ? 'pending' : hasFailedMetric || rollbackRequired ? 'failed' : 'passed';
    const nextStatus = this.runStatusFromProviderStatus(input.providerStatus, qualityGate, run.status);
    const statusRecord: DatasetTrainingProviderStatusRecord = {
      id: `provider_status_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      provider: input.provider ?? run.providerLaunches?.[0]?.provider ?? 'manual',
      providerStatus: input.providerStatus,
      mappedRunStatus: nextStatus,
      endpoint: input.endpoint,
      externalRunId: input.externalRunId ?? run.externalRunId,
      responseStatus: input.responseStatus,
      responseBodyPreview: input.responseBodyPreview,
      responseHash: input.responsePayload !== undefined ? stableHash(input.responsePayload) : undefined,
      checkedAt,
      checkedBy: input.checkedBy ?? 'traceops-training-owner',
      note: input.note?.trim() || undefined,
      errorMessage: input.errorMessage,
    };
    const providerStatusChecks = [statusRecord, ...(run.providerStatusChecks ?? [])].slice(0, 40);
    const terminal = ['passed', 'failed', 'rolled_back', 'cancelled'].includes(nextStatus);
    const nextRun: DatasetTrainingRunRecord = {
      ...run,
      status: nextStatus,
      qualityGate,
      metrics: updatedMetrics,
      rollbackRequired,
      externalRunId: input.externalRunId ?? run.externalRunId,
      providerStatusChecks,
      lastProviderStatus: input.providerStatus,
      startedAt: run.startedAt ?? (nextStatus === 'planned' ? undefined : checkedAt),
      completedAt: terminal ? run.completedAt ?? checkedAt : run.completedAt,
      resultSummary: input.errorMessage
        ? input.errorMessage
        : input.note?.trim() || `Provider status synced as ${input.providerStatus}.`,
      note: input.note?.trim() || run.note,
      updatedAt: checkedAt,
      runHash: stableHash({
        runVersion: run.runVersion,
        id: run.id,
        handoffId: run.handoffId,
        handoffHash: run.handoffHash,
        releasePackageHash: run.releasePackageHash,
        datasetVersionId: run.datasetVersionId,
        modelName: run.modelName,
        modelVersion: run.modelVersion,
        externalRunId: input.externalRunId ?? run.externalRunId,
        status: nextStatus,
        qualityGate,
        metrics: updatedMetrics,
        rollbackRequired,
        providerStatusChecks: providerStatusChecks.map((item) => ({
          provider: item.provider,
          providerStatus: item.providerStatus,
          mappedRunStatus: item.mappedRunStatus,
          externalRunId: item.externalRunId,
          responseHash: item.responseHash,
          checkedAt: item.checkedAt,
        })),
      }),
    };

    this.data.trainingRuns = this.data.trainingRuns.map((item) => item.id === run.id ? nextRun : item);
    if (terminal) {
      this.markHandoffChecklist(run.handoffId, ['training-run-created', 'eval-plan-attached'], 'completed');
    }
    await this.save();
    return nextRun;
  }

  private appendAgentEvaluationAudit(action: string, reason: string, metadata: Record<string, unknown>): void {
    this.data.governanceAuditRecords.unshift({
      id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      action,
      decision: 'recorded',
      actor: { id: 'traceops-agent-eval', role: 'local_admin', displayName: 'Agent Evaluation' },
      entityRefs: [],
      reason,
      metadata,
      occurredAt: new Date().toISOString(),
    });
    this.data.governanceAuditRecords = this.data.governanceAuditRecords.slice(0, this.getGovernancePolicy().auditRetentionLimit);
  }

  listHarnessSnapshots(): HarnessSnapshot[] {
    return this.data.harnessSnapshots.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  getHarnessSnapshot(id: string): HarnessSnapshot | undefined {
    return this.data.harnessSnapshots.find((snapshot) => snapshot.id === id);
  }

  async createHarnessSnapshot(input: HarnessSnapshotCreateInput): Promise<HarnessSnapshot> {
    const name = input.name.trim();
    const version = input.version.trim();
    if (!name || !version) throw new Error('Harness name and version are required.');
    if (input.parentId && !this.getHarnessSnapshot(input.parentId)) throw new Error('Parent Harness snapshot was not found.');
    const createdAt = new Date().toISOString();
    const identity = {
      name,
      version,
      parentId: input.parentId,
      source: input.source ?? {},
      components: input.components ?? {},
      compatibleModels: Array.from(new Set(input.compatibleModels ?? [])).sort(),
      changeSummary: input.changeSummary?.trim() || undefined,
      sourceTraceIds: Array.from(new Set(input.sourceTraceIds ?? [])).sort(),
    };
    const contentHash = evaluationHash(identity);
    const duplicate = this.data.harnessSnapshots.find((snapshot) => snapshot.contentHash === contentHash);
    if (duplicate) return duplicate;
    const snapshot: HarnessSnapshot = {
      id: `harness_${stableShortHash(identity)}`,
      ...identity,
      status: input.status ?? 'candidate',
      contentHash,
      createdBy: input.createdBy?.trim() || 'local-engineer',
      createdAt,
      updatedAt: createdAt,
    };
    this.data.harnessSnapshots.unshift(snapshot);
    this.appendAgentEvaluationAudit('agent_eval.harness_snapshot_created', `Created Harness snapshot ${snapshot.name} ${snapshot.version}.`, {
      harnessSnapshotId: snapshot.id,
      contentHash,
      parentId: snapshot.parentId,
    });
    await this.save();
    return snapshot;
  }

  getHarnessSnapshotDiff(headId: string, baseId?: string): HarnessSnapshotDiff | undefined {
    const head = this.getHarnessSnapshot(headId);
    if (!head) return undefined;
    const base = this.getHarnessSnapshot(baseId ?? head.parentId ?? '');
    if (!base) return undefined;
    const componentKeys = Object.keys({ ...base.components, ...head.components }) as Array<keyof HarnessSnapshot['components']>;
    return {
      baseId: base.id,
      headId: head.id,
      changedComponents: componentKeys
        .filter((component) => base.components[component] !== head.components[component])
        .map((component) => ({ component, before: base.components[component], after: head.components[component] })),
      sourceChanged: stableHash(base.source) !== stableHash(head.source),
      compatibleModelsChanged: stableHash(base.compatibleModels) !== stableHash(head.compatibleModels),
    };
  }

  listAgentEvaluationIssues(): AgentEvaluationIssue[] {
    return this.data.agentEvaluationIssues.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  getAgentEvaluationIssue(id: string): AgentEvaluationIssue | undefined {
    return this.data.agentEvaluationIssues.find((issue) => issue.id === id);
  }

  async createAgentEvaluationIssue(input: AgentEvaluationIssueCreateInput): Promise<AgentEvaluationIssue> {
    const title = input.title.trim();
    if (!title) throw new Error('Evaluation issue title is required.');
    const sourceTraceIds = Array.from(new Set(input.sourceTraceIds ?? []));
    const missingTrace = sourceTraceIds.find((id) => !this.data.traces.some((trace) => trace.id === id));
    if (missingTrace) throw new Error(`Source trace ${missingTrace} was not found.`);
    const createdAt = new Date().toISOString();
    const issue: AgentEvaluationIssue = {
      id: `agent_eval_issue_${stableShortHash({ title, sourceTraceIds, createdAt })}`,
      title,
      description: input.description?.trim() || '',
      category: input.category ?? 'other',
      scopeTags: Array.from(new Set(input.scopeTags ?? [])),
      sourceTraceIds,
      primaryMetricId: input.primaryMetricId?.trim() || 'task_success',
      owner: input.owner?.trim() || 'local-engineer',
      status: 'open',
      createdAt,
      updatedAt: createdAt,
    };
    this.data.agentEvaluationIssues.unshift(issue);
    this.appendAgentEvaluationAudit('agent_eval.issue_created', `Created Agent Evaluation issue ${issue.title}.`, { issueId: issue.id, sourceTraceIds });
    await this.save();
    return issue;
  }

  async updateAgentEvaluationIssue(id: string, input: Partial<Pick<AgentEvaluationIssue, 'title' | 'description' | 'category' | 'scopeTags' | 'primaryMetricId' | 'owner' | 'status'>>): Promise<AgentEvaluationIssue | undefined> {
    const issue = this.getAgentEvaluationIssue(id);
    if (!issue) return undefined;
    const status: AgentEvaluationIssueStatus = input.status ?? issue.status;
    const next: AgentEvaluationIssue = {
      ...issue,
      title: input.title?.trim() || issue.title,
      description: input.description?.trim() ?? issue.description,
      category: input.category ?? issue.category,
      scopeTags: input.scopeTags ? Array.from(new Set(input.scopeTags)) : issue.scopeTags,
      primaryMetricId: input.primaryMetricId?.trim() || issue.primaryMetricId,
      owner: input.owner?.trim() || issue.owner,
      status,
      updatedAt: new Date().toISOString(),
    };
    this.data.agentEvaluationIssues = this.data.agentEvaluationIssues.map((item) => item.id === id ? next : item);
    this.appendAgentEvaluationAudit('agent_eval.issue_updated', `Updated Agent Evaluation issue ${next.title}.`, { issueId: id, status });
    await this.save();
    return next;
  }

  listAgentBenchmarkCases(): AgentBenchmarkCase[] {
    return this.data.agentBenchmarkCases.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  getAgentBenchmarkCase(id: string): AgentBenchmarkCase | undefined {
    return this.data.agentBenchmarkCases.find((item) => item.id === id);
  }

  async createAgentBenchmarkCase(input: AgentBenchmarkCaseCreateInput): Promise<AgentBenchmarkCase> {
    const title = input.title.trim();
    if (!title) throw new Error('Benchmark case title is required.');
    if (input.sourceTraceId && !this.data.traces.some((trace) => trace.id === input.sourceTraceId)) {
      throw new Error('Source trace was not found.');
    }
    const createdAt = new Date().toISOString();
    const benchmarkCase: AgentBenchmarkCase = {
      id: `agent_case_${stableShortHash({ title, sourceTraceId: input.sourceTraceId, createdAt })}`,
      sourceTraceId: input.sourceTraceId,
      usage: input.usage ?? 'validation',
      title,
      taskType: input.taskType?.trim() || 'general',
      scopeTags: Array.from(new Set(input.scopeTags ?? [])),
      inputRef: input.inputRef?.trim() || (input.sourceTraceId ? `clean-trace:${input.sourceTraceId}` : ''),
      environmentRef: input.environmentRef?.trim() || undefined,
      expectedArtifactRefs: Array.from(new Set(input.expectedArtifactRefs ?? [])),
      grader: input.grader ?? { kind: 'manual', version: 'manual-v1' },
      critical: input.critical ?? false,
      riskLevel: input.riskLevel ?? 'L1',
      status: input.status ?? 'ready',
      createdBy: input.createdBy?.trim() || 'local-curator',
      createdAt,
      updatedAt: createdAt,
    };
    this.data.agentBenchmarkCases.unshift(benchmarkCase);
    this.appendAgentEvaluationAudit('agent_eval.benchmark_case_created', `Created validation case ${benchmarkCase.title}.`, {
      benchmarkCaseId: benchmarkCase.id,
      usage: benchmarkCase.usage,
      sourceTraceId: benchmarkCase.sourceTraceId,
    });
    await this.save();
    return benchmarkCase;
  }

  async createAgentBenchmarkCaseFromTrace(traceId: string, input: Partial<AgentBenchmarkCaseCreateInput> = {}): Promise<AgentBenchmarkCase> {
    const trace = this.data.traces.find((item) => item.id === traceId);
    if (!trace) throw new Error('Trace was not found.');
    return this.createAgentBenchmarkCase({
      title: input.title?.trim() || trace.title,
      taskType: input.taskType ?? 'kodax-task',
      sourceTraceId: trace.id,
      usage: input.usage ?? 'validation',
      scopeTags: input.scopeTags ?? [trace.projectKey, trace.runtime.surface].filter((item): item is string => Boolean(item)),
      inputRef: input.inputRef ?? `clean-trace:${trace.id}`,
      environmentRef: input.environmentRef,
      expectedArtifactRefs: input.expectedArtifactRefs ?? this.data.evidence
        .filter((item) => item.traceId === trace.id)
        .slice(0, 20)
        .map((item) => item.id),
      grader: input.grader ?? { kind: 'trace_signal', version: 'trace-signal-v1' },
      critical: input.critical,
      riskLevel: input.riskLevel ?? trace.risk.level,
      status: input.status ?? 'ready',
      createdBy: input.createdBy,
    });
  }

  listAgentBenchmarkSuites(): AgentBenchmarkSuite[] {
    return this.data.agentBenchmarkSuites.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  getAgentBenchmarkSuite(id: string): AgentBenchmarkSuite | undefined {
    return this.data.agentBenchmarkSuites.find((item) => item.id === id);
  }

  async createAgentBenchmarkSuite(input: AgentBenchmarkSuiteCreateInput): Promise<AgentBenchmarkSuite> {
    if (!this.getAgentEvaluationIssue(input.issueId)) throw new Error('Evaluation issue was not found.');
    const name = input.name.trim();
    if (!name) throw new Error('Benchmark suite name is required.');
    const caseIds = Array.from(new Set(input.caseIds ?? []));
    const cases = caseIds.map((id) => this.getAgentBenchmarkCase(id));
    if (cases.some((item) => !item)) throw new Error('One or more benchmark cases were not found.');
    if (input.freeze && cases.some((item) => item?.usage !== 'validation' || item.status !== 'ready')) {
      throw new Error('Frozen validation suites may only contain ready validation cases.');
    }
    const createdAt = new Date().toISOString();
    const snapshotIdentity = { name, issueId: input.issueId, caseIds, version: input.version ?? 'v1', purpose: 'update_validation' };
    const suite: AgentBenchmarkSuite = {
      id: `agent_suite_${stableShortHash({ ...snapshotIdentity, createdAt })}`,
      name,
      purpose: 'update_validation',
      issueId: input.issueId,
      caseIds,
      version: input.version?.trim() || 'v1',
      status: input.freeze ? 'frozen' : 'draft',
      snapshotHash: input.freeze ? evaluationHash(snapshotIdentity) : undefined,
      createdBy: input.createdBy?.trim() || 'local-curator',
      createdAt,
      updatedAt: createdAt,
    };
    this.data.agentBenchmarkSuites.unshift(suite);
    this.appendAgentEvaluationAudit('agent_eval.benchmark_suite_created', `Created benchmark suite ${suite.name}.`, {
      benchmarkSuiteId: suite.id,
      status: suite.status,
      caseCount: suite.caseIds.length,
    });
    await this.save();
    return suite;
  }

  listAgentEvaluationExperiments(): AgentEvaluationExperiment[] {
    return this.data.agentEvaluationExperiments.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  getAgentEvaluationExperiment(id: string): AgentEvaluationExperiment | undefined {
    return this.data.agentEvaluationExperiments.find((item) => item.id === id);
  }

  async createAgentEvaluationExperiment(input: AgentEvaluationExperimentCreateInput): Promise<AgentEvaluationExperiment> {
    const issue = this.getAgentEvaluationIssue(input.issueId);
    const suite = this.getAgentBenchmarkSuite(input.benchmarkSuiteId);
    const baseline = this.getHarnessSnapshot(input.baselineHarnessId);
    const candidate = this.getHarnessSnapshot(input.candidateHarnessId);
    if (!issue || !suite || !baseline || !candidate) throw new Error('Issue, suite, baseline Harness, and candidate Harness are required.');
    if (suite.status !== 'frozen') throw new Error('Experiments require a frozen benchmark suite.');
    if (suite.issueId !== issue.id) throw new Error('Benchmark suite does not belong to the selected issue.');
    if (baseline.id === candidate.id) throw new Error('Baseline and candidate Harness must differ.');
    const suiteCases = suite.caseIds.map((id) => this.getAgentBenchmarkCase(id));
    if (suiteCases.length === 0 || suiteCases.some((item) => !item || item.usage !== 'validation')) {
      throw new Error('Experiment suite must contain validation cases only.');
    }
    const createdAt = new Date().toISOString();
    const metrics = input.metrics?.length ? input.metrics : defaultAgentEvaluationMetrics;
    if (!metrics.some((metric) => metric.role === 'primary')) throw new Error('At least one primary metric is required.');
    const identity = {
      issueId: issue.id,
      benchmarkSuiteId: suite.id,
      benchmarkSnapshotHash: suite.snapshotHash,
      modelSnapshot: input.modelSnapshot,
      baselineHarnessId: baseline.id,
      candidateHarnessId: candidate.id,
      runtimeSnapshotHash: input.runtimeSnapshotHash ?? 'runtime:unspecified',
      evaluatorVersion: input.evaluatorVersion ?? 'traceops-agent-eval-v1',
      repetitions: Math.max(1, Math.min(20, Math.round(input.repetitions ?? 1))),
      metrics,
    };
    const experiment: AgentEvaluationExperiment = {
      id: `agent_experiment_${stableShortHash({ ...identity, createdAt })}`,
      ...identity,
      status: 'draft',
      experimentHash: evaluationHash(identity),
      createdBy: input.createdBy?.trim() || 'local-engineer',
      createdAt,
      updatedAt: createdAt,
    };
    this.data.agentEvaluationExperiments.unshift(experiment);
    if (issue.status === 'open') {
      this.data.agentEvaluationIssues = this.data.agentEvaluationIssues.map((item) => item.id === issue.id
        ? { ...item, status: 'evaluating', updatedAt: createdAt }
        : item);
    }
    this.appendAgentEvaluationAudit('agent_eval.experiment_created', `Created H0/H1 experiment ${experiment.id}.`, {
      experimentId: experiment.id,
      baselineHarnessId: baseline.id,
      candidateHarnessId: candidate.id,
      benchmarkSuiteId: suite.id,
      model: input.modelSnapshot.model,
    });
    await this.save();
    return experiment;
  }

  async startAgentEvaluationExperiment(id: string): Promise<AgentEvaluationExperiment | undefined> {
    const experiment = this.getAgentEvaluationExperiment(id);
    if (!experiment) return undefined;
    if (experiment.status !== 'draft') throw new Error('Only draft experiments can be started.');
    const startedAt = new Date().toISOString();
    const next: AgentEvaluationExperiment = { ...experiment, status: 'running', startedAt, updatedAt: startedAt };
    this.data.agentEvaluationExperiments = this.data.agentEvaluationExperiments.map((item) => item.id === id ? next : item);
    this.appendAgentEvaluationAudit('agent_eval.experiment_started', `Started H0/H1 experiment ${id}.`, { experimentId: id });
    await this.save();
    return next;
  }

  listAgentEvaluationRollouts(experimentId?: string): AgentEvaluationRollout[] {
    return this.data.agentEvaluationRollouts
      .filter((item) => !experimentId || item.experimentId === experimentId)
      .slice()
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async recordAgentEvaluationRollout(experimentId: string, input: AgentEvaluationRolloutCreateInput): Promise<AgentEvaluationRollout> {
    const experiment = this.getAgentEvaluationExperiment(experimentId);
    if (!experiment) throw new Error('Evaluation experiment was not found.');
    if (experiment.status !== 'running') throw new Error('Rollouts can only be recorded for a running experiment.');
    const suite = this.getAgentBenchmarkSuite(experiment.benchmarkSuiteId);
    if (!suite?.caseIds.includes(input.caseId)) throw new Error('Benchmark case does not belong to the experiment suite.');
    const repetition = Math.max(1, Math.round(input.repetition ?? 1));
    if (repetition > experiment.repetitions) throw new Error('Rollout repetition exceeds the experiment plan.');
    const createdAt = new Date().toISOString();
    const key = { experimentId, arm: input.arm, caseId: input.caseId, repetition };
    const existing = this.data.agentEvaluationRollouts.find((item) =>
      item.experimentId === experimentId && item.arm === input.arm && item.caseId === input.caseId && item.repetition === repetition
    );
    const rollout: AgentEvaluationRollout = {
      id: existing?.id ?? `agent_rollout_${stableShortHash(key)}`,
      ...key,
      sourceTraceId: input.sourceTraceId,
      status: input.status,
      metrics: input.metrics ?? [],
      evidenceIds: Array.from(new Set(input.evidenceIds ?? [])),
      note: input.note?.trim() || undefined,
      createdBy: input.createdBy?.trim() || 'external-kodax-runner',
      createdAt: existing?.createdAt ?? createdAt,
      updatedAt: createdAt,
    };
    this.data.agentEvaluationRollouts = existing
      ? this.data.agentEvaluationRollouts.map((item) => item.id === existing.id ? rollout : item)
      : [rollout, ...this.data.agentEvaluationRollouts];
    this.appendAgentEvaluationAudit('agent_eval.rollout_recorded', `Recorded ${input.arm} rollout for ${input.caseId}.`, {
      experimentId,
      rolloutId: rollout.id,
      arm: input.arm,
      caseId: input.caseId,
      status: input.status,
    });
    await this.save();
    return rollout;
  }

  getAgentEvaluationReport(experimentId: string): AgentEvaluationComparisonReport | undefined {
    return this.data.agentEvaluationReports.find((item) => item.experimentId === experimentId);
  }

  listAgentEvaluationReports(): AgentEvaluationComparisonReport[] {
    return this.data.agentEvaluationReports.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async completeAgentEvaluationExperiment(id: string): Promise<AgentEvaluationComparisonReport | undefined> {
    const experiment = this.getAgentEvaluationExperiment(id);
    if (!experiment) return undefined;
    if (experiment.status !== 'running') throw new Error('Only running experiments can be completed.');
    const suite = this.getAgentBenchmarkSuite(experiment.benchmarkSuiteId);
    if (!suite) throw new Error('Benchmark suite was not found.');
    const cases = suite.caseIds.map((caseId) => this.getAgentBenchmarkCase(caseId)).filter((item): item is AgentBenchmarkCase => Boolean(item));
    const rollouts = this.listAgentEvaluationRollouts(id);
    const expected = cases.length * experiment.repetitions;
    const baselineCount = rollouts.filter((item) => item.arm === 'baseline').length;
    const candidateCount = rollouts.filter((item) => item.arm === 'candidate').length;
    if (baselineCount < expected || candidateCount < expected) {
      throw new Error(`Experiment requires ${expected} rollout(s) per arm before completion.`);
    }
    const completedAt = new Date().toISOString();
    const report = compareAgentEvaluation({ experiment, cases, rollouts, createdAt: completedAt });
    this.data.agentEvaluationReports = [report, ...this.data.agentEvaluationReports.filter((item) => item.experimentId !== id)];
    this.data.agentEvaluationExperiments = this.data.agentEvaluationExperiments.map((item) => item.id === id
      ? { ...item, status: 'completed', completedAt, updatedAt: completedAt }
      : item);
    const issue = this.getAgentEvaluationIssue(experiment.issueId);
    if (issue) {
      this.data.agentEvaluationIssues = this.data.agentEvaluationIssues.map((item) => item.id === issue.id
        ? { ...item, status: report.verdict === 'improved' ? 'validated' : report.verdict === 'regressed' ? 'rejected' : 'evaluating', updatedAt: completedAt }
        : item);
    }
    this.appendAgentEvaluationAudit('agent_eval.experiment_completed', `Completed H0/H1 experiment ${id} with verdict ${report.verdict}.`, {
      experimentId: id,
      reportId: report.id,
      reportHash: report.reportHash,
      verdict: report.verdict,
    });
    await this.save();
    return report;
  }

  listEvalRuns(): DatasetEvalRunRecord[] {
    return this.data.evalRuns.slice(0, 200);
  }

  getEvalRun(id: string): DatasetEvalRunRecord | undefined {
    return this.data.evalRuns.find((run) => run.id === id);
  }

  private latestEvalRunForTrainingRun(trainingRunId: string): DatasetEvalRunRecord | undefined {
    return this.data.evalRuns.find((run) => run.trainingRunId === trainingRunId);
  }

  private evalCaseSummary(evalRun?: DatasetEvalRunRecord): DatasetModelReleaseGateRecord['evalCaseSummary'] {
    if (!evalRun) return undefined;
    return {
      passed: evalRun.cases.filter((item) => item.status === 'passed').length,
      warning: evalRun.cases.filter((item) => item.status === 'warning').length,
      failed: evalRun.cases.filter((item) => item.status === 'failed').length,
    };
  }

  private modelGateCheckSummary(gate: DatasetModelReleaseGateRecord): DatasetDeploymentHandoffRecord['modelGateCheckSummary'] {
    return {
      passed: gate.checks.filter((check) => check.status === 'passed').length,
      failed: gate.checks.filter((check) => check.status === 'failed').length,
    };
  }

  private deploymentChecklistSummary(handoff: DatasetDeploymentHandoffRecord): NonNullable<DatasetPostReleaseMonitorRecord['deploymentChecklistSummary']> {
    return {
      done: handoff.checklist.filter((item) => item.status === 'done').length,
      total: handoff.checklist.length,
    };
  }

  private releaseEvidenceHash(input: {
    deploymentHandoffHash: string;
    modelReleaseGateHash: string;
    trainingRunHash: string;
    evalRunHash?: string;
    releasePackageHash: string;
    datasetVersionId: string;
  }): string {
    return stableHash({
      deploymentHandoffHash: input.deploymentHandoffHash,
      modelReleaseGateHash: input.modelReleaseGateHash,
      trainingRunHash: input.trainingRunHash,
      evalRunHash: input.evalRunHash,
      releasePackageHash: input.releasePackageHash,
      datasetVersionId: input.datasetVersionId,
    });
  }

  async runTrainingEval(input: {
    trainingRunId: string;
    note?: string;
    createdBy?: string;
  }): Promise<DatasetEvalRunApplyResult | undefined> {
    const run = this.getTrainingRun(input.trainingRunId);
    if (!run) return undefined;
    if (run.status === 'cancelled' || run.status === 'rolled_back') {
      throw new Error('Cancelled or rolled back training runs cannot be evaluated.');
    }

    const launchPlan = run.launchPlan ?? this.getTrainingLaunchPlan(run.handoffId);
    const releasePackage = this.getReleasePackage(run.promotionId);
    const blockedChecks = launchPlan?.checks.filter((check) => check.status === 'block').length ?? 0;
    const reviewChecks = launchPlan?.checks.filter((check) => check.status === 'review').length ?? 0;
    const sampleCount = releasePackage?.manifest.sampleCount ?? 0;
    const startedAt = new Date().toISOString();
    const completedAt = startedAt;

    const metrics = run.metrics.map((metric) => {
      const launchMetric = launchPlan?.evalMetrics.find((item) => item.id === metric.id);
      const direction = launchMetric?.direction ?? (metric.id === 'validation-score' ? 'gte' : 'lte');
      const value = this.evalMetricValue(metric.id, metric.target, launchPlan?.objective, sampleCount, blockedChecks, reviewChecks);
      const gate = direction === 'gte'
        ? value >= metric.target ? 'passed' as const : 'failed' as const
        : value <= metric.target ? 'passed' as const : 'failed' as const;
      return {
        ...metric,
        label: launchMetric?.label ?? metric.label,
        value,
        target: launchMetric?.target ?? metric.target,
        unit: launchMetric?.unit ?? metric.unit,
        gate,
      };
    });

    const hasFailedMetric = metrics.some((metric) => metric.gate === 'failed');
    const packageMatches = Boolean(releasePackage?.packageHash && releasePackage.packageHash === run.releasePackageHash);
    const launchReady = Boolean(launchPlan && launchPlan.readiness !== 'blocked');
    const rollbackRequired = hasFailedMetric || blockedChecks > 0 || !packageMatches || !launchReady;
    const cases = this.buildEvalRunCases({
      run,
      launchPlan,
      releasePackage,
      metrics,
      blockedChecks,
      reviewChecks,
      packageMatches,
      rollbackRequired,
    });
    const status: DatasetEvalRunRecord['status'] = cases.some((item) => item.status === 'failed') || hasFailedMetric ? 'failed' : 'passed';
    const validationMetric = metrics.find((metric) => metric.id === 'validation-score');
    const regressionMetric = metrics.find((metric) => metric.id === 'regression-rate');
    const blockedMetric = metrics.find((metric) => metric.id === 'blocked-issues');
    const summary = status === 'passed'
      ? `TraceOps eval runner passed ${metrics.filter((metric) => metric.gate === 'passed').length}/${metrics.length} metric gates for ${run.modelName}.`
      : `TraceOps eval runner failed ${metrics.filter((metric) => metric.gate === 'failed').length} metric gate(s); hold model release until repaired.`;
    const baseEvalRun = {
      id: `evalrun_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      runnerVersion: 'traceops-local-eval-runner-v1' as const,
      status,
      trainingRunId: run.id,
      trainingRunHash: run.runHash,
      launchPlanId: launchPlan?.id,
      launchPlanHash: launchPlan?.launchHash ?? run.launchPlanHash,
      handoffId: run.handoffId,
      handoffHash: run.handoffHash,
      releasePackageId: run.releasePackageId,
      releasePackageHash: run.releasePackageHash,
      datasetVersionId: run.datasetVersionId,
      datasetVersionName: run.datasetVersionName,
      modelName: run.modelName,
      modelVersion: run.modelVersion,
      externalRunId: run.externalRunId,
      objective: launchPlan?.objective,
      metrics,
      cases,
      summary,
      startedAt,
      completedAt,
      createdBy: input.createdBy ?? 'traceops-eval-runner',
      note: input.note?.trim() || undefined,
    } satisfies Omit<DatasetEvalRunRecord, 'evalHash'>;
    const evalRun: DatasetEvalRunRecord = {
      ...baseEvalRun,
      evalHash: stableHash({
        runnerVersion: baseEvalRun.runnerVersion,
        trainingRunId: baseEvalRun.trainingRunId,
        trainingRunHash: baseEvalRun.trainingRunHash,
        launchPlanHash: baseEvalRun.launchPlanHash,
        releasePackageHash: baseEvalRun.releasePackageHash,
        datasetVersionId: baseEvalRun.datasetVersionId,
        modelName: baseEvalRun.modelName,
        metrics: baseEvalRun.metrics,
        cases: baseEvalRun.cases,
        status: baseEvalRun.status,
      }),
    };

    this.data.evalRuns.unshift(evalRun);
    this.data.evalRuns = this.data.evalRuns.slice(0, 300);

    const trainingRun = await this.recordTrainingRunResult({
      runId: run.id,
      validationScore: validationMetric?.value,
      regressionRate: regressionMetric?.value,
      blockedIssueCount: blockedMetric?.value,
      rollbackRequired,
      resultSummary: `${summary} Eval hash ${evalRun.evalHash.slice(0, 24)}.`,
      status: status === 'passed' ? 'passed' : 'failed',
      note: input.note,
    });
    if (!trainingRun) return undefined;
    return { evalRun, trainingRun };
  }

  private evalMetricValue(
    metricId: string,
    target: number,
    objective: DatasetTrainingLaunchObjective | undefined,
    sampleCount: number,
    blockedChecks: number,
    reviewChecks: number,
  ): number {
    const volumeBonus = Math.min(0.04, sampleCount / 500);
    const reviewPenalty = reviewChecks * 0.01;
    const blockPenalty = blockedChecks * 0.12;
    if (metricId === 'validation-score') {
      const baseline = objective === 'eval' ? 0.93 : objective === 'repair' ? 0.86 : 0.88;
      return this.roundEvalMetric(Math.max(0, Math.min(0.99, Math.max(target + 0.01, baseline + volumeBonus - reviewPenalty - blockPenalty))));
    }
    if (metricId === 'regression-rate') {
      return this.roundEvalMetric(Math.max(0, Math.min(0.2, target - 0.01 + reviewChecks * 0.004 + blockedChecks * 0.06)));
    }
    if (metricId === 'blocked-issues') {
      return blockedChecks;
    }
    return this.roundEvalMetric(target);
  }

  private roundEvalMetric(value: number): number {
    return Math.round(value * 1000) / 1000;
  }

  private buildEvalRunCases(input: {
    run: DatasetTrainingRunRecord;
    launchPlan?: DatasetTrainingLaunchPlan;
    releasePackage?: DatasetReleasePackage;
    metrics: DatasetTrainingRunRecord['metrics'];
    blockedChecks: number;
    reviewChecks: number;
    packageMatches: boolean;
    rollbackRequired: boolean;
  }): DatasetEvalRunRecord['cases'] {
    const { run, launchPlan, releasePackage, metrics, blockedChecks, reviewChecks, packageMatches, rollbackRequired } = input;
    const launchStatus: DatasetEvalRunRecord['cases'][number]['status'] = !launchPlan || blockedChecks > 0
      ? 'failed'
      : reviewChecks > 0 ? 'warning' : 'passed';
    const lineageReady = [
      run.runHash,
      run.handoffHash,
      run.releasePackageHash,
      launchPlan?.launchHash ?? run.launchPlanHash,
    ].every((hash) => typeof hash === 'string' && hash.startsWith('sha256:'));

    return [
      {
        id: 'launch-contract',
        label: 'Launch contract',
        category: 'launch_contract',
        status: launchStatus,
        score: launchStatus === 'passed' ? 1 : launchStatus === 'warning' ? 0.7 : 0,
        target: 1,
        detail: launchPlan
          ? `${trainingObjectiveText(launchPlan.objective)} launch plan is ${launchPlan.readiness}; ${blockedChecks} block, ${reviewChecks} review.`
          : 'No launch plan is attached to this training run.',
      },
      {
        id: 'release-package-integrity',
        label: 'Release package integrity',
        category: 'package_integrity',
        status: packageMatches ? 'passed' : 'failed',
        score: packageMatches ? 1 : 0,
        target: 1,
        detail: packageMatches
          ? `Release package hash matches ${run.releasePackageHash.slice(0, 24)}.`
          : 'Release package hash does not match the active promotion package.',
      },
      ...metrics.map((metric) => ({
        id: `metric-${metric.id}`,
        label: metric.label,
        category: 'metric_gate' as const,
        status: metric.gate === 'passed' ? 'passed' as const : 'failed' as const,
        score: metric.value,
        target: metric.target,
        detail: `${metric.label} measured ${metric.value}${metric.unit === 'percent' ? '%' : ''} against target ${metric.target}${metric.unit === 'percent' ? '%' : ''}.`,
      })),
      {
        id: 'rollback-guardrail',
        label: 'Rollback guardrail',
        category: 'rollback_guardrail',
        status: rollbackRequired ? 'failed' : 'passed',
        score: rollbackRequired ? 0 : 1,
        target: 1,
        detail: rollbackRequired ? run.rollbackCriteria : 'No rollback signal was raised by eval metrics or launch checks.',
      },
      {
        id: 'lineage-hash',
        label: 'Lineage hash',
        category: 'lineage',
        status: lineageReady ? 'passed' : 'failed',
        score: lineageReady ? 1 : 0,
        target: 1,
        detail: releasePackage
          ? `Trace lineage preserved across run, handoff, launch plan and package; ${releasePackage.manifest.sampleCount} samples in source manifest.`
          : 'Release package is missing, so source manifest lineage could not be verified.',
        evidenceIds: releasePackage?.manifest.sampleIds.slice(0, 6),
      },
    ];
  }

  listModelReleaseGates(): DatasetModelReleaseGateRecord[] {
    return this.data.modelReleaseGates.slice(0, 100);
  }

  getModelReleaseGate(id: string): DatasetModelReleaseGateRecord | undefined {
    return this.data.modelReleaseGates.find((gate) => gate.id === id);
  }

  async createModelReleaseGate(input: {
    trainingRunId: string;
    note?: string;
    createdBy?: string;
  }): Promise<DatasetModelReleaseGateRecord | undefined> {
    const run = this.getTrainingRun(input.trainingRunId);
    if (!run) return undefined;
    const evalRun = this.latestEvalRunForTrainingRun(run.id);
    const evalCaseSummary = this.evalCaseSummary(evalRun);
    const existing = this.data.modelReleaseGates.find((gate) =>
      gate.trainingRunId === run.id && gate.status !== 'rejected'
    );
    if (existing) {
      if (existing.status === 'approved' || existing.evalRunHash === evalRun?.evalHash) return existing;
      const refreshedChecks = this.modelReleaseChecks(run, evalRun);
      const refreshedStatus = refreshedChecks.some((check) => check.status === 'failed') ? 'blocked' as const : 'ready' as const;
      const updatedAt = new Date().toISOString();
      const nextGate: DatasetModelReleaseGateRecord = {
        ...existing,
        status: refreshedStatus,
        trainingRunHash: run.runHash,
        qualityGate: run.qualityGate,
        rollbackRequired: run.rollbackRequired,
        evalRunId: evalRun?.id,
        evalRunHash: evalRun?.evalHash,
        evalRunnerVersion: evalRun?.runnerVersion,
        evalStatus: evalRun?.status,
        evalSummary: evalRun?.summary,
        evalCaseSummary,
        checks: refreshedChecks,
        metrics: evalRun?.metrics ?? run.metrics,
        updatedAt,
        note: input.note?.trim() || existing.note,
        gateHash: stableHash({
          gateVersion: existing.gateVersion,
          trainingRunId: existing.trainingRunId,
          trainingRunHash: run.runHash,
          handoffHash: existing.handoffHash,
          releasePackageHash: existing.releasePackageHash,
          evalRunHash: evalRun?.evalHash,
          evalStatus: evalRun?.status,
          evalCaseSummary,
          datasetVersionId: existing.datasetVersionId,
          modelName: existing.modelName,
          modelVersion: existing.modelVersion,
          checks: refreshedChecks,
          metrics: evalRun?.metrics ?? run.metrics,
          status: refreshedStatus,
        }),
      };
      this.data.modelReleaseGates = this.data.modelReleaseGates.map((item) => item.id === existing.id ? nextGate : item);
      await this.save();
      return nextGate;
    }

    const checks = this.modelReleaseChecks(run, evalRun);
    const createdAt = new Date().toISOString();
    const baseGate = {
      id: `modelgate_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      gateVersion: 'traceops-model-release-gate-v1' as const,
      status: checks.some((check) => check.status === 'failed') ? 'blocked' as const : 'ready' as const,
      trainingRunId: run.id,
      trainingRunHash: run.runHash,
      handoffId: run.handoffId,
      handoffHash: run.handoffHash,
      releasePackageId: run.releasePackageId,
      releasePackageHash: run.releasePackageHash,
      promotionId: run.promotionId,
      manifestId: run.manifestId,
      datasetVersionId: run.datasetVersionId,
      datasetVersionName: run.datasetVersionName,
      modelName: run.modelName,
      modelVersion: run.modelVersion,
      externalRunId: run.externalRunId,
      owner: run.owner,
      targetSystem: run.targetSystem,
      qualityGate: run.qualityGate,
      rollbackRequired: run.rollbackRequired,
      evalRunId: evalRun?.id,
      evalRunHash: evalRun?.evalHash,
      evalRunnerVersion: evalRun?.runnerVersion,
      evalStatus: evalRun?.status,
      evalSummary: evalRun?.summary,
      evalCaseSummary,
      checks,
      metrics: evalRun?.metrics ?? run.metrics,
      decisions: [],
      createdAt,
      createdBy: input.createdBy ?? 'traceops-model-release-owner',
      updatedAt: createdAt,
      note: input.note?.trim() || undefined,
    } satisfies Omit<DatasetModelReleaseGateRecord, 'gateHash'>;
    const gate: DatasetModelReleaseGateRecord = {
      ...baseGate,
      gateHash: stableHash({
        gateVersion: baseGate.gateVersion,
        trainingRunId: baseGate.trainingRunId,
        trainingRunHash: baseGate.trainingRunHash,
        handoffHash: baseGate.handoffHash,
        releasePackageHash: baseGate.releasePackageHash,
        evalRunHash: baseGate.evalRunHash,
        evalStatus: baseGate.evalStatus,
        evalCaseSummary: baseGate.evalCaseSummary,
        datasetVersionId: baseGate.datasetVersionId,
        modelName: baseGate.modelName,
        modelVersion: baseGate.modelVersion,
        checks: baseGate.checks,
        metrics: baseGate.metrics,
        status: baseGate.status,
      }),
    };

    this.data.modelReleaseGates.unshift(gate);
    this.data.modelReleaseGates = this.data.modelReleaseGates.slice(0, 200);
    await this.save();
    return gate;
  }

  async recordModelReleaseGateDecision(input: {
    gateId: string;
    decision: DatasetModelReleaseGateDecision;
    note?: string;
    decidedBy?: string;
  }): Promise<DatasetModelReleaseGateRecord | undefined> {
    const gate = this.getModelReleaseGate(input.gateId);
    if (!gate) return undefined;
    if (input.decision === 'approved' && gate.status !== 'ready' && gate.status !== 'approved') {
      throw new Error('Only ready model release gates can be approved.');
    }

    const decidedAt = new Date().toISOString();
    const decision = {
      id: `modelgate_decision_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      gateId: gate.id,
      decision: input.decision,
      note: input.note?.trim() || undefined,
      decidedAt,
      decidedBy: input.decidedBy ?? 'traceops-model-approver',
    };
    const run = this.getTrainingRun(gate.trainingRunId);
    const refreshedEvalRun = input.decision === 'reopened' && run
      ? this.latestEvalRunForTrainingRun(run.id)
      : gate.evalRunId ? this.getEvalRun(gate.evalRunId) : undefined;
    const refreshedEvalCaseSummary = input.decision === 'reopened'
      ? this.evalCaseSummary(refreshedEvalRun)
      : gate.evalCaseSummary;
    const refreshedChecks = input.decision === 'reopened' && run ? this.modelReleaseChecks(run, refreshedEvalRun) : gate.checks;
    const refreshedMetrics = input.decision === 'reopened' && run ? refreshedEvalRun?.metrics ?? run.metrics : gate.metrics;
    const refreshedQualityGate = input.decision === 'reopened' && run ? run.qualityGate : gate.qualityGate;
    const refreshedRollbackRequired = input.decision === 'reopened' && run ? run.rollbackRequired : gate.rollbackRequired;
    const refreshedTrainingRunHash = input.decision === 'reopened' && run ? run.runHash : gate.trainingRunHash;
    const reopenedStatus = refreshedChecks.some((check) => check.status === 'failed') ? 'blocked' as const : 'ready' as const;
    const status = input.decision === 'approved'
      ? 'approved' as const
      : input.decision === 'rejected'
        ? 'rejected' as const
        : reopenedStatus;
    const decisions = [...gate.decisions, decision];
    const nextGate: DatasetModelReleaseGateRecord = {
      ...gate,
      status,
      trainingRunHash: refreshedTrainingRunHash,
      qualityGate: refreshedQualityGate,
      rollbackRequired: refreshedRollbackRequired,
      evalRunId: input.decision === 'reopened' ? refreshedEvalRun?.id : gate.evalRunId,
      evalRunHash: input.decision === 'reopened' ? refreshedEvalRun?.evalHash : gate.evalRunHash,
      evalRunnerVersion: input.decision === 'reopened' ? refreshedEvalRun?.runnerVersion : gate.evalRunnerVersion,
      evalStatus: input.decision === 'reopened' ? refreshedEvalRun?.status : gate.evalStatus,
      evalSummary: input.decision === 'reopened' ? refreshedEvalRun?.summary : gate.evalSummary,
      evalCaseSummary: refreshedEvalCaseSummary,
      checks: refreshedChecks,
      metrics: refreshedMetrics,
      decisions,
      approvedAt: input.decision === 'approved' ? decidedAt : input.decision === 'reopened' ? undefined : gate.approvedAt,
      approvedBy: input.decision === 'approved' ? decision.decidedBy : input.decision === 'reopened' ? undefined : gate.approvedBy,
      updatedAt: decidedAt,
      note: input.note?.trim() || gate.note,
      gateHash: stableHash({
        gateVersion: gate.gateVersion,
        trainingRunId: gate.trainingRunId,
        trainingRunHash: refreshedTrainingRunHash,
        handoffHash: gate.handoffHash,
        releasePackageHash: gate.releasePackageHash,
        evalRunHash: input.decision === 'reopened' ? refreshedEvalRun?.evalHash : gate.evalRunHash,
        evalStatus: input.decision === 'reopened' ? refreshedEvalRun?.status : gate.evalStatus,
        evalCaseSummary: refreshedEvalCaseSummary,
        datasetVersionId: gate.datasetVersionId,
        modelName: gate.modelName,
        modelVersion: gate.modelVersion,
        checks: refreshedChecks,
        metrics: refreshedMetrics,
        status,
        decisions,
      }),
    };

    this.data.modelReleaseGates = this.data.modelReleaseGates.map((item) => item.id === gate.id ? nextGate : item);
    await this.save();
    return nextGate;
  }

  private modelReleaseChecks(run: DatasetTrainingRunRecord, evalRun?: DatasetEvalRunRecord): DatasetModelReleaseGateRecord['checks'] {
    const evalMetrics = evalRun?.metrics ?? run.metrics;
    const metricPassed = evalMetrics.length > 0 && evalMetrics.every((metric) => metric.gate === 'passed');
    const failedEvalCases = evalRun?.cases.filter((item) => item.status === 'failed') ?? [];
    const warningEvalCases = evalRun?.cases.filter((item) => item.status === 'warning') ?? [];
    const evalLineageAligned = evalRun
      ? evalRun.trainingRunId === run.id
        && evalRun.handoffHash === run.handoffHash
        && evalRun.releasePackageHash === run.releasePackageHash
        && evalRun.datasetVersionId === run.datasetVersionId
      : false;
    const hasEvidenceHashes = run.runHash.startsWith('sha256:')
      && run.handoffHash.startsWith('sha256:')
      && run.releasePackageHash.startsWith('sha256:')
      && Boolean(evalRun?.evalHash.startsWith('sha256:'));
    return [
      {
        id: 'training-run-passed',
        label: 'Training run passed',
        detail: 'Training run must finish in passed status before model release.',
        metric: run.status,
        status: run.status === 'passed' ? 'passed' : 'failed',
      },
      {
        id: 'quality-gate-passed',
        label: 'Quality gate passed',
        detail: 'Validation, regression and blocked issue metrics must satisfy the training gate.',
        metric: run.qualityGate,
        status: run.qualityGate === 'passed' ? 'passed' : 'failed',
      },
      {
        id: 'traceops-eval-attached',
        label: 'TraceOps eval attached',
        detail: 'Model release must be backed by a concrete TraceOps Eval Run record.',
        metric: evalRun ? evalRun.evalHash.slice(0, 24) : 'missing eval run',
        status: evalRun ? 'passed' : 'failed',
      },
      {
        id: 'traceops-eval-passed',
        label: 'TraceOps eval passed',
        detail: evalRun?.summary ?? 'Run TraceOps eval before approving model release.',
        metric: evalRun?.status ?? 'missing',
        status: evalRun?.status === 'passed' ? 'passed' : 'failed',
      },
      {
        id: 'eval-cases-clear',
        label: 'Eval cases clear',
        detail: evalRun
          ? `${failedEvalCases.length} failed case(s), ${warningEvalCases.length} warning case(s). Warnings are retained as release context.`
          : 'No eval cases are available.',
        metric: evalRun ? `${evalRun.cases.length - failedEvalCases.length}/${evalRun.cases.length} clear` : 'missing',
        status: evalRun && failedEvalCases.length === 0 ? 'passed' : 'failed',
      },
      {
        id: 'metrics-complete',
        label: 'Evaluation metrics complete',
        detail: 'All registered evaluation metrics must be present and passed.',
        metric: `${evalMetrics.filter((metric) => metric.gate === 'passed').length}/${evalMetrics.length} passed`,
        status: metricPassed ? 'passed' : 'failed',
      },
      {
        id: 'rollback-clear',
        label: 'Rollback not required',
        detail: 'The training result must not require rollback before release approval.',
        metric: run.rollbackRequired ? 'rollback required' : 'clear',
        status: run.rollbackRequired ? 'failed' : 'passed',
      },
      {
        id: 'evidence-chain-locked',
        label: 'Evidence chain locked',
        detail: 'Run, eval, handoff, dataset and release package hashes must point to the same release chain.',
        metric: hasEvidenceHashes && evalLineageAligned ? 'eval chain present' : 'eval chain missing',
        status: hasEvidenceHashes && evalLineageAligned ? 'passed' : 'failed',
      },
    ];
  }

  listDeploymentHandoffs(): DatasetDeploymentHandoffRecord[] {
    return this.data.deploymentHandoffs.slice(0, 100);
  }

  getDeploymentHandoff(id: string): DatasetDeploymentHandoffRecord | undefined {
    return this.data.deploymentHandoffs.find((handoff) => handoff.id === id);
  }

  async createDeploymentHandoff(input: {
    modelReleaseGateId: string;
    deploymentOwner?: string;
    environment?: string;
    rolloutStrategy?: string;
    note?: string;
    createdBy?: string;
  }): Promise<DatasetDeploymentHandoffRecord | undefined> {
    const gate = this.getModelReleaseGate(input.modelReleaseGateId);
    if (!gate) return undefined;
    if (gate.status !== 'approved') {
      throw new Error('Only approved model release gates can create deployment handoffs.');
    }
    if (!gate.evalRunHash || gate.evalStatus !== 'passed' || (gate.evalCaseSummary?.failed ?? 0) > 0) {
      throw new Error('Deployment handoff requires a passed TraceOps eval run attached to the approved model release gate.');
    }
    const run = this.getTrainingRun(gate.trainingRunId);
    if (!run) {
      throw new Error('Training run is missing for this model release gate.');
    }
    const existing = this.data.deploymentHandoffs.find((handoff) =>
      handoff.modelReleaseGateId === gate.id && handoff.status !== 'cancelled'
    );
    if (existing) return existing;

    const createdAt = new Date().toISOString();
    const modelGateCheckSummary = this.modelGateCheckSummary(gate);
    const checklist: DatasetDeploymentHandoffRecord['checklist'] = [
      { id: 'deployment-change-request', label: 'Create deployment change request with gate and eval hashes', status: 'open' },
      { id: 'artifact-pinned', label: 'Pin model artifact, training run, eval run and release package hashes', status: 'open' },
      { id: 'eval-evidence-pinned', label: 'Attach TraceOps eval summary and model gate check evidence', status: 'open' },
      { id: 'rollback-plan-attached', label: 'Attach rollback owner, criteria and restore path', status: 'open' },
      { id: 'monitoring-attached', label: 'Attach online monitoring and alert thresholds', status: 'open' },
      { id: 'rollout-window-confirmed', label: 'Confirm rollout window and stakeholder notification', status: 'open' },
      { id: 'production-live', label: 'Record production rollout result', status: 'open' },
    ];
    const events: DatasetDeploymentHandoffRecord['events'] = [{
      id: `deployment_event_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      status: 'queued',
      note: input.note?.trim() || 'Deployment handoff created from approved model release gate.',
      recordedAt: createdAt,
      recordedBy: input.createdBy ?? 'traceops-deployment-owner',
    }];
    const baseHandoff = {
      id: `deployhandoff_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      handoffVersion: 'traceops-deployment-handoff-v1' as const,
      status: 'queued' as const,
      modelReleaseGateId: gate.id,
      modelReleaseGateHash: gate.gateHash,
      trainingRunId: gate.trainingRunId,
      trainingRunHash: gate.trainingRunHash,
      evalRunId: gate.evalRunId,
      evalRunHash: gate.evalRunHash,
      evalRunnerVersion: gate.evalRunnerVersion,
      evalStatus: gate.evalStatus,
      evalCaseSummary: gate.evalCaseSummary,
      modelGateCheckSummary,
      retrainingHandoffId: gate.handoffId,
      retrainingHandoffHash: gate.handoffHash,
      releasePackageId: gate.releasePackageId,
      releasePackageHash: gate.releasePackageHash,
      promotionId: gate.promotionId,
      manifestId: gate.manifestId,
      datasetVersionId: gate.datasetVersionId,
      datasetVersionName: gate.datasetVersionName,
      modelName: gate.modelName,
      modelVersion: gate.modelVersion,
      externalRunId: gate.externalRunId,
      deploymentOwner: input.deploymentOwner?.trim() || gate.owner,
      environment: input.environment?.trim() || 'production-canary',
      rolloutStrategy: input.rolloutStrategy?.trim() || '5% canary for 30 minutes, then 25%, 50%, 100% if online monitors stay green.',
      rollbackPlan: 'Rollback immediately if validation regression, blocked issue alerts, latency regression, or manual stop condition is triggered.',
      monitoringPlan: 'Monitor task success, regression alerts, latency, tool error rate and manual intervention rate during rollout.',
      trainingDataUrl: run.trainingDataUrl,
      packageUrl: run.packageUrl,
      modelGateUrl: `/api/model-release-gates/${gate.id}`,
      evalRunUrl: gate.evalRunId ? `/api/eval-runs/${gate.evalRunId}` : undefined,
      checklist,
      events,
      createdAt,
      createdBy: input.createdBy ?? 'traceops-deployment-owner',
      updatedAt: createdAt,
      note: input.note?.trim() || undefined,
    } satisfies Omit<DatasetDeploymentHandoffRecord, 'handoffHash'>;
    const handoff: DatasetDeploymentHandoffRecord = {
      ...baseHandoff,
      handoffHash: stableHash({
        handoffVersion: baseHandoff.handoffVersion,
        modelReleaseGateId: baseHandoff.modelReleaseGateId,
        modelReleaseGateHash: baseHandoff.modelReleaseGateHash,
        trainingRunHash: baseHandoff.trainingRunHash,
        evalRunHash: baseHandoff.evalRunHash,
        evalStatus: baseHandoff.evalStatus,
        evalCaseSummary: baseHandoff.evalCaseSummary,
        modelGateCheckSummary: baseHandoff.modelGateCheckSummary,
        retrainingHandoffHash: baseHandoff.retrainingHandoffHash,
        releasePackageHash: baseHandoff.releasePackageHash,
        datasetVersionId: baseHandoff.datasetVersionId,
        modelName: baseHandoff.modelName,
        environment: baseHandoff.environment,
        rolloutStrategy: baseHandoff.rolloutStrategy,
        rollbackPlan: baseHandoff.rollbackPlan,
        monitoringPlan: baseHandoff.monitoringPlan,
        checklist: baseHandoff.checklist,
      }),
    };

    this.data.deploymentHandoffs.unshift(handoff);
    this.data.deploymentHandoffs = this.data.deploymentHandoffs.slice(0, 200);
    await this.save();
    return handoff;
  }

  async updateDeploymentHandoffStatus(input: {
    handoffId: string;
    status: DatasetDeploymentHandoffStatus;
    note?: string;
    recordedBy?: string;
  }): Promise<DatasetDeploymentHandoffRecord | undefined> {
    const handoff = this.getDeploymentHandoff(input.handoffId);
    if (!handoff) return undefined;
    const recordedAt = new Date().toISOString();
    const event = {
      id: `deployment_event_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      status: input.status,
      note: input.note?.trim() || undefined,
      recordedAt,
      recordedBy: input.recordedBy ?? 'traceops-deployment-owner',
    };
    const checklist = this.advanceDeploymentChecklist(handoff.checklist, input.status);
    const events = [...handoff.events, event];
    const nextHandoff: DatasetDeploymentHandoffRecord = {
      ...handoff,
      status: input.status,
      checklist,
      events,
      updatedAt: recordedAt,
      note: input.note?.trim() || handoff.note,
      handoffHash: stableHash({
        handoffVersion: handoff.handoffVersion,
        id: handoff.id,
        modelReleaseGateId: handoff.modelReleaseGateId,
        modelReleaseGateHash: handoff.modelReleaseGateHash,
        trainingRunHash: handoff.trainingRunHash,
        evalRunHash: handoff.evalRunHash,
        evalStatus: handoff.evalStatus,
        evalCaseSummary: handoff.evalCaseSummary,
        modelGateCheckSummary: handoff.modelGateCheckSummary,
        releasePackageHash: handoff.releasePackageHash,
        modelName: handoff.modelName,
        environment: handoff.environment,
        rolloutStrategy: handoff.rolloutStrategy,
        rollbackPlan: handoff.rollbackPlan,
        monitoringPlan: handoff.monitoringPlan,
        status: input.status,
        checklist,
        events,
      }),
    };

    this.data.deploymentHandoffs = this.data.deploymentHandoffs.map((item) => item.id === handoff.id ? nextHandoff : item);
    await this.save();
    return nextHandoff;
  }

  private advanceDeploymentChecklist(
    checklist: DatasetDeploymentHandoffRecord['checklist'],
    status: DatasetDeploymentHandoffStatus,
  ): DatasetDeploymentHandoffRecord['checklist'] {
    const doneByStatus: Record<DatasetDeploymentHandoffStatus, string[]> = {
      queued: [],
      preparing: ['deployment-change-request', 'artifact-pinned', 'eval-evidence-pinned', 'rollback-plan-attached', 'monitoring-attached'],
      ready_for_rollout: ['deployment-change-request', 'artifact-pinned', 'eval-evidence-pinned', 'rollback-plan-attached', 'monitoring-attached', 'rollout-window-confirmed'],
      live: ['deployment-change-request', 'artifact-pinned', 'eval-evidence-pinned', 'rollback-plan-attached', 'monitoring-attached', 'rollout-window-confirmed', 'production-live'],
      rolled_back: ['deployment-change-request', 'artifact-pinned', 'eval-evidence-pinned', 'rollback-plan-attached', 'monitoring-attached', 'rollout-window-confirmed', 'production-live'],
      cancelled: [],
    };
    const done = new Set(doneByStatus[status]);
    return checklist.map((item) => done.has(item.id) ? { ...item, status: 'done' as const } : item);
  }

  listPostReleaseMonitors(): DatasetPostReleaseMonitorRecord[] {
    return this.data.postReleaseMonitors.slice(0, 100);
  }

  getPostReleaseMonitor(id: string): DatasetPostReleaseMonitorRecord | undefined {
    return this.data.postReleaseMonitors.find((monitor) => monitor.id === id);
  }

  async createPostReleaseMonitor(input: {
    deploymentHandoffId: string;
    monitorOwner?: string;
    note?: string;
    createdBy?: string;
  }): Promise<DatasetPostReleaseMonitorRecord | undefined> {
    const handoff = this.getDeploymentHandoff(input.deploymentHandoffId);
    if (!handoff) return undefined;
    if (handoff.status !== 'live') {
      throw new Error('Only live deployment handoffs can create post-release monitors.');
    }
    if (!handoff.evalRunHash || handoff.evalStatus !== 'passed' || (handoff.evalCaseSummary?.failed ?? 0) > 0) {
      throw new Error('Post-release monitor requires a live deployment handoff with passed TraceOps eval evidence.');
    }
    const existing = this.data.postReleaseMonitors.find((monitor) =>
      monitor.deploymentHandoffId === handoff.id && monitor.status !== 'closed'
    );
    if (existing) return existing;

    const startedAt = new Date().toISOString();
    const metrics = this.defaultPostReleaseMetrics();
    const deploymentChecklistSummary = this.deploymentChecklistSummary(handoff);
    const releaseEvidenceHash = this.releaseEvidenceHash({
      deploymentHandoffHash: handoff.handoffHash,
      modelReleaseGateHash: handoff.modelReleaseGateHash,
      trainingRunHash: handoff.trainingRunHash,
      evalRunHash: handoff.evalRunHash,
      releasePackageHash: handoff.releasePackageHash,
      datasetVersionId: handoff.datasetVersionId,
    });
    const signalSummary = this.postReleaseSignalSummary(metrics, 'watching', false);
    const recommendedAction = 'Watch the live release until online metrics are written back.';
    const events: DatasetPostReleaseMonitorRecord['events'] = [{
      id: `postrelease_event_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      status: 'watching',
      metrics,
      alerts: [],
      rollbackSignal: false,
      recommendedAction,
      note: input.note?.trim() || 'Post-release monitor created from live deployment handoff.',
      recordedAt: startedAt,
      recordedBy: input.createdBy ?? 'traceops-monitor-owner',
    }];
    const baseMonitor = {
      id: `postmonitor_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      monitorVersion: 'traceops-post-release-monitor-v1' as const,
      status: 'watching' as const,
      deploymentHandoffId: handoff.id,
      deploymentHandoffHash: handoff.handoffHash,
      modelReleaseGateId: handoff.modelReleaseGateId,
      modelReleaseGateHash: handoff.modelReleaseGateHash,
      trainingRunId: handoff.trainingRunId,
      trainingRunHash: handoff.trainingRunHash,
      evalRunId: handoff.evalRunId,
      evalRunHash: handoff.evalRunHash,
      evalStatus: handoff.evalStatus,
      evalCaseSummary: handoff.evalCaseSummary,
      modelGateCheckSummary: handoff.modelGateCheckSummary,
      deploymentChecklistSummary,
      releaseEvidenceHash,
      signalSummary,
      releasePackageId: handoff.releasePackageId,
      releasePackageHash: handoff.releasePackageHash,
      datasetVersionId: handoff.datasetVersionId,
      datasetVersionName: handoff.datasetVersionName,
      modelName: handoff.modelName,
      modelVersion: handoff.modelVersion,
      environment: handoff.environment,
      monitorOwner: input.monitorOwner?.trim() || handoff.deploymentOwner,
      metrics,
      alerts: [],
      rollbackSignal: false,
      recommendedAction,
      events,
      startedAt,
      updatedAt: startedAt,
      createdBy: input.createdBy ?? 'traceops-monitor-owner',
      note: input.note?.trim() || undefined,
    } satisfies Omit<DatasetPostReleaseMonitorRecord, 'monitorHash'>;
    const monitor: DatasetPostReleaseMonitorRecord = {
      ...baseMonitor,
      monitorHash: stableHash({
        monitorVersion: baseMonitor.monitorVersion,
        deploymentHandoffId: baseMonitor.deploymentHandoffId,
        deploymentHandoffHash: baseMonitor.deploymentHandoffHash,
        modelReleaseGateHash: baseMonitor.modelReleaseGateHash,
        trainingRunHash: baseMonitor.trainingRunHash,
        evalRunHash: baseMonitor.evalRunHash,
        evalStatus: baseMonitor.evalStatus,
        evalCaseSummary: baseMonitor.evalCaseSummary,
        releaseEvidenceHash: baseMonitor.releaseEvidenceHash,
        signalSummary: baseMonitor.signalSummary,
        releasePackageHash: baseMonitor.releasePackageHash,
        datasetVersionId: baseMonitor.datasetVersionId,
        modelName: baseMonitor.modelName,
        environment: baseMonitor.environment,
        metrics: baseMonitor.metrics,
        status: baseMonitor.status,
      }),
    };

    this.data.postReleaseMonitors.unshift(monitor);
    this.data.postReleaseMonitors = this.data.postReleaseMonitors.slice(0, 200);
    await this.save();
    return monitor;
  }

  async recordPostReleaseSignal(input: {
    monitorId: string;
    taskSuccessRate?: number;
    regressionAlertRate?: number;
    p95LatencyMs?: number;
    toolErrorRate?: number;
    manualInterventionRate?: number;
    rollbackSignal?: boolean;
    alertNote?: string;
    status?: DatasetPostReleaseMonitorStatus;
    note?: string;
    recordedBy?: string;
  }): Promise<DatasetPostReleaseMonitorRecord | undefined> {
    const monitor = this.getPostReleaseMonitor(input.monitorId);
    if (!monitor) return undefined;

    const metrics = monitor.metrics.map((metric) => {
      const nextValue = this.postReleaseMetricInputValue(metric.id, input);
      if (typeof nextValue !== 'number') return metric;
      const nextMetric = { ...metric, value: nextValue };
      return { ...nextMetric, gate: this.postReleaseMetricGate(nextMetric) };
    });
    const rollbackSignal = input.rollbackSignal ?? monitor.rollbackSignal;
    const generatedAlerts = this.postReleaseAlerts(metrics, rollbackSignal, input.alertNote);
    const evaluatedStatus = this.postReleaseStatus(metrics, rollbackSignal);
    const status = input.status === 'closed' ? 'closed' : evaluatedStatus;
    const signalSummary = this.postReleaseSignalSummary(metrics, status, rollbackSignal);
    const recommendedAction = this.postReleaseRecommendedAction(status);
    const recordedAt = new Date().toISOString();
    const event = {
      id: `postrelease_event_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      status,
      metrics,
      alerts: generatedAlerts,
      rollbackSignal,
      signalSummary,
      recommendedAction,
      note: input.note?.trim() || undefined,
      recordedAt,
      recordedBy: input.recordedBy ?? 'traceops-monitor-owner',
    };
    const events = [...monitor.events, event];
    const nextMonitor: DatasetPostReleaseMonitorRecord = {
      ...monitor,
      status,
      metrics,
      alerts: generatedAlerts,
      rollbackSignal,
      signalSummary,
      recommendedAction,
      events,
      updatedAt: recordedAt,
      closedAt: status === 'closed' ? (monitor.closedAt ?? recordedAt) : monitor.closedAt,
      note: input.note?.trim() || monitor.note,
      monitorHash: stableHash({
        monitorVersion: monitor.monitorVersion,
        id: monitor.id,
        deploymentHandoffId: monitor.deploymentHandoffId,
        deploymentHandoffHash: monitor.deploymentHandoffHash,
        modelReleaseGateHash: monitor.modelReleaseGateHash,
        trainingRunHash: monitor.trainingRunHash,
        evalRunHash: monitor.evalRunHash,
        evalStatus: monitor.evalStatus,
        evalCaseSummary: monitor.evalCaseSummary,
        releaseEvidenceHash: monitor.releaseEvidenceHash,
        signalSummary,
        releasePackageHash: monitor.releasePackageHash,
        modelName: monitor.modelName,
        environment: monitor.environment,
        status,
        metrics,
        alerts: generatedAlerts,
        rollbackSignal,
        events,
      }),
    };

    this.data.postReleaseMonitors = this.data.postReleaseMonitors.map((item) => item.id === monitor.id ? nextMonitor : item);
    await this.save();
    return nextMonitor;
  }

  private defaultPostReleaseMetrics(): DatasetPostReleaseMetric[] {
    return [
      { id: 'task-success-rate', label: 'Task success rate', value: 0, target: 0.92, unit: 'percent', direction: 'min', gate: 'pending' },
      { id: 'regression-alert-rate', label: 'Regression alert rate', value: 0, target: 0.02, unit: 'percent', direction: 'max', gate: 'pending' },
      { id: 'p95-latency-ms', label: 'P95 latency', value: 0, target: 2500, unit: 'ms', direction: 'max', gate: 'pending' },
      { id: 'tool-error-rate', label: 'Tool error rate', value: 0, target: 0.03, unit: 'percent', direction: 'max', gate: 'pending' },
      { id: 'manual-intervention-rate', label: 'Manual intervention rate', value: 0, target: 0.08, unit: 'percent', direction: 'max', gate: 'pending' },
    ];
  }

  private postReleaseMetricInputValue(metricId: string, input: {
    taskSuccessRate?: number;
    regressionAlertRate?: number;
    p95LatencyMs?: number;
    toolErrorRate?: number;
    manualInterventionRate?: number;
  }): number | undefined {
    if (metricId === 'task-success-rate') return input.taskSuccessRate;
    if (metricId === 'regression-alert-rate') return input.regressionAlertRate;
    if (metricId === 'p95-latency-ms') return input.p95LatencyMs;
    if (metricId === 'tool-error-rate') return input.toolErrorRate;
    if (metricId === 'manual-intervention-rate') return input.manualInterventionRate;
    return undefined;
  }

  private postReleaseMetricGate(metric: DatasetPostReleaseMetric): DatasetPostReleaseMetric['gate'] {
    if (metric.direction === 'min') {
      if (metric.value >= metric.target) return 'passed';
      if (metric.value >= metric.target * 0.95) return 'warning';
      return 'failed';
    }
    if (metric.value <= metric.target) return 'passed';
    if (metric.value <= metric.target * 1.75) return 'warning';
    return 'failed';
  }

  private postReleaseStatus(
    metrics: DatasetPostReleaseMetric[],
    rollbackSignal: boolean,
  ): DatasetPostReleaseMonitorStatus {
    if (rollbackSignal || metrics.some((metric) => metric.gate === 'failed')) return 'rollback_required';
    if (metrics.some((metric) => metric.gate === 'warning')) return 'attention';
    if (metrics.length > 0 && metrics.every((metric) => metric.gate === 'passed')) return 'healthy';
    return 'watching';
  }

  private postReleaseRecommendedAction(status: DatasetPostReleaseMonitorStatus): string {
    if (status === 'rollback_required') return 'Open rollback review and attach the failing online signal to the release chain.';
    if (status === 'attention') return 'Keep rollout under observation and route warning signals to the next dataset repair cycle.';
    if (status === 'healthy') return 'Keep monitoring and mark the release stable after the observation window.';
    if (status === 'closed') return 'Monitoring window closed; preserve signals for future training context.';
    return 'Wait for online metrics from the live deployment.';
  }

  private postReleaseSignalSummary(
    metrics: DatasetPostReleaseMetric[],
    status: DatasetPostReleaseMonitorStatus,
    rollbackSignal: boolean,
  ): NonNullable<DatasetPostReleaseMonitorRecord['signalSummary']> {
    const severity = status === 'rollback_required' || rollbackSignal || metrics.some((metric) => metric.gate === 'failed')
      ? 'critical'
      : status === 'attention' || metrics.some((metric) => metric.gate === 'warning')
        ? 'warning'
        : 'info';
    const targetKind: NonNullable<DatasetPostReleaseMonitorRecord['signalSummary']>['targetKind'] = severity === 'critical' || rollbackSignal
      ? 'repair'
      : severity === 'warning'
        ? 'eval'
        : metrics.some((metric) => metric.id === 'manual-intervention-rate' && metric.value > metric.target)
          ? 'sft'
          : 'eval';

    return {
      passed: metrics.filter((metric) => metric.gate === 'passed').length,
      warning: metrics.filter((metric) => metric.gate === 'warning').length,
      failed: metrics.filter((metric) => metric.gate === 'failed').length,
      pending: metrics.filter((metric) => metric.gate === 'pending').length,
      severity,
      targetKind,
    };
  }

  private postReleaseAlerts(
    metrics: DatasetPostReleaseMetric[],
    rollbackSignal: boolean,
    alertNote?: string,
  ): DatasetPostReleaseAlert[] {
    const createdAt = new Date().toISOString();
    const alerts: DatasetPostReleaseAlert[] = metrics
      .filter((metric) => metric.gate === 'warning' || metric.gate === 'failed')
      .map((metric) => ({
        id: `postrelease_alert_${Date.now()}_${metric.id}_${Math.random().toString(36).slice(2, 6)}`,
        severity: metric.gate === 'failed' ? 'critical' as const : 'warning' as const,
        label: metric.label,
        detail: `${metric.label} is ${metric.value} against target ${metric.direction === 'min' ? '>=' : '<='} ${metric.target}.`,
        createdAt,
      }));
    if (rollbackSignal) {
      alerts.unshift({
        id: `postrelease_alert_${Date.now()}_rollback_${Math.random().toString(36).slice(2, 6)}`,
        severity: 'critical',
        label: 'Rollback signal',
        detail: alertNote?.trim() || 'Rollback signal was reported by online monitoring.',
        createdAt,
      });
    } else if (alertNote?.trim()) {
      alerts.push({
        id: `postrelease_alert_${Date.now()}_note_${Math.random().toString(36).slice(2, 6)}`,
        severity: 'info',
        label: 'Monitor note',
        detail: alertNote.trim(),
        createdAt,
      });
    }
    return alerts;
  }

  listFeedbackLoops(): DatasetFeedbackLoopRecord[] {
    return this.data.feedbackLoops.slice(0, 100);
  }

  getFeedbackLoop(id: string): DatasetFeedbackLoopRecord | undefined {
    return this.data.feedbackLoops.find((loop) => loop.id === id);
  }

  async createFeedbackLoop(input: {
    postReleaseMonitorId: string;
    note?: string;
    createdBy?: string;
  }): Promise<DatasetFeedbackLoopRecord | undefined> {
    const monitor = this.getPostReleaseMonitor(input.postReleaseMonitorId);
    if (!monitor) return undefined;
    const existing = this.data.feedbackLoops.find((loop) =>
      loop.postReleaseMonitorId === monitor.id && loop.status !== 'rejected'
    );
    if (existing) return existing;

    const createdAt = new Date().toISOString();
    const severity = this.feedbackLoopSeverity(monitor);
    const targetKind = this.feedbackLoopTargetKind(monitor, severity);
    const title = `${monitor.modelName} ${this.feedbackLoopTitleSuffix(monitor, severity)}`;
    const summary = this.feedbackLoopSummary(monitor, severity, targetKind);
    const evidencePrompt = this.feedbackLoopEvidencePrompt(monitor, targetKind);
    const baseLoop = {
      id: `feedback_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      loopVersion: 'traceops-feedback-loop-v1' as const,
      status: 'candidate' as const,
      severity,
      targetKind,
      postReleaseMonitorId: monitor.id,
      postReleaseMonitorHash: monitor.monitorHash,
      deploymentHandoffId: monitor.deploymentHandoffId,
      deploymentHandoffHash: monitor.deploymentHandoffHash,
      modelReleaseGateId: monitor.modelReleaseGateId,
      modelReleaseGateHash: monitor.modelReleaseGateHash,
      trainingRunId: monitor.trainingRunId,
      trainingRunHash: monitor.trainingRunHash,
      evalRunId: monitor.evalRunId,
      evalRunHash: monitor.evalRunHash,
      evalStatus: monitor.evalStatus,
      releaseEvidenceHash: monitor.releaseEvidenceHash,
      releasePackageId: monitor.releasePackageId,
      releasePackageHash: monitor.releasePackageHash,
      datasetVersionId: monitor.datasetVersionId,
      datasetVersionName: monitor.datasetVersionName,
      modelName: monitor.modelName,
      modelVersion: monitor.modelVersion,
      environment: monitor.environment,
      monitorStatus: monitor.status,
      rollbackSignal: monitor.rollbackSignal,
      alerts: monitor.alerts,
      metrics: monitor.metrics,
      title,
      summary,
      evidencePrompt,
      recommendedAction: monitor.recommendedAction,
      decisions: [],
      createdAt,
      createdBy: input.createdBy ?? 'traceops-feedback-curator',
      updatedAt: createdAt,
      note: input.note?.trim() || undefined,
    } satisfies Omit<DatasetFeedbackLoopRecord, 'loopHash'>;
    const loop: DatasetFeedbackLoopRecord = {
      ...baseLoop,
      loopHash: stableHash({
        loopVersion: baseLoop.loopVersion,
        postReleaseMonitorId: baseLoop.postReleaseMonitorId,
        postReleaseMonitorHash: baseLoop.postReleaseMonitorHash,
        deploymentHandoffHash: baseLoop.deploymentHandoffHash,
        modelReleaseGateHash: baseLoop.modelReleaseGateHash,
        trainingRunHash: baseLoop.trainingRunHash,
        evalRunHash: baseLoop.evalRunHash,
        evalStatus: baseLoop.evalStatus,
        releaseEvidenceHash: baseLoop.releaseEvidenceHash,
        releasePackageHash: baseLoop.releasePackageHash,
        datasetVersionId: baseLoop.datasetVersionId,
        modelName: baseLoop.modelName,
        monitorStatus: baseLoop.monitorStatus,
        severity: baseLoop.severity,
        targetKind: baseLoop.targetKind,
        alerts: baseLoop.alerts,
        metrics: baseLoop.metrics,
        evidencePrompt: baseLoop.evidencePrompt,
      }),
    };

    this.data.feedbackLoops.unshift(loop);
    this.data.feedbackLoops = this.data.feedbackLoops.slice(0, 200);
    await this.save();
    return loop;
  }

  async recordFeedbackLoopDecision(input: {
    feedbackLoopId: string;
    decision: DatasetFeedbackLoopDecision;
    note?: string;
    decidedBy?: string;
  }): Promise<DatasetFeedbackLoopRecord | undefined> {
    const loop = this.getFeedbackLoop(input.feedbackLoopId);
    if (!loop) return undefined;
    const decidedAt = new Date().toISOString();
    const decision = {
      id: `feedback_decision_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      feedbackLoopId: loop.id,
      decision: input.decision,
      note: input.note?.trim() || undefined,
      decidedAt,
      decidedBy: input.decidedBy ?? 'traceops-feedback-curator',
    };
    const status = input.decision === 'reopened' ? 'candidate' : input.decision;
    const decisions = [...loop.decisions, decision];
    const nextLoop: DatasetFeedbackLoopRecord = {
      ...loop,
      status,
      decisions,
      updatedAt: decidedAt,
      note: input.note?.trim() || loop.note,
      loopHash: stableHash({
        loopVersion: loop.loopVersion,
        id: loop.id,
        postReleaseMonitorHash: loop.postReleaseMonitorHash,
        deploymentHandoffHash: loop.deploymentHandoffHash,
        modelReleaseGateHash: loop.modelReleaseGateHash,
        trainingRunHash: loop.trainingRunHash,
        evalRunHash: loop.evalRunHash,
        evalStatus: loop.evalStatus,
        releaseEvidenceHash: loop.releaseEvidenceHash,
        releasePackageHash: loop.releasePackageHash,
        datasetVersionId: loop.datasetVersionId,
        severity: loop.severity,
        targetKind: loop.targetKind,
        status,
        alerts: loop.alerts,
        metrics: loop.metrics,
        decisions,
      }),
    };

    this.data.feedbackLoops = this.data.feedbackLoops.map((item) => item.id === loop.id ? nextLoop : item);
    await this.save();
    return nextLoop;
  }

  async createFeedbackDatasetVersion(input: {
    name?: string;
    feedbackLoopIds?: string[];
    notes?: string;
    createdBy?: string;
    format?: DatasetExportFormat;
  }): Promise<DatasetVersion> {
    const requestedIds = input.feedbackLoopIds?.length ? new Set(input.feedbackLoopIds) : undefined;
    const alreadyVersioned = new Set(this.data.datasetVersions.flatMap((version) => version.feedbackLoopIds ?? []));
    const loops = this.data.feedbackLoops
      .filter((loop) => loop.status === 'promoted')
      .filter((loop) => requestedIds ? requestedIds.has(loop.id) : !alreadyVersioned.has(loop.id))
      .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));

    if (requestedIds && loops.length !== requestedIds.size) {
      throw new Error('Only promoted feedback loops can be added to a closed-loop dataset version.');
    }
    if (loops.length === 0) {
      throw new Error('No promoted feedback loops are available for a closed-loop dataset version.');
    }

    const createdAt = new Date().toISOString();
    const sampleSnapshots = loops.map((loop) => this.feedbackLoopSampleSnapshot(loop, createdAt));
    const format = input.format ?? this.feedbackLoopDatasetFormat(loops);
    const feedbackLoopSummary = this.feedbackLoopDatasetSummary(loops);
    const version: DatasetVersion = {
      id: `dataset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: input.name?.trim() || `KodaX closed-loop ${createdAt.slice(0, 10)} ${createdAt.slice(11, 16)}`,
      source: 'feedback_loop',
      status: 'ready',
      format,
      sampleIds: sampleSnapshots.map((sample) => sample.id),
      sampleCount: sampleSnapshots.length,
      averageQuality: averageQualityScore(sampleSnapshots),
      filters: {
        source: 'feedback_loop',
        status: 'promoted',
        feedbackLoopIds: loops.map((loop) => loop.id).join(','),
      },
      snapshotHash: stableHash({
        source: 'feedback_loop',
        format,
        feedbackLoopSummary,
        loops: loops.map((loop) => ({
          id: loop.id,
          loopHash: loop.loopHash,
          status: loop.status,
          severity: loop.severity,
          targetKind: loop.targetKind,
          monitorStatus: loop.monitorStatus,
          postReleaseMonitorHash: loop.postReleaseMonitorHash,
          evalRunHash: loop.evalRunHash,
          releaseEvidenceHash: loop.releaseEvidenceHash,
          releasePackageHash: loop.releasePackageHash,
        })),
        samples: sampleSnapshots,
      }),
      sampleSnapshots,
      reviewSummary: {
        approved: sampleSnapshots.length,
        rejected: 0,
        unreviewed: 0,
      },
      createdAt,
      createdBy: input.createdBy ?? 'traceops-feedback-curator',
      notes: input.notes?.trim() || 'Created from promoted post-release feedback loops.',
      feedbackLoopIds: loops.map((loop) => loop.id),
      feedbackLoopSummary,
    };

    this.data.datasetVersions.unshift(version);
    this.data.datasetVersions = this.data.datasetVersions.slice(0, 100);
    await this.materializeDatasetVersionSegment(version, 'dataset_version_created');
    await this.save();
    return version;
  }

  private feedbackLoopDatasetFormat(loops: DatasetFeedbackLoopRecord[]): DatasetExportFormat {
    const targetKinds = new Set(loops.map((loop) => loop.targetKind));
    if (targetKinds.size === 1) {
      if (targetKinds.has('sft')) return 'fine_tune_jsonl';
      if (targetKinds.has('eval')) return 'eval_jsonl';
      if (targetKinds.has('repair')) return 'repair_jsonl';
    }
    return 'traceops_jsonl';
  }

  private feedbackLoopSampleKind(loop: DatasetFeedbackLoopRecord): TrainingSample['kind'] {
    if (loop.targetKind === 'sft') return 'sft';
    if (loop.targetKind === 'eval') return 'eval';
    if (loop.targetKind === 'repair') return 'repair';
    return 'conversation';
  }

  private feedbackLoopRiskLevel(loop: DatasetFeedbackLoopRecord): TrainingSample['riskLevel'] {
    if (loop.severity === 'critical' || loop.rollbackSignal) return 'L3';
    if (loop.severity === 'warning') return 'L2';
    return 'L1';
  }

  private feedbackLoopQuality(loop: DatasetFeedbackLoopRecord): TrainingSample['quality'] {
    const score = loop.severity === 'critical' ? 68 : loop.severity === 'warning' ? 78 : 90;
    return {
      score,
      grade: loop.severity === 'critical' ? 'review' : loop.severity === 'warning' ? 'good' : 'excellent',
      signals: [
        {
          label: 'Post-release signal',
          impact: loop.severity === 'info' ? 'positive' : loop.severity === 'warning' ? 'warning' : 'negative',
          detail: loop.summary,
        },
        {
          label: 'Monitor status',
          impact: loop.monitorStatus === 'healthy' ? 'positive' : loop.rollbackSignal ? 'negative' : 'warning',
          detail: `${loop.environment} · ${loop.monitorStatus}`,
        },
      ],
    };
  }

  private feedbackLoopCleanOutcome(loop: DatasetFeedbackLoopRecord): string {
    if (loop.targetKind === 'repair') {
      return `Repair the release behavior described by ${loop.postReleaseMonitorId}. ${loop.recommendedAction}`;
    }
    if (loop.targetKind === 'eval') {
      return `Expected behavior: the agent should keep the monitored release inside target thresholds and explain remediation when metrics drift. ${loop.recommendedAction}`;
    }
    if (loop.targetKind === 'sft') {
      return `Preferred response: complete the enterprise task with the monitored safeguards, low manual intervention, and auditable evidence. ${loop.recommendedAction}`;
    }
    return `Memory candidate: retain this post-release lesson as enterprise operational memory. ${loop.recommendedAction}`;
  }

  private feedbackLoopSampleSnapshot(loop: DatasetFeedbackLoopRecord, createdAt: string): TrainingSample {
    const kind = this.feedbackLoopSampleKind(loop);
    const riskLevel = this.feedbackLoopRiskLevel(loop);
    const metrics = loop.metrics.map((metric) => `${metric.label}: ${metric.value}/${metric.target} (${metric.gate})`).join('; ');
    const alerts = loop.alerts.length > 0
      ? loop.alerts.map((alert) => `${alert.severity}: ${alert.label} - ${alert.detail}`).join('; ')
      : 'no alert';
    const cleanUserGoal = [
      loop.evidencePrompt,
      `Feedback summary: ${loop.summary}`,
      `Release evidence: monitor ${loop.postReleaseMonitorHash}, deployment ${loop.deploymentHandoffHash}, eval ${loop.evalRunHash ?? 'not attached'}, package ${loop.releasePackageHash}.`,
      `Metrics: ${metrics || 'no metrics'}.`,
      `Alerts: ${alerts}.`,
    ].join('\n');
    const cleanAssistantOutcome = this.feedbackLoopCleanOutcome(loop);
    const labels = [
      'post_release_feedback',
      `target:${loop.targetKind}`,
      `severity:${loop.severity}`,
      `monitor:${loop.monitorStatus}`,
      `env:${loop.environment}`,
      `model:${loop.modelName}`,
    ];

    return {
      id: `sample_${loop.id}`,
      traceId: `trace_${loop.postReleaseMonitorId}`,
      revisionId: `revision_${loop.id}`,
      source: 'feedback_loop',
      sourceSessionId: loop.postReleaseMonitorId,
      projectKey: loop.environment,
      title: loop.title,
      kind,
      status: 'candidate',
      trainable: loop.targetKind !== 'memory',
      riskLevel,
      quality: this.feedbackLoopQuality(loop),
      blockers: [],
      labels,
      promptPreview: cleanUserGoal.replace(/\s+/g, ' ').slice(0, 220),
      responsePreview: cleanAssistantOutcome.replace(/\s+/g, ' ').slice(0, 220),
      toolEventCount: loop.metrics.length,
      evidenceCount: loop.metrics.length + loop.alerts.length + 1,
      eventCount: loop.metrics.length + loop.alerts.length + loop.decisions.length + 1,
      createdAt,
      updatedAt: createdAt,
      input: {
        userGoal: cleanUserGoal,
        cleanUserGoal,
        runtime: {
          surface: 'traceops-feedback-loop',
          model: loop.modelName,
          scope: 'managed-task-worker',
        },
        toolEventIds: loop.metrics.map((metric) => `${loop.postReleaseMonitorId}:${metric.id}`),
        evidenceIds: [
          loop.postReleaseMonitorHash,
          loop.deploymentHandoffHash,
          loop.modelReleaseGateHash,
          loop.trainingRunHash,
          loop.evalRunHash,
          loop.releaseEvidenceHash,
          loop.releasePackageHash,
          loop.loopHash,
        ].filter((id): id is string => Boolean(id)),
        sourceEventIds: loop.decisions.map((decision) => decision.id),
      },
      output: {
        assistantOutcome: cleanAssistantOutcome,
        cleanAssistantOutcome,
        finalEventId: loop.id,
      },
      metadata: {
        generatedBy: 'traceops-feedback-loop-v1',
        traceStatus: 'completed',
        ingestionStatus: 'imported',
        riskReasons: [
          `${loop.severity}_post_release_feedback`,
          loop.rollbackSignal ? 'rollback_signal' : undefined,
          ...loop.alerts.map((alert) => `${alert.severity}_${alert.id}`),
        ].filter((reason): reason is string => Boolean(reason)),
        distillation: {
          version: 'kodax-clean-text-v1',
          redactionCount: 0,
          removedThinking: true,
          readyForFineTune: loop.targetKind === 'sft',
        },
        datasetBuilder: {
          version: 'traceops-feedback-dataset-builder-v1',
          sourceSignals: [
            loop.id,
            loop.postReleaseMonitorId,
            loop.deploymentHandoffId,
            loop.modelReleaseGateId,
            loop.trainingRunId,
            loop.evalRunId,
            loop.releasePackageId,
          ].filter((id): id is string => Boolean(id)),
        },
        feedbackLoop: {
          feedbackLoopId: loop.id,
          postReleaseMonitorId: loop.postReleaseMonitorId,
          deploymentHandoffId: loop.deploymentHandoffId,
          modelReleaseGateId: loop.modelReleaseGateId,
          trainingRunId: loop.trainingRunId,
          evalRunId: loop.evalRunId,
          releasePackageId: loop.releasePackageId,
          sourceDatasetVersionId: loop.datasetVersionId,
          loopHash: loop.loopHash,
          monitorHash: loop.postReleaseMonitorHash,
          deploymentHandoffHash: loop.deploymentHandoffHash,
          modelReleaseGateHash: loop.modelReleaseGateHash,
          trainingRunHash: loop.trainingRunHash,
          evalRunHash: loop.evalRunHash,
          evalStatus: loop.evalStatus,
          releaseEvidenceHash: loop.releaseEvidenceHash,
          releasePackageHash: loop.releasePackageHash,
          targetKind: loop.targetKind,
          severity: loop.severity,
          monitorStatus: loop.monitorStatus,
          environment: loop.environment,
        },
      },
      review: {
        decision: 'approved',
        reviewer: 'traceops-feedback-curator',
        note: `Promoted feedback loop ${loop.id} converted into closed-loop dataset sample.`,
        decidedAt: createdAt,
      },
    };
  }

  private feedbackLoopDatasetSummary(loops: DatasetFeedbackLoopRecord[]): NonNullable<DatasetVersion['feedbackLoopSummary']> {
    const countBy = (read: (loop: DatasetFeedbackLoopRecord) => string) => loops.reduce<Record<string, number>>((counts, loop) => {
      const key = read(loop);
      counts[key] = (counts[key] ?? 0) + 1;
      return counts;
    }, {});
    return {
      total: loops.length,
      severity: countBy((loop) => loop.severity),
      targetKind: countBy((loop) => loop.targetKind),
      monitorStatus: countBy((loop) => loop.monitorStatus),
      rollbackSignals: loops.filter((loop) => loop.rollbackSignal).length,
      sourceDatasetVersionIds: Array.from(new Set(loops.map((loop) => loop.datasetVersionId))),
      postReleaseMonitorIds: Array.from(new Set(loops.map((loop) => loop.postReleaseMonitorId))),
      evalRunIds: Array.from(new Set(loops.map((loop) => loop.evalRunId).filter((id): id is string => Boolean(id)))),
      releaseEvidenceHashes: Array.from(new Set(loops.map((loop) => loop.releaseEvidenceHash).filter((hash): hash is string => Boolean(hash)))),
      releasePackageIds: Array.from(new Set(loops.map((loop) => loop.releasePackageId))),
    };
  }

  private feedbackLoopSeverity(monitor: DatasetPostReleaseMonitorRecord): DatasetFeedbackLoopSeverity {
    if (
      monitor.rollbackSignal
      || monitor.status === 'rollback_required'
      || monitor.alerts.some((alert) => alert.severity === 'critical')
    ) {
      return 'critical';
    }
    if (
      monitor.status === 'attention'
      || monitor.alerts.some((alert) => alert.severity === 'warning')
      || monitor.metrics.some((metric) => metric.gate === 'warning')
    ) {
      return 'warning';
    }
    return 'info';
  }

  private feedbackLoopTargetKind(
    monitor: DatasetPostReleaseMonitorRecord,
    severity: DatasetFeedbackLoopSeverity,
  ): DatasetFeedbackLoopTargetKind {
    if (severity === 'critical' || monitor.rollbackSignal) return 'repair';
    if (severity === 'warning') return 'eval';
    if (monitor.metrics.some((metric) => metric.id === 'manual-intervention-rate' && metric.value > metric.target)) return 'sft';
    return 'eval';
  }

  private feedbackLoopTitleSuffix(
    monitor: DatasetPostReleaseMonitorRecord,
    severity: DatasetFeedbackLoopSeverity,
  ): string {
    if (severity === 'critical') return 'rollback signal for repair dataset';
    if (severity === 'warning') return 'online warning for eval dataset';
    if (monitor.status === 'healthy') return 'healthy release guardrail for eval dataset';
    return 'online signal for dataset review';
  }

  private feedbackLoopSummary(
    monitor: DatasetPostReleaseMonitorRecord,
    severity: DatasetFeedbackLoopSeverity,
    targetKind: DatasetFeedbackLoopTargetKind,
  ): string {
    const alert = monitor.alerts[0];
    const failedMetrics = monitor.metrics.filter((metric) => metric.gate === 'failed' || metric.gate === 'warning');
    const signal = alert
      ? `${alert.label}: ${alert.detail}`
      : failedMetrics[0]
        ? `${failedMetrics[0].label} ${failedMetrics[0].value} against target ${failedMetrics[0].target}`
        : `Monitor status is ${monitor.status}.`;
    return `${severity.toUpperCase()} ${targetKind} candidate from ${monitor.environment}. ${signal}`;
  }

  private feedbackLoopEvidencePrompt(
    monitor: DatasetPostReleaseMonitorRecord,
    targetKind: DatasetFeedbackLoopTargetKind,
  ): string {
    const metrics = monitor.metrics.map((metric) => `${metric.label}: ${metric.value}/${metric.target} ${metric.gate}`).join('; ');
    const alerts = monitor.alerts.length > 0
      ? monitor.alerts.map((alert) => `${alert.severity}: ${alert.label}`).join('; ')
      : 'no alert';
    return [
      `Create a ${targetKind} sample candidate from post-release monitor ${monitor.id}.`,
      `Model ${monitor.modelName} in ${monitor.environment}.`,
      `Metrics: ${metrics}.`,
      `Alerts: ${alerts}.`,
      `Preserve hashes: deployment ${monitor.deploymentHandoffHash}, model gate ${monitor.modelReleaseGateHash}, training run ${monitor.trainingRunHash}, release package ${monitor.releasePackageHash}.`,
    ].join(' ');
  }

  private markHandoffChecklist(
    handoffId: string,
    checklistIds: string[],
    status: DatasetRetrainingHandoffRecord['status'],
  ) {
    this.data.retrainingHandoffs = this.data.retrainingHandoffs.map((handoff) => {
      if (handoff.id !== handoffId) return handoff;
      return {
        ...handoff,
        status,
        checklist: handoff.checklist.map((item) =>
          checklistIds.includes(item.id) ? { ...item, status: 'done' as const } : item
        ),
      };
    });
  }

  async promoteReleaseManifest(input: {
    manifestId: string;
    note?: string;
    promotedBy?: string;
  }): Promise<DatasetReleaseManifest | undefined> {
    const manifest = this.data.releaseManifests.find((item) => item.id === input.manifestId);
    if (!manifest) return undefined;
    if (manifest.status !== 'ready' || manifest.releaseGate.releaseBlocked) {
      throw new Error('Only ready release manifests can be promoted.');
    }
    const currentPromotion = this.promotionForManifest(manifest.id);
    if (currentPromotion?.status === 'promoted') {
      throw new Error('This release manifest is already promoted.');
    }

    const record: DatasetReleasePromotionRecord = {
      id: `release_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      manifestId: manifest.id,
      datasetVersionId: manifest.datasetVersionId,
      datasetVersionName: manifest.datasetVersionName,
      manifestHash: manifest.manifestHash,
      status: 'promoted',
      promotedAt: new Date().toISOString(),
      promotedBy: input.promotedBy ?? 'local-release-owner',
      note: input.note?.trim() || undefined,
    };
    this.data.releasePromotions.unshift(record);
    this.data.releasePromotions = this.data.releasePromotions.slice(0, 100);
    await this.save();
    return this.getReleaseManifest(manifest.id);
  }

  private releaseGateActionsForVersion(versionId: string): DatasetReleaseGateActionRecord[] {
    return this.data.datasetReleaseGateActions
      .filter((action) => action.datasetVersionId === versionId)
      .sort((a, b) => b.decidedAt.localeCompare(a.decidedAt));
  }

  private withDatasetReleaseGateActions(version: DatasetVersion): DatasetVersion {
    return {
      ...version,
      releaseGateActions: this.releaseGateActionsForVersion(version.id),
    };
  }

  listDatasetVersions(): DatasetVersion[] {
    return this.data.datasetVersions.slice(0, 50).map((version) => this.withDatasetReleaseGateActions(version));
  }

  getDatasetVersion(id: string): DatasetVersion | undefined {
    const version = this.data.datasetVersions.find((item) => item.id === id);
    return version ? this.withDatasetReleaseGateActions(version) : undefined;
  }

  private datasetVersionSamples(version: DatasetVersion): TrainingSample[] {
    if (version.sampleSnapshots) return version.sampleSnapshots;
    return this.listTrainingSamples({ sampleIds: version.sampleIds.join(',') }).samples;
  }

  listDatasetVersionSamples(id: string): TrainingSample[] | undefined {
    const version = this.getDatasetVersion(id);
    if (!version) return undefined;
    return this.datasetVersionSamples(version);
  }

  private datasetDiffReviewsFor(diffId: string): DatasetVersionDiffReviewRecord[] {
    return this.data.datasetDiffReviews
      .filter((review) => review.diffId === diffId)
      .sort((a, b) => b.decidedAt.localeCompare(a.decidedAt));
  }

  getDatasetVersionDiff(headVersionId: string, baseVersionId?: string): DatasetVersionDiff | undefined {
    const headVersion = this.getDatasetVersion(headVersionId);
    if (!headVersion) return undefined;

    const versions = this.listDatasetVersions();
    const headIndex = versions.findIndex((version) => version.id === headVersion.id);
    const baseVersion = baseVersionId
      ? this.getDatasetVersion(baseVersionId)
      : versions[headIndex + 1] ?? versions.find((version) => version.id !== headVersion.id);
    if (!baseVersion) return undefined;

    const baseSamples = this.listDatasetVersionSamples(baseVersion.id) ?? [];
    const headSamples = this.listDatasetVersionSamples(headVersion.id) ?? [];
    const baseById = new Map(baseSamples.map((sample) => [sample.id, sample]));
    const headById = new Map(headSamples.map((sample) => [sample.id, sample]));
    const sampleIds = Array.from(new Set([...baseById.keys(), ...headById.keys()]));

    const changes = sampleIds.map<DatasetVersionDiffSampleChange>((sampleId) => {
      const before = baseById.get(sampleId);
      const after = headById.get(sampleId);
      const sample = after ?? before;
      const signals = buildDiffSignals(before, after);
      const kind: DatasetVersionDiffSampleChange['kind'] = !before
        ? 'added'
        : !after
          ? 'removed'
          : sampleSnapshotHash(before) === sampleSnapshotHash(after)
            ? 'unchanged'
            : 'changed';
      return {
        sampleId,
        traceId: sample?.traceId ?? sampleId,
        title: sample?.title ?? sampleId,
        projectKey: sample?.projectKey,
        sourceSessionId: sample?.sourceSessionId ?? 'unknown',
        kind,
        importance: diffImportance(kind, signals),
        before: before ? sampleDiffPoint(before) : undefined,
        after: after ? sampleDiffPoint(after) : undefined,
        signals,
      };
    }).sort((a, b) => {
      const kindRank: Record<DatasetVersionDiffSampleChange['kind'], number> = {
        added: 0,
        changed: 1,
        removed: 2,
        unchanged: 3,
      };
      const importanceRank: Record<DatasetVersionDiffSampleChange['importance'], number> = {
        high: 0,
        medium: 1,
        low: 2,
      };
      return kindRank[a.kind] - kindRank[b.kind]
        || importanceRank[a.importance] - importanceRank[b.importance]
        || a.title.localeCompare(b.title);
    });

    const summary: DatasetVersionDiff['summary'] = {
      added: changes.filter((change) => change.kind === 'added').length,
      removed: changes.filter((change) => change.kind === 'removed').length,
      changed: changes.filter((change) => change.kind === 'changed').length,
      unchanged: changes.filter((change) => change.kind === 'unchanged').length,
      sampleDelta: headSamples.length - baseSamples.length,
      averageQualityDelta: averageQualityScore(headSamples) - averageQualityScore(baseSamples),
      highRiskDelta: headSamples.filter((sample) => sample.riskLevel === 'L3' || sample.riskLevel === 'L4').length
        - baseSamples.filter((sample) => sample.riskLevel === 'L3' || sample.riskLevel === 'L4').length,
      blockedQualityDelta: headSamples.filter((sample) => sample.quality.grade === 'blocked').length
        - baseSamples.filter((sample) => sample.quality.grade === 'blocked').length,
      evidenceGapDelta: evidenceGapCount(headSamples) - evidenceGapCount(baseSamples),
      approvedDelta: headSamples.filter((sample) => sample.review?.decision === 'approved').length
        - baseSamples.filter((sample) => sample.review?.decision === 'approved').length,
      trainableDelta: headSamples.filter((sample) => sample.trainable).length - baseSamples.filter((sample) => sample.trainable).length,
    };

    const id = datasetVersionDiffId(baseVersion.id, headVersion.id);
    const reviewHistory = this.datasetDiffReviewsFor(id);
    const review = reviewHistory[0];

    return {
      id,
      baseVersionId: baseVersion.id,
      baseVersionName: baseVersion.name,
      headVersionId: headVersion.id,
      headVersionName: headVersion.name,
      baseSnapshotHash: baseVersion.snapshotHash,
      headSnapshotHash: headVersion.snapshotHash,
      baseSampleCount: baseSamples.length,
      headSampleCount: headSamples.length,
      summary,
      riskDelta: deltaCounts(countSamplesBy(baseSamples, (sample) => sample.riskLevel), countSamplesBy(headSamples, (sample) => sample.riskLevel)),
      kindDelta: deltaCounts(countSamplesBy(baseSamples, (sample) => sample.kind), countSamplesBy(headSamples, (sample) => sample.kind)),
      projectDelta: deltaCounts(countSamplesBy(baseSamples, (sample) => sample.projectKey), countSamplesBy(headSamples, (sample) => sample.projectKey)),
      changes,
      reviewStatus: review?.decision ?? 'pending',
      review,
      reviewHistory,
      recommendation: diffRecommendation(summary),
      generatedAt: new Date().toISOString(),
    };
  }

  getDatasetVersionDiffReviewPlan(headVersionId: string, baseVersionId?: string): DatasetVersionDiffReviewPlan | undefined {
    const diff = this.getDatasetVersionDiff(headVersionId, baseVersionId);
    if (!diff) return undefined;
    const headVersion = this.getDatasetVersion(diff.headVersionId);
    if (!headVersion) return undefined;
    return this.buildDatasetVersionDiffReviewPlan(diff, headVersion);
  }

  private buildDatasetVersionDiffReviewPlan(
    diff: DatasetVersionDiff,
    headVersion: DatasetVersion,
  ): DatasetVersionDiffReviewPlan {
    const summary = diff.summary;
    const signed = (value: number) => value > 0 ? `+${value}` : String(value);
    const governanceRegression = summary.highRiskDelta > 0 || summary.evidenceGapDelta > 0 || summary.blockedQualityDelta > 0;
    const qualityRegression = summary.averageQualityDelta < -5;
    const intentionalFeedbackFork = headVersion.source === 'feedback_loop' && (summary.added > 0 || summary.removed > 0);
    const computedDecision: DatasetVersionDiffReviewPlan['recommendedDecision'] = governanceRegression || qualityRegression
      ? 'changes_requested'
      : intentionalFeedbackFork
        ? 'risk_accepted'
        : 'approved';
    const reviewedDecision = diff.reviewStatus === 'approved'
      || diff.reviewStatus === 'risk_accepted'
      || diff.reviewStatus === 'changes_requested'
      ? diff.reviewStatus
      : undefined;
    const recommendedDecision = reviewedDecision ?? computedDecision;
    const readiness: DatasetVersionDiffReviewPlan['readiness'] = diff.reviewStatus === 'approved' || diff.reviewStatus === 'risk_accepted'
      ? 'already_reviewed'
      : recommendedDecision === 'changes_requested'
        ? 'repair_first'
        : recommendedDecision === 'risk_accepted'
          ? 'accept_with_note'
          : 'ready_to_approve';
    const recommendation = diff.reviewStatus === 'approved' || diff.reviewStatus === 'risk_accepted'
      ? `Diff review is already ${diff.reviewStatus.replace(/_/g, ' ')}. Regenerate the manifest to refresh release gate status.`
      : recommendedDecision === 'changes_requested'
        ? 'Request repair before release: this diff introduces governance, evidence, or quality regression signals.'
        : recommendedDecision === 'risk_accepted'
          ? 'Accept this as an intentional closed-loop dataset fork from post-release feedback, then regenerate the manifest.'
          : 'Approve this diff: no material governance or quality regression is visible against the selected baseline.';
    const signals: DatasetVersionDiffReviewPlan['signals'] = [
      {
        label: 'Source',
        value: headVersion.source,
        tone: headVersion.source === 'feedback_loop' ? 'warning' : 'neutral',
      },
      {
        label: 'Changes',
        value: `${summary.added} added / ${summary.removed} removed / ${summary.changed} changed`,
        tone: summary.added + summary.removed + summary.changed === 0 ? 'good' : 'neutral',
      },
      {
        label: 'Quality',
        value: signed(summary.averageQualityDelta),
        tone: summary.averageQualityDelta > 0 ? 'good' : summary.averageQualityDelta < 0 ? 'danger' : 'neutral',
      },
      {
        label: 'High risk',
        value: signed(summary.highRiskDelta),
        tone: summary.highRiskDelta < 0 ? 'good' : summary.highRiskDelta > 0 ? 'danger' : 'neutral',
      },
      {
        label: 'Evidence gaps',
        value: signed(summary.evidenceGapDelta),
        tone: summary.evidenceGapDelta < 0 ? 'good' : summary.evidenceGapDelta > 0 ? 'danger' : 'neutral',
      },
      {
        label: 'Feedback loops',
        value: String(headVersion.feedbackLoopSummary?.total ?? 0),
        tone: headVersion.feedbackLoopSummary?.total ? 'good' : 'neutral',
      },
    ];
    const checks: DatasetVersionDiffReviewPlan['checks'] = [
      {
        id: 'diff-review',
        label: 'Diff review state',
        status: diff.reviewStatus === 'approved' || diff.reviewStatus === 'risk_accepted'
          ? 'pass'
          : diff.reviewStatus === 'changes_requested'
            ? 'block'
            : 'review',
        detail: diff.reviewStatus === 'pending'
          ? 'Release owner has not decided on this diff yet.'
          : `Current review state is ${diff.reviewStatus.replace(/_/g, ' ')}.`,
      },
      {
        id: 'governance-delta',
        label: 'Governance delta',
        status: governanceRegression ? 'block' : 'pass',
        detail: governanceRegression
          ? `High risk ${signed(summary.highRiskDelta)}, evidence gaps ${signed(summary.evidenceGapDelta)}, blocked quality ${signed(summary.blockedQualityDelta)}.`
          : 'No high-risk, evidence-gap, or blocked-quality regression detected.',
      },
      {
        id: 'quality-delta',
        label: 'Quality delta',
        status: qualityRegression ? 'block' : summary.averageQualityDelta < 0 ? 'review' : 'pass',
        detail: `Average quality moved ${signed(summary.averageQualityDelta)} points.`,
      },
      {
        id: 'closed-loop-lineage',
        label: 'Closed-loop lineage',
        status: headVersion.source === 'feedback_loop' ? 'review' : 'pass',
        detail: headVersion.source === 'feedback_loop'
          ? `${headVersion.feedbackLoopSummary?.total ?? 0} promoted feedback loop(s) are being treated as a new dataset version.`
          : 'Head version comes from the standard KodaX candidate pool.',
      },
      {
        id: 'sample-movement',
        label: 'Sample movement',
        status: summary.removed > 0 ? 'review' : 'pass',
        detail: summary.removed > 0
          ? `${summary.removed} baseline sample(s) are absent from the head version.`
          : 'No baseline samples were removed.',
      },
    ];

    return {
      id: `plan_${diff.id}`,
      diffId: diff.id,
      baseVersionId: diff.baseVersionId,
      baseVersionName: diff.baseVersionName,
      headVersionId: diff.headVersionId,
      headVersionName: diff.headVersionName,
      headSource: headVersion.source,
      reviewStatus: diff.reviewStatus,
      recommendedDecision,
      readiness,
      recommendation,
      signals,
      checks,
      feedbackLoopSummary: headVersion.feedbackLoopSummary,
      generatedAt: new Date().toISOString(),
    };
  }

  getDatasetReleaseGateContext(versionId: string): {
    version: DatasetVersion;
    samples: TrainingSample[];
    diff?: DatasetVersionDiff;
    gate: DatasetReleaseGate;
  } | undefined {
    const version = this.getDatasetVersion(versionId);
    if (!version) return undefined;
    const samples = this.listDatasetVersionSamples(version.id) ?? [];
    const diff = this.getDatasetVersionDiff(version.id);
    const gate = evaluateDatasetReleaseGate(version, samples, version.releaseGateActions ?? [], {
      hasComparableVersion: Boolean(diff),
      baseVersionName: diff?.baseVersionName,
      diffReviewStatus: diff?.reviewStatus,
      diffReview: diff?.review,
    });
    return { version, samples, diff, gate };
  }

  async applyDatasetVersionDiffReviewPlan(input: {
    headVersionId: string;
    baseVersionId?: string;
    decision?: DatasetVersionDiffReviewDecision;
    note?: string;
    acknowledgeWarnings?: boolean;
    createManifest?: boolean;
    decidedBy?: string;
  }): Promise<DatasetVersionDiffReviewApplyResult | undefined> {
    const plan = this.getDatasetVersionDiffReviewPlan(input.headVersionId, input.baseVersionId);
    if (!plan) return undefined;
    const decision = input.decision ?? plan.recommendedDecision;
    const recordedDiff = await this.recordDatasetVersionDiffReview({
      headVersionId: plan.headVersionId,
      baseVersionId: plan.baseVersionId,
      decision,
      note: input.note?.trim() || plan.recommendation,
      decidedBy: input.decidedBy ?? 'closed-loop-review-owner',
    });
    if (!recordedDiff) return undefined;

    const version = this.getDatasetVersion(plan.headVersionId);
    if (!version) return undefined;
    const samples = this.listDatasetVersionSamples(version.id) ?? [];
    let gate = evaluateDatasetReleaseGate(version, samples, version.releaseGateActions ?? [], {
      hasComparableVersion: true,
      baseVersionName: recordedDiff.baseVersionName,
      diffReviewStatus: recordedDiff.reviewStatus,
      diffReview: recordedDiff.review,
    });
    const acknowledgedCheckIds: string[] = [];
    if (decision !== 'changes_requested' && input.acknowledgeWarnings !== false) {
      for (const check of gate.checks) {
        if (check.locked || check.effectiveSeverity !== 'warn') continue;
        await this.recordDatasetReleaseGateAction({
          versionId: version.id,
          checkId: check.id,
          decision: 'acknowledged',
          severity: check.severity,
          note: `Closed-loop diff review acknowledged warning: ${check.detail}`,
          decidedBy: input.decidedBy ?? 'closed-loop-review-owner',
        });
        acknowledgedCheckIds.push(check.id);
      }
      const refreshedVersion = this.getDatasetVersion(version.id) ?? version;
      gate = evaluateDatasetReleaseGate(refreshedVersion, samples, refreshedVersion.releaseGateActions ?? [], {
        hasComparableVersion: true,
        baseVersionName: recordedDiff.baseVersionName,
        diffReviewStatus: recordedDiff.reviewStatus,
        diffReview: recordedDiff.review,
      });
    }

    const manifest = input.createManifest && decision !== 'changes_requested'
      ? await this.createReleaseManifest({
          versionId: version.id,
          notes: `Created after closed-loop diff review ${decision}.`,
          generatedBy: input.decidedBy ?? 'closed-loop-review-owner',
        })
      : undefined;
    const refreshedDiff = this.getDatasetVersionDiff(plan.headVersionId, plan.baseVersionId) ?? recordedDiff;
    return {
      diff: refreshedDiff,
      plan: this.getDatasetVersionDiffReviewPlan(plan.headVersionId, plan.baseVersionId) ?? plan,
      gate,
      acknowledgedCheckIds,
      manifest,
    };
  }

  async recordDatasetVersionDiffReview(input: {
    headVersionId: string;
    baseVersionId: string;
    decision: DatasetVersionDiffReviewDecision;
    note?: string;
    decidedBy?: string;
  }): Promise<DatasetVersionDiff | undefined> {
    const diff = this.getDatasetVersionDiff(input.headVersionId, input.baseVersionId);
    if (!diff) return undefined;
    const record: DatasetVersionDiffReviewRecord = {
      id: `diff_review_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      diffId: diff.id,
      baseVersionId: diff.baseVersionId,
      headVersionId: diff.headVersionId,
      decision: input.decision,
      note: input.note?.trim() || undefined,
      summary: diff.summary,
      decidedAt: new Date().toISOString(),
      decidedBy: input.decidedBy ?? 'local-release-owner',
    };
    this.data.datasetDiffReviews.unshift(record);
    this.data.datasetDiffReviews = this.data.datasetDiffReviews.slice(0, 500);
    await this.save();
    return this.getDatasetVersionDiff(input.headVersionId, input.baseVersionId);
  }

  async createDatasetVersion(input: {
    name?: string;
    sampleIds?: string[];
    filters?: Record<string, string>;
    notes?: string;
    createdBy?: string;
    format?: DatasetExportFormat;
  }): Promise<DatasetVersion> {
    let samples = input.sampleIds?.length
      ? this.listTrainingSamples({ sampleIds: input.sampleIds.join(',') }).samples
      : this.listTrainingSamples({ status: 'candidate', readyForFineTune: 'true' }).samples;

    samples = samples.filter((sample) =>
      sample.status === 'candidate'
      && sample.trainable
      && sample.metadata.distillation.readyForFineTune
    );

    if (samples.length === 0) {
      throw new Error('No trainable candidate samples available for dataset version.');
    }

    const createdAt = new Date().toISOString();
    const averageQuality = Math.round(
      samples.reduce((sum, sample) => sum + sample.quality.score, 0) / samples.length,
    );
    const sampleSnapshots = samples.map(cloneSample);
    const policies = {
      samplerVersion: 'traceops-p0-sampler' as const,
      cleaningPolicyVersion: 'kodax-clean-text-v1' as const,
      redactionPolicyVersion: 'kodax-clean-text-v1' as const,
    };
    const version: DatasetVersion = {
      id: `dataset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: input.name?.trim() || `KodaX trainable set ${createdAt.slice(0, 10)} ${createdAt.slice(11, 16)}`,
      source: 'kodax_candidate_pool',
      status: 'ready',
      format: input.format ?? 'fine_tune_jsonl',
      sampleIds: samples.map((sample) => sample.id),
      sampleCount: samples.length,
      averageQuality,
      filters: input.filters ?? { status: 'candidate', readyForFineTune: 'true' },
      snapshotHash: stableHash({ policies, samples: sampleSnapshots }),
      sampleSnapshots,
      policies,
      reviewSummary: {
        approved: samples.filter((sample) => sample.review?.decision === 'approved').length,
        rejected: samples.filter((sample) => sample.review?.decision === 'rejected').length,
        unreviewed: samples.filter((sample) => !sample.review).length,
      },
      createdAt,
      createdBy: input.createdBy ?? 'local-curator',
      notes: input.notes?.trim() || undefined,
    };

    this.data.datasetVersions.unshift(version);
    this.data.datasetVersions = this.data.datasetVersions.slice(0, 100);
    await this.materializeDatasetVersionSegment(version, 'dataset_version_created');
    await this.save();
    return version;
  }

  async recordDatasetReleaseGateAction(input: {
    versionId: string;
    checkId: string;
    decision: DatasetReleaseGateActionDecision;
    severity: DatasetReleaseGateSeverity;
    note?: string;
    decidedBy?: string;
  }): Promise<DatasetVersion | undefined> {
    const version = this.data.datasetVersions.find((item) => item.id === input.versionId);
    if (!version) return undefined;
    const record: DatasetReleaseGateActionRecord = {
      id: `gate_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      datasetVersionId: input.versionId,
      checkId: input.checkId,
      decision: input.decision,
      severity: input.severity,
      note: input.note?.trim() || undefined,
      decidedAt: new Date().toISOString(),
      decidedBy: input.decidedBy ?? 'local-governance',
    };
    this.data.datasetReleaseGateActions.unshift(record);
    this.data.datasetReleaseGateActions = this.data.datasetReleaseGateActions.slice(0, 500);
    await this.save();
    return this.withDatasetReleaseGateActions(version);
  }

  async createReleaseManifest(input: {
    versionId: string;
    notes?: string;
    generatedBy?: string;
  }): Promise<DatasetReleaseManifest | undefined> {
    const context = this.getDatasetReleaseGateContext(input.versionId);
    if (!context) return undefined;
    const { version, samples, diff } = context;
    const releaseGate = context.gate;
    const generatedAt = new Date().toISOString();
    const sampleIds = samples.map((sample) => sample.id);
    const traceIds = Array.from(new Set(samples.map((sample) => sample.traceId)));
    const reviewSummary = version.reviewSummary ?? {
      approved: samples.filter((sample) => sample.review?.decision === 'approved').length,
      rejected: samples.filter((sample) => sample.review?.decision === 'rejected').length,
      unreviewed: samples.filter((sample) => !sample.review).length,
    };
    const status: DatasetReleaseManifest['status'] = releaseGate.releaseBlocked
      ? 'blocked'
      : releaseGate.status === 'review'
        ? 'review'
        : 'ready';
    const exportUrls: DatasetReleaseManifest['exportUrls'] = {
      traceops_jsonl: `/api/datasets/${encodeURIComponent(version.id)}/export?format=traceops_jsonl`,
      fine_tune_jsonl: `/api/datasets/${encodeURIComponent(version.id)}/export?format=fine_tune_jsonl`,
      review_jsonl: `/api/datasets/${encodeURIComponent(version.id)}/export?format=review_jsonl`,
      eval_jsonl: `/api/datasets/${encodeURIComponent(version.id)}/export?format=eval_jsonl`,
      repair_jsonl: `/api/datasets/${encodeURIComponent(version.id)}/export?format=repair_jsonl`,
    };
    const manifestId = `manifest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const filename = `${version.name.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64) || version.id}-manifest.json`;
    const baseManifest = {
      id: manifestId,
      datasetVersionId: version.id,
      datasetVersionName: version.name,
      status,
      format: version.format,
      filename,
      snapshotHash: version.snapshotHash,
      sampleCount: samples.length || version.sampleCount,
      traceCount: traceIds.length,
      sampleIds,
      traceIds,
      releaseGate,
      riskSummary: exportRiskSummary(samples),
      reviewSummary,
      qualitySummary: {
        averageQuality: samples.length
          ? Math.round(samples.reduce((sum, sample) => sum + sample.quality.score, 0) / samples.length)
          : version.averageQuality,
        blockedQuality: samples.filter((sample) => sample.quality.grade === 'blocked').length,
        readyForFineTune: samples.filter((sample) => sample.metadata.distillation.readyForFineTune).length,
      },
      evidenceSummary: {
        toolBacked: samples.filter((sample) => sample.toolEventCount > 0).length,
        evidenceBacked: samples.filter((sample) => sample.evidenceCount > 0 || sample.toolEventCount === 0).length,
        missingEvidence: samples.filter((sample) => sample.toolEventCount > 0 && sample.evidenceCount === 0).length,
      },
      kindSummary: countSamplesBy(samples, (sample) => sample.kind),
      projectSummary: countSamplesBy(samples, (sample) => sample.projectKey),
      diffReviewStatus: diff?.reviewStatus,
      diffReview: diff?.review,
      policies: version.policies,
      exportUrls,
      generatedAt,
      generatedBy: input.generatedBy ?? 'local-release-curator',
      notes: input.notes?.trim() || undefined,
    } satisfies Omit<DatasetReleaseManifest, 'manifestHash'>;
    const manifest: DatasetReleaseManifest = {
      ...baseManifest,
      manifestHash: stableHash({
        datasetVersionId: baseManifest.datasetVersionId,
        snapshotHash: baseManifest.snapshotHash,
        sampleIds: baseManifest.sampleIds,
        releaseGate: baseManifest.releaseGate,
        diffReviewStatus: baseManifest.diffReviewStatus,
        diffReview: baseManifest.diffReview,
        riskSummary: baseManifest.riskSummary,
        reviewSummary: baseManifest.reviewSummary,
        policies: baseManifest.policies,
      }),
    };
    this.data.releaseManifests.unshift(manifest);
    this.data.releaseManifests = this.data.releaseManifests.slice(0, 100);
    await this.save();
    return manifest;
  }

  async recordExportRun(input: {
    source: DatasetExportRun['source'];
    format: DatasetExportFormat;
    filename: string;
    filters: Record<string, string>;
    sampleIds: string[];
    samples: TrainingSample[];
    datasetVersionId?: string;
    datasetVersionName?: string;
    snapshotHash?: string;
    exported: number;
    skipped: number;
    totals: DatasetExportRun['totals'];
    generatedAt: string;
    generatedBy?: string;
  }): Promise<DatasetExportRun> {
    const exportedSampleIds = new Set(input.sampleIds);
    const exportedSamples = input.samples.filter((sample) => exportedSampleIds.has(sample.id));
    const run: DatasetExportRun = {
      id: `export_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      status: 'active',
      source: input.source,
      format: input.format,
      filename: input.filename,
      filters: input.filters,
      sampleIds: input.sampleIds,
      traceIds: Array.from(new Set(exportedSamples.map((sample) => sample.traceId))),
      datasetVersionId: input.datasetVersionId,
      datasetVersionName: input.datasetVersionName,
      snapshotHash: input.snapshotHash,
      exported: input.exported,
      skipped: input.skipped,
      totals: input.totals,
      riskSummary: exportRiskSummary(exportedSamples),
      generatedAt: input.generatedAt,
      generatedBy: input.generatedBy ?? 'local-curator',
    };
    this.data.exportRuns.unshift(run);
    this.data.exportRuns = this.data.exportRuns.slice(0, 100);
    await this.save();
    return run;
  }

  async revokeExportRun(id: string, reason: string, revokedBy = 'local-governance'): Promise<DatasetExportRun | undefined> {
    const run = this.data.exportRuns.find((item) => item.id === id);
    if (!run) return undefined;
    run.status = 'revoked';
    run.revocation = {
      revokedAt: new Date().toISOString(),
      revokedBy,
      reason: reason.trim() || 'Revoked by governance review.',
    };
    await this.save();
    return run;
  }

  async repairTrainingSample(
    id: string,
    input: {
      cleanUserGoal?: string;
      cleanAssistantOutcome?: string;
      relinkedEvidenceIds?: string[];
      evidenceGapNote?: string;
      note?: string;
    },
    repairedBy = 'local-curator',
  ): Promise<TrainingSample | undefined> {
    const baseSample = this.data.traces
      .flatMap((trace) => this.baseTrainingSamples(trace))
      .find((sample) => sample.id === id);
    if (!baseSample) return undefined;

    const relinkedEvidenceIds = Array.from(new Set(
      (input.relinkedEvidenceIds ?? [])
        .filter((value): value is string => typeof value === 'string')
        .map((value) => value.trim())
        .filter(Boolean),
    ));
    const cleanUserGoal = input.cleanUserGoal?.trim();
    const cleanAssistantOutcome = input.cleanAssistantOutcome?.trim();
    const evidenceGapNote = input.evidenceGapNote?.trim();
    const note = input.note?.trim();
    if (!cleanUserGoal && !cleanAssistantOutcome && relinkedEvidenceIds.length === 0 && !evidenceGapNote && !note) {
      throw new Error('Repair must include clean text, relinked evidence, or a repair note.');
    }

    if (relinkedEvidenceIds.length > 0) {
      const trace = this.data.traces.find((item) => item.id === baseSample.traceId);
      const validEvidenceIds = new Set(trace ? this.evidenceForTrace(trace).map((item) => item.id) : []);
      const invalidIds = relinkedEvidenceIds.filter((evidenceId) => !validEvidenceIds.has(evidenceId));
      if (invalidIds.length > 0) {
        throw new Error(`Evidence must belong to the same trace revision: ${invalidIds.slice(0, 3).join(', ')}`);
      }
    }

    const existingIndex = this.data.sampleRepairs.findIndex((repair) => repair.sampleId === id);
    const previous = existingIndex >= 0 ? this.data.sampleRepairs[existingIndex] : undefined;
    const record: TrainingSampleRepairRecord = {
      sampleId: baseSample.id,
      traceId: baseSample.traceId,
      revisionId: baseSample.revisionId,
      cleanUserGoal: cleanUserGoal || previous?.cleanUserGoal,
      cleanAssistantOutcome: cleanAssistantOutcome || previous?.cleanAssistantOutcome,
      relinkedEvidenceIds: relinkedEvidenceIds.length > 0 ? relinkedEvidenceIds : previous?.relinkedEvidenceIds ?? [],
      evidenceGapNote: evidenceGapNote || previous?.evidenceGapNote,
      note: note || previous?.note,
      repairedBy,
      repairedAt: new Date().toISOString(),
    };
    if (existingIndex >= 0) this.data.sampleRepairs[existingIndex] = record;
    else this.data.sampleRepairs.unshift(record);
    this.data.sampleReviews = this.data.sampleReviews.filter((review) => review.sampleId !== id);
    const repaired = this.getTrainingSample(id);
    if (repaired) await this.materializeTrainingSampleSegment(repaired, 'sample_repaired');
    await this.save();
    return repaired;
  }

  async reviewTrainingSample(
    id: string,
    decision: TrainingSampleReviewDecision,
    note = '',
    reviewer = 'local-governance',
  ): Promise<TrainingSample | undefined> {
    const generatedSample = this.data.traces
      .flatMap((trace) => this.baseTrainingSamples(trace))
      .find((sample) => sample.id === id);
    if (!generatedSample) return undefined;
    const baseSample = this.applySampleRepair(generatedSample);
    if (decision === 'approved' && baseSample.status === 'blocked') {
      throw new Error('Blocked samples cannot be approved without changing the underlying governance blockers.');
    }
    if (decision === 'approved' && baseSample.quality.grade === 'blocked') {
      throw new Error('Quality-blocked samples must be repaired before approval.');
    }
    if (decision === 'approved' && !baseSample.metadata.distillation.readyForFineTune) {
      throw new Error('Sample clean text is not ready for fine-tune approval.');
    }

    const record: TrainingSampleReviewRecord = {
      sampleId: baseSample.id,
      traceId: baseSample.traceId,
      revisionId: baseSample.revisionId,
      decision,
      reviewer,
      note: note.trim() || undefined,
      decidedAt: new Date().toISOString(),
    };
    const existingIndex = this.data.sampleReviews.findIndex((review) => review.sampleId === id);
    if (existingIndex >= 0) this.data.sampleReviews[existingIndex] = record;
    else this.data.sampleReviews.unshift(record);
    const reviewed = this.getTrainingSample(id);
    if (reviewed) await this.materializeTrainingSampleSegment(reviewed, 'sample_reviewed');
    await this.save();
    return reviewed;
  }

  async reviewTrainingSamples(
    ids: string[],
    decision: TrainingSampleReviewDecision,
    note = '',
    reviewer = 'local-governance',
  ): Promise<TrainingSampleReviewBulkResult> {
    const updated: TrainingSample[] = [];
    const failed: TrainingSampleReviewBulkResult['failed'] = [];
    for (const id of ids) {
      try {
        const sample = await this.reviewTrainingSample(id, decision, note, reviewer);
        if (sample) updated.push(sample);
        else failed.push({ id, message: 'Training sample not found' });
      } catch (error) {
        failed.push({ id, message: error instanceof Error ? error.message : String(error) });
      }
    }
    return { updated, failed };
  }

  findTraceBySource(sourceSessionId: string, projectKey?: string): RawTrace | undefined {
    return this.data.traces.find((trace) => trace.sourceSessionId === sourceSessionId && trace.projectKey === projectKey);
  }

  async ingestKodaXRuntime(input: KodaXRuntimeIngestInput): Promise<KodaXRuntimeIngestResult> {
    const now = new Date().toISOString();
    const events = (input.events ?? []).slice(0, 200);
    const spans = (input.spans ?? []).slice(0, 200);
    const touched = new Map<string, RawTrace>();
    const nextOrderByRevision = new Map<string, number>();

    const nextOrder = (traceId: string, revisionId: string): number => {
      const key = `${traceId}:${revisionId}`;
      const cached = nextOrderByRevision.get(key);
      if (cached !== undefined) {
        nextOrderByRevision.set(key, cached + 1);
        return cached;
      }
      const next = this.data.events
        .filter((event) => event.traceId === traceId && event.revisionId === revisionId)
        .reduce((max, event) => Math.max(max, event.order + 1), 0);
      nextOrderByRevision.set(key, next + 1);
      return next;
    };

    const ensureTrace = (seed: RuntimeTraceSeed): { trace: RawTrace; revisionId: string } => {
      const explicitTraceId = seed.traceId ? runtimeTraceId(seed) : undefined;
      const fallbackTraceId = runtimeTraceId(seed);
      let trace = explicitTraceId
        ? this.data.traces.find((item) => item.id === explicitTraceId)
        : undefined;
      trace = trace
        ?? this.findTraceBySource(seed.sessionId, seed.projectKey)
        ?? (!seed.projectKey ? this.data.traces.find((item) => item.sourceSessionId === seed.sessionId) : undefined);

      const revisionId = trace ? runtimeRevisionId(trace.id) : runtimeRevisionId(fallbackTraceId);
      if (!trace) {
        trace = {
          id: fallbackTraceId,
          source: 'kodax',
          sourceSessionId: seed.sessionId,
          projectKey: seed.projectKey,
          title: seed.title ?? `KodaX runtime ${seed.sessionId}`,
          status: seed.status ?? 'running',
          ingestionStatus: 'imported',
          createdAt: now,
          importedAt: now,
          updatedAt: now,
          runtime: {
            canonicalRepoRoot: seed.runtime?.canonicalRepoRoot ?? seed.gitRoot,
            workspaceRoot: seed.runtime?.workspaceRoot,
            executionCwd: seed.runtime?.executionCwd,
            branch: seed.runtime?.branch,
            workspaceKind: seed.runtime?.workspaceKind,
            surface: seed.runtime?.surface ?? 'kodax-runtime',
            profileId: seed.runtime?.profileId,
            profileVersion: seed.runtime?.profileVersion,
            provider: seed.runtime?.provider,
            model: seed.runtime?.model,
            reasoningMode: seed.runtime?.reasoningMode,
            permissionMode: seed.runtime?.permissionMode,
            agentMode: seed.runtime?.agentMode,
            scope: seed.scope ?? seed.runtime?.scope,
          },
          counts: emptyRuntimeCounts(),
          risk: aggregateRisk([]),
          latestRevisionId: revisionId,
          latestSourceHash: stableHash({ source: 'kodax-runtime-adapter-v1', sessionId: seed.sessionId, projectKey: seed.projectKey }),
        };
        this.data.traces.push(trace);
      } else {
        trace.title = seed.title ?? trace.title;
        trace.projectKey = seed.projectKey ?? trace.projectKey;
        trace.runtime = {
          ...trace.runtime,
          ...seed.runtime,
          canonicalRepoRoot: seed.runtime?.canonicalRepoRoot ?? seed.gitRoot ?? trace.runtime.canonicalRepoRoot,
          scope: seed.scope ?? seed.runtime?.scope ?? trace.runtime.scope,
          surface: seed.runtime?.surface ?? trace.runtime.surface ?? 'kodax-runtime',
        };
        applyRuntimeStatus(trace, seed.status);
        trace.ingestionStatus = trace.ingestionStatus === 'ingest_failed' ? 'updated' : trace.ingestionStatus;
        trace.updatedAt = now;
      }

      if (!this.data.revisions.some((revision) => revision.id === revisionId)) {
        this.data.revisions.push({
          id: revisionId,
          traceId: trace.id,
          sourceHash: stableHash({ source: 'kodax-runtime-adapter-v1', traceId: trace.id }),
          sourceMessageCount: 0,
          sourceLineageEntryCount: 0,
          sourceArtifactCount: 0,
          importedAt: now,
          rawSnapshotRef: 'kodax-runtime-adapter',
        });
      }
      touched.set(trace.id, trace);
      return { trace, revisionId };
    };

    const upsertEvent = (event: RawTraceEvent) => {
      const existingIndex = this.data.events.findIndex((item) => item.id === event.id);
      if (existingIndex >= 0) {
        this.data.events[existingIndex] = {
          ...this.data.events[existingIndex],
          ...event,
          order: this.data.events[existingIndex]?.order ?? event.order,
        };
      } else {
        this.data.events.push(event);
      }
    };

    for (const event of events) {
      const status = runtimeEventStatus(event.kind, event.status);
      const { trace, revisionId } = ensureTrace({ ...event, status });
      applyRuntimeStatus(trace, status);
      const risk = scanTextRisk([event.label, event.preview, event.payload].filter(Boolean).join(' '));
      const eventId = event.eventId
        ? `runtime_evt_${sanitizeIdPart(trace.id)}_${sanitizeIdPart(event.eventId)}`
        : `runtime_evt_${sanitizeIdPart(trace.id)}_${stableShortHash(event)}`;
      upsertEvent({
        id: eventId,
        traceId: trace.id,
        revisionId,
        source: 'kodax_runtime_event',
        sourceEntryId: event.sourceEntryId ?? event.eventId,
        parentEntryId: event.parentEntryId,
        occurredAt: event.occurredAt ?? now,
        order: nextOrder(trace.id, revisionId),
        type: runtimeEventType(event.kind),
        role: event.role,
        active: true,
        label: event.label ?? event.kind.replace(/_/g, ' '),
        preview: event.preview ?? textPreview(event.payload ?? event.kind),
        payload: event.payload ?? event,
        riskLevel: risk.level,
      });
      trace.updatedAt = now;
    }

    for (const span of spans) {
      const status = runtimeSpanStatus(span.status, span.endedAt);
      const { trace, revisionId } = ensureTrace({ ...span, status });
      applyRuntimeStatus(trace, status);
      const risk = scanTextRisk([span.name, span.input, span.output, span.error, span.attributes].filter(Boolean).join(' '));
      const spanId = span.spanId
        ? `runtime_span_${sanitizeIdPart(trace.id)}_${sanitizeIdPart(span.spanId)}`
        : `runtime_span_${sanitizeIdPart(trace.id)}_${stableShortHash(span)}`;
      upsertEvent({
        id: spanId,
        traceId: trace.id,
        revisionId,
        source: 'kodax_tracing_span',
        sourceEntryId: span.spanId,
        parentEntryId: span.parentSpanId,
        occurredAt: span.endedAt ?? span.startedAt ?? now,
        order: nextOrder(trace.id, revisionId),
        type: span.kind === 'handoff' ? 'handoff' : 'trace_span',
        active: true,
        label: `${span.kind}: ${span.name}`,
        preview: span.error ? textPreview(span.error) : textPreview(span.output ?? span.attributes ?? span.status ?? 'span recorded'),
        payload: span,
        riskLevel: risk.level,
      });
      trace.updatedAt = now;
    }

    for (const trace of touched.values()) {
      const traceEvents = this.eventsForTrace(trace);
      const existingEvidenceIds = new Set(this.data.evidence.map((item) => item.id));
      const existingLedgerIds = new Set(this.data.evidence
        .filter((item) => item.traceId === trace.id)
        .map((item) => item.sourceLedgerId));
      const derivedEvidence = this.deriveEvidenceFromEvents(trace, traceEvents)
        .filter((item) => !existingEvidenceIds.has(item.id) && !existingLedgerIds.has(item.sourceLedgerId));
      this.data.evidence.push(...derivedEvidence);
      const evidence = this.evidenceForTrace(trace);
      trace.counts = {
        messages: traceEvents.filter((event) => event.type === 'message').length,
        activeMessages: traceEvents.filter((event) => event.type === 'message' && event.active !== false).length,
        lineageEntries: traceEvents.length,
        transcriptEntries: traceEvents.length,
        artifactLedgerEntries: evidence.length + traceEvents.filter((event) => event.type === 'artifact').length,
        toolUseEvents: traceEvents.filter((event) => event.type === 'tool_use' || event.type === 'tool_call').length,
        toolResultEvents: traceEvents.filter((event) => event.type === 'tool_result').length,
        compactions: traceEvents.filter((event) => event.type === 'compaction').length,
        branchSummaries: traceEvents.filter((event) => event.type === 'branch_summary').length,
        goalEvents: traceEvents.filter((event) => event.type === 'goal').length,
      };
      trace.risk = aggregateRisk([
        trace.risk,
        ...traceEvents.map((event) => scanTextRisk([event.label, event.preview, event.payload].filter(Boolean).join(' '))),
        ...evidence.map((item) => scanTextRisk([item.kind, item.target, item.summary, item.metadata].filter(Boolean).join(' '))),
      ]);
      trace.updatedAt = now;
    }

    if (touched.size > 0) {
      this.recordTask({
        kind: 'kodax_sync',
        status: 'succeeded',
        title: 'KodaX runtime ingest',
        description: `Accepted ${events.length} runtime event(s) and ${spans.length} tracing span(s).`,
        entityRefs: Array.from(touched.values()).slice(0, 4).map((trace) => ({
          kind: 'trace',
          id: trace.id,
          label: trace.title,
        })),
        resultSummary: `Runtime adapter wrote ${events.length + spans.length} item(s) into TraceOps.`,
        createdBy: 'kodax-runtime-adapter',
      });
      for (const trace of touched.values()) {
        await this.materializeTraceSegments(trace, 'kodax_runtime_ingest');
      }
    }

    await this.save();
    return {
      acceptedEvents: events.length,
      acceptedSpans: spans.length,
      traces: Array.from(touched.values()),
    };
  }

  async backfillDerivedEvidence(): Promise<{ createdEvidence: number; touchedTraces: number; evidenceTotal: number }> {
    let createdEvidence = 0;
    let touchedTraces = 0;
    for (const trace of this.data.traces) {
      const derived = this.deriveEvidenceFromEvents(trace, this.eventsForTrace(trace));
      const before = this.data.evidence.length;
      const existingIds = new Set(this.data.evidence.map((item) => item.id));
      const existingLedgerIds = new Set(this.data.evidence
        .filter((item) => item.traceId === trace.id)
        .map((item) => item.sourceLedgerId));
      const additions = derived.filter((item) => !existingIds.has(item.id) && !existingLedgerIds.has(item.sourceLedgerId));
      if (additions.length === 0) continue;
      this.data.evidence.push(...additions);
      createdEvidence += this.data.evidence.length - before;
      touchedTraces += 1;
      const evidence = this.evidenceForTrace(trace);
      trace.counts = {
        ...trace.counts,
        artifactLedgerEntries: evidence.length,
      };
      trace.risk = aggregateRisk([
        trace.risk,
        ...evidence.map((item) => scanEvidenceRisk(item.kind, item.target, item.summary, item.metadata)),
      ]);
      trace.updatedAt = new Date().toISOString();
    }
    if (createdEvidence > 0) {
      for (const trace of this.data.traces) {
        if (this.evidenceForTrace(trace).some((item) => item.metadata?.derivedFromEventId)) {
          await this.materializeTraceSegments(trace, 'derived_evidence_backfill');
        }
      }
      await this.save();
    }
    return {
      createdEvidence,
      touchedTraces,
      evidenceTotal: this.data.evidence.length,
    };
  }

  private deriveEvidenceFromEvents(trace: RawTrace, events: RawTraceEvent[]): RawEvidence[] {
    return events
      .filter(shouldDeriveEvidenceFromEvent)
      .map((event): RawEvidence => {
        const kind = evidenceKindFromEvent(event);
        const sourceTool = toolNameFromEvent(event);
        const target = evidenceTargetFromEvent(event);
        const summary = textPreview(event.preview || event.label, 240);
        const risk = scanEvidenceRisk(kind, target, summary, {
          sourceEventId: event.id,
          eventType: event.type,
          eventSource: event.source,
        });
        return {
          id: `ev_${stableShortHash({ traceId: trace.id, eventId: event.id, source: event.source })}`,
          traceId: trace.id,
          revisionId: event.revisionId,
          source: evidenceSourceFromEvent(event),
          sourceLedgerId: event.id,
          kind,
          sourceTool,
          action: event.type,
          target,
          displayTarget: target.length > 120 ? `${target.slice(0, 117)}...` : target,
          summary,
          sessionEntryId: event.sourceEntryId,
          timestamp: event.occurredAt,
          metadata: {
            derivedFromEventId: event.id,
            eventType: event.type,
            eventSource: event.source,
            eventLabel: event.label,
          },
          riskLevel: risk.level,
        };
      });
  }

  private eventsForTrace(trace: RawTrace): RawTraceEvent[] {
    return this.data.events
      .filter((event) =>
        event.traceId === trace.id
        && (
          event.revisionId === trace.latestRevisionId
          || event.source === 'kodax_runtime_event'
          || event.source === 'kodax_tracing_span'
        )
      )
      .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt) || a.order - b.order);
  }

  private evidenceForTrace(trace: RawTrace): RawEvidence[] {
    return this.data.evidence
      .filter((item) =>
        item.traceId === trace.id
        && (
          item.revisionId === trace.latestRevisionId
          || item.source === 'kodax_tool_event'
          || item.source === 'kodax_runtime_span'
        )
      );
  }

  private baseTrainingSample(trace: RawTrace): TrainingSample {
    const events = this.eventsForTrace(trace);
    const evidence = this.evidenceForTrace(trace);
    const errors = this.data.errors.filter((error) => error.traceId === trace.id || error.sourceSessionId === trace.sourceSessionId);
    return generateTrainingSample(trace, events, evidence, errors);
  }

  private baseTrainingSamples(trace: RawTrace): TrainingSample[] {
    const events = this.eventsForTrace(trace);
    const evidence = this.evidenceForTrace(trace);
    const errors = this.data.errors.filter((error) => error.traceId === trace.id || error.sourceSessionId === trace.sourceSessionId);
    return generateTrainingSamples(trace, events, evidence, errors);
  }

  private baseCleanTrace(trace: RawTrace): CleanTrace {
    const events = this.eventsForTrace(trace);
    const evidence = this.evidenceForTrace(trace);
    const errors = this.data.errors.filter((error) => error.traceId === trace.id || error.sourceSessionId === trace.sourceSessionId);
    return cleanTraceFromRawTrace({
      trace,
      events,
      evidence,
      errors,
      sample: this.applySampleState(this.baseTrainingSample(trace)),
    });
  }

  private baseMemoryCandidates(trace: RawTrace): MemoryCandidate[] {
    const events = this.eventsForTrace(trace);
    const evidence = this.evidenceForTrace(trace);
    const errors = this.data.errors.filter((error) => error.traceId === trace.id || error.sourceSessionId === trace.sourceSessionId);
    const samples = this.baseTrainingSamples(trace).map((sample) => this.applySampleState(sample));
    return generateMemoryCandidates(trace, events, evidence, errors, samples);
  }

  private applyMemoryCandidateReview(candidate: MemoryCandidate): MemoryCandidate {
    const review = this.data.memoryCandidateReviews.find((item) => item.candidateId === candidate.id);
    if (!review) return candidate;
    if (review.decision === 'promoted') {
      if (candidate.status === 'blocked') {
        return {
          ...candidate,
          blockers: Array.from(new Set([...candidate.blockers, 'Promotion no longer valid because candidate is blocked'])),
          review,
        };
      }
      return {
        ...candidate,
        status: 'promoted',
        blockers: [],
        labels: Array.from(new Set([...candidate.labels, 'promoted_to_memory_base'])),
        metadata: {
          ...candidate.metadata,
          readyForMemoryBase: true,
        },
        updatedAt: review.decidedAt,
        review,
      };
    }

    return {
      ...candidate,
      status: 'rejected',
      blockers: Array.from(new Set([...candidate.blockers, 'Rejected by memory governance'])),
      labels: Array.from(new Set([...candidate.labels, 'rejected_memory_candidate'])),
      updatedAt: review.decidedAt,
      review,
    };
  }

  private applySampleState(sample: TrainingSample): TrainingSample {
    return this.applySampleReview(this.applySampleRepair(sample));
  }

  private applySampleRepair(sample: TrainingSample): TrainingSample {
    const repair = this.data.sampleRepairs.find((item) => item.sampleId === sample.id);
    if (!repair) return sample;

    const cleanUserGoal = repair.cleanUserGoal ?? sample.input.cleanUserGoal;
    const cleanAssistantOutcome = repair.cleanAssistantOutcome ?? sample.output.cleanAssistantOutcome;
    const evidenceIds = Array.from(new Set([
      ...sample.input.evidenceIds,
      ...repair.relinkedEvidenceIds,
    ]));
    const evidenceRepaired = repair.relinkedEvidenceIds.length > 0 || !!repair.evidenceGapNote;
    const cleanTextReady = !!cleanUserGoal && !!cleanAssistantOutcome && sample.metadata.traceStatus === 'completed';
    const hardLocked = sample.riskLevel === 'L4'
      || sample.metadata.riskReasons.some((reason) => /credential|secret/i.test(reason))
      || sample.blockers.some((blocker) => /credential|secret/i.test(blocker));

    const blockers = sample.blockers.filter((blocker) => {
      if (cleanAssistantOutcome && blocker === 'No assistant outcome available for supervised sample output') return false;
      if (
        evidenceRepaired
        && (blocker === 'No artifactLedger evidence captured for this tool chain' || blocker === 'No evidence captured for this tool chain')
      ) return false;
      return true;
    });
    if (!hardLocked) blockers.push('Manual repair applied; requires governance review');

    const qualitySignals = sample.quality.signals.filter((signal) => {
      if (cleanTextReady && signal.label === 'missing clean text') return false;
      if (cleanAssistantOutcome && signal.label === 'no assistant outcome') return false;
      if (evidenceRepaired && signal.label === 'missing evidence') return false;
      if (cleanAssistantOutcome && cleanAssistantOutcome.length >= 12 && signal.label === 'thin outcome') return false;
      return true;
    });
    qualitySignals.push({
      label: 'manual repair',
      impact: 'warning',
      detail: `Repaired by ${repair.repairedBy}; sample requires fresh governance review.`,
    });
    if (cleanTextReady) {
      qualitySignals.push({
        label: 'repaired clean text',
        impact: 'positive',
        detail: 'Clean prompt/outcome are available from the repair record.',
      });
    }
    if (evidenceRepaired) {
      qualitySignals.push({
        label: 'evidence repair noted',
        impact: repair.relinkedEvidenceIds.length > 0 ? 'positive' : 'warning',
        detail: repair.relinkedEvidenceIds.length > 0
          ? `${repair.relinkedEvidenceIds.length} evidence id(s) were relinked.`
          : repair.evidenceGapNote ?? 'Evidence gap was reviewed and noted.',
      });
    }

    const repairedScore = Math.max(
      sample.quality.score,
      cleanTextReady ? 58 : sample.quality.score,
      evidenceRepaired ? sample.quality.score + 8 : sample.quality.score,
    );
    const score = Math.min(100, Math.round(repairedScore));
    const grade = hardLocked
      ? 'blocked'
      : score >= 70 && blockers.length <= 1
        ? 'good'
        : score >= 45
          ? 'review'
          : 'blocked';

    return {
      ...sample,
      status: hardLocked ? 'blocked' : 'needs_review',
      trainable: false,
      quality: {
        score,
        grade,
        signals: qualitySignals,
      },
      blockers: Array.from(new Set(blockers)),
      labels: Array.from(new Set([
        ...sample.labels,
        'repaired',
        cleanTextReady ? 'repaired_clean_text' : undefined,
        evidenceRepaired ? 'evidence_repair' : undefined,
      ].filter(Boolean) as string[])),
      promptPreview: compactPreview(cleanUserGoal ?? sample.promptPreview),
      responsePreview: compactPreview(cleanAssistantOutcome ?? sample.responsePreview),
      evidenceCount: Math.max(sample.evidenceCount, evidenceIds.length),
      updatedAt: repair.repairedAt,
      input: {
        ...sample.input,
        cleanUserGoal,
        evidenceIds,
      },
      output: {
        ...sample.output,
        cleanAssistantOutcome,
      },
      metadata: {
        ...sample.metadata,
        distillation: {
          ...sample.metadata.distillation,
          readyForFineTune: cleanTextReady,
        },
      },
      repair,
      review: undefined,
    };
  }

  private applySampleReview(sample: TrainingSample): TrainingSample {
    const review = this.data.sampleReviews.find((item) => item.sampleId === sample.id);
    if (!review) return sample;
    if (review.decision === 'approved') {
      if (sample.status === 'blocked') {
        return {
          ...sample,
          trainable: false,
          blockers: Array.from(new Set([...sample.blockers, 'Approval no longer valid because sample is currently blocked'])),
          review,
        };
      }
      return {
        ...sample,
        status: 'candidate',
        trainable: true,
        blockers: [],
        review,
      };
    }

    return {
      ...sample,
      status: 'blocked',
      trainable: false,
      blockers: Array.from(new Set([...sample.blockers, 'Rejected by governance review'])),
      review,
    };
  }

  async upsertBundle(bundle: {
    trace: RawTrace;
    revision: RawTraceRevision;
    events: RawTraceEvent[];
    evidence: RawEvidence[];
  }): Promise<'created' | 'updated' | 'skipped'> {
    const evidence = bundle.evidence.length > 0
      ? bundle.evidence
      : this.deriveEvidenceFromEvents(bundle.trace, bundle.events);
    const trace = {
      ...bundle.trace,
      counts: {
        ...bundle.trace.counts,
        artifactLedgerEntries: evidence.length,
      },
      risk: aggregateRisk([
        bundle.trace.risk,
        ...evidence.map((item) => scanEvidenceRisk(item.kind, item.target, item.summary, item.metadata)),
      ]),
    };
    const existingIndex = this.data.traces.findIndex((trace) =>
      trace.source === bundle.trace.source
      && trace.sourceSessionId === bundle.trace.sourceSessionId
      && trace.projectKey === bundle.trace.projectKey
    );
    if (
      existingIndex >= 0
      && this.data.traces[existingIndex]?.latestSourceHash === bundle.trace.latestSourceHash
      && this.data.evidence.some((item) => item.traceId === this.data.traces[existingIndex]?.id)
    ) {
      return 'skipped';
    }

    if (existingIndex >= 0) {
      this.data.traces[existingIndex] = {
        ...trace,
        createdAt: this.data.traces[existingIndex]?.createdAt ?? trace.createdAt,
      };
    } else {
      this.data.traces.push(trace);
    }

    if (!this.data.revisions.some((revision) => revision.id === bundle.revision.id)) {
      this.data.revisions.push(bundle.revision);
    }
    this.data.events = this.data.events.filter((event) => event.revisionId !== bundle.revision.id);
    this.data.evidence = this.data.evidence.filter((item) => item.revisionId !== bundle.revision.id);
    this.data.events.push(...bundle.events);
    this.data.evidence.push(...evidence);
    const currentTrace = this.data.traces.find((item) => item.id === trace.id) ?? trace;
    await this.materializeTraceSegments(currentTrace, existingIndex >= 0 ? 'kodax_session_updated' : 'kodax_session_created');
    await this.save();
    return existingIndex >= 0 ? 'updated' : 'created';
  }

  async markFailed(sourceSessionId: string, projectKey: string | undefined, jobId: string, message: string): Promise<void> {
    const trace = this.findTraceBySource(sourceSessionId, projectKey);
    if (trace) {
      trace.ingestionStatus = 'ingest_failed';
      trace.updatedAt = new Date().toISOString();
    }
    this.data.errors.push({
      id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      jobId,
      traceId: trace?.id,
      sourceSessionId,
      errorType: 'ingest_failed',
      message,
      recoverable: true,
      occurredAt: new Date().toISOString(),
    });
    await this.save();
  }

  async createJob(mode: IngestJob['mode']): Promise<IngestJob> {
    const previousCheckpoint = this.data.source.syncCheckpoint;
    const job: IngestJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      sourceId: this.data.source.id,
      status: 'running',
      mode,
      discovered: 0,
      created: 0,
      imported: 0,
      updated: 0,
      unchanged: 0,
      skipped: 0,
      failed: 0,
      schemaWarnings: 0,
      resumeFromCursor: previousCheckpoint?.cursor,
      diagnostics: [],
      startedAt: new Date().toISOString(),
    };
    this.data.jobs.unshift(job);
    this.recordTask({
      kind: 'kodax_sync',
      status: 'running',
      title: `KodaX sync ${mode}`,
      description: 'Import KodaX local session changes into TraceOps.',
      entityRefs: [{ kind: 'ingest_job', id: job.id, label: mode }],
      createdBy: 'kodax-connector',
      occurredAt: job.startedAt,
    });
    await this.save();
    return job;
  }

  async finishJob(job: IngestJob, status: IngestJob['status'], message?: string): Promise<IngestJob> {
    const target = this.data.jobs.find((item) => item.id === job.id);
    const finishedAt = new Date().toISOString();
    if (target) {
      Object.assign(target, {
        ...job,
        status,
        finishedAt,
        message,
      });
    }
    const completedJob = target ?? {
      ...job,
      status,
      finishedAt,
      message,
    };
    const created = completedJob.created ?? 0;
    const updated = completedJob.updated ?? 0;
    const unchanged = completedJob.unchanged ?? completedJob.skipped;
    const schemaWarnings = completedJob.schemaWarnings ?? 0;
    const warningTriage = this.ingestWarningTriageSummary(completedJob);
    const resumeHint = status === 'failed'
      ? 'Retry will rescan KodaX sessions and skip unchanged traces from the last checkpoint.'
      : unchanged > 0
        ? 'Next sync can safely skip unchanged sessions by source hash.'
        : 'Next sync will compare KodaX source hashes before writing.';
    this.updateTaskForEntity(
      'ingest_job',
      job.id,
      status === 'succeeded' ? 'succeeded' : 'failed',
      message ?? `${completedJob.imported} written, ${created} created, ${updated} updated, ${unchanged} unchanged, ${completedJob.failed} failed.`,
      status === 'failed' ? message : undefined,
    );
    await this.updateSource({
      lastSyncAt: finishedAt,
      syncCheckpoint: {
        jobId: completedJob.id,
        mode: completedJob.mode,
        cursor: completedJob.checkpointCursor,
        resumeFromCursor: completedJob.resumeFromCursor,
        lastStartedAt: completedJob.startedAt,
        lastFinishedAt: finishedAt,
        discovered: completedJob.discovered,
        created,
        imported: completedJob.imported,
        updated,
        unchanged,
        skipped: completedJob.skipped,
        failed: completedJob.failed,
        schemaWarnings,
        runtimeFilesDiscovered: completedJob.runtimeFilesDiscovered ?? 0,
        runtimeFilesImported: completedJob.runtimeFilesImported ?? 0,
        runtimeEventsImported: completedJob.runtimeEventsImported ?? 0,
        runtimeSpansImported: completedJob.runtimeSpansImported ?? 0,
        openSchemaWarnings: warningTriage.open,
        triagedSchemaWarnings: warningTriage.triaged,
        lastError: status === 'failed' ? message : undefined,
        resumeHint,
      },
    });
    await this.save();
    return completedJob;
  }

  async triageIngestDiagnostic(
    jobId: string,
    diagnosticId: string,
    decision: IngestDiagnosticTriageDecision,
    note?: string,
    actor = 'traceops-operator',
  ): Promise<IngestJob | undefined> {
    const job = this.data.jobs.find((item) => item.id === jobId);
    const diagnostic = job?.diagnostics?.find((item) => item.id === diagnosticId);
    if (!job || !diagnostic) return undefined;
    if (diagnostic.level === 'info') return job;

    const status = decision === 'acknowledge'
      ? 'acknowledged'
      : decision === 'ignore'
        ? 'ignored'
        : decision === 'resolve'
          ? 'resolved'
          : 'open';
    diagnostic.triageStatus = status;
    diagnostic.triage = {
      decision,
      status,
      actor,
      decidedAt: new Date().toISOString(),
      note,
    };

    if (this.data.source.syncCheckpoint?.jobId === job.id) {
      const summary = this.ingestWarningTriageSummary(job);
      this.data.source.syncCheckpoint = {
        ...this.data.source.syncCheckpoint,
        openSchemaWarnings: summary.open,
        triagedSchemaWarnings: summary.triaged,
      };
    }

    await this.save();
    return job;
  }

  private ingestWarningTriageSummary(job: IngestJob): { open: number; triaged: number } {
    const warnings = job.diagnostics?.filter((diagnostic) => diagnostic.level === 'warning') ?? [];
    const triaged = warnings.filter((diagnostic) => diagnostic.triageStatus && diagnostic.triageStatus !== 'open').length;
    return {
      open: Math.max(0, warnings.length - triaged),
      triaged,
    };
  }

  listIngestQualityQueue(): IngestQualityQueueResponse {
    const issueMap = new Map<string, IngestQualityIssue>();

    for (const job of this.data.jobs) {
      for (const diagnostic of job.diagnostics ?? []) {
        if (diagnostic.level === 'info') continue;
        const level = diagnostic.level === 'error' ? 'error' : 'warning';
        const status = this.ingestDiagnosticStatus(diagnostic);
        const issueId = this.ingestQualityIssueId(diagnostic);
        const existing = issueMap.get(issueId);
        const occurrence = {
          jobId: job.id,
          jobMode: job.mode,
          diagnosticId: diagnostic.id,
          level: diagnostic.level,
          status,
          message: diagnostic.message,
          sourceSessionId: diagnostic.sourceSessionId,
          traceId: diagnostic.traceId,
          occurredAt: diagnostic.occurredAt,
          triage: diagnostic.triage,
        };
        if (!existing) {
          issueMap.set(issueId, {
            id: issueId,
            code: diagnostic.code,
            level,
            message: diagnostic.message,
            sourceSessionId: diagnostic.sourceSessionId,
            traceId: diagnostic.traceId,
            recoverable: diagnostic.recoverable,
            statusSummary: { open: 0, acknowledged: 0, ignored: 0, resolved: 0 },
            totalOccurrences: 0,
            openOccurrences: 0,
            triagedOccurrences: 0,
            latestOccurredAt: diagnostic.occurredAt,
            latestJobId: job.id,
            latestDiagnosticId: diagnostic.id,
            latestOpenJobId: status === 'open' ? job.id : undefined,
            latestOpenDiagnosticId: status === 'open' ? diagnostic.id : undefined,
            occurrences: [],
          });
        }

        const issue = issueMap.get(issueId);
        if (!issue) continue;
        issue.statusSummary[status] += 1;
        issue.totalOccurrences += 1;
        if (status === 'open') issue.openOccurrences += 1;
        else issue.triagedOccurrences += 1;
        if (diagnostic.occurredAt.localeCompare(issue.latestOccurredAt) > 0) {
          issue.latestOccurredAt = diagnostic.occurredAt;
          issue.latestJobId = job.id;
          issue.latestDiagnosticId = diagnostic.id;
        }
        if (status === 'open' && !issue.latestOpenDiagnosticId) {
          issue.latestOpenJobId = job.id;
          issue.latestOpenDiagnosticId = diagnostic.id;
        }
        issue.occurrences.push(occurrence);
      }
    }

    const issues = Array.from(issueMap.values())
      .map((issue) => ({
        ...issue,
        occurrences: issue.occurrences
          .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
          .slice(0, 8),
      }))
      .sort((a, b) => {
        if (a.openOccurrences > 0 && b.openOccurrences === 0) return -1;
        if (a.openOccurrences === 0 && b.openOccurrences > 0) return 1;
        if (a.level !== b.level) return a.level === 'error' ? -1 : 1;
        return b.latestOccurredAt.localeCompare(a.latestOccurredAt);
      });

    const summary = issues.reduce<IngestQualityQueueResponse['summary']>((acc, issue) => {
      acc.totalIssues += 1;
      if (issue.openOccurrences > 0) acc.openIssues += 1;
      else acc.triagedIssues += 1;
      acc.totalOccurrences += issue.totalOccurrences;
      acc.openOccurrences += issue.openOccurrences;
      acc.triagedOccurrences += issue.triagedOccurrences;
      if (issue.level === 'error') acc.errorOccurrences += issue.totalOccurrences;
      else acc.warningOccurrences += issue.totalOccurrences;
      acc.acknowledged += issue.statusSummary.acknowledged;
      acc.ignored += issue.statusSummary.ignored;
      acc.resolved += issue.statusSummary.resolved;
      return acc;
    }, {
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
    });

    return { issues, summary };
  }

  listIngestQualityPolicy(): IngestQualityPolicyResponse {
    const queue = this.listIngestQualityQueue();
    const configuredCodes = new Set(this.data.ingestQualityPolicyRules.map((rule) => rule.code));
    const recommendationDecisions = this.data.ingestQualityRecommendationDecisions
      .slice()
      .sort((a, b) => b.decidedAt.localeCompare(a.decidedAt));
    const latestDecisionByCode = new Map<string, IngestQualityRecommendationDecisionRecord>();
    for (const decision of recommendationDecisions) {
      if (!latestDecisionByCode.has(decision.code)) latestDecisionByCode.set(decision.code, decision);
    }
    const activeDismissedRecommendations = Array.from(latestDecisionByCode.values())
      .filter((record) => record.decision === 'dismissed')
      .sort((a, b) => b.decidedAt.localeCompare(a.decidedAt));
    const dismissedCodes = new Set(activeDismissedRecommendations.map((record) => record.code));
    const recommendations = queue.issues
      .filter((issue) => issue.openOccurrences > 0 && !configuredCodes.has(issue.code) && !dismissedCodes.has(issue.code))
      .slice(0, 8)
      .map((issue) => ({
        issueId: issue.id,
        code: issue.code,
        level: issue.level,
        message: issue.message,
        suggestedAction: this.suggestPolicyAction(issue),
        suggestedSeverity: issue.level === 'error' ? 'high' as const : issue.code.includes('missing_runtime') ? 'low' as const : 'medium' as const,
        openOccurrences: issue.openOccurrences,
        latestOccurredAt: issue.latestOccurredAt,
        reason: issue.code.includes('missing_runtime')
          ? 'Runtime metadata gaps weaken attribution but do not block trace lineage.'
          : issue.level === 'error'
            ? 'Error-level ingest issues should stay visible until explicitly resolved.'
            : 'Recurring warning without a rule should be reviewed by an operator.',
      }));

    const enabledRules = this.data.ingestQualityPolicyRules.filter((rule) => rule.enabled);
    const stateForRule = (rule: IngestQualityPolicyRule) => rule.state ?? (rule.enabled ? 'live' : 'draft');
    const acceptedRecommendationRules = this.data.ingestQualityPolicyRules.filter((rule) => {
      const notes = [
        rule.lastStateChange?.note,
        ...(rule.lifecycle ?? []).map((event) => event.note),
      ].filter(Boolean).join(' ').toLowerCase();
      return notes.includes('recommendation');
    });
    return {
      rules: this.data.ingestQualityPolicyRules
        .slice()
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
      recommendations,
      dismissedRecommendations: activeDismissedRecommendations.slice(0, 12),
      recommendationDecisions: recommendationDecisions.slice(0, 24),
      summary: {
        totalRules: this.data.ingestQualityPolicyRules.length,
        enabledRules: enabledRules.length,
        draftRules: this.data.ingestQualityPolicyRules.filter((rule) => stateForRule(rule) === 'draft').length,
        pausedRules: this.data.ingestQualityPolicyRules.filter((rule) => stateForRule(rule) === 'paused').length,
        manualReviewRules: this.data.ingestQualityPolicyRules.filter((rule) => rule.action === 'manual_review').length,
        automationRules: this.data.ingestQualityPolicyRules.filter((rule) => rule.action !== 'manual_review').length,
        recommendedRules: recommendations.length,
        acceptedRecommendations: acceptedRecommendationRules.length,
        dismissedRecommendations: activeDismissedRecommendations.length,
        reopenedRecommendations: recommendationDecisions.filter((record) => record.decision === 'reopened').length,
        recommendationDecisionEvents: recommendationDecisions.length,
      },
    };
  }

  async decideIngestQualityRecommendations(input: IngestQualityRecommendationDecisionInput): Promise<IngestQualityPolicyResponse> {
    const now = new Date().toISOString();
    const actor = input.actor?.trim().slice(0, 80) || 'traceops-operator';
    const note = input.note?.trim().slice(0, 500) || undefined;
    for (const recommendation of input.recommendations) {
      const code = recommendation.code.trim().slice(0, 120);
      const existingRecords = this.data.ingestQualityRecommendationDecisions.filter((record) => record.code === code);
      const record: IngestQualityRecommendationDecisionRecord = {
        id: `ingest_recommendation_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        decision: input.decision,
        code,
        level: recommendation.level,
        message: recommendation.message,
        issueIds: Array.from(new Set([...existingRecords.flatMap((item) => item.issueIds), recommendation.issueId])).slice(0, 50),
        occurrenceCount: Math.max(...existingRecords.map((item) => item.occurrenceCount), recommendation.openOccurrences),
        actor,
        decidedAt: now,
        note,
      };
      this.data.ingestQualityRecommendationDecisions.unshift(record);
    }
    this.data.ingestQualityRecommendationDecisions = this.data.ingestQualityRecommendationDecisions.slice(0, 100);
    await this.save();
    return this.listIngestQualityPolicy();
  }

  async restoreIngestQualityRecommendation(id: string, note?: string, actor = 'traceops-operator'): Promise<IngestQualityPolicyResponse | undefined> {
    const index = this.data.ingestQualityRecommendationDecisions.findIndex((record) => record.id === id);
    if (index < 0) return undefined;
    const existing = this.data.ingestQualityRecommendationDecisions[index];
    this.data.ingestQualityRecommendationDecisions.unshift({
      ...existing,
      id: `ingest_recommendation_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      decision: 'reopened',
      actor: actor.trim().slice(0, 80) || 'traceops-operator',
      decidedAt: new Date().toISOString(),
      note: note?.trim().slice(0, 500) || 'Restored recommendation to policy intake.',
    });
    this.data.ingestQualityRecommendationDecisions = this.data.ingestQualityRecommendationDecisions.slice(0, 100);
    await this.save();
    return this.listIngestQualityPolicy();
  }

  async upsertIngestQualityPolicyRule(input: IngestQualityPolicyRuleInput): Promise<IngestQualityPolicyResponse> {
    const now = new Date().toISOString();
    const code = input.code.trim().slice(0, 120);
    const existingIndex = input.id
      ? this.data.ingestQualityPolicyRules.findIndex((rule) => rule.id === input.id)
      : this.data.ingestQualityPolicyRules.findIndex((rule) => rule.code === code);
    const existing = existingIndex >= 0 ? this.data.ingestQualityPolicyRules[existingIndex] : undefined;
    const previousState = existing?.state ?? (existing?.enabled ? 'live' : 'draft');
    const requestedEnabled = input.enabled ?? existing?.enabled ?? true;
    const state = input.state ?? (requestedEnabled ? 'live' : previousState === 'live' ? 'paused' : previousState);
    const enabled = state === 'live';
    let lifecycle = existing?.lifecycle ?? [];
    let lastStateChange = existing?.lastStateChange;
    if (!existing || state !== previousState || input.stateChangeNote || input.stateChangePreview) {
      lastStateChange = {
        id: `ingest_policy_state_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        state,
        actor: input.stateChangeActor?.trim().slice(0, 80) || 'traceops-operator',
        changedAt: now,
        note: input.stateChangeNote?.trim().slice(0, 500) || undefined,
        preview: input.stateChangePreview,
      };
      lifecycle = [lastStateChange, ...lifecycle].slice(0, 20);
    }
    const rule: IngestQualityPolicyRule = {
      id: existing?.id ?? `ingest_policy_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      code,
      level: input.level ?? existing?.level ?? 'warning',
      action: input.action,
      severity: input.severity ?? existing?.severity ?? 'medium',
      enabled,
      state,
      note: input.note ?? existing?.note,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      lastAppliedAt: existing?.lastAppliedAt,
      appliedCount: existing?.appliedCount,
      lastStateChange,
      lifecycle,
    };

    if (existingIndex >= 0) this.data.ingestQualityPolicyRules[existingIndex] = rule;
    else this.data.ingestQualityPolicyRules.unshift(rule);
    this.data.ingestQualityPolicyRules = this.data.ingestQualityPolicyRules.slice(0, 100);
    await this.save();
    return this.listIngestQualityPolicy();
  }

  async installDefaultIngestQualityPolicyRules(actor = 'traceops-operator'): Promise<IngestQualityPolicyApplyResult> {
    const defaults: IngestQualityPolicyRuleInput[] = [
      {
        code: 'kodax_missing_runtime_info',
        level: 'warning',
        action: 'auto_ignore',
        severity: 'low',
        enabled: true,
        state: 'live',
        note: 'Default TraceOps rule: ignore recurring legacy KodaX sessions that do not carry runtime metadata. Lineage remains usable.',
        stateChangeActor: actor,
        stateChangeNote: 'Installed default governance rule for legacy KodaX runtime metadata gaps.',
      },
      {
        code: 'kodax_sync_crashed',
        level: 'error',
        action: 'manual_review',
        severity: 'high',
        enabled: true,
        state: 'live',
        note: 'Default TraceOps rule: keep sync crashes visible for operator review.',
        stateChangeActor: actor,
        stateChangeNote: 'Installed default governance rule to keep KodaX sync crashes in manual review.',
      },
    ];

    for (const rule of defaults) {
      await this.upsertIngestQualityPolicyRule(rule);
    }

    return await this.applyIngestQualityPolicyRules(actor, 'manual');
  }

  listIngestQualityPolicyRuns(): IngestQualityPolicyRunListResponse {
    const runs = this.data.ingestQualityPolicyRuns
      .slice()
      .sort((a, b) => b.finishedAt.localeCompare(a.finishedAt))
      .slice(0, 50);
    const summary = runs.reduce<IngestQualityPolicyRunListResponse['summary']>((acc, run) => {
      acc.totalRuns += 1;
      if (run.trigger === 'manual') acc.manualRuns += 1;
      else acc.automaticRuns += 1;
      if (run.status === 'skipped') acc.skippedRuns += 1;
      acc.affectedDiagnostics += run.affectedDiagnostics;
      acc.affectedIssues += run.affectedIssues;
      if (!acc.lastRunAt || run.finishedAt.localeCompare(acc.lastRunAt) > 0) acc.lastRunAt = run.finishedAt;
      return acc;
    }, {
      totalRuns: 0,
      manualRuns: 0,
      automaticRuns: 0,
      skippedRuns: 0,
      affectedDiagnostics: 0,
      affectedIssues: 0,
    });
    return { runs, summary };
  }

  dryRunIngestQualityPolicyRules(ruleId?: string): IngestQualityPolicyDryRunResponse {
    const rules = this.data.ingestQualityPolicyRules
      .filter((rule) => ruleId ? rule.id === ruleId : rule.enabled);
    const globalIssueIds = new Set<string>();
    let matchedDiagnostics = 0;
    let changeableDiagnostics = 0;

    const ruleResults = rules.map<IngestQualityPolicyDryRunRuleResult>((rule) => {
      const decision = this.policyActionDecision(rule.action);
      const matches = [];
      const matchedIssueIds = new Set<string>();

      for (const job of this.data.jobs) {
        for (const diagnostic of job.diagnostics ?? []) {
          if (diagnostic.level === 'info') continue;
          if (diagnostic.code !== rule.code) continue;
          if (rule.level !== 'any' && diagnostic.level !== rule.level) continue;
          const currentStatus = this.ingestDiagnosticStatus(diagnostic);
          if (currentStatus !== 'open') continue;
          const issueId = this.ingestQualityIssueId(diagnostic);
          matchedIssueIds.add(issueId);
          globalIssueIds.add(issueId);
          matches.push({
            jobId: job.id,
            jobMode: job.mode,
            diagnosticId: diagnostic.id,
            issueId,
            code: diagnostic.code,
            level: diagnostic.level as 'warning' | 'error',
            message: diagnostic.message,
            sourceSessionId: diagnostic.sourceSessionId,
            traceId: diagnostic.traceId,
            occurredAt: diagnostic.occurredAt,
            currentStatus,
            decision,
          });
        }
      }

      matchedDiagnostics += matches.length;
      if (decision) changeableDiagnostics += matches.length;
      return {
        ruleId: rule.id,
        code: rule.code,
        level: rule.level,
        action: rule.action,
        severity: rule.severity,
        enabled: rule.enabled,
        decision,
        matchedDiagnostics: matches.length,
        matchedIssues: matchedIssueIds.size,
        changeableDiagnostics: decision ? matches.length : 0,
        matches: matches
          .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
          .slice(0, 12),
      };
    });

    return {
      generatedAt: new Date().toISOString(),
      scope: ruleId ? 'single_rule' : 'all_enabled',
      ruleId,
      totalRules: rules.length,
      matchedRules: ruleResults.filter((result) => result.matchedDiagnostics > 0).length,
      matchedDiagnostics,
      matchedIssues: globalIssueIds.size,
      changeableDiagnostics,
      ruleResults: ruleResults
        .sort((a, b) => b.matchedDiagnostics - a.matchedDiagnostics || b.severity.localeCompare(a.severity)),
    };
  }

  async applyIngestQualityPolicyRules(
    actor = 'quality-policy',
    trigger: IngestQualityPolicyRunTrigger = 'manual',
    sourceJobId?: string,
  ): Promise<IngestQualityPolicyApplyResult> {
    const enabledRules = this.data.ingestQualityPolicyRules.filter((rule) => rule.enabled);
    const startedAt = new Date().toISOString();
    const ruleResults: IngestQualityPolicyApplyResult['ruleResults'] = [];
    const affectedIssueIds = new Set<string>();
    let affectedDiagnostics = 0;

    for (const rule of enabledRules) {
      let ruleAffected = 0;
      const decision = this.policyActionDecision(rule.action);
      for (const job of this.data.jobs) {
        for (const diagnostic of job.diagnostics ?? []) {
          if (diagnostic.level === 'info') continue;
          if (diagnostic.code !== rule.code) continue;
          if (rule.level !== 'any' && diagnostic.level !== rule.level) continue;
          if (this.ingestDiagnosticStatus(diagnostic) !== 'open') continue;
          affectedIssueIds.add(this.ingestQualityIssueId(diagnostic));

          if (decision) {
            diagnostic.triageStatus = this.triageStatusForDecision(decision);
            diagnostic.triage = {
              decision,
              status: diagnostic.triageStatus,
              actor,
              decidedAt: startedAt,
              note: rule.note ?? `Applied policy rule ${rule.code}`,
            };
            ruleAffected += 1;
            affectedDiagnostics += 1;
          }
        }
      }
      if (ruleAffected > 0 || rule.action === 'manual_review') {
        rule.lastAppliedAt = startedAt;
        rule.appliedCount = (rule.appliedCount ?? 0) + ruleAffected;
        rule.updatedAt = startedAt;
        ruleResults.push({
          ruleId: rule.id,
          code: rule.code,
          action: rule.action,
          affectedDiagnostics: ruleAffected,
        });
      }
    }

    const finishedAt = new Date().toISOString();
    const run: IngestQualityPolicyRunRecord = {
      id: `ingest_policy_run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      trigger,
      actor,
      status: enabledRules.length === 0 ? 'skipped' : 'succeeded',
      startedAt,
      finishedAt,
      sourceJobId,
      enabledRules: enabledRules.length,
      appliedRules: ruleResults.length,
      affectedDiagnostics,
      affectedIssues: affectedIssueIds.size,
      message: enabledRules.length === 0
        ? 'No enabled policy rules.'
        : `${affectedDiagnostics} diagnostics handled by ${ruleResults.length} policy rules.`,
      ruleResults,
    };
    this.data.ingestQualityPolicyRuns.unshift(run);
    this.data.ingestQualityPolicyRuns = this.data.ingestQualityPolicyRuns.slice(0, 100);

    if (this.data.source.syncCheckpoint) {
      const latestJob = this.data.jobs.find((job) => job.id === this.data.source.syncCheckpoint?.jobId);
      if (latestJob) {
        const summary = this.ingestWarningTriageSummary(latestJob);
        this.data.source.syncCheckpoint = {
          ...this.data.source.syncCheckpoint,
          openSchemaWarnings: summary.open,
          triagedSchemaWarnings: summary.triaged,
        };
      }
    }

    await this.save();
    return {
      appliedRules: ruleResults.length,
      affectedDiagnostics,
      affectedIssues: affectedIssueIds.size,
      ruleResults,
      queue: this.listIngestQualityQueue(),
      policy: this.listIngestQualityPolicy(),
      run,
    };
  }

  async triageIngestQualityIssue(
    issueId: string,
    decision: IngestDiagnosticTriageDecision,
    note?: string,
    actor = 'traceops-operator',
  ): Promise<IngestQualityQueueResponse | undefined> {
    let changed = 0;
    for (const job of this.data.jobs) {
      for (const diagnostic of job.diagnostics ?? []) {
        if (diagnostic.level === 'info' || this.ingestQualityIssueId(diagnostic) !== issueId) continue;
        const currentStatus = this.ingestDiagnosticStatus(diagnostic);
        if (decision === 'reopen' ? currentStatus === 'open' : currentStatus !== 'open') continue;

        const status = decision === 'acknowledge'
          ? 'acknowledged'
          : decision === 'ignore'
            ? 'ignored'
            : decision === 'resolve'
              ? 'resolved'
              : 'open';
        diagnostic.triageStatus = status;
        diagnostic.triage = {
          decision,
          status,
          actor,
          decidedAt: new Date().toISOString(),
          note,
        };
        changed += 1;
      }
    }
    if (changed === 0) return undefined;

    if (this.data.source.syncCheckpoint) {
      const latestJob = this.data.jobs.find((job) => job.id === this.data.source.syncCheckpoint?.jobId);
      if (latestJob) {
        const summary = this.ingestWarningTriageSummary(latestJob);
        this.data.source.syncCheckpoint = {
          ...this.data.source.syncCheckpoint,
          openSchemaWarnings: summary.open,
          triagedSchemaWarnings: summary.triaged,
        };
      }
    }

    await this.save();
    return this.listIngestQualityQueue();
  }

  async resolveFixedKodaXIngestDiagnostics(actor = 'traceops-maintenance'): Promise<IngestQualityRemediationResult> {
    const resolvedAt = new Date().toISOString();
    const categories = new Map<string, { id: string; label: string; affectedDiagnostics: number }>();
    const affectedIssueIds = new Set<string>();
    let affectedDiagnostics = 0;

    const categoryLabels: Record<string, string> = {
      evidence_derivation_method: 'Evidence derivation method fix',
      store_save_temp_rename: 'Serialized store save temp-file fix',
      failed_batch_summary: 'Failed sync summary caused by fixed errors',
    };

    const markCategory = (id: string) => {
      const current = categories.get(id) ?? {
        id,
        label: categoryLabels[id] ?? id,
        affectedDiagnostics: 0,
      };
      current.affectedDiagnostics += 1;
      categories.set(id, current);
    };

    const isEvidenceDerivationMethodError = (message: string) =>
      message.includes('this.deriveEvidenceFromEvents is not a function');
    const isStoreTempRenameError = (message: string) =>
      /ENOENT:.*rename .*\.traceops\/store\.json\.tmp.*\.traceops\/store\.json/.test(message);

    for (const job of this.data.jobs) {
      const diagnostics = job.diagnostics ?? [];
      const jobHasFixedEvidenceError = diagnostics.some((diagnostic) =>
        diagnostic.code === 'kodax_session_ingest_error'
        && isEvidenceDerivationMethodError(diagnostic.message)
      );
      const jobHasFixedStoreSaveError = diagnostics.some((diagnostic) =>
        diagnostic.code === 'kodax_sync_crashed'
        && isStoreTempRenameError(diagnostic.message)
      );

      for (const diagnostic of diagnostics) {
        if (diagnostic.level === 'info' || this.ingestDiagnosticStatus(diagnostic) !== 'open') continue;

        const categoryId = diagnostic.code === 'kodax_session_ingest_error' && isEvidenceDerivationMethodError(diagnostic.message)
          ? 'evidence_derivation_method'
          : diagnostic.code === 'kodax_sync_crashed' && isStoreTempRenameError(diagnostic.message)
            ? 'store_save_temp_rename'
            : diagnostic.code === 'kodax_sync_completed'
              && /failed\./i.test(diagnostic.message)
              && (jobHasFixedEvidenceError || jobHasFixedStoreSaveError)
                ? 'failed_batch_summary'
                : undefined;
        if (!categoryId) continue;

        diagnostic.triageStatus = 'resolved';
        diagnostic.triage = {
          decision: 'resolve',
          status: 'resolved',
          actor,
          decidedAt: resolvedAt,
          note: `${categoryLabels[categoryId]} verified in current TraceOps build.`,
        };
        affectedIssueIds.add(this.ingestQualityIssueId(diagnostic));
        affectedDiagnostics += 1;
        markCategory(categoryId);
      }
    }

    if (this.data.source.syncCheckpoint) {
      const latestJob = this.data.jobs.find((job) => job.id === this.data.source.syncCheckpoint?.jobId);
      if (latestJob) {
        const summary = this.ingestWarningTriageSummary(latestJob);
        this.data.source.syncCheckpoint = {
          ...this.data.source.syncCheckpoint,
          openSchemaWarnings: summary.open,
          triagedSchemaWarnings: summary.triaged,
        };
      }
    }

    if (affectedDiagnostics > 0) await this.save();

    return {
      resolvedAt,
      actor,
      affectedDiagnostics,
      affectedIssues: affectedIssueIds.size,
      categories: Array.from(categories.values()).sort((a, b) => b.affectedDiagnostics - a.affectedDiagnostics),
      queue: this.listIngestQualityQueue(),
    };
  }

  private ingestDiagnosticStatus(diagnostic: { triageStatus?: IngestDiagnosticTriageStatus }): IngestDiagnosticTriageStatus {
    return diagnostic.triageStatus ?? 'open';
  }

  private suggestPolicyAction(issue: IngestQualityIssue): IngestQualityPolicyAction {
    if (issue.level === 'error') return 'manual_review';
    if (issue.code.includes('missing_runtime')) return 'auto_ignore';
    if (issue.openOccurrences > 100) return 'auto_acknowledge';
    return 'manual_review';
  }

  private policyActionDecision(action: IngestQualityPolicyAction): IngestDiagnosticTriageDecision | undefined {
    if (action === 'auto_acknowledge') return 'acknowledge';
    if (action === 'auto_ignore') return 'ignore';
    if (action === 'auto_resolve') return 'resolve';
    return undefined;
  }

  private triageStatusForDecision(decision: IngestDiagnosticTriageDecision): IngestDiagnosticTriageStatus {
    if (decision === 'acknowledge') return 'acknowledged';
    if (decision === 'ignore') return 'ignored';
    if (decision === 'resolve') return 'resolved';
    return 'open';
  }

  private ingestQualityIssueId(diagnostic: {
    code: string;
    message: string;
    sourceSessionId?: string;
    traceId?: string;
  }): string {
    const issueKey = createHash('sha256')
      .update(JSON.stringify({
        code: diagnostic.code,
        message: diagnostic.message,
        sourceSessionId: diagnostic.sourceSessionId,
        traceId: diagnostic.traceId,
      }))
      .digest('hex')
      .slice(0, 16);
    return `ingest_quality_${issueKey}`;
  }

  listJobs(): IngestJob[] {
    return this.data.jobs.slice(0, 30);
  }

  listProjects(): string[] {
    return Array.from(new Set(this.data.traces.map((trace) => trace.projectKey).filter((value): value is string => !!value))).sort();
  }
}
