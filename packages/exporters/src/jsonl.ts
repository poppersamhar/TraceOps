import type { DatasetExportFormat, TrainingSample, TrainingSampleStatus } from '../../trace-core/src/types';

export interface DatasetExportResult {
  body: string;
  filename: string;
  contentType: string;
  format: DatasetExportFormat;
  generatedAt: string;
  exported: number;
  skipped: number;
  exportedSampleIds: string[];
  totals: Record<TrainingSampleStatus, number>;
}

const contentType = 'application/x-ndjson; charset=utf-8';

function filenameSafe(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'dataset';
}

function line(value: unknown): string {
  return JSON.stringify(value);
}

function totalsFor(samples: TrainingSample[]): Record<TrainingSampleStatus, number> {
  return {
    candidate: samples.filter((sample) => sample.status === 'candidate').length,
    needs_review: samples.filter((sample) => sample.status === 'needs_review').length,
    blocked: samples.filter((sample) => sample.status === 'blocked').length,
  };
}

function traceOpsRecord(sample: TrainingSample) {
  return {
    id: sample.id,
    traceId: sample.traceId,
    revisionId: sample.revisionId,
    source: sample.source,
    sourceSessionId: sample.sourceSessionId,
    projectKey: sample.projectKey,
    title: sample.title,
    kind: sample.kind,
    status: sample.status,
    riskLevel: sample.riskLevel,
    quality: sample.quality,
    blockers: sample.blockers,
    labels: sample.labels ?? [],
    input: sample.input,
    output: sample.output,
    metrics: {
      toolEventCount: sample.toolEventCount,
      evidenceCount: sample.evidenceCount,
      eventCount: sample.eventCount,
    },
    metadata: sample.metadata,
    builder: sample.metadata.datasetBuilder,
    timestamps: {
      createdAt: sample.createdAt,
      updatedAt: sample.updatedAt,
    },
  };
}

function reviewRecord(sample: TrainingSample) {
  return {
    id: sample.id,
    traceId: sample.traceId,
    sourceSessionId: sample.sourceSessionId,
    projectKey: sample.projectKey,
    title: sample.title,
    kind: sample.kind,
    status: sample.status,
    riskLevel: sample.riskLevel,
    quality: sample.quality,
    blockers: sample.blockers,
    labels: sample.labels ?? [],
    prompt: sample.input.cleanUserGoal ?? sample.input.userGoal ?? sample.promptPreview,
    rawPrompt: sample.input.userGoal,
    assistantOutcome: sample.output.cleanAssistantOutcome ?? sample.output.assistantOutcome ?? sample.responsePreview,
    rawAssistantOutcome: sample.output.assistantOutcome,
    toolEventIds: sample.input.toolEventIds,
    evidenceIds: sample.input.evidenceIds,
    distillation: sample.metadata.distillation,
    reviewerDecision: {
      approved: false,
      reason: '',
      decidedBy: '',
      decidedAt: '',
    },
  };
}

function fineTuneRecord(sample: TrainingSample) {
  return {
    messages: [
      {
        role: 'system',
        content: 'You are KodaX, an enterprise software agent. Solve the user goal using safe, auditable engineering workflow.',
      },
      {
        role: 'user',
        content: sample.input.cleanUserGoal ?? sample.promptPreview,
      },
      {
        role: 'assistant',
        content: sample.output.cleanAssistantOutcome ?? sample.responsePreview,
      },
    ],
  };
}

function evalRecord(sample: TrainingSample) {
  return {
    id: sample.id,
    input: sample.input.cleanUserGoal ?? sample.promptPreview,
    expected: sample.output.cleanAssistantOutcome ?? sample.responsePreview,
    tags: [sample.kind, sample.status, sample.riskLevel, sample.projectKey].filter(Boolean),
    metadata: {
      traceId: sample.traceId,
      sourceSessionId: sample.sourceSessionId,
      toolEventCount: sample.toolEventCount,
      evidenceCount: sample.evidenceCount,
      blockers: sample.blockers,
      labels: sample.labels ?? [],
      quality: sample.quality,
      distillation: sample.metadata.distillation,
    },
  };
}

function repairIssues(sample: TrainingSample): string[] {
  const text = [
    ...sample.blockers,
    ...sample.metadata.riskReasons,
    ...sample.quality.signals.map((signal) => `${signal.label} ${signal.detail}`),
  ].join(' ').toLowerCase();
  const issues = new Set<string>();
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
  return Array.from(issues);
}

