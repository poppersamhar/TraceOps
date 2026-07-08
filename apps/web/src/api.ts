import type {
  CleanTraceListResponse,
  DatasetClosedLoopApprovalDeploymentResult,
  DatasetClosedLoopCandidateCycleResult,
  DatasetClosedLoopFeedbackSignalMode,
  DatasetClosedLoopFeedbackSignalResult,
  DatasetClosedLoopNextDatasetResult,
  DatasetClosedLoopRetrainingApplyResult,
  DatasetClosedLoopRetrainingPlan,
  DatasetClosedLoopModelGateResult,
  DatasetClosedLoopRolloutResult,
  DatasetClosedLoopTrainingCycleResult,
  DatasetClosedLoopDeploymentHandoffResult,
  DatasetDeploymentHandoffRecord,
  DatasetDeploymentHandoffStatus,
  DatasetEvalRunApplyResult,
  DatasetEvalRunRecord,
  DatasetExportFormat,
  DatasetFeedbackLoopDecision,
  DatasetFeedbackLoopRecord,
  DatasetManifestRetrainingHandoffResult,
  DatasetModelReleaseGateDecision,
  DatasetModelReleaseGateRecord,
  DatasetPostReleaseMonitorRecord,
  DatasetPostReleaseMonitorStatus,
  DatasetExportRun,
  DatasetReleaseGateActionDecision,
  DatasetReleaseManifest,
  DatasetReleasePackage,
  DatasetReleasePromotionRecord,
  DatasetRetrainingHandoffRecord,
  DatasetTrainingLaunchPlan,
  DatasetTrainingProvider,
  DatasetTrainingProviderStatus,
  DatasetTrainingRunRecord,
  DatasetVersion,
  DatasetVersionDiff,
  DatasetVersionDiffReviewApplyResult,
  DatasetVersionDiffReviewPlan,
  DatasetVersionDiffReviewDecision,
  GovernanceAuditRecord,
  GovernancePolicyResponse,
  IngestDiagnosticTriageDecision,
  IngestJob,
  IngestQualityPolicyApplyResult,
  IngestQualityPolicyDryRunResponse,
  IngestQualityPolicyRecommendation,
  IngestQualityPolicyResponse,
  IngestQualityPolicyRunListResponse,
  IngestQualityPolicyRuleInput,
  IngestQualityQueueResponse,
  IngestQualityRemediationResult,
  KodaXFeedbackPackage,
  KodaXFeedbackReport,
  KodaXFeedbackWritebackRecord,
  KodaXFeedbackWritebackResult,
  MemoryCandidate,
  MemoryCandidateListResponse,
  SourceStatus,
  StorePersistenceHealth,
  TraceOpsSegmentBackfillResult,
  TraceOpsSegmentStoreStatus,
  StoreSnapshotCreateResult,
  StoreSnapshotRecord,
  StoreSnapshotRestoreResult,
  TrainingSample,
  TrainingSampleEvidenceCandidate,
  TrainingSampleReviewBulkResult,
  TraceOpsTaskCreateInput,
  TraceOpsTaskCreateResponse,
  TraceOpsTaskAutomationPlan,
  TraceOpsTaskListResponse,
  TraceOpsTaskOrchestrationResult,
  TraceOpsTaskRecord,
  TraceOpsTaskRunResponse,
  TraceDetail,
  TraceListResponse,
  TrainingSampleListResponse,
} from '../../../packages/trace-core/src/types';
import { demoApiResponse, demoExportUrl, shouldUseDemoApi } from './demoApi';

export type TrainingSampleExportFormat = DatasetExportFormat;

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  if (shouldUseDemoApi()) {
    return demoApiResponse<T>(url, init);
  }
  try {
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
    if (!response.ok) {
      throw new Error(await response.text());
    }
    return response.json() as Promise<T>;
  } catch (error) {
    if (shouldUseDemoApi(true)) {
      return demoApiResponse<T>(url, init);
    }
    throw error;
  }
}

export function getSourceStatus() {
  return request<SourceStatus>('/api/sources/kodax/status');
}

