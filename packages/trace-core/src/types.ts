export type IngestionStatus =
  | 'discovered'
  | 'importing'
  | 'imported'
  | 'updated'
  | 'ingest_failed'
  | 'archived';

export type RiskLevel = 'L0' | 'L1' | 'L2' | 'L3' | 'L4';

export type TraceStatus = 'running' | 'completed' | 'failed' | 'unknown';

export interface RawTraceRuntime {
  canonicalRepoRoot?: string;
  workspaceRoot?: string;
  executionCwd?: string;
  branch?: string;
  workspaceKind?: 'detected' | 'managed';
  surface?: string;
  profileId?: string;
  profileVersion?: string;
  provider?: string;
  model?: string;
  reasoningMode?: string;
  permissionMode?: string;
  agentMode?: string;
  scope?: 'user' | 'managed-task-worker';
}

export interface RawTraceCounts {
  messages: number;
  activeMessages: number;
  lineageEntries: number;
  transcriptEntries: number;
  artifactLedgerEntries: number;
  toolUseEvents: number;
  toolResultEvents: number;
  compactions: number;
  branchSummaries: number;
  goalEvents: number;
}

export interface RawTraceRisk {
  level: RiskLevel;
  reasons: string[];
  containsSourceCodeHint: boolean;
  containsLocalPathHint: boolean;
  containsCredentialHint: boolean;
  containsCustomerDataHint: boolean;
  trainableByDefault: false;
}

export interface RawTrace {
  id: string;
  source: 'kodax';
  sourceSessionId: string;
  projectKey?: string;
  title: string;
  status: TraceStatus;
  ingestionStatus: IngestionStatus;
  createdAt?: string;
  importedAt: string;
  updatedAt: string;
  runtime: RawTraceRuntime;
  counts: RawTraceCounts;
  risk: RawTraceRisk;
  latestRevisionId: string;
  latestSourceHash: string;
}

export type RawTraceEventType =
  | 'message'
  | 'compaction'
  | 'branch_summary'
  | 'goal'
  | 'tool_call'
  | 'tool_use'
  | 'tool_result'
  | 'artifact'
  | 'error_metadata'
  | 'runtime_event'
  | 'trace_span'
  | 'handoff';

export type RawTraceEventSource =
  | 'kodax_session'
  | 'kodax_runtime_event'
  | 'kodax_tracing_span';

export interface RawTraceEvent {
  id: string;
  traceId: string;
  revisionId: string;
  source: RawTraceEventSource;
  sourceEntryId?: string;
  parentEntryId?: string | null;
  occurredAt: string;
  order: number;
  type: RawTraceEventType;
  role?: 'user' | 'assistant' | 'system';
  active?: boolean;
  label: string;
  preview: string;
  payload: unknown;
  riskLevel?: RiskLevel;
}

export type HarnessSnapshotStatus = 'draft' | 'candidate' | 'active' | 'archived';

export interface HarnessSnapshotComponents {
  promptHash?: string;
  contextPolicyHash?: string;
  skillManifestHash?: string;
  memoryPolicyHash?: string;
  toolRegistryHash?: string;
  workflowHash?: string;
  verifierHash?: string;
  runtimePolicyHash?: string;
}

