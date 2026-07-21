import { createHash } from 'node:crypto';

import { cleanTraceFromRawTrace } from '../../../../packages/distiller/src/cleanTrace';
import { generateTrainingSamples } from '../../../../packages/distiller/src/trainingSamples';
import { distillTrainingText, redactEvaluationText } from '../../../../packages/governance/src/redaction';
import { normalizeKodaXSession } from '../../../../packages/kodax-connector/src/normalizer';
import type { KodaXFullSession, KodaXSessionSummary } from '../../../../packages/kodax-connector/src/kodaxScanner';
import type {
  CleanTraceEvidenceCoverageStatus,
  RawEvidence,
  RawTrace,
  RawTraceEvent,
  RiskLevel,
  TrainingTextDistillation,
} from '../../../../packages/trace-core/src/types';

export const SPACE_EVALUATION_TRACE_SCHEMA = 'traceops-space-evaluation-trace-v1';
export const SPACE_EVALUATION_CASE_SCHEMA = 'traceops-space-evaluation-case-v1';
export const SPACE_EVALUATION_POLICY_VERSION = 'space-workflow-redaction-v1';
export const SPACE_WORKFLOW_SESSION_SCHEMA = 'traceops-space-workflow-session-v1';

const MAX_STRUCTURED_DEPTH = 40;
const MAX_ARRAY_ITEMS = 100_000;
const MAX_OBJECT_FIELDS = 10_000;
const MAX_TEXT_LENGTH = 2_000_000;
const SENSITIVE_KEY = /(?:^|_)(?:api_?key|access_?token|refresh_?token|auth_?token|password|passwd|secret|authorization|cookie|credentials?|private_?key)(?:$|_)/i;
const THINKING_KEY = /^(?:thinking|thinking_signature|chain_of_thought|reasoning_content)$/i;
const IDENTIFIER_KEY = /(?:^|_)(?:id|.*_id|.*Id)$/;
const BENCHMARK_CONTAMINATION = /(?:benchmark|golden answer|expected output|评测集|基准答案|标准答案)/i;

export type EvaluationReadiness = 'eval_ready' | 'needs_review' | 'privacy_blocked' | 'incomplete';
export type QualityCheckStatus = 'pass' | 'warn' | 'fail';
export type SanitizedJson = null | boolean | number | string | SanitizedJson[] | { [key: string]: SanitizedJson };

export interface EvaluationRedactionStats {
  total: number;
  byType: Record<string, number>;
  thinkingBlocksRemoved: number;
  structuredFieldsRedacted: number;
  pseudonymizedIdentifiers: number;
  truncatedValues: number;
}

export interface SafeRuntimeSnapshot {
  surface: 'code' | 'partner';
  provider?: string;
  model?: string;
  reasoningMode?: string;
  permissionMode?: string;
  agentMode?: string;
  profileKey?: string;
  profileVersion?: string;
  branch?: string;
  workspaceKind?: 'detected' | 'managed';
  scope?: 'user' | 'managed-task-worker';
  attribution: 'complete' | 'partial' | 'unknown';
}

export interface EvaluationQualityCheck {
  id: string;
  dimension: 'completeness' | 'privacy' | 'evidence' | 'replayability' | 'attribution' | 'integrity' | 'contamination' | 'deduplication';
  status: QualityCheckStatus;
  requiresReview: boolean;
  message: string;
  evidenceRefs: string[];
}

export interface EvaluationQualityGate {
  policyVersion: typeof SPACE_EVALUATION_POLICY_VERSION;
  decision: EvaluationReadiness;
  score: number;
  humanReviewRequired: boolean;
  reviewReasons: string[];
  checks: EvaluationQualityCheck[];
  contentFingerprint: string;
}

export interface SanitizedTraceEvent {
  eventKey: string;
  sourceEntryKey?: string;
  parentEntryKey?: string;
  occurredAt: string;
  order: number;
  type: RawTraceEvent['type'];
  role?: RawTraceEvent['role'];
  active: boolean;
  label: string;
  summary: string;
  riskLevel?: RiskLevel;
  payload?: SanitizedJson;
}

export interface SanitizedEvidence {
  evidenceKey: string;
  sourceEntryKey?: string;
  kind: RawEvidence['kind'];
  sourceTool?: string;
  action?: string;
  target: string;
  summary: string;
  occurredAt: string;
  riskLevel: RiskLevel;
  metadata?: SanitizedJson;
}

export interface SpaceEvaluationTrace {
  schema: typeof SPACE_EVALUATION_TRACE_SCHEMA;
  traceKey: string;
  revisionKey: string;
  projectGroupKey: string;
  sourceFingerprint: string;
  title: string;
  createdAt?: string;
  taskStatus: RawTrace['status'];
  runtime: SafeRuntimeSnapshot;
  sessionTopology: {
    role: 'main' | 'worker';
    linkStatus: 'root' | 'linked' | 'inferred' | 'orphan' | 'ambiguous';
    linkMethod: 'root' | 'session_reference' | 'single_main_same_project' | 'none';
    parentTraceKey?: string;
    childTraceKeys: string[];
    candidateParentTraceKeys: string[];
    requiresReview: boolean;
  };
  lineage: {
    version: 1;
    activeEntryKey?: string;
    entries: Array<{
      entryKey: string;
      parentEntryKey?: string;
      occurredAt: string;
      type: 'message' | 'compaction' | 'branch_summary';
      active: boolean;
    }>;
  };
  transcript: Array<{
    entryKey: string;
    parentEntryKey?: string;
    occurredAt: string;
    type: 'message' | 'compaction' | 'branch_summary';
    role?: 'user' | 'assistant' | 'system';
    active: boolean;
    content: SanitizedJson;
  }>;
  counts: {
    messages: number;
    events: number;
    activeEvents: number;
    toolUseEvents: number;
    toolResultEvents: number;
    evidence: number;
    verificationEvidence: number;
    compactions: number;
    branchSummaries: number;
    malformedRecords: number;
  };
  risk: RawTrace['risk'];
  conversation: Array<{
    entryKey: string;
    role: 'user' | 'assistant' | 'system';
    occurredAt: string;
    content: string;
  }>;
  events: SanitizedTraceEvent[];
  evidence: SanitizedEvidence[];
  workflow: {
    skills: string[];
    tools: string[];
    planningEventRefs: string[];
    toolCallEventRefs: string[];
    toolResultEventRefs: string[];
    errorEventRefs: string[];
    phases: Array<'conversation' | 'planning' | 'tool_execution' | 'verification' | 'completion'>;
  };
  privacy: {
    handling: 'field_level_masking';
    contentPreserved: true;
    sensitiveValuesMasked: number;
    privateReasoningBlocksOmitted: number;
  };
  preprocessing: {
    policyVersion: typeof SPACE_EVALUATION_POLICY_VERSION;
    cleaningPolicyVersion: 'kodax-clean-text-v1';
    redactions: EvaluationRedactionStats;
    cleanSummary: {
      task: string;
      outcome: string;
      execution: string;
      evidence: string;
      governance: string;
    };
    evidenceCoverage: {
      status: CleanTraceEvidenceCoverageStatus;
      linkedEvidenceCount: number;
      toolEventCount: number;
      evidenceGapCount: number;
      notes: string[];
    };
    metrics: {
      eventCount: number;
      toolEventCount: number;
      evidenceCount: number;
      compressionRatio: number;
    };
  };
  qualityGate: EvaluationQualityGate;
  exportPayload: 'full_sanitized_trace';
}