export function getGovernancePolicy() {
  return request<GovernancePolicyResponse>('/api/governance/policy');
}

export function listGovernanceAuditLog(limit = 200) {
  return request<GovernanceAuditRecord[]>(`/api/governance/audit-log?limit=${encodeURIComponent(String(limit))}`);
}

export function getStorageHealth() {
  return request<StorePersistenceHealth>('/api/storage/health');
}

export function getSegmentStoreStatus() {
  return request<TraceOpsSegmentStoreStatus>('/api/storage/segments');
}

export function backfillSegmentStore(reason = 'manual_segment_backfill') {
  return request<TraceOpsSegmentBackfillResult>('/api/storage/segments/backfill', {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export function rebuildSegmentStore(reason = 'manual_segment_rebuild') {
  return request<TraceOpsSegmentBackfillResult>('/api/storage/segments/rebuild', {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export function listStorageSnapshots() {
  return request<StoreSnapshotRecord[]>('/api/storage/snapshots');
}

export function createStorageSnapshot(reason = 'manual_snapshot') {
  return request<StoreSnapshotCreateResult>('/api/storage/snapshots', {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export function restoreStorageSnapshot(id: string) {
  return request<StoreSnapshotRestoreResult>(`/api/storage/snapshots/${encodeURIComponent(id)}/restore`, {
    method: 'POST',
    body: JSON.stringify({ reason: 'manual_restore' }),
  });
}

export function syncKodaX(mode: 'manual' | 'retry' = 'manual') {
  return request<IngestJob>('/api/sources/kodax/sync', {
    method: 'POST',
    body: JSON.stringify({ mode }),
  });
}

export function setKodaXWatch(enabled: boolean) {
  return request<SourceStatus>('/api/sources/kodax/watch', {
    method: 'POST',
    body: JSON.stringify({ enabled }),
  });
}

export function listJobs() {
  return request<IngestJob[]>('/api/ingest/jobs');
}

export function getIngestQualityQueue() {
  return request<IngestQualityQueueResponse>('/api/ingest/quality');
}

export function getIngestQualityPolicy() {
  return request<IngestQualityPolicyResponse>('/api/ingest/quality/policy');
}

export function listIngestQualityPolicyRuns() {
  return request<IngestQualityPolicyRunListResponse>('/api/ingest/quality/policy/runs');
}

export function upsertIngestQualityPolicyRule(rule: IngestQualityPolicyRuleInput) {
  return request<IngestQualityPolicyResponse>('/api/ingest/quality/policy/rules', {
    method: 'POST',
    body: JSON.stringify(rule),
  });
}

export function installDefaultIngestQualityPolicyRules() {
  return request<IngestQualityPolicyApplyResult>('/api/ingest/quality/policy/defaults', {
    method: 'POST',
    body: JSON.stringify({ actor: 'traceops-operator' }),
  });
}

export function applyIngestQualityPolicy() {
  return request<IngestQualityPolicyApplyResult>('/api/ingest/quality/policy/apply', {
    method: 'POST',
    body: JSON.stringify({ actor: 'traceops-operator' }),
  });
}

export function dryRunIngestQualityPolicy(ruleId?: string) {
  return request<IngestQualityPolicyDryRunResponse>('/api/ingest/quality/policy/dry-run', {
    method: 'POST',
    body: JSON.stringify({ ruleId }),
  });
}

export function decideIngestQualityRecommendations(recommendations: IngestQualityPolicyRecommendation[], note = '') {
  return request<IngestQualityPolicyResponse>('/api/ingest/quality/policy/recommendations/decision', {
    method: 'POST',
    body: JSON.stringify({
      recommendations,
      decision: 'dismissed',
      actor: 'traceops-operator',
      note,
    }),
  });
}

export function restoreIngestQualityRecommendation(id: string, note = '') {
  return request<IngestQualityPolicyResponse>(`/api/ingest/quality/policy/recommendations/${encodeURIComponent(id)}/restore`, {
    method: 'PATCH',
    body: JSON.stringify({ actor: 'traceops-operator', note }),
  });
}

export function setQualityPolicyAutoApply(enabled: boolean) {
  return request<SourceStatus>('/api/ingest/quality/policy/auto-apply', {
    method: 'POST',
    body: JSON.stringify({ enabled }),
  });
}

export function resolveFixedKodaXIngestDiagnostics() {
  return request<IngestQualityRemediationResult>('/api/maintenance/ingest/resolve-fixed-kodax', {
    method: 'POST',
    body: JSON.stringify({ actor: 'traceops-operator' }),
  });
}

export function triageIngestDiagnostic(jobId: string, diagnosticId: string, decision: IngestDiagnosticTriageDecision, note = '') {
  return request<IngestJob>(`/api/ingest/jobs/${encodeURIComponent(jobId)}/diagnostics/${encodeURIComponent(diagnosticId)}/triage`, {
    method: 'PATCH',
    body: JSON.stringify({ decision, note, actor: 'traceops-operator' }),
  });
}

export function triageIngestQualityIssue(issueId: string, decision: IngestDiagnosticTriageDecision, note = '') {
  return request<IngestQualityQueueResponse>(`/api/ingest/quality/issues/${encodeURIComponent(issueId)}/triage`, {
    method: 'PATCH',
    body: JSON.stringify({ decision, note, actor: 'traceops-operator' }),
  });
}

export function listTasks() {
  return request<TraceOpsTaskListResponse>('/api/tasks');
}

export function getTaskAutomationPlan() {
  return request<TraceOpsTaskAutomationPlan>('/api/tasks/automation-plan');
}

export function createTasks(tasks: TraceOpsTaskCreateInput[]) {
  return request<TraceOpsTaskCreateResponse>('/api/tasks', {
    method: 'POST',
    body: JSON.stringify({ tasks }),
  });
}

export function orchestrateTasks(input: { runNow?: boolean; limit?: number } = {}) {
  return request<TraceOpsTaskOrchestrationResult & { execution?: TraceOpsTaskRunResponse }>('/api/tasks/orchestrate', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function retryTask(id: string, note = '') {
  return request<TraceOpsTaskRecord>(`/api/tasks/${encodeURIComponent(id)}/retry`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  });
}

export function runQueuedTasks(limit = 3) {
  return request<TraceOpsTaskRunResponse>('/api/tasks/run-next', {
    method: 'POST',
    body: JSON.stringify({ limit }),
  });
}

export function listExportRuns() {
  return request<DatasetExportRun[]>('/api/exports');
}

export function listReleaseManifests() {
  return request<DatasetReleaseManifest[]>('/api/release-manifests');
}

export function listReleasePromotions() {
  return request<DatasetReleasePromotionRecord[]>('/api/release-promotions');
}

export function getReleasePackage(id: string) {
  return request<DatasetReleasePackage>(`/api/release-promotions/${encodeURIComponent(id)}/package`);
}

export function releasePackageDownloadUrl(id: string) {
  return `/api/release-promotions/${encodeURIComponent(id)}/package/download`;
}

export function listRetrainingHandoffs() {
  return request<DatasetRetrainingHandoffRecord[]>('/api/retraining-handoffs');
}

export function listClosedLoopRetrainingPlans() {
  return request<DatasetClosedLoopRetrainingPlan[]>('/api/closed-loop-retraining-plans');
}

export function prepareClosedLoopRetrainingHandoff(id: string, input: {
  trainingOwner?: string;
  targetSystem?: string;
  note?: string;
} = {}) {
  return request<DatasetClosedLoopRetrainingApplyResult>(`/api/datasets/${encodeURIComponent(id)}/closed-loop-retraining-handoff`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function runClosedLoopTrainingCycle(id: string, input: {
  owner?: string;
  targetSystem?: string;
  modelName?: string;
  externalRunId?: string;
  note?: string;
} = {}) {
  return request<DatasetClosedLoopTrainingCycleResult>(`/api/datasets/${encodeURIComponent(id)}/closed-loop-training-cycle`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function runClosedLoopCandidateCycle(id: string, input: {
  owner?: string;
  targetSystem?: string;
  modelName?: string;
  note?: string;
} = {}) {
  return request<DatasetClosedLoopCandidateCycleResult>(`/api/datasets/${encodeURIComponent(id)}/closed-loop-candidate-cycle`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function prepareClosedLoopModelReleaseGate(id: string, input: {
  owner?: string;
  targetSystem?: string;
  modelName?: string;
  note?: string;
} = {}) {
  return request<DatasetClosedLoopModelGateResult>(`/api/datasets/${encodeURIComponent(id)}/closed-loop-model-release-gate`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function prepareClosedLoopDeploymentHandoff(id: string, input: {
  deploymentOwner?: string;
  environment?: string;
  rolloutStrategy?: string;
  note?: string;
} = {}) {
  return request<DatasetClosedLoopDeploymentHandoffResult>(`/api/datasets/${encodeURIComponent(id)}/closed-loop-deployment-handoff`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function approveClosedLoopDeploymentHandoff(id: string, input: {
  decisionNote?: string;
  deploymentOwner?: string;
  environment?: string;
  rolloutStrategy?: string;
  note?: string;
} = {}) {
  return request<DatasetClosedLoopApprovalDeploymentResult>(`/api/datasets/${encodeURIComponent(id)}/closed-loop-approval-deployment`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function runClosedLoopRollout(id: string, input: {
  deploymentOwner?: string;
  environment?: string;
  rolloutStrategy?: string;
  monitorOwner?: string;
  note?: string;
} = {}) {
  return request<DatasetClosedLoopRolloutResult>(`/api/datasets/${encodeURIComponent(id)}/closed-loop-rollout`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function writeClosedLoopFeedbackSignal(id: string, input: {
  mode?: DatasetClosedLoopFeedbackSignalMode;
  taskSuccessRate?: number;
  regressionAlertRate?: number;
  p95LatencyMs?: number;
  toolErrorRate?: number;
  manualInterventionRate?: number;
  alertNote?: string;
  note?: string;
} = {}) {
  return request<DatasetClosedLoopFeedbackSignalResult>(`/api/datasets/${encodeURIComponent(id)}/closed-loop-feedback-signal`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function buildClosedLoopNextDataset(id: string, input: {
  name?: string;
  notes?: string;
  format?: DatasetExportFormat;
  trainingOwner?: string;
  targetSystem?: string;
} = {}) {
  return request<DatasetClosedLoopNextDatasetResult>(`/api/datasets/${encodeURIComponent(id)}/closed-loop-next-dataset`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function createRetrainingHandoff(id: string, input: {
  trainingOwner?: string;
  targetSystem?: string;
  note?: string;
} = {}) {
  return request<DatasetRetrainingHandoffRecord>(`/api/release-promotions/${encodeURIComponent(id)}/retraining-handoffs`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function createRetrainingHandoffFromManifest(id: string, input: {
  trainingOwner?: string;
  targetSystem?: string;
  note?: string;
} = {}) {
  return request<DatasetManifestRetrainingHandoffResult>(`/api/release-manifests/${encodeURIComponent(id)}/retraining-handoff`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function retrainingHandoffDownloadUrl(id: string) {
  return `/api/retraining-handoffs/${encodeURIComponent(id)}/download`;
}

export function listTrainingRuns() {
  return request<DatasetTrainingRunRecord[]>('/api/training-runs');
}

export function listTrainingLaunchPlans() {
  return request<DatasetTrainingLaunchPlan[]>('/api/training-launch-plans');
}

export function getTrainingLaunchPlan(id: string) {
  return request<DatasetTrainingLaunchPlan>(`/api/retraining-handoffs/${encodeURIComponent(id)}/training-launch-plan`);
}

export function createTrainingRun(id: string, input: {
  owner?: string;
  targetSystem?: string;
  modelName?: string;
  modelVersion?: string;
  externalRunId?: string;
  note?: string;
} = {}) {
  return request<DatasetTrainingRunRecord>(`/api/retraining-handoffs/${encodeURIComponent(id)}/training-runs`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function recordTrainingRunResult(id: string, input: {
  validationScore?: number;
  regressionRate?: number;
  blockedIssueCount?: number;
  rollbackRequired?: boolean;
  resultSummary?: string;
  status?: DatasetTrainingRunRecord['status'];
  note?: string;
}) {
  return request<DatasetTrainingRunRecord>(`/api/training-runs/${encodeURIComponent(id)}/result`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function launchTrainingProvider(id: string, input: {
  provider?: DatasetTrainingProvider;
  endpoint?: string;
  apiKey?: string;
  dryRun?: boolean;
  submittedBy?: string;
} = {}) {
  return request<DatasetTrainingRunRecord>(`/api/training-runs/${encodeURIComponent(id)}/launch-provider`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function recordTrainingProviderStatus(id: string, input: {
  providerStatus: DatasetTrainingProviderStatus;
  provider?: DatasetTrainingProvider;
  endpoint?: string;
  externalRunId?: string;
  validationScore?: number;
  regressionRate?: number;
  blockedIssueCount?: number;
  rollbackRequired?: boolean;
  note?: string;
}) {
  return request<DatasetTrainingRunRecord>(`/api/training-runs/${encodeURIComponent(id)}/provider-status`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function syncTrainingProviderStatus(id: string, input: {
  provider?: DatasetTrainingProvider;
  endpoint?: string;
  externalRunId?: string;
  apiKey?: string;
  method?: 'GET' | 'POST';
} = {}) {
  return request<DatasetTrainingRunRecord>(`/api/training-runs/${encodeURIComponent(id)}/sync-provider-status`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function listEvalRuns() {
  return request<DatasetEvalRunRecord[]>('/api/eval-runs');
}

export function runTrainingEval(id: string, note = '') {
  return request<DatasetEvalRunApplyResult>(`/api/training-runs/${encodeURIComponent(id)}/eval-runs`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  });
}

export function evalRunDownloadUrl(id: string) {
  return `/api/eval-runs/${encodeURIComponent(id)}/download`;
}

export function listModelReleaseGates() {
  return request<DatasetModelReleaseGateRecord[]>('/api/model-release-gates');
}

export function createModelReleaseGate(id: string, note = '') {
  return request<DatasetModelReleaseGateRecord>(`/api/training-runs/${encodeURIComponent(id)}/model-release-gates`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  });
}

export function recordModelReleaseGateDecision(id: string, input: {
  decision: DatasetModelReleaseGateDecision;
  note?: string;
}) {
  return request<DatasetModelReleaseGateRecord>(`/api/model-release-gates/${encodeURIComponent(id)}/decisions`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function listDeploymentHandoffs() {
  return request<DatasetDeploymentHandoffRecord[]>('/api/deployment-handoffs');
}

export function createDeploymentHandoff(id: string, input: {
  deploymentOwner?: string;
  environment?: string;
  rolloutStrategy?: string;
  note?: string;
} = {}) {
  return request<DatasetDeploymentHandoffRecord>(`/api/model-release-gates/${encodeURIComponent(id)}/deployment-handoffs`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateDeploymentHandoffStatus(id: string, input: {
  status: DatasetDeploymentHandoffStatus;
  note?: string;
}) {
  return request<DatasetDeploymentHandoffRecord>(`/api/deployment-handoffs/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function deploymentHandoffDownloadUrl(id: string) {
  return `/api/deployment-handoffs/${encodeURIComponent(id)}/download`;
}

export function listPostReleaseMonitors() {
  return request<DatasetPostReleaseMonitorRecord[]>('/api/post-release-monitors');
}

export function createPostReleaseMonitor(id: string, input: {
  monitorOwner?: string;
  note?: string;
} = {}) {
  return request<DatasetPostReleaseMonitorRecord>(`/api/deployment-handoffs/${encodeURIComponent(id)}/post-release-monitors`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function recordPostReleaseSignal(id: string, input: {
  taskSuccessRate?: number;
  regressionAlertRate?: number;
  p95LatencyMs?: number;
  toolErrorRate?: number;
  manualInterventionRate?: number;
  rollbackSignal?: boolean;
  alertNote?: string;
  status?: DatasetPostReleaseMonitorStatus;
  note?: string;
}) {
  return request<DatasetPostReleaseMonitorRecord>(`/api/post-release-monitors/${encodeURIComponent(id)}/signals`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}

export function postReleaseMonitorDownloadUrl(id: string) {
  return `/api/post-release-monitors/${encodeURIComponent(id)}/download`;
}

export function listFeedbackLoops() {
  return request<DatasetFeedbackLoopRecord[]>('/api/feedback-loops');
}

export function createFeedbackLoop(id: string, note = '') {
  return request<DatasetFeedbackLoopRecord>(`/api/post-release-monitors/${encodeURIComponent(id)}/feedback-loops`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  });
}

export function recordFeedbackLoopDecision(id: string, input: {
  decision: DatasetFeedbackLoopDecision;
  note?: string;
}) {
  return request<DatasetFeedbackLoopRecord>(`/api/feedback-loops/${encodeURIComponent(id)}/decisions`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function feedbackLoopDownloadUrl(id: string) {
  return `/api/feedback-loops/${encodeURIComponent(id)}/download`;
}

export function createReleaseManifest(id: string, notes = '') {
  return request<DatasetReleaseManifest>(`/api/datasets/${encodeURIComponent(id)}/release-manifests`, {
    method: 'POST',
    body: JSON.stringify({ notes }),
  });
}

export function releaseManifestDownloadUrl(id: string) {
  return `/api/release-manifests/${encodeURIComponent(id)}/download`;
}

export function promoteReleaseManifest(id: string, note = '') {
  return request<DatasetReleaseManifest>(`/api/release-manifests/${encodeURIComponent(id)}/promote`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  });
}

export function revokeExportRun(id: string, reason = '') {
  return request<DatasetExportRun>(`/api/exports/${encodeURIComponent(id)}/revoke`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export function listDatasetVersions() {
  return request<DatasetVersion[]>('/api/datasets');
}

export function listDatasetVersionSamples(id: string) {
  return request<TrainingSample[]>(`/api/datasets/${encodeURIComponent(id)}/samples`);
}

export function getDatasetVersionDiff(id: string, baseId?: string) {
  const params = new URLSearchParams();
  if (baseId) params.set('baseId', baseId);
  const suffix = params.toString() ? `?${params.toString()}` : '';
  return request<DatasetVersionDiff>(`/api/datasets/${encodeURIComponent(id)}/diff${suffix}`);
}

export function getDatasetVersionDiffReviewPlan(id: string, baseId?: string) {
  const params = new URLSearchParams();
  if (baseId) params.set('baseId', baseId);
  const suffix = params.toString() ? `?${params.toString()}` : '';
  return request<DatasetVersionDiffReviewPlan>(`/api/datasets/${encodeURIComponent(id)}/diff-review-plan${suffix}`);
}

export function applyDatasetVersionDiffReviewPlan(id: string, input: {
  baseVersionId?: string;
  decision?: DatasetVersionDiffReviewDecision;
  note?: string;
  acknowledgeWarnings?: boolean;
  createManifest?: boolean;
} = {}) {
  return request<DatasetVersionDiffReviewApplyResult>(`/api/datasets/${encodeURIComponent(id)}/diff-review-plan/apply`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function recordDatasetVersionDiffReview(id: string, input: {
  baseVersionId: string;
  decision: DatasetVersionDiffReviewDecision;
  note?: string;
}) {
  return request<DatasetVersionDiff>(`/api/datasets/${encodeURIComponent(id)}/diff-reviews`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function createDatasetVersion(input: { name?: string; sampleIds?: string[]; notes?: string; format?: TrainingSampleExportFormat } = {}) {
  return request<DatasetVersion>('/api/datasets', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function createFeedbackDatasetVersion(input: {
  name?: string;
  feedbackLoopIds?: string[];
  notes?: string;
  format?: TrainingSampleExportFormat;
} = {}) {
  return request<DatasetVersion>('/api/feedback-loops/dataset-versions', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function recordDatasetReleaseGateAction(id: string, input: {
  checkId: string;
  decision: DatasetReleaseGateActionDecision;
  note?: string;
}) {
  return request<DatasetVersion>(`/api/datasets/${encodeURIComponent(id)}/release-gate-actions`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function listTraces(params: URLSearchParams) {
  return request<TraceListResponse>(`/api/raw-traces?${params.toString()}`);
}

export function getTrace(id: string) {
  return request<TraceDetail>(`/api/raw-traces/${encodeURIComponent(id)}`);
}

export function listProjects() {
  return request<string[]>('/api/raw-traces/projects');
}

export function listTrainingSamples(params = new URLSearchParams()) {
  return request<TrainingSampleListResponse>(`/api/training-samples?${params.toString()}`);
}

export function listCleanTraces(params = new URLSearchParams()) {
  return request<CleanTraceListResponse>(`/api/clean-traces?${params.toString()}`);
}

export function listMemoryCandidates(params = new URLSearchParams()) {
  return request<MemoryCandidateListResponse>(`/api/memory-candidates?${params.toString()}`);
}

export function getKodaXFeedbackReport() {
  return request<KodaXFeedbackReport>('/api/kodax/feedback-report');
}

export function getKodaXFeedbackPackage() {
  return request<KodaXFeedbackPackage>('/api/kodax/feedback-package');
}

export function listKodaXFeedbackWritebacks(limit = 50) {
  return request<KodaXFeedbackWritebackRecord[]>(`/api/kodax/feedback-writebacks?limit=${encodeURIComponent(String(limit))}`);
}

export function writebackKodaXFeedbackPackage(reason = 'manual_kodax_feedback_writeback') {
  return request<KodaXFeedbackWritebackResult>('/api/kodax/feedback-package/writeback', {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export function kodaxFeedbackPackageDownloadUrl() {
  return '/api/kodax/feedback-package/download';
}

export function reviewMemoryCandidate(id: string, decision: 'promoted' | 'rejected', note = '') {
  return request<MemoryCandidate>(`/api/memory-candidates/${encodeURIComponent(id)}/review`, {
    method: 'POST',
    body: JSON.stringify({ decision, note }),
  });
}

export function trainingSampleExportUrl(params: URLSearchParams, format: TrainingSampleExportFormat) {
  if (shouldUseDemoApi(true)) return demoExportUrl(format);
  const next = new URLSearchParams(params);
  next.set('format', format);
  return `/api/exports/training-samples?${next.toString()}`;
}

export function datasetVersionExportUrl(id: string, format: TrainingSampleExportFormat = 'fine_tune_jsonl') {
  if (shouldUseDemoApi(true)) return demoExportUrl(format);
  const params = new URLSearchParams({ format });
  return `/api/datasets/${encodeURIComponent(id)}/export?${params.toString()}`;
}

export function reviewTrainingSample(id: string, decision: 'approved' | 'rejected', note = '') {
  return request<TrainingSample>(`/api/training-samples/${encodeURIComponent(id)}/review`, {
    method: 'POST',
    body: JSON.stringify({ decision, note }),
  });
}

export function reviewTrainingSamples(sampleIds: string[], decision: 'approved' | 'rejected', note = '') {
  return request<TrainingSampleReviewBulkResult>('/api/training-samples/review', {
    method: 'POST',
    body: JSON.stringify({ sampleIds, decision, note }),
  });
}

export function listTrainingSampleEvidenceCandidates(id: string) {
  return request<TrainingSampleEvidenceCandidate[]>(`/api/training-samples/${encodeURIComponent(id)}/evidence-candidates`);
}

export function repairTrainingSample(id: string, input: {
  cleanUserGoal?: string;
  cleanAssistantOutcome?: string;
  relinkedEvidenceIds?: string[];
  evidenceGapNote?: string;
  note?: string;
}) {
  return request<TrainingSample>(`/api/training-samples/${encodeURIComponent(id)}/repair`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