function repairActions(sample: TrainingSample, issues: string[]): string[] {
  const actions = new Set<string>();
  if (
    issues.includes('credential_signal')
    || issues.includes('l4_governance_lock')
    || issues.includes('blocked_status')
    || issues.includes('quality_blocked')
  ) {
    actions.add('quarantine_raw_trace');
    actions.add('remove_from_training_pool');
  }
  if (issues.includes('local_path_signal') || issues.includes('source_mutation_signal') || issues.includes('enterprise_data_signal')) {
    actions.add('replace_sensitive_detail_with_summary');
    actions.add('require_human_governance_signoff');
  }
  if (issues.includes('missing_evidence')) actions.add('relink_artifact_ledger_or_mark_evidence_gap');
  if (issues.includes('clean_text_not_ready') || issues.includes('thin_outcome')) actions.add('rewrite_clean_prompt_and_outcome_summary');
  if (sample.kind !== 'sft') actions.add('keep_as_review_or_eval_asset_until_schema_verified');
  if (actions.size === 0) actions.add('manual_review');
  return Array.from(actions);
}

function repairRecord(sample: TrainingSample) {
  const issues = repairIssues(sample);
  return {
    id: `repair_${sample.id}`,
    sampleId: sample.id,
    traceId: sample.traceId,
    revisionId: sample.revisionId,
    title: sample.title,
    kind: sample.kind,
    status: sample.status,
    riskLevel: sample.riskLevel,
    quality: sample.quality,
    issues,
    recommendedActions: repairActions(sample, issues),
    blockers: sample.blockers,
    labels: sample.labels ?? [],
    cleanPrompt: sample.input.cleanUserGoal ?? sample.promptPreview,
    rawPrompt: sample.input.userGoal,
    cleanAssistantOutcome: sample.output.cleanAssistantOutcome ?? sample.responsePreview,
    rawAssistantOutcome: sample.output.assistantOutcome,
    toolEventIds: sample.input.toolEventIds,
    evidenceIds: sample.input.evidenceIds,
    sourceEventIds: sample.input.sourceEventIds ?? [],
    distillation: sample.metadata.distillation,
    governance: {
      canAutoPromote: false,
      requiresHumanApproval: sample.riskLevel === 'L3' || sample.riskLevel === 'L4' || sample.blockers.length > 0,
      reviewerDecision: sample.review?.decision,
      reviewer: sample.review?.reviewer,
    },
  };
}

function exportableSamples(samples: TrainingSample[], format: DatasetExportFormat): TrainingSample[] {
  if (format !== 'fine_tune_jsonl') return samples;
  return samples.filter((sample) =>
    sample.status === 'candidate'
    && sample.trainable
    && sample.metadata.distillation.readyForFineTune
    && !!sample.input.cleanUserGoal
    && !!sample.output.cleanAssistantOutcome
  );
}

export function exportTrainingSamples(samples: TrainingSample[], format: DatasetExportFormat): DatasetExportResult {
  const generatedAt = new Date().toISOString();
  const exportable = exportableSamples(samples, format);
  const mapper = {
    traceops_jsonl: traceOpsRecord,
    fine_tune_jsonl: fineTuneRecord,
    review_jsonl: reviewRecord,
    eval_jsonl: evalRecord,
    repair_jsonl: repairRecord,
  } satisfies Record<DatasetExportFormat, (sample: TrainingSample) => unknown>;

  const body = exportable.map((sample) => line(mapper[format](sample))).join('\n');
  const suffix = generatedAt.slice(0, 19).replace(/[:T]/g, '-');
  return {
    body: body ? `${body}\n` : '',
    filename: filenameSafe(`traceops-kodax-${format}-${suffix}.jsonl`),
    contentType,
    format,
    generatedAt,
    exported: exportable.length,
    skipped: samples.length - exportable.length,
    exportedSampleIds: exportable.map((sample) => sample.id),
    totals: totalsFor(samples),
  };
}

export function normalizeDatasetExportFormat(value: unknown): DatasetExportFormat {
  if (
    value === 'traceops_jsonl'
    || value === 'fine_tune_jsonl'
    || value === 'review_jsonl'
    || value === 'eval_jsonl'
    || value === 'repair_jsonl'
  ) {
    return value;
  }
  return 'traceops_jsonl';
}
