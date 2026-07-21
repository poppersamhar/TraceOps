import cors from 'cors';
import express, { type Request, type Response } from 'express';
import path from 'node:path';

import {
  loadKodaXRuntimeFiles,
  listKodaXSessions,
  loadKodaXFullSession,
  resolveKodaXSessionsDir,
  sessionsDirExists,
} from '../../../packages/kodax-connector/src/kodaxScanner';
import { normalizeKodaXSession } from '../../../packages/kodax-connector/src/normalizer';
import { exportTrainingSamples, normalizeDatasetExportFormat } from '../../../packages/exporters/src/jsonl';
import type {
  AgentBenchmarkCaseCreateInput,
  AgentBenchmarkSuiteCreateInput,
  AgentEvaluationExperimentCreateInput,
  AgentEvaluationIssue,
  AgentEvaluationIssueCreateInput,
  AgentEvaluationMetricDefinition,
  AgentEvaluationRolloutCreateInput,
  DatasetClosedLoopFeedbackSignalMode,
  DatasetDeploymentHandoffStatus,
  DatasetFeedbackLoopDecision,
  DatasetModelReleaseGateDecision,
  DatasetPostReleaseMonitorStatus,
  DatasetTrainingProvider,
  DatasetTrainingProviderStatus,
  DatasetReleaseGateActionDecision,
  DatasetTrainingRunRecord,
  DatasetVersionDiffReviewDecision,
  GovernanceActor,
  GovernanceActorRole,
  HarnessSnapshotCreateInput,
  IngestDiagnosticTriageDecision,
  IngestQualityPolicyAction,
  IngestQualityRecommendationDecisionInput,
  IngestQualityPolicyRuleInput,
  IngestQualityPolicySeverity,
  IngestJob,
  KodaXRuntimeEventInput,
  KodaXRuntimeEventKind,
  KodaXRuntimeIngestInput,
  KodaXTraceSpanInput,
  KodaXTraceSpanKind,
  RawTraceRuntime,
  TraceStatus,
  TraceOpsTaskCreateInput,
  TraceOpsTaskEntityRef,
  TraceOpsTaskExecutionResult,
  TraceOpsTaskKind,
  TraceOpsTaskRecord,
  TraceOpsTaskRunResponse,
} from '../../../packages/trace-core/src/types';
import { createPlatformArchitectureRouter } from './modules/platformArchitecture';
import { createSpaceCollectorV01Router, TRACEOPS_COLLECTOR_VERSION } from './modules/spaceCollectorV01';
import { TraceOpsStore } from './store';

const port = Number(process.env.TRACEOPS_API_PORT ?? 4177);
const productMode = process.env.TRACEOPS_PRODUCT_MODE ?? '0.1.0';
const sessionsDir = resolveKodaXSessionsDir();
const watchIntervalMs = Number(process.env.TRACEOPS_WATCH_INTERVAL_MS ?? 30_000);
const taskExecutorIntervalMs = Number(process.env.TRACEOPS_TASK_EXECUTOR_INTERVAL_MS ?? 12_000);
let watchTimer: NodeJS.Timeout | undefined;
let watchInFlight = false;
let taskExecutorTimer: NodeJS.Timeout | undefined;
let taskExecutorInFlight = false;

function normalizeGateActionDecision(value: unknown): DatasetReleaseGateActionDecision | undefined {
  if (value === 'resolved' || value === 'waived' || value === 'acknowledged' || value === 'reopened') {
    return value;
  }
  return undefined;
}

function normalizeDiffReviewDecision(value: unknown): DatasetVersionDiffReviewDecision | undefined {
  if (value === 'approved' || value === 'changes_requested' || value === 'risk_accepted' || value === 'reopened') {
    return value;
  }
  return undefined;
}

function normalizeTrainingRunStatus(value: unknown): DatasetTrainingRunRecord['status'] | undefined {
  if (
    value === 'planned'
    || value === 'running'
    || value === 'evaluating'
    || value === 'passed'
    || value === 'failed'
    || value === 'rolled_back'
    || value === 'cancelled'
  ) {
    return value;
  }
  return undefined;
}

function normalizeTrainingProvider(value: unknown): DatasetTrainingProvider {
  if (value === 'openai_fine_tuning' || value === 'custom_http' || value === 'manual') return value;
  return 'manual';
}

function normalizeTrainingProviderStatus(value: unknown): DatasetTrainingProviderStatus | undefined {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (normalized === 'queued' || normalized === 'pending' || normalized === 'created' || normalized === 'scheduled') return 'queued';
  if (normalized === 'running' || normalized === 'in_progress' || normalized === 'training' || normalized === 'processing') return 'running';
  if (normalized === 'succeeded' || normalized === 'success' || normalized === 'completed' || normalized === 'complete' || normalized === 'passed' || normalized === 'done') return 'succeeded';
  if (normalized === 'failed' || normalized === 'failure' || normalized === 'error' || normalized === 'errored') return 'failed';
  if (normalized === 'cancelled' || normalized === 'canceled' || normalized === 'aborted') return 'cancelled';
  if (normalized === 'unknown') return 'unknown';
  return undefined;
}

function normalizeGovernanceRole(value: unknown): GovernanceActorRole {
  if (
    value === 'local_admin'
    || value === 'data_governance'
    || value === 'training_owner'
    || value === 'auditor'
    || value === 'viewer'
  ) {
    return value;
  }
  return 'local_admin';
}

function normalizeModelReleaseGateDecision(value: unknown): DatasetModelReleaseGateDecision | undefined {
  if (value === 'approved' || value === 'rejected' || value === 'reopened') {
    return value;
  }
  return undefined;
}

function normalizeDeploymentHandoffStatus(value: unknown): DatasetDeploymentHandoffStatus | undefined {
  if (
    value === 'queued'
    || value === 'preparing'
    || value === 'ready_for_rollout'
    || value === 'live'
    || value === 'rolled_back'
    || value === 'cancelled'
  ) {
    return value;
  }
  return undefined;
}

function normalizePostReleaseMonitorStatus(value: unknown): DatasetPostReleaseMonitorStatus | undefined {
  if (
    value === 'watching'
    || value === 'healthy'
    || value === 'attention'
    || value === 'rollback_required'
    || value === 'closed'
  ) {
    return value;
  }
  return undefined;
}

function normalizeTaskKind(value: unknown): TraceOpsTaskKind | undefined {
  if (
    value === 'kodax_sync'
    || value === 'trace_cleaning'
    || value === 'storage_maintenance'
    || value === 'kodax_feedback'
    || value === 'governance_review'
    || value === 'dataset_build'
    || value === 'diff_review'
    || value === 'release_manifest'
    || value === 'retraining_handoff'
    || value === 'training_run'
    || value === 'eval_run'
    || value === 'model_release_gate'
    || value === 'deployment_handoff'
    || value === 'post_release_monitor'
    || value === 'feedback_loop'
    || value === 'closed_loop'
  ) {
    return value;
  }
  return undefined;
}

function normalizeTaskPriority(value: unknown): TraceOpsTaskRecord['priority'] | undefined {
  if (value === 'critical' || value === 'high' || value === 'normal' || value === 'low') return value;
  return undefined;
}

function normalizeTaskEntityRefs(value: unknown): TraceOpsTaskEntityRef[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item): TraceOpsTaskEntityRef | undefined => {
      if (!item || typeof item !== 'object') return undefined;
      const candidate = item as Record<string, unknown>;
      const kind = candidate.kind;
      if (
        kind !== 'ingest_job'
        && kind !== 'trace'
        && kind !== 'dataset_version'
        && kind !== 'release_manifest'
        && kind !== 'release_promotion'
        && kind !== 'retraining_handoff'
        && kind !== 'training_run'
        && kind !== 'eval_run'
        && kind !== 'model_release_gate'
        && kind !== 'deployment_handoff'
        && kind !== 'post_release_monitor'
        && kind !== 'feedback_loop'
      ) return undefined;
      if (typeof candidate.id !== 'string' || candidate.id.trim() === '') return undefined;
      return {
        kind,
        id: candidate.id,
        label: typeof candidate.label === 'string' ? candidate.label : undefined,
      };
    })
    .filter((item): item is TraceOpsTaskEntityRef => Boolean(item))
    .slice(0, 8);
}

function normalizeTaskCreateInput(value: unknown): TraceOpsTaskCreateInput | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const candidate = value as Record<string, unknown>;
  const kind = normalizeTaskKind(candidate.kind);
  if (!kind || typeof candidate.title !== 'string' || candidate.title.trim() === '') return undefined;
  return {
    kind,
    title: candidate.title.trim().slice(0, 180),
    description: typeof candidate.description === 'string' ? candidate.description.trim().slice(0, 1000) : undefined,
    priority: normalizeTaskPriority(candidate.priority),
    entityRefs: normalizeTaskEntityRefs(candidate.entityRefs),
    createdBy: typeof candidate.createdBy === 'string' ? candidate.createdBy.trim().slice(0, 80) : undefined,
  };
}

function normalizeClosedLoopFeedbackSignalMode(value: unknown): DatasetClosedLoopFeedbackSignalMode | undefined {
  if (value === 'healthy' || value === 'attention' || value === 'rollback') {
    return value;
  }
  return undefined;
}

function normalizeFeedbackLoopDecision(value: unknown): DatasetFeedbackLoopDecision | undefined {
  if (value === 'triaged' || value === 'promoted' || value === 'rejected' || value === 'reopened') {
    return value;
  }
  return undefined;
}

function finiteNumber(value: unknown): number | undefined {
  const next = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
  return Number.isFinite(next) ? next : undefined;
}

function isRuntimeRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function normalizedString(value: unknown, max = 500): string | undefined {
  if (typeof value !== 'string') return undefined;
  const next = value.trim();
  return next ? next.slice(0, max) : undefined;
}

function normalizedStringArray(value: unknown, maxItems = 100, maxLength = 500): string[] {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value
    .map((item) => normalizedString(item, maxLength))
    .filter((item): item is string => Boolean(item))))
    .slice(0, maxItems);
}

function normalizeAgentMetric(value: unknown): AgentEvaluationMetricDefinition | undefined {
  if (!isRuntimeRecord(value)) return undefined;
  const id = normalizedString(value.id, 120);
  const label = normalizedString(value.label, 180);
  if (!id || !label) return undefined;
  const unit = value.unit === 'score' || value.unit === 'percent' || value.unit === 'count' || value.unit === 'tokens' || value.unit === 'ms'
    ? value.unit
    : 'score';
  const direction = value.direction === 'decrease' ? 'decrease' : 'increase';
  const aggregation = value.aggregation === 'sum' || value.aggregation === 'rate' ? value.aggregation : 'mean';
  const role = value.role === 'primary' || value.role === 'guardrail' || value.role === 'diagnostic' ? value.role : 'diagnostic';
  return {
    id,
    label,
    unit,
    direction,
    aggregation,
    role,
    targetDelta: finiteNumber(value.targetDelta),
    maxCandidateValue: finiteNumber(value.maxCandidateValue),
    maxDelta: finiteNumber(value.maxDelta),
  };
}

function requestHeader(req: Request, name: string): string | undefined {
  const value = req.headers[name.toLowerCase()];
  if (Array.isArray(value)) return normalizedString(value[0], 180);
  return normalizedString(value, 180);
}

function requestBodyString(req: Request, keys: string[], max = 180): string | undefined {
  if (!isRuntimeRecord(req.body)) return undefined;
  for (const key of keys) {
    const direct = normalizedString(req.body[key], max);
    if (direct) return direct;
  }
  return undefined;
}

function governanceActorFromRequest(req: Request): GovernanceActor {
  const actorBody = isRuntimeRecord(req.body?.actor) ? req.body.actor : undefined;
  const id =
    requestHeader(req, 'x-traceops-actor-id')
    ?? normalizedString(actorBody?.id, 180)
    ?? requestBodyString(req, ['actorId', 'submittedBy', 'reviewer', 'generatedBy', 'revokedBy', 'decidedBy'])
    ?? 'local-admin';
  const displayName =
    requestHeader(req, 'x-traceops-actor-name')
    ?? normalizedString(actorBody?.displayName, 180)
    ?? requestBodyString(req, ['actorName'], 180)
    ?? id;
  const role = normalizeGovernanceRole(
    requestHeader(req, 'x-traceops-actor-role')
    ?? actorBody?.role
    ?? requestBodyString(req, ['actorRole'], 80),
  );
  return { id, role, displayName };
}

function governanceRolePermissions(role: GovernanceActorRole): string[] {
  return store.getGovernancePolicy().roles.find((item) => item.role === role)?.permissions ?? [];
}

function governancePermissionMatches(permission: string, action: string): boolean {
  if (permission === '*' || permission === action) return true;
  if (permission.endsWith('.*')) return action.startsWith(permission.slice(0, -1));
  return false;
}

function governanceActorCan(actor: GovernanceActor, action: string): boolean {
  return governanceRolePermissions(actor.role).some((permission) => governancePermissionMatches(permission, action));
}

