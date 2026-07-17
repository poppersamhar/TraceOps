import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, test } from 'node:test';

import type {
  AgentBenchmarkCase,
  AgentEvaluationExperiment,
  AgentEvaluationRollout,
  DatasetTrainingRunRecord,
  SourceStatus,
} from '../../../packages/trace-core/src/types';
import { compareAgentEvaluation, defaultAgentEvaluationMetrics } from '../../../packages/evaluation/src';
import { buildPlatformArchitecture } from './modules/platformArchitecture';

const originalCwd = process.cwd();
const tempDir = await mkdtemp(path.join(os.tmpdir(), 'traceops-store-test-'));
process.chdir(tempDir);

const { TraceOpsStore } = await import('./store');

after(async () => {
  process.chdir(originalCwd);
  await rm(tempDir, { recursive: true, force: true });
});

function sourceStatus(): SourceStatus {
  return {
    id: 'kodax-local',
    type: 'kodax',
    displayName: 'KodaX local sessions',
    enabled: true,
    sessionsDir: path.join(tempDir, 'kodax', 'sessions'),
    exists: true,
    autoWatch: false,
    scope: 'all',
    rawTraceTrainable: false,
  };
}

function testStore() {
  return new TraceOpsStore(sourceStatus());
}

test('governance policy separates viewer, data governance, and training owner permissions', () => {
  const store = testStore();
  const policy = store.getGovernancePolicy();
  const viewer = policy.roles.find((role) => role.role === 'viewer');
  const dataGovernance = policy.roles.find((role) => role.role === 'data_governance');
  const trainingOwner = policy.roles.find((role) => role.role === 'training_owner');

  assert.ok(policy.highImpactActions.includes('dataset.export'));
  assert.ok(policy.highImpactActions.includes('training.provider_status_sync'));
  assert.deepEqual(viewer?.permissions, ['trace.read', 'dataset.read']);
  assert.ok(dataGovernance?.permissions.includes('kodax.feedback_writeback'));
  assert.ok(trainingOwner?.permissions.includes('training.provider_status_sync'));
});

test('KodaX feedback writeback creates package, report, and inbox files', async () => {
  const store = testStore();
  await store.load();
  const result = await store.writeKodaXFeedbackPackage({
    actor: { id: 'test-governance', role: 'data_governance' },
    targetDir: path.join(tempDir, 'kodax-inbox'),
    reason: 'unit test writeback',
  });

  assert.equal(result.record.status, 'written');
  assert.equal(result.record.files.length, 3);
  assert.deepEqual(result.record.files.map((file) => file.kind).sort(), ['inbox', 'package', 'report']);
  assert.equal(store.listKodaXFeedbackWritebacks(1)[0]?.id, result.record.id);
});

test('provider status sync updates training run lifecycle and preserves status history', async () => {
  const store = testStore();
  const run: DatasetTrainingRunRecord = {
    id: 'trainrun_test',
    runVersion: 'traceops-training-run-v1',
    status: 'running',
    qualityGate: 'pending',
    handoffId: 'handoff_test',
    handoffHash: 'sha256:handoff',
    releasePackageId: 'package_test',
    releasePackageHash: 'sha256:package',
    promotionId: 'release_test',
    manifestId: 'manifest_test',
    datasetVersionId: 'dataset_test',
    datasetVersionName: 'Dataset test',
    owner: 'training-owner',
    targetSystem: 'custom-http',
    modelName: 'kodax-agent-test',
    externalRunId: 'external-test',
    defaultFormat: 'fine_tune_jsonl',
    trainingDataUrl: '/training.jsonl',
    reviewDataUrl: '/review.jsonl',
    packageUrl: '/package.json',
    handoffUrl: '/handoff.json',
    providerLaunches: [],
    providerStatusChecks: [],
    metrics: [
      { id: 'validation-score', label: 'Validation score', value: 0, target: 0.8, unit: 'score', gate: 'pending' },
      { id: 'regression-rate', label: 'Regression rate', value: 0, target: 0.03, unit: 'percent', gate: 'pending' },
      { id: 'blocked-issues', label: 'Blocked issues', value: 0, target: 0, unit: 'count', gate: 'pending' },
    ],
    rollbackCriteria: 'Pass all gates.',
    rollbackRequired: false,
    runHash: 'sha256:initial',
    createdAt: '2026-07-08T00:00:00.000Z',
    createdBy: 'test',
    updatedAt: '2026-07-08T00:00:00.000Z',
  };
  (store as unknown as { data: { trainingRuns: DatasetTrainingRunRecord[] } }).data.trainingRuns = [run];

  const updated = await store.recordTrainingProviderStatus({
    runId: run.id,
    provider: 'custom_http',
    providerStatus: 'succeeded',
    validationScore: 0.91,
    regressionRate: 0.01,
    blockedIssueCount: 0,
    checkedBy: 'training-owner',
  });

  assert.equal(updated?.status, 'passed');
  assert.equal(updated?.qualityGate, 'passed');
  assert.equal(updated?.lastProviderStatus, 'succeeded');
  assert.equal(updated?.providerStatusChecks?.[0]?.providerStatus, 'succeeded');
});