export interface HarnessSnapshot {
  id: string;
  name: string;
  version: string;
  parentId?: string;
  status: HarnessSnapshotStatus;
  source: {
    repository?: string;
    commit?: string;
    profileId?: string;
    profileVersion?: string;
  };
  components: HarnessSnapshotComponents;
  compatibleModels: string[];
  changeSummary?: string;
  sourceTraceIds: string[];
  contentHash: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface HarnessSnapshotCreateInput {
  name: string;
  version: string;
  parentId?: string;
  status?: HarnessSnapshotStatus;
  source?: HarnessSnapshot['source'];
  components?: HarnessSnapshotComponents;
  compatibleModels?: string[];
  changeSummary?: string;
  sourceTraceIds?: string[];
  createdBy?: string;
}

export interface HarnessSnapshotDiff {
  baseId: string;
  headId: string;
  changedComponents: Array<{
    component: keyof HarnessSnapshotComponents;
    before?: string;
    after?: string;
  }>;
  sourceChanged: boolean;
  compatibleModelsChanged: boolean;
}

export type AgentEvaluationIssueCategory =
  | 'context'
  | 'skill'
  | 'memory'
  | 'tool_use'
  | 'planning'
  | 'verification'
  | 'runtime'
  | 'other';

export type AgentEvaluationIssueStatus = 'open' | 'evaluating' | 'validated' | 'rejected';

export interface AgentEvaluationIssue {
  id: string;
  title: string;
  description: string;
  category: AgentEvaluationIssueCategory;
  scopeTags: string[];
  sourceTraceIds: string[];
  primaryMetricId: string;
  owner: string;
  status: AgentEvaluationIssueStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AgentEvaluationIssueCreateInput {
  title: string;
  description?: string;
  category?: AgentEvaluationIssueCategory;
  scopeTags?: string[];
  sourceTraceIds?: string[];
  primaryMetricId?: string;
  owner?: string;
}

export type AgentBenchmarkCaseUsage = 'update_evidence' | 'validation';
export type AgentBenchmarkCaseStatus = 'draft' | 'ready' | 'archived';
export type AgentEvaluationGraderKind = 'manual' | 'trace_signal' | 'command' | 'artifact' | 'json_schema';

export interface AgentEvaluationGraderSpec {
  kind: AgentEvaluationGraderKind;
  version: string;
  config?: Record<string, unknown>;
}

export interface AgentBenchmarkCase {
  id: string;
  sourceTraceId?: string;
  usage: AgentBenchmarkCaseUsage;
  title: string;
  taskType: string;
  scopeTags: string[];
  inputRef: string;
  environmentRef?: string;
  expectedArtifactRefs: string[];
  grader: AgentEvaluationGraderSpec;
  critical: boolean;
  riskLevel: RiskLevel;
  status: AgentBenchmarkCaseStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentBenchmarkCaseCreateInput {
  sourceTraceId?: string;
  usage?: AgentBenchmarkCaseUsage;
  title: string;
  taskType?: string;
  scopeTags?: string[];
  inputRef?: string;
  environmentRef?: string;
  expectedArtifactRefs?: string[];
  grader?: AgentEvaluationGraderSpec;
  critical?: boolean;
  riskLevel?: RiskLevel;
  status?: AgentBenchmarkCaseStatus;
  createdBy?: string;
}

export interface AgentBenchmarkSuite {
  id: string;
  name: string;
  purpose: 'update_validation';
  issueId: string;
  caseIds: string[];
  version: string;
  status: 'draft' | 'frozen' | 'archived';
  snapshotHash?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentBenchmarkSuiteCreateInput {
  name: string;
  issueId: string;
  caseIds?: string[];
  version?: string;
  freeze?: boolean;
  createdBy?: string;
}

export type AgentEvaluationMetricDirection = 'increase' | 'decrease';
export type AgentEvaluationMetricAggregation = 'mean' | 'rate' | 'sum';
export type AgentEvaluationMetricRole = 'primary' | 'guardrail' | 'diagnostic';

export interface AgentEvaluationMetricDefinition {
  id: string;
  label: string;
  unit: 'score' | 'percent' | 'count' | 'tokens' | 'ms';
  direction: AgentEvaluationMetricDirection;
  aggregation: AgentEvaluationMetricAggregation;
  role: AgentEvaluationMetricRole;
  targetDelta?: number;
  maxCandidateValue?: number;
  maxDelta?: number;
}

export interface AgentEvaluationMetricValue {
  metricId: string;
  value: number;
}

export type AgentEvaluationExperimentStatus = 'draft' | 'running' | 'completed' | 'failed';

export interface AgentEvaluationExperiment {
  id: string;
  issueId: string;
  benchmarkSuiteId: string;
  modelSnapshot: {
    provider: string;
    model: string;
    version?: string;
  };
  baselineHarnessId: string;
  candidateHarnessId: string;
  runtimeSnapshotHash: string;
  evaluatorVersion: string;
  repetitions: number;
  metrics: AgentEvaluationMetricDefinition[];
  status: AgentEvaluationExperimentStatus;
  experimentHash: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface AgentEvaluationExperimentCreateInput {
  issueId: string;
  benchmarkSuiteId: string;
  modelSnapshot: AgentEvaluationExperiment['modelSnapshot'];
  baselineHarnessId: string;
  candidateHarnessId: string;
  runtimeSnapshotHash?: string;
  evaluatorVersion?: string;
  repetitions?: number;
  metrics?: AgentEvaluationMetricDefinition[];
  createdBy?: string;
}

export type AgentEvaluationArm = 'baseline' | 'candidate';
export type AgentEvaluationRolloutStatus = 'passed' | 'failed' | 'error';

export interface AgentEvaluationRollout {
  id: string;
  experimentId: string;
  arm: AgentEvaluationArm;
  caseId: string;
  repetition: number;
  sourceTraceId?: string;
  status: AgentEvaluationRolloutStatus;
  metrics: AgentEvaluationMetricValue[];
  evidenceIds: string[];
  note?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentEvaluationRolloutCreateInput {
  arm: AgentEvaluationArm;
  caseId: string;
  repetition?: number;
  sourceTraceId?: string;
  status: AgentEvaluationRolloutStatus;
  metrics?: AgentEvaluationMetricValue[];
  evidenceIds?: string[];
  note?: string;
  createdBy?: string;
}

export interface AgentEvaluationMetricSummary {
  metricId: string;
  value: number;
  samples: number;
}

export interface AgentEvaluationMetricDelta {
  metricId: string;
  baseline: number;
  candidate: number;
  delta: number;
  passed: boolean;
  reason: string;
}

export type AgentEvaluationVerdict = 'improved' | 'inconclusive' | 'regressed';

export interface AgentEvaluationComparisonReport {
  id: string;
  experimentId: string;
  verdict: AgentEvaluationVerdict;
  baselineSummary: AgentEvaluationMetricSummary[];
  candidateSummary: AgentEvaluationMetricSummary[];
  deltas: AgentEvaluationMetricDelta[];
  churn: {
    passToPass: number;
    failToPass: number;
    passToFail: number;
    failToFail: number;
    criticalRegressions: number;
  };
  reasons: string[];
  recommendation: string;
  reportHash: string;
  createdAt: string;
}

export type TraceOpsProductAreaId = 'data_access' | 'evaluation' | 'model_training';
export type TraceOpsCapabilityStatus = 'ready' | 'attention' | 'blocked' | 'idle';
export type TraceOpsProductVersion = '0.1.0' | '0.2.0' | '0.3.0';
export type TraceOpsReleaseStatus = 'current' | 'next' | 'planned';

export interface TraceOpsProductRelease {
  version: TraceOpsProductVersion;
  status: TraceOpsReleaseStatus;
  title: string;
  productAreaIds: TraceOpsProductAreaId[];
  scope: string;
  deliverable: string;
  acceptanceCriteria: string[];
  excludedCapabilities: string[];
  dependsOn?: TraceOpsProductVersion;
}

export interface TraceOpsCapabilityMetric {
  value: number;
  label: string;
  tone?: 'neutral' | 'good' | 'warn' | 'danger';
}

export interface TraceOpsCapabilityModule {
  id: string;
  title: string;
  purpose: string;
  status: TraceOpsCapabilityStatus;
  stageId: string;
  apiNamespace: string;
  metrics: TraceOpsCapabilityMetric[];
  responsibilities: string[];
}

export interface TraceOpsProductArea {
  id: TraceOpsProductAreaId;
  order: number;
  introducedIn: TraceOpsProductVersion;
  releaseStatus: TraceOpsReleaseStatus;
  title: string;
  shortTitle: string;
  purpose: string;
  status: TraceOpsCapabilityStatus;
  entryArtifact: string;
  exitArtifact: string;
  modules: TraceOpsCapabilityModule[];
}

export interface TraceOpsPlatformTransition {
  from: TraceOpsProductAreaId;
  to: TraceOpsProductAreaId;
  artifact: string;
  rule: string;
}

export interface TraceOpsPlatformArchitecture {
  version: 'traceops-platform-architecture-v1';
  currentVersion: TraceOpsProductVersion;
  generatedAt: string;
  releases: TraceOpsProductRelease[];
  areas: TraceOpsProductArea[];
  transitions: TraceOpsPlatformTransition[];
  evaluationBoundary: {
    agentEvaluation: string;
    modelEvaluation: string;
  };
  sharedFoundation: {
    title: string;
    purpose: string;
    stageId: string;
    capabilities: string[];
  };
}

export type KodaXRuntimeEventKind =
  | 'session_started'
  | 'session_updated'
  | 'message'
  | 'tool_use'
  | 'tool_result'
  | 'artifact'
  | 'workflow_phase'
  | 'child_agent'
  | 'handoff'
  | 'session_completed'
  | 'session_failed'
  | 'custom';

export interface KodaXRuntimeEventInput {
  eventId?: string;
  sessionId: string;
  projectKey?: string;
  title?: string;
  gitRoot?: string;
  scope?: RawTraceRuntime['scope'];
  runtime?: Partial<RawTraceRuntime>;
  kind: KodaXRuntimeEventKind;
  role?: RawTraceEvent['role'];
  label?: string;
  preview?: string;
  payload?: unknown;
  occurredAt?: string;
  parentEntryId?: string | null;
  sourceEntryId?: string;
  status?: TraceStatus;
}

export type KodaXTraceSpanKind =
  | 'agent'
  | 'model'
  | 'tool'
  | 'workflow'
  | 'handoff'
  | 'eval'
  | 'custom';

export interface KodaXTraceSpanInput {
  spanId?: string;
  traceId?: string;
  sessionId: string;
  projectKey?: string;
  title?: string;
  gitRoot?: string;
  scope?: RawTraceRuntime['scope'];
  runtime?: Partial<RawTraceRuntime>;
  kind: KodaXTraceSpanKind;
  name: string;
  parentSpanId?: string;
  startedAt?: string;
  endedAt?: string;
  status?: 'ok' | 'error' | 'cancelled';
  input?: unknown;
  output?: unknown;
  error?: unknown;
  attributes?: Record<string, unknown>;
}

export interface KodaXRuntimeIngestInput {
  events?: KodaXRuntimeEventInput[];
  spans?: KodaXTraceSpanInput[];
}

export interface KodaXRuntimeIngestResult {
  acceptedEvents: number;
  acceptedSpans: number;
  traces: RawTrace[];
}

export type EvidenceKind =
  | 'file_read'
  | 'file_modified'
  | 'file_created'
  | 'file_deleted'
  | 'path_scope'
  | 'search_scope'
  | 'command_scope'
  | 'check_result'
  | 'decision'
  | 'image_input'
  | 'tombstone';

export type RawEvidenceSource =
  | 'kodax_artifact_ledger'
  | 'kodax_tool_event'
  | 'kodax_runtime_span';

export interface RawEvidence {
  id: string;
  traceId: string;
  revisionId: string;
  source: RawEvidenceSource;
  sourceLedgerId: string;
  kind: EvidenceKind;
  sourceTool?: string;
  action?: string;
  target: string;
  displayTarget?: string;
  summary?: string;
  sessionEntryId?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
  riskLevel: RiskLevel;
}

export interface RawTraceRevision {
  id: string;
  traceId: string;
  sourceHash: string;
  sourceMessageCount: number;
  sourceLineageEntryCount: number;
  sourceArtifactCount: number;
  importedAt: string;
  rawSnapshotRef?: string;
}

export type TrainingSampleKind =
  | 'sft'
  | 'tool_use'
  | 'planning'
  | 'repair'
  | 'preference'
  | 'eval'
  | 'conversation'
  | 'tool_chain'
  | 'artifact_creation'
  | 'failure_recovery';

export type TrainingSampleStatus = 'candidate' | 'needs_review' | 'blocked';

export type DatasetExportFormat = 'traceops_jsonl' | 'fine_tune_jsonl' | 'review_jsonl' | 'eval_jsonl' | 'repair_jsonl';

export type TrainingSampleReviewDecision = 'approved' | 'rejected';

export interface TrainingSampleReview {
  decision: TrainingSampleReviewDecision;
  reviewer: string;
  note?: string;
  decidedAt: string;
}

export interface TrainingSampleReviewRecord extends TrainingSampleReview {
  sampleId: string;
  traceId: string;
  revisionId: string;
}

export interface TrainingSampleRepairRecord {
  sampleId: string;
  traceId: string;
  revisionId: string;
  cleanUserGoal?: string;
  cleanAssistantOutcome?: string;
  relinkedEvidenceIds: string[];
  evidenceGapNote?: string;
  note?: string;
  repairedBy: string;
  repairedAt: string;
}

export interface TrainingSampleEvidenceCandidate {
  sampleId: string;
  traceId: string;
  revisionId: string;
  evidenceId: string;
  evidence: RawEvidence;
  confidence: number;
  alreadyLinked: boolean;
  reasons: string[];
  matchedToolEventIds: string[];
}

export type MemoryCandidateKind =
  | 'workflow_pattern'
  | 'project_knowledge'
  | 'failure_recovery'
  | 'tool_practice'
  | 'decision_record';

export type MemoryCandidateStatus =
  | 'candidate'
  | 'needs_review'
  | 'promoted'
  | 'rejected'
  | 'blocked';

export type MemoryCandidateReviewDecision = 'promoted' | 'rejected';

export interface MemoryCandidateReview {
  decision: MemoryCandidateReviewDecision;
  reviewer: string;
  note?: string;
  decidedAt: string;
}

export interface MemoryCandidateReviewRecord extends MemoryCandidateReview {
  candidateId: string;
  traceId: string;
  revisionId: string;
}

export interface MemoryCandidate {
  id: string;
  traceId: string;
  revisionId: string;
  sourceSessionId: string;
  projectKey?: string;
  title: string;
  kind: MemoryCandidateKind;
  status: MemoryCandidateStatus;
  riskLevel: RiskLevel;
  confidence: number;
  summary: string;
  body: string;
  triggers: string[];
  blockers: string[];
  labels: string[];
  evidenceIds: string[];
  sourceEventIds: string[];
  sampleIds: string[];
  createdAt: string;
  updatedAt: string;
  metadata: {
    generatedBy: 'traceops-memory-distiller-v1';
    traceStatus: TraceStatus;
    riskReasons: string[];
    sourceSignals: string[];
    readyForMemoryBase: boolean;
  };
  review?: MemoryCandidateReview;
}

export type TrainingTextRedactionType =
  | 'thinking_marker'
  | 'local_path'
  | 'credential'
  | 'email'
  | 'localhost_url';

export interface TrainingTextRedaction {
  type: TrainingTextRedactionType;
  count: number;
  replacement: string;
}

export interface TrainingTextDistillation {
  version: 'kodax-clean-text-v1';
  redactions: TrainingTextRedaction[];
  redactionCount: number;
  removedThinking: boolean;
  cleanLength: number;
}

export type TrainingSampleQualityGrade = 'excellent' | 'good' | 'review' | 'blocked';
export type TrainingSampleQualityImpact = 'positive' | 'warning' | 'negative';

export interface TrainingSampleQualitySignal {
  label: string;
  impact: TrainingSampleQualityImpact;
  detail: string;
}

export interface TrainingSampleQuality {
  score: number;
  grade: TrainingSampleQualityGrade;
  signals: TrainingSampleQualitySignal[];
}

export interface TrainingSample {
  id: string;
  traceId: string;
  revisionId: string;
  source: 'raw_trace' | 'feedback_loop';
  sourceSessionId: string;
  projectKey?: string;
  title: string;
  kind: TrainingSampleKind;
  status: TrainingSampleStatus;
  trainable: boolean;
  riskLevel: RiskLevel;
  quality: TrainingSampleQuality;
  blockers: string[];
  labels: string[];
  promptPreview: string;
  responsePreview: string;
  toolEventCount: number;
  evidenceCount: number;
  eventCount: number;
  createdAt: string;
  updatedAt: string;
  input: {
    userGoal?: string;
    cleanUserGoal?: string;
    runtime: RawTraceRuntime;
    toolEventIds: string[];
    evidenceIds: string[];
    sourceEventIds?: string[];
  };
  output: {
    assistantOutcome?: string;
    cleanAssistantOutcome?: string;
    finalEventId?: string;
  };
  metadata: {
    generatedBy: 'traceops-p0-sampler' | 'traceops-feedback-loop-v1';
    traceStatus: TraceStatus;
    ingestionStatus: IngestionStatus;
    riskReasons: string[];
    distillation: {
      version: 'kodax-clean-text-v1';
      redactionCount: number;
      removedThinking: boolean;
      readyForFineTune: boolean;
    };
    datasetBuilder?: {
      version: 'kodax-dataset-builder-v1' | 'traceops-feedback-dataset-builder-v1';
      sourceSignals: string[];
    };
    feedbackLoop?: {
      feedbackLoopId: string;
      postReleaseMonitorId: string;
      deploymentHandoffId: string;
      modelReleaseGateId: string;
      trainingRunId: string;
      evalRunId?: string;
      releasePackageId: string;
      sourceDatasetVersionId: string;
      loopHash: string;
      monitorHash: string;
      deploymentHandoffHash: string;
      modelReleaseGateHash: string;
      trainingRunHash: string;
      evalRunHash?: string;
      evalStatus?: DatasetEvalRunStatus;
      releaseEvidenceHash?: string;
      releasePackageHash: string;
      targetKind: DatasetFeedbackLoopTargetKind;
      severity: DatasetFeedbackLoopSeverity;
      monitorStatus: DatasetPostReleaseMonitorStatus;
      environment: string;
    };
  };
  review?: TrainingSampleReview;
  repair?: TrainingSampleRepairRecord;
}

export type CleanTraceStatus = 'ready' | 'needs_review' | 'blocked';
export type CleanTraceEvidenceCoverageStatus = 'complete' | 'partial' | 'missing' | 'not_required';

export interface CleanTraceEventSummary {
  eventId: string;
  occurredAt: string;
  type: RawTraceEventType;
  label: string;
  preview: string;
  active?: boolean;
  riskLevel?: RiskLevel;
}

export interface CleanTrace {
  id: string;
  traceId: string;
  revisionId: string;
  sourceSessionId: string;
  projectKey?: string;
  title: string;
  kind: TrainingSampleKind;
  status: CleanTraceStatus;
  candidateStatus: TrainingSampleStatus;
  trainable: boolean;
  riskLevel: RiskLevel;
  quality: TrainingSampleQuality;
  blockers: string[];
  cleanUserGoal?: string;
  cleanAssistantOutcome?: string;
  rawUserGoal?: string;
  rawAssistantOutcome?: string;
  summary: {
    userGoal: string;
    assistantOutcome: string;
    execution: string;
    evidence: string;
    governance: string;
  };
  cleaning: {
    policyVersion: 'kodax-clean-text-v1';
    rawEventCount: number;
    keptEventCount: number;
    droppedEventCount: number;
    compressionRatio: number;
    redactions: TrainingTextRedaction[];
    removedEventTypes: Partial<Record<RawTraceEventType, number>>;
  };
  evidenceCoverage: {
    status: CleanTraceEvidenceCoverageStatus;
    linkedEvidenceCount: number;
    toolEventCount: number;
    evidenceGapCount: number;
    notes: string[];
  };
  timelinePreview: CleanTraceEventSummary[];
  redactionCount: number;
  removedThinking: boolean;
  readyForFineTune: boolean;
  metrics: {
    toolEventCount: number;
    evidenceCount: number;
    eventCount: number;
  };
  sourceEventIds: string[];
  evidenceIds: string[];
  policies: {
    samplerVersion: 'traceops-p0-sampler' | 'traceops-feedback-loop-v1';
    cleaningPolicyVersion: 'kodax-clean-text-v1';
    redactionPolicyVersion: 'kodax-clean-text-v1';
  };
  review?: TrainingSampleReview;
  createdAt: string;
  updatedAt: string;
}

export type DatasetExportRunStatus = 'active' | 'revoked';
export type DatasetExportRunSource = 'training_sample_query' | 'dataset_version';

export interface DatasetExportRiskSummary {
  L0: number;
  L1: number;
  L2: number;
  L3: number;
  L4: number;
  highRisk: number;
  blocked: number;
  unreviewed: number;
  missingEvidence: number;
}

export interface DatasetExportRevocation {
  revokedAt: string;
  revokedBy: string;
  reason: string;
}

export interface DatasetExportRun {
  id: string;
  status: DatasetExportRunStatus;
  source: DatasetExportRunSource;
  format: DatasetExportFormat;
  filename: string;
  filters: Record<string, string>;
  sampleIds: string[];
  traceIds: string[];
  datasetVersionId?: string;
  datasetVersionName?: string;
  snapshotHash?: string;
  exported: number;
  skipped: number;
  totals: Record<TrainingSampleStatus, number>;
  riskSummary: DatasetExportRiskSummary;
  generatedAt: string;
  generatedBy: string;
  revocation?: DatasetExportRevocation;
}

export type DatasetReleaseGateStatus = 'ready' | 'review' | 'blocked';
export type DatasetReleaseGateSeverity = 'pass' | 'warn' | 'block';
export type DatasetReleaseGateActionDecision = 'resolved' | 'waived' | 'acknowledged' | 'reopened';

export interface DatasetReleaseGateActionRecord {
  id: string;
  datasetVersionId: string;
  checkId: string;
  decision: DatasetReleaseGateActionDecision;
  severity: DatasetReleaseGateSeverity;
  note?: string;
  decidedAt: string;
  decidedBy: string;
}

export interface DatasetReleaseGateCheck {
  id: string;
  label: string;
  detail: string;
  metric: string;
  severity: DatasetReleaseGateSeverity;
  effectiveSeverity: DatasetReleaseGateSeverity;
  locked?: boolean;
  action?: DatasetReleaseGateActionRecord;
}

export interface DatasetReleaseGate {
  status: DatasetReleaseGateStatus;
  score: number;
  checks: DatasetReleaseGateCheck[];
  blockCount: number;
  warnCount: number;
  passCount: number;
  originalBlockCount: number;
  originalWarnCount: number;
  actionedCount: number;
  releaseBlocked: boolean;
  recommendation: string;
}

export type DatasetReleaseManifestStatus = 'ready' | 'review' | 'blocked';
export type DatasetReleasePromotionStatus = 'promoted' | 'revoked';
export type DatasetReleaseManifestPromotionState = 'not_promoted' | DatasetReleasePromotionStatus;

export interface DatasetReleasePromotionRecord {
  id: string;
  manifestId: string;
  datasetVersionId: string;
  datasetVersionName: string;
  manifestHash: string;
  status: DatasetReleasePromotionStatus;
  promotedAt: string;
  promotedBy: string;
  note?: string;
  revokedAt?: string;
  revokedBy?: string;
  revokeReason?: string;
}

export interface DatasetReleasePackage {
  id: string;
  packageVersion: 'traceops-release-package-v1';
  promotionId: string;
  manifestId: string;
  datasetVersionId: string;
  datasetVersionName: string;
  packageHash: string;
  manifestHash: string;
  snapshotHash?: string;
  promotion: DatasetReleasePromotionRecord;
  manifest: DatasetReleaseManifest;
  exportUrls: Record<DatasetExportFormat, string>;
  approvals: {
    releaseGate: DatasetReleaseGate;
    diffReviewStatus?: DatasetVersionDiffReviewStatus;
    diffReview?: DatasetVersionDiffReviewRecord;
    promotion: DatasetReleasePromotionRecord;
  };
  trainingEntry: {
    defaultFormat: DatasetExportFormat;
    defaultExportUrl: string;
    traceopsExportUrl: string;
    reviewExportUrl: string;
    packageUrl: string;
  };
  summaries: {
    samples: number;
    traces: number;
    risk: DatasetExportRiskSummary;
    review: DatasetReleaseManifest['reviewSummary'];
    quality: DatasetReleaseManifest['qualitySummary'];
    evidence: DatasetReleaseManifest['evidenceSummary'];
    kind: Record<string, number>;
    project: Record<string, number>;
  };
  generatedAt: string;
  generatedBy: string;
}

export type DatasetRetrainingHandoffStatus = 'queued' | 'in_progress' | 'completed' | 'cancelled';
export type DatasetRetrainingHandoffChecklistStatus = 'open' | 'done';

export interface DatasetRetrainingHandoffChecklistItem {
  id: string;
  label: string;
  status: DatasetRetrainingHandoffChecklistStatus;
}

export interface DatasetRetrainingHandoffRecord {
  id: string;
  handoffVersion: 'traceops-retraining-handoff-v1';
  status: DatasetRetrainingHandoffStatus;
  releasePackageId: string;
  releasePackageHash: string;
  promotionId: string;
  manifestId: string;
  datasetVersionId: string;
  datasetVersionName: string;
  trainingOwner: string;
  targetSystem: string;
  defaultFormat: DatasetExportFormat;
  defaultExportUrl: string;
  traceopsExportUrl: string;
  reviewExportUrl: string;
  packageUrl: string;
  handoffHash: string;
  approvals: DatasetReleasePackage['approvals'];
  summaries: DatasetReleasePackage['summaries'];
  checklist: DatasetRetrainingHandoffChecklistItem[];
  createdAt: string;
  createdBy: string;
  note?: string;
}

export interface DatasetManifestRetrainingHandoffResult {
  manifest: DatasetReleaseManifest;
  promotion: DatasetReleasePromotionRecord;
  releasePackage: DatasetReleasePackage;
  handoff: DatasetRetrainingHandoffRecord;
  createdPromotion: boolean;
  createdHandoff: boolean;
}

export type DatasetClosedLoopRetrainingReadiness =
  | 'needs_diff_review'
  | 'needs_manifest'
  | 'needs_handoff'
  | 'needs_training_run'
  | 'training_running'
  | 'needs_model_gate'
  | 'model_gate_blocked'
  | 'needs_model_approval'
  | 'needs_deployment_handoff'
  | 'deployment_handoff_ready'
  | 'needs_post_release_monitor'
  | 'monitoring_ready'
  | 'monitoring_attention'
  | 'monitoring_rollback'
  | 'needs_feedback_loop'
  | 'feedback_loop_ready'
  | 'next_dataset_ready'
  | 'deployment_live'
  | 'deployment_rolled_back';

export type DatasetClosedLoopRetrainingNextAction =
  | 'review_diff'
  | 'create_manifest'
  | 'create_handoff'
  | 'launch_training'
  | 'watch_training'
  | 'create_model_gate'
  | 'review_model_gate'
  | 'create_deployment_handoff'
  | 'review_deployment'
  | 'run_rollout'
  | 'create_post_release_monitor'
  | 'watch_monitor'
  | 'write_feedback_signal'
  | 'review_feedback_loop'
  | 'build_next_dataset'
  | 'complete';

export interface DatasetClosedLoopRetrainingPlan {
  id: string;
  planVersion: 'traceops-closed-loop-retraining-plan-v1';
  datasetVersionId: string;
  datasetVersionName: string;
  datasetSource: DatasetVersion['source'];
  sampleCount: number;
  format: DatasetExportFormat;
  feedbackLoopIds: string[];
  feedbackLoopSummary?: DatasetVersion['feedbackLoopSummary'];
  sourceDatasetVersionIds: string[];
  postReleaseMonitorIds: string[];
  evalRunIds: string[];
  releaseEvidenceHashes: string[];
  releaseGate: {
    status: DatasetReleaseGateStatus;
    score: number;
    passCount: number;
    warnCount: number;
    blockCount: number;
  };
  diffReviewStatus?: DatasetVersionDiffReviewStatus;
  diffReviewRecommendation?: string;
  manifest?: {
    id: string;
    status: DatasetReleaseManifestStatus;
    manifestHash: string;
    promotionStatus?: DatasetReleaseManifestPromotionState;
    generatedAt: string;
  };
  retrainingHandoff?: {
    id: string;
    status: DatasetRetrainingHandoffStatus;
    handoffHash: string;
    trainingOwner: string;
    targetSystem: string;
  };
  trainingRun?: {
    id: string;
    status: DatasetTrainingRunStatus;
    qualityGate: DatasetTrainingRunGateStatus;
    runHash: string;
    modelName: string;
  };
  evalRun?: {
    id: string;
    status: DatasetEvalRunStatus;
    evalHash: string;
  };
  modelReleaseGate?: {
    id: string;
    status: DatasetModelReleaseGateStatus;
    gateHash: string;
    evalRunId?: string;
    evalStatus?: DatasetEvalRunStatus;
    approvedAt?: string;
  };
  deploymentHandoff?: {
    id: string;
    status: DatasetDeploymentHandoffStatus;
    handoffHash: string;
    environment: string;
    deploymentOwner: string;
    updatedAt: string;
  };
  postReleaseMonitor?: {
    id: string;
    status: DatasetPostReleaseMonitorStatus;
    monitorHash: string;
    environment: string;
    monitorOwner: string;
    rollbackSignal: boolean;
    recommendedAction: string;
    updatedAt: string;
    signalSummary?: DatasetPostReleaseMonitorRecord['signalSummary'];
  };
  downstreamFeedbackLoop?: {
    id: string;
    status: DatasetFeedbackLoopStatus;
    severity: DatasetFeedbackLoopSeverity;
    targetKind: DatasetFeedbackLoopTargetKind;
    loopHash: string;
    updatedAt: string;
  };
  downstreamDatasetVersion?: {
    id: string;
    name: string;
    sampleCount: number;
    format: DatasetExportFormat;
    createdAt: string;
  };
  readiness: DatasetClosedLoopRetrainingReadiness;
  nextAction: DatasetClosedLoopRetrainingNextAction;
  recommendation: string;
  generatedAt: string;
}

export interface DatasetClosedLoopRetrainingApplyResult {
  plan: DatasetClosedLoopRetrainingPlan;
  diffReview?: DatasetVersionDiffReviewApplyResult;
  manifest?: DatasetReleaseManifest;
  handoffResult?: DatasetManifestRetrainingHandoffResult;
}

export interface DatasetClosedLoopTrainingCycleResult {
  plan: DatasetClosedLoopRetrainingPlan;
  handoffPreparation?: DatasetClosedLoopRetrainingApplyResult;
  trainingRun: DatasetTrainingRunRecord;
  evalRun?: DatasetEvalRunRecord;
  evalResult?: DatasetEvalRunApplyResult;
  createdTrainingRun: boolean;
  createdEvalRun: boolean;
}

export interface DatasetClosedLoopModelGateResult {
  plan: DatasetClosedLoopRetrainingPlan;
  trainingCycle?: DatasetClosedLoopTrainingCycleResult;
  modelReleaseGate: DatasetModelReleaseGateRecord;
  createdModelGate: boolean;
}

export interface DatasetClosedLoopCandidateCycleResult {
  plan: DatasetClosedLoopRetrainingPlan;
  modelGateResult: DatasetClosedLoopModelGateResult;
  trainingCycle?: DatasetClosedLoopTrainingCycleResult;
  modelReleaseGate: DatasetModelReleaseGateRecord;
  createdModelGate: boolean;
}

export interface DatasetClosedLoopDeploymentHandoffResult {
  plan: DatasetClosedLoopRetrainingPlan;
  modelGateResult?: DatasetClosedLoopModelGateResult;
  deploymentHandoff: DatasetDeploymentHandoffRecord;
  createdDeploymentHandoff: boolean;
}

export interface DatasetClosedLoopApprovalDeploymentResult {
  plan: DatasetClosedLoopRetrainingPlan;
  modelReleaseGate: DatasetModelReleaseGateRecord;
  approvedModelGate: boolean;
  deploymentResult: DatasetClosedLoopDeploymentHandoffResult;
  deploymentHandoff: DatasetDeploymentHandoffRecord;
  createdDeploymentHandoff: boolean;
}

export interface DatasetClosedLoopRolloutResult {
  plan: DatasetClosedLoopRetrainingPlan;
  deploymentResult?: DatasetClosedLoopDeploymentHandoffResult;
  deploymentHandoff: DatasetDeploymentHandoffRecord;
  postReleaseMonitor: DatasetPostReleaseMonitorRecord;
  createdPostReleaseMonitor: boolean;
  advancedStatuses: DatasetDeploymentHandoffStatus[];
}

export type DatasetClosedLoopFeedbackSignalMode = 'healthy' | 'attention' | 'rollback';

export interface DatasetClosedLoopFeedbackSignalResult {
  plan: DatasetClosedLoopRetrainingPlan;
  rolloutResult?: DatasetClosedLoopRolloutResult;
  postReleaseMonitor: DatasetPostReleaseMonitorRecord;
  feedbackLoop?: DatasetFeedbackLoopRecord;
  createdFeedbackLoop: boolean;
  mode: DatasetClosedLoopFeedbackSignalMode;
}

export interface DatasetClosedLoopNextDatasetResult {
  sourcePlan: DatasetClosedLoopRetrainingPlan;
  nextPlan?: DatasetClosedLoopRetrainingPlan;
  feedbackLoop: DatasetFeedbackLoopRecord;
  datasetVersion: DatasetVersion;
  handoffPreparation?: DatasetClosedLoopRetrainingApplyResult;
  promotedFeedbackLoop: boolean;
  createdDatasetVersion: boolean;
  preparedRetrainingHandoff: boolean;
}

export type DatasetTrainingRunStatus = 'planned' | 'running' | 'evaluating' | 'passed' | 'failed' | 'rolled_back' | 'cancelled';
export type DatasetTrainingRunGateStatus = 'pending' | 'passed' | 'failed';
export type DatasetTrainingRunMetricUnit = 'score' | 'percent' | 'count';
export type DatasetTrainingLaunchObjective = 'sft' | 'eval' | 'repair' | 'mixed';
export type DatasetTrainingLaunchReadiness = 'ready' | 'review' | 'blocked';
export type DatasetTrainingLaunchCheckStatus = 'pass' | 'review' | 'block';
export type DatasetTrainingLaunchMetricDirection = 'gte' | 'lte';
export type DatasetTrainingProvider = 'manual' | 'openai_fine_tuning' | 'custom_http';
export type DatasetTrainingProviderLaunchStatus = 'prepared' | 'submitted' | 'accepted' | 'failed';
export type DatasetTrainingProviderStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled' | 'unknown';

export interface DatasetTrainingRunMetric {
  id: string;
  label: string;
  value: number;
  target: number;
  unit: DatasetTrainingRunMetricUnit;
  gate: DatasetTrainingRunGateStatus;
}

export interface DatasetTrainingLaunchParameter {
  id: string;
  label: string;
  value: string | number | boolean;
  unit?: string;
  locked?: boolean;
}

export interface DatasetTrainingLaunchCheck {
  id: string;
  label: string;
  status: DatasetTrainingLaunchCheckStatus;
  detail: string;
}

export interface DatasetTrainingLaunchEvalMetric {
  id: string;
  label: string;
  target: number;
  unit: DatasetTrainingRunMetricUnit;
  direction: DatasetTrainingLaunchMetricDirection;
}

export interface DatasetTrainingLaunchPlan {
  id: string;
  planVersion: 'traceops-training-launch-plan-v1';
  handoffId: string;
  handoffHash: string;
  releasePackageId: string;
  releasePackageHash: string;
  promotionId: string;
  manifestId: string;
  datasetVersionId: string;
  datasetVersionName: string;
  defaultFormat: DatasetExportFormat;
  objective: DatasetTrainingLaunchObjective;
  targetSystem: string;
  recommendedModelName: string;
  trainingDataUrl: string;
  reviewDataUrl: string;
  packageUrl: string;
  parameters: DatasetTrainingLaunchParameter[];
  evalMetrics: DatasetTrainingLaunchEvalMetric[];
  rollbackCriteria: string;
  checks: DatasetTrainingLaunchCheck[];
  readiness: DatasetTrainingLaunchReadiness;
  recommendation: string;
  launchHash: string;
  generatedAt: string;
}

export interface DatasetTrainingProviderLaunchRecord {
  id: string;
  provider: DatasetTrainingProvider;
  status: DatasetTrainingProviderLaunchStatus;
  endpoint?: string;
  requestPayload: unknown;
  requestHash: string;
  responseStatus?: number;
  responseBodyPreview?: string;
  externalRunId?: string;
  errorMessage?: string;
  createdAt: string;
  submittedAt?: string;
  submittedBy: string;
}

export interface DatasetTrainingProviderStatusRecord {
  id: string;
  provider: DatasetTrainingProvider;
  providerStatus: DatasetTrainingProviderStatus;
  mappedRunStatus: DatasetTrainingRunStatus;
  endpoint?: string;
  externalRunId?: string;
  responseStatus?: number;
  responseBodyPreview?: string;
  responseHash?: string;
  checkedAt: string;
  checkedBy: string;
  note?: string;
  errorMessage?: string;
}

export interface DatasetTrainingRunRecord {
  id: string;
  runVersion: 'traceops-training-run-v1';
  status: DatasetTrainingRunStatus;
  qualityGate: DatasetTrainingRunGateStatus;
  handoffId: string;
  handoffHash: string;
  releasePackageId: string;
  releasePackageHash: string;
  promotionId: string;
  manifestId: string;
  datasetVersionId: string;
  datasetVersionName: string;
  owner: string;
  targetSystem: string;
  modelName: string;
  modelVersion?: string;
  externalRunId?: string;
  defaultFormat: DatasetExportFormat;
  trainingDataUrl: string;
  reviewDataUrl: string;
  packageUrl: string;
  handoffUrl: string;
  launchPlan?: DatasetTrainingLaunchPlan;
  launchPlanHash?: string;
  providerLaunches?: DatasetTrainingProviderLaunchRecord[];
  providerStatusChecks?: DatasetTrainingProviderStatusRecord[];
  lastProviderStatus?: DatasetTrainingProviderStatus;
  runHash: string;
  metrics: DatasetTrainingRunMetric[];
  rollbackCriteria: string;
  rollbackRequired: boolean;
  resultSummary?: string;
  createdAt: string;
  createdBy: string;
  startedAt?: string;
  completedAt?: string;
  updatedAt: string;
  note?: string;
}

export type DatasetEvalRunStatus = 'passed' | 'failed';
export type DatasetEvalRunCaseStatus = 'passed' | 'failed' | 'warning';

export interface DatasetEvalRunCase {
  id: string;
  label: string;
  category: 'launch_contract' | 'package_integrity' | 'metric_gate' | 'rollback_guardrail' | 'lineage';
  status: DatasetEvalRunCaseStatus;
  score: number;
  target: number;
  detail: string;
  evidenceIds?: string[];
}

export interface DatasetEvalRunRecord {
  id: string;
  runnerVersion: 'traceops-local-eval-runner-v1';
  status: DatasetEvalRunStatus;
  trainingRunId: string;
  trainingRunHash: string;
  launchPlanId?: string;
  launchPlanHash?: string;
  handoffId: string;
  handoffHash: string;
  releasePackageId: string;
  releasePackageHash: string;
  datasetVersionId: string;
  datasetVersionName: string;
  modelName: string;
  modelVersion?: string;
  externalRunId?: string;
  objective?: DatasetTrainingLaunchObjective;
  metrics: DatasetTrainingRunMetric[];
  cases: DatasetEvalRunCase[];
  summary: string;
  evalHash: string;
  startedAt: string;
  completedAt: string;
  createdBy: string;
  note?: string;
}

export interface DatasetEvalRunApplyResult {
  evalRun: DatasetEvalRunRecord;
  trainingRun: DatasetTrainingRunRecord;
}

export type DatasetModelReleaseGateStatus = 'ready' | 'blocked' | 'approved' | 'rejected';
export type DatasetModelReleaseGateDecision = 'approved' | 'rejected' | 'reopened';
export type DatasetModelReleaseGateCheckStatus = 'passed' | 'failed';

export interface DatasetModelReleaseGateCheck {
  id: string;
  label: string;
  detail: string;
  metric: string;
  status: DatasetModelReleaseGateCheckStatus;
}

export interface DatasetModelReleaseGateDecisionRecord {
  id: string;
  gateId: string;
  decision: DatasetModelReleaseGateDecision;
  note?: string;
  decidedAt: string;
  decidedBy: string;
}

export interface DatasetModelReleaseGateRecord {
  id: string;
  gateVersion: 'traceops-model-release-gate-v1';
  status: DatasetModelReleaseGateStatus;
  trainingRunId: string;
  trainingRunHash: string;
  handoffId: string;
  handoffHash: string;
  releasePackageId: string;
  releasePackageHash: string;
  promotionId: string;
  manifestId: string;
  datasetVersionId: string;
  datasetVersionName: string;
  modelName: string;
  modelVersion?: string;
  externalRunId?: string;
  owner: string;
  targetSystem: string;
  qualityGate: DatasetTrainingRunGateStatus;
  rollbackRequired: boolean;
  evalRunId?: string;
  evalRunHash?: string;
  evalRunnerVersion?: DatasetEvalRunRecord['runnerVersion'];
  evalStatus?: DatasetEvalRunStatus;
  evalSummary?: string;
  evalCaseSummary?: {
    passed: number;
    warning: number;
    failed: number;
  };
  checks: DatasetModelReleaseGateCheck[];
  metrics: DatasetTrainingRunMetric[];
  gateHash: string;
  decisions: DatasetModelReleaseGateDecisionRecord[];
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  note?: string;
}

export type DatasetDeploymentHandoffStatus = 'queued' | 'preparing' | 'ready_for_rollout' | 'live' | 'rolled_back' | 'cancelled';
export type DatasetDeploymentHandoffChecklistStatus = 'open' | 'done';

export interface DatasetDeploymentHandoffChecklistItem {
  id: string;
  label: string;
  status: DatasetDeploymentHandoffChecklistStatus;
}

export interface DatasetDeploymentHandoffEvent {
  id: string;
  status: DatasetDeploymentHandoffStatus;
  note?: string;
  recordedAt: string;
  recordedBy: string;
}

export interface DatasetDeploymentHandoffRecord {
  id: string;
  handoffVersion: 'traceops-deployment-handoff-v1';
  status: DatasetDeploymentHandoffStatus;
  modelReleaseGateId: string;
  modelReleaseGateHash: string;
  trainingRunId: string;
  trainingRunHash: string;
  evalRunId?: string;
  evalRunHash?: string;
  evalRunnerVersion?: DatasetEvalRunRecord['runnerVersion'];
  evalStatus?: DatasetEvalRunStatus;
  evalCaseSummary?: DatasetModelReleaseGateRecord['evalCaseSummary'];
  modelGateCheckSummary?: {
    passed: number;
    failed: number;
  };
  retrainingHandoffId: string;
  retrainingHandoffHash: string;
  releasePackageId: string;
  releasePackageHash: string;
  promotionId: string;
  manifestId: string;
  datasetVersionId: string;
  datasetVersionName: string;
  modelName: string;
  modelVersion?: string;
  externalRunId?: string;
  deploymentOwner: string;
  environment: string;
  rolloutStrategy: string;
  rollbackPlan: string;
  monitoringPlan: string;
  trainingDataUrl: string;
  packageUrl: string;
  modelGateUrl: string;
  evalRunUrl?: string;
  handoffHash: string;
  checklist: DatasetDeploymentHandoffChecklistItem[];
  events: DatasetDeploymentHandoffEvent[];
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  note?: string;
}

export type DatasetPostReleaseMonitorStatus = 'watching' | 'healthy' | 'attention' | 'rollback_required' | 'closed';
export type DatasetPostReleaseMetricGate = 'pending' | 'passed' | 'warning' | 'failed';
export type DatasetPostReleaseMetricDirection = 'min' | 'max';
export type DatasetPostReleaseMetricUnit = 'percent' | 'count' | 'ms';
export type DatasetPostReleaseAlertSeverity = 'info' | 'warning' | 'critical';

export interface DatasetPostReleaseMetric {
  id: string;
  label: string;
  value: number;
  target: number;
  unit: DatasetPostReleaseMetricUnit;
  direction: DatasetPostReleaseMetricDirection;
  gate: DatasetPostReleaseMetricGate;
}

export interface DatasetPostReleaseAlert {
  id: string;
  severity: DatasetPostReleaseAlertSeverity;
  label: string;
  detail: string;
  createdAt: string;
}

export interface DatasetPostReleaseMonitorEvent {
  id: string;
  status: DatasetPostReleaseMonitorStatus;
  metrics: DatasetPostReleaseMetric[];
  alerts: DatasetPostReleaseAlert[];
  rollbackSignal: boolean;
  recommendedAction: string;
  note?: string;
  recordedAt: string;
  recordedBy: string;
}

export interface DatasetPostReleaseMonitorRecord {
  id: string;
  monitorVersion: 'traceops-post-release-monitor-v1';
  status: DatasetPostReleaseMonitorStatus;
  deploymentHandoffId: string;
  deploymentHandoffHash: string;
  modelReleaseGateId: string;
  modelReleaseGateHash: string;
  trainingRunId: string;
  trainingRunHash: string;
  evalRunId?: string;
  evalRunHash?: string;
  evalStatus?: DatasetEvalRunStatus;
  evalCaseSummary?: DatasetModelReleaseGateRecord['evalCaseSummary'];
  modelGateCheckSummary?: DatasetDeploymentHandoffRecord['modelGateCheckSummary'];
  deploymentChecklistSummary?: {
    done: number;
    total: number;
  };
  releaseEvidenceHash?: string;
  signalSummary?: {
    passed: number;
    warning: number;
    failed: number;
    pending: number;
    severity: DatasetFeedbackLoopSeverity;
    targetKind: DatasetFeedbackLoopTargetKind;
  };
  releasePackageId: string;
  releasePackageHash: string;
  datasetVersionId: string;
  datasetVersionName: string;
  modelName: string;
  modelVersion?: string;
  environment: string;
  monitorOwner: string;
  metrics: DatasetPostReleaseMetric[];
  alerts: DatasetPostReleaseAlert[];
  rollbackSignal: boolean;
  recommendedAction: string;
  monitorHash: string;
  events: DatasetPostReleaseMonitorEvent[];
  startedAt: string;
  updatedAt: string;
  closedAt?: string;
  createdBy: string;
  note?: string;
}

export type DatasetFeedbackLoopStatus = 'candidate' | 'triaged' | 'promoted' | 'rejected';
export type DatasetFeedbackLoopSeverity = 'info' | 'warning' | 'critical';
export type DatasetFeedbackLoopTargetKind = 'sft' | 'eval' | 'repair' | 'memory';
export type DatasetFeedbackLoopDecision = 'triaged' | 'promoted' | 'rejected' | 'reopened';

export interface DatasetFeedbackLoopDecisionRecord {
  id: string;
  feedbackLoopId: string;
  decision: DatasetFeedbackLoopDecision;
  note?: string;
  decidedAt: string;
  decidedBy: string;
}

export interface DatasetFeedbackLoopRecord {
  id: string;
  loopVersion: 'traceops-feedback-loop-v1';
  status: DatasetFeedbackLoopStatus;
  severity: DatasetFeedbackLoopSeverity;
  targetKind: DatasetFeedbackLoopTargetKind;
  postReleaseMonitorId: string;
  postReleaseMonitorHash: string;
  deploymentHandoffId: string;
  deploymentHandoffHash: string;
  modelReleaseGateId: string;
  modelReleaseGateHash: string;
  trainingRunId: string;
  trainingRunHash: string;
  evalRunId?: string;
  evalRunHash?: string;
  evalStatus?: DatasetEvalRunStatus;
  releaseEvidenceHash?: string;
  releasePackageId: string;
  releasePackageHash: string;
  datasetVersionId: string;
  datasetVersionName: string;
  modelName: string;
  modelVersion?: string;
  environment: string;
  monitorStatus: DatasetPostReleaseMonitorStatus;
  rollbackSignal: boolean;
  alerts: DatasetPostReleaseAlert[];
  metrics: DatasetPostReleaseMetric[];
  title: string;
  summary: string;
  evidencePrompt: string;
  recommendedAction: string;
  loopHash: string;
  decisions: DatasetFeedbackLoopDecisionRecord[];
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  note?: string;
}

export interface DatasetReleaseManifest {
  id: string;
  datasetVersionId: string;
  datasetVersionName: string;
  status: DatasetReleaseManifestStatus;
  format: DatasetExportFormat;
  filename: string;
  manifestHash: string;
  snapshotHash?: string;
  sampleCount: number;
  traceCount: number;
  sampleIds: string[];
  traceIds: string[];
  releaseGate: DatasetReleaseGate;
  riskSummary: DatasetExportRiskSummary;
  reviewSummary: {
    approved: number;
    rejected: number;
    unreviewed: number;
  };
  qualitySummary: {
    averageQuality: number;
    blockedQuality: number;
    readyForFineTune: number;
  };
  evidenceSummary: {
    toolBacked: number;
    evidenceBacked: number;
    missingEvidence: number;
  };
  kindSummary: Record<string, number>;
  projectSummary: Record<string, number>;
  diffReviewStatus?: DatasetVersionDiffReviewStatus;
  diffReview?: DatasetVersionDiffReviewRecord;
  promotionStatus?: DatasetReleaseManifestPromotionState;
  promotion?: DatasetReleasePromotionRecord;
  policies?: DatasetVersion['policies'];
  exportUrls: Record<DatasetExportFormat, string>;
  generatedAt: string;
  generatedBy: string;
  notes?: string;
}

export type DatasetVersionDiffChangeKind = 'added' | 'removed' | 'changed' | 'unchanged';
export type DatasetVersionDiffImportance = 'high' | 'medium' | 'low';
export type DatasetVersionDiffReviewDecision = 'approved' | 'changes_requested' | 'risk_accepted' | 'reopened';
export type DatasetVersionDiffReviewStatus = 'pending' | DatasetVersionDiffReviewDecision;

export interface DatasetVersionDiffSamplePoint {
  riskLevel: RiskLevel;
  qualityScore: number;
  qualityGrade: TrainingSampleQualityGrade;
  status: TrainingSampleStatus;
  reviewDecision?: TrainingSampleReviewDecision;
  evidenceCount: number;
  toolEventCount: number;
  redactionCount: number;
  readyForFineTune: boolean;
  sampleHash: string;
}

export interface DatasetVersionDiffSignal {
  label: string;
  before?: string | number;
  after?: string | number;
  direction: 'better' | 'worse' | 'neutral';
}

export interface DatasetVersionDiffSampleChange {
  sampleId: string;
  traceId: string;
  title: string;
  projectKey?: string;
  sourceSessionId: string;
  kind: DatasetVersionDiffChangeKind;
  importance: DatasetVersionDiffImportance;
  before?: DatasetVersionDiffSamplePoint;
  after?: DatasetVersionDiffSamplePoint;
  signals: DatasetVersionDiffSignal[];
}

export interface DatasetVersionDiffSummary {
  added: number;
  removed: number;
  changed: number;
  unchanged: number;
  sampleDelta: number;
  averageQualityDelta: number;
  highRiskDelta: number;
  blockedQualityDelta: number;
  evidenceGapDelta: number;
  approvedDelta: number;
  trainableDelta: number;
}

export interface DatasetVersionDiffReviewRecord {
  id: string;
  diffId: string;
  baseVersionId: string;
  headVersionId: string;
  decision: DatasetVersionDiffReviewDecision;
  note?: string;
  summary: DatasetVersionDiffSummary;
  decidedAt: string;
  decidedBy: string;
}

export interface DatasetVersionDiff {
  id: string;
  baseVersionId: string;
  baseVersionName: string;
  headVersionId: string;
  headVersionName: string;
  baseSnapshotHash?: string;
  headSnapshotHash?: string;
  baseSampleCount: number;
  headSampleCount: number;
  summary: DatasetVersionDiffSummary;
  riskDelta: Record<string, number>;
  kindDelta: Record<string, number>;
  projectDelta: Record<string, number>;
  changes: DatasetVersionDiffSampleChange[];
  reviewStatus: DatasetVersionDiffReviewStatus;
  review?: DatasetVersionDiffReviewRecord;
  reviewHistory: DatasetVersionDiffReviewRecord[];
  recommendation: string;
  generatedAt: string;
}

export interface DatasetVersionDiffReviewPlanSignal {
  label: string;
  value: string;
  tone: 'good' | 'warning' | 'danger' | 'neutral';
}

export interface DatasetVersionDiffReviewPlanCheck {
  id: string;
  label: string;
  status: 'pass' | 'review' | 'block';
  detail: string;
}

export interface DatasetVersionDiffReviewPlan {
  id: string;
  diffId: string;
  baseVersionId: string;
  baseVersionName: string;
  headVersionId: string;
  headVersionName: string;
  headSource: DatasetVersion['source'];
  reviewStatus: DatasetVersionDiffReviewStatus;
  recommendedDecision: 'approved' | 'changes_requested' | 'risk_accepted';
  readiness: 'ready_to_approve' | 'accept_with_note' | 'repair_first' | 'already_reviewed';
  recommendation: string;
  signals: DatasetVersionDiffReviewPlanSignal[];
  checks: DatasetVersionDiffReviewPlanCheck[];
  feedbackLoopSummary?: DatasetVersion['feedbackLoopSummary'];
  generatedAt: string;
}

export interface DatasetVersionDiffReviewApplyResult {
  diff: DatasetVersionDiff;
  plan: DatasetVersionDiffReviewPlan;
  gate: DatasetReleaseGate;
  acknowledgedCheckIds: string[];
  manifest?: DatasetReleaseManifest;
}

export interface DatasetVersion {
  id: string;
  name: string;
  source: 'kodax_candidate_pool' | 'feedback_loop';
  status: 'ready';
  format: DatasetExportFormat;
  sampleIds: string[];
  sampleCount: number;
  averageQuality: number;
  filters: Record<string, string>;
  snapshotHash?: string;
  sampleSnapshots?: TrainingSample[];
  policies?: {
    samplerVersion: 'traceops-p0-sampler';
    cleaningPolicyVersion: 'kodax-clean-text-v1';
    redactionPolicyVersion: 'kodax-clean-text-v1';
  };
  reviewSummary?: {
    approved: number;
    rejected: number;
    unreviewed: number;
  };
  createdAt: string;
  createdBy: string;
  notes?: string;
  releaseGateActions?: DatasetReleaseGateActionRecord[];
  feedbackLoopIds?: string[];
  feedbackLoopSummary?: {
    total: number;
    severity: Record<string, number>;
    targetKind: Record<string, number>;
    monitorStatus: Record<string, number>;
    rollbackSignals: number;
    sourceDatasetVersionIds: string[];
    postReleaseMonitorIds: string[];
    evalRunIds?: string[];
    releaseEvidenceHashes?: string[];
    releasePackageIds: string[];
  };
}

export interface IngestJob {
  id: string;
  sourceId: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  mode: 'manual' | 'watch' | 'scheduled' | 'retry';
  discovered: number;
  created?: number;
  imported: number;
  updated?: number;
  unchanged?: number;
  skipped: number;
  failed: number;
  schemaWarnings?: number;
  runtimeFilesDiscovered?: number;
  runtimeFilesImported?: number;
  runtimeEventsImported?: number;
  runtimeSpansImported?: number;
  resumeFromCursor?: string;
  checkpointCursor?: string;
  diagnostics?: IngestJobDiagnostic[];
  startedAt: string;
  finishedAt?: string;
  message?: string;
}

export interface IngestJobDiagnostic {
  id: string;
  level: 'info' | 'warning' | 'error';
  code: string;
  message: string;
  sourceSessionId?: string;
  traceId?: string;
  recoverable?: boolean;
  triageStatus?: IngestDiagnosticTriageStatus;
  triage?: IngestDiagnosticTriageRecord;
  occurredAt: string;
}

export type IngestDiagnosticTriageStatus = 'open' | 'acknowledged' | 'ignored' | 'resolved';

export type IngestDiagnosticTriageDecision = 'acknowledge' | 'ignore' | 'resolve' | 'reopen';

export interface IngestDiagnosticTriageRecord {
  decision: IngestDiagnosticTriageDecision;
  status: IngestDiagnosticTriageStatus;
  actor: string;
  decidedAt: string;
  note?: string;
}

export interface IngestDiagnosticTriageInput {
  decision: IngestDiagnosticTriageDecision;
  actor?: string;
  note?: string;
}

export interface IngestQualityIssueOccurrence {
  jobId: string;
  jobMode: IngestJob['mode'];
  diagnosticId: string;
  level: IngestJobDiagnostic['level'];
  status: IngestDiagnosticTriageStatus;
  message: string;
  sourceSessionId?: string;
  traceId?: string;
  occurredAt: string;
  triage?: IngestDiagnosticTriageRecord;
}

export interface IngestQualityIssue {
  id: string;
  code: string;
  level: 'warning' | 'error';
  message: string;
  sourceSessionId?: string;
  traceId?: string;
  recoverable?: boolean;
  statusSummary: Record<IngestDiagnosticTriageStatus, number>;
  totalOccurrences: number;
  openOccurrences: number;
  triagedOccurrences: number;
  latestOccurredAt: string;
  latestJobId: string;
  latestDiagnosticId: string;
  latestOpenJobId?: string;
  latestOpenDiagnosticId?: string;
  occurrences: IngestQualityIssueOccurrence[];
}

export interface IngestQualityQueueSummary {
  totalIssues: number;
  openIssues: number;
  triagedIssues: number;
  totalOccurrences: number;
  openOccurrences: number;
  triagedOccurrences: number;
  warningOccurrences: number;
  errorOccurrences: number;
  acknowledged: number;
  ignored: number;
  resolved: number;
}

export interface IngestQualityQueueResponse {
  issues: IngestQualityIssue[];
  summary: IngestQualityQueueSummary;
}

export interface IngestQualityRemediationResult {
  resolvedAt: string;
  actor: string;
  affectedDiagnostics: number;
  affectedIssues: number;
  categories: Array<{
    id: string;
    label: string;
    affectedDiagnostics: number;
  }>;
  queue: IngestQualityQueueResponse;
}

export type IngestQualityPolicyAction =
  | 'manual_review'
  | 'auto_acknowledge'
  | 'auto_ignore'
  | 'auto_resolve';

export type IngestQualityPolicySeverity = 'low' | 'medium' | 'high';

export type IngestQualityPolicyRuleState = 'draft' | 'live' | 'paused';

export interface IngestQualityPolicyRuleLifecyclePreview {
  matchedDiagnostics: number;
  changeableDiagnostics: number;
  matchedIssues: number;
}

export interface IngestQualityPolicyRuleLifecycleRecord {
  id: string;
  state: IngestQualityPolicyRuleState;
  actor: string;
  changedAt: string;
  note?: string;
  preview?: IngestQualityPolicyRuleLifecyclePreview;
}

export interface IngestQualityPolicyRule {
  id: string;
  code: string;
  level: 'warning' | 'error' | 'any';
  action: IngestQualityPolicyAction;
  severity: IngestQualityPolicySeverity;
  enabled: boolean;
  state?: IngestQualityPolicyRuleState;
  note?: string;
  createdAt: string;
  updatedAt: string;
  lastAppliedAt?: string;
  appliedCount?: number;
  lastStateChange?: IngestQualityPolicyRuleLifecycleRecord;
  lifecycle?: IngestQualityPolicyRuleLifecycleRecord[];
}

export interface IngestQualityPolicyRuleInput {
  id?: string;
  code: string;
  level?: IngestQualityPolicyRule['level'];
  action: IngestQualityPolicyAction;
  severity?: IngestQualityPolicySeverity;
  enabled?: boolean;
  state?: IngestQualityPolicyRuleState;
  note?: string;
  stateChangeActor?: string;
  stateChangeNote?: string;
  stateChangePreview?: IngestQualityPolicyRuleLifecyclePreview;
}

export interface IngestQualityPolicyRecommendation {
  issueId: string;
  code: string;
  level: IngestQualityIssue['level'];
  message: string;
  suggestedAction: IngestQualityPolicyAction;
  suggestedSeverity: IngestQualityPolicySeverity;
  openOccurrences: number;
  latestOccurredAt?: string;
  reason: string;
}

export type IngestQualityRecommendationDecision = 'dismissed' | 'reopened';

export interface IngestQualityRecommendationDecisionRecord {
  id: string;
  decision: IngestQualityRecommendationDecision;
  code: string;
  level: IngestQualityIssue['level'];
  message: string;
  issueIds: string[];
  occurrenceCount: number;
  actor: string;
  decidedAt: string;
  note?: string;
}

export interface IngestQualityRecommendationDecisionInput {
  recommendations: IngestQualityPolicyRecommendation[];
  decision: IngestQualityRecommendationDecision;
  actor?: string;
  note?: string;
}

export interface IngestQualityPolicySummary {
  totalRules: number;
  enabledRules: number;
  draftRules: number;
  pausedRules: number;
  manualReviewRules: number;
  automationRules: number;
  recommendedRules: number;
  acceptedRecommendations: number;
  dismissedRecommendations: number;
  reopenedRecommendations: number;
  recommendationDecisionEvents: number;
}

export interface IngestQualityPolicyResponse {
  rules: IngestQualityPolicyRule[];
  recommendations: IngestQualityPolicyRecommendation[];
  dismissedRecommendations: IngestQualityRecommendationDecisionRecord[];
  recommendationDecisions: IngestQualityRecommendationDecisionRecord[];
  summary: IngestQualityPolicySummary;
}

export interface IngestQualityPolicyApplyResult {
  appliedRules: number;
  affectedDiagnostics: number;
  affectedIssues: number;
  ruleResults: Array<{
    ruleId: string;
    code: string;
    action: IngestQualityPolicyAction;
    affectedDiagnostics: number;
  }>;
  queue: IngestQualityQueueResponse;
  policy: IngestQualityPolicyResponse;
  run?: IngestQualityPolicyRunRecord;
}

export interface IngestQualityPolicyDryRunMatch {
  jobId: string;
  jobMode: IngestJob['mode'];
  diagnosticId: string;
  issueId: string;
  code: string;
  level: IngestQualityIssue['level'];
  message: string;
  sourceSessionId?: string;
  traceId?: string;
  occurredAt: string;
  currentStatus: IngestDiagnosticTriageStatus;
  decision?: IngestDiagnosticTriageDecision;
}

export interface IngestQualityPolicyDryRunRuleResult {
  ruleId: string;
  code: string;
  level: IngestQualityPolicyRule['level'];
  action: IngestQualityPolicyAction;
  severity: IngestQualityPolicySeverity;
  enabled: boolean;
  decision?: IngestDiagnosticTriageDecision;
  matchedDiagnostics: number;
  matchedIssues: number;
  changeableDiagnostics: number;
  matches: IngestQualityPolicyDryRunMatch[];
}

export interface IngestQualityPolicyDryRunResponse {
  generatedAt: string;
  scope: 'all_enabled' | 'single_rule' | 'selected_rules';
  ruleId?: string;
  totalRules: number;
  matchedRules: number;
  matchedDiagnostics: number;
  matchedIssues: number;
  changeableDiagnostics: number;
  ruleResults: IngestQualityPolicyDryRunRuleResult[];
}

export type IngestQualityPolicyRunTrigger = 'manual' | 'watch' | 'retry' | 'scheduled';

export interface IngestQualityPolicyRunRecord {
  id: string;
  trigger: IngestQualityPolicyRunTrigger;
  actor: string;
  status: 'succeeded' | 'skipped' | 'failed';
  startedAt: string;
  finishedAt: string;
  sourceJobId?: string;
  enabledRules: number;
  appliedRules: number;
  affectedDiagnostics: number;
  affectedIssues: number;
  message: string;
  ruleResults: IngestQualityPolicyApplyResult['ruleResults'];
}

export interface IngestQualityPolicyRunSummary {
  totalRuns: number;
  manualRuns: number;
  automaticRuns: number;
  skippedRuns: number;
  affectedDiagnostics: number;
  affectedIssues: number;
  lastRunAt?: string;
}

export interface IngestQualityPolicyRunListResponse {
  runs: IngestQualityPolicyRunRecord[];
  summary: IngestQualityPolicyRunSummary;
}

export type TraceOpsTaskKind =
  | 'kodax_sync'
  | 'trace_cleaning'
  | 'storage_maintenance'
  | 'kodax_feedback'
  | 'governance_review'
  | 'dataset_build'
  | 'diff_review'
  | 'release_manifest'
  | 'retraining_handoff'
  | 'training_run'
  | 'eval_run'
  | 'model_release_gate'
  | 'deployment_handoff'
  | 'post_release_monitor'
  | 'feedback_loop'
  | 'closed_loop';

export type TraceOpsTaskStatus =
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'retrying'
  | 'cancelled';

export type TraceOpsTaskEntityKind =
  | 'ingest_job'
  | 'trace'
  | 'dataset_version'
  | 'release_manifest'
  | 'release_promotion'
  | 'retraining_handoff'
  | 'training_run'
  | 'eval_run'
  | 'model_release_gate'
  | 'deployment_handoff'
  | 'post_release_monitor'
  | 'feedback_loop';

export interface TraceOpsTaskEntityRef {
  kind: TraceOpsTaskEntityKind;
  id: string;
  label?: string;
}

export interface TraceOpsTaskEvent {
  id: string;
  status: TraceOpsTaskStatus;
  note: string;
  createdAt: string;
}

export interface TraceOpsTaskRecord {
  id: string;
  kind: TraceOpsTaskKind;
  status: TraceOpsTaskStatus;
  title: string;
  description?: string;
  queue: 'ingestion' | 'dataset' | 'training' | 'release' | 'monitoring' | 'closed_loop' | 'maintenance';
  priority: 'low' | 'normal' | 'high' | 'critical';
  progress: number;
  attempts: number;
  maxAttempts: number;
  entityRefs: TraceOpsTaskEntityRef[];
  resultSummary?: string;
  errorMessage?: string;
  retryOfTaskId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  finishedAt?: string;
  nextRunAt?: string;
  events: TraceOpsTaskEvent[];
}

export type TraceOpsTaskApprovalStatus = 'not_required' | 'pending' | 'approved' | 'rejected';
export type TraceOpsTaskAlertSeverity = 'info' | 'warning' | 'critical';

export interface TraceOpsTaskApprovalState {
  required: boolean;
  status: TraceOpsTaskApprovalStatus;
  reason: string;
  action?: string;
}

export interface TraceOpsTaskGraphNode {
  id: string;
  taskId: string;
  kind: TraceOpsTaskKind;
  title: string;
  status: TraceOpsTaskStatus;
  priority: TraceOpsTaskRecord['priority'];
  queue: TraceOpsTaskRecord['queue'];
  entityRefs: TraceOpsTaskEntityRef[];
  approval: TraceOpsTaskApprovalState;
  blockedByTaskIds: string[];
}

export interface TraceOpsTaskGraphEdge {
  id: string;
  fromTaskId: string;
  toTaskId: string;
  reason: string;
}

export interface TraceOpsTaskAlert {
  id: string;
  severity: TraceOpsTaskAlertSeverity;
  taskId?: string;
  title: string;
  detail: string;
  createdAt: string;
}

export interface TraceOpsTaskSummary {
  total: number;
  queued: number;
  running: number;
  succeeded: number;
  failed: number;
  retrying: number;
  cancelled: number;
  active: number;
  needsAttention: number;
}

export interface TraceOpsTaskListResponse {
  tasks: TraceOpsTaskRecord[];
  summary: TraceOpsTaskSummary;
}

export interface TraceOpsTaskAutomationPlan {
  generatedAt: string;
  nodes: TraceOpsTaskGraphNode[];
  edges: TraceOpsTaskGraphEdge[];
  alerts: TraceOpsTaskAlert[];
  summary: {
    nodes: number;
    edges: number;
    approvalRequired: number;
    blocked: number;
    criticalAlerts: number;
    warningAlerts: number;
  };
}

export interface TraceOpsTaskCreateInput {
  kind: TraceOpsTaskKind;
  title: string;
  description?: string;
  priority?: TraceOpsTaskRecord['priority'];
  entityRefs?: TraceOpsTaskEntityRef[];
  createdBy?: string;
}

export interface TraceOpsTaskCreateResponse {
  created: TraceOpsTaskRecord[];
}

export interface TraceOpsTaskOrchestrationResult {
  created: TraceOpsTaskRecord[];
  skipped: Array<{
    code: string;
    reason: string;
  }>;
  summary: {
    evaluated: number;
    created: number;
    skipped: number;
    critical: number;
    high: number;
  };
}

export interface TraceOpsTaskExecutionResult {
  task: TraceOpsTaskRecord;
  executed: boolean;
  message: string;
}

export interface TraceOpsTaskRunResponse {
  requested: number;
  executed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  results: TraceOpsTaskExecutionResult[];
}

export interface IngestError {
  id: string;
  jobId: string;
  traceId?: string;
  sourceSessionId: string;
  errorType: string;
  message: string;
  recoverable: boolean;
  occurredAt: string;
}

export interface SourceStatus {
  id: string;
  type: 'kodax';
  displayName: string;
  enabled: boolean;
  sessionsDir: string;
  exists: boolean;
  lastSyncAt?: string;
  autoWatch: boolean;
  watcherStatus?: 'idle' | 'syncing' | 'error';
  watchIntervalMs?: number;
  lastWatchSyncAt?: string;
  lastWatchMessage?: string;
  nextWatchAt?: string;
  autoApplyQualityPolicy?: boolean;
  lastPolicyApplyAt?: string;
  lastPolicyApplyMessage?: string;
  scope: 'all';
  rawTraceTrainable: false;
  syncCheckpoint?: SourceSyncCheckpoint;
}

export interface SourceSyncCheckpoint {
  jobId: string;
  mode: IngestJob['mode'];
  cursor?: string;
  resumeFromCursor?: string;
  lastStartedAt: string;
  lastFinishedAt?: string;
  discovered: number;
  created: number;
  imported: number;
  updated: number;
  unchanged: number;
  skipped: number;
  failed: number;
  schemaWarnings: number;
  runtimeFilesDiscovered?: number;
  runtimeFilesImported?: number;
  runtimeEventsImported?: number;
  runtimeSpansImported?: number;
  openSchemaWarnings?: number;
  triagedSchemaWarnings?: number;
  lastError?: string;
  resumeHint?: string;
}

export type GovernanceActorRole = 'local_admin' | 'data_governance' | 'training_owner' | 'auditor' | 'viewer';
export type GovernanceAuditDecision = 'allowed' | 'denied' | 'recorded';

export interface GovernanceActor {
  id: string;
  role: GovernanceActorRole;
  displayName?: string;
}

export interface GovernanceAuditRecord {
  id: string;
  action: string;
  decision: GovernanceAuditDecision;
  actor: GovernanceActor;
  entityRefs: TraceOpsTaskEntityRef[];
  reason: string;
  metadata?: Record<string, unknown>;
  occurredAt: string;
}

export interface GovernancePolicyResponse {
  roles: Array<{
    role: GovernanceActorRole;
    label: string;
    permissions: string[];
  }>;
  highImpactActions: string[];
  defaultRole: GovernanceActorRole;
  auditRetentionLimit: number;
}

export type StorePersistenceHealthStatus = 'healthy' | 'attention' | 'blocked';

export interface StorePersistenceTableCounts {
  traces: number;
  events: number;
  evidence: number;
  revisions: number;
  jobs: number;
  trainingSamplesApprox: number;
  memoryCandidatesApprox: number;
  datasetVersions: number;
  releaseManifests: number;
  trainingRuns: number;
  tasks: number;
  governanceAuditRecords: number;
}

export interface StoreSnapshotRecord {
  id: string;
  path: string;
  reason: string;
  createdBy: string;
  createdAt: string;
  storeBytes: number;
  compressedBytes: number;
  sha256: string;
  tableCounts: StorePersistenceTableCounts;
}

export interface StorePersistenceHealth {
  status: StorePersistenceHealthStatus;
  driver: string;
  message: string;
  storePath: string;
  backupPath: string;
  snapshotsDir: string;
  storeBytes: number;
  backupBytes?: number;
  storeSha256?: string;
  tableCounts: StorePersistenceTableCounts;
  latestSnapshot?: StoreSnapshotRecord;
  snapshotCount: number;
  recommendations: string[];
  checkedAt: string;
}

export interface StoreSnapshotCreateResult {
  snapshot: StoreSnapshotRecord;
  health: StorePersistenceHealth;
}

export interface StoreSnapshotRestoreResult {
  restored: true;
  snapshot: StoreSnapshotRecord;
  health: StorePersistenceHealth;
}

export type TraceOpsSegmentKind = 'raw_trace' | 'clean_trace' | 'training_sample' | 'dataset_version';
export type TraceOpsSegmentFileStatus = 'open' | 'sealed';

export interface TraceOpsSegmentFile {
  id: string;
  stream: string;
  kind: TraceOpsSegmentKind;
  path: string;
  status: TraceOpsSegmentFileStatus;
  schemaVersion: 'traceops-segment-v1';
  recordCount: number;
  byteSize: number;
  maxRecords: number;
  maxBytes: number;
  createdAt: string;
  updatedAt: string;
  sealedAt?: string;
  firstRecordAt?: string;
  lastRecordAt?: string;
  sha256?: string;
}

export interface TraceOpsSegmentRecordRef {
  id: string;
  fileId: string;
  stream: string;
  kind: TraceOpsSegmentKind;
  sourceId: string;
  recordHash: string;
  identityHash?: string;
  payloadHash: string;
  traceId?: string;
  sampleId?: string;
  datasetVersionId?: string;
  writtenAt: string;
}

export interface TraceOpsSegmentStreamStatus {
  stream: string;
  kind: TraceOpsSegmentKind;
  files: number;
  openFiles: number;
  sealedFiles: number;
  records: number;
  bytes: number;
  latestFileId?: string;
  latestWriteAt?: string;
}

export interface TraceOpsSegmentStoreStatus {
  rootDir: string;
  maxRecordsPerSegment: number;
  maxBytesPerSegment: number;
  files: number;
  openFiles: number;
  sealedFiles: number;
  records: number;
  bytes: number;
  streams: TraceOpsSegmentStreamStatus[];
  recentFiles: TraceOpsSegmentFile[];
  lastBackfillAt?: string;
  checkedAt: string;
}

export interface TraceOpsSegmentBackfillResult {
  written: number;
  skipped: number;
  filesCreated: number;
  filesSealed: number;
  streamWrites: Record<string, number>;
  status: TraceOpsSegmentStoreStatus;
  backfilledAt: string;
}

export type KodaXFeedbackSignalSeverity = 'info' | 'warning' | 'critical';
export type KodaXFeedbackSignalCategory =
  | 'tracing_gap'
  | 'evidence_gap'
  | 'tool_reliability'
  | 'governance_blocker'
  | 'skill_candidate'
  | 'memory_candidate'
  | 'eval_gap'
  | 'release_feedback'
  | 'training_provider';

export type KodaXFeedbackActionKind =
  | 'improve_tracing'
  | 'repair_dataset'
  | 'create_skill'
  | 'promote_memory'
  | 'add_eval'
  | 'update_connector'
  | 'review_policy'
  | 'retry_training_provider';

export interface KodaXFeedbackSignal {
  id: string;
  category: KodaXFeedbackSignalCategory;
  severity: KodaXFeedbackSignalSeverity;
  title: string;
  detail: string;
  metric: {
    label: string;
    value: number | string;
    denominator?: number | string;
  };
  sourceRefs: TraceOpsTaskEntityRef[];
  recommendedAction: string;
  createdAt: string;
}

export interface KodaXFeedbackActionItem {
  id: string;
  kind: KodaXFeedbackActionKind;
  priority: 'low' | 'normal' | 'high' | 'critical';
  title: string;
  description: string;
  owner: 'kodax_cli' | 'kodax_space' | 'agentos' | 'traceops';
  sourceSignalIds: string[];
  payload: Record<string, unknown>;
}

export interface KodaXFeedbackReport {
  id: string;
  generatedAt: string;
  product: 'kodax';
  summary: {
    signals: number;
    critical: number;
    warning: number;
    info: number;
    actionItems: number;
    topRecommendation: string;
  };
  signals: KodaXFeedbackSignal[];
  actionItems: KodaXFeedbackActionItem[];
  nextActions: string[];
}

export interface KodaXFeedbackPackage {
  id: string;
  generatedAt: string;
  packageVersion: 'traceops-kodax-feedback-package-v1';
  report: KodaXFeedbackReport;
  kodaxInbox: {
    tracingGaps: KodaXFeedbackActionItem[];
    skillCandidates: KodaXFeedbackActionItem[];
    memoryPromotions: KodaXFeedbackActionItem[];
    evalBacklog: KodaXFeedbackActionItem[];
    connectorOrTooling: KodaXFeedbackActionItem[];
  };
  packageHash: string;
}

export type KodaXFeedbackWritebackStatus = 'written' | 'failed';
export type KodaXFeedbackWritebackFileKind = 'package' | 'report' | 'inbox';

export interface KodaXFeedbackWritebackFile {
  kind: KodaXFeedbackWritebackFileKind;
  path: string;
  bytes: number;
  sha256: string;
}

export interface KodaXFeedbackWritebackRecord {
  id: string;
  status: KodaXFeedbackWritebackStatus;
  packageId: string;
  packageHash: string;
  targetDir: string;
  files: KodaXFeedbackWritebackFile[];
  actor: GovernanceActor;
  reason: string;
  signalCount: number;
  actionItemCount: number;
  createdAt: string;
  errorMessage?: string;
}

export interface KodaXFeedbackWritebackResult {
  record: KodaXFeedbackWritebackRecord;
  package: KodaXFeedbackPackage;
}

export interface TraceDetail {
  trace: RawTrace;
  events: RawTraceEvent[];
  evidence: RawEvidence[];
  revisions: RawTraceRevision[];
  errors: IngestError[];
  trainingSamples: TrainingSample[];
  memoryCandidates: MemoryCandidate[];
}

export interface TraceListResponse {
  traces: RawTrace[];
  totals: {
    total: number;
    imported: number;
    updated: number;
    failed: number;
    highRisk: number;
  };
}

export interface TrainingSampleListResponse {
  samples: TrainingSample[];
  totals: {
    total: number;
    candidate: number;
    needsReview: number;
    blocked: number;
    highRisk: number;
    averageQuality: number;
  };
}

export interface CleanTraceListResponse {
  cleanTraces: CleanTrace[];
  totals: {
    total: number;
    ready: number;
    needsReview: number;
    blocked: number;
    highRisk: number;
    averageQuality: number;
  };
}

export interface MemoryCandidateListResponse {
  candidates: MemoryCandidate[];
  totals: {
    total: number;
    candidate: number;
    needsReview: number;
    promoted: number;
    rejected: number;
    blocked: number;
    highRisk: number;
    averageConfidence: number;
  };
}

export interface TrainingSampleReviewBulkResult {
  updated: TrainingSample[];
  failed: Array<{
    id: string;
    message: string;
  }>;
}
