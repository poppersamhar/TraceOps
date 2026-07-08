import type {
  CleanTrace,
  CleanTraceEventSummary,
  CleanTraceStatus,
  IngestError,
  RawEvidence,
  RawTrace,
  RawTraceEvent,
  RawTraceEventType,
  TrainingSample,
  TrainingTextRedaction,
} from '../../trace-core/src/types';
import { distillTrainingText } from '../../governance/src/redaction';

function statusForSample(sample: TrainingSample): CleanTraceStatus {
  if (sample.status === 'blocked' || sample.quality.grade === 'blocked') return 'blocked';
  if (sample.metadata.distillation.readyForFineTune && sample.blockers.length === 0) return 'ready';
  return 'needs_review';
}

function compact(value: string | undefined, fallback: string, max = 420): string {
  const text = (value ?? fallback).replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

function toolEventTypes(): Set<RawTraceEventType> {
  return new Set(['tool_call', 'tool_use', 'tool_result', 'trace_span']);
}

function isLowSignalRuntimeEvent(event: RawTraceEvent): boolean {
  if (event.type !== 'runtime_event') return false;
  return /session updated|heartbeat|progress|delta/i.test(`${event.label} ${event.preview}`);
}

function cleanEventSummaries(events: RawTraceEvent[]): {
  kept: CleanTraceEventSummary[];
  droppedCount: number;
  removedEventTypes: Partial<Record<RawTraceEventType, number>>;
} {
  const kept: CleanTraceEventSummary[] = [];
  const removedEventTypes: Partial<Record<RawTraceEventType, number>> = {};

  for (const event of events) {
    const drop = event.active === false || isLowSignalRuntimeEvent(event);
    if (drop) {
      removedEventTypes[event.type] = (removedEventTypes[event.type] ?? 0) + 1;
      continue;
    }
    kept.push({
      eventId: event.id,
      occurredAt: event.occurredAt,
      type: event.type,
      label: event.label,
      preview: compact(event.preview, event.label, 220),
      active: event.active,
      riskLevel: event.riskLevel,
    });
  }

  return {
    kept: kept.slice(0, 16),
    droppedCount: events.length - kept.length,
    removedEventTypes,
  };
}

function mergeRedactions(items: TrainingTextRedaction[]): TrainingTextRedaction[] {
  const byType = new Map<string, TrainingTextRedaction>();
  for (const item of items) {
    const existing = byType.get(item.type);
    if (existing) existing.count += item.count;
    else byType.set(item.type, { ...item });
  }
  return Array.from(byType.values());
}

function evidenceNotes(input: {
  toolEventCount: number;
  evidenceCount: number;
  errors: IngestError[];
  riskReasons: string[];
}): string[] {
  const notes: string[] = [];
  if (input.toolEventCount === 0) {
    notes.push('No tool chain was detected for this trace.');
  } else if (input.evidenceCount === 0) {
    notes.push('Tool chain exists, but no evidence is linked yet.');
  } else if (input.evidenceCount < input.toolEventCount) {
    notes.push('Some tool activity has evidence, but coverage is partial.');
  } else {
    notes.push('Tool activity is covered by linked evidence.');
  }
  if (input.errors.length > 0) notes.push(`${input.errors.length} ingest or runtime issue(s) need review.`);
  if (input.riskReasons.length > 0) notes.push(input.riskReasons.slice(0, 2).join(' · '));
  return Array.from(new Set(notes)).slice(0, 4);
}

function evidenceCoverageStatus(toolEventCount: number, evidenceCount: number): CleanTrace['evidenceCoverage']['status'] {
  if (toolEventCount === 0) return 'not_required';
  if (evidenceCount === 0) return 'missing';
  if (evidenceCount < toolEventCount) return 'partial';
  return 'complete';
}

function governanceSummary(sample: TrainingSample, errors: IngestError[]): string {
  if (sample.status === 'blocked') return compact(sample.blockers[0], 'Blocked by governance.', 240);
  if (sample.blockers.length > 0) return compact(sample.blockers[0], 'Needs governance review.', 240);
  if (errors.length > 0) return 'Trace has ingest or runtime issues that should be checked before reuse.';
  if (sample.review?.decision === 'approved') return 'Approved by governance review and ready for dataset use.';
  return 'No blocking governance issue detected, but training use still requires review.';
}

export function cleanTraceFromTrainingSample(sample: TrainingSample): CleanTrace {
  const inputDistillation = distillTrainingText(sample.input.userGoal);
  const outputDistillation = distillTrainingText(sample.output.assistantOutcome);
  const redactions = mergeRedactions([
    ...inputDistillation.distillation.redactions,
    ...outputDistillation.distillation.redactions,
  ]);
  return {
    id: `clean_${sample.id}`,
    traceId: sample.traceId,
    revisionId: sample.revisionId,
    sourceSessionId: sample.sourceSessionId,
    projectKey: sample.projectKey,
    title: sample.title,
    kind: sample.kind,
    status: statusForSample(sample),
    candidateStatus: sample.status,
    trainable: sample.trainable,
    riskLevel: sample.riskLevel,
    quality: sample.quality,
    blockers: sample.blockers,
    cleanUserGoal: sample.input.cleanUserGoal,
    cleanAssistantOutcome: sample.output.cleanAssistantOutcome,
    rawUserGoal: sample.input.userGoal,
    rawAssistantOutcome: sample.output.assistantOutcome,
    summary: {
      userGoal: compact(sample.input.cleanUserGoal, sample.input.userGoal ?? 'No user goal captured.'),
      assistantOutcome: compact(sample.output.cleanAssistantOutcome, sample.output.assistantOutcome ?? 'No assistant outcome captured.'),
      execution: `${sample.eventCount} event(s), ${sample.toolEventCount} tool event(s), ${sample.evidenceCount} evidence item(s).`,
      evidence: sample.toolEventCount === 0
        ? 'No tool evidence required for this sample.'
        : sample.evidenceCount > 0
          ? 'Evidence is linked to the tool chain.'
          : 'Tool chain is missing linked evidence.',
      governance: governanceSummary(sample, []),
    },
    cleaning: {
      policyVersion: sample.metadata.distillation.version,
      rawEventCount: sample.eventCount,
      keptEventCount: sample.eventCount,
      droppedEventCount: 0,
      compressionRatio: 1,
      redactions,
      removedEventTypes: {},
    },
    evidenceCoverage: {
      status: evidenceCoverageStatus(sample.toolEventCount, sample.evidenceCount),
      linkedEvidenceCount: sample.evidenceCount,
      toolEventCount: sample.toolEventCount,
      evidenceGapCount: Math.max(0, sample.toolEventCount - sample.evidenceCount),
      notes: evidenceNotes({
        toolEventCount: sample.toolEventCount,
        evidenceCount: sample.evidenceCount,
        errors: [],
        riskReasons: sample.metadata.riskReasons,
      }),
    },
    timelinePreview: [],
    redactionCount: sample.metadata.distillation.redactionCount,
    removedThinking: sample.metadata.distillation.removedThinking,
    readyForFineTune: sample.metadata.distillation.readyForFineTune,
    metrics: {
      toolEventCount: sample.toolEventCount,
      evidenceCount: sample.evidenceCount,
      eventCount: sample.eventCount,
    },
    sourceEventIds: sample.input.sourceEventIds ?? [
      ...sample.input.toolEventIds,
      ...(sample.output.finalEventId ? [sample.output.finalEventId] : []),
    ],
    evidenceIds: sample.input.evidenceIds,
    policies: {
      samplerVersion: sample.metadata.generatedBy,
      cleaningPolicyVersion: sample.metadata.distillation.version,
      redactionPolicyVersion: sample.metadata.distillation.version,
    },
    review: sample.review,
    createdAt: sample.createdAt,
    updatedAt: sample.updatedAt,
  };
}

export function cleanTraceFromRawTrace(input: {
  trace: RawTrace;
  events: RawTraceEvent[];
  evidence: RawEvidence[];
  errors: IngestError[];
  sample: TrainingSample;
}): CleanTrace {
  const base = cleanTraceFromTrainingSample(input.sample);
  const eventSummary = cleanEventSummaries(input.events);
  const toolTypes = toolEventTypes();
  const toolEventCount = input.events.filter((event) => toolTypes.has(event.type)).length;
  const linkedEvidenceCount = input.evidence.length;
  const compressionRatio = input.events.length === 0
    ? 1
    : Math.round((eventSummary.kept.length / input.events.length) * 100) / 100;

  return {
    ...base,
    summary: {
      userGoal: compact(base.cleanUserGoal, input.trace.title),
      assistantOutcome: compact(base.cleanAssistantOutcome, 'No assistant outcome captured.'),
      execution: `${input.events.length} raw event(s) cleaned into ${eventSummary.kept.length} timeline preview item(s).`,
      evidence: linkedEvidenceCount > 0
        ? `${linkedEvidenceCount} evidence item(s) linked from KodaX tools, artifacts, or runtime spans.`
        : toolEventCount > 0
          ? 'Tool activity exists, but evidence still needs to be linked or backfilled.'
          : 'No tool activity requires evidence coverage.',
      governance: governanceSummary(input.sample, input.errors),
    },
    cleaning: {
      ...base.cleaning,
      rawEventCount: input.events.length,
      keptEventCount: eventSummary.kept.length,
      droppedEventCount: eventSummary.droppedCount,
      compressionRatio,
      removedEventTypes: eventSummary.removedEventTypes,
    },
    evidenceCoverage: {
      status: evidenceCoverageStatus(toolEventCount, linkedEvidenceCount),
      linkedEvidenceCount,
      toolEventCount,
      evidenceGapCount: Math.max(0, toolEventCount - linkedEvidenceCount),
      notes: evidenceNotes({
        toolEventCount,
        evidenceCount: linkedEvidenceCount,
        errors: input.errors,
        riskReasons: input.trace.risk.reasons,
      }),
    },
    metrics: {
      ...base.metrics,
      toolEventCount,
      evidenceCount: linkedEvidenceCount,
      eventCount: input.events.length,
    },
    timelinePreview: eventSummary.kept,
  };
}