async function requireGovernancePermission(
  req: Request,
  res: Response,
  action: string,
  options?: {
    entityRefs?: TraceOpsTaskEntityRef[];
    reason?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<GovernanceActor | undefined> {
  const actor = governanceActorFromRequest(req);
  if (governanceActorCan(actor, action)) return actor;

  await store.recordGovernanceAudit({
    action,
    decision: 'denied',
    actor,
    entityRefs: options?.entityRefs ?? [],
    reason: options?.reason ?? `Role ${actor.role} is not allowed to perform ${action}.`,
    metadata: {
      requiredPermission: action,
      rolePermissions: governanceRolePermissions(actor.role),
      ...options?.metadata,
    },
  });
  res.status(403).json({
    error: 'Permission denied',
    action,
    actor: {
      id: actor.id,
      role: actor.role,
      displayName: actor.displayName,
    },
  });
  return undefined;
}

function normalizedIsoTime(value: unknown): string | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function normalizeRuntimeScope(value: unknown): RawTraceRuntime['scope'] | undefined {
  if (value === 'user' || value === 'managed-task-worker') return value;
  return undefined;
}

function normalizeRuntimeWorkspaceKind(value: unknown): RawTraceRuntime['workspaceKind'] | undefined {
  if (value === 'detected' || value === 'managed') return value;
  return undefined;
}

function normalizeTraceStatus(value: unknown): TraceStatus | undefined {
  if (value === 'running' || value === 'completed' || value === 'failed' || value === 'unknown') return value;
  return undefined;
}

function normalizeRuntime(value: unknown): Partial<RawTraceRuntime> | undefined {
  if (!isRuntimeRecord(value)) return undefined;
  const runtime: Partial<RawTraceRuntime> = {
    canonicalRepoRoot: normalizedString(value.canonicalRepoRoot),
    workspaceRoot: normalizedString(value.workspaceRoot),
    executionCwd: normalizedString(value.executionCwd),
    branch: normalizedString(value.branch, 180),
    workspaceKind: normalizeRuntimeWorkspaceKind(value.workspaceKind),
    surface: normalizedString(value.surface, 120),
    profileId: normalizedString(value.profileId, 180),
    profileVersion: normalizedString(value.profileVersion, 120),
    provider: normalizedString(value.provider, 120),
    model: normalizedString(value.model, 180),
    reasoningMode: normalizedString(value.reasoningMode, 120),
    permissionMode: normalizedString(value.permissionMode, 120),
    agentMode: normalizedString(value.agentMode, 120),
    scope: normalizeRuntimeScope(value.scope),
  };
  return Object.values(runtime).some((item) => item !== undefined) ? runtime : undefined;
}

const runtimeEventKinds = new Set<KodaXRuntimeEventKind>([
  'session_started',
  'session_updated',
  'message',
  'tool_use',
  'tool_result',
  'artifact',
  'workflow_phase',
  'child_agent',
  'handoff',
  'session_completed',
  'session_failed',
  'custom',
]);

function normalizeKodaXRuntimeEventKind(value: unknown): KodaXRuntimeEventKind | undefined {
  return typeof value === 'string' && runtimeEventKinds.has(value as KodaXRuntimeEventKind)
    ? value as KodaXRuntimeEventKind
    : undefined;
}

function normalizeRuntimeRole(value: unknown): KodaXRuntimeEventInput['role'] | undefined {
  if (value === 'user' || value === 'assistant' || value === 'system') return value;
  return undefined;
}

function normalizeKodaXRuntimeEvent(value: unknown): KodaXRuntimeEventInput | undefined {
  if (!isRuntimeRecord(value)) return undefined;
  const sessionId = normalizedString(value.sessionId, 180);
  const kind = normalizeKodaXRuntimeEventKind(value.kind);
  if (!sessionId || !kind) return undefined;
  return {
    eventId: normalizedString(value.eventId, 220),
    sessionId,
    projectKey: normalizedString(value.projectKey, 180),
    title: normalizedString(value.title, 240),
    gitRoot: normalizedString(value.gitRoot, 500),
    scope: normalizeRuntimeScope(value.scope),
    runtime: normalizeRuntime(value.runtime),
    kind,
    role: normalizeRuntimeRole(value.role),
    label: normalizedString(value.label, 240),
    preview: normalizedString(value.preview, 1000),
    payload: value.payload,
    occurredAt: normalizedIsoTime(value.occurredAt),
    parentEntryId: value.parentEntryId === null ? null : normalizedString(value.parentEntryId, 220),
    sourceEntryId: normalizedString(value.sourceEntryId, 220),
    status: normalizeTraceStatus(value.status),
  };
}

const traceSpanKinds = new Set<KodaXTraceSpanKind>([
  'agent',
  'model',
  'tool',
  'workflow',
  'handoff',
  'eval',
  'custom',
]);

function normalizeKodaXTraceSpanKind(value: unknown): KodaXTraceSpanKind | undefined {
  return typeof value === 'string' && traceSpanKinds.has(value as KodaXTraceSpanKind)
    ? value as KodaXTraceSpanKind
    : undefined;
}

function normalizeKodaXTraceSpanStatus(value: unknown): KodaXTraceSpanInput['status'] | undefined {
  if (value === 'ok' || value === 'error' || value === 'cancelled') return value;
  return undefined;
}

function normalizeRecord(value: unknown): Record<string, unknown> | undefined {
  return isRuntimeRecord(value) ? value : undefined;
}

function normalizeKodaXTraceSpan(value: unknown): KodaXTraceSpanInput | undefined {
  if (!isRuntimeRecord(value)) return undefined;
  const sessionId = normalizedString(value.sessionId, 180);
  const kind = normalizeKodaXTraceSpanKind(value.kind);
  const name = normalizedString(value.name, 240);
  if (!sessionId || !kind || !name) return undefined;
  return {
    spanId: normalizedString(value.spanId, 220),
    traceId: normalizedString(value.traceId, 220),
    sessionId,
    projectKey: normalizedString(value.projectKey, 180),
    title: normalizedString(value.title, 240),
    gitRoot: normalizedString(value.gitRoot, 500),
    scope: normalizeRuntimeScope(value.scope),
    runtime: normalizeRuntime(value.runtime),
    kind,
    name,
    parentSpanId: normalizedString(value.parentSpanId, 220),
    startedAt: normalizedIsoTime(value.startedAt),
    endedAt: normalizedIsoTime(value.endedAt),
    status: normalizeKodaXTraceSpanStatus(value.status),
    input: value.input,
    output: value.output,
    error: value.error,
    attributes: normalizeRecord(value.attributes),
  };
}

function normalizeKodaXRuntimeIngest(value: unknown): KodaXRuntimeIngestInput | undefined {
  if (!isRuntimeRecord(value)) return undefined;
  const events = Array.isArray(value.events)
    ? value.events
      .map(normalizeKodaXRuntimeEvent)
      .filter((item): item is KodaXRuntimeEventInput => Boolean(item))
      .slice(0, 200)
    : [];
  const spans = Array.isArray(value.spans)
    ? value.spans
      .map(normalizeKodaXTraceSpan)
      .filter((item): item is KodaXTraceSpanInput => Boolean(item))
      .slice(0, 200)
    : [];
  if (events.length === 0 && spans.length === 0) return undefined;
  return { events, spans };
}

function appendJobDiagnostic(
  job: IngestJob,
  diagnostic: Omit<NonNullable<IngestJob['diagnostics']>[number], 'id' | 'occurredAt'>,
) {
  const diagnostics = job.diagnostics ?? [];
  job.diagnostics = [
    ...diagnostics.slice(-39),
    {
      id: `diag_${job.id}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      occurredAt: new Date().toISOString(),
      triageStatus: diagnostic.level === 'info' ? undefined : 'open',
      ...diagnostic,
    },
  ];
}

function normalizeIngestDiagnosticTriageDecision(value: unknown): IngestDiagnosticTriageDecision | undefined {
  if (value === 'acknowledge' || value === 'ignore' || value === 'resolve' || value === 'reopen') {
    return value;
  }
  return undefined;
}

function normalizeIngestQualityPolicyAction(value: unknown): IngestQualityPolicyAction | undefined {
  if (value === 'manual_review' || value === 'auto_acknowledge' || value === 'auto_ignore' || value === 'auto_resolve') {
    return value;
  }
  return undefined;
}

function normalizeIngestQualityPolicySeverity(value: unknown): IngestQualityPolicySeverity | undefined {
  if (value === 'low' || value === 'medium' || value === 'high') return value;
  return undefined;
}

function normalizeIngestQualityPolicyLevel(value: unknown): IngestQualityPolicyRuleInput['level'] | undefined {
  if (value === 'warning' || value === 'error' || value === 'any') return value;
  return undefined;
}

function normalizeIngestQualityPolicyState(value: unknown): IngestQualityPolicyRuleInput['state'] | undefined {
  if (value === 'draft' || value === 'live' || value === 'paused') return value;
  return undefined;
}

function normalizeIngestQualityPolicyStatePreview(value: unknown): IngestQualityPolicyRuleInput['stateChangePreview'] | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const candidate = value as Record<string, unknown>;
  const matchedDiagnostics = finiteNumber(candidate.matchedDiagnostics);
  const changeableDiagnostics = finiteNumber(candidate.changeableDiagnostics);
  const matchedIssues = finiteNumber(candidate.matchedIssues);
  if (matchedDiagnostics === undefined || changeableDiagnostics === undefined || matchedIssues === undefined) return undefined;
  return { matchedDiagnostics, changeableDiagnostics, matchedIssues };
}

function normalizeIngestQualityPolicyRuleInput(value: unknown): IngestQualityPolicyRuleInput | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const candidate = value as Record<string, unknown>;
  const action = normalizeIngestQualityPolicyAction(candidate.action);
  if (!action || typeof candidate.code !== 'string' || candidate.code.trim() === '') return undefined;
  return {
    id: typeof candidate.id === 'string' ? candidate.id : undefined,
    code: candidate.code.trim().slice(0, 120),
    level: normalizeIngestQualityPolicyLevel(candidate.level),
    action,
    severity: normalizeIngestQualityPolicySeverity(candidate.severity),
    enabled: typeof candidate.enabled === 'boolean' ? candidate.enabled : undefined,
    state: normalizeIngestQualityPolicyState(candidate.state),
    note: typeof candidate.note === 'string' ? candidate.note.trim().slice(0, 500) : undefined,
    stateChangeActor: typeof candidate.stateChangeActor === 'string' ? candidate.stateChangeActor.trim().slice(0, 80) : undefined,
    stateChangeNote: typeof candidate.stateChangeNote === 'string' ? candidate.stateChangeNote.trim().slice(0, 500) : undefined,
    stateChangePreview: normalizeIngestQualityPolicyStatePreview(candidate.stateChangePreview),
  };
}

function normalizeIngestQualityRecommendationDecisionInput(value: unknown): IngestQualityRecommendationDecisionInput | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const candidate = value as Record<string, unknown>;
  if (candidate.decision !== 'dismissed' || !Array.isArray(candidate.recommendations)) return undefined;
  const recommendations = candidate.recommendations
    .map((item) => {
      if (!item || typeof item !== 'object') return undefined;
      const recommendation = item as Record<string, unknown>;
      const level = recommendation.level === 'error' ? 'error' : recommendation.level === 'warning' ? 'warning' : undefined;
      const action = normalizeIngestQualityPolicyAction(recommendation.suggestedAction);
      const severity = normalizeIngestQualityPolicySeverity(recommendation.suggestedSeverity);
      const openOccurrences = finiteNumber(recommendation.openOccurrences);
      if (
        typeof recommendation.issueId !== 'string'
        || typeof recommendation.code !== 'string'
        || typeof recommendation.message !== 'string'
        || typeof recommendation.reason !== 'string'
        || !level
        || !action
        || !severity
        || openOccurrences === undefined
      ) return undefined;
      return {
        issueId: recommendation.issueId.trim().slice(0, 160),
        code: recommendation.code.trim().slice(0, 120),
        level,
        message: recommendation.message.trim().slice(0, 500),
        suggestedAction: action,
        suggestedSeverity: severity,
        openOccurrences,
        reason: recommendation.reason.trim().slice(0, 500),
      };
    })
    .filter((item): item is IngestQualityRecommendationDecisionInput['recommendations'][number] => Boolean(item))
    .slice(0, 20);
  if (recommendations.length === 0) return undefined;
  return {
    recommendations,
    decision: 'dismissed',
    actor: typeof candidate.actor === 'string' ? candidate.actor.trim().slice(0, 80) : undefined,
    note: typeof candidate.note === 'string' ? candidate.note.trim().slice(0, 500) : undefined,
  };
}

function sessionCursor(summary: { id: string; projectKey?: string }) {
  return `${summary.projectKey ?? 'root'}:${summary.id}`;
}

function addSchemaDiagnostics(
  job: IngestJob,
  summary: { id: string; projectKey?: string },
  full: Awaited<ReturnType<typeof loadKodaXFullSession>>,
) {
  if (!full) return;
  let warnings = 0;
  if (full.malformedCount > 0) {
    warnings += 1;
    appendJobDiagnostic(job, {
      level: 'warning',
      code: 'kodax_malformed_lines',
      sourceSessionId: summary.id,
      recoverable: true,
      message: `${full.malformedCount} malformed jsonl line(s) were ignored during normalization.`,
    });
  }
  if (!full.runtimeInfo) {
    warnings += 1;
    appendJobDiagnostic(job, {
      level: 'warning',
      code: 'kodax_missing_runtime_info',
      sourceSessionId: summary.id,
      recoverable: true,
      message: 'Runtime metadata is missing; trace lineage remains usable but environment attribution is weaker.',
    });
  }
  if (!full.lineage && full.messages.length > 0) {
    warnings += 1;
    appendJobDiagnostic(job, {
      level: 'warning',
      code: 'kodax_legacy_transcript',
      sourceSessionId: summary.id,
      recoverable: true,
      message: 'Session uses legacy message records without lineage entries.',
    });
  }
  if (full.transcriptEntries.length === 0) {
    warnings += 1;
    appendJobDiagnostic(job, {
      level: 'warning',
      code: 'kodax_empty_transcript',
      sourceSessionId: summary.id,
      recoverable: true,
      message: 'Session has no normalized transcript entries.',
    });
  }
  job.schemaWarnings = (job.schemaWarnings ?? 0) + warnings;
}

function runtimeChunk<T>(items: T[], size = 150): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function importKodaXRuntimeFiles(job: IngestJob, summaries: Awaited<ReturnType<typeof listKodaXSessions>>) {
  const runtimeFiles = await loadKodaXRuntimeFiles(summaries);
  job.runtimeFilesDiscovered = runtimeFiles.files.length;
  if (runtimeFiles.roots.length === 0) {
    appendJobDiagnostic(job, {
      level: 'info',
      code: 'kodax_runtime_roots_missing',
      message: 'No KodaX project roots were found for tracing/workflow file discovery.',
    });
    return;
  }

  appendJobDiagnostic(job, {
    level: 'info',
    code: 'kodax_runtime_files_discovered',
    message: `Scanned ${runtimeFiles.roots.length} root(s), found ${runtimeFiles.files.length} tracing/workflow file(s).`,
  });

  if (runtimeFiles.malformedCount > 0) {
    appendJobDiagnostic(job, {
      level: 'warning',
      code: 'kodax_runtime_file_malformed_records',
      recoverable: true,
      message: `${runtimeFiles.malformedCount} malformed tracing/workflow record(s) were ignored.`,
    });
  }

  let acceptedEvents = 0;
  let acceptedSpans = 0;
  const eventChunks = runtimeChunk(runtimeFiles.events);
  const spanChunks = runtimeChunk(runtimeFiles.spans);
  const totalChunks = Math.max(eventChunks.length, spanChunks.length);
  for (let index = 0; index < totalChunks; index += 1) {
    const result = await store.ingestKodaXRuntime({
      events: eventChunks[index] ?? [],
      spans: spanChunks[index] ?? [],
    });
    acceptedEvents += result.acceptedEvents;
    acceptedSpans += result.acceptedSpans;
  }

  job.runtimeFilesImported = runtimeFiles.files.filter((file) => file.events.length > 0 || file.spans.length > 0).length;
  job.runtimeEventsImported = acceptedEvents;
  job.runtimeSpansImported = acceptedSpans;
  if (acceptedEvents > 0 || acceptedSpans > 0) {
    job.updated = (job.updated ?? 0) + acceptedEvents + acceptedSpans;
    appendJobDiagnostic(job, {
      level: 'info',
      code: 'kodax_runtime_files_imported',
      message: `Imported ${acceptedEvents} workflow/runtime event(s) and ${acceptedSpans} tracing span(s) from KodaX files.`,
    });
  }
}

const store = new TraceOpsStore({
  id: 'source_kodax_local',
  type: 'kodax',
  displayName: 'KodaX Local Sessions',
  enabled: true,
  sessionsDir,
  exists: false,
  autoWatch: true,
  autoApplyQualityPolicy: true,
  watcherStatus: 'idle',
  watchIntervalMs,
  scope: 'all',
  rawTraceTrainable: false,
});

async function syncKodaXSessions(mode: 'manual' | 'watch' | 'scheduled' | 'retry' = 'manual') {
  const job = await store.createJob(mode);
  appendJobDiagnostic(job, {
    level: 'info',
    code: 'kodax_sync_started',
    message: job.resumeFromCursor
      ? `Sync started from previous checkpoint ${job.resumeFromCursor}.`
      : 'Sync started without a previous checkpoint.',
  });
  try {
    const exists = await sessionsDirExists(sessionsDir);
    await store.updateSource({ exists });
    if (!exists) {
      job.failed += 1;
      appendJobDiagnostic(job, {
        level: 'error',
        code: 'kodax_sessions_dir_missing',
        message: `KodaX sessions directory does not exist: ${sessionsDir}`,
        recoverable: true,
      });
      return await store.finishJob(job, 'failed', `KodaX sessions directory does not exist: ${sessionsDir}`);
    }

    const summaries = await listKodaXSessions(sessionsDir);
    job.discovered = summaries.length;

    for (const summary of summaries) {
      job.checkpointCursor = sessionCursor(summary);
      try {
        const full = await loadKodaXFullSession(summary, sessionsDir);
        if (!full) {
          job.failed += 1;
          appendJobDiagnostic(job, {
            level: 'error',
            code: 'kodax_session_parse_failed',
            sourceSessionId: summary.id,
            recoverable: true,
            message: 'Session could not be parsed into a KodaX trace bundle.',
          });
          await store.markFailed(summary.id, summary.projectKey, job.id, 'Session could not be parsed');
          continue;
        }

        addSchemaDiagnostics(job, summary, full);
        const bundle = normalizeKodaXSession(summary, full);
        const result = await store.upsertBundle(bundle);
        if (result === 'skipped') {
          job.skipped += 1;
          job.unchanged = (job.unchanged ?? 0) + 1;
        } else {
          job.imported += 1;
          if (result === 'created') job.created = (job.created ?? 0) + 1;
          if (result === 'updated') job.updated = (job.updated ?? 0) + 1;
          appendJobDiagnostic(job, {
            level: 'info',
            code: result === 'created' ? 'kodax_session_created' : 'kodax_session_updated',
            sourceSessionId: summary.id,
            traceId: bundle.trace.id,
            message: `${bundle.trace.title} was ${result === 'created' ? 'created' : 'updated'} from KodaX source hash ${bundle.trace.latestSourceHash}.`,
          });
        }
      } catch (error) {
        job.failed += 1;
        appendJobDiagnostic(job, {
          level: 'error',
          code: 'kodax_session_ingest_error',
          sourceSessionId: summary.id,
          recoverable: true,
          message: error instanceof Error ? error.message : String(error),
        });
        await store.markFailed(summary.id, summary.projectKey, job.id, error instanceof Error ? error.message : String(error));
      }
    }

    await importKodaXRuntimeFiles(job, summaries);

    appendJobDiagnostic(job, {
      level: job.failed > 0 ? 'warning' : 'info',
      code: 'kodax_sync_completed',
      message: `${job.imported} session(s) written, ${job.created ?? 0} created, ${job.updated ?? 0} updated/runtime item(s), ${job.unchanged ?? job.skipped} unchanged, ${job.failed} failed.`,
    });
    return await store.finishJob(job, job.failed > 0 ? 'failed' : 'succeeded');
  } catch (error) {
    job.failed += 1;
    appendJobDiagnostic(job, {
      level: 'error',
      code: 'kodax_sync_crashed',
      message: error instanceof Error ? error.message : String(error),
      recoverable: true,
    });
    return await store.finishJob(job, 'failed', error instanceof Error ? error.message : String(error));
  }
}

await store.load();
await store.updateSource({ exists: await sessionsDirExists(sessionsDir), sessionsDir, watchIntervalMs });

async function applyQualityPolicyAfterSync(trigger: 'watch' | 'manual' | 'retry', sourceJobId?: string) {
  const source = store.getSource();
  if (source.autoApplyQualityPolicy === false) return undefined;
  const policy = store.listIngestQualityPolicy();
  if (policy.summary.enabledRules === 0) return undefined;
  const result = await store.applyIngestQualityPolicyRules(`kodax-${trigger}-policy`, trigger, sourceJobId);
  const message = result.run?.message ?? `${result.affectedDiagnostics} diagnostics handled by ${result.appliedRules} policy rules`;
  await store.updateSource({
    lastPolicyApplyAt: result.run?.finishedAt ?? new Date().toISOString(),
    lastPolicyApplyMessage: message,
  });
  return result;
}

function scheduleWatch(delayMs = watchIntervalMs) {
  if (watchTimer) clearTimeout(watchTimer);
  const nextWatchAt = new Date(Date.now() + delayMs).toISOString();
  void store.updateSource({ nextWatchAt });
  watchTimer = setTimeout(() => {
    void runWatchSync();
  }, delayMs);
}

async function runWatchSync() {
  const source = store.getSource();
  if (!source.autoWatch) {
    await store.updateSource({ watcherStatus: 'idle', nextWatchAt: undefined });
    return;
  }
  if (watchInFlight) {
    scheduleWatch();
    return;
  }

  watchInFlight = true;
  try {
    await store.updateSource({ watcherStatus: 'syncing', lastWatchMessage: 'Checking KodaX sessions' });
    const job = await syncKodaXSessions('watch');
    const policyResult = await applyQualityPolicyAfterSync('watch', job.id);
    const policyMessage = policyResult
      ? ` · policy ${policyResult.affectedDiagnostics} handled`
      : '';
    await store.updateSource({
      watcherStatus: job.status === 'failed' ? 'error' : 'idle',
      lastWatchSyncAt: job.finishedAt ?? new Date().toISOString(),
      lastWatchMessage: `${job.imported} written, ${job.updated ?? 0} updated, ${job.unchanged ?? job.skipped} unchanged, ${job.failed} failed${policyMessage}`,
    });
  } catch (error) {
    await store.updateSource({
      watcherStatus: 'error',
      lastWatchMessage: error instanceof Error ? error.message : String(error),
    });
  } finally {
    watchInFlight = false;
    scheduleWatch();
  }
}

type TaskArtifactState = 'succeeded' | 'failed' | 'cancelled' | 'waiting' | 'unknown';

function runLimit(value: unknown, fallback = 3): number {
  const limit = finiteNumber(value) ?? fallback;
  return Math.min(10, Math.max(1, Math.round(limit)));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function artifactStatus(value: unknown): string | undefined {
  if (!isRecord(value)) return undefined;
  if (typeof value.status === 'string') return value.status;
  if (typeof value.ingestionStatus === 'string') return value.ingestionStatus;
  return undefined;
}

function artifactLabel(value: unknown): string {
  if (!isRecord(value)) return 'linked artifact';
  for (const key of ['name', 'title', 'modelName', 'datasetVersionName', 'environment', 'id']) {
    const label = value[key];
    if (typeof label === 'string' && label.trim()) return label;
  }
  return 'linked artifact';
}

function artifactState(status?: string): TaskArtifactState {
  if (!status) return 'unknown';
  if ([
    'ready',
    'approved',
    'live',
    'healthy',
    'promoted',
    'passed',
    'succeeded',
    'completed',
    'imported',
    'updated',
    'ready_for_rollout',
  ].includes(status)) {
    return 'succeeded';
  }
  if ([
    'failed',
    'ingest_failed',
    'blocked',
    'rejected',
    'rolled_back',
    'rollback_required',
    'attention',
    'changes_requested',
  ].includes(status)) {
    return 'failed';
  }
  if (status === 'cancelled' || status === 'closed' || status === 'revoked') return 'cancelled';
  if ([
    'queued',
    'planned',
    'candidate',
    'running',
    'importing',
    'preparing',
    'evaluating',
    'watching',
    'review',
    'pending',
    'triaged',
    'in_progress',
  ].includes(status)) {
    return 'waiting';
  }
  return 'unknown';
}

function trainingProviderPayload(run: DatasetTrainingRunRecord, provider: DatasetTrainingProvider) {
  return {
    provider,
    traceOpsRunId: run.id,
    handoffId: run.handoffId,
    datasetVersionId: run.datasetVersionId,
    datasetVersionName: run.datasetVersionName,
    modelName: run.modelName,
    modelVersion: run.modelVersion,
    format: run.defaultFormat,
    objective: run.launchPlan?.objective,
    trainingDataUrl: run.trainingDataUrl,
    reviewDataUrl: run.reviewDataUrl,
    packageUrl: run.packageUrl,
    handoffUrl: run.handoffUrl,
    rollbackCriteria: run.rollbackCriteria,
    metrics: run.metrics.map((metric) => ({
      id: metric.id,
      label: metric.label,
      target: metric.target,
      unit: metric.unit,
    })),
    metadata: {
      releasePackageHash: run.releasePackageHash,
      handoffHash: run.handoffHash,
      launchPlanHash: run.launchPlanHash,
      createdBy: 'traceops',
    },
  };
}

function responsePreview(value: string, max = 1200): string {
  const compact = value.replace(/\s+/g, ' ').trim();
  return compact.length > max ? `${compact.slice(0, max - 3)}...` : compact;
}

function externalRunIdFromResponse(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  for (const key of ['id', 'runId', 'jobId', 'externalRunId']) {
    if (typeof record[key] === 'string' && record[key]) return record[key] as string;
  }
  const fineTuningJob = record.fine_tuning_job;
  if (fineTuningJob && typeof fineTuningJob === 'object') {
    const id = (fineTuningJob as Record<string, unknown>).id;
    if (typeof id === 'string' && id) return id;
  }
  const data = record.data;
  if (data && typeof data === 'object') {
    const id = (data as Record<string, unknown>).id;
    if (typeof id === 'string' && id) return id;
  }
  return undefined;
}

function readProviderStatusField(value: unknown): DatasetTrainingProviderStatus | undefined {
  if (!value || typeof value !== 'object') return normalizeTrainingProviderStatus(value);
  const record = value as Record<string, unknown>;
  for (const key of ['providerStatus', 'status', 'state', 'trainingStatus', 'training_status', 'lifecycleStatus']) {
    const status = normalizeTrainingProviderStatus(record[key]);
    if (status) return status;
  }
  for (const key of ['job', 'run', 'data', 'fine_tuning_job', 'result']) {
    const nested = record[key];
    if (nested && typeof nested === 'object') {
      const status = readProviderStatusField(nested);
      if (status) return status;
    }
  }
  return undefined;
}

function readProviderMetric(value: unknown, keys: string[]): number | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  for (const key of keys) {
    const direct = finiteNumber(record[key]);
    if (direct !== undefined) return direct;
  }
  for (const nestedKey of ['metrics', 'result', 'results', 'eval', 'evaluation']) {
    const nested = record[nestedKey];
    if (nested && typeof nested === 'object') {
      const metric = readProviderMetric(nested, keys);
      if (metric !== undefined) return metric;
    }
  }
  return undefined;
}

function readProviderText(value: unknown, keys: string[]): string | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  for (const key of keys) {
    const direct = normalizedString(record[key], 800);
    if (direct) return direct;
  }
  for (const nestedKey of ['result', 'results', 'summary', 'data']) {
    const nested = record[nestedKey];
    if (nested && typeof nested === 'object') {
      const text = readProviderText(nested, keys);
      if (text) return text;
    }
  }
  return undefined;
}

function resolveTaskArtifact(task: TraceOpsTaskRecord): unknown {
  const primary = task.entityRefs[0];
  if (!primary) return undefined;
  switch (primary.kind) {
    case 'ingest_job':
      return store.listJobs().find((job) => job.id === primary.id);
    case 'trace': {
      const detail = store.getTrace(primary.id);
      return detail ? { ...detail.trace, status: detail.trace.ingestionStatus } : undefined;
    }
    case 'dataset_version':
      return store.getDatasetVersion(primary.id);
    case 'release_manifest':
      return store.getReleaseManifest(primary.id);
    case 'release_promotion':
      return store.listReleasePromotions().find((promotion) => promotion.id === primary.id);
    case 'retraining_handoff':
      return store.getRetrainingHandoff(primary.id);
    case 'training_run':
      return store.getTrainingRun(primary.id);
    case 'eval_run':
      return store.getEvalRun(primary.id);
    case 'model_release_gate':
      return store.getModelReleaseGate(primary.id);
    case 'deployment_handoff':
      return store.getDeploymentHandoff(primary.id);
    case 'post_release_monitor':
      return store.getPostReleaseMonitor(primary.id);
    case 'feedback_loop':
      return store.getFeedbackLoop(primary.id);
    default:
      return undefined;
  }
}

function remediationSummaryForTask(task: TraceOpsTaskRecord): string | undefined {
  const monitorRef = task.entityRefs.find((ref) => ref.kind === 'post_release_monitor');
  if (!monitorRef) return undefined;
  const promotedLoop = store.listFeedbackLoops().find((loop) =>
    loop.postReleaseMonitorId === monitorRef.id && loop.status === 'promoted'
  );
  if (!promotedLoop) return undefined;
  const datasetVersion = store.listDatasetVersions().find((version) =>
    (version.feedbackLoopIds ?? []).includes(promotedLoop.id)
  );
  if (datasetVersion) {
    return `Remediated by feedback loop ${promotedLoop.id} and dataset ${datasetVersion.name}.`;
  }
  return `Remediated by promoted feedback loop ${promotedLoop.id}.`;
}

async function executeTask(task: TraceOpsTaskRecord): Promise<TraceOpsTaskExecutionResult> {
  if (task.kind === 'kodax_sync') {
    const started = await store.startTask(task.id, 'Worker is syncing KodaX sessions.');
    const activeTask = started ?? task;
    const job = await syncKodaXSessions('retry');
    await applyQualityPolicyAfterSync('retry', job.id);
    if (job.status === 'failed') {
      const failed = await store.failTask(activeTask.id, job.message ?? 'KodaX sync failed.');
      return store.taskExecutionResult(failed ?? activeTask, true, job.message ?? 'KodaX sync failed.');
    }
    const completed = await store.completeTask(activeTask.id, `${job.imported} imported, ${job.skipped} skipped, ${job.failed} failed.`);
    return store.taskExecutionResult(completed ?? activeTask, true, 'KodaX sync completed.');
  }

  if (task.kind === 'storage_maintenance') {
    const started = await store.startTask(task.id, 'Worker is creating a durable storage snapshot and compacting history.');
    const snapshot = await store.createPersistenceSnapshot({
      reason: 'automated_task_storage_maintenance',
      createdBy: 'traceops-task-worker',
    });
    const compact = await store.compactStore();
    await store.recordGovernanceAudit({
      action: 'storage.maintenance',
      decision: 'recorded',
      actor: { id: 'traceops-task-worker', role: 'local_admin', displayName: 'TraceOps task worker' },
      entityRefs: [],
      reason: 'Automated storage maintenance task completed.',
      metadata: {
        snapshotId: snapshot.snapshot.id,
        compressedBytes: snapshot.snapshot.compressedBytes,
        jobsRemoved: compact.jobsRemoved,
        errorsRemoved: compact.errorsRemoved,
        storeBytesAfter: compact.storeBytesAfter,
      },
    });
    const completed = await store.completeTask(
      started?.id ?? task.id,
      `Snapshot ${snapshot.snapshot.id} created; compacted ${compact.jobsRemoved} jobs and ${compact.errorsRemoved} errors.`,
    );
    return store.taskExecutionResult(completed ?? started ?? task, true, 'Storage maintenance completed.');
  }

  if (task.kind === 'kodax_feedback') {
    const started = await store.startTask(task.id, 'Worker is preparing the KodaX feedback package.');
    const feedbackPackage = store.getKodaXFeedbackPackage();
    await store.recordGovernanceAudit({
      action: 'kodax.feedback_package',
      decision: 'recorded',
      actor: { id: 'traceops-task-worker', role: 'data_governance', displayName: 'TraceOps task worker' },
      entityRefs: [],
      reason: 'Automated KodaX feedback package prepared.',
      metadata: {
        packageId: feedbackPackage.id,
        packageHash: feedbackPackage.packageHash,
        signals: feedbackPackage.report.summary.signals,
        actionItems: feedbackPackage.report.summary.actionItems,
      },
    });
    const completed = await store.completeTask(
      started?.id ?? task.id,
      `KodaX feedback package ${feedbackPackage.id} prepared with ${feedbackPackage.report.summary.signals} signal(s).`,
    );
    return store.taskExecutionResult(completed ?? started ?? task, true, 'KodaX feedback package prepared.');
  }

  if (task.kind === 'governance_review') {
    const started = await store.startTask(task.id, 'Worker is summarizing KodaX governance blockers.');
    const report = store.getKodaXFeedbackReport();
    const blockers = report.signals.filter((signal) =>
      signal.category === 'governance_blocker' || signal.category === 'evidence_gap'
    );
    await store.recordGovernanceAudit({
      action: 'governance.automated_review',
      decision: blockers.length > 0 ? 'recorded' : 'allowed',
      actor: { id: 'traceops-task-worker', role: 'data_governance', displayName: 'TraceOps task worker' },
      entityRefs: blockers.flatMap((signal) => signal.sourceRefs).slice(0, 8),
      reason: blockers.length > 0
        ? 'Automated governance review found KodaX blockers.'
        : 'Automated governance review found no active KodaX blockers.',
      metadata: {
        blockerCount: blockers.length,
        signals: blockers.map((signal) => ({
          category: signal.category,
          severity: signal.severity,
          metric: signal.metric,
        })),
      },
    });
    const completed = await store.completeTask(
      started?.id ?? task.id,
      blockers.length > 0
        ? `Governance review summarized ${blockers.length} blocker signal(s).`
        : 'Governance review found no active blocker signals.',
    );
    return store.taskExecutionResult(completed ?? started ?? task, true, 'Governance review completed.');
  }

  const artifact = resolveTaskArtifact(task);
  if (!artifact) {
    const failed = await store.failTask(task.id, 'Linked artifact no longer exists.');
    return store.taskExecutionResult(failed ?? task, true, 'Linked artifact no longer exists.');
  }

  const status = artifactStatus(artifact);
  const state = artifactState(status);
  const label = artifactLabel(artifact);
  const remediationSummary = remediationSummaryForTask(task);
  if (state === 'failed' && remediationSummary) {
    const started = await store.startTask(task.id, `Worker found remediation for ${label}.`);
    const completed = await store.completeTask(started?.id ?? task.id, remediationSummary);
    return store.taskExecutionResult(completed ?? started ?? task, true, remediationSummary);
  }
  if (state === 'succeeded') {
    const started = await store.startTask(task.id, `Worker reconciled ${label}.`);
    const completed = await store.completeTask(started?.id ?? task.id, `${label} is ${status ?? 'ready'}.`);
    return store.taskExecutionResult(completed ?? started ?? task, true, `${label} is ${status ?? 'ready'}.`);
  }
  if (state === 'failed' || state === 'cancelled') {
    const started = await store.startTask(task.id, `Worker reconciled ${label}.`);
    const failed = await store.failTask(started?.id ?? task.id, `${label} is ${status ?? state}.`);
    return store.taskExecutionResult(failed ?? started ?? task, true, `${label} is ${status ?? state}.`);
  }

  const deferred = await store.deferTask(task.id, `${label} is still ${status ?? 'waiting'}; worker will check again.`, 45_000);
  return store.taskExecutionResult(deferred ?? task, false, `${label} is still ${status ?? 'waiting'}.`);
}

async function runQueuedTasks(limit = 3): Promise<TraceOpsTaskRunResponse> {
  await store.listTasks();
  const tasks = store.listQueuedTasksForExecution(limit);
  const results: TraceOpsTaskExecutionResult[] = [];
  for (const task of tasks) {
    try {
      results.push(await executeTask(task));
    } catch (error) {
      const failed = await store.failTask(task.id, error instanceof Error ? error.message : String(error));
      results.push(store.taskExecutionResult(failed ?? task, true, error instanceof Error ? error.message : String(error)));
    }
  }
  return {
    requested: limit,
    executed: results.filter((result) => result.executed).length,
    succeeded: results.filter((result) => result.task.status === 'succeeded').length,
    failed: results.filter((result) => result.task.status === 'failed').length,
    skipped: results.filter((result) => !result.executed).length,
    results,
  };
}

function scheduleTaskExecutor(delayMs = taskExecutorIntervalMs) {
  if (taskExecutorTimer) clearTimeout(taskExecutorTimer);
  taskExecutorTimer = setTimeout(() => {
    void runTaskExecutorTick();
  }, delayMs);
}

async function runTaskExecutorTick() {
  if (taskExecutorInFlight) {
    scheduleTaskExecutor();
    return;
  }
  taskExecutorInFlight = true;
  try {
    await runQueuedTasks(2);
  } catch (error) {
    process.stderr.write(`TraceOps task executor failed: ${error instanceof Error ? error.message : String(error)}\n`);
  } finally {
    taskExecutorInFlight = false;
    scheduleTaskExecutor();
  }
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/api/v0.1/collector', createSpaceCollectorV01Router());
app.use('/api/platform', createPlatformArchitectureRouter(store));

app.get('/', (_req, res) => {
  if (process.env.TRACEOPS_SERVE_COLLECTOR === 'true') {
    res.sendFile(path.resolve(process.cwd(), 'dist/v0.1.2/index.html'));
    return;
  }
  res.type('html').send(`
    <!doctype html>
    <html lang="zh-CN">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>TraceOps API</title>
        <style>
          body { font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 40px; color: #17181c; background: #f5f6f8; }
          main { max-width: 720px; background: #fff; border: 1px solid #dde1e7; border-radius: 8px; padding: 24px; }
          a { color: #111318; font-weight: 800; }
          code { background: #f1f3f6; padding: 2px 6px; border-radius: 6px; }
        </style>
      </head>
      <body>
        <main>
          <h1>TraceOps API</h1>
          <p>Worker is running. Open the product UI at <a href="http://localhost:5173/">http://localhost:5173/</a>.</p>
          <p>Health check: <code>/api/health</code></p>
        </main>
      </body>
    </html>
  `);
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'traceops-api' });
});

app.get('/api/governance/policy', (_req, res) => {
  res.json(store.getGovernancePolicy());
});

app.get('/api/governance/audit-log', (req, res) => {
  res.json(store.listGovernanceAuditRecords(finiteNumber(req.query.limit) ?? 200));
});

app.post('/api/maintenance/store/compact', async (_req, res) => {
  res.json(await store.compactStore());
});

app.get('/api/storage/health', async (_req, res) => {
  res.json(await store.getPersistenceHealth());
});

app.get('/api/storage/snapshots', async (_req, res) => {
  res.json(await store.listPersistenceSnapshots());
});

app.get('/api/storage/segments', (_req, res) => {
  res.json(store.listSegmentStoreStatus());
});

app.post('/api/storage/segments/backfill', async (req, res) => {
  const actor = await requireGovernancePermission(req, res, 'storage.segment_backfill', {
    reason: 'Backfilling immutable segment files materializes governed traces, samples, and datasets to local lake storage.',
    metadata: {
      reason: typeof req.body?.reason === 'string' ? req.body.reason : undefined,
    },
  });
  if (!actor) return;
  const result = await store.backfillSegmentStore(
    typeof req.body?.reason === 'string' ? req.body.reason : 'manual_segment_backfill',
  );
  await store.recordGovernanceAudit({
    action: 'storage.segment_backfill',
    decision: 'allowed',
    actor,
    entityRefs: [],
    reason: 'Backfilled immutable TraceOps segment store.',
    metadata: {
      written: result.written,
      skipped: result.skipped,
      filesCreated: result.filesCreated,
      filesSealed: result.filesSealed,
      streams: result.streamWrites,
    },
  });
  res.json(result);
});

app.post('/api/storage/segments/rebuild', async (req, res) => {
  const actor = await requireGovernancePermission(req, res, 'storage.segment_rebuild', {
    reason: 'Rebuilding immutable segment files resets the local lake index and rematerializes governed data.',
    metadata: {
      reason: typeof req.body?.reason === 'string' ? req.body.reason : undefined,
    },
  });
  if (!actor) return;
  const result = await store.rebuildSegmentStore(
    typeof req.body?.reason === 'string' ? req.body.reason : 'manual_segment_rebuild',
  );
  await store.recordGovernanceAudit({
    action: 'storage.segment_rebuild',
    decision: 'allowed',
    actor,
    entityRefs: [],
    reason: 'Rebuilt immutable TraceOps segment store.',
    metadata: {
      written: result.written,
      skipped: result.skipped,
      filesCreated: result.filesCreated,
      filesSealed: result.filesSealed,
      streams: result.streamWrites,
    },
  });
  res.json(result);
});

app.post('/api/storage/snapshots', async (req, res) => {
  const actor = await requireGovernancePermission(req, res, 'storage.snapshot', {
    reason: 'Creating durable local persistence snapshot requires storage governance permission.',
    metadata: {
      reason: typeof req.body?.reason === 'string' ? req.body.reason : undefined,
    },
  });
  if (!actor) return;
  await store.recordGovernanceAudit({
    action: 'storage.snapshot',
    decision: 'allowed',
    actor,
    entityRefs: [],
    reason: 'Creating durable local persistence snapshot.',
    metadata: {
      reason: typeof req.body?.reason === 'string' ? req.body.reason : undefined,
    },
  });
  res.json(await store.createPersistenceSnapshot({
    reason: typeof req.body?.reason === 'string' ? req.body.reason : undefined,
    createdBy: actor.id,
  }));
});

app.post('/api/storage/snapshots/:id/restore', async (req, res) => {
  const actor = await requireGovernancePermission(req, res, 'storage.restore', {
    reason: 'Restoring local persistence requires local admin permission.',
    metadata: {
      snapshotId: req.params.id,
    },
  });
  if (!actor) return;
  try {
    const result = await store.restorePersistenceSnapshot(req.params.id, actor.id);
    if (!result) {
      res.status(404).json({ error: 'Snapshot not found' });
      return;
    }
    await store.recordGovernanceAudit({
      action: 'storage.restore',
      decision: 'allowed',
      actor,
      entityRefs: [],
      reason: `Restored local persistence from snapshot ${req.params.id}.`,
      metadata: {
        snapshotId: result.snapshot.id,
        snapshotCreatedAt: result.snapshot.createdAt,
        snapshotHash: result.snapshot.sha256,
      },
    });
    res.json(result);
  } catch (error) {
    await store.recordGovernanceAudit({
      action: 'storage.restore',
      decision: 'denied',
      actor,
      entityRefs: [],
      reason: 'Snapshot restore failed.',
      metadata: {
        snapshotId: req.params.id,
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });
    res.status(409).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.post('/api/maintenance/ingest/resolve-fixed-kodax', async (req, res) => {
  res.json(await store.resolveFixedKodaXIngestDiagnostics(
    typeof req.body?.actor === 'string' ? req.body.actor.trim().slice(0, 80) : undefined,
  ));
});

app.get('/api/sources', (_req, res) => {
  res.json([store.getSource()]);
});

app.get('/api/sources/kodax/status', async (_req, res) => {
  const exists = await sessionsDirExists(sessionsDir);
  const status = await store.updateSource({ exists, sessionsDir });
  res.json(status);
});

app.post('/api/sources/kodax/sync', async (req, res) => {
  const mode = req.body?.mode === 'retry' ? 'retry' : 'manual';
  const job = await syncKodaXSessions(mode);
  await applyQualityPolicyAfterSync(mode, job.id);
  res.json(job);
});

app.post('/api/sources/kodax/watch', async (req, res) => {
  const enabled = req.body?.enabled !== false;
  const status = await store.updateSource({
    autoWatch: enabled,
    watcherStatus: enabled ? 'idle' : 'idle',
    nextWatchAt: enabled ? new Date(Date.now() + watchIntervalMs).toISOString() : undefined,
  });
  if (enabled) scheduleWatch();
  else if (watchTimer) clearTimeout(watchTimer);
  res.json(status);
});

app.post('/api/runtime/kodax/events', async (req, res) => {
  const input = normalizeKodaXRuntimeIngest(req.body);
  if (!input) {
    res.status(400).json({ error: 'A valid KodaX runtime event or tracing span payload is required.' });
    return;
  }
  try {
    res.json(await store.ingestKodaXRuntime(input));
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.get('/api/harness-snapshots', (_req, res) => {
  res.json(store.listHarnessSnapshots());
});

app.post('/api/harness-snapshots', async (req, res) => {
  if (!isRuntimeRecord(req.body)) {
    res.status(400).json({ error: 'A Harness snapshot payload is required.' });
    return;
  }
  const name = normalizedString(req.body.name, 180);
  const version = normalizedString(req.body.version, 120);
  if (!name || !version) {
    res.status(400).json({ error: 'Harness name and version are required.' });
    return;
  }
  const source = isRuntimeRecord(req.body.source) ? req.body.source : {};
  const components = isRuntimeRecord(req.body.components) ? req.body.components : {};
  const input: HarnessSnapshotCreateInput = {
    name,
    version,
    parentId: normalizedString(req.body.parentId, 160),
    status: req.body.status === 'draft' || req.body.status === 'active' || req.body.status === 'archived' ? req.body.status : 'candidate',
    source: {
      repository: normalizedString(source.repository, 500),
      commit: normalizedString(source.commit, 180),
      profileId: normalizedString(source.profileId, 180),
      profileVersion: normalizedString(source.profileVersion, 120),
    },
    components: {
      promptHash: normalizedString(components.promptHash, 200),
      contextPolicyHash: normalizedString(components.contextPolicyHash, 200),
      skillManifestHash: normalizedString(components.skillManifestHash, 200),
      memoryPolicyHash: normalizedString(components.memoryPolicyHash, 200),
      toolRegistryHash: normalizedString(components.toolRegistryHash, 200),
      workflowHash: normalizedString(components.workflowHash, 200),
      verifierHash: normalizedString(components.verifierHash, 200),
      runtimePolicyHash: normalizedString(components.runtimePolicyHash, 200),
    },
    compatibleModels: normalizedStringArray(req.body.compatibleModels, 50, 180),
    changeSummary: normalizedString(req.body.changeSummary, 2000),
    sourceTraceIds: normalizedStringArray(req.body.sourceTraceIds, 100, 180),
    createdBy: normalizedString(req.body.createdBy, 120),
  };
  try {
    res.status(201).json(await store.createHarnessSnapshot(input));
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.get('/api/harness-snapshots/:id', (req, res) => {
  const snapshot = store.getHarnessSnapshot(req.params.id);
  if (!snapshot) {
    res.status(404).json({ error: 'Harness snapshot was not found.' });
    return;
  }
  res.json(snapshot);
});

app.get('/api/harness-snapshots/:id/diff', (req, res) => {
  const diff = store.getHarnessSnapshotDiff(req.params.id, normalizedString(req.query.baseId, 180));
  if (!diff) {
    res.status(404).json({ error: 'Harness diff could not be created.' });
    return;
  }
  res.json(diff);
});

app.get('/api/agent-eval/issues', (_req, res) => {
  res.json(store.listAgentEvaluationIssues());
});

app.post('/api/agent-eval/issues', async (req, res) => {
  if (!isRuntimeRecord(req.body) || !normalizedString(req.body.title, 180)) {
    res.status(400).json({ error: 'Evaluation issue title is required.' });
    return;
  }
  const category = req.body.category;
  const input: AgentEvaluationIssueCreateInput = {
    title: normalizedString(req.body.title, 180)!,
    description: normalizedString(req.body.description, 3000),
    category: category === 'context' || category === 'skill' || category === 'memory' || category === 'tool_use'
      || category === 'planning' || category === 'verification' || category === 'runtime' ? category : 'other',
    scopeTags: normalizedStringArray(req.body.scopeTags, 100, 120),
    sourceTraceIds: normalizedStringArray(req.body.sourceTraceIds, 100, 180),
    primaryMetricId: normalizedString(req.body.primaryMetricId, 120),
    owner: normalizedString(req.body.owner, 120),
  };
  try {
    res.status(201).json(await store.createAgentEvaluationIssue(input));
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.get('/api/agent-eval/issues/:id', (req, res) => {
  const issue = store.getAgentEvaluationIssue(req.params.id);
  if (!issue) {
    res.status(404).json({ error: 'Evaluation issue was not found.' });
    return;
  }
  res.json(issue);
});

app.patch('/api/agent-eval/issues/:id', async (req, res) => {
  if (!isRuntimeRecord(req.body)) {
    res.status(400).json({ error: 'Evaluation issue update is required.' });
    return;
  }
  const status: AgentEvaluationIssue['status'] | undefined = req.body.status === 'open' || req.body.status === 'evaluating'
    || req.body.status === 'validated' || req.body.status === 'rejected' ? req.body.status : undefined;
  try {
    const issue = await store.updateAgentEvaluationIssue(req.params.id, {
      title: normalizedString(req.body.title, 180),
      description: normalizedString(req.body.description, 3000),
      scopeTags: Array.isArray(req.body.scopeTags) ? normalizedStringArray(req.body.scopeTags, 100, 120) : undefined,
      primaryMetricId: normalizedString(req.body.primaryMetricId, 120),
      owner: normalizedString(req.body.owner, 120),
      status,
    });
    if (!issue) {
      res.status(404).json({ error: 'Evaluation issue was not found.' });
      return;
    }
    res.json(issue);
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.get('/api/agent-eval/benchmark-cases', (_req, res) => {
  res.json(store.listAgentBenchmarkCases());
});

app.post('/api/agent-eval/benchmark-cases', async (req, res) => {
  if (!isRuntimeRecord(req.body) || !normalizedString(req.body.title, 180)) {
    res.status(400).json({ error: 'Benchmark case title is required.' });
    return;
  }
  const grader = isRuntimeRecord(req.body.grader) ? req.body.grader : {};
  const input: AgentBenchmarkCaseCreateInput = {
    title: normalizedString(req.body.title, 180)!,
    sourceTraceId: normalizedString(req.body.sourceTraceId, 180),
    usage: req.body.usage === 'update_evidence' ? 'update_evidence' : 'validation',
    taskType: normalizedString(req.body.taskType, 120),
    scopeTags: normalizedStringArray(req.body.scopeTags, 100, 120),
    inputRef: normalizedString(req.body.inputRef, 500),
    environmentRef: normalizedString(req.body.environmentRef, 500),
    expectedArtifactRefs: normalizedStringArray(req.body.expectedArtifactRefs, 100, 300),
    grader: {
      kind: grader.kind === 'trace_signal' || grader.kind === 'command' || grader.kind === 'artifact' || grader.kind === 'json_schema' ? grader.kind : 'manual',
      version: normalizedString(grader.version, 120) ?? 'manual-v1',
      config: isRuntimeRecord(grader.config) ? grader.config : undefined,
    },
    critical: req.body.critical === true,
    riskLevel: req.body.riskLevel === 'L0' || req.body.riskLevel === 'L2' || req.body.riskLevel === 'L3' || req.body.riskLevel === 'L4' ? req.body.riskLevel : 'L1',
    status: req.body.status === 'draft' || req.body.status === 'archived' ? req.body.status : 'ready',
    createdBy: normalizedString(req.body.createdBy, 120),
  };
  try {
    res.status(201).json(await store.createAgentBenchmarkCase(input));
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.post('/api/agent-eval/benchmark-cases/from-trace/:traceId', async (req, res) => {
  const body = isRuntimeRecord(req.body) ? req.body : {};
  try {
    res.status(201).json(await store.createAgentBenchmarkCaseFromTrace(req.params.traceId, {
      title: normalizedString(body.title, 180) ?? '',
      usage: body.usage === 'update_evidence' ? 'update_evidence' : 'validation',
      taskType: normalizedString(body.taskType, 120),
      scopeTags: normalizedStringArray(body.scopeTags, 100, 120),
      critical: body.critical === true,
      createdBy: normalizedString(body.createdBy, 120),
    }));
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.get('/api/agent-eval/benchmark-suites', (_req, res) => {
  res.json(store.listAgentBenchmarkSuites());
});

app.post('/api/agent-eval/benchmark-suites', async (req, res) => {
  if (!isRuntimeRecord(req.body) || !normalizedString(req.body.name, 180) || !normalizedString(req.body.issueId, 180)) {
    res.status(400).json({ error: 'Benchmark suite name and issueId are required.' });
    return;
  }
  const input: AgentBenchmarkSuiteCreateInput = {
    name: normalizedString(req.body.name, 180)!,
    issueId: normalizedString(req.body.issueId, 180)!,
    caseIds: normalizedStringArray(req.body.caseIds, 500, 180),
    version: normalizedString(req.body.version, 120),
    freeze: req.body.freeze === true,
    createdBy: normalizedString(req.body.createdBy, 120),
  };
  try {
    res.status(201).json(await store.createAgentBenchmarkSuite(input));
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.get('/api/agent-eval/benchmark-suites/:id', (req, res) => {
  const suite = store.getAgentBenchmarkSuite(req.params.id);
  if (!suite) {
    res.status(404).json({ error: 'Benchmark suite was not found.' });
    return;
  }
  res.json({ suite, cases: suite.caseIds.map((id) => store.getAgentBenchmarkCase(id)).filter(Boolean) });
});

app.get('/api/agent-eval/experiments', (_req, res) => {
  res.json(store.listAgentEvaluationExperiments());
});

app.get('/api/agent-eval/reports', (_req, res) => {
  res.json(store.listAgentEvaluationReports());
});

app.post('/api/agent-eval/experiments', async (req, res) => {
  if (!isRuntimeRecord(req.body) || !isRuntimeRecord(req.body.modelSnapshot)) {
    res.status(400).json({ error: 'Experiment and model snapshot payloads are required.' });
    return;
  }
  const model = normalizedString(req.body.modelSnapshot.model, 180);
  const provider = normalizedString(req.body.modelSnapshot.provider, 120);
  const issueId = normalizedString(req.body.issueId, 180);
  const benchmarkSuiteId = normalizedString(req.body.benchmarkSuiteId, 180);
  const baselineHarnessId = normalizedString(req.body.baselineHarnessId, 180);
  const candidateHarnessId = normalizedString(req.body.candidateHarnessId, 180);
  if (!model || !provider || !issueId || !benchmarkSuiteId || !baselineHarnessId || !candidateHarnessId) {
    res.status(400).json({ error: 'Issue, suite, model, provider, baseline, and candidate are required.' });
    return;
  }
  const metrics = Array.isArray(req.body.metrics)
    ? req.body.metrics.map(normalizeAgentMetric).filter((item): item is AgentEvaluationMetricDefinition => Boolean(item))
    : undefined;
  const input: AgentEvaluationExperimentCreateInput = {
    issueId,
    benchmarkSuiteId,
    modelSnapshot: { provider, model, version: normalizedString(req.body.modelSnapshot.version, 120) },
    baselineHarnessId,
    candidateHarnessId,
    runtimeSnapshotHash: normalizedString(req.body.runtimeSnapshotHash, 200),
    evaluatorVersion: normalizedString(req.body.evaluatorVersion, 120),
    repetitions: finiteNumber(req.body.repetitions),
    metrics,
    createdBy: normalizedString(req.body.createdBy, 120),
  };
  try {
    res.status(201).json(await store.createAgentEvaluationExperiment(input));
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.get('/api/agent-eval/experiments/:id', (req, res) => {
  const experiment = store.getAgentEvaluationExperiment(req.params.id);
  if (!experiment) {
    res.status(404).json({ error: 'Evaluation experiment was not found.' });
    return;
  }
  res.json({
    experiment,
    rollouts: store.listAgentEvaluationRollouts(experiment.id),
    report: store.getAgentEvaluationReport(experiment.id),
  });
});

app.post('/api/agent-eval/experiments/:id/start', async (req, res) => {
  try {
    const experiment = await store.startAgentEvaluationExperiment(req.params.id);
    if (!experiment) {
      res.status(404).json({ error: 'Evaluation experiment was not found.' });
      return;
    }
    res.json(experiment);
  } catch (error) {
    res.status(409).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.post('/api/agent-eval/experiments/:id/rollouts', async (req, res) => {
  if (!isRuntimeRecord(req.body)) {
    res.status(400).json({ error: 'Rollout payload is required.' });
    return;
  }
  const arm = req.body.arm === 'baseline' || req.body.arm === 'candidate' ? req.body.arm : undefined;
  const caseId = normalizedString(req.body.caseId, 180);
  const status = req.body.status === 'passed' || req.body.status === 'failed' || req.body.status === 'error' ? req.body.status : undefined;
  if (!arm || !caseId || !status) {
    res.status(400).json({ error: 'Rollout arm, caseId, and status are required.' });
    return;
  }
  const metrics: NonNullable<AgentEvaluationRolloutCreateInput['metrics']> = Array.isArray(req.body.metrics)
    ? req.body.metrics.flatMap((value): NonNullable<AgentEvaluationRolloutCreateInput['metrics']> => {
        if (!isRuntimeRecord(value)) return [];
        const metricId = normalizedString(value.metricId, 120);
        const metricValue = finiteNumber(value.value);
        return metricId && metricValue !== undefined ? [{ metricId, value: metricValue }] : [];
      })
    : [];
  try {
    res.status(201).json(await store.recordAgentEvaluationRollout(req.params.id, {
      arm,
      caseId,
      repetition: finiteNumber(req.body.repetition),
      sourceTraceId: normalizedString(req.body.sourceTraceId, 180),
      status,
      metrics,
      evidenceIds: normalizedStringArray(req.body.evidenceIds, 100, 180),
      note: normalizedString(req.body.note, 2000),
      createdBy: normalizedString(req.body.createdBy, 120),
    }));
  } catch (error) {
    res.status(409).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.post('/api/agent-eval/experiments/:id/complete', async (req, res) => {
  try {
    const report = await store.completeAgentEvaluationExperiment(req.params.id);
    if (!report) {
      res.status(404).json({ error: 'Evaluation experiment was not found.' });
      return;
    }
    res.json(report);
  } catch (error) {
    res.status(409).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.get('/api/agent-eval/experiments/:id/report', (req, res) => {
  const report = store.getAgentEvaluationReport(req.params.id);
  if (!report) {
    res.status(404).json({ error: 'Evaluation report was not found.' });
    return;
  }
  res.json(report);
});

app.get('/api/ingest/jobs', (_req, res) => {
  res.json(store.listJobs());
});

app.get('/api/ingest/quality', (_req, res) => {
  res.json(store.listIngestQualityQueue());
});

app.get('/api/ingest/quality/policy', (_req, res) => {
  res.json(store.listIngestQualityPolicy());
});

app.get('/api/ingest/quality/policy/runs', (_req, res) => {
  res.json(store.listIngestQualityPolicyRuns());
});

app.post('/api/ingest/quality/policy/dry-run', (req, res) => {
  const ruleId = typeof req.body?.ruleId === 'string' ? req.body.ruleId.trim().slice(0, 120) : undefined;
  res.json(store.dryRunIngestQualityPolicyRules(ruleId));
});

app.post('/api/ingest/quality/policy/rules', async (req, res) => {
  const input = normalizeIngestQualityPolicyRuleInput(req.body);
  if (!input) {
    res.status(400).json({ error: 'A valid policy rule is required.' });
    return;
  }
  res.json(await store.upsertIngestQualityPolicyRule(input));
});

app.post('/api/ingest/quality/policy/defaults', async (req, res) => {
  const result = await store.installDefaultIngestQualityPolicyRules(
    typeof req.body?.actor === 'string' ? req.body.actor.trim().slice(0, 80) : undefined,
  );
  await store.updateSource({
    lastPolicyApplyAt: result.run?.finishedAt ?? new Date().toISOString(),
    lastPolicyApplyMessage: result.run?.message ?? `${result.affectedDiagnostics} diagnostics handled by default policy rules`,
  });
  res.json(result);
});

app.post('/api/ingest/quality/policy/recommendations/decision', async (req, res) => {
  const input = normalizeIngestQualityRecommendationDecisionInput(req.body);
  if (!input) {
    res.status(400).json({ error: 'A valid recommendation decision is required.' });
    return;
  }
  res.json(await store.decideIngestQualityRecommendations(input));
});

app.patch('/api/ingest/quality/policy/recommendations/:id/restore', async (req, res) => {
  const policy = await store.restoreIngestQualityRecommendation(
    req.params.id,
    typeof req.body?.note === 'string' ? req.body.note.trim().slice(0, 500) : undefined,
    typeof req.body?.actor === 'string' ? req.body.actor.trim().slice(0, 80) : undefined,
  );
  if (!policy) {
    res.status(404).json({ error: 'Recommendation decision was not found.' });
    return;
  }
  res.json(policy);
});

app.post('/api/ingest/quality/policy/apply', async (req, res) => {
  const result = await store.applyIngestQualityPolicyRules(
    typeof req.body?.actor === 'string' ? req.body.actor.trim().slice(0, 80) : undefined,
    'manual',
  );
  await store.updateSource({
    lastPolicyApplyAt: result.run?.finishedAt ?? new Date().toISOString(),
    lastPolicyApplyMessage: result.run?.message ?? `${result.affectedDiagnostics} diagnostics handled by ${result.appliedRules} policy rules`,
  });
  res.json(result);
});

app.post('/api/ingest/quality/policy/auto-apply', async (req, res) => {
  const enabled = req.body?.enabled !== false;
  res.json(await store.updateSource({ autoApplyQualityPolicy: enabled }));
});

app.patch('/api/ingest/quality/issues/:issueId/triage', async (req, res) => {
  const decision = normalizeIngestDiagnosticTriageDecision(req.body?.decision);
  if (!decision) {
    res.status(400).json({ error: 'A valid triage decision is required.' });
    return;
  }
  const queue = await store.triageIngestQualityIssue(
    req.params.issueId,
    decision,
    typeof req.body?.note === 'string' ? req.body.note.trim().slice(0, 500) : undefined,
    typeof req.body?.actor === 'string' ? req.body.actor.trim().slice(0, 80) : undefined,
  );
  if (!queue) {
    res.status(404).json({ error: 'Open issue occurrences were not found.' });
    return;
  }
  res.json(queue);
});

app.patch('/api/ingest/jobs/:jobId/diagnostics/:diagnosticId/triage', async (req, res) => {
  const decision = normalizeIngestDiagnosticTriageDecision(req.body?.decision);
  if (!decision) {
    res.status(400).json({ error: 'A valid triage decision is required.' });
    return;
  }
  const job = await store.triageIngestDiagnostic(
    req.params.jobId,
    req.params.diagnosticId,
    decision,
    typeof req.body?.note === 'string' ? req.body.note.trim().slice(0, 500) : undefined,
    typeof req.body?.actor === 'string' ? req.body.actor.trim().slice(0, 80) : undefined,
  );
  if (!job) {
    res.status(404).json({ error: 'Diagnostic was not found.' });
    return;
  }
  res.json(job);
});

app.get('/api/tasks', async (_req, res) => {
  res.json(await store.listTasks());
});

app.get('/api/tasks/automation-plan', async (_req, res) => {
  res.json(await store.getTaskAutomationPlan());
});

app.post('/api/tasks', async (req, res) => {
  const rawInputs: unknown[] = Array.isArray(req.body?.tasks) ? req.body.tasks : [req.body];
  const tasks = rawInputs
    .map(normalizeTaskCreateInput)
    .filter((item): item is TraceOpsTaskCreateInput => Boolean(item));
  if (tasks.length === 0) {
    res.status(400).json({ error: 'At least one valid task is required.' });
    return;
  }
  res.json(await store.createTasks(tasks.slice(0, 20)));
});

app.post('/api/tasks/:id/retry', async (req, res) => {
  try {
    const task = await store.retryTask(
      req.params.id,
      typeof req.body?.note === 'string' ? req.body.note : undefined,
    );
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.json(task);
  } catch (error) {
    res.status(409).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.post('/api/tasks/orchestrate', async (req, res) => {
  const actor = await requireGovernancePermission(req, res, 'tasks.orchestrate', {
    reason: 'Automation orchestration can create governance, export and training tasks.',
    metadata: {
      runNow: req.body?.runNow === true,
    },
  });
  if (!actor) return;
  try {
    const orchestration = await store.orchestrateAutomationTasks({ createdBy: actor.id });
    await store.recordGovernanceAudit({
      action: 'tasks.orchestrate',
      decision: 'recorded',
      actor,
      entityRefs: orchestration.created.flatMap((task) => task.entityRefs).slice(0, 8),
      reason: 'Automation task orchestration completed.',
      metadata: {
        created: orchestration.summary.created,
        skipped: orchestration.summary.skipped,
        critical: orchestration.summary.critical,
        high: orchestration.summary.high,
        runNow: req.body?.runNow === true,
      },
    });
    if (req.body?.runNow === true) {
      const execution = await runQueuedTasks(runLimit(req.body?.limit));
      res.json({ ...orchestration, execution });
      return;
    }
    res.json(orchestration);
  } catch (error) {
    res.status(409).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.post('/api/tasks/run-next', async (req, res) => {
  try {
    res.json(await runQueuedTasks(runLimit(req.body?.limit)));
  } catch (error) {
    res.status(409).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.get('/api/raw-traces', (req, res) => {
  const filters: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(req.query)) {
    filters[key] = typeof value === 'string' ? value : undefined;
  }
  res.json(store.listTraces(filters));
});

app.get('/api/raw-traces/projects', (_req, res) => {
  res.json(store.listProjects());
});

app.post('/api/evidence/backfill-derived', async (_req, res) => {
  res.json(await store.backfillDerivedEvidence());
});

app.get('/api/training-samples', (req, res) => {
  const filters: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(req.query)) {
    filters[key] = typeof value === 'string' ? value : undefined;
  }
  res.json(store.listTrainingSamples(filters));
});

app.get('/api/clean-traces', (req, res) => {
  const filters: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(req.query)) {
    filters[key] = typeof value === 'string' ? value : undefined;
  }
  res.json(store.listCleanTraces(filters));
});

app.get('/api/clean-traces/:id', (req, res) => {
  const cleanTrace = store.getCleanTrace(req.params.id);
  if (!cleanTrace) {
    res.status(404).json({ error: 'Clean trace not found' });
    return;
  }
  res.json(cleanTrace);
});

app.get('/api/memory-candidates', (req, res) => {
  const filters: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(req.query)) {
    filters[key] = typeof value === 'string' ? value : undefined;
  }
  res.json(store.listMemoryCandidates(filters));
});

app.post('/api/memory-candidates/:id/review', async (req, res) => {
  const actor = await requireGovernancePermission(req, res, 'memory.review', {
    entityRefs: [{ kind: 'trace', id: req.params.id, label: 'Memory candidate' }],
    reason: 'Memory candidate promotion or rejection requires data governance permission.',
    metadata: {
      candidateId: req.params.id,
      decision: req.body?.decision,
    },
  });
  if (!actor) return;
  const decision = req.body?.decision;
  if (decision !== 'promoted' && decision !== 'rejected') {
    res.status(400).json({ error: 'decision must be promoted or rejected' });
    return;
  }

  try {
    const candidate = await store.reviewMemoryCandidate(
      req.params.id,
      decision,
      typeof req.body?.note === 'string' ? req.body.note : '',
      actor.id,
    );
    if (!candidate) {
      res.status(404).json({ error: 'Memory candidate not found' });
      return;
    }
    await store.recordGovernanceAudit({
      action: 'memory.review',
      decision: 'recorded',
      actor,
      entityRefs: [{ kind: 'trace', id: candidate.traceId, label: candidate.title }],
      reason: `Memory candidate ${decision}.`,
      metadata: {
        candidateId: candidate.id,
        decision,
        riskLevel: candidate.riskLevel,
        status: candidate.status,
        kind: candidate.kind,
      },
    });
    res.json(candidate);
  } catch (error) {
    res.status(409).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.get('/api/memory-candidates/:id', (req, res) => {
  const candidate = store.getMemoryCandidate(req.params.id);
  if (!candidate) {
    res.status(404).json({ error: 'Memory candidate not found' });
    return;
  }
  res.json(candidate);
});

app.get('/api/kodax/feedback-report', (_req, res) => {
  res.json(store.getKodaXFeedbackReport());
});

app.get('/api/kodax/feedback-package', (_req, res) => {
  res.json(store.getKodaXFeedbackPackage());
});

app.get('/api/kodax/feedback-package/download', (_req, res) => {
  const feedbackPackage = store.getKodaXFeedbackPackage();
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${feedbackPackage.id}.json"`);
  res.send(JSON.stringify(feedbackPackage, null, 2));
});

app.get('/api/kodax/feedback-writebacks', (req, res) => {
  res.json(store.listKodaXFeedbackWritebacks(finiteNumber(req.query.limit) ?? 50));
});

app.post('/api/kodax/feedback-package/writeback', async (req, res) => {
  const actor = await requireGovernancePermission(req, res, 'kodax.feedback_writeback', {
    reason: 'Writing TraceOps feedback into the KodaX inbox requires data governance permission.',
    metadata: {
      targetDir: typeof req.body?.targetDir === 'string' ? req.body.targetDir : undefined,
    },
  });
  if (!actor) return;

  const result = await store.writeKodaXFeedbackPackage({
    actor,
    targetDir: typeof req.body?.targetDir === 'string' ? req.body.targetDir : undefined,
    reason: typeof req.body?.reason === 'string' ? req.body.reason : undefined,
  });
  await store.recordGovernanceAudit({
    action: 'kodax.feedback_writeback',
    decision: result.record.status === 'written' ? 'allowed' : 'denied',
    actor,
    entityRefs: [],
    reason: result.record.status === 'written'
      ? `Wrote KodaX feedback package ${result.record.packageId}.`
      : `KodaX feedback writeback failed for ${result.record.packageId}.`,
    metadata: {
      writebackId: result.record.id,
      packageHash: result.record.packageHash,
      targetDir: result.record.targetDir,
      files: result.record.files.map((file) => ({
        kind: file.kind,
        path: file.path,
        bytes: file.bytes,
        sha256: file.sha256,
      })),
      signalCount: result.record.signalCount,
      actionItemCount: result.record.actionItemCount,
      errorMessage: result.record.errorMessage,
    },
  });
  res.status(result.record.status === 'written' ? 201 : 409).json(result);
});

app.get('/api/exports', (_req, res) => {
  res.json(store.listExportRuns());
});

app.get('/api/release-manifests', (_req, res) => {
  res.json(store.listReleaseManifests());
});

app.get('/api/release-promotions', (_req, res) => {
  res.json(store.listReleasePromotions());
});

app.get('/api/retraining-handoffs', (_req, res) => {
  res.json(store.listRetrainingHandoffs());
});

app.get('/api/closed-loop-retraining-plans', (_req, res) => {
  res.json(store.listClosedLoopRetrainingPlans());
});

app.post('/api/datasets/:id/closed-loop-retraining-handoff', async (req, res) => {
  const actor = await requireGovernancePermission(req, res, 'retraining.handoff', {
    entityRefs: [{ kind: 'dataset_version', id: req.params.id }],
    reason: 'Closed-loop retraining handoff prepares reviewed data for training.',
  });
  if (!actor) return;
  try {
    const result = await store.prepareClosedLoopRetrainingHandoff({
      datasetVersionId: req.params.id,
      trainingOwner: typeof req.body?.trainingOwner === 'string' ? req.body.trainingOwner : undefined,
      targetSystem: typeof req.body?.targetSystem === 'string' ? req.body.targetSystem : undefined,
      note: typeof req.body?.note === 'string' ? req.body.note : undefined,
    });
    if (!result) {
      res.status(404).json({ error: 'Closed-loop dataset version not found' });
      return;
    }
    res.json(result);
  } catch (error) {
    res.status(409).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.post('/api/datasets/:id/closed-loop-training-cycle', async (req, res) => {
  const actor = await requireGovernancePermission(req, res, 'training.provider_launch', {
    entityRefs: [{ kind: 'dataset_version', id: req.params.id }],
    reason: 'Closed-loop training cycle creates training artifacts from dataset material.',
    metadata: {
      targetSystem: req.body?.targetSystem,
      modelName: req.body?.modelName,
    },
  });
  if (!actor) return;
  try {
    const result = await store.runClosedLoopTrainingCycle({
      datasetVersionId: req.params.id,
      owner: typeof req.body?.owner === 'string' ? req.body.owner : undefined,
      targetSystem: typeof req.body?.targetSystem === 'string' ? req.body.targetSystem : undefined,
      modelName: typeof req.body?.modelName === 'string' ? req.body.modelName : undefined,
      externalRunId: typeof req.body?.externalRunId === 'string' ? req.body.externalRunId : undefined,
      note: typeof req.body?.note === 'string' ? req.body.note : undefined,
    });
    if (!result) {
      res.status(404).json({ error: 'Closed-loop dataset version not found' });
      return;
    }
    res.json(result);
  } catch (error) {
    res.status(409).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.post('/api/datasets/:id/closed-loop-model-release-gate', async (req, res) => {
  const actor = await requireGovernancePermission(req, res, 'model.release_gate', {
    entityRefs: [{ kind: 'dataset_version', id: req.params.id }],
    reason: 'Closed-loop model release gate creation requires training governance permission.',
  });
  if (!actor) return;
  try {
    const result = await store.prepareClosedLoopModelReleaseGate({
      datasetVersionId: req.params.id,
      owner: typeof req.body?.owner === 'string' ? req.body.owner : undefined,
      targetSystem: typeof req.body?.targetSystem === 'string' ? req.body.targetSystem : undefined,
      modelName: typeof req.body?.modelName === 'string' ? req.body.modelName : undefined,
      note: typeof req.body?.note === 'string' ? req.body.note : undefined,
    });
    if (!result) {
      res.status(404).json({ error: 'Closed-loop dataset version not found' });
      return;
    }
    res.json(result);
  } catch (error) {
    res.status(409).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.post('/api/datasets/:id/closed-loop-candidate-cycle', async (req, res) => {
  const actor = await requireGovernancePermission(req, res, 'training.provider_launch', {
    entityRefs: [{ kind: 'dataset_version', id: req.params.id }],
    reason: 'Closed-loop candidate cycle creates training and evaluation artifacts.',
    metadata: {
      targetSystem: req.body?.targetSystem,
      modelName: req.body?.modelName,
    },
  });
  if (!actor) return;
  try {
    const result = await store.runClosedLoopCandidateCycle({
      datasetVersionId: req.params.id,
      owner: typeof req.body?.owner === 'string' ? req.body.owner : undefined,
      targetSystem: typeof req.body?.targetSystem === 'string' ? req.body.targetSystem : undefined,
      modelName: typeof req.body?.modelName === 'string' ? req.body.modelName : undefined,
      note: typeof req.body?.note === 'string' ? req.body.note : undefined,
    });
    if (!result) {
      res.status(404).json({ error: 'Closed-loop dataset version not found' });
      return;
    }
    res.json(result);
  } catch (error) {
    res.status(409).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.post('/api/datasets/:id/closed-loop-deployment-handoff', async (req, res) => {
  const actor = await requireGovernancePermission(req, res, 'deployment.handoff', {
    entityRefs: [{ kind: 'dataset_version', id: req.params.id }],
    reason: 'Closed-loop deployment handoff requires training governance permission.',
  });
  if (!actor) return;
  try {
    const result = await store.prepareClosedLoopDeploymentHandoff({
      datasetVersionId: req.params.id,
      deploymentOwner: typeof req.body?.deploymentOwner === 'string' ? req.body.deploymentOwner : undefined,
      environment: typeof req.body?.environment === 'string' ? req.body.environment : undefined,
      rolloutStrategy: typeof req.body?.rolloutStrategy === 'string' ? req.body.rolloutStrategy : undefined,
      note: typeof req.body?.note === 'string' ? req.body.note : undefined,
    });
    if (!result) {
      res.status(404).json({ error: 'Closed-loop dataset version not found' });
      return;
    }
    res.json(result);
  } catch (error) {
    res.status(409).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.post('/api/datasets/:id/closed-loop-approval-deployment', async (req, res) => {
  const actor = await requireGovernancePermission(req, res, 'model.release_gate_decision', {
    entityRefs: [{ kind: 'dataset_version', id: req.params.id }],
    reason: 'Closed-loop approval and deployment requires model release decision permission.',
  });
  if (!actor) return;
  try {
    const result = await store.approveClosedLoopModelGateAndPrepareDeploymentHandoff({
      datasetVersionId: req.params.id,
      decisionNote: typeof req.body?.decisionNote === 'string' ? req.body.decisionNote : undefined,
      deploymentOwner: typeof req.body?.deploymentOwner === 'string' ? req.body.deploymentOwner : undefined,
      environment: typeof req.body?.environment === 'string' ? req.body.environment : undefined,
      rolloutStrategy: typeof req.body?.rolloutStrategy === 'string' ? req.body.rolloutStrategy : undefined,
      note: typeof req.body?.note === 'string' ? req.body.note : undefined,
    });
    if (!result) {
      res.status(404).json({ error: 'Closed-loop dataset version not found' });
      return;
    }
    res.json(result);
  } catch (error) {
    res.status(409).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.post('/api/datasets/:id/closed-loop-rollout', async (req, res) => {
  const actor = await requireGovernancePermission(req, res, 'deployment.status', {
    entityRefs: [{ kind: 'dataset_version', id: req.params.id }],
    reason: 'Closed-loop rollout changes deployment lifecycle status.',
  });
  if (!actor) return;
  try {
    const result = await store.runClosedLoopRollout({
      datasetVersionId: req.params.id,
      deploymentOwner: typeof req.body?.deploymentOwner === 'string' ? req.body.deploymentOwner : undefined,
      environment: typeof req.body?.environment === 'string' ? req.body.environment : undefined,
      rolloutStrategy: typeof req.body?.rolloutStrategy === 'string' ? req.body.rolloutStrategy : undefined,
      monitorOwner: typeof req.body?.monitorOwner === 'string' ? req.body.monitorOwner : undefined,
      note: typeof req.body?.note === 'string' ? req.body.note : undefined,
    });
    if (!result) {
      res.status(404).json({ error: 'Closed-loop dataset version not found' });
      return;
    }
    res.json(result);
  } catch (error) {
    res.status(409).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.post('/api/datasets/:id/closed-loop-feedback-signal', async (req, res) => {
  const actor = await requireGovernancePermission(req, res, 'post_release.signal', {
    entityRefs: [{ kind: 'dataset_version', id: req.params.id }],
    reason: 'Closed-loop feedback signals affect rollback and next-dataset decisions.',
    metadata: {
      mode: req.body?.mode,
    },
  });
  if (!actor) return;
  try {
    const result = await store.writeClosedLoopFeedbackSignal({
      datasetVersionId: req.params.id,
      mode: normalizeClosedLoopFeedbackSignalMode(req.body?.mode),
      taskSuccessRate: finiteNumber(req.body?.taskSuccessRate),
      regressionAlertRate: finiteNumber(req.body?.regressionAlertRate),
      p95LatencyMs: finiteNumber(req.body?.p95LatencyMs),
      toolErrorRate: finiteNumber(req.body?.toolErrorRate),
      manualInterventionRate: finiteNumber(req.body?.manualInterventionRate),
      alertNote: typeof req.body?.alertNote === 'string' ? req.body.alertNote : undefined,
      note: typeof req.body?.note === 'string' ? req.body.note : undefined,
    });
    if (!result) {
      res.status(404).json({ error: 'Closed-loop dataset version not found' });
      return;
    }
    res.json(result);
  } catch (error) {
    res.status(409).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.post('/api/datasets/:id/closed-loop-next-dataset', async (req, res) => {
  const actor = await requireGovernancePermission(req, res, 'dataset.diff_review', {
    entityRefs: [{ kind: 'dataset_version', id: req.params.id }],
    reason: 'Building the next closed-loop dataset requires data governance permission.',
  });
  if (!actor) return;
  try {
    const result = await store.buildClosedLoopNextDataset({
      datasetVersionId: req.params.id,
      name: typeof req.body?.name === 'string' ? req.body.name : undefined,
      notes: typeof req.body?.notes === 'string' ? req.body.notes : undefined,
      format: req.body?.format ? normalizeDatasetExportFormat(req.body.format) : undefined,
      trainingOwner: typeof req.body?.trainingOwner === 'string' ? req.body.trainingOwner : undefined,
      targetSystem: typeof req.body?.targetSystem === 'string' ? req.body.targetSystem : undefined,
    });
    if (!result) {
      res.status(404).json({ error: 'Closed-loop dataset version not found' });
      return;
    }
    res.json(result);
  } catch (error) {
    res.status(409).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.get('/api/retraining-handoffs/:id', (req, res) => {
  const handoff = store.getRetrainingHandoff(req.params.id);
  if (!handoff) {
    res.status(404).json({ error: 'Retraining handoff not found' });
    return;
  }
  res.json(handoff);
});

app.get('/api/retraining-handoffs/:id/download', (req, res) => {
  const handoff = store.getRetrainingHandoff(req.params.id);
  if (!handoff) {
    res.status(404).json({ error: 'Retraining handoff not found' });
    return;
  }
  const filename = `${handoff.datasetVersionName.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64) || handoff.id}-retraining-handoff.json`;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(JSON.stringify(handoff, null, 2));
});

app.get('/api/training-runs', (_req, res) => {
  res.json(store.listTrainingRuns());
});

app.get('/api/training-runs/:id', (req, res) => {
  const run = store.getTrainingRun(req.params.id);
  if (!run) {
    res.status(404).json({ error: 'Training run not found' });
    return;
  }
  res.json(run);
});

app.get('/api/training-launch-plans', (_req, res) => {
  res.json(store.listTrainingLaunchPlans());
});

app.get('/api/retraining-handoffs/:id/training-launch-plan', (req, res) => {
  const plan = store.getTrainingLaunchPlan(req.params.id);
  if (!plan) {
    res.status(404).json({ error: 'Training launch plan not found' });
    return;
  }
  res.json(plan);
});

app.post('/api/retraining-handoffs/:id/training-runs', async (req, res) => {
  const actor = await requireGovernancePermission(req, res, 'training.provider_launch', {
    entityRefs: [{ kind: 'retraining_handoff', id: req.params.id }],
    reason: 'Creating a training run from a handoff prepares reviewed data for model training.',
    metadata: {
      targetSystem: req.body?.targetSystem,
      modelName: req.body?.modelName,
    },
  });
  if (!actor) return;
  try {
    const run = await store.createTrainingRun({
      handoffId: req.params.id,
      owner: typeof req.body?.owner === 'string' ? req.body.owner : undefined,
      targetSystem: typeof req.body?.targetSystem === 'string' ? req.body.targetSystem : undefined,
      modelName: typeof req.body?.modelName === 'string' ? req.body.modelName : undefined,
      modelVersion: typeof req.body?.modelVersion === 'string' ? req.body.modelVersion : undefined,
      externalRunId: typeof req.body?.externalRunId === 'string' ? req.body.externalRunId : undefined,
      note: typeof req.body?.note === 'string' ? req.body.note : undefined,
    });
    if (!run) {
      res.status(404).json({ error: 'Retraining handoff not found' });
      return;
    }
    res.json(run);
  } catch (error) {
    res.status(409).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.patch('/api/training-runs/:id/result', async (req, res) => {
  const actor = await requireGovernancePermission(req, res, 'training.result_recorded', {
    entityRefs: [{ kind: 'training_run', id: req.params.id }],
    reason: 'Recording training results changes the model release evidence.',
    metadata: {
      status: req.body?.status,
      rollbackRequired: req.body?.rollbackRequired,
    },
  });
  if (!actor) return;
  const run = await store.recordTrainingRunResult({
    runId: req.params.id,
    validationScore: finiteNumber(req.body?.validationScore),
    regressionRate: finiteNumber(req.body?.regressionRate),
    blockedIssueCount: finiteNumber(req.body?.blockedIssueCount),
    rollbackRequired: typeof req.body?.rollbackRequired === 'boolean' ? req.body.rollbackRequired : undefined,
    resultSummary: typeof req.body?.resultSummary === 'string' ? req.body.resultSummary : undefined,
    status: normalizeTrainingRunStatus(req.body?.status),
    note: typeof req.body?.note === 'string' ? req.body.note : undefined,
  });
  if (!run) {
    res.status(404).json({ error: 'Training run not found' });
    return;
  }
  await store.recordGovernanceAudit({
    action: 'training.result_recorded',
    decision: 'recorded',
    actor,
    entityRefs: [{ kind: 'training_run', id: run.id, label: run.modelName }],
    reason: 'Recorded training run result and quality gate outcome.',
    metadata: {
      status: run.status,
      qualityGate: run.qualityGate,
      validationScore: finiteNumber(req.body?.validationScore),
      regressionRate: finiteNumber(req.body?.regressionRate),
      blockedIssueCount: finiteNumber(req.body?.blockedIssueCount),
      rollbackRequired: run.rollbackRequired,
    },
  });
  res.json(run);
});

app.post('/api/training-runs/:id/launch-provider', async (req, res) => {
  const actor = await requireGovernancePermission(req, res, 'training.provider_launch', {
    entityRefs: [{ kind: 'training_run', id: req.params.id }],
    reason: 'Launching a provider can send training data outside TraceOps.',
    metadata: {
      provider: req.body?.provider,
      endpoint: typeof req.body?.endpoint === 'string' ? req.body.endpoint : undefined,
      dryRun: req.body?.dryRun !== false,
    },
  });
  if (!actor) return;
  const run = store.getTrainingRun(req.params.id);
  if (!run) {
    res.status(404).json({ error: 'Training run not found' });
    return;
  }
  const provider = normalizeTrainingProvider(req.body?.provider);
  const endpoint = typeof req.body?.endpoint === 'string' && req.body.endpoint.trim()
    ? req.body.endpoint.trim()
    : undefined;
  const dryRun = req.body?.dryRun !== false || !endpoint;
  const submittedBy = typeof req.body?.submittedBy === 'string' ? req.body.submittedBy : actor.id;
  const payload = trainingProviderPayload(run, provider);

  if (dryRun) {
    const nextRun = await store.recordTrainingProviderLaunch({
      runId: run.id,
      provider,
      status: 'prepared',
      endpoint,
      requestPayload: payload,
      submittedBy,
    });
    await store.recordGovernanceAudit({
      action: 'training.provider_launch',
      decision: 'recorded',
      actor,
      entityRefs: [{ kind: 'training_run', id: run.id, label: run.modelName }],
      reason: 'Prepared external training provider payload.',
      metadata: {
        provider,
        endpoint,
        launchStatus: 'prepared',
        requestHash: nextRun?.providerLaunches?.[0]?.requestHash,
      },
    });
    res.json(nextRun);
    return;
  }

  try {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (typeof req.body?.apiKey === 'string' && req.body.apiKey.trim()) {
      headers.authorization = `Bearer ${req.body.apiKey.trim()}`;
    }
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const text = await response.text();
    let parsed: unknown;
    try {
      parsed = text ? JSON.parse(text) : undefined;
    } catch {
      parsed = undefined;
    }
    const externalRunId = externalRunIdFromResponse(parsed);
    const nextRun = await store.recordTrainingProviderLaunch({
      runId: run.id,
      provider,
      status: response.ok ? 'accepted' : 'failed',
      endpoint,
      requestPayload: payload,
      responseStatus: response.status,
      responseBodyPreview: responsePreview(text),
      externalRunId,
      errorMessage: response.ok ? undefined : `Provider returned ${response.status}`,
      submittedBy,
    });
    await store.recordGovernanceAudit({
      action: 'training.provider_launch',
      decision: response.ok ? 'allowed' : 'denied',
      actor,
      entityRefs: [{ kind: 'training_run', id: run.id, label: run.modelName }],
      reason: response.ok ? 'Submitted external training provider request.' : 'External training provider rejected the request.',
      metadata: {
        provider,
        endpoint,
        responseStatus: response.status,
        externalRunId,
        launchStatus: response.ok ? 'accepted' : 'failed',
        requestHash: nextRun?.providerLaunches?.[0]?.requestHash,
      },
    });
    res.status(response.ok ? 200 : 502).json(nextRun);
  } catch (error) {
    const nextRun = await store.recordTrainingProviderLaunch({
      runId: run.id,
      provider,
      status: 'failed',
      endpoint,
      requestPayload: payload,
      errorMessage: error instanceof Error ? error.message : String(error),
      submittedBy,
    });
    await store.recordGovernanceAudit({
      action: 'training.provider_launch',
      decision: 'denied',
      actor,
      entityRefs: [{ kind: 'training_run', id: run.id, label: run.modelName }],
      reason: 'External training provider launch failed before acceptance.',
      metadata: {
        provider,
        endpoint,
        launchStatus: 'failed',
        errorMessage: error instanceof Error ? error.message : String(error),
        requestHash: nextRun?.providerLaunches?.[0]?.requestHash,
      },
    });
    res.status(502).json(nextRun);
  }
});

app.patch('/api/training-runs/:id/provider-status', async (req, res) => {
  const actor = await requireGovernancePermission(req, res, 'training.provider_status_sync', {
    entityRefs: [{ kind: 'training_run', id: req.params.id }],
    reason: 'Recording provider status changes the training lifecycle state.',
    metadata: {
      providerStatus: req.body?.providerStatus ?? req.body?.status,
      externalRunId: req.body?.externalRunId,
    },
  });
  if (!actor) return;
  const providerStatus = normalizeTrainingProviderStatus(req.body?.providerStatus ?? req.body?.status);
  if (!providerStatus) {
    res.status(400).json({ error: 'providerStatus must be queued, running, succeeded, failed, cancelled or unknown.' });
    return;
  }
  const run = await store.recordTrainingProviderStatus({
    runId: req.params.id,
    provider: req.body?.provider ? normalizeTrainingProvider(req.body.provider) : undefined,
    providerStatus,
    endpoint: typeof req.body?.endpoint === 'string' ? req.body.endpoint : undefined,
    externalRunId: typeof req.body?.externalRunId === 'string' ? req.body.externalRunId : undefined,
    checkedBy: actor.id,
    note: typeof req.body?.note === 'string' ? req.body.note : undefined,
    validationScore: finiteNumber(req.body?.validationScore),
    regressionRate: finiteNumber(req.body?.regressionRate),
    blockedIssueCount: finiteNumber(req.body?.blockedIssueCount),
    rollbackRequired: typeof req.body?.rollbackRequired === 'boolean' ? req.body.rollbackRequired : undefined,
  });
  if (!run) {
    res.status(404).json({ error: 'Training run not found' });
    return;
  }
  await store.recordGovernanceAudit({
    action: 'training.provider_status_sync',
    decision: 'recorded',
    actor,
    entityRefs: [{ kind: 'training_run', id: run.id, label: run.modelName }],
    reason: `Recorded provider status ${providerStatus}.`,
    metadata: {
      providerStatus,
      mappedRunStatus: run.status,
      qualityGate: run.qualityGate,
      externalRunId: run.externalRunId,
    },
  });
  res.json(run);
});

app.post('/api/training-runs/:id/sync-provider-status', async (req, res) => {
  const actor = await requireGovernancePermission(req, res, 'training.provider_status_sync', {
    entityRefs: [{ kind: 'training_run', id: req.params.id }],
    reason: 'Syncing provider status pulls external training lifecycle state into TraceOps.',
    metadata: {
      endpoint: typeof req.body?.endpoint === 'string' ? req.body.endpoint : undefined,
      method: req.body?.method,
    },
  });
  if (!actor) return;
  const run = store.getTrainingRun(req.params.id);
  if (!run) {
    res.status(404).json({ error: 'Training run not found' });
    return;
  }
  const latestLaunch = run.providerLaunches?.[0];
  const provider = req.body?.provider ? normalizeTrainingProvider(req.body.provider) : latestLaunch?.provider ?? 'manual';
  const externalRunId = typeof req.body?.externalRunId === 'string' && req.body.externalRunId.trim()
    ? req.body.externalRunId.trim()
    : run.externalRunId ?? latestLaunch?.externalRunId;
  const rawEndpoint = typeof req.body?.endpoint === 'string' && req.body.endpoint.trim()
    ? req.body.endpoint.trim()
    : latestLaunch?.endpoint;
  if (!rawEndpoint) {
    res.status(400).json({ error: 'endpoint is required for provider status sync.' });
    return;
  }
  const endpoint = rawEndpoint
    .replace('{externalRunId}', encodeURIComponent(externalRunId ?? ''))
    .replace(':externalRunId', encodeURIComponent(externalRunId ?? ''));
  const method = req.body?.method === 'POST' ? 'POST' : 'GET';
  const headers: Record<string, string> = { accept: 'application/json' };
  if (method === 'POST') headers['content-type'] = 'application/json';
  if (typeof req.body?.apiKey === 'string' && req.body.apiKey.trim()) {
    headers.authorization = `Bearer ${req.body.apiKey.trim()}`;
  }

  try {
    const response = await fetch(endpoint, {
      method,
      headers,
      body: method === 'POST' ? JSON.stringify({ traceOpsRunId: run.id, externalRunId }) : undefined,
    });
    const text = await response.text();
    let parsed: unknown;
    try {
      parsed = text ? JSON.parse(text) : undefined;
    } catch {
      parsed = undefined;
    }
    const providerStatus = readProviderStatusField(parsed) ?? normalizeTrainingProviderStatus(text) ?? (response.ok ? 'unknown' : 'failed');
    const nextRun = await store.recordTrainingProviderStatus({
      runId: run.id,
      provider,
      providerStatus,
      endpoint,
      externalRunId: externalRunIdFromResponse(parsed) ?? externalRunId,
      responseStatus: response.status,
      responseBodyPreview: responsePreview(text),
      responsePayload: parsed ?? text,
      checkedBy: actor.id,
      note: readProviderText(parsed, ['summary', 'resultSummary', 'message', 'note']) ?? `Provider status synced from ${endpoint}.`,
      errorMessage: response.ok ? undefined : `Provider status endpoint returned ${response.status}`,
      validationScore: readProviderMetric(parsed, ['validationScore', 'validation_score', 'score']),
      regressionRate: readProviderMetric(parsed, ['regressionRate', 'regression_rate']),
      blockedIssueCount: readProviderMetric(parsed, ['blockedIssueCount', 'blocked_issue_count', 'blockedIssues']),
      rollbackRequired: isRecord(parsed) && typeof parsed.rollbackRequired === 'boolean' ? parsed.rollbackRequired : undefined,
    });
    if (!nextRun) {
      res.status(404).json({ error: 'Training run not found' });
      return;
    }
    await store.recordGovernanceAudit({
      action: 'training.provider_status_sync',
      decision: response.ok ? 'allowed' : 'denied',
      actor,
      entityRefs: [{ kind: 'training_run', id: nextRun.id, label: nextRun.modelName }],
      reason: response.ok ? `Synced provider status ${providerStatus}.` : 'Provider status sync failed.',
      metadata: {
        provider,
        providerStatus,
        mappedRunStatus: nextRun.status,
        qualityGate: nextRun.qualityGate,
        endpoint,
        responseStatus: response.status,
        externalRunId: nextRun.externalRunId,
      },
    });
    res.status(response.ok ? 200 : 502).json(nextRun);
  } catch (error) {
    const nextRun = await store.recordTrainingProviderStatus({
      runId: run.id,
      provider,
      providerStatus: 'failed',
      endpoint,
      externalRunId,
      checkedBy: actor.id,
      errorMessage: error instanceof Error ? error.message : String(error),
      note: 'Provider status sync failed before response.',
    });
    await store.recordGovernanceAudit({
      action: 'training.provider_status_sync',
      decision: 'denied',
      actor,
      entityRefs: [{ kind: 'training_run', id: run.id, label: run.modelName }],
      reason: 'Provider status sync failed before response.',
      metadata: {
        provider,
        endpoint,
        externalRunId,
        errorMessage: error instanceof Error ? error.message : String(error),
      },
    });
    res.status(502).json(nextRun ?? { error: error instanceof Error ? error.message : String(error) });
  }
});

app.get('/api/eval-runs', (_req, res) => {
  res.json(store.listEvalRuns());
});

app.get('/api/eval-runs/:id', (req, res) => {
  const evalRun = store.getEvalRun(req.params.id);
  if (!evalRun) {
    res.status(404).json({ error: 'Eval run not found' });
    return;
  }
  res.json(evalRun);
});

app.get('/api/eval-runs/:id/download', (req, res) => {
  const evalRun = store.getEvalRun(req.params.id);
  if (!evalRun) {
    res.status(404).json({ error: 'Eval run not found' });
    return;
  }
  const filename = `${evalRun.modelName.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64) || evalRun.id}-eval-run.json`;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(JSON.stringify(evalRun, null, 2));
});

app.post('/api/training-runs/:id/eval-runs', async (req, res) => {
  const actor = await requireGovernancePermission(req, res, 'eval.run', {
    entityRefs: [{ kind: 'training_run', id: req.params.id }],
    reason: 'Running evaluation changes the evidence used for model release.',
  });
  if (!actor) return;
  try {
    const result = await store.runTrainingEval({
      trainingRunId: req.params.id,
      note: typeof req.body?.note === 'string' ? req.body.note : undefined,
    });
    if (!result) {
      res.status(404).json({ error: 'Training run not found' });
      return;
    }
    res.json(result);
  } catch (error) {
    res.status(409).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.get('/api/model-release-gates', (_req, res) => {
  res.json(store.listModelReleaseGates());
});

app.get('/api/model-release-gates/:id', (req, res) => {
  const gate = store.getModelReleaseGate(req.params.id);
  if (!gate) {
    res.status(404).json({ error: 'Model release gate not found' });
    return;
  }
  res.json(gate);
});

app.post('/api/training-runs/:id/model-release-gates', async (req, res) => {
  const actor = await requireGovernancePermission(req, res, 'model.release_gate', {
    entityRefs: [{ kind: 'training_run', id: req.params.id }],
    reason: 'Creating a model release gate requires training governance permission.',
  });
  if (!actor) return;
  const gate = await store.createModelReleaseGate({
    trainingRunId: req.params.id,
    note: typeof req.body?.note === 'string' ? req.body.note : undefined,
  });
  if (!gate) {
    res.status(404).json({ error: 'Training run not found' });
    return;
  }
  res.json(gate);
});

app.post('/api/model-release-gates/:id/decisions', async (req, res) => {
  const actor = await requireGovernancePermission(req, res, 'model.release_gate_decision', {
    entityRefs: [{ kind: 'model_release_gate', id: req.params.id }],
    reason: 'Model release decisions require training governance permission.',
    metadata: {
      decision: req.body?.decision,
    },
  });
  if (!actor) return;
  const decision = normalizeModelReleaseGateDecision(req.body?.decision);
  if (!decision) {
    res.status(400).json({ error: 'Invalid model release gate decision' });
    return;
  }
  try {
    const gate = await store.recordModelReleaseGateDecision({
      gateId: req.params.id,
      decision,
      note: typeof req.body?.note === 'string' ? req.body.note : undefined,
    });
    if (!gate) {
      res.status(404).json({ error: 'Model release gate not found' });
      return;
    }
    res.json(gate);
  } catch (error) {
    res.status(409).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.get('/api/deployment-handoffs', (_req, res) => {
  res.json(store.listDeploymentHandoffs());
});

app.get('/api/deployment-handoffs/:id', (req, res) => {
  const handoff = store.getDeploymentHandoff(req.params.id);
  if (!handoff) {
    res.status(404).json({ error: 'Deployment handoff not found' });
    return;
  }
  res.json(handoff);
});

app.get('/api/deployment-handoffs/:id/download', (req, res) => {
  const handoff = store.getDeploymentHandoff(req.params.id);
  if (!handoff) {
    res.status(404).json({ error: 'Deployment handoff not found' });
    return;
  }
  const filename = `${handoff.modelName.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64) || handoff.id}-deployment-handoff.json`;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(JSON.stringify(handoff, null, 2));
});

app.post('/api/model-release-gates/:id/deployment-handoffs', async (req, res) => {
  const actor = await requireGovernancePermission(req, res, 'deployment.handoff', {
    entityRefs: [{ kind: 'model_release_gate', id: req.params.id }],
    reason: 'Creating deployment handoff requires training governance permission.',
  });
  if (!actor) return;
  try {
    const handoff = await store.createDeploymentHandoff({
      modelReleaseGateId: req.params.id,
      deploymentOwner: typeof req.body?.deploymentOwner === 'string' ? req.body.deploymentOwner : undefined,
      environment: typeof req.body?.environment === 'string' ? req.body.environment : undefined,
      rolloutStrategy: typeof req.body?.rolloutStrategy === 'string' ? req.body.rolloutStrategy : undefined,
      note: typeof req.body?.note === 'string' ? req.body.note : undefined,
    });
    if (!handoff) {
      res.status(404).json({ error: 'Model release gate not found' });
      return;
    }
    res.json(handoff);
  } catch (error) {
    res.status(409).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.patch('/api/deployment-handoffs/:id/status', async (req, res) => {
  const actor = await requireGovernancePermission(req, res, 'deployment.status', {
    entityRefs: [{ kind: 'deployment_handoff', id: req.params.id }],
    reason: 'Deployment status updates affect the training-to-production lifecycle.',
    metadata: {
      status: req.body?.status,
    },
  });
  if (!actor) return;
  const status = normalizeDeploymentHandoffStatus(req.body?.status);
  if (!status) {
    res.status(400).json({ error: 'Invalid deployment handoff status' });
    return;
  }
  const handoff = await store.updateDeploymentHandoffStatus({
    handoffId: req.params.id,
    status,
    note: typeof req.body?.note === 'string' ? req.body.note : undefined,
  });
  if (!handoff) {
    res.status(404).json({ error: 'Deployment handoff not found' });
    return;
  }
  res.json(handoff);
});

app.get('/api/post-release-monitors', (_req, res) => {
  res.json(store.listPostReleaseMonitors());
});

app.get('/api/post-release-monitors/:id', (req, res) => {
  const monitor = store.getPostReleaseMonitor(req.params.id);
  if (!monitor) {
    res.status(404).json({ error: 'Post-release monitor not found' });
    return;
  }
  res.json(monitor);
});

app.get('/api/post-release-monitors/:id/download', (req, res) => {
  const monitor = store.getPostReleaseMonitor(req.params.id);
  if (!monitor) {
    res.status(404).json({ error: 'Post-release monitor not found' });
    return;
  }
  const filename = `${monitor.modelName.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64) || monitor.id}-post-release-monitor.json`;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(JSON.stringify(monitor, null, 2));
});

app.post('/api/deployment-handoffs/:id/post-release-monitors', async (req, res) => {
  const actor = await requireGovernancePermission(req, res, 'post_release.monitor', {
    entityRefs: [{ kind: 'deployment_handoff', id: req.params.id }],
    reason: 'Creating a post-release monitor requires training governance permission.',
  });
  if (!actor) return;
  try {
    const monitor = await store.createPostReleaseMonitor({
      deploymentHandoffId: req.params.id,
      monitorOwner: typeof req.body?.monitorOwner === 'string' ? req.body.monitorOwner : undefined,
      note: typeof req.body?.note === 'string' ? req.body.note : undefined,
    });
    if (!monitor) {
      res.status(404).json({ error: 'Deployment handoff not found' });
      return;
    }
    res.json(monitor);
  } catch (error) {
    res.status(409).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.patch('/api/post-release-monitors/:id/signals', async (req, res) => {
  const actor = await requireGovernancePermission(req, res, 'post_release.signal', {
    entityRefs: [{ kind: 'post_release_monitor', id: req.params.id }],
    reason: 'Post-release signals can trigger rollback or feedback loops.',
    metadata: {
      status: req.body?.status,
      rollbackSignal: req.body?.rollbackSignal,
    },
  });
  if (!actor) return;
  const monitor = await store.recordPostReleaseSignal({
    monitorId: req.params.id,
    taskSuccessRate: finiteNumber(req.body?.taskSuccessRate),
    regressionAlertRate: finiteNumber(req.body?.regressionAlertRate),
    p95LatencyMs: finiteNumber(req.body?.p95LatencyMs),
    toolErrorRate: finiteNumber(req.body?.toolErrorRate),
    manualInterventionRate: finiteNumber(req.body?.manualInterventionRate),
    rollbackSignal: typeof req.body?.rollbackSignal === 'boolean' ? req.body.rollbackSignal : undefined,
    alertNote: typeof req.body?.alertNote === 'string' ? req.body.alertNote : undefined,
    status: normalizePostReleaseMonitorStatus(req.body?.status),
    note: typeof req.body?.note === 'string' ? req.body.note : undefined,
  });
  if (!monitor) {
    res.status(404).json({ error: 'Post-release monitor not found' });
    return;
  }
  res.json(monitor);
});

app.get('/api/feedback-loops', (_req, res) => {
  res.json(store.listFeedbackLoops());
});

app.post('/api/feedback-loops/dataset-versions', async (req, res) => {
  const actor = await requireGovernancePermission(req, res, 'dataset.create', {
    reason: 'Creating a dataset from feedback loops requires data governance permission.',
    metadata: {
      feedbackLoopIds: Array.isArray(req.body?.feedbackLoopIds) ? req.body.feedbackLoopIds.slice(0, 50) : undefined,
    },
  });
  if (!actor) return;
  const feedbackLoopIds = Array.isArray(req.body?.feedbackLoopIds)
    ? req.body.feedbackLoopIds.filter((id: unknown): id is string => typeof id === 'string')
    : undefined;

  try {
    const version = await store.createFeedbackDatasetVersion({
      name: typeof req.body?.name === 'string' ? req.body.name : undefined,
      feedbackLoopIds,
      notes: typeof req.body?.notes === 'string' ? req.body.notes : undefined,
      format: req.body?.format ? normalizeDatasetExportFormat(req.body.format) : undefined,
    });
    res.json(version);
  } catch (error) {
    res.status(409).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.get('/api/feedback-loops/:id', (req, res) => {
  const loop = store.getFeedbackLoop(req.params.id);
  if (!loop) {
    res.status(404).json({ error: 'Feedback loop not found' });
    return;
  }
  res.json(loop);
});

app.get('/api/feedback-loops/:id/download', (req, res) => {
  const loop = store.getFeedbackLoop(req.params.id);
  if (!loop) {
    res.status(404).json({ error: 'Feedback loop not found' });
    return;
  }
  const filename = `${loop.modelName.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64) || loop.id}-feedback-loop.json`;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(JSON.stringify(loop, null, 2));
});

app.post('/api/post-release-monitors/:id/feedback-loops', async (req, res) => {
  const loop = await store.createFeedbackLoop({
    postReleaseMonitorId: req.params.id,
    note: typeof req.body?.note === 'string' ? req.body.note : undefined,
  });
  if (!loop) {
    res.status(404).json({ error: 'Post-release monitor not found' });
    return;
  }
  res.json(loop);
});

app.post('/api/feedback-loops/:id/decisions', async (req, res) => {
  const actor = await requireGovernancePermission(req, res, 'feedback_loop.decision', {
    entityRefs: [{ kind: 'feedback_loop', id: req.params.id }],
    reason: 'Feedback loop decisions affect what data returns into the next dataset.',
    metadata: {
      decision: req.body?.decision,
    },
  });
  if (!actor) return;
  const decision = normalizeFeedbackLoopDecision(req.body?.decision);
  if (!decision) {
    res.status(400).json({ error: 'Invalid feedback loop decision' });
    return;
  }
  const loop = await store.recordFeedbackLoopDecision({
    feedbackLoopId: req.params.id,
    decision,
    note: typeof req.body?.note === 'string' ? req.body.note : undefined,
  });
  if (!loop) {
    res.status(404).json({ error: 'Feedback loop not found' });
    return;
  }
  res.json(loop);
});

app.get('/api/release-promotions/:id/package', (req, res) => {
  const releasePackage = store.getReleasePackage(req.params.id);
  if (!releasePackage) {
    res.status(404).json({ error: 'Release package not found' });
    return;
  }
  res.json(releasePackage);
});

app.get('/api/release-promotions/:id/package/download', (req, res) => {
  const releasePackage = store.getReleasePackage(req.params.id);
  if (!releasePackage) {
    res.status(404).json({ error: 'Release package not found' });
    return;
  }
  const filename = `${releasePackage.datasetVersionName.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64) || releasePackage.promotionId}-release-package.json`;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(JSON.stringify(releasePackage, null, 2));
});

app.post('/api/release-promotions/:id/retraining-handoffs', async (req, res) => {
  const actor = await requireGovernancePermission(req, res, 'retraining.handoff', {
    entityRefs: [{ kind: 'release_promotion', id: req.params.id }],
    reason: 'Creating a retraining handoff prepares data for the training owner.',
  });
  if (!actor) return;
  const handoff = await store.createRetrainingHandoff({
    promotionId: req.params.id,
    trainingOwner: typeof req.body?.trainingOwner === 'string' ? req.body.trainingOwner : undefined,
    targetSystem: typeof req.body?.targetSystem === 'string' ? req.body.targetSystem : undefined,
    note: typeof req.body?.note === 'string' ? req.body.note : undefined,
  });
  if (!handoff) {
    res.status(404).json({ error: 'Promoted release package not found' });
    return;
  }
  res.json(handoff);
});

app.get('/api/release-manifests/:id', (req, res) => {
  const manifest = store.getReleaseManifest(req.params.id);
  if (!manifest) {
    res.status(404).json({ error: 'Release manifest not found' });
    return;
  }
  res.json(manifest);
});

app.post('/api/release-manifests/:id/promote', async (req, res) => {
  const actor = await requireGovernancePermission(req, res, 'dataset.release_manifest', {
    entityRefs: [{ kind: 'release_manifest', id: req.params.id }],
    reason: 'Promoting a release manifest requires data governance permission.',
  });
  if (!actor) return;
  try {
    const manifest = await store.promoteReleaseManifest({
      manifestId: req.params.id,
      note: typeof req.body?.note === 'string' ? req.body.note : undefined,
    });
    if (!manifest) {
      res.status(404).json({ error: 'Release manifest not found' });
      return;
    }
    res.json(manifest);
  } catch (error) {
    res.status(409).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.post('/api/release-manifests/:id/retraining-handoff', async (req, res) => {
  const actor = await requireGovernancePermission(req, res, 'retraining.handoff', {
    entityRefs: [{ kind: 'release_manifest', id: req.params.id }],
    reason: 'Creating a retraining handoff prepares data for the training owner.',
  });
  if (!actor) return;
  try {
    const result = await store.createRetrainingHandoffFromManifest({
      manifestId: req.params.id,
      trainingOwner: typeof req.body?.trainingOwner === 'string' ? req.body.trainingOwner : undefined,
      targetSystem: typeof req.body?.targetSystem === 'string' ? req.body.targetSystem : undefined,
      note: typeof req.body?.note === 'string' ? req.body.note : undefined,
    });
    if (!result) {
      res.status(404).json({ error: 'Release manifest not found' });
      return;
    }
    res.json(result);
  } catch (error) {
    res.status(409).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.get('/api/release-manifests/:id/download', (req, res) => {
  const manifest = store.getReleaseManifest(req.params.id);
  if (!manifest) {
    res.status(404).json({ error: 'Release manifest not found' });
    return;
  }
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${manifest.filename}"`);
  res.send(JSON.stringify(manifest, null, 2));
});

app.post('/api/exports/:id/revoke', async (req, res) => {
  const actor = await requireGovernancePermission(req, res, 'export.revoke', {
    reason: 'Revoking export runs requires data governance permission.',
    metadata: {
      exportRunId: req.params.id,
    },
  });
  if (!actor) return;
  const run = await store.revokeExportRun(
    req.params.id,
    typeof req.body?.reason === 'string' ? req.body.reason : '',
    actor.id,
  );
  if (!run) {
    res.status(404).json({ error: 'Export run not found' });
    return;
  }
  await store.recordGovernanceAudit({
    action: 'export.revoke',
    decision: 'recorded',
    actor,
    entityRefs: run.datasetVersionId
      ? [{ kind: 'dataset_version', id: run.datasetVersionId, label: run.datasetVersionName }]
      : [],
    reason: run.revocation?.reason ?? 'Revoked export run.',
    metadata: {
      exportRunId: run.id,
      format: run.format,
      filename: run.filename,
      exported: run.exported,
      source: run.source,
    },
  });
  res.json(run);
});

app.get('/api/datasets', (_req, res) => {
  res.json(store.listDatasetVersions());
});

app.get('/api/datasets/:id/diff', (req, res) => {
  const baseId = typeof req.query.baseId === 'string' ? req.query.baseId : undefined;
  const diff = store.getDatasetVersionDiff(req.params.id, baseId);
  if (!diff) {
    res.status(404).json({ error: 'Dataset version diff could not be created' });
    return;
  }
  res.json(diff);
});

app.get('/api/datasets/:id/diff-review-plan', (req, res) => {
  const baseId = typeof req.query.baseId === 'string' ? req.query.baseId : undefined;
  const plan = store.getDatasetVersionDiffReviewPlan(req.params.id, baseId);
  if (!plan) {
    res.status(404).json({ error: 'Dataset diff review plan could not be created' });
    return;
  }
  res.json(plan);
});

app.post('/api/datasets/:id/diff-review-plan/apply', async (req, res) => {
  const actor = await requireGovernancePermission(req, res, 'dataset.diff_review', {
    entityRefs: [{ kind: 'dataset_version', id: req.params.id }],
    reason: 'Applying dataset diff review can approve or request changes on a dataset version.',
    metadata: {
      decision: req.body?.decision,
      baseVersionId: req.body?.baseVersionId,
    },
  });
  if (!actor) return;
  const baseVersionId = typeof req.body?.baseVersionId === 'string' ? req.body.baseVersionId : undefined;
  const decision = req.body?.decision ? normalizeDiffReviewDecision(req.body.decision) : undefined;
  if (req.body?.decision && !decision) {
    res.status(400).json({ error: 'Invalid diff review decision' });
    return;
  }

  const result = await store.applyDatasetVersionDiffReviewPlan({
    headVersionId: req.params.id,
    baseVersionId,
    decision,
    note: typeof req.body?.note === 'string' ? req.body.note : undefined,
    acknowledgeWarnings: typeof req.body?.acknowledgeWarnings === 'boolean' ? req.body.acknowledgeWarnings : true,
    createManifest: typeof req.body?.createManifest === 'boolean' ? req.body.createManifest : true,
  });
  if (!result) {
    res.status(404).json({ error: 'Dataset diff review plan could not be applied' });
    return;
  }
  res.json(result);
});

app.post('/api/datasets/:id/diff-reviews', async (req, res) => {
  const actor = await requireGovernancePermission(req, res, 'dataset.diff_review', {
    entityRefs: [{ kind: 'dataset_version', id: req.params.id }],
    reason: 'Recording dataset diff review requires data governance permission.',
    metadata: {
      decision: req.body?.decision,
      baseVersionId: req.body?.baseVersionId,
    },
  });
  if (!actor) return;
  const baseVersionId = typeof req.body?.baseVersionId === 'string' ? req.body.baseVersionId : '';
  const decision = normalizeDiffReviewDecision(req.body?.decision);
  if (!baseVersionId || !decision) {
    res.status(400).json({ error: 'baseVersionId and a valid decision are required' });
    return;
  }

  const diff = await store.recordDatasetVersionDiffReview({
    headVersionId: req.params.id,
    baseVersionId,
    decision,
    note: typeof req.body?.note === 'string' ? req.body.note : undefined,
  });
  if (!diff) {
    res.status(404).json({ error: 'Dataset version diff could not be created' });
    return;
  }
  res.json(diff);
});

app.post('/api/datasets', async (req, res) => {
  const actor = await requireGovernancePermission(req, res, 'dataset.create', {
    reason: 'Creating dataset versions changes the training candidate set.',
    metadata: {
      sampleCount: Array.isArray(req.body?.sampleIds) ? req.body.sampleIds.length : undefined,
      format: req.body?.format,
    },
  });
  if (!actor) return;
  const sampleIds = Array.isArray(req.body?.sampleIds)
    ? req.body.sampleIds.filter((id: unknown): id is string => typeof id === 'string')
    : undefined;

  try {
    const version = await store.createDatasetVersion({
      name: typeof req.body?.name === 'string' ? req.body.name : undefined,
      sampleIds,
      notes: typeof req.body?.notes === 'string' ? req.body.notes : undefined,
      format: req.body?.format ? normalizeDatasetExportFormat(req.body.format) : 'fine_tune_jsonl',
    });
    res.json(version);
  } catch (error) {
    res.status(409).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.get('/api/datasets/:id/samples', (req, res) => {
  const samples = store.listDatasetVersionSamples(req.params.id);
  if (!samples) {
    res.status(404).json({ error: 'Dataset version not found' });
    return;
  }
  res.json(samples);
});

app.post('/api/datasets/:id/release-gate-actions', async (req, res) => {
  const actor = await requireGovernancePermission(req, res, 'dataset.release_gate_action', {
    entityRefs: [{ kind: 'dataset_version', id: req.params.id }],
    reason: 'Resolving or waiving dataset release gate checks requires data governance permission.',
    metadata: {
      checkId: req.body?.checkId,
      decision: req.body?.decision,
    },
  });
  if (!actor) return;
  const version = store.getDatasetVersion(req.params.id);
  if (!version) {
    res.status(404).json({ error: 'Dataset version not found' });
    return;
  }

  const checkId = typeof req.body?.checkId === 'string' ? req.body.checkId : '';
  const decision = normalizeGateActionDecision(req.body?.decision);
  if (!checkId || !decision) {
    res.status(400).json({ error: 'checkId and a valid decision are required' });
    return;
  }

  const context = store.getDatasetReleaseGateContext(version.id);
  if (!context) {
    res.status(404).json({ error: 'Dataset version not found' });
    return;
  }
  const gate = context.gate;
  const check = gate.checks.find((item) => item.id === checkId);
  if (!check) {
    res.status(404).json({ error: 'Release gate check not found' });
    return;
  }

  const updated = await store.recordDatasetReleaseGateAction({
    versionId: version.id,
    checkId,
    decision,
    severity: check.severity,
    note: typeof req.body?.note === 'string' ? req.body.note : undefined,
    decidedBy: actor.id,
  });
  await store.recordGovernanceAudit({
    action: 'dataset.release_gate_action',
    decision: 'recorded',
    actor,
    entityRefs: [{ kind: 'dataset_version', id: version.id, label: version.name }],
    reason: `Release gate check ${checkId} marked ${decision}.`,
    metadata: {
      checkId,
      checkLabel: check.label,
      severity: check.severity,
      releaseBlocked: updated ? store.getDatasetReleaseGateContext(version.id)?.gate.releaseBlocked : undefined,
    },
  });
  res.json(updated);
});

app.post('/api/datasets/:id/release-manifests', async (req, res) => {
  const actor = await requireGovernancePermission(req, res, 'dataset.release_manifest', {
    entityRefs: [{ kind: 'dataset_version', id: req.params.id }],
    reason: 'Generating release manifests requires data governance permission.',
  });
  if (!actor) return;
  const manifest = await store.createReleaseManifest({
    versionId: req.params.id,
    notes: typeof req.body?.notes === 'string' ? req.body.notes : undefined,
    generatedBy: actor.id,
  });
  if (!manifest) {
    res.status(404).json({ error: 'Dataset version not found' });
    return;
  }
  await store.recordGovernanceAudit({
    action: 'dataset.release_manifest',
    decision: manifest.status === 'blocked' ? 'denied' : 'recorded',
    actor,
    entityRefs: [{ kind: 'release_manifest', id: manifest.id, label: manifest.datasetVersionName }],
    reason: manifest.status === 'blocked'
      ? 'Generated a blocked release manifest for review.'
      : 'Generated dataset release manifest.',
    metadata: {
      datasetVersionId: manifest.datasetVersionId,
      status: manifest.status,
      sampleCount: manifest.sampleCount,
      traceCount: manifest.traceCount,
      manifestHash: manifest.manifestHash,
    },
  });
  res.json(manifest);
});

app.get('/api/datasets/:id/export', async (req, res) => {
  const actor = await requireGovernancePermission(req, res, 'dataset.export', {
    entityRefs: [{ kind: 'dataset_version', id: req.params.id }],
    reason: 'Exporting a dataset creates training-ready files outside the review workspace.',
    metadata: {
      format: req.query.format,
    },
  });
  if (!actor) return;
  const version = store.getDatasetVersion(req.params.id);
  if (!version) {
    res.status(404).json({ error: 'Dataset version not found' });
    return;
  }

  const context = store.getDatasetReleaseGateContext(version.id);
  if (!context) {
    res.status(404).json({ error: 'Dataset version not found' });
    return;
  }
  const samples = context.samples;
  const gate = context.gate;
  if (gate.releaseBlocked) {
    res.status(409).json({
      error: 'Dataset release gate is blocked. Resolve or waive blocking checks before export.',
      gate,
    });
    return;
  }

  const format = normalizeDatasetExportFormat(req.query.format ?? version.format);
  const exported = exportTrainingSamples(samples, format);
  const exportRun = await store.recordExportRun({
    source: 'dataset_version',
    format,
    filename: exported.filename,
    filters: { datasetId: version.id, datasetName: version.name },
    sampleIds: exported.exportedSampleIds,
    samples,
    datasetVersionId: version.id,
    datasetVersionName: version.name,
    snapshotHash: version.snapshotHash,
    exported: exported.exported,
    skipped: exported.skipped,
    totals: exported.totals,
    generatedAt: exported.generatedAt,
  });
  await store.recordGovernanceAudit({
    action: 'dataset.export',
    decision: 'recorded',
    actor,
    entityRefs: [{ kind: 'dataset_version', id: version.id, label: version.name }],
    reason: 'Exported dataset version for downstream training or review.',
    metadata: {
      exportRunId: exportRun.id,
      format,
      filename: exported.filename,
      exported: exported.exported,
      skipped: exported.skipped,
      snapshotHash: version.snapshotHash,
    },
  });

  res.setHeader('Content-Type', exported.contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${exported.filename}"`);
  res.setHeader('X-TraceOps-Dataset-Id', version.id);
  res.setHeader('X-TraceOps-Export-Format', exported.format);
  res.setHeader('X-TraceOps-Export-Count', String(exported.exported));
  res.setHeader('X-TraceOps-Export-Skipped', String(exported.skipped));
  res.send(exported.body);
});

app.get('/api/exports/training-samples', async (req, res) => {
  const actor = await requireGovernancePermission(req, res, 'dataset.export', {
    reason: 'Exporting filtered training samples creates training-ready files outside the review workspace.',
    metadata: {
      format: req.query.format,
    },
  });
  if (!actor) return;
  const filters: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(req.query)) {
    if (key !== 'format') filters[key] = typeof value === 'string' ? value : undefined;
  }
  const format = normalizeDatasetExportFormat(req.query.format);
  const samples = store.listTrainingSamples(filters).samples;
  const exported = exportTrainingSamples(samples, format);
  const exportRun = await store.recordExportRun({
    source: 'training_sample_query',
    format,
    filename: exported.filename,
    filters: Object.fromEntries(Object.entries(filters).filter((entry): entry is [string, string] => !!entry[1])),
    sampleIds: exported.exportedSampleIds,
    samples,
    exported: exported.exported,
    skipped: exported.skipped,
    totals: exported.totals,
    generatedAt: exported.generatedAt,
  });
  await store.recordGovernanceAudit({
    action: 'dataset.export',
    decision: 'recorded',
    actor,
    entityRefs: [],
    reason: 'Exported filtered training sample query.',
    metadata: {
      exportRunId: exportRun.id,
      format,
      filename: exported.filename,
      exported: exported.exported,
      skipped: exported.skipped,
      filters,
    },
  });

  res.setHeader('Content-Type', exported.contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${exported.filename}"`);
  res.setHeader('X-TraceOps-Export-Format', exported.format);
  res.setHeader('X-TraceOps-Export-Count', String(exported.exported));
  res.setHeader('X-TraceOps-Export-Skipped', String(exported.skipped));
  res.send(exported.body);
});

app.post('/api/training-samples/review', async (req, res) => {
  const actor = await requireGovernancePermission(req, res, 'sample.review', {
    reason: 'Reviewing training samples changes whether KodaX traces can enter datasets.',
    metadata: {
      decision: req.body?.decision,
      sampleIds: Array.isArray(req.body?.sampleIds) ? req.body.sampleIds.slice(0, 50) : undefined,
    },
  });
  if (!actor) return;
  const decision = req.body?.decision;
  const ids = Array.isArray(req.body?.sampleIds)
    ? req.body.sampleIds.filter((id: unknown): id is string => typeof id === 'string')
    : [];
  if (decision !== 'approved' && decision !== 'rejected') {
    res.status(400).json({ error: 'decision must be approved or rejected' });
    return;
  }
  if (ids.length === 0) {
    res.status(400).json({ error: 'sampleIds must contain at least one id' });
    return;
  }

  const result = await store.reviewTrainingSamples(
    ids,
    decision,
    typeof req.body?.note === 'string' ? req.body.note : '',
    actor.id,
  );
  await store.recordGovernanceAudit({
    action: 'sample.review',
    decision: 'recorded',
    actor,
    entityRefs: result.updated.slice(0, 8).map((sample) => ({
      kind: 'trace',
      id: sample.traceId,
      label: sample.title,
    })),
    reason: `Bulk ${decision} review applied to ${result.updated.length} training sample(s).`,
    metadata: {
      decision,
      requested: ids.length,
      updated: result.updated.length,
      failed: result.failed.length,
      sampleIds: ids.slice(0, 50),
    },
  });
  res.json(result);
});

app.post('/api/training-samples/:id/review', async (req, res) => {
  const actor = await requireGovernancePermission(req, res, 'sample.review', {
    reason: 'Reviewing training samples changes whether KodaX traces can enter datasets.',
    metadata: {
      sampleId: req.params.id,
      decision: req.body?.decision,
    },
  });
  if (!actor) return;
  const decision = req.body?.decision;
  if (decision !== 'approved' && decision !== 'rejected') {
    res.status(400).json({ error: 'decision must be approved or rejected' });
    return;
  }

  try {
    const sample = await store.reviewTrainingSample(
      req.params.id,
      decision,
      typeof req.body?.note === 'string' ? req.body.note : '',
      actor.id,
    );
    if (!sample) {
      res.status(404).json({ error: 'Training sample not found' });
      return;
    }
    await store.recordGovernanceAudit({
      action: 'sample.review',
      decision: 'recorded',
      actor,
      entityRefs: [{ kind: 'trace', id: sample.traceId, label: sample.title }],
      reason: `Training sample ${decision}.`,
      metadata: {
        sampleId: sample.id,
        decision,
        riskLevel: sample.riskLevel,
        status: sample.status,
        qualityGrade: sample.quality.grade,
      },
    });
    res.json(sample);
  } catch (error) {
    res.status(409).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.post('/api/training-samples/:id/repair', async (req, res) => {
  const actor = await requireGovernancePermission(req, res, 'sample.repair', {
    reason: 'Repairing a training sample changes the cleaned data used for downstream training.',
    metadata: {
      sampleId: req.params.id,
    },
  });
  if (!actor) return;
  try {
    const sample = await store.repairTrainingSample(req.params.id, {
      cleanUserGoal: typeof req.body?.cleanUserGoal === 'string' ? req.body.cleanUserGoal : undefined,
      cleanAssistantOutcome: typeof req.body?.cleanAssistantOutcome === 'string' ? req.body.cleanAssistantOutcome : undefined,
      relinkedEvidenceIds: Array.isArray(req.body?.relinkedEvidenceIds)
        ? req.body.relinkedEvidenceIds.filter((id: unknown): id is string => typeof id === 'string')
        : undefined,
      evidenceGapNote: typeof req.body?.evidenceGapNote === 'string' ? req.body.evidenceGapNote : undefined,
      note: typeof req.body?.note === 'string' ? req.body.note : undefined,
    });
    if (!sample) {
      res.status(404).json({ error: 'Training sample not found' });
      return;
    }
    res.json(sample);
  } catch (error) {
    res.status(409).json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.get('/api/training-samples/:id/evidence-candidates', (req, res) => {
  const candidates = store.listEvidenceCandidatesForSample(req.params.id);
  if (!candidates) {
    res.status(404).json({ error: 'Training sample not found' });
    return;
  }
  res.json(candidates);
});

app.get('/api/training-samples/:id', (req, res) => {
  const sample = store.getTrainingSample(req.params.id);
  if (!sample) {
    res.status(404).json({ error: 'Training sample not found' });
    return;
  }
  res.json(sample);
});

app.get('/api/raw-traces/:id', (req, res) => {
  const detail = store.getTrace(req.params.id);
  if (!detail) {
    res.status(404).json({ error: 'Trace not found' });
    return;
  }
  res.json(detail);
});

app.post('/api/raw-traces/:id/reimport', async (req, res) => {
  const detail = store.getTrace(req.params.id);
  if (!detail) {
    res.status(404).json({ error: 'Trace not found' });
    return;
  }
  const job = await syncKodaXSessions(req.body?.mode === 'retry' ? 'retry' : 'manual');
  res.json(job);
});

if (process.env.TRACEOPS_SERVE_COLLECTOR === 'true') {
  app.use(express.static(path.resolve(process.cwd(), 'dist/v0.1.2')));
}

app.listen(port, () => {
  const displayVersion = process.env.TRACEOPS_SERVE_COLLECTOR === 'true' ? TRACEOPS_COLLECTOR_VERSION : productMode;
  process.stdout.write(`TraceOps ${displayVersion} running on http://localhost:${port}\n`);
  if (productMode !== '0.1.0') {
    scheduleWatch(2_000);
    scheduleTaskExecutor(4_000);
  }
});