export interface SpaceEvaluationCase {
  schema: typeof SPACE_EVALUATION_CASE_SCHEMA;
  caseKey: string;
  sourceTraceKey: string;
  projectGroupKey: string;
  contentFingerprint: string;
  usage: 'update_evidence';
  title: string;
  taskType: 'conversation' | 'tool_execution' | 'artifact_creation' | 'failure_recovery';
  difficulty: 'basic' | 'moderate' | 'complex';
  capabilityTags: string[];
  input: {
    task: string;
    systemContext: string[];
    runtime: SafeRuntimeSnapshot;
    requiredTools: string[];
    traceRef: string;
  };
  expected: {
    outcome: string;
    artifactRefs: string[];
    evidenceRefs: string[];
    assertions: Array<{
      id: string;
      description: string;
      source: 'check_evidence' | 'artifact_evidence' | 'trace_outcome' | 'manual';
      evidenceRefs: string[];
      required: boolean;
    }>;
  };
  grader: {
    kind: 'trace_signal' | 'manual';
    version: 'space-trace-grader-v1' | 'manual-rubric-v1';
    config: {
      successCriteria: string[];
      failureSignals: string[];
      evidenceRefs: string[];
    };
  };
  replay: {
    mode: 'automatic' | 'assisted' | 'manual';
    eventRefs: string[];
    environmentSnapshotAvailable: boolean;
    notes: string[];
  };
  benchmarkPromotion: {
    validationEligible: boolean;
    independentHoldoutRequired: true;
    freezeBeforeHarnessChange: true;
    reasons: string[];
  };
  qualityGate: EvaluationQualityGate;
}

export interface SpaceEvaluationPreprocessResult {
  trace: SpaceEvaluationTrace;
  evaluationCase: SpaceEvaluationCase;
  redactions: EvaluationRedactionStats;
}

export interface SpaceWorkflowSession {
  schema: typeof SPACE_WORKFLOW_SESSION_SCHEMA;
  sessionKey: string;
  revisionKey: string;
  projectGroupKey: string;
  sourceFingerprint: string;
  title: string;
  tag?: string;
  createdAt?: string;
  taskStatus: RawTrace['status'];
  runtime: SafeRuntimeSnapshot;
  topology: SpaceEvaluationTrace['sessionTopology'];
  transcript: SpaceEvaluationTrace['transcript'];
  conversation: SpaceEvaluationTrace['conversation'];
  events: SanitizedTraceEvent[];
  evidence: SanitizedEvidence[];
  workflow: SpaceEvaluationTrace['workflow'];
  overview: {
    task: string;
    outcome: string;
  };
  counts: SpaceEvaluationTrace['counts'];
  risk: RawTrace['risk'];
  privacy: SpaceEvaluationTrace['privacy'] & {
    redactions: EvaluationRedactionStats;
  };
}

export interface SpaceWorkflowPreprocessResult {
  session: SpaceWorkflowSession;
  redactions: EvaluationRedactionStats;
}

function hash(value: unknown, length = 24): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, length);
}

export function emptyEvaluationRedactionStats(): EvaluationRedactionStats {
  return {
    total: 0,
    byType: {},
    thinkingBlocksRemoved: 0,
    structuredFieldsRedacted: 0,
    pseudonymizedIdentifiers: 0,
    truncatedValues: 0,
  };
}

export function mergeEvaluationRedactionStats(target: EvaluationRedactionStats, source: EvaluationRedactionStats) {
  target.total += source.total;
  target.thinkingBlocksRemoved += source.thinkingBlocksRemoved;
  target.structuredFieldsRedacted += source.structuredFieldsRedacted;
  target.pseudonymizedIdentifiers += source.pseudonymizedIdentifiers;
  target.truncatedValues += source.truncatedValues;
  for (const [type, count] of Object.entries(source.byType)) {
    target.byType[type] = (target.byType[type] ?? 0) + count;
  }
}

function recordDistillation(stats: EvaluationRedactionStats, distillation: TrainingTextDistillation) {
  stats.total += distillation.redactionCount;
  for (const item of distillation.redactions) {
    stats.byType[item.type] = (stats.byType[item.type] ?? 0) + item.count;
  }
}

function recordManualRedaction(stats: EvaluationRedactionStats, type: string, count = 1) {
  stats.total += count;
  stats.byType[type] = (stats.byType[type] ?? 0) + count;
}

function cleanCompact(value: string | undefined, stats: EvaluationRedactionStats): string {
  const output = distillTrainingText(value);
  recordDistillation(stats, output.distillation);
  return output.clean;
}