test('automation plan marks high-impact queued tasks as approval alerts', async () => {
  const store = testStore();
  await store.createTasks([
    {
      kind: 'storage_maintenance',
      title: 'Create governed storage snapshot',
      priority: 'critical',
      createdBy: 'test',
    },
  ]);
  const plan = await store.getTaskAutomationPlan();
  const task = plan.nodes.find((node) => node.kind === 'storage_maintenance');

  assert.equal(task?.approval.required, true);
  assert.equal(task?.approval.status, 'pending');
  assert.equal(plan.summary.approvalRequired, 1);
  assert.equal(plan.summary.criticalAlerts, 1);
});

test('agent evaluation compares fixed-model Harness snapshots and produces an improved verdict', async () => {
  const store = testStore();
  const baseline = await store.createHarnessSnapshot({
    name: 'KodaX default Harness',
    version: 'h0',
    components: { promptHash: 'sha256:prompt-h0', skillManifestHash: 'sha256:skills-h0' },
    compatibleModels: ['kodax-test-model'],
  });
  const candidate = await store.createHarnessSnapshot({
    name: 'KodaX verification Harness',
    version: 'h1',
    parentId: baseline.id,
    components: { promptHash: 'sha256:prompt-h1', skillManifestHash: 'sha256:skills-h1' },
    compatibleModels: ['kodax-test-model'],
    changeSummary: 'Require verification evidence before completion.',
  });
  const issue = await store.createAgentEvaluationIssue({
    title: 'Code changes finish without verification',
    category: 'verification',
    primaryMetricId: 'task_success',
  });
  const validationCase = await store.createAgentBenchmarkCase({
    title: 'Modify API schema and run verification',
    usage: 'validation',
    taskType: 'code-change',
    critical: true,
  });
  const suite = await store.createAgentBenchmarkSuite({
    name: 'Verification validation v1',
    issueId: issue.id,
    caseIds: [validationCase.id],
    freeze: true,
  });
  const experiment = await store.createAgentEvaluationExperiment({
    issueId: issue.id,
    benchmarkSuiteId: suite.id,
    modelSnapshot: { provider: 'test', model: 'kodax-test-model' },
    baselineHarnessId: baseline.id,
    candidateHarnessId: candidate.id,
  });
  await store.startAgentEvaluationExperiment(experiment.id);
  await store.recordAgentEvaluationRollout(experiment.id, {
    arm: 'baseline',
    caseId: validationCase.id,
    status: 'failed',
    metrics: [{ metricId: 'token_usage', value: 1000 }],
  });
  await store.recordAgentEvaluationRollout(experiment.id, {
    arm: 'candidate',
    caseId: validationCase.id,
    status: 'passed',
    metrics: [{ metricId: 'token_usage', value: 980 }],
  });
  const report = await store.completeAgentEvaluationExperiment(experiment.id);

  assert.equal(report?.verdict, 'improved');
  assert.equal(report?.churn.failToPass, 1);
  assert.equal(report?.churn.criticalRegressions, 0);
  assert.ok(report?.reportHash.startsWith('sha256:'));
  assert.equal(store.getAgentEvaluationIssue(issue.id)?.status, 'validated');

  const reloaded = testStore();
  await reloaded.load();
  assert.equal(reloaded.getHarnessSnapshot(candidate.id)?.contentHash, candidate.contentHash);
  assert.equal(reloaded.getAgentEvaluationExperiment(experiment.id)?.status, 'completed');
  assert.equal(reloaded.getAgentEvaluationReport(experiment.id)?.reportHash, report?.reportHash);
});

