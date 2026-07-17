import { createHash } from 'node:crypto';

import type {
  AgentBenchmarkCase,
  AgentEvaluationComparisonReport,
  AgentEvaluationExperiment,
  AgentEvaluationMetricDefinition,
  AgentEvaluationMetricSummary,
  AgentEvaluationRollout,
} from '../../trace-core/src/types';

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

export function evaluationHash(value: unknown): string {
  return `sha256:${createHash('sha256').update(stable(value)).digest('hex')}`;
}

export const defaultAgentEvaluationMetrics: AgentEvaluationMetricDefinition[] = [
  {
    id: 'task_success',
    label: 'Task success',
    unit: 'percent',
    direction: 'increase',
    aggregation: 'rate',
    role: 'primary',
    targetDelta: 0.05,
  },
  {
    id: 'artifact_verified',
    label: 'Artifact verified',
    unit: 'percent',
    direction: 'increase',
    aggregation: 'rate',
    role: 'diagnostic',
  },
  {
    id: 'evidence_complete',
    label: 'Evidence complete',
    unit: 'percent',
    direction: 'increase',
    aggregation: 'rate',
    role: 'diagnostic',
  },
  {
    id: 'runtime_error',
    label: 'Runtime errors',
    unit: 'count',
    direction: 'decrease',
    aggregation: 'sum',
    role: 'guardrail',
  },
  {
    id: 'token_usage',
    label: 'Token usage',
    unit: 'tokens',
    direction: 'decrease',
    aggregation: 'mean',
    role: 'guardrail',
    maxDelta: 0,
  },
  {
    id: 'latency_ms',
    label: 'Latency',
    unit: 'ms',
    direction: 'decrease',
    aggregation: 'mean',
    role: 'diagnostic',
  },
  {
    id: 'tool_call_count',
    label: 'Tool calls',
    unit: 'count',
    direction: 'decrease',
    aggregation: 'mean',
    role: 'diagnostic',
  },
];

function valuesForMetric(rollouts: AgentEvaluationRollout[], metricId: string): number[] {
  if (metricId === 'task_success') {
    return rollouts.map((rollout) => rollout.status === 'passed' ? 1 : 0);
  }
  return rollouts.flatMap((rollout) => rollout.metrics
    .filter((metric) => metric.metricId === metricId)
    .map((metric) => metric.value));
}

function summarize(
  rollouts: AgentEvaluationRollout[],
  definitions: AgentEvaluationMetricDefinition[],
): AgentEvaluationMetricSummary[] {
  return definitions.map((definition) => {
    const values = valuesForMetric(rollouts, definition.id);
    const total = values.reduce((sum, value) => sum + value, 0);
    return {
      metricId: definition.id,
      value: definition.aggregation === 'sum' ? total : values.length > 0 ? total / values.length : 0,
      samples: values.length,
    };
  });
}

function metricPass(
  definition: AgentEvaluationMetricDefinition,
  baseline: number,
  candidate: number,
): { passed: boolean; reason: string } {
  const delta = candidate - baseline;
  if (definition.maxCandidateValue !== undefined && candidate > definition.maxCandidateValue) {
    return { passed: false, reason: `${definition.label} exceeded the maximum candidate value.` };
  }
  if (definition.maxDelta !== undefined && delta > definition.maxDelta) {
    return { passed: false, reason: `${definition.label} increased by ${delta.toFixed(4)}, above the allowed delta.` };
  }
  if (definition.role === 'primary') {
    const target = definition.targetDelta ?? 0;
    const passed = definition.direction === 'increase' ? delta >= target : delta <= -target;
    return {
      passed,
      reason: passed
        ? `${definition.label} met its predeclared target.`
        : `${definition.label} did not meet the required delta of ${target}.`,
    };
  }
  if (definition.role === 'guardrail') {
    const passed = definition.direction === 'increase' ? candidate >= baseline : candidate <= baseline;
    return {
      passed,
      reason: passed ? `${definition.label} stayed within its guardrail.` : `${definition.label} regressed.`,
    };
  }
  return { passed: true, reason: `${definition.label} is diagnostic only.` };
}

function caseOutcome(rollouts: AgentEvaluationRollout[]): 'passed' | 'failed' | undefined {
  if (rollouts.length === 0) return undefined;
  const passed = rollouts.filter((rollout) => rollout.status === 'passed').length;
  return passed > rollouts.length / 2 ? 'passed' : 'failed';
}