function cleanPreservingStructure(value: string, stats: EvaluationRedactionStats): string {
  const output = redactEvaluationText(value);
  recordDistillation(stats, output.distillation);
  if (output.clean.length <= MAX_TEXT_LENGTH) return output.clean;
  stats.truncatedValues += 1;
  return `${output.clean.slice(0, MAX_TEXT_LENGTH)}\n<TRUNCATED>`;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function identifier(value: string): string {
  return `ref_${hash(value)}`;
}

function sanitizeStructured(
  value: unknown,
  stats: EvaluationRedactionStats,
  options: { depth?: number; key?: string } = {},
): SanitizedJson | undefined {
  const depth = options.depth ?? 0;
  const key = options.key ?? '';
  if (depth > MAX_STRUCTURED_DEPTH) {
    stats.truncatedValues += 1;
    return '<TRUNCATED_DEPTH>';
  }
  if (value === undefined || typeof value === 'function' || typeof value === 'symbol') return undefined;
  if (value === null || typeof value === 'boolean') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? value : String(value);
  if (typeof value === 'bigint') return String(value);
  if (typeof value === 'string') {
    if (SENSITIVE_KEY.test(key)) {
      stats.structuredFieldsRedacted += 1;
      recordManualRedaction(stats, 'credential_field');
      return '***';
    }
    if (IDENTIFIER_KEY.test(key)) {
      stats.pseudonymizedIdentifiers += 1;
      return identifier(value);
    }
    return cleanPreservingStructure(value, stats);
  }
  if (Array.isArray(value)) {
    const limited = value.slice(0, MAX_ARRAY_ITEMS);
    if (value.length > limited.length) stats.truncatedValues += 1;
    return limited
      .map((item) => sanitizeStructured(item, stats, { depth: depth + 1 }))
      .filter((item): item is SanitizedJson => item !== undefined);
  }

  const input = asRecord(value);
  if (!input) return cleanPreservingStructure(String(value), stats);
  if (input.type === 'thinking') {
    stats.thinkingBlocksRemoved += 1;
    return { type: 'thinking', content: '<PRIVATE_REASONING_OMITTED>' };
  }
  const entries = Object.entries(input).slice(0, MAX_OBJECT_FIELDS);
  if (Object.keys(input).length > entries.length) stats.truncatedValues += 1;
  const output: Record<string, SanitizedJson> = {};
  for (const [field, fieldValue] of entries) {
    if (THINKING_KEY.test(field)) {
      stats.thinkingBlocksRemoved += 1;
      output[field] = '<PRIVATE_REASONING_OMITTED>';
      continue;
    }
    if (SENSITIVE_KEY.test(field)) {
      stats.structuredFieldsRedacted += 1;
      recordManualRedaction(stats, 'credential_field');
      output[field] = '***';
      continue;
    }
    const sanitized = sanitizeStructured(fieldValue, stats, { depth: depth + 1, key: field });
    if (sanitized !== undefined) output[field] = sanitized;
  }
  return output;
}

function messageText(message: Record<string, unknown>, stats: EvaluationRedactionStats): string {
  if (typeof message.content === 'string') return cleanCompact(message.content, stats);
  if (!Array.isArray(message.content)) return '';
  const parts: string[] = [];
  for (const item of message.content) {
    const block = asRecord(item);
    if (!block || block.type === 'thinking') continue;
    if (block.type === 'text' && typeof block.text === 'string') parts.push(block.text);
    else if (block.type === 'tool_use') parts.push(`[tool_use ${String(block.name ?? 'unknown')}]`);
    else if (block.type === 'tool_result') parts.push('[tool_result]');
  }
  return cleanCompact(parts.join('\n'), stats);
}

function surfaceFromTag(tag: string | undefined): 'code' | 'partner' {
  return tag === 'partner' ? 'partner' : 'code';
}

function safeRuntime(full: KodaXFullSession, trace: RawTrace, stats: EvaluationRedactionStats): SafeRuntimeSnapshot {
  const runtime = full.runtimeInfo ?? {};
  const string = (key: string) => typeof runtime[key] === 'string' ? cleanCompact(runtime[key] as string, stats) : undefined;
  const provider = string('provider') ?? trace.runtime.provider;
  const model = string('model') ?? trace.runtime.model;
  const profileVersion = string('profileVersion') ?? trace.runtime.profileVersion;
  const profileId = typeof runtime.profileId === 'string' ? runtime.profileId : trace.runtime.profileId;
  const attributionFields = [provider, model, profileVersion, string('agentMode') ?? trace.runtime.agentMode].filter(Boolean).length;
  return {
    surface: surfaceFromTag(full.tag),
    provider,
    model,
    reasoningMode: string('reasoningMode') ?? trace.runtime.reasoningMode,
    permissionMode: string('permissionMode') ?? trace.runtime.permissionMode,
    agentMode: string('agentMode') ?? trace.runtime.agentMode,
    profileKey: profileId ? `profile_${hash(profileId)}` : undefined,
    profileVersion,
    branch: trace.runtime.branch ? cleanCompact(trace.runtime.branch, stats) : undefined,
    workspaceKind: trace.runtime.workspaceKind,
    scope: full.scope,
    attribution: attributionFields >= 3 ? 'complete' : attributionFields > 0 ? 'partial' : 'unknown',
  };
}

function eventKey(traceKey: string, eventId: string): string {
  return `event_${hash({ traceKey, eventId })}`;
}

function entryKey(traceKey: string, entryId: string): string {
  return `entry_${hash({ traceKey, entryId })}`;
}

function evidenceKey(traceKey: string, evidenceId: string): string {
  return `evidence_${hash({ traceKey, evidenceId })}`;
}

function sanitizeEvents(traceKey: string, events: RawTraceEvent[], stats: EvaluationRedactionStats): SanitizedTraceEvent[] {
  return events.map((event) => ({
    eventKey: eventKey(traceKey, event.id),
    sourceEntryKey: event.sourceEntryId ? entryKey(traceKey, event.sourceEntryId) : undefined,
    parentEntryKey: event.parentEntryId ? entryKey(traceKey, event.parentEntryId) : undefined,
    occurredAt: event.occurredAt,
    order: event.order,
    type: event.type,
    role: event.role,
    active: event.active !== false,
    label: cleanCompact(event.label, stats),
    summary: cleanCompact(event.preview, stats),
    riskLevel: event.riskLevel,
    payload: sanitizeStructured(event.payload, stats),
  }));
}

function sanitizeEvidence(traceKey: string, evidence: RawEvidence[], stats: EvaluationRedactionStats): SanitizedEvidence[] {
  return evidence.map((item) => ({
    evidenceKey: evidenceKey(traceKey, item.id),
    sourceEntryKey: item.sessionEntryId ? entryKey(traceKey, item.sessionEntryId) : undefined,
    kind: item.kind,
    sourceTool: item.sourceTool ? cleanCompact(item.sourceTool, stats) : undefined,
    action: item.action ? cleanCompact(item.action, stats) : undefined,
    target: cleanPreservingStructure(item.displayTarget ?? item.target, stats),
    summary: cleanCompact(item.summary ?? item.displayTarget ?? item.target, stats),
    occurredAt: item.timestamp,
    riskLevel: item.riskLevel,
    metadata: sanitizeStructured(item.metadata, stats),
  }));
}

function eventToolName(event: SanitizedTraceEvent): string | undefined {
  const match = event.label.match(/^Tool (?:call|card):\s*(.+)$/i);
  return match?.[1]?.trim() || undefined;
}

function extractSkillNames(events: SanitizedTraceEvent[], rawEvents: RawTraceEvent[] = []): string[] {
  const names = new Set<string>();
  const pathPattern = /(?:^|[\\/])skills[\\/]([^"'\\/\s]+)[\\/]SKILL\.md/gi;
  const uriPattern = /skill:\/\/([^"'\s?#]+)/gi;
  const texts = [
    ...events.map((event) => `${event.label}\n${event.summary}\n${JSON.stringify(event.payload ?? '')}`),
    ...rawEvents.map((event) => `${event.label}\n${event.preview}\n${JSON.stringify(event.payload ?? '')}`),
  ];
  for (const text of texts) {
    for (const match of text.matchAll(pathPattern)) {
      if (match[1]) names.add(match[1]);
    }
    for (const match of text.matchAll(uriPattern)) {
      if (match[1]) names.add(match[1].split('/').filter(Boolean).at(-1) ?? match[1]);
    }
  }
  for (const event of events) {
    const toolName = eventToolName(event);
    if (toolName && /(?:^|[.:_-])skill(?:s)?(?:$|[.:_-])/i.test(toolName)) names.add(toolName);
  }
  return Array.from(names).sort();
}

function buildWorkflow(
  events: SanitizedTraceEvent[],
  evidence: SanitizedEvidence[],
  outcome: string,
  rawEvents: RawTraceEvent[] = [],
): SpaceEvaluationTrace['workflow'] {
  const tools = Array.from(new Set(events.map(eventToolName).filter((name): name is string => Boolean(name)))).sort();
  const planningEventRefs = events
    .filter((event) => /(?:update[_ -]?plan|task[_ -]?list|todo|planning)/i.test(`${event.label}\n${event.summary}`))
    .map((event) => event.eventKey);
  const toolCallEventRefs = events
    .filter((event) => event.type === 'tool_call' || event.type === 'tool_use')
    .map((event) => event.eventKey);
  const toolResultEventRefs = events.filter((event) => event.type === 'tool_result').map((event) => event.eventKey);
  const errorEventRefs = events
    .filter((event) => event.type === 'error_metadata' || /(?:error|failed|failure|exception)/i.test(`${event.label}\n${event.summary}`))
    .map((event) => event.eventKey);
  const phases: SpaceEvaluationTrace['workflow']['phases'] = ['conversation'];
  if (planningEventRefs.length > 0) phases.push('planning');
  if (toolCallEventRefs.length > 0) phases.push('tool_execution');
  if (evidence.some((item) => item.kind === 'check_result')) phases.push('verification');
  if (outcome) phases.push('completion');
  return {
    skills: extractSkillNames(events, rawEvents),
    tools,
    planningEventRefs,
    toolCallEventRefs,
    toolResultEventRefs,
    errorEventRefs,
    phases,
  };
}

export function preprocessSpaceWorkflowSession(
  summary: KodaXSessionSummary,
  full: KodaXFullSession,
): SpaceWorkflowPreprocessResult {
  const stats = emptyEvaluationRedactionStats();
  const bundle = normalizeKodaXSession(summary, full);
  const sessionKey = `space_session_${hash({ id: full.id, projectKey: full.projectKey })}`;
  const revisionKey = `space_revision_${hash({ sessionKey, sourceHash: bundle.revision.sourceHash })}`;
  const projectGroupKey = `space_scope_${hash(summary.projectKey ?? full.projectKey ?? full.gitRoot ?? 'unknown')}`;
  const events = sanitizeEvents(sessionKey, bundle.events, stats);
  const evidence = sanitizeEvidence(sessionKey, bundle.evidence, stats);
  const runtime = safeRuntime(full, bundle.trace, stats);
  const transcript: SpaceWorkflowSession['transcript'] = full.transcriptEntries.map((entry) => ({
    entryKey: entryKey(sessionKey, entry.entryId),
    parentEntryKey: entry.parentId ? entryKey(sessionKey, entry.parentId) : undefined,
    occurredAt: entry.timestamp,
    type: entry.type,
    role: entry.message.role === 'user' || entry.message.role === 'assistant' || entry.message.role === 'system'
      ? entry.message.role
      : undefined,
    active: entry.active,
    content: sanitizeStructured(entry.message, stats) ?? {},
  }));
  const conversation: SpaceWorkflowSession['conversation'] = full.transcriptEntries
    .filter((entry) => entry.active && entry.type === 'message')
    .map((entry) => {
      const role = entry.message.role;
      if (role !== 'user' && role !== 'assistant' && role !== 'system') return undefined;
      const content = messageText(entry.message, stats);
      return content ? {
        entryKey: entryKey(sessionKey, entry.entryId),
        role,
        occurredAt: entry.timestamp,
        content,
      } : undefined;
    })
    .filter((item): item is SpaceWorkflowSession['conversation'][number] => Boolean(item));
  const task = conversation.find((item) => item.role === 'user')?.content ?? '';
  const outcome = [...conversation].reverse().find((item) => item.role === 'assistant')?.content ?? '';
  const workflow = buildWorkflow(events, evidence, outcome, bundle.events);
  const title = cleanCompact(full.title, stats) || 'Untitled session';
  const session: SpaceWorkflowSession = {
    schema: SPACE_WORKFLOW_SESSION_SCHEMA,
    sessionKey,
    revisionKey,
    projectGroupKey,
    sourceFingerprint: hash(bundle.revision.sourceHash, 32),
    title,
    tag: full.tag ? cleanCompact(full.tag, stats) : undefined,
    createdAt: full.createdAt,
    taskStatus: bundle.trace.status,
    runtime,
    topology: {
      role: summary.scope === 'managed-task-worker' ? 'worker' : 'main',
      linkStatus: summary.scope === 'managed-task-worker' ? 'orphan' : 'root',
      linkMethod: summary.scope === 'managed-task-worker' ? 'none' : 'root',
      childTraceKeys: [],
      candidateParentTraceKeys: [],
      requiresReview: false,
    },
    transcript,
    conversation,
    events,
    evidence,
    workflow,
    overview: { task, outcome },
    counts: {
      messages: conversation.length,
      events: events.length,
      activeEvents: events.filter((event) => event.active).length,
      toolUseEvents: bundle.trace.counts.toolUseEvents,
      toolResultEvents: bundle.trace.counts.toolResultEvents,
      evidence: evidence.length,
      verificationEvidence: evidence.filter((item) => item.kind === 'check_result').length,
      compactions: bundle.trace.counts.compactions,
      branchSummaries: bundle.trace.counts.branchSummaries,
      malformedRecords: full.malformedCount,
    },
    risk: sanitizeRisk(bundle.trace, stats),
    privacy: {
      handling: 'field_level_masking',
      contentPreserved: true,
      sensitiveValuesMasked: 0,
      privateReasoningBlocksOmitted: 0,
      redactions: stats,
    },
  };
  session.privacy.sensitiveValuesMasked = stats.total;
  session.privacy.privateReasoningBlocksOmitted = stats.thinkingBlocksRemoved;
  return { session, redactions: stats };
}

function qualityCheck(
  id: string,
  dimension: EvaluationQualityCheck['dimension'],
  status: QualityCheckStatus,
  message: string,
  options: { requiresReview?: boolean; evidenceRefs?: string[] } = {},
): EvaluationQualityCheck {
  return {
    id,
    dimension,
    status,
    requiresReview: options.requiresReview ?? status === 'fail',
    message,
    evidenceRefs: options.evidenceRefs ?? [],
  };
}

function buildQualityGate(input: {
  trace: RawTrace;
  full: KodaXFullSession;
  task: string;
  outcome: string;
  runtime: SafeRuntimeSnapshot;
  eventCount: number;
  activeEventCount: number;
  evidence: SanitizedEvidence[];
  coverage: CleanTraceEvidenceCoverageStatus;
  redactions: EvaluationRedactionStats;
  fingerprint: string;
}): EvaluationQualityGate {
  const checks: EvaluationQualityCheck[] = [];
  const verificationRefs = input.evidence.filter((item) => item.kind === 'check_result').map((item) => item.evidenceKey);
  checks.push(qualityCheck(
    'task_input',
    'completeness',
    input.task ? 'pass' : 'fail',
    input.task ? 'A user task is available.' : 'No usable user task was found.',
    { requiresReview: !input.task },
  ));
  checks.push(qualityCheck(
    'reference_outcome',
    'completeness',
    input.outcome ? (input.trace.status === 'failed' ? 'warn' : 'pass') : 'fail',
    input.outcome
      ? input.trace.status === 'failed'
        ? 'A failure outcome is available and needs a human-defined success reference.'
        : 'A final assistant outcome is available.'
      : 'No final assistant outcome is available.',
    { requiresReview: !input.outcome || input.trace.status === 'failed' },
  ));
  checks.push(qualityCheck(
    'trace_structure',
    'integrity',
    input.eventCount > 0 && input.activeEventCount > 0 ? 'pass' : 'fail',
    `${input.eventCount} total event(s), ${input.activeEventCount} active event(s).`,
    { requiresReview: input.eventCount === 0 || input.activeEventCount === 0 },
  ));
  const toolUse = input.trace.counts.toolUseEvents;
  const toolResult = input.trace.counts.toolResultEvents;
  const paired = toolUse === 0 || toolResult >= toolUse;
  checks.push(qualityCheck(
    'tool_pairing',
    'replayability',
    paired ? 'pass' : 'warn',
    toolUse === 0 ? 'No tool pairing is required.' : `${toolUse} tool call(s) and ${toolResult} tool result(s) were captured.`,
    { requiresReview: !paired },
  ));
  const coveragePass = input.coverage === 'complete' || input.coverage === 'not_required';
  checks.push(qualityCheck(
    'evidence_coverage',
    'evidence',
    coveragePass ? 'pass' : 'warn',
    `Evidence coverage is ${input.coverage}.`,
    { requiresReview: !coveragePass, evidenceRefs: input.evidence.map((item) => item.evidenceKey) },
  ));
  checks.push(qualityCheck(
    'verification_oracle',
    'evidence',
    verificationRefs.length > 0 ? 'pass' : 'warn',
    verificationRefs.length > 0
      ? `${verificationRefs.length} explicit verification evidence item(s) can support automated grading.`
      : 'No explicit check_result evidence exists; a human must define the benchmark oracle.',
    { requiresReview: verificationRefs.length === 0, evidenceRefs: verificationRefs },
  ));
  const credentialRisk = input.trace.risk.credentialRisk
    ?? (input.trace.risk.containsCredentialHint ? 'high_confidence' : 'none');
  checks.push(qualityCheck(
    'credential_privacy',
    'privacy',
    credentialRisk === 'none' ? 'pass' : 'warn',
    credentialRisk === 'high_confidence'
      ? 'A high-confidence credential pattern was detected and masked in place; the rest of the Session is preserved.'
      : credentialRisk === 'mention'
        ? 'A credential field or environment file was mentioned, but no high-confidence secret value was detected.'
        : 'No credential-like source content was detected.',
    { requiresReview: credentialRisk !== 'none' },
  ));
  checks.push(qualityCheck(
    'enterprise_content',
    'privacy',
    input.trace.risk.containsCustomerDataHint || input.trace.risk.containsSourceCodeHint ? 'warn' : 'pass',
    input.trace.risk.containsCustomerDataHint
      ? 'Enterprise/customer/account signals require governance review before benchmark use.'
      : input.trace.risk.containsSourceCodeHint
        ? 'Source-code signals require governance review before benchmark use.'
        : 'No additional enterprise-content signal was detected.',
    { requiresReview: input.trace.risk.containsCustomerDataHint || input.trace.risk.containsSourceCodeHint },
  ));
  checks.push(qualityCheck(
    'structured_sanitization',
    'privacy',
    input.redactions.truncatedValues > 0 ? 'warn' : 'pass',
    `${input.redactions.total} sensitive value(s) replaced; ${input.redactions.thinkingBlocksRemoved} thinking block(s) removed; ${input.redactions.truncatedValues} value(s) truncated.`,
    { requiresReview: input.redactions.truncatedValues > 0 },
  ));
  checks.push(qualityCheck(
    'runtime_attribution',
    'attribution',
    input.runtime.attribution === 'complete' ? 'pass' : 'warn',
    `Model/Harness runtime attribution is ${input.runtime.attribution}. The evaluator may supply a frozen runtime later.`,
    { requiresReview: false },
  ));
  checks.push(qualityCheck(
    'schema_integrity',
    'integrity',
    input.full.malformedCount === 0 ? 'pass' : 'warn',
    input.full.malformedCount === 0 ? 'All Session records were parsed.' : `${input.full.malformedCount} malformed record(s) were ignored.`,
    { requiresReview: input.full.malformedCount > 0 },
  ));
  const contaminated = BENCHMARK_CONTAMINATION.test(`${input.task}\n${input.outcome}`);
  checks.push(qualityCheck(
    'benchmark_contamination',
    'contamination',
    contaminated ? 'warn' : 'pass',
    contaminated ? 'Possible benchmark/golden-answer language was detected.' : 'No obvious benchmark-answer contamination was detected.',
    { requiresReview: contaminated },
  ));
  checks.push(qualityCheck(
    'package_deduplication',
    'deduplication',
    'pass',
    'No duplicate with this content fingerprint has been found in the current package.',
  ));

  const essentialFailure = checks.some((item) => item.status === 'fail' && item.dimension !== 'privacy');
  const privacyFailure = checks.some((item) => item.status === 'fail' && item.dimension === 'privacy');
  const requiresReview = checks.some((item) => item.requiresReview);
  const decision: EvaluationReadiness = privacyFailure
    ? 'privacy_blocked'
    : essentialFailure
      ? 'incomplete'
      : requiresReview
        ? 'needs_review'
        : 'eval_ready';
  const score = Math.max(0, Math.min(100, 100 - checks.reduce((penalty, item) => {
    if (item.status === 'fail') return penalty + 30;
    if (item.status === 'warn') return penalty + (item.requiresReview ? 8 : 3);
    return penalty;
  }, 0)));
  const reviewReasons = checks.filter((item) => item.requiresReview).map((item) => item.message);
  return {
    policyVersion: SPACE_EVALUATION_POLICY_VERSION,
    decision,
    score,
    humanReviewRequired: decision !== 'eval_ready',
    reviewReasons,
    checks,
    contentFingerprint: input.fingerprint,
  };
}

function taskType(trace: RawTrace, evidence: SanitizedEvidence[]): SpaceEvaluationCase['taskType'] {
  if (trace.status === 'failed') return 'failure_recovery';
  if (evidence.some((item) => item.kind === 'file_created' || item.kind === 'file_modified')) return 'artifact_creation';
  if (trace.counts.toolUseEvents > 0) return 'tool_execution';
  return 'conversation';
}

function difficulty(trace: RawTrace, eventCount: number): SpaceEvaluationCase['difficulty'] {
  if (eventCount >= 80 || trace.counts.toolUseEvents >= 15) return 'complex';
  if (eventCount >= 25 || trace.counts.toolUseEvents >= 5) return 'moderate';
  return 'basic';
}

function requiredTools(events: SanitizedTraceEvent[]): string[] {
  return Array.from(new Set(events
    .filter((event) => event.type === 'tool_use' || event.type === 'tool_call')
    .map((event) => event.label.replace(/^Tool (?:call|card):\s*/i, '').trim())
    .filter(Boolean)))
    .slice(0, 50);
}

function buildAssertions(evidence: SanitizedEvidence[], outcome: string): SpaceEvaluationCase['expected']['assertions'] {
  const verification = evidence.filter((item) => item.kind === 'check_result');
  const assertions = verification.map((item, index) => ({
    id: `assertion_${index + 1}`,
    description: item.summary || `Satisfy verification evidence ${item.evidenceKey}.`,
    source: 'check_evidence' as const,
    evidenceRefs: [item.evidenceKey],
    required: true,
  }));
  if (assertions.length > 0) return assertions;
  return [{
    id: 'assertion_outcome_review',
    description: outcome || 'A reviewer must define the expected outcome.',
    source: outcome ? 'trace_outcome' : 'manual',
    evidenceRefs: [],
    required: true,
  }];
}

function sanitizeRisk(trace: RawTrace, stats: EvaluationRedactionStats): RawTrace['risk'] {
  return {
    ...trace.risk,
    reasons: trace.risk.reasons.map((reason) => cleanCompact(reason, stats)),
  };
}

export function preprocessSpaceSession(summary: KodaXSessionSummary, full: KodaXFullSession): SpaceEvaluationPreprocessResult {
  const stats = emptyEvaluationRedactionStats();
  const bundle = normalizeKodaXSession(summary, full);
  const traceKey = `space_trace_${hash({ id: full.id, projectKey: full.projectKey })}`;
  const revisionKey = `space_revision_${hash({ traceKey, sourceHash: bundle.revision.sourceHash })}`;
  const projectGroupKey = `space_scope_${hash(summary.projectKey ?? full.projectKey ?? full.gitRoot ?? 'unknown')}`;
  const events = sanitizeEvents(traceKey, bundle.events, stats);
  const evidence = sanitizeEvidence(traceKey, bundle.evidence, stats);
  const runtime = safeRuntime(full, bundle.trace, stats);
  const conversation = full.transcriptEntries
    .filter((entry) => entry.active && entry.type === 'message')
    .map((entry) => {
      const role = entry.message.role;
      if (role !== 'user' && role !== 'assistant' && role !== 'system') return undefined;
      const content = messageText(entry.message, stats);
      return content ? {
        entryKey: entryKey(traceKey, entry.entryId),
        role,
        occurredAt: entry.timestamp,
        content,
      } : undefined;
    })
    .filter((item): item is SpaceEvaluationTrace['conversation'][number] => Boolean(item));
  const transcript: SpaceEvaluationTrace['transcript'] = full.transcriptEntries.map((entry) => ({
    entryKey: entryKey(traceKey, entry.entryId),
    parentEntryKey: entry.parentId ? entryKey(traceKey, entry.parentId) : undefined,
    occurredAt: entry.timestamp,
    type: entry.type,
    role: entry.message.role === 'user' || entry.message.role === 'assistant' || entry.message.role === 'system'
      ? entry.message.role as 'user' | 'assistant' | 'system'
      : undefined,
    active: entry.active,
    content: sanitizeStructured(entry.message, stats) ?? {},
  }));
  const capturedTask = conversation.find((item) => item.role === 'user')?.content ?? '';
  const capturedOutcome = [...conversation].reverse().find((item) => item.role === 'assistant')?.content ?? '';
  const task = capturedTask.replace(/\[(?:tool_use|tool_result)[^\]]*\]/gi, '').trim() ? capturedTask : '';
  const outcome = capturedOutcome.replace(/\[(?:tool_use|tool_result)[^\]]*\]/gi, '').trim() ? capturedOutcome : '';
  const samples = generateTrainingSamples(bundle.trace, bundle.events, bundle.evidence, []);
  const primarySample = samples[0];
  if (!primarySample) throw new Error('Session could not produce a primary evaluation sample.');
  const cleanTrace = cleanTraceFromRawTrace({
    trace: bundle.trace,
    events: bundle.events,
    evidence: bundle.evidence,
    errors: [],
    sample: primarySample,
  });
  const evaluationEvidenceCoverage: CleanTraceEvidenceCoverageStatus = bundle.trace.counts.toolUseEvents === 0
    ? 'not_required'
    : evidence.length === 0
      ? 'missing'
      : evidence.length < bundle.trace.counts.toolUseEvents
        ? 'partial'
        : 'complete';
  const fingerprint = createHash('sha256')
    .update(JSON.stringify({ task, outcome, tools: requiredTools(events), projectGroupKey }))
    .digest('hex');
  const qualityGate = buildQualityGate({
    trace: bundle.trace,
    full,
    task,
    outcome,
    runtime,
    eventCount: events.length,
    activeEventCount: events.filter((event) => event.active).length,
    evidence,
    coverage: evaluationEvidenceCoverage,
    redactions: stats,
    fingerprint,
  });
  const safeTask = task;
  const safeOutcome = outcome;
  const safeEvents = events;
  const verificationEvidence = evidence.filter((item) => item.kind === 'check_result');
  const artifactEvidence = evidence.filter((item) => item.kind === 'file_created' || item.kind === 'file_modified' || item.kind === 'check_result');
  const assertions = buildAssertions(evidence, safeOutcome);
  const tools = requiredTools(events);
  const caseType = taskType(bundle.trace, evidence);
  const capabilityTags = Array.from(new Set([
    runtime.surface,
    caseType,
    bundle.trace.status,
    tools.length > 0 ? 'tool_use' : 'no_tools',
    verificationEvidence.length > 0 ? 'explicit_verification' : 'manual_oracle_required',
    evaluationEvidenceCoverage,
  ]));

  const evaluationTrace: SpaceEvaluationTrace = {
    schema: SPACE_EVALUATION_TRACE_SCHEMA,
    traceKey,
    revisionKey,
    projectGroupKey,
    sourceFingerprint: hash(bundle.revision.sourceHash, 32),
    title: cleanCompact(full.title, stats) || 'Untitled session',
    createdAt: full.createdAt,
    taskStatus: bundle.trace.status,
    runtime,
    sessionTopology: {
      role: 'main',
      linkStatus: 'root',
      linkMethod: 'root',
      childTraceKeys: [],
      candidateParentTraceKeys: [],
      requiresReview: false,
    },
    lineage: {
      version: 1,
      activeEntryKey: full.lineage?.activeEntryId ? entryKey(traceKey, full.lineage.activeEntryId) : undefined,
      entries: full.transcriptEntries.map((entry) => ({
        entryKey: entryKey(traceKey, entry.entryId),
        parentEntryKey: entry.parentId ? entryKey(traceKey, entry.parentId) : undefined,
        occurredAt: entry.timestamp,
        type: entry.type,
        active: entry.active,
      })),
    },
    transcript,
    counts: {
      messages: conversation.length,
      events: events.length,
      activeEvents: events.filter((event) => event.active).length,
      toolUseEvents: bundle.trace.counts.toolUseEvents,
      toolResultEvents: bundle.trace.counts.toolResultEvents,
      evidence: evidence.length,
      verificationEvidence: verificationEvidence.length,
      compactions: bundle.trace.counts.compactions,
      branchSummaries: bundle.trace.counts.branchSummaries,
      malformedRecords: full.malformedCount,
    },
    risk: sanitizeRisk(bundle.trace, stats),
    conversation,
    events: safeEvents,
    evidence,
    workflow: buildWorkflow(safeEvents, evidence, safeOutcome),
    privacy: {
      handling: 'field_level_masking',
      contentPreserved: true,
      sensitiveValuesMasked: stats.total,
      privateReasoningBlocksOmitted: stats.thinkingBlocksRemoved,
    },
    preprocessing: {
      policyVersion: SPACE_EVALUATION_POLICY_VERSION,
      cleaningPolicyVersion: 'kodax-clean-text-v1',
      redactions: stats,
      cleanSummary: {
        task: cleanCompact(cleanTrace.summary.userGoal, stats),
        outcome: cleanCompact(cleanTrace.summary.assistantOutcome, stats),
        execution: cleanCompact(cleanTrace.summary.execution, stats),
        evidence: cleanCompact(cleanTrace.summary.evidence, stats),
        governance: cleanCompact(cleanTrace.summary.governance, stats),
      },
      evidenceCoverage: {
        status: evaluationEvidenceCoverage,
        linkedEvidenceCount: evidence.length,
        toolEventCount: bundle.trace.counts.toolUseEvents,
        evidenceGapCount: Math.max(0, bundle.trace.counts.toolUseEvents - evidence.length),
        notes: [
          evaluationEvidenceCoverage === 'not_required'
            ? 'No tool call requires evidence coverage.'
            : evaluationEvidenceCoverage === 'missing'
              ? 'Tool calls exist, but no linked evidence was captured.'
              : evaluationEvidenceCoverage === 'partial'
                ? 'Only part of the tool-call trajectory is covered by evidence.'
                : 'Tool calls are covered by linked evidence.',
          ...bundle.trace.risk.reasons.slice(0, 2),
        ].map((note) => cleanCompact(note, stats)),
      },
      metrics: {
        eventCount: cleanTrace.metrics.eventCount,
        toolEventCount: cleanTrace.metrics.toolEventCount,
        evidenceCount: cleanTrace.metrics.evidenceCount,
        compressionRatio: cleanTrace.cleaning.compressionRatio,
      },
    },
    qualityGate,
    exportPayload: 'full_sanitized_trace',
  };

  const evidenceRefs = evidence.map((item) => item.evidenceKey);
  const evaluationCase: SpaceEvaluationCase = {
    schema: SPACE_EVALUATION_CASE_SCHEMA,
    caseKey: `space_case_${hash({ traceKey, fingerprint })}`,
    sourceTraceKey: traceKey,
    projectGroupKey,
    contentFingerprint: fingerprint,
    usage: 'update_evidence',
    title: evaluationTrace.title,
    taskType: caseType,
    difficulty: difficulty(bundle.trace, events.length),
    capabilityTags,
    input: {
      task: safeTask,
      systemContext: conversation.filter((item) => item.role === 'system').map((item) => item.content),
      runtime,
      requiredTools: tools,
      traceRef: traceKey,
    },
    expected: {
      outcome: safeOutcome,
      artifactRefs: artifactEvidence.map((item) => item.evidenceKey),
      evidenceRefs,
      assertions,
    },
    grader: {
      kind: verificationEvidence.length > 0 ? 'trace_signal' : 'manual',
      version: verificationEvidence.length > 0 ? 'space-trace-grader-v1' : 'manual-rubric-v1',
      config: {
        successCriteria: [
          safeOutcome ? 'The final outcome satisfies the captured task intent.' : 'A reviewer defines the expected outcome.',
          verificationEvidence.length > 0 ? 'All required check_result assertions pass.' : 'A reviewer validates observable task completion.',
          'No critical regression, unsafe action, or unresolved tool failure is introduced.',
        ],
        failureSignals: [
          'Required artifact or verification evidence is missing.',
          'The final outcome contradicts the task or captured evidence.',
          'The run ends with an unresolved error or incomplete tool chain.',
        ],
        evidenceRefs: verificationEvidence.map((item) => item.evidenceKey),
      },
    },
    replay: {
      mode: runtime.attribution === 'complete' && tools.length === 0 ? 'automatic' : tools.length > 0 ? 'assisted' : 'manual',
      eventRefs: safeEvents.filter((event) => event.active).map((event) => event.eventKey),
      environmentSnapshotAvailable: false,
      notes: [
        'The package preserves a sanitized event graph, but does not copy the enterprise workspace.',
        'TraceOps v0.2.0 must provide or reconstruct the evaluation environment before execution.',
      ],
    },
    benchmarkPromotion: {
      validationEligible: qualityGate.decision === 'eval_ready',
      independentHoldoutRequired: true,
      freezeBeforeHarnessChange: true,
      reasons: qualityGate.decision === 'eval_ready'
        ? ['The case passed automatic preprocessing gates and may be reserved as a holdout before Harness changes.']
        : qualityGate.reviewReasons,
    },
    qualityGate,
  };

  return { trace: evaluationTrace, evaluationCase, redactions: stats };
}

export function applyPackageDeduplication(traces: SpaceEvaluationTrace[], cases: SpaceEvaluationCase[]): number {
  const seen = new Map<string, string>();
  let duplicates = 0;
  for (const evaluationCase of cases) {
    const originalCaseKey = seen.get(evaluationCase.contentFingerprint);
    if (!originalCaseKey) {
      seen.set(evaluationCase.contentFingerprint, evaluationCase.caseKey);
      continue;
    }
    duplicates += 1;
    const duplicateCheck = evaluationCase.qualityGate.checks.find((item) => item.id === 'package_deduplication');
    if (duplicateCheck) {
      duplicateCheck.status = 'warn';
      duplicateCheck.requiresReview = true;
      duplicateCheck.message = `Duplicate content fingerprint matches ${originalCaseKey}.`;
      duplicateCheck.evidenceRefs = [originalCaseKey];
    }
    if (evaluationCase.qualityGate.decision === 'eval_ready') evaluationCase.qualityGate.decision = 'needs_review';
    evaluationCase.qualityGate.humanReviewRequired = true;
    evaluationCase.qualityGate.score = Math.max(0, evaluationCase.qualityGate.score - 8);
    evaluationCase.qualityGate.reviewReasons.push(`Duplicate content fingerprint matches ${originalCaseKey}.`);
    evaluationCase.benchmarkPromotion.validationEligible = false;
    evaluationCase.benchmarkPromotion.reasons.push('Duplicate cases cannot enter the validation holdout without review.');
    const trace = traces.find((item) => item.traceKey === evaluationCase.sourceTraceKey);
    if (trace) trace.qualityGate = evaluationCase.qualityGate;
  }
  return duplicates;
}
