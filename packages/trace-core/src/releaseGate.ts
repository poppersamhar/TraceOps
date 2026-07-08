import type {
  DatasetExportFormat,
  DatasetReleaseGate,
  DatasetReleaseGateActionRecord,
  DatasetReleaseGateCheck,
  DatasetReleaseGateSeverity,
  DatasetReleaseGateStatus,
  DatasetVersion,
  DatasetVersionDiffReviewRecord,
  DatasetVersionDiffReviewStatus,
  TrainingSample,
} from './types';

interface DatasetReleaseGateOptions {
  hasComparableVersion?: boolean;
  baseVersionName?: string;
  diffReviewStatus?: DatasetVersionDiffReviewStatus;
  diffReview?: DatasetVersionDiffReviewRecord;
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

function sampleKindLabel(kind: string): string {
  switch (kind) {
    case 'sft':
      return 'SFT';
    case 'tool_use':
      return 'Tool-use';
    case 'planning':
      return 'Planning';
    case 'repair':
      return 'Repair';
    case 'preference':
      return 'Preference';
    case 'eval':
      return 'Eval';
    default:
      return kind;
  }
}

function latestActionsByCheck(actions: DatasetReleaseGateActionRecord[]): Map<string, DatasetReleaseGateActionRecord> {
  const latest = new Map<string, DatasetReleaseGateActionRecord>();
  for (const action of actions) {
    const current = latest.get(action.checkId);
    if (!current || action.decidedAt.localeCompare(current.decidedAt) > 0) {
      latest.set(action.checkId, action);
    }
  }
  return latest;
}

function effectiveSeverity(
  severity: DatasetReleaseGateSeverity,
  action?: DatasetReleaseGateActionRecord,
): DatasetReleaseGateSeverity {
  if (!action || action.decision === 'reopened') return severity;
  if (action.decision === 'resolved') return 'pass';
  if (action.decision === 'waived') return severity === 'block' ? 'warn' : 'pass';
  if (action.decision === 'acknowledged') return severity === 'block' ? 'block' : 'pass';
  return severity;
}

function withActions(
  checks: Omit<DatasetReleaseGateCheck, 'effectiveSeverity' | 'action'>[],
  actions: DatasetReleaseGateActionRecord[],
): DatasetReleaseGateCheck[] {
  const latest = latestActionsByCheck(actions);
  return checks.map((check) => {
    const action = check.locked ? undefined : latest.get(check.id);
    return {
      ...check,
      action,
      effectiveSeverity: effectiveSeverity(check.severity, action),
    };
  });
}

export function evaluateDatasetReleaseGate(
  version: DatasetVersion,
  samples: TrainingSample[],
  actions: DatasetReleaseGateActionRecord[] = version.releaseGateActions ?? [],
  options: DatasetReleaseGateOptions = {},
): DatasetReleaseGate {
  const total = samples.length || version.sampleCount;
  const approved = version.reviewSummary?.approved ?? samples.filter((sample) => sample.review?.decision === 'approved').length;
  const rejected = version.reviewSummary?.rejected ?? samples.filter((sample) => sample.review?.decision === 'rejected').length;
  const unreviewed = version.reviewSummary?.unreviewed ?? samples.filter((sample) => !sample.review).length;
  const l4Count = samples.filter((sample) => sample.riskLevel === 'L4').length;
  const l3Count = samples.filter((sample) => sample.riskLevel === 'L3').length;
  const averageQuality = samples.length
    ? Math.round(samples.reduce((sum, sample) => sum + sample.quality.score, 0) / samples.length)
    : version.averageQuality;
  const blockedQuality = samples.filter((sample) => sample.quality.grade === 'blocked').length;
  const notReadyText = samples.filter((sample) => !sample.metadata.distillation.readyForFineTune).length;
  const evidenceRequired = samples.filter((sample) => sample.toolEventCount > 0).length;
  const missingEvidence = samples.filter((sample) => sample.toolEventCount > 0 && sample.evidenceCount === 0).length;
  const kindSet = new Set(samples.map((sample) => sample.kind));
  const expectedKindByFormat: Partial<Record<DatasetExportFormat, string>> = {
    fine_tune_jsonl: 'sft',
    eval_jsonl: 'eval',
  };
  const expectedKind = expectedKindByFormat[version.format];
  const formatMismatch = !!expectedKind && samples.some((sample) => sample.kind !== expectedKind);
  const diffReviewStatus = options.diffReviewStatus ?? 'pending';
  const diffReviewApproved = diffReviewStatus === 'approved' || diffReviewStatus === 'risk_accepted';
  const diffReviewMetric = !options.hasComparableVersion
    ? 'first version'
    : diffReviewStatus === 'risk_accepted'
      ? 'risk accepted'
      : diffReviewStatus.replace(/_/g, ' ');
  const diffReviewDetail = !options.hasComparableVersion
    ? 'No comparable baseline exists yet, so version diff review is not required.'
    : diffReviewApproved
      ? `${options.baseVersionName ?? 'Baseline'} diff was ${diffReviewStatus.replace(/_/g, ' ')}${options.diffReview?.decidedBy ? ` by ${options.diffReview.decidedBy}` : ''}.`
      : diffReviewStatus === 'changes_requested'
        ? 'Diff review requested repairs. Resolve the requested changes before release.'
        : 'Version diff must be approved or risk-accepted before export or release-ready manifesting.';
  const checks = withActions([
    ...(options.hasComparableVersion ? [{
      id: 'diff-review',
      label: 'Diff review',
      metric: diffReviewMetric,
      detail: diffReviewDetail,
      severity: diffReviewApproved ? 'pass' as const : 'block' as const,
      locked: true,
    }] : []),
    {
      id: 'sample-count',
      label: 'Sample volume',
      metric: `${total} samples`,
      detail: total === 0
        ? 'No samples are present in this version.'
        : total < 10
          ? 'Small dataset. Good for smoke testing, not enough for a durable training release.'
          : 'Enough samples for a governed release candidate.',
      severity: total === 0 ? 'block' : total < 10 ? 'warn' : 'pass',
    },
    {
      id: 'snapshot',
      label: 'Immutable snapshot',
      metric: version.snapshotHash ? 'hash locked' : 'live ids',
      detail: version.snapshotHash
        ? 'Version is frozen with a snapshot hash.'
        : 'Version points to live sample ids and can drift as sessions are reprocessed.',
      severity: version.snapshotHash ? 'pass' : 'block',
    },
    {
      id: 'format-kind',
      label: 'Format contract',
      metric: expectedKind ? `${datasetFormatLabel(version.format)} -> ${sampleKindLabel(expectedKind)}` : datasetFormatLabel(version.format),
      detail: formatMismatch
        ? `This export format expects ${sampleKindLabel(expectedKind ?? '')} samples, but the version contains ${Array.from(kindSet).map(sampleKindLabel).join(', ')}.`
        : 'Sample kinds match the selected export format.',
      severity: formatMismatch ? 'block' : 'pass',
    },
    {
      id: 'review',
      label: 'Governance review',
      metric: `${approved} approved`,
      detail: rejected > 0
        ? `${rejected} rejected samples are still included.`
        : unreviewed > 0
          ? `${unreviewed} samples are missing explicit approval.`
          : 'All included samples have governance approval.',
      severity: rejected > 0 || unreviewed > 0 ? 'block' : 'pass',
    },
    {
      id: 'risk',
      label: 'Risk ceiling',
      metric: l4Count > 0 ? `${l4Count} L4` : `${l3Count} L3`,
      detail: l4Count > 0
        ? 'L4 samples must be removed or repaired before release.'
        : l3Count > 0
          ? 'L3 samples require human signoff before external training use.'
          : 'No L3/L4 samples in this version.',
      severity: l4Count > 0 ? 'block' : l3Count > 0 ? 'warn' : 'pass',
    },
    {
      id: 'quality',
      label: 'Quality floor',
      metric: `${averageQuality}/100`,
      detail: blockedQuality > 0
        ? `${blockedQuality} quality-blocked samples are included.`
        : averageQuality < 50
          ? 'Average quality is below the recommended release floor.'
          : 'Average quality clears the release floor.',
      severity: blockedQuality > 0 ? 'block' : averageQuality < 50 ? 'warn' : 'pass',
    },
    {
      id: 'clean-text',
      label: 'Clean text',
      metric: `${total - notReadyText}/${total} ready`,
      detail: notReadyText > 0
        ? `${notReadyText} samples are not ready for clean-text export.`
        : 'All samples have clean text ready for export.',
      severity: notReadyText > 0 && version.format === 'fine_tune_jsonl' ? 'block' : notReadyText > 0 ? 'warn' : 'pass',
    },
    {
      id: 'evidence',
      label: 'Evidence coverage',
      metric: evidenceRequired === 0 ? 'not required' : `${evidenceRequired - missingEvidence}/${evidenceRequired}`,
      detail: missingEvidence > 0
        ? `${missingEvidence} tool-backed samples have no evidence record.`
        : 'Evidence coverage is sufficient for the current sample set.',
      severity: missingEvidence > 0 ? 'warn' : 'pass',
    },
  ], actions);
  const blockCount = checks.filter((check) => check.effectiveSeverity === 'block').length;
  const warnCount = checks.filter((check) => check.effectiveSeverity === 'warn').length;
  const originalBlockCount = checks.filter((check) => check.severity === 'block').length;
  const originalWarnCount = checks.filter((check) => check.severity === 'warn').length;
  const actionedCount = checks.filter((check) => check.action && check.action.decision !== 'reopened').length;
  const status: DatasetReleaseGateStatus = blockCount > 0 ? 'blocked' : warnCount > 0 ? 'review' : 'ready';
  const score = Math.max(0, Math.min(100, 100 - blockCount * 34 - warnCount * 12));
  const recommendation = status === 'ready'
    ? 'This version can be exported as a release candidate.'
    : status === 'blocked'
      ? 'Resolve or waive blocking checks before using this version for model work.'
      : 'Warnings are signed off. This can move forward as a governed release candidate.';
  return {
    status,
    score,
    checks,
    blockCount,
    warnCount,
    passCount: checks.length - blockCount - warnCount,
    originalBlockCount,
    originalWarnCount,
    actionedCount,
    releaseBlocked: status === 'blocked',
    recommendation,
  };
}