export function compareAgentEvaluation(input: {
  experiment: AgentEvaluationExperiment;
  cases: AgentBenchmarkCase[];
  rollouts: AgentEvaluationRollout[];
  createdAt?: string;
}): AgentEvaluationComparisonReport {
  const baselineRollouts = input.rollouts.filter((rollout) => rollout.arm === 'baseline');
  const candidateRollouts = input.rollouts.filter((rollout) => rollout.arm === 'candidate');
  const baselineSummary = summarize(baselineRollouts, input.experiment.metrics);
  const candidateSummary = summarize(candidateRollouts, input.experiment.metrics);
  const deltas = input.experiment.metrics.map((definition) => {
    const baseline = baselineSummary.find((metric) => metric.metricId === definition.id)?.value ?? 0;
    const candidate = candidateSummary.find((metric) => metric.metricId === definition.id)?.value ?? 0;
    const result = metricPass(definition, baseline, candidate);
    return {
      metricId: definition.id,
      baseline,
      candidate,
      delta: candidate - baseline,
      passed: result.passed,
      reason: result.reason,
    };
  });

  const churn = {
    passToPass: 0,
    failToPass: 0,
    passToFail: 0,
    failToFail: 0,
    criticalRegressions: 0,
  };
  for (const benchmarkCase of input.cases) {
    const baseline = caseOutcome(baselineRollouts.filter((rollout) => rollout.caseId === benchmarkCase.id));
    const candidate = caseOutcome(candidateRollouts.filter((rollout) => rollout.caseId === benchmarkCase.id));
    if (!baseline || !candidate) continue;
    if (baseline === 'passed' && candidate === 'passed') churn.passToPass += 1;
    if (baseline === 'failed' && candidate === 'passed') churn.failToPass += 1;
    if (baseline === 'passed' && candidate === 'failed') {
      churn.passToFail += 1;
      if (benchmarkCase.critical) churn.criticalRegressions += 1;
    }
    if (baseline === 'failed' && candidate === 'failed') churn.failToFail += 1;
  }

  const reasons: string[] = [];
  const primary = deltas.filter((delta) => input.experiment.metrics.find((item) => item.id === delta.metricId)?.role === 'primary');
  const guardrails = deltas.filter((delta) => input.experiment.metrics.find((item) => item.id === delta.metricId)?.role === 'guardrail');
  const missingArm = baselineRollouts.length === 0 || candidateRollouts.length === 0;
  let verdict: AgentEvaluationComparisonReport['verdict'] = 'inconclusive';
  if (missingArm) {
    reasons.push('Both baseline and candidate rollouts are required.');
  } else if (churn.criticalRegressions > 0) {
    verdict = 'regressed';
    reasons.push(`${churn.criticalRegressions} critical validation case(s) regressed.`);
  } else if (guardrails.some((guardrail) => !guardrail.passed)) {
    verdict = 'regressed';
    reasons.push('One or more predeclared guardrails failed.');
  } else if (primary.length > 0 && primary.every((metric) => metric.passed)) {
    verdict = 'improved';
    reasons.push('All primary metrics met their predeclared targets.');
  } else {
    reasons.push('The candidate did not meet every primary target.');
  }
  if (churn.passToFail > 0) reasons.push(`${churn.passToFail} validation case(s) moved from pass to fail.`);
  if (churn.failToPass > 0) reasons.push(`${churn.failToPass} validation case(s) moved from fail to pass.`);

  const createdAt = input.createdAt ?? new Date().toISOString();
  const reportBody = {
    experimentId: input.experiment.id,
    verdict,
    baselineSummary,
    candidateSummary,
    deltas,
    churn,
    reasons,
    createdAt,
  };
  return {
    id: `agent_eval_report_${evaluationHash(reportBody).slice(7, 23)}`,
    ...reportBody,
    recommendation: verdict === 'improved'
      ? 'Retain the candidate Harness for broader generalization and regression evaluation.'
      : verdict === 'regressed'
        ? 'Reject or revise the candidate Harness before another targeted validation run.'
        : 'Collect more paired evidence or revise the candidate before making a promotion decision.',
    reportHash: evaluationHash(reportBody),
  };
}
