import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { after, test } from 'node:test';

import type { DatasetTrainingRunRecord, SourceStatus, TraceOpsTaskRecord } from '../../../packages/trace-core/src/types';

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