test('frozen validation suites reject update-evidence leakage', async () => {
  const store = testStore();
  const issue = await store.createAgentEvaluationIssue({ title: 'Context selection issue', category: 'context' });
  const evidenceCase = await store.createAgentBenchmarkCase({
    title: 'Known failure used to create the change',
    usage: 'update_evidence',
  });

  await assert.rejects(
    store.createAgentBenchmarkSuite({
      name: 'Leaky suite',
      issueId: issue.id,
      caseIds: [evidenceCase.id],
      freeze: true,
    }),
    /validation cases/,
  );
});

test('agent evaluation rejects a candidate that breaks a cost guardrail', () => {
  const timestamp = '2026-07-16T00:00:00.000Z';
  const experiment: AgentEvaluationExperiment = {
    id: 'agent_experiment_guardrail',
    issueId: 'agent_issue_guardrail',
    benchmarkSuiteId: 'agent_suite_guardrail',
    modelSnapshot: { provider: 'test', model: 'fixed-model' },
    baselineHarnessId: 'h0',
    candidateHarnessId: 'h1',
    runtimeSnapshotHash: 'sha256:fixed-runtime',
    evaluatorVersion: 'traceops-agent-eval-v1',
    repetitions: 1,
    metrics: defaultAgentEvaluationMetrics,
    status: 'running',
    experimentHash: 'sha256:experiment',
    createdBy: 'test',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const benchmarkCase: AgentBenchmarkCase = {
    id: 'agent_case_guardrail',
    usage: 'validation',
    title: 'Keep an existing capability stable',
    taskType: 'regression',
    scopeTags: [],
    inputRef: 'fixture:guardrail',
    expectedArtifactRefs: [],
    grader: { kind: 'manual', version: 'manual-v1' },
    critical: false,
    riskLevel: 'L1',
    status: 'ready',
    createdBy: 'test',
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const rollout = (arm: AgentEvaluationRollout['arm'], tokenUsage: number): AgentEvaluationRollout => ({
    id: `rollout_${arm}`,
    experimentId: experiment.id,
    arm,
    caseId: benchmarkCase.id,
    repetition: 1,
    status: 'passed',
    metrics: [{ metricId: 'token_usage', value: tokenUsage }],
    evidenceIds: [],
    createdBy: 'test',
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  const report = compareAgentEvaluation({
    experiment,
    cases: [benchmarkCase],
    rollouts: [rollout('baseline', 800), rollout('candidate', 1200)],
    createdAt: timestamp,
  });

  assert.equal(report.verdict, 'regressed');
  assert.equal(report.churn.passToPass, 1);
  assert.equal(report.deltas.find((metric) => metric.metricId === 'token_usage')?.passed, false);
  assert.ok(report.reasons.some((reason) => reason.includes('guardrail')));
});

test('platform architecture separates data, evaluation, and model training domains', () => {
  const store = testStore();
  const architecture = buildPlatformArchitecture(store);

  assert.deepEqual(architecture.areas.map((area) => area.id), ['data_access', 'evaluation', 'model_training']);
  assert.ok(architecture.areas.find((area) => area.id === 'evaluation')?.modules.some((module) => module.id === 'agent_harness_evaluation'));
  assert.ok(architecture.areas.find((area) => area.id === 'evaluation')?.modules.some((module) => module.id === 'model_evaluation'));
  assert.notEqual(architecture.evaluationBoundary.agentEvaluation, architecture.evaluationBoundary.modelEvaluation);
  assert.equal(architecture.sharedFoundation.stageId, 'stage-system');
  assert.equal(architecture.currentVersion, '0.1.0');
  assert.deepEqual(architecture.releases.map((release) => release.version), ['0.1.0', '0.2.0', '0.3.0']);
  assert.equal(architecture.releases.find((release) => release.version === '0.1.0')?.status, 'current');
  assert.deepEqual(architecture.releases.find((release) => release.version === '0.1.0')?.productAreaIds, ['data_access']);
  assert.equal(architecture.areas.find((area) => area.id === 'evaluation')?.introducedIn, '0.2.0');
  assert.equal(architecture.areas.find((area) => area.id === 'model_training')?.introducedIn, '0.3.0');
});
